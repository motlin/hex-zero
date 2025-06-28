#!/usr/bin/env node

/**
 * 🍎 iOS Build Script for Hex Zero
 *
 * Automates the build and deployment process for iOS Simulator
 * Usage: node scripts/build-ios.js
 */

/* eslint-disable no-console, no-undef */

import { execSync } from 'child_process';
import { platform } from 'os';

if (platform() !== 'darwin') {
    console.error('❌ iOS builds require macOS');
    process.exit(1);
}

console.log('🍎 Building Hex Zero for iOS...\n');

try {
    // Build web assets
    console.log('📦 Building web assets...');
    execSync('npm run build', { stdio: 'inherit' });

    // Sync with iOS
    console.log('\n🔄 Syncing with iOS platform...');
    execSync('npx cap sync ios', { stdio: 'inherit' });

    // Run on simulator
    console.log('\n📱 Launching on iOS Simulator...');
    execSync('npx cap run ios', { stdio: 'inherit' });

} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}

console.log('\n✅ iOS build completed successfully!');
