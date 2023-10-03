<script lang="ts">
    // import { chatTasks } from "../app.d";
    export let role
</script>

<div class="d-flex">
    <input type='hidden' name='role' value={role.question}/>
    {#each role.tasks as task}
        <button
            class="btn btn-secondary btn-sm mb-1 me-1"
            on:mouseup={(e) => {
                e.stopPropagation()
                document.getElementById(
                    'chat-message'
                ).value = e.target.innerText
                setTimeout(() => {
                const buttons = e.target.closest('.d-flex').querySelectorAll('button')
                buttons.forEach(element => {
                    element.disabled = true
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