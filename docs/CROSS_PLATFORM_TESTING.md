# 📱 Cross-Platform Testing Workflow for Hex Zero

Comprehensive guide for testing the Hex Zero mobile app on iOS and Android platforms.

## 📋 Quick Start Commands

### iOS Testing

```bash
# Build and run on iOS Simulator
npm run build && npm run ios

# Open in Xcode for advanced debugging
npm run build && npx cap sync ios && npx cap open ios
```

### Android Testing

```bash
# Build and run on Android Emulator
npm run build && npm run android

# Open in Android Studio for advanced debugging
npm run build && npx cap sync android && npx cap open android
```

## 🍎 iOS Testing Workflow

### Prerequisites

1. **macOS**: Required for iOS development
2. **Xcode**: Latest version from Mac App Store
3. **Xcode Command Line Tools**: `xcode-select --install`
4. **CocoaPods**: `sudo gem install cocoapods`

### Building for iOS Simulator

#### Step 1: Build Web Assets

```bash
npm run build
```

#### Step 2: Sync to iOS Platform

```bash
npx cap sync ios
```

This command:

-   Copies web assets to `ios/App/App/public`
-   Updates native dependencies
-   Syncs Capacitor plugins
-   Updates iOS project configuration

#### Step 3: Run on Simulator

**Option A: Command Line (Recommended)**

```bash
npx cap run ios
```

Select target device when prompted, or specify directly:

```bash
# List available simulators
npx cap run ios --list

# Run on specific simulator
npx cap run ios --target "iPhone 15"
```

**Option B: Via Xcode**

```bash
npx cap open ios
```

In Xcode:

1. Select target device from toolbar
2. Click "Run" button or press `Cmd+R`
3. Use Xcode debugger for native debugging

### Testing on Physical iOS Devices

#### Prerequisites

1. Apple Developer Account (free or paid)
2. Device connected via USB
3. Device trusted on Mac

#### Setup Steps

1. **Enable Developer Mode on Device** (iOS 16+)

    - Settings → Privacy & Security → Developer Mode → Enable
    - Restart device when prompted

2. **Configure Xcode**

    ```bash
    npx cap open ios
    ```

    - Select your Apple ID in Xcode → Preferences → Accounts
    - Select project → Signing & Capabilities
    - Enable "Automatically manage signing"
    - Select your team

3. **Trust Developer Certificate on Device**

    - After first install: Settings → General → VPN & Device Management
    - Trust your developer certificate

4. **Build and Run**

    ```bash
    # List connected devices
    npx cap run ios --list

    # Run on connected device
    npx cap run ios --target "Your iPhone Name"
    ```

## 🤖 Android Testing Workflow

### Prerequisites

1. **Android Studio**: Latest version
2. **Android SDK**: API 23+ (via Android Studio)
3. **Java JDK**: Version 11+ recommended
4. **Environment Variables**:
    ```bash
    export ANDROID_HOME=$HOME/Library/Android/sdk
    export PATH=$PATH:$ANDROID_HOME/emulator
    export PATH=$PATH:$ANDROID_HOME/platform-tools
    ```

### Building for Android Emulator

#### Step 1: Build Web Assets

```bash
npm run build
```

#### Step 2: Sync to Android Platform

```bash
npx cap sync android
```

This command:

-   Copies web assets to `android/app/src/main/assets/public`
-   Updates native dependencies
-   Syncs Capacitor plugins
-   Updates Android project configuration

#### Step 3: Run on Emulator

**Option A: Command Line (Recommended)**

```bash
npx cap run android
```

Select target device when prompted, or specify directly:

```bash
# List available emulators
npx cap run android --list

# Run on specific emulator
npx cap run android --target "Pixel_7_API_34"
```

**Option B: Via Android Studio**

```bash
npx cap open android
```

In Android Studio:

1. Wait for Gradle sync to complete
2. Select target device from toolbar
3. Click "Run" button or press `Shift+F10`
4. Use Android Studio debugger for native debugging

### Creating Android Emulators

1. Open Android Studio → Tools → AVD Manager
2. Click "Create Virtual Device"
3. Recommended configurations:
    - **Phone**: Pixel 7, Pixel 4, Nexus 5X
    - **Tablet**: Pixel Tablet, Nexus 10
    - **API Levels**: 28 (Pie), 31 (Android 12), 34 (Android 14)
    - **Enable**: Hardware acceleration

### Testing on Physical Android Devices

1. **Enable Developer Options**

    - Settings → About Phone → Tap "Build Number" 7 times
    - Settings → Developer Options → Enable

