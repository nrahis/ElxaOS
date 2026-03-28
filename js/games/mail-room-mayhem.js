// =================================
// MAIL ROOM MAYHEM - ElxaCorp's Sorting Challenge!
// A fast-paced mail sorting game for ElxaOS with keyboard controls and Snakesian flavor
// =================================

class MailRoomMayhem {
    constructor(windowManager, gameData = {}) {
        this.windowManager = windowManager;
        this.gameData = gameData;

        // Game state
        this.gameActive = false;
        this.gameStarted = false;
        this.isGameOver = false;
        this.score = 0;
        this.lives = 5;
        this.currentLevel = 1;
        this.highScore = parseInt(localStorage.getItem('elxaOS-mrm-highscore') || '0');
        this.selectedMailIndex = -1;

        // Title/splash screen state
        this.showingTitle = true;
        this.showingSplash = false;
        this.splashTimer = null;
        this.loadingInterval = null;

        // Game elements
        this.gameLoopInterval = null;
        this.renderLoopInterval = null;
        this.specialEventInterval = null;

        // All bin definitions (canonical order)
        this.binDefinitions = [
            { name: "Executive", mdi: "mdi-office-building", color: "#D4A853" },
            { name: "Tech", mdi: "mdi-laptop", color: "#5B8DB8" },
            { name: "Snakesia", mdi: "mdi-snake", color: "#3D6B5E" },
            { name: "Recycle", mdi: "mdi-recycle", color: "#C25B3F" },
            { name: "Classified", mdi: "mdi-shield-lock", color: "#7B5EA7" },
            { name: "VIP", mdi: "mdi-crown", color: "#B8860B" },
            { name: "Return", mdi: "mdi-undo-variant", color: "#E67E22" }
        ];

        // Active bins (starts with first 4, grows via unlocks, reorders via swaps)
        this.activeBinCount = 4;
        this.mailDestinations = this.binDefinitions.slice(0, this.activeBinCount);

        // Swap system — predictable repeating pattern
        this.swapPattern = [
            [0, 1],  // Executive ↔ Tech
            [2, 3],  // Snakesia ↔ Recycle
            [1, 2],  // (whatever is in pos 1) ↔ (pos 2)
            [0, 3],  // (pos 0) ↔ (pos 3)
        ];
        this.nextSwapIndex = 0;
        
        // Mail generation
        this.mailQueue = [];
        this.maxMailOnScreen = 10;
        this.mailGenerationSpeed = 3500;
        this.maxMailGenerationSpeed = 1000;
        this.mailSpeedMultiplier = 0.7;
        
        // Snakesian mail content
        this.snakesianSenders = [
            "Mr. Snake-e", "Mrs. Snake-e", "Remi Marway", "Rita", 
            "ElxaCorp Legal", "Snakesia Gov", "ElxaBank", "Mystery Sender",
            "Agent Cobra", "Snake-e's Accountant", "Country Club", "??? Sender"
        ];
        this.mailSubjects = [
            "Quarterly Reports", "New Product Launch", "Minecraft Server Updates",
            "Garden Club Meeting", "TOP SECRET", "Pushing Cat Sighting",
            "ElxaPhone Specs", "Snakesian Currency Exchange", "Family Dinner Plans",
            "Agent Dossier", "Surveillance Report", "Boss's Lunch Order",
            "Country Club Dues", "Wrong Address", "Return Receipt", "EYES ONLY"
        ];

        // Special events
        this.pushingCatActive = false;
        this.pushingCatTimer = 0;
        this.pushingCatTimeout = null;
        this.priorityMailBonus = 25;

        // Background music
        this.backgroundMusic = null;
        this.musicPath = 'assets/games/mail-room-mayhem/chaoticperiods.wav';
        this.musicLoaded = false;
        this.musicEnabled = true;

        // Input handling
        this.titleKeyHandler = this.handleTitleKeyPress.bind(this);
        this.titleClickHandler = this.hideTitle.bind(this);
        this.splashKeyHandler = this.handleSplashKeyPress.bind(this);
        this.splashClickHandler = this.hideSplash.bind(this);
        this.gameKeyHandler = this.handleGameKeyPress.bind(this);

        this.windowId = null;
    }

    launch(programInfo) {
        const windowId = `mail-room-mayhem-${programInfo.id}-${Date.now()}`;
        this.windowId = windowId;
        const windowContent = this.createTitleScreen();

        this.windowManager.createWindow(
            windowId,
            `<span class="mrm-i mdi mdi-mailbox-open-outline"></span> ${programInfo.name}`,
            windowContent,
            { width: '650px', height: '650px', x: '150px', y: '50px' }
        );
        
        this.setupTitleEvents(windowId);
        this.initializeBackgroundMusic();
        
        if (elxaOS && elxaOS.eventBus) {
            elxaOS.eventBus.on('window.closed', (data) => {
                if (data.id === windowId) {
                    this.destroy();
                }
            });
        }
        
        return windowId;
    }

    // ============================
    // TITLE SCREEN
    // ============================

