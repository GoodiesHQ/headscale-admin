<script lang="ts">
	import Navigation from '$lib/Navigation.svelte';
	import RawMdiGithub from '~icons/mdi/github';
	import '../app.postcss';
	import {
		AppBar,
		AppShell,
		LightSwitch,
		Modal,
		Toast,
		getDrawerStore,
		getToastStore,
		initializeStores,
		type DrawerSettings,
	} from '@skeletonlabs/skeleton';

	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	initializeStores();

	const DrawerStore = getDrawerStore();

	let drawerSettings = $state({
		id: 'navDrawer',
		position: 'left',
		width: 'w-64',
		padding: '',
	}) as DrawerSettings;

	// Highlight JS
	import hljs from 'highlight.js';
	import 'highlight.js/styles/github-dark.css';
	import { storeHighlightJs } from '@skeletonlabs/skeleton';
	storeHighlightJs.set(hljs);

	// Floating UI for Popups
	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

	import PageDrawer from '$lib/page/PageDrawer.svelte';
	import { createPopulateErrorHandler } from '$lib/common/errors';
	import { version } from '$lib/common/debug';
	import { App } from '$lib/States.svelte';
	import { setTheme } from '$lib/common/themes';
	import '$lib/i18n';
	import { locale, waitLocale, _, isLoading } from 'svelte-i18n';
	import LanguageGate from '$lib/page/LanguageGate.svelte';
	import { hasStoredLocalePreference, type SupportedLocale } from '$lib/i18n';

	let { children } = $props()

	let ToastStore = $state(getToastStore());
	let appReady = $state(false);
	let showLanguageGate = $state(false);
	let booting = $state(false);

	async function initializeApp() {
		if (booting) {
			return;
		}

		booting = true;

		try {
			locale.set(App.language.value);
			await waitLocale();
			setTheme(App.theme.value || 'skeleton');
			await App.populateAll(createPopulateErrorHandler(ToastStore), true);
			appReady = true;

			if (!App.hasValidApi) {
				goto(`${base}/settings`);
			}
		} finally {
			booting = false;
		}
	}

	async function handleLanguageSelected(language: SupportedLocale) {
		App.language.value = language;
		locale.set(language);
		showLanguageGate = false;
		await waitLocale();
		await initializeApp();
	}

	onMount(async () => {
		await waitLocale();

		if (!hasStoredLocalePreference()) {
			setTheme(App.theme.value || 'skeleton');
			showLanguageGate = true;
			appReady = true;
			return;
		}

		await initializeApp();
	});
</script>

{#if showLanguageGate}
	<LanguageGate onSelect={handleLanguageSelected} selecting={booting} />
{:else if !appReady}
	<div class="min-h-screen flex items-center justify-center bg-surface-50-900-token px-6">
		<div class="text-center">
			<div class="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full bg-primary-500/20"></div>
			<p class="text-sm uppercase tracking-[0.2em] text-surface-500">Loading / 加载中</p>
		</div>
	</div>
{:else}
	<Toast />
	<PageDrawer />
	<Modal
		background="bg-surface-50-900-token"
	/>
	<AppShell slotSidebarLeft="bg-surface-50-900-token border-r border-surface-500/30 w-0 lg:w-48" scrollGutter="stable both-edges">
		<svelte:fragment slot="header">
			<!-- App Bar -->
			<AppBar>
				<svelte:fragment slot="lead">
					<div class="flex items-center whitespace-nowrap overflow-hidden">
						<button
							aria-label="open navigation panel"
							class="lg:hidden btn btn-sm mr-2 md:mr-4 px-2"
							onclick={() => {
								DrawerStore.open(drawerSettings);
							}}
						>
							<span>
								<svg viewBox="0 0 100 80" class="fill-token w-4 h-4">
									<rect width="100" height="20" />
									<rect y="30" width="100" height="20" />
									<rect y="60" width="100" height="20" />
								</svg>
							</span>
						</button>
						<strong class="text-lg md:text-xl uppercase truncate">{$isLoading ? 'Headscale-Admin' : $_('app.title')}</strong>
						<span class="text-[10px] md:text-sm lowercase opacity-50 ml-1 mt-1">{version}</span>
					</div>
				</svelte:fragment>

				<svelte:fragment slot="trail">
					<div class="flex items-center gap-2 md:gap-4">
						<LightSwitch />
						<a
							class="btn btn-sm variant-ghost-surface h-8 md:h-auto px-2 md:px-3"
							href="https://github.com/serein-213/headscale-admin-il18n"
							target="_blank"
							rel="noreferrer"
							title="GitHub"
						>
							<RawMdiGithub />
							<span class="hidden md:inline ml-2">{$isLoading ? 'GitHub' : $_('app.github')}</span>
						</a>
					</div>
				</svelte:fragment>
			</AppBar>
		</svelte:fragment>
		<svelte:fragment slot="sidebarLeft">
			<Navigation />
		</svelte:fragment>
		<div class="px-2 h-full">
			{#if App.hasValidApi || $page.url.pathname.includes('/settings')}
				{@render children()}
			{/if}
		</div>
	</AppShell>
{/if}
