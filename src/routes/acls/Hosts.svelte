<script lang="ts">

	import CardListPage from "$lib/cards/CardListPage.svelte";
	import type { ACLBuilder } from "$lib/common/acl";

    export let acl: ACLBuilder;

</script>
<CardListPage>
    Test
</CardListPage> 