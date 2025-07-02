# 🎙️ Voice Assistant Integration

This document explains how to use voice commands to start Hex Zero games with Siri (iOS) and Google Assistant (Android).

## 🎯 Overview

Voice assistant integration allows users to start games using voice commands:

-   "Hey Siri, play easy Hex Zero"
-   "Ok Google, start a hard Hex Zero game"

## 🍎 iOS - Siri Shortcuts

### Supported Commands

Each difficulty level has its own Siri shortcut:

-   **Easy**: "Play easy Hex Zero" (3x3 grid, 5 pieces)
-   **Medium**: "Play medium Hex Zero" (3x3 grid, 7 pieces)
-   **Hard**: "Play hard Hex Zero" (4x4 grid, 9 pieces)
-   **Extreme**: "Play extreme Hex Zero" (5x5 grid, 11 pieces)
-   **Impossible**: "Play impossible Hex Zero" (5x5 grid, 13 pieces)

### How to Set Up Siri Shortcuts

1. **Automatic Setup**: Play a game at each difficulty level to automatically donate shortcuts to Siri
2. **Manual Setup**:
    - Open Settings → Siri & Search
    - Find "Hex Zero" in the app list
    - Add shortcuts for each difficulty level
    - Record custom phrases if desired

### Technical Implementation

-   Uses `NSUserActivity` for shortcut donation
-   Shortcuts are donated when:
    -   The app launches
    -   A game is completed at a specific difficulty
-   Custom URL scheme: `hexzero://play?difficulty=<level>`

## 🤖 Android - App Actions & Google Assistant

### Supported Commands

Google Assistant recognizes these commands:

-   "Start Hex Zero"
-   "Play Hex Zero easy mode"
-   "Start a hard Hex Zero game"

### How to Use

1. **Long press home button** to activate Google Assistant
2. Say your command (e.g., "Play Hex Zero medium difficulty")
3. The app will launch directly into the requested game

### App Shortcuts (Android 7.1+)

Long press the app icon to see quick shortcuts:

-   Easy Game
-   Medium Game
-   Hard Game
-   Extreme Game
-   Impossible Game

### Technical Implementation

-   Uses Android App Shortcuts (`shortcuts.xml`)
-   Deep linking with custom URL scheme
-   Intent filters for `android.intent.action.VIEW`
-   Compatible with Google Assistant's App Actions

## 🔗 Deep Linking

Both platforms support URL-based launching:

### URL Schemes

-   `hexzero://play?difficulty=easy`
-   `hexzero://play?difficulty=medium`
-   `hexzero://play?difficulty=hard`
-   `hexzero://play?difficulty=extreme`
-   `hexzero://play?difficulty=impossible`

### Universal Links (Future)

-   `https://hexzero.app/play?difficulty=<level>`

## 🧪 Testing Voice Commands

### iOS Testing

1. **Simulator**: Limited voice support; test URL scheme manually
2. **Device**: Full Siri integration available
3. **Test commands**:
    ```
    Hey Siri, play easy Hex Zero
    Hey Siri, start impossible Hex Zero game
    ```

### Android Testing

1. **Emulator**: Full Google Assistant support
2. **Test via ADB**:
    ```bash
    adb shell am start -W -a android.intent.action.VIEW -d "hexzero://play?difficulty=hard"
    ```
3. **Voice commands**:
    ```
    Ok Google, play Hex Zero
    Ok Google, start hard Hex Zero game
    ```

## 🐛 Troubleshooting

### iOS Issues

-   **Shortcuts not appearing**: Ensure app has been launched at least once
-   **Siri not recognizing**: Check Settings → Siri & Search → App Support
-   **Shortcuts not working**: Verify URL scheme is properly registered

### Android Issues

-   **App not launching**: Check intent filters in AndroidManifest.xml
-   **Shortcuts not visible**: Requires Android 7.1+ (API 25+)
-   **Google Assistant not finding app**: May take time for indexing

## 📝 Implementation Notes

### Security

-   No sensitive data is passed through voice commands
-   Only game difficulty parameter is transmitted
-   No user data is shared with voice assistants

### Privacy

-   Voice commands are processed by the OS
-   App doesn't access voice recordings
-   Shortcuts can be deleted by users at any time

### Localization (Future)

-   Currently English only
-   Voice commands will need localization for other languages
-   Shortcut phrases should match app's localized strings
