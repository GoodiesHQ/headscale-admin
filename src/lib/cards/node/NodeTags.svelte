<script lang="ts">
	import { InputChip, getToastStore, getModalStore } from '@skeletonlabs/skeleton';
	import type { ModalSettings } from '@skeletonlabs/skeleton';

	import type { Node } from '$lib/common/types';
	import { setNodeTags } from '$lib/common/api';
	import { toastError, toastWarning } from '$lib/common/funcs';
	import DOMPurify from 'dompurify';
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
		// Prevent removing all tags from a tagged node (must have at least one tag for identity)
		if (!node.user && tags.length === 0) {
			const modal: ModalSettings = {
				type: 'alert',
				title: 'Cannot Remove All Tags',
				body: `<p class="mb-2">Tagged nodes must have <strong>at least one tag</strong> for identity.</p>
					   <p class="mb-2">To remove tags from this node, you must:</p>
					   <ol class="list-decimal ml-6">
					     <li>Assign a user to this node (which will remove all tags), or</li>
					     <li>Keep at least one tag assigned</li>
					   </ol>
					   <p class="mt-2 text-sm text-surface-600 dark:text-surface-400">This is a Headscale 0.28 requirement for tagged devices.</p>`,
			};
			ModalStore.trigger(modal);
			disabled = false;
			return;
		}

		// Warn user if they're about to remove user ownership by applying tags
		if (node.user && tags.length > 0 && node.tags.length === 0) {
			const safeName = DOMPurify.sanitize(node.user.name);
			const modal: ModalSettings = {
				type: 'confirm',
				title: 'Remove User Ownership?',
				body: `<p class="mb-2">Applying tags to this node will <strong>remove user ownership</strong>.</p>
					   <p class="mb-2">Current owner: <strong>${safeName}</strong></p>
					   <p>Tags and user accounts are mutually exclusive. This node will become a tag-based identity.</p>
					   <p class="mt-2 text-sm text-surface-600 dark:text-surface-400"><strong>Note:</strong> Once tagged, the node must always have at least one tag.</p>`,
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
			⚠️ Adding tags will remove user ownership ({node.user.name}). Once tagged, the node must always have at least one tag.
		</div>
	{:else if !node.user && tags.length > 0}
		<div class="text-xs text-surface-500 dark:text-surface-400 mt-2">
			ℹ️ Tagged nodes must have at least one tag for identity. To remove all tags, assign a user instead.
		</div>
	{/if}
</CardListEntry>
