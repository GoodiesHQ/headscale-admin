<script lang="ts">
	import { Accordion, getToastStore } from '@skeletonlabs/skeleton';
	import { ACLBuilder, type AclPolicies, type AclPoliciesIndexed } from '$lib/common/acl.svelte';
	import { debug } from '$lib/common/debug';
	import { toastSuccess } from '$lib/common/funcs';
	import CardListPage from '$lib/cards/CardListPage.svelte';

	import PolicyListCard from '$lib/cards/acl/PolicyListCard.svelte';

	const ToastStore = getToastStore();

	let {acl = $bindable(), loading = $bindable(false)}: {acl: ACLBuilder, loading?: boolean} = $props();
	let policyFilterString = $state('')
	const filteredPolicies = $derived(filterPolicies(acl.getAllPolicies(), policyFilterString));

	function newPolicy() {
		acl.createPolicy(ACLBuilder.DefaultPolicy())
		debug("created new policy at index " + (acl.acls.length - 1).toString())
		toastSuccess('Created Policy #' + acl.acls.length, ToastStore)
	}

	function filterPolicies(policies: AclPolicies, filter: string): AclPoliciesIndexed {
		const policiesIndexed = policies.map((policy, idx) => ({policy, idx}))
		try{
			if (filter === '') {
				return policiesIndexed
			}

			const r = RegExp(filter)
			return policiesIndexed.filter(({policy}) => {
				return policy.src.some(src => r.test(src)) ||
				policy.dst.some(dst => r.test(dst)) ||
				(policy.proto !== undefined && r.test(policy.proto))
			})
		} catch {
			debug(`Policy Regex "${filter}" is invalid`);
			return policiesIndexed;
		}
	}
</script>

<CardListPage>
	<div class="mb-2">
		<button class="btn-sm rounded-md variant-filled-success" onclick={newPolicy}>
			Create Policy
		</button>
	</div>

	<div class="flex items-center pb-4 mt-4">
		<input
			autocomplete="off"
			type="text"
			class="input rounded-md text-sm mb-0"
			placeholder="Filter Policies..."
			bind:value={policyFilterString}
		/>
	</div>
	<Accordion autocollapse={false}>
	{#each filteredPolicies as {idx}}
		<PolicyListCard bind:acl bind:loading {idx} open />
	{/each}
	</Accordion>
</CardListPage>
