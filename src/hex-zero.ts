import confetti from 'canvas-confetti';
import {GameState, type HexCoordinate, type Piece} from './game-state';
import {HexRenderer} from './renderer/HexRenderer';
import {DEFAULT_COLORS, type ColorMap} from './ui/ColorTheme';
import {CanvasManager} from './canvas/CanvasManager';

declare global {
	interface Window {
		startGame: (radius: number, numPieces: number) => void;
		startCustomGame: () => void;
		showDifficultyScreen: () => void;
		showInstructions: () => void;
		game: HexSeptominoGame | null;
	}
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

let game: HexSeptominoGame | null = null;

function startGame(radius: number, numPieces: number): void {
	document.getElementById('difficultyScreen')!.classList.add('hidden');
	document.getElementById('gameScreen')!.classList.remove('hidden');
	document.getElementById('mobileControls')!.classList.remove('hidden');

	if (game) {
		// Game instance exists, will be replaced
	}

	game = new HexSeptominoGame(radius, numPieces);
	window.game = game;
}

function startCustomGame(): void {
	const radius = parseInt((document.getElementById('customRadius') as HTMLInputElement).value);
	const pieces = parseInt((document.getElementById('customPieces') as HTMLInputElement).value);
	startGame(radius, pieces);
}

function showDifficultyScreen(): void {
	document.getElementById('gameScreen')!.classList.add('hidden');
	document.getElementById('mobileControls')!.classList.add('hidden');
	document.getElementById('difficultyScreen')!.classList.remove('hidden');
}

function showInstructions(): void {
	const modal = document.getElementById('instructionsModal');
	if (modal) {
		modal.classList.remove('hidden');
	}
}

function hideInstructions(): void {
	const modal = document.getElementById('instructionsModal');
	if (modal) {
		modal.classList.add('hidden');
	}
}

// Set up global instructions modal event listeners
window.addEventListener('DOMContentLoaded', () => {
	const instructionsModal = document.getElementById('instructionsModal');
	const instructionsOverlay = instructionsModal?.querySelector('.modal-overlay');
	const closeInstructionsBtn = document.getElementById('closeInstructionsBtn');
	const showInstructionsFromMenu = document.getElementById('showInstructionsFromMenu');

	if (closeInstructionsBtn) {
		closeInstructionsBtn.addEventListener('click', hideInstructions);
	}

	if (instructionsOverlay) {
		instructionsOverlay.addEventListener('click', hideInstructions);
	}

	if (showInstructionsFromMenu) {
		showInstructionsFromMenu.addEventListener('click', showInstructions);
	}

	// Handle ESC key for instructions modal
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && instructionsModal && !instructionsModal.classList.contains('hidden')) {
			hideInstructions();
		}
	});
});

class HexSeptominoGame {
	private canvasManager: CanvasManager;
	private gameState: GameState;
	private renderer: HexRenderer;
	private colors: ColorMap;
	private mouseHex: HexCoordinate | null;
	private touchHex: HexCoordinate | null;
	private isTouching: boolean;
	private zoomFactor: number;
	private hintPos: HexCoordinate | null;
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
	private isMobileDevice: boolean;
	private currentPreviewIndex: number;
	private invalidPlacementAnimation: {
		isActive: boolean;
		startTime: number;
		position: HexCoordinate;
		duration: number;
	} | null;

	private detectMobileDevice(): boolean {
		// Check for mobile user agents - most reliable method for real devices
		const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent,
		);

		// Check if viewport is mobile-sized - works for DevTools testing
		const mobileViewport = window.matchMedia('(max-width: 768px)').matches;

