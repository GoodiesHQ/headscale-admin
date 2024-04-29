<script lang="ts">
	import { getToastStore } from '@skeletonlabs/skeleton';
	import type { ACLBuilder } from '$lib/common/acl';
	import { toastSuccess, toastError } from '$lib/common/funcs';
	import Delete from '$lib/parts/Delete.svelte';
	import { debug } from '$lib/common/debug';
	import Text from '$lib/parts/Text.svelte';

	const ToastStore = getToastStore();

	export let acl: ACLBuilder;

	export let host: string;
	export let cidr: string;

	$: hostNewName = '';
	$: hostNewCIDR = '';
	$: loading = false;

	function renameHost() {
		loading = true;
		try {
			if (host !== hostNewName) {
				acl = acl.renameHost(host, hostNewName);
				toastSuccess(`Host renamed from '${host}' to '${hostNewName}'`, ToastStore);
				host = hostNewName;
				debug(acl.hosts);
			}
			return true;
		} catch (e) {
			debug(e);
			if (e instanceof Error) {
				toastError('', ToastStore, e);
			}
		} finally {
			loading = false;
		}
	}

	function recidrHost() {
		loading = true;
		try {
			if (cidr !== hostNewCIDR) {
				acl = acl.setHost(host, hostNewCIDR);
				cidr = hostNewCIDR;
			}
			return true;
		} catch (e) {
			debug(e);
			if (e instanceof Error) {
				toastError('', ToastStore, e);
			}
		} finally {
			loading = false;
		}
	}

	function deleteHost() {
		try {
			acl = acl.deleteHost(host);
			toastSuccess(`Host '${host}' deleted`, ToastStore);
		} catch (e) {
			debug(e);
			if (e instanceof Error) {
				toastError('', ToastStore, e);
			}
		}
	}
</script>

<div
	class="card py-3 px-4 grid grid-cols-12 backdrop-brightness-100 bg-white/25 dark:bg-white/5 rounded-md"
>
	<div class="col-span-4 text-wrap hyphens-auto">
		<Text
			bind:value={host}
			bind:valueNew={hostNewName}
			submit={renameHost}
			class="font-extralight rounded-md"
			showRenameIcon={false}
		/>
	</div>
	<div class="col-span-4 text-left">
		<Text
			bind:value={cidr}
			bind:valueNew={hostNewCIDR}
			submit={recidrHost}
			class="text-sm font-mono rounded-md text-primary-500 dark:text-primary-300"
			showRenameIcon={false}
		/>
	</div>
	<div class="col-span-3 text-right">
		<Delete func={deleteHost} disabled={loading} />
	</div>
</div>
<!--AccordionItem
	{open}
	id={host}
	class="backdrop-brightness-100 bg-white/25 dark:bg-white/5 rounded-md"
	padding="py-4 px-4"
	regionControl="!rounded-none"
>
	<svelte:fragment slot="lead">
		<span class="">
			<RawMdiGroup />
		</span>
	</svelte:fragment>
	<svelte:fragment slot="summary">
		<div class="grid">
			{host}
		</div>
	</svelte:fragment>
	<svelte:fragment slot="content">
		<CardListContainer>
			<h3 class="font-mono mb-4 flex flex-row items-center">
				<span>Host</span>
				{#if !showRenameHost}
					<button
						class="flex flex-row ml-2 items-center"
						on:click={() => {
							hostNewName = host;
							showRenameHost = true;
						}}
					>
						<span class="text-primary-500 dark:text-primary-300">{host}</span>
						<span class="text-xs ml-1"><RawMdiRename /></span>
					</button>
				{:else}
					<form on:submit|preventDefault={renameHost}>
						<input
							use:focus
							type="text"
							class="input p-0 m-0 text-xs ml-2 w-32"
							bind:value={hostNewName}
						/>
					</form>
				{/if}
			</h3>
			<div class="">
				<input

				/>
				<div class="pt-4">
					<Delete func={deleteHost} />
				</div>
			</div>
		</CardListContainer>
	</svelte:fragment>
</AccordionItem-->
