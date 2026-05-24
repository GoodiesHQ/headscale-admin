<script lang="ts">
	import { AccordionItem } from '@skeletonlabs/skeleton';

	import type { Node } from '$lib/common/types';

	import CardListEntry from '../CardListEntry.svelte';
	import NodeInfo from './NodeInfo.svelte';
	import OnlineNodeIndicator from '$lib/parts/OnlineNodeIndicator.svelte';
	import { _ } from 'svelte-i18n';

	type NodeListCardProps = {
		node: Node,
		open?: boolean,
		selectable?: boolean,
		selected?: boolean,
		onToggleSelect?: (nodeId: string) => void,
	}

	let { 
		node = $bindable(), 
		open = $bindable(false),
		selectable = false,
		selected = false,
		onToggleSelect = () => {},
	}: NodeListCardProps = $props()

	function handleCheckboxClick(event: Event) {
		event.stopPropagation();
		onToggleSelect(node.id);
	}

</script>

<AccordionItem
	{open}
	bind:id={node.id}
	class="backdrop-blur-xl backdrop-brightness-100 bg-surface-50-900-token border border-surface-500/30 rounded-md {selected ? 'ring-2 ring-primary-500' : ''}"
	padding="py-4 px-4"
	regionControl="!rounded-none"
>
	<svelte:fragment slot="lead">
		{#if selectable}
			<input
				type="checkbox"
				checked={selected}
				onclick={handleCheckboxClick}
				class="checkbox"
			/>
		{/if}
		<OnlineNodeIndicator bind:node />
	</svelte:fragment>
	<svelte:fragment slot="summary">
		<div class="grid">
			<CardListEntry title={`${$_('common.id')}: ${node.id}`}>
				<span class="font-bold">{node.givenName}</span>
			</CardListEntry>
		</div>
	</svelte:fragment>
	<svelte:fragment slot="content">
		<NodeInfo {node} />
	</svelte:fragment>
</AccordionItem>
