// =================================
// FINANCE SERVICE — Core
// Central Money Management for ElxaOS
// =================================
// Single source of truth for all financial data: accounts, transactions,
// deposits, withdrawals, transfers, and payment processing.
//
// Replaces the scattered balance logic in bank-system.js with a
// registry-backed, event-driven service that other systems can rely on.
//
// STORAGE: All data lives in elxaOS.registry user state under `finance.*`
// EVENTS:  All changes emit events via elxaOS.eventBus
//
// USAGE:
//   const result = await elxaOS.financeService.processPayment(14.99, { description: 'Sussy Cat Adventure' });
//   await elxaOS.financeService.deposit('checking', 100, 'Birthday money');
//   const accounts = await elxaOS.financeService.getAccounts();
// =================================

// =================================
// CREDIT CARD TIER DEFINITIONS
// =================================
const CARD_TIERS = {
    starter: {
        key: 'starter',
        name: 'Snakesian Starter Card',
        requiredScore: 500,
        requiredRating: 'Fair',
        limitRange: [100, 200],
        baseApr: 24.99,
        aprRange: 2,
        annualFee: 0,
        perks: [],
        description: 'A basic card to start building your credit. No frills, no fee.'
    },
    silver: {
        key: 'silver',
        name: 'Snakesian Silver Card',
        requiredScore: 580,
        requiredRating: 'Good',
        limitRange: [300, 500],
        baseApr: 18.99,
        aprRange: 2,
        annualFee: 0,
        perks: ['1% cashback on all purchases'],
        description: 'Solid everyday card with cashback rewards.'
    },
    gold: {
        key: 'gold',
        name: 'Snakesian Gold Card',
        requiredScore: 670,
        requiredRating: 'Very Good',
        limitRange: [500, 1000],
        baseApr: 14.99,
        aprRange: 2,
        annualFee: 25,
        perks: ['2% cashback on all purchases', 'Purchase protection'],
        description: 'Premium rewards and purchase protection for responsible spenders.'
    },
    platinum: {
        key: 'platinum',
        name: 'Snakesian Platinum Card',
        requiredScore: 740,
        requiredRating: 'Excellent',
        limitRange: [1000, 2500],
        baseApr: 9.99,
        aprRange: 2,
        annualFee: 50,
        perks: ['3% cashback on all purchases', 'Extended warranty', 'Airport lounge access'],
        description: 'Elite rewards, low rates, and exclusive perks for top-tier credit.'
    },
    black: {
        key: 'black',
        name: 'Snakesian Black Card',
        requiredScore: 800,
        requiredRating: 'Excellent',
        limitRange: [5000, 10000],
        baseApr: 5.99,
        aprRange: 2,
        annualFee: 100,
        perks: ['5% cashback on all purchases', 'Personal concierge', 'Flex payments', 'Priority support'],
        description: 'The ultimate card. Invitation-level exclusivity, unmatched rewards.'
    }
};

// Score bracket definitions
const SCORE_BRACKETS = [
    { min: 800, max: 850, rating: 'Excellent', color: '#2563eb' },
    { min: 740, max: 799, rating: 'Excellent', color: '#3b82f6' },
    { min: 670, max: 739, rating: 'Very Good', color: '#22c55e' },
    { min: 580, max: 669, rating: 'Good', color: '#84cc16' },
    { min: 500, max: 579, rating: 'Fair', color: '#eab308' },
    { min: 300, max: 499, rating: 'Poor', color: '#ef4444' }
];

const MAX_CREDIT_CARDS = 3;

// Secured credit card configuration
const SECURED_CARD_CONFIG = {
    name: 'Snakesian Secured Card',
    minDeposit: 100,
    maxDeposit: 500,
    apr: 22.99,
    annualFee: 0,
    graduationMonths: 1,       // On-time payments needed to graduate
    graduationBonus: 15,       // Score boost on graduation
    description: 'Put down a deposit to build your credit. Your deposit becomes your limit. Graduate to a real card after consistent on-time payments.'
};

// Savings behavior bonus tiers for credit score
const SAVINGS_SCORE_TIERS = [
    { threshold: 1000, bonus: 3, label: 'Strong savings balance (over $1,000)' },
    { threshold: 500,  bonus: 2, label: 'Healthy savings balance (over $500)' },
    { threshold: 200,  bonus: 1, label: 'Savings balance maintained (over $200)' }
];

