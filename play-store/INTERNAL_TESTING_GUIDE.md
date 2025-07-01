# 🧪 Google Play Internal Testing Guide

This guide covers setting up and managing internal testing for Hex Zero on Google Play Console.

## Prerequisites

-   [ ] Google Play Developer account ($25 one-time fee)
-   [ ] Signed release build (AAB format)
-   [ ] List of tester email addresses
-   [ ] Privacy policy URL

## Step 1: Create Your App in Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Click "Create app"
3. Fill in:
    - App name: **Hex Zero: Puzzle Strategy**
    - Default language: **English (United States)**
    - App or game: **Game**
    - Free or paid: **Free**
    - Accept declarations

## Step 2: Set Up Internal Testing

### Create Internal Testing Release

1. Navigate to **Testing > Internal testing**
2. Click **Create new release**
3. Upload your AAB file
4. Fill in release notes:
    ```
    Initial internal testing release of Hex Zero
    - Core puzzle gameplay
    - Touch controls optimized for mobile
    - Multiple difficulty levels
    - Clean, responsive UI
    ```

### Configure Testers

1. Click **Testers** tab
2. Create a new email list or select existing
3. Add tester emails (up to 100 for internal testing)
4. Name the list: "Hex Zero Internal Testers"

### Enable Testing

1. Review and confirm release
2. Copy the opt-in link provided
3. Share link with testers

## Step 3: Tester Instructions

Send this to your internal testers:

```
Subject: Hex Zero - Internal Testing Invitation

You're invited to test Hex Zero on Android!

1. Join the test program: [INSERT OPT-IN LINK]
2. Accept the invitation
3. Download from Google Play (may take 1-2 hours to appear)
4. Play the game and provide feedback

What to test:
- Game loads and runs smoothly
- Touch controls work properly
- UI displays correctly on your device
- No crashes or freezes
- Performance feels responsive

Please report any issues with:
- Device model and Android version
- Steps to reproduce the problem
- Screenshots if possible

Thank you for testing!
```

## Step 4: Testing Checklist

### Functionality Testing

-   [ ] App installs successfully
-   [ ] Game launches without crashes
-   [ ] All game modes work
-   [ ] Touch controls responsive
-   [ ] UI elements properly sized
-   [ ] Orientation changes handled
-   [ ] Back button behavior correct

### Performance Testing

-   [ ] Smooth animations (60fps target)
-   [ ] Quick load times
-   [ ] No memory leaks
-   [ ] Battery usage reasonable
-   [ ] Works offline

### Device Coverage

-   [ ] Test on various screen sizes
-   [ ] Test on different Android versions (5.0+)
-   [ ] Test on low-end devices
-   [ ] Test on tablets

## Step 5: Monitoring Results

### Pre-launch Report

Google automatically tests your app. Review:

-   Crashes and ANRs
-   Performance metrics
-   Accessibility issues
-   Security warnings
-   Screenshot previews

### Crash Reporting

1. Go to **Quality > Android vitals > Crashes & ANRs**
2. Monitor crash-free rates
3. Target: >99.5% crash-free

### User Feedback

1. Check **Testing > Internal testing > Feedback**
2. Respond to tester comments
3. Track common issues

## Step 6: Iterating Based on Feedback

### Update Process

1. Fix reported issues
2. Increment version code in `capacitor.config.ts`
3. Build new AAB: `npm run build:android`
4. Upload to same internal track
5. Testers get automatic updates

### Version Management

```javascript
// capacitor.config.ts
android: {
  versionCode: 2, // Increment for each upload
  versionName: "1.0.1" // User-visible version
}
```

## Step 7: Progression Path

### Testing Stages

1. **Internal Testing** (current)

    - 100 testers max
    - Instant releases
    - Best for early testing

2. **Closed Testing** (next)

    - Larger group
    - More formal feedback
    - Country restrictions available

3. **Open Testing** (optional)

    - Public opt-in
    - Unlimited testers
    - Near-final validation

4. **Production**
    - Full release
    - Staged rollout available
    - Monitor closely

## Common Issues & Solutions

### "App not available" after joining test

-   Wait 1-2 hours for propagation
-   Clear Play Store cache
-   Ensure tester accepted invitation

### Crashes on specific devices

-   Check minimum SDK version
-   Test on emulator with same specs
-   Add device-specific handling if needed

### Performance issues

-   Profile using Android Studio
-   Optimize canvas rendering
-   Reduce memory usage

## Best Practices

1. **Test Early, Test Often**

    - Don't wait for perfection
    - Get feedback quickly
    - Iterate based on data

2. **Communicate Clearly**

    - Set expectations with testers
    - Provide clear test scenarios
    - Respond to feedback promptly

3. **Track Everything**

    - Document all issues
    - Monitor crash rates
    - Track performance metrics

4. **Gradual Rollout**
    - Start with trusted testers
    - Expand gradually
    - Always have rollback plan

## Release Checklist Template

Before each internal release:

-   [ ] Version code incremented
-   [ ] Release notes written
-   [ ] AAB built and signed
-   [ ] Basic smoke test passed
-   [ ] Previous feedback addressed
-   [ ] Testers notified of changes

## Support Resources

-   [Play Console Help](https://support.google.com/googleplay/android-developer)
-   [Android Testing Guide](https://developer.android.com/distribute/best-practices/launch/test)
-   [Firebase Test Lab](https://firebase.google.com/products/test-lab) (for automated testing)

---

Remember: Internal testing is your safety net. Use it liberally before moving to broader releases!
