<script lang="ts">
	import type { Node } from '$lib/common/types';
	import RawMdiBroadcast from '~icons/mdi/broadcast';
	// import RawMdiDevices from '~icons/mdi/devices';

	export let node: Node;

	$: color = node.online
		? 'text-success-600 dark:text-success-400'
		: 'text-error-500 dark:text-error-400';
</script>

<RawMdiBroadcast class={color} />
