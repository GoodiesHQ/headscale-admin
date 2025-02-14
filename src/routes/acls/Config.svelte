<script lang="ts">
	import CardListPage from "$lib/cards/CardListPage.svelte";
	import { ACLBuilder, type ACL } from "$lib/common/acl.svelte";
    import { isTextContent, JSONEditor, Mode, type TextContent } from 'svelte-jsoneditor'
    import 'svelte-jsoneditor/themes/jse-theme-dark.css'
	import { getPolicy, setPolicy } from "$lib/common/api";
	import { debug } from "$lib/common/debug";
	import { toastError, toastSuccess } from "$lib/common/funcs";
	import { CodeBlock, /*getModalStore,*/ getToastStore, modeCurrent, type ModalSettings } from "@skeletonlabs/skeleton";
    
	// import LoaderModal from "$lib/parts/LoaderModal.svelte";
    import JWCC from 'json5'
	import { onMount } from "svelte";
	import { get } from "svelte/store";

    const ToastStore = getToastStore()
    let isLightMode = $state(get(modeCurrent))
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

	let {acl = $bindable(), loading = $bindable(false)}: {acl: ACLBuilder, loading?: boolean} = $props();
	const aclJSON = $derived(acl.JSON(2))
    let editing = $state(false)
    let aclEditJSON = $state<TextContent>({text:""})

    /*
    function callback(data: string): boolean {
        const policy = JWCC.parse<ACL>(data);
        acl = ACLBuilder.fromPolicy(policy)
        return true
    }
    */

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

    function resetConfig() {
        acl = ACLBuilder.defaultACL()
    }

    function loadConfig() {
        loading = true
		getPolicy().then(policy => {
			acl = ACLBuilder.fromPolicy(JWCC.parse<ACL>(policy))
		}).catch(reason => {
			debug("failed to get policy:", reason)
			toastError(`Unable to get policy from server.`, ToastStore, reason)
		}).finally(() => {
            loading = false
        })
        // ModalStore.trigger(modal)
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
		<button disabled={loading || editing} class="btn-sm rounded-md variant-filled-success disabled:opacity-50 w-32" onclick={() => { saveConfig() }}>
			Save Config
		</button>
		<button disabled={loading || editing} class="btn-sm rounded-md variant-filled-secondary disabled:opacity-50 w-32" onclick={() => { loadConfig() }}>
			Load Config
		</button>
		<button 
            disabled={loading}
            class="btn-sm rounded-md variant-filled-warning w-32 disabled:opacity-50"
            onclick={() => {
                if(editing){
                    applyConfig(aclEditJSON)
                } else {
                    aclEditJSON.text = acl.JSON(2); 
                    editing = true; 
                }
            }}
        >
            {#if editing}
                Apply Config
            {:else}
                Edit Config
            {/if}
		</button>
		<button disabled={loading || editing} class="btn-sm rounded-md variant-filled-error disabled:opacity-50 w-32" onclick={() => { resetConfig() }}>
			Reset Config
		</button>
		<!--button disabled={loading} class="btn-sm rounded-md variant-filled-success" onclick={() => { if(aclEditJSON !== undefined) applyConfig(aclEditJSON) }}>
			Apply Config
		</button-->
	</div>
    {#if !editing}
    <CodeBlock language="json" code={aclJSON} />
    {:else}
    <div class={isLightMode ? "" : "jse-theme-dark" }>
    <JSONEditor parser={JWCC} mode={Mode.text} tabSize={4} bind:content={aclEditJSON} onChange={(updatedContent) => {
        if(isTextContent(updatedContent)){
            aclEditJSON = updatedContent
        }
    }} />
    </div>
    {/if}
</CardListPage>
