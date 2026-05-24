<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import CardTileContainer from '$lib/cards/CardTileContainer.svelte';
	import CardTilePage from '$lib/cards/CardTilePage.svelte';
	import Page from '$lib/page/Page.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { dateToStr, isExpired } from '$lib/common/funcs';
	import { getHealth } from '$lib/common/api';
	import type { HealthStatus } from '$lib/common/types';

	import RawMdiDevices from '~icons/mdi/devices';
	import RawMdiRouter from '~icons/mdi/router';
	import RawMdiUser from '~icons/mdi/user';
	import RawMdiDatabase from '~icons/mdi/database';
	import RawMdiCheckCircle from '~icons/mdi/check-circle';
	import RawMdiAlertCircle from '~icons/mdi/alert-circle';
	import RawMdiRefresh from '~icons/mdi/refresh';
	import RawMdiKey from '~icons/mdi/key-variant';

	import { App } from '$lib/States.svelte';
	import { _ } from 'svelte-i18n';

	type Summary = {
		titleKey: string;
		border: string;
		value: any;
		icon: any;
		path: string;
		subValues?: { labelKey: string; value: any; colorClass?: string }[];
	};

	const summaries = $derived<Summary[]>(
		[
			{
				titleKey: 'home.totalUsers',
				border: 'border-primary-700 dark:border-primary-600',
				icon: RawMdiUser,
				value: App.users.value.length,
				path: '/users',
			},
			{
				titleKey: 'home.totalNodes',
				border: 'border-secondary-700 dark:border-secondary-600',
				icon: RawMdiDevices,
				value: App.nodes.value.length,
				path: '/nodes',
				subValues: [
					{
						labelKey: 'status.onlineNodes',
						value: App.nodes.value.filter((n) => n.online).length,
						colorClass: 'text-success-600 dark:text-success-400'
					},
					{
						labelKey: 'status.offlineNodes',
						value: App.nodes.value.filter((n) => !n.online).length,
						colorClass: 'text-surface-500'
					}
				]
			},
			{
				titleKey: 'home.totalRoutes',
				border: 'border-warning-600 dark:border-warning-600',
				icon: RawMdiRouter,
				value: App.nodes.value.reduce(
					(acc, node) => acc + (node.availableRoutes ? node.availableRoutes.length : 0),
					0,
				),
				path: '/routes',
				subValues: [
					{
						labelKey: 'status.enabledRoutes',
						value: App.nodes.value.reduce((acc, node) => acc + (node.approvedRoutes ? node.approvedRoutes.length : 0), 0),
						colorClass: 'text-success-600 dark:text-success-400'
					}
				]
			},
			{
				titleKey: 'home.validPreAuthKeys',
				border: 'border-slate-700 dark:border-slate-500',
				icon: RawMdiKey,
				value: App.preAuthKeys.value.filter(
					(pak) => !isExpired(pak.expiration) && !(pak.used && !pak.reusable),
				).length,
				path: '/users',
			},
		]
	);

	let healthStatus = $state<HealthStatus>({
		databaseConnectivity: false,
		lastChecked: new Date(),
	});
	let refreshing = $state(false);
	let autoRefreshEnabled = $state(true);
	let refreshInterval: any = null;

	async function checkHealth() {
		try {
			const health = await getHealth();
			healthStatus = {
				databaseConnectivity: health.databaseConnectivity,
				lastChecked: new Date(),
			};
		} catch {
			healthStatus = {
				databaseConnectivity: false,
				lastChecked: new Date(),
			};
		}
	}

	async function refreshAll() {
		refreshing = true;
		try {
			await Promise.all([
				checkHealth(),
				App.populateAll(() => {}, false)
			]);
		} finally {
			refreshing = false;
		}
	}

	function setupAutoRefresh() {
		if (refreshInterval) clearInterval(refreshInterval);
		if (autoRefreshEnabled) {
			refreshInterval = setInterval(refreshAll, 30000); // 30s
		}
	}

	onMount(async () => {
		await refreshAll();
		setupAutoRefresh();
	});

	onDestroy(() => {
		if (refreshInterval) clearInterval(refreshInterval);
	});

	$effect(() => {
		setupAutoRefresh();
	});
