<script lang="ts">
	import { Accordion } from '@skeletonlabs/skeleton';
	import type { Snippet } from 'svelte';
	type CardListPageProps = {
		children: Snippet,
	}
	let { children }: CardListPageProps = $props()
</script>

<div class="flex items-center ml-0 pt-2">
	<Accordion class="w-full md:w-8/12 lg:w-9/12 xl:w-8/12 2xl:w-6/12">
		{@render children()}
	</Accordion>
</div>
