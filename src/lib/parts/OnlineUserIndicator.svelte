<script lang="ts">
	import type { User } from '$lib/common/types';
	import { NodeStore } from '$lib/Stores';
	import { onMount } from 'svelte';
	import RawMdiUser from '~icons/mdi/user';

	export let user: User;

	$: color = '';

	onMount(() => {
		NodeStore.subscribe((nodes) => {
			color = nodes.some((n) => n.online && n.user.id == user.id)
				? 'text-success-600 dark:text-success-400'
				: 'text-error-500 dark:text-error-400';
			console.log(color);
		});
	});
</script>

<RawMdiUser class={color} />
