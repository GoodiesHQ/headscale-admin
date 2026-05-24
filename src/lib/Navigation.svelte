<script lang="ts">
	import { base } from '$app/paths';
	import { getDrawerStore } from '@skeletonlabs/skeleton';

	import RawMdiDevices from '~icons/mdi/devices';
	import RawMdiHome from '~icons/mdi/home';
	import RawMdiHomeGroupPlus from '~icons/mdi/home-group-plus';
	import RawMdiPerson from '~icons/mdi/person';
	import RawMdiRouter from '~icons/mdi/router';
	import RawMdiSecurity from '~icons/mdi/security';
	import RawMdiSettings from '~icons/mdi/settings';
	import RawMdiChartLine from '~icons/mdi/chart-line';

	// import { ApiKeyInfoStore, ApiKeyStore, hasValidApi } from './Stores';
	import { onMount, type Component } from 'svelte';
	import { page } from '$app/state';
	import { App } from '$lib/States.svelte';
	import { _ } from 'svelte-i18n';

	type NavigationProps = {
		labels?: boolean
	}

	let {
		labels = true,
	}: NavigationProps = $props()

	const DrawerStore = getDrawerStore();

	function classesActive(href: string): string {
		return href === page.route.id ? 'variant-filled-primary' : '';
	}

	let newPath = $state('');

	function setActivePath(path: string) {
		newPath = path;
	}

	type Page = {
		path: string;
		nameKey: string;
		logo: Component;
	};

	const allPages: Page[] = [
		{ path: '/', nameKey: 'navigation.home', logo: RawMdiHome },
		{ path: '/users', nameKey: 'navigation.users', logo: RawMdiPerson },
		{ path: '/nodes', nameKey: 'navigation.nodes', logo: RawMdiDevices },
		{ path: '/deploy', nameKey: 'navigation.deploy', logo: RawMdiHomeGroupPlus },
		{ path: '/routes', nameKey: 'navigation.routes', logo: RawMdiRouter },
		{ path: '/acls', nameKey: 'navigation.acls', logo: RawMdiSecurity },
		{ path: '/settings', nameKey: 'navigation.settings', logo: RawMdiSettings },
	].filter((p) => p != undefined);

	const pages = $derived.by(() => App.hasValidApi ? allPages : allPages.slice(-1));
</script>

<nav class="list-nav pt-0">
	<ul>
		{#each pages as p}
			<li>
				<a
					href="{base}{p.path}"
					class={'!rounded-none ' + classesActive(p.path)}
					onclick={() => {
						DrawerStore.close();
						setActivePath(p.path);
					}}
				>
					<span class="flex flex-row items-center text-lg">
						<p.logo />
						<!--svelte:component this={p.logo} class="mr-4" /-->
						{#if labels}
							<span class="text-sm ml-2">{$_(p.nameKey)}</span>
						{/if}
					</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>
