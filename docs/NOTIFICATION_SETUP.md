# 🔔 Notification Setup Documentation

This document explains how to configure and test local notifications for both iOS and Android platforms.

## 📱 Features

The notification system provides:

-   **Daily Reminders**: Customizable time to remind users to play
-   **Inactivity Reminders**: Notify users who haven't played in X days
-   **Achievement Notifications**: Special notifications for accomplishments

## 🍎 iOS Setup

### 1. Notification Permission

The app will automatically request notification permission when the user first opens the notification settings. No additional Info.plist entries are required for local notifications.

### 2. Testing iOS Notifications

1. Build and run the app on a physical device (notifications don't work in simulator)
2. Open the hamburger menu and tap "🔔 Notifications"
3. Enable desired notification types
4. Grant permission when prompted
5. Notifications will be scheduled based on your settings

## 🤖 Android Setup

### 1. Notification Permission

For Android 13+ (API 33+), the app needs to request notification permission at runtime. This is handled automatically by the Capacitor plugin.

### 2. Notification Channel

The plugin automatically creates a default notification channel for the app.

### 3. Testing Android Notifications

1. Build and run the app on emulator or device
2. Open the hamburger menu and tap "🔔 Notifications"
3. Enable desired notification types
4. On Android 13+, grant permission when prompted
5. Notifications will be scheduled based on your settings

## 🧪 Testing Notifications

### Quick Test Method

To test notifications quickly without waiting:

1. Enable daily reminder for 1 minute in the future
2. Close the app
3. Wait for the notification
4. Tap the notification to open the app

### Debug Commands

You can test notifications programmatically in the browser console:

```javascript
// Show test notification (1 second delay)
NotificationManager.getInstance().showVictoryNotification('Test notification!');

// Check scheduled notifications
const pending = await LocalNotifications.getPending();
console.log('Scheduled:', pending);
```

## 📋 Implementation Details

### NotificationManager

Located at `src/notifications/NotificationManager.ts`, handles:

-   Permission requests
-   Scheduling daily and inactivity reminders
-   Managing notification state
-   Deep link handling

### NotificationSettings

Located at `src/notifications/NotificationSettings.ts`, provides:

-   User interface for notification preferences
-   Settings persistence
-   Real-time updates to notification schedule

### Configuration Options

```typescript
interface NotificationConfig {
	dailyReminderEnabled: boolean;
	dailyReminderTime: string; // HH:MM format
	streakReminderEnabled: boolean;
	inactivityDays: number; // Days before inactivity reminder
}
```

## 🐛 Troubleshooting

### iOS Issues

-   **Notifications not appearing**: Ensure app has permission in Settings > Notifications
-   **Scheduled notifications not firing**: Check device Do Not Disturb settings
-   **Permission denied**: User must manually enable in iOS Settings

### Android Issues

-   **No notification permission prompt**: Only appears on Android 13+
-   **Notifications not showing**: Check app notification settings
-   **Silent notifications**: Ensure device is not in Do Not Disturb mode

## 🔧 Customization

To add new notification types:

1. Update `NotificationManager.ts` with new scheduling logic
2. Add UI controls in `NotificationSettings.ts`
3. Update the `NotificationConfig` interface
4. Test on both platforms

## 📝 Notes

-   Local notifications work offline
-   Notifications are cleared when app opens
-   Settings are persisted in localStorage
-   Deep linking support allows opening specific game modes from notifications
