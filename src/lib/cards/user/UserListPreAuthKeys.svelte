<script lang="ts">
	import CardListEntry from '../CardListEntry.svelte';
	// import CardSeparator from '../CardSeparator.svelte';
	import RawMdiCheckCircleOutline from '~icons/mdi/check-circle-outline';
	import RawMdiCloseCircleOutline from '~icons/mdi/close-circle-outline';
	import UserListPreAuthKey from '$lib/cards/user/UserListPreAuthKey.svelte';
	import type { PreAuthKey, User } from '$lib/common/types';
	import { slide } from 'svelte/transition';
	import { createPreAuthKey } from '$lib/common/api';
	import { debug } from '$lib/common/debug';
	import CardSeparator from '../CardSeparator.svelte';
	import { App } from '$lib/States.svelte';

	type UserListPreAuthKeysProps = {
		user: User,
		title?: string,
	}
	let {
		user = $bindable(),
		title = 'PreAuth Keys:',
	}: UserListPreAuthKeysProps = $props();

	let hideInvalid = $state(true);

	let showCreate = $state(false);
	let disableCreate = $state(false);
	let checked = $state(defaultChecked());
	let expires = $state(defaultExpires());
	const preAuthKeys = $derived(
		App.preAuthKeys.value.filter((p) => {
			return (p.user.id === user.id) 
				&& (!hideInvalid || (hideInvalid && !isExpiredOrUsed(p)));
		})
	);

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

	function isExpiredOrUsed(p: PreAuthKey): boolean {
		return new Date() > new Date(p.expiration) || (p.used && !p.reusable);
	};
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
				onclick={() => {
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
							onclick={async () => {
								disableCreate = true;
								try {
									const preAuthKey = await createPreAuthKey(
										user,
										checked.ephemeral,
										checked.reusable,
										expires,
									);
									App.preAuthKeys.value.push(preAuthKey)
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
						<button disabled={disableCreate} onclick={() => (showCreate = false)}>
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
	{#snippet childBottom()}
		<div class="grid grid-cols-12 col-span-12 pt-4">
			{#each preAuthKeys as preAuthKey}
				<CardSeparator />
				<UserListPreAuthKey {preAuthKey} />
			{/each}
		</div>
	{/snippet}
</CardListEntry>
