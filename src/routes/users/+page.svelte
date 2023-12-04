<script lang="ts">
	import CardListPage from '$lib/cards/CardListPage.svelte';
	import UserCreate from '$lib/cards/user/UserCreate.svelte';
	import UserListCard from '$lib/cards/user/UserListCard.svelte';
	import UserTileCard from '$lib/cards/user/UserTileCard.svelte';
	import CardTilePage from '$lib/cards/CardTilePage.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';

	import { UserStore, LayoutUserStore } from '$lib/Stores';

	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	import Page from '$lib/page/Page.svelte';

	$: users = get(UserStore);
	$: layout = get(LayoutUserStore);
	let showCreate = false;

	onMount(() => {
		const unsubUserStore = UserStore.subscribe((u) => (users = u));
		const unsubLayoutUserStore = LayoutUserStore.subscribe((l) => (layout = l));
		return () => {
			unsubUserStore();
			unsubLayoutUserStore();
		};
	});

	$: outer = layout == 'list' ? CardListPage : CardTilePage;
	$: inner = layout == 'list' ? UserListCard : UserTileCard;
</script>

<Page>
	<PageHeader title="Users" layout={LayoutUserStore} bind:show={showCreate}>
		<UserCreate bind:show={showCreate} />
	</PageHeader>

	<svelte:component this={outer}>
		{#each users as user}
			<svelte:component this={inner} {user} />
		{/each}
	</svelte:component>
</Page>
