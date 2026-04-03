// ==========================================
// Scales & Tails Fashion Co. — Site Logic
// ==========================================

(function() {
    'use strict';

    // ==========================================
    // State
    // ==========================================

    var cart = [];
    var selectedDepartment = 'all';
    var selectedProduct = null;
    var selectedVariantIndex = 0;
    var detailQty = 1;

    // ==========================================
    // Helpers
    // ==========================================

    function positionOverlay(overlay) {
        // Find the browser-page scroll container
        var scrollParent = overlay.closest('.browser-page') || overlay.parentElement;
        var scrollTop = scrollParent ? scrollParent.scrollTop : 0;
        var viewHeight = scrollParent ? scrollParent.clientHeight : window.innerHeight;
        overlay.style.top = scrollTop + 'px';
        overlay.style.height = viewHeight + 'px';
    }

    function lockScroll() {
        var scrollParent = document.querySelector('.fashionco-app');
        if (scrollParent) scrollParent = scrollParent.closest('.browser-page');
        if (scrollParent) scrollParent.style.overflow = 'hidden';
    }

    function unlockScroll() {
        var scrollParent = document.querySelector('.fashionco-app');
        if (scrollParent) scrollParent = scrollParent.closest('.browser-page');
        if (scrollParent) scrollParent.style.overflow = '';
    }

    function snakes(usd) {
        var s = (usd * 2).toFixed(2);
        return '§' + s;
    }

    function snakesShort(usd) {
        var s = usd * 2;
        if (s >= 1000) return '§' + (s / 1000).toFixed(1) + 'k';
        return '§' + s.toFixed(2);
    }

    function mdi(name) {
        return '<span class="mdi mdi-' + name + '"></span>';
    }

    function getImagePath(filename) {
        return './assets/interwebs/fashionco/images/' + filename;
    }

    function getCartCount() {
        var count = 0;
        for (var i = 0; i < cart.length; i++) {
            count += cart[i].qty;
        }
        return count;
    }

    function getCartTotal() {
        var total = 0;
        for (var i = 0; i < cart.length; i++) {
            total += cart[i].price * cart[i].qty;
        }
        return total;
    }

    // ==========================================
    // Rendering — Product Grid
    // ==========================================

    function renderGrid() {
        var grid = document.getElementById('fc-product-grid');
        if (!grid) return;

        var products = FASHION_PRODUCTS;
        if (selectedDepartment !== 'all') {
            products = products.filter(function(p) {
                return p.department === selectedDepartment;
            });
        }

        var html = '';
        for (var i = 0; i < products.length; i++) {
            var p = products[i];
            var hero = p.variants[0];
            var variantCount = p.variants.length;
            html += '<div class="fc-card" data-action="open-detail" data-product="' + p.id + '">';
            html += '<img class="fc-card-image" src="' + getImagePath(hero.image) + '" alt="' + p.name + '" loading="lazy">';
            html += '<div class="fc-card-info">';
            html += '<p class="fc-card-name">' + p.name + '</p>';
            html += '<p class="fc-card-price">' + snakes(p.price) + '</p>';
            if (variantCount > 1) {
                html += '<p class="fc-card-variants">' + variantCount + ' colors</p>';
            }
            html += '</div></div>';
        }

        grid.innerHTML = html;
    }

    // ==========================================
    // Rendering — Product Detail
    // ==========================================

    function openDetail(productId) {
        var product = null;
        for (var i = 0; i < FASHION_PRODUCTS.length; i++) {
            if (FASHION_PRODUCTS[i].id === productId) {
                product = FASHION_PRODUCTS[i];
                break;
            }
        }
        if (!product) return;

        selectedProduct = product;
        selectedVariantIndex = 0;
        detailQty = 1;

        renderDetail();
        var overlay = document.getElementById('fc-detail-overlay');
        overlay.style.display = 'flex';
        positionOverlay(overlay);
        lockScroll();
    }

    function renderDetail() {
        if (!selectedProduct) return;

        var variant = selectedProduct.variants[selectedVariantIndex];

        // Main image
        document.getElementById('fc-detail-image').src = getImagePath(variant.image);
        document.getElementById('fc-detail-image').alt = selectedProduct.name + ' - ' + variant.color;

        // Product info
        document.getElementById('fc-detail-name').textContent = selectedProduct.name;
        document.getElementById('fc-detail-price').textContent = snakes(selectedProduct.price);
        document.getElementById('fc-detail-desc').textContent = selectedProduct.description;
        document.getElementById('fc-detail-selected-color').textContent = 'Color: ' + variant.color;
        document.getElementById('fc-qty-value').textContent = detailQty;

        // Variant thumbnails
        var thumbsHtml = '';
        for (var i = 0; i < selectedProduct.variants.length; i++) {
            var v = selectedProduct.variants[i];
            var activeClass = (i === selectedVariantIndex) ? ' active' : '';
            thumbsHtml += '<div class="fc-variant-thumb' + activeClass + '" data-action="select-variant" data-index="' + i + '">';
            thumbsHtml += '<img src="' + getImagePath(v.image) + '" alt="' + v.color + '" loading="lazy">';
            thumbsHtml += '</div>';
        }
        document.getElementById('fc-variant-thumbs').innerHTML = thumbsHtml;
    }

    function closeDetail() {
        document.getElementById('fc-detail-overlay').style.display = 'none';
        unlockScroll();
        selectedProduct = null;
        selectedVariantIndex = 0;
        detailQty = 1;
    }

    // ==========================================
    // Cart Management
    // ==========================================

    function addToCart() {
        if (!selectedProduct) return;

        var variant = selectedProduct.variants[selectedVariantIndex];
        var key = variant.variantId;

        // Check if already in cart
        var existing = null;
        for (var i = 0; i < cart.length; i++) {
            if (cart[i].variantId === key) {
                existing = cart[i];
                break;
            }
        }

        if (existing) {
            existing.qty += detailQty;
        } else {
            cart.push({
                productId: selectedProduct.id,
                variantId: variant.variantId,
                name: selectedProduct.name,
                color: variant.color,
                price: selectedProduct.price,
                image: variant.image,
                type: selectedProduct.type,
                pattern: variant.pattern,
                giftable: selectedProduct.giftable,
                qty: detailQty,
                metadata: {
                    productId: selectedProduct.id,
                    variantId: variant.variantId,
                    type: selectedProduct.type,
                    color: variant.color,
                    pattern: variant.pattern
                }
            });
        }

        updateCartBadge();
        showToast(detailQty + 'x ' + selectedProduct.name + ' added!');
        closeDetail();
    }

    function removeFromCart(variantId) {
        cart = cart.filter(function(item) {
            return item.variantId !== variantId;
        });
        updateCartBadge();
        renderCartItems();
    }

    function updateCartItemQty(variantId, delta) {
        for (var i = 0; i < cart.length; i++) {
            if (cart[i].variantId === variantId) {
                cart[i].qty = Math.max(1, cart[i].qty + delta);
                break;
            }
        }
        updateCartBadge();
        renderCartItems();
    }

    function updateCartBadge() {
        var badge = document.querySelector('.fc-cart-badge');
        var count = getCartCount();
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    // ==========================================
    // Cart Dropdown Rendering
    // ==========================================

    function toggleCart() {
        var dropdown = document.getElementById('fc-cart-dropdown');
        var isOpen = dropdown.style.display !== 'none';
        if (isOpen) {
            dropdown.style.display = 'none';
        } else {
            renderCartItems();
            dropdown.style.display = 'flex';
            // Position relative to visible area
            var scrollParent = dropdown.closest('.browser-page') || dropdown.parentElement;
            var scrollTop = scrollParent ? scrollParent.scrollTop : 0;
            dropdown.style.top = (scrollTop + 60) + 'px';
        }
    }

    function renderCartItems() {
        var container = document.getElementById('fc-cart-items');
        var footer = document.getElementById('fc-cart-footer');

        if (cart.length === 0) {
            container.innerHTML = '<div class="fc-cart-empty">' +
                mdi('cart-outline') +
                'Your cart is empty!<br>Time to treat yourself.' +
                '</div>';
            footer.style.display = 'none';
            return;
        }

        var html = '';
        for (var i = 0; i < cart.length; i++) {
            var item = cart[i];
            html += '<div class="fc-cart-item">';
            html += '<img class="fc-cart-item-img" src="' + getImagePath(item.image) + '" alt="">';
            html += '<div class="fc-cart-item-info">';
            html += '<div class="fc-cart-item-name">' + item.name + '</div>';
            html += '<div class="fc-cart-item-color">' + item.color + '</div>';
            html += '<div class="fc-cart-item-price">' + snakes(item.price * item.qty) + '</div>';
            html += '</div>';
            html += '<div class="fc-cart-item-qty">';
            html += '<button data-action="cart-qty" data-variant="' + item.variantId + '" data-delta="-1">−</button>';
            html += '<span>' + item.qty + '</span>';
            html += '<button data-action="cart-qty" data-variant="' + item.variantId + '" data-delta="1">+</button>';
            html += '</div>';
            html += '<button class="fc-cart-item-remove" data-action="cart-remove" data-variant="' + item.variantId + '">' + mdi('close') + '</button>';
            html += '</div>';
        }

        container.innerHTML = html;
        footer.style.display = 'block';
        document.getElementById('fc-cart-subtotal').textContent = snakes(getCartTotal());
    }

    // ==========================================
    // Checkout Flow (Payment System)
    // ==========================================

    function startCheckout() {
        if (cart.length === 0) return;

        var totalSnakes = (getCartTotal() * 2).toFixed(2);
        var itemCount = getCartCount();

        // Snapshot cart before payment
        var purchasedCart = cart.slice();

        // Set up payment listener BEFORE opening dialog
        var handler = function(e) {
            if (e.detail && e.detail.productName === 'Scales & Tails Order') {
                document.removeEventListener('elxa-payment-complete', handler);

                // Add all items to inventory
                if (typeof elxaOS !== 'undefined' && elxaOS.inventoryService) {
                    for (var i = 0; i < purchasedCart.length; i++) {
                        var item = purchasedCart[i];
                        try {
                            elxaOS.inventoryService.addItems(item.variantId, {
                                name: item.name + ' (' + item.color + ')',
                                subcategory: 'fashion',
                                unitPrice: item.price,
                                giftable: item.giftable,
                                metadata: item.metadata
                            }, item.qty);
                        } catch (err) {
                            console.warn('[FashionCo] Could not add item:', item.name, err);
                        }
                    }
                }

                // Emit order event for receipt email
                if (typeof elxaOS !== 'undefined' && elxaOS.eventBus) {
                    var orderItems = [];
                    var orderTotal = 0;
                    for (var oi = 0; oi < purchasedCart.length; oi++) {
                        var oit = purchasedCart[oi];
                        orderTotal += oit.price * oit.qty;
                        orderItems.push({
                            name: oit.name,
                            color: oit.color,
                            qty: oit.qty,
                            price: oit.price
                        });
                    }
                    elxaOS.eventBus.emit('fashionco.orderComplete', {
                        items: orderItems,
                        total: orderTotal,
                        itemCount: purchasedCart.reduce(function(sum, it) { return sum + it.qty; }, 0)
                    });
                }

                // Show delivery ceremony
                showDeliveryCeremony(purchasedCart, getCartTotalFromList(purchasedCart));

                // Clear cart
                cart = [];
                updateCartBadge();
                document.getElementById('fc-cart-dropdown').style.display = 'none';
            }
        };

        document.addEventListener('elxa-payment-complete', handler);

        // Open the payment dialog
        purchaseProduct({
            name: 'Scales & Tails Order',
            price: '§' + totalSnakes,
            description: itemCount + ' item' + (itemCount > 1 ? 's' : '') + ' from Scales & Tails Fashion Co.'
        });
    }

    function getCartTotalFromList(cartList) {
        var total = 0;
        for (var i = 0; i < cartList.length; i++) {
            total += cartList[i].price * cartList[i].qty;
        }
        return total;
    }

    function showDeliveryCeremony(cartItems, totalUSD) {
        var overlay = document.getElementById('fc-ceremony-overlay');

        var itemList = '';
        for (var i = 0; i < cartItems.length; i++) {
            var oi = cartItems[i];
            var label = oi.name + ' (' + oi.color + ')';
            if (oi.qty > 1) label += ' x' + oi.qty;
            itemList += label + '<br>';
        }

        var html = '<div class="fc-delivery-panel" style="position:relative;overflow:hidden;">';

        // Sparkles
        var sparklePositions = [
            { top: 8, left: 10 }, { top: 12, right: 15 },
            { top: 60, left: 20 }, { top: 55, right: 25 }
        ];
        for (var s = 0; s < sparklePositions.length; s++) {
            var sp = sparklePositions[s];
            var style = 'top:' + sp.top + '%;';
            if (sp.left !== undefined) style += 'left:' + sp.left + '%;';
            if (sp.right !== undefined) style += 'right:' + sp.right + '%;';
            style += 'animation-delay:' + (s * 0.3) + 's;';
            html += '<span class="fc-sparkle" style="' + style + '">✨</span>';
        }

        html += mdi('package-variant-closed');
        html += '<h3>Order Delivered!</h3>';
        html += '<p>Your Scales & Tails package has arrived — styled, folded, and fabulous.</p>';
        html += '<div class="fc-delivery-items">' + itemList + '</div>';
        html += '<p style="font-size:12px;color:var(--fc-sage);margin-bottom:16px;">Total charged: ' + snakes(totalUSD) + '</p>';
        html += '<button class="fc-delivery-dismiss" data-action="dismiss-ceremony">Love it!</button>';
        html += '</div>';

        overlay.innerHTML = html;
        overlay.style.display = 'flex';
        positionOverlay(overlay);
        lockScroll();
    }
    // Toast
    // ==========================================

    function showToast(message) {
        // Remove existing toast
        var existing = document.querySelector('.fc-toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.className = 'fc-toast';
        toast.textContent = message;
        var app = document.querySelector('.fashionco-app');
        app.appendChild(toast);

        // Position in visible area
        var scrollParent = toast.closest('.browser-page') || toast.parentElement;
        var scrollTop = scrollParent ? scrollParent.scrollTop : 0;
        var viewHeight = scrollParent ? scrollParent.clientHeight : 400;
        toast.style.bottom = 'auto';
        toast.style.top = (scrollTop + viewHeight - 60) + 'px';

        requestAnimationFrame(function() {
            toast.classList.add('show');
        });

        setTimeout(function() {
            toast.classList.remove('show');
            setTimeout(function() { toast.remove(); }, 300);
        }, 2000);
    }

    // ==========================================
    // Event Delegation
    // ==========================================

    document.addEventListener('click', function(e) {
        var target = e.target.closest('[data-action]');
        if (!target) return;

        var action = target.getAttribute('data-action');

        switch (action) {
            case 'open-detail':
                var productId = target.getAttribute('data-product');
                openDetail(productId);
                break;

            case 'close-detail':
                closeDetail();
                break;

            case 'select-variant':
                var idx = parseInt(target.getAttribute('data-index'), 10);
                selectedVariantIndex = idx;
                renderDetail();
                break;

            case 'qty-minus':
                detailQty = Math.max(1, detailQty - 1);
                document.getElementById('fc-qty-value').textContent = detailQty;
                break;

            case 'qty-plus':
                detailQty = Math.min(99, detailQty + 1);
                document.getElementById('fc-qty-value').textContent = detailQty;
                break;

            case 'add-to-cart':
                addToCart();
                break;

            case 'toggle-cart':
                toggleCart();
                break;

            case 'cart-qty':
                var variantId = target.getAttribute('data-variant');
                var delta = parseInt(target.getAttribute('data-delta'), 10);
                updateCartItemQty(variantId, delta);
                break;

            case 'cart-remove':
                var variantId = target.getAttribute('data-variant');
                removeFromCart(variantId);
                break;

            case 'checkout':
                startCheckout();
                break;

            case 'dismiss-ceremony':
                document.getElementById('fc-ceremony-overlay').style.display = 'none';
                unlockScroll();
                break;
        }
    });

    // Close detail on overlay background click
    document.addEventListener('click', function(e) {
        if (e.target.id === 'fc-detail-overlay') {
            closeDetail();
        }
    });

    // Department tabs
    document.addEventListener('click', function(e) {
        var tab = e.target.closest('.fc-dept-tab');
        if (!tab) return;

        selectedDepartment = tab.getAttribute('data-dept');

        // Update active state
        var tabs = document.querySelectorAll('.fc-dept-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.remove('active');
        }
        tab.classList.add('active');

        renderGrid();
    });

    // ==========================================
    // Init
    // ==========================================

    renderGrid();
    console.log('🐍 Scales & Tails Fashion Co. loaded — ' + FASHION_PRODUCTS.length + ' products, ' +
        FASHION_PRODUCTS.reduce(function(sum, p) { return sum + p.variants.length; }, 0) + ' variants');

})();
