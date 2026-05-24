<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { MouseEventHandler } from 'svelte/elements';

	type CardTileContainerProps = {
		classes?: string,
		onclick?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>,
		href?: string,
		children: Snippet,
	}
	let {
		classes = '',
		onclick = undefined,
		href = undefined,
		children,
	}: CardTileContainerProps = $props()

	const classesFinal = $derived(
		'col-span-12 xs:col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6 xl:col-span-4 2xl:col-span-3 card transition-all duration-200 ' +
		(onclick === undefined && href === undefined ? '' : 'card-hover cursor-pointer ') +
		classes
	);
</script>

<div class="{classesFinal} mr-4 my-2 overflow-hidden">
	{#if href}
		<a {href} class="block w-full h-full px-4 py-3" onclick={onclick} data-sveltekit-preload-data="hover">
			{@render children()}
		</a>
	{:else if onclick}
		<button class="block w-full h-full px-4 py-3 text-left" onclick={onclick}>
			{@render children()}
		</button>
	{:else}
		<div class="px-4 py-3">
			{@render children()}
		</div>
	{/if}
</div>