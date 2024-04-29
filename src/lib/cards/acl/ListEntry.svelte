<script lang="ts">
	import { AccordionItem, getToastStore } from '@skeletonlabs/skeleton';

    export let id: string;
    export let name: string;
    export let nameClasses: string  = "grid"
    export let logo: ConstructorOfATypedSvelteComponent;
    export let logoClasses: string = ""
    export let open: boolean = false;
</script>

<AccordionItem
	bind:open
	id={id}
	class="backdrop-brightness-100 bg-white/25 dark:bg-white/5 rounded-md"
	padding="py-4 px-4"
	regionControl="!rounded-none"
>
	<svelte:fragment slot="lead">
		<span class="{logoClasses}">
            <svelte:component this={logo}/>;
		</span>
	</svelte:fragment>
	<svelte:fragment slot="summary">
		<div class="{nameClasses}">
			{name}
		</div>
	</svelte:fragment>
	<svelte:fragment slot="content">
        <slot />
    </svelte:fragment>
</AccordionItem>