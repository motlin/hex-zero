/**
 * Component for rendering a piece preview using Skia
 * Used for piece selection, drag preview, and placement feedback
 */

import React, {useMemo} from 'react';
import {Canvas, Path, Group} from '@shopify/react-native-skia';
import {View, StyleSheet} from 'react-native';
import type {Piece} from '../state/SeptominoGenerator';
import {hexToPixel} from '../utils/hex-calculations';
import {createHexPath} from '../utils/skia-drawing';
import {useThemeContext} from '../context/ThemeContext';
import {withAlpha} from '../ui/SkiaColorTheme';

interface PiecePreviewProps {
	piece: Piece;
	hexSize: number;
	width: number;
	height: number;
	color?: string;
	opacity?: number;
	strokeColor?: string;
	strokeWidth?: number;
	scale?: number;
	isInvalid?: boolean;
	showGhost?: boolean;
}

export const PiecePreview: React.FC<PiecePreviewProps> = ({
	piece,
	hexSize,
	width,
	height,
	color,
	opacity = 1,
	strokeColor,
	strokeWidth = 2,
	scale = 1,
	isInvalid = false,
	showGhost = false,
}) => {
	const {theme} = useThemeContext();

	// Calculate bounds to center the piece
	const {paths, bounds} = useMemo(() => {
		const pieceHexSize = hexSize * scale;
		let minX = Infinity;
		let maxX = -Infinity;
		let minY = Infinity;
		let maxY = -Infinity;

		// Convert piece tiles to pixel positions and calculate bounds
		const positions = piece.tiles.map((tile) => {
			const relQ = tile.q - piece.center.q;
			const relR = tile.r - piece.center.r;
			const pos = hexToPixel(relQ, relR, pieceHexSize);

			const corners = [
				{x: pos.x - pieceHexSize, y: pos.y - pieceHexSize * 0.866},
				{x: pos.x + pieceHexSize, y: pos.y - pieceHexSize * 0.866},
				{x: pos.x + pieceHexSize, y: pos.y + pieceHexSize * 0.866},
				{x: pos.x - pieceHexSize, y: pos.y + pieceHexSize * 0.866},
			];

			corners.forEach((corner) => {
				minX = Math.min(minX, corner.x);
				maxX = Math.max(maxX, corner.x);
				minY = Math.min(minY, corner.y);
				maxY = Math.max(maxY, corner.y);
			});

			return pos;
		});

		// Create hex paths
		const hexPaths = positions.map((pos) => createHexPath(pos.x, pos.y, pieceHexSize));

		return {
			paths: hexPaths,
			bounds: {
				width: maxX - minX,
				height: maxY - minY,
				centerX: (minX + maxX) / 2,
				centerY: (minY + maxY) / 2,
			},
		};
	}, [piece, hexSize, scale]);

	// Calculate translation to center the piece
	const translateX = width / 2 - bounds.centerX;
	const translateY = height / 2 - bounds.centerY;

	// Determine colors based on state
	const fillColor = useMemo(() => {
		if (color) return withAlpha(color, opacity);
		if (isInvalid) return withAlpha(theme.colors.invalidFill, opacity);
		return withAlpha(theme.colors.previewFill, opacity);
	}, [color, isInvalid, theme, opacity]);

	const borderColor = strokeColor || theme.colors.gridLines;

	return (
		<View style={[styles.container, {width, height}]}>
			<Canvas style={styles.canvas}>
				<Group transform={[{translateX}, {translateY}]}>
					{showGhost && (
						<Group>
							{paths.map((path, index) => (
								<Path
									key={`ghost-${index}`}
									path={path}
									color={withAlpha(theme.colors.hintFill, 0.2)}
									style="fill"
								/>
							))}
						</Group>
					)}
					{paths.map((path, index) => (
						<React.Fragment key={index}>
							<Path
								path={path}
								color={fillColor}
								style="fill"
							/>
							<Path
								path={path}
								color={borderColor}
								style="stroke"
								strokeWidth={strokeWidth}
							/>
						</React.Fragment>
					))}
				</Group>
			</Canvas>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: 'transparent',
	},
	canvas: {
		flex: 1,
		backgroundColor: 'transparent',
	},
});
