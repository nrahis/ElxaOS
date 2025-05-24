// =================================
// SNOOGLE BROWSER PROGRAM
// =================================
class BrowserProgram {
    constructor(windowManager, fileSystem, eventBus) {
        this.windowManager = windowManager;
        this.fileSystem = fileSystem;
        this.eventBus = eventBus;
        this.windowId = null;
        this.currentUrl = '';
        this.history = [];
        this.currentHistoryIndex = -1;
        this.favorites = [];
        this.isConnected = false;
        this.websiteRegistry = this.initializeWebsiteRegistry();
        
        this.setupEventListeners();
        this.loadUserData();
    }

        initializeWebsiteRegistry() {
        return {
            'snoogle.ex': {
                title: 'Snoogle - Search the ExWeb',
                type: 'homepage',
                searchData: {
                    keywords: ['search', 'home', 'snoogle'],
                    description: 'Search the ExWeb and discover amazing websites!',
                    category: 'Search'
                }
            },
            
            // Utility Sites
            'snoogle-dictionary.ex': {
                title: 'Snoogle Dictionary',
                type: 'file',
                path: './assets/interwebs/snoogle-dictionary/index.html',
                css: './assets/interwebs/snoogle-dictionary/styles.css',
                searchData: {
                    keywords: ['dictionary', 'language', 'reference', 'words', 'definitions', 'thesaurus', 'vocabulary', 'snakesian'],
                    description: 'Comprehensive dictionary and language reference tool featuring Snakesian and standard English definitions, etymologies, and usage examples.',
                    category: 'Utilities'
                }
            },
            'snoogle-pedia.ex': {
                title: 'SnooglePedia - The ExWeb Encyclopedia',
                type: 'file',
                path: './assets/interwebs/snoogle-pedia/index.html',
                css: './assets/interwebs/snoogle-pedia/styles.css',
                searchData: {
                    keywords: ['encyclopedia', 'Wikipedia', 'wikipedia', 'learn', 'learning', 'knowledge', 'articles', 'reference', 'research', 'education', 'information', 'wiki', 'snakesia'],
                    description: 'Free online encyclopedia covering topics from Snakesian history to modern technology. Community-edited with verified sources.',
                    category: 'Education'
                }
            },
            'weather.ex': {
                title: 'Snakesia Weather Service',
                type: 'file',
                path: './assets/interwebs/snakesia-weather/index.html',
                css: './assets/interwebs/snakesia-weather/styles.css',
                searchData: {
                    keywords: ['weather', 'forecast', 'temperature', 'climate', 'meteorology', 'snakesia', 'radar', 'precipitation'],
                    description: 'Official Snakesian weather forecasting service providing real-time updates, radar maps, and climate data for all regions.',
                    category: 'Utilities'
                }
            },
            'phones.ex': {
                title: 'Phoneverse',
                type: 'file',
                path: './assets/interwebs/phones/index.html',
                css: './assets/interwebs/phones/styles.css',
                searchData: {
                    keywords: ['phone', 'phones', 'cell', 'mobile', 'directory', 'contacts', 'business', 'yellow pages', 'phone numbers', 'listings', 'local'],
                    description: 'Complete phone directory for Snakesia. Find business and residential listings, along with local service information.',
                    category: 'Utilities'
                }
            },
            'keycuts.ex': {
                title: 'KeyCuts - Shortcut Reference',
                type: 'file',
                path: './assets/interwebs/keycuts/index.html',
                css: './assets/interwebs/keycuts/styles.css',
                searchData: {
                    keywords: ['keyboard shortcuts', 'keyboard', 'shortcut', 'productivity', 'elxaos', 'hotkeys', 'reference', 'guide', 'computer tips'],
                    description: 'Official ElxaOS keyboard shortcut reference guide. Learn to navigate your system like a pro!',
                    category: 'Utilities'
                }
            },
            'rpi-guide.ex': {
                title: 'Raspberry Pi 4 Guide',
                type: 'file',
                path: './assets/interwebs/rpi-guide/index.html',
                css: './assets/interwebs/rpi-guide/styles.css',
                searchData: {
                    keywords: ['raspberry pi', 'linux', 'hardware', 'diy', 'computer', 'computing', 'electronics', 'programming', 'gpio', 'python'],
                    description: 'Complete guide to setting up and programming the Raspberry Pi 4 in Snakesia. Includes ElxaOS compatibility tips.',
                    category: 'Technology'
                }
            },
            'chihuahua-info.ex': {
                title: 'Chihuahua Information Center',
                type: 'file',
                path: './assets/interwebs/cic/index.html',
                css: './assets/interwebs/cic/styles.css',
                searchData: {
                    keywords: ['chihuahua', 'chihuahuas', 'dogs', 'dog', 'pet', 'pets', 'research', 'veterinary', 'canine studies', 'snake-u', 'animal science'],
                    description: 'Academic resource for Chihuahua research from the Department of Canine Studies at Snake-E University.',
                    category: 'Education'
                }
            },
            
            // Gaming
            'remicraft.ex': {
                title: 'RemiCraft - Official Server',
                type: 'file',
                path: './assets/interwebs/remicraft/index.html',
                css: './assets/interwebs/remicraft/styles.css',
                searchData: {
                    keywords: ['minecraft', 'gaming', 'server', 'remi', 'marway', 'multiplayer', 'games'],
                    description: 'Official Minecraft server hosted by Remi Marway. Join the most popular game server in Snakesia!',
                    category: 'Gaming'
                }
            },
            
            // Government - Multi-page site
            'snakesia.gov.ex': {
                title: 'Official Website of Snakesia - Home',
                type: 'file',
                path: './assets/interwebs/snakesia-gov/index.html',
                css: './assets/interwebs/snakesia-gov/styles.css',
                searchData: {
                    keywords: ['snakesia', 'government', 'tourism', 'embassy', 'currency', 'snake dollars'],
                    description: 'Official government website of Snakesia. Information about tourism, business, and embassy services.',
                    category: 'Government'
                }
            },
            'snakesia.gov.ex/business': {
                title: 'Official Website of Snakesia - Business',
                type: 'file',
                path: './assets/interwebs/snakesia-gov/business.html',
                css: './assets/interwebs/snakesia-gov/styles.css',
                searchData: {
                    keywords: ['business', 'snakesia', 'commerce', 'trade', 'economy'],
                    description: 'Business information and resources for Snakesia.',
                    category: 'Government'
                }
            },
            'snakesia.gov.ex/embassy': {
                title: 'Official Website of Snakesia - Embassy',
                type: 'file',
                path: './assets/interwebs/snakesia-gov/embassy.html',
                css: './assets/interwebs/snakesia-gov/styles.css',
                searchData: {
                    keywords: ['embassy', 'consulate', 'visa', 'passport', 'diplomatic'],
                    description: 'Embassy and consular services for Snakesia.',
                    category: 'Government'
                }
            },
            'snakesia.gov.ex/tourism': {
                title: 'Official Website of Snakesia - Tourism',
                type: 'file',
                path: './assets/interwebs/snakesia-gov/tourism.html',
                css: './assets/interwebs/snakesia-gov/styles.css',
                searchData: {
                    keywords: ['tourism', 'travel', 'vacation', 'attractions', 'snakesia'],
                    description: 'Discover the beauty and attractions of Snakesia.',
                    category: 'Government'
                }
            },
            'snakesia.gov.ex/mansion': {
                title: 'Official Website of Snakesia - Mansion Tours',
                type: 'file',
                path: './assets/interwebs/snakesia-gov/mansion.html',
                css: './assets/interwebs/snakesia-gov/styles.css',
                searchData: {
                    keywords: ['mansion', 'tours', 'presidential', 'palace', 'history'],
                    description: 'Tour the famous Snakesian Presidential Mansion.',
                    category: 'Government'
                }
            },
            'snakesia.gov.ex/maps': {
                title: 'Official Website of Snakesia - Maps',
                type: 'file',
                path: './assets/interwebs/snakesia-gov/maps.html',
                css: './assets/interwebs/snakesia-gov/styles.css',
                searchData: {
                    keywords: ['maps', 'geography', 'locations', 'navigation'],
                    description: 'Interactive maps and geographic information for Snakesia.',
                    category: 'Government'
                }
            },
            
            // ElxaTech - Multi-page site
            'elxatech.ex': {
                title: 'ElxaTech - Educational Technology Platform',
                type: 'file',
                path: './assets/interwebs/elxatech/index.html',
                css: './assets/interwebs/elxatech/styles.css',
                searchData: {
                    keywords: ['education', 'technology', 'science', 'math', 'chemistry', 'phones', 'retro', 'learning', 'tutorials', 'snake-e', 'academic'],
                    description: 'Premier educational technology platform offering resources in mathematics, chemistry, computer science, and technology history.',
                    category: 'Education'
                }
            },
            'elxatech.ex/about': {
                title: 'ElxaTech - About Us',
                type: 'file',
                path: './assets/interwebs/elxatech/about.html',
                css: './assets/interwebs/elxatech/styles.css',
                searchData: {
                    keywords: ['about', 'elxatech', 'team', 'mission'],
                    description: 'Learn about ElxaTech and our educational mission.',
                    category: 'Education'
                }
            },
            'elxatech.ex/chemistry': {
                title: 'ElxaTech - Chemistry Resources',
                type: 'file',
                path: './assets/interwebs/elxatech/chemistry.html',
                css: './assets/interwebs/elxatech/styles.css',
                searchData: {
                    keywords: ['chemistry', 'chemical', 'elements', 'reactions', 'lab'],
                    description: 'Comprehensive chemistry resources and interactive experiments.',
                    category: 'Education'
                }
            },
            'elxatech.ex/math': {
                title: 'ElxaTech - Mathematics Center',
                type: 'file',
                path: './assets/interwebs/elxatech/math.html',
                css: './assets/interwebs/elxatech/styles.css',
                searchData: {
                    keywords: ['math', 'mathematics', 'algebra', 'geometry', 'calculus'],
                    description: 'Advanced mathematics tutorials and problem solving.',
                    category: 'Education'
                }
            },
            'elxatech.ex/phones': {
                title: 'ElxaTech - Phone Technology',
                type: 'file',
                path: './assets/interwebs/elxatech/phones.html',
                css: './assets/interwebs/elxatech/styles.css',
                searchData: {
                    keywords: ['phones', 'mobile', 'technology', 'communication'],
                    description: 'Explore the evolution of phone technology.',
                    category: 'Technology'
                }
            },
            'elxatech.ex/retro': {
                title: 'ElxaTech - Retro Computing',
                type: 'file',
                path: './assets/interwebs/elxatech/retro.html',
                css: './assets/interwebs/elxatech/styles.css',
                searchData: {
                    keywords: ['retro', 'vintage', 'computing', 'history', 'old computers'],
                    description: 'Journey through the history of computing technology.',
                    category: 'Technology'
                }
            },
            
            // ElxaCorp - Multi-page site
            'snake-e.corp.ex': {
                title: 'ElxaCorp - Home',
                type: 'file',
                path: './assets/interwebs/snake-e-corp/index.html',
                css: './assets/interwebs/snake-e-corp/styles.css',
                searchData: {
                    keywords: ['elxa', 'corporation', 'snake-e', 'business', 'technology', 'software', 'elxaos'],
                    description: 'ElxaCorp - Leading technology innovation in Snakesia. Creators of ElxaOS.',
                    category: 'Business'
                }
            },
            'snake-e.corp.ex/about': {
                title: 'ElxaCorp - About',
                type: 'file',
                path: './assets/interwebs/snake-e-corp/about.html',
                css: './assets/interwebs/snake-e-corp/styles.css',
                searchData: {
                    keywords: ['about', 'elxacorp', 'company', 'history'],
                    description: 'Learn about ElxaCorp\'s history and mission.',
                    category: 'Business'
                }
            },
            'snake-e.corp.ex/careers': {
                title: 'ElxaCorp - Careers',
                type: 'file',
                path: './assets/interwebs/snake-e-corp/careers.html',
                css: './assets/interwebs/snake-e-corp/styles.css',
                searchData: {
                    keywords: ['careers', 'jobs', 'employment', 'work'],
                    description: 'Join the ElxaCorp team and build the future.',
                    category: 'Business'
                }
            },
            
            // Xeocities Personal Sites
            'pacman-xeocities.ex': {
                title: 'PacMan Power! 👻',
                type: 'file',
                path: './assets/interwebs/pp-xeocities/index.html',
                searchData: {
                    keywords: ['pacman', 'games', 'retro', 'arcade', 'personal'],
                    description: 'Your ultimate guide to PacMan! Tips, tricks, and high scores!',
                    category: 'Personal'
                }
            },
            'chi-corner-xeocities.ex': {
                title: 'ChiChis Chihuahua Corner',
                type: 'file',
                path: './assets/interwebs/chi-xeocities/index.html',
                searchData: {
                    keywords: ['chihuahua', 'dogs', 'pets', 'cute', 'personal'],
                    description: 'All about the cutest little dogs in the world!',
                    category: 'Personal'
                }
            },
            'craftzone-xeocities.ex': {
                title: 'CRAFTZONE',
                type: 'file',
                path: './assets/interwebs/craftzone-xeocities/index.html',
                searchData: {
                    keywords: ['games', 'gaming', 'Minecraft', 'hobbies', 'personal', 'personal page', 'xeocities', 'projects', 'tutorials'],
                    description: 'Your ultimate guide to Minecraft facts! Featuring tips and tricks!',
                    category: 'Personal'
                }
            },
            'nr-xeocities.ex': {
                title: 'NileRed Chemistry Corner',
                type: 'file',
                path: './assets/interwebs/nr-xeocities/index.html',
                searchData: {
                    keywords: ['NileRed', 'chemistry', 'experiment', 'experiments', 'science', 'reaction', 'reactions', 'blue iodine', 'crystal growing'],
                    description: 'Explore unique Snakesian chemical reactions and experiments. Features our special blue iodine and naturally-forming copper sulfate crystals!',
                    category: 'Education'
                }
            },
            'cat-xeocities.ex': {
                title: 'Whiskers World~',
                type: 'file',
                path: './assets/interwebs/cat-xeocities/index.html',
                searchData: {
                    keywords: ['cats', 'cat', 'kitty', 'pet', 'pets', 'felines', 'cat facts', 'cat care'],
                    description: 'The ultimate fan site for Snakesian cats and their unique characteristics. Featuring facts, care tips, and photos of our special 19-toed felines!',
                    category: 'Personal'
                }
            },
            'ms-xeocities.ex': {
                title: 'Mrs. Snake-e-s Corner',
                type: 'file',
                path: './assets/interwebs/ms-xeocities/index.html',
                searchData: {
                    keywords: ['gardening', 'garden', 'plant', 'baking', 'bake', 'recipe', 'recipes', 'cookie', 'cookies', 'garden tips', 'homemade'],
                    description: 'Traditional Snakesian gardening tips and family recipes from Mrs. Snake-E herself. Growing blue roses and baking snake-shaped cookies since 1975.',
                    category: 'Personal'
                }
            },
            
            // Social Media
            'snakebook.ex': {
                title: 'Snakebook',
                type: 'file',
                path: './assets/interwebs/snakebook/index.html',
                css: './assets/interwebs/snakebook/styles.css',
                searchData: {
                    keywords: ['social media', 'networking', 'friends', 'social network', 'snakebook', 'profiles', 'messaging', 'snakesia social', 'status updates', 'photos'],
                    description: 'Snakesia\'s largest social network. Connect with friends, share updates, and join the largest online community in Snakesia.',
                    category: 'Social'
                }
            },
            'dissscord.ex': {
                title: 'DisssCord',
                type: 'file',
                path: './assets/interwebs/dissscord/index.html',
                css: './assets/interwebs/dissscord/styles.css',
                searchData: {
                    keywords: ['chat', 'communities', 'discord', 'voice chat', 'gaming', 'servers', 'groups', 'messaging', 'voice channels', 'text channels'],
                    description: 'Join the conversation on DisssCord! The premier chat platform for Snakesian communities, gamers, and groups. Create servers, chat with friends, and join voice channels.',
                    category: 'Social'
                }
            },
            'abbit.ex': {
                title: 'Abbit',
                type: 'file',
                path: './assets/interwebs/abbit/index.html',
                css: './assets/interwebs/abbit/styles.css',
                searchData: {
                    keywords: ['forum', 'community', 'discussions', 'subrabbits', 'news', 'memes', 'posts', 'upvotes', 'threads', 'karma'],
                    description: 'Dive into endless discussions on Abbit, where Snakesians share news, memes, and join topic-focused communities called subrabbits. Your daily source for what\'s trending in Snakesia.',
                    category: 'Social'
                }
            },
            
            // Special pages
            'directory': {
                title: 'ExWeb Directory',
                type: 'directory',
                searchData: {
                    keywords: ['directory', 'list', 'sites', 'browse'],
                    description: 'Browse all available websites on the ExWeb.',
                    category: 'Utilities'
                }
            }
        };
    }

