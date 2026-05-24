<script lang="ts">
	import { Autocomplete, getToastStore, TabGroup } from '@skeletonlabs/skeleton';
	import { ACLBuilder, HAMetaDefault, type AclPolicy } from '$lib/common/acl.svelte';
	import { toastSuccess, toastError, toOptions, getUserAclName } from '$lib/common/funcs';
	import Delete from '$lib/parts/Delete.svelte';
	import CardListContainer from '$lib/cards/CardListContainer.svelte';
	import { debug } from '$lib/common/debug';
	import { _ } from 'svelte-i18n';

	import RawMdiArrowUp from '~icons/mdi/chevron-up';
	import RawMdiArrowDown from '~icons/mdi/chevron-down';
	import RawMdiGroups from '~icons/mdi/account-group';
	import RawMdiPencil from '~icons/mdi/pencil';
	import RawMdiTag from '~icons/mdi/tag';
	import RawMdiDevices from '~icons/mdi/devices';
	import RawMdiSecurity from '~icons/mdi/security';

	import ListEntry from './ListEntry.svelte';
	import Tabbed from '$lib/parts/Tabbed.svelte';
	import { App } from '$lib/States.svelte';
	import { slide } from 'svelte/transition';

	const ToastStore = getToastStore();

	type PolicyListCardProps = {
		acl: ACLBuilder,
		idx: number,
		loading?: boolean,
		reorderUp: () => void,
		reorderDown: ()=> void,
	}

	let {
		acl = $bindable(),
		idx,
		loading = $bindable(false),
		reorderUp,
		reorderDown,
	}: PolicyListCardProps = $props()

	const userNames = $derived(App.users.value.map(getUserAclName).toSorted())
	const userNamesOptions = $derived(toOptions(userNames))
	const tagNames = $derived(acl.getTagNames(true))
	const tagNamesOptions = $derived(toOptions(tagNames))
	const groupNames = $derived(acl.getGroupNames(true));
	const groupNamesOptions = $derived(toOptions(groupNames));
	const hostNames = $derived(acl.getHostNames())
	const hostNamesOptions = $derived(toOptions(hostNames));
	const policy = $derived.by(() => {
		return {
			get policy() { return acl.getPolicy(idx) },
			set policy(policy: AclPolicy) { acl.setPolicy(idx, policy); },
			get src() { return acl.getPolicy(idx).src },
			set src(src: string[]) { acl.setPolicySrc(idx, src) },
			get dst() { return acl.getPolicy(idx).dst },
			set dst(dst: string[]) { acl.setPolicyDst(idx, dst) },
			get proto() { return acl.getPolicy(idx).proto },
			set proto(proto: string | undefined) { acl.setPolicyProto(idx, proto) },
		}
	});

	const opener = $derived.by(() => {
		return {
			get open() {
				ACLBuilder.addPolicyMeta(policy.policy)
				return policy.policy["#ha-meta"] !== undefined 
					&& policy.policy["#ha-meta"].open
			},
			set open(open: boolean) {
				ACLBuilder.addPolicyMeta(policy.policy)
				if (policy.policy["#ha-meta"] !== undefined) {
					policy.policy["#ha-meta"].open = open
				}
			},
		}
	})

	const policyName = $derived.by(() => {
		let state = $state({
			value: policy.policy["#ha-meta"]?.name ?? "",
		})
		return state;
	})

	let tabSetSrc = $state(0)
	let tabSetDst = $state(0)

	const autogroupNames = [
		'autogroup:self',
		'autogroup:member',
		'autogroup:tagged',
		'autogroup:admin',
		'autogroup:internet',
	];
	const autogroupOptions = $derived(toOptions(autogroupNames));

	const tabs = $derived([
		{ name: "custom", title: $_('cards.custom'), logo: RawMdiPencil },
		{ name: "user", title: $_('cards.user'), logo: RawMdiTag },
		{ name: "host", title: $_('cards.host'), logo: RawMdiDevices },
		{ name: "group", title: $_('cards.group'), logo: RawMdiGroups },
		{ name: "tag", title: $_('cards.tag'), logo: RawMdiTag },
		{ name: "autogroup", title: $_('cards.autogroup'), logo: RawMdiSecurity },
	])
	
	const srcNewType = $derived(tabs[tabSetSrc].name)
	let srcNewHost = $state('')
	const srcNewHostEditable = $derived(srcNewType == "custom")
	const dstNewType = $derived(tabs[tabSetDst].name)
	let dstNewHost = $state('')
	const dstNewHostEditable = $derived(dstNewType == "custom")
	let dstNewPorts = $state('')
	const dstNewPortsEditable = $derived(policy.proto != "icmp")

	const optionsSrc = $derived(
		srcNewType == "user" ? userNamesOptions :
		srcNewType == "host" ? hostNamesOptions :
		srcNewType == "group" ? groupNamesOptions:
		srcNewType == "tag" ? tagNamesOptions:
		srcNewType == "autogroup" ? autogroupOptions :
		undefined
	)

	const optionsDst = $derived(
		dstNewType == "user" ? userNamesOptions :
		dstNewType == "host" ? hostNamesOptions :
		dstNewType == "group" ? groupNamesOptions:
		dstNewType == "tag" ? tagNamesOptions:
		dstNewType == "autogroup" ? autogroupOptions :
		undefined
	)

	function deletePolicy() {
		loading = true;
		try {
			acl.delPolicy(idx)
			toastSuccess($_('cards.policyDeleted', { values: { number: idx+1 } }), ToastStore);
		} catch (e) {
			if (e instanceof Error) {
				toastError('', ToastStore, e);
			}
			debug(e)
		} finally {
			loading = false;
		}
	}

	function delSrc(srcIdx: number) {
		policy.src.splice(srcIdx, 1)
	}

	function delDst(dstIdx: number) {
		policy.dst.splice(dstIdx, 1)
	}

	function addSrc(host: string) {
		if (host.length === 0) {
			throw new Error($_('cards.invalidHost'))
		}

		policy.src.push(host)
	}

	function addDst(host: string, ports: string) {
		if (host.length === 0) {
			throw new Error($_('cards.invalidHost'))
		}

		if (policy.proto === "icmp") {
			ports = "*"
		}

		const portsAll = ports.replaceAll(" ", "").split(",")
		for (const p of portsAll) {
			if (p == "*") {
				continue
			}

			const n = parseInt(p, 10)

			if (isNaN(n)) {
				throw new Error($_('cards.invalidPort'))
			}

			if (n < 1 || n > 65535) {
				throw new Error($_('cards.invalidPort'))
			}
		}

		policy.dst.push(host + ":" + ports)
	}

	function setPolicyName(name: string) {
		if(policy.policy["#ha-meta"] === undefined) {
			policy.policy["#ha-meta"] = HAMetaDefault
		}
		// too noisy and annoying without debouncing, which risks someone reordering during debounce which would update the wrong name
		// debug(`Changing policy name from '${policy.policy["#ha-meta"].name}' to '${name}'`)
		policy.policy["#ha-meta"].name = name
	}

	function slideX(el: Element) {
		return slide(el, {
			duration: 250,
			axis: "x",
		})
	}
