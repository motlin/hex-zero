#!/usr/bin/env node

/**
 * 🎨 Feature Graphic Generator for Hex Zero
 *
 * Creates a template feature graphic for Google Play Store
 * Required size: 1024x500 pixels
 */

/* eslint-disable no-console, no-undef */

import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const WIDTH = 1024;
const HEIGHT = 500;

// Hex Zero color scheme
const colors = {
    background: '#1a1a2e',
    primary: '#16213e',
    accent: '#e94560',
    text: '#f5f5f5',
    hexOutline: '#0f3460',
    hexFill: '#e94560',
};

function drawHexagon(ctx, x, y, size, fillColor, strokeColor) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = x + size * Math.cos(angle);
        const hy = y + size * Math.sin(angle);
        if (i === 0) {
            ctx.moveTo(hx, hy);
        } else {
            ctx.lineTo(hx, hy);
        }
    }
    ctx.closePath();

    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }

    if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

function createFeatureGraphic() {
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    gradient.addColorStop(0, colors.background);
    gradient.addColorStop(1, colors.primary);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Decorative hex pattern on left side
    const hexSize = 30;
    const hexSpacing = hexSize * 1.8;

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 4; col++) {
            const x = col * hexSpacing + (row % 2) * (hexSpacing / 2) + 50;
            const y = row * (hexSize * 1.5) + 50;

            const opacity = 0.1 + (Math.random() * 0.2);
            const fillColor = `rgba(233, 69, 96, ${opacity})`;

            drawHexagon(ctx, x, y, hexSize, fillColor, colors.hexOutline);
        }
    }

    // Title text
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('HEX ZERO', WIDTH / 2, HEIGHT / 2 - 50);

    // Subtitle
    ctx.font = '36px Arial';
    ctx.fillStyle = colors.accent;
    ctx.fillText('Strategic Puzzle Game', WIDTH / 2, HEIGHT / 2 + 20);

    // Feature highlights
    ctx.font = '24px Arial';
    ctx.fillStyle = colors.text;
    const features = ['Fill the Board', '•', 'Plan Your Moves', '•', 'Master the Hex'];
    const featureText = features.join('  ');
    ctx.fillText(featureText, WIDTH / 2, HEIGHT / 2 + 80);

    // Large decorative hexagons on right
    drawHexagon(ctx, WIDTH - 150, HEIGHT / 2, 60, 'rgba(233, 69, 96, 0.3)', colors.accent);
    drawHexagon(ctx, WIDTH - 100, HEIGHT / 2 - 80, 40, 'rgba(233, 69, 96, 0.2)', colors.hexOutline);
    drawHexagon(ctx, WIDTH - 120, HEIGHT / 2 + 70, 35, 'rgba(233, 69, 96, 0.25)', colors.hexOutline);

    // Save the image
    const outputDir = join(process.cwd(), 'play-store', 'graphics');
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = join(outputDir, 'feature-graphic-template.png');
    const buffer = canvas.toBuffer('image/png');
    writeFileSync(outputPath, buffer);

    console.log(`✅ Feature graphic template created: ${outputPath}`);
    console.log('\n📝 Next steps:');
    console.log('1. Open the template in an image editor');
    console.log('2. Add game screenshots or refined graphics');
    console.log('3. Ensure text is readable and appealing');
    console.log('4. Save final version as feature-graphic.png');
    console.log(`5. Final size must be exactly ${WIDTH}x${HEIGHT} pixels`);
}

// Check if canvas is available
try {
    createFeatureGraphic();
} catch (error) {
    console.error('❌ Error creating feature graphic:', error.message);
    console.log('\n💡 To create the feature graphic manually:');
    console.log(`1. Create a ${WIDTH}x${HEIGHT} pixel image`);
    console.log('2. Use Hex Zero brand colors:');
    console.log('   - Background: #1a1a2e');
    console.log('   - Accent: #e94560');
    console.log('3. Include the game title prominently');
    console.log('4. Show hexagonal elements');
    console.log('5. Save as play-store/graphics/feature-graphic.png');
}
