<script lang="ts">
	import { focus } from '$lib/common/funcs';
	import type { EventHandler } from 'svelte/elements';
	import RawMdiRename from '~icons/mdi/rename-outline';
	import RawMdiCheckCircleOutline from '~icons/mdi/check-circle-outline';
	import RawMdiCloseCircleOutline from '~icons/mdi/close-circle-outline';
	import { slide } from 'svelte/transition';

	export let value: string;
	export let valueNew: string;
	export let submit: EventHandler<SubmitEvent, HTMLFormElement>;
	let classes = '';
	export { classes as class };
	export let showRenameIcon = false;

	let showModify = false;
</script>

{#if !showModify}
	<button
		class="flex flex-row ml-2"
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
	<form
        class="flex flex-row ml-2"
		on:submit|preventDefault={(x) => {
			if (submit(x)) {
				showModify = false;
			}
		}}
	>
		<input
			use:focus
			on:blur={() => {
				showModify = false;
			}}
			type="text"
			class="input {classes} p-0 m-0 text-sm"
			bind:value={valueNew}
		/>
		<span class="text-right flex space-x-2 ml-2">
			<button type="submit">
				<RawMdiCheckCircleOutline />
			</button>
			<button
				type="button"
				on:click={() => {
					showModify = false;
				}}
			>
				<RawMdiCloseCircleOutline />
			</button>
		</span>
	</form>
{/if}
