<script lang="ts">
	import { xxHash32 } from 'js-xxhash';
	import type { Node, Route } from '$lib/common/types';
	import { onMount } from 'svelte';
	import { RouteStore } from '$lib/Stores';
	import {
		dateToStr,
		getTimeDifference,
		getTime,
		getTimeDifferenceMessage,
		openDrawer,
	} from '$lib/common/funcs';
	import { getDrawerStore, type DrawerSettings } from '@skeletonlabs/skeleton';
	import CardTileContainer from '../CardTileContainer.svelte';
	import CardTileEntry from '../CardTileEntry.svelte';
	import OnlineNodeIndicator from '$lib/parts/OnlineNodeIndicator.svelte';
	import OnlineUserIndicator from '$lib/parts/OnlineUserIndicator.svelte';
	import { get } from 'svelte/store';

	export let node: Node;
	let routes: Route[] = get(RouteStore);
	$: lastSeen = getTimeDifferenceMessage(getTime(node.lastSeen));
	$: routeCount = getRouteCount(routes, node);
	const drawerStore = getDrawerStore();

	$: color = (xxHash32(node.id + ':' + node.givenName, 0xbeefbabe) & 0xff_ff_ff)
		.toString(16)
		.padStart(6, '0');

	function getRouteCount(routes: Route[], node: Node) {
		return routes.filter((r) => (r.node ?? r.machine).id == node.id).length;
	}

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

<CardTileContainer onclick={(_) => openDrawer(drawerStore, 'nodeDrawer-' + node.id, node)}>
	<div class="flex justify-between items-center mb-4 mt-2">
		<div class="flex items-center">
			<OnlineNodeIndicator bind:node />
			<span class="ml-2 text-lg font-semibold">ID: {node.id}</span>
		</div>
		<div class="flex items-center font-bold">
			{node.givenName}
		</div>
	</div>
	<CardTileEntry title="Created:">
		{dateToStr(node.createdAt)}
	</CardTileEntry>
	<CardTileEntry title="Last Seen:">
		{lastSeen}
	</CardTileEntry>
	<CardTileEntry title="User:">
		<div class="flex flex-row gap-3 items-center">
			{node.user.name}
			<OnlineUserIndicator bind:user={node.user} />
		</div>
	</CardTileEntry>
	<CardTileEntry title="IPv4 Address:">
		<div class="flex flex-row gap-3 items-center">
			{node.ipAddresses.filter((s) => /^\d+\.\d+\.\d+\.\d+$/.test(s)).at(0)}
		</div>
	</CardTileEntry>
	<CardTileEntry title="Routes:">
		{routeCount}
	</CardTileEntry>
	<hr style="background-color: #{color}" class="w-full h-0.5 mx-auto my-4 border-0 rounded" />
</CardTileContainer>
