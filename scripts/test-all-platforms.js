#!/usr/bin/env node

/**
 * 🧪 Cross-Platform Testing Script for Hex Zero
 *
 * Builds and tests the app on all available platforms
 * Usage: node scripts/test-all-platforms.js
 */

/* eslint-disable no-console, no-undef */

import { execSync } from 'child_process';
import { platform } from 'os';

console.log('🧪 Testing Hex Zero on all platforms...\n');

async function runTests() {
    try {
        // Build web assets once
        console.log('📦 Building web assets...');
        execSync('npm run build', { stdio: 'inherit' });

        // Sync all platforms
        console.log('\n🔄 Syncing all platforms...');
        execSync('npx cap sync', { stdio: 'inherit' });

        // Test Android
        console.log('\n🤖 Testing Android...');
        console.log('Select an Android emulator from the list:');
        execSync('npx cap run android', { stdio: 'inherit' });

        // Test iOS (macOS only)
        if (platform() === 'darwin') {
            console.log('\n🍎 Testing iOS...');
            console.log('Select an iOS simulator from the list:');
            execSync('npx cap run ios', { stdio: 'inherit' });
        } else {
            console.log('\n⚠️  Skipping iOS (requires macOS)');
        }

        console.log('\n✅ All platform tests completed!');
        console.log('\n📋 Testing Checklist:');
        console.log('- [ ] Game loads without errors');
        console.log('- [ ] Touch interactions work correctly');
        console.log('- [ ] UI scales properly on different screen sizes');
        console.log('- [ ] Performance is acceptable (60 FPS target)');
        console.log('- [ ] No memory leaks or crashes');
        console.log('\nSee docs/CROSS_PLATFORM_TESTING.md for full checklist');

    } catch (error) {
        console.error('❌ Testing failed:', error.message);
        process.exit(1);
    }
}

runTests();
