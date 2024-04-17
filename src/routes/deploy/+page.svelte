<script lang="ts">
	import { ApiUrlStore, NodeStore, PreAuthKeyStore, UserStore } from '$lib/Stores';
	import {
		copyToClipboard,
		isExpired,
		isValidCIDR,
		isValidTag,
		toastError,
	} from '$lib/common/funcs';
	import Page from '$lib/page/Page.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';
	import { InputChip, getToastStore } from '@skeletonlabs/skeleton';
	import { get } from 'svelte/store';
	import DeployCheck from './DeployCheck.svelte';
	import { onMount } from 'svelte';
	import type { PreAuthKey } from '$lib/common/types';
	import { slide } from 'svelte/transition';
	import { page } from '$app/stores';

	const ToastStore = getToastStore();
	$: users = get(UserStore);
	$: nodes = get(NodeStore);
	$: preAuthKeys = get(PreAuthKeyStore);

	function createFilter(username: string) {
		return (pak: PreAuthKey) => {
			return pak.user === username && !(pak.used && !pak.reusable) && !isExpired(pak.expiration);
		};
	}

	type Deployment = {
		// general
		shieldsUp: boolean;
		generateQR: boolean;
		reset: boolean;
		operator: boolean;
		operatorValue: string;
		forceReauth: boolean;
		sshServer: boolean;
		usePreAuthKey: boolean;
		preAuthKeyUser: string;
		preAuthKey: string;
		// advertise
		advertiseExitNode: boolean;
		advertiseExitNodeLocalAccess: boolean;
		advertiseRoutes: boolean;
		advertiseRoutesValues: string[];
		advertiseTags: boolean;
		advertiseTagsValues: string[];
		// accept
		acceptDns: boolean;
		acceptRoutes: boolean;
		acceptExitNode: boolean;
		acceptExitNodeValue: string;
	};

	function defaultDeployment(): Deployment {
		return {
			// general
			shieldsUp: false,
			generateQR: false,
			reset: true,
			operator: false,
			operatorValue: '$USER',
			forceReauth: false,
			sshServer: false,
			usePreAuthKey: false,
			preAuthKeyUser: '',
			preAuthKey: '',
			// advertise
			advertiseExitNode: false,
			advertiseExitNodeLocalAccess: false,
			advertiseRoutes: false,
			advertiseRoutesValues: [],
			advertiseTags: false,
			advertiseTagsValues: [],
			// accept
			acceptDns: true,
			acceptRoutes: true,
			acceptExitNode: false,
			acceptExitNodeValue: '',
		};
	}

	$: deployment = defaultDeployment();

	$: craftCommand = (d: Deployment) => {
		const cmd = ['tailscale up --login-server=' + (get(ApiUrlStore) || $page.url.origin)];

		// general
		d.shieldsUp && cmd.push('--shields-up');
		d.generateQR && cmd.push('--qr');
		d.reset && cmd.push('--reset');
		d.operator && d.operatorValue != '' && cmd.push('--operator=' + d.operatorValue);
		d.forceReauth && cmd.push('--force-reauth');
		d.sshServer && cmd.push('--ssh');
		d.usePreAuthKey && d.preAuthKey !== '' && cmd.push('--authkey=' + d.preAuthKey);

		// advertise
		d.advertiseExitNode && cmd.push('--advertise-exit-node');
		d.advertiseExitNode &&
			d.advertiseExitNodeLocalAccess &&
			cmd.push('--exit-node-allow-lan-access');
		d.advertiseRoutes &&
			d.advertiseRoutesValues.length > 0 &&
			cmd.push('--advertise-routes=' + d.advertiseRoutesValues.join(','));
		d.advertiseTags &&
			d.advertiseTagsValues.length > 0 &&
			cmd.push(
				'--advertise-tags=' +
					d.advertiseTagsValues.map((s) => (s.startsWith('tag:') ? s : 'tag:' + s)).join(','),
			);

		// accept
		d.acceptDns ? cmd.push('--accept-dns') : cmd.push('--accept-dns=false');
		d.acceptRoutes && cmd.push('--accept-routes');
		d.acceptExitNode && d.acceptExitNodeValue && cmd.push('--exit-node=' + d.acceptExitNodeValue);
		return cmd.join(' ');
	};

	onMount(() => {
		const unsubNodeStore = NodeStore.subscribe((ns) => (nodes = ns));
		const unsubUserStore = UserStore.subscribe((us) => (users = us));
		const unsubPreAuthKeyStore = PreAuthKeyStore.subscribe((ps) => (preAuthKeys = ps));
		return () => {
			unsubNodeStore();
			unsubUserStore();
			unsubPreAuthKeyStore();
		};
	});
</script>

