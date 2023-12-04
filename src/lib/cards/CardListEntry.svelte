<script lang="ts">
	export let title: string;
	export let value: any = undefined;
	export let top: boolean = false;
	export let titleClasses = 'text-left';
	export let valueClasses = 'text-right';
</script>

<div class="grid py-0 grid-cols-12">
	<div class="grid grid-cols-12 col-span-12 justify-between {top ? 'items-top' : 'items-center'}">
		<!-- Left-aligned title -->
		<div class="grid col-span-5 {titleClasses}">
			{title}
		</div>
		<!-- Right-aligned slot or value -->
		<div class="grid col-span-7 {valueClasses}">
			{#if value !== undefined}
				{value}
			{:else}
				<slot />
			{/if}
		</div>
	</div>
	<slot name="bottom" />
</div>
