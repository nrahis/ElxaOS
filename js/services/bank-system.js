// =================================
// FIRST SNAKESIAN BANK SYSTEM
// Handles online banking functionality with payment system integration
// =================================

var BankSystem = class BankSystem {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.exchangeRate = 2; // 1 USD = 2 Snakes
        this.bankerPassword = 'parent123'; // CHANGE THIS TO YOUR DESIRED PASSWORD!
        this.accounts = {
            checking: { balance: 0, number: null },
            savings: { balance: 0, number: null },
            trust: { balance: 0, number: null }
        };
        this.transactions = [];

        // Lifecycle refs (set in init, cleared in destroy)
        this._root = null;
        this._keyHandler = null;
        this._messageTimeoutIds = [];
    }

    // =================================
    // LIFECYCLE
    // =================================

    init() {
        // Clean up any previous init (e.g. navigating back to FSB)
        if (this._keyHandler) {
            document.removeEventListener('keypress', this._keyHandler);
            this._keyHandler = null;
        }

        this._root = document.querySelector('.bank-website-root');
        if (!this._root) return;

        this._injectIcons();
        this._setupDelegation();
        this._setupCurrencyConverter();
        this._setupKeyHandler();
        this._registerCleanup();

        // Restore session
        this.loadUserSession();
        if (this.isLoggedIn) {
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }

    destroy() {
        if (this._keyHandler) {
            document.removeEventListener('keypress', this._keyHandler);
            this._keyHandler = null;
        }
        this._messageTimeoutIds.forEach(id => clearTimeout(id));
        this._messageTimeoutIds = [];
        this._root = null;
    }

    _registerCleanup() {
        if (!window.browserPageCleanup) {
            window.browserPageCleanup = [];
        }
        window.browserPageCleanup.push(() => this.destroy());
    }

    // =================================
    // ICON INJECTION
    // =================================

    _injectIcons() {
        if (!this._root) return;
        this._root.querySelectorAll('[data-icon]').forEach(el => {
            el.innerHTML = ElxaIcons.renderAction(el.dataset.icon);
        });
    }

    // =================================
    // EVENT DELEGATION
    // =================================

    _setupDelegation() {
        if (!this._root) return;

        // Click delegation
        this._root.addEventListener('click', (e) => {
            const actionEl = e.target.closest('[data-action]');
            if (!actionEl) return;

            e.preventDefault();
            const action = actionEl.dataset.action;

            switch (action) {
                // Navigation
                case 'nav-login':       this.showLogin(); break;
                case 'nav-dashboard':   this.showDashboard(); break;
                case 'nav-register':    this.showRegister(); break;
                case 'nav-about':       this.showAbout(); break;
                case 'nav-locations':   this.showLocations(); break;
                case 'nav-help':        this.showHelp(); break;
                case 'nav-logout':      this.logout(); break;

                // Auth
                case 'login':           this.login(); break;
                case 'register':        this.register(); break;

                // Dashboard actions
                case 'show-deposit':    this.showDepositForm(); break;
                case 'show-withdraw':   this.showWithdrawForm(); break;
                case 'show-transfer':   this.showTransferForm(); break;
                case 'show-trust':      this.showTrustForm(); break;
                case 'refresh':         this.refreshAccount(); break;

                // Transaction processing
                case 'process-deposit':  this.processDeposit(); break;
                case 'process-withdraw': this.processWithdraw(); break;
                case 'process-transfer': this.processTransfer(); break;
                case 'process-trust':    this.processTrustTransaction(); break;
                case 'cancel-form':      this.hideTransactionForms(); break;
            }
        });

        // Change delegation — trust action select
        const trustAction = this._root.querySelector('#trustAction');
        if (trustAction) {
            trustAction.addEventListener('change', () => this.updateTrustFormFields());
        }
    }

    _setupCurrencyConverter() {
        if (!this._root) return;
        const usdInput = this._root.querySelector('#usdInput');
        const snakeInput = this._root.querySelector('#snakeInput');
        if (!usdInput || !snakeInput) return;

        usdInput.addEventListener('input', () => {
            const usd = parseFloat(usdInput.value) || 0;
            snakeInput.value = (usd * 2).toFixed(2);
        });

        snakeInput.addEventListener('input', () => {
            const snakes = parseFloat(snakeInput.value) || 0;
            usdInput.value = (snakes / 2).toFixed(2);
        });
    }

    _setupKeyHandler() {
        this._keyHandler = (e) => {
            if (e.key !== 'Enter') return;
            if (!this._root || !this._root.isConnected) return;

            const loginSection = this._root.querySelector('#loginSection');
            if (loginSection && !loginSection.classList.contains('hidden')) {
                this.login();
                return;
            }
            const registerSection = this._root.querySelector('#registerSection');
            if (registerSection && !registerSection.classList.contains('hidden')) {
                this.register();
            }
        };
        document.addEventListener('keypress', this._keyHandler);
    }

    _updateNav() {
        const loginLink = document.getElementById('navLoginLink');
        const registerLink = document.getElementById('navRegisterLink');
        const loggedInNav = document.getElementById('loggedInNav');

        if (this.isLoggedIn) {
            if (loginLink) {
                loginLink.textContent = 'Dashboard';
                loginLink.dataset.action = 'nav-dashboard';
            }
            if (registerLink) registerLink.style.display = 'none';
            if (loggedInNav) loggedInNav.classList.remove('hidden');
        } else {
            if (loginLink) {
                loginLink.textContent = 'Login';
                loginLink.dataset.action = 'nav-login';
            }
            if (registerLink) registerLink.style.display = '';
            if (loggedInNav) loggedInNav.classList.add('hidden');
        }
    }

    // =================================
    // ACCOUNT MANAGEMENT
    // =================================

    register() {
        const firstName = document.getElementById('regFirstName').value.trim();
        const lastName = document.getElementById('regLastName').value.trim();
        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;

        if (!firstName || !lastName || !username || !password) {
            this.showError('Please fill in all required fields.');
            return;
        }
        if (username.length < 3) {
            this.showError('Username must be at least 3 characters long.');
            return;
        }
        if (password.length < 4) {
            this.showError('Password must be at least 4 characters long.');
            return;
        }
        if (password !== confirmPassword) {
            this.showError('Passwords do not match.');
            return;
        }
        if (this.userExists(username)) {
            this.showError('Username already exists. Please choose a different username.');
            return;
        }

        const newUser = {
            username,
            password,
            firstName,
            lastName,
            dateCreated: new Date().toISOString(),
            lastLogin: null,
            accounts: {
                checking: { balance: 0, number: this.generateAccountNumber('CHK') },
                savings:  { balance: 0, number: this.generateAccountNumber('SAV') },
                trust:    { balance: 0, number: this.generateAccountNumber('TRU') }
            },
            transactions: []
        };

        this.saveUser(newUser);
        this.showSuccess('Account created successfully! Please log in with your new credentials.');
        this.showLogin();
        this.clearRegistrationForm();
    }

    login() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            this.showError('Please enter both username and password.');
            return;
        }

        const userData = this.loadUser(username);
        if (!userData || userData.password !== password) {
            this.showError('Invalid username or password.');
            return;
        }

        userData.lastLogin = new Date().toISOString();
        this.saveUser(userData);

        this.currentUser = userData;
        this.isLoggedIn = true;
        this.accounts = userData.accounts;
        this.transactions = userData.transactions || [];

        this.saveUserSession();
        this.showDashboard();
        this.showSuccess(`Welcome back, ${userData.firstName}!`);
    }

    logout() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.accounts = { checking: { balance: 0 }, savings: { balance: 0 }, trust: { balance: 0 } };
        this.transactions = [];
        this.clearUserSession();
        this.showLogin();
        this.showSuccess('You have been logged out successfully.');
    }

    // =================================
    // USER INTERFACE — Section Visibility
    // =================================

    showLogin() {
        this.hideAllSections();
        document.getElementById('loginSection').classList.remove('hidden');
        this._updateNav();
        this.clearMessages();
        setTimeout(() => {
            const el = document.getElementById('loginUsername');
            if (el) el.focus();
        }, 100);
    }

    showRegister() {
        this.hideAllSections();
        document.getElementById('registerSection').classList.remove('hidden');
        this._updateNav();
        this.clearMessages();
        setTimeout(() => {
            const el = document.getElementById('regFirstName');
            if (el) el.focus();
        }, 100);
    }

    showDashboard() {
        if (!this.isLoggedIn) {
            this.showLogin();
            return;
        }
        this.hideAllSections();
        const dashboardEl = document.getElementById('dashboardSection');
        if (!dashboardEl) return;
        dashboardEl.classList.remove('hidden');
        this._updateNav();
        this.updateDashboard();
    }

    showAbout() {
        this.hideAllSections();
        document.getElementById('aboutSection').classList.remove('hidden');
    }

    showLocations() {
        this.hideAllSections();
        document.getElementById('locationsSection').classList.remove('hidden');
    }

    showHelp() {
        this.hideAllSections();
        document.getElementById('helpSection').classList.remove('hidden');
    }

    hideAllSections() {
        const sections = ['loginSection', 'registerSection', 'dashboardSection', 'aboutSection', 'locationsSection', 'helpSection'];
        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
    }

    // =================================
    // DASHBOARD UPDATES
    // =================================

    updateDashboard() {
        if (!this.currentUser) return;

        const welcomeNameEl = document.getElementById('welcomeName');
        if (welcomeNameEl) welcomeNameEl.textContent = this.currentUser.firstName;

        const lastLogin = this.currentUser.lastLogin
            ? new Date(this.currentUser.lastLogin).toLocaleString()
            : 'First time login';
        const lastLoginEl = document.getElementById('lastLogin');
        if (lastLoginEl) lastLoginEl.textContent = lastLogin;

        this.updateAccountDisplay();

        const checkingNumberEl = document.getElementById('checkingNumber');
        const savingsNumberEl = document.getElementById('savingsNumber');
        const trustNumberEl = document.getElementById('trustNumber');
        if (checkingNumberEl && this.accounts.checking.number) checkingNumberEl.textContent = this.accounts.checking.number;
        if (savingsNumberEl && this.accounts.savings.number) savingsNumberEl.textContent = this.accounts.savings.number;
        if (trustNumberEl && this.accounts.trust.number) trustNumberEl.textContent = this.accounts.trust.number;

        this.updateTransactionHistory();
    }

    updateAccountDisplay() {
        const checkingUSD = this.accounts.checking.balance.toFixed(2);
        const checkingSnakes = (this.accounts.checking.balance * this.exchangeRate).toFixed(0);
        const savingsUSD = this.accounts.savings.balance.toFixed(2);
        const savingsSnakes = (this.accounts.savings.balance * this.exchangeRate).toFixed(0);
        const trustUSD = this.accounts.trust.balance.toFixed(2);
        const trustSnakes = (this.accounts.trust.balance * this.exchangeRate).toFixed(0);

        const checkingBalanceEl = document.getElementById('checkingBalance');
        const savingsBalanceEl = document.getElementById('savingsBalance');
        const trustBalanceEl = document.getElementById('trustBalance');
        if (checkingBalanceEl) checkingBalanceEl.textContent = `$${checkingUSD} (${checkingSnakes}🐍)`;
        if (savingsBalanceEl) savingsBalanceEl.textContent = `$${savingsUSD} (${savingsSnakes}🐍)`;
        if (trustBalanceEl) trustBalanceEl.textContent = `$${trustUSD} (${trustSnakes}🐍)`;
    }

    // =================================
    // TRANSACTION FORMS
    // =================================

    showDepositForm() {
        this.hideTransactionForms();
        const form = document.getElementById('depositForm');
        if (form) {
            form.classList.remove('hidden');
            setTimeout(() => { const el = document.getElementById('depositAmount'); if (el) el.focus(); }, 100);
        }
    }

    showWithdrawForm() {
        this.hideTransactionForms();
        const form = document.getElementById('withdrawForm');
        if (form) {
            form.classList.remove('hidden');
            setTimeout(() => { const el = document.getElementById('withdrawAmount'); if (el) el.focus(); }, 100);
        }
    }

    showTransferForm() {
        this.hideTransactionForms();
        const form = document.getElementById('transferForm');
        if (form) {
            form.classList.remove('hidden');
            setTimeout(() => { const el = document.getElementById('transferAmount'); if (el) el.focus(); }, 100);
        }
    }

    showTrustForm() {
        this.hideTransactionForms();
        const form = document.getElementById('trustForm');
        if (form) {
            form.classList.remove('hidden');
            this.updateTrustFormFields();
            setTimeout(() => { const el = document.getElementById('trustPassword'); if (el) el.focus(); }, 100);
        }
    }

    updateTrustFormFields() {
        const action = document.getElementById('trustAction').value;
        const otherAccountDiv = document.getElementById('trustOtherAccount');
        if (!otherAccountDiv) return;

        if (action === 'deposit' || action === 'withdraw') {
            otherAccountDiv.classList.add('hidden');
        } else {
            otherAccountDiv.classList.remove('hidden');
        }
    }

    hideTransactionForms() {
        const forms = ['depositForm', 'withdrawForm', 'transferForm', 'trustForm'];
        forms.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
    }

    // =================================
    // TRANSACTION PROCESSING
    // =================================

    processDeposit() {
        const account = document.getElementById('depositAccount').value;
        const amount = parseFloat(document.getElementById('depositAmount').value);

        if (!amount || amount <= 0) {
            this.showError('Please enter a valid amount.');
            return;
        }

        this.accounts[account].balance += amount;
        this.addTransaction('deposit', account, amount, `Deposit to ${account} account`);
        this.updateAccountDisplay();
        this.updateTransactionHistory();
        this.saveCurrentUser();
        this.hideTransactionForms();
        this.showSuccess(`Successfully deposited $${amount.toFixed(2)} to your ${account} account.`);
        document.getElementById('depositAmount').value = '';
    }

    processWithdraw() {
        const account = document.getElementById('withdrawAccount').value;
        const amount = parseFloat(document.getElementById('withdrawAmount').value);

        if (!amount || amount <= 0) {
            this.showError('Please enter a valid amount.');
            return;
        }
        if (this.accounts[account].balance < amount) {
            this.showError('Insufficient funds for this withdrawal.');
            return;
        }

        this.accounts[account].balance -= amount;
        this.addTransaction('withdrawal', account, -amount, `Withdrawal from ${account} account`);
        this.updateAccountDisplay();
        this.updateTransactionHistory();
        this.saveCurrentUser();
        this.hideTransactionForms();
        this.showSuccess(`Successfully withdrew $${amount.toFixed(2)} from your ${account} account.`);
        document.getElementById('withdrawAmount').value = '';
    }

    processTransfer() {
        const fromAccount = document.getElementById('transferFrom').value;
        const toAccount = document.getElementById('transferTo').value;
        const amount = parseFloat(document.getElementById('transferAmount').value);

        if (!amount || amount <= 0) {
            this.showError('Please enter a valid amount.');
            return;
        }
        if (fromAccount === toAccount) {
            this.showError('Cannot transfer to the same account.');
            return;
        }
        if (this.accounts[fromAccount].balance < amount) {
            this.showError('Insufficient funds for this transfer.');
            return;
        }

        this.accounts[fromAccount].balance -= amount;
        this.accounts[toAccount].balance += amount;
        this.addTransaction('transfer', fromAccount, -amount, `Transfer to ${toAccount} account`);
        this.addTransaction('transfer', toAccount, amount, `Transfer from ${fromAccount} account`);
        this.updateAccountDisplay();
        this.updateTransactionHistory();
        this.saveCurrentUser();
        this.hideTransactionForms();
        this.showSuccess(`Successfully transferred $${amount.toFixed(2)} from ${fromAccount} to ${toAccount}.`);
        document.getElementById('transferAmount').value = '';
    }

    processTrustTransaction() {
        const password = document.getElementById('trustPassword').value;
        const action = document.getElementById('trustAction').value;
        const amount = parseFloat(document.getElementById('trustAmount').value);
        const memo = document.getElementById('trustMemo').value.trim() || 'Trust account transaction';

        if (password !== this.bankerPassword) {
            this.showError('Invalid banker password. Only authorized personnel can manage trust accounts.');
            return;
        }
        if (!amount || amount <= 0) {
            this.showError('Please enter a valid amount.');
            return;
        }

        let otherAccount = null;
        if (action === 'transfer-to' || action === 'transfer-from') {
            otherAccount = document.getElementById('trustOtherSelect').value;
        }

        switch (action) {
            case 'deposit':
                this.accounts.trust.balance += amount;
                this.addTransaction('trust-deposit', 'trust', amount, `Trust Account: ${memo}`);
                this.showSuccess(`Successfully deposited $${amount.toFixed(2)} to Trust Account.`);
                break;

            case 'withdraw':
                if (this.accounts.trust.balance < amount) {
                    this.showError('Insufficient funds in Trust Account.');
                    return;
                }
                this.accounts.trust.balance -= amount;
                this.addTransaction('trust-withdrawal', 'trust', -amount, `Trust Account: ${memo}`);
                this.showSuccess(`Successfully withdrew $${amount.toFixed(2)} from Trust Account.`);
                break;

            case 'transfer-to':
                if (this.accounts[otherAccount].balance < amount) {
                    this.showError(`Insufficient funds in ${otherAccount} account.`);
                    return;
                }
                this.accounts[otherAccount].balance -= amount;
                this.accounts.trust.balance += amount;
                this.addTransaction('trust-transfer', otherAccount, -amount, `Transfer to Trust Account: ${memo}`);
                this.addTransaction('trust-transfer', 'trust', amount, `Transfer from ${otherAccount}: ${memo}`);
                this.showSuccess(`Successfully transferred $${amount.toFixed(2)} from ${otherAccount} to Trust Account.`);
                break;

            case 'transfer-from':
                if (this.accounts.trust.balance < amount) {
                    this.showError('Insufficient funds in Trust Account.');
                    return;
                }
                this.accounts.trust.balance -= amount;
                this.accounts[otherAccount].balance += amount;
                this.addTransaction('trust-transfer', 'trust', -amount, `Transfer to ${otherAccount}: ${memo}`);
                this.addTransaction('trust-transfer', otherAccount, amount, `Transfer from Trust Account: ${memo}`);
                this.showSuccess(`Successfully transferred $${amount.toFixed(2)} from Trust Account to ${otherAccount}.`);
                break;
        }

        this.updateAccountDisplay();
        this.updateTransactionHistory();
        this.saveCurrentUser();
        this.hideTransactionForms();
        document.getElementById('trustPassword').value = '';
        document.getElementById('trustAmount').value = '';
        document.getElementById('trustMemo').value = '';
    }

    // =================================
    // PAYMENT SYSTEM INTEGRATION
    // =================================

    processPayment(amount, description, accountType = 'checking') {
        if (!this.isLoggedIn) {
            return { success: false, message: 'Please log in to your bank account first.' };
        }
        if (!this.accounts[accountType]) {
            return { success: false, message: `Invalid account type: ${accountType}` };
        }

        // Trust account payments need special authorization
        if (accountType === 'trust') {
            if (!description || !description.includes('[TRUST_AUTHORIZED]')) {
                return { success: false, message: 'Trust account payments require special authorization.' };
            }
            description = description.replace('[TRUST_AUTHORIZED]', '').trim();
        }

        if (this.accounts[accountType].balance < amount) {
            return {
                success: false,
                message: `Insufficient funds in ${accountType} account. Available balance: $${this.accounts[accountType].balance.toFixed(2)}`
            };
        }

        this.accounts[accountType].balance -= amount;
        const transactionType = accountType === 'trust' ? 'trust-payment' : 'payment';
        this.addTransaction(transactionType, accountType, -amount, description || 'Online purchase');

        // Update display if dashboard is visible
        try {
            const dashboardSection = document.getElementById('dashboardSection');
            if (dashboardSection && !dashboardSection.classList.contains('hidden')) {
                this.updateAccountDisplay();
                this.updateTransactionHistory();
            }
        } catch (_) {
            // Dashboard not available — payment processed from external site
        }

        this.saveCurrentUser();

        return {
            success: true,
            message: `Payment of $${amount.toFixed(2)} processed successfully from ${accountType} account.`,
            remainingBalance: this.accounts[accountType].balance,
            accountUsed: accountType
        };
    }

    checkFunds(amount, accountType = 'checking') {
        if (!this.isLoggedIn || !this.accounts[accountType]) {
            return { hasEnough: false, balance: 0, accountType };
        }
        return {
            hasEnough: this.accounts[accountType].balance >= amount,
            balance: this.accounts[accountType].balance,
            accountType
        };
    }

    getAccountBalances() {
        if (!this.isLoggedIn) {
            return { checking: 0, savings: 0, trust: 0 };
        }
        return {
            checking: this.accounts.checking.balance,
            savings: this.accounts.savings.balance,
            trust: this.accounts.trust.balance
        };
    }

    hasTrustAccess() {
        return this.isLoggedIn && this.accounts.trust;
    }

    // =================================
    // TRANSACTION HISTORY
    // =================================

    addTransaction(type, account, amount, description) {
        const transaction = {
            id: Date.now() + Math.random(),
            type,
            account,
            amount,
            description,
            date: new Date().toISOString(),
            timestamp: Date.now()
        };

        this.transactions.unshift(transaction);

        // Keep only last 50 transactions
        if (this.transactions.length > 50) {
            this.transactions = this.transactions.slice(0, 50);
        }
    }

    updateTransactionHistory() {
        const transactionList = document.getElementById('transactionList');
        if (!transactionList) return;

        if (this.transactions.length === 0) {
            transactionList.innerHTML = '<div class="bank-no-transactions">No transactions yet. Start by making a deposit!</div>';
            return;
        }

        let html = '';
        const crownIcon = (typeof ElxaIcons !== 'undefined')
            ? ElxaIcons.renderAction('crown') + ' '
            : '';

        this.transactions.slice(0, 10).forEach(transaction => {
            const date = new Date(transaction.date).toLocaleDateString();
            const time = new Date(transaction.date).toLocaleTimeString();
            const amountClass = transaction.amount >= 0 ? 'positive' : 'negative';
            const amountText = transaction.amount >= 0
                ? `+$${transaction.amount.toFixed(2)}`
                : `-$${Math.abs(transaction.amount).toFixed(2)}`;
            const isTrust = transaction.account === 'trust' || transaction.type.includes('trust');
            const trustPrefix = isTrust ? crownIcon : '';

            html += `
                <div class="bank-transaction-item">
                    <div class="bank-transaction-date">${date} ${time}</div>
                    <div class="bank-transaction-desc">${trustPrefix}${transaction.description}</div>
                    <div class="bank-transaction-amount ${amountClass}">${amountText}</div>
                </div>
            `;
        });

        transactionList.innerHTML = html;
    }

    // =================================
    // UTILITY METHODS
    // =================================

    refreshAccount() {
        this.updateDashboard();
        this.showSuccess('Account information refreshed.');
    }

    generateAccountNumber(prefix) {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
        return `${prefix}-${timestamp}-${random}`;
    }

    clearRegistrationForm() {
        const fields = ['regFirstName', 'regLastName', 'regUsername', 'regPassword', 'regConfirmPassword'];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    }

    // =================================
    // STORAGE METHODS
    // =================================

    saveUser(userData) {
        try {
            localStorage.setItem(`elxaOS-bank-user-${userData.username}`, JSON.stringify(userData));

            // Also save to ElxaOS file system if available
            try {
                if (typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
                    try { elxaOS.fileSystem.createFolder(['root', 'System'], 'Bank'); } catch (_) { /* exists */ }
                    const fileName = `bank-user-${userData.username}.json`;
                    elxaOS.fileSystem.createFile(['root', 'System', 'Bank'], fileName, JSON.stringify(userData, null, 2), 'json');
                }
            } catch (_) {
                // ElxaOS file system not available — localStorage succeeded
            }
        } catch (error) {
            console.error('Failed to save user data:', error);
        }
    }

    loadUser(username) {
        try {
            // Try localStorage first
            const localData = localStorage.getItem(`elxaOS-bank-user-${username}`);
            if (localData) {
                const userData = JSON.parse(localData);
                // Migration: add trust account if missing
                if (!userData.accounts.trust) {
                    userData.accounts.trust = { balance: 0, number: this.generateAccountNumber('TRU') };
                    this.saveUser(userData);
                }
                return userData;
            }

            // Fallback: try ElxaOS file system
            if (typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
                try {
                    const file = elxaOS.fileSystem.getFile(['root', 'System', 'Bank'], `bank-user-${username}.json`);
                    if (file && file.content) {
                        const userData = JSON.parse(file.content);
                        if (!userData.accounts.trust) {
                            userData.accounts.trust = { balance: 0, number: this.generateAccountNumber('TRU') };
                        }
                        localStorage.setItem(`elxaOS-bank-user-${username}`, JSON.stringify(userData));
                        return userData;
                    }
                } catch (_) { /* file system failed */ }
            }

            return null;
        } catch (error) {
            console.error('Failed to load user data:', error);
            return null;
        }
    }

    userExists(username) {
        return this.loadUser(username) !== null;
    }

    saveCurrentUser() {
        if (this.currentUser) {
            this.currentUser.accounts = this.accounts;
            this.currentUser.transactions = this.transactions;
            this.saveUser(this.currentUser);
        }
    }

    saveUserSession() {
        try {
            const sessionData = { username: this.currentUser.username, loginTime: Date.now() };
            localStorage.setItem('elxaOS-bank-session', JSON.stringify(sessionData));

            if (typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
                try {
                    try { elxaOS.fileSystem.createFolder(['root', 'System'], 'Bank'); } catch (_) { /* exists */ }
                    elxaOS.fileSystem.createFile(['root', 'System', 'Bank'], 'bank-session.json', JSON.stringify(sessionData), 'json');
                } catch (_) { /* file system not available */ }
            }
        } catch (error) {
            console.error('Failed to save session:', error);
        }
    }

    loadUserSession() {
        try {
            let sessionData = null;

            const localSession = localStorage.getItem('elxaOS-bank-session');
            if (localSession) {
                sessionData = JSON.parse(localSession);
            }

            // Fallback: ElxaOS file system
            if (!sessionData && typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
                try {
                    const file = elxaOS.fileSystem.getFile(['root', 'System', 'Bank'], 'bank-session.json');
                    if (file && file.content) {
                        sessionData = JSON.parse(file.content);
                        localStorage.setItem('elxaOS-bank-session', JSON.stringify(sessionData));
                    }
                } catch (_) { /* file system failed */ }
            }

            if (sessionData) {
                const sessionAge = Date.now() - sessionData.loginTime;
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours

                if (sessionAge < maxAge) {
                    const userData = this.loadUser(sessionData.username);
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
    }

    clearUserSession() {
        try {
            localStorage.removeItem('elxaOS-bank-session');
            if (typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
                try { elxaOS.fileSystem.deleteItem(['root', 'System', 'Bank'], 'bank-session.json'); } catch (_) { /* ok */ }
            }
        } catch (error) {
            console.error('Failed to clear session:', error);
        }
    }

    // =================================
    // MESSAGE DISPLAY
    // =================================

    showError(message) {
        this.clearMessages();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bank-error';
        errorDiv.textContent = message;

        const content = document.querySelector('.bank-content');
        if (content) content.insertBefore(errorDiv, content.firstChild);

        const timeoutId = setTimeout(() => {
            if (errorDiv.parentNode) errorDiv.parentNode.removeChild(errorDiv);
        }, 5000);
        this._messageTimeoutIds.push(timeoutId);
    }

    showSuccess(message) {
        this.clearMessages();
        const successDiv = document.createElement('div');
        successDiv.className = 'bank-success';
        successDiv.textContent = message;

        const content = document.querySelector('.bank-content');
        if (content) content.insertBefore(successDiv, content.firstChild);

        const timeoutId = setTimeout(() => {
            if (successDiv.parentNode) successDiv.parentNode.removeChild(successDiv);
        }, 4000);
        this._messageTimeoutIds.push(timeoutId);
    }

    clearMessages() {
        const messages = document.querySelectorAll('.bank-error, .bank-success');
        messages.forEach(msg => {
            if (msg.parentNode) msg.parentNode.removeChild(msg);
        });
    }
};

// Create global instance
window.bankSystem = new BankSystem();

// Auto-init when loaded inside the browser (interwebs page)
if (document.querySelector('.bank-website-root')) {
    window.bankSystem.init();
}
