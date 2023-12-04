<script lang="ts">
	import CardListEntry from '../CardListEntry.svelte';
	import type { Node, Route } from '$lib/common/types';
	import { get } from 'svelte/store';
	import { RouteStore } from '$lib/Stores';
	import { onMount } from 'svelte';
	import NodeRoute from './NodeRoute.svelte';

	export let node: Node;
	$: routes = getNodeRoutes(get(RouteStore));

	function getNodeRoutes(routes: Route[]): Route[] {
		return routes.filter((r) => (r.node ?? r.machine).id == node.id);
	}

	onMount(() => {
		const unsubRouteStore = RouteStore.subscribe((rs) => {
			routes = getNodeRoutes(rs);
		});

		return () => {
			unsubRouteStore();
		};
	});
</script>

<CardListEntry title="Routes:" top>
	<svelte:fragment slot="bottom">
		{#each routes as route}
			<div class="grid grid-cols-12 col-span-12">
				<NodeRoute bind:route />
			</div>
		{/each}
	</svelte:fragment>
</CardListEntry>
