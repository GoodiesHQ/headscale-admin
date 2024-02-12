<script lang="ts">
	import type { Node } from '$lib/common/types';
	import { onMount } from 'svelte';
	import CardListEntry from '../CardListEntry.svelte';
	import { InputChip, getToastStore } from '@skeletonlabs/skeleton';
	import { NodeStore, updateStoreItem } from '$lib/Stores';
	import { setNodeTags } from '$lib/common/api';
	import { toastError } from '$lib/common/funcs';

	export let node: Node;

	$: tags = node.forcedTags.map((tag) => tag.replace('tag:', ''));
	$: tags2 = node.validTags.map((tag) => tag.replace('tag:', ''));
	$: tags3 = node.invalidTags.map((tag) => tag.replace('tag:', ''));
	$: disabled = false;

	const ToastStore = getToastStore();

	async function saveTags() {
		disabled = true;
		try {
			const n = await setNodeTags(node, tags);
			await updateStoreItem(NodeStore, n);
		} catch (e) {
			toastError('Invalid Tags: ' + e, ToastStore);
		} finally {
			tags = node.forcedTags.map((tag) => tag.replace('tag:', ''));
			disabled = false;
		}
	}
</script>

<CardListEntry top title="Tags:">
	<InputChip
		name="tags-node-{node.id}"
		{disabled}
		value={tags}
		class="w-full"
		chips="variant-filled-success"
		on:add={saveTags}
		on:remove={saveTags}
	/>
	<InputChip
		name="tags2-node-{node.id}"
		disabled
		value={tags2}
		class="w-full mt-2"
		chips="variant-filled-success"
	/>
	<InputChip
		name="tags3-node-{node.id}"
		disabled
		value={tags3}
		class="w-full mt-2"
		chips="variant-filled-success"
	/>
</CardListEntry>
