import { Ollama } from 'langchain/llms/ollama'
import { CallbackManager } from 'langchain/callbacks'
import { PromptTemplate } from 'langchain/prompts'
import { error } from '@sveltejs/kit'
import { chatTasks } from '../../../app.d'
const PUBLIC_OLLAMA_BASE_URL = process.env.PUBLIC_OLLAMA_BASE_URL || 'https://ai.tmy.io'
// import util from 'util'
// import child_process from 'child_process'
// const exec = util.promisify(child_process.exec)

export type MessageBody = { chats: { role: 'user' | 'assistant', content: string }[], model: string }

const promptArray: string[] = []
let promptTemplate = `Evaluate`

// export const GET = async ({ request }) => {
//   const promise = exec("ollama ls | awk '{print $1}' |  tail -n +2")
//   const child = promise.child

//   child.stdout?.on('data', (data) => {
//     // console.log('stdout: ' + data)
//   })
//   child.stderr?.on('data', (data) => {
//     console.log('stderr: ' + data)
//   })
//   // child.on('close', (code) => {
//   // console.log('closing code: ' + code)
//   // })
//   const { stdout, stderr } = await promise
//   if (stderr) {
//     return new Response(JSON.stringify({ err: stderr }), {
//       headers: { 'Content-Type': 'text/plain' },
//     })
//   }
//   const res = stdout.split('\n').map(m => m.replace(':latest', ''))
//   return new Response(JSON.stringify({ models: res }), {
//     headers: { 'Content-Type': 'text/plain' },
//   })
// }
export const POST = async ({ request }) => {
  const body: MessageBody = await request.json()
  console.log('bodbodyy', body)

  if (!body) {
    throw error(400, 'Missing Data')
  }

  const theModel = body.model
  // if (roles.find(r => r.name === theModel) === undefined) {
  //   theModel = 'llama2'
  // }
  const lastChatMessage = body.chats.reverse()[0].content

  const roleToUseAndAbort = chatTasks.find(r => r.cmd === lastChatMessage)
  if (roleToUseAndAbort) {
    return new Response(roleToUseAndAbort.question, {
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  const taskToAbort = chatTasks.findIndex(r => r.tasks.find(t => t.prompt === lastChatMessage))
  if (taskToAbort !== -1) {
    promptArray[taskToAbort] = lastChatMessage
    const nextAnswer = chatTasks[taskToAbort + 1]
    return new Response(nextAnswer ? nextAnswer.answer : 'About what?', {
      headers: { 'Content-Type': 'text/plain' },
    })
  }
  console.log('propromptArraymptArray', promptArray)
  if (promptArray.length === 1) {
    promptTemplate = `Give me a ${promptArray[0]}`
  }
  if (promptArray.length === chatTasks.length) {
    promptTemplate = `Give me a ${promptArray[0]} in a ${promptArray[1]} tone`
  }
  // else {
  // return new Response('About what?', {
  //   headers: { 'Content-Type': 'text/plain' },
  // })
  // }

  const readableStream = new ReadableStream({
    async start(controller) {
      const llm = new Ollama({
        model: theModel,
        baseUrl: PUBLIC_OLLAMA_BASE_URL,
        callbackManager: CallbackManager.fromHandlers({
          handleLLMNewToken: async (token: string) => controller.enqueue(token),
        }),
      })
      const producePromptTemplate = (promptTemplate: string) => `${promptTemplate} about the following prompt in one sentence, delimited by triple quotes: \n"""\n{object}\n"""\n\n. Just respond with the pure answer, no smalltalk or further explanation.`

      let pT = ""
      if (promptArray.length == 0) {
        pT = lastChatMessage
      } else {
        pT = producePromptTemplate(promptTemplate)
      }
      const prompt = PromptTemplate.fromTemplate(pT)

      const formattedPrompt = await prompt.format({
        object: lastChatMessage
      })
      console.log('formattedPrompt', formattedPrompt)
      // console.log('Model: ', theModel)
      // console.log('formattedPrompt: ', formattedPrompt)
      const stream = await llm.stream(
        formattedPrompt,
      )
      let chunks = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }
      chunks = chunks.map(c => c.replace(/"/g, ''))
      controller.close()
    },
  })

  return new Response(readableStream, {
    headers: { 'Content-Type': 'text/plain' },
  })
}


