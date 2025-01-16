<script lang="ts">
	import CardListEntry from '../CardListEntry.svelte';
	import type { Named } from '$lib/common/types';

	type ItemCreatedAtProps = {
		item: Named,
	}

	let { item = $bindable() }: ItemCreatedAtProps = $props()

</script>

<CardListEntry title="Created:">
	{new Date(item.createdAt).toLocaleString('en-Gb', {
		minute: '2-digit',
		year: 'numeric',
		month: 'short',
		day: '2-digit',
		hour: '2-digit',
		hour12: false,
	})}
</CardListEntry>
