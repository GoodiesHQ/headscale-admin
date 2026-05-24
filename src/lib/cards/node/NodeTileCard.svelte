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
	import { _ } from 'svelte-i18n';

	type NodeTileCardProps = {
		node: Node,
		selectable?: boolean,
		selected?: boolean,
		onToggleSelect?: (nodeId: string) => void,
	}

	let { 
		node = $bindable(),
		selectable = false,
		selected = false,
		onToggleSelect = () => {},
	}: NodeTileCardProps = $props()

	let lastSeen = $state(getTimeDifferenceMessage(getTime(node.lastSeen)));
	const routeCount = $derived(node.availableRoutes.length);
	const drawerStore = getDrawerStore();
	
	function handleCheckboxClick(event: Event) {
		event.stopPropagation();
		onToggleSelect(node.id);
	}

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

<CardTileContainer onclick={(_) => openDrawer(drawerStore, 'nodeDrawer-' + node.id, node)} classes={selected ? 'ring-2 ring-primary-500' : ''}>
	{#if selectable}
		<div class="absolute top-2 left-2 z-10">
			<input
				type="checkbox"
				checked={selected}
				onclick={handleCheckboxClick}
				class="checkbox"
			/>
		</div>
	{/if}
	<div class="flex justify-between items-center mb-4 mt-2">
		<div class="flex items-center">
			<OnlineNodeIndicator bind:node />
			<span class="ml-2 text-lg font-semibold">{$_('common.id')}: {node.id}</span>
		</div>
		<div class="flex items-center font-bold">
			{node.givenName}
		</div>
	</div>
	<CardTileEntry title={$_('cards.created')}>
		{dateToStr(node.createdAt)}
	</CardTileEntry>
	<CardTileEntry title={$_('cards.lastSeen')}>
		{#if node.online}
			{$_('cards.onlineNow')}
		{:else}
			{lastSeen}
		{/if}
	</CardTileEntry>
	<CardTileEntry title={$_('cards.user')}>
		<div class="flex flex-row gap-3 items-center">
			{node.user.name}
			<OnlineUserIndicator bind:user={node.user} />
		</div>
	</CardTileEntry>
	<CardTileEntry title={$_('cards.ipv4Address')}>
		<div class="flex flex-row gap-3 items-center">
			{node.ipAddresses.filter((s) => /^\d+\.\d+\.\d+\.\d+$/.test(s)).at(0)}
		</div>
	</CardTileEntry>
	<CardTileEntry title={$_('cards.routes')}>
		{routeCount}
	</CardTileEntry>
	<CardTileEntry title={$_('cards.tags')}>
		<div class="flex flex-wrap gap-1 justify-end">
			{#if node.tags.length > 0}
				{#each node.tags as tag}
					<span class="badge variant-soft p-1 text-[10px] leading-none">{tag.replace('tag:', '')}</span>
				{/each}
			{:else}
				<span class="opacity-50">-</span>
			{/if}
		</div>
	</CardTileEntry>
	<hr style="background-color: #{color}" class="w-full h-0.5 mx-auto my-4 border-0 rounded" />
</CardTileContainer>
