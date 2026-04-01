// =================================
// FIRST SNAKESIAN BANK SYSTEM — Core
// Class definition, lifecycle, event delegation, auth, navigation, dashboard
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

        // Auto-login from ElxaOS if finance service is ready
        if (this._autoLoginFromElxaOS()) {
            this.showDashboard();
            return;
        }

        // Fallback: restore localStorage session (pre-merge path)
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

                // Credit Score & Cards
                case 'show-apply-cards':    this.showApplyForCards(); break;
                case 'show-my-cards':       this.showMyCards(); break;
                case 'apply-card':          this.applyForCard(actionEl.dataset.tier); break;
                case 'apply-secured-card':  this.applyForSecuredCardUI(); break;
                case 'show-card-payment':   this.showCardPaymentForm(actionEl.dataset.cardId); break;
                case 'close-card':          this.closeCard(actionEl.dataset.cardId); break;
                case 'process-card-payment': this.processCardPayment(); break;
                case 'cancel-card-section':  this.hideCardSections(); break;

                // Card application modal
                case 'close-apply-modal':       this.closeCardApplicationModal(); break;
                case 'apply-modal-view-cards':  this.closeCardApplicationModal(); this.showDashboard(); break;
                case 'apply-modal-back':        this.closeCardApplicationModal(); break;

                // Loans
                case 'show-apply-loans':        this.showApplyForLoans(); break;
                case 'show-loan-form':          this.showLoanApplicationForm(actionEl.dataset.loanType); break;
                case 'submit-loan-application': this.submitLoanApplication(); break;
                case 'show-loan-payment':       this.showLoanPaymentForm(actionEl.dataset.loanId); break;
                case 'process-loan-payment':    this.processLoanPayment(); break;
                case 'payoff-loan':             this.payOffLoan(actionEl.dataset.loanId); break;
                case 'cancel-loan-section':     this.hideLoanSections(); break;
                case 'show-loan-schedule':      this.showAmortizationSchedule(actionEl.dataset.loanId); break;
                case 'close-schedule-modal':    this.closeScheduleModal(); break;

                // Loan application modal
                case 'close-loan-modal':        this.closeLoanModal(); break;
                case 'loan-modal-dashboard':    this.closeLoanModal(); this.showDashboard(); break;

                // Transaction processing
                case 'process-deposit':  this.processDeposit(); break;
                case 'process-withdraw': this.processWithdraw(); break;
                case 'process-transfer': this.processTransfer(); break;
                case 'process-trust':    this.processTrustTransaction(); break;
                case 'cancel-form':      this.hideTransactionForms(); break;
            }
        });

        // Change delegation — trust action select
        var trustAction = this._root.querySelector('#trustAction');
        if (trustAction) {
            trustAction.addEventListener('change', () => this.updateTrustFormFields());
        }
    }

    _setupCurrencyConverter() {
        if (!this._root) return;
        var usdInput = this._root.querySelector('#usdInput');
        var snakeInput = this._root.querySelector('#snakeInput');
        if (!usdInput || !snakeInput) return;

        usdInput.addEventListener('input', () => {
            var usd = parseFloat(usdInput.value) || 0;
            snakeInput.value = (usd * 2).toFixed(2);
        });

        snakeInput.addEventListener('input', () => {
            var snakes = parseFloat(snakeInput.value) || 0;
            usdInput.value = (snakes / 2).toFixed(2);
        });
    }

    _setupKeyHandler() {
        this._keyHandler = (e) => {
            if (e.key !== 'Enter') return;
            if (!this._root || !this._root.isConnected) return;

            var loginSection = this._root.querySelector('#loginSection');
            if (loginSection && !loginSection.classList.contains('hidden')) {
                this.login();
                return;
            }
            var registerSection = this._root.querySelector('#registerSection');
            if (registerSection && !registerSection.classList.contains('hidden')) {
                this.register();
            }
        };
        document.addEventListener('keypress', this._keyHandler);
    }

    _updateNav() {
        var loginLink = document.getElementById('navLoginLink');
        var registerLink = document.getElementById('navRegisterLink');
        var loggedInNav = document.getElementById('loggedInNav');

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
    // ELXAOS AUTO-LOGIN
    // =================================

    _autoLoginFromElxaOS() {
        // If the OS finance service is ready, the user is logged into ElxaOS.
        // Skip the bank's own login and go straight to the dashboard.
        if (typeof elxaOS === 'undefined' || !elxaOS.financeService || !elxaOS.financeService.isReady()) {
            return false;
        }
        if (!elxaOS.registry || !elxaOS.registry.isLoggedIn()) {
            return false;
        }

        var username = elxaOS.registry.getCurrentUsername();
        if (!username) return false;

        // Check for existing bank user data (preserves account numbers, name)
        var existingUser = this.loadUser(username);

        // Get display name from registry profile cache
        var displayName = username;
        try {
            var cached = elxaOS.registry._profileCache;
            if (cached && cached.displayName) {
                displayName = cached.displayName;
            }
        } catch (_) {}

        // Split display name for first/last — prefer existing bank data if available
        var nameParts = displayName.split(' ');
        var firstName = (existingUser && existingUser.firstName) ? existingUser.firstName : (nameParts[0] || username);
        var lastName = (existingUser && existingUser.lastName) ? existingUser.lastName : (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');

        // Get live balances from finance service
        var balances = elxaOS.financeService.getAccountBalancesSync();

        this.currentUser = {
            username: username,
            firstName: firstName,
            lastName: lastName,
            dateCreated: existingUser ? existingUser.dateCreated : new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            accounts: {
                checking: { balance: balances.checking, number: (existingUser && existingUser.accounts.checking) ? existingUser.accounts.checking.number : this.generateAccountNumber('CHK') },
                savings:  { balance: balances.savings,  number: (existingUser && existingUser.accounts.savings)  ? existingUser.accounts.savings.number  : this.generateAccountNumber('SAV') },
                trust:    { balance: balances.trust,    number: (existingUser && existingUser.accounts.trust)    ? existingUser.accounts.trust.number    : this.generateAccountNumber('TRU') }
            },
            transactions: (existingUser && existingUser.transactions) ? existingUser.transactions : []
        };

        this.isLoggedIn = true;
        this.accounts = this.currentUser.accounts;
        this.transactions = this.currentUser.transactions;

        // Save so localStorage stays in sync for backward compatibility
        this.saveUser(this.currentUser);
        this.saveUserSession();

        return true;
    }

    // =================================
    // ACCOUNT MANAGEMENT (legacy login/register)
    // =================================

    register() {
        var firstName = document.getElementById('regFirstName').value.trim();
        var lastName = document.getElementById('regLastName').value.trim();
        var username = document.getElementById('regUsername').value.trim();
        var password = document.getElementById('regPassword').value;
        var confirmPassword = document.getElementById('regConfirmPassword').value;

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

        var newUser = {
            username: username,
            password: password,
            firstName: firstName,
            lastName: lastName,
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
        var username = document.getElementById('loginUsername').value.trim();
        var password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            this.showError('Please enter both username and password.');
            return;
        }

        var userData = this.loadUser(username);
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
        this.showSuccess('Welcome back, ' + userData.firstName + '!');
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
            var el = document.getElementById('loginUsername');
            if (el) el.focus();
        }, 100);
    }

    showRegister() {
        this.hideAllSections();
        document.getElementById('registerSection').classList.remove('hidden');
        this._updateNav();
        this.clearMessages();
        setTimeout(() => {
            var el = document.getElementById('regFirstName');
            if (el) el.focus();
        }, 100);
    }

    showDashboard() {
        if (!this.isLoggedIn) {
            this.showLogin();
            return;
        }
        this.hideAllSections();
        var dashboardEl = document.getElementById('dashboardSection');
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
        var sections = ['loginSection', 'registerSection', 'dashboardSection', 'cardApplySection', 'loanApplySection', 'aboutSection', 'locationsSection', 'helpSection'];
        sections.forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
    }

    // =================================
    // DASHBOARD UPDATES
    // =================================

    updateDashboard() {
        if (!this.currentUser) return;

        var welcomeNameEl = document.getElementById('welcomeName');
        if (welcomeNameEl) welcomeNameEl.textContent = this.currentUser.firstName;

        var lastLogin = this.currentUser.lastLogin
            ? new Date(this.currentUser.lastLogin).toLocaleString()
            : 'First time login';
        var lastLoginEl = document.getElementById('lastLogin');
        if (lastLoginEl) lastLoginEl.textContent = lastLogin;

        this.updateAccountDisplay();

        var checkingNumberEl = document.getElementById('checkingNumber');
        var savingsNumberEl = document.getElementById('savingsNumber');
        var trustNumberEl = document.getElementById('trustNumber');
        if (checkingNumberEl && this.accounts.checking.number) checkingNumberEl.textContent = this.accounts.checking.number;
        if (savingsNumberEl && this.accounts.savings.number) savingsNumberEl.textContent = this.accounts.savings.number;
        if (trustNumberEl && this.accounts.trust.number) trustNumberEl.textContent = this.accounts.trust.number;

        // Credit Score & Cards (Phase 2.5)
        this.renderCreditScoreWidget();
        this.renderMyCardsSection();

        // Loans (Phase 3)
        this.renderMyLoansSection();

        this.updateTransactionHistory();
    }

    updateAccountDisplay() {
        var checkingUSD = this.accounts.checking.balance.toFixed(2);
        var checkingSnakes = (this.accounts.checking.balance * this.exchangeRate).toFixed(0);
        var savingsUSD = this.accounts.savings.balance.toFixed(2);
        var savingsSnakes = (this.accounts.savings.balance * this.exchangeRate).toFixed(0);
        var trustUSD = this.accounts.trust.balance.toFixed(2);
        var trustSnakes = (this.accounts.trust.balance * this.exchangeRate).toFixed(0);

        var checkingBalanceEl = document.getElementById('checkingBalance');
        var savingsBalanceEl = document.getElementById('savingsBalance');
        var trustBalanceEl = document.getElementById('trustBalance');
        if (checkingBalanceEl) checkingBalanceEl.textContent = '$' + checkingUSD + ' (' + checkingSnakes + '\u{1f40d})';
        if (savingsBalanceEl) savingsBalanceEl.textContent = '$' + savingsUSD + ' (' + savingsSnakes + '\u{1f40d})';
        if (trustBalanceEl) trustBalanceEl.textContent = '$' + trustUSD + ' (' + trustSnakes + '\u{1f40d})';
    }

    // =================================
    // MESSAGE DISPLAY
    // =================================

    showError(message) {
        this.clearMessages();
        var errorDiv = document.createElement('div');
        errorDiv.className = 'bank-error';
        errorDiv.textContent = message;

        var content = document.querySelector('.bank-content');
        if (content) content.insertBefore(errorDiv, content.firstChild);

        var timeoutId = setTimeout(function() {
            if (errorDiv.parentNode) errorDiv.parentNode.removeChild(errorDiv);
        }, 5000);
        this._messageTimeoutIds.push(timeoutId);
    }

    showSuccess(message) {
        this.clearMessages();
        var successDiv = document.createElement('div');
        successDiv.className = 'bank-success';
        successDiv.textContent = message;

        var content = document.querySelector('.bank-content');
        if (content) content.insertBefore(successDiv, content.firstChild);

        var timeoutId = setTimeout(function() {
            if (successDiv.parentNode) successDiv.parentNode.removeChild(successDiv);
        }, 4000);
        this._messageTimeoutIds.push(timeoutId);
    }

    clearMessages() {
        var messages = document.querySelectorAll('.bank-error, .bank-success');
        messages.forEach(function(msg) {
            if (msg.parentNode) msg.parentNode.removeChild(msg);
        });
    }
};