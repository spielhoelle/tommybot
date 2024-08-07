import { writable } from 'svelte/store'
export let modelStore: any
export let chatHistoryStore: any
export let sessionStore: any
import { browser } from "$app/environment"

if (browser) {
	modelStore = writable(localStorage.getItem('modelStore') || "llama3.1:latest")
	modelStore.subscribe((value: any) => localStorage.modelStore = value)
	chatHistoryStore = writable(JSON.parse(localStorage.getItem('chatHistoryStore') || "[]") || {})
	chatHistoryStore.subscribe((value: any) => localStorage.chatHistoryStore = JSON.stringify(value))
	sessionStore = writable(localStorage.getItem('sessionStore') || "0")
	sessionStore.subscribe((value: any) => localStorage.sessionStore = value.toString())
}