    createTitleScreen() {
        return `
            <div class="mrm-title-container">
                <img src="assets/games/mail-room-mayhem/main.png" alt="Mail Room Mayhem" class="mrm-title-image" />
                <div class="mrm-title-prompt">Click or press any key to continue</div>
            </div>
        `;
    }

    setupTitleEvents(windowId) {
        const windowEl = document.getElementById(`window-${windowId}`);
        if (!windowEl) return;
        const container = windowEl.querySelector('.mrm-title-container');
        if (!container) return;
        document.addEventListener('keydown', this.titleKeyHandler);
        container.addEventListener('click', this.titleClickHandler);
    }

    handleTitleKeyPress(event) {
        if (this.showingTitle) {
            event.preventDefault();
            this.hideTitle();
        }
    }

    hideTitle() {
        if (!this.showingTitle) return;
        this.showingTitle = false;
        document.removeEventListener('keydown', this.titleKeyHandler);

        const windowEl = document.getElementById(`window-${this.windowId}`);
        if (!windowEl) return;
        const titleContainer = windowEl.querySelector('.mrm-title-container');
        if (titleContainer) titleContainer.removeEventListener('click', this.titleClickHandler);

        const windowContent = windowEl.querySelector('.window-content');
        if (windowContent) {
            windowContent.innerHTML = this.createSplashScreen();
            this.showingSplash = true;
            this.setupSplashEvents(this.windowId);
        }
    }

    // ============================
    // SPLASH / LOADING SCREEN
    // ============================

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
                        <div class="mrm-instruction-line"><span class="mrm-i mdi mdi-arrow-left-right"></span> Arrow Keys: Navigate Mail</div>
                        <div class="mrm-instruction-line"><span class="mrm-i mdi mdi-numeric"></span> 1-4 Number Keys: Sort to Bins</div>
                        <div class="mrm-instruction-line"><span class="mrm-i mdi mdi-hand-back-left"></span> SPACE: Grab/Drop Mail</div>
                        <div class="mrm-instruction-line"><span class="mrm-i mdi mdi-pause-circle-outline"></span> ESC/P: Pause Game</div>
                        <div class="mrm-instruction-line"><span class="mrm-i mdi mdi-exit-run"></span> Q: Quit Game</div>
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
        if (!windowEl) return;
        const container = windowEl.querySelector('.mrm-splash-container');
        if (!container) return;

        document.addEventListener('keydown', this.splashKeyHandler);
        container.addEventListener('click', this.splashClickHandler);
        this.startLoadingAnimation(container);

