<script lang="ts">
	import CardListEntry from '../CardListEntry.svelte';
	import type { Node } from '$lib/common/types';
	import OnlineUserIndicator from '$lib/parts/OnlineUserIndicator.svelte';
	import { changeNodeOwner } from '$lib/common/api';
	import { openDrawer, toastError, toastSuccess } from '$lib/common/funcs';
	import { debug } from '$lib/common/debug';
	import { getDrawerStore, getToastStore } from '@skeletonlabs/skeleton';
	import { slide } from 'svelte/transition';

	import RawMdiSwapHorizontal from '~icons/mdi/swap-horizontal';
	import RawMdiCheckCircleOutline from '~icons/mdi/check-circle-outline';
	import RawMdiCloseCircleOutline from '~icons/mdi/close-circle-outline';

	import { App } from '$lib/States.svelte';

	type NodeOwnerProps = {
		node: Node,
	}
	let { node }: NodeOwnerProps = $props()
	
	const drawerStore = getDrawerStore();
	let transferUser = $state('');
	let showTransfer = $state(false);
	let transferring = $state(false);

	const ToastStore = getToastStore();

</script>

<CardListEntry title="Owner:" top>
	<div class="flex flex-row items-center gap-3 justify-end">
		<!--button type="button" class="btn-sm ml-0"-->
		<a
			href=" "
			onclick={() => {
				openDrawer(drawerStore, 'userDrawer-' + node.user.id, node.user);
			}}
		>
			{node.user.name}
		</a>
		<!--/button-->
		<OnlineUserIndicator user={node.user} />
		<button
			type="button"
			class="btn-sm btn-icon-sm ml-0"
			onclick={() => {
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
					{#each App.users.value.filter(u => !!u.name) as user}
						<option value={user.id}>{user.name}{!user.displayName ? '' : ` (${user.displayName})`}</option>
					{/each}
				</select>
			</label>
			<button
				type="submit"
				class="btn-sm btn-icon-sm"
				disabled={transferring || transferUser == ''}
				onclick={async () => {
					transferring = true;
					try {
						const oldUserName = node.user.name;
						const n = await changeNodeOwner(node, transferUser);
						App.updateValue(App.nodes, n);
						showTransfer = false;
						toastSuccess(
							`Changed owner of ${node.givenName} from "${oldUserName}" to "${n.user.name}"`,
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
				onclick={() => {
					showTransfer = false;
				}}
			>
				<RawMdiCloseCircleOutline />
			</button>
		</div>
	{/if}
</CardListEntry>
