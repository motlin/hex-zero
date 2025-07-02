#!/bin/bash

# Script to build and test widgets on both platforms

echo "🔧 Building web assets..."
npm run build

echo "📱 Syncing to native platforms..."
npx cap sync

echo ""
echo "✅ Build complete!"
echo ""
echo "📱 iOS Widget Testing:"
echo "1. Open ios/App/App.xcworkspace in Xcode"
echo "2. Select 'HexZeroWidget' scheme"
echo "3. Build and run on simulator"
echo "4. Add widget from home screen"
echo ""
echo "🤖 Android Widget Testing:"
echo "1. Open android/ in Android Studio"
echo "2. Build and run on emulator"
echo "3. Long press home screen → Widgets"
echo "4. Find and add Hex Zero widget"
echo ""
echo "📊 Widget Features:"
echo "- Games played counter"
echo "- Win rate percentage"
echo "- Current win streak"
echo "- Multiple widget sizes (iOS)"
echo ""
echo "🧪 Test by playing games and checking widget updates!"
