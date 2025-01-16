<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { MouseEventHandler } from 'svelte/elements';

	type CardTileContainerProps = {
		classes?: string,
		onclick?: MouseEventHandler<HTMLButtonElement>,
		children: Snippet,
	}
	let {
		classes = '',
		onclick = undefined,
		children,
	}: CardTileContainerProps = $props()

	const classesFinal = $derived(
		'col-span-12 xs:col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6 xl:col-span-4 2xl:col-span-3 card ' +
		(onclick === undefined ? '' : 'card-hover ') +
		classes
	);
</script>

<div class="{classesFinal} mr-4 my-2">
    <button class="gap-20 w-full px-4 py-2" onclick={onclick}>
		{@render children()}
    </button>
</div>