<script lang="ts">
    import type { ChatTask, Task } from '../app'
    export let tasks: Task[]
</script>

<div class="flex mt-2">
    {#each tasks as task}
        <button
            class="btn btn-secondary btn-sm mb-1 me-1"
            on:mouseup={(e) => {
                e.stopPropagation()
                document.getElementById(
                    'chat-message'
                ).value = e.target.innerText
                setTimeout(() => {
                const buttons = e.target.closest('.flex').querySelectorAll('button')
                buttons.forEach(element => {
                    // element.disabled = true
                    element.tabindex = -1
                    element.blur()
                    document.querySelector('#chat-message').focus()
                })
                }, 200)
            }}
        >{task.prompt}</button
        ><br />
    {/each}
</div>
<style>
    .btn {
        background-color: #f8f9fa;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
    }
</style>