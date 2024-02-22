<script lang="ts">
	import { ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
	import type { ACL } from './acl';
	import { get } from 'svelte/store';
	import { UserStore } from '$lib/Stores';
	import { onMount } from 'svelte';
	import type { User } from '$lib/common/types';
	import { debug } from '$lib/common/debug';
	import { MultiSelect } from 'svelte-multiselect';

	export let acl: ACL;

	$: selectedUsers = [] as string[];
	$: selectedGroup = '';
	$: selectedGroupOld = '';
	$: users = get(UserStore) as User[];
	$: usersNames = users.map((u: User) => u.name);

	let usersFilter = '';
	let groupsFilter = '';

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
				class="font-mono mb-4"
				on:click={() => {
					selectedGroup = '';
				}}>Groups:</button
			>
			<div class="flex items-center pb-4">
				<input
					type="text"
					class="input rounded-md text-sm mb-0"
					placeholder="Filter Groups..."
					bind:value={groupsFilter}
				/>
			</div>
			<div class="text-sm">
				<ListBox rounded="rounded-md" active="variant-ghost">
					{#each filteredGroups as group}
                    <div class="bg-surface-200 dark:bg-surface-700 top-1">
						<ListBoxItem
							bind:group={selectedGroup}
							name="group"
							value={group}
							on:click={() => {
								selectedGroupOld = selectedGroup;
							}}
							on:change={() => {
								usersFilter = '';
								if (selectedGroupOld == selectedGroup) {
									selectedGroup = '';
								}
								selectedUsers = selectedGroup ? [...acl.groups[selectedGroup]] : [];
							}}>{group}</ListBoxItem>
                    </div>
					{/each}
				</ListBox>
			</div>
		</div>
	</div>
	<div class="col-span-6 md:hidden">
		{#if selectedGroup}
			<h3 class="font-mono mb-4">Members:</h3>
			<MultiSelect
                bind:selected={selectedUsers}
				inputClass="input "
				liOptionClass="input rounded-none"
                ulOptionsClass="input rounded-none"
				maxOptions={0}
				closeDropdownOnSelect={false}
				autoScroll={false}
				options={[...usersNames]}
				duplicates={false}
			/>
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
