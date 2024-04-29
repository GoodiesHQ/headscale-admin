<script lang="ts">
	import { AccordionItem, getToastStore } from '@skeletonlabs/skeleton';
	import type { ACLBuilder } from '$lib/common/acl';
	import type { User } from '$lib/common/types';
	import { toastSuccess, toastError } from '$lib/common/funcs';
	import { MultiSelect } from 'svelte-multiselect';
	import Delete from '$lib/parts/Delete.svelte';
	import CardListContainer from '$lib/cards/CardListContainer.svelte';
	import { debug } from '$lib/common/debug';

	import RawMdiTag from '~icons/mdi/tag';
	import Text from '$lib/parts/Text.svelte';

	const ToastStore = getToastStore();

	export let acl: ACLBuilder;
	export let users: User[];
	export let tag: string;
	export let open: boolean = false;

	$: tagOwners = acl.getTagOwners(tag);
	$: tagNewName = '';
	$: loading = false;
	$: deleting = false;

	function renameTag() {
		try {
			if (tag !== tagNewName) {
				acl = acl.renameTag(tag, tagNewName);
				toastSuccess(`Group renamed from '${tag}' to '${tagNewName}'`, ToastStore);
				tag = tagNewName;
			}
			return true;
		} catch (e) {
			if (e instanceof Error) {
				toastError('', ToastStore, e);
			}
			debug(e)
		}
	}

	function deleteTag() {
		try{

		}catch(e){
			if(e instanceof Error){
				toastError('', ToastStore, e);
			}
			debug(e);
		}
	}
</script>

<ListEntry id="1" bind:name={tag} logo={RawMdiTag}>
	Testing 123
</ListEntry>
