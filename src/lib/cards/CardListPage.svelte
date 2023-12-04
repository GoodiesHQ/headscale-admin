<script lang="ts">
	import { Accordion } from '@skeletonlabs/skeleton';
</script>

<div class="flex items-center mr-2">
	<Accordion class="w-full md:w-8/12 lg:w-9/12 xl:w-8/12 2xl:w-6/12">
		<slot />
	</Accordion>
</div>
