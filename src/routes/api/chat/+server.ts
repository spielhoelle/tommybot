import { ChatOllama } from "@langchain/community/chat_models/ollama"
import { HumanChatMessage, AIChatMessage, SystemChatMessage } from "langchain/schema"
import { CallbackManager } from "langchain/callbacks"
import { error } from '@sveltejs/kit'
const PUBLIC_OLLAMA_BASE_URL = process.env.PUBLIC_OLLAMA_BASE_URL || 'https://ai.tmy.io'

export type MessageBody = { chats: { role: 'user' | 'assistant', content: string }[], model: string }

export const POST = async ({ request }) => {
  try {
    const body: MessageBody = await request.json()
    console.log(body)

    if (!body) throw error(400, 'Missing Data')

    // Create a new readable stream of the chat response
    const readableStream = new ReadableStream({
      async start(controller) {
        const theModel = body.model
        const chat = new ChatOllama({
          model: theModel,
          baseUrl: PUBLIC_OLLAMA_BASE_URL,
          callbackManager: CallbackManager.fromHandlers({
            handleLLMNewToken: async (token: string) => controller.enqueue(token),
          }),
        })

        await chat.call([
          new SystemChatMessage("You are a helpful assistant. Limit prose. Answer with markdown where appropiate."),
          new AIChatMessage("Hello! How can I help you today?"),
          ...body.chats.map(chat => chat.role == "user"
            ? new HumanChatMessage(chat.content)
            : new AIChatMessage(chat.content)
          )
        ])
        controller.close()
      },
    })

    // Create and return a response of the readable stream
    return new Response(readableStream, {
      headers: { 'Content-Type': 'text/plain' },
    })

  } catch (error) {
    console.log('error', error)

    return new Response(JSON.stringify(error), {
      headers: { 'Content-Type': 'text/plain' },
    })
  }
}