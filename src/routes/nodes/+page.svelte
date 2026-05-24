<script lang="ts">
	import CardListPage from '$lib/cards/CardListPage.svelte';
	import CardTilePage from '$lib/cards/CardTilePage.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';
	import NodeListCard from '$lib/cards/node/NodeListCard.svelte';
	import NodeTileCard from '$lib/cards/node/NodeTileCard.svelte';
	import NodeCreate from '$lib/cards/node/NodeCreate.svelte';
	import ExportModal from '$lib/parts/ExportModal.svelte';
	import BatchOperationsBar from '$lib/parts/BatchOperationsBar.svelte';
	import Page from '$lib/page/Page.svelte';
	import type { OnlineStatus, Direction } from '$lib/common/types';
	import SortBtn from '$lib/parts/SortBtn.svelte';
	import { getSortedFilteredNodes } from '$lib/common/funcs';
	import { App } from '$lib/States.svelte';
	import FilterOnlineBtn from '$lib/parts/FilterOnlineBtn.svelte';
	import { _ } from 'svelte-i18n';
	
	// icons
	import RawMdiDownload from '~icons/mdi/download';
	import RawMdiCheckboxMultipleMarked from '~icons/mdi/checkbox-multiple-marked';

	let showCreate = $state(false);
	let showExport = $state(false);
	let batchMode = $state(false);
	let selectedNodeIds = $state<Set<string>>(new Set());

	let sortMethod = $state('id');
	let sortDirection = $state<Direction>('up');
	let filterOnlineStatus = $state<OnlineStatus>('all');
	let filterString = $state('');
	let filterTags = $state<string[]>([]);

	const Outer = $derived(App.layoutNode.value === 'list' ? CardListPage : CardTilePage);
	const Inner = $derived(App.layoutNode.value === 'list' ? NodeListCard : NodeTileCard);

	const allTags = $derived.by(() => {
		const tags = new Set<string>();
		for (const node of App.nodes.value) {
			for (const tag of node.tags) {
				tags.add(tag);
			}
		}
		return Array.from(tags).sort();
	});

	const nodesSortedFiltered = $derived.by(() => {
		let filtered = getSortedFilteredNodes(App.nodes.value, filterString, sortMethod, sortDirection, filterOnlineStatus);
		if (filterTags.length > 0) {
			filtered = filtered.filter(node => 
				filterTags.every(ft => node.tags.some(nt => nt === ft))
			);
		}
		return filtered;
	});

	function toggle(method: string) {
		if (method != sortMethod) {
			sortMethod = method;
			sortDirection = 'up';
		} else {
			sortDirection = sortDirection === 'up' ? 'down' : 'up';
		}
	}

	function toggleTag(tag: string) {
		if (filterTags.includes(tag)) {
			filterTags = filterTags.filter(t => t !== tag);
		} else {
			filterTags = [...filterTags, tag];
		}
	}
	
	function toggleBatchMode() {
		batchMode = !batchMode;
		if (!batchMode) {
			selectedNodeIds = new Set();
		}
	}
	
	function toggleNodeSelection(nodeId: string) {
		const next = new Set(selectedNodeIds);
		if (next.has(nodeId)) {
			next.delete(nodeId);
		} else {
			next.add(nodeId);
		}
		selectedNodeIds = next;
	}
	
	function selectAll() {
		selectedNodeIds = new Set(nodesSortedFiltered.map(n => n.id));
	}
	
	function clearSelection() {
		selectedNodeIds = new Set();
	}
</script>

<Page>
	<PageHeader title={$_('navigation.nodes')} layout={App.layoutNode} bind:show={showCreate} bind:filterString buttonText={$_('common.createNode')}>
		{#snippet button()}
			<NodeCreate bind:show={showCreate} />
		{/snippet}
		<div class="flex flex-wrap gap-2 items-center">
			{#if allTags.length > 0}
				<div class="h-8 border-l border-surface-400/50 mx-2 hidden md:block"></div>
				{#each allTags as tag}
					<button 
						class="chip {filterTags.includes(tag) ? 'variant-filled-primary' : 'variant-soft-secondary'} hover:variant-filled-primary transition-colors"
						onclick={() => toggleTag(tag)}
					>
						{#if filterTags.includes(tag)}
							<span>✓</span>
						{/if}
						<span class="text-xs">{tag.replace('tag:', '')}</span>
					</button>
				{/each}
			{/if}
		</div>
	</PageHeader>

	<div class="flex flex-wrap items-center gap-2 mb-4">
		<div
			class="btn-group px-0 mx-0 py-0 my-0 rounded-md variant-ghost-secondary [&>*+*]:border-primary-500"
		>
			<SortBtn bind:value={sortMethod} direction={sortDirection} name={$_('common.id')} {toggle} />
			<SortBtn bind:value={sortMethod} direction={sortDirection} name={$_('common.name')} {toggle} />
			<SortBtn bind:value={sortMethod} direction={sortDirection} name={$_('common.lastSeen')} {toggle} />
		</div>
		<div
			class="btn-group px-0 mx-0 py-0 my-0 rounded-md variant-ghost-secondary [&>*+*]:border-primary-500"
		>
			<FilterOnlineBtn bind:value={filterOnlineStatus} status="all" name={$_('common.all')} />
			<FilterOnlineBtn bind:value={filterOnlineStatus} status="online" name={$_('common.online')} />
			<FilterOnlineBtn bind:value={filterOnlineStatus} status="offline" name={$_('common.offline')} />
		</div>
		
		<div class="flex gap-2">
			<button
				type="button"
				class="btn btn-sm variant-ghost-primary rounded-md"
				onclick={() => showExport = true}
			>
				<RawMdiDownload class="w-4 h-4 mr-1" />
				{$_('common.export')}
			</button>
			
			<button
				type="button"
				class="btn btn-sm {batchMode ? 'variant-filled-primary' : 'variant-ghost-secondary'} rounded-md"
				onclick={toggleBatchMode}
			>
				<RawMdiCheckboxMultipleMarked class="w-4 h-4 mr-1" />
				{$_('common.batchOperations')}
			</button>
		</div>
		
		{#if batchMode && nodesSortedFiltered.length > 0}
			<button
				type="button"
				class="btn btn-sm variant-soft rounded-md"
				onclick={selectedNodeIds.size === nodesSortedFiltered.length ? clearSelection : selectAll}
			>
				{selectedNodeIds.size === nodesSortedFiltered.length ? $_('common.deselectAll') : $_('common.selectAll')}
			</button>
		{/if}
	</div>

	<Outer>
		{#each nodesSortedFiltered as node}
			<Inner 
				{node} 
				selectable={batchMode}
				selected={selectedNodeIds.has(node.id)}
				onToggleSelect={toggleNodeSelection}
			/>
		{/each}
	</Outer>
	
	<BatchOperationsBar 
		selectedNodes={selectedNodeIds}
		allNodes={App.nodes.value}
		onClearSelection={clearSelection}
	/>
	
	<ExportModal bind:show={showExport} />
</Page>
