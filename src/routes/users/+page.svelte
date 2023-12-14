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
	import type { User } from '$lib/common/types';
	import { stringify } from 'querystring';

	$: layout = get(LayoutUserStore);
	$: showCreate = false;
	$: users = get(UserStore);
	$: filterString = '';

	$: outer = layout == 'list' ? CardListPage : CardTilePage;
	$: inner = layout == 'list' ? UserListCard : UserTileCard;

	function filter(user: User, filterString: string): boolean {
		try {
			if (filterString === '') {
				return true;
			}
			const r = RegExp(filterString);
			return r.test(user.name);
		} catch (error) {
			return true;
		}
	}

	function getFilteredUsers(filterString: string): User[] {
		return users.filter((user) => filter(user, filterString));
	}

	onMount(() => {
		const unsubUserStore = UserStore.subscribe((u) => (users = u));
		const unsubLayoutUserStore = LayoutUserStore.subscribe((l) => (layout = l));
		return () => {
			unsubUserStore();
			unsubLayoutUserStore();
		};
	});
</script>

<Page>
	<PageHeader title="Users" layout={LayoutUserStore} bind:show={showCreate} bind:filterString>
		<svelte:fragment slot="button">
			<UserCreate bind:show={showCreate} />
		</svelte:fragment>
	</PageHeader>

	<svelte:component this={outer}>
		{#each getFilteredUsers(filterString) as user}
			{JSON.stringify(user)}
			<svelte:component this={inner} {user} />
		{/each}
	</svelte:component>
</Page>
