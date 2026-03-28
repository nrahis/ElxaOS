// =================================
// FIRST SNAKESIAN BANK — Storage, Payments & Utilities
// Payment integration, finance sync, transaction history, storage, utilities
// Also creates the global BankSystem instance
// =================================

// --- PAYMENT SYSTEM INTEGRATION ---

BankSystem.prototype.processPayment = function(amount, description, accountType) {
    if (!accountType) accountType = 'checking';

    if (typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService.isReady()) {
        var result = elxaOS.financeService.processPaymentSync(amount, description, accountType);
        if (result.success) {
            this._syncFromFinanceService();
        }
        return result;
    }

    if (!this.isLoggedIn) {
        return { success: false, message: 'Please log in to your bank account first.' };
    }
    if (!this.accounts[accountType]) {
        return { success: false, message: 'Invalid account type: ' + accountType };
    }

    if (accountType === 'trust') {
        if (!description || !description.includes('[TRUST_AUTHORIZED]')) {
            return { success: false, message: 'Trust account payments require special authorization.' };
        }
        description = description.replace('[TRUST_AUTHORIZED]', '').trim();
    }

    if (this.accounts[accountType].balance < amount) {
        return {
            success: false,
            message: 'Insufficient funds in ' + accountType + ' account. Available: $' + this.accounts[accountType].balance.toFixed(2)
        };
    }

    this.accounts[accountType].balance -= amount;
    var transactionType = accountType === 'trust' ? 'trust-payment' : 'payment';
    this.addTransaction(transactionType, accountType, -amount, description || 'Online purchase');

    try {
        var dashboardSection = document.getElementById('dashboardSection');
        if (dashboardSection && !dashboardSection.classList.contains('hidden')) {
            this.updateAccountDisplay();
            this.updateTransactionHistory();
        }
    } catch (_) { }

    this.saveCurrentUser();

    return {
        success: true,
        message: 'Payment of $' + amount.toFixed(2) + ' processed successfully from ' + accountType + ' account.',
        remainingBalance: this.accounts[accountType].balance,
        accountUsed: accountType
    };
};

BankSystem.prototype.checkFunds = function(amount, accountType) {
    if (!accountType) accountType = 'checking';

    if (typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService.isReady()) {
        return elxaOS.financeService.checkFundsSync(amount, accountType);
    }

    if (!this.isLoggedIn || !this.accounts[accountType]) {
        return { hasEnough: false, balance: 0, accountType: accountType };
    }
    return {
        hasEnough: this.accounts[accountType].balance >= amount,
        balance: this.accounts[accountType].balance,
        accountType: accountType
    };
};

BankSystem.prototype.getAccountBalances = function() {
    if (typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService.isReady()) {
        return elxaOS.financeService.getAccountBalancesSync();
    }

    if (!this.isLoggedIn) {
        return { checking: 0, savings: 0, trust: 0 };
    }
    return {
        checking: this.accounts.checking.balance,
        savings: this.accounts.savings.balance,
        trust: this.accounts.trust.balance
    };
};

BankSystem.prototype.hasTrustAccess = function() {
    return this.isLoggedIn && this.accounts.trust;
};

// --- FINANCE SERVICE SYNC ---

BankSystem.prototype._syncFromFinanceService = function() {
    try {
        if (typeof elxaOS === 'undefined' || !elxaOS.financeService || !elxaOS.financeService.isReady()) return;
        var balances = elxaOS.financeService.getAccountBalancesSync();
        this.accounts.checking.balance = balances.checking;
        this.accounts.savings.balance = balances.savings;
        this.accounts.trust.balance = balances.trust;

        this.saveCurrentUser();

        var dashboardSection = document.getElementById('dashboardSection');
        if (dashboardSection && !dashboardSection.classList.contains('hidden')) {
            this.updateAccountDisplay();
            this.updateTransactionHistory();
        }
    } catch (_) { }
};

// --- TRANSACTION HISTORY ---

BankSystem.prototype.addTransaction = function(type, account, amount, description) {
    var transaction = {
        id: Date.now() + Math.random(),
        type: type,
        account: account,
        amount: amount,
        description: description,
        date: new Date().toISOString(),
        timestamp: Date.now()
    };

    this.transactions.unshift(transaction);

    if (this.transactions.length > 50) {
        this.transactions = this.transactions.slice(0, 50);
    }
};

BankSystem.prototype.updateTransactionHistory = function() {
    var transactionList = document.getElementById('transactionList');
    if (!transactionList) return;

    if (this.transactions.length === 0) {
        transactionList.innerHTML = '<div class="bank-no-transactions">No transactions yet. Start by making a deposit!</div>';
        return;
    }

    var html = '';
    var crownIcon = (typeof ElxaIcons !== 'undefined')
        ? ElxaIcons.renderAction('crown') + ' '
        : '';

    this.transactions.slice(0, 10).forEach(function(transaction) {
        var date = new Date(transaction.date).toLocaleDateString();
        var time = new Date(transaction.date).toLocaleTimeString();
        var amountClass = transaction.amount >= 0 ? 'positive' : 'negative';
        var amountText = transaction.amount >= 0
            ? '+$' + transaction.amount.toFixed(2)
            : '-$' + Math.abs(transaction.amount).toFixed(2);
        var isTrust = transaction.account === 'trust' || transaction.type.indexOf('trust') !== -1;
        var trustPrefix = isTrust ? crownIcon : '';

        html +=
            '<div class="bank-transaction-item">' +
                '<div class="bank-transaction-date">' + date + ' ' + time + '</div>' +
                '<div class="bank-transaction-desc">' + trustPrefix + transaction.description + '</div>' +
                '<div class="bank-transaction-amount ' + amountClass + '">' + amountText + '</div>' +
            '</div>';
    });

    transactionList.innerHTML = html;
};

