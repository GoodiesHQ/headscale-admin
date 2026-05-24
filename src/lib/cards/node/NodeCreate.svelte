<script lang="ts">
	import { createNode } from '$lib/common/api';
	import { debug } from '$lib/common/debug';
	import { toastError, toastSuccess, focus } from '$lib/common/funcs';
	import { getToastStore } from '@skeletonlabs/skeleton';

	import RawMdiCheckCircleOutline from '~icons/mdi/check-circle-outline';

	import { App } from '$lib/States.svelte';
	import { _ } from 'svelte-i18n';

	type NodeCreateProps = {
		show: boolean,
	}

	let { show = $bindable(false) }: NodeCreateProps = $props()

	let nodekey = $state('');
	let username = $state('');
	let loading = $state(false);
	const ToastStore = getToastStore();

	async function newNode() {
		if (nodekey == '' || username == '') {
			toastError($_('common.usernameAndKeyRequired'), ToastStore);
			return;
		}
		loading = true;
		try {
			// create the node
			const n = await createNode(nodekey, username);

			// append to the store
			App.nodes.value.push(n)

			// success message
			toastSuccess($_('common.createdNode') + ' "' + n.name + '"', ToastStore);

			// no longer needed
			show = false;
			username = '';
		} catch (error) {
			if (error instanceof Error) {
				debug(error);
				toastError($_('common.failedCreateNode'), ToastStore, error);
			}
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex w-full">
	<form onsubmit={newNode} class="w-full flex flex-row space-x-4">
		<input
			id="node-create-key"
			name="node-create-key"
			class="input rounded-md w-full md:w-1/2 lg:w-1/3"
			type="text"
			placeholder={$_('common.deviceKey')}
			disabled={loading}
			bind:value={nodekey}
			use:focus
		/>
		<select id="node-create-user" name="node-create-user" class="select rounded-md w-full md:w-1/2 lg:w-1/3" bind:value={username}>
			{#each App.users.value as user}
				<option value={user.name}>{user.name} ({$_('common.id')}: {user.id})</option>
			{/each}
		</select>
		<button type="submit" class="btn btn-icon" disabled={loading}>
			<RawMdiCheckCircleOutline />
		</button>
	</form>
</div>
