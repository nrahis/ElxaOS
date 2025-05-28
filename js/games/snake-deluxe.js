// =================================
// SNAKE DELUXE - Mr. Snake-e's Epic Corporate Adventure! (IMPROVED MECHANICS)
// A professional journey through ElxaCorp's headquarters and beyond!
// NOW WITH CORPORATE SPLASH SCREEN!
// =================================

class SnakeDeluxe {
    constructor(windowManager, gameData = {}) {
        this.windowManager = windowManager;
        this.gameData = gameData;
        
        // Game state
        this.gameActive = false;
        this.gameStarted = false;
        this.currentLevel = 1;
        this.score = 0;
        this.coins = parseInt(localStorage.getItem('elxaOS-snake-deluxe-coins') || '0');
        this.highScore = parseInt(localStorage.getItem('elxaOS-snake-deluxe-highscore') || '0');
        this.achievements = JSON.parse(localStorage.getItem('elxaOS-snake-deluxe-achievements') || '[]');
        this.unlockedLevels = JSON.parse(localStorage.getItem('elxaOS-snake-deluxe-levels') || '[1]');
        
        // Splash screen state
        this.showingSplash = true;
        this.splashTimer = null;
        
        // Difficulty settings
        this.difficulty = gameData.difficulty || 'employee';
        this.baseSpeed = this.getDifficultySpeed();
        this.currentSpeed = this.baseSpeed;
        
        // Game board - progressive sizing based on level
        this.baseBoardSize = 15; // Start smaller for easier gameplay
        this.boardSize = this.getBoardSizeForLevel(this.currentLevel); 
        this.cellSize = 16; // Base cell size
        this.actualCellSize = this.cellSize; // Will be updated based on responsive sizing
        
        // Snake state
        this.snake = [{ x: Math.floor(this.boardSize/2), y: Math.floor(this.boardSize/2) }];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        
        // Level elements
        this.foods = [];
        this.obstacles = [];
        this.powerUps = [];
        this.cats = []; // Mr. Snake-e loves cats!
        this.coins_on_board = [];
        
        // Special effects
        this.particles = [];
        this.animations = [];
        
        // Game elements
        this.canvas = null;
        this.ctx = null;
        this.gameLoopInterval = null;
        this.particleLoopInterval = null;
        
        // Input handling
        this.keyHandler = this.handleKeyPress.bind(this);
        this.splashKeyHandler = this.handleSplashKeyPress.bind(this);
        
        // Level system
        this.levels = this.createLevelData();
        this.currentLevelData = this.levels[this.currentLevel - 1];
        
        // Power-up effects
        this.powerUpEffects = {
            speed: 0,
            invincible: 0,
            magnetism: 0,
            double_score: 0
        };
        
        this.initializeLevel();
    }

    getDifficultySpeed() {
        switch (this.difficulty) {
            case 'intern': return 350;     // Much slower for beginners
            case 'employee': return 220;   // Reasonable pace
            case 'manager': return 140;    // Getting challenging
            case 'executive': return 90;   // Expert level
            default: return 220;
        }
    }

    getBoardSizeForLevel(level) {
        // Progressive board size: starts at 15x15, grows to 25x25
        return Math.min(25, this.baseBoardSize + Math.floor((level - 1) / 2));
    }

    createLevelData() {
        return [
            {
                id: 1,
                name: "ElxaCorp Lobby",
                description: "Welcome to ElxaCorp HQ! Mr. Snake-e needs coffee to start his day.",
                theme: "office",
                bgColor: "#1a1a2e",
                accentColor: "#ff69b4",
                foods: [{ type: "coffee", count: 3, points: 10 }],
                obstacles: [], // No obstacles in tutorial level
                powerUps: ["speed"],
                targetScore: 30,
                cats: 1
            },
            {
                id: 2,
                name: "The Server Room",
                description: "Time to check the ElxaOS servers! Watch out for the server racks.",
                theme: "tech",
                bgColor: "#0f1419",
                accentColor: "#ff69b4",
                foods: [
                    { type: "data", count: 3, points: 15 },
                    { type: "coffee", count: 2, points: 10 }
                ],
                obstacles: ["server_rack", "cable"],
                powerUps: ["speed", "invincible"],
                targetScore: 80,
                cats: 2
            },
            {
                id: 3,
                name: "Mrs. Snake-e's Garden",
                description: "Visit Mrs. Snake-e in her beautiful garden! She's 82 and still growing the best vegetables.",
                theme: "garden",
                bgColor: "#0f2027",
                accentColor: "#ff69b4",
                foods: [
                    { type: "apple", count: 4, points: 20 },
                    { type: "flower", count: 3, points: 25 }
                ],
                obstacles: ["flower_bed", "garden_tool"],
                powerUps: ["magnetism", "double_score"],
                targetScore: 140,
                cats: 3
            },
            {
                id: 4,
                name: "The Denali Garage",
                description: "Mr. Snake-e's beloved Denali needs some maintenance. Navigate around the tools!",
                theme: "garage",
                bgColor: "#1a1a1a",
                accentColor: "#ff69b4",
                foods: [
                    { type: "oil", count: 2, points: 30 },
                    { type: "wrench", count: 4, points: 15 }
                ],
                obstacles: ["car_part", "tool_box", "oil_spill"],
                powerUps: ["speed", "invincible", "double_score"],
                targetScore: 200,
                cats: 2
            },
            {
                id: 5,
                name: "Snakesia Capital City",
                description: "Explore the bustling capital of Snakesia! Mr. Snake-e's kingdom awaits.",
                theme: "city",
                bgColor: "#2d1b69",
                accentColor: "#ff69b4",
                foods: [
                    { type: "coin", count: 6, points: 25 },
                    { type: "gem", count: 2, points: 50 }
                ],
                obstacles: ["building", "traffic_cone", "street_lamp"],
                powerUps: ["speed", "magnetism", "double_score", "invincible"],
                targetScore: 300,
                cats: 4
            },
            {
                id: 6,
                name: "The Math Laboratory",
                description: "Mr. Snake-e's favorite place! Solve equations and collect numbers.",
                theme: "math",
                bgColor: "#1e3a8a",
                accentColor: "#ff69b4",
                foods: [
                    { type: "equation", count: 5, points: 40 },
                    { type: "calculator", count: 3, points: 35 }
                ],
                obstacles: ["blackboard", "desk", "computer"],
                powerUps: ["speed", "double_score", "invincible"],
                targetScore: 400,
                cats: 3
            },
            {
                id: 7,
                name: "Hacker's Paradise",
                description: "The secret underground hacking lab! Navigate through the maze of screens.",
                theme: "hacker",
                bgColor: "#0a0a0a",
                accentColor: "#ff69b4",
                foods: [
                    { type: "code", count: 4, points: 45 },
                    { type: "usb", count: 3, points: 40 }
                ],
                obstacles: ["monitor", "keyboard", "server", "cable_mess"],
                powerUps: ["magnetism", "invincible", "double_score"],
                targetScore: 500,
                cats: 5
            },
            {
                id: 8,
                name: "Cat Sanctuary",
                description: "Mr. Snake-e's ultimate happy place! A sanctuary full of his favorite friends.",
                theme: "cats",
                bgColor: "#4a5568",
                accentColor: "#ff69b4",
                foods: [
                    { type: "fish", count: 6, points: 30 },
                    { type: "yarn", count: 4, points: 35 }
                ],
                obstacles: ["cat_tree", "litter_box", "scratching_post"],
                powerUps: ["speed", "magnetism", "double_score", "invincible"],
                targetScore: 650,
                cats: 8
            },
            {
                id: 9,
                name: "ElxaCorp Boardroom",
                description: "The final challenge! Navigate the boardroom where Mr. Snake-e makes billion-dollar decisions.",
                theme: "boardroom",
                bgColor: "#1a202c",
                accentColor: "#ff69b4",
                foods: [
                    { type: "contract", count: 3, points: 60 },
                    { type: "money", count: 5, points: 50 }
                ],
                obstacles: ["conference_table", "chair", "projector", "whiteboard"],
                powerUps: ["speed", "magnetism", "double_score", "invincible"],
                targetScore: 800,
                cats: 6
            },
            {
                id: 10,
                name: "Snakesia Throne Room",
                description: "The ultimate level! Help Mr. Snake-e rule Snakesia from his golden throne!",
                theme: "throne",
                bgColor: "#2d1b69",
                accentColor: "#ff69b4",
                foods: [
                    { type: "crown", count: 2, points: 100 },
                    { type: "scepter", count: 3, points: 80 },
                    { type: "gem", count: 4, points: 60 }
                ],
                obstacles: ["throne", "pillar", "statue", "treasure_chest"],
                powerUps: ["speed", "magnetism", "double_score", "invincible"],
                targetScore: 1000,
                cats: 10
            }
        ];
    }

