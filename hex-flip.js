let game = null;

// Validate on page load
window.addEventListener('DOMContentLoaded', () => {
    validateCustomInputs();
});

function startGame(radius, numPieces) {
    document.getElementById('difficultyScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');
    document.getElementById('mobileControls').classList.remove('hidden');
    game = new HexSeptominoGame(radius, numPieces);
}

function validateCustomInputs() {
    const radiusInput = document.getElementById('customRadius');
    const piecesInput = document.getElementById('customPieces');
    const errorDiv = document.getElementById('validationError');
    const startBtn = document.getElementById('customStartBtn');

    const radius = parseInt(radiusInput.value);
    const pieces = parseInt(piecesInput.value);

    let errors = [];
    let isValid = true;

    // Validate radius
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

    // Validate pieces
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

    // Update UI
    errorDiv.textContent = errors.join('. ');
    startBtn.disabled = !isValid;

    return isValid;
}

function startCustomGame() {
    if (validateCustomInputs()) {
        const radius = parseInt(document.getElementById('customRadius').value);
        const pieces = parseInt(document.getElementById('customPieces').value);
        startGame(radius, pieces);
    }
}

function showDifficultyScreen() {
    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('mobileControls').classList.add('hidden');
    document.getElementById('difficultyScreen').classList.remove('hidden');
}

// Hexagonal grid math
class HexGrid {
    constructor(radius, hexSize) {
        this.radius = radius;
        this.hexSize = hexSize;
        this.hexes = new Map();

        // Generate all hex coordinates within radius
        for (let q = -radius; q <= radius; q++) {
            for (let r = -radius; r <= radius; r++) {
                const s = -q - r;
                if (Math.abs(s) <= radius) {
                    const key = `${q},${r}`;
                    this.hexes.set(key, { q, r, s, height: 0 });
                }
            }
        }
    }

    // Get hex at cube coordinates
    getHex(q, r) {
        return this.hexes.get(`${q},${r}`);
    }

    // Convert cube coordinates to pixel position
    hexToPixel(q, r) {
        const x = this.hexSize * (3/2 * q);
        const y = this.hexSize * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
        return { x, y };
    }

    // Convert pixel position to cube coordinates
    pixelToHex(x, y) {
        const q = (2/3 * x) / this.hexSize;
        const r = (-1/3 * x + Math.sqrt(3)/3 * y) / this.hexSize;
        return this.roundHex(q, r);
    }

    // Round to nearest hex
    roundHex(q, r) {
        const s = -q - r;
        let rq = Math.round(q);
        let rr = Math.round(r);
        let rs = Math.round(s);

        const q_diff = Math.abs(rq - q);
        const r_diff = Math.abs(rr - r);
        const s_diff = Math.abs(rs - s);

        if (q_diff > r_diff && q_diff > s_diff) {
            rq = -rr - rs;
        } else if (r_diff > s_diff) {
            rr = -rq - rs;
        }

        return { q: rq, r: rr };
    }

    // Get neighboring hexes
    getNeighbors(q, r) {
        const dirs = [
            [1, 0], [1, -1], [0, -1],
            [-1, 0], [-1, 1], [0, 1]
        ];
        return dirs.map(([dq, dr]) => ({ q: q + dq, r: r + dr }))
                  .filter(pos => this.getHex(pos.q, pos.r));
    }
}

