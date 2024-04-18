<script lang="ts">
	import type { Node, Route } from '$lib/common/types';
	import { onMount } from 'svelte';
	import { RouteStore } from '$lib/Stores';
	import {
		getTime,
		getTimeDifferenceMessage,
	} from '$lib/common/funcs';
	import CardTileContainer from '../CardTileContainer.svelte';
	import CardTileEntry from '../CardTileEntry.svelte';
	import OnlineNodeIndicator from '$lib/parts/OnlineNodeIndicator.svelte';
	import { get } from 'svelte/store';
	import NodeRoutes from '../node/NodeRoutes.svelte';
	import RouteInfo from './RouteInfo.svelte';

	export let node: Node;
	let routes: Route[] = get(RouteStore);
	$: lastSeen = getTimeDifferenceMessage(getTime(node.lastSeen));

	onMount(() => {
		const lastSeenInterval = setInterval(() => {
			lastSeen = getTimeDifferenceMessage(getTime(node.lastSeen));
		}, 1000);
		const unsubRouteStore = RouteStore.subscribe((rs) => (routes = rs));
		return () => {
			clearInterval(lastSeenInterval);
			unsubRouteStore();
		};
	});
</script>

<CardTileContainer classes="">
	<div class="flex justify-between items-center mb-4 mt-2 align-text-top">
		<div class="flex items-center">
			<OnlineNodeIndicator bind:node />
			<span class="ml-2 text-lg font-semibold">ID: {node.id}</span>
		</div>
		<div class="flex items-center font-bold">
			{node.givenName}
		</div>
	</div>
	<RouteInfo bind:node />
	<!--CardTileEntry>
		<NodeRoutes showTitle={false} showDelete={false} bind:node />
	</CardTileEntry-->
	<!--hr style="background-color: #{color}" class="w-full h-0.5 mx-auto my-4 border-0 rounded" /-->
</CardTileContainer>
