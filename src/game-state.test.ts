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
			if (!validPosition) throw new Error('No valid position found');
			const firstTile = piece.tiles[0];
			if (!firstTile) throw new Error('No tiles in piece');
			const affectedHex = grid.getHex(validPosition.q + firstTile.q, validPosition.r + firstTile.r);
			if (!affectedHex) throw new Error('Affected hex not found');
			const initialHeight = affectedHex.height;

			gameState.placePiece(validPosition.q, validPosition.r);

			expect(affectedHex.height).toBe(initialHeight - 1);
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
			if (!validPosition) throw new Error('No valid position found');
			const firstTile = piece.tiles[0];
			if (!firstTile) throw new Error('No tiles in piece');
			const affectedHex = grid.getHex(validPosition.q + firstTile.q, validPosition.r + firstTile.r);
			if (!affectedHex) throw new Error('Affected hex not found');
			const initialHeight = affectedHex.height;

			gameState.placePiece(validPosition.q, validPosition.r);
			expect(affectedHex.height).toBe(initialHeight - 1);
			expect(gameState.isPiecePlaced(initialPieceIndex)).toBe(true);

			const undone = gameState.undo();
			expect(undone).toBe(true);
			expect(affectedHex.height).toBe(initialHeight);
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
			if (!validPosition) throw new Error('No valid position found');
			const firstTile = piece.tiles[0];
			if (!firstTile) throw new Error('No tiles in piece');
			const affectedHex = grid.getHex(validPosition.q + firstTile.q, validPosition.r + firstTile.r);
			if (!affectedHex) throw new Error('Affected hex not found');
			const initialHeight = affectedHex.height;

			gameState.placePiece(validPosition.q, validPosition.r);
			gameState.undo();

			const redone = gameState.redo();
			expect(redone).toBe(true);
			expect(affectedHex.height).toBe(initialHeight - 1);
		});

		it('clears redo stack when making new move', () => {
			const grid = gameState.getGrid();
			const positions = Array.from(grid.hexes.values());

			// Place first piece
			const firstPiece = gameState.getCurrentPiece();
			const firstValidPosition = positions.find((pos) => gameState.canPlacePiece(firstPiece, pos.q, pos.r));
			expect(firstValidPosition).toBeDefined();

			if (!firstValidPosition) throw new Error('No valid position found');
			gameState.placePiece(firstValidPosition.q, firstValidPosition.r);
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

			if (!validPosition) throw new Error('No valid position found');
			gameState.placePiece(validPosition.q, validPosition.r);
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

		it('handles complex undo/redo sequence with N-1 moves', () => {
			const grid = gameState.getGrid();
			const positions = Array.from(grid.hexes.values());
			const totalPieces = gameState.getPieces().length;

			// Store initial state for comparison
			const initialGridState = new Map();
			grid.hexes.forEach((hex, key) => {
				initialGridState.set(key, hex.height);
			});
			const initialPieceIndex = gameState.getCurrentPieceIndex();

			// Make N-1 moves (place all pieces except the last one)
			const placedMoves: {q: number; r: number; pieceIndex: number}[] = [];

			for (let i = 0; i < totalPieces - 1; i++) {
				const currentPiece = gameState.getCurrentPiece();
				const currentPieceIndex = gameState.getCurrentPieceIndex();

				// Find a valid position for this piece
				const validPosition = positions.find((pos) => gameState.canPlacePiece(currentPiece, pos.q, pos.r));

				if (validPosition) {
					placedMoves.push({
						q: validPosition.q,
						r: validPosition.r,
						pieceIndex: currentPieceIndex,
					});
					gameState.placePiece(validPosition.q, validPosition.r);
				} else {
					// If we can't place a piece, cycle to find one that works
					let attempts = 0;
					while (attempts < totalPieces) {
						const currentAttemptPiece = gameState.getCurrentPiece();
						const testPosition = positions.find((pos) =>
							gameState.canPlacePiece(currentAttemptPiece, pos.q, pos.r),
						);
						if (testPosition) break;
						gameState.cyclePiece(1);
						attempts++;
					}

					if (attempts < totalPieces) {
						const newCurrentPiece = gameState.getCurrentPiece();
						const newValidPosition = positions.find((pos) =>
							gameState.canPlacePiece(newCurrentPiece, pos.q, pos.r),
						);
						if (newValidPosition) {
							placedMoves.push({
								q: newValidPosition.q,
								r: newValidPosition.r,
								pieceIndex: gameState.getCurrentPieceIndex(),
							});
							gameState.placePiece(newValidPosition.q, newValidPosition.r);
						}
					}
				}
			}

			// Verify we have made at least some moves
			expect(placedMoves.length).toBeGreaterThan(0);
			expect(gameState.canUndo()).toBe(true);

			// Now perform the complex undo/redo sequence:
			// Repeatedly undo 2x and redo 1x until the undo stack is cleared
			let undoRedoCycles = 0;
			// Safety limit to prevent infinite loops
			const maxCycles = 50;

			while (gameState.canUndo() && undoRedoCycles < maxCycles) {
				// Track state before this cycle
				const undosAvailableBefore = gameState.canUndo();

				// Undo up to 2 moves
				let undoCount = 0;
				while (gameState.canUndo() && undoCount < 2) {
					gameState.undo();
					undoCount++;
				}

				// Redo 1 move if possible
				if (gameState.canRedo()) {
					gameState.redo();
				}

				undoRedoCycles++;

				// If we're making no progress (still have undos available and didn't change anything),
				// we need to do more undos to actually clear the stack
				if (undosAvailableBefore && gameState.canUndo() && undoCount === 0) {
					// Force progress by doing one more undo
					if (gameState.canUndo()) {
						gameState.undo();
					}
				}
			}

			// If there are still undos available, finish clearing them
			while (gameState.canUndo()) {
				gameState.undo();
			}

			// Now verify we've cleared the undo stack
			expect(gameState.canUndo()).toBe(false);

			// Now redo all moves to get back to where we started
			while (gameState.canRedo()) {
				gameState.redo();
			}

			// Verify we're back to the state after N-1 moves
			expect(gameState.canRedo()).toBe(false);

			// Check that the placed pieces are still placed
			placedMoves.forEach((move) => {
				expect(gameState.isPiecePlaced(move.pieceIndex)).toBe(true);
			});

			// Verify grid state consistency by checking that pieces were actually placed
			// (we can't easily compare exact grid state due to piece cycling affecting available pieces)
			// Should have moves to undo
			expect(gameState.canUndo()).toBe(true);

			// Perform a final test: undo all moves and verify we're back to initial state
			while (gameState.canUndo()) {
				gameState.undo();
			}

			// Check we're back to initial state
			expect(gameState.getCurrentPieceIndex()).toBe(initialPieceIndex);
			expect(gameState.canUndo()).toBe(false);
			expect(gameState.canRedo()).toBe(true);

			// Verify grid is back to initial state
			grid.hexes.forEach((hex, key) => {
				expect(hex.height).toBe(initialGridState.get(key));
			});

			// Redo everything one more time to ensure consistency
			while (gameState.canRedo()) {
				gameState.redo();
			}

			// Final consistency check
			placedMoves.forEach((move) => {
				expect(gameState.isPiecePlaced(move.pieceIndex)).toBe(true);
			});
		});

		it('maintains undo count correctly through complex sequences', () => {
			const grid = gameState.getGrid();
			const positions = Array.from(grid.hexes.values());

			// Place a few pieces
			let placedCount = 0;
			for (let i = 0; i < 3; i++) {
				const currentPiece = gameState.getCurrentPiece();
				const validPosition = positions.find((pos) => gameState.canPlacePiece(currentPiece, pos.q, pos.r));

				if (validPosition) {
					gameState.placePiece(validPosition.q, validPosition.r);
					placedCount++;
				}
			}

			expect(placedCount).toBeGreaterThan(0);

			// Undo some moves and track undo count
			const initialUndoCount = gameState.getUndoCount();
			let expectedUndoCount = initialUndoCount;

			// Undo 2 moves
			if (gameState.canUndo()) {
				gameState.undo();
				expectedUndoCount++;
				expect(gameState.getUndoCount()).toBe(expectedUndoCount);
			}

			if (gameState.canUndo()) {
				gameState.undo();
				expectedUndoCount++;
				expect(gameState.getUndoCount()).toBe(expectedUndoCount);
			}

			// Redo 1 move (should not affect undo count)
			if (gameState.canRedo()) {
				gameState.redo();
				expect(gameState.getUndoCount()).toBe(expectedUndoCount);
			}

			// Undo again
			if (gameState.canUndo()) {
				gameState.undo();
				expectedUndoCount++;
				expect(gameState.getUndoCount()).toBe(expectedUndoCount);
			}
		});

		it('handles undo/redo with piece cycling', () => {
			const grid = gameState.getGrid();
			const positions = Array.from(grid.hexes.values());

			// Cycle to a different piece
			gameState.cyclePiece(1);
			const cycledPieceIndex = gameState.getCurrentPieceIndex();

			// Place the cycled piece
			const currentPiece = gameState.getCurrentPiece();
			const validPosition = positions.find((pos) => gameState.canPlacePiece(currentPiece, pos.q, pos.r));

			if (validPosition) {
				gameState.placePiece(validPosition.q, validPosition.r);
				expect(gameState.isPiecePlaced(cycledPieceIndex)).toBe(true);

				// Undo the placement
				gameState.undo();
				expect(gameState.isPiecePlaced(cycledPieceIndex)).toBe(false);
				expect(gameState.getCurrentPieceIndex()).toBe(cycledPieceIndex);

				// Redo the placement
				gameState.redo();
				expect(gameState.isPiecePlaced(cycledPieceIndex)).toBe(true);
			}
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
			if (!targetHex) throw new Error('No targetHex found');
			gameState.placePiece(targetHex.q, targetHex.r);

			gameState.restart();

			grid.hexes.forEach((hex, key) => {
				expect(hex.height).toBe(initialHeights.get(key));
			});
		});
	});

	describe('getters', () => {
		it('returns immutable copies of pieces', () => {
			const pieces = gameState.getPieces();
			const firstPiece = pieces[0];
			if (!firstPiece) throw new Error('No pieces found');
			const originalLength = firstPiece.tiles.length;

			firstPiece.tiles.push({q: 99, r: 99});
			const newFirstPiece = gameState.getPieces()[0];
			if (!newFirstPiece) throw new Error('No pieces found after modification');
			expect(newFirstPiece.tiles).toHaveLength(originalLength);
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
