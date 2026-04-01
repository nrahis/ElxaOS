// =================================
// MALLARD REALTY — Site Logic
// Browsing, filtering, detail views, my properties
// Phase 4: Rent + Move-Out flows
// Phase 5: Buy flow (mortgage application + deed ceremony)
// Phase 6: Sell flow + property appreciation
// Move-In/Move-Out/Deed/Sale Ceremony Overlays
// =================================

var MallardRealty = (function() {
    'use strict';

    // ---- State ----
    var currentTab = 'browse';
    var currentDetailId = null;
    var pendingBuyTermMonths = 60; // default term for buy flow

    // ---- Appreciation Rates (monthly, per neighborhood) ----
    var APPRECIATION_RATES = {
        'dusty-flats': 0.005,
        'pine-hollow': 0.008,
        'cloverfield': 0.010,
        'downtown': 0.012,
        'maple-heights': 0.015,
        'serpentine-estates': 0.020
    };
    var APPRECIATION_CAP = 2.0; // max 200% of purchase price

    // ---- Icon Helpers ----

    function mdi(name) {
        return '<span class="mdi mdi-' + name + '"></span>';
    }

    // ---- Helpers ----

    function snakes(usd) {
        var s = Math.round(usd * 2);
        return s.toLocaleString() + ' \u00A7';
    }

    function snakesShort(usd) {
        var s = usd * 2;
        if (s >= 1000000) return (s / 1000000).toFixed(1).replace(/\.0$/, '') + 'M \u00A7';
        if (s >= 1000) return (s / 1000).toFixed(0) + 'k \u00A7';
        return s.toLocaleString() + ' \u00A7';
    }

    function usd(amount) {
        return '$' + amount.toLocaleString();
    }

    function calcMonthsOwned(acquiredDate) {
        if (!acquiredDate) return 0;
        var acquired = new Date(acquiredDate);
        var now = new Date();
        var months = (now.getFullYear() - acquired.getFullYear()) * 12 + (now.getMonth() - acquired.getMonth());
        return Math.max(0, months);
    }

    function calcCurrentValue(purchasePrice, neighborhood, acquiredDate) {
        var months = calcMonthsOwned(acquiredDate);
        if (months <= 0) return purchasePrice;
        var rate = APPRECIATION_RATES[neighborhood] || 0.005;
        var multiplier = Math.pow(1 + rate, months);
        if (multiplier > APPRECIATION_CAP) multiplier = APPRECIATION_CAP;
        return Math.round(purchasePrice * multiplier);
    }

    function calcAppreciationPercent(purchasePrice, currentValue) {
        if (!purchasePrice || purchasePrice <= 0) return 0;
        return Math.round(((currentValue - purchasePrice) / purchasePrice) * 1000) / 10;
    }

    function calcMonthlyPayment(principal, annualRate, termMonths) {
        if (principal <= 0 || termMonths <= 0) return 0;
        if (annualRate <= 0) return Math.round((principal / termMonths) * 100) / 100;
        var r = (annualRate / 100) / 12;
        var n = termMonths;
        var factor = Math.pow(1 + r, n);
        return Math.round(principal * (r * factor) / (factor - 1) * 100) / 100;
    }

    function calcTotalInterest(principal, monthlyPayment, termMonths) {
        return Math.round((monthlyPayment * termMonths - principal) * 100) / 100;
    }

    function termLabel(months) {
        var years = months / 12;
        if (years === Math.floor(years)) return years + '-Year';
        return months + '-Month';
    }

    function el(id) {
        return document.getElementById(id);
    }

    function qs(sel) {
        var root = document.querySelector('.mallard-root');
        return root ? root.querySelector(sel) : document.querySelector(sel);
    }

    function qsa(sel) {
        var root = document.querySelector('.mallard-root');
        return root ? root.querySelectorAll(sel) : document.querySelectorAll(sel);
    }

    // ---- Inventory helpers ----

    function getOwnedPropertyIds() {
        var map = {};
        try {
            var inv = elxaOS.inventoryService;
            if (!inv) return map;
            var props = inv.getProperties();
            for (var i = 0; i < props.length; i++) {
                var p = props[i];
                var key = p.propertyId || null;
                if (key) {
                    map[key] = {
                        ownership: p.ownership,
                        loanId: p.loanId,
                        rentPaymentId: p.rentPaymentId,
                        purchasePrice: p.purchasePrice,
                        currentValue: p.currentValue,
                        acquiredDate: p.acquiredDate,
                        monthlyTax: p.monthlyTax,
                        inventoryId: p.id
                    };
                }
            }
        } catch (e) {
            console.warn('Mallard: Could not read inventory', e);
        }
        return map;
    }

    function getPropertyStatus(mallardId) {
        var owned = getOwnedPropertyIds();
        return owned[mallardId] || null;
    }

    function isLoanActive(loanId) {
        if (!loanId) return false;
        try {
            var loans = elxaOS.financeService.getLoansSync();
            for (var i = 0; i < loans.length; i++) {
                if (loans[i].id === loanId && loans[i].status === 'active') return true;
            }
        } catch (e) {}
        return false;
    }

    // ---- Mortgage qualification ----

    function getMortgageInfo() {
        try {
            var fs = elxaOS.financeService;
            if (!fs) return null;
            var scoreData = fs.getCreditScoreSync();
            var score = scoreData.score || 0;

            if (typeof MORTGAGE_TIERS === 'undefined') return null;

            var tier = null;
            for (var i = 0; i < MORTGAGE_TIERS.length; i++) {
                if (score >= MORTGAGE_TIERS[i].minScore) {
                    tier = MORTGAGE_TIERS[i];
                    break;
                }
            }

            return {
                score: score,
                rating: scoreData.rating,
                eligible: !!tier,
                maxAmount: tier ? tier.maxAmount : 0,
                tierLabel: tier ? tier.label : 'None',
                allTiers: MORTGAGE_TIERS
            };
        } catch (e) {
            console.warn('Mallard: Could not read mortgage info', e);
            return null;
        }
    }

    function getMortgageApr(score) {
        // Mirrors finance-loans.js _calculateLoanTerms for mortgage APR
        var mortgage = typeof LOAN_TYPES !== 'undefined' ? LOAN_TYPES.mortgage : null;
        if (!mortgage) return 6; // fallback
        var range = 850 - mortgage.requiredScore;
        var progress = range > 0 ? Math.min((score - mortgage.requiredScore) / range, 1) : 1;
        return Math.round((mortgage.baseApr - (mortgage.aprRange * progress)) * 100) / 100;
    }

    // ---- Neighborhood Data ----

    var NEIGHBORHOODS = {
        'dusty-flats': {
            name: 'Dusty Flats',
            mdiIcon: 'cactus',
            iconClass: 'nh-dusty-flats',
            desc: 'The rural outskirts of Snake Valley. Budget-friendly properties with loads of character and even more dust. Home to Snakesia\'s most optimistic property descriptions. If the phrase "fixer-upper" makes you excited instead of nauseous, welcome home.',
            vibe: 'Rent or Buy',
            priceRange: '30,000\u201350,000'
        },
        'pine-hollow': {
            name: 'Pine Hollow',
            mdiIcon: 'pine-tree',
            iconClass: 'nh-pine-hollow',
            desc: 'Wooded, quiet, and perfect for anyone who wants to hear birds instead of traffic. Pine Hollow offers cozy cabins and bungalows nestled among mature trees. Bring bug spray and a good book.',
            vibe: 'Rent or Buy',
            priceRange: '60,000\u2013110,000'
        },
        'cloverfield': {
            name: 'Cloverfield',
            mdiIcon: 'clover',
            iconClass: 'nh-cloverfield',
            desc: 'The classic starter suburb \u2014 friendly neighbors, tidy lawns, and the smell of someone\'s barbecue every weekend. Great schools (by Snakesian standards), community events, and property values that actually go up.',
            vibe: 'Rent or Buy',
            priceRange: '120,000\u2013220,000'
        },
        'downtown': {
            name: 'Downtown Snake Valley',
            mdiIcon: 'city',
            iconClass: 'nh-downtown',
            desc: 'The urban core. Walkable streets, trendy coffee shops, and apartments where you can hear your neighbor\'s taste in music whether you want to or not. If you want to live where things happen, this is it.',
            vibe: 'Rent or Buy',
            priceRange: '150,000\u2013260,000'
        },
        'maple-heights': {
            name: 'Maple Heights',
            mdiIcon: 'leaf-maple',
            iconClass: 'nh-maple-heights',
            desc: 'The established suburban dream. Tree-lined streets, two-car garages, and an HOA that has opinions about your lawn height. Properties here are buy-only \u2014 no renters allowed. Homeowners only, darling.',
            vibe: 'Buy Only',
            priceRange: '300,000\u2013700,000'
        },
        'serpentine-estates': {
            name: 'Serpentine Estates',
            mdiIcon: 'diamond-stone',
            iconClass: 'nh-serpentine-estates',
            desc: 'The gated community at the top of the hill. Victorians, villas, and ultra-modern estates where Mr. Snake-e himself is your neighbor. If you have to ask how much it costs, you\'re not ready. But keep building that credit score.',
            vibe: 'Buy Only',
            priceRange: '800,000\u20132,000,000'
        }
    };

    // =================================
    // CONFIRMATION DIALOG
    // =================================

    function showConfirmOverlay(options) {
        var overlay = el('confirmOverlay');
        if (!overlay) return;

        var title = options.title || 'Confirm';
        var body = options.body || '';
        var confirmText = options.confirmText || 'Confirm';
        var cancelText = options.cancelText || 'Cancel';
        var confirmClass = options.confirmClass || 'mallard-confirm-btn-primary';

        overlay.innerHTML =
            '<div class="mallard-confirm-dialog">' +
                '<div class="mallard-confirm-title">' + title + '</div>' +
                '<div class="mallard-confirm-body">' + body + '</div>' +
                '<div class="mallard-confirm-actions">' +
                    '<button class="mallard-confirm-btn mallard-confirm-btn-cancel" data-confirm-action="cancel">' + cancelText + '</button>' +
                    '<button class="mallard-confirm-btn ' + confirmClass + '" data-confirm-action="confirm">' + confirmText + '</button>' +
                '</div>' +
            '</div>';

        overlay._onConfirm = options.onConfirm || function() {};
        overlay._onCancel = options.onCancel || function() {};

        overlay.classList.remove('hidden');
    }

    function hideConfirmOverlay() {
        var overlay = el('confirmOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay._onConfirm = null;
            overlay._onCancel = null;
        }
    }

    function handleConfirmAction(action) {
        var overlay = el('confirmOverlay');
        if (!overlay) return;

        if (action === 'confirm' && overlay._onConfirm) {
            overlay._onConfirm();
        } else if (action === 'cancel' && overlay._onCancel) {
            overlay._onCancel();
        }
        hideConfirmOverlay();
    }

    // =================================
    // MOVE-IN CEREMONY OVERLAY
    // =================================

    function showMoveInCeremony(prop) {
        var overlay = el('ceremonyOverlay');
        if (!overlay) return;

        var monthlyRent = Math.round(prop.price * prop.rentRate);

        overlay.innerHTML =
            '<div class="mallard-ceremony-card mallard-ceremony-movein">' +
                '<div class="mallard-ceremony-sparkles">' +
                    '<span class="mallard-sparkle s1"></span>' +
                    '<span class="mallard-sparkle s2"></span>' +
                    '<span class="mallard-sparkle s3"></span>' +
                    '<span class="mallard-sparkle s4"></span>' +
                    '<span class="mallard-sparkle s5"></span>' +
                    '<span class="mallard-sparkle s6"></span>' +
                '</div>' +
                '<div class="mallard-ceremony-icon-wrap movein">' +
                    '<span class="mdi mdi-key-variant"></span>' +
                '</div>' +
                '<div class="mallard-ceremony-title">Welcome Home!</div>' +
                '<div class="mallard-ceremony-subtitle">Your keys are ready</div>' +
                '<div class="mallard-ceremony-property">' +
                    '<img src="' + prop.image + '" alt="' + prop.name + '">' +
                    '<div class="mallard-ceremony-property-info">' +
                        '<div class="mallard-ceremony-property-name">' + prop.name + '</div>' +
                        '<div class="mallard-ceremony-property-address">' + prop.address + ', ' + prop.neighborhoodName + '</div>' +
                        '<div class="mallard-ceremony-property-rent">' + snakes(monthlyRent) + '/mo</div>' +
                    '</div>' +
                '</div>' +
                '<div class="mallard-ceremony-message">' +
                    '<span class="mdi mdi-message-text-outline"></span>' +
                    '<div>' +
                        '<strong>' + prop.agent + '</strong> says:' +
                        '<div class="mallard-ceremony-quote">"Congratulations on your new place! I know you\'re going to love it here in ' + prop.neighborhoodName + '. Don\'t forget to introduce yourself to the neighbors!"</div>' +
                    '</div>' +
                '</div>' +
                '<button class="mallard-ceremony-btn movein" data-action="dismiss-ceremony">' +
                    mdi('home') + ' Move In' +
                '</button>' +
            '</div>';

        overlay.classList.remove('hidden');
    }

    // =================================
    // MOVE-OUT FAREWELL OVERLAY
    // =================================

    function showMoveOutFarewell(prop, acquiredDate) {
        var overlay = el('ceremonyOverlay');
        if (!overlay) return;

        var timeNote = '';
        if (acquiredDate) {
            timeNote = '<div class="mallard-ceremony-time-spent">' +
                mdi('calendar-clock') + ' You called this place home since ' + acquiredDate +
            '</div>';
        }

        overlay.innerHTML =
            '<div class="mallard-ceremony-card mallard-ceremony-moveout">' +
                '<div class="mallard-ceremony-icon-wrap moveout">' +
                    '<span class="mdi mdi-door-open"></span>' +
                '</div>' +
                '<div class="mallard-ceremony-title moveout">Farewell!</div>' +
                '<div class="mallard-ceremony-subtitle moveout">Time to move on</div>' +
                '<div class="mallard-ceremony-property farewell">' +
                    '<img src="' + prop.image + '" alt="' + prop.name + '">' +
                    '<div class="mallard-ceremony-property-info">' +
                        '<div class="mallard-ceremony-property-name">' + prop.name + '</div>' +
                        '<div class="mallard-ceremony-property-address">' + prop.address + ', ' + prop.neighborhoodName + '</div>' +
                    '</div>' +
                '</div>' +
                timeNote +
                '<div class="mallard-ceremony-message farewell">' +
                    '<span class="mdi mdi-hand-wave-outline"></span>' +
                    '<div>' +
                        'Your lease has been cancelled and your keys returned. ' +
                        'This property is back on the market. Best of luck on your next adventure!' +
                    '</div>' +
                '</div>' +
                '<button class="mallard-ceremony-btn moveout" data-action="dismiss-ceremony">' +
                    mdi('magnify') + ' Browse Properties' +
                '</button>' +
            '</div>';

        overlay.classList.remove('hidden');
    }

    // =================================
    // DEED CEREMONY OVERLAY (Phase 5)
    // =================================

    function showDeedCeremony(prop, loanTerms) {
        var overlay = el('ceremonyOverlay');
        if (!overlay) return;

        var today = new Date();
        var dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        overlay.innerHTML =
            '<div class="mallard-ceremony-card mallard-ceremony-deed">' +
                // Gold sparkles
                '<div class="mallard-ceremony-sparkles">' +
                    '<span class="mallard-sparkle s1"></span>' +
                    '<span class="mallard-sparkle s2"></span>' +
                    '<span class="mallard-sparkle s3"></span>' +
                    '<span class="mallard-sparkle s4"></span>' +
                    '<span class="mallard-sparkle s5"></span>' +
                    '<span class="mallard-sparkle s6"></span>' +
                '</div>' +

                // Official seal icon
                '<div class="mallard-ceremony-icon-wrap deed">' +
                    '<span class="mdi mdi-seal-variant"></span>' +
                '</div>' +

                '<div class="mallard-ceremony-title deed">Property Deed</div>' +
                '<div class="mallard-ceremony-subtitle deed">Official Record of Ownership</div>' +

                // Deed document
                '<div class="mallard-deed-document">' +
                    '<div class="mallard-deed-line">This certifies that on <strong>' + dateStr + '</strong>,</div>' +
                    '<div class="mallard-deed-line">the property known as</div>' +
                    '<div class="mallard-deed-property-name">' + prop.name + '</div>' +
                    '<div class="mallard-deed-line">located at <strong>' + prop.address + ', ' + prop.neighborhoodName + '</strong></div>' +
                    '<div class="mallard-deed-line">has been officially transferred to the new owner.</div>' +
                '</div>' +

                // Property image
                '<div class="mallard-ceremony-property deed">' +
                    '<img src="' + prop.image + '" alt="' + prop.name + '">' +
                    '<div class="mallard-ceremony-property-info">' +
                        '<div class="mallard-ceremony-property-name">' + prop.name + '</div>' +
                        '<div class="mallard-ceremony-property-address">' + prop.neighborhoodName + ' \u2022 ' + prop.type + '</div>' +
                        '<div class="mallard-ceremony-property-rent deed">' + snakes(prop.price) + '</div>' +
                    '</div>' +
                '</div>' +

                // Mortgage summary
                '<div class="mallard-deed-summary">' +
                    '<div class="mallard-deed-summary-row">' +
                        '<span>Down Payment (5%)</span>' +
                        '<strong>' + snakes(loanTerms.downPayment) + '</strong>' +
                    '</div>' +
                    '<div class="mallard-deed-summary-row">' +
                        '<span>Mortgage Amount</span>' +
                        '<strong>' + snakes(loanTerms.principal) + '</strong>' +
                    '</div>' +
                    '<div class="mallard-deed-summary-row">' +
                        '<span>Monthly Payment</span>' +
                        '<strong>' + snakes(loanTerms.monthlyPayment) + '/mo</strong>' +
                    '</div>' +
                    '<div class="mallard-deed-summary-row">' +
                        '<span>Term</span>' +
                        '<strong>' + termLabel(loanTerms.termMonths) + ' at ' + loanTerms.apr + '% APR</strong>' +
                    '</div>' +
                '</div>' +

                // Agent message
                '<div class="mallard-ceremony-message deed">' +
                    '<span class="mdi mdi-message-text-outline"></span>' +
                    '<div>' +
                        '<strong>' + prop.agent + '</strong> says:' +
                        '<div class="mallard-ceremony-quote">"Welcome to homeownership in ' + prop.neighborhoodName + '! This is a big milestone. Remember, your mortgage payment is processed automatically each month. Enjoy your new home!"</div>' +
                    '</div>' +
                '</div>' +

                '<button class="mallard-ceremony-btn deed" data-action="dismiss-ceremony">' +
                    mdi('home') + ' Welcome Home' +
                '</button>' +
            '</div>';

        overlay.classList.remove('hidden');
    }

    function hideCeremony() {
        var overlay = el('ceremonyOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    // =================================
    // RENT FLOW (Phase 4)
    // =================================

    function handleRent(propId) {
        var prop = MALLARD_PROPERTIES.find(function(p) { return p.id === propId; });
        if (!prop) return;

        var status = getPropertyStatus(propId);
        if (status) {
            showToast(mdi('alert') + ' You already have this property!');
            return;
        }

        if (!prop.rentable) {
            showToast(mdi('alert') + ' This property is not available for rent.');
            return;
        }

        var monthlyRent = Math.round(prop.price * prop.rentRate);

        var balance = 0;
        try {
            var balances = elxaOS.financeService.getAccountBalancesSync();
            balance = balances.checking;
        } catch (e) {
            showToast(mdi('close-circle') + ' Could not read your checking balance.');
            return;
        }

        if (balance < monthlyRent) {
            showToast(mdi('close-circle') + ' Insufficient funds! You need at least ' + snakes(monthlyRent) + ' in checking to cover first month\'s rent.');
            return;
        }

        var bodyHtml =
            '<div class="mallard-confirm-property">' +
                '<img src="' + prop.image + '" alt="' + prop.name + '">' +
                '<div class="mallard-confirm-property-info">' +
                    '<div class="mallard-confirm-property-name">' + prop.name + '</div>' +
                    '<div class="mallard-confirm-property-address">' + prop.address + '</div>' +
                '</div>' +
            '</div>' +
            '<div class="mallard-confirm-details">' +
                '<div class="mallard-confirm-row">' +
                    '<span>Monthly Rent</span>' +
                    '<strong>' + snakes(monthlyRent) + '</strong>' +
                '</div>' +
                '<div class="mallard-confirm-row">' +
                    '<span>Payment Source</span>' +
                    '<strong>Checking Account</strong>' +
                '</div>' +
                '<div class="mallard-confirm-row">' +
                    '<span>Your Balance</span>' +
                    '<strong>' + snakes(balance) + '</strong>' +
                '</div>' +
                '<div class="mallard-confirm-row mallard-confirm-row-after">' +
                    '<span>Balance After Rent</span>' +
                    '<strong>' + snakes(balance - monthlyRent) + '</strong>' +
                '</div>' +
            '</div>' +
            '<div class="mallard-confirm-note">' +
                mdi('file-document-outline') + ' Rent is deducted automatically from checking each month. ' +
                'Three missed payments may result in eviction.' +
            '</div>';

        showConfirmOverlay({
            title: mdi('file-document-edit-outline') + ' Sign Rental Agreement',
            body: bodyHtml,
            confirmText: mdi('key-variant') + ' Sign Lease',
            cancelText: 'Cancel',
            confirmClass: 'mallard-confirm-btn-rent',
            onConfirm: function() { confirmRent(propId); }
        });
    }

    async function confirmRent(propId) {
        var prop = MALLARD_PROPERTIES.find(function(p) { return p.id === propId; });
        if (!prop) return;

        var monthlyRent = Math.round(prop.price * prop.rentRate);

        try {
            var fs = elxaOS.financeService;
            var inv = elxaOS.inventoryService;

            var rentResult = fs.addRecurringPayment({
                description: 'Rent \u2014 ' + prop.name,
                amount: monthlyRent,
                type: 'rent',
                sourceAccount: 'checking',
                linkedId: 'mallard-' + propId
            });

            if (!rentResult || !rentResult.success) {
                showToast(mdi('close-circle') + ' Failed to set up rent payment. Try again.');
                return;
            }

            var rentPaymentId = rentResult.payment.id;

            var withdrawResult = await fs.withdraw('checking', monthlyRent, 'Rent \u2014 ' + prop.name + ' (first month)');
            if (!withdrawResult || !withdrawResult.success) {
                fs.cancelRecurringPayment(rentPaymentId);
                showToast(mdi('close-circle') + ' Insufficient funds for first month\'s rent.');
                return;
            }

            await inv.acquireProperty({
                propertyId: propId,
                name: prop.name,
                neighborhood: prop.neighborhoodName,
                purchasePrice: prop.price,
                currentValue: prop.price,
                bedrooms: prop.bedrooms,
                image: prop.image
            }, 'rented', {
                rentPaymentId: rentPaymentId
            });

            closeDetail();
            showMoveInCeremony(prop);

            if (elxaOS.notificationService) {
                elxaOS.notificationService.addNotification({
                    title: 'Welcome Home!',
                    body: 'You are now renting ' + prop.name + ' for ' + snakes(monthlyRent) + '/month.',
                    icon: 'mdi-home-plus',
                    category: 'finance',
                    urgency: 'info',
                    toast: false
                });
            }

            if (currentTab === 'browse') {
                renderMortgageBanner();
                renderGrid();
            } else if (currentTab === 'my-properties') {
                renderMyProperties();
            }

        } catch (e) {
            console.error('Mallard: Rent flow error:', e);
            showToast(mdi('close-circle') + ' Something went wrong. Please try again.');
        }
    }

    // =================================
    // MOVE-OUT FLOW (Phase 4)
    // =================================

    function handleMoveOut(propId) {
        var prop = MALLARD_PROPERTIES.find(function(p) { return p.id === propId; });
        if (!prop) return;

        var status = getPropertyStatus(propId);
        if (!status || status.ownership !== 'rented') {
            showToast(mdi('alert') + ' You\'re not renting this property.');
            return;
        }

        var monthlyRent = Math.round(prop.price * prop.rentRate);

        var bodyHtml =
            '<div class="mallard-confirm-property">' +
                '<img src="' + prop.image + '" alt="' + prop.name + '">' +
                '<div class="mallard-confirm-property-info">' +
                    '<div class="mallard-confirm-property-name">' + prop.name + '</div>' +
                    '<div class="mallard-confirm-property-address">' + prop.address + '</div>' +
                '</div>' +
            '</div>' +
            '<div class="mallard-confirm-details">' +
                '<div class="mallard-confirm-row">' +
                    '<span>Current Monthly Rent</span>' +
                    '<strong>' + snakes(monthlyRent) + '</strong>' +
                '</div>' +
                '<div class="mallard-confirm-row">' +
                    '<span>Renting Since</span>' +
                    '<strong>' + (status.acquiredDate || 'Unknown') + '</strong>' +
                '</div>' +
            '</div>' +
            '<div class="mallard-confirm-note mallard-confirm-note-warning">' +
                mdi('alert-outline') + ' Moving out will cancel your lease and stop monthly rent payments. ' +
                'This property will return to the market.' +
            '</div>';

        showConfirmOverlay({
            title: mdi('package-variant') + ' Move Out?',
            body: bodyHtml,
            confirmText: mdi('door-open') + ' Move Out',
            cancelText: 'Stay',
            confirmClass: 'mallard-confirm-btn-danger',
            onConfirm: function() { confirmMoveOut(propId); }
        });
    }

    async function confirmMoveOut(propId) {
        var prop = MALLARD_PROPERTIES.find(function(p) { return p.id === propId; });
        var status = getPropertyStatus(propId);
        if (!status) return;

        var acquiredDate = status.acquiredDate || null;

        try {
            var inv = elxaOS.inventoryService;

            await inv.loseProperty(status.inventoryId, 'sold');

            closeDetail();
            showMoveOutFarewell(prop, acquiredDate);

            if (elxaOS.notificationService) {
                elxaOS.notificationService.addNotification({
                    title: 'Moved Out',
                    body: 'You have moved out of ' + prop.name + '. Your lease has been cancelled.',
                    icon: 'mdi-home-minus',
                    category: 'finance',
                    urgency: 'info',
                    toast: false
                });
            }

            if (currentTab === 'browse') {
                renderMortgageBanner();
                renderGrid();
            } else if (currentTab === 'my-properties') {
                renderMyProperties();
            }

        } catch (e) {
            console.error('Mallard: Move-out error:', e);
            showToast(mdi('close-circle') + ' Something went wrong. Please try again.');
        }
    }

    // =================================
    // BUY FLOW (Phase 5)
    // =================================

    function handleBuy(propId) {
        var prop = MALLARD_PROPERTIES.find(function(p) { return p.id === propId; });
        if (!prop) return;

        // Already owned?
        var status = getPropertyStatus(propId);
        if (status) {
            showToast(mdi('alert') + ' You already have this property!');
            return;
        }

        if (!prop.buyable) {
            showToast(mdi('alert') + ' This property is not for sale.');
            return;
        }

        // Mortgage eligibility
        var mortgageInfo = getMortgageInfo();
        if (!mortgageInfo || !mortgageInfo.eligible) {
            showToast(mdi('close-circle') + ' Your credit score doesn\'t qualify for a mortgage yet. You need 670+ to apply.');
            return;
        }

        var downPayment = Math.round(prop.price * 0.05);
        var loanAmount = prop.price - downPayment;

        // Tier check
        if (loanAmount > mortgageInfo.maxAmount) {
            showToast(mdi('close-circle') + ' This property requires a ' + snakes(loanAmount) + ' mortgage, but your ' + mortgageInfo.tierLabel + ' tier covers up to ' + snakes(mortgageInfo.maxAmount) + '.');
            return;
        }

        // Check active mortgages (max 2)
        var existingMortgages = 0;
        try {
            var loans = elxaOS.financeService.getLoansSync();
            for (var i = 0; i < loans.length; i++) {
                if (loans[i].type === 'mortgage' && loans[i].status === 'active') existingMortgages++;
            }
        } catch (e) {}

        if (existingMortgages >= 2) {
            showToast(mdi('close-circle') + ' You already have 2 active mortgages. Pay one off before applying for another.');
            return;
        }

        // Check checking balance for down payment
        var balance = 0;
        try {
            var balances = elxaOS.financeService.getAccountBalancesSync();
            balance = balances.checking;
        } catch (e) {
            showToast(mdi('close-circle') + ' Could not read your checking balance.');
            return;
        }

        if (balance < downPayment) {
            showToast(mdi('close-circle') + ' Insufficient funds! You need at least ' + snakes(downPayment) + ' in checking for the 5% down payment.');
            return;
        }

        // Get APR for this score
        var apr = getMortgageApr(mortgageInfo.score);

        // Show the mortgage application overlay
        showBuyOverlay(prop, downPayment, loanAmount, apr, balance);
    }

    function showBuyOverlay(prop, downPayment, loanAmount, apr, balance) {
        var overlay = el('confirmOverlay');
        if (!overlay) return;

        // Default term
        pendingBuyTermMonths = 60;
        var defaultMonthly = calcMonthlyPayment(loanAmount, apr, 60);
        var defaultInterest = calcTotalInterest(loanAmount, defaultMonthly, 60);

        var bodyHtml =
            '<div class="mallard-confirm-property">' +
                '<img src="' + prop.image + '" alt="' + prop.name + '">' +
                '<div class="mallard-confirm-property-info">' +
                    '<div class="mallard-confirm-property-name">' + prop.name + '</div>' +
                    '<div class="mallard-confirm-property-address">' + prop.address + ', ' + prop.neighborhoodName + '</div>' +
                '</div>' +
            '</div>' +

            '<div class="mallard-buy-section-label">' + mdi('bank') + ' Mortgage Application</div>' +

            '<div class="mallard-confirm-details">' +
                '<div class="mallard-confirm-row">' +
                    '<span>Property Price</span>' +
                    '<strong>' + snakes(prop.price) + '</strong>' +
                '</div>' +
                '<div class="mallard-confirm-row">' +
                    '<span>Down Payment (5%)</span>' +
                    '<strong>' + snakes(downPayment) + '</strong>' +
                '</div>' +
                '<div class="mallard-confirm-row">' +
                    '<span>Mortgage Amount</span>' +
                    '<strong>' + snakes(loanAmount) + '</strong>' +
                '</div>' +
                '<div class="mallard-confirm-row">' +
                    '<span>Interest Rate (APR)</span>' +
                    '<strong>' + apr + '%</strong>' +
                '</div>' +
            '</div>' +

            // Term selector
            '<div class="mallard-buy-term-section">' +
                '<label class="mallard-buy-term-label">Loan Term</label>' +
                '<div class="mallard-buy-term-options" id="buyTermOptions">' +
                    '<button class="mallard-term-btn" data-term="36">3-Year</button>' +
                    '<button class="mallard-term-btn active" data-term="60">5-Year</button>' +
                    '<button class="mallard-term-btn" data-term="84">7-Year</button>' +
                    '<button class="mallard-term-btn" data-term="120">10-Year</button>' +
                '</div>' +
            '</div>' +

            // Dynamic payment display
            '<div class="mallard-buy-payment-preview" id="buyPaymentPreview">' +
                '<div class="mallard-buy-payment-main">' +
                    '<div class="mallard-buy-payment-amount" id="buyMonthlyAmount">' + snakes(defaultMonthly) + '</div>' +
                    '<div class="mallard-buy-payment-label">per month for <span id="buyTermLabel">5 years</span></div>' +
                '</div>' +
                '<div class="mallard-buy-payment-details">' +
                    '<div class="mallard-buy-payment-detail">' +
                        '<span>Total Interest</span>' +
                        '<strong id="buyTotalInterest">' + snakes(defaultInterest) + '</strong>' +
                    '</div>' +
                    '<div class="mallard-buy-payment-detail">' +
                        '<span>Total Cost</span>' +
                        '<strong id="buyTotalCost">' + snakes(loanAmount + defaultInterest + downPayment) + '</strong>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            '<div class="mallard-confirm-details" style="margin-top:8px">' +
                '<div class="mallard-confirm-row">' +
                    '<span>Your Checking Balance</span>' +
                    '<strong>' + snakes(balance) + '</strong>' +
                '</div>' +
                '<div class="mallard-confirm-row mallard-confirm-row-after">' +
                    '<span>After Down Payment</span>' +
                    '<strong>' + snakes(balance - downPayment) + '</strong>' +
                '</div>' +
            '</div>' +

            '<div class="mallard-confirm-note">' +
                mdi('information-outline') + ' Down payment is deducted immediately from checking. ' +
                'Mortgage payments are processed automatically each month. Three missed payments may result in foreclosure.' +
            '</div>';

        overlay.innerHTML =
            '<div class="mallard-confirm-dialog mallard-confirm-dialog-buy">' +
                '<div class="mallard-confirm-title">' + mdi('home-city') + ' Purchase ' + prop.name + '</div>' +
                '<div class="mallard-confirm-body">' + bodyHtml + '</div>' +
                '<div class="mallard-confirm-actions">' +
                    '<button class="mallard-confirm-btn mallard-confirm-btn-cancel" data-confirm-action="cancel">Cancel</button>' +
                    '<button class="mallard-confirm-btn mallard-confirm-btn-buy" data-confirm-action="confirm">' + mdi('seal-variant') + ' Apply for Mortgage</button>' +
                '</div>' +
            '</div>';

        overlay._onConfirm = function() { confirmBuy(prop.id); };
        overlay._onCancel = function() {};
        overlay.classList.remove('hidden');

        // Wire up term selector buttons
        wireBuyTermSelector(loanAmount, apr, downPayment);
    }

    function wireBuyTermSelector(loanAmount, apr, downPayment) {
        var container = document.getElementById('buyTermOptions');
        if (!container) return;

        container.addEventListener('click', function(e) {
            var btn = e.target.closest('.mallard-term-btn');
            if (!btn) return;

            var term = parseInt(btn.getAttribute('data-term'));
            if (!term) return;

            pendingBuyTermMonths = term;

            // Update active button
            var btns = container.querySelectorAll('.mallard-term-btn');
            for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
            btn.classList.add('active');

            // Recalculate
            var monthly = calcMonthlyPayment(loanAmount, apr, term);
            var interest = calcTotalInterest(loanAmount, monthly, term);
            var years = term / 12;
            var yearStr = years === Math.floor(years) ? years + ' years' : term + ' months';

            var elMonthly = document.getElementById('buyMonthlyAmount');
            var elTermLabel = document.getElementById('buyTermLabel');
            var elInterest = document.getElementById('buyTotalInterest');
            var elCost = document.getElementById('buyTotalCost');

            if (elMonthly) elMonthly.textContent = snakes(monthly);
            if (elTermLabel) elTermLabel.textContent = yearStr;
            if (elInterest) elInterest.textContent = snakes(interest);
            if (elCost) elCost.textContent = snakes(loanAmount + interest + downPayment);
        });
    }

    async function confirmBuy(propId) {
        var prop = MALLARD_PROPERTIES.find(function(p) { return p.id === propId; });
        if (!prop) return;

        var downPayment = Math.round(prop.price * 0.05);
        var loanAmount = prop.price - downPayment;
        var termMonths = pendingBuyTermMonths || 60;

        try {
            var fs = elxaOS.financeService;
            var inv = elxaOS.inventoryService;

            // 1. Withdraw down payment from checking
            var withdrawResult = await fs.withdraw('checking', downPayment, 'Down payment \u2014 ' + prop.name + ' (5%)');
            if (!withdrawResult || !withdrawResult.success) {
                showToast(mdi('close-circle') + ' Insufficient funds for down payment.');
                return;
            }

            // 2. Apply for mortgage loan
            var loanResult = await fs.applyForLoan({
                type: 'mortgage',
                amount: loanAmount,
                termMonths: termMonths,
                sourceAccount: 'checking',
                linkedAsset: { type: 'property', id: propId },
                purpose: prop.name + ' (' + prop.neighborhoodName + ')'
            });

            if (!loanResult || !loanResult.approved) {
                // Refund the down payment
                await fs.deposit('checking', downPayment, 'Refund \u2014 ' + prop.name + ' down payment (mortgage denied)');
                var reason = loanResult ? loanResult.message : 'Mortgage application failed.';
                showToast(mdi('close-circle') + ' ' + reason);
                return;
            }

            var loanId = loanResult.loan.id;

            // 3. The loan disbursement went to checking — withdraw it back
            //    (applyForLoan deposits the loan amount into checking, but we don't
            //     want the buyer to receive the mortgage money — it pays the seller)
            var clawback = await fs.withdraw('checking', loanAmount, 'Mortgage disbursement \u2014 ' + prop.name + ' (paid to seller)');
            // If clawback fails, the money is still in checking — not ideal but not broken

            // 4. Acquire property as mortgaged
            await inv.acquireProperty({
                propertyId: propId,
                name: prop.name,
                neighborhood: prop.neighborhoodName,
                purchasePrice: prop.price,
                currentValue: prop.price,
                bedrooms: prop.bedrooms,
                image: prop.image
            }, 'mortgaged', {
                loanId: loanId
            });

            // 5. Close detail and show deed ceremony
            closeDetail();
            showDeedCeremony(prop, {
                downPayment: downPayment,
                principal: loanAmount,
                monthlyPayment: loanResult.terms.monthlyPayment,
                apr: loanResult.terms.apr,
                termMonths: termMonths
            });

            // 6. Notification
            if (elxaOS.notificationService) {
                elxaOS.notificationService.addNotification({
                    title: 'Property Purchased!',
                    body: 'You are now the proud owner of ' + prop.name + '! Monthly mortgage: ' + snakes(loanResult.terms.monthlyPayment) + '.',
                    icon: 'mdi-home-city',
                    category: 'finance',
                    urgency: 'info',
                    toast: false
                });
            }

            // 7. Refresh views
            if (currentTab === 'browse') {
                renderMortgageBanner();
                renderGrid();
            } else if (currentTab === 'my-properties') {
                renderMyProperties();
            }

        } catch (e) {
            console.error('Mallard: Buy flow error:', e);
            showToast(mdi('close-circle') + ' Something went wrong with the purchase. Please try again.');
        }
    }

    // =================================
    // SELL FLOW (Phase 6)
    // =================================

    function handleSell(propId) {
        var prop = MALLARD_PROPERTIES.find(function(p) { return p.id === propId; });
        if (!prop) return;

        var status = getPropertyStatus(propId);
        if (!status) {
            showToast(mdi('alert') + ' You don\'t own this property.');
            return;
        }
        if (status.ownership === 'rented') {
            showToast(mdi('alert') + ' You\'re renting this property. Use Move Out instead.');
            return;
        }

        // Calculate current market value with appreciation
        var purchasePrice = status.purchasePrice || prop.price;
        var currentValue = calcCurrentValue(purchasePrice, prop.neighborhood, status.acquiredDate);
        var appreciationPct = calcAppreciationPercent(purchasePrice, currentValue);

        // Check if mortgaged — get loan details
        var loanInfo = null;
        if (status.loanId) {
            try {
                var loans = elxaOS.financeService.getLoansSync();
                for (var i = 0; i < loans.length; i++) {
                    if (loans[i].id === status.loanId && loans[i].status === 'active') {
                        loanInfo = loans[i];
                        break;
                    }
                }
            } catch (e) {
                console.warn('Mallard: Could not read loan info', e);
            }
        }

        var netProceeds = currentValue;
        if (loanInfo) {
            netProceeds = currentValue - loanInfo.remainingBalance;
        }

        showSellOverlay(prop, status, currentValue, appreciationPct, loanInfo, netProceeds);
    }

    function showSellOverlay(prop, status, currentValue, appreciationPct, loanInfo, netProceeds) {
        var purchasePrice = status.purchasePrice || prop.price;

        var appreciationClass = appreciationPct > 0 ? 'positive' : (appreciationPct < 0 ? 'negative' : '');
        var appreciationSign = appreciationPct > 0 ? '+' : '';
        var appreciationLine = appreciationPct !== 0
            ? '<div class="mallard-sell-appreciation ' + appreciationClass + '">' +
                mdi(appreciationPct > 0 ? 'trending-up' : 'trending-down') +
                ' ' + appreciationSign + appreciationPct + '% since purchase' +
              '</div>'
            : '';

        var mortgageSection = '';
        if (loanInfo) {
            mortgageSection =
                '<div class="mallard-sell-section-label">' + mdi('bank') + ' Mortgage Payoff</div>' +
                '<div class="mallard-confirm-details">' +
                    '<div class="mallard-confirm-row">' +
                        '<span>Remaining Mortgage Balance</span>' +
                        '<strong class="mallard-sell-deduction">\u2212 ' + snakes(loanInfo.remainingBalance) + '</strong>' +
                    '</div>' +
                '</div>';
        }

        var netClass = netProceeds >= 0 ? '' : ' mallard-sell-net-negative';

        var bodyHtml =
            '<div class="mallard-confirm-property">' +
                '<img src="' + prop.image + '" alt="' + prop.name + '">' +
                '<div class="mallard-confirm-property-info">' +
                    '<div class="mallard-confirm-property-name">' + prop.name + '</div>' +
                    '<div class="mallard-confirm-property-address">' + prop.address + ', ' + prop.neighborhoodName + '</div>' +
                '</div>' +
            '</div>' +

            '<div class="mallard-sell-section-label">' + mdi('chart-line') + ' Property Valuation</div>' +
            '<div class="mallard-confirm-details">' +
                '<div class="mallard-confirm-row">' +
                    '<span>Original Purchase Price</span>' +
                    '<strong>' + snakes(purchasePrice) + '</strong>' +
                '</div>' +
                '<div class="mallard-confirm-row">' +
                    '<span>Current Market Value</span>' +
                    '<strong>' + snakes(currentValue) + '</strong>' +
                '</div>' +
            '</div>' +
            appreciationLine +

            mortgageSection +

            '<div class="mallard-sell-net-box' + netClass + '">' +
                '<div class="mallard-sell-net-label">Net Proceeds to Your Checking</div>' +
                '<div class="mallard-sell-net-amount">' + (netProceeds < 0 ? '\u2212 ' : '') + snakes(Math.abs(netProceeds)) + '</div>' +
            '</div>' +

            (netProceeds < 0
                ? '<div class="mallard-confirm-note mallard-confirm-note-warning">' +
                    mdi('alert-outline') + ' Warning: You owe more on the mortgage than the property is worth. ' +
                    'Selling will cost you ' + snakes(Math.abs(netProceeds)) + ' from your checking account to cover the difference.' +
                  '</div>'
                : '<div class="mallard-confirm-note">' +
                    mdi('information-outline') + ' The sale amount will be deposited into your checking account' +
                    (loanInfo ? ' after the mortgage is paid off.' : '.') +
                    ' This property will return to the market.' +
                  '</div>'
            );

        // If net is negative, check if user has enough in checking
        var canAfford = true;
        if (netProceeds < 0) {
            try {
                var balances = elxaOS.financeService.getAccountBalancesSync();
                if (balances.checking < Math.abs(netProceeds)) {
                    canAfford = false;
                    bodyHtml += '<div class="mallard-confirm-note mallard-confirm-note-warning">' +
                        mdi('close-circle') + ' You don\'t have enough in checking (' + snakes(balances.checking) +
                        ') to cover the shortfall of ' + snakes(Math.abs(netProceeds)) + '. You cannot sell this property right now.' +
                    '</div>';
                }
            } catch (e) {}
        }

        showConfirmOverlay({
            title: mdi('tag') + ' Sell Property',
            body: bodyHtml,
            confirmText: mdi('cash-multiple') + ' Confirm Sale',
            cancelText: 'Keep Property',
            confirmClass: canAfford ? 'mallard-confirm-btn-sell' : 'mallard-confirm-btn-disabled',
            onConfirm: canAfford ? function() { confirmSell(prop.id, currentValue, loanInfo); } : function() {}
        });
    }

    async function confirmSell(propId, salePrice, loanInfo) {
        var prop = MALLARD_PROPERTIES.find(function(p) { return p.id === propId; });
        if (!prop) return;

        var status = getPropertyStatus(propId);
        if (!status) return;

        try {
            var fs = elxaOS.financeService;
            var inv = elxaOS.inventoryService;

            // 1. Deposit the full sale price into checking
            await fs.deposit('checking', salePrice, 'Property sale \u2014 ' + prop.name);

            // 2. If mortgaged, pay off the loan from checking
            var payoffResult = null;
            if (loanInfo && loanInfo.status === 'active') {
                payoffResult = await fs.payOffLoan(loanInfo.id, 'checking');
                if (!payoffResult || !payoffResult.success) {
                    console.warn('Mallard: Loan payoff issue:', payoffResult);
                    // Continue anyway — the deposit already happened
                }
            }

            // 3. Remove property from inventory
            await inv.loseProperty(status.inventoryId, 'sold');

            // 4. Calculate net for ceremony display
            var netProceeds = salePrice;
            if (loanInfo) {
                netProceeds = salePrice - loanInfo.remainingBalance;
            }

            // 5. Show sale ceremony
            closeDetail();
            showSaleCeremony(prop, status, salePrice, netProceeds, loanInfo);

            // 6. Notification
            if (elxaOS.notificationService) {
                elxaOS.notificationService.addNotification({
                    title: 'Property Sold!',
                    body: prop.name + ' has been sold for ' + snakes(salePrice) + '. Net proceeds: ' + snakes(netProceeds) + '.',
                    icon: 'mdi-cash-multiple',
                    category: 'finance',
                    urgency: 'info',
                    toast: false
                });
            }

            // 7. Refresh views
            if (currentTab === 'browse') {
                renderMortgageBanner();
                renderGrid();
            } else if (currentTab === 'my-properties') {
                renderMyProperties();
            }

        } catch (e) {
            console.error('Mallard: Sell flow error:', e);
            showToast(mdi('close-circle') + ' Something went wrong with the sale. Please try again.');
        }
    }

    // =================================
    // SALE CEREMONY OVERLAY (Phase 6)
    // =================================

    function showSaleCeremony(prop, status, salePrice, netProceeds, loanInfo) {
        var overlay = el('ceremonyOverlay');
        if (!overlay) return;

        var purchasePrice = status.purchasePrice || prop.price;
        var profit = netProceeds - purchasePrice;
        var profitLine = '';
        if (profit > 0) {
            profitLine = '<div class="mallard-sale-profit positive">' +
                mdi('trending-up') + ' You made a profit of ' + snakes(profit) + '!</div>';
        } else if (profit < 0) {
            profitLine = '<div class="mallard-sale-profit negative">' +
                mdi('trending-down') + ' You lost ' + snakes(Math.abs(profit)) + ' on this property.</div>';
        } else {
            profitLine = '<div class="mallard-sale-profit neutral">' +
                mdi('minus') + ' You broke even on this sale.</div>';
        }

        var mortgageLine = '';
        if (loanInfo) {
            mortgageLine =
                '<div class="mallard-sale-summary-row">' +
                    '<span>Mortgage Paid Off</span>' +
                    '<strong>\u2212 ' + snakes(loanInfo.remainingBalance) + '</strong>' +
                '</div>';
        }

        overlay.innerHTML =
            '<div class="mallard-ceremony-card mallard-ceremony-sale">' +
                // Sparkles
                '<div class="mallard-ceremony-sparkles">' +
                    '<span class="mallard-sparkle s1"></span>' +
                    '<span class="mallard-sparkle s2"></span>' +
                    '<span class="mallard-sparkle s3"></span>' +
                    '<span class="mallard-sparkle s4"></span>' +
                    '<span class="mallard-sparkle s5"></span>' +
                    '<span class="mallard-sparkle s6"></span>' +
                '</div>' +

                '<div class="mallard-ceremony-icon-wrap sale">' +
                    '<span class="mdi mdi-cash-check"></span>' +
                '</div>' +

                '<div class="mallard-ceremony-title sale">Property Sold!</div>' +
                '<div class="mallard-ceremony-subtitle sale">Transaction Complete</div>' +

                // Property preview
                '<div class="mallard-ceremony-property sale">' +
                    '<img src="' + prop.image + '" alt="' + prop.name + '">' +
                    '<div class="mallard-ceremony-property-info">' +
                        '<div class="mallard-ceremony-property-name">' + prop.name + '</div>' +
                        '<div class="mallard-ceremony-property-address">' + prop.neighborhoodName + ' \u2022 ' + prop.type + '</div>' +
                    '</div>' +
                '</div>' +

                // Financial summary
                '<div class="mallard-sale-summary">' +
                    '<div class="mallard-sale-summary-row">' +
                        '<span>Sale Price</span>' +
                        '<strong>' + snakes(salePrice) + '</strong>' +
                    '</div>' +
                    mortgageLine +
                    '<div class="mallard-sale-summary-row mallard-sale-summary-total">' +
                        '<span>Deposited to Checking</span>' +
                        '<strong>' + snakes(netProceeds) + '</strong>' +
                    '</div>' +
                '</div>' +

                profitLine +

                '<div class="mallard-ceremony-message sale">' +
                    '<span class="mdi mdi-hand-wave-outline"></span>' +
                    '<div>' +
                        'The sale is complete and the funds have been deposited to your checking account. ' +
                        'This property is back on the market. Good luck with your next venture!' +
                    '</div>' +
                '</div>' +

                '<button class="mallard-ceremony-btn sale" data-action="dismiss-ceremony">' +
                    mdi('magnify') + ' Browse Properties' +
                '</button>' +
            '</div>';

        overlay.classList.remove('hidden');
    }

    // ---- Rendering ----

    function renderMortgageBanner() {
        var banner = el('mortgageBanner');
        if (!banner) return;

        var info = getMortgageInfo();
        if (!info) {
            banner.classList.remove('visible');
            return;
        }

        if (info.eligible) {
            banner.innerHTML =
                '<strong>' + mdi('home-city') + ' Mortgage Pre-Qualification:</strong> ' +
                'Your credit score of <strong>' + info.score + '</strong> (' + info.rating + ') ' +
                'qualifies you for mortgages up to <strong>' + snakes(info.maxAmount) + '</strong>' +
                ' <span class="tier-label">' + info.tierLabel + ' Tier</span>';
        } else {
            banner.innerHTML =
                '<strong>' + mdi('home-city') + ' Mortgage Status:</strong> ' +
                'Your credit score of <strong>' + info.score + '</strong> (' + info.rating + ') ' +
                'does not yet qualify for a mortgage. Minimum score required: <strong>670</strong>.';
        }
        banner.classList.add('visible');
    }

    function renderPropertyCard(prop) {
        var status = getPropertyStatus(prop.id);
        var monthlyRent = prop.rentable ? Math.round(prop.price * prop.rentRate) : 0;

        var badges = '';
        if (status) {
            if (status.ownership === 'rented') {
                badges += '<span class="mallard-badge mallard-badge-rented">RENTED</span>';
            } else if (isLoanActive(status.loanId)) {
                badges += '<span class="mallard-badge mallard-badge-mortgaged">MORTGAGED</span>';
            } else {
                badges += '<span class="mallard-badge mallard-badge-owned">OWNED</span>';
            }
        } else {
            if (prop.rentable) badges += '<span class="mallard-badge mallard-badge-rent">Rent</span>';
            if (prop.buyable) badges += '<span class="mallard-badge mallard-badge-buy">Buy</span>';
        }

        var rentLine = '';
        if (prop.rentable && !status) {
            rentLine = '<div class="mallard-card-rent">' + snakes(monthlyRent) + '/mo to rent</div>';
        }

        return '<div class="mallard-card" data-action="view-property" data-id="' + prop.id + '">' +
            '<div class="mallard-card-image">' +
                '<img src="' + prop.image + '" alt="' + prop.name + '" loading="lazy">' +
                '<div class="mallard-card-badges">' + badges + '</div>' +
                '<div class="mallard-card-neighborhood">' + prop.neighborhoodName + '</div>' +
            '</div>' +
            '<div class="mallard-card-body">' +
                '<div class="mallard-card-name">' + prop.name + '</div>' +
                '<div class="mallard-card-price">' + snakes(prop.price) +
                    '<span class="price-usd">(' + usd(prop.price) + ')</span>' +
                '</div>' +
                '<div class="mallard-card-stats">' +
                    '<span>' + mdi('bed') + ' ' + prop.bedrooms + ' bed</span>' +
                    '<span>' + mdi('shower') + ' ' + prop.bathrooms + ' bath</span>' +
                    '<span>' + mdi('ruler-square') + ' ' + prop.sqft.toLocaleString() + ' sqft</span>' +
                '</div>' +
                rentLine +
                '<div class="mallard-card-type">' + prop.type + ' \u2022 Built ' + prop.yearBuilt + '</div>' +
            '</div>' +
        '</div>';
    }

    function getFilteredProperties() {
        var neighborhood = el('filterNeighborhood').value;
        var priceRange = el('filterPrice').value;
        var availability = el('filterAvailability').value;
        var sortBy = el('filterSort').value;

        var owned = getOwnedPropertyIds();
        var results = MALLARD_PROPERTIES.slice();

        if (neighborhood !== 'all') {
            results = results.filter(function(p) { return p.neighborhood === neighborhood; });
        }

        if (priceRange !== 'all') {
            var parts = priceRange.split('-');
            var min = parseInt(parts[0]);
            var max = parseInt(parts[1]);
            results = results.filter(function(p) { return p.price >= min && p.price <= max; });
        }

        if (availability === 'rent') {
            results = results.filter(function(p) { return p.rentable; });
        } else if (availability === 'buy') {
            results = results.filter(function(p) { return p.buyable; });
        } else if (availability === 'available') {
            results = results.filter(function(p) { return !owned[p.id]; });
        }

        results.sort(function(a, b) {
            switch (sortBy) {
                case 'price-asc': return a.price - b.price;
                case 'price-desc': return b.price - a.price;
                case 'sqft-desc': return b.sqft - a.sqft;
                case 'name-asc': return a.name.localeCompare(b.name);
                default: return a.price - b.price;
            }
        });

        return results;
    }

    function renderGrid() {
        var grid = el('propertyGrid');
        var count = el('resultsCount');
        if (!grid) return;

        var props = getFilteredProperties();
        count.textContent = props.length + ' listing' + (props.length !== 1 ? 's' : '') + ' found';

        if (props.length === 0) {
            grid.innerHTML = '<div class="mallard-no-results">No properties match your filters. Try adjusting your search.</div>';
            return;
        }

        var html = '';
        for (var i = 0; i < props.length; i++) {
            html += renderPropertyCard(props[i]);
        }
        grid.innerHTML = html;
    }

    // ---- Detail View ----

    function showDetail(propId) {
        var prop = MALLARD_PROPERTIES.find(function(p) { return p.id === propId; });
        if (!prop) return;

        currentDetailId = propId;
        var status = getPropertyStatus(propId);
        var mortgageInfo = getMortgageInfo();
        var monthlyRent = prop.rentable ? Math.round(prop.price * prop.rentRate) : 0;

        var featuresHtml = '';
        for (var i = 0; i < prop.features.length; i++) {
            featuresHtml += '<li>' + prop.features[i] + '</li>';
        }

        var actionsHtml = '';
        var mortgageNote = '';

        if (status) {
            if (status.ownership === 'rented') {
                actionsHtml =
                    '<button class="mallard-btn mallard-btn-renting" disabled>' + mdi('key-variant') + ' Currently Renting</button>' +
                    '<button class="mallard-btn mallard-btn-moveout" data-action="move-out" data-id="' + propId + '">' + mdi('door-open') + ' Move Out</button>';
            } else {
                var purchasePrice = status.purchasePrice || prop.price;
                var curVal = calcCurrentValue(purchasePrice, prop.neighborhood, status.acquiredDate);
                var ownerLabel = isLoanActive(status.loanId) ? 'Mortgaged \u2014 You Own This Property' : 'You Own This Property';
                actionsHtml =
                    '<button class="mallard-btn mallard-btn-owned" disabled>' + mdi('seal-variant') + ' ' + ownerLabel + '</button>' +
                    '<button class="mallard-btn mallard-btn-sell" data-action="sell" data-id="' + propId + '">' + mdi('tag') + ' Sell \u2014 ' + snakes(curVal) + '</button>';
            }
        } else {
            if (prop.rentable) {
                actionsHtml += '<button class="mallard-btn mallard-btn-rent" data-action="rent" data-id="' + propId + '">' + mdi('file-document-edit-outline') + ' Rent \u2014 ' + snakes(monthlyRent) + '/mo</button>';
            }
            if (prop.buyable) {
                actionsHtml += '<button class="mallard-btn mallard-btn-buy" data-action="buy" data-id="' + propId + '">' + mdi('home') + ' Buy \u2014 ' + snakes(prop.price) + '</button>';

                if (mortgageInfo) {
                    var downPayment = Math.round(prop.price * 0.05);
                    var loanAmount = prop.price - downPayment;

                    if (!mortgageInfo.eligible) {
                        mortgageNote = '<div class="mallard-detail-mortgage-info warning">' +
                            mdi('alert') + ' Your credit score of ' + mortgageInfo.score + ' does not qualify for a mortgage yet. ' +
                            'Build your score to 670+ to unlock mortgage financing.' +
                            '</div>';
                    } else if (loanAmount > mortgageInfo.maxAmount) {
                        mortgageNote = '<div class="mallard-detail-mortgage-info warning">' +
                            mdi('alert') + ' This property requires a ' + snakes(loanAmount) + ' mortgage. ' +
                            'Your ' + mortgageInfo.tierLabel + ' tier qualifies up to ' + snakes(mortgageInfo.maxAmount) + '. ' +
                            'Improve your credit score to unlock a higher tier.' +
                            '</div>';
                    } else {
                        mortgageNote = '<div class="mallard-detail-mortgage-info">' +
                            mdi('check-circle') + ' You qualify! Down payment: ' + snakes(downPayment) + ' (5%) + ' +
                            snakes(loanAmount) + ' mortgage.' +
                            '</div>';
                    }
                }
            }
            if (!prop.rentable && !prop.buyable) {
                actionsHtml = '<button class="mallard-btn mallard-btn-disabled" disabled>Not Available</button>';
            }
        }

        var rentInfoHtml = '';
        if (prop.rentable && !status) {
            rentInfoHtml = '<div class="mallard-detail-rent-info">Rent includes: water, trash collection. Tenant pays: electricity, internet.</div>';
        }

        var agentInitial = prop.agent.charAt(0);

        var html =
            '<div class="mallard-detail-image">' +
                '<img src="' + prop.image + '" alt="' + prop.name + '">' +
            '</div>' +
            '<div class="mallard-detail-body">' +
                '<div class="mallard-detail-header">' +
                    '<div>' +
                        '<div class="mallard-detail-name">' + prop.name + '</div>' +
                        '<div class="mallard-detail-address">' + prop.address + ', ' + prop.neighborhoodName + '</div>' +
                    '</div>' +
                    '<div class="mallard-detail-price-block">' +
                        '<div class="mallard-detail-price">' + snakes(prop.price) + '</div>' +
                        '<div class="mallard-detail-price-usd">' + usd(prop.price) + '</div>' +
                    '</div>' +
                '</div>' +

                '<div class="mallard-detail-stats">' +
                    '<div class="mallard-detail-stat">' +
                        '<div class="mallard-detail-stat-value">' + prop.bedrooms + '</div>' +
                        '<div class="mallard-detail-stat-label">Bedrooms</div>' +
                    '</div>' +
                    '<div class="mallard-detail-stat">' +
                        '<div class="mallard-detail-stat-value">' + prop.bathrooms + '</div>' +
                        '<div class="mallard-detail-stat-label">Bathrooms</div>' +
                    '</div>' +
                    '<div class="mallard-detail-stat">' +
                        '<div class="mallard-detail-stat-value">' + prop.sqft.toLocaleString() + '</div>' +
                        '<div class="mallard-detail-stat-label">Sq Ft</div>' +
                    '</div>' +
                    '<div class="mallard-detail-stat">' +
                        '<div class="mallard-detail-stat-value">' + prop.yearBuilt + '</div>' +
                        '<div class="mallard-detail-stat-label">Year Built</div>' +
                    '</div>' +
                    '<div class="mallard-detail-stat">' +
                        '<div class="mallard-detail-stat-value">' + prop.type + '</div>' +
                        '<div class="mallard-detail-stat-label">Type</div>' +
                    '</div>' +
                '</div>' +

                '<div class="mallard-detail-agent">' +
                    '<div class="mallard-detail-agent-icon">' + agentInitial + '</div>' +
                    '<div class="mallard-detail-agent-info">' +
                        '<div class="mallard-detail-agent-name">' + prop.agent + '</div>' +
                        'Your Mallard Realty Agent' +
                    '</div>' +
                '</div>' +

                '<div class="mallard-detail-section">' +
                    '<div class="mallard-detail-section-title">About This Property</div>' +
                    '<div class="mallard-detail-description">' + prop.description + '</div>' +
                '</div>' +

                '<div class="mallard-detail-section">' +
                    '<div class="mallard-detail-section-title">Features</div>' +
                    '<ul class="mallard-detail-features">' + featuresHtml + '</ul>' +
                '</div>' +

                '<div class="mallard-detail-section">' +
                    '<div class="mallard-detail-section-title">Agent\'s Note</div>' +
                    '<div class="mallard-detail-quirk">' + mdi('feather') + ' ' + prop.quirks + '</div>' +
                '</div>' +

                '<div class="mallard-detail-actions">' + actionsHtml + '</div>' +
                rentInfoHtml +
                mortgageNote +
            '</div>';

        el('detailContent').innerHTML = html;
        el('detailOverlay').classList.remove('hidden');
    }

    function closeDetail() {
        el('detailOverlay').classList.add('hidden');
        currentDetailId = null;
    }

    // ---- Neighborhoods Tab ----

    function renderNeighborhoods() {
        var container = el('neighborhoodsList');
        if (!container) return;

        var keys = Object.keys(NEIGHBORHOODS);
        var html = '';

        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var nh = NEIGHBORHOODS[key];

            var props = MALLARD_PROPERTIES.filter(function(p) { return p.neighborhood === key; });
            var minPrice = Infinity, maxPrice = 0;
            for (var j = 0; j < props.length; j++) {
                if (props[j].price < minPrice) minPrice = props[j].price;
                if (props[j].price > maxPrice) maxPrice = props[j].price;
            }

            html +=
                '<div class="mallard-neighborhood-card">' +
                    '<div class="mallard-neighborhood-icon ' + nh.iconClass + '">' + mdi(nh.mdiIcon) + '</div>' +
                    '<div class="mallard-neighborhood-body">' +
                        '<div class="mallard-neighborhood-name">' + nh.name + '</div>' +
                        '<div class="mallard-neighborhood-desc">' + nh.desc + '</div>' +
                        '<div class="mallard-neighborhood-stats">' +
                            '<span>' + mdi('home') + ' ' + props.length + ' listings</span>' +
                            '<span>' + mdi('cash-multiple') + ' ' + snakesShort(minPrice) + ' \u2013 ' + snakesShort(maxPrice) + '</span>' +
                            '<span>' + mdi('tag') + ' ' + nh.vibe + '</span>' +
                        '</div>' +
                        '<span class="mallard-neighborhood-browse" data-action="browse-neighborhood" data-nh="' + key + '">Browse ' + nh.name + ' listings ' + mdi('arrow-right') + '</span>' +
                    '</div>' +
                '</div>';
        }

        container.innerHTML = html;
    }

    // ---- My Properties Tab ----

    function renderMyProperties() {
        var container = el('myPropertiesContent');
        if (!container) return;

        var owned = getOwnedPropertyIds();
        var keys = Object.keys(owned);

        if (keys.length === 0) {
            container.innerHTML =
                '<div class="mallard-my-properties-empty">' +
                    '<div class="mallard-my-empty-icon">' + mdi('home-outline') + '</div>' +
                    '<h3>No Properties Yet</h3>' +
                    '<p>You don\'t own or rent any properties. Browse our listings to find your perfect Snakesian nest!</p>' +
                    '<button class="mallard-my-properties-browse-btn" data-action="go-browse">' + mdi('magnify') + ' Browse Properties</button>' +
                '</div>';
            return;
        }

        var html = '<div class="mallard-my-prop-grid">';

        for (var i = 0; i < keys.length; i++) {
            var propId = parseInt(keys[i]);
            var info = owned[keys[i]];

            var listing = MALLARD_PROPERTIES.find(function(p) { return p.id === propId; });
            if (!listing) continue;

            var statusClass = info.ownership === 'rented' ? 'rented' : (isLoanActive(info.loanId) ? 'mortgaged' : 'owned');
            var statusLabel = info.ownership === 'rented' ? 'Renting' : (isLoanActive(info.loanId) ? 'Mortgaged' : 'Owned');

            var detailLines = '';
            if (info.ownership === 'rented') {
                var rent = Math.round(listing.price * listing.rentRate);
                detailLines += 'Monthly rent: ' + snakes(rent) + '<br>';
            } else {
                var pPrice = info.purchasePrice || listing.price;
                var curVal = calcCurrentValue(pPrice, listing.neighborhood, info.acquiredDate);
                var appPct = calcAppreciationPercent(pPrice, curVal);
                detailLines += 'Purchased: ' + snakes(pPrice) + '<br>';
                detailLines += 'Current value: <strong>' + snakes(curVal) + '</strong>';
                if (appPct !== 0) {
                    var appClass = appPct > 0 ? 'mallard-my-prop-app-pos' : 'mallard-my-prop-app-neg';
                    var appSign = appPct > 0 ? '+' : '';
                    detailLines += ' <span class="' + appClass + '">(' + appSign + appPct + '%)</span>';
                }
                detailLines += '<br>';
                if (info.monthlyTax) {
                    detailLines += 'Property tax: ' + snakes(info.monthlyTax) + '/mo<br>';
                }
            }
            if (info.acquiredDate) {
                detailLines += 'Since: ' + info.acquiredDate;
            }

            var btnHtml = '<button class="mallard-my-prop-btn" data-action="view-property" data-id="' + propId + '">' + mdi('eye') + ' View</button>';
            if (info.ownership === 'rented') {
                btnHtml += '<button class="mallard-my-prop-btn danger" data-action="move-out" data-id="' + propId + '">' + mdi('door-open') + ' Move Out</button>';
            } else {
                btnHtml += '<button class="mallard-my-prop-btn sell" data-action="sell" data-id="' + propId + '">' + mdi('tag') + ' Sell</button>';
            }

            html +=
                '<div class="mallard-my-prop-card">' +
                    '<div class="mallard-my-prop-image">' +
                        '<img src="' + listing.image + '" alt="' + listing.name + '">' +
                    '</div>' +
                    '<div class="mallard-my-prop-body">' +
                        '<div class="mallard-my-prop-name">' + listing.name + '</div>' +
                        '<span class="mallard-my-prop-status ' + statusClass + '">' + statusLabel + '</span>' +
                        '<div class="mallard-my-prop-details">' + detailLines + '</div>' +
                        '<div class="mallard-my-prop-actions">' + btnHtml + '</div>' +
                    '</div>' +
                '</div>';
        }

        html += '</div>';
        container.innerHTML = html;
    }

    // ---- Tab Navigation ----

    function switchTab(tab) {
        currentTab = tab;

        var tabs = qsa('.mallard-nav-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.toggle('active', tabs[i].getAttribute('data-tab') === tab);
        }

        var contents = qsa('.mallard-tab-content');
        for (var i = 0; i < contents.length; i++) {
            contents[i].classList.remove('active');
        }

        switch (tab) {
            case 'browse':
                el('browseTab').classList.add('active');
                renderMortgageBanner();
                renderGrid();
                break;
            case 'neighborhoods':
                el('neighborhoodsTab').classList.add('active');
                renderNeighborhoods();
                break;
            case 'my-properties':
                el('myPropertiesTab').classList.add('active');
                renderMyProperties();
                break;
        }
    }

    // ---- Toast ----

    function showToast(msg) {
        try {
            if (elxaOS && elxaOS.ui && elxaOS.ui.showToast) {
                elxaOS.ui.showToast(msg, 'info');
                return;
            }
        } catch (e) {}
        alert(msg);
    }

    // ---- Event Delegation ----

    function handleAction(action, target) {
        var propId;

        switch (action) {
            case 'view-property':
                propId = parseInt(target.closest('[data-id]').getAttribute('data-id'));
                showDetail(propId);
                break;

            case 'close-detail':
                closeDetail();
                break;

            case 'browse-neighborhood':
                var nh = target.getAttribute('data-nh');
                el('filterNeighborhood').value = nh;
                switchTab('browse');
                break;

            case 'go-browse':
                switchTab('browse');
                break;

            case 'rent':
                propId = parseInt(target.getAttribute('data-id'));
                handleRent(propId);
                break;

            case 'buy':
                propId = parseInt(target.getAttribute('data-id'));
                handleBuy(propId);
                break;

            case 'sell':
                propId = parseInt(target.closest('[data-id]').getAttribute('data-id'));
                handleSell(propId);
                break;

            case 'move-out':
                propId = parseInt(target.getAttribute('data-id'));
                handleMoveOut(propId);
                break;

            case 'dismiss-ceremony':
                hideCeremony();
                break;
        }
    }

    // ---- Init ----

    function init() {
        var root = document.querySelector('.mallard-root');
        if (!root) return;

        if (!el('confirmOverlay')) {
            var confirmDiv = document.createElement('div');
            confirmDiv.id = 'confirmOverlay';
            confirmDiv.className = 'mallard-confirm-overlay hidden';
            root.appendChild(confirmDiv);
        }

        if (!el('ceremonyOverlay')) {
            var ceremonyDiv = document.createElement('div');
            ceremonyDiv.id = 'ceremonyOverlay';
            ceremonyDiv.className = 'mallard-ceremony-overlay hidden';
            root.appendChild(ceremonyDiv);
        }

        root.addEventListener('click', function(e) {
            var target = e.target;

            while (target && target !== root) {
                var confirmAction = target.getAttribute('data-confirm-action');
                if (confirmAction) {
                    e.preventDefault();
                    handleConfirmAction(confirmAction);
                    return;
                }

                var action = target.getAttribute('data-action');
                if (action) {
                    e.preventDefault();
                    handleAction(action, target);
                    return;
                }

                var tab = target.getAttribute('data-tab');
                if (tab) {
                    e.preventDefault();
                    switchTab(tab);
                    return;
                }

                target = target.parentElement;
            }
        });

        var overlay = el('detailOverlay');
        if (overlay) {
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) closeDetail();
            });
        }

        var confirmOverlay = el('confirmOverlay');
        if (confirmOverlay) {
            confirmOverlay.addEventListener('click', function(e) {
                if (e.target === confirmOverlay) hideConfirmOverlay();
            });
        }

        var ceremonyOverlayEl = el('ceremonyOverlay');
        if (ceremonyOverlayEl) {
            ceremonyOverlayEl.addEventListener('click', function(e) {
                if (e.target === ceremonyOverlayEl) hideCeremony();
            });
        }

        var filterIds = ['filterNeighborhood', 'filterPrice', 'filterAvailability', 'filterSort'];
        for (var i = 0; i < filterIds.length; i++) {
            var select = el(filterIds[i]);
            if (select) {
                select.addEventListener('change', function() {
                    renderGrid();
                });
            }
        }

        renderMortgageBanner();
        renderGrid();
        renderNeighborhoods();
    }

    init();

    return {
        refresh: function() { renderGrid(); renderMortgageBanner(); renderMyProperties(); },
        showDetail: showDetail,
        getMortgageInfo: getMortgageInfo
    };

})();