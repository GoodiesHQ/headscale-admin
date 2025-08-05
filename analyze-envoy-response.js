// Envoy gRPC-Web Response Analysis Tool
// Run this in browser console to analyze the 128-byte response

console.log('🔍 Envoy gRPC-Web Response Analysis Tool\n');

// Simulate the 128-byte response structure based on your Envoy configuration
function analyzeEnvoyResponse() {
    console.log('📊 Analyzing Envoy gRPC-Web Response Structure:');
    
    // Envoy gRPC-Web response typically has this structure:
    // [Frame Type][Length][Data][Trailer Type][Trailer Length][Trailers]
    
    console.log('\n🔧 Envoy Configuration Analysis:');
    console.log('Your Envoy config shows:');
    console.log('- gRPC-Web filter enabled');
    console.log('- CORS properly configured');
    console.log('- Proxying to example.com:50443');
    console.log('- HTTP/2 protocol options enabled');
    
    console.log('\n📦 Expected Response Structure:');
    console.log('1. Message Frame:');
    console.log('   [0x00][4-byte length][protobuf message data]');
    console.log('2. Trailer Frame (optional):');
    console.log('   [0x80][4-byte length][grpc-status, grpc-message headers]');
    
    return true;
}

// Analyze the specific error pattern
function analyzeErrorPattern() {
    console.log('\n🚨 Error Pattern Analysis:');
    
    const errorInfo = {
        current: 'index out of range: 6 + 10 > 9',
        previous: 'index out of range: 7 + 102 > 88',
        pattern: 'offset + length > available_data'
    };
    
    console.log('Current Error:', errorInfo.current);
    console.log('Previous Error:', errorInfo.previous);
    console.log('Pattern:', errorInfo.pattern);
    
    console.log('\n💡 Analysis:');
    console.log('- Error offset changed from 7 to 6 (progress!)');
    console.log('- Length changed from 102 to 10 (much smaller)');
    console.log('- Available data is only 9 bytes at that point');
    console.log('- This suggests we\'re getting closer to the correct parsing');
    
    return errorInfo;
}

// Analyze character encoding issues
function analyzeEncodingIssues() {
    console.log('\n🔤 Character Encoding Analysis:');
    
    const observedText = 'fangzhou93楝�����  fangzhou94�������w fz96������{"ding�grpc-';
    
    console.log('Observed text:', observedText);
    console.log('\n🔍 Encoding Issues Detected:');
    
    // Analyze the garbled characters
    const issues = [
        {
            text: '楝�����',
            issue: 'Chinese character followed by replacement characters',
            cause: 'UTF-8 decoding error or truncated multi-byte sequence'
        },
        {
            text: '�������w',
            issue: 'Multiple replacement characters',
            cause: 'Invalid UTF-8 byte sequence'
        },
        {
            text: '������{',
            issue: 'Replacement chars before JSON-like structure',
            cause: 'Binary data interpreted as text'
        }
    ];
    
    issues.forEach((issue, index) => {
        console.log(`${index + 1}. "${issue.text}"`);
        console.log(`   Issue: ${issue.issue}`);
        console.log(`   Cause: ${issue.cause}`);
        console.log('');
    });
    
    console.log('💡 Solutions:');
    console.log('1. Use TextDecoder with { fatal: false } for UTF-8');
    console.log('2. Separate binary protobuf data from text display');
    console.log('3. Parse protobuf first, then extract text fields');
    console.log('4. Handle multi-byte UTF-8 sequences properly');
    
    return issues;
}

// Test different parsing strategies
function testParsingStrategies() {
    console.log('\n🎯 Testing Parsing Strategies:');
    
    // Simulate a 128-byte response with mixed content
    const strategies = [
        {
            name: 'Strategy 1: Find gRPC-Web message frame',
            description: 'Look for 0x00 followed by length, extract message',
            implementation: 'Scan for [0x00][length] pattern'
        },
        {
            name: 'Strategy 2: Skip Envoy headers',
            description: 'Skip first N bytes that might be Envoy-specific',
            implementation: 'Try offsets 0, 5, 8, 10, 12, 16'
        },
        {
            name: 'Strategy 3: Find protobuf field markers',
            description: 'Look for 0x0A (field 1, length-delimited)',
            implementation: 'Scan for protobuf field tags'
        },
        {
            name: 'Strategy 4: Parse until error',
            description: 'Parse as much as possible, stop at errors',
            implementation: 'Progressive parsing with error boundaries'
        },
        {
            name: 'Strategy 5: Trailer separation',
            description: 'Separate message frame from trailer frame',
            implementation: 'Look for 0x80 trailer marker'
        }
    ];
    
    strategies.forEach((strategy, index) => {
        console.log(`${index + 1}. ${strategy.name}`);
        console.log(`   Description: ${strategy.description}`);
        console.log(`   Implementation: ${strategy.implementation}`);
        console.log('');
    });
    
    return strategies;
}

