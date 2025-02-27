<script lang="ts">
	import { Accordion, getToastStore } from '@skeletonlabs/skeleton';
	import { ACLBuilder, HAMetaDefault, saveConfig, type AclPolicies, type AclPoliciesIndexed } from '$lib/common/acl.svelte';
	import { debug } from '$lib/common/debug';
	import { toastSuccess } from '$lib/common/funcs';
	import CardListPage from '$lib/cards/CardListPage.svelte';
	import RawMdiSave from '~icons/mdi/content-save-outline'

	import PolicyListCard from '$lib/cards/acl/PolicyListCard.svelte';

	const ToastStore = getToastStore();

	let {acl = $bindable(), loading = $bindable(false)}: {acl: ACLBuilder, loading?: boolean} = $props();
	let policyFilterString = $state('')
	let showReorderControls = $state(false)

	const filteredPolicies = $derived.by(() => {
		const policiesIndexed = acl.getAllPolicies().map((policy, idx) => ({policy, idx}))
		try{
			if (policyFilterString === '') {
				return policiesIndexed
			}

			const r = RegExp(policyFilterString.toLowerCase())
			return policiesIndexed.filter(({policy}) => {
				return policy.src.some(src => r.test(src)) ||
				policy.dst.some(dst => r.test(dst)) ||
				(policy.proto !== undefined && r.test(policy.proto)) ||
				(policy["#ha-meta"] !== undefined && r.test(policy["#ha-meta"].name.toLowerCase()))
			})
		} catch {
			debug(`Policy Regex "${policyFilterString}" is invalid`);
			return policiesIndexed;
		}
	});

	function newPolicy() {
		const policy = ACLBuilder.EmptyPolicy()
		ACLBuilder.addPolicyMeta(policy)

		acl.createPolicy(policy)
		debug("created new policy at index " + (acl.acls.length - 1).toString())
		toastSuccess('Created Policy #' + acl.acls.length, ToastStore)
	}

	function makeReorderFunc(idx: number, direction: 'up' | 'down'): () => void {
		return () => {
			const length = acl.acls.length
			if((idx === 0 && direction === 'up')
			|| (idx === (length - 1) && direction === 'down')
			) {
				return
			}

			const targetIdx = direction === "up" ? idx - 1 : idx + 1;
			const temp = acl.acls[targetIdx];
			acl.acls[targetIdx] = acl.acls[idx];
			acl.acls[idx] = temp;
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
			<button class="btn-sm rounded-md variant-filled-success" onclick={newPolicy}>
				Create Policy
			</button>
			<button class="btn-sm rounded-md variant-filled-secondary" onclick={() => { showReorderControls = showReorderControls ? false : true}}>
				{#if showReorderControls}
				Hide Reordering
				{:else}
				Show Reordering
				{/if}
			</button>
		</div>
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
		<PolicyListCard 
			bind:acl
			bind:loading
			reorder={showReorderControls}
			{idx}
			reorderUp={makeReorderFunc(idx, 'up')}
			reorderDown={makeReorderFunc(idx, 'down')}
			/>
	{/each}
	</Accordion>
</CardListPage>
