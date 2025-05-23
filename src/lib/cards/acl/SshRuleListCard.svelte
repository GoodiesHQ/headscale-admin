<script lang="ts">
	import { Autocomplete, getToastStore, InputChip, popup, Tab, TabGroup, type PopupSettings } from '@skeletonlabs/skeleton';
	import { ACLBuilder, type AclPolicy, type AclSshRule } from '$lib/common/acl.svelte';
	import { toastSuccess, toastError, toOptions } from '$lib/common/funcs';
	import MultiSelect from '$lib/parts/MultiSelect.svelte';
	import Delete from '$lib/parts/Delete.svelte';
	import CardListContainer from '$lib/cards/CardListContainer.svelte';
	import { debug } from '$lib/common/debug';
	import { get } from 'svelte/store';

	import RawMdiGroups from '~icons/mdi/account-group';
	import RawMdiPencil from '~icons/mdi/pencil';
	import RawMdiTag from '~icons/mdi/tag';
	import RawMdiSecurity from '~icons/mdi/security';

	import ListEntry from './ListEntry.svelte';
	import Tabbed from '$lib/parts/Tabbed.svelte';
	import { App } from '$lib/States.svelte';

	const ToastStore = getToastStore();

	type PolicyListCardProps = {
		acl: ACLBuilder,
		idx: number,
		open: boolean,
		loading?: boolean
	}

	let {
		acl = $bindable(),
		idx,
		open = $bindable(),
		loading = $bindable(false),
	}: PolicyListCardProps = $props()

	const userNames = $derived(App.users.value.map((u) => u.name).toSorted());
	const userNamesOptions = $derived(toOptions(userNames))
	const tagNames = $derived(acl.getTagNames(true))
	const tagNamesOptions = $derived(toOptions(tagNames))
	const groupNames = $derived(acl.getGroupNames(true));
	const groupNamesOptions = $derived(toOptions(groupNames));
	const rule = $derived.by(() => {
		return {
			get rule() { return acl.getSshRule(idx) },
			set rule(rule: AclSshRule) { acl.setSshRule(idx, rule); },
			get src() { return acl.getSshRule(idx).src },
			set src(src: string[]) { acl.setSshRuleSrc(idx, src) },
			get dst() { return acl.getSshRule(idx).dst },
			set dst(dst: string[]) { acl.setSshRuleDst(idx, dst) },
			get users() { return acl.getSshRule(idx).users },
			set users(users: string[]) { acl.setSshRuleUsers(idx, users) },
		}
	});

	let deleting = $state(false);

	let tabSetSrc = $state(0)
	const tabsSrc = [
		{ name: "custom", title: "Custom", logo: RawMdiPencil },
		{ name: "user", title: "User", logo: RawMdiTag },
		{ name: "group", title: "Group", logo: RawMdiGroups },
		{ name: "tag", title: "Tag", logo: RawMdiTag },
	]

	let tabSetDst = $state(0)
	const tabsDst = [
		{ name: "custom", title: "Custom", logo: RawMdiPencil },
		{ name: "user", title: "User", logo: RawMdiTag },
		{ name: "tag", title: "Tag", logo: RawMdiTag },
	]
	
	const srcNewType = $derived(tabsSrc[tabSetSrc].name)
	let srcNewHost = $state('')
	const srcNewHostEditable = $derived(srcNewType == "custom")

	const dstNewType = $derived(tabsDst[tabSetDst].name)
	let dstNewHost = $state('')
	const dstNewHostEditable = $derived(dstNewType == "custom")

	const optionsSrc = $derived(
		srcNewType == "user" ? userNamesOptions :
		srcNewType == "group" ? groupNamesOptions:
		srcNewType == "tag" ? tagNamesOptions:
		undefined
	)

	const optionsDst = $derived(
		dstNewType == "user" ? userNamesOptions :
		dstNewType == "tag" ? tagNamesOptions:
		undefined
	)

	function deleteSshRule() {
		deleting = true;
		try {
			acl.delSshRule(idx)
			toastSuccess(`SSH Rule #'${idx+1}' has been deleted`, ToastStore);
		} catch (e) {
			if (e instanceof Error) {
				toastError('', ToastStore, e);
			}
			debug(e)
		} finally {
			deleting = false;
		}
	}

	function delSrc(srcIdx: number) {
		rule.src.splice(srcIdx, 1)
	}

	function delDst(dstIdx: number) {
		rule.dst.splice(dstIdx, 1)
	}

	function addSrc(host: string) {
		if (host.length === 0) {
			throw new Error("Invailid Host Provided")
		}

		rule.src.push(host)
	}

	function addDst(host: string) {
		if (host.length === 0) {
			throw new Error("Invailid Host Provided")
		}

		rule.dst.push(host)
	}
	
	function delUsername(username: string) {
		rule.users = rule.users.filter(u => u != username)
	}
