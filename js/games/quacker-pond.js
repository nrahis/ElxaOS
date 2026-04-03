// ============================================
//  QUACKER POND — Duck Management Sim
//  Phase 1: Scene & Sprite Engine
//  Phase 2: Egg Hatching & Naming
//  Phase 3: Feeding & Cleaning
//  Phase 4: Breeding & Color Mixing
//  Phase 5: Selling, Releasing & Economy
// ============================================

class QuackerPond {
    constructor(windowManager, gameData = {}) {
        this.windowManager = windowManager;
        this.gameData = gameData;

        // Native backdrop dimensions
        this.NATIVE_W = 1408;
        this.NATIVE_H = 768;

        // Assets
        this.assets = {
            backdrop: null, spriteSheet: null, splash: null, egg: null,
            food: null, treat1: null, treat2: null, shovel: null, poop: null
        };
        this.assetsLoaded = false;

        // Game state
        this.ducks = [];
        this.selectedDuck = null;
        this.running = false;
        this.animFrameId = null;
        this.lastTime = 0;

        // --- Phase 2: Egg state ---
        this.incubatingEgg = null;
        this.hatchFlashTimer = 0;
        this.DUCK_CAP = 8;
        this.EGG_INCUBATION_TIME = 60;
        this.NEST_POS = { x: 150, y: 660 };
        this.STARTER_COLORS = ['white', 'yellow', 'brown'];

        // --- Phase 3: Feeding & Cleaning ---
        this.activeTool = null;        // null, 'food', 'treat1', 'treat2', 'shovel'
        this.foodItems = [];           // { id, x, y, type, assetKey }
        this.messes = [];              // { id, x, y }

        // Food config: type -> { costSnakes, hungerRestore, happinessBoost, assetKey }
        this.FOOD_CONFIG = {
            food:   { costSnakes: 10, hungerRestore: 30, happinessBoost: 5,  assetKey: 'food' },
            treat1: { costSnakes: 20, hungerRestore: 50, happinessBoost: 15, assetKey: 'treat1' },
            treat2: { costSnakes: 25, hungerRestore: 50, happinessBoost: 25, assetKey: 'treat2' }
        };

        // Timing (seconds)
        this.HUNGER_TICK = 30;
        this.HUNGER_AMOUNT = 10;
        this.MESS_TICK = 45;
        this.EAT_DURATION = 2;
        this.FOOD_SEEK_RANGE = 250;
        this.FOOD_REACH_RANGE = 20;
        this.MESS_UNHAPPY_THRESHOLD = 5;
        this.STARVE_FLEE_TIME = 30;
        this.MESS_CAP = 10;

        // --- Phase 4: Breeding & Color Mixing ---
        this.breedMode = false;
        this.breedDuck1 = null;        // first selected duck for breeding
        this.breedResultTimer = 0;     // timer for showing result message
        this.breedResultMsg = '';
        this.breedResultSuccess = false;

        // Cooldowns (seconds)
        this.BREED_COOLDOWN = 60;
        this.BREED_PAIR_COOLDOWN = 120;
        this.breedPairHistory = [];    // { id1, id2, timestamp }

        // Base breed chance
        this.BREED_BASE_CHANCE = 0.25;
        this.BREED_HAPPY_BONUS = 0.05;
        this.BREED_CLEAN_BONUS = 0.05;
        this.BREED_FED_BONUS = 0.05;

        // Color mixing table: sorted key "colorA|colorB" -> result color
        this.COLOR_MIX_TABLE = {
            'white|yellow': 'cream',
            'white|brown': 'tan',
            'white|red': 'pink',
            'white|blue': 'lightblue',
            'yellow|red': 'orange',
            'yellow|blue': 'green',
            'yellow|brown': 'olive',
            'blue|red': 'purple',
            'brown|red': 'maroon',
            'blue|brown': 'slate',
            'pink|orange': 'red',
            'lightblue|lightblue': 'blue'
        };

        // Extended color filters for bred colors
        this.COLOR_FILTERS = {
            white:     'none',
            yellow:    'sepia(1) saturate(3) brightness(1.1) hue-rotate(10deg)',
            brown:     'sepia(1) saturate(2) brightness(0.7)',
            cream:     'sepia(0.4) saturate(1.5) brightness(1.2)',
            tan:       'sepia(0.7) saturate(1.2) brightness(0.9)',
            pink:      'sepia(0.3) saturate(2) brightness(1.1) hue-rotate(300deg)',
            lightblue: 'sepia(0.3) saturate(2) brightness(1.1) hue-rotate(180deg)',
            red:       'sepia(1) saturate(4) brightness(0.8) hue-rotate(330deg)',
            blue:      'sepia(1) saturate(3) brightness(0.8) hue-rotate(190deg)',
            orange:    'sepia(1) saturate(4) brightness(1.0) hue-rotate(350deg)',
            green:     'sepia(1) saturate(3) brightness(0.9) hue-rotate(90deg)',
            olive:     'sepia(1) saturate(2) brightness(0.7) hue-rotate(50deg)',
            purple:    'sepia(1) saturate(3) brightness(0.7) hue-rotate(250deg)',
            maroon:    'sepia(1) saturate(3) brightness(0.5) hue-rotate(340deg)',
            slate:     'sepia(0.5) saturate(0.8) brightness(0.7) hue-rotate(190deg)',
            speckled:  'sepia(0.2) saturate(1.5) brightness(1.0) contrast(1.3)',
            golden:    'sepia(1) saturate(5) brightness(1.2) hue-rotate(15deg)'
        };

        // Color rarity for sell prices (Phase 5) and mutation checks
        this.COLOR_RARITY = {
            white: 'common', yellow: 'common', brown: 'common',
            cream: 'uncommon', tan: 'uncommon', pink: 'uncommon',
            lightblue: 'uncommon', olive: 'uncommon',
            red: 'rare', blue: 'rare', orange: 'rare', green: 'rare',
            maroon: 'rare', slate: 'rare',
            purple: 'epic', speckled: 'epic',
            golden: 'legendary'
        };

        // --- Phase 5: Selling, Releasing & Economy ---
        this.SELL_PRICES = {
            white: 20, yellow: 25, brown: 25,
            cream: 40, tan: 40, pink: 50, lightblue: 50, olive: 45,
            red: 80, blue: 80, orange: 100, green: 100, maroon: 120, slate: 120,
            purple: 200, speckled: 300, golden: 1000
        };
        this.stats = { totalHatched: 0, totalSold: 0, totalReleased: 0, totalEarnings: 0 };

        // --- Phase 7: Trait System ---
        this.TRAITS = {
            zoomies:    { name: 'Zoomies',    rarity: 'common',   emoji: '\uD83D\uDCA8',  sellBonus: 5  },
            sleepyhead: { name: 'Sleepyhead', rarity: 'common',   emoji: '\uD83D\uDCA4',  sellBonus: 5  },
            quacky:     { name: 'Quacky',     rarity: 'common',   emoji: '',               sellBonus: 5  },
            chonky:     { name: 'Chonky',     rarity: 'common',   emoji: '',               sellBonus: 5  },
            tiny:       { name: 'Tiny',       rarity: 'common',   emoji: '',               sellBonus: 5  },
            friendly:   { name: 'Friendly',   rarity: 'uncommon', emoji: '\uD83D\uDC9B',   sellBonus: 15 },
            splashy:    { name: 'Splashy',    rarity: 'uncommon', emoji: '\uD83D\uDCA6',   sellBonus: 15 },
            dancer:     { name: 'Dancer',     rarity: 'uncommon', emoji: '\uD83C\uDFB5',   sellBonus: 15 },
            hungryboy:  { name: 'Hungry Boy', rarity: 'uncommon', emoji: '',               sellBonus: 15 },
            brave:      { name: 'Brave',      rarity: 'uncommon', emoji: '',               sellBonus: 15 },
            sparkly:    { name: 'Sparkly',    rarity: 'rare',     emoji: '\u2728',         sellBonus: 50 },
            charming:   { name: 'Charming',   rarity: 'rare',     emoji: '\uD83D\uDC95',   sellBonus: 50 },
            lucky:      { name: 'Lucky',      rarity: 'rare',     emoji: '\uD83C\uDF40',   sellBonus: 50 },
            immortal:   { name: 'Immortal',   rarity: 'rare',     emoji: '',               sellBonus: 50 }
        };
        this.TRAIT_POOLS = {
            common:   ['zoomies', 'sleepyhead', 'quacky', 'chonky', 'tiny'],
            uncommon: ['friendly', 'splashy', 'dancer', 'hungryboy', 'brave'],
            rare:     ['sparkly', 'charming', 'lucky', 'immortal']
        };
        this.QUACK_MESSAGES = [
            'QUACK', 'quack!', 'wak', '???', '*angry duck noises*',
            'henlo', ':3', 'quak', '*waddle waddle*', 'honk?',
            'QUAAACK', 'meow-- wait', ':D', '*splash*', 'bread pls'
        ];
        this._pendingSellDuck = null;
        this._pendingReleaseDuck = null;

        // --- In-game currency (NOT tied to bank) ---
        this.coins = 200;  // Starting pocket money (in snakes §)

        // --- Persistence ---
        this.autoSaveInterval = null;
        this.AUTOSAVE_TICK = 30;  // seconds between auto-saves
        this._stateLoaded = false;

        // Sprite sheet config
        this.FRAME_W = 32;
        this.FRAME_H = 32;
        this.SHEET_COLS = 15;
        this.SHEET_ROWS = 17;

        this.ANIMS = {
            walkDown:   { row: 0, frames: 4 },
            walkLeft:   { row: 1, frames: 4 },
            walkRight:  { row: 2, frames: 4 },
            walkUp:     { row: 3, frames: 4 },
            swimDown:   { row: 4, frames: 4 },
            swimLeft:   { row: 5, frames: 4 },
            swimRight:  { row: 6, frames: 4 },
            swimUp:     { row: 7, frames: 4 },
            idle:       { row: 8, frames: 4 },
            eat:        { row: 9, frames: 4 },
            sleep:      { row: 10, frames: 4 }
        };

        this.zones = {
            hatchery: { x: 400, y: 48, w: 415, h: 300 },
            water: [
                { x: 340, y: 310, w: 720, h: 310 },
                { x: 480, y: 250, w: 440, h: 70 }
            ],
            bounds: { x: 30, y: 256, w: 1350, h: 484 }
        };

        this.DUCK_RENDER_SCALE = 2.5;
        this.DUCK_SPEED = 60;
    }

