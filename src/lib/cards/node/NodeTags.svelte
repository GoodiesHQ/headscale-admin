<script lang="ts">
	import { InputChip, getToastStore, getModalStore } from '@skeletonlabs/skeleton';
	import type { ModalSettings } from '@skeletonlabs/skeleton';

	import type { Node } from '$lib/common/types';
	import { setNodeTags } from '$lib/common/api';
	import { toastError, toastWarning } from '$lib/common/funcs';
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
	const ModalStore = getModalStore();

	async function applyTags() {
		disabled = true;
		try {
			const n = await setNodeTags(node, tags);
			App.updateValue(App.nodes, n);
			if (node.user && !n.user) {
				toastWarning(
					`Tags applied. User ownership removed (tags and users are mutually exclusive).`,
					ToastStore
				);
			}
		} catch (e) {
			toastError('Invalid Tags: ' + e, ToastStore);
		} finally {
			disabled = false;
		}
	}

	async function saveTags() {
		// Warn user if they're about to remove user ownership by applying tags
		if (node.user && tags.length > 0 && node.tags.length === 0) {
			const modal: ModalSettings = {
				type: 'confirm',
				title: 'Remove User Ownership?',
				body: `<p class="mb-2">Applying tags to this node will <strong>remove user ownership</strong>.</p>
					   <p class="mb-2">Current owner: <strong>${node.user.name}</strong></p>
					   <p>Tags and user accounts are mutually exclusive. This node will become a tag-based identity.</p>`,
				response: (confirmed: boolean) => {
					if (confirmed) {
						applyTags();
					} else {
						disabled = false;
					}
				},
			};
			ModalStore.trigger(modal);
		} else {
			await applyTags();
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
	{#if node.user && tags.length === 0}
		<div class="text-xs text-surface-500 dark:text-surface-400 mt-2">
			Note: Adding tags will remove user ownership ({node.user.name})
		</div>
	{/if}
</CardListEntry>
