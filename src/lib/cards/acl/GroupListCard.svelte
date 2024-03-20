<script lang="ts">
	import { AccordionItem, getToastStore } from '@skeletonlabs/skeleton';
	import type { ACLBuilder } from '$lib/common/acl';
	import type { User } from '$lib/common/types';
	import { toastSuccess, toastError, focus } from '$lib/common/funcs';
	import { MultiSelect } from 'svelte-multiselect';
	import Delete from '$lib/parts/Delete.svelte';
	import CardListContainer from '$lib/cards/CardListContainer.svelte';
	import { debug } from '$lib/common/debug';

	import RawMdiRename from '~icons/mdi/rename-outline';
	import RawMdiGroup from '~icons/mdi/account-group-outline';
	import { onMount } from 'svelte';

	const ToastStore = getToastStore();

	export let users: User[];
	export let acl: ACLBuilder;
	export let group: string;
	export let open: boolean = false;

	$: groupMembers = acl.getGroupMembers(group);
	$: showRenameGroup = false;
	$: groupNewName = '';
	$: loading = false;

	function renameGroup() {
		try {
			if (group !== groupNewName) {
				acl = acl.renameGroup(group, groupNewName);
				toastSuccess(`Group renamed from '${group}' to '${groupNewName}'`, ToastStore);
				group = groupNewName;
			}
			showRenameGroup = false;
		} catch (e) {
			if (e instanceof Error) {
				toastError('', ToastStore, e);
			}
		}
	}

	function deleteGroup() {
		try {
			acl = acl.deleteGroup(group);
			toastSuccess(`Group '${group}' deleted`, ToastStore);
		} catch (e) {
			if (e instanceof Error) {
				toastError('', ToastStore, e);
			}
		}
	}

	function saveGroup() {
		loading = true;
		try {
			debug(`Saving group '${group}' with ${groupMembers}`);
			acl = acl.setGroupMembers(group, groupMembers);
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
</script>

<AccordionItem
	{open}
	id={group}
	class="backdrop-brightness-100 bg-white/25 dark:bg-white/5 rounded-md"
	padding="py-4 px-4"
	regionControl="!rounded-none"
>
	<svelte:fragment slot="lead">
		<span class="">
			<RawMdiGroup />
		</span>
	</svelte:fragment>
	<svelte:fragment slot="summary">
		<div class="grid">
			{group}
		</div>
	</svelte:fragment>
	<svelte:fragment slot="content">
		<CardListContainer>
			<h3 class="font-mono mb-4 flex flex-row items-center">
				<span>Members of</span>
				{#if !showRenameGroup}
					<button
						class="flex flex-row ml-2 items-center"
						on:click={() => {
							groupNewName = group;
							showRenameGroup = true;
						}}
					>
						<span class="text-primary-500 dark:text-primary-300">{group}</span>
						<span class="text-xs ml-1"><RawMdiRename /></span>
					</button>
				{:else}
					<form on:submit|preventDefault={renameGroup}>
						<input
							use:focus
							type="text"
							class="input p-0 m-0 text-xs ml-2 w-32"
							bind:value={groupNewName}
						/>
					</form>
				{/if}
			</h3>
			<!--
				liOptionClass="input rounded-none"
				liActiveOptionClass="input"
				ulOptionsClass="input rounded-none"
				ulSelectedClass="input"
				activeOption="input"
			-->
			<div class="h-40">
				<MultiSelect
					id="{group}"
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
					options={users.map((u) => u.name)}
					duplicates={false}
				/>
				<div class="pt-4">
					<Delete func={deleteGroup} />
				</div>
			</div>
		</CardListContainer>
	</svelte:fragment>
</AccordionItem>
