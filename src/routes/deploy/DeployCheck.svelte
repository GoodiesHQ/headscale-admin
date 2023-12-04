<script lang="ts">
	import { slide } from 'svelte/transition';

	export let name: string;
	export let checked: boolean;
</script>

<div class="flex flex-col col-span-12 md:col-span-6 xl:col-span-4 pb-4 mx-4">
	<label class="flex items-center space-x-2">
		<input class="checkbox" type="checkbox" bind:checked />
		<p>{name}</p>
	</label>
	{#if $$slots.default && checked}
		<div transition:slide class="pt-4">
			<slot />
		</div>
	{/if}
</div>
