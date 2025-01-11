<script lang="ts">
	import type { Node } from '$lib/common/types';
	import CardListEntry from '../CardListEntry.svelte';
	import { InputChip, getToastStore, popup, type PopupSettings } from '@skeletonlabs/skeleton';
	import { NodeStore, updateStoreItem } from '$lib/Stores';
	import { setNodeTags } from '$lib/common/api';
	import { toastError } from '$lib/common/funcs';
	import RawMdiWarning from '~icons/mdi/warning-outline';

	export let node: Node;

	$: tagsForced = node.forcedTags.map((tag) => tag.replace('tag:', ''));
	$: tagsValid = node.validTags.map((tag) => tag.replace('tag:', ''));
	$: tagsInvalid = node.invalidTags.map((tag) => tag.replace('tag:', ''));
	$: disabled = false;

	$: popupInvalidTagsShow = false;

	const popupInfo: PopupSettings = {
		event: 'hover',
		target: 'popupInvalidTags',
		placement: 'top',
	};

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

	let timerInfo: ReturnType<typeof setTimeout>;

	function handleMouseEnter() {
		timerInfo = setTimeout(() => {
			popupInvalidTagsShow = true;
		}, 333);
	}

	function handleMouseLeave() {
		popupInvalidTagsShow = false;
		clearTimeout(timerInfo);
	}
</script>

<div
	class="card p-3 rounded-md variant-filled-warning {popupInvalidTagsShow ? '' : 'invisible'}"
	data-popup="popupInvalidTags"
>
	<p>The following tags have been prevented by the current ACL:</p>
	<p class="space-y-2 mt-2 text-left">
		{#if popupInvalidTagsShow == true}
			{#each tagsInvalid as tag}
				<button type="button" class="chip variant-filled-error mr-2">{tag}</button>
			{/each}
		{/if}
	</p>
	<div class="arrow variant-filled-warning"></div>
</div>

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
	<CardListEntry top>
		<span slot="title" class="flex flex-row items-center">
			Advertised Tags:
			{#if tagsInvalid.length > 0}
				<button
					class="btn ml-2 btn-icon w-6 h-6 [&>*]:pointer-events-none"
					use:popup={popupInfo}
					on:mouseenter={handleMouseEnter}
					on:mouseleave={handleMouseLeave}
				>
					<span class="text-warning-500">
						<RawMdiWarning />
					</span>
				</button>
			{/if}
		</span>
		<div class="space-x-2 space-y-1">
			{#each tagsValid as tag}
				<button type="button" class="chip variant-filled-success">{tag}</button>
			{/each}
		</div>
	</CardListEntry>
</div>
