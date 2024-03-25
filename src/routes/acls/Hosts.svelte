<script lang="ts">
	import CardListPage from '$lib/cards/CardListPage.svelte';
	import type { ACLBuilder, AclHosts } from '$lib/common/acl';
	import { toastError, toastSuccess } from '$lib/common/funcs';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import NewItem from './NewItem.svelte';
	import HostListCard from '$lib/cards/acl/HostListCard.svelte';
	import { debug } from '$lib/common/debug';

	const ToastStore = getToastStore();

	export let acl: ACLBuilder;

	$: loading = false;

	$: showCreateHost = false;
	$: newHostName = '';
	$: newHostCIDR = '';

	let hostsFilter = '';

	function  toggleShowCreateHost(){
		showCreateHost = !showCreateHost;
	}

	function newHost() {
		loading = true;
		try {
			acl = acl.createHost(newHostName, newHostCIDR);
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

	$: filteredHosts = filterHosts(acl.getHosts(), hostsFilter);
</script>


<CardListPage>
	<div class="mb-2">
		<button class="btn-sm rounded-md variant-filled-success" on:click={toggleShowCreateHost}>
			Create
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
	{#each filteredHosts as [host, cidr]}
		<HostListCard bind:acl {host} {cidr} />
	{/each}
</CardListPage>
