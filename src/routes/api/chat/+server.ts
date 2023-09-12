import { Ollama } from "langchain/llms/ollama"
import { CallbackManager } from "langchain/callbacks"
import { error } from '@sveltejs/kit'

export type MessageBody = { chats: { role: "user" | "assistant", content: string }[] }

export const POST = async ({ request }) => {
    const body: MessageBody = await request.json()
    if (!body) throw error(400, 'Missing Data')


    // Create a new readable stream of the chat response
    const readableStream = new ReadableStream({
        async start(controller) {
            const llm = new Ollama({
                model: 'marketing',
                callbackManager: CallbackManager.fromHandlers({
                    handleLLMNewToken: async (token: string) => controller.enqueue(token),
                }),
            })

            const lastChatMessage = body.chats.reverse()[0].content
            const stream = await llm.stream(
                lastChatMessage,
            )

            const chunks = []
            for await (const chunk of stream) {
                chunks.push(chunk)
            }

            controller.close()
        },
    })

    // Create and return a response of the readable stream
    return new Response(readableStream, {
        headers: { 'Content-Type': 'text/plain' },
    })
}



