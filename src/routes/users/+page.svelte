<script lang="ts">
	import CardListPage from '$lib/cards/CardListPage.svelte';
	import UserCreate from '$lib/cards/user/UserCreate.svelte';
	import UserListCard from '$lib/cards/user/UserListCard.svelte';
	import UserTileCard from '$lib/cards/user/UserTileCard.svelte';
	import CardTilePage from '$lib/cards/CardTilePage.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';

	import Page from '$lib/page/Page.svelte';
	import type { User, Direction } from '$lib/common/types';
	import SortBtn from '$lib/parts/SortBtn.svelte';
	import { App } from '$lib/States.svelte';

	let showCreate = $state(false);
	const layout = $derived(App.layoutUser.value)

	// Sort & Filter
	let filterString = $state('');
	const filteredUsers = $derived(getFilteredUsers(App.users.value, filterString)); // react on users or filterString change
	let sortMethod = $state('id');
	let sortDirection = $state<Direction>('up');

	const Outer = $derived(layout == 'list' ? CardListPage : CardTilePage);
	const Inner = $derived(layout == 'list' ? UserListCard : UserTileCard);

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
</script>

<Page>
	<PageHeader title="Users" layout={App.layoutUser} bind:show={showCreate} bind:filterString>
		{#snippet button()}
			<UserCreate bind:show={showCreate} />
		{/snippet}
	</PageHeader>

	<div
		class="btn-group px-0 mx-0 py-0 my-0 rounded-md variant-ghost-secondary [&>*+*]:border-primary-500"
	>
		<SortBtn bind:value={sortMethod} direction={sortDirection} name="ID" {toggle} />
		<SortBtn bind:value={sortMethod} direction={sortDirection} name="Name" {toggle} />
	</div>

	<Outer>
		{#each getSortedUsers(filteredUsers, sortMethod, sortDirection) as user}
			<Inner {user}></Inner>
		{/each}
	</Outer>
	<!--svelte:component this={outer}>
		{#each getSortedUsers(filteredUsers, sortMethod, sortDirection) as user}
			<svelte:component this={inner} {user} />
		{/each}
	</svelte:component-->
</Page>
