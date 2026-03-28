// =================================
// CHESS GAME - Beginner-friendly chess for ElxaOS
// Uses chess.js v0.10.3 for rules, hand-rolled minimax AI
// =================================
class ChessGame {
    constructor(windowManager, gameData = {}) {
        this.windowManager = windowManager;
        this.gameData = gameData;
        this.windowId = null;
        this.container = null;

        // Game state
        this.chess = null;          // chess.js instance
        this.selectedSquare = null; // currently selected square (e.g. 'e2')
        this.legalMoves = [];       // legal moves for selected piece
        this.lastMove = null;       // { from, to } of last move
        this.playerColor = 'w';     // player plays white by default
        this.aiThinking = false;

        // Settings
        this.difficulty = gameData.difficulty || 'easy';
        this.boardTheme = 'wood';
        this.showLegalMoves = true;
        this.showCoordinates = true;

        // Screen state
        this.currentScreen = 'title'; // 'title', 'playing', 'gameover'

        // Piece asset path
        this.piecePath = '../../assets/games/chess/16x32 pieces';

        // Board themes data (sampled from board PNGs + wood)
        this.themes = {
            wood:     { name: 'Wood',     light: '#deb887', dark: '#8b6f47' },
            classic:  { name: 'Classic',  light: '#eaf0d8', dark: '#596070' },
            mist:     { name: 'Mist',     light: '#eaf0d8', dark: '#c0c4b3' },
            steel:    { name: 'Steel',    light: '#96a2b3', dark: '#596070' },
            midnight: { name: 'Midnight', light: '#e6ead7', dark: '#454d5f' },
            amber:    { name: 'Amber',    light: '#e2d5a1', dark: '#784f48' }
        };

        // Piece info data for tooltips
        this.pieceInfo = {
            p: { name: 'Pawn',   value: 1, desc: 'Moves forward 1 square (2 on first move). Captures diagonally. Can promote at the end!' },
            n: { name: 'Knight', value: 3, desc: 'Moves in an L-shape: 2 squares in one direction, then 1 square sideways. Can jump over pieces!' },
            b: { name: 'Bishop', value: 3, desc: 'Moves diagonally any number of squares. Each bishop stays on one color.' },
            r: { name: 'Rook',   value: 5, desc: 'Moves horizontally or vertically any number of squares. Very powerful!' },
            q: { name: 'Queen',  value: 9, desc: 'Moves in any direction any number of squares. The most powerful piece!' },
            k: { name: 'King',   value: 0, desc: 'Moves 1 square in any direction. Must be protected — if checkmated, the game is over!' }
        };

        // AI piece values (centipawns)
        this.PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

        // Piece-square tables (from white's perspective, index 0 = a8)
        this.PST = this.buildPieceSquareTables();
    }

    // ---- Launch & Window ----

    launch(programInfo) {
        this.windowId = `chess-${Date.now()}`;
        const windowContent = this.createSplashScreen();

        this.windowManager.createWindow(
            this.windowId,
            `♟️ ${programInfo?.name || 'Chess'}`,
            `<div class="chess-container">${windowContent}</div>`,
            { width: '680px', height: '560px', x: '120px', y: '60px' }
        );

        this.container = document.querySelector(`#window-${this.windowId} .chess-container`);
        this.setupSplashEvents();
        return this.windowId;
    }

    // ---- Splash Screen (click to continue) ----

    createSplashScreen() {
        return `
            <div class="chess-splash-screen">
                <img class="chess-splash-art" src="../../assets/games/chess/main.png" alt="Chess for Learners" />
                <div class="chess-splash-prompt">Click anywhere to start</div>
            </div>
        `;
    }

    setupSplashEvents() {
        if (!this.container) return;
        this.container.querySelector('.chess-splash-screen')?.addEventListener('click', () => {
            this.showOptionsScreen();
        });
    }

    // ---- Options Screen ----

