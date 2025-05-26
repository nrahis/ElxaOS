// =================================
// SUSSY CAT ADVENTURE - A silly stealth game for kids!
// Three levels of increasing sus-ness!
// =================================
class SussyCatGame {
    constructor(windowManager, gameData = {}) {
        this.windowManager = windowManager;
        this.gameData = gameData;
        this.score = 0;
        this.gameActive = false;
        this.isHiding = false;
        this.detectionLevel = 0;
        this.maxDetection = 100;
        this.currentRoom = 'living';
        this.currentLevel = 1;
        this.maxLevel = 3;
        
        // Level configurations
        this.levelConfig = {
            1: {
                name: "Quick Sus Mission",
                description: "Family going to the store",
                timeLimit: 120, // 2 minutes
                availableRooms: ['living', 'kitchen', 'bedroom'], // Added bedroom so hiding is available!
                detectionSpeed: 0.3, // Reduced so hiding isn't as necessary
                hideSpeed: 0.2,
                story: "The family just left for the store! Pushing Cat has a few minutes to be sus..."
            },
            2: {
                name: "Big Sus Adventure", 
                description: "Family going out to dinner",
                timeLimit: 100, // 1:40
                availableRooms: ['living', 'kitchen', 'bedroom'], // Same rooms but harder
                detectionSpeed: 0.7,
                hideSpeed: 0.25,
                story: "The family is going out to dinner! More time to be VERY sus, but they might check in..."
            },
            3: {
                name: "Ultimate Sus Challenge",
                description: "Family going on a day trip", 
                timeLimit: 90, // 1:30
                availableRooms: ['living', 'kitchen', 'bedroom', 'bathroom'], // All rooms
                detectionSpeed: 1.0,
                hideSpeed: 0.3,
                story: "The family is gone for the whole day! Time for Pushing Cat's ULTIMATE sus adventure!"
            }
        };
        
        // Game state
        this.catPosition = { x: 50, y: 50 };
        this.items = [];
        this.rooms = {
            living: { name: 'Living Room', items: ['🧦', '🍪', '📱', '🎮'] },
            kitchen: { name: 'Kitchen', items: ['🥄', '🍌', '🧄', '☕'] },
            bedroom: { name: 'Bedroom', items: ['👕', '📚', '🧸', '💤'] },
            bathroom: { name: 'Bathroom', items: ['🧻', '🧴', '🪥', '🛁'] }
        };
        
        this.collectedItems = 0;
        this.levelProgress = {
            1: { completed: false, score: 0, timeBonus: 0 },
            2: { completed: false, score: 0, timeBonus: 0 },
            3: { completed: false, score: 0, timeBonus: 0 }
        };
        
        // Movement and controls
        this.keys = {};
        this.setupKeyboardControls();
        
        // Image loading
        this.catImageLoaded = false;
        this.catImagePath = '../../assets/games/sussycat/pushing-cat.gif';
        this.logoImagePath = '../../assets/games/sussycat/ui/cat-logo.png';
    }

    launch(programInfo) {
        const windowId = `sussy-cat-${Date.now()}`;
        const windowContent = this.createGameInterface();
        
        const window = this.windowManager.createWindow(
            windowId,
            `${programInfo.name}`, // Removed emoji from title
            windowContent,
            { width: '600px', height: '500px', x: '150px', y: '100px' }
        );
        
        this.setupGameEvents(windowId);
        return windowId;
    }