class FinanceService {
    constructor(eventBus, registry) {
        this.eventBus = eventBus;
        this.registry = registry;

        // In-memory cache of the current user's finance data
        this._data = null;
        this._ready = false;

        // Exchange rate: 1 USD = 2 Snakes
        this.exchangeRate = 2;

        // Banker password for trust account (matches bank-system.js)
        this.bankerPassword = 'parent123';

        this._setupEventListeners();

        console.log('\u{1f4b0} FinanceService initialized');
    }

    // =================================
    // LIFECYCLE
    // =================================

    _setupEventListeners() {
        // Load finance data when a user logs in
        this.eventBus.on('registry.userLoaded', async () => {
            await this._loadFinanceData();
        });

        // Clear cache on logout
        this.eventBus.on('login.logout', () => {
            this._data = null;
            this._ready = false;
        });
    }

    /**
     * Called during ElxaOS async init. If a user is already logged in
     * (session restore), we need to load finance data immediately.
     */
    async init() {
        if (this.registry.isLoggedIn()) {
            await this._loadFinanceData();
        }
        console.log('\u{1f4b0} FinanceService ready');
    }

    // =================================
    // DATA LOADING & MIGRATION
    // =================================

    async _loadFinanceData() {
        const username = this.registry.getCurrentUsername();
        if (!username) return;

        // Try to load existing finance data from registry
        const existing = await this.registry.getState('finance');

        if (existing && existing.migrated) {
            // Already migrated — use registry data
            this._data = existing;
            // Ensure creditCards array exists (added in Phase 2)
            if (!this._data.creditCards) this._data.creditCards = [];
            // Ensure loans array exists (added in Phase 3)
            if (!this._data.loans) this._data.loans = [];
            // Ensure recurring payments + cycle log exist (added in Phase 4)
            if (!this._data.recurringPayments) this._data.recurringPayments = [];
            if (!this._data.cycleLog) this._data.cycleLog = [];
            // Ensure creditScore object exists (added in Phase 2.5)
            if (!this._data.creditScore) {
                this._data.creditScore = this._createDefaultCreditScore();
                await this._save();
            }
            this._ready = true;
            console.log(`\u{1f4b0} Finance data loaded for "${username}" \u2014 ${Object.keys(this._data.accounts).length} accounts, score: ${this._data.creditScore.score}`);
            return;
        }

        // No finance data yet — attempt migration from old bank localStorage
        console.log(`\u{1f4b0} No finance data found for "${username}", checking for bank migration...`);
        await this._migrateFromBankSystem(username);
        this._ready = true;
    }

    /**
     * Migrate data from the old bank-system.js localStorage format
     * into the new registry-backed finance service.
     */
    async _migrateFromBankSystem(username) {
        let migrated = false;

        try {
            const bankKey = `elxaOS-bank-user-${username}`;
            const raw = localStorage.getItem(bankKey);

            if (raw) {
                const bankData = JSON.parse(raw);
                console.log(`\u{1f4b0} Found old bank data for "${username}", migrating...`);

                this._data = {
                    accounts: {
                        checking: {
                            balance: bankData.accounts?.checking?.balance || 0,
                            number: bankData.accounts?.checking?.number || this._generateAccountNumber('CHK'),
                            opened: bankData.dateCreated || new Date().toISOString()
                        },
                        savings: {
                            balance: bankData.accounts?.savings?.balance || 0,
                            number: bankData.accounts?.savings?.number || this._generateAccountNumber('SAV'),
                            opened: bankData.dateCreated || new Date().toISOString()
                        },
                        trust: {
                            balance: bankData.accounts?.trust?.balance || 0,
                            number: bankData.accounts?.trust?.number || this._generateAccountNumber('TRU'),
                            opened: bankData.dateCreated || new Date().toISOString()
                        }
                    },
                    transactions: (bankData.transactions || []).map(t => ({
                        id: t.id || Date.now() + Math.random(),
                        type: t.type || 'unknown',
                        account: t.account || 'checking',
                        amount: t.amount || 0,
                        description: t.description || '',
                        date: t.date || new Date().toISOString(),
                        source: 'migrated'
                    })),
                    creditCards: [],
                    loans: [],
                    recurringPayments: [],
                    cycleLog: [],
                    creditScore: this._createDefaultCreditScore(),
                    lastProcessedDate: new Date().toISOString().split('T')[0],
                    migrated: true,
                    migratedAt: new Date().toISOString()
                };

                migrated = true;
                console.log(`\u{1f4b0} Migrated bank data: checking=$${this._data.accounts.checking.balance}, savings=$${this._data.accounts.savings.balance}, trust=$${this._data.accounts.trust.balance}`);
            }
        } catch (err) {
            console.warn('\u{1f4b0} Bank migration failed (non-fatal):', err);
        }

        if (!migrated) {
            // No old data — create fresh finance state
            this._data = this._createDefaultFinanceData();
            console.log(`\u{1f4b0} Created fresh finance data for "${username}"`);
        }

        // Persist to registry
        await this._save();
    }

