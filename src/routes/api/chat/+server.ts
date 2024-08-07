import { ChatOllama } from "@langchain/community/chat_models/ollama"
import { HumanChatMessage, AIChatMessage, SystemChatMessage } from "langchain/schema"
import { CallbackManager } from "langchain/callbacks"
import { error } from '@sveltejs/kit'
const PUBLIC_OLLAMA_BASE_URL = process.env.PUBLIC_OLLAMA_BASE_URL || 'https://ai.tmy.io'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export type MessageBody = { chats: { role: 'user' | 'assistant', content: string }[], model: string, sessionId: string }

// async function saveUniqueMessage(content: string, role: string) {
//   try {
//     console.log('Message saved or already exists')
//   } catch (error) {
//     console.error('Error saving message:', error)
//   }
// }
export const POST = async ({ cookies, request, url }) => {

  const sessionCookie = cookies.get('session_id')

  console.time('Saving messages')
  let i = Date.now()
  try {
    const body: MessageBody = await request.json()

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
        console.log('Chat created', Date.now() - i, 'ms')

        const AiMessage = await chat.call([
          new SystemChatMessage("You are a helpful assistant. Limit prose. Answer with markdown where appropiate."),
          new AIChatMessage("Hello! How can I help you today?"),
          ...body.chats.map(chat => chat.role == "user"
            ? new HumanChatMessage(chat.content)
            : new AIChatMessage(chat.content)
          )
        ])

        const searchParams = url.searchParams
        const session = await prisma.session.findFirst({
          where: {
            token: sessionCookie
          },
        })
        if (session != null) {
          const AiMsg = {
            role: 'assistant',
            content: AiMessage.content
          }
          const lastTwoChats = [body.chats[body.chats.length - 1], AiMsg]
          lastTwoChats.forEach(async (chat, index) => {
            const msg = await prisma.message.create({
              data: {
                role: chat.role,
                content: chat.content,
                session: {
                  connect: {
                    id: Number(body.sessionId)
                  }
                }
              }
            })
            console.log('New chatmessage saved', chat.content.slice(0, 30))
          })
        }
        console.timeEnd('Saving AiMessage')
        controller.close()
      },
    })

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