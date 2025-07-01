#!/usr/bin/env node

/**
 * 📱 Android Play Store Screenshot Generator for Hex Zero
 *
 * Generates Play Store screenshots for all required Android device categories
 * Usage: node scripts/generate-android-screenshots.js
 */

/* eslint-disable no-console, no-undef */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('🤖 Generating Play Store screenshots for Hex Zero...\n');

// Screenshot configurations for Play Store requirements
const screenshotConfigs = [
    {
        name: 'Phone',
        category: 'phone',
        device: 'Pixel 6',
        api: '33',
        resolution: '1080x2400',
        dpi: '420',
        required: true,
    },
    {
        name: 'Tablet 7-inch',
        category: '7-inch-tablet',
        device: 'Nexus 7',
        api: '33',
        resolution: '1200x1920',
        dpi: '320',
        required: true,
    },
    {
        name: 'Tablet 10-inch',
        category: '10-inch-tablet',
        device: 'Pixel C',
        api: '33',
        resolution: '2560x1800',
        dpi: '320',
        required: true,
    },
];

// Create screenshots directory structure
const screenshotsBaseDir = join(process.cwd(), 'play-store', 'screenshots');

async function buildApp() {
    console.log('📦 Building app for Android screenshots...');
    try {
        execSync('npm run build', { stdio: 'inherit' });
        execSync('npx cap sync android', { stdio: 'inherit' });
        console.log('✅ App build complete\n');
    } catch (error) {
        console.error('❌ Build failed:', error.message);
        process.exit(1);
    }
}

function checkEmulatorAvailable(deviceName) {
    try {
        const output = execSync('emulator -list-avds', { encoding: 'utf8' });
        return output.split('\n').some(avd => avd.includes(deviceName));
    } catch (error) {
        console.error('❌ Error checking emulators:', error.message);
        return false;
    }
}

function createEmulator(deviceName, api) {
    console.log(`📱 Creating Android emulator for ${deviceName}...`);
    try {
        const avdName = `${deviceName.replace(/\s+/g, '_')}_API_${api}`;

        // Create AVD
        execSync(
            `echo no | avdmanager create avd -n "${avdName}" -k "system-images;android-${api};google_apis;x86_64" -d "${deviceName}"`,
            { stdio: 'inherit' },
        );

        console.log(`✅ Emulator ${avdName} created`);
        return avdName;
    } catch (error) {
        console.error(`❌ Failed to create emulator: ${error.message}`);
        return null;
    }
}

function launchEmulator(avdName) {
    console.log(`🚀 Launching ${avdName} emulator...`);

    try {
        // Launch emulator in background
        execSync(`emulator -avd "${avdName}" -no-snapshot-load &`, { stdio: 'pipe' });

        // Wait for emulator to boot
        console.log('⏳ Waiting for emulator to boot...');
        let attempts = 0;
        while (attempts < 60) {
            try {
                const bootComplete = execSync('adb shell getprop sys.boot_completed', { encoding: 'utf8' });
                if (bootComplete.trim() === '1') {
                    break;
                }
            } catch {
                // Continue waiting
            }
            execSync('sleep 2');
            attempts++;
        }

        console.log('✅ Emulator ready');
        return true;
    } catch (error) {
        console.error(`❌ Failed to launch emulator: ${error.message}`);
        return false;
    }
}

function installAndLaunchApp() {
    console.log('📲 Installing and launching app...');

    try {
        // Build and install the app
        execSync('npx cap run android', { stdio: 'inherit' });

        // Wait for app to launch
        console.log('⏳ Waiting for app to launch...');
        execSync('sleep 5');

        console.log('✅ App launched successfully');
    } catch (error) {
        throw new Error(`Failed to launch app: ${error.message}`);
    }
}

function takeScreenshot(config, screenshotNumber) {
    const categoryDir = join(screenshotsBaseDir, config.category);
    if (!existsSync(categoryDir)) {
        mkdirSync(categoryDir, { recursive: true });
    }

    const filename = `screenshot-${screenshotNumber}.png`;
    const filepath = join(categoryDir, filename);

    console.log(`📸 Taking screenshot ${screenshotNumber} for ${config.name}...`);

    try {
        execSync(`adb exec-out screencap -p > "${filepath}"`, { stdio: 'pipe' });
        console.log(`✅ Screenshot saved: ${config.category}/${filename}`);
        return filepath;
    } catch (error) {
        console.error(`❌ Failed to take screenshot: ${error.message}`);
        return null;
    }
}