    initializeLevel() {
        this.currentLevelData = this.levels[this.currentLevel - 1];
        this.boardSize = this.getBoardSizeForLevel(this.currentLevel);
        this.generateLevelElements();
    }

    generateLevelElements() {
        this.foods = [];
        this.obstacles = [];
        this.powerUps = [];
        this.cats = [];
        this.coins_on_board = [];
        
        const levelData = this.currentLevelData;
        
        // Generate foods
        levelData.foods.forEach(foodType => {
            for (let i = 0; i < foodType.count; i++) {
                this.generateFood(foodType.type, foodType.points);
            }
        });
        
        // Generate obstacles - scaled with board size and level
        const baseObstacles = Math.min(levelData.obstacles.length * 2, 6);
        const levelMultiplier = Math.floor((this.currentLevel - 1) / 3) + 1;
        const numObstacles = Math.min(baseObstacles + levelMultiplier, 12);
        
        for (let i = 0; i < numObstacles; i++) {
            const obstacleType = levelData.obstacles[Math.floor(Math.random() * levelData.obstacles.length)];
            if (obstacleType) {
                this.generateObstacle(obstacleType);
            }
        }
        
        // Generate power-ups
        const numPowerUps = Math.min(levelData.powerUps.length, 3);
        for (let i = 0; i < numPowerUps; i++) {
            const powerUpType = levelData.powerUps[Math.floor(Math.random() * levelData.powerUps.length)];
            this.generatePowerUp(powerUpType);
        }
        
        // Generate cats (Mr. Snake-e's friends!)
        for (let i = 0; i < levelData.cats; i++) {
            this.generateCat();
        }
        
        // Generate coins
        for (let i = 0; i < 3; i++) {
            this.generateCoin();
        }
    }

    launch(programInfo) {
        const windowId = `snake-deluxe-${programInfo.id}-${Date.now()}`;
        const windowContent = this.createSplashScreen();
        
        const window = this.windowManager.createWindow(
            windowId,
            `🐍💼 ${programInfo.name}`,
            windowContent,
            { width: '700px', height: '600px', x: '100px', y: '30px' }
        );
        
        this.setupSplashEvents(windowId);
        return windowId;
    }

    createSplashScreen() {
        return `
            <div class="sd-splash-container">
                <div class="sd-splash-content">
                    <div class="sd-splash-image-container">
                        <img src="assets/games/snake-deluxe/splash.png" 
                             alt="Snake Deluxe Splash" 
                             class="sd-splash-image"
                             width="400" 
                             height="300">
                        <div class="sd-splash-loading">
                            <div class="sd-loading-bar">
                                <div class="sd-loading-fill"></div>
                            </div>
                            <div class="sd-loading-text">Loading ElxaCorp Systems...</div>
                        </div>
                    </div>
                    <div class="sd-splash-footer">
                        <div class="sd-splash-copyright">© 2024 ElxaCorp Industries • Snake Deluxe v2.0</div>
                        <div class="sd-splash-hint">Press SPACE or click to continue...</div>
                    </div>
                </div>
            </div>
        `;
    }

