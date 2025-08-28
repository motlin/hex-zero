#!/usr/bin/env node
/* eslint-disable no-console */
/* global process */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
📱 Hex Zero Version Update Script

Usage: node scripts/update-version.js <version> [--build-number <number>]

Examples:
  node scripts/update-version.js 1.0.1
  node scripts/update-version.js 1.1.0 --build-number 42
  node scripts/update-version.js patch
  node scripts/update-version.js minor
  node scripts/update-version.js major

Version formats:
  - Semantic version (e.g., 1.2.3)
  - Version bump keywords: patch, minor, major

Build number:
  - If not specified, auto-increments from current build
  - Must be an integer for Android versionCode

This script updates version numbers in:
  - package.json
  - Android build.gradle
  - iOS project (via Capacitor)
  - Creates a version.json file for reference
`);
    process.exit(0);
}

const versionArg = args[0];
const buildNumberIndex = args.indexOf('--build-number');
const customBuildNumber = buildNumberIndex !== -1 ? args[buildNumberIndex + 1] : null;

// Helper function to read JSON files
function readJSON(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Helper function to write JSON files
function writeJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

// Parse semantic version
function parseVersion(version) {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
    if (!match) {
        throw new Error(`Invalid version format: ${version}. Expected format: X.Y.Z`);
    }
    return {
        major: parseInt(match[1]),
        minor: parseInt(match[2]),
        patch: parseInt(match[3]),
    };
}

// Convert version object to string
function versionToString(versionObj) {
    return `${versionObj.major}.${versionObj.minor}.${versionObj.patch}`;
}

// Calculate Android versionCode from version
// Formula: (major * 10000) + (minor * 100) + patch
// This allows for up to 99 minor versions and 99 patches per minor version
function calculateVersionCode(version, buildNumber) {
    if (buildNumber) {
        return parseInt(buildNumber);
    }
    const { major, minor, patch } = parseVersion(version);
    return (major * 10000) + (minor * 100) + patch;
}

// Get current version from package.json
function getCurrentVersion() {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = readJSON(packagePath);
    return packageJson.version;
}

// Bump version based on type
function bumpVersion(currentVersion, bumpType) {
    const version = parseVersion(currentVersion);

    switch (bumpType) {
        case 'major':
            version.major++;
            version.minor = 0;
            version.patch = 0;
            break;
        case 'minor':
            version.minor++;
            version.patch = 0;
            break;
        case 'patch':
            version.patch++;
            break;
        default:
            throw new Error(`Unknown bump type: ${bumpType}`);
    }

    return versionToString(version);
}

// Main update function
async function updateVersion() {
    try {
        const currentVersion = getCurrentVersion();
        console.log(`📊 Current version: ${currentVersion}`);

        // Determine new version
        let newVersion;
        if (['patch', 'minor', 'major'].includes(versionArg)) {
            newVersion = bumpVersion(currentVersion, versionArg);
        } else {
            // Validate version format
            parseVersion(versionArg);
            newVersion = versionArg;
        }

        console.log(`📱 Updating to version: ${newVersion}`);

        // Calculate build number
        const versionCode = calculateVersionCode(newVersion, customBuildNumber);
        console.log(`🔢 Build number (versionCode): ${versionCode}`);

        // Update package.json
        const packagePath = path.join(__dirname, '..', 'package.json');
        const packageJson = readJSON(packagePath);
        packageJson.version = newVersion;
        writeJSON(packagePath, packageJson);
        console.log('✅ Updated package.json');

        // Update Android build.gradle
        const gradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
        let gradleContent = fs.readFileSync(gradlePath, 'utf8');

        // Update versionCode
        gradleContent = gradleContent.replace(
            /versionCode\s+\d+/,
            `versionCode ${versionCode}`,
        );

        // Update versionName
        gradleContent = gradleContent.replace(
            /versionName\s+"[^"]+"/,
            `versionName "${newVersion}"`,
        );

        fs.writeFileSync(gradlePath, gradleContent);
        console.log('✅ Updated Android build.gradle');

        // Create version.json for reference
        const versionInfo = {
            version: newVersion,
            versionCode: versionCode,
            buildNumber: versionCode,
            lastUpdated: new Date().toISOString(),
            platform: {
                ios: {
                    CFBundleShortVersionString: newVersion,
                    CFBundleVersion: versionCode.toString(),
                },
                android: {
                    versionName: newVersion,
                    versionCode: versionCode,
                },
            },
        };

        const versionPath = path.join(__dirname, '..', 'version.json');
        writeJSON(versionPath, versionInfo);
        console.log('✅ Created version.json');

        // Update iOS using Capacitor
        console.log('🍎 Updating iOS version...');
        try {
            // Capacitor automatically syncs version from package.json to iOS
            await execAsync('npx cap sync ios', { cwd: path.join(__dirname, '..') });
            console.log('✅ Updated iOS version via Capacitor sync');
        } catch (_error) {
            console.warn('⚠️  Could not sync iOS automatically. You may need to update manually in Xcode.');
            console.log('   Set MARKETING_VERSION to', newVersion);
            console.log('   Set CURRENT_PROJECT_VERSION to', versionCode);
        }

        console.log('\n✨ Version update complete!');
        console.log(`📋 Version: ${newVersion}`);
        console.log(`📱 Build Number: ${versionCode}`);
        console.log('\n💡 Next steps:');
        console.log('   1. Review the changes');
        console.log('   2. Commit with: git add -A && git commit -m "Bump version to ' + newVersion + '"');
        console.log('   3. Tag the release: git tag v' + newVersion);
        console.log('   4. Build and test on both platforms');

    } catch (error) {
        console.error('❌ Error updating version:', error.message);
        process.exit(1);
    }
}

// Run the update
updateVersion();
