/**
 * Basic hex grid component demonstrating core rendering features
 */

import React from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import {Canvas} from '@shopify/react-native-skia';
import {SkiaHexRenderer} from '../renderer/SkiaHexRenderer';
import {HexGrid} from '../state/HexGrid';
import type {ThemeType} from '../ui/SkiaColorTheme';

interface BasicHexGridProps {
	radius?: number;
	hexSize?: number;
	theme?: ThemeType;
}

export const BasicHexGrid: React.FC<BasicHexGridProps> = ({radius = 4, hexSize = 30, theme = 'dark'}) => {
	const grid = React.useMemo(() => {
		const newGrid = new HexGrid(radius);
		// Create a gradient pattern
		newGrid.forEachHex((q, r) => {
			const distance = (Math.abs(q) + Math.abs(q + r) + Math.abs(r)) / 2;
			const height = Math.max(0, Math.min(10, 10 - Math.floor(distance)));
			const hex = newGrid.getHex(q, r);
			if (hex) {
				hex.height = height;
			}
		});
		return newGrid;
	}, [radius]);

	const {width, height} = Dimensions.get('window');
	const centerX = width / 2;
	const centerY = height / 2 - 100;

	return (
		<View style={styles.container}>
			<Canvas style={styles.canvas}>
				<SkiaHexRenderer
					grid={grid}
					hexSize={hexSize}
					offsetX={centerX}
					offsetY={centerY}
					scale={1}
					theme={theme}
				/>
			</Canvas>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	canvas: {
		flex: 1,
	},
});
