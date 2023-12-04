<script lang="ts">
	import CardListEntry from '../CardListEntry.svelte';
	import type { Node } from '$lib/common/types';

	export let node: Node;

	$: getRegMethod = (n: Node): string => {
		if (n.registerMethod == 'REGISTER_METHOD_AUTH_KEY') {
			return 'Auth Key';
		}
		if (n.registerMethod == 'REGISTER_METHOD_CLI') {
			return 'CLI';
		}
		if (n.registerMethod == 'REGISTER_METHOD_OIDC') {
			return 'OIDC';
		}
		return 'Unspecified';
	};
</script>

<CardListEntry title="Register Method:">
	{getRegMethod(node)}
</CardListEntry>
