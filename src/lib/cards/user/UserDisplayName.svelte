<script lang="ts">
	import type { User } from '$lib/common/types';
	import CardListEntry from '../CardListEntry.svelte';

	type ItemCreatedAtProps = {
		user: User,
	}

	let { user = $bindable() }: ItemCreatedAtProps = $props()

</script>

<CardListEntry title="Display Name:">
	{user.displayName}
</CardListEntry>