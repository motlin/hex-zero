# Components

This directory contains reusable React Native components for the Hex Zero game.

## Component Types

-   **UI Components**: Basic UI elements like buttons, cards, and overlays
-   **Game Components**: Game-specific components like hex tiles, piece displays, and game board
-   **Animation Components**: Components handling animations and transitions
-   **Layout Components**: Components for structuring the app layout

## Key Components

### GameBoard

The `GameBoard` component is the main game board that integrates with the game state and provides a complete game board experience.

**Features:**

-   🎮 Integrates with GameStateContext for state management
-   📱 Responsive canvas sizing
-   🔍 Scrollable and zoomable hex grid
-   💡 Hint system integration
-   🎯 Piece placement with validation
-   🎨 Theme support (light/dark)

**Usage:**

```tsx
<GameBoard showHints={true} onBoardReady={() => console.log('Board ready')} />
```

### HexGameBoard

The underlying hex board renderer with touch interactions.

**Features:**

-   👆 Touch interactions (tap, pan, pinch-to-zoom)
-   🎨 Skia-based rendering for performance
-   💫 Smooth animations for piece placement
-   📐 Coordinate conversion between screen and hex space
-   🔲 Invalid placement feedback

### PieceSelectionPanel

Bottom panel for selecting and dragging pieces.

**Features:**

-   📜 Horizontal scrolling piece list
-   📄 Page-based navigation with swipe gestures
-   🎯 Drag-and-drop support
-   ✅ Shows placed piece states
-   🔄 Auto-advance to next page when current pieces are placed
-   📍 Page indicators for multi-page navigation
-   👆 Swipe left/right to navigate between pages

### PiecePreview

Renders individual game pieces using Skia.

**Features:**

-   🎨 Skia-based piece rendering
-   📏 Automatic bounds calculation
-   🎯 Valid/invalid state visualization
-   👻 Ghost piece preview support

## Naming Convention

-   Use PascalCase for component files (e.g., `GameBoard.tsx`)
-   Export components as named exports
-   Keep component files focused and single-purpose
