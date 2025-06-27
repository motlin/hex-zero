# Hex Zero Versioning Strategy

## Overview

Hex Zero uses semantic versioning (SemVer) for version management across iOS and Android platforms. This document outlines our versioning strategy and how to manage versions consistently.

## Version Format

We follow the semantic versioning format: `MAJOR.MINOR.PATCH`

-   **MAJOR**: Incremented for incompatible API changes or major feature releases
-   **MINOR**: Incremented for backwards-compatible functionality additions
-   **PATCH**: Incremented for backwards-compatible bug fixes

Example: `1.2.3`

## Platform-Specific Requirements

### iOS

-   **CFBundleShortVersionString**: The marketing version shown to users (e.g., "1.2.3")
-   **CFBundleVersion**: The build number, must be incremented for each upload to App Store Connect

### Android

-   **versionName**: The version shown to users (e.g., "1.2.3")
-   **versionCode**: An integer that must be incremented for each APK upload to Google Play

## Version Code Strategy

For Android's `versionCode` and iOS's `CFBundleVersion`, we use the following formula:

```
versionCode = (MAJOR * 10000) + (MINOR * 100) + PATCH
```

This allows for:

-   Up to 99 minor versions per major version
-   Up to 99 patches per minor version

Examples:

-   Version 1.0.0 → versionCode 10000
-   Version 1.2.3 → versionCode 10203
-   Version 2.1.0 → versionCode 20100

## Using the Version Update Script

The project includes a script to update versions consistently across all platforms:

```bash
# Update to a specific version
node scripts/update-version.js 1.2.3

# Bump the patch version (1.2.3 → 1.2.4)
node scripts/update-version.js patch

# Bump the minor version (1.2.3 → 1.3.0)
node scripts/update-version.js minor

# Bump the major version (1.2.3 → 2.0.0)
node scripts/update-version.js major

# Use a custom build number
node scripts/update-version.js 1.2.3 --build-number 42
```

The script automatically updates:

-   `package.json` - Node.js package version
-   `android/app/build.gradle` - Android versionName and versionCode
-   iOS project (via Capacitor sync) - CFBundleShortVersionString and CFBundleVersion
-   `version.json` - Version tracking file

## Manual Version Updates

If you need to update versions manually:

1. **package.json**: Update the `version` field
2. **Android**: In `android/app/build.gradle`, update:
    ```gradle
    versionCode 10203
    versionName "1.2.3"
    ```
3. **iOS**: Run `npx cap sync ios` to sync the version from package.json

## Best Practices

1. **Always increment versions** before submitting to app stores
2. **Never reuse version codes** - both stores reject builds with previously used codes
3. **Tag releases in git** after version updates:
    ```bash
    git tag v1.2.3
    git push origin v1.2.3
    ```
4. **Document version changes** in a CHANGELOG.md file
5. **Test thoroughly** after version updates on both platforms

## Version History Tracking

The `version.json` file tracks version update history and current platform-specific values:

```json
{
	"version": "1.2.3",
	"versionCode": 10203,
	"buildNumber": 10203,
	"lastUpdated": "2024-01-20T10:30:00.000Z",
	"platform": {
		"ios": {
			"CFBundleShortVersionString": "1.2.3",
			"CFBundleVersion": "10203"
		},
		"android": {
			"versionName": "1.2.3",
			"versionCode": 10203
		}
	}
}
```

## Troubleshooting

### iOS Version Not Updating

If Capacitor sync doesn't update the iOS version:

1. Open the project in Xcode
2. Select the project in the navigator
3. Under "General" tab, update:
    - Version (MARKETING_VERSION)
    - Build (CURRENT_PROJECT_VERSION)

### Android Build Conflicts

If you get version code conflicts when uploading to Google Play:

1. Check the Play Console for the last used version code
2. Use a higher build number with the `--build-number` flag
3. Ensure you're not reusing a previously uploaded version code

## Release Checklist

-   [ ] Update version using the script
-   [ ] Review changes in all affected files
-   [ ] Commit version changes
-   [ ] Tag the release in git
-   [ ] Build and test on both platforms
-   [ ] Update CHANGELOG.md
-   [ ] Submit to app stores
