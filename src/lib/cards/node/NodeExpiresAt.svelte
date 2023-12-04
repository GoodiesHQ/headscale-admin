<script lang="ts">
	import CardListEntry from '../CardListEntry.svelte';
	import type { Node } from '$lib/common/types';
	import { onMount } from 'svelte';
	import { getExpirationMessage } from '$lib/common/funcs';

	import Delete from '$lib/parts/Delete.svelte';
	import { expireNode } from '$lib/common/api';
	import { get } from 'svelte/store';
	import { NodeStore, updateStoreItem } from '$lib/Stores';

	export let node: Node;
	$: diff = getExpirationMessage(node);

	function setMessage() {
		diff = getExpirationMessage(node);
	}

	onMount(() => {
		setMessage();

		const interval = setInterval(() => {
			setMessage();
		}, 1000);

		return () => {
			clearInterval(interval);
		};
	});
</script>

<CardListEntry title="Expires:">
	<div class="flex flex-row items-start text-right justify-end">
		<span class=" {diff.color} items-center">
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
