# Hex Zero

Hex Zero is a browser-based puzzle game where players place pieces on numbered hexagons to reduce all tile heights to zero.

## 🎮 Play the Game

**[Play Hex Zero Now!](https://motlin.github.io/hex-zero/)**

## Game Overview

in Hex Zero, players place multi-hex shapes onto a hexagonal board. Each hex on the board displays a "height" number indicating how many pieces must be placed covering that hex. When a septomino is placed, it decreases the height of all covered hexes by 1. Players win when all hexes on the board reach height 0.

## Game Mechanics and Structure

### Septomino Pieces

Septominoes are puzzle pieces containing:

-   Exactly one center hexagon
-   2 to 6 neighboring hexes directly adjacent to the center
-   Total of 3 to 7 tiles per piece
-   All tiles must be within the immediate neighborhood of the center hex (no long lines)

### Level Generation

Levels are procedurally generated to ensure solvability:

1. Start with all hexes at height 0
2. Generate a number of septomino pieces based on difficulty
3. Randomly place the generated pieces to build up heights
4. Present those exact pieces to the player to solve

### Gameplay Features

-   Players can cycle through septomino pieces and place them in any order
-   Septominoes cannot be rotated - pieces maintain fixed orientations
-   Players can request a hint, which shows where the current piece was placed during level generation
-   Undo/redo functionality
-   Restart puzzle
-   Instructions screen
-   Keyboard shortcuts
-   Victory screen with:
    -   Difficulty level
    -   Number of undos used
    -   Number of hints used
    -   Confetti

### Difficulty Levels

-   **Easy**: Radius 3 board with 4 pieces
-   **Medium**: Radius 3 board with 6 pieces (recommended)
-   **Hard**: Radius 3 board with 8 pieces
-   **Extreme**: Radius 4 board with 10 pieces
-   **Impossible**: Radius 4 board with 14 pieces
-   **Custom**: User-configurable radius (2-8) and number of pieces

## Technical Details

### Board Layout

The game board consists of a hexagonal grid arranged in a pointy-topped orientation. Each individual hex tile is drawn flat-topped.

### Controls

-   Placed pieces are removed from the cycle, but pieces are still labeled with their original piece number
-   The restart option behaves as if undo were pressed for every move, populating the redo stack

#### Desktop Controls

-   **Arrow keys**: ↑/↓ cycle pieces, ←/→ undo/redo
-   **Mouse wheel**: Cycle through remaining pieces
-   **Mouse**: Hover to preview, click to place, drag to pan
-   **Zoom**: +/- keys to zoom in/out
-   **Keyboard shortcuts**:
    -   H: Show hint
    -   R: Reset view (zoom and pan)
    -   I: Show instructions
    -   ?: Show keyboard shortcuts
-   **Buttons**: Show Hint, New Game, Restart Level

#### Mobile Controls

-   Touch: Preview piece placement and place pieces
-   **Pinch to zoom** in/out for better visibility
-   **Two-finger pan** to move around the board
-   **Bottom control bar** with: Prev, Hint, Next, Undo, Reset, Redo

#### Hover/Preview System

-   **Valid placement** (all covered hexes have height > 0):
    -   Shows preview of board state after placement
-   **Invalid placement**:
    -   Pieces can only be placed where all covered hexes have height greater than 0.

### Layout

#### Desktop Layout

-   Canvas on left side
-   Right side:
    -   "Current Piece"
    -   Piece preview
    -   Piece X of Y
    -   "Show Hint" button
    -   "New Game" button
    -   "Restart Level" button
    -   Controls preview:
        Controls:
        ↑/↓ - Cycle pieces
        ← - Undo
        → - Redo
        Click - Place piece

#### Mobile Layout

-   Canvas on top
-   Bottom control bar with:
    -   Prev, Hint, Next, Undo, Reset, Redo buttons
-   Piece preview inside canvas, instead of with controls
-   Automatic canvas centering that accounts for mobile controls

### Visual Specifications

#### Colors

| Element           | Color     | Notes          |
| ----------------- | --------- | -------------- |
| Page background   | `#1a1a2e` |                |
| Canvas background | `#0f3460` |                |
| Hex borders       | `#0f3460` | 2px width      |
| Controls panel    | `#16213e` |                |
| Buttons           | `#e94560` |                |
| Text              | `#eee`    |                |
| Solution status   | `#f39c12` | Orange, italic |

#### Hex Color Coding

| Height | Color     | Description |
| ------ | --------- | ----------- |
| 0      | `#16213e` | Dark blue   |
| 1      | `#e94560` | Pink/red    |
| 2      | `#e67e22` | Orange      |
| 3      | `#2ecc71` | Green       |
| 4      | `#3498db` | Bright blue |
| 5      | `#9b59b6` | Purple      |
| 6      | `#c0392b` | Dark red    |

#### Dimensions

-   Hex size: 30 pixels base (scales responsively)
-   Height numbers: Bold Arial font (scales with hex size), white color, only displayed for heights > 0
-   Piece preview canvas: 180×180 pixels
-   Mobile breakpoint: ≤768px width

#### Piece States

-   Available pieces: `#e94560` in preview
-   Placing a piece clears the redo stack

#### Hover/Preview System

-   **Valid placement** (all covered hexes have height > 0):
    -   Semi-transparent yellow fill: `rgba(255, 235, 59, 0.3)`
    -   Yellow outlines: `#ffeb3b` with 3px width
-   **Invalid placement**:
    -   Semi-transparent red fill: `rgba(244, 67, 54, 0.3)`
    -   Red outlines: `#f44336` with 3px width
-   **Hint display**: `#e94560` outline with 4px dashed line

### Responsive Design

-   Canvas automatically scales to fit screen while maintaining board visibility
-   Hex size adjusts based on both canvas size and board radius
-   Mobile layout optimizes for touch interaction and screen space

## Development

The game is built with TypeScript and Vite, requiring Node.js to run locally.

### Architecture

The codebase has been refactored into a modular architecture for maintainability:

-   **Game State Management** (`src/state/`):
    -   `GameState.ts`: Core game logic and state management
    -   `HexGrid.ts`: Hexagonal grid representation and coordinate system
    -   `SeptominoGenerator.ts`: Procedural piece generation
-   **Rendering** (`src/renderer/`):
    -   `HexRenderer.ts`: Coordinate conversion and rendering utilities
-   **Canvas Management** (`src/canvas/`):
    -   `CanvasManager.ts`: Canvas operations and drawing utilities
-   **UI Components** (`src/ui/`):
    -   `ColorTheme.ts`: Color constants and theming
    -   `InputValidator.ts`: Form validation logic
-   **Comprehensive test suite** with Vitest for game logic validation

### Prerequisites

This project uses [mise](https://mise.jdx.dev/) to manage development tools.

### Setup

To run the game locally:

```bash
git clone https://github.com/motlin/hex-zero.git
cd hex-zero

# Install mise if you haven't already
# See https://mise.jdx.dev/getting-started.html for installation instructions

# Install the required tools
mise install

# Install npm dependencies
npm install

# Run development server
just dev

# Run tests
just test

# Build for production
just build
```

The development server will start and provide a local URL (typically `http://localhost:5173`).

### Available Commands

-   `just dev`: Start development server
-   `just test`: Run test suite
-   `just build`: Build for production
-   `just lint`: Run ESLint
-   `just format`: Format code with Prettier
