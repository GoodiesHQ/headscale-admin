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
	import { isValidTag, toastError } from '$lib/common/funcs';
	import { InputChip, getToastStore } from '@skeletonlabs/skeleton';
	import CardSeparator from '../CardSeparator.svelte';
	import { App } from '$lib/States.svelte';
	import { _ } from 'svelte-i18n';

	type UserListPreAuthKeysProps = {
		user: User,
		title?: string,
	}
	let {
		user = $bindable(),
		title = $_('users.preAuthKeys') + ':',
	}: UserListPreAuthKeysProps = $props();

	const ToastStore = getToastStore();
	let hideInvalid = $state(true);

	let showCreate = $state(false);
	let disableCreate = $state(false);
	let checked = $state(defaultChecked());
	let expires = $state(defaultExpires());
	let tags = $state([] as string[]);
	const preAuthKeys = $derived(
		App.preAuthKeys.value.filter((p) => {
			// Ensure this key belongs to the current user
			if (p.user.id !== user.id) {
				return false;
			}
			
			// If hideInvalid is false, show all keys
			if (!hideInvalid) {
				return true;
			}
			
			// If hideInvalid is true, filter out expired or single-use keys
			return !isExpiredOrUsed(p);
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
		// Safely check expiration - some old format keys might have issues
		try {
			if (!p.expiration) {
				// If no expiration, consider it valid (never expires)
				return p.used && !p.reusable;
			}
			return new Date() > new Date(p.expiration) || (p.used && !p.reusable);
		} catch (e) {
			debug('Error checking expiration for key', p.id, e);
			// If there's an error checking expiration, don't hide the key
			return false;
		}
	};
</script>

<CardListEntry {title} top>
	<div class="grid grid-cols-12">
		<div class="flex col-span-12 justify-end items-center">
			<input class="checkbox mx-0 pr-1" type="checkbox" bind:checked={hideInvalid} />
			<p class="ml-1 md:ml-2 text-xs">{$_('cards.hideInvalid')}</p>
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
				{$_('cards.create')}
			</button>
		</div>
		{#if showCreate}
			<div
				transition:slide|global
				class="flex flex-col col-span-12 pt-2 gap-3 w-full"
			>
				<!-- Expiration and Tags in one row with equal heights -->
				<div class="flex flex-col sm:grid sm:grid-cols-2 gap-3 w-full items-stretch">
					<!-- Expiration time input (left) -->
					<div class="flex flex-col gap-1.5 w-full h-full">
						<label for="pak-expire-{user.id}" class="text-xs font-medium opacity-70">
							{$_('cards.expires')}
						</label>
						<input
							id="pak-expire-{user.id}"
							name="pak-expire-{user.id}"
							disabled={disableCreate}
							type="datetime-local"
							class="input rounded-md text-xs flex-1"
							bind:value={expires}
						/>
					</div>

					<!-- Tags input (right) - same structure for consistent height -->
					<div class="flex flex-col gap-1.5 w-full h-full">
						<label for="pak-tags-{user.id}" class="text-xs font-medium opacity-70">
							{$_('common.tags')}
						</label>
						<div class="flex-1 flex">
							<InputChip
								name="pak-tags-{user.id}"
								id="pak-tags-{user.id}"
								bind:value={tags}
								disabled={disableCreate}
								chips="variant-filled-surface"
								class="w-full text-xs"
								placeholder={$_('common.enterTags')}
								validation={isValidTag}
								on:invalid={() => {
									toastError($_('deploy.tagError'), ToastStore);
								}}
							/>
						</div>
					</div>
				</div>

				<!-- Checkboxes and Action buttons in one row -->
				<div class="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full items-center justify-between">
					<!-- Checkboxes (left) -->
					<div class="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1">
						<label class="flex items-center space-x-2">
							<input
								id="pak-ephemeral-{user.id}"
								name="pak-ephemeral-{user.id}"
								disabled={disableCreate}
								class="checkbox"
								type="checkbox"
								bind:checked={checked.ephemeral}
							/>
							<p class="text-sm">{$_('cards.ephemeral')}</p>
						</label>
						<label class="flex items-center space-x-2">
							<input
								id="pak-reusable-{user.id}"
								name="pak-reusable-{user.id}"
								disabled={disableCreate}
								class="checkbox"
								type="checkbox"
								bind:checked={checked.reusable}
							/>
							<p class="text-sm">{$_('cards.reusable')}</p>
						</label>
					</div>

					<!-- Action buttons (right) -->
					<div class="flex flex-row gap-2 w-full sm:w-auto">
						<button
							disabled={disableCreate}
							class="btn btn-sm variant-filled-error flex-1 sm:flex-none"
							onclick={() => (showCreate = false)}
						>
							<RawMdiCloseCircleOutline />
							<span class="hidden sm:inline ml-1">{$_('common.cancel')}</span>
						</button>
						<button
							disabled={disableCreate}
							class="btn btn-sm variant-filled-success flex-1 sm:flex-none"
							onclick={async () => {
								disableCreate = true;
								try {
									const preAuthKey = await createPreAuthKey(
										user,
										checked.ephemeral,
										checked.reusable,
										expires,
										tags,
									);
									// Avoid duplicates if race condition with auto-refresh
									const existingIdx = App.preAuthKeys.value.findIndex(k => k.id === preAuthKey.id);
									if (existingIdx >= 0) {
										App.preAuthKeys.value[existingIdx] = preAuthKey;
									} else {
										App.preAuthKeys.value.push(preAuthKey);
									}
								} catch (e) {
									debug(e);
								} finally {
									showCreate = false;
									disableCreate = false;
									checked = defaultChecked();
									tags = [];
								}
							}}
						>
							<RawMdiCheckCircleOutline />
							<span class="hidden sm:inline ml-1">{$_('common.confirm')}</span>
						</button>
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
