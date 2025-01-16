<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade } from 'svelte/transition';

	type PageProps = {
		classes?: string,
		children: Snippet,
	}
	let { classes = '', children }: PageProps = $props()

	const time = 150;
	const optsIn = { delay: time, duration: time };
	const optsOut = { duration: time };
</script>

<div in:fade={optsIn} out:fade={optsOut} class={classes}>
	{@render children()}
</div>
