// =======================================
// SSSTEAM STORE APP
// Depends on: sssteam-catalog.js, sssteam-installer.js
// =======================================
window.SssteamStore = {
    currentView: 'store',
    featuredGameId: 'sussy_cat',
    _currentDetailId: null,

    init: function() {
        this.renderStore();
        this.renderWallet();
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
        var walletEl = document.getElementById('sstWallet');
        if (!walletEl) return;

        var balance = this.getWalletBalance();
        if (balance !== null) {
            var snakes = (balance * 2).toFixed(2);
            walletEl.innerHTML = '<span class="sst-wallet-icon">\u{1F4B0}</span> Wallet: <span class="sst-wallet-amount">' + snakes + ' snakes</span>';
            walletEl.style.display = 'flex';
        } else {
            walletEl.style.display = 'none';
        }
    },

    // ===== OWNERSHIP & INSTALLATION =====

    isInstalled: function(gameId) {
        var game = this.getGame(gameId);
        if (!game) return false;
        var gameType = game.installerData.gameData.type;

        if (this._installerReady()) {
            try {
                var programs = elxaOS.installerService.installedPrograms;
                for (var entry of programs) {
                    if (entry[1].gameData && entry[1].gameData.type === gameType) return true;
                }
                return false;
            } catch (e) { /* fall through */ }
        }

        // Fallback: localStorage
        try {
            var saved = localStorage.getItem('elxaOS-installed-programs');
            if (!saved) return false;
            var data = JSON.parse(saved);
            return Object.values(data).some(function(p) {
                return p.gameData && p.gameData.type === gameType;
            });
        } catch (e) { return false; }
    },

    isOwned: function(gameId) {
        var game = this.getGame(gameId);
        if (!game) return false;

        if (this._inventoryReady()) {
            try {
                var license = elxaOS.inventoryService.getGameLicense(game.installerData.id);
                if (license) return true;
            } catch (e) { /* fall through */ }
        }

        return this.isInstalled(gameId);
    },

    getOwnershipStatus: function(gameId) {
        if (this.isInstalled(gameId)) return 'installed';
        if (this.isOwned(gameId)) return 'owned';
        return 'not-owned';
    },

    // ===== NAVIGATION =====

    setActiveNav: function(view) {
        document.querySelectorAll('.sst-nav-link').forEach(function(link) {
            link.classList.toggle('active', link.dataset.view === view);
        });
        this.currentView = view;
    },

    showStore: function() {
        this.setActiveNav('store');
        this._currentDetailId = null;
        document.getElementById('sstStoreView').style.display = 'block';
        document.getElementById('sstDetailView').style.display = 'none';
        document.getElementById('sstLibraryView').style.display = 'none';
        this.renderWallet();
    },

    showDetail: function(gameId) {
        this.setActiveNav('store');
        this._currentDetailId = gameId;
        document.getElementById('sstStoreView').style.display = 'none';
        document.getElementById('sstDetailView').style.display = 'block';
        document.getElementById('sstLibraryView').style.display = 'none';
        this.renderDetail(gameId);
        this.renderWallet();
    },

    showLibrary: function() {
        this.setActiveNav('library');
        this._currentDetailId = null;
        document.getElementById('sstStoreView').style.display = 'none';
        document.getElementById('sstDetailView').style.display = 'none';
        document.getElementById('sstLibraryView').style.display = 'block';
        this.renderLibrary();
        this.renderWallet();
    },

    // ===== HELPERS =====

    getGame: function(id) {
        return SSSTEAM_CATALOG.find(function(g) { return g.id === id; });
    },

    renderStars: function(rating) {
        var full = Math.floor(rating);
        var half = rating % 1 >= 0.5 ? 1 : 0;
        var empty = 5 - full - half;
        return '\u2605'.repeat(full) + (half ? '\u00BD' : '') + '\u2606'.repeat(empty);
    },

    // ===== RENDER STORE =====

    renderStore: function() {
        var self = this;

        // Featured game
        var featured = this.getGame(this.featuredGameId);
        var featuredEl = document.getElementById('sstFeatured');
        if (featured) {
            var heroContent = featured.heroImage
                ? '<img src="' + featured.heroImage + '" alt="' + featured.name + '">'
                : featured.icon;
            featuredEl.innerHTML =
                '<div class="sst-featured" onclick="SssteamStore.showDetail(\'' + featured.id + '\')">' +
                    '<div class="sst-featured-img" style="background: linear-gradient(135deg, ' + featured.heroColor + ', #0d1b2a);">' +
                        heroContent +
                    '</div>' +
                    '<div class="sst-featured-info">' +
                        '<div class="sst-featured-title">' + featured.name + '</div>' +
                        '<div class="sst-featured-desc">' + featured.shortDesc + '</div>' +
                        '<div class="sst-featured-tags">' +
                            featured.tags.map(function(t) { return '<span class="sst-tag">' + t + '</span>'; }).join('') +
                        '</div>' +
                        '<div class="sst-featured-price ' + (featured.price === 0 ? 'sst-price-free' : 'sst-price') + '">' + featured.priceDisplay + '</div>' +
                    '</div>' +
                '</div>';
        }

        // Free games
        var freeGames = SSSTEAM_CATALOG.filter(function(g) { return g.price === 0; });
        document.getElementById('sstFreeGames').innerHTML = freeGames.map(function(g) { return self.renderCard(g); }).join('');

        // Paid games
        var paidGames = SSSTEAM_CATALOG.filter(function(g) { return g.price > 0; });
        document.getElementById('sstPaidGames').innerHTML = paidGames.map(function(g) { return self.renderCard(g); }).join('');
    },

    renderCard: function(game) {
        var heroContent = game.heroImage
            ? '<img src="' + game.heroImage + '" alt="' + game.name + '">'
            : game.icon;
        return '' +
            '<div class="sst-game-card" onclick="SssteamStore.showDetail(\'' + game.id + '\')">' +
                '<div class="sst-card-img" style="background: linear-gradient(135deg, ' + game.heroColor + ', #16202c);">' +
                    heroContent +
                '</div>' +
                '<div class="sst-card-body">' +
                    '<div class="sst-card-title">' + game.name + '</div>' +
                    '<div class="sst-card-tags">' +
                        game.tags.slice(0, 3).map(function(t) { return '<span class="sst-tag">' + t + '</span>'; }).join('') +
                    '</div>' +
                    '<div class="sst-card-bottom">' +
                        '<span class="sst-card-rating">' + this.renderStars(game.rating) + ' ' + game.rating + '</span>' +
                        '<span class="' + (game.price === 0 ? 'sst-price-free' : 'sst-price') + '">' + game.priceDisplay + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>';
    },

    // ===== RENDER DETAIL =====

    renderDetail: function(gameId) {
        var game = this.getGame(gameId);
        if (!game) return;
        this._currentDetailId = gameId;

        var status = this.getOwnershipStatus(gameId);
        var heroContent = game.heroImage
            ? '<img src="' + game.heroImage + '" alt="' + game.name + '">'
            : game.icon;

        // Buy/Install/Uninstall buttons based on ownership status
        var buyBtn;
        if (status === 'installed') {
            buyBtn =
                '<button class="sst-buy-btn sst-buy-btn-installed">\u2713 Installed</button>' +
                '<button class="sst-buy-btn sst-buy-btn-uninstall" onclick="event.stopPropagation(); SssteamStore.uninstallGame(\'' + game.id + '\');">' +
                    '\uD83D\uDDD1\uFE0F Uninstall' +
                '</button>';
        } else if (status === 'owned') {
            buyBtn = '<button class="sst-buy-btn sst-buy-btn-install" onclick="SssteamStore.installGame(\'' + game.id + '\')">Install Game</button>';
        } else if (game.price === 0) {
            buyBtn = '<button class="sst-buy-btn sst-buy-btn-install" onclick="SssteamStore.installGame(\'' + game.id + '\')">Install Game</button>';
        } else {
            buyBtn = '<button class="sst-buy-btn sst-buy-btn-purchase" onclick="SssteamStore.buyGame(\'' + game.id + '\')">Add to Cart \u2014 ' + game.priceDisplay + '</button>';
        }

        // Screenshots
        var screenshotsHTML = '';
        if (game.screenshots && game.screenshots.length > 0) {
            screenshotsHTML =
                '<div class="sst-screenshots">' +
                    '<h3>Screenshots</h3>' +
                    '<div class="sst-screenshot-grid">' +
                        game.screenshots.map(function(s) {
                            return '<div class="sst-screenshot-thumb">' +
                                '<img src="' + s.src + '" alt="' + s.caption + '" title="' + s.caption + '">' +
                            '</div>';
                        }).join('') +
                    '</div>' +
                '</div>';
        }

        // Reviews
        var self = this;
        var reviewsHTML = game.reviews.map(function(r) {
            return '' +
                '<div class="sst-review">' +
                    '<div class="sst-review-header">' +
                        '<span class="sst-review-author">' + r.author + '</span>' +
                        '<span class="sst-review-rating">' + self.renderStars(r.rating) + '</span>' +
                    '</div>' +
                    '<div class="sst-review-text">' + r.text + '</div>' +
                    '<div class="sst-review-helpful">' + r.helpful + ' people found this helpful</div>' +
                '</div>';
        }).join('');

        document.getElementById('sstDetailView').innerHTML =
            '<button class="sst-back-btn" onclick="SssteamStore.showStore()">\u2190 Back to Store</button>' +

            '<div class="sst-detail-header">' +
                '<div class="sst-detail-hero" style="background: linear-gradient(135deg, ' + game.heroColor + ', #0d1b2a);">' +
                    heroContent +
                '</div>' +
                '<div class="sst-detail-sidebar">' +
                    '<div class="sst-detail-title">' + game.name + '</div>' +
                    '<div class="sst-detail-meta">' +
                        '<span>Developer: ' + game.author + '</span>' +
                        '<span>Version: ' + game.version + '</span>' +
                    '</div>' +
                    '<div class="sst-detail-tags">' +
                        game.tags.map(function(t) { return '<span class="sst-tag">' + t + '</span>'; }).join('') +
                    '</div>' +
                    '<div class="sst-detail-rating">' +
                        '<span class="sst-stars">' + this.renderStars(game.rating) + '</span>' +
                        '<span class="sst-rating-text">' + game.rating + '/5 (' + game.reviewCount.toLocaleString() + ' reviews)</span>' +
                    '</div>' +
                    '<div class="sst-buy-box">' +
                        '<div class="sst-buy-price ' + (game.price === 0 ? 'free' : '') + '">' + game.priceDisplay + '</div>' +
                        buyBtn +
                    '</div>' +
                '</div>' +
            '</div>' +

            screenshotsHTML +

            '<div class="sst-detail-body">' +
                '<div>' +
                    '<div class="sst-detail-desc">' +
                        '<h3>About This Game</h3>' +
                        '<p>' + game.description + '</p>' +
                        '<h3>Features</h3>' +
                        '<ul class="sst-features-list">' +
                            game.features.map(function(f) { return '<li>' + f + '</li>'; }).join('') +
                        '</ul>' +
                    '</div>' +
                    '<div class="sst-reviews">' +
                        '<div class="sst-section-header">User Reviews</div>' +
                        reviewsHTML +
                    '</div>' +
                '</div>' +
                '<div class="sst-sysreq">' +
                    '<h3>System Requirements</h3>' +
                    '<div class="sst-sysreq-item">' +
                        '<span class="sst-sysreq-label">OS</span>' +
                        '<span class="sst-sysreq-value">' + game.sysReqs.os + '</span>' +
                    '</div>' +
                    '<div class="sst-sysreq-item">' +
                        '<span class="sst-sysreq-label">Memory</span>' +
                        '<span class="sst-sysreq-value">' + game.sysReqs.ram + '</span>' +
                    '</div>' +
                    '<div class="sst-sysreq-item">' +
                        '<span class="sst-sysreq-label">Storage</span>' +
                        '<span class="sst-sysreq-value">' + game.sysReqs.disk + '</span>' +
                    '</div>' +
                    '<div class="sst-sysreq-item">' +
                        '<span class="sst-sysreq-label">Display</span>' +
                        '<span class="sst-sysreq-value">' + game.sysReqs.display + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>';
    },

    // ===== ACTIONS =====

    installGame: function(gameId) {
        var game = this.getGame(gameId);
        if (!game) return;

        // Add free game license if not already owned
        if (game.price === 0 && this._inventoryReady() && !this.isOwned(gameId)) {
            try {
                elxaOS.inventoryService.addGameLicense(game.installerData.id, {
                    name: game.name,
                    purchasePrice: 0
                });
            } catch (e) {
                console.warn('[Sssteam] Could not add free game license:', e);
            }
        }

        // Launch the themed installer
        SssteamInstaller.install(game);
    },

    uninstallGame: function(gameId) {
        var game = this.getGame(gameId);
        if (!game) return;
        SssteamInstaller.uninstall(game);
    },

    buyGame: function(gameId) {
        var game = this.getGame(gameId);
        if (!game) return;

        // Listen for payment completion — add license AFTER payment succeeds
        this._setupPaymentListener(game);

        // Open the payment dialog — no installerData so payment system
        // won't show Download button. We handle install separately via Library.
        purchaseProduct({
            name: game.name,
            price: game.priceDisplay,
            description: game.shortDesc
        });
    },

    _setupPaymentListener: function(game) {
        var self = this;
        var handler = function(e) {
            if (e.detail && e.detail.productName === game.name) {
                document.removeEventListener('elxa-payment-complete', handler);

                // Payment confirmed — add license to inventory
                if (self._inventoryReady()) {
                    try {
                        elxaOS.inventoryService.addGameLicense(game.installerData.id, {
                            name: game.name,
                            purchasePrice: game.price
                        });
                        console.log('[Sssteam] License added for:', game.name);
                    } catch (err) {
                        console.warn('[Sssteam] Could not add game license:', err);
                    }
                }

                // Refresh detail view to show "Install" button
                self.renderWallet();
                setTimeout(function() {
                    if (self._currentDetailId === game.id) {
                        self.renderDetail(game.id);
                    }
                }, 500);
            }
        };
        document.addEventListener('elxa-payment-complete', handler);
    },

    // ===== RENDER LIBRARY =====

    renderLibrary: function() {
        var container = document.getElementById('sstLibraryView');
        var self = this;

        var html = '<div class="sst-section-header">My Games</div>';

        var installedGames = SSSTEAM_CATALOG.filter(function(g) { return self.isInstalled(g.id); });
        var ownedNotInstalled = SSSTEAM_CATALOG.filter(function(g) { return !self.isInstalled(g.id) && self.isOwned(g.id); });
        var notOwned = SSSTEAM_CATALOG.filter(function(g) { return !self.isOwned(g.id); });

        if (installedGames.length === 0 && ownedNotInstalled.length === 0) {
            html +=
                '<div class="sst-library-empty">' +
                    '<div class="sst-library-empty-icon">\uD83D\uDCE6</div>' +
                    '<p>Your library is empty!</p>' +
                    '<p>Visit the Store to find games.</p>' +
                '</div>';
        } else {
            // Installed games — with uninstall button
            if (installedGames.length > 0) {
                html += installedGames.map(function(g) {
                    return '' +
                        '<div class="sst-library-item">' +
                            '<div class="sst-library-icon" onclick="SssteamStore.showDetail(\'' + g.id + '\')">' + g.icon + '</div>' +
                            '<div class="sst-library-info" onclick="SssteamStore.showDetail(\'' + g.id + '\')">' +
                                '<div class="sst-library-name">' + g.name + '</div>' +
                                '<div class="sst-library-status installed">\u2713 Installed</div>' +
                            '</div>' +
                            '<button class="sst-library-action sst-library-action-uninstall" onclick="event.stopPropagation(); SssteamStore.uninstallGame(\'' + g.id + '\');" title="Uninstall">' +
                                '\uD83D\uDDD1\uFE0F' +
                            '</button>' +
                        '</div>';
                }).join('');
            }

            // Owned but not installed — with install button
            if (ownedNotInstalled.length > 0) {
                html += '<div class="sst-section-header" style="margin-top: 24px;">Owned \u2014 Not Installed</div>';
                html += ownedNotInstalled.map(function(g) {
                    return '' +
                        '<div class="sst-library-item">' +
                            '<div class="sst-library-icon" style="opacity: 0.7;" onclick="SssteamStore.showDetail(\'' + g.id + '\')">' + g.icon + '</div>' +
                            '<div class="sst-library-info" onclick="SssteamStore.showDetail(\'' + g.id + '\')">' +
                                '<div class="sst-library-name">' + g.name + '</div>' +
                                '<div class="sst-library-status owned">\u2713 Owned</div>' +
                            '</div>' +
                            '<button class="sst-library-action sst-library-action-install" onclick="event.stopPropagation(); SssteamStore.installGame(\'' + g.id + '\');" title="Install">' +
                                '\u2B07\uFE0F Install' +
                            '</button>' +
                        '</div>';
                }).join('');
            }
        }

        if (notOwned.length > 0) {
            html += '<div class="sst-section-header" style="margin-top: 24px;">Not Owned</div>';
            html += notOwned.map(function(g) {
                return '' +
                    '<div class="sst-library-item" onclick="SssteamStore.showDetail(\'' + g.id + '\')">' +
                        '<div class="sst-library-icon" style="opacity: 0.4;">' + g.icon + '</div>' +
                        '<div class="sst-library-info">' +
                            '<div class="sst-library-name" style="color: #8f98a0;">' + g.name + '</div>' +
                            '<div class="sst-library-status not-installed">' + (g.price === 0 ? 'Free to Play' : g.priceDisplay) + '</div>' +
                        '</div>' +
                    '</div>';
            }).join('');
        }

        container.innerHTML = html;
    }
};

// Initialize on load
window.SssteamStore.init();
