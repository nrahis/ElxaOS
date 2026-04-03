// =======================================
// SQUIGGLY WIGGLY STORE
// Depends on: squiggly-products.js, payment-system.js
// =======================================
window.SquigglyStore = {
    cart: [],           // [{product, quantity}]
    activeDept: 'all',  // current department filter

    init: function() {
        this.renderDepartments();
        this.renderProducts();
        this.renderCart();
    },

    // ===== SERVICE HELPERS =====
    _inventoryReady: function() {
        return typeof elxaOS !== 'undefined' &&
               elxaOS.inventoryService &&
               elxaOS.inventoryService._ready;
    },

    // ===== DEPARTMENTS =====
    renderDepartments: function() {
        var nav = document.getElementById('sqDeptNav');
        if (!nav) return;
        var self = this;
        var html = '';

        // "All" button
        html += '<button class="sq-dept-btn' + (this.activeDept === 'all' ? ' active' : '') + '" onclick="SquigglyStore.filterDept(\'all\')">';
        html += '<span class="mdi mdi-storefront-outline"></span> All';
        html += '</button>';

        for (var i = 0; i < SQUIGGLY_DEPARTMENTS.length; i++) {
            var d = SQUIGGLY_DEPARTMENTS[i];
            var isActive = this.activeDept === d.id ? ' active' : '';
            html += '<button class="sq-dept-btn' + isActive + '" onclick="SquigglyStore.filterDept(\'' + d.id + '\')">';
            html += '<span class="mdi ' + d.icon + '"></span> ' + d.name;
            html += '</button>';
        }

        nav.innerHTML = html;
    },

    filterDept: function(deptId) {
        this.activeDept = deptId;
        this.renderDepartments();
        this.renderProducts();
    },

    // ===== PRODUCTS =====
    renderProducts: function() {
        var container = document.getElementById('sqProducts');
        if (!container) return;

        var products = SQUIGGLY_PRODUCTS;
        if (this.activeDept !== 'all') {
            products = products.filter(function(p) { return p.department === SquigglyStore.activeDept; });
        }

        var html = '';
        for (var i = 0; i < products.length; i++) {
            var p = products[i];
            var cartQty = this.getCartQty(p.id);
            var tag = '';
            if (p.tags && p.tags.length > 0) {
                tag = '<span class="sq-tag ' + p.tags[0] + '">' + p.tags[0] + '</span>';
            }
            var btnClass = cartQty > 0 ? 'sq-add-btn in-cart' : 'sq-add-btn';
            var btnText = cartQty > 0 ? '<span class="mdi mdi-cart-check"></span> ' + cartQty + ' in cart' : '<span class="mdi mdi-cart-plus"></span> Add';

            html += '<div class="sq-product-card">';
            html += tag;
            html += '<div class="sq-product-icon"><span class="mdi ' + p.icon + '"></span></div>';
            html += '<div class="sq-product-name">' + p.name + '</div>';
            html += '<div class="sq-product-brand">' + p.brand + '</div>';
            html += '<div class="sq-product-desc">' + p.description + '</div>';
            html += '<div class="sq-product-bottom">';
            html += '<span class="sq-product-price">' + p.priceDisplay + '</span>';
            html += '<button class="' + btnClass + '" onclick="SquigglyStore.addToCart(\'' + p.id + '\')">' + btnText + '</button>';
            html += '</div>';
            html += '</div>';
        }

        container.innerHTML = html;
    },

    // ===== CART MANAGEMENT =====
    getCartQty: function(productId) {
        for (var i = 0; i < this.cart.length; i++) {
            if (this.cart[i].product.id === productId) return this.cart[i].quantity;
        }
        return 0;
    },

    _findProduct: function(productId) {
        for (var i = 0; i < SQUIGGLY_PRODUCTS.length; i++) {
            if (SQUIGGLY_PRODUCTS[i].id === productId) return SQUIGGLY_PRODUCTS[i];
        }
        return null;
    },

    addToCart: function(productId) {
        var product = this._findProduct(productId);
        if (!product) return;
        for (var i = 0; i < this.cart.length; i++) {
            if (this.cart[i].product.id === productId) {
                this.cart[i].quantity++;
                this.renderCart();
                this.renderProducts();
                return;
            }
        }
        this.cart.push({ product: product, quantity: 1 });
        this.renderCart();
        this.renderProducts();
    },

    changeQty: function(productId, delta) {
        for (var i = 0; i < this.cart.length; i++) {
            if (this.cart[i].product.id === productId) {
                this.cart[i].quantity += delta;
                if (this.cart[i].quantity <= 0) {
                    this.cart.splice(i, 1);
                }
                this.renderCart();
                this.renderProducts();
                return;
            }
        }
    },

    getCartTotal: function() {
        var total = 0;
        for (var i = 0; i < this.cart.length; i++) {
            total += this.cart[i].product.price * this.cart[i].quantity;
        }
        return total;
    },

    getCartTotalDisplay: function() {
        return (this.getCartTotal() * 2).toFixed(2);
    },

    getCartItemCount: function() {
        var count = 0;
        for (var i = 0; i < this.cart.length; i++) {
            count += this.cart[i].quantity;
        }
        return count;
    },

    // ===== CART RENDERING =====
    renderCart: function() {
        var itemsEl = document.getElementById('sqCartItems');
        var footerEl = document.getElementById('sqCartFooter');
        var totalEl = document.getElementById('sqCartTotal');
        if (!itemsEl) return;

        if (this.cart.length === 0) {
            itemsEl.innerHTML = '<div class="sq-cart-empty">' +
                '<span class="mdi mdi-cart-off" style="font-size: 36px; opacity: 0.3;"></span>' +
                '<p>Your cart is empty!</p>' +
                '<p style="font-size: 12px; opacity: 0.6;">Start shopping!</p>' +
                '</div>';
            if (footerEl) footerEl.style.display = 'none';
            return;
        }

        var html = '';
        for (var i = 0; i < this.cart.length; i++) {
            var item = this.cart[i];
            var lineTotal = (item.product.price * item.quantity * 2).toFixed(2);
            html += '<div class="sq-cart-item">';
            html += '<div class="sq-cart-item-info">';
            html += '<div class="sq-cart-item-name">' + item.product.name + '</div>';
            html += '<div class="sq-cart-item-price">\u00A7' + lineTotal + '</div>';
            html += '</div>';
            html += '<div class="sq-cart-qty">';
            html += '<button onclick="SquigglyStore.changeQty(\'' + item.product.id + '\', -1)">-</button>';
            html += '<span>' + item.quantity + '</span>';
            html += '<button onclick="SquigglyStore.changeQty(\'' + item.product.id + '\', 1)">+</button>';
            html += '</div>';
            html += '</div>';
        }

        itemsEl.innerHTML = html;
        if (footerEl) footerEl.style.display = 'block';
        if (totalEl) totalEl.textContent = '\u00A7' + this.getCartTotalDisplay();
    },

    // ===== CHECKOUT & PAYMENT =====
    checkout: function() {
        if (this.cart.length === 0) return;

        var itemCount = this.getCartItemCount();
        var totalDisplay = '\u00A7' + this.getCartTotalDisplay();

        // Set up payment listener BEFORE opening dialog
        this._setupPaymentListener();

        // Open the payment dialog
        purchaseProduct({
            name: 'Squiggly Wiggly Order',
            price: totalDisplay,
            description: itemCount + ' item' + (itemCount > 1 ? 's' : '') + ' from Squiggly Wiggly'
        });
    },

    _setupPaymentListener: function() {
        var self = this;
        var purchasedItems = this.cart.slice(); // snapshot cart at time of purchase

        var handler = function(e) {
            if (e.detail && e.detail.productName === 'Squiggly Wiggly Order') {
                document.removeEventListener('elxa-payment-complete', handler);

                // Add all items to inventory
                if (self._inventoryReady()) {
                    for (var i = 0; i < purchasedItems.length; i++) {
                        var item = purchasedItems[i];
                        try {
                            elxaOS.inventoryService.addItems(item.product.id, {
                                name: item.product.name,
                                subcategory: 'groceries',
                                unitPrice: item.product.price,
                                brand: item.product.brand,
                                giftable: true,
                                image: null
                            }, item.quantity);
                        } catch (err) {
                            console.warn('[Squiggly] Could not add item:', item.product.name, err);
                        }
                    }
                    console.log('[Squiggly] Added ' + purchasedItems.length + ' products to inventory');

                    // Emit order complete event for receipt email
                    if (typeof elxaOS !== 'undefined' && elxaOS.eventBus) {
                        var orderTotal = 0;
                        var orderItems = [];
                        for (var oi = 0; oi < purchasedItems.length; oi++) {
                            var oit = purchasedItems[oi];
                            orderTotal += oit.product.price * oit.quantity;
                            orderItems.push({
                                name: oit.product.name,
                                quantity: oit.quantity,
                                unitPrice: oit.product.price,
                                brand: oit.product.brand
                            });
                        }
                        elxaOS.eventBus.emit('squiggly.orderComplete', {
                            items: orderItems,
                            total: orderTotal,
                            itemCount: purchasedItems.length
                        });
                    }
                }

                // Show delivery ceremony
                self.showDelivery(purchasedItems);

                // Clear cart
                self.cart = [];
                self.renderCart();
                self.renderProducts();
            }
        };

        document.addEventListener('elxa-payment-complete', handler);
    },

    // ===== DELIVERY CEREMONY =====
    showDelivery: function(items) {
        var overlay = document.getElementById('sqDeliveryOverlay');
        if (!overlay) return;

        var itemLines = '';
        for (var i = 0; i < items.length; i++) {
            var it = items[i];
            itemLines += it.quantity + 'x ' + it.product.name + '<br>';
        }

        var html = '<div class="sq-delivery-box">';
        html += '<div class="sq-delivery-icon"><span class="mdi mdi-truck-check"></span></div>';
        html += '<div class="sq-delivery-title">Order Delivered!</div>';
        html += '<div class="sq-delivery-sub">Your Squiggly Wiggly order has arrived.</div>';
        html += '<div class="sq-delivery-items">' + itemLines + '</div>';
        html += '<button class="sq-delivery-dismiss" onclick="SquigglyStore.dismissDelivery()">Thanks, Squiggly!</button>';
        html += '</div>';

        overlay.innerHTML = html;
        overlay.style.display = 'flex';
    },

    dismissDelivery: function() {
        var overlay = document.getElementById('sqDeliveryOverlay');
        if (overlay) {
            overlay.style.display = 'none';
            overlay.innerHTML = '';
        }
    }
};

// ===== AUTO-INIT =====
(function() {
    if (typeof SQUIGGLY_PRODUCTS !== 'undefined') {
        SquigglyStore.init();
    } else {
        console.warn('[Squiggly] Product catalog not loaded');
    }
})();
