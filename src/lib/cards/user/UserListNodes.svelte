<script lang="ts">
	import CardListEntry from '../CardListEntry.svelte';
	import { NodeStore, UserStore } from '$lib/Stores';
	import type { Node, User } from '$lib/common/types';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import OnlineNodeIndicator from '$lib/parts/OnlineNodeIndicator.svelte';

	export let user: User;
	export let title = 'Nodes:';

	$: nodes = get(NodeStore);
	$: users = get(UserStore);
	$: filteredNodes = filter(users, user, nodes); // react on users or nodes

	function filter(us: User[], user: User, ns: Node[]): Node[] {
		if (us.filter((u) => u.id == user.id).length == 1) {
			return ns.filter((ns) => ns.user.id == user.id);
		}
		return [];
	}

	onMount(() => {
		const unsubUserStore = UserStore.subscribe((us) => (users = us));
		const unsubNodeStore = NodeStore.subscribe((ns) => (nodes = ns));
		return () => {
			unsubUserStore();
			unsubNodeStore();
		};
	});
</script>

<CardListEntry {title}>
	{#each filteredNodes as node}
		<div class="flex flex-row items-center gap-3 justify-end">
			{node.givenName} ({node.name})
			<OnlineNodeIndicator {node} />
		</div>
	{/each}
</CardListEntry>
