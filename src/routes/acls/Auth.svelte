<script lang="ts">
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import CardListPage from '$lib/cards/CardListPage.svelte';
	import { App } from '$lib/States.svelte';
	import { authApprove, authRegister, authReject } from '$lib/common/api';
	import { debug } from '$lib/common/debug';
	import { getUserDisplay, type User } from '$lib/common/types';
	import { toastError, toastSuccess } from '$lib/common/funcs';
	import { _ } from 'svelte-i18n';

	type AuthProps = {
		loading?: boolean;
	};

	let { loading = $bindable(false) }: AuthProps = $props();

	const ToastStore = getToastStore();
	let authId = $state('');
	let userId = $state('');
	let usersLoading = $state(false);
	let usersLoadError = $state<Error | undefined>(undefined);

	const users = $derived(App.users.value);
	const canRegister = $derived(!loading && !usersLoading && users.length > 0);

	function userValue(user: User): string {
		return user.name || user.id;
	}

	async function loadUsers() {
		usersLoading = true;
		usersLoadError = undefined;
		try {
			await App.populateUsers();
		} catch (e) {
			usersLoadError = e instanceof Error ? e : new Error(String(e));
			toastError($_('acls.usersLoadFailed'), ToastStore, usersLoadError);
			debug(e);
		} finally {
			usersLoading = false;
		}
	}

	async function runAuthAction(action: 'approve' | 'reject' | 'register') {
		if (!authId.trim()) {
			toastError($_('acls.authIdRequired'), ToastStore);
			return;
		}
		if (action === 'register' && !userId) {
			toastError($_('acls.authUserRequired'), ToastStore);
			return;
		}

		loading = true;
		try {
			if (action === 'approve') {
				await authApprove(authId.trim());
				toastSuccess($_('acls.authApproved'), ToastStore);
			} else if (action === 'reject') {
				await authReject(authId.trim());
				toastSuccess($_('acls.authRejected'), ToastStore);
			} else {
				const node = await authRegister(userId, authId.trim());
				if (App.nodes.value.some((existing) => existing.id === node.id)) {
					App.updateValue(App.nodes, node);
				} else {
					App.nodes.value = [...App.nodes.value, node];
				}
				toastSuccess($_('acls.authRegistered'), ToastStore);
			}
		} catch (e) {
			if (e instanceof Error) {
				toastError($_('acls.authActionFailed'), ToastStore, e);
			}
			debug(e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		if (App.users.value.length === 0) {
			loadUsers();
		}
	});
</script>

<CardListPage>
	<div class="grid gap-4 max-w-2xl">
		<label class="label">
			<span>{$_('acls.authId')}</span>
			<input
				class="input rounded-md"
				autocomplete="off"
				placeholder={$_('acls.authIdPlaceholder')}
				bind:value={authId}
			/>
		</label>

		<label class="label">
			<span>{$_('acls.authUser')}</span>
			<select class="select rounded-md" bind:value={userId} disabled={usersLoading}>
				<option value="">
					{#if usersLoading}
						{$_('acls.loadingUsers')}
					{:else if users.length === 0}
						{$_('acls.noUsers')}
					{:else}
						{$_('acls.selectUser')}
					{/if}
				</option>
				{#each users as user}
					<option value={userValue(user)}>{getUserDisplay(user)}</option>
				{/each}
			</select>
		</label>

		{#if usersLoadError}
			<div class="flex flex-wrap items-center gap-2 text-sm text-error-500">
				<span>{$_('acls.usersLoadFailed')}</span>
				<button type="button" class="btn-sm rounded-md variant-soft-error" onclick={loadUsers}>
					{$_('common.retry')}
				</button>
			</div>
		{/if}

		<div class="flex flex-wrap gap-2">
			<button
				class="btn-sm rounded-md variant-filled-success"
				disabled={!canRegister}
				onclick={() => runAuthAction('register')}
			>
				{$_('acls.authRegister')}
			</button>
			<button
				class="btn-sm rounded-md variant-filled-primary"
				disabled={loading}
				onclick={() => runAuthAction('approve')}
			>
				{$_('acls.authApprove')}
			</button>
			<button
				class="btn-sm rounded-md variant-filled-error"
				disabled={loading}
				onclick={() => runAuthAction('reject')}
			>
				{$_('acls.authReject')}
			</button>
		</div>
	</div>
</CardListPage>
