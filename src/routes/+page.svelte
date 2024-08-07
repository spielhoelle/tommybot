<script lang="ts">
  import { readablestreamStore } from "$lib/readablestreamstore";
  import { markdownParser } from "$lib/markdownparser";
  import { fly } from "svelte/transition";
  import Typingindicator from "$lib/typingindicator.svelte";
  import { modelStore, chatHistoryStore, sessionStore } from "../stores.ts";
  import { chatTasks } from "../app.d";
  import Button from "./button.svelte";
  import { afterUpdate, onMount } from "svelte";
  import { PUBLIC_OLLAMA_BASE_URL } from "$env/static/public";
  import { enhance, applyAction } from "$app/forms";
  import { invalidate } from "$app/navigation";
  let roles = ["llama3.1:latest"];

  /** @type {import('./$types').PageData} */
  export let data;
  console.log("data", data);

  /** @type {import('./$types').ActionData} */
  export let form;

  let formVisible = !data.token;
  const response = readablestreamStore();

  const initial_chat_history: {
    role: "user" | "assistant";
    content: string;
  }[] = data.messages || [
    {
      role: "assistant",
      content: "Hello, I am TommyBot. What can I do for you?",
    },
  ];
  afterUpdate(() => {
    if (data.sessions.length > 0) {
      let foundSession;
      if ($sessionStore != 0) {
        foundSession = data.sessions.find(
          (s) => s.id === Number($sessionStore)
        );
        if (!foundSession) {
          foundSession = data.sessions[0];
        }
      }
      if ($chatHistoryStore.length == 0) {
        const newChatHistory = foundSession["messages"];
        chat_history = newChatHistory;
        chatHistoryStore.update(() => newChatHistory);
        sessionStore.set(foundSession.id.toString());
      }
    }
  });
  let chat_history = [];
  onMount(() => {
    fetch(`${PUBLIC_OLLAMA_BASE_URL}/api/tags`, {
      headers: { "Content-Type": "application/json" },
    })
      .then((r) => r.json())
      .then((r) => {
        roles = r.models.map((r) => ({ name: r.name }));
        if ($sessionStore == "0" && data.sessions.length > 0) {
          sessionStore.set(data.sessions[0].id.toString());
        }
        if ($modelStore !== roles[0]) {
          modelStore.set($modelStore);
        }
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() => {
        if (data.sessions.length > 0) {
          let foundSession;
          if ($sessionStore == 0) {
            foundSession = data.sessions.find(
              (s) => s.id === Number($sessionStore)
            );
          } else {
            foundSession = data.sessions[0];
          }
          const newChatHistory = foundSession["messages"];
          chat_history = newChatHistory;
          chatHistoryStore.update(() => newChatHistory);
        }
      });
  });

  async function handleSubmit(this: HTMLFormElement) {
    if ($response.loading) {
      return;
    }
    const formData: FormData = new FormData(this);
    const message = formData.get("message") as string;
    if (!message) {
      return;
    }
    chat_history = [...chat_history, { role: "user", content: message }];
    chatHistoryStore.update(() => chat_history);
    try {
      const answer = response.request(
        new Request(`/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chats: chat_history,
            model: $modelStore,
            sessionId: $sessionStore,
          }),
        })
      );
      this.elements["chat-message"].value = "";
      chat_history = [
        ...chat_history,
        {
          role: "assistant",
          content: (await answer).toString().replace(/""/g, '"'),
        },
      ];
    } catch (err) {
      chat_history = [
        ...chat_history,
        { role: "assistant", content: `Error: ${err}` },
      ];
    }
  }
  const findTask = (content: string) => {
    return chatTasks.find((r) => r.question === content || r.cmd === content);
  };
</script>

<main class="flex flex-col space-y-4 w-full p-3 h-100">
  <div class="flex flex-col space-y-2 h-full">
    <div class="flex space-y-2 justify-between">
      <h1 class="text-3xl font-bold">🧑‍🌾 TommyBot</h1>
      <form
        method="POST"
        action="?/newSession"
        use:enhance={({ formElement, formData, action, cancel, submitter }) => {
          return async ({ result, update }) => {
            await applyAction(result);
            console.log("result", result);
            invalidate("app:load");
            // if (result["status"] === 200) {
            //   console.log("data", data);
            // }
          };
        }}
      >
        <button type="submit" class="">New chat</button>
      </form>
      {#if data.sessions.length > 0}
        <div class="">
          <select
            class="w-auto bg-gray-200"
            name="session"
            bind:value={$sessionStore}
            on:change={(e) => {
              chat_history = data.sessions.find(
                (s) => s.id === Number(e.target.selectedOptions[0].value)
              )["messages"];
              chatHistoryStore.update(() => chat_history);
            }}
          >
            <option disabled value="disabled">Select chat...</option>
            {#each data.sessions as session}
              <option value={session.id.toString()}
                >{session["messages"].length > 0
                  ? session["messages"][1].content.slice(0, 30)
                  : "New chat"}</option
              >
            {/each}
          </select>
        </div>
      {/if}
      {#if roles.length > 0 && roles.length !== 1}
        <div class="">
          <select
            class="w-auto bg-gray-200"
            name="role"
            bind:value={$modelStore}
          >
            <option disabled>Select model...</option>
            {#each roles as role}
              <option value={role.name}>{role.name}</option>
            {/each}
          </select>
        </div>
      {/if}
    </div>
    <form
      class="chat-wrapper h-100"
      on:submit|preventDefault={handleSubmit}
      method="POST"
      action="/api/chat"
    >
      <div class="flex flex-col space-y-2 overflow-y-auto w-full text-sm h-100">
        {#if $modelStore}
          {#await new Promise((res) => setTimeout(res, 400)) then _}
            <div class="flex">
              <div in:fly={{ y: 50, duration: 400 }} class="assistant-chat">
                What you want?<br />
                <Button tasks={chatTasks[0].tasks} />
              </div>
            </div>
          {/await}
        {/if}

        {#if chat_history.length > 0}
          {#each chat_history as chat, index}
            {#if chat.role == "user"}
              <div class="flex justify-end">
                <div in:fly={{ y: 50, duration: 600 }} class="user-chat">
                  {#await markdownParser(chat.content)}
                    {chat.content}
                  {:then html}
                    {@html html}
                  {/await}
                </div>
              </div>
            {:else}
              <div class="flex">
                <div in:fly={{ y: 50, duration: 600 }} class="assistant-chat">
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
        {/if}
        {#if $response.loading}
          {#await new Promise((res) => setTimeout(res, 400)) then _}
            <div class="flex">
              <div in:fly={{ y: 50, duration: 600 }} class="assistant-chat">
                {#if $response.text == ""}
                  <Typingindicator />
                {:else}
                  {#await markdownParser($response.text)}
                    {$response.text}
                  {:then html}
                    {@html html}
                  {/await}
                {/if}
              </div>
              {#if $response.text != ""}
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

      <!-- <div class="">
            <Button tasks={chatTasks.map((r) => ({ prompt: r.cmd }))} />
        </div> -->

      <span class="flex flex-row space-x-4">
        <textarea
          name="message"
          id="chat-message"
          placeholder="About..."
          class="chat-message"
          on:keyup={(e) => {
            if (e.key === "Enter" && e.shiftKey) {
              e.preventDefault();
              handleSubmit.call(e.target.closest("form"));
            }
          }}>Tell me a short joke about a random topic</textarea
        >
        <button type="submit" tabindex="0" class="chat-send"> Send </button>
      </span>
    </form>
  </div>

  <div id="popup" class="popup {!formVisible ? `hidden` : ``}">
    <div class="backdrop"></div>
    <div class="popup-content">
      <div class="flex min-h-full flex-col justify-center px-6 py-7 lg:px-8">
        <div class="sm:mx-auto sm:w-full sm:max-w-sm">
          <img
            class="mx-auto h-10 w-auto"
            src="favicon.png"
            alt="Spielhoelle Entertainment"
          />
          <h2
            class="mt-4 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900"
          >
            Welcome to TommyBot
          </h2>
        </div>

        <div class="mt-5 sm:mx-auto sm:w-full sm:max-w-sm">
          <form
            method="POST"
            action="?/submitname"
            use:enhance={({
              formElement,
              formData,
              action,
              cancel,
              submitter,
            }) => {
              return async ({ result, update }) => {
                await applyAction(result);
                console.log("result", result);
                if (result["status"] === 200) {
                  invalidate("app:load");
                  setTimeout(() => {
                    formVisible = false;
                  }, 300);
                }
              };
            }}
          >
            <div>
              <label
                for="email"
                class="block text-sm font-medium leading-6 text-gray-900"
                >Email address</label
              >
              <div class="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autocomplete="email"
                  value={form?.email ?? "spielhoelle@posteo.net"}
                  required
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
                {#if form?.success}<p class="success mt-2">Done</p>{/if}
                {#if form?.alreadyExists}<p class="error mt-2">
                    Email already taken
                  </p>{/if}
              </div>
            </div>

            <!-- <div>
                                <div class="flex items-center justify-between">
                                    <label
                                        for="password"
                                        class="block text-sm font-medium leading-6 text-gray-900"
                                        >Name</label
                                    >
                                    <div class="text-sm">
                                        <a
                                            href="#"
                                            class="font-semibold text-indigo-600 hover:text-indigo-500"
                                            >Forgot password?</a
                                        >
                                    </div>
                                </div>
                                <div class="mt-2">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autocomplete="current-password"
                                        required
                                        class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    />
                                </div>
                            </div> -->

            <div class="mt-3">
              <button
                type="submit"
                class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >Sign in</button
              >
            </div>
          </form>

          <!-- <p class="mt-10 text-center text-sm text-gray-500">
                            Not a member?
                            <a
                                href="#"
                                class="font-semibold leading-6 text-indigo-600 hover:text-indigo-500"
                                >Start a 14 day free trial</a
                            >
                        </p> -->
        </div>
      </div>
    </div>
  </div>
</main>

<style lang="postcss">
  .backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: -1;
  }
  .popup {
    position: absolute;
    z-index: 1;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    /* translate: 20px, 20px; */
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .popup.hidden {
    display: none;
  }

  .popup-content {
    /* left: 50%;
            top: 50%;
            width: 50%;
            height: 50%; */
    background-color: rgb(184, 184, 184);
    /* transform: translate(-50%, -50%); */
    z-index: 1;
  }
  select {
    border-color: lightgray;
    /* background: var(--color-secondary);  */
    border-radius: 3px;
  }
  .error {
    background: #ffb3b3;
    padding: 5px;
    color: #c63636;
    border-radius: 3px;
  }
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
