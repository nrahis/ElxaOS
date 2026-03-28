// =================================
// SUSSY CAT ADVENTURE - Cozy 90s RPG Style
// A cute stealth adventure for kids with retro vibes!
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
        this.maxLevel = 6;
        
        // Background music setup
        this.backgroundMusic = null;
        this.musicPath = '../../assets/games/sussycat/magicdustbin.mp3';
        this.musicLoaded = false;
        this.musicEnabled = true; // Player can toggle this
        
        // Level configurations
        this.levelConfig = {
            1: {
                name: "Quick Sus Mission",
                description: "Family going to the store",
                timeLimit: 120, // 2 minutes
                availableRooms: ['living', 'kitchen', 'bedroom'],
                detectionSpeed: 0.3,
                hideSpeed: 0.2,
                hasPlotPoints: false,
                story: "The family just left for the store! Pushing Cat has a few minutes to be sus...",
                tutorial: 'Hide Mechanic Tutorial: When you\'re being too sus (detection bar gets red), go to the bedroom and press H to hide in the Sussy Lair! This will reduce your sus level safely. <i class="mdi mdi-eye-off sc-i"></i>'
            },
            2: {
                name: "Big Sus Adventure", 
                description: "Family going out to dinner",
                timeLimit: 100, // 1:40
                availableRooms: ['living', 'kitchen', 'bedroom'],
                detectionSpeed: 0.7,
                hideSpeed: 0.25,
                hasPlotPoints: false,
                story: "The family is going out to dinner! More time to be VERY sus, but they might check in..."
            },
            3: {
                name: "Ultimate Sus Challenge",
                description: "Family going on a day trip", 
                timeLimit: 90, // 1:30
                availableRooms: ['living', 'kitchen', 'bedroom', 'bathroom'],
                detectionSpeed: 1.0,
                hideSpeed: 0.3,
                hasPlotPoints: false,
                story: "The family is gone for the whole day! Time for Pushing Cat's ULTIMATE sus adventure!"
            },
            4: {
                name: "Plotting Apprentice",
                description: "Weekend getaway begins",
                timeLimit: 110, // 1:50
                availableRooms: ['living', 'kitchen', 'bedroom', 'bathroom'],
                detectionSpeed: 0.8,
                hideSpeed: 0.3,
                hasPlotPoints: true,
                plotPointCount: 2,
                story: 'The family is gone for the weekend! Pushing Cat discovers mysterious plot points around the house... time to scheme! <i class="mdi mdi-head-question sc-i"></i>',
                tutorial: 'Sussy Plotting Mechanic: Look for glowing <i class="mdi mdi-star-four-points sc-i"></i> plot points! Walk into them to activate Pushing Cat\'s plotting powers - speed boosts, stealth mode, and bonus points! Each plot point can only be used once per level. <i class="mdi mdi-cat sc-i"></i>'
            },
            5: {
                name: "Master Plotter",
                description: "Extended vacation time",
                timeLimit: 95, // 1:35
                availableRooms: ['living', 'kitchen', 'bedroom', 'bathroom'],
                detectionSpeed: 1.2,
                hideSpeed: 0.35,
                hasPlotPoints: true,
                plotPointCount: 3,
                story: 'The family is on vacation for a week! Pushing Cat has discovered even MORE plot points... maximum scheming time! <i class="mdi mdi-cat sc-i"></i>'
            },
            6: {
                name: "Sus Mastermind",
                description: "Ultimate plotting challenge",
                timeLimit: 85, // 1:25
                availableRooms: ['living', 'kitchen', 'bedroom', 'bathroom'],
                detectionSpeed: 1.5,
                hideSpeed: 0.4,
                hasPlotPoints: true,
                plotPointCount: 4,
                story: 'The family moved out for a month! Pushing Cat has become the ultimate plotting mastermind with secret plot points EVERYWHERE! <i class="mdi mdi-brain sc-i"></i><i class="mdi mdi-crown sc-i"></i>'
            }
        };
        
        // Item sprite sheet configuration
        this.itemSpriteSheet = {
            path: '../../assets/games/sussycat/items/items.png',
            cellSize: 32,
            cols: 10,
            displaySize: 48, // rendered size in game
            loaded: false
        };
        this.itemSpriteScale = this.itemSpriteSheet.displaySize / this.itemSpriteSheet.cellSize;

        // Item definitions — keyed by sprite index (row * 10 + col)
        this.itemDefs = {
            // Living Room items
            glasses:    { row: 7, col: 0, name: 'Glasses', points: 10 },
            floppy:     { row: 4, col: 3, name: 'Floppy Disk', points: 10 },
            cd:         { row: 4, col: 4, name: 'CD', points: 15 },
            redBook:    { row: 4, col: 6, name: 'Red Book', points: 10 },
            redX:       { row: 7, col: 8, name: 'No-No Sign', points: -10, bad: true },
            // Kitchen items
            cherry:     { row: 0, col: 1, name: 'Cherry', points: 5 },
            orange:     { row: 1, col: 2, name: 'Orange', points: 10 },
            banana:     { row: 1, col: 3, name: 'Banana', points: 10 },
            fish:       { row: 3, col: 2, name: 'Fish', points: 15 },
            mushroom:   { row: 3, col: 8, name: 'Suspicious Mushroom', points: -10, bad: true },
            // Bedroom items
            feather:    { row: 3, col: 1, name: 'Feather', points: 10 },
            goldKey:    { row: 4, col: 5, name: 'Gold Key', points: 20 },
            crystal:    { row: 6, col: 7, name: 'Crystal', points: 15 },
            potion:     { row: 7, col: 5, name: 'Purple Potion', points: 15 },
            beetle:     { row: 5, col: 6, name: 'Beetle', points: -5, bad: true },
            // Bathroom items
            bottle:     { row: 2, col: 6, name: 'Water Bottle', points: 10 },
            candle:     { row: 2, col: 9, name: 'Candle', points: 10 },
            bone:       { row: 7, col: 2, name: 'Bone', points: 10 },
            pinkPotion: { row: 7, col: 6, name: 'Pink Potion', points: 15 },
            firecracker:{ row: 3, col: 5, name: 'Firecracker', points: -10, bad: true }
        };

        // Room collision zones (percentage-based rectangles where furniture/surfaces are)
        // Cat can't walk here, items won't spawn here
        this.roomCollisions = {
            living: [
                { x: 0.12, y: 0, w: 0.76, h: 0.44 },  // couch
                { x: 0, y: 0, w: 0.11, h: 0.58 }       // left curtain/wall
            ],
            kitchen: [
                { x: 0, y: 0, w: 1.0, h: 0.46 }        // counter + oven spans full width
            ],
            bedroom: [
                { x: 0.08, y: 0, w: 0.65, h: 0.48 },   // bed
                { x: 0, y: 0, w: 0.10, h: 0.55 }        // headboard rail
            ],
            bathroom: [
                { x: 0, y: 0, w: 0.32, h: 0.52 },      // shower
                { x: 0.55, y: 0, w: 0.45, h: 0.46 }     // bathtub/cabinet
            ]
        };

        // Game state
        this.catPosition = { x: 50, y: 50 };
        this.items = [];
        this.rooms = {
            living:   { name: 'Living Room', goodItems: ['glasses', 'floppy', 'cd', 'redBook'], badItems: ['redX'] },
            kitchen:  { name: 'Kitchen',     goodItems: ['cherry', 'orange', 'banana', 'fish'], badItems: ['mushroom'] },
            bedroom:  { name: 'Bedroom',     goodItems: ['feather', 'goldKey', 'crystal', 'potion'], badItems: ['beetle'] },
            bathroom: { name: 'Bathroom',    goodItems: ['bottle', 'candle', 'bone', 'pinkPotion'], badItems: ['firecracker'] }
        };
        
        this.collectedItems = 0;
        this.levelProgress = {
            1: { completed: false, score: 0, timeBonus: 0 },
            2: { completed: false, score: 0, timeBonus: 0 },
            3: { completed: false, score: 0, timeBonus: 0 },
            4: { completed: false, score: 0, timeBonus: 0 },
            5: { completed: false, score: 0, timeBonus: 0 },
            6: { completed: false, score: 0, timeBonus: 0 }
        };
        
        // Plotting mechanic variables
        this.plotPoints = [];
        this.activeEffects = [];
        this.speedBoost = 1.0;
        
        // Hiding restriction - once per room visit
        this.hasHiddenInCurrentRoom = false;
        
        // Movement and controls
        this.keys = {};
        
        // Image loading
        this.catImageLoaded = false;
        this.catImagePath = '../../assets/games/sussycat/pushing-cat.gif';
        this.logoImagePath = '../../assets/games/sussycat/ui/cat-logo.png';
        this.timeoutImagePath = '../../assets/games/sussycat/cat/pushing-cat-timeout.png';
        
        // Sprite sheet configuration
        this.spriteSheetPath = '../../assets/games/sussycat/cat/cat 1 (64х64).png';
        this.spriteSheetLoaded = false;
        this.spriteCellSize = 64;   // each cell in the sheet
        this.spriteDisplaySize = 96; // rendered size in-game
        this.spriteScale = this.spriteDisplaySize / this.spriteCellSize;
        this.spriteSheetCols = 14;
        this.spriteSheetRows = 72;
        // Row mappings for animations
        this.spriteRows = {
            walkDown: 2,   // 6 frames - walking toward camera
            walkUp: 3,     // 6 frames - walking away
            walkRight: 5,  // 6 frames (row 5 faces right)
            walkLeft: 4    // 6 frames (row 4 faces left)
        };
        this.spriteFrameCounts = { walkDown: 6, walkUp: 6, walkRight: 6, walkLeft: 6 };
        this.spriteDirection = 'down';  // current facing
        this.spriteFrame = 0;
        this.spriteAnimTimer = null;
        this.spriteAnimTick = 0;
        
        // Idle / special pose frames (row, col)
        this.spriteIdlePose = { row: 0, col: 0 };    // sitting front-facing
        this.spriteHidingPose = { row: 7, col: 1 };   // lying down / crouching
        
        // Initialize background music
        this.initializeBackgroundMusic();
        
        // Funny timeout messages
        this.timeoutMessages = [
            `Oh no! Pushing Cat got REAL cocky and was way too sus!! His family came home and caught him red pawed, and now you know what time it is... TIME OUT! <i class="mdi mdi-cat sc-i"></i>`,
            `Busted! Pushing Cat was being so sus that he knocked over a plant! Now he's in the timeout corner thinking about his life choices... <i class="mdi mdi-flower sc-i"></i>`,
            `Uh oh! Pushing Cat got too confident and started doing the zoomies! The neighbors called and now it's timeout time! <i class="mdi mdi-run-fast sc-i"></i>`,
            `Caught! Pushing Cat was being so sus he forgot to cover his tracks! The family found paw prints EVERYWHERE! Timeout corner, here we come! <i class="mdi mdi-paw sc-i"></i>`,
            `Oops! Pushing Cat got so excited about being sus that he knocked his food bowl off the counter! Guess who's in timeout now? <i class="mdi mdi-bowl-mix sc-i"></i>`,
            `Yikes! Pushing Cat was being TOO sus and accidentally activated the robot vacuum! The chaos was too much - timeout it is! <i class="mdi mdi-robot-vacuum sc-i"></i>`
        ];
    }

    // Initialize background music
    initializeBackgroundMusic() {
        try {
            this.backgroundMusic = new Audio(this.musicPath);
            this.backgroundMusic.loop = true;
            this.backgroundMusic.volume = 0.3; // Nice gentle volume for kids
            this.backgroundMusic.preload = 'auto';
            
            // Music loaded successfully
            this.backgroundMusic.addEventListener('canplaythrough', () => {
                this.musicLoaded = true;
                console.log('🎵 Background music loaded successfully!');
            });
            
            // Handle music loading errors gracefully
            this.backgroundMusic.addEventListener('error', (e) => {
                console.log('🎵 Background music failed to load, continuing without music');
                this.musicLoaded = false;
                this.backgroundMusic = null;
            });
            
        } catch (error) {
            console.log('🎵 Background music initialization failed, continuing without music');
            this.musicLoaded = false;
            this.backgroundMusic = null;
        }
    }

    // Play background music
    playBackgroundMusic() {
        if (this.backgroundMusic && this.musicLoaded && this.musicEnabled) {
            try {
                // Reset to beginning and play
                this.backgroundMusic.currentTime = 0;
                const playPromise = this.backgroundMusic.play();
                
                // Handle modern browser play restrictions
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log('🎵 Background music started playing!');
                    }).catch(error => {
                        console.log('🎵 Background music autoplay prevented by browser, music will start on first user interaction');
                        // Music will start when user interacts with the game
                    });
                }
            } catch (error) {
                console.log('🎵 Error playing background music:', error);
            }
        }
    }

    // Stop background music
    stopBackgroundMusic() {
        if (this.backgroundMusic && !this.backgroundMusic.paused) {
            try {
                this.backgroundMusic.pause();
                this.backgroundMusic.currentTime = 0;
                console.log('🎵 Background music stopped');
            } catch (error) {
                console.log('🎵 Error stopping background music:', error);
            }
        }
    }

    // Toggle music on/off
    toggleBackgroundMusic() {
        this.musicEnabled = !this.musicEnabled;
        
        if (this.musicEnabled && this.gameActive) {
            this.playBackgroundMusic();
            this.showMessage('<i class="mdi mdi-music sc-i"></i> Music enabled! Sussy vibes activated! <i class="mdi mdi-cat sc-i"></i>');
        } else {
            this.stopBackgroundMusic();
            this.showMessage('<i class="mdi mdi-volume-off sc-i"></i> Music disabled. Silent sus mode! <i class="mdi mdi-eye-off sc-i"></i>');
        }
        
        // Update music button text
        this.updateMusicButton();
        
        // Refocus game window for keyboard input
        if (this._keyboardTarget) this._keyboardTarget.focus();
    }

    // Update music button text
    updateMusicButton() {
        const musicBtn = this.container?.querySelector('.sussy-music-toggle');
        if (musicBtn) {
            musicBtn.innerHTML = this.musicEnabled ? '<i class="mdi mdi-volume-off sc-i"></i> Mute Music' : '<i class="mdi mdi-music sc-i"></i> Enable Music';
        }
    }

    launch(programInfo) {
        const windowId = `sussy-cat-${Date.now()}`;
        const windowContent = this.createGameInterface();
        
        const window = this.windowManager.createWindow(
            windowId,
            `${programInfo.name}`,
            windowContent,
            { width: '700px', height: '550px', x: '150px', y: '100px' }
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
                        <div class="sussy-points">Score: <span class="sussy-points-value">0</span></div>
                        <div class="sussy-timer">Time: <span class="sussy-timer-value">2:00</span></div>
                        <div class="sussy-detection">
                            <span class="sussy-detection-label">Sus Level:</span>
                            <div class="sussy-detection-bar">
                                <div class="sussy-detection-fill"></div>
                            </div>
                        </div>
                        <button class="sussy-music-toggle"><i class="mdi mdi-volume-off sc-i"></i> Mute Music</button>
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
                                <div class="sussy-level-grid">
                                    <div class="sussy-level-column">
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
                                    <div class="sussy-level-column">
                                        <button class="sussy-level-btn" data-level="4">
                                            <div class="level-title">Level 4: Plotting Apprentice</div>
                                            <div class="level-desc">Weekend getaway (1:50)</div>
                                            <div class="level-rooms">Plotting Powers! <i class="mdi mdi-star-four-points sc-i sc-i--gold"></i></div>
                                        </button>
                                        <button class="sussy-level-btn" data-level="5">
                                            <div class="level-title">Level 5: Master Plotter</div>
                                            <div class="level-desc">Extended vacation (1:35)</div>
                                            <div class="level-rooms">More Plot Points! <i class="mdi mdi-star-four-points sc-i sc-i--gold"></i><i class="mdi mdi-star-four-points sc-i sc-i--gold"></i></div>
                                        </button>
                                        <button class="sussy-level-btn" data-level="6">
                                            <div class="level-title">Level 6: Sus Mastermind</div>
                                            <div class="level-desc">Ultimate challenge (1:25)</div>
                                            <div class="level-rooms">Max Plotting! <i class="mdi mdi-brain sc-i sc-i--purple"></i><i class="mdi mdi-crown sc-i sc-i--gold"></i></div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="sussy-story">
                                <div class="sussy-story-blurb">
                                    <p><strong>The Sus Chronicles of Pushing Cat:</strong></p>
                                    <p>Pushing Cat is the most sus little black cat in the house! When the family leaves, he gets up to ALL sorts of mischief. Help him collect sussy items from around the house, but don't get caught!</p>
                                </div>
                                <div class="sussy-story-controls">
                                    <p><strong>How to Play:</strong></p>
                                    <ul>
                                        <li><i class="mdi mdi-gamepad-variant sc-i-badge sc-i--purple"></i> ARROW KEYS to move</li>
                                        <li><i class="mdi mdi-home sc-i-badge sc-i--mint"></i> SPACE to change rooms</li>
                                        <li><i class="mdi mdi-eye-off sc-i-badge sc-i--purple"></i> H to hide (bedroom only)</li>
                                        <li><i class="mdi mdi-lightning-bolt sc-i-badge sc-i--gold"></i> Collect items, stay sneaky!</li>
                                        <li><i class="mdi mdi-star-four-points sc-i-badge sc-i--gold"></i> Plot points = powers! (Lv4+)</li>
                                        <li><i class="mdi mdi-music sc-i-badge sc-i--pink"></i> M to toggle music</li>
                                        <li><i class="mdi mdi-eye sc-i-badge sc-i--purple"></i> Higher level = harder!</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="sussy-tutorial-popup" style="display: none;">
                        <div class="sussy-tutorial-content">
                            <div class="sussy-tutorial-title">Tutorial</div>
                            <div class="sussy-tutorial-message"></div>
                            <button class="sussy-tutorial-ok">Got it! Let's be sus! <i class="mdi mdi-cat sc-i"></i></button>
                        </div>
                    </div>
                    
                    <div class="sussy-cat-play-area" style="display: none;">
                        <div class="sussy-room-info">
                            <span class="sussy-current-room">Living Room</span>
                            <span class="sussy-room-hint">Press SPACE to change rooms • Press H to hide in bedroom • Press M for music</span>
                        </div>
                        
                        <div class="sussy-game-world">
                            <div class="sussy-room sussy-room-living active">
                                <div class="sussy-room-bg"><i class="mdi mdi-sofa sc-i"></i></div>
                                <div class="sussy-cat-sprite"><i class="mdi mdi-cat sc-i"></i></div>
                                <div class="sussy-detection-overlay"></div>
                            </div>
                            
                            <div class="sussy-room sussy-room-kitchen">
                                <div class="sussy-room-bg"><i class="mdi mdi-stove sc-i"></i></div>
                                <div class="sussy-cat-sprite" style="display: none;"><i class="mdi mdi-cat sc-i"></i></div>
                                <div class="sussy-detection-overlay"></div>
                            </div>
                            
                            <div class="sussy-room sussy-room-bedroom">
                                <div class="sussy-room-bg"><i class="mdi mdi-bed sc-i"></i></div>
                                <div class="sussy-cat-sprite" style="display: none;"><i class="mdi mdi-cat sc-i"></i></div>
                                <div class="sussy-lair-entrance">
                                    <div class="sussy-lair-icon"><i class="mdi mdi-eye-off"></i> Sussy Lair (Press H)</div>
                                </div>
                                <div class="sussy-detection-overlay"></div>
                            </div>
                            
                            <div class="sussy-room sussy-room-bathroom">
                                <div class="sussy-room-bg"><i class="mdi mdi-shower sc-i"></i></div>
                                <div class="sussy-cat-sprite" style="display: none;"><i class="mdi mdi-cat sc-i"></i></div>
                                <div class="sussy-detection-overlay"></div>
                            </div>
                        </div>
                        
                        <div class="sussy-messages">
                            <div class="sussy-message">Choose a sus level to begin! <i class="mdi mdi-cat sc-i"></i></div>
                        </div>
                    </div>
                    
                    <div class="sussy-cat-timeout-screen" style="display: none;">
                        <div class="sussy-timeout-content">
                            <div class="sussy-timeout-icon"><i class="mdi mdi-cat sc-i"></i></div>
                            <h2 class="sussy-timeout-title">TIME OUT!</h2>
                            <div class="sussy-timeout-message">
                                <p>Oh no! Pushing Cat got caught being way too sus!</p>
                            </div>
                            <div class="sussy-timeout-buttons">
                                <button class="sussy-retro-btn sussy-try-again-btn"><i class="mdi mdi-cat sc-i"></i> Try Again</button>
                                <button class="sussy-retro-btn sussy-main-menu-btn"><i class="mdi mdi-home sc-i"></i> Main Menu</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="sussy-cat-end-screen" style="display: none;">
                        <div class="sussy-end-content">
                            <div class="sussy-result-icon"><i class="mdi mdi-cat sc-i"></i></div>
                            <h2 class="sussy-result-title">Level Complete!</h2>
                            <div class="sussy-result-message">
                                <p>Pushing Cat completed <span class="sussy-level-name">Level 1</span>!</p>
                                <p>Items collected: <span class="sussy-final-score">0</span></p>
                                <p>Item score: <span class="sussy-item-score">0</span> pts</p>
                                <p>Time bonus: <span class="sussy-time-bonus">0</span> pts</p>
                                <p><strong>Total: <span class="sussy-total-score">0</span> pts</strong></p>
                                <p class="sussy-result-flavor"></p>
                            </div>
                            <div class="sussy-level-progress">
                                <div class="progress-item" data-level="1">Level 1: <i class="mdi mdi-star sc-i"></i></div>
                                <div class="progress-item" data-level="2">Level 2: <i class="mdi mdi-star sc-i"></i></div>
                                <div class="progress-item" data-level="3">Level 3: <i class="mdi mdi-star sc-i"></i></div>
                                <div class="progress-item" data-level="4">Level 4: <i class="mdi mdi-star sc-i"></i></div>
                                <div class="progress-item" data-level="5">Level 5: <i class="mdi mdi-star sc-i"></i></div>
                                <div class="progress-item" data-level="6">Level 6: <i class="mdi mdi-star sc-i"></i></div>
                            </div>
                            <div class="sussy-end-buttons">
                                <button class="sussy-retro-btn sussy-next-level-btn" style="display: none;"><i class="mdi mdi-cat sc-i"></i> Next Sus Level!</button>
                                <button class="sussy-retro-btn sussy-play-again-btn"><i class="mdi mdi-refresh sc-i"></i> Choose Level</button>
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
        const tryAgainBtn = container.querySelector('.sussy-try-again-btn');
        const mainMenuBtn = container.querySelector('.sussy-main-menu-btn');
        const tutorialOkBtn = container.querySelector('.sussy-tutorial-ok');
        const musicToggleBtn = container.querySelector('.sussy-music-toggle');

        // Initial screen click/key to continue
        const continueToLevelSelect = () => {
            this.showStartScreen(container);
        };
        
        initialScreen.addEventListener('click', continueToLevelSelect);
        
        // Keyboard support for splash screen
        const splashKeyHandler = (e) => {
            if (initialScreen.style.display !== 'none') {
                continueToLevelSelect();
                document.removeEventListener('keydown', splashKeyHandler);
            }
        };
        document.addEventListener('keydown', splashKeyHandler);

        // Level selection
        levelButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const level = parseInt(btn.dataset.level);
                this.currentLevel = level;
                this.showTutorial(container);
            });
        });

        // Tutorial popup
        tutorialOkBtn.addEventListener('click', () => {
            this.startGame(container);
        });

        // Music toggle button
        musicToggleBtn.addEventListener('click', () => {
            this.toggleBackgroundMusic();
        });

        playAgainBtn.addEventListener('click', () => {
            this.resetGame(container);
        });

        nextLevelBtn.addEventListener('click', () => {
            if (this.currentLevel < this.maxLevel) {
                this.currentLevel++;
                this.showTutorial(container);
            } else {
                this.resetGame(container);
            }
        });

        tryAgainBtn.addEventListener('click', () => {
            this.startGame(container);
        });

        mainMenuBtn.addEventListener('click', () => {
            this.resetGame(container);
        });

        // Store window reference for cleanup
        this.gameWindow = window;
        this.container = container;
        this._windowId = windowId;
        
        // Setup keyboard controls scoped to this window
        this.setupKeyboardControls(window);
        
        // Listen for window close to clean up intervals, music, etc.
        this._onWindowClosed = (data) => {
            if (data.id === this._windowId) {
                this.destroy();
            }
        };
        elxaOS.eventBus.on('window.closed', this._onWindowClosed);
    }

    // Show tutorial popup
    showTutorial(container) {
        const levelConfig = this.levelConfig[this.currentLevel];
        
        if (levelConfig.tutorial) {
            const startScreen = container.querySelector('.sussy-cat-start-screen');
            const tutorialPopup = container.querySelector('.sussy-tutorial-popup');
            const tutorialMessage = container.querySelector('.sussy-tutorial-message');
            
            startScreen.style.display = 'none';
            tutorialPopup.style.display = 'flex';
            tutorialMessage.textContent = levelConfig.tutorial;
        } else {
            this.startGame(container);
        }
    }

    // Show/hide header helper
    toggleHeader(show) {
        const header = this.container.querySelector('.sussy-cat-header');
        if (show) {
            header.classList.add('show');
        } else {
            header.classList.remove('show');
        }
    }

    // Show start screen (level selection) - NO HEADER
    showStartScreen(container) {
        const initialScreen = container.querySelector('.sussy-cat-initial-screen');
        const startScreen = container.querySelector('.sussy-cat-start-screen');
        
        initialScreen.style.display = 'none';
        startScreen.style.display = 'block';
        
        // Keep header hidden during level selection
        this.toggleHeader(false);
    }

    setupKeyboardControls(windowEl) {
        // Attach to the game window element so keys only fire when this window is focused
        // The window element needs tabindex to receive keyboard events
        windowEl.setAttribute('tabindex', '0');
        windowEl.style.outline = 'none'; // no focus outline
        
        this._onKeyDown = (e) => {
            if (!this.gameActive) return;
            
            // Only handle game keys (don't eat typing in other contexts)
            const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'h', 'H', 'm', 'M'];
            if (!gameKeys.includes(e.key)) return;
            
            e.preventDefault();
            e.stopPropagation();
            this.keys[e.key] = true;
            
            // Handle immediate actions
            switch(e.key) {
                case ' ':
                    this.changeRoom();
                    break;
                case 'h':
                case 'H':
                    this.toggleHiding();
                    break;
                case 'm':
                case 'M':
                    this.toggleBackgroundMusic();
                    break;
            }
        };
        
        this._onKeyUp = (e) => {
            this.keys[e.key] = false;
        };
        
        windowEl.addEventListener('keydown', this._onKeyDown);
        windowEl.addEventListener('keyup', this._onKeyUp);
        
        // Focus the window so it receives key events
        windowEl.focus();
        this._keyboardTarget = windowEl;
    }

    // Get the pixel dimensions of the game world area
    getGameWorldSize() {
        const gw = this.container?.querySelector('.sussy-game-world');
        if (!gw) return { w: 400, h: 300 };
        return { w: gw.clientWidth, h: gw.clientHeight };
    }

    // Check if a point (cat's foot hitbox) overlaps any collision zone in the current room
    // Uses the bottom third of the sprite as the "feet" for natural overlap visuals
    isInCollisionZone(x, y, room) {
        const { w: worldW, h: worldH } = this.getGameWorldSize();
        const zones = this.roomCollisions[room] || [];
        
        // Foot hitbox: bottom 1/3 of sprite, horizontally centered middle 60%
        const footLeft   = x + this.spriteDisplaySize * 0.2;
        const footRight  = x + this.spriteDisplaySize * 0.8;
        const footTop    = y + this.spriteDisplaySize * 0.66;
        const footBottom = y + this.spriteDisplaySize;
        
        for (const zone of zones) {
            const zx = zone.x * worldW;
            const zy = zone.y * worldH;
            const zr = (zone.x + zone.w) * worldW;
            const zb = (zone.y + zone.h) * worldH;
            
            if (footRight > zx && footLeft < zr && footBottom > zy && footTop < zb) {
                return true;
            }
        }
        return false;
    }

    // Find a random walkable (floor) spawn point for an item in a room
    getWalkableSpawnPoint(room) {
        const { w: worldW, h: worldH } = this.getGameWorldSize();
        const pad = 20;
        const itemSize = this.itemSpriteSheet.displaySize;
        
        for (let attempt = 0; attempt < 50; attempt++) {
            const x = pad + Math.random() * (worldW - itemSize - pad * 2);
            const y = pad + Math.random() * (worldH - itemSize - pad * 2);
            
            // Check center of item against collision zones
            const cx = x + itemSize / 2;
            const cy = y + itemSize / 2;
            const zones = this.roomCollisions[room] || [];
            let blocked = false;
            
            for (const zone of zones) {
                const zx = zone.x * worldW;
                const zy = zone.y * worldH;
                const zr = (zone.x + zone.w) * worldW;
                const zb = (zone.y + zone.h) * worldH;
                if (cx > zx && cx < zr && cy > zy && cy < zb) {
                    blocked = true;
                    break;
                }
            }
            if (!blocked) return { x, y };
        }
        // Fallback: bottom center of room
        return { x: worldW * 0.4, y: worldH * 0.7 };
    }

    // Setup timeout icon image with fallback to emoji
    setupTimeoutIcon(iconElement) {
        if (!iconElement) return;
        
        // Try to load the timeout image
        const img = new Image();
        
        img.onload = () => {
            // Image loaded successfully
            iconElement.style.backgroundImage = `url('${this.timeoutImagePath}')`;
            iconElement.classList.remove('image-failed');
            iconElement.textContent = ''; // Hide emoji text when image loads
            console.log('😿 Timeout icon loaded successfully!');
        };
        
        img.onerror = () => {
            // Image failed to load - show emoji
            iconElement.style.backgroundImage = 'none';
            iconElement.classList.add('image-failed');
            iconElement.innerHTML = '<i class="mdi mdi-cat sc-i"></i>'; // Show icon fallback
            console.log('😿 Timeout icon failed to load, using emoji fallback');
        };
        
        // Start loading the image
        img.src = this.timeoutImagePath;
    }

    // Setup cat sprite with sprite sheet (fallback to emoji)
    setupCatImage(catElement) {
        if (!catElement) return;
        
        const img = new Image();
        
        img.onload = () => {
            const sheetW = this.spriteSheetCols * this.spriteCellSize * this.spriteScale;
            const sheetH = this.spriteSheetRows * this.spriteCellSize * this.spriteScale;
            
            catElement.style.backgroundImage = `url('${this.spriteSheetPath}')`;
            catElement.style.backgroundSize = `${sheetW}px ${sheetH}px`;
            catElement.style.backgroundRepeat = 'no-repeat';
            catElement.style.imageRendering = 'pixelated';
            catElement.classList.add('has-cat-image');
            catElement.textContent = '';
            this.spriteSheetLoaded = true;
            
            // Show idle frame for current direction
            this.updateSpriteFrame(catElement);
            console.log('🐱 Sprite sheet loaded successfully!');
        };
        
        img.onerror = () => {
            // Fallback: try the old gif
            const gifImg = new Image();
            gifImg.onload = () => {
                catElement.style.backgroundImage = `url('${this.catImagePath}')`;
                catElement.style.backgroundSize = 'contain';
                catElement.style.backgroundRepeat = 'no-repeat';
                catElement.style.backgroundPosition = 'center';
                catElement.classList.add('has-cat-image');
                catElement.textContent = '';
                this.spriteSheetLoaded = false;
                console.log('🐱 Fell back to gif sprite');
            };
            gifImg.onerror = () => {
                catElement.style.backgroundImage = 'none';
                catElement.classList.remove('has-cat-image');
                catElement.textContent = "";  // fallback handled by CSS
                this.spriteSheetLoaded = false;
                console.log('😿 All sprite loading failed, using emoji');
            };
            gifImg.src = this.catImagePath;
        };
        
        img.src = this.spriteSheetPath;
    }

    // Update the sprite sheet frame on a cat element
    updateSpriteFrame(catElement) {
        if (!catElement || !this.spriteSheetLoaded) return;
        
        const dirKey = 'walk' + this.spriteDirection.charAt(0).toUpperCase() + this.spriteDirection.slice(1);
        const row = this.spriteRows[dirKey] || this.spriteRows.walkDown;
        const col = this.spriteFrame % (this.spriteFrameCounts[dirKey] || 6);
        
        const px = -(col * this.spriteDisplaySize);
        const py = -(row * this.spriteDisplaySize);
        catElement.style.backgroundPosition = `${px}px ${py}px`;
    }

    // Show a specific static pose (for hiding, idle, etc.)
    showSpritePose(catElement, pose) {
        if (!catElement || !this.spriteSheetLoaded) return;
        const px = -(pose.col * this.spriteDisplaySize);
        const py = -(pose.row * this.spriteDisplaySize);
        catElement.style.backgroundPosition = `${px}px ${py}px`;
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
        const tutorialPopup = container.querySelector('.sussy-tutorial-popup');
        const playArea = container.querySelector('.sussy-cat-play-area');
        const endScreen = container.querySelector('.sussy-cat-end-screen');
        const timeoutScreen = container.querySelector('.sussy-cat-timeout-screen');
        
        startScreen.style.display = 'none';
        tutorialPopup.style.display = 'none';
        endScreen.style.display = 'none';
        timeoutScreen.style.display = 'none';
        playArea.style.display = 'flex';
        
        // NOW SHOW THE HEADER - Game has started!
        this.toggleHeader(true);
        
        // Focus the window for keyboard input
        if (this._keyboardTarget) this._keyboardTarget.focus();
        
        // Start background music when game starts
        this.playBackgroundMusic();
        
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
        this.speedBoost = 1.0;
        this.activeEffects = [];
        this.hasHiddenInCurrentRoom = false;
        
        // Calculate total GOOD items for available rooms (bad items don't count toward win)
        this.totalItems = levelConfig.availableRooms.reduce((sum, roomId) => {
            return sum + this.rooms[roomId].goodItems.length;
        }, 0);
        
        // Setup rooms visibility
        this.setupRoomsForLevel(container, levelConfig);
        
        // Set cat position to walkable floor area (play area is visible so dimensions are real)
        const { w: startW, h: startH } = this.getGameWorldSize();
        this.catPosition = { x: startW * 0.4, y: startH * 0.7 };
        
        // Initialize room display (uses catPosition above)
        this.initializeRoomDisplay(container);
        
        // Setup cat images for all sprites
        this.setupAllCatImages();
        
        // Generate items for available rooms only
        this.generateItems();
        
        // Generate plot points if level has them
        if (levelConfig.hasPlotPoints) {
            this.generatePlotPoints(levelConfig);
        }
        
        // Update UI with level info
        this.updateUI();
        this.updateLevelDisplay();
        this.updateMusicButton();
        
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
        
        this.showMessage(`${levelConfig.story} Time to be sus! <i class="mdi mdi-cat sc-i"></i>`);
    }

    // Generate plot points for plotting levels
    generatePlotPoints(levelConfig) {
        this.plotPoints = [];
        
        const plotTypes = [
            { name: 'Speed Boost', icon: '<i class="mdi mdi-lightning-bolt sc-i sc-i--gold"></i>', effect: 'speed' },
            { name: 'Stealth Mode', icon: '<i class="mdi mdi-ghost sc-i sc-i--purple"></i>', effect: 'stealth' },
            { name: 'Bonus Points', icon: '<i class="mdi mdi-cash-multiple sc-i sc-i--gold"></i>', effect: 'bonus' },
            { name: 'Time Freeze', icon: '<i class="mdi mdi-clock-fast sc-i sc-i--mint"></i>', effect: 'time' }
        ];
        
        for (let i = 0; i < levelConfig.plotPointCount; i++) {
            const plotType = plotTypes[i % plotTypes.length];
            const roomId = levelConfig.availableRooms[Math.floor(Math.random() * levelConfig.availableRooms.length)];
            const spawnPt = this.getWalkableSpawnPoint(roomId);
            
            this.plotPoints.push({
                id: `plot-${i}`,
                room: roomId,
                iconHtml: '<i class="mdi mdi-star-four-points"></i>',
                displayIcon: plotType.icon,
                name: plotType.name,
                effect: plotType.effect,
                x: spawnPt.x,
                y: spawnPt.y,
                used: false
            });
        }
        
        this.renderPlotPoints();
    }

    // Render plot points for current room
    renderPlotPoints() {
        // Clear existing plot points
        document.querySelectorAll('.sussy-plot-point').forEach(point => point.remove());
        
        const currentRoomEl = this.container.querySelector(`.sussy-room-${this.currentRoom}`);
        const roomPlotPoints = this.plotPoints.filter(point => point.room === this.currentRoom && !point.used);
        
        roomPlotPoints.forEach(point => {
            const plotEl = document.createElement('div');
            plotEl.className = 'sussy-plot-point';
            plotEl.innerHTML = point.iconHtml;
            plotEl.style.left = point.x + 'px';
            plotEl.style.top = point.y + 'px';
            plotEl.dataset.plotId = point.id;
            plotEl.title = point.name;
            
            currentRoomEl.appendChild(plotEl);
        });
    }

    // Check plot point collision
    checkPlotPointCollision() {
        const plotPoints = this.container.querySelectorAll('.sussy-plot-point');
        const currentRoom = this.container.querySelector(`.sussy-room-${this.currentRoom}`);
        const catSprite = currentRoom.querySelector('.sussy-cat-sprite');
        
        if (!catSprite) return;
        
        plotPoints.forEach(plotEl => {
            const plotRect = plotEl.getBoundingClientRect();
            const catRect = catSprite.getBoundingClientRect();
            
            if (this.isColliding(catRect, plotRect)) {
                const plotId = plotEl.dataset.plotId;
                this.activatePlotPoint(plotId);
                plotEl.remove();
            }
        });
    }

    // Activate plot point effect
    activatePlotPoint(plotId) {
        const plotPoint = this.plotPoints.find(p => p.id === plotId);
        if (!plotPoint || plotPoint.used) return;
        
        plotPoint.used = true;
        
        switch (plotPoint.effect) {
            case 'speed':
                this.speedBoost = 2.0;
                this.activeEffects.push({ type: 'speed', duration: 150 }); // 15 seconds
                this.showMessage(`${plotPoint.displayIcon} Plotting activated! Speed boost for 15 seconds! Zoom zoom! <i class="mdi mdi-run-fast sc-i"></i>`);
                break;
            case 'stealth':
                this.detectionLevel = Math.max(0, this.detectionLevel - 50);
                this.activeEffects.push({ type: 'stealth', duration: 100 }); // 10 seconds
                this.showMessage(`${plotPoint.displayIcon} Plotting activated! Stealth mode for 10 seconds! Super sneaky! <i class="mdi mdi-ghost sc-i"></i>`);
                break;
            case 'bonus':
                this.score += 30;
                this.showMessage(`${plotPoint.displayIcon} Plotting activated! Bonus points! +30 sus points! <i class="mdi mdi-cash-multiple sc-i"></i>`);
                break;
            case 'time':
                this.timeLeft += 10;
                this.showMessage(`${plotPoint.displayIcon} Plotting activated! Time bonus! +10 seconds! <i class="mdi mdi-clock-fast sc-i"></i>`);
                break;
        }
        
        this.updateDetectionBar();
    }

    // Update active effects
    updateActiveEffects() {
        this.activeEffects = this.activeEffects.filter(effect => {
            effect.duration--;
            if (effect.duration <= 0) {
                // Effect expired
                if (effect.type === 'speed') {
                    this.speedBoost = 1.0;
                    this.showMessage('Speed boost expired! Back to normal sneaking speed! <i class="mdi mdi-paw sc-i"></i>');
                } else if (effect.type === 'stealth') {
                    this.showMessage('Stealth mode expired! Back to being detectable! <i class="mdi mdi-eye sc-i"></i>');
                }
                return false;
            }
            return true;
        });
    }

    // Room setup without conflicting inline styles
    setupRoomsForLevel(container, levelConfig) {
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
            hintEl.textContent = 'Press SPACE to change rooms • Press H to hide in bedroom • Press M for music';
        } else {
            hintEl.textContent = 'Press SPACE to change rooms • Press M for music';
        }
    }

    // Initialize room display properly
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
        
        // Generate good + bad items for available rooms
        levelConfig.availableRooms.forEach(roomId => {
            const roomData = this.rooms[roomId];
            const allKeys = [...roomData.goodItems, ...roomData.badItems];
            
            allKeys.forEach((key) => {
                const def = this.itemDefs[key];
                if (!def) return;
                const spawnPt = this.getWalkableSpawnPoint(roomId);
                this.items.push({
                    id: `${roomId}-${key}`,
                    room: roomId,
                    defKey: key,
                    name: def.name,
                    points: def.points,
                    bad: !!def.bad,
                    spriteRow: def.row,
                    spriteCol: def.col,
                    x: spawnPt.x,
                    y: spawnPt.y,
                    collected: false
                });
            });
        });
        
        console.log('🎮 Generated items:', this.items);
        this.renderItems();
    }

    renderItems() {
        // Clear existing items
        this.container.querySelectorAll('.sussy-item').forEach(item => item.remove());
        
        // Render items for current room
        const currentRoomEl = this.container.querySelector(`.sussy-room-${this.currentRoom}`);
        const roomItems = this.items.filter(item => item.room === this.currentRoom && !item.collected);
        
        roomItems.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'sussy-item';
            if (item.bad) itemEl.classList.add('sussy-item-bad');
            itemEl.style.left = item.x + 'px';
            itemEl.style.top = item.y + 'px';
            itemEl.dataset.itemId = item.id;
            itemEl.title = item.name;
            
            // Render from sprite sheet
            this.setupItemSprite(itemEl, item);
            
            currentRoomEl.appendChild(itemEl);
        });
    }

    // Render an item from the sprite sheet
    setupItemSprite(el, item) {
        const img = new Image();
        const ss = this.itemSpriteSheet;
        
        img.onload = () => {
            const sheetW = ss.cols * ss.cellSize * this.itemSpriteScale;
            // Use full image height scaled
            const sheetH = img.naturalHeight * this.itemSpriteScale;
            
            el.style.backgroundImage = `url('${ss.path}')`;
            el.style.backgroundSize = `${sheetW}px ${sheetH}px`;
            el.style.backgroundRepeat = 'no-repeat';
            el.style.imageRendering = 'pixelated';
            el.style.width = ss.displaySize + 'px';
            el.style.height = ss.displaySize + 'px';
            el.classList.add('has-image');
            el.textContent = '';
            
            const px = -(item.spriteCol * ss.displaySize);
            const py = -(item.spriteRow * ss.displaySize);
            el.style.backgroundPosition = `${px}px ${py}px`;
            
            ss.loaded = true;
        };
        
        img.onerror = () => {
            // Fallback: show name as text
            el.textContent = item.name.charAt(0);
            el.style.fontSize = '20px';
        };
        
        img.src = ss.path;
    }

    update() {
        if (!this.gameActive || this.isHiding) return;
        
        // Update active effects
        this.updateActiveEffects();
        
        // Movement with dynamic bounds and collision
        const moveSpeed = 3 * this.speedBoost;
        let moved = false;
        const { w: worldW, h: worldH } = this.getGameWorldSize();
        const pad = 4;
        const maxX = worldW - this.spriteDisplaySize - pad;
        const maxY = worldH - this.spriteDisplaySize - pad;
        
        if (this.keys['ArrowUp']) {
            const newY = Math.max(pad, this.catPosition.y - moveSpeed);
            if (!this.isInCollisionZone(this.catPosition.x, newY, this.currentRoom)) {
                this.catPosition.y = newY;
                moved = true;
            }
            this.spriteDirection = 'up';
        }
        if (this.keys['ArrowDown']) {
            const newY = Math.min(maxY, this.catPosition.y + moveSpeed);
            if (!this.isInCollisionZone(this.catPosition.x, newY, this.currentRoom)) {
                this.catPosition.y = newY;
                moved = true;
            }
            this.spriteDirection = 'down';
        }
        if (this.keys['ArrowLeft']) {
            const newX = Math.max(pad, this.catPosition.x - moveSpeed);
            if (!this.isInCollisionZone(newX, this.catPosition.y, this.currentRoom)) {
                this.catPosition.x = newX;
                moved = true;
            }
            this.spriteDirection = 'left';
        }
        if (this.keys['ArrowRight']) {
            const newX = Math.min(maxX, this.catPosition.x + moveSpeed);
            if (!this.isInCollisionZone(newX, this.catPosition.y, this.currentRoom)) {
                this.catPosition.x = newX;
                moved = true;
            }
            this.spriteDirection = 'right';
        }
        
        // Animate sprite
        if (moved) {
            this.spriteAnimTick++;
            if (this.spriteAnimTick % 2 === 0) { // advance frame every 2 game ticks (~200ms)
                this.spriteFrame++;
            }
        } else {
            this.spriteFrame = 0; // idle = first frame of current direction
            this.spriteAnimTick = 0;
        }
        
        // Update sprite visual on the active cat element
        const currentRoom = this.container.querySelector(`.sussy-room-${this.currentRoom}`);
        const catSprite = currentRoom?.querySelector('.sussy-cat-sprite');
        if (catSprite) this.updateSpriteFrame(catSprite);
        
        if (moved) {
            this.updateCatPosition();
            this.checkItemCollision();
            this.checkPlotPointCollision();
            
            // Increase detection when moving (unless in stealth mode)
            const hasStealthEffect = this.activeEffects.some(effect => effect.type === 'stealth');
            if (!hasStealthEffect) {
                this.detectionLevel = Math.min(this.maxDetection, this.detectionLevel + 0.5);
            }
        } else {
            // Decrease detection when still
            this.detectionLevel = Math.max(0, this.detectionLevel - 0.2);
        }
        
        this.updateDetectionBar();
        
        // Check for timeout - caught being too sus!
        if (this.detectionLevel >= this.maxDetection) {
            this.showTimeoutScreen();
            return;
        }
        
        // Check for high detection warning
        if (this.detectionLevel > 80 && this.currentRoom === 'bedroom') {
            this.showMessage("You're being too sus! Hide in the Sussy Lair! (Press H)");
        } else if (this.detectionLevel > 90) {
            this.showMessage('VERY SUS! Find the bedroom and hide! <i class="mdi mdi-alert sc-i"></i>');
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
            this.score += item.points;
            
            if (item.bad) {
                // Bad item!
                const badMessages = [
                    `Yuck! ${item.name}! That cost ${Math.abs(item.points)} points! <i class="mdi mdi-alert-circle sc-i"></i>`,
                    `Oh no! Pushing Cat grabbed a ${item.name}! -${Math.abs(item.points)} pts! <i class="mdi mdi-alert-circle sc-i"></i>`,
                    `Ew! ${item.name}! Should have avoided that! <i class="mdi mdi-emoticon-sad sc-i"></i>`
                ];
                this.showMessage(badMessages[Math.floor(Math.random() * badMessages.length)]);
            } else {
                // Good item
                this.collectedItems++;
                const goodMessages = [
                    `Pushing Cat found a ${item.name}! +${item.points} pts! <i class="mdi mdi-cat sc-i"></i>`,
                    `${item.name} collected! +${item.points}! <i class="mdi mdi-paw sc-i"></i>`,
                    `${item.name} obtained! Pushing Cat is pleased! <i class="mdi mdi-party-popper sc-i"></i>`,
                    `Very sus finding: ${item.name}! +${item.points}! <i class="mdi mdi-star-shooting sc-i sc-i--gold"></i>`
                ];
                this.showMessage(goodMessages[Math.floor(Math.random() * goodMessages.length)]);
            }
            
            this.updateUI();
            
            // Win condition: collect all GOOD items
            if (this.collectedItems >= this.totalItems) {
                setTimeout(() => this.endGame('win'), 500);
            }
        }
    }

    // Improved room changing logic
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
        
        // Reset cat position to walkable area and render items
        const { w: worldW, h: worldH } = this.getGameWorldSize();
        this.catPosition = { x: worldW * 0.4, y: worldH * 0.7 };
        this.updateCatPosition();
        this.renderItems();
        this.renderPlotPoints();
        
        // Reset hiding flag for new room
        this.hasHiddenInCurrentRoom = false;
        
        this.showMessage(`Sneaking into the ${this.rooms[this.currentRoom].name}... <i class="mdi mdi-magnify sc-i"></i>`);
    }

    toggleHiding() {
        const levelConfig = this.levelConfig[this.currentLevel];
        
        if (!levelConfig.availableRooms.includes('bedroom')) {
            this.showMessage('No Sussy Lair available in this level! <i class="mdi mdi-help-circle sc-i"></i>');
            return;
        }
        
        if (this.currentRoom !== 'bedroom') {
            this.showMessage('Can only hide in the Sussy Lair (bedroom)! <i class="mdi mdi-bed sc-i"></i>');
            return;
        }
        
        if (this.hasHiddenInCurrentRoom && !this.isHiding) {
            this.showMessage('Already used the Sussy Lair in this room! Leave and come back to hide again! <i class="mdi mdi-eye-off sc-i"></i>');
            return;
        }
        
        this.isHiding = !this.isHiding;
        const currentRoom = this.container.querySelector(`.sussy-room-${this.currentRoom}`);
        const catSprite = currentRoom.querySelector('.sussy-cat-sprite');
        
        if (this.isHiding) {
            catSprite.style.opacity = '0.5';
            this.showSpritePose(catSprite, this.spriteHidingPose);
            this.detectionLevel = Math.max(0, this.detectionLevel - 30);
            this.hasHiddenInCurrentRoom = true;
            this.showMessage('Hidden in the Sussy Lair! Sus level decreasing... <i class="mdi mdi-eye-off sc-i"></i>');
        } else {
            catSprite.style.opacity = '1';
            this.updateSpriteFrame(catSprite);
            this.showMessage('Back to being sus! <i class="mdi mdi-cat sc-i"></i>');
        }
        
        this.updateDetectionBar();
    }

    updateUI() {
        this.container.querySelector('.sussy-score-value').textContent = `${this.collectedItems}/${this.totalItems}`;
        this.container.querySelector('.sussy-points-value').textContent = this.score;
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
        
        // Update room detection overlay (red tint as sus rises)
        const overlay = this.container.querySelector(`.sussy-room-${this.currentRoom} .sussy-detection-overlay`);
        if (overlay) {
            if (percentage > 60) {
                const intensity = (percentage - 60) / 40; // 0 to 1 over 60-100%
                overlay.style.backgroundColor = `rgba(255, 0, 0, ${intensity * 0.25})`;
            } else {
                overlay.style.backgroundColor = 'transparent';
            }
        }
        
        // Update cat sprite visual warnings
        const currentRoom = this.container.querySelector(`.sussy-room-${this.currentRoom}`);
        const catSprite = currentRoom?.querySelector('.sussy-cat-sprite');
        if (catSprite) {
            catSprite.classList.remove('sus-warning', 'sus-critical');
            if (percentage > 85) {
                catSprite.classList.add('sus-critical');
            } else if (percentage > 65) {
                catSprite.classList.add('sus-warning');
            }
        }
    }

    showTimeoutScreen() {
        this.gameActive = false;
        clearInterval(this.gameTimer);
        clearInterval(this.gameLoop);
        
        // Stop background music on timeout
        this.stopBackgroundMusic();
        
        const playArea = this.container.querySelector('.sussy-cat-play-area');
        const timeoutScreen = this.container.querySelector('.sussy-cat-timeout-screen');
        const timeoutIcon = this.container.querySelector('.sussy-timeout-icon');
        const timeoutMessage = this.container.querySelector('.sussy-timeout-message p');
        
        playArea.style.display = 'none';
        timeoutScreen.style.display = 'block';
        
        // Hide header on timeout screen
        this.toggleHeader(false);
        
        // Setup timeout icon image
        this.setupTimeoutIcon(timeoutIcon);
        
        // Show random funny timeout message
        const randomMessage = this.timeoutMessages[Math.floor(Math.random() * this.timeoutMessages.length)];
        timeoutMessage.innerHTML = randomMessage;
    }

    showMessage(text) {
        const messageEl = this.container.querySelector('.sussy-message');
        messageEl.innerHTML = text;
        messageEl.style.opacity = '1';
        
        setTimeout(() => {
            messageEl.style.opacity = '0.7';
        }, 2000);
    }

    endGame(reason) {
        this.gameActive = false;
        clearInterval(this.gameTimer);
        clearInterval(this.gameLoop);
        
        // Stop background music when game ends
        this.stopBackgroundMusic();
        
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
        
        // Hide header on end screen
        this.toggleHeader(false);
        
        const levelConfig = this.levelConfig[this.currentLevel];
        
        // Add time bonus to running score
        const bonusPoints = reason === 'win' ? Math.max(0, this.timeLeft * 2) : 0;
        this.score += bonusPoints;
        
        // Update level progress
        this.levelProgress[this.currentLevel] = {
            completed: true,
            score: this.score,
            timeBonus: bonusPoints
        };
        
        const itemScore = this.container.querySelector('.sussy-item-score');
        const totalScore = this.container.querySelector('.sussy-total-score');
        const itemScoreBeforeBonus = this.score - bonusPoints;
        
        levelName.textContent = `Level ${this.currentLevel}: ${levelConfig.name}`;
        finalScore.textContent = `${this.collectedItems}/${this.totalItems}`;
        itemScore.textContent = itemScoreBeforeBonus;
        timeBonus.textContent = bonusPoints;
        totalScore.textContent = this.score;
        
        // Update progress indicators
        this.updateProgressDisplay();
        
        if (reason === 'win') {
            resultTitle.textContent = `Level ${this.currentLevel} Complete!`;
            if (this.collectedItems >= this.totalItems) {
                resultMessage.innerHTML = `Perfect! Pushing Cat collected everything in ${levelConfig.name}! Maximum sus achieved! <i class="mdi mdi-cat sc-i"></i>`;
                
                // Show next level button if not on final level
                if (this.currentLevel < this.maxLevel) {
                    nextLevelBtn.style.display = 'inline-block';
                    nextLevelBtn.innerHTML = `<i class="mdi mdi-cat sc-i"></i> Next Sus Level!`;
                } else {
                    nextLevelBtn.style.display = 'none';
                    resultMessage.innerHTML = '<i class="mdi mdi-party-popper sc-i"></i> ULTIMATE SUS MASTER! Pushing Cat has conquered all levels! The family will never know what hit them! <i class="mdi mdi-cat sc-i"></i><i class="mdi mdi-trophy sc-i sc-i--gold"></i>';
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
                item.innerHTML = `Level ${level}: <i class="mdi mdi-star sc-i sc-i--gold"></i> (${this.levelProgress[level].score} pts)`;
                item.style.color = '#FFD700';
            } else {
                item.innerHTML = `Level ${level}: <i class="mdi mdi-star sc-i sc-i--gold"></i>`;
                item.style.color = '#ccc';
            }
        });
    }

    // Full cleanup — called when window is closed
    destroy() {
        // Stop all intervals
        clearInterval(this.gameTimer);
        clearInterval(this.gameLoop);
        this.gameTimer = null;
        this.gameLoop = null;
        
        // Stop music and release audio
        this.stopBackgroundMusic();
        if (this.backgroundMusic) {
            this.backgroundMusic.src = '';
            this.backgroundMusic = null;
        }
        
        // Remove keyboard listeners
        if (this._keyboardTarget) {
            this._keyboardTarget.removeEventListener('keydown', this._onKeyDown);
            this._keyboardTarget.removeEventListener('keyup', this._onKeyUp);
        }
        
        // Remove event bus listener
        if (this._onWindowClosed) {
            elxaOS.eventBus.off('window.closed', this._onWindowClosed);
        }
        
        this.gameActive = false;
        console.log('🐱 Sussy Cat game cleaned up');
    }

    resetGame(container) {
        // Stop background music when resetting
        this.stopBackgroundMusic();
        
        const initialScreen = container.querySelector('.sussy-cat-initial-screen');
        const startScreen = container.querySelector('.sussy-cat-start-screen');
        const endScreen = container.querySelector('.sussy-cat-end-screen');
        const timeoutScreen = container.querySelector('.sussy-cat-timeout-screen');
        
        endScreen.style.display = 'none';
        initialScreen.style.display = 'none';
        timeoutScreen.style.display = 'none';
        startScreen.style.display = 'block';
        
        // Hide header on reset
        this.toggleHeader(false);
        
        // Reset current level to 1
        this.currentLevel = 1;
        
        // Reset all displays
        container.querySelector('.sussy-level-value').textContent = '1';
        container.querySelector('.sussy-score-value').textContent = '0/12';
        container.querySelector('.sussy-points-value').textContent = '0';
        container.querySelector('.sussy-timer-value').textContent = '2:00';
        container.querySelector('.sussy-detection-fill').style.width = '0%';
        
        // Update music button
        this.updateMusicButton();
        
        // Clear any existing items
        document.querySelectorAll('.sussy-item').forEach(item => item.remove());
        document.querySelectorAll('.sussy-plot-point').forEach(point => point.remove());
        
        // Reset room display properly
        const allRooms = container.querySelectorAll('.sussy-room');
        allRooms.forEach(room => {
            room.classList.remove('active', 'sussy-room-available', 'sussy-room-unavailable');
            room.style.display = '';
        });
        
        // Set living room as initial active room
        const livingRoom = container.querySelector('.sussy-room-living');
        if (livingRoom) {
            livingRoom.classList.add('active');
        }
    }
}