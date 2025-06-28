/**
 * Animated hex cell component using React Native Reanimated
 * Provides smooth animations for height changes and burst effects
 */

import React, {useEffect} from 'react';
import {Path, Circle, Text, Group} from '@shopify/react-native-skia';
import Animated, {
	useSharedValue,
	useAnimatedProps,
	withTiming,
	withSpring,
	withSequence,
	Easing,
	runOnJS,
	interpolate,
} from 'react-native-reanimated';
import type {SkPath, SkFont} from '@shopify/react-native-skia';
import {getHeightColorFromTheme, getContrastColor, type SkiaTheme} from '../ui/SkiaColorTheme';
import {HexBurstParticles} from './HexBurstParticles';

// Create animated Skia components
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedText = Animated.createAnimatedComponent(Text);

interface AnimatedHexCellProps {
	path: SkPath;
	centerX: number;
	centerY: number;
	hexSize: number;
	startHeight: number;
	endHeight: number;
	theme: SkiaTheme;
	gridLineColor: string;
	font?: SkFont | null;
	fontSize: number;
	animationDuration?: number;
	onAnimationComplete?: () => void;
}

export const AnimatedHexCell: React.FC<AnimatedHexCellProps> = ({
	path,
	centerX,
	centerY,
	hexSize,
	startHeight,
	endHeight,
	theme,
	gridLineColor,
	font,
	fontSize,
	animationDuration = 500,
	onAnimationComplete,
}) => {
	// Shared values for animations
	const heightProgress = useSharedValue(0);
	const burstProgress = useSharedValue(0);
	const textOpacity = useSharedValue(1);
	const hexScale = useSharedValue(1);

	useEffect(() => {
		// Start animations when component mounts
		heightProgress.value = withTiming(1, {
			duration: animationDuration,
			easing: Easing.bezier(0.25, 0.1, 0.25, 1),
		});

		// Hex scale animation - slight shrink then back to normal
		hexScale.value = withSequence(
			withTiming(0.95, {duration: 100, easing: Easing.out(Easing.quad)}),
			withSpring(1, {
				damping: 12,
				stiffness: 180,
				mass: 0.8,
			}),
		);

		// Burst animation - expand and fade
		burstProgress.value = withTiming(
			1,
			{
				duration: animationDuration * 1.2,
				easing: Easing.out(Easing.cubic),
			},
			(finished) => {
				if (finished && onAnimationComplete) {
					runOnJS(onAnimationComplete)();
				}
			},
		);

		// Text fade animation when height reaches 0
		if (endHeight === 0) {
			textOpacity.value = withTiming(0, {
				duration: animationDuration * 0.6,
				easing: Easing.in(Easing.quad),
			});
		}
	}, []);

	// Animated props for hex fill color
	const animatedHexProps = useAnimatedProps(() => {
		const currentHeight = interpolate(heightProgress.value, [0, 1], [startHeight, endHeight]);

		return {
			color: getHeightColorFromTheme(currentHeight, theme),
			transform: [{scale: hexScale.value}],
		};
	});

	// Animated props for burst circle
	const animatedBurstProps = useAnimatedProps(() => {
		// Multi-stage burst animation
		const burstRadius = interpolate(
			burstProgress.value,
			[0, 0.3, 0.6, 1],
			[0, hexSize * 2.5, hexSize * 3, hexSize * 3.5],
		);

		const burstOpacity = interpolate(burstProgress.value, [0, 0.1, 0.5, 1], [0, 0.8, 0.3, 0]);

		return {
			r: burstRadius,
			opacity: burstOpacity,
		};
	});

	// Animated props for secondary burst (inner ring)
	const animatedInnerBurstProps = useAnimatedProps(() => {
		const innerBurstRadius = interpolate(
			burstProgress.value,
			[0, 0.2, 0.5, 1],
			[0, hexSize * 1.5, hexSize * 2, hexSize * 2.5],
		);

		const innerBurstOpacity = interpolate(burstProgress.value, [0, 0.05, 0.4, 1], [0, 0.6, 0.2, 0]);

		return {
			r: innerBurstRadius,
			opacity: innerBurstOpacity,
		};
	});

	// Animated props for text
	const animatedTextProps = useAnimatedProps(() => {
		const currentHeight = interpolate(heightProgress.value, [0, 1], [startHeight, endHeight]);

		return {
			text: Math.round(currentHeight).toString(),
			opacity: textOpacity.value * 0.9,
		};
	});

	return (
		<Group>
			{/* Animated hex fill */}
			<AnimatedPath
				path={path}
				style="fill"
				animatedProps={animatedHexProps}
			/>

			{/* Static hex border */}
			<Path
				path={path}
				color={gridLineColor}
				style="stroke"
				strokeWidth={2}
			/>

			{/* Animated height text */}
			{font && endHeight > 0 && (
				<AnimatedText
					x={centerX}
					y={centerY + fontSize / 3}
					font={font}
					text={Math.round(endHeight).toString()}
					color={getContrastColor(getHeightColorFromTheme(endHeight, theme))}
					animatedProps={animatedTextProps}
				/>
			)}

			{/* Burst animations */}
			<AnimatedCircle
				r={hexSize}
				color={theme.colors.burstColor}
				style="stroke"
				strokeWidth={4}
				animatedProps={animatedBurstProps}
				transform={[{translateX: centerX}, {translateY: centerY}]}
			/>

			<AnimatedCircle
				r={hexSize}
				color={theme.colors.burstColor}
				style="stroke"
				strokeWidth={2}
				animatedProps={animatedInnerBurstProps}
				transform={[{translateX: centerX}, {translateY: centerY}]}
			/>

			{/* Particle effects for extra polish */}
			<HexBurstParticles
				centerX={centerX}
				centerY={centerY}
				hexSize={hexSize}
				particleColor={theme.colors.burstColor}
				particleCount={8}
				animationDuration={animationDuration * 1.2}
			/>
		</Group>
	);
};

/**
 * Staggered animation controller for multiple hex cells
 */
export const createStaggeredAnimation = (
	cells: Array<{q: number; r: number}>,
	centerHex: {q: number; r: number},
	staggerDelay: number = 50,
): Array<{cell: {q: number; r: number}; delay: number}> => {
	// Calculate distance from center for each cell
	const cellsWithDistance = cells.map((cell) => {
		const distance = Math.sqrt(Math.pow(cell.q - centerHex.q, 2) + Math.pow(cell.r - centerHex.r, 2));
		return {cell, distance};
	});

	// Sort by distance for ripple effect
	cellsWithDistance.sort((a, b) => a.distance - b.distance);

	// Get unique distances to calculate delay tiers
	const uniqueDistances = [...new Set(cellsWithDistance.map((item) => item.distance))].sort((a, b) => a - b);

	// Assign delays based on distance tier (cells at same distance get same delay)
	return cellsWithDistance.map((item) => ({
		cell: item.cell,
		delay: uniqueDistances.indexOf(item.distance) * staggerDelay,
	}));
};
