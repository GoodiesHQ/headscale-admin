<script lang="ts">
	import { base } from '$app/paths';
	import { getDrawerStore } from '@skeletonlabs/skeleton';

	import RawMdiHome from '~icons/mdi/home';
	import RawMdiPerson from '~icons/mdi/person';
	import RawMdiDevices from '~icons/mdi/devices';
	import RawMdiSettings from '~icons/mdi/settings';
	import RawMdiHomeGroupPlus from '~icons/mdi/home-group-plus';
	// import RawMdiSecurity from '~icons/mdi/security';

	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { ApiKeyStore, hasApiKey } from './Stores';
	import { onMount } from 'svelte';

	export let labels = true;

	const DrawerStore = getDrawerStore();

	$: classesActive = (href: string) =>
		href === newPath || href === $page.url.pathname ? 'bg-primary-300 dark:bg-primary-700' : '';

	let newPath = '';
	let oldPath = '';

	function setActivePath(path: string) {
		oldPath = newPath;
		newPath = path;
	}

	type Page = {
		path: string;
		name: string;
		logo: ConstructorOfATypedSvelteComponent;
	};

	const allPages: Page[] = [
		{ path: `${base}/`, name: 'Home', logo: RawMdiHome },
		{ path: `${base}/users`, name: 'Users', logo: RawMdiPerson },
		{ path: `${base}/nodes`, name: 'Nodes', logo: RawMdiDevices },
		{ path: `${base}/deploy`, name: 'Deploy', logo: RawMdiHomeGroupPlus },
		// { path: '/acls', name: 'ACLs', logo: RawMdiSecurity },
		{ path: `${base}/settings`, name: 'Settings', logo: RawMdiSettings },
	];

	$: getPages = (): Page[] => {
		// before rendering, show no elements
		if (typeof window === 'undefined') {
			return [];
		}

		return hasApiKey() ? allPages : allPages.slice(-1);
	};

	$: pages = getPages();

	onMount(() => {
		const unsubApiKeyStore = ApiKeyStore.subscribe(() => {
			pages = getPages();
		});
		return () => {
			unsubApiKeyStore();
		};
	});
</script>

<nav class="list-nav pt-0">
	<ul>
		{#each pages as p}
			<li>
				<a
					href="{base}{p.path}"
					class={'!rounded-none ' + classesActive(p.path)}
					on:click={() => {
						DrawerStore.close();
						setActivePath(p.path);
					}}
				>
					<span class="flex flex-row items-center text-lg">
						<svelte:component this={p.logo} class="mr-4" />
						{#if labels}
							<span class="text-sm">{p.name}</span>
						{/if}
					</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>
