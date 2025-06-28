# 📱 Platform-Specific Testing Checklist

Use this checklist for thorough testing of Hex Zero on iOS and Android platforms.

## 🎮 Core Game Functionality

### Game Loading and Initialization

-   [ ] App launches without crashes
-   [ ] Splash screen displays correctly
-   [ ] Game loads to main menu
-   [ ] No console errors in dev tools
-   [ ] Assets load completely (images, fonts)

### Game Mechanics

-   [ ] Piece selection works on touch
-   [ ] Drag and drop functions smoothly
-   [ ] Pieces snap to correct positions
-   [ ] Invalid moves are prevented
-   [ ] Undo/redo functions work
-   [ ] New game starts correctly
-   [ ] All difficulty levels playable

### Game State

-   [ ] Progress saves automatically
-   [ ] Game resumes after app switch
-   [ ] Settings persist between sessions
-   [ ] High scores save correctly
-   [ ] No data loss on app update

## 🍎 iOS-Specific Testing

### Device Compatibility

-   [ ] **iPhone SE (2nd gen)** - Smallest screen
-   [ ] **iPhone 15** - Standard size
-   [ ] **iPhone 15 Plus/Max** - Large screen
-   [ ] **iPad Mini** - Small tablet
-   [ ] **iPad Pro** - Large tablet

### iOS System Integration

-   [ ] **Safe Areas**
    -   [ ] No content under notch
    -   [ ] No content under home indicator
    -   [ ] Proper padding in landscape
-   [ ] **Status Bar**
    -   [ ] Correct style (light/dark)
    -   [ ] Hides during gameplay if needed
    -   [ ] Animations smooth
-   [ ] **Orientations**
    -   [ ] Portrait mode works
    -   [ ] Landscape mode works
    -   [ ] Rotation animations smooth
    -   [ ] Layout adjusts properly

### iOS Gestures and Interactions

-   [ ] **System Gestures**
    -   [ ] Swipe up (home) doesn't interfere
    -   [ ] Swipe down (control center) works
    -   [ ] Edge swipes don't conflict
-   [ ] **Touch Handling**
    -   [ ] Multi-touch works if needed
    -   [ ] Touch targets adequate size (44pt)
    -   [ ] No dead zones
-   [ ] **Haptic Feedback**
    -   [ ] Works on supported devices
    -   [ ] Appropriate intensity
    -   [ ] Can be disabled in settings

### iOS Performance

-   [ ] **Frame Rate**
    -   [ ] 60 FPS on iPhone 15
    -   [ ] 30+ FPS on iPhone SE
    -   [ ] No stuttering during drag
-   [ ] **Memory Usage**
    -   [ ] No crashes on 2GB devices
    -   [ ] No memory warnings
    -   [ ] Efficient asset loading
-   [ ] **Battery Usage**
    -   [ ] Reasonable drain rate
    -   [ ] No excessive CPU usage
    -   [ ] Proper idle behavior

## 🤖 Android-Specific Testing

### Device Categories

-   [ ] **Small Phone** - 5" screen (480x854)
-   [ ] **Medium Phone** - 6" screen (1080x1920)
-   [ ] **Large Phone** - 6.7" screen (1440x3120)
-   [ ] **Small Tablet** - 7" screen
-   [ ] **Large Tablet** - 10" screen

### Android API Levels

-   [ ] **API 23** (Android 6.0) - Minimum
-   [ ] **API 28** (Android 9.0) - Common
-   [ ] **API 31** (Android 12) - Recent
-   [ ] **API 34** (Android 14) - Latest

### Android System Integration

-   [ ] **Navigation**
    -   [ ] Back button behavior correct
    -   [ ] Home button works properly
    -   [ ] Recent apps preview correct
-   [ ] **Status/Navigation Bars**
    -   [ ] Status bar color matches theme
    -   [ ] Navigation bar doesn't overlap
    -   [ ] Immersive mode if applicable
-   [ ] **Screen Configurations**
    -   [ ] Different densities (ldpi-xxxhdpi)
    -   [ ] Orientation changes handled
    -   [ ] No layout breaking

### Android-Specific Features

-   [ ] **Hardware Variations**
    -   [ ] Works without gyroscope
    -   [ ] Works without vibration
    -   [ ] Handles missing features gracefully
