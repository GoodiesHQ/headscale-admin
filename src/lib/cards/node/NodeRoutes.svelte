<script lang="ts">
	import CardListEntry from '../CardListEntry.svelte';
	import type { Node } from '$lib/common/types';
	import { debug } from '$lib/common/debug'
	import NodeRoute from './NodeRoute.svelte';
	import { _ } from 'svelte-i18n';
	import ToggleOff from '~icons/mdi/toggle-switch-variant-off';
	import ToggleOn from '~icons/mdi/toggle-switch-variant';
	import { disableRoutes, enableRoutes } from '$lib/common/api';
	import { App } from '$lib/States.svelte';
	import type { Snippet } from 'svelte';

	type NodeRoutesProps = {
		node: Node,
		showTitle?: boolean,
		childBottom?: Snippet,
	}

	let {
		node = $bindable(),
		showTitle = true,
		childBottom = undefined,
	}: NodeRoutesProps = $props()

	let loading = $state(false);

</script>

<CardListEntry title={showTitle ? $_('cards.routes') : undefined} valueClasses="justify-right text-right" top>
	{#if node.availableRoutes.length > 0}
		<div class="mb-2 flex flex-row">
			<button
				title={$_('common.enableAll')}
				class="btn btn-sm items-end gap-1 px-0 ml-4 text-success-700 dark:text-success-400"
				disabled={loading}
				onclick={async () => {
					loading = true
					try {
						await enableRoutes(node, ...node.availableRoutes);
					} catch (error) {
						debug(error);
					} finally {
						loading = false;
					}
				}}
			>
				<ToggleOn />
			</button>
			<button
				title={$_('common.disableAll')}
				class="btn btn-sm items-end gap-1 px-0 ml-4 text-error-600 dark:text-error-400"
				disabled={loading}
				onclick={async () => {
					loading = true
					try {
						await disableRoutes(node, ...node.availableRoutes);
					} catch (error) {
						debug(error);
					} finally {
						loading = false;
					}
				}}
			>
				<ToggleOff />
			</button>
		</div>
	{/if}
	{#if childBottom === undefined}
		{#each node.availableRoutes as route}
			<div class="grid grid-cols-12 col-span-12 font-thin">
				<NodeRoute {route} disable={loading} {node} />
			</div>
		{/each}
	{:else}
		{@render childBottom()}
	{/if}
</CardListEntry>
