<script lang="ts">
	import { debug } from '$lib/common/debug';
	import Page from '$lib/page/Page.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';
	import { TabGroup, getToastStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import JWCC from 'json5'
	import RawMdiGroups from '~icons/mdi/account-group';
	import RawMdiTag from '~icons/mdi/tag';
	import RawMdiDevices from '~icons/mdi/devices';
	import RawMdiCodeJSON from '~icons/mdi/code-json';
	import RawMdiSecurity from '~icons/mdi/security';

	import { ACLBuilder, type ACL } from '$lib/common/acl.svelte';
	import Groups from './Groups.svelte';
	import Hosts from './Hosts.svelte';
	import TagOwners from './TagOwners.svelte'
	import { getPolicy } from '$lib/common/api';
	import { toastError } from '$lib/common/funcs';
	import Policies from './Policies.svelte';
	import Tabbed from '$lib/parts/Tabbed.svelte';

	const ToastStore = getToastStore()

	let acl = $state(ACLBuilder.emptyACL());
	let aclJSON = $derived(acl.JSON(4))
	let loading = $state(false)

	// Navigation tabs
	let tabSet: number = $state(0);
	const tabs = [
		{ name: 'groups', title: 'Groups', logo: RawMdiGroups },
		{ name: 'tag-owners', title: 'Tag Owners', logo: RawMdiTag },
		{ name: 'hosts', title: 'Hosts', logo: RawMdiDevices },
		{ name: 'policies', title: 'Policies', logo: RawMdiSecurity },
		{ name: 'config', title: 'Config', logo: RawMdiCodeJSON },
	];

	onMount(() => {
		getPolicy().then(policy => {
			acl = ACLBuilder.fromPolicy(JWCC.parse<ACL>(policy))
		}).catch(reason => {
			debug("failed to get policy:", reason)
			toastError(`Unable to get policy from server.`, ToastStore, reason)
		})
	});
</script>

<Page>
	<PageHeader title="ACL Builder" />
	<TabGroup
		justify="justify-left"
		active="variant-filled-secondary"
		hover="hover:variant-soft-secondary"
		flex="flex-1 lg:flex-none"
		rounded="rounded-md"
		border=""
		class="bg-surface-100-800-token w-full px-2 py-2"
	>
		<div class="flex text-center">
			<Tabbed {tabs} bind:tabSet />
		</div>
		<svelte:fragment slot="panel">
			{#if tabs[tabSet].name == 'groups'}
				<Groups bind:loading bind:acl />
			{:else if tabs[tabSet].name == 'tag-owners'}
				<TagOwners bind:loading bind:acl />
			{:else if tabs[tabSet].name == 'hosts'}
				<Hosts bind:loading bind:acl />
			{:else if tabs[tabSet].name == 'policies'}
				<Policies bind:loading bind:acl />
			{:else if tabs[tabSet].name == 'config'}
				<pre>{aclJSON}</pre>
			{:else}
				Ok
			{/if}
		</svelte:fragment>
	</TabGroup>
</Page>
