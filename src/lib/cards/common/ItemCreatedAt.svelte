<script lang="ts">
	import CardListEntry from '../CardListEntry.svelte';
	import type { Named } from '$lib/common/types';
	import { dateToStr } from '$lib/common/funcs';
	import { _ } from 'svelte-i18n';

	type ItemCreatedAtProps = {
		item: Named,
	}

	let { item = $bindable() }: ItemCreatedAtProps = $props()

</script>

<CardListEntry title={$_('cards.created')}>
	{dateToStr(item.createdAt)}
</CardListEntry>
