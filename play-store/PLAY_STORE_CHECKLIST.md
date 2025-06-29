# 🤖 Google Play Store Submission Checklist

## Required Graphics

### Feature Graphic

-   [ ] Size: 1024x500 pixels
-   [ ] Format: PNG or JPEG
-   [ ] Location: play-store/graphics/feature-graphic.png
-   [ ] Shows game branding and key visual elements
-   [ ] No embedded text that needs localization

### Screenshots

Minimum 2, maximum 8 per device type

#### Phone Screenshots (Required)

-   [ ] Screenshot 1: Main game view
-   [ ] Screenshot 2: Active gameplay
-   [ ] Screenshot 3: Victory/completion screen
-   [ ] Screenshot 4: Game variety
-   [ ] Screenshot 5: Menu/features
-   [ ] Location: play-store/screenshots/phone/

#### 7-inch Tablet Screenshots (Required)

-   [ ] Screenshot 1: Main game view
-   [ ] Screenshot 2: Active gameplay
-   [ ] Screenshot 3: Victory/completion screen
-   [ ] Screenshot 4: Game variety
-   [ ] Location: play-store/screenshots/7-inch-tablet/

#### 10-inch Tablet Screenshots (Required)

-   [ ] Screenshot 1: Main game view
-   [ ] Screenshot 2: Active gameplay
-   [ ] Screenshot 3: Victory/completion screen
-   [ ] Screenshot 4: Game variety
-   [ ] Location: play-store/screenshots/10-inch-tablet/

### Optional Graphics

#### App Icon

-   [ ] Size: 512x512 pixels
-   [ ] Format: PNG (32-bit)
-   [ ] Location: play-store/graphics/icon-512.png

#### Promotional Graphics

-   [ ] Promo Video: YouTube URL (optional)
-   [ ] TV Banner: 1280x720 (if supporting Android TV)

## Store Listing Information

### Basic Information

-   [ ] App name: Hex Zero: Puzzle Strategy (30 chars max)
-   [ ] Short description (80 chars max) - Created ✓
-   [ ] Full description (4000 chars max) - Created ✓

### Categorization

-   [ ] Category: Game > Puzzle
-   [ ] Tags: Single player, Offline, Casual

### Content Rating

-   [ ] Complete content rating questionnaire
-   [ ] Expected rating: Everyone

### Contact Information

-   [ ] Developer email
-   [ ] Developer website (optional)
-   [ ] Privacy policy URL (required)

## Testing Setup

### Internal Testing

-   [ ] Upload signed APK or AAB
-   [ ] Add internal testers (email addresses)
-   [ ] Test installation and updates
-   [ ] Verify no crashes or ANRs

### Pre-launch Report

-   [ ] Review automated test results
-   [ ] Fix any compatibility issues
-   [ ] Address accessibility warnings

## Release Preparation

### Build Configuration

-   [ ] Generate signed release build
-   [ ] Use Android App Bundle (AAB) format
-   [ ] Enable app signing by Google Play

### Pricing & Distribution

-   [ ] Set as Free
-   [ ] Select available countries
-   [ ] No ads declaration
-   [ ] No in-app purchases

### Final Checklist

-   [ ] All graphics uploaded and properly sized
-   [ ] Store listing complete in all sections
-   [ ] Content rating obtained
-   [ ] Privacy policy published and linked
-   [ ] Signed AAB uploaded
-   [ ] Internal testing completed
-   [ ] Ready for production release

## Notes

-   Screenshots should show actual gameplay
-   Avoid text in images that would need translation
-   Feature graphic is the most important visual element
-   Test on multiple Android versions before release

## Quick Commands

```bash
# Generate Android screenshots
npm run screenshots:android

# Create feature graphic template
npm run play-store:graphics

# Create metadata files
node scripts/create-play-store-metadata.js

# Build release AAB
npm run build:android
```
