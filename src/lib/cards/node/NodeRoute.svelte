<script lang="ts">
	import { disableRoutes, enableRoutes } from '$lib/common/api';
	import type { Node } from '$lib/common/types';

	import RawMdiToggleSwitchOn from '~icons/mdi/toggle-switch';
	import RawMdiToggleSwitchOff from '~icons/mdi/toggle-switch-off';
	// import Delete from '$lib/parts/Delete.svelte';
	import { isExpired } from '$lib/common/funcs';
	import { debug } from '$lib/common/debug';
	import { App } from '$lib/States.svelte';

	type NodeRouteProps = {
		route: string,
		node: Node,
		disable?: boolean,
		loading?: boolean,
	}
	let {
		route,
		node = $bindable(),
		disable = false,
		// showDelete = $bindable(false),
		loading = $bindable(false),
	}: NodeRouteProps = $props()

	const approved = $derived(node.approvedRoutes.includes(route));
	const available = $derived(node.availableRoutes.includes(route));
	const subnet = $derived(node.subnetRoutes.includes(route));

	// component is disabled
	const disabled = $derived(
		disable || // disabled by parent
		loading || // route status is actively being changed
		!route || // route is not advertised
		isExpired(node.expiry || '') /* || // node is expired
		!node.online; // node is not online */
	)
</script>

<div class="col-span-6 text-start items-center">
	{route}
</div>
<div class="flex flex-row col-span-6 text-end items-center justify-end">
	<button
		type="button"
		{disabled}
		class="btn {approved
			? 'text-success-700 dark:text-success-400'
			: 'text-error-600 dark:text-error-400'} my-0 py-0 mx-0 px-0 text-start text-xl"
		onclick={async () => {
			loading = true;
			try {
				if (approved) {
					await disableRoutes(node, route);
				} else {
					await enableRoutes(node, route);
				}
			} catch (error) {
				debug(error);
			} finally {
				loading = false;
			}
		}}
	>
		{#if approved}
			<RawMdiToggleSwitchOn />
		{:else}
			<RawMdiToggleSwitchOff />
		{/if}
	</button>
	<!--
	{#if showDelete}
		<Delete
			func={async () => {
				await deleteRoute(route);
			}}
		/>
	{/if}
	-->
</div>
