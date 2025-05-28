// =================================
// SNOOGLE BROWSER WITH WIFI INTEGRATION
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
        this.websiteRegistry = {};
        this.loadWebsiteRegistry();
        this.visitorCount = this.getVisitorCount();
        this.eventListeners = []; // Track event listeners for cleanup
        
        this.setupEventListeners();
        this.loadUserData();
    }

    // Check if the browser window is still valid
    isWindowValid() {
        return this.windowId && this.windowManager.windows.has(this.windowId);
    }

    // Safe method to get window element with validation
    getWindowElement() {
        if (!this.isWindowValid()) {
            return null;
        }
        return this.windowManager.windows.get(this.windowId).element;
    }

    getVisitorCount() {
        // Generate a fake but consistent visitor count
        const base = 2847;
        const today = new Date().toDateString();
        const hash = today.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        return base + Math.abs(hash % 1000);
    }

    async loadWebsiteRegistry() {
        try {
            console.log('📁 Loading website registry from JSON...');
            
            // Try multiple possible paths
            const possiblePaths = [
                './js/programs/website-registry.json',
                './website-registry.json',
                'js/programs/website-registry.json',
                '/js/programs/website-registry.json'
            ];
            
            let data = null;
            let successfulPath = null;
            
            for (const path of possiblePaths) {
                try {
                    console.log(`🔍 Trying path: ${path}`);
                    const response = await fetch(path);
                    if (response.ok) {
                        data = await response.json();
                        successfulPath = path;
                        console.log(`✅ Successfully loaded from: ${path}`);
                        console.log('📊 Raw JSON data:', data);
                        break;
                    } else {
                        console.log(`❌ Path failed with status: ${response.status}`);
                    }
                } catch (pathError) {
                    console.log(`❌ Path ${path} failed:`, pathError.message);
                }
            }
            
            if (!data) {
                throw new Error('Could not load website registry from any path');
            }
            
            // Check if data has websites property or is the websites object directly
            if (data.websites) {
                this.websiteRegistry = data.websites;
                console.log(`✅ Loaded ${Object.keys(this.websiteRegistry).length} websites from data.websites`);
            } else if (typeof data === 'object' && Object.keys(data).length > 0) {
                // Maybe the JSON is structured as the websites object directly
                this.websiteRegistry = data;
                console.log(`✅ Loaded ${Object.keys(this.websiteRegistry).length} websites directly from data`);
            } else {
                throw new Error('JSON data does not contain valid website registry');
            }
            
        } catch (error) {
            console.error('❌ Failed to load website registry:', error);
            console.log('🔧 Using fallback website registry');
            // Fallback to minimal registry
            this.websiteRegistry = {
                'snoogle.ex': {
                    title: 'Snoogle - Search the ExWeb',
                    type: 'homepage',
                    searchData: {
                        keywords: ['search', 'home', 'snoogle'],
                        description: 'Search the ExWeb and discover amazing websites!',
                        category: 'Search'
                    }
                },
                'elxamail.ex': {
                    title: 'ElxaMail - Your Gateway to the ExWeb',
                    type: 'file',
                    path: './assets/interwebs/exmail/index.html',
                    searchData: {
                        keywords: ['email', 'mail', 'messaging'],
                        description: 'Snakesia\'s premier email service.',
                        category: 'Utilities'
                    }
                }
            };
            console.log('✅ Fallback registry loaded with', Object.keys(this.websiteRegistry).length, 'websites');
        }
    }

    setupEventListeners() {
        // Store event listener cleanup functions
        const cleanupFunctions = [];

        // Listen for WiFi connection changes with proper cleanup
        const onWifiConnected = (data) => {
            console.log('🌐 Browser: WiFi connected', data);
            this.isConnected = true;
            this.updateConnectionStatus();
            this.refreshCurrentPageSafe();
        };

        const onWifiDisconnected = () => {
            console.log('🌐 Browser: WiFi disconnected');
            this.isConnected = false;
            this.updateConnectionStatus();
            this.refreshCurrentPageSafe();
        };

        this.eventBus.on('wifi.connected', onWifiConnected);
        this.eventBus.on('wifi.disconnected', onWifiDisconnected);

        // Store cleanup functions for later removal
        cleanupFunctions.push(
            () => this.eventBus.off('wifi.connected', onWifiConnected),
            () => this.eventBus.off('wifi.disconnected', onWifiDisconnected)
        );

        // Listen for window close events to clean up
        const onWindowClosed = (data) => {
            if (data.id === this.windowId) {
                console.log('🌐 Browser: Window closed, cleaning up...');
                this.clearPageScripts();
                this.windowId = null;
                // Clean up all event listeners
                cleanupFunctions.forEach(cleanup => cleanup());
            }
        };

        this.eventBus.on('window.closed', onWindowClosed);
        cleanupFunctions.push(() => this.eventBus.off('window.closed', onWindowClosed));

        // Store cleanup functions for external access
        this.cleanupEventListeners = () => {
            cleanupFunctions.forEach(cleanup => cleanup());
        };
    }

    // Safe version of refreshCurrentPage that checks window validity
    refreshCurrentPageSafe() {
        if (!this.isWindowValid()) {
            console.log('🌐 Browser: Skipping refresh - window no longer valid');
            return;
        }
        this.refreshCurrentPage();
    }

    // Update connection status in the browser UI
    updateConnectionStatus() {
        if (!this.isWindowValid()) return;

        const window = this.getWindowElement();
        if (!window) return;

        // Update the toolbar to show connection status
        const toolbar = window.querySelector('.browser-toolbar');
        if (toolbar) {
            // Remove existing connection indicator
            const existingIndicator = toolbar.querySelector('.connection-status');
            if (existingIndicator) {
                existingIndicator.remove();
            }

            // Add new connection indicator
            const indicator = document.createElement('div');
            indicator.className = 'connection-status';
            indicator.style.cssText = `
                display: flex;
                align-items: center;
                padding: 2px 8px;
                font-size: 10px;
                border-radius: 3px;
                margin-left: 8px;
                ${this.isConnected ? 
                    'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : 
                    'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'
                }
            `;

            if (this.isConnected) {
                const connectionInfo = elxaOS.wifiService?.getConnectionInfo();
                if (connectionInfo) {
                    indicator.innerHTML = `📶 ${connectionInfo.network} (${Math.round(connectionInfo.signalStrength)}/5)`;
                    indicator.title = `Connected to ${connectionInfo.network}\nSecurity: ${connectionInfo.security}\nFrequency: ${connectionInfo.frequency}`;
                } else {
                    indicator.innerHTML = '🌐 Online';
                }
            } else {
                indicator.innerHTML = '📡 Offline';
                indicator.title = 'No internet connection - Click to connect to WiFi';
                indicator.style.cursor = 'pointer';
                indicator.addEventListener('click', () => {
                    if (elxaOS.wifiService) {
                        elxaOS.wifiService.showWiFiDialog();
                    }
                });
            }

            // Insert before the browser actions
            const actions = toolbar.querySelector('.browser-actions');
            if (actions) {
                toolbar.insertBefore(indicator, actions);
            } else {
                toolbar.appendChild(indicator);
            }
        }
    }

    async launch() {
        if (this.windowId && this.windowManager.windows.has(this.windowId)) {
            this.windowManager.focusWindow(this.windowId);
            return;
        }

        // Ensure website registry is loaded before launching
        if (Object.keys(this.websiteRegistry).length === 0) {
            await this.loadWebsiteRegistry();
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
        
        // Update connection status indicator
        this.updateConnectionStatus();
        
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
                    <button class="nav-button" id="wifiBtn" title="WiFi Settings">📶</button>
                    <button class="nav-button" id="menuBtn" title="Menu">☰</button>
                    <button class="nav-button" id="debugBtn" title="Debug Info">🔍</button>
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
                <div class="browser-menu-separator"></div>
                <div class="browser-menu-item" data-action="wifiSettings">📶 WiFi Settings</div>
            </div>
        `;
    }

    setupBrowserEvents() {
        const window = this.getWindowElement();
        if (!window) return;
        
        // Navigation buttons
        window.querySelector('#backBtn').addEventListener('click', () => this.goBack());
        window.querySelector('#forwardBtn').addEventListener('click', () => this.goForward());
        window.querySelector('#refreshBtn').addEventListener('click', () => this.refresh());
        window.querySelector('#homeBtn').addEventListener('click', () => this.navigateToHome());
        
        // WiFi button - NEW
        window.querySelector('#wifiBtn').addEventListener('click', () => {
            if (elxaOS.wifiService) {
                elxaOS.wifiService.showWiFiDialog();
            }
        });
        
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
        
        // Debug button
        window.querySelector('#debugBtn').addEventListener('click', () => this.showDebugInfo());
        
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

        console.log(`🌐 Loading page: ${url}`);
        
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
        const totalSites = Object.keys(this.websiteRegistry).length - 2; // Exclude homepage and directory
        
        const content = `
            <div class="snoogle-homepage">
                <div class="snoogle-header">
                    <div class="snoogle-logo">
                        <span class="letter-s1">S</span><span class="letter-n1">n</span><span class="letter-o1">o</span><span class="letter-o2">o</span><span class="letter-g1">g</span><span class="letter-l1">l</span><span class="letter-e1">e</span>
                    </div>
                    <div class="snoogle-tagline">Search the ExWeb</div>
                </div>
                
                <div class="snoogle-search-container">
                    <div class="snoogle-search">
                        <input type="text" class="search-input" id="snoogleSearchInput" placeholder="Search">
                        <button class="search-button" id="snoogleSearchBtn">Snoogle Search</button>
                    </div>
                    <div class="snoogle-buttons">
                        <button class="snoogle-btn" id="directoryBtn">Browse Directory</button>
                        <button class="snoogle-btn" id="randomBtn">I'm Feeling Lucky</button>
                    </div>
                </div>

                <div class="snoogle-stats">
                    <table class="stats-table">
                        <tr>
                            <td>ExWeb pages indexed:</td>
                            <td class="stats-number">${totalSites}</td>
                        </tr>
                        <tr>
                            <td>Active sites:</td>
                            <td class="stats-number">${totalSites}</td>
                        </tr>
                        <tr>
                            <td>Visitors today:</td>
                            <td class="stats-number">${this.visitorCount}</td>
                        </tr>
                    </table>
                    <p style="margin-top: 15px; font-size: 10px;">
                        © 1997 Snoogle Corp. | 
                        <a href="#" style="color: #0066cc;" onclick="elxaOS.programs.browser.loadPage('directory')">Browse Sites</a> | 
                        About Snoogle
                    </p>
                </div>
            </div>
        `;
        
        this.setPageContent(content);
        this.setupSnoogleEvents();
    }

    setupSnoogleEvents() {
        const window = this.getWindowElement();
        if (!window) return;
        
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

    setupPageLinkHandling() {
        const window = this.getWindowElement();
        if (!window) return;
        
        const browserPage = window.querySelector('#browserPage');
        
        // Remove any existing listeners to avoid duplicates
        if (this.linkClickHandler) {
            browserPage.removeEventListener('click', this.linkClickHandler);
        }
        
        // Create the link click handler
        this.linkClickHandler = (e) => {
            const link = e.target.closest('a');
            if (link && (link.href || link.getAttribute('href'))) {
                e.preventDefault(); // Always prevent default navigation
                
                // Get href from either href or href attribute
                const href = link.getAttribute('href') || link.href;
                
                // Handle different types of links
                if (href.startsWith('#')) {
                    // Anchor links - scroll to element or ignore
                    this.handleAnchorLink(href);
                } else if (href.startsWith('http://') || href.startsWith('https://')) {
                    // External links - ignore silently (REMOVED TOAST)
                    console.log(`🌐 External link clicked: ${href} (ignoring silently)`);
                } else if (href.startsWith('mailto:') || href.startsWith('tel:')) {
                    // Special protocol links - ignore silently (REMOVED TOAST)
                    console.log(`📧 Special link clicked: ${href} (ignoring silently)`);
                } else if (href.startsWith('javascript:')) {
                    // JavaScript links - ignore completely
                    console.log('🚫 Ignoring JavaScript link');
                    return;
                } else if (href === '/' || href === './index.html' || href === 'index.html' || href === './') {
                    // Home page of current site
                    this.navigateToSiteHome();
                } else {
                    // Relative links - try to navigate within our site structure
                    this.handleRelativeLink(href);
                }
            }
        };
        
        // Add the event listener
        browserPage.addEventListener('click', this.linkClickHandler);
    }

    handleAnchorLink(href) {
        // Try to scroll to the element with the matching ID
        const window = this.getWindowElement();
        if (!window) return;
        
        const browserPage = window.querySelector('#browserPage');
        const targetId = href.substring(1); // Remove the #
        const targetElement = browserPage.querySelector(`#${targetId}`);
        
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
        // If element doesn't exist, just ignore the click
    }

    navigateToSiteHome() {
        // Navigate to the home page of the current site
        const baseUrl = this.getCurrentSiteBaseUrl();
        if (baseUrl) {
            console.log(`🏠 Navigating to site home: ${baseUrl}`);
            this.loadPage(baseUrl);
        }
    }

    getCurrentSiteBaseUrl() {
        // Extract base URL from current URL
        if (this.currentUrl.includes('/')) {
            return this.currentUrl.split('/')[0];
        }
        return this.currentUrl;
    }

    handleRelativeLink(href) {
        console.log(`🔗 handleRelativeLink called:`, {
            href: href,
            currentUrl: this.currentUrl,
            availableUrls: Object.keys(this.websiteRegistry).filter(url => url.startsWith(this.getCurrentSiteBaseUrl()))
        });
        
        let targetUrl;
        
        // Get the base site URL (everything before the first slash)
        const baseUrl = this.getCurrentSiteBaseUrl();
        console.log(`🏠 Base URL: ${baseUrl}`);
        
        // Clean up the href - remove .html extension and leading ./
        let cleanPath = href;
        if (cleanPath.startsWith('./')) {
            cleanPath = cleanPath.substring(2);
        }
        if (cleanPath.startsWith('/')) {
            cleanPath = cleanPath.substring(1);
        }
        if (cleanPath.endsWith('.html')) {
            cleanPath = cleanPath.replace('.html', '');
        }
        
        console.log(`🧹 Clean path: ${cleanPath}`);
        
        // Check if the clean path is already a complete URL in our system
        if (this.websiteRegistry[cleanPath]) {
            console.log(`✅ Clean path is already a complete URL: ${cleanPath}`);
            targetUrl = cleanPath;
        } else if (cleanPath === 'index' || cleanPath === '') {
            // Link to home page of the site
            targetUrl = baseUrl;
        } else {
            // Build the target URL
            targetUrl = `${baseUrl}/${cleanPath}`;
        }
        
        console.log(`🎯 Target URL constructed: ${targetUrl}`);
        
        // Check if this URL exists in our registry
        if (this.websiteRegistry[targetUrl]) {
            console.log(`✅ URL exists in registry, navigating...`);
            this.loadPage(targetUrl);
        } else {
            console.log(`❌ URL not found in registry`);
            console.log(`📋 Available URLs for this site:`, 
                Object.keys(this.websiteRegistry).filter(url => url.startsWith(baseUrl))
            );
            
            // Try some common variations
            const variations = [
                `${baseUrl}/${cleanPath.toLowerCase()}`,
                `${baseUrl}/${cleanPath.toUpperCase()}`,
                `${baseUrl}/${cleanPath.charAt(0).toUpperCase() + cleanPath.slice(1)}`
            ];
            
            let foundVariation = null;
            for (const variation of variations) {
                if (this.websiteRegistry[variation]) {
                    foundVariation = variation;
                    break;
                }
            }
            
            if (foundVariation) {
                console.log(`✅ Found variation: ${foundVariation}`);
                this.loadPage(foundVariation);
            } else {
                // REMOVED: No more toast messages for missing pages
                console.log(`🚫 Page "${targetUrl}" not found, ignoring silently`);
            }
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
                    <div class="search-stats">Results 1-${Math.min(10, resultCount)} of about ${resultCount} for <b>${query}</b> (0.${Math.floor(Math.random() * 89) + 10} seconds)</div>
                </div>
        `;
        
        if (results.length > 0) {
            results.slice(0, 10).forEach(site => {
                content += `
                    <div class="search-result">
                        <div class="result-url">elxaos.interwebs/${site.url}</div>
                        <div class="result-title" onclick="elxaOS.programs.browser.loadPage('${site.url}')">${site.title}</div>
                        <div class="result-description">${site.searchData.description}</div>
                    </div>
                `;
            });
            
            // Add pagination-style footer if there are more results
            if (results.length > 10) {
                content += `
                    <div style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ccc;">
                        <div style="font-size: 11px; color: #666;">
                            Result Page: <b>1</b> 2 3 4 5 6 7 8 9 10 <a href="#" style="color: #0000ee;">Next</a>
                        </div>
                    </div>
                `;
            }
        } else {
            content += `
                <div class="no-results">
                    <h3>Your search - <b>${query}</b> - did not match any documents.</h3>
                    <p>Suggestions:</p>
                    <ul style="text-align: left; display: inline-block;">
                        <li>Make sure all words are spelled correctly.</li>
                        <li>Try different keywords.</li>
                        <li>Try more general keywords.</li>
                        <li>Browse our <a href="#" style="color: #0000ee;" onclick="elxaOS.programs.browser.loadPage('directory')">directory</a> instead.</li>
                    </ul>
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
        // Define categories and their display names - Yahoo style
        const categories = {
            'Government': 'Government',
            'Business': 'Business and Economy',
            'Shopping': 'Shopping',
            'Social': 'Society and Culture',
            'Gaming': 'Recreation and Games',
            'Personal': 'Regional and Personal',
            'Education': 'Education',
            'Technology': 'Computers and Internet',
            'Utilities': 'Reference'
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

        // Generate HTML for each category - Yahoo style table layout
        const categoryHTML = Object.entries(categories)
            .map(([category, displayName]) => {
                if (!categorizedSites[category] || categorizedSites[category].length === 0) {
                    return ''; // Skip empty categories
                }

                const sitesHTML = categorizedSites[category]
                    .sort((a, b) => a.site.title.localeCompare(b.site.title))
                    .map(({ url, site }) => `
                        <tr>
                            <td style="width: 20px;">•</td>
                            <td>
                                <div class="site-link" onclick="elxaOS.programs.browser.loadPage('${url}')">${site.title}</div>
                                <div class="site-description">${site.searchData.description}</div>
                            </td>
                        </tr>
                    `).join('');

                return `
                    <div class="category-section">
                        <h2>${displayName}</h2>
                        <table class="site-category-table">
                            ${sitesHTML}
                        </table>
                    </div>
                `;
            }).join('');

        const totalSites = Object.keys(this.websiteRegistry).length - 2;
        
        const content = `
            <div class="site-directory">
                <div class="directory-header">
                    <div class="directory-title">ExWeb Directory</div>
                    <div class="directory-subtitle">A guide to ${totalSites} useful and interesting sites</div>
                </div>
                ${categoryHTML}
                <div class="directory-footer">
                    ${totalSites} sites listed • Last updated: ${new Date().toLocaleDateString()}<br>
                    © 1997 ElxaCorp • <a href="#" style="color: #0066cc;" onclick="elxaOS.programs.browser.navigateToHome()">Back to Snoogle</a>
                </div>
            </div>
        `;
        
        this.setPageContent(content);
    }

    getSiteIcon(category) {
        const icons = {
            'Government': '🏛️',
            'Business': '💼',
            'Shopping': '🛍️',
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
            console.log(`📄 Loading website file: ${site.path}`);
            
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
                    
                    // Set up link handling for this page
                    setTimeout(() => {
                        this.setupPageLinkHandling();
                    }, 100);
                    
                } else {
                    console.error(`Failed to load ${site.path}: HTTP ${response.status}`);
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (error) {
                console.error('Error loading website:', error);
                this.showFileNotFoundPage(site, url);
            }
        }
    }

    executePageScripts() {
        // Execute any script tags in the loaded content with error handling
        const container = this.getWindowElement()?.querySelector('#browserPage');
        if (!container) return;
        
        const scripts = container.getElementsByTagName('script');
        
        Array.from(scripts).forEach((script, index) => {
            try {
                // Create a safer script execution environment
                const newScript = document.createElement('script');
                Array.from(script.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value);
                });
                
                // Wrap the script content in a try-catch and add safety checks
                const wrappedContent = `
                    try {
                        // Create a safer environment for the script
                        const originalSetInterval = window.setInterval;
                        const originalSetTimeout = window.setTimeout;
                        const pageIntervals = [];
                        const pageTimeouts = [];
                        
                        // Override setInterval to track page-specific intervals
                        window.setInterval = function(fn, delay) {
                            const intervalId = originalSetInterval(function() {
                                try {
                                    // Check if the page container still exists before executing
                                    if (document.querySelector('#browserPage')) {
                                        fn();
                                    } else {
                                        // Page is gone, clear this interval
                                        clearInterval(intervalId);
                                    }
                                } catch (e) {
                                    console.warn('Page script error (interval):', e);
                                    clearInterval(intervalId);
                                }
                            }, delay);
                            pageIntervals.push(intervalId);
                            return intervalId;
                        };
                        
                        // Override setTimeout to track page-specific timeouts
                        window.setTimeout = function(fn, delay) {
                            const timeoutId = originalSetTimeout(function() {
                                try {
                                    // Check if the page container still exists before executing
                                    if (document.querySelector('#browserPage')) {
                                        fn();
                                    }
                                } catch (e) {
                                    console.warn('Page script error (timeout):', e);
                                }
                            }, delay);
                            pageTimeouts.push(timeoutId);
                            return timeoutId;
                        };
                        
                        // Store cleanup function for this page
                        if (!window.browserPageCleanup) {
                            window.browserPageCleanup = [];
                        }
                        window.browserPageCleanup.push(function() {
                            pageIntervals.forEach(id => clearInterval(id));
                            pageTimeouts.forEach(id => clearTimeout(id));
                        });
                        
                        // Execute the original script content
                        ${script.textContent}
                        
                        // Restore original functions
                        window.setInterval = originalSetInterval;
                        window.setTimeout = originalSetTimeout;
                        
                    } catch (e) {
                        console.warn('Page script execution error:', e);
                    }
                `;
                
                newScript.textContent = wrappedContent;
                script.parentNode.replaceChild(newScript, script);
            } catch (e) {
                console.error('Error setting up page script:', e);
            }
        });
    }

    showFileNotFoundPage(site, url) {
        const content = `
            <div style="padding: 40px; text-align: center; background: white; min-height: 100%; font-family: Arial, sans-serif;">
                <div style="font-size: 48px; margin-bottom: 20px;">📄</div>
                <h1 style="color: #333; margin-bottom: 16px; font-size: 24px;">${site.title}</h1>
                <p style="color: #666; font-size: 14px; margin-bottom: 24px; max-width: 500px; margin-left: auto; margin-right: auto;">
                    ${site.searchData.description}
                </p>
                <div style="background: #ffffcc; padding: 20px; border: 1px solid #cccc99; max-width: 500px; margin: 0 auto 20px auto;">
                    <h3 style="color: #666; margin-bottom: 12px; font-size: 16px;">Under Construction</h3>
                    <p style="font-size: 12px; color: #666; line-height: 1.4;">
                        This website is currently being developed.<br>
                        The content file should be located at: <code>${site.path}</code>
                    </p>
                </div>
                <div style="margin-top: 30px;">
                    <button onclick="elxaOS.programs.browser.navigateToHome()" 
                            style="background: #f0f0f0; border: 1px outset #ccc; color: #000; padding: 8px 16px; cursor: pointer; font-size: 11px; margin-right: 10px;">
                        Back to Snoogle
                    </button>
                    <button onclick="elxaOS.programs.browser.loadPage('directory')" 
                            style="background: #f0f0f0; border: 1px outset #ccc; color: #000; padding: 8px 16px; cursor: pointer; font-size: 11px;">
                        Browse Directory
                    </button>
                </div>
            </div>
        `;
        
        this.setPageContent(content);
    }

    show404Page(url) {
        const content = `
            <div style="padding: 40px; text-align: center; background: white; min-height: 100%; font-family: Arial, sans-serif;">
                <div style="font-size: 72px; margin-bottom: 20px; color: #ccc;">404</div>
                <h1 style="color: #cc0000; margin-bottom: 16px; font-size: 24px;">Not Found</h1>
                <p style="color: #666; font-size: 14px; margin-bottom: 24px;">
                    The requested URL <code>${url}</code> was not found on this server.
                </p>
                <div style="margin-top: 30px;">
                    <button onclick="elxaOS.programs.browser.navigateToHome()" 
                            style="background: #f0f0f0; border: 1px outset #ccc; color: #000; padding: 8px 16px; cursor: pointer; font-size: 11px; margin-right: 10px;">
                        Back to Snoogle
                    </button>
                    <button onclick="elxaOS.programs.browser.loadPage('directory')" 
                            style="background: #f0f0f0; border: 1px outset #ccc; color: #000; padding: 8px 16px; cursor: pointer; font-size: 11px;">
                        Browse Directory
                    </button>
                </div>
            </div>
        `;
        
        this.setPageContent(content);
    }

    showNoInternetPage() {
        const connectionInfo = elxaOS.wifiService?.getConnectionInfo();
        const availableNetworks = elxaOS.wifiService?.getAllNetworks?.() || [];
        
        let networksList = '';
        if (availableNetworks.length > 0) {
            networksList = `
                <div style="margin-top: 20px; text-align: left; max-width: 400px; margin-left: auto; margin-right: auto;">
                    <h4 style="color: #666; margin-bottom: 10px;">Available Networks:</h4>
                    ${availableNetworks.slice(0, 5).map(network => `
                        <div style="padding: 8px; background: #f9f9f9; border: 1px solid #ddd; margin-bottom: 4px; border-radius: 3px; display: flex; justify-content: space-between; align-items: center;">
                            <span>${network.name} ${network.security !== 'None' ? '🔒' : '🌐'}</span>
                            <span style="font-size: 11px; color: #666;">
                                ${'█'.repeat(Math.max(1, Math.round(network.signalStrength)))}${'░'.repeat(5 - Math.max(1, Math.round(network.signalStrength)))}
                            </span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        const content = `
            <div class="no-internet-page" style="padding: 40px; text-align: center; background: white; min-height: 100%; font-family: Arial, sans-serif;">
                <div style="font-size: 72px; margin-bottom: 20px;">📡</div>
                <div style="font-size: 24px; color: #333; margin-bottom: 16px;">No Internet Connection</div>
                <div style="color: #666; font-size: 14px; margin-bottom: 24px; max-width: 500px; margin-left: auto; margin-right: auto;">
                    This page cannot be displayed because you are not connected to the ElxaNet. 
                    Please connect to a wireless network to browse websites.
                </div>
                
                ${networksList}
                
                <div style="margin-top: 30px;">
                    <button onclick="elxaOS.wifiService.showWiFiDialog()" 
                            style="background: #0066cc; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-size: 14px; margin-right: 10px;">
                        📶 Connect to Network
                    </button>
                    <button onclick="elxaOS.programs.browser.refresh()" 
                            style="background: #f0f0f0; border: 1px solid #ccc; color: #000; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-size: 14px;">
                        ↻ Try Again
                    </button>
                </div>
                
                <div style="margin-top: 20px; font-size: 12px; color: #999;">
                    ${connectionInfo ? 
                        `Last connected to: ${connectionInfo.network}` : 
                        `Tip: ElxaNet provides free WiFi access points throughout Snakesia`
                    }
                </div>
            </div>
        `;
        
        this.setPageContent(content);
    }

    setPageContent(content) {
        const window = this.getWindowElement();
        if (!window) {
            console.log('🌐 Browser: Cannot set page content - window not valid');
            return;
        }
        
        const page = window.querySelector('#browserPage');
        if (page) {
            // Clear any existing intervals/timeouts from previous page
            this.clearPageScripts();
            
            page.innerHTML = content;
            
            // Set up link handling after content is loaded
            setTimeout(() => {
                this.setupPageLinkHandling();
            }, 50);
        }
    }

    clearPageScripts() {
        // Clear any page-specific intervals and timeouts using our tracking system
        if (window.browserPageCleanup) {
            window.browserPageCleanup.forEach(cleanupFn => {
                try {
                    cleanupFn();
                } catch (e) {
                    console.warn('Error during page cleanup:', e);
                }
            });
            // Clear the cleanup array for the next page
            window.browserPageCleanup = [];
        }
    }

    showDebugInfo() {
        const wifiInfo = elxaOS.wifiService ? {
            isConnected: elxaOS.wifiService.isOnline(),
            connectionInfo: elxaOS.wifiService.getConnectionInfo(),
            availableNetworks: elxaOS.wifiService.getAllNetworks?.()?.length || 0
        } : 'WiFi service not available';
        
        const debugInfo = {
            currentUrl: this.currentUrl,
            isConnected: this.isConnected,
            historyLength: this.history.length,
            favoritesLength: this.favorites.length,
            windowValid: this.isWindowValid(),
            wifiInfo: wifiInfo,
            registryUrls: Object.keys(this.websiteRegistry),
            currentSitePages: Object.keys(this.websiteRegistry).filter(url => 
                url.startsWith(this.getCurrentSiteBaseUrl())
            )
        };
        
        console.log('🔍 Browser Debug Info:', debugInfo);
        
        const debugText = JSON.stringify(debugInfo, null, 2);
        // REMOVED: No more toast message for debug info
        console.log(`🔍 Debug info logged to console. Current URL: ${this.currentUrl}`);
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
            // REMOVED: No more toast message for favorites
            console.log('Removed from favorites');
        } else {
            // Add to favorites
            const favorite = {
                url: this.currentUrl,
                title: this.getPageTitle(this.currentUrl),
                icon: this.getPageIcon(this.currentUrl),
                timestamp: new Date().toLocaleString()
            };
            this.favorites.push(favorite);
            // REMOVED: No more toast message for favorites
            console.log('Added to favorites');
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
        const window = this.getWindowElement();
        if (!window) return;
        
        const urlInput = window.querySelector('#urlInput');
        if (urlInput) {
            urlInput.value = this.currentUrl || 'snoogle.ex';
        }
    }

    updateNavigationButtons() {
        const window = this.getWindowElement();
        if (!window) return;
        
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
        const window = this.getWindowElement();
        if (!window) return;
        
        const favoriteBtn = window.querySelector('#favoriteBtn');
        
        if (favoriteBtn) {
            const isFavorited = this.favorites.some(f => f.url === this.currentUrl);
            favoriteBtn.classList.toggle('favorited', isFavorited);
            favoriteBtn.title = isFavorited ? 'Remove from Favorites' : 'Add to Favorites';
        }
    }

    updateSidebar(tab) {
        const window = this.getWindowElement();
        if (!window) return;
        
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
        const window = this.getWindowElement();
        if (!window) return;
        
        const sidebar = window.querySelector('#browserSidebar');
        
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
            case 'wifiSettings':
                if (elxaOS.wifiService) {
                    elxaOS.wifiService.showWiFiDialog();
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
        // REMOVED: No more toast message for history cleared
        console.log('History cleared');
    }

    clearFavorites() {
        this.favorites = [];
        this.saveUserData();
        this.updateSidebar('favorites');
        this.updateFavoriteButton();
        // REMOVED: No more toast message for favorites cleared
        console.log('Favorites cleared');
    }

    showLoading() {
        const window = this.getWindowElement();
        if (!window) return;
        
        const loading = window.querySelector('#browserLoading');
        if (loading) {
            loading.style.display = 'block';
        }
    }

    hideLoading() {
        const window = this.getWindowElement();
        if (!window) return;
        
        const loading = window.querySelector('#browserLoading');
        if (loading) {
            loading.style.display = 'none';
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

    // Cleanup method for when the browser is destroyed
    destroy() {
        console.log('🌐 Browser: Destroying browser instance...');
        this.clearPageScripts();
        if (this.cleanupEventListeners) {
            this.cleanupEventListeners();
        }
        this.windowId = null;
    }

    // Public method for external access
    static getInstance() {
        return elxaOS.programs.browser;
    }
}