<script lang="ts">
	import type { ItemTypeName, Named } from '$lib/common/types';
	import { getTypeName, isUser, isNode } from '$lib/common/types';

	import CardListEntry from '../CardListEntry.svelte';

	import { deleteNode, deleteUser } from '$lib/common/api';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { toastError, toastSuccess } from '$lib/common/funcs';
	import Delete from '$lib/parts/Delete.svelte';

	let show = false;
	export let item: Named;

	const prefix: ItemTypeName = getTypeName(item);

	const toastStore = getToastStore();

	function titleCase(str: string) {
		return str.toLowerCase().replace(/\b\w/g, (s) => s.toUpperCase());
	}

	async function deleteItem() {
		show = false;
		if (isUser(item)) {
			if (await deleteUser(item)) {
				toastSuccess(`Deleted User "${item.name}" (${item.id})`, toastStore);
			} else {
				toastError(`Failed to Delete User "${item.name}" (${item.id})`, toastStore);
			}
		}
		if (isNode(item)) {
			if (await deleteNode(item)) {
				toastSuccess(`Deleted machine "${item.name}" (${item.id})`, toastStore);
			} else {
				toastError(`Failed to Delete machine "${item.name}" (${item.id})`, toastStore);
			}
		}
	}
</script>

<CardListEntry title={`Delete ${titleCase(prefix)}:`}>
	<Delete func={deleteItem} />
</CardListEntry>
