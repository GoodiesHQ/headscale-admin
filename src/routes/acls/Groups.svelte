<script lang="ts">
	import { Accordion, getToastStore } from '@skeletonlabs/skeleton';
	import type { ACLBuilder } from '$lib/common/acl';
	import { debug } from '$lib/common/debug';
	import { toastError, toastSuccess } from '$lib/common/funcs';
	import CardListPage from '$lib/cards/CardListPage.svelte';
	import GroupListCard from '$lib/cards/acl/GroupListCard.svelte';

	import NewItem from './NewItem.svelte';

	export let acl: ACLBuilder;

	const ToastStore = getToastStore();

	$: loading = false;

	$: showCreateGroup = false;
	$: newGroupName = '';
	let groupsFilter = '';

	function newGroup() {
		loading = true;
		try {
			acl = acl.createGroup(newGroupName);
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

	function filterGroups(groups: string[], filter: string) {
		try {
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
		<button class="btn-sm rounded-md variant-filled-success" on:click={toggleShowCreateGroup}>
			Create
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
			type="text"
			class="input rounded-md text-sm mb-0"
			placeholder="Filter Groups..."
			bind:value={groupsFilter}
		/>
	</div>
	<Accordion autocollapse={false}>
	{#each filterGroups(acl.getGroupNames(), groupsFilter) as group}
		<GroupListCard bind:acl bind:group />
	{/each}
	</Accordion>
</CardListPage>
