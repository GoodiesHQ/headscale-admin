<script lang="ts">
	import { AccordionItem } from '@skeletonlabs/skeleton';
	export let id: string;
	let open = false;
</script>

<AccordionItem
	{open}
	{id}
	class="backdrop-blur-xl backdrop-brightness-100 bg-white/25 dark:bg-white/5 rounded-md"
	padding="py-4 px-4"
	regionControl="!rounded-none"
>
	<slot />
</AccordionItem>
