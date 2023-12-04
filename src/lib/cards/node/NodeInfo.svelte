<script lang="ts">
	import CardListContainer from '../CardListContainer.svelte';
	import CardSeparator from '../CardSeparator.svelte';
	import type { Node } from '$lib/common/types';
	import ItemCreatedAt from '../common/ItemCreatedAt.svelte';
	import ItemListName from '../common/ItemListName.svelte';
	import NodeHostname from './NodeHostname.svelte';
	import NodeAddresses from './NodeAddresses.svelte';
	import NodeRoutes from './NodeRoutes.svelte';
	import NodeTags from './NodeTags.svelte';
	import NodeRegistrationMethod from './NodeRegistrationMethod.svelte';
	import NodeExpiresAt from './NodeExpiresAt.svelte';
	import ItemDelete from '../common/ItemDelete.svelte';
	import NodeOwner from './NodeOwner.svelte';

	export let node: Node;
</script>

<CardListContainer>
	<ItemListName item={node} />
	<CardSeparator />
	<ItemCreatedAt item={node} />
	<CardSeparator />
	<NodeOwner {node} />
	<CardSeparator />
	<NodeHostname {node} />
	<CardSeparator />
	<NodeExpiresAt {node} />
	<CardSeparator />
	<NodeAddresses {node} />
	<CardSeparator />
	<NodeRoutes {node} />
	<CardSeparator />
	<NodeRegistrationMethod {node} />
	<CardSeparator />
	<NodeTags {node} />
	<CardSeparator />
	<ItemDelete item={node} />

	<!--UserListName {node} />
	<CardSeparator />
	<UserListCreated {node} />
	<CardSeparator />
	<UserListNodes {node} />
	<CardSeparator />
	<UserListPreAuthKeys {node} />
	<CardSeparator />
	<UserListDelete {node} /-->
</CardListContainer>
