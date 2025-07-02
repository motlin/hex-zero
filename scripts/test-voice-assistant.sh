#!/bin/bash

# Script to test voice assistant integration

echo "🎙️ Testing Voice Assistant Integration"
echo ""

# Function to test deep links
test_deep_link() {
    local platform=$1
    local difficulty=$2
    local url="hexzero://play?difficulty=$difficulty"

    echo "Testing $difficulty difficulty on $platform..."

    if [ "$platform" = "ios" ]; then
        echo "📱 iOS: xcrun simctl openurl booted '$url'"
        echo "   (Run this command while iOS Simulator is running)"
    elif [ "$platform" = "android" ]; then
        echo "🤖 Android: adb shell am start -W -a android.intent.action.VIEW -d '$url'"
    fi
    echo ""
}

echo "📋 Prerequisites:"
echo "- Build and install the app on target platform"
echo "- For iOS: Simulator must be running"
echo "- For Android: Device/emulator must be connected"
echo ""

echo "🔗 Deep Link Tests:"
echo "=================="

# Test all difficulty levels
for difficulty in easy medium hard extreme impossible; do
    echo "--- $difficulty difficulty ---"
    test_deep_link "ios" "$difficulty"
    test_deep_link "android" "$difficulty"
done

echo "🍎 iOS Siri Shortcut Tests:"
echo "=========================="
echo "1. Launch the app normally first"
echo "2. In Simulator: Can't test Siri directly"
echo "3. On Device: Hold power button and say:"
echo "   - 'Hey Siri, play easy Hex Zero'"
echo "   - 'Hey Siri, start hard Hex Zero game'"
echo ""

echo "🤖 Android Google Assistant Tests:"
echo "================================="
echo "1. Long press home button to activate Assistant"
echo "2. Say one of these commands:"
echo "   - 'Play Hex Zero'"
echo "   - 'Start Hex Zero easy mode'"
echo "   - 'Open Hex Zero hard game'"
echo ""

echo "📱 Android App Shortcuts Test:"
echo "============================="
echo "1. Long press the Hex Zero app icon"
echo "2. You should see shortcuts for each difficulty"
echo "3. Tap a shortcut to start that game mode"
echo ""

echo "✅ Manual Verification Checklist:"
echo "================================"
echo "[ ] iOS: URL scheme launches app correctly"
echo "[ ] iOS: Siri shortcuts appear in Settings"
echo "[ ] iOS: Voice commands work on device"
echo "[ ] Android: URL scheme launches app correctly"
echo "[ ] Android: App shortcuts appear on long press"
echo "[ ] Android: Google Assistant recognizes commands"
echo "[ ] Both: Correct difficulty game starts"
echo "[ ] Both: Game screen shows immediately"
echo ""

echo "🐛 Debugging Tips:"
echo "================="
echo "- iOS: Check Console.app for Siri-related logs"
echo "- Android: Use 'adb logcat | grep -i intent' to debug"
echo "- Check browser console for JavaScript errors"
echo "- Verify URL scheme registration in platform configs"