</script>

<Page>
	<PageHeader title={$_('navigation.home')} />

	<div class="max-w-4xl p-4 space-y-6">
		<!-- System Health Check at Top -->
		<div class="card p-3 bg-surface-50-900-token border border-surface-500/10 shadow-sm">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div class="flex items-center space-x-3">
					<div class="p-2 rounded-lg bg-primary-500/10 text-primary-500">
						<RawMdiDatabase class="w-5 h-5" />
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<h2 class="text-base font-bold">{$_('status.healthCheck')}</h2>
						<div class="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border {healthStatus.databaseConnectivity ? 'bg-success-500/10 border-success-500/20 text-success-600 dark:text-success-400' : 'bg-error-500/10 border-error-500/20 text-error-600 dark:text-error-400'}">
							{#if healthStatus.databaseConnectivity}
								<RawMdiCheckCircle class="w-3.5 h-3.5" />
							{:else}
								<RawMdiAlertCircle class="w-3.5 h-3.5" />
							{/if}
							<span class="text-[10px] font-bold uppercase tracking-wider">{healthStatus.databaseConnectivity ? $_('status.healthy') : $_('status.unhealthy')}</span>
						</div>
					</div>
				</div>
				
				<div class="flex items-center justify-between sm:justify-end gap-4">
					<span class="text-[10px] opacity-40 font-mono hidden md:block">{$_('status.lastChecked')}: {dateToStr(healthStatus.lastChecked)}</span>
					
					<div class="flex items-center gap-3">
						<label class="flex items-center space-x-2 cursor-pointer transition-colors">
							<input
								type="checkbox"
								class="checkbox checkbox-sm"
								bind:checked={autoRefreshEnabled}
							/>
							<span class="text-xs opacity-70">{$_('status.autoRefresh')}</span>
						</label>
						
						<button
							type="button"
							class="btn btn-xs variant-soft-primary"
							onclick={refreshAll}
							disabled={refreshing}
						>
							<RawMdiRefresh class="w-3 h-3 mr-1.5 {refreshing ? 'animate-spin' : ''}" />
							<span class="text-[10px] uppercase font-bold">{refreshing ? $_('status.refreshing') : $_('status.refresh')}</span>
						</button>
					</div>
				</div>
			</div>
		</div>

		<CardTilePage>
			{#each summaries as summary}
				<CardTileContainer
					classes="border-solid border-[3px] border-l-[18px] {summary.border} transform-none"
					href={base + summary.path}
				>
					<div class="flex justify-between items-start mb-2 mt-2 px-2">
						<div class="flex flex-col text-left">
							<span class="text-4xl font-bold">{summary.value}</span>
							<span class="text-xs font-semibold opacity-70 uppercase tracking-wider">{$_(summary.titleKey)}</span>
						</div>
						<div class="p-2 rounded-lg bg-surface-500/10">
							<summary.icon class="w-6 h-6" />
						</div>
					</div>
					
					{#if summary.subValues}
						<div class="mt-4 border-t border-surface-500/10 pt-2 px-2">
							{#each summary.subValues as sub}
								<div class="flex justify-between items-center text-xs mb-1 text-left">
									<span class="opacity-70">{$_(sub.labelKey)}</span>
									<span class="font-mono font-bold {sub.colorClass} text-sm">{sub.value}</span>
								</div>
							{/each}
						</div>
					{:else}
						<div class="mt-4 pt-2 px-2 opacity-30 text-[10px] uppercase text-left">
							{$_('home.clickToView')}
						</div>
					{/if}
				</CardTileContainer>
			{/each}
		</CardTilePage>
	</div>
</Page>

<style>
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
	.animate-spin {
		animation: spin 1s linear infinite;
	}
</style>
