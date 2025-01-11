<script lang="ts">
    import { clickOutside } from '$lib/common/usables'
	import { Autocomplete } from '@skeletonlabs/skeleton';

    type MultiSelectProps = {
        id: string,
        items: string[],
        options: string[],
        placeholder?: string,
        onItemClick: (item: string) => void,
    }

    let {
        id = $bindable(),
        items = $bindable(),
        options,
        placeholder = "Select...",
        onItemClick,
    }: MultiSelectProps = $props()

    let selectShow = $state(false)
    let selectItem = $state('')
    let selectInputID = $derived(id + '-select-item')
	let selectOptions = $derived(
		options.map(opt => ({
			label: opt,
			value: opt,
		}))
	)

    function selectInputFocus () {
        document.getElementById(selectInputID)?.focus()
    }

    function selectHide() {
        selectShow = false
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
        <input
            id={selectInputID}
            class="input variant-soft rounded-md"
            placeholder={placeholder}
            bind:value={selectItem}
            onfocus={() => { selectShow = true; }}
        />

        <!-- onfocus={() => { groupMemberSelectShow = true; }} -->

        {#if selectShow}
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