#!/usr/bin/env node
/* eslint-disable no-console */

import { createCanvas } from 'canvas';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🎨 Color scheme matching the game
const COLORS = {
    background: '#1a1a1a',
    primary: '#4a9eff',
    secondary: '#63d471',
    accent: '#ffcc00',
    highlight: '#ff6b6b',
    white: '#ffffff',
    darkGray: '#2d2d2d',
};

// 📐 iOS icon sizes (in points, will be multiplied by scale)
const IOS_SIZES = [
    // Notification
    { size: 20, scales: [2, 3] },
    // Settings
    { size: 29, scales: [2, 3] },
    // Spotlight
    { size: 40, scales: [2, 3] },
    // App
    { size: 60, scales: [2, 3] },
    // iPad
    { size: 76, scales: [1, 2] },
    // iPad Pro
    { size: 83.5, scales: [2] },
    // App Store
    { size: 1024, scales: [1] },
];

// 📐 Android icon sizes
const ANDROID_SIZES = [
    { name: 'mipmap-mdpi', size: 48 },
    { name: 'mipmap-hdpi', size: 72 },
    { name: 'mipmap-xhdpi', size: 96 },
    { name: 'mipmap-xxhdpi', size: 144 },
    { name: 'mipmap-xxxhdpi', size: 192 },
];

// 🔔 Android notification icon sizes
const NOTIFICATION_SIZES = [
    { name: 'drawable-mdpi', size: 24 },
    { name: 'drawable-hdpi', size: 36 },
    { name: 'drawable-xhdpi', size: 48 },
    { name: 'drawable-xxhdpi', size: 72 },
    { name: 'drawable-xxxhdpi', size: 96 },
];

/**
 * 🎯 Draw a hexagon shape
 */
function drawHexagon(ctx, centerX, centerY, radius) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
}

/**
 * 🎨 Create the main app icon design
 */
function drawAppIcon(canvas, size) {
    const ctx = canvas.getContext('2d');
    const center = size / 2;

    // Background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, size, size);

    // Main hexagon with gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, COLORS.primary);
    gradient.addColorStop(1, COLORS.secondary);

    ctx.fillStyle = gradient;
    drawHexagon(ctx, center, center, size * 0.4);
    ctx.fill();

    // Inner hexagon pattern
    ctx.fillStyle = COLORS.darkGray;
    drawHexagon(ctx, center, center, size * 0.32);
    ctx.fill();

    // Center zero design
    ctx.font = `bold ${size * 0.3}px -apple-system, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.white;
    ctx.fillText('0', center, center);

    // Small accent hexagons
    const positions = [
        { x: size * 0.2, y: size * 0.2 },
        { x: size * 0.8, y: size * 0.2 },
        { x: size * 0.8, y: size * 0.8 },
        { x: size * 0.2, y: size * 0.8 },
    ];

    positions.forEach((pos, i) => {
        ctx.fillStyle = i % 2 === 0 ? COLORS.accent : COLORS.highlight;
        drawHexagon(ctx, pos.x, pos.y, size * 0.06);
        ctx.fill();
    });
}

/**
 * 🎨 Create Android adaptive icon foreground
 */
function drawAndroidForeground(canvas, size) {
    const ctx = canvas.getContext('2d');
    const center = size / 2;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw smaller hexagon for adaptive icon (66% of safe area)
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, COLORS.primary);
    gradient.addColorStop(1, COLORS.secondary);

    ctx.fillStyle = gradient;
    drawHexagon(ctx, center, center, size * 0.3);
    ctx.fill();

    // Inner design
    ctx.fillStyle = COLORS.darkGray;
    drawHexagon(ctx, center, center, size * 0.24);
    ctx.fill();

    // Zero
    ctx.font = `bold ${size * 0.22}px -apple-system, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.white;
    ctx.fillText('0', center, center);
}

/**
 * 🎨 Create Android adaptive icon background
 */
function drawAndroidBackground(canvas, size) {
    const ctx = canvas.getContext('2d');

    // Gradient background
    const gradient = ctx.createRadialGradient(
        size / 2, size / 2, 0,
        size / 2, size / 2, size / 2,
    );
    gradient.addColorStop(0, COLORS.darkGray);
    gradient.addColorStop(1, COLORS.background);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
}

/**
 * 🔔 Create notification icon (monochrome)
 */
