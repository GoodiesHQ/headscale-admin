<script lang="ts">
	import { focus } from '$lib/common/funcs';
	import type { EventHandler } from 'svelte/elements';
	import RawMdiRename from '~icons/mdi/rename-outline';
	import RawMdiCheckCircleOutline from '~icons/mdi/check-circle-outline';
	import RawMdiCloseCircleOutline from '~icons/mdi/close-circle-outline';
	import { slide } from 'svelte/transition';

	type TextProps = {
		value: string,
		valueNew: string,
		submit: EventHandler<SubmitEvent, HTMLFormElement>,
		showRenameIcon?: boolean,
		classes?: string,
	}

	let {
		value = $bindable(),
		valueNew = $bindable(),
		submit,
		showRenameIcon = false,
		classes,
	}: TextProps = $props()

	let showModify = $state(false);
	const inputId = Math.random().toString(36).substring(2, 9);
</script>

{#if !showModify}
	<button
		class="flex flex-row ml-2"
		onclick={() => {
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
		onsubmit={(x) => {
			x.preventDefault()
			if(submit(x)) {
				showModify = false
			}
		}}
	>
		<input
			use:focus
			id="rename-{inputId}"
			name="rename"
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
				onclick={() => {
					showModify = false;
				}}
			>
				<RawMdiCloseCircleOutline />
			</button>
		</span>
	</form>
{/if}
