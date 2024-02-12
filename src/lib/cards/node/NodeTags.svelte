<script lang="ts">
	import type { Node } from '$lib/common/types';
	import CardListEntry from '../CardListEntry.svelte';
	import { InputChip, getToastStore } from '@skeletonlabs/skeleton';
	import { NodeStore, updateStoreItem } from '$lib/Stores';
	import { setNodeTags } from '$lib/common/api';
	import { toastError } from '$lib/common/funcs';

	export let node: Node;

	$: tagsForced = node.forcedTags.map((tag) => tag.replace('tag:', ''));
	$: tagsValid = node.validTags.map((tag) => tag.replace('tag:', ''));
	$: tagsInvalid = node.invalidTags.map((tag) => tag.replace('tag:', ''));
	$: disabled = false;

	const ToastStore = getToastStore();

	async function saveTags() {
		disabled = true;
		try {
			const n = await setNodeTags(node, tagsForced);
			n.validTags = [...tagsValid];
			n.invalidTags = [...tagsInvalid];
			await updateStoreItem(NodeStore, n);
		} catch (e) {
			toastError('Invalid Tags: ' + e, ToastStore);
		} finally {
			tagsForced = node.forcedTags.map((tag) => tag.replace('tag:', ''));
			disabled = false;
		}
	}
</script>

<div class="space-y-4">
	<CardListEntry top title="Tags:">
		<InputChip
			name="tags-forced-node-{node.id}"
			{disabled}
			value={tagsForced}
			class="w-full"
			chips="variant-filled-success"
			on:add={saveTags}
			on:remove={saveTags}
		/>
	</CardListEntry>
	<CardListEntry top title="Assigned Tags:">
		<div class="space-x-2 space-y-1">
			{#each tagsValid as tag}
				<button type="button" class="chip variant-filled-success">{tag}</button>
			{/each}
		</div>
	</CardListEntry>
	<CardListEntry top title="Prevented Tags:">
		<div class="space-x-2 space-y-1">
			{#each tagsInvalid as tag}
				<button type="button" class="chip variant-filled-error">{tag}</button>
			{/each}
		</div>
	</CardListEntry>
</div>
