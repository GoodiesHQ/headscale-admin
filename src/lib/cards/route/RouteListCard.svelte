<script lang="ts">
	import { AccordionItem } from '@skeletonlabs/skeleton';

	import type { Node } from '$lib/common/types';

	import CardListEntry from '../CardListEntry.svelte';
	import RouteInfo from './RouteInfo.svelte';
	import OnlineNodeIndicator from '$lib/parts/OnlineNodeIndicator.svelte';
	import { _ } from 'svelte-i18n';

	type RouteListCardProps = {
		node: Node,
		open?: boolean,
	}

	let { node = $bindable(), open = $bindable(true)}: RouteListCardProps = $props()
</script>

<AccordionItem
	{open}
	bind:id={node.id}
	class="backdrop-blur-xl backdrop-brightness-100 bg-surface-50-900-token border border-surface-500/30 rounded-md"
	padding="py-4 px-4"
	regionControl="!rounded-none"
>
	<svelte:fragment slot="lead">
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
		<RouteInfo bind:node />
	</svelte:fragment>
</AccordionItem>
