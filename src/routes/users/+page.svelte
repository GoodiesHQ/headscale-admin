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
	import type { User, Direction } from '$lib/common/types';
	import SortBtn from '$lib/parts/SortBtn.svelte';

	$: layout = get(LayoutUserStore);
	$: showCreate = false;
	$: users = get(UserStore);

	// Sort & Filter
	$: filterString = '';
	$: filteredUsers = getFilteredUsers(users, filterString); // react on users or filterString change
	$: sortMethod = 'id';
	$: sortDirection = 'up' as Direction;

	$: outer = layout == 'list' ? CardListPage : CardTilePage;
	$: inner = layout == 'list' ? UserListCard : UserTileCard;

	function filter(user: User, filterString: string): boolean {
		try {
			if (filterString === '') {
				return true;
			}
			// use filterString as regex if people want it
			const r = RegExp(filterString);
			return r.test(user.name) || r.test(user.name.toLowerCase());
		} catch (error) {
			return true;
		}
	}

	function getSortedUsers(users: User[], sortMethod: string, sortDirection: Direction): User[] {
		if (sortMethod === 'id') {
			users = users.sort((a: User, b: User) => {
				const aid = parseInt(a.id);
				const bid = parseInt(b.id);
				if (aid < bid) {
					return -1;
				}
				if (aid > bid) {
					return 1;
				}
				return 0;
			});
		}
		if (sortMethod === 'name') {
			users = users.sort((a: User, b: User) => {
				if (a.name < b.name) {
					return -1;
				}
				if (a.name > b.name) {
					return 1;
				}
				return 0;
			});
		}
		if (sortDirection === 'down') {
			return users.reverse();
		}
		return users;
	}

	function toggle(method: string) {
		if (method != sortMethod) {
			sortMethod = method;
			sortDirection = 'up';
		} else {
			sortDirection = sortDirection === 'up' ? 'down' : 'up';
		}
	}

	function getFilteredUsers(users: User[], filterString: string): User[] {
		return users.filter((user) => filter(user, filterString));
	}

	onMount(() => {
		const unsubUserStore = UserStore.subscribe((us) => {
			users = us;
		});
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

	<div
		class="btn-group px-0 mx-0 py-0 my-0 rounded-md variant-ghost-secondary [&>*+*]:border-primary-500"
	>
		<SortBtn bind:value={sortMethod} direction={sortDirection} name="ID" {toggle} />
		<SortBtn bind:value={sortMethod} direction={sortDirection} name="Name" {toggle} />
	</div>

	<svelte:component this={outer}>
		{#each getSortedUsers(filteredUsers, sortMethod, sortDirection) as user}
			<svelte:component this={inner} {user} />
		{/each}
	</svelte:component>
</Page>