    _createDefaultFinanceData() {
        return {
            creditCards: [],
            loans: [],
            recurringPayments: [],
            cycleLog: [],
            creditScore: this._createDefaultCreditScore(),
            accounts: {
                checking: {
                    balance: 0,
                    number: this._generateAccountNumber('CHK'),
                    opened: new Date().toISOString()
                },
                savings: {
                    balance: 0,
                    number: this._generateAccountNumber('SAV'),
                    opened: new Date().toISOString()
                },
                trust: {
                    balance: 0,
                    number: this._generateAccountNumber('TRU'),
                    opened: new Date().toISOString()
                }
            },
            transactions: [],
            lastProcessedDate: new Date().toISOString().split('T')[0],
            migrated: true,
            migratedAt: new Date().toISOString()
        };
    }

    _createDefaultCreditScore() {
        return {
            score: 500,
            history: [
                {
                    date: new Date().toISOString().slice(0, 7),
                    score: 500,
                    delta: 0,
                    reasons: ['Account opened \u2014 starting score']
                }
            ],
            hardInquiries: 0,
            hardInquiryResetDate: new Date().toISOString().split('T')[0],
            lastUpdated: new Date().toISOString()
        };
    }

    // =================================
    // ACCOUNT QUERIES
    // =================================

    /**
     * Get all account data.
     * Returns { checking: { balance, number, opened }, savings: {...}, trust: {...} }
     */
    async getAccounts() {
        await this._ensureReady();
        return JSON.parse(JSON.stringify(this._data.accounts));
    }

    /**
     * Get balances only (quick access).
     * Returns { checking: number, savings: number, trust: number }
     */
    async getBalances() {
        await this._ensureReady();
        return {
            checking: this._data.accounts.checking.balance,
            savings: this._data.accounts.savings.balance,
            trust: this._data.accounts.trust.balance
        };
    }

    /**
     * Get a single account's balance.
     */
    async getBalance(accountType) {
        await this._ensureReady();
        const account = this._data.accounts[accountType];
        return account ? account.balance : 0;
    }

    /**
     * Check if an account has enough funds for an amount.
     */
    async checkFunds(amount, accountType = 'checking') {
        await this._ensureReady();
        const account = this._data.accounts[accountType];
        if (!account) return { hasEnough: false, balance: 0, accountType };
        return {
            hasEnough: account.balance >= amount,
            balance: account.balance,
            accountType
        };
    }

    /**
     * Get transaction history. Optionally filter by account.
     * @param {object} options — { account, limit, offset }
     */
    async getTransactions(options = {}) {
        await this._ensureReady();
        let txns = this._data.transactions;

        if (options.account) {
            txns = txns.filter(t => t.account === options.account);
        }

        const limit = options.limit || 50;
        const offset = options.offset || 0;
        return txns.slice(offset, offset + limit);
    }

    // =================================
    // CORE OPERATIONS
    // =================================

