<script lang="ts">
	import CardListEntry from '../CardListEntry.svelte';
	import Delete from '$lib/parts/Delete.svelte';
	import type { Node } from '$lib/common/types';
	import { getTimeDifference, getTime, getTimeDifferenceColor } from '$lib/common/funcs';
	import { expireNode } from '$lib/common/api';
	import { onMount } from 'svelte';
	import { App } from '$lib/States.svelte';

	type NodeExpiresAtProps = {
		node: Node,
		loading?: boolean,
	}

	let { node, loading = $bindable(false) }: NodeExpiresAtProps = $props()

	let diff = $state(getTimeDifference(getTime(node.expiry ?? '')));

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
					loading = true
					try{
						App.updateValue(App.nodes, await expireNode(node))
					} finally {
						loading = false
					}
				}}
			/>
		</span>
	</div>
</CardListEntry>
