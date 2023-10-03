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
export const chatTasks = [ {
  cmd: '/start',
  question: 'What do you want to talk about',
  tasks: [
    { prompt: 'How-to step by step instruction' },
    { prompt: 'Make a joke' },
    { prompt: 'Give me a summary' }
    //   { prompt: 'Make a joke' },
    //   { prompt: 'Summarize' }
  ]
},
{
  cmd: '/task',
  question: 'Okay tell me about your task',
  tasks: [
    { prompt: 'I need a lesson-plan for Chemistry' },
    { prompt: 'I need to correct Homework' }
    //   { prompt: 'Make a joke' },
    //   { prompt: 'Summarize' }
  ]
} ]
