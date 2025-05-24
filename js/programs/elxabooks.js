// =================================
// ELXABOOKS ACCOUNTING PROGRAM - FIXED
// =================================
class ElxaBooksProgram {
    constructor(windowManager, fileSystem, eventBus) {
        this.windowManager = windowManager;
        this.fileSystem = fileSystem;
        this.eventBus = eventBus;
        this.currentTab = 'dashboard';
        
        // Initialize data structure
        this.data = {
            company: {
                name: 'ElxaCorp Industries',
                location: 'Snakesia Business District',
                ceo: 'Mr. Snake-e',
                founded: '2019'
            },
            accounts: [
                { id: 1, name: 'Business Checking', balance: 15750.00, type: 'asset' },
                { id: 2, name: 'Petty Cash', balance: 500.00, type: 'asset' },
                { id: 3, name: 'Office Supplies', balance: 0, type: 'expense' },
                { id: 4, name: 'Snake Food Revenue', balance: 0, type: 'income' },
                { id: 5, name: 'Consulting Services', balance: 0, type: 'income' }
            ],
            transactions: [
                { id: 1, date: '2024-05-20', description: 'Snake Scale Polish Sales', type: 'income', category: 'Product Sales', amount: 2500.00, account: 'Business Checking' },
                { id: 2, date: '2024-05-19', description: 'Office Snake Food', type: 'expense', category: 'Office Expenses', amount: -150.00, account: 'Business Checking' },
                { id: 3, date: '2024-05-18', description: 'ElxaOS License Sales', type: 'income', category: 'Software Sales', amount: 5000.00, account: 'Business Checking' },
                { id: 4, date: '2024-05-17', description: 'Executive Sunglasses', type: 'expense', category: 'Executive Expenses', amount: -299.99, account: 'Business Checking' },
                { id: 5, date: '2024-05-16', description: 'Consulting: Help Small Business', type: 'income', category: 'Consulting', amount: 1200.00, account: 'Business Checking' }
            ],
            invoices: [
                { id: 1001, date: '2024-05-24', customer: 'Gecko Games Ltd.', description: 'ElxaOS Enterprise License', amount: 7500.00, status: 'pending' },
                { id: 1002, date: '2024-05-23', customer: 'Turtle Tech Solutions', description: 'Business Consulting Services', amount: 2400.00, status: 'paid' }
            ],
            categories: {
                income: ['Product Sales', 'Software Sales', 'Consulting', 'Investment Income', 'Other Income'],
                expense: ['Office Expenses', 'Executive Expenses', 'Marketing', 'Equipment', 'Travel', 'Professional Services']
            }
        };
        
        this.nextTransactionId = 6;
        this.nextInvoiceId = 1003;
    }

    launch() {
        const windowId = `elxabooks-${Date.now()}`;
        
        const windowContent = this.createElxaBooksInterface(windowId);
        
        const window = this.windowManager.createWindow(
            windowId,
            '💰 ElxaBooks Pro - ElxaCorp Financial Management',
            windowContent,
            { width: '800px', height: '600px', x: '50px', y: '50px' }
        );
        
        // Make sure this instance is available globally for dynamic button clicks
        if (typeof elxaOS !== 'undefined' && elxaOS.programs) {
            elxaOS.programs.elxabooks = this;
        }
        
        // Setup event handlers after window is created and DOM is ready
        setTimeout(() => {
            this.setupEventHandlers(windowId);
            this.showTab('dashboard', windowId);
            this.loadData();
        }, 500);
        
        return windowId;
    }

    createElxaBooksInterface(windowId) {
        return `
            <div class="elxabooks-container" data-window-id="${windowId}">
                <!-- Header -->
                <div class="elxabooks-header">
                    <div class="elxabooks-logo">
                        <span class="logo-icon">💰</span>
                        <span>ElxaBooks Pro</span>
                    </div>
                    <div class="company-info">
                        <div class="company-name">${this.data.company.name}</div>
                        <div class="company-location">${this.data.company.location}</div>
                    </div>
                </div>

                <!-- Navigation -->
                <div class="elxabooks-nav">
                    <button class="nav-tab active" data-tab="dashboard" data-window="${windowId}">📊 Dashboard</button>
                    <button class="nav-tab" data-tab="income" data-window="${windowId}">💚 Income</button>
                    <button class="nav-tab" data-tab="expenses" data-window="${windowId}">💸 Expenses</button>
                    <button class="nav-tab" data-tab="invoices" data-window="${windowId}">📄 Invoices</button>
                    <button class="nav-tab" data-tab="accounts" data-window="${windowId}">🏦 Accounts</button>
                    <button class="nav-tab" data-tab="reports" data-window="${windowId}">📈 Reports</button>
                </div>

                <!-- Content Area -->
                <div class="elxabooks-content">
                    ${this.createDashboardTab(windowId)}
                    ${this.createIncomeTab(windowId)}
                    ${this.createExpensesTab(windowId)}
                    ${this.createInvoicesTab(windowId)}
                    ${this.createAccountsTab(windowId)}
                    ${this.createReportsTab(windowId)}
                </div>

                <!-- Snake Mascot -->
                <div class="snake-mascot" title="Hello from Mr. Snake-e!">🐍</div>
            </div>
        `;
    }

