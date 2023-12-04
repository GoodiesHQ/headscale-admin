<script lang="ts">
	export let title: string;
	export let value: any = undefined;
</script>

<div class="flex justify-between items-center mb-2 mt-2">
	<div class="flex items-center font-semibold">{title}</div>
	<div class="flex items-center">
		{#if value !== undefined}
			{value}
		{:else}
			<slot />
		{/if}
	</div>
</div>
