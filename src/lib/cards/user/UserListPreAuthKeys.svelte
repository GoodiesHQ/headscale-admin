<script lang="ts">
	import CardListEntry from '../CardListEntry.svelte';
	// import CardSeparator from '../CardSeparator.svelte';
	import RawMdiCheckCircleOutline from '~icons/mdi/check-circle-outline';
	import RawMdiCloseCircleOutline from '~icons/mdi/close-circle-outline';
	import UserListPreAuthKey from '$lib/cards/user/UserListPreAuthKey.svelte';
	import { PreAuthKeyStore, appendStoreItem } from '$lib/Stores';
	import { get } from 'svelte/store';
	import type { PreAuthKey, User } from '$lib/common/types';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { createPreAuthKey } from '$lib/common/api';
	import { debug } from '$lib/common/debug';

	export let user: User;
	export let title = 'PreAuth Keys:';

	let hideInvalid = true;

	$: showCreate = false;
	$: disableCreate = false;
	$: preAuthKeys = filter(get(PreAuthKeyStore));
	$: checked = defaultChecked();
	$: expires = defaultExpires();

	function defaultExpires(hours: number = 1, minutes: number = 0) {
		const tzOffset = new Date().getTimezoneOffset() * 60 * 1000;
		return new Date(Date.now() - tzOffset + minutes * 60 * 1000 + hours * 60 * 60 * 1000)
			.toISOString()
			.split(':')
			.slice(0, 2) // up to minutes, remove TZ info
			.join(':');
	}

	function defaultChecked() {
		return {
			ephemeral: false,
			reusable: false,
		};
	}

	$: isUsed = (p: PreAuthKey): boolean => {
		return p.used;
	};

	$: isExpiredOrUsed = (p: PreAuthKey): boolean => {
		return new Date() > new Date(p.expiration) || p.used;
	};

	$: filter = (p: PreAuthKey[]): PreAuthKey[] => {
		return p.filter((p) => {
			return p.user == user.name && (!hideInvalid || (hideInvalid && !isExpiredOrUsed(p)));
		});
	};

	onMount(() => {
		const unsubPreAuthKeyStore = PreAuthKeyStore.subscribe((p) => {
			preAuthKeys = filter(p);
		});
		return () => {
			unsubPreAuthKeyStore();
		};
	});
</script>

<CardListEntry {title} top>
	<div class="grid grid-cols-12">
		<div class="flex col-span-12 justify-end items-center">
			<input class="checkbox mx-0 pr-1" type="checkbox" bind:checked={hideInvalid} />
			<p class="ml-1 md:ml-2 text-xs">Hide Invalid</p>
			<button
				disabled={disableCreate}
				type="button"
				class="btn btn-sm rounded-md variant-filled-success px-2 py-[2px] ml-6"
				on:click={() => {
					// checked = defaultChecked();
					if (!showCreate) {
						expires = defaultExpires();
						showCreate = true;
					} else {
						showCreate = false;
					}
				}}
			>
				Create
			</button>
		</div>
		{#if showCreate}
			<div
				transition:slide|global
				class="flex flex-row flex-wrap col-span-12 pt-2 justify-end text-sm"
			>
				<div class="flex flex-col">
					<div
						class="flex flex-row flex-wrap col-span-12 py-2 space-x-3 justify-end items-center text-sm"
					>
						<button
							disabled={disableCreate}
							on:click={async () => {
								disableCreate = true;
								try {
									const preAuthKey = await createPreAuthKey(
										user,
										checked.ephemeral,
										checked.reusable,
										expires,
									);
									appendStoreItem(PreAuthKeyStore, preAuthKey);
								} catch (e) {
									debug(e);
								} finally {
									showCreate = false;
									disableCreate = false;
									checked = defaultChecked();
								}
							}}
						>
							<RawMdiCheckCircleOutline />
						</button>
						<button disabled={disableCreate} on:click={() => (showCreate = false)}>
							<RawMdiCloseCircleOutline />
						</button>
					</div>
					<div
						class="flex flex-row flex-wrap col-span-12 pt-2 space-x-3 justify-end items-center text-sm"
					>
						<input
							disabled={disableCreate}
							type="datetime-local"
							class="input rounded-md text-xs flex-1"
							bind:value={expires}
						/>
					</div>
					<div
						class="flex flex-row flex-wrap col-span-12 py-2 space-x-3 justify-end items-center text-sm"
					>
						<label class="flex items-center space-x-2 py-2">
							<input
								disabled={disableCreate}
								class="checkbox"
								type="checkbox"
								bind:checked={checked.ephemeral}
							/>
							<p>Ephemeral</p>
						</label>
						<label class="flex items-center space-x-2 py-2">
							<input
								disabled={disableCreate}
								class="checkbox"
								type="checkbox"
								bind:checked={checked.reusable}
							/>
							<p>Reusable</p>
						</label>
					</div>
				</div>
			</div>
		{/if}
	</div>
	<svelte:fragment slot="bottom">
		<div class="grid grid-cols-12 col-span-12 pt-4">
			{#each preAuthKeys as preAuthKey}
				<UserListPreAuthKey {preAuthKey} />
			{/each}
		</div>
	</svelte:fragment>
</CardListEntry>