    // =========================================
    //  LAUNCH
    // =========================================
    launch(programInfo) {
        var windowId = 'quacker-pond-' + Date.now();
        var content = this.createInterface(windowId);

        this.windowManager.createWindow(
            windowId,
            (programInfo && programInfo.icon ? programInfo.icon + ' ' : '\uD83E\uDD86 ') +
                (programInfo && programInfo.name ? programInfo.name : 'Quacker Pond'),
            content,
            { width: '1070px', height: '620px', x: '80px', y: '40px' }
        );

        this.windowId = windowId;
        this.setupEventHandlers(windowId);
        this.loadAssets(windowId);
        return windowId;
    }

    // =========================================
    //  CREATE INTERFACE
    // =========================================
    createInterface(windowId) {
        return '<div class="qp-container" id="qp-' + windowId + '">' +
            '<canvas class="qp-canvas" id="qp-canvas-' + windowId + '"></canvas>' +
            '<div class="qp-hud" id="qp-hud-' + windowId + '">' +
                '<div class="qp-hud-stat"><span class="qp-icon">\uD83E\uDD86</span> ' +
                    '<span id="qp-duck-count-' + windowId + '">0</span>/8</div>' +
                '<div class="qp-hud-stat"><span class="qp-icon">\u00A7</span> ' +
                    '<span id="qp-balance-' + windowId + '">\u2014</span></div>' +
                '<div class="qp-hud-tools">' +
                    '<button class="qp-tool-btn" data-tool="food" id="qp-tool-food-' + windowId + '">' +
                        '<img src="./assets/games/quackers/game/food_full.png" alt="food" /> \u00A710</button>' +
                    '<button class="qp-tool-btn" data-tool="treat1" id="qp-tool-treat1-' + windowId + '">' +
                        '<img src="./assets/games/quackers/game/treat_1.png" alt="treat" /> \u00A720</button>' +
                    '<button class="qp-tool-btn" data-tool="treat2" id="qp-tool-treat2-' + windowId + '">' +
                        '<img src="./assets/games/quackers/game/treat_2.png" alt="treat" /> \u00A725</button>' +
                    '<button class="qp-tool-btn" data-tool="shovel" id="qp-tool-shovel-' + windowId + '">' +
                        '<img src="./assets/games/quackers/game/shovel.png" alt="shovel" /></button>' +
                    '<button class="qp-tool-btn qp-breed-btn" data-tool="breed" id="qp-tool-breed-' + windowId + '">' +
                        '\uD83D\uDC95 Breed</button>' +
                '</div>' +
            '</div>' +
            '<div class="qp-duck-info" id="qp-info-' + windowId + '">' +
                '<div class="qp-duck-info-name" id="qp-info-name-' + windowId + '"></div>' +
                '<div class="qp-duck-info-row"><span>Color</span>' +
                    '<span id="qp-info-color-' + windowId + '"></span></div>' +
                '<div class="qp-duck-info-row"><span>Gen</span>' +
                    '<span id="qp-info-gen-' + windowId + '"></span></div>' +
                '<div class="qp-duck-info-row"><span>Hunger</span>' +
                    '<div class="qp-info-bar"><div class="qp-info-bar-fill qp-bar-hunger" ' +
                        'id="qp-info-hunger-' + windowId + '"></div></div></div>' +
                '<div class="qp-duck-info-row"><span>Happy</span>' +
                    '<div class="qp-info-bar"><div class="qp-info-bar-fill qp-bar-happy" ' +
                        'id="qp-info-happy-' + windowId + '"></div></div></div>' +
                '<div class="qp-duck-info-row"><span>Value</span>' +
                    '<span id="qp-info-value-' + windowId + '"></span></div>' +
                '<div class="qp-duck-info-row qp-info-traits-row"><span>Traits</span>' +
                    '<span id="qp-info-traits-' + windowId + '"></span></div>' +
                '<div class="qp-duck-info-actions">' +
                    '<button class="qp-pixel-btn qp-btn-sell" id="qp-sell-btn-' + windowId + '">SELL</button>' +
                    '<button class="qp-pixel-btn qp-btn-release" id="qp-release-btn-' + windowId + '">FREE</button>' +
                '</div>' +
            '</div>' +
            '<div class="qp-dialog-overlay" id="qp-buy-overlay-' + windowId + '">' +
                '<div class="qp-dialog qp-pixel-box">' +
                    '<div class="qp-dialog-title">Hatchery</div>' +
                    '<div class="qp-dialog-body">' +
                        '<img class="qp-dialog-egg-img" src="./assets/games/quackers/game/egg.png" alt="egg" />' +
                        '<div class="qp-dialog-text">Buy an egg?</div>' +
                        '<div class="qp-dialog-price">\u00A750</div>' +
                    '</div>' +
                    '<div class="qp-dialog-buttons">' +
                        '<button class="qp-pixel-btn qp-btn-confirm" id="qp-buy-yes-' + windowId + '">BUY</button>' +
                        '<button class="qp-pixel-btn qp-btn-cancel" id="qp-buy-no-' + windowId + '">CANCEL</button>' +
                    '</div>' +
                    '<div class="qp-dialog-error" id="qp-buy-error-' + windowId + '"></div>' +
                '</div>' +
            '</div>' +
            '<div class="qp-dialog-overlay" id="qp-name-overlay-' + windowId + '">' +
                '<div class="qp-dialog qp-pixel-box">' +
                    '<div class="qp-dialog-title">It hatched!</div>' +
                    '<div class="qp-dialog-body">' +
                        '<div class="qp-dialog-text">Name your duckling:</div>' +
                        '<input type="text" class="qp-name-input qp-pixel-input" ' +
                            'id="qp-name-input-' + windowId + '" maxlength="16" placeholder="..." />' +
                        '<div class="qp-dialog-traits" id="qp-name-traits-' + windowId + '" style="display:none;"></div>' +
                    '</div>' +
                    '<div class="qp-dialog-buttons">' +
                        '<button class="qp-pixel-btn qp-btn-confirm" id="qp-name-ok-' + windowId + '">OK</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="qp-dialog-overlay" id="qp-breed-overlay-' + windowId + '">' +
                '<div class="qp-dialog qp-pixel-box">' +
                    '<div class="qp-dialog-title" id="qp-breed-title-' + windowId + '">Breeding</div>' +
                    '<div class="qp-dialog-body">' +
                        '<div class="qp-dialog-text" id="qp-breed-msg-' + windowId + '"></div>' +
                    '</div>' +
                    '<div class="qp-dialog-buttons">' +
                        '<button class="qp-pixel-btn qp-btn-confirm" id="qp-breed-ok-' + windowId + '">OK</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="qp-dialog-overlay" id="qp-sell-overlay-' + windowId + '">' +
                '<div class="qp-dialog qp-pixel-box">' +
                    '<div class="qp-dialog-title">Sell Duck</div>' +
                    '<div class="qp-dialog-body">' +
                        '<div class="qp-dialog-text" id="qp-sell-msg-' + windowId + '"></div>' +
                        '<div class="qp-dialog-price" id="qp-sell-price-' + windowId + '"></div>' +
                    '</div>' +
                    '<div class="qp-dialog-buttons">' +
                        '<button class="qp-pixel-btn qp-btn-confirm" id="qp-sell-yes-' + windowId + '">SELL</button>' +
                        '<button class="qp-pixel-btn qp-btn-cancel" id="qp-sell-no-' + windowId + '">KEEP</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="qp-dialog-overlay" id="qp-release-overlay-' + windowId + '">' +
                '<div class="qp-dialog qp-pixel-box">' +
                    '<div class="qp-dialog-title">Release Duck</div>' +
                    '<div class="qp-dialog-body">' +
                        '<div class="qp-dialog-text" id="qp-release-msg-' + windowId + '"></div>' +
                    '</div>' +
                    '<div class="qp-dialog-buttons">' +
                        '<button class="qp-pixel-btn qp-btn-cancel" id="qp-release-yes-' + windowId + '">SET FREE</button>' +
                        '<button class="qp-pixel-btn qp-btn-confirm" id="qp-release-no-' + windowId + '">KEEP</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="qp-breed-prompt" id="qp-breed-prompt-' + windowId + '"></div>' +
            '<div class="qp-splash" id="qp-splash-' + windowId + '" style="display:none;">' +
                '<div class="qp-splash-gradient"></div>' +
                '<button class="qp-splash-btn" id="qp-splash-btn-' + windowId + '">CLICK TO START</button>' +
            '</div>' +
            '<div class="qp-loading" id="qp-loading-' + windowId + '">' +
                '<div class="qp-loading-text">Loading Quacker Pond...</div>' +
                '<div class="qp-loading-bar"><div class="qp-loading-bar-fill" ' +
                    'id="qp-load-fill-' + windowId + '"></div></div>' +
            '</div>' +
        '</div>';
    }

    // =========================================
    //  ASSET LOADING
    // =========================================
    loadAssets(windowId) {
        var self = this;
        var loaded = 0;
        var total = 9;
        var fillEl = document.getElementById('qp-load-fill-' + windowId);

        function onLoad() {
            loaded++;
            if (fillEl) fillEl.style.width = Math.round((loaded / total) * 100) + '%';
            if (loaded >= total) {
                self.assetsLoaded = true;
                var loadingEl = document.getElementById('qp-loading-' + windowId);
                if (loadingEl) loadingEl.style.display = 'none';
                self.initGame(windowId);
            }
        }

        function loadImg(key, path) {
            var img = new Image();
            img.onload = onLoad;
            img.onerror = function() { console.error('Failed to load: ' + path); onLoad(); };
            img.src = path;
            self.assets[key] = img;
        }

        loadImg('backdrop',    './assets/games/quackers/game/backdrop.png');
        loadImg('spriteSheet', './assets/games/quackers/game/SpriteSheet.png');
        loadImg('splash',      './assets/games/quackers/game/splash.png');
        loadImg('egg',         './assets/games/quackers/game/egg.png');
        loadImg('food',        './assets/games/quackers/game/food_full.png');
        loadImg('treat1',      './assets/games/quackers/game/treat_1.png');
        loadImg('treat2',      './assets/games/quackers/game/treat_2.png');
        loadImg('shovel',      './assets/games/quackers/game/shovel.png');
        loadImg('poop',        './assets/games/quackers/game/poop.png');
    }

    // =========================================
    //  INIT / SPLASH / START
    // =========================================
    initGame(windowId) {
        var canvas = document.getElementById('qp-canvas-' + windowId);
        if (!canvas) return;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resizeCanvas();
        if (this.assets.backdrop && this.assets.backdrop.complete) {
            this.ctx.drawImage(this.assets.backdrop, 0, 0, canvas.width, canvas.height);
        }
        this.showSplash(windowId);
    }

