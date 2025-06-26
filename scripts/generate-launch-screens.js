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

// 📐 iOS launch screen sizes
const IOS_SIZES = [
    // Universal size that will be scaled by iOS
    { width: 2732, height: 2732, filename: 'splash-2732x2732.png' },
    { width: 2732, height: 2732, filename: 'splash-2732x2732-1.png' },
    { width: 2732, height: 2732, filename: 'splash-2732x2732-2.png' },
];

// 📐 Android splash screen sizes (9-patch compatible)
const ANDROID_SIZES = [
    // Portrait sizes
    { name: 'drawable-port-mdpi', width: 320, height: 480 },
    { name: 'drawable-port-hdpi', width: 480, height: 800 },
    { name: 'drawable-port-xhdpi', width: 720, height: 1280 },
    { name: 'drawable-port-xxhdpi', width: 960, height: 1600 },
    { name: 'drawable-port-xxxhdpi', width: 1280, height: 1920 },
    // Landscape sizes
    { name: 'drawable-land-mdpi', width: 480, height: 320 },
    { name: 'drawable-land-hdpi', width: 800, height: 480 },
    { name: 'drawable-land-xhdpi', width: 1280, height: 720 },
    { name: 'drawable-land-xxhdpi', width: 1600, height: 960 },
    { name: 'drawable-land-xxxhdpi', width: 1920, height: 1280 },
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
 * 🎨 Draw the splash screen design
 */
function drawSplashScreen(canvas, width, height) {
    const ctx = canvas.getContext('2d');
    const centerX = width / 2;
    const centerY = height / 2;
    const minDimension = Math.min(width, height);

    // Background gradient
    const bgGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, minDimension * 0.7,
    );
    bgGradient.addColorStop(0, COLORS.darkGray);
    bgGradient.addColorStop(1, COLORS.background);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative hexagon pattern
    const patternSize = minDimension * 0.08;
    const spacing = patternSize * 2.5;
    ctx.globalAlpha = 0.05;

    for (let x = -spacing; x < width + spacing; x += spacing * 1.5) {
        for (let y = -spacing; y < height + spacing; y += spacing * 0.866) {
            const row = Math.floor(y / (spacing * 0.866));
            const offsetX = row % 2 === 0 ? 0 : spacing * 0.75;
            ctx.fillStyle = COLORS.primary;
            drawHexagon(ctx, x + offsetX, y, patternSize * 0.4);
            ctx.fill();
        }
    }

    ctx.globalAlpha = 1;

    // Main logo hexagon
    const logoSize = minDimension * 0.25;
    const logoGradient = ctx.createLinearGradient(
        centerX - logoSize, centerY - logoSize,
        centerX + logoSize, centerY + logoSize,
    );
    logoGradient.addColorStop(0, COLORS.primary);
    logoGradient.addColorStop(1, COLORS.secondary);

    // Outer glow
    ctx.shadowColor = COLORS.primary;
    ctx.shadowBlur = minDimension * 0.04;
    ctx.fillStyle = logoGradient;
    drawHexagon(ctx, centerX, centerY, logoSize);
    ctx.fill();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Inner hexagon
    ctx.fillStyle = COLORS.darkGray;
    drawHexagon(ctx, centerX, centerY, logoSize * 0.8);
    ctx.fill();

    // Center zero
    ctx.font = `bold ${logoSize}px -apple-system, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.white;
    ctx.fillText('0', centerX, centerY);

    // Title text
    const titleSize = minDimension * 0.06;
    ctx.font = `300 ${titleSize}px -apple-system, system-ui, sans-serif`;
    ctx.fillStyle = COLORS.white;
    ctx.fillText('HEX ZERO', centerX, centerY + logoSize * 1.5);

    // Subtitle
    const subtitleSize = minDimension * 0.03;
    ctx.font = `300 ${subtitleSize}px -apple-system, system-ui, sans-serif`;
    ctx.fillStyle = COLORS.primary;
    ctx.globalAlpha = 0.8;
    ctx.fillText('PUZZLE GAME', centerX, centerY + logoSize * 1.5 + titleSize);
    ctx.globalAlpha = 1;

    // Small accent hexagons around the logo
    const accentPositions = [
        { angle: 0, color: COLORS.accent },
        { angle: Math.PI / 3, color: COLORS.highlight },
        { angle: (Math.PI * 2) / 3, color: COLORS.accent },
        { angle: Math.PI, color: COLORS.highlight },
        { angle: (Math.PI * 4) / 3, color: COLORS.accent },
        { angle: (Math.PI * 5) / 3, color: COLORS.highlight },
    ];

    accentPositions.forEach(({ angle, color }) => {
        const distance = logoSize * 1.8;
        const x = centerX + distance * Math.cos(angle - Math.PI / 2);
        const y = centerY + distance * Math.sin(angle - Math.PI / 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.6;
        drawHexagon(ctx, x, y, minDimension * 0.02);
        ctx.fill();
    });

    ctx.globalAlpha = 1;
}

/**
 * 🎯 Generate iOS launch screens
 */
async function generateIOSLaunchScreens() {
    console.log('📱 Generating iOS launch screens...');

    const splashDir = path.join(__dirname, '..', 'ios', 'App', 'App', 'Assets.xcassets', 'Splash.imageset');
    await ensureDir(splashDir);

    for (const config of IOS_SIZES) {
        const canvas = createCanvas(config.width, config.height);
        drawSplashScreen(canvas, config.width, config.height);

        const buffer = canvas.toBuffer('image/png');
        await fs.writeFile(path.join(splashDir, config.filename), buffer);

        console.log(`  ✅ Created ${config.filename} (${config.width}x${config.height})`);
    }

    // Update Contents.json
    const contents = {
        images: [
            {
                idiom: 'universal',
                filename: 'splash-2732x2732-2.png',
                scale: '1x',
            },
            {
                idiom: 'universal',
                filename: 'splash-2732x2732-1.png',
                scale: '2x',
            },
            {
                idiom: 'universal',
                filename: 'splash-2732x2732.png',
                scale: '3x',
            },
        ],
        info: {
            version: 1,
            author: 'xcode',
        },
    };

    await fs.writeFile(
        path.join(splashDir, 'Contents.json'),
        JSON.stringify(contents, null, '\t'),
    );
    console.log('  ✅ Updated Contents.json');
}

/**
 * 🤖 Generate Android splash screens
 */
async function generateAndroidSplashScreens() {
    console.log('\n🤖 Generating Android splash screens...');

    const androidResDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

    // Generate splash screens for each density
    for (const config of ANDROID_SIZES) {
        const splashDir = path.join(androidResDir, config.name);
        await ensureDir(splashDir);

        const canvas = createCanvas(config.width, config.height);
        drawSplashScreen(canvas, config.width, config.height);

        const buffer = canvas.toBuffer('image/png');
        await fs.writeFile(path.join(splashDir, 'splash.png'), buffer);

        console.log(`  ✅ Created ${config.name}/splash.png (${config.width}x${config.height})`);
    }

    // Create a universal splash for the main drawable directory
    const universalCanvas = createCanvas(1920, 1920);
    drawSplashScreen(universalCanvas, 1920, 1920);
    await fs.writeFile(
        path.join(androidResDir, 'drawable', 'splash.png'),
        universalCanvas.toBuffer('image/png'),
    );
    console.log('  ✅ Created drawable/splash.png (universal)');

    // Create launch_background.xml
    const launchBackgroundXml = `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/splash_background" />
    <item>
        <bitmap
            android:src="@drawable/splash"
            android:gravity="center" />
    </item>
</layer-list>`;

    await fs.writeFile(
        path.join(androidResDir, 'drawable', 'launch_background.xml'),
        launchBackgroundXml,
    );
    console.log('  ✅ Created launch_background.xml');

    // Update colors.xml to include splash background color
    const colorsPath = path.join(androidResDir, 'values', 'colors.xml');
    let colorsContent = await fs.readFile(colorsPath, 'utf8');

    // Check if splash_background color already exists
    if (!colorsContent.includes('splash_background')) {
        // Add splash_background color before the closing resources tag
        colorsContent = colorsContent.replace(
            '</resources>',
            '    <color name="splash_background">#1a1a1a</color>\n</resources>',
        );
        await fs.writeFile(colorsPath, colorsContent);
        console.log('  ✅ Updated colors.xml with splash background color');
    }
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
 * 🚀 Main function
 */
async function main() {
    console.log('🎨 Hex Zero Launch Screen Generator');
    console.log('===================================\n');

    try {
        await generateIOSLaunchScreens();
        await generateAndroidSplashScreens();

        console.log('\n✨ All launch screens generated successfully!');
        console.log('\n📝 Next steps:');
        console.log('  1. Run `npx cap sync` to sync changes to native projects');
        console.log('  2. For iOS: Launch screens are configured in Xcode storyboard');
        console.log('  3. For Android: Launch screens are configured in styles.xml');
        console.log('  4. Test on both platforms to ensure proper display');
    } catch (error) {
        console.error('\n❌ Error generating launch screens:', error);
        // eslint-disable-next-line no-undef
        process.exit(1);
    }
}

// Run the generator
main();
