<script lang="ts">
	import { Accordion, getToastStore } from '@skeletonlabs/skeleton';
	import { ACLBuilder, type AclPolicies } from '$lib/common/acl.svelte';
	import { debug } from '$lib/common/debug';
	import { toastError, toastSuccess } from '$lib/common/funcs';
	import CardListPage from '$lib/cards/CardListPage.svelte';

	import PolicyListCard from '$lib/cards/acl/PolicyListCard.svelte';

	const ToastStore = getToastStore();

	let {acl = $bindable(), loading = $bindable(false)}: {acl: ACLBuilder, loading?: boolean} = $props();
	let policyFilterString = $state('')
	let filteredPolicies = $derived(filterPolicies(acl.getAllPolicies()));

	function newPolicy() {
		acl.createPolicy(ACLBuilder.DefaultPolicy())
		toastSuccess('Created Policy ID #' + acl.acls.length, ToastStore)
	}

	function filterPolicies(policies: AclPolicies): AclPolicies {
		try {
			return policies
		} catch {
			return policies
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
			type="text"
			class="input rounded-md text-sm mb-0"
			placeholder="Filter Policies..."
			bind:value={policyFilterString}
		/>
	</div>
	<Accordion autocollapse={false}>
	{#each filteredPolicies as _, i}
		<PolicyListCard bind:acl idx={i} open />
	{/each}
	</Accordion>
</CardListPage>
