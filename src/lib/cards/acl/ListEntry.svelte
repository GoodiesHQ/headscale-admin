<script lang="ts">
	import { AccordionItem } from '@skeletonlabs/skeleton';
	import type { Component, Snippet } from 'svelte';

	type ListEntryProps = {
		id: string,
		name: string,
		nameClasses?: string,
		logo: Component,
		logoClasses?: string,
		open: boolean,
		children?: Snippet,
	}

	let {
		id,
		name,
		nameClasses = "grid",
		logo,
		logoClasses = "",
		open = $bindable(false),
		children = undefined,
	}: ListEntryProps = $props()

</script>

<AccordionItem
	bind:open
	id={id}
	class="backdrop-brightness-100 bg-surface-50-900-token border border-surface-500/30 rounded-md overflow-visible"
	padding="py-4 px-4"
	regionControl="!rounded-none"
>
	<svelte:fragment slot="lead">
		<span class="{logoClasses}">
			<logo></logo>
		</span>
	</svelte:fragment>
	<svelte:fragment slot="summary">
		<div class="{nameClasses}">
			{name}
		</div>
	</svelte:fragment>
	<svelte:fragment slot="content">
		{@render children?.()}
    </svelte:fragment>
</AccordionItem>