    showSplash(windowId) {
        var splashEl = document.getElementById('qp-splash-' + windowId);
        if (splashEl && this.assets.splash && this.assets.splash.complete) {
            splashEl.style.backgroundImage = 'url(' + this.assets.splash.src + ')';
            splashEl.style.display = '';
        }
        var self = this;
        var btn = document.getElementById('qp-splash-btn-' + windowId);
        if (btn) btn.addEventListener('click', function() { self.dismissSplash(windowId); });
    }

    dismissSplash(windowId) {
        var splashEl = document.getElementById('qp-splash-' + windowId);
        if (splashEl) splashEl.style.display = 'none';
        this.startGame();
    }

    startGame() {
        var self = this;
        // Load saved state, then start game loop
        this.loadState().then(function(loaded) {
            self.updateBalance();
            self.updateDuckCount();
            self.running = true;
            self.lastTime = performance.now();
            self.animFrameId = requestAnimationFrame(function tick(now) {
                if (!self.running) return;
                self.update(now);
                self.render();
                self.animFrameId = requestAnimationFrame(tick);
            });
            // Auto-save every 30 seconds
            self.autoSaveInterval = setInterval(function() {
                if (self.running) self.saveState();
            }, self.AUTOSAVE_TICK * 1000);
        });
    }

    // =========================================
    //  BALANCE HELPERS (in-game currency only)
    // =========================================
    updateBalance() {
        var el = document.getElementById('qp-balance-' + this.windowId);
        if (el) el.textContent = this.coins;
    }

    canAfford(snakes) {
        return this.coins >= snakes;
    }

    spendCoins(amount) {
        if (this.coins < amount) return false;
        this.coins -= amount;
        this.updateBalance();
        return true;
    }

    earnCoins(amount) {
        this.coins += amount;
        this.updateBalance();
    }

    resizeCanvas() {
        if (!this.canvas) return;
        var container = this.canvas.parentElement;
        if (!container) return;
        var w = container.clientWidth;
        var h = container.clientHeight - 40;
        this.canvas.width = w;
        this.canvas.height = h;
        this.scaleX = w / this.NATIVE_W;
        this.scaleY = h / this.NATIVE_H;
    }

    // =========================================
    //  DUCK SPAWNING
    // =========================================
    spawnDuck(name, color, x, y, generation, parents, traits) {
        var duck = {
            id: 'duck_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            name: name, color: color,
            generation: generation || 1,
            parents: parents || null,
            traits: traits || [],
            x: x, y: y,
            direction: 'down', animFrame: 0, animTimer: 0, zone: 'land',
            wanderDirX: 0, wanderDirY: 0, wanderTimer: 0, wanderPause: false,
            hunger: 100, happiness: 80,
            hungerTimer: 0, messTimer: 0,
            eatTarget: null, eating: false, eatTimer: 0,
            starveTimer: 0,
            lastBredAttempt: 0,
            sleeping: false, sleepTimer: 0,
            // Trait animation state (transient — not saved)
            sprintTimer: 8 + Math.random() * 10,
            sprinting: false, sprintDuration: 0,
            quackTimer: 6 + Math.random() * 10,
            quackMsg: '', quackShowTimer: 0,
            danceTimer: 15 + Math.random() * 20,
            dancing: false, danceAngle: 0,
            splashTimer: 0,
            sparkles: [],
            hearts: []
        };
        this.ducks.push(duck);
        this.updateDuckCount();
        return duck;
    }

    updateDuckCount() {
        var el = document.getElementById('qp-duck-count-' + this.windowId);
        if (el) el.textContent = this.ducks.length;
    }

    // =========================================
    //  ZONE HELPERS
    // =========================================
    pointInRect(px, py, r) {
        return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
    }

    isInWater(x, y) {
        for (var i = 0; i < this.zones.water.length; i++) {
            if (this.pointInRect(x, y, this.zones.water[i])) return true;
        }
        return false;
    }

    isInHatchery(x, y) { return this.pointInRect(x, y, this.zones.hatchery); }

    isWalkable(x, y) {
        if (!this.pointInRect(x, y, this.zones.bounds)) return false;
        if (this.isInHatchery(x, y)) return false;
        return true;
    }

    isOnLand(x, y) { return this.isWalkable(x, y) && !this.isInWater(x, y); }

    // =========================================
    //  TRAIT SYSTEM
    // =========================================
    hasTrait(duck, traitId) {
        return duck.traits && duck.traits.indexOf(traitId) !== -1;
    }

    rollEggTraits() {
        var roll = Math.random();
        if (roll < 0.50) return [];                   // 50% no traits
        var pool = this.TRAIT_POOLS.common;
        if (roll < 0.90) {                            // 40% one common trait
            return [pool[Math.floor(Math.random() * pool.length)]];
        }
        // 10% two common traits
        var t1 = pool[Math.floor(Math.random() * pool.length)];
        var t2 = t1;
        var safety = 0;
        while (t2 === t1 && safety < 20) {
            t2 = pool[Math.floor(Math.random() * pool.length)];
            safety++;
        }
        return [t1, t2];
    }

    rollBredTraits(parent1, parent2) {
        var inherited = [];
        var i, t;

        // Check each parent's traits for inheritance
        var p1Traits = parent1.traits || [];
        var p2Traits = parent2.traits || [];

        for (i = 0; i < p1Traits.length; i++) {
            t = p1Traits[i];
            // If both parents share this trait: 80% chance
            var shared = p2Traits.indexOf(t) !== -1;
            var chance = shared ? 0.80 : 0.45;
            if (Math.random() < chance && inherited.indexOf(t) === -1) {
                inherited.push(t);
            }
        }
        for (i = 0; i < p2Traits.length; i++) {
            t = p2Traits[i];
            if (inherited.indexOf(t) !== -1) continue;  // already inherited
            if (Math.random() < 0.45) {
                inherited.push(t);
            }
        }

        // 12% chance of random mutation trait
        if (Math.random() < 0.12) {
            var mutRoll = Math.random();
            var mutPool;
            if (mutRoll < 0.60) mutPool = this.TRAIT_POOLS.common;
            else if (mutRoll < 0.90) mutPool = this.TRAIT_POOLS.uncommon;
            else mutPool = this.TRAIT_POOLS.rare;
            var mutTrait = mutPool[Math.floor(Math.random() * mutPool.length)];
            if (inherited.indexOf(mutTrait) === -1) inherited.push(mutTrait);
        }

        // Cap at 2 traits — keep the rarest
        if (inherited.length > 2) {
            var self = this;
            var rarityOrder = { rare: 0, uncommon: 1, common: 2 };
            inherited.sort(function(a, b) {
                var ra = self.TRAITS[a] ? rarityOrder[self.TRAITS[a].rarity] || 2 : 2;
                var rb = self.TRAITS[b] ? rarityOrder[self.TRAITS[b].rarity] || 2 : 2;
                return ra - rb;
            });
            inherited = inherited.slice(0, 2);
        }

        return inherited;
    }

    getTraitDisplayName(traitId) {
        var t = this.TRAITS[traitId];
        if (!t) return traitId;
        if (t.rarity === 'rare') return '\u2728 ' + t.name;
        return t.name;
    }

    // =========================================
    //  UPDATE
    // =========================================
    update(now) {
        var dt = (now - this.lastTime) / 1000;
        this.lastTime = now;
        if (dt > 0.2) dt = 0.2;

        for (var i = this.ducks.length - 1; i >= 0; i--) {
            this.updateDuck(this.ducks[i], dt, i);
        }

        this.updateEggIncubation(dt);
        if (this.hatchFlashTimer > 0) this.hatchFlashTimer -= dt;
        if (this.selectedDuck) this.updateDuckInfoPanel();
    }

