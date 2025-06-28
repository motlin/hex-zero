# 🔐 iOS Signing Configuration

This file documents the current signing configuration for the Hex Zero iOS app.

## Current Configuration

**Bundle Identifier**: `com.hexzero.game`
**Code Sign Style**: Automatic (Development)
**Target iOS Version**: 14.0+
**Supported Devices**: iPhone and iPad (Universal)

## Required Certificates

### Development Certificate

-   **Type**: iOS Development
-   **Usage**: Testing on devices, development builds
-   **Validity**: 1 year
-   **Renewal**: Required annually

### Distribution Certificate

-   **Type**: iOS Distribution (App Store and Ad Hoc)
-   **Usage**: App Store submission, ad-hoc distribution
-   **Validity**: 1 year
-   **Renewal**: Required annually

## Required Provisioning Profiles

### Development Profile

-   **Name**: Hex Zero Development
-   **Type**: iOS App Development
-   **App ID**: com.hexzero.game
-   **Devices**: Registered development devices
-   **Certificate**: iOS Development certificate

### Distribution Profile

-   **Name**: Hex Zero App Store
-   **Type**: App Store Distribution
-   **App ID**: com.hexzero.game
-   **Certificate**: iOS Distribution certificate

## Build Configurations

### Debug Configuration

```
Code Signing Identity: iPhone Developer
Code Sign Style: Automatic
Provisioning Profile: Xcode Managed (Development)
```

### Release Configuration

```
Code Signing Identity: iPhone Distribution
Code Sign Style: Manual (for App Store)
Provisioning Profile: Hex Zero App Store
```

## Setup Status

-   [ ] Apple Developer Account verified
-   [ ] Development certificate created and installed
-   [ ] Distribution certificate created and installed
-   [ ] App ID registered (com.hexzero.game)
-   [ ] Development provisioning profile created
-   [ ] Distribution provisioning profile created
-   [ ] Xcode project configured with correct bundle ID
-   [ ] Development build tested on device
-   [ ] Archive build tested for distribution

## Notes

-   Automatic signing is recommended for development
-   Manual signing required for App Store distribution
-   Certificates must be renewed annually
-   Provisioning profiles must be updated when adding new devices
-   All team members need access to shared certificates (.p12 export)

## Troubleshooting

Common issues and solutions documented in:

-   `docs/IOS_DEVELOPMENT_SETUP.md`
-   Apple's Code Signing troubleshooting guide

## Security

-   Never commit private keys or .p12 files to version control
-   Store certificates securely with team password manager
-   Export certificates for team sharing with strong passwords
-   Rotate certificates before expiration to avoid interruption
