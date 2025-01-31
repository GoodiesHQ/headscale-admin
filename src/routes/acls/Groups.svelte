<script lang="ts">
	import { Accordion, getToastStore } from '@skeletonlabs/skeleton';
	import type { ACLBuilder } from '$lib/common/acl.svelte';
	import { debug } from '$lib/common/debug';
	import { toastError, toastSuccess } from '$lib/common/funcs';
	import CardListPage from '$lib/cards/CardListPage.svelte';
	import GroupListCard from '$lib/cards/acl/GroupListCard.svelte';

	import NewItem from '$lib/parts/NewItem.svelte';

	let {acl = $bindable(), loading = $bindable(false)}: {acl: ACLBuilder, loading?: boolean} = $props();

	const ToastStore = getToastStore();

	let showCreateGroup = $state(false);
	let newGroupName = $state('');
	let groupsFilterString = $state('');

	const filteredGroups = $derived(filterGroups(acl.getGroupNames(), groupsFilterString))

	function newGroup() {
		loading = true;
		try {
			acl.createGroup(newGroupName);
			toastSuccess(`Group '${newGroupName}' created`, ToastStore);
			newGroupName = '';
			showCreateGroup = false;
		} catch (e) {
			if (e instanceof Error) {
				toastError('', ToastStore, e);
			}
		} finally {
			loading = false;
		}
	}

	function filterGroups(groups: string[], filter: string): string[] {
		try {
			if (filter === '') {
				return groups;
			}

			const r = RegExp(filter);
			return groups.filter((g) => r.test(g));
		} catch {
			debug(`Group Regex "${filter}" is invalid`);
			return groups;
		}
	}

	function toggleShowCreateGroup() {
		showCreateGroup = !showCreateGroup;
	}

</script>

<CardListPage>
	<div class="mb-2">
		<button class="btn-sm rounded-md variant-filled-success" onclick={toggleShowCreateGroup}>
			Create Group
		</button>
		{#if showCreateGroup}
			<NewItem
				title="Group"
				disabled={loading}
				bind:name={newGroupName}
				submit={newGroup}
			/>
		{/if}
	</div>

	<div class="flex items-center pb-4 mt-4">
		<input
			autocomplete="off"
			type="text"
			class="input rounded-md text-sm mb-0"
			placeholder="Filter Groups..."
			bind:value={groupsFilterString}
		/>
	</div>
	<Accordion autocollapse={false}>
	{#each filteredGroups as groupName}
		<GroupListCard bind:acl groupName={groupName} open />
	{/each}
	</Accordion>
</CardListPage>
