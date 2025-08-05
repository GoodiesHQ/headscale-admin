import { debug } from '$lib/common/debug';
import type { GrpcConfig } from '$lib/common/types';

/**
 * Enhanced gRPC debugging utilities
 */
export class GrpcDebugger {
    
    /**
     * Test basic connectivity to the gRPC server
     */
    static async testBasicConnectivity(config: GrpcConfig): Promise<{
        success: boolean;
        details: string[];
        recommendations: string[];
    }> {
        const details: string[] = [];
        const recommendations: string[] = [];
        let success = true;

        const protocol = config.enableTls ? 'https' : 'http';
        const baseUrl = `${protocol}://${config.serverAddress}:${config.port}`;
        
        details.push(`Testing connectivity to: ${baseUrl}`);

        try {
            // Test basic HTTP connectivity with proper gRPC headers
            const response = await fetch(baseUrl, {
                method: 'HEAD',
                headers: {
                    'Content-Type': 'application/grpc-web+proto',
                    'Accept': 'application/grpc-web+proto'
                },
                signal: AbortSignal.timeout(5000)
            });

            details.push(`HTTP HEAD request status: ${response.status}`);
            details.push(`Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);

            if (response.status === 404) {
                details.push('✅ Server is reachable (404 is expected for gRPC endpoints)');
            } else if (response.status === 415) {
                details.push('✅ Server is reachable (415 indicates gRPC-Web proxy is working)');
                details.push('💡 Content-type error is expected for HEAD requests to gRPC endpoints');
            } else if (response.status >= 200 && response.status < 300) {
                details.push('✅ Server is reachable');
            } else if (response.status >= 400 && response.status < 500) {
                details.push(`⚠️ Client error: ${response.status} (this may be normal for gRPC endpoints)`);
                // Don't mark as failure for 4xx on gRPC endpoints
            } else {
                details.push(`⚠️ Unexpected status code: ${response.status}`);
                success = false;
                recommendations.push('Check if the server is running and accessible');
            }

        } catch (error) {
            success = false;
            details.push(`❌ Connectivity test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            
            if (error instanceof Error) {
                if (error.message.includes('CORS')) {
                    recommendations.push('Configure CORS headers in your gRPC-Web proxy');
                } else if (error.message.includes('timeout')) {
                    recommendations.push('Check network connectivity and increase timeout');
                } else if (error.message.includes('Failed to fetch')) {
                    recommendations.push('Verify server address and port are correct');
                }
            }
        }

        return { success, details, recommendations };
    }

    /**
     * Analyze gRPC response data
     */
    static analyzeResponseData(data: ArrayBuffer): {
        analysis: string[];
        isLikelyGrpcWeb: boolean;
        isLikelyHttp: boolean;
        recommendations: string[];
    } {
        const analysis: string[] = [];
        const recommendations: string[] = [];
        
        analysis.push(`Response size: ${data.byteLength} bytes`);

        if (data.byteLength === 0) {
            analysis.push('❌ Empty response');
            recommendations.push('Check if the gRPC service is properly configured');
            return { analysis, isLikelyGrpcWeb: false, isLikelyHttp: false, recommendations };
        }

        // Check if it looks like gRPC-Web
        let isLikelyGrpcWeb = false;
        if (data.byteLength >= 5) {
            const view = new DataView(data);
            const compressionFlag = view.getUint8(0);
            const messageLength = view.getUint32(1, false);
            
            analysis.push(`First byte (compression flag): ${compressionFlag}`);
            analysis.push(`Declared message length: ${messageLength}`);
            
            if ((compressionFlag === 0 || compressionFlag === 1) && 
                messageLength > 0 && messageLength <= data.byteLength) {
                isLikelyGrpcWeb = true;
                analysis.push('✅ Looks like valid gRPC-Web frame');
            } else {
                analysis.push('⚠️ Does not look like standard gRPC-Web frame');
            }
        }

        // Check if it looks like HTTP response
        const textDecoder = new TextDecoder('utf-8', { fatal: false });
        const text = textDecoder.decode(data.slice(0, Math.min(200, data.byteLength)));
        const isLikelyHttp = text.includes('HTTP/') || text.includes('<html') || text.includes('<!DOCTYPE');
        
        if (isLikelyHttp) {
            analysis.push('❌ Response appears to be HTTP/HTML, not gRPC');
            analysis.push(`Response text: ${text.substring(0, 100)}...`);
            recommendations.push('Ensure you are connecting to a gRPC-Web proxy, not a regular HTTP server');
            recommendations.push('Check if Envoy or similar gRPC-Web proxy is properly configured');
        }

        // Hex dump for debugging
        const hexDump = this.createHexDump(new Uint8Array(data), 32);
        analysis.push(`Hex dump (first 32 bytes): ${hexDump}`);

        return { analysis, isLikelyGrpcWeb, isLikelyHttp, recommendations };
    }

    /**
     * Create hex dump for debugging
     */
    private static createHexDump(data: Uint8Array, maxBytes: number = 64): string {
        const bytes = data.slice(0, maxBytes);
        const hex = Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join(' ');

        const ascii = Array.from(bytes)
            .map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.')
            .join('');

        return `${hex} | ${ascii}`;
    }

    /**
     * Generate configuration recommendations based on common issues
     */
    static getConfigurationRecommendations(config: GrpcConfig): string[] {
        const recommendations: string[] = [];

        // Check server address
        if (!config.serverAddress) {
            recommendations.push('❌ Server address is required');
        } else if (config.serverAddress === 'localhost' || config.serverAddress.startsWith('127.')) {
            if (config.port !== 8080) {
                recommendations.push('💡 For localhost, consider using port 8080 (Envoy proxy)');
            }
            if (config.enableTls) {
                recommendations.push('💡 For localhost development, consider disabling TLS');
            }
        }

        // Check port
        if (config.port === 50443) {
            recommendations.push('💡 Port 50443 is typically for direct gRPC. Consider using 8080 for gRPC-Web proxy');
        }

        // Check API key
        if (!config.apiKey) {
            recommendations.push('❌ API key is required for authentication');
        }

        // Check timeout
        if (config.timeoutMs < 5000) {
            recommendations.push('💡 Consider increasing timeout to at least 5000ms for better reliability');
        }

        return recommendations;
    }
}
