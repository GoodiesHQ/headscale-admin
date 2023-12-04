<script lang="ts">
	import { NodeStore, RouteStore, UserStore } from '$lib/Stores';
	import CardTilePage from '$lib/cards/CardTilePage.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';
	import { get } from 'svelte/store';
	import RawMdiUser from '~icons/mdi/user';
	import RawMdiDevices from '~icons/mdi/devices';
	import RawMdiRouter from '~icons/mdi/devices';
	import { onMount } from 'svelte';
	import CardTileContainer from '$lib/cards/CardTileContainer.svelte';
	import Page from '$lib/page/Page.svelte';

	type Summary = {
		title: string;
		border: string;
		value: any;
		icon: any;
	};

	$: summaries = [] as Summary[];

	function setSummaries() {
		summaries = [
			{
				title: 'Total Users',
				border: 'border-primary-400 dark:border-primary-600',
				icon: RawMdiUser,
				value: get(UserStore).length,
			},
			{
				title: 'Total Nodes',
				border: 'border-secondary-400 dark:border-secondary-600',
				icon: RawMdiDevices,
				value: get(NodeStore).length,
			},
			{
				title: 'Online Nodes',
				border: 'border-success-700 dark:border-success-500',
				icon: RawMdiDevices,
				value: get(NodeStore).filter((m) => m.online).length,
			},
			{
				title: 'Total Routes',
				border: 'border-warning-600 dark:border-warning-600',
				icon: RawMdiRouter,
				value: get(RouteStore).length,
			},
		];
	}

	onMount(() => {
		const unsubUserStore = UserStore.subscribe((_) => setSummaries());
		const unsubNodeStore = NodeStore.subscribe((_) => setSummaries());

		return () => {
			unsubUserStore();
			unsubNodeStore();
		};
	});
</script>

<Page>
	<PageHeader title="Home" />

	<CardTilePage>
		{#each summaries as summary}
			<CardTileContainer classes="border-solid border-[3px] border-l-[18px] {summary.border}">
				<div class="flex justify-around items-center mb-4 mt-2">
					<div class="flex items-center">
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
