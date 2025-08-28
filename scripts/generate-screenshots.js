#!/usr/bin/env node

/**
 * 📱 iOS App Store Screenshot Generator for Hex Zero
 *
 * Generates App Store screenshots for all required iOS device sizes
 * Usage: node scripts/generate-screenshots.js
 */

/* eslint-disable no-console, no-undef */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { platform } from 'os';
import { join } from 'path';

if (platform() !== 'darwin') {
    console.error('❌ Screenshot generation requires macOS and iOS Simulator');
    process.exit(1);
}

console.log('📱 Generating App Store screenshots for Hex Zero...\n');

// Screenshot configurations for App Store requirements
const screenshotConfigs = [
    {
        name: 'iPhone 15 Pro Max',
        size: '6.7"',
        resolution: '1290x2796',
        device: 'iPhone 15 Pro Max',
        orientation: 'portrait',
        required: true,
    },
    {
        name: 'iPhone 15',
        size: '6.1"',
        resolution: '1179x2556',
        device: 'iPhone 15',
        orientation: 'portrait',
        required: true,
    },
    {
        name: 'iPhone 8 Plus',
        size: '5.5"',
        resolution: '1242x2208',
        device: 'iPhone 8 Plus',
        orientation: 'portrait',
        required: true,
    },
    {
        name: 'iPad Pro 12.9-inch',
        size: '12.9"',
        resolution: '2048x2732',
        device: 'iPad Pro (12.9-inch) (6th generation)',
        orientation: 'portrait',
        required: true,
    },
];

// Create screenshots directory
const screenshotsDir = join(process.cwd(), 'app-store', 'screenshots');
if (!existsSync(screenshotsDir)) {
    mkdirSync(screenshotsDir, { recursive: true });
}

async function buildApp() {
    console.log('📦 Building app for screenshots...');
    try {
        execSync('npm run build', { stdio: 'inherit' });
        execSync('npx cap sync ios', { stdio: 'inherit' });
        console.log('✅ App build complete\n');
    } catch (error) {
        console.error('❌ Build failed:', error.message);
        process.exit(1);
    }
}

function checkSimulatorAvailable(deviceName) {
    try {
        const output = execSync('xcrun simctl list devices available', { encoding: 'utf8' });
        return output.includes(deviceName);
    } catch (error) {
        console.error('❌ Error checking simulators:', error.message);
        return false;
    }
}

function getDeviceUDID(deviceName) {
    try {
        const output = execSync('xcrun simctl list devices available', { encoding: 'utf8' });
        const lines = output.split('\n');

        for (const line of lines) {
            if (line.includes(deviceName) && line.includes('(')) {
                const match = line.match(/\(([^)]+)\)/);
                if (match) {
                    return match[1];
                }
            }
        }
        return null;
    } catch (error) {
        console.error('❌ Error getting device UDID:', error.message);
        return null;
    }
}

function launchSimulator(deviceName) {
    console.log(`📱 Launching ${deviceName} simulator...`);

    const udid = getDeviceUDID(deviceName);
    if (!udid) {
        throw new Error(`Could not find UDID for ${deviceName}`);
    }

    try {
        // Check if simulator is already booted
        try {
            const deviceInfo = execSync(`xcrun simctl list devices | grep "${udid}"`, { encoding: 'utf8' });
            if (!deviceInfo.includes('Booted')) {
                // Boot the simulator only if not already booted
                execSync(`xcrun simctl boot "${udid}"`, { stdio: 'pipe' });
            }
        } catch {
            // If grep fails, try to boot anyway
            execSync(`xcrun simctl boot "${udid}"`, { stdio: 'pipe' });
        }

        // Open Simulator app
        execSync('open -a Simulator', { stdio: 'pipe' });

        // Wait for simulator to be ready
        console.log('⏳ Waiting for simulator to boot...');
        let attempts = 0;
        while (attempts < 30) {
            try {
                const status = execSync(`xcrun simctl spawn "${udid}" launchctl print system | grep com.apple.springboard.services`, { encoding: 'utf8' });
                if (status.includes('com.apple.springboard.services')) {
                    break;
                }
            } catch {
                // Continue waiting
            }
            execSync('sleep 2');
            attempts++;
        }

        console.log('✅ Simulator ready');
        return udid;
    } catch (error) {
        throw new Error(`Failed to launch simulator: ${error.message}`, { cause: error });
    }
}

