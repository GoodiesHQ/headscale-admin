<script lang="ts">
	import { SlideToggle } from '@skeletonlabs/skeleton';
	import { slide } from 'svelte/transition';
	import RawMdiViewListOutline from '~icons/mdi/view-list-outline';
	import RawMdiViewGridOutline from '~icons/mdi/view-grid-outline';
	import { focus } from '$lib/common/funcs';
	import type { LayoutStyle, Valued } from '$lib/States.svelte';
	import { App } from '$lib/States.svelte';
	import type { Snippet } from 'svelte';
	import { _ } from 'svelte-i18n';

	type PageHeaderProps = {
		filterString?: string,
		title: string,
		show?: boolean,
		layout?: Valued<LayoutStyle>,
		buttonText?: string,
		button?: Snippet,
		children?: Snippet,
	}

	let {
		filterString = $bindable(undefined),
		title,
		show = $bindable(false),
		layout = $bindable(undefined),
		buttonText = $_('common.create'),
		button,
		children,
	}: PageHeaderProps = $props()

	const layoutCurrent = $derived(layout !== undefined ? layout.value : null)
	const regexIsValid = $derived.by(() => {
		if (filterString === undefined) {
			return true
		}

		try {
			const r = RegExp(filterString);
			return true;
		} catch (err) {
			return false;
		}
	});
</script>

<div class="py-5">
	<div class="flex flex-row justify-between">
		<div class="text-3xl md:text-4xl lg:text-5xl font-mono">{title}</div>
		{#if layout && layoutCurrent}
			<div class="flex items-center gap-2 pr-5">
				<RawMdiViewGridOutline class="w-5 h-5" />
				<SlideToggle
					name="toggle-layout-user"
					checked={layoutCurrent === 'list'}
					on:change={() => App.toggleLayout(layout)}
					active="bg-primary-500"
					background="bg-secondary-500"
					size="sm"
				/>
				<RawMdiViewListOutline class="w-5 h-5" />
			</div>
		{/if}
	</div>
	{#if button !== undefined}
		<div class="flex flex-wrap items-center pt-4 gap-x-3 gap-y-2">
			<div class="flex flex-nowrap items-center gap-3 order-1">
				{#if buttonText !== ""}
					<button
						type="button"
						class="btn btn-sm variant-filled-success rounded-sm whitespace-nowrap"
						onclick={(_) => (show = !show)}
					>
						{buttonText}
					</button>
				{/if}
				{#if filterString !== undefined}
					<div class="w-40 sm:w-48 md:w-64 lg:w-80">
						<input
							id="page-header-search"
							name="page-header-search"
							type="text"
							class="input rounded-md text-sm w-full {regexIsValid ? '' : 'input-error'}"
							bind:value={filterString}
							use:focus
							placeholder={$_('common.search')}
						/>
					</div>
				{/if}
			</div>
			<div class="w-full md:w-auto order-2 overflow-x-auto pb-1">
				{@render children?.()}
			</div>
		</div>
	{/if}
</div>
{#if button !== undefined && show}
	<div transition:slide class="pb-8">
		{@render button()}
	</div>
{/if}
