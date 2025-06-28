# 📱 iOS Development Setup for Hex Zero

This document provides step-by-step instructions for setting up iOS development certificates and provisioning profiles for the Hex Zero mobile app.

## 🍎 Apple Developer Account Requirements

### Account Setup

1. **Apple Developer Program Membership**

    - Visit [developer.apple.com](https://developer.apple.com)
    - Enroll in the Apple Developer Program ($99/year)
    - Complete account verification process

2. **Team Configuration**
    - Note your Team ID (found in Apple Developer Portal)
    - Ensure proper role permissions for certificate management

## 🔐 Development Certificates

### Creating Development Certificate

1. **Generate Certificate Signing Request (CSR)**

    ```bash
    # Open Keychain Access
    # Keychain Access > Certificate Assistant > Request Certificate from Certificate Authority
    # Enter email and common name
    # Save CSR file to disk
    ```

2. **Create iOS Development Certificate**

    - Navigate to Apple Developer Portal > Certificates, IDs & Profiles
    - Click "+" to create new certificate
    - Select "iOS Development"
    - Upload CSR file
    - Download and install certificate

3. **Install Certificate**
    ```bash
    # Double-click downloaded certificate to install in Keychain
    # Verify certificate appears in "My Certificates" section
    ```

### Creating Distribution Certificate

1. **Generate Distribution CSR**

    - Follow same CSR generation process as development

2. **Create iOS Distribution Certificate**
    - Apple Developer Portal > Certificates, IDs & Profiles
    - Click "+" for new certificate
    - Select "iOS Distribution (App Store and Ad Hoc)"
    - Upload CSR file
    - Download and install certificate

## 📋 App ID Configuration

### Register App ID

1. **Create App ID**

    - Navigate to Identifiers section in Developer Portal
    - Click "+" to register new identifier
    - Select "App IDs" type
    - Choose "App" for app ID type

2. **Configure App ID Details**

    ```
    Description: Hex Zero Game
    Bundle ID: com.hexzero.game (explicit App ID)
    Platform: iOS
    ```

3. **App Services**
    - Enable required capabilities (if any)
    - For Hex Zero, minimal services needed
    - Save configuration

## 🎯 Provisioning Profiles

### Development Provisioning Profile

1. **Create Development Profile**

    - Apple Developer Portal > Profiles section
    - Click "+" to create new profile
    - Select "iOS App Development"
    - Choose the Hex Zero App ID created above

2. **Select Development Certificate**

    - Choose the development certificate created earlier
    - Select development devices for testing

3. **Generate and Download**

    - Name: "Hex Zero Development"
    - Generate profile
    - Download .mobileprovision file

4. **Install Profile**
    ```bash
    # Double-click .mobileprovision file to install
    # Or drag to Xcode to install automatically
    ```

### Distribution Provisioning Profile

1. **Create Distribution Profile**

    - Apple Developer Portal > Profiles
    - Click "+" for new profile
    - Select "App Store" distribution type
    - Choose Hex Zero App ID

2. **Select Distribution Certificate**

    - Choose iOS Distribution certificate
    - Generate profile

3. **Download and Install**
    - Name: "Hex Zero App Store"
    - Download and install .mobileprovision file

## 🔧 Xcode Configuration

### Project Settings

1. **Open iOS Project**

    ```bash
    cd ios/App
    open App.xcworkspace
    ```

2. **Configure Signing**

    - Select App target in project navigator
    - Go to "Signing & Capabilities" tab
    - Set Team to your Apple Developer account
    - Set Bundle Identifier: `com.hexzero.game`

3. **Automatic vs Manual Signing**

    **For Development (Recommended: Automatic)**

    ```
    ✅ Automatically manage signing
    Team: [Your Development Team]
    Provisioning Profile: Xcode Managed Profile
    ```

    **For Distribution (Manual)**

    ```
    ❌ Automatically manage signing
    Provisioning Profile: Hex Zero App Store
    Signing Certificate: iOS Distribution
    ```

### Build Configurations

1. **Debug Configuration**

    ```
    Code Signing Identity: iPhone Developer
    Provisioning Profile: Automatic (or manual dev profile)
    ```

2. **Release Configuration**
    ```
    Code Signing Identity: iPhone Distribution
    Provisioning Profile: Hex Zero App Store
    ```

## 🧪 Testing Setup

### Device Registration

1. **Register Test Devices**

    - Apple Developer Portal > Devices
    - Click "+" to register new device
    - Enter device name and UDID
    - Add to development provisioning profile

2. **Get Device UDID**
    ```bash
    # Connect device via USB
    # Xcode > Window > Devices and Simulators
    # Select device and copy Identifier
    ```

### Build and Deploy

1. **Development Build**

    ```bash
    # In project root
    npm run build
    npx cap sync ios
    npx cap open ios

    # In Xcode:
    # Select development team
    # Choose target device
    # Click Run button
    ```

2. **Archive for Distribution**
    ```bash
    # In Xcode:
    # Product > Archive
    # Ensure Release configuration
    # Wait for archive completion
    # Upload to App Store Connect or export IPA
    ```

## 🔄 Profile Management

### Renewal Process

1. **Certificate Expiration**

    - Development certificates: 1 year
    - Distribution certificates: 1 year
    - Renew before expiration to avoid disruption

2. **Profile Updates**
    - Regenerate profiles when certificates renewed
    - Update profiles when adding new devices
    - Re-download and install updated profiles

### Backup and Security

1. **Export Certificates**

    ```bash
    # In Keychain Access
    # Right-click certificate
    # Export certificate with private key
    # Save as .p12 file with strong password
    # Store securely for team sharing
    ```

2. **Team Distribution**
    - Share .p12 files securely with team members
    - Include password via secure channel
    - Document which certificates are for which purposes

## 🚀 App Store Connect Setup

### App Store Connect Configuration

1. **Create App Record**

    - Visit [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
    - My Apps > "+" > New App
    - Enter app information:
        ```
        Name: Hex Zero
        Primary Language: English
        Bundle ID: com.hexzero.game
        SKU: hexzero-ios
        ```

2. **App Information**
    - Category: Games > Puzzle
    - Content Rights: Your own original content
    - Age Rating: 4+ (appropriate for all ages)

## 🔧 Troubleshooting

### Common Issues

1. **"No matching provisioning profiles found"**

    - Verify bundle identifier matches App ID
    - Check provisioning profile is installed
    - Ensure device is registered (for development)

2. **"Certificate not trusted"**

    - Install Apple's intermediate certificates
    - Check certificate chain in Keychain Access
    - Verify certificate is not expired

3. **"Code signing error"**
    - Clean build folder (Xcode > Product > Clean Build Folder)
    - Delete derived data
    - Re-install provisioning profiles

### Verification Commands

```bash
# Check installed certificates
security find-identity -v -p codesigning

# List provisioning profiles
ls ~/Library/MobileDevice/Provisioning\ Profiles/

# Verify profile details
security cms -D -i ~/Library/MobileDevice/Provisioning\ Profiles/[profile-uuid].mobileprovision
```

## 📚 Resources

-   [Apple Developer Documentation](https://developer.apple.com/documentation/)
-   [Code Signing Guide](https://developer.apple.com/support/code-signing/)
-   [App Store Connect Help](https://help.apple.com/app-store-connect/)
-   [Capacitor iOS Development](https://capacitorjs.com/docs/ios)

---

**Security Note**: Keep certificates and provisioning profiles secure. Never commit private keys or .p12 files to version control.
