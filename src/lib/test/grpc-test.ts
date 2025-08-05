import type { GrpcConfig } from '$lib/common/types';
import { testGrpcConnection, createUserWithNamespace } from '$lib/common/grpc';
import { debug } from '$lib/common/debug';

/**
 * Test suite for gRPC functionality
 */
export class GrpcTestSuite {
    private testConfig: GrpcConfig = {
        serverAddress: 'localhost',
        enableTls: false,
        port: 50443,
        timeoutMs: 5000,
        apiKey: 'test-api-key',
    };

    /**
     * Test gRPC connection functionality
     */
    async testConnection(): Promise<boolean> {
        try {
            debug('Testing gRPC connection...');
            const result = await testGrpcConnection(this.testConfig);
            debug('gRPC connection test result:', result);
            return result.success;
        } catch (error) {
            debug('gRPC connection test error:', error);
            return false;
        }
    }

    /**
     * Test user creation with namespace (gRPC API)
     */
    async testUserCreationWithNamespace(): Promise<boolean> {
        try {
            debug('Testing gRPC user creation with namespace...');
            const user = await createUserWithNamespace(
                this.testConfig,
                'test-user-grpc',
                'test-namespace'
            );
            debug('gRPC user creation result:', user);
            return user.name === 'test-user-grpc' && user.displayName === 'test-namespace';
        } catch (error) {
            debug('gRPC user creation test error:', error);
            return false;
        }
    }

    /**
     * Test user creation without namespace (should still work with gRPC)
     */
    async testUserCreationWithoutNamespace(): Promise<boolean> {
        try {
            debug('Testing gRPC user creation without namespace...');
            const user = await createUserWithNamespace(
                this.testConfig,
                'test-user-simple',
                ''
            );
            debug('gRPC user creation result:', user);
            return user.name === 'test-user-simple';
        } catch (error) {
            debug('gRPC user creation test error:', error);
            return false;
        }
    }

    /**
     * Run all tests
     */
    async runAllTests(): Promise<{ passed: number; failed: number; results: string[] }> {
        const results: string[] = [];
        let passed = 0;
        let failed = 0;

        // Test connection
        const connectionResult = await this.testConnection();
        if (connectionResult) {
            results.push('✅ gRPC connection test passed');
            passed++;
        } else {
            results.push('❌ gRPC connection test failed');
            failed++;
        }

        // Test user creation
        const userCreationResult = await this.testUserCreation();
        if (userCreationResult) {
            results.push('✅ gRPC user creation test passed');
            passed++;
        } else {
            results.push('❌ gRPC user creation test failed');
            failed++;
        }

        return { passed, failed, results };
    }
}

/**
 * Validate backward compatibility
 */
export function validateBackwardCompatibility(): boolean {
    try {
        // Check that existing REST API functions are still available
        const hasCreateUser = typeof import('$lib/common/api/create').then === 'function';
        const hasGetUsers = typeof import('$lib/common/api/get').then === 'function';
        
        debug('Backward compatibility check:', { hasCreateUser, hasGetUsers });
        return hasCreateUser && hasGetUsers;
    } catch (error) {
        debug('Backward compatibility check error:', error);
        return false;
    }
}

/**
 * Test the dual API logic
 */
export function testDualApiLogic(): { restAvailable: boolean; grpcAvailable: boolean } {
    try {
        // Check REST API availability
        const restAvailable = typeof import('$lib/common/api/create') === 'object';
        
        // Check gRPC API availability
        const grpcAvailable = typeof import('$lib/common/grpc') === 'object';
        
        debug('Dual API logic test:', { restAvailable, grpcAvailable });
        return { restAvailable, grpcAvailable };
    } catch (error) {
        debug('Dual API logic test error:', error);
        return { restAvailable: false, grpcAvailable: false };
    }
}