		return mobileUserAgent || mobileViewport;
	}

	private updateMobilePreviewState(): void {
		const previousIndex = this.currentPreviewIndex;
		this.currentPreviewIndex = this.gameState.getCurrentPieceIndex();

		if (this.isMobileDevice) {
			this.showMobilePiecePreview = !this.gameState.isPiecePlaced(this.currentPreviewIndex);
		} else {
			this.showMobilePiecePreview = false;
		}

		// Reset animation when showing a different piece
		if (this.showMobilePiecePreview && previousIndex !== this.currentPreviewIndex) {
			this.resetMobilePreviewAnimation();
		}

		this.updateMobilePreviewIndicator();
	}

	private resetMobilePreviewAnimation(): void {
		const indicator = document.getElementById('mobilePreviewIndicator');
		if (indicator) {
			// Force animation restart by removing and re-adding the class
			indicator.style.animation = 'none';
			// Force reflow
			void indicator.offsetHeight;
			indicator.style.animation = '';
		}
	}

	private updateMobilePreviewIndicator(): void {
		const indicator = document.getElementById('mobilePreviewIndicator');
		if (this.showMobilePiecePreview) {
			if (!indicator) {
				this.createMobilePreviewIndicator();
			} else {
				indicator.style.display = 'block';
				this.positionMobilePreviewIndicator(indicator);
			}
		} else if (indicator) {
			indicator.style.display = 'none';
		}
	}

	private positionMobilePreviewIndicator(indicator: HTMLElement): void {
		const canvas = this.canvasManager.getCanvas();
		const piece = this.gameState.getCurrentPiece();
		const previewSize = 80;
		const previewHexSize = 15;

		// Base position of preview area
		const baseX = canvas.width - previewSize - 20;
		const baseY = 20;

		// Center of preview area
		const previewCenterX = baseX + previewSize / 2;
		const previewCenterY = baseY + previewSize / 2;

		// Calculate where the center hex (0,0) is actually drawn
		// The piece is adjusted by its center offset, so hex at (0,0) in piece coordinates
		// is at (-piece.center.q, -piece.center.r) in the adjusted coordinates
		const adjustedQ = 0 - piece.center.q;
		const adjustedR = 0 - piece.center.r;
		const hexX = previewHexSize * ((3 / 2) * adjustedQ);
		const hexY = previewHexSize * ((Math.sqrt(3) / 2) * adjustedQ + Math.sqrt(3) * adjustedR);

		// Final position
		const centerX = previewCenterX + hexX;
		const centerY = previewCenterY + hexY;

		// Position indicator at center (subtract half indicator size)
		// Adjust 4 pixels left to correct positioning
		indicator.style.left = `${centerX - 8}px`;
		indicator.style.top = `${centerY - 4}px`;
	}

	private createMobilePreviewIndicator(): void {
		const canvas = this.canvasManager.getCanvas();
		const canvasContainer = canvas.parentElement;
		if (!canvasContainer) return;

		const indicator = document.createElement('div');
		indicator.id = 'mobilePreviewIndicator';
		indicator.className = 'mobile-preview-indicator';
		canvasContainer.appendChild(indicator);
		this.positionMobilePreviewIndicator(indicator);
	}

	constructor(radius: number, numPieces: number) {
		this.canvasManager = new CanvasManager('gameCanvas', 'piecePreview');
		this.gameState = new GameState(radius, numPieces);
		this.renderer = new HexRenderer(30);
		this.updateCanvasSize();

		this.colors = DEFAULT_COLORS;

		this.mouseHex = null;
		this.touchHex = null;
		this.isTouching = false;
		this.zoomFactor = 1.0;
		this.hintPos = null;
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
		this.isMobileDevice = this.detectMobileDevice();
		this.showMobilePiecePreview = this.isMobileDevice;
		this.currentPreviewIndex = 0;
		this.invalidPlacementAnimation = null;
		this.setupEventListeners();
		this.updateUI();
		this.render();
		this.renderPieceNavigation();

		setTimeout(() => {
			this.updateCanvasSize();
			this.render();
			this.renderPieceNavigation();
		}, 100);

		window.addEventListener('resize', () => {
			// Update mobile detection on resize (for DevTools viewport changes)
			const wasMobile = this.isMobileDevice;
			this.isMobileDevice = this.detectMobileDevice();

			// If mobile state changed, update preview visibility
			if (wasMobile !== this.isMobileDevice) {
				this.updateMobilePreviewState();
			}

			this.updateCanvasSize();
			this.render();
			this.renderPieceNavigation();

			// Update indicator position on resize
			const indicator = document.getElementById('mobilePreviewIndicator');
			if (indicator && this.showMobilePiecePreview) {
				this.positionMobilePreviewIndicator(indicator);
			}
		});
	}

	private updateCanvasSize(): void {
		const settings = this.gameState.getSettings();
		this.renderer.hexSize = this.canvasManager.updateCanvasSize(settings.radius, this.zoomFactor);
	}

	private setupEventListeners(): void {
		const canvas = this.canvasManager.getCanvas();
		canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
		canvas.addEventListener('click', (e) => this.handleClick(e));
		canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
		canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));

		canvas.addEventListener(
			'wheel',
			(e) => {
				e.preventDefault();

				// Only handle vertical scrolling
				if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
					this.handleWheelEvent(e);
				}
			},
			{passive: false},
		);
		canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), {passive: false});
		canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), {passive: false});
		canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), {passive: false});
		canvas.addEventListener('touchcancel', (e) => this.handleTouchCancel(e));
		canvas.addEventListener('mouseleave', () => {
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

		// Instructions navigation from shortcuts modal
		const showInstructionsFromShortcuts = document.getElementById('showInstructionsFromShortcuts');
		if (showInstructionsFromShortcuts) {
			showInstructionsFromShortcuts.addEventListener('click', () => {
				this.toggleKeyboardShortcuts();
				showInstructions();
			});
		}

		// Close modals on ESC key
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				if (modal && !modal.classList.contains('hidden')) {
					this.toggleKeyboardShortcuts();
				}
			}
		});
	}

	private canPlacePiece(piece: Piece, centerQ: number, centerR: number, checkHeight: boolean = true): boolean {
		return this.gameState.canPlacePiece(piece, centerQ, centerR, checkHeight);
	}

	private placePiece(centerQ: number, centerR: number): void {
		// Clear any active hint when placing a piece
		this.clearHint();

		const piece = this.gameState.getCurrentPiece();
		const grid = this.gameState.getGrid();

		this.animatingHexes = [];

		// Sort pieces by position for clockwise animation
		const sortedPieces = piece.tiles.slice().sort((a, b) => {
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
			const adjustedQ = centerQ + tile.q - piece.center.q;
			const adjustedR = centerR + tile.r - piece.center.r;
			const hex = grid.getHex(adjustedQ, adjustedR);
			if (hex && hex.height > 0) {
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

		const placed = this.gameState.placePiece(centerQ, centerR);
		if (!placed) return;

		this.animationStartTime = performance.now();
		this.requestAnimationFrame();

		this.updateUI();

		setTimeout(() => {
			this.checkWinCondition();
			this.render();
			this.renderPieceNavigation();
		}, this.animationDuration);
	}

	cyclePiece(direction: number): void {
		const cycled = this.gameState.cyclePiece(direction);
		if (cycled) {
			this.updateUI();
			this.render();
			this.renderPieceNavigation();
		}
	}

	undo(): void {
		const undone = this.gameState.undo();
		if (undone) {
			this.updateUI();
			this.render();
			this.renderPieceNavigation();
		}
	}

	redo(): void {
		const redone = this.gameState.redo();
		if (redone) {
			this.updateUI();
			this.render();
			this.renderPieceNavigation();
		}
	}

	private clearHint(): void {
		this.hintPos = null;
		if (this.hintTimeout) {
			clearTimeout(this.hintTimeout);
			this.hintTimeout = null;
		}
	}

	toggleHint(): void {
		// If hint is already showing, hide it
		if (this.hintPos) {
			this.clearHint();
			this.render();
			return;
		}

		const hint = this.gameState.getSolutionHint();

		if (hint) {
			this.hintPos = hint;
			this.gameState.incrementHintCount();
			this.render();

			this.hintTimeout = window.setTimeout(() => {
				this.hintPos = null;
				this.hintTimeout = null;
				this.render();
			}, 2000);
		}
	}

	private restart(): void {
		this.gameState.restart();
		this.clearHint();

		(document.getElementById('solutionStatus') as HTMLElement).textContent = '';
		(document.getElementById('mobileSolutionStatus') as HTMLElement).textContent = '';
		this.updateUI();
		this.render();
		this.renderPieceNavigation();
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
		if (this.gameState.isGameWon()) {
			const victoryScreen = document.getElementById('victoryScreen')!;
			victoryScreen.classList.remove('hidden');

			// Update stats
			(document.getElementById('victoryDifficulty') as HTMLElement).textContent = this.gameState.getDifficulty();
			(document.getElementById('victoryUndos') as HTMLElement).textContent = this.gameState
				.getUndoCount()
				.toString();
			(document.getElementById('victoryHints') as HTMLElement).textContent = this.gameState
				.getHintCount()
				.toString();
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

		const canvas = this.canvasManager.getCanvas();
		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left - canvas.width / 2 - this.panOffsetX;
		const y = event.clientY - rect.top - canvas.height / 2 - this.panOffsetY;

		const hex = this.renderer.pixelToHex(x, y);
		const grid = this.gameState.getGrid();
		if (grid.getHex(hex.q, hex.r)) {
			this.mouseHex = hex;
		} else {
			this.mouseHex = null;
		}

		this.render();
	}

	private handleMouseDown(event: MouseEvent): void {
		if (event.button === 0) {
			this.isPanning = true;
			this.panStartX = event.clientX - this.panOffsetX;
			this.panStartY = event.clientY - this.panOffsetY;
		}
	}

	private handleMouseUp(_event: MouseEvent): void {
		this.isPanning = false;
	}

	private lastWheelTime: number = 0;
	private consecutiveSmallDeltas: number = 0;
	private handleWheelEvent(event: WheelEvent): void {
		// Normalize the delta based on deltaMode
		let normalizedDelta = event.deltaY;

		// deltaMode: 0 = pixels, 1 = lines, 2 = pages
		if (event.deltaMode === 1) {
			// Line mode - multiply by standard line height
			normalizedDelta *= 40;
		} else if (event.deltaMode === 2) {
			// Page mode - multiply by standard page height
			normalizedDelta *= 800;
		}

		const now = Date.now();
		const timeSinceLastWheel = now - this.lastWheelTime;
		const absDelta = Math.abs(normalizedDelta);

		// Simple approach: any scroll in a direction changes the piece
		// but with rate limiting to prevent too fast scrolling
		const direction = Math.sign(normalizedDelta);

		if (direction === 0) return;

		// Track consecutive small deltas to detect trackpad
		if (absDelta < 4) {
			this.consecutiveSmallDeltas++;
		} else {
			this.consecutiveSmallDeltas = 0;
		}

		// Determine rate limit based on input type
		const isTrackpad = this.consecutiveSmallDeltas > 2;
		// Slower for trackpad
		const minDelay = isTrackpad ? 200 : 120;

		// Rate limiting: don't cycle too fast
		if (timeSinceLastWheel >= minDelay || this.lastWheelTime === 0) {
			this.cyclePiece(direction);
			this.lastWheelTime = now;
		}
	}

	private handleTouchStart(event: TouchEvent): void {
		event.preventDefault();

		if (event.touches.length === 1) {
			// Single touch - show piece preview and track position
			const touch = event.touches[0];
			const canvas = this.canvasManager.getCanvas();
			const rect = canvas.getBoundingClientRect();
			const x = touch.clientX - rect.left - canvas.width / 2 - this.panOffsetX;
			const y = touch.clientY - rect.top - canvas.height / 2 - this.panOffsetY;

			const hex = this.renderer.pixelToHex(x, y);
			const grid = this.gameState.getGrid();
			if (grid.getHex(hex.q, hex.r)) {
				this.touchHex = hex;
				this.isTouching = true;
				// On non-mobile devices, show preview only during touch
				if (!this.isMobileDevice) {
					this.showMobilePiecePreview = true;
				}
				this.render();
			}
		} else if (event.touches.length === 2) {
			// Two touches - start pan/zoom
			this.touchHex = null;
			this.showMobilePiecePreview = false;
			this.isTouching = false;

			const touch1 = event.touches[0];
			const touch2 = event.touches[1];
			const dx = touch2.clientX - touch1.clientX;
			const dy = touch2.clientY - touch1.clientY;
			this.lastPinchDistance = Math.sqrt(dx * dx + dy * dy);
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
			const canvas = this.canvasManager.getCanvas();
			const rect = canvas.getBoundingClientRect();
			const x = touch.clientX - rect.left - canvas.width / 2 - this.panOffsetX;
			const y = touch.clientY - rect.top - canvas.height / 2 - this.panOffsetY;

			const hex = this.renderer.pixelToHex(x, y);
			const grid = this.gameState.getGrid();
			if (grid.getHex(hex.q, hex.r)) {
				this.touchHex = hex;
			} else {
				this.touchHex = null;
			}
			this.render();
		} else if (event.touches.length === 2) {
			// Two touches - handle pan and zoom
			const touch1 = event.touches[0];
			const touch2 = event.touches[1];

			const dx = touch2.clientX - touch1.clientX;
			const dy = touch2.clientY - touch1.clientY;
			const newPinchDistance = Math.sqrt(dx * dx + dy * dy);
			if (this.lastPinchDistance !== null) {
				const scale = newPinchDistance / this.lastPinchDistance;
				this.zoom(scale);
			}
			this.lastPinchDistance = newPinchDistance;

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
			if (
				this.isTouching &&
				this.touchHex &&
				!this.gameState.isPiecePlaced(this.gameState.getCurrentPieceIndex())
			) {
				const piece = this.gameState.getCurrentPiece();
				if (this.canPlacePiece(piece, this.touchHex.q, this.touchHex.r)) {
					this.placePiece(this.touchHex.q, this.touchHex.r);
				} else {
					this.showInvalidPlacementFeedback(this.touchHex);
				}
			}

			this.touchHex = null;
			this.isTouching = false;
			// On mobile devices, restore the preview; on desktop, hide it
			if (this.isMobileDevice) {
				this.showMobilePiecePreview = !this.gameState.isPiecePlaced(this.gameState.getCurrentPieceIndex());
			} else {
				this.showMobilePiecePreview = false;
			}
			this.lastPinchDistance = null;
			this.render();
		} else if (event.touches.length === 1) {
			// Going from two touches to one
			this.lastPinchDistance = null;
			// Restore mobile preview on mobile devices when returning to single touch
			if (this.isMobileDevice) {
				this.showMobilePiecePreview = !this.gameState.isPiecePlaced(this.gameState.getCurrentPieceIndex());
			}
		}
	}

	private handleTouchCancel(_event: TouchEvent): void {
		this.touchHex = null;
		this.isTouching = false;
		// On mobile devices, restore the preview; on desktop, hide it
		if (this.isMobileDevice) {
			this.showMobilePiecePreview = !this.gameState.isPiecePlaced(this.gameState.getCurrentPieceIndex());
		} else {
			this.showMobilePiecePreview = false;
		}
		this.lastPinchDistance = null;
		this.render();
	}

	private handleClick(event: MouseEvent): void {
		// Don't place piece if we were panning
		if (this.isPanning) return;

		const canvas = this.canvasManager.getCanvas();
		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left - canvas.width / 2 - this.panOffsetX;
		const y = event.clientY - rect.top - canvas.height / 2 - this.panOffsetY;

		const hex = this.renderer.pixelToHex(x, y);
		const grid = this.gameState.getGrid();
		if (grid.getHex(hex.q, hex.r) && !this.gameState.isPiecePlaced(this.gameState.getCurrentPieceIndex())) {
			const piece = this.gameState.getCurrentPiece();
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
			case 'i':
			case 'I':
				showInstructions();
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
			this.render();
		}
	}

	resetView(): void {
		this.zoomFactor = 1.0;
		this.panOffsetX = 0;
		this.panOffsetY = 0;
		this.updateCanvasSize();
		this.render();
	}

	resetGame(): void {
		while (this.gameState.canUndo()) {
			this.gameState.undo();
		}
		this.clearHint();
		this.updateUI();
		this.render();
		this.renderPieceNavigation();
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
		const currentIndex = this.gameState.getCurrentPieceIndex();
		const pieces = this.gameState.getPieces();
		const pieceText = `Piece ${currentIndex + 1} of ${pieces.length}`;
		(document.getElementById('pieceNumber') as HTMLElement).textContent = pieceText;
		(document.getElementById('mobilePieceInfo') as HTMLElement).textContent = pieceText;

		(document.getElementById('piecePlaced') as HTMLElement).style.display = this.gameState.isPiecePlaced(
			currentIndex,
		)
			? 'block'
			: 'none';

		if (!this.gameState.getAllPiecesPlaced()) {
			(document.getElementById('solutionStatus') as HTMLElement).textContent = '';
			(document.getElementById('mobileSolutionStatus') as HTMLElement).textContent = '';
		}

		// Update mobile preview state
		this.updateMobilePreviewState();

		this.renderPiecePreview();
	}

	private render(): void {
		const canvas = this.canvasManager.getCanvas();
		const ctx = this.canvasManager.getContext();

		this.canvasManager.clearCanvas('#0f3460');

		ctx.save();
		ctx.translate(canvas.width / 2 + this.panOffsetX, canvas.height / 2 + this.panOffsetY);

		const fontSize = Math.max(12, Math.floor(this.renderer.hexSize * 0.5));
		const grid = this.gameState.getGrid();

		// First pass: Draw all hexes in their target state (background)
		grid.hexes.forEach((hex) => {
			const pos = this.renderer.hexToPixel(hex.q, hex.r);
			let displayHeight = hex.height;

			// Check if this hex is being animated
			const animatingHex = this.animatingHexes.find((h) => h.q === hex.q && h.r === hex.r);
			if (animatingHex) {
				// Show the target state as background
				displayHeight = animatingHex.targetHeight;
			}

			// For heights > 10, cycle through darker grays
			const color = this.colors[displayHeight] || (displayHeight > 10 ? '#1a1a1a' : '#000');
			this.drawHex(ctx, pos.x, pos.y, color, '#0f3460', 2);

			if (displayHeight > 0) {
				ctx.fillStyle = '#fff';
				ctx.font = `bold ${fontSize}px Arial`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(displayHeight.toString(), pos.x, pos.y);
			}
		});

		// Second pass: Draw animating hexes on top
		this.animatingHexes.forEach((animatingHex) => {
			const hex = grid.getHex(animatingHex.q, animatingHex.r);
			if (!hex) return;

			const pos = this.renderer.hexToPixel(hex.q, hex.r);

			// Burst animation for all hexes
			ctx.save();
			ctx.translate(pos.x, pos.y);

			// Scale up and fade out for burst effect
			// Scale up to 150%
			const burstScale = 1 + animatingHex.progress * 0.5;
			const opacity = 1 - animatingHex.progress;

			ctx.globalAlpha = opacity;
			ctx.scale(burstScale, burstScale);

			// Draw the bursting hex
			this.canvasManager.drawHexOnCanvas(
				ctx,
				0,
				0,
				this.renderer.hexSize,
				this.colors[animatingHex.startHeight] || (animatingHex.startHeight > 10 ? '#1a1a1a' : '#000'),
				'#0f3460',
				2,
			);

			// Draw the number with burst effect
			if (animatingHex.startHeight > 0 && opacity > 0.1) {
				ctx.fillStyle = '#fff';
				ctx.font = `bold ${fontSize}px Arial`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(animatingHex.startHeight.toString(), 0, 0);
			}

			ctx.restore();
		});

		const previewHex = this.mouseHex || this.touchHex;
		if (previewHex && !this.gameState.isPiecePlaced(this.gameState.getCurrentPieceIndex())) {
			const piece = this.gameState.getCurrentPiece();
			const canPlace = this.canPlacePiece(piece, previewHex.q, previewHex.r);

			piece.tiles.forEach((tile) => {
				const adjustedQ = previewHex.q + tile.q - piece.center.q;
				const adjustedR = previewHex.r + tile.r - piece.center.r;
				const hex = grid.getHex(adjustedQ, adjustedR);
				if (hex) {
					const pos = this.renderer.hexToPixel(hex.q, hex.r);
					if (canPlace) {
						this.drawHex(ctx, pos.x, pos.y, 'rgba(255, 235, 59, 0.3)', '#ffeb3b', 3);
					} else {
						this.drawHex(ctx, pos.x, pos.y, 'rgba(244, 67, 54, 0.3)', '#f44336', 3);
					}
				}
			});
		}

		if (this.hintPos) {
			const piece = this.gameState.getCurrentPiece();
			piece.tiles.forEach((tile) => {
				const adjustedQ = this.hintPos!.q + tile.q - piece.center.q;
				const adjustedR = this.hintPos!.r + tile.r - piece.center.r;
				const hex = grid.getHex(adjustedQ, adjustedR);
				if (hex) {
					const pos = this.renderer.hexToPixel(hex.q, hex.r);
					ctx.strokeStyle = '#e94560';
					ctx.lineWidth = 4;
					ctx.setLineDash([5, 5]);
					this.drawHexOutline(ctx, pos.x, pos.y);
					ctx.setLineDash([]);
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

			const piece = this.gameState.getCurrentPiece();
			piece.tiles.forEach((tile) => {
				const adjustedQ = this.invalidPlacementAnimation!.position.q + tile.q - piece.center.q;
				const adjustedR = this.invalidPlacementAnimation!.position.r + tile.r - piece.center.r;
				const hex = grid.getHex(adjustedQ, adjustedR);
				if (hex) {
					const pos = this.renderer.hexToPixel(hex.q, hex.r);

					ctx.save();
					ctx.translate(pos.x, pos.y);
					ctx.scale(scale, scale);
					ctx.globalAlpha = opacity;
					ctx.strokeStyle = '#f44336';
					ctx.lineWidth = 5;
					this.drawHexOutline(ctx, 0, 0);
					ctx.restore();
				}
			});
		}

		ctx.restore();

		// Draw mobile piece preview overlay
		if (this.showMobilePiecePreview && !this.gameState.isPiecePlaced(this.gameState.getCurrentPieceIndex())) {
			const piece = this.gameState.getCurrentPiece();
			const previewSize = 80;
			const previewHexSize = 15;

			// Draw preview in top-right corner
			ctx.save();
			ctx.translate(canvas.width - previewSize - 20, 20);

			// Background
			ctx.fillStyle = 'rgba(22, 33, 62, 0.9)';
			ctx.fillRect(-10, -10, previewSize + 20, previewSize + 20);
			ctx.strokeStyle = '#0f3460';
			ctx.lineWidth = 2;
			ctx.strokeRect(-10, -10, previewSize + 20, previewSize + 20);

			// Draw piece
			ctx.translate(previewSize / 2, previewSize / 2);
			piece.tiles.forEach((tile) => {
				// Adjust for piece center
				const adjustedQ = tile.q - piece.center.q;
				const adjustedR = tile.r - piece.center.r;
				const x = previewHexSize * ((3 / 2) * adjustedQ);
				const y = previewHexSize * ((Math.sqrt(3) / 2) * adjustedQ + Math.sqrt(3) * adjustedR);
				this.canvasManager.drawHexOnCanvas(ctx, x, y, previewHexSize, '#e94560', '#0f3460', 2);
			});

			ctx.restore();
		}
	}

	private renderPiecePreview(): void {
		this.canvasManager.clearPreviewCanvas('#16213e');
		const ctx = this.canvasManager.getPreviewContext();
		const previewCanvas = this.canvasManager.getPreviewCanvas();

		const piece = this.gameState.getCurrentPiece();
		const currentIndex = this.gameState.getCurrentPieceIndex();
		const previewHexSize = 20;

		ctx.save();
		ctx.translate(previewCanvas.width / 2, previewCanvas.height / 2);

		const color = this.gameState.isPiecePlaced(currentIndex) ? '#666' : '#e94560';

		piece.tiles.forEach((tile) => {
			// Adjust for piece center
			const adjustedQ = tile.q - piece.center.q;
			const adjustedR = tile.r - piece.center.r;
			const x = previewHexSize * ((3 / 2) * adjustedQ);
			const y = previewHexSize * ((Math.sqrt(3) / 2) * adjustedQ + Math.sqrt(3) * adjustedR);
			this.canvasManager.drawHexOnCanvas(ctx, x, y, previewHexSize, color, '#0f3460', 2);
		});

		ctx.restore();
	}

	private renderPieceNavigation(): void {
		this.renderPieceNavigationCanvas('prevPiece', this.gameState.getPreviousPieceIndex());
		this.renderPieceNavigationCanvas('nextPiece', this.gameState.getNextPieceIndex());
		this.renderPieceNavigationCanvas('mobilePrevPiece', this.gameState.getPreviousPieceIndex());
		this.renderPieceNavigationCanvas('mobileNextPiece', this.gameState.getNextPieceIndex());
	}

	private renderPieceNavigationCanvas(canvasId: string, pieceIndex: number | null): void {
		const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const parent = canvas.parentElement;
		if (!parent) return;

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		if (pieceIndex === null) {
			// No piece available - show disabled state
			parent.classList.add('disabled');
			ctx.fillStyle = '#333';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			return;
		}

		// Enable button
		parent.classList.remove('disabled');

		const piece = this.gameState.getPieceByIndex(pieceIndex);
		if (!piece) return;

		const previewHexSize = Math.min(canvas.width, canvas.height) / 8;

		ctx.save();
		ctx.translate(canvas.width / 2, canvas.height / 2);

		const color = this.gameState.isPiecePlaced(pieceIndex) ? '#666' : '#e94560';

		piece.tiles.forEach((tile) => {
			// Adjust for piece center
			const adjustedQ = tile.q - piece.center.q;
			const adjustedR = tile.r - piece.center.r;
			const x = previewHexSize * ((3 / 2) * adjustedQ);
			const y = previewHexSize * ((Math.sqrt(3) / 2) * adjustedQ + Math.sqrt(3) * adjustedR);
			this.drawPieceNavigationHex(ctx, x, y, previewHexSize, color);
		});

		ctx.restore();
	}

	private drawPieceNavigationHex(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		size: number,
		color: string,
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
		ctx.fillStyle = color;
		ctx.fill();
		ctx.strokeStyle = '#0f3460';
		ctx.lineWidth = 1;
		ctx.stroke();
	}

	private drawHex(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		fillColor: string,
		strokeColor: string,
		lineWidth: number,
	): void {
		this.canvasManager.drawHexOnCanvas(ctx, x, y, this.renderer.hexSize, fillColor, strokeColor, lineWidth);
	}

	private drawHexOutline(ctx: CanvasRenderingContext2D, x: number, y: number): void {
		ctx.beginPath();
		for (let i = 0; i < 6; i++) {
			const angle = (Math.PI / 3) * i;
			const hx = x + this.renderer.hexSize * Math.cos(angle);
			const hy = y + this.renderer.hexSize * Math.sin(angle);
			if (i === 0) {
				ctx.moveTo(hx, hy);
			} else {
				ctx.lineTo(hx, hy);
			}
		}
		ctx.closePath();
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

	private handlePiecePlacementAnimation(now: number): boolean {
		if (this.animationStartTime === null) {
			return false;
		}

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
			return true;
		} else {
			this.animatingHexes = [];
			this.animationStartTime = null;
			return false;
		}
	}

	private handleInvalidPlacementAnimation(now: number): boolean {
		if (!this.invalidPlacementAnimation || !this.invalidPlacementAnimation.isActive) {
			return false;
		}

		const elapsed = now - this.invalidPlacementAnimation.startTime;
		if (elapsed >= this.invalidPlacementAnimation.duration) {
			this.invalidPlacementAnimation = null;
			return false;
		} else {
			return true;
		}
	}

	private animate(): void {
		const now = performance.now();
		let needsMoreFrames = false;

		needsMoreFrames = this.handlePiecePlacementAnimation(now) || needsMoreFrames;
		needsMoreFrames = this.handleInvalidPlacementAnimation(now) || needsMoreFrames;

		this.render();

		if (needsMoreFrames) {
			this.requestAnimationFrame();
		}
	}
}

window.startGame = startGame;
window.startCustomGame = startCustomGame;
window.showDifficultyScreen = showDifficultyScreen;
window.showInstructions = showInstructions;
window.game = game;

export {};