<Page>
	<PageHeader title="Deploy" label="Command" showButtonArea={true}>
		<svelte:fragment slot="button">
			<button
				class="bg-gray-400/30 dark:bg-gray-800/70 border border-dashed border-slate-200 border-1 mr-4 pl-4 rounded-lg justify-start text-left pr-6"
				on:click={() =>
					copyToClipboard(craftCommand(deployment), ToastStore, 'Copied Command to Clipboard!')}
				><code class="text-black dark:text-white text-lg block py-4"
					>{craftCommand(deployment)}</code
				>
			</button>
		</svelte:fragment>
	</PageHeader>

	<div class="grid grid-cols-12 pb-10">
		<p class="text-xl col-span-12 py-4">General:</p>
		<DeployCheck
			bind:checked={deployment.shieldsUp}
			name="Shields Up"
			help="Block incoming connections"
		/>
		<DeployCheck
			bind:checked={deployment.generateQR}
			name="Generate QR Code"
			help="Create a scannable QR code to import into TailScale client"
		/>
		<DeployCheck
			bind:checked={deployment.reset}
			name="Reset"
			help="Reset unspecified settings to default values"
		/>
		<DeployCheck
			bind:checked={deployment.operator}
			name="Operator"
			help="(Unix Only) Run as a different user"
		>
			<input type="text" class="input text-sm rounded-md" bind:value={deployment.operatorValue} />
		</DeployCheck>
		<DeployCheck
			bind:checked={deployment.forceReauth}
			name="Force Reauthentication"
			help="Force user to re-authenticate to Headscale server"
		/>
		<DeployCheck
			bind:checked={deployment.sshServer}
			name="SSH Server"
			help="Run a local SSH server accessible by administrators"
		/>
		<DeployCheck
			bind:checked={deployment.usePreAuthKey}
			name="PreAuth Key"
			help="A generated key to automatically authenticate the node for a given user"
		>
			<div class="flex flex-col gap-2">
				<select bind:value={deployment.preAuthKeyUser} class="input rounded-md">
					<option value=""></option>
					{#each users as user}
						<option value={user.name}>{user.name}</option>
					{/each}
				</select>
				{#if deployment.preAuthKeyUser}
					<div transition:slide>
						<select bind:value={deployment.preAuthKey} class="input rounded-md">
							<option value=""
								>{preAuthKeys.filter(createFilter(deployment.preAuthKeyUser)).length} Valid Key(s)</option
							>
							{#each preAuthKeys.filter(createFilter(deployment.preAuthKeyUser)) as preAuthKey}
								<option value={preAuthKey.key}>{preAuthKey.key}</option>
							{/each}
						</select>
					</div>
				{/if}
			</div>
		</DeployCheck>

		<p class="text-xl col-span-12 py-4">Advertise:</p>
		<DeployCheck
			bind:checked={deployment.advertiseExitNode}
			name="Advertise Exit Node"
			help="Allow other nodes on the TailNet to use this node as a gateway"
		>
			<DeployCheck bind:checked={deployment.advertiseExitNodeLocalAccess} name="Allow LAN Access" />
		</DeployCheck>
		<DeployCheck
			bind:checked={deployment.advertiseTags}
			name="Advertise Tags"
			help="List of advertised tags to apply to a machine on provisioning"
		>
			<InputChip
				name="advertiseRoutesValues"
				bind:value={deployment.advertiseTagsValues}
				validation={isValidTag}
				on:invalid={() => {
					toastError('Tag should be a lowercase alphanumeric word', ToastStore);
				}}
			/>
		</DeployCheck>
		<DeployCheck
			bind:checked={deployment.advertiseRoutes}
			name="Advertise Routes"
			help="List of subnets which are reachable via this node"
		>
			<InputChip
				name="advertiseRoutesValues"
				bind:value={deployment.advertiseRoutesValues}
				validation={isValidCIDR}
				on:invalid={() => {
					toastError('Invalid CIDR Format', ToastStore);
				}}
			/>
		</DeployCheck>

		<p class="text-xl col-span-12 py-4">Accept:</p>
		<DeployCheck
			bind:checked={deployment.acceptDns}
			name="Accept DNS"
			help="Accept the HeadScale-provided DNS settings"
		/>
		<DeployCheck
			bind:checked={deployment.acceptRoutes}
			name="Accept Routes"
			help="Accept other nodes' advertised subnets"
		/>
		<DeployCheck
			bind:checked={deployment.acceptExitNode}
			name="Exit Node"
			help="Use this node as a gateway (target node must advertise exit node)"
		>
			<label class="label">
				<select class="select" bind:value={deployment.acceptExitNodeValue}>
					{#each nodes as node}
						<option value={node.ipAddresses.filter((s) => /^\d+\.\d+\.\d+\.\d+$/.test(s))[0]}
							>{node.givenName} ({node.name})</option
						>
					{/each}
				</select>
			</label>
		</DeployCheck>
	</div>
</Page>