        this.splashTimer = setTimeout(() => {
            if (this.showingSplash) this.hideSplash();
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
        hintText.style.opacity = 1;

        this.loadingInterval = setInterval(() => {
            progress += Math.random() * 12 + 8;
            if (progress >= 100) {
                progress = 100;
                clearInterval(this.loadingInterval);
                this.loadingInterval = null;
                loadingText.textContent = messages[messages.length - 1];
            }
            loadingFill.style.width = `${progress}%`;
            if (progress < 100) {
                loadingText.textContent = messages[Math.floor((progress / 100) * (messages.length - 1))];
            }
        }, 400);
    }

    handleSplashKeyPress(event) {
        if (this.showingSplash && (event.code === 'Space' || event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            this.hideSplash();
        }
    }

    hideSplash() {
        if (!this.showingSplash) return;
        this.showingSplash = false;
        clearTimeout(this.splashTimer);
        if (this.loadingInterval) { clearInterval(this.loadingInterval); this.loadingInterval = null; }
        document.removeEventListener('keydown', this.splashKeyHandler);

        const windowEl = document.getElementById(`window-${this.windowId}`);
        if (!windowEl) return;
        const splashContainer = windowEl.querySelector('.mrm-splash-container');
        if (splashContainer) splashContainer.removeEventListener('click', this.splashClickHandler);

        const windowContent = windowEl.querySelector('.window-content');
        if (windowContent) {
            windowContent.innerHTML = this.createGameInterface();
            this.setupGameEvents(windowContent);
        }
    }

    // ============================
    // GAME INTERFACE
    // ============================

    createGameInterface() {
        return `
            <div class="mrm-game-container">
                <div class="mrm-header">
                    <div class="mrm-logo">
                        <span class="mrm-i mdi mdi-office-building"></span>
                        <span>ElxaCorp Mail Center</span>
                    </div>
                    <div class="mrm-stats">
                        <div class="mrm-stat"><span class="mrm-i mdi mdi-star"></span> <span id="mrm-score">0</span></div>
                        <div class="mrm-stat"><span class="mrm-i mdi mdi-heart"></span> <span id="mrm-lives">${this.lives}</span></div>
                        <div class="mrm-stat"><span class="mrm-i mdi mdi-signal-cellular-3"></span> <span id="mrm-level">1</span></div>
                        <div class="mrm-stat mrm-highscore"><span class="mrm-i mdi mdi-trophy"></span> <span id="mrm-current-high">${this.highScore}</span></div>
                    </div>
                </div>
                
                <div class="mrm-play-area">
                    <div id="mrm-mail-entry-zone" class="mrm-mail-entry-zone">
                        <div class="mrm-entry-text"><span class="mrm-i mdi mdi-mailbox-open-outline"></span> INCOMING SNAKESIAN MAIL <span class="mrm-i mdi mdi-mailbox-open-outline"></span></div>
                    </div>
                    <div id="mrm-mail-output" class="mrm-mail-output-area"></div>
                    <div id="mrm-pushing-cat" class="mrm-pushing-cat" style="display: none;">
                        <div class="mrm-cat-sprite"><span class="mrm-i mdi mdi-cat"></span></div>
                        <div class="mrm-cat-text">Pushing Cat is slowing down the mail! Click to shoo!</div>
                    </div>
                </div>
                
                <div class="mrm-controls-hint">
                    <span class="mrm-i mdi mdi-gamepad-variant"></span> ← → Navigate | <span id="mrm-sort-keys">1-${this.activeBinCount}</span> Sort | SPACE Grab | ESC Pause | M Music | Q Quit
                    <button class="mrm-music-toggle"><span class="mrm-i mdi mdi-volume-off"></span> Mute</button>
                </div>
                
                <div class="mrm-sorting-bins" data-bin-count="${this.activeBinCount}">
                    ${this.buildBinsHTML()}
                </div>
                
                <div id="mrm-game-over-screen" class="mrm-game-over-screen" style="display:none;">
                    <div class="mrm-overlay-content">
                        <h2><span class="mrm-i mdi mdi-office-building"></span> SHIFT COMPLETE! <span class="mrm-i mdi mdi-office-building"></span></h2>
                        <p>Your ElxaCorp Performance Review:</p>
                        <p>Mail Sorted: <span id="mrm-final-score">0</span> points</p>
                        <p>Personal Best: <span id="mrm-final-highscore">${this.highScore}</span> points</p>
                        <div id="mrm-performance-message" class="mrm-performance-msg"></div>
                        <div class="mrm-overlay-buttons">
                            <button id="mrm-restart-btn" class="mrm-button">Start New Shift</button>
                            <button id="mrm-reset-all-btn" class="mrm-button mrm-button-secondary">Reset High Score</button>
                        </div>
                    </div>
                </div>
                
                <div id="mrm-pause-overlay" class="mrm-pause-overlay" style="display:none;">
                    <div class="mrm-overlay-content">
                        <h2><span class="mrm-i mdi mdi-pause-circle-outline"></span> MAIL SORTING PAUSED</h2>
                        <p>Take a break, the mail will wait!</p>
                        <button id="mrm-resume-btn" class="mrm-button">Resume Sorting</button>
                    </div>
                </div>
            </div>
        `;
    }

    buildBinsHTML() {
        return this.mailDestinations.map((dest, index) => `
            <div class="mrm-bin" data-destination="${dest.name}" data-key="${index + 1}">
                <div class="mrm-bin-header">
                    <div class="mrm-bin-key">${index + 1}</div>
                    <div class="mrm-bin-icon"><span class="mrm-i mdi ${dest.mdi}"></span></div>
                </div>
                <div class="mrm-bin-label">${dest.name}</div>
                <div class="mrm-bin-indicator" style="background-color: ${dest.color}"></div>
            </div>
        `).join('');
    }

    renderBins() {
        const binsContainer = document.querySelector('.mrm-sorting-bins');
        if (!binsContainer) return;
        binsContainer.dataset.binCount = this.mailDestinations.length;
        binsContainer.innerHTML = this.buildBinsHTML();

        const sortKeysEl = document.getElementById('mrm-sort-keys');
        if (sortKeysEl) sortKeysEl.textContent = `1-${this.mailDestinations.length}`;
    }

    setupGameEvents(containerElement) {
        const gameContainer = containerElement.classList.contains('mrm-game-container')
            ? containerElement
            : containerElement.querySelector('.mrm-game-container');
        if (!gameContainer) return;

        // Bin clicks (delegated — survives re-renders)
        const binsContainer = gameContainer.querySelector('.mrm-sorting-bins');
        if (binsContainer) {
            binsContainer.addEventListener('click', (event) => {
                const binElement = event.target.closest('.mrm-bin');
                if (binElement && this.gameActive) {
                    this.handleSortAttempt(binElement.dataset.destination);
                }
            });
        }

        // Mail clicks — use data-id
        const mailArea = gameContainer.querySelector('#mrm-mail-output');
        if (mailArea) {
            mailArea.addEventListener('click', (event) => {
                const mailElement = event.target.closest('.mrm-mail-item');
                if (mailElement && this.gameActive) {
                    const mailIndex = this.mailQueue.findIndex(m => m.id === mailElement.dataset.id);
                    if (mailIndex !== -1) this.selectMailItem(mailIndex);
                }
            });
        }

        // Pushing Cat — only awards bonus on actual click
        const pushingCatEl = gameContainer.querySelector('#mrm-pushing-cat');
        if (pushingCatEl) {
            pushingCatEl.addEventListener('click', () => {
                if (this.pushingCatActive) this.dismissPushingCat(true);
            });
        }

        gameContainer.querySelector('#mrm-restart-btn')?.addEventListener('click', () => this.startGame());
        gameContainer.querySelector('#mrm-reset-all-btn')?.addEventListener('click', () => this.resetEverything());
        gameContainer.querySelector('#mrm-resume-btn')?.addEventListener('click', () => this.togglePause());
        gameContainer.querySelector('.mrm-music-toggle')?.addEventListener('click', () => this.toggleBackgroundMusic());

        document.addEventListener('keydown', this.gameKeyHandler);
        this.startGame();
    }

    // ============================
    // BACKGROUND MUSIC
    // ============================

    initializeBackgroundMusic() {
        try {
            this.backgroundMusic = new Audio(this.musicPath);
            this.backgroundMusic.loop = true;
            this.backgroundMusic.volume = 0.25;
            this.backgroundMusic.preload = 'auto';

            this.backgroundMusic.addEventListener('canplaythrough', () => {
                this.musicLoaded = true;
            });

            this.backgroundMusic.addEventListener('error', () => {
                this.musicLoaded = false;
                this.backgroundMusic = null;
            });
        } catch (error) {
            this.musicLoaded = false;
            this.backgroundMusic = null;
        }
    }

    playBackgroundMusic() {
        if (this.backgroundMusic && this.musicLoaded && this.musicEnabled) {
            try {
                const playPromise = this.backgroundMusic.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => {});
                }
            } catch (error) {}
        }
    }

