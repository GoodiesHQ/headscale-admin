<script lang="ts">
	import { Autocomplete, getToastStore, TabGroup } from '@skeletonlabs/skeleton';
	import { ACLBuilder, type AclPolicy } from '$lib/common/acl.svelte';
	import { toastSuccess, toastError, toOptions } from '$lib/common/funcs';
	import Delete from '$lib/parts/Delete.svelte';
	import CardListContainer from '$lib/cards/CardListContainer.svelte';
	import { debug } from '$lib/common/debug';

	import RawMdiGroups from '~icons/mdi/account-group';
	import RawMdiPencil from '~icons/mdi/pencil';
	import RawMdiTag from '~icons/mdi/tag';
	import RawMdiDevices from '~icons/mdi/devices';
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

	const userNames = $derived(App.users.value.map((u) => {
		return u.email ? u.email : u.name;
	}).toSorted())
	const userNamesOptions = $derived(toOptions(userNames))
	const tagNames = $derived(acl.getTagNames(true))
	const tagNamesOptions = $derived(toOptions(tagNames))
	const groupNames = $derived(acl.getGroupNames(true));
	const groupNamesOptions = $derived(toOptions(groupNames));
	const hostNames = $derived(acl.getHostNames())
	const hostNamesOptions = $derived(toOptions(hostNames));
	const policy = $derived(makePolicy(idx));

	let deleting = $state(false);

	let tabSetSrc = $state(0)
	let tabSetDst = $state(0)
	const tabs = [
		{ name: "custom", title: "Custom", logo: RawMdiPencil },
		{ name: "user", title: "User", logo: RawMdiTag },
		{ name: "host", title: "Host", logo: RawMdiDevices },
		{ name: "group", title: "Group", logo: RawMdiGroups },
		{ name: "tag", title: "Tag", logo: RawMdiTag },
	]
	
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
		undefined
	)

	const optionsDst = $derived(
		dstNewType == "user" ? userNamesOptions :
		dstNewType == "host" ? hostNamesOptions :
		dstNewType == "group" ? groupNamesOptions:
		dstNewType == "tag" ? tagNamesOptions:
		undefined
	)

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

	function deletePolicy() {
		deleting = true;
		try {
			acl.delPolicy(idx)
			toastSuccess(`Policy #'${idx+1}' has been deleted`, ToastStore);
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
		policy.src.splice(srcIdx, 1)
	}

	function delDst(dstIdx: number) {
		policy.dst.splice(dstIdx, 1)
	}

	function addSrc(host: string) {
		if (host.length === 0) {
			throw new Error("Invailid Host Provided")
		}

		policy.src.push(host)
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
		{#each policy.src as src, i}
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
