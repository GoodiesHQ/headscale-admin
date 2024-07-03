<script lang="ts">
	import { Accordion, getToastStore } from '@skeletonlabs/skeleton';
	import type { ACLBuilder } from '$lib/common/acl';
	import { debug } from '$lib/common/debug';
	import { toastError, toastSuccess } from '$lib/common/funcs';
	import CardListPage from '$lib/cards/CardListPage.svelte';
	import TagOwnerListCard from '$lib/cards/acl/TagOwnerListCard.svelte';

	import NewItem from './NewItem.svelte';

	export let acl: ACLBuilder;

	const ToastStore = getToastStore();

	$: loading = false;

	$: showCreateTag = false;
	$: newTagName = '';

	let tagsFilter = '';

	function newTag() {
		loading = true;
		try {
			acl = acl.createTag(newTagName);
			toastSuccess(`Tag Ownership of '${newTagName}' created`, ToastStore);
			newTagName = '';
			showCreateTag = false;
		} catch (e) {
			if (e instanceof Error) {
				toastError('', ToastStore, e);
			}
		} finally {
			loading = false;
		}
	}

	function filterTags(tags: string[], filter: string) {
		try {
			const r = RegExp(filter);
			return tags.filter((g) => r.test(g));
		} catch {
			debug(`Tag Regex "${filter}" is invalid`);
			return tags;
		}
	}

	function toggleShowCreateTag() {
		console.log(acl)
		showCreateTag = !showCreateTag;
	}

</script>

<CardListPage>
	<div class="mb-2">
		<button class="btn-sm rounded-md variant-filled-success" on:click={toggleShowCreateTag}>
			Create
		</button>
		{#if showCreateTag}
			<NewItem
				title="Tag"
				disabled={loading}
				bind:name={newTagName}
				submit={() => {
					newTag();
				}}
			/>
		{/if}
	</div>

	<div class="flex items-center pb-4 mt-4">
		<input
			type="text"
			class="input rounded-md text-sm mb-0"
			placeholder="Filter Tags..."
			bind:value={tagsFilter}
		/>
	</div>
	<Accordion autocollapse={false}>
	{#each filterTags(acl.getTagNames(), tagsFilter) as tag}
		<TagOwnerListCard bind:acl bind:tag />
	{/each}
	</Accordion>
</CardListPage>