    initializeSearchData() {
        // Search keywords mapped to website URLs - you can customize these!
        return {
            'games': ['playtime.html', 'arcade.html'],
            'play': ['playtime.html', 'arcade.html', 'fun-zone.html'],
            'fun': ['fun-zone.html', 'playtime.html', 'jokes.html'],
            'math': ['math-academy.html', 'calculator-world.html'],
            'learn': ['math-academy.html', 'encyclopedia.html', 'science-lab.html'],
            'science': ['science-lab.html', 'space-center.html'],
            'space': ['space-center.html', 'astronomy.html'],
            'animals': ['pet-corner.html', 'zoo-adventure.html'],
            'cats': ['whiskersworld.html'],
            'dogs': ['pet-corner.html', 'dog-park.html'],
            'jokes': ['jokes.html', 'fun-zone.html'],
            'music': ['music-box.html', 'piano-lessons.html'],
            'art': ['art-studio.html', 'coloring-book.html'],
            'draw': ['art-studio.html', 'drawing-pad.html'],
            'news': ['kid-news.html', 'weather-station.html'],
            'weather': ['weather-service.html'],
            'sports': ['sports-central.html', 'playground.html'],
            'cook': ['cooking-corner.html', 'recipe-box.html'],
            'food': ['cooking-corner.html', 'snack-time.html'],
            'define': ['snoogle-dictionary.html','snooglepedia.html'],
            'snooglepedia': ['snooglepedia.html'],
            'dictionary': ['snoogle-dictionary.html']
        };
    }

