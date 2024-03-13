<script lang="ts">
	import { NodeStore, UserStore, appendStoreItem } from '$lib/Stores';
	import { createNode } from '$lib/common/api';
	import { debug } from '$lib/common/debug';
	import { toastError, toastSuccess, focus } from '$lib/common/funcs';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import RawMdiCheckCircleOutline from '~icons/mdi/check-circle-outline';

	let nodekey = '';
	let username = '';
	let loading = false;
	$: users = get(UserStore);
	const ToastStore = getToastStore();

	export let show;

	async function newNode() {
		if (nodekey == '' || username == '') {
			toastError('Username and Device Key are Required', ToastStore);
			return;
		}
		loading = true;
		try {
			// create the node
			const n = await createNode(nodekey, username);

			// append to the store
			appendStoreItem(NodeStore, n);

			// success message
			toastSuccess('Created node "' + n.name + '"', ToastStore);

			// no longer needed
			show = false;
			username = '';
		} catch (error) {
			if (error instanceof Error) {
				debug(error);
				toastError('Failed to create node', ToastStore, error);
			}
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		const unsubUserStore = UserStore.subscribe((us) => (users = us));

		return () => {
			unsubUserStore();
		};
	});
</script>

<div class="flex w-full">
	<form on:submit={newNode} class="w-full flex flex-row space-x-4">
		<input
			class="input rounded-md w-full md:w-1/2 lg:w-1/3"
			type="text"
			placeholder="Device Key..."
			disabled={loading}
			bind:value={nodekey}
			use:focus
		/>
		<select class="select rounded-md w-full md:w-1/2 lg:w-1/3" bind:value={username}>
			{#each users as user}
				<option value={user.name}>{user.name} (ID: {user.id})</option>
			{/each}
		</select>
		<button type="submit" class="btn btn-icon" disabled={loading}>
			<RawMdiCheckCircleOutline />
		</button>
	</form>
</div>
