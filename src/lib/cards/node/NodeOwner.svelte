<script lang="ts">
	import CardListEntry from '../CardListEntry.svelte';
	import type { Node } from '$lib/common/types';
	import OnlineUserIndicator from '$lib/parts/OnlineUserIndicator.svelte';

	export let node: Node;
</script>

<CardListEntry title="Owner:">
	<div class="flex flex-row items-center gap-3 justify-end">
		{node.user.name}
		<OnlineUserIndicator user={node.user} />
	</div>
</CardListEntry>
