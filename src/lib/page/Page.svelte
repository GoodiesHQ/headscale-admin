<script lang="ts">
	import { fade } from 'svelte/transition';

	const time = 150;
	const optsIn = { delay: time, duration: time };
	const optsOut = { duration: time };
	export let classes: string = ""
</script>

<div in:fade={optsIn} out:fade={optsOut} class="{classes}">
	<slot />
</div>
