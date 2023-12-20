<script lang="ts">
	import type { PreAuthKey } from '$lib/common/types';
	import RawMdiClipboard from '~icons/mdi/clipboard';
	import { getToastStore, popup, type PopupSettings } from '@skeletonlabs/skeleton';
	import { copyToClipboard } from '$lib/common/funcs';
	import Delete from '$lib/parts/Delete.svelte';
	import { expirePreAuthKey, getPreAuthKeys } from '$lib/common/api';
	import { populatePreAuthKeyStore, PreAuthKeyStore, updateStoreItem } from '$lib/Stores';

	const toastStore = getToastStore();
	export let preAuthKey: PreAuthKey;

	function isExpired(preAuthKey: PreAuthKey): boolean {
		return new Date() > new Date(preAuthKey.expiration);
	}
</script>

<div class="flex flex-row items-start">
	<div class="flex flex-col px-2 gap-2">
		<button
			class="font-mono flex items-center border-2 border-dashed w-auto py-1.5 mr-3 border-slate-300 dark:border-slate-700"
			on:click={() => copyToClipboard(preAuthKey.key, toastStore)}
		>
			<span class="mr-2">
				<RawMdiClipboard />
			</span>
			{preAuthKey.key.substring(0, 8) + '...'}
		</button>
		<span class="mr-2 {isExpired(preAuthKey) && 'invisible'}">
			<Delete
				func={async () => {
					await expirePreAuthKey(preAuthKey);
					const keys = await getPreAuthKeys([preAuthKey.user]);
					keys.forEach((pak) => {
						updateStoreItem(PreAuthKeyStore, pak);
					});
				}}
			/>
		</span>
	</div>
	<div class="flex flex-col gap-2">
		<div class="items-center flex flex-row gap-1 lg:gap-2">
			<span
				class="badge badge-glass {preAuthKey.used
					? 'variant-ghost-success'
					: 'variant-flat opacity-50'}"
			>
				Used
			</span>
			<span
				class="badge badge-glass {isExpired(preAuthKey)
					? 'variant-ghost-error'
					: 'variant-flat opacity-50'}"
			>
				Expired
			</span>
		</div>
		<div class="items-center flex flex-row gap-1 lg:gap-2">
			<span
				class="badge badge-glass {preAuthKey.ephemeral
					? 'variant-ghost-secondary'
					: 'variant-flat opacity-50'}"
			>
				Ephemeral
			</span>
			<span
				class="badge badge-glass {preAuthKey.reusable
					? 'variant-ghost-tertiary'
					: 'variant-flat opacity-50'}"
			>
				Reusable
			</span>
		</div>
	</div>
</div>
