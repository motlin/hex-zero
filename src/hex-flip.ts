import {calculateHexSize} from './canvas-utils';
import Hamster, {HamsterInstance} from 'hamsterjs';
import confetti from 'canvas-confetti';

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

interface AnimatingHex {
	q: number;
	r: number;
	centerQ: number;
	centerR: number;
	startHeight: number;
	targetHeight: number;
	progress: number;
	delay: number;
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

	if (game) {
		game.cleanup();
	}

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
	private hintTimeout: number | null;
	private animatingHexes: AnimatingHex[];
	private animationStartTime: number | null;
	private animationDuration: number;
	private isPanning: boolean;
	private panStartX: number;
	private panStartY: number;
	private panOffsetX: number;
	private panOffsetY: number;
	private lastPinchDistance: number | null;
	private showMobilePiecePreview: boolean;
	private invalidPlacementAnimation: {
		isActive: boolean;
		startTime: number;
		position: HexCoordinate;
		duration: number;
	} | null;
	private wheelAccumulator: number;
	private hamster: HamsterInstance | null;
	private undoCount: number;

	cleanup(): void {
		if (this.hamster) {
			this.hamster.unwheel();
			this.hamster = null;
		}
	}

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
		this.hintTimeout = null;
		this.animatingHexes = [];
		this.animationStartTime = null;
		this.animationDuration = 750;
		this.isPanning = false;
		this.panStartX = 0;
		this.panStartY = 0;
		this.panOffsetX = 0;
		this.panOffsetY = 0;
		this.lastPinchDistance = null;
		this.showMobilePiecePreview = false;
		this.invalidPlacementAnimation = null;
		this.wheelAccumulator = 0;
		this.hamster = null;
		this.undoCount = 0;
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
		const rect = this.canvas.getBoundingClientRect();

		this.canvas.width = rect.width;
		this.canvas.height = rect.height;