// Septomino piece generator
class SeptominoGenerator {
    static generatePiece() {
        // Start with center at 0,0
        const tiles = [{ q: 0, r: 0 }];

        // Add 2-6 more tiles (for total of 3-7)
        const numTiles = 2 + Math.floor(Math.random() * 5);

        for (let i = 0; i < numTiles; i++) {
            // Get all possible neighbors of center
            const neighbors = [
                { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
                { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
            ];

            // Filter out already used positions
            const available = neighbors.filter(n =>
                !tiles.some(t => t.q === n.q && t.r === n.r)
            );

            if (available.length > 0) {
                const next = available[Math.floor(Math.random() * available.length)];
                tiles.push(next);
            }
        }

        return tiles;
    }

    static generateSet(count) {
        const pieces = [];
        for (let i = 0; i < count; i++) {
            pieces.push(this.generatePiece());
        }
        return pieces;
    }
}

// Game class
class HexSeptominoGame {
    constructor(radius, numPieces) {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.previewCanvas = document.getElementById('piecePreview');
        this.previewCtx = this.previewCanvas.getContext('2d');

        this.radius = radius;
        this.numPieces = numPieces;

        // Calculate responsive sizes
        this.updateCanvasSize();

        this.grid = new HexGrid(radius, this.hexSize);

        this.pieces = [];
        this.currentPieceIndex = 0;
        this.placedPieces = new Set();
        this.solution = [];
        this.history = [];
        this.redoStack = [];
        this.hintPos = null;
        this.initialGridState = new Map();

        this.colors = {
            0: '#16213e',
            1: '#e94560',
            2: '#e67e22',
            3: '#2ecc71',
            4: '#3498db',
            5: '#9b59b6',
            6: '#c0392b'
        };

        this.mouseHex = null;
        this.touchHex = null;
        this.isTouching = false;
        this.setupEventListeners();
        this.generateLevel();
        this.render();

        // Handle resize
        window.addEventListener('resize', () => {
            this.updateCanvasSize();
            this.grid.hexSize = this.hexSize;
            this.render();
        });
    }

    updateCanvasSize() {
        const container = this.canvas.parentElement;
        const isMobile = window.innerWidth <= 768;

        // Get available space
        const maxWidth = container.clientWidth || window.innerWidth - 40;
        const maxHeight = isMobile ?
            window.innerHeight - 250 : // Account for header and mobile controls
            window.innerHeight - 100;

        // Calculate required size for the board
        const boardWidth = this.radius * 3 * 30 + 60; // Approximate width
        const boardHeight = this.radius * 2 * Math.sqrt(3) * 30 + 60; // Approximate height

        // Scale to fit
        const scale = Math.min(1, maxWidth / boardWidth, maxHeight / boardHeight);

        // Set canvas size
        this.canvas.width = Math.min(maxWidth, boardWidth * scale);
        this.canvas.height = Math.min(maxHeight, boardHeight * scale);

        // Calculate hex size based on canvas and radius
        this.hexSize = Math.min(30, (this.canvas.width - 60) / (this.radius * 3));
    }

    setupEventListeners() {
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
        document.getElementById('hintBtn').addEventListener('click', () => this.showHint());
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        document.getElementById('newGameBtn').addEventListener('click', () => showDifficultyScreen());
    }

    generateLevel() {
        // Generate pieces
        this.pieces = SeptominoGenerator.generateSet(this.numPieces);
        this.solution = [];
        this.placedPieces.clear();
        this.history = [];
        this.redoStack = [];
        this.currentPieceIndex = 0;

        // Reset grid
        this.grid.hexes.forEach(hex => hex.height = 0);

        // Place pieces randomly to create the puzzle
        const positions = Array.from(this.grid.hexes.values());

        this.pieces.forEach((piece, index) => {
            // Find valid positions for this piece (don't check height during generation)
            const validPositions = positions.filter(pos =>
                this.canPlacePiece(piece, pos.q, pos.r, false)
            );

            if (validPositions.length > 0) {
                const pos = validPositions[Math.floor(Math.random() * validPositions.length)];

                // Record solution
                this.solution.push({ pieceIndex: index, q: pos.q, r: pos.r });

                // Apply piece to increase heights
                piece.forEach(tile => {
                    const hex = this.grid.getHex(pos.q + tile.q, pos.r + tile.r);
                    if (hex) {
                        hex.height = Math.min(hex.height + 1, 6);
                    }
                });
            }
        });

        // Save initial grid state
        this.grid.hexes.forEach((hex, key) => {
            this.initialGridState.set(key, hex.height);
        });

        this.updateUI();
    }

    canPlacePiece(piece, centerQ, centerR, checkHeight = true) {
        // Check if all hexes exist and optionally check height > 0
        return piece.every(tile => {
            const hex = this.grid.getHex(centerQ + tile.q, centerR + tile.r);
            if (checkHeight) {
                return hex !== undefined && hex.height > 0;
            } else {
                return hex !== undefined;
            }
        });
    }

    placePiece(centerQ, centerR) {
        const piece = this.pieces[this.currentPieceIndex];
        if (!this.canPlacePiece(piece, centerQ, centerR)) return;
        if (this.placedPieces.has(this.currentPieceIndex)) return;

        // Clear redo stack
        this.redoStack = [];

        // Record move
        const move = {
            pieceIndex: this.currentPieceIndex,
            q: centerQ,
            r: centerR,
            heightChanges: []
        };

        // Apply piece
        piece.forEach(tile => {
            const hex = this.grid.getHex(centerQ + tile.q, centerR + tile.r);
            if (hex && hex.height > 0) {
                move.heightChanges.push({ q: hex.q, r: hex.r, oldHeight: hex.height });
                hex.height--;
            }
        });

        this.history.push(move);
        this.placedPieces.add(this.currentPieceIndex);

        // Auto-advance to next unplaced piece
        this.findNextUnplacedPiece();

        this.checkWinCondition();
        this.updateUI();
        this.render();
    }

    findNextUnplacedPiece() {
        for (let i = 0; i < this.pieces.length; i++) {
            const index = (this.currentPieceIndex + 1 + i) % this.pieces.length;
            if (!this.placedPieces.has(index)) {
                this.currentPieceIndex = index;
                return;
            }
        }
    }

    cyclePiece(direction) {
        this.currentPieceIndex = (this.currentPieceIndex + direction + this.pieces.length) % this.pieces.length;
        this.updateUI();
        this.render();
    }

    undo() {
        if (this.history.length === 0) return;

        const move = this.history.pop();
        this.redoStack.push(move);

        // Restore heights
        move.heightChanges.forEach(change => {
            const hex = this.grid.getHex(change.q, change.r);
            if (hex) hex.height = change.oldHeight;
        });

        this.placedPieces.delete(move.pieceIndex);
        this.currentPieceIndex = move.pieceIndex;

        this.updateUI();
        this.render();
    }

    redo() {
        if (this.redoStack.length === 0) return;

        const move = this.redoStack.pop();
        this.currentPieceIndex = move.pieceIndex;
        this.placePiece(move.q, move.r);
    }

    showHint() {
        const solutionMove = this.solution.find(move =>
            move.pieceIndex === this.currentPieceIndex
        );

        if (solutionMove) {
            this.hintPos = { q: solutionMove.q, r: solutionMove.r };
            this.render();

            // Clear hint after 2 seconds
            setTimeout(() => {
                this.hintPos = null;
                this.render();
            }, 2000);
        }
    }

    restart() {
        // Restore initial grid state
        this.initialGridState.forEach((height, key) => {
            const hex = this.grid.hexes.get(key);
            if (hex) hex.height = height;
        });

        // Reset game state
        this.placedPieces.clear();
        this.history = [];
        this.redoStack = [];
        this.currentPieceIndex = 0;
        this.hintPos = null;

        document.getElementById('solutionStatus').textContent = '';
        document.getElementById('mobileSolutionStatus').textContent = '';
        this.updateUI();
        this.render();
    }

    checkWinCondition() {
        const allZero = Array.from(this.grid.hexes.values()).every(hex => hex.height === 0);
        if (allZero) {
            const message = 'Congratulations! You solved it!';
            document.getElementById('solutionStatus').textContent = message;
            document.getElementById('mobileSolutionStatus').textContent = message;
        }
    }

    handleMouseMove(event) {
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

    handleTouchStart(event) {
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

    handleTouchMove(event) {
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

    handleTouchEnd(event) {
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

    handleTouchCancel(event) {
        this.touchHex = null;
        this.isTouching = false;
        this.render();
    }

    handleClick(event) {
        if (this.mouseHex && !this.placedPieces.has(this.currentPieceIndex)) {
            this.placePiece(this.mouseHex.q, this.mouseHex.r);
        }
    }

    handleKeyPress(event) {
        switch(event.key) {
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
        }
    }

    updateUI() {
        const pieceText = `Piece ${this.currentPieceIndex + 1} of ${this.pieces.length}`;
        document.getElementById('pieceNumber').textContent = pieceText;
        document.getElementById('mobilePieceInfo').textContent = pieceText;

        document.getElementById('piecePlaced').style.display =
            this.placedPieces.has(this.currentPieceIndex) ? 'block' : 'none';

        if (this.placedPieces.size < this.pieces.length) {
            document.getElementById('solutionStatus').textContent = '';
            document.getElementById('mobileSolutionStatus').textContent = '';
        }

        this.renderPiecePreview();
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0f3460';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Translate to center
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);

        // Calculate font size based on hex size
        const fontSize = Math.max(12, Math.floor(this.hexSize * 0.5));

        // Draw hexes
        this.grid.hexes.forEach(hex => {
            const pos = this.grid.hexToPixel(hex.q, hex.r);
            let displayHeight = hex.height;

            // Check if this hex is being previewed
            if (this.mouseHex && !this.placedPieces.has(this.currentPieceIndex)) {
                const piece = this.pieces[this.currentPieceIndex];
                const canPlace = this.canPlacePiece(piece, this.mouseHex.q, this.mouseHex.r);

                if (canPlace) {
                    // Check if this hex would be affected by the piece
                    const isAffected = piece.some(tile =>
                        hex.q === this.mouseHex.q + tile.q &&
                        hex.r === this.mouseHex.r + tile.r
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

            piece.forEach(tile => {
                const hex = this.grid.getHex(this.mouseHex.q + tile.q, this.mouseHex.r + tile.r);
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
            piece.forEach(tile => {
                const hex = this.grid.getHex(this.hintPos.q + tile.q, this.hintPos.r + tile.r);
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

    renderPiecePreview() {
        const ctx = this.previewCtx;
        ctx.fillStyle = '#16213e';
        ctx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);

        const piece = this.pieces[this.currentPieceIndex];
        const previewHexSize = 20;

        ctx.save();
        ctx.translate(this.previewCanvas.width / 2, this.previewCanvas.height / 2);

        const color = this.placedPieces.has(this.currentPieceIndex) ? '#666' : '#e94560';

        piece.forEach(tile => {
            const x = previewHexSize * (3/2 * tile.q);
            const y = previewHexSize * (Math.sqrt(3)/2 * tile.q + Math.sqrt(3) * tile.r);
            this.drawHexOnCanvas(ctx, x, y, previewHexSize, color, '#0f3460', 2);
        });

        ctx.restore();
    }

    drawHex(x, y, fillColor, strokeColor, lineWidth) {
        this.drawHexOnCanvas(this.ctx, x, y, this.hexSize, fillColor, strokeColor, lineWidth);
    }

    drawHexOutline(x, y) {
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 3 * i;
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

    drawHexOnCanvas(ctx, x, y, size, fillColor, strokeColor, lineWidth) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 3 * i;
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
