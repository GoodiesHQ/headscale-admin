<script lang="ts">
	import RawMdiInfo from '~icons/mdi/info';
	import { slide } from 'svelte/transition';
	import { type PopupSettings, popup } from '@skeletonlabs/skeleton';
	import { xxHash32 } from 'js-xxhash';
	import { onMount } from 'svelte';

	export let name: string;
	export let help: string | undefined = undefined;
	export let checked: boolean;

	const popupId = xxHash32(name).toString();
	$: popupShow = false;

	let timerInfo: ReturnType<typeof setTimeout>;

	const popupInfo: PopupSettings = {
		event: 'hover',
		target: 'popupHover-' + popupId,
		placement: 'top',
	};

	function handleMouseEnter() {
		timerInfo = setTimeout(() => {
			console.log('ok');
			popupShow = true
		}, 333);
	}

	function handleMouseLeave() {
		popupShow = false
		clearTimeout(timerInfo);
	}
</script>

<div class="card p-4 variant-filled-secondary {popupShow ? '' : 'invisible'}" data-popup="popupHover-{popupId}">
	<p>{help}</p>
	<div class="arrow variant-filled-secondary" />
</div>

<div class="flex flex-col col-span-12 md:col-span-6 xl:col-span-4 pb-4 mx-4">
	<label class="flex items-center space-x-2">
		{#if help !== undefined}
			<button
				class="btn p-0 btn-icon variant-soft-secondary w-6 h-6 [&>*]:pointer-events-none"
				use:popup={popupInfo}
				on:mouseenter={handleMouseEnter}
				on:mouseleave={handleMouseLeave}
			>
				<RawMdiInfo />
			</button>
		{/if}
		<input class="checkbox" type="checkbox" bind:checked />
		<p>{name}</p>
	</label>
	{#if $$slots.default && checked}
		<div transition:slide class="pt-4">
			<slot />
		</div>
	{/if}
</div>