// --- UTILITY METHODS ---

BankSystem.prototype.refreshAccount = function() {
    this.updateDashboard();
    this.showSuccess('Account information refreshed.');
};

BankSystem.prototype.generateAccountNumber = function(prefix) {
    var timestamp = Date.now().toString().slice(-6);
    var random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    return prefix + '-' + timestamp + '-' + random;
};

BankSystem.prototype.clearRegistrationForm = function() {
    var fields = ['regFirstName', 'regLastName', 'regUsername', 'regPassword', 'regConfirmPassword'];
    fields.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.value = '';
    });
};

// --- STORAGE METHODS ---

BankSystem.prototype.saveUser = function(userData) {
    try {
        localStorage.setItem('elxaOS-bank-user-' + userData.username, JSON.stringify(userData));

        try {
            if (typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
                try { elxaOS.fileSystem.createFolder(['root', 'System'], 'Bank'); } catch (_) { }
                var fileName = 'bank-user-' + userData.username + '.json';
                elxaOS.fileSystem.createFile(['root', 'System', 'Bank'], fileName, JSON.stringify(userData, null, 2), 'json');
            }
        } catch (_) { }
    } catch (error) {
        console.error('Failed to save user data:', error);
    }
};

BankSystem.prototype.loadUser = function(username) {
    try {
        var localData = localStorage.getItem('elxaOS-bank-user-' + username);
        if (localData) {
            var userData = JSON.parse(localData);
            if (!userData.accounts.trust) {
                userData.accounts.trust = { balance: 0, number: this.generateAccountNumber('TRU') };
                this.saveUser(userData);
            }
            return userData;
        }

        if (typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
            try {
                var file = elxaOS.fileSystem.getFile(['root', 'System', 'Bank'], 'bank-user-' + username + '.json');
                if (file && file.content) {
                    var userData = JSON.parse(file.content);
                    if (!userData.accounts.trust) {
                        userData.accounts.trust = { balance: 0, number: this.generateAccountNumber('TRU') };
                    }
                    localStorage.setItem('elxaOS-bank-user-' + username, JSON.stringify(userData));
                    return userData;
                }
            } catch (_) { }
        }

        return null;
    } catch (error) {
        console.error('Failed to load user data:', error);
        return null;
    }
};

BankSystem.prototype.userExists = function(username) {
    return this.loadUser(username) !== null;
};

BankSystem.prototype.saveCurrentUser = function() {
    if (this.currentUser) {
        this.currentUser.accounts = this.accounts;
        this.currentUser.transactions = this.transactions;
        this.saveUser(this.currentUser);
    }
};

BankSystem.prototype.saveUserSession = function() {
    try {
        var sessionData = { username: this.currentUser.username, loginTime: Date.now() };
        localStorage.setItem('elxaOS-bank-session', JSON.stringify(sessionData));

        if (typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
            try {
                try { elxaOS.fileSystem.createFolder(['root', 'System'], 'Bank'); } catch (_) { }
                elxaOS.fileSystem.createFile(['root', 'System', 'Bank'], 'bank-session.json', JSON.stringify(sessionData), 'json');
            } catch (_) { }
        }
    } catch (error) {
        console.error('Failed to save session:', error);
    }
};

BankSystem.prototype.loadUserSession = function() {
    try {
        var sessionData = null;

        var localSession = localStorage.getItem('elxaOS-bank-session');
        if (localSession) {
            sessionData = JSON.parse(localSession);
        }

        if (!sessionData && typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
            try {
                var file = elxaOS.fileSystem.getFile(['root', 'System', 'Bank'], 'bank-session.json');
                if (file && file.content) {
                    sessionData = JSON.parse(file.content);
                    localStorage.setItem('elxaOS-bank-session', JSON.stringify(sessionData));
                }
            } catch (_) { }
        }

        if (sessionData) {
            var sessionAge = Date.now() - sessionData.loginTime;
            var maxAge = 24 * 60 * 60 * 1000;

            if (sessionAge < maxAge) {
                var userData = this.loadUser(sessionData.username);
                if (userData) {
                    this.currentUser = userData;
                    this.isLoggedIn = true;
                    this.accounts = userData.accounts;
                    this.transactions = userData.transactions || [];
                    return true;
                }
            } else {
                this.clearUserSession();
            }
        }
    } catch (error) {
        console.error('Failed to load session:', error);
    }
    return false;
};

BankSystem.prototype.clearUserSession = function() {
    try {
        localStorage.removeItem('elxaOS-bank-session');
        if (typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
            try { elxaOS.fileSystem.deleteItem(['root', 'System', 'Bank'], 'bank-session.json'); } catch (_) { }
        }
    } catch (error) {
        console.error('Failed to clear session:', error);
    }
};

// =================================
// CREATE GLOBAL INSTANCE
// =================================

window.bankSystem = new BankSystem();

// Auto-init when loaded inside the browser (interwebs page)
if (document.querySelector('.bank-website-root')) {
    window.bankSystem.init();
}