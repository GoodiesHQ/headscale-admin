<script lang="ts">
	import { ApiKeyStore, ApiTtlStore, ApiUrlStore, DebugStore, populateStores } from '$lib/Stores';
	import { toastSuccess } from '$lib/common/funcs';
	import Page from '$lib/page/Page.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import RawMdiContentSaveOutline from '~icons/mdi/content-save-outline';
	import RawOrbit from '~icons/mdi/orbit-variant';

	$: apiKey = get(ApiKeyStore);
	$: apiUrl = get(ApiUrlStore);
	$: apiTtl = get(ApiTtlStore) / 1000;

	let debugEnabled = get(DebugStore);

	$: loading = false;

	const ToastStore = getToastStore();

	onMount(() => {
		const unsubApiKeyStore = ApiKeyStore.subscribe((k) => {
			apiKey = k;
		});
		return () => {
			unsubApiKeyStore();
		};
	});
</script>

<Page>
	<PageHeader title="Settings" />

	<div class="grid grid-cols-12 gap-4">
		<div class="col-span-12 lg:col-span-8">
			<form>
				<div class="text-2xl font-mono">API URL</div>
				<div class="pt-4 flex">
					<input
						class="input rounded-md w-full mr-4 text-sm"
						type="text"
						placeholder="API Key"
						disabled={loading}
						bind:value={apiUrl}
					/>
					<button
						type="button"
						disabled={loading}
						class="btn btn-icon variant-ghost ml-2"
						on:click={() => {
							loading = true;
							ApiUrlStore.set(apiUrl);
							loading = false;
							toastSuccess('Saved API URL', ToastStore);
							populateStores(false);
						}}
					>
						<RawMdiContentSaveOutline />
					</button>
				</div>
			</form>
		</div>
		<div class="col-span-12 lg:col-span-8">
			<form>
				<div class="text-2xl font-mono">API Key</div>
				<div class="pt-4 flex">
					<input
						class="input rounded-md w-full mr-4 text-sm"
						type="text"
						placeholder="API Key"
						disabled={loading}
						bind:value={apiKey}
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
					<button
						type="button"
						disabled={loading}
						class="btn btn-icon variant-ghost ml-2"
						on:click={() => {
							loading = true;
							ApiKeyStore.set(apiKey);
							loading = false;
							toastSuccess('Saved API Key', ToastStore);
							populateStores(false);
						}}
					>
						<RawMdiContentSaveOutline />
					</button>
				</div>
			</form>
		</div>
		<div class="col-span-12 lg:col-span-8">
			<form>
				<div class="text-2xl font-mono">API Refresh Interval</div>
				<div class="pt-4 flex">
					<input
						class="input rounded-md w-full mr-4 text-sm"
						type="number"
						min="1"
						disabled={loading}
						bind:value={apiTtl}
					/>
					<button
						type="button"
						disabled={loading}
						class="btn btn-icon variant-ghost ml-2"
						on:click={() => {
							loading = true;
							ApiTtlStore.set(apiTtl * 1000);
							loading = false;
						}}
					>
						<RawMdiContentSaveOutline />
					</button>
				</div>
			</form>
		</div>
		<div class="col-span-12 lg:col-span-8">
			<form>
				<div class="text-2xl font-mono">Console Debugging:</div>
				<div class="pt-4 flex items-center">
					<input class="checkbox" type="checkbox" disabled={loading} bind:checked={debugEnabled} />
					<button
						type="button"
						disabled={loading}
						class="btn btn-icon variant-ghost ml-2"
						on:click={() => {
							loading = true;
							DebugStore.set(debugEnabled);
							toastSuccess('Debugging ' + (debugEnabled ? 'Enabled' : 'Disabled'), ToastStore);
							loading = false;
						}}
					>
						<RawMdiContentSaveOutline />
					</button>
				</div>
			</form>
		</div>
	</div>
</Page>
