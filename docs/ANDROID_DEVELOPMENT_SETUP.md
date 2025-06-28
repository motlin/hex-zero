# 🤖 Android Development Setup for Hex Zero

Complete guide for setting up Android development, keystore generation, and Google Play Store preparation.

## 🛠️ Prerequisites

### Required Software

1. **Java Development Kit (JDK)**

    - Install JDK 8 or newer (JDK 11+ recommended)
    - Verify installation: `java -version` and `javac -version`
    - Ensure `JAVA_HOME` environment variable is set

2. **Android Studio**

    - Download from [developer.android.com/studio](https://developer.android.com/studio)
    - Install Android SDK (API 23+ for Hex Zero)
    - Install Android SDK Build Tools
    - Install Android Emulator (for testing)

3. **Android SDK Command Line Tools**
    - Install via Android Studio SDK Manager
    - Add SDK tools to system PATH
    - Verify: `adb --version` and `keytool -help`

### Environment Setup

```bash
# Add to your shell profile (.bashrc, .zshrc, etc.)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

## 🔐 Android Keystore Generation

### Overview

Android apps must be signed with a digital certificate (keystore) for distribution through Google Play Store. The keystore contains your private key and is essential for app updates.

⚠️ **Critical**: Losing your keystore means you cannot update your app. Create secure backups!

### Automated Keystore Generation

Use the provided script for guided keystore creation:

```bash
# Generate release keystore
node scripts/generate-android-keystore.js
```

The script will:

-   Generate a 2048-bit RSA keystore valid for 25 years
-   Prompt for required certificate information
-   Create `android/app/hex-zero-release.keystore`
-   Provide verification and next steps

### Manual Keystore Generation

If you prefer manual generation:

```bash
# Navigate to android/app directory
cd android/app

# Generate keystore (replace with your information)
keytool -genkeypair -v \
  -keystore hex-zero-release.keystore \
  -alias hex-zero-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 9125 \
  -storetype PKCS12
```

You'll be prompted for:

-   **Keystore password**: Strong password (12+ characters)
-   **Key password**: Can be same as keystore password
-   **Name**: Your full name
-   **Organization unit**: Development team name (optional)
-   **Organization**: Company/project name
-   **City**: Your city
-   **State**: Your state/province
-   **Country code**: Two-letter country code (US, GB, CA, etc.)

### Keystore Information to Provide

```
What is your first and last name?
  [Unknown]:  John Doe

What is the name of your organizational unit?
  [Unknown]:  Development Team

What is the name of your organization?
  [Unknown]:  Hex Zero Games

What is the name of your City or Locality?
  [Unknown]:  San Francisco

What is the name of your State or Province?
  [Unknown]:  California

What is the two-letter country code for this unit?
  [Unknown]:  US

Is CN=John Doe, OU=Development Team, O=Hex Zero Games, L=San Francisco, ST=California, C=US correct?
  [no]:  yes
```

## ⚙️ Gradle Build Configuration

### 1. Update gradle.properties

Add signing configuration to `android/gradle.properties`:

```properties
# Signing Configuration
MYAPP_UPLOAD_STORE_FILE=hex-zero-release.keystore
MYAPP_UPLOAD_KEY_ALIAS=hex-zero-key
MYAPP_UPLOAD_STORE_PASSWORD=your_keystore_password
MYAPP_UPLOAD_KEY_PASSWORD=your_key_password
```

⚠️ **Security Note**: Never commit passwords to version control. Use environment variables or CI/CD secrets for production.

### 2. Update app/build.gradle

Add signing configuration to `android/app/build.gradle`:

```gradle
android {
    // ... existing configuration

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

    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 3. Environment Variables (Recommended)

For better security, use environment variables:

```bash
# Add to your shell profile
export MYAPP_UPLOAD_STORE_PASSWORD="your_keystore_password"
export MYAPP_UPLOAD_KEY_PASSWORD="your_key_password"
```

Update `gradle.properties`:

```properties
MYAPP_UPLOAD_STORE_FILE=hex-zero-release.keystore
MYAPP_UPLOAD_KEY_ALIAS=hex-zero-key
MYAPP_UPLOAD_STORE_PASSWORD=${MYAPP_UPLOAD_STORE_PASSWORD}
MYAPP_UPLOAD_KEY_PASSWORD=${MYAPP_UPLOAD_KEY_PASSWORD}
```

## 🏗️ Build Commands

### Development Build

```bash
# Build and sync to Android
npm run build
npx cap sync android

# Open in Android Studio
npx cap open android

# Or build from command line
cd android
./gradlew assembleDebug
```

### Release Build

```bash
# Build web assets
npm run build

# Sync to Android
npx cap sync android

# Build signed APK
cd android
./gradlew assembleRelease

# Build signed AAB (App Bundle - recommended for Play Store)
./gradlew bundleRelease
```

### Build Outputs

-   **Debug APK**: `android/app/build/outputs/apk/debug/app-debug.apk`
-   **Release APK**: `android/app/build/outputs/apk/release/app-release.apk`
-   **Release AAB**: `android/app/build/outputs/bundle/release/app-release.aab`

## 🏪 Google Play Console Setup

### 1. Create Developer Account

1. Visit [Google Play Console](https://play.google.com/console)
2. Sign in with Google account
3. Pay one-time $25 registration fee
4. Complete developer profile and verification

### 2. Create App Listing

1. **Create new app** in Play Console
2. **App details**:

    - App name: "Hex Zero"
    - Default language: English (United States)
    - App or game: Game
    - Free or paid: Free

3. **App category**:
    - Category: Puzzle
    - Content rating: Everyone
    - Target audience: 13+

### 3. App Content and Privacy

1. **Privacy Policy**: Required for Play Store

    - Create privacy policy document
    - Host on accessible website
    - Add URL to app listing

2. **Data Safety**: Declare data collection practices

    - Select data types collected (if any)
    - Explain data usage and sharing
    - For Hex Zero: Likely "No data collected"

3. **Content Rating**: Complete questionnaire
    - Answer questions about app content
    - Receive ESRB/PEGI ratings automatically

## 📱 Testing and Deployment

### Internal Testing

1. **Upload AAB file** to Play Console
2. **Create internal testing track**
3. **Add test users** via email addresses
4. **Publish to internal testing**

### Production Release

1. **Complete all required sections** in Play Console
2. **Upload production AAB**
3. **Set up release notes**
4. **Submit for review**
5. **Monitor review status**

## 🔒 Security Best Practices

### Keystore Security

```bash
# Create secure backup directory
mkdir -p ~/android-keystores-backup

# Backup keystore
cp android/app/hex-zero-release.keystore ~/android-keystores-backup/

# Backup passwords (encrypted)
echo "Keystore: your_keystore_password" | gpg -c > ~/android-keystores-backup/passwords.gpg
```

### Version Control Security

Add to `.gitignore`:

```gitignore
# Android keystores
*.keystore
*.jks

# Gradle properties with passwords
local.properties
gradle.properties.local

# Build outputs
android/app/build/
android/app/release/
```

### Password Management

1. **Use strong passwords** (12+ characters, mixed case, numbers, symbols)
2. **Store in password manager** (1Password, Bitwarden, etc.)
3. **Create encrypted backups** of keystore and passwords
4. **Use environment variables** in CI/CD pipelines
5. **Never hardcode passwords** in source code

## 🧪 Testing Checklist

### Pre-Release Testing

-   [ ] Build debug APK successfully
-   [ ] Install and test on Android emulator
-   [ ] Test all game features work correctly
-   [ ] Verify app permissions are minimal and necessary
-   [ ] Test on different screen sizes and orientations
-   [ ] Check performance on lower-end device profiles
-   [ ] Verify no console errors in WebView
-   [ ] Test app lifecycle (pause/resume/background)

### Release Testing

-   [ ] Build release AAB successfully
-   [ ] Install release APK on device/emulator
-   [ ] Verify signing configuration is correct
-   [ ] Test app works without development tools
-   [ ] Verify app size is reasonable (<150MB)
-   [ ] Check no debug logs or development features
-   [ ] Test offline functionality (if applicable)

## 📚 Additional Resources

### Documentation

-   [Android Developer Documentation](https://developer.android.com/docs)
-   [Google Play Console Help](https://support.google.com/googleplay/android-developer)
-   [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
-   [Android App Signing](https://developer.android.com/studio/publish/app-signing)

### Tools and Services

-   [Firebase Test Lab](https://firebase.google.com/docs/test-lab) - Real device testing
-   [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/) - Icon generation
-   [App Bundle Explorer](https://github.com/google/bundletool) - AAB analysis

### Troubleshooting

#### Common Issues

1. **Keystore not found**

    - Verify keystore path in gradle.properties
    - Check file permissions and existence

2. **Signing configuration errors**

    - Verify all passwords are correct
    - Check that alias name matches keystore

3. **Build failures**

    - Clean build: `./gradlew clean`
    - Update Android SDK tools
    - Check Java version compatibility

4. **Play Console upload errors**
    - Verify AAB is signed correctly
    - Check app version codes are incremental
    - Ensure all required metadata is complete

#### Getting Help

-   [Stack Overflow - Android Development](https://stackoverflow.com/questions/tagged/android)
-   [Google Play Console Support](https://support.google.com/googleplay/android-developer/answer/6112435)
-   [Capacitor Community Discord](https://discord.com/invite/UPYYRhtyzp)

## 🚀 Quick Start Summary

1. **Install prerequisites**: JDK, Android Studio, SDK tools
2. **Generate keystore**: `node scripts/generate-android-keystore.js`
3. **Configure signing**: Update gradle.properties and build.gradle
4. **Test build**: `./gradlew assembleRelease`
5. **Create Play Console account** and app listing
6. **Upload AAB** and complete store requirements
7. **Submit for review** and monitor approval process

Remember: Keep your keystore and passwords secure! Losing them means you cannot update your app.