    updateDuck(duck, dt, index) {
        // --- Releasing: walk off-screen ---
        if (duck.releasing) {
            duck.animTimer += dt;
            if (duck.animTimer >= 0.18) { duck.animTimer = 0; duck.animFrame++; }
            var speed = this.DUCK_SPEED * 1.5;
            duck.x += duck.wanderDirX * speed * dt;
            duck.direction = duck.wanderDirX > 0 ? 'right' : 'left';
            if (duck.x < -50 || duck.x > this.NATIVE_W + 50) {
                this.ducks.splice(index, 1);
                this.updateDuckCount();
            }
            return;
        }

        duck.animTimer += dt;
        if (duck.animTimer >= 0.18) { duck.animTimer = 0; duck.animFrame++; }

        // --- Hunger decay ---
        duck.hungerTimer += dt;
        if (duck.hungerTimer >= this.HUNGER_TICK) {
            duck.hungerTimer = 0;
            var hungerFloor = this.hasTrait(duck, 'immortal') ? 10 : 0;
            duck.hunger = Math.max(hungerFloor, duck.hunger - this.HUNGER_AMOUNT);
        }

        // --- Happiness drift ---
        var happyTarget = 80;
        if (duck.hunger < 30) happyTarget -= 30;
        else if (duck.hunger < 60) happyTarget -= 10;
        var messCount = this.messes.length;
        if (messCount > this.MESS_UNHAPPY_THRESHOLD) {
            happyTarget -= (messCount - this.MESS_UNHAPPY_THRESHOLD) * 5;
        }
        if (happyTarget < 0) happyTarget = 0;
        if (duck.happiness > happyTarget) {
            duck.happiness = Math.max(happyTarget, duck.happiness - 2 * dt);
        } else if (duck.happiness < happyTarget) {
            duck.happiness = Math.min(happyTarget, duck.happiness + 1 * dt);
        }

        // --- Starvation ---
        if (duck.hunger <= 0) {
            duck.starveTimer += dt;
            if (duck.starveTimer >= this.STARVE_FLEE_TIME) {
                this.ducks.splice(index, 1);
                this.updateDuckCount();
                if (this.selectedDuck && this.selectedDuck.id === duck.id) {
                    this.selectedDuck = null;
                    this.updateDuckInfoPanel();
                }
                return;
            }
        } else {
            duck.starveTimer = 0;
        }

        // --- Mess generation ---
        if (!duck.eating) {
            duck.messTimer += dt;
            if (duck.messTimer >= this.MESS_TICK) {
                duck.messTimer = 0;
                if (this.messes.length < this.MESS_CAP && !this.isInWater(duck.x, duck.y)) {
                    this.messes.push({
                        id: 'mess_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
                        x: duck.x + (Math.random() - 0.5) * 20,
                        y: duck.y + (Math.random() - 0.5) * 10
                    });
                }
            }
        }

        // --- Eating ---
        if (duck.eating) {
            duck.eatTimer -= dt;
            duck.wanderDirX = 0;
            duck.wanderDirY = 0;
            if (duck.eatTimer <= 0) { duck.eating = false; duck.eatTarget = null; }
            return;
        }

        // --- Sleeping ---
        if (duck.sleeping) {
            duck.sleepTimer -= dt;
            duck.wanderDirX = 0;
            duck.wanderDirY = 0;
            // Wake up if starving or timer expired
            if (duck.sleepTimer <= 0 || duck.hunger < 15) {
                duck.sleeping = false;
                duck.wanderPause = false;
                duck.wanderTimer = 0.5 + Math.random() * 1.0;
                // Pick a new direction on wake
                var wakeAngle = Math.random() * Math.PI * 2;
                duck.wanderDirX = Math.cos(wakeAngle);
                duck.wanderDirY = Math.sin(wakeAngle);
            }
            return;
        }

        // --- Trait behaviors ---
        // Zoomies: sprint burst
        if (this.hasTrait(duck, 'zoomies')) {
            if (duck.sprinting) {
                duck.sprintDuration -= dt;
                if (duck.sprintDuration <= 0) {
                    duck.sprinting = false;
                    duck.sprintTimer = 10 + Math.random() * 15;
                }
            } else {
                duck.sprintTimer -= dt;
                if (duck.sprintTimer <= 0 && !duck.eating && !duck.sleeping) {
                    duck.sprinting = true;
                    duck.sprintDuration = 2 + Math.random();
                    // Random zig-zag direction
                    var za = Math.random() * Math.PI * 2;
                    duck.wanderDirX = Math.cos(za);
                    duck.wanderDirY = Math.sin(za);
                    duck.wanderPause = false;
                    duck.wanderTimer = duck.sprintDuration;
                }
            }
        }

        // Dancer: periodic spin
        if (this.hasTrait(duck, 'dancer') && !duck.eating && !duck.sleeping) {
            if (duck.dancing) {
                duck.danceAngle += dt * Math.PI * 2;  // full rotation in ~1s
                if (duck.danceAngle >= Math.PI * 2) {
                    duck.dancing = false;
                    duck.danceAngle = 0;
                    duck.danceTimer = 20 + Math.random() * 15;
                }
                duck.wanderDirX = 0;
                duck.wanderDirY = 0;
            } else {
                duck.danceTimer -= dt;
                if (duck.danceTimer <= 0 && duck.wanderPause) {
                    duck.dancing = true;
                    duck.danceAngle = 0;
                }
            }
        }

        // Quacky: speech bubbles
        if (this.hasTrait(duck, 'quacky')) {
            if (duck.quackShowTimer > 0) {
                duck.quackShowTimer -= dt;
            } else {
                duck.quackTimer -= dt;
                if (duck.quackTimer <= 0) {
                    duck.quackMsg = this.QUACK_MESSAGES[Math.floor(Math.random() * this.QUACK_MESSAGES.length)];
                    duck.quackShowTimer = 2.5;
                    duck.quackTimer = 8 + Math.random() * 10;
                }
            }
        }

        // Splashy: splash VFX timer countdown
        if (duck.splashTimer > 0) duck.splashTimer -= dt;

        // Sparkly: manage sparkle particles
        if (this.hasTrait(duck, 'sparkly')) {
            // Add new sparkles
            if (duck.sparkles.length < 3 && Math.random() < dt * 2) {
                duck.sparkles.push({
                    ox: (Math.random() - 0.5) * 40,
                    oy: -10 - Math.random() * 50,
                    life: 0.8 + Math.random() * 0.6
                });
            }
            // Update sparkles
            for (var si = duck.sparkles.length - 1; si >= 0; si--) {
                duck.sparkles[si].life -= dt;
                duck.sparkles[si].oy -= dt * 15;
                if (duck.sparkles[si].life <= 0) duck.sparkles.splice(si, 1);
            }
        }

        // Charming: hearts near other ducks
        if (this.hasTrait(duck, 'charming')) {
            var nearDuck = false;
            for (var ci = 0; ci < this.ducks.length; ci++) {
                if (this.ducks[ci].id === duck.id) continue;
                var cdx = this.ducks[ci].x - duck.x;
                var cdy = this.ducks[ci].y - duck.y;
                if (cdx * cdx + cdy * cdy < 80 * 80) { nearDuck = true; break; }
            }
            if (nearDuck && duck.hearts.length < 2 && Math.random() < dt * 1.5) {
                duck.hearts.push({
                    ox: (Math.random() - 0.5) * 30,
                    oy: -20 - Math.random() * 20,
                    life: 1.0 + Math.random() * 0.5
                });
            }
            for (var hi = duck.hearts.length - 1; hi >= 0; hi--) {
                duck.hearts[hi].life -= dt;
                duck.hearts[hi].oy -= dt * 25;
                if (duck.hearts[hi].life <= 0) duck.hearts.splice(hi, 1);
            }
        }

        // --- Food seeking ---
        if (duck.hunger < 80 && this.foodItems.length > 0 && !duck.eatTarget) {
            var seekRange = this.hasTrait(duck, 'hungryboy') ? this.FOOD_SEEK_RANGE * 2 : this.FOOD_SEEK_RANGE;
            var nearest = null;
            var nearestDist = seekRange;
            for (var f = 0; f < this.foodItems.length; f++) {
                var food = this.foodItems[f];
                var fdx = food.x - duck.x;
                var fdy = food.y - duck.y;
                var dist = Math.sqrt(fdx * fdx + fdy * fdy);
                if (dist < nearestDist) { nearest = food; nearestDist = dist; }
            }
            if (nearest) duck.eatTarget = nearest.id;
        }

        // --- Walk toward food ---
        if (duck.eatTarget) {
            var targetFood = null;
            for (var fi = 0; fi < this.foodItems.length; fi++) {
                if (this.foodItems[fi].id === duck.eatTarget) { targetFood = this.foodItems[fi]; break; }
            }
            if (!targetFood) {
                duck.eatTarget = null;
            } else {
                var tdx = targetFood.x - duck.x;
                var tdy = targetFood.y - duck.y;
                var tDist = Math.sqrt(tdx * tdx + tdy * tdy);
                if (tDist < this.FOOD_REACH_RANGE) {
                    duck.eating = true;
                    duck.eatTimer = this.hasTrait(duck, 'hungryboy')
                        ? this.EAT_DURATION * 1.5 : this.EAT_DURATION;
                    duck.wanderDirX = 0;
                    duck.wanderDirY = 0;
                    var cfg = this.FOOD_CONFIG[targetFood.type];
                    duck.hunger = Math.min(100, duck.hunger + (cfg ? cfg.hungerRestore : 30));
                    duck.happiness = Math.min(100, duck.happiness + (cfg ? cfg.happinessBoost : 5));
                    for (var ri = this.foodItems.length - 1; ri >= 0; ri--) {
                        if (this.foodItems[ri].id === targetFood.id) { this.foodItems.splice(ri, 1); break; }
                    }
                    return;
                } else {
                    duck.wanderDirX = tdx / tDist;
                    duck.wanderDirY = tdy / tDist;
                    duck.wanderPause = false;
                    duck.wanderTimer = 1;
                }
            }
        }

        // --- Normal wander ---
        if (!duck.eatTarget) {
            duck.wanderTimer -= dt;
            if (duck.wanderTimer <= 0) {
                if (duck.wanderPause) {
                    var angle = Math.random() * Math.PI * 2;
                    duck.wanderDirX = Math.cos(angle);
                    duck.wanderDirY = Math.sin(angle);

                    // Friendly: bias toward nearest duck (70% chance)
                    if (this.hasTrait(duck, 'friendly') && this.ducks.length > 1 && Math.random() < 0.70) {
                        var closestDuck = null;
                        var closestDist = 9999;
                        for (var fi = 0; fi < this.ducks.length; fi++) {
                            if (this.ducks[fi].id === duck.id) continue;
                            var fdx2 = this.ducks[fi].x - duck.x;
                            var fdy2 = this.ducks[fi].y - duck.y;
                            var fd2 = Math.sqrt(fdx2 * fdx2 + fdy2 * fdy2);
                            if (fd2 < closestDist) { closestDist = fd2; closestDuck = this.ducks[fi]; }
                        }
                        if (closestDuck && closestDist > 30) {
                            var toX = closestDuck.x - duck.x;
                            var toY = closestDuck.y - duck.y;
                            var toLen = Math.sqrt(toX * toX + toY * toY);
                            duck.wanderDirX = toX / toLen;
                            duck.wanderDirY = toY / toLen;
                        }
                    }

                    // Splashy: bias toward water center (70% chance)
                    if (this.hasTrait(duck, 'splashy') && duck.zone === 'land' && Math.random() < 0.70) {
                        var waterCenter = this.zones.water[0];
                        var wcx = waterCenter.x + waterCenter.w / 2;
                        var wcy = waterCenter.y + waterCenter.h / 2;
                        var twx = wcx - duck.x;
                        var twy = wcy - duck.y;
                        var twLen = Math.sqrt(twx * twx + twy * twy);
                        if (twLen > 0) {
                            duck.wanderDirX = twx / twLen;
                            duck.wanderDirY = twy / twLen;
                        }
                    }

                    duck.wanderPause = false;
                    duck.wanderTimer = 1.5 + Math.random() * 2.5;
                } else {
                    duck.wanderDirX = 0;
                    duck.wanderDirY = 0;
                    duck.wanderPause = true;
                    duck.wanderTimer = 0.5 + Math.random() * 1.5;
                    // Sleep chance: Sleepyhead trait = 40%, normal = 15%
                    var sleepChance = this.hasTrait(duck, 'sleepyhead') ? 0.40 : 0.15;
                    if (duck.zone === 'land' && duck.hunger > 20 && Math.random() < sleepChance) {
                        duck.sleeping = true;
                        duck.sleepTimer = this.hasTrait(duck, 'sleepyhead')
                            ? (5 + Math.random() * 7)    // 5-12 seconds
                            : (3 + Math.random() * 5);   // 3-8 seconds
                    }
                }
            }
        }

        // --- Movement ---
        if (duck.wanderDirX !== 0 || duck.wanderDirY !== 0) {
            var speed = this.DUCK_SPEED;
            if (duck.zone === 'water') speed *= 0.6;
            if (duck.hunger < 20) speed *= 0.5;
            // Zoomies sprint boost
            if (duck.sprinting) speed *= 2;

            var newX = duck.x + duck.wanderDirX * speed * dt;
            var newY = duck.y + duck.wanderDirY * speed * dt;

            if (this.isWalkable(newX, newY)) {
                // Splashy: detect water entry
                var wasInWater = this.isInWater(duck.x, duck.y);
                duck.x = newX;
                duck.y = newY;
                // Splashy: trigger splash on water entry
                if (this.hasTrait(duck, 'splashy') && !wasInWater && this.isInWater(newX, newY)) {
                    duck.splashTimer = 0.6;
                }
            } else {
                duck.wanderDirX = -duck.wanderDirX + (Math.random() - 0.5) * 0.5;
                duck.wanderDirY = -duck.wanderDirY + (Math.random() - 0.5) * 0.5;
                var len = Math.sqrt(duck.wanderDirX * duck.wanderDirX + duck.wanderDirY * duck.wanderDirY);
                if (len > 0) { duck.wanderDirX /= len; duck.wanderDirY /= len; }
                if (duck.eatTarget) duck.eatTarget = null;
            }

            if (Math.abs(duck.wanderDirX) > Math.abs(duck.wanderDirY)) {
                duck.direction = duck.wanderDirX > 0 ? 'right' : 'left';
            } else {
                duck.direction = duck.wanderDirY > 0 ? 'down' : 'up';
            }
        }

        duck.zone = this.isInWater(duck.x, duck.y) ? 'water' : 'land';
    }