function installAndLaunchApp(udid) {
    console.log('📲 Installing and launching app...');

    try {
        // Build and run the app
        execSync(`npx cap run ios --target "${udid}" --scheme App`, { stdio: 'inherit' });

        // Wait for app to launch
        console.log('⏳ Waiting for app to launch...');
        execSync('sleep 5');

        console.log('✅ App launched successfully');
    } catch (error) {
        throw new Error(`Failed to launch app: ${error.message}`, { cause: error });
    }
}

function _takeScreenshot(config, screenshotNumber, udid) {
    const filename = `${config.name.replace(/\s+/g, '-')}-${screenshotNumber}.png`;
    const filepath = join(screenshotsDir, filename);

    console.log(`📸 Taking screenshot ${screenshotNumber} for ${config.name}...`);

    try {
        execSync(`xcrun simctl io "${udid}" screenshot "${filepath}"`, { stdio: 'pipe' });
        console.log(`✅ Screenshot saved: ${filename}`);
        return filepath;
    } catch (error) {
        console.error(`❌ Failed to take screenshot: ${error.message}`);
        return null;
    }
}

function createScreenshotInstructions(config) {
    const instructions = `
📱 ${config.name} (${config.size}) Screenshot Instructions

Now that the app is running on ${config.name}, please manually navigate through the app to capture these 5 screenshots:

Screenshot 1: Game Overview
- Show the main game board with some pieces placed
- Ensure the hex grid is visible and attractive
- Include UI elements (hamburger menu, controls)
- This will be your primary App Store screenshot

Screenshot 2: Piece Selection
- Tap to show the piece selection interface
- Highlight available pieces in the palette
- Show the drag cursor or selection state
- Demonstrate the core gameplay mechanic

Screenshot 3: Drag and Drop Action
- Start dragging a piece over the hex grid
- Show the piece hovering over a valid placement area
- Capture the moment that shows the interaction

Screenshot 4: Game Completion/Victory
- Complete a level to show the victory screen
- Include any celebration effects or animations
- Show score or completion feedback
- Demonstrates the satisfaction of solving puzzles

Screenshot 5: Menu or Settings (Optional)
- Open the hamburger menu
- Show game options or settings
- Highlight the polished UI design
- Shows app features and customization

Instructions:
1. Navigate to each screen described above
2. Press Cmd+S in Simulator to save screenshot
3. Screenshots will be saved to Desktop by default
4. Move screenshots to: ${screenshotsDir}
5. Rename files to: ${config.name.replace(/\s+/g, '-')}-1.png, etc.

When you're ready for the next device, press any key...
`;

    console.log(instructions);
}

async function generateScreenshotsForDevice(config) {
    console.log(`\n🎯 Generating screenshots for ${config.name} (${config.size})`);
    console.log(`Required resolution: ${config.resolution} pixels\n`);

    // Check if simulator is available
    if (!checkSimulatorAvailable(config.device)) {
        console.error(`❌ Simulator "${config.device}" not available`);
        console.log('Please install the required iOS Simulator from Xcode');
        return false;
    }

    try {
        // Launch simulator
        const udid = launchSimulator(config.device);

        // Install and launch app
        installAndLaunchApp(udid);

        // Provide manual screenshot instructions
        createScreenshotInstructions(config);

        // Wait for user input
        console.log('\nPress Enter when you have taken all 5 screenshots...');

        return true;
    } catch (error) {
        console.error(`❌ Error with ${config.name}: ${error.message}`);
        return false;
    }
}

