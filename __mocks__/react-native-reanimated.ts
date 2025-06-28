import {vi} from 'vitest';

export const useSharedValue = vi.fn((initialValue) => ({
	value: initialValue,
}));

export const useAnimatedProps = vi.fn(() => ({}));
export const useAnimatedStyle = vi.fn(() => ({}));
export const useDerivedValue = vi.fn((fn) => ({value: fn()}));

export const withTiming = vi.fn((value) => value);
export const withSpring = vi.fn((value) => value);
export const withSequence = vi.fn((...values) => values[values.length - 1]);
export const withDelay = vi.fn((_, value) => value);
export const withRepeat = vi.fn((value) => value);

export const Easing = {
	linear: vi.fn((t) => t),
	ease: vi.fn((t) => t),
	quad: vi.fn((t) => t),
	cubic: vi.fn((t) => t),
	bezier: vi.fn(() => (t: number) => t),
	in: vi.fn((fn) => fn),
	out: vi.fn((fn) => fn),
	inOut: vi.fn((fn) => fn),
};

export const runOnJS = vi.fn((fn) => fn);
export const runOnUI = vi.fn((fn) => fn);

export const interpolate = vi.fn((value, inputRange, outputRange) => {
	const idx = inputRange.findIndex((v: number) => v >= value);
	if (idx === -1) return outputRange[outputRange.length - 1];
	if (idx === 0) return outputRange[0];
	return outputRange[idx];
});

export const Extrapolation = {
	CLAMP: 'clamp',
	EXTEND: 'extend',
	IDENTITY: 'identity',
};

export const createAnimatedComponent = vi.fn((component) => component);

const Animated = {
	View: 'AnimatedView',
	Text: 'AnimatedText',
	Image: 'AnimatedImage',
	ScrollView: 'AnimatedScrollView',
	FlatList: 'AnimatedFlatList',
	createAnimatedComponent,
};

export default Animated;
