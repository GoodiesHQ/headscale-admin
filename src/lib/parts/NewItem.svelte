<script lang="ts">
	import { focus, toastError } from '$lib/common/funcs';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { slide } from 'svelte/transition';
	import RawMdiCheckCircleOutline from '~icons/mdi/check-circle-outline';

	type NewItemProps = {
		title: string,
		name: string,
		value?: string,
		disabled?: boolean,
		submit: (newItemName: string, newItemValu?: string) => void,
	}
	let {
		title,
		name = $bindable(),
		value = $bindable(undefined),
		disabled = false,
		submit,
	}: NewItemProps = $props()

	const ToastStore = getToastStore();
	const uid = Math.random().toString(36).substring(2, 9);
</script>

<form
	transition:slide
	onsubmit={() => {
		try {
			if (value === undefined) {
				submit(name);
			} else {
				submit(name, value);
			}
		} catch (e) {
			if (e instanceof Error) {
				toastError('', ToastStore, e);
			}
		}
	}}
	class="flex flex-row w-full my-2 items-center space-x-2"
>
	<input
		id="new-{uid}-name"
		name="new-name"
		autocomplete="off"
		class="input rounded-md text-sm"
		type="text"
		placeholder="New {title} Name..."
		{disabled}
		bind:value={name}
		use:focus
	/>
	{#if value !== undefined}
		<input
			id="new-{uid}-value"
			name="new-value"
			class="input rounded-md text-sm"
			type="text"
			placeholder="{title} Value..."
			{disabled}
			bind:value
		/>
	{/if}
	<button
		type="submit"
		class="btn btn-icon"
		disabled={disabled || !name || (value !== undefined && !value)}
	>
		<RawMdiCheckCircleOutline />
	</button>
</form>
