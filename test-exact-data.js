// Test with exact data from error report
const hexLines = [
    '00000000: 00 00 00 01 43 0a 1c 08 01 12 0a 66 61 6e 67 7a',
    '00000010: 68 6f 75 39 33 1a 0c 08 e6 a5 9d c0 06 10 a2 81',
    '00000020: d2 fe 02 0a 1b 08 02 12 0a 66 61 6e 67 7a 68 6f',
    '00000030: 75 39 34 1a 0b 08 fa 96 a1 c0 06 10 88 b9 dc 77',
    '00000040: 0a 1b 08 03 12 04 66 7a 39 36 1a 0b 08 89 e0 ac',
    '00000050: c0 06 10 9e a5 a2 7b 22 04 64 69 6e 67 0a 39 08',
    '00000060: 1f 12 17 74 65 73 74 2d 75 73 65 72 2d 31 37 35',
    '00000070: 30 33 38 38 35 37 32 37 32 32 1a 0c 08 85 9f d3',
    '00000080: c2 06 10 a3 a2 87 8d 01 22 0e 74 65 73 74 2d 6e',
    '00000090: 61 6d 65 73 70 61 63 65 0a 39 08 20 12 17 74 65',
    '000000a0: 73 74 2d 75 73 65 72 2d 31 37 35 30 33 38 38 39',
    '000000b0: 33 30 30 38 31 1a 0c 08 c2 a1 d3 c2 06 10 8d ec',
    '000000c0: fe 99 03 22 0e 74 65 73 74 2d 6e 61 6d 65 73 70',
    '000000d0: 61 63 65 0a 39 08 21 12 17 74 65 73 74 2d 75 73',
    '000000e0: 65 72 2d 31 37 35 30 33 38 39 32 32 31 32 38 35',
    '000000f0: 1a 0c 08 e7 a3 d3 c2 06 10 a1 c0 f9 cc 02 22 0e',
    '00000100: 74 65 73 74 2d 6e 61 6d 65 73 70 61 63 65 0a 38',
    '00000110: 08 22 12 17 74 65 73 74 2d 75 73 65 72 2d 31 37',
    '00000120: 35 30 33 38 39 33 30 36 37 33 39 1a 0b 08 ee a4',
    '00000130: d3 c2 06 10 90 ad e7 44 22 0e 74 65 73 74 2d 6e',
    '00000140: 61 6d 65 73 70 61 63 65 80 00 00 00 1e 67 72 70',
    '00000150: 63 2d 73 74 61 74 75 73 3a 30 0d 0a 67 72 70 63',
    '00000160: 2d 6d 65 73 73 61 67 65 3a 0d 0a'
];

// Extract hex bytes
const hexBytes = hexLines.map(line => {
    const parts = line.split(': ')[1];
    return parts.split(' ').filter(b => b.length === 2);
}).flat();

const responseData = new Uint8Array(hexBytes.map(h => parseInt(h, 16)));

console.log('Response size:', responseData.length);
console.log('First 8 bytes:', Array.from(responseData.slice(0, 8)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));

// Parse frame header
const compressionFlag = responseData[0];
const view = new DataView(responseData.buffer);
const messageLength = view.getUint32(1, false); // big-endian

console.log('Compression flag:', compressionFlag);
console.log('Declared message length:', messageLength, '(0x' + messageLength.toString(16) + ')');

// Find trailer
let trailerStart = -1;
for (let i = 5; i < responseData.length - 4; i++) {
    if (responseData[i] === 0x80) {
        console.log('Found 0x80 at offset', i);
        // Check if followed by reasonable trailer length
        const trailerView = new DataView(responseData.buffer, i + 1, 4);
        const trailerLength = trailerView.getUint32(0, false);
        console.log('Trailer length at offset', i + 1, ':', trailerLength);
        if (trailerLength > 0 && trailerLength < 100) {
            trailerStart = i;
            break;
        }
    }
}

console.log('Trailer starts at:', trailerStart);

// Extract message
const messageStart = 5;
const messageEnd = trailerStart > 0 ? trailerStart : messageStart + messageLength;
const messageData = responseData.slice(messageStart, messageEnd);

console.log('Message data length:', messageData.length);
console.log('Message starts with:', '0x' + messageData[0].toString(16));

// Test manual parsing
function parseUsers(data) {
    const users = [];
    let offset = 0;
    
    while (offset < data.length - 1) {
        if (offset >= data.length) break;
        
        const byte = data[offset];
        const wireType = byte & 0x07;
        const fieldNumber = byte >> 3;
        
        console.log(`Offset ${offset}: byte=0x${byte.toString(16)}, field=${fieldNumber}, wireType=${wireType}`);
        
        if (fieldNumber === 1 && wireType === 2) {
            offset++; // Skip field tag
            
            // Read user length
            let userLength = 0;
            let lengthBytes = 0;
            while (offset < data.length && lengthBytes < 5) {
                const lengthByte = data[offset];
                userLength |= (lengthByte & 0x7F) << (7 * lengthBytes);
                lengthBytes++;
                offset++;
                if ((lengthByte & 0x80) === 0) break;
            }
            
            console.log(`User length: ${userLength} at offset ${offset}`);
            
            if (userLength > 0 && offset + userLength <= data.length) {
                const userData = data.slice(offset, offset + userLength);
                const user = parseUser(userData);
                if (user) {
                    users.push(user);
                    console.log(`Parsed: ${user.name} (${user.displayName || 'no display name'})`);
                }
                offset += userLength;
            } else {
                console.log('Invalid user length, stopping');
                break;
            }
        } else {
            offset++;
        }
    }
    
    return users;
}

function parseUser(userData) {
    const user = { id: '', name: '', displayName: '' };
    let offset = 0;
    
    while (offset < userData.length - 1) {
        const byte = userData[offset];
        const wireType = byte & 0x07;
        const fieldNumber = byte >> 3;
        
        offset++;
        
        switch (fieldNumber) {
            case 1: // id
                if (wireType === 0) {
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
                    let nameLength = 0;
                    let lengthBytes = 0;
                    while (offset < userData.length && lengthBytes < 5) {
                        const lengthByte = userData[offset];
                        nameLength |= (lengthByte & 0x7F) << (7 * lengthBytes);
                        lengthBytes++;
                        offset++;
                        if ((lengthByte & 0x80) === 0) break;
                    }
                    
                    if (offset + nameLength <= userData.length) {
                        user.name = new TextDecoder().decode(userData.slice(offset, offset + nameLength));
                        offset += nameLength;
                    }
                }
                break;
                
            case 4: // display_name
                if (wireType === 2) {
                    let displayNameLength = 0;
                    let lengthBytes = 0;
                    while (offset < userData.length && lengthBytes < 5) {
                        const lengthByte = userData[offset];
                        displayNameLength |= (lengthByte & 0x7F) << (7 * lengthBytes);
                        lengthBytes++;
                        offset++;
                        if ((lengthByte & 0x80) === 0) break;
                    }
                    
                    if (offset + displayNameLength <= userData.length) {
                        user.displayName = new TextDecoder().decode(userData.slice(offset, offset + displayNameLength));
                        offset += displayNameLength;
                    }
                }
                break;
                
            default:
                // Skip field
                if (wireType === 2) {
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
    }
    
    return user;
}

console.log('\n=== Parsing Users ===');
const users = parseUsers(messageData);
console.log('\n=== Results ===');
console.log('Found', users.length, 'users');
users.forEach((user, i) => {
    console.log(`User ${i + 1}: id=${user.id}, name="${user.name}", displayName="${user.displayName}"`);
});
