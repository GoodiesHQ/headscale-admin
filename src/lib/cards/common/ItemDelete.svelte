<script lang="ts">
	import type { ItemTypeName, Named } from '$lib/common/types';
	import { getTypeName, isUser, isNode } from '$lib/common/types';

	import CardListEntry from '../CardListEntry.svelte';

	import { deleteNode, deleteUser } from '$lib/common/api';
	import { getDrawerStore, getToastStore } from '@skeletonlabs/skeleton';
	import { toastError, toastSuccess } from '$lib/common/funcs';
	import Delete from '$lib/parts/Delete.svelte';
	import { App } from '$lib/States.svelte';

	type ItemDeleteProps = {
		item: Named,
	}

	let { item = $bindable() }: ItemDeleteProps = $props()

	let show = false;
	const prefix: ItemTypeName = getTypeName(item);

	const ToastStore = getToastStore();
	const DrawerStore = getDrawerStore();

	function titleCase(str: string) {
		return str.toLowerCase().replace(/\b\w/g, (s) => s.toUpperCase());
	}

	async function deleteItem() {
		show = false;
		const name = item.name;
		const id = item.id;

		if (isUser(item)) {
			if (await deleteUser(item)) {
				toastSuccess(`Deleted User "${name}" (ID: ${id})`, ToastStore);
				DrawerStore.close()
			} else {
				let msg = `Failed to Delete User "${name}" (${id}).`;
				if(App.nodes.value.some((node) => node.user.id === item.id)){
					msg += " Still has nodes."
				}
				toastError(msg, ToastStore);
			}
		}
		if (isNode(item)) {
			if (await deleteNode(item)) {
				toastSuccess(`Deleted machine "${name}" (${id})`, ToastStore);
				DrawerStore.close()
			} else {
				toastError(`Failed to Delete Nachine "${name}" (${id})`, ToastStore);
			}
		}
	}
</script>

<CardListEntry title={`Delete ${titleCase(prefix)}:`}>
	<Delete func={deleteItem} />
</CardListEntry>
