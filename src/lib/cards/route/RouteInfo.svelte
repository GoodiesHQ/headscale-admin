<script lang="ts">
	import CardListContainer from '../CardListContainer.svelte';
	import type { Node } from '$lib/common/types';
	import NodeRoutes from '../node/NodeRoutes.svelte';

	export let node: Node;
</script>

<CardListContainer>
	<NodeRoutes showTitle={true} showDelete={false} bind:node />
</CardListContainer>
