<script lang="ts">
	import type { ItemTypeName, Named } from '$lib/common/types';
	import { getTypeName, isUser, isNode } from '$lib/common/types';

	import CardListEntry from '../CardListEntry.svelte';

	import { deleteNode, deleteUser } from '$lib/common/api';
	import { getDrawerStore, getToastStore } from '@skeletonlabs/skeleton';
	import { toastError, toastSuccess } from '$lib/common/funcs';
	import Delete from '$lib/parts/Delete.svelte';
	import { App } from '$lib/States.svelte';
	import { _ } from 'svelte-i18n';

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
				toastSuccess($_('cards.deletedUser', { values: { name, id } }), ToastStore);
				DrawerStore.close()
			} else {
				let msg = $_('cards.failedDeleteUser', { values: { name, id } });
				if(App.nodes.value.some((node) => node.user.id === item.id)){
					msg += $_('cards.stillHasNodes');
				}
				toastError(msg, ToastStore);
			}
		}
		if (isNode(item)) {
			if (await deleteNode(item)) {
				toastSuccess($_('cards.deletedMachine', { values: { name, id } }), ToastStore);
				DrawerStore.close()
			} else {
				toastError($_('cards.failedDeleteMachine', { values: { name, id } }), ToastStore);
			}
		}
	}
</script>

<CardListEntry title={$_('cards.delete') + ' ' + titleCase(prefix) + ':'}>
	<Delete func={deleteItem} />
</CardListEntry>
