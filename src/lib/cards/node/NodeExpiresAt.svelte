<script lang="ts">
	import CardListEntry from '../CardListEntry.svelte';
	import type { Node } from '$lib/common/types';
	import { onMount } from 'svelte';
	import { getTimeDifference, getTime, getTimeDifferenceColor } from '$lib/common/funcs';

	import Delete from '$lib/parts/Delete.svelte';
	import { expireNode } from '$lib/common/api';
	import { NodeStore, updateStoreItem } from '$lib/Stores';

	export let node: Node;

	$: diff = getTimeDifference(getTime(node.expiry ?? ''));

	onMount(() => {
		const interval = setInterval(() => {
			diff = getTimeDifference(getTime(node.expiry ?? ''));
		}, 1000);

		return () => {
			clearInterval(interval);
		};
	});
</script>

<CardListEntry title="Expires:">
	<div class="flex flex-row items-start text-right justify-end">
		<span class=" {getTimeDifferenceColor(diff)} items-center">
			{diff.message}
		</span>
		<span class="items-center">
			<Delete
				func={async () => {
					const nodeNew = await expireNode(node);
					updateStoreItem(NodeStore, nodeNew);
				}}
			/>
		</span>
	</div>
</CardListEntry>
