<script lang="ts">
	import { NodeStore, PreAuthKeyStore, RouteStore, UserStore } from '$lib/Stores';
	import CardTilePage from '$lib/cards/CardTilePage.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';
	import { get } from 'svelte/store';
	import RawMdiUser from '~icons/mdi/user';
	import RawMdiDevices from '~icons/mdi/devices';
	import RawMdiRouter from '~icons/mdi/devices';
	import { onMount } from 'svelte';
	import CardTileContainer from '$lib/cards/CardTileContainer.svelte';
	import Page from '$lib/page/Page.svelte';
	import { isExpired } from '$lib/common/funcs';
	import type { Node, User } from '$lib/common/types';
	import { goto } from '$app/navigation';

	type Summary = {
		title: string;
		border: string;
		value: any;
		icon: any;
		path: string;
	};

	$: summaries = [] as Summary[];

	$: nodes = [] as Node[];
	$: users = [] as User[];

	function setSummaries() {
		summaries = [
			{
				title: 'Total Users',
				border: 'border-primary-700 dark:border-primary-600',
				icon: RawMdiUser,
				value: get(UserStore).length,
				path: '/users',
			},
			{
				title: 'Online Users',
				border: 'border-primary-500 dark:border-primary-400',
				icon: RawMdiUser,
				value: get(UserStore).filter((user) =>
					nodes.filter((node) => node.online).some((node) => node.user.id === user.id),
				).length,
				path: '/users',
			},
			{
				title: 'Valid PreAuth Keys',
				border: 'border-slate-700 dark:border-slate-500',
				icon: RawMdiDevices,
				value: get(PreAuthKeyStore).filter(
					(pak) => !isExpired(pak.expiration) && !(pak.used && !pak.reusable),
				).length,
				path: '/users',
			},
			{
				title: 'Total Nodes',
				border: 'border-secondary-700 dark:border-secondary-600',
				icon: RawMdiDevices,
				value: get(NodeStore).length,
				path: '/nodes',
			},
			{
				title: 'Online Nodes',
				border: 'border-secondary-400 dark:border-secondary-400',
				icon: RawMdiDevices,
				value: get(NodeStore).filter((m) => m.online).length,
				path: '/nodes',
			},
			{
				title: 'Total Routes',
				border: 'border-warning-600 dark:border-warning-600',
				icon: RawMdiRouter,
				value: get(RouteStore).length,
				path: '/routes',
			},
		];
	}

	onMount(() => {
		const unsubUserStore = UserStore.subscribe((us) => {
			users = us;
			setSummaries();
		});
		const unsubNodeStore = NodeStore.subscribe((ns) => {
			nodes = ns;
			setSummaries();
		});
		const unsubRouteStore = RouteStore.subscribe((_) => setSummaries());
		const unsubPreAuthKeyStore = PreAuthKeyStore.subscribe((_) => setSummaries());

		return () => {
			unsubUserStore();
			unsubNodeStore();
			unsubRouteStore();
			unsubPreAuthKeyStore();
		};
	});
</script>

<Page>
	<PageHeader title="Home" />

	<CardTilePage>
		{#each summaries as summary}
			<CardTileContainer classes="border-solid border-[3px] border-l-[18px] {summary.border}" onclick={() => {goto(summary.path)}}>
				<div class="flex justify-around items-center mb-4 mt-2">
					<div class="flex pr-2">
						<span class="ml-2 text-5xl font-semibold">{summary.value}</span>
					</div>
				</div>
				<div class="flex justify-around items-center">
					<div class="flex items-center text-2xl font-bold">
						<svelte:component this={summary.icon} />
					</div>
				</div>
				<div class="flex justify-around items-center">
					<div class="text-small flex items-center font-bold">
						{summary.title}
					</div>
				</div>
			</CardTileContainer>
		{/each}
	</CardTilePage>
</Page>