    /**
     * Deposit money into an account.
     * @returns {{ success: boolean, message: string, balance?: number }}
     */
    async deposit(accountType, amount, description = 'Deposit') {
        await this._ensureReady();

        if (!this._data.accounts[accountType]) {
            return { success: false, message: `Invalid account type: ${accountType}` };
        }
        if (!amount || amount <= 0) {
            return { success: false, message: 'Amount must be greater than zero.' };
        }

        this._data.accounts[accountType].balance += amount;

        this._addTransaction({
            type: 'deposit',
            account: accountType,
            amount: amount,
            description
        });

        await this._save();

        this.eventBus.emit('finance.transactionCompleted', {
            type: 'deposit',
            account: accountType,
            amount,
            description,
            balance: this._data.accounts[accountType].balance
        });
        this.eventBus.emit('finance.accountUpdated', {
            account: accountType,
            newBalance: this._data.accounts[accountType].balance
        });

        return {
            success: true,
            message: `Deposited $${amount.toFixed(2)} to ${accountType}.`,
            balance: this._data.accounts[accountType].balance
        };
    }

    /**
     * Sync deposit — adds balance + transaction without saving or emitting events.
     * Used by EmploymentService to batch multiple paycheck deposits efficiently.
     * Caller is responsible for calling _save() afterward.
     */
    _depositDirect(accountType, amount, description) {
        if (!this._data || !this._data.accounts[accountType]) return;
        this._data.accounts[accountType].balance += amount;
        this._addTransaction({
            type: 'deposit',
            account: accountType,
            amount: amount,
            description: description || 'Direct deposit'
        });
    }

    /**
     * Withdraw money from an account.
     * @returns {{ success: boolean, message: string, balance?: number }}
     */
    async withdraw(accountType, amount, description = 'Withdrawal') {
        await this._ensureReady();

        if (!this._data.accounts[accountType]) {
            return { success: false, message: `Invalid account type: ${accountType}` };
        }
        if (!amount || amount <= 0) {
            return { success: false, message: 'Amount must be greater than zero.' };
        }
        if (this._data.accounts[accountType].balance < amount) {
            this.eventBus.emit('finance.insufficientFunds', {
                account: accountType,
                requested: amount,
                available: this._data.accounts[accountType].balance
            });
            return {
                success: false,
                message: `Insufficient funds in ${accountType}. Available: $${this._data.accounts[accountType].balance.toFixed(2)}`
            };
        }

        this._data.accounts[accountType].balance -= amount;

        this._addTransaction({
            type: 'withdrawal',
            account: accountType,
            amount: -amount,
            description
        });

        await this._save();

        this.eventBus.emit('finance.transactionCompleted', {
            type: 'withdrawal',
            account: accountType,
            amount: -amount,
            description,
            balance: this._data.accounts[accountType].balance
        });
        this.eventBus.emit('finance.accountUpdated', {
            account: accountType,
            newBalance: this._data.accounts[accountType].balance
        });

        return {
            success: true,
            message: `Withdrew $${amount.toFixed(2)} from ${accountType}.`,
            balance: this._data.accounts[accountType].balance
        };
    }

    /**
     * Transfer money between accounts.
     * @returns {{ success: boolean, message: string }}
     */
    async transfer(fromAccount, toAccount, amount, description) {
        await this._ensureReady();

        if (!this._data.accounts[fromAccount]) {
            return { success: false, message: `Invalid source account: ${fromAccount}` };
        }
        if (!this._data.accounts[toAccount]) {
            return { success: false, message: `Invalid destination account: ${toAccount}` };
        }
        if (fromAccount === toAccount) {
            return { success: false, message: 'Cannot transfer to the same account.' };
        }
        if (!amount || amount <= 0) {
            return { success: false, message: 'Amount must be greater than zero.' };
        }
        if (this._data.accounts[fromAccount].balance < amount) {
            this.eventBus.emit('finance.insufficientFunds', {
                account: fromAccount,
                requested: amount,
                available: this._data.accounts[fromAccount].balance
            });
            return {
                success: false,
                message: `Insufficient funds in ${fromAccount}. Available: $${this._data.accounts[fromAccount].balance.toFixed(2)}`
            };
        }

        const desc = description || `Transfer from ${fromAccount} to ${toAccount}`;

        this._data.accounts[fromAccount].balance -= amount;
        this._data.accounts[toAccount].balance += amount;

        this._addTransaction({
            type: 'transfer',
            account: fromAccount,
            amount: -amount,
            description: `Transfer to ${toAccount}: ${desc}`
        });
        this._addTransaction({
            type: 'transfer',
            account: toAccount,
            amount: amount,
            description: `Transfer from ${fromAccount}: ${desc}`
        });

        await this._save();

        this.eventBus.emit('finance.transactionCompleted', {
            type: 'transfer',
            fromAccount,
            toAccount,
            amount,
            description: desc,
            fromBalance: this._data.accounts[fromAccount].balance,
            toBalance: this._data.accounts[toAccount].balance
        });
        this.eventBus.emit('finance.accountUpdated', {
            account: fromAccount,
            newBalance: this._data.accounts[fromAccount].balance
        });
        this.eventBus.emit('finance.accountUpdated', {
            account: toAccount,
            newBalance: this._data.accounts[toAccount].balance
        });

        return {
            success: true,
            message: `Transferred $${amount.toFixed(2)} from ${fromAccount} to ${toAccount}.`
        };
    }

