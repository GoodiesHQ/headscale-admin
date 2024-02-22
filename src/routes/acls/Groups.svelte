<script lang="ts">
	import { ListBox, ListBoxItem, Toast, getToastStore } from '@skeletonlabs/skeleton';
	import type { ACL } from './acl';
	import { get } from 'svelte/store';
	import { UserStore } from '$lib/Stores';
	import { onMount } from 'svelte';
	import type { User } from '$lib/common/types';
	import { debug } from '$lib/common/debug';
	import { MultiSelect } from 'svelte-multiselect';
	import { slide } from 'svelte/transition';
	import { focus, toastError, toastSuccess } from '$lib/common/funcs';
	import RawMdiContentSave from '~icons/mdi/content-save-outline';
	import RawMdiCheckCircleOutline from '~icons/mdi/check-circle-outline';

	export let acl: ACL;

	const ToastStore = getToastStore();

	$: loading = false;

	$: selectedGroup = '';
	$: selectedUsers = [] as string[];

	$: showCreateGroup = false;
	$: newGroupName = '';

	$: users = get(UserStore) as User[];
	$: usersNames = users.map((u: User) => u.name);

	let groupsFilter = '';

	function newGroup() {
		loading = true;
		try {
			newGroupName = newGroupName.toLocaleLowerCase();
			if (acl.groups[newGroupName] !== undefined) {
				toastError(`Group '${newGroupName}' already exists`, ToastStore);
				return;
			}
			acl.groups[newGroupName] = [] as string[];
			toastSuccess(`Group '${newGroupName}' created`, ToastStore);
			newGroupName = '';
			showCreateGroup = false;
		} finally {
			loading = false;
		}
	}

	function saveGroup() {
		acl.groups[selectedGroup] = [...selectedUsers];
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

	$: filteredGroups = filterGroups(Object.keys(acl.groups), groupsFilter);

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

<div class="grid grid-cols-12 space-x-2">
	<div class="col-span-12 lg:col-span-6 w-full">
		<div class="container h-screen w-full">
			<button
				class="font-mono"
				on:click={() => {
					selectedGroup = '';
				}}>Groups:</button
			>
			<button
				class="btn-sm rounded-sm variant-filled-primary"
				on:click={() => {
					showCreateGroup = !showCreateGroup;
				}}
			>
				{#if showCreateGroup}
					Cancel
				{:else}
					Create
				{/if}
			</button>
			{#if showCreateGroup}
				<form transition:slide on:submit={newGroup} class="w-full my-2 items-center">
					<input
						class="input rounded-md w-full md:w-1/2 lg:w-1/3"
						type="text"
						placeholder="New Group Name..."
						disabled={loading}
						bind:value={newGroupName}
						use:focus
					/>
					<button type="submit" class="btn btn-icon" disabled={loading}>
						<RawMdiCheckCircleOutline />
					</button>
				</form>
			{/if}
			<div class="flex items-center pb-4 mt-4">
				<input
					type="text"
					class="input rounded-md text-sm mb-0"
					placeholder="Filter Groups..."
					bind:value={groupsFilter}
				/>
			</div>
			<div class="text-sm">
				<ListBox rounded="rounded-md" active="variant-filled-primary">
					{#each filteredGroups as group}
						<div class="bg-surface-200 dark:bg-surface-700">
							<ListBoxItem
								bind:group={selectedGroup}
								name="group"
								value={group}
								on:change={() => {
									selectedUsers =
										selectedGroup && acl.groups[selectedGroup] !== undefined
											? [...acl.groups[selectedGroup]]
											: [];
								}}>{group}</ListBoxItem
							>
						</div>
					{/each}
				</ListBox>
			</div>
		</div>
	</div>
	<div class="col-span-6">
		{#if selectedGroup}
			<h3 class="font-mono mb-4">Members:</h3>
			<MultiSelect
				bind:selected={selectedUsers}
				inputClass="input w-full"
				liOptionClass="input rounded-none"
				ulOptionsClass="input rounded-none"
				maxOptions={0}
				closeDropdownOnSelect={false}
				autoScroll={false}
				options={[...usersNames]}
				duplicates={false}
			/>
			<button
				type="submit"
				class="btn-sm rounded-md variant-filled-success mt-4"
				disabled={loading}
				on:click={saveGroup}
			>
				<div class=" flex flex-row items-center">
					<RawMdiContentSave /> Save
				</div>
			</button>
			<!--div class="flex items-center pb-4">
            <input type="text" class="input rounded-md text-sm mb-0" placeholder="Filter Users..." bind:value={usersFilter} />
        </div>sla
        <div class="text-sm">
			<ListBox multiple rounded="rounded-md" active="variant-ghost-secondary">
				{#each filteredUsers(users, usersFilter) as user}
					<ListBoxItem bind:group={selectedUsers} name="username" value={user.name}
                        on:change={()=>{
                            if(selectedGroup) {
                                acl.groups[selectedGroup] = [...selectedUsers]
                            }
                        }}
						>{user.name}</ListBoxItem
					>
				{/each}
			</ListBox>
        </div-->
		{/if}
	</div>
</div>
