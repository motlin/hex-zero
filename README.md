# Hex Flip

Hex Flip is a browser-based hexagonal puzzle game where players place septomino pieces to reduce all board tiles to zero.

## 🎮 Play the Game

**[Play Hex Flip Now!](https://YOUR_USERNAME.github.io/hex-flip/)**

## Game Overview

in Hex Flip, players place multi-hex shapes onto a hexagonal board. Each hex on the board displays a height number indicating how many pieces must be placed covering it. When a septomino is placed, it decreases the height of all covered hexes by 1. Pieces can only be placed where all covered hexes have height greater than 0. Players win when all hexes on the board reach height 0.

## Game Mechanics and Structure

### Board Layout

The game board consists of a hexagonal grid with configurable radius, arranged in a pointy-topped orientation. Each individual hex tile is drawn flat-topped.

### Septomino Pieces

Septominoes are puzzle pieces containing:

-   Exactly one center hexagon
-   2 to 6 neighboring hexes directly adjacent to the center
-   Total of 3 to 7 tiles per piece
-   All tiles must be within the immediate neighborhood of the center hex (no long lines)

### Difficulty Levels

The game offers four difficulty settings:

-   **Easy**: Radius 3 board with 6 pieces
-   **Medium**: Radius 4 board with 8 pieces (default)
-   **Hard**: Radius 4 board with 12 pieces
-   **Custom**: User-configurable radius (2-8) and number of pieces

### Level Generation

Levels are procedurally generated to ensure solvability:

1. Start with all hexes at height 0
2. Randomly place the generated pieces to build up heights (maximum height: 6)
3. Present those exact pieces to the player to solve

### Gameplay Features

-   Players can cycle through all pieces and place them in any order
-   Placed pieces are removed from the cycle, but pieces are still labeled with their original piece number
-   No rotation - pieces maintain fixed orientations
-   Hint system shows placement of the current piece
-   Undo/redo functionality
-   Restart option
-   Victory screen with difficulty acknowledgment upon completion

## Technical Implementation Details

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

#### Height Color Coding

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

### Interactive Elements

#### Hover/Preview System

-   **Valid placement** (all covered hexes have height > 0):
    -   Shows preview of board state after placement
    -   Semi-transparent yellow fill: `rgba(255, 235, 59, 0.3)`
    -   Yellow outlines: `#ffeb3b` with 3px width
-   **Invalid placement**:
    -   Semi-transparent red fill: `rgba(244, 67, 54, 0.3)`
    -   Red outlines: `#f44336` with 3px width
-   **Hint display**: `#e94560` outline with 4px dashed line

#### Controls

**Desktop:**

-   ↑/↓ arrows: Cycle through remaining pieces
-   ← arrow: Undo
-   → arrow: Redo
-   Mouse hover: Preview piece placement
-   Mouse click: Place piece
-   Buttons: Hint, New Game, Restart Level

**Mobile:**

-   Touch and drag: Preview piece placement
-   Release touch: Place piece (if valid)
-   Bottom control bar: Prev, Next, Undo, Redo, Hint, New
-   Side controls hidden for maximum game visibility

#### Piece States

-   Available pieces: `#e94560` in preview
-   Placed pieces: `#666` (gray) with "Already Placed" text
-   Placing a piece clears the redo stack

### Responsive Design

-   Canvas automatically scales to fit screen while maintaining board visibility
-   Hex size adjusts based on both canvas size and board radius
-   Mobile layout optimizes for touch interaction and screen space

## Development

The game is built with TypeScript and Vite, requiring Node.js to run locally.

To run the game locally:

```bash
git clone https://github.com/motlin/hex-flip.git
cd hex-flip
npm install

# Run development server
npm run dev
# OR if you have just installed:
just dev
```

The development server will start and provide a local URL (typically `http://localhost:5173`).

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
