// =================================
// FIRST SNAKESIAN BANK SYSTEM - ENHANCED WITH TRUST ACCOUNT PAYMENTS
// Handles online banking functionality with payment system integration
// =================================

class BankSystem {
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
        this.setupEventListeners();
        
        // Register with the global payment system if it exists
        if (typeof window.bankSystem === 'undefined') {
            window.bankSystem = this;
        }
    }

    init() {
        // Try to restore session if user was logged in
        this.loadUserSession();
        
        // Show appropriate section
        if (this.isLoggedIn) {
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }

    setupEventListeners() {
        // Handle Enter key in login form
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const activeSection = document.querySelector('.bank-login-form:not(.hidden)');
                if (activeSection) {
                    this.login();
                }
                const registerSection = document.querySelector('.bank-register-form:not(.hidden)');
                if (registerSection) {
                    this.register();
                }
            }
        });
    }

    // ===== ACCOUNT MANAGEMENT =====

    register() {
        const firstName = document.getElementById('regFirstName').value.trim();
        const lastName = document.getElementById('regLastName').value.trim();
        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;

        // Validation
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

        // Check if username already exists
        if (this.userExists(username)) {
            this.showError('Username already exists. Please choose a different username.');
            return;
        }

        // Create new user account
        const newUser = {
            username: username,
            password: password, // In a real system, this would be hashed
            firstName: firstName,
            lastName: lastName,
            dateCreated: new Date().toISOString(),
            lastLogin: null,
            accounts: {
                checking: { 
                    balance: 0, 
                    number: this.generateAccountNumber('CHK') 
                },
                savings: { 
                    balance: 0, 
                    number: this.generateAccountNumber('SAV') 
                },
                trust: { 
                    balance: 0, 
                    number: this.generateAccountNumber('TRU') 
                }
            },
            transactions: []
        };

        // Save user to storage
        this.saveUser(newUser);

        this.showSuccess('Account created successfully! Please log in with your new credentials.');
        this.showLogin();

        // Clear the registration form
        this.clearRegistrationForm();
    }

    login() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            this.showError('Please enter both username and password.');
            return;
        }

        // Load user data
        const userData = this.loadUser(username);
        
        if (!userData || userData.password !== password) {
            this.showError('Invalid username or password.');
            return;
        }

        // Update last login
        userData.lastLogin = new Date().toISOString();
        this.saveUser(userData);

        // Set current user
        this.currentUser = userData;
        this.isLoggedIn = true;
        this.accounts = userData.accounts;
        this.transactions = userData.transactions || [];

        // Save session
        this.saveUserSession();

        // Show dashboard
        this.showDashboard();
        this.showSuccess(`Welcome back, ${userData.firstName}!`);
    }

    logout() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.accounts = { checking: { balance: 0 }, savings: { balance: 0 }, trust: { balance: 0 } };
        this.transactions = [];
        
        // Clear session
        this.clearUserSession();
        
        // Show login page
        this.showLogin();
        this.showSuccess('You have been logged out successfully.');
    }

    // ===== USER INTERFACE =====

    showLogin() {
        this.hideAllSections();
        document.getElementById('loginSection').classList.remove('hidden');
        document.getElementById('loggedInNav').classList.add('hidden');
        
        // Clear any previous error messages
        this.clearMessages();
        
        // Focus on username field
        setTimeout(() => {
            document.getElementById('loginUsername').focus();
        }, 100);
    }

    showRegister() {
        this.hideAllSections();
        document.getElementById('registerSection').classList.remove('hidden');
        document.getElementById('loggedInNav').classList.add('hidden');
        
        // Clear any previous error messages
        this.clearMessages();
        
        // Focus on first name field
        setTimeout(() => {
            document.getElementById('regFirstName').focus();
        }, 100);
    }

    showDashboard() {
        if (!this.isLoggedIn) {
            console.log('❌ Not logged in, redirecting to login');
            this.showLogin();
            return;
        }

        console.log('📊 Showing dashboard...');
        
        this.hideAllSections();
        
        const dashboardEl = document.getElementById('dashboardSection');
        if (dashboardEl) {
            dashboardEl.classList.remove('hidden');
            console.log('✅ Dashboard section shown');
        } else {
            console.error('❌ Dashboard section not found!');
            return;
        }
        
        const loggedInNavEl = document.getElementById('loggedInNav');
        if (loggedInNavEl) {
            loggedInNavEl.classList.remove('hidden');
            console.log('✅ Logged in nav shown');
        }

        // Update dashboard content
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
        console.log('🙈 Hiding all sections...');
        
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.classList.add('hidden');
                console.log(`✅ Hidden ${id}`);
            } else {
                console.error(`❌ Element ${id} not found`);
            }
        });
    }

    updateDashboard() {
        if (!this.currentUser) {
            console.error('❌ No current user for dashboard update');
            return;
        }

        console.log('📊 Updating dashboard for:', this.currentUser.firstName);

        try {
            // Update welcome message
            const welcomeNameEl = document.getElementById('welcomeName');
            if (welcomeNameEl) {
                welcomeNameEl.textContent = this.currentUser.firstName;
                console.log('✅ Updated welcome name');
            }
            
            const lastLogin = this.currentUser.lastLogin ? 
                new Date(this.currentUser.lastLogin).toLocaleString() : 
                'First time login';
            const lastLoginEl = document.getElementById('lastLogin');
            if (lastLoginEl) {
                lastLoginEl.textContent = lastLogin;
                console.log('✅ Updated last login');
            }

            // Update account balances
            this.updateAccountDisplay();

            // Update account numbers
            const checkingNumberEl = document.getElementById('checkingNumber');
            const savingsNumberEl = document.getElementById('savingsNumber');
            const trustNumberEl = document.getElementById('trustNumber');
            
            if (checkingNumberEl && this.accounts.checking.number) {
                checkingNumberEl.textContent = this.accounts.checking.number;
            }
            
            if (savingsNumberEl && this.accounts.savings.number) {
                savingsNumberEl.textContent = this.accounts.savings.number;
            }
            
            if (trustNumberEl && this.accounts.trust.number) {
                trustNumberEl.textContent = this.accounts.trust.number;
            }

            // Update transaction history
            this.updateTransactionHistory();
            
            console.log('✅ Dashboard update complete');
        } catch (error) {
            console.error('💥 Error updating dashboard:', error);
        }
    }

    updateAccountDisplay() {
        console.log('💰 Updating account display...');
        
        try {
            const checkingUSD = this.accounts.checking.balance.toFixed(2);
            const checkingSnakes = (this.accounts.checking.balance * this.exchangeRate).toFixed(0);
            const savingsUSD = this.accounts.savings.balance.toFixed(2);
            const savingsSnakes = (this.accounts.savings.balance * this.exchangeRate).toFixed(0);
            const trustUSD = this.accounts.trust.balance.toFixed(2);
            const trustSnakes = (this.accounts.trust.balance * this.exchangeRate).toFixed(0);

            const checkingBalanceEl = document.getElementById('checkingBalance');
            const savingsBalanceEl = document.getElementById('savingsBalance');
            const trustBalanceEl = document.getElementById('trustBalance');
            
            if (checkingBalanceEl) {
                checkingBalanceEl.textContent = `$${checkingUSD} (${checkingSnakes}🐍)`;
            }
            
            if (savingsBalanceEl) {
                savingsBalanceEl.textContent = `$${savingsUSD} (${savingsSnakes}🐍)`;
            }
            
            if (trustBalanceEl) {
                trustBalanceEl.textContent = `$${trustUSD} (${trustSnakes}🐍)`;
            }
        } catch (error) {
            console.error('💥 Error in updateAccountDisplay:', error);
        }
    }

    // ===== TRANSACTION FORMS =====

    showDepositForm() {
        console.log('💵 Showing deposit form...');
        this.hideTransactionForms();
        
        const depositForm = document.getElementById('depositForm');
        if (depositForm) {
            depositForm.classList.remove('hidden');
            console.log('✅ Deposit form shown');
            
            // Focus on amount input
            setTimeout(() => {
                const amountInput = document.getElementById('depositAmount');
                if (amountInput) {
                    amountInput.focus();
                    console.log('✅ Focused on deposit amount input');
                } else {
                    console.error('❌ depositAmount input not found');
                }
            }, 100);
        } else {
            console.error('❌ depositForm not found');
        }
    }

    showWithdrawForm() {
        console.log('💸 Showing withdraw form...');
        this.hideTransactionForms();
        
        const withdrawForm = document.getElementById('withdrawForm');
        if (withdrawForm) {
            withdrawForm.classList.remove('hidden');
            console.log('✅ Withdraw form shown');
            
            setTimeout(() => {
                const amountInput = document.getElementById('withdrawAmount');
                if (amountInput) {
                    amountInput.focus();
                    console.log('✅ Focused on withdraw amount input');
                } else {
                    console.error('❌ withdrawAmount input not found');
                }
            }, 100);
        } else {
            console.error('❌ withdrawForm not found');
        }
    }

    showTransferForm() {
        console.log('↔️ Showing transfer form...');
        this.hideTransactionForms();
        
        const transferForm = document.getElementById('transferForm');
        if (transferForm) {
            transferForm.classList.remove('hidden');
            console.log('✅ Transfer form shown');
            
            setTimeout(() => {
                const amountInput = document.getElementById('transferAmount');
                if (amountInput) {
                    amountInput.focus();
                    console.log('✅ Focused on transfer amount input');
                } else {
                    console.error('❌ transferAmount input not found');
                }
            }, 100);
        } else {
            console.error('❌ transferForm not found');
        }
    }

    showTrustForm() {
        console.log('👑 Showing trust form...');
        this.hideTransactionForms();
        
        const trustForm = document.getElementById('trustForm');
        if (trustForm) {
            trustForm.classList.remove('hidden');
            this.updateTrustFormFields();
            console.log('✅ Trust form shown');
            
            setTimeout(() => {
                const passwordInput = document.getElementById('trustPassword');
                if (passwordInput) {
                    passwordInput.focus();
                    console.log('✅ Focused on trust password input');
                } else {
                    console.error('❌ trustPassword input not found');
                }
            }, 100);
        } else {
            console.error('❌ trustForm not found');
        }
    }

    updateTrustFormFields() {
        const action = document.getElementById('trustAction').value;
        const otherAccountDiv = document.getElementById('trustOtherAccount');
        
        if (otherAccountDiv) {
            if (action === 'deposit' || action === 'withdraw') {
                otherAccountDiv.style.display = 'none';
            } else {
                otherAccountDiv.style.display = 'block';
            }
        }
    }

    hideTransactionForms() {
        const forms = ['depositForm', 'withdrawForm', 'transferForm', 'trustForm'];
        console.log('🙈 Hiding transaction forms...');
        
        forms.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.classList.add('hidden');
                console.log(`✅ Hidden ${id}`);
            } else {
                console.error(`❌ Form ${id} not found`);
            }
        });
    }

    // ===== TRANSACTION PROCESSING =====

    processDeposit() {
        const account = document.getElementById('depositAccount').value;
        const amount = parseFloat(document.getElementById('depositAmount').value);

        if (!amount || amount <= 0) {
            this.showError('Please enter a valid amount.');
            return;
        }

        // Process the deposit
        this.accounts[account].balance += amount;
        
        // Record transaction
        this.addTransaction('deposit', account, amount, `Deposit to ${account} account`);
        
        // Update display
        this.updateAccountDisplay();
        this.updateTransactionHistory();
        
        // Save to storage
        this.saveCurrentUser();
        
        // Hide form and show success
        this.hideTransactionForms();
        this.showSuccess(`Successfully deposited $${amount.toFixed(2)} to your ${account} account.`);
        
        // Clear form
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

        // Process the withdrawal
        this.accounts[account].balance -= amount;
        
        // Record transaction
        this.addTransaction('withdrawal', account, -amount, `Withdrawal from ${account} account`);
        
        // Update display
        this.updateAccountDisplay();
        this.updateTransactionHistory();
        
        // Save to storage
        this.saveCurrentUser();
        
        // Hide form and show success
        this.hideTransactionForms();
        this.showSuccess(`Successfully withdrew $${amount.toFixed(2)} from your ${account} account.`);
        
        // Clear form
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

        // Process the transfer
        this.accounts[fromAccount].balance -= amount;
        this.accounts[toAccount].balance += amount;
        
        // Record transactions
        this.addTransaction('transfer', fromAccount, -amount, `Transfer to ${toAccount} account`);
        this.addTransaction('transfer', toAccount, amount, `Transfer from ${fromAccount} account`);
        
        // Update display
        this.updateAccountDisplay();
        this.updateTransactionHistory();
        
        // Save to storage
        this.saveCurrentUser();
        
        // Hide form and show success
        this.hideTransactionForms();
        this.showSuccess(`Successfully transferred $${amount.toFixed(2)} from ${fromAccount} to ${toAccount}.`);
        
        // Clear form
        document.getElementById('transferAmount').value = '';
    }

    processTrustTransaction() {
        const password = document.getElementById('trustPassword').value;
        const action = document.getElementById('trustAction').value;
        const amount = parseFloat(document.getElementById('trustAmount').value);
        const memo = document.getElementById('trustMemo').value.trim() || 'Trust account transaction';

        // Verify banker password
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

        try {
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

            // Update display and save
            this.updateAccountDisplay();
            this.updateTransactionHistory();
            this.saveCurrentUser();
            
            // Hide form and clear fields
            this.hideTransactionForms();
            document.getElementById('trustPassword').value = '';
            document.getElementById('trustAmount').value = '';
            document.getElementById('trustMemo').value = '';

        } catch (error) {
            console.error('Error processing trust transaction:', error);
            this.showError('An error occurred processing the transaction.');
        }
    }

    // ===== PAYMENT SYSTEM INTEGRATION - ENHANCED FOR ACCOUNT SELECTION =====

    // This method will be called by the payment system when a purchase is made
    // Now supports specifying which account to use (defaults to checking for backward compatibility)
    processPayment(amount, description, accountType = 'checking') {
        if (!this.isLoggedIn) {
            return { success: false, message: 'Please log in to your bank account first.' };
        }

        // Validate account type
        if (!this.accounts[accountType]) {
            return { 
                success: false, 
                message: `Invalid account type: ${accountType}` 
            };
        }

        // For trust account payments, we need special authorization
        if (accountType === 'trust') {
            // Trust account payments should only be processed by authorized systems
            // We'll add a marker to the description to identify authorized trust payments
            if (!description || !description.includes('[TRUST_AUTHORIZED]')) {
                return {
                    success: false,
                    message: 'Trust account payments require special authorization.'
                };
            }
            // Remove the authorization marker from the visible description
            description = description.replace('[TRUST_AUTHORIZED]', '').trim();
        }

        // Check funds in the specified account
        if (this.accounts[accountType].balance < amount) {
            return { 
                success: false, 
                message: `Insufficient funds in ${accountType} account. Available balance: $${this.accounts[accountType].balance.toFixed(2)}` 
            };
        }

        // Process the payment
        this.accounts[accountType].balance -= amount;
        
        // Record transaction with account-specific type
        const transactionType = accountType === 'trust' ? 'trust-payment' : 'payment';
        this.addTransaction(transactionType, accountType, -amount, description || 'Online purchase');
        
        // Update display if dashboard is visible (only if we're on the bank website)
        try {
            const dashboardSection = document.getElementById('dashboardSection');
            if (dashboardSection && !dashboardSection.classList.contains('hidden')) {
                this.updateAccountDisplay();
                this.updateTransactionHistory();
            }
        } catch (error) {
            // Dashboard not available - that's fine, we're probably on a different website
            console.log(`💳 Payment processed from external site using ${accountType} account`);
        }
        
        // Save to storage
        this.saveCurrentUser();
        
        return { 
            success: true, 
            message: `Payment of $${amount.toFixed(2)} processed successfully from ${accountType} account.`,
            remainingBalance: this.accounts[accountType].balance,
            accountUsed: accountType
        };
    }

    // Check if user has sufficient funds for a purchase in a specific account
    checkFunds(amount, accountType = 'checking') {
        if (!this.isLoggedIn) {
            return { hasEnough: false, balance: 0, accountType: accountType };
        }
        
        if (!this.accounts[accountType]) {
            return { hasEnough: false, balance: 0, accountType: accountType };
        }
        
        return {
            hasEnough: this.accounts[accountType].balance >= amount,
            balance: this.accounts[accountType].balance,
            accountType: accountType
        };
    }

    // Get current account balances
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

    // New method: Check if user has access to trust account (for UI purposes)
    hasTrustAccess() {
        return this.isLoggedIn && this.accounts.trust;
    }

    // ===== TRANSACTION HISTORY =====

    addTransaction(type, account, amount, description) {
        const transaction = {
            id: Date.now() + Math.random(),
            type: type,
            account: account,
            amount: amount,
            description: description,
            date: new Date().toISOString(),
            timestamp: Date.now()
        };

        this.transactions.unshift(transaction); // Add to beginning of array
        
        // Keep only last 50 transactions
        if (this.transactions.length > 50) {
            this.transactions = this.transactions.slice(0, 50);
        }
    }

    updateTransactionHistory() {
        const transactionList = document.getElementById('transactionList');
        
        if (this.transactions.length === 0) {
            transactionList.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #666; font-size: 11px;">
                    No transactions yet. Start by making a deposit!
                </div>
            `;
            return;
        }

        let html = '';
        this.transactions.slice(0, 10).forEach(transaction => {
            const date = new Date(transaction.date).toLocaleDateString();
            const time = new Date(transaction.date).toLocaleTimeString();
            const amountClass = transaction.amount >= 0 ? 'positive' : 'negative';
            const amountText = transaction.amount >= 0 ? `+$${transaction.amount.toFixed(2)}` : `-$${Math.abs(transaction.amount).toFixed(2)}`;
            
            // Add special styling for trust account transactions
            const trustIcon = transaction.account === 'trust' || transaction.type.includes('trust') ? '👑 ' : '';
            
            html += `
                <div class="bank-transaction-item">
                    <div class="bank-transaction-date">${date} ${time}</div>
                    <div class="bank-transaction-desc">${trustIcon}${transaction.description}</div>
                    <div class="bank-transaction-amount ${amountClass}">${amountText}</div>
                    <div style="clear: both;"></div>
                </div>
            `;
        });

        transactionList.innerHTML = html;
    }

    // ===== UTILITY METHODS =====

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
            const element = document.getElementById(id);
            if (element) element.value = '';
        });
    }

    // ===== STORAGE METHODS - ENHANCED FOR TRUST ACCOUNT =====

    saveUser(userData) {
        try {
            console.log(`💾 Saving user ${userData.username}...`);
            
            // ALWAYS save to localStorage (like other ElxaOS components)
            localStorage.setItem(`elxaOS-bank-user-${userData.username}`, JSON.stringify(userData));
            console.log(`✅ Saved user ${userData.username} to localStorage`);
            
            // ALSO try to save to ElxaOS file system if available
            try {
                if (typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
                    const fileName = `bank-user-${userData.username}.json`;
                    const content = JSON.stringify(userData, null, 2);
                    
                    // Ensure the Bank folder exists
                    try {
                        elxaOS.fileSystem.createFolder(['root', 'System'], 'Bank');
                    } catch (e) {
                        // Folder probably already exists, that's fine
                    }
                    
                    elxaOS.fileSystem.createFile(['root', 'System', 'Bank'], fileName, content, 'json');
                    console.log(`✅ Also saved user ${userData.username} to ElxaOS file system`);
                }
            } catch (fsError) {
                console.log('📁 ElxaOS file system not available or failed, but localStorage succeeded');
            }
            
        } catch (error) {
            console.error('❌ Failed to save user data:', error);
        }
    }

    loadUser(username) {
        try {
            console.log(`📁 Loading user ${username}...`);
            
            // First try localStorage (primary storage)
            const localStorageData = localStorage.getItem(`elxaOS-bank-user-${username}`);
            if (localStorageData) {
                const userData = JSON.parse(localStorageData);
                
                // MIGRATION: Add trust account if it doesn't exist (for existing users)
                if (!userData.accounts.trust) {
                    console.log(`🔄 Adding trust account to existing user ${username}`);
                    userData.accounts.trust = {
                        balance: 0,
                        number: this.generateAccountNumber('TRU')
                    };
                    // Save the updated user data
                    this.saveUser(userData);
                }
                
                console.log(`✅ Loaded user ${username} from localStorage`);
                return userData;
            }
            
            // If not found in localStorage, try ElxaOS file system
            if (typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
                try {
                    const fileName = `bank-user-${username}.json`;
                    const file = elxaOS.fileSystem.getFile(['root', 'System', 'Bank'], fileName);
                    if (file && file.content) {
                        const userData = JSON.parse(file.content);
                        
                        // MIGRATION: Add trust account if it doesn't exist
                        if (!userData.accounts.trust) {
                            console.log(`🔄 Adding trust account to existing user ${username}`);
                            userData.accounts.trust = {
                                balance: 0,
                                number: this.generateAccountNumber('TRU')
                            };
                        }
                        
                        console.log(`✅ Loaded user ${username} from ElxaOS file system`);
                        
                        // Save to localStorage for future quick access
                        localStorage.setItem(`elxaOS-bank-user-${username}`, JSON.stringify(userData));
                        console.log(`✅ Cached user ${username} to localStorage`);
                        
                        return userData;
                    }
                } catch (fsError) {
                    console.log('📁 ElxaOS file system failed, but that\'s okay');
                }
            }
            
            console.log(`❌ User ${username} not found in any storage`);
            return null;
        } catch (error) {
            console.error('❌ Failed to load user data:', error);
            return null;
        }
    }

    userExists(username) {
        const userData = this.loadUser(username);
        return userData !== null;
    }

    saveCurrentUser() {
        if (this.currentUser) {
            // Update current user data with latest account info
            this.currentUser.accounts = this.accounts;
            this.currentUser.transactions = this.transactions;
            this.saveUser(this.currentUser);
        }
    }

    saveUserSession() {
        try {
            const sessionData = {
                username: this.currentUser.username,
                loginTime: Date.now()
            };
            
            // Save session to localStorage (primary)
            localStorage.setItem('elxaOS-bank-session', JSON.stringify(sessionData));
            console.log('💾 Saved session to localStorage');
            
            // Also try to save to ElxaOS file system
            if (typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
                try {
                    // Ensure the Bank folder exists
                    try {
                        elxaOS.fileSystem.createFolder(['root', 'System'], 'Bank');
                    } catch (e) {
                        // Folder probably already exists, that's fine
                    }
                    
                    elxaOS.fileSystem.createFile(['root', 'System', 'Bank'], 'bank-session.json', JSON.stringify(sessionData), 'json');
                    console.log('✅ Also saved session to ElxaOS file system');
                } catch (fsError) {
                    console.log('📁 ElxaOS file system not available for session, but localStorage succeeded');
                }
            }
        } catch (error) {
            console.error('❌ Failed to save session:', error);
        }
    }

    loadUserSession() {
        try {
            let sessionData = null;
            
            // First try localStorage (primary)
            const localStorageSession = localStorage.getItem('elxaOS-bank-session');
            if (localStorageSession) {
                sessionData = JSON.parse(localStorageSession);
                console.log('📁 Loaded session from localStorage');
            }
            
            // If not found, try ElxaOS file system
            if (!sessionData && typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
                try {
                    const file = elxaOS.fileSystem.getFile(['root', 'System', 'Bank'], 'bank-session.json');
                    if (file && file.content) {
                        sessionData = JSON.parse(file.content);
                        console.log('📁 Loaded session from ElxaOS file system');
                        
                        // Cache to localStorage for future
                        localStorage.setItem('elxaOS-bank-session', JSON.stringify(sessionData));
                    }
                } catch (fsError) {
                    console.log('📁 ElxaOS file system session load failed');
                }
            }

            if (sessionData) {
                // Check if session is still valid (24 hours)
                const sessionAge = Date.now() - sessionData.loginTime;
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours

                if (sessionAge < maxAge) {
                    // Restore user session
                    const userData = this.loadUser(sessionData.username);
                    if (userData) {
                        this.currentUser = userData;
                        this.isLoggedIn = true;
                        this.accounts = userData.accounts;
                        this.transactions = userData.transactions || [];
                        console.log('✅ User session restored for:', userData.username);
                        return true;
                    }
                } else {
                    console.log('⏰ Session expired, clearing...');
                    this.clearUserSession();
                }
            }
        } catch (error) {
            console.error('❌ Failed to load session:', error);
        }
        
        return false;
    }

    clearUserSession() {
        try {
            // Clear from localStorage
            localStorage.removeItem('elxaOS-bank-session');
            console.log('🗑️ Cleared session from localStorage');
            
            // Also try to clear from ElxaOS file system
            if (typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
                try {
                    elxaOS.fileSystem.deleteItem(['root', 'System', 'Bank'], 'bank-session.json');
                    console.log('🗑️ Also cleared session from ElxaOS file system');
                } catch (e) {
                    // File might not exist, that's okay
                }
            }
        } catch (error) {
            console.error('❌ Failed to clear session:', error);
        }
    }

    // ===== MESSAGE DISPLAY =====

    showError(message) {
        this.clearMessages();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bank-error';
        errorDiv.textContent = message;
        
        // Insert at the top of the current content area
        const content = document.querySelector('.bank-content');
        if (content) {
            content.insertBefore(errorDiv, content.firstChild);
        }
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    showSuccess(message) {
        this.clearMessages();
        const successDiv = document.createElement('div');
        successDiv.className = 'bank-success';
        successDiv.textContent = message;
        
        // Insert at the top of the current content area
        const content = document.querySelector('.bank-content');
        if (content) {
            content.insertBefore(successDiv, content.firstChild);
        }
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 4000);
    }

    clearMessages() {
        const messages = document.querySelectorAll('.bank-error, .bank-success');
        messages.forEach(msg => {
            if (msg.parentNode) {
                msg.parentNode.removeChild(msg);
            }
        });
    }
}

// Create global instance
window.bankSystem = new BankSystem();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BankSystem;
}