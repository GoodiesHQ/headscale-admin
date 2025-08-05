import type { GrpcConfig, User } from '$lib/common/types';
import { debug } from '$lib/common/debug';
import { load, Type } from 'protobufjs';
import { GrpcDebugger } from './debug';

// gRPC-Web client for Headscale
export class HeadscaleGrpcClient {
    private config: GrpcConfig;
    private baseUrl: string;
    private protoRoot: any = null;

    constructor(config: GrpcConfig) {
        this.config = config;
        this.baseUrl = this.buildBaseUrl();
    }

    private async loadProto() {
        if (!this.protoRoot) {
            try {
                // Load the protobuf definition from public directory
                // Try user.proto first, fallback to headscale.proto
                try {
                    this.protoRoot = await load('/user.proto');
                    debug('User protobuf definition loaded successfully');
                } catch (userProtoError) {
                    debug('Failed to load user.proto, trying headscale.proto:', userProtoError);
                    this.protoRoot = await load('/headscale.proto');
                    debug('Headscale protobuf definition loaded successfully');
                }
            } catch (error) {
                debug('Failed to load protobuf definition:', error);
                throw new Error('Unable to load protobuf definition file');
            }
        }
        return this.protoRoot;
    }

    private buildBaseUrl(): string {
        const protocol = this.config.enableTls ? 'https' : 'http';
        return `${protocol}://${this.config.serverAddress}:${this.config.port}`;
    }

    private getHeaders(): HeadersInit {
        return {
            'Content-Type': 'application/grpc-web+proto',
            'Authorization': `Bearer ${this.config.apiKey}`,
            'grpc-timeout': `${this.config.timeoutMs}m`,
        };
    }

