// =================================
// SNAKE GAME - Modular Implementation for ElxaOS
// =================================
class SnakeGame {
    constructor(windowManager, gameData = {}) {
        this.windowManager = windowManager;
        this.gameData = gameData;
        
        // Game state
        this.gameActive = false;
        this.gameStarted = false;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('elxaOS-snake-highscore') || '0');
        this.speed = gameData.speed || 150; // milliseconds per move
        this.currentSpeed = this.speed;
        
        // Game board configuration
        this.boardSize = gameData.boardSize || 20; // 20x20 grid
        this.cellSize = 20; // pixels per cell
        
        // Snake state
        this.snake = [{ x: 10, y: 10 }]; // Start in center
        this.direction = { x: 1, y: 0 }; // Moving right initially
        this.nextDirection = { x: 1, y: 0 };
        
        // Food state
        this.food = { x: 0, y: 0 };
        
        // Game elements (will be set when window is created)
        this.canvas = null;
        this.ctx = null;
        this.gameLoopInterval = null;
        
        // Input handling
        this.keyHandler = this.handleKeyPress.bind(this);
        
        this.generateFood();
    }

    launch(programInfo) {
        const windowId = `snake-${programInfo.id}-${Date.now()}`;
        const windowContent = this.createGameInterface();
        
        const window = this.windowManager.createWindow(
            windowId,
            `🐍 ${programInfo.name}`,
            windowContent,
            { width: '520px', height: '580px', x: '200px', y: '100px' }
        );
        
        this.setupGameEvents(windowId);
        return windowId;
    }

    createGameInterface() {
        const boardPixelSize = this.boardSize * this.cellSize;
        
        return `
            <div class="snake-game-container">
                <div class="snake-header">
                    <div class="snake-title">🐍 Classic Snake Game</div>
                    <div class="snake-stats">
                        <div class="stat-item">
                            <span class="stat-label">Score:</span>
                            <span class="score-value">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">High Score:</span>
                            <span class="high-score-value">${this.highScore}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Speed:</span>
                            <span class="speed-value">1</span>
                        </div>
                    </div>
                </div>
                
                <div class="snake-game-area">
                    <div class="game-start-screen">
                        <div class="start-content">
                            <h3>🐍 Welcome to Snake!</h3>
                            <div class="instructions">
                                <p><strong>How to Play:</strong></p>
                                <p>• Use arrow keys to control the snake</p>
                                <p>• Eat the red food to grow and score points</p>
                                <p>• Don't hit the walls or yourself!</p>
                                <p>• Snake gets faster as you score more</p>
                            </div>
                            <button class="start-snake-btn">🚀 Start Game</button>
                        </div>
                    </div>
                    
                    <div class="snake-canvas-container" style="display: none;">
                        <canvas 
                            class="snake-canvas" 
                            width="${boardPixelSize}" 
                            height="${boardPixelSize}">
                        </canvas>
                        <div class="game-overlay" style="display: none;">
                            <div class="overlay-content">
                                <div class="pause-message">⏸️ PAUSED</div>
                                <div class="resume-hint">Press SPACE to resume</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="game-over-screen" style="display: none;">
                        <div class="game-over-content">
                            <div class="game-over-icon">💀</div>
                            <h3>Game Over!</h3>
                            <div class="final-stats">
                                <p>Final Score: <span class="final-score">0</span></p>
                                <p class="score-message"></p>
                                <div class="high-score-notice" style="display: none;">
                                    🏆 New High Score! 🏆
                                </div>
                            </div>
                            <div class="game-over-actions">
                                <button class="play-again-btn">🔄 Play Again</button>
                                <button class="back-to-menu-btn">📋 Back to Menu</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="snake-controls">
                    <div class="control-section">
                        <button class="game-btn pause-btn" style="display: none;">⏸️ Pause</button>
                        <button class="game-btn resume-btn" style="display: none;">▶️ Resume</button>
                        <button class="game-btn restart-btn" style="display: none;">🔄 Restart</button>
                    </div>
                    <div class="control-hints">
                        <span class="control-hint">Arrow Keys: Move</span>
                        <span class="control-hint">Space: Pause/Resume</span>
                        <span class="control-hint">R: Restart</span>
                    </div>
                </div>
            </div>
        `;
    }

    setupGameEvents(windowId) {
        const window = document.getElementById(`window-${windowId}`);
        const container = window.querySelector('.snake-game-container');
        
        // Get game elements
        this.canvas = container.querySelector('.snake-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Button event listeners
        const startBtn = container.querySelector('.start-snake-btn');
        const playAgainBtn = container.querySelector('.play-again-btn');
        const backToMenuBtn = container.querySelector('.back-to-menu-btn');
        const pauseBtn = container.querySelector('.pause-btn');
        const resumeBtn = container.querySelector('.resume-btn');
        const restartBtn = container.querySelector('.restart-btn');

        startBtn.addEventListener('click', () => this.startGame(container));
        playAgainBtn.addEventListener('click', () => this.startGame(container));
        backToMenuBtn.addEventListener('click', () => this.backToMenu(container));
        pauseBtn.addEventListener('click', () => this.pauseGame(container));
        resumeBtn.addEventListener('click', () => this.resumeGame(container));
        restartBtn.addEventListener('click', () => this.restartGame(container));

        // Keyboard controls
        document.addEventListener('keydown', this.keyHandler);
        
        // Clean up when window is closed
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        // Focus the window to ensure keyboard events work
        window.focus();
    }

    startGame(container) {
        // Reset game state
        this.snake = [{ x: 10, y: 10 }];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.currentSpeed = this.speed;
        this.gameActive = true;
        this.gameStarted = true;
        
        this.generateFood();
        this.updateUI(container);
        
        // Show game screen
        container.querySelector('.game-start-screen').style.display = 'none';
        container.querySelector('.game-over-screen').style.display = 'none';
        container.querySelector('.snake-canvas-container').style.display = 'block';
        container.querySelector('.pause-btn').style.display = 'inline-block';
        container.querySelector('.restart-btn').style.display = 'inline-block';
        
        // Start game loop
        this.startGameLoop();
        
        // Initial render
        this.render();
    }

    startGameLoop() {
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
        }
        
        this.gameLoopInterval = setInterval(() => {
            if (this.gameActive) {
                this.update();
                this.render();
            }
        }, this.currentSpeed);
    }

    update() {
        // Update direction
        this.direction = { ...this.nextDirection };
        
        // Calculate new head position
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;
        
        // Check wall collisions
        if (head.x < 0 || head.x >= this.boardSize || head.y < 0 || head.y >= this.boardSize) {
            this.gameOver();
            return;
        }
        
        // Check self collision
        for (const segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.gameOver();
                return;
            }
        }
        
        // Add new head
        this.snake.unshift(head);
        
        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.generateFood();
            this.increaseSpeed();
            this.updateUI();
        } else {
            // Remove tail if no food eaten
            this.snake.pop();
        }
    }

    render() {
        if (!this.ctx) return;
        
        // Clear canvas
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid lines (subtle)
        this.ctx.strokeStyle = '#3a3a3a';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.boardSize; i++) {
            const pos = i * this.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(pos, 0);
            this.ctx.lineTo(pos, this.canvas.height);
            this.ctx.moveTo(0, pos);
            this.ctx.lineTo(this.canvas.width, pos);
            this.ctx.stroke();
        }
        
        // Draw snake
        this.snake.forEach((segment, index) => {
            const x = segment.x * this.cellSize;
            const y = segment.y * this.cellSize;
            
            if (index === 0) {
                // Snake head
                this.ctx.fillStyle = '#00ff00';
                this.ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
                
                // Eyes
                this.ctx.fillStyle = '#000000';
                const eyeSize = 3;
                const eyeOffset = 5;
                
                if (this.direction.x === 1) { // Moving right
                    this.ctx.fillRect(x + this.cellSize - eyeOffset, y + 4, eyeSize, eyeSize);
                    this.ctx.fillRect(x + this.cellSize - eyeOffset, y + this.cellSize - 7, eyeSize, eyeSize);
                } else if (this.direction.x === -1) { // Moving left
                    this.ctx.fillRect(x + 2, y + 4, eyeSize, eyeSize);
                    this.ctx.fillRect(x + 2, y + this.cellSize - 7, eyeSize, eyeSize);
                } else if (this.direction.y === -1) { // Moving up
                    this.ctx.fillRect(x + 4, y + 2, eyeSize, eyeSize);
                    this.ctx.fillRect(x + this.cellSize - 7, y + 2, eyeSize, eyeSize);
                } else if (this.direction.y === 1) { // Moving down
                    this.ctx.fillRect(x + 4, y + this.cellSize - eyeOffset, eyeSize, eyeSize);
                    this.ctx.fillRect(x + this.cellSize - 7, y + this.cellSize - eyeOffset, eyeSize, eyeSize);
                }
            } else {
                // Snake body
                const alpha = 1 - (index * 0.05); // Fade towards tail
                this.ctx.fillStyle = `rgba(0, 255, 0, ${Math.max(alpha, 0.3)})`;
                this.ctx.fillRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
            }
        });
        
        // Draw food
        const foodX = this.food.x * this.cellSize;
        const foodY = this.food.y * this.cellSize;
        
        // Animate food with a pulsing effect
        const pulsePhase = (Date.now() % 1000) / 1000;
        const pulseSize = 2 + Math.sin(pulsePhase * Math.PI * 2) * 1;
        
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(
            foodX + pulseSize, 
            foodY + pulseSize, 
            this.cellSize - (pulseSize * 2), 
            this.cellSize - (pulseSize * 2)
        );
        
        // Food highlight
        this.ctx.fillStyle = '#ff6666';
        this.ctx.fillRect(
            foodX + pulseSize + 2, 
            foodY + pulseSize + 2, 
            this.cellSize - (pulseSize * 2) - 6, 
            this.cellSize - (pulseSize * 2) - 6
        );
    }

    generateFood() {
        do {
            this.food.x = Math.floor(Math.random() * this.boardSize);
            this.food.y = Math.floor(Math.random() * this.boardSize);
        } while (this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y));
    }

    increaseSpeed() {
        // Increase speed every 50 points
        if (this.score % 50 === 0 && this.currentSpeed > 80) {
            this.currentSpeed = Math.max(80, this.currentSpeed - 10);
            this.startGameLoop(); // Restart with new speed
        }
    }

    handleKeyPress(event) {
        if (!this.gameStarted) return;
        
        event.preventDefault();
        
        const key = event.key;
        
        // Movement controls (only if game is active)
        if (this.gameActive) {
            switch (key) {
                case 'ArrowUp':
                    if (this.direction.y !== 1) this.nextDirection = { x: 0, y: -1 };
                    break;
                case 'ArrowDown':
                    if (this.direction.y !== -1) this.nextDirection = { x: 0, y: 1 };
                    break;
                case 'ArrowLeft':
                    if (this.direction.x !== 1) this.nextDirection = { x: -1, y: 0 };
                    break;
                case 'ArrowRight':
                    if (this.direction.x !== -1) this.nextDirection = { x: 1, y: 0 };
                    break;
            }
        }
        
        // Game controls
        switch (key) {
            case ' ': // Space for pause/resume
                if (this.gameActive) {
                    this.pauseGame();
                } else {
                    this.resumeGame();
                }
                break;
            case 'r':
            case 'R':
                this.restartGame();
                break;
        }
    }

    pauseGame(container) {
        if (!container) {
            const windows = document.querySelectorAll('[id^="window-snake-"]');
            container = windows[windows.length - 1]?.querySelector('.snake-game-container');
        }
        
        this.gameActive = false;
        if (container) {
            container.querySelector('.game-overlay').style.display = 'flex';
            container.querySelector('.pause-btn').style.display = 'none';
            container.querySelector('.resume-btn').style.display = 'inline-block';
        }
    }

    resumeGame(container) {
        if (!container) {
            const windows = document.querySelectorAll('[id^="window-snake-"]');
            container = windows[windows.length - 1]?.querySelector('.snake-game-container');
        }
        
        this.gameActive = true;
        if (container) {
            container.querySelector('.game-overlay').style.display = 'none';
            container.querySelector('.pause-btn').style.display = 'inline-block';
            container.querySelector('.resume-btn').style.display = 'none';
        }
    }

    restartGame(container) {
        if (!container) {
            const windows = document.querySelectorAll('[id^="window-snake-"]');
            container = windows[windows.length - 1]?.querySelector('.snake-game-container');
        }
        
        this.cleanup();
        this.startGame(container);
    }

    backToMenu(container) {
        this.cleanup();
        this.gameStarted = false;
        
        // Show start screen
        container.querySelector('.game-start-screen').style.display = 'flex';
        container.querySelector('.game-over-screen').style.display = 'none';
        container.querySelector('.snake-canvas-container').style.display = 'none';
        container.querySelector('.pause-btn').style.display = 'none';
        container.querySelector('.resume-btn').style.display = 'none';
        container.querySelector('.restart-btn').style.display = 'none';
    }

    gameOver() {
        this.gameActive = false;
        this.gameStarted = false;
        
        // Check for high score
        const isNewHighScore = this.score > this.highScore;
        if (isNewHighScore) {
            this.highScore = this.score;
            localStorage.setItem('elxaOS-snake-highscore', this.highScore.toString());
        }
        
        // Show game over screen
        const container = document.querySelector('.snake-game-container');
        if (container) {
            const gameOverScreen = container.querySelector('.game-over-screen');
            const finalScoreElement = container.querySelector('.final-score');
            const scoreMessageElement = container.querySelector('.score-message');
            const highScoreNotice = container.querySelector('.high-score-notice');
            
            finalScoreElement.textContent = this.score;
            
            // Score message
            let message = '';
            if (this.score >= 200) {
                message = "🏆 Snake Master! Incredible!";
            } else if (this.score >= 150) {
                message = "🎯 Expert Level! Amazing!";
            } else if (this.score >= 100) {
                message = "🌟 Great Job! Well played!";
            } else if (this.score >= 50) {
                message = "👍 Good effort! Keep practicing!";
            } else {
                message = "🙂 Nice try! Play again to improve!";
            }
            
            scoreMessageElement.textContent = message;
            
            if (isNewHighScore) {
                highScoreNotice.style.display = 'block';
            } else {
                highScoreNotice.style.display = 'none';
            }
            
            container.querySelector('.snake-canvas-container').style.display = 'none';
            gameOverScreen.style.display = 'flex';
            container.querySelector('.pause-btn').style.display = 'none';
            container.querySelector('.resume-btn').style.display = 'none';
            container.querySelector('.restart-btn').style.display = 'none';
        }
        
        this.cleanup();
    }

    updateUI(container) {
        if (!container) {
            const windows = document.querySelectorAll('[id^="window-snake-"]');
            container = windows[windows.length - 1]?.querySelector('.snake-game-container');
        }
        
        if (container) {
            container.querySelector('.score-value').textContent = this.score;
            container.querySelector('.high-score-value').textContent = this.highScore;
            
            // Calculate speed level (1-10)
            const speedLevel = Math.min(10, Math.floor((this.speed - this.currentSpeed) / 10) + 1);
            container.querySelector('.speed-value').textContent = speedLevel;
        }
    }

    cleanup() {
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
        }
        
        // Note: Don't remove the keydown listener here since it might be shared
        // The window cleanup will handle it when the window is actually closed
    }

    destroy() {
        this.cleanup();
        document.removeEventListener('keydown', this.keyHandler);
    }
}