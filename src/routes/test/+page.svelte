<script lang="ts">
	import { onMount } from 'svelte';
	import { App } from '$lib/States.svelte';
	import { GrpcTestSuite, validateBackwardCompatibility, testDualApiLogic } from '$lib/test/grpc-test';
	import Page from '$lib/page/Page.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';

	let testResults = $state<string[]>([]);
	let testSummary = $state<{ passed: number; failed: number } | null>(null);
	let loading = $state(false);

	async function runTests() {
		loading = true;
		testResults = [];
		
		try {
			// Test backward compatibility
			const backwardCompatible = validateBackwardCompatibility();
			testResults.push(backwardCompatible ? 
				'✅ Backward compatibility maintained' : 
				'❌ Backward compatibility broken'
			);

			// Test dual API logic
			const dualApiResult = testDualApiLogic();
			testResults.push(dualApiResult.restAvailable ? 
				'✅ REST API available' : 
				'❌ REST API not available'
			);
			testResults.push(dualApiResult.grpcAvailable ? 
				'✅ gRPC API available' : 
				'❌ gRPC API not available'
			);

			// Test gRPC configuration state
			const grpcConfigured = App.isGrpcConfigured;
			testResults.push(`ℹ️ gRPC configured: ${grpcConfigured}`);

			// Test gRPC functionality (will fail without real server, but validates code)
			const grpcTestSuite = new GrpcTestSuite();
			const grpcResults = await grpcTestSuite.runAllTests();
			testResults.push(...grpcResults.results);

			testSummary = {
				passed: grpcResults.passed + (backwardCompatible ? 1 : 0) + 
						(dualApiResult.restAvailable ? 1 : 0) + 
						(dualApiResult.grpcAvailable ? 1 : 0),
				failed: grpcResults.failed + (backwardCompatible ? 0 : 1) + 
						(dualApiResult.restAvailable ? 0 : 1) + 
						(dualApiResult.grpcAvailable ? 0 : 1)
			};
		} catch (error) {
			testResults.push(`❌ Test execution error: ${error instanceof Error ? error.message : 'Unknown error'}`);
			testSummary = { passed: 0, failed: 1 };
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		runTests();
	});
</script>

<Page>
	<PageHeader title="gRPC Implementation Test" />
	
	<div class="max-w-4xl mx-auto p-6">
		<div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
			<h2 class="text-xl font-semibold mb-4">Implementation Validation</h2>
			
			<div class="mb-6">
				<button 
					class="btn variant-filled-primary" 
					onclick={runTests}
					disabled={loading}
				>
					{loading ? 'Running Tests...' : 'Run Tests'}
				</button>
			</div>

			{#if testSummary}
				<div class="mb-6 p-4 rounded-lg {testSummary.failed === 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-yellow-100 dark:bg-yellow-900'}">
					<h3 class="font-semibold">Test Summary</h3>
					<p>Passed: {testSummary.passed} | Failed: {testSummary.failed}</p>
				</div>
			{/if}

			<div class="space-y-2">
				{#each testResults as result}
					<div class="p-3 rounded border {result.startsWith('✅') ? 'border-green-300 bg-green-50 dark:bg-green-900' : 
						result.startsWith('❌') ? 'border-red-300 bg-red-50 dark:bg-red-900' : 
						'border-blue-300 bg-blue-50 dark:bg-blue-900'}">
						{result}
					</div>
				{/each}
			</div>

			<div class="mt-8">
				<h3 class="text-lg font-semibold mb-4">Current Configuration</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="p-4 border rounded">
						<h4 class="font-medium">REST API</h4>
						<p class="text-sm text-gray-600 dark:text-gray-400">URL: {App.apiUrl.value}</p>
						<p class="text-sm text-gray-600 dark:text-gray-400">Key: {App.apiKey.value ? '***configured***' : 'not configured'}</p>
					</div>
					<div class="p-4 border rounded">
						<h4 class="font-medium">gRPC API</h4>
						<p class="text-sm text-gray-600 dark:text-gray-400">Server: {App.grpcConfig.value.serverAddress || 'not configured'}</p>
						<p class="text-sm text-gray-600 dark:text-gray-400">Port: {App.grpcConfig.value.port}</p>
						<p class="text-sm text-gray-600 dark:text-gray-400">TLS: {App.grpcConfig.value.enableTls ? 'enabled' : 'disabled'}</p>
						<p class="text-sm text-gray-600 dark:text-gray-400">Key: {App.grpcConfig.value.apiKey ? '***configured***' : 'not configured'}</p>
					</div>
				</div>
			</div>

			<div class="mt-8">
				<h3 class="text-lg font-semibold mb-4">Implementation Features</h3>
				<ul class="list-disc list-inside space-y-2 text-sm">
					<li>✅ gRPC configuration in settings page</li>
					<li>✅ gRPC connection testing</li>
					<li>✅ Conditional namespace input in user creation</li>
					<li>✅ Dual API logic (REST for username-only, gRPC for username+namespace)</li>
					<li>✅ Backward compatibility with existing REST API</li>
					<li>✅ State management for gRPC configuration</li>
					<li>✅ Error handling for both API types</li>
					<li>✅ User feedback and toast notifications</li>
				</ul>
			</div>
		</div>
	</div>
</Page>
