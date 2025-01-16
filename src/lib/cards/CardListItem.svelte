<script lang="ts">
	import { AccordionItem } from '@skeletonlabs/skeleton';
	import type { Snippet } from 'svelte';
	type CardListItemProps = {
		id: string,
		children: Snippet,
	}

	let { id, children }: CardListItemProps = $props()
	let open = $state(false);
</script>

<AccordionItem
	{open}
	{id}
	class="backdrop-blur-xl backdrop-brightness-100 bg-white/25 dark:bg-white/5 rounded-md"
	padding="py-4 px-4"
	regionControl="!rounded-none"
>
	{@render children()}
</AccordionItem>
