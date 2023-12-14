<script lang="ts">
	import CardListContainer from '../CardListContainer.svelte';
	import CardSeparator from '../CardSeparator.svelte';
	import UserListPreAuthKeys from './UserListPreAuthKeys.svelte';
	import UserListNodes from './UserListNodes.svelte';
	import type { User } from '$lib/common/types';
	import ItemCreatedAt from '../common/ItemCreatedAt.svelte';
	import ItemListName from '../common/ItemListName.svelte';
	import ItemDelete from '../common/ItemDelete.svelte';

	export let user: User;
</script>

<CardListContainer>
	<ItemListName bind:item={user} />
	<CardSeparator />
	<ItemCreatedAt bind:item={user} />
	<CardSeparator />
	<UserListNodes bind:user />
	<CardSeparator />
	<UserListPreAuthKeys bind:user />
	<CardSeparator />
	<ItemDelete bind:item={user} />
</CardListContainer>
