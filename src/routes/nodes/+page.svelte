<script lang="ts">
	import CardListPage from '$lib/cards/CardListPage.svelte';
	import CardTilePage from '$lib/cards/CardTilePage.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';
	import { LayoutNodeStore, NodeStore } from '$lib/Stores';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	import NodeListCard from '$lib/cards/node/NodeListCard.svelte';
	import NodeTileCard from '$lib/cards/node/NodeTileCard.svelte';
	import NodeCreate from '$lib/cards/node/NodeCreate.svelte';
	import Page from '$lib/page/Page.svelte';

	$: nodes = get(NodeStore);
	$: layout = get(LayoutNodeStore);
	$: showCreate = false;

	$: outer = layout == 'list' ? CardListPage : CardTilePage;
	$: inner = layout == 'list' ? NodeListCard : NodeTileCard;

	onMount(() => {
		const unsubNodeStore = NodeStore.subscribe((ns) => (nodes = ns));
		const unsubLayoutNodeStore = LayoutNodeStore.subscribe((l) => {
			layout = l;
		});
		return () => {
			unsubNodeStore();
			unsubLayoutNodeStore();
		};
	});
</script>

<Page>
	<PageHeader title="Nodes" layout={LayoutNodeStore} bind:show={showCreate}>
		<NodeCreate bind:show={showCreate} />
	</PageHeader>

	<svelte:component this={outer}>
		{#each nodes as node}
			<svelte:component this={inner} {node} />
		{/each}
	</svelte:component>
</Page>
