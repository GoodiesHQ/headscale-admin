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
		initializeStores,
		type DrawerSettings,
		getToastStore,
	} from '@skeletonlabs/skeleton';

	import { base } from '$app/paths';
	import { beforeNavigate, goto } from '$app/navigation';

	initializeStores();

	const DrawerStore = getDrawerStore();

	$: drawerSettings = {
		id: 'navDrawer',
		position: 'left',
		width: 'w-64',
		padding: '',
	} as DrawerSettings;

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

	import { hasValidApi, populateStores, ThemeStore } from '$lib/Stores';
	import PageDrawer from '$lib/page/PageDrawer.svelte';
	import { fade } from 'svelte/transition';
	import { createPopulateErrorHandler } from '$lib/common/errors';
	import { version } from '$lib/common/debug';

	$: ToastStore = getToastStore();

	onMount(() => {
		ThemeStore.subscribe((theme) => {
			document.body.setAttribute('data-theme', theme);
		});

		populateStores(createPopulateErrorHandler(ToastStore), true);

		if (!hasValidApi()) {
			goto(`${base}/settings`);
		}

		return () => {};
	});
</script>

<Toast />
<PageDrawer />
<Modal />
<AppShell slotSidebarLeft="w-0 mr-2 lg:w-48" scrollGutter="stable both-edges">
	<svelte:fragment slot="header">
		<!-- App Bar -->
		<AppBar>
			<svelte:fragment slot="lead">
				<div>
					<button
						aria-label="open navigation panel"
						class="lg:hidden btn btn-sm mr-4"
						on:click={() => {
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
					<strong class="text-xl uppercase">Headscale-Admin</strong>
					<span class="text-sm lowercase">{version}</span>
				</div>
			</svelte:fragment>

			<svelte:fragment slot="trail">
				<LightSwitch />
				<a
					class="btn btn-sm variant-ghost-surface"
					href="https://github.com/GoodiesHQ/headscale-admin"
					target="_blank"
					rel="noreferrer"
				>
					<RawMdiGithub class="mr-2" />
					GitHub
				</a>
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<svelte:fragment slot="sidebarLeft">
		<Navigation />
	</svelte:fragment>
	<div class="pl-2 h-full" transition:fade|local>
		<slot />
	</div>
</AppShell>
