// =======================================
// ELXASTORE — ElxaCorp App Marketplace
// Depends on: appstore-catalog.js
// =======================================
(function() {
    'use strict';

    // ===== MDI HELPER =====
    function mdi(name) {
        return '<span class="mdi mdi-' + name + ' elxa-icon-ui"></span>';
    }
    function mdiRaw(cls) {
        return '<span class="mdi ' + cls + ' elxa-icon-ui"></span>';
    }

    // ===== CATEGORIES =====
    var CATEGORIES = [
        { id: 'all', label: 'All Apps', icon: 'mdi-apps' },
        { id: 'Productivity', label: 'Productivity', icon: 'mdi-briefcase' },
        { id: 'Utilities', label: 'Utilities', icon: 'mdi-wrench' },
        { id: 'Creative', label: 'Creative', icon: 'mdi-palette' },
        { id: 'Education', label: 'Education', icon: 'mdi-school' },
        { id: 'Social', label: 'Social', icon: 'mdi-account-group' },
        { id: 'Business', label: 'Business', icon: 'mdi-chart-line' },
        { id: 'Entertainment', label: 'Entertainment', icon: 'mdi-movie-open' }
    ];

    var store = {
        currentView: 'store',
        currentCategory: 'all',
        searchQuery: '',
        _currentDetailId: null,

        // ===== INIT =====
        init: function() {
            this.renderStore();
            this.renderWallet();
            this._bindSearch();
        },

        // ===== SERVICE HELPERS =====
        _financeReady: function() {
            return typeof elxaOS !== 'undefined' &&
                   elxaOS.financeService &&
                   elxaOS.financeService.isReady();
        },
        _inventoryReady: function() {
            return typeof elxaOS !== 'undefined' &&
                   elxaOS.inventoryService &&
                   elxaOS.inventoryService._ready;
        },
        _installerReady: function() {
            return typeof elxaOS !== 'undefined' &&
                   elxaOS.installerService &&
                   elxaOS.installerService.installedPrograms;
        },

        getWalletBalance: function() {
            if (!this._financeReady()) return null;
            try {
                var balances = elxaOS.financeService.getAccountBalancesSync();
                return balances.checking;
            } catch (e) { return null; }
        },

        renderWallet: function() {
            var el = document.getElementById('esWallet');
            if (!el) return;
            var balance = this.getWalletBalance();
            if (balance !== null) {
                var snakes = (balance * 2).toFixed(2);
                el.innerHTML = mdi('wallet') + ' <span class="es-wallet-amount">' + snakes + ' snakes</span>';
                el.style.display = 'flex';
            } else {
                el.style.display = 'none';
            }
        },

        // ===== CATALOG HELPERS =====
        getCatalog: function() {
            return window.ELXASTORE_CATALOG || [];
        },
        getComingSoon: function() {
            return window.ELXASTORE_COMING_SOON || [];
        },
        getApp: function(id) {
            return this.getCatalog().find(function(a) { return a.id === id; });
        },
        getFilteredApps: function() {
            var cat = this.currentCategory;
            var q = this.searchQuery.toLowerCase().trim();
            return this.getCatalog().filter(function(app) {
                if (cat !== 'all' && app.category !== cat) return false;
                if (q) {
                    var searchable = (app.name + ' ' + app.shortDesc + ' ' + app.description + ' ' + app.tags.join(' ')).toLowerCase();
                    if (searchable.indexOf(q) === -1) return false;
                }
                return true;
            });
        },

        // ===== OWNERSHIP =====
        isInstalled: function(appId) {
            var app = this.getApp(appId);
            if (!app) return false;
            var appType = app.installerData.gameData.type;
            if (this._installerReady()) {
                try {
                    for (var entry of elxaOS.installerService.installedPrograms) {
                        if (entry[1].gameData && entry[1].gameData.type === appType) return true;
                    }
                } catch (e) { /* fall through */ }
            }
            return false;
        },
        isOwned: function(appId) {
            var app = this.getApp(appId);
            if (!app) return false;
            if (this._inventoryReady()) {
                try {
                    var license = elxaOS.inventoryService.getGameLicense(app.installerData.id);
                    if (license) return true;
                } catch (e) { /* fall through */ }
            }
            return this.isInstalled(appId);
        },
        getOwnershipStatus: function(appId) {
            if (this.isInstalled(appId)) return 'installed';
            if (this.isOwned(appId)) return 'owned';
            var app = this.getApp(appId);
            if (app && app.price === 0) return 'free';
            return 'not_owned';
        },

        // ===== NAVIGATION =====
        showStore: function() {
            this.currentView = 'store';
            this._currentDetailId = null;
            document.getElementById('esStoreView').style.display = '';
            document.getElementById('esDetailView').style.display = 'none';
            document.getElementById('esLibraryView').style.display = 'none';
            this._setActiveNav('store');
            this.renderStore();
        },
        showLibrary: function() {
            this.currentView = 'library';
            this._currentDetailId = null;
            document.getElementById('esStoreView').style.display = 'none';
            document.getElementById('esDetailView').style.display = 'none';
            document.getElementById('esLibraryView').style.display = '';
            this._setActiveNav('library');
            this.renderLibrary();
        },
        showDetail: function(appId) {
            this._currentDetailId = appId;
            document.getElementById('esStoreView').style.display = 'none';
            document.getElementById('esDetailView').style.display = '';
            document.getElementById('esLibraryView').style.display = 'none';
            this.renderDetail(appId);
        },
        _setActiveNav: function(view) {
            var links = document.querySelectorAll('.es-nav-link');
            links.forEach(function(l) {
                l.classList.toggle('active', l.dataset.view === view);
            });
        },

        // ===== SEARCH =====
        _bindSearch: function() {
            var self = this;
            var input = document.getElementById('esSearch');
            if (!input) return;
            input.addEventListener('input', function() {
                self.searchQuery = this.value;
                if (self.currentView === 'store') self.renderStore();
            });
        },

        // ===== RENDER: STORE =====
        renderStore: function() {
            var container = document.getElementById('esStoreView');
            if (!container) return;
            var apps = this.getFilteredApps();
            var comingSoon = this.getComingSoon();
            var html = '';

            // Category pills
            html += '<div class="es-categories">';
            for (var i = 0; i < CATEGORIES.length; i++) {
                var cat = CATEGORIES[i];
                var active = this.currentCategory === cat.id ? ' active' : '';
                html += '<button class="es-cat-pill' + active + '" data-cat="' + cat.id + '">' +
                    mdiRaw(cat.icon) + ' ' + cat.label + '</button>';
            }
            html += '</div>';

            // App grid
            if (apps.length > 0) {
                // Separate free and paid
                var free = apps.filter(function(a) { return a.price === 0; });
                var paid = apps.filter(function(a) { return a.price > 0; });

                if (free.length > 0) {
                    html += '<div class="es-section-header">' + mdi('download') + ' Free Apps</div>';
                    html += '<div class="es-app-grid">';
                    for (var j = 0; j < free.length; j++) html += this._renderCard(free[j]);
                    html += '</div>';
                }
                if (paid.length > 0) {
                    html += '<div class="es-section-header">' + mdi('star') + ' Premium Apps</div>';
                    html += '<div class="es-app-grid">';
                    for (var k = 0; k < paid.length; k++) html += this._renderCard(paid[k]);
                    html += '</div>';
                }
            } else if (this.searchQuery) {
                html += '<div class="es-empty">' + mdi('magnify-close') + ' No apps match your search.</div>';
            } else {
                html += '<div class="es-empty">' + mdi('package-variant') + ' No apps in this category yet.</div>';
            }

            // Coming Soon
            if (this.currentCategory === 'all' && !this.searchQuery && comingSoon.length > 0) {
                html += '<div class="es-section-header">' + mdi('clock-outline') + ' Coming Soon</div>';
                html += '<div class="es-app-grid">';
                for (var m = 0; m < comingSoon.length; m++) {
                    html += this._renderComingSoonCard(comingSoon[m]);
                }
                html += '</div>';
            } else if (apps.length === 0 && !this.searchQuery) {
                // Show coming soon in empty categories too
                var catCS = comingSoon.filter(function(c) { return c.category === store.currentCategory; });
                if (catCS.length > 0) {
                    html += '<div class="es-section-header">' + mdi('clock-outline') + ' Coming Soon</div>';
                    html += '<div class="es-app-grid">';
                    for (var n = 0; n < catCS.length; n++) {
                        html += this._renderComingSoonCard(catCS[n]);
                    }
                    html += '</div>';
                }
            }

            container.innerHTML = html;

            // Bind category pills
            var self = this;
            container.querySelectorAll('.es-cat-pill').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    self.currentCategory = this.dataset.cat;
                    self.renderStore();
                });
            });

            // Bind card clicks
            container.querySelectorAll('.es-app-card[data-id]').forEach(function(card) {
                card.addEventListener('click', function() {
                    var id = this.dataset.id;
                    if (id) self.showDetail(id);
                });
            });
        },

        _renderCard: function(app) {
            var status = this.getOwnershipStatus(app.id);
            var statusBadge = '';
            if (status === 'installed') {
                statusBadge = '<span class="es-badge es-badge-installed">' + mdi('check-circle') + ' Installed</span>';
            }

            var priceTag = app.price === 0
                ? '<span class="es-price es-price-free">Free</span>'
                : '<span class="es-price">' + (app.price * 2).toFixed(2) + ' 🐍</span>';

            var stars = this._renderStars(app.rating);

            return '<div class="es-app-card" data-id="' + app.id + '">' +
                '<div class="es-card-icon" style="background:' + (app.heroColor || '#1a73e8') + '">' +
                    '<span class="mdi ' + app.icon + '"></span>' +
                '</div>' +
                '<div class="es-card-info">' +
                    '<div class="es-card-name">' + app.name + statusBadge + '</div>' +
                    '<div class="es-card-author">' + app.author + '</div>' +
                    '<div class="es-card-desc">' + app.shortDesc + '</div>' +
                    '<div class="es-card-footer">' +
                        '<div class="es-card-rating">' + stars + ' <span class="es-card-review-count">(' + app.reviewCount + ')</span></div>' +
                        priceTag +
                    '</div>' +
                '</div>' +
            '</div>';
        },

        _renderComingSoonCard: function(app) {
            return '<div class="es-app-card es-coming-soon">' +
                '<div class="es-card-icon" style="background:' + (app.heroColor || '#666') + '">' +
                    '<span class="mdi ' + app.icon + '"></span>' +
                '</div>' +
                '<div class="es-card-info">' +
                    '<div class="es-card-name">' + app.name + ' <span class="es-badge es-badge-soon">' + mdi('clock-outline') + ' Coming Soon</span></div>' +
                    '<div class="es-card-author">' + app.author + '</div>' +
                    '<div class="es-card-desc">' + app.shortDesc + '</div>' +
                '</div>' +
            '</div>';
        },

        _renderStars: function(rating) {
            var html = '';
            for (var i = 1; i <= 5; i++) {
                if (rating >= i) html += '<span class="es-star full">' + mdi('star') + '</span>';
                else if (rating >= i - 0.5) html += '<span class="es-star half">' + mdi('star-half-full') + '</span>';
                else html += '<span class="es-star empty">' + mdi('star-outline') + '</span>';
            }
            return html;
        },

        // ===== RENDER: DETAIL =====
        renderDetail: function(appId) {
            var container = document.getElementById('esDetailView');
            var app = this.getApp(appId);
            if (!container || !app) return;

            var status = this.getOwnershipStatus(appId);
            var actionBtn = this._getActionButton(app, status);
            var stars = this._renderStars(app.rating);

            var html = '';
            // Back button
            html += '<button class="es-back-btn" id="esBackBtn">' + mdi('arrow-left') + ' Back to Store</button>';

            // Hero
            html += '<div class="es-detail-hero" style="background:' + (app.heroColor || '#1a73e8') + '">' +
                '<div class="es-detail-hero-icon"><span class="mdi ' + app.icon + '"></span></div>' +
                '<div class="es-detail-hero-info">' +
                    '<h1 class="es-detail-name">' + app.name + '</h1>' +
                    '<div class="es-detail-author">' + app.author + '</div>' +
                    '<div class="es-detail-meta">' +
                        '<span>v' + app.version + '</span>' +
                        '<span>' + app.category + '</span>' +
                        '<span>' + stars + ' ' + app.rating + ' (' + app.reviewCount + ' reviews)</span>' +
                    '</div>' +
                    '<div class="es-detail-actions">' + actionBtn + '</div>' +
                '</div>' +
            '</div>';

            // Body
            html += '<div class="es-detail-body">';

            // Description
            html += '<div class="es-detail-section">' +
                '<h2>About This App</h2>' +
                '<p>' + app.description + '</p>' +
            '</div>';

            // Features
            if (app.features && app.features.length) {
                html += '<div class="es-detail-section">' +
                    '<h2>Features</h2><ul class="es-feature-list">';
                for (var i = 0; i < app.features.length; i++) {
                    html += '<li>' + mdi('check') + ' ' + app.features[i] + '</li>';
                }
                html += '</ul></div>';
            }

            // Tags
            if (app.tags && app.tags.length) {
                html += '<div class="es-detail-section"><h2>Tags</h2><div class="es-tags">';
                for (var t = 0; t < app.tags.length; t++) {
                    html += '<span class="es-tag">' + app.tags[t] + '</span>';
                }
                html += '</div></div>';
            }

            // Reviews
            if (app.reviews && app.reviews.length) {
                html += '<div class="es-detail-section"><h2>User Reviews</h2>';
                for (var r = 0; r < app.reviews.length; r++) {
                    var rev = app.reviews[r];
                    html += '<div class="es-review">' +
                        '<div class="es-review-header">' +
                            '<strong>' + rev.author + '</strong> ' + this._renderStars(rev.rating) +
                        '</div>' +
                        '<p>' + rev.text + '</p>' +
                        '<div class="es-review-helpful">' + mdi('thumb-up-outline') + ' ' + rev.helpful + ' found this helpful</div>' +
                    '</div>';
                }
                html += '</div>';
            }

            html += '</div>'; // end detail-body

            container.innerHTML = html;

            // Bind back button
            var self = this;
            document.getElementById('esBackBtn').addEventListener('click', function() {
                self.showStore();
            });

            // Bind action buttons
            this._bindDetailActions(container, app);
        },

        _getActionButton: function(app, status) {
            var snakePrice = (app.price * 2).toFixed(2);
            switch (status) {
                case 'installed':
                    return '<button class="es-btn es-btn-installed" disabled>' + mdi('check-circle') + ' Installed</button>' +
                           '<button class="es-btn es-btn-uninstall" data-action="uninstall">' + mdi('delete') + ' Uninstall</button>';
                case 'owned':
                    return '<button class="es-btn es-btn-install" data-action="install">' + mdi('download') + ' Install</button>';
                case 'free':
                    return '<button class="es-btn es-btn-install" data-action="install">' + mdi('download') + ' Install — Free</button>';
                default:
                    return '<button class="es-btn es-btn-buy" data-action="buy">' + mdi('cart') + ' Buy — ' + snakePrice + ' 🐍</button>';
            }
        },

        _bindDetailActions: function(container, app) {
            var self = this;
            container.querySelectorAll('[data-action]').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var action = this.dataset.action;
                    if (action === 'install') self.installApp(app);
                    else if (action === 'buy') self.buyApp(app);
                    else if (action === 'uninstall') self.uninstallApp(app);
                });
            });
        },

        // ===== RENDER: LIBRARY =====
        renderLibrary: function() {
            var container = document.getElementById('esLibraryView');
            if (!container) return;

            var catalog = this.getCatalog();
            var installed = catalog.filter(function(a) { return store.isInstalled(a.id); });

            var html = '<div class="es-library-header">' + mdi('bookshelf') + ' My Apps</div>';

            if (installed.length === 0) {
                html += '<div class="es-empty">' +
                    mdi('package-variant') +
                    '<div>No apps installed yet.</div>' +
                    '<div class="es-empty-sub">Browse the Store to find apps!</div>' +
                '</div>';
            } else {
                html += '<div class="es-library-list">';
                for (var i = 0; i < installed.length; i++) {
                    var app = installed[i];
                    html += '<div class="es-library-item" data-id="' + app.id + '">' +
                        '<div class="es-library-icon" style="background:' + (app.heroColor || '#1a73e8') + '">' +
                            '<span class="mdi ' + app.icon + '"></span>' +
                        '</div>' +
                        '<div class="es-library-info">' +
                            '<div class="es-library-name">' + app.name + '</div>' +
                            '<div class="es-library-meta">' + app.author + ' · v' + app.version + '</div>' +
                        '</div>' +
                        '<div class="es-library-actions">' +
                            '<button class="es-btn es-btn-sm es-btn-uninstall" data-action="uninstall" data-app="' + app.id + '">' + mdi('delete') + '</button>' +
                        '</div>' +
                    '</div>';
                }
                html += '</div>';
            }

            container.innerHTML = html;

            // Bind clicks
            var self = this;
            container.querySelectorAll('.es-library-item').forEach(function(item) {
                item.addEventListener('click', function(e) {
                    if (e.target.closest('[data-action]')) return;
                    self.showDetail(this.dataset.id);
                });
            });
            container.querySelectorAll('[data-action="uninstall"]').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var appId = this.dataset.app;
                    var app = self.getApp(appId);
                    if (app) self.uninstallApp(app);
                });
            });
        },

        // ===== PURCHASE =====
        buyApp: function(app) {
            var self = this;
            if (!this._financeReady()) {
                ElxaUI.showMessage('Finance service not available. Please set up a bank account first!', 'warning');
                return;
            }

            var snakePrice = app.price * 2;
            var balance = this.getWalletBalance();
            if (balance === null || balance < app.price) {
                ElxaUI.showMessage('Insufficient funds! You need ' + snakePrice.toFixed(2) + ' snakes.', 'error');
                return;
            }

            // Set up payment listener BEFORE opening dialog
            var handler = function(e) {
                if (e.detail && e.detail.productName === app.name) {
                    document.removeEventListener('elxa-payment-complete', handler);

                    // Record game license in inventory
                    if (self._inventoryReady()) {
                        try { elxaOS.inventoryService.acquireGame(app.installerData.id, app.price); } catch (e) {}
                    }
                    self.renderWallet();
                    // Auto-install after purchase
                    self.installApp(app);
                }
            };
            document.addEventListener('elxa-payment-complete', handler);

            // Open the payment dialog
            purchaseProduct({
                name: app.name,
                price: '\u00A7' + snakePrice.toFixed(2),
                description: app.shortDesc || app.description
            });
        },

        // ===== INSTALL =====
        installApp: function(app) {
            if (this.isInstalled(app.id)) {
                ElxaUI.showMessage(app.name + ' is already installed!', 'info');
                return;
            }
            this._showInstallDialog(app);
        },

        _installSteps: {
            _default: [
                { text: 'Downloading app package...', mdi: 'mdi-cloud-download' },
                { text: 'Verifying integrity...', mdi: 'mdi-shield-check' },
                { text: 'Extracting files...', mdi: 'mdi-package-down' },
                { text: 'Configuring preferences...', mdi: 'mdi-cog' },
                { text: 'Registering with ElxaOS...', mdi: 'mdi-clipboard-check' },
                { text: 'Creating desktop shortcut...', mdi: 'mdi-monitor' }
            ]
        },

        addInstallSteps: function(appType, steps) {
            this._installSteps[appType] = steps;
        },

        _getInstallSteps: function(appType) {
            return this._installSteps[appType] || this._installSteps._default;
        },

        _showInstallDialog: function(app) {
            var self = this;
            var appType = app.installerData.gameData.type;
            var fakeSize = (Math.random() * 20 + 5).toFixed(1);
            var iconDisplay = '<span class="mdi ' + app.icon + '"></span>';

            var overlay = document.createElement('div');
            overlay.className = 'es-inst-overlay';
            overlay.innerHTML =
                '<div class="es-inst-dialog">' +
                    '<div class="es-inst-header">' +
                        '<div class="es-inst-header-icon">' + mdi('package-down') + '</div>' +
                        '<div class="es-inst-header-text">ELXASTORE INSTALLER</div>' +
                        '<button class="es-inst-close" id="esInstClose">&times;</button>' +
                    '</div>' +
                    '<div class="es-inst-body" id="esInstBody">' +
                        '<div class="es-inst-info">' +
                            '<div class="es-inst-app-icon" style="background:' + (app.heroColor || '#1a73e8') + '">' + iconDisplay + '</div>' +
                            '<div class="es-inst-app-details">' +
                                '<div class="es-inst-app-name">' + app.name + '</div>' +
                                '<div class="es-inst-app-meta">' +
                                    '<span>v' + app.installerData.version + '</span>' +
                                    '<span>' + app.installerData.author + '</span>' +
                                    '<span>' + fakeSize + ' MB</span>' +
                                '</div>' +
                                '<div class="es-inst-app-desc">' + app.installerData.description + '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="es-inst-actions">' +
                            '<button class="es-inst-btn es-inst-btn-go" id="esInstGo">' + mdi('download') + ' Install Now</button>' +
                            '<button class="es-inst-btn es-inst-btn-cancel" id="esInstCancel">Cancel</button>' +
                        '</div>' +
                    '</div>' +
                '</div>';

            document.body.appendChild(overlay);
            overlay.offsetHeight;
            overlay.classList.add('es-inst-visible');

            var close = function() {
                overlay.classList.remove('es-inst-visible');
                setTimeout(function() { overlay.remove(); }, 300);
            };

            overlay.querySelector('#esInstClose').addEventListener('click', close);
            overlay.querySelector('#esInstCancel').addEventListener('click', close);
            overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
            overlay.querySelector('#esInstGo').addEventListener('click', function() {
                self._runInstall(overlay, app);
            });
        },

        _runInstall: function(overlay, app) {
            var self = this;
            var appType = app.installerData.gameData.type;
            var steps = this._getInstallSteps(appType);
            var body = overlay.querySelector('#esInstBody');

            body.innerHTML =
                '<div class="es-inst-progress">' +
                    '<div class="es-inst-progress-title">Installing ' + app.name + '...</div>' +
                    '<div class="es-inst-bar-track"><div class="es-inst-bar-fill" id="esInstFill"></div></div>' +
                    '<div class="es-inst-bar-pct" id="esInstPct">0%</div>' +
                    '<div class="es-inst-step" id="esInstStep">' +
                        '<span class="es-inst-step-icon">' + mdiRaw(steps[0].mdi) + '</span> ' +
                        '<span class="es-inst-step-text">' + steps[0].text + '</span>' +
                    '</div>' +
                '</div>';

            var fill = overlay.querySelector('#esInstFill');
            var pct = overlay.querySelector('#esInstPct');
            var stepIcon = overlay.querySelector('.es-inst-step-icon');
            var stepText = overlay.querySelector('.es-inst-step-text');
            var currentStep = 0;

            var advanceStep = function() {
                if (currentStep >= steps.length) {
                    self._doInstall(overlay, app);
                    return;
                }
                var progress = ((currentStep + 1) / steps.length) * 100;
                fill.style.width = progress + '%';
                pct.textContent = Math.round(progress) + '%';
                stepIcon.innerHTML = mdiRaw(steps[currentStep].mdi);
                stepText.textContent = steps[currentStep].text;
                currentStep++;
                setTimeout(advanceStep, 600 + Math.random() * 800);
            };
            setTimeout(advanceStep, 400);
        },

        _doInstall: function(overlay, app) {
            var self = this;
            var success = false;

            if (typeof elxaOS !== 'undefined' && elxaOS.installerService) {
                try {
                    elxaOS.installerService.installProgram(app.installerData).then(function(result) {
                        if (result) console.log('[ElxaStore] App installed:', app.name);
                    });
                    success = true;
                } catch (e) {
                    console.error('[ElxaStore] Install error:', e);
                }
            }

            if (success) {
                var iconDisplay = '<span class="mdi ' + app.icon + '"></span>';
                var body = overlay.querySelector('#esInstBody');
                body.innerHTML =
                    '<div class="es-inst-success">' +
                        '<div class="es-inst-success-icon">' + mdi('check-circle') + '</div>' +
                        '<div class="es-inst-success-title">Installation Complete!</div>' +
                        '<div class="es-inst-success-app">' + iconDisplay + ' ' + app.name + '</div>' +
                        '<div class="es-inst-success-msg">You can find <strong>' + app.name + '</strong> on your Desktop.</div>' +
                        '<div class="es-inst-success-tip">' + mdi('lightbulb-on-outline') + ' Double-click the desktop shortcut to open!</div>' +
                        '<div class="es-inst-actions">' +
                            '<button class="es-inst-btn es-inst-btn-go" id="esInstDone">' + mdi('check') + ' Done</button>' +
                        '</div>' +
                    '</div>';

                self.renderWallet();
                setTimeout(function() {
                    if (self._currentDetailId) self.renderDetail(self._currentDetailId);
                    if (self.currentView === 'library') self.renderLibrary();
                }, 300);

                var close = function() {
                    overlay.classList.remove('es-inst-visible');
                    setTimeout(function() { overlay.remove(); }, 300);
                    if (self._currentDetailId) self.renderDetail(self._currentDetailId);
                };
                overlay.querySelector('#esInstDone').addEventListener('click', close);
                overlay.querySelector('.es-inst-close').addEventListener('click', close);
                setTimeout(close, 15000);
            } else {
                var body2 = overlay.querySelector('#esInstBody');
                body2.innerHTML =
                    '<div class="es-inst-error">' +
                        '<div class="es-inst-error-icon">' + mdi('close-circle') + '</div>' +
                        '<div class="es-inst-error-title">Installation Failed</div>' +
                        '<div class="es-inst-error-msg">Could not install ' + app.name + '.</div>' +
                        '<div class="es-inst-actions">' +
                            '<button class="es-inst-btn es-inst-btn-cancel" id="esInstErrClose">Close</button>' +
                        '</div>' +
                    '</div>';
                var closeErr = function() {
                    overlay.classList.remove('es-inst-visible');
                    setTimeout(function() { overlay.remove(); }, 300);
                };
                overlay.querySelector('#esInstErrClose').addEventListener('click', closeErr);
                overlay.querySelector('.es-inst-close').addEventListener('click', closeErr);
            }
        },

        // ===== UNINSTALL =====
        uninstallApp: function(app) {
            if (!this.isInstalled(app.id)) {
                ElxaUI.showMessage(app.name + ' is not installed.', 'info');
                return;
            }
            this._showUninstallDialog(app);
        },

        _showUninstallDialog: function(app) {
            var self = this;
            var iconDisplay = '<span class="mdi ' + app.icon + '"></span>';

            var overlay = document.createElement('div');
            overlay.className = 'es-inst-overlay';
            overlay.innerHTML =
                '<div class="es-inst-dialog es-inst-dialog-sm">' +
                    '<div class="es-inst-header es-inst-header-danger">' +
                        '<div class="es-inst-header-icon">' + mdi('delete') + '</div>' +
                        '<div class="es-inst-header-text">UNINSTALL</div>' +
                        '<button class="es-inst-close" id="esUninstClose">&times;</button>' +
                    '</div>' +
                    '<div class="es-inst-body" id="esUninstBody">' +
                        '<div class="es-inst-uninstall-confirm">' +
                            '<div class="es-inst-uninstall-icon" style="background:' + (app.heroColor || '#1a73e8') + '">' + iconDisplay + '</div>' +
                            '<div class="es-inst-uninstall-msg">Are you sure you want to uninstall <strong>' + app.name + '</strong>?</div>' +
                            '<div class="es-inst-uninstall-note">Your data will be preserved.</div>' +
                        '</div>' +
                        '<div class="es-inst-actions">' +
                            '<button class="es-inst-btn es-inst-btn-danger" id="esUninstGo">' + mdi('delete') + ' Uninstall</button>' +
                            '<button class="es-inst-btn es-inst-btn-cancel" id="esUninstCancel">Keep App</button>' +
                        '</div>' +
                    '</div>' +
                '</div>';

            document.body.appendChild(overlay);
            overlay.offsetHeight;
            overlay.classList.add('es-inst-visible');

            var close = function() {
                overlay.classList.remove('es-inst-visible');
                setTimeout(function() { overlay.remove(); }, 300);
            };
            overlay.querySelector('#esUninstClose').addEventListener('click', close);
            overlay.querySelector('#esUninstCancel').addEventListener('click', close);
            overlay.querySelector('#esUninstGo').addEventListener('click', function() {
                self._doUninstall(overlay, app);
            });
        },

        _doUninstall: function(overlay, app) {
            var self = this;
            var success = false;
            var appType = app.installerData.gameData.type;

            if (typeof elxaOS !== 'undefined' && elxaOS.installerService) {
                try {
                    var programId = null;
                    for (var entry of elxaOS.installerService.installedPrograms) {
                        if (entry[1].gameData && entry[1].gameData.type === appType) {
                            programId = entry[0];
                            break;
                        }
                    }
                    if (programId) {
                        elxaOS.installerService.installedPrograms.delete(programId);
                        elxaOS.installerService.saveInstalledPrograms();
                        // Remove .lnk shortcut
                        if (elxaOS.fileSystem) {
                            var files = elxaOS.fileSystem.listContents(['root', 'Desktop']);
                            for (var i = 0; i < files.length; i++) {
                                if (files[i].name && files[i].name.endsWith('.lnk')) {
                                    try {
                                        var data = JSON.parse(files[i].content);
                                        if (data.programId === programId) {
                                            elxaOS.fileSystem.deleteItem(['root', 'Desktop'], files[i].name);
                                            break;
                                        }
                                    } catch (e) {}
                                }
                            }
                        }
                        if (elxaOS.installedPrograms) delete elxaOS.installedPrograms[programId];
                        elxaOS.eventBus.emit('desktop.changed');
                        success = true;
                        console.log('[ElxaStore] Uninstalled:', app.name);
                    }
                } catch (e) {
                    console.error('[ElxaStore] Uninstall error:', e);
                }
            }

            var body = overlay.querySelector('#esUninstBody');
            if (success) {
                body.innerHTML =
                    '<div class="es-inst-success">' +
                        '<div class="es-inst-success-icon" style="font-size:40px">' + mdi('check-circle') + '</div>' +
                        '<div class="es-inst-success-title">App Removed</div>' +
                        '<div class="es-inst-success-msg"><strong>' + app.name + '</strong> has been uninstalled.</div>' +
                        '<div class="es-inst-success-tip">' + mdi('information-outline') + ' You can reinstall anytime from the Store!</div>' +
                        '<div class="es-inst-actions"><button class="es-inst-btn es-inst-btn-cancel" id="esUninstDone">Got it</button></div>' +
                    '</div>';
                setTimeout(function() {
                    if (self.currentView === 'library') self.renderLibrary();
                    if (self._currentDetailId) self.renderDetail(self._currentDetailId);
                }, 200);
            } else {
                body.innerHTML =
                    '<div class="es-inst-error">' +
                        '<div class="es-inst-error-icon">' + mdi('close-circle') + '</div>' +
                        '<div class="es-inst-error-title">Uninstall Failed</div>' +
                        '<div class="es-inst-error-msg">Could not find the installed app.</div>' +
                        '<div class="es-inst-actions"><button class="es-inst-btn es-inst-btn-cancel" id="esUninstDone">Close</button></div>' +
                    '</div>';
            }

            var close = function() {
                overlay.classList.remove('es-inst-visible');
                setTimeout(function() { overlay.remove(); }, 300);
            };
            overlay.querySelector('#esUninstDone').addEventListener('click', close);
            overlay.querySelector('.es-inst-close').addEventListener('click', close);
            if (success) setTimeout(close, 10000);
        }
    };

    // ===== EXPOSE GLOBALLY =====
    window.ElxaStore = store;

    // Auto-init
    if (document.readyState === 'complete') {
        store.init();
    } else {
        document.addEventListener('DOMContentLoaded', function() { store.init(); });
    }

    // Also try init after a short delay in case scripts load after DOM
    setTimeout(function() { store.init(); }, 100);

})();