    // =========================================
    //  EGG INCUBATION
    // =========================================
    updateEggIncubation(dt) {
        if (!this.incubatingEgg) return;
        this.incubatingEgg.elapsed += dt;
        if (this.incubatingEgg.elapsed >= this.EGG_INCUBATION_TIME) this.hatchEgg();
    }

    // =========================================
    //  TOOL SYSTEM
    // =========================================
    setActiveTool(tool) {
        if (tool === 'breed') {
            if (this.breedMode) {
                this.cancelBreedMode();
            } else {
                this.startBreedMode();
            }
            return;
        }
        if (this.breedMode) this.cancelBreedMode();
        this.activeTool = (this.activeTool === tool) ? null : tool;
        this.updateToolButtons();
        var container = document.getElementById('qp-' + this.windowId);
        if (container) container.style.cursor = this.activeTool ? 'crosshair' : 'default';
    }

    updateToolButtons() {
        var tools = ['food', 'treat1', 'treat2', 'shovel'];
        for (var i = 0; i < tools.length; i++) {
            var btn = document.getElementById('qp-tool-' + tools[i] + '-' + this.windowId);
            if (btn) {
                if (this.activeTool === tools[i]) btn.classList.add('active');
                else btn.classList.remove('active');
            }
        }
        var breedBtn = document.getElementById('qp-tool-breed-' + this.windowId);
        if (breedBtn) {
            if (this.breedMode) breedBtn.classList.add('active');
            else breedBtn.classList.remove('active');
        }
    }

    // =========================================
    //  FOOD PLACEMENT
    // =========================================
    placeFood(type, nativeX, nativeY) {
        var cfg = this.FOOD_CONFIG[type];
        if (!cfg) return;
        if (!this.isOnLand(nativeX, nativeY)) return;
        if (!this.canAfford(cfg.costSnakes)) return;

        if (this.spendCoins(cfg.costSnakes)) {
            this._addFoodItem(type, nativeX, nativeY, cfg.assetKey);
            this.activeTool = null;
            this.updateToolButtons();
            var c = document.getElementById('qp-' + this.windowId);
            if (c) c.style.cursor = 'default';
        }
    }

    _addFoodItem(type, x, y, assetKey) {
        this.foodItems.push({
            id: 'food_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            x: x, y: y, type: type, assetKey: assetKey
        });
    }

    // =========================================
    //  MESS CLEANING
    // =========================================
    cleanMess(nativeX, nativeY) {
        var hitRadius = 60;
        var cleaned = 0;
        for (var i = this.messes.length - 1; i >= 0; i--) {
            var m = this.messes[i];
            var dx = nativeX - m.x;
            var dy = nativeY - m.y;
            if (dx * dx + dy * dy < hitRadius * hitRadius) {
                this.messes.splice(i, 1);
                cleaned++;
            }
        }
        return cleaned;
    }

    // =========================================
    //  BREEDING SYSTEM
    // =========================================
    startBreedMode() {
        if (this.ducks.length < 2) {
            this.showBreedResult('Need at least 2 ducks to breed!', false);
            return;
        }
        if (this.incubatingEgg) {
            this.showBreedResult('An egg is already incubating!', false);
            return;
        }
        if (this.ducks.length >= this.DUCK_CAP) {
            this.showBreedResult('Pond is full! Sell or release a duck first.', false);
            return;
        }
        this.breedMode = true;
        this.breedDuck1 = null;
        this.activeTool = null;
        this.updateToolButtons();
        this.showBreedPrompt('Click the first duck to breed...');
        var container = document.getElementById('qp-' + this.windowId);
        if (container) container.style.cursor = 'pointer';
    }

    cancelBreedMode() {
        this.breedMode = false;
        this.breedDuck1 = null;
        this.showBreedPrompt('');
        var container = document.getElementById('qp-' + this.windowId);
        if (container) container.style.cursor = 'default';
        var btn = document.getElementById('qp-tool-breed-' + this.windowId);
        if (btn) btn.classList.remove('active');
    }

    handleBreedClick(nativeX, nativeY) {
        var hitRadius = 40;
        var found = null;
        for (var i = this.ducks.length - 1; i >= 0; i--) {
            var d = this.ducks[i];
            if (d.releasing) continue;
            var dx = nativeX - d.x;
            var dy = nativeY - d.y;
            if (dx * dx + dy * dy < hitRadius * hitRadius) { found = d; break; }
        }

        if (!found) return;

        if (!this.breedDuck1) {
            // Check cooldown on this duck
            var now = performance.now() / 1000;
            var duckCooldownLeft = this.BREED_COOLDOWN - (now - (found.lastBredAttempt || 0));
            if (found.lastBredAttempt && duckCooldownLeft > 0) {
                this.showBreedPrompt(found.name + ' needs ' + Math.ceil(duckCooldownLeft) + 's cooldown');
                return;
            }
            this.breedDuck1 = found;
            this.selectedDuck = found;
            this.updateDuckInfoPanel();
            this.showBreedPrompt('Now click the second duck...');
        } else {
            if (found.id === this.breedDuck1.id) {
                this.showBreedPrompt('Pick a DIFFERENT duck!');
                return;
            }
            // Check cooldown on second duck
            var now2 = performance.now() / 1000;
            var duck2CooldownLeft = this.BREED_COOLDOWN - (now2 - (found.lastBredAttempt || 0));
            if (found.lastBredAttempt && duck2CooldownLeft > 0) {
                this.showBreedPrompt(found.name + ' needs ' + Math.ceil(duck2CooldownLeft) + 's cooldown');
                return;
            }
            // Check pair cooldown
            if (this.isPairOnCooldown(this.breedDuck1.id, found.id)) {
                this.showBreedPrompt('This pair needs more time apart!');
                return;
            }
            this.attemptBreed(this.breedDuck1, found);
        }
    }

    isPairOnCooldown(id1, id2) {
        var now = performance.now() / 1000;
        for (var i = 0; i < this.breedPairHistory.length; i++) {
            var h = this.breedPairHistory[i];
            var match = (h.id1 === id1 && h.id2 === id2) || (h.id1 === id2 && h.id2 === id1);
            if (match && (now - h.timestamp) < this.BREED_PAIR_COOLDOWN) return true;
        }
        return false;
    }

    recordPairCooldown(id1, id2) {
        this.breedPairHistory.push({ id1: id1, id2: id2, timestamp: performance.now() / 1000 });
        // Prune old entries
        var now = performance.now() / 1000;
        var self = this;
        this.breedPairHistory = this.breedPairHistory.filter(function(h) {
            return (now - h.timestamp) < self.BREED_PAIR_COOLDOWN;
        });
    }

    attemptBreed(duck1, duck2) {
        var now = performance.now() / 1000;
        duck1.lastBredAttempt = now;
        duck2.lastBredAttempt = now;
        this.recordPairCooldown(duck1.id, duck2.id);

        // Calculate breed chance
        var chance = this.BREED_BASE_CHANCE;
        if (duck1.happiness >= 70 && duck2.happiness >= 70) chance += this.BREED_HAPPY_BONUS;
        if (this.messes.length <= this.MESS_UNHAPPY_THRESHOLD) chance += this.BREED_CLEAN_BONUS;
        if (duck1.hunger >= 50 && duck2.hunger >= 50) chance += this.BREED_FED_BONUS;
        // Charming trait bonus
        if (this.hasTrait(duck1, 'charming') || this.hasTrait(duck2, 'charming')) chance += 0.10;

        this.cancelBreedMode();

        var roll = Math.random();
        if (roll < chance) {
            var babyColor = this.getBreedColor(duck1.color, duck2.color,
                this.hasTrait(duck1, 'lucky') || this.hasTrait(duck2, 'lucky'));
            var gen = Math.max(duck1.generation || 1, duck2.generation || 1) + 1;
            var babyTraits = this.rollBredTraits(duck1, duck2);
            this.incubatingEgg = {
                color: babyColor,
                startTime: performance.now(),
                elapsed: 0,
                parents: [duck1.id, duck2.id],
                generation: gen,
                traits: babyTraits
            };
            this.showBreedResult(
                duck1.name + ' and ' + duck2.name + ' hit it off!\nA ' + babyColor + ' egg appeared!',
                true
            );
        } else {
            var fails = [
                'They just stared at each other awkwardly.',
                'Quack off!',
                duck2.name + ' waddled away unimpressed.',
                'They splashed water at each other instead.',
                duck1.name + ' fell asleep mid-introduction.',
                'Not feeling the vibe today...',
                'They bonked beaks and walked away.',
                duck1.name + ' got distracted by a bug.'
            ];
            var msg = fails[Math.floor(Math.random() * fails.length)];
            this.showBreedResult(msg, false);
        }
    }

    getBreedColor(color1, color2, hasLucky) {
        var luckyBoost = hasLucky ? 0.05 : 0;
        // Same color parents
        if (color1 === color2) {
            var r1 = this.COLOR_RARITY[color1] || 'common';
            if (r1 === 'rare' && Math.random() < (0.10 + luckyBoost)) return 'speckled';
            if (r1 === 'epic' && Math.random() < (0.05 + luckyBoost)) return 'golden';
            if (Math.random() < (0.8 - luckyBoost * 2)) return color1;
            // Random variant: pick a random uncommon
            var uncommons = ['cream', 'tan', 'pink', 'lightblue', 'olive'];
            return uncommons[Math.floor(Math.random() * uncommons.length)];
        }

        // Check mixing table (sorted key)
        var sorted = [color1, color2].sort();
        var key = sorted[0] + '|' + sorted[1];
        var mixed = this.COLOR_MIX_TABLE[key];

        if (mixed) {
            // Cross-rarity mutation checks
            var ra = this.COLOR_RARITY[color1] || 'common';
            var rb = this.COLOR_RARITY[color2] || 'common';
            if ((ra === 'rare' && rb === 'rare') && Math.random() < (0.10 + luckyBoost)) return 'speckled';
            if ((ra === 'epic' && rb === 'epic') && Math.random() < (0.05 + luckyBoost)) return 'golden';
            return mixed;
        }

        // No table entry — random result weighted toward parents
        if (Math.random() < 0.5) return color1;
        return color2;
    }

