<script lang="ts">
	import type { Direction } from '$lib/common/types';
	import RawMdiArrowUpThin from '~icons/mdi/arrow-up-thin';
	import RawMdiArrowDownThin from '~icons/mdi/arrow-down-thin';

	export let value: string;
	export let name: string;
	export let direction: Direction;
	export let toggle: (_: string) => void;
</script>

<button on:click={() => toggle(name.toLowerCase())}>
	<span class={value.toLowerCase() === name.toLowerCase() ? '' : 'invisible'}>
		<svelte:component this={direction === 'up' ? RawMdiArrowUpThin : RawMdiArrowDownThin} />
	</span>
	{name}
</button>
