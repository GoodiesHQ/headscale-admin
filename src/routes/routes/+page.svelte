<script lang="ts">
	import CardListPage from '$lib/cards/CardListPage.svelte';
	import CardTilePage from '$lib/cards/CardTilePage.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';
	import RouteListCard from '$lib/cards/route/RouteListCard.svelte';
	import RouteTileCard from '$lib/cards/route/RouteTileCard.svelte';
	import ExportModal from '$lib/parts/ExportModal.svelte';
	import Page from '$lib/page/Page.svelte';
	import SortBtn from '$lib/parts/SortBtn.svelte';
	import type { OnlineStatus, Direction } from '$lib/common/types';
	import { getSortedFilteredNodes } from '$lib/common/funcs';
	import { App } from '$lib/States.svelte';
	import FilterOnlineBtn from '$lib/parts/FilterOnlineBtn.svelte';
	import { _ } from 'svelte-i18n';
	
	// icons
	import RawMdiDownload from '~icons/mdi/download';

	let showExport = $state(false);

	// Sort & Filter
	let sortMethod = $state('id');
	let sortDirection = $state<Direction>('up');
	let filterOnlineStatus = $state<OnlineStatus>('all');
	let filterString = $state('');

	const Outer = $derived(App.layoutRoute.value === 'list' ? CardListPage : CardTilePage);
	const Inner = $derived(App.layoutRoute.value === 'list' ? RouteListCard : RouteTileCard);

	const nodesSortedFiltered = $derived(
		getSortedFilteredNodes(App.nodes.value, filterString, sortMethod, sortDirection, filterOnlineStatus, true)
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
	<PageHeader title={$_('navigation.routes')} layout={App.layoutRoute} bind:filterString buttonText={""}>
		{#snippet button()}
			x
		{/snippet}
	</PageHeader>

	<div class="flex flex-wrap items-center gap-2 mb-4">
		<div
			class="btn-group px-0 mx-0 py-0 my-0 rounded-md variant-ghost-secondary [&>*+*]:border-primary-500"
		>
			<SortBtn bind:value={sortMethod} direction={sortDirection} name={$_('common.id')} {toggle} />
			<SortBtn bind:value={sortMethod} direction={sortDirection} name={$_('common.name')} {toggle} />
		</div>
		<div
			class="btn-group px-0 mx-0 py-0 my-0 rounded-md variant-ghost-secondary [&>*+*]:border-primary-500"
		>
			<FilterOnlineBtn bind:value={filterOnlineStatus} status="all" name={$_('common.all')} />
			<FilterOnlineBtn bind:value={filterOnlineStatus} status="online" name={$_('common.online')} />
			<FilterOnlineBtn bind:value={filterOnlineStatus} status="offline" name={$_('common.offline')} />
		</div>
		
		<button
			type="button"
			class="btn btn-sm variant-ghost-primary rounded-md"
			onclick={() => showExport = true}
		>
			<RawMdiDownload class="w-4 h-4 mr-1" />
			{$_('common.export')}
		</button>
	</div>

	<Outer>
		{#each nodesSortedFiltered as node}
			<Inner {node} />
		{/each}
	</Outer>
	
	<ExportModal bind:show={showExport} />
</Page>
