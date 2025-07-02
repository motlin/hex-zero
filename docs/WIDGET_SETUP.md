# 📱 Widget Setup Documentation

This document explains how to configure and test widgets for both iOS and Android platforms.

## 🍎 iOS Widget Setup

### 1. Configure App Groups

To share data between the main app and widget, you need to configure App Groups:

1. Open the project in Xcode
2. Select the main app target
3. Go to "Signing & Capabilities" tab
4. Click "+" and add "App Groups" capability
5. Add a new app group: `group.com.hexzero.game`
6. Select the widget target and repeat steps 3-5

### 2. Add Widget Extension Target

1. In Xcode, File → New → Target
2. Select "Widget Extension"
3. Name it "HexZeroWidget"
4. Make sure "Include Configuration Intent" is unchecked
5. Click "Finish"

### 3. Configure Widget Files

The widget files have already been created:

-   `ios/HexZeroWidget/HexZeroWidget.swift` - Main widget code
-   `ios/HexZeroWidget/Info.plist` - Widget configuration

### 4. Build and Test

1. Select the widget scheme in Xcode
2. Build and run on simulator or device
3. Add widget from home screen widget gallery

## 🤖 Android Widget Setup

### 1. Widget Files Already Created

The following files have been created for Android widgets:

-   `HexZeroWidgetProvider.java` - Widget provider implementation
-   `res/layout/hex_zero_widget.xml` - Widget layout
-   `res/xml/hex_zero_widget_info.xml` - Widget configuration
-   `res/drawable/widget_*.xml` - Widget styling resources

### 2. Widget Registration

The widget is already registered in `AndroidManifest.xml`:

```xml
<receiver android:name=".HexZeroWidgetProvider"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/hex_zero_widget_info" />
</receiver>
```

### 3. Testing Android Widget

1. Build and install the app on emulator/device
2. Long press on home screen
3. Select "Widgets"
4. Find "Hex Zero" widget
5. Drag to home screen

## 🔄 Widget Data Updates

The widgets display:

-   Total games played
-   Games won
-   Win rate percentage
-   Current winning streak
-   Last played time (iOS large widget only)

Data is updated:

-   When a game starts (games played counter)
-   When a game is won (games won, win rate, streak)
-   On app launch (syncs all data)

## 🧪 Testing Widget Updates

### iOS Testing

1. Play a game in the app
2. Check that widget updates within a few seconds
3. Force refresh by removing and re-adding widget

### Android Testing

1. Play a game in the app
2. Widget should update immediately
3. If not, the widget updates every hour automatically

## 🐛 Troubleshooting

### iOS Issues

-   **Widget not showing data**: Check App Groups configuration
-   **Widget not updating**: Ensure WidgetKit is properly imported
-   **Build errors**: Clean build folder and rebuild

### Android Issues

-   **Widget not appearing**: Check AndroidManifest.xml registration
-   **Data not updating**: Verify SharedPreferences are being written
-   **Layout issues**: Test on different screen densities

## 📝 Implementation Notes

-   iOS widgets use SwiftUI and WidgetKit (iOS 14+)
-   Android widgets use RemoteViews and AppWidgetProvider
-   Data sharing uses UserDefaults (iOS) and SharedPreferences (Android)
-   Native plugin handles communication between web app and native code
