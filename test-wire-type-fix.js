// Test script for wire type 7 error fix
// Run this in browser console to understand the protobuf structure

console.log('🔧 Testing Wire Type 7 Error Fix...\n');

// Simulate the wire type analysis
function analyzeWireTypes() {
    console.log('📊 Wire Type Analysis:');
    console.log('Valid protobuf wire types:');
    console.log('  0: Varint (int32, int64, uint32, uint64, sint32, sint64, bool, enum)');
    console.log('  1: 64-bit (fixed64, sfixed64, double)');
    console.log('  2: Length-delimited (string, bytes, embedded messages, packed repeated fields)');
    console.log('  5: 32-bit (fixed32, sfixed32, float)');
    console.log('  ❌ 6, 7: Invalid/deprecated wire types\n');
    
    // Test wire type detection
    const testBytes = [
        { byte: 0x0A, desc: 'Field 1, length-delimited (users array)' },
        { byte: 0x08, desc: 'Field 1, varint' },
        { byte: 0x12, desc: 'Field 2, length-delimited (string)' },
        { byte: 0x1A, desc: 'Field 3, length-delimited' },
        { byte: 0x47, desc: 'Field 8, wire type 7 (INVALID!)' },
        { byte: 0x8F, desc: 'Field 17, wire type 7 (INVALID!)' }
    ];
    
    testBytes.forEach(test => {
        const fieldNumber = test.byte >> 3;
        const wireType = test.byte & 0x07;
        const isValid = [0, 1, 2, 5].includes(wireType);
        
        console.log(`0x${test.byte.toString(16).padStart(2, '0')}: Field ${fieldNumber}, Wire Type ${wireType} ${isValid ? '✅' : '❌'} - ${test.desc}`);
    });
    
    console.log('');
}

// Simulate finding protobuf boundaries
function testProtobufBoundaries() {
    console.log('🎯 Testing Protobuf Boundary Detection:');
    
    // Create a mock 128-byte response with embedded user data
    const mockData = new Uint8Array(128);
    
    // Fill with realistic pattern
    // gRPC-Web header (5 bytes)
    mockData[0] = 0x00; // compression
    mockData[1] = 0x00; // length
    mockData[2] = 0x00; // length  
    mockData[3] = 0x00; // length
    mockData[4] = 0x7B; // length (123 bytes)
    
    // Protobuf ListUsersResponse
    mockData[5] = 0x0A; // Field 1 (users), length-delimited
    mockData[6] = 0x0C; // Length of first user (12 bytes)
    
    // First user data
    mockData[7] = 0x0A; // Field 1 (id), length-delimited
    mockData[8] = 0x01; // Length (1 byte)
    mockData[9] = 0x31; // "1"
    mockData[10] = 0x12; // Field 2 (name), length-delimited
    mockData[11] = 0x0B; // Length (11 bytes)
    // "fangzhou93" encoded
    const name1 = new TextEncoder().encode('fangzhou93');
    for (let i = 0; i < name1.length; i++) {
        mockData[12 + i] = name1[i];
    }
    
    // Add some invalid data at offset 89 to simulate the error
    mockData[89] = 0x8F; // Invalid wire type 7
    mockData[90] = 0xFF; // Invalid data
    
    console.log('Mock data created with invalid wire type at offset 89');
    console.log('First 32 bytes:', Array.from(mockData.slice(0, 32)).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' '));
    console.log('Around offset 89:', Array.from(mockData.slice(85, 95)).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' '));
    
    // Test boundary detection
    console.log('\n🔍 Boundary Detection Results:');
    
    // Find protobuf start
    let protobufStart = -1;
    for (let i = 0; i < Math.min(20, mockData.length - 2); i++) {
        const byte = mockData[i];
        const wireType = byte & 0x07;
        const fieldNumber = byte >> 3;
        
        if ([0, 1, 2, 5].includes(wireType) && fieldNumber > 0 && fieldNumber < 19) {
            protobufStart = i;
            console.log(`✅ Found protobuf start at offset ${i} (0x${byte.toString(16)})`);
            break;
        }
    }
    
    // Find protobuf end (where wire type 7 appears)
    let protobufEnd = mockData.length;
    if (protobufStart >= 0) {
        for (let i = protobufStart + 1; i < mockData.length; i++) {
            const byte = mockData[i];
            const wireType = byte & 0x07;
            
            if (wireType === 7) {
                protobufEnd = i;
                console.log(`⚠️ Found invalid wire type 7 at offset ${i}, truncating here`);
                break;
            }
        }
    }
    
    const cleanData = mockData.slice(protobufStart, protobufEnd);
    console.log(`📦 Clean protobuf data: ${cleanData.length} bytes (${protobufStart} to ${protobufEnd})`);
    console.log('Clean data hex:', Array.from(cleanData.slice(0, 16)).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' '));
    
    console.log('');
}

// Test user data extraction
function testUserDataExtraction() {
    console.log('👥 Testing User Data Extraction:');
    
    // Simulate the user data we see in the error: fangzhou93, fangzhou94, fz96
    const users = ['fangzhou93', 'fangzhou94', 'fz96'];
    
    users.forEach((user, index) => {
        console.log(`User ${index + 1}: "${user}"`);
        const encoded = new TextEncoder().encode(user);
        console.log(`  Encoded: ${Array.from(encoded).map(b => `0x${b.toString(16)}`).join(' ')}`);
        console.log(`  Length: ${encoded.length} bytes`);
        
        // Show how it would appear in protobuf
        console.log(`  Protobuf field: 0x12 0x${encoded.length.toString(16).padStart(2, '0')} ${Array.from(encoded).map(b => `0x${b.toString(16)}`).join(' ')}`);
        console.log('');
    });
}

// Test truncation strategies
function testTruncationStrategies() {
    console.log('✂️ Testing Truncation Strategies:');
    
    const strategies = [
        { name: 'Conservative (first 80 bytes)', end: 80 },
        { name: 'Before error (first 88 bytes)', end: 88 },
        { name: 'Skip last 10 bytes', end: -10 },
        { name: 'Skip last 15 bytes', end: -15 },
        { name: 'Middle section (5 to -10)', start: 5, end: -10 }
    ];
    
    const totalLength = 128;
    
    strategies.forEach(strategy => {
        const start = strategy.start || 0;
        const end = strategy.end < 0 ? totalLength + strategy.end : strategy.end;
        const length = end - start;
        
        console.log(`${strategy.name}:`);
        console.log(`  Range: ${start} to ${end} (${length} bytes)`);
        console.log(`  Avoids offset 89: ${end <= 89 ? '✅' : '❌'}`);
        console.log('');
    });
}

// Main test runner
function runWireTypeTests() {
    console.log('🚀 Starting Wire Type 7 Error Analysis...\n');
    
    analyzeWireTypes();
    testProtobufBoundaries();
    testUserDataExtraction();
    testTruncationStrategies();
    
    console.log('✅ Wire Type Analysis Complete!');
    console.log('\n💡 Key Insights:');
    console.log('1. Wire type 7 is invalid and indicates end of valid protobuf data');
    console.log('2. Error at offset 89 suggests we need to truncate before that point');
    console.log('3. User data is present and can be extracted with proper boundaries');
    console.log('4. Conservative truncation (first 80 bytes) should avoid the error');
    console.log('\n🎯 Recommended Fix: Detect wire type 7 and truncate data before it');
}

// Auto-run tests
runWireTypeTests();
