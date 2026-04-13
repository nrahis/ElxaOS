// =================================
// INVENTORY SERVICE — Ownership Tracking for ElxaOS
// =================================
// Per-user ownership service that tracks what the player has:
// properties, vehicles, game licenses, trading cards, stock holdings,
// and service subscriptions.
//
// Works alongside FinanceService — inventory tracks WHAT you own,
// finance tracks HOW you're paying for it. Items can carry a
// linkedFinanceId for cross-referencing.
//
// STORAGE: All data in registry user state under `inventory`
// EVENTS:  All changes emit events via elxaOS.eventBus
//
// USAGE:
//   await elxaOS.inventoryService.addItem('cards', { cardId: 'SCE-001', name: 'Snakey', rarity: 'common' });
//   const props = elxaOS.inventoryService.getItems('properties');
//   await elxaOS.inventoryService.acquireProperty(propertyData, 'mortgaged', { loanId: 'loan-...' });
//   const summary = elxaOS.inventoryService.getOwnershipSummary();
// =================================

// Property tax rate tiers (annual, by property value)
const PROPERTY_TAX_TIERS = [
    { maxValue: 5000,   rate: 0.008 },  // Under $5,000 → 0.8%
    { maxValue: 15000,  rate: 0.012 },  // $5,000–$15,000 → 1.2%
    { maxValue: 30000,  rate: 0.015 },  // $15,000–$30,000 → 1.5%
    { maxValue: Infinity, rate: 0.020 } // Over $30,000 → 2.0%
];

// Valid inventory categories
const INVENTORY_CATEGORIES = ['properties', 'vehicles', 'games', 'cards', 'stocks', 'subscriptions', 'tickets', 'items'];

class InventoryService {
    constructor(eventBus, registry) {
        this.eventBus = eventBus;
        this.registry = registry;

        // In-memory cache of the current user's inventory data
        this._data = null;
        this._ready = false;

        this._setupEventListeners();

        console.log('\u{1f4e6} InventoryService initialized');
    }

    // =================================
    // LIFECYCLE
    // =================================

    _setupEventListeners() {
        // Load inventory data when a user logs in
        this.eventBus.on('registry.userLoaded', async () => {
            await this._loadInventoryData();
        });

        // Clear cache on logout
        this.eventBus.on('login.logout', () => {
            this._data = null;
            this._ready = false;
        });

        // Listen for finance events that affect inventory
        this._setupFinanceListeners();
    }

    /**
     * Called during ElxaOS async init. If a user is already logged in
     * (session restore), load inventory data immediately.
     */
    async init() {
        if (this.registry.isLoggedIn()) {
            await this._loadInventoryData();
        }
        console.log('\u{1f4e6} InventoryService ready');
    }

    // =================================
    // DATA LOADING
    // =================================

    async _loadInventoryData() {
        const username = this.registry.getCurrentUsername();
        if (!username) return;

        const existing = await this.registry.getState('inventory');

        if (existing) {
            this._data = existing;
            // Ensure all categories exist (forward compatibility)
            for (const cat of INVENTORY_CATEGORIES) {
                if (!this._data[cat]) this._data[cat] = [];
            }
            this._ready = true;
            const totalItems = INVENTORY_CATEGORIES.reduce((sum, cat) => sum + this._data[cat].length, 0);
            console.log(`\u{1f4e6} Inventory loaded for "${username}" \u2014 ${totalItems} items across ${INVENTORY_CATEGORIES.length} categories`);
        } else {
            // First time — create empty inventory
            this._data = {};
            for (const cat of INVENTORY_CATEGORIES) {
                this._data[cat] = [];
            }
            await this._save();
            this._ready = true;
            console.log(`\u{1f4e6} Created empty inventory for "${username}"`);
        }
    }

    async _save() {
        if (!this._data) return;
        await this.registry.setState('inventory', this._data);
    }

    _ensureReady() {
        if (!this._ready) {
            console.warn('\u{1f4e6} InventoryService: not ready (no user logged in?)');
            return false;
        }
        return true;
    }

    // =================================
    // GENERIC CRUD
    // =================================

