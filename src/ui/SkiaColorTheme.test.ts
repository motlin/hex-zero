import {describe, it, expect} from 'vitest';
import {
	getTheme,
	getHeightColorFromTheme,
	withAlpha,
	createThemeGradient,
	getContrastColor,
	blendColors,
	getAnimationColors,
	LIGHT_THEME,
	DARK_THEME,
} from './SkiaColorTheme';

describe('SkiaColorTheme', () => {
	describe('theme management', () => {
		it('returns correct light theme', () => {
			const theme = getTheme('light');
			expect(theme.type).toBe('light');
			expect(theme.name).toBe('Light');
			expect(theme.colors.background).toBe('#f8f9fa');
		});

		it('returns correct dark theme', () => {
			const theme = getTheme('dark');
			expect(theme.type).toBe('dark');
			expect(theme.name).toBe('Dark');
			expect(theme.colors.background).toBe('#121212');
		});

		it('has consistent structure for both themes', () => {
			const lightTheme = getTheme('light');
			const darkTheme = getTheme('dark');

			// Both themes should have same structure
			expect(Object.keys(lightTheme.colors)).toEqual(Object.keys(darkTheme.colors));
			expect(Object.keys(lightTheme.opacity)).toEqual(Object.keys(darkTheme.opacity));
		});
	});

	describe('height color mapping', () => {
		it('returns correct colors for different heights', () => {
			const theme = DARK_THEME;

			expect(getHeightColorFromTheme(0, theme)).toBe('#000000');
			expect(getHeightColorFromTheme(1, theme)).toBe('#e94560');
			expect(getHeightColorFromTheme(5, theme)).toBe('#f8dc81');
			expect(getHeightColorFromTheme(10, theme)).toBe('#277da1');
		});

		it('handles invalid heights gracefully', () => {
			const theme = DARK_THEME;

			expect(getHeightColorFromTheme(11, theme)).toBe(theme.colors.surface);
			expect(getHeightColorFromTheme(-1, theme)).toBe(theme.colors.textSecondary);
		});

		it('maps heights consistently across themes', () => {
			const lightTheme = LIGHT_THEME;
			const darkTheme = DARK_THEME;

			// Height colors should be same for both themes
			for (let height = 0; height <= 10; height++) {
				expect(getHeightColorFromTheme(height, lightTheme)).toBe(getHeightColorFromTheme(height, darkTheme));
			}
		});
	});

	describe('alpha transparency', () => {
		it('adds alpha to hex colors correctly', () => {
			expect(withAlpha('#ff0000', 0.5)).toBe('#ff000080');
			expect(withAlpha('#123456', 1.0)).toBe('#123456ff');
			expect(withAlpha('#abcdef', 0.0)).toBe('#abcdef00');
		});

		it('handles rgba colors', () => {
			expect(withAlpha('rgba(255, 0, 0, 0.8)', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
		});

		it('converts rgb to rgba', () => {
			expect(withAlpha('rgb(255, 0, 0)', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
		});

		it('handles invalid colors gracefully', () => {
			expect(withAlpha('invalid-color', 0.5)).toBe('invalid-color');
		});

		it('clamps alpha values', () => {
			expect(withAlpha('#ff0000', -0.5)).toBe('#ff000000');
			expect(withAlpha('#ff0000', 1.5)).toBe('#ff0000ff');
		});
	});

	describe('theme gradients', () => {
		it('creates correct gradient stops', () => {
			const theme = DARK_THEME;
			const gradient = createThemeGradient(theme, 5);

			// 0-5 inclusive
			expect(gradient).toHaveLength(6);
			expect(gradient[0].position).toBe(0);
			// 5/max(5,10) = 5/10 = 0.5
			expect(gradient[5].position).toBe(0.5);

			// Check colors are from height map
			expect(gradient[0].color).toBe(getHeightColorFromTheme(0, theme));
			expect(gradient[1].color).toBe(getHeightColorFromTheme(1, theme));
		});

		it('handles large height values', () => {
			const theme = DARK_THEME;
			const gradient = createThemeGradient(theme, 15);

			// Should cap at 10 height levels
			// 0-10 inclusive
			expect(gradient).toHaveLength(11);
			expect(gradient[10].position).toBe(10 / 15);
		});
	});

	describe('contrast color calculation', () => {
		it('returns white for dark backgrounds', () => {
			expect(getContrastColor('#000000')).toBe('#ffffff');
			expect(getContrastColor('#123456')).toBe('#ffffff');
		});

		it('returns black for light backgrounds', () => {
			expect(getContrastColor('#ffffff')).toBe('#000000');
			expect(getContrastColor('#f0f0f0')).toBe('#000000');
		});

		it('handles non-hex colors', () => {
			expect(getContrastColor('rgb(255, 255, 255)')).toBe('#000000');
		});
	});

	describe('color blending', () => {
		it('blends colors correctly', () => {
			const result = blendColors('#ff0000', '#0000ff', 0.5);
			// Should be purple
			expect(result).toBe('#800080');
		});

		it('returns first color at ratio 0', () => {
			expect(blendColors('#ff0000', '#0000ff', 0)).toBe('#ff0000');
		});

		it('returns second color at ratio 1', () => {
			expect(blendColors('#ff0000', '#0000ff', 1)).toBe('#0000ff');
		});

		it('handles non-hex colors', () => {
			expect(blendColors('red', '#0000ff', 0.5)).toBe('red');
		});
	});

	describe('animation colors', () => {
		it('generates animation colors for theme', () => {
			const theme = DARK_THEME;
			const animColors = getAnimationColors(theme);

			expect(animColors.burst).toContain('#ffffff');
			expect(animColors.selection).toContain('#4da6ff');
			expect(animColors.hint).toContain('#4da6ff');
			expect(animColors.invalid).toContain('255, 82, 82');
		});

		it('applies correct alpha values', () => {
			const theme = LIGHT_THEME;
			const animColors = getAnimationColors(theme);

			// All colors should have alpha transparency
			// Hex with alpha
			expect(animColors.burst).toMatch(/[0-9a-f]{8}$/i);
			// Fully transparent
			expect(animColors.burstFade).toBe('#ffffff00');
		});
	});

	describe('theme properties', () => {
		it('has valid opacity values', () => {
			[LIGHT_THEME, DARK_THEME].forEach((theme) => {
				expect(theme.opacity.subtle).toBeGreaterThan(0);
				expect(theme.opacity.subtle).toBeLessThan(1);
				expect(theme.opacity.medium).toBeGreaterThan(theme.opacity.subtle);
				expect(theme.opacity.strong).toBeGreaterThan(theme.opacity.medium);
				expect(theme.opacity.strong).toBeLessThanOrEqual(1);
			});
		});

		it('has valid hex colors', () => {
			const hexColorRegex = /^#[0-9a-f]{6}$/i;

			[LIGHT_THEME, DARK_THEME].forEach((theme) => {
				expect(theme.colors.background).toMatch(hexColorRegex);
				expect(theme.colors.surface).toMatch(hexColorRegex);
				expect(theme.colors.text).toMatch(hexColorRegex);
				expect(theme.colors.gridLines).toMatch(hexColorRegex);
			});
		});

		it('has all required height colors', () => {
			[LIGHT_THEME, DARK_THEME].forEach((theme) => {
				for (let i = 0; i <= 10; i++) {
					expect(theme.colors.heightMap[i]).toBeDefined();
					expect(theme.colors.heightMap[i]).toMatch(/^#[0-9a-f]{6}$/i);
				}
			});
		});
	});
});