</script>

<ListEntry id={idx.toString()} name={"SSH Rule #" + (idx + 1)} logo={RawMdiSecurity} bind:open>
	{#snippet children()}
	<CardListContainer>
		<h3 class="font-mono mb-2 flex flex-row items-center">
			<span>Sources:</span>
		</h3>
		<div>
			<TabGroup
				justify="justify-left"
				active="variant-filled-tertiary"
				hover="hover:variant-soft-tertiary"
				flex="flex-1 lg:flex-none"
				rounded="rounded-md"
				border=""
				class="bg-surface-100-800-token w-full px-2 py-2"
			>
				<Tabbed tabs={tabsSrc} bind:tabSet={tabSetSrc} />
			</TabGroup>
		</div>
		<div class="mb-6">
			{#if optionsSrc != undefined}
			<div class="card w-full h-32 p-4 mt-2 overflow-y-auto" tabindex="-1">
				<Autocomplete
					class="rounded-md"
					options={optionsSrc}
					on:selection={(evt) => {
						srcNewHost = evt.detail.label
					}}
				/>
			</div>
			{/if}
			<div class="flex flex-row space-x-2">
				<input
					autocomplete="off"
					class="input rounded-md mt-2"
					placeholder="Src Object..."
					bind:value={srcNewHost}
					disabled={!srcNewHostEditable} />
				<button
					class="btn btn-sm rounded-md mt-2 variant-soft-tertiary"
					onclick={()=>{
						try{
							addSrc(srcNewHost)
							srcNewHost = ""
						} catch(e) {
							if (e instanceof Error) {
								toastError('', ToastStore, e)
							}
							debug(e)
						}
					}}
				>
					Add
				</button>
			</div>
		</div>
		{#each rule.src as src, i}
		<div
			class="card py-3 px-4 grid grid-cols-12 backdrop-brightness-100 bg-white/25 dark:bg-white/5 rounded-md"
		>
			<div class="col-span-10 text-wrap hyphens-auto flex flex-row">
				<span class="font-extralight rounded-md">{src}</span>
			</div>
			<div class="col-span-2 text-right">
				<Delete func={()=>{delSrc(i)}} disabled={loading} />
			</div>
		</div>
		{/each}
		<!-- --- -->
		<h3 class="font-mono mb-2 mt-6 flex flex-row items-center">
			<span>Destinations:</span>
		</h3>
		<div>
			<TabGroup
				justify="justify-left"
				active="variant-filled-tertiary"
				hover="hover:variant-soft-tertiary"
				flex="flex-1 lg:flex-none"
				rounded="rounded-md"
				border=""
				class="bg-surface-100-800-token w-full px-2 py-2"
			>
				<Tabbed tabs={tabsDst} bind:tabSet={tabSetDst} />
			</TabGroup>
		</div>
		<div class="mb-6">
			{#if optionsDst != undefined}
			<div class="card w-full h-32 p-4 mt-2 overflow-y-auto" tabindex="-1">
				<Autocomplete
					class="rounded-md"
					options={optionsDst}
					on:selection={(evt) => {
						dstNewHost = evt.detail.label
					}}
				/>
			</div>
			{/if}
			<div class="flex flex-row space-x-2">
				<input
					autocomplete="off"
					class="input rounded-md mt-2"
					placeholder="Dst Object..."
					bind:value={dstNewHost}
					disabled={!dstNewHostEditable} />
				<button
					class="btn btn-sm rounded-md mt-2 variant-soft-tertiary"
					onclick={()=>{
						try{
							addDst(dstNewHost)
							dstNewHost = ""
						} catch(e) {
							if (e instanceof Error) {
								toastError('', ToastStore, e)
							}
							debug(e)
						}
					}}
				>
					Add
				</button>
			</div>
		</div>
		{#each rule.dst as dst, i}
		<div
			class="card py-3 px-4 grid grid-cols-12 backdrop-brightness-100 bg-white/25 dark:bg-white/5 rounded-md"
		>
			<div class="col-span-10 text-wrap hyphens-auto flex flex-row">
				<span class="font-extralight rounded-md">{dst}</span>
			</div>
			<div class="col-span-2 text-right">
				<Delete func={()=>{delDst(i)}} disabled={loading} />
			</div>
		</div>
		{/each}
		<h3 class="font-mono mb-2 mt-4 flex flex-row items-center">
			<span>Usernames:</span>
		</h3>
		<MultiSelect
			id={"ssh-rule-users-" + idx.toString()}
			bind:items={rule.users}
			onItemClick={(item) => {
				delUsername(item)
			}}
		/>
		<div class="pt-4">
			<Delete func={deleteSshRule} />
		</div>
	</CardListContainer>
	{/snippet}
</ListEntry>
