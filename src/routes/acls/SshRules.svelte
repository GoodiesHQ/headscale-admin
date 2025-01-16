<script lang="ts">
	import { Accordion, getToastStore } from '@skeletonlabs/skeleton';
	import { ACLBuilder, type AclSshRules, type AclSshRulesIndexed } from '$lib/common/acl.svelte';
	import { debug } from '$lib/common/debug';
	import { toastSuccess } from '$lib/common/funcs';
	import CardListPage from '$lib/cards/CardListPage.svelte';

	import SshRuleListCard from '$lib/cards/acl/SshRuleListCard.svelte';

	const ToastStore = getToastStore();

	let {acl = $bindable(), loading = $bindable(false)}: {acl: ACLBuilder, loading?: boolean} = $props();
	let sshRuleFilterString = $state('')
	const filteredSshRules = $derived(filterSshRules(acl.getAllSshRules(), sshRuleFilterString));

	function newSshRule() {
		acl.createSshRule(ACLBuilder.DefaultSshRule())
		if (acl.ssh !== undefined){
			debug("created new SSH rule at index " + (acl.ssh.length - 1).toString())
			toastSuccess('Created SSH Rule #' + acl.acls.length, ToastStore)
		}
	}

	function filterSshRules(rules: AclSshRules | undefined, filter: string): AclSshRulesIndexed {
		if (rules === undefined) {
			return []
		}

		const rulesIndexed = rules.map((rule, idx) => ({rule, idx}))
		try{
			if (filter === '') {
				return rulesIndexed
			}

			const r = RegExp(filter)
			return rulesIndexed.filter(({rule}) => {
				return rule.src.some(src => r.test(src)) ||
				rule.dst.some(dst => r.test(dst)) ||
				rule.users.some(user => r.test(user))
			})
		} catch {
			debug(`SSH Rule Regex "${filter}" is invalid`);
			return rulesIndexed;
		}
	}
</script>

<CardListPage>
	<div class="mb-2">
		<button class="btn-sm rounded-md variant-filled-success" onclick={newSshRule}>
			Create SSH Rule
		</button>
	</div>

	<div class="flex items-center pb-4 mt-4">
		<input
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