    createGameInterface() {
        return `
            <div class="sussy-cat-container">
                <div class="sussy-cat-header">
                    <div class="sussy-cat-title">Sussy Cat Adventure!</div>
                    <div class="sussy-cat-stats">
                        <div class="sussy-level">Level: <span class="sussy-level-value">1</span></div>
                        <div class="sussy-score">Items: <span class="sussy-score-value">0/8</span></div>
                        <div class="sussy-timer">Time: <span class="sussy-timer-value">2:00</span></div>
                        <div class="sussy-detection">
                            <span class="sussy-detection-label">Sus Level:</span>
                            <div class="sussy-detection-bar">
                                <div class="sussy-detection-fill"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="sussy-cat-game-area">
                    <div class="sussy-cat-initial-screen">
                        <div class="sussy-initial-content">
                            <div class="sussy-initial-background"></div>
                            <div class="sussy-click-to-continue">Click anywhere to continue...</div>
                        </div>
                    </div>
                    
                    <div class="sussy-cat-start-screen" style="display: none;">
                        <div class="sussy-start-content">
                            <h2>Pushing Cat's Sus Adventures!</h2>
                            <div class="sussy-level-select">
                                <h3>Choose Your Sus Level:</h3>
                                <div class="sussy-level-buttons">
                                    <button class="sussy-level-btn" data-level="1">
                                        <div class="level-title">Level 1: Quick Sus Mission</div>
                                        <div class="level-desc">Family going to store (2 min)</div>
                                        <div class="level-rooms">Living + Kitchen + Bedroom</div>
                                    </button>
                                    <button class="sussy-level-btn" data-level="2">
                                        <div class="level-title">Level 2: Big Sus Adventure</div>
                                        <div class="level-desc">Family going to dinner (1:40)</div>
                                        <div class="level-rooms">Same rooms, more sus!</div>
                                    </button>
                                    <button class="sussy-level-btn" data-level="3">
                                        <div class="level-title">Level 3: Ultimate Sus Challenge</div>
                                        <div class="level-desc">Family gone all day! (1:30)</div>
                                        <div class="level-rooms">All rooms + Max Sus!</div>
                                    </button>
                                </div>
                            </div>
                            <div class="sussy-story">
                                <p><strong>The Sus Chronicles of Pushing Cat:</strong></p>
                                <p>Pushing Cat is the most sus little black cat in the house! When the family leaves, he gets up to ALL sorts of mischief. Help him collect sussy items from around the house, but don't get caught!</p>
                                <p><strong>How to Play:</strong></p>
                                <ul>
                                    <li>🎮 Use ARROW KEYS to move Pushing Cat</li>
                                    <li>🏠 Use SPACE to change rooms</li>
                                    <li>🕳️ Press H to hide in the Sussy Lair (bedroom only)!</li>
                                    <li>⚡ Collect items quickly but stay sneaky!</li>
                                    <li>👀 Higher levels = less time, more rooms, more sus!</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div class="sussy-cat-play-area" style="display: none;">
                        <div class="sussy-room-info">
                            <span class="sussy-current-room">Living Room</span>
                            <span class="sussy-room-hint">Press SPACE to change rooms • Press H to hide in bedroom</span>
                        </div>
                        
                        <div class="sussy-game-world">
                            <div class="sussy-room sussy-room-living active">
                                <div class="sussy-room-bg">🛋️</div>
                                <div class="sussy-cat-sprite">😼</div>
                            </div>
                            
                            <div class="sussy-room sussy-room-kitchen">
                                <div class="sussy-room-bg">🍳</div>
                                <div class="sussy-cat-sprite" style="display: none;">😼</div>
                            </div>
                            
                            <div class="sussy-room sussy-room-bedroom">
                                <div class="sussy-room-bg">🛏️</div>
                                <div class="sussy-cat-sprite" style="display: none;">😼</div>
                                <div class="sussy-lair-entrance">
                                    <div class="sussy-lair-icon">🕳️ Sussy Lair (Press H)</div>
                                </div>
                            </div>
                            
                            <div class="sussy-room sussy-room-bathroom">
                                <div class="sussy-room-bg">🚿</div>
                                <div class="sussy-cat-sprite" style="display: none;">😼</div>
                            </div>
                        </div>
                        
                        <div class="sussy-messages">
                            <div class="sussy-message">Choose a sus level to begin! 😈</div>
                        </div>
                    </div>
                    
                    <div class="sussy-cat-end-screen" style="display: none;">
                        <div class="sussy-end-content">
                            <div class="sussy-result-icon"></div>
                            <h2 class="sussy-result-title">Level Complete!</h2>
                            <div class="sussy-result-message">
                                <p>Pushing Cat completed <span class="sussy-level-name">Level 1</span>!</p>
                                <p>Items collected: <span class="sussy-final-score">0</span></p>
                                <p>Time bonus: <span class="sussy-time-bonus">0</span> points!</p>
                                <p class="sussy-result-flavor"></p>
                            </div>
                            <div class="sussy-level-progress">
                                <div class="progress-item" data-level="1">Level 1: ⭐</div>
                                <div class="progress-item" data-level="2">Level 2: ⭐</div>
                                <div class="progress-item" data-level="3">Level 3: ⭐</div>
                            </div>
                            <div class="sussy-end-buttons">
                                <button class="sussy-next-level-btn" style="display: none;">😈 Next Sus Level!</button>
                                <button class="sussy-play-again-btn">🔄 Choose Level</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupGameEvents(windowId) {
        const window = document.getElementById(`window-${windowId}`);
        const container = window.querySelector('.sussy-cat-container');
        
        const initialScreen = container.querySelector('.sussy-cat-initial-screen');
        const levelButtons = container.querySelectorAll('.sussy-level-btn');
        const playAgainBtn = container.querySelector('.sussy-play-again-btn');
        const nextLevelBtn = container.querySelector('.sussy-next-level-btn');

        // Initial screen click to continue
        initialScreen.addEventListener('click', () => {
            this.showStartScreen(container);
        });

        // Level selection
        levelButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const level = parseInt(btn.dataset.level);
                this.currentLevel = level;
                this.startGame(container);
            });
        });

        playAgainBtn.addEventListener('click', () => {
            this.resetGame(container);
        });

        nextLevelBtn.addEventListener('click', () => {
            if (this.currentLevel < this.maxLevel) {
                this.currentLevel++;
                this.startGame(container);
            } else {
                this.resetGame(container);
            }
        });

        // Store window reference for cleanup
        this.gameWindow = window;
        this.container = container;
    }

    // NEW METHOD: Show start screen (level selection)
    showStartScreen(container) {
        const initialScreen = container.querySelector('.sussy-cat-initial-screen');
        const startScreen = container.querySelector('.sussy-cat-start-screen');
        
        initialScreen.style.display = 'none';
        startScreen.style.display = 'block';
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameActive) return;
            
            this.keys[e.key] = true;
            
            // Handle immediate actions
            switch(e.key) {
                case ' ':
                    e.preventDefault();
                    this.changeRoom();
                    break;
                case 'h':
                case 'H':
                    this.toggleHiding();
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    // Setup cat image with fallback to emoji
    setupCatImage(catElement) {
        if (!catElement) return;
        
        // Try to load the cat image
        const img = new Image();
        
        img.onload = () => {
            // Image loaded successfully - apply it as background
            catElement.style.backgroundImage = `url('${this.catImagePath}')`;
            catElement.style.backgroundSize = 'contain';
            catElement.style.backgroundRepeat = 'no-repeat';
            catElement.style.backgroundPosition = 'center';
            catElement.classList.add('has-cat-image');
            catElement.textContent = ''; // Hide emoji text when image loads
            this.catImageLoaded = true;
            console.log('🐱 Cat image loaded successfully!');
        };
        
        img.onerror = () => {
            // Image failed to load - keep emoji
            catElement.style.backgroundImage = 'none';
            catElement.classList.remove('has-cat-image');
            catElement.textContent = '😼'; // Ensure emoji is shown
            this.catImageLoaded = false;
            console.log('😿 Cat image failed to load, using emoji fallback');
        };
        
        // Start loading the image
        img.src = this.catImagePath;
    }

    // Setup all cat sprites with images
    setupAllCatImages() {
        const allCatSprites = this.container.querySelectorAll('.sussy-cat-sprite');
        allCatSprites.forEach(catSprite => {
            this.setupCatImage(catSprite);
        });
    }

    startGame(container) {
        const startScreen = container.querySelector('.sussy-cat-start-screen');
        const playArea = container.querySelector('.sussy-cat-play-area');
        const endScreen = container.querySelector('.sussy-cat-end-screen');
        
        startScreen.style.display = 'none';
        endScreen.style.display = 'none';
        playArea.style.display = 'flex';
        
        // Get current level config
        const levelConfig = this.levelConfig[this.currentLevel];
        
        // Reset game state
        this.score = 0;
        this.collectedItems = 0;
        this.gameActive = true;
        this.timeLeft = levelConfig.timeLimit;
        this.detectionLevel = 0;
        this.isHiding = false;
        this.currentRoom = 'living';
        this.catPosition = { x: 50, y: 50 };
        
        // Calculate total items for available rooms
        this.totalItems = levelConfig.availableRooms.reduce((sum, roomId) => {
            return sum + this.rooms[roomId].items.length;
        }, 0);
        
        // FIXED: Setup rooms visibility without inline styles
        this.setupRoomsForLevel(container, levelConfig);
        
        // FIXED: Ensure proper room initialization
        this.initializeRoomDisplay(container);
        
        // Setup cat images for all sprites
        this.setupAllCatImages();
        
        // Generate items for available rooms only
        this.generateItems();
        
        // Update UI with level info
        this.updateUI();
        this.updateLevelDisplay();
        
        // Start game timer
        this.gameTimer = setInterval(() => {
            this.timeLeft--;
            this.updateTimer();
            
            if (this.timeLeft <= 0) {
                this.endGame('timeout');
            }
        }, 1000);
        
        // Start game loop
        this.gameLoop = setInterval(() => {
            this.update();
        }, 100);
        
        this.showMessage(`${levelConfig.story} Time to be sus! 😈`);
    }

    // FIXED: Room setup without conflicting inline styles
    setupRoomsForLevel(container, levelConfig) {
        // Instead of setting display styles, we'll use CSS classes
        const allRooms = ['living', 'kitchen', 'bedroom', 'bathroom'];
        
        allRooms.forEach(roomId => {
            const roomEl = container.querySelector(`.sussy-room-${roomId}`);
            if (levelConfig.availableRooms.includes(roomId)) {
                roomEl.classList.add('sussy-room-available');
                roomEl.classList.remove('sussy-room-unavailable');
            } else {
                roomEl.classList.add('sussy-room-unavailable');
                roomEl.classList.remove('sussy-room-available');
            }
        });
        
        // Update room hint based on available rooms
        const hintEl = container.querySelector('.sussy-room-hint');
        if (levelConfig.availableRooms.includes('bedroom')) {
            hintEl.textContent = 'Press SPACE to change rooms • Press H to hide in bedroom';
        } else {
            hintEl.textContent = 'Press SPACE to change rooms';
        }
    }

    // FIXED: New method to properly initialize room display
    initializeRoomDisplay(container) {
        // Clear all active states and hide all cats
        const allRooms = container.querySelectorAll('.sussy-room');
        allRooms.forEach(room => {
            room.classList.remove('active');
            const catInRoom = room.querySelector('.sussy-cat-sprite');
            if (catInRoom) {
                catInRoom.style.display = 'none';
            }
        });
        
        // Show current room and its cat
        const currentRoomEl = container.querySelector(`.sussy-room-${this.currentRoom}`);
        if (currentRoomEl) {
            currentRoomEl.classList.add('active');
            const currentCat = currentRoomEl.querySelector('.sussy-cat-sprite');
            if (currentCat) {
                currentCat.style.display = 'flex';
                currentCat.style.left = this.catPosition.x + 'px';
                currentCat.style.top = this.catPosition.y + 'px';
            }
        }
        
        // Update room name display
        const roomNameEl = container.querySelector('.sussy-current-room');
        if (roomNameEl) {
            roomNameEl.textContent = this.rooms[this.currentRoom].name;
            console.log(`🏠 Initial room set to: ${this.rooms[this.currentRoom].name}`);
        }
    }

    updateLevelDisplay() {
        const levelConfig = this.levelConfig[this.currentLevel];
        this.container.querySelector('.sussy-level-value').textContent = this.currentLevel;
        
        // Update timer display format
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.container.querySelector('.sussy-timer-value').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    generateItems() {
        this.items = [];
        const levelConfig = this.levelConfig[this.currentLevel];
        
        // Only generate items for available rooms
        levelConfig.availableRooms.forEach(roomId => {
            const roomData = this.rooms[roomId];
            roomData.items.forEach((item, index) => {
                this.items.push({
                    id: `${roomId}-${index}`,
                    room: roomId,
                    emoji: item,
                    x: 80 + (index * 80) + Math.random() * 40,
                    y: 80 + Math.random() * 120,
                    collected: false
                });
            });
        });
        
        console.log('🎮 Generated items:', this.items);
        this.renderItems();
    }

    renderItems() {
        // Clear existing items
        document.querySelectorAll('.sussy-item').forEach(item => item.remove());
        
        // Render items for current room
        const currentRoomEl = this.container.querySelector(`.sussy-room-${this.currentRoom}`);
        console.log('🏠 Current room element:', currentRoomEl);
        
        const roomItems = this.items.filter(item => item.room === this.currentRoom && !item.collected);
        console.log('📦 Items for current room:', roomItems);
        
        roomItems.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'sussy-item';
            itemEl.textContent = item.emoji;
            itemEl.style.left = item.x + 'px';
            itemEl.style.top = item.y + 'px';
            itemEl.dataset.itemId = item.id;
            itemEl.dataset.emoji = item.emoji;
            
            // Try to load item image (if available)
            this.setupItemImage(itemEl, item.emoji);
            
            console.log('✨ Creating item:', item.emoji, 'at', item.x, item.y);
            currentRoomEl.appendChild(itemEl);
        });
    }

    // Setup item images with fallback to emoji
    setupItemImage(itemElement, emoji) {
        // Map emoji to image filename
        const emojiToImage = {
            '🧦': 'sock.png',
            '🍪': 'cookie.png',
            '📱': 'phone.png',
            '🎮': 'gamepad.png',
            '🥄': 'spoon.png',
            '🍌': 'banana.png',
            '🧄': 'garlic.png',
            '☕': 'coffee.png',
            '👕': 'shirt.png',
            '📚': 'book.png',
            '🧸': 'teddy.png',
            '💤': 'sleep.png',
            '🧻': 'toilet-paper.png',
            '🧴': 'shampoo.png',
            '🪥': 'toothbrush.png',
            '🛁': 'bathtub.png'
        };

        const imageFile = emojiToImage[emoji];
        if (!imageFile) return; // No image mapping for this emoji
        
        const imagePath = `../../assets/games/sussycat/items/${imageFile}`;
        
        // Try to load the item image
        const img = new Image();
        
        img.onload = () => {
            // Image loaded successfully
            itemElement.style.backgroundImage = `url('${imagePath}')`;
            itemElement.style.backgroundSize = 'contain';
            itemElement.style.backgroundRepeat = 'no-repeat';
            itemElement.style.backgroundPosition = 'center';
            itemElement.style.backgroundColor = 'transparent';
            itemElement.style.border = 'none';
            itemElement.classList.add('has-image');
            itemElement.textContent = ''; // Hide emoji text when image loads
        };
        
        img.onerror = () => {
            // Image failed to load - keep emoji styling
            itemElement.style.backgroundImage = 'none';
            itemElement.classList.remove('has-image');
            // Keep emoji text visible
        };
        
        // Start loading the image
        img.src = imagePath;
    }

    update() {
        if (!this.gameActive || this.isHiding) return;
        
        // Movement
        const moveSpeed = 3;
        let moved = false;
        
        if (this.keys['ArrowUp'] && this.catPosition.y > 10) {
            this.catPosition.y -= moveSpeed;
            moved = true;
        }
        if (this.keys['ArrowDown'] && this.catPosition.y < 220) {
            this.catPosition.y += moveSpeed;
            moved = true;
        }
        if (this.keys['ArrowLeft'] && this.catPosition.x > 10) {
            this.catPosition.x -= moveSpeed;
            moved = true;
        }
        if (this.keys['ArrowRight'] && this.catPosition.x < 350) {
            this.catPosition.x += moveSpeed;
            moved = true;
        }
        
        if (moved) {
            this.updateCatPosition();
            this.checkItemCollision();
            
            // Increase detection when moving
            this.detectionLevel = Math.min(this.maxDetection, this.detectionLevel + 0.5);
        } else {
            // Decrease detection when still
            this.detectionLevel = Math.max(0, this.detectionLevel - 0.2);
        }
        
        this.updateDetectionBar();
        
        // Check for high detection warning
        if (this.detectionLevel > 80 && this.currentRoom === 'bedroom') {
            this.showMessage("You're being too sus! Hide in the Sussy Lair! (Press H)");
        } else if (this.detectionLevel > 90) {
            this.showMessage("VERY SUS! Find the bedroom and hide! 😱");
        }
    }

    updateCatPosition() {
        // Update cat sprite in current room only
        const currentRoom = this.container.querySelector(`.sussy-room-${this.currentRoom}`);
        const catSprite = currentRoom.querySelector('.sussy-cat-sprite');
        if (catSprite) {
            catSprite.style.left = this.catPosition.x + 'px';
            catSprite.style.top = this.catPosition.y + 'px';
            catSprite.style.display = 'flex'; // Make sure it's visible
        }
    }

    checkItemCollision() {
        const items = this.container.querySelectorAll('.sussy-item');
        const currentRoom = this.container.querySelector(`.sussy-room-${this.currentRoom}`);
        const catSprite = currentRoom.querySelector('.sussy-cat-sprite');
        
        if (!catSprite) return;
        
        items.forEach(itemEl => {
            const itemRect = itemEl.getBoundingClientRect();
            const catRect = catSprite.getBoundingClientRect();
            
            if (this.isColliding(catRect, itemRect)) {
                const itemId = itemEl.dataset.itemId;
                this.collectItem(itemId);
                itemEl.remove();
            }
        });
    }

    isColliding(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                rect1.left > rect2.right || 
                rect1.bottom < rect2.top || 
                rect1.top > rect2.bottom);
    }

    collectItem(itemId) {
        const item = this.items.find(i => i.id === itemId);
        if (item && !item.collected) {
            item.collected = true;
            this.collectedItems++;
            this.score += 10;
            
            const messages = [
                `Pushing Cat found a ${item.emoji}! So sus! 😈`,
                `Sussy item collected: ${item.emoji}! 😼`,
                `${item.emoji} obtained! Pushing Cat is pleased! 🎉`,
                `Very sus finding: ${item.emoji}! Keep going! 💫`
            ];
            
            this.showMessage(messages[Math.floor(Math.random() * messages.length)]);
            this.updateUI();
            
            // Check win condition
            if (this.collectedItems >= this.totalItems) {
                setTimeout(() => this.endGame('win'), 500);
            }
        }
    }

    // FIXED: Improved room changing logic
    changeRoom() {
        const levelConfig = this.levelConfig[this.currentLevel];
        const availableRooms = levelConfig.availableRooms;
        const currentIndex = availableRooms.indexOf(this.currentRoom);
        const nextIndex = (currentIndex + 1) % availableRooms.length;
        const newRoom = availableRooms[nextIndex];
        
        console.log(`🏠 Changing from ${this.currentRoom} to ${newRoom}`);
        
        // Hide current room and its cat sprite
        const currentRoomEl = this.container.querySelector(`.sussy-room-${this.currentRoom}`);
        if (currentRoomEl) {
            currentRoomEl.classList.remove('active');
            const currentCat = currentRoomEl.querySelector('.sussy-cat-sprite');
            if (currentCat) {
                currentCat.style.display = 'none';
            }
        }
        
        // Update current room BEFORE showing new room
        this.currentRoom = newRoom;
        
        // Show new room and its cat sprite
        const newRoomEl = this.container.querySelector(`.sussy-room-${this.currentRoom}`);
        if (newRoomEl) {
            newRoomEl.classList.add('active');
            const newCat = newRoomEl.querySelector('.sussy-cat-sprite');
            if (newCat) {
                newCat.style.display = 'flex';
                // Setup cat image for the new room's cat sprite
                this.setupCatImage(newCat);
            }
        }
        
        // Update room info display
        const roomNameEl = this.container.querySelector('.sussy-current-room');
        if (roomNameEl) {
            roomNameEl.textContent = this.rooms[this.currentRoom].name;
            console.log(`📝 Updated room name to: ${this.rooms[this.currentRoom].name}`);
        }
        
        // Reset cat position and render items
        this.catPosition = { x: 50, y: 50 };
        this.updateCatPosition();
        this.renderItems();
        
        this.showMessage(`Sneaking into the ${this.rooms[this.currentRoom].name}... 🕵️‍♂️`);
    }

    toggleHiding() {
        const levelConfig = this.levelConfig[this.currentLevel];
        
        if (!levelConfig.availableRooms.includes('bedroom')) {
            this.showMessage("No Sussy Lair available in this level! 🤔");
            return;
        }
        
        if (this.currentRoom !== 'bedroom') {
            this.showMessage("Can only hide in the Sussy Lair (bedroom)! 🛏️");
            return;
        }
        
        this.isHiding = !this.isHiding;
        const currentRoom = this.container.querySelector(`.sussy-room-${this.currentRoom}`);
        const catSprite = currentRoom.querySelector('.sussy-cat-sprite');
        
        if (this.isHiding) {
            catSprite.style.opacity = '0.3';
            this.detectionLevel = Math.max(0, this.detectionLevel - 30);
            this.showMessage("Hidden in the Sussy Lair! Sus level decreasing... 🕳️");
        } else {
            catSprite.style.opacity = '1';
            this.showMessage("Back to being sus! 😼");
        }
        
        this.updateDetectionBar();
    }

    updateUI() {
        this.container.querySelector('.sussy-score-value').textContent = `${this.collectedItems}/${this.totalItems}`;
    }

    updateTimer() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.container.querySelector('.sussy-timer-value').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    updateDetectionBar() {
        const fill = this.container.querySelector('.sussy-detection-fill');
        const percentage = (this.detectionLevel / this.maxDetection) * 100;
        fill.style.width = percentage + '%';
        
        // Change color based on detection level
        if (percentage > 80) {
            fill.style.background = '#ff4444';
        } else if (percentage > 50) {
            fill.style.background = '#ffaa00';
        } else {
            fill.style.background = '#44ff44';
        }
    }

    showMessage(text) {
        const messageEl = this.container.querySelector('.sussy-message');
        messageEl.textContent = text;
        messageEl.style.opacity = '1';
        
        setTimeout(() => {
            messageEl.style.opacity = '0.7';
        }, 2000);
    }

    endGame(reason) {
        this.gameActive = false;
        clearInterval(this.gameTimer);
        clearInterval(this.gameLoop);
        
        const playArea = this.container.querySelector('.sussy-cat-play-area');
        const endScreen = this.container.querySelector('.sussy-cat-end-screen');
        const levelName = this.container.querySelector('.sussy-level-name');
        const finalScore = this.container.querySelector('.sussy-final-score');
        const timeBonus = this.container.querySelector('.sussy-time-bonus');
        const resultMessage = this.container.querySelector('.sussy-result-flavor');
        const resultIcon = this.container.querySelector('.sussy-result-icon');
        const resultTitle = this.container.querySelector('.sussy-result-title');
        const nextLevelBtn = this.container.querySelector('.sussy-next-level-btn');
        
        playArea.style.display = 'none';
        endScreen.style.display = 'block';
        
        const levelConfig = this.levelConfig[this.currentLevel];
        
        // Calculate time bonus
        const bonusPoints = reason === 'win' ? Math.max(0, this.timeLeft * 2) : 0;
        this.score = (this.collectedItems * 10) + bonusPoints;
        
        // Update level progress
        this.levelProgress[this.currentLevel] = {
            completed: true,
            score: this.score,
            timeBonus: bonusPoints
        };
        
        levelName.textContent = `Level ${this.currentLevel}: ${levelConfig.name}`;
        finalScore.textContent = this.collectedItems;
        timeBonus.textContent = bonusPoints;
        
        // Update progress indicators
        this.updateProgressDisplay();
        
        if (reason === 'win') {
            resultTitle.textContent = `Level ${this.currentLevel} Complete!`;
            if (this.collectedItems >= this.totalItems) {
                resultMessage.textContent = `Perfect! Pushing Cat collected everything in ${levelConfig.name}! Maximum sus achieved! 😈`;
                
                // Show next level button if not on final level
                if (this.currentLevel < this.maxLevel) {
                    nextLevelBtn.style.display = 'inline-block';
                    nextLevelBtn.textContent = `😈 Level ${this.currentLevel + 1}: ${this.levelConfig[this.currentLevel + 1].name}`;
                } else {
                    nextLevelBtn.style.display = 'none';
                    resultMessage.textContent = "🎉 ULTIMATE SUS MASTER! Pushing Cat has conquered all levels! The family will never know what hit them! 😈🏆";
                }
            } else {
                resultMessage.textContent = `Great job! Pushing Cat was pretty sus in ${levelConfig.name}!`;
                nextLevelBtn.style.display = 'none';
            }
        } else {
            resultTitle.textContent = `Time's Up!`;
            if (this.collectedItems >= this.totalItems * 0.7) {
                resultMessage.textContent = `Not bad! Pushing Cat got most of the sus items before the family returned!`;
            } else if (this.collectedItems >= this.totalItems * 0.4) {
                resultMessage.textContent = `Pushing Cat tried his best! Maybe be a bit more sus next time!`;
            } else {
                resultMessage.textContent = `Pushing Cat needs more practice being sus! Try moving faster and hiding when needed!`;
            }
            nextLevelBtn.style.display = 'none';
        }
    }

    updateProgressDisplay() {
        const progressItems = this.container.querySelectorAll('.progress-item');
        progressItems.forEach(item => {
            const level = parseInt(item.dataset.level);
            if (this.levelProgress[level].completed) {
                item.innerHTML = `Level ${level}: ⭐ (${this.levelProgress[level].score} pts)`;
                item.style.color = '#FFD700';
            } else {
                item.innerHTML = `Level ${level}: ⭐`;
                item.style.color = '#ccc';
            }
        });
    }

    resetGame(container) {
        const initialScreen = container.querySelector('.sussy-cat-initial-screen');
        const startScreen = container.querySelector('.sussy-cat-start-screen');
        const endScreen = container.querySelector('.sussy-cat-end-screen');
        
        endScreen.style.display = 'none';
        startScreen.style.display = 'none';
        initialScreen.style.display = 'block';
        
        // Reset current level to 1
        this.currentLevel = 1;
        
        // Reset all displays
        container.querySelector('.sussy-level-value').textContent = '1';
        container.querySelector('.sussy-score-value').textContent = '0/12'; // Level 1 now has 12 items
        container.querySelector('.sussy-timer-value').textContent = '2:00';
        container.querySelector('.sussy-detection-fill').style.width = '0%';
        
        // Clear any existing items
        document.querySelectorAll('.sussy-item').forEach(item => item.remove());
        
        // FIXED: Reset room display properly
        const allRooms = container.querySelectorAll('.sussy-room');
        allRooms.forEach(room => {
            room.classList.remove('active', 'sussy-room-available', 'sussy-room-unavailable');
            // Clear any inline styles that might have been set
            room.style.display = '';
        });
        
        // Set living room as initial active room
        const livingRoom = container.querySelector('.sussy-room-living');
        if (livingRoom) {
            livingRoom.classList.add('active');
        }
    }
}