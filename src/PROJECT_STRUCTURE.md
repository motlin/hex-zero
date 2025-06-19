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

The project uses two TypeScript configurations:

1. `tsconfig.json` - Base configuration for web development
    - Excludes React Native files (\*.tsx in components/screens/hooks)
    - Uses ES2020 target with DOM libraries

2. `tsconfig.rn.json` - React Native specific configuration
    - Extends base config
    - Adds JSX support for React Native
    - Includes only React Native relevant files
    - Excludes web-specific files and test files

## Development Workflow

- Web development: Uses Vite and the base tsconfig.json
- React Native development: Uses Expo and tsconfig.rn.json
- Both configurations can coexist without conflicts
- Run `npm run ci:typecheck` for web type checking
- Run `npm run ci:typecheck:rn` for React Native type checking
