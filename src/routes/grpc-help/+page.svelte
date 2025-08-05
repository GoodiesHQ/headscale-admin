<script lang="ts">
	import Page from '$lib/page/Page.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';
	import { App } from '$lib/States.svelte';

	let testUrl = $state('');
	let testResult = $state('');
	let testing = $state(false);

	async function testBasicConnectivity() {
		if (!testUrl.trim()) {
			testResult = 'Please enter a URL to test';
			return;
		}

		testing = true;
		testResult = 'Testing connection...';

		try {
			const response = await fetch(testUrl, {
				method: 'HEAD',
				signal: AbortSignal.timeout(5000),
			});

			if (response.ok) {
				testResult = `✅ Server accessible (status: ${response.status})`;
			} else {
				testResult = `⚠️ Server response error (status: ${response.status})`;
			}
		} catch (error) {
			if (error instanceof Error) {
				if (error.name === 'AbortError') {
					testResult = '❌ Connection timeout - Check server address and network connection';
				} else if (error.message.includes('CORS')) {
					testResult = '⚠️ CORS error - Server may need CORS headers configuration';
				} else {
					testResult = `❌ Connection failed: ${error.message}`;
				}
			} else {
				testResult = '❌ Unknown error';
			}
		} finally {
			testing = false;
		}
	}

	function setTestUrl(url: string) {
		testUrl = url;
		testBasicConnectivity();
	}

	// Envoy configuration generator
	let envoyConfig = $state({
		headscaleServer: App.grpcConfig.value.serverAddress || 'example.com',
		headscalePort: 50443,
		proxyPort: 8080
	});

	const generatedEnvoyConfig = $derived(`static_resources:
  listeners:
  - name: listener_0
    address:
      socket_address: { address: 0.0.0.0, port_value: ${envoyConfig.proxyPort} }
    filter_chains:
    - filters:
      - name: envoy.filters.network.http_connection_manager
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
          codec_type: auto
          stat_prefix: ingress_http
          route_config:
            name: local_route
            virtual_hosts:
            - name: local_service
              domains: ["*"]
              routes:
              - match: { prefix: "/" }
                route:
                  cluster: headscale_service
                  timeout: 0s
                  max_stream_duration:
                    grpc_timeout_header_max: 0s
              cors:
                allow_origin_string_match:
                - prefix: "*"
                allow_methods: GET, PUT, DELETE, POST, OPTIONS
                allow_headers: keep-alive,user-agent,cache-control,content-type,content-transfer-encoding,custom-header-1,x-accept-content-transfer-encoding,x-accept-response-streaming,x-user-agent,x-grpc-web,grpc-timeout,authorization
                max_age: "1728000"
                expose_headers: custom-header-1,grpc-status,grpc-message
          http_filters:
          - name: envoy.extensions.filters.http.grpc_web.v3.GrpcWeb
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.filters.http.grpc_web.v3.GrpcWeb
          - name: envoy.extensions.filters.http.cors.v3.Cors
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.filters.http.cors.v3.Cors
          - name: envoy.extensions.filters.http.router.v3.Router
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
  clusters:
  - name: headscale_service
    connect_timeout: 0.25s
    type: logical_dns
    http2_protocol_options: {}
    lb_policy: round_robin
    load_assignment:
      cluster_name: headscale_service
      endpoints:
      - lb_endpoints:
        - endpoint:
            address:
              socket_address:
                address: ${envoyConfig.headscaleServer}
                port_value: ${envoyConfig.headscalePort}`);

	async function copyToClipboard(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			// Could add a toast notification
		} catch (err) {
			console.error('Failed to copy: ', err);
		}
	}
</script>

