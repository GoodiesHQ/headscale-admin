<script lang="ts">
	import CardListPage from '$lib/cards/CardListPage.svelte';
	import type { ACLBuilder, AclHosts } from '$lib/common/acl.svelte';
	import { toastError, toastSuccess } from '$lib/common/funcs';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import NewItem from './NewItem.svelte';
	import HostListCard from '$lib/cards/acl/HostListCard.svelte';
	import { debug } from '$lib/common/debug';
	import { UserStore } from '$lib/Stores';
	import { get } from 'svelte/store';

	const ToastStore = getToastStore();

	let {acl = $bindable(), loading = $bindable(false)}: {acl: ACLBuilder, loading?: boolean} = $props();

	let users = $state(get(UserStore))
	let userNames = $derived(users.map(u => u.name))

	let showCreateHost = $state(false);
	let newHostName = $state('');
	let newHostCIDR = $state('');

	let hostsFilter = $state('');

	function toggleShowCreateHost(){
		showCreateHost = !showCreateHost;
	}

	function newHost() {
		loading = true;
		try {
			acl.createHost(newHostName, newHostCIDR);
			toastSuccess(`Host '${newHostName}' created`, ToastStore);
			newHostName = '';
			newHostCIDR = '';
			showCreateHost = false;
		} catch (e) {
			debug(e)
			if (e instanceof Error) {
				toastError('', ToastStore, e);
			}
		} finally {
			loading = false;
		}
	}


	function filterHosts(hosts: [string, string][], filter: string): [string, string][] {
		try {
			const r = RegExp(filter);
			return hosts.filter(([k, _]) => r.test(k))
		} catch {
			debug(`Host Regex "${filter}" is invalid`);
			return hosts;
		}
	}

	let filteredHosts = $derived(filterHosts(acl.getHosts(), hostsFilter));
</script>


<CardListPage>
	<div class="mb-2">
		<button class="btn-sm rounded-md variant-filled-success" onclick={toggleShowCreateHost}>
			Create Host
		</button>
		{#if showCreateHost}
			<NewItem
				title="Host"
				disabled={loading}
				bind:name={newHostName}
				bind:value={newHostCIDR}
				submit={() => {
					newHost();
				}}
			/>
		{/if}
	</div>

	<div class="flex items-center pb-4 mt-4">
		<input
			type="text"
			class="input rounded-md text-sm mb-0"
			placeholder="Filter Hosts..."
			bind:value={hostsFilter}
		/>
	</div>
	<!--{#each filteredHosts.sort(([k1], [k2]) => k1.localeCompare(k2)) as [k, v]}-->
	{#each filteredHosts as [hostName, hostCIDR]}
		<HostListCard bind:acl {hostName} {hostCIDR} {userNames} />
	{/each}
</CardListPage>
