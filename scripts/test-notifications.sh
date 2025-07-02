#!/bin/bash

# Test script for notification functionality

echo "🔔 Testing Hex Zero Notifications"
echo "================================="

# Function to test iOS
test_ios() {
    echo "📱 Testing iOS Notifications..."

    # Build and sync
    echo "Building web assets..."
    npm run build

    echo "Syncing to iOS..."
    npx cap sync ios

    echo "Opening in Xcode..."
    npx cap open ios

    echo ""
    echo "iOS Testing Steps:"
    echo "1. Run on a physical device (notifications don't work in simulator)"
    echo "2. Open hamburger menu → Notifications"
    echo "3. Enable daily reminder for 1 minute from now"
    echo "4. Grant permission when prompted"
    echo "5. Close the app and wait for notification"
    echo "6. Tap notification to verify deep linking"
}

# Function to test Android
test_android() {
    echo "🤖 Testing Android Notifications..."

    # Build and sync
    echo "Building web assets..."
    npm run build

    echo "Syncing to Android..."
    npx cap sync android

    echo "Opening in Android Studio..."
    npx cap open android

    echo ""
    echo "Android Testing Steps:"
    echo "1. Run on emulator or device"
    echo "2. Open hamburger menu → Notifications"
    echo "3. Enable daily reminder for 1 minute from now"
    echo "4. On Android 13+, grant permission when prompted"
    echo "5. Close the app and wait for notification"
    echo "6. Tap notification to verify it opens the app"
}

# Function to check notification status
check_status() {
    echo "📊 Checking notification configuration..."

    cat << 'EOF' > check-notifications.js
import { LocalNotifications } from '@capacitor/local-notifications';

async function checkNotifications() {
    try {
        const permission = await LocalNotifications.checkPermissions();
        console.log('Permission status:', permission.display);

        const pending = await LocalNotifications.getPending();
        console.log('Scheduled notifications:', pending.notifications.length);

        pending.notifications.forEach((notif, index) => {
            console.log(`\nNotification ${index + 1}:`);
            console.log('  ID:', notif.id);
            console.log('  Title:', notif.title);
            console.log('  Body:', notif.body);
            if (notif.schedule) {
                console.log('  Schedule:', notif.schedule);
            }
        });
    } catch (error) {
        console.error('Error checking notifications:', error);
    }
}

checkNotifications();
EOF

    echo "Run this in the browser console to check notification status"
}

# Main menu
echo "Select test option:"
echo "1) Test iOS"
echo "2) Test Android"
echo "3) Check notification status"
echo "4) Test both platforms"

read -p "Enter choice (1-4): " choice

case $choice in
    1)
        test_ios
        ;;
    2)
        test_android
        ;;
    3)
        check_status
        ;;
    4)
        test_ios
        echo ""
        echo "================================="
        echo ""
        test_android
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Test script completed!"
