<script lang="ts">
	import { ApiUrlStore, NodeStore } from '$lib/Stores';
	import { isValidCIDR, isValidTag, toastError } from '$lib/common/funcs';
	import Page from '$lib/page/Page.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';
	import { InputChip, getToastStore } from '@skeletonlabs/skeleton';
	import { get } from 'svelte/store';
	import DeployCheck from './DeployCheck.svelte';
	import { onMount } from 'svelte';

	const ToastStore = getToastStore();
	$: nodes = get(NodeStore);

	type Deployment = {
		// general
		shieldsUp: boolean;
		generateQR: boolean;
		reset: boolean;
		operator: boolean;
		operatorValue: string;
		forceReauth: boolean;
		sshServer: boolean;
		// accept
		acceptDns: boolean;
		acceptRoutes: boolean;
		acceptExitNode: boolean;
		acceptExitNodeValue: string;
		// advertise
		advertiseExitNode: boolean;
		advertiseExitNodeLocalAccess: boolean;
		advertiseRoutes: boolean;
		advertiseRoutesValues: string[];
		advertiseTags: boolean;
		advertiseTagsValues: string[];
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
			// accept
			acceptDns: true,
			acceptRoutes: true,
			acceptExitNode: false,
			acceptExitNodeValue: '',
			// advertise
			advertiseExitNode: false,
			advertiseExitNodeLocalAccess: false,
			advertiseRoutes: false,
			advertiseRoutesValues: [],
			advertiseTags: false,
			advertiseTagsValues: [],
		};
	}

	$: deployment = defaultDeployment();

	$: craftCommand = (d: Deployment) => {
		const cmd = ['tailscale up --login-server=' + get(ApiUrlStore)];

		// general
		d.shieldsUp && cmd.push('--shields-up');
		d.generateQR && cmd.push('--qr');
		d.reset && cmd.push('--reset');
		d.operator && d.operatorValue != '' && cmd.push('--operator=' + d.operatorValue);
		d.forceReauth && cmd.push('--force-reauth');
		d.sshServer && cmd.push('--ssh');

		// accept
		d.acceptDns && cmd.push('--accept-dns');
		d.acceptRoutes && cmd.push('--accept-routes');
		d.acceptExitNode && d.acceptExitNodeValue && cmd.push('--exit-node=' + d.acceptExitNodeValue);

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
		return cmd.join(' ');
	};

	onMount(() => {
		const unsubNodeStore = NodeStore.subscribe((ns) => (nodes = ns));
		return () => {
			unsubNodeStore();
		};
	});
</script>

<Page>
	<PageHeader title="Deploy" label="Command">
		<pre
			class="bg-gray-400/30 dark:bg-gray-700/40 mr-4 pl-4 overflow-auto rounded-lg whitespace-pre-wrap"><code
				class=" text-green-950 dark:text-success-200 text-lg block py-4"
				>{craftCommand(deployment)}</code
			></pre>
	</PageHeader>

	<div class="grid grid-cols-12">
		<p class="text-xl col-span-12 py-4">General:</p>
		<DeployCheck bind:checked={deployment.shieldsUp} name="Shields Up (Block Connections)" />
		<DeployCheck bind:checked={deployment.generateQR} name="Generate QR Code" />
		<DeployCheck bind:checked={deployment.reset} name="Reset" />
		<DeployCheck bind:checked={deployment.operator} name="Operator">
			<input type="text" class="input text-sm rounded-md" bind:value={deployment.operatorValue} />
		</DeployCheck>
		<DeployCheck bind:checked={deployment.forceReauth} name="Force Reauthentication" />
		<DeployCheck bind:checked={deployment.sshServer} name="SSH Server" />

		<p class="text-xl col-span-12 py-4">Accept:</p>
		<DeployCheck bind:checked={deployment.acceptDns} name="Accept DNS" />
		<DeployCheck bind:checked={deployment.acceptRoutes} name="Accept Routes" />
		<DeployCheck bind:checked={deployment.acceptExitNode} name="Exit Node">
			<label class="label">
				<select class="select" bind:value={deployment.acceptExitNodeValue}>
					{#each nodes as node}
						<option value={node.givenName}>{node.givenName} ({node.name})</option>
					{/each}
				</select>
			</label>
		</DeployCheck>

		<p class="text-xl col-span-12 py-4">Advertise:</p>
		<DeployCheck bind:checked={deployment.advertiseExitNode} name="Advertise Exit Node">
			<DeployCheck bind:checked={deployment.advertiseExitNodeLocalAccess} name="Allow LAN Access" />
		</DeployCheck>
		<DeployCheck bind:checked={deployment.advertiseTags} name="Advertise Tags">
			<InputChip
				name="advertiseRoutesValues"
				bind:value={deployment.advertiseTagsValues}
				validation={isValidTag}
				on:invalid={() => {
					toastError('Tag should be a lowercase alphanumeric word', ToastStore);
				}}
			/>
		</DeployCheck>
		<DeployCheck bind:checked={deployment.advertiseRoutes} name="Advertise Routes">
			<InputChip
				name="advertiseRoutesValues"
				bind:value={deployment.advertiseRoutesValues}
				validation={isValidCIDR}
				on:invalid={() => {
					toastError('Invalid CIDR Format', ToastStore);
				}}
			/>
		</DeployCheck>
	</div>
</Page>