-   [ ] **Split Screen** (if supported)
    -   [ ] App resizes properly
    -   [ ] Game remains playable
    -   [ ] No crashes on resize
-   [ ] **Performance**
    -   [ ] Playable on mid-range devices
    -   [ ] No ANRs (App Not Responding)
    -   [ ] Smooth on 3GB RAM devices

## ♿ Accessibility Testing

### iOS Accessibility

-   [ ] **VoiceOver**
    -   [ ] All buttons have labels
    -   [ ] Game state announced
    -   [ ] Navigation possible
    -   [ ] Hints provided where needed
-   [ ] **Display Settings**
    -   [ ] Larger text sizes supported
    -   [ ] Bold text works
    -   [ ] Increased contrast mode
    -   [ ] Reduce motion respected

### Android Accessibility

-   [ ] **TalkBack**
    -   [ ] Elements properly labeled
    -   [ ] Focus order logical
    -   [ ] Actions announced
    -   [ ] Gestures work
-   [ ] **Display Settings**
    -   [ ] Font scaling handled
    -   [ ] High contrast mode
    -   [ ] Color correction modes
    -   [ ] Magnification gestures

## 🌐 Network and Data

### Offline Functionality

-   [ ] Game works without internet
-   [ ] No crashes when offline
-   [ ] Features degrade gracefully
-   [ ] Clear offline indicators

### Data Management

-   [ ] **Storage Usage**
    -   [ ] Reasonable app size
    -   [ ] Cache cleaned properly
    -   [ ] No excessive growth
-   [ ] **Updates**
    -   [ ] Data migrates correctly
    -   [ ] No progress loss
    -   [ ] Settings preserved

## 🐛 Edge Cases and Error Handling

### Interruption Handling

-   [ ] **Phone Calls**
    -   [ ] Game pauses
    -   [ ] Resumes correctly
    -   [ ] No state loss
-   [ ] **Notifications**
    -   [ ] Game continues properly
    -   [ ] No UI glitches
    -   [ ] Touch handling resumes

### Resource Constraints

-   [ ] **Low Memory**
    -   [ ] Graceful degradation
    -   [ ] No sudden crashes
    -   [ ] Recovery possible
-   [ ] **Low Battery**
    -   [ ] No increased drain
    -   [ ] Power save mode compatible

### Error Scenarios

-   [ ] **Permission Denials**
    -   [ ] App handles gracefully
    -   [ ] Clear error messages
    -   [ ] Alternative flows work
-   [ ] **System Updates**
    -   [ ] App survives OS updates
    -   [ ] No compatibility breaks

## 📊 Performance Metrics

### Target Performance

-   [ ] **Load Time**: < 3 seconds
-   [ ] **Frame Rate**: 60 FPS (30 minimum)
-   [ ] **Memory Usage**: < 200MB
-   [ ] **Battery Drain**: < 5% per hour
-   [ ] **App Size**: < 50MB

### Performance Testing Tools

-   [ ] iOS: Instruments profiling
-   [ ] Android: Android Studio Profiler
-   [ ] Web: Chrome DevTools
-   [ ] Frame rate monitoring
-   [ ] Memory leak detection

## 🚀 Release Readiness

### Final Checks

-   [ ] **No Debug Code**
    -   [ ] Console logs removed
    -   [ ] Debug UI hidden
    -   [ ] Test data cleared
-   [ ] **Production Config**
    -   [ ] API endpoints correct
    -   [ ] Analytics enabled
    -   [ ] Crash reporting active
-   [ ] **Store Compliance**
    -   [ ] Age rating appropriate
    -   [ ] Permissions justified
    -   [ ] Content guidelines met

### Sign-off Criteria

-   [ ] All critical bugs fixed
-   [ ] Performance acceptable
-   [ ] No crashes in 1 hour play
-   [ ] Accessibility standards met
-   [ ] Platform guidelines followed

## 📝 Test Report Template

```
Date: ____________________
Version: _________________
Tester: __________________

iOS Results: ⬜ Pass ⬜ Fail
Android Results: ⬜ Pass ⬜ Fail

Critical Issues:
1. _____________________
2. _____________________

Notes:
_______________________
_______________________

Recommendation: ⬜ Ship ⬜ Fix and Retest
```

Remember: Quality is everyone's responsibility. Test thoroughly!
