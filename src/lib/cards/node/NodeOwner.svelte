<script lang="ts">
	import CardListEntry from '../CardListEntry.svelte';
	import type { Node } from '$lib/common/types';
	import OnlineUserIndicator from '$lib/parts/OnlineUserIndicator.svelte';
	import RawMdiSwapHorizontal from '~icons/mdi/swap-horizontal';
	import RawMdiCheckCircleOutline from '~icons/mdi/check-circle-outline';
	import RawMdiCloseCircleOutline from '~icons/mdi/close-circle-outline';
	import { changeNodeOwner } from '$lib/common/api';
	import { toastError, toastSuccess } from '$lib/common/funcs';
	import { debug } from '$lib/common/debug';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { slide } from 'svelte/transition';
	import { get } from 'svelte/store';
	import { NodeStore, UserStore, updateStoreItem } from '$lib/Stores';
	import { onMount } from 'svelte';

	export let node: Node;
	$: users = get(UserStore);
	let transferUser: string = '';
	let showTransfer = false;
	let transferring = false;

	const ToastStore = getToastStore();

	onMount(() => {
		const unsubUserStore = UserStore.subscribe((us) => (users = us));
		return () => {
			unsubUserStore();
		};
	});
</script>

<CardListEntry title="Owner:" top>
	<div class="flex flex-row items-center gap-3 justify-end">
		{node.user.name}
		<OnlineUserIndicator user={node.user} />
		<button
			type="button"
			class="btn-sm btn-icon-sm ml-0"
			on:click={() => {
				showTransfer = !showTransfer;
			}}
		>
			<RawMdiSwapHorizontal />
		</button>
	</div>
	{#if showTransfer}
		<div class="flex flex-row items-center justify-end pt-5" transition:slide>
			<span class="pr-3">New Owner:</span>
			<label class="label">
				<select class="select" bind:value={transferUser}>
					{#each users as user}
						<option value={user.name}>{user.name}</option>
					{/each}
				</select>
			</label>
			<button
				type="submit"
				class="btn-sm btn-icon-sm"
				disabled={transferring || transferUser == ''}
				on:click={async () => {
					transferring = true;
					try {
						const n = await changeNodeOwner(node, transferUser);
						updateStoreItem(NodeStore, n);
						showTransfer = false;
						toastSuccess(
							`Changed owner of ${node.givenName} from "${node.user.name}" to "${n.user.name}"`,
							ToastStore,
						);
					} catch (error) {
						if (error instanceof Error) {
							toastError('', ToastStore, error);
						} else {
							debug(error);
						}
					} finally {
						transferring = false;
					}
				}}
			>
				<RawMdiCheckCircleOutline />
			</button>
			<button
				type="button"
				class="btn-sm btn-icon-sm"
				on:click={() => {
					showTransfer = false;
				}}
			>
				<RawMdiCloseCircleOutline />
			</button>
		</div>
	{/if}
</CardListEntry>
