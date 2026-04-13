// =================================
// PADDLE PANIC — Pong for ElxaOS
// =================================
class PaddlePanic {
    constructor(windowManager, gameData = {}) {
        this.windowManager = windowManager;
        this.gameData = gameData;

        // Game constants
        this.CANVAS_W = 480;
        this.CANVAS_H = 320;
        this.PADDLE_W = 8;
        this.PADDLE_H = 48;
        this.BALL_SIZE = 8;
        this.PADDLE_SPEED = 4;
        this.BALL_BASE_SPEED = 3;
        this.WIN_SCORE = 7;
        this.PADDLE_MARGIN = 16; // distance from edge

        // Difficulty presets
        this.DIFFICULTIES = {
            chill:  { aiSpeed: 2.0, aiReaction: 0.35, ballAccel: 0.15, label: 'Chill' },
            normal: { aiSpeed: 3.0, aiReaction: 0.55, ballAccel: 0.25, label: 'Normal' },
            turbo:  { aiSpeed: 4.0, aiReaction: 0.80, ballAccel: 0.35, label: 'Turbo' }
        };

        // State
        this.difficulty = 'normal';
        this.gameState = 'menu'; // menu | playing | paused | scored | gameover
        this.scoreLeft = 0;
        this.scoreRight = 0;
        this.rallyCount = 0;
        this.longestRally = 0;

        // Paddles
        this.paddleL = { x: this.PADDLE_MARGIN, y: 0 };
        this.paddleR = { x: this.CANVAS_W - this.PADDLE_MARGIN - this.PADDLE_W, y: 0 };

        // Ball
        this.ball = { x: 0, y: 0, vx: 0, vy: 0 };

        // Input
        this.keysDown = {};

        // Animation
        this.animFrame = null;
        this.lastTime = 0;
        this.windowId = null;
        this.canvas = null;
        this.ctx = null;

        // Score flash
        this.flashTimer = 0;
        this.flashSide = null; // 'left' | 'right'

        // Ball trail (cute visual)
        this.trail = [];
        this.MAX_TRAIL = 8;

        // Particles
        this.particles = [];

        // High scores
        try {
            this.stats = JSON.parse(localStorage.getItem('elxaOS-paddle-panic-stats') || '{}');
        } catch (e) {
            this.stats = {};
        }
    }

    launch(programInfo) {
        this.windowId = 'paddle-panic-' + Date.now();

        var content = this.createInterface();
        this.windowManager.createWindow(
            this.windowId,
            'Paddle Panic',
            content,
            { width: '520px', height: '440px', x: '150px', y: '60px' }
        );

        this.setupEventHandlers();
        this.drawMenu();

        // Cleanup on window close
        if (typeof elxaOS !== 'undefined' && elxaOS.eventBus) {
            var self = this;
            var handler = function(data) {
                if (data && data.id === self.windowId) {
                    self.cleanup();
                    elxaOS.eventBus.off('window.closed', handler);
                }
            };
            elxaOS.eventBus.on('window.closed', handler);
        }

        return this.windowId;
    }

    createInterface() {
        return '<div class="pp-container">' +
            '<div class="pp-hud">' +
                '<div class="pp-score-area">' +
                    '<span class="pp-score pp-score-left" id="ppScoreL">0</span>' +
                    '<span class="pp-score-sep">:</span>' +
                    '<span class="pp-score pp-score-right" id="ppScoreR">0</span>' +
                '</div>' +
                '<div class="pp-rally" id="ppRally"></div>' +
            '</div>' +
            '<div class="pp-canvas-wrap">' +
                '<canvas id="ppCanvas" width="480" height="320"></canvas>' +
            '</div>' +
            '<div class="pp-controls">' +
                '<div class="pp-diff-row">' +
                    '<button class="pp-diff-btn" data-diff="chill">Chill</button>' +
                    '<button class="pp-diff-btn active" data-diff="normal">Normal</button>' +
                    '<button class="pp-diff-btn" data-diff="turbo">Turbo</button>' +
                '</div>' +
                '<div class="pp-status" id="ppStatus">W/S or Arrow Keys to move \u2022 Space to serve</div>' +
            '</div>' +
        '</div>';
    }

