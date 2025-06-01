interface HexCoordinate {
	q: number;
	r: number;
}

interface Hex extends HexCoordinate {
	s: number;
	height: number;
}

type Piece = HexCoordinate[];

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

class HexGrid {
	public radius: number;
	public hexes: Map<string, Hex>;

	constructor(radius: number) {
		this.radius = radius;
		this.hexes = new Map<string, Hex>();

		for (let q = -radius; q <= radius; q++) {
			for (let r = -radius; r <= radius; r++) {
				const s = -q - r;
				if (Math.abs(s) <= radius) {
					const key = `${q},${r}`;
					this.hexes.set(key, {q, r, s, height: 0});
				}
			}
		}
	}

	getHex(q: number, r: number): Hex | undefined {
		return this.hexes.get(`${q},${r}`);
	}

	getNeighbors(q: number, r: number): HexCoordinate[] {
		const dirs: [number, number][] = [
			[1, 0],
			[1, -1],
			[0, -1],
			[-1, 0],
			[-1, 1],
			[0, 1],
		];
		return dirs.map(([dq, dr]) => ({q: q + dq, r: r + dr})).filter((pos) => this.getHex(pos.q, pos.r));
	}
}

class SeptominoGenerator {
	static generatePiece(): Piece {
		const tiles: Piece = [{q: 0, r: 0}];

		const numTiles = 2 + Math.floor(Math.random() * 5);

		for (let i = 0; i < numTiles; i++) {
			const neighbors: HexCoordinate[] = [
				{q: 1, r: 0},
				{q: 1, r: -1},
				{q: 0, r: -1},
				{q: -1, r: 0},
				{q: -1, r: 1},
				{q: 0, r: 1},
			];

			const available = neighbors.filter((n) => !tiles.some((t) => t.q === n.q && t.r === n.r));

			if (available.length > 0) {
				const next = available[Math.floor(Math.random() * available.length)];
				tiles.push(next);
			}
		}

		return tiles;
	}

	static generateSet(count: number): Piece[] {
		const pieces: Piece[] = [];
		for (let i = 0; i < count; i++) {
			pieces.push(this.generatePiece());
		}
		return pieces;
	}
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

		this.generateLevel();
	}

	private generateLevel(): void {
		this.pieces = SeptominoGenerator.generateSet(this.settings.numPieces);
		this.solution = [];
		this.placedPieces.clear();
		this.history = [];
		this.redoStack = [];
		this.currentPieceIndex = 0;

		// Reset grid
		this.grid.hexes.forEach((hex) => (hex.height = 0));

		// Try multiple times to ensure all pieces can be placed
		let attempts = 0;
		const maxAttempts = 10;

		while (attempts < maxAttempts) {
			this.grid.hexes.forEach((hex) => (hex.height = 0));
			this.solution = [];
			let allPiecesPlaced = true;

			const positions = Array.from(this.grid.hexes.values());

			this.pieces.forEach((piece, index) => {
				const validPositions = positions.filter((pos) => this.canPlacePiece(piece, pos.q, pos.r, false));

				if (validPositions.length > 0) {
					const pos = validPositions[Math.floor(Math.random() * validPositions.length)];

					this.solution.push({pieceIndex: index, q: pos.q, r: pos.r});

					piece.forEach((tile) => {
						const hex = this.grid.getHex(pos.q + tile.q, pos.r + tile.r);
						if (hex) {
							hex.height = Math.min(hex.height + 1, 6);
						}
					});
				} else {
					allPiecesPlaced = false;
				}
			});

			if (allPiecesPlaced) {
				break;
			}

			attempts++;
			if (attempts >= maxAttempts) {
				// Generate simpler pieces if we can't place all of them
				this.pieces = this.pieces.map(() => [{q: 0, r: 0}]);
				this.grid.hexes.forEach((hex) => (hex.height = 0));
				this.solution = [];

				this.pieces.forEach((piece, index) => {
					const validPositions = positions.filter((pos) => this.canPlacePiece(piece, pos.q, pos.r, false));
					if (validPositions.length > 0) {
						const pos = validPositions[Math.floor(Math.random() * validPositions.length)];
						this.solution.push({pieceIndex: index, q: pos.q, r: pos.r});
						piece.forEach((tile) => {
							const hex = this.grid.getHex(pos.q + tile.q, pos.r + tile.r);
							if (hex) {
								hex.height = Math.min(hex.height + 1, 6);
							}
						});
					}
				});
				break;
			}
		}

		this.grid.hexes.forEach((hex, key) => {
			this.initialGridState.set(key, hex.height);
		});
	}

	canPlacePiece(piece: Piece, centerQ: number, centerR: number, checkHeight: boolean = true): boolean {
		return piece.every((tile) => {
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

		piece.forEach((tile) => {
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
		this.currentPieceIndex = move.pieceIndex;
		return this.placePiece(move.q, move.r);
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
	}

	isGameWon(): boolean {
		return Array.from(this.grid.hexes.values()).every((hex) => hex.height === 0);
	}

	getSolutionHint(): HexCoordinate | null {
		const solutionMove = this.solution.find((move) => move.pieceIndex === this.currentPieceIndex);
		return solutionMove ? {q: solutionMove.q, r: solutionMove.r} : null;
	}

	// Getters for read-only access to game state
	getSettings(): GameSettings {
		return {...this.settings};
	}

	getGrid(): HexGrid {
		return this.grid;
	}

	getPieces(): Piece[] {
		return this.pieces.map((piece) => [...piece]);
	}

	getCurrentPieceIndex(): number {
		return this.currentPieceIndex;
	}

	getCurrentPiece(): Piece {
		return [...this.pieces[this.currentPieceIndex]];
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

export type {HexCoordinate, Hex, Piece, Move, HeightChange, SolutionMove, GameSettings};
