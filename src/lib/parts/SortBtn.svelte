<script lang="ts">
	import type { Direction } from '$lib/common/types';
	import RawMdiArrowUpThin from '~icons/mdi/arrow-up-thin';
	import RawMdiArrowDownThin from '~icons/mdi/arrow-down-thin';

	type SortBtnProps = {
		value: string,
		name: string,
		direction: Direction,
		toggle: (_: string) => void,
	}
	let {
		value = $bindable(),
		name,
		direction,
		toggle,
	}: SortBtnProps = $props()
</script>

<button onclick={() => toggle(name.toLowerCase())}>
	<span class={value.toLowerCase() === name.toLowerCase() ? '' : 'invisible'}>
		{#if direction === 'up'}
			<RawMdiArrowUpThin />
		{:else}
			<RawMdiArrowDownThin />
		{/if}
	</span>
	{name}
</button>
