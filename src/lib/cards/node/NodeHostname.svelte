<script lang="ts">
	import CardListEntry from '../CardListEntry.svelte';
	import type { Node } from '$lib/common/types';

	type NodeHostnameProps = {
		node: Node,
	}
	let { node }: NodeHostnameProps = $props()

</script>

<CardListEntry title="Hostname:">
	{node.name}
</CardListEntry>
