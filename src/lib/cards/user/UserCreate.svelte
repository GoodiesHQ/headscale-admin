<script lang="ts">
	import { createUser } from '$lib/common/api';
	import { toastError, toastSuccess, focus } from '$lib/common/funcs';
	import { App } from '$lib/States.svelte';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import RawMdiCheckCircleOutline from '~icons/mdi/check-circle-outline';
	
	type UserCreateProps = {
		show: boolean,
		loading?: boolean,
	};

	let { show = $bindable(), loading = $bindable(false)}: UserCreateProps = $props()

	let username = $state('');
	const toastStore = getToastStore();

	async function newUser(event?: Event) {
		event?.preventDefault()

		loading = true;
		try {
			const u = await createUser(username);
			App.users.value.push(u)
			toastSuccess('Created user "' + username + '"', toastStore);
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
	<form onsubmit={newUser} class="w-full">
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
