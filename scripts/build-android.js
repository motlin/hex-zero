#!/usr/bin/env node

/**
 * 🤖 Android Build Script for Hex Zero
 *
 * Automates the build and deployment process for Android Emulator
 * Usage: node scripts/build-android.js
 */

/* eslint-disable no-console, no-undef */

import { execSync } from 'child_process';

console.log('🤖 Building Hex Zero for Android...\n');

try {
    // Build web assets
    console.log('📦 Building web assets...');
    execSync('npm run build', { stdio: 'inherit' });

    // Sync with Android
    console.log('\n🔄 Syncing with Android platform...');
    execSync('npx cap sync android', { stdio: 'inherit' });

    // Run on emulator
    console.log('\n📱 Launching on Android Emulator...');
    execSync('npx cap run android', { stdio: 'inherit' });

} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}

console.log('\n✅ Android build completed successfully!');