2. **Enable USB Debugging**

    - Developer Options → USB Debugging → Enable
    - Connect device and accept debugging prompt

3. **Build and Run**

    ```bash
    # List connected devices
    npx cap run android --list

    # Run on connected device
    npx cap run android --target "device_id"
    ```

## 🧪 Platform-Specific Testing Checklist

### Core Functionality

-   [ ] Game loads without errors
-   [ ] Canvas renders correctly
-   [ ] Touch/click interactions work
-   [ ] Drag and drop functions properly
-   [ ] Game state saves and restores
-   [ ] All game modes accessible
-   [ ] Victory conditions trigger correctly

### iOS-Specific Testing

-   [ ] **Safe Areas**: Content doesn't overlap with notch/home indicator
-   [ ] **Status Bar**: Correct style (light/dark) and visibility
-   [ ] **Orientations**: Portrait and landscape work correctly
-   [ ] **Gestures**: No conflicts with iOS system gestures
-   [ ] **Haptics**: Feedback works on supported devices
-   [ ] **Performance**: 60 FPS on recent devices, playable on iPhone SE
-   [ ] **Memory**: No crashes on 2GB RAM devices
-   [ ] **App Switcher**: Correct app preview image
-   [ ] **Background/Foreground**: Game pauses/resumes properly

### Android-Specific Testing

-   [ ] **Navigation**: Back button behavior correct
-   [ ] **Status Bar**: Correct color and transparency
-   [ ] **Navigation Bar**: Content doesn't overlap
-   [ ] **Orientations**: Configuration changes handled
-   [ ] **Haptics**: Vibration works where supported
-   [ ] **Performance**: Playable on mid-range devices
-   [ ] **Memory**: No crashes on 3GB RAM devices
-   [ ] **Split Screen**: App handles multi-window (if supported)
-   [ ] **Different Screen Sizes**: Phones and tablets render correctly

### Accessibility Testing

-   [ ] **iOS VoiceOver**: All elements have proper labels
-   [ ] **Android TalkBack**: Navigation works correctly
-   [ ] **Font Scaling**: UI adapts to system font size
-   [ ] **Color Contrast**: Meets WCAG guidelines
-   [ ] **Touch Targets**: Minimum 44x44pt (iOS) / 48x48dp (Android)

### Network and Data

-   [ ] **Offline Mode**: Game works without internet
-   [ ] **Data Persistence**: Progress saves correctly
-   [ ] **App Updates**: Data migrates properly
-   [ ] **Fresh Install**: No crashes on first launch

## 🤖 Automated Build Scripts

### Create Build Scripts

Create `scripts/build-ios.js`:

```javascript
#!/usr/bin/env node

import {execSync} from 'child_process';
import {platform} from 'os';

if (platform() !== 'darwin') {
	console.error('❌ iOS builds require macOS');
	process.exit(1);
}

console.log('🍎 Building Hex Zero for iOS...\n');

try {
	// Build web assets
	console.log('📦 Building web assets...');
	execSync('npm run build', {stdio: 'inherit'});

	// Sync with iOS
	console.log('\n🔄 Syncing with iOS platform...');
	execSync('npx cap sync ios', {stdio: 'inherit'});

	// Run on simulator
	console.log('\n📱 Launching on iOS Simulator...');
	execSync('npx cap run ios', {stdio: 'inherit'});
} catch (error) {
	console.error('❌ Build failed:', error.message);
	process.exit(1);
}
```

Create `scripts/build-android.js`:

```javascript
#!/usr/bin/env node

import {execSync} from 'child_process';

console.log('🤖 Building Hex Zero for Android...\n');

try {
	// Build web assets
	console.log('📦 Building web assets...');
	execSync('npm run build', {stdio: 'inherit'});

	// Sync with Android
	console.log('\n🔄 Syncing with Android platform...');
	execSync('npx cap sync android', {stdio: 'inherit'});

	// Run on emulator
	console.log('\n📱 Launching on Android Emulator...');
	execSync('npx cap run android', {stdio: 'inherit'});
} catch (error) {
	console.error('❌ Build failed:', error.message);
	process.exit(1);
}
```

Create `scripts/test-all-platforms.js`:

