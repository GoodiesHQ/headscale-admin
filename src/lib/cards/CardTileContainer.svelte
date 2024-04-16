<script lang="ts">
	import type { MouseEventHandler } from 'svelte/elements';

	export let classes: string = '';

	export let onclick: MouseEventHandler<HTMLButtonElement> | undefined = undefined;
	$: classesFinal =
		'col-span-12 xs:col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6 xl:col-span-4 2xl:col-span-3 card ' +
		(onclick === undefined ? '' : 'card-hover ') +
		classes;
</script>

<!--button class="gap-20 {classesFinal}" on:click={onclick}>
	<slot />
</button-->

<div class="{classesFinal} mr-4 my-2">
    <button class="gap-20 w-full px-4 py-2" on:click={onclick}>
        <slot />
    </button>
</div>