function createScreenshotInstructions(config) {
    const instructions = `
🤖 ${config.name} (${config.resolution}) Screenshot Instructions

Now that the app is running on ${config.name}, please manually navigate through the app to capture these screenshots:

Screenshot 1: Game Overview
- Show the main game board with some pieces placed
- Ensure the hex grid is visible and attractive
- Include UI elements (hamburger menu, controls)

Screenshot 2: Active Gameplay
- Show a piece being dragged or placed
- Demonstrate the core puzzle-solving mechanic
- Make sure touch interactions are clear

Screenshot 3: Level Completion
- Complete a level to show the victory screen
- Include any celebration effects
- Show score or completion feedback

Screenshot 4: Game Variety
- Show a different level or difficulty
- Demonstrate the variety of puzzles available
- Highlight different game states

Screenshot 5: Menu/Settings
- Open the hamburger menu or settings
- Show available options and features
- Demonstrate UI polish

Screenshot 6: Feature Highlight (Optional)
- Show any unique features or modes
- Could be statistics, achievements, etc.
- Highlight what makes your game special

Instructions:
1. Navigate to each screen described above
2. Press Enter to take a screenshot at each screen
3. Screenshots will be saved to: ${join(screenshotsBaseDir, config.category)}

Press Enter to take screenshot 1...
`;

    console.log(instructions);
}

async function generateScreenshotsForDevice(config) {
    console.log(`\n🎯 Generating screenshots for ${config.name} (${config.resolution})`);

    // Check if emulator exists or create it
    const avdName = `${config.device.replace(/\s+/g, '_')}_API_${config.api}`;
    if (!checkEmulatorAvailable(avdName)) {
        const created = createEmulator(config.device, config.api);
        if (!created) {
            console.error(`❌ Failed to create emulator for ${config.name}`);
            return false;
        }
    }

    try {
        // Launch emulator
        if (!launchEmulator(avdName)) {
            throw new Error('Failed to launch emulator');
        }

        // Install and launch app
        installAndLaunchApp();

        // Provide manual screenshot instructions
        createScreenshotInstructions(config);

        // Take screenshots interactively
        for (let i = 1; i <= 6; i++) {
            console.log(`\nPress Enter to take screenshot ${i}...`);
            takeScreenshot(config, i);
        }

        // Kill emulator
        console.log('\n🛑 Shutting down emulator...');
        execSync('adb emu kill', { stdio: 'pipe' });

        return true;
    } catch (error) {
        console.error(`❌ Error with ${config.name}: ${error.message}`);
        return false;
    }
}

function createMetadataFiles() {
    const metadataDir = join(process.cwd(), 'play-store', 'metadata');

    // Short description (80 characters max)
    const shortDescription = 'Strategic hex puzzle game - place pieces to fill the board completely';
    writeFileSync(join(metadataDir, 'short-description.txt'), shortDescription);

    // Full description (4000 characters max)
    const fullDescription = `Hex Zero is a strategic puzzle game that challenges your spatial reasoning and planning skills.

🎯 GAMEPLAY
Place hexagonal pieces on the board to fill every space. Each piece must fit perfectly, and every hex must be covered to complete the level. Simple to learn, challenging to master!

🎮 FEATURES
• Clean, minimalist design focused on gameplay
• Intuitive drag-and-drop controls
• Multiple difficulty levels
• Smooth animations and responsive feedback
• No ads, no in-app purchases - just pure puzzle solving

🧩 PERFECT FOR
• Puzzle enthusiasts looking for a new challenge
• Fans of spatial reasoning games
• Anyone who enjoys strategic thinking
• Players seeking a relaxing yet engaging experience

💡 CHALLENGE YOUR MIND
Each level presents a unique puzzle that requires careful planning. Can you find the perfect arrangement to fill the entire board?

🌟 WHY HEX ZERO?
• No time pressure - solve at your own pace
• Elegant hex-based gameplay
• Satisfying completion animations
• Progressive difficulty curve
• Designed for both quick sessions and extended play

Master the art of hexagonal placement in this captivating puzzle experience!`;

    writeFileSync(join(metadataDir, 'full-description.txt'), fullDescription);

    // Title (30 characters max)
    const title = 'Hex Zero: Puzzle Strategy';
    writeFileSync(join(metadataDir, 'title.txt'), title);

    // Keywords
    const keywords = 'hex,puzzle,strategy,brain,logic,hexagon,spatial,reasoning,board,casual';
    writeFileSync(join(metadataDir, 'keywords.txt'), keywords);

    // Category suggestions
    const category = 'GAME_PUZZLE';
    writeFileSync(join(metadataDir, 'category.txt'), category);

    // Content rating
    const contentRating = 'Everyone';
    writeFileSync(join(metadataDir, 'content-rating.txt'), contentRating);

    console.log('📝 Metadata files created in play-store/metadata/');
}

