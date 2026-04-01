// =================================
// PATO & SONS AUTO — Site Logic
// Browsing, filtering, detail views, tiers info, my vehicles
// =================================

var PatoAuto = (function() {
    'use strict';

    // ---- State ----
    var currentTab = 'browse';
    var currentDetailId = null;
    var pendingBuyTermMonths = 36;

    // ---- Icon Helper ----
    function mdi(name) {
        return '<span class="mdi mdi-' + name + '"></span>';
    }

    // ---- Currency Helpers ----
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

    // ---- Loan Math ----

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

    function getAutoLoanApr(score) {
        // Mirrors finance-loans.js _calculateLoanTerms for auto APR
        var auto = typeof LOAN_TYPES !== 'undefined' ? LOAN_TYPES.auto : null;
        if (!auto) return 12; // fallback
        var range = 850 - auto.requiredScore;
        var progress = range > 0 ? Math.min((score - auto.requiredScore) / range, 1) : 1;
        return Math.round((auto.baseApr - (auto.aprRange * progress)) * 100) / 100;
    }

    function termLabel(months) {
        var years = months / 12;
        if (years === Math.floor(years)) return years + '-Year';
        return months + '-Month';
    }

    // ---- Toast ----

    function showToast(html) {
        if (elxaOS && elxaOS.ui && elxaOS.ui.showToast) {
            elxaOS.ui.showToast(html);
            return;
        }
        // Fallback: quick inline toast
        var t = document.createElement('div');
        t.className = 'pato-toast';
        t.innerHTML = html;
        var root = document.querySelector('.pato-root');
        if (root) root.appendChild(t);
        setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 3500);
    }

    // ---- Confirmation Dialog ----

    function showConfirmOverlay(options) {
        var overlay = document.getElementById('confirmOverlay');
        if (!overlay) return;

        var title = options.title || 'Confirm';
        var body = options.body || '';
        var confirmText = options.confirmText || 'Confirm';
        var cancelText = options.cancelText || 'Cancel';
        var confirmClass = options.confirmClass || 'pato-confirm-btn-primary';

        overlay.innerHTML =
            '<div class="pato-confirm-dialog">' +
                '<div class="pato-confirm-title">' + title + '</div>' +
                '<div class="pato-confirm-body">' + body + '</div>' +
                '<div class="pato-confirm-actions">' +
                    '<button class="pato-confirm-btn pato-confirm-btn-cancel" data-confirm-action="cancel">' + cancelText + '</button>' +
                    '<button class="pato-confirm-btn ' + confirmClass + '" data-confirm-action="confirm">' + confirmText + '</button>' +
                '</div>' +
            '</div>';

        overlay._onConfirm = options.onConfirm || function() {};
        overlay._onCancel = options.onCancel || function() {};

        overlay.classList.remove('hidden');
    }

    function hideConfirmOverlay() {
        var overlay = document.getElementById('confirmOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay._onConfirm = null;
            overlay._onCancel = null;
        }
    }

    // ---- Ownership Helpers ----

    function getOwnedVehicles() {
        if (!elxaOS || !elxaOS.inventoryService) return [];
        var inv = elxaOS.inventoryService;
        try {
            return inv.getVehicles() || [];
        } catch(e) {
            console.error('Pato: getVehicles error:', e);
            return [];
        }
    }

    function getVehicleOwnership(vehicleId) {
        var owned = getOwnedVehicles();
        for (var i = 0; i < owned.length; i++) {
            if (owned[i].id === vehicleId || owned[i].id === String(vehicleId)) {
                return owned[i];
            }
        }
        return null;
    }

    function getFinanceInfo() {
        var info = { score: 0, maxLoan: 0, tierLabel: '', checking: 0 };
        if (!elxaOS || !elxaOS.financeService) return info;
        var fs = elxaOS.financeService;
        try {
            var scoreData = fs.getCreditScoreSync ? fs.getCreditScoreSync() : null;
            info.score = scoreData && typeof scoreData === 'object' ? scoreData.score : (scoreData || 0);
            var balances = fs.getAccountBalancesSync ? fs.getAccountBalancesSync() : {};
            info.checking = balances.checking || 0;
            if (fs.getAutoLoanMaxForScore) {
                var loanInfo = fs.getAutoLoanMaxForScore(info.score);
                if (loanInfo) {
                    info.maxLoan = loanInfo.maxAmount || 0;
                    info.tierLabel = loanInfo.label || '';
                }
            }
        } catch(e) { /* silent */ }
        return info;
    }

    function getVehicleById(id) {
        if (!window.PATO_VEHICLES) return null;
        for (var i = 0; i < PATO_VEHICLES.length; i++) {
            if (PATO_VEHICLES[i].id === id) return PATO_VEHICLES[i];
        }
        return null;
    }

    // ---- Filter & Sort ----

    function getFilteredVehicles() {
        if (!window.PATO_VEHICLES) return [];
        var vehicles = PATO_VEHICLES.slice();

        var tierFilter = document.getElementById('filterTier');
        var priceFilter = document.getElementById('filterPrice');
        var typeFilter = document.getElementById('filterType');
        var sortFilter = document.getElementById('filterSort');

        var tier = tierFilter ? tierFilter.value : 'all';
        var price = priceFilter ? priceFilter.value : 'all';
        var type = typeFilter ? typeFilter.value : 'all';
        var sort = sortFilter ? sortFilter.value : 'price-asc';

        // Filter by tier
        if (tier !== 'all') {
            vehicles = vehicles.filter(function(v) { return v.tier === tier; });
        }

        // Filter by price range
        if (price !== 'all') {
            var parts = price.split('-');
            var min = parseInt(parts[0], 10);
            var max = parseInt(parts[1], 10);
            vehicles = vehicles.filter(function(v) { return v.price >= min && v.price <= max; });
        }

        // Filter by type
        if (type !== 'all') {
            vehicles = vehicles.filter(function(v) { return v.type === type; });
        }

        // Sort
        switch(sort) {
            case 'price-asc':
                vehicles.sort(function(a, b) { return a.price - b.price; });
                break;
            case 'price-desc':
                vehicles.sort(function(a, b) { return b.price - a.price; });
                break;
            case 'year-desc':
                vehicles.sort(function(a, b) { return b.year - a.year; });
                break;
            case 'name-asc':
                vehicles.sort(function(a, b) { return a.name.localeCompare(b.name); });
                break;
        }

        return vehicles;
    }

    // ---- Render: Loan Qualification Banner ----

    function renderLoanBanner() {
        var el = document.getElementById('loanBanner');
        if (!el) return;
        var info = getFinanceInfo();
        if (info.score <= 0) {
            el.innerHTML = '';
            return;
        }
        var maxDisplay = info.maxLoan > 0 ? snakesShort(info.maxLoan) : 'Not qualified';
        el.innerHTML = mdi('car-key') +
            '<span>Your credit score: <strong>' + info.score + '</strong> &mdash; ' +
            'Auto loan tier: <strong>' + (info.tierLabel || 'None') + '</strong> &mdash; ' +
            'Max financing: <strong>' + maxDisplay + '</strong></span>';
    }

    // ---- Render: Vehicle Card ----

    function renderVehicleCard(vehicle) {
        var ownership = getVehicleOwnership(vehicle.id);
        var statusBadge = '';
        if (ownership) {
            var otype = ownership.ownership || 'owned';
            var label = otype.charAt(0).toUpperCase() + otype.slice(1);
            statusBadge = '<span class="pato-badge pato-badge-' + otype + '">' + label + '</span>';
        }

        var badges = '<span class="pato-badge pato-badge-' + vehicle.tier + '">' + vehicle.tierName + '</span>';
        if (!ownership && vehicle.leasable) badges += '<span class="pato-badge pato-badge-lease">Lease</span>';
        if (!ownership && vehicle.buyable) badges += '<span class="pato-badge pato-badge-buy">Buy</span>';
        if (statusBadge) badges += statusBadge;

        return '<div class="pato-card" data-action="view-detail" data-vehicle-id="' + vehicle.id + '">' +
            '<img class="pato-card-image" src="' + vehicle.image + '" alt="' + vehicle.name + '">' +
            '<div class="pato-card-body">' +
                '<div class="pato-card-name">' + vehicle.name + '</div>' +
                '<div class="pato-card-meta">' +
                    '<span>' + vehicle.year + '</span>' +
                    '<span>' + vehicle.type + '</span>' +
                    '<span>' + vehicle.mileage.toLocaleString() + ' mi</span>' +
                '</div>' +
                '<div class="pato-card-price">' + snakes(vehicle.price) + '</div>' +
                '<div class="pato-card-badges">' + badges + '</div>' +
            '</div>' +
        '</div>';
    }

    // ---- Render: Vehicle Grid ----

    function renderGrid() {
        var grid = document.getElementById('vehicleGrid');
        var countEl = document.getElementById('resultsCount');
        if (!grid) return;

        var vehicles = getFilteredVehicles();
        if (vehicles.length === 0) {
            grid.innerHTML = '<div class="pato-no-results">' + mdi('car-off') + ' No vehicles match your filters. Try adjusting your search.</div>';
            if (countEl) countEl.textContent = '0 vehicles found';
            return;
        }

        var html = '';
        for (var i = 0; i < vehicles.length; i++) {
            html += renderVehicleCard(vehicles[i]);
        }
        grid.innerHTML = html;
        if (countEl) countEl.textContent = vehicles.length + ' vehicle' + (vehicles.length !== 1 ? 's' : '') + ' found';
    }

    // ---- Render: Detail View ----

    function renderDetail(vehicleId) {
        var vehicle = getVehicleById(vehicleId);
        if (!vehicle) return;
        currentDetailId = vehicleId;

        var ownership = getVehicleOwnership(vehicleId);
        var info = getFinanceInfo();

        // Specs grid
        var specs = '<div class="pato-specs-grid">' +
            '<div class="pato-spec"><div class="pato-spec-label">Year</div><div class="pato-spec-value">' + vehicle.year + '</div></div>' +
            '<div class="pato-spec"><div class="pato-spec-label">Type</div><div class="pato-spec-value">' + vehicle.type + '</div></div>' +
            '<div class="pato-spec"><div class="pato-spec-label">Mileage</div><div class="pato-spec-value">' + vehicle.mileage.toLocaleString() + ' mi</div></div>' +
            '<div class="pato-spec"><div class="pato-spec-label">Color</div><div class="pato-spec-value">' + vehicle.color + '</div></div>' +
            '<div class="pato-spec"><div class="pato-spec-label">Engine</div><div class="pato-spec-value">' + vehicle.engine + '</div></div>' +
            '<div class="pato-spec"><div class="pato-spec-label">Insurance</div><div class="pato-spec-value">' + (vehicle.insuranceRate * 100).toFixed(1) + '%/mo</div></div>' +
        '</div>';

        // Features
        var featuresHtml = '<ul class="pato-features-list">';
        for (var i = 0; i < vehicle.features.length; i++) {
            featuresHtml += '<li>' + mdi('check-circle-outline') + ' ' + vehicle.features[i] + '</li>';
        }
        featuresHtml += '</ul>';

        // Lease info
        var leaseInfo = '';
        if (vehicle.leasable && !ownership) {
            var monthlyLease = Math.round(vehicle.price * vehicle.leaseRate);
            leaseInfo = '<div class="pato-spec"><div class="pato-spec-label">Monthly Lease</div><div class="pato-spec-value">' + snakes(monthlyLease) + '</div></div>';
        }

        // Down payment info
        var downInfo = '';
        if (vehicle.buyable && !ownership) {
            var downPayment = Math.round(vehicle.price * 0.10);
            downInfo = '<div class="pato-spec"><div class="pato-spec-label">Down Payment (10%)</div><div class="pato-spec-value">' + snakes(downPayment) + '</div></div>';
        }

        // Pricing extras row
        var pricingExtras = '';
        if (leaseInfo || downInfo) {
            pricingExtras = '<div class="pato-specs-grid" style="margin-top:8px;">' + leaseInfo + downInfo + '</div>';
        }

        // Action buttons
        var actions = '';
        if (!ownership) {
            var leaseBtn = '';
            var buyBtn = '';
            if (vehicle.leasable) {
                leaseBtn = '<button class="pato-btn pato-btn-lease" data-action="lease" data-vehicle-id="' + vehicle.id + '">' + mdi('key-variant') + ' Lease</button>';
            }
            if (vehicle.buyable) {
                buyBtn = '<button class="pato-btn pato-btn-buy" data-action="buy" data-vehicle-id="' + vehicle.id + '">' + mdi('car-key') + ' Buy</button>';
            }
            actions = '<div class="pato-actions">' + leaseBtn + buyBtn + '</div>';
        } else {
            var otype = ownership.ownership || 'owned';
            var label = otype.charAt(0).toUpperCase() + otype.slice(1);
            var ownerActions = '';
            if (otype === 'leased') {
                ownerActions = '<button class="pato-btn pato-btn-return" data-action="return-vehicle" data-vehicle-id="' + vehicle.id + '">' + mdi('car-back') + ' Return Vehicle</button>';
            } else {
                ownerActions = '<button class="pato-btn pato-btn-sell" data-action="sell-vehicle" data-vehicle-id="' + vehicle.id + '">' + mdi('cash-multiple') + ' Sell Vehicle</button>';
            }
            actions = '<div class="pato-actions"><span class="pato-badge pato-badge-' + otype + '" style="font-size:14px;padding:8px 16px;">' + mdi('check-circle') + ' ' + label + '</span>' + ownerActions + '</div>';
        }

        // Assemble detail HTML
        var html = '<img class="pato-detail-image" src="' + vehicle.image + '" alt="' + vehicle.name + '">' +
            '<div class="pato-detail-body">' +
                '<div class="pato-detail-title">' + vehicle.name + '</div>' +
                '<div class="pato-detail-subtitle">' + vehicle.year + ' ' + vehicle.type + ' &bull; ' + vehicle.mileage.toLocaleString() + ' miles &bull; ' + vehicle.color + '</div>' +
                '<div class="pato-detail-price">' + snakes(vehicle.price) + '</div>' +

                '<div class="pato-detail-section">' +
                    '<h3>' + mdi('clipboard-list-outline') + ' Specifications</h3>' +
                    specs +
                    pricingExtras +
                '</div>' +

                '<div class="pato-detail-section">' +
                    '<h3>' + mdi('star-outline') + ' Features</h3>' +
                    featuresHtml +
                '</div>' +

                '<div class="pato-detail-section">' +
                    '<h3>' + mdi('text-box-outline') + ' Description</h3>' +
                    '<p>' + vehicle.description + '</p>' +
                '</div>' +

                '<div class="pato-detail-section">' +
                    '<h3>' + mdi('alert-circle-outline') + ' Quirks</h3>' +
                    '<p>' + vehicle.quirks + '</p>' +
                '</div>' +

                '<div class="pato-salesperson-quote">' +
                    '"A deal\'s a deal, kid."' +
                    '<span class="pato-salesperson-name">' + mdi('account') + ' ' + vehicle.salesperson + '</span>' +
                '</div>' +

                actions +
            '</div>';

        var detailContent = document.getElementById('detailContent');
        var detailOverlay = document.getElementById('detailOverlay');
        if (detailContent) detailContent.innerHTML = html;
        if (detailOverlay) detailOverlay.classList.remove('hidden');
    }

    // ---- Render: Tiers Tab ----

    function renderTiers() {
        var container = document.getElementById('tiersList');
        if (!container) return;
        var info = getFinanceInfo();

        var tiers = [
            { key: 'beaters', name: 'Beaters & Budget', icon: 'car-wrench', color: '#8b7355',
              price: '3,000–10,000 \u00A7', lease: 'Yes (3.0%/mo)', buy: 'Yes',
              minScore: 580, desc: 'Honest rides with character. Perfect first car territory. Low cost, high stories.',
              salesperson: 'Pato Sr.', salespersonIcon: 'account-tie',
              review: '"Look, I\'m not gonna sugarcoat it. These cars have seen things. But they run — usually — and they\'ll get you from A to B. Probably." — Pato Sr.',
              insurance: '2.0%/mo', depreciation: '0.5%/mo (barely loses value — already at rock bottom)' },
            { key: 'reliable', name: 'Reliable Rides', icon: 'car-side', color: '#5b8a5e',
              price: '12,000–30,000 \u00A7', lease: 'Yes (2.0%/mo)', buy: 'Yes',
              minScore: 630, desc: 'Dependable daily drivers. Nothing flashy, everything functional. Pato Jr. approved.',
              salesperson: 'Pato Jr.', salespersonIcon: 'account-star',
              review: '"This is the sweet spot! Great value, dependable, and you won\'t be embarrassed in the parking lot. These are the cars I\'d recommend to my own friends. Well, the friends I like." — Pato Jr.',
              insurance: '1.5%/mo', depreciation: '1.0%/mo' },
            { key: 'midrange', name: 'Mid-Range', icon: 'car-sports', color: '#4a7fb5',
              price: '32,000–70,000 \u00A7', lease: 'Yes (1.5%/mo)', buy: 'Yes',
              minScore: 670, desc: 'Modern comfort meets smart features. The responsible adult tier.',
              salesperson: 'Pato Jr. & Sal', salespersonIcon: 'account-group',
              review: '"Now we\'re talking. Heated seats, good sound systems, the kind of car that makes you feel like you\'ve got your life together. Even if you don\'t." — Pato Jr.',
              insurance: '1.2%/mo', depreciation: '1.5%/mo' },
            { key: 'premium', name: 'Premium', icon: 'car-convertible', color: '#7b5ea7',
              price: '80,000–160,000 \u00A7', lease: 'No', buy: 'Yes (buy only)',
              minScore: 720, desc: 'Head-turners and luxury rides. No leasing \u2014 you want it, you earn it.',
              salesperson: 'Pato Sr.', salespersonIcon: 'account-tie',
              review: '"We don\'t lease the good stuff, kid. You want one of these, you put the work in. When you drive off this lot in a Premium, you\'ve earned every inch of that smile." — Pato Sr.',
              insurance: '1.0%/mo', depreciation: '2.0%/mo (luxury drops fast)' },
            { key: 'elite', name: 'Showroom Elite', icon: 'trophy', color: '#c78c20',
              price: '200,000–600,000 \u00A7', lease: 'No', buy: 'Yes (buy only)',
              minScore: 760, desc: 'Dream machines. The kind of ride that makes other snakes stare.',
              salesperson: 'Pato Sr.', salespersonIcon: 'account-tie',
              review: '"You sure you\'re ready for this? I\'m serious. These aren\'t cars — they\'re statements. I\'ve had these babies in the showroom for years. I only let \'em go to someone who appreciates what they are." — Pato Sr.',
              insurance: '0.8%/mo', depreciation: '2.5%/mo (dream cars, nightmare depreciation)' }
        ];

        // Salesperson bios section
        var html = '<div class="pato-staff-section">' +
            '<h3>' + mdi('account-group') + ' Meet the Team</h3>' +
            '<div class="pato-staff-grid">' +
                '<div class="pato-staff-card">' +
                    '<div class="pato-staff-name">' + mdi('account-tie') + ' Pato Sr.</div>' +
                    '<div class="pato-staff-role">Founder — 40 years in the business</div>' +
                    '<div class="pato-staff-bio">Handles the extremes: the beaters nobody else wants to sell, and the elite rides nobody else is worthy of selling. Brutally honest about the cheap stuff, weirdly reverent about the expensive stuff.</div>' +
                    '<div class="pato-staff-catchphrase">"A deal\'s a deal, kid."</div>' +
                '</div>' +
                '<div class="pato-staff-card">' +
                    '<div class="pato-staff-name">' + mdi('account-star') + ' Pato Jr.</div>' +
                    '<div class="pato-staff-role">Sales Manager — knows every spec on the lot</div>' +
                    '<div class="pato-staff-bio">Handles the middle tiers: Reliable Rides and Mid-Range. Genuinely excited about every car he sells. Tries to upsell but in an endearing way that makes you want to let him.</div>' +
                    '<div class="pato-staff-catchphrase">"You\'re gonna LOVE this one!"</div>' +
                '</div>' +
                '<div class="pato-staff-card">' +
                    '<div class="pato-staff-name">' + mdi('account-question') + ' Sal</div>' +
                    '<div class="pato-staff-role">The Wildcard Cousin — somehow works here</div>' +
                    '<div class="pato-staff-bio">Handles random vehicles across all tiers. Nobody\'s quite sure how he got hired, but he moves inventory. Gives oddly specific facts and completely unrelated backstories for every single car.</div>' +
                    '<div class="pato-staff-catchphrase">"Fun fact: the previous owner of this model was a retired acrobat. Anyway, you\'re all set."</div>' +
                '</div>' +
            '</div>' +
        '</div>';

        // Tier cards
        html += '<h3 style="margin-top:20px;">' + mdi('format-list-bulleted-type') + ' Vehicle Tiers</h3>';

        for (var i = 0; i < tiers.length; i++) {
            var t = tiers[i];
            var qualified = info.score >= t.minScore;
            var scoreTag = qualified
                ? '<span class="pato-tier-score" style="background:#e8f5e9;color:#2e7d32;">' + mdi('check-circle') + ' Qualified (min ' + t.minScore + ')</span>'
                : '<span class="pato-tier-score">' + mdi('lock-outline') + ' Requires score ' + t.minScore + '+</span>';

            html += '<div class="pato-tier-card">' +
                '<h3><span class="mdi mdi-' + t.icon + '" style="color:' + t.color + ';font-size:22px;"></span> ' + t.name + ' ' + scoreTag + '</h3>' +
                '<div class="pato-tier-details">' +
                    '<strong>Price range:</strong> ' + t.price + '<br>' +
                    '<strong>Lease:</strong> ' + t.lease + '<br>' +
                    '<strong>Buy:</strong> ' + t.buy + '<br>' +
                    '<strong>Insurance:</strong> ' + t.insurance + '<br>' +
                    '<strong>Depreciation:</strong> ' + t.depreciation + '<br>' +
                    '<strong>Salesperson:</strong> ' + mdi(t.salespersonIcon) + ' ' + t.salesperson + '<br>' +
                    '<div class="pato-tier-review">' + t.review + '</div>' +
                '</div>' +
            '</div>';
        }
        container.innerHTML = html;
    }

    // ---- Render: My Vehicles Tab ----

    function renderMyVehicles() {
        var container = document.getElementById('myVehiclesContent');
        if (!container) return;

        var owned = getOwnedVehicles();
        if (owned.length === 0) {
            container.innerHTML = '<div class="pato-my-vehicles-empty">' +
                '<span class="mdi mdi-car-off"></span>' +
                'You don\'t own any vehicles yet.<br>Browse our lot and find your perfect ride!' +
            '</div>';
            return;
        }

        var html = '';
        for (var i = 0; i < owned.length; i++) {
            var item = owned[i];
            var vehicle = getVehicleById(parseInt(item.id, 10) || item.id);
            if (!vehicle) continue;

            var otype = item.ownership || 'owned';
            var label = otype.charAt(0).toUpperCase() + otype.slice(1);

            // Current value from inventory (depreciated) or fall back to purchase price
            var currentValue = item.currentValue || item.purchasePrice || vehicle.price;
            var purchasePrice = item.purchasePrice || vehicle.price;

            // Depreciation info (not for leased — lease costs are separate)
            var depreciationLine = '';
            if (otype !== 'leased') {
                var depPct = purchasePrice > 0 ? Math.round((1 - currentValue / purchasePrice) * 100) : 0;
                if (depPct > 0) {
                    depreciationLine = '<div class="pato-my-vehicle-depreciation">' +
                        mdi('trending-down') + ' Down ' + depPct + '% from purchase (' + snakes(purchasePrice) + ')' +
                    '</div>';
                } else {
                    depreciationLine = '<div class="pato-my-vehicle-depreciation neutral">' +
                        mdi('minus') + ' No change from purchase price' +
                    '</div>';
                }
            }

            // Action buttons
            var actionBtns = '';
            if (otype === 'leased') {
                actionBtns = '<button class="pato-btn pato-btn-return pato-btn-small" data-action="return-vehicle" data-vehicle-id="' + vehicle.id + '">' + mdi('car-back') + ' Return</button>';
            } else {
                actionBtns = '<button class="pato-btn pato-btn-sell pato-btn-small" data-action="sell-vehicle" data-vehicle-id="' + vehicle.id + '">' + mdi('cash-multiple') + ' Sell</button>';
            }

            // Value display — show current value for owned/financed, lease rate for leased
            var valueDisplay = '';
            if (otype === 'leased') {
                var monthlyLease = Math.round(vehicle.price * vehicle.leaseRate);
                valueDisplay = '<div class="pato-my-vehicle-value">' + snakes(monthlyLease) + '/mo</div>';
            } else {
                valueDisplay = '<div class="pato-my-vehicle-value">' + snakes(currentValue) + '</div>' +
                    '<div class="pato-my-vehicle-value-label">Current Value</div>';
            }

            html += '<div class="pato-my-vehicle-card" data-action="view-detail" data-vehicle-id="' + vehicle.id + '">' +
                '<img class="pato-my-vehicle-image" src="' + vehicle.image + '" alt="' + vehicle.name + '">' +
                '<div class="pato-my-vehicle-info">' +
                    '<div class="pato-my-vehicle-name">' + vehicle.name + '</div>' +
                    '<div class="pato-my-vehicle-meta">' + vehicle.year + ' ' + vehicle.type + ' &bull; ' +
                        '<span class="pato-badge pato-badge-' + otype + '">' + label + '</span></div>' +
                    valueDisplay +
                    depreciationLine +
                    '<div class="pato-my-vehicle-actions">' + actionBtns + '</div>' +
                '</div>' +
            '</div>';
        }
        container.innerHTML = html;
    }

    // =================================
    // LEASE CEREMONY OVERLAY
    // =================================

    function showKeysHandoverCeremony(vehicle) {
        var overlay = document.getElementById('ceremonyOverlay');
        if (!overlay) return;

        var monthlyLease = Math.round(vehicle.price * vehicle.leaseRate);

        overlay.innerHTML =
            '<div class="pato-ceremony-card pato-ceremony-lease">' +
                '<div class="pato-ceremony-sparkles">' +
                    '<span class="pato-sparkle s1"></span>' +
                    '<span class="pato-sparkle s2"></span>' +
                    '<span class="pato-sparkle s3"></span>' +
                    '<span class="pato-sparkle s4"></span>' +
                    '<span class="pato-sparkle s5"></span>' +
                    '<span class="pato-sparkle s6"></span>' +
                '</div>' +
                '<div class="pato-ceremony-icon-wrap lease">' +
                    '<span class="mdi mdi-key-variant"></span>' +
                '</div>' +
                '<div class="pato-ceremony-title">Keys Are Yours!</div>' +
                '<div class="pato-ceremony-subtitle">Time to hit the road</div>' +
                '<div class="pato-ceremony-vehicle">' +
                    '<img src="' + vehicle.image + '" alt="' + vehicle.name + '">' +
                    '<div class="pato-ceremony-vehicle-info">' +
                        '<div class="pato-ceremony-vehicle-name">' + vehicle.name + '</div>' +
                        '<div class="pato-ceremony-vehicle-meta">' + vehicle.year + ' ' + vehicle.type + '</div>' +
                        '<div class="pato-ceremony-vehicle-lease">' + snakes(monthlyLease) + '/mo</div>' +
                    '</div>' +
                '</div>' +
                '<div class="pato-ceremony-message">' +
                    '<span class="mdi mdi-message-text-outline"></span>' +
                    '<div>' +
                        '<strong>' + vehicle.salesperson + '</strong> says:' +
                        '<div class="pato-ceremony-quote">"' + getSalespersonLeaseQuote(vehicle) + '"</div>' +
                    '</div>' +
                '</div>' +
                '<button class="pato-ceremony-btn lease" data-action="dismiss-ceremony">' +
                    mdi('car') + ' Hit the Road' +
                '</button>' +
            '</div>';

        overlay.classList.remove('hidden');
    }

    function showReturnFarewell(vehicle, acquiredDate) {
        var overlay = document.getElementById('ceremonyOverlay');
        if (!overlay) return;

        var timeNote = '';
        if (acquiredDate) {
            timeNote = '<div class="pato-ceremony-time-spent">' +
                mdi('calendar-clock') + ' You\'ve been driving this since ' + acquiredDate +
            '</div>';
        }

        overlay.innerHTML =
            '<div class="pato-ceremony-card pato-ceremony-return">' +
                '<div class="pato-ceremony-icon-wrap return">' +
                    '<span class="mdi mdi-car-back"></span>' +
                '</div>' +
                '<div class="pato-ceremony-title return">Thanks for Leasing!</div>' +
                '<div class="pato-ceremony-subtitle return">Keys returned</div>' +
                '<div class="pato-ceremony-vehicle farewell">' +
                    '<img src="' + vehicle.image + '" alt="' + vehicle.name + '">' +
                    '<div class="pato-ceremony-vehicle-info">' +
                        '<div class="pato-ceremony-vehicle-name">' + vehicle.name + '</div>' +
                        '<div class="pato-ceremony-vehicle-meta">' + vehicle.year + ' ' + vehicle.type + '</div>' +
                    '</div>' +
                '</div>' +
                timeNote +
                '<div class="pato-ceremony-message farewell">' +
                    '<span class="mdi mdi-hand-wave-outline"></span>' +
                    '<div>' +
                        'Your lease has been cancelled and the keys are back with us. ' +
                        'This ride is back on the lot. Come see us when you\'re ready for your next set of wheels!' +
                    '</div>' +
                '</div>' +
                '<button class="pato-ceremony-btn return" data-action="dismiss-ceremony">' +
                    mdi('magnify') + ' Browse Vehicles' +
                '</button>' +
            '</div>';

        overlay.classList.remove('hidden');
    }

    function getSalespersonLeaseQuote(vehicle) {
        if (vehicle.salesperson === 'Pato Sr.') {
            return "A deal's a deal, kid. Take care of her and she'll take care of you. Lease payment comes out every month — don't miss it.";
        } else if (vehicle.salesperson === 'Pato Jr.') {
            return "You're gonna LOVE this one! Seriously, great pick. Your lease payment is all set up — just enjoy the ride!";
        } else {
            return "Fun fact: the previous driver of this model was a competitive snake charmer. Anyway, you're all set. Drive safe out there!";
        }
    }

    // =================================
    // LEASE FLOW (Phase 4)
    // =================================

    function handleLease(vehicleId) {
        var vehicle = getVehicleById(vehicleId);
        if (!vehicle) return;

        var ownership = getVehicleOwnership(vehicleId);
        if (ownership) {
            showToast(mdi('alert') + ' You already have this vehicle!');
            return;
        }

        if (!vehicle.leasable) {
            showToast(mdi('alert') + ' This vehicle is not available for lease.');
            return;
        }

        var monthlyLease = Math.round(vehicle.price * vehicle.leaseRate);

        var balance = 0;
        try {
            var balances = elxaOS.financeService.getAccountBalancesSync();
            balance = balances.checking;
        } catch (e) {
            showToast(mdi('close-circle') + ' Could not read your checking balance.');
            return;
        }

        if (balance < monthlyLease) {
            showToast(mdi('close-circle') + ' Insufficient funds! You need at least ' + snakes(monthlyLease) + ' in checking to cover the first month.');
            return;
        }

        var bodyHtml =
            '<div class="pato-confirm-vehicle">' +
                '<img src="' + vehicle.image + '" alt="' + vehicle.name + '">' +
                '<div class="pato-confirm-vehicle-info">' +
                    '<div class="pato-confirm-vehicle-name">' + vehicle.name + '</div>' +
                    '<div class="pato-confirm-vehicle-meta">' + vehicle.year + ' ' + vehicle.type + '</div>' +
                '</div>' +
            '</div>' +
            '<div class="pato-confirm-details">' +
                '<div class="pato-confirm-row">' +
                    '<span>Monthly Lease</span>' +
                    '<strong>' + snakes(monthlyLease) + '</strong>' +
                '</div>' +
                '<div class="pato-confirm-row">' +
                    '<span>Payment Source</span>' +
                    '<strong>Checking Account</strong>' +
                '</div>' +
                '<div class="pato-confirm-row">' +
                    '<span>Your Balance</span>' +
                    '<strong>' + snakes(balance) + '</strong>' +
                '</div>' +
                '<div class="pato-confirm-row pato-confirm-row-after">' +
                    '<span>Balance After</span>' +
                    '<strong>' + snakes(balance - monthlyLease) + '</strong>' +
                '</div>' +
            '</div>' +
            '<div class="pato-confirm-note">' +
                mdi('file-document-outline') + ' Lease payment is deducted automatically from checking each month. ' +
                'Three missed payments may result in repossession.' +
            '</div>';

        showConfirmOverlay({
            title: mdi('file-document-edit-outline') + ' Sign Lease Agreement',
            body: bodyHtml,
            confirmText: mdi('key-variant') + ' Sign Lease',
            cancelText: 'Cancel',
            confirmClass: 'pato-confirm-btn-lease',
            onConfirm: function() { confirmLease(vehicleId); }
        });
    }

    async function confirmLease(vehicleId) {
        var vehicle = getVehicleById(vehicleId);
        if (!vehicle) return;

        var monthlyLease = Math.round(vehicle.price * vehicle.leaseRate);

        try {
            var fs = elxaOS.financeService;
            var inv = elxaOS.inventoryService;

            // Create recurring lease payment
            var leaseResult = fs.addRecurringPayment({
                description: 'Lease \u2014 ' + vehicle.name,
                amount: monthlyLease,
                type: 'lease',
                sourceAccount: 'checking',
                linkedId: 'pato-' + vehicleId
            });

            if (!leaseResult || !leaseResult.success) {
                showToast(mdi('close-circle') + ' Failed to set up lease payment. Try again.');
                return;
            }

            var leasePaymentId = leaseResult.payment.id;

            // Withdraw first month
            var withdrawResult = await fs.withdraw('checking', monthlyLease, 'Lease \u2014 ' + vehicle.name + ' (first month)');
            if (!withdrawResult || !withdrawResult.success) {
                fs.cancelRecurringPayment(leasePaymentId);
                showToast(mdi('close-circle') + ' Insufficient funds for first month\'s lease.');
                return;
            }

            // Acquire vehicle
            await inv.acquireVehicle({
                id: String(vehicle.id),
                name: vehicle.name,
                type: vehicle.type,
                purchasePrice: vehicle.price,
                currentValue: vehicle.price,
                color: vehicle.color,
                mileage: vehicle.mileage,
                image: vehicle.image,
                tier: vehicle.tier,
                insuranceRate: vehicle.insuranceRate,
                depreciationRate: vehicle.depreciationRate
            }, 'leased', {
                leasePaymentId: leasePaymentId
            });

            hideConfirmOverlay();
            closeDetail();
            showKeysHandoverCeremony(vehicle);

            if (elxaOS.notificationService) {
                elxaOS.notificationService.addNotification({
                    title: 'New Lease!',
                    body: 'You are now leasing a ' + vehicle.name + ' for ' + snakes(monthlyLease) + '/month.',
                    icon: 'mdi-car',
                    category: 'finance',
                    urgency: 'info',
                    toast: false
                });
            }

            // Refresh current view
            if (currentTab === 'browse') {
                renderLoanBanner();
                renderGrid();
            } else if (currentTab === 'my-vehicles') {
                renderMyVehicles();
            }

        } catch (e) {
            console.error('Pato: Lease flow error:', e);
            showToast(mdi('close-circle') + ' Something went wrong. Please try again.');
        }
    }

    // =================================
    // RETURN VEHICLE FLOW (Phase 4)
    // =================================

    function handleReturnVehicle(vehicleId) {
        var vehicle = getVehicleById(parseInt(vehicleId, 10) || vehicleId);
        if (!vehicle) return;

        var ownership = getVehicleOwnership(vehicle.id);
        if (!ownership || ownership.ownership !== 'leased') {
            showToast(mdi('alert') + ' You\'re not leasing this vehicle.');
            return;
        }

        var monthlyLease = Math.round(vehicle.price * vehicle.leaseRate);

        var bodyHtml =
            '<div class="pato-confirm-vehicle">' +
                '<img src="' + vehicle.image + '" alt="' + vehicle.name + '">' +
                '<div class="pato-confirm-vehicle-info">' +
                    '<div class="pato-confirm-vehicle-name">' + vehicle.name + '</div>' +
                    '<div class="pato-confirm-vehicle-meta">' + vehicle.year + ' ' + vehicle.type + '</div>' +
                '</div>' +
            '</div>' +
            '<div class="pato-confirm-details">' +
                '<div class="pato-confirm-row">' +
                    '<span>Current Monthly Lease</span>' +
                    '<strong>' + snakes(monthlyLease) + '</strong>' +
                '</div>' +
                '<div class="pato-confirm-row">' +
                    '<span>Leasing Since</span>' +
                    '<strong>' + (ownership.acquiredDate || 'Unknown') + '</strong>' +
                '</div>' +
            '</div>' +
            '<div class="pato-confirm-note pato-confirm-note-warning">' +
                mdi('alert-outline') + ' Returning this vehicle will cancel your lease and stop monthly payments. ' +
                'The vehicle will go back on the lot.' +
            '</div>';

        showConfirmOverlay({
            title: mdi('car-back') + ' Return Vehicle?',
            body: bodyHtml,
            confirmText: mdi('key-variant') + ' Return Keys',
            cancelText: 'Keep Driving',
            confirmClass: 'pato-confirm-btn-danger',
            onConfirm: function() { confirmReturnVehicle(vehicleId); }
        });
    }

    async function confirmReturnVehicle(vehicleId) {
        var vehicle = getVehicleById(parseInt(vehicleId, 10) || vehicleId);
        var ownership = getVehicleOwnership(vehicle ? vehicle.id : vehicleId);
        if (!ownership) return;

        var acquiredDate = ownership.acquiredDate || null;

        try {
            var inv = elxaOS.inventoryService;

            // loseVehicle now auto-cancels linked lease payment
            await inv.loseVehicle(ownership.id, 'returned');

            hideConfirmOverlay();
            closeDetail();
            showReturnFarewell(vehicle, acquiredDate);

            if (elxaOS.notificationService) {
                elxaOS.notificationService.addNotification({
                    title: 'Vehicle Returned',
                    body: 'You have returned the ' + vehicle.name + '. Your lease has been cancelled.',
                    icon: 'mdi-car-off',
                    category: 'finance',
                    urgency: 'info',
                    toast: false
                });
            }

            if (currentTab === 'browse') {
                renderLoanBanner();
                renderGrid();
            } else if (currentTab === 'my-vehicles') {
                renderMyVehicles();
            }

        } catch (e) {
            console.error('Pato: Return vehicle error:', e);
            showToast(mdi('close-circle') + ' Something went wrong. Please try again.');
        }
    }

    // =================================
    // BUY FLOW (Phase 5)
    // =================================

    function handleBuy(vehicleId) {
        var vehicle = getVehicleById(vehicleId);
        if (!vehicle) return;

        // Already owned?
        var ownership = getVehicleOwnership(vehicleId);
        if (ownership) {
            showToast(mdi('alert') + ' You already have this vehicle!');
            return;
        }

        if (!vehicle.buyable) {
            showToast(mdi('alert') + ' This vehicle is not for sale.');
            return;
        }

        // Auto loan eligibility
        var info = getFinanceInfo();
        if (!info || info.score < 580) {
            showToast(mdi('close-circle') + ' Your credit score doesn\'t qualify for an auto loan yet. You need 580+ to apply.');
            return;
        }

        var downPayment = Math.round(vehicle.price * 0.10);
        var loanAmount = vehicle.price - downPayment;

        // Tier check — can they afford this vehicle?
        if (loanAmount > info.maxLoan) {
            showToast(mdi('close-circle') + ' This vehicle requires a ' + snakes(loanAmount) + ' auto loan, but your ' + info.tierLabel + ' tier covers up to ' + snakes(info.maxLoan) + '.');
            return;
        }

        // Check active auto loans (max 3)
        var existingAutoLoans = 0;
        try {
            var loans = elxaOS.financeService.getLoansSync();
            for (var i = 0; i < loans.length; i++) {
                if (loans[i].type === 'auto' && loans[i].status === 'active') existingAutoLoans++;
            }
        } catch (e) {}

        if (existingAutoLoans >= 3) {
            showToast(mdi('close-circle') + ' You already have 3 active auto loans. Pay one off before applying for another.');
            return;
        }

        // Check checking balance for down payment
        var balance = info.checking;
        if (balance < downPayment) {
            showToast(mdi('close-circle') + ' Insufficient funds! You need at least ' + snakes(downPayment) + ' in checking for the 10% down payment.');
            return;
        }

        // Get APR for this score
        var apr = getAutoLoanApr(info.score);

        // Show the buy overlay
        showBuyOverlay(vehicle, downPayment, loanAmount, apr, balance);
    }

    function showBuyOverlay(vehicle, downPayment, loanAmount, apr, balance) {
        var overlay = document.getElementById('confirmOverlay');
        if (!overlay) return;

        // Default term
        pendingBuyTermMonths = 36;
        var defaultMonthly = calcMonthlyPayment(loanAmount, apr, 36);
        var defaultInterest = calcTotalInterest(loanAmount, defaultMonthly, 36);

        var bodyHtml =
            '<div class="pato-confirm-vehicle">' +
                '<img src="' + vehicle.image + '" alt="' + vehicle.name + '">' +
                '<div class="pato-confirm-vehicle-info">' +
                    '<div class="pato-confirm-vehicle-name">' + vehicle.name + '</div>' +
                    '<div class="pato-confirm-vehicle-meta">' + vehicle.year + ' ' + vehicle.type + '</div>' +
                '</div>' +
            '</div>' +

            '<div class="pato-buy-section-label">' + mdi('bank') + ' Auto Loan Application</div>' +

            '<div class="pato-confirm-details">' +
                '<div class="pato-confirm-row">' +
                    '<span>Vehicle Price</span>' +
                    '<strong>' + snakes(vehicle.price) + '</strong>' +
                '</div>' +
                '<div class="pato-confirm-row">' +
                    '<span>Down Payment (10%)</span>' +
                    '<strong>' + snakes(downPayment) + '</strong>' +
                '</div>' +
                '<div class="pato-confirm-row">' +
                    '<span>Loan Amount</span>' +
                    '<strong>' + snakes(loanAmount) + '</strong>' +
                '</div>' +
                '<div class="pato-confirm-row">' +
                    '<span>Interest Rate (APR)</span>' +
                    '<strong>' + apr + '%</strong>' +
                '</div>' +
            '</div>' +

            // Term selector
            '<div class="pato-buy-term-section">' +
                '<label class="pato-buy-term-label">Loan Term</label>' +
                '<div class="pato-buy-term-options" id="buyTermOptions">' +
                    '<button class="pato-term-btn" data-term="12">1-Year</button>' +
                    '<button class="pato-term-btn" data-term="24">2-Year</button>' +
                    '<button class="pato-term-btn active" data-term="36">3-Year</button>' +
                    '<button class="pato-term-btn" data-term="48">4-Year</button>' +
                    '<button class="pato-term-btn" data-term="60">5-Year</button>' +
                '</div>' +
            '</div>' +

            // Dynamic payment display
            '<div class="pato-buy-payment-preview" id="buyPaymentPreview">' +
                '<div class="pato-buy-payment-main">' +
                    '<div class="pato-buy-payment-amount" id="buyMonthlyAmount">' + snakes(defaultMonthly) + '</div>' +
                    '<div class="pato-buy-payment-label">per month for <span id="buyTermLabel">3 years</span></div>' +
                '</div>' +
                '<div class="pato-buy-payment-details">' +
                    '<div class="pato-buy-payment-detail">' +
                        '<span>Total Interest</span>' +
                        '<strong id="buyTotalInterest">' + snakes(defaultInterest) + '</strong>' +
                    '</div>' +
                    '<div class="pato-buy-payment-detail">' +
                        '<span>Total Cost</span>' +
                        '<strong id="buyTotalCost">' + snakes(loanAmount + defaultInterest + downPayment) + '</strong>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            '<div class="pato-confirm-details" style="margin-top:8px">' +
                '<div class="pato-confirm-row">' +
                    '<span>Your Checking Balance</span>' +
                    '<strong>' + snakes(balance) + '</strong>' +
                '</div>' +
                '<div class="pato-confirm-row pato-confirm-row-after">' +
                    '<span>After Down Payment</span>' +
                    '<strong>' + snakes(balance - downPayment) + '</strong>' +
                '</div>' +
            '</div>' +

            '<div class="pato-confirm-note">' +
                mdi('information-outline') + ' Down payment is deducted immediately from checking. ' +
                'Loan payments are processed automatically each month. Three missed payments may result in repossession.' +
            '</div>';

        overlay.innerHTML =
            '<div class="pato-confirm-dialog pato-confirm-dialog-buy">' +
                '<div class="pato-confirm-title">' + mdi('car-key') + ' Purchase ' + vehicle.name + '</div>' +
                '<div class="pato-confirm-body">' + bodyHtml + '</div>' +
                '<div class="pato-confirm-actions">' +
                    '<button class="pato-confirm-btn pato-confirm-btn-cancel" data-confirm-action="cancel">Cancel</button>' +
                    '<button class="pato-confirm-btn pato-confirm-btn-buy" data-confirm-action="confirm">' + mdi('seal-variant') + ' Apply for Auto Loan</button>' +
                '</div>' +
            '</div>';

        overlay._onConfirm = function() { confirmBuy(vehicle.id); };
        overlay._onCancel = function() {};
        overlay.classList.remove('hidden');

        // Wire up term selector buttons
        wireBuyTermSelector(loanAmount, apr, downPayment);
    }

    function wireBuyTermSelector(loanAmount, apr, downPayment) {
        var container = document.getElementById('buyTermOptions');
        if (!container) return;

        container.addEventListener('click', function(e) {
            var btn = e.target.closest('.pato-term-btn');
            if (!btn) return;

            var term = parseInt(btn.getAttribute('data-term'));
            if (!term) return;

            pendingBuyTermMonths = term;

            // Update active button
            var btns = container.querySelectorAll('.pato-term-btn');
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

    async function confirmBuy(vehicleId) {
        var vehicle = getVehicleById(vehicleId);
        if (!vehicle) return;

        var downPayment = Math.round(vehicle.price * 0.10);
        var loanAmount = vehicle.price - downPayment;
        var termMonths = pendingBuyTermMonths || 36;

        try {
            var fs = elxaOS.financeService;
            var inv = elxaOS.inventoryService;

            // 1. Withdraw down payment from checking
            var withdrawResult = await fs.withdraw('checking', downPayment, 'Down payment \u2014 ' + vehicle.name + ' (10%)');
            if (!withdrawResult || !withdrawResult.success) {
                showToast(mdi('close-circle') + ' Insufficient funds for down payment.');
                return;
            }

            // 2. Apply for auto loan
            var loanResult = await fs.applyForLoan({
                type: 'auto',
                amount: loanAmount,
                termMonths: termMonths,
                sourceAccount: 'checking',
                linkedAsset: { type: 'vehicle', id: vehicleId },
                purpose: vehicle.name + ' (' + vehicle.year + ' ' + vehicle.type + ')'
            });

            if (!loanResult || !loanResult.approved) {
                // Refund the down payment
                await fs.deposit('checking', downPayment, 'Refund \u2014 ' + vehicle.name + ' down payment (loan denied)');
                var reason = loanResult ? loanResult.message : 'Auto loan application failed.';
                showToast(mdi('close-circle') + ' ' + reason);
                return;
            }

            var loanId = loanResult.loan.id;

            // 3. Clawback loan disbursement from checking (paid to seller, not buyer)
            var clawback = await fs.withdraw('checking', loanAmount, 'Auto loan disbursement \u2014 ' + vehicle.name + ' (paid to dealership)');

            // 4. Acquire vehicle as financed
            await inv.acquireVehicle({
                id: String(vehicle.id),
                name: vehicle.name,
                type: vehicle.type,
                purchasePrice: vehicle.price,
                currentValue: vehicle.price,
                color: vehicle.color,
                mileage: vehicle.mileage,
                image: vehicle.image,
                tier: vehicle.tier,
                insuranceRate: vehicle.insuranceRate,
                depreciationRate: vehicle.depreciationRate
            }, 'financed', {
                loanId: loanId
            });

            // 5. Close overlay and show ceremony
            hideConfirmOverlay();
            closeDetail();
            showPurchaseCeremony(vehicle, {
                downPayment: downPayment,
                principal: loanAmount,
                monthlyPayment: loanResult.terms.monthlyPayment,
                apr: loanResult.terms.apr,
                termMonths: termMonths
            });

            // 6. Notification
            if (elxaOS.notificationService) {
                elxaOS.notificationService.addNotification({
                    title: 'Vehicle Purchased!',
                    body: 'You are now the proud owner of a ' + vehicle.name + '! Monthly payment: ' + snakes(loanResult.terms.monthlyPayment) + '.',
                    icon: 'mdi-car',
                    category: 'finance',
                    urgency: 'info',
                    toast: false
                });
            }

            // 7. Refresh views
            if (currentTab === 'browse') {
                renderLoanBanner();
                renderGrid();
            } else if (currentTab === 'my-vehicles') {
                renderMyVehicles();
            }

        } catch (e) {
            console.error('Pato: Buy flow error:', e);
            showToast(mdi('close-circle') + ' Something went wrong with the purchase. Please try again.');
        }
    }

    // =================================
    // PURCHASE CEREMONY OVERLAY (Phase 5)
    // =================================

    function showPurchaseCeremony(vehicle, loanTerms) {
        var overlay = document.getElementById('ceremonyOverlay');
        if (!overlay) return;

        var today = new Date();
        var dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        overlay.innerHTML =
            '<div class="pato-ceremony-card pato-ceremony-purchase">' +
                '<div class="pato-ceremony-sparkles">' +
                    '<span class="pato-sparkle s1"></span>' +
                    '<span class="pato-sparkle s2"></span>' +
                    '<span class="pato-sparkle s3"></span>' +
                    '<span class="pato-sparkle s4"></span>' +
                    '<span class="pato-sparkle s5"></span>' +
                    '<span class="pato-sparkle s6"></span>' +
                '</div>' +
                '<div class="pato-ceremony-icon-wrap purchase">' +
                    '<span class="mdi mdi-seal-variant"></span>' +
                '</div>' +
                '<div class="pato-ceremony-title purchase">It\'s Official!</div>' +
                '<div class="pato-ceremony-subtitle purchase">Title Transfer Complete</div>' +

                '<div class="pato-ceremony-vehicle">' +
                    '<img src="' + vehicle.image + '" alt="' + vehicle.name + '">' +
                    '<div class="pato-ceremony-vehicle-info">' +
                        '<div class="pato-ceremony-vehicle-name">' + vehicle.name + '</div>' +
                        '<div class="pato-ceremony-vehicle-meta">' + vehicle.year + ' ' + vehicle.type + '</div>' +
                    '</div>' +
                '</div>' +

                '<div class="pato-purchase-deed">' +
                    '<div class="pato-deed-line">On <strong>' + dateStr + '</strong>, title to the vehicle known as</div>' +
                    '<div class="pato-deed-vehicle-name">' + vehicle.name + '</div>' +
                    '<div class="pato-deed-line">was transferred via auto loan financing.</div>' +
                    '<div class="pato-deed-terms">' +
                        '<div class="pato-deed-term-row"><span>Down Payment</span><strong>' + snakes(loanTerms.downPayment) + '</strong></div>' +
                        '<div class="pato-deed-term-row"><span>Loan Amount</span><strong>' + snakes(loanTerms.principal) + '</strong></div>' +
                        '<div class="pato-deed-term-row"><span>Monthly Payment</span><strong>' + snakes(loanTerms.monthlyPayment) + '</strong></div>' +
                        '<div class="pato-deed-term-row"><span>APR</span><strong>' + loanTerms.apr + '%</strong></div>' +
                        '<div class="pato-deed-term-row"><span>Term</span><strong>' + termLabel(loanTerms.termMonths) + '</strong></div>' +
                    '</div>' +
                '</div>' +

                '<div class="pato-ceremony-message">' +
                    '<span class="mdi mdi-message-text-outline"></span>' +
                    '<div>' +
                        '<strong>' + vehicle.salesperson + '</strong> says:' +
                        '<div class="pato-ceremony-quote">"' + getSalespersonBuyQuote(vehicle) + '"</div>' +
                    '</div>' +
                '</div>' +

                '<button class="pato-ceremony-btn purchase" data-action="dismiss-ceremony">' +
                    mdi('car') + ' Take Her Home' +
                '</button>' +
            '</div>';

        overlay.classList.remove('hidden');
    }

    function getSalespersonBuyQuote(vehicle) {
        if (vehicle.salesperson === 'Pato Sr.') {
            return "She's yours now, kid. For real this time \u2014 title, keys, the whole deal. Make those payments on time and you'll be golden.";
        } else if (vehicle.salesperson === 'Pato Jr.') {
            return "CONGRATS! Oh man, you're gonna love owning this one. No more lease \u2014 this baby is YOURS. Just keep up with the payments, okay?";
        } else {
            return "Fun fact: the paperwork for this transaction weighs exactly 3.7 ounces. Anyway, congratulations! She's all yours. Don't forget about the payments.";
        }
    }

    // =================================
    // SELL FLOW (Phase 7)
    // =================================

    function handleSell(vehicleId) {
        var vehicle = getVehicleById(vehicleId);
        if (!vehicle) return;

        var ownership = getVehicleOwnership(vehicleId);
        if (!ownership) {
            showToast(mdi('alert') + ' You don\'t own this vehicle.');
            return;
        }
        if (ownership.ownership === 'leased') {
            showToast(mdi('alert') + ' You\'re leasing this vehicle. Use Return Vehicle instead.');
            return;
        }

        // Current depreciated value from inventory
        var purchasePrice = ownership.purchasePrice || vehicle.price;
        var currentValue = ownership.currentValue || purchasePrice;

        // Depreciation percentage
        var depPct = purchasePrice > 0 ? Math.round((1 - currentValue / purchasePrice) * 100) : 0;

        // Check if financed — get loan details
        var loanInfo = null;
        if (ownership.loanId) {
            try {
                var loans = elxaOS.financeService.getLoansSync();
                for (var i = 0; i < loans.length; i++) {
                    if (loans[i].id === ownership.loanId && loans[i].status === 'active') {
                        loanInfo = loans[i];
                        break;
                    }
                }
            } catch (e) {
                console.warn('Pato: Could not read loan info', e);
            }
        }

        var netProceeds = currentValue;
        if (loanInfo) {
            netProceeds = currentValue - loanInfo.remainingBalance;
        }

        showSellOverlay(vehicle, ownership, currentValue, depPct, loanInfo, netProceeds);
    }

    function showSellOverlay(vehicle, ownership, currentValue, depPct, loanInfo, netProceeds) {
        var purchasePrice = ownership.purchasePrice || vehicle.price;

        var depLine = '';
        if (depPct > 0) {
            depLine = '<div class="pato-sell-depreciation">' +
                mdi('trending-down') + ' Down ' + depPct + '% since purchase' +
            '</div>';
        }

        var loanSection = '';
        if (loanInfo) {
            loanSection =
                '<div class="pato-sell-section-label">' + mdi('bank') + ' Auto Loan Payoff</div>' +
                '<div class="pato-confirm-details">' +
                    '<div class="pato-confirm-row">' +
                        '<span>Remaining Loan Balance</span>' +
                        '<strong class="pato-sell-deduction">' + mdi('minus') + ' ' + snakes(loanInfo.remainingBalance) + '</strong>' +
                    '</div>' +
                '</div>';
        }

        var netClass = netProceeds >= 0 ? '' : ' pato-sell-net-negative';
        var netLabel = netProceeds >= 0 ? 'Net Proceeds to Your Checking' : 'Amount Owed from Your Checking';

        var bodyHtml =
            '<div class="pato-confirm-vehicle">' +
                '<img src="' + vehicle.image + '" alt="' + vehicle.name + '">' +
                '<div class="pato-confirm-vehicle-info">' +
                    '<div class="pato-confirm-vehicle-name">' + vehicle.name + '</div>' +
                    '<div class="pato-confirm-vehicle-meta">' + vehicle.year + ' ' + vehicle.type + '</div>' +
                '</div>' +
            '</div>' +

            '<div class="pato-sell-section-label">' + mdi('chart-line') + ' Vehicle Valuation</div>' +
            '<div class="pato-confirm-details">' +
                '<div class="pato-confirm-row">' +
                    '<span>Original Purchase Price</span>' +
                    '<strong>' + snakes(purchasePrice) + '</strong>' +
                '</div>' +
                '<div class="pato-confirm-row">' +
                    '<span>Current Market Value</span>' +
                    '<strong>' + snakes(currentValue) + '</strong>' +
                '</div>' +
            '</div>' +
            depLine +

            loanSection +

            '<div class="pato-sell-net-box' + netClass + '">' +
                '<div class="pato-sell-net-label">' + netLabel + '</div>' +
                '<div class="pato-sell-net-amount">' + (netProceeds < 0 ? mdi('minus') + ' ' : '') + snakes(Math.abs(netProceeds)) + '</div>' +
            '</div>';

        // Check if user can afford to sell underwater
        var canAfford = true;
        if (netProceeds < 0) {
            try {
                var balances = elxaOS.financeService.getAccountBalancesSync();
                if (balances.checking < Math.abs(netProceeds)) {
                    canAfford = false;
                    bodyHtml += '<div class="pato-confirm-note pato-confirm-note-warning">' +
                        mdi('close-circle') + ' You don\'t have enough in checking (' + snakes(balances.checking) +
                        ') to cover the shortfall of ' + snakes(Math.abs(netProceeds)) +
                        '. Pay off more of the loan before selling.' +
                    '</div>';
                } else {
                    bodyHtml += '<div class="pato-confirm-note pato-confirm-note-warning">' +
                        mdi('alert-outline') + ' Warning: You owe more on the loan than this vehicle is worth. ' +
                        'Selling will cost you ' + snakes(Math.abs(netProceeds)) + ' from your checking account to cover the difference.' +
                    '</div>';
                }
            } catch (e) {
                canAfford = false;
            }
        } else {
            bodyHtml += '<div class="pato-confirm-note">' +
                mdi('information-outline') + ' The sale amount will be deposited into your checking account' +
                (loanInfo ? ' after the loan is paid off.' : '.') +
                ' This vehicle will return to the lot.' +
            '</div>';
        }

        showConfirmOverlay({
            title: mdi('tag') + ' Sell Vehicle',
            body: bodyHtml,
            confirmText: canAfford ? mdi('cash-multiple') + ' Confirm Sale' : mdi('lock-outline') + ' Cannot Sell',
            cancelText: 'Keep Vehicle',
            confirmClass: canAfford ? 'pato-confirm-btn-sell' : 'pato-confirm-btn-disabled',
            onConfirm: canAfford ? function() { confirmSell(vehicle.id, currentValue, loanInfo); } : function() {}
        });
    }

    async function confirmSell(vehicleId, salePrice, loanInfo) {
        var vehicle = getVehicleById(vehicleId);
        if (!vehicle) return;

        var ownership = getVehicleOwnership(vehicleId);
        if (!ownership) return;

        var purchasePrice = ownership.purchasePrice || vehicle.price;

        try {
            var fs = elxaOS.financeService;
            var inv = elxaOS.inventoryService;

            // 1. Deposit the sale price into checking
            await fs.deposit('checking', salePrice, 'Vehicle sale \u2014 ' + vehicle.name);

            // 2. If financed, pay off the auto loan from checking
            var payoffResult = null;
            if (loanInfo && loanInfo.status === 'active') {
                payoffResult = await fs.payOffLoan(loanInfo.id, 'checking');
                if (!payoffResult || !payoffResult.success) {
                    console.warn('Pato: Loan payoff issue:', payoffResult);
                }
            }

            // 3. Remove vehicle from inventory
            await inv.loseVehicle(ownership.id, 'sold');

            // 4. Calculate net for ceremony display
            var netProceeds = salePrice;
            if (loanInfo) {
                netProceeds = salePrice - loanInfo.remainingBalance;
            }

            // 5. Show sale ceremony
            hideConfirmOverlay();
            closeDetail();
            showSaleCeremony(vehicle, ownership, salePrice, purchasePrice, netProceeds, loanInfo);

            // 6. Notification
            if (elxaOS.notificationService) {
                elxaOS.notificationService.addNotification({
                    title: 'Vehicle Sold!',
                    body: vehicle.name + ' has been sold for ' + snakes(salePrice) + '. Net proceeds: ' + snakes(netProceeds) + '.',
                    icon: 'mdi-cash-multiple',
                    category: 'finance',
                    urgency: 'info',
                    toast: false
                });
            }

            // 7. Refresh views
            if (currentTab === 'browse') {
                renderLoanBanner();
                renderGrid();
            } else if (currentTab === 'my-vehicles') {
                renderMyVehicles();
            }

        } catch (e) {
            console.error('Pato: Sell flow error:', e);
            showToast(mdi('close-circle') + ' Something went wrong with the sale. Please try again.');
        }
    }

    // =================================
    // SALE CEREMONY OVERLAY (Phase 7)
    // =================================

    function showSaleCeremony(vehicle, ownership, salePrice, purchasePrice, netProceeds, loanInfo) {
        var overlay = document.getElementById('ceremonyOverlay');
        if (!overlay) return;

        var loss = purchasePrice - netProceeds;
        var profitLine = '';
        if (loss > 0) {
            profitLine = '<div class="pato-sale-profit negative">' +
                mdi('trending-down') + ' You lost ' + snakes(loss) + ' on this vehicle.' +
            '</div>';
        } else if (loss < 0) {
            profitLine = '<div class="pato-sale-profit positive">' +
                mdi('trending-up') + ' Somehow you made ' + snakes(Math.abs(loss)) + ' on this deal!' +
            '</div>';
        } else {
            profitLine = '<div class="pato-sale-profit neutral">' +
                mdi('minus') + ' You broke even on this sale.' +
            '</div>';
        }

        var loanLine = '';
        if (loanInfo) {
            loanLine =
                '<div class="pato-sale-summary-row">' +
                    '<span>Auto Loan Paid Off</span>' +
                    '<strong>' + mdi('minus') + ' ' + snakes(loanInfo.remainingBalance) + '</strong>' +
                '</div>';
        }

        overlay.innerHTML =
            '<div class="pato-ceremony-card pato-ceremony-sale">' +
                '<div class="pato-ceremony-sparkles">' +
                    '<span class="pato-sparkle s1"></span>' +
                    '<span class="pato-sparkle s2"></span>' +
                    '<span class="pato-sparkle s3"></span>' +
                    '<span class="pato-sparkle s4"></span>' +
                    '<span class="pato-sparkle s5"></span>' +
                    '<span class="pato-sparkle s6"></span>' +
                '</div>' +
                '<div class="pato-ceremony-icon-wrap sale">' +
                    '<span class="mdi mdi-cash-check"></span>' +
                '</div>' +
                '<div class="pato-ceremony-title sale">Vehicle Sold!</div>' +
                '<div class="pato-ceremony-subtitle sale">Transaction Complete</div>' +

                '<div class="pato-ceremony-vehicle sale">' +
                    '<img src="' + vehicle.image + '" alt="' + vehicle.name + '">' +
                    '<div class="pato-ceremony-vehicle-info">' +
                        '<div class="pato-ceremony-vehicle-name">' + vehicle.name + '</div>' +
                        '<div class="pato-ceremony-vehicle-meta">' + vehicle.year + ' ' + vehicle.type + '</div>' +
                    '</div>' +
                '</div>' +

                '<div class="pato-sale-summary">' +
                    '<div class="pato-sale-summary-row">' +
                        '<span>Sale Price</span>' +
                        '<strong>' + snakes(salePrice) + '</strong>' +
                    '</div>' +
                    loanLine +
                    '<div class="pato-sale-summary-row pato-sale-summary-total">' +
                        '<span>Deposited to Checking</span>' +
                        '<strong>' + snakes(netProceeds) + '</strong>' +
                    '</div>' +
                '</div>' +

                profitLine +

                '<div class="pato-ceremony-message sale">' +
                    '<span class="mdi mdi-message-text-outline"></span>' +
                    '<div>' +
                        '<strong>' + vehicle.salesperson + '</strong> says:' +
                        '<div class="pato-ceremony-quote">"' + getSalespersonSellQuote(vehicle) + '"</div>' +
                    '</div>' +
                '</div>' +

                '<button class="pato-ceremony-btn sale" data-action="dismiss-ceremony">' +
                    mdi('magnify') + ' Browse Vehicles' +
                '</button>' +
            '</div>';

        overlay.classList.remove('hidden');
    }

    function getSalespersonSellQuote(vehicle) {
        if (vehicle.salesperson === 'Pato Sr.') {
            return "Every car tells a story, kid. Yours just ended a chapter. We'll find her a good home. Come back when you're ready for the next ride.";
        } else if (vehicle.salesperson === 'Pato Jr.') {
            return "Aww, saying goodbye is always tough! But hey, now you've got room for something NEW. Come check out what just came in!";
        } else {
            return "Fun fact: the average car changes owners 4.7 times in its lifetime. You were number... well, I lost count. Anyway, safe travels!";
        }
    }

    // ---- Tab Switching ----

    function switchTab(tab) {
        currentTab = tab;
        var tabs = document.querySelectorAll('.pato-nav-tab');
        var contents = document.querySelectorAll('.pato-tab-content');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.toggle('active', tabs[i].getAttribute('data-tab') === tab);
        }
        for (var j = 0; j < contents.length; j++) {
            contents[j].classList.toggle('active', false);
        }
        if (tab === 'browse') {
            document.getElementById('browseTab').classList.add('active');
            renderLoanBanner();
            renderGrid();
        } else if (tab === 'tiers') {
            document.getElementById('tiersTab').classList.add('active');
            renderTiers();
        } else if (tab === 'my-vehicles') {
            document.getElementById('myVehiclesTab').classList.add('active');
            renderMyVehicles();
        }
    }

    // ---- Populate Type Filter ----

    function populateTypeFilter() {
        var select = document.getElementById('filterType');
        if (!select || !window.PATO_VEHICLES) return;
        var types = {};
        for (var i = 0; i < PATO_VEHICLES.length; i++) {
            types[PATO_VEHICLES[i].type] = true;
        }
        var sorted = Object.keys(types).sort();
        for (var j = 0; j < sorted.length; j++) {
            var opt = document.createElement('option');
            opt.value = sorted[j];
            opt.textContent = sorted[j];
            select.appendChild(opt);
        }
    }

    // ---- Close Detail ----

    function closeDetail() {
        var overlay = document.getElementById('detailOverlay');
        if (overlay) overlay.classList.add('hidden');
        currentDetailId = null;
    }

    // ---- Event Delegation ----

    function setupEvents() {
        var root = document.querySelector('.pato-root');
        if (!root) return;

        root.addEventListener('click', function(e) {
            var target = e.target;

            // Nav tabs
            var navTab = target.closest('.pato-nav-tab');
            if (navTab) {
                var tab = navTab.getAttribute('data-tab');
                if (tab) switchTab(tab);
                return;
            }

            // Close detail
            if (target.closest('[data-action="close-detail"]')) {
                closeDetail();
                return;
            }

            // Click outside detail panel to close
            if (target.classList.contains('pato-detail-overlay')) {
                closeDetail();
                return;
            }

            // Dismiss ceremony
            if (target.closest('[data-action="dismiss-ceremony"]')) {
                var ceremony = document.getElementById('ceremonyOverlay');
                if (ceremony) ceremony.classList.add('hidden');
                // Refresh views after ceremony dismiss
                if (currentTab === 'browse') { renderLoanBanner(); renderGrid(); }
                else if (currentTab === 'my-vehicles') { renderMyVehicles(); }
                return;
            }

            // Confirm overlay actions
            if (target.closest('[data-confirm-action="confirm"]')) {
                var confirmOverlay = document.getElementById('confirmOverlay');
                if (confirmOverlay && confirmOverlay._onConfirm) {
                    confirmOverlay._onConfirm();
                }
                return;
            }
            if (target.closest('[data-confirm-action="cancel"]') || target.classList.contains('pato-confirm-overlay')) {
                hideConfirmOverlay();
                return;
            }

            // Lease button
            var leaseBtn = target.closest('[data-action="lease"]');
            if (leaseBtn) {
                var leaseId = parseInt(leaseBtn.getAttribute('data-vehicle-id'), 10);
                if (leaseId) handleLease(leaseId);
                return;
            }

            // Buy button
            var buyBtn = target.closest('[data-action="buy"]');
            if (buyBtn) {
                var buyId = parseInt(buyBtn.getAttribute('data-vehicle-id'), 10);
                if (buyId) handleBuy(buyId);
                return;
            }

            // Return vehicle button
            var returnBtn = target.closest('[data-action="return-vehicle"]');
            if (returnBtn) {
                var returnId = returnBtn.getAttribute('data-vehicle-id');
                if (returnId) handleReturnVehicle(returnId);
                return;
            }

            // Sell vehicle button
            var sellBtn = target.closest('[data-action="sell-vehicle"]');
            if (sellBtn) {
                var sellId = parseInt(sellBtn.getAttribute('data-vehicle-id'), 10);
                if (sellId) handleSell(sellId);
                return;
            }

            // Vehicle card click → detail
            var card = target.closest('[data-action="view-detail"]');
            if (card) {
                var id = parseInt(card.getAttribute('data-vehicle-id'), 10);
                if (id) renderDetail(id);
                return;
            }
        });

        // Filter changes
        var filters = ['filterTier', 'filterPrice', 'filterType', 'filterSort'];
        for (var i = 0; i < filters.length; i++) {
            var el = document.getElementById(filters[i]);
            if (el) {
                el.addEventListener('change', function() { renderGrid(); });
            }
        }
    }

    // ---- Init ----

    function init() {
        populateTypeFilter();
        renderLoanBanner();
        renderGrid();
        setupEvents();
    }

    // Run on load
    init();

    // Public API
    return {
        renderGrid: renderGrid,
        renderMyVehicles: renderMyVehicles,
        renderDetail: renderDetail,
        closeDetail: closeDetail,
        switchTab: switchTab,
        getVehicleById: getVehicleById,
        getFinanceInfo: getFinanceInfo,
        handleLease: handleLease,
        handleBuy: handleBuy,
        handleSell: handleSell,
        handleReturnVehicle: handleReturnVehicle,
        snakes: snakes,
        snakesShort: snakesShort,
        mdi: mdi
    };

})();
