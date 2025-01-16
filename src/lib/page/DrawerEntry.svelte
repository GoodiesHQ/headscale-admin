<script lang="ts">
	import CloseBtn from '$lib/parts/CloseBtn.svelte';
	import { getDrawerStore } from '@skeletonlabs/skeleton';
	import type { Snippet } from 'svelte';

	type DrawerEntryProps = {
		title: string,
		children: Snippet,
	}
	let { title, children }: DrawerEntryProps = $props()

	const DrawerStore = getDrawerStore();
</script>

<div class="flex flex-row justify-between">
	<div class="text-3xl py-4 lg:py-8">
		{title}
	</div>
	<div>
		<CloseBtn closeable={DrawerStore} />
	</div>
</div>
{@render children()}