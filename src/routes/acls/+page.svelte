<script lang="ts">
	import {
		ApiEndpointsStore,
		ApiKeyInfoStore,
		ApiKeyStore,
		ApiTtlStore,
		ApiUrlStore,
		DebugStore,
		populateApiKeyInfoStore,
		populateStores,
	} from '$lib/Stores';
	import { debug } from '$lib/common/debug';
	import { createPopulateErrorHandler } from '$lib/common/errors';
	import {
		getTime,
		getTimeDifference,
		getTimeDifferenceColor,
		refreshApiKey,
		toastSuccess,
	} from '$lib/common/funcs';
	import type { ExpirationMessage } from '$lib/common/types';
	import Page from '$lib/page/Page.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';
	import { Tab, TabGroup, getToastStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import RawMdiGroups from '~icons/mdi/account-group';
	import RawMdiTag from '~icons/mdi/tag';
	import RawMdiDevices from '~icons/mdi/devices';
	import RawMdiCodeJSON from '~icons/mdi/code-json';
	import RawMdiSecurity from '~icons/mdi/security';
	import RawOrbit from '~icons/mdi/orbit-variant';
	import Groups from './Groups.svelte';
	import { GetEmptyACL } from './acl';

	let acl = GetEmptyACL();
	let tabSet: number = 0;
	const tabs = [
		{ name: 'groups', title: 'Groups', logo: RawMdiGroups },
		{ name: 'hosts', title: 'Networks', logo: RawMdiDevices },
		{ name: 'tag-owners', title: 'Tag Owners', logo: RawMdiTag },
		{ name: 'acl-policies', title: 'Policies', logo: RawMdiSecurity },
		{ name: 'json', title: 'Config', logo: RawMdiCodeJSON },
	];

	onMount(() => {
		acl.groups = {
			alpha: ['aarcher', 'cloud'],
			bravo: ['user.two', 'cloud'],
			charlie: ['user.one', 'cloud'],
			delta: ['cloud'],
			echo: ['user.three', 'cloud'],
			foxtrot: ['aarcher', 'user.four'],
			golf: ['user.five', 'cloud'],
		};
		return () => {};
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
							<svelte:component this={tab.logo} class="mr-2" />
						</span>
					</svelte:fragment>
					{tab.title}
				</Tab>
			{/each}
		</div>
		<svelte:fragment slot="panel">
			{#if tabs[tabSet].name == 'groups'}
				<Groups {acl} />
			{:else}
				Ok
			{/if}
		</svelte:fragment>
	</TabGroup>
</Page>
