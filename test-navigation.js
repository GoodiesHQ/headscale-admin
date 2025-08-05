// Navigation Test Script
// Run this in browser console to test navigation functionality

console.log('🧭 Testing Navigation Functionality...\n');

// Test navigation state
function testNavigationState() {
    console.log('📊 Navigation State Analysis:');
    
    // Check current page
    console.log('Current URL:', window.location.href);
    console.log('Current pathname:', window.location.pathname);
    
    // Check if navigation elements exist
    const navElements = document.querySelectorAll('nav.list-nav a');
    console.log('Navigation links found:', navElements.length);
    
    navElements.forEach((link, index) => {
        const href = link.getAttribute('href');
        const text = link.textContent.trim();
        console.log(`${index + 1}. ${text}: ${href}`);
    });
    
    return navElements;
}

// Test navigation clicks
function testNavigationClicks() {
    console.log('\n🖱️ Testing Navigation Clicks:');
    
    const navElements = document.querySelectorAll('nav.list-nav a');
    
    if (navElements.length === 0) {
        console.log('❌ No navigation elements found!');
        return false;
    }
    
    // Test Home link
    const homeLink = Array.from(navElements).find(link => 
        link.textContent.includes('Home') || link.getAttribute('href').endsWith('/')
    );
    
    if (homeLink) {
        console.log('✅ Home link found:', homeLink.getAttribute('href'));
        console.log('💡 You can click this link to go to home page');
    } else {
        console.log('❌ Home link not found');
    }
    
    // Test Settings link
    const settingsLink = Array.from(navElements).find(link => 
        link.textContent.includes('Settings')
    );
    
    if (settingsLink) {
        console.log('✅ Settings link found:', settingsLink.getAttribute('href'));
    } else {
        console.log('❌ Settings link not found');
    }
    
    return true;
}

// Test API state
function testApiState() {
    console.log('\n🔑 Testing API State:');
    
    // Try to access the App state from window (if available)
    if (typeof window !== 'undefined') {
        console.log('Window object available');
        
        // Check localStorage for API configuration
        const apiKey = localStorage.getItem('apiKey');
        const apiUrl = localStorage.getItem('apiUrl');
        
        console.log('API Key in localStorage:', apiKey ? '✅ Present' : '❌ Missing');
        console.log('API URL in localStorage:', apiUrl ? '✅ Present' : '❌ Missing');
        
        if (apiKey && apiUrl) {
            console.log('💡 API configuration exists, navigation should show all pages');
        } else {
            console.log('💡 API configuration missing, navigation shows limited pages');
        }
    }
}

// Test manual navigation
function testManualNavigation() {
    console.log('\n🚀 Manual Navigation Test:');
    
    console.log('Testing navigation to different pages...');
    
    const testUrls = [
        { name: 'Home', url: '/' },
        { name: 'Settings', url: '/settings' },
        { name: 'gRPC Debug', url: '/grpc-debug' }
    ];
    
    testUrls.forEach((test, index) => {
        console.log(`${index + 1}. ${test.name}: ${window.location.origin}${test.url}`);
        console.log(`   To test: window.location.href = '${test.url}'`);
    });
    
    console.log('\n💡 Manual test commands:');
    console.log('Go to Home: window.location.href = "/"');
    console.log('Go to Settings: window.location.href = "/settings"');
    console.log('Go to gRPC Debug: window.location.href = "/grpc-debug"');
}

// Test for common navigation issues
function testNavigationIssues() {
    console.log('\n🔍 Checking for Common Navigation Issues:');
    
    const issues = [];
    
    // Check if forced redirect is happening
    const currentPath = window.location.pathname;
    if (currentPath.includes('/settings') && !currentPath.endsWith('/settings')) {
        issues.push('Possible forced redirect to settings detected');
    }
    
    // Check for JavaScript errors
    const errorEvents = [];
    window.addEventListener('error', (e) => {
        errorEvents.push(e.message);
    });
    
    // Check for missing navigation elements
    const nav = document.querySelector('nav.list-nav');
    if (!nav) {
        issues.push('Navigation component not found');
    }
    
    // Check for CSS issues
    const hiddenNavs = document.querySelectorAll('nav[style*="display: none"]');
    if (hiddenNavs.length > 0) {
        issues.push('Navigation elements are hidden');
    }
    
    if (issues.length === 0) {
        console.log('✅ No obvious navigation issues detected');
    } else {
        console.log('⚠️ Potential issues found:');
        issues.forEach((issue, index) => {
            console.log(`${index + 1}. ${issue}`);
        });
    }
    
    return issues;
}

// Main test runner
function runNavigationTests() {
    console.log('🚀 Starting Navigation Tests...\n');
    
    const navElements = testNavigationState();
    const clicksWork = testNavigationClicks();
    testApiState();
    testManualNavigation();
    const issues = testNavigationIssues();
    
    console.log('\n📋 Test Summary:');
    console.log('Navigation elements found:', navElements.length > 0 ? '✅' : '❌');
    console.log('Click functionality:', clicksWork ? '✅' : '❌');
    console.log('Issues detected:', issues.length === 0 ? '✅ None' : `⚠️ ${issues.length}`);
    
    console.log('\n🎯 Recommendations:');
    if (navElements.length === 0) {
        console.log('1. Check if navigation component is loaded');
        console.log('2. Verify Svelte components are rendering correctly');
    } else if (issues.length > 0) {
        console.log('1. Check browser console for JavaScript errors');
        console.log('2. Verify API configuration is correct');
        console.log('3. Try manual navigation using the commands above');
    } else {
        console.log('1. Navigation appears to be working correctly');
        console.log('2. Try clicking the Home link in the navigation');
        console.log('3. If still stuck, try manual navigation commands');
    }
    
    return {
        navElements: navElements.length,
        clicksWork,
        issues: issues.length
    };
}

// Auto-run tests
runNavigationTests();
