<script lang="ts">
	import { getTime, getTimeDifferenceMessage } from '$lib/common/funcs';
	import type { Node } from '$lib/common/types';
	import { onMount } from 'svelte';
	import CardListEntry from '../CardListEntry.svelte';

	export let node: Node;
	$: lastSeen = getTimeDifferenceMessage(getTime(node.lastSeen));

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
	{lastSeen}
</CardListEntry>
