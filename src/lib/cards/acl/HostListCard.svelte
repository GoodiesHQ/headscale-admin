<script lang="ts">
	import RawMdiAlert from '~icons/mdi/alert';
	import { getToastStore, popup, type PopupSettings } from '@skeletonlabs/skeleton';
	import type { ACLBuilder } from '$lib/common/acl.svelte';
	import { toastSuccess, toastError } from '$lib/common/funcs';
	import Delete from '$lib/parts/Delete.svelte';
	import { debug } from '$lib/common/debug';
	import Text from '$lib/parts/Text.svelte';
	import { _ } from 'svelte-i18n';

	const ToastStore = getToastStore();

	type HostListCardProps = {
		acl: ACLBuilder,
		hostName: string,
		hostCIDR: string,
		userNames: string[],
	}

	let {acl = $bindable(), hostName = $bindable(), hostCIDR = $bindable(), userNames}: HostListCardProps = $props()


	let host = $state(makeHost())
	let hostNameNew = $state('');
	let hostCIDRNew = $state('');
	let loading = $state(false);

	function makeHost() {
		return {
			get name() { return hostName },
			set name(n: string) { renameHost(n) },
			get cidr() { return hostCIDR },
			set cidr(c: string) { recidrHost(c) },
		}
	}

	function renameHost(hostNameNew: string) {
		loading = true;
		try {
			if (host.name !== hostNameNew) {
				acl.renameHost(host.name, hostNameNew);
				// toastSuccess(`Host renamed from '${host.name}' to '${hostNameNew}'`, ToastStore);
				hostName = hostNameNew
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

	function recidrHost(hostCIDRNew: string) {
		loading = true;
		try {
			if (host.cidr !== hostCIDRNew) {
				acl.setHost(host.name, hostCIDRNew);
				hostCIDR = hostCIDRNew;
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
			acl.deleteHost(host.name);
			toastSuccess($_('cards.hostDeleted', { values: { name: host.name } }), ToastStore);
		} catch (e) {
			debug(e);
			if (e instanceof Error) {
				toastError('', ToastStore, e);
			}
		}
	}

	let timerInfo: ReturnType<typeof setTimeout>;
	let popupShow = $state(false)

	const popupInfo: PopupSettings = {
		event: 'hover',
		target: 'popupHover-host-' + hostName,
		placement: 'top',
	};

	function handleMouseEnter() {
		timerInfo = setTimeout(() => {
			popupShow = true;
		}, 333);
	}

	function handleMouseLeave() {
		popupShow = false;
		clearTimeout(timerInfo);
	}
</script>

<div
	class="card p-4 variant-filled-warning text-center {popupShow ? '' : 'invisible'}"
	data-popup="popupHover-host-{hostName}"
>
	<p>{$_('cards.hostRenameWarning', { values: { hostName } })}</p>
	<div class="arrow variant-filled-warning"></div>
</div>

<div
	class="card py-3 px-4 grid grid-cols-12 backdrop-brightness-100 bg-surface-50-900-token border border-surface-500/30 rounded-md"
>
	<div class="col-span-4 text-wrap hyphens-auto flex flex-row">
		{#if userNames.includes(hostName)}
		<button
			class="btn p-1 btn-icon variant-soft-error w-6 h-6 [&>*]:pointer-events-none"
			use:popup={popupInfo}
			onmouseenter={handleMouseEnter}
			onmouseleave={handleMouseLeave}
		>
			<RawMdiAlert />
		</button>
		{/if}
		<Text
			bind:value={host.name}
			bind:valueNew={hostNameNew}
			submit={() => { host.name = hostNameNew; return true }}
			classes="font-extralight rounded-md"
			showRenameIcon={false}
		/>
	</div>
	<div class="col-span-4 text-left">
		<Text
			bind:value={host.cidr}
			bind:valueNew={hostCIDRNew}
			submit={() => { host.cidr = hostCIDRNew; return true }}
			classes="text-sm font-mono rounded-md text-primary-500 dark:text-primary-300"
			showRenameIcon={false}
		/>
	</div>
	<div class="col-span-3 text-right">
		<Delete func={deleteHost} disabled={loading} />
	</div>
</div>