function createGraphicsChecklist() {
    const checklistPath = join(process.cwd(), 'play-store', 'PLAY_STORE_CHECKLIST.md');
    const checklist = `# 🤖 Google Play Store Submission Checklist

## Required Graphics

### Feature Graphic
- [ ] Size: 1024x500 pixels
- [ ] Format: PNG or JPEG
- [ ] Location: play-store/graphics/feature-graphic.png
- [ ] Shows game branding and key visual elements
- [ ] No embedded text that needs localization

### Screenshots
Minimum 2, maximum 8 per device type

#### Phone Screenshots (Required)
- [ ] Screenshot 1: Main game view
- [ ] Screenshot 2: Active gameplay
- [ ] Screenshot 3: Victory/completion screen
- [ ] Screenshot 4: Game variety
- [ ] Screenshot 5: Menu/features
- [ ] Location: play-store/screenshots/phone/

#### 7-inch Tablet Screenshots (Required)
- [ ] Screenshot 1: Main game view
- [ ] Screenshot 2: Active gameplay
- [ ] Screenshot 3: Victory/completion screen
- [ ] Screenshot 4: Game variety
- [ ] Location: play-store/screenshots/7-inch-tablet/

#### 10-inch Tablet Screenshots (Required)
- [ ] Screenshot 1: Main game view
- [ ] Screenshot 2: Active gameplay
- [ ] Screenshot 3: Victory/completion screen
- [ ] Screenshot 4: Game variety
- [ ] Location: play-store/screenshots/10-inch-tablet/

### Optional Graphics

#### App Icon
- [ ] Size: 512x512 pixels
- [ ] Format: PNG (32-bit)
- [ ] Location: play-store/graphics/icon-512.png

#### Promotional Graphics
- [ ] Promo Video: YouTube URL (optional)
- [ ] TV Banner: 1280x720 (if supporting Android TV)

## Store Listing Information

### Basic Information
- [ ] App name: Hex Zero: Puzzle Strategy (30 chars max)
- [ ] Short description (80 chars max) - Created ✓
- [ ] Full description (4000 chars max) - Created ✓

### Categorization
- [ ] Category: Game > Puzzle
- [ ] Tags: Single player, Offline, Casual

### Content Rating
- [ ] Complete content rating questionnaire
- [ ] Expected rating: Everyone

### Contact Information
- [ ] Developer email
- [ ] Developer website (optional)
- [ ] Privacy policy URL (required)

## Testing Setup

### Internal Testing
- [ ] Upload signed APK or AAB
- [ ] Add internal testers (email addresses)
- [ ] Test installation and updates
- [ ] Verify no crashes or ANRs

### Pre-launch Report
- [ ] Review automated test results
- [ ] Fix any compatibility issues
- [ ] Address accessibility warnings

## Release Preparation

### Build Configuration
- [ ] Generate signed release build
- [ ] Use Android App Bundle (AAB) format
- [ ] Enable app signing by Google Play

### Pricing & Distribution
- [ ] Set as Free
- [ ] Select available countries
- [ ] No ads declaration
- [ ] No in-app purchases

### Final Checklist
- [ ] All graphics uploaded and properly sized
- [ ] Store listing complete in all sections
- [ ] Content rating obtained
- [ ] Privacy policy published and linked
- [ ] Signed AAB uploaded
- [ ] Internal testing completed
- [ ] Ready for production release

## Notes
- Screenshots should show actual gameplay
- Avoid text in images that would need translation
- Feature graphic is the most important visual element
- Test on multiple Android versions before release
`;

    writeFileSync(checklistPath, checklist);
    console.log(`📋 Play Store checklist created: ${checklistPath}`);
}

async function generateAllScreenshots() {
    console.log('🚀 Starting Play Store screenshot generation process\n');

    // Build the app first
    await buildApp();

    // Create metadata files
    createMetadataFiles();

    // Create checklist
    createGraphicsChecklist();

    // Note about manual screenshot process
    console.log('\n📱 IMPORTANT: Android screenshot generation requires manual interaction');
    console.log('You will need to navigate through the app for each device type.\n');
    console.log('This process will:');
    console.log('1. Launch an emulator for each device type');
    console.log('2. Install and run the app');
    console.log('3. Guide you through taking screenshots');
    console.log('4. Save screenshots to the appropriate directories\n');

    console.log('Press Enter to continue...');

    // Generate screenshots for each device type
    for (const config of screenshotConfigs) {
        const success = await generateScreenshotsForDevice(config);
        if (!success && config.required) {
            console.error(`❌ Failed to generate required screenshots for ${config.name}`);
            console.log('Please resolve the issue and try again');
        }
    }

    console.log('\n✅ Screenshot generation process complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Review screenshots in:', screenshotsBaseDir);
    console.log('2. Create feature graphic (1024x500) in: play-store/graphics/');
    console.log('3. Review metadata files in: play-store/metadata/');
    console.log('4. Check PLAY_STORE_CHECKLIST.md for submission requirements');
    console.log('5. Upload to Google Play Console');
}

// Run the screenshot generation
generateAllScreenshots().catch((error) => {
    console.error('❌ Screenshot generation failed:', error.message);
    process.exit(1);
});
