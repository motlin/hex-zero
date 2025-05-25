import {calculateHexSize} from './canvas-utils';

declare global {
	interface Window {
		startGame: (radius: number, numPieces: number) => void;
		startCustomGame: () => void;
		validateCustomInputs: () => boolean;
		showDifficultyScreen: () => void;
		game: HexSeptominoGame | null;
	}
}

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

interface Point {
	x: number;
	y: number;
}

interface SolutionMove {
	pieceIndex: number;
	q: number;
	r: number;
}

type ColorMap = Record<number, string>;

let game: HexSeptominoGame | null = null;

window.addEventListener('DOMContentLoaded', () => {
	validateCustomInputs();
});

function startGame(radius: number, numPieces: number): void {
	document.getElementById('difficultyScreen')!.classList.add('hidden');
	document.getElementById('gameScreen')!.classList.remove('hidden');
	document.getElementById('mobileControls')!.classList.remove('hidden');
	game = new HexSeptominoGame(radius, numPieces);
	window.game = game;
}

function validateCustomInputs(): boolean {
	const radiusInput = document.getElementById('customRadius') as HTMLInputElement;
	const piecesInput = document.getElementById('customPieces') as HTMLInputElement;
	const errorDiv = document.getElementById('validationError') as HTMLElement;
	const startBtn = document.getElementById('customStartBtn') as HTMLButtonElement;

	const radius = parseInt(radiusInput.value);
	const pieces = parseInt(piecesInput.value);

	const errors: string[] = [];
	let isValid = true;

	if (isNaN(radius) || radius < 2 || radius > 8) {
		radiusInput.classList.add('invalid');
		if (isNaN(radius) || radiusInput.value === '') {
			errors.push('Radius must be a number between 2 and 8');
		} else if (radius < 2) {
			errors.push('Radius must be at least 2');
		} else if (radius > 8) {
			errors.push('Radius must be at most 8');
		}
		isValid = false;
	} else {
		radiusInput.classList.remove('invalid');
	}

	if (isNaN(pieces) || pieces < 3 || pieces > 15) {
		piecesInput.classList.add('invalid');
		if (isNaN(pieces) || piecesInput.value === '') {
			errors.push('Pieces must be a number between 3 and 15');
		} else if (pieces < 3) {
			errors.push('Pieces must be at least 3');
		} else if (pieces > 15) {
			errors.push('Pieces must be at most 15');
		}
		isValid = false;
	} else {
		piecesInput.classList.remove('invalid');
	}

	errorDiv.textContent = errors.join('. ');
	startBtn.disabled = !isValid;

	return isValid;
}

function startCustomGame(): void {
	if (validateCustomInputs()) {
		const radius = parseInt((document.getElementById('customRadius') as HTMLInputElement).value);
		const pieces = parseInt((document.getElementById('customPieces') as HTMLInputElement).value);
		startGame(radius, pieces);
	}
}

function showDifficultyScreen(): void {
	document.getElementById('gameScreen')!.classList.add('hidden');
	document.getElementById('mobileControls')!.classList.add('hidden');
	document.getElementById('difficultyScreen')!.classList.remove('hidden');
}

class HexGrid {
	public radius: number;
	public hexSize: number;
	public hexes: Map<string, Hex>;

