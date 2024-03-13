<script lang="ts">
	import { ListBox, ListBoxItem, getToastStore } from '@skeletonlabs/skeleton';
	import type { ACLBuilder } from './acl';
	import { get } from 'svelte/store';
	import { UserStore } from '$lib/Stores';
	import { onMount } from 'svelte';
	import type { User } from '$lib/common/types';
	import { debug } from '$lib/common/debug';
	import { MultiSelect } from 'svelte-multiselect';
	import { focus, isValidCIDR, toastError, toastSuccess } from '$lib/common/funcs';
	import Delete from '$lib/parts/Delete.svelte'

	import RawMdiRename from '~icons/mdi/rename-outline';
	import RawMdiUndo from '~icons/mdi/undo-variant';
	import RawMdiContentSave from '~icons/mdi/content-save-outline';
	import NewItem from './NewItem.svelte';
	import Container from './container.svelte';

	export let acl: ACLBuilder;

	const ToastStore = getToastStore();

	$: loading = false;

	$: selectedHost = '';
	$: selectedCIDR = '';

	$: showCreateHost = false;
	$: showRenameHost = false;
	$: newHostName = '';
	$: newHostCIDR = ''

	let hostsFilter = '';

	function newHost() {
		loading = true;
		try {
			acl = acl.createHost(newHostName, newHostCIDR);
			toastSuccess(`Host '${newHostName}' (${newHostCIDR}) created`, ToastStore);
			newHostName = '';
			newHostCIDR = '';
			showCreateHost = false;
		} catch (e) {
			if (e instanceof Error) {
				toastError('', ToastStore, e);
			}
		} finally {
			loading = false;
		}
	}

	function saveHost() {
		loading = true;
		try {
			acl = acl.setHost(selectedHost, selectedCIDR);
			toastSuccess(`Host '${selectedHost}' (${selectedCIDR}) saved`, ToastStore);
		} catch (e) {
			if (e instanceof Error) {
				toastError('', ToastStore, e);
			}
		} finally {
			loading = false;
		}
	}

	function renameHost() {
		try {
			if (selectedHost !== newHostName) {
				acl = acl.renameGroup(selectedHost, newHostName);
				toastSuccess(`Group renamed from '${selectedHost}' to '${newHostName}'`, ToastStore);
				selectedHost = newHostName;
			}
			showRenameHost = false;
		} catch (e) {
			if (e instanceof Error) {
				toastError('', ToastStore, e);
			}
		}
	}

	function deleteHost() {
		try {
			acl = acl.deleteHost(selectedHost);
			toastSuccess(`Group '${selectedHost}' deleted`, ToastStore);
			selectedHost = '';
		} catch (e) {
			if (e instanceof Error) {
				toastError('', ToastStore, e);
			}
		}
	}

	function selectHost() {
		showRenameHost = false;
		newHostName = '';
		selectedCIDR = acl.getHostCIDR(selectedHost);
	}
	/*function selectHost() {
		showRenameGroup = false;
		newGroupName = '';
		selectedUsers =
			selectedGroup && acl.groupExists(selectedGroup)
				? [...acl.getGroupMembers(selectedGroup)]
				: [];
	}*/

	function filterHosts(hosts: string[], filter: string) {
		try {
			const r = RegExp(filter);
			return hosts.filter((g) => r.test(g));
		} catch {
			debug(`Host Regex "${filter}" is invalid`);
			return hosts;
		}
	}

	$: filteredGroups = filterHosts(acl.getHostNames(), hostsFilter);

	function resetSelectedHost() {
		selectedHost = '';
		selectedCIDR = '';
	}

	function toggleShowCreateHost() {
		showCreateHost = !showCreateHost;
	}

</script>

<Container>
	<div slot="left">
		<button class="font-mono" on:click={resetSelectedHost}>Hosts and Networks:</button>
		<button class="btn-sm rounded-md variant-filled-success ml-4" on:click={toggleShowCreateHost}>
			Create
		</button>

		{#if showCreateHost}
			<NewItem
				title="Host"
				disabled={loading}
				bind:name={newHostName}
				bind:value={newHostCIDR}
				submit={(n, v) => (acl = acl.createHost(n, v ?? ''))}
			/>
		{/if}

		<div class="flex items-center pb-4 mt-4">
			<input
				type="text"
				class="input rounded-md text-sm mb-0"
				placeholder="Filter Groups..."
				bind:value={hostsFilter}
			/>
		</div>
		<div class="text-sm">
			<ListBox rounded="rounded-md" active="variant-filled-primary">
				{#each filteredGroups.sort((a, b) => a.localeCompare(b)) as group}
					<div class="bg-surface-200 dark:bg-surface-700">
						<ListBoxItem
							bind:group={selectedHost}
							name="group"
							value={group}
							on:change={selectHost}
						>
							{group}
						</ListBoxItem>
					</div>
				{/each}
			</ListBox>
		</div>
	</div>
	<div slot="right">
		{#if selectedHost}
			<h3 class="font-mono mb-4 flex flex-row items-center">
				<span>CIDR Value of Host</span>
				{#if !showRenameHost}
					<button
						class="flex flex-row ml-2 items-center"
						on:click={() => {
							newHostName = selectedHost;
							showRenameHost = true;
						}}
					>
						<span class="text-primary-500 dark:text-primary-300">{selectedHost}</span>
						<span class="text-xs ml-1"><RawMdiRename /></span>
					</button>
				{:else}
					<form on:submit={renameHost}>
						<input
							use:focus
							type="text"
							class="input p-0 m-0 text-xs ml-2 w-32"
							bind:value={newHostName}
						/>
					</form>
				{/if}
			</h3>
			<form on:submit={saveHost}>
				<!--MultiSelect
					bind:selected={selectedC}
					inputClass="input"
					liOptionClass="input rounded-none"
					ulOptionsClass="input rounded-none"
					maxOptions={0}
					closeDropdownOnSelect={false}
					autoScroll={false}
					options={[...usersNames]}
					duplicates={false}
				/-->
				<button
					class="btn-sm rounded-md variant-filled-success mt-4"
					disabled={loading}
					type="submit"
				>
					<div class="flex flex-row items-center">
						<RawMdiContentSave /> Save
					</div>
				</button>
				{#if (() => {
					return selectedHost !== newHostName
				})()}
					<button
						class="btn-sm rounded-md variant-filled-warning mt-4"
						disabled={loading}
						type="reset"
						on:click={() => {
							selectedCIDR = acl.getHostCIDR(selectedHost)
						}}
					>
						<div class="flex flex-row items-center">
							<RawMdiUndo /> Discard
						</div>
					</button>
				{/if}
			</form>
			<Delete func={deleteHost} />
		{/if}
	</div>
</Container>