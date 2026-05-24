<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
	import { deleteNode, setNodeTags } from '$lib/common/api';
	import { toastSuccess } from '$lib/common/funcs';
	import type { Node } from '$lib/common/types';
	import { App } from '$lib/States.svelte';
	
	// icons
	import RawMdiDelete from '~icons/mdi/delete-outline';
	import RawMdiTag from '~icons/mdi/tag-outline';
	import RawMdiClose from '~icons/mdi/close';
	
	interface Props {
		selectedNodes: Set<string>;
		allNodes: Node[];
		onClearSelection: () => void;
	}
	
	let { selectedNodes, allNodes, onClearSelection }: Props = $props();
	
	const modalStore = getModalStore();
	const toastStore = getToastStore();
	
	const selectedNodesArray = $derived(
		allNodes.filter(node => selectedNodes.has(node.id))
	);
	
	async function handleBatchDelete() {
		const count = selectedNodesArray.length;
		
		modalStore.trigger({
			type: 'confirm',
			title: $_('common.batchDeleteConfirm'),
			body: $_('common.batchDeleteWarning', { values: { count } }),
			response: async (r: boolean) => {
				if (r) {
					let deletedCount = 0;
					for (const node of selectedNodesArray) {
						const success = await deleteNode(node);
						if (success) deletedCount++;
					}
					toastSuccess($_('common.batchDeleted', { values: { count: deletedCount } }), toastStore);
					onClearSelection();
				}
			}
		});
	}
	
	async function handleBatchSetTags() {
		modalStore.trigger({
			type: 'prompt',
			title: $_('common.batchSetTags'),
			body: $_('common.enterTags'),
			value: '',
			response: async (tags: string) => {
				if (tags !== undefined && tags !== '') {
					const tagArray = tags.split(',').map(t => t.trim()).filter(t => t !== '');
					let updatedCount = 0;
					
					for (const node of selectedNodesArray) {
						try {
							await setNodeTags(node, tagArray);
							updatedCount++;
						} catch (err) {
							console.error('Failed to set tags for node', node.id, err);
						}
					}
					
					toastSuccess($_('common.tagsUpdated', { values: { count: updatedCount } }), toastStore);
					onClearSelection();
				}
			}
		});
	}
</script>

{#if selectedNodesArray.length > 0}
	<div class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up w-[calc(100%-2rem)] md:w-auto">
		<div class="card variant-filled-primary shadow-xl px-3 md:px-5 py-3 md:py-3 flex items-center justify-between md:justify-start gap-2 md:gap-4">
			<div class="flex items-center gap-2 md:gap-4">
				<span class="font-semibold whitespace-nowrap text-sm md:text-base">
					{$_('common.selectedCount', { values: { count: selectedNodesArray.length } })}
				</span>
				
				<div class="h-6 border-l border-white/30"></div>
				
				<button
					type="button"
					class="btn btn-sm variant-filled-surface"
					onclick={handleBatchSetTags}
					title={$_('common.batchSetTags')}
				>
					<RawMdiTag class="w-4 h-4 md:mr-1" />
					<span class="hidden md:inline">{$_('common.batchSetTags')}</span>
				</button>
				
				<button
					type="button"
					class="btn btn-sm variant-filled-error"
					onclick={handleBatchDelete}
					title={$_('common.batchDelete')}
				>
					<RawMdiDelete class="w-4 h-4 md:mr-1" />
					<span class="hidden md:inline">{$_('common.batchDelete')}</span>
				</button>
			</div>
			
			<div class="flex items-center gap-2 md:gap-4">
				<div class="h-6 border-l border-white/30"></div>
				
				<button
					type="button"
					class="btn btn-sm variant-ghost"
					onclick={onClearSelection}
					title={$_('common.deselectAll')}
				>
					<RawMdiClose class="w-4 h-4" />
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes slide-up {
		from {
			transform: translate(-50%, 100%);
			opacity: 0;
		}
		to {
			transform: translate(-50%, 0);
			opacity: 1;
		}
	}
	
	.animate-slide-up {
		animation: slide-up 0.3s ease-out;
	}
</style>
