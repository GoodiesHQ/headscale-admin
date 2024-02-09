<script lang="ts">
	import {
		ApiEndpointsStore,
		ApiKeyInfoStore,
		ApiKeyStore,
		ApiTtlStore,
		ApiUrlStore,
		DebugStore,
		populateApiKeyInfoStore,
		populateStores,
	} from '$lib/Stores';
	import { API_URL_MACHINE, API_URL_NODE, defaultApiEndpoints } from '$lib/common/api';
	import { debug } from '$lib/common/debug';
	import { createPopulateErrorHandler } from '$lib/common/errors';
	import {
		getTime,
		getTimeDifference,
		getTimeDifferenceColor,
		refreshApiKey,
		toastSuccess,
	} from '$lib/common/funcs';
	import type { ExpirationMessage } from '$lib/common/types';
	import Page from '$lib/page/Page.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import RawMdiContentSaveOutline from '~icons/mdi/content-save-outline';
	import RawOrbit from '~icons/mdi/orbit-variant';

</script>


<Page>
	<PageHeader title="Access Lists" />
	Coming Soon.
</Page>