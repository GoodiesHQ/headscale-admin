<script lang="ts">
	import { xxHash32 } from 'js-xxhash';
	import type { Node } from '$lib/common/types';
	import { onMount } from 'svelte';
	import {
		dateToStr,
		getTime,
		getTimeDifferenceMessage,
		openDrawer,
	} from '$lib/common/funcs';
	import { getDrawerStore } from '@skeletonlabs/skeleton';
	import CardTileContainer from '../CardTileContainer.svelte';
	import CardTileEntry from '../CardTileEntry.svelte';
	import OnlineNodeIndicator from '$lib/parts/OnlineNodeIndicator.svelte';
	import OnlineUserIndicator from '$lib/parts/OnlineUserIndicator.svelte';
	import { App } from '$lib/States.svelte';

	type NodeTileCardProps = {
		node: Node,
	}

	let { node = $bindable() }: NodeTileCardProps = $props()

	let lastSeen = $state(getTimeDifferenceMessage(getTime(node.lastSeen)));
	const routeCount = $derived(node.availableRoutes.length);
	const drawerStore = getDrawerStore();

	let color = $derived(
		(xxHash32(node.id + ':' + node.givenName, 0xbeefbabe) & 0xff_ff_ff)
		.toString(16)
		.padStart(6, '0')
	);

	onMount(() => {
		const lastSeenInterval = setInterval(() => {
			lastSeen = getTimeDifferenceMessage(getTime(node.lastSeen));
		}, 1000);

		return () => {
			clearInterval(lastSeenInterval);
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
		{#if node.online}
			Online Now
		{:else}
			{lastSeen}
		{/if}
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