    /**
     * Add an item to a category. Auto-generates an ID if missing.
     * @param {string} category - One of INVENTORY_CATEGORIES
     * @param {object} item - The item data
     * @returns {object|null} The added item (with generated ID), or null on failure
     */
    async addItem(category, item) {
        if (!this._ensureReady()) return null;
        if (!INVENTORY_CATEGORIES.includes(category)) {
            console.warn(`\u{1f4e6} Invalid category: "${category}"`);
            return null;
        }

        // Auto-generate ID if not provided
        if (!item.id) {
            item.id = `${category.slice(0, -1)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        }

        this._data[category].push(item);
        await this._save();

        this.eventBus.emit(`inventory.itemAdded`, { category, item });
        console.log(`\u{1f4e6} Added ${category} item: ${item.name || item.id}`);

        return item;
    }

    /**
     * Remove an item from a category.
     * @param {string} category
     * @param {string} itemId
     * @param {string} [reason] - Optional reason (e.g., 'sold', 'traded', 'repossessed')
     * @returns {object|null} The removed item, or null if not found
     */
    async removeItem(category, itemId, reason) {
        if (!this._ensureReady()) return null;
        if (!INVENTORY_CATEGORIES.includes(category)) return null;

        const index = this._data[category].findIndex(i => i.id === itemId);
        if (index === -1) {
            console.warn(`\u{1f4e6} Item not found: ${category}/${itemId}`);
            return null;
        }

        const [removed] = this._data[category].splice(index, 1);
        await this._save();

        this.eventBus.emit(`inventory.itemRemoved`, { category, item: removed, reason });
        console.log(`\u{1f4e6} Removed ${category} item: ${removed.name || removed.id} (${reason || 'no reason'})`);

        return removed;
    }

    /**
     * Update fields on an existing item.
     * @param {string} category
     * @param {string} itemId
     * @param {object} updates - Fields to merge into the item
     * @returns {object|null} The updated item, or null if not found
     */
    async updateItem(category, itemId, updates) {
        if (!this._ensureReady()) return null;
        if (!INVENTORY_CATEGORIES.includes(category)) return null;

        const item = this._data[category].find(i => i.id === itemId);
        if (!item) {
            console.warn(`\u{1f4e6} Item not found for update: ${category}/${itemId}`);
            return null;
        }

        Object.assign(item, updates);
        await this._save();

        this.eventBus.emit(`inventory.itemUpdated`, { category, item, updates });
        return item;
    }

    /**
     * Get all items in a category (sync, returns array reference).
     */
    getItems(category) {
        if (!this._ensureReady()) return [];
        if (!INVENTORY_CATEGORIES.includes(category)) return [];
        return this._data[category] || [];
    }

    /**
     * Get a single item by ID.
     */
    getItem(category, itemId) {
        if (!this._ensureReady()) return null;
        if (!INVENTORY_CATEGORIES.includes(category)) return null;
        return this._data[category].find(i => i.id === itemId) || null;
    }

    /**
     * Quick check if an item exists.
     */
    hasItem(category, itemId) {
        return this.getItem(category, itemId) !== null;
    }

    // =================================
    // PROPERTY-SPECIFIC METHODS
    // =================================

    getProperties() {
        return this.getItems('properties');
    }

    getOwnedProperties() {
        return this.getProperties().filter(p => p.ownership !== 'rented');
    }

    getRentedProperties() {
        return this.getProperties().filter(p => p.ownership === 'rented');
    }

    getPrimaryResidence() {
        return this.getProperties().find(p => p.isPrimaryResidence) || null;
    }

    /**
     * Calculate the property tax rate for a given value.
     */
    getPropertyTaxRate(value) {
        for (const tier of PROPERTY_TAX_TIERS) {
            if (value <= tier.maxValue) return tier.rate;
        }
        return PROPERTY_TAX_TIERS[PROPERTY_TAX_TIERS.length - 1].rate;
    }

    /**
     * Acquire a new property. Handles tax calculation and finance wiring.
     * @param {object} propertyData - Property info (name, neighborhood, purchasePrice, etc.)
     * @param {string} ownership - 'owned', 'mortgaged', or 'rented'
     * @param {object} [financeIds] - { loanId, rentPaymentId } cross-references
     * @returns {object|null} The created property item
     */
    async acquireProperty(propertyData, ownership, financeIds = {}) {
        if (!this._ensureReady()) return null;

        const value = propertyData.purchasePrice || propertyData.currentValue || 0;
        const taxRate = (ownership === 'rented') ? 0 : this.getPropertyTaxRate(value);
        const annualTax = Math.round(value * taxRate * 100) / 100;
        const monthlyTax = Math.round((annualTax / 12) * 100) / 100;

        // Check if this should be primary residence (first property, or no current primary)
        const existingPrimary = this.getPrimaryResidence();
        const isPrimary = !existingPrimary;

        const property = {
            id: propertyData.id || `prop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            propertyId: propertyData.propertyId || null,
            name: propertyData.name,
            neighborhood: propertyData.neighborhood || '',
            ownership: ownership,
            purchasePrice: (ownership === 'rented') ? null : value,
            currentValue: value,
            isPrimaryResidence: isPrimary,
            acquiredDate: new Date().toISOString().split('T')[0],

            // Finance cross-references
            loanId: financeIds.loanId || null,
            rentPaymentId: financeIds.rentPaymentId || null,

            // Taxes (not for rentals)
            taxRate: taxRate,
            annualTax: annualTax,
            monthlyTax: monthlyTax,
            taxPaymentId: null, // legacy field — taxes processed directly by finance-cycle step 6.25
            totalTaxPaid: 0,    // running total of all tax collected on this property
            taxesMissed: 0,     // consecutive missed tax payments (3 → forced sale)

            // Metadata
            bedrooms: propertyData.bedrooms || null,
            image: propertyData.image || null
        };

        this._data.properties.push(property);
        await this._save();

        // NOTE: Property taxes are processed directly by finance-cycle.js step 6.25
        // (_processPropertyTaxes), NOT via the recurring payments system.
        // This avoids double-charging.

        this.eventBus.emit('inventory.propertyAcquired', { property, ownership });
        if (isPrimary) {
            this.eventBus.emit('inventory.primaryResidenceChanged', { propertyId: property.id });
        }
        console.log(`\u{1f3e0} Property acquired: ${property.name} (${ownership})`);

        return property;
    }

    /**
     * Remove a property (sold, repossessed, evicted).
     * Cleans up linked finance records.
     */
    async loseProperty(propertyId, reason = 'sold') {
        if (!this._ensureReady()) return null;

        const property = this.getItem('properties', propertyId);
        if (!property) {
            console.warn(`\u{1f4e6} Property not found: ${propertyId}`);
            return null;
        }

        // Cancel linked recurring payments (rent, taxes)
        await this._cancelLinkedPayments(property);

        // If this was primary residence, reassign
        const wasPrimary = property.isPrimaryResidence;

        // Remove from inventory
        const removed = await this.removeItem('properties', propertyId, reason);

        // Reassign primary residence if needed
        if (wasPrimary) {
            const remaining = this.getProperties();
            if (remaining.length > 0) {
                remaining[0].isPrimaryResidence = true;
                await this._save();
                this.eventBus.emit('inventory.primaryResidenceChanged', { propertyId: remaining[0].id });
            }
        }

        this.eventBus.emit('inventory.propertyLost', { propertyId, reason });
        console.log(`\u{1f3e0} Property lost: ${property.name} (${reason})`);

        return removed;
    }

