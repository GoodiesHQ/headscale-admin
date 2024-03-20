<script lang="ts">
	import { getToastStore } from '@skeletonlabs/skeleton';
	import type { ACLBuilder } from '$lib/common/acl';
	import { get } from 'svelte/store';
	import { UserStore } from '$lib/Stores';
	import { onMount } from 'svelte';
	import type { User } from '$lib/common/types';
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

	$: users = get(UserStore) as User[];
	$: usersNames = users.map((u: User) => u.name);

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

	$: filteredGroups = filterGroups(acl.getGroupNames(), groupsFilter);

	function toggleShowCreateGroup() {
		showCreateGroup = !showCreateGroup;
	}

	onMount(() => {
		const unsubUserStore = UserStore.subscribe((us) => {
			users = us;
			usersNames = us.map((u: User) => u.name);
		});
		return () => {
			unsubUserStore();
		};
	});
</script>

<CardListPage>
    <div class="my-4">
    <button class="btn-sm rounded-md variant-filled-success" on:click={toggleShowCreateGroup}>
        Create
    </button>
    {#if showCreateGroup}
        <NewItem
            title="Group"
            disabled={loading}
            bind:name={newGroupName}
            submit={() => {newGroup()}}
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
    {#each filteredGroups.sort((a, b) => a.localeCompare(b)) as group}
        <GroupListCard {acl} {group} {users} />
    {/each}
</CardListPage>