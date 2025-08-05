<script lang="ts">
	import { createUser } from '$lib/common/api';
	import { createUserWithNamespace } from '$lib/common/grpc';
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
	let namespace = $state('');
	const toastStore = getToastStore();

	// Check if gRPC is configured to show namespace field
	const isGrpcConfigured = $derived(App.isGrpcConfigured);

	async function newUser(event?: Event) {
		event?.preventDefault()

		loading = true;
		try {
			let u;

			// Based on user requirements: use REST API when only username is filled, use gRPC API when both username and namespace are filled
			if (isGrpcConfigured && namespace.trim() !== '') {
				// Both username and namespace filled, use gRPC API to create user with display_name
				u = await createUserWithNamespace(App.grpcConfig.value, username, namespace);
				toastSuccess(`✅ User "${username}" created successfully! Namespace: "${namespace}" (gRPC)`, toastStore);
			} else {
				// Only username filled, use REST API for standard user creation
				u = await createUser(username);
				toastSuccess(`✅ User "${username}" created successfully! (REST API)`, toastStore);
			}

			App.users.value.push(u);
			show = false;
			username = '';
			namespace = '';
		} catch (error) {
			if (error instanceof Error) {
				const apiType = (isGrpcConfigured && namespace.trim() !== '') ? 'gRPC' : 'REST';
				toastError(`Failed to create user "${username}" via ${apiType}`, toastStore, error);
			}
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex w-full">
	<form onsubmit={newUser} class="w-full">
		<div class="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
			<input
				class="input rounded-md flex-1"
				type="text"
				placeholder="New Username..."
				disabled={loading}
				bind:value={username}
				use:focus
			/>
			{#if isGrpcConfigured}
				<input
					class="input rounded-md flex-1"
					type="text"
					placeholder="Namespace (optional)..."
					disabled={loading}
					bind:value={namespace}
				/>
			{/if}
			<button type="submit" class="btn btn-icon" disabled={loading || !username.trim()}>
				<RawMdiCheckCircleOutline />
			</button>
		</div>
		{#if isGrpcConfigured}
			<div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
				{#if namespace.trim() !== ''}
					🚀 Will create user via gRPC API with namespace set to "{namespace}"
				{:else}
					ℹ️ Will create standard user via REST API (fill namespace to use gRPC API)
				{/if}
			</div>
		{/if}
	</form>
</div>
