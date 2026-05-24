<script lang="ts">
	import type { User } from '$lib/common/types';
	import RawMdiUser from '~icons/mdi/user';
	import { App } from '$lib/States.svelte';

	type OnlineUserIndicatorProps = {
		user: User,
	}

	let {
		user = $bindable(),
	}: OnlineUserIndicatorProps = $props()

	const color = $derived(
		App.nodes.value.some((n) => n.online && n.user.id == user.id)
		? 'text-success-600 dark:text-success-500'
		: 'text-error-600 dark:text-error-500'
	)
</script>

<RawMdiUser class={color} />
