import { Ollama } from 'langchain/llms/ollama'
import { CallbackManager } from 'langchain/callbacks'
import { PromptTemplate } from 'langchain/prompts'
import { error } from '@sveltejs/kit'
import { roles, chatTasks } from '../../../app.d'

export type MessageBody = { chats: { role: 'user' | 'assistant', content: string }[], model: string }

let promptTemplate = ''

export const POST = async ({ request }) => {
  const body: MessageBody = await request.json()

  if (!body) {
    throw error(400, 'Missing Data')
  }

  let theModel = body.model
  if (roles.find(r => r.name === theModel) === undefined) {
    theModel = 'llama2'
  }
  const lastChatMessage = body.chats.reverse()[0].content

  const roleToUseAndAbort = chatTasks.find(r => r.cmd === lastChatMessage)
  if (roleToUseAndAbort) {
    return new Response(roleToUseAndAbort.question, {
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  const taskToAbort = chatTasks.find(r => r.tasks.find(t => t.prompt === lastChatMessage))
  if (taskToAbort) {
    promptTemplate = lastChatMessage
    return new Response('About what?', {
      headers: { 'Content-Type': 'text/plain' },
    })
  }
  console.log('promptTemplate', promptTemplate)

  const readableStream = new ReadableStream({
    async start(controller) {
      console.log('theModel', theModel)
      const llm = new Ollama({
        model: theModel,
        callbackManager: CallbackManager.fromHandlers({
          handleLLMNewToken: async (token: string) => controller.enqueue(token),
        }),
      })
      const producePromptTemplate = (promptTemplate: string) => `${promptTemplate} about the following prompt, delimited by triple quotes: """{object}""".`

      const prompt = PromptTemplate.fromTemplate(producePromptTemplate(promptTemplate))

      const formattedPrompt = await prompt.format({
        object: lastChatMessage
      })
      console.log('formattedPrompt', formattedPrompt)
      const stream = await llm.stream(
        formattedPrompt,
      )
      const chunks = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }
      controller.close()
    },
  })

  return new Response(readableStream, {
    headers: { 'Content-Type': 'text/plain' },
  })
}


