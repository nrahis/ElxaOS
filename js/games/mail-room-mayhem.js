// =================================
// MAIL ROOM MAYHEM - Enhanced ElxaCorp's Sorting Challenge!
// A fast-paced mail sorting game for ElxaOS with keyboard controls and Snakesian flavor
// =================================

class MailRoomMayhem {
    constructor(windowManager, gameData = {}) {
        this.windowManager = windowManager;
        this.gameData = gameData;

        // Game state
        this.gameActive = false;
        this.gameStarted = false;
        this.score = 0;
        this.lives = 5; // Increased starting lives
        this.currentLevel = 1;
        this.highScore = parseInt(localStorage.getItem('elxaOS-mrm-highscore') || '0');
        this.selectedMailIndex = -1; // Changed to index-based selection for keyboard nav

        // Splash screen state
        this.showingSplash = true;
        this.splashTimer = null;

        // Game elements
        this.gameLoopInterval = null;
        this.renderLoopInterval = null;
        this.specialEventInterval = null; // For Pushing Cat events

        // Mail items and destinations
        this.mailQueue = [];
        this.mailDestinations = [
            { name: "Executive", key: "1", icon: "🏢", color: "#FFD700" },
            { name: "Tech", key: "2", icon: "💻", color: "#00CED1" },
            { name: "Snakesia", key: "3", icon: "🐍", color: "#32CD32" },
            { name: "Recycle", key: "4", icon: "♻️", color: "#FF6347" }
        ];
        
        // Enhanced mail generation
        this.mailGenerationSpeed = 3500; // Start a bit faster than before
        this.maxMailGenerationSpeed = 1000; // Allow faster speeds
        this.mailSpeedMultiplier = 0.7; // Start slightly faster
        
        // Snakesian mail content
        this.snakesianSenders = [
            "Mr. Snake-e", "Mrs. Snake-e", "Remi Marway", "Rita", 
            "ElxaCorp Legal", "Snakesia Gov", "ElxaBank", "Mystery Sender"
        ];
        this.mailSubjects = [
            "Quarterly Reports", "New Product Launch", "Minecraft Server Updates",
            "Garden Club Meeting", "TOP SECRET", "Pushing Cat Sighting",
            "ElxaPhone Specs", "Snakesian Currency Exchange", "Family Dinner Plans"
        ];

        // Special events
        this.pushingCatActive = false;
        this.pushingCatTimer = 0;
        this.pushingCatTimeout = null; // For dismissing Pushing Cat
        this.priorityMailBonus = 25; // Bonus points for priority mail

        // Input handling
        this.splashKeyHandler = this.handleSplashKeyPress.bind(this);
        this.splashClickHandler = this.hideSplash.bind(this);
        this.gameKeyHandler = this.handleGameKeyPress.bind(this);

        this.windowId = null;
    }

    launch(programInfo) {
        const windowId = `mail-room-mayhem-${programInfo.id}-${Date.now()}`;
        this.windowId = windowId;
        const windowContent = this.createSplashScreen();

        this.windowManager.createWindow(
            windowId,
            `📬 ${programInfo.name}`,
            windowContent,
            { width: '650px', height: '650px', x: '150px', y: '50px' }
        );
        
        this.setupSplashEvents(windowId);
        
        // Listen for window close to cleanup properly
        if (elxaOS && elxaOS.eventBus) {
            elxaOS.eventBus.on('window.closed', (data) => {
                if (data.id === windowId) {
                    console.log('MailRoomMayhem: Window closed, cleaning up...');
                    this.destroy();
                }
            });
        }
        
        return windowId;
    }

    createSplashScreen() {
        return `
            <div class="mrm-splash-container">
                <div class="mrm-splash-content">
                    <div class="mrm-splash-logo">
                        <div class="mrm-logo-text">ElxaCorp</div>
                        <div class="mrm-logo-subtitle">Mail Room Division</div>
                    </div>
                    <div class="mrm-splash-title">MAIL ROOM MAYHEM</div>
                    <div class="mrm-splash-subtitle">Fast-Paced Sorting Challenge</div>
                    <div class="mrm-splash-loading">
                        <div class="mrm-loading-bar"><div class="mrm-loading-fill"></div></div>
                        <div class="mrm-loading-text">Initializing Mail Sorters...</div>
                    </div>
                    <div class="mrm-splash-instructions">
                        <div class="mrm-instruction-line"><strong>KEYBOARD-FRIENDLY CONTROLS:</strong></div>
                        <div class="mrm-instruction-line">← → Arrow Keys: Navigate Mail</div>
                        <div class="mrm-instruction-line">1-4 Number Keys: Sort to Bins</div>
                        <div class="mrm-instruction-line">SPACE: Grab/Drop Mail</div>
                        <div class="mrm-instruction-line">ESC/P: Pause Game</div>
                        <div class="mrm-instruction-line">Q: Quit Game</div>
                        <div class="mrm-instruction-line"><em>Save your hand - minimal clicking required!</em></div>
                    </div>
                    <div class="mrm-splash-footer">
                        <div class="mrm-splash-copyright">© 2024 ElxaCorp Mail Division - Snakesia Branch</div>
                        <div class="mrm-splash-hint">Press SPACE or click to start sorting!</div>
                    </div>
                </div>
            </div>
        `;
    }