    createDashboardTab(windowId) {
        const totalIncome = this.getTotalIncome();
        const totalExpenses = this.getTotalExpenses();
        const netProfit = totalIncome + totalExpenses; // expenses are negative
        const totalAssets = this.getTotalAssets();

        return `
            <div class="tab-panel active" data-tab="dashboard">
                <div class="ceo-message">
                    Welcome to ElxaBooks Pro! Keep those numbers slithering in the right direction! 
                    Remember: A profitable snake is a happy snake! 🐍💰
                </div>

                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <div class="card-header">
                            <span class="card-icon">💚</span>
                            <span class="card-title">Total Income</span>
                        </div>
                        <div class="card-value amount positive" data-total="income">$${totalIncome.toFixed(2)}</div>
                        <div class="card-subtitle">This Month</div>
                    </div>

                    <div class="dashboard-card">
                        <div class="card-header">
                            <span class="card-icon">💸</span>
                            <span class="card-title">Total Expenses</span>
                        </div>
                        <div class="card-value amount negative" data-total="expenses">$${Math.abs(totalExpenses).toFixed(2)}</div>
                        <div class="card-subtitle">This Month</div>
                    </div>

                    <div class="dashboard-card">
                        <div class="card-header">
                            <span class="card-icon">📈</span>
                            <span class="card-title">Net Profit</span>
                        </div>
                        <div class="card-value amount ${netProfit >= 0 ? 'positive' : 'negative'}" data-total="profit">$${netProfit.toFixed(2)}</div>
                        <div class="card-subtitle" data-profit-subtitle>${netProfit >= 0 ? 'Excellent!' : 'Needs Attention'}</div>
                    </div>

                    <div class="dashboard-card">
                        <div class="card-header">
                            <span class="card-icon">🏦</span>
                            <span class="card-title">Total Assets</span>
                        </div>
                        <div class="card-value amount positive" data-total="assets">$${totalAssets.toFixed(2)}</div>
                        <div class="card-subtitle">Available Funds</div>
                    </div>
                </div>

                <div class="quick-actions">
                    <div class="quick-action" data-action="add-income">
                        <div class="quick-action-icon">💰</div>
                        <div class="quick-action-title">Record Income</div>
                        <div class="quick-action-desc">Add money coming in</div>
                    </div>
                    <div class="quick-action" data-action="add-expense">
                        <div class="quick-action-icon">🧾</div>
                        <div class="quick-action-title">Record Expense</div>
                        <div class="quick-action-desc">Track money going out</div>
                    </div>
                    <div class="quick-action" data-action="create-invoice">
                        <div class="quick-action-icon">📄</div>
                        <div class="quick-action-title">Create Invoice</div>
                        <div class="quick-action-desc">Bill a customer</div>
                    </div>
                    <div class="quick-action" data-action="view-reports">
                        <div class="quick-action-icon">📊</div>
                        <div class="quick-action-title">View Reports</div>
                        <div class="quick-action-desc">See the big picture</div>
                    </div>
                </div>

                <div class="summary-section">
                    <div class="summary-title">
                        <span>📋</span>
                        Recent Transactions
                    </div>
                    <div class="elxabooks-table transactions-table" data-recent-transactions>
                        <div class="table-header">
                            <div>Date</div>
                            <div>Description</div>
                            <div>Category</div>
                            <div>Amount</div>
                            <div>Type</div>
                        </div>
                        ${this.getRecentTransactions().map(t => `
                            <div class="table-row">
                                <div>${t.date}</div>
                                <div>${t.description}</div>
                                <div>${t.category}</div>
                                <div class="amount ${t.amount >= 0 ? 'positive' : 'negative'}">$${t.amount.toFixed(2)}</div>
                                <div><span class="transaction-type ${t.type}">${t.type}</span></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    createIncomeTab(windowId) {
        return `
            <div class="tab-panel" data-tab="income">
                <div class="elxabooks-form">
                    <div class="form-title">
                        <span>💚</span>
                        Record New Income
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Date</label>
                            <input type="date" class="form-input" id="income-date" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Amount ($)</label>
                            <input type="number" class="form-input" id="income-amount" placeholder="0.00" step="0.01" min="0">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Description</label>
                            <input type="text" class="form-input" id="income-description" placeholder="What did you earn money from?">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Category</label>
                            <select class="form-select" id="income-category">
                                ${this.data.categories.income.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button class="elxabooks-button" id="add-income-btn">💰 Add Income</button>
                        <button class="elxabooks-button secondary" id="clear-income-btn">🔄 Clear</button>
                    </div>
                </div>

                <div class="summary-section">
                    <div class="summary-title">
                        <span>💚</span>
                        Income History
                    </div>
                    <div class="elxabooks-table transactions-table">
                        <div class="table-header">
                            <div>Date</div>
                            <div>Description</div>
                            <div>Category</div>
                            <div>Amount</div>
                            <div>Actions</div>
                        </div>
                        <div id="income-list-${windowId}">
                            ${this.getIncomeTransactions().map(t => this.createTransactionRow(t)).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createExpensesTab(windowId) {
        return `
            <div class="tab-panel" data-tab="expenses">
                <div class="elxabooks-form">
                    <div class="form-title">
                        <span>💸</span>
                        Record New Expense
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Date</label>
                            <input type="date" class="form-input" id="expense-date" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Amount ($)</label>
                            <input type="number" class="form-input" id="expense-amount" placeholder="0.00" step="0.01" min="0">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Description</label>
                            <input type="text" class="form-input" id="expense-description" placeholder="What did you spend money on?">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Category</label>
                            <select class="form-select" id="expense-category">
                                ${this.data.categories.expense.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button class="elxabooks-button" id="add-expense-btn">💸 Add Expense</button>
                        <button class="elxabooks-button secondary" id="clear-expense-btn">🔄 Clear</button>
                    </div>
                </div>

                <div class="summary-section">
                    <div class="summary-title">
                        <span>💸</span>
                        Expense History
                    </div>
                    <div class="elxabooks-table transactions-table">
                        <div class="table-header">
                            <div>Date</div>
                            <div>Description</div>
                            <div>Category</div>
                            <div>Amount</div>
                            <div>Actions</div>
                        </div>
                        <div id="expense-list-${windowId}">
                            ${this.getExpenseTransactions().map(t => this.createTransactionRow(t)).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createInvoicesTab(windowId) {
        return `
            <div class="tab-panel" data-tab="invoices">
                <div class="elxabooks-form">
                    <div class="form-title">
                        <span>📄</span>
                        Create New Invoice
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Customer Name</label>
                            <input type="text" class="form-input" id="invoice-customer" placeholder="Who are you billing?">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Invoice Date</label>
                            <input type="date" class="form-input" id="invoice-date" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Description</label>
                            <input type="text" class="form-input" id="invoice-description" placeholder="What service or product?">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Amount ($)</label>
                            <input type="number" class="form-input" id="invoice-amount" placeholder="0.00" step="0.01" min="0">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button class="elxabooks-button" id="create-invoice-btn">📄 Create Invoice</button>
                        <button class="elxabooks-button secondary" id="clear-invoice-btn">🔄 Clear</button>
                    </div>
                </div>

                <div class="summary-section">
                    <div class="summary-title">
                        <span>📄</span>
                        Invoice List
                    </div>
                    <div class="elxabooks-table invoices-table">
                        <div class="table-header">
                            <div>Invoice #</div>
                            <div>Customer</div>
                            <div>Amount</div>
                            <div>Date</div>
                            <div>Status</div>
                        </div>
                        <div id="invoice-list-${windowId}">
                            ${this.data.invoices.map(inv => this.createInvoiceRow(inv)).join('')}
                        </div>
                    </div>
                </div>

                <div id="invoice-preview-${windowId}" style="display: none;">
                    <!-- Invoice preview will be generated here -->
                </div>
            </div>
        `;
    }

    createAccountsTab(windowId) {
        return `
            <div class="tab-panel" data-tab="accounts">
                <div class="summary-section">
                    <div class="summary-title">
                        <span>🏦</span>
                        Account Balances
                    </div>
                    <div class="elxabooks-table accounts-table" data-accounts-table>
                        <div class="table-header">
                            <div>Account Name</div>
                            <div>Balance</div>
                            <div>Type</div>
                        </div>
                        ${this.data.accounts.map(acc => `
                            <div class="table-row">
                                <div>${acc.name}</div>
                                <div class="amount ${acc.balance >= 0 ? 'positive' : 'negative'}">$${acc.balance.toFixed(2)}</div>
                                <div>${acc.type.charAt(0).toUpperCase() + acc.type.slice(1)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="ceo-message">
                    Pro tip from Mr. Snake-e: Always keep track of where your money is! 
                    Assets are what you own, and they should always be growing! 🐍📈
                </div>
            </div>
        `;
    }

    createReportsTab(windowId) {
        const totalIncome = this.getTotalIncome();
        const totalExpenses = this.getTotalExpenses();
        const netProfit = totalIncome + totalExpenses;

        return `
            <div class="tab-panel" data-tab="reports">
                <div class="summary-section">
                    <div class="summary-title">
                        <span>📈</span>
                        Profit & Loss Summary
                    </div>
                    <div class="summary-grid" data-reports-summary>
                        <div class="summary-item">
                            <div class="summary-label">Total Income</div>
                            <div class="summary-value profit" data-report-income>$${totalIncome.toFixed(2)}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Total Expenses</div>
                            <div class="summary-value loss" data-report-expenses>$${Math.abs(totalExpenses).toFixed(2)}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Net Profit</div>
                            <div class="summary-value ${netProfit >= 0 ? 'profit' : 'loss'}" data-report-profit>$${netProfit.toFixed(2)}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Profit Margin</div>
                            <div class="summary-value" data-report-margin">${totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0.0'}%</div>
                        </div>
                    </div>
                </div>

                <div class="summary-section">
                    <div class="summary-title">
                        <span>📊</span>
                        Income by Category
                    </div>
                    <div class="elxabooks-table" data-income-categories>
                        <div class="table-header" style="grid-template-columns: 1fr 100px 80px;">
                            <div>Category</div>
                            <div>Amount</div>
                            <div>Percentage</div>
                        </div>
                        ${this.getIncomeByCategory().map(cat => `
                            <div class="table-row" style="grid-template-columns: 1fr 100px 80px;">
                                <div>${cat.category}</div>
                                <div class="amount positive">$${cat.amount.toFixed(2)}</div>
                                <div>${cat.percentage.toFixed(1)}%</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="summary-section">
                    <div class="summary-title">
                        <span>💸</span>
                        Expenses by Category
                    </div>
                    <div class="elxabooks-table" data-expense-categories>
                        <div class="table-header" style="grid-template-columns: 1fr 100px 80px;">
                            <div>Category</div>
                            <div>Amount</div>
                            <div>Percentage</div>
                        </div>
                        ${this.getExpensesByCategory().map(cat => `
                            <div class="table-row" style="grid-template-columns: 1fr 100px 80px;">
                                <div>${cat.category}</div>
                                <div class="amount negative">$${cat.amount.toFixed(2)}</div>
                                <div>${cat.percentage.toFixed(1)}%</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="form-actions">
                    <button class="elxabooks-button" id="save-report-btn">💾 Save Report</button>
                    <button class="elxabooks-button secondary" id="export-data-btn">📤 Export Data</button>
                </div>
            </div>
        `;
    }

    setupEventHandlers(windowId) {
        const container = document.querySelector(`.elxabooks-container[data-window-id="${windowId}"]`);
        if (!container) {
            console.log('Container not found for windowId:', windowId);
            return;
        }

        // Use event delegation for ALL clicks within the container
        container.addEventListener('click', (e) => {
            const target = e.target.closest('button, .quick-action, .snake-mascot');
            if (!target) {
                return;
            }

            const id = target.id;
            const classList = target.classList;

            // Handle tab navigation
            if (target.classList.contains('nav-tab')) {
                if (target.dataset.window === windowId) {
                    const tabName = target.dataset.tab;
                    this.showTab(tabName, windowId);
                }
                return;
            }

            // Handle quick actions from dashboard
            if (classList.contains('quick-action')) {
                const actionType = target.dataset.action;
                switch (actionType) {
                    case 'add-income':
                        this.showTab('income', windowId);
                        break;
                    case 'add-expense':
                        this.showTab('expenses', windowId);
                        break;
                    case 'create-invoice':
                        this.showTab('invoices', windowId);
                        break;
                    case 'view-reports':
                        this.showTab('reports', windowId);
                        break;
                }
                return;
            }

            // Handle snake mascot
            if (classList.contains('snake-mascot')) {
                this.showCEOMessage(windowId);
                return;
            }

            // Handle form buttons based on ID
            if (id === 'add-income-btn') {
                this.addIncome(windowId);
            } else if (id === 'clear-income-btn') {
                this.clearIncomeForm(windowId);
            } else if (id === 'add-expense-btn') {
                this.addExpense(windowId);
            } else if (id === 'clear-expense-btn') {
                this.clearExpenseForm(windowId);
            } else if (id === 'create-invoice-btn') {
                this.createInvoice(windowId);
            } else if (id === 'clear-invoice-btn') {
                this.clearInvoiceForm(windowId);
            } else if (id === 'save-report-btn') {
                this.saveReport();
            } else if (id === 'export-data-btn') {
                this.exportData();
            }

            // Handle dynamic buttons (delete, mark paid, etc.)
            if (target.dataset.action === 'delete-transaction') {
                const transactionId = parseInt(target.dataset.transactionId);
                this.deleteTransaction(transactionId);
                this.refreshAllViews(windowId); // Refresh everything
            } else if (target.dataset.action === 'mark-paid') {
                const invoiceId = parseInt(target.dataset.invoiceId);
                this.markInvoicePaid(invoiceId);
                this.refreshAllViews(windowId); // Refresh everything
            }
        });

        console.log('Event handlers set up for ElxaBooks window:', windowId);
    }

    showTab(tabName, windowId) {
        const container = document.querySelector(`.elxabooks-container[data-window-id="${windowId}"]`);
        if (!container) return;

        // Update tab buttons
        container.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab panels
        container.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.dataset.tab === tabName);
        });

        this.currentTab = tabName;

        // When switching TO dashboard, rebuild it fresh with current data
        if (tabName === 'dashboard') {
            console.log('📊 Switching to dashboard, rebuilding with current data...');
            this.rebuildDashboardContent(windowId);
        }
        
        // For other tabs, just refresh their specific content
        if (tabName === 'accounts') {
            this.refreshAccountsTab(windowId);
        } else if (tabName === 'reports') {
            this.refreshReportsTab(windowId);
        }
    }

    addIncome(windowId) {
        const container = document.querySelector(`.elxabooks-container[data-window-id="${windowId}"]`);
        if (!container) return;

        const date = container.querySelector('#income-date').value;
        const amount = parseFloat(container.querySelector('#income-amount').value);
        const description = container.querySelector('#income-description').value;
        const category = container.querySelector('#income-category').value;

        if (!date || !amount || !description) {
            alert('Please fill in all fields!');
            return;
        }

        if (amount <= 0) {
            alert('Amount must be greater than 0!');
            return;
        }

        const transaction = {
            id: this.nextTransactionId++,
            date: date,
            description: description,
            type: 'income',
            category: category,
            amount: amount,
            account: 'Business Checking'
        };

        this.data.transactions.push(transaction);
        this.updateAccountBalance('Business Checking', amount);
        this.clearIncomeForm(windowId);
        
        // Only refresh the current view, don't touch dashboard
        this.refreshIncomeList(windowId);
        this.saveData();

        this.showMessage('Income added successfully! 💰 Switch to Dashboard to see updated totals.', 'success');
    }

    addExpense(windowId) {
        const container = document.querySelector(`.elxabooks-container[data-window-id="${windowId}"]`);
        if (!container) return;

        const date = container.querySelector('#expense-date').value;
        const amount = parseFloat(container.querySelector('#expense-amount').value);
        const description = container.querySelector('#expense-description').value;
        const category = container.querySelector('#expense-category').value;

        if (!date || !amount || !description) {
            alert('Please fill in all fields!');
            return;
        }

        if (amount <= 0) {
            alert('Amount must be greater than 0!');
            return;
        }

        const transaction = {
            id: this.nextTransactionId++,
            date: date,
            description: description,
            type: 'expense',
            category: category,
            amount: -amount, // Expenses are negative
            account: 'Business Checking'
        };

        this.data.transactions.push(transaction);
        this.updateAccountBalance('Business Checking', -amount);
        this.clearExpenseForm(windowId);
        
        // Only refresh the current view
        this.refreshExpenseList(windowId);
        this.saveData();

        this.showMessage('Expense recorded successfully! 💸 Switch to Dashboard to see updated totals.', 'success');
    }

    createInvoice(windowId) {
        const container = document.querySelector(`.elxabooks-container[data-window-id="${windowId}"]`);
        if (!container) return;

        const customer = container.querySelector('#invoice-customer').value;
        const date = container.querySelector('#invoice-date').value;
        const description = container.querySelector('#invoice-description').value;
        const amount = parseFloat(container.querySelector('#invoice-amount').value);

        if (!customer || !date || !description || !amount) {
            alert('Please fill in all fields!');
            return;
        }

        if (amount <= 0) {
            alert('Amount must be greater than 0!');
            return;
        }

        const invoice = {
            id: this.nextInvoiceId++,
            date: date,
            customer: customer,
            description: description,
            amount: amount,
            status: 'pending'
        };

        this.data.invoices.push(invoice);
        this.clearInvoiceForm(windowId);
        this.refreshAllViews(windowId); // Refresh all views
        this.saveData();

        this.showMessage(`Invoice #${invoice.id} created successfully! 📄`, 'success');
    }

    // NEW METHOD: Completely rebuild dashboard with current data
    rebuildDashboard(windowId) {
        const container = document.querySelector(`.elxabooks-container[data-window-id="${windowId}"]`);
        if (!container) return;

        const dashboardPanel = container.querySelector('[data-tab="dashboard"]');
        if (!dashboardPanel) return;

        console.log('🔄 Rebuilding dashboard with current data...');

        // Calculate current totals
        const totalIncome = this.getTotalIncome();
        const totalExpenses = this.getTotalExpenses();
        const netProfit = totalIncome + totalExpenses;
        const totalAssets = this.getTotalAssets();

        console.log(`📊 Current totals: Income=${totalIncome}, Expenses=${totalExpenses}, Profit=${netProfit}, Assets=${totalAssets}`);

        // Completely rebuild the dashboard content
        dashboardPanel.innerHTML = `
            <div class="ceo-message">
                Welcome to ElxaBooks Pro! Keep those numbers slithering in the right direction! 
                Remember: A profitable snake is a happy snake! 🐍💰
            </div>

            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <div class="card-header">
                        <span class="card-icon">💚</span>
                        <span class="card-title">Total Income</span>
                    </div>
                    <div class="card-value amount positive" data-total="income">${totalIncome.toFixed(2)}</div>
                    <div class="card-subtitle">This Month</div>
                </div>

                <div class="dashboard-card">
                    <div class="card-header">
                        <span class="card-icon">💸</span>
                        <span class="card-title">Total Expenses</span>
                    </div>
                    <div class="card-value amount negative" data-total="expenses">${Math.abs(totalExpenses).toFixed(2)}</div>
                    <div class="card-subtitle">This Month</div>
                </div>

                <div class="dashboard-card">
                    <div class="card-header">
                        <span class="card-icon">📈</span>
                        <span class="card-title">Net Profit</span>
                    </div>
                    <div class="card-value amount ${netProfit >= 0 ? 'positive' : 'negative'}" data-total="profit">${netProfit.toFixed(2)}</div>
                    <div class="card-subtitle" data-profit-subtitle>${netProfit >= 0 ? 'Excellent!' : 'Needs Attention'}</div>
                </div>

                <div class="dashboard-card">
                    <div class="card-header">
                        <span class="card-icon">🏦</span>
                        <span class="card-title">Total Assets</span>
                    </div>
                    <div class="card-value amount positive" data-total="assets">${totalAssets.toFixed(2)}</div>
                    <div class="card-subtitle">Available Funds</div>
                </div>
            </div>

            <div class="quick-actions">
                <div class="quick-action" data-action="add-income">
                    <div class="quick-action-icon">💰</div>
                    <div class="quick-action-title">Record Income</div>
                    <div class="quick-action-desc">Add money coming in</div>
                </div>
                <div class="quick-action" data-action="add-expense">
                    <div class="quick-action-icon">🧾</div>
                    <div class="quick-action-title">Record Expense</div>
                    <div class="quick-action-desc">Track money going out</div>
                </div>
                <div class="quick-action" data-action="create-invoice">
                    <div class="quick-action-icon">📄</div>
                    <div class="quick-action-title">Create Invoice</div>
                    <div class="quick-action-desc">Bill a customer</div>
                </div>
                <div class="quick-action" data-action="view-reports">
                    <div class="quick-action-icon">📊</div>
                    <div class="quick-action-title">View Reports</div>
                    <div class="quick-action-desc">See the big picture</div>
                </div>
            </div>

            <div class="summary-section">
                <div class="summary-title">
                    <span>📋</span>
                    Recent Transactions
                </div>
                <div class="elxabooks-table transactions-table" data-recent-transactions>
                    <div class="table-header">
                        <div>Date</div>
                        <div>Description</div>
                        <div>Category</div>
                        <div>Amount</div>
                        <div>Type</div>
                    </div>
                    ${this.getRecentTransactions().map(t => `
                        <div class="table-row">
                            <div>${t.date}</div>
                            <div>${t.description}</div>
                            <div>${t.category}</div>
                            <div class="amount ${t.amount >= 0 ? 'positive' : 'negative'}">${t.amount.toFixed(2)}</div>
                            <div><span class="transaction-type ${t.type}">${t.type}</span></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        console.log('✅ Dashboard rebuilt successfully');
    }
    // NEW METHOD: Refresh all views at once
    refreshAllViews(windowId) {
        this.refreshDashboard(windowId);
        this.refreshIncomeList(windowId);
        this.refreshExpenseList(windowId);
        this.refreshInvoiceList(windowId);
        this.refreshAccountsTab(windowId);
        this.refreshReportsTab(windowId);
    }

    // NEW METHOD: Refresh specific view when switching tabs
    refreshSpecificView(tabName, windowId) {
        switch (tabName) {
            case 'dashboard':
                this.refreshDashboard(windowId);
                break;
            case 'income':
                this.refreshIncomeList(windowId);
                break;
            case 'expenses':
                this.refreshExpenseList(windowId);
                break;
            case 'invoices':
                this.refreshInvoiceList(windowId);
                break;
            case 'accounts':
                this.refreshAccountsTab(windowId);
                break;
            case 'reports':
                this.refreshReportsTab(windowId);
                break;
        }
    }

    // Helper methods for data calculations
    getTotalIncome() {
        return this.data.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
    }

    getTotalExpenses() {
        return this.data.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
    }

    getTotalAssets() {
        return this.data.accounts
            .filter(a => a.type === 'asset')
            .reduce((sum, a) => sum + a.balance, 0);
    }

    getRecentTransactions() {
        return this.data.transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
    }

    getIncomeTransactions() {
        return this.data.transactions
            .filter(t => t.type === 'income')
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    getExpenseTransactions() {
        return this.data.transactions
            .filter(t => t.type === 'expense')
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    getIncomeByCategory() {
        const incomeTransactions = this.getIncomeTransactions();
        const totalIncome = this.getTotalIncome();
        const categories = {};

        incomeTransactions.forEach(t => {
            if (!categories[t.category]) {
                categories[t.category] = 0;
            }
            categories[t.category] += t.amount;
        });

        return Object.entries(categories).map(([category, amount]) => ({
            category,
            amount,
            percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0
        }));
    }

    getExpensesByCategory() {
        const expenseTransactions = this.getExpenseTransactions();
        const totalExpenses = Math.abs(this.getTotalExpenses());
        const categories = {};

        expenseTransactions.forEach(t => {
            if (!categories[t.category]) {
                categories[t.category] = 0;
            }
            categories[t.category] += Math.abs(t.amount);
        });

        return Object.entries(categories).map(([category, amount]) => ({
            category,
            amount,
            percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
        }));
    }

    // UI helper methods
    createTransactionRow(transaction) {
        return `
            <div class="table-row">
                <div>${transaction.date}</div>
                <div>${transaction.description}</div>
                <div>${transaction.category}</div>
                <div class="amount ${transaction.amount >= 0 ? 'positive' : 'negative'}">$${transaction.amount.toFixed(2)}</div>
                <div>
                    <button class="elxabooks-button danger" data-action="delete-transaction" data-transaction-id="${transaction.id}" style="padding: 2px 6px; font-size: 9px;">🗑️</button>
                </div>
            </div>
        `;
    }

    createInvoiceRow(invoice) {
        return `
            <div class="table-row">
                <div>#${invoice.id}</div>
                <div>${invoice.customer}</div>
                <div class="amount positive">$${invoice.amount.toFixed(2)}</div>
                <div>${invoice.date}</div>
                <div>
                    <span class="transaction-type ${invoice.status === 'paid' ? 'income' : 'expense'}">${invoice.status}</span>
                    ${invoice.status === 'pending' ? `<button class="elxabooks-button" data-action="mark-paid" data-invoice-id="${invoice.id}" style="padding: 2px 6px; font-size: 9px; margin-left: 4px;">✓ Paid</button>` : ''}
                </div>
            </div>
        `;
    }

    // Form clearing methods
    clearIncomeForm(windowId) {
        const container = document.querySelector(`.elxabooks-container[data-window-id="${windowId}"]`);
        if (!container) return;

        container.querySelector('#income-amount').value = '';
        container.querySelector('#income-description').value = '';
        container.querySelector('#income-date').value = new Date().toISOString().split('T')[0];
    }

    clearExpenseForm(windowId) {
        const container = document.querySelector(`.elxabooks-container[data-window-id="${windowId}"]`);
        if (!container) return;

        container.querySelector('#expense-amount').value = '';
        container.querySelector('#expense-description').value = '';
        container.querySelector('#expense-date').value = new Date().toISOString().split('T')[0];
    }

    clearInvoiceForm(windowId) {
        const container = document.querySelector(`.elxabooks-container[data-window-id="${windowId}"]`);
        if (!container) return;

        container.querySelector('#invoice-customer').value = '';
        container.querySelector('#invoice-description').value = '';
        container.querySelector('#invoice-amount').value = '';
        container.querySelector('#invoice-date').value = new Date().toISOString().split('T')[0];
    }

    // Refresh methods - UPDATED AND NEW
    refreshDashboard(windowId) {
        const container = document.querySelector(`.elxabooks-container[data-window-id="${windowId}"]`);
        if (!container) return;

        const dashboardPanel = container.querySelector('[data-tab="dashboard"]');
        if (!dashboardPanel) return;

        // Calculate new totals
        const totalIncome = this.getTotalIncome();
        const totalExpenses = this.getTotalExpenses();
        const netProfit = totalIncome + totalExpenses;
        const totalAssets = this.getTotalAssets();

        // Update dashboard cards values using data attributes
        const incomeCard = dashboardPanel.querySelector('[data-total="income"]');
        if (incomeCard) incomeCard.textContent = `$${totalIncome.toFixed(2)}`;

        const expenseCard = dashboardPanel.querySelector('[data-total="expenses"]');
        if (expenseCard) expenseCard.textContent = `$${Math.abs(totalExpenses).toFixed(2)}`;

        const profitCard = dashboardPanel.querySelector('[data-total="profit"]');
        if (profitCard) {
            profitCard.textContent = `$${netProfit.toFixed(2)}`;
            profitCard.className = `card-value amount ${netProfit >= 0 ? 'positive' : 'negative'}`;
        }

        const assetsCard = dashboardPanel.querySelector('[data-total="assets"]');
        if (assetsCard) assetsCard.textContent = `$${totalAssets.toFixed(2)}`;

        // Update net profit subtitle
        const profitSubtitle = dashboardPanel.querySelector('[data-profit-subtitle]');
        if (profitSubtitle) {
            profitSubtitle.textContent = netProfit >= 0 ? 'Excellent!' : 'Needs Attention';
        }

        // Update recent transactions table
        this.updateRecentTransactionsTable(dashboardPanel);
    }

    updateRecentTransactionsTable(dashboardPanel) {
        const transactionsTable = dashboardPanel.querySelector('[data-recent-transactions]');
        if (!transactionsTable) return;

        // Find the existing table rows (skip the header)
        const existingRows = transactionsTable.querySelectorAll('.table-row');
        existingRows.forEach(row => row.remove());

        // Add updated recent transactions
        const recentTransactions = this.getRecentTransactions();
        recentTransactions.forEach(t => {
            const row = document.createElement('div');
            row.className = 'table-row';
            row.innerHTML = `
                <div>${t.date}</div>
                <div>${t.description}</div>
                <div>${t.category}</div>
                <div class="amount ${t.amount >= 0 ? 'positive' : 'negative'}">$${t.amount.toFixed(2)}</div>
                <div><span class="transaction-type ${t.type}">${t.type}</span></div>
            `;
            transactionsTable.appendChild(row);
        });
    }

    refreshIncomeList(windowId) {
        const container = document.querySelector(`.elxabooks-container[data-window-id="${windowId}"]`);
        if (!container) return;

        const incomeList = container.querySelector(`#income-list-${windowId}`);
        if (incomeList) {
            incomeList.innerHTML = this.getIncomeTransactions().map(t => this.createTransactionRow(t)).join('');
        }
    }

    refreshExpenseList(windowId) {
        const container = document.querySelector(`.elxabooks-container[data-window-id="${windowId}"]`);
        if (!container) return;

        const expenseList = container.querySelector(`#expense-list-${windowId}`);
        if (expenseList) {
            expenseList.innerHTML = this.getExpenseTransactions().map(t => this.createTransactionRow(t)).join('');
        }
    }

    refreshInvoiceList(windowId) {
        const container = document.querySelector(`.elxabooks-container[data-window-id="${windowId}"]`);
        if (!container) return;

        const invoiceList = container.querySelector(`#invoice-list-${windowId}`);
        if (invoiceList) {
            invoiceList.innerHTML = this.data.invoices.map(inv => this.createInvoiceRow(inv)).join('');
        }
    }

    // NEW METHOD: Refresh accounts tab
    refreshAccountsTab(windowId) {
        const container = document.querySelector(`.elxabooks-container[data-window-id="${windowId}"]`);
        if (!container) return;

        const accountsTable = container.querySelector('[data-accounts-table]');
        if (!accountsTable) return;

        // Remove existing rows (keep header)
        const existingRows = accountsTable.querySelectorAll('.table-row');
        existingRows.forEach(row => row.remove());

        // Add updated account rows
        this.data.accounts.forEach(acc => {
            const row = document.createElement('div');
            row.className = 'table-row';
            row.innerHTML = `
                <div>${acc.name}</div>
                <div class="amount ${acc.balance >= 0 ? 'positive' : 'negative'}">$${acc.balance.toFixed(2)}</div>
                <div>${acc.type.charAt(0).toUpperCase() + acc.type.slice(1)}</div>
            `;
            accountsTable.appendChild(row);
        });
    }

    // NEW METHOD: Refresh reports tab
    refreshReportsTab(windowId) {
        const container = document.querySelector(`.elxabooks-container[data-window-id="${windowId}"]`);
        if (!container) return;

        const reportsPanel = container.querySelector('[data-tab="reports"]');
        if (!reportsPanel) return;

        // Calculate new totals
        const totalIncome = this.getTotalIncome();
        const totalExpenses = this.getTotalExpenses();
        const netProfit = totalIncome + totalExpenses;

        // Update summary values using data attributes
        const incomeEl = reportsPanel.querySelector('[data-report-income]');
        if (incomeEl) incomeEl.textContent = `$${totalIncome.toFixed(2)}`;

        const expensesEl = reportsPanel.querySelector('[data-report-expenses]');
        if (expensesEl) expensesEl.textContent = `$${Math.abs(totalExpenses).toFixed(2)}`;

        const profitEl = reportsPanel.querySelector('[data-report-profit]');
        if (profitEl) {
            profitEl.textContent = `$${netProfit.toFixed(2)}`;
            profitEl.className = `summary-value ${netProfit >= 0 ? 'profit' : 'loss'}`;
        }

        const marginEl = reportsPanel.querySelector('[data-report-margin]');
        if (marginEl) {
            const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0.0';
            marginEl.textContent = `${profitMargin}%`;
        }

        // Update income categories table
        this.updateCategoriesTable(reportsPanel, '[data-income-categories]', this.getIncomeByCategory(), 'positive');

        // Update expense categories table
        this.updateCategoriesTable(reportsPanel, '[data-expense-categories]', this.getExpensesByCategory(), 'negative');
    }

    // NEW METHOD: Update category tables in reports
    updateCategoriesTable(reportsPanel, selector, categoryData, amountClass) {
        const table = reportsPanel.querySelector(selector);
        if (!table) return;

        // Remove existing rows (keep header)
        const existingRows = table.querySelectorAll('.table-row');
        existingRows.forEach(row => row.remove());

        // Add updated category rows
        categoryData.forEach(cat => {
            const row = document.createElement('div');
            row.className = 'table-row';
            row.style.gridTemplateColumns = '1fr 100px 80px';
            row.innerHTML = `
                <div>${cat.category}</div>
                <div class="amount ${amountClass}">$${cat.amount.toFixed(2)}</div>
                <div>${cat.percentage.toFixed(1)}%</div>
            `;
            table.appendChild(row);
        });
    }

    // Account management
    updateAccountBalance(accountName, amount) {
        const account = this.data.accounts.find(a => a.name === accountName);
        if (account) {
            account.balance += amount;
        }
    }

    // Transaction management
    deleteTransaction(transactionId) {
        const transactionIndex = this.data.transactions.findIndex(t => t.id === transactionId);
        if (transactionIndex !== -1) {
            const transaction = this.data.transactions[transactionIndex];
            
            // Reverse the account balance change
            this.updateAccountBalance(transaction.account, -transaction.amount);
            
            // Remove the transaction
            this.data.transactions.splice(transactionIndex, 1);
            
            // Force targeted update
            const windowId = document.querySelector('.elxabooks-container')?.dataset.windowId;
            if (windowId) {
                console.log('🗑️ Transaction deleted, refreshing views...');
                this.forceUpdateDashboard(windowId);
                this.refreshAllViews(windowId);
            }
            
            this.saveData();
            this.showMessage('Transaction deleted! 🗑️', 'success');
        }
    }

    // Invoice management
    markInvoicePaid(invoiceId) {
        const invoice = this.data.invoices.find(inv => inv.id === invoiceId);
        if (invoice && invoice.status === 'pending') {
            invoice.status = 'paid';
            
            // Add income transaction for the paid invoice
            const transaction = {
                id: this.nextTransactionId++,
                date: new Date().toISOString().split('T')[0],
                description: `Payment received: Invoice #${invoice.id} - ${invoice.customer}`,
                type: 'income',
                category: 'Product Sales',
                amount: invoice.amount,
                account: 'Business Checking'
            };
            
            this.data.transactions.push(transaction);
            this.updateAccountBalance('Business Checking', invoice.amount);
            
            // Force targeted update
            const windowId = document.querySelector('.elxabooks-container')?.dataset.windowId;
            if (windowId) {
                console.log('💰 Invoice paid, refreshing views...');
                this.forceUpdateDashboard(windowId);
                this.refreshAllViews(windowId);
            }
            
            this.saveData();
            this.showMessage(`Invoice #${invoiceId} marked as paid! 💰`, 'success');
        }
    }

    // Data persistence
    saveData() {
        try {
            const dataString = JSON.stringify(this.data, null, 2);
            const filename = 'ElxaBooks_Data.json';
            
            // Save to file system
            this.fileSystem.createFile(['root', 'Documents'], filename, dataString);
            console.log('💾 ElxaBooks data saved to Documents folder');
        } catch (error) {
            console.error('❌ Failed to save ElxaBooks data:', error);
        }
    }

    loadData() {
        try {
            const file = this.fileSystem.getFile(['root', 'Documents'], 'ElxaBooks_Data.json');
            if (file && file.content) {
                const loadedData = JSON.parse(file.content);
                
                // Merge loaded data with defaults, preserving structure
                this.data = { ...this.data, ...loadedData };
                
                // Update next IDs based on existing data
                if (this.data.transactions.length > 0) {
                    this.nextTransactionId = Math.max(...this.data.transactions.map(t => t.id)) + 1;
                }
                if (this.data.invoices.length > 0) {
                    this.nextInvoiceId = Math.max(...this.data.invoices.map(inv => inv.id)) + 1;
                }
                
                console.log('📂 ElxaBooks data loaded from Documents folder');
            }
        } catch (error) {
            console.error('❌ Failed to load ElxaBooks data:', error);
        }
    }

    // Export and reporting
    saveReport() {
        const reportData = this.generateReport();
        const filename = `ElxaCorp_Financial_Report_${new Date().toISOString().split('T')[0]}.txt`;
        
        this.fileSystem.createFile(['root', 'Documents'], filename, reportData);
        this.showMessage('Report saved to Documents! 📊', 'success');
    }

    exportData() {
        const csvData = this.generateCSV();
        const filename = `ElxaCorp_Transactions_${new Date().toISOString().split('T')[0]}.csv`;
        
        this.fileSystem.createFile(['root', 'Documents'], filename, csvData);
        this.showMessage('Data exported to Documents! 📤', 'success');
    }

    generateReport() {
        const totalIncome = this.getTotalIncome();
        const totalExpenses = this.getTotalExpenses();
        const netProfit = totalIncome + totalExpenses;
        
        return `
ELXACORP FINANCIAL REPORT
Generated: ${new Date().toLocaleDateString()}
Generated by: ElxaBooks Pro

EXECUTIVE SUMMARY
=================
CEO: ${this.data.company.ceo}
Company: ${this.data.company.name}
Location: ${this.data.company.location}

FINANCIAL OVERVIEW
==================
Total Income:     $${totalIncome.toFixed(2)}
Total Expenses:   $${Math.abs(totalExpenses).toFixed(2)}
Net Profit:       $${netProfit.toFixed(2)}
Profit Margin:    ${totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0.0'}%

ACCOUNT BALANCES
================
${this.data.accounts.map(acc => `${acc.name}: $${acc.balance.toFixed(2)}`).join('\n')}

RECENT TRANSACTIONS
===================
${this.getRecentTransactions().map(t => 
    `${t.date} | ${t.description} | ${t.category} | $${t.amount.toFixed(2)}`
).join('\n')}

INCOME BY CATEGORY
==================
${this.getIncomeByCategory().map(cat => 
    `${cat.category}: $${cat.amount.toFixed(2)} (${cat.percentage.toFixed(1)}%)`
).join('\n')}

EXPENSES BY CATEGORY
====================
${this.getExpensesByCategory().map(cat => 
    `${cat.category}: $${cat.amount.toFixed(2)} (${cat.percentage.toFixed(1)}%)`
).join('\n')}

---
Report generated by ElxaBooks Pro
"Keeping Snakesia's finances on track!" 🐍💰
        `.trim();
    }

    generateCSV() {
        const header = 'Date,Description,Type,Category,Amount,Account\n';
        const rows = this.data.transactions.map(t => 
            `${t.date},"${t.description}",${t.type},${t.category},${t.amount},${t.account}`
        ).join('\n');
        
        return header + rows;
    }

    // Fun CEO messages
    showCEOMessage(windowId) {
        const messages = [
            "Keep those numbers slithering in the right direction! 🐍💰",
            "A profitable business is a happy business! Remember to track everything!",
            "Pro tip: Income good, expenses... well, necessary but keep them controlled!",
            "ElxaCorp's success depends on good bookkeeping! You're doing great!",
            "From Snakesia with love: Always know where your money is! 🏦",
            "The secret to business success? Good records and even better snacks! 🐍",
            "Remember: Every penny counts, especially the shiny ones!"
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        this.showMessage(`💼 Mr. Snake-e says: ${randomMessage}`, 'info');
    }

    // Utility method for showing messages
    showMessage(text, type = 'info') {
        const message = document.createElement('div');
        message.className = `system-message ${type}`;
        message.textContent = text;
        
        const colors = {
            info: { bg: '#add8e6', color: 'black' },
            success: { bg: '#00ff00', color: 'black' },
            warning: { bg: '#ffff00', color: 'black' },
            error: { bg: '#ff0000', color: 'white' }
        };
        
        message.style.cssText = `
            position: fixed;
            top: 50px;
            right: 20px;
            background: ${colors[type].bg};
            color: ${colors[type].color};
            padding: 8px 16px;
            border: 2px outset #c0c0c0;
            z-index: 3000;
            font-weight: bold;
            font-size: 11px;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 4000);
    }
}