type EasingFunction = (value: number) => number;

export function useSharedValue<Value>(initialValue: Value): {value: Value} {
	return {value: initialValue};
}

export function useAnimatedProps(): Record<string, never> {
	return {};
}

export function useAnimatedStyle(): Record<string, never> {
	return {};
}

export function useDerivedValue<Value>(derive: () => Value): {value: Value} {
	return {value: derive()};
}

export function withTiming<Value>(value: Value): Value {
	return value;
}

export function withSpring<Value>(value: Value): Value {
	return value;
}

export function withSequence<Value>(...values: Value[]): Value {
	const value = values.at(-1);
	if (value === undefined) throw new Error('withSequence requires at least one value');
	return value;
}

export function withDelay<Value>(_delay: number, value: Value): Value {
	return value;
}

export function withRepeat<Value>(value: Value): Value {
	return value;
}

const identity: EasingFunction = (value) => value;

export const Easing = {
	linear: identity,
	ease: identity,
	quad: identity,
	cubic: identity,
	bezier: (): EasingFunction => identity,
	in: (easing: EasingFunction): EasingFunction => easing,
	out: (easing: EasingFunction): EasingFunction => easing,
	inOut: (easing: EasingFunction): EasingFunction => easing,
};

export function runOnJS<Arguments extends unknown[], ReturnValue>(
	callback: (...arguments_: Arguments) => ReturnValue,
): (...arguments_: Arguments) => ReturnValue {
	return callback;
}

export const runOnUI = runOnJS;

export function interpolate(value: number, inputRange: readonly number[], outputRange: readonly number[]): number {
	const index = inputRange.findIndex((candidate) => candidate >= value);
	const output = outputRange.at(index < 0 ? -1 : index);
	if (output === undefined) throw new Error('interpolate requires a matching output range');
	return output;
}

export const Extrapolation = {
	CLAMP: 'clamp',
	EXTEND: 'extend',
	IDENTITY: 'identity',
};

export function createAnimatedComponent<Component>(component: Component): Component {
	return component;
}

const Animated = {
	View: 'AnimatedView',
	Text: 'AnimatedText',
	Image: 'AnimatedImage',
	ScrollView: 'AnimatedScrollView',
	FlatList: 'AnimatedFlatList',
	createAnimatedComponent,
};

export default Animated;