    showOptionsScreen() {
        this.currentScreen = 'options';
        this.container.innerHTML = this.createOptionsScreen();
        this.setupOptionsEvents();
    }

    createOptionsScreen() {
        const themePickers = Object.entries(this.themes).map(([key, t]) => `
            <div class="chess-theme-swatch ${key === this.boardTheme ? 'active' : ''}" data-theme="${key}" title="${t.name}">
                <div class="swatch-light" style="background:${t.light}"></div>
                <div class="swatch-dark" style="background:${t.dark}"></div>
            </div>
        `).join('');

        return `
            <div class="chess-title-screen">
                <div class="chess-title-name">♟️ Chess for Learners</div>

                <div class="chess-title-options">
                    <div class="chess-option-group">
                        <label>Difficulty</label>
                        <div class="chess-difficulty-btns">
                            <button data-diff="easy" class="${this.difficulty === 'easy' ? 'active' : ''}">Easy</button>
                            <button data-diff="medium" class="${this.difficulty === 'medium' ? 'active' : ''}">Medium</button>
                            <button data-diff="hard" class="${this.difficulty === 'hard' ? 'active' : ''}">Hard</button>
                        </div>
                    </div>

                    <div class="chess-option-group">
                        <label>Play As</label>
                        <div class="chess-color-btns">
                            <button data-color="w" class="${this.playerColor === 'w' ? 'active' : ''}">⬜ White</button>
                            <button data-color="b" class="${this.playerColor === 'b' ? 'active' : ''}">⬛ Black</button>
                        </div>
                    </div>

                    <div class="chess-option-group">
                        <label>Board Theme</label>
                        <div class="chess-theme-picker">${themePickers}</div>
                    </div>
                </div>

                <button class="chess-play-btn">▶ Play!</button>
            </div>
        `;
    }

    setupOptionsEvents() {
        if (!this.container) return;

        // Difficulty buttons
        this.container.querySelectorAll('.chess-difficulty-btns button').forEach(btn => {
            btn.addEventListener('click', () => {
                this.container.querySelectorAll('.chess-difficulty-btns button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.difficulty = btn.dataset.diff;
            });
        });

        // Color buttons
        this.container.querySelectorAll('.chess-color-btns button').forEach(btn => {
            btn.addEventListener('click', () => {
                this.container.querySelectorAll('.chess-color-btns button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.playerColor = btn.dataset.color;
            });
        });

        // Theme swatches
        this.container.querySelectorAll('.chess-theme-swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                this.container.querySelectorAll('.chess-theme-swatch').forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                this.boardTheme = swatch.dataset.theme;
            });
        });

