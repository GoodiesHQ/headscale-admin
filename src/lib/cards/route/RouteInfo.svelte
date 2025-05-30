<script lang="ts">
	import CardListContainer from '../CardListContainer.svelte';
	import type { Node } from '$lib/common/types';
	import NodeRoutes from '../node/NodeRoutes.svelte';

	type RouteInfoProps = {
		node: Node,
	}

	let { node = $bindable() }: RouteInfoProps = $props();
</script>

<CardListContainer>
	<NodeRoutes showTitle={true} bind:node />
</CardListContainer>
