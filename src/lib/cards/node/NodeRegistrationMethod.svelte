<script lang="ts">
	import CardListEntry from '../CardListEntry.svelte';
	import type { Node } from '$lib/common/types';
	import { _ } from 'svelte-i18n';

	type NodeRegistrationMethodProps = {
		node: Node,
	}

	let { node }: NodeRegistrationMethodProps = $props()
	const nodeRegMethod = $derived.by(() => {
		switch (node.registerMethod) {
			case 'REGISTER_METHOD_AUTH_KEY':
				return $_('cards.preAuthKey');
			case 'REGISTER_METHOD_CLI':
				return $_('cards.cli');
			case 'REGISTER_METHOD_OIDC':
				return $_('cards.oidc');
			default:
				return $_('cards.unspecified')
		}
	});
</script>

<CardListEntry title={$_('cards.registerMethod')}>
	{nodeRegMethod}
</CardListEntry>
