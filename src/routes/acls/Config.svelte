<script lang="ts">
	import CardListPage from "$lib/cards/CardListPage.svelte";
	import { ACLBuilder, type ACL } from "$lib/common/acl.svelte";
    import { isTextContent, JSONEditor, Mode, type TextContent } from 'svelte-jsoneditor'
    import 'svelte-jsoneditor/themes/jse-theme-dark.css'
	import { setPolicy } from "$lib/common/api";
	import { debug } from "$lib/common/debug";
	import { toastError, toastSuccess } from "$lib/common/funcs";
	import { CodeBlock, getModalStore, getToastStore, modeCurrent, type ModalSettings } from "@skeletonlabs/skeleton";
    
	import LoaderModal from "$lib/parts/LoaderModal.svelte";
    import JWCC from 'json5'
	import { onMount } from "svelte";
	import { get } from "svelte/store";

    const ToastStore = getToastStore()
    const ModalStore = getModalStore()
    let isLightMode = $state(get(modeCurrent))

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

	let {acl = $bindable(), loading = $bindable(false)}: {acl: ACLBuilder, loading?: boolean} = $props();
	const aclJSON = $derived(acl.JSON(4))
    let editing = $state(false)
    let aclEditJSON = $state<TextContent>()

    function makeJson(acl: ACLBuilder){
        let text = acl.JSON(4)
        return {
            get text(){
                return text
            },
            set text(data: string){
                debug("setting text...")
                text = data
            },
        }
    }

    function callback(data: string): boolean {
        const policy = JWCC.parse<ACL>(data);
        acl = ACLBuilder.fromPolicy(policy)
        return true
    }

    async function saveConfig() {
        loading = true
        try {
            await setPolicy(acl)
            toastSuccess('Saved ACL Configuration', ToastStore)
        } catch(err) {
            if (err instanceof Error){
                toastError('', ToastStore, err)
            }
            debug(err)
        } finally {
            loading = false
        }
    }

    function applyConfig(config: TextContent) {
        acl = ACLBuilder.fromPolicy(config.text)
        editing = false
    }

    function loadConfig() {
        ModalStore.trigger(modal)
    }

    onMount(()=>{
        const unsubModeCurrent = modeCurrent.subscribe(m => {
            isLightMode = m
        })
        return ()=>{
            unsubModeCurrent()
        }
    })

</script>

<CardListPage>
	<div class="mb-2">
        {#if !editing}
		<button disabled={loading} class="btn-sm rounded-md variant-filled-success" onclick={() => { saveConfig() }}>
			Save Config
		</button>
		<button disabled={loading} class="btn-sm rounded-md variant-filled-warning" onclick={() => { aclEditJSON = makeJson(acl); editing = true; }}>
			Edit Config
		</button>
		<button disabled={loading} class="btn-sm rounded-md variant-filled-secondary " onclick={() => { loadConfig() }}>
			Load Config
		</button>
        {:else}
		<button disabled={loading} class="btn-sm rounded-md variant-filled-success" onclick={() => { if(aclEditJSON !== undefined) applyConfig(aclEditJSON) }}>
			Apply Config
		</button>
        {/if}
	</div>
    {#if !editing}
    <CodeBlock language="json" code={aclJSON} />
    {:else}
    <div class={isLightMode ? "" : "jse-theme-dark" }>
    <JSONEditor mode={Mode.text} bind:content={aclEditJSON} onChange={(updatedContent) => {
        if(isTextContent(updatedContent)){
            aclEditJSON = updatedContent
        }
    }} />
    </div>
    {/if}
</CardListPage>