    stopBackgroundMusic() {
        if (this.backgroundMusic && !this.backgroundMusic.paused) {
            try {
                this.backgroundMusic.pause();
                this.backgroundMusic.currentTime = 0;
            } catch (error) {}
        }
    }

    toggleBackgroundMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled && this.gameActive) {
            this.playBackgroundMusic();
        } else {
            this.stopBackgroundMusic();
        }
        this.updateMusicButton();
    }

    updateMusicButton() {
        const btn = document.querySelector('.mrm-music-toggle');
        if (btn) {
            btn.innerHTML = this.musicEnabled
                ? '<span class="mrm-i mdi mdi-volume-off"></span> Mute'
                : '<span class="mrm-i mdi mdi-music"></span> Music';
        }
    }

    // ============================
    // INPUT HANDLING
    // ============================

    handleGameKeyPress(event) {
        if (!this.gameStarted || this.showingSplash || this.showingTitle) return;
        const key = event.key.toLowerCase();
        
        if ((key === 'escape' || key === 'p') && !this.isGameOver) {
            event.preventDefault();
            this.togglePause();
            return;
        }
        if (key === 'q' && this.gameActive) {
            event.preventDefault();
            this.gameOver();
            return;
        }
        if (key === 'm') {
            event.preventDefault();
            this.toggleBackgroundMusic();
            return;
        }
        if (!this.gameActive) return;

        if (key === 'arrowleft') { event.preventDefault(); this.navigateMail(-1); }
        else if (key === 'arrowright') { event.preventDefault(); this.navigateMail(1); }
        else if (key === ' ' || key === 'spacebar') { event.preventDefault(); this.toggleMailGrab(); }
        else {
            const keyNum = parseInt(key);
            if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= this.mailDestinations.length) {
                event.preventDefault();
                this.handleSortAttempt(this.mailDestinations[keyNum - 1].name);
            }
        }
    }

    navigateMail(direction) {
        if (this.mailQueue.length === 0) return;
        const newIndex = this.selectedMailIndex + direction;
        if (newIndex >= 0 && newIndex < this.mailQueue.length) this.selectMailItem(newIndex);
        else if (direction > 0) this.selectMailItem(0);
        else this.selectMailItem(this.mailQueue.length - 1);
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
        if (this.selectedMailIndex >= 0 && this.selectedMailIndex < this.mailQueue.length) {
            this.mailQueue[this.selectedMailIndex].element.classList.remove('mrm-selected');
        }
        this.selectedMailIndex = index;
        this.mailQueue[index].element.classList.add('mrm-selected');
    }

    // ============================
    // GAME LOGIC
    // ============================

    startGame() {
        this.score = 0;
        this.lives = 5;
        this.currentLevel = 1;
        this.mailQueue = [];
        this.selectedMailIndex = -1;
        this.isGameOver = false;
        
        this.mailGenerationSpeed = 3500;
        this.mailSpeedMultiplier = 0.7;
        
        // Reset bins to original 4 in canonical order
        this.activeBinCount = 4;
        this.mailDestinations = this.binDefinitions.slice(0, this.activeBinCount);
        this.nextSwapIndex = 0;
        
        this.pushingCatActive = false;
        clearTimeout(this.pushingCatTimeout);
        if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);
        if (this.renderLoopInterval) clearInterval(this.renderLoopInterval);
        if (this.specialEventInterval) clearInterval(this.specialEventInterval);
        
        this.updateStatsDisplay();
        this.renderBins();

        const gameOverScreen = document.getElementById('mrm-game-over-screen');
        if (gameOverScreen) gameOverScreen.style.display = 'none';
        const pauseOverlay = document.getElementById('mrm-pause-overlay');
        if (pauseOverlay) pauseOverlay.style.display = 'none';
        const playArea = document.querySelector('.mrm-play-area');
        if (playArea) playArea.style.opacity = 1;
        const mailOutputArea = document.getElementById('mrm-mail-output');
        if (mailOutputArea) { mailOutputArea.innerHTML = ''; mailOutputArea.classList.remove('mrm-cat-slowdown-effect'); }
        const pushingCatEl = document.getElementById('mrm-pushing-cat');
        if (pushingCatEl) { pushingCatEl.style.display = 'none'; pushingCatEl.classList.remove('mrm-cat-active'); }

        this.gameActive = true;
        this.gameStarted = true;

        this.playBackgroundMusic();
        this.generateMail();
        this.gameLoopInterval = setInterval(() => this.gameLoop(), this.mailGenerationSpeed);
        this.renderLoopInterval = setInterval(() => this.renderMailMovement(), 40);
        this.specialEventInterval = setInterval(() => this.handleSpecialEvents(), 8000);
    }

    resetEverything() {
        this.highScore = 0;
        localStorage.removeItem('elxaOS-mrm-highscore');
        this.startGame();
    }

    gameLoop() { if (this.gameActive) this.generateMail(); }

    generateMail() {
        if (!this.gameActive || this.mailQueue.length >= this.maxMailOnScreen) return;
        const mailOutputArea = document.getElementById('mrm-mail-output');
        if (!mailOutputArea) return;

        const mailId = `mail-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const destination = this.mailDestinations[Math.floor(Math.random() * this.mailDestinations.length)].name;
        const mailType = Math.random() > 0.7 ? 'package' : 'letter';
        const isPriority = Math.random() < 0.15;
        const sender = this.snakesianSenders[Math.floor(Math.random() * this.snakesianSenders.length)];
        const subject = this.mailSubjects[Math.floor(Math.random() * this.mailSubjects.length)];

        const mailItemElement = document.createElement('div');
        mailItemElement.classList.add('mrm-mail-item');
        if (isPriority) mailItemElement.classList.add('mrm-priority');
        mailItemElement.dataset.id = mailId;
        mailItemElement.style.left = `${Math.random() * 70 + 15}%`;
        mailItemElement.style.top = `0px`;

        const typeClass = mailType === 'package' ? 'mrm-package' : 'mrm-letter';
        const iconClass = mailType === 'package' ? 'mdi-package-variant' : 'mdi-email-outline';
        mailItemElement.classList.add(typeClass);

        const toLabel = destination === 'Executive' ? 'Mr. Snake-e' : 
                        destination === 'VIP' ? 'Snake-e (Personal)' : destination;

        mailItemElement.innerHTML = `
            <div class="mrm-mail-icon"><span class="mrm-i mdi ${iconClass}"></span>${isPriority ? '<span class="mrm-i mdi mdi-lightning-bolt mrm-priority-icon"></span>' : ''}</div>
            <div class="mrm-mail-details">
                <div class="mrm-mail-to">To: ${toLabel}</div>
                <div class="mrm-mail-from">From: ${sender}</div>
                <div class="mrm-mail-subject">${subject}</div>
            </div>
            ${isPriority ? '<div class="mrm-priority-badge">PRIORITY</div>' : ''}
        `;

        const baseSpeed = 0.5 + (this.currentLevel * 0.1);
        const mailItem = {
            id: mailId, destination, type: mailType, isPriority, sender, subject,
            element: mailItemElement, posY: 0,
            speed: baseSpeed * this.mailSpeedMultiplier, grabbed: false
        };

        this.mailQueue.push(mailItem);
        mailOutputArea.appendChild(mailItemElement);
        if (this.selectedMailIndex === -1 && this.mailQueue.length === 1) this.selectMailItem(0);
    }

    renderMailMovement() {
        if (!this.gameActive) return;
        const mailOutputArea = document.getElementById('mrm-mail-output');
        if (!mailOutputArea) return;
        const playAreaHeight = mailOutputArea.clientHeight;

        for (let i = this.mailQueue.length - 1; i >= 0; i--) {
            const mail = this.mailQueue[i];
            if (!mail.grabbed) {
                mail.posY += mail.speed * (this.pushingCatActive ? 0.3 : 1);
                mail.element.style.top = `${mail.posY}px`;
            }
            if (mail.posY > playAreaHeight) {
                const wasSelected = (i === this.selectedMailIndex);
                if (i === this.selectedMailIndex) this.selectedMailIndex = -1;
                this.mailQueue.splice(i, 1);
                mail.element.remove();
                this.handleMissedMail();
                if (this.selectedMailIndex > i) this.selectedMailIndex--;
                if (wasSelected && this.mailQueue.length > 0) {
                    this.selectMailItem(Math.min(i, this.mailQueue.length - 1));
                }
            }
        }
    }

    updateMailVisual(mailItem) {
        mailItem.element.classList.toggle('mrm-grabbed', mailItem.grabbed);
    }

    handleSortAttempt(binDestination) {
        if (!this.gameActive) return;

        let mailToSort = null;
        let mailIndex = -1;

        // Grabbed mail first, then selected
        for (let i = 0; i < this.mailQueue.length; i++) {
            if (this.mailQueue[i].grabbed) { mailToSort = this.mailQueue[i]; mailIndex = i; break; }
        }
        if (!mailToSort && this.selectedMailIndex >= 0 && this.selectedMailIndex < this.mailQueue.length) {
            mailToSort = this.mailQueue[this.selectedMailIndex];
            mailIndex = this.selectedMailIndex;
        }
        if (!mailToSort) return;

        const isCorrect = mailToSort.destination === binDestination;

        if (isCorrect) {
            const pointsEarned = mailToSort.isPriority ? this.priorityMailBonus : 10;
            this.score += pointsEarned;
            this.flashBin(binDestination, 'correct');
            this.showFloatingPoints(pointsEarned, mailToSort.element);
        } else {
            this.lives -= 1;
            this.flashBin(binDestination, 'incorrect');
            if (this.lives <= 0) { this.gameOver(); return; }
        }

        // Remove sorted mail + smart re-selection
        const wasSelected = (mailIndex === this.selectedMailIndex);
        mailToSort.element.remove();
        this.mailQueue.splice(mailIndex, 1);
        if (wasSelected && this.mailQueue.length > 0) {
            this.selectMailItem(Math.min(mailIndex, this.mailQueue.length - 1));
        } else if (this.selectedMailIndex >= mailIndex) {
            this.selectedMailIndex = Math.max(-1, this.selectedMailIndex - 1);
        }

        this.updateStatsDisplay();

        // Level progression
        const levelThreshold = 80 + (this.currentLevel - 1) * 60;
        if (this.score >= levelThreshold) this.handleLevelUp();
    }

    // ============================
    // LEVEL PROGRESSION
    // ============================

    handleLevelUp() {
        this.currentLevel++;
        this.updateDifficulty();
        this.checkLevelEvents();

        clearInterval(this.gameLoopInterval);
        this.gameLoopInterval = setInterval(() => this.gameLoop(), this.mailGenerationSpeed);

        this.showLevelUp();
        this.updateStatsDisplay();
    }

    updateDifficulty() {
        const level = this.currentLevel;

        // No speed increase on event levels — breathing room for new bins and swaps
        const eventLevels = [10, 12, 15, 17, 20];
        if (eventLevels.includes(level)) return;
        if (level >= 22 && level % 2 === 0) return; // swap levels

        if (level <= 6) {
            switch(level) {
                case 2: this.mailGenerationSpeed = 3200; this.mailSpeedMultiplier = 0.8; break;
                case 3: this.mailGenerationSpeed = 2600; this.mailSpeedMultiplier = 1.0; break;
                case 4: this.mailGenerationSpeed = 2200; this.mailSpeedMultiplier = 1.2; break;
                case 5: this.mailGenerationSpeed = 1900; this.mailSpeedMultiplier = 1.4; break;
                case 6: this.mailGenerationSpeed = 1700; this.mailSpeedMultiplier = 1.6; break;
            }
        } else {
            this.mailGenerationSpeed = Math.max(1100, 1700 - (level - 6) * 40);
            this.mailSpeedMultiplier = Math.min(2.3, 1.6 + (level - 6) * 0.05);
        }
    }

    checkLevelEvents() {
        const level = this.currentLevel;

        // Bin unlocks
        if (level === 10 && this.activeBinCount < 5) {
            this.unlockBin(5, "CLASSIFIED bin now open!");
        } else if (level === 15 && this.activeBinCount < 6) {
            this.unlockBin(6, "VIP mail incoming — Mr. Snake-e's personal desk!");
        } else if (level === 20 && this.activeBinCount < 7) {
            this.unlockBin(7, "RETURN TO SENDER bin activated!");
        }

        // Bin swaps — fixed early levels, then every 2 after level 22
        if (level === 12 || level === 17 || (level >= 22 && level % 2 === 0)) {
            this.performSwap();
        }
    }

    unlockBin(newCount, message) {
        this.activeBinCount = newCount;
        this.mailDestinations = [...this.mailDestinations, this.binDefinitions[newCount - 1]];
        this.renderBins();
        this.showGameEvent('unlock', message);
    }

    performSwap() {
        const [a, b] = this.swapPattern[this.nextSwapIndex % this.swapPattern.length];

        if (a < this.mailDestinations.length && b < this.mailDestinations.length) {
            const nameA = this.mailDestinations[a].name;
            const nameB = this.mailDestinations[b].name;

            [this.mailDestinations[a], this.mailDestinations[b]] = 
                [this.mailDestinations[b], this.mailDestinations[a]];

            this.renderBins();
            this.showGameEvent('swap', `MAIL ROOM REORGANIZATION!\n${nameA} ↔ ${nameB}`);
        }

        this.nextSwapIndex++;
    }

    showLevelUp() {
        const notification = document.createElement('div');
        notification.classList.add('mrm-level-up');
        
        let msg = "";
        switch(this.currentLevel) {
            case 2: msg = "Speed picking up!"; break;
            case 3: msg = "Getting busy!"; break;
            case 4: msg = "ElxaCorp rush hour!"; break;
            case 5: msg = "Snakesian mail flood!"; break;
            case 6: msg = "Mr. Snake-e demands efficiency!"; break;
            case 10: msg = "New bin unlocked!"; break;
            case 12: msg = "Bins are shifting!"; break;
            case 15: msg = "VIP mail incoming!"; break;
            case 17: msg = "More reorganization!"; break;
            case 20: msg = "Full chaos mode!"; break;
            default: msg = `Level ${this.currentLevel} chaos!`; break;
        }
        
        notification.innerHTML = `
            <div class="mrm-level-up-text">LEVEL ${this.currentLevel}!</div>
            <div class="mrm-level-up-sub">${msg}</div>
        `;
        
        const gameContainer = document.querySelector('.mrm-game-container');
        if (gameContainer) {
            gameContainer.appendChild(notification);
            setTimeout(() => notification.remove(), 2500);
        }
    }

    showGameEvent(type, message) {
        const notification = document.createElement('div');
        notification.classList.add('mrm-game-event');
        notification.classList.add(type === 'unlock' ? 'mrm-event-unlock' : 'mrm-event-swap');

        const icon = type === 'unlock' ? 'mdi-lock-open-variant' : 'mdi-swap-horizontal';
        notification.innerHTML = `
            <div class="mrm-event-icon"><span class="mrm-i mdi ${icon}"></span></div>
            <div class="mrm-event-text">${message}</div>
        `;

        const gameContainer = document.querySelector('.mrm-game-container');
        if (gameContainer) {
            gameContainer.appendChild(notification);
            setTimeout(() => notification.remove(), 3500);
        }
    }

    showFloatingPoints(points, element) {
        const fp = document.createElement('div');
        fp.classList.add('mrm-floating-points');
        fp.textContent = `+${points}`;
        fp.style.left = element.style.left;
        fp.style.top = element.style.top;
        const mailArea = document.getElementById('mrm-mail-output');
        if (mailArea) { mailArea.appendChild(fp); setTimeout(() => fp.remove(), 1000); }
    }

    // ============================
    // SPECIAL EVENTS
    // ============================

    handleSpecialEvents() {
        if (!this.gameActive || Math.random() < 0.7) return;
        this.triggerPushingCatEvent();
    }

    triggerPushingCatEvent() {
        this.pushingCatActive = true;
        const pushingCatEl = document.getElementById('mrm-pushing-cat');
        const mailArea = document.getElementById('mrm-mail-output');
        if (pushingCatEl) { pushingCatEl.style.display = 'block'; pushingCatEl.classList.add('mrm-cat-active'); }
        if (mailArea) mailArea.classList.add('mrm-cat-slowdown-effect');
        this.pushingCatTimeout = setTimeout(() => this.dismissPushingCat(false), 4000);
    }

    dismissPushingCat(clickedByUser = false) {
        if (!this.pushingCatActive) return;
        this.pushingCatActive = false;
        clearTimeout(this.pushingCatTimeout);
        
        const pushingCatEl = document.getElementById('mrm-pushing-cat');
        const mailArea = document.getElementById('mrm-mail-output');
        if (pushingCatEl) { pushingCatEl.style.display = 'none'; pushingCatEl.classList.remove('mrm-cat-active'); }
        if (mailArea) mailArea.classList.remove('mrm-cat-slowdown-effect');

        if (clickedByUser && this.gameActive) {
            this.score += 5;
            this.updateStatsDisplay();
            if (pushingCatEl) this.showFloatingPoints(5, pushingCatEl);
        }
    }

    // ============================
    // UI HELPERS
    // ============================

    flashBin(destination, type) {
        document.querySelectorAll('.mrm-bin').forEach(bin => {
            if (bin.dataset.destination === destination) {
                bin.classList.add(type === 'correct' ? 'mrm-flash-correct' : 'mrm-flash-incorrect');
                setTimeout(() => bin.classList.remove('mrm-flash-correct', 'mrm-flash-incorrect'), 400);
            }
        });
    }

    handleMissedMail() {
        if (!this.gameActive) return;
        this.lives -= 1;
        this.updateStatsDisplay();
        if (this.lives <= 0) this.gameOver();
    }

    updateStatsDisplay() {
        const s = id => document.getElementById(id);
        const scoreEl = s('mrm-score'), livesEl = s('mrm-lives'), levelEl = s('mrm-level'), highEl = s('mrm-current-high');
        if (scoreEl) scoreEl.textContent = this.score;
        if (livesEl) livesEl.textContent = this.lives;
        if (levelEl) levelEl.textContent = this.currentLevel;
        if (highEl) highEl.textContent = this.highScore;
    }

    gameOver() {
        this.gameActive = false;
        this.isGameOver = true;
        let isNewHighScore = false;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('elxaOS-mrm-highscore', this.highScore.toString());
            isNewHighScore = true;
        }

        const s = id => document.getElementById(id);
        const finalScoreEl = s('mrm-final-score');
        const finalHighEl = s('mrm-final-highscore');
        const perfEl = s('mrm-performance-message');
        const gameOverScreen = s('mrm-game-over-screen');
        
        if (finalScoreEl) finalScoreEl.textContent = this.score;
        if (finalHighEl) finalHighEl.textContent = this.highScore;
        
        if (perfEl) {
            let message = "";
            if (isNewHighScore) message = "NEW ELXACORP RECORD! Mr. Snake-e is impressed!";
            else if (this.score >= 1200) message = "Legendary! You survived the full mail room gauntlet!";
            else if (this.score >= 800) message = "Outstanding! Senior Mail Clerk material!";
            else if (this.score >= 500) message = "Excellent work! You're ElxaCorp management material!";
            else if (this.score >= 200) message = "Good job! Your Snakesian mail sorting skills are improving!";
            else if (this.score >= 50) message = "Not bad for a rookie sorter. Keep practicing!";
            else message = "Even Pushing Cat could sort better than that!";
            perfEl.textContent = message;
        }
        
        this.stopBackgroundMusic();

        if (gameOverScreen) gameOverScreen.style.display = 'flex';
        const playArea = document.querySelector('.mrm-play-area');
        if (playArea) playArea.style.opacity = 0.3;

        clearInterval(this.gameLoopInterval);
        clearInterval(this.renderLoopInterval);
        clearInterval(this.specialEventInterval);
    }
    
    pauseBackgroundMusic() {
        if (this.backgroundMusic && !this.backgroundMusic.paused) {
            try { this.backgroundMusic.pause(); } catch (e) {}
        }
    }

    resumeBackgroundMusic() {
        if (this.backgroundMusic && this.musicLoaded && this.musicEnabled) {
            try {
                const p = this.backgroundMusic.play();
                if (p !== undefined) p.catch(() => {});
            } catch (e) {}
        }
    }

    togglePause() {
        if (!this.gameStarted || this.showingSplash || this.isGameOver) return;
        const pauseOverlay = document.getElementById('mrm-pause-overlay');

        if (this.gameActive) {
            this.gameActive = false;
            this.pauseBackgroundMusic();
            if (pauseOverlay) pauseOverlay.style.display = 'flex';
            clearInterval(this.gameLoopInterval);
            clearInterval(this.renderLoopInterval);
            clearInterval(this.specialEventInterval);
        } else {
            this.gameActive = true;
            this.resumeBackgroundMusic();
            if (pauseOverlay) pauseOverlay.style.display = 'none';
            this.gameLoopInterval = setInterval(() => this.gameLoop(), this.mailGenerationSpeed);
            this.renderLoopInterval = setInterval(() => this.renderMailMovement(), 40);
            this.specialEventInterval = setInterval(() => this.handleSpecialEvents(), 8000);
        }
    }

    // ============================
    // CLEANUP
    // ============================

    cleanup() {
        clearInterval(this.gameLoopInterval);
        clearInterval(this.renderLoopInterval);
        clearInterval(this.specialEventInterval);
        clearTimeout(this.pushingCatTimeout);
        if (this.loadingInterval) clearInterval(this.loadingInterval);
        this.stopBackgroundMusic();
        this.gameLoopInterval = this.renderLoopInterval = this.specialEventInterval = this.pushingCatTimeout = this.loadingInterval = null;
        this.gameActive = false;
        this.gameStarted = false;
        if (this.gameKeyHandler) { document.removeEventListener('keydown', this.gameKeyHandler); this.gameKeyHandler = null; }
    }

    destroy() {
        this.cleanup();
        // Release audio resource
        if (this.backgroundMusic) {
            this.stopBackgroundMusic();
            this.backgroundMusic = null;
            this.musicLoaded = false;
        }
        clearTimeout(this.splashTimer);
        this.splashTimer = null;
        document.removeEventListener('keydown', this.titleKeyHandler);
        document.removeEventListener('keydown', this.splashKeyHandler);
        if (this.gameKeyHandler) { document.removeEventListener('keydown', this.gameKeyHandler); this.gameKeyHandler = null; }

        const windowEl = document.getElementById(`window-${this.windowId}`);
        if (windowEl) {
            windowEl.querySelector('.mrm-title-container')?.removeEventListener('click', this.titleClickHandler);
            windowEl.querySelector('.mrm-splash-container')?.removeEventListener('click', this.splashClickHandler);
        }
    }
}
