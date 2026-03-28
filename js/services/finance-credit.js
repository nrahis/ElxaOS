// =================================
// FINANCE SERVICE — Credit Card System
// CRUD operations, charging, payments, closing
// =================================

/**
 * Get all credit cards for the current user.
 */
FinanceService.prototype.getCreditCards = async function() {
    await this._ensureReady();
    return JSON.parse(JSON.stringify(this._data.creditCards || []));
};

/**
 * Synchronous version for payment dialog.
 */
FinanceService.prototype.getCreditCardsSync = function() {
    if (!this._data) return [];
    return JSON.parse(JSON.stringify(this._data.creditCards || []));
};

/**
 * Get a single credit card by ID.
 */
FinanceService.prototype.getCreditCard = async function(cardId) {
    await this._ensureReady();
    return this._data.creditCards.find(c => c.id === cardId) || null;
};

/**
 * Create a new credit card (internal — use applyForCreditCard() for the user-facing flow).
 * @param {object} options
 *   @param {string} options.name — display name (e.g. 'Snakesian Gold Card')
 *   @param {number} options.creditLimit — max credit (default: 500)
 *   @param {number} options.apr — annual percentage rate (default: 18.99)
 *   @param {number} options.minimumPayment — min monthly payment (default: 25)
 *   @param {number} options.dueDay — day of month payment is due (default: 15)
 *   @param {string} options.tier — tier key for tracking
 * @returns {{ success: boolean, card?: object, message: string }}
 */
