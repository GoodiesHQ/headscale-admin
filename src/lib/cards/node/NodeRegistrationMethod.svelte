<script lang="ts">
	import CardListEntry from '../CardListEntry.svelte';
	import type { Node } from '$lib/common/types';

	type NodeRegistrationMethodProps = {
		node: Node,
	}

	let { node }: NodeRegistrationMethodProps = $props()
	const nodeRegMethod = $derived.by(() => {
		switch (node.registerMethod) {
			case 'REGISTER_METHOD_AUTH_KEY':
				return 'PreAuthKey';
			case 'REGISTER_METHOD_CLI':
				return 'CLI';
			case 'REGISTER_METHOD_OIDC':
				return "OIDC";
			default:
				return "Unspecified"
		}
	});
</script>

<CardListEntry title="Register Method:">
	{nodeRegMethod}
</CardListEntry>
