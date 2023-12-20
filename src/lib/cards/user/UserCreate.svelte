<script lang="ts">
	import { UserStore, appendStoreItem } from '$lib/Stores';
	import { createUser } from '$lib/common/api';
	import { toastError, toastSuccess, focus } from '$lib/common/funcs';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { get } from 'svelte/store';
	import RawMdiCheckCircleOutline from '~icons/mdi/check-circle-outline';

	let username = '';
	let loading = false;
	const toastStore = getToastStore();
	export let show: boolean;

	async function newUser() {
		loading = true;
		try {
			// create the user
			const u = await createUser(username);

			// append to the store
			appendStoreItem(UserStore, u);

			// success message
			toastSuccess('Created user "' + username + '"', toastStore);

			// no longer needed
			show = false;
			username = '';
		} catch (error) {
			if (error instanceof Error) {
				toastError('Failed to create user "' + username + '"', toastStore, error);
			}
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex w-full">
	<form on:submit={newUser} class="w-full">
		<input
			class="input rounded-md w-full md:w-1/2 lg:w-1/3"
			type="text"
			placeholder="New Username..."
			disabled={loading}
			bind:value={username}
			use:focus
		/>
		<button type="submit" class="btn btn-icon" disabled={loading}>
			<RawMdiCheckCircleOutline />
		</button>
	</form>
</div>
