<script lang="ts">
	import type { PreAuthKey } from '$lib/common/types';
	import RawMdiDotsVertical from '~icons/mdi/dots-vertical';
	import RawMdiInformation from '~icons/mdi/information';
	import { getToastStore, popup, type PopupSettings } from '@skeletonlabs/skeleton';
	import { copyToClipboard } from '$lib/common/funcs';

	const toastStore = getToastStore();
	export let preAuthKey: PreAuthKey;
	const expired: boolean = new Date() > new Date(preAuthKey.expiration);

	const popupPreAuthKeyActions: PopupSettings = {
		event: 'click',
		target: 'popupPreAuthKeyActions-' + preAuthKey.id,
		placement: 'top-start'
	};

	const popupPreAuthKeyInfo: PopupSettings = {
		event: 'hover',
		target: 'popupPreAuthKeyInfo-' + preAuthKey.id,
		placement: 'top'
	};
</script>

<div class="flex text-xs sm:text-sm md:text-sm xl:text-lg font-mono col-span-12 w-full my-1">
	<button
		class="btn btn-icon variant-filled-surface rounded-md w-6 py-0 px-0 mr-2"
		use:popup={popupPreAuthKeyActions}
	>
		<RawMdiDotsVertical />
	</button>
	<div class="card p-0 w-36 shadow-xl" data-popup={'popupPreAuthKeyActions-' + preAuthKey.id}>
		<nav class="list">
			<ul>
				<li>
					<button
						class="w-full text-left px-4 py-2 !rounded-none hover:bg-primary-300 hover:dark:bg-primary-700"
						on:click={() => copyToClipboard(preAuthKey.key, toastStore, 'Copied Key to Clipboard')}
					>
						Copy
					</button>
				</li>
				<li>
					<span
						class="w-full text-left px-4 py-2 !rounded-none hover:bg-primary-300 hover:dark:bg-primary-700"
					>
						Expire Now
					</span>
				</li>
			</ul>
		</nav>
		<div class="arrow bg-surface-100-800-token" />
	</div>
	<div class="truncate">
		<div class="border-2 border-dashed px-2 py-1.5 border-slate-300 dark:border-slate-700">
			{preAuthKey.key}
		</div>
	</div>
	<button
		class="btn btn-icon variant-filled-surface rounded-xl w-8 py-0 px-0 ml-2"
		use:popup={popupPreAuthKeyInfo}
	>
		<RawMdiInformation />
	</button>
	<div class="card p-4 w-36 shadow-xl text-sm" data-popup={'popupPreAuthKeyInfo-' + preAuthKey.id}>
		<ul class="list font-semibold text-lg">
			{#if expired}
				<li class="text-error-500 dark:text-error-500">Expired</li>
			{/if}
			{#if preAuthKey.used}
				<li class="text-success-800 dark:text-success-400">Used</li>
			{/if}
			{#if preAuthKey.ephemeral}
				<li class="text-secondary-600 dark:text-secondary-300">Ephemeral</li>
			{/if}
			{#if preAuthKey.reusable}
				<li class="text-tertiary-600 dark:text-tertiary-300">Reusable</li>
			{/if}
		</ul>
		<div class="arrow bg-surface-100-800-token" />
	</div>
</div>
