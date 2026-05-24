<script lang="ts">
	import type { Snippet } from "svelte";

	type CardTitlePageProps = {
		children: Snippet,
	}
	let { children }: CardTitlePageProps = $props()
</script>
<div class="flex items-center my-1">
	<div class="grid grid-cols-12 w-full">
		{@render children()}
	</div>
</div>
