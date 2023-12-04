<script lang="ts">
	import RawMdiWindowClose from '~icons/mdi/window-close';

	interface Closeable {
		close: () => void;
	}

	export let closeable: Closeable;
</script>

<button
	class="btn btn-icon pt-8"
	on:click={() => {
		closeable.close();
	}}
>
	<RawMdiWindowClose />
</button>
