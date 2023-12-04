<script lang="ts">
	import type { ItemTypeName, Named } from '$lib/common/types';
	import { getTypeName, isUser, isNode } from '$lib/common/types';
	import { fade } from 'svelte/transition';
	import CardListEntry from '../CardListEntry.svelte';
	import RawMdiRename from '~icons/mdi/rename';
	import RawMdiCheckCircleOutline from '~icons/mdi/check-circle-outline';
	import RawMdiCloseCircleOutline from '~icons/mdi/close-circle-outline';
	import { renameNode, renameUser } from '$lib/common/api';
	import { get } from 'svelte/store';
	import { UserStore, NodeStore } from '$lib/Stores';
	import { toastError, focus } from '$lib/common/funcs';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { debug } from '$lib/common/debug';

	export let item: Named;

	const prefix: ItemTypeName = getTypeName(item);

	let newName = item.givenName ?? item.name;
	let showRename = false;
	let disableRename = false;
	const fadeDuration = 200;
	const toastStore = getToastStore();
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
							on:click={async () => {
								disableRename = true;
								try {
									switch (prefix) {
										case 'user':
											if (isUser(item)) {
												const u = await renameUser(item, newName);
												const users = get(UserStore);
												for (let i = 0; i < users.length; i++) {
													if (users[i].id == u.id) {
														users[i].name = u.name;
														UserStore.set(users);
														break;
													}
												}
											}
										case 'node':
											if (isNode(item)) {
												const m = await renameNode(item, newName);
												const nodes = get(NodeStore);
												for (let i = 0; i < nodes.length; i++) {
													if (nodes[i].id == m.id) {
														nodes[i].givenName = m.givenName;
														NodeStore.set(nodes);
														break;
													}
												}
											}
									}
									showRename = false;
								} catch (error) {
									if (error instanceof Error) {
										toastError('', toastStore, error);
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
							on:click={() => {
								showRename = false;
							}}
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
					<button
						class="btn-sm btn-icon-sm"
						on:click={() => {
							newName = item.givenName ?? item.name;
							showRename = true;
						}}
					>
						<RawMdiRename />
					</button>
				</div>
			</div>
		{/if}
	</div>
</CardListEntry>