    setupEventHandlers() {
        var win = document.getElementById('window-' + this.windowId);
        if (!win) return;

        var self = this;
        this.canvas = win.querySelector('#ppCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Keyboard
        this._keyDown = function(e) {
            self.keysDown[e.key] = true;
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                self.handleAction();
            }
            if (e.key === 'Escape' && self.gameState === 'playing') {
                self.gameState = 'paused';
                self.drawPaused();
            }
        };
        this._keyUp = function(e) {
            self.keysDown[e.key] = false;
        };
        document.addEventListener('keydown', this._keyDown);
        document.addEventListener('keyup', this._keyUp);

        // Canvas click (for menu / restart)
        this.canvas.addEventListener('click', function() {
            self.handleAction();
        });

        // Difficulty buttons
        var diffBtns = win.querySelectorAll('.pp-diff-btn');
        diffBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                diffBtns.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                self.difficulty = btn.dataset.diff;
                if (self.gameState === 'menu' || self.gameState === 'gameover') {
                    self.drawMenu();
                }
            });
        });

        // Focus canvas area for keyboard input
        this.canvas.setAttribute('tabindex', '0');
        this.canvas.focus();
    }

    cleanup() {
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        if (this._keyDown) document.removeEventListener('keydown', this._keyDown);
        if (this._keyUp) document.removeEventListener('keyup', this._keyUp);
    }

    // ========================
    // GAME FLOW
    // ========================

    handleAction() {
        if (this.gameState === 'menu' || this.gameState === 'gameover') {
            this.startGame();
        } else if (this.gameState === 'scored') {
            this.serve();
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.lastTime = performance.now();
            this.gameLoop(this.lastTime);
        }
    }

    startGame() {
        this.scoreLeft = 0;
        this.scoreRight = 0;
        this.rallyCount = 0;
        this.longestRally = 0;
        this.particles = [];
        this.trail = [];
        this.updateScoreDisplay();
        this.resetPositions();
        this.serve();
    }

    resetPositions() {
        this.paddleL.y = (this.CANVAS_H - this.PADDLE_H) / 2;
        this.paddleR.y = (this.CANVAS_H - this.PADDLE_H) / 2;
        this.ball.x = this.CANVAS_W / 2 - this.BALL_SIZE / 2;
        this.ball.y = this.CANVAS_H / 2 - this.BALL_SIZE / 2;
        this.ball.vx = 0;
        this.ball.vy = 0;
    }

    serve() {
        this.resetPositions();
        this.rallyCount = 0;
        this.trail = [];

        // Random direction, slight angle
        var angle = (Math.random() * 0.8 - 0.4); // -0.4 to 0.4 radians
        var dir = Math.random() < 0.5 ? -1 : 1;
        this.ball.vx = dir * this.BALL_BASE_SPEED * Math.cos(angle);
        this.ball.vy = this.BALL_BASE_SPEED * Math.sin(angle);

        this.gameState = 'playing';
        this.lastTime = performance.now();
        this.setStatus('Rally!');
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        var self = this;
        this.animFrame = requestAnimationFrame(function(t) { self.gameLoop(t); });
    }

    scored(side) {
        if (side === 'right') {
            this.scoreRight++;
            this.flashSide = 'right';
        } else {
            this.scoreLeft++;
            this.flashSide = 'left';
        }
        this.flashTimer = 30;
        if (this.rallyCount > this.longestRally) this.longestRally = this.rallyCount;
        this.updateScoreDisplay();

        // Spawn burst particles at ball position
        this.spawnBurst(this.ball.x + this.BALL_SIZE / 2, this.ball.y + this.BALL_SIZE / 2, side === 'left' ? '#ff6b9d' : '#6bcaff');

        // Check for game over
        if (this.scoreLeft >= this.WIN_SCORE || this.scoreRight >= this.WIN_SCORE) {
            this.gameState = 'gameover';
            this.saveStats();
            this.drawGameOver();
            return;
        }

        this.gameState = 'scored';
        this.setStatus('Point! Click or press Space to serve.');
        // Draw the scored frame
        this.drawFrame();
    }

    // ========================
    // GAME LOOP
    // ========================

    gameLoop(timestamp) {
        if (this.gameState !== 'playing') return;

        var dt = Math.min((timestamp - this.lastTime) / 16.67, 3); // cap at 3x speed
        this.lastTime = timestamp;

        this.updatePaddles(dt);
        this.updateBall(dt);
        this.updateParticles(dt);
        this.drawFrame();

        if (this.flashTimer > 0) this.flashTimer--;

        var self = this;
        this.animFrame = requestAnimationFrame(function(t) { self.gameLoop(t); });
    }

    updatePaddles(dt) {
        // Player paddle (left)
        if (this.keysDown['w'] || this.keysDown['W'] || this.keysDown['ArrowUp']) {
            this.paddleL.y -= this.PADDLE_SPEED * dt;
        }
        if (this.keysDown['s'] || this.keysDown['S'] || this.keysDown['ArrowDown']) {
            this.paddleL.y += this.PADDLE_SPEED * dt;
        }
        this.paddleL.y = Math.max(0, Math.min(this.CANVAS_H - this.PADDLE_H, this.paddleL.y));

        // AI paddle (right)
        var diff = this.DIFFICULTIES[this.difficulty];
        var targetY = this.ball.y + this.BALL_SIZE / 2 - this.PADDLE_H / 2;

        // Add some imprecision for lower difficulties
        var offset = (1 - diff.aiReaction) * 30 * Math.sin(performance.now() / 500);
        targetY += offset;

        var deltaY = targetY - this.paddleR.y;
        var maxMove = diff.aiSpeed * dt;

        if (Math.abs(deltaY) > 2) {
            this.paddleR.y += Math.sign(deltaY) * Math.min(Math.abs(deltaY), maxMove);
        }
        this.paddleR.y = Math.max(0, Math.min(this.CANVAS_H - this.PADDLE_H, this.paddleR.y));
    }

    updateBall(dt) {
        var diff = this.DIFFICULTIES[this.difficulty];

        // Move ball
        this.ball.x += this.ball.vx * dt;
        this.ball.y += this.ball.vy * dt;

        // Trail
        this.trail.push({ x: this.ball.x + this.BALL_SIZE / 2, y: this.ball.y + this.BALL_SIZE / 2 });
        if (this.trail.length > this.MAX_TRAIL) this.trail.shift();

        // Top/bottom bounce
        if (this.ball.y <= 0) {
            this.ball.y = 0;
            this.ball.vy = Math.abs(this.ball.vy);
            this.spawnSparks(this.ball.x + this.BALL_SIZE / 2, 0, '#fff');
        }
        if (this.ball.y + this.BALL_SIZE >= this.CANVAS_H) {
            this.ball.y = this.CANVAS_H - this.BALL_SIZE;
            this.ball.vy = -Math.abs(this.ball.vy);
            this.spawnSparks(this.ball.x + this.BALL_SIZE / 2, this.CANVAS_H, '#fff');
        }

        // Left paddle collision
        if (this.ball.vx < 0 &&
            this.ball.x <= this.paddleL.x + this.PADDLE_W &&
            this.ball.x + this.BALL_SIZE >= this.paddleL.x &&
            this.ball.y + this.BALL_SIZE >= this.paddleL.y &&
            this.ball.y <= this.paddleL.y + this.PADDLE_H) {

            this.ball.x = this.paddleL.x + this.PADDLE_W;
            this.deflect(this.paddleL, diff);
            this.rallyCount++;
            this.updateRallyDisplay();
            this.spawnSparks(this.ball.x, this.ball.y + this.BALL_SIZE / 2, '#ff6b9d');
        }

        // Right paddle collision
        if (this.ball.vx > 0 &&
            this.ball.x + this.BALL_SIZE >= this.paddleR.x &&
            this.ball.x <= this.paddleR.x + this.PADDLE_W &&
            this.ball.y + this.BALL_SIZE >= this.paddleR.y &&
            this.ball.y <= this.paddleR.y + this.PADDLE_H) {

            this.ball.x = this.paddleR.x - this.BALL_SIZE;
            this.deflect(this.paddleR, diff);
            this.rallyCount++;
            this.updateRallyDisplay();
            this.spawnSparks(this.ball.x + this.BALL_SIZE, this.ball.y + this.BALL_SIZE / 2, '#6bcaff');
        }

        // Score (ball out left/right)
        if (this.ball.x + this.BALL_SIZE < 0) {
            this.scored('right');
        } else if (this.ball.x > this.CANVAS_W) {
            this.scored('left');
        }
    }

    deflect(paddle, diff) {
        // Angle based on where ball hit paddle
        var relativeY = (this.ball.y + this.BALL_SIZE / 2) - (paddle.y + this.PADDLE_H / 2);
        var normalizedY = relativeY / (this.PADDLE_H / 2); // -1 to 1
        var angle = normalizedY * 1.1; // max ~63 degrees

        var speed = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy);
        speed += diff.ballAccel; // slight speedup each hit
        speed = Math.min(speed, 8); // cap speed

        var dir = this.ball.vx > 0 ? -1 : 1;
        this.ball.vx = dir * speed * Math.cos(angle);
        this.ball.vy = speed * Math.sin(angle);
    }

    // ========================
    // PARTICLES
    // ========================

    spawnSparks(x, y, color) {
        for (var i = 0; i < 4; i++) {
            this.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                life: 15 + Math.random() * 10,
                maxLife: 25,
                size: 2 + Math.random() * 2,
                color: color
            });
        }
    }

    spawnBurst(x, y, color) {
        for (var i = 0; i < 12; i++) {
            var angle = (Math.PI * 2 / 12) * i;
            this.particles.push({
                x: x, y: y,
                vx: Math.cos(angle) * (1.5 + Math.random() * 2),
                vy: Math.sin(angle) * (1.5 + Math.random() * 2),
                life: 20 + Math.random() * 15,
                maxLife: 35,
                size: 2 + Math.random() * 3,
                color: color
            });
        }
    }

    updateParticles(dt) {
        for (var i = this.particles.length - 1; i >= 0; i--) {
            var p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    // ========================
    // RENDERING
    // ========================

    drawFrame() {
        var ctx = this.ctx;
        if (!ctx) return;

        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.CANVAS_W, this.CANVAS_H);

        // Court lines (pixelated dashed center line)
        ctx.fillStyle = '#2a2a4a';
        var dashH = 8;
        var gap = 6;
        for (var dy = 0; dy < this.CANVAS_H; dy += dashH + gap) {
            ctx.fillRect(this.CANVAS_W / 2 - 1, dy, 2, dashH);
        }

        // Top/bottom borders
        ctx.fillStyle = '#3a3a5a';
        ctx.fillRect(0, 0, this.CANVAS_W, 2);
        ctx.fillRect(0, this.CANVAS_H - 2, this.CANVAS_W, 2);

        // Ball trail
        for (var t = 0; t < this.trail.length; t++) {
            var alpha = (t / this.trail.length) * 0.3;
            var trailSize = (this.BALL_SIZE - 2) * (t / this.trail.length);
            ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha + ')';
            ctx.fillRect(
                Math.round(this.trail[t].x - trailSize / 2),
                Math.round(this.trail[t].y - trailSize / 2),
                Math.round(trailSize),
                Math.round(trailSize)
            );
        }

        // Ball
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.round(this.ball.x), Math.round(this.ball.y), this.BALL_SIZE, this.BALL_SIZE);
        // Ball highlight pixel (top-left corner)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(Math.round(this.ball.x), Math.round(this.ball.y), 2, 2);

        // Left paddle (pink-ish)
        this.drawPaddle(ctx, this.paddleL.x, this.paddleL.y, '#ff6b9d', '#ff8bb5');

        // Right paddle (blue-ish)
        this.drawPaddle(ctx, this.paddleR.x, this.paddleR.y, '#6bcaff', '#8dd8ff');

        // Particles
        for (var i = 0; i < this.particles.length; i++) {
            var p = this.particles[i];
            var pAlpha = Math.max(0, p.life / p.maxLife);
            ctx.globalAlpha = pAlpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(Math.round(p.x - p.size / 2), Math.round(p.y - p.size / 2), Math.round(p.size), Math.round(p.size));
        }
        ctx.globalAlpha = 1;

        // Score flash overlay
        if (this.flashTimer > 0 && this.flashSide) {
            var flashAlpha = (this.flashTimer / 30) * 0.15;
            ctx.fillStyle = this.flashSide === 'left' ? 'rgba(255, 107, 157, ' + flashAlpha + ')' : 'rgba(107, 202, 255, ' + flashAlpha + ')';
            var flashX = this.flashSide === 'left' ? 0 : this.CANVAS_W / 2;
            ctx.fillRect(flashX, 0, this.CANVAS_W / 2, this.CANVAS_H);
        }
    }

    drawPaddle(ctx, x, y, mainColor, highlightColor) {
        // Main paddle body
        ctx.fillStyle = mainColor;
        ctx.fillRect(Math.round(x), Math.round(y), this.PADDLE_W, this.PADDLE_H);
        // Highlight strip (left edge, 2px wide)
        ctx.fillStyle = highlightColor;
        ctx.fillRect(Math.round(x), Math.round(y), 2, this.PADDLE_H);
        // Top highlight
        ctx.fillRect(Math.round(x), Math.round(y), this.PADDLE_W, 2);
        // Shadow (bottom-right)
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(Math.round(x) + this.PADDLE_W - 2, Math.round(y) + 2, 2, this.PADDLE_H - 2);
        ctx.fillRect(Math.round(x) + 2, Math.round(y) + this.PADDLE_H - 2, this.PADDLE_W - 2, 2);
    }

    // ========================
    // SCREENS
    // ========================

    drawMenu() {
        var ctx = this.ctx;
        if (!ctx) return;

        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.CANVAS_W, this.CANVAS_H);

        // Decorative paddles on sides
        this.drawPaddle(ctx, 30, 100, '#ff6b9d', '#ff8bb5');
        this.drawPaddle(ctx, this.CANVAS_W - 38, 180, '#6bcaff', '#8dd8ff');

        // Decorative ball
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.CANVAS_W / 2 - 4, this.CANVAS_H / 2 + 20, 8, 8);

        // Dotted center line
        ctx.fillStyle = '#2a2a4a';
        for (var dy = 0; dy < this.CANVAS_H; dy += 14) {
            ctx.fillRect(this.CANVAS_W / 2 - 1, dy, 2, 8);
        }

        // Title
        ctx.fillStyle = '#ff6b9d';
        ctx.font = 'bold 36px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PADDLE', this.CANVAS_W / 2, 80);
        ctx.fillStyle = '#6bcaff';
        ctx.fillText('PANIC', this.CANVAS_W / 2, 120);

        // Subtitle
        ctx.fillStyle = '#666688';
        ctx.font = '12px "Courier New", monospace';
        ctx.fillText('a very serious table tennis simulator', this.CANVAS_W / 2, 155);

        // Instructions
        ctx.fillStyle = '#aaaacc';
        ctx.font = '14px "Courier New", monospace';
        ctx.fillText('Click or press Space to play!', this.CANVAS_W / 2, 220);

        ctx.fillStyle = '#666688';
        ctx.font = '11px "Courier New", monospace';
        ctx.fillText('W/S or Arrow Keys to move', this.CANVAS_W / 2, 250);
        ctx.fillText('First to 7 wins!', this.CANVAS_W / 2, 268);

        // Stats
        var wins = this.stats[this.difficulty + '_wins'] || 0;
        var losses = this.stats[this.difficulty + '_losses'] || 0;
        if (wins + losses > 0) {
            ctx.fillStyle = '#555577';
            ctx.font = '10px "Courier New", monospace';
            ctx.fillText(this.DIFFICULTIES[this.difficulty].label + ' record: ' + wins + 'W / ' + losses + 'L', this.CANVAS_W / 2, 300);
        }

        ctx.textAlign = 'left';
    }

    drawPaused() {
        // Draw current frame underneath
        this.drawFrame();

        var ctx = this.ctx;
        // Overlay
        ctx.fillStyle = 'rgba(26, 26, 46, 0.7)';
        ctx.fillRect(0, 0, this.CANVAS_W, this.CANVAS_H);

        ctx.fillStyle = '#aaaacc';
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', this.CANVAS_W / 2, this.CANVAS_H / 2 - 10);

        ctx.fillStyle = '#666688';
        ctx.font = '12px "Courier New", monospace';
        ctx.fillText('Click or press Space to resume', this.CANVAS_W / 2, this.CANVAS_H / 2 + 20);

        ctx.textAlign = 'left';
    }

    drawGameOver() {
        this.drawFrame();

        var ctx = this.ctx;

        // Overlay
        ctx.fillStyle = 'rgba(26, 26, 46, 0.8)';
        ctx.fillRect(0, 0, this.CANVAS_W, this.CANVAS_H);

        var playerWon = this.scoreLeft >= this.WIN_SCORE;

        // Result
        ctx.textAlign = 'center';
        if (playerWon) {
            ctx.fillStyle = '#ff6b9d';
            ctx.font = 'bold 28px "Courier New", monospace';
            ctx.fillText('YOU WIN!', this.CANVAS_W / 2, 100);

            ctx.fillStyle = '#aaaacc';
            ctx.font = '13px "Courier New", monospace';
            ctx.fillText('The crowd goes mild!', this.CANVAS_W / 2, 130);
        } else {
            ctx.fillStyle = '#6bcaff';
            ctx.font = 'bold 28px "Courier New", monospace';
            ctx.fillText('CPU WINS', this.CANVAS_W / 2, 100);

            ctx.fillStyle = '#aaaacc';
            ctx.font = '13px "Courier New", monospace';
            ctx.fillText('Better luck next time!', this.CANVAS_W / 2, 130);
        }

        // Final score
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillText(this.scoreLeft + ' - ' + this.scoreRight, this.CANVAS_W / 2, 175);

        // Stats
        ctx.fillStyle = '#888899';
        ctx.font = '11px "Courier New", monospace';
        ctx.fillText('Longest rally: ' + this.longestRally + ' hits', this.CANVAS_W / 2, 210);
        ctx.fillText('Difficulty: ' + this.DIFFICULTIES[this.difficulty].label, this.CANVAS_W / 2, 228);

        // Play again
        ctx.fillStyle = '#aaaacc';
        ctx.font = '14px "Courier New", monospace';
        ctx.fillText('Click or press Space to play again!', this.CANVAS_W / 2, 275);

        ctx.textAlign = 'left';
    }

    // ========================
    // UI UPDATES
    // ========================

    updateScoreDisplay() {
        var el = document.getElementById('ppScoreL');
        if (el) el.textContent = this.scoreLeft;
        var er = document.getElementById('ppScoreR');
        if (er) er.textContent = this.scoreRight;
    }

    updateRallyDisplay() {
        var el = document.getElementById('ppRally');
        if (el) {
            if (this.rallyCount >= 3) {
                el.textContent = 'Rally: ' + this.rallyCount;
                el.style.opacity = '1';
            } else {
                el.style.opacity = '0';
            }
        }
    }

    setStatus(msg) {
        var el = document.getElementById('ppStatus');
        if (el) el.textContent = msg;
    }

    saveStats() {
        var key = this.difficulty;
        var playerWon = this.scoreLeft >= this.WIN_SCORE;
        if (playerWon) {
            this.stats[key + '_wins'] = (this.stats[key + '_wins'] || 0) + 1;
        } else {
            this.stats[key + '_losses'] = (this.stats[key + '_losses'] || 0) + 1;
        }
        var bestRally = this.stats[key + '_bestRally'] || 0;
        if (this.longestRally > bestRally) {
            this.stats[key + '_bestRally'] = this.longestRally;
        }
        localStorage.setItem('elxaOS-paddle-panic-stats', JSON.stringify(this.stats));
    }
}
