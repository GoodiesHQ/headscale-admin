<script lang="ts">
	import { getToastStore } from '@skeletonlabs/skeleton';
	import type { ACLBuilder } from '$lib/common/acl.svelte';
	import type { User } from '$lib/common/types';
	import { toastSuccess, toastError } from '$lib/common/funcs';
	import MultiSelect from '$lib/parts/MultiSelect.svelte';
	import Delete from '$lib/parts/Delete.svelte';
	import CardListContainer from '$lib/cards/CardListContainer.svelte';
	import { debug } from '$lib/common/debug';
	import { get } from 'svelte/store';

	import RawMdiTag from '~icons/mdi/tag';
	import Text from '$lib/parts/Text.svelte';
	import ListEntry from './ListEntry.svelte';
	import { App } from '$lib/States.svelte';

	const ToastStore = getToastStore();

	type TagOwnerListCardProps = {
		acl: ACLBuilder,
		tagName: string,
		open?: boolean,
	}

	let {
		acl = $bindable(),
		tagName = $bindable(),
		open = $bindable(true),
	}: TagOwnerListCardProps = $props()

	const tagOwners = $derived(acl.tagExists(tagName) ? acl.getTagOwners(tagName) : []);
	let tag = $state(MakeTag())
	let tagNameNew = $state('');
	let loading = $state(false);
	let deleting = $state(false);
	const options = $derived.by(() => {
		const us = App.users.value.map(u => u.name)
		us.sort()

		const gs = acl.getGroupNames(true)
		gs.sort()

		return us.concat(gs)
	});

	function MakeTag() {
		return {
			get name() { return tagName },
			set name(n: string) { renameTag(n) },
			get owners() { return tagOwners },
			set owners(o: string[]) { setTagOwners(o) }
		}
	}

	function renameTag(tagNameNew: string) {
		loading = true
		try {
			if (tag.name !== tagNameNew) {
				acl.renameTag(tag.name, tagNameNew);
				toastSuccess(`Tag renamed from '${tag.name}' to '${tagNameNew}'`, ToastStore);
				tagName = tagNameNew;
			}
			return true;
		} catch (e) {
			if (e instanceof Error) {
				toastError('', ToastStore, e);
			}
			debug(e)
		} finally {
			loading = false
		}
	}

	function deleteTag() {
		deleting = true;
		loading = true
		try{
			acl.deleteTag(tag.name);
			toastSuccess(`Tag '${tag.name}' deleted`, ToastStore)
		}catch(e){
			if(e instanceof Error){
				toastError('', ToastStore, e);
			}
			debug(e);
		} finally {
			deleting = false
			loading = false
		}
	}

	function removeMember(member: string) {
		setTagOwners(tag.owners.filter(m => m != member) ?? [])
	}

	function setTagOwners(tagOwners: string[]) {
		acl.setTagOwners(tag.name, tagOwners)
	}
</script>

<ListEntry id={tagName} name={tagName} logo={RawMdiTag} bind:open>
	{#snippet children()}
	<CardListContainer>
		<h3 class="font-mono mb-4 flex flex-row items-center">
			<span>Owners of</span>
			<Text
				bind:value={tag.name}
				bind:valueNew={tagNameNew}
				submit={() => { tag.name = tagNameNew; return true}}
				classes="font-extralight text-secondary-500 dark:text-secondary-300 rounded-md"
				showRenameIcon={true}
			/>
		</h3>
		<MultiSelect
			id={"tag-" + tagName + "-select"}
			bind:items={tag.owners}
			options={options}
			placeholder={"Select owners of " + tagName + "..."}
			onItemClick={removeMember}
		/>
		<div class="pt-4">
			<Delete func={deleteTag} />
		</div>
	</CardListContainer>
	{/snippet}
</ListEntry>
