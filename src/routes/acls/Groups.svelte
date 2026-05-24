<script lang="ts">
	import { Accordion, getToastStore } from '@skeletonlabs/skeleton';
	import { saveConfig, type ACLBuilder } from '$lib/common/acl.svelte';
	import { debug } from '$lib/common/debug';
	import { toastError, toastSuccess } from '$lib/common/funcs';
	import { _ } from 'svelte-i18n';
	import CardListPage from '$lib/cards/CardListPage.svelte';
	import GroupListCard from '$lib/cards/acl/GroupListCard.svelte';
	import RawMdiSave from '~icons/mdi/content-save-outline'

	import NewItem from '$lib/parts/NewItem.svelte';

	let {acl = $bindable(), loading = $bindable(false)}: {acl: ACLBuilder, loading?: boolean} = $props();

	const ToastStore = getToastStore();

	let showCreateGroup = $state(false);
	let newGroupName = $state('');
	let groupsFilterString = $state('');

	const filteredGroups = $derived.by(() => {
		const groups = acl.getGroupNames()

		try {
			if (groupsFilterString === '') {
				return groups;
			}

			const r = RegExp(groupsFilterString);
			return groups.filter((g) => r.test(g));
		} catch {
			debug(`Group Regex "${groupsFilterString}" is invalid`);
			return groups;
		}
	});

	function newGroup() {
		loading = true;
		try {
			acl.createGroup(newGroupName);
			toastSuccess($_('acls.groupCreated', { values: { name: newGroupName } }), ToastStore);
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

	function toggleShowCreateGroup() {
		showCreateGroup = !showCreateGroup;
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
			<button class="btn-sm rounded-md variant-filled-success" onclick={toggleShowCreateGroup}>
				{$_('acls.createGroup')}
			</button>
		</div>
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
