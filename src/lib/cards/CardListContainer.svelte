<script>
	let { children } = $props()
</script>

<div class="grid grid-cols-1 bg-white dark:bg-slate-800 rounded-md p-5">
	{@render children()}
</div>
