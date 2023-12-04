<script lang="ts">
	import CardListEntry from '../CardListEntry.svelte';
	import type { Node } from '$lib/common/types';

	export let node: Node;
</script>

<CardListEntry title="IP Addresses:" top>
	<div class="grid grid-cols-1">
		{#each node.ipAddresses as ipAddress}
			<div>{ipAddress}</div>
		{/each}
	</div>
</CardListEntry>
