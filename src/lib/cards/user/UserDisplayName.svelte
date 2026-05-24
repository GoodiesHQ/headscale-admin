<script lang="ts">
	import type { User } from '$lib/common/types';
	import CardListEntry from '../CardListEntry.svelte';
	import { _ } from 'svelte-i18n';

	type ItemCreatedAtProps = {
		user: User,
	}

	let { user = $bindable() }: ItemCreatedAtProps = $props()

</script>

<CardListEntry title={$_('cards.displayName')}>
	{user.displayName}
</CardListEntry>