        // Play button
        this.container.querySelector('.chess-play-btn')?.addEventListener('click', () => {
            this.startGame();
        });
    }

    // ---- Start Game ----

    startGame() {
        this.chess = new Chess();
        this.selectedSquare = null;
        this.legalMoves = [];
        this.lastMove = null;
        this.aiThinking = false;
        this.currentScreen = 'playing';

        this.container.innerHTML = this.createPlayingScreen();
        this.setupPlayingEvents();
        this.renderBoard();

        // If player is black, AI moves first
        if (this.playerColor === 'b') {
            this.doAiMove();
        }
    }

    // ---- Playing Screen ----

    createPlayingScreen() {
        const ranks = this.playerColor === 'w'
            ? ['8','7','6','5','4','3','2','1']
            : ['1','2','3','4','5','6','7','8'];
        const files = this.playerColor === 'w'
            ? ['a','b','c','d','e','f','g','h']
            : ['h','g','f','e','d','c','b','a'];

        const rankLabels = ranks.map(r => `<span>${r}</span>`).join('');
        const fileLabels = files.map(f => `<span>${f}</span>`).join('');

        // Build board squares
        let squares = '';
        for (let ri = 0; ri < 8; ri++) {
            for (let fi = 0; fi < 8; fi++) {
                const rank = ranks[ri];
                const file = files[fi];
                const sq = file + rank;
                // Determine light/dark: a1 is dark, a8 is light, etc.
                const fileIdx = 'abcdefgh'.indexOf(file);
                const rankIdx = parseInt(rank);
                const isLight = (fileIdx + rankIdx) % 2 === 1;
                squares += `<div class="chess-square ${isLight ? 'light' : 'dark'}" data-square="${sq}"></div>`;
            }
        }

        return `
            <div class="chess-playing-screen">
                <div class="chess-status-bar">
                    <span class="chess-status-turn">White's turn</span>
                    <div class="chess-thinking">
                        <span>Thinking</span>
                        <div class="chess-thinking-dots"><span></span><span></span><span></span></div>
                    </div>
                    <span class="chess-status-message"></span>
                </div>

                <div class="chess-main-area">
                    <div class="chess-side-panel left">
                        <div class="chess-captured-area" id="chess-captured-top">
                            <span class="chess-captured-label">Captured</span>
                            <div class="chess-captured-pieces"></div>
                            <div class="chess-point-diff"></div>
                        </div>
                    </div>

                    <div class="chess-board-wrapper">
                        <div class="chess-board-with-coords">
                            <div class="chess-rank-labels">${rankLabels}</div>
                            <div style="display:flex;flex-direction:column;">
                                <div class="chess-board theme-${this.boardTheme}">${squares}</div>
                                <div class="chess-file-labels">${fileLabels}</div>
                            </div>
                        </div>
                    </div>

                    <div class="chess-side-panel right">
                        <div class="chess-captured-area" id="chess-captured-bottom">
                            <span class="chess-captured-label">Captured</span>
                            <div class="chess-captured-pieces"></div>
                            <div class="chess-point-diff"></div>
                        </div>
                        <div class="chess-piece-info" id="chess-piece-info">
                            <div class="chess-piece-info-name"></div>
                            <div class="chess-piece-info-value"></div>
                            <div class="chess-piece-info-desc"></div>
                        </div>
                    </div>
                </div>

                <div class="chess-toolbar">
                    <button class="chess-btn-undo" title="Undo last move">
                        <span class="mdi mdi-undo"></span> Undo
                    </button>
                    <button class="chess-btn-newgame" title="Start a new game">
                        <span class="mdi mdi-refresh"></span> New Game
                    </button>
                    <button class="chess-btn-settings" title="Settings">
                        <span class="mdi mdi-cog"></span>
                    </button>
                </div>
            </div>
        `;
    }

    setupPlayingEvents() {
        if (!this.container) return;

        // Board square clicks
        this.container.querySelector('.chess-board')?.addEventListener('click', (e) => {
            const sq = e.target.closest('.chess-square');
            if (!sq || this.aiThinking) return;
            this.handleSquareClick(sq.dataset.square);
        });

        // Piece hover for info
        this.container.querySelector('.chess-board')?.addEventListener('mouseover', (e) => {
            const sq = e.target.closest('.chess-square');
            if (!sq) return;
            this.showPieceInfo(sq.dataset.square);
        });

        this.container.querySelector('.chess-board')?.addEventListener('mouseout', () => {
            this.hidePieceInfo();
        });

        // Toolbar buttons
        this.container.querySelector('.chess-btn-undo')?.addEventListener('click', () => this.undoMove());
        this.container.querySelector('.chess-btn-newgame')?.addEventListener('click', () => this.backToTitle());
        this.container.querySelector('.chess-btn-settings')?.addEventListener('click', () => this.toggleThemePicker());
    }

    // ---- Board Rendering ----

    renderBoard() {
        const board = this.chess.board(); // 8x8 array, board[0] = rank 8
        const squares = this.container.querySelectorAll('.chess-square');

        squares.forEach(sqEl => {
            const sqName = sqEl.dataset.square;
            const file = sqName[0];
            const rank = parseInt(sqName[1]);
            const fileIdx = 'abcdefgh'.indexOf(file);
            const rankIdx = 8 - rank; // board array index (0 = rank 8)

            // Clear previous state
            sqEl.innerHTML = '';
            sqEl.classList.remove('selected', 'legal-move', 'legal-capture', 'last-move', 'check');

            // Place piece
            const piece = board[rankIdx][fileIdx];
            if (piece) {
                const color = piece.color === 'w' ? 'W' : 'B';
                const pieceName = this.getPieceFileName(piece.type);
                const img = document.createElement('img');
                img.className = 'chess-piece';
                img.src = `${this.piecePath}/${color}_${pieceName}.png`;
                img.alt = `${color} ${pieceName}`;
                img.draggable = false;
                sqEl.appendChild(img);
            }

            // Last move highlight
            if (this.lastMove) {
                if (sqName === this.lastMove.from || sqName === this.lastMove.to) {
                    sqEl.classList.add('last-move');
                }
            }

            // Selected square
            if (sqName === this.selectedSquare) {
                sqEl.classList.add('selected');
            }

            // Legal move dots
            if (this.showLegalMoves && this.selectedSquare) {
                const isLegal = this.legalMoves.find(m => m.to === sqName);
                if (isLegal) {
                    sqEl.classList.add(isLegal.captured ? 'legal-capture' : 'legal-move');
                }
            }
        });

        // Check highlight
        if (this.chess.in_check()) {
            const turn = this.chess.turn();
            // Find the king square
            const kingSquare = this.findKing(turn);
            if (kingSquare) {
                const kingEl = this.container.querySelector(`.chess-square[data-square="${kingSquare}"]`);
                if (kingEl) kingEl.classList.add('check');
            }
        }

        this.updateStatusBar();
        this.updateCapturedPieces();
    }

    getPieceFileName(type) {
        const map = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' };
        return map[type] || 'Pawn';
    }

    findKing(color) {
        const board = this.chess.board();
        for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
                const p = board[r][f];
                if (p && p.type === 'k' && p.color === color) {
                    return 'abcdefgh'[f] + (8 - r);
                }
            }
        }
        return null;
    }

    // ---- Click-to-Move ----

    handleSquareClick(square) {
        if (this.chess.game_over()) return;
        if (this.chess.turn() !== this.playerColor) return;

        const piece = this.chess.get(square);

        // If we have a selected piece and clicked a legal destination
        if (this.selectedSquare) {
            const move = this.legalMoves.find(m => m.to === square);
            if (move) {
                this.executePlayerMove(move);
                return;
            }
        }

        // Select a new piece (must be player's color)
        if (piece && piece.color === this.playerColor) {
            this.selectedSquare = square;
            const moves = this.chess.moves({ square: square, verbose: true });
            this.legalMoves = moves;
            this.renderBoard();
        } else {
            // Deselect
            this.selectedSquare = null;
            this.legalMoves = [];
            this.renderBoard();
        }
    }

    executePlayerMove(move) {
        // Check for pawn promotion
        if (move.piece === 'p') {
            const destRank = parseInt(move.to[1]);
            if ((this.playerColor === 'w' && destRank === 8) || (this.playerColor === 'b' && destRank === 1)) {
                this.showPromotionPicker(move);
                return;
            }
        }

        const result = this.chess.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
        if (result) {
            this.lastMove = { from: result.from, to: result.to };
            this.selectedSquare = null;
            this.legalMoves = [];
            this.renderBoard();

            // Check for game over
            if (this.chess.game_over()) {
                this.showGameOver();
                return;
            }

            // AI's turn
            this.doAiMove();
        }
    }

    // ---- Pawn Promotion ----

    showPromotionPicker(move) {
        const color = this.playerColor === 'w' ? 'W' : 'B';
        const pieces = ['Queen', 'Rook', 'Bishop', 'Knight'];
        const codes = ['q', 'r', 'b', 'n'];

        const options = pieces.map((name, i) => `
            <div class="chess-promotion-option" data-promo="${codes[i]}">
                <img src="${this.piecePath}/${color}_${name}.png" alt="${name}" />
            </div>
        `).join('');

        const overlay = document.createElement('div');
        overlay.className = 'chess-promotion-overlay';
        overlay.innerHTML = `<div class="chess-promotion-picker">${options}</div>`;

        overlay.querySelectorAll('.chess-promotion-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const promo = opt.dataset.promo;
                overlay.remove();
                const result = this.chess.move({ from: move.from, to: move.to, promotion: promo });
                if (result) {
                    this.lastMove = { from: result.from, to: result.to };
                    this.selectedSquare = null;
                    this.legalMoves = [];
                    this.renderBoard();
                    if (this.chess.game_over()) {
                        this.showGameOver();
                        return;
                    }
                    this.doAiMove();
                }
            });
        });

        this.container.querySelector('.chess-playing-screen').appendChild(overlay);
    }

    // ---- Undo ----

    undoMove() {
        if (this.aiThinking) return;
        // Undo AI move + player move (two undos)
        const move1 = this.chess.undo();
        if (!move1) return;

        // If AI had moved, undo that too
        if (move1.color !== this.playerColor) {
            // We undid the AI's move, now undo the player's
            this.chess.undo();
        }
        // If we undid the player's move, undo the one before (which was AI's)
        else {
            const prev = this.chess.undo();
            // If there was no previous AI move (start of game), that's fine
        }

        this.lastMove = null;
        this.selectedSquare = null;
        this.legalMoves = [];
        this.renderBoard();
    }

    // ---- Status Bar ----

    updateStatusBar() {
        const turnEl = this.container.querySelector('.chess-status-turn');
        const msgEl = this.container.querySelector('.chess-status-message');
        if (!turnEl || !msgEl) return;

        const turn = this.chess.turn();
        const isPlayer = turn === this.playerColor;
        turnEl.textContent = `${turn === 'w' ? 'White' : 'Black'}'s turn${isPlayer ? ' (You)' : ''}`;

        if (this.chess.in_checkmate()) {
            msgEl.textContent = 'Checkmate!';
        } else if (this.chess.in_check()) {
            msgEl.textContent = 'Check!';
        } else if (this.chess.in_stalemate()) {
            msgEl.textContent = 'Stalemate!';
        } else if (this.chess.in_draw()) {
            msgEl.textContent = 'Draw!';
        } else {
            msgEl.textContent = '';
        }
    }

    // ---- Captured Pieces ----

    updateCapturedPieces() {
        const history = this.chess.history({ verbose: true });
        const captured = { w: [], b: [] }; // pieces captured BY each color

        history.forEach(move => {
            if (move.captured) {
                // The capturing color collects the opponent's piece
                captured[move.color].push(move.captured);
            }
        });

        // Sort captures by value (high to low)
        const sortOrder = { q: 0, r: 1, b: 2, n: 3, p: 4 };
        captured.w.sort((a, b) => sortOrder[a] - sortOrder[b]);
        captured.b.sort((a, b) => sortOrder[a] - sortOrder[b]);

        // Calculate point differential
        const pointValue = { p: 1, n: 3, b: 3, r: 5, q: 9 };
        const whitePoints = captured.w.reduce((sum, p) => sum + (pointValue[p] || 0), 0);
        const blackPoints = captured.b.reduce((sum, p) => sum + (pointValue[p] || 0), 0);

        // Determine which captured area is top vs bottom based on player color
        // Top = opponent's captures (pieces they took from you)
        // Bottom = your captures (pieces you took from them)
        const aiColor = this.playerColor === 'w' ? 'b' : 'w';

        this.renderCapturedArea('chess-captured-top', captured[aiColor], aiColor, blackPoints - whitePoints, aiColor);
        this.renderCapturedArea('chess-captured-bottom', captured[this.playerColor], this.playerColor, whitePoints - blackPoints, this.playerColor);
    }

    renderCapturedArea(containerId, pieces, capturedByColor, pointDiff, color) {
        const area = this.container.querySelector(`#${containerId}`);
        if (!area) return;

        const piecesEl = area.querySelector('.chess-captured-pieces');
        const diffEl = area.querySelector('.chess-point-diff');

        // Captured pieces are the OPPONENT's color
        const opponentColor = capturedByColor === 'w' ? 'B' : 'W';

        piecesEl.innerHTML = pieces.map(p => {
            const name = this.getPieceFileName(p);
            return `<img src="${this.piecePath}/${opponentColor}_${name}.png" alt="${name}" />`;
        }).join('');

        if (pointDiff > 0) {
            diffEl.textContent = `+${pointDiff}`;
            diffEl.className = 'chess-point-diff';
        } else if (pointDiff < 0) {
            diffEl.textContent = `${pointDiff}`;
            diffEl.className = 'chess-point-diff negative';
        } else {
            diffEl.textContent = '';
        }
    }

    // ---- Piece Info Tooltip ----

    showPieceInfo(square) {
        const piece = this.chess.get(square);
        if (!piece) {
            this.hidePieceInfo();
            return;
        }

        const info = this.pieceInfo[piece.type];
        if (!info) return;

        const panel = this.container.querySelector('#chess-piece-info');
        if (!panel) return;

        panel.querySelector('.chess-piece-info-name').textContent = `${piece.color === 'w' ? 'White' : 'Black'} ${info.name}`;
        panel.querySelector('.chess-piece-info-value').textContent = info.value > 0 ? `Worth ${info.value} point${info.value !== 1 ? 's' : ''}` : 'Priceless!';
        panel.querySelector('.chess-piece-info-desc').textContent = info.desc;
        panel.classList.add('visible');
    }

    hidePieceInfo() {
        const panel = this.container.querySelector('#chess-piece-info');
        if (panel) panel.classList.remove('visible');
    }

    // ---- Game Over ----

    showGameOver() {
        let title = '';
        let subtitle = '';

        if (this.chess.in_checkmate()) {
            const loser = this.chess.turn();
            if (loser === this.playerColor) {
                title = '😔 Checkmate!';
                subtitle = 'Better luck next time!';
            } else {
                title = '🎉 Checkmate!';
                subtitle = 'You win! Great job!';
            }
        } else if (this.chess.in_stalemate()) {
            title = '🤝 Stalemate!';
            subtitle = "It's a draw — no legal moves left.";
        } else if (this.chess.in_draw()) {
            title = '🤝 Draw!';
            subtitle = 'The game ended in a draw.';
        }

        const overlay = document.createElement('div');
        overlay.className = 'chess-game-over';
        overlay.innerHTML = `
            <div class="chess-game-over-box">
                <div class="chess-game-over-title">${title}</div>
                <div class="chess-game-over-subtitle">${subtitle}</div>
                <div class="chess-game-over-btns">
                    <button class="chess-btn-replay primary">▶ Play Again</button>
                    <button class="chess-btn-back-title">🏠 Title Screen</button>
                </div>
            </div>
        `;

        overlay.querySelector('.chess-btn-replay').addEventListener('click', () => {
            overlay.remove();
            this.startGame();
        });
        overlay.querySelector('.chess-btn-back-title').addEventListener('click', () => {
            overlay.remove();
            this.backToTitle();
        });

        this.container.querySelector('.chess-playing-screen')?.appendChild(overlay);
    }

    backToTitle() {
        this.currentScreen = 'title';
        this.container.innerHTML = this.createSplashScreen();
        this.setupSplashEvents();
    }

    // ---- Theme Picker (in-game) ----

    toggleThemePicker() {
        // Cycle through themes for simplicity
        const keys = Object.keys(this.themes);
        const idx = keys.indexOf(this.boardTheme);
        this.boardTheme = keys[(idx + 1) % keys.length];

        const board = this.container.querySelector('.chess-board');
        if (board) {
            // Remove old theme classes
            keys.forEach(k => board.classList.remove(`theme-${k}`));
            board.classList.add(`theme-${this.boardTheme}`);
        }
    }

    // ============================
    //  AI ENGINE (Minimax + Alpha-Beta)
    // ============================

    doAiMove() {
        if (this.chess.game_over()) return;

        this.aiThinking = true;
        const thinkingEl = this.container.querySelector('.chess-thinking');
        if (thinkingEl) thinkingEl.classList.add('visible');

        // Use setTimeout so UI can update before heavy computation
        const delay = 300 + Math.random() * 400;
        setTimeout(() => {
            const move = this.findBestMove();
            if (move) {
                const result = this.chess.move(move);
                if (result) {
                    this.lastMove = { from: result.from, to: result.to };
                }
            }

            this.aiThinking = false;
            if (thinkingEl) thinkingEl.classList.remove('visible');
            this.selectedSquare = null;
            this.legalMoves = [];
            this.renderBoard();

            if (this.chess.game_over()) {
                this.showGameOver();
            }
        }, delay);
    }

    findBestMove() {
        const moves = this.chess.moves({ verbose: true });
        if (moves.length === 0) return null;

        let depth, useRandom;
        switch (this.difficulty) {
            case 'easy':
                depth = 1;
                useRandom = 0.3; // 30% chance of random move
                break;
            case 'medium':
                depth = 2;
                useRandom = 0;
                break;
            case 'hard':
                depth = 3;
                useRandom = 0;
                break;
            default:
                depth = 2;
                useRandom = 0;
        }

        // Random move chance (easy mode)
        if (useRandom > 0 && Math.random() < useRandom) {
            return moves[Math.floor(Math.random() * moves.length)];
        }

        // AI color
        const aiColor = this.playerColor === 'w' ? 'b' : 'w';
        const isMaximizing = aiColor === 'w'; // White maximizes, black minimizes

        let bestMove = null;
        let bestScore = isMaximizing ? -Infinity : Infinity;

        // Move ordering: captures and checks first for better pruning
        moves.sort((a, b) => {
            let scoreA = 0, scoreB = 0;
            if (a.captured) scoreA += this.PIECE_VALUES[a.captured] || 0;
            if (b.captured) scoreB += this.PIECE_VALUES[b.captured] || 0;
            return scoreB - scoreA;
        });

        for (const move of moves) {
            this.chess.move(move);
            const score = this.minimax(depth - 1, -Infinity, Infinity, !isMaximizing);
            this.chess.undo();

            if (isMaximizing) {
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            } else {
                if (score < bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            }
        }

        return bestMove;
    }

    minimax(depth, alpha, beta, isMaximizing) {
        if (depth === 0 || this.chess.game_over()) {
            return this.evaluate();
        }

        const moves = this.chess.moves({ verbose: true });

        // Move ordering
        moves.sort((a, b) => {
            let scoreA = 0, scoreB = 0;
            if (a.captured) scoreA += this.PIECE_VALUES[a.captured] || 0;
            if (b.captured) scoreB += this.PIECE_VALUES[b.captured] || 0;
            return scoreB - scoreA;
        });

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                this.chess.move(move);
                const eval_ = this.minimax(depth - 1, alpha, beta, false);
                this.chess.undo();
                maxEval = Math.max(maxEval, eval_);
                alpha = Math.max(alpha, eval_);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                this.chess.move(move);
                const eval_ = this.minimax(depth - 1, alpha, beta, true);
                this.chess.undo();
                minEval = Math.min(minEval, eval_);
                beta = Math.min(beta, eval_);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    evaluate() {
        // Terminal states
        if (this.chess.in_checkmate()) {
            // The side to move is checkmated
            return this.chess.turn() === 'w' ? -99999 : 99999;
        }
        if (this.chess.in_draw() || this.chess.in_stalemate()) {
            return 0;
        }

        let score = 0;
        const board = this.chess.board();

        for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
                const piece = board[r][f];
                if (!piece) continue;

                // Material
                let pieceScore = this.PIECE_VALUES[piece.type] || 0;

                // Positional bonus from piece-square tables
                const pstKey = piece.type;
                if (this.PST[pstKey]) {
                    if (piece.color === 'w') {
                        pieceScore += this.PST[pstKey][r][f];
                    } else {
                        // Mirror for black (flip rank)
                        pieceScore += this.PST[pstKey][7 - r][f];
                    }
                }

                score += piece.color === 'w' ? pieceScore : -pieceScore;
            }
        }

        return score;
    }

    buildPieceSquareTables() {
        // Standard piece-square tables (from white's perspective)
        // Index [rank][file] where rank 0 = row 8 (black's back rank)
        return {
            p: [ // Pawn
                [ 0,  0,  0,  0,  0,  0,  0,  0],
                [50, 50, 50, 50, 50, 50, 50, 50],
                [10, 10, 20, 30, 30, 20, 10, 10],
                [ 5,  5, 10, 25, 25, 10,  5,  5],
                [ 0,  0,  0, 20, 20,  0,  0,  0],
                [ 5, -5,-10,  0,  0,-10, -5,  5],
                [ 5, 10, 10,-20,-20, 10, 10,  5],
                [ 0,  0,  0,  0,  0,  0,  0,  0]
            ],
            n: [ // Knight
                [-50,-40,-30,-30,-30,-30,-40,-50],
                [-40,-20,  0,  0,  0,  0,-20,-40],
                [-30,  0, 10, 15, 15, 10,  0,-30],
                [-30,  5, 15, 20, 20, 15,  5,-30],
                [-30,  0, 15, 20, 20, 15,  0,-30],
                [-30,  5, 10, 15, 15, 10,  5,-30],
                [-40,-20,  0,  5,  5,  0,-20,-40],
                [-50,-40,-30,-30,-30,-30,-40,-50]
            ],
            b: [ // Bishop
                [-20,-10,-10,-10,-10,-10,-10,-20],
                [-10,  0,  0,  0,  0,  0,  0,-10],
                [-10,  0, 10, 10, 10, 10,  0,-10],
                [-10,  5,  5, 10, 10,  5,  5,-10],
                [-10,  0,  5, 10, 10,  5,  0,-10],
                [-10, 10, 10, 10, 10, 10, 10,-10],
                [-10,  5,  0,  0,  0,  0,  5,-10],
                [-20,-10,-10,-10,-10,-10,-10,-20]
            ],
            r: [ // Rook
                [ 0,  0,  0,  0,  0,  0,  0,  0],
                [ 5, 10, 10, 10, 10, 10, 10,  5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [ 0,  0,  0,  5,  5,  0,  0,  0]
            ],
            q: [ // Queen
                [-20,-10,-10, -5, -5,-10,-10,-20],
                [-10,  0,  0,  0,  0,  0,  0,-10],
                [-10,  0,  5,  5,  5,  5,  0,-10],
                [ -5,  0,  5,  5,  5,  5,  0, -5],
                [  0,  0,  5,  5,  5,  5,  0, -5],
                [-10,  5,  5,  5,  5,  5,  0,-10],
                [-10,  0,  5,  0,  0,  0,  0,-10],
                [-20,-10,-10, -5, -5,-10,-10,-20]
            ],
            k: [ // King (middlegame - encourages castling)
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-20,-30,-30,-40,-40,-30,-30,-20],
                [-10,-20,-20,-20,-20,-20,-20,-10],
                [ 20, 20,  0,  0,  0,  0, 20, 20],
                [ 20, 30, 10,  0,  0, 10, 30, 20]
            ]
        };
    }
}
