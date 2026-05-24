<script lang="ts">
	import type { ACLBuilder } from '$lib/common/acl.svelte';
	import ListEntry from './ListEntry.svelte';
	import CardListContainer from '$lib/cards/CardListContainer.svelte';

	import Delete from '$lib/parts/Delete.svelte';
	import MultiSelect from '$lib/parts/MultiSelect.svelte';
	import Text from '$lib/parts/Text.svelte';
	import { _ } from 'svelte-i18n';

	import { App } from '$lib/States.svelte';
	import { debug } from '$lib/common/debug';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { toastSuccess, toastError, getUserAclName } from '$lib/common/funcs';

	import RawMdiGroup from '~icons/mdi/account-group-outline';

	const ToastStore = getToastStore();

	type GroupListCardProps = {
		acl: ACLBuilder,
		groupName: string,
		open: boolean,
	}

	let {acl = $bindable(), groupName, open = $bindable()}: GroupListCardProps = $props()

	const groupMembers = $derived(acl.getGroupMembers(groupName));
	const userNames = $derived(App.users.value.map(getUserAclName).toSorted())

	let group = $state(makeGroup());
	let groupNameNew = $state('');
	let loading = $state(false);
	let deleting = $state(false);

	function makeGroup() {
		return {
			get members() { return groupMembers ?? [] },
			set members(m: string[]) { setGroupMembers(m) },
			get name() { return groupName },
			set name(n: string) { renameGroup(n) },
		}
	}

	function renameGroup(groupNameNew: string) {
		try {
			if (groupName !== groupNameNew) {
				acl.renameGroup(groupName, groupNameNew);
				toastSuccess($_('cards.groupRenamedSuccess', { values: { oldName: groupName, newName: groupNameNew } }), ToastStore);
				groupName = groupNameNew;
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
			acl.deleteGroup(groupName);
			toastSuccess($_('cards.groupDeleted', { values: { name: groupName } }), ToastStore);
		} catch (e) {
			if (e instanceof Error) {
				toastError('', ToastStore, e);
			}
			debug(e)
		} finally {
			deleting = false;
		}
	}

	function removeMember(member: string) {
		setGroupMembers(groupMembers?.filter(m => m != member) ?? [])
	}

	function setGroupMembers(members: string[]) {
		loading = true;
		try {
			debug(`Saving group '${groupName}' with ${members}`);
			acl.setGroupMembers(groupName, members);
		} catch (e) {
			if (e instanceof Error) {
				toastError('', ToastStore, e);
			}
		} finally {
			loading = false;
		}
	}
</script>

<ListEntry id={groupName} name={groupName} logo={RawMdiGroup} bind:open>
	{#snippet children()}
	<CardListContainer>
		<h3 class="font-mono mb-4 flex flex-row items-center">
			<span>{$_('cards.membersOf')}</span>
			<Text
				bind:value={group.name}
				bind:valueNew={groupNameNew}
				submit={()=>{ group.name = groupNameNew; return true }}
				classes="font-extralight text-secondary-500 dark:text-secondary-300 rounded-md"
				showRenameIcon={true}
			/>
		</h3>
		<MultiSelect
			bind:items={group.members}
			options={userNames}
			id={"group-" + groupName + "-select"}
			placeholder={$_('cards.selectMembers', { values: { groupName } })}
			onItemClick={removeMember}
		/>
		<div class="pt-4">
			<Delete func={deleteGroup} />
		</div>
	</CardListContainer>
	{/snippet}
</ListEntry>
