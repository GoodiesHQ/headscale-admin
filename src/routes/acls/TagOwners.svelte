<script lang="ts">
	import { Accordion, getToastStore } from '@skeletonlabs/skeleton';
	import { saveConfig, type ACLBuilder } from '$lib/common/acl.svelte';
	import { debug } from '$lib/common/debug';
	import { toastError, toastSuccess } from '$lib/common/funcs';
	import { _ } from 'svelte-i18n';
	import CardListPage from '$lib/cards/CardListPage.svelte';
	import TagOwnerListCard from '$lib/cards/acl/TagOwnerListCard.svelte';
	import NewItem from '$lib/parts/NewItem.svelte';
	import RawMdiSave from '~icons/mdi/content-save-outline'

	const ToastStore = getToastStore();

	let {acl = $bindable(), loading = $bindable(false)}: {acl: ACLBuilder, loading?: boolean} = $props();

	let showCreateTag = $state(false);
	let newTagName = $state('');

	let tagsFilter = $state('');

	function newTag() {
		loading = true;
		try {
			acl.createTag(newTagName);
			toastSuccess($_('acls.tagCreated', { values: { name: newTagName } }), ToastStore);
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

	const filteredTags = $derived.by(() => {
		const tags = acl.getTagNames()
		try {
			const r = RegExp(tagsFilter);
			return tags.filter((g) => r.test(g));
		} catch {
			debug(`Tag Regex "${tagsFilter}" is invalid`);
			return tags;
		}
	})

	function toggleShowCreateTag() {
		showCreateTag = !showCreateTag;
	}

</script>

<CardListPage>
	<div class="mb-2">
		<div class="flex flex-row space-x-2">
			<button disabled={loading} class="btn-icon rounded-md variant-filled-success disabled:opacity-50 w-8 text-xl" onclick={() => { 
				saveConfig(acl, ToastStore, {setLoadingTrue: () => { loading = true}, setLoadingFalse: ()=> { loading = false }})
			}}>
				<RawMdiSave />
			</button>
			<button class="btn-sm rounded-md variant-filled-success" onclick={toggleShowCreateTag}>
				{$_('acls.createTag')}
			</button>
		</div>
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
			autocomplete="off"
			type="text"
			class="input rounded-md text-sm mb-0"
			placeholder="Filter Tags..."
			bind:value={tagsFilter}
		/>
	</div>
	<Accordion autocollapse={false}>
	{#each filteredTags as tag}
		<TagOwnerListCard bind:acl tagName={tag} />
	{/each}
	</Accordion>
</CardListPage>
