<script lang="ts">
	import CardListPage from '$lib/cards/CardListPage.svelte';
	import { saveConfig, type ACLBuilder } from '$lib/common/acl.svelte';
	import { toastError, toastSuccess, getUserAclName } from '$lib/common/funcs';
	import { _ } from 'svelte-i18n';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import NewItem from '$lib/parts/NewItem.svelte';
	import HostListCard from '$lib/cards/acl/HostListCard.svelte';
	import { debug } from '$lib/common/debug';
	import { App } from '$lib/States.svelte';
	import RawMdiSave from '~icons/mdi/content-save-outline'

	const ToastStore = getToastStore();

	let {acl = $bindable(), loading = $bindable(false)}: {acl: ACLBuilder, loading?: boolean} = $props();

	const userNames = $derived(App.users.value.map(getUserAclName))

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
			toastSuccess($_('acls.hostCreated', { values: { name: newHostName } }), ToastStore);
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

	const filteredHosts = $derived.by(() => {
		const hosts = acl.getHosts()
		if (hostsFilter === '') {
			return hosts
		}

		try {
			const r = RegExp(hostsFilter);
			return hosts.filter(([k, _]) => r.test(k))
		} catch {
			debug(`Host Regex "${hostsFilter}" is invalid`);
			return hosts;
		}
	});
</script>


<CardListPage>
	<div class="mb-2">
		<div class="flex flex-row space-x-2">
			<button disabled={loading} class="btn-icon rounded-md variant-filled-success disabled:opacity-50 w-8 text-xl" onclick={() => { 
				saveConfig(acl, ToastStore, {setLoadingTrue: () => { loading = true}, setLoadingFalse: ()=> { loading = false }})
			}}>
				<RawMdiSave />
			</button>
			<button class="btn-sm rounded-md variant-filled-success" onclick={toggleShowCreateHost}>
				{$_('acls.createHost')}
			</button>
		</div>
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
			autocomplete="off"
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
