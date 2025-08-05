// Test script to verify the preauthkey API fix
// This script tests the API calls to ensure they use user IDs instead of usernames

const API_BASE = 'https://yourdomain.com:8088';
const API_KEY = 'your-api-key-here'; // Replace with actual API key

async function testGetUsers() {
    console.log('Testing GET /api/v1/user...');
    try {
        const response = await fetch(`${API_BASE}/api/v1/user`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.error('Failed to get users:', response.status, response.statusText);
            return null;
        }
        
        const data = await response.json();
        console.log('Users fetched successfully:', data.users.length, 'users');
        return data.users;
    } catch (error) {
        console.error('Error fetching users:', error);
        return null;
    }
}

async function testGetPreAuthKeysWithUserId(userId) {
    console.log(`Testing GET /api/v1/preauthkey?user=${userId}...`);
    try {
        const response = await fetch(`${API_BASE}/api/v1/preauthkey?user=${userId}`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.error('Failed to get preauth keys:', response.status, response.statusText);
            const text = await response.text();
            console.error('Response body:', text);
            return false;
        }
        
        const data = await response.json();
        console.log('PreAuth keys fetched successfully:', data.preAuthKeys.length, 'keys');
        return true;
    } catch (error) {
        console.error('Error fetching preauth keys:', error);
        return false;
    }
}

async function testGetPreAuthKeysWithUsername(username) {
    console.log(`Testing GET /api/v1/preauthkey?user=${username} (should fail)...`);
    try {
        const response = await fetch(`${API_BASE}/api/v1/preauthkey?user=${username}`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.log('Expected failure with username:', response.status, response.statusText);
            const text = await response.text();
            console.log('Error message:', text);
            return false;
        }
        
        console.log('Unexpected success with username - this should not happen');
        return true;
    } catch (error) {
        console.log('Expected error with username:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('=== Testing Headscale PreAuthKey API Fix ===\n');
    
    // First, get users to have test data
    const users = await testGetUsers();
    if (!users || users.length === 0) {
        console.error('No users found or failed to fetch users. Cannot continue tests.');
        return;
    }
    
    const testUser = users[0];
    console.log(`Using test user: ${testUser.name} (ID: ${testUser.id})\n`);
    
    // Test with user ID (should work)
    console.log('--- Test 1: Using User ID (should work) ---');
    const successWithId = await testGetPreAuthKeysWithUserId(testUser.id);
    
    console.log('\n--- Test 2: Using Username (should fail) ---');
    const failureWithUsername = await testGetPreAuthKeysWithUsername(testUser.name);
    
    console.log('\n=== Test Results ===');
    console.log(`User ID test: ${successWithId ? 'PASS' : 'FAIL'}`);
    console.log(`Username test: ${!failureWithUsername ? 'PASS (expected failure)' : 'FAIL (unexpected success)'}`);
    
    if (successWithId && !failureWithUsername) {
        console.log('\n✅ All tests passed! The API expects user IDs, not usernames.');
    } else {
        console.log('\n❌ Some tests failed. Check the API behavior.');
    }
}

// Note: This script is for manual testing only
// Replace the API_KEY with your actual API key and run in a browser console or Node.js
console.log('To run this test:');
console.log('1. Replace API_KEY with your actual Headscale API key');
console.log('2. Run runTests() in a browser console or Node.js environment');
console.log('3. Check the results to confirm the API behavior');
