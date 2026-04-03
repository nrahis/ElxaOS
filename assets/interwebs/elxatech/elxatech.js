// ============================================================
// ElxaTech Store — Shop Logic
// ElxaCorp's consumer electronics store
// ============================================================

var ElxaTechStore = (function() {
    'use strict';

    var _currentCategory = null;
    var _currentProductId = null;
    var _view = 'home'; // 'home' | 'category' | 'detail' | 'mydevices'

    // ===== HELPERS =====

    function mdi(name) {
        return '<span class="mdi mdi-' + name + '"></span>';
    }

    function snakes(amount) {
        return '\u00A7' + amount.toLocaleString();
    }

    function _inventoryReady() {
        return typeof elxaOS !== 'undefined' && elxaOS.inventoryService &&
               typeof elxaOS.inventoryService.addItems === 'function';
    }

    function _getOwnedProducts() {
        if (!_inventoryReady()) return [];
        try {
            var items = elxaOS.inventoryService.getItemsBySubcategory('electronics');
            return items || [];
        } catch (e) {
            return [];
        }
    }

    function _ownsProduct(productId) {
        var owned = _getOwnedProducts();
        for (var i = 0; i < owned.length; i++) {
            if (owned[i].itemId === productId) return true;
        }
        return false;
    }

    // ===== NAVIGATION =====

    function navigate(view, data) {
        _view = view;
        var container = document.getElementById('etContent');
        if (!container) return;

        // Update nav active state
        var navBtns = document.querySelectorAll('.et-nav-btn');
        for (var i = 0; i < navBtns.length; i++) {
            navBtns[i].classList.remove('et-nav-active');
        }

        switch (view) {
            case 'home':
                var homeBtn = document.getElementById('etNavHome');
                if (homeBtn) homeBtn.classList.add('et-nav-active');
                renderHome(container);
                break;
            case 'category':
                _currentCategory = data;
                var catBtn = document.getElementById('etNavCat-' + data);
                if (catBtn) catBtn.classList.add('et-nav-active');
                renderCategory(container, data);
                break;
            case 'detail':
                _currentProductId = data;
                renderDetail(container, data);
                break;
            case 'mydevices':
                var devBtn = document.getElementById('etNavDevices');
                if (devBtn) devBtn.classList.add('et-nav-active');
                renderMyDevices(container);
                break;
        }
        // Scroll to top
        container.scrollTop = 0;
    }

    // ===== RENDER: HOME =====

    function renderHome(container) {
        var hero = ELXATECH_PRODUCTS.find(function(p) { return p.badge === 'New' && p.category === 'phones'; });
        if (!hero) hero = ELXATECH_PRODUCTS[0];

        var html = '';

        // Hero section
        html += '<div class="et-hero" data-action="detail" data-id="' + hero.id + '">';
        html += '  <div class="et-hero-text">';
        html += '    <div class="et-hero-label">Just Released</div>';
        html += '    <h1 class="et-hero-title">' + hero.name + '</h1>';
        html += '    <p class="et-hero-tagline">' + hero.tagline + '</p>';
        html += '    <div class="et-hero-price">Starting at ' + hero.priceDisplay + '</div>';
        html += '    <button class="et-btn et-btn-primary" data-action="detail" data-id="' + hero.id + '">Learn More ' + mdi('arrow-right') + '</button>';
        html += '  </div>';
        html += '  <div class="et-hero-image">';
        html += '    <img src="./assets/interwebs/elxatech/' + hero.image + '" alt="' + hero.name + '" />';
        html += '  </div>';
        html += '</div>';

        // Announcement bar
        html += '<div class="et-announcement">';
        html += '  ' + mdi('cellphone-arrow-down') + ' <strong>ElxaOS 5</strong> is here — faster, smoother, and now with built-in ExWeb AI assistant. Free update for all ElxaCorp devices.';
        html += '</div>';

        // Category grid
        html += '<div class="et-section-title">Shop by Category</div>';
        html += '<div class="et-category-grid">';
        for (var i = 0; i < ELXATECH_CATEGORIES.length; i++) {
            var cat = ELXATECH_CATEGORIES[i];
            // Pick a mid-tier product image for category card
            var catProducts = ELXATECH_PRODUCTS.filter(function(p) { return p.category === cat.id; });
            var showcase = catProducts.find(function(p) { return p.tier === 'mid'; }) || catProducts[0];
            html += '<div class="et-category-card" data-action="category" data-cat="' + cat.id + '">';
            html += '  <div class="et-category-card-img">';
            html += '    <img src="./assets/interwebs/elxatech/' + showcase.image + '" alt="' + cat.name + '" />';
            html += '  </div>';
            html += '  <div class="et-category-card-info">';
            html += '    <span class="mdi ' + cat.icon + '"></span>';
            html += '    <strong>' + cat.name + '</strong>';
            html += '    <span class="et-category-tagline">' + cat.tagline + '</span>';
            html += '  </div>';
            html += '</div>';
        }
        html += '</div>';

        container.innerHTML = html;
    }

    // ===== RENDER: CATEGORY =====

    function renderCategory(container, categoryId) {
        var cat = ELXATECH_CATEGORIES.find(function(c) { return c.id === categoryId; });
        if (!cat) { navigate('home'); return; }

        var products = ELXATECH_PRODUCTS.filter(function(p) { return p.category === categoryId; });

        var html = '';
        html += '<div class="et-breadcrumb">';
        html += '  <span class="et-breadcrumb-link" data-action="home">Home</span>';
        html += '  <span class="mdi mdi-chevron-right"></span>';
        html += '  <span>' + cat.name + '</span>';
        html += '</div>';

        html += '<div class="et-section-title">' + mdi(cat.icon) + ' ' + cat.name + '</div>';
        html += '<p class="et-section-subtitle">' + cat.tagline + '</p>';

        html += '<div class="et-product-grid">';
        for (var i = 0; i < products.length; i++) {
            var p = products[i];
            var owned = _ownsProduct(p.id);
            html += '<div class="et-product-card" data-action="detail" data-id="' + p.id + '">';
            if (p.badge) {
                html += '<div class="et-badge et-badge-' + p.badge.toLowerCase() + '">' + p.badge + '</div>';
            }
            if (owned) {
                html += '<div class="et-badge et-badge-owned">' + mdi('check-circle') + ' Owned</div>';
            }
            html += '  <div class="et-product-card-img">';
            html += '    <img src="./assets/interwebs/elxatech/' + p.image + '" alt="' + p.name + '" />';
            html += '  </div>';
            html += '  <div class="et-product-card-info">';
            html += '    <div class="et-product-card-name">' + p.name + '</div>';
            html += '    <div class="et-product-card-tagline">' + p.tagline + '</div>';
            html += '    <div class="et-product-card-price">' + p.priceDisplay + '</div>';
            html += '  </div>';
            html += '</div>';
        }
        html += '</div>';

        container.innerHTML = html;
    }

    // ===== RENDER: PRODUCT DETAIL =====

    function renderDetail(container, productId) {
        var product = ELXATECH_PRODUCTS.find(function(p) { return p.id === productId; });
        if (!product) { navigate('home'); return; }

        var cat = ELXATECH_CATEGORIES.find(function(c) { return c.id === product.category; });
        var owned = _ownsProduct(product.id);

        var html = '';
        html += '<div class="et-breadcrumb">';
        html += '  <span class="et-breadcrumb-link" data-action="home">Home</span>';
        html += '  <span class="mdi mdi-chevron-right"></span>';
        if (cat) {
            html += '  <span class="et-breadcrumb-link" data-action="category" data-cat="' + cat.id + '">' + cat.name + '</span>';
            html += '  <span class="mdi mdi-chevron-right"></span>';
        }
        html += '  <span>' + product.name + '</span>';
        html += '</div>';

        html += '<div class="et-detail">';
        html += '  <div class="et-detail-image">';
        html += '    <img src="./assets/interwebs/elxatech/' + product.image + '" alt="' + product.name + '" />';
        html += '  </div>';
        html += '  <div class="et-detail-info">';
        if (product.badge) {
            html += '    <div class="et-badge et-badge-' + product.badge.toLowerCase() + '">' + product.badge + '</div>';
        }
        html += '    <h1 class="et-detail-name">' + product.name + '</h1>';
        html += '    <p class="et-detail-tagline">' + product.tagline + '</p>';
        html += '    <div class="et-detail-price">' + product.priceDisplay + '</div>';
        html += '    <p class="et-detail-desc">' + product.description + '</p>';

        // Specs table
        html += '    <div class="et-specs">';
        html += '      <div class="et-specs-title">' + mdi('format-list-bulleted') + ' Specifications</div>';
        var specKeys = Object.keys(product.specs);
        for (var i = 0; i < specKeys.length; i++) {
            var key = specKeys[i];
            var label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
            html += '      <div class="et-spec-row">';
            html += '        <span class="et-spec-label">' + label + '</span>';
            html += '        <span class="et-spec-value">' + product.specs[key] + '</span>';
            html += '      </div>';
        }
        html += '    </div>';

        // Buy / owned button
        if (owned) {
            html += '    <button class="et-btn et-btn-owned" disabled>' + mdi('check-circle') + ' You own this device</button>';
        } else {
            html += '    <button class="et-btn et-btn-buy" data-action="buy" data-id="' + product.id + '">';
            html += '      ' + mdi('cart') + ' Buy Now \u2014 ' + product.priceDisplay;
            html += '    </button>';
        }

        html += '  </div>';
        html += '</div>';

        container.innerHTML = html;
    }

    // ===== RENDER: MY DEVICES =====

    function renderMyDevices(container) {
        var owned = _getOwnedProducts();

        var html = '';
        html += '<div class="et-breadcrumb">';
        html += '  <span class="et-breadcrumb-link" data-action="home">Home</span>';
        html += '  <span class="mdi mdi-chevron-right"></span>';
        html += '  <span>My Devices</span>';
        html += '</div>';

        html += '<div class="et-section-title">' + mdi('devices') + ' My Devices</div>';

        if (owned.length === 0) {
            html += '<div class="et-empty">';
            html += '  <span class="mdi mdi-package-variant"></span>';
            html += '  <p>You don\'t own any ElxaCorp devices yet.</p>';
            html += '  <button class="et-btn et-btn-primary" data-action="home">Start Shopping</button>';
            html += '</div>';
        } else {
            html += '<div class="et-product-grid">';
            for (var i = 0; i < owned.length; i++) {
                var item = owned[i];
                // Try to find matching catalog product for image/details
                var catalogProduct = ELXATECH_PRODUCTS.find(function(p) { return p.id === item.itemId; });
                var imgSrc = catalogProduct ? './assets/interwebs/elxatech/' + catalogProduct.image : '';
                var itemName = item.name || (catalogProduct ? catalogProduct.name : 'Unknown Device');

                html += '<div class="et-product-card et-owned-card">';
                html += '  <div class="et-badge et-badge-owned">' + mdi('check-circle') + ' Owned</div>';
                if (imgSrc) {
                    html += '  <div class="et-product-card-img">';
                    html += '    <img src="' + imgSrc + '" alt="' + itemName + '" />';
                    html += '  </div>';
                }
                html += '  <div class="et-product-card-info">';
                html += '    <div class="et-product-card-name">' + itemName + '</div>';
                if (catalogProduct) {
                    html += '    <div class="et-product-card-tagline">' + catalogProduct.tagline + '</div>';
                }
                html += '  </div>';
                html += '</div>';
            }
            html += '</div>';
        }

        container.innerHTML = html;
    }

    // ===== PURCHASE FLOW =====

    function buyProduct(productId) {
        var product = ELXATECH_PRODUCTS.find(function(p) { return p.id === productId; });
        if (!product) return;

        if (_ownsProduct(productId)) {
            if (typeof ElxaUI !== 'undefined') {
                ElxaUI.showMessage('You already own the ' + product.name + '!', 'info');
            }
            return;
        }

        // Set up payment listener
        _setupPaymentListener(product);

        // Open the payment dialog
        purchaseProduct({
            name: product.name,
            price: product.priceDisplay,
            description: product.tagline
        });
    }

    function _setupPaymentListener(product) {
        var handler = function(e) {
            if (e.detail && e.detail.productName === product.name) {
                document.removeEventListener('elxa-payment-complete', handler);

                // Add to inventory
                if (_inventoryReady()) {
                    try {
                        elxaOS.inventoryService.addItems(product.id, {
                            name: product.name,
                            subcategory: 'electronics',
                            unitPrice: product.price,
                            brand: 'ElxaCorp',
                            giftable: false,
                            image: product.image
                        }, 1);
                        console.log('[ElxaTech] Added to inventory:', product.name);
                    } catch (err) {
                        console.warn('[ElxaTech] Could not add to inventory:', err);
                    }
                }

                // Show success message
                if (typeof ElxaUI !== 'undefined') {
                    ElxaUI.showMessage('Thank you for purchasing the ' + product.name + '!', 'success');
                }

                // Emit purchase event for email receipt
                if (typeof elxaOS !== 'undefined' && elxaOS.eventBus) {
                    elxaOS.eventBus.emit('elxatech.purchase', {
                        productId: product.id,
                        productName: product.name,
                        price: product.price,
                        priceDisplay: product.priceDisplay
                    });
                }

                // Refresh current view to show owned status
                setTimeout(function() {
                    if (_view === 'detail' && _currentProductId === product.id) {
                        navigate('detail', product.id);
                    } else if (_view === 'category') {
                        navigate('category', _currentCategory);
                    }
                }, 300);
            }
        };
        document.addEventListener('elxa-payment-complete', handler);
    }

    // ===== EVENT DELEGATION =====

    function _handleClick(e) {
        var target = e.target.closest('[data-action]');
        if (!target) return;

        var action = target.getAttribute('data-action');

        switch (action) {
            case 'home':
                navigate('home');
                break;
            case 'category':
                var cat = target.getAttribute('data-cat');
                if (cat) navigate('category', cat);
                break;
            case 'detail':
                var id = target.getAttribute('data-id');
                if (id) navigate('detail', id);
                break;
            case 'buy':
                var buyId = target.getAttribute('data-id');
                if (buyId) buyProduct(buyId);
                break;
            case 'mydevices':
                navigate('mydevices');
                break;
        }
    }

    // ===== INIT =====

    function init() {
        var root = document.querySelector('.et-root');
        if (!root) return;

        // Event delegation on root
        root.addEventListener('click', _handleClick);

        // Render home page
        navigate('home');
    }

    // Auto-init
    init();

    // Public API
    return {
        navigate: navigate,
        buyProduct: buyProduct
    };

})();
