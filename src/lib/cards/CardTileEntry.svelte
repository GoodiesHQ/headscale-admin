<script lang="ts">
	export let title: string | undefined = undefined;
	export let value: any = undefined;
</script>

<div class="flex justify-between items-center mb-2 mt-2">
	{#if title !== undefined}
		<div class="flex items-center font-semibold">{title}</div>
	{/if}
	<div class="flex items-center">
		{#if value !== undefined}
			{value}
		{:else}
			<slot />
		{/if}
	</div>
</div>
