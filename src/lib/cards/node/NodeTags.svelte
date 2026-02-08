<script lang="ts">
	import { InputChip, getToastStore } from '@skeletonlabs/skeleton';

	import type { Node } from '$lib/common/types';
	import { setNodeTags } from '$lib/common/api';
	import { toastError } from '$lib/common/funcs';
	import CardListEntry from '../CardListEntry.svelte';



	import { App } from '$lib/States.svelte';

	type NodeTagsProps = {
		node: Node,
	}

	let {
		node = $bindable(),
	}: NodeTagsProps = $props()

	const tags = $derived(node.tags.map((tag) => tag.replace('tag:', '')));

	let disabled = $state(false);

	const ToastStore = getToastStore();

	async function saveTags() {
		disabled = true;
		try {
			const n = await setNodeTags(node, tags);
			App.updateValue(App.nodes, n);
		} catch (e) {
			toastError('Invalid Tags: ' + e, ToastStore);
		} finally {
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
</CardListEntry>
