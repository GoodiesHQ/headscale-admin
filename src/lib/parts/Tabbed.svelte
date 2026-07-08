<script lang="ts">
	import { Tab } from '@skeletonlabs/skeleton';
	import type { Component } from 'svelte';
	import { _ } from 'svelte-i18n';

	let {
		tabs,
		tabSet = $bindable(),
		mobileLayout = 'compact',
	}: {
		tabs: { name: string; title?: string; titleKey?: string; logo: Component }[];
		tabSet: number;
		mobileLayout?: 'compact' | 'scroll';
	} = $props();

	const scrollable = $derived(mobileLayout === 'scroll');
	const rootClasses = $derived(
		scrollable ? 'flex min-w-max gap-1 text-center' : 'flex text-center',
	);
	const tabClasses = $derived(scrollable ? 'shrink-0 whitespace-nowrap' : '');
	const tabPadding = $derived(
		scrollable
			? 'px-3 py-2 md:px-4 md:pt-4 lg:px-6 xl:px-8'
			: 'px-2 py-2 md:px-4 md:pt-4 lg:px-6 xl:px-8',
	);
</script>

<div class={rootClasses}>
	{#each tabs as tab, i (tab.name)}
		{@const label = tab.titleKey ? $_(tab.titleKey) : (tab.title ?? tab.name)}
		<Tab
			bind:group={tabSet}
			name={tab.name}
			value={i}
			title={label}
			padding={tabPadding}
			class={tabClasses}
		>
			<svelte:fragment slot="lead">
				<span class="flex flex-row items-center justify-center">
					<tab.logo />
				</span>
			</svelte:fragment>
			<span class={tabSet === i ? '' : 'hidden md:inline'}>
				{label}
			</span>
		</Tab>
	{/each}
</div>