	constructor(radius: number, hexSize: number) {
		this.radius = radius;
		this.hexSize = hexSize;
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

	hexToPixel(q: number, r: number): Point {
		const x = this.hexSize * ((3 / 2) * q);
		const y = this.hexSize * ((Math.sqrt(3) / 2) * q + Math.sqrt(3) * r);
		return {x, y};
	}

	pixelToHex(x: number, y: number): HexCoordinate {
		const q = ((2 / 3) * x) / this.hexSize;
		const r = ((-1 / 3) * x + (Math.sqrt(3) / 3) * y) / this.hexSize;
		return this.roundHex(q, r);
	}

	roundHex(q: number, r: number): HexCoordinate {
		const s = -q - r;
		let rq = Math.round(q);
		let rr = Math.round(r);
		const rs = Math.round(s);

		const q_diff = Math.abs(rq - q);
		const r_diff = Math.abs(rr - r);
		const s_diff = Math.abs(rs - s);

		if (q_diff > r_diff && q_diff > s_diff) {
			rq = -rr - rs;
		} else if (r_diff > s_diff) {
			rr = -rq - rs;
		}

		return {q: rq, r: rr};
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

class HexSeptominoGame {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private previewCanvas: HTMLCanvasElement;
	private previewCtx: CanvasRenderingContext2D;
	private radius: number;
	private numPieces: number;
	private hexSize: number;
	private grid: HexGrid;
	private pieces: Piece[];
	private currentPieceIndex: number;
	private placedPieces: Set<number>;
	private solution: SolutionMove[];
	private history: Move[];
	private redoStack: Move[];
	private hintPos: HexCoordinate | null;
	private initialGridState: Map<string, number>;
	private colors: ColorMap;
	private mouseHex: HexCoordinate | null;
	private touchHex: HexCoordinate | null;
	private isTouching: boolean;
	private zoomFactor: number;

	constructor(radius: number, numPieces: number) {
		this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
		this.ctx = this.canvas.getContext('2d')!;
		this.previewCanvas = document.getElementById('piecePreview') as HTMLCanvasElement;
		this.previewCtx = this.previewCanvas.getContext('2d')!;

		this.radius = radius;
		this.numPieces = numPieces;

		this.hexSize = 30;
		this.updateCanvasSize();

		this.grid = new HexGrid(radius, this.hexSize);

		this.pieces = [];
		this.currentPieceIndex = 0;
		this.placedPieces = new Set<number>();
		this.solution = [];
		this.history = [];
		this.redoStack = [];
		this.hintPos = null;
		this.initialGridState = new Map<string, number>();

		this.colors = {
			0: '#16213e',
			1: '#e94560',
			2: '#e67e22',
			3: '#2ecc71',
			4: '#3498db',
			5: '#9b59b6',
			6: '#c0392b',
		};

		this.mouseHex = null;
		this.touchHex = null;
		this.isTouching = false;
		this.zoomFactor = 1.0;
		this.setupEventListeners();
		this.generateLevel();
		this.render();

		setTimeout(() => {
			this.updateCanvasSize();
			this.grid.hexSize = this.hexSize;
			this.render();
		}, 100);

		window.addEventListener('resize', () => {
			this.updateCanvasSize();
			this.grid.hexSize = this.hexSize;
			this.render();
		});
	}

	private updateCanvasSize(): void {
		// Get the actual size of the canvas from CSS
		const rect = this.canvas.getBoundingClientRect();

		// Set canvas internal dimensions to match CSS dimensions
		this.canvas.width = rect.width;
		this.canvas.height = rect.height;

		this.hexSize = calculateHexSize(rect.width, rect.height, this.radius, this.zoomFactor);
	}

	private setupEventListeners(): void {
		this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
		this.canvas.addEventListener('click', (e) => this.handleClick(e));
		this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
		this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
		this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
		this.canvas.addEventListener('touchcancel', (e) => this.handleTouchCancel(e));
		this.canvas.addEventListener('mouseleave', () => {
			this.mouseHex = null;
			this.render();
		});

		document.addEventListener('keydown', (e) => this.handleKeyPress(e));
		(document.getElementById('hintBtn') as HTMLElement).addEventListener('click', () => this.showHint());
		(document.getElementById('restartBtn') as HTMLElement).addEventListener('click', () => this.restart());
		(document.getElementById('newGameBtn') as HTMLElement).addEventListener('click', () => showDifficultyScreen());
	}

	private generateLevel(): void {
		this.pieces = SeptominoGenerator.generateSet(this.numPieces);
		this.solution = [];
		this.placedPieces.clear();
		this.history = [];
		this.redoStack = [];
		this.currentPieceIndex = 0;

		this.grid.hexes.forEach((hex) => (hex.height = 0));

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
			}
		});

		this.grid.hexes.forEach((hex, key) => {
			this.initialGridState.set(key, hex.height);
		});

		this.updateUI();
	}

