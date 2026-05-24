<script lang="ts">
	import RawMdiInfo from '~icons/mdi/info';
	import { slide } from 'svelte/transition';
	import { type PopupSettings, popup } from '@skeletonlabs/skeleton';
	import { xxHash32 } from 'js-xxhash';
	import { type Snippet } from 'svelte';

	type DeployCheckTypes = {
		name: string,
		help?: string,
		checked: boolean,
		children?: Snippet,
	}

	let { name, help, checked = $bindable(), children = undefined }: DeployCheckTypes = $props()

	const popupId = xxHash32(name).toString();
	const uniqueId = Math.random().toString(36).substring(2, 9);
	let popupShow = $state(false);

	let timerInfo: ReturnType<typeof setTimeout>;

	const popupInfo: PopupSettings = {
		event: 'hover',
		target: 'popupHover-' + popupId,
		placement: 'top',
	};

	function handleMouseEnter() {
		timerInfo = setTimeout(() => {
			popupShow = true;
		}, 333);
	}

	function handleMouseLeave() {
		popupShow = false;
		clearTimeout(timerInfo);
	}
</script>

<div
	class="card p-4 variant-filled-tertiary {popupShow ? '' : 'invisible'}"
	data-popup="popupHover-{popupId}"
>
	<p>{help}</p>
	<div class="arrow variant-filled-tertiary"></div>
</div>

<div class="flex flex-col col-span-12 md:col-span-6 xl:col-span-4 pb-4 mx-4">
	<div class="flex items-center space-x-2">
		{#if help !== undefined}
			<button
				class="btn p-0 btn-icon variant-soft-secondary w-6 h-6 [&>*]:pointer-events-none"
				use:popup={popupInfo}
				onmouseenter={handleMouseEnter}
				onmouseleave={handleMouseLeave}
			>
				<RawMdiInfo />
			</button>
		{/if}
		<input id={"checkbox-" + uniqueId} class="checkbox" type="checkbox" bind:checked />
		<label for={"checkbox-" + uniqueId}>{name}</label>
	</div>
	{#if children != undefined && checked}
		<div transition:slide class="pt-4">
			{@render children()}
		</div>
	{/if}
</div>
