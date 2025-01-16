<script lang="ts">
	import { getTime, getTimeDifferenceMessage } from '$lib/common/funcs';
	import type { Node } from '$lib/common/types';
	import { onMount } from 'svelte';
	import CardListEntry from '../CardListEntry.svelte';

	type NodeLastSeenProps = {
		node: Node,
	}
	let { node }: NodeLastSeenProps = $props()

	let lastSeen = $state(getTimeDifferenceMessage(getTime(node.lastSeen)));

	onMount(() => {
		const interval = setInterval(() => {
			lastSeen = getTimeDifferenceMessage(getTime(node.lastSeen));
		}, 1000);
		return () => {
			clearInterval(interval);
		};
	});
</script>

<CardListEntry title="Last Seen:">
	{#if node.online}
		Online Now
	{:else}
		{lastSeen}
	{/if}
</CardListEntry>
