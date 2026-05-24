<script>
	let { children } = $props()
</script>

<div class="grid grid-cols-1 bg-surface-50-900-token border border-surface-500/30 rounded-md p-5">
	{@render children()}
</div>
