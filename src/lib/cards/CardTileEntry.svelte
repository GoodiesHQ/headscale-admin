<script lang="ts">
	import type { Snippet } from "svelte";

	type CardTileEntryProps = {
		title?: string,
		value?: any,
		children?: Snippet,
	}

	let {
		title = undefined,
		value = undefined,
		children = undefined,
	}: CardTileEntryProps = $props();
</script>

<div class="flex justify-between items-center mb-2 mt-2">
	{#if title !== undefined}
		<div class="flex items-center font-semibold">{title}</div>
	{/if}
	<div class="flex items-center">
		{#if value !== undefined}
			{value}
		{:else if children !== undefined}
			{@render children()}
		{/if}
	</div>
</div>