		this.hexSize = calculateHexSize(rect.width, rect.height, this.radius, this.zoomFactor);
	}

	private setupEventListeners(): void {
		this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
		this.canvas.addEventListener('click', (e) => this.handleClick(e));
		this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
		this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));

		this.hamster = Hamster(this.canvas);
		this.hamster.wheel((event, delta, _deltaX, deltaY) => {
			// Mouse wheel does not scroll
			event.preventDefault();

			// Mouse wheel is for piece cycling only
			if (Math.abs(deltaY) > Math.abs(_deltaX)) {
				this.handleHamsterWheel(delta, deltaY);
			}
		});
		this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), {passive: false});
		this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), {passive: false});
		this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), {passive: false});
		this.canvas.addEventListener('touchcancel', (e) => this.handleTouchCancel(e));
		this.canvas.addEventListener('mouseleave', () => {
			this.mouseHex = null;
			this.isPanning = false;
			this.render();
		});

		document.addEventListener('keydown', (e) => this.handleKeyPress(e));
		(document.getElementById('hintBtn') as HTMLElement).addEventListener('click', () => this.toggleHint());
		(document.getElementById('restartBtn') as HTMLElement).addEventListener('click', () => this.restart());
		(document.getElementById('newGameBtn') as HTMLElement).addEventListener('click', () => showDifficultyScreen());

		// Keyboard shortcuts modal event listeners
		const closeBtn = document.getElementById('closeShortcutsBtn');
		const modal = document.getElementById('keyboardShortcutsModal');
		const modalOverlay = modal?.querySelector('.modal-overlay');

		if (closeBtn) {
			closeBtn.addEventListener('click', () => this.toggleKeyboardShortcuts());
		}

		if (modalOverlay) {
			modalOverlay.addEventListener('click', () => this.toggleKeyboardShortcuts());
		}

		// Close modal on ESC key
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
				this.toggleKeyboardShortcuts();
			}
		});
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

		// Clear any active hint when placing a piece
		if (this.hintPos) {
			this.hintPos = null;
			if (this.hintTimeout) {
				clearTimeout(this.hintTimeout);
				this.hintTimeout = null;
			}
		}

		this.redoStack = [];

		const move: Move = {
			pieceIndex: this.currentPieceIndex,
			q: centerQ,
			r: centerR,
			heightChanges: [],
		};

		this.animatingHexes = [];

		// Sort pieces by position for clockwise animation
		// Center first, then top, then clockwise
		const sortedPieces = piece.slice().sort((a, b) => {
			// Center hex goes first
			if (a.q === 0 && a.r === 0) return -1;
			if (b.q === 0 && b.r === 0) return 1;

			// Top hex (0, -1) goes second
			if (a.q === 0 && a.r === -1) return -1;
			if (b.q === 0 && b.r === -1) return 1;

			// Rest go clockwise - calculate angle from center
			const angleA = Math.atan2(a.r, a.q);
			const angleB = Math.atan2(b.r, b.q);

			// Adjust angles to start from top and go clockwise
			const adjustedA = (angleA + Math.PI * 2.5) % (Math.PI * 2);
			const adjustedB = (angleB + Math.PI * 2.5) % (Math.PI * 2);

			return adjustedA - adjustedB;
		});

		sortedPieces.forEach((tile, index) => {
			const hex = this.grid.getHex(centerQ + tile.q, centerR + tile.r);
			if (hex && hex.height > 0) {
				move.heightChanges.push({q: hex.q, r: hex.r, oldHeight: hex.height});

				// Stagger the animations - 100ms between each hex
				const delay = index * 100;

				this.animatingHexes.push({
					q: hex.q,
					r: hex.r,
					centerQ: centerQ,
					centerR: centerR,
					startHeight: hex.height,
					targetHeight: hex.height - 1,
					progress: 0,
					delay: delay,
				});
			}
		});

		this.animationStartTime = performance.now();
		this.requestAnimationFrame();

		// Update piece selection and UI immediately, before animation completes
		this.history.push(move);
		this.placedPieces.add(this.currentPieceIndex);
		this.findNextUnplacedPiece();
		this.updateUI();

		setTimeout(() => {
			piece.forEach((tile) => {
				const hex = this.grid.getHex(centerQ + tile.q, centerR + tile.r);
				if (hex && hex.height > 0) {
					hex.height--;
				}
			});

			this.checkWinCondition();
			this.render();
		}, this.animationDuration);
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

	cyclePiece(direction: number): void {
		this.currentPieceIndex = (this.currentPieceIndex + direction + this.pieces.length) % this.pieces.length;
		this.updateUI();
		this.render();
	}

	undo(): void {
		if (this.history.length === 0) return;

		const move = this.history.pop()!;
		this.redoStack.push(move);

		move.heightChanges.forEach((change) => {
			const hex = this.grid.getHex(change.q, change.r);
			if (hex) hex.height = change.oldHeight;
		});

		this.placedPieces.delete(move.pieceIndex);
		this.currentPieceIndex = move.pieceIndex;
		this.undoCount++;

		this.updateUI();
		this.render();
	}

	redo(): void {
		if (this.redoStack.length === 0) return;

		const move = this.redoStack.pop()!;
		this.currentPieceIndex = move.pieceIndex;
		this.placePiece(move.q, move.r);
	}

	toggleHint(): void {
		// If hint is already showing, hide it
		if (this.hintPos) {
			this.hintPos = null;
			if (this.hintTimeout) {
				clearTimeout(this.hintTimeout);
				this.hintTimeout = null;
			}
			this.render();
			return;
		}

		const solutionMove = this.solution.find((move) => move.pieceIndex === this.currentPieceIndex);

		if (solutionMove) {
			this.hintPos = {q: solutionMove.q, r: solutionMove.r};
			this.render();

			this.hintTimeout = window.setTimeout(() => {
				this.hintPos = null;
				this.hintTimeout = null;
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
		this.undoCount = 0;

		(document.getElementById('solutionStatus') as HTMLElement).textContent = '';
		(document.getElementById('mobileSolutionStatus') as HTMLElement).textContent = '';
		this.updateUI();
		this.render();
	}

	startNewGame(): void {
		document.getElementById('victoryScreen')!.classList.add('hidden');
		showDifficultyScreen();
	}

	restartAndHideVictory(): void {
		document.getElementById('victoryScreen')!.classList.add('hidden');
		this.restart();
	}

	private checkWinCondition(): void {
		const allZero = Array.from(this.grid.hexes.values()).every((hex) => hex.height === 0);
		if (allZero) {
			// Show victory screen
			const victoryScreen = document.getElementById('victoryScreen')!;
			victoryScreen.classList.remove('hidden');

			// Update stats
			(document.getElementById('victoryMoves') as HTMLElement).textContent = this.history.length.toString();
			(document.getElementById('victoryUndos') as HTMLElement).textContent = this.undoCount.toString();

			// Fire confetti!
			const duration = 3000;
			const animationEnd = Date.now() + duration;
			const defaults = {startVelocity: 30, spread: 360, ticks: 60, zIndex: 2100};

			function randomInRange(min: number, max: number) {
				return Math.random() * (max - min) + min;
			}

			const interval = setInterval(function () {
				const timeLeft = animationEnd - Date.now();

				if (timeLeft <= 0) {
					return clearInterval(interval);
				}

				const particleCount = 50 * (timeLeft / duration);
				// Since particles fall down, start a bit higher than random
				confetti({
					...defaults,
					particleCount,
					origin: {x: randomInRange(0.1, 0.3), y: Math.random() - 0.2},
					colors: ['#e94560', '#f39c12', '#3498db', '#2ecc71', '#9b59b6'],
				});
				confetti({
					...defaults,
					particleCount,
					origin: {x: randomInRange(0.7, 0.9), y: Math.random() - 0.2},
					colors: ['#e94560', '#f39c12', '#3498db', '#2ecc71', '#9b59b6'],
				});
			}, 250);

			// Also update the status text for accessibility
			const message = 'Congratulations! You solved it!';
			(document.getElementById('solutionStatus') as HTMLElement).textContent = message;
			(document.getElementById('mobileSolutionStatus') as HTMLElement).textContent = message;
		}
	}

	private handleMouseMove(event: MouseEvent): void {
		if (this.isPanning) {
			const deltaX = event.clientX - this.panStartX;
			const deltaY = event.clientY - this.panStartY;
			this.panOffsetX = deltaX;
			this.panOffsetY = deltaY;
			this.render();
			return;
		}

		const rect = this.canvas.getBoundingClientRect();
		const x = event.clientX - rect.left - this.canvas.width / 2 - this.panOffsetX;
		const y = event.clientY - rect.top - this.canvas.height / 2 - this.panOffsetY;

		const hex = this.grid.pixelToHex(x, y);
		if (this.grid.getHex(hex.q, hex.r)) {
			this.mouseHex = hex;
		} else {
			this.mouseHex = null;
		}

		this.render();
	}

	private handleMouseDown(event: MouseEvent): void {
		if (event.button === 0) {
			// Left button
			this.isPanning = true;
			this.panStartX = event.clientX - this.panOffsetX;
			this.panStartY = event.clientY - this.panOffsetY;
		}
	}

	private handleMouseUp(_event: MouseEvent): void {
		this.isPanning = false;
	}

	private handleHamsterWheel(delta: number, deltaY: number): void {
		// Use deltaY for vertical scrolling, fall back to delta if deltaY is 0
		const scrollDelta = deltaY === 0 ? delta : deltaY;

		// Detect and ignore pinch gestures which send very large delta values
		// Regular scroll events are typically under 100, pinch can be 300+
		if (Math.abs(scrollDelta) > 100) {
			return;
		}

		// Accumulate scroll delta to handle both mouse wheel and trackpad
		this.wheelAccumulator += scrollDelta;

		// Hamster.js normalizes values differently for mouse wheel vs trackpad
		// Mouse wheel typically returns ±3, trackpad returns smaller values
		const threshold = 30;

		if (Math.abs(this.wheelAccumulator) >= threshold) {
			const direction = this.wheelAccumulator > 0 ? 1 : -1;
			this.cyclePiece(direction);
			// Reset accumulator but keep the remainder for smooth scrolling
			this.wheelAccumulator = this.wheelAccumulator % threshold;
		}
	}

	private handleTouchStart(event: TouchEvent): void {
		event.preventDefault();

		if (event.touches.length === 1) {
			// Single touch - show piece preview and track position
			const touch = event.touches[0];
			const rect = this.canvas.getBoundingClientRect();
			const x = touch.clientX - rect.left - this.canvas.width / 2 - this.panOffsetX;
			const y = touch.clientY - rect.top - this.canvas.height / 2 - this.panOffsetY;

			const hex = this.grid.pixelToHex(x, y);
			if (this.grid.getHex(hex.q, hex.r)) {
				this.touchHex = hex;
				this.isTouching = true;
				this.showMobilePiecePreview = true;
				this.render();
			}
		} else if (event.touches.length === 2) {
			// Two touches - start pan/zoom
			this.touchHex = null;
			this.showMobilePiecePreview = false;
			this.isTouching = false;

			// Calculate initial pinch distance
			const touch1 = event.touches[0];
			const touch2 = event.touches[1];
			const dx = touch2.clientX - touch1.clientX;
			const dy = touch2.clientY - touch1.clientY;
			this.lastPinchDistance = Math.sqrt(dx * dx + dy * dy);

			// Calculate center point for panning
			const centerX = (touch1.clientX + touch2.clientX) / 2;
			const centerY = (touch1.clientY + touch2.clientY) / 2;
			this.panStartX = centerX - this.panOffsetX;
			this.panStartY = centerY - this.panOffsetY;
		}
	}

	private handleTouchMove(event: TouchEvent): void {
		event.preventDefault();

		if (event.touches.length === 1 && this.isTouching) {
			// Single touch - update position
			const touch = event.touches[0];
			const rect = this.canvas.getBoundingClientRect();
			const x = touch.clientX - rect.left - this.canvas.width / 2 - this.panOffsetX;
			const y = touch.clientY - rect.top - this.canvas.height / 2 - this.panOffsetY;

			const hex = this.grid.pixelToHex(x, y);
			if (this.grid.getHex(hex.q, hex.r)) {
				this.touchHex = hex;
			} else {
				this.touchHex = null;
			}
			this.render();
		} else if (event.touches.length === 2) {
			// Two touches - handle pan and zoom
			const touch1 = event.touches[0];
			const touch2 = event.touches[1];

			// Calculate new pinch distance
			const dx = touch2.clientX - touch1.clientX;
			const dy = touch2.clientY - touch1.clientY;
			const newPinchDistance = Math.sqrt(dx * dx + dy * dy);

			// Handle zoom
			if (this.lastPinchDistance !== null) {
				const scale = newPinchDistance / this.lastPinchDistance;
				this.zoom(scale);
			}
			this.lastPinchDistance = newPinchDistance;

			// Handle pan
			const centerX = (touch1.clientX + touch2.clientX) / 2;
			const centerY = (touch1.clientY + touch2.clientY) / 2;
			this.panOffsetX = centerX - this.panStartX;
			this.panOffsetY = centerY - this.panStartY;

			this.render();
		}
	}

	private handleTouchEnd(event: TouchEvent): void {
		event.preventDefault();

		if (event.touches.length === 0) {
			// All touches ended
			if (this.isTouching && this.touchHex && !this.placedPieces.has(this.currentPieceIndex)) {
				const piece = this.pieces[this.currentPieceIndex];
				if (this.canPlacePiece(piece, this.touchHex.q, this.touchHex.r)) {
					this.placePiece(this.touchHex.q, this.touchHex.r);
				} else {
					this.showInvalidPlacementFeedback(this.touchHex);
				}
			}

			this.touchHex = null;
			this.isTouching = false;
			this.showMobilePiecePreview = false;
			this.lastPinchDistance = null;
			this.render();
		} else if (event.touches.length === 1) {
			// Going from two touches to one
			this.lastPinchDistance = null;
			// Could restart single touch tracking here if needed
		}
	}

	private handleTouchCancel(_event: TouchEvent): void {
		this.touchHex = null;
		this.isTouching = false;
		this.showMobilePiecePreview = false;
		this.lastPinchDistance = null;
		this.render();
	}

	private handleClick(event: MouseEvent): void {
		// Don't place piece if we were panning
		if (this.isPanning) return;

		const rect = this.canvas.getBoundingClientRect();
		const x = event.clientX - rect.left - this.canvas.width / 2 - this.panOffsetX;
		const y = event.clientY - rect.top - this.canvas.height / 2 - this.panOffsetY;

		const hex = this.grid.pixelToHex(x, y);
		if (this.grid.getHex(hex.q, hex.r) && !this.placedPieces.has(this.currentPieceIndex)) {
			const piece = this.pieces[this.currentPieceIndex];
			if (this.canPlacePiece(piece, hex.q, hex.r)) {
				this.placePiece(hex.q, hex.r);
			} else {
				this.showInvalidPlacementFeedback(hex);
			}
		}
	}

	private handleKeyPress(event: KeyboardEvent): void {
		switch (event.key) {
			case 'ArrowUp':
				event.preventDefault();
				this.cyclePiece(-1);
				break;
			case 'ArrowDown':
				event.preventDefault();
				this.cyclePiece(1);
				break;
			case 'ArrowLeft':
				event.preventDefault();
				this.undo();
				break;
			case 'ArrowRight':
				event.preventDefault();
				this.redo();
				break;
			case '+':
			case '=':
				// Handle both + and = keys for zoom in
				this.zoom(1.1);
				break;
			case '-':
			case '_':
				this.zoom(0.9);
				break;
			case '?':
				this.toggleKeyboardShortcuts();
				break;
			case 'h':
			case 'H':
				this.toggleHint();
				break;
			case 'r':
			case 'R':
				this.resetView();
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

	resetView(): void {
		this.zoomFactor = 1.0;
		this.panOffsetX = 0;
		this.panOffsetY = 0;
		this.updateCanvasSize();
		this.grid.hexSize = this.hexSize;
		this.render();
	}

	private showInvalidPlacementFeedback(position: HexCoordinate): void {
		this.invalidPlacementAnimation = {
			isActive: true,
			startTime: performance.now(),
			position: position,
			// 1/3 second
			duration: 333,
		};
		this.requestAnimationFrame();
	}

	private toggleKeyboardShortcuts(): void {
		const modal = document.getElementById('keyboardShortcutsModal');
		if (modal) {
			modal.classList.toggle('hidden');
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
		this.ctx.translate(this.canvas.width / 2 + this.panOffsetX, this.canvas.height / 2 + this.panOffsetY);

		const fontSize = Math.max(12, Math.floor(this.hexSize * 0.5));

		// First pass: Draw all hexes in their target state (background)
		this.grid.hexes.forEach((hex) => {
			const pos = this.grid.hexToPixel(hex.q, hex.r);
			let displayHeight = hex.height;

			// Check if this hex is being animated
			const animatingHex = this.animatingHexes.find((h) => h.q === hex.q && h.r === hex.r);
			if (animatingHex) {
				// Show the target state as background
				displayHeight = animatingHex.targetHeight;
			}

			this.drawHex(pos.x, pos.y, this.colors[displayHeight] || '#000', '#0f3460', 2);

			if (displayHeight > 0) {
				this.ctx.fillStyle = '#fff';
				this.ctx.font = `bold ${fontSize}px Arial`;
				this.ctx.textAlign = 'center';
				this.ctx.textBaseline = 'middle';
				this.ctx.fillText(displayHeight.toString(), pos.x, pos.y);
			}
		});

		// Second pass: Draw animating hexes on top
		this.animatingHexes.forEach((animatingHex) => {
			const hex = this.grid.getHex(animatingHex.q, animatingHex.r);
			if (!hex) return;

			const pos = this.grid.hexToPixel(hex.q, hex.r);

			// Burst animation for all hexes
			this.ctx.save();
			this.ctx.translate(pos.x, pos.y);

			// Scale up and fade out for burst effect
			// Scale up to 150%
			const burstScale = 1 + animatingHex.progress * 0.5;
			const opacity = 1 - animatingHex.progress;

			this.ctx.globalAlpha = opacity;
			this.ctx.scale(burstScale, burstScale);

			// Draw the bursting hex
			this.drawHexOnCanvas(
				this.ctx,
				0,
				0,
				this.hexSize,
				this.colors[animatingHex.startHeight] || '#000',
				'#0f3460',
				2,
			);

			// Draw the number with burst effect
			if (animatingHex.startHeight > 0 && opacity > 0.1) {
				this.ctx.fillStyle = '#fff';
				this.ctx.font = `bold ${fontSize}px Arial`;
				this.ctx.textAlign = 'center';
				this.ctx.textBaseline = 'middle';
				this.ctx.fillText(animatingHex.startHeight.toString(), 0, 0);
			}

			this.ctx.restore();
		});

		const previewHex = this.mouseHex || this.touchHex;
		if (previewHex && !this.placedPieces.has(this.currentPieceIndex)) {
			const piece = this.pieces[this.currentPieceIndex];
			const canPlace = this.canPlacePiece(piece, previewHex.q, previewHex.r);

			piece.forEach((tile) => {
				const hex = this.grid.getHex(previewHex.q + tile.q, previewHex.r + tile.r);
				if (hex) {
					const pos = this.grid.hexToPixel(hex.q, hex.r);
					if (canPlace) {
						this.drawHex(pos.x, pos.y, 'rgba(255, 235, 59, 0.3)', '#ffeb3b', 3);
					} else {
						this.drawHex(pos.x, pos.y, 'rgba(244, 67, 54, 0.3)', '#f44336', 3);
					}
				}
			});
		}

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

		// Draw invalid placement animation
		if (this.invalidPlacementAnimation && this.invalidPlacementAnimation.isActive) {
			const elapsed = performance.now() - this.invalidPlacementAnimation.startTime;
			const progress = elapsed / this.invalidPlacementAnimation.duration;

			// Create a pulsing effect: scale from 1.0 to 1.3 and back
			// Two full pulses
			const pulseProgress = Math.sin(progress * Math.PI * 2);
			const scale = 1.0 + pulseProgress * 0.3;
			// Fade out over time
			const opacity = Math.max(0, 1 - progress);

			const piece = this.pieces[this.currentPieceIndex];
			piece.forEach((tile) => {
				const hex = this.grid.getHex(
					this.invalidPlacementAnimation!.position.q + tile.q,
					this.invalidPlacementAnimation!.position.r + tile.r,
				);
				if (hex) {
					const pos = this.grid.hexToPixel(hex.q, hex.r);

					this.ctx.save();
					this.ctx.translate(pos.x, pos.y);
					this.ctx.scale(scale, scale);
					this.ctx.globalAlpha = opacity;
					this.ctx.strokeStyle = '#f44336';
					this.ctx.lineWidth = 5;
					this.drawHexOutline(0, 0);
					this.ctx.restore();
				}
			});
		}

		this.ctx.restore();

		// Draw mobile piece preview overlay
		if (this.showMobilePiecePreview && !this.placedPieces.has(this.currentPieceIndex)) {
			const piece = this.pieces[this.currentPieceIndex];
			const previewSize = 80;
			const previewHexSize = 15;

			// Draw preview in top-right corner
			this.ctx.save();
			this.ctx.translate(this.canvas.width - previewSize - 20, 20);

			// Background
			this.ctx.fillStyle = 'rgba(22, 33, 62, 0.9)';
			this.ctx.fillRect(-10, -10, previewSize + 20, previewSize + 20);
			this.ctx.strokeStyle = '#0f3460';
			this.ctx.lineWidth = 2;
			this.ctx.strokeRect(-10, -10, previewSize + 20, previewSize + 20);

			// Draw piece
			this.ctx.translate(previewSize / 2, previewSize / 2);
			piece.forEach((tile) => {
				const x = previewHexSize * ((3 / 2) * tile.q);
				const y = previewHexSize * ((Math.sqrt(3) / 2) * tile.q + Math.sqrt(3) * tile.r);
				this.drawHexOnCanvas(this.ctx, x, y, previewHexSize, '#e94560', '#0f3460', 2);
			});

			this.ctx.restore();
		}
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

	private requestAnimationFrame(): void {
		if (
			(this.animationStartTime !== null && this.animatingHexes.length > 0) ||
			(this.invalidPlacementAnimation && this.invalidPlacementAnimation.isActive)
		) {
			requestAnimationFrame(() => this.animate());
		}
	}

	private animate(): void {
		const now = performance.now();
		let needsMoreFrames = false;

		// Handle piece placement animation
		if (this.animationStartTime !== null) {
			const elapsed = now - this.animationStartTime;
			const progress = Math.min(elapsed / this.animationDuration, 1);

			const easeInOutCubic = (t: number): number => {
				return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
			};

			this.animatingHexes.forEach((hex) => {
				// Apply delay to each hex
				const hexElapsed = Math.max(0, elapsed - hex.delay);
				// 400ms per hex animation
				const hexProgress = Math.min(hexElapsed / 400, 1);
				const easedHexProgress = easeInOutCubic(hexProgress);
				hex.progress = easedHexProgress;
			});

			if (progress < 1) {
				needsMoreFrames = true;
			} else {
				this.animatingHexes = [];
				this.animationStartTime = null;
			}
		}

		// Handle invalid placement animation
		if (this.invalidPlacementAnimation && this.invalidPlacementAnimation.isActive) {
			const elapsed = now - this.invalidPlacementAnimation.startTime;
			if (elapsed >= this.invalidPlacementAnimation.duration) {
				this.invalidPlacementAnimation = null;
			} else {
				needsMoreFrames = true;
			}
		}

		this.render();

		if (needsMoreFrames) {
			this.requestAnimationFrame();
		}
	}
}

window.startGame = startGame;
window.startCustomGame = startCustomGame;
window.validateCustomInputs = validateCustomInputs;
window.showDifficultyScreen = showDifficultyScreen;
window.game = game;

export {};
