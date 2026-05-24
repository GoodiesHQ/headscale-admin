<script lang="ts">
	import { exportHeadscaleData, type ExportFormat, type ExportResource } from '$lib/common/export';
	import { toastSuccess } from '$lib/common/funcs';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { _ } from 'svelte-i18n';
	
	// icons
	import RawMdiDownload from '~icons/mdi/download';
	import RawMdiClose from '~icons/mdi/close';

	type Props = {
		show: boolean;
		onclose?: () => void;
	};

	let { show = $bindable(false), onclose }: Props = $props();

	const ToastStore = getToastStore();

	let format = $state<ExportFormat>('json');
	let selectedResources = $state<Set<ExportResource>>(new Set(['users', 'nodes']));
	let includeMetadata = $state(true);
	let loading = $state(false);

	function toggleResource(resource: ExportResource) {
		if (selectedResources.has(resource)) {
			selectedResources.delete(resource);
		} else {
			selectedResources.add(resource);
		}
		selectedResources = new Set(selectedResources);
	}

	async function handleExport() {
		if (selectedResources.size === 0) {
			return;
		}

		loading = true;
		try {
			await exportHeadscaleData({
				format,
				resources: Array.from(selectedResources),
				includeMetadata,
			});
			toastSuccess($_('common.exportSuccess'), ToastStore);
			show = false;
			onclose?.();
		} catch (error) {
			console.error('Export failed:', error);
		} finally {
			loading = false;
		}
	}
</script>

{#if show}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
		onclick={(e) => {
			if (e.target === e.currentTarget) {
				show = false;
				onclose?.();
			}
		}}
	>
		<div class="card p-6 w-full max-w-md space-y-4" onclick={(e) => e.stopPropagation()}>
			<div class="flex items-center justify-between">
				<h2 class="text-xl font-bold">{$_('common.exportData')}</h2>
				<button
					type="button"
					class="btn btn-sm variant-ghost"
					onclick={() => {
						show = false;
						onclose?.();
					}}
				>
					<RawMdiClose />
				</button>
			</div>

			<div class="space-y-4">
				<div>
					<label for="export-format" class="block text-sm font-medium mb-2">
						{$_('common.exportFormat')}
					</label>
					<select
						id="export-format"
						class="select w-full"
						bind:value={format}
						disabled={loading}
					>
						<option value="json">JSON</option>
						<option value="csv">CSV</option>
					</select>
				</div>

				<div>
					<p class="block text-sm font-medium mb-2">{$_('common.exportResources')}</p>
					<div class="space-y-2">
						<label class="flex items-center space-x-2">
							<input
								type="checkbox"
								class="checkbox"
								checked={selectedResources.has('users')}
								onchange={() => toggleResource('users')}
								disabled={loading}
							/>
							<span>{$_('common.users')}</span>
						</label>
						<label class="flex items-center space-x-2">
							<input
								type="checkbox"
								class="checkbox"
								checked={selectedResources.has('nodes')}
								onchange={() => toggleResource('nodes')}
								disabled={loading}
							/>
							<span>{$_('common.nodes')}</span>
						</label>
						<label class="flex items-center space-x-2">
							<input
								type="checkbox"
								class="checkbox"
								checked={selectedResources.has('preAuthKeys')}
								onchange={() => toggleResource('preAuthKeys')}
								disabled={loading}
							/>
							<span>{$_('common.preAuthKeys')}</span>
						</label>
						<label class="flex items-center space-x-2">
							<input
								type="checkbox"
								class="checkbox"
								checked={selectedResources.has('policy')}
								onchange={() => toggleResource('policy')}
								disabled={loading}
							/>
							<span>{$_('common.policy')}</span>
						</label>
					</div>
				</div>

				<div class="flex items-center space-x-2">
					<input
						type="checkbox"
						id="include-metadata"
						class="checkbox"
						bind:checked={includeMetadata}
						disabled={loading || format === 'csv'}
					/>
					<label for="include-metadata" class="text-sm cursor-pointer">
						{$_('common.exportIncludeMetadata')}
					</label>
				</div>
			</div>

			<div class="flex justify-end space-x-2 pt-4">
				<button
					type="button"
					class="btn variant-ghost"
					onclick={() => {
						show = false;
						onclose?.();
					}}
					disabled={loading}
				>
					{$_('common.cancel')}
				</button>
				<button
					type="button"
					class="btn variant-filled-primary"
					onclick={handleExport}
					disabled={loading || selectedResources.size === 0}
				>
					<RawMdiDownload class="w-4 h-4 mr-2" />
					{$_('common.export')}
				</button>
			</div>
		</div>
	</div>
{/if}
