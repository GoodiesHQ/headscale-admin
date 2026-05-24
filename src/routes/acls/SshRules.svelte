<script lang="ts">
	import { Accordion, getToastStore } from '@skeletonlabs/skeleton';
	import { ACLBuilder, saveConfig, type AclSshRules, type AclSshRulesIndexed } from '$lib/common/acl.svelte';
	import { debug } from '$lib/common/debug';
	import { toastSuccess } from '$lib/common/funcs';
	import { _ } from 'svelte-i18n';
	import CardListPage from '$lib/cards/CardListPage.svelte';
	import RawMdiSave from '~icons/mdi/content-save-outline'

	import SshRuleListCard from '$lib/cards/acl/SshRuleListCard.svelte';

	const ToastStore = getToastStore();

	type SshRuleProps = {
		acl: ACLBuilder,
		loading?: boolean,
	}

	let {
		acl = $bindable(),
		loading = $bindable(false)
	}: SshRuleProps = $props();

	let sshRuleFilterString = $state('')
	const filteredSshRules = $derived.by(() => {
		const rules = acl.getAllSshRules()

		if (rules === undefined) {
			return []
		}

		const rulesIndexed = rules.map((rule, idx) => ({rule, idx}))
		try{
			if (sshRuleFilterString === '') {
				return rulesIndexed
			}

			const r = RegExp(sshRuleFilterString)
			return rulesIndexed.filter(({rule}) => {
				return rule.src.some(src => r.test(src)) ||
				rule.dst.some(dst => r.test(dst)) ||
				rule.users.some(user => r.test(user))
			})
		} catch {
			debug(`SSH Rule Regex "${sshRuleFilterString}" is invalid`);
			return rulesIndexed;
		}
	});

	function newSshRule() {
		acl.createSshRule(ACLBuilder.DefaultSshRule())
		if (acl.ssh !== undefined){
			debug("created new SSH rule at index " + (acl.ssh.length - 1).toString())
			toastSuccess($_('acls.sshRuleCreated', { values: { count: acl.acls.length } }), ToastStore)
		}
	}
</script>

<CardListPage>
	<div class="mb-2">
		<div class="flex flex-row space-x-2">
			<button disabled={loading} class="btn-icon rounded-md variant-filled-success disabled:opacity-50 w-8 text-xl" onclick={() => { 
				saveConfig(acl, ToastStore, {setLoadingTrue: () => { loading = true}, setLoadingFalse: ()=> { loading = false }})
			}}>
				<RawMdiSave />
			</button>
			<button class="btn-sm rounded-md variant-filled-success" onclick={newSshRule}>
				{$_('acls.createSshRule')}
			</button>
		</div>
	</div>

	<div class="flex items-center pb-4 mt-4">
		<input
			autocomplete="off"
			type="text"
			class="input rounded-md text-sm mb-0"
			placeholder="Filter SSH Rules..."
			bind:value={sshRuleFilterString}
		/>
	</div>
	<Accordion autocollapse={false}>
	{#each filteredSshRules as {idx}}
		<SshRuleListCard bind:acl bind:loading {idx} open />
	{/each}
	</Accordion>
</CardListPage>