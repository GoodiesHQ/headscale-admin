<script lang="ts">
	import { Drawer, getDrawerStore } from '@skeletonlabs/skeleton';
	import DrawerEntry from './DrawerEntry.svelte';
	import UserInfo from '$lib/cards/user/UserInfo.svelte';
	import NodeInfo from '$lib/cards/node/NodeInfo.svelte';
	import Navigation from '$lib/Navigation.svelte';
	import { App } from '$lib/States.svelte';

	const drawerStore = getDrawerStore();

</script>

<Drawer>
	<div class="px-4 lg:px-8 pt-4">
		{#if $drawerStore?.id?.startsWith('userDrawer-')}
			<DrawerEntry title={App.users.value.find((u) => u.id === $drawerStore?.meta.id)?.name ?? 'N/A'}>
				<UserInfo user={App.users.value.find((u) => u.id === $drawerStore?.meta.id) || $drawerStore.meta} />
			</DrawerEntry>
		{/if}
		{#if $drawerStore?.id?.startsWith('nodeDrawer-')}
			<DrawerEntry title={App.nodes.value.find((n) => n.id === $drawerStore?.meta.id)?.givenName ?? 'N/A'}>
				<NodeInfo node={App.nodes.value.find((n) => n.id === $drawerStore?.meta.id) || $drawerStore.meta} />
			</DrawerEntry>
		{/if}
		{#if $drawerStore?.id?.startsWith('navDrawer')}
			<DrawerEntry title="Navigation">
				<Navigation />
			</DrawerEntry>
		{/if}
	</div>
</Drawer>
