<script lang="ts">
	import type { ItemTypeName, Named } from '$lib/common/types';
	import { getTypeName, isUser, isNode } from '$lib/common/types';
	import { fade } from 'svelte/transition';
	import CardListEntry from '../CardListEntry.svelte';
	import RawMdiRename from '~icons/mdi/rename';
	import RawMdiCheckCircleOutline from '~icons/mdi/check-circle-outline';
	import RawMdiCloseCircleOutline from '~icons/mdi/close-circle-outline';
	import { renameNode, renameUser } from '$lib/common/api';
	import { toastError, focus } from '$lib/common/funcs';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { debug } from '$lib/common/debug';
	import { App } from '$lib/States.svelte';

	type ItemListNameProps = {
		item: Named,
		allowed?: boolean,
	}

	let {
		item = $bindable(),
		allowed = false,
	}: ItemListNameProps = $props()

	const prefix: ItemTypeName = getTypeName(item);

	let newName = $state(item.givenName ?? item.name);
	let showRename = $state(false);
	let disableRename = $state(false);

	const fadeDuration = 200;
	const ToastStore = getToastStore();
</script>

<CardListEntry title="Name:">
	<div class="grid text-right overlap-children">
		{#if showRename}
			<div
				in:fade={{ delay: fadeDuration + 50, duration: fadeDuration }}
				out:fade={{ duration: fadeDuration }}
			>
				<form>
					<div class="flex">
						<input
							id={`rename-${prefix}-${item.id}`}
							class="input text-sm rounded-md py-0 pr-2"
							bind:value={newName}
							disabled={disableRename}
							use:focus
						/>
						<button
							type="submit"
							class="btn-sm btn-icon-sm"
							disabled={disableRename}
							onclick={async (event?: Event) => {
								event?.preventDefault();
								disableRename = true;
								try {
									switch (prefix) {
										case 'user':
											if(newName === ''){
												toastError('User name must not be empty', ToastStore)
												return
											}
											if (isUser(item)) {
												const oldName = item.name
												const u = await renameUser(item, newName);
												for (let i = 0; i < App.users.value.length; i++) {
													if (App.users.value[i].id == u.id) {
														App.users.value[i].name = u.name;
														break;
													}
												}
												for (let i = 0; i < App.preAuthKeys.value.length; i++) {
													if (App.preAuthKeys.value[i].user.name === oldName) {
														App.preAuthKeys.value[i].user.name = u.name;
														break;
													}
												}
											}
										case 'node':
											if(newName === ''){
												toastError('Node name must not be empty', ToastStore)
												return
											}
											if (isNode(item)) {
												const m = await renameNode(item, newName);
												for (let i = 0; i < App.nodes.value.length; i++) {
													if (App.nodes.value[i].id == m.id) {
														App.nodes.value[i].givenName = m.givenName;
														break;
													}
												}
											}
									}
									showRename = false;
								} catch (error) {
									if (error instanceof Error) {
										toastError('', ToastStore, error);
									} else {
										debug(error);
									}
									focus(document.getElementById(`rename-${prefix}-${item.id}`));
								} finally {
									disableRename = false;
								}
							}}
						>
							<RawMdiCheckCircleOutline />
						</button>
						<button
							type="button"
							class="btn-sm btn-icon-sm"
							disabled={disableRename}
							onclick={() => { showRename = false; }}
						>
							<RawMdiCloseCircleOutline />
						</button>
					</div>
				</form>
			</div>
		{:else}
			<div
				in:fade={{ delay: fadeDuration + 50, duration: fadeDuration }}
				out:fade={{ duration: fadeDuration }}
			>
				<div>
					{item.givenName ?? item.name}
					{#if allowed}
					<button
						class="btn-sm btn-icon-sm"
						onclick={() => {
							newName = item.givenName ?? item.name;
							showRename = true;
						}}
					>
						<RawMdiRename />
					</button>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</CardListEntry>
