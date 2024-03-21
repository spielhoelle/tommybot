<script lang="ts">
    import { readablestreamStore } from '$lib/readablestreamstore'
    import { markdownParser } from '$lib/markdownparser'
    import { fly } from 'svelte/transition'
    import Typingindicator from '$lib/typingindicator.svelte'
    import { modelStore, chatHistoryStore } from '../stores.ts'
    import { chatTasks } from '../app.d'
    import Button from './button.svelte'
    import { onMount } from 'svelte'
    import { PUBLIC_OLLAMA_BASE_URL } from '$env/static/public'
    let roles = []

    const response = readablestreamStore()

    const initial_chat_history: {
        role: 'user' | 'assistant';
        content: string;
    }[] = []

    let chat_history = initial_chat_history
    onMount(() => {
      fetch(`${PUBLIC_OLLAMA_BASE_URL}/api/tags`, {
        headers: { 'Content-Type': 'application/json' },
      })
        .then((r) => r.json())
        .then((r) => {
          roles = r.models.map((r) => ({ name: r.name }))
        })
    })

    async function handleSubmit(this: HTMLFormElement) {
      if ($response.loading) {
        return
      }

      const formData: FormData = new FormData(this)
      const message = formData.get('message') as string

      if (!message) {
        return
      }

      chat_history = [...chat_history, { role: 'user', content: message }]
      chatHistoryStore.update(() => chat_history)

      try {
        const answer = response.request(
          new Request(`/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chats: chat_history,
              model: $modelStore,
            }),
          })
        )

        // this.reset()
        this.elements['chat-message'].value = ''

        chat_history = [
          ...chat_history,
          { role: 'assistant', content: (await answer) as string },
        ]
      } catch (err) {
        chat_history = [
          ...chat_history,
          { role: 'assistant', content: `Error: ${err}` },
        ]
      }
    }
    const findTask = (content: string) => {
      console.log('content', content)
      return chatTasks.find((r) => r.question === content || r.cmd === content)
    }
</script>

<main class="flex flex-col space-y-4 w-full p-3 h-100">
    <div class="flex flex-col space-y-2">
        <h1 class="text-3xl font-bold"> 👨‍💻 TommyBot</h1>
    </div>

    <form
    class="chat-wrapper h-100"
    on:submit|preventDefault={handleSubmit}
    method="POST"
    action="/api/chat"
    >
    {#if roles.length > 0}
        Select your flavour:<select
            name="role"
            bind:value={$modelStore}
            on:change={(e) => {
                modelStore.update(() => e.target.selectedOptions[0].value)
            }}
        >
            <option value="" selected disabled hidden>Select model...</option>
            {#each roles as role}
                <option value={role.name}>{role.name}</option>
            {/each}
        </select>
        {/if}
        <div
            class="flex flex-col space-y-2 overflow-y-auto w-full text-sm h-100"
        >
            {#if $modelStore}
                {#await new Promise((res) => setTimeout(res, 400)) then _}
                    <div class="flex">
                        <div
                            in:fly={{ y: 50, duration: 400 }}
                            class="assistant-chat"
                        >
                            What you want?<br />
                            <Button tasks={chatTasks[0].tasks} />
                        </div>
                    </div>
                {/await}
            {/if}
            {#each chat_history as chat, index}
                {#if chat.role == 'user'}
                    <div class="flex justify-end">
                        <div
                            in:fly={{ y: 50, duration: 600 }}
                            class="user-chat"
                        >
                            {#await markdownParser(chat.content)}
                                {chat.content}
                            {:then html}
                                {@html html}
                            {/await}
                        </div>
                    </div>
                {:else}
                    <div class="flex">
                        <div
                            in:fly={{ y: 50, duration: 600 }}
                            class="assistant-chat"
                        >
                            {#await markdownParser(chat.content)}
                                {chat.content}
                            {:then html}
                                {@html html}
                            {/await}
                            {#if findTask(chat.content)}
                                <Button tasks={findTask(chat.content).tasks} />
                            {/if}
                        </div>
                    </div>
                {/if}
            {/each}

            {#if $response.loading}
                {#await new Promise((res) => setTimeout(res, 400)) then _}
                    <div class="flex">
                        <div
                            in:fly={{ y: 50, duration: 600 }}
                            class="assistant-chat"
                        >
                            {#if $response.text == ''}
                                <Typingindicator />
                            {:else}
                                {#await markdownParser($response.text)}
                                    {$response.text}
                                {:then html}
                                    {@html html}
                                {/await}
                            {/if}
                        </div>
                        {#if $response.text != ''}
                            <div class="w-2" />
                            <div class="w-4 m-1">
                                <svg
                                    class="animate-spin h-4 w-4 text-neutral-600 dark:text-neutral-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        class="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        stroke-width="4"
                                    />
                                    <path
                                        class="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                            </div>
                        {/if}
                    </div>
                {/await}
            {/if}
        </div>

        <div class="h-px bg-gray-200" />

        <div class="">
            <Button tasks={chatTasks.map((r) => ({ prompt: r.cmd }))} />
        </div>

        <span class="flex flex-row space-x-4">
            <textarea
                name="message"
                id="chat-message"
                placeholder="About..."
                class="chat-message"
                on:keyup={(e) => {
                    if (e.key === 'Enter' && e.shiftKey) {
                        e.preventDefault()
                        handleSubmit.call(e.target.closest('form'))
                    }
                }}
            ></textarea>
            <button type="submit" tabindex="0" class="chat-send"> Send </button>
        </span>
    </form>
</main>

<style lang="postcss">
    .chat-wrapper {
        @apply flex flex-col space-y-4;
    }

    .assistant-chat {
        @apply bg-gray-200 text-gray-800 rounded-lg px-4 py-2 my-0 prose prose-sm prose-pre:font-mono prose-pre:border prose-pre:bg-white prose-code:border-gray-300;
    }

    .user-chat {
        @apply bg-[#FF3E00] text-white rounded-lg px-4 py-2 my-0 prose prose-sm prose-pre:font-mono prose-pre:border prose-pre:bg-white prose-code:border-gray-300;
    }

    .chat-message {
        @apply block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6;
    }

    .chat-send {
        @apply block items-center rounded-md border border-transparent bg-neutral-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2;
    }
    .h-100 {
        height: 100%;
    }
</style>
