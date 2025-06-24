# Hex Zero React Native Project Structure

This document explains the adapted project structure for the React Native port of Hex Zero.

## Directory Structure

### Core Game Logic (Platform-Independent)

- `/src/state/` - Pure TypeScript game state management
    - `GameState.ts` - Main game state and logic
    - `HexGrid.ts` - Hexagonal grid data structure
    - `SeptominoGenerator.ts` - Piece generation logic

### React Native Specific

- `/src/components/` - Reusable React Native components
    - UI components (buttons, overlays, etc.)
    - Game components (hex tiles, pieces, etc.)
    - Animation components

- `/src/screens/` - Full-screen views/pages
    - Game screens
    - Menu screens
    - Settings and help screens

- `/src/hooks/` - Custom React hooks
    - Game state hooks
    - Animation hooks
    - Storage hooks

### Shared Resources

- `/src/ui/ColorTheme.ts` - Color theme definitions (used by both web and RN)

### Web-Only (Excluded from React Native)

- `/src/canvas/` - HTML Canvas specific code
- `/src/renderer/` - Canvas rendering logic
- `/src/hex-zero.ts` - Web entry point
- `/src/canvas-utils.ts` - Canvas utility functions

## TypeScript Configuration

The project uses a unified TypeScript configuration:

- `tsconfig.json` - Unified configuration for React Native development
    - Extends expo/tsconfig.base for React Native compatibility
    - Includes all React Native source files
    - Excludes web-specific files (canvas/, renderer/, hex-zero.ts)
    - Excludes test files to keep the build focused

## Development Workflow

- React Native development: Uses Expo and the unified tsconfig.json
- Run `npm run ci:typecheck` for type checking
- Web-specific files are excluded from the React Native build
