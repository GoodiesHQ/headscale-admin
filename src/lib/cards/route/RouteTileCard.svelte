<script lang="ts">
	import type { Node } from '$lib/common/types';
	import { onMount } from 'svelte';
	import {
		getTime,
		getTimeDifferenceMessage,
	} from '$lib/common/funcs';
	import CardTileContainer from '../CardTileContainer.svelte';
	import CardTileEntry from '../CardTileEntry.svelte';
	import OnlineNodeIndicator from '$lib/parts/OnlineNodeIndicator.svelte';
	import { _ } from 'svelte-i18n';
	import RouteInfo from './RouteInfo.svelte';

	type RouteTileCardProps = {
		node: Node,
	}

	let { node = $bindable() }: RouteTileCardProps = $props()

	let lastSeen = $state(getTimeDifferenceMessage(getTime(node.lastSeen)));

	onMount(() => {
		const lastSeenInterval = setInterval(() => {
			lastSeen = getTimeDifferenceMessage(getTime(node.lastSeen));
		}, 1000);

		return () => {
			clearInterval(lastSeenInterval);
		};
	});
</script>

<CardTileContainer classes="">
	<div class="flex justify-between items-center mb-4 mt-2 align-text-top">
		<div class="flex items-center">
			<OnlineNodeIndicator bind:node />
			<span class="ml-2 text-lg font-semibold">{$_('common.id')}: {node.id}</span>
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
