# Skia-based Hex Renderer

This directory contains the React Native Skia implementation of the hex grid renderer, replacing the HTML Canvas-based renderer.

## Components

### SkiaHexRenderer

The main React component that renders a hexagonal grid using React Native Skia.

Features:

-   🔷 Hexagonal grid rendering with height values
-   📐 Coordinate conversion (hex to pixel, pixel to hex)
-   👆 Piece preview on hover/touch
-   ✅ Valid/invalid placement indicators
-   💡 Hint system with dashed outlines
-   💥 Smooth burst animations when placing pieces
-   🔍 Pan and zoom support
-   🎨 Light and dark theme support

### SkiaHexRendererCompat

A compatibility class that provides the same interface as the original HexRenderer for easier migration.

## Usage

```tsx
import {SkiaHexRenderer} from './renderer/SkiaHexRenderer';

<Canvas style={{flex: 1}}>
	<SkiaHexRenderer
		grid={hexGrid}
		hexSize={30}
		offsetX={100}
		offsetY={100}
		scale={1.0}
		theme="dark"
		showCoordinates={true}
		hoveredHex={{q: 1, r: 0}}
		selectedPiece={currentPiece}
		hintCells={[{q: 0, r: 1}]}
		invalidPlacementCells={[]}
		animatingCells={[]}
		onAnimationComplete={() => {}}
	/>
</Canvas>;
```

## Key Improvements

1. **Native Performance**: Uses GPU-accelerated Skia rendering
2. **Device Pixel Ratio**: Automatically handles different screen densities
3. **Declarative API**: React-style props instead of imperative methods
4. **Memoization**: Efficient path caching for better performance
5. **Smooth Animations**: Native animations using Skia's animation system

## Migration from Canvas Renderer

The `SkiaHexRendererCompat` class provides a migration path:

```tsx
const renderer = new SkiaHexRendererCompat(grid, hexSize);
renderer.setOffset(x, y);
renderer.setScale(zoom);
renderer.pixelToHex(touchX, touchY);
```