    /**
     * Cancel linked recurring payments for a property.
     */
    async _cancelLinkedPayments(property) {
        try {
            if (typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService._ready) {
                // Cancel rent payment
                if (property.rentPaymentId) {
                    await elxaOS.financeService.cancelRecurringPayment(property.rentPaymentId);
                }
            }
        } catch (err) {
            console.warn('\u{1f4e6} Error cancelling linked payments:', err);
        }
    }

    /**
     * Set a property as the primary residence.
     */
    async setPrimaryResidence(propertyId) {
        if (!this._ensureReady()) return false;

        const property = this.getItem('properties', propertyId);
        if (!property) return false;

        // Clear any existing primary
        for (const p of this._data.properties) {
            p.isPrimaryResidence = false;
        }
        property.isPrimaryResidence = true;
        await this._save();

        this.eventBus.emit('inventory.primaryResidenceChanged', { propertyId });
        return true;
    }

    /**
     * Recalculate taxes for a property (e.g., after value change).
     */
    async recalculatePropertyTax(propertyId) {
        const property = this.getItem('properties', propertyId);
        if (!property || property.ownership === 'rented') return null;

        const newRate = this.getPropertyTaxRate(property.currentValue);
        const newAnnualTax = Math.round(property.currentValue * newRate * 100) / 100;
        const newMonthlyTax = Math.round((newAnnualTax / 12) * 100) / 100;

        property.taxRate = newRate;
        property.annualTax = newAnnualTax;
        property.monthlyTax = newMonthlyTax;

        // No recurring payment to update — taxes are processed directly
        // by finance-cycle.js step 6.25 using property.monthlyTax

        await this._save();
        return property;
    }

    /**
     * Record a successful tax payment for a property.
     * Called by finance-cycle.js when monthly tax is processed.
     * @param {string} propertyId
     * @param {number} amount - The tax amount that was paid
     */
    async recordTaxPayment(propertyId, amount) {
        const property = this.getItem('properties', propertyId);
        if (!property) return null;

        property.totalTaxPaid = (property.totalTaxPaid || 0) + amount;
        property.taxesMissed = 0; // reset consecutive misses on successful payment
        await this._save();

        console.log(`\u{1f3e0} Tax payment recorded: ${amount} for ${property.name} (total: ${property.totalTaxPaid})`);
        return property;
    }

    /**
     * Record a missed tax payment. 3 consecutive misses → forced sale.
     * Called by finance-cycle.js when tax payment fails (insufficient funds).
     * @param {string} propertyId
     * @returns {object} { property, missedCount, forcedSale }
     */
    async recordMissedTaxPayment(propertyId) {
        const property = this.getItem('properties', propertyId);
        if (!property) return null;

        property.taxesMissed = (property.taxesMissed || 0) + 1;
        await this._save();

        const result = { property, missedCount: property.taxesMissed, forcedSale: false };

        if (property.taxesMissed >= 3) {
            console.log(`\u{1f4e6} 3 consecutive missed tax payments — forced sale of ${property.name}`);
            await this.loseProperty(property.id, 'tax-lien');
            result.forcedSale = true;
        } else {
            console.log(`\u{1f4e6} Missed tax payment ${property.taxesMissed}/3 for ${property.name}`);
        }

        return result;
    }

    /**
     * Get total tax paid across all properties (lifetime).
     */
    getTotalTaxPaid() {
        return this.getProperties().reduce((sum, p) => sum + (p.totalTaxPaid || 0), 0);
    }

    /**
     * Get tax stats — useful for future features (tax refunds, deductions, etc.)
     */
    getTaxStats() {
        const properties = this.getProperties();
        return {
            totalTaxPaid: properties.reduce((sum, p) => sum + (p.totalTaxPaid || 0), 0),
            monthlyTaxBurden: properties.reduce((sum, p) => sum + (p.monthlyTax || 0), 0),
            byProperty: properties.filter(p => p.ownership !== 'rented').map(p => ({
                id: p.id,
                name: p.name,
                monthlyTax: p.monthlyTax,
                totalPaid: p.totalTaxPaid || 0,
                missedPayments: p.taxesMissed || 0
            }))
        };
    }

    // =================================
    // GAME-SPECIFIC METHODS
    // =================================

    getGames() {
        return this.getItems('games');
    }

    /**
     * Find a game license by gameId (not the instance ID).
     */
    getGameLicense(gameId) {
        return this.getGames().find(g => g.gameId === gameId) || null;
    }

    /**
     * Add a new game license (first purchase).
     * @param {string} gameId - The game identifier (matches .abby installer ID)
     * @param {object} gameData - { name, purchasePrice, ... }
     * @returns {object|null} The created game license
     */
    async addGameLicense(gameId, gameData = {}) {
        if (!this._ensureReady()) return null;

        // Check if license already exists
        const existing = this.getGameLicense(gameId);
        if (existing) {
            // Already owns it — add a copy instead
            return await this.addGameCopy(gameId);
        }

        const game = {
            id: `game-${gameId}`,
            gameId: gameId,
            name: gameData.name || gameId,
            copies: 1,
            installed: false,
            installedProgramId: null,
            purchaseDate: new Date().toISOString().split('T')[0],
            purchasePrice: gameData.purchasePrice || 0,
            giftable: 1 // 1 copy, not installed → 1 giftable
        };

        this._data.games.push(game);
        await this._save();

        this.eventBus.emit('inventory.gameAcquired', { game, copies: 1 });
        console.log(`\u{1f3ae} Game license acquired: ${game.name}`);

        return game;
    }

