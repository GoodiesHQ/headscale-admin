<script lang="ts">
	import type { Direction, OnlineStatus } from '$lib/common/types';
	import RawMdiBroadcast from '~icons/mdi/broadcast';

	type SortBtnProps = {
		value: OnlineStatus,
		name: string,
		status: OnlineStatus,
	}
	let {
		value = $bindable(),
		name,
		status,
	}: SortBtnProps = $props()

	const color = $derived(
		status === "all" ? '' :
		(status ==="online" ? 'text-success-600 dark:text-success-400' : 'text-error-500 dark:text-error-400')
	)
</script>

<button onclick={() => { if(value !== status) value = status }}>
	<span class={"flex flex-row items-center " + (value === status ? 'opacity-50' : '')}>
		<RawMdiBroadcast class={'pr-1 ' + color} />
		{name}
	</span>
</button>