    createGameInterface() {
        // Calculate responsive canvas size based on window size
        const maxCanvasSize = Math.min(380, window.innerWidth - 100);
        const actualCellSize = Math.floor(maxCanvasSize / this.boardSize);
        const boardPixelSize = this.boardSize * actualCellSize;
        
        return `
            <div class="sd-game-container">
                <div class="sd-game-header">
                    <div class="sd-game-logo">
                        <img src="assets/games/snake-deluxe/logo.png" 
                             alt="ElxaCorp Logo" 
                             class="sd-logo-image"
                             width="50" 
                             height="50">
                        <span class="sd-logo-text">Snake Deluxe</span>
                    </div>
                    <div class="sd-game-stats">
                        <div class="sd-stat-group">
                            <div class="sd-stat-bubble sd-primary">
                                <span class="sd-stat-icon">🏆</span>
                                <span class="sd-stat-value sd-score-value">0</span>
                            </div>
                            <div class="sd-stat-bubble">
                                <span class="sd-stat-icon">💰</span>
                                <span class="sd-stat-value sd-coins-value">${this.coins}</span>
                            </div>
                            <div class="sd-stat-bubble">
                                <span class="sd-stat-icon">📊</span>
                                <span class="sd-stat-value sd-level-value">1</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="sd-story-banner">
                    <div class="sd-story-content">
                        <div class="sd-story-character"></div>
                        <div class="sd-story-text">
                            <div class="sd-story-description">Help the CEO of ElxaCorp navigate the corporate world of Snakesia!</div>
                        </div>
                    </div>
                </div>
                
                <div class="sd-game-area">
                    <div class="sd-level-selector">
                        <div class="sd-level-content">
                            <h2>Choose Your Corporate Adventure!</h2>
                            <div class="sd-character-intro">
                                <div class="sd-character-avatar">
                                    <img src="assets/games/snake-deluxe/snake_avatar.png" 
                                         alt="CEO Avatar" 
                                         class="sd-avatar-image"
                                         width="50" 
                                         height="50">
                                </div>
                                <div class="sd-character-speech">
                                    <p>Greetings, esteemed colleague! I'm Mr. Snake-e, CEO of ElxaCorp!</p>
                                    <p>My lovely wife Mrs. Snake-e and I need your professional assistance!</p>
                                    <p>Come help us navigate the corporate empire of Snakesia!</p>
                                </div>
                            </div>
                            <div class="sd-difficulty-selector">
                                <h3>Choose Your Corporate Level:</h3>
                                <div class="sd-difficulty-buttons">
                                    <button class="sd-difficulty-btn ${this.difficulty === 'intern' ? 'sd-selected' : ''}" data-difficulty="intern">
                                        📋 Intern<br><small>Learning the ropes!</small>
                                    </button>
                                    <button class="sd-difficulty-btn ${this.difficulty === 'employee' ? 'sd-selected' : ''}" data-difficulty="employee">
                                        💻 Employee<br><small>Standard pace!</small>
                                    </button>
                                    <button class="sd-difficulty-btn ${this.difficulty === 'manager' ? 'sd-selected' : ''}" data-difficulty="manager">
                                        📊 Manager<br><small>Fast-paced!</small>
                                    </button>
                                    <button class="sd-difficulty-btn ${this.difficulty === 'executive' ? 'sd-selected' : ''}" data-difficulty="executive">
                                        👔 Executive<br><small>CEO speed!</small>
                                    </button>
                                </div>
                            </div>
                            <div class="sd-level-grid">
                                ${this.createLevelButtons()}
                            </div>
                            <div class="sd-achievements-preview">
                                <h3>🏅 Your Corporate Achievements: ${this.achievements.length}/20</h3>
                                <div class="sd-achievement-icons">
                                    ${this.achievements.slice(0, 5).map(achievement => `<span class="sd-achievement-icon" title="${achievement.name}">${achievement.icon}</span>`).join('')}
                                    ${this.achievements.length > 5 ? '<span class="sd-more-achievements">+' + (this.achievements.length - 5) + '</span>' : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="sd-game-play" style="display: none;">
                        <div class="sd-level-info">
                            <div class="sd-level-details">
                                <span class="sd-level-name"></span>
                                <span class="sd-level-description"></span>
                            </div>
                            <div class="sd-level-progress">
                                <div class="sd-progress-bar">
                                    <div class="sd-progress-fill"></div>
                                </div>
                                <span class="sd-progress-text">0 / 0</span>
                            </div>
                        </div>
                        
                        <div class="sd-canvas-container">
                            <canvas class="sd-game-canvas" width="${boardPixelSize}" height="${boardPixelSize}"></canvas>
                            <div class="sd-power-effects">
                                <div class="sd-effect-bubble sd-speed-effect" style="display: none;">
                                    <span class="sd-effect-icon">⚡</span>
                                    <span class="sd-effect-text">EFFICIENCY BOOST!</span>
                                </div>
                                <div class="sd-effect-bubble sd-invincible-effect" style="display: none;">
                                    <span class="sd-effect-icon">🛡️</span>
                                    <span class="sd-effect-text">EXECUTIVE IMMUNITY!</span>
                                </div>
                                <div class="sd-effect-bubble sd-magnetism-effect" style="display: none;">
                                    <span class="sd-effect-icon">🧲</span>
                                    <span class="sd-effect-text">CORPORATE MAGNETISM!</span>
                                </div>
                                <div class="sd-effect-bubble sd-double-score-effect" style="display: none;">
                                    <span class="sd-effect-icon">💰</span>
                                    <span class="sd-effect-text">PROFIT MULTIPLIER!</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="sd-game-controls">
                            <button class="sd-control-btn sd-pause-btn">⏸️ Pause</button>
                            <button class="sd-control-btn sd-resume-btn" style="display: none;">▶️ Resume</button>
                            <button class="sd-control-btn sd-back-to-levels-btn">💼 Levels</button>
                            <div class="sd-controls-hint">
                                <span>Arrow Keys: Move</span>
                                <span>Space: Pause</span>
                                <span>R: Restart</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="sd-level-complete" style="display: none;">
                        <div class="sd-modal-content">
                            <div class="sd-modal-icon">🎉</div>
                            <h2>Objective Complete! 📊</h2>
                            <div class="sd-character-message">
                                <div class="sd-character-avatar">🐍</div>
                                <div class="sd-message-speech">Excellent work, valued employee! That's the ElxaCorp way! 💼</div>
                            </div>
                            <div class="sd-results-grid">
                                <div class="sd-result-item">
                                    <span class="sd-result-icon">🏆</span>
                                    <span class="sd-result-label">Score:</span>
                                    <span class="sd-result-value sd-level-score">0</span>
                                </div>
                                <div class="sd-result-item">
                                    <span class="sd-result-icon">🪙</span>
                                    <span class="sd-result-label">Profits Earned:</span>
                                    <span class="sd-result-value sd-coins-earned">0</span>
                                </div>
                                <div class="sd-result-item">
                                    <span class="sd-result-icon">🐱</span>
                                    <span class="sd-result-label">Cats Petted:</span>
                                    <span class="sd-result-value sd-cats-petted">0</span>
                                </div>
                            </div>
                            <div class="sd-new-achievements" style="display: none;">
                                <h3>🏅 New Corporate Achievements!</h3>
                                <div class="sd-new-achievement-list"></div>
                            </div>
                            <div class="sd-modal-actions">
                                <button class="sd-action-btn sd-next-level-btn">➡️ Next Department</button>
                                <button class="sd-action-btn sd-replay-level-btn">🔄 Retry</button>
                                <button class="sd-action-btn sd-back-to-levels-btn">💼 Level Select</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="sd-game-over" style="display: none;">
                        <div class="sd-modal-content">
                            <div class="sd-modal-icon">🐍</div>
                            <h2>Mission Failed! Let's regroup! 💼</h2>
                            <div class="sd-character-message">
                                <div class="sd-character-avatar">🐍</div>
                                <div class="sd-message-speech">No worries! Mrs. Snake-e and I believe every failure is a learning opportunity! 📊</div>
                            </div>
                            <div class="sd-results-grid">
                                <div class="sd-result-item">
                                    <span class="sd-result-icon">🏆</span>
                                    <span class="sd-result-value sd-final-score">0</span>
                                </div>
                                <div class="sd-result-item">
                                    <span class="sd-result-icon">🪙</span>
                                    <span class="sd-result-value sd-coins-collected">0</span>
                                </div>
                            </div>
                            <div class="sd-modal-actions">
                                <button class="sd-action-btn sd-try-again-btn">🔄 Try Again</button>
                                <button class="sd-action-btn sd-back-to-levels-btn">💼 Level Select</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createLevelButtons() {
        return this.levels.map((level, index) => {
            const isUnlocked = this.unlockedLevels.includes(level.id);
            const isCompleted = this.unlockedLevels.includes(level.id + 1) || level.id === this.levels.length;
            
            return `
                <div class="sd-level-bubble ${isUnlocked ? 'sd-unlocked' : 'sd-locked'} ${isCompleted ? 'sd-completed' : ''}" 
                     data-level="${level.id}" 
                     ${isUnlocked ? '' : 'disabled'}>
                    <div class="sd-level-number">${level.id}</div>
                    <div class="sd-level-name">${level.name}</div>
                    <div class="sd-level-theme-icon">${this.getLevelThemeIcon(level.theme)}</div>
                    <div class="sd-board-size">Board: ${this.getBoardSizeForLevel(level.id)}x${this.getBoardSizeForLevel(level.id)}</div>
                    ${isCompleted ? '<div class="sd-completion-star">⭐</div>' : ''}
                    ${!isUnlocked ? '<div class="sd-lock-icon">🔒</div>' : ''}
                </div>
            `;
        }).join('');
    }

    getLevelThemeIcon(theme) {
        const icons = {
            office: '🏢',
            tech: '💻',
            garden: '🌸',
            garage: '🚗',
            city: '🏙️',
            math: '📐',
            hacker: '💻',
            cats: '🐱',
            boardroom: '💼',
            throne: '👑'
        };
        return icons[theme] || '🎮';
    }

    setupSplashEvents(windowId) {
        const window = document.getElementById(`window-${windowId}`);
        const container = window.querySelector('.sd-splash-container');
        
        console.log('Setting up splash events for window:', windowId);
        console.log('Found container:', container);
        
        // Store windowId for later use
        this.windowId = windowId;
        
        // Add splash screen event listeners
        document.addEventListener('keydown', this.splashKeyHandler);
        
        // Make entire splash clickable
        container.addEventListener('click', (e) => {
            console.log('Splash clicked');
            e.preventDefault();
            e.stopPropagation();
            this.hideSplash();
        });
        
        // Also add mousedown for better responsiveness
        container.addEventListener('mousedown', (e) => {
            console.log('Splash mouse down');
            e.preventDefault();
            e.stopPropagation();
            this.hideSplash();
        });
        
        // Start loading animation
        this.startLoadingAnimation(container);
        
        // Auto-proceed after 4 seconds
        this.splashTimer = setTimeout(() => {
            console.log('Auto-proceeding from splash after timeout');
            if (this.showingSplash) {
                this.hideSplash();
            }
        }, 4000);
        
        // Focus the container to ensure it can receive events
        container.focus();
        container.setAttribute('tabindex', '0');
        console.log('Splash setup complete');
    }

    startLoadingAnimation(container) {
        const loadingFill = container.querySelector('.sd-loading-fill');
        const loadingText = container.querySelector('.sd-loading-text');
        
        let progress = 0;
        const loadingMessages = [
            'Initializing ElxaCorp Systems...',
            'Loading Corporate Assets...',
            'Connecting to Snakesia Database...',
            'Preparing Executive Dashboard...',
            'Ready for Business!'
        ];
        
        const loadingInterval = setInterval(() => {
            progress += Math.random() * 20 + 5; // Faster progress, less random
            if (progress > 100) progress = 100;
            
            loadingFill.style.width = `${progress}%`;
            
            const messageIndex = Math.floor((progress / 100) * (loadingMessages.length - 1));
            loadingText.textContent = loadingMessages[messageIndex];
            
            if (progress >= 100) {
                clearInterval(loadingInterval);
                loadingText.textContent = 'Ready for Business!';
                
                // Show continue hint
                const hint = container.querySelector('.sd-splash-hint');
                if (hint) {
                    hint.style.animation = 'sd-splash-blink 1s ease-in-out infinite';
                }
                console.log('Loading animation complete');
            }
        }, 80); // Slightly faster interval
    }

    handleSplashKeyPress(event) {
        if (this.showingSplash) {
            console.log('Splash key pressed:', event.key, event.code);
            event.preventDefault();
            event.stopPropagation();
            if (event.code === 'Space' || event.key === 'Enter' || event.key === 'Escape' || event.key === ' ') {
                console.log('Valid key pressed, hiding splash');
                this.hideSplash();
            }
        }
    }

    hideSplash() {
        if (!this.showingSplash) return;
        
        console.log('Hiding splash screen...');
        this.showingSplash = false;
        
        // Clear splash timer
        if (this.splashTimer) {
            clearTimeout(this.splashTimer);
            this.splashTimer = null;
        }
        
        // Remove splash event listeners
        document.removeEventListener('keydown', this.splashKeyHandler);
        
        // Replace splash screen with game interface
        const window = document.getElementById(`window-${this.windowId}`);
        console.log('Found window:', window);
        
        if (window) {
            // Try multiple possible selectors for the window content area
            let windowContent = window.querySelector('.window-body') || 
                               window.querySelector('.window-content') || 
                               window.querySelector('.content') ||
                               window.querySelector('[class*="body"]') ||
                               window.querySelector('[class*="content"]');
                               
            console.log('Found window content:', windowContent);
            
            if (windowContent) {
                windowContent.innerHTML = this.createGameInterface();
                this.setupGameEvents(this.windowId);
                console.log('Successfully replaced splash with game interface');
            } else {
                console.log('Using fallback method - replacing splash container directly');
                // More aggressive fallback: find the splash container and replace it
                const splashContainer = window.querySelector('.sd-splash-container');
                if (splashContainer) {
                    splashContainer.outerHTML = this.createGameInterface();
                    this.setupGameEvents(this.windowId);
                    console.log('Successfully replaced splash container');
                } else {
                    console.error('Could not find splash container or window content');
                    // Last resort: replace entire window inner content
                    const windowInner = window.querySelector('*:not(.window-title):not(.window-controls)') || window.children[window.children.length - 1];
                    if (windowInner) {
                        windowInner.innerHTML = this.createGameInterface();
                        this.setupGameEvents(this.windowId);
                        console.log('Used last resort replacement');
                    }
                }
            }
        } else {
            console.error('Could not find window element with ID:', `window-${this.windowId}`);
        }
    }

    setupGameEvents(windowId) {
        const window = document.getElementById(`window-${windowId}`);
        const container = window.querySelector('.sd-game-container');
        
        this.canvas = container.querySelector('.sd-game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Calculate and store the actual cell size used
        const canvasWidth = this.canvas.width;
        this.actualCellSize = canvasWidth / this.boardSize;
        
        // Difficulty selection
        const difficultyButtons = container.querySelectorAll('.sd-difficulty-btn');
        difficultyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                difficultyButtons.forEach(b => b.classList.remove('sd-selected'));
                btn.classList.add('sd-selected');
                this.difficulty = btn.dataset.difficulty;
                this.baseSpeed = this.getDifficultySpeed();
                this.currentSpeed = this.baseSpeed;
            });
        });
        
        // Level selection
        const levelButtons = container.querySelectorAll('.sd-level-bubble.sd-unlocked');
        levelButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const levelId = parseInt(btn.dataset.level);
                this.startLevel(container, levelId);
            });
        });
        
        // Game controls
        const pauseBtn = container.querySelector('.sd-pause-btn');
        const resumeBtn = container.querySelector('.sd-resume-btn');
        const backToLevelsButtons = container.querySelectorAll('.sd-back-to-levels-btn');
        
        pauseBtn?.addEventListener('click', () => this.pauseGame(container));
        resumeBtn?.addEventListener('click', () => this.resumeGame(container));
        backToLevelsButtons.forEach(btn => {
            btn.addEventListener('click', () => this.showLevelSelector(container));
        });
        
        // Level complete actions
        const nextLevelBtn = container.querySelector('.sd-next-level-btn');
        const replayLevelBtn = container.querySelector('.sd-replay-level-btn');
        const tryAgainBtn = container.querySelector('.sd-try-again-btn');
        
        nextLevelBtn?.addEventListener('click', () => this.nextLevel(container));
        replayLevelBtn?.addEventListener('click', () => this.replayLevel(container));
        tryAgainBtn?.addEventListener('click', () => this.replayLevel(container));
        
        // Keyboard controls
        document.addEventListener('keydown', this.keyHandler);
        
        // Cleanup
        window.addEventListener('beforeunload', () => this.cleanup());
        window.focus();
    }

    startLevel(container, levelId) {
        this.currentLevel = levelId;
        this.initializeLevel();
        
        // Reset game state with properly centered snake
        const centerX = Math.floor(this.boardSize/2);
        const centerY = Math.floor(this.boardSize/2);
        this.snake = [{ x: centerX, y: centerY }];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.currentSpeed = this.baseSpeed;
        this.gameActive = true;
        this.gameStarted = true;
        this.levelScore = 0;
        this.levelCoins = 0;
        this.levelCatsPetted = 0;
        
        // Reset power-up effects
        Object.keys(this.powerUpEffects).forEach(key => {
            this.powerUpEffects[key] = 0;
        });
        
        // Update canvas size for new board size
        const maxCanvasSize = Math.min(380, window.innerWidth - 100);
        const actualCellSize = Math.floor(maxCanvasSize / this.boardSize);
        const boardPixelSize = this.boardSize * actualCellSize;
        
        this.canvas.width = boardPixelSize;
        this.canvas.height = boardPixelSize;
        this.actualCellSize = actualCellSize;
        
        // Update UI
        this.updateLevelInfo(container);
        this.updateStats(container);
        
        // Show game screen
        container.querySelector('.sd-level-selector').style.display = 'none';
        container.querySelector('.sd-level-complete').style.display = 'none';
        container.querySelector('.sd-game-over').style.display = 'none';
        container.querySelector('.sd-game-play').style.display = 'block';
        
        // Start game loop
        this.startGameLoop();
        this.startParticleLoop();
        
        // Initial render
        this.render();
    }

    updateLevelInfo(container) {
        const levelData = this.currentLevelData;
        const levelNameEl = container.querySelector('.sd-level-name');
        const levelDescEl = container.querySelector('.sd-level-description');
        const progressText = container.querySelector('.sd-progress-text');
        
        if (levelNameEl) levelNameEl.textContent = `${levelData.name} (${this.boardSize}x${this.boardSize})`;
        if (levelDescEl) levelDescEl.textContent = levelData.description;
        if (progressText) progressText.textContent = `${this.score} / ${levelData.targetScore}`;
        
        this.updateProgressBar(container);
    }

    updateProgressBar(container) {
        const progressFill = container.querySelector('.sd-progress-fill');
        const progressText = container.querySelector('.sd-progress-text');
        
        if (progressFill && progressText) {
            const progress = Math.min(this.score / this.currentLevelData.targetScore, 1);
            progressFill.style.width = `${progress * 100}%`;
            progressText.textContent = `${this.score} / ${this.currentLevelData.targetScore}`;
        }
    }

    generateFood(type, points) {
        let pos;
        let attempts = 0;
        do {
            pos = {
                x: Math.floor(Math.random() * this.boardSize),
                y: Math.floor(Math.random() * this.boardSize)
            };
            attempts++;
        } while (this.isPositionOccupied(pos) && attempts < 50);
        
        if (attempts < 50) {
            this.foods.push({
                x: pos.x,
                y: pos.y,
                type: type,
                points: points,
                emoji: this.getFoodEmoji(type),
                animation: 0
            });
        }
    }

    getFoodEmoji(type) {
        const emojis = {
            coffee: '☕',
            data: '💾',
            apple: '🍎',
            flower: '🌸',
            oil: '🛢️',
            wrench: '🔧',
            coin: '🪙',
            gem: '💎',
            equation: '📐',
            calculator: '🧮',
            code: '💻',
            usb: '🔌',
            fish: '🐟',
            yarn: '🧶',
            contract: '📄',
            money: '💰',
            crown: '👑',
            scepter: '👑'
        };
        return emojis[type] || '🍎';
    }

    generateObstacle(type) {
        let pos;
        let attempts = 0;
        do {
            pos = {
                x: Math.floor(Math.random() * this.boardSize),
                y: Math.floor(Math.random() * this.boardSize)
            };
            attempts++;
        } while (this.isPositionOccupied(pos) && attempts < 50);
        
        if (attempts < 50) {
            this.obstacles.push({
                x: pos.x,
                y: pos.y,
                type: type,
                emoji: this.getObstacleEmoji(type)
            });
        }
    }

    getObstacleEmoji(type) {
        const emojis = {
            server_rack: '🖥️',
            cable: '🔌',
            flower_bed: '🌺',
            garden_tool: '🪴',
            car_part: '⚙️',
            tool_box: '🧰',
            oil_spill: '🛢️',
            building: '🏢',
            traffic_cone: '🚧',
            street_lamp: '💡',
            blackboard: '📋',
            desk: '🗃️',
            computer: '💻',
            monitor: '🖥️',
            keyboard: '⌨️',
            server: '🖥️',
            cable_mess: '🔌',
            cat_tree: '🌳',
            litter_box: '📦',
            scratching_post: '🪵',
            conference_table: '🗃️',
            chair: '🪑',
            projector: '📽️',
            whiteboard: '📋',
            throne: '👑',
            pillar: '🏛️',
            statue: '🗿',
            treasure_chest: '💰'
        };
        return emojis[type] || '🚧';
    }

    generatePowerUp(type) {
        let pos;
        let attempts = 0;
        do {
            pos = {
                x: Math.floor(Math.random() * this.boardSize),
                y: Math.floor(Math.random() * this.boardSize)
            };
            attempts++;
        } while (this.isPositionOccupied(pos) && attempts < 50);
        
        if (attempts < 50) {
            this.powerUps.push({
                x: pos.x,
                y: pos.y,
                type: type,
                emoji: this.getPowerUpEmoji(type),
                animation: 0
            });
        }
    }

    getPowerUpEmoji(type) {
        const emojis = {
            speed: '⚡',
            invincible: '🛡️',
            magnetism: '🧲',
            double_score: '💰'
        };
        return emojis[type] || '⭐';
    }

    generateCat() {
        let pos;
        let attempts = 0;
        do {
            pos = {
                x: Math.floor(Math.random() * this.boardSize),
                y: Math.floor(Math.random() * this.boardSize)
            };
            attempts++;
        } while (this.isPositionOccupied(pos) && attempts < 50);
        
        if (attempts < 50) {
            this.cats.push({
                x: pos.x,
                y: pos.y,
                emoji: '🐱',
                animation: 0,
                petted: false
            });
        }
    }

    generateCoin() {
        let pos;
        let attempts = 0;
        do {
            pos = {
                x: Math.floor(Math.random() * this.boardSize),
                y: Math.floor(Math.random() * this.boardSize)
            };
            attempts++;
        } while (this.isPositionOccupied(pos) && attempts < 50);
        
        if (attempts < 50) {
            this.coins_on_board.push({
                x: pos.x,
                y: pos.y,
                animation: 0
            });
        }
    }

    isPositionOccupied(pos) {
        // Check snake
        if (this.snake.some(segment => segment.x === pos.x && segment.y === pos.y)) return true;
        
        // Check foods
        if (this.foods.some(food => food.x === pos.x && food.y === pos.y)) return true;
        
        // Check obstacles
        if (this.obstacles.some(obstacle => obstacle.x === pos.x && obstacle.y === pos.y)) return true;
        
        // Check power-ups
        if (this.powerUps.some(powerUp => powerUp.x === pos.x && powerUp.y === pos.y)) return true;
        
        // Check cats
        if (this.cats.some(cat => cat.x === pos.x && cat.y === pos.y)) return true;
        
        // Check coins
        if (this.coins_on_board.some(coin => coin.x === pos.x && coin.y === pos.y)) return true;
        
        return false;
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

    startParticleLoop() {
        if (this.particleLoopInterval) {
            clearInterval(this.particleLoopInterval);
        }
        
        this.particleLoopInterval = setInterval(() => {
            this.updateParticles();
        }, 50);
    }

    update() {
        this.updatePowerUpEffects();
        this.updateDirection();
        this.updateSnake();
        this.checkCollisions();
        this.updateAnimations();
        this.updateProgress();
    }

    updatePowerUpEffects() {
        Object.keys(this.powerUpEffects).forEach(effect => {
            if (this.powerUpEffects[effect] > 0) {
                this.powerUpEffects[effect]--;
                if (this.powerUpEffects[effect] === 0) {
                    this.hideEffectIndicator(effect);
                    if (effect === 'speed') {
                        this.currentSpeed = this.baseSpeed;
                        this.startGameLoop();
                    }
                }
            }
        });
    }

    updateDirection() {
        this.direction = { ...this.nextDirection };
    }

    updateSnake() {
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;
        
        // Check wall collisions
        if (head.x < 0 || head.x >= this.boardSize || head.y < 0 || head.y >= this.boardSize) {
            if (this.powerUpEffects.invincible === 0) {
                this.gameOver();
                return;
            }
        }
        
        // Check self collision
        if (this.powerUpEffects.invincible === 0) {
            for (const segment of this.snake) {
                if (head.x === segment.x && head.y === segment.y) {
                    this.gameOver();
                    return;
                }
            }
        }
        
        // Add new head
        this.snake.unshift(head);
    }

    checkCollisions() {
        const head = this.snake[0];
        let ateFood = false;
        
        // Food collisions
        for (let i = this.foods.length - 1; i >= 0; i--) {
            const food = this.foods[i];
            if (head.x === food.x && head.y === food.y) {
                const points = food.points * (this.powerUpEffects.double_score > 0 ? 2 : 1);
                this.score += points;
                this.levelScore += points;
                this.foods.splice(i, 1);
                this.createParticles(food.x, food.y, food.emoji, 'food');
                ateFood = true;
                
                // Generate new food
                this.generateFood(food.type, food.points);
                break;
            }
        }
        
        // Power-up collisions
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (head.x === powerUp.x && head.y === powerUp.y) {
                this.activatePowerUp(powerUp.type);
                this.powerUps.splice(i, 1);
                this.createParticles(powerUp.x, powerUp.y, powerUp.emoji, 'powerup');
                break;
            }
        }
        
        // Cat collisions (Mr. Snake-e loves petting cats!)
        for (let i = 0; i < this.cats.length; i++) {
            const cat = this.cats[i];
            if (head.x === cat.x && head.y === cat.y && !cat.petted) {
                cat.petted = true;
                this.levelCatsPetted++;
                this.score += 5;
                this.createParticles(cat.x, cat.y, '💖', 'heart');
            }
        }
        
        // Coin collisions
        for (let i = this.coins_on_board.length - 1; i >= 0; i--) {
            const coin = this.coins_on_board[i];
            if (head.x === coin.x && head.y === coin.y) {
                this.coins++;
                this.levelCoins++;
                this.coins_on_board.splice(i, 1);
                this.createParticles(coin.x, coin.y, '🪙', 'coin');
                this.saveCoins();
                
                // Generate new coin
                this.generateCoin();
                break;
            }
        }
        
        // Obstacle collisions
        if (this.powerUpEffects.invincible === 0) {
            for (const obstacle of this.obstacles) {
                if (head.x === obstacle.x && head.y === obstacle.y) {
                    this.gameOver();
                    return;
                }
            }
        }
        
        // Remove tail if no food eaten
        if (!ateFood) {
            this.snake.pop();
        }
        
        // Apply magnetism effect
        if (this.powerUpEffects.magnetism > 0) {
            this.applyMagnetism();
        }
    }

    activatePowerUp(type) {
        switch (type) {
            case 'speed':
                this.powerUpEffects.speed = 300; // 15 seconds at 50ms intervals
                this.currentSpeed = Math.max(50, this.currentSpeed * 0.6);
                this.startGameLoop();
                this.showEffectIndicator('speed');
                break;
            case 'invincible':
                this.powerUpEffects.invincible = 200; // 10 seconds
                this.showEffectIndicator('invincible');
                break;
            case 'magnetism':
                this.powerUpEffects.magnetism = 400; // 20 seconds
                this.showEffectIndicator('magnetism');
                break;
            case 'double_score':
                this.powerUpEffects.double_score = 300; // 15 seconds
                this.showEffectIndicator('double_score');
                break;
        }
    }

    applyMagnetism() {
        const head = this.snake[0];
        const magnetRange = 3;
        
        // Attract nearby foods
        this.foods.forEach(food => {
            const dx = head.x - food.x;
            const dy = head.y - food.y;
            const distance = Math.abs(dx) + Math.abs(dy);
            
            if (distance <= magnetRange && distance > 0) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    food.x += dx > 0 ? 1 : -1;
                } else {
                    food.y += dy > 0 ? 1 : -1;
                }
            }
        });
    }

    showEffectIndicator(effect) {
        const container = document.querySelector('.sd-game-container');
        const indicator = container.querySelector(`.sd-${effect}-effect`);
        if (indicator) {
            indicator.style.display = 'block';
        }
    }

    hideEffectIndicator(effect) {
        const container = document.querySelector('.sd-game-container');
        const indicator = container.querySelector(`.sd-${effect}-effect`);
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    createParticles(x, y, emoji, type) {
        const colors = {
            food: ['#ff69b4', '#ffb3e6', '#ff9ecd'],
            powerup: ['#ff69b4', '#ffb3e6', '#ff9ecd'],
            heart: ['#ff69b4', '#ff1493', '#ff6b9d'],
            coin: ['#ffd700', '#ffed4e', '#ffa500']
        };
        
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x * this.actualCellSize + this.actualCellSize / 2,
                y: y * this.actualCellSize + this.actualCellSize / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 30,
                maxLife: 30,
                emoji: emoji,
                color: colors[type][Math.floor(Math.random() * colors[type].length)]
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    updateAnimations() {
        // Update food animations
        this.foods.forEach(food => {
            food.animation = (food.animation + 0.1) % (Math.PI * 2);
        });
        
        // Update power-up animations
        this.powerUps.forEach(powerUp => {
            powerUp.animation = (powerUp.animation + 0.2) % (Math.PI * 2);
        });
        
        // Update cat animations
        this.cats.forEach(cat => {
            cat.animation = (cat.animation + 0.15) % (Math.PI * 2);
        });
        
        // Update coin animations
        this.coins_on_board.forEach(coin => {
            coin.animation = (coin.animation + 0.25) % (Math.PI * 2);
        });
    }

    updateProgress() {
        const container = document.querySelector('.sd-game-container');
        this.updateProgressBar(container);
        this.updateStats(container);
        
        // Check level completion
        if (this.score >= this.currentLevelData.targetScore) {
            this.levelComplete();
        }
    }

    updateStats(container) {
        if (container) {
            const scoreEl = container.querySelector('.sd-score-value');
            const coinsEl = container.querySelector('.sd-coins-value');
            const levelEl = container.querySelector('.sd-level-value');
            
            if (scoreEl) {
                scoreEl.textContent = this.score;
                scoreEl.classList.add('sd-updated');
                setTimeout(() => scoreEl.classList.remove('sd-updated'), 800);
            }
            if (coinsEl) coinsEl.textContent = this.coins;
            if (levelEl) levelEl.textContent = this.currentLevel;
        }
    }

    render() {
        if (!this.ctx) return;
        
        const levelData = this.currentLevelData;
        
        // Clear canvas with level-specific background
        this.ctx.fillStyle = levelData.bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid (subtle)
        this.drawGrid();
        
        // Draw game elements
        this.drawObstacles();
        this.drawFoods();
        this.drawPowerUps();
        this.drawCats();
        this.drawCoins();
        this.drawSnake();
        this.drawParticles();
        
        // Draw power-up effects overlay
        this.drawPowerUpOverlay();
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.boardSize; i++) {
            const pos = i * this.actualCellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(pos, 0);
            this.ctx.lineTo(pos, this.canvas.height);
            this.ctx.moveTo(0, pos);
            this.ctx.lineTo(this.canvas.width, pos);
            this.ctx.stroke();
        }
    }

    drawSnake() {
        this.snake.forEach((segment, index) => {
            const x = segment.x * this.actualCellSize;
            const y = segment.y * this.actualCellSize;
            
            if (index === 0) {
                // Snake head (Mr. Snake-e!) - prettier colors
                this.ctx.fillStyle = this.powerUpEffects.invincible > 0 ? '#ffd700' : '#ff69b4';
                this.ctx.fillRect(x + 1, y + 1, this.actualCellSize - 2, this.actualCellSize - 2);
                
                // Draw eyes
                this.ctx.fillStyle = '#ffffff';
                const eyeSize = Math.max(2, Math.floor(this.actualCellSize / 6));
                const eyeOffset = Math.floor(this.actualCellSize / 3);
                
                if (this.direction.x === 1) { // Moving right
                    this.ctx.fillRect(x + this.actualCellSize - eyeOffset, y + eyeOffset, eyeSize, eyeSize);
                    this.ctx.fillRect(x + this.actualCellSize - eyeOffset, y + eyeOffset + 4, eyeSize, eyeSize);
                } else if (this.direction.x === -1) { // Moving left
                    this.ctx.fillRect(x + eyeOffset/2, y + eyeOffset, eyeSize, eyeSize);
                    this.ctx.fillRect(x + eyeOffset/2, y + eyeOffset + 4, eyeSize, eyeSize);
                } else if (this.direction.y === -1) { // Moving up
                    this.ctx.fillRect(x + eyeOffset, y + eyeOffset/2, eyeSize, eyeSize);
                    this.ctx.fillRect(x + eyeOffset + 4, y + eyeOffset/2, eyeSize, eyeSize);
                } else if (this.direction.y === 1) { // Moving down
                    this.ctx.fillRect(x + eyeOffset, y + this.actualCellSize - eyeOffset, eyeSize, eyeSize);
                    this.ctx.fillRect(x + eyeOffset + 4, y + this.actualCellSize - eyeOffset, eyeSize, eyeSize);
                }
            } else {
                // Snake body - gradient pink
                const alpha = Math.max(0.3, 1 - (index * 0.03));
                const color = this.powerUpEffects.invincible > 0 ? `rgba(255, 215, 0, ${alpha})` : `rgba(255, 179, 230, ${alpha})`;
                this.ctx.fillStyle = color;
                this.ctx.fillRect(x + 2, y + 2, this.actualCellSize - 4, this.actualCellSize - 4);
                
                // Body pattern
                this.ctx.fillStyle = `rgba(255, 158, 205, ${alpha * 0.5})`;
                this.ctx.fillRect(x + 4, y + 4, this.actualCellSize - 8, this.actualCellSize - 8);
            }
        });
    }

    drawFoods() {
        this.foods.forEach(food => {
            const x = food.x * this.actualCellSize;
            const y = food.y * this.actualCellSize;
            const pulse = 1 + Math.sin(food.animation) * 0.1;
            
            this.ctx.save();
            this.ctx.translate(x + this.actualCellSize/2, y + this.actualCellSize/2);
            this.ctx.scale(pulse, pulse);
            this.ctx.font = `${Math.max(12, this.actualCellSize - 4)}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(food.emoji, 0, 0);
            this.ctx.restore();
        });
    }

    drawObstacles() {
        this.obstacles.forEach(obstacle => {
            const x = obstacle.x * this.actualCellSize;
            const y = obstacle.y * this.actualCellSize;
            
            this.ctx.fillStyle = '#8b5a9f';
            this.ctx.fillRect(x + 1, y + 1, this.actualCellSize - 2, this.actualCellSize - 2);
            
            this.ctx.font = `${Math.max(10, this.actualCellSize - 6)}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(obstacle.emoji, x + this.actualCellSize/2, y + this.actualCellSize/2);
        });
    }

    drawPowerUps() {
        this.powerUps.forEach(powerUp => {
            const x = powerUp.x * this.actualCellSize;
            const y = powerUp.y * this.actualCellSize;
            const pulse = 1 + Math.sin(powerUp.animation) * 0.2;
            const glow = Math.sin(powerUp.animation * 2) * 0.5 + 0.5;
            
            // Glow effect
            this.ctx.save();
            this.ctx.shadowColor = this.currentLevelData.accentColor;
            this.ctx.shadowBlur = 10 * glow;
            
            this.ctx.translate(x + this.actualCellSize/2, y + this.actualCellSize/2);
            this.ctx.scale(pulse, pulse);
            this.ctx.font = `${Math.max(12, this.actualCellSize - 2)}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(powerUp.emoji, 0, 0);
            this.ctx.restore();
        });
    }

    drawCats() {
        this.cats.forEach(cat => {
            const x = cat.x * this.actualCellSize;
            const y = cat.y * this.actualCellSize;
            const bounce = Math.sin(cat.animation) * 2;
            
            this.ctx.save();
            this.ctx.translate(x + this.actualCellSize/2, y + this.actualCellSize/2 + bounce);
            
            if (cat.petted) {
                // Happy cat with hearts
                this.ctx.font = `${Math.max(12, this.actualCellSize - 4)}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('😸', 0, 0);
                
                // Floating hearts
                this.ctx.font = `${Math.max(8, this.actualCellSize/3)}px Arial`;
                this.ctx.fillText('💖', -8, -8);
                this.ctx.fillText('💖', 8, -8);
            } else {
                this.ctx.font = `${Math.max(12, this.actualCellSize - 4)}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(cat.emoji, 0, 0);
            }
            
            this.ctx.restore();
        });
    }

    drawCoins() {
        this.coins_on_board.forEach(coin => {
            const x = coin.x * this.actualCellSize;
            const y = coin.y * this.actualCellSize;
            const spin = coin.animation;
            const scale = 1 + Math.sin(spin * 2) * 0.1;
            
            this.ctx.save();
            this.ctx.translate(x + this.actualCellSize/2, y + this.actualCellSize/2);
            this.ctx.scale(scale, scale);
            this.ctx.rotate(spin * 0.1);
            
            this.ctx.font = `${Math.max(12, this.actualCellSize - 4)}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('🪙', 0, 0);
            this.ctx.restore();
        });
    }

    drawParticles() {
        this.particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.font = `${12 * alpha}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(particle.emoji, particle.x, particle.y);
            this.ctx.restore();
        });
    }

    drawPowerUpOverlay() {
        if (this.powerUpEffects.invincible > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.1;
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }
    }

    // Game flow methods
    handleKeyPress(event) {
        if (!this.gameStarted || !this.gameActive) return;
        
        event.preventDefault();
        const key = event.key;
        
        // Movement controls
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
            case ' ':
                this.gameActive ? this.pauseGame() : this.resumeGame();
                break;
            case 'r':
            case 'R':
                this.replayLevel();
                break;
        }
    }

    pauseGame(container) {
        this.gameActive = false;
        if (!container) {
            container = document.querySelector('.sd-game-container');
        }
        
        if (container) {
            const pauseBtn = container.querySelector('.sd-pause-btn');
            const resumeBtn = container.querySelector('.sd-resume-btn');
            
            if (pauseBtn) pauseBtn.style.display = 'none';
            if (resumeBtn) resumeBtn.style.display = 'inline-block';
        }
    }

    resumeGame(container) {
        this.gameActive = true;
        if (!container) {
            container = document.querySelector('.sd-game-container');
        }
        
        if (container) {
            const pauseBtn = container.querySelector('.sd-pause-btn');
            const resumeBtn = container.querySelector('.sd-resume-btn');
            
            if (pauseBtn) pauseBtn.style.display = 'inline-block';
            if (resumeBtn) resumeBtn.style.display = 'none';
        }
    }

    replayLevel(container) {
        if (!container) {
            container = document.querySelector('.sd-game-container');
        }
        this.startLevel(container, this.currentLevel);
    }

    nextLevel(container) {
        if (this.currentLevel < this.levels.length) {
            this.startLevel(container, this.currentLevel + 1);
        } else {
            this.showLevelSelector(container);
        }
    }

    showLevelSelector(container) {
        this.cleanup();
        this.gameStarted = false;
        
        // Refresh level buttons
        const levelGrid = container.querySelector('.sd-level-grid');
        if (levelGrid) {
            levelGrid.innerHTML = this.createLevelButtons();
            
            // Re-attach event listeners
            const levelButtons = container.querySelectorAll('.sd-level-bubble.sd-unlocked');
            levelButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const levelId = parseInt(btn.dataset.level);
                    this.startLevel(container, levelId);
                });
            });
        }
        
        // Update stats
        this.updateStats(container);
        
        // Show level selector
        container.querySelector('.sd-level-selector').style.display = 'block';
        container.querySelector('.sd-game-play').style.display = 'none';
        container.querySelector('.sd-level-complete').style.display = 'none';
        container.querySelector('.sd-game-over').style.display = 'none';
    }

    levelComplete() {
        this.gameActive = false;
        this.gameStarted = false;
        
        // Unlock next level
        const nextLevel = this.currentLevel + 1;
        if (nextLevel <= this.levels.length && !this.unlockedLevels.includes(nextLevel)) {
            this.unlockedLevels.push(nextLevel);
            this.saveUnlockedLevels();
        }
        
        // Check and award achievements
        const newAchievements = this.checkAchievements();
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }
        
        // Save coins
        this.saveCoins();
        
        // Show completion screen
        const container = document.querySelector('.sd-game-container');
        this.showLevelCompleteScreen(container, newAchievements);
    }

    showLevelCompleteScreen(container, newAchievements) {
        const levelCompleteScreen = container.querySelector('.sd-level-complete');
        const levelScoreEl = container.querySelector('.sd-level-score');
        const coinsEarnedEl = container.querySelector('.sd-coins-earned');
        const catsPettedEl = container.querySelector('.sd-cats-petted');
        const newAchievementsEl = container.querySelector('.sd-new-achievements');
        const newAchievementList = container.querySelector('.sd-new-achievement-list');
        const nextLevelBtn = container.querySelector('.sd-next-level-btn');
        
        if (levelScoreEl) levelScoreEl.textContent = this.levelScore;
        if (coinsEarnedEl) coinsEarnedEl.textContent = this.levelCoins;
        if (catsPettedEl) catsPettedEl.textContent = this.levelCatsPetted;
        
        // Show new achievements
        if (newAchievements.length > 0 && newAchievementsEl && newAchievementList) {
            newAchievementsEl.style.display = 'block';
            newAchievementList.innerHTML = newAchievements.map(achievement => 
                `<div class="sd-new-achievement">
                    <span class="sd-achievement-icon">${achievement.icon}</span>
                    <span class="sd-achievement-name">${achievement.name}</span>
                </div>`
            ).join('');
        } else if (newAchievementsEl) {
            newAchievementsEl.style.display = 'none';
        }
        
        // Hide next level button if this is the last level
        if (nextLevelBtn) {
            nextLevelBtn.style.display = this.currentLevel >= this.levels.length ? 'none' : 'inline-block';
        }
        
        container.querySelector('.sd-game-play').style.display = 'none';
        levelCompleteScreen.style.display = 'block';
    }

    gameOver() {
        this.gameActive = false;
        this.gameStarted = false;
        
        const container = document.querySelector('.sd-game-container');
        const gameOverScreen = container.querySelector('.sd-game-over');
        const finalScoreEl = container.querySelector('.sd-final-score');
        const coinsCollectedEl = container.querySelector('.sd-coins-collected');
        
        if (finalScoreEl) finalScoreEl.textContent = this.score;
        if (coinsCollectedEl) coinsCollectedEl.textContent = this.levelCoins;
        
        this.saveCoins();
        
        container.querySelector('.sd-game-play').style.display = 'none';
        gameOverScreen.style.display = 'block';
        
        this.cleanup();
    }

    checkAchievements() {
        const newAchievements = [];
        const achievementChecks = [
            { id: 'first_level', name: 'Welcome to ElxaCorp!', icon: '🏢', condition: () => this.currentLevel >= 1 },
            { id: 'cat_lover', name: 'Cat Whisperer', icon: '🐱', condition: () => this.levelCatsPetted >= 3 },
            { id: 'coin_collector', name: 'Profit Collector', icon: '🪙', condition: () => this.coins >= 50 },
            { id: 'speed_demon', name: 'Efficiency Expert', icon: '⚡', condition: () => this.powerUpEffects.speed > 0 },
            { id: 'invincible_warrior', name: 'Executive Immunity', icon: '🛡️', condition: () => this.powerUpEffects.invincible > 0 },
            { id: 'magnet_master', name: 'Corporate Magnetism', icon: '🧲', condition: () => this.powerUpEffects.magnetism > 0 },
            { id: 'score_doubler', name: 'Profit Multiplier', icon: '💰', condition: () => this.powerUpEffects.double_score > 0 },
            { id: 'garden_visitor', name: 'Garden Visitor', icon: '🌸', condition: () => this.currentLevel >= 3 },
            { id: 'denali_driver', name: 'Denali Driver', icon: '🚗', condition: () => this.currentLevel >= 4 },
            { id: 'snakesia_citizen', name: 'Snakesia Citizen', icon: '🏙️', condition: () => this.currentLevel >= 5 },
            { id: 'math_genius', name: 'Numbers Genius', icon: '📐', condition: () => this.currentLevel >= 6 },
            { id: 'hacker_elite', name: 'Tech Elite', icon: '💻', condition: () => this.currentLevel >= 7 },
            { id: 'cat_sanctuary_hero', name: 'Cat Sanctuary Hero', icon: '😸', condition: () => this.currentLevel >= 8 },
            { id: 'boardroom_boss', name: 'Boardroom Boss', icon: '💼', condition: () => this.currentLevel >= 9 },
            { id: 'snakesia_king', name: 'CEO of Snakesia!', icon: '👑', condition: () => this.currentLevel >= 10 },
            { id: 'high_scorer', name: 'High Performer', icon: '🏆', condition: () => this.score >= 500 },
            { id: 'perfectionist', name: 'Overachiever', icon: '⭐', condition: () => this.score >= this.currentLevelData.targetScore * 2 },
            { id: 'mrs_snake_proud', name: 'Mrs. Snake-e is Proud!', icon: '🐍', condition: () => this.levelCatsPetted >= 5 },
            { id: 'elxacorp_employee', name: 'Employee of the Month', icon: '🏅', condition: () => this.score >= 1000 },
            { id: 'snake_legend', name: 'Corporate Legend', icon: '🐍', condition: () => this.score >= 2000 }
        ];
        
        achievementChecks.forEach(check => {
            if (!this.achievements.some(a => a.id === check.id) && check.condition()) {
                const achievement = {
                    id: check.id,
                    name: check.name,
                    icon: check.icon,
                    dateEarned: new Date().toISOString()
                };
                this.achievements.push(achievement);
                newAchievements.push(achievement);
            }
        });
        
        if (newAchievements.length > 0) {
            this.saveAchievements();
        }
        
        return newAchievements;
    }

    // Save/Load methods
    saveCoins() {
        localStorage.setItem('elxaOS-snake-deluxe-coins', this.coins.toString());
    }

    saveHighScore() {
        localStorage.setItem('elxaOS-snake-deluxe-highscore', this.highScore.toString());
    }

    saveAchievements() {
        localStorage.setItem('elxaOS-snake-deluxe-achievements', JSON.stringify(this.achievements));
    }

    saveUnlockedLevels() {
        localStorage.setItem('elxaOS-snake-deluxe-levels', JSON.stringify(this.unlockedLevels));
    }

    cleanup() {
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
        }
        
        if (this.particleLoopInterval) {
            clearInterval(this.particleLoopInterval);
            this.particleLoopInterval = null;
        }
        
        // Hide all effect indicators
        Object.keys(this.powerUpEffects).forEach(effect => {
            this.hideEffectIndicator(effect);
        });
    }

    destroy() {
        this.cleanup();
        
        // Clear splash timer if still running
        if (this.splashTimer) {
            clearTimeout(this.splashTimer);
            this.splashTimer = null;
        }
        
        document.removeEventListener('keydown', this.keyHandler);
        document.removeEventListener('keydown', this.splashKeyHandler);
    }
}