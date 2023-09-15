import { Ollama } from 'langchain/llms/ollama'
import { CallbackManager } from 'langchain/callbacks'
import { PromptTemplate } from 'langchain/prompts'
import { error } from '@sveltejs/kit'

export type MessageBody = { chats: { role: 'user' | 'assistant', content: string }[], model: string }

let promptTemplate = ''
import { roles } from '../../../app.d'

export const POST = async ({ request }) => {
  const body: MessageBody = await request.json()

  if (!body) {
    throw error(400, 'Missing Data')
  }
  const lastChatMessage = body.chats.reverse()[0].content
  const roleToUseAndAbort =roles.find(r => r.prompt === lastChatMessage)
  if (roleToUseAndAbort) {
    promptTemplate = roleToUseAndAbort.prompt
    return new Response('Thanks, now type your question...', {
      headers: { 'Content-Type': 'text/plain' },
    })
  }
  let theModel = body.model
  if (roles.find(r => r.name === theModel) === undefined) {
    theModel = 'llama2'
  }
  const readableStream = new ReadableStream({
    async start(controller) {
      const llm = new Ollama({
        model: theModel,
        callbackManager: CallbackManager.fromHandlers({
          handleLLMNewToken: async (token: string) => controller.enqueue(token),
        }),
      })
      const producePromptTemplate = (promptTemplate: string) => `${promptTemplate} in one sentence for the following prompt, delimited by triple quotes: """{object}""".`

      const prompt = PromptTemplate.fromTemplate(producePromptTemplate(promptTemplate))

      const formattedPrompt = await prompt.format({
        object: lastChatMessage
      })
      const stream = await llm.stream(
        formattedPrompt,
      )
      const chunks = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }
      // console.log(chunks.join(''))
      controller.close()
    },
  })

  return new Response(readableStream, {
    headers: { 'Content-Type': 'text/plain' },
  })


}