    initializeWebsites() {
        // Fake websites data - you can customize these!
        return [
            {
                name: 'PlayTime Games',
                url: 'playtime.html',
                icon: '🎮',
                description: 'Awesome games and activities for kids!'
            },
            {
                name: 'Math Academy',
                url: 'math-academy.html',
                icon: '🔢',
                description: 'Learn math in a fun and interactive way!'
            },
            {
                name: 'Science Lab',
                url: 'science-lab.html',
                icon: '🧪',
                description: 'Explore the wonders of science and discovery!'
            },
            {
                name: 'Space Center',
                url: 'space-center.html',
                icon: '🚀',
                description: 'Journey to the stars and learn about space!'
            },
            {
                name: 'Whiskers World',
                url: 'whiskersworld.html',
                icon: '🐱',
                description: 'The ultimate fan site for Snakesian cats and their unique characteristics. Featuring facts, care tips, and photos of our special 19-toed felines!'
            },
            {
                name: 'Art Studio',
                url: 'art-studio.html',
                icon: '🎨',
                description: 'Create beautiful artwork and learn to draw!'
            },
            {
                name: 'Snoogle Dictionary',
                url: 'snoogle-dictionary.html',
                icon: '📖',
                description: 'Comprehensive dictionary and language reference tool featuring Snakesian and standard English definitions, etymologies, and usage examples.'
            },
            {   
                name: 'Snooglepedia',
                url: 'snooglepedia.html',
                icon: '📚',
                description: 'Free online encyclopedia covering topics from Snakesian history to modern technology. Community-edited with verified sources.'
            },
            {
                name: 'Music Box',
                url: 'music-box.html',
                icon: '🎵',
                description: 'Listen to music and learn about instruments!'
            },
            {
                name: 'Fun Zone',
                url: 'fun-zone.html',
                icon: '🎪',
                description: 'Jokes, riddles, and lots of laughs!'
            },
            {
                name: 'Kid News',
                url: 'kid-news.html',
                icon: '📰',
                description: 'News and updates for curious kids!'
            },
            {
                name: 'Cooking Corner',
                url: 'cooking-corner.html',
                icon: '👨‍🍳',
                description: 'Easy recipes and cooking fun!'
            },
            {
                name: 'Sports Central',
                url: 'sports-central.html',
                icon: '🌪️',
                description: 'Sports, games, and staying active!'
            }
        ];
    }

