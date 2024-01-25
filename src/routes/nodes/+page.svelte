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
	import type { Direction, Node } from '$lib/common/types';
	import SortBtn from '$lib/parts/SortBtn.svelte';
	import { getTime } from '$lib/common/funcs';

	$: layout = get(LayoutNodeStore);
	$: showCreate = false;
	$: nodes = get(NodeStore);

	// Sort & Filter
	$: sortMethod = 'id';
	$: sortDirection = 'up' as Direction;
	$: filterString = '';
	$: filteredNodes = nodes.filter((node) => filter(node, filterString));

	$: outer = layout == 'list' ? CardListPage : CardTilePage;
	$: inner = layout == 'list' ? NodeListCard : NodeTileCard;

	function getSortedNodes(nodes: Node[], sortMethod: string, sortDirection: Direction): Node[] {
		if (sortMethod === 'id') {
			nodes = nodes.sort((a: Node, b: Node) => {
				const aid = parseInt(a.id);
				const bid = parseInt(b.id);
				if (aid < bid) {
					return -1;
				}
				if (aid > bid) {
					return 1;
				}
				return 0;
			});
		} else if (sortMethod === 'name') {
			nodes = nodes.sort((a: Node, b: Node) => {
				if (a.givenName < b.givenName) {
					return -1;
				}
				if (a.givenName > b.givenName) {
					return 1;
				}
				return 0;
			});
		} else if (sortMethod === 'last seen') {
			nodes = nodes.sort((a: Node, b: Node) => {
				const aid = parseInt(a.id);
				const bid = parseInt(b.id);
				const atime = Math.round(getTime(a.lastSeen));
				const btime = Math.round(getTime(b.lastSeen));
				if (Math.abs(atime - btime) < 300000) {
					if (aid < bid) {
						return -1;
					} else if (aid > bid) {
						return 1;
					}
				} else if (atime > btime) {
					return -1;
				} else if (atime < btime) {
					return 1;
				}
				return 0;
			});
		}
		if (sortDirection === 'down') {
			return nodes.reverse();
		}
		return nodes;
	}

	function toggle(method: string) {
		if (method != sortMethod) {
			sortMethod = method;
			sortDirection = 'up';
		} else {
			sortDirection = sortDirection === 'up' ? 'down' : 'up';
		}
	}

	function filter(node: Node, filterString: string): boolean {
		if (filterString === '') {
			return true;
		}
		try {
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
		} catch (err) {
			return true;
		}
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

	<div
		class="btn-group px-0 mx-0 py-0 my-0 rounded-md variant-ghost-secondary [&>*+*]:border-primary-500"
	>
		<SortBtn bind:value={sortMethod} direction={sortDirection} name="ID" {toggle} />
		<SortBtn bind:value={sortMethod} direction={sortDirection} name="Name" {toggle} />
		<SortBtn bind:value={sortMethod} direction={sortDirection} name="Last Seen" {toggle} />
	</div>

	<svelte:component this={outer}>
		{#each getSortedNodes(filteredNodes, sortMethod, sortDirection) as node}
			<svelte:component this={inner} {node} />
		{/each}
	</svelte:component>
</Page>
