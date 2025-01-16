<script lang="ts">
	import RawMdiWindowClose from '~icons/mdi/window-close';

	type CloseBtnProps = {
		closeable: Closeable,
	}
	let { closeable }: CloseBtnProps = $props()

	interface Closeable {
		close: () => void;
	}
</script>

<button
	class="btn btn-icon pt-8"
	onclick={() => {
		closeable.close();
	}}
>
	<RawMdiWindowClose />
</button>
