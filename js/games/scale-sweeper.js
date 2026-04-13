// =================================
// SCALE SWEEPER — Minesweeper for ElxaOS
// =================================
class ScaleSweeper {
    constructor(windowManager, gameData = {}) {
        this.windowManager = windowManager;
        this.gameData = gameData;

        // Difficulty presets
        this.PRESETS = {
            easy:   { rows: 9,  cols: 9,  snakes: 10 },
            medium: { rows: 16, cols: 16, snakes: 40 },
            hard:   { rows: 16, cols: 30, snakes: 99 }
        };

        // Window sizes per difficulty (snug fit around the board)
        this.WINDOW_SIZES = {
            easy:   { width: 300, height: 400 },
            medium: { width: 460, height: 555 },
            hard:   { width: 800, height: 555 }
        };

        // Game state
        this.difficulty = 'easy';
        this.rows = 9;
        this.cols = 9;
        this.totalSnakes = 10;
        this.board = [];        // { snake, count }
        this.revealed = [];     // booleans
        this.flagged = [];      // booleans
        this.gameState = 'idle'; // idle | playing | won | lost
        this.firstClick = true;
        this.flagCount = 0;
        this.revealedCount = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.windowId = null;

        // High scores per difficulty (best time in seconds)
        try {
            this.highScores = JSON.parse(localStorage.getItem('elxaOS-scalesweeper-scores') || '{}');
        } catch (e) {
            this.highScores = {};
        }
    }

    launch(programInfo) {
        this.windowId = 'scale-sweeper-' + Date.now();

        const content = this.createInterface();

        var startSize = this.WINDOW_SIZES.easy;
        this.windowManager.createWindow(
            this.windowId,
            'Scale Sweeper',
            content,
            { width: startSize.width + 'px', height: startSize.height + 'px', x: '200px', y: '80px' }
        );

        this.setupEventHandlers(this.windowId);
        this.newGame('easy');

        // Listen for window close to clean up timer
        if (typeof elxaOS !== 'undefined' && elxaOS.eventBus) {
            var self = this;
            var handler = function(data) {
                if (data && data.id === self.windowId) {
                    self.stopTimer();
                    elxaOS.eventBus.off('window.closed', handler);
                }
            };
            elxaOS.eventBus.on('window.closed', handler);
        }

        return this.windowId;
    }

    createInterface() {
        return '<div class="ss-container" id="ss-container">' +
            '<div class="ss-header">' +
                '<div class="ss-counter ss-snake-counter" id="ss-snake-count">010</div>' +
                '<button class="ss-face-btn" id="ss-face-btn" title="New Game">&#x1F60A;</button>' +
                '<div class="ss-counter ss-timer" id="ss-timer">000</div>' +
            '</div>' +
            '<div class="ss-controls">' +
                '<button class="ss-diff-btn active" data-diff="easy">Easy (9\u00d79)</button>' +
                '<button class="ss-diff-btn" data-diff="medium">Medium (16\u00d716)</button>' +
                '<button class="ss-diff-btn" data-diff="hard">Hard (16\u00d730)</button>' +
            '</div>' +
            '<div class="ss-board-wrap">' +
                '<div class="ss-board" id="ss-board"></div>' +
            '</div>' +
            '<div class="ss-statusbar">' +
                '<span class="ss-status-text" id="ss-status">Click any tile to start \u2014 first click is always safe!</span>' +
                '<span class="ss-best-time" id="ss-best-time"></span>' +
            '</div>' +
        '</div>';
    }