    setupEventListeners() {
        // Listen for WiFi connection changes
        this.eventBus.on('wifi.connected', () => {
            this.isConnected = true;
            this.refreshCurrentPage();
        });

        this.eventBus.on('wifi.disconnected', () => {
            this.isConnected = false;
            this.refreshCurrentPage();
        });
    }

    launch() {
        if (this.windowId && this.windowManager.windows.has(this.windowId)) {
            this.windowManager.focusWindow(this.windowId);
            return;
        }

        // Check current WiFi status
        if (elxaOS.wifiService) {
            this.isConnected = elxaOS.wifiService.isOnline();
        }

        this.windowId = `browser-${Date.now()}`;
        
        const browserHtml = this.createBrowserHTML();
        
        const window = this.windowManager.createWindow(
            this.windowId,
            '🌐 Snoogle Browser',
            browserHtml,
            {
                width: '800px',
                height: '600px',
                x: '50px',
                y: '50px'
            }
        );

        window.classList.add('browser-window');
        this.setupBrowserEvents();
        
        // Load homepage or no internet page
        this.navigateToHome();
    }

    createBrowserHTML() {
        return `
            <div class="browser-toolbar">
                <button class="nav-button" id="backBtn" title="Back" disabled>◄</button>
                <button class="nav-button" id="forwardBtn" title="Forward" disabled>►</button>
                <button class="nav-button" id="refreshBtn" title="Refresh">↻</button>
                <div class="address-bar">
                    <input type="text" class="url-input" id="urlInput" placeholder="Enter URL or search...">
                    <button class="go-button" id="goBtn">Go</button>
                </div>
                <div class="browser-actions">
                    <button class="home-button" id="homeBtn" title="Home">🏠</button>
                    <button class="favorite-button" id="favoriteBtn" title="Add to Favorites">⭐</button>
                    <button class="nav-button" id="menuBtn" title="Menu">☰</button>
                </div>
            </div>
            <div class="browser-content">
                <div class="browser-sidebar" id="browserSidebar">
                    <div class="sidebar-tabs">
                        <button class="sidebar-tab active" data-tab="favorites">Favorites</button>
                        <button class="sidebar-tab" data-tab="history">History</button>
                    </div>
                    <div class="sidebar-content" id="sidebarContent">
                        <!-- Sidebar content will be populated dynamically -->
                    </div>
                </div>
                <div class="browser-page" id="browserPage">
                    <div class="browser-loading" id="browserLoading" style="display: none;"></div>
                    <!-- Page content will be loaded here -->
                </div>
            </div>
            <div class="browser-menu" id="browserMenu" style="display: none;">
                <div class="browser-menu-item" data-action="favorites">⭐ Show Favorites</div>
                <div class="browser-menu-item" data-action="history">📋 Show History</div>
                <div class="browser-menu-separator"></div>
                <div class="browser-menu-item" data-action="clearHistory">🗑️ Clear History</div>
                <div class="browser-menu-item" data-action="clearFavorites">❌ Clear Favorites</div>
            </div>
        `;
    }

