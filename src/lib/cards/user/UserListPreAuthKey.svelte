<script lang="ts">
	import type { PreAuthKey } from '$lib/common/types';
	import RawMdiClipboard from '~icons/mdi/clipboard';
	import RawMdiDotsVertical from '~icons/mdi/dots-vertical';
	import RawMdiInformation from '~icons/mdi/information';
	import { getToastStore, popup, type PopupSettings } from '@skeletonlabs/skeleton';
	import { copyToClipboard } from '$lib/common/funcs';

	const toastStore = getToastStore();
	export let preAuthKey: PreAuthKey;
	$: expired = isExpired(preAuthKey);

	function isExpired(preAuthKey: PreAuthKey): boolean {
		return new Date() > new Date(preAuthKey.expiration);
	}

	const popupPreAuthKeyActions: PopupSettings = {
		event: 'click',
		target: 'popupPreAuthKeyActions-' + preAuthKey.id,
		placement: 'top-start',
	};

	const popupPreAuthKeyInfo: PopupSettings = {
		event: 'hover',
		target: 'popupPreAuthKeyInfo-' + preAuthKey.id,
		placement: 'top',
	};
</script>

<div class="grid grid-cols-12 col-span-12 py-2">
	<!--div class="col-span-6 sm:col-span-5 md:col-span-5 lg:col-span-5"-->
	<div class="flex flex-row items-start">
		<button
			class="font-mono flex items-center border-2 border-dashed w-auto px-2 py-1.5 mr-3 border-slate-300 dark:border-slate-700"
			on:click={() => copyToClipboard(preAuthKey.key, toastStore)}
		>
			<span class="mr-2">
				<RawMdiClipboard />
			</span>
			<!--/button-->
			{preAuthKey.key.substring(0, 8) + '...'}
		</button>
		<div class="items-center flex flex-col sm:flex-row gap-1 lg:gap-2">
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