    /**
     * Add another copy of an already-owned game.
     */
    async addGameCopy(gameId) {
        const game = this.getGameLicense(gameId);
        if (!game) {
            console.warn(`\u{1f4e6} No license found for game: ${gameId}`);
            return null;
        }

        game.copies++;
        game.giftable = game.copies - (game.installed ? 1 : 0);
        await this._save();

        this.eventBus.emit('inventory.gameCopyAdded', { gameId, newCopyCount: game.copies });
        console.log(`\u{1f3ae} Extra copy added for ${game.name} (now ${game.copies} copies)`);

        return game;
    }

    /**
     * Mark a game as installed (called when installer service finishes).
     */
    async markGameInstalled(gameId, installedProgramId) {
        const game = this.getGameLicense(gameId);
        if (!game) return null;

        game.installed = true;
        game.installedProgramId = installedProgramId || null;
        game.giftable = game.copies - 1; // one copy is "in use"
        await this._save();

        console.log(`\u{1f3ae} Game marked installed: ${game.name}`);
        return game;
    }

    /**
     * Mark a game as uninstalled (license retained).
     */
    async markGameUninstalled(gameId) {
        const game = this.getGameLicense(gameId);
        if (!game) return null;

        game.installed = false;
        game.installedProgramId = null;
        game.giftable = game.copies; // all copies available
        await this._save();

        console.log(`\u{1f3ae} Game marked uninstalled: ${game.name} (license retained)`);
        return game;
    }

    /**
     * Get how many copies of a game can be gifted.
     */
    getGiftableCopies(gameId) {
        const game = this.getGameLicense(gameId);
        return game ? game.giftable : 0;
    }

    // =================================
    // VEHICLE METHODS
    // =================================

    getVehicles() {
        return this.getItems('vehicles');
    }

    /**
     * Get owned/financed vehicles (not leased — leased have insurance baked in).
     * These are the vehicles subject to insurance and depreciation.
     */
    getOwnedVehicles() {
        return this.getVehicles().filter(v => v.ownership !== 'leased');
    }

    /**
     * Get leased vehicles only.
     */
    getLeasedVehicles() {
        return this.getVehicles().filter(v => v.ownership === 'leased');
    }

    /**
     * Record a successful insurance payment for a vehicle (resets missed counter).
     */
    recordInsurancePayment(vehicleId, amount) {
        const vehicle = this._data.vehicles.find(v => v.id === vehicleId || String(v.id) === String(vehicleId));
        if (!vehicle) return;
        vehicle.insuranceMissed = 0;
        if (!vehicle.totalInsurancePaid) vehicle.totalInsurancePaid = 0;
        vehicle.totalInsurancePaid += amount;
        this._save();
    }

    /**
     * Record a missed insurance payment. Returns the new missed count.
     * At 3 consecutive misses, the vehicle is impounded (removed from inventory).
     */
    async recordMissedInsurancePayment(vehicleId) {
        const vehicle = this._data.vehicles.find(v => v.id === vehicleId || String(v.id) === String(vehicleId));
        if (!vehicle) return 0;

        if (!vehicle.insuranceMissed) vehicle.insuranceMissed = 0;
        vehicle.insuranceMissed++;

        if (vehicle.insuranceMissed >= 3) {
            console.log(`\u{1f697} Vehicle impounded (3 missed insurance): ${vehicle.name}`);
            this.eventBus.emit('inventory.vehicleImpounded', {
                vehicleId: vehicle.id,
                vehicle: { ...vehicle }
            });
            await this.loseVehicle(vehicleId, 'impounded');
        } else {
            await this._save();
        }

        return vehicle.insuranceMissed;
    }

    /**
     * Apply depreciation to a vehicle (update currentValue).
     * Floor at 20% of purchase price.
     */
    applyDepreciation(vehicleId, newValue) {
        const vehicle = this._data.vehicles.find(v => v.id === vehicleId || String(v.id) === String(vehicleId));
        if (!vehicle) return;
        var floor = (vehicle.purchasePrice || 0) * 0.20;
        vehicle.currentValue = Math.max(Math.round(newValue * 100) / 100, floor);
        this._save();
    }