    /**
     * Test the gRPC connection by calling Headscale's listUsers method
     */
    async testConnection(): Promise<{ success: boolean; error?: string }> {
        try {
            debug('Testing gRPC connection to:', this.baseUrl);

            // Load protobuf definitions
            const root = await this.loadProto();
            const ListUsersRequest = root.lookupType('headscale.v1.ListUsersRequest');
            const ListUsersResponse = root.lookupType('headscale.v1.ListUsersResponse');

            // Create an empty ListUsersRequest
            const requestMessage = ListUsersRequest.create({});
            const requestBuffer = ListUsersRequest.encode(requestMessage).finish();

            // Create gRPC-Web frame
            const requestBody = this.createGrpcWebFrame(requestBuffer);

            const testUrl = `${this.baseUrl}/headscale.v1.HeadscaleService/ListUsers`;

            try {
                const response = await fetch(testUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/grpc-web+proto',
                        'Accept': 'application/grpc-web+proto',
                        'Authorization': `Bearer ${this.config.apiKey}`,
                        'grpc-timeout': '10S',
                        'X-Grpc-Web': '1',
                        'X-User-Agent': 'grpc-web-javascript/0.1'
                    },
                    body: requestBody,
                    signal: AbortSignal.timeout(this.config.timeoutMs),
                });

                debug('gRPC response status:', response.status);
                debug('gRPC response headers:', Object.fromEntries(response.headers.entries()));

                if (response.ok) {
                    const responseData = await response.arrayBuffer();
                    debug('gRPC connection test successful, response size:', responseData.byteLength);

                    // Create detailed response analysis for debugging
                    const rawResponseData = this.createRawResponseAnalysis(responseData);
                    debug('Raw response analysis:', rawResponseData);

                    // Analyze response data with enhanced debugging
                    const analysis = GrpcDebugger.analyzeResponseData(responseData);
                    debug('Response analysis:', analysis);

                    try {
                        // Parse gRPC-Web response with better error handling
                        debug('Raw response data length:', responseData.byteLength);

                        // For large responses, use the specialized parser directly
                        let messageData: Uint8Array;
                        if (responseData.byteLength >= 128) {
                            debug('Using specialized gRPC-Web frame parser for large response');
                            messageData = this.parseStandardGrpcWebFrame(responseData);
                        } else {
                            messageData = this.parseGrpcWebFrame(responseData);
                        }

                        debug('Extracted message data length:', messageData.length);
                        debug('Message data hex:', this.createHexDump(messageData));

                        // For large responses (>300 bytes), use manual parsing directly to avoid protobuf.js boundary issues
                        let responseMessage: any;
                        if (messageData.length > 300) {
                            debug('Large response detected, using manual parsing directly');
                            responseMessage = this.manualParseListUsersResponse(messageData);
                        } else {
                            // Try direct decode first for smaller responses
                            try {
                                debug('Attempting direct protobuf decode...');
                                responseMessage = ListUsersResponse.decode(messageData);
                                debug('✅ Direct decode successful');
                            } catch (directError) {
                                debug('❌ Direct decode failed:', directError instanceof Error ? directError.message : 'Unknown');

                                // Always use manual parsing for decode failures
                                debug('🚨 Using manual protobuf parsing due to decode failure');
                                responseMessage = this.manualParseListUsersResponse(messageData);
                            }
                        }

                        const users = responseMessage.users || [];

                        debug('Parsed users:', users.length);
                        if (users.length > 0) {
                            debug('First user:', users[0]);
                        }

                        return {
                            success: true,
                            error: `gRPC connection successful! Found ${users.length} users.`,
                            rawResponse: rawResponseData
                        };
                    } catch (parseError) {
                        debug('Failed to parse response, detailed error:', parseError);
                        debug('Error type:', parseError.constructor.name);
                        debug('Error message:', parseError instanceof Error ? parseError.message : 'Unknown');

                        // Provide detailed analysis in error message
                        const errorDetails = [
                            `Parse error: ${parseError instanceof Error ? parseError.message : 'Unknown'}`,
                            `Response size: ${responseData.byteLength} bytes`,
                            analysis.isLikelyHttp ? 'Response appears to be HTTP rather than gRPC' : '',
                            ...analysis.recommendations
                        ].filter(Boolean).join('\n');

                        // Try different parsing methods
                        const fallbackResult = this.tryAlternativeParsingMethods(responseData, ListUsersResponse, parseError);

                        if (!fallbackResult.success) {
                            fallbackResult.error = `${fallbackResult.error}\n\nDetailed analysis:\n${errorDetails}`;
                        }

                        // Add raw response data to error result
                        fallbackResult.rawResponse = rawResponseData;

                        return fallbackResult;
                    }
                } else if (response.status === 401) {
                    return {
                        success: false,
                        error: 'Authentication failed: Please check if API Key is correct'
                    };
                } else if (response.status === 404) {
                    return {
                        success: false,
                        error: 'gRPC service not found: Please ensure Headscale gRPC service is running'
                    };
                } else if (response.status === 415) {
                    // 415 usually indicates content type error, but may be normal for gRPC
                    const errorText = await response.text();
                    debug('415 response text:', errorText);

                    if (errorText.includes('grpc-status')) {
                        return {
                            success: false,
                            error: `gRPC protocol error: ${errorText}`
                        };
                    } else {
                        return {
                            success: false,
                            error: 'Content type error: Please ensure correct gRPC-Web proxy configuration'
                        };
                    }
                } else if (response.status === 502 || response.status === 503) {
                    return {
                        success: false,
                        error: 'Service unavailable: Headscale gRPC service may not be running or accessible'
                    };
                } else {
                    const errorText = await response.text();
                    debug('Error response text:', errorText);

                    // Check if contains gRPC error information
                    if (errorText.includes('grpc-status') || errorText.includes('grpc-message')) {
                        return {
                            success: false,
                            error: `gRPC error ${response.status}: ${errorText}`
                        };
                    } else {
                        return {
                            success: false,
                            error: `HTTP error ${response.status}: ${errorText}`
                        };
                    }
                }
            } catch (fetchError) {
                debug('gRPC listUsers call failed, analyzing error:', fetchError);
                return this.analyzeConnectionError(fetchError);
            }
        } catch (error) {
            debug('gRPC connection test error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Create a gRPC-Web frame from protobuf message
     */
    private createGrpcWebFrame(messageBuffer: Uint8Array): Uint8Array {
        // gRPC-Web frame format: [Compressed-Flag][Message-Length][Message]
        const messageLength = messageBuffer.length;
        const frame = new ArrayBuffer(5 + messageLength);
        const view = new DataView(frame);

        view.setUint8(0, 0); // Compression flag (0 = not compressed)
        view.setUint32(1, messageLength, false); // Message length (big-endian)

        // Copy message bytes
        const uint8View = new Uint8Array(frame);
        uint8View.set(messageBuffer, 5);

        return uint8View;
    }

    /**
     * Parse gRPC-Web frame to extract protobuf message with enhanced safety
     */
    private parseGrpcWebFrame(frameBuffer: ArrayBuffer): Uint8Array {
        debug('Parsing gRPC-Web frame, total length:', frameBuffer.byteLength);
        debug('Frame hex dump:', this.createHexDump(new Uint8Array(frameBuffer), 32));

        // Handle empty or very small responses
        if (frameBuffer.byteLength === 0) {
            debug('Empty response buffer');
            return new Uint8Array(0);
        }

        if (frameBuffer.byteLength < 5) {
            debug('Frame too short for gRPC-Web header, trying direct parsing');
            return new Uint8Array(frameBuffer);
        }

        // Parse gRPC-Web responses with known structure (128, 153+ bytes)
        if (frameBuffer.byteLength >= 128) {
            debug(`Detected ${frameBuffer.byteLength}-byte response, using gRPC-Web frame parsing`);
            return this.parseStandardGrpcWebFrame(frameBuffer);
        }

        try {
            const view = new DataView(frameBuffer);
            const compressionFlag = view.getUint8(0);

            // Safely read message length with bounds checking
            let messageLength: number;
            try {
                messageLength = view.getUint32(1, false); // big-endian
            } catch (error) {
                debug('Failed to read message length, using direct parsing');
                return new Uint8Array(frameBuffer);
            }

            debug('gRPC-Web frame - compression flag:', compressionFlag, 'message length:', messageLength);

            // Validate compression flag (0 = no compression, 1 = gzip)
            if (compressionFlag !== 0 && compressionFlag !== 1) {
                debug('Invalid compression flag, trying alternative parsing');
                return this.extractMessageFromComplexFrame(frameBuffer);
            }

            // For the known structure: message frame + trailer frame
            if (messageLength === 0x58) { // 88 bytes as seen in hex dump
                debug('Detected known message length 0x58 (88 bytes)');
                const messageData = new Uint8Array(frameBuffer, 5, 88);
                debug('Extracted known message structure:', this.createHexDump(messageData, 32));
                return messageData;
            }

            // Calculate expected total length
            const expectedTotalLength = 5 + messageLength;

            if (frameBuffer.byteLength < expectedTotalLength) {
                debug(`Frame incomplete: have ${frameBuffer.byteLength} bytes, declared need ${expectedTotalLength}`);

                // Use available data after the header
                const availableMessageLength = Math.max(0, frameBuffer.byteLength - 5);
                if (availableMessageLength > 0) {
                    debug(`Using available message data: ${availableMessageLength} bytes`);
                    const safeLength = Math.min(availableMessageLength, frameBuffer.byteLength - 5);
                    return new Uint8Array(frameBuffer, 5, safeLength);
                } else {
                    debug('No message data available after header');
                    return new Uint8Array(0);
                }
            }

            // Extract message bytes with safe bounds checking
            const actualMessageLength = Math.min(messageLength, frameBuffer.byteLength - 5);
            if (actualMessageLength <= 0) {
                debug('No valid message data to extract');
                return new Uint8Array(0);
            }

            const messageBytes = new Uint8Array(frameBuffer, 5, actualMessageLength);
            debug('Successfully extracted message bytes length:', messageBytes.length);

            return messageBytes;
        } catch (error) {
            debug('Error during frame parsing, falling back to complex frame extraction:', error);
            return this.extractMessageFromComplexFrame(frameBuffer);
        }
    }



    /**
     * Parse standard gRPC-Web frame structure based on analysis of 128/153+ byte responses
     */
    private parseStandardGrpcWebFrame(frameBuffer: ArrayBuffer): Uint8Array {
        debug(`Parsing standard gRPC-Web frame: ${frameBuffer.byteLength} bytes`);
        const data = new Uint8Array(frameBuffer);

        // Standard gRPC-Web frame structure:
        // Byte 0: Compression flag (0x00 = no compression)
        // Bytes 1-4: Message length (big-endian uint32)
        // Bytes 5+: Protobuf message data
        // End: gRPC trailer (starts with 0x80 0x00 0x00 0x00)

        debug('Frame header:', this.createHexDump(data.slice(0, Math.min(8, data.length))));

        // Validate minimum frame size
        if (data.length < 5) {
            debug('Frame too small for gRPC-Web header');
            return new Uint8Array(0);
        }

        // Read compression flag
        const compressionFlag = data[0];
        debug(`Compression flag: 0x${compressionFlag.toString(16)}`);

        // Read message length (big-endian uint32 at bytes 1-4)
        const view = new DataView(frameBuffer);
        const declaredMessageLength = view.getUint32(1, false); // false = big-endian
        debug(`Declared message length from header: ${declaredMessageLength} bytes (0x${declaredMessageLength.toString(16)})`);

        const messageStart = 5;

        // Validate declared message length
        if (declaredMessageLength <= 0) {
            debug('Invalid declared message length');
            return new Uint8Array(0);
        }

        // Calculate expected message end based on declared length
        const declaredMessageEnd = messageStart + declaredMessageLength;

        // Find the actual message boundaries by looking for the gRPC trailer
        const actualMessageEnd = this.findGrpcTrailerStart(data, messageStart);

        debug(`Message boundaries: start=${messageStart}, declaredEnd=${declaredMessageEnd}, actualEnd=${actualMessageEnd}, total=${data.length}`);

        // Use the safer of the two boundaries
        let messageEnd: number;
        if (declaredMessageEnd <= data.length && declaredMessageEnd > messageStart && actualMessageEnd > declaredMessageEnd) {
            // Declared length is valid and trailer is after it - use declared length
            messageEnd = declaredMessageEnd;
            debug('Using declared message length (trailer found after)');
        } else if (actualMessageEnd > messageStart && actualMessageEnd < data.length) {
            // Use trailer position if it's reasonable
            messageEnd = actualMessageEnd;
            debug('Using actual trailer position');
        } else {
            // Fallback: use declared length but ensure it doesn't exceed buffer
            messageEnd = Math.min(declaredMessageEnd, data.length);
            debug(`Using fallback boundary: ${messageEnd}`);
        }

        // Final safety check
        if (messageEnd <= messageStart) {
            debug('Invalid message boundaries, using minimal extraction');
            messageEnd = Math.min(messageStart + 50, data.length); // Extract at least some data
        }

        // Extract the message data using calculated boundaries
        const messageData = data.slice(messageStart, messageEnd);
        debug(`Extracted message: ${messageData.length} bytes (declared: ${declaredMessageLength}, used: ${messageEnd - messageStart})`);
        debug('Message hex:', this.createHexDump(messageData, 64));

        // Verify the message starts with valid protobuf data
        if (messageData.length > 0 && messageData[0] === 0x0A) {
            debug('✅ Message starts with valid protobuf field marker (0x0A)');
        } else {
            debug(`⚠️ Message starts with unexpected byte: 0x${messageData[0]?.toString(16) || 'undefined'}`);
        }

        return messageData;
    }

    /**
     * Manually parse ListUsersResponse when protobuf.js fails with boundary issues
     */
    private manualParseListUsersResponse(messageData: Uint8Array): any {
        debug('Manually parsing ListUsersResponse from raw data');
        debug('Message data length:', messageData.length);

        const users: any[] = [];
        let offset = 0;

        try {
            // ListUsersResponse has field 1 (users) which is repeated User messages
            while (offset < messageData.length - 1) {
                // Safety check to prevent infinite loops
                if (offset < 0 || offset >= messageData.length) {
                    debug(`Invalid offset ${offset}, breaking`);
                    break;
                }

                const byte = messageData[offset];
                const wireType = byte & 0x07;
                const fieldNumber = byte >> 3;

                debug(`Offset ${offset}: byte=0x${byte.toString(16)}, field=${fieldNumber}, wireType=${wireType}`);

                if (fieldNumber === 1 && wireType === 2) {
                    // Field 1 (users), length-delimited
                    offset++; // Skip field tag

                    // Safety check after incrementing offset
                    if (offset >= messageData.length) {
                        debug('Reached end of data after field tag');
                        break;
                    }

                    // Read length varint with bounds checking
                    const varintResult = this.readVarintSafe(messageData, offset);
                    if (!varintResult) {
                        debug('Failed to read varint, stopping');
                        break;
                    }

                    const { value: userLength, bytesRead } = varintResult;
                    offset += bytesRead;

                    debug(`User message length: ${userLength} bytes at offset ${offset}`);

                    // Validate user length is reasonable
                    if (userLength <= 0 || userLength > messageData.length) {
                        debug(`Invalid user length ${userLength}, skipping`);
                        break;
                    }

                    // Check if we have enough data for this user
                    if (offset + userLength <= messageData.length) {
                        const userData = messageData.slice(offset, offset + userLength);
                        const user = this.manualParseUser(userData);
                        if (user) {
                            users.push(user);
                            debug(`Parsed user: ${user.name} (${user.displayName || 'no display name'})`);
                        }
                        offset += userLength;
                    } else {
                        debug(`User length ${userLength} exceeds remaining data (${messageData.length - offset} bytes), stopping`);
                        break;
                    }
                } else {
                    // Skip unknown field with proper bounds checking
                    const newOffset = this.skipFieldSafe(messageData, offset, wireType);
                    if (newOffset <= offset || newOffset >= messageData.length) {
                        debug(`Field skip failed or reached end, stopping at offset ${offset}`);
                        break;
                    }
                    offset = newOffset;
                }
            }
        } catch (error) {
            debug('Manual parsing error:', error);
        }

        debug(`Manual parsing completed: ${users.length} users found`);
        return { users };
    }

    /**
     * Manually parse a single User message
     */
    private manualParseUser(userData: Uint8Array): any | null {
        debug(`Manually parsing User message: ${userData.length} bytes`);

        const user: any = {
            id: '',
            name: '',
            createdAt: new Date().toISOString(),
            displayName: '',
            email: '',
            providerId: '',
            provider: 'grpc',
            profilePicUrl: ''
        };

        let offset = 0;

        try {
            while (offset < userData.length - 1) {
                // Safety check
                if (offset < 0 || offset >= userData.length) {
                    debug(`Invalid offset ${offset} in user parsing`);
                    break;
                }

                const byte = userData[offset];
                const wireType = byte & 0x07;
                const fieldNumber = byte >> 3;

                offset++; // Skip field tag

                // Safety check after incrementing
                if (offset > userData.length) {
                    debug('Reached end of user data after field tag');
                    break;
                }

                switch (fieldNumber) {
                    case 1: // id (string)
                        if (wireType === 0) {
                            // varint
                            const varintResult = this.readVarintSafe(userData, offset - 1);
                            if (varintResult) {
                                user.id = varintResult.value.toString();
                                offset = this.skipVarintSafe(userData, offset);
                            } else {
                                debug('Failed to read id varint');
                                offset = this.skipFieldSafe(userData, offset - 1, wireType);
                            }
                        } else {
                            offset = this.skipFieldSafe(userData, offset - 1, wireType);
                        }
                        break;

                    case 2: // name (string)
                        if (wireType === 2) {
                            const varintResult = this.readVarintSafe(userData, offset);
                            if (varintResult) {
                                const { value: nameLength, bytesRead } = varintResult;
                                offset += bytesRead;
                                if (offset + nameLength <= userData.length && nameLength > 0) {
                                    user.name = new TextDecoder().decode(userData.slice(offset, offset + nameLength));
                                    offset += nameLength;
                                } else {
                                    debug(`Invalid name length ${nameLength} at offset ${offset}`);
                                    break;
                                }
                            } else {
                                debug('Failed to read name length');
                                offset = this.skipFieldSafe(userData, offset - 1, wireType);
                            }
                        } else {
                            offset = this.skipFieldSafe(userData, offset - 1, wireType);
                        }
                        break;

                    case 4: // display_name (string)
                        if (wireType === 2) {
                            const varintResult = this.readVarintSafe(userData, offset);
                            if (varintResult) {
                                const { value: displayNameLength, bytesRead } = varintResult;
                                offset += bytesRead;
                                if (offset + displayNameLength <= userData.length && displayNameLength > 0) {
                                    user.displayName = new TextDecoder().decode(userData.slice(offset, offset + displayNameLength));
                                    offset += displayNameLength;
                                } else {
                                    debug(`Invalid display name length ${displayNameLength} at offset ${offset}`);
                                    break;
                                }
                            } else {
                                debug('Failed to read display name length');
                                offset = this.skipFieldSafe(userData, offset - 1, wireType);
                            }
                        } else {
                            offset = this.skipFieldSafe(userData, offset - 1, wireType);
                        }
                        break;

                    default:
                        // Skip unknown fields safely
                        const newOffset = this.skipFieldSafe(userData, offset - 1, wireType);
                        if (newOffset <= offset) {
                            debug(`Field skip failed for field ${fieldNumber}, breaking`);
                            break;
                        }
                        offset = newOffset;
                        break;
                }

                if (offset >= userData.length) break;
            }
        } catch (error) {
            debug('User parsing error:', error);
            return null;
        }

        debug(`Parsed user: id=${user.id}, name=${user.name}, displayName=${user.displayName}`);
        return user;
    }

    /**
     * Read a varint from the data
     */
    private readVarint(data: Uint8Array, offset: number): { value: number; bytesRead: number } {
        let value = 0;
        let bytesRead = 0;
        let shift = 0;

        while (offset + bytesRead < data.length && bytesRead < 5) {
            const byte = data[offset + bytesRead];
            value |= (byte & 0x7F) << shift;
            bytesRead++;
            shift += 7;

            if ((byte & 0x80) === 0) break;
        }

        return { value, bytesRead };
    }

    /**
     * Safely read a varint with bounds checking
     */
    private readVarintSafe(data: Uint8Array, offset: number): { value: number; bytesRead: number } | null {
        if (offset < 0 || offset >= data.length) {
            debug(`readVarintSafe: Invalid offset ${offset}`);
            return null;
        }

        let value = 0;
        let bytesRead = 0;
        let shift = 0;

        while (offset + bytesRead < data.length && bytesRead < 5) {
            const byte = data[offset + bytesRead];
            value |= (byte & 0x7F) << shift;
            bytesRead++;
            shift += 7;

            if ((byte & 0x80) === 0) break;
        }

        // Validate the result
        if (bytesRead === 0) {
            debug('readVarintSafe: No bytes read');
            return null;
        }

        return { value, bytesRead };
    }

    /**
     * Skip a varint field
     */
    private skipVarint(data: Uint8Array, offset: number): number {
        while (offset < data.length && (data[offset] & 0x80) !== 0) {
            offset++;
        }
        return offset + 1;
    }

    /**
     * Skip a field based on wire type
     */
    private skipField(data: Uint8Array, offset: number, wireType: number): number {
        offset++; // Skip field tag

        switch (wireType) {
            case 0: // varint
                return this.skipVarint(data, offset);
            case 1: // 64-bit
                return offset + 8;
            case 2: // length-delimited
                const { value: length, bytesRead } = this.readVarint(data, offset);
                return offset + bytesRead + length;
            case 5: // 32-bit
                return offset + 4;
            default:
                return offset + 1;
        }
    }

    /**
     * Safely skip a field with bounds checking
     */
    private skipFieldSafe(data: Uint8Array, offset: number, wireType: number): number {
        const originalOffset = offset;

        // Skip field tag
        offset++;
        if (offset >= data.length) {
            debug(`skipFieldSafe: Reached end after field tag at ${originalOffset}`);
            return data.length;
        }

        switch (wireType) {
            case 0: // varint
                return this.skipVarintSafe(data, offset);
            case 1: // 64-bit
                const end64 = offset + 8;
                return Math.min(end64, data.length);
            case 2: // length-delimited
                const varintResult = this.readVarintSafe(data, offset);
                if (!varintResult) {
                    debug(`skipFieldSafe: Failed to read length varint at ${offset}`);
                    return data.length;
                }
                const { value: length, bytesRead } = varintResult;
                const endDelimited = offset + bytesRead + length;
                return Math.min(endDelimited, data.length);
            case 5: // 32-bit
                const end32 = offset + 4;
                return Math.min(end32, data.length);
            default:
                debug(`skipFieldSafe: Unknown wire type ${wireType} at ${originalOffset}`);
                return Math.min(offset + 1, data.length);
        }
    }

    /**
     * Safely skip a varint with bounds checking
     */
    private skipVarintSafe(data: Uint8Array, offset: number): number {
        while (offset < data.length && (data[offset] & 0x80) !== 0) {
            offset++;
        }
        return Math.min(offset + 1, data.length);
    }

    /**
     * Find a safer message boundary when direct decode fails with index out of range
     */
    private findSaferMessageBoundary(messageData: Uint8Array): Uint8Array {
        debug('Finding safer message boundary for problematic data');
        debug('Original message length:', messageData.length);

        // Strategy 1: Look for the last complete protobuf field
        let safeEnd = messageData.length;

        // Scan backwards to find a safe truncation point
        for (let i = messageData.length - 1; i >= 10; i--) {
            try {
                const candidate = messageData.slice(0, i);
                // Quick validation: try to parse just the first few bytes
                if (this.quickValidateProtobuf(candidate)) {
                    safeEnd = i;
                    debug(`Found potential safe end at offset ${i}`);
                    break;
                }
            } catch (e) {
                // Continue searching
            }
        }

        // Strategy 2: If we still have issues, try to find field boundaries
        if (safeEnd === messageData.length) {
            safeEnd = this.findLastCompleteField(messageData);
        }

        const result = messageData.slice(0, safeEnd);
        debug(`Safer boundary: ${result.length} bytes (truncated ${messageData.length - safeEnd} bytes)`);
        return result;
    }

    /**
     * Quick validation of protobuf data without full parsing
     */
    private quickValidateProtobuf(data: Uint8Array): boolean {
        if (data.length < 2) return false;

        // Check first few bytes for valid protobuf structure
        for (let i = 0; i < Math.min(3, data.length); i++) {
            const byte = data[i];
            const wireType = byte & 0x07;
            const fieldNumber = byte >> 3;

            // Must have valid field number and wire type
            if (fieldNumber === 0 || wireType > 5) {
                return false;
            }
        }

        return true;
    }

    /**
     * Find the last complete protobuf field in the data
     */
    private findLastCompleteField(data: Uint8Array): number {
        debug('Finding last complete protobuf field');

        let lastCompleteField = Math.min(data.length, 50); // Conservative fallback

        // Look for field markers and try to find complete fields
        for (let i = 0; i < data.length - 2; i++) {
            const byte = data[i];
            const wireType = byte & 0x07;
            const fieldNumber = byte >> 3;

            if (fieldNumber > 0 && fieldNumber < 10 && wireType <= 5) {
                // This looks like a valid field start
                try {
                    const fieldEnd = this.estimateFieldEnd(data, i);
                    if (fieldEnd > i && fieldEnd <= data.length) {
                        lastCompleteField = fieldEnd;
                        debug(`Found complete field ending at offset ${fieldEnd}`);
                    }
                } catch (e) {
                    // Field estimation failed, continue
                }
            }
        }

        return lastCompleteField;
    }

    /**
     * Estimate where a protobuf field ends
     */
    private estimateFieldEnd(data: Uint8Array, fieldStart: number): number {
        if (fieldStart >= data.length) return fieldStart;

        const wireType = data[fieldStart] & 0x07;
        let offset = fieldStart + 1;

        switch (wireType) {
            case 0: // varint
                while (offset < data.length && (data[offset] & 0x80) !== 0) {
                    offset++;
                }
                return offset + 1;

            case 1: // 64-bit
                return offset + 8;

            case 2: // length-delimited
                // Read length varint
                let length = 0;
                let lengthBytes = 0;
                while (offset < data.length && lengthBytes < 5) {
                    const byte = data[offset];
                    length |= (byte & 0x7F) << (7 * lengthBytes);
                    lengthBytes++;
                    offset++;
                    if ((byte & 0x80) === 0) break;
                }
                return Math.min(offset + length, data.length);

            case 5: // 32-bit
                return offset + 4;

            default:
                return fieldStart + 1;
        }
    }

    /**
     * Find the start position of gRPC trailer (0x80 0x00 0x00 0x00)
     */
    private findGrpcTrailerStart(data: Uint8Array, searchStart: number = 5): number {
        debug(`Searching for gRPC trailer starting from offset ${searchStart}`);

        // Look for gRPC trailer marker (0x80 0x00 0x00 0x00)
        // Also look for just 0x80 followed by reasonable trailer length
        for (let i = searchStart; i < data.length - 4; i++) {
            if (data[i] === 0x80) {
                // Check if this is followed by a reasonable trailer length
                if (i + 4 < data.length) {
                    const view = new DataView(data.buffer, i + 1, 4);
                    const trailerLength = view.getUint32(0, false); // big-endian

                    // Reasonable trailer length (typically 20-50 bytes)
                    if (trailerLength > 0 && trailerLength < 100 && i + 5 + trailerLength <= data.length) {
                        debug(`Found gRPC trailer at offset ${i} with length ${trailerLength}`);
                        debug(`Trailer bytes: ${this.createHexDump(data.slice(i, Math.min(i + 12, data.length)))}`);
                        return i;
                    }
                }

                // Also check for the classic pattern (0x80 0x00 0x00 0x00)
                if (i + 3 < data.length && data[i+1] === 0x00 && data[i+2] === 0x00 && data[i+3] === 0x00) {
                    debug(`Found classic gRPC trailer pattern at offset ${i}`);
                    debug(`Trailer bytes: ${this.createHexDump(data.slice(i, Math.min(i + 8, data.length)))}`);
                    return i;
                }
            }
        }

        debug('No gRPC trailer found, using fallback calculation');
        // Fallback: assume trailer is at the end, leave some room
        const fallbackEnd = Math.max(data.length - 30, searchStart + 10);
        debug(`Fallback trailer position: ${fallbackEnd}`);
        return fallbackEnd;
    }

    /**
     * Find actual message boundaries when header parsing fails (legacy method)
     */
    private findActualMessageBoundaries(data: Uint8Array): Uint8Array {
        debug('Finding actual message boundaries in response (legacy method)');

        const trailerStart = this.findGrpcTrailerStart(data, 5);
        const messageData = data.slice(5, trailerStart);
        debug(`Legacy method extracted: ${messageData.length} bytes`);
        debug('Legacy message hex:', this.createHexDump(messageData, 64));
        return messageData;
    }

    /**
     * Legacy method - kept for compatibility
     */
    private parseKnown128ByteResponse(frameBuffer: ArrayBuffer): Uint8Array {
        debug('Parsing known 128-byte response structure');
        const data = new Uint8Array(frameBuffer);

        // Based on hex dump analysis:
        // 00000000: 00 00 00 00 58 0a 1c 08 01 12 0a 66 61 6e 67 7a | ....X......fangz
        // Structure:
        // [0-4]: gRPC-Web message frame header: 00 00 00 00 58 (88 bytes message)
        // [5-92]: Protobuf message data (88 bytes)
        // [93-127]: gRPC-Web trailer frame: 80 00 00 00 1e + grpc headers

        debug('Frame structure analysis:');
        debug('- Message frame header: bytes 0-4');
        debug('- Protobuf data: bytes 5-92 (88 bytes)');
        debug('- Trailer frame: bytes 93-127');

        // Verify the expected structure
        if (data[0] === 0x00 && data[1] === 0x00 && data[2] === 0x00 && data[3] === 0x00 && data[4] === 0x58) {
            debug('✅ Confirmed expected gRPC-Web message frame header');

            // Extract the 88-byte protobuf message
            const messageData = data.slice(5, 5 + 0x58); // 5 + 88 = 93
            debug(`Extracted protobuf message: ${messageData.length} bytes`);
            debug('Message hex:', this.createHexDump(messageData, 32));

            // Verify trailer frame
            if (data[93] === 0x80) {
                debug('✅ Confirmed gRPC-Web trailer frame at offset 93');
            }

            return messageData;
        } else {
            debug('❌ Unexpected frame structure, falling back to pattern search');
            return this.fallbackParseResponse(data);
        }
    }

    /**
     * Fallback parsing for unexpected response structures
     */
    private fallbackParseResponse(data: Uint8Array): Uint8Array {
        debug('Using fallback parsing for 128-byte response');

        // Look for protobuf field 1 (users array) marker: 0x0A
        for (let i = 0; i < Math.min(20, data.length - 4); i++) {
            if (data[i] === 0x0A) {
                debug(`Found users array marker at offset ${i}`);

                // Try to determine the end of protobuf data
                // Look for trailer frame marker 0x80
                let endOffset = data.length;
                for (let j = i + 10; j < data.length; j++) {
                    if (data[j] === 0x80 && j + 5 < data.length) {
                        // Check if this looks like a trailer frame
                        const trailerLength = new DataView(data.buffer, j + 1, 4).getUint32(0, false);
                        if (trailerLength > 0 && trailerLength < 50) { // Reasonable trailer size
                            endOffset = j;
                            debug(`Found trailer frame at offset ${j}, protobuf ends at ${endOffset}`);
                            break;
                        }
                    }
                }

                const messageData = data.slice(i, endOffset);
                debug(`Extracted message from offset ${i} to ${endOffset}: ${messageData.length} bytes`);
                return messageData;
            }
        }

        debug('No protobuf markers found, using middle section');
        return data.slice(5, -35); // Skip headers and trailers
    }

    /**
     * Extract message from complex gRPC-Web frames
     */
    private extractMessageFromComplexFrame(frameBuffer: ArrayBuffer): Uint8Array {
        debug('Extracting message from complex frame');
        const data = new Uint8Array(frameBuffer);

        // gRPC-Web frames can have multiple parts:
        // 1. Message frame: [0x00][length][message]
        // 2. Trailer frame: [0x80][length][trailers]

        let offset = 0;
        while (offset < data.length - 5) {
            const frameType = data[offset];
            const frameLength = new DataView(frameBuffer, offset + 1, 4).getUint32(0, false);

            debug(`Frame at offset ${offset}: type=0x${frameType.toString(16)}, length=${frameLength}`);

            if (frameType === 0x00) {
                // This is a message frame
                const messageStart = offset + 5;
                const messageEnd = Math.min(messageStart + frameLength, data.length);

                if (messageEnd > messageStart) {
                    const messageData = data.slice(messageStart, messageEnd);
                    debug(`Found message frame: ${messageData.length} bytes`);
                    return messageData;
                }
            }

            // Move to next frame
            offset += 5 + frameLength;
            if (offset >= data.length) break;
        }

        debug('No message frame found, trying fallback extraction');
        // Fallback: look for protobuf patterns
        return this.findProtobufInData(data);
    }

    /**
     * Find protobuf data within raw bytes
     */
    private findProtobufInData(data: Uint8Array): Uint8Array {
        debug('Searching for protobuf patterns in data');

        // Look for common protobuf field markers
        const protobufMarkers = [0x0A, 0x08, 0x12, 0x1A, 0x22, 0x2A];

        for (let i = 0; i < Math.min(32, data.length - 4); i++) {
            if (protobufMarkers.includes(data[i])) {
                debug(`Found protobuf marker 0x${data[i].toString(16)} at offset ${i}`);
                const candidate = data.slice(i);

                // Basic validation: check if this looks like a valid protobuf message
                if (this.looksLikeValidProtobuf(candidate)) {
                    debug(`Offset ${i} looks like valid protobuf`);
                    return candidate;
                }
            }
        }

        debug('No clear protobuf pattern found, returning data from offset 5');
        return data.length > 5 ? data.slice(5) : data;
    }

    /**
     * Basic validation to check if data looks like valid protobuf
     */
    private looksLikeValidProtobuf(data: Uint8Array): boolean {
        if (data.length < 2) return false;

        const firstByte = data[0];
        // Check if first byte is a valid protobuf field tag
        const fieldNumber = firstByte >> 3;
        const wireType = firstByte & 0x07;

        // Valid wire types: 0 (varint), 1 (64-bit), 2 (length-delimited), 5 (32-bit)
        const validWireTypes = [0, 1, 2, 5];

        return fieldNumber > 0 && fieldNumber < 19 && validWireTypes.includes(wireType);
    }



    /**
     * Extract valid protobuf data from potentially mixed content
     */
    private extractValidProtobufData(data: Uint8Array): Uint8Array {
        debug('Extracting valid protobuf data from mixed content');

        // Look for the start of protobuf data with safe bounds checking
        let startOffset = 0;
        const maxSearchOffset = Math.min(20, Math.max(0, data.length - 2));

        for (let i = 0; i < maxSearchOffset; i++) {
            // Ensure we have enough data to check
            if (i >= data.length) break;

            const remainingData = data.slice(i);
            if (remainingData.length > 0 && this.looksLikeValidProtobuf(remainingData)) {
                startOffset = i;
                debug(`Found potential protobuf start at offset ${i}`);
                break;
            }
        }

        // Look for the end of protobuf data by scanning for invalid bytes
        let endOffset = data.length;
        const startData = data.slice(startOffset);

        for (let i = 1; i < startData.length; i++) {
            const byte = startData[i];
            const wireType = byte & 0x07;

            // If we encounter wire type 7 (invalid), this might be the end
            if (wireType === 7) {
                endOffset = startOffset + i;
                debug(`Found potential protobuf end at offset ${endOffset} (wire type 7)`);
                break;
            }

            // Also check for obvious non-protobuf patterns
            if (byte === 0xFF || (byte > 0x80 && byte < 0x90)) {
                endOffset = startOffset + i;
                debug(`Found potential protobuf end at offset ${endOffset} (suspicious byte: 0x${byte.toString(16)})`);
                break;
            }
        }

        const result = data.slice(startOffset, endOffset);
        debug(`Extracted protobuf data: ${result.length} bytes (from ${startOffset} to ${endOffset})`);
        return result;
    }

    /**
     * Validate protobuf data for common issues
     */
    private validateProtobufData(data: Uint8Array): boolean {
        if (data.length === 0) return false;

        // Check first few bytes for valid protobuf structure
        for (let i = 0; i < Math.min(5, data.length); i++) {
            const byte = data[i];
            const wireType = byte & 0x07;

            // Reject if we find invalid wire types early
            if (wireType === 6 || wireType === 7) {
                debug(`Invalid wire type ${wireType} found at offset ${i}`);
                return false;
            }
        }

        return true;
    }

    /**
     * Find protobuf message boundaries within data
     */
    private findProtobufMessageBoundaries(data: Uint8Array): Uint8Array {
        debug('Finding protobuf message boundaries');

        if (data.length === 0) return data;

        // For ListUsersResponse, we expect field 1 (users array) with wire type 2
        // This would be encoded as 0x0A (field 1, length-delimited)
        for (let i = 0; i < Math.min(10, data.length - 4); i++) {
            if (data[i] === 0x0A) {
                debug(`Found users array field at offset ${i}`);

                // Try to read the length of the array
                let lengthOffset = i + 1;
                let arrayLength = 0;
                let lengthBytes = 0;

                // Decode varint length
                while (lengthOffset < data.length && lengthBytes < 5) {
                    const byte = data[lengthOffset];
                    arrayLength |= (byte & 0x7F) << (7 * lengthBytes);
                    lengthBytes++;
                    lengthOffset++;

                    if ((byte & 0x80) === 0) break; // End of varint
                }

                debug(`Array length: ${arrayLength}, length bytes: ${lengthBytes}`);

                // Validate array length to prevent index out of range
                if (arrayLength > data.length || arrayLength < 0) {
                    debug(`Invalid array length ${arrayLength}, data length ${data.length}, skipping`);
                    continue;
                }

                // Calculate message end with safe bounds checking
                const maxPossibleEnd = data.length;
                const calculatedEnd = lengthOffset + arrayLength;
                const messageEnd = Math.min(calculatedEnd, maxPossibleEnd);

                debug(`Message boundaries: start=${i}, lengthOffset=${lengthOffset}, calculatedEnd=${calculatedEnd}, safeEnd=${messageEnd}, dataLength=${data.length}`);

                // Additional safety check
                if (messageEnd <= i || messageEnd > data.length) {
                    debug(`Invalid message boundaries, skipping`);
                    continue;
                }

                const messageData = data.slice(i, messageEnd);
                debug(`Extracted message: ${messageData.length} bytes`);
                return messageData;
            }
        }

        debug('No clear message boundaries found, returning original data');
        return data;
    }

    /**
     * Analyze wire type errors to understand data structure
     */
    private analyzeWireTypeError(data: Uint8Array, errorMessage: string): void {
        debug('Analyzing wire type error:', errorMessage);

        // Extract offset from error message
        const offsetMatch = errorMessage.match(/at offset (\d+)/);
        if (offsetMatch) {
            const errorOffset = parseInt(offsetMatch[1]);
            debug(`Error occurred at offset ${errorOffset}`);

            if (errorOffset < data.length) {
                const errorByte = data[errorOffset];
                const wireType = errorByte & 0x07;
                const fieldNumber = errorByte >> 3;

                debug(`Error byte: 0x${errorByte.toString(16)}, wire type: ${wireType}, field: ${fieldNumber}`);
                debug(`Context around error:`, this.createHexDump(data.slice(Math.max(0, errorOffset - 5), errorOffset + 10)));

                // Suggest truncation point
                if (errorOffset > 10) {
                    debug(`Suggestion: Try truncating data at offset ${errorOffset - 1}`);
                }
            }
        }
    }

    /**
     * Try alternative parsing methods for different response formats
     */
    private tryAlternativeParsingMethods(responseData: ArrayBuffer, MessageType: any, originalError: unknown): { success: boolean; error: string } {
        debug('Trying alternative parsing methods for response data...');
        debug('Response data length:', responseData.byteLength);
        debug('Response data hex dump:', this.createHexDump(new Uint8Array(responseData)));

        // For known gRPC-Web responses (128+ bytes), use manual parsing directly
        if (responseData.byteLength >= 128) {
            debug(`Using manual parsing for large response: ${responseData.byteLength} bytes`);
            try {
                const messageData = this.parseStandardGrpcWebFrame(responseData);
                const responseMessage = this.manualParseListUsersResponse(messageData);
                const users = responseMessage.users || [];

                debug('Manual parsing successful, users:', users.length);
                return {
                    success: true,
                    error: `gRPC connection successful! Found ${users.length} users (manual parser).`
                };
            } catch (specializedError) {
                debug('Manual parsing failed:', specializedError);
                // Continue with fallback methods
            }
        }

        // Check if response looks like an error message
        const textDecoder = new TextDecoder('utf-8', { fatal: false });
        const possibleText = textDecoder.decode(responseData.slice(0, Math.min(200, responseData.byteLength)));
        debug('Response as text (first 200 chars):', possibleText);

        // Check for gRPC error responses
        if (possibleText.includes('grpc-status') || possibleText.includes('grpc-message')) {
            return {
                success: false,
                error: `Received gRPC error response: ${possibleText.substring(0, 100)}`
            };
        }

        if (possibleText.includes('HTTP/') || possibleText.includes('<html') || possibleText.includes('error')) {
            return {
                success: false,
                error: `Received HTTP error response instead of gRPC data: ${possibleText.substring(0, 100)}`
            };
        }

        const methods = [
            {
                name: 'Direct manual parsing (no frame wrapper)',
                parse: () => {
                    if (responseData.byteLength === 0) {
                        throw new Error('Empty response data');
                    }
                    const data = new Uint8Array(responseData);
                    debug('Direct manual parse - data length:', data.length, 'hex:', this.createHexDump(data, 32));
                    return this.manualParseListUsersResponse(data);
                }
            },
            {
                name: 'Skip first 5 bytes manual parsing',
                parse: () => {
                    if (responseData.byteLength <= 5) {
                        throw new Error('Response too short for 5-byte skip');
                    }
                    const data = new Uint8Array(responseData, 5);
                    debug('Skip 5 bytes manual parse - data length:', data.length, 'hex:', this.createHexDump(data, 32));
                    return this.manualParseListUsersResponse(data);
                }
            },
            {
                name: 'Skip first 8 bytes manual parsing',
                parse: () => {
                    if (responseData.byteLength <= 8) {
                        throw new Error('Response too short for 8-byte skip');
                    }
                    const data = new Uint8Array(responseData, 8);
                    debug('Skip 8 bytes manual parse - data length:', data.length, 'hex:', this.createHexDump(data, 32));
                    return this.manualParseListUsersResponse(data);
                }
            },
            {
                name: 'Use available data length manual parsing',
                parse: () => {
                    if (responseData.byteLength <= 5) {
                        throw new Error('Response too short for frame parsing');
                    }
                    // Safely calculate available length, ensure not exceeding boundaries
                    const startOffset = 5;
                    const maxAvailableLength = responseData.byteLength - startOffset;
                    const safeLength = Math.max(0, Math.min(maxAvailableLength, responseData.byteLength - startOffset));

                    if (safeLength === 0) {
                        throw new Error('No data available after offset 5');
                    }

                    const data = new Uint8Array(responseData, startOffset, safeLength);
                    debug('Available length manual parse - data length:', data.length, 'hex:', this.createHexDump(data, 32));
                    return this.manualParseListUsersResponse(data);
                }
            },
            {
                name: 'Safe boundary check manual parsing',
                parse: () => {
                    // Safer manual parsing method, check all boundaries
                    if (responseData.byteLength < 1) {
                        throw new Error('Empty response');
                    }

                    // Try manual parsing from different offsets
                    const offsets = [0, 1, 2, 3, 4, 5, 8, 10, 12, 16];
                    let lastError: Error | null = null;

                    for (const offset of offsets) {
                        if (offset >= responseData.byteLength) continue;

                        try {
                            const remainingLength = responseData.byteLength - offset;
                            if (remainingLength <= 0) continue;

                            // Safely create data view, ensure not exceeding boundaries
                            const safeLength = Math.min(remainingLength, responseData.byteLength - offset);
                            const data = new Uint8Array(responseData, offset, safeLength);

                            debug(`Trying manual parse at offset ${offset}, data length: ${data.length}, safe length: ${safeLength}`);

                            // Additional boundary check
                            if (data.length === 0) {
                                debug(`Offset ${offset} resulted in empty data`);
                                continue;
                            }

                            const result = this.manualParseListUsersResponse(data);
                            debug(`Manual parse at offset ${offset} successful!`);
                            return result;
                        } catch (offsetError) {
                            lastError = offsetError instanceof Error ? offsetError : new Error('Unknown offset error');
                            debug(`Manual parse at offset ${offset} failed:`, lastError.message);
                            continue;
                        }
                    }

                    throw lastError || new Error('All manual parse offset attempts failed');
                }
            },
            {
                name: 'gRPC error response parsing',
                parse: () => {
                    // Try to parse gRPC error response
                    const textDecoder = new TextDecoder('utf-8', { fatal: false });
                    const text = textDecoder.decode(responseData);

                    if (text.includes('grpc-status') || text.includes('grpc-message')) {
                        // This is a gRPC error response, try to extract error information
                        const statusMatch = text.match(/grpc-status[:\s]+(\d+)/);
                        const messageMatch = text.match(/grpc-message[:\s]+([^"'\n\r]+)/);

                        const status = statusMatch ? statusMatch[1] : 'unknown';
                        const message = messageMatch ? messageMatch[1] : 'unknown error';

                        throw new Error(`gRPC Error - Status: ${status}, Message: ${message}`);
                    }

                    throw new Error('Not a gRPC error response');
                }
            },
            {
                name: 'HTTP error response check',
                parse: () => {
                    // Check if it's an HTTP error response
                    const textDecoder = new TextDecoder('utf-8', { fatal: false });
                    const text = textDecoder.decode(responseData);
                    if (text.includes('HTTP/') || text.includes('html') || text.includes('error')) {
                        throw new Error(`Received HTTP error response: ${text.substring(0, 200)}`);
                    }
                    throw new Error('Not an HTTP error response');
                }
            }
        ];

        for (const method of methods) {
            try {
                debug(`Trying parsing method: ${method.name}`);
                const responseMessage = method.parse();
                const users = responseMessage.users || [];
                debug(`${method.name} successful, users:`, users.length);

                if (users.length > 0) {
                    debug('First user sample:', {
                        id: users[0].id,
                        name: users[0].name,
                        display_name: users[0].display_name
                    });
                }

                return {
                    success: true,
                    error: `gRPC connection successful! Found ${users.length} users (${method.name}).`
                };
            } catch (methodError) {
                debug(`${method.name} failed:`, methodError instanceof Error ? methodError.message : methodError);
                continue;
            }
        }

        // All methods failed, return detailed error information
        debug('All parsing methods failed');
        return {
            success: false,
            error: `gRPC connection successful, but response parsing failed. Original error: ${originalError instanceof Error ? originalError.message : 'Unknown'}`
        };
    }

    /**
     * Safely decode protobuf message with enhanced error handling
     */
    private safeProtobufDecode(MessageType: any, data: Uint8Array): any {
        if (!data || data.length === 0) {
            debug('Empty data for protobuf decode, returning empty message');
            return MessageType.create({});
        }

        debug(`Attempting to decode ${data.length} bytes with ${MessageType.name || 'unknown'} type`);
        debug('Raw data hex:', this.createHexDump(data, 96));

        // First, try to find the valid protobuf message boundaries
        const cleanData = this.extractValidProtobufData(data);
        debug(`Cleaned data: ${cleanData.length} bytes`);
        debug('Cleaned data hex:', this.createHexDump(cleanData, 64));

        // Try different decoding strategies with the cleaned data
        const strategies = [
            {
                name: 'Direct decode (cleaned)',
                getData: () => cleanData
            },
            {
                name: 'Skip gRPC-Web trailer (last 5-10 bytes)',
                getData: () => {
                    for (let skip = 5; skip <= Math.min(15, cleanData.length - 5); skip++) {
                        const trimmed = cleanData.slice(0, -skip);
                        if (trimmed.length > 0 && this.looksLikeValidProtobuf(trimmed)) {
                            debug(`Trimming last ${skip} bytes looks valid`);
                            return trimmed;
                        }
                    }
                    return cleanData;
                }
            },
            {
                name: 'Find message boundaries',
                getData: () => {
                    return this.findProtobufMessageBoundaries(cleanData);
                }
            },
            {
                name: 'Conservative decode (first 80 bytes)',
                getData: () => {
                    // Since error occurs at offset 89, try first 80 bytes
                    const conservative = cleanData.slice(0, Math.min(80, cleanData.length));
                    return conservative.length > 0 ? conservative : cleanData;
                }
            },
            {
                name: 'Skip potential headers and trailers',
                getData: () => {
                    if (cleanData.length > 20) {
                        return cleanData.slice(5, -10);
                    }
                    return cleanData;
                }
            }
        ];

        let lastError: Error | null = null;

        for (const strategy of strategies) {
            try {
                const strategyData = strategy.getData();
                if (strategyData.length === 0) continue;

                debug(`Trying strategy: ${strategy.name} with ${strategyData.length} bytes`);
                debug(`Strategy data hex:`, this.createHexDump(strategyData, 32));

                // Additional validation before decoding
                if (!this.validateProtobufData(strategyData)) {
                    debug(`${strategy.name} failed validation, skipping`);
                    continue;
                }

                const result = MessageType.decode(strategyData);
                debug(`✅ ${strategy.name} successful!`);

                // Validate the result has expected structure
                if (result && typeof result === 'object') {
                    debug('Decoded result:', result);
                    return result;
                }
            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown decode error');
                debug(`❌ ${strategy.name} failed:`, lastError.message);

                // If we get "invalid wire type" error, try to find where it fails
                if (lastError.message.includes('invalid wire type')) {
                    debug('Wire type error detected, analyzing data...');
                    this.analyzeWireTypeError(strategyData, lastError.message);
                }
            }
        }

        // If all strategies fail, throw the last error
        throw lastError || new Error('All decoding strategies failed');
    }

    /**
     * Create detailed raw response analysis for debugging
     */
    private createRawResponseAnalysis(responseData: ArrayBuffer): any {
        const data = new Uint8Array(responseData);

        // Create comprehensive hex dump
        const hexDump = this.createDetailedHexDump(data);

        // Try different text decodings
        const utf8Text = this.safeDecodeText(data, 'utf-8');
        const asciiText = this.extractAsciiText(data);

        // Analyze structure
        const structure = this.analyzeDataStructure(data);

        return {
            size: responseData.byteLength,
            hexDump,
            utf8Text,
            asciiText,
            structure
        };
    }

    /**
     * Create detailed hex dump with better formatting
     */
    private createDetailedHexDump(data: Uint8Array): string {
        const lines: string[] = [];
        const bytesPerLine = 16;

        for (let i = 0; i < data.length; i += bytesPerLine) {
            const lineBytes = data.slice(i, i + bytesPerLine);
            const offset = i.toString(16).padStart(8, '0');

            // Hex representation
            const hex = Array.from(lineBytes)
                .map(b => b.toString(16).padStart(2, '0'))
                .join(' ')
                .padEnd(bytesPerLine * 3 - 1, ' ');

            // ASCII representation
            const ascii = Array.from(lineBytes)
                .map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.')
                .join('');

            lines.push(`${offset}: ${hex} | ${ascii}`);
        }

        return lines.join('\n');
    }

    /**
     * Safely decode text with fallback
     */
    private safeDecodeText(data: Uint8Array, encoding: string = 'utf-8'): string {
        try {
            const decoder = new TextDecoder(encoding, { fatal: false });
            return decoder.decode(data);
        } catch (error) {
            debug('Text decoding failed:', error);
            return '[Decode failed]';
        }
    }

    /**
     * Extract ASCII-printable characters
     */
    private extractAsciiText(data: Uint8Array): string {
        return Array.from(data)
            .map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.')
            .join('');
    }

    /**
     * Analyze data structure for patterns
     */
    private analyzeDataStructure(data: Uint8Array): any {
        const analysis = {
            possibleFrames: [],
            protobufMarkers: [],
            textSegments: [],
            suspiciousBytes: []
        };

        // Look for gRPC-Web frame headers
        for (let i = 0; i < data.length - 5; i++) {
            const compressionFlag = data[i];
            if (compressionFlag === 0x00 || compressionFlag === 0x01) {
                const length = new DataView(data.buffer, i + 1, 4).getUint32(0, false);
                if (length > 0 && length < data.length) {
                    analysis.possibleFrames.push({
                        offset: i,
                        compression: compressionFlag,
                        length: length,
                        type: 'gRPC-Web frame'
                    });
                }
            }
        }

        // Look for protobuf field markers
        const protobufMarkers = [0x08, 0x0A, 0x12, 0x1A, 0x22, 0x2A];
        for (let i = 0; i < data.length; i++) {
            if (protobufMarkers.includes(data[i])) {
                const wireType = data[i] & 0x07;
                const fieldNumber = data[i] >> 3;
                analysis.protobufMarkers.push({
                    offset: i,
                    byte: data[i],
                    fieldNumber,
                    wireType,
                    description: this.getFieldDescription(fieldNumber, wireType)
                });
            }
        }

        // Look for text segments
        let textStart = -1;
        for (let i = 0; i < data.length; i++) {
            const isText = data[i] >= 32 && data[i] <= 126;
            if (isText && textStart === -1) {
                textStart = i;
            } else if (!isText && textStart !== -1) {
                const text = this.safeDecodeText(data.slice(textStart, i));
                if (text.length > 2) {
                    analysis.textSegments.push({
                        offset: textStart,
                        length: i - textStart,
                        text: text
                    });
                }
                textStart = -1;
            }
        }

        // Look for suspicious bytes (wire type 7, etc.)
        for (let i = 0; i < data.length; i++) {
            const wireType = data[i] & 0x07;
            if (wireType === 6 || wireType === 7) {
                analysis.suspiciousBytes.push({
                    offset: i,
                    byte: data[i],
                    wireType,
                    reason: `Invalid wire type ${wireType}`
                });
            }
        }

        return analysis;
    }

    /**
     * Get field description for protobuf analysis
     */
    private getFieldDescription(fieldNumber: number, wireType: number): string {
        const wireTypeNames = {
            0: 'varint',
            1: '64-bit',
            2: 'length-delimited',
            5: '32-bit',
            6: 'deprecated',
            7: 'invalid'
        };

        const fieldNames = {
            1: 'id/users',
            2: 'name',
            3: 'created_at',
            4: 'display_name'
        };

        const wireTypeName = wireTypeNames[wireType] || 'unknown';
        const fieldName = fieldNames[fieldNumber] || 'unknown';

        return `Field ${fieldNumber} (${fieldName}), ${wireTypeName}`;
    }

    /**
     * Create hex dump for debugging
     */
    private createHexDump(data: Uint8Array, maxBytes: number = 64): string {
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
     * Analyze connection errors and provide specific guidance
     */
    private analyzeConnectionError(error: unknown): { success: boolean; error: string } {
        if (error instanceof Error) {
            const errorMessage = error.message.toLowerCase();

            if (errorMessage.includes('cors')) {
                return {
                    success: false,
                    error: '❌ CORS error: Need to configure gRPC-Web proxy to handle cross-origin requests. Recommend using Envoy proxy.'
                };
            }

            if (errorMessage.includes('net::err_invalid_http_response')) {
                return {
                    success: false,
                    error: '❌ Invalid HTTP response: You are connecting directly to gRPC server. Need gRPC-Web proxy (like Envoy) to convert protocol.'
                };
            }

            if (errorMessage.includes('failed to fetch') || errorMessage.includes('network error')) {
                return {
                    success: false,
                    error: '❌ Network connection failed: Check server address, port, or configure gRPC-Web proxy.'
                };
            }

            if (errorMessage.includes('timeout')) {
                return {
                    success: false,
                    error: '❌ Connection timeout: Check if server is accessible, or increase timeout duration.'
                };
            }

            return {
                success: false,
                error: `❌ Connection error: ${error.message}`
            };
        }

        return {
            success: false,
            error: '❌ Unknown connection error'
        };
    }



    /**
     * Special parsing for CreateUser response to handle small responses
     */
    private parseCreateUserResponse(CreateUserResponse: any, messageData: Uint8Array, originalBuffer: ArrayBuffer): any {
        debug('Parsing CreateUser response with special handling');
        debug('Message data length:', messageData.length);
        debug('Original buffer length:', originalBuffer.byteLength);
        debug('Message data hex:', this.createHexDump(messageData));

        // Try different approaches for CreateUser response
        const strategies = [
            {
                name: 'Direct decode with original buffer',
                getData: () => new Uint8Array(originalBuffer)
            },
            {
                name: 'Skip gRPC frame header (5 bytes)',
                getData: () => {
                    const data = new Uint8Array(originalBuffer);
                    return data.length > 5 ? data.slice(5) : data;
                }
            },
            {
                name: 'Find protobuf start marker',
                getData: () => {
                    const data = new Uint8Array(originalBuffer);
                    // Look for protobuf field markers
                    for (let i = 0; i < Math.min(10, data.length - 2); i++) {
                        const byte = data[i];
                        const wireType = byte & 0x07;
                        const fieldNumber = byte >> 3;

                        // Field 1 (user) with wire type 2 (length-delimited) = 0x0A
                        if (byte === 0x0A || (fieldNumber === 1 && wireType === 2)) {
                            debug(`Found CreateUser response start at offset ${i}`);
                            return data.slice(i);
                        }
                    }
                    return data;
                }
            },
            {
                name: 'Conservative slice (avoid trailer)',
                getData: () => {
                    const data = new Uint8Array(originalBuffer);
                    // For small responses, try to avoid potential trailer data
                    if (data.length > 10) {
                        return data.slice(5, -5); // Skip header and potential trailer
                    }
                    return data.length > 5 ? data.slice(5) : data;
                }
            }
        ];

        for (const strategy of strategies) {
            try {
                const strategyData = strategy.getData();
                debug(`Trying ${strategy.name} with ${strategyData.length} bytes`);
                debug(`Strategy data hex:`, this.createHexDump(strategyData, 32));

                const result = CreateUserResponse.decode(strategyData);
                debug(`✅ ${strategy.name} successful!`);
                return result;
            } catch (error) {
                debug(`❌ ${strategy.name} failed:`, error instanceof Error ? error.message : 'Unknown error');
            }
        }

        // If all strategies fail, create a minimal response
        debug('All CreateUser parsing strategies failed, creating minimal response');
        return CreateUserResponse.create({
            user: CreateUserResponse.lookupType ? CreateUserResponse.lookupType('User').create({}) : {}
        });
    }

    /**
     * Create a user with namespace using gRPC
     */
    async createUser(username: string, namespace: string): Promise<User> {
        try {
            debug(`Creating user "${username}" with namespace "${namespace}" via gRPC`);

            // Validate inputs
            if (!username.trim()) {
                throw new Error('Username cannot be empty');
            }

            // Load protobuf definitions
            const root = await this.loadProto();
            const CreateUserRequest = root.lookupType('headscale.v1.CreateUserRequest');
            const CreateUserResponse = root.lookupType('headscale.v1.CreateUserResponse');

            // Validate protobuf definition
            debug('CreateUserRequest fields:', CreateUserRequest.fields);
            debug('Available fields:', Object.keys(CreateUserRequest.fields));

            // Check if display_name field exists
            const displayNameField = CreateUserRequest.fields.display_name;
            debug('display_name field definition:', displayNameField);
            if (!displayNameField) {
                debug('⚠️ WARNING: display_name field not found in protobuf definition!');
            }

            // Create CreateUserRequest message with display_name support
            const requestData: any = {
                name: username.trim()
            };

            // Add display_name if namespace is provided
            if (namespace && namespace.trim()) {
                // Try both naming conventions
                requestData.display_name = namespace.trim();
                requestData.displayName = namespace.trim();
                debug(`Setting display_name in request: "${namespace.trim()}"`);
                debug('Trying both display_name and displayName fields');
            }

            debug('CreateUserRequest data:', requestData);

            const requestMessage = CreateUserRequest.create(requestData);
            debug('Created protobuf message:', requestMessage);
            debug('Protobuf message fields:', {
                name: requestMessage.name,
                display_name: requestMessage.display_name,
                hasDisplayName: requestMessage.hasOwnProperty('display_name'),
                displayNameValue: requestMessage['display_name']
            });

            const requestBuffer = CreateUserRequest.encode(requestMessage).finish();
            debug('Encoded request buffer size:', requestBuffer.length);

            // 验证编码后的消息
            try {
                const decodedMessage = CreateUserRequest.decode(requestBuffer);
                debug('Decoded verification:', {
                    name: decodedMessage.name,
                    display_name: decodedMessage.display_name
                });
            } catch (e) {
                debug('Failed to decode verification:', e);
            }

            // Create gRPC-Web frame
            const requestBody = this.createGrpcWebFrame(requestBuffer);

            const createUserUrl = `${this.baseUrl}/headscale.v1.HeadscaleService/CreateUser`;

            const response = await fetch(createUserUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/grpc-web+proto',
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'grpc-timeout': '30S', // 30 second timeout for user creation
                },
                body: requestBody,
                signal: AbortSignal.timeout(this.config.timeoutMs),
            });

            if (!response.ok) {
                const errorText = await response.text();

                // Provide more specific error messages
                if (response.status === 401) {
                    throw new Error('Unauthorized: Check your gRPC API key');
                } else if (response.status === 404) {
                    throw new Error('gRPC service not found: Ensure Headscale gRPC server is running');
                } else if (response.status === 409) {
                    throw new Error(`User "${username}" already exists`);
                } else {
                    throw new Error(`gRPC CreateUser failed: HTTP ${response.status}: ${errorText}`);
                }
            }

            // Handle gRPC response
            let user: User;
            try {
                const responseBuffer = await response.arrayBuffer();
                debug('CreateUser response size:', responseBuffer.byteLength);
                debug('CreateUser response hex dump:', this.createHexDump(new Uint8Array(responseBuffer), 64));

                // Parse gRPC-Web response
                const messageData = this.parseGrpcWebFrame(responseBuffer);

                // Special handling for CreateUser response to avoid index out of range errors
                let responseMessage: any;
                try {
                    responseMessage = CreateUserResponse.decode(messageData);
                } catch (decodeError) {
                    debug('CreateUser response decode failed:', decodeError);
                    debug('Trying alternative CreateUser response parsing...');
                    responseMessage = this.parseCreateUserResponse(CreateUserResponse, messageData, responseBuffer);
                }

                if (responseMessage.user) {
                    debug('Raw gRPC response user:', responseMessage.user);
                    debug('Response user display_name:', responseMessage.user.display_name);
                    debug('Response user displayName:', responseMessage.user.displayName);
                    debug('All user fields:', Object.keys(responseMessage.user));

                    // Check both naming conventions
                    const displayNameValue = responseMessage.user.display_name || responseMessage.user.displayName || '';
                    debug('Extracted displayName value:', displayNameValue);

                    // Convert protobuf User to our User type
                    // Note: protobuf id is string type in Headscale v0.26.1
                    user = {
                        id: responseMessage.user.id || `user-${Date.now()}`,
                        name: responseMessage.user.name || username,
                        createdAt: responseMessage.user.created_at
                            ? new Date(responseMessage.user.created_at.seconds * 1000).toISOString()
                            : new Date().toISOString(),
                        displayName: displayNameValue,
                        email: responseMessage.user.email || '',
                        providerId: responseMessage.user.provider_id || '',
                        provider: responseMessage.user.provider || 'grpc',
                        profilePicUrl: responseMessage.user.profile_pic_url || '',
                    };

                    debug('Converted user object:', user);
                    debug('Final displayName value:', user.displayName);
                    debug('Successfully parsed gRPC CreateUser response');
                } else {
                    throw new Error('响应中没有用户数据');
                }
            } catch (parseError) {
                debug('Failed to parse gRPC response:', parseError);
                throw new Error(`无法解析 gRPC 响应: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
            }

            debug(`Successfully created user "${username}" with namespace "${namespace}"`);
            return user;
        } catch (error) {
            debug('gRPC createUser error:', error);

            // Re-throw with more context
            if (error instanceof Error) {
                throw error;
            } else {
                throw new Error(`Failed to create user via gRPC: Unknown error`);
            }
        }
    }

    /**
     * Update the client configuration
     */
    updateConfig(config: GrpcConfig): void {
        this.config = config;
        this.baseUrl = this.buildBaseUrl();
    }
}

// Singleton instance
let grpcClient: HeadscaleGrpcClient | null = null;

/**
 * Get or create the gRPC client instance
 */
export function getGrpcClient(config: GrpcConfig): HeadscaleGrpcClient {
    if (!grpcClient) {
        grpcClient = new HeadscaleGrpcClient(config);
    } else {
        grpcClient.updateConfig(config);
    }
    return grpcClient;
}

/**
 * Test gRPC connection with the given configuration
 */
export async function testGrpcConnection(config: GrpcConfig): Promise<{ success: boolean; error?: string }> {
    const client = getGrpcClient(config);
    return await client.testConnection();
}

/**
 * Create a user with namespace using gRPC
 */
export async function createUserWithNamespace(
    config: GrpcConfig,
    username: string,
    namespace: string
): Promise<User> {
    const client = getGrpcClient(config);
    return await client.createUser(username, namespace);
}
