#!/usr/bin/env node

/**
 * 🔐 Android Keystore Generation Script for Hex Zero
 *
 * This script generates a release keystore for signing the Android app
 * for Google Play Store distribution.
 *
 * Usage: node scripts/generate-android-keystore.js
 */

/* eslint-disable no-console, line-comment-position, no-undef */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔐 Android Keystore Generation for Hex Zero');
console.log('============================================\n');

// Keystore configuration
const keystoreConfig = {
    filename: 'hex-zero-release.keystore',
    alias: 'hex-zero-key',
    validity: 25 * 365, // 25 years (recommended for Play Store)
    keysize: 2048,
    algorithm: 'RSA',
};

const keystorePath = path.join(__dirname, '..', 'android', 'app', keystoreConfig.filename);

console.log('📋 Keystore Configuration:');
console.log('===========================\n');
console.log(`Filename: ${keystoreConfig.filename}`);
console.log(`Alias: ${keystoreConfig.alias}`);
console.log(`Validity: ${keystoreConfig.validity} days (${Math.floor(keystoreConfig.validity / 365)} years)`);
console.log(`Key Size: ${keystoreConfig.keysize} bits`);
console.log(`Algorithm: ${keystoreConfig.algorithm}`);
console.log(`Location: ${keystorePath}\n`);

// Check if keystore already exists
if (fs.existsSync(keystorePath)) {
    console.log('⚠️  Keystore already exists at:');
    console.log(`   ${keystorePath}\n`);
    console.log('🛡️  Security Warning:');
    console.log('   Generating a new keystore will invalidate the existing one.');
    console.log('   Apps signed with different keystores cannot be updated in Play Store.');
    console.log('   Only proceed if you need to replace the existing keystore.\n');
    console.log('❌ Aborting keystore generation to prevent accidental replacement.');
    console.log('   Delete the existing keystore file if you want to generate a new one.\n');
    process.exit(1);
}

console.log('🔧 Generating Android Release Keystore...\n');

// Information required for keystore
console.log('📝 Required Information:');
console.log('========================\n');
console.log('You will be prompted for the following information:');
console.log('• Keystore password (REQUIRED - store securely!)');
console.log('• Key password (REQUIRED - can be same as keystore password)');
console.log('• Your full name (e.g., "John Doe")');
console.log('• Organization unit (e.g., "Development Team" or leave blank)');
console.log('• Organization name (e.g., "Hex Zero Games" or your company)');
console.log('• City or locality (e.g., "San Francisco")');
console.log('• State or province (e.g., "California" or "CA")');
console.log('• Country code (e.g., "US", "GB", "CA")\n');

console.log('🔒 Security Reminders:');
console.log('======================\n');
console.log('• Use a STRONG password (at least 12 characters)');
console.log('• Store the password in a secure password manager');
console.log('• NEVER commit the keystore file to version control');
console.log('• Create secure backups of both keystore and passwords');
console.log('• Losing the keystore means you cannot update your app!\n');

try {
    // Generate the keystore using keytool
    const keytoolCommand = [
        'keytool',
        '-genkeypair',
        '-v',
        `-keystore "${keystorePath}"`,
        `-alias ${keystoreConfig.alias}`,
        `-keyalg ${keystoreConfig.algorithm}`,
        `-keysize ${keystoreConfig.keysize}`,
        `-validity ${keystoreConfig.validity}`,
        '-storetype PKCS12',
    ].join(' ');

    console.log('🔨 Running keytool command...\n');
    console.log('The keytool will now prompt you for the required information.\n');

    execSync(keytoolCommand, {
        stdio: 'inherit',
        cwd: path.dirname(keystorePath),
    });

    console.log('\n✅ Keystore generated successfully!');
    console.log(`📁 Location: ${keystorePath}\n`);

    // Verify the keystore was created
    if (fs.existsSync(keystorePath)) {
        console.log('🔍 Keystore Verification:');
        console.log('=========================\n');

        try {
            const verifyCommand = `keytool -list -v -keystore "${keystorePath}" -alias ${keystoreConfig.alias}`;
            console.log('Keystore details:');
            execSync(verifyCommand, { stdio: 'inherit' });
        } catch (_verifyError) {
            console.log('⚠️  Could not verify keystore (this is usually not a problem)');
        }

        console.log('\n📝 Next Steps:');
        console.log('==============\n');
        console.log('1. Update android/gradle.properties with signing configuration');
        console.log('2. Update android/app/build.gradle with release signing config');
        console.log('3. Store keystore passwords securely');
        console.log('4. Create backup of keystore file');
        console.log('5. Add keystore to .gitignore if not already excluded\n');

        console.log('🔗 For complete setup instructions, see:');
        console.log('   docs/ANDROID_DEVELOPMENT_SETUP.md\n');

    } else {
        console.log('❌ Keystore file was not created. Check for errors above.');
        process.exit(1);
    }

} catch (error) {
    console.log('\n❌ Error generating keystore:');
    console.log(`   ${error.message}\n`);

    console.log('💡 Common Solutions:');
    console.log('====================\n');
    console.log('• Ensure Java JDK is installed and keytool is in PATH');
    console.log('• Check that the android/app directory exists');
    console.log('• Verify you have write permissions to the directory');
    console.log('• Try running with administrator/sudo privileges if needed\n');

    process.exit(1);
}

console.log('🎉 Android keystore setup complete!');
console.log('🔐 Remember to store your passwords securely and create backups!');
