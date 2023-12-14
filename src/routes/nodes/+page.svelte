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
	import type { Node } from '$lib/common/types';

	$: layout = get(LayoutNodeStore);
	$: showCreate = false;
	$: nodes = get(NodeStore);
	$: filterString = '';
	$: filteredNodes = nodes.filter((node) => filter(node, filterString));

	$: outer = layout == 'list' ? CardListPage : CardTilePage;
	$: inner = layout == 'list' ? NodeListCard : NodeTileCard;

	function filter(node: Node, filterString: string): boolean {
		if (filterString === '') {
			return true;
		}
		const r = RegExp(filterString);
		const getTag = (tag: string) => {
			if (tag.startsWith('tag:')) {
				return tag.substring(0, 4);
			}
			return tag;
		};
		return (
			r.test(node.name) ||
			r.test(node.givenName) ||
			node.forcedTags.map(getTag).some((tag) => r.test(tag)) ||
			node.validTags.map(getTag).some((tag) => r.test(tag))
		);
	}

	onMount(() => {
		const unsubNodeStore = NodeStore.subscribe((ns) => {
			nodes = ns;
		});
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
	<PageHeader title="Nodes" layout={LayoutNodeStore} bind:showCreate bind:filterString>
		<svelte:fragment slot="button">
			<NodeCreate bind:show={showCreate} />
		</svelte:fragment>
	</PageHeader>

	<svelte:component this={outer}>
		{#each filteredNodes as node}
			<svelte:component this={inner} {node} />
		{/each}
	</svelte:component>
</Page>