function drawNotificationIcon(canvas, size) {
    const ctx = canvas.getContext('2d');
    const center = size / 2;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // White hexagon with zero cutout
    ctx.fillStyle = '#ffffff';
    drawHexagon(ctx, center, center, size * 0.45);
    ctx.fill();

    // Cut out the zero shape
    ctx.globalCompositeOperation = 'destination-out';
    ctx.font = `bold ${size * 0.4}px -apple-system, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('0', center, center);

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
}

/**
 * 📁 Ensure directory exists
 */
async function ensureDir(dirPath) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (_error) {
        // Directory might already exist
    }
}

/**
 * 🎯 Generate all iOS icons
 */
async function generateIOSIcons() {
    console.log('📱 Generating iOS icons...');

    const iosIconDir = path.join(__dirname, '..', 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
    await ensureDir(iosIconDir);

    const contents = {
        images: [],
        info: {
            version: 1,
            author: 'xcode',
        },
    };

    for (const config of IOS_SIZES) {
        for (const scale of config.scales) {
            const pixelSize = config.size * scale;
            const canvas = createCanvas(pixelSize, pixelSize);

            drawAppIcon(canvas, pixelSize);

            const filename = `icon-${config.size}@${scale}x.png`;
            const buffer = canvas.toBuffer('image/png');
            await fs.writeFile(path.join(iosIconDir, filename), buffer);

            // Add to Contents.json
            const imageEntry = {
                size: `${config.size}x${config.size}`,
                idiom: config.size >= 76 ? 'ipad' : 'iphone',
                filename: filename,
                scale: `${scale}x`,
            };

            if (config.size === 1024) {
                imageEntry.idiom = 'ios-marketing';
            }

            contents.images.push(imageEntry);

            console.log(`  ✅ Created ${filename} (${pixelSize}x${pixelSize})`);
        }
    }

    // Write Contents.json
    await fs.writeFile(
        path.join(iosIconDir, 'Contents.json'),
        JSON.stringify(contents, null, 2),
    );

    console.log('  ✅ Created Contents.json');
}

/**
 * 🤖 Generate Android icons
 */
async function generateAndroidIcons() {
    console.log('\n🤖 Generating Android icons...');

    const androidResDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

    // Generate launcher icons
    for (const config of ANDROID_SIZES) {
        const iconDir = path.join(androidResDir, config.name);
        await ensureDir(iconDir);

        // Regular icon
        const canvas = createCanvas(config.size, config.size);
        drawAppIcon(canvas, config.size);
        await fs.writeFile(
            path.join(iconDir, 'ic_launcher.png'),
            canvas.toBuffer('image/png'),
        );
        console.log(`  ✅ Created ${config.name}/ic_launcher.png`);

        // Round icon (same design for now)
        await fs.writeFile(
            path.join(iconDir, 'ic_launcher_round.png'),
            canvas.toBuffer('image/png'),
        );
        console.log(`  ✅ Created ${config.name}/ic_launcher_round.png`);
    }

    // Generate adaptive icon layers (108dp with 72dp safe zone)
    // Generate adaptive icon layers (108dp with 72dp safe zone)
    // 108dp at xxxhdpi
    const adaptiveSize = 432;

    // Foreground
    const foregroundCanvas = createCanvas(adaptiveSize, adaptiveSize);
    drawAndroidForeground(foregroundCanvas, adaptiveSize);
    await ensureDir(path.join(androidResDir, 'mipmap-xxxhdpi'));
    await fs.writeFile(
        path.join(androidResDir, 'mipmap-xxxhdpi', 'ic_launcher_foreground.png'),
        foregroundCanvas.toBuffer('image/png'),
    );
    console.log('  ✅ Created adaptive icon foreground');

    // Background
    const backgroundCanvas = createCanvas(adaptiveSize, adaptiveSize);
    drawAndroidBackground(backgroundCanvas, adaptiveSize);
    await fs.writeFile(
        path.join(androidResDir, 'mipmap-xxxhdpi', 'ic_launcher_background.png'),
        backgroundCanvas.toBuffer('image/png'),
    );
    console.log('  ✅ Created adaptive icon background');

    // Create adaptive icon XML
    const adaptiveIconXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>`;

    await ensureDir(path.join(androidResDir, 'mipmap-anydpi-v26'));
    await fs.writeFile(
        path.join(androidResDir, 'mipmap-anydpi-v26', 'ic_launcher.xml'),
        adaptiveIconXml,
    );
    await fs.writeFile(
        path.join(androidResDir, 'mipmap-anydpi-v26', 'ic_launcher_round.xml'),
        adaptiveIconXml,
    );
    console.log('  ✅ Created adaptive icon XML files');

    // Generate notification icons
    console.log('\n🔔 Generating notification icons...');
    for (const config of NOTIFICATION_SIZES) {
        const iconDir = path.join(androidResDir, config.name);
        await ensureDir(iconDir);

        const canvas = createCanvas(config.size, config.size);
        drawNotificationIcon(canvas, config.size);
        await fs.writeFile(
            path.join(iconDir, 'ic_notification.png'),
            canvas.toBuffer('image/png'),
        );
        console.log(`  ✅ Created ${config.name}/ic_notification.png`);
    }
}

/**
 * 🚀 Main function
 */
async function main() {
    console.log('🎨 Hex Zero App Icon Generator');
    console.log('==============================\n');

    try {
        await generateIOSIcons();
        await generateAndroidIcons();

        console.log('\n✨ All icons generated successfully!');
        console.log('\n📝 Next steps:');
        console.log('  1. For iOS: Icons are already in the correct location');
        console.log('  2. For Android: Icons are already in the correct location');
        console.log('  3. Run `npx cap sync` to ensure changes are picked up');
    } catch (error) {
        console.error('\n❌ Error generating icons:', error);
        // eslint-disable-next-line no-undef
        process.exit(1);
    }
}

// Run the generator
main();
