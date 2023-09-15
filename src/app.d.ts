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
  { name: 'marketing', prompt: 'Step by step instruction' },
  { name: 'teacher', prompt: 'Make a joke' },
//   { name: 'productManager', prompt: 'Make a joke' },
//   { name: 'researcher', prompt: 'Summarize' }
]
