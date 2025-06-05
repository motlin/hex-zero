import {HexGrid, type HexCoordinate} from './HexGrid';
import {SeptominoGenerator, type Piece} from './SeptominoGenerator';

interface Move {
	pieceIndex: number;
	q: number;
	r: number;
	heightChanges: HeightChange[];
}

interface HeightChange {
	q: number;
	r: number;
	oldHeight: number;
}

interface SolutionMove {
	pieceIndex: number;
	q: number;
	r: number;
}

interface GameSettings {
	radius: number;
	numPieces: number;
}

export class GameState {
	private settings: GameSettings;
	private grid: HexGrid;
	private pieces: Piece[];
	private currentPieceIndex: number;
	private placedPieces: Set<number>;
	private solution: SolutionMove[];
	private history: Move[];
	private redoStack: Move[];
	private initialGridState: Map<string, number>;
	private undoCount: number;
	private hintCount: number;

	constructor(radius: number, numPieces: number) {
		this.settings = {radius, numPieces};
		this.grid = new HexGrid(radius);
		this.pieces = [];
		this.currentPieceIndex = 0;
		this.placedPieces = new Set<number>();
		this.solution = [];
		this.history = [];
		this.redoStack = [];
		this.initialGridState = new Map<string, number>();
		this.undoCount = 0;
		this.hintCount = 0;

		this.generateLevel();
	}

	private generateLevel(): void {
		this.pieces = SeptominoGenerator.generateSet(this.settings.numPieces);
		this.solution = [];
		this.placedPieces.clear();
		this.history = [];
		this.redoStack = [];
		this.currentPieceIndex = 0;

		this.grid.hexes.forEach((hex) => (hex.height = 0));

		const positions = Array.from(this.grid.hexes.values());

		this.pieces.forEach((piece, index) => {
			const validPositions = positions.filter((pos) => this.canPlacePiece(piece, pos.q, pos.r, false));

			if (validPositions.length === 0) {
				// Skip pieces that can't be placed during initial generation
				// They remain in the pieces array for the player to place
				return;
			}

			const pos = validPositions[Math.floor(Math.random() * validPositions.length)];
			this.solution.push({pieceIndex: index, q: pos.q, r: pos.r});

			piece.tiles.forEach((tile) => {
				// During generation, pos represents where the center should go
				const adjustedQ = pos.q + tile.q - piece.center.q;
				const adjustedR = pos.r + tile.r - piece.center.r;
				const hex = this.grid.getHex(adjustedQ, adjustedR);
				if (hex) {
					hex.height = hex.height + 1;
				}
			});
		});

		this.grid.hexes.forEach((hex, key) => {
			this.initialGridState.set(key, hex.height);
		});
	}

	canPlacePiece(piece: Piece, centerQ: number, centerR: number, checkHeight: boolean = true): boolean {
		return piece.tiles.every((tile) => {
			const hex = this.grid.getHex(centerQ + tile.q, centerR + tile.r);
			if (checkHeight) {
				return hex !== undefined && hex.height > 0;
			} else {
				return hex !== undefined;
			}
		});
	}

	placePiece(centerQ: number, centerR: number): boolean {
		const piece = this.pieces[this.currentPieceIndex];
		if (!this.canPlacePiece(piece, centerQ, centerR)) return false;
		if (this.placedPieces.has(this.currentPieceIndex)) return false;

		this.redoStack = [];

		const move: Move = {
			pieceIndex: this.currentPieceIndex,
			q: centerQ,
			r: centerR,
			heightChanges: [],
		};

		piece.tiles.forEach((tile) => {
			const hex = this.grid.getHex(centerQ + tile.q, centerR + tile.r);
			if (hex && hex.height > 0) {
				move.heightChanges.push({q: hex.q, r: hex.r, oldHeight: hex.height});
				hex.height--;
			}
		});

		this.history.push(move);
		this.placedPieces.add(this.currentPieceIndex);
		this.findNextUnplacedPiece();

		return true;
	}

	private findNextUnplacedPiece(): void {
		for (let i = 0; i < this.pieces.length; i++) {
			const index = (this.currentPieceIndex + 1 + i) % this.pieces.length;
			if (!this.placedPieces.has(index)) {
				this.currentPieceIndex = index;
				return;
			}
		}
	}

	cyclePiece(direction: number): boolean {
		if (this.placedPieces.size >= this.pieces.length) return false;

		let attempts = 0;
		let newIndex = this.currentPieceIndex;

		do {
			newIndex = (newIndex + direction + this.pieces.length) % this.pieces.length;
			attempts++;
			if (attempts > this.pieces.length) break;
		} while (this.placedPieces.has(newIndex) && newIndex !== this.currentPieceIndex);

		if (newIndex !== this.currentPieceIndex && !this.placedPieces.has(newIndex)) {
			this.currentPieceIndex = newIndex;
			return true;
		}

		return false;
	}

