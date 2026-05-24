<script lang="ts">
	import CardListPage from '$lib/cards/CardListPage.svelte';
	import UserCreate from '$lib/cards/user/UserCreate.svelte';
	import UserListCard from '$lib/cards/user/UserListCard.svelte';
	import UserTileCard from '$lib/cards/user/UserTileCard.svelte';
	import CardTilePage from '$lib/cards/CardTilePage.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';
	import ExportModal from '$lib/parts/ExportModal.svelte';

	import Page from '$lib/page/Page.svelte';
	import type { User, Direction, OnlineStatus } from '$lib/common/types';
	import SortBtn from '$lib/parts/SortBtn.svelte';
	import { App } from '$lib/States.svelte';
	import { getSortedFilteredUsers } from '$lib/common/funcs';
	import FilterOnlineBtn from '$lib/parts/FilterOnlineBtn.svelte';
	import { _ } from 'svelte-i18n';
	
	// icons
	import RawMdiDownload from '~icons/mdi/download';

	let showCreate = $state(false);
	let showExport = $state(false);
	const layout = $derived(App.layoutUser.value)

	// Sort & Filter
	let sortMethod = $state('id');
	let sortDirection = $state<Direction>('up');
	let filterOnlineStatus = $state<OnlineStatus>('all');
	let filterString = $state('');
	
	const usersSortedFiltered = $derived(
		getSortedFilteredUsers(App.users.value, filterString, sortMethod, sortDirection, filterOnlineStatus)
	)

	const Outer = $derived(layout == 'list' ? CardListPage : CardTilePage);
	const Inner = $derived(layout == 'list' ? UserListCard : UserTileCard);

	function toggle(method: string) {
		if (method != sortMethod) {
			sortMethod = method;
			sortDirection = 'up';
		} else {
			sortDirection = sortDirection === 'up' ? 'down' : 'up';
		}
	}
</script>

<Page>
	<PageHeader title={$_('navigation.users')} layout={App.layoutUser} bind:show={showCreate} bind:filterString buttonText={$_('common.createUser')}>
		{#snippet button()}
			<UserCreate bind:show={showCreate} />
		{/snippet}
	</PageHeader>

	<div class="flex flex-wrap items-center gap-2 mb-4">
		<div
			class="btn-group px-0 mx-0 py-0 my-0 rounded-md variant-ghost-secondary [&>*+*]:border-primary-500"
		>
			<SortBtn bind:value={sortMethod} direction={sortDirection} name={$_('common.id')} {toggle} />
			<SortBtn bind:value={sortMethod} direction={sortDirection} name={$_('common.name')} {toggle} />
		</div>
		<div
			class="btn-group px-0 mx-0 py-0 my-0 rounded-md variant-ghost-secondary [&>*+*]:border-primary-500"
		>
			<FilterOnlineBtn bind:value={filterOnlineStatus} status="all" name={$_('common.all')} />
			<FilterOnlineBtn bind:value={filterOnlineStatus} status="online" name={$_('common.online')} />
			<FilterOnlineBtn bind:value={filterOnlineStatus} status="offline" name={$_('common.offline')} />
		</div>
		
		<button
			type="button"
			class="btn btn-sm variant-ghost-primary rounded-md"
			onclick={() => showExport = true}
		>
			<RawMdiDownload class="w-4 h-4 mr-1" />
			{$_('common.export')}
		</button>
	</div>

	<Outer>
	
	<ExportModal bind:show={showExport} />
		{#each usersSortedFiltered as user}
			<Inner {user}></Inner>
		{/each}
	</Outer>
	<!--svelte:component this={outer}>
		{#each getSortedUsers(filteredUsers, sortMethod, sortDirection) as user}
			<svelte:component this={inner} {user} />
		{/each}
	</svelte:component-->
</Page>
