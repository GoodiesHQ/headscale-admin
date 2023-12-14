<script lang="ts">
	import { Drawer, getDrawerStore } from '@skeletonlabs/skeleton';
	import DrawerEntry from './DrawerEntry.svelte';
	import UserInfo from '$lib/cards/user/UserInfo.svelte';
	import { get } from 'svelte/store';
	import { NodeStore, UserStore } from '$lib/Stores';
	import { onMount } from 'svelte';
	import NodeInfo from '$lib/cards/node/NodeInfo.svelte';
	import Navigation from '$lib/Navigation.svelte';

	const drawerStore = getDrawerStore();

	$: users = get(UserStore);
	$: nodes = get(NodeStore);

	onMount(() => {
		const unsubUserStore = UserStore.subscribe((us) => (users = us));
		const unsubNodeStore = NodeStore.subscribe((ns) => (nodes = ns));
		return () => {
			unsubUserStore();
			unsubNodeStore();
		};
	});
</script>

<Drawer>
	<div class="px-4 lg:px-8 pt-4">
		{#if $drawerStore?.id?.startsWith('userDrawer-')}
			<DrawerEntry title={users.find((u) => u.id === $drawerStore?.meta.id)?.name ?? 'N/A'}>
				<UserInfo user={users.find((u) => u.id === $drawerStore?.meta.id) || $drawerStore.meta} />
			</DrawerEntry>
		{/if}
		{#if $drawerStore?.id?.startsWith('nodeDrawer-')}
			<DrawerEntry title={nodes.find((n) => n.id === $drawerStore?.meta.id)?.givenName ?? 'N/A'}>
				<NodeInfo node={nodes.find((n) => n.id === $drawerStore?.meta.id) || $drawerStore.meta} />
			</DrawerEntry>
		{/if}
		{#if $drawerStore?.id?.startsWith('navDrawer')}
			<DrawerEntry title="Navigation">
				<Navigation />
			</DrawerEntry>
		{/if}
	</div>
</Drawer>
