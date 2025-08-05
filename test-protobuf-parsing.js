// Test script for protobuf parsing with user data
// Run this in browser console to test the parsing improvements

console.log('🧪 Testing Protobuf Parsing for User Data...\n');

// Simulate the 128-byte response that contains user data
// Based on the error message showing: fangzhou93, fangzhou94, fz96
function createMockUserResponse() {
    // This simulates a gRPC-Web response with user data
    const users = [
        { id: '1', name: 'fangzhou93', display_name: 'fangzhou93' },
        { id: '2', name: 'fangzhou94', display_name: 'fangzhou94' },
        { id: '3', name: 'fz96', display_name: 'fz96' }
    ];
    
    console.log('📝 Mock users data:', users);
    return users;
}

// Test protobuf field detection
function testProtobufFieldDetection() {
    console.log('🔍 Testing Protobuf Field Detection...\n');
    
    // Common protobuf field markers
    const testBytes = [
        { name: 'Field 1 length-delimited (0x0A)', byte: 0x0A, description: 'Users array field' },
        { name: 'Field 1 varint (0x08)', byte: 0x08, description: 'Simple field' },
        { name: 'Field 2 length-delimited (0x12)', byte: 0x12, description: 'String field' },
        { name: 'Invalid byte (0xFF)', byte: 0xFF, description: 'Should be rejected' }
    ];
    
    testBytes.forEach(test => {
        const fieldNumber = test.byte >> 3;
        const wireType = test.byte & 0x07;
        const validWireTypes = [0, 1, 2, 5];
        const isValid = fieldNumber > 0 && fieldNumber < 19 && validWireTypes.includes(wireType);
        
        console.log(`${test.name}:`);
        console.log(`  Field Number: ${fieldNumber}, Wire Type: ${wireType}`);
        console.log(`  Valid: ${isValid ? '✅' : '❌'} - ${test.description}`);
        console.log('');
    });
}

// Test hex dump functionality
function testHexDump() {
    console.log('🔧 Testing Hex Dump Functionality...\n');
    
    // Create test data with user names
    const testString = 'fangzhou93\x00fangzhou94\x00fz96';
    const testData = new TextEncoder().encode(testString);
    
    console.log('Original string:', testString);
    console.log('Encoded bytes:', Array.from(testData).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' '));
    
    // Simulate hex dump
    const hex = Array.from(testData)
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ');
    
    const ascii = Array.from(testData)
        .map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.')
        .join('');
    
    console.log(`Hex dump: ${hex} | ${ascii}`);
    console.log('');
}

// Test response parsing strategies
function testParsingStrategies() {
    console.log('🎯 Testing Response Parsing Strategies...\n');
    
    // Simulate a 128-byte response with embedded user data
    const mockResponse = new ArrayBuffer(128);
    const view = new Uint8Array(mockResponse);
    
    // Fill with some realistic data pattern
    // gRPC-Web frame header (5 bytes)
    view[0] = 0x00; // compression flag
    view[1] = 0x00; // length byte 1
    view[2] = 0x00; // length byte 2
    view[3] = 0x00; // length byte 3
    view[4] = 0x7B; // length byte 4 (123 bytes)
    
    // Protobuf data starting at byte 5
    view[5] = 0x0A; // Field 1, length-delimited (users array)
    
    // Add some user name data
    const userData = new TextEncoder().encode('fangzhou93');
    for (let i = 0; i < Math.min(userData.length, 20); i++) {
        view[6 + i] = userData[i];
    }
    
    console.log('Mock 128-byte response created');
    console.log('First 32 bytes:', Array.from(view.slice(0, 32)).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' '));
    
    // Test different parsing strategies
    const strategies = [
        { name: 'Full data', offset: 0 },
        { name: 'Skip gRPC header (5 bytes)', offset: 5 },
        { name: 'Skip to protobuf marker', offset: 5 },
        { name: 'Skip 8 bytes', offset: 8 },
        { name: 'Skip 10 bytes', offset: 10 }
    ];
    
    strategies.forEach(strategy => {
        const data = view.slice(strategy.offset);
        const firstByte = data.length > 0 ? data[0] : 0;
        const looksLikeProtobuf = firstByte === 0x0A || firstByte === 0x08 || firstByte === 0x12;
        
        console.log(`${strategy.name}:`);
        console.log(`  Data length: ${data.length} bytes`);
        console.log(`  First byte: 0x${firstByte.toString(16).padStart(2, '0')}`);
        console.log(`  Looks like protobuf: ${looksLikeProtobuf ? '✅' : '❌'}`);
        console.log('');
    });
}

// Test character encoding issues
function testCharacterEncoding() {
    console.log('🔤 Testing Character Encoding...\n');
    
    // Test different ways to decode user names
    const userNameBytes = new TextEncoder().encode('fangzhou93楝');
    
    console.log('Original bytes:', Array.from(userNameBytes).map(b => `0x${b.toString(16)}`).join(' '));
    
    // Test different decoding methods
    const decodingMethods = [
        {
            name: 'UTF-8 (strict)',
            decode: (bytes) => new TextDecoder('utf-8', { fatal: true }).decode(bytes)
        },
        {
            name: 'UTF-8 (non-fatal)',
            decode: (bytes) => new TextDecoder('utf-8', { fatal: false }).decode(bytes)
        },
        {
            name: 'Latin-1',
            decode: (bytes) => new TextDecoder('latin1').decode(bytes)
        }
    ];
    
    decodingMethods.forEach(method => {
        try {
            const decoded = method.decode(userNameBytes);
            console.log(`${method.name}: "${decoded}" ✅`);
        } catch (error) {
            console.log(`${method.name}: Failed - ${error.message} ❌`);
        }
    });
    
    console.log('');
}

// Main test runner
async function runProtobufTests() {
    console.log('🚀 Starting Protobuf Parsing Tests...\n');
    
    createMockUserResponse();
    testProtobufFieldDetection();
    testHexDump();
    testParsingStrategies();
    testCharacterEncoding();
    
    console.log('✅ All protobuf parsing tests completed!');
    console.log('\n💡 Key insights:');
    console.log('1. User data is present in the response (fangzhou93, fangzhou94, fz96)');
    console.log('2. The issue is in protobuf decoding, not network connectivity');
    console.log('3. Need to find the correct offset for protobuf data in 128-byte response');
    console.log('4. Character encoding should use UTF-8 non-fatal mode');
    console.log('\n🎯 Next: Test the improved parsing logic in the actual application');
}

// Auto-run tests
runProtobufTests();
