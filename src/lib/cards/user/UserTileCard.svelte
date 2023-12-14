<script lang="ts">
	import { xxHash32 } from 'js-xxhash';
	import type { User } from '$lib/common/types';
	import { onMount } from 'svelte';
	import { NodeStore } from '$lib/Stores';
	import { dateToStr } from '$lib/common/funcs';
	import { getDrawerStore, type DrawerSettings } from '@skeletonlabs/skeleton';
	import CardTileContainer from '../CardTileContainer.svelte';
	import OnlineUserIndicator from '$lib/parts/OnlineUserIndicator.svelte';
	import { debug } from '$lib/common/debug';

	export let user: User;
	let nodeCount: number;
	const drawerStore = getDrawerStore();

	$: drawerSettings = {
		id: 'userDrawer-' + user.id,
		position: 'right',
		width: 'w-10/12 md:w-9/12 lg:w-8/12 xl:w-6/12',
		padding: '',
		meta: user,
	} as DrawerSettings;

	$: color = (xxHash32(user.id + ':' + user.name, 0xbeefbabe) & 0xff_ff_ff)
		.toString(16)
		.padStart(6, '0');

	onMount(() => {
		const unsubNodeStore = NodeStore.subscribe((nodes) => {
			nodeCount = nodes.filter((m) => m.user.id == user.id).length;
		});
		return () => {
			unsubNodeStore();
		};
	});
</script>

<CardTileContainer onclick={(_) => drawerStore.open(drawerSettings)}>
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