<Page>
	<PageHeader title="gRPC Configuration Help" />

	<div class="max-w-4xl mx-auto p-6 space-y-6">
		<!-- Current Configuration Status -->
		<div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
			<h2 class="text-xl font-semibold mb-4">Current gRPC Configuration Status</h2>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-2">
					<div class="flex justify-between">
						<span class="text-sm font-medium">Server Address:</span>
						<span class="text-sm {App.grpcConfig.value.serverAddress ? 'text-green-600' : 'text-red-600'}">
							{App.grpcConfig.value.serverAddress || 'Not configured'}
						</span>
					</div>
					<div class="flex justify-between">
						<span class="text-sm font-medium">Port:</span>
						<span class="text-sm">{App.grpcConfig.value.port}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-sm font-medium">TLS:</span>
						<span class="text-sm">{App.grpcConfig.value.enableTls ? 'Enabled' : 'Disabled'}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-sm font-medium">API Key:</span>
						<span class="text-sm {App.grpcConfig.value.apiKey ? 'text-green-600' : 'text-red-600'}">
							{App.grpcConfig.value.apiKey ? 'Configured' : 'Not configured'}
						</span>
					</div>
				</div>

				<div class="space-y-2">
					<div class="text-sm font-medium">Configuration Status:</div>
					<div class="text-sm {App.isGrpcConfigured ? 'text-green-600' : 'text-yellow-600'}">
						{App.isGrpcConfigured ? '✅ gRPC Configured' : '⚠️ gRPC Not Fully Configured'}
					</div>
					{#if App.grpcConnectionStatus.value.lastTested}
						<div class="text-sm">
							<span class="font-medium">Last Tested:</span>
							<span class="{App.grpcConnectionStatus.value.connected ? 'text-green-600' : 'text-red-600'}">
								{App.grpcConnectionStatus.value.connected ? 'Success' : 'Failed'}
							</span>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Connection Test Tool -->
		<div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
			<h2 class="text-xl font-semibold mb-4">Connection Test Tool</h2>

			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium mb-2">Test URL:</label>
					<div class="flex space-x-2">
						<input
							class="flex-1 input"
							type="text"
							placeholder="http://localhost:8080"
							bind:value={testUrl}
						/>
						<button
							class="btn variant-filled-primary"
							onclick={testBasicConnectivity}
							disabled={testing}
						>
							{testing ? 'Testing...' : 'Test Connection'}
						</button>
					</div>
				</div>

				<div class="flex flex-wrap gap-2">
					<button class="btn btn-sm variant-ghost" onclick={() => setTestUrl('http://localhost:8080')}>
						Local Envoy (8080)
					</button>
					<button class="btn btn-sm variant-ghost" onclick={() => setTestUrl('http://localhost:8000')}>
						Local grpcwebproxy (8000)
					</button>
					<button class="btn btn-sm variant-ghost" onclick={() => setTestUrl(`http://${App.grpcConfig.value.serverAddress}:${App.grpcConfig.value.port}`)}>
						Current Config
					</button>
				</div>

				{#if testResult}
					<div class="p-3 rounded border bg-gray-50 dark:bg-gray-700">
						<div class="text-sm">{testResult}</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Envoy Configuration Generator -->
		<div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
			<h2 class="text-xl font-semibold mb-4">Envoy Configuration Generator</h2>

			<div class="space-y-4">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium mb-1">Headscale Server Address:</label>
						<input
							class="input w-full"
							type="text"
							bind:value={envoyConfig.headscaleServer}
							placeholder="example.com"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium mb-1">Headscale gRPC Port:</label>
						<input
							class="input w-full"
							type="number"
							bind:value={envoyConfig.headscalePort}
							placeholder="50443"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium mb-1">Proxy Listen Port:</label>
						<input
							class="input w-full"
							type="number"
							bind:value={envoyConfig.proxyPort}
							placeholder="8080"
						/>
					</div>
				</div>

				<div>
					<div class="flex justify-between items-center mb-2">
						<h3 class="text-lg font-medium">Generated envoy.yaml Configuration:</h3>
						<button
							class="btn btn-sm variant-filled-secondary"
							onclick={() => copyToClipboard(generatedEnvoyConfig)}
						>
							Copy Configuration
						</button>
					</div>
					<div class="bg-gray-100 dark:bg-gray-700 p-4 rounded text-sm max-h-96 overflow-y-auto">
						<pre class="whitespace-pre-wrap">{generatedEnvoyConfig}</pre>
					</div>
				</div>

				<div class="bg-blue-50 dark:bg-blue-900 p-4 rounded">
					<h4 class="font-medium text-blue-900 dark:text-blue-100 mb-2">Setup Steps:</h4>
					<ol class="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
						<li>Save the above configuration as <code>envoy.yaml</code></li>
						<li>Run: <code>docker run -d -p {envoyConfig.proxyPort}:{envoyConfig.proxyPort} -v $(pwd)/envoy.yaml:/etc/envoy/envoy.yaml envoyproxy/envoy:v1.28-latest</code></li>
						<li>Configure in settings: Server address <code>localhost</code>, Port <code>{envoyConfig.proxyPort}</code>, TLS disabled</li>
					</ol>
				</div>
			</div>
		</div>

		<!-- Configuration Guide -->
		<div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
			<h2 class="text-xl font-semibold mb-4">Alternative Configuration Methods</h2>

			<div class="space-y-6">
				<div>
					<h3 class="text-lg font-medium mb-2">Method 2: Using grpcwebproxy</h3>
					<div class="bg-gray-100 dark:bg-gray-700 p-4 rounded text-sm">
						<pre class="whitespace-pre-wrap">grpcwebproxy \\
  --backend_addr={envoyConfig.headscaleServer}:{envoyConfig.headscalePort} \\
  --run_tls_server=false \\
  --allow_all_origins \\
  --backend_tls_noverify</pre>
					</div>
					<p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
						Then use in settings: localhost:8000, TLS disabled
					</p>
				</div>

				<div>
					<h3 class="text-lg font-medium mb-2">Common Issues</h3>
					<ul class="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
						<li><strong>Failed to fetch:</strong> Usually indicates no gRPC-Web proxy configured</li>
						<li><strong>CORS error:</strong> Need to configure CORS headers in proxy</li>
						<li><strong>Connection timeout:</strong> Check server address and port are correct</li>
						<li><strong>401 error:</strong> Check if API Key is correct</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</Page>