    showBreedResult(msg, success) {
        var titleEl = document.getElementById('qp-breed-title-' + this.windowId);
        var msgEl = document.getElementById('qp-breed-msg-' + this.windowId);
        var overlay = document.getElementById('qp-breed-overlay-' + this.windowId);
        if (titleEl) titleEl.textContent = success ? 'Success!' : 'No luck...';
        if (msgEl) msgEl.textContent = msg;
        if (overlay) overlay.classList.add('visible');
    }

    hideBreedResult() {
        var overlay = document.getElementById('qp-breed-overlay-' + this.windowId);
        if (overlay) overlay.classList.remove('visible');
    }

    showBreedPrompt(text) {
        var el = document.getElementById('qp-breed-prompt-' + this.windowId);
        if (!el) return;
        if (!text) { el.style.display = 'none'; return; }
        el.textContent = text;
        el.style.display = 'block';
    }

    // =========================================
    //  PHASE 5: SELLING & RELEASING
    // =========================================
    calculateSellPrice(duck) {
        var basePrice = this.SELL_PRICES[duck.color] || 20;
        var genBonus = 0;
        if (duck.generation > 1) genBonus = Math.floor(basePrice * 0.10 * (duck.generation - 1));
        var happyBonus = 0;
        if (duck.happiness >= 70) happyBonus = Math.floor(basePrice * 0.20);
        // Trait bonuses
        var traitBonus = 0;
        if (duck.traits) {
            for (var ti = 0; ti < duck.traits.length; ti++) {
                var traitDef = this.TRAITS[duck.traits[ti]];
                if (traitDef) traitBonus += traitDef.sellBonus;
            }
        }
        return basePrice + genBonus + happyBonus + traitBonus;
    }

    showSellDialog(duck) {
        this._pendingSellDuck = duck;
        var price = this.calculateSellPrice(duck);
        var msgEl = document.getElementById('qp-sell-msg-' + this.windowId);
        var priceEl = document.getElementById('qp-sell-price-' + this.windowId);
        var overlay = document.getElementById('qp-sell-overlay-' + this.windowId);

        var breakdown = 'Sell ' + duck.name + '?';
        var rarity = this.COLOR_RARITY[duck.color] || 'common';
        breakdown += '\n(' + rarity.charAt(0).toUpperCase() + rarity.slice(1);
        breakdown += ' ' + duck.color.charAt(0).toUpperCase() + duck.color.slice(1);
        if (duck.generation > 1) breakdown += ', Gen ' + duck.generation;
        if (duck.happiness >= 70) breakdown += ', Happy!';
        breakdown += ')';
        if (duck.traits && duck.traits.length > 0) {
            var sellTraitNames = [];
            for (var sti = 0; sti < duck.traits.length; sti++) {
                sellTraitNames.push(this.getTraitDisplayName(duck.traits[sti]));
            }
            breakdown += '\nTraits: ' + sellTraitNames.join(', ');
        }

        if (msgEl) msgEl.textContent = breakdown;
        if (priceEl) priceEl.textContent = '\u00A7' + price;
        if (overlay) overlay.classList.add('visible');
    }

    hideSellDialog() {
        var overlay = document.getElementById('qp-sell-overlay-' + this.windowId);
        if (overlay) overlay.classList.remove('visible');
        this._pendingSellDuck = null;
    }

    confirmSell() {
        var duck = this._pendingSellDuck;
        if (!duck) { this.hideSellDialog(); return; }

        var price = this.calculateSellPrice(duck);

        // Remove duck from array
        for (var i = this.ducks.length - 1; i >= 0; i--) {
            if (this.ducks[i].id === duck.id) { this.ducks.splice(i, 1); break; }
        }
        if (this.selectedDuck && this.selectedDuck.id === duck.id) {
            this.selectedDuck = null;
            this.updateDuckInfoPanel();
        }
        this.updateDuckCount();

        // Earn in-game coins
        this.earnCoins(price);

        this.stats.totalSold++;
        this.stats.totalEarnings += price;
        this.hideSellDialog();
    }

    showReleaseDialog(duck) {
        this._pendingReleaseDuck = duck;
        var msgEl = document.getElementById('qp-release-msg-' + this.windowId);
        var overlay = document.getElementById('qp-release-overlay-' + this.windowId);

        var msg = 'Release ' + duck.name + ' into the wild?\nThey will waddle away forever.';
        if (msgEl) msgEl.textContent = msg;
        if (overlay) overlay.classList.add('visible');
    }

    hideReleaseDialog() {
        var overlay = document.getElementById('qp-release-overlay-' + this.windowId);
        if (overlay) overlay.classList.remove('visible');
        this._pendingReleaseDuck = null;
    }

    confirmRelease() {
        var duck = this._pendingReleaseDuck;
        if (!duck) { this.hideReleaseDialog(); return; }

        // Mark duck as releasing — it will walk off-screen in updateDuck
        duck.releasing = true;
        duck.eatTarget = null;
        duck.eating = false;

        // Pick nearest edge (left or right)
        var midX = this.NATIVE_W / 2;
        if (duck.x < midX) {
            duck.wanderDirX = -1;
        } else {
            duck.wanderDirX = 1;
        }
        duck.wanderDirY = 0;

        if (this.selectedDuck && this.selectedDuck.id === duck.id) {
            this.selectedDuck = null;
            this.updateDuckInfoPanel();
        }

        this.stats.totalReleased++;
        this.hideReleaseDialog();
    }

    // =========================================
    //  HATCHERY / EGG PURCHASE
    // =========================================
    showPurchaseDialog() {
        if (this.incubatingEgg) { this.showBuyError('An egg is already incubating!'); return; }
        if (this.ducks.length >= this.DUCK_CAP) { this.showBuyError('Pond is full! (8/8)'); return; }
        var overlay = document.getElementById('qp-buy-overlay-' + this.windowId);
        if (overlay) overlay.classList.add('visible');
        this.showBuyError('');
    }

    hidePurchaseDialog() {
        var overlay = document.getElementById('qp-buy-overlay-' + this.windowId);
        if (overlay) overlay.classList.remove('visible');
    }

    showBuyError(msg) {
        var el = document.getElementById('qp-buy-error-' + this.windowId);
        if (el) el.textContent = msg;
    }

    buyEgg() {
        if (!this.canAfford(50)) { this.showBuyError('Not enough snakes!'); return; }
        if (this.spendCoins(50)) {
            this.hidePurchaseDialog();
            this.startIncubation();
        } else {
            this.showBuyError('Transaction failed!');
        }
    }

    startIncubation() {
        var color = this.STARTER_COLORS[Math.floor(Math.random() * this.STARTER_COLORS.length)];
        var traits = this.rollEggTraits();
        this.incubatingEgg = { color: color, startTime: performance.now(), elapsed: 0, traits: traits };
    }

    // =========================================
    //  HATCHING / NAMING
    // =========================================
    hatchEgg() {
        if (!this.incubatingEgg) return;
        var color = this.incubatingEgg.color;
        this._pendingHatchGeneration = this.incubatingEgg.generation || 1;
        this._pendingHatchParents = this.incubatingEgg.parents || null;
        this._pendingHatchTraits = this.incubatingEgg.traits || [];
        this.incubatingEgg = null;
        this.hatchFlashTimer = 0.3;
        this._pendingHatchColor = color;
        this.showNameDialog();
    }

    showNameDialog() {
        var overlay = document.getElementById('qp-name-overlay-' + this.windowId);
        if (overlay) overlay.classList.add('visible');
        var input = document.getElementById('qp-name-input-' + this.windowId);
        if (input) { input.value = ''; setTimeout(function() { input.focus(); }, 50); }
        // Show traits in name dialog
        var traitEl = document.getElementById('qp-name-traits-' + this.windowId);
        if (traitEl) {
            var traits = this._pendingHatchTraits || [];
            if (traits.length > 0) {
                var names = [];
                for (var i = 0; i < traits.length; i++) {
                    names.push(this.getTraitDisplayName(traits[i]));
                }
                traitEl.textContent = 'Traits: ' + names.join(', ') + '!';
                traitEl.style.display = 'block';
            } else {
                traitEl.textContent = '';
                traitEl.style.display = 'none';
            }
        }
    }

    hideNameDialog() {
        var overlay = document.getElementById('qp-name-overlay-' + this.windowId);
        if (overlay) overlay.classList.remove('visible');
    }

    confirmName() {
        var input = document.getElementById('qp-name-input-' + this.windowId);
        var name = input ? input.value.trim() : '';
        if (!name) {
            var rn = ['Quackers','Waddles','Puddles','Bubbles','Daffy','Nibbles','Pebbles','Sunny','Splash','Biscuit','Nugget','Pepper'];
            name = rn[Math.floor(Math.random() * rn.length)];
        }
        this.hideNameDialog();
        var spawnX = this.NEST_POS.x + 40 + Math.random() * 60;
        var spawnY = this.NEST_POS.y - 20 + Math.random() * 40;
        var b = this.zones.bounds;
        spawnX = Math.max(b.x + 10, Math.min(b.x + b.w - 10, spawnX));
        spawnY = Math.max(b.y + 10, Math.min(b.y + b.h - 10, spawnY));
        this.spawnDuck(
            name,
            this._pendingHatchColor || 'white',
            spawnX, spawnY,
            this._pendingHatchGeneration || 1,
            this._pendingHatchParents || null,
            this._pendingHatchTraits || []
        );
        this.stats.totalHatched++;
        this._pendingHatchColor = null;
        this._pendingHatchGeneration = null;
        this._pendingHatchParents = null;
        this._pendingHatchTraits = null;
    }

