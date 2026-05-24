<script lang="ts">
	import type { Node } from '$lib/common/types';
	import CardListContainer from '../CardListContainer.svelte';
	import CardSeparator from '../CardSeparator.svelte';
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
	import NodeLastSeen from './NodeLastSeen.svelte';

	type NodeInfoProps = {
		node: Node,
		loading?: boolean,
	}

	let { node, loading = $bindable(false)}: NodeInfoProps = $props()

</script>

<CardListContainer>
	<ItemListName item={node} allowed={true} />
	<CardSeparator />
	<ItemCreatedAt item={node} />
	<CardSeparator />
	<NodeLastSeen {node} />
	<CardSeparator />
	<NodeOwner {node} />
	<CardSeparator />
	<NodeHostname {node} />
	<CardSeparator />
	<NodeExpiresAt {node} bind:loading />
	<CardSeparator />
	<NodeAddresses {node} />
	<CardSeparator />
	{#if node.availableRoutes.length > 0}
		<NodeRoutes {node} />
		<CardSeparator />
	{/if}
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
