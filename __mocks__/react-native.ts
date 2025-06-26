import {vi} from 'vitest';

export const PixelRatio = {
	get: vi.fn(() => 2),
	getFontScale: vi.fn(() => 1),
	getPixelSizeForLayoutSize: vi.fn((size: number) => size * 2),
	roundToNearestPixel: vi.fn((size: number) => Math.round(size)),
};

export const Platform = {
	OS: 'ios',
	Version: '17.0',
	select: vi.fn((specifics: Record<string, unknown>) => specifics.ios || specifics.default),
};

export const Dimensions = {
	get: vi.fn(() => ({width: 375, height: 812, scale: 2, fontScale: 1})),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
};

export const StyleSheet = {
	create: <T extends Record<string, unknown>>(styles: T): T => styles,
	flatten: vi.fn((style: unknown) => style),
};

export default {
	PixelRatio,
	Platform,
	Dimensions,
	StyleSheet,
};
