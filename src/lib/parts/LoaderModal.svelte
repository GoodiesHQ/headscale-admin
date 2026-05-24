<script lang="ts">
	import { getModalStore } from "@skeletonlabs/skeleton";

    type LoaderModalProps = {
        title: string,
        body: string,
        callback: (data: string) => boolean,
    }    
    let { title, body, callback }: LoaderModalProps = $props()

    let data = $state('')
    let errorMessage = $state('')

    const ModalStore = getModalStore()

    function cancel() {
        ModalStore.close()
    }
    
    function save() {
        try {
            if(callback(data) === true){
                ModalStore.close()
            }
        } catch(err) {
            errorMessage = `${err}`
        }
    }

</script>

<div class="modal-example-form card p-4 w-modal shadow-xl space-y-4">
    <header class="text-2xl font-bold">{title}</header>
    <article>{body}</article>
    <textarea 
        id="loader-modal-data"
        name="loader-modal-data"
        class="input rounded-md"
        rows=10
        onchange={() => { errorMessage = '' }}
        bind:value={data}>
    </textarea>
    <footer class="modal-footer flex items-center justify-between border border-surface-500 p-4 rounded-container-token">
        <span class="text-error-400 dark:text-error-200">{errorMessage}</span>
        <div class="flex space-x-2">
            <button class="btn rounded-md variant-soft-error" onclick={cancel}>Cancel</button>
            <button class="btn rounded-md variant-soft-success" onclick={save}>Save</button>
        </div>
    </footer>
</div>