<script lang="ts">
	import CardListEntry from '../CardListEntry.svelte';
	import type { Node, User } from '$lib/common/types';
	import OnlineNodeIndicator from '$lib/parts/OnlineNodeIndicator.svelte';
	import { openDrawer } from '$lib/common/funcs';
	import { getDrawerStore } from '@skeletonlabs/skeleton';
	import { App } from '$lib/States.svelte';

	type UserListNodesProps = {
		user: User,
		title?: string,
	}
	let { user = $bindable(), title = 'Nodes:'}: UserListNodesProps = $props();

	const drawerStore = getDrawerStore();

	const filteredNodes = $derived(filter(App.users.value, user, App.nodes.value));

	function filter(us: User[], user: User, ns: Node[]): Node[] {
		if (us.filter((u) => u.id == user.id).length == 1) {
			return ns.filter((ns) => ns.user.id == user.id);
		}
		return [];
	}
</script>

<CardListEntry {title}>
	{#each filteredNodes as node}
		<div class="flex flex-row items-center gap-3 justify-end">
			<a
				href=" "
				onclick={() => {
					openDrawer(drawerStore, 'nodeDrawer-' + node.id, node);
				}}
			>
				{node.givenName} ({node.name})
			</a>
			<OnlineNodeIndicator {node} />
		</div>
	{/each}
</CardListEntry>
