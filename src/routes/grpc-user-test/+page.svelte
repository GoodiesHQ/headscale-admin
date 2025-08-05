<script lang="ts">
	import { onMount } from 'svelte';
	import { App } from '$lib/States.svelte';
	import { createUserWithNamespace, getGrpcClient } from '$lib/common/grpc';
	import { debug } from '$lib/common/debug';
	import type { User } from '$lib/common/types';
	import { load } from 'protobufjs';

	let testUsername = $state('test-user-' + Date.now());
	let testNamespace = $state('test-namespace');
	let loading = $state(false);
	let result = $state<{
		success: boolean;
		user?: User;
		error?: string;
		debugLogs: string[];
	}>({ success: false, debugLogs: [] });

	// Capture debug logs
	let originalDebug: typeof debug;
	let debugLogs: string[] = [];

	onMount(() => {
		// Override debug function to capture logs
		originalDebug = debug;
		(window as any).debug = (...args: any[]) => {
			const message = args.map(arg => 
				typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
			).join(' ');
			debugLogs.push(`[${new Date().toISOString()}] ${message}`);
			originalDebug(...args);
		};

		return () => {
			// Restore original debug function
			(window as any).debug = originalDebug;
		};
	});

	async function testCreateUser() {
		loading = true;
		debugLogs = [];
		result = { success: false, debugLogs: [] };

		try {
			debug('=== Starting gRPC User Creation Test ===');
			debug(`Username: ${testUsername}`);
			debug(`Namespace: ${testNamespace}`);
			debug(`gRPC Config:`, App.grpcConfig.value);

			const user = await createUserWithNamespace(
				App.grpcConfig.value,
				testUsername,
				testNamespace
			);

			debug('=== User Creation Successful ===');
			debug('Created user:', user);

			result = {
				success: true,
				user,
				debugLogs: [...debugLogs]
			};

		} catch (error) {
			debug('=== User Creation Failed ===');
			debug('Error:', error);

			result = {
				success: false,
				error: error instanceof Error ? error.message : String(error),
				debugLogs: [...debugLogs]
			};
		} finally {
			loading = false;
		}
	}

	function clearLogs() {
		debugLogs = [];
		result = { success: false, debugLogs: [] };
	}

	async function testProtobufDefinition() {
		debugLogs = [];
		try {
			debug('=== Testing Protobuf Definition ===');

			// Load protobuf definition
			const root = await load('/user.proto');
			debug('Protobuf loaded successfully');

			// Check CreateUserRequest
			const CreateUserRequest = root.lookupType('headscale.v1.CreateUserRequest');
			debug('CreateUserRequest fields:', CreateUserRequest.fields);
			debug('Available fields:', Object.keys(CreateUserRequest.fields));

			// Test creating a message
			const testMessage = CreateUserRequest.create({
				name: 'test-user',
				display_name: 'test-namespace'
			});
			debug('Created test message:', testMessage);

			// Test encoding/decoding
			const encoded = CreateUserRequest.encode(testMessage).finish();
			debug('Encoded message size:', encoded.length);

			const decoded = CreateUserRequest.decode(encoded);
			debug('Decoded message:', decoded);

		} catch (error) {
			debug('Protobuf test error:', error);
		}
	}
</script>

<div class="container mx-auto p-6 space-y-6">
	<div class="card p-6">
		<h1 class="h2 mb-4">gRPC User Creation Test</h1>

		<div class="space-y-4">
			<div>
				<label class="label">
					<span>Username:</span>
					<input
						class="input"
						type="text"
						bind:value={testUsername}
						disabled={loading}
					/>
				</label>
			</div>

			<div>
				<label class="label">
					<span>Namespace (Display Name):</span>
					<input
						class="input"
						type="text"
						bind:value={testNamespace}
						disabled={loading}
					/>
				</label>
			</div>

			<div class="flex gap-4">
				<button
					class="btn variant-filled-primary"
					onclick={testCreateUser}
					disabled={loading || !App.isGrpcConfigured}
				>
					{loading ? 'Creating...' : 'Create User'}
				</button>

				<button
					class="btn variant-outline-secondary"
					onclick={clearLogs}
					disabled={loading}
				>
					Clear Logs
				</button>

				<button
					class="btn variant-outline-tertiary"
					onclick={testProtobufDefinition}
					disabled={loading}
				>
					Test Protobuf Definition
				</button>
			</div>

			{#if !App.isGrpcConfigured}
				<div class="alert variant-filled-warning">
					<p>⚠️ gRPC not configured. Please configure gRPC connection in Settings page first.</p>
				</div>
			{/if}
		</div>
	</div>

	{#if result.success && result.user}
		<div class="card p-6 variant-filled-success">
			<h3 class="h3 mb-4">✅ User Created Successfully</h3>
			<div class="space-y-2">
				<p><strong>ID:</strong> {result.user.id}</p>
				<p><strong>Username:</strong> {result.user.name}</p>
				<p><strong>Display Name:</strong> {result.user.displayName || '(empty)'}</p>
				<p><strong>Created At:</strong> {result.user.createdAt}</p>
				<p><strong>Provider:</strong> {result.user.provider}</p>
			</div>
		</div>
	{/if}

	{#if !result.success && result.error}
		<div class="card p-6 variant-filled-error">
			<h3 class="h3 mb-4">❌ User Creation Failed</h3>
			<p>{result.error}</p>
		</div>
	{/if}

	{#if debugLogs.length > 0}
		<div class="card p-6">
			<h3 class="h3 mb-4">Debug Logs</h3>
			<div class="bg-surface-900 text-surface-50 p-4 rounded-lg overflow-auto max-h-96">
				<pre class="text-sm">{debugLogs.join('\n')}</pre>
			</div>
		</div>
	{/if}

	<div class="card p-6">
		<h3 class="h3 mb-4">Current gRPC Configuration</h3>
		<div class="bg-surface-100 dark:bg-surface-800 p-4 rounded-lg">
			<pre class="text-sm">{JSON.stringify(App.grpcConfig.value, null, 2)}</pre>
		</div>
	</div>
</div>
