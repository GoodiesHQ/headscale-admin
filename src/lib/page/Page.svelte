<script lang="ts">
	import { fade } from 'svelte/transition';

	const time = 150;
	const optsIn = { delay: time, duration: time };
	const optsOut = { duration: time };
</script>

<div in:fade={optsIn} out:fade={optsOut}>
	<slot />
</div>
