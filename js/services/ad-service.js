// =================================
// AD SERVICE — Browser Ad Injection System
// =================================
// Manages ad catalog (image + CSS-generated), injection into browser pages,
// randomization, and ad blocker subscription status.

var AdService = (function() {
    'use strict';

    // =========================================================
    // IMAGE ADS — real files in assets/ads/
    // =========================================================
    var IMAGE_ADS = [
        { id: 'elxacorp-1', file: 'ElxaCorp 1.jpg', alt: 'ElxaCorp — Innovation for Every Snake' },
        { id: 'elxacorp-2', file: 'ElxaCorp 2.jpg', alt: 'ElxaCorp — The Future is Now' },
        { id: 'remi-mc',    file: 'remi minecraft server.jpg', alt: 'Remi\'s Minecraft Server' },
        { id: 'snakesia',   file: 'visit snakesia.jpg', alt: 'Visit Snakesia Today!' }
    ];

    // =========================================================
    // CSS SCAM ADS — generated with HTML/CSS, delightfully awful
    // =========================================================
    var CSS_ADS = [
        {
            id: 'million-visitor',
            html: function() {
                return '<div class="scam-ad scam-winner">' +
                    '<div class="scam-flash">★ CONGRATULATIONS ★</div>' +
                    '<div class="scam-big">You are the <span class="scam-highlight">1,000,000th</span> visitor!</div>' +
                    '<div class="scam-sub">Click here to claim your prize of §10,000!</div>' +
                    '<div class="scam-btn scam-btn-green">CLAIM NOW →</div>' +
                    '<div class="scam-fine">*Terms and conditions apply. Prize may be paid in installments over 847 years.</div>' +
                '</div>';
            }
        },
        {
            id: 'virus-warning',
            html: function() {
                return '<div class="scam-ad scam-virus">' +
                    '<div class="scam-alert-bar">⚠️ SECURITY ALERT ⚠️</div>' +
                    '<div class="scam-big" style="color:#ff0000;">YOUR ElxaOS HAS <span class="scam-blink">47 VIRUSES!</span></div>' +
                    '<div class="scam-sub">Your personal data is at EXTREME risk! Download ElxaClean™ NOW!</div>' +
                    '<div class="scam-btn scam-btn-red">SCAN NOW — FREE!</div>' +
                    '<div class="scam-fine">ElxaClean™ is not affiliated with any real antivirus product.</div>' +
                '</div>';
            }
        },
        {
            id: 'hot-singles',
            html: function() {
                var neighborhoods = ['Dusty Flats', 'Rattlesnake Ridge', 'Copperhead Commons', 'Viper Valley', 'Python Heights', 'Serpentine Estates'];
                var hood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
                return '<div class="scam-ad scam-singles">' +
                    '<div class="scam-big" style="color:#ff69b4;">💕 Hot Singles in ' + hood + '! 💕</div>' +
                    '<div class="scam-sub">3 attractive snakes near you want to chat RIGHT NOW!</div>' +
                    '<div class="scam-btn scam-btn-pink">MEET THEM →</div>' +
                    '<div class="scam-fine">SnakeMeet.ex — "Where scales meet feelings"</div>' +
                '</div>';
            }
        },
        {
            id: 'download-ram',
            html: function() {
                return '<div class="scam-ad scam-ram">' +
                    '<div class="scam-big">Is your ElxaOS running SLOW? 🐌</div>' +
                    '<div class="scam-sub">Download MORE RAM — instantly boost performance!</div>' +
                    '<div class="scam-ram-bar"><div class="scam-ram-fill"></div></div>' +
                    '<div class="scam-sub" style="font-size:11px;">Current RAM: 256MB → After: <span style="color:#00ff00;font-weight:bold;">64GB!!</span></div>' +
                    '<div class="scam-btn scam-btn-blue">DOWNLOAD RAM — §19.98</div>' +
                    '<div class="scam-fine">MoreRAM.ex — "It\'s basically magic."</div>' +
                '</div>';
            }
        },
        {
            id: 'free-phone',
            html: function() {
                return '<div class="scam-ad scam-phone">' +
                    '<div class="scam-flash">🎉 FREE GIVEAWAY 🎉</div>' +
                    '<div class="scam-big">Win a <span class="scam-highlight">FREE ElxaPhone 6 Pro!</span></div>' +
                    '<div class="scam-sub">Just answer 3 simple questions! (Takes 30 seconds)</div>' +
                    '<div class="scam-btn scam-btn-green">START QUIZ →</div>' +
                    '<div class="scam-fine">Sponsored by TotallyLegitGiveaways.ex</div>' +
                '</div>';
            }
        },
        {
            id: 'credit-trick',
            html: function() {
                return '<div class="scam-ad scam-credit">' +
                    '<div class="scam-big">Credit Score TOO LOW? 📉</div>' +
                    '<div class="scam-sub">Banks HATE this one weird trick! Raise your score 200 points OVERNIGHT!</div>' +
                    '<div class="scam-btn scam-btn-gold">LEARN THE SECRET →</div>' +
                    '<div class="scam-fine">Results not typical. Side effects may include financial ruin.</div>' +
                '</div>';
            }
        },
        {
            id: 'free-snakes',
            html: function() {
                return '<div class="scam-ad scam-money">' +
                    '<div class="scam-alert-bar" style="background:linear-gradient(90deg,#ffd700,#ff8c00);">💰 URGENT NOTICE 💰</div>' +
                    '<div class="scam-big">§500 deposited to your FSB account!</div>' +
                    '<div class="scam-sub">First Snakesian Bank has a pending deposit for you! Enter your password to verify.</div>' +
                    '<input type="password" class="scam-input" placeholder="Enter FSB password..." onclick="event.stopPropagation();">' +
                    '<div class="scam-btn scam-btn-green">VERIFY & CLAIM §500</div>' +
                    '<div class="scam-fine">This is definitely not a phishing attempt.</div>' +
                '</div>';
            }
        },
        {
            id: 'snake-oil',
            html: function() {
                return '<div class="scam-ad scam-oil">' +
                    '<div class="scam-big">🐍 GENUINE Snake Oil™ 🐍</div>' +
                    '<div class="scam-sub">Cures headaches, back pain, low credit scores, bad Wi-Fi, and existential dread!</div>' +
                    '<div style="font-size:24px;margin:6px 0;">Only §29.98 a bottle!</div>' +
                    '<div class="scam-btn scam-btn-gold">ORDER NOW — FREE SHIPPING!</div>' +
                    '<div class="scam-fine">*Not evaluated by the Snakesian Food & Drug Administration. May contain actual snake.</div>' +
                '</div>';
            }
        },
        {
            id: 'prince-email',
            html: function() {
                return '<div class="scam-ad scam-prince">' +
                    '<div class="scam-big">📧 Urgent Message from Snakesian Royalty</div>' +
                    '<div class="scam-sub">Dear friend, I am Prince Ssslitherton III. I have §2,000,000 that needs transferring. ' +
                        'I just need §50 for processing fees. You will receive 40% of the total!</div>' +
                    '<div class="scam-btn scam-btn-gold">HELP THE PRINCE →</div>' +
                    '<div class="scam-fine">100% legitimate royal business transaction.</div>' +
                '</div>';
            }
        },
        {
            id: 'elxa-deals',
            html: function() {
                return '<div class="scam-ad scam-deals">' +
                    '<div class="scam-flash" style="background:#e74c3c;">🔥 FLASH SALE — 99% OFF 🔥</div>' +
                    '<div class="scam-big">ElxaPhone 6 Pro — Only §1.98!</div>' +
                    '<div class="scam-sub">Hurry! Only <span class="scam-blink">2 LEFT</span> at this price!</div>' +
                    '<div class="scam-countdown">⏰ Offer expires in: 04:59</div>' +
                    '<div class="scam-btn scam-btn-red">BUY NOW →</div>' +
                    '<div class="scam-fine">ElxaDeals.ex — Not affiliated with ElxaTech. Product may be a drawing of a phone.</div>' +
                '</div>';
            }
        }
    ];

    // =========================================================
    // AD PLACEMENT TYPES
    // =========================================================
    var PLACEMENTS = ['popup-center', 'banner-bottom', 'corner-float'];

    // =========================================================
    // SERVICE STATE
    // =========================================================
    var _adBlockerActive = false;
    var _extensionSubId = null;       // inventory subscription ID
    var _extensionPaymentId = null;   // recurring payment ID
    var _activeOverlay = null;        // currently displayed ad overlay
    var _adTimer = null;              // delay timer for ad injection
    var _eventBus = null;

    // =========================================================
    // INIT
    // =========================================================
    function init(eventBus) {
        _eventBus = eventBus;

        // Listen for subscription cancellation (missed payments etc.)
        eventBus.on('inventory.subscriptionCancelled', function(data) {
            if (_extensionSubId && data.subscriptionId === _extensionSubId) {
                _adBlockerActive = false;
                _extensionSubId = null;
                _extensionPaymentId = null;
                console.log('🛡️ NoAds Pro subscription cancelled — ads re-enabled');
            }
        });

        // Restore state from inventory after user logs in
        // By login.success, inventoryService is initialized and has user data
        eventBus.on('login.success', function() {
            _restoreState();
        });

        eventBus.on('login.logout', function() {
            _adBlockerActive = false;
            _extensionSubId = null;
            _extensionPaymentId = null;
            _clearAd();
        });

        _restoreState();
        console.log('📢 Ad Service initialized');
    }

    // =========================================================
    // STATE RESTORE — check inventory for existing NoAds Pro sub
    // Also cleans up duplicate subscriptions caused by earlier bug
    // =========================================================
    function _restoreState() {
        if (typeof elxaOS === 'undefined' || !elxaOS.inventoryService) return;
        try {
            var subs = elxaOS.inventoryService.getActiveSubscriptions();
            var noAdsSubs = [];
            for (var i = 0; i < subs.length; i++) {
                if (subs[i].provider === 'NoAds Pro') {
                    noAdsSubs.push(subs[i]);
                }
            }

            if (noAdsSubs.length > 0) {
                // Keep the first active subscription
                _adBlockerActive = true;
                _extensionSubId = noAdsSubs[0].id;
                _extensionPaymentId = noAdsSubs[0].recurringPaymentId;
                console.log('🛡️ NoAds Pro subscription restored — ads blocked');

                // Cancel any duplicates (caused by earlier restore bug)
                for (var j = 1; j < noAdsSubs.length; j++) {
                    console.log('🛡️ Cancelling duplicate NoAds Pro subscription: ' + noAdsSubs[j].id);
                    elxaOS.inventoryService.cancelSubscription(noAdsSubs[j].id, 'duplicate cleanup');
                }
                if (noAdsSubs.length > 1) {
                    console.log('🛡️ Cleaned up ' + (noAdsSubs.length - 1) + ' duplicate NoAds Pro subscription(s)');
                }
            } else {
                _adBlockerActive = false;
            }
        } catch (e) {
            // Inventory not ready yet, that's fine
        }
    }

    // =========================================================
    // AD INJECTION — called by browser after page load
    // =========================================================
    function injectAd(browserPageEl) {
        _clearAd();

        // Don't inject on snoogle homepage or directory
        if (!browserPageEl) return;

        // Lazy restore — if blocker wasn't detected via event, re-check inventory now
        if (!_adBlockerActive) {
            _restoreState();
        }

        // Ad blocker check
        if (_adBlockerActive) {
            console.log('🛡️ Ad blocked by NoAds Pro');
            return;
        }

        // 60% chance of showing an ad
        if (Math.random() > 0.60) {
            console.log('📢 No ad this page load (RNG)');
            return;
        }

        // Delay between 1-3 seconds after page load
        var delay = 1000 + Math.random() * 2000;
        _adTimer = setTimeout(function() {
            _showAd(browserPageEl);
        }, delay);
    }

    function _clearAd() {
        if (_adTimer) {
            clearTimeout(_adTimer);
            _adTimer = null;
        }
        if (_activeOverlay && _activeOverlay.parentNode) {
            _activeOverlay.parentNode.removeChild(_activeOverlay);
        }
        _activeOverlay = null;
    }

    function _showAd(containerEl) {
        // Pick random ad type: 50% CSS scam, 50% image
        var useImage = Math.random() < 0.5;
        var adContent;
        var placement = PLACEMENTS[Math.floor(Math.random() * PLACEMENTS.length)];

        if (useImage) {
            var imgAd = IMAGE_ADS[Math.floor(Math.random() * IMAGE_ADS.length)];
            adContent = '<img src="./assets/ads/' + imgAd.file + '" alt="' + imgAd.alt + '" class="ad-image">';
        } else {
            var cssAd = CSS_ADS[Math.floor(Math.random() * CSS_ADS.length)];
            adContent = cssAd.html();
        }

        // Build overlay
        var overlay = document.createElement('div');
        overlay.className = 'ad-overlay ad-' + placement;
        overlay.innerHTML =
            '<div class="ad-container">' +
                '<button class="ad-close-btn" title="Close ad">✕</button>' +
                '<div class="ad-body">' + adContent + '</div>' +
                '<div class="ad-label">Advertisement</div>' +
            '</div>';

        // Close button handler
        overlay.querySelector('.ad-close-btn').addEventListener('click', function(e) {
            e.stopPropagation();
            if (overlay.parentNode) {
                overlay.classList.add('ad-closing');
                setTimeout(function() {
                    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                }, 200);
            }
            _activeOverlay = null;
        });

        // Clicking the ad body does nothing (just closes for scam ads)
        overlay.querySelector('.ad-body').addEventListener('click', function(e) {
            e.stopPropagation();
            // Scam ads just close when clicked — the "buttons" are fake
            overlay.querySelector('.ad-close-btn').click();
        });

        containerEl.style.position = 'relative';
        containerEl.appendChild(overlay);
        _activeOverlay = overlay;

        // Force reflow then add visible class for animation
        overlay.offsetHeight;
        overlay.classList.add('ad-visible');
    }

    // =========================================================
    // EXTENSIONS CATALOG
    // =========================================================
    var EXTENSIONS = [
        {
            id: 'noads-pro',
            name: 'NoAds Pro',
            icon: 'mdi-shield-check',
            description: 'Block all ads across the ExWeb. Browse in peace!',
            monthlyPrice: 4.99, // USD, displayed as snakes x2
            provider: 'NoAds Pro',
            perks: ['Ad-free browsing', 'Faster page loads', 'No scam popups']
        }
    ];

    function getExtensions() {
        return EXTENSIONS.map(function(ext) {
            var installed = _adBlockerActive && ext.id === 'noads-pro';
            return {
                id: ext.id,
                name: ext.name,
                icon: ext.icon,
                description: ext.description,
                monthlyPrice: ext.monthlyPrice,
                installed: installed
            };
        });
    }

    // =========================================================
    // INSTALL / UNINSTALL EXTENSIONS
    // =========================================================
    function installExtension(extId, callback) {
        var ext = EXTENSIONS.find(function(e) { return e.id === extId; });
        if (!ext) {
            if (callback) callback({ success: false, message: 'Extension not found.' });
            return;
        }

        if (ext.id === 'noads-pro' && _adBlockerActive) {
            if (callback) callback({ success: false, message: 'NoAds Pro is already active.' });
            return;
        }

        // Also check inventory directly — guards against stale _adBlockerActive flag
        if (ext.id === 'noads-pro' && typeof elxaOS !== 'undefined' && elxaOS.inventoryService) {
            var existingSubs = elxaOS.inventoryService.getActiveSubscriptions();
            for (var i = 0; i < existingSubs.length; i++) {
                if (existingSubs[i].provider === 'NoAds Pro') {
                    // Found an existing subscription — restore state instead of creating a duplicate
                    _adBlockerActive = true;
                    _extensionSubId = existingSubs[i].id;
                    _extensionPaymentId = existingSubs[i].recurringPaymentId;
                    if (callback) callback({ success: false, message: 'NoAds Pro is already active.' });
                    return;
                }
            }
        }

        // Use the payment system — purchaseProduct opens the payment dialog
        var priceSnakes = (ext.monthlyPrice * 2).toFixed(2);

        // Set up one-time listener for payment completion
        var handler = function(e) {
            document.removeEventListener('elxa-payment-complete', handler);
            _onExtensionPurchased(ext, callback);
        };
        document.addEventListener('elxa-payment-complete', handler);

        // Also listen for payment cancel/close to clean up
        var cancelHandler = function(e) {
            document.removeEventListener('elxa-payment-cancelled', cancelHandler);
            document.removeEventListener('elxa-payment-complete', handler);
            if (callback) callback({ success: false, message: 'Payment cancelled.' });
        };
        document.addEventListener('elxa-payment-cancelled', cancelHandler);

        window.purchaseProduct({
            name: ext.name + ' (Monthly)',
            price: '§' + priceSnakes + '/mo',
            description: ext.description
        });
    }

    function _onExtensionPurchased(ext, callback) {
        // Create recurring payment
        var recResult = elxaOS.financeService.addRecurringPayment({
            description: ext.name + ' — Browser Extension',
            amount: ext.monthlyPrice,
            type: 'subscription',
            sourceAccount: 'checking',
            linkedId: 'ext-' + ext.id
        });

        if (!recResult || !recResult.success) {
            if (callback) callback({ success: false, message: 'Failed to set up recurring payment.' });
            return;
        }

        // Add to inventory subscriptions
        elxaOS.inventoryService.addSubscription({
            name: ext.name,
            provider: ext.provider,
            monthlyRate: ext.monthlyPrice,
            recurringPaymentId: recResult.payment.id,
            perks: ext.perks || []
        }).then(function(sub) {
            if (ext.id === 'noads-pro') {
                _adBlockerActive = true;
                _extensionSubId = sub.id;
                _extensionPaymentId = recResult.payment.id;
                _clearAd(); // Remove any currently showing ad
            }
            console.log('🧩 Extension installed: ' + ext.name);
            if (callback) callback({ success: true, message: ext.name + ' activated!' });
        });
    }

    function uninstallExtension(extId, callback) {
        var ext = EXTENSIONS.find(function(e) { return e.id === extId; });
        if (!ext) {
            if (callback) callback({ success: false, message: 'Extension not found.' });
            return;
        }

        if (ext.id === 'noads-pro' && !_adBlockerActive) {
            if (callback) callback({ success: false, message: 'NoAds Pro is not active.' });
            return;
        }

        // Cancel subscription in inventory (which also cancels recurring payment)
        if (_extensionSubId) {
            elxaOS.inventoryService.cancelSubscription(_extensionSubId, 'uninstalled');
        }

        _adBlockerActive = false;
        _extensionSubId = null;
        _extensionPaymentId = null;

        console.log('🧩 Extension uninstalled: ' + ext.name);
        if (callback) callback({ success: true, message: ext.name + ' removed. Ads will return.' });
    }

    // =========================================================
    // PUBLIC API
    // =========================================================
    function isAdBlockerActive() {
        return _adBlockerActive;
    }

    return {
        init: init,
        injectAd: injectAd,
        clearAd: _clearAd,
        getExtensions: getExtensions,
        installExtension: installExtension,
        uninstallExtension: uninstallExtension,
        isAdBlockerActive: isAdBlockerActive,
        // Debug
        debug: {
            forceAd: function(containerEl) {
                _adBlockerActive = false;
                _showAd(containerEl || document.querySelector('#browserPage'));
            },
            status: function() {
                console.log('Ad Blocker Active:', _adBlockerActive);
                console.log('Sub ID:', _extensionSubId);
                console.log('Payment ID:', _extensionPaymentId);
            }
        }
    };
})();
