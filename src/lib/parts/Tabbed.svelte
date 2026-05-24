<script lang="ts">
	import { Tab } from "@skeletonlabs/skeleton";
	import type { Component } from "svelte";
	import { _ } from 'svelte-i18n';

    let {
        tabs,
        tabSet = $bindable(),
    }: {
        tabs: {name: string, title?: string, titleKey?: string, logo: Component}[],
        tabSet: number,
    } = $props()
</script>
<div class="flex text-center">
    {#each tabs as tab, i}
        <Tab
            bind:group={tabSet}
            name={tab.name}
            value={i}
            padding="px-2 py-2 md:px-4 md:pt-4 lg:px-6 xl:px-8"
        >
            <svelte:fragment slot="lead">
                <span class="flex flex-row items-center justify-center">
                    <tab.logo />
                </span>
            </svelte:fragment>
            <span class={tabSet === i ? '' : 'hidden md:inline'}>
                {tab.titleKey ? $_(tab.titleKey) : tab.title}
            </span>
        </Tab>
    {/each}
</div>