```javascript
#!/usr/bin/env node

import {execSync} from 'child_process';
import {platform} from 'os';

console.log('🧪 Testing Hex Zero on all platforms...\n');

async function runTests() {
	try {
		// Build web assets once
		console.log('📦 Building web assets...');
		execSync('npm run build', {stdio: 'inherit'});

		// Sync all platforms
		console.log('\n🔄 Syncing all platforms...');
		execSync('npx cap sync', {stdio: 'inherit'});

		// Test Android
		console.log('\n🤖 Testing Android...');
		console.log('Select an Android emulator from the list:');
		execSync('npx cap run android', {stdio: 'inherit'});

		// Test iOS (macOS only)
		if (platform() === 'darwin') {
			console.log('\n🍎 Testing iOS...');
			console.log('Select an iOS simulator from the list:');
			execSync('npx cap run ios', {stdio: 'inherit'});
		} else {
			console.log('\n⚠️  Skipping iOS (requires macOS)');
		}

		console.log('\n✅ All platform tests completed!');
	} catch (error) {
		console.error('❌ Testing failed:', error.message);
		process.exit(1);
	}
}

runTests();
```

### Update package.json Scripts

Add these scripts to `package.json`:

```json
{
	"scripts": {
		"build:ios": "node scripts/build-ios.js",
		"build:android": "node scripts/build-android.js",
		"test:platforms": "node scripts/test-all-platforms.js",
		"sync": "npm run build && npx cap sync",
		"sync:ios": "npm run build && npx cap sync ios",
		"sync:android": "npm run build && npx cap sync android"
	}
}
```

## 🐛 Debugging Tools

### iOS Debugging

1. **Safari Web Inspector**

    - Enable on device: Settings → Safari → Advanced → Web Inspector
    - Connect device to Mac
    - Safari → Develop → [Your Device] → [App Name]

2. **Xcode Console**

    - View native logs in Xcode debug area
    - Set breakpoints in native iOS code

3. **Simulator Tools**
    - Device → Shake for developer menu
    - Debug → Slow Animations
    - Debug → Color Blended Layers

### Android Debugging

1. **Chrome DevTools**

    - Open Chrome → chrome://inspect
    - Find your app under "Remote Target"
    - Click "Inspect" for web debugging

2. **Android Studio Logcat**

    - View all system and app logs
    - Filter by package name: `com.hexzero.game`

3. **ADB Commands**

    ```bash
    # View logs
    adb logcat | grep "com.hexzero.game"

    # Clear app data
    adb shell pm clear com.hexzero.game

    # Take screenshot
    adb shell screencap /sdcard/screenshot.png
    adb pull /sdcard/screenshot.png
    ```

## 📊 Performance Testing

### iOS Performance

1. Xcode → Product → Profile
2. Select Instruments template:
    - Time Profiler: CPU usage
    - Core Animation: FPS monitoring
    - Allocations: Memory usage

### Android Performance

1. Android Studio → View → Tool Windows → Profiler
2. Monitor:
    - CPU usage and method traces
    - Memory allocation and GC
    - Network requests
    - Energy usage

## 🔄 Continuous Testing Workflow

### Daily Development

1. Test on one iOS simulator + one Android emulator
2. Focus on current feature development
3. Run quick smoke tests on both platforms

### Pre-Commit Testing

1. Run full platform test suite
2. Test on min/max iOS versions
3. Test on min/max Android API levels
4. Verify no regression in core features

### Release Testing

1. Test on all device categories (phone/tablet)
2. Test all iOS major versions (14, 15, 16, 17)
3. Test Android API levels (23, 28, 31, 34)
4. Full accessibility testing
5. Performance profiling on low-end devices

## 📝 Test Reporting Template

```markdown
## Test Report - [Date]

**Version**: 1.0.0
**Build**: 10000
**Tester**: [Name]

### iOS Testing

-   **Devices**: iPhone 15 Pro (17.0), iPhone SE (15.0), iPad Pro (16.0)
-   **Status**: ✅ Pass / ❌ Fail
-   **Issues**: None / [List issues]

### Android Testing

-   **Devices**: Pixel 7 (API 34), Nexus 5X (API 28), Pixel Tablet (API 34)
-   **Status**: ✅ Pass / ❌ Fail
-   **Issues**: None / [List issues]

### Notes

[Any additional observations or recommendations]
```

## 🚀 Quick Reference

### Essential Commands

```bash
# Full rebuild and test
npm run test:platforms

# iOS only
npm run build:ios

# Android only
npm run build:android

# Sync after code changes
npm run sync

# Clean build
rm -rf ios/App/App/public android/app/src/main/assets/public
npm run sync
```

### Troubleshooting

-   **iOS build fails**: Check Xcode version and run `cd ios/App && pod install`
-   **Android build fails**: Sync project in Android Studio, clean and rebuild
-   **Emulator not starting**: Check virtualization enabled in BIOS
-   **Device not detected**: Check USB debugging enabled and cables

Remember: Test early, test often, test on multiple devices!
