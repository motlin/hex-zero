/**
 * Particle effects for hex burst animations
 * Creates small particles that fly out when a piece is placed
 */

import React, {useEffect} from 'react';
import {Circle, Group} from '@shopify/react-native-skia';
import Animated, {
	useSharedValue,
	useAnimatedProps,
	withTiming,
	withDelay,
	Easing,
	interpolate,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Particle {
	id: number;
	angle: number;
	speed: number;
	size: number;
	delay: number;
}

interface HexBurstParticlesProps {
	centerX: number;
	centerY: number;
	hexSize: number;
	particleColor: string;
	particleCount?: number;
	animationDuration?: number;
}

const ParticleComponent: React.FC<{
	particle: Particle;
	centerX: number;
	centerY: number;
	hexSize: number;
	color: string;
	duration: number;
}> = ({particle, centerX, centerY, hexSize, color, duration}) => {
	const progress = useSharedValue(0);

	useEffect(() => {
		progress.value = withDelay(
			particle.delay,
			withTiming(1, {
				duration: duration,
				easing: Easing.out(Easing.cubic),
			}),
		);
	}, []);

	const animatedProps = useAnimatedProps(() => {
		// Calculate particle position based on progress
		const distance = interpolate(
			progress.value,
			[0, 0.6, 1],
			[0, hexSize * particle.speed * 1.5, hexSize * particle.speed * 2],
		);

		const x = centerX + Math.cos(particle.angle) * distance;
		const y = centerY + Math.sin(particle.angle) * distance;

		// Fade out and shrink
		const opacity = interpolate(progress.value, [0, 0.1, 0.7, 1], [0, 0.8, 0.4, 0]);

		const radius = interpolate(
			progress.value,
			[0, 0.3, 1],
			[particle.size, particle.size * 1.2, particle.size * 0.3],
		);

		return {
			cx: x,
			cy: y,
			r: radius,
			opacity: opacity,
		};
	});

	return (
		<AnimatedCircle
			r={2}
			color={color}
			style="fill"
			animatedProps={animatedProps}
		/>
	);
};

export const HexBurstParticles: React.FC<HexBurstParticlesProps> = ({
	centerX,
	centerY,
	hexSize,
	particleColor,
	particleCount = 12,
	animationDuration = 600,
}) => {
	// Generate particles with random properties
	const particles: Particle[] = React.useMemo(() => {
		return Array.from({length: particleCount}, (_, i) => ({
			id: i,
			angle: (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5,
			speed: 0.8 + Math.random() * 0.4,
			size: hexSize * 0.06 + Math.random() * hexSize * 0.04,
			delay: Math.random() * 100,
		}));
	}, [particleCount, hexSize]);

	return (
		<Group>
			{particles.map((particle) => (
				<ParticleComponent
					key={particle.id}
					particle={particle}
					centerX={centerX}
					centerY={centerY}
					hexSize={hexSize}
					color={particleColor}
					duration={animationDuration}
				/>
			))}
		</Group>
	);
};
