# gRPC Configuration Guide

## Problem Diagnosis

If you encounter "Failed to fetch" errors when testing gRPC connections, this is usually caused by the following reasons:

### 1. Headscale Server Configuration Issues

**Problem**: Headscale only provides gRPC API by default, not gRPC-Web API
**Solution**: You need to configure a gRPC-Web proxy

#### Method A: Using Envoy Proxy (Recommended)

Create an `envoy.yaml` configuration file:

```yaml
static_resources:
  listeners:
  - name: listener_0
    address:
      socket_address: { address: 0.0.0.0, port_value: 8080 }
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
                address: example.com
                port_value: 50443
```

Start Envoy:
```bash
docker run -d -p 8080:8080 -v $(pwd)/envoy.yaml:/etc/envoy/envoy.yaml envoyproxy/envoy:v1.22-latest
```

Then use in settings:
- Server Address: `localhost` (or your server address)
- Port: `8080`
- Enable TLS: `false` (Envoy handles TLS)

#### Method B: Using grpcwebproxy

```bash
# Install grpcwebproxy
go install github.com/improbable-eng/grpc-web/go/grpcwebproxy@latest

# Start proxy
grpcwebproxy \
  --backend_addr=localhost:50443 \
  --run_tls_server=false \
  --allow_all_origins \
  --backend_tls_noverify
```

### 2. Network Connection Issues

**Check items**:
- Ensure Headscale server is accessible
- Check firewall settings
- Verify ports are correctly opened

**Test connection**:
```bash
# Test basic connection
telnet example.com 50443

# Or use curl to test HTTP connection
curl -v http://example.com:8080
```

### 3. CORS Issues

If you see CORS errors, you need to configure CORS headers in the gRPC-Web proxy.

### 4. TLS Configuration Issues

**If TLS is enabled**:
- Ensure certificates are valid
- Check if certificates contain the correct domain name
- Consider temporarily disabling TLS in development environment

## Recommended Configuration

### Development Environment
```
Server Address: localhost
Port: 8080 (Envoy proxy port)
Enable TLS: false
Timeout: 10000ms
API Key: Your Headscale API Key
```

### Production Environment
```
Server Address: your-headscale-server.com
Port: 443 (through reverse proxy)
Enable TLS: true
Timeout: 10000ms
API Key: Your Headscale API Key
```

## Troubleshooting Steps

1. **Verify Headscale Server Running Status**
   ```bash
   # Check gRPC port
   netstat -tlnp | grep 50443
   ```

2. **Test REST API Connection**
   - Ensure existing REST API functionality works properly
   - This verifies basic network connectivity

3. **Check Browser Developer Tools**
   - View error details in the Network tab
   - Check JavaScript errors in the Console

4. **Step-by-step Testing**
   - First test basic HTTP connection
   - Then test gRPC-Web proxy
   - Finally test complete gRPC functionality

## Current Implementation Notes

The current gRPC client implementation is a simplified version, mainly for demonstrating concepts. In production environments, you need:

1. Configure appropriate gRPC-Web proxy
2. Use correct protobuf encoding
3. Implement complete error handling
4. Add retry mechanisms

## Contact Support

If you still encounter issues, please provide the following information:
- Headscale version
- Server configuration
- Complete error message content
- Network request details from browser developer tools
