<script lang="ts">
	import CardListPage from '$lib/cards/CardListPage.svelte';
	import CardTilePage from '$lib/cards/CardTilePage.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';
	import RouteListCard from '$lib/cards/route/RouteListCard.svelte';
	import RouteTileCard from '$lib/cards/route/RouteTileCard.svelte';
	import Page from '$lib/page/Page.svelte';
	import SortBtn from '$lib/parts/SortBtn.svelte';
	import type { Direction } from '$lib/common/types';
	import { getSortedFilteredNodes } from '$lib/common/funcs';
	import { App } from '$lib/States.svelte';

	// Sort & Filter
	let sortMethod = $state('id');
	let sortDirection = $state<Direction>('up');
	let filterString = $state('');

	const Outer = $derived(App.layoutRoute.value === 'list' ? CardListPage : CardTilePage);
	const Inner = $derived(App.layoutRoute.value === 'list' ? RouteListCard : RouteTileCard);

	const nodesSortedFiltered = $derived(
		getSortedFilteredNodes(App.nodes.value, filterString, sortMethod, sortDirection)
	)

	function toggle(method: string) {
		if (method != sortMethod) {
			sortMethod = method;
			sortDirection = 'up';
		} else {
			sortDirection = sortDirection === 'up' ? 'down' : 'up';
		}
	}
</script>

<Page>
	<PageHeader title="Routes" layout={App.layoutRoute} bind:filterString buttonText={undefined}>
		{#snippet button()}
			x
		{/snippet}
	</PageHeader>

	<div
		class="btn-group px-0 mx-0 py-0 my-0 rounded-md variant-ghost-secondary [&>*+*]:border-primary-500"
	>
		<SortBtn bind:value={sortMethod} direction={sortDirection} name="ID" {toggle} />
		<SortBtn bind:value={sortMethod} direction={sortDirection} name="Name" {toggle} />
	</div>

	<Outer>
		{#each nodesSortedFiltered as node}
			<Inner {node} />
		{/each}
	</Outer>
</Page>
