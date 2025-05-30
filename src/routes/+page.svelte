<script lang="ts">
	import CardTileContainer from '$lib/cards/CardTileContainer.svelte';
	import CardTilePage from '$lib/cards/CardTilePage.svelte';
	import Page from '$lib/page/Page.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { isExpired } from '$lib/common/funcs';

	import RawMdiDevices from '~icons/mdi/devices';
	import RawMdiRouter from '~icons/mdi/devices';
	import RawMdiUser from '~icons/mdi/user';

	import { App } from '$lib/States.svelte';

	type Summary = {
		title: string;
		border: string;
		value: any;
		icon: any;
		path: string;
	};

	const summaries = $derived<Summary[]>(
		[
			{
				title: 'Total Users',
				border: 'border-primary-700 dark:border-primary-600',
				icon: RawMdiUser,
				value: App.users.value.length,
				path: '/users',
			},
			{
				title: 'Online Users',
				border: 'border-primary-500 dark:border-primary-400',
				icon: RawMdiUser,
				value: App.users.value.filter((user) =>
					App.nodes.value
						.filter((node) => node.online)
						.some((node) => node.user.id === user.id),
				).length,
				path: '/users',
			},
			{
				title: 'Valid PreAuth Keys',
				border: 'border-slate-700 dark:border-slate-500',
				icon: RawMdiDevices,
				value: App.preAuthKeys.value.filter(
					(pak) => !isExpired(pak.expiration) && !(pak.used && !pak.reusable),
				).length,
				path: '/users',
			},
			{
				title: 'Total Nodes',
				border: 'border-secondary-700 dark:border-secondary-600',
				icon: RawMdiDevices,
				value: App.nodes.value.length,
				path: '/nodes',
			},
			{
				title: 'Online Nodes',
				border: 'border-secondary-400 dark:border-secondary-400',
				icon: RawMdiDevices,
				value: App.nodes.value.filter((n) => n.online).length,
				path: '/nodes',
			},
			{
				title: 'Total Routes',
				border: 'border-warning-600 dark:border-warning-600',
				icon: RawMdiRouter,
				value: App.nodes.value.reduce(
					(acc, node) => acc + (node.availableRoutes ? node.availableRoutes.length : 0),
					0,
				),
				path: '/routes',
			},
		]
	);
</script>

<Page>
	<PageHeader title="Home" />

	<CardTilePage>
		{#each summaries as summary}
			<CardTileContainer
				classes="border-solid border-[3px] border-l-[18px] {summary.border}"
				onclick={() => {
					goto(base + summary.path);
				}}
			>
				<div class="flex justify-around items-center mb-4 mt-2">
					<div class="flex pr-2">
						<span class="ml-2 text-5xl font-semibold">{summary.value}</span>
					</div>
				</div>
				<div class="flex justify-around items-center">
					<div class="flex items-center text-2xl font-bold">
						<summary.icon />
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
