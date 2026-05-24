<script lang="ts">
	import type { PreAuthKey } from '$lib/common/types';
	import RawMdiClipboard from '~icons/mdi/clipboard';
	import { getToastStore, popup, type PopupSettings } from '@skeletonlabs/skeleton';
	import { copyToClipboard } from '$lib/common/funcs';
	import Delete from '$lib/parts/Delete.svelte';
	import { expirePreAuthKey } from '$lib/common/api';
	import { App } from '$lib/States.svelte';
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';

	type UserListPreAuthKeyProps = {
		preAuthKey: PreAuthKey,
	}
	let { preAuthKey }: UserListPreAuthKeyProps = $props()

	const toastStore = getToastStore();
	let pakIsExpired = $state(isExpired(preAuthKey))

	function isExpired(preAuthKey: PreAuthKey): boolean {
		return new Date() > new Date(preAuthKey.expiration);
	}

	onMount(()=>{
		const interval = setInterval(() => {
			pakIsExpired = isExpired(preAuthKey)
		}, 1000)

		return () => {
			clearInterval(interval)
		}
	})
</script>

<div class="flex flex-row items-start">
	<div class="flex flex-col px-2 gap-2">
		{#if preAuthKey.key && preAuthKey.key.length > 0}
			<button
				class="font-mono flex items-center border-2 border-dashed w-auto py-1.5 px-2 mr-3 border-slate-300 dark:border-slate-700 text-xs sm:text-sm"
				onclick={() => copyToClipboard(preAuthKey.key, toastStore)}
				title={preAuthKey.key}
			>
				<span class="mr-2">
					<RawMdiClipboard />
				</span>
				<!-- Show more characters for legacy (non-masked) keys -->
				{#if preAuthKey.key.includes('*')}
					<!-- New format (masked): show first 8 chars -->
					{preAuthKey.key.substring(0, Math.min(20, preAuthKey.key.length))}
				{:else}
					<!-- Legacy format (full key): show more characters or full key on larger screens -->
					<span class="hidden sm:inline">{preAuthKey.key}</span>
					<span class="sm:hidden">{preAuthKey.key.substring(0, 16)}...</span>
				{/if}
			</button>
		{:else}
			<div class="font-mono flex items-center border-2 border-dashed w-auto py-1.5 px-2 mr-3 border-red-300 dark:border-red-700 text-xs opacity-50">
				<span class="mr-2">⚠️</span>
				No key available
			</div>
		{/if}
	</div>
	<div class="flex flex-col lg:flex-row gap-2">
		<div class="items-center flex flex-row gap-1 lg:gap-2">
			<span
				class="badge badge-glass {preAuthKey.used
					? 'variant-ghost-success'
					: 'variant-flat opacity-50'}"
			>
				{$_('cards.used')}
			</span>
			<span
				class="badge badge-glass {pakIsExpired
					? 'variant-ghost-error'
					: 'variant-flat opacity-50'}"
			>
				{$_('cards.expired')}
			</span>
		</div>
		<div class="items-center flex flex-row gap-1 lg:gap-2">
			<span
				class="badge badge-glass {preAuthKey.ephemeral
					? 'variant-ghost-secondary'
					: 'variant-flat opacity-50'}"
			>
				{$_('cards.ephemeral')}
			</span>
			<span
				class="badge badge-glass {preAuthKey.reusable
					? 'variant-ghost-tertiary'
					: 'variant-flat opacity-50'}"
			>
				{$_('cards.reusable')}
			</span>
		</div>
	</div>
	<div class="flex items-center ml-auto">
		<span class="mr-2 {isExpired(preAuthKey) && 'hidden'}">
			<Delete
				func={async () => {
					await expirePreAuthKey(preAuthKey);
					await App.populatePreAuthKeys();
				}}
			/>
		</span>
	</div>
</div>
