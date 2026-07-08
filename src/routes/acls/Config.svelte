<script lang="ts">
	import CardListPage from '$lib/cards/CardListPage.svelte';
	import { ACLBuilder, saveConfig, type ACL } from '$lib/common/acl.svelte';
	import { getPolicy, checkPolicy } from '$lib/common/api';
	import { debug } from '$lib/common/debug';
	import { toastError, toastSuccess } from '$lib/common/funcs';
	import { _ } from 'svelte-i18n';
	import {
		CodeBlock,
		/*getModalStore,*/ getToastStore,
		modeCurrent,
		type ModalSettings,
	} from '@skeletonlabs/skeleton';

	// import LoaderModal from "$lib/parts/LoaderModal.svelte";
	import JWCC from 'json5';
	import { onMount } from 'svelte';
	import type { Component } from 'svelte';
	import { get } from 'svelte/store';

	type JsonEditorTextContent = { text: string };
	type JsonEditorModule = typeof import('svelte-jsoneditor');

	const ToastStore = getToastStore();
	let isLightMode = $state(get(modeCurrent));
	//const ModalStore = getModalStore()

	/*
    const modal: ModalSettings = {
        type: "component",
        component: {
            ref: LoaderModal,
            props: {
                title: "Load ACL Config",
                body: "Import an existing HuJSON configuration.",
                callback: callback,
            }
        },
    };
    */

	let { acl = $bindable(), loading = $bindable(false) }: { acl: ACLBuilder; loading?: boolean } =
		$props();
	const aclJSON = $derived(acl.JSON(2));
	let editing = $state(false);
	let editorLoading = $state(false);
	let editorLoadError = $state<Error | undefined>(undefined);
	let jsonEditorModule = $state<JsonEditorModule | undefined>(undefined);
	let JsonEditorComponent = $state<Component<Record<string, unknown>> | undefined>(undefined);
	let aclEditJSON = $state<JsonEditorTextContent>({ text: '' });

	/*
    function callback(data: string): boolean {
        const policy = JWCC.parse<ACL>(data);
        acl = ACLBuilder.fromPolicy(policy)
        return true
    }
    */

	async function loadJsonEditor() {
		if (jsonEditorModule || editorLoading) {
			return;
		}

		editorLoading = true;
		editorLoadError = undefined;
		try {
			const [module] = await Promise.all([
				import('svelte-jsoneditor'),
				import('svelte-jsoneditor/themes/jse-theme-dark.css'),
			]);
			jsonEditorModule = module;
			JsonEditorComponent = module.JSONEditor as unknown as Component<Record<string, unknown>>;
		} catch (reason) {
			debug('failed to load JSON editor:', reason);
			editorLoadError = reason instanceof Error ? reason : new Error(String(reason));
			toastError($_('acls.editorLoadFailed'), ToastStore, editorLoadError);
		} finally {
			editorLoading = false;
		}
	}

	function applyConfig(config: JsonEditorTextContent) {
		acl = ACLBuilder.fromPolicy(config.text);
		editing = false;
	}

	function resetConfig() {
		acl = ACLBuilder.defaultACL();
	}

	function loadConfig() {
		loading = true;
		getPolicy()
			.then((policy) => {
				acl = ACLBuilder.fromPolicy(JWCC.parse<ACL>(policy));
				toastSuccess($_('acls.configLoaded'), ToastStore);
			})
			.catch((reason) => {
				debug('failed to get policy:', reason);
				toastError($_('acls.configLoadFailed'), ToastStore, reason);
			})
			.finally(() => {
				loading = false;
			});
		// ModalStore.trigger(modal)
	}

	function validateConfig() {
		loading = true;
		const policyText = editing ? aclEditJSON.text : acl.JSON(2);
		checkPolicy(policyText)
			.then(() => toastSuccess($_('acls.configValid'), ToastStore))
			.catch((reason) => {
				debug('Policy validation failed:', reason);
				toastError($_('acls.configInvalid'), ToastStore, reason);
			})
			.finally(() => {
				loading = false;
			});
	}

	onMount(() => {
		const unsubModeCurrent = modeCurrent.subscribe((m) => {
			isLightMode = m;
		});
		return () => {
			unsubModeCurrent();
		};
	});
</script>

<CardListPage>
	<div class="mb-2">
		<button
			disabled={loading || editing}
			class="btn-sm rounded-md variant-filled-success disabled:opacity-50 w-32"
			onclick={() => {
				saveConfig(acl, ToastStore, {
					setLoadingTrue: () => {
						loading = true;
					},
					setLoadingFalse: () => {
						loading = false;
					},
				});
			}}
		>
			{$_('acls.saveConfig')}
		</button>
		<button
			disabled={loading}
			class="btn-sm rounded-md variant-filled-tertiary disabled:opacity-50 w-32"
			onclick={() => {
				validateConfig();
			}}
		>
			{$_('acls.validateConfig')}
		</button>
		<button
			disabled={loading || editing}
			class="btn-sm rounded-md variant-filled-secondary disabled:opacity-50 w-32"
			onclick={() => {
				loadConfig();
			}}
		>
			{$_('acls.loadConfig')}
		</button>
		<button
			disabled={loading}
			class="btn-sm rounded-md variant-filled-warning w-32 disabled:opacity-50"
			onclick={async () => {
				if (editing) {
					applyConfig(aclEditJSON);
				} else {
					aclEditJSON.text = acl.JSON(2);
					editing = true;
					await loadJsonEditor();
				}
			}}
		>
			{#if editing}
				{$_('acls.applyConfig')}
			{:else}
				{$_('acls.editConfig')}
			{/if}
		</button>
		{#if editing}
			<button
				disabled={loading}
				class="btn-sm rounded-md variant-filled-error disabled:opacity-50 w-32"
				onclick={() => {
					editing = false;
				}}
			>
				{$_('acls.cancelEditing')}
			</button>
		{:else}
			<button
				disabled={loading || editing}
				class="btn-sm rounded-md variant-filled-error disabled:opacity-50 w-32"
				onclick={() => {
					resetConfig();
				}}
			>
				{$_('acls.resetConfig')}
			</button>
		{/if}
		<!--button disabled={loading} class="btn-sm rounded-md variant-filled-success" onclick={() => { if(aclEditJSON !== undefined) applyConfig(aclEditJSON) }}>
			Apply Config
		</button-->
	</div>
	{#if !editing}
		<CodeBlock language="json" code={aclJSON} />
	{:else}
		<div class={isLightMode ? '' : 'jse-theme-dark'}>
			{#if editorLoadError}
				<div class="space-y-3 rounded-md border border-error-500/30 p-6 text-sm text-error-500">
					<p>{$_('acls.editorLoadFailed')}</p>
					<button
						type="button"
						class="btn-sm rounded-md variant-soft-error"
						onclick={loadJsonEditor}
					>
						{$_('common.retry')}
					</button>
				</div>
			{:else if editorLoading || !JsonEditorComponent || !jsonEditorModule}
				<div class="rounded-md border border-surface-500/30 p-6 text-sm text-surface-500">
					{$_('common.loading')}
				</div>
			{:else}
				<JsonEditorComponent
					parser={JWCC}
					mode={jsonEditorModule.Mode.text}
					tabSize={4}
					bind:content={aclEditJSON}
					onChange={(updatedContent: unknown) => {
						if (jsonEditorModule?.isTextContent(updatedContent)) {
							aclEditJSON = updatedContent;
						}
					}}
				/>
			{/if}
		</div>
	{/if}
</CardListPage>
