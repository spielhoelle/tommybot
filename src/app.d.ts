// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}
}

export { }
export const roles = [
  // { name: 'metalpoet' },
  { name: 'marketing' },
  { name: 'teacher' },
//   { name: 'productManager', prompt: 'Make a joke' },
//   { name: 'researcher', prompt: 'Summarize' }
]
export interface ChatTask {
  cmd: string
  answer: string
  question: string
  tasks: Task[]
}
export interface Task {
  prompt: string
}
export const chatTasks: ChatTask[] = [ {
  cmd: '/start',
  question: 'Whats the given Task?',
  answer: '',
  tasks: [
    { prompt: 'joke' },
    { prompt: 'summary' },
    { prompt: 'step by step instruction' },
    { prompt: 'code-output' },
    //   { prompt: 'Make a joke' },
    //   { prompt: 'Summarize' }
  ]
},
{
  cmd: '/tone',
  question: 'What should the tone be like?',
  answer: 'In which tone?',
  tasks: [
    { prompt: 'very easy to understand' },
    { prompt: 'very complex and specific' }
    //   { prompt: 'Make a joke' },
    //   { prompt: 'Summarize' }
  ]
} ]
