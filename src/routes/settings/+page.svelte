<script lang="ts">
	import { ALL_THEMES, setTheme } from './Themes';
	import { page } from '$app/stores';
	import {
		ApiEndpointsStore,
		ApiKeyInfoStore,
		ApiKeyStore,
		ApiTtlStore,
		ApiUrlStore,
		ThemeStore,
		DebugStore,
		populateApiKeyInfoStore,
		populateStores,
		ApiLegacyStore,
	} from '$lib/Stores';
	import { API_URL_MACHINE, API_URL_NODE, defaultApiEndpoints } from '$lib/common/api';
	import { debug } from '$lib/common/debug';
	import { createPopulateErrorHandler } from '$lib/common/errors';
	import {
		getTime,
		getTimeDifference,
		getTimeDifferenceColor,
		refreshApiKey,
		toastSuccess,
	} from '$lib/common/funcs';
	import type { ExpirationMessage } from '$lib/common/types';
	import Page from '$lib/page/Page.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import RawMdiContentSaveOutline from '~icons/mdi/content-save-outline';
	import RawMdiOrbit from '~icons/mdi/orbit-variant';
	import RawMdiEye from '~icons/mdi/eye-outline';
	import RawMdiEyeOff from '~icons/mdi/eye-off-outline';

	type Settings = {
		apiUrl: string;
		apiKey: string;
		apiTtl: number;
		theme: string;
		legacyApi: boolean;
		debug: boolean;
	};

	$: settings = {
		apiUrl: get(ApiUrlStore),
		apiKey: get(ApiKeyStore),
		apiTtl: get(ApiTtlStore) / 1000,
		debug: get(DebugStore),
		theme: get(ThemeStore),
		legacyApi: get(ApiLegacyStore),
		// legacyApi: get(ApiEndpointsStore).Node === API_URL_MACHINE,
	} as Settings;

	$: apiKeyInfo = get(ApiKeyInfoStore);
	$: apiKeyShow = false;

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
			ThemeStore.set(settings.theme);
			ApiLegacyStore.set(settings.legacyApi);

			ApiKeyInfoStore.set({
				expires: '',
				authorized: null,
				informedUnauthorized: false,
				informedExpiringSoon: false,
			});

			const oldApiEndpoint = defaultApiEndpoints();
			oldApiEndpoint.Node = settings.legacyApi ? API_URL_MACHINE : API_URL_NODE;
			ApiEndpointsStore.set(oldApiEndpoint);

			toastSuccess('Saved Settings', ToastStore);
			const handler = createPopulateErrorHandler(ToastStore);
			await populateApiKeyInfoStore().catch(handler);
			await populateStores(handler, false);
		} catch (err) {
			debug(err);
		} finally {
			loading = false;
		}
	}

	// import { Theme } from '$lib/Stores';
	// $: {if (browser) {document.body.setAttribute('data-theme', $theme);}}

	onMount(() => {
		const unsubApiKeyStore = ApiKeyStore.subscribe((apikey) => {
			settings.apiKey = apikey;
		});

		const unsubApiKeyInfoStore = ApiKeyInfoStore.subscribe((apiKeyInfoNew) => {
			apiKeyInfo = apiKeyInfoNew;
			if (apiKeyInfo.expires !== '') {
				const td = getTimeDifference(getTime(apiKeyInfo.expires));
				apiKeyExpirationMessage = {
					message: td.message,
					color: getTimeDifferenceColor(td),
				};
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

	<form on:submit={saveSettings} class="pb-10">
		<div class="grid grid-cols-12 gap-4">
			<div class="col-span-12 lg:col-span-8">
				<div class="text-xl font-mono">API URL</div>
				<div class="pt-2 pb-4 flex">
					<input
						class="input rounded-md w-full mr-4 text-sm"
						type="text"
						placeholder={$page.url.origin}
						disabled={loading}
						bind:value={settings.apiUrl}
					/>
				</div>
			</div>
			<div class="col-span-12 lg:col-span-8">
				<div class="text-xl font-mono">API Key</div>
				<div class="pt-2 pb-4 flex">
					{#if apiKeyShow}
						<input
							class="input rounded-md w-full mr-4 text-sm"
							type="text"
							placeholder="API Key"
							disabled={loading}
							bind:value={settings.apiKey}
						/>
					{:else}
						<input
							class="input rounded-md w-full mr-4 text-sm"
							type="password"
							placeholder="API Key"
							disabled={loading}
							bind:value={settings.apiKey}
						/>
					{/if}
					<button
						type="button"
						disabled={loading}
						class="btn btn-icon variant-ghost ml-2"
						on:click={async () => {
							apiKeyShow = !apiKeyShow;
						}}
					>
						<svelte:component this={apiKeyShow ? RawMdiEyeOff : RawMdiEye} />
					</button>
					<button
						type="button"
						disabled={loading}
						class="btn btn-icon variant-ghost ml-2"
						on:click={async () => {
							// toastSuccess('This does nothing (for now)', ToastStore);
							loading = true;
							try {
								await refreshApiKey();
								settings.apiKey = get(ApiKeyStore);
								saveSettings();
							} finally {
								loading = false;
							}
						}}
					>
						<RawMdiOrbit />
					</button>
				</div>
			</div>
			<div class="col-span-12 lg:col-span-8 grid grid-cols-12">
				<div class="col-span-4">
					{#if apiKeyInfo.authorized === null}
						{#if loading}
							<span class="text-warning-500 dark:text-warning-400">Checking...</span>
						{:else}
							<span class="text-warning-500 dark:text-warning-400"><!-- Waiting --></span>
						{/if}
					{/if}
					{#if apiKeyInfo.authorized === true}
						<span class="text-success-600 dark:text-success-400">Authorized!</span>
					{/if}
					{#if apiKeyInfo.authorized === false}
						<span class="text-error-500 dark:text-error-400">Not Authorized</span>
					{/if}
				</div>
				<div class="col-span-8">
					{#if apiKeyInfo.authorized && apiKeyExpirationMessage !== undefined}
						Expiration: {apiKeyExpirationMessage.message}
					{/if}
				</div>
			</div>
			<div class="col-span-12 lg:col-span-8">
				<div class="text-xl font-mono">API Refresh Interval</div>
				<div class="pt-2 pb-4 grid grid-cols-12">
					<input
						class="input text-sm rounded-md mr-4 col-span-2 md:col-span-4 xl:col-span-2"
						type="number"
						min="1"
						disabled={loading}
						bind:value={settings.apiTtl}
					/>
				</div>
			</div>
			<div class="col-span-12 lg:col-span-8">
				<div class="pt-2 pb-4 flex flex-row items-center">
					<label class="text-lg font-mono">
						Legacy API (Headscale &lt; 0.23):
						<input
							class="checkbox"
							type="checkbox"
							disabled={loading}
							bind:checked={settings.legacyApi}
						/>
					</label>
				</div>
			</div>
			<div class="col-span-12 lg:col-span-8">
				<div class="pt-2 pb-4 flex flex-row items-center">
					<label class="text-lg font-mono">
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
			<div class="col-span-12 lg:col-span-8">
				<div class="pt-2 pb-4 flex flex-row items-center">
					<label class="text-lg font-mono">
						Theme
						<select
							class="input rounded-md w-full mr-4 text-sm"
							bind:value={settings.theme}
							on:change={() => setTheme(settings.theme)}
						>
							{#each ALL_THEMES as theme}
								<option value={theme}>{theme}</option>
							{/each}
						</select>
					</label>
				</div>
			</div>
			<div class="col-span-12 pt-10">
				<button
					type="submit"
					disabled={loading || !settings.apiKey}
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
