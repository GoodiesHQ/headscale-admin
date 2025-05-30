<script lang="ts">
	import type { PreAuthKey } from '$lib/common/types';
	import RawMdiClipboard from '~icons/mdi/clipboard';
	import { getToastStore, popup, type PopupSettings } from '@skeletonlabs/skeleton';
	import { copyToClipboard } from '$lib/common/funcs';
	import Delete from '$lib/parts/Delete.svelte';
	import { expirePreAuthKey, getPreAuthKeys } from '$lib/common/api';
	import { App } from '$lib/States.svelte';
	import { onMount } from 'svelte';

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
		<button
			class="font-mono flex items-center border-2 border-dashed w-auto py-1.5 px-2 mr-3 border-slate-300 dark:border-slate-700"
			onclick={() => copyToClipboard(preAuthKey.key, toastStore)}
		>
			<span class="mr-2">
				<RawMdiClipboard />
			</span>
			{preAuthKey.key.substring(0, 8)}
		</button>
		<span class="mr-2 {isExpired(preAuthKey) && 'hidden'}">
			<Delete
				func={async () => {
					await expirePreAuthKey(preAuthKey);
					const keys = await getPreAuthKeys([preAuthKey.user.id]);
					keys.forEach((pak) => {
						App.updateValue(App.preAuthKeys, pak)
					});
				}}
			/>
		</span>
	</div>
	<div class="flex flex-col lg:flex-row gap-2">
		<div class="items-center flex flex-row gap-1 lg:gap-2">
			<span
				class="badge badge-glass {preAuthKey.used
					? 'variant-ghost-success'
					: 'variant-flat opacity-50'}"
			>
				Used
			</span>
			<span
				class="badge badge-glass {pakIsExpired
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
