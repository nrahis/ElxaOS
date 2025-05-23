// =================================
// SNAKE DELUXE - Mr. Snake-e's Epic Adventure in Snakesia! (FIXED)
// A magical journey through ElxaCorp's headquarters and beyond!
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
        
        // Difficulty settings
        this.difficulty = gameData.difficulty || 'normal';
        this.baseSpeed = this.getDifficultySpeed();
        this.currentSpeed = this.baseSpeed;
        
        // Game board
        this.boardSize = 24; // Larger board for more adventure!
        this.cellSize = 18;
        
        // Snake state
        this.snake = [{ x: 12, y: 12 }];
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
            case 'easy': return 180;
            case 'normal': return 140;
            case 'hard': return 100;
            case 'snakesia_master': return 80;
            default: return 140;
        }
    }

    createLevelData() {
        return [
            {
                id: 1,
                name: "ElxaCorp Lobby",
                description: "Welcome to ElxaCorp HQ! Mr. Snake-e needs coffee to start his day.",
                theme: "office",
                bgColor: "#1a1a2e",
                accentColor: "#4a9eff",
                foods: [{ type: "coffee", count: 5, points: 10 }],
                obstacles: [], // No obstacles in tutorial level
                powerUps: ["speed"],
                targetScore: 50,
                cats: 1
            },
            {
                id: 2,
                name: "The Server Room",
                description: "Time to check the ElxaOS servers! Watch out for the server racks.",
                theme: "tech",
                bgColor: "#0f1419",
                accentColor: "#4a9eff",
                foods: [
                    { type: "data", count: 3, points: 15 },
                    { type: "coffee", count: 2, points: 10 }
                ],
                obstacles: ["server_rack", "cable"],
                powerUps: ["speed", "invincible"],
                targetScore: 120,
                cats: 2
            },
            {
                id: 3,
                name: "Mrs. Snake-e's Garden",
                description: "Visit Mrs. Snake-e in her beautiful garden! She's 82 and still growing the best vegetables.",
                theme: "garden",
                bgColor: "#0f2027",
                accentColor: "#4a9eff",
                foods: [
                    { type: "apple", count: 4, points: 20 },
                    { type: "flower", count: 3, points: 25 }
                ],
                obstacles: ["flower_bed", "garden_tool"],
                powerUps: ["magnetism", "double_score"],
                targetScore: 200,
                cats: 3
            },
            {
                id: 4,
                name: "The Denali Garage",
                description: "Mr. Snake-e's beloved Denali needs some maintenance. Navigate around the tools!",
                theme: "garage",
                bgColor: "#1a1a1a",
                accentColor: "#4a9eff",
                foods: [
                    { type: "oil", count: 2, points: 30 },
                    { type: "wrench", count: 4, points: 15 }
                ],
                obstacles: ["car_part", "tool_box", "oil_spill"],
                powerUps: ["speed", "invincible", "double_score"],
                targetScore: 300,
                cats: 2
            },
            {
                id: 5,
                name: "Snakesia Capital City",
                description: "Explore the bustling capital of Snakesia! Mr. Snake-e's kingdom awaits.",
                theme: "city",
                bgColor: "#2d1b69",
                accentColor: "#4a9eff",
                foods: [
                    { type: "coin", count: 6, points: 25 },
                    { type: "gem", count: 2, points: 50 }
                ],
                obstacles: ["building", "traffic_cone", "street_lamp"],
                powerUps: ["speed", "magnetism", "double_score", "invincible"],
                targetScore: 450,
                cats: 4
            },
            {
                id: 6,
                name: "The Math Laboratory",
                description: "Mr. Snake-e's favorite place! Solve equations and collect numbers.",
                theme: "math",
                bgColor: "#1e3a8a",
                accentColor: "#4a9eff",
                foods: [
                    { type: "equation", count: 5, points: 40 },
                    { type: "calculator", count: 3, points: 35 }
                ],
                obstacles: ["blackboard", "desk", "computer"],
                powerUps: ["speed", "double_score", "invincible"],
                targetScore: 600,
                cats: 3
            },
            {
                id: 7,
                name: "Hacker's Paradise",
                description: "The secret underground hacking lab! Navigate through the maze of screens.",
                theme: "hacker",
                bgColor: "#0a0a0a",
                accentColor: "#4a9eff",
                foods: [
                    { type: "code", count: 4, points: 45 },
                    { type: "usb", count: 3, points: 40 }
                ],
                obstacles: ["monitor", "keyboard", "server", "cable_mess"],
                powerUps: ["magnetism", "invincible", "double_score"],
                targetScore: 800,
                cats: 5
            },
            {
                id: 8,
                name: "Cat Sanctuary",
                description: "Mr. Snake-e's ultimate happy place! A sanctuary full of his favorite friends.",
                theme: "cats",
                bgColor: "#4a5568",
                accentColor: "#4a9eff",
                foods: [
                    { type: "fish", count: 6, points: 30 },
                    { type: "yarn", count: 4, points: 35 }
                ],
                obstacles: ["cat_tree", "litter_box", "scratching_post"],
                powerUps: ["speed", "magnetism", "double_score", "invincible"],
                targetScore: 1000,
                cats: 8
            },
            {
                id: 9,
                name: "ElxaCorp Boardroom",
                description: "The final challenge! Navigate the boardroom where Mr. Snake-e makes billion-dollar decisions.",
                theme: "boardroom",
                bgColor: "#1a202c",
                accentColor: "#4a9eff",
                foods: [
                    { type: "contract", count: 3, points: 60 },
                    { type: "money", count: 5, points: 50 }
                ],
                obstacles: ["conference_table", "chair", "projector", "whiteboard"],
                powerUps: ["speed", "magnetism", "double_score", "invincible"],
                targetScore: 1200,
                cats: 6
            },
            {
                id: 10,
                name: "Snakesia Throne Room",
                description: "The ultimate level! Help Mr. Snake-e rule Snakesia from his golden throne!",
                theme: "throne",
                bgColor: "#2d1b69",
                accentColor: "#4a9eff",
                foods: [
                    { type: "crown", count: 2, points: 100 },
                    { type: "scepter", count: 3, points: 80 },
                    { type: "gem", count: 4, points: 60 }
                ],
                obstacles: ["throne", "pillar", "statue", "treasure_chest"],
                powerUps: ["speed", "magnetism", "double_score", "invincible"],
                targetScore: 1500,
                cats: 10
            }
        ];
    }

    initializeLevel() {
        this.currentLevelData = this.levels[this.currentLevel - 1];
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
        
        // Generate obstacles
        const numObstacles = Math.min(levelData.obstacles.length * 2, 8);
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
        const windowContent = this.createGameInterface();
        
        const window = this.windowManager.createWindow(
            windowId,
            `🐍👑 ${programInfo.name}`,
            windowContent,
            { width: '800px', height: '720px', x: '100px', y: '30px' }
        );
        
        this.setupGameEvents(windowId);
        return windowId;
    }

    createGameInterface() {
        const boardPixelSize = this.boardSize * this.cellSize;
        
        return `
            <div class="snake-deluxe-container">
                <div class="snake-deluxe-header">
                    <div class="game-logo">
                        <span class="logo-icon">🐍👑</span>
                        <span class="logo-text">Snake Deluxe</span>
                    </div>
                    <div class="game-stats">
                        <div class="stat-group">
                            <div class="stat-item primary">
                                <span class="stat-icon">🏆</span>
                                <span class="stat-value score-value">0</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-icon">🪙</span>
                                <span class="stat-value coins-value">${this.coins}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-icon">📊</span>
                                <span class="stat-value level-value">1</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="story-banner">
                    <div class="story-content">
                        <div class="story-character">🐍</div>
                        <div class="story-text">
                            <div class="story-title">Mr. Snake-e's Adventure</div>
                            <div class="story-description">Help the billionaire CEO of ElxaCorp navigate through Snakesia!</div>
                        </div>
                    </div>
                </div>
                
                <div class="snake-deluxe-game-area">
                    <div class="level-selector-screen">
                        <div class="level-selector-content">
                            <h2>🏰 Choose Your Adventure in Snakesia!</h2>
                            <div class="character-intro">
                                <div class="character-avatar">🐍</div>
                                <div class="character-speech">
                                    <p>Greetings! I'm Mr. Snake-e, 60-year-old CEO of ElxaCorp!</p>
                                    <p>My wife Mrs. Snake-e (she's 82, what a cougar! 😉) and I need your help!</p>
                                    <p>Join me on adventures through my kingdom of Snakesia!</p>
                                </div>
                            </div>
                            <div class="difficulty-selector">
                                <h3>🎮 Choose Difficulty:</h3>
                                <div class="difficulty-buttons">
                                    <button class="difficulty-btn ${this.difficulty === 'easy' ? 'selected' : ''}" data-difficulty="easy">
                                        🟢 Young Explorer<br><small>Perfect for beginners!</small>
                                    </button>
                                    <button class="difficulty-btn ${this.difficulty === 'normal' ? 'selected' : ''}" data-difficulty="normal">
                                        🟡 Snake Adventurer<br><small>Balanced challenge</small>
                                    </button>
                                    <button class="difficulty-btn ${this.difficulty === 'hard' ? 'selected' : ''}" data-difficulty="hard">
                                        🟠 ElxaCorp Expert<br><small>For pros only!</small>
                                    </button>
                                    <button class="difficulty-btn ${this.difficulty === 'snakesia_master' ? 'selected' : ''}" data-difficulty="snakesia_master">
                                        🔴 Snakesia Master<br><small>Ultimate challenge!</small>
                                    </button>
                                </div>
                            </div>
                            <div class="level-grid">
                                ${this.createLevelButtons()}
                            </div>
                            <div class="achievements-preview">
                                <h3>🏅 Your Achievements: ${this.achievements.length}/20</h3>
                                <div class="achievement-icons">
                                    ${this.achievements.slice(0, 5).map(achievement => `<span class="achievement-icon" title="${achievement.name}">${achievement.icon}</span>`).join('')}
                                    ${this.achievements.length > 5 ? '<span class="more-achievements">+' + (this.achievements.length - 5) + '</span>' : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="game-play-screen" style="display: none;">
                        <div class="level-info-bar">
                            <div class="level-details">
                                <span class="level-name"></span>
                                <span class="level-description"></span>
                            </div>
                            <div class="level-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill"></div>
                                </div>
                                <span class="progress-text">0 / 0</span>
                            </div>
                        </div>
                        
                        <div class="canvas-container">
                            <canvas class="snake-deluxe-canvas" width="${boardPixelSize}" height="${boardPixelSize}"></canvas>
                            <div class="power-up-effects">
                                <div class="effect-indicator speed-effect" style="display: none;">
                                    <span class="effect-icon">⚡</span>
                                    <span class="effect-text">SPEED BOOST!</span>
                                </div>
                                <div class="effect-indicator invincible-effect" style="display: none;">
                                    <span class="effect-icon">🛡️</span>
                                    <span class="effect-text">INVINCIBLE!</span>
                                </div>
                                <div class="effect-indicator magnetism-effect" style="display: none;">
                                    <span class="effect-icon">🧲</span>
                                    <span class="effect-text">MAGNET POWER!</span>
                                </div>
                                <div class="effect-indicator double-score-effect" style="display: none;">
                                    <span class="effect-icon">💰</span>
                                    <span class="effect-text">DOUBLE SCORE!</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="game-controls">
                            <button class="game-control-btn pause-btn">⏸️ Pause</button>
                            <button class="game-control-btn resume-btn" style="display: none;">▶️ Resume</button>
                            <button class="game-control-btn back-to-levels-btn">🏰 Levels</button>
                            <div class="controls-hint">
                                <span>Arrow Keys: Move</span>
                                <span>Space: Pause</span>
                                <span>R: Restart</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="level-complete-screen" style="display: none;">
                        <div class="level-complete-content">
                            <div class="completion-celebration">
                                <div class="celebration-icon">🎉</div>
                                <h2>Level Complete!</h2>
                                <div class="mr-snake-celebration">
                                    <div class="character-avatar">🐍</div>
                                    <div class="celebration-speech">Excellent work! ElxaCorp is proud of you!</div>
                                </div>
                            </div>
                            <div class="level-results">
                                <div class="result-item">
                                    <span class="result-icon">🏆</span>
                                    <span class="result-label">Score:</span>
                                    <span class="result-value level-score">0</span>
                                </div>
                                <div class="result-item">
                                    <span class="result-icon">🪙</span>
                                    <span class="result-label">Coins Earned:</span>
                                    <span class="result-value coins-earned">0</span>
                                </div>
                                <div class="result-item">
                                    <span class="result-icon">🐱</span>
                                    <span class="result-label">Cats Petted:</span>
                                    <span class="result-value cats-petted">0</span>
                                </div>
                            </div>
                            <div class="new-achievements" style="display: none;">
                                <h3>🏅 New Achievements!</h3>
                                <div class="new-achievement-list"></div>
                            </div>
                            <div class="level-complete-actions">
                                <button class="action-btn next-level-btn">➡️ Next Adventure</button>
                                <button class="action-btn replay-level-btn">🔄 Replay Level</button>
                                <button class="action-btn back-to-levels-btn">🏰 Level Select</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="game-over-screen" style="display: none;">
                        <div class="game-over-content">
                            <div class="game-over-character">🐍</div>
                            <h2>Oops! Mr. Snake-e got into trouble!</h2>
                            <div class="mrs-snake-comfort">
                                <div class="character-avatar">🐍</div>
                                <div class="comfort-speech">Don't worry dear, Mrs. Snake-e believes in you! Try again!</div>
                            </div>
                            <div class="game-over-stats">
                                <div class="stat-item">
                                    <span class="stat-icon">🏆</span>
                                    <span class="stat-value final-score">0</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-icon">🪙</span>
                                    <span class="stat-value coins-collected">0</span>
                                </div>
                            </div>
                            <div class="game-over-actions">
                                <button class="action-btn try-again-btn">🔄 Try Again</button>
                                <button class="action-btn back-to-levels-btn">🏰 Level Select</button>
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
                <div class="level-button ${isUnlocked ? 'unlocked' : 'locked'} ${isCompleted ? 'completed' : ''}" 
                     data-level="${level.id}" 
                     ${isUnlocked ? '' : 'disabled'}>
                    <div class="level-number">${level.id}</div>
                    <div class="level-name">${level.name}</div>
                    <div class="level-theme-icon">${this.getLevelThemeIcon(level.theme)}</div>
                    ${isCompleted ? '<div class="completion-star">⭐</div>' : ''}
                    ${!isUnlocked ? '<div class="lock-icon">🔒</div>' : ''}
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

    setupGameEvents(windowId) {
        const window = document.getElementById(`window-${windowId}`);
        const container = window.querySelector('.snake-deluxe-container');
        
        this.canvas = container.querySelector('.snake-deluxe-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Difficulty selection
        const difficultyButtons = container.querySelectorAll('.difficulty-btn');
        difficultyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                difficultyButtons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.difficulty = btn.dataset.difficulty;
                this.baseSpeed = this.getDifficultySpeed();
                this.currentSpeed = this.baseSpeed;
            });
        });
        
        // Level selection
        const levelButtons = container.querySelectorAll('.level-button.unlocked');
        levelButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const levelId = parseInt(btn.dataset.level);
                this.startLevel(container, levelId);
            });
        });
        
        // Game controls
        const pauseBtn = container.querySelector('.pause-btn');
        const resumeBtn = container.querySelector('.resume-btn');
        const backToLevelsButtons = container.querySelectorAll('.back-to-levels-btn');
        
        pauseBtn?.addEventListener('click', () => this.pauseGame(container));
        resumeBtn?.addEventListener('click', () => this.resumeGame(container));
        backToLevelsButtons.forEach(btn => {
            btn.addEventListener('click', () => this.showLevelSelector(container));
        });
        
        // Level complete actions
        const nextLevelBtn = container.querySelector('.next-level-btn');
        const replayLevelBtn = container.querySelector('.replay-level-btn');
        const tryAgainBtn = container.querySelector('.try-again-btn');
        
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
        
        // Reset game state
        this.snake = [{ x: 12, y: 12 }];
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
        
        // Update UI
        this.updateLevelInfo(container);
        this.updateStats(container);
        
        // Show game screen
        container.querySelector('.level-selector-screen').style.display = 'none';
        container.querySelector('.level-complete-screen').style.display = 'none';
        container.querySelector('.game-over-screen').style.display = 'none';
        container.querySelector('.game-play-screen').style.display = 'block';
        
        // Start game loop
        this.startGameLoop();
        this.startParticleLoop();
        
        // Initial render
        this.render();
    }

    updateLevelInfo(container) {
        const levelData = this.currentLevelData;
        const levelNameEl = container.querySelector('.level-name');
        const levelDescEl = container.querySelector('.level-description');
        const progressText = container.querySelector('.progress-text');
        
        if (levelNameEl) levelNameEl.textContent = levelData.name;
        if (levelDescEl) levelDescEl.textContent = levelData.description;
        if (progressText) progressText.textContent = `${this.score} / ${levelData.targetScore}`;
        
        this.updateProgressBar(container);
    }

    updateProgressBar(container) {
        const progressFill = container.querySelector('.progress-fill');
        const progressText = container.querySelector('.progress-text');
        
        if (progressFill && progressText) {
            const progress = Math.min(this.score / this.currentLevelData.targetScore, 1);
            progressFill.style.width = `${progress * 100}%`;
            progressText.textContent = `${this.score} / ${this.currentLevelData.targetScore}`;
        }
    }

    generateFood(type, points) {
        let pos;
        do {
            pos = {
                x: Math.floor(Math.random() * this.boardSize),
                y: Math.floor(Math.random() * this.boardSize)
            };
        } while (this.isPositionOccupied(pos));
        
        this.foods.push({
            x: pos.x,
            y: pos.y,
            type: type,
            points: points,
            emoji: this.getFoodEmoji(type),
            animation: 0
        });
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
        do {
            pos = {
                x: Math.floor(Math.random() * this.boardSize),
                y: Math.floor(Math.random() * this.boardSize)
            };
        } while (this.isPositionOccupied(pos));
        
        this.obstacles.push({
            x: pos.x,
            y: pos.y,
            type: type,
            emoji: this.getObstacleEmoji(type)
        });
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
        do {
            pos = {
                x: Math.floor(Math.random() * this.boardSize),
                y: Math.floor(Math.random() * this.boardSize)
            };
        } while (this.isPositionOccupied(pos));
        
        this.powerUps.push({
            x: pos.x,
            y: pos.y,
            type: type,
            emoji: this.getPowerUpEmoji(type),
            animation: 0
        });
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
        do {
            pos = {
                x: Math.floor(Math.random() * this.boardSize),
                y: Math.floor(Math.random() * this.boardSize)
            };
        } while (this.isPositionOccupied(pos));
        
        this.cats.push({
            x: pos.x,
            y: pos.y,
            emoji: '🐱',
            animation: 0,
            petted: false
        });
    }

    generateCoin() {
        let pos;
        do {
            pos = {
                x: Math.floor(Math.random() * this.boardSize),
                y: Math.floor(Math.random() * this.boardSize)
            };
        } while (this.isPositionOccupied(pos));
        
        this.coins_on_board.push({
            x: pos.x,
            y: pos.y,
            animation: 0
        });
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
        const container = document.querySelector('.snake-deluxe-container');
        const indicator = container.querySelector(`.${effect}-effect`);
        if (indicator) {
            indicator.style.display = 'block';
        }
    }

    hideEffectIndicator(effect) {
        const container = document.querySelector('.snake-deluxe-container');
        const indicator = container.querySelector(`.${effect}-effect`);
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    createParticles(x, y, emoji, type) {
        const colors = {
            food: ['#4a9eff', '#74b9ff', '#0093e6'],
            powerup: ['#4a9eff', '#74b9ff', '#0093e6'],
            heart: ['#ff69b4', '#ff1493', '#ff6b9d'],
            coin: ['#ffd700', '#ffed4e', '#ffa500']
        };
        
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x * this.cellSize + this.cellSize / 2,
                y: y * this.cellSize + this.cellSize / 2,
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
        const container = document.querySelector('.snake-deluxe-container');
        this.updateProgressBar(container);
        this.updateStats(container);
        
        // Check level completion
        if (this.score >= this.currentLevelData.targetScore) {
            this.levelComplete();
        }
    }

    updateStats(container) {
        if (container) {
            const scoreEl = container.querySelector('.score-value');
            const coinsEl = container.querySelector('.coins-value');
            const levelEl = container.querySelector('.level-value');
            
            if (scoreEl) scoreEl.textContent = this.score;
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
            const pos = i * this.cellSize;
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
            const x = segment.x * this.cellSize;
            const y = segment.y * this.cellSize;
            
            if (index === 0) {
                // Snake head (Mr. Snake-e!)
                this.ctx.fillStyle = this.powerUpEffects.invincible > 0 ? '#ffd700' : '#4a9eff';
                this.ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
                
                // Draw eyes
                this.ctx.fillStyle = '#ffffff';
                const eyeSize = 3;
                if (this.direction.x === 1) { // Moving right
                    this.ctx.fillRect(x + this.cellSize - 8, y + 6, eyeSize, eyeSize);
                    this.ctx.fillRect(x + this.cellSize - 8, y + 10, eyeSize, eyeSize);
                } else if (this.direction.x === -1) { // Moving left
                    this.ctx.fillRect(x + 5, y + 6, eyeSize, eyeSize);
                    this.ctx.fillRect(x + 5, y + 10, eyeSize, eyeSize);
                } else if (this.direction.y === -1) { // Moving up
                    this.ctx.fillRect(x + 6, y + 5, eyeSize, eyeSize);
                    this.ctx.fillRect(x + 10, y + 5, eyeSize, eyeSize);
                } else if (this.direction.y === 1) { // Moving down
                    this.ctx.fillRect(x + 6, y + this.cellSize - 8, eyeSize, eyeSize);
                    this.ctx.fillRect(x + 10, y + this.cellSize - 8, eyeSize, eyeSize);
                }
            } else {
                // Snake body
                const alpha = Math.max(0.3, 1 - (index * 0.03));
                const color = this.powerUpEffects.invincible > 0 ? `rgba(255, 215, 0, ${alpha})` : `rgba(74, 158, 255, ${alpha})`;
                this.ctx.fillStyle = color;
                this.ctx.fillRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
                
                // Body pattern
                this.ctx.fillStyle = `rgba(116, 185, 255, ${alpha * 0.5})`;
                this.ctx.fillRect(x + 4, y + 4, this.cellSize - 8, this.cellSize - 8);
            }
        });
    }

    drawFoods() {
        this.foods.forEach(food => {
            const x = food.x * this.cellSize;
            const y = food.y * this.cellSize;
            const pulse = 1 + Math.sin(food.animation) * 0.1;
            
            this.ctx.save();
            this.ctx.translate(x + this.cellSize/2, y + this.cellSize/2);
            this.ctx.scale(pulse, pulse);
            this.ctx.font = `${this.cellSize - 4}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(food.emoji, 0, 0);
            this.ctx.restore();
        });
    }

    drawObstacles() {
        this.obstacles.forEach(obstacle => {
            const x = obstacle.x * this.cellSize;
            const y = obstacle.y * this.cellSize;
            
            this.ctx.fillStyle = '#666666';
            this.ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
            
            this.ctx.font = `${this.cellSize - 6}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(obstacle.emoji, x + this.cellSize/2, y + this.cellSize/2);
        });
    }

    drawPowerUps() {
        this.powerUps.forEach(powerUp => {
            const x = powerUp.x * this.cellSize;
            const y = powerUp.y * this.cellSize;
            const pulse = 1 + Math.sin(powerUp.animation) * 0.2;
            const glow = Math.sin(powerUp.animation * 2) * 0.5 + 0.5;
            
            // Glow effect
            this.ctx.save();
            this.ctx.shadowColor = this.currentLevelData.accentColor;
            this.ctx.shadowBlur = 10 * glow;
            
            this.ctx.translate(x + this.cellSize/2, y + this.cellSize/2);
            this.ctx.scale(pulse, pulse);
            this.ctx.font = `${this.cellSize - 2}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(powerUp.emoji, 0, 0);
            this.ctx.restore();
        });
    }

    drawCats() {
        this.cats.forEach(cat => {
            const x = cat.x * this.cellSize;
            const y = cat.y * this.cellSize;
            const bounce = Math.sin(cat.animation) * 2;
            
            this.ctx.save();
            this.ctx.translate(x + this.cellSize/2, y + this.cellSize/2 + bounce);
            
            if (cat.petted) {
                // Happy cat with hearts
                this.ctx.font = `${this.cellSize - 4}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('😸', 0, 0);
                
                // Floating hearts
                this.ctx.font = `${this.cellSize/3}px Arial`;
                this.ctx.fillText('💖', -8, -8);
                this.ctx.fillText('💖', 8, -8);
            } else {
                this.ctx.font = `${this.cellSize - 4}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(cat.emoji, 0, 0);
            }
            
            this.ctx.restore();
        });
    }

    drawCoins() {
        this.coins_on_board.forEach(coin => {
            const x = coin.x * this.cellSize;
            const y = coin.y * this.cellSize;
            const spin = coin.animation;
            const scale = 1 + Math.sin(spin * 2) * 0.1;
            
            this.ctx.save();
            this.ctx.translate(x + this.cellSize/2, y + this.cellSize/2);
            this.ctx.scale(scale, scale);
            this.ctx.rotate(spin * 0.1);
            
            this.ctx.font = `${this.cellSize - 4}px Arial`;
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
            container = document.querySelector('.snake-deluxe-container');
        }
        
        if (container) {
            const pauseBtn = container.querySelector('.pause-btn');
            const resumeBtn = container.querySelector('.resume-btn');
            
            if (pauseBtn) pauseBtn.style.display = 'none';
            if (resumeBtn) resumeBtn.style.display = 'inline-block';
        }
    }

    resumeGame(container) {
        this.gameActive = true;
        if (!container) {
            container = document.querySelector('.snake-deluxe-container');
        }
        
        if (container) {
            const pauseBtn = container.querySelector('.pause-btn');
            const resumeBtn = container.querySelector('.resume-btn');
            
            if (pauseBtn) pauseBtn.style.display = 'inline-block';
            if (resumeBtn) resumeBtn.style.display = 'none';
        }
    }

    replayLevel(container) {
        if (!container) {
            container = document.querySelector('.snake-deluxe-container');
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
        const levelGrid = container.querySelector('.level-grid');
        if (levelGrid) {
            levelGrid.innerHTML = this.createLevelButtons();
            
            // Re-attach event listeners
            const levelButtons = container.querySelectorAll('.level-button.unlocked');
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
        container.querySelector('.level-selector-screen').style.display = 'block';
        container.querySelector('.game-play-screen').style.display = 'none';
        container.querySelector('.level-complete-screen').style.display = 'none';
        container.querySelector('.game-over-screen').style.display = 'none';
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
        const container = document.querySelector('.snake-deluxe-container');
        this.showLevelCompleteScreen(container, newAchievements);
    }

    showLevelCompleteScreen(container, newAchievements) {
        const levelCompleteScreen = container.querySelector('.level-complete-screen');
        const levelScoreEl = container.querySelector('.level-score');
        const coinsEarnedEl = container.querySelector('.coins-earned');
        const catsPettedEl = container.querySelector('.cats-petted');
        const newAchievementsEl = container.querySelector('.new-achievements');
        const newAchievementList = container.querySelector('.new-achievement-list');
        const nextLevelBtn = container.querySelector('.next-level-btn');
        
        if (levelScoreEl) levelScoreEl.textContent = this.levelScore;
        if (coinsEarnedEl) coinsEarnedEl.textContent = this.levelCoins;
        if (catsPettedEl) catsPettedEl.textContent = this.levelCatsPetted;
        
        // Show new achievements
        if (newAchievements.length > 0 && newAchievementsEl && newAchievementList) {
            newAchievementsEl.style.display = 'block';
            newAchievementList.innerHTML = newAchievements.map(achievement => 
                `<div class="new-achievement">
                    <span class="achievement-icon">${achievement.icon}</span>
                    <span class="achievement-name">${achievement.name}</span>
                </div>`
            ).join('');
        } else if (newAchievementsEl) {
            newAchievementsEl.style.display = 'none';
        }
        
        // Hide next level button if this is the last level
        if (nextLevelBtn) {
            nextLevelBtn.style.display = this.currentLevel >= this.levels.length ? 'none' : 'inline-block';
        }
        
        container.querySelector('.game-play-screen').style.display = 'none';
        levelCompleteScreen.style.display = 'block';
    }

    gameOver() {
        this.gameActive = false;
        this.gameStarted = false;
        
        const container = document.querySelector('.snake-deluxe-container');
        const gameOverScreen = container.querySelector('.game-over-screen');
        const finalScoreEl = container.querySelector('.final-score');
        const coinsCollectedEl = container.querySelector('.coins-collected');
        
        if (finalScoreEl) finalScoreEl.textContent = this.score;
        if (coinsCollectedEl) coinsCollectedEl.textContent = this.levelCoins;
        
        this.saveCoins();
        
        container.querySelector('.game-play-screen').style.display = 'none';
        gameOverScreen.style.display = 'block';
        
        this.cleanup();
    }

    checkAchievements() {
        const newAchievements = [];
        const achievementChecks = [
            { id: 'first_level', name: 'Welcome to ElxaCorp!', icon: '🏢', condition: () => this.currentLevel >= 1 },
            { id: 'cat_lover', name: 'Cat Whisperer', icon: '🐱', condition: () => this.levelCatsPetted >= 3 },
            { id: 'coin_collector', name: 'Coin Collector', icon: '🪙', condition: () => this.coins >= 50 },
            { id: 'speed_demon', name: 'Speed Demon', icon: '⚡', condition: () => this.powerUpEffects.speed > 0 },
            { id: 'invincible_warrior', name: 'Invincible Warrior', icon: '🛡️', condition: () => this.powerUpEffects.invincible > 0 },
            { id: 'magnet_master', name: 'Magnet Master', icon: '🧲', condition: () => this.powerUpEffects.magnetism > 0 },
            { id: 'score_doubler', name: 'Score Doubler', icon: '💰', condition: () => this.powerUpEffects.double_score > 0 },
            { id: 'garden_visitor', name: 'Garden Visitor', icon: '🌸', condition: () => this.currentLevel >= 3 },
            { id: 'denali_driver', name: 'Denali Driver', icon: '🚗', condition: () => this.currentLevel >= 4 },
            { id: 'snakesia_citizen', name: 'Snakesia Citizen', icon: '🏙️', condition: () => this.currentLevel >= 5 },
            { id: 'math_genius', name: 'Math Genius', icon: '📐', condition: () => this.currentLevel >= 6 },
            { id: 'hacker_elite', name: 'Hacker Elite', icon: '💻', condition: () => this.currentLevel >= 7 },
            { id: 'cat_sanctuary_hero', name: 'Cat Sanctuary Hero', icon: '😸', condition: () => this.currentLevel >= 8 },
            { id: 'boardroom_boss', name: 'Boardroom Boss', icon: '💼', condition: () => this.currentLevel >= 9 },
            { id: 'snakesia_king', name: 'King of Snakesia!', icon: '👑', condition: () => this.currentLevel >= 10 },
            { id: 'high_scorer', name: 'High Scorer', icon: '🏆', condition: () => this.score >= 500 },
            { id: 'perfectionist', name: 'Perfectionist', icon: '⭐', condition: () => this.score >= this.currentLevelData.targetScore * 2 },
            { id: 'mrs_snake_proud', name: 'Mrs. Snake-e is Proud!', icon: '🐍', condition: () => this.levelCatsPetted >= 5 },
            { id: 'elxacorp_employee', name: 'ElxaCorp Employee of the Month', icon: '🏅', condition: () => this.score >= 1000 },
            { id: 'snake_legend', name: 'Snake Legend', icon: '🐍', condition: () => this.score >= 2000 }
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
        document.removeEventListener('keydown', this.keyHandler);
    }
}