	private canPlacePiece(piece: Piece, centerQ: number, centerR: number, checkHeight: boolean = true): boolean {
		return piece.every((tile) => {
			const hex = this.grid.getHex(centerQ + tile.q, centerR + tile.r);
			if (checkHeight) {
				return hex !== undefined && hex.height > 0;
			} else {
				return hex !== undefined;
			}
		});
	}

	private placePiece(centerQ: number, centerR: number): void {
		const piece = this.pieces[this.currentPieceIndex];
		if (!this.canPlacePiece(piece, centerQ, centerR)) return;
		if (this.placedPieces.has(this.currentPieceIndex)) return;

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

		this.checkWinCondition();
		this.updateUI();
		this.render();
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

	private cyclePiece(direction: number): void {
		this.currentPieceIndex = (this.currentPieceIndex + direction + this.pieces.length) % this.pieces.length;
		this.updateUI();
		this.render();
	}

	private undo(): void {
		if (this.history.length === 0) return;

		const move = this.history.pop()!;
		this.redoStack.push(move);

		move.heightChanges.forEach((change) => {
			const hex = this.grid.getHex(change.q, change.r);
			if (hex) hex.height = change.oldHeight;
		});

		this.placedPieces.delete(move.pieceIndex);
		this.currentPieceIndex = move.pieceIndex;

		this.updateUI();
		this.render();
	}

	private redo(): void {
		if (this.redoStack.length === 0) return;

		const move = this.redoStack.pop()!;
		this.currentPieceIndex = move.pieceIndex;
		this.placePiece(move.q, move.r);
	}

	private showHint(): void {
		const solutionMove = this.solution.find((move) => move.pieceIndex === this.currentPieceIndex);

		if (solutionMove) {
			this.hintPos = {q: solutionMove.q, r: solutionMove.r};
			this.render();

			setTimeout(() => {
				this.hintPos = null;
				this.render();
			}, 2000);
		}
	}

	private restart(): void {
		this.initialGridState.forEach((height, key) => {
			const hex = this.grid.hexes.get(key);
			if (hex) hex.height = height;
		});

		this.placedPieces.clear();
		this.history = [];
		this.redoStack = [];
		this.currentPieceIndex = 0;
		this.hintPos = null;

		(document.getElementById('solutionStatus') as HTMLElement).textContent = '';
		(document.getElementById('mobileSolutionStatus') as HTMLElement).textContent = '';
		this.updateUI();
		this.render();
	}

	private checkWinCondition(): void {
		const allZero = Array.from(this.grid.hexes.values()).every((hex) => hex.height === 0);
		if (allZero) {
			const message = 'Congratulations! You solved it!';
			(document.getElementById('solutionStatus') as HTMLElement).textContent = message;
			(document.getElementById('mobileSolutionStatus') as HTMLElement).textContent = message;
		}
	}

	private handleMouseMove(event: MouseEvent): void {
		const rect = this.canvas.getBoundingClientRect();
		const x = event.clientX - rect.left - this.canvas.width / 2;
		const y = event.clientY - rect.top - this.canvas.height / 2;

		const hex = this.grid.pixelToHex(x, y);
		if (this.grid.getHex(hex.q, hex.r)) {
			this.mouseHex = hex;
		} else {
			this.mouseHex = null;
		}

		this.render();
	}

	private handleTouchStart(event: TouchEvent): void {
		event.preventDefault();
		const touch = event.touches[0];
		const rect = this.canvas.getBoundingClientRect();
		const x = touch.clientX - rect.left - this.canvas.width / 2;
		const y = touch.clientY - rect.top - this.canvas.height / 2;

		const hex = this.grid.pixelToHex(x, y);
		if (this.grid.getHex(hex.q, hex.r)) {
			this.touchHex = hex;
			this.isTouching = true;
			this.render();
		}
	}

	private handleTouchMove(event: TouchEvent): void {
		if (!this.isTouching) return;
		event.preventDefault();

		const touch = event.touches[0];
		const rect = this.canvas.getBoundingClientRect();
		const x = touch.clientX - rect.left - this.canvas.width / 2;
		const y = touch.clientY - rect.top - this.canvas.height / 2;

		const hex = this.grid.pixelToHex(x, y);
		if (this.grid.getHex(hex.q, hex.r)) {
			this.touchHex = hex;
		} else {
			this.touchHex = null;
		}
		this.render();
	}

	private handleTouchEnd(event: TouchEvent): void {
		if (!this.isTouching) return;
		event.preventDefault();

		if (this.touchHex && !this.placedPieces.has(this.currentPieceIndex)) {
			const piece = this.pieces[this.currentPieceIndex];
			if (this.canPlacePiece(piece, this.touchHex.q, this.touchHex.r)) {
				this.placePiece(this.touchHex.q, this.touchHex.r);
			}
		}

		this.touchHex = null;
		this.isTouching = false;
		this.render();
	}

	private handleTouchCancel(_event: TouchEvent): void {
		this.touchHex = null;
		this.isTouching = false;
		this.render();
	}

	private handleClick(_event: MouseEvent): void {
		if (this.mouseHex && !this.placedPieces.has(this.currentPieceIndex)) {
			this.placePiece(this.mouseHex.q, this.mouseHex.r);
		}
	}

	private handleKeyPress(event: KeyboardEvent): void {
		switch (event.key) {
			case 'ArrowUp':
				this.cyclePiece(-1);
				break;
			case 'ArrowDown':
				this.cyclePiece(1);
				break;
			case 'ArrowLeft':
				this.undo();
				break;
			case 'ArrowRight':
				this.redo();
				break;
			case '+':
			case '=':
				// Handle both + and = keys for zoom in
				this.zoom(1.1);
				break;
			case '-':
				this.zoom(0.9);
				break;
		}
	}

	private zoom(factor: number): void {
		const oldZoom = this.zoomFactor;
		this.zoomFactor = Math.max(0.5, Math.min(2.0, this.zoomFactor * factor));

		if (oldZoom !== this.zoomFactor) {
			this.updateCanvasSize();
			this.grid.hexSize = this.hexSize;
			this.render();
		}
	}

	private updateUI(): void {
		const pieceText = `Piece ${this.currentPieceIndex + 1} of ${this.pieces.length}`;
		(document.getElementById('pieceNumber') as HTMLElement).textContent = pieceText;
		(document.getElementById('mobilePieceInfo') as HTMLElement).textContent = pieceText;

		(document.getElementById('piecePlaced') as HTMLElement).style.display = this.placedPieces.has(
			this.currentPieceIndex,
		)
			? 'block'
			: 'none';

		if (this.placedPieces.size < this.pieces.length) {
			(document.getElementById('solutionStatus') as HTMLElement).textContent = '';
			(document.getElementById('mobileSolutionStatus') as HTMLElement).textContent = '';
		}

		this.renderPiecePreview();
	}

	private render(): void {
		this.ctx.fillStyle = '#0f3460';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		this.ctx.save();
		this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);

		const fontSize = Math.max(12, Math.floor(this.hexSize * 0.5));

		// Draw hexes
		this.grid.hexes.forEach((hex) => {
			const pos = this.grid.hexToPixel(hex.q, hex.r);
			let displayHeight = hex.height;

			// Check if this hex is being previewed
			if (this.mouseHex && !this.placedPieces.has(this.currentPieceIndex)) {
				const piece = this.pieces[this.currentPieceIndex];
				const canPlace = this.canPlacePiece(piece, this.mouseHex.q, this.mouseHex.r);

				if (canPlace) {
					// Check if this hex would be affected by the piece
					const isAffected = piece.some(
						(tile) => hex.q === this.mouseHex!.q + tile.q && hex.r === this.mouseHex!.r + tile.r,
					);

					if (isAffected && hex.height > 0) {
						displayHeight = hex.height - 1;
					}
				}
			}

			// Base hex with preview color
			this.drawHex(pos.x, pos.y, this.colors[displayHeight] || '#000', '#0f3460', 2);

			// Height number (only show if not 0)
			if (displayHeight > 0) {
				this.ctx.fillStyle = '#fff';
				this.ctx.font = `bold ${fontSize}px Arial`;
				this.ctx.textAlign = 'center';
				this.ctx.textBaseline = 'middle';
				this.ctx.fillText(displayHeight.toString(), pos.x, pos.y);
			}
		});

		// Draw hover outline overlay
		if (this.mouseHex && !this.placedPieces.has(this.currentPieceIndex)) {
			const piece = this.pieces[this.currentPieceIndex];
			const canPlace = this.canPlacePiece(piece, this.mouseHex.q, this.mouseHex.r);

			piece.forEach((tile) => {
				const hex = this.grid.getHex(this.mouseHex!.q + tile.q, this.mouseHex!.r + tile.r);
				if (hex) {
					const pos = this.grid.hexToPixel(hex.q, hex.r);
					if (canPlace) {
						// Yellow for valid placement
						this.drawHex(pos.x, pos.y, 'rgba(255, 235, 59, 0.3)', '#ffeb3b', 3);
					} else {
						// Red for invalid placement
						this.drawHex(pos.x, pos.y, 'rgba(244, 67, 54, 0.3)', '#f44336', 3);
					}
				}
			});
		}

		// Draw hint
		if (this.hintPos) {
			const piece = this.pieces[this.currentPieceIndex];
			piece.forEach((tile) => {
				const hex = this.grid.getHex(this.hintPos!.q + tile.q, this.hintPos!.r + tile.r);
				if (hex) {
					const pos = this.grid.hexToPixel(hex.q, hex.r);
					this.ctx.strokeStyle = '#e94560';
					this.ctx.lineWidth = 4;
					this.ctx.setLineDash([5, 5]);
					this.drawHexOutline(pos.x, pos.y);
					this.ctx.setLineDash([]);
				}
			});
		}

		this.ctx.restore();
	}