    setupBrowserEvents() {
        const window = this.windowManager.windows.get(this.windowId).element;
        
        // Navigation buttons
        window.querySelector('#backBtn').addEventListener('click', () => this.goBack());
        window.querySelector('#forwardBtn').addEventListener('click', () => this.goForward());
        window.querySelector('#refreshBtn').addEventListener('click', () => this.refresh());
        window.querySelector('#homeBtn').addEventListener('click', () => this.navigateToHome());
        
        // URL input and Go button
        const urlInput = window.querySelector('#urlInput');
        const goBtn = window.querySelector('#goBtn');
        
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.navigate(urlInput.value);
            }
        });
        
        goBtn.addEventListener('click', () => {
            this.navigate(urlInput.value);
        });
        
        // Favorite button
        window.querySelector('#favoriteBtn').addEventListener('click', () => this.toggleFavorite());
        
        // Menu button
        const menuBtn = window.querySelector('#menuBtn');
        const menu = window.querySelector('#browserMenu');
        
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        });
        
        // Close menu when clicking elsewhere
        document.addEventListener('click', () => {
            menu.style.display = 'none';
        });
        
        // Menu actions
        menu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) {
                this.handleMenuAction(action);
                menu.style.display = 'none';
            }
        });
        
        // Sidebar tabs
        const sidebarTabs = window.querySelectorAll('.sidebar-tab');
        sidebarTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                sidebarTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.updateSidebar(tab.dataset.tab);
            });
        });
        
        this.updateSidebar('favorites');
    }

    navigate(input) {
        if (!input.trim()) {
            this.loadPage('snoogle.ex');
            return;
        }
        
        this.showLoading();
        
        // Simulate loading time
        setTimeout(() => {
            this.hideLoading();
            
            // Check if it's a search query or URL
            if (input.includes('.ex') || input === 'directory') {
                this.loadPage(input);
            } else {
                this.performSearch(input);
            }
        }, 500);
    }

    loadPage(url) {
        if (!this.isConnected) {
            this.showNoInternetPage();
            return;
        }

        this.addToHistory(url);
        this.currentUrl = url;
        this.updateAddressBar();
        this.updateNavigationButtons();
        this.updateFavoriteButton();

        switch (url) {
            case 'snoogle.ex':
            case '':
                this.showSnoogleHomepage();
                break;
            case 'directory':
                this.showSiteDirectory();
                break;
            default:
                if (url.includes('search:')) {
                    const query = url.replace('search:', '');
                    this.showSearchResults(query);
                } else {
                    this.loadWebsite(url);
                }
                break;
        }
    }

    showSnoogleHomepage() {
        const content = `
            <div class="snoogle-homepage">
                <div class="snoogle-logo">Snoogle</div>
                <div class="snoogle-search">
                    <input type="text" class="search-input" id="snoogleSearchInput" placeholder="Search the ExWeb...">
                    <button class="search-button" id="snoogleSearchBtn">Search</button>
                </div>
                <div class="snoogle-buttons">
                    <button class="snoogle-btn" id="directoryBtn">📂 Browse All Sites</button>
                    <button class="snoogle-btn" id="randomBtn">🎲 I'm Feeling Lucky</button>
                </div>
                <div class="snoogle-footer">
                    Welcome to the ExWeb! 🌐
                </div>
            </div>
        `;
        
        this.setPageContent(content);
        this.setupSnoogleEvents();
    }

    setupSnoogleEvents() {
        const window = this.windowManager.windows.get(this.windowId).element;
        const searchInput = window.querySelector('#snoogleSearchInput');
        const searchBtn = window.querySelector('#snoogleSearchBtn');
        const directoryBtn = window.querySelector('#directoryBtn');
        const randomBtn = window.querySelector('#randomBtn');
        
        if (searchInput && searchBtn) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(searchInput.value);
                }
            });
            
            searchBtn.addEventListener('click', () => {
                this.performSearch(searchInput.value);
            });
        }
        
        if (directoryBtn) {
            directoryBtn.addEventListener('click', () => {
                this.loadPage('directory');
            });
        }
        
        if (randomBtn) {
            randomBtn.addEventListener('click', () => {
                // Get all main site URLs (not sub-pages)
                const mainSites = Object.keys(this.websiteRegistry).filter(url => 
                    !url.includes('/') && 
                    url !== 'directory' && 
                    this.websiteRegistry[url].type !== 'homepage'
                );
                
                if (mainSites.length > 0) {
                    const randomSite = mainSites[Math.floor(Math.random() * mainSites.length)];
                    this.loadPage(randomSite);
                }
            });
        }
    }

    performSearch(query) {
        if (!query.trim()) return;
        
        this.loadPage(`search:${query}`);
    }

    showSearchResults(query) {
        const results = this.searchWebsites(query);
        const resultCount = results.length;
        
        let content = `
            <div class="search-results-page">
                <div class="search-header">
                    <div class="search-logo">Snoogle</div>
                    <div class="search-stats">About ${resultCount} results for "${query}"</div>
                </div>
        `;
        
        if (results.length > 0) {
            results.forEach(site => {
                content += `
                    <div class="search-result">
                        <div class="result-url">elxaos.interwebs/${site.url}</div>
                        <div class="result-title" onclick="elxaOS.programs.browser.loadPage('${site.url}')">${site.name}</div>
                        <div class="result-description">${site.description}</div>
                    </div>
                `;
            });
        } else {
            content += `
                <div class="no-results">
                    <h3>No results found</h3>
                    <p>Try different keywords or browse our <span style="color: #1a0dab; cursor: pointer;" onclick="elxaOS.programs.browser.loadPage('directory')">site directory</span></p>
                </div>
            `;
        }
        
        content += '</div>';
        this.setPageContent(content);
    }

    searchWebsites(query) {
        const keywords = query.toLowerCase().split(' ');
        const results = new Set();
        
        // Search through all websites
        Object.entries(this.websiteRegistry).forEach(([url, site]) => {
            if (!site.searchData) return;
            
            // Skip special pages
            if (url === 'directory' || site.type === 'homepage') return;
            
            // Check keywords
            const keywordMatch = site.searchData.keywords.some(keyword => 
                keywords.some(searchTerm => keyword.toLowerCase().includes(searchTerm))
            );
            
            // Check title and description
            const titleMatch = keywords.some(searchTerm => 
                site.title.toLowerCase().includes(searchTerm)
            );
            const descMatch = keywords.some(searchTerm => 
                site.searchData.description.toLowerCase().includes(searchTerm)
            );
            
            if (keywordMatch || titleMatch || descMatch) {
                results.add({
                    url,
                    site,
                    relevance: this.calculateRelevance(query, site)
                });
            }
        });
        
        // Sort by relevance and return
        return Array.from(results)
            .sort((a, b) => b.relevance - a.relevance)
            .map(result => ({ url: result.url, ...result.site }));
    }

    calculateRelevance(query, site) {
        let relevance = 0;
        const queryLower = query.toLowerCase();
        
        // Title matches are most important
        if (site.title.toLowerCase().includes(queryLower)) {
            relevance += 10;
        }
        
        // Exact keyword matches
        site.searchData.keywords.forEach(keyword => {
            if (keyword.toLowerCase() === queryLower) {
                relevance += 5;
            } else if (keyword.toLowerCase().includes(queryLower)) {
                relevance += 2;
            }
        });
        
        // Description matches
        if (site.searchData.description.toLowerCase().includes(queryLower)) {
            relevance += 1;
        }
        
        return relevance;
    }

    showSiteDirectory() {
        // Define categories and their display names
        const categories = {
            'Government': '🏛️ Government & Public Services',
            'Business': '💼 Business & Corporate',
            'Social': '👥 Social Networks',
            'Gaming': '🎮 Games & Entertainment',
            'Personal': '🏠 Personal Pages',
            'Education': '📚 Educational Resources',
            'Technology': '💻 Technology',
            'Utilities': '🔧 Utilities & Tools'
        };

        // Organize sites into categories (exclude sub-pages and special pages)
        const categorizedSites = {};
        Object.entries(this.websiteRegistry)
            .filter(([url, site]) => {
                // Only include main pages (not sub-pages like /about, /business)
                return !url.includes('/') && url !== 'directory' && site.type !== 'homepage';
            })
            .forEach(([url, site]) => {
                const category = site.searchData.category;
                if (!categorizedSites[category]) {
                    categorizedSites[category] = [];
                }
                categorizedSites[category].push({ url, site });
            });

        // Generate HTML for each category
        const categoryHTML = Object.entries(categories)
            .map(([category, displayName]) => {
                if (!categorizedSites[category] || categorizedSites[category].length === 0) {
                    return ''; // Skip empty categories
                }

                const sitesHTML = categorizedSites[category]
                    .sort((a, b) => a.site.title.localeCompare(b.site.title))
                    .map(({ url, site }) => `
                        <div class="site-card" onclick="elxaOS.programs.browser.loadPage('${url}')">
                            <div class="site-icon">${this.getSiteIcon(site.searchData.category)}</div>
                            <div class="site-name">${site.title}</div>
                            <div class="site-description">${site.searchData.description}</div>
                        </div>
                    `).join('');

                return `
                    <div class="category-section">
                        <h2>${displayName}</h2>
                        <div class="site-grid">
                            ${sitesHTML}
                        </div>
                    </div>
                `;
            }).join('');

        const content = `
            <div class="site-directory">
                <div class="directory-header">
                    <div class="directory-title">📂 ExWeb Directory</div>
                    <div class="directory-subtitle">Explore all the amazing sites on our network!</div>
                </div>
                ${categoryHTML}
            </div>
        `;
        
        this.setPageContent(content);
    }

    getSiteIcon(category) {
        const icons = {
            'Government': '🏛️',
            'Business': '💼',
            'Social': '👥',
            'Gaming': '🎮',
            'Personal': '🏠',
            'Education': '📚',
            'Technology': '💻',
            'Utilities': '🔧'
        };
        return icons[category] || '🌐';
    }

    async loadWebsite(url) {
        const site = this.websiteRegistry[url];
        if (!site) {
            return this.show404Page(url);
        }

        if (site.type === 'homepage') {
            this.showSnoogleHomepage();
            return;
        }

        if (site.type === 'directory') {
            this.showSiteDirectory();
            return;
        }

        if (site.type === 'file') {
            try {
                // Try to load the actual HTML file
                const response = await fetch(site.path);
                if (response.ok) {
                    let html = await response.text();
                    
                    // Load CSS if it exists
                    let css = '';
                    if (site.css) {
                        try {
                            const cssResponse = await fetch(site.css);
                            if (cssResponse.ok) {
                                css = await cssResponse.text();
                            }
                        } catch (e) {
                            console.log('CSS file not found, using HTML only');
                        }
                    }
                    
                    // Combine CSS and HTML
                    const content = css ? `<style>${css}</style>${html}` : html;
                    this.setPageContent(content);
                    
                    // Execute any scripts in the loaded content
                    this.executePageScripts();
                    
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (error) {
                console.error('Error loading website:', error);
                this.showFileNotFoundPage(site, url);
            }
        }
    }

    executePageScripts() {
        // Execute any script tags in the loaded content
        const container = this.windowManager.windows.get(this.windowId).element.querySelector('#browserPage');
        const scripts = container.getElementsByTagName('script');
        Array.from(scripts).forEach(script => {
            try {
                const newScript = document.createElement('script');
                Array.from(script.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value);
                });
                newScript.textContent = script.textContent;
                script.parentNode.replaceChild(newScript, script);
            } catch (e) {
                console.error('Error executing script:', e);
            }
        });
    }

    showFileNotFoundPage(site, url) {
        const content = `
            <div style="padding: 40px; text-align: center; background: white; min-height: 100%;">
                <div style="font-size: 64px; margin-bottom: 20px;">📄</div>
                <h1 style="color: #333; margin-bottom: 16px;">${site.title}</h1>
                <p style="color: #666; font-size: 16px; margin-bottom: 24px;">
                    ${site.searchData.description}
                </p>
                <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border: 1px solid #ffeaa7; max-width: 500px; margin: 0 auto;">
                    <h3 style="color: #856404; margin-bottom: 12px;">🚧 Under Construction</h3>
                    <p style="font-size: 14px; color: #856404; line-height: 1.5;">
                        This website is being built! The HTML file should be placed at:<br>
                        <code>${site.path}</code>
                    </p>
                </div>
                <div style="margin-top: 30px;">
                    <button onclick="elxaOS.programs.browser.navigateToHome()" 
                            style="background: #4285f4; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        🏠 Back to Snoogle
                    </button>
                </div>
            </div>
        `;
        
        this.setPageContent(content);
    }

    show404Page(url) {
        const content = `
            <div style="padding: 40px; text-align: center; background: white; min-height: 100%;">
                <div style="font-size: 96px; margin-bottom: 20px;">❌</div>
                <h1 style="color: #d32f2f; margin-bottom: 16px;">404 - Page Not Found</h1>
                <p style="color: #666; font-size: 16px; margin-bottom: 24px;">
                    The page "${url}" doesn't exist on the ExWeb.
                </p>
                <div style="margin-top: 30px;">
                    <button onclick="elxaOS.programs.browser.navigateToHome()" 
                            style="background: #4285f4; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 14px; margin-right: 12px;">
                        🏠 Back to Snoogle
                    </button>
                    <button onclick="elxaOS.programs.browser.loadPage('directory')" 
                            style="background: #34a853; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        📂 Browse Sites
                    </button>
                </div>
            </div>
        `;
        
        this.setPageContent(content);
    }

    showNoInternetPage() {
        const content = `
            <div class="no-internet-page">
                <div class="no-internet-icon">📡</div>
                <div class="no-internet-title">No Internet Connection</div>
                <div class="no-internet-message">
                    Oops! It looks like you're not connected to the ElxaNet. 
                    Connect to WiFi to browse the amazing sites on our network!
                </div>
                <button class="wifi-connect-btn" onclick="elxaOS.wifiService.showWiFiDialog()">
                    📶 Connect to WiFi
                </button>
            </div>
        `;
        
        this.setPageContent(content);
    }

    setPageContent(content) {
        const window = this.windowManager.windows.get(this.windowId).element;
        const page = window.querySelector('#browserPage');
        if (page) {
            page.innerHTML = content;
        }
    }

    addToHistory(url) {
        if (url === this.currentUrl) return;
        
        // Remove any items after current position (when navigating after going back)
        this.history = this.history.slice(0, this.currentHistoryIndex + 1);
        
        const historyItem = {
            url: url,
            title: this.getPageTitle(url),
            timestamp: new Date().toLocaleString()
        };
        
        this.history.push(historyItem);
        this.currentHistoryIndex = this.history.length - 1;
        
        // Keep only last 50 items
        if (this.history.length > 50) {
            this.history = this.history.slice(-50);
            this.currentHistoryIndex = this.history.length - 1;
        }
        
        this.saveUserData();
        this.updateSidebar('history');
    }

    getPageTitle(url) {
        switch (url) {
            case 'snoogle.ex':
            case '':
                return 'Snoogle - Search the ExWeb';
            case 'directory':
                return 'ExWeb Directory';
            default:
                if (url.includes('search:')) {
                    return `Search Results - ${url.replace('search:', '')}`;
                }
                // Use websiteRegistry instead of websites array
                const site = this.websiteRegistry[url];
                return site ? site.title : url;
        }
    }

    goBack() {
        if (this.currentHistoryIndex > 0) {
            this.currentHistoryIndex--;
            const item = this.history[this.currentHistoryIndex];
            this.currentUrl = item.url;
            this.loadPage(item.url);
        }
    }

    goForward() {
        if (this.currentHistoryIndex < this.history.length - 1) {
            this.currentHistoryIndex++;
            const item = this.history[this.currentHistoryIndex];
            this.currentUrl = item.url;
            this.loadPage(item.url);
        }
    }

    refresh() {
        this.loadPage(this.currentUrl);
    }

    navigateToHome() {
        this.loadPage('snoogle.ex');
    }

    refreshCurrentPage() {
        this.loadPage(this.currentUrl || 'snoogle.ex');
    }

    toggleFavorite() {
        if (!this.currentUrl || this.currentUrl === 'snoogle.com') return;
        
        const existingIndex = this.favorites.findIndex(f => f.url === this.currentUrl);
        
        if (existingIndex >= 0) {
            // Remove from favorites
            this.favorites.splice(existingIndex, 1);
            this.showMessage('Removed from favorites', 'info');
        } else {
            // Add to favorites
            const favorite = {
                url: this.currentUrl,
                title: this.getPageTitle(this.currentUrl),
                icon: this.getPageIcon(this.currentUrl),
                timestamp: new Date().toLocaleString()
            };
            this.favorites.push(favorite);
            this.showMessage('Added to favorites', 'success');
        }
        
        this.updateFavoriteButton();
        this.saveUserData();
        this.updateSidebar('favorites');
    }

    getPageIcon(url) {
        // Use websiteRegistry instead of websites array
        const site = this.websiteRegistry[url];
        if (site && site.searchData) {
            return this.getSiteIcon(site.searchData.category);
        }
        return '🌐';
    }

    updateAddressBar() {
        const window = this.windowManager.windows.get(this.windowId).element;
        const urlInput = window.querySelector('#urlInput');
        if (urlInput) {
            urlInput.value = this.currentUrl || 'snoogle.ex';
        }
    }

    updateNavigationButtons() {
        const window = this.windowManager.windows.get(this.windowId).element;
        const backBtn = window.querySelector('#backBtn');
        const forwardBtn = window.querySelector('#forwardBtn');
        
        if (backBtn) {
            backBtn.disabled = this.currentHistoryIndex <= 0;
        }
        if (forwardBtn) {
            forwardBtn.disabled = this.currentHistoryIndex >= this.history.length - 1;
        }
    }

    updateFavoriteButton() {
        const window = this.windowManager.windows.get(this.windowId).element;
        const favoriteBtn = window.querySelector('#favoriteBtn');
        
        if (favoriteBtn) {
            const isFavorited = this.favorites.some(f => f.url === this.currentUrl);
            favoriteBtn.classList.toggle('favorited', isFavorited);
            favoriteBtn.title = isFavorited ? 'Remove from Favorites' : 'Add to Favorites';
        }
    }

    updateSidebar(tab) {
        const window = this.windowManager.windows.get(this.windowId).element;
        const sidebarContent = window.querySelector('#sidebarContent');
        
        if (!sidebarContent) return;
        
        let content = '';
        
        if (tab === 'favorites') {
            if (this.favorites.length === 0) {
                content = '<div style="padding: 20px; text-align: center; color: #666; font-size: 11px;">No favorites yet!<br>Click ⭐ to add pages</div>';
            } else {
                this.favorites.forEach(fav => {
                    content += `
                        <div class="sidebar-item" onclick="elxaOS.programs.browser.loadPage('${fav.url}')">
                            <div class="sidebar-item-icon">${fav.icon}</div>
                            <div class="sidebar-item-info">
                                <div class="sidebar-item-title">${fav.title}</div>
                                <div class="sidebar-item-url">${fav.url}</div>
                            </div>
                        </div>
                    `;
                });
            }
        } else if (tab === 'history') {
            if (this.history.length === 0) {
                content = '<div style="padding: 20px; text-align: center; color: #666; font-size: 11px;">No history yet!</div>';
            } else {
                // Show most recent first
                const recentHistory = [...this.history].reverse().slice(0, 20);
                recentHistory.forEach(item => {
                    content += `
                        <div class="sidebar-item" onclick="elxaOS.programs.browser.loadPage('${item.url}')">
                            <div class="sidebar-item-icon">🌐</div>
                            <div class="sidebar-item-info">
                                <div class="sidebar-item-title">${item.title}</div>
                                <div class="sidebar-item-url">${item.url}</div>
                                <div class="sidebar-item-time">${item.timestamp}</div>
                            </div>
                        </div>
                    `;
                });
                
                content += '<button class="clear-history-btn" onclick="elxaOS.programs.browser.clearHistory()">Clear History</button>';
            }
        }
        
        sidebarContent.innerHTML = content;
    }

    handleMenuAction(action) {
        const sidebar = this.windowManager.windows.get(this.windowId).element.querySelector('#browserSidebar');
        
        switch (action) {
            case 'favorites':
                sidebar.classList.toggle('visible');
                this.updateSidebar('favorites');
                break;
            case 'history':
                sidebar.classList.toggle('visible');
                this.updateSidebar('history');
                break;
            case 'clearHistory':
                if (confirm('Clear all browsing history?')) {
                    this.clearHistory();
                }
                break;
            case 'clearFavorites':
                if (confirm('Clear all favorites?')) {
                    this.clearFavorites();
                }
                break;
        }
    }

    clearHistory() {
        this.history = [];
        this.currentHistoryIndex = -1;
        this.saveUserData();
        this.updateSidebar('history');
        this.updateNavigationButtons();
        this.showMessage('History cleared', 'info');
    }

    clearFavorites() {
        this.favorites = [];
        this.saveUserData();
        this.updateSidebar('favorites');
        this.updateFavoriteButton();
        this.showMessage('Favorites cleared', 'info');
    }

    showLoading() {
        const window = this.windowManager.windows.get(this.windowId).element;
        const loading = window.querySelector('#browserLoading');
        if (loading) {
            loading.style.display = 'block';
        }
    }

    hideLoading() {
        const window = this.windowManager.windows.get(this.windowId).element;
        const loading = window.querySelector('#browserLoading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    showMessage(text, type = 'info') {
        // Reuse the message system from WiFi service
        if (elxaOS.wifiService && typeof elxaOS.wifiService.showMessage === 'function') {
            elxaOS.wifiService.showMessage(text, type);
        }
    }

    saveUserData() {
        try {
            // Save to file system
            const userData = {
                favorites: this.favorites,
                history: this.history.slice(-20) // Keep only last 20 items for storage
            };
            
            this.fileSystem.createFile(['root', 'Documents'], 'browser-data.json', JSON.stringify(userData));
        } catch (error) {
            console.error('Failed to save browser data:', error);
        }
    }

    loadUserData() {
        try {
            const file = this.fileSystem.getFile(['root', 'Documents'], 'browser-data.json');
            if (file && file.content) {
                const userData = JSON.parse(file.content);
                this.favorites = userData.favorites || [];
                this.history = userData.history || [];
                this.currentHistoryIndex = this.history.length - 1;
            }
        } catch (error) {
            console.log('No previous browser data found, starting fresh');
            this.favorites = [];
            this.history = [];
            this.currentHistoryIndex = -1;
        }
    }

    // Public method for external access
    static getInstance() {
        return elxaOS.programs.browser;
    }
}