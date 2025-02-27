<script lang="ts">
	import CardListEntry from '../CardListEntry.svelte';
	import type { Node, Route } from '$lib/common/types';
	import { debug } from '$lib/common/debug'
	import NodeRoute from './NodeRoute.svelte';
	import ToggleOff from '~icons/mdi/toggle-switch-variant-off';
	import ToggleOn from '~icons/mdi/toggle-switch-variant';
	import { disableRoute, enableRoute } from '$lib/common/api';
	import { App } from '$lib/States.svelte';
	import type { Snippet } from 'svelte';

	type NodeRoutesProps = {
		node: Node,
		showTitle?: boolean,
		showDelete?: boolean,
		childBottom?: Snippet,
	}

	let {
		node = $bindable(),
		showTitle = true,
		showDelete = true,
		childBottom = undefined,
	}: NodeRoutesProps = $props()

	const routes = $derived.by(() => {
		return App.routes.value.filter((r) => (r.node ?? r.machine).id == node.id)
	});

	async function toggleAll(routes: Route[], state: 'on' | 'off') {
		const toggle = state === 'on' ? enableRoute : disableRoute;
		try{
			async function toggleRoute(r: Route) {
				await toggle(r);
				r.enabled = state === 'on';
				App.updateValue(App.routes, r)
			}
			const promises = routes.map(r => toggleRoute(r))
			await Promise.all(promises)
		} catch (e) {
			debug(e)
		}
	}
</script>

<CardListEntry title={showTitle ? "Routes:" : undefined} valueClasses="justify-right text-right" top>
	<div class="mb-2 flex flex-row">
		<button class="btn btn-sm items-end gap-1 px-0 ml-4 text-success-700 dark:text-success-400" onclick={() => {toggleAll(routes, 'on')}}>
			<ToggleOn />
		</button>
		<button class="btn btn-sm items-end gap-1 px-0 ml-4 text-error-600 dark:text-error-400" onclick={() => {toggleAll(routes, 'off')}}>
			<ToggleOff />
		</button>
	</div>
	{#if childBottom === undefined}
		{#each routes as _, i}
			<div class="grid grid-cols-12 col-span-12 font-thin">
				<NodeRoute bind:route={routes[i]} bind:showDelete {node} />
			</div>
		{/each}
	{:else}
		{@render childBottom()}
	{/if}
</CardListEntry>
