import {describe, it, expect, beforeEach} from 'vitest';
import {GameState} from './game-state';

describe('GameState', () => {
	let gameState: GameState;

	beforeEach(() => {
		gameState = new GameState(3, 4);
	});

	describe('initialization', () => {
		it('creates game with correct settings', () => {
			const settings = gameState.getSettings();
			expect(settings.radius).toBe(3);
			expect(settings.numPieces).toBe(4);
		});

		it('generates correct number of pieces', () => {
			const pieces = gameState.getPieces();
			expect(pieces).toHaveLength(4);
		});

		it('starts with piece 0 selected', () => {
			expect(gameState.getCurrentPieceIndex()).toBe(0);
		});

		it('starts with no pieces placed', () => {
			const placedPieces = gameState.getPlacedPieces();
			expect(placedPieces.size).toBe(0);
		});

		it('starts with empty move history', () => {
			expect(gameState.getHistory()).toHaveLength(0);
			expect(gameState.getUndoCount()).toBe(0);
			expect(gameState.getMoveCount()).toBe(0);
		});

		it('starts with no undo/redo available', () => {
			expect(gameState.canUndo()).toBe(false);
			expect(gameState.canRedo()).toBe(false);
		});

		it('creates hex grid with correct number of hexes', () => {
			const grid = gameState.getGrid();
			// For radius 3: hexes in a hexagonal pattern centered at origin
			// Count: center (1) + ring 1 (6) + ring 2 (12) + ring 3 (18) = 37
			const expectedHexCount = 37;
			expect(grid.hexes.size).toBe(expectedHexCount);
		});

		it('initializes grid with some positive heights', () => {
			const grid = gameState.getGrid();
			const hasPositiveHeight = Array.from(grid.hexes.values()).some((hex) => hex.height > 0);
			expect(hasPositiveHeight).toBe(true);
		});
	});

	describe('piece placement', () => {
		it('allows placing piece at valid position', () => {
			const grid = gameState.getGrid();
			const piece = gameState.getCurrentPiece();

			// Find a position where the entire piece can be placed
			const positions = Array.from(grid.hexes.values());
			const validPosition = positions.find((pos) => gameState.canPlacePiece(piece, pos.q, pos.r));
			expect(validPosition).toBeDefined();

			const canPlace = gameState.canPlacePiece(piece, validPosition!.q, validPosition!.r);
			expect(canPlace).toBe(true);

			const placed = gameState.placePiece(validPosition!.q, validPosition!.r);
			expect(placed).toBe(true);
		});

		it('prevents placing piece at invalid position', () => {
			const grid = gameState.getGrid();
			const emptyHex = Array.from(grid.hexes.values()).find((hex) => hex.height === 0);
			expect(emptyHex).toBeDefined();

			const piece = gameState.getCurrentPiece();
			const canPlace = gameState.canPlacePiece(piece, emptyHex!.q, emptyHex!.r);
			expect(canPlace).toBe(false);

			const placed = gameState.placePiece(emptyHex!.q, emptyHex!.r);
			expect(placed).toBe(false);
		});

		it('prevents placing same piece twice', () => {
			const grid = gameState.getGrid();
			const piece = gameState.getCurrentPiece();
			const originalIndex = gameState.getCurrentPieceIndex();

			// Find a position where the entire piece can be placed
			const positions = Array.from(grid.hexes.values());
			const validPosition = positions.find((pos) => gameState.canPlacePiece(piece, pos.q, pos.r));
			expect(validPosition).toBeDefined();

			// Place the piece
			gameState.placePiece(validPosition!.q, validPosition!.r);
			expect(gameState.isPiecePlaced(originalIndex)).toBe(true);

			// Set current piece back to the placed piece and try to place it again
			gameState['currentPieceIndex'] = originalIndex;
			const secondPlacement = gameState.placePiece(validPosition!.q, validPosition!.r);
			expect(secondPlacement).toBe(false);
		});

		it('updates move history when placing piece', () => {
			const grid = gameState.getGrid();
			const piece = gameState.getCurrentPiece();

			// Find a position where the entire piece can be placed
			const positions = Array.from(grid.hexes.values());
			const validPosition = positions.find((pos) => gameState.canPlacePiece(piece, pos.q, pos.r));
			expect(validPosition).toBeDefined();

			const initialMoveCount = gameState.getMoveCount();
			gameState.placePiece(validPosition!.q, validPosition!.r);
			expect(gameState.getMoveCount()).toBe(initialMoveCount + 1);
			expect(gameState.canUndo()).toBe(true);
		});

		it('advances to next unplaced piece after placement', () => {
			const initialPieceIndex = gameState.getCurrentPieceIndex();
			const grid = gameState.getGrid();
			const piece = gameState.getCurrentPiece();

			// Find a position where the entire piece can be placed
			const positions = Array.from(grid.hexes.values());
			const validPosition = positions.find((pos) => gameState.canPlacePiece(piece, pos.q, pos.r));
			expect(validPosition).toBeDefined();

			gameState.placePiece(validPosition!.q, validPosition!.r);
			const newPieceIndex = gameState.getCurrentPieceIndex();

			expect(newPieceIndex).not.toBe(initialPieceIndex);
			expect(gameState.isPiecePlaced(newPieceIndex)).toBe(false);
		});

		it('reduces hex heights when placing piece', () => {
			const grid = gameState.getGrid();
			const piece = gameState.getCurrentPiece();

			// Find a position where the entire piece can be placed
			const positions = Array.from(grid.hexes.values());
			const validPosition = positions.find((pos) => gameState.canPlacePiece(piece, pos.q, pos.r));
			expect(validPosition).toBeDefined();

			// Get the hex that will be affected by the first tile of the piece
			const affectedHex = grid.getHex(validPosition!.q + piece.tiles[0].q, validPosition!.r + piece.tiles[0].r);
			const initialHeight = affectedHex!.height;

			gameState.placePiece(validPosition!.q, validPosition!.r);

			expect(affectedHex!.height).toBe(initialHeight - 1);
		});
	});

	describe('piece cycling', () => {
		it('cycles to next unplaced piece', () => {
			const initialPieceIndex = gameState.getCurrentPieceIndex();
			const cycled = gameState.cyclePiece(1);

			expect(cycled).toBe(true);
			expect(gameState.getCurrentPieceIndex()).not.toBe(initialPieceIndex);
		});

		it('cycles to previous unplaced piece', () => {
			const initialPieceIndex = gameState.getCurrentPieceIndex();
			const cycled = gameState.cyclePiece(-1);

			expect(cycled).toBe(true);
			expect(gameState.getCurrentPieceIndex()).not.toBe(initialPieceIndex);
		});

		it('skips placed pieces when cycling', () => {
			const grid = gameState.getGrid();
			const piece = gameState.getCurrentPiece();
			const placedPieceIndex = gameState.getCurrentPieceIndex();

			// Find a position where the entire piece can be placed
			const positions = Array.from(grid.hexes.values());
			const validPosition = positions.find((pos) => gameState.canPlacePiece(piece, pos.q, pos.r));
			expect(validPosition).toBeDefined();

			gameState.placePiece(validPosition!.q, validPosition!.r);

			gameState.cyclePiece(1);
			expect(gameState.getCurrentPieceIndex()).not.toBe(placedPieceIndex);
		});

		it('returns false when all pieces are placed', () => {
			const grid = gameState.getGrid();
			const pieces = gameState.getPieces();

			// Place as many pieces as possible
			let placedCount = 0;
			pieces.forEach(() => {
				const positions = Array.from(grid.hexes.values());
				const validPosition = positions.find((pos) =>
					gameState.canPlacePiece(gameState.getCurrentPiece(), pos.q, pos.r),
				);
				if (validPosition) {
					gameState.placePiece(validPosition.q, validPosition.r);
					placedCount++;
				}
			});

			// If we placed all pieces, cycling should return false
			// If we couldn't place all pieces but some are still unplaced, cycling should work
			const cycled = gameState.cyclePiece(1);
			if (placedCount === pieces.length) {
				expect(cycled).toBe(false);
			} else {
				// If there are unplaced pieces available, cycling should work
				const unplacedCount = pieces.length - placedCount;
				if (unplacedCount > 1) {
					expect(cycled).toBe(true);
				} else {
					// If only one piece remains unplaced, cycling returns false
					expect(cycled).toBe(false);
				}
			}
		});
	});

	describe('undo/redo', () => {
		it('undoes piece placement', () => {
			const grid = gameState.getGrid();
			const piece = gameState.getCurrentPiece();
			const initialPieceIndex = gameState.getCurrentPieceIndex();

			// Find a position where the entire piece can be placed
			const positions = Array.from(grid.hexes.values());
			const validPosition = positions.find((pos) => gameState.canPlacePiece(piece, pos.q, pos.r));
			expect(validPosition).toBeDefined();

			// Get the hex that will be affected by the first tile of the piece
			const affectedHex = grid.getHex(validPosition!.q + piece.tiles[0].q, validPosition!.r + piece.tiles[0].r);
			const initialHeight = affectedHex!.height;

			gameState.placePiece(validPosition!.q, validPosition!.r);
			expect(affectedHex!.height).toBe(initialHeight - 1);
			expect(gameState.isPiecePlaced(initialPieceIndex)).toBe(true);

			const undone = gameState.undo();
			expect(undone).toBe(true);
			expect(affectedHex!.height).toBe(initialHeight);
			expect(gameState.isPiecePlaced(initialPieceIndex)).toBe(false);
			expect(gameState.getCurrentPieceIndex()).toBe(initialPieceIndex);
		});

		it('redoes undone placement', () => {
			const grid = gameState.getGrid();
			const piece = gameState.getCurrentPiece();

			// Find a position where the entire piece can be placed
			const positions = Array.from(grid.hexes.values());
			const validPosition = positions.find((pos) => gameState.canPlacePiece(piece, pos.q, pos.r));
			expect(validPosition).toBeDefined();

			// Get the hex that will be affected by the first tile of the piece
			const affectedHex = grid.getHex(validPosition!.q + piece.tiles[0].q, validPosition!.r + piece.tiles[0].r);
			const initialHeight = affectedHex!.height;

			gameState.placePiece(validPosition!.q, validPosition!.r);
			gameState.undo();

			const redone = gameState.redo();
			expect(redone).toBe(true);
			expect(affectedHex!.height).toBe(initialHeight - 1);
		});

		it('clears redo stack when making new move', () => {
			const grid = gameState.getGrid();
			const positions = Array.from(grid.hexes.values());

			// Place first piece
			const firstPiece = gameState.getCurrentPiece();
			const firstValidPosition = positions.find((pos) => gameState.canPlacePiece(firstPiece, pos.q, pos.r));
			expect(firstValidPosition).toBeDefined();

			gameState.placePiece(firstValidPosition!.q, firstValidPosition!.r);
			gameState.undo();
			expect(gameState.canRedo()).toBe(true);

			// Place a different piece
			const secondPiece = gameState.getCurrentPiece();
			const secondValidPosition = positions.find((pos) => gameState.canPlacePiece(secondPiece, pos.q, pos.r));
			if (secondValidPosition) {
				gameState.placePiece(secondValidPosition.q, secondValidPosition.r);
				expect(gameState.canRedo()).toBe(false);
			}
		});

		it('increments undo count', () => {
			const grid = gameState.getGrid();
			const piece = gameState.getCurrentPiece();

			// Find a position where the entire piece can be placed
			const positions = Array.from(grid.hexes.values());
			const validPosition = positions.find((pos) => gameState.canPlacePiece(piece, pos.q, pos.r));
			expect(validPosition).toBeDefined();

			gameState.placePiece(validPosition!.q, validPosition!.r);
			const initialUndoCount = gameState.getUndoCount();

			gameState.undo();
			expect(gameState.getUndoCount()).toBe(initialUndoCount + 1);
		});

		it('returns false when no moves to undo', () => {
			const undone = gameState.undo();
			expect(undone).toBe(false);
		});

		it('returns false when no moves to redo', () => {
			const redone = gameState.redo();
			expect(redone).toBe(false);
		});
	});

	describe('win condition', () => {
		it('detects game not won initially', () => {
			expect(gameState.isGameWon()).toBe(false);
		});

		it('detects game won when all heights are zero', () => {
			const grid = gameState.getGrid();
			grid.hexes.forEach((hex) => {
				hex.height = 0;
			});

			expect(gameState.isGameWon()).toBe(true);
		});
	});

	describe('hints', () => {
		it('provides hint for current piece', () => {
			const hint = gameState.getSolutionHint();
			expect(hint).toBeDefined();
			expect(hint).toHaveProperty('q');
			expect(hint).toHaveProperty('r');
		});

		it('provides different hints for different pieces', () => {
			const firstHint = gameState.getSolutionHint();
			gameState.cyclePiece(1);
			const secondHint = gameState.getSolutionHint();

			expect(firstHint).not.toEqual(secondHint);
		});

		it('tracks hint count correctly', () => {
			expect(gameState.getHintCount()).toBe(0);

			gameState.incrementHintCount();
			expect(gameState.getHintCount()).toBe(1);

			gameState.incrementHintCount();
			expect(gameState.getHintCount()).toBe(2);
		});

		it('resets hint count on restart', () => {
			gameState.incrementHintCount();
			gameState.incrementHintCount();
			expect(gameState.getHintCount()).toBe(2);

			gameState.restart();
			expect(gameState.getHintCount()).toBe(0);
		});
	});

	describe('difficulty detection', () => {
		it('detects standard difficulty levels', () => {
			const easyGame = new GameState(3, 4);
			expect(easyGame.getDifficulty()).toBe('Easy');

			const mediumGame = new GameState(3, 6);
			expect(mediumGame.getDifficulty()).toBe('Medium');

			const hardGame = new GameState(3, 8);
			expect(hardGame.getDifficulty()).toBe('Hard');

			const extremeGame = new GameState(4, 10);
			expect(extremeGame.getDifficulty()).toBe('Extreme');

			const impossibleGame = new GameState(4, 14);
			expect(impossibleGame.getDifficulty()).toBe('Impossible');
		});

		it('detects custom difficulty for non-standard settings', () => {
			const customGame = new GameState(5, 12);
			expect(customGame.getDifficulty()).toBe('Custom');
		});
	});

	describe('restart', () => {
		it('resets all game state', () => {
			const grid = gameState.getGrid();
			const targetHex = Array.from(grid.hexes.values()).find((hex) => hex.height > 0);

			gameState.placePiece(targetHex!.q, targetHex!.r);
			gameState.restart();

			expect(gameState.getCurrentPieceIndex()).toBe(0);
			expect(gameState.getPlacedPieces().size).toBe(0);
			expect(gameState.getHistory()).toHaveLength(0);
			expect(gameState.getUndoCount()).toBe(0);
			expect(gameState.getHintCount()).toBe(0);
			expect(gameState.canUndo()).toBe(false);
			expect(gameState.canRedo()).toBe(false);
		});

		it('restores initial grid heights', () => {
			const grid = gameState.getGrid();
			const initialHeights = new Map<string, number>();
			grid.hexes.forEach((hex, key) => {
				initialHeights.set(key, hex.height);
			});

			const targetHex = Array.from(grid.hexes.values()).find((hex) => hex.height > 0);
			gameState.placePiece(targetHex!.q, targetHex!.r);

			gameState.restart();

			grid.hexes.forEach((hex, key) => {
				expect(hex.height).toBe(initialHeights.get(key));
			});
		});
	});

	describe('getters', () => {
		it('returns immutable copies of pieces', () => {
			const pieces = gameState.getPieces();
			const originalLength = pieces[0].tiles.length;

			pieces[0].tiles.push({q: 99, r: 99});
			expect(gameState.getPieces()[0].tiles).toHaveLength(originalLength);
		});

		it('returns copy of current piece', () => {
			const piece = gameState.getCurrentPiece();
			const originalLength = piece.tiles.length;

			piece.tiles.push({q: 99, r: 99});
			expect(gameState.getCurrentPiece().tiles).toHaveLength(originalLength);
		});

		it('returns copy of placed pieces set', () => {
			const grid = gameState.getGrid();
			const piece = gameState.getCurrentPiece();

			// Find a position where the entire piece can be placed
			const positions = Array.from(grid.hexes.values());
			const validPosition = positions.find((pos) => gameState.canPlacePiece(piece, pos.q, pos.r));
			expect(validPosition).toBeDefined();

			gameState.placePiece(validPosition!.q, validPosition!.r);

			const placedPieces = gameState.getPlacedPieces();
			const currentPieceIndex = gameState.getCurrentPieceIndex();

			placedPieces.add(currentPieceIndex);
			expect(gameState.getPlacedPieces().has(currentPieceIndex)).toBe(false);
		});

		it('returns copy of history', () => {
			const grid = gameState.getGrid();
			const piece = gameState.getCurrentPiece();
			const positions = Array.from(grid.hexes.values());
			const validPosition = positions.find((pos) => gameState.canPlacePiece(piece, pos.q, pos.r));
			expect(validPosition).toBeDefined();

			gameState.placePiece(validPosition!.q, validPosition!.r);

			const history = gameState.getHistory();
			history.push({
				pieceIndex: 99,
				q: 0,
				r: 0,
				heightChanges: [],
			});

			expect(gameState.getHistory()).toHaveLength(1);
		});

		it('returns copy of settings', () => {
			const settings = gameState.getSettings();
			settings.radius = 99;

			expect(gameState.getSettings().radius).toBe(3);
		});
	});

	describe('piece status queries', () => {
		it('correctly reports piece placement status', () => {
			const currentIndex = gameState.getCurrentPieceIndex();
			expect(gameState.isPiecePlaced(currentIndex)).toBe(false);

			const grid = gameState.getGrid();
			const piece = gameState.getCurrentPiece();
			const positions = Array.from(grid.hexes.values());
			const validPosition = positions.find((pos) => gameState.canPlacePiece(piece, pos.q, pos.r));
			expect(validPosition).toBeDefined();

			gameState.placePiece(validPosition!.q, validPosition!.r);

			expect(gameState.isPiecePlaced(currentIndex)).toBe(true);
		});

		it('correctly reports all pieces placed status', () => {
			expect(gameState.getAllPiecesPlaced()).toBe(false);

			const grid = gameState.getGrid();
			const pieces = gameState.getPieces();

			let placedCount = 0;
			pieces.forEach(() => {
				const positions = Array.from(grid.hexes.values());
				const piece = gameState.getCurrentPiece();
				const validPosition = positions.find((pos) => gameState.canPlacePiece(piece, pos.q, pos.r));
				if (validPosition) {
					gameState.placePiece(validPosition.q, validPosition.r);
					placedCount++;
				}
			});

			// Check if all pieces that could be placed were placed
			if (placedCount === pieces.length) {
				expect(gameState.getAllPiecesPlaced()).toBe(true);
			} else {
				// If not all pieces could be placed, that's still valid behavior
				expect(gameState.getAllPiecesPlaced()).toBe(false);
			}
		});
	});
});
