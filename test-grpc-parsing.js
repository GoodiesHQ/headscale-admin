// Test script to verify gRPC parsing fixes
// This simulates the problematic 363-byte response

// Convert hex string to Uint8Array
function hexToBytes(hex) {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return new Uint8Array(bytes);
}

// The exact problematic response data from the error report (363 bytes)
// From hex dump: 00000000: 00 00 00 01 43 0a 1c 08 01 12 0a 66 61 6e 67 7a
const hexData = '00000001430a1c08011 20a66616e677a686f7539331a0c08e6a59dc00610a281d2fe020a1b08021 20a66616e677a686f7539341a0b08fa96a1c006108 8b9dc770a1b0803120466 7a39361a0b0889e0acc006109ea5a27b220464696e670a39081f121774 6573742d757365722d31373530333838353732 3732321a0c08859fd3c20610a3a2878d01220e74 6573742d6e616d6573706163650a390820121774 6573742d757365722d31373530333838393330 3038311a0c08c2a1d3c206108decfe9903220e74 6573742d6e616d6573706163650a390821121774 6573742d757365722d31373530333839323231 3238351a0c08e7a3d3c20610a1c0f9cc02220e74 6573742d6e616d6573706163650a380822121774 6573742d757365722d31373530333839333036 3733391a0b08eea4d3c206109 0ade744220e7465 73742d6e616d6573706163658000000 01e677270632d7374617475733a300d0a67727063 2d6d6573736167653a0d0a'.replace(/\s/g, '');

const responseData = hexToBytes(hexData);