</script>

<div class="flex flex-row w-full">
	<div 
        transition:slideX
        class="flex flex-col items-center space-y-0.5 text-secondary-700 dark:text-secondary-300 mr-2 w-auto"
    >
        <button 
            class={`btn-xs w-6 h-6 btn-icon rounded-md p-0 pt-1.5 leading-none text-xl`}
			disabled={idx === 0}
            onclick={reorderUp}
        >
            <RawMdiArrowUp class="w-5 h-5" />
        </button>
        <button
            class={`btn-xs w-6 h-6 btn-icon rounded-md p-0 pb-1.5 leading-none`}
			disabled={idx === acl.acls.length - 1}
            onclick={reorderDown}
        >
            <RawMdiArrowDown class="w-5 h-5" />
        </button>
    </div>
	<div class="flex-1 min-w-0">
	<ListEntry id={idx.toString()} name={ACLBuilder.getPolicyTitle(policy.policy, idx)} logo={RawMdiSecurity} bind:open={opener.open}>
		{#snippet children()}
		<CardListContainer>
			<div class="mb-6">
				<h3 class="font-mono mb-2 flex flex-row items-center">
					<label for="policy-name">{$_('cards.name')}</label>
					<input
						type="text" 
						name="policy-name"
						class="input text-xs rounded-md ml-4"
						autocomplete="off"
						bind:value={policyName.value}
						oninput={() => setPolicyName(policyName.value)}
					/>
				</h3>
				<h3 class="font-mono mb-2 flex flex-row items-center">
					<span>{$_('cards.protocol')}</span>
				</h3>
				<div>
					<div class="btn-group text-sm rounded-md variant-soft">
						<button
							class={"btn-sm hover:variant-soft-primary " + (policy.proto === undefined ? "variant-soft-primary" : "")}
							onclick={()=>{ policy.proto = undefined }}>{$_('cards.any')}</button>
						<button
							class={"btn-sm hover:variant-soft-primary " + (policy.proto === "tcp" ? "variant-soft-primary" : "")}
							onclick={()=>{ policy.proto = "tcp" }}>{$_('cards.tcp')}</button>
						<button
							class={"btn-sm hover:variant-soft-primary " + (policy.proto === "udp" ? "variant-soft-primary" : "")}
							onclick={()=>{ policy.proto = "udp" }}>{$_('cards.udp')}</button>
						<button
							class={"btn-sm hover:variant-soft-primary " + (policy.proto === "icmp" ? "variant-soft-primary" : "")}
							onclick={()=>{ policy.proto = "icmp" }}>{$_('cards.icmp')}</button>
					</div>
				</div>
			</div>
			<h3 class="font-mono mb-2 flex flex-row items-center">
				<span>{$_('cards.sources')}</span>
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
					<Tabbed {tabs} bind:tabSet={tabSetSrc} />
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
						placeholder={$_('cards.srcObject')}
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
						{$_('cards.add')}
					</button>
				</div>
			</div>
			{#each policy.src as src, i}
			<div
				class="card py-3 px-4 grid grid-cols-12 backdrop-brightness-100 bg-surface-50-900-token border border-surface-500/30 rounded-md"
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
				<span>{$_('cards.destinations')}</span>
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
					<Tabbed {tabs} bind:tabSet={tabSetDst} />
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
						placeholder={$_('cards.dstObject')}
						bind:value={dstNewHost}
						disabled={!dstNewHostEditable} />
					<input
						autocomplete="off"
						class="input rounded-md mt-2"
						placeholder={$_('cards.dstPorts')}
						bind:value={dstNewPorts}
						disabled={!dstNewPortsEditable} />
					<button
						class="btn btn-sm rounded-md mt-2 variant-soft-tertiary"
						onclick={()=>{
							try{
								addDst(dstNewHost, dstNewPorts)
								dstNewHost = ""
								dstNewPorts = ""
							} catch(e) {
								if (e instanceof Error) {
									toastError('', ToastStore, e)
								}
								debug(e)
							}
						}}
					>
						{$_('cards.add')}
					</button>
				</div>
			</div>
			{#each policy.dst as dst, i}
			<div
				class="card py-3 px-4 grid grid-cols-12 backdrop-brightness-100 bg-surface-50-900-token border border-surface-500/30 rounded-md"
			>
				<div class="col-span-6 text-wrap hyphens-auto flex flex-row">
					<span class="font-extralight rounded-md">{ACLBuilder.getPolicyDstHost(dst)}</span>
				</div>
				<div class="col-span-4 text-left">
					<span class="font-extralight rounded-md">{ACLBuilder.getPolicyDstPorts(dst)}</span>
				</div>
				<div class="col-span-2 text-right">
					<Delete func={()=>{delDst(i)}} disabled={loading} />
				</div>
			</div>
			{/each}
			<div class="pt-4">
				<Delete func={deletePolicy} />
			</div>
		</CardListContainer>
		{/snippet}
	</ListEntry>
	</div>
</div>