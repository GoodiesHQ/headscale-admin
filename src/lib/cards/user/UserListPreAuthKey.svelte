<script lang="ts">
	import type { PreAuthKey } from '$lib/common/types';
	import { getToastStore, popup, type PopupSettings } from '@skeletonlabs/skeleton';
	import { toastSuccess } from '$lib/common/funcs';
	import Delete from '$lib/parts/Delete.svelte';
	import { deletePreAuthKey, expirePreAuthKey, getPreAuthKeys } from '$lib/common/api';
	import { App } from '$lib/States.svelte';
	import { onMount } from 'svelte';

	type UserListPreAuthKeyProps = {
		preAuthKey: PreAuthKey,
	}
	let { preAuthKey }: UserListPreAuthKeyProps = $props()

	const toastStore = getToastStore();
	let pakIsExpired = $derived(isExpired(preAuthKey))

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

<div class="col-span-12 flex w-full items-center justify-between">
	<div class="flex items-center gap-3">
		<!-- Listed keys are masked by Headscale (...-***) and not usable when copied.
		     Show the ID alongside the masked key so entries stay distinguishable;
		     the full key is only available on creation via the Deploy page. -->
		<div
			class="font-mono flex flex-col items-start leading-tight border-2 border-dashed w-auto py-1.5 px-2 mr-3 border-slate-300 dark:border-slate-700 whitespace-nowrap"
		>
			<span class="text-[10px] opacity-60">#{preAuthKey.id}</span>
			<span>{preAuthKey.key}</span>
		</div>
		<div class="flex items-center flex-row gap-1 lg:gap-2">
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
		<div class="flex items-center flex-row gap-1 lg:gap-2">
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
	<div class="flex">
		<span class="mr-2">
			<Delete
				func={async () => {
					try{
						await deletePreAuthKey(preAuthKey);
					} catch(e) {
						toastSuccess('Error Deleting PreAuth Key: ' + e, toastStore);
						return;
					}
					toastSuccess('PreAuth Key Deleted', toastStore);
					App.removeValue(App.preAuthKeys, preAuthKey);
					const keys = await getPreAuthKeys();
					App.preAuthKeys.value = keys;
				}}
			/>
		</span>
	</div>
</div>
