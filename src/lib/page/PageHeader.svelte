<script lang="ts">
	import { SlideToggle } from '@skeletonlabs/skeleton';
	import { slide } from 'svelte/transition';
	import RawMdiViewListOutline from '~icons/mdi/view-list-outline';
	import RawMdiViewGridOutline from '~icons/mdi/view-grid-outline';
	import { focus } from '$lib/common/funcs';
	import type { LayoutStyle, Valued } from '$lib/States.svelte';
	import { App } from '$lib/States.svelte';
	import type { Snippet } from 'svelte';

	type PageHeaderProps = {
		filterString?: string,
		title: string,
		show?: boolean,
		layout?: Valued<LayoutStyle>,
		buttonText?: string,
		button?: Snippet,
	}

	let {
		filterString = $bindable(undefined),
		title,
		show = $bindable(false),
		layout = $bindable(undefined),
		buttonText = 'Create',
		button,
	}: PageHeaderProps = $props()

	const layoutCurrent = $derived(layout !== undefined ? layout.value : null)
	const regexIsValid = $derived(validRegex(filterString));

	function validRegex(filterString?: string): boolean {
		if (filterString === undefined) {
			return true
		}

		try {
			const r = RegExp(filterString);
			return true;
		} catch (err) {
			return false;
		}
	}
</script>

<div class="py-5">
	<div class="flex flex-row justify-between">
		<div class="text-3xl md:text-4xl lg:text-5xl font-mono">{title}</div>
		{#if layout && layoutCurrent}
			<div class="flex pr-5">
				<RawMdiViewGridOutline />
				<SlideToggle
					class="pr-0 pt-5 text-end"
					name="toggle-layout-user"
					checked={layoutCurrent === 'list'}
					on:change={() => App.toggleLayout(layout)}
					active="bg-primary-500"
					background="bg-secondary-500"
					size="sm"
				/>
				<RawMdiViewListOutline />
			</div>
		{/if}
	</div>
	{#if button !== undefined}
		<div class="flex justify-start pt-4 space-x-5">
			{#if buttonText !== ""}
				<button
					type="button"
					class="btn btn-sm variant-filled-success rounded-sm"
					onclick={(_) => (show = !show)}
				>
					{buttonText}
				</button>
			{/if}
			{#if filterString !== undefined}
				<input
					type="text"
					class="input rounded-md text-sm w-64 md:w-96 {regexIsValid ? '' : 'input-error'}"
					bind:value={filterString}
					use:focus
					placeholder="Search..."
				/>
			{/if}
		</div>
	{/if}
</div>
{#if button !== undefined && show}
	<div transition:slide class="pb-8">
		{@render button()}
	</div>
{/if}
