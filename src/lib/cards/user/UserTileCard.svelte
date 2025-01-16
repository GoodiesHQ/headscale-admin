<script lang="ts">
	import { xxHash32 } from 'js-xxhash';
	import type { User, Node } from '$lib/common/types';
	import { dateToStr, openDrawer } from '$lib/common/funcs';
	import { getDrawerStore } from '@skeletonlabs/skeleton';
	import CardTileContainer from '../CardTileContainer.svelte';
	import OnlineUserIndicator from '$lib/parts/OnlineUserIndicator.svelte';
	import { App } from '$lib/States.svelte';

	type UserTileCardProps = {
		user: User,
	}
	let { user = $bindable() }: UserTileCardProps = $props()

	const nodeCount = $derived(getNodeCount(user, App.nodes.value)); // react on user or node change
	const drawerStore = getDrawerStore();

	function getNodeCount(user: User, nodes: Node[]): number {
		return nodes.filter((n) => n.user.id === user.id).length;
	}

	let color = $state(
		(xxHash32(user.id + ':' + user.name, 0xbeefbabe) & 0xff_ff_ff)
		.toString(16)
		.padStart(6, '0')
	);
</script>

<CardTileContainer onclick={(_) => openDrawer(drawerStore, 'userDrawer-' + user.id, user)}>
	<div class="flex justify-between items-center mb-4 mt-2">
		<div class="flex items-center">
			<OnlineUserIndicator bind:user />
			<span class="ml-2 text-lg font-semibold">ID: {user.id}</span>
		</div>
		<div class="flex items-center font-bold">
			{user.name}
		</div>
	</div>
	<div class="flex justify-between items-center mb-2 mt-2">
		<div class="flex items-center font-semibold">Created:</div>
		<div class="flex items-center">
			{dateToStr(new Date(user.createdAt))}
		</div>
	</div>
	<div class="flex justify-between items-center mb-2 mt-2">
		<div class="flex items-center font-semibold">Nodes:</div>
		<div class="flex items-center">
			{nodeCount}
		</div>
	</div>
	<hr style="background-color: #{color}" class="w-full h-0.5 mx-auto my-4 border-0 rounded" />
</CardTileContainer>
