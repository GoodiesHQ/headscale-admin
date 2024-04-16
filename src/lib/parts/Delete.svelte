<script lang="ts">
	import { slide } from 'svelte/transition';

	import RawMdiDelete from '~icons/mdi/delete';
	import RawMdiCheckCircleOutline from '~icons/mdi/check-circle-outline';
	import RawMdiCloseCircleOutline from '~icons/mdi/close-circle-outline';

	export let func: () => void;
	export let show = false;
	export let disabled = false;
</script>

<div class="flex flex-row items-center justify-end py-0 my-0 pl-0 ml-4">
	{#if show}
		<span transition:slide={{ delay: 50, axis: 'x' }} class="text-right flex space-x-2">
			<button
				{disabled}
				on:click={async () => {
					try {
						disabled = true;
						if (func.constructor.name === 'AsyncFunction') {
							await func();
						} else {
							func();
						}
					} finally {
						disabled = false;
						show = false;
					}
				}}
			>
				<RawMdiCheckCircleOutline />
			</button>
			<button
				{disabled}
				on:click={() => {
					show = false;
				}}
			>
				<RawMdiCloseCircleOutline />
			</button>
		</span>
	{/if}
	<span class="text-error-600 dark:text-error-400 ml-2">
		<button {disabled} on:click={() => (show = !show)}>
			<RawMdiDelete />
		</button>
	</span>
</div>
