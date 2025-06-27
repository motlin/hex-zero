/**
 * 🎨 Skia color theme system for React Native
 * Supports light and dark themes with dynamic color mapping
 */

import type {ColorMap} from './ColorTheme';

export type ThemeType = 'light' | 'dark';

export interface SkiaTheme {
	name: string;
	type: ThemeType;
	colors: {
		// Hex height colors (0-10+)
		heightMap: ColorMap;
		// UI colors
		background: string;
		surface: string;
		text: string;
		textSecondary: string;
		gridLines: string;
		// Game colors
		hintStroke: string;
		hintFill: string;
		invalidFill: string;
		previewFill: string;
		// Animation colors
		burstColor: string;
		selectionColor: string;
	};
	// Color utilities
	opacity: {
		subtle: number;
		medium: number;
		strong: number;
	};
}

/**
 * 🌟 Enhanced height color mapping for better visual progression
 */
const ENHANCED_HEIGHT_COLORS: ColorMap = {
	// Black for empty
	0: '#000000',
	// Red-pink
	1: '#e94560',
	// Orange-red
	2: '#ee6c4d',
	// Orange
	3: '#f3a261',
	// Yellow-orange
	4: '#f9c74f',
	// Light yellow
	5: '#f8dc81',
	// Yellow-green
	6: '#e9d758',
	// Light green
	7: '#c9e265',
	// Green
	8: '#90be6d',
	// Teal
	9: '#43aa8b',
	// Blue
	10: '#277da1',
};

/**
 * 🌅 Light theme configuration
 */
export const LIGHT_THEME: SkiaTheme = {
	name: 'Light',
	type: 'light',
	colors: {
		heightMap: ENHANCED_HEIGHT_COLORS,
		background: '#f8f9fa',
		surface: '#ffffff',
		text: '#212529',
		textSecondary: '#6c757d',
		gridLines: '#dee2e6',
		hintStroke: '#0066cc',
		hintFill: 'rgba(0, 102, 204, 0.1)',
		invalidFill: 'rgba(220, 53, 69, 0.3)',
		previewFill: 'rgba(0, 102, 204, 0.4)',
		burstColor: '#ffffff',
		selectionColor: '#0066cc',
	},
	opacity: {
		subtle: 0.1,
		medium: 0.4,
		strong: 0.8,
	},
};

/**
 * 🌙 Dark theme configuration
 */
export const DARK_THEME: SkiaTheme = {
	name: 'Dark',
	type: 'dark',
	colors: {
		heightMap: ENHANCED_HEIGHT_COLORS,
		background: '#121212',
		surface: '#1e1e1e',
		text: '#ffffff',
		textSecondary: '#b3b3b3',
		gridLines: '#333333',
		hintStroke: '#4da6ff',
		hintFill: 'rgba(77, 166, 255, 0.15)',
		invalidFill: 'rgba(255, 82, 82, 0.3)',
		previewFill: 'rgba(77, 166, 255, 0.4)',
		burstColor: '#ffffff',
		selectionColor: '#4da6ff',
	},
	opacity: {
		subtle: 0.15,
		medium: 0.5,
		strong: 0.9,
	},
};

/**
 * 🎨 Theme registry
 */
export const THEMES: Record<ThemeType, SkiaTheme> = {
	light: LIGHT_THEME,
	dark: DARK_THEME,
};

/**
 * 🎨 Get theme by type
 */
export function getTheme(type: ThemeType): SkiaTheme {
	return THEMES[type];
}

/**
 * 🎨 Get height color from theme
 */
export function getHeightColorFromTheme(height: number, theme: SkiaTheme): string {
	if (height === 0) return theme.colors.heightMap[0];
	if (height > 10) return theme.colors.surface;
	return theme.colors.heightMap[height] || theme.colors.textSecondary;
}

/**
 * 🎨 Add alpha to any color
 */
export function withAlpha(color: string, alpha: number): string {
	// Handle hex colors
	if (color.startsWith('#')) {
		const hex = color.slice(1);
		const alphaHex = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
			.toString(16)
			.padStart(2, '0');
		return hex.length === 6 ? `#${hex}${alphaHex}` : color;
	}

	// Handle rgba colors
	if (color.startsWith('rgba(')) {
		return color.replace(/[\d.]+(?=\))/, alpha.toString());
	}

	// Handle rgb colors - convert to rgba
	if (color.startsWith('rgb(')) {
		return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
	}

	return color;
}

/**
 * 🎨 Create theme-aware gradient
 */
export function createThemeGradient(theme: SkiaTheme, maxHeight: number): Array<{position: number; color: string}> {
	const stops: Array<{position: number; color: string}> = [];

	for (let i = 0; i <= Math.min(maxHeight, 10); i++) {
		const position = i / Math.max(maxHeight, 10);
		const color = getHeightColorFromTheme(i, theme);
		stops.push({position, color});
	}

	return stops;
}

/**
 * 🎨 Get contrast color (black or white) for given background
 */
export function getContrastColor(backgroundColor: string): string {
	// Simple luminance calculation for hex colors
	if (backgroundColor.startsWith('#')) {
		const hex = backgroundColor.slice(1);
		const r = parseInt(hex.substr(0, 2), 16);
		const g = parseInt(hex.substr(2, 2), 16);
		const b = parseInt(hex.substr(4, 2), 16);

		// Calculate relative luminance
		const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

		return luminance > 0.5 ? '#000000' : '#ffffff';
	}

	// Default to black
	return '#000000';
}

/**
 * 🎨 Blend two colors
 */
export function blendColors(color1: string, color2: string, ratio: number): string {
	if (!color1.startsWith('#') || !color2.startsWith('#')) {
		// Return first color if not hex
		return color1;
	}

	const hex1 = color1.slice(1);
	const hex2 = color2.slice(1);

	const r1 = parseInt(hex1.substr(0, 2), 16);
	const g1 = parseInt(hex1.substr(2, 2), 16);
	const b1 = parseInt(hex1.substr(4, 2), 16);

	const r2 = parseInt(hex2.substr(0, 2), 16);
	const g2 = parseInt(hex2.substr(2, 2), 16);
	const b2 = parseInt(hex2.substr(4, 2), 16);

	const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
	const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
	const b = Math.round(b1 * (1 - ratio) + b2 * ratio);

	return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * 🎨 Theme-aware animation colors
 */
export function getAnimationColors(theme: SkiaTheme) {
	return {
		burst: withAlpha(theme.colors.burstColor, 0.8),
		burstFade: withAlpha(theme.colors.burstColor, 0.0),
		selection: withAlpha(theme.colors.selectionColor, 0.6),
		hint: withAlpha(theme.colors.hintStroke, 0.4),
		invalid: withAlpha(theme.colors.invalidFill, 0.8),
	};
}

/**
 * 🎨 Export default theme
 */
export const DEFAULT_THEME = DARK_THEME;
