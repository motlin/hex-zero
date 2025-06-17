import confetti from 'canvas-confetti';
import {GameState, type HexCoordinate, type Piece} from './game-state';
import {HexRenderer} from './renderer/HexRenderer';
import {DEFAULT_COLORS, type ColorMap} from './ui/ColorTheme';
import {CanvasManager} from './canvas/CanvasManager';
import {AchievementManager} from './achievements/AchievementManager';
import {DifficultyLevel} from './achievements/AchievementDefinitions';

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
let globalAchievementManager: AchievementManager | null = null;

function startGame(radius: number, numPieces: number): void {
	document.getElementById('difficultyScreen')!.classList.add('hidden');
	document.getElementById('gameScreen')!.classList.remove('hidden');

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
	const dontShowAgain = document.getElementById('dontShowAgain') as HTMLInputElement;

	if (modal) {
		modal.classList.add('hidden');
	}

	// Update the preference if checkbox is checked
	if (dontShowAgain?.checked) {
		localStorage.setItem('hexZeroDontShowInstructions', 'true');
	}
}

// Set up global instructions modal event listeners
window.addEventListener('DOMContentLoaded', () => {
	// Initialize global achievement manager
	globalAchievementManager = new AchievementManager();
	globalAchievementManager.initialize();

	const instructionsModal = document.getElementById('instructionsModal');
	const instructionsOverlay = instructionsModal?.querySelector('.modal-overlay');
	const closeInstructionsBtn = document.getElementById('closeInstructionsBtn');

	if (closeInstructionsBtn) {
		closeInstructionsBtn.addEventListener('click', hideInstructions);
	}

	if (instructionsOverlay) {
		instructionsOverlay.addEventListener('click', hideInstructions);
	}

	// Set up in-game hamburger menu (global, not per-game)
	const hamburgerBtn = document.getElementById('hamburgerBtn') as HTMLElement;
	const hamburgerMenu = document.getElementById('hamburgerMenu') as HTMLElement;

	if (hamburgerBtn && hamburgerMenu) {
		hamburgerBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			hamburgerMenu.classList.toggle('hidden');
		});

		// Close hamburger menu when clicking outside
		document.addEventListener('click', (e) => {
			if (!hamburgerBtn.contains(e.target as Node) && !hamburgerMenu.contains(e.target as Node)) {
				hamburgerMenu.classList.add('hidden');
			}
		});

		// Close hamburger menu after clicking a menu item
		hamburgerMenu.addEventListener('click', () => {
			setTimeout(() => hamburgerMenu.classList.add('hidden'), 100);
		});
	}

	// Set up in-game menu buttons (global handlers)
	const newGameBtn = document.getElementById('newGameBtn');
	if (newGameBtn) {
		newGameBtn.addEventListener('click', () => showDifficultyScreen());
	}

	const restartBtn = document.getElementById('restartBtn');
	if (restartBtn) {
		restartBtn.addEventListener('click', () => {
			if (window.game) {
				window.game.restart();
			}
		});
	}

	const howToPlayBtn = document.getElementById('howToPlayBtn');
	if (howToPlayBtn) {
		howToPlayBtn.addEventListener('click', () => showInstructions());
	}

	const achievementsButton = document.getElementById('achievementsButton');
	if (achievementsButton) {
		achievementsButton.addEventListener('click', () => {
			globalAchievementManager?.showAchievements();
		});
	}

	// Menu hamburger button on difficulty screen
	const menuHamburgerBtn = document.getElementById('menuHamburgerBtn');
	const menuHamburgerMenu = document.getElementById('menuHamburgerMenu');
	const howToPlayMenuBtn = document.getElementById('howToPlayMenuBtn');

	if (menuHamburgerBtn && menuHamburgerMenu) {
		menuHamburgerBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			menuHamburgerMenu.classList.toggle('hidden');
		});

		// Close menu when clicking outside
		document.addEventListener('click', (e) => {
			if (!menuHamburgerBtn.contains(e.target as Node) && !menuHamburgerMenu.contains(e.target as Node)) {
				menuHamburgerMenu.classList.add('hidden');
			}
		});
	}

	if (howToPlayMenuBtn) {
		howToPlayMenuBtn.addEventListener('click', () => {
			menuHamburgerMenu?.classList.add('hidden');
			showInstructions();
		});
	}

	// Menu achievements button
	const menuAchievementsButton = document.getElementById('menuAchievementsButton');
	if (menuAchievementsButton && globalAchievementManager) {
		menuAchievementsButton.addEventListener('click', () => {
			menuHamburgerMenu?.classList.add('hidden');
			globalAchievementManager?.showAchievements();
		});
		// Update the button text with achievement count
		const count = globalAchievementManager.getUnlockedCount();
		const total = globalAchievementManager.getTotalCount();
		menuAchievementsButton.textContent = `🏆 Achievements (${count}/${total})`;
	}

	// Check if first-time player and if they want to see instructions
	const isFirstTime = localStorage.getItem('hexZeroFirstTime') === null;
	const dontShowInstructions = localStorage.getItem('hexZeroDontShowInstructions') === 'true';

	if (isFirstTime && !dontShowInstructions) {
		// Show instructions automatically for first-time players
		showInstructions();
		localStorage.setItem('hexZeroFirstTime', 'false');
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
	private invalidPlacementAnimation: {
		isActive: boolean;
		startTime: number;
		position: HexCoordinate;
		duration: number;
	} | null;
	private achievementManager: AchievementManager;

	// Bottom panel drag and drop state
	private currentPage: number;
	private piecesPerPage: number;
	private isDragging: boolean;
	private draggedPieceIndex: number | null;
	private draggedPieceElement: HTMLElement | null;
	private dragPreviewElement: HTMLElement | null;
	private dragHoverHex: HexCoordinate | null;

	// Swipe state for pieces panel
	private swipeStartX: number | null;
	private swipeStartY: number | null;
	private isSwipingPanel: boolean;

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
		this.invalidPlacementAnimation = null;

		// Initialize bottom panel state
		this.currentPage = 0;
		// Start with 3 pieces per page as suggested
		this.piecesPerPage = 3;
		this.isDragging = false;
		this.draggedPieceIndex = null;
		this.draggedPieceElement = null;
		this.dragPreviewElement = null;
		this.dragHoverHex = null;

		// Initialize swipe state
		this.swipeStartX = null;
		this.swipeStartY = null;
		this.isSwipingPanel = false;

		// Use global achievement manager
		this.achievementManager = globalAchievementManager!;
		this.achievementManager.trackGameStart();

		this.setupEventListeners();
		this.updateUI();
		this.render();
		this.renderBottomPanel();

		setTimeout(() => {
			this.updateCanvasSize();
			this.render();
			this.renderBottomPanel();
		}, 100);

		window.addEventListener('resize', () => {
			this.updateCanvasSize();
			this.render();
			this.renderBottomPanel();
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

		// Undo/Redo buttons
		(document.getElementById('undoBtn') as HTMLElement).addEventListener('click', () => this.undo());
		(document.getElementById('redoBtn') as HTMLElement).addEventListener('click', () => this.redo());

		// More pieces button
		(document.getElementById('morePiecesBtn') as HTMLElement).addEventListener('click', () => this.morePieces());

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

		// Setup swipe handlers for pieces panel
		this.setupPanelSwipeHandlers();
	}

	private setupPanelSwipeHandlers(): void {
		const piecesContainer = document.getElementById('piecesContainer');
		if (!piecesContainer) return;

		// Track multi-touch swipe gestures
		piecesContainer.addEventListener(
			'touchstart',
			(e) => {
				// Only track if multiple fingers are touching
				if (e.touches.length >= 2) {
					this.swipeStartX = e.touches[0].clientX;
					this.swipeStartY = e.touches[0].clientY;
					this.isSwipingPanel = true;
					// Clear any existing touch hex to prevent preview interference
					this.touchHex = null;
					this.isTouching = false;
				}
			},
			{passive: true},
		);

		piecesContainer.addEventListener(
			'touchmove',
			(e) => {
				// Only process swipe if we started with 2+ fingers
				if (this.isSwipingPanel && e.touches.length >= 2 && this.swipeStartX !== null) {
					// Prevent any default behavior during multi-touch swipe
					e.preventDefault();
				}
			},
			{passive: false},
		);

		piecesContainer.addEventListener(
			'touchend',
			(e) => {
				// Complete the swipe if we were tracking one
				if (this.isSwipingPanel && this.swipeStartX !== null && this.swipeStartY !== null) {
					// Get the last touch position before release
					const touch = e.changedTouches[0];
					const deltaX = touch.clientX - this.swipeStartX;
					const deltaY = touch.clientY - this.swipeStartY;

					// Check if horizontal swipe is dominant and exceeds threshold
					// Threshold in pixels
					const swipeThreshold = 50;
					if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
						if (deltaX > 0) {
							// Swipe right - go to previous page
							this.previousPage();
						} else {
							// Swipe left - go to next page
							this.nextPage();
						}
					}

					// Reset swipe state
					this.swipeStartX = null;
					this.swipeStartY = null;
					this.isSwipingPanel = false;
				}
			},
			{passive: true},
		);

		// Cancel swipe on touch cancel
		piecesContainer.addEventListener(
			'touchcancel',
			() => {
				this.swipeStartX = null;
				this.swipeStartY = null;
				this.isSwipingPanel = false;
			},
			{passive: true},
		);
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

		// Track piece placement for achievements BEFORE placing (since index will change)
		const currentPieceIndex = this.gameState.getCurrentPieceIndex();

		const placed = this.gameState.placePiece(centerQ, centerR);
		if (!placed) return;

		this.achievementManager.trackPiecePlaced(currentPieceIndex);
		this.achievementManager.trackMove();

		this.animationStartTime = performance.now();
		this.requestAnimationFrame();

		this.updateUI();

		setTimeout(() => {
			this.checkWinCondition();
			this.render();
			this.renderPieceNavigation();

			// Check if all pieces on current page are placed
			this.checkAndAdvancePage();
		}, this.animationDuration);
	}

	cyclePiece(direction: number): void {
		const cycled = this.gameState.cyclePiece(direction);
		if (cycled) {
			this.updateUI();
			this.render();
			this.renderBottomPanel();
		}
	}

	morePieces(): void {
		const pieces = this.gameState.getPieces();
		const maxPages = Math.ceil(pieces.length / this.piecesPerPage);

		// If only one page total, nothing to cycle
		if (maxPages <= 1) return;

		// Find the next page with unplaced pieces
		let nextPage = this.currentPage;
		let attempts = 0;

		do {
			nextPage = (nextPage + 1) % maxPages;
			attempts++;

			// Check if this page has any unplaced pieces
			const startIndex = nextPage * this.piecesPerPage;
			const endIndex = Math.min(startIndex + this.piecesPerPage, pieces.length);
			let hasUnplaced = false;

			for (let i = startIndex; i < endIndex; i++) {
				if (!this.gameState.isPiecePlaced(i)) {
					hasUnplaced = true;
					break;
				}
			}

			if (hasUnplaced) {
				this.currentPage = nextPage;
				break;
			}
		} while (attempts < maxPages);

		this.renderBottomPanel();
	}

	previousPage(): void {
		const pieces = this.gameState.getPieces();
		const maxPages = Math.ceil(pieces.length / this.piecesPerPage);

		// If only one page total, nothing to change
		if (maxPages <= 1) return;

		// Calculate the previous page (with wraparound)
		this.currentPage = (this.currentPage - 1 + maxPages) % maxPages;
		this.renderBottomPanel();
	}

	nextPage(): void {
		const pieces = this.gameState.getPieces();
		const maxPages = Math.ceil(pieces.length / this.piecesPerPage);

		// If only one page total, nothing to change
		if (maxPages <= 1) return;

		// Calculate the next page (with wraparound)
		this.currentPage = (this.currentPage + 1) % maxPages;
		this.renderBottomPanel();
	}

	private checkAndAdvancePage(): void {
		const pieces = this.gameState.getPieces();
		const startIndex = this.currentPage * this.piecesPerPage;
		const endIndex = Math.min(startIndex + this.piecesPerPage, pieces.length);

		// Check if all pieces on current page are placed
		let allPlacedOnCurrentPage = true;
		for (let i = startIndex; i < endIndex; i++) {
			if (!this.gameState.isPiecePlaced(i)) {
				allPlacedOnCurrentPage = false;
				break;
			}
		}

		// If all pieces on current page are placed, automatically advance to next page with unplaced pieces
		if (allPlacedOnCurrentPage) {
			// Use morePieces() which already has the logic to find the next page with unplaced pieces
			this.morePieces();
		}
	}

	undo(): void {
		const undone = this.gameState.undo();
		if (undone) {
			this.achievementManager.trackUndo();
			this.updateUI();
			this.render();
			this.renderBottomPanel();
		}
	}

	redo(): void {
		const redone = this.gameState.redo();
		if (redone) {
			this.updateUI();
			this.render();
			this.renderBottomPanel();
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
			this.achievementManager.trackHint();
			this.render();

			this.hintTimeout = window.setTimeout(() => {
				this.hintPos = null;
				this.hintTimeout = null;
				this.render();
			}, 2000);
		}
	}

	restart(): void {
		this.gameState.restart();
		this.clearHint();
		this.achievementManager.resetInOrderTracking();

		(document.getElementById('solutionStatus') as HTMLElement).textContent = '';
		this.updateUI();
		this.render();
		this.renderBottomPanel();
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
			const difficulty = this.gameState.getDifficulty();
			(document.getElementById('victoryDifficulty') as HTMLElement).textContent = difficulty;
			(document.getElementById('victoryUndos') as HTMLElement).textContent = this.gameState
				.getUndoCount()
				.toString();
			(document.getElementById('victoryHints') as HTMLElement).textContent = this.gameState
				.getHintCount()
				.toString();

			// Trigger achievements
			this.achievementManager.onGameComplete({
				difficulty: difficulty as DifficultyLevel,
				undoCount: this.gameState.getUndoCount(),
				hintCount: this.gameState.getHintCount(),
				moveCount: this.gameState.getMoveCount(),
				placedInOrder: this.achievementManager.isPlacedInOrder(),
			});
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
				this.render();
			}
		} else if (event.touches.length === 2) {
			// Two touches - start pan/zoom
			this.touchHex = null;
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
			this.lastPinchDistance = null;
			this.render();
		} else if (event.touches.length === 1) {
			// Going from two touches to one
			this.lastPinchDistance = null;
		}
	}

	private handleTouchCancel(_event: TouchEvent): void {
		this.touchHex = null;
		this.isTouching = false;
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
		this.renderBottomPanel();
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
		if (!this.gameState.getAllPiecesPlaced()) {
			(document.getElementById('solutionStatus') as HTMLElement).textContent = '';
		}

		// Update undo/redo button states
		const undoBtn = document.getElementById('undoBtn') as HTMLButtonElement;
		const redoBtn = document.getElementById('redoBtn') as HTMLButtonElement;

		if (undoBtn) {
			undoBtn.disabled = !this.gameState.canUndo();
		}

		if (redoBtn) {
			redoBtn.disabled = !this.gameState.canRedo();
		}

		this.renderBottomPanel();
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

		// Handle drag hover effects
		if (this.isDragging && this.draggedPieceIndex !== null && this.dragHoverHex) {
			const piece = this.gameState.getPieceByIndex(this.draggedPieceIndex);
			if (piece) {
				const canPlace = this.canPlacePiece(piece, this.dragHoverHex.q, this.dragHoverHex.r);

				piece.tiles.forEach((tile) => {
					const adjustedQ = this.dragHoverHex!.q + tile.q - piece.center.q;
					const adjustedR = this.dragHoverHex!.r + tile.r - piece.center.r;
					const hex = grid.getHex(adjustedQ, adjustedR);
					if (hex) {
						const pos = this.renderer.hexToPixel(hex.q, hex.r);
						if (canPlace) {
							// Light yellow halo effect for placeable
							this.drawHaloEffect(ctx, pos.x, pos.y);
						}
						// No red effect for invalid - just no visual feedback as requested
					}
				});
			}
		}

		// Original preview hex for old click-to-place system (keeping for backwards compatibility during transition)
		const previewHex = this.mouseHex || this.touchHex;
		if (previewHex && !this.gameState.isPiecePlaced(this.gameState.getCurrentPieceIndex()) && !this.isDragging) {
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
	}

	private renderBottomPanel(): void {
		const piecesContainer = document.getElementById('piecesContainer');
		if (!piecesContainer) return;

		// Clear existing pieces
		piecesContainer.innerHTML = '';

		const pieces = this.gameState.getPieces();
		const startIndex = this.currentPage * this.piecesPerPage;
		const endIndex = Math.min(startIndex + this.piecesPerPage, pieces.length);

		for (let i = startIndex; i < endIndex; i++) {
			const piece = pieces[i];
			const isPlaced = this.gameState.isPiecePlaced(i);

			// Create piece container
			const pieceContainer = document.createElement('div');
			pieceContainer.className = `draggable-piece ${isPlaced ? 'empty-slot' : ''}`;
			pieceContainer.dataset.pieceIndex = i.toString();

			// Create SVG for the piece
			const svg = this.createPieceSVG(piece, isPlaced);
			pieceContainer.appendChild(svg);

			// Set up drag handlers if not placed
			if (!isPlaced) {
				this.setupPieceDragHandlers(pieceContainer, i);
			}

			piecesContainer.appendChild(pieceContainer);
		}

		// Update more pieces button
		const morePiecesBtn = document.getElementById('morePiecesBtn') as HTMLButtonElement;
		if (morePiecesBtn) {
			const totalPages = Math.ceil(pieces.length / this.piecesPerPage);

			// Disable button only if there's one page or less
			if (totalPages <= 1) {
				morePiecesBtn.disabled = true;
			} else {
				// Check if there are any unplaced pieces on OTHER pages
				let hasUnplacedOnOtherPages = false;

				for (let page = 0; page < totalPages; page++) {
					// Skip current page
					if (page === this.currentPage) continue;

					const pageStart = page * this.piecesPerPage;
					const pageEnd = Math.min(pageStart + this.piecesPerPage, pieces.length);

					for (let i = pageStart; i < pageEnd; i++) {
						if (!this.gameState.isPiecePlaced(i)) {
							hasUnplacedOnOtherPages = true;
							break;
						}
					}

					if (hasUnplacedOnOtherPages) break;
				}

				// Enable button if there are unplaced pieces on other pages
				morePiecesBtn.disabled = !hasUnplacedOnOtherPages;
			}
		}
	}

	private createPieceSVG(piece: Piece, isPlaced: boolean): SVGElement {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('viewBox', '-50 -50 100 100');
		svg.style.width = '100%';
		svg.style.height = '100%';
		svg.style.display = 'block';

		if (!isPlaced) {
			// Calculate the relative positions of tiles
			piece.tiles.forEach((tile) => {
				const adjustedQ = tile.q - piece.center.q;
				const adjustedR = tile.r - piece.center.r;
				const x = 15 * ((3 / 2) * adjustedQ);
				const y = 15 * ((Math.sqrt(3) / 2) * adjustedQ + Math.sqrt(3) * adjustedR);

				// Create hexagon path
				const hex = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
				const points = [];
				for (let i = 0; i < 6; i++) {
					const angle = (Math.PI / 3) * i;
					const hx = x + 15 * Math.cos(angle);
					const hy = y + 15 * Math.sin(angle);
					points.push(`${hx},${hy}`);
				}
				hex.setAttribute('points', points.join(' '));
				hex.setAttribute('fill', 'rgba(233, 69, 96, 0.1)');
				hex.setAttribute('stroke', '#e94560');
				hex.setAttribute('stroke-width', '2');

				svg.appendChild(hex);
			});
		}

		return svg;
	}

	private renderFullSizePieceOnCanvas(canvas: HTMLCanvasElement, piece: Piece): void {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Use the same hex size as the board
		const hexSize = this.renderer.hexSize;

		ctx.save();
		ctx.translate(canvas.width / 2, canvas.height / 2);

		piece.tiles.forEach((tile) => {
			// Adjust for piece center
			const adjustedQ = tile.q - piece.center.q;
			const adjustedR = tile.r - piece.center.r;
			const x = hexSize * ((3 / 2) * adjustedQ);
			const y = hexSize * ((Math.sqrt(3) / 2) * adjustedQ + Math.sqrt(3) * adjustedR);

			// Draw transparent hex with board-size hexes
			this.drawTransparentPieceHex(ctx, x, y, hexSize);
		});

		ctx.restore();
	}

	private drawTransparentPieceHex(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
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

		// Transparent with border only - use a color different from board border (#0f3460)
		// Very light fill
		ctx.fillStyle = 'rgba(233, 69, 96, 0.1)';
		ctx.fill();
		// Different from board border color
		ctx.strokeStyle = '#e94560';
		ctx.lineWidth = 2;
		ctx.stroke();
	}

	private createDragPreview(pieceIndex: number, clientX: number, clientY: number): void {
		const piece = this.gameState.getPieceByIndex(pieceIndex);
		if (!piece) return;

		// Calculate actual bounds of the piece
		const hexSize = this.renderer.hexSize;
		const minQ = Math.min(...piece.tiles.map((tile) => tile.q - piece.center.q));
		const maxQ = Math.max(...piece.tiles.map((tile) => tile.q - piece.center.q));
		const minR = Math.min(...piece.tiles.map((tile) => tile.r - piece.center.r));
		const maxR = Math.max(...piece.tiles.map((tile) => tile.r - piece.center.r));

		// Calculate canvas dimensions based on actual piece bounds
		const hexWidth = hexSize * (3 / 2);
		const hexHeight = hexSize * Math.sqrt(3);

		const canvasWidth = (maxQ - minQ + 1) * hexWidth + hexSize;
		const canvasHeight = (maxR - minR + 1) * hexHeight + hexSize;

		// Create preview container
		const preview = document.createElement('div');
		preview.className = 'drag-preview';
		preview.style.position = 'fixed';
		preview.style.pointerEvents = 'none';
		preview.style.zIndex = '10000';
		preview.style.left = `${clientX - canvasWidth / 2}px`;
		preview.style.top = `${clientY - canvasHeight / 2}px`;

		// Create canvas for the piece
		const canvas = document.createElement('canvas');
		canvas.width = canvasWidth;
		canvas.height = canvasHeight;
		preview.appendChild(canvas);

		// Render the piece at full board size
		this.renderFullSizePieceOnCanvas(canvas, piece);

		// Add to document
		document.body.appendChild(preview);
		this.dragPreviewElement = preview;
	}

	private setupPieceDragHandlers(element: HTMLElement, pieceIndex: number): void {
		// Mouse events
		element.addEventListener('mousedown', (e) => this.handlePieceDragStart(e, pieceIndex));

		// Touch events
		element.addEventListener('touchstart', (e) => this.handlePieceTouchStart(e, pieceIndex), {passive: false});
	}

	private handlePieceDragStart(event: MouseEvent, pieceIndex: number): void {
		event.preventDefault();
		this.startDrag(pieceIndex, event.clientX, event.clientY, event.target as HTMLElement);
	}

	private handlePieceTouchStart(event: TouchEvent, pieceIndex: number): void {
		// Don't start drag if we're in the middle of a panel swipe
		if (this.isSwipingPanel) {
			return;
		}

		event.preventDefault();
		if (event.touches.length === 1) {
			const touch = event.touches[0];
			this.startDrag(pieceIndex, touch.clientX, touch.clientY, event.target as HTMLElement);
		}
	}

	private startDrag(pieceIndex: number, clientX: number, clientY: number, element: HTMLElement): void {
		if (this.gameState.isPiecePlaced(pieceIndex)) return;

		this.isDragging = true;
		this.draggedPieceIndex = pieceIndex;
		this.draggedPieceElement = element.closest('.draggable-piece') as HTMLElement;

		// Add dragging class to original element
		if (this.draggedPieceElement) {
			this.draggedPieceElement.classList.add('dragging');
		}

		// Create floating drag preview
		this.createDragPreview(pieceIndex, clientX, clientY);

		// Set up global drag listeners
		document.addEventListener('mousemove', this.handleGlobalDragMove);
		document.addEventListener('mouseup', this.handleGlobalDragEnd);
		document.addEventListener('touchmove', this.handleGlobalTouchMove, {passive: false});
		document.addEventListener('touchend', this.handleGlobalTouchEnd);
	}

	private handleGlobalDragMove = (event: MouseEvent): void => {
		if (!this.isDragging) return;
		event.preventDefault();
		this.updateDragPosition(event.clientX, event.clientY);
	};

	private handleGlobalTouchMove = (event: TouchEvent): void => {
		if (!this.isDragging) return;
		event.preventDefault();
		if (event.touches.length === 1) {
			const touch = event.touches[0];
			this.updateDragPosition(touch.clientX, touch.clientY);
		}
	};

	private updateDragPosition(clientX: number, clientY: number): void {
		// Update floating drag preview position (center it on cursor)
		if (this.dragPreviewElement) {
			const canvas = this.dragPreviewElement.querySelector('canvas');
			if (canvas) {
				const halfWidth = canvas.width / 2;
				const halfHeight = canvas.height / 2;
				this.dragPreviewElement.style.left = `${clientX - halfWidth}px`;
				this.dragPreviewElement.style.top = `${clientY - halfHeight}px`;
			}
		}

		// Check if hovering over game canvas
		const canvas = this.canvasManager.getCanvas();
		const rect = canvas.getBoundingClientRect();

		if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
			const x = clientX - rect.left - canvas.width / 2 - this.panOffsetX;
			const y = clientY - rect.top - canvas.height / 2 - this.panOffsetY;

			const hex = this.renderer.pixelToHex(x, y);
			const grid = this.gameState.getGrid();
			if (grid.getHex(hex.q, hex.r)) {
				this.dragHoverHex = hex;
			} else {
				this.dragHoverHex = null;
			}
		} else {
			this.dragHoverHex = null;
		}

		// Re-render to show hover effects
		this.render();
	}

	private handleGlobalDragEnd = (_event: MouseEvent): void => {
		if (!this.isDragging) return;
		this.finishDrag();
	};

	private handleGlobalTouchEnd = (_event: TouchEvent): void => {
		if (!this.isDragging) return;
		this.finishDrag();
	};

	private finishDrag(): void {
		if (!this.isDragging || this.draggedPieceIndex === null) return;

		// Try to place piece if hovering over valid location
		if (this.dragHoverHex) {
			const piece = this.gameState.getPieceByIndex(this.draggedPieceIndex);
			if (piece && this.canPlacePiece(piece, this.dragHoverHex.q, this.dragHoverHex.r)) {
				// Set the current piece to the dragged piece for placement
				this.gameState.setCurrentPieceIndex(this.draggedPieceIndex);
				this.placePiece(this.dragHoverHex.q, this.dragHoverHex.r);
			} else if (piece) {
				this.showInvalidPlacementFeedback(this.dragHoverHex);
			}
		}

		// Clean up drag state
		if (this.draggedPieceElement) {
			this.draggedPieceElement.classList.remove('dragging');
		}

		// Remove drag preview
		if (this.dragPreviewElement) {
			document.body.removeChild(this.dragPreviewElement);
			this.dragPreviewElement = null;
		}

		this.isDragging = false;
		this.draggedPieceIndex = null;
		this.draggedPieceElement = null;
		this.dragHoverHex = null;

		// Remove global listeners
		document.removeEventListener('mousemove', this.handleGlobalDragMove);
		document.removeEventListener('mouseup', this.handleGlobalDragEnd);
		document.removeEventListener('touchmove', this.handleGlobalTouchMove);
		document.removeEventListener('touchend', this.handleGlobalTouchEnd);

		// Clear any hover effects
		this.render();
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

	private drawHaloEffect(ctx: CanvasRenderingContext2D, x: number, y: number): void {
		ctx.save();

		// Inner light yellow fill
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
		// Light yellow inside
		ctx.fillStyle = 'rgba(255, 235, 59, 0.2)';
		ctx.fill();

		// Outer glow effect
		const glowSize = this.renderer.hexSize * 1.3;
		ctx.beginPath();
		for (let i = 0; i < 6; i++) {
			const angle = (Math.PI / 3) * i;
			const hx = x + glowSize * Math.cos(angle);
			const hy = y + glowSize * Math.sin(angle);
			if (i === 0) {
				ctx.moveTo(hx, hy);
			} else {
				ctx.lineTo(hx, hy);
			}
		}
		ctx.closePath();

		// Create gradient for glow effect
		const gradient = ctx.createRadialGradient(x, y, this.renderer.hexSize, x, y, glowSize);
		gradient.addColorStop(0, 'rgba(255, 235, 59, 0.3)');
		gradient.addColorStop(1, 'rgba(255, 235, 59, 0.0)');

		ctx.fillStyle = gradient;
		ctx.fill();

		ctx.restore();
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