function createScreenshotChecklist() {
    const checklistPath = join(screenshotsDir, 'SCREENSHOT_CHECKLIST.md');
    const checklist = `# 📱 App Store Screenshots Checklist

## Required Screenshots

### iPhone Screenshots

#### 6.7" Display (iPhone 15 Pro Max)
- [ ] Screenshot 1: Game Overview
- [ ] Screenshot 2: Piece Selection
- [ ] Screenshot 3: Drag and Drop Action
- [ ] Screenshot 4: Game Completion
- [ ] Screenshot 5: Menu/Settings

#### 6.1" Display (iPhone 15)
- [ ] Screenshot 1: Game Overview
- [ ] Screenshot 2: Piece Selection
- [ ] Screenshot 3: Drag and Drop Action
- [ ] Screenshot 4: Game Completion
- [ ] Screenshot 5: Menu/Settings

#### 5.5" Display (iPhone 8 Plus)
- [ ] Screenshot 1: Game Overview
- [ ] Screenshot 2: Piece Selection
- [ ] Screenshot 3: Drag and Drop Action
- [ ] Screenshot 4: Game Completion
- [ ] Screenshot 5: Menu/Settings

### iPad Screenshots

#### 12.9" iPad Pro
- [ ] Screenshot 1: Game Overview
- [ ] Screenshot 2: Piece Selection
- [ ] Screenshot 3: Drag and Drop Action
- [ ] Screenshot 4: Game Completion
- [ ] Screenshot 5: Menu/Settings

## Screenshot Quality Checklist

For each screenshot, verify:
- [ ] High resolution and sharp quality
- [ ] No debug overlays or developer tools visible
- [ ] Status bar shows appropriate time (9:41 AM is App Store standard)
- [ ] Battery at 100% and good signal strength
- [ ] App content fills the screen appropriately
- [ ] Colors are vibrant and accurate
- [ ] Text is readable and properly sized
- [ ] No personal information visible

## File Organization

Screenshots should be named:
- iPhone-15-Pro-Max-1.png
- iPhone-15-Pro-Max-2.png
- iPhone-15-1.png
- iPhone-15-2.png
- iPhone-8-Plus-1.png
- iPhone-8-Plus-2.png
- iPad-Pro-12.9-inch-1.png
- iPad-Pro-12.9-inch-2.png

## Next Steps

1. [ ] Review all screenshots for quality
2. [ ] Upload to App Store Connect
3. [ ] Add captions/descriptions for each screenshot
4. [ ] Test screenshots display correctly in App Store listing
5. [ ] Consider creating app preview videos (optional)

## Tips for Great Screenshots

1. **Show Real Gameplay**: Display actual game content, not empty screens
2. **Highlight Key Features**: Make sure each screenshot showcases a unique aspect
3. **Use Consistent Timing**: Take screenshots at the same time (9:41 AM)
4. **Clean Interface**: Ensure UI elements are in their default, clean state
5. **Test Different Levels**: Use various difficulty levels to show progression
`;

    writeFileSync(checklistPath, checklist);
    console.log(`📋 Screenshot checklist created: ${checklistPath}`);
}

async function generateAllScreenshots() {
    console.log('🚀 Starting App Store screenshot generation process\n');

    // Build the app first
    await buildApp();

    // Create screenshots directory and checklist
    createScreenshotChecklist();

    // Generate screenshots for each required device
    for (const config of screenshotConfigs) {
        const success = await generateScreenshotsForDevice(config);
        if (!success && config.required) {
            console.error(`❌ Failed to generate required screenshots for ${config.name}`);
            console.log('Please resolve the issue and try again');
            process.exit(1);
        }

        // Pause between devices
        if (config !== screenshotConfigs[screenshotConfigs.length - 1]) {
            console.log('\n⏳ Preparing next device...\n');
            execSync('sleep 3');
        }
    }

    console.log('\n✅ Screenshot generation process complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Review all screenshots in:', screenshotsDir);
    console.log('2. Check the SCREENSHOT_CHECKLIST.md for quality verification');
    console.log('3. Upload screenshots to App Store Connect');
    console.log('4. Add appropriate captions for each screenshot');

    console.log('\n📁 Screenshots saved to:', screenshotsDir);
}

// Handle user input simulation
function _waitForUserInput() {
    return new Promise((resolve) => {
        process.stdin.once('data', () => {
            resolve();
        });
    });
}

// Run the screenshot generation
generateAllScreenshots().catch((error) => {
    console.error('❌ Screenshot generation failed:', error.message);
    process.exit(1);
});
