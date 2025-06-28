# 🤖 Android Signing Configuration

This file documents the current Android signing configuration for the Hex Zero app.

## Current Configuration

**Package Name**: `com.hexzero.game`
**Target SDK**: 35 (Android 15)
**Minimum SDK**: 23 (Android 6.0)
**Build Tools**: Gradle 8.7.2
**Compile SDK**: 35

## Keystore Information

### Release Keystore

-   **Filename**: `hex-zero-release.keystore`
-   **Location**: `android/app/hex-zero-release.keystore`
-   **Alias**: `hex-zero-key`
-   **Type**: PKCS12
-   **Key Algorithm**: RSA
-   **Key Size**: 2048 bits
-   **Validity**: 25 years (9125 days)
-   **Usage**: Google Play Store distribution, production builds

### Debug Keystore

-   **Filename**: `debug.keystore` (Android default)
-   **Alias**: `androiddebugkey`
-   **Password**: `android` (standard debug password)
-   **Usage**: Development builds, testing

## Gradle Configuration

### gradle.properties

```properties
# Signing Configuration
MYAPP_UPLOAD_STORE_FILE=hex-zero-release.keystore
MYAPP_UPLOAD_KEY_ALIAS=hex-zero-key
MYAPP_UPLOAD_STORE_PASSWORD=*** (stored securely)
MYAPP_UPLOAD_KEY_PASSWORD=*** (stored securely)
```

### build.gradle Signing Configs

```gradle
signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
    release {
        if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
            storeFile file(MYAPP_UPLOAD_STORE_FILE)
            storePassword MYAPP_UPLOAD_STORE_PASSWORD
            keyAlias MYAPP_UPLOAD_KEY_ALIAS
            keyPassword MYAPP_UPLOAD_KEY_PASSWORD
        }
    }
}
```

## Build Types

### Debug Configuration

```gradle
debug {
    signingConfig signingConfigs.debug
    applicationIdSuffix ".debug"
    debuggable true
    minifyEnabled false
}
```

### Release Configuration

```gradle
release {
    signingConfig signingConfigs.release
    minifyEnabled false
    proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    debuggable false
}
```

## Build Commands

### Debug Build

```bash
# APK for testing
./gradlew assembleDebug

# Install on connected device/emulator
./gradlew installDebug
```

### Release Build

```bash
# Signed APK for distribution
./gradlew assembleRelease

# Signed AAB for Play Store (recommended)
./gradlew bundleRelease
```

## Output Locations

### APK Files

-   **Debug**: `android/app/build/outputs/apk/debug/app-debug.apk`
-   **Release**: `android/app/build/outputs/apk/release/app-release.apk`

### AAB Files (App Bundle)

-   **Release**: `android/app/build/outputs/bundle/release/app-release.aab`

## Setup Status

-   [ ] Release keystore generated
-   [ ] Keystore securely backed up
-   [ ] Gradle properties configured
-   [ ] Build.gradle signing configs added
-   [ ] Environment variables set up (recommended)
-   [ ] Debug build tested
-   [ ] Release build tested
-   [ ] AAB generation tested
-   [ ] Google Play Console account created
-   [ ] App listing created in Play Console

## Security Checklist

### Keystore Security

-   [ ] Strong passwords used (12+ characters)
-   [ ] Passwords stored in password manager
-   [ ] Keystore file backed up securely
-   [ ] Keystore excluded from version control
-   [ ] Environment variables used for passwords (production)

### Version Control Security

-   [ ] `*.keystore` in .gitignore
-   [ ] `gradle.properties` with passwords excluded
-   [ ] No hardcoded passwords in source code
-   [ ] Secure CI/CD environment variable configuration

## Google Play Console

### App Information

-   **App Name**: Hex Zero
-   **Package Name**: com.hexzero.game
-   **Category**: Puzzle Game
-   **Content Rating**: Everyone
-   **Target Audience**: 13+
-   **Distribution**: Free

### Required Documents

-   [ ] Privacy Policy created and hosted
-   [ ] Data Safety form completed
-   [ ] Content rating questionnaire completed
-   [ ] App descriptions and metadata prepared
-   [ ] Screenshots prepared for different device sizes
-   [ ] Feature graphic created

## Version Management

### Version Naming Convention

-   **Version Name**: Semantic versioning (1.0.0, 1.0.1, etc.)
-   **Version Code**: Integer increment (10000, 10001, etc.)

### Current Versions

-   **Version Name**: 1.0.0
-   **Version Code**: 10000

### Version Update Process

1. Update `versionName` in `android/app/build.gradle`
2. Increment `versionCode` in `android/app/build.gradle`
3. Build release AAB
4. Upload to Play Console
5. Update release notes

## Troubleshooting

### Common Issues

#### Keystore Not Found

```
Error: Keystore file 'hex-zero-release.keystore' not found
```

**Solution**: Verify keystore path and generate if missing:

```bash
node scripts/generate-android-keystore.js
```

#### Signing Configuration Error

```
Error: Could not read key hex-zero-key from store
```

**Solution**: Check alias name and passwords in gradle.properties

#### Build Failures

```
Error: Failed to sign APK
```

**Solution**:

1. Clean build: `./gradlew clean`
2. Verify signing configuration
3. Check Java version compatibility

### Verification Commands

```bash
# List keystore contents
keytool -list -v -keystore android/app/hex-zero-release.keystore

# Verify APK signature
jarsigner -verify -verbose -certs android/app/build/outputs/apk/release/app-release.apk

# Check AAB contents
bundletool build-apks --bundle=android/app/build/outputs/bundle/release/app-release.aab --output=test.apks
```

## Support Resources

-   [Android App Signing Documentation](https://developer.android.com/studio/publish/app-signing)
-   [Google Play Console Help](https://support.google.com/googleplay/android-developer)
-   [Capacitor Android Guide](https://capacitorjs.com/docs/android)
-   [Complete setup guide](docs/ANDROID_DEVELOPMENT_SETUP.md)

## Notes

-   Automatic signing is NOT used for release builds to maintain control
-   Manual signing ensures consistent keystore usage across builds
-   AAB (App Bundle) is recommended over APK for Play Store distribution
-   Keystore must be renewed before expiration (25 years from creation)
-   All team members need access to keystore and passwords for releases

## Security Reminders

🔒 **Critical**: Never lose your keystore! Without it, you cannot update your app in the Play Store.

🔒 **Backup**: Create encrypted backups of both keystore and passwords.

🔒 **Version Control**: Never commit keystores or passwords to git.

🔒 **Sharing**: Use secure methods to share keystores with team members (encrypted files, secure password managers).
