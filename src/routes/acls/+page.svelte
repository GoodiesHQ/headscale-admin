<script lang="ts">
	import { TabGroup, getToastStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import JWCC from 'json5'
	import RawMdiCodeJSON from '~icons/mdi/code-json';
	import RawMdiConsole from '~icons/mdi/console';
	import RawMdiDevices from '~icons/mdi/devices';
	import RawMdiGroups from '~icons/mdi/account-group';
	import RawMdiSecurity from '~icons/mdi/security';
	import RawMdiTag from '~icons/mdi/tag';

	import { ACLBuilder, type ACL } from '$lib/common/acl.svelte';
	import { debug } from '$lib/common/debug';
	import { getPolicy } from '$lib/common/api';
	import { toastError } from '$lib/common/funcs';
	import Page from '$lib/page/Page.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';
	import Tabbed from '$lib/parts/Tabbed.svelte';

	import Config from './Config.svelte';
	import Groups from './Groups.svelte';
	import Hosts from './Hosts.svelte';
	import Policies from './Policies.svelte';
	import TagOwners from './TagOwners.svelte'
	import SshRules from './SshRules.svelte';
	import { _ } from 'svelte-i18n';

	const ToastStore = getToastStore()

	let acl = $state(ACLBuilder.defaultACL());
	let loading = $state(false)

	// Navigation tabs
	let tabSet: number = $state(0);
	const tabs = [
		{ name: 'groups', titleKey: 'acls.groups', logo: RawMdiGroups },
		{ name: 'tag-owners', titleKey: 'acls.tagOwners', logo: RawMdiTag },
		{ name: 'hosts', titleKey: 'acls.hosts', logo: RawMdiDevices },
		{ name: 'policies', titleKey: 'acls.policies', logo: RawMdiSecurity },
		{ name: 'ssh', titleKey: 'acls.sshRules', logo: RawMdiConsole },
		{ name: 'config', titleKey: 'acls.config', logo: RawMdiCodeJSON },
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
	<PageHeader title={$_('acls.title')} />
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
			{:else if tabs[tabSet].name == 'ssh'}
				<SshRules bind:loading bind:acl />
			{:else if tabs[tabSet].name == 'config'}
				<Config bind:loading bind:acl />
			{/if}
		</svelte:fragment>
	</TabGroup>
</Page>