    async acquireVehicle(vehicleData, ownership, financeIds = {}) {
        if (!this._ensureReady()) return null;

        const vehicle = {
            id: vehicleData.id || `veh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: vehicleData.name,
            type: vehicleData.type || 'car',
            ownership: ownership,
            purchasePrice: vehicleData.purchasePrice || 0,
            currentValue: vehicleData.currentValue || vehicleData.purchasePrice || 0,
            acquiredDate: new Date().toISOString().split('T')[0],
            loanId: financeIds.loanId || null,
            leasePaymentId: financeIds.leasePaymentId || null,
            color: vehicleData.color || null,
            mileage: vehicleData.mileage || 0,
            image: vehicleData.image || null,
            tier: vehicleData.tier || null,
            insuranceRate: vehicleData.insuranceRate || 0,
            depreciationRate: vehicleData.depreciationRate || 0,
            insuranceMissed: 0
        };

        this._data.vehicles.push(vehicle);
        await this._save();

        this.eventBus.emit('inventory.vehicleAcquired', { vehicle, ownership });
        console.log(`\u{1f697} Vehicle acquired: ${vehicle.name} (${ownership})`);

        return vehicle;
    }

    async loseVehicle(vehicleId, reason = 'sold') {
        const vehicle = this.getItem('vehicles', vehicleId);
        if (!vehicle) return null;

        // Cancel linked lease payment if exists
        try {
            if (vehicle.leasePaymentId && typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService._ready) {
                await elxaOS.financeService.cancelRecurringPayment(vehicle.leasePaymentId);
            }
        } catch (err) {
            console.warn('\u{1f4e6} Error cancelling vehicle lease payment:', err);
        }

        const removed = await this.removeItem('vehicles', vehicleId, reason);

        this.eventBus.emit('inventory.vehicleLost', { vehicleId, reason });
        console.log(`\u{1f697} Vehicle lost: ${vehicle.name} (${reason})`);

        return removed;
    }

    // =================================
    // CARD METHODS
    // =================================

    getCards() {
        return this.getItems('cards');
    }

    async addCard(cardData) {
        const card = {
            id: cardData.id || `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            cardId: cardData.cardId,
            seriesId: cardData.seriesId || null,
            name: cardData.name,
            rarity: cardData.rarity || 'common',
            acquiredDate: new Date().toISOString().split('T')[0],
            acquiredFrom: cardData.acquiredFrom || 'pack-opening',
            quantity: cardData.quantity || 1
        };

        return await this.addItem('cards', card);
    }

    // =================================
    // STOCK METHODS
    // =================================

    getStocks() {
        return this.getItems('stocks');
    }

    async acquireStock(ticker, companyName, shares, pricePerShare) {
        if (!this._ensureReady()) return null;

        // Check if we already hold this stock
        const existing = this._data.stocks.find(s => s.ticker === ticker);
        if (existing) {
            // Average cost basis
            const totalShares = existing.shares + shares;
            const totalCost = existing.totalInvested + (shares * pricePerShare);
            existing.shares = totalShares;
            existing.totalInvested = Math.round(totalCost * 100) / 100;
            existing.avgCostBasis = Math.round((totalCost / totalShares) * 100) / 100;
            await this._save();

            this.eventBus.emit('inventory.stockAcquired', { ticker, shares, price: pricePerShare });
            return existing;
        }

        const stock = {
            id: `stock-${ticker}`,
            ticker: ticker,
            companyName: companyName,
            shares: shares,
            avgCostBasis: pricePerShare,
            totalInvested: Math.round(shares * pricePerShare * 100) / 100,
            firstPurchaseDate: new Date().toISOString().split('T')[0]
        };

        this._data.stocks.push(stock);
        await this._save();

        this.eventBus.emit('inventory.stockAcquired', { ticker, shares, price: pricePerShare });
        console.log(`\u{1f4c8} Stock acquired: ${shares} shares of ${ticker}`);

        return stock;
    }

    async sellStock(ticker, shares, pricePerShare) {
        if (!this._ensureReady()) return null;

        const stock = this._data.stocks.find(s => s.ticker === ticker);
        if (!stock) {
            console.warn(`\u{1f4e6} No stock found for ticker: ${ticker}`);
            return null;
        }

        if (shares > stock.shares) {
            console.warn(`\u{1f4e6} Cannot sell ${shares} shares of ${ticker}, only have ${stock.shares}`);
            return null;
        }

        const gainLoss = Math.round((pricePerShare - stock.avgCostBasis) * shares * 100) / 100;

        if (shares === stock.shares) {
            // Sell all — remove position
            await this.removeItem('stocks', stock.id, 'sold');
        } else {
            // Partial sell — reduce position
            stock.shares -= shares;
            stock.totalInvested = Math.round(stock.shares * stock.avgCostBasis * 100) / 100;
            await this._save();
        }

        this.eventBus.emit('inventory.stockSold', { ticker, shares, price: pricePerShare, gainLoss });
        console.log(`\u{1f4c9} Stock sold: ${shares} shares of ${ticker} (gain/loss: ${gainLoss})`);

        return { ticker, shares, pricePerShare, gainLoss };
    }

    // =================================
    // SUBSCRIPTION METHODS
    // =================================

    getSubscriptions() {
        return this.getItems('subscriptions');
    }

    getActiveSubscriptions() {
        return this.getSubscriptions().filter(s => s.status === 'active');
    }

