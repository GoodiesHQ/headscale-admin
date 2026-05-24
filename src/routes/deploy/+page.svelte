<script lang="ts">
	import {
		copyToClipboard,
		isExpired,
		isValidCIDR,
		isValidTag,
		toastError,
		toastSuccess,
	} from '$lib/common/funcs';
	import DeployCheck from './DeployCheck.svelte';
	import Page from '$lib/page/Page.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';
	import type { Deployment, PreAuthKey } from '$lib/common/types';
	import { InputChip, getToastStore } from '@skeletonlabs/skeleton';
	import { page } from '$app/state';
	import { slide } from 'svelte/transition';

	import { App } from '$lib/States.svelte';
	import { _ } from 'svelte-i18n';

	const ToastStore = getToastStore();

	function createFilter(user_id: string) {
		return (pak: PreAuthKey) => {
			return pak.user.id === user_id && !(pak.used && !pak.reusable) && !isExpired(pak.expiration);
		};
	}

	// $: deployment = defaultDeployment();
	let deployment: Deployment = $state(App.deploymentDefaults.value);

	let craftCommand = (d: Deployment) => {
		const cmd = ['tailscale up --login-server=' + (App.apiUrl.value || page.url.origin)];

		// general
		d.shieldsUp && cmd.push('--shields-up');
		d.generateQR && cmd.push('--qr');
		d.reset && cmd.push('--reset');
		d.operator && d.operatorValue != '' && cmd.push('--operator=' + d.operatorValue);
		d.forceReauth && cmd.push('--force-reauth');
		d.sshServer && cmd.push('--ssh');
		d.usePreAuthKey && d.preAuthKey !== '' && cmd.push('--auth-key=' + d.preAuthKey);
		d.unattended && cmd.push('--unattended')

		// advertise
		d.advertiseExitNode && cmd.push('--advertise-exit-node');
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
</script>

<Page>
	<PageHeader title={$_('navigation.deploy')} buttonText={''} show={true}>
		{#snippet button()}
			<button
				class="bg-gray-400/30 dark:bg-gray-800/70 border border-dashed border-slate-200 border-1 pr-0 pl-4 rounded-lg justify-start text-left w-[90%]"
				onclick={() =>
					copyToClipboard(craftCommand(deployment), ToastStore, $_('deploy.copyCommand'))}
				><code class="text-black dark:text-white text-sm block py-4 w-full"
					>{craftCommand(deployment)}</code
				>
			</button>
		{/snippet}
	</PageHeader>

	<div class="grid grid-cols-12">
		<p class="text-xl col-span-12">{$_('deploy.general')}</p>
		<DeployCheck
			bind:checked={deployment.shieldsUp}
			name={$_('deploy.shieldsUp')}
			help={$_('deploy.shieldsUpHelp')}
		/>
		<DeployCheck
			bind:checked={deployment.generateQR}
			name={$_('deploy.generateQR')}
			help={$_('deploy.generateQRHelp')}
		/>
		<DeployCheck
			bind:checked={deployment.reset}
			name={$_('deploy.reset')}
			help={$_('deploy.resetHelp')}
		/>
		<DeployCheck
			bind:checked={deployment.operator}
			name={$_('deploy.operator')}
			help={$_('deploy.operatorHelp')}
		>
			<input id="deploy-operator-value" name="deploy-operator-value" type="text" class="input text-sm rounded-md" bind:value={deployment.operatorValue} />
		</DeployCheck>
		<DeployCheck
			bind:checked={deployment.forceReauth}
			name={$_('deploy.forceReauth')}
			help={$_('deploy.forceReauthHelp')}
		/>
		<DeployCheck
			bind:checked={deployment.sshServer}
			name={$_('deploy.sshServer')}
			help={$_('deploy.sshServerHelp')}
		/>
		<DeployCheck
			bind:checked={deployment.usePreAuthKey}
			name={$_('deploy.preAuthKey')}
			help={$_('deploy.preAuthKeyHelp')}
		>
			<div class="flex flex-col gap-2">
				<select id="deploy-preauthkey-user" name="deploy-preauthkey-user" bind:value={deployment.preAuthKeyUser} class="input rounded-md">
					<option value=""></option>
					{#each App.users.value as user}
						<option value={user.id}>{user.name}</option>
					{/each}
				</select>
				{#if deployment.preAuthKeyUser}
					<div transition:slide>
						<select id="deploy-preauthkey-select" name="deploy-preauthkey-select" bind:value={deployment.preAuthKey} class="input rounded-md">
							<option value=""
								>{App.preAuthKeys.value.filter(createFilter(deployment.preAuthKeyUser)).length} {$_('deploy.validKeys')}</option
							>
							{#each App.preAuthKeys.value.filter(createFilter(deployment.preAuthKeyUser)) as preAuthKey}
								<option value={preAuthKey.key}>{preAuthKey.key}</option>
							{/each}
						</select>
					</div>
				{/if}
			</div>
		</DeployCheck>
		<DeployCheck
			bind:checked={deployment.unattended}
			name={$_('deploy.unattended')}
			help={$_('deploy.unattendedHelp')}
		/>
		<DeployCheck 
			bind:checked={deployment.advertiseExitNodeLocalAccess}
			name={$_('deploy.allowLANAccess')}
			help={$_('deploy.allowLANAccessHelp')}
		/>

		<p class="text-xl col-span-12 py-4">{$_('deploy.advertise')}</p>
		<DeployCheck
			bind:checked={deployment.advertiseExitNode}
			name={$_('deploy.advertiseExitNode')}
			help={$_('deploy.advertiseExitNodeHelp')}
		/>
		<DeployCheck
			bind:checked={deployment.advertiseTags}
			name={$_('deploy.advertiseTags')}
			help={$_('deploy.advertiseTagsHelp')}
		>
			<InputChip
				name="advertiseTagsValues"
				bind:value={deployment.advertiseTagsValues}
				validation={isValidTag}
				on:invalid={() => {
					toastError($_('deploy.tagError'), ToastStore);
				}}
			/>
		</DeployCheck>
		<DeployCheck
			bind:checked={deployment.advertiseRoutes}
			name={$_('deploy.advertiseRoutes')}
			help={$_('deploy.advertiseRoutesHelp')}
		>
			<InputChip
				name="advertiseRoutesValues"
				bind:value={deployment.advertiseRoutesValues}
				validation={isValidCIDR}
				on:invalid={() => {
					toastError($_('deploy.cidrError'), ToastStore);
				}}
			/>
		</DeployCheck>

		<p class="text-xl col-span-12 py-4">{$_('deploy.accept')}</p>
		<DeployCheck
			bind:checked={deployment.acceptDns}
			name={$_('deploy.acceptDNS')}
			help={$_('deploy.acceptDNSHelp')}
		/>
		<DeployCheck
			bind:checked={deployment.acceptRoutes}
			name={$_('deploy.acceptRoutes')}
			help={$_('deploy.acceptRoutesHelp')}
		/>
		<DeployCheck
			bind:checked={deployment.acceptExitNode}
			name={$_('deploy.exitNode')}
			help={$_('deploy.exitNodeHelp')}
		>
			<label class="label">
				<select id="deploy-accept-exitnode" name="deploy-accept-exitnode" class="select" bind:value={deployment.acceptExitNodeValue}>
					{#each App.nodes.value as node}
						<option value={node.ipAddresses.filter((s) => /^\d+\.\d+\.\d+\.\d+$/.test(s))[0]}
							>{node.givenName} ({node.name})</option
						>
					{/each}
				</select>
			</label>
		</DeployCheck>
	</div>
		<button class="btn rounded-md variant-filled-secondary mt-4" onclick={() => {
			App.saveDeploymentDefaults(deployment)
			toastSuccess($_('deploy.savedDefaults'), ToastStore)
		}}>
			{$_('deploy.saveDefaults')}
		</button>
</Page>