console.log('Testing gRPC parsing with 363-byte response...');
console.log('Response size:', responseData.length);
console.log('First 32 bytes:', Array.from(responseData.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join(' '));

// Test frame parsing
function parseGrpcWebFrame(data) {
    console.log('\n=== Frame Parsing ===');
    
    if (data.length < 5) {
        console.log('Frame too small');
        return null;
    }
    
    const compressionFlag = data[0];
    const view = new DataView(data.buffer);
    const messageLength = view.getUint32(1, false); // big-endian
    
    console.log('Compression flag:', compressionFlag);
    console.log('Declared message length:', messageLength, '(0x' + messageLength.toString(16) + ')');
    
    const messageStart = 5;
    const declaredEnd = messageStart + messageLength;
    
    console.log('Message boundaries: start=' + messageStart + ', declaredEnd=' + declaredEnd + ', total=' + data.length);
    
    // Find trailer
    let trailerStart = -1;
    for (let i = messageStart; i < data.length - 4; i++) {
        if (data[i] === 0x80) {
            console.log('Found potential trailer at offset', i);
            trailerStart = i;
            break;
        }
    }
    
    const messageEnd = trailerStart > 0 ? trailerStart : Math.min(declaredEnd, data.length);
    const messageData = data.slice(messageStart, messageEnd);
    
    console.log('Extracted message:', messageData.length, 'bytes');
    console.log('Message starts with:', messageData[0] ? '0x' + messageData[0].toString(16) : 'undefined');
    
    return messageData;
}

// Test manual parsing
function manualParseUsers(messageData) {
    console.log('\n=== Manual User Parsing ===');
    
    const users = [];
    let offset = 0;
    
    while (offset < messageData.length - 1) {
        if (offset >= messageData.length) break;
        
        const byte = messageData[offset];
        const wireType = byte & 0x07;
        const fieldNumber = byte >> 3;
        
        console.log(`Offset ${offset}: byte=0x${byte.toString(16)}, field=${fieldNumber}, wireType=${wireType}`);
        
        if (fieldNumber === 1 && wireType === 2) {
            // Field 1 (users), length-delimited
            offset++; // Skip field tag
            
            if (offset >= messageData.length) break;
            
            // Read length varint
            let userLength = 0;
            let lengthBytes = 0;
            let lengthOffset = offset;
            
            while (lengthOffset < messageData.length && lengthBytes < 5) {
                const lengthByte = messageData[lengthOffset];
                userLength |= (lengthByte & 0x7F) << (7 * lengthBytes);
                lengthBytes++;
                lengthOffset++;
                if ((lengthByte & 0x80) === 0) break;
            }
            
            offset = lengthOffset;
            
            console.log(`User message length: ${userLength} bytes at offset ${offset}`);
            
            if (userLength <= 0 || userLength > messageData.length || offset + userLength > messageData.length) {
                console.log(`Invalid user length ${userLength}, stopping`);
                break;
            }
            
            const userData = messageData.slice(offset, offset + userLength);
            const user = parseUser(userData);
            if (user) {
                users.push(user);
                console.log(`Parsed user: ${user.name} (${user.displayName || 'no display name'})`);
            }
            offset += userLength;
        } else {
            // Skip unknown field
            offset++;
        }
    }
    
    console.log(`Manual parsing completed: ${users.length} users found`);
    return users;
}

function parseUser(userData) {
    const user = { id: '', name: '', displayName: '' };
    let offset = 0;
    
    while (offset < userData.length - 1) {
        if (offset >= userData.length) break;
        
        const byte = userData[offset];
        const wireType = byte & 0x07;
        const fieldNumber = byte >> 3;
        
        offset++; // Skip field tag
        
        switch (fieldNumber) {
            case 1: // id
                if (wireType === 0) {
                    // varint
                    let id = 0;
                    let idBytes = 0;
                    while (offset < userData.length && idBytes < 5) {
                        const idByte = userData[offset];
                        id |= (idByte & 0x7F) << (7 * idBytes);
                        idBytes++;
                        offset++;
                        if ((idByte & 0x80) === 0) break;
                    }
                    user.id = id.toString();
                }
                break;
                
            case 2: // name
                if (wireType === 2) {
                    // Read length
                    let nameLength = 0;
                    let lengthBytes = 0;
                    while (offset < userData.length && lengthBytes < 5) {
                        const lengthByte = userData[offset];
                        nameLength |= (lengthByte & 0x7F) << (7 * lengthBytes);
                        lengthBytes++;
                        offset++;
                        if ((lengthByte & 0x80) === 0) break;
                    }
                    
                    if (offset + nameLength <= userData.length && nameLength > 0) {
                        user.name = new TextDecoder().decode(userData.slice(offset, offset + nameLength));
                        offset += nameLength;
                    }
                }
                break;
                
            case 4: // display_name
                if (wireType === 2) {
                    // Read length
                    let displayNameLength = 0;
                    let lengthBytes = 0;
                    while (offset < userData.length && lengthBytes < 5) {
                        const lengthByte = userData[offset];
                        displayNameLength |= (lengthByte & 0x7F) << (7 * lengthBytes);
                        lengthBytes++;
                        offset++;
                        if ((lengthByte & 0x80) === 0) break;
                    }
                    
                    if (offset + displayNameLength <= userData.length && displayNameLength > 0) {
                        user.displayName = new TextDecoder().decode(userData.slice(offset, offset + displayNameLength));
                        offset += displayNameLength;
                    }
                }
                break;
                
            default:
                // Skip unknown field - simplified
                if (wireType === 2) {
                    // length-delimited
                    let skipLength = 0;
                    let lengthBytes = 0;
                    while (offset < userData.length && lengthBytes < 5) {
                        const lengthByte = userData[offset];
                        skipLength |= (lengthByte & 0x7F) << (7 * lengthBytes);
                        lengthBytes++;
                        offset++;
                        if ((lengthByte & 0x80) === 0) break;
                    }
                    offset += skipLength;
                } else {
                    offset++;
                }
                break;
        }
        
        if (offset >= userData.length) break;
    }
    
    return user;
}

// Run the test
try {
    const messageData = parseGrpcWebFrame(responseData);
    if (messageData) {
        const users = manualParseUsers(messageData);
        console.log('\n=== Test Results ===');
        console.log('Successfully parsed', users.length, 'users');
        users.forEach((user, i) => {
            console.log(`User ${i + 1}: id=${user.id}, name="${user.name}", displayName="${user.displayName}"`);
        });
    }
} catch (error) {
    console.error('Test failed:', error.message);
}
