<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { _ } from 'svelte-i18n';
	import Page from '$lib/page/Page.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';
	import NodeInfo from '$lib/cards/node/NodeInfo.svelte';
	import type { Node } from '$lib/common/types';
	import { getNode } from '$lib/common/api';
	import { App } from '$lib/States.svelte';
	
	// icons
	import RawMdiArrowLeft from '~icons/mdi/arrow-left';

	let node = $state<Node | null>(null);
	let loading = $state(false);
	let notFound = $state(false);

	const nodeId = $derived(page.params.id ?? '');

	async function loadNode() {
		if (!nodeId) return;
		loading = true;
		notFound = false;
		try {
			const local = App.nodes.value.find((n) => n.id === nodeId);
			if (local) {
				node = local;
			}
			const fetched = await getNode(nodeId);
			node = fetched;
			App.updateValue(App.nodes, fetched);
		} catch (error) {
			notFound = true;
		} finally {
			loading = false;
		}
	}

	onMount(loadNode);

	$effect(() => {
		if (nodeId) {
			loadNode();
		}
	});
</script>

<Page classes="items-start">
	<div class="max-w-4xl mx-auto p-6">
		<a class="btn btn-sm variant-ghost-primary mb-4" href={`${base}/nodes`}>
			<RawMdiArrowLeft class="w-4 h-4 mr-1" />
			{$_('common.backToNodes')}
		</a>
		
		<PageHeader title={node ? node.givenName : $_('navigation.nodes')} />

		{#if loading && !node}
			<div class="text-sm text-gray-500">{$_('common.loading')}</div>
		{:else if notFound}
			<div class="text-sm text-error-500">{$_('common.notFound')}</div>
		{:else if node}
			<div class="card p-4 shadow">
				<NodeInfo {node} loading={loading} />
			</div>
		{/if}
	</div>
</Page>
