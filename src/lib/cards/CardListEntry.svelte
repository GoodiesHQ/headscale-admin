<script lang="ts">
	import type { Snippet } from "svelte";

	type CardListEntryProps = {
		title?: string,
		value?: any,
		top?: boolean,
		titleClasses?: string,
		valueClasses?: string,
		childTitle?: Snippet,
		childBottom?: Snippet,
		children?: Snippet,
	}
	let {
		title = undefined,
		value = undefined,
		top = false,
		titleClasses = 'text-left',
		valueClasses = 'text-right',
		childTitle = undefined,
		childBottom = undefined,
		children = undefined,
	}: CardListEntryProps = $props()
</script>

<div class="grid py-0 grid-cols-12">
	<div class="grid grid-cols-12 col-span-12 justify-between {top ? 'items-top' : 'items-center'}">
		<!-- Left-aligned title -->
		<div class="grid col-span-5 {titleClasses}">
			{#if title !== undefined}
				{title}
			{:else if childTitle !== undefined}
			 	{@render childTitle()}
			{/if}
		</div>
		<!-- Right-aligned slot or value -->
		<div class="grid col-span-7 {valueClasses}">
			{#if value !== undefined}
				{value}
			{:else if children !== undefined}
				{@render children()}
			{/if}
		</div>
	</div>
	{#if childBottom}
		{@render childBottom()}
	{/if}
</div>
