<script lang="ts">
	import {
		ApiKeyInfoStore,
		ApiKeyStore,
		ApiTtlStore,
		ApiUrlStore,
		DebugStore,
		populateStores,
	} from '$lib/Stores';
	import { debug } from '$lib/common/debug';
	import { createPopulateErrorHandler } from '$lib/common/errors';
	import { getExpirationMessage, toastSuccess } from '$lib/common/funcs';
	import type { ExpirationMessage } from '$lib/common/types';
	import Page from '$lib/page/Page.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import RawMdiContentSaveOutline from '~icons/mdi/content-save-outline';
	import RawOrbit from '~icons/mdi/orbit-variant';

	type Settings = {
		apiUrl: string;
		apiKey: string;
		apiTtl: number;
		debug: boolean;
	};

	$: settings = {
		apiUrl: get(ApiUrlStore),
		apiKey: get(ApiKeyStore),
		apiTtl: get(ApiTtlStore) / 1000,
		debug: get(DebugStore),
	} as Settings;

	$: apiKeyInfo = get(ApiKeyInfoStore);
	let apiKeyExpirationMessage: ExpirationMessage = { message: '', color: '' };

	$: loading = false;

	const ToastStore = getToastStore();

	async function saveSettings() {
		loading = true;
		try {
			ApiUrlStore.set(settings.apiUrl);
			ApiKeyStore.set(settings.apiKey);
			ApiTtlStore.set(settings.apiTtl * 1000);
			DebugStore.set(settings.debug);

			ApiKeyInfoStore.set({
				expires: '',
				authorized: null,
				informedUnauthorized: false,
				informedExpiringSoon: false,
			});

			toastSuccess('Saved Settings', ToastStore);
			await populateStores(createPopulateErrorHandler(ToastStore), false);
		} catch (err) {
			debug(err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		const unsubApiKeyStore = ApiKeyStore.subscribe((apikey) => {
			settings.apiKey = apikey;
		});

		const unsubApiKeyInfoStore = ApiKeyInfoStore.subscribe((apiKeyInfoNew) => {
			apiKeyInfo = apiKeyInfoNew;
			if (apiKeyInfo.expires !== '') {
				apiKeyExpirationMessage = getExpirationMessage(apiKeyInfo.expires);
			} else {
				apiKeyExpirationMessage = { message: '', color: '' };
			}
		});

		return () => {
			unsubApiKeyStore();
			unsubApiKeyInfoStore();
		};
	});
</script>

<Page>
	<PageHeader title="Settings" />

	<form on:submit={saveSettings}>
		<div class="grid grid-cols-12 gap-4">
			<div class="col-span-12 lg:col-span-8">
				<div class="text-2xl font-mono">API URL</div>
				<div class="pt-4 flex">
					<input
						class="input rounded-md w-full mr-4 text-sm"
						type="text"
						placeholder="API Key"
						disabled={loading}
						bind:value={settings.apiUrl}
					/>
				</div>
			</div>
			<div class="col-span-12 lg:col-span-8">
				<div class="text-2xl font-mono">API Key</div>
				<div class="pt-4 flex">
					<input
						class="input rounded-md w-full mr-4 text-sm"
						type="text"
						placeholder="API Key"
						disabled={loading}
						bind:value={settings.apiKey}
					/>
					<button
						type="button"
						disabled={loading}
						class="btn btn-icon variant-ghost ml-2"
						on:click={() => {
							toastSuccess('This does nothing (for now)', ToastStore);
						}}
					>
						<RawOrbit />
					</button>
				</div>
			</div>
			<div class="col-span-12 lg:col-span-8 grid grid-cols-12">
				<div class="col-span-4">
					{#if apiKeyInfo.authorized === null}
						<span class="text-warning-500 dark:text-warning-400">Checking...</span>
					{/if}
					{#if apiKeyInfo.authorized === true}
						<span class="text-success-600 dark:text-success-400">Authorized!</span>
					{/if}
					{#if apiKeyInfo.authorized === false}
						<span class="text-error-500 dark:text-error-400">Not Authorized</span>
					{/if}
				</div>
				<div class="col-span-8">
					{#if apiKeyExpirationMessage !== undefined}
						{apiKeyExpirationMessage.message}
					{/if}
				</div>
			</div>
			<div class="col-span-12 lg:col-span-8">
				<div class="text-2xl font-mono">API Refresh Interval</div>
				<div class="pt-4 grid grid-cols-12">
					<input
						class="input rounded-md mr-4 text-sm col-span-6 md:col-span-4 xl:col-span-2"
						type="number"
						min="1"
						disabled={loading}
						bind:value={settings.apiTtl}
					/>
				</div>
			</div>
			<div class="col-span-12 lg:col-span-8">
				<div class="pt-4 flex flex-row items-center">
					<label class="text-2xl font-mono">
						Console Debugging:
						<input
							class="checkbox"
							type="checkbox"
							disabled={loading}
							bind:checked={settings.debug}
						/>
					</label>
				</div>
			</div>
			<div class="col-span-12 pt-10">
				<button
					type="submit"
					disabled={loading}
					class="btn variant-filled-success space-x-2 rounded-md"
				>
					<div>
						<RawMdiContentSaveOutline />
					</div>
					<div>Save</div>
				</button>
			</div>
		</div>
	</form>
</Page>
