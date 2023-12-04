<script lang="ts">
	import CardListEntry from '../CardListEntry.svelte';
	import { NodeStore } from '$lib/Stores';
	import type { Node, User } from '$lib/common/types';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import OnlineNodeIndicator from '$lib/parts/OnlineNodeIndicator.svelte';

	export let user: User;
	export let title = 'Nodes:';

	$: nodes = filter(get(NodeStore));

	function filter(m: Node[]): Node[] {
		return m.filter((m) => m.user.id == user.id);
	}

	onMount(() => {
		const unsubNodeStore = NodeStore.subscribe((m) => {
			nodes = filter(m);
		});

		return () => {
			unsubNodeStore();
		};
	});
</script>

<CardListEntry {title}>
	{#each nodes as node}
		<div class="flex flex-row items-center gap-3 justify-end">
			{node.givenName} ({node.name})
			<OnlineNodeIndicator {node} />
		</div>
	{/each}
</CardListEntry>
