<script lang="ts">
	import { deleteRoute, disableRoute, enableRoute } from '$lib/common/api';
	import type { Route } from '$lib/common/types';
	import { SlideToggle } from '@skeletonlabs/skeleton';

	import RawMdiDelete from '~icons/mdi/delete';
	import RawMdiToggleSwitchOn from '~icons/mdi/toggle-switch';
	import RawMdiToggleSwitchOff from '~icons/mdi/toggle-switch-off';
	import RawMdiCheckCircleOutline from '~icons/mdi/check-circle-outline';
	import RawMdiCloseCircleOutline from '~icons/mdi/close-circle-outline';
	import Delete from '$lib/parts/Delete.svelte';
	import { onMount } from 'svelte';
	import { RouteStore, updateStoreItem } from '$lib/Stores';
	import { isExpired } from '$lib/common/funcs';
	import { debug } from '$lib/common/debug';

	export let route: Route;

	$: enabled = route.enabled;

	$: loading = false;

	// component is disabled
	$: disabled =
		loading ||
		!route.advertised || // route is not advertised
		isExpired(route.node ?? route.machine) || // node is expired
		!(route.node ?? route.machine).online; // node is not online
</script>

<div class="col-span-6 text-start items-center">
	{route.prefix}
	{#if route.advertised === false}
		<span class="font-thin">(not advertised)</span>
	{/if}
</div>
<div class="flex flex-row col-span-6 text-end items-center justify-end">
	<button
		type="button"
		{disabled}
		class="btn {enabled
			? 'text-success-700 dark:text-success-400'
			: 'text-error-600 dark:text-error-400'} my-0 py-0 text-start text-xl"
		on:click={async () => {
			loading = true;
			try {
				if (enabled) {
					await disableRoute(route);
					route.enabled = false;
					updateStoreItem(RouteStore, route);
				} else {
					await enableRoute(route);
					route.enabled = true;
					updateStoreItem(RouteStore, route);
				}
			} catch (error) {
				debug(error);
			} finally {
				loading = false;
			}
		}}
	>
		{#if enabled}
			<RawMdiToggleSwitchOn />
		{:else}
			<RawMdiToggleSwitchOff />
		{/if}
	</button>
	<Delete
		func={async () => {
			await deleteRoute(route);
		}}
	/>
	<!--
	{#if confirmDelete}
		<button
			type="button"
			class="text-success-400 my-0 py-0 text-start text-xl"
			on:click={async () => {
				await deleteRoute(route);
			}}
		>
			<RawMdiCheckCircleOutline />
		</button>
		<button
			type="button"
			class="text-error-400 my-0 py-0 text-start text-xl"
			on:click={async () => {
				confirmDelete = false;
			}}
		>
			<RawMdiCloseCircleOutline />
		</button>
	{:else}
		<button
			type="button"
			class="btn text-error-400 my-0 py-0 text-start text-xl"
			on:click={async () => {
				confirmDelete = true;
			}}
		>
			<RawMdiDelete />
		</button>
	{/if}
    -->
</div>
