<script lang="ts">
	import { getTime, getTimeDifferenceMessage } from '$lib/common/funcs';
	import type { Node } from '$lib/common/types';
	import { onMount } from 'svelte';
	import CardListEntry from '../CardListEntry.svelte';
	import { _ } from 'svelte-i18n';

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

<CardListEntry title={$_('cards.lastSeen')}>
	{#if node.online}
		{$_('cards.onlineNow')}
	{:else}
		{lastSeen}
	{/if}
</CardListEntry>
