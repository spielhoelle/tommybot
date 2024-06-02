import { writable } from 'svelte/store'
export const chat_history_store = writable([])
export let modelStore: any
export let chatHistoryStore: any
import { browser } from "$app/environment"

if (browser) {
	modelStore = writable(localStorage.getItem('modelStore') || "llama3")
	modelStore.subscribe((value: any) => localStorage.modelStore = value)
	chatHistoryStore = writable(JSON.parse(localStorage.getItem('chatHistoryStore') || "{}") || {})
	chatHistoryStore.subscribe((value: any) => localStorage.chatHistoryStore = JSON.stringify(value))
}

