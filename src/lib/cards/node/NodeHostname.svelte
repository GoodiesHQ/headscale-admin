<script lang="ts">
	import CardListEntry from '../CardListEntry.svelte';
	import type { Node } from '$lib/common/types';

	export let node: Node;
</script>

<CardListEntry title="Hostname:">
	{node.name}
</CardListEntry>
