<script lang="ts">
	import { debug } from '$lib/common/debug';
	import Page from '$lib/page/Page.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';
	import { Tab, TabGroup, getToastStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import RawMdiGroups from '~icons/mdi/account-group';
	import RawMdiTag from '~icons/mdi/tag';
	import RawMdiDevices from '~icons/mdi/devices';
	import RawMdiCodeJSON from '~icons/mdi/code-json';
	import RawMdiSecurity from '~icons/mdi/security';

	import { ACLBuilder } from '$lib/common/acl';
	import Groups from './Groups.svelte';
	import Hosts from './Hosts.svelte';
	import TagOwners from './TagOwners.svelte'

	let acl = ACLBuilder.emptyACL();

	// Navigation tabs
	let tabSet: number = 0;
	const tabs = [
		{ name: 'groups', title: 'Groups', logo: RawMdiGroups },
		{ name: 'tag-owners', title: 'Tag Owners', logo: RawMdiTag },
		{ name: 'hosts', title: 'Hosts', logo: RawMdiDevices },
		{ name: 'acl-policies', title: 'Policies', logo: RawMdiSecurity },
		{ name: 'config', title: 'Config', logo: RawMdiCodeJSON },
	];

	onMount(() => {
		acl = acl.setGroupMembers('alpha', ['user.one', 'cloud']);
		acl = acl.setGroupMembers('bravo', ['user.two', 'aarcher']);
		acl = acl.setGroupMembers('charlie', ['user.three', 'aarcher']);
		acl = acl.setGroupMembers('delta', ['user.four', 'user.five']);

		acl = acl.setTagOwners("test1", ["aarcher", "group:testgroup"])

		acl = acl.setHost("test1", "1.1.1.1/32")
		acl = acl.setHost("test2", "1.0.0.1/32")

		console.log(acl)
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
			{#each tabs as tab, i}
				<Tab
					bind:group={tabSet}
					name={tab.name}
					value={i}
					padding="px-2 py-2 md:px-4 md:pt-4 lg:px-6 xl:px-8"
				>
					<svelte:fragment slot="lead">
						<span class="flex flex-row items-center text-xs sm:text-sm lg:text-md justify-center">
							<svelte:component this={tab.logo} />
						</span>
					</svelte:fragment>
					{tab.title}
				</Tab>
			{/each}
		</div>
		<svelte:fragment slot="panel">
			{#if tabs[tabSet].name == 'groups'}
				<Groups bind:acl />
			{:else if tabs[tabSet].name == 'hosts'}
				<Hosts bind:acl />
			{:else if tabs[tabSet].name == 'tag-owners'}
				<TagOwners bind:acl />
			{:else if tabs[tabSet].name == 'config'}
				<pre>{JSON.stringify(acl, null, 2)}</pre>
			{:else}
				Ok
			{/if}
		</svelte:fragment>
	</TabGroup>
</Page>
