<script lang="ts">
	import CardListEntry from '../CardListEntry.svelte';
	import Delete from '$lib/parts/Delete.svelte';
	import type { Node } from '$lib/common/types';
	import { getTimeDifference, getTime, getTimeDifferenceColor } from '$lib/common/funcs';
	import { expireNode } from '$lib/common/api';
	import { onMount } from 'svelte';
	import { App } from '$lib/States.svelte';
	import { _ } from 'svelte-i18n';
	import RawMdiCalendarClock from '~icons/mdi/calendar-clock';
	import RawMdiContentSave from '~icons/mdi/content-save';
	import RawMdiClose from '~icons/mdi/close';

	type NodeExpiresAtProps = {
		node: Node,
		loading?: boolean,
	}

	let { node, loading = $bindable(false) }: NodeExpiresAtProps = $props()

	let diff = $state(getTimeDifference(getTime(node.expiry)));
	let editMode = $state(false);
	let newExpiry = $state('');

	onMount(() => {
		const interval = setInterval(() => {
			diff = getTimeDifference(getTime(node.expiry));
		}, 1000);

		return () => {
			clearInterval(interval);
		};
	});
</script>

<CardListEntry title={$_('cards.expires')}>
	<div class="flex flex-row items-center text-right justify-end space-x-2">
		{#if editMode}
			<input 
				id="expiry-{node.id}"
				name="expiry-{node.id}"
				type="datetime-local" 
				class="input rounded-md text-sm p-1" 
				bind:value={newExpiry} 
			/>
			<button 
				class="btn-icon btn-icon-sm variant-filled-primary" 
				title="Save"
				onclick={async () => {
					loading = true;
					try {
						// Convert local datetime to UTC/ISO for API
						const date = new Date(newExpiry).toISOString();
						App.updateValue(App.nodes, await expireNode(node, date));
						editMode = false;
					} catch (e) {
						console.error(e);
					} finally {
						loading = false;
					}
				}}
			>
				<RawMdiContentSave />
			</button>
			<button 
				class="btn-icon btn-icon-sm variant-filled-surface" 
				title="Cancel"
				onclick={() => editMode = false}
			>
				<RawMdiClose />
			</button>
		{:else}
			<span class=" {getTimeDifferenceColor(diff)} items-center">
				{diff.message}
			</span>
			<button 
				class="text-surface-500 hover:text-surface-900 dark:hover:text-surface-100" 
				title="Set Expiry"
				onclick={() => {
					editMode = true;
					// Initialize input with current expiry or now
					// If node.expiry is "0001-01-01...", it might be considered 'never' or 'expired'.
					// We'll just default to now if invalid or very old?
					// But usually we want to edit the current expiry.
					const d = node.expiry && node.expiry !== "0001-01-01T00:00:00Z" ? new Date(node.expiry) : new Date();
					// Adjust for local timezone for datetime-local input
					const offset = d.getTimezoneOffset() * 60000;
					const localISOTime = (new Date(d.getTime() - offset)).toISOString().slice(0, 16);
					newExpiry = localISOTime;
				}}
			>
				<RawMdiCalendarClock />
			</button>
			<span class="items-center">
				<Delete
					func={async () => {
						loading = true
						try{
							App.updateValue(App.nodes, await expireNode(node))
						} finally {
							loading = false
						}
					}}
				/>
			</span>
		{/if}
	</div>
</CardListEntry>