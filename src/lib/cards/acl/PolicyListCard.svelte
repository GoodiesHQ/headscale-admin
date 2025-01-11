<script lang="ts">
	import { Autocomplete, getToastStore, InputChip, popup, Tab, TabGroup, type PopupSettings } from '@skeletonlabs/skeleton';
	import { ACLBuilder, type AclPolicy } from '$lib/common/acl.svelte';
	import { toastSuccess, toastError } from '$lib/common/funcs';
	import MultiSelect from '$lib/parts/MultiSelect.svelte';
	import Delete from '$lib/parts/Delete.svelte';
	import CardListContainer from '$lib/cards/CardListContainer.svelte';
	import { debug } from '$lib/common/debug';
	import { UserStore } from '$lib/Stores';
	import { get } from 'svelte/store';

	import RawMdiGroups from '~icons/mdi/account-group';
	import RawMdiPencil from '~icons/mdi/pencil';
	import RawMdiTag from '~icons/mdi/tag';
	import RawMdiDevices from '~icons/mdi/devices';
	import RawMdiSecurity from '~icons/mdi/security';

	import ListEntry from './ListEntry.svelte';
	import Tabbed from '$lib/parts/Tabbed.svelte';

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

	let users = $derived(get(UserStore));
	let userNames = $derived(users.map((u) => u.name).toSorted());
	let userNamesOptions = $derived(toOptions(userNames))
	let tagNames = $derived(acl.getTagNames(true))
	let tagNamesOptions = $derived(toOptions(tagNames))
	let groupNames = $derived(acl.getGroupNames(true));
	let groupNamesOptions = $derived(toOptions(groupNames));
	let hostNames = $derived(acl.getHostNames())
	let hostNamesOptions = $derived(toOptions(hostNames));
	let allValues = $derived(userNames.concat(tagNames, groupNames, hostNames))
	let policy = $derived(makePolicy(idx));

	let deleting = $state(false);

	let tabSet = $state(0)
	const tabs = [
		{ name: "custom", title: "Custom", logo: RawMdiPencil },
		{ name: "user", title: "User", logo: RawMdiTag },
		{ name: "host", title: "Host", logo: RawMdiDevices },
		{ name: "group", title: "Group", logo: RawMdiGroups },
		{ name: "tag", title: "Tag", logo: RawMdiTag },
	]
	let dstNewType = $derived(tabs[tabSet].name)
	let dstNewHost = $state('')
	let dstNewHostEditable = $derived(dstNewType == "custom")
	let dstNewPorts = $state('')
	let dstNewPortsEditable = $derived(policy.proto != "icmp")

	let options = $derived(
		dstNewType == "user" ? userNamesOptions :
		dstNewType == "host" ? hostNamesOptions :
		dstNewType == "group" ? groupNamesOptions:
		dstNewType == "tag" ? tagNamesOptions:
		undefined
	)

	function getDstHost(dst: string): string {
		const i = dst.lastIndexOf(':')
		return i < 0 ? dst : dst.substring(0, i)
	}

	function getDstPorts(dst: string): string {
		const i = dst.lastIndexOf(':')
		return i < 0 ? dst : dst.substring(i+1, dst.length)
	}

	function makePolicy(idx: number) {
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
	}

	function toOptions(values: string[]) {
		return values.map(v => ({
			label: v,
			value: v,
		}))
	}

	function deletePolicy() {
		deleting = true;
		try {
			acl.delPolicy(idx)
			toastSuccess(`Policy #'${idx}' has been deleted`, ToastStore);
		} catch (e) {
			if (e instanceof Error) {
				toastError('', ToastStore, e);
			}
			debug(e)
		} finally {
			deleting = false;
		}
	}

	function delSrc(src: string) {
		policy.src = policy.src.filter((s) => s !== src )
	}

	function delDst(dstIdx: number) {
		policy.dst.splice(dstIdx, 1)
	}

	function addDst(host: string, ports: string) {
		if (host.length === 0) {
			throw new Error("Invailid Host Provided")
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
				throw new Error("Invalid Port Number Provided")
			}

			if (n < 1 || n > 65535) {
				throw new Error("Invalid Port Number Provided")
			}
		}

		policy.dst.push(host + ":" + ports)
	}

</script>

<ListEntry id={idx.toString()} name={"Policy #" + (idx + 1)} logo={RawMdiSecurity} bind:open>
	{#snippet children()}
	<CardListContainer>
		<div class="mb-6">
			<h3 class="font-mono mb-2 flex flex-row items-center">
				<span>Protocol:</span>
			</h3>
			<div>
				<div class="btn-group text-sm rounded-md variant-soft">
					<button
						class={"btn-sm hover:variant-soft-primary " + (policy.proto === undefined ? "variant-soft-primary" : "")}
						onclick={()=>{ policy.proto = undefined }}>Any</button>
					<button
						class={"btn-sm hover:variant-soft-primary " + (policy.proto === "tcp" ? "variant-soft-primary" : "")}
						onclick={()=>{ policy.proto = "tcp" }}>TCP</button>
					<button
						class={"btn-sm hover:variant-soft-primary " + (policy.proto === "udp" ? "variant-soft-primary" : "")}
						onclick={()=>{ policy.proto = "udp" }}>UDP</button>
					<button
						class={"btn-sm hover:variant-soft-primary " + (policy.proto === "icmp" ? "variant-soft-primary" : "")}
						onclick={()=>{ policy.proto = "icmp" }}>ICMP</button>
				</div>
			</div>
		</div>
		<div class="mb-6">
			<h3 class="font-mono mb-2 flex flex-row items-center">
				<span>Sources:</span>
			</h3>
			<MultiSelect
				bind:items={policy.src}
				options={allValues}
				id={"policy-src-" + idx + "-select"}
				placeholder={"Select Sources of policy #" + (idx+1) + "..."}
				onItemClick={(item) => {delSrc(item)}}
			/>
		</div>
		<h3 class="font-mono mb-2 flex flex-row items-center">
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
				<Tabbed {tabs} bind:tabSet />
			</TabGroup>
		</div>
		<div class="mb-6">
			{#if options != undefined}
			<div class="card w-full h-40 p-4 mt-2 overflow-y-auto" tabindex="-1">
				<Autocomplete
					class="rounded-md"
					options={options}
					on:selection={(evt) => {
						dstNewHost = evt.detail.label
					}}
				/>
			</div>
			{/if}
			<div class="flex flex-row space-x-2">
				<input
					class="input rounded-md mt-2"
					placeholder="Dst Object..."
					bind:value={dstNewHost}
					disabled={!dstNewHostEditable} />
				<input
					class="input rounded-md mt-2"
					placeholder="Dst Ports..."
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
					Add
				</button>
			</div>
		</div>
		{#each policy.dst as dst, i}
		<div
			class="card py-3 px-4 grid grid-cols-12 backdrop-brightness-100 bg-white/25 dark:bg-white/5 rounded-md"
		>
			<div class="col-span-6 text-wrap hyphens-auto flex flex-row">
				<span class="font-extralight rounded-md">{getDstHost(dst)}</span>
			</div>
			<div class="col-span-4 text-left">
				<span class="font-extralight rounded-md">{getDstPorts(dst)}</span>
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
