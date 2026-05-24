<script lang="ts">
	import { AccordionItem } from '@skeletonlabs/skeleton';

	import { getUserDisplay, type User } from '$lib/common/types';

	import CardListEntry from '../CardListEntry.svelte';
	import UserInfo from './UserInfo.svelte';
	import OnlineUserIndicator from '$lib/parts/OnlineUserIndicator.svelte';
	import { _ } from 'svelte-i18n';

	type UserListCardProps = {
		user: User,
		open?: boolean,
	}
	let { user = $bindable(), open = $bindable(false) }: UserListCardProps = $props()
</script>

<AccordionItem
	{open}
	id={user.id}
	class="backdrop-blur-xl backdrop-brightness-100 bg-surface-50-900-token border border-surface-500/30 rounded-md"
	padding="py-4 px-4"
	regionControl="!rounded-none"
>
	<svelte:fragment slot="lead">
		<OnlineUserIndicator {user} />
	</svelte:fragment>
	<svelte:fragment slot="summary">
		<div class="grid">
			<CardListEntry title={`${$_('common.id')}: ${user.id}`}>
				<span class="font-bold">
					{getUserDisplay(user)}
				</span>
			</CardListEntry>
		</div>
	</svelte:fragment>
	<svelte:fragment slot="content">
		<UserInfo {user} />
	</svelte:fragment>
</AccordionItem>
