<script lang="ts">
	import { getToastStore } from '@skeletonlabs/skeleton';
	import CardListPage from '$lib/cards/CardListPage.svelte';
	import { ACLBuilder } from '$lib/common/acl.svelte';
	import { debug } from '$lib/common/debug';
	import { toastError, toastSuccess } from '$lib/common/funcs';
	import { _ } from 'svelte-i18n';

	type AdvancedProps = {
		acl: ACLBuilder;
		loading?: boolean;
	};

	let { acl = $bindable(), loading = $bindable(false) }: AdvancedProps = $props();

	const ToastStore = getToastStore();
	const fields = ['grants', 'nodeAttrs', 'tests', 'sshTests'] as const;
	let selectedField = $state<(typeof fields)[number]>('grants');
	let editorText = $state('');
	let randomizeClientPortMode = $state<'inherit' | 'enabled' | 'disabled'>('inherit');

	function currentFieldValue(): Record<string, unknown>[] {
		return acl.getAdvancedPolicyField(selectedField) ?? [];
	}

	function syncFromAcl() {
		editorText = JSON.stringify(currentFieldValue(), null, 2);
		randomizeClientPortMode =
			acl.randomizeClientPort === undefined
				? 'inherit'
				: acl.randomizeClientPort
					? 'enabled'
					: 'disabled';
	}

	function setSelectedField(field: (typeof fields)[number]) {
		selectedField = field;
		syncFromAcl();
	}

	function applyField() {
		try {
			const parsed = JSON.parse(editorText) as unknown;
			if (!Array.isArray(parsed)) {
				throw new Error($_('acls.advancedArrayRequired'));
			}
			acl.setAdvancedPolicyField(selectedField, parsed as Record<string, unknown>[]);
			toastSuccess($_('acls.advancedApplied'), ToastStore);
		} catch (e) {
			if (e instanceof Error) {
				toastError($_('acls.advancedApplyFailed'), ToastStore, e);
			}
			debug(e);
		}
	}

	function applyRandomizeClientPort() {
		acl.setRandomizeClientPort(
			randomizeClientPortMode === 'inherit' ? undefined : randomizeClientPortMode === 'enabled',
		);
		toastSuccess($_('acls.advancedApplied'), ToastStore);
	}

	function insertTemplate(template: Record<string, unknown>[]) {
		editorText = JSON.stringify(template, null, 2);
	}

	$effect(() => {
		syncFromAcl();
	});
</script>

<CardListPage>
	<div class="space-y-4">
		<div class="flex flex-wrap gap-2">
			{#each fields as field}
				<button
					class={'btn-sm rounded-md ' +
						(selectedField === field ? 'variant-filled-secondary' : 'variant-soft-secondary')}
					disabled={loading}
					onclick={() => setSelectedField(field)}
				>
					{$_(`acls.${field}`)}
				</button>
			{/each}
		</div>

		<div class="grid gap-4 lg:grid-cols-[1fr_18rem]">
			<textarea
				class="textarea rounded-md min-h-96 font-mono text-sm"
				aria-label={$_('acls.advancedJson')}
				bind:value={editorText}
			></textarea>
			<div class="space-y-3">
				<button
					class="btn-sm rounded-md variant-filled-success w-full"
					disabled={loading}
					onclick={applyField}
				>
					{$_('acls.applyConfig')}
				</button>
				<button
					class="btn-sm rounded-md variant-soft-secondary w-full"
					disabled={loading}
					onclick={syncFromAcl}
				>
					{$_('acls.reloadSection')}
				</button>
				{#if selectedField === 'grants'}
					<button
						class="btn-sm rounded-md variant-soft-tertiary w-full"
						onclick={() =>
							insertTemplate([
								{
									src: ['autogroup:member'],
									dst: ['tag:fileserver'],
									ip: ['*'],
									app: {
										'tailscale.com/cap/drive': [{ shares: ['*'], access: 'rw' }],
									},
								},
							])}
					>
						{$_('acls.taildriveTemplate')}
					</button>
				{/if}
				{#if selectedField === 'nodeAttrs'}
					<button
						class="btn-sm rounded-md variant-soft-tertiary w-full"
						onclick={() =>
							insertTemplate([
								{ target: ['tag:fileserver'], attr: ['drive:share'] },
								{ target: ['autogroup:member'], attr: ['drive:access'] },
							])}
					>
						{$_('acls.taildriveAttrsTemplate')}
					</button>
				{/if}
			</div>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<span class="font-mono text-sm">{$_('acls.randomizeClientPort')}</span>
			<select class="select rounded-md max-w-52" bind:value={randomizeClientPortMode}>
				<option value="inherit">{$_('common.inherit')}</option>
				<option value="enabled">{$_('common.enabled')}</option>
				<option value="disabled">{$_('common.disabled')}</option>
			</select>
			<button
				class="btn-sm rounded-md variant-filled-secondary"
				disabled={loading}
				onclick={applyRandomizeClientPort}
			>
				{$_('common.apply')}
			</button>
		</div>
	</div>
</CardListPage>