    setupSplashEvents(windowId) {
        const windowEl = document.getElementById(`window-${windowId}`);
        if (!windowEl) {
            console.warn("MailRoomMayhem: Splash screen window element not found!");
            return;
        }
        
        const container = windowEl.querySelector('.mrm-splash-container');
        if (!container) {
            console.warn("MailRoomMayhem: Splash container not found!");
            return;
        }

        // Add event listeners
        document.addEventListener('keydown', this.splashKeyHandler);
        container.addEventListener('click', this.splashClickHandler);

        console.log("MailRoomMayhem: Splash events set up successfully");

        this.startLoadingAnimation(container);

        // Auto-hide after 6 seconds
        this.splashTimer = setTimeout(() => {
            if (this.showingSplash) {
                console.log("MailRoomMayhem: Auto-hiding splash screen");
                this.hideSplash();
            }
        }, 6000);
    }

    startLoadingAnimation(container) {
        const loadingFill = container.querySelector('.mrm-loading-fill');
        const loadingText = container.querySelector('.mrm-loading-text');
        const hintText = container.querySelector('.mrm-splash-hint');
        if (!loadingFill || !loadingText || !hintText) return;

        let progress = 0;
        const messages = [
            "Connecting to ElxaCorp Network...", 
            "Loading Snakesian Mail Protocols...", 
            "Calibrating Sorting Equipment...", 
            "Checking for Pushing Cat Interference...", 
            "Ready for Mail Sorting Duty!"
        ];
        
        // Make hint visible immediately so users know they can skip
        hintText.style.opacity = 1;

        const interval = setInterval(() => {
            progress += Math.random() * 12 + 8;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                loadingText.textContent = messages[messages.length - 1];
            }
            loadingFill.style.width = `${progress}%`;
            if (progress < 100) {
                loadingText.textContent = messages[Math.floor((progress / 100) * (messages.length - 1))];
            }
        }, 400);
    }

    handleSplashKeyPress(event) {
        console.log("MailRoomMayhem: Key pressed on splash:", event.key, event.code, "showingSplash:", this.showingSplash);
        if (this.showingSplash && (event.code === 'Space' || event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            console.log("MailRoomMayhem: Hiding splash due to key press");
            this.hideSplash();
        }
    }

    hideSplash() {
        console.log("MailRoomMayhem: hideSplash called, showingSplash:", this.showingSplash);
        if (!this.showingSplash) return;
        
        this.showingSplash = false;
        clearTimeout(this.splashTimer);
        document.removeEventListener('keydown', this.splashKeyHandler);

        const windowEl = document.getElementById(`window-${this.windowId}`);
        if (!windowEl) {
            console.warn("MailRoomMayhem: Window element not found for hiding splash.");
            return;
        }
        
        // Debug: log the window structure
        console.log("MailRoomMayhem: Window element structure:", windowEl.outerHTML.substring(0, 200) + "...");
        console.log("MailRoomMayhem: Looking for .window-body...");
        
        const splashContainer = windowEl.querySelector('.mrm-splash-container');
        if (splashContainer) {
            splashContainer.removeEventListener('click', this.splashClickHandler);
        }

        const windowBody = windowEl.querySelector('.window-body');
        if (windowBody) {
            console.log("MailRoomMayhem: Found .window-body, replacing splash with game interface");
            windowBody.innerHTML = this.createGameInterface();
            this.setupGameEvents(windowBody);
        } else {
            console.warn("MailRoomMayhem: Could not find .window-body, trying fallback approach");
            // Fallback: try to replace the splash container directly
            if (splashContainer) {
                console.log("MailRoomMayhem: Using fallback - replacing splash container directly");
                splashContainer.outerHTML = this.createGameInterface();
                // Try to find the new game container for event setup
                const gameContainer = windowEl.querySelector('.mrm-game-container');
                if (gameContainer) {
                    this.setupGameEvents(gameContainer);
                } else {
                    console.error("MailRoomMayhem: Fallback failed - could not find game container after replacement");
                }
            } else {
                console.error("MailRoomMayhem: No fallback available - splash container not found");
            }
        }
    }

    createGameInterface() {
        return `
            <div class="mrm-game-container">
                <div class="mrm-header">
                    <div class="mrm-logo">
                        <div class="mrm-logo-icon">🏢</div>
                        <span>ElxaCorp Mail Center</span>
                    </div>
                    <div class="mrm-stats">
                        <div>Score: <span id="mrm-score">0</span></div>
                        <div>Lives: <span id="mrm-lives">${this.lives}</span></div>
                        <div>Level: <span id="mrm-level">1</span></div>
                        <div class="mrm-highscore">Best: <span id="mrm-current-high">${this.highScore}</span></div>
                    </div>
                </div>
                
                <div class="mrm-play-area">
                    <div id="mrm-mail-entry-zone" class="mrm-mail-entry-zone">
                        <div class="mrm-entry-text">📬 INCOMING SNAKESIAN MAIL 📬</div>
                        <div class="mrm-entry-chute"></div>
                    </div>
                    <div id="mrm-mail-output" class="mrm-mail-output-area">
                        <!-- Mail items will be dynamically added here -->
                    </div>
                    <div id="mrm-pushing-cat" class="mrm-pushing-cat" style="display: none;">
                        <div class="mrm-cat-sprite">🐱</div>
                        <div class="mrm-cat-text">Pushing Cat is slowing down the mail! Click him to shoo him away!</div>
                    </div>
                </div>
                
                <div class="mrm-controls-hint">
                    <div>🎮 KEYBOARD FRIENDLY: ← → Navigate | 1-4 Sort | SPACE Grab | ESC/P Pause | Q Quit</div>
                </div>
                
                <div class="mrm-sorting-bins">
                    ${this.mailDestinations.map((dest, index) => `
                        <div class="mrm-bin" data-destination="${dest.name}" data-key="${dest.key}">
                            <div class="mrm-bin-header">
                                <div class="mrm-bin-key">[${dest.key}]</div>
                                <div class="mrm-bin-icon">${dest.icon}</div>
                            </div>
                            <div class="mrm-bin-label">${dest.name}</div>
                            <div class="mrm-bin-indicator" style="background-color: ${dest.color}"></div>
                        </div>
                    `).join('')}
                </div>
                
                <div id="mrm-game-over-screen" class="mrm-game-over-screen" style="display:none;">
                    <div class="mrm-overlay-content">
                        <h2>🏢 SHIFT COMPLETE! 🏢</h2>
                        <p>Your ElxaCorp Performance Review:</p>
                        <p>Mail Sorted: <span id="mrm-final-score">0</span> points</p>
                        <p>Personal Best: <span id="mrm-final-highscore">${this.highScore}</span> points</p>
                        <div id="mrm-performance-message" class="mrm-performance-msg"></div>
                        <button id="mrm-restart-btn" class="mrm-button">Start New Shift</button>
                        <button id="mrm-reset-all-btn" class="mrm-button mrm-button-secondary">Reset Everything</button>
                    </div>
                </div>
                
                <div id="mrm-pause-overlay" class="mrm-pause-overlay" style="display:none;">
                    <div class="mrm-overlay-content">
                        <h2>⏸️ MAIL SORTING PAUSED ⏸️</h2>
                        <p>Take a break, the mail will wait!</p>
                        <button id="mrm-resume-btn" class="mrm-button">Resume Sorting</button>
                    </div>
                </div>
            </div>
        `;
    }

    setupGameEvents(containerElement) {
        const gameContainer = containerElement.classList.contains('mrm-game-container')
            ? containerElement
            : containerElement.querySelector('.mrm-game-container');

        if (!gameContainer) return;

        // Bin click handlers (still support mouse)
        const binsContainer = gameContainer.querySelector('.mrm-sorting-bins');
        if (binsContainer) {
            binsContainer.addEventListener('click', (event) => {
                const binElement = event.target.closest('.mrm-bin');
                if (binElement && this.gameActive) {
                    const destination = binElement.dataset.destination;
                    this.handleSortAttempt(destination);
                }
            });
        }

        // Mail click handlers (still support mouse selection)
        const mailArea = gameContainer.querySelector('#mrm-mail-output');
        if (mailArea) {
            mailArea.addEventListener('click', (event) => {
                const mailElement = event.target.closest('.mrm-mail-item');
                if (mailElement && this.gameActive) {
                    const mailIndex = Array.from(mailArea.children).indexOf(mailElement);
                    this.selectMailItem(mailIndex);
                }
            });
        }

        // Pushing Cat click handler
        const pushingCatEl = gameContainer.querySelector('#mrm-pushing-cat');
        if (pushingCatEl) {
            pushingCatEl.addEventListener('click', () => {
                if (this.pushingCatActive) {
                    this.dismissPushingCat();
                }
            });
        }
        const restartButton = gameContainer.querySelector('#mrm-restart-btn');
        if (restartButton) {
            restartButton.addEventListener('click', () => this.startGame());
        }

        const resumeButton = gameContainer.querySelector('#mrm-resume-btn');
        if (resumeButton) {
            resumeButton.addEventListener('click', () => this.togglePause());
        }

        // Keyboard handler
        document.addEventListener('keydown', this.gameKeyHandler);

        this.startGame();
    }

    handleGameKeyPress(event) {
        if (!this.gameStarted || this.showingSplash) return;

        const key = event.key.toLowerCase();
        
        // Pause functionality
        if (key === 'escape' || key === 'p') {
            event.preventDefault();
            this.togglePause();
            return;
        }

        // Quit game (Q key)
        if (key === 'q' && this.gameActive) {
            event.preventDefault();
            this.gameOver();
            return;
        }

        if (!this.gameActive) return; // Don't handle other keys if paused

        // Navigation keys
        if (key === 'arrowleft') {
            event.preventDefault();
            this.navigateMail(-1);
        } else if (key === 'arrowright') {
            event.preventDefault();
            this.navigateMail(1);
        }
        
        // Grab/drop mail
        else if (key === ' ' || key === 'spacebar') {
            event.preventDefault();
            this.toggleMailGrab();
        }
        
        // Sorting keys (1-4)
        else if (key >= '1' && key <= '4') {
            event.preventDefault();
            const destIndex = parseInt(key) - 1;
            if (destIndex < this.mailDestinations.length) {
                this.handleSortAttempt(this.mailDestinations[destIndex].name);
            }
        }
    }

    navigateMail(direction) {
        if (this.mailQueue.length === 0) return;

        const newIndex = this.selectedMailIndex + direction;
        if (newIndex >= 0 && newIndex < this.mailQueue.length) {
            this.selectMailItem(newIndex);
        } else if (direction > 0 && this.selectedMailIndex >= this.mailQueue.length - 1) {
            this.selectMailItem(0); // Wrap to first
        } else if (direction < 0 && this.selectedMailIndex <= 0) {
            this.selectMailItem(this.mailQueue.length - 1); // Wrap to last
        }
    }

    toggleMailGrab() {
        if (this.selectedMailIndex >= 0 && this.selectedMailIndex < this.mailQueue.length) {
            const mailItem = this.mailQueue[this.selectedMailIndex];
            mailItem.grabbed = !mailItem.grabbed;
            this.updateMailVisual(mailItem);
        }
    }

    selectMailItem(index) {
        if (index < 0 || index >= this.mailQueue.length) return;

        // Clear previous selection
        if (this.selectedMailIndex >= 0 && this.selectedMailIndex < this.mailQueue.length) {
            const prevMail = this.mailQueue[this.selectedMailIndex];
            prevMail.element.classList.remove('mrm-selected');
        }

        // Set new selection
        this.selectedMailIndex = index;
        const mailItem = this.mailQueue[index];
        mailItem.element.classList.add('mrm-selected');
    }

    startGame() {
        // COMPLETE RESET of all game state
        this.score = 0;
        this.lives = 5;
        this.currentLevel = 1;
        this.mailQueue = [];
        this.selectedMailIndex = -1;
        
        // RESET all difficulty parameters to starting values
        this.mailGenerationSpeed = 3500; // Start a bit faster
        this.mailSpeedMultiplier = 0.7; // Start slightly faster  
        this.maxMailGenerationSpeed = 1000; // Allow faster speeds
        
        // RESET special events
        this.pushingCatActive = false;
        clearTimeout(this.pushingCatTimeout);
        
        // Clear any existing intervals to ensure clean state
        if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);
        if (this.renderLoopInterval) clearInterval(this.renderLoopInterval);
        if (this.specialEventInterval) clearInterval(this.specialEventInterval);
        
        this.updateStatsDisplay();

        // Hide overlays
        const gameOverScreen = document.getElementById('mrm-game-over-screen');
        if (gameOverScreen) gameOverScreen.style.display = 'none';
        
        const pauseOverlay = document.getElementById('mrm-pause-overlay');
        if (pauseOverlay) pauseOverlay.style.display = 'none';

        const playArea = document.querySelector('.mrm-play-area');
        if (playArea) playArea.style.opacity = 1;

        const mailOutputArea = document.getElementById('mrm-mail-output');
        if (mailOutputArea) {
            mailOutputArea.innerHTML = '';
            mailOutputArea.classList.remove('mrm-cat-slowdown-effect');
        }

        // Hide Pushing Cat if visible
        const pushingCatEl = document.getElementById('mrm-pushing-cat');
        if (pushingCatEl) {
            pushingCatEl.style.display = 'none';
            pushingCatEl.classList.remove('mrm-cat-active');
        }

        this.gameActive = true;
        this.gameStarted = true;

        // Start fresh game loops with reset speeds
        this.generateMail();
        this.gameLoopInterval = setInterval(() => this.gameLoop(), this.mailGenerationSpeed);
        this.renderLoopInterval = setInterval(() => this.renderMailMovement(), 40);
        this.specialEventInterval = setInterval(() => this.handleSpecialEvents(), 8000);
        
        console.log(`MailRoomMayhem: Game started fresh - Speed: ${this.mailGenerationSpeed}ms, Multiplier: ${this.mailSpeedMultiplier}`);
    }

    gameLoop() {
        if (!this.gameActive) return;
        this.generateMail();
        // Note: Difficulty scaling now only happens on actual level progression
    }

    generateMail() {
        if (!this.gameActive) return;

        const mailOutputArea = document.getElementById('mrm-mail-output');
        if (!mailOutputArea) return;

        const mailId = `mail-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        // Enhanced mail generation with Snakesian elements
        const destination = this.mailDestinations[Math.floor(Math.random() * this.mailDestinations.length)].name;
        const mailType = Math.random() > 0.7 ? 'package' : 'letter';
        const isPriority = Math.random() < 0.15; // 15% chance for priority mail
        const sender = this.snakesianSenders[Math.floor(Math.random() * this.snakesianSenders.length)];
        const subject = this.mailSubjects[Math.floor(Math.random() * this.mailSubjects.length)];

        const mailItemElement = document.createElement('div');
        mailItemElement.classList.add('mrm-mail-item');
        if (isPriority) mailItemElement.classList.add('mrm-priority');
        mailItemElement.dataset.id = mailId;

        // Position mail randomly across the top
        const randomLeftPercent = Math.random() * 70 + 15;
        mailItemElement.style.left = `${randomLeftPercent}%`;
        mailItemElement.style.top = `0px`;

        let emoji = '';
        let typeClass = '';
        if (mailType === 'package') {
            typeClass = 'mrm-package';
            emoji = isPriority ? '📦✨' : '📦';
        } else {
            typeClass = 'mrm-letter';
            emoji = isPriority ? '✉️⚡' : '✉️';
        }
        mailItemElement.classList.add(typeClass);

        mailItemElement.innerHTML = `
            <div class="mrm-mail-emoji">${emoji}</div>
            <div class="mrm-mail-details">
                <div class="mrm-mail-to">To: ${destination === 'Executive' ? 'Mr. Snake-e' : destination}</div>
                <div class="mrm-mail-from">From: ${sender}</div>
                <div class="mrm-mail-subject">${subject}</div>
            </div>
            ${isPriority ? '<div class="mrm-priority-badge">PRIORITY</div>' : ''}
        `;

        const baseSpeed = 0.5 + (this.currentLevel * 0.1); // Slower base speed
        const mailItem = {
            id: mailId,
            destination: destination,
            type: mailType,
            isPriority: isPriority,
            sender: sender,
            subject: subject,
            element: mailItemElement,
            posY: 0,
            speed: baseSpeed * this.mailSpeedMultiplier,
            grabbed: false
        };

        this.mailQueue.push(mailItem);
        mailOutputArea.appendChild(mailItemElement);
        
        // Auto-select first mail if none selected (keyboard-friendly!)
        if (this.selectedMailIndex === -1 && this.mailQueue.length === 1) {
            this.selectMailItem(0);
        }
    }

    renderMailMovement() {
        if (!this.gameActive) return;
        const mailOutputArea = document.getElementById('mrm-mail-output');
        if (!mailOutputArea) return;

        const playAreaHeight = mailOutputArea.clientHeight;

        for (let i = this.mailQueue.length - 1; i >= 0; i--) {
            const mail = this.mailQueue[i];
            
            // Don't move grabbed mail
            if (!mail.grabbed) {
                // Slower movement if Pushing Cat is active
                const speedModifier = this.pushingCatActive ? 0.3 : 1;
                mail.posY += mail.speed * speedModifier;
                mail.element.style.top = `${mail.posY}px`;
            }

            if (mail.posY > playAreaHeight) {
                // Mail fell off screen - handle cleanup and re-selection
                const wasSelected = (i === this.selectedMailIndex);
                
                if (i === this.selectedMailIndex) {
                    this.selectedMailIndex = -1;
                }
                
                this.mailQueue.splice(i, 1);
                mail.element.remove();
                this.handleMissedMail();
                
                // Adjust selected index if necessary
                if (this.selectedMailIndex > i) {
                    this.selectedMailIndex--;
                }
                
                // Auto-select next mail if we lost our selection (stay keyboard-friendly!)
                if (wasSelected && this.mailQueue.length > 0) {
                    const newIndex = Math.min(i, this.mailQueue.length - 1);
                    this.selectMailItem(newIndex);
                }
            }
        }
    }

    updateMailVisual(mailItem) {
        if (mailItem.grabbed) {
            mailItem.element.classList.add('mrm-grabbed');
        } else {
            mailItem.element.classList.remove('mrm-grabbed');
        }
    }

    handleSortAttempt(binDestination) {
        if (!this.gameActive) return;

        let mailToSort = null;
        let mailIndex = -1;

        // First, try to sort grabbed mail
        for (let i = 0; i < this.mailQueue.length; i++) {
            if (this.mailQueue[i].grabbed) {
                mailToSort = this.mailQueue[i];
                mailIndex = i;
                break;
            }
        }

        // If no grabbed mail, try selected mail
        if (!mailToSort && this.selectedMailIndex >= 0 && this.selectedMailIndex < this.mailQueue.length) {
            mailToSort = this.mailQueue[this.selectedMailIndex];
            mailIndex = this.selectedMailIndex;
        }

        if (!mailToSort) return;

        const isCorrect = mailToSort.destination === binDestination;
        let pointsEarned = 0;

        if (isCorrect) {
            pointsEarned = mailToSort.isPriority ? this.priorityMailBonus : 10;
            this.score += pointsEarned;
            this.flashBin(binDestination, 'correct');
            this.showFloatingPoints(pointsEarned, mailToSort.element);
        } else {
            this.lives -= 1;
            this.flashBin(binDestination, 'incorrect');
            if (this.lives <= 0) {
                this.gameOver();
                return;
            }
        }

        // Remove the sorted mail
        const wasSelected = (mailIndex === this.selectedMailIndex);
        mailToSort.element.remove();
        this.mailQueue.splice(mailIndex, 1);
        
        // Smart re-selection for keyboard users
        if (wasSelected && this.mailQueue.length > 0) {
            // Select the next mail in the same position, or the last one if we sorted the last mail
            const newIndex = Math.min(mailIndex, this.mailQueue.length - 1);
            this.selectMailItem(newIndex);
        } else if (this.selectedMailIndex >= mailIndex) {
            // Adjust selection index for other mail
            this.selectedMailIndex = Math.max(-1, this.selectedMailIndex - 1);
        }

        this.updateStatsDisplay();

        // Level progression - BIG jumps to make it exciting!
        const levelThreshold = 80 + (this.currentLevel - 1) * 60; // Faster leveling
        if (this.score >= levelThreshold) {
            const oldLevel = this.currentLevel;
            this.currentLevel++;
            
            // DRAMATIC difficulty increases - no tiny increments!
            switch(this.currentLevel) {
                case 2:
                    this.mailGenerationSpeed = 3200;
                    this.mailSpeedMultiplier = 0.8;
                    break;
                case 3:
                    this.mailGenerationSpeed = 2600;
                    this.mailSpeedMultiplier = 1.0;
                    break;
                case 4:
                    this.mailGenerationSpeed = 2200;
                    this.mailSpeedMultiplier = 1.2;
                    break;
                case 5:
                    this.mailGenerationSpeed = 1900;
                    this.mailSpeedMultiplier = 1.4;
                    break;
                case 6:
                    this.mailGenerationSpeed = 1700;
                    this.mailSpeedMultiplier = 1.6;
                    break;
                default:
                    // Level 7+ - keep it challenging but not impossible
                    this.mailGenerationSpeed = Math.max(1400, 1700 - (this.currentLevel - 6) * 50);
                    this.mailSpeedMultiplier = Math.min(2.0, 1.6 + (this.currentLevel - 6) * 0.1);
            }
            
            // Restart the generation interval with new speed
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = setInterval(() => this.gameLoop(), this.mailGenerationSpeed);
            
            console.log(`MailRoomMayhem: LEVEL UP! ${oldLevel} → ${this.currentLevel} | Speed: ${this.mailGenerationSpeed}ms | Multiplier: ${this.mailSpeedMultiplier}`);
            this.showLevelUp();
        }
    }

    showFloatingPoints(points, element) {
        const floatingPoints = document.createElement('div');
        floatingPoints.classList.add('mrm-floating-points');
        floatingPoints.textContent = `+${points}`;
        floatingPoints.style.left = element.style.left;
        floatingPoints.style.top = element.style.top;
        
        const mailArea = document.getElementById('mrm-mail-output');
        if (mailArea) {
            mailArea.appendChild(floatingPoints);
            setTimeout(() => floatingPoints.remove(), 1000);
        }
    }

    showLevelUp() {
        const levelUpNotification = document.createElement('div');
        levelUpNotification.classList.add('mrm-level-up');
        
        let difficultyMessage = "";
        switch(this.currentLevel) {
            case 2: difficultyMessage = "Speed picking up!"; break;
            case 3: difficultyMessage = "Getting busy!"; break;
            case 4: difficultyMessage = "ElxaCorp rush hour!"; break;
            case 5: difficultyMessage = "Snakesian mail flood!"; break;
            case 6: difficultyMessage = "Mr. Snake-e demands efficiency!"; break;
            default: difficultyMessage = `Level ${this.currentLevel} chaos!`; break;
        }
        
        levelUpNotification.innerHTML = `
            <div class="mrm-level-up-text">LEVEL ${this.currentLevel}!</div>
            <div class="mrm-level-up-sub">${difficultyMessage}</div>
        `;
        
        const gameContainer = document.querySelector('.mrm-game-container');
        if (gameContainer) {
            gameContainer.appendChild(levelUpNotification);
            setTimeout(() => levelUpNotification.remove(), 2500);
        }
    }

    handleSpecialEvents() {
        if (!this.gameActive || Math.random() < 0.7) return; // 30% chance

        this.triggerPushingCatEvent();
    }

    triggerPushingCatEvent() {
        this.pushingCatActive = true;
        const pushingCatEl = document.getElementById('mrm-pushing-cat');
        const mailArea = document.getElementById('mrm-mail-output');
        
        if (pushingCatEl) {
            pushingCatEl.style.display = 'block';
            pushingCatEl.classList.add('mrm-cat-active');
            pushingCatEl.style.cursor = 'pointer'; // Make it clear it's clickable
        }

        // Add visual effect to show mail is being slowed
        if (mailArea) {
            mailArea.classList.add('mrm-cat-slowdown-effect');
        }

        // Auto-dismiss after 4 seconds if not clicked
        this.pushingCatTimeout = setTimeout(() => {
            this.dismissPushingCat();
        }, 4000);
    }

    dismissPushingCat() {
        if (!this.pushingCatActive) return;
        
        this.pushingCatActive = false;
        clearTimeout(this.pushingCatTimeout);
        
        const pushingCatEl = document.getElementById('mrm-pushing-cat');
        const mailArea = document.getElementById('mrm-mail-output');
        
        if (pushingCatEl) {
            pushingCatEl.style.display = 'none';
            pushingCatEl.classList.remove('mrm-cat-active');
        }

        if (mailArea) {
            mailArea.classList.remove('mrm-cat-slowdown-effect');
        }

        // Give small bonus for clicking Pushing Cat away
        if (this.gameActive) {
            this.score += 5;
            this.updateStatsDisplay();
            
            // Show bonus points
            if (pushingCatEl) {
                this.showFloatingPoints(5, pushingCatEl);
            }
        }
    }

    flashBin(destination, type) {
        const bins = document.querySelectorAll('.mrm-bin');
        bins.forEach(bin => {
            if (bin.dataset.destination === destination) {
                bin.classList.add(type === 'correct' ? 'mrm-flash-correct' : 'mrm-flash-incorrect');
                setTimeout(() => {
                    bin.classList.remove('mrm-flash-correct', 'mrm-flash-incorrect');
                }, 400);
            }
        });
    }

    handleMissedMail() {
        if (!this.gameActive) return;
        this.lives -= 1;
        this.updateStatsDisplay();
        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    updateStatsDisplay() {
        const scoreEl = document.getElementById('mrm-score');
        const livesEl = document.getElementById('mrm-lives');
        const levelEl = document.getElementById('mrm-level');
        const highScoreEl = document.getElementById('mrm-current-high');

        if (scoreEl) scoreEl.textContent = this.score;
        if (livesEl) livesEl.textContent = this.lives;
        if (levelEl) levelEl.textContent = this.currentLevel;
        if (highScoreEl) highScoreEl.textContent = this.highScore; // Always show current high score
    }

    gameOver() {
        this.gameActive = false;
        let isNewHighScore = false;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('elxaOS-mrm-highscore', this.highScore.toString());
            isNewHighScore = true;
        }

        const finalScoreEl = document.getElementById('mrm-final-score');
        const finalHighscoreEl = document.getElementById('mrm-final-highscore');
        const performanceMessageEl = document.getElementById('mrm-performance-message');
        const gameOverScreen = document.getElementById('mrm-game-over-screen');
        
        if (finalScoreEl) finalScoreEl.textContent = this.score;
        if (finalHighscoreEl) finalHighscoreEl.textContent = this.highScore;
        
        // Performance message based on score
        if (performanceMessageEl) {
            let message = "";
            if (isNewHighScore) {
                message = "🎉 NEW ELXACORP RECORD! Mr. Snake-e is impressed! 🎉";
            } else if (this.score >= 500) {
                message = "Excellent work! You're ElxaCorp management material!";
            } else if (this.score >= 200) {
                message = "Good job! Your Snakesian mail sorting skills are improving!";
            } else if (this.score >= 50) {
                message = "Not bad for a rookie sorter. Keep practicing!";
            } else {
                message = "Even Pushing Cat could sort better than that!";
            }
            performanceMessageEl.textContent = message;
        }
        
        if (gameOverScreen) gameOverScreen.style.display = 'flex';

        const playArea = document.querySelector('.mrm-play-area');
        if (playArea) playArea.style.opacity = 0.3;

        clearInterval(this.gameLoopInterval);
        clearInterval(this.renderLoopInterval);
        clearInterval(this.specialEventInterval);
    }
    
    togglePause() {
        const pauseOverlay = document.getElementById('mrm-pause-overlay');
        if (!this.gameStarted || this.showingSplash) return;

        if (this.gameActive) {
            this.gameActive = false;
            if (pauseOverlay) pauseOverlay.style.display = 'flex';
            clearInterval(this.gameLoopInterval);
            clearInterval(this.renderLoopInterval);
            clearInterval(this.specialEventInterval);
        } else {
            this.gameActive = true;
            if (pauseOverlay) pauseOverlay.style.display = 'none';
            this.gameLoopInterval = setInterval(() => this.gameLoop(), this.mailGenerationSpeed);
            this.renderLoopInterval = setInterval(() => this.renderMailMovement(), 40);
            this.specialEventInterval = setInterval(() => this.handleSpecialEvents(), 8000);
        }
    }

    cleanup() {
        clearInterval(this.gameLoopInterval);
        clearInterval(this.renderLoopInterval);
        clearInterval(this.specialEventInterval);
        clearTimeout(this.pushingCatTimeout); // Clear Pushing Cat timeout
        this.gameLoopInterval = null;
        this.renderLoopInterval = null;
        this.specialEventInterval = null;
        this.pushingCatTimeout = null;

        this.gameActive = false;
        this.gameStarted = false;
        
        if (this.gameKeyHandler) {
            document.removeEventListener('keydown', this.gameKeyHandler);
            this.gameKeyHandler = null;
        }
    }

    destroy() {
        this.cleanup();
        clearTimeout(this.splashTimer);
        this.splashTimer = null;

        document.removeEventListener('keydown', this.splashKeyHandler);
        if (this.gameKeyHandler) {
            document.removeEventListener('keydown', this.gameKeyHandler);
            this.gameKeyHandler = null;
        }

        const windowEl = document.getElementById(`window-${this.windowId}`);
        if (windowEl) {
            const splashContainer = windowEl.querySelector('.mrm-splash-container');
            if (splashContainer) {
                splashContainer.removeEventListener('click', this.splashClickHandler);
            }
        }
    }
}