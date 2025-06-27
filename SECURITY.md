# Security Policy

## Overview

Hex Zero is designed with security and privacy as core principles. This document outlines our security practices and configurations.

## Security Features

### Data Protection

- **No Data Collection**: The app does not collect or transmit any user data
- **Local Storage Only**: All game data is stored locally on the device
- **No Analytics**: No third-party analytics or tracking services are integrated
- **No Ads**: No advertising networks or SDKs are included

### Network Security

- **HTTPS Only**: All network communications (app store updates only) use HTTPS
- **No External APIs**: The game does not connect to any external APIs or services
- **Certificate Pinning**: Not required as no network requests are made during gameplay

### Platform-Specific Security

#### iOS Security

- **App Transport Security (ATS)**: Configured with strictest settings
    - `NSAllowsArbitraryLoads`: false
    - `NSAllowsArbitraryLoadsInWebContent`: false
    - `NSAllowsLocalNetworking`: false
- **No Encryption Export**: App uses only standard iOS encryption

#### Android Security

- **Network Security Config**: Custom configuration enforcing HTTPS
- **Clear Text Traffic**: Disabled (`cleartextTrafficPermitted="false"`)
- **Backup**: Disabled to prevent cloud backup of game data
- **Data Extraction Rules**: Configured for Android 12+ to control data transfer

### Permissions

The app requests minimal permissions:

- **Internet** (Android only): Required for app store downloads/updates
- **Vibration** (optional): For haptic feedback during gameplay

No sensitive permissions are requested or required.

## Security Best Practices

### For Users

1. Keep your device OS updated
2. Download the app only from official app stores
3. Use device-level security features (PIN, biometric lock)

### For Developers

1. Regular dependency updates
2. Code signing for all releases
3. No hardcoded secrets or API keys
4. Secure build pipeline

## Reporting Security Issues

If you discover a security vulnerability, please report it to [security contact email].

## Compliance

- **COPPA**: Compliant - no data collection from users of any age
- **GDPR**: Compliant - no personal data processing
- **CCPA**: Compliant - no sale or sharing of personal information

## Updates

This security policy is reviewed and updated regularly. Check the repository for the latest version.
