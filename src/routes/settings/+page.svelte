<script lang="ts">
	import { ALL_THEMES, setTheme } from '$lib/common/themes';
	import {
		getTime,
		getTimeDifference,
		getTimeDifferenceColor,
		toastSuccess,
	} from '$lib/common/funcs';

	import { page } from '$app/state';
	import { debug } from '$lib/common/debug';
	import { createPopulateErrorHandler } from '$lib/common/errors';
	import type { ApiKeyInfo, ExpirationMessage } from '$lib/common/types';
	import Page from '$lib/page/Page.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { refreshApiKey } from '$lib/common/api';

	// icons
	import RawMdiContentSaveOutline from '~icons/mdi/content-save-outline';
	import RawMdiOrbit from '~icons/mdi/orbit-variant';
	import RawMdiEye from '~icons/mdi/eye-outline';
	import RawMdiEyeOff from '~icons/mdi/eye-off-outline';

	import { App } from '$lib/States.svelte';
	import { goto } from '$app/navigation';

	type Settings = {
		apiUrl: string;
		apiKey: string;
		apiTtl: number;
		theme: string;
		debug: boolean;
	};

	let settings = $state<Settings>({
		apiUrl: App.apiUrl.value,
		apiKey: App.apiKey.value,
		apiTtl: App.apiTtl.value / 1000,
		debug: App.debug.value,
		theme: App.theme.value,
	});

	const ToastStore = getToastStore();

	let apiKeyInfo = $derived(App.apiKeyInfo.value);
	let apiKeyShow = $state(false);
	let loading = $state(false);

	const apiKeyExpirationMessage: ExpirationMessage = $derived.by(() => {
		if (apiKeyInfo.expires !== ''){
			const td = getTimeDifference(getTime(apiKeyInfo.expires));
			return {
				message: td.message,
				color: getTimeDifferenceColor(td),
			};
		} else {
			return { message: '', color: '' };
		}
	});

	async function saveSettings(event?: Event) {
		event?.preventDefault()

		loading = true;
		try {
			if(settings.apiUrl === '') {
				settings.apiUrl = page.url.origin
			}
			App.apiUrl.value = settings.apiUrl
			App.apiKey.value = settings.apiKey
			App.apiTtl.value = settings.apiTtl * 1000
			App.debug.value = settings.debug
			App.theme.value = settings.theme
			App.apiKeyInfo.value = {
				expires: '',
				authorized: null,
				informedUnauthorized: false,
				informedExpiringSoon: false,
			};
			toastSuccess('Saved Settings', ToastStore);
			const handler = createPopulateErrorHandler(ToastStore);
			await App.populateApiKeyInfo().catch(handler);
			await App.populateAll(handler, false);
		} catch (err) {
			debug(err);
		} finally {
			loading = false;
		}
	}
</script>

<Page classes="items-start">
	<PageHeader title="Settings" />
	<form onsubmit={saveSettings} class="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 shadow rounded-lg">
		<div class="space-y-6">
			<div>
				<label for="api-url" class="block text-lg font-medium text-gray-700 dark:text-gray-200">API URL</label>
				<input
					id="api-url"
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
					type="text"
					placeholder={page.url.origin}
					disabled={loading}
					bind:value={settings.apiUrl}
				/>
			</div>

			<div>
				<label for="api-key" class="block text-lg font-medium text-gray-700 dark:text-gray-200">API Key</label>
				<div class="mt-1 flex items-center">
					<input
						id="api-key"
						class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
						type={apiKeyShow ? "text" : "password"}
						placeholder="Enter your API Key"
						disabled={loading}
						bind:value={settings.apiKey}
					/>
					<button
						type="button"
						disabled={loading}
						class="ml-2 p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
						onclick={() => { apiKeyShow = !apiKeyShow; }}
						aria-label={apiKeyShow ? "Hide API Key" : "Show API Key"}
					>
						{#if apiKeyShow}
							<RawMdiEyeOff class="w-5 h-5" />
						{:else}
							<RawMdiEye class="w-5 h-5" />
						{/if}
					</button>
					<button
						type="button"
						disabled={loading}
						class="ml-2 p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
						onclick={async () => {
							loading = true;
							try {
								await refreshApiKey();
								settings.apiKey = App.apiKey.value;
								saveSettings();
							} finally {
								loading = false;
							}
						}}
						aria-label="Refresh API Key"
					>
						<RawMdiOrbit />
					</button>
				</div>
				{#if apiKeyInfo.authorized !== null}
					<div class="mt-2 text-sm">
						<span class={apiKeyInfo.authorized ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
							{apiKeyInfo.authorized ? "Authorized" : "Not Authorized"}
						</span>
						{#if apiKeyInfo.authorized && apiKeyExpirationMessage}
							<span class="ml-2 text-gray-500 dark:text-gray-400">
								Expires in: {apiKeyExpirationMessage.message}
							</span>
						{/if}
					</div>
				{:else if loading}
					<div class="mt-2 text-sm text-yellow-500 dark:text-yellow-400">Checking authorization...</div>
				{/if}
			</div>

			<div>
				<label for="api-ttl" class="block text-lg font-medium text-gray-700 dark:text-gray-200">API Refresh Interval (seconds)</label>
				<input
					id="api-ttl"
					class="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
					type="number"
					min="1"
					disabled={loading}
					bind:value={settings.apiTtl}
				/>
			</div>

			<div class="flex items-center">
				<input
					id="debugging"
					type="checkbox"
					class="h-4 w-4 text-indigo-600 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
					disabled={loading}
					bind:checked={settings.debug}
				/>
				<label for="debugging" class="ml-2 block text-lg text-gray-700 dark:text-gray-200">
					Console Debugging
				</label>
			</div>

			<div class="flex items-start justify-between space-x-4">
				<button type="button" class="btn btn-sm rounded-md variant-ghost-primary w-full" onclick={() => console.log(JSON.stringify(App.users.value, null, 4))}>
					Log Users
				</button>
				<button type="button" class="btn btn-sm rounded-md variant-ghost-primary w-full" onclick={() => console.log(JSON.stringify(App.nodes.value, null, 4))}>
					Log Nodes
				</button>
				<button type="button" class="btn btn-sm rounded-md variant-ghost-primary w-full" onclick={() => console.log(JSON.stringify(App.preAuthKeys.value, null, 4))}>
					Log PreAuthKeys
				</button>
				<button type="button" class="btn btn-sm rounded-md variant-ghost-primary w-full" onclick={() => console.log(JSON.stringify(App.apiKeyInfo.value, null, 4))}>
					Log ApiKey Info
				</button>
			</div>

			<div>
				<label for="theme-selector" class="block text-lg font-medium text-gray-700 dark:text-gray-200">Theme</label>
				<select
					id="theme-selector"
					class="mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
					bind:value={App.theme.value}
					onchange={() => {
						setTheme(App.theme.value)
						settings.theme = App.theme.value
					}}
				>
					{#each ALL_THEMES as theme}
						<option value={theme}>{theme}</option>
					{/each}
				</select>
			</div>

			<div class="flex justify-end">
				<button
					type="submit"
					disabled={loading || !settings.apiKey}
					class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<RawMdiContentSaveOutline class="w-5 h-5 mr-2" />
					Save Settings
				</button>
			</div>
		</div>
	</form>
</Page>