<script lang="ts">
	import { toOptions } from '$lib/common/funcs';
    import { clickOutside } from '$lib/common/usables'
	import { Autocomplete } from '@skeletonlabs/skeleton';

    type MultiSelectProps = {
        id: string,
        items: string[],
        options?: string[],
        placeholder?: string,
        onItemClick: (item: string) => void,
    }

    let {
        id = $bindable(),
        items = $bindable(),
        options = undefined,
        placeholder = "Select...",
        onItemClick,
    }: MultiSelectProps = $props()

    let selectShow = $state(false)
    let selectItem = $state('')
    const selectInputID = $derived(id + '-select-item')
	const selectOptions = $derived(options === undefined ? undefined : toOptions(options))


    function selectInputFocus () {
        document.getElementById(selectInputID)?.focus()
    }

    function selectHide() {
        selectShow = false
    }

    function addItem(event: Event) {
        event.preventDefault()
        if (options === undefined && !items.includes(selectItem)){ 
            items.push(selectItem);
        }
        selectItem = ''
    }

</script>

<div use:clickOutside={selectHide}>
    <div class="pb-2">
        {#each items as item}
        <button class="chip variant-soft hover:variant-soft-error mr-1 mt-1" onclick={() => {onItemClick(item); selectInputFocus() }}>
            <span>{item}</span>
        </button>
        {/each}
    </div>
    <div>
        <form onsubmit={addItem}
        >
        <input
            id={selectInputID}
            name={selectInputID}
            class="input variant-soft rounded-md"
            placeholder={placeholder}
            bind:value={selectItem}
            onfocus={() => { selectShow = true; }}
        />
        </form>

        <!-- onfocus={() => { groupMemberSelectShow = true; }} -->

        {#if options !== undefined && selectShow}
        <div class="card w-full max-h-40 p-4 mt-2 overflow-y-auto" tabindex="-1">
            <Autocomplete
                class="rounded-md"
                bind:input={selectItem}
                options={selectOptions}
                denylist={items}
                on:selection={(evt)=> {
                    items.push(evt.detail.value)
                    selectItem = ''
                    selectInputFocus()
                }}
            />
        </div>
        {/if}
    </div>
</div>