    // =================================
    // PAYMENT API
    // =================================

    /**
     * Process a payment (deduction from an account).
     * @param {number} amount
     * @param {object} options
     *   @param {string} options.description
     *   @param {string} options.account — 'checking' | 'savings' | 'trust' (default: 'checking')
     *   @param {boolean} options.trustAuthorized — required for trust account payments
     * @returns {{ success: boolean, message: string, remainingBalance?: number, accountUsed?: string }}
     */
    async processPayment(amount, options = {}) {
        await this._ensureReady();

        const accountType = options.account || 'checking';
        const description = options.description || 'Purchase';

        if (!this._data.accounts[accountType]) {
            return { success: false, message: `Invalid account type: ${accountType}` };
        }
        if (!amount || amount <= 0) {
            return { success: false, message: 'Invalid payment amount.' };
        }

        if (accountType === 'trust' && !options.trustAuthorized) {
            return { success: false, message: 'Trust account payments require special authorization.' };
        }

        if (this._data.accounts[accountType].balance < amount) {
            this.eventBus.emit('finance.insufficientFunds', {
                account: accountType,
                requested: amount,
                available: this._data.accounts[accountType].balance
            });
            return {
                success: false,
                message: `Insufficient funds in ${accountType} account. Available: $${this._data.accounts[accountType].balance.toFixed(2)}`
            };
        }

        this._data.accounts[accountType].balance -= amount;

        const txnType = accountType === 'trust' ? 'trust-payment' : 'payment';
        this._addTransaction({
            type: txnType,
            account: accountType,
            amount: -amount,
            description
        });

        await this._save();

        this.eventBus.emit('finance.transactionCompleted', {
            type: txnType,
            account: accountType,
            amount: -amount,
            description,
            balance: this._data.accounts[accountType].balance
        });
        this.eventBus.emit('finance.accountUpdated', {
            account: accountType,
            newBalance: this._data.accounts[accountType].balance
        });

        return {
            success: true,
            message: `Payment of $${amount.toFixed(2)} processed from ${accountType}.`,
            remainingBalance: this._data.accounts[accountType].balance,
            accountUsed: accountType
        };
    }

    // =================================
    // TRANSACTION LEDGER
    // =================================

    _addTransaction(txn) {
        const transaction = {
            id: `txn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: txn.type,
            account: txn.account,
            amount: txn.amount,
            description: txn.description,
            date: new Date().toISOString(),
            timestamp: Date.now()
        };

        this._data.transactions.unshift(transaction);

        if (this._data.transactions.length > 200) {
            this._data.transactions = this._data.transactions.slice(0, 200);
        }

        return transaction;
    }

    // =================================
    // PERSISTENCE
    // =================================

    async _save() {
        if (!this._data) return;
        try {
            await this.registry.setState('finance', this._data);
        } catch (err) {
            console.error('\u{1f4b0} Failed to save finance data:', err);
        }
    }

    async _ensureReady() {
        if (this._ready) return;
        if (this.registry.isLoggedIn()) {
            await this._loadFinanceData();
        }
    }

    // =================================
    // UTILITIES
    // =================================

    _generateAccountNumber(prefix) {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
        return `${prefix}-${timestamp}-${random}`;
    }

    isReady() {
        return this._ready && this._data !== null;
    }
}