<script lang="ts">
	import type { Node } from '$lib/common/types';
	import RawMdiBroadcast from '~icons/mdi/broadcast';

	type OnlineNodeIndicatorProps = {
		node: Node
	}
	let {
		node = $bindable(),
	}: OnlineNodeIndicatorProps = $props()

	const color = $derived(
		node.online
		? 'text-success-600 dark:text-success-500'
		: 'text-error-600 dark:text-error-500'
	);
</script>

<RawMdiBroadcast class={color} />
