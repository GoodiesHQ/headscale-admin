<script lang="ts">
	import { focus } from "$lib/common/funcs";
	import type { EventHandler } from "svelte/elements";
	import RawMdiRename from '~icons/mdi/rename-outline';


    export let value: string;
    export let valueNew: string;
    export let submit: EventHandler<SubmitEvent, HTMLFormElement>;
    let classes = "";
    export {classes as class}
    export let showRenameIcon = false;

    let showModify = false;
</script>

{#if !showModify}
    <button
        class="flex flex-row ml-2 items-center"
        on:click={() => {
            valueNew = value;
            showModify = true;
        }}
    >
        <span class={classes}>{value}</span>
        {#if showRenameIcon}
        <span class="text-xs ml-1"><RawMdiRename /></span>
        {/if}
    </button>
{:else}
    <form on:submit|preventDefault={(x) => {
        if(submit(x)){
            showModify = false;
        }
    }}>
        <input
            use:focus
            type="text"
            class="input p-0 m-0 text-sm ml-2 w-32"
            bind:value={valueNew}
        />
    </form>
{/if}