FinanceService.prototype.createCreditCard = async function(options) {
    if (!options) options = {};
    await this._ensureReady();

    const name = options.name || 'Snakesian Card';
    const creditLimit = options.creditLimit || 500;

    // Generate a fun card number
    const last4 = Math.floor(1000 + Math.random() * 9000).toString();
    const seg = () => Math.floor(1000 + Math.random() * 9000).toString();
    const fullNumber = `${seg()} ${seg()} ${seg()} ${last4}`;

    const card = {
        id: `cc-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        name,
        number: fullNumber,
        last4,
        creditLimit,
        balance: 0,
        apr: options.apr || 18.99,
        annualFee: options.annualFee || 0,
        minimumPayment: options.minimumPayment || 25,
        dueDay: options.dueDay || 15,
        tier: options.tier || null,
        perks: options.perks || [],
        opened: new Date().toISOString(),
        status: 'active'
    };

    this._data.creditCards.push(card);

    this._addTransaction({
        type: 'credit-card-opened',
        account: 'credit',
        amount: 0,
        description: `Opened credit card: ${name} (limit: $${creditLimit.toFixed(2)})`
    });

    await this._save();

    this.eventBus.emit('finance.creditCardCreated', {
        cardId: card.id,
        name: card.name,
        creditLimit: card.creditLimit
    });

    console.log(`\u{1f4b3} Credit card created: ${name} (****${last4}), limit: $${creditLimit}`);
    return { success: true, card: { ...card }, message: `${name} approved! Credit limit: $${creditLimit.toFixed(2)}` };
};

/**
 * Charge a purchase to a credit card.
 * @returns {{ success: boolean, message: string, newBalance?: number, creditRemaining?: number }}
 */
FinanceService.prototype.chargeCredit = async function(cardId, amount, description) {
    if (!description) description = 'Credit card purchase';
    await this._ensureReady();

    const card = this._data.creditCards.find(c => c.id === cardId);
    if (!card) return { success: false, message: 'Credit card not found.' };
    if (card.status !== 'active') return { success: false, message: `Credit card ${card.name} is ${card.status}.` };
    if (!amount || amount <= 0) return { success: false, message: 'Invalid charge amount.' };

    const creditRemaining = card.creditLimit - card.balance;
    if (amount > creditRemaining) {
        this.eventBus.emit('finance.creditLimitExceeded', {
            cardId,
            cardName: card.name,
            requested: amount,
            available: creditRemaining
        });
        return {
            success: false,
            message: `Not enough credit on ${card.name}. Available: $${creditRemaining.toFixed(2)} of $${card.creditLimit.toFixed(2)} limit.`
        };
    }

    card.balance += amount;

    this._addTransaction({
        type: 'credit-charge',
        account: `credit:${cardId}`,
        amount: -amount,
        description: `${description} [${card.name} ****${card.last4}]`
    });

    await this._save();

    this.eventBus.emit('finance.creditCharged', {
        cardId,
        cardName: card.name,
        amount,
        newBalance: card.balance,
        creditRemaining: card.creditLimit - card.balance
    });

    return {
        success: true,
        message: `Charged $${amount.toFixed(2)} to ${card.name}.`,
        newBalance: card.balance,
        creditRemaining: card.creditLimit - card.balance
    };
};

/**
 * Synchronous credit charge — for payment-system.js compatibility.
 */
FinanceService.prototype.chargeCreditSync = function(cardId, amount, description) {
    if (!description) description = 'Credit card purchase';
    if (!this._data) return { success: false, message: 'Finance service not ready.' };

    const card = this._data.creditCards.find(c => c.id === cardId);
    if (!card) return { success: false, message: 'Credit card not found.' };
    if (card.status !== 'active') return { success: false, message: `Credit card ${card.name} is ${card.status}.` };
    if (!amount || amount <= 0) return { success: false, message: 'Invalid charge amount.' };

    const creditRemaining = card.creditLimit - card.balance;
    if (amount > creditRemaining) {
        return {
            success: false,
            message: `Not enough credit on ${card.name}. Available: $${creditRemaining.toFixed(2)} of $${card.creditLimit.toFixed(2)} limit.`
        };
    }

    card.balance += amount;

    this._addTransaction({
        type: 'credit-charge',
        account: `credit:${cardId}`,
        amount: -amount,
        description: `${description} [${card.name} ****${card.last4}]`
    });

    this._save();

    this.eventBus.emit('finance.creditCharged', {
        cardId,
        cardName: card.name,
        amount,
        newBalance: card.balance,
        creditRemaining: card.creditLimit - card.balance
    });

    return {
        success: true,
        message: `Charged $${amount.toFixed(2)} to ${card.name}.`,
        newBalance: card.balance,
        creditRemaining: card.creditLimit - card.balance,
        cardName: card.name,
        cardLast4: card.last4
    };
};

/**
 * Make a payment toward a credit card balance.
 * @param {string} cardId
 * @param {number} amount — how much to pay
 * @param {string} fromAccount — 'checking' | 'savings' (default: 'checking')
 */
FinanceService.prototype.payCredit = async function(cardId, amount, fromAccount) {
    if (!fromAccount) fromAccount = 'checking';
    await this._ensureReady();

    const card = this._data.creditCards.find(c => c.id === cardId);
    if (!card) return { success: false, message: 'Credit card not found.' };
    if (!amount || amount <= 0) return { success: false, message: 'Payment amount must be greater than zero.' };

    if (!this._data.accounts[fromAccount]) {
        return { success: false, message: `Invalid account: ${fromAccount}` };
    }
    if (this._data.accounts[fromAccount].balance < amount) {
        return {
            success: false,
            message: `Insufficient funds in ${fromAccount}. Available: $${this._data.accounts[fromAccount].balance.toFixed(2)}`
        };
    }

    // Cap payment at current balance (don't overpay)
    const payAmount = Math.min(amount, card.balance);
    if (payAmount <= 0) {
        return { success: true, message: `${card.name} has no balance to pay.`, newBalance: 0 };
    }

    this._data.accounts[fromAccount].balance -= payAmount;
    card.balance -= payAmount;

    this._addTransaction({
        type: 'credit-payment',
        account: fromAccount,
        amount: -payAmount,
        description: `Credit card payment: ${card.name} ****${card.last4}`
    });
    this._addTransaction({
        type: 'credit-payment-received',
        account: `credit:${cardId}`,
        amount: payAmount,
        description: `Payment received from ${fromAccount}`
    });

    await this._save();

    this.eventBus.emit('finance.creditPayment', {
        cardId,
        cardName: card.name,
        amount: payAmount,
        newBalance: card.balance,
        fromAccount
    });
    this.eventBus.emit('finance.accountUpdated', {
        account: fromAccount,
        newBalance: this._data.accounts[fromAccount].balance
    });

    const paidOff = card.balance === 0;
    const msg = paidOff
        ? `Paid off ${card.name} in full! $${payAmount.toFixed(2)} from ${fromAccount}.`
        : `Paid $${payAmount.toFixed(2)} toward ${card.name}. Remaining: $${card.balance.toFixed(2)}.`;

    // Credit score boost for paying off a card
    if (paidOff) {
        this._adjustScore(Math.floor(Math.random() * 11) + 10, 'Paid off credit card in full');
    }

    return { success: true, message: msg, newBalance: card.balance, paidOff };
};

/**
 * Close a credit card. Must have $0 balance.
 * @param {string} cardId
 * @returns {{ success: boolean, message: string }}
 */
FinanceService.prototype.closeCreditCard = async function(cardId) {
    await this._ensureReady();

    const card = this._data.creditCards.find(c => c.id === cardId);
    if (!card) return { success: false, message: 'Credit card not found.' };
    if (card.status !== 'active') return { success: false, message: `Card is already ${card.status}.` };
    if (card.balance > 0) {
        return { success: false, message: `Cannot close ${card.name} \u2014 you still owe $${card.balance.toFixed(2)}. Pay off the balance first.` };
    }

    card.status = 'closed';
    card.closedDate = new Date().toISOString();

    this._addTransaction({
        type: 'credit-card-closed',
        account: 'credit',
        amount: 0,
        description: `Closed credit card: ${card.name} (****${card.last4})`
    });

    await this._save();

    this.eventBus.emit('finance.creditCardClosed', {
        cardId: card.id,
        name: card.name,
        tier: card.tier
    });

    console.log(`\u{1f4b3} Credit card closed: ${card.name} (****${card.last4})`);
    return { success: true, message: `${card.name} has been closed.` };
};

/**
 * Get credit card summary info for display.
 */
FinanceService.prototype.getCreditSummarySync = function() {
    if (!this._data || !this._data.creditCards) return { cards: [], totalOwed: 0, totalLimit: 0 };
    const active = this._data.creditCards.filter(c => c.status === 'active');
    return {
        cards: active.map(c => ({
            id: c.id,
            name: c.name,
            last4: c.last4,
            balance: c.balance,
            creditLimit: c.creditLimit,
            available: c.creditLimit - c.balance,
            apr: c.apr,
            annualFee: c.annualFee,
            tier: c.tier,
            perks: c.perks || [],
            minimumPayment: c.minimumPayment,
            dueDay: c.dueDay,
            opened: c.opened
        })),
        totalOwed: active.reduce((sum, c) => sum + c.balance, 0),
        totalLimit: active.reduce((sum, c) => sum + c.creditLimit, 0)
    };
};