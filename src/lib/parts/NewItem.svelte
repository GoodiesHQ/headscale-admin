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
		class="input rounded-md text-sm"
		type="text"
		placeholder="New {title} Name..."
		{disabled}
		bind:value={name}
		use:focus
	/>
	{#if value !== undefined}
		<input
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
