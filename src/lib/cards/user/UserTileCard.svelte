<script lang="ts">
	import { xxHash32 } from 'js-xxhash';
	import { type User, type Node, getUserDisplay } from '$lib/common/types';
	import { dateToStr, openDrawer } from '$lib/common/funcs';
	import { getDrawerStore } from '@skeletonlabs/skeleton';
	import CardTileContainer from '../CardTileContainer.svelte';
	import OnlineUserIndicator from '$lib/parts/OnlineUserIndicator.svelte';
	import { App } from '$lib/States.svelte';
	import { _ } from 'svelte-i18n';

	type UserTileCardProps = {
		user: User,
	}
	let { user = $bindable() }: UserTileCardProps = $props()

	const nodeCount = $derived(App.nodes.value.filter((n) => n.user.id === user.id).length);
	const drawerStore = getDrawerStore();
	const color = $derived(
		(xxHash32(user.id + ':' + user.name, 0xbeefbabe) & 0xff_ff_ff)
		.toString(16)
		.padStart(6, '0')
	);
</script>

<CardTileContainer onclick={(_) => openDrawer(drawerStore, 'userDrawer-' + user.id, user)}>
	<div class="flex justify-between items-center mb-4 mt-2">
		<div class="flex items-center">
			<OnlineUserIndicator bind:user />
			<span class="ml-2 text-lg font-semibold">{$_('common.id')}: {user.id}</span>
		</div>
		<div class="flex items-center font-bold">
			{getUserDisplay(user)}
		</div>
	</div>
	<div class="flex justify-between items-center mb-2 mt-2">
		<div class="flex items-center font-semibold">{$_('cards.created')}</div>
		<div class="flex items-center">
			{dateToStr(new Date(user.createdAt))}
		</div>
	</div>
	<div class="flex justify-between items-center mb-2 mt-2">
		<div class="flex items-center font-semibold">{$_('cards.nodes')}</div>
		<div class="flex items-center">
			{nodeCount}
		</div>
	</div>
	<hr style="background-color: #{color}" class="w-full h-0.5 mx-auto my-4 border-0 rounded" />
</CardTileContainer>