    async addSubscription(subData) {
        if (!this._ensureReady()) return null;

        const subscription = {
            id: subData.id || `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: subData.name,
            provider: subData.provider || '',
            monthlyRate: subData.monthlyRate || 0,
            recurringPaymentId: subData.recurringPaymentId || null,
            startDate: new Date().toISOString().split('T')[0],
            status: 'active',
            perks: subData.perks || []
        };

        this._data.subscriptions.push(subscription);
        await this._save();

        this.eventBus.emit('inventory.subscriptionStarted', { subscription });
        console.log(`\u{1f4cb} Subscription started: ${subscription.name}`);

        return subscription;
    }

    async cancelSubscription(subscriptionId, reason = 'cancelled') {
        const sub = this.getItem('subscriptions', subscriptionId);
        if (!sub) return null;

        sub.status = 'cancelled';

        // Cancel linked recurring payment
        if (sub.recurringPaymentId) {
            try {
                if (typeof elxaOS !== 'undefined' && elxaOS.financeService) {
                    await elxaOS.financeService.cancelRecurringPayment(sub.recurringPaymentId);
                }
            } catch (err) {
                console.warn('\u{1f4e6} Could not cancel linked subscription payment:', err);
            }
        }

        await this._save();

        this.eventBus.emit('inventory.subscriptionCancelled', { subscriptionId, reason });
        console.log(`\u{1f4cb} Subscription cancelled: ${sub.name}`);

        return sub;
    }

    // =================================
    // TICKET METHODS
    // =================================

    getTickets() {
        return this.getItems('tickets') || [];
    }

    getValidTickets() {
        return this.getTickets().filter(t => t.status === 'valid');
    }

    getTicketsByVenue(venue) {
        return this.getValidTickets().filter(t => t.venue === venue);
    }

    getGiftableTickets() {
        return this.getValidTickets().filter(t => t.giftable);
    }

    // =================================
    // ITEMS METHODS (groceries, gifts, souvenirs, etc.)
    // =================================

    /**
     * Add stackable items to inventory. If an item with the same itemId + subcategory
     * already exists, increments quantity instead of creating a duplicate.
     * @param {string} itemId - Product catalog ID (e.g., 'snake-pasta-3pk')
     * @param {object} data - { name, subcategory, unitPrice, brand, giftable, image }
     * @param {number} quantity - How many to add (default 1)
     * @returns {object|null} The item entry (new or updated)
     */
    async addItems(itemId, data, quantity = 1) {
        if (!this._ensureReady()) return null;
        if (!itemId || !data || !data.subcategory) {
            console.warn('\u{1f4e6} addItems requires itemId, data with subcategory');
            return null;
        }

        // Check for existing stack
        var existing = this._data.items.find(
            i => i.itemId === itemId && i.subcategory === data.subcategory
        );

        if (existing) {
            existing.quantity += quantity;
            await this._save();

            this.eventBus.emit('inventory.itemsAdded', {
                itemId: itemId,
                name: existing.name,
                quantity: quantity,
                totalQuantity: existing.quantity,
                subcategory: existing.subcategory
            });
            console.log('\u{1f4e6} Stacked +' + quantity + ' ' + existing.name + ' (now ' + existing.quantity + ')');
            return existing;
        }

        // New item entry
        var item = {
            id: 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
            itemId: itemId,
            name: data.name || itemId,
            subcategory: data.subcategory,
            quantity: quantity,
            unitPrice: data.unitPrice || 0,
            purchaseDate: new Date().toISOString().split('T')[0],
            giftable: data.giftable !== undefined ? data.giftable : true,
            brand: data.brand || null,
            image: data.image || null,
            metadata: data.metadata || null
        };

        this._data.items.push(item);
        await this._save();

        this.eventBus.emit('inventory.itemsAdded', {
            itemId: itemId,
            name: item.name,
            quantity: quantity,
            totalQuantity: item.quantity,
            subcategory: item.subcategory
        });
        console.log('\u{1f4e6} Added new item: ' + item.name + ' x' + quantity);

        return item;
    }

    /**
     * Remove a quantity of items from inventory. If quantity hits 0, removes the entry entirely.
     * @param {string} itemId - Product catalog ID
     * @param {string} subcategory - Which subcategory to look in
     * @param {number} quantity - How many to remove (default 1)
     * @param {string} reason - Why removed: 'gifted', 'consumed', 'expired', etc.
     * @returns {object|null} { item, removed, remaining } or null if not found
     */
    async removeItems(itemId, subcategory, quantity = 1, reason = 'consumed') {
        if (!this._ensureReady()) return null;

        var index = this._data.items.findIndex(
            i => i.itemId === itemId && i.subcategory === subcategory
        );

        if (index === -1) {
            console.warn('\u{1f4e6} Item not found: ' + itemId + ' in ' + subcategory);
            return null;
        }

        var item = this._data.items[index];
        var actualRemoved = Math.min(quantity, item.quantity);
        item.quantity -= actualRemoved;

        if (item.quantity <= 0) {
            this._data.items.splice(index, 1);
        }

        await this._save();

        this.eventBus.emit('inventory.itemsRemoved', {
            itemId: itemId,
            name: item.name,
            quantity: actualRemoved,
            subcategory: subcategory,
            reason: reason
        });

        console.log('\u{1f4e6} Removed ' + actualRemoved + 'x ' + item.name + ' (' + reason + ')' +
            (item.quantity > 0 ? ', ' + item.quantity + ' remaining' : ', none left'));

        return {
            item: item,
            removed: actualRemoved,
            remaining: item.quantity > 0 ? item.quantity : 0
        };
    }

    /**
     * Get all items in a specific subcategory.
     * @param {string} subcategory - e.g., 'groceries', 'tickets', 'souvenirs'
     * @returns {Array} Items matching the subcategory
     */
    getItemsBySubcategory(subcategory) {
        if (!this._ensureReady()) return [];
        return this._data.items.filter(i => i.subcategory === subcategory);
    }

    /**
     * Get the quantity of a specific item.
     * @param {string} itemId - Product catalog ID
     * @param {string} subcategory - Which subcategory
     * @returns {number} Quantity owned (0 if none)
     */
    getItemCount(itemId, subcategory) {
        if (!this._ensureReady()) return 0;
        var item = this._data.items.find(
            i => i.itemId === itemId && i.subcategory === subcategory
        );
        return item ? item.quantity : 0;
    }

    /**
     * Sync getter for interwebs site JS (can't easily await).
     * @returns {Array} All items in the items category
     */
    getItemsSync() {
        if (!this._ready || !this._data) return [];
        return this._data.items || [];
    }

    // =================================
    // FINANCE EVENT LISTENERS
    // =================================

    _setupFinanceListeners() {
        // Loan defaulted → repossess linked property or vehicle
        this.eventBus.on('finance.loanDefaulted', async (data) => {
            if (!this._ready || !data) return;

            const loan = data.loan || data;
            const loanId = loan.id || loan.loanId;
            if (!loanId) return;

            // Check properties for this loan
            const property = this._data.properties.find(p => p.loanId === loanId);
            if (property) {
                console.log(`\u{1f4e6} Loan defaulted on property: ${property.name} — repossessing`);
                await this.loseProperty(property.id, 'repossessed');
                return;
            }

            // Check vehicles for this loan
            const vehicle = this._data.vehicles.find(v => v.loanId === loanId);
            if (vehicle) {
                console.log(`\u{1f4e6} Loan defaulted on vehicle: ${vehicle.name} — repossessing`);
                await this.loseVehicle(vehicle.id, 'repossessed');
                return;
            }
        });

        // Recurring payment cancelled → check for subscription link
        this.eventBus.on('finance.recurringPaymentCancelled', async (data) => {
            if (!this._ready || !data) return;

            const paymentId = data.id || data.paymentId;
            if (!paymentId) return;

            const sub = this._data.subscriptions.find(s => s.recurringPaymentId === paymentId && s.status === 'active');
            if (sub) {
                sub.status = 'cancelled';
                await this._save();
                this.eventBus.emit('inventory.subscriptionCancelled', { subscriptionId: sub.id, reason: 'payment-cancelled' });
                console.log(`\u{1f4e6} Subscription auto-cancelled (payment cancelled): ${sub.name}`);
            }
        });

        // Track missed rent payments for eviction (3 misses → eviction)
        this.eventBus.on('finance.recurringPaymentMissed', async (data) => {
            if (!this._ready || !data) return;

            const paymentId = data.id || data.paymentId;
            if (!paymentId) return;

            // Find rental property linked to this payment
            const rental = this._data.properties.find(p => p.rentPaymentId === paymentId && p.ownership === 'rented');
            if (rental) {
                rental.missedRentPayments = (rental.missedRentPayments || 0) + 1;
                await this._save();

                if (rental.missedRentPayments >= 3) {
                    console.log(`\u{1f4e6} 3 missed rent payments — evicting from ${rental.name}`);
                    await this.loseProperty(rental.id, 'evicted');
                } else {
                    console.log(`\u{1f4e6} Missed rent payment ${rental.missedRentPayments}/3 for ${rental.name}`);
                }
            }
        });
    }

    // =================================
    // LLM CONTEXT
    // =================================

    /**
     * Get a plain English summary of what the user owns.
     * Used by finance-bridge.js for LLM context.
     */
    getOwnershipSummary() {
        if (!this._ready) return 'Inventory not loaded.';

        const parts = [];

        // Properties
        const props = this.getProperties();
        if (props.length > 0) {
            const propLines = props.map(p => {
                let desc = `${p.name}`;
                if (p.isPrimaryResidence) desc += ' (primary residence)';
                desc += `, ${p.ownership}`;
                if (p.ownership === 'mortgaged' && p.loanId) desc += ', has mortgage';
                if (p.ownership === 'rented') desc += `, rent linked`;
                if (p.monthlyTax > 0) desc += `, tax: ${p.monthlyTax}/mo`;
                return `  - ${desc}`;
            });
            const totalTax = this.getTotalTaxPaid();
            let propSummary = `User owns ${props.length} propert${props.length === 1 ? 'y' : 'ies'}:\n${propLines.join('\n')}`;
            if (totalTax > 0) propSummary += `\n  Total property tax paid to date: ${totalTax.toFixed(2)}`;
            parts.push(propSummary);
        }

        // Vehicles
        const vehs = this.getVehicles();
        if (vehs.length > 0) {
            const vehLines = vehs.map(v => `  - ${v.name} (${v.ownership})`);
            parts.push(`User owns ${vehs.length} vehicle${vehs.length === 1 ? '' : 's'}:\n${vehLines.join('\n')}`);
        }

        // Games
        const games = this.getGames();
        if (games.length > 0) {
            const installed = games.filter(g => g.installed).length;
            parts.push(`User has ${games.length} game license${games.length === 1 ? '' : 's'} (${installed} installed).`);
        }

        // Cards
        const cards = this.getCards();
        if (cards.length > 0) {
            const totalCards = cards.reduce((sum, c) => sum + (c.quantity || 1), 0);
            parts.push(`User has ${totalCards} trading card${totalCards === 1 ? '' : 's'}.`);
        }

        // Stocks
        const stocks = this.getStocks();
        if (stocks.length > 0) {
            const stockLines = stocks.map(s => `  - ${s.shares} shares of ${s.ticker} (avg cost: ${s.avgCostBasis})`);
            parts.push(`User holds ${stocks.length} stock position${stocks.length === 1 ? '' : 's'}:\n${stockLines.join('\n')}`);
        }

        // Subscriptions
        const subs = this.getActiveSubscriptions();
        if (subs.length > 0) {
            const totalMonthly = subs.reduce((sum, s) => sum + s.monthlyRate, 0);
            const subLines = subs.map(s => `  - ${s.name} (${s.monthlyRate}/mo)`);
            parts.push(`Active subscriptions (${totalMonthly.toFixed(2)}/mo total):\n${subLines.join('\n')}`);
        }

        // Tickets
        const tickets = this.getValidTickets();
        if (tickets.length > 0) {
            const byVenue = {};
            tickets.forEach(t => {
                byVenue[t.venue] = (byVenue[t.venue] || 0) + 1;
            });
            const venueLines = Object.entries(byVenue).map(([v, count]) => `  - ${v}: ${count}`);
            parts.push(`User has ${tickets.length} valid ticket${tickets.length === 1 ? '' : 's'}:\n${venueLines.join('\n')}`);
        }

        // Items (groceries, etc.)
        const items = this._data.items || [];
        if (items.length > 0) {
            const totalItems = items.reduce((sum, i) => sum + (i.quantity || 1), 0);
            const bySub = {};
            items.forEach(i => {
                if (!bySub[i.subcategory]) bySub[i.subcategory] = [];
                bySub[i.subcategory].push(`${i.name} x${i.quantity}`);
            });
            const subLines = Object.entries(bySub).map(([sub, list]) => `  ${sub}: ${list.join(', ')}`);
            parts.push(`User has ${totalItems} item${totalItems === 1 ? '' : 's'} in inventory:\n${subLines.join('\n')}`);
        }

        if (parts.length === 0) {
            return 'User does not currently own any tracked items.';
        }

        return parts.join('\n');
    }

    /**
     * Get a list of all inventory-linked financial obligations.
     */
    getFinancialObligations() {
        if (!this._ready) return [];

        const obligations = [];

        // Property taxes
        for (const p of this.getProperties()) {
            if (p.monthlyTax > 0) {
                obligations.push({
                    type: 'property-tax',
                    name: `Property Tax: ${p.name}`,
                    monthlyAmount: p.monthlyTax,
                    linkedItemId: p.id,
                    paymentId: p.taxPaymentId
                });
            }
            if (p.ownership === 'rented' && p.rentPaymentId) {
                obligations.push({
                    type: 'rent',
                    name: `Rent: ${p.name}`,
                    monthlyAmount: null, // amount is in finance service
                    linkedItemId: p.id,
                    paymentId: p.rentPaymentId
                });
            }
        }

        // Subscriptions
        for (const s of this.getActiveSubscriptions()) {
            obligations.push({
                type: 'subscription',
                name: s.name,
                monthlyAmount: s.monthlyRate,
                linkedItemId: s.id,
                paymentId: s.recurringPaymentId
            });
        }

        return obligations;
    }

    // =================================
    // DEBUG TOOLS
    // =================================

    get debug() {
        const self = this;
        return {
            listAll() {
                if (!self._ready) {
                    console.log('\u{1f4e6} Inventory not loaded');
                    return;
                }
                console.group('\u{1f4e6} Inventory Debug — All Items');
                for (const cat of INVENTORY_CATEGORIES) {
                    const items = self._data[cat];
                    console.groupCollapsed(`${cat} (${items.length})`);
                    items.forEach(item => console.log(item));
                    console.groupEnd();
                }
                console.groupEnd();
                return self._data;
            },

            addProperty(data) {
                return self.acquireProperty(data, data.ownership || 'owned');
            },

            removeProperty(id) {
                return self.loseProperty(id, 'debug-removed');
            },

            addGame(gameId, name, price) {
                return self.addGameLicense(gameId, { name: name || gameId, purchasePrice: price || 0 });
            },

            addCard(cardId, name, rarity) {
                return self.addCard({ cardId, name: name || cardId, rarity: rarity || 'common' });
            },

            addStock(ticker, company, shares, price) {
                return self.acquireStock(ticker, company || ticker, shares || 1, price || 10);
            },

            addSubscription(name, provider, rate) {
                return self.addSubscription({ name, provider: provider || name, monthlyRate: rate || 9.99 });
            },

            addVehicle(name, type, price) {
                return self.acquireVehicle({ name, type: type || 'car', purchasePrice: price || 1000 }, 'owned');
            },

            addTicket(venue, type, price) {
                const v = venue || 'Snake Valley National Museum';
                const t = type || 'adult';
                return self.addItem('tickets', {
                    venue: v,
                    venueShort: v.includes('Aquarium') ? 'aquarium' : 'museum',
                    ticketType: t,
                    ticketLabel: t.charAt(0).toUpperCase() + t.slice(1) + ' Admission',
                    price: price || 20,
                    purchaseDate: new Date().toISOString(),
                    status: 'valid',
                    giftable: true
                });
            },

            addItems(itemId, name, subcategory, quantity, price, brand) {
                return self.addItems(itemId || 'test-item', {
                    name: name || 'Test Item',
                    subcategory: subcategory || 'groceries',
                    unitPrice: price || 1.50,
                    brand: brand || null,
                    giftable: true
                }, quantity || 1);
            },

            removeItems(itemId, subcategory, quantity) {
                return self.removeItems(itemId, subcategory || 'groceries', quantity || 1);
            },

            items() {
                var items = self._data.items || [];
                console.group('\u{1f4e6} Items Inventory');
                if (items.length === 0) {
                    console.log('No items in inventory.');
                } else {
                    console.table(items.map(function(i) {
                        return { itemId: i.itemId, name: i.name, qty: i.quantity, sub: i.subcategory, brand: i.brand || '-' };
                    }));
                }
                console.groupEnd();
                return items;
            },

            resetInventory() {
                console.warn('\u{1f4e6} Resetting all inventory data!');
                for (const cat of INVENTORY_CATEGORIES) {
                    self._data[cat] = [];
                }
                return self._save();
            },

            summary() {
                console.log(self.getOwnershipSummary());
            },

            taxes() {
                const stats = self.getTaxStats();
                console.group('\u{1f3e0} Property Tax Stats');
                console.log('Total tax paid (all properties):', stats.totalTaxPaid.toFixed(2));
                console.log('Current monthly burden:', stats.monthlyTaxBurden.toFixed(2));
                console.table(stats.byProperty);
                console.groupEnd();
                return stats;
            }
        };
    }
}