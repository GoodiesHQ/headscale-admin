<script lang="ts">
	import type { MouseEventHandler } from 'svelte/elements';

	export let classes: string = '';

	$: classesFinal =
		'col-span-12 xs:col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6 xl:col-span-4 2xl:col-span-3 card card-hover py-2 my-2 mr-4 px-5 ' +
		classes;

	export let onclick: MouseEventHandler<HTMLButtonElement> | undefined = undefined;
</script>

<button class=" gap-20 {classesFinal}" on:click={onclick}>
	<slot />
</button>
