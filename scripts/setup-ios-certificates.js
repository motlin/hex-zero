#!/usr/bin/env node

/**
 * Script to guide iOS certificate and provisioning profile setup
 * Usage: node scripts/setup-ios-certificates.js
 */

/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🍎 iOS Development Certificate Setup Guide');
console.log('==========================================\n');

console.log('📋 Prerequisites Checklist:');
console.log('============================\n');

const prerequisites = [
    '✅ Apple Developer Program membership ($99/year)',
    '✅ Xcode installed (latest version recommended)',
    '✅ Access to Apple Developer Portal',
    '✅ Team Admin or Developer role permissions',
];

prerequisites.forEach(item => {
    console.log(item);
});

console.log('\n🔐 Certificate Setup Process:');
console.log('==============================\n');

const setupSteps = [
    {
        step: 1,
        title: 'Generate Certificate Signing Request (CSR)',
        instructions: [
            'Open Keychain Access application',
            'Go to Keychain Access > Certificate Assistant > Request Certificate from Certificate Authority',
            'Enter your email address and common name',
            'Select "Saved to disk" and continue',
            'Save the CSR file for upload to Apple Developer Portal',
        ],
    },
    {
        step: 2,
        title: 'Create Development Certificate',
        instructions: [
            'Visit Apple Developer Portal (developer.apple.com)',
            'Navigate to Certificates, IDs & Profiles',
            'Click "+" to create new certificate',
            'Select "iOS Development"',
            'Upload the CSR file created in step 1',
            'Download the certificate (.cer file)',
            'Double-click to install in Keychain Access',
        ],
    },
    {
        step: 3,
        title: 'Create Distribution Certificate',
        instructions: [
            'In Apple Developer Portal > Certificates',
            'Click "+" for new certificate',
            'Select "iOS Distribution (App Store and Ad Hoc)"',
            'Upload a new CSR file (generate another one if needed)',
            'Download and install the distribution certificate',
        ],
    },
    {
        step: 4,
        title: 'Register App ID',
        instructions: [
            'Go to Identifiers section in Developer Portal',
            'Click "+" to register new identifier',
            'Select "App IDs" and choose "App" type',
            'Set Description: "Hex Zero Game"',
            'Set Bundle ID: "com.hexzero.game" (explicit)',
            'Save the App ID configuration',
        ],
    },
    {
        step: 5,
        title: 'Create Development Provisioning Profile',
        instructions: [
            'Navigate to Profiles section',
            'Click "+" to create new profile',
            'Select "iOS App Development"',
            'Choose the Hex Zero App ID',
            'Select your development certificate',
            'Add development devices for testing',
            'Name: "Hex Zero Development"',
            'Download and install the .mobileprovision file',
        ],
    },
    {
        step: 6,
        title: 'Create Distribution Provisioning Profile',
        instructions: [
            'In Profiles section, create new profile',
            'Select "App Store" distribution type',
            'Choose Hex Zero App ID',
            'Select iOS Distribution certificate',
            'Name: "Hex Zero App Store"',
            'Download and install profile',
        ],
    },
];

setupSteps.forEach(stepInfo => {
    console.log(`📋 Step ${stepInfo.step}: ${stepInfo.title}`);
    stepInfo.instructions.forEach(instruction => {
        console.log(`   • ${instruction}`);
    });
    console.log('');
});

console.log('🔧 Xcode Configuration:');
console.log('=======================\n');

console.log('1. Open iOS project:');
console.log('   cd ios/App');
console.log('   open App.xcworkspace\n');

console.log('2. Configure App Target:');
console.log('   • Select "App" target in project navigator');
console.log('   • Go to "Signing & Capabilities" tab');
console.log('   • Set Team to your Apple Developer account');
console.log('   • Verify Bundle Identifier: com.hexzero.game\n');

console.log('3. Development Signing (Recommended):');
console.log('   ✅ Automatically manage signing');
console.log('   Team: [Your Development Team]');
console.log('   Provisioning Profile: Xcode Managed Profile\n');

console.log('4. Distribution Signing (Manual for App Store):');
console.log('   ❌ Automatically manage signing');
console.log('   Provisioning Profile: Hex Zero App Store');
console.log('   Signing Certificate: iOS Distribution\n');

console.log('🧪 Verification Steps:');
console.log('======================\n');

const verificationSteps = [
    'Check installed certificates: security find-identity -v -p codesigning',
    'List provisioning profiles: ls ~/Library/MobileDevice/Provisioning\\ Profiles/',
    'Build project in Xcode for device target',
    'Verify no signing errors in build log',
    'Test app installation on registered device',
];

verificationSteps.forEach((step, index) => {
    console.log(`${index + 1}. ${step}`);
});

console.log('\n🚀 Next Steps After Setup:');
console.log('===========================\n');

const nextSteps = [
    'Create App Store Connect app record',
    'Configure app metadata and descriptions',
    'Prepare app screenshots and marketing materials',
    'Set up TestFlight for beta testing',
    'Submit for App Store review',
];

nextSteps.forEach((step, index) => {
    console.log(`${index + 1}. ${step}`);
});

console.log('\n⚠️  Important Security Notes:');
console.log('==============================\n');

const securityNotes = [
    '🔒 Never commit .p12 files or private keys to version control',
    '🔒 Export certificates as .p12 for secure team sharing',
    '🔒 Use strong passwords for certificate exports',
    '🔒 Store provisioning profiles and certificates securely',
    '🔒 Rotate certificates before expiration (1 year validity)',
];

securityNotes.forEach(note => {
    console.log(note);
});

console.log('\n📚 Documentation References:');
console.log('=============================\n');

const references = [
    '📖 Apple Developer Documentation: developer.apple.com/documentation/',
    '📖 Code Signing Guide: developer.apple.com/support/code-signing/',
    '📖 App Store Connect Help: help.apple.com/app-store-connect/',
    '📖 Capacitor iOS Guide: capacitorjs.com/docs/ios',
    '📖 Full setup guide: docs/IOS_DEVELOPMENT_SETUP.md',
];

references.forEach(ref => {
    console.log(ref);
});

// Check current project configuration
console.log('\n🔍 Current Project Configuration:');
console.log('==================================\n');

try {
    const projectPath = path.join(__dirname, '..', 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');
    const projectContent = fs.readFileSync(projectPath, 'utf8');

    const bundleIdMatch = projectContent.match(/PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);/);
    const codeSignMatch = projectContent.match(/CODE_SIGN_STYLE = ([^;]+);/);

    console.log(`Bundle Identifier: ${bundleIdMatch ? bundleIdMatch[1] : 'Not found'}`);
    console.log(`Code Sign Style: ${codeSignMatch ? codeSignMatch[1] : 'Not found'}`);

    if (bundleIdMatch && bundleIdMatch[1] === 'com.hexzero.game') {
        console.log('✅ Bundle identifier is correctly configured');
    } else {
        console.log('⚠️  Bundle identifier may need to be updated to com.hexzero.game');
    }

    if (codeSignMatch && codeSignMatch[1] === 'Automatic') {
        console.log('✅ Automatic code signing is enabled (good for development)');
    } else {
        console.log('📝 Manual code signing is configured');
    }

} catch (_error) {
    console.log('❌ Could not read Xcode project configuration');
    console.log('   Make sure you are running this from the project root directory');
}

console.log('\n✨ Setup complete! Follow the steps above to configure iOS development certificates.');
console.log('📋 See docs/IOS_DEVELOPMENT_SETUP.md for detailed instructions.');