	private renderPiecePreview(): void {
		const ctx = this.previewCtx;
		ctx.fillStyle = '#16213e';
		ctx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);

		const piece = this.pieces[this.currentPieceIndex];
		const previewHexSize = 20;

		ctx.save();
		ctx.translate(this.previewCanvas.width / 2, this.previewCanvas.height / 2);

		const color = this.placedPieces.has(this.currentPieceIndex) ? '#666' : '#e94560';

		piece.forEach((tile) => {
			const x = previewHexSize * ((3 / 2) * tile.q);
			const y = previewHexSize * ((Math.sqrt(3) / 2) * tile.q + Math.sqrt(3) * tile.r);
			this.drawHexOnCanvas(ctx, x, y, previewHexSize, color, '#0f3460', 2);
		});

		ctx.restore();
	}

	private drawHex(x: number, y: number, fillColor: string, strokeColor: string, lineWidth: number): void {
		this.drawHexOnCanvas(this.ctx, x, y, this.hexSize, fillColor, strokeColor, lineWidth);
	}

	private drawHexOutline(x: number, y: number): void {
		this.ctx.beginPath();
		for (let i = 0; i < 6; i++) {
			const angle = (Math.PI / 3) * i;
			const hx = x + this.hexSize * Math.cos(angle);
			const hy = y + this.hexSize * Math.sin(angle);
			if (i === 0) {
				this.ctx.moveTo(hx, hy);
			} else {
				this.ctx.lineTo(hx, hy);
			}
		}
		this.ctx.closePath();
		this.ctx.stroke();
	}

	private drawHexOnCanvas(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		size: number,
		fillColor: string,
		strokeColor: string,
		lineWidth: number,
	): void {
		ctx.beginPath();
		for (let i = 0; i < 6; i++) {
			const angle = (Math.PI / 3) * i;
			const hx = x + size * Math.cos(angle);
			const hy = y + size * Math.sin(angle);
			if (i === 0) {
				ctx.moveTo(hx, hy);
			} else {
				ctx.lineTo(hx, hy);
			}
		}
		ctx.closePath();

		ctx.fillStyle = fillColor;
		ctx.fill();

		ctx.strokeStyle = strokeColor;
		ctx.lineWidth = lineWidth;
		ctx.stroke();
	}
}

window.startGame = startGame;
window.startCustomGame = startCustomGame;
window.validateCustomInputs = validateCustomInputs;
window.showDifficultyScreen = showDifficultyScreen;
window.game = game;

export {};
