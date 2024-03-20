<script lang="ts">
	import { focus, toastError } from '$lib/common/funcs';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { slide } from 'svelte/transition';
	import RawMdiCheckCircleOutline from '~icons/mdi/check-circle-outline';

	export let title: string;
	export let name: string;
	export let value: string | undefined = undefined;
	export let disabled: boolean = false;
	export let submit: (newItemName: string, newItemValue?: string) => void;

	const ToastStore = getToastStore();
</script>

<form
	transition:slide
	on:submit={() => {
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
			class="input rounded-md"
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
