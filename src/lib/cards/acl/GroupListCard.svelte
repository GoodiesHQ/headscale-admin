<script lang="ts">
	import { getToastStore } from '@skeletonlabs/skeleton';
	import type { ACLBuilder } from '$lib/common/acl';
	import { toastSuccess, toastError } from '$lib/common/funcs';
	import { MultiSelect } from 'svelte-multiselect';
	import Delete from '$lib/parts/Delete.svelte';
	import CardListContainer from '$lib/cards/CardListContainer.svelte';
	import { debug } from '$lib/common/debug';
	import { UserStore } from '$lib/Stores';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';

	import RawMdiGroup from '~icons/mdi/account-group-outline';
	import Text from '$lib/parts/Text.svelte';
	import ListEntry from './ListEntry.svelte';

	const ToastStore = getToastStore();

	export let acl: ACLBuilder;
	export let group: string;
	export let open: boolean = false;

	$: users = get(UserStore)
	$: groupMembers = acl.getGroupMembers(group);
	$: groupNewName = '';
	$: loading = false;
	$: deleting = false;

	function renameGroup() {
		try {
			if (group !== groupNewName) {
				acl = acl.renameGroup(group, groupNewName);
				toastSuccess(`Group renamed from '${group}' to '${groupNewName}'`, ToastStore);
				group = groupNewName;
			}
			return true;
		} catch (e) {
			if (e instanceof Error) {
				toastError('', ToastStore, e);
			}
			debug(e)
		}
	}

	function deleteGroup() {
		deleting = true;
		try {
			acl = acl.deleteGroup(group);
			toastSuccess(`Group '${group}' deleted`, ToastStore);
		} catch (e) {
			if (e instanceof Error) {
				toastError('', ToastStore, e);
			}
			debug(e)
		} finally {
			deleting = false;
		}
	}

	function saveGroup() {
		loading = true;
		try {
			debug(`Saving group '${group}' with ${groupMembers}`);
			acl = acl.setGroupMembers(group, groupMembers ?? []);
		} catch (e) {
			if (e instanceof Error) {
				toastError('', ToastStore, e);
			}
		} finally {
			loading = false;
		}
	}

	function clearGroup() {
		groupMembers = [];
		saveGroup();
	}

	onMount(() => {
		const unsubUserStore = UserStore.subscribe(us => users = us)
		return () => {
			unsubUserStore();
		}
	})
</script>

<ListEntry id={group} name={group} logo={RawMdiGroup} bind:open>
	<CardListContainer>
		<h3 class="font-mono mb-4 flex flex-row items-center">
			<span>Members of</span>
			<Text
				bind:value={group}
				bind:valueNew={groupNewName}
				submit={renameGroup}
				class="font-extralight text-secondary-500 dark:text-secondary-300"
				showRenameIcon={true}
			/>
		</h3>
		<div class="h-40">
			{#if groupMembers !== undefined}
				<MultiSelect
					id={group}
					bind:selected={groupMembers}
					on:change={saveGroup}
					on:removeAll={clearGroup}
					--sms-options-max-height="18vh"
					inputClass="input"
					liOptionClass="input rounded-none"
					liActiveOptionClass="text-black"
					ulOptionsClass="input rounded-none"
					maxOptions={0}
					closeDropdownOnSelect={false}
					autoScroll={true}
					options={users.map((u) => u.name).toSorted()}
					duplicates={false}
				/>
			{/if}
			<div class="pt-4">
				<Delete func={deleteGroup} />
			</div>
		</div>
	</CardListContainer>
</ListEntry>