    // =========================================
    //  RENDER
    // =========================================
    render() {
        var ctx = this.ctx;
        if (!ctx) return;
        var canvas = this.canvas;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (this.assets.backdrop && this.assets.backdrop.complete) {
            ctx.drawImage(this.assets.backdrop, 0, 0, canvas.width, canvas.height);
        }

        this.renderMesses();
        this.renderFoodItems();
        this.renderEgg();

        for (var i = 0; i < this.ducks.length; i++) this.renderDuck(this.ducks[i]);

        if (this.hatchFlashTimer > 0) {
            var alpha = Math.min(this.hatchFlashTimer / 0.3, 1) * 0.6;
            ctx.fillStyle = 'rgba(255, 255, 220, ' + alpha + ')';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    renderMesses() {
        var ctx = this.ctx;
        var poopImg = this.assets.poop;
        for (var i = 0; i < this.messes.length; i++) {
            var m = this.messes[i];
            var mx = m.x * this.scaleX;
            var my = m.y * this.scaleY;
            var size = 48 * this.scaleX;
            if (poopImg && poopImg.complete) {
                ctx.drawImage(poopImg, mx - size / 2, my - size / 2, size, size);
            } else {
                ctx.fillStyle = '#6B4226';
                ctx.beginPath();
                ctx.ellipse(mx, my, 10 * this.scaleX, 7 * this.scaleY, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    renderFoodItems() {
        var ctx = this.ctx;
        for (var i = 0; i < this.foodItems.length; i++) {
            var f = this.foodItems[i];
            var img = this.assets[f.assetKey];
            if (!img || !img.complete) continue;
            var fx = f.x * this.scaleX;
            var fy = f.y * this.scaleY;
            var fSize = 28 * this.scaleX;
            ctx.drawImage(img, fx - fSize / 2, fy - fSize / 2, fSize, fSize);
        }
    }

    renderEgg() {
        if (!this.incubatingEgg) return;
        var eggImg = this.assets.egg;
        if (!eggImg || !eggImg.complete) return;
        var ctx = this.ctx;
        var nx = this.NEST_POS.x * this.scaleX;
        var ny = this.NEST_POS.y * this.scaleY;
        var eggW = 40 * this.scaleX;
        var eggH = 48 * this.scaleY;

        var progress = this.incubatingEgg.elapsed / this.EGG_INCUBATION_TIME;
        var wobbleAmp = progress * 0.15;
        var wobbleSpeed = 3 + progress * 8;
        var wobble = Math.sin(performance.now() / 1000 * wobbleSpeed) * wobbleAmp;

        ctx.save();
        ctx.translate(nx, ny);
        ctx.rotate(wobble);
        ctx.drawImage(eggImg, -eggW / 2, -eggH, eggW, eggH);
        ctx.restore();

        var barW = 50 * this.scaleX;
        var barH = 5 * this.scaleY;
        var barX = nx - barW / 2;
        var barY = ny + 4 * this.scaleY;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = progress < 0.5 ? '#4caf50' : (progress < 0.85 ? '#ffc107' : '#ff5722');
        ctx.fillRect(barX, barY, barW * Math.min(progress, 1), barH);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);

        var remaining = Math.max(0, Math.ceil(this.EGG_INCUBATION_TIME - this.incubatingEgg.elapsed));
        ctx.font = Math.round(10 * this.scaleX) + 'px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(remaining + 's', nx, barY + barH + 12 * this.scaleY);
        ctx.textAlign = 'left';
    }

    renderDuck(duck) {
        var ctx = this.ctx;
        var sheet = this.assets.spriteSheet;
        if (!sheet || !sheet.complete) return;

        var animKey;
        var isMoving = (duck.wanderDirX !== 0 || duck.wanderDirY !== 0);
        if (duck.sleeping) animKey = 'sleep';
        else if (duck.eating) animKey = 'eat';
        else if (duck.zone === 'water') animKey = 'swim' + duck.direction.charAt(0).toUpperCase() + duck.direction.slice(1);
        else if (isMoving) animKey = 'walk' + duck.direction.charAt(0).toUpperCase() + duck.direction.slice(1);
        else animKey = 'idle';

        var anim = this.ANIMS[animKey] || this.ANIMS.idle;
        var frameIndex = duck.animFrame % anim.frames;
        var srcX = frameIndex * this.FRAME_W;
        var srcY = anim.row * this.FRAME_H;

        var duckScale = this.DUCK_RENDER_SCALE;
        if (this.hasTrait(duck, 'chonky')) duckScale *= 1.2;
        if (this.hasTrait(duck, 'tiny')) duckScale *= 0.75;
        var renderW = this.FRAME_W * duckScale * this.scaleX;
        var renderH = this.FRAME_H * duckScale * this.scaleY;
        var destX = duck.x * this.scaleX - renderW / 2;
        var destY = duck.y * this.scaleY - renderH;

        // Immortal: golden glow behind duck
        if (this.hasTrait(duck, 'immortal')) {
            ctx.save();
            ctx.globalAlpha = 0.35 + Math.sin(performance.now() / 400) * 0.15;
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.ellipse(duck.x * this.scaleX, duck.y * this.scaleY - renderH * 0.3,
                renderW * 0.5, renderH * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        var colorFilter = this.COLOR_FILTERS[duck.color] || 'none';
        // Dancer: apply rotation
        if (duck.dancing) {
            ctx.save();
            ctx.translate(duck.x * this.scaleX, duck.y * this.scaleY - renderH * 0.5);
            ctx.rotate(duck.danceAngle);
            ctx.translate(-(duck.x * this.scaleX), -(duck.y * this.scaleY - renderH * 0.5));
        }
        if (colorFilter !== 'none') ctx.filter = colorFilter;
        ctx.drawImage(sheet, srcX, srcY, this.FRAME_W, this.FRAME_H, destX, destY, renderW, renderH);
        if (colorFilter !== 'none') ctx.filter = 'none';
        if (duck.dancing) ctx.restore();

        // Sparkly: twinkle particles
        if (this.hasTrait(duck, 'sparkly')) {
            for (var sp = 0; sp < duck.sparkles.length; sp++) {
                var s = duck.sparkles[sp];
                var sx = (duck.x + s.ox) * this.scaleX;
                var sy = (duck.y + s.oy) * this.scaleY;
                ctx.globalAlpha = Math.min(s.life, 0.8);
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(sx, sy, 2.5 * this.scaleX, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        }

        // Charming: heart particles
        if (duck.hearts && duck.hearts.length > 0) {
            ctx.font = Math.round(12 * this.scaleX) + 'px sans-serif';
            ctx.textAlign = 'center';
            for (var hp = 0; hp < duck.hearts.length; hp++) {
                var h = duck.hearts[hp];
                ctx.globalAlpha = Math.min(h.life, 0.9);
                ctx.fillText('\u2764', (duck.x + h.ox) * this.scaleX, (duck.y + h.oy) * this.scaleY);
            }
            ctx.globalAlpha = 1.0;
            ctx.textAlign = 'left';
        }

        // Splashy: splash effect
        if (duck.splashTimer > 0) {
            var splAlpha = duck.splashTimer / 0.6;
            var splR = (1 - splAlpha) * 30 * this.scaleX + 10;
            ctx.save();
            ctx.globalAlpha = splAlpha * 0.5;
            ctx.strokeStyle = '#87ceeb';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(duck.x * this.scaleX, duck.y * this.scaleY, splR, splR * 0.4, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        if (this.selectedDuck && this.selectedDuck.id === duck.id) {
            ctx.strokeStyle = '#ffeb3b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(duck.x * this.scaleX, duck.y * this.scaleY, renderW * 0.4, renderH * 0.15, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (this.breedMode && this.breedDuck1 && this.breedDuck1.id === duck.id) {
            ctx.strokeStyle = '#ff69b4';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(duck.x * this.scaleX, duck.y * this.scaleY, renderW * 0.45, renderH * 0.18, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        var labelX = duck.x * this.scaleX;
        var labelY = destY - 4;
        var hungerIcon = '';
        if (duck.hunger <= 0) hungerIcon = ' \u2620';
        else if (duck.hunger < 30) hungerIcon = ' \u2757';
        var sleepIcon = duck.sleeping ? (this.hasTrait(duck, 'sleepyhead') ? ' \uD83D\uDCA4\uD83D\uDCA4' : ' \uD83D\uDCA4') : '';
        var traitIcons = '';
        if (duck.sprinting) traitIcons += ' \uD83D\uDCA8';
        if (this.hasTrait(duck, 'sparkly')) traitIcons += ' \u2728';
        if (this.hasTrait(duck, 'lucky')) traitIcons += ' \uD83C\uDF40';
        if (duck.dancing) traitIcons += ' \uD83C\uDFB5';
        ctx.font = '11px Segoe UI, Tahoma, sans-serif';
        ctx.textAlign = 'center';
        var label = duck.name + hungerIcon + sleepIcon + traitIcons;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        var textW = ctx.measureText(label).width;
        ctx.fillRect(labelX - textW / 2 - 3, labelY - 11, textW + 6, 14);
        ctx.fillStyle = duck.hunger < 30 ? '#ff6b6b' : '#fff';
        ctx.fillText(label, labelX, labelY);
        ctx.textAlign = 'left';

        // Quacky: speech bubble
        if (duck.quackShowTimer > 0 && duck.quackMsg) {
            var bubbleX = duck.x * this.scaleX;
            var bubbleY = destY - 22;
            ctx.font = 'bold ' + Math.round(10 * this.scaleX) + 'px "Courier New", monospace';
            ctx.textAlign = 'center';
            var bw = ctx.measureText(duck.quackMsg).width + 10;
            var bh = 16 * this.scaleY;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            // Rounded rect for bubble
            var bx = bubbleX - bw / 2;
            var by = bubbleY - bh;
            var br = 4;
            ctx.moveTo(bx + br, by);
            ctx.lineTo(bx + bw - br, by);
            ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
            ctx.lineTo(bx + bw, by + bh - br);
            ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
            ctx.lineTo(bx + br, by + bh);
            ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
            ctx.lineTo(bx, by + br);
            ctx.quadraticCurveTo(bx, by, bx + br, by);
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = '#333';
            ctx.fillText(duck.quackMsg, bubbleX, bubbleY - 3);
            ctx.textAlign = 'left';
        }
    }

    // =========================================
    //  EVENT HANDLERS
    // =========================================
    setupEventHandlers(windowId) {
        var self = this;
        var canvas = document.getElementById('qp-canvas-' + windowId);
        if (canvas) canvas.addEventListener('click', function(e) { self.handleCanvasClick(e); });

        var buyYes = document.getElementById('qp-buy-yes-' + windowId);
        var buyNo = document.getElementById('qp-buy-no-' + windowId);
        if (buyYes) buyYes.addEventListener('click', function() { self.buyEgg(); });
        if (buyNo) buyNo.addEventListener('click', function() { self.hidePurchaseDialog(); });

        var nameOk = document.getElementById('qp-name-ok-' + windowId);
        if (nameOk) nameOk.addEventListener('click', function() { self.confirmName(); });
        var nameInput = document.getElementById('qp-name-input-' + windowId);
        if (nameInput) nameInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') self.confirmName(); });

        var breedOk = document.getElementById('qp-breed-ok-' + windowId);
        if (breedOk) breedOk.addEventListener('click', function() { self.hideBreedResult(); });

        // Sell/release buttons in info panel
        var sellBtn = document.getElementById('qp-sell-btn-' + windowId);
        if (sellBtn) sellBtn.addEventListener('click', function() {
            if (self.selectedDuck && !self.selectedDuck.releasing) self.showSellDialog(self.selectedDuck);
        });
        var releaseBtn = document.getElementById('qp-release-btn-' + windowId);
        if (releaseBtn) releaseBtn.addEventListener('click', function() {
            if (self.selectedDuck && !self.selectedDuck.releasing) self.showReleaseDialog(self.selectedDuck);
        });

        // Sell dialog buttons
        var sellYes = document.getElementById('qp-sell-yes-' + windowId);
        var sellNo = document.getElementById('qp-sell-no-' + windowId);
        if (sellYes) sellYes.addEventListener('click', function() { self.confirmSell(); });
        if (sellNo) sellNo.addEventListener('click', function() { self.hideSellDialog(); });

        // Release dialog buttons
        var releaseYes = document.getElementById('qp-release-yes-' + windowId);
        var releaseNo = document.getElementById('qp-release-no-' + windowId);
        if (releaseYes) releaseYes.addEventListener('click', function() { self.confirmRelease(); });
        if (releaseNo) releaseNo.addEventListener('click', function() { self.hideReleaseDialog(); });

        var hud = document.getElementById('qp-hud-' + windowId);
        if (hud) {
            hud.addEventListener('click', function(e) {
                var btn = e.target.closest('.qp-tool-btn');
                if (btn && btn.dataset.tool) self.setActiveTool(btn.dataset.tool);
            });
        }

        if (typeof elxaOS !== 'undefined' && elxaOS.eventBus) {
            this._onWindowClosed = function(data) { if (data && data.id === windowId) self.destroy(); };
            elxaOS.eventBus.on('window.closed', this._onWindowClosed);
        }

        var container = document.getElementById('qp-' + windowId);
        if (container && typeof ResizeObserver !== 'undefined') {
            this._resizeObserver = new ResizeObserver(function() { self.resizeCanvas(); });
            this._resizeObserver.observe(container);
        }
    }

    handleCanvasClick(e) {
        var canvas = this.canvas;
        if (!canvas) return;
        var rect = canvas.getBoundingClientRect();
        var clickX = (e.clientX - rect.left) / this.scaleX;
        var clickY = (e.clientY - rect.top) / this.scaleY;

        if (this.activeTool === 'food' || this.activeTool === 'treat1' || this.activeTool === 'treat2') {
            this.placeFood(this.activeTool, clickX, clickY);
            return;
        }
        if (this.activeTool === 'shovel') {
            this.cleanMess(clickX, clickY);
            return;
        }
        if (this.breedMode) {
            this.handleBreedClick(clickX, clickY);
            return;
        }
        if (this.isInHatchery(clickX, clickY)) {
            this.showPurchaseDialog();
            return;
        }

        var hitRadius = 30;
        var found = null;
        for (var i = this.ducks.length - 1; i >= 0; i--) {
            var d = this.ducks[i];
            if (d.releasing) continue;
            var dx = clickX - d.x;
            var dy = clickY - d.y;
            if (dx * dx + dy * dy < hitRadius * hitRadius) { found = d; break; }
        }
        this.selectedDuck = found;
        this.updateDuckInfoPanel();
    }

    updateDuckInfoPanel() {
        var infoEl = document.getElementById('qp-info-' + this.windowId);
        if (!infoEl) return;
        if (!this.selectedDuck) { infoEl.classList.remove('visible'); return; }
        infoEl.classList.add('visible');
        var duck = this.selectedDuck;
        var nameEl = document.getElementById('qp-info-name-' + this.windowId);
        var colorEl = document.getElementById('qp-info-color-' + this.windowId);
        var hungerBar = document.getElementById('qp-info-hunger-' + this.windowId);
        var happyBar = document.getElementById('qp-info-happy-' + this.windowId);
        if (nameEl) nameEl.textContent = duck.name;
        if (colorEl) colorEl.textContent = duck.color.charAt(0).toUpperCase() + duck.color.slice(1);
        var genEl = document.getElementById('qp-info-gen-' + this.windowId);
        if (genEl) genEl.textContent = duck.generation || 1;
        if (hungerBar) hungerBar.style.width = Math.round(duck.hunger) + '%';
        if (happyBar) happyBar.style.width = Math.round(duck.happiness) + '%';
        var valueEl = document.getElementById('qp-info-value-' + this.windowId);
        if (valueEl) valueEl.textContent = '\u00A7' + this.calculateSellPrice(duck);
        // Traits display
        var traitsEl = document.getElementById('qp-info-traits-' + this.windowId);
        var traitsRow = traitsEl ? traitsEl.closest('.qp-info-traits-row') : null;
        if (traitsEl && duck.traits && duck.traits.length > 0) {
            var tNames = [];
            for (var tn = 0; tn < duck.traits.length; tn++) {
                tNames.push(this.getTraitDisplayName(duck.traits[tn]));
            }
            traitsEl.textContent = tNames.join(', ');
            if (traitsRow) traitsRow.style.display = '';
        } else if (traitsRow) {
            traitsRow.style.display = 'none';
        }
        // Hide sell/release for releasing ducks
        var sellBtn = document.getElementById('qp-sell-btn-' + this.windowId);
        var releaseBtn = document.getElementById('qp-release-btn-' + this.windowId);
        if (sellBtn) sellBtn.style.display = duck.releasing ? 'none' : '';
        if (releaseBtn) releaseBtn.style.display = duck.releasing ? 'none' : '';
    }

    // =========================================
    //  PERSISTENCE (save/load via registry)
    // =========================================
    async saveState() {
        if (typeof elxaOS === 'undefined' || !elxaOS.registry) return;
        if (!elxaOS.registry.isLoggedIn()) return;

        var duckData = [];
        for (var i = 0; i < this.ducks.length; i++) {
            var d = this.ducks[i];
            if (d.releasing) continue;  // don't save ducks mid-release
            duckData.push({
                id: d.id, name: d.name, color: d.color,
                generation: d.generation, parents: d.parents,
                traits: d.traits || [],
                x: Math.round(d.x), y: Math.round(d.y),
                direction: d.direction, zone: d.zone,
                hunger: Math.round(d.hunger * 10) / 10,
                happiness: Math.round(d.happiness * 10) / 10,
                lastBredAttempt: d.lastBredAttempt || 0
            });
        }

        var eggData = null;
        if (this.incubatingEgg) {
            eggData = {
                color: this.incubatingEgg.color,
                elapsed: this.incubatingEgg.elapsed,
                parents: this.incubatingEgg.parents || null,
                generation: this.incubatingEgg.generation || 1,
                traits: this.incubatingEgg.traits || []
            };
        }

        var state = {
            ducks: duckData,
            coins: this.coins,
            stats: {
                totalHatched: this.stats.totalHatched,
                totalSold: this.stats.totalSold,
                totalReleased: this.stats.totalReleased,
                totalEarnings: this.stats.totalEarnings
            },
            messes: this.messes.slice(),
            incubatingEgg: eggData
        };

        try {
            await elxaOS.registry.setState('quackerPond', state);
        } catch (e) {
            console.error('Quacker Pond: save failed', e);
        }
    }

    async loadState() {
        if (typeof elxaOS === 'undefined' || !elxaOS.registry) return false;
        if (!elxaOS.registry.isLoggedIn()) return false;

        try {
            var state = await elxaOS.registry.getState('quackerPond');
            if (!state || !state.ducks) return false;

            // Restore coins
            if (typeof state.coins === 'number') this.coins = state.coins;

            // Restore stats
            if (state.stats) {
                this.stats.totalHatched = state.stats.totalHatched || 0;
                this.stats.totalSold = state.stats.totalSold || 0;
                this.stats.totalReleased = state.stats.totalReleased || 0;
                this.stats.totalEarnings = state.stats.totalEarnings || 0;
            }

            // Restore messes
            if (state.messes && state.messes.length > 0) {
                this.messes = state.messes;
            }

            // Restore ducks
            for (var i = 0; i < state.ducks.length; i++) {
                var sd = state.ducks[i];
                var duck = this.spawnDuck(
                    sd.name, sd.color, sd.x, sd.y,
                    sd.generation || 1, sd.parents || null,
                    sd.traits || []
                );
                duck.id = sd.id;
                duck.direction = sd.direction || 'down';
                duck.zone = sd.zone || 'land';
                duck.hunger = (typeof sd.hunger === 'number') ? sd.hunger : 80;
                duck.happiness = (typeof sd.happiness === 'number') ? sd.happiness : 80;
                duck.lastBredAttempt = sd.lastBredAttempt || 0;
            }

            // Restore incubating egg
            if (state.incubatingEgg) {
                this.incubatingEgg = {
                    color: state.incubatingEgg.color,
                    startTime: performance.now(),
                    elapsed: state.incubatingEgg.elapsed || 0,
                    parents: state.incubatingEgg.parents || null,
                    generation: state.incubatingEgg.generation || 1,
                    traits: state.incubatingEgg.traits || []
                };
            }

            this._stateLoaded = true;
            return true;
        } catch (e) {
            console.error('Quacker Pond: load failed', e);
            return false;
        }
    }

    // =========================================
    //  CLEANUP
    // =========================================
    destroy() {
        this.running = false;
        // Save state before cleanup
        this.saveState();
        if (this.autoSaveInterval) { clearInterval(this.autoSaveInterval); this.autoSaveInterval = null; }
        if (this.animFrameId) { cancelAnimationFrame(this.animFrameId); this.animFrameId = null; }
        if (this._resizeObserver) { this._resizeObserver.disconnect(); this._resizeObserver = null; }
        if (this._onWindowClosed && typeof elxaOS !== 'undefined' && elxaOS.eventBus) {
            elxaOS.eventBus.off('window.closed', this._onWindowClosed);
        }
        this.ducks = [];
        this.foodItems = [];
        this.messes = [];
        this.incubatingEgg = null;
        this.breedMode = false;
        this.breedDuck1 = null;
        this.breedPairHistory = [];
        this._pendingSellDuck = null;
        this._pendingReleaseDuck = null;
        this.canvas = null;
        this.ctx = null;
    }
}