<script lang="ts">
	import { ALL_THEMES, setTheme } from '$lib/common/themes';
	import {
		getTime,
		getTimeDifference,
		getTimeDifferenceColor,
		dateToStr,
		toastSuccess,
	} from '$lib/common/funcs';

	import { page } from '$app/state';
	import { debug, debugJson } from '$lib/common/debug';
	import { createPopulateErrorHandler } from '$lib/common/errors';
	import type { ApiKey, ApiKeyInfo, ExpirationMessage } from '$lib/common/types';
	import Page from '$lib/page/Page.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';
	import { getToastStore, Accordion, AccordionItem, getModalStore } from '@skeletonlabs/skeleton';
	import {
		refreshApiKey,
		getApiKeys,
		deleteApiKey,
		createApiKey,
		backfillNodeIPs,
	} from '$lib/common/api';

	// icons
	import RawMdiContentSaveOutline from '~icons/mdi/content-save-outline';
	import RawMdiOrbit from '~icons/mdi/orbit-variant';
	import RawMdiEye from '~icons/mdi/eye-outline';
	import RawMdiEyeOff from '~icons/mdi/eye-off-outline';
	import RawMdiKey from '~icons/mdi/key-variant';
	import RawMdiDelete from '~icons/mdi/delete-outline';
	import RawMdiPlus from '~icons/mdi/plus';

	import { App } from '$lib/States.svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { _, locale } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { LOCALE_OPTIONS, type SupportedLocale } from '$lib/i18n';

	type Settings = {
		apiUrl: string;
		apiKey: string;
		apiTtl: number;
		theme: string;
		debug: boolean;
		language: SupportedLocale;
		rememberMe: boolean;
	};

	let settings = $state<Settings>({
		apiUrl: App.apiUrl.value,
		apiKey: App.apiKey.value,
		apiTtl: App.apiTtl.value / 1000,
		debug: App.debug.value,
		theme: App.theme.value,
		language: App.language.value,
		rememberMe: App.apiKeyInfo.value.authorized === true && App.apiRememberMe.value,
	});

	const ToastStore = getToastStore();
	const ModalStore = getModalStore();

	let apiKeyInfo = $derived(App.apiKeyInfo.value);
	let apiKeyShow = $state(false);
	let loading = $state(false);

	// API Keys Management
	let apiKeys = $state<ApiKey[]>([]);
	let loadingApiKeys = $state(false);
	let newApiKeyExpiration = $state(90);

	// Backfill Node IPs
	let backfillChanges = $state<string[]>([]);
	let loadingBackfill = $state(false);

	const apiKeyExpirationMessage: ExpirationMessage = $derived.by(() => {
		if (apiKeyInfo.expires !== '') {
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
		event?.preventDefault();

		loading = true;
		try {
			if (settings.apiUrl === '') {
				settings.apiUrl = page.url.origin;
			}
			// Trim inputs to avoid common copy-paste errors
			settings.apiUrl = settings.apiUrl.trim();
			settings.apiKey = settings.apiKey.trim();

			// Only persist the key before validation when already authorized; otherwise use session storage.
			App.apiRememberMe.value = apiKeyInfo.authorized === true ? settings.rememberMe : false;
			App.apiUrl.value = settings.apiUrl;
			App.apiKey.value = settings.apiKey;
			App.apiTtl.value = settings.apiTtl * 1000;
			App.debug.value = settings.debug;
			App.theme.value = settings.theme;
			App.language.value = settings.language;
			App.apiKeyInfo.value = {
				expires: '',
				authorized: null,
				informedUnauthorized: false,
				informedExpiringSoon: false,
			};

			const handler = createPopulateErrorHandler(ToastStore);
			await App.populateApiKeyInfo().catch(handler);
			App.apiRememberMe.value =
				App.apiKeyInfo.value.authorized === true ? settings.rememberMe : false;
			await App.populateAll(handler, false);

			if (App.hasValidApi) {
				App.startPolling(handler);
				toastSuccess($_('settings.savedSettings'), ToastStore);
				goto(`${base}/`);
			} else {
				App.stopPolling();
			}
		} catch (err) {
			debug(err);
		} finally {
			loading = false;
		}
	}

	async function loadApiKeys() {
		loadingApiKeys = true;
		try {
			apiKeys = await getApiKeys();
		} catch (error) {
			debug('Failed to load API keys:', error);
		} finally {
			loadingApiKeys = false;
		}
	}

	async function handleCreateApiKey() {
		loading = true;
		try {
			const newKey = await createApiKey(newApiKeyExpiration);
			toastSuccess($_('settings.apiKeyCreated'), ToastStore);
			await loadApiKeys();
			// Optionally show the new key in a modal
			ModalStore.trigger({
				type: 'alert',
				title: $_('settings.apiKeyCreated'),
				body: `<code class="code break-all">${newKey}</code><br><br><small>${$_('settings.deleteApiKeyWarning')}</small>`,
			});
		} catch (error) {
			debug('Failed to create API key:', error);
		} finally {
			loading = false;
		}
	}

	async function handleDeleteApiKey(apiKey: ApiKey) {
		const currentPrefix = App.apiKey.value.split('.')[0] || '';
		const isDeletingCurrent = apiKey.prefix === currentPrefix;

		ModalStore.trigger({
			type: 'confirm',
			title: $_('settings.deleteApiKeyConfirm'),
			body: `${isDeletingCurrent ? '<strong>' + $_('settings.deletingCurrentKey') + '</strong><br><br>' : ''}${$_('settings.deleteApiKeyWarning')}<br><br>Prefix: <code>${apiKey.prefix}</code>`,
			response: async (r: boolean) => {
				if (r) {
					loading = true;
					try {
						await deleteApiKey(apiKey.prefix);
						toastSuccess($_('settings.apiKeyDeleted'), ToastStore);
						await loadApiKeys();
					} catch (error) {
						debug('Failed to delete API key:', error);
					} finally {
						loading = false;
					}
				}
			},
		});
	}

	onMount(() => {
		if (App.hasValidApi) {
			loadApiKeys();
		}
	});

	async function handleBackfillDryRun() {
		loadingBackfill = true;
		try {
			if (App.nodes.value.length === 0) {
				await App.populateNodes();
			}
			backfillChanges = App.nodes.value
				.filter((node) => !node.ipAddresses || node.ipAddresses.length === 0)
				.map((node) => `${node.givenName || node.name} (#${node.id}) has no assigned IP addresses`);
			if (backfillChanges.length === 0) {
				toastSuccess($_('common.noChangesNeeded'), ToastStore);
			}
		} catch (error) {
			debug('Failed to run backfill dry run:', error);
		} finally {
			loadingBackfill = false;
		}
	}

	async function handleBackfillApply() {
		ModalStore.trigger({
			type: 'confirm',
			title: $_('common.backfillNodeIPs'),
			body:
				$_('common.backfillConfirmDesc') +
				'<br><br>' +
				$_('common.backfillChanges') +
				'<br><br>' +
				backfillChanges.map((c) => `<code class="code text-xs">${c}</code>`).join('<br>'),
			response: async (r: boolean) => {
				if (r) {
					loadingBackfill = true;
					try {
						const applied = await backfillNodeIPs(true);
						await App.populateNodes();
						toastSuccess(
							$_('common.backfillCompleted', { values: { count: applied.length } }),
							ToastStore,
						);
						backfillChanges = [];
					} catch (error) {
						debug('Failed to apply backfill:', error);
					} finally {
						loadingBackfill = false;
					}
				}
			},
		});
	}
</script>

<Page classes="items-start">
	<PageHeader title={$_('settings.title')} />
	<form onsubmit={saveSettings} class="max-w-3xl mx-auto p-6 card shadow rounded-lg">
		<div class="space-y-6">
			<div>
				<label for="api-url" class="block text-lg font-medium">{$_('settings.apiUrl')}</label>
				<input
					id="api-url"
					class="mt-1 block w-full input rounded-md"
					type="text"
					placeholder={page.url.origin}
					disabled={loading}
					bind:value={settings.apiUrl}
				/>
			</div>

			<div>
				<label for="api-key" class="block text-lg font-medium">{$_('settings.apiKey')}</label>
				<div class="mt-1 flex items-center">
					<input
						id="api-key"
						class="flex-1 input rounded-md"
						type={apiKeyShow ? 'text' : 'password'}
						placeholder={$_('settings.apiKeyPlaceholder')}
						disabled={loading}
						bind:value={settings.apiKey}
					/>
					<button
						type="button"
						disabled={loading}
						class="ml-2 p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
						onclick={() => {
							apiKeyShow = !apiKeyShow;
						}}
						aria-label={apiKeyShow ? $_('settings.hideApiKey') : $_('settings.showApiKey')}
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
						aria-label={$_('settings.refreshApiKey')}
					>
						<RawMdiOrbit />
					</button>
				</div>
				{#if apiKeyInfo.authorized !== null}
					<div class="mt-2 text-sm">
						<span
							class={apiKeyInfo.authorized
								? 'text-green-600 dark:text-green-400'
								: 'text-red-600 dark:text-red-400'}
						>
							{apiKeyInfo.authorized ? $_('settings.authorized') : $_('settings.notAuthorized')}
						</span>
						{#if apiKeyInfo.authorized && apiKeyExpirationMessage.message}
							<span class="ml-2 text-gray-500 dark:text-gray-400">
								{$_('settings.expiresIn')}: {apiKeyExpirationMessage.message}
							</span>
						{/if}
					</div>
				{:else if loading}
					<div class="mt-2 text-sm text-yellow-500 dark:text-yellow-400">
						{$_('settings.checkingAuth')}
					</div>
				{/if}
			</div>

			{#if apiKeyInfo.authorized === true}
				<div class="flex items-center space-x-2">
					<input
						id="remember-me"
						type="checkbox"
						class="checkbox"
						disabled={loading}
						bind:checked={settings.rememberMe}
					/>
					<label for="remember-me" class="text-sm font-medium cursor-pointer">
						{$_('settings.rememberMe')}
					</label>
				</div>
			{/if}

			{#if App.hasValidApi}
				<Accordion>
					<AccordionItem>
						{#snippet lead()}<RawMdiKey />{/snippet}
						{#snippet summary()}{$_('settings.apiKeysManagement')}{/snippet}
						{#snippet content()}
							<div class="space-y-4 pt-2">
								<div class="flex items-center justify-between">
									<h3 class="text-md font-medium">{$_('settings.createNewApiKey')}</h3>
									<div class="flex items-center space-x-2">
										<label for="expiration-days" class="text-sm"
											>{$_('settings.expirationDays')}:</label
										>
										<select
											id="expiration-days"
											class="select w-32"
											bind:value={newApiKeyExpiration}
											disabled={loading}
										>
											<option value={30}>30</option>
											<option value={90}>90</option>
											<option value={180}>180</option>
											<option value={365}>365</option>
											<option value={0}>{$_('settings.neverExpire')}</option>
										</select>
										<button
											type="button"
											class="btn btn-sm variant-filled-primary"
											disabled={loading}
											onclick={handleCreateApiKey}
										>
											<RawMdiPlus class="w-4 h-4 mr-1" />
											{$_('common.create')}
										</button>
									</div>
								</div>

								<div class="border-t border-surface-300-600-token pt-4">
									<h3 class="text-md font-medium mb-3">{$_('settings.apiKeysList')}</h3>
									{#if loadingApiKeys}
										<p class="text-sm text-gray-500">{$_('settings.loadingApiKeys')}</p>
									{:else if apiKeys.length === 0}
										<p class="text-sm text-gray-500">{$_('settings.noApiKeys')}</p>
									{:else}
										<div class="overflow-x-auto">
											<table class="table table-hover">
												<thead>
													<tr>
														<th>{$_('settings.prefix')}</th>
														<th>{$_('settings.createdAt')}</th>
														<th>{$_('settings.lastSeen')}</th>
														<th>{$_('settings.expiration')}</th>
														<th class="text-right">{$_('common.delete')}</th>
													</tr>
												</thead>
												<tbody>
													{#each apiKeys as apiKey (apiKey.id)}
														{@const isExpired =
															apiKey.expiration && new Date(apiKey.expiration) < new Date()}
														{@const isCurrent =
															apiKey.prefix === (App.apiKey.value.split('.')[0] || '')}
														<tr class:table-row-checked={isCurrent}>
															<td>
																<code class="code text-xs">{apiKey.prefix}</code>
																{#if isCurrent}
																	<span class="badge variant-filled-success ml-2 text-xs"
																		>Current</span
																	>
																{/if}
															</td>
															<td class="text-sm">{dateToStr(apiKey.createdAt)}</td>
															<td class="text-sm"
																>{apiKey.lastSeen ? dateToStr(apiKey.lastSeen) : '-'}</td
															>
															<td class="text-sm">
																{#if apiKey.expiration}
																	<span class:text-red-500={isExpired}>
																		{dateToStr(apiKey.expiration)}
																	</span>
																	{#if isExpired}
																		<span class="badge variant-filled-error ml-2 text-xs"
																			>Expired</span
																		>
																	{/if}
																{:else}
																	-
																{/if}
															</td>
															<td class="text-right">
																<button
																	type="button"
																	class="btn btn-sm variant-ghost-error"
																	disabled={loading}
																	onclick={() => handleDeleteApiKey(apiKey)}
																	aria-label="Delete API Key"
																>
																	<RawMdiDelete class="w-4 h-4" />
																</button>
															</td>
														</tr>
													{/each}
												</tbody>
											</table>
										</div>
									{/if}
								</div>
							</div>
						{/snippet}
					</AccordionItem>
				</Accordion>

				<div class="grid grid-cols-1 md:grid-cols-4 gap-6 items-start mt-4">
					<div class="col-span-1">
						<label
							for="api-ttl"
							class="block text-sm font-semibold opacity-70 uppercase tracking-wider mb-2"
							>{$_('settings.apiTtl')}</label
						>
						<div class="input-group input-group-divider grid-cols-[1fr_auto]">
							<input
								id="api-ttl"
								type="number"
								min="1"
								disabled={loading}
								bind:value={settings.apiTtl}
								placeholder="60"
							/>
							<div class="input-group-shim text-xs opacity-50">SEC</div>
						</div>
					</div>

					<div class="col-span-1 md:col-span-3">
						<label
							for="debugging"
							class="hidden md:block text-sm font-semibold opacity-70 uppercase tracking-wider mb-2 cursor-pointer"
							>{$_('settings.debugging')}</label
						>
						<Accordion classes="card bg-surface-500/5">
							<AccordionItem>
								{#snippet lead()}<RawMdiOrbit class="w-4 h-4" />{/snippet}
								{#snippet summary()}
									<!-- svelte-ignore a11y_click_events_have_key_events -->
									<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
									<div
										class="flex items-center space-x-3"
										onclick={(e) => e.stopPropagation()}
										role="group"
									>
										<input
											id="debugging"
											name="debugging"
											type="checkbox"
											class="checkbox checkbox-sm"
											disabled={loading}
											bind:checked={settings.debug}
										/>
										<span class="text-sm font-bold">
											{$_('settings.debugging')}
										</span>
									</div>
								{/snippet}
								{#snippet content()}
									<div class="flex flex-col space-y-4 pt-2">
										<div class="flex items-start justify-between space-x-4">
											<button
												type="button"
												class="btn btn-sm rounded-md variant-ghost-primary w-full"
												onclick={() => debugJson('users', App.users.value)}
											>
												{$_('settings.logUsers')}
											</button>
											<button
												type="button"
												class="btn btn-sm rounded-md variant-ghost-primary w-full"
												onclick={() => debugJson('nodes', App.nodes.value)}
											>
												{$_('settings.logNodes')}
											</button>
										</div>
										<div class="flex items-start justify-between space-x-4">
											<button
												type="button"
												class="btn btn-sm rounded-md variant-ghost-primary w-full"
												onclick={() => debugJson('preAuthKeys', App.preAuthKeys.value)}
											>
												{$_('settings.logPreAuthKeys')}
											</button>
											<button
												type="button"
												class="btn btn-sm rounded-md variant-ghost-primary w-full"
												onclick={() => debugJson('apiKeyInfo', App.apiKeyInfo.value)}
											>
												{$_('settings.logApiKeyInfo')}
											</button>
										</div>
										<div class="border-t border-surface-300-600-token"></div>
										<div class="space-y-3">
											<h3 class="text-md font-medium">{$_('common.backfillNodeIPs')}</h3>
											<p class="text-sm text-gray-600 dark:text-gray-400">
												{$_('common.backfillNodeIPsDesc')}
											</p>
											<div class="flex items-center space-x-2">
												<button
													type="button"
													class="btn btn-sm variant-soft-primary"
													disabled={loadingBackfill}
													onclick={handleBackfillDryRun}
												>
													{$_('common.dryRun')}
												</button>
												{#if backfillChanges.length > 0}
													<button
														type="button"
														class="btn btn-sm variant-filled-primary"
														disabled={loadingBackfill}
														onclick={handleBackfillApply}
													>
														{$_('common.applyChanges')}
													</button>
												{/if}
											</div>
											{#if backfillChanges.length > 0}
												<div class="border-t border-surface-300-600-token pt-3">
													<h4 class="text-sm font-medium mb-2">{$_('common.backfillChanges')}</h4>
													<div class="space-y-1 max-h-48 overflow-y-auto">
														{#each backfillChanges as change}
															<code class="code text-xs block">{change}</code>
														{/each}
													</div>
												</div>
											{/if}
										</div>
									</div>
								{/snippet}
							</AccordionItem>
						</Accordion>
					</div>
				</div>
			{/if}

			<div>
				<label for="theme-selector" class="block text-lg font-medium">{$_('settings.theme')}</label>
				<select
					id="theme-selector"
					class="mt-1 block w-full select rounded-md"
					bind:value={App.theme.value}
					onchange={() => {
						setTheme(App.theme.value);
						settings.theme = App.theme.value;
					}}
				>
					{#each ALL_THEMES as theme}
						<option value={theme}>{theme}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="language-selector" class="block text-lg font-medium"
					>{$_('settings.language')}</label
				>
				<select
					id="language-selector"
					class="mt-1 block w-full select rounded-md"
					bind:value={settings.language}
					onchange={() => {
						App.language.value = settings.language;
						locale.set(settings.language);
					}}
				>
					{#each LOCALE_OPTIONS as language}
						<option value={language.code}>{language.label}</option>
					{/each}
				</select>
			</div>

			<div class="flex justify-end">
				<button
					type="submit"
					disabled={loading || !settings.apiKey}
					class="btn variant-filled-primary"
				>
					<RawMdiContentSaveOutline class="w-5 h-5 mr-2" />
					{$_('settings.save')}
				</button>
			</div>
		</div>
	</form>
</Page>
