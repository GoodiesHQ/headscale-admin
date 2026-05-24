<script lang="ts">
	import CardListEntry from '../CardListEntry.svelte';
	import type { Node } from '$lib/common/types';
	import { _ } from 'svelte-i18n';

	type NodeHostnameProps = {
		node: Node,
	}
	let { node }: NodeHostnameProps = $props()

</script>

<CardListEntry title={$_('cards.hostname')}>
	{node.name}
</CardListEntry>
