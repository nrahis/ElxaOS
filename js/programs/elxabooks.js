// =================================
// ELXABOOKS PRO — ACCOUNTING SOFTWARE
// QuickBooks-inspired for the CEO of ElxaCorp
// =================================
class ElxaBooksProgram {
    constructor(windowManager, fileSystem, eventBus) {
        this.windowManager = windowManager;
        this.fileSystem = fileSystem;
        this.eventBus = eventBus;

        this.incomeCategories = ['Allowance', 'Chores', 'Business Sales', 'Gifts', 'Other'];
        this.expenseCategories = ['Food & Snacks', 'Toys & Games', 'Supplies', 'Clothes', 'Savings', 'Other'];
        this.contacts = ['Mom', 'Dad', 'Uncle Randy', 'Aunt Angel', 'Granddaddy', 'Teacher', 'Friend'];

        this.data = {
            startingBalance: 0,
            transactions: [],
            invoices: [],
            nextTransactionId: 1,
            nextInvoiceId: 1
        };
    }

    launch() {
        const windowId = `elxabooks-${Date.now()}`;
        const content = this.createInterface(windowId);

        this.windowManager.createWindow(
            windowId,
            `${ElxaIcons.render('elxabooks', 'ui')} ElxaBooks Pro`,
            content,
            { width: '780px', height: '540px', x: '80px', y: '60px' }
        );

        this._onWindowClosed = (data) => {
            if (data.id === windowId) this.destroy(windowId);
        };
        this.eventBus.on('window.closed', this._onWindowClosed);

        setTimeout(() => {
            this.loadData();
            this.setupEventHandlers(windowId);
            this.switchView('dashboard', windowId);
        }, 100);

        return windowId;
    }

    // =================================
    // CLEANUP
    // =================================
    destroy(windowId) {
        if (this._onWindowClosed) {
            this.eventBus.off('window.closed', this._onWindowClosed);
            this._onWindowClosed = null;
        }
    }

    // =================================
    // INTERFACE
    // =================================
    createInterface(windowId) {
        return `
            <div class="eb-app" data-window-id="${windowId}">
                <div class="eb-sidebar">
                    <div class="eb-sidebar-brand">
                        <div class="eb-brand-icon">${ElxaIcons.render('elxabooks', 'ui')}</div>
                        <div class="eb-brand-name">ElxaBooks<span class="eb-brand-pro">PRO</span></div>
                    </div>
                    <nav class="eb-nav">
                        <button class="eb-nav-item active" data-view="dashboard">
                            ${ElxaIcons.renderAction('home')} Dashboard
                        </button>
                        <button class="eb-nav-item" data-view="transactions">
                            ${ElxaIcons.renderAction('list')} Transactions
                        </button>
                        <button class="eb-nav-item" data-view="invoices">
                            ${ElxaIcons.renderAction('file-document')} Invoices
                        </button>
                        <button class="eb-nav-item" data-view="reports">
                            ${ElxaIcons.renderAction('chart-bar')} Reports
                        </button>
                    </nav>
                    <div class="eb-sidebar-footer">ElxaCorp Accounting</div>
                </div>
                <div class="eb-main">
                    <div class="eb-view" id="eb-dashboard-${windowId}"></div>
                    <div class="eb-view" id="eb-transactions-${windowId}"></div>
                    <div class="eb-view" id="eb-invoices-${windowId}"></div>
                    <div class="eb-view" id="eb-reports-${windowId}"></div>
                </div>
            </div>
        `;
    }

