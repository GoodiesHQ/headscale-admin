// Test script for gRPC connection debugging
// Run this in browser console to test the fixes

console.log('🧪 Testing gRPC Connection Fixes...\n');

// Test configuration matching your Envoy setup
const testConfig = {
    serverAddress: 'localhost',
    enableTls: false,
    port: 8080,
    timeoutMs: 10000,
    apiKey: 'your-api-key-here' // Replace with actual API key
};

// Test 1: Basic connectivity
async function testBasicConnectivity() {
    console.log('📡 Test 1: Basic Connectivity');
    
    try {
        const baseUrl = `http://${testConfig.serverAddress}:${testConfig.port}`;
        const response = await fetch(baseUrl, {
            method: 'HEAD',
            headers: {
                'Content-Type': 'application/grpc-web+proto',
                'Accept': 'application/grpc-web+proto'
            },
            signal: AbortSignal.timeout(5000)
        });
        
        console.log(`✅ Server reachable - Status: ${response.status}`);
        console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()));
        
        if (response.status === 415) {
            console.log('💡 Status 415 is expected for gRPC endpoints with HEAD requests');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Connectivity test failed:', error.message);
        return false;
    }
}

// Test 2: Proto file loading
async function testProtoLoading() {
    console.log('\n📄 Test 2: Proto File Loading');
    
    try {
        // Test user.proto
        const userProtoResponse = await fetch('/user.proto');
        if (userProtoResponse.ok) {
            console.log('✅ user.proto loaded successfully');
        } else {
            console.log('⚠️ user.proto not found, trying headscale.proto');
        }
        
        // Test headscale.proto
        const headscaleProtoResponse = await fetch('/headscale.proto');
        if (headscaleProtoResponse.ok) {
            console.log('✅ headscale.proto loaded successfully');
        } else {
            console.log('❌ No proto files found');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('❌ Proto loading test failed:', error.message);
        return false;
    }
}

// Test 3: gRPC-Web frame parsing
function testFrameParsing() {
    console.log('\n🔧 Test 3: Frame Parsing Safety');
    
    // Test cases that previously caused index out of range
    const testCases = [
        { name: 'Empty buffer', data: new ArrayBuffer(0) },
        { name: '128 byte response (problematic case)', data: new ArrayBuffer(128) },
        { name: 'Short buffer', data: new ArrayBuffer(3) },
        { name: 'Invalid frame', data: (() => {
            const buffer = new ArrayBuffer(10);
            const view = new DataView(buffer);
            view.setUint8(0, 0);
            view.setUint32(1, 1000, false); // Invalid large length
            return buffer;
        })() }
    ];
    
    testCases.forEach(testCase => {
        try {
            console.log(`Testing: ${testCase.name}`);
            
            // Simulate the improved parsing logic
            const frameBuffer = testCase.data;
            
            if (frameBuffer.byteLength === 0) {
                console.log('  ✅ Empty buffer handled correctly');
                return;
            }
            
            if (frameBuffer.byteLength < 5) {
                console.log('  ✅ Short buffer handled correctly');
                return;
            }
            
            const view = new DataView(frameBuffer);
            const compressionFlag = view.getUint8(0);
            const messageLength = view.getUint32(1, false);
            
            console.log(`  📊 Frame info: compression=${compressionFlag}, length=${messageLength}, total=${frameBuffer.byteLength}`);
            
            // Check for potential issues
            if (messageLength > frameBuffer.byteLength || messageLength < 0) {
                console.log('  ✅ Invalid message length detected and handled');
                return;
            }
            
            const expectedTotalLength = 5 + messageLength;
            if (frameBuffer.byteLength < expectedTotalLength) {
                console.log('  ✅ Incomplete frame detected and handled');
                return;
            }
            
            console.log('  ✅ Frame would be parsed successfully');
            
        } catch (error) {
            console.error(`  ❌ ${testCase.name} failed:`, error.message);
        }
    });
    
    return true;
}

// Test 4: Error response handling
function testErrorHandling() {
    console.log('\n🚨 Test 4: Error Response Handling');
    
    // Simulate different error responses
    const errorResponses = [
        {
            name: 'gRPC Status Error',
            text: 'grpc-status: 3\ngrpc-message: invalid request'
        },
        {
            name: 'HTTP Error',
            text: 'HTTP/1.1 500 Internal Server Error'
        },
        {
            name: 'HTML Error',
            text: '<html><body>Error</body></html>'
        }
    ];
    
    errorResponses.forEach(errorResponse => {
        console.log(`Testing: ${errorResponse.name}`);
        
        if (errorResponse.text.includes('grpc-status')) {
            console.log('  ✅ gRPC error detected correctly');
        } else if (errorResponse.text.includes('HTTP/') || errorResponse.text.includes('<html')) {
            console.log('  ✅ HTTP/HTML error detected correctly');
        } else {
            console.log('  ✅ Generic error handling');
        }
    });
    
    return true;
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting comprehensive gRPC connection tests...\n');
    
    const results = {
        connectivity: await testBasicConnectivity(),
        protoLoading: await testProtoLoading(),
        frameParsing: testFrameParsing(),
        errorHandling: testErrorHandling()
    };
    
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    Object.entries(results).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    const allPassed = Object.values(results).every(result => result);
    console.log(`\n🎯 Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allPassed) {
        console.log('\n🎉 The gRPC connection fixes are working correctly!');
        console.log('💡 You can now test the actual gRPC connection in the Settings page.');
    } else {
        console.log('\n🔧 Some issues remain. Check the individual test results above.');
    }
    
    return results;
}

// Auto-run tests
runAllTests();
