<script lang="ts">
	import { getToastStore } from '@skeletonlabs/skeleton';
	import type { ACLBuilder } from '$lib/common/acl';
	import type { User } from '$lib/common/types';
	import { toastSuccess, toastError } from '$lib/common/funcs';
	import { MultiSelect } from 'svelte-multiselect';
	import Delete from '$lib/parts/Delete.svelte';
	import CardListContainer from '$lib/cards/CardListContainer.svelte';
	import { debug } from '$lib/common/debug';
	import { UserStore } from '$lib/Stores';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';

	import RawMdiTag from '~icons/mdi/tag';
	import Text from '$lib/parts/Text.svelte';
	import ListEntry from './ListEntry.svelte';

	const ToastStore = getToastStore();

	export let acl: ACLBuilder;
	export let tag: string;
	export let open: boolean = false;

	$: users = get(UserStore)
	$: tagOwners = acl.tagExists(tag) ? acl.getTagOwners(tag) : [];
	$: tagNewName = '';
	$: loading = false;
	$: deleting = false;

	function options(acl: ACLBuilder, users: User[]): string[] {
		const us = users.map(u => u.name)
		us.sort()

		const gs = acl.getGroupNames(true)
		gs.sort()

		return us.concat(gs)
	}

	function renameTag() {
		try {
			if (tag !== tagNewName) {
				acl = acl.renameTag(tag, tagNewName);
				toastSuccess(`Group renamed from '${tag}' to '${tagNewName}'`, ToastStore);
				tag = tagNewName;
			}
			return true;
		} catch (e) {
			if (e instanceof Error) {
				toastError('', ToastStore, e);
			}
			debug(e)
		}
	}

	function deleteTag() {
		deleting = true;
		try{
			acl = acl.deleteTag(tag);
			toastSuccess(`Tag '${tag}' deleted`, ToastStore)
		}catch(e){
			if(e instanceof Error){
				toastError('', ToastStore, e);
			}
			debug(e);
		} finally {
			deleting = false
		}
	}

	function saveTag() {
		acl.setTagOwners(tag, tagOwners)
	}

	function clearTag() {
		tagOwners
		saveTag();
	}
</script>

<ListEntry id={tag} name={tag} logo={RawMdiTag} bind:open>
	<CardListContainer>
		<h3 class="font-mono mb-4 flex flex-row items-center">
			<span>Owners of</span>
			<Text
				bind:value={tag}
				bind:valueNew={tagNewName}
				submit={renameTag}
				class="font-extralight text-secondary-500 dark:text-secondary-300"
				showRenameIcon={true}
			/>
		</h3>
		<div class="h-40">
			{#if tagOwners !== undefined}
				<MultiSelect
					id={tag}
					bind:selected={tagOwners}
					on:change={saveTag}
					on:removeAll={clearTag}
					--sms-options-max-height="18vh"
					inputClass="input"
					liOptionClass="input rounded-none"
					liActiveOptionClass="text-black"
					ulOptionsClass="input rounded-none"
					maxOptions={0}
					closeDropdownOnSelect={false}
					autoScroll={true}
					options={options(acl, users)}
					duplicates={false}
				/>
			{/if}
			<div class="pt-4">
				<Delete func={deleteTag} />
			</div>
		</div>
	</CardListContainer>
</ListEntry>
