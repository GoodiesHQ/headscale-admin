<script lang="ts">
	import CardListPage from "$lib/cards/CardListPage.svelte";
	import { ACLBuilder, type ACL } from "$lib/common/acl.svelte";
	import { setPolicy } from "$lib/common/api";
	import { debug } from "$lib/common/debug";
	import { toastError, toastSuccess } from "$lib/common/funcs";
	import { CodeBlock, getModalStore, getToastStore, type ModalSettings } from "@skeletonlabs/skeleton";
	import LoaderModal from "$lib/parts/LoaderModal.svelte";
    import JWCC from 'json5'

    const ToastStore = getToastStore()
    const ModalStore = getModalStore()
    
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

    let aclNew = $state('')

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

    function loadConfig() {
        ModalStore.trigger(modal)
    }

</script>

<CardListPage>
	<div class="mb-2">
		<button disabled={loading} class="btn-sm rounded-md variant-filled-success" onclick={() => { saveConfig() }}>
			Save Config
		</button>
		<button disabled={loading} class="btn-sm rounded-md variant-filled-secondary " onclick={() => { loadConfig() }}>
			Load Config
		</button>
	</div>
    <CodeBlock language="json" code={aclJSON} />
</CardListPage>