    // =================================
    // EVENT HANDLERS
    // =================================
    setupEventHandlers(windowId) {
        const container = document.querySelector(`.eb-app[data-window-id="${windowId}"]`);
        if (!container) return;

        container.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            // Sidebar navigation
            if (btn.classList.contains('eb-nav-item')) {
                this.switchView(btn.dataset.view, windowId);
                return;
            }

            // Dashboard quick actions
            if (btn.classList.contains('eb-quick-income')) {
                this.switchView('transactions', windowId);
                setTimeout(() => this.showTransactionForm('income', windowId), 100);
                return;
            }
            if (btn.classList.contains('eb-quick-expense')) {
                this.switchView('transactions', windowId);
                setTimeout(() => this.showTransactionForm('expense', windowId), 100);
                return;
            }
            if (btn.classList.contains('eb-quick-invoice')) {
                this.switchView('invoices', windowId);
                setTimeout(() => this.showInvoiceForm(windowId), 100);
                return;
            }
            if (btn.classList.contains('eb-set-balance-btn')) {
                this.promptStartingBalance(windowId);
                return;
            }

            // Transaction actions
            if (btn.classList.contains('eb-add-income-btn')) {
                this.showTransactionForm('income', windowId);
                return;
            }
            if (btn.classList.contains('eb-add-expense-btn')) {
                this.showTransactionForm('expense', windowId);
                return;
            }
            if (btn.classList.contains('eb-delete-transaction')) {
                this.deleteTransaction(parseInt(btn.dataset.id), windowId);
                return;
            }

            // Invoice actions
            if (btn.classList.contains('eb-new-invoice-btn')) {
                this.showInvoiceForm(windowId);
                return;
            }
            if (btn.classList.contains('eb-send-invoice')) {
                this.sendInvoice(parseInt(btn.dataset.id), windowId);
                return;
            }
            if (btn.classList.contains('eb-pay-invoice')) {
                this.markInvoicePaid(parseInt(btn.dataset.id), windowId);
                return;
            }
            if (btn.classList.contains('eb-delete-invoice')) {
                this.deleteInvoice(parseInt(btn.dataset.id), windowId);
                return;
            }

            // Invoice form
            if (btn.classList.contains('eb-add-line-item')) {
                this.addInvoiceLineItem(windowId);
                return;
            }
            if (btn.classList.contains('eb-remove-line-item')) {
                btn.closest('.eb-line-item-row').remove();
                return;
            }
            if (btn.classList.contains('eb-save-invoice-btn')) {
                this.saveInvoice(windowId);
                return;
            }
            if (btn.classList.contains('eb-cancel-form-btn')) {
                this.renderCurrentView(windowId);
                return;
            }
        });
    }

    // =================================
    // NAVIGATION
    // =================================
    switchView(viewName, windowId) {
        const container = document.querySelector(`.eb-app[data-window-id="${windowId}"]`);
        if (!container) return;

        // Update nav
        container.querySelectorAll('.eb-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });

        // Hide all views
        container.querySelectorAll('.eb-view').forEach(v => v.classList.remove('active'));

        // Show target view
        const target = container.querySelector(`#eb-${viewName}-${windowId}`);
        if (target) {
            target.classList.add('active');
            this.currentView = viewName;
        }

        this.renderView(viewName, windowId);
    }

    renderView(viewName, windowId) {
        switch (viewName) {
            case 'dashboard':    this.renderDashboard(windowId); break;
            case 'transactions': this.renderTransactions(windowId); break;
            case 'invoices':     this.renderInvoices(windowId); break;
            case 'reports':      this.renderReports(windowId); break;
        }
    }

    renderCurrentView(windowId) {
        this.renderView(this.currentView || 'dashboard', windowId);
    }

    // =================================
    // DASHBOARD VIEW
    // =================================
    renderDashboard(windowId) {
        const el = document.getElementById(`eb-dashboard-${windowId}`);
        if (!el) return;

        const balance = this.calculateBalance();
        const totals = this.getMonthTotals();
        const recent = this.data.transactions.slice(-5).reverse();
        const pendingInvoices = this.data.invoices.filter(i => i.status === 'sent').length;

        el.innerHTML = `
            <div class="eb-page-header">
                <h2>Dashboard</h2>
                <div class="eb-header-actions">
                    <button class="eb-set-balance-btn eb-btn-sm">${ElxaIcons.renderAction('settings')} Set Starting Balance</button>
                </div>
            </div>

            <div class="eb-summary-cards">
                <div class="eb-card eb-card-balance">
                    <div class="eb-card-label">Account Balance</div>
                    <div class="eb-card-value ${balance >= 0 ? 'eb-positive' : 'eb-negative'}">
                        🐍 ${balance.toFixed(2)}
                    </div>
                    <div class="eb-card-sub">in snakes</div>
                </div>
                <div class="eb-card eb-card-income">
                    <div class="eb-card-label">Income This Month</div>
                    <div class="eb-card-value eb-positive">+ ${totals.income.toFixed(2)}</div>
                    <div class="eb-card-sub">${totals.incomeCount} transaction${totals.incomeCount !== 1 ? 's' : ''}</div>
                </div>
                <div class="eb-card eb-card-expense">
                    <div class="eb-card-label">Expenses This Month</div>
                    <div class="eb-card-value eb-negative">- ${totals.expense.toFixed(2)}</div>
                    <div class="eb-card-sub">${totals.expenseCount} transaction${totals.expenseCount !== 1 ? 's' : ''}</div>
                </div>
                <div class="eb-card eb-card-invoices">
                    <div class="eb-card-label">Pending Invoices</div>
                    <div class="eb-card-value">${pendingInvoices}</div>
                    <div class="eb-card-sub">awaiting payment</div>
                </div>
            </div>

            <div class="eb-quick-actions">
                <button class="eb-quick-btn eb-quick-income">${ElxaIcons.renderAction('plus')} Record Income</button>
                <button class="eb-quick-btn eb-quick-expense">${ElxaIcons.renderAction('minus')} Record Expense</button>
                <button class="eb-quick-btn eb-quick-invoice">${ElxaIcons.renderAction('file-document')} New Invoice</button>
            </div>

            <div class="eb-recent-section">
                <div class="eb-section-title">Recent Transactions</div>
                ${recent.length === 0
                    ? '<div class="eb-empty">No transactions yet — add your first one!</div>'
                    : `<div class="eb-recent-list">${recent.map(t => this.renderTransactionRow(t)).join('')}</div>`
                }
            </div>
        `;
    }

    // =================================
    // TRANSACTIONS VIEW
    // =================================
    renderTransactions(windowId) {
        const el = document.getElementById(`eb-transactions-${windowId}`);
        if (!el) return;

        const sorted = [...this.data.transactions].reverse();

        el.innerHTML = `
            <div class="eb-page-header">
                <h2>Transactions</h2>
                <div class="eb-header-actions">
                    <button class="eb-add-income-btn eb-btn-green">${ElxaIcons.renderAction('plus')} Income</button>
                    <button class="eb-add-expense-btn eb-btn-red">${ElxaIcons.renderAction('minus')} Expense</button>
                </div>
            </div>

            ${sorted.length === 0
                ? '<div class="eb-empty">No transactions yet. Record your first income or expense!</div>'
                : `
                    <div class="eb-table">
                        <div class="eb-table-header">
                            <div class="eb-col-date">Date</div>
                            <div class="eb-col-desc">Description</div>
                            <div class="eb-col-cat">Category</div>
                            <div class="eb-col-amount">Amount</div>
                            <div class="eb-col-action"></div>
                        </div>
                        <div class="eb-table-body">
                            ${sorted.map(t => this.renderTransactionRow(t)).join('')}
                        </div>
                    </div>
                `
            }
        `;
    }

    renderTransactionRow(t) {
        const isIncome = t.type === 'income';
        return `
            <div class="eb-row eb-row-${t.type}">
                <div class="eb-col-date">${this.formatDate(t.date)}</div>
                <div class="eb-col-desc">${t.description}</div>
                <div class="eb-col-cat"><span class="eb-cat-badge">${t.category || ''}</span></div>
                <div class="eb-col-amount ${isIncome ? 'eb-positive' : 'eb-negative'}">
                    ${isIncome ? '+' : '-'}${Math.abs(t.amount).toFixed(2)}
                </div>
                <div class="eb-col-action">
                    <button class="eb-icon-btn eb-delete-transaction" data-id="${t.id}" title="Delete">${ElxaIcons.renderAction('delete')}</button>
                </div>
            </div>
        `;
    }

    showTransactionForm(type, windowId) {
        const el = document.getElementById(`eb-transactions-${windowId}`);
        if (!el) return;

        const isIncome = type === 'income';
        const categories = isIncome ? this.incomeCategories : this.expenseCategories;

        el.innerHTML = `
            <div class="eb-page-header">
                <h2>${isIncome ? 'Record Income' : 'Record Expense'}</h2>
            </div>
            <div class="eb-form-card">
                <div class="eb-form-row">
                    <label class="eb-label">Amount (in snakes 🐍)</label>
                    <input type="number" class="eb-input" id="eb-txn-amount-${windowId}" placeholder="0.00" step="0.01" min="0">
                </div>
                <div class="eb-form-row">
                    <label class="eb-label">Description</label>
                    <input type="text" class="eb-input" id="eb-txn-desc-${windowId}" placeholder="${isIncome ? 'What did you earn money for?' : 'What did you buy?'}">
                </div>
                <div class="eb-form-row">
                    <label class="eb-label">Category</label>
                    <select class="eb-input eb-select" id="eb-txn-cat-${windowId}">
                        ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                </div>
                <div class="eb-form-row">
                    <label class="eb-label">Date</label>
                    <input type="date" class="eb-input" id="eb-txn-date-${windowId}" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <input type="hidden" id="eb-txn-type-${windowId}" value="${type}">
                <div class="eb-form-actions">
                    <button class="eb-cancel-form-btn eb-btn-sm eb-btn-gray">Cancel</button>
                    <button class="eb-save-txn-btn eb-btn-sm ${isIncome ? 'eb-btn-green' : 'eb-btn-red'}" id="eb-save-txn-${windowId}">
                        ${ElxaIcons.renderAction('check')} Save ${isIncome ? 'Income' : 'Expense'}
                    </button>
                </div>
            </div>
        `;

        // Wire save button
        const saveBtn = el.querySelector(`#eb-save-txn-${windowId}`);
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveTransaction(windowId));
        }

        el.querySelector(`#eb-txn-amount-${windowId}`)?.focus();
    }

    saveTransaction(windowId) {
        const container = document.querySelector(`.eb-app[data-window-id="${windowId}"]`);
        if (!container) return;

        const amount = parseFloat(container.querySelector(`#eb-txn-amount-${windowId}`)?.value);
        const desc = container.querySelector(`#eb-txn-desc-${windowId}`)?.value.trim();
        const category = container.querySelector(`#eb-txn-cat-${windowId}`)?.value;
        const date = container.querySelector(`#eb-txn-date-${windowId}`)?.value;
        const type = container.querySelector(`#eb-txn-type-${windowId}`)?.value;

        if (!amount || amount <= 0) {
            ElxaUI.showMessage('Please enter a valid amount!', 'warning');
            return;
        }
        if (!desc) {
            ElxaUI.showMessage('Please add a description!', 'warning');
            return;
        }

        // Check balance for expenses
        if (type === 'expense' && amount > this.calculateBalance()) {
            ElxaUI.showMessage(`Not enough snakes! You only have 🐍 ${this.calculateBalance().toFixed(2)}`, 'warning');
            return;
        }

        this.data.transactions.push({
            id: this.data.nextTransactionId++,
            date: date || new Date().toISOString().split('T')[0],
            description: desc,
            amount: type === 'expense' ? -amount : amount,
            type: type,
            category: category
        });

        this.saveData();
        this.renderTransactions(windowId);
        ElxaUI.showMessage(
            type === 'income'
                ? `Earned 🐍 ${amount.toFixed(2)} — nice work!`
                : `Spent 🐍 ${amount.toFixed(2)} on ${desc}`,
            type === 'income' ? 'success' : 'info'
        );
    }

    async deleteTransaction(id, windowId) {
        const t = this.data.transactions.find(t => t.id === id);
        if (!t) return;

        const confirmed = await ElxaUI.showConfirmDialog(
            `Delete "${t.description}" (${Math.abs(t.amount).toFixed(2)} snakes)?`,
            'Delete Transaction'
        );
        if (!confirmed) return;

        this.data.transactions = this.data.transactions.filter(t => t.id !== id);
        this.saveData();
        this.renderCurrentView(windowId);
        ElxaUI.showMessage('Transaction deleted', 'info');
    }

    // =================================
    // INVOICES VIEW
    // =================================
    renderInvoices(windowId) {
        const el = document.getElementById(`eb-invoices-${windowId}`);
        if (!el) return;

        const sorted = [...this.data.invoices].reverse();

        el.innerHTML = `
            <div class="eb-page-header">
                <h2>Invoices</h2>
                <div class="eb-header-actions">
                    <button class="eb-new-invoice-btn eb-btn-sm eb-btn-blue">${ElxaIcons.renderAction('plus')} New Invoice</button>
                </div>
            </div>

            ${sorted.length === 0
                ? '<div class="eb-empty">No invoices yet. Create one to bill someone for your hard work!</div>'
                : `<div class="eb-invoice-list">${sorted.map(inv => this.renderInvoiceCard(inv)).join('')}</div>`
            }
        `;
    }

    renderInvoiceCard(inv) {
        const statusClass = { draft: 'eb-status-draft', sent: 'eb-status-sent', paid: 'eb-status-paid' }[inv.status];
        const statusLabel = { draft: 'Draft', sent: 'Sent', paid: 'Paid' }[inv.status];

        return `
            <div class="eb-invoice-card">
                <div class="eb-invoice-header">
                    <div class="eb-invoice-number">INV-${String(inv.id).padStart(4, '0')}</div>
                    <span class="eb-status-badge ${statusClass}">${statusLabel}</span>
                </div>
                <div class="eb-invoice-details">
                    <div class="eb-invoice-to"><strong>Bill To:</strong> ${inv.to}</div>
                    <div class="eb-invoice-date"><strong>Date:</strong> ${this.formatDate(inv.createdDate)}</div>
                    <div class="eb-invoice-total"><strong>Total:</strong> 🐍 ${inv.total.toFixed(2)}</div>
                </div>
                <div class="eb-invoice-items">
                    ${inv.items.map(item => `
                        <div class="eb-invoice-item-row">
                            <span>${item.description}</span>
                            <span>🐍 ${item.amount.toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="eb-invoice-actions">
                    ${inv.status === 'draft' ? `<button class="eb-send-invoice eb-btn-sm eb-btn-blue" data-id="${inv.id}">${ElxaIcons.renderAction('send')} Send</button>` : ''}
                    ${inv.status === 'sent' ? `<button class="eb-pay-invoice eb-btn-sm eb-btn-green" data-id="${inv.id}">${ElxaIcons.renderAction('check')} Mark Paid</button>` : ''}
                    ${inv.status !== 'paid' ? `<button class="eb-delete-invoice eb-btn-sm eb-btn-gray" data-id="${inv.id}">${ElxaIcons.renderAction('delete')}</button>` : ''}
                    ${inv.status === 'paid' ? `<span class="eb-paid-note">${ElxaIcons.renderAction('check-circle')} Payment received ${inv.paidDate ? this.formatDate(inv.paidDate) : ''}</span>` : ''}
                </div>
            </div>
        `;
    }

    showInvoiceForm(windowId) {
        const el = document.getElementById(`eb-invoices-${windowId}`);
        if (!el) return;

        el.innerHTML = `
            <div class="eb-page-header">
                <h2>Create Invoice</h2>
            </div>
            <div class="eb-form-card eb-invoice-form">
                <div class="eb-invoice-form-header">
                    <div class="eb-invoice-from">
                        <div class="eb-invoice-logo">${ElxaIcons.render('elxabooks', 'ui')}</div>
                        <div><strong>ElxaCorp</strong><br><span class="eb-subtle">Snakesia's Finest Company</span></div>
                    </div>
                    <div class="eb-invoice-form-number">INVOICE</div>
                </div>
                <div class="eb-form-row">
                    <label class="eb-label">Bill To</label>
                    <select class="eb-input eb-select" id="eb-inv-to-${windowId}">
                        ${this.contacts.map(c => `<option value="${c}">${c}</option>`).join('')}
                        <option value="custom">Custom...</option>
                    </select>
                </div>
                <div class="eb-form-row" id="eb-inv-custom-row-${windowId}" style="display:none;">
                    <label class="eb-label">Custom Name</label>
                    <input type="text" class="eb-input" id="eb-inv-custom-${windowId}" placeholder="Enter name">
                </div>
                <div class="eb-section-title">Line Items</div>
                <div class="eb-line-items" id="eb-inv-items-${windowId}">
                    <div class="eb-line-item-row">
                        <input type="text" class="eb-input eb-line-desc" placeholder="Description (e.g., Lawn mowing)">
                        <input type="number" class="eb-input eb-line-amount" placeholder="0.00" step="0.01" min="0">
                        <button class="eb-remove-line-item eb-icon-btn" title="Remove">${ElxaIcons.renderAction('close')}</button>
                    </div>
                </div>
                <button class="eb-add-line-item eb-btn-sm eb-btn-gray">${ElxaIcons.renderAction('plus')} Add Line Item</button>
                <div class="eb-form-actions">
                    <button class="eb-cancel-form-btn eb-btn-sm eb-btn-gray">Cancel</button>
                    <button class="eb-save-invoice-btn eb-btn-sm eb-btn-blue">${ElxaIcons.renderAction('check')} Create Invoice</button>
                </div>
            </div>
        `;

        // Handle custom contact toggle
        const selectEl = el.querySelector(`#eb-inv-to-${windowId}`);
        const customRow = el.querySelector(`#eb-inv-custom-row-${windowId}`);
        if (selectEl && customRow) {
            selectEl.addEventListener('change', () => {
                customRow.style.display = selectEl.value === 'custom' ? 'block' : 'none';
            });
        }
    }

    addInvoiceLineItem(windowId) {
        const container = document.getElementById(`eb-inv-items-${windowId}`);
        if (!container) return;

        const row = document.createElement('div');
        row.className = 'eb-line-item-row';
        row.innerHTML = `
            <input type="text" class="eb-input eb-line-desc" placeholder="Description">
            <input type="number" class="eb-input eb-line-amount" placeholder="0.00" step="0.01" min="0">
            <button class="eb-remove-line-item eb-icon-btn" title="Remove">${ElxaIcons.renderAction('close')}</button>
        `;
        container.appendChild(row);
    }

    saveInvoice(windowId) {
        const container = document.querySelector(`.eb-app[data-window-id="${windowId}"]`);
        if (!container) return;

        const toSelect = container.querySelector(`#eb-inv-to-${windowId}`);
        let to = toSelect?.value;
        if (to === 'custom') {
            to = container.querySelector(`#eb-inv-custom-${windowId}`)?.value.trim();
        }
        if (!to) {
            ElxaUI.showMessage('Please select who to bill!', 'warning');
            return;
        }

        const rows = container.querySelectorAll('.eb-line-item-row');
        const items = [];
        rows.forEach(row => {
            const desc = row.querySelector('.eb-line-desc')?.value.trim();
            const amount = parseFloat(row.querySelector('.eb-line-amount')?.value);
            if (desc && amount > 0) {
                items.push({ description: desc, amount });
            }
        });

        if (items.length === 0) {
            ElxaUI.showMessage('Add at least one line item with a description and amount!', 'warning');
            return;
        }

        const total = items.reduce((sum, item) => sum + item.amount, 0);

        this.data.invoices.push({
            id: this.data.nextInvoiceId++,
            to,
            items,
            total,
            status: 'draft',
            createdDate: new Date().toISOString().split('T')[0],
            paidDate: null
        });

        this.saveData();
        this.renderInvoices(windowId);
        ElxaUI.showMessage(`Invoice for 🐍 ${total.toFixed(2)} created!`, 'success');
    }

    sendInvoice(id, windowId) {
        const inv = this.data.invoices.find(i => i.id === id);
        if (!inv) return;

        inv.status = 'sent';
        this.saveData();
        this.renderInvoices(windowId);
        ElxaUI.showMessage(`Invoice sent to ${inv.to}! Now we wait for payment...`, 'success');
    }

    async markInvoicePaid(id, windowId) {
        const inv = this.data.invoices.find(i => i.id === id);
        if (!inv) return;

        const confirmed = await ElxaUI.showConfirmDialog(
            `Mark invoice to ${inv.to} as paid? This will add 🐍 ${inv.total.toFixed(2)} to your income.`,
            'Confirm Payment'
        );
        if (!confirmed) return;

        inv.status = 'paid';
        inv.paidDate = new Date().toISOString().split('T')[0];

        // Add as income transaction
        this.data.transactions.push({
            id: this.data.nextTransactionId++,
            date: inv.paidDate,
            description: `Invoice INV-${String(inv.id).padStart(4, '0')} paid by ${inv.to}`,
            amount: inv.total,
            type: 'income',
            category: 'Business Sales'
        });

        this.saveData();
        this.renderInvoices(windowId);
        ElxaUI.showMessage(`${inv.to} paid 🐍 ${inv.total.toFixed(2)}! Money in the bank!`, 'success');
    }

    async deleteInvoice(id, windowId) {
        const inv = this.data.invoices.find(i => i.id === id);
        if (!inv) return;

        const confirmed = await ElxaUI.showConfirmDialog(
            `Delete invoice to ${inv.to}?`,
            'Delete Invoice'
        );
        if (!confirmed) return;

        this.data.invoices = this.data.invoices.filter(i => i.id !== id);
        this.saveData();
        this.renderInvoices(windowId);
        ElxaUI.showMessage('Invoice deleted', 'info');
    }

    // =================================
    // REPORTS VIEW
    // =================================
    renderReports(windowId) {
        const el = document.getElementById(`eb-reports-${windowId}`);
        if (!el) return;

        const allTime = this.getAllTimeTotals();
        const byCategory = this.getCategoryBreakdown();

        el.innerHTML = `
            <div class="eb-page-header">
                <h2>Reports</h2>
            </div>

            <div class="eb-report-section">
                <div class="eb-section-title">Profit & Loss Summary</div>
                <div class="eb-pnl-grid">
                    <div class="eb-pnl-item eb-pnl-income">
                        <div class="eb-pnl-label">Total Income</div>
                        <div class="eb-pnl-value eb-positive">🐍 ${allTime.income.toFixed(2)}</div>
                    </div>
                    <div class="eb-pnl-item eb-pnl-expense">
                        <div class="eb-pnl-label">Total Expenses</div>
                        <div class="eb-pnl-value eb-negative">🐍 ${allTime.expense.toFixed(2)}</div>
                    </div>
                    <div class="eb-pnl-item eb-pnl-net">
                        <div class="eb-pnl-label">Net Profit</div>
                        <div class="eb-pnl-value ${allTime.net >= 0 ? 'eb-positive' : 'eb-negative'}">🐍 ${allTime.net.toFixed(2)}</div>
                    </div>
                </div>
            </div>

            ${this.renderCategoryReport('Income by Category', byCategory.income, allTime.income)}
            ${this.renderCategoryReport('Expenses by Category', byCategory.expense, allTime.expense)}
        `;
    }

    renderCategoryReport(title, categoryData, total) {
        const entries = Object.entries(categoryData).sort((a, b) => b[1] - a[1]);
        if (entries.length === 0) {
            return `<div class="eb-report-section"><div class="eb-section-title">${title}</div><div class="eb-empty">No data yet</div></div>`;
        }

        const maxVal = Math.max(...entries.map(([, v]) => v));

        return `
            <div class="eb-report-section">
                <div class="eb-section-title">${title}</div>
                <div class="eb-category-bars">
                    ${entries.map(([cat, val]) => {
                        const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                        const share = total > 0 ? ((val / total) * 100).toFixed(0) : 0;
                        return `
                            <div class="eb-bar-row">
                                <div class="eb-bar-label">${cat}</div>
                                <div class="eb-bar-track">
                                    <div class="eb-bar-fill" style="width: ${pct}%"></div>
                                </div>
                                <div class="eb-bar-value">🐍 ${val.toFixed(2)} (${share}%)</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // =================================
    // STARTING BALANCE
    // =================================
    async promptStartingBalance(windowId) {
        const result = await ElxaUI.showInputDialog(
            'Enter your starting balance (in snakes):',
            'Set Starting Balance',
            this.data.startingBalance.toString()
        );
        if (result === null) return;

        const amount = parseFloat(result);
        if (isNaN(amount)) {
            ElxaUI.showMessage('Please enter a valid number!', 'warning');
            return;
        }

        this.data.startingBalance = amount;
        this.saveData();
        this.renderCurrentView(windowId);
        ElxaUI.showMessage(`Starting balance set to 🐍 ${amount.toFixed(2)}`, 'success');
    }

    // =================================
    // CALCULATIONS
    // =================================
    calculateBalance() {
        const txnTotal = this.data.transactions.reduce((sum, t) => sum + t.amount, 0);
        return this.data.startingBalance + txnTotal;
    }

    getMonthTotals() {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();

        let income = 0, expense = 0, incomeCount = 0, expenseCount = 0;

        this.data.transactions.forEach(t => {
            const d = new Date(t.date);
            if (d.getMonth() === month && d.getFullYear() === year) {
                if (t.type === 'income') {
                    income += t.amount;
                    incomeCount++;
                } else {
                    expense += Math.abs(t.amount);
                    expenseCount++;
                }
            }
        });

        return { income, expense, incomeCount, expenseCount };
    }

    getAllTimeTotals() {
        let income = 0, expense = 0;
        this.data.transactions.forEach(t => {
            if (t.type === 'income') income += t.amount;
            else expense += Math.abs(t.amount);
        });
        return { income, expense, net: income - expense };
    }

    getCategoryBreakdown() {
        const income = {};
        const expense = {};

        this.data.transactions.forEach(t => {
            const cat = t.category || 'Other';
            if (t.type === 'income') {
                income[cat] = (income[cat] || 0) + t.amount;
            } else {
                expense[cat] = (expense[cat] || 0) + Math.abs(t.amount);
            }
        });

        return { income, expense };
    }

    // =================================
    // PERSISTENCE
    // =================================
    saveData() {
        try {
            const json = JSON.stringify(this.data, null, 2);
            this.fileSystem.createFile(['root', 'System'], 'ElxaBooksPro.json', json);
        } catch (error) {
            console.error('💾 ElxaBooks: Failed to save:', error);
        }
    }

    loadData() {
        try {
            // Migrate from old location if needed
            let file = this.fileSystem.getFile(['root', 'System'], 'ElxaBooksPro.json');
            if (!file) {
                file = this.fileSystem.getFile(['root', 'Documents'], 'ElxaBooksPro.json');
                if (file) {
                    this.fileSystem.createFile(['root', 'System'], 'ElxaBooksPro.json', file.content);
                    this.fileSystem.deleteItem(['root', 'Documents'], 'ElxaBooksPro.json');
                }
            }
            if (file && file.content) {
                const loaded = JSON.parse(file.content);
                this.data.startingBalance = loaded.startingBalance || 0;
                this.data.transactions = loaded.transactions || [];
                this.data.invoices = loaded.invoices || [];
                this.data.nextTransactionId = loaded.nextTransactionId || 1;
                this.data.nextInvoiceId = loaded.nextInvoiceId || 1;

                // Safety: ensure IDs are unique
                if (this.data.transactions.length > 0) {
                    this.data.nextTransactionId = Math.max(this.data.nextTransactionId, Math.max(...this.data.transactions.map(t => t.id)) + 1);
                }
                if (this.data.invoices.length > 0) {
                    this.data.nextInvoiceId = Math.max(this.data.nextInvoiceId, Math.max(...this.data.invoices.map(i => i.id)) + 1);
                }
            }
        } catch (error) {
            console.error('💾 ElxaBooks: Failed to load:', error);
        }
    }

    // =================================
    // UTILITIES
    // =================================
    formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}