    setupEventHandlers(windowId) {
        var win = document.getElementById('window-' + windowId);
        if (!win) return;

        var self = this;
        var boardEl = win.querySelector('#ss-board');
        var faceBtn = win.querySelector('#ss-face-btn');
        var diffBtns = win.querySelectorAll('.ss-diff-btn');

        // Left click on board
        boardEl.addEventListener('click', function(e) {
            var cell = e.target.closest('.ss-cell');
            if (!cell) return;
            if (self.gameState === 'won' || self.gameState === 'lost') return;
            var row = parseInt(cell.dataset.row);
            var col = parseInt(cell.dataset.col);
            if (self.revealed[row][col]) {
                self.chordReveal(row, col);
            } else {
                self.revealCell(row, col);
            }
        });

        // Right click — flag
        boardEl.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            var cell = e.target.closest('.ss-cell');
            if (!cell) return;
            if (self.gameState === 'won' || self.gameState === 'lost') return;
            if (self.gameState === 'idle') return;
            self.toggleFlag(parseInt(cell.dataset.row), parseInt(cell.dataset.col));
        });

        // Mousedown — show surprised face while clicking
        boardEl.addEventListener('mousedown', function(e) {
            if (e.target.closest('.ss-cell') && self.gameState === 'playing') {
                self.updateFaceButton('click');
            }
        });
        boardEl.addEventListener('mouseup', function() {
            if (self.gameState === 'playing') self.updateFaceButton('idle');
        });
        boardEl.addEventListener('mouseleave', function() {
            if (self.gameState === 'playing') self.updateFaceButton('idle');
        });

        // Face button — new game
        faceBtn.addEventListener('click', function() {
            self.newGame(self.difficulty);
        });

        // Difficulty buttons
        diffBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                diffBtns.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                self.newGame(btn.dataset.diff);
            });
        });
    }

    // ========================
    // CORE GAME LOGIC
    // ========================

    newGame(difficulty) {
        this.stopTimer();
        this.difficulty = difficulty;

        var preset = this.PRESETS[difficulty];
        this.rows = preset.rows;
        this.cols = preset.cols;
        this.totalSnakes = preset.snakes;

        // Init arrays
        this.board = [];
        this.revealed = [];
        this.flagged = [];
        for (var r = 0; r < this.rows; r++) {
            this.board[r] = [];
            this.revealed[r] = [];
            this.flagged[r] = [];
            for (var c = 0; c < this.cols; c++) {
                this.board[r][c] = { snake: false, count: 0 };
                this.revealed[r][c] = false;
                this.flagged[r][c] = false;
            }
        }

        this.gameState = 'idle';
        this.firstClick = true;
        this.flagCount = 0;
        this.revealedCount = 0;
        this.timer = 0;

        this.updateFaceButton('idle');
        this.updateFlagCounter();
        this.updateTimerDisplay();
        this.setStatus('Click any tile to start \u2014 first click is always safe!');
        this.renderBoard();
        this.updateBestTime();

        // Resize window to fit the new board size
        var winEl = document.getElementById('window-' + this.windowId);
        if (winEl) {
            var size = this.WINDOW_SIZES[difficulty];
            winEl.style.width = size.width + 'px';
            winEl.style.height = size.height + 'px';
        }
    }

    placeSnakes(safeRow, safeCol) {
        // Collect excluded cells (first click + all 8 neighbors)
        var excluded = new Set();
        for (var dr = -1; dr <= 1; dr++) {
            for (var dc = -1; dc <= 1; dc++) {
                var nr = safeRow + dr;
                var nc = safeCol + dc;
                if (this.isInBounds(nr, nc)) {
                    excluded.add(nr * this.cols + nc);
                }
            }
        }

        // Build pool of valid positions
        var pool = [];
        for (var r = 0; r < this.rows; r++) {
            for (var c = 0; c < this.cols; c++) {
                if (!excluded.has(r * this.cols + c)) {
                    pool.push([r, c]);
                }
            }
        }

        // Fisher-Yates shuffle, place first N as snakes
        for (var i = pool.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = pool[i];
            pool[i] = pool[j];
            pool[j] = tmp;
        }

        for (var k = 0; k < this.totalSnakes; k++) {
            this.board[pool[k][0]][pool[k][1]].snake = true;
        }

        this.calculateNumbers();
    }

    calculateNumbers() {
        for (var r = 0; r < this.rows; r++) {
            for (var c = 0; c < this.cols; c++) {
                if (this.board[r][c].snake) continue;
                var count = 0;
                var neighbors = this.getNeighbors(r, c);
                for (var i = 0; i < neighbors.length; i++) {
                    if (this.board[neighbors[i][0]][neighbors[i][1]].snake) count++;
                }
                this.board[r][c].count = count;
            }
        }
    }

    // ========================
    // PLAYER ACTIONS
    // ========================

    revealCell(row, col) {
        if (this.flagged[row][col]) return;
        if (this.revealed[row][col]) return;

        // First click — place snakes now (guarantees safety)
        if (this.firstClick) {
            this.firstClick = false;
            this.gameState = 'playing';
            this.placeSnakes(row, col);
            this.startTimer();
        }

        if (this.board[row][col].snake) {
            this.gameOver(row, col);
            return;
        }

        if (this.board[row][col].count === 0) {
            this.floodReveal(row, col);
        } else {
            this.revealOne(row, col);
        }

        this.checkWin();
    }

    revealOne(row, col) {
        if (this.revealed[row][col]) return;
        this.revealed[row][col] = true;
        this.revealedCount++;
        this.renderCell(row, col, null);
    }

    toggleFlag(row, col) {
        if (this.revealed[row][col]) return;

        if (this.flagged[row][col]) {
            this.flagged[row][col] = false;
            this.flagCount--;
        } else {
            this.flagged[row][col] = true;
            this.flagCount++;
        }

        this.renderCell(row, col, null);
        this.updateFlagCounter();
    }

    floodReveal(startRow, startCol) {
        var queue = [[startRow, startCol]];
        var visited = new Set();
        visited.add(startRow * this.cols + startCol);

        while (queue.length > 0) {
            var current = queue.shift();
            var r = current[0];
            var c = current[1];
            if (this.revealed[r][c]) continue;
            this.revealOne(r, c);

            if (this.board[r][c].count === 0) {
                var neighbors = this.getNeighbors(r, c);
                for (var i = 0; i < neighbors.length; i++) {
                    var nr = neighbors[i][0];
                    var nc = neighbors[i][1];
                    var key = nr * this.cols + nc;
                    if (!visited.has(key) && !this.revealed[nr][nc] && !this.flagged[nr][nc]) {
                        visited.add(key);
                        queue.push([nr, nc]);
                    }
                }
            }
        }
    }

    chordReveal(row, col) {
        if (!this.revealed[row][col]) return;
        if (this.board[row][col].count === 0) return;

        var neighbors = this.getNeighbors(row, col);
        var adjFlags = 0;
        for (var i = 0; i < neighbors.length; i++) {
            if (this.flagged[neighbors[i][0]][neighbors[i][1]]) adjFlags++;
        }

        if (adjFlags !== this.board[row][col].count) return;

        // Reveal all non-flagged, non-revealed neighbors
        var hitSnake = false;
        var hitRow = -1, hitCol = -1;

        for (var j = 0; j < neighbors.length; j++) {
            var nr = neighbors[j][0];
            var nc = neighbors[j][1];
            if (!this.flagged[nr][nc] && !this.revealed[nr][nc]) {
                if (this.board[nr][nc].snake) {
                    hitSnake = true;
                    hitRow = nr;
                    hitCol = nc;
                } else if (this.board[nr][nc].count === 0) {
                    this.revealOne(nr, nc);
                    this.floodReveal(nr, nc);
                } else {
                    this.revealOne(nr, nc);
                }
            }
        }

        if (hitSnake) {
            this.gameOver(hitRow, hitCol);
        } else {
            this.checkWin();
        }
    }

    // ========================
    // GAME FLOW
    // ========================

    checkWin() {
        var safeCells = this.rows * this.cols - this.totalSnakes;
        if (this.revealedCount >= safeCells) {
            this.gameWin();
        }
    }

    gameOver(hitRow, hitCol) {
        this.stopTimer();
        this.gameState = 'lost';
        this.updateFaceButton('lost');
        this.setStatus('\uD83D\uDC80 Oops! You stepped on a Sussy Snake! Better luck next time.');

        // Reveal all unrevealed snakes, mark wrong flags
        for (var r = 0; r < this.rows; r++) {
            for (var c = 0; c < this.cols; c++) {
                if (this.board[r][c].snake && !this.flagged[r][c]) {
                    this.revealed[r][c] = true;
                    if (r === hitRow && c === hitCol) {
                        this.renderCell(r, c, 'hit');
                    } else {
                        this.renderCell(r, c, 'snake');
                    }
                } else if (!this.board[r][c].snake && this.flagged[r][c]) {
                    this.renderCell(r, c, 'wrong');
                }
            }
        }
    }

    gameWin() {
        this.stopTimer();
        this.gameState = 'won';
        this.updateFaceButton('won');

        var elapsed = this.timer;
        var best = this.highScores[this.difficulty];

        // Auto-flag all remaining unflagged snakes
        for (var r = 0; r < this.rows; r++) {
            for (var c = 0; c < this.cols; c++) {
                if (this.board[r][c].snake && !this.flagged[r][c]) {
                    this.flagged[r][c] = true;
                    this.flagCount++;
                    this.renderCell(r, c, null);
                }
            }
        }
        this.updateFlagCounter();

        var msg = '\uD83D\uDE0E You found all the Sussy Snakes! Time: ' + elapsed + 's';
        if (!best || elapsed < best) {
            this.highScores[this.difficulty] = elapsed;
            localStorage.setItem('elxaOS-scalesweeper-scores', JSON.stringify(this.highScores));
            msg += ' \u2014 \uD83C\uDFC6 New best time!';
        }
        this.setStatus(msg);
        this.updateBestTime();
    }

    // ========================
    // TIMER
    // ========================

    startTimer() {
        var self = this;
        this.timer = 0;
        this.updateTimerDisplay();
        this.timerInterval = setInterval(function() {
            if (self.timer < 999) {
                self.timer++;
                self.updateTimerDisplay();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        var el = document.getElementById('ss-timer');
        if (el) el.textContent = String(this.timer).padStart(3, '0');
    }

    // ========================
    // UI UPDATES
    // ========================

    renderBoard() {
        var boardEl = document.getElementById('ss-board');
        if (!boardEl) return;

        boardEl.style.gridTemplateColumns = 'repeat(' + this.cols + ', 24px)';
        boardEl.innerHTML = '';

        var frag = document.createDocumentFragment();
        for (var r = 0; r < this.rows; r++) {
            for (var c = 0; c < this.cols; c++) {
                var cell = document.createElement('div');
                cell.className = 'ss-cell ss-cell-hidden';
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.id = 'ss-cell-' + r + '-' + c;
                frag.appendChild(cell);
            }
        }
        boardEl.appendChild(frag);
    }

    renderCell(row, col, override) {
        var cell = document.getElementById('ss-cell-' + row + '-' + col);
        if (!cell) return;

        cell.className = 'ss-cell';
        cell.textContent = '';

        var state = override || this._getCellState(row, col);

        if (state === 'hidden') {
            cell.classList.add('ss-cell-hidden');
        } else if (state === 'flagged') {
            cell.classList.add('ss-cell-hidden', 'ss-cell-flagged');
            cell.textContent = '\uD83D\uDEA9';
        } else if (state === 'revealed') {
            cell.classList.add('ss-cell-revealed');
            var count = this.board[row][col].count;
            if (count > 0) {
                cell.classList.add('ss-cell-n' + count);
                cell.textContent = count;
            }
        } else if (state === 'snake') {
            cell.classList.add('ss-cell-snake');
            cell.textContent = '\uD83D\uDC0D';
        } else if (state === 'hit') {
            cell.classList.add('ss-cell-snake-hit');
            cell.textContent = '\uD83D\uDC0D';
        } else if (state === 'wrong') {
            cell.classList.add('ss-cell-wrong');
            cell.textContent = '\u274C';
        }
    }

    _getCellState(row, col) {
        if (this.flagged[row][col]) return 'flagged';
        if (!this.revealed[row][col]) return 'hidden';
        if (this.board[row][col].snake) return 'snake';
        return 'revealed';
    }

    updateFlagCounter() {
        var el = document.getElementById('ss-snake-count');
        if (!el) return;
        var remaining = this.totalSnakes - this.flagCount;
        var str;
        if (remaining < 0) {
            str = '-' + String(Math.abs(remaining)).padStart(2, '0');
        } else {
            str = String(remaining).padStart(3, '0');
        }
        el.textContent = str;
    }

    updateFaceButton(state) {
        var btn = document.getElementById('ss-face-btn');
        if (!btn) return;
        var faces = { idle: '\uD83D\uDE0A', click: '\uD83D\uDE2E', won: '\uD83D\uDE0E', lost: '\uD83D\uDC80' };
        btn.textContent = faces[state] || '\uD83D\uDE0A';
    }

    updateBestTime() {
        var el = document.getElementById('ss-best-time');
        if (!el) return;
        var best = this.highScores[this.difficulty];
        el.textContent = best ? ('Best: ' + best + 's') : '';
    }

    setStatus(msg) {
        var el = document.getElementById('ss-status');
        if (el) el.textContent = msg;
    }

    // ========================
    // HELPERS
    // ========================

    getNeighbors(row, col) {
        var result = [];
        for (var dr = -1; dr <= 1; dr++) {
            for (var dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                var nr = row + dr;
                var nc = col + dc;
                if (this.isInBounds(nr, nc)) result.push([nr, nc]);
            }
        }
        return result;
    }

    isInBounds(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }
}
