<script lang="ts">
	import type { User } from '$lib/common/types';
	import { NodeStore } from '$lib/Stores';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import RawMdiUser from '~icons/mdi/user';

	export let user: User;
	$: nodes = get(NodeStore);

	onMount(() => {
		const unsubNodeStore = NodeStore.subscribe((ns) => (nodes = ns));
		return () => {
			unsubNodeStore();
		};
	});
</script>

<RawMdiUser
	class={nodes.some((n) => n.online && n.user.id == user.id)
		? 'text-success-600 dark:text-success-400'
		: 'text-error-500 dark:text-error-400'}
/>
