<script lang="ts">
	import CardListEntry from '../CardListEntry.svelte';
	import type { Node, Route } from '$lib/common/types';
	import { debug } from '$lib/common/debug'
	import { get } from 'svelte/store';
	import { RouteStore, updateStoreItem } from '$lib/Stores';
	import { onMount } from 'svelte';
	import NodeRoute from './NodeRoute.svelte';
	import ToggleOff from '~icons/mdi/toggle-switch-variant-off';
	import ToggleOn from '~icons/mdi/toggle-switch-variant';
	import test from 'node:test';
	import CardSeparator from '../CardSeparator.svelte';
	import { disableRoute, enableRoute } from '$lib/common/api';

	export let node: Node;
	export let showTitle: boolean = true;
	export let showDelete: boolean = true;

	$: routes = getNodeRoutes(get(RouteStore), node.id);

	function getNodeRoutes(routes: Route[], nodeID: string): Route[] {
		return routes.filter((r) => (r.node ?? r.machine).id == nodeID);
	}

	async function toggleAll(routes: Route[], state: 'on' | 'off') {
		const toggle = state === 'on' ? enableRoute : disableRoute;
		try{
			async function toggleRoute(r: Route) {
				await toggle(r);
				r.enabled = state === 'on';
				updateStoreItem(RouteStore, r);
			}
			const promises = routes.map(r => toggleRoute(r))
			await Promise.all(promises)
		} catch (e) {
			debug(e)
		}
	}

	onMount(() => {
		const unsubRouteStore = RouteStore.subscribe((rs) => {
			routes = getNodeRoutes(rs, node.id);
		});

		return () => {
			unsubRouteStore();
		};
	});
</script>

<CardListEntry title={showTitle ? "Routes:" : undefined} valueClasses="justify-right text-right" top>
	<div class="mb-2">
		<button class="btn btn-sm items-end gap-1 px-0 ml-4 text-success-700 dark:text-success-400" disabled={!node.online} on:click={() => {toggleAll(routes, 'on')}}>
			<ToggleOn />
		</button>
		<button class="btn btn-sm items-end gap-1 px-0 ml-4 text-error-600 dark:text-error-400" disabled={!node.online} on:click={() => {toggleAll(routes, 'off')}}>
			<ToggleOff />
		</button>
	</div>
	<svelte:fragment slot="bottom">
		{#each routes as route}
			<div class="grid grid-cols-12 col-span-12 font-thin">
				<NodeRoute bind:route bind:showDelete {node} />
			</div>
		{/each}
	</svelte:fragment>
</CardListEntry>