	getNextPieceIndex(): number | null {
		if (this.placedPieces.size >= this.pieces.length) return null;

		let attempts = 0;
		let newIndex = this.currentPieceIndex;

		do {
			newIndex = (newIndex + 1 + this.pieces.length) % this.pieces.length;
			attempts++;
			if (attempts > this.pieces.length) return null;
		} while (this.placedPieces.has(newIndex) && newIndex !== this.currentPieceIndex);

		return newIndex !== this.currentPieceIndex && !this.placedPieces.has(newIndex) ? newIndex : null;
	}

	getPreviousPieceIndex(): number | null {
		if (this.placedPieces.size >= this.pieces.length) return null;

		let attempts = 0;
		let newIndex = this.currentPieceIndex;

		do {
			newIndex = (newIndex - 1 + this.pieces.length) % this.pieces.length;
			attempts++;
			if (attempts > this.pieces.length) return null;
		} while (this.placedPieces.has(newIndex) && newIndex !== this.currentPieceIndex);

		return newIndex !== this.currentPieceIndex && !this.placedPieces.has(newIndex) ? newIndex : null;
	}

	undo(): boolean {
		if (this.history.length === 0) return false;

		const move = this.history.pop()!;
		this.redoStack.push(move);

		move.heightChanges.forEach((change) => {
			const hex = this.grid.getHex(change.q, change.r);
			if (hex) hex.height = change.oldHeight;
		});

		this.placedPieces.delete(move.pieceIndex);
		this.currentPieceIndex = move.pieceIndex;
		this.undoCount++;

		return true;
	}

	redo(): boolean {
		if (this.redoStack.length === 0) return false;

		const move = this.redoStack.pop()!;

		move.heightChanges.forEach((change) => {
			const hex = this.grid.getHex(change.q, change.r);
			if (hex) hex.height = change.oldHeight - 1;
		});

		this.placedPieces.add(move.pieceIndex);
		this.history.push(move);
		this.findNextUnplacedPiece();

		return true;
	}

	restart(): void {
		this.initialGridState.forEach((height, key) => {
			const hex = this.grid.hexes.get(key);
			if (hex) hex.height = height;
		});

		this.placedPieces.clear();
		this.history = [];
		this.redoStack = [];
		this.currentPieceIndex = 0;
		this.undoCount = 0;
		this.hintCount = 0;
	}

	isGameWon(): boolean {
		return Array.from(this.grid.hexes.values()).every((hex) => hex.height === 0);
	}

	getSolutionHint(): HexCoordinate | null {
		const solutionMove = this.solution.find((move) => move.pieceIndex === this.currentPieceIndex);
		return solutionMove ? {q: solutionMove.q, r: solutionMove.r} : null;
	}

	getDifficulty(): string {
		const {radius, numPieces} = this.settings;

		if (radius === 3 && numPieces === 4) return 'Easy';
		if (radius === 3 && numPieces === 6) return 'Medium';
		if (radius === 3 && numPieces === 8) return 'Hard';
		if (radius === 4 && numPieces === 10) return 'Extreme';
		if (radius === 4 && numPieces === 14) return 'Impossible';

		return 'Custom';
	}

	getSettings(): GameSettings {
		return {...this.settings};
	}

	getGrid(): HexGrid {
		return this.grid;
	}

	getPieces(): Piece[] {
		return this.pieces.map((piece) => ({
			tiles: [...piece.tiles],
			center: {...piece.center},
		}));
	}

	getCurrentPieceIndex(): number {
		return this.currentPieceIndex;
	}

	getCurrentPiece(): Piece {
		const piece = this.pieces[this.currentPieceIndex];
		return {
			tiles: [...piece.tiles],
			center: {...piece.center},
		};
	}

	getPieceByIndex(index: number): Piece | null {
		if (index < 0 || index >= this.pieces.length) return null;
		const piece = this.pieces[index];
		return {
			tiles: [...piece.tiles],
			center: {...piece.center},
		};
	}

	getPlacedPieces(): Set<number> {
		return new Set(this.placedPieces);
	}

	getHistory(): Move[] {
		return [...this.history];
	}

	getRedoStack(): Move[] {
		return [...this.redoStack];
	}

	getUndoCount(): number {
		return this.undoCount;
	}

	getHintCount(): number {
		return this.hintCount;
	}

	incrementHintCount(): void {
		this.hintCount++;
	}

	getMoveCount(): number {
		return this.history.length;
	}

	canUndo(): boolean {
		return this.history.length > 0;
	}

	canRedo(): boolean {
		return this.redoStack.length > 0;
	}

	isPiecePlaced(pieceIndex: number): boolean {
		return this.placedPieces.has(pieceIndex);
	}

	getAllPiecesPlaced(): boolean {
		return this.placedPieces.size >= this.pieces.length;
	}
}

export type {Move, HeightChange, SolutionMove, GameSettings};
