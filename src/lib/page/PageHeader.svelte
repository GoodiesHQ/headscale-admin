<script lang="ts">
	import { get, type Writable } from 'svelte/store';
	import { toggleLayout, type LayoutStyle } from '$lib/Stores';
	import { onMount } from 'svelte';
	import { SlideToggle } from '@skeletonlabs/skeleton';
	import { slide } from 'svelte/transition';
	import RawMdiViewListOutline from '~icons/mdi/view-list-outline';
	import RawMdiViewGridOutline from '~icons/mdi/view-grid-outline';
	import { focus } from '$lib/common/funcs';

	export let filterString: string = '';
	export let title: string;
	export let layout: Writable<LayoutStyle> | undefined = undefined;
	export let showCreate = false;

	$: layoutCurrent = layout ? get(layout) : null;
	$: regexIsValid = validRegex(filterString);

	function validRegex(filterString: string): boolean {
		try {
			const r = RegExp(filterString);
			return true;
		} catch (err) {
			return false;
		}
	}

	onMount(() => {
		const unsubLayout = layout?.subscribe((l) => (layoutCurrent = l));

		return () => {
			if (unsubLayout) {
				unsubLayout();
			}
		};
	});
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
					checked={get(layout) == 'list'}
					on:change={() => toggleLayout(layout)}
					active="bg-primary-500"
					background="bg-secondary-500"
					size="sm"
				/>
				<RawMdiViewListOutline />
			</div>
		{/if}
	</div>
	<div class="flex justify-start pt-4 space-x-5 {$$slots.button ? '' : 'invisible'}">
		<button
			type="button"
			class="btn btn-sm variant-filled-success rounded-sm"
			on:click={(_) => (showCreate = !showCreate)}
		>
			Create
		</button>
		{#if $$props.filterString !== undefined}
			<input
				type="text"
				class="input rounded-md text-sm w-64 md:w-96 {regexIsValid ? '' : 'input-error'}"
				bind:value={filterString}
				use:focus
				placeholder="Search..."
			/>
		{/if}
	</div>
</div>
{#if $$slots.button && showCreate}
	<div transition:slide class="pb-8">
		<slot name="button" />
	</div>
{/if}
