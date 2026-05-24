<script lang="ts">
	import { InputChip, getToastStore, getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
	import { untrack } from 'svelte';
	import type { Node } from '$lib/common/types';
	import { setNodeTags } from '$lib/common/api';
	import { toastError, toastSuccess, isValidTag } from '$lib/common/funcs';
	import { localizeError } from '$lib/common/errors';
	import { debug } from '$lib/common/debug';
	import CardListEntry from '../CardListEntry.svelte';
	import { _ } from 'svelte-i18n';

	import { App } from '$lib/States.svelte';
	import { getPolicy } from '$lib/common/api';
	import JWCC from 'json5';
	import { ACLBuilder, type ACL } from '$lib/common/acl.svelte';

	type NodeTagsProps = {
		node: Node,
	}

	let {
		node = $bindable(),
	}: NodeTagsProps = $props()

	let tags = $state(node.tags.map((tag) => tag.replace('tag:', '')));

	$effect(() => {
		const nodeTagsShort = node.tags.map((tag) => tag.replace('tag:', ''));
		untrack(() => {
			if (JSON.stringify(nodeTagsShort) !== JSON.stringify(tags)) {
				tags = nodeTagsShort;
			}
		});
	});

	let disabled = $state(false);
	const ToastStore = getToastStore();
	const ModalStore = getModalStore();

	async function saveTags() {
		// If adding the first tag to a node with no tags, warn about ownership change (v0.28+)
		if (node.tags.length === 0 && tags.length > 0) {
			const modal: ModalSettings = {
				type: 'confirm',
				title: $_('common.confirm'),
				body: $_('cards.tagOwnershipWarning'),
				response: (r: boolean) => {
					if (r) {
						performSave();
					} else {
						// Revert tags
						tags = node.tags.map((tag) => tag.replace('tag:', ''));
					}
				}
			};
			ModalStore.trigger(modal);
		} else {
			performSave();
		}
	}

	async function performSave() {
		if (tags.length === 0 && node.tags.length > 0) {
			toastError($_('cards.invalidTags') + ' ' + $_('cards.cannotRemoveAllTags'), ToastStore);
			tags = node.tags.map((tag) => tag.replace('tag:', ''));
			return;
		}

		// Check if any tags are missing from ACL policy
		try {
			const policy = await getPolicy();
			const acl = ACLBuilder.fromPolicy(JWCC.parse<ACL>(policy));
			const missingTags = tags.filter(t => !acl.getTagNames(false).includes(t));

			if (missingTags.length > 0) {
				const tagLabel = missingTags.length > 1 ? $_('cards.tags') : $_('cards.tag');
				const modal: ModalSettings = {
					type: 'confirm',
					title: $_('common.confirm'),
					body: `${$_('cards.tagsMissingInACL', { values: { tags: missingTags.join(', ') } })}<br><br>${$_('cards.autoCreateTagsPrompt')}`,
					response: async (r: boolean) => {
						if (r) {
							// Create missing tags
							for (const t of missingTags) {
								acl.createTag(t);
							}
							try {
								await App.setPolicy(acl);
								toastSuccess($_('cards.tagsCreatedInACL'), ToastStore);
								proceedWithSave();
								} catch (err) {
									toastError(
										$_('cards.failedToCreateTags'),
										ToastStore,
										err instanceof Error ? err : undefined
									);
								tags = node.tags.map((tag) => tag.replace('tag:', ''));
							}
						} else {
							// Revert tags
							tags = node.tags.map((tag) => tag.replace('tag:', ''));
						}
					}
				};
				ModalStore.trigger(modal);
				return;
			}
		} catch (err) {
			debug('Failed to check ACL for tags:', err);
			// Fallback to normal save if ACL check fails
		}

		proceedWithSave();
	}

	async function proceedWithSave() {
		disabled = true;
		try {
			const n = await setNodeTags(node, tags);
			node = n;
			untrack(() => {
				App.updateValue(App.nodes, n);
			})
		} catch (e) {
			toastError($_('cards.invalidTags') + ' ' + localizeError(e), ToastStore);
			tags = node.tags.map((tag) => tag.replace('tag:', ''));
		} finally {
			disabled = false;
		}
	}
</script>

<div class="space-y-4">
	<CardListEntry top title={$_('cards.tags')}>
		<InputChip
			name="tags-node-{node.id}"
			bind:value={tags}
			{disabled}
			validation={isValidTag}
			class="w-full"
			chips="variant-filled-surface"
			on:add={saveTags}
			on:remove={saveTags}
		/>
	</CardListEntry>
</div>