// Generate test recommendations
function generateTestRecommendations() {
    console.log('\n📋 Test Recommendations:');
    
    const recommendations = [
        {
            priority: 'HIGH',
            action: 'Display raw hex dump in gRPC Debug page',
            reason: 'Need to see exact byte structure'
        },
        {
            priority: 'HIGH', 
            action: 'Show UTF-8 and ASCII interpretations separately',
            reason: 'Distinguish between binary and text data'
        },
        {
            priority: 'MEDIUM',
            action: 'Implement frame-by-frame parsing',
            reason: 'Envoy may send multiple frames'
        },
        {
            priority: 'MEDIUM',
            action: 'Add protobuf field analysis',
            reason: 'Understand field structure and boundaries'
        },
        {
            priority: 'LOW',
            action: 'Test with different Envoy configurations',
            reason: 'Verify if issue is Envoy-specific'
        }
    ];
    
    recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority}] ${rec.action}`);
        console.log(`   Reason: ${rec.reason}`);
        console.log('');
    });
    
    return recommendations;
}

// Envoy-specific considerations
function analyzeEnvoySpecifics() {
    console.log('\n🌐 Envoy-Specific Considerations:');
    
    console.log('Based on your Envoy configuration:');
    console.log('');
    
    const envoyFeatures = [
        {
            feature: 'gRPC-Web Filter',
            impact: 'Converts gRPC to gRPC-Web format',
            note: 'May add frame headers and trailers'
        },
        {
            feature: 'CORS Filter',
            impact: 'Adds CORS headers to response',
            note: 'Should not affect message body'
        },
        {
            feature: 'HTTP/2 Backend',
            impact: 'Communicates with Headscale via HTTP/2',
            note: 'May affect frame structure'
        },
        {
            feature: 'Timeout Configuration',
            impact: 'timeout: 0s, grpc_timeout_header_max: 0s',
            note: 'Unlimited timeouts - good for debugging'
        }
    ];
    
    envoyFeatures.forEach((feature, index) => {
        console.log(`${index + 1}. ${feature.feature}`);
        console.log(`   Impact: ${feature.impact}`);
        console.log(`   Note: ${feature.note}`);
        console.log('');
    });
    
    console.log('🔧 Debugging Steps:');
    console.log('1. Check Envoy logs for any transformation warnings');
    console.log('2. Compare direct gRPC call vs Envoy-proxied call');
    console.log('3. Verify Headscale gRPC service is returning valid protobuf');
    console.log('4. Test with minimal protobuf message first');
    
    return envoyFeatures;
}

// Main analysis runner
function runEnvoyAnalysis() {
    console.log('🚀 Starting Envoy gRPC-Web Response Analysis...\n');
    
    analyzeEnvoyResponse();
    const errorInfo = analyzeErrorPattern();
    const encodingIssues = analyzeEncodingIssues();
    const strategies = testParsingStrategies();
    const recommendations = generateTestRecommendations();
    const envoyFeatures = analyzeEnvoySpecifics();
    
    console.log('✅ Envoy Analysis Complete!');
    console.log('\n🎯 Next Steps:');
    console.log('1. Run gRPC Debug test with API key');
    console.log('2. Examine the detailed hex dump output');
    console.log('3. Look for frame boundaries and protobuf markers');
    console.log('4. Apply the parsing strategies based on findings');
    console.log('\n💡 The new debug interface will show:');
    console.log('- Complete hex dump of 128-byte response');
    console.log('- UTF-8 and ASCII interpretations');
    console.log('- Protobuf field analysis');
    console.log('- Frame structure detection');
    
    return {
        errorInfo,
        encodingIssues,
        strategies,
        recommendations,
        envoyFeatures
    };
}

// Auto-run analysis
runEnvoyAnalysis();
