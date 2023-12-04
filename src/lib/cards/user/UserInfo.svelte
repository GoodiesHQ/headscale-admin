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
	<ItemListName item={user} />
	<CardSeparator />
	<ItemCreatedAt item={user} />
	<CardSeparator />
	<UserListNodes {user} />
	<CardSeparator />
	<UserListPreAuthKeys {user} />
	<CardSeparator />
	<ItemDelete item={user} />
</CardListContainer>
