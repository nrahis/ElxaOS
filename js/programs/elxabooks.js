// =================================
// ELXABOOKS PRO — FINANCIAL DASHBOARD
// QuickBooks-inspired for ElxaCorp — now with real finance integration
// =================================
class ElxaBooksProgram {
    constructor(windowManager, fileSystem, eventBus) {
        this.windowManager = windowManager;
        this.fileSystem = fileSystem;
        this.eventBus = eventBus;

        // Bookkeeping categories (manual tracking)
        this.incomeCategories = ['Allowance', 'Chores', 'Business Sales', 'Gifts', 'Other'];
        this.expenseCategories = ['Food & Snacks', 'Toys & Games', 'Supplies', 'Clothes', 'Savings', 'Other'];
        this.contacts = ['Mom', 'Dad', 'Uncle Randy', 'Aunt Angel', 'Granddaddy', 'Teacher', 'Friend'];

        // Manual bookkeeping data (stored in filesystem)
        this.data = {
            startingBalance: 0,
            transactions: [],
            invoices: [],
            nextTransactionId: 1,
            nextInvoiceId: 1
        };

        this.currentView = 'dashboard';
        this._windowId = null;
    }

    // =================================
    // HELPERS
    // =================================

    /** Convert USD to snakes display string */
    snk(usd) {
        return (usd * 2).toFixed(2);
    }

    /** Format date string */
    formatDate(dateStr) {
        if (!dateStr) return '\u2014';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    /** Short date (no year) */
    shortDate(dateStr) {
        if (!dateStr) return '\u2014';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    /** Get finance service (safe access) */
    get fin() { return elxaOS.financeService; }
    get inv() { return elxaOS.inventoryService; }
    get emp() { return elxaOS.employmentService; }

    /** Safe sync access to credit cards (active only) */
    _getActiveCards() {
        if (!this.fin) return [];
        var cards = this.fin.getCreditCardsSync();
        return cards.filter(function(c) { return c.status === 'active'; });
    }

    /** Safe sync access to loans (active only) */
    _getActiveLoans() {
        if (!this.fin) return [];
        var loans = this.fin.getLoansSync();
        return loans.filter(function(l) { return l.status === 'active'; });
    }

    /** Safe sync access to recent transactions */
    _getRecentTxns(count) {
        if (!this.fin || !this.fin._data) return [];
        var txns = this.fin._data.transactions || [];
        return txns.slice(0, count || 8);
    }

    /** Safe sync access to credit score bracket */
    _scoreBracket(score) {
        if (this.fin && typeof this.fin._getScoreBracket === 'function') {
            return this.fin._getScoreBracket(score);
        }
        // Fallback
        if (score >= 740) return { rating: 'Excellent', color: '#3b82f6' };
        if (score >= 670) return { rating: 'Very Good', color: '#22c55e' };
        if (score >= 580) return { rating: 'Good', color: '#84cc16' };
        if (score >= 500) return { rating: 'Fair', color: '#eab308' };
        return { rating: 'Poor', color: '#ef4444' };
    }

    // =================================
    // LAUNCH / DESTROY
    // =================================
    launch() {
        var windowId = 'elxabooks-' + Date.now();
        this._windowId = windowId;
        var content = this.createInterface(windowId);

        this.windowManager.createWindow(
            windowId,
            ElxaIcons.render('elxabooks', 'ui') + ' ElxaBooks Pro',
            content,
            { width: '900px', height: '600px', x: '60px', y: '40px' }
        );

        var self = this;
        this._onWindowClosed = function(data) {
            if (data.id === windowId) self.destroy(windowId);
        };
        this.eventBus.on('window.closed', this._onWindowClosed);

        setTimeout(function() {
            self.loadData();
            self.setupEventHandlers(windowId);
            self.switchView('dashboard', windowId);
        }, 100);

        return windowId;
    }

    destroy(windowId) {
        if (this._onWindowClosed) {
            this.eventBus.off('window.closed', this._onWindowClosed);
            this._onWindowClosed = null;
        }
        this._windowId = null;
    }

    // =================================
    // INTERFACE SHELL
    // =================================
    createInterface(windowId) {
        return '<div class="eb-app" data-window-id="' + windowId + '">'
            + '<div class="eb-sidebar">'
                + '<div class="eb-sidebar-brand">'
                    + '<div class="eb-brand-icon">' + ElxaIcons.render('elxabooks', 'ui') + '</div>'
                    + '<div class="eb-brand-name">ElxaBooks<span class="eb-brand-pro">PRO</span></div>'
                + '</div>'
                + '<nav class="eb-nav">'
                    + '<div class="eb-nav-section-label">Overview</div>'
                    + '<button class="eb-nav-item active" data-view="dashboard">'
                        + ElxaIcons.renderAction('home') + ' Dashboard'
                    + '</button>'
                    + '<div class="eb-nav-section-label">Finance</div>'
                    + '<button class="eb-nav-item" data-view="accounts">'
                        + ElxaIcons.renderAction('bank') + ' Accounts'
                    + '</button>'
                    + '<button class="eb-nav-item" data-view="cards">'
                        + ElxaIcons.renderAction('credit-card') + ' Credit Cards'
                    + '</button>'
                    + '<button class="eb-nav-item" data-view="loans">'
                        + ElxaIcons.renderAction('cash') + ' Loans'
                    + '</button>'
                    + '<button class="eb-nav-item" data-view="subscriptions">'
                        + ElxaIcons.renderAction('autorenew') + ' Subscriptions'
                    + '</button>'
                    + '<button class="eb-nav-item" data-view="taxes">'
                        + ElxaIcons.renderAction('file-document') + ' Taxes'
                    + '</button>'
                    + '<div class="eb-nav-section-label">Business</div>'
                    + '<button class="eb-nav-item" data-view="bookkeeping">'
                        + ElxaIcons.renderAction('list') + ' Bookkeeping'
                    + '</button>'
                    + '<button class="eb-nav-item" data-view="reports">'
                        + ElxaIcons.renderAction('chart-bar') + ' Reports'
                    + '</button>'
                + '</nav>'
                + '<div class="eb-sidebar-footer">ElxaCorp Accounting</div>'
            + '</div>'
            + '<div class="eb-main">'
                + '<div class="eb-view" id="eb-dashboard-' + windowId + '"></div>'
                + '<div class="eb-view" id="eb-accounts-' + windowId + '"></div>'
                + '<div class="eb-view" id="eb-cards-' + windowId + '"></div>'
                + '<div class="eb-view" id="eb-loans-' + windowId + '"></div>'
                + '<div class="eb-view" id="eb-subscriptions-' + windowId + '"></div>'
                + '<div class="eb-view" id="eb-taxes-' + windowId + '"></div>'
                + '<div class="eb-view" id="eb-bookkeeping-' + windowId + '"></div>'
                + '<div class="eb-view" id="eb-reports-' + windowId + '"></div>'
            + '</div>'
        + '</div>';
    }

    // =================================
    // EVENT HANDLERS
    // =================================
    setupEventHandlers(windowId) {
        var container = document.querySelector('.eb-app[data-window-id="' + windowId + '"]');
        if (!container) return;
        var self = this;

        container.addEventListener('click', function(e) {
            var btn = e.target.closest('button');
            if (!btn) return;

            // Sidebar nav
            if (btn.classList.contains('eb-nav-item')) {
                self.switchView(btn.dataset.view, windowId);
                return;
            }

            var action = btn.dataset.action;
            if (!action) return;

            switch (action) {
                // Dashboard quick actions
                case 'quick-income':
                    self.switchView('bookkeeping', windowId);
                    setTimeout(function() { self.showTransactionForm('income', windowId); }, 100);
                    break;
                case 'quick-expense':
                    self.switchView('bookkeeping', windowId);
                    setTimeout(function() { self.showTransactionForm('expense', windowId); }, 100);
                    break;
                case 'quick-invoice':
                    self.switchView('bookkeeping', windowId);
                    setTimeout(function() { self.showInvoiceForm(windowId); }, 100);
                    break;

                // Bookkeeping actions
                case 'add-income': self.showTransactionForm('income', windowId); break;
                case 'add-expense': self.showTransactionForm('expense', windowId); break;
                case 'new-invoice': self.showInvoiceForm(windowId); break;
                case 'save-txn': self.saveTransaction(windowId); break;
                case 'delete-txn': self.deleteTransaction(parseInt(btn.dataset.id), windowId); break;
                case 'send-invoice': self.sendInvoice(parseInt(btn.dataset.id), windowId); break;
                case 'pay-invoice': self.markInvoicePaid(parseInt(btn.dataset.id), windowId); break;
                case 'delete-invoice': self.deleteInvoice(parseInt(btn.dataset.id), windowId); break;
                case 'add-line-item': self.addInvoiceLineItem(windowId); break;
                case 'remove-line-item': btn.closest('.eb-line-item-row').remove(); break;
                case 'save-invoice': self.saveInvoice(windowId); break;
                case 'cancel-form': self.renderCurrentView(windowId); break;
                case 'set-balance': self.promptStartingBalance(windowId); break;
                case 'bk-tab': self.switchBookkeepingTab(btn.dataset.tab, windowId); break;
                case 'cc-payment': self.showCCPaymentDialog(btn.dataset.id, windowId); break;
                case 'loan-payment': self.showLoanPaymentDialog(btn.dataset.id, windowId); break;
                case 'cancel-sub': self.cancelSubscription(btn.dataset.id, windowId); break;
            }
        });
    }

    // =================================
    // NAVIGATION
    // =================================
    switchView(viewName, windowId) {
        var container = document.querySelector('.eb-app[data-window-id="' + windowId + '"]');
        if (!container) return;

        container.querySelectorAll('.eb-nav-item').forEach(function(item) {
            item.classList.toggle('active', item.dataset.view === viewName);
        });
        container.querySelectorAll('.eb-view').forEach(function(v) { v.classList.remove('active'); });

        var target = container.querySelector('#eb-' + viewName + '-' + windowId);
        if (target) {
            target.classList.add('active');
            this.currentView = viewName;
        }
        this.renderView(viewName, windowId);
    }

    renderView(viewName, windowId) {
        switch (viewName) {
            case 'dashboard': this.renderDashboard(windowId); break;
            case 'accounts': this.renderAccounts(windowId); break;
            case 'cards': this.renderCards(windowId); break;
            case 'loans': this.renderLoans(windowId); break;
            case 'subscriptions': this.renderSubscriptions(windowId); break;
            case 'taxes': this.renderTaxes(windowId); break;
            case 'bookkeeping': this.renderBookkeeping(windowId); break;
            case 'reports': this.renderReports(windowId); break;
        }
    }

    renderCurrentView(windowId) {
        this.renderView(this.currentView || 'dashboard', windowId);
    }

    // =====================================================================
    //  VIEW: DASHBOARD
    // =====================================================================
    renderDashboard(windowId) {
        var el = document.getElementById('eb-dashboard-' + windowId);
        if (!el) return;

        // Real balances from finance service
        var balances = this.fin ? this.fin.getAccountBalancesSync() : { checking: 0, savings: 0, trust: 0 };
        var totalBalance = balances.checking + balances.savings + balances.trust;

        // Credit score
        var scoreData = (this.fin && this.fin._data) ? this.fin._data.creditScore : null;
        var score = scoreData ? scoreData.score : 500;
        var scoreBracket = this._scoreBracket(score);

        // Credit cards
        var cards = this._getActiveCards();
        var totalCCDebt = cards.reduce(function(s, c) { return s + c.balance; }, 0);

        // Loans
        var loans = this._getActiveLoans();
        var totalLoanDebt = loans.reduce(function(s, l) { return s + l.remainingBalance; }, 0);

        // Monthly obligations
        var monthlyOblData = (this.fin && typeof this.fin.getMonthlyObligationsSync === 'function') ? this.fin.getMonthlyObligationsSync() : null;
        var monthlyObl = monthlyOblData ? (monthlyOblData.totalMonthlyObligations || 0) : 0;

        // Employment
        var employed = this.emp ? this.emp.isEmployed() : false;
        var empData = (employed && this.emp) ? this.emp.getEmploymentData() : null;

        var html = '<div class="eb-page-header"><h2>Financial Dashboard</h2></div>';

        // Top row cards
        html += '<div class="eb-summary-cards eb-grid-3">';
        html += '<div class="eb-card eb-card-balance">'
            + '<div class="eb-card-label">Total Balance</div>'
            + '<div class="eb-card-value ' + (totalBalance >= 0 ? 'eb-positive' : 'eb-negative') + '">'
            + '\u{1F40D} ' + this.snk(totalBalance) + '</div>'
            + '<div class="eb-card-sub">across all accounts</div></div>';

        html += '<div class="eb-card eb-card-score">'
            + '<div class="eb-card-label">Credit Score</div>'
            + '<div class="eb-card-value" style="color: ' + scoreBracket.color + '">' + score + '</div>'
            + '<div class="eb-card-sub">' + scoreBracket.rating + '</div></div>';

        html += '<div class="eb-card eb-card-obligations">'
            + '<div class="eb-card-label">Monthly Obligations</div>'
            + '<div class="eb-card-value eb-negative">\u{1F40D} ' + this.snk(monthlyObl) + '</div>'
            + '<div class="eb-card-sub">loans, cards, recurring</div></div>';
        html += '</div>';

        // Second row cards
        html += '<div class="eb-summary-cards eb-grid-3">';
        html += '<div class="eb-card"><div class="eb-card-label">Checking</div>'
            + '<div class="eb-card-value-sm">\u{1F40D} ' + this.snk(balances.checking) + '</div></div>';
        html += '<div class="eb-card"><div class="eb-card-label">Savings</div>'
            + '<div class="eb-card-value-sm">\u{1F40D} ' + this.snk(balances.savings) + '</div></div>';
        html += '<div class="eb-card"><div class="eb-card-label">Employment</div>'
            + '<div class="eb-card-value-sm">' + (employed ? (empData ? empData.position : 'Employed') : 'Unemployed') + '</div>'
            + '<div class="eb-card-sub">' + (employed && empData ? '\u{1F40D} ' + this.snk(empData.annualSalary) + '/yr' : 'No income') + '</div></div>';
        html += '</div>';

        // Debt banner
        if (totalCCDebt > 0 || totalLoanDebt > 0) {
            html += '<div class="eb-debt-banner"><div class="eb-section-title">Outstanding Debt</div><div class="eb-debt-row">';
            if (totalCCDebt > 0) html += '<div class="eb-debt-item"><span>Credit Card Debt</span><span class="eb-negative">\u{1F40D} ' + this.snk(totalCCDebt) + '</span></div>';
            if (totalLoanDebt > 0) html += '<div class="eb-debt-item"><span>Loan Balances</span><span class="eb-negative">\u{1F40D} ' + this.snk(totalLoanDebt) + '</span></div>';
            html += '</div></div>';
        }

        // Quick actions
        html += '<div class="eb-quick-actions">'
            + '<button class="eb-quick-btn" data-action="quick-income">' + ElxaIcons.renderAction('plus') + ' Record Income</button>'
            + '<button class="eb-quick-btn" data-action="quick-expense">' + ElxaIcons.renderAction('minus') + ' Record Expense</button>'
            + '<button class="eb-quick-btn" data-action="quick-invoice">' + ElxaIcons.renderAction('file-document') + ' New Invoice</button>'
            + '</div>';

        // Recent transactions
        html += '<div class="eb-recent-section">'
            + '<div class="eb-section-title">Recent Transactions</div>'
            + this._renderRecentTransactions()
            + '</div>';

        el.innerHTML = html;
    }

    _renderRecentTransactions() {
        var txns = this._getRecentTxns(8);
        if (txns.length === 0) {
            return '<div class="eb-empty">No transactions yet</div>';
        }
        var self = this;
        var rows = txns.map(function(t) {
            var isPos = t.amount >= 0;
            return '<div class="eb-row ' + (isPos ? 'eb-row-income' : 'eb-row-expense') + '">'
                + '<div class="eb-col-date">' + self.shortDate(t.date) + '</div>'
                + '<div class="eb-col-desc">' + (t.description || t.type || '\u2014') + '</div>'
                + '<div class="eb-col-cat"><span class="eb-cat-badge">' + (t.account || '') + '</span></div>'
                + '<div class="eb-col-amount ' + (isPos ? 'eb-positive' : 'eb-negative') + '">'
                + (isPos ? '+' : '') + '\u{1F40D} ' + self.snk(Math.abs(t.amount))
                + '</div></div>';
        });
        return '<div class="eb-recent-list">' + rows.join('') + '</div>';
    }

    // =====================================================================
    //  VIEW: ACCOUNTS
    // =====================================================================
    renderAccounts(windowId) {
        var el = document.getElementById('eb-accounts-' + windowId);
        if (!el) return;

        var balances = this.fin ? this.fin.getAccountBalancesSync() : { checking: 0, savings: 0, trust: 0 };
        var txns = this._getRecentTxns(30);
        var self = this;

        var html = '<div class="eb-page-header"><h2>Accounts</h2></div>';

        // Account cards
        html += '<div class="eb-summary-cards eb-grid-3">';
        html += '<div class="eb-card eb-card-balance"><div class="eb-card-label">Checking</div>'
            + '<div class="eb-card-value ' + (balances.checking >= 0 ? 'eb-positive' : 'eb-negative') + '">'
            + '\u{1F40D} ' + this.snk(balances.checking) + '</div>'
            + '<div class="eb-card-sub">Primary account</div></div>';
        html += '<div class="eb-card eb-card-income"><div class="eb-card-label">Savings</div>'
            + '<div class="eb-card-value eb-positive">\u{1F40D} ' + this.snk(balances.savings) + '</div>'
            + '<div class="eb-card-sub">2% APR interest</div></div>';
        html += '<div class="eb-card eb-card-invoices"><div class="eb-card-label">Trust</div>'
            + '<div class="eb-card-value">\u{1F40D} ' + this.snk(balances.trust) + '</div>'
            + '<div class="eb-card-sub">Protected funds</div></div>';
        html += '</div>';

        // Transaction history
        html += '<div class="eb-section-title">Transaction History</div>';
        if (txns.length === 0) {
            html += '<div class="eb-empty">No transactions recorded yet</div>';
        } else {
            html += '<div class="eb-table">'
                + '<div class="eb-table-header">'
                + '<div class="eb-col-date">Date</div>'
                + '<div class="eb-col-desc">Description</div>'
                + '<div class="eb-col-cat">Account</div>'
                + '<div class="eb-col-amount">Amount</div>'
                + '</div><div class="eb-table-body">';
            txns.forEach(function(t) {
                var isPos = t.amount >= 0;
                html += '<div class="eb-row ' + (isPos ? 'eb-row-income' : 'eb-row-expense') + '">'
                    + '<div class="eb-col-date">' + self.shortDate(t.date) + '</div>'
                    + '<div class="eb-col-desc">' + (t.description || '\u2014') + '</div>'
                    + '<div class="eb-col-cat"><span class="eb-cat-badge">' + (t.account || '') + '</span></div>'
                    + '<div class="eb-col-amount ' + (isPos ? 'eb-positive' : 'eb-negative') + '">'
                    + (isPos ? '+' : '') + '\u{1F40D} ' + self.snk(Math.abs(t.amount))
                    + '</div></div>';
            });
            html += '</div></div>';
        }

        el.innerHTML = html;
    }

    // =====================================================================
    //  VIEW: CREDIT CARDS
    // =====================================================================
    renderCards(windowId) {
        var el = document.getElementById('eb-cards-' + windowId);
        if (!el) return;

        var cards = this._getActiveCards();
        var scoreData = (this.fin && this.fin._data) ? this.fin._data.creditScore : null;
        var score = scoreData ? scoreData.score : 500;
        var bracket = this._scoreBracket(score);
        var self = this;

        var html = '<div class="eb-page-header"><h2>Credit Cards</h2></div>';

        // Score banner
        html += '<div class="eb-score-banner">'
            + '<div class="eb-score-number" style="color: ' + bracket.color + '">' + score + '</div>'
            + '<div class="eb-score-details">'
            + '<div class="eb-score-rating">' + bracket.rating + '</div>'
            + '<div class="eb-score-label">Credit Score</div></div>'
            + '<div class="eb-score-bar-track">'
            + '<div class="eb-score-bar-fill" style="width: ' + (((score - 300) / 550) * 100) + '%; background: ' + bracket.color + '"></div>'
            + '</div></div>';

        if (cards.length === 0) {
            html += '<div class="eb-empty">No active credit cards. Visit First Snakesian Bank to apply!</div>';
        } else {
            html += '<div class="eb-cards-grid">';
            cards.forEach(function(c) {
                html += self._renderCreditCard(c);
            });
            html += '</div>';
        }

        el.innerHTML = html;
    }

    _renderCreditCard(card) {
        var utilPct = card.creditLimit > 0 ? ((card.balance / card.creditLimit) * 100).toFixed(0) : 0;
        var utilColor = utilPct > 75 ? '#ef4444' : utilPct > 50 ? '#f59e0b' : '#10b981';
        var tierColors = {
            starter: '#64748b', silver: '#94a3b8', gold: '#f59e0b',
            platinum: '#6366f1', black: '#1e293b'
        };
        var borderColor = tierColors[card.tier] || '#3b82f6';

        var html = '<div class="eb-cc-card" style="border-top: 3px solid ' + borderColor + '">';
        html += '<div class="eb-cc-header">'
            + '<div class="eb-cc-name">' + (card.name || card.tier) + '</div>'
            + '<div class="eb-cc-last4">\u2022\u2022\u2022\u2022 ' + (card.last4 || '????') + '</div></div>';
        html += '<div class="eb-cc-balance">'
            + '<div class="eb-cc-balance-label">Balance</div>'
            + '<div class="eb-cc-balance-value">\u{1F40D} ' + this.snk(card.balance) + '</div></div>';
        html += '<div class="eb-cc-details">'
            + '<div class="eb-cc-detail"><span>Limit</span><span>\u{1F40D} ' + this.snk(card.creditLimit) + '</span></div>'
            + '<div class="eb-cc-detail"><span>Available</span><span>\u{1F40D} ' + this.snk(card.creditLimit - card.balance) + '</span></div>'
            + '<div class="eb-cc-detail"><span>APR</span><span>' + card.apr + '%</span></div>'
            + '<div class="eb-cc-detail"><span>Utilization</span><span style="color: ' + utilColor + '">' + utilPct + '%</span></div></div>';
        html += '<div class="eb-cc-util-track"><div class="eb-cc-util-fill" style="width: ' + Math.min(utilPct, 100) + '%; background: ' + utilColor + '"></div></div>';

        if (card.balance > 0) {
            html += '<div class="eb-cc-actions"><button class="eb-btn-sm eb-btn-green" data-action="cc-payment" data-id="' + card.id + '">'
                + ElxaIcons.renderAction('cash') + ' Make Payment</button></div>';
        } else {
            html += '<div class="eb-cc-paid-badge">Paid in Full</div>';
        }
        html += '</div>';
        return html;
    }

    async showCCPaymentDialog(cardId, windowId) {
        if (!this.fin) return;
        var cards = this._getActiveCards();
        var card = cards.find(function(c) { return c.id === cardId; });
        if (!card || card.balance <= 0) return;

        var maxSnakes = this.snk(card.balance);
        var result = await ElxaUI.showInputDialog(
            'Pay toward ' + (card.name || card.tier) + ' (balance: \u{1F40D} ' + maxSnakes + ')\nEnter amount in snakes:',
            'Credit Card Payment',
            maxSnakes
        );
        if (result === null) return;

        var snakeAmount = parseFloat(result);
        if (isNaN(snakeAmount) || snakeAmount <= 0) {
            ElxaUI.showMessage('Enter a valid amount!', 'warning');
            return;
        }
        var usdAmount = snakeAmount / 2;

        try {
            var payResult = await this.fin.payCredit(cardId, usdAmount);
            if (payResult && payResult.success) {
                ElxaUI.showMessage('Paid \u{1F40D} ' + snakeAmount.toFixed(2) + ' toward ' + (card.name || card.tier) + '!', 'success');
            } else {
                ElxaUI.showMessage(payResult ? payResult.message : 'Payment failed', 'warning');
            }
        } catch (err) {
            ElxaUI.showMessage('Payment failed: ' + (err.message || err), 'warning');
        }
        this.renderCards(windowId);
    }

    // =====================================================================
    //  VIEW: LOANS
    // =====================================================================
    renderLoans(windowId) {
        var el = document.getElementById('eb-loans-' + windowId);
        if (!el) return;

        var loans = this._getActiveLoans();
        var self = this;

        var html = '<div class="eb-page-header"><h2>Loans</h2></div>';

        if (loans.length === 0) {
            html += '<div class="eb-empty">No active loans. Visit First Snakesian Bank to apply!</div>';
        } else {
            html += '<div class="eb-loans-list">';
            loans.forEach(function(l) {
                html += self._renderLoanCard(l);
            });
            html += '</div>';
        }

        el.innerHTML = html;
    }

    _renderLoanCard(loan) {
        var progressPct = loan.termMonths > 0 ? ((loan.paidMonths / loan.termMonths) * 100).toFixed(0) : 0;
        var typeLabels = { personal: 'Personal Loan', auto: 'Auto Loan', mortgage: 'Mortgage' };
        var typeIcons = { personal: 'cash-multiple', auto: 'car', mortgage: 'home' };

        var html = '<div class="eb-loan-card">';
        html += '<div class="eb-loan-header"><div class="eb-loan-type">'
            + ElxaIcons.renderAction(typeIcons[loan.type] || 'cash')
            + ' ' + (typeLabels[loan.type] || loan.type) + '</div>'
            + '<span class="eb-status-badge eb-status-sent">' + loan.status + '</span></div>';

        html += '<div class="eb-loan-details">'
            + '<div class="eb-loan-detail"><span>Original Amount</span><span>\u{1F40D} ' + this.snk(loan.amount) + '</span></div>'
            + '<div class="eb-loan-detail"><span>Remaining</span><span class="eb-negative">\u{1F40D} ' + this.snk(loan.remainingBalance) + '</span></div>'
            + '<div class="eb-loan-detail"><span>Monthly Payment</span><span>\u{1F40D} ' + this.snk(loan.monthlyPayment) + '</span></div>'
            + '<div class="eb-loan-detail"><span>Interest Rate</span><span>' + loan.interestRate + '%</span></div>'
            + '<div class="eb-loan-detail"><span>Progress</span><span>' + loan.paidMonths + '/' + loan.termMonths + ' months</span></div>'
            + '<div class="eb-loan-detail"><span>Missed Payments</span><span class="' + (loan.missedPayments > 0 ? 'eb-negative' : '') + '">' + loan.missedPayments + '</span></div>'
            + '</div>';

        html += '<div class="eb-loan-progress-track"><div class="eb-loan-progress-fill" style="width: ' + progressPct + '%"></div></div>';
        html += '<div class="eb-loan-progress-label">' + progressPct + '% paid off</div>';

        if (loan.remainingBalance > 0) {
            html += '<div class="eb-loan-actions"><button class="eb-btn-sm eb-btn-green" data-action="loan-payment" data-id="' + loan.id + '">'
                + ElxaIcons.renderAction('cash') + ' Extra Payment</button></div>';
        }
        html += '</div>';
        return html;
    }

    async showLoanPaymentDialog(loanId, windowId) {
        if (!this.fin) return;
        var loans = this._getActiveLoans();
        var loan = loans.find(function(l) { return l.id === loanId; });
        if (!loan) return;

        var paymentSnakes = this.snk(loan.monthlyPayment);
        var confirmed = await ElxaUI.showConfirmDialog(
            'Make an extra payment of \u{1F40D} ' + paymentSnakes + ' toward your ' + loan.type + ' loan?',
            'Extra Loan Payment'
        );
        if (!confirmed) return;

        try {
            var payResult = await this.fin.payLoan(loanId, loan.monthlyPayment);
            if (payResult && payResult.success) {
                ElxaUI.showMessage('Extra loan payment applied!', 'success');
            } else {
                ElxaUI.showMessage(payResult ? payResult.message : 'Payment failed', 'warning');
            }
        } catch (err) {
            ElxaUI.showMessage('Payment failed: ' + (err.message || err), 'warning');
        }
        this.renderLoans(windowId);
    }

    // =====================================================================
    //  VIEW: SUBSCRIPTIONS (Shell — ready for money sinks)
    // =====================================================================
    renderSubscriptions(windowId) {
        var el = document.getElementById('eb-subscriptions-' + windowId);
        if (!el) return;

        var subs = this.inv ? this.inv.getItems('subscriptions') : [];
        var activeSubs = subs.filter(function(s) { return s.status === 'active'; });
        var cancelledSubs = subs.filter(function(s) { return s.status === 'cancelled'; });
        var totalMonthly = activeSubs.reduce(function(s, sub) { return s + (sub.monthlyRate || 0); }, 0);
        var self = this;

        var html = '<div class="eb-page-header"><h2>Subscriptions</h2></div>';

        if (activeSubs.length === 0 && cancelledSubs.length === 0) {
            html += '<div class="eb-empty">'
                + '<div style="font-size: 28px; margin-bottom: 8px">' + ElxaIcons.renderAction('autorenew') + '</div>'
                + 'No subscriptions yet!<br>'
                + '<span style="font-size: 11px; color: #94a3b8">When you subscribe to services in Snakesia, they\'ll show up here for management.</span>'
                + '</div>';
        } else {
            if (activeSubs.length > 0) {
                html += '<div class="eb-sub-total-banner">'
                    + '<span>Active Subscriptions: ' + activeSubs.length + '</span>'
                    + '<span>Monthly Total: <strong class="eb-negative">\u{1F40D} ' + self.snk(totalMonthly) + '</strong></span></div>';
                html += '<div class="eb-sub-list">';
                activeSubs.forEach(function(sub) {
                    html += '<div class="eb-sub-card">'
                        + '<div class="eb-sub-info">'
                        + '<div class="eb-sub-name">' + sub.name + '</div>'
                        + '<div class="eb-sub-provider">' + (sub.provider || 'Unknown') + '</div>'
                        + (sub.perks ? '<div class="eb-sub-perks">' + sub.perks + '</div>' : '')
                        + '</div>'
                        + '<div class="eb-sub-cost">\u{1F40D} ' + self.snk(sub.monthlyRate) + '/mo</div>'
                        + '<button class="eb-btn-sm eb-btn-red" data-action="cancel-sub" data-id="' + sub.id + '">Cancel</button>'
                        + '</div>';
                });
                html += '</div>';
            }
            if (cancelledSubs.length > 0) {
                html += '<div class="eb-section-title" style="margin-top: 16px">Cancelled</div>';
                html += '<div class="eb-sub-list eb-sub-cancelled">';
                cancelledSubs.forEach(function(sub) {
                    html += '<div class="eb-sub-card eb-sub-inactive">'
                        + '<div class="eb-sub-info">'
                        + '<div class="eb-sub-name">' + sub.name + '</div>'
                        + '<div class="eb-sub-provider">' + (sub.provider || '') + '</div></div>'
                        + '<span class="eb-status-badge eb-status-draft">Cancelled</span></div>';
                });
                html += '</div>';
            }
        }

        el.innerHTML = html;
    }

    async cancelSubscription(subId, windowId) {
        if (!this.inv) return;
        var sub = this.inv.getItem('subscriptions', subId);
        if (!sub) return;

        var confirmed = await ElxaUI.showConfirmDialog(
            'Cancel your ' + sub.name + ' subscription (\u{1F40D} ' + this.snk(sub.monthlyRate) + '/mo)?',
            'Cancel Subscription'
        );
        if (!confirmed) return;

        this.inv.updateItem('subscriptions', subId, { status: 'cancelled' });

        if (sub.recurringPaymentId && this.fin) {
            try { this.fin.cancelRecurringPayment(sub.recurringPaymentId); }
            catch (e) { /* already cancelled */ }
        }

        ElxaUI.showMessage(sub.name + ' subscription cancelled', 'info');
        this.renderSubscriptions(windowId);
    }

    // =====================================================================
    //  VIEW: TAXES
    // =====================================================================
    renderTaxes(windowId) {
        var el = document.getElementById('eb-taxes-' + windowId);
        if (!el) return;

        var properties = this.inv ? this.inv.getProperties() : [];
        var ownedProps = properties.filter(function(p) { return p.ownership === 'owned' || p.ownership === 'mortgaged'; });
        var totalAnnualTax = ownedProps.reduce(function(s, p) { return s + (p.annualTax || 0); }, 0);
        var self = this;

        var html = '<div class="eb-page-header"><h2>Taxes</h2></div>';

        if (ownedProps.length === 0) {
            html += '<div class="eb-empty">No property tax obligations. You don\'t own any property yet!</div>';
        } else {
            html += '<div class="eb-tax-summary"><div class="eb-card">'
                + '<div class="eb-card-label">Total Annual Property Tax</div>'
                + '<div class="eb-card-value eb-negative">\u{1F40D} ' + self.snk(totalAnnualTax) + '</div>'
                + '<div class="eb-card-sub">\u{1F40D} ' + self.snk(totalAnnualTax / 12) + '/month</div></div></div>';

            html += '<div class="eb-section-title">Property Tax Obligations</div>';
            html += '<div class="eb-tax-list">';
            ownedProps.forEach(function(p) {
                html += '<div class="eb-tax-card">';
                html += '<div class="eb-tax-header"><div class="eb-tax-name">'
                    + ElxaIcons.renderAction('home') + ' ' + p.name + '</div>';
                if (p.taxesMissed > 0) {
                    html += '<span class="eb-status-badge eb-status-overdue">' + p.taxesMissed + ' missed</span>';
                } else {
                    html += '<span class="eb-status-badge eb-status-paid">Current</span>';
                }
                html += '</div>';

                html += '<div class="eb-tax-details">'
                    + '<div class="eb-tax-detail"><span>Property Value</span><span>\u{1F40D} ' + self.snk(p.currentValue || p.purchasePrice) + '</span></div>'
                    + '<div class="eb-tax-detail"><span>Tax Rate</span><span>' + ((p.taxRate || 0) * 100).toFixed(1) + '%</span></div>'
                    + '<div class="eb-tax-detail"><span>Annual Tax</span><span>\u{1F40D} ' + self.snk(p.annualTax || 0) + '</span></div>'
                    + '<div class="eb-tax-detail"><span>Monthly Tax</span><span>\u{1F40D} ' + self.snk(p.monthlyTax || 0) + '</span></div>'
                    + '<div class="eb-tax-detail"><span>Total Paid</span><span class="eb-positive">\u{1F40D} ' + self.snk(p.totalTaxPaid || 0) + '</span></div></div>';

                if (p.taxesMissed >= 2) {
                    html += '<div class="eb-tax-warning">Warning: 3 consecutive missed payments will result in a tax lien!</div>';
                }
                html += '</div>';
            });
            html += '</div>';
        }

        el.innerHTML = html;
    }

    // =====================================================================
    //  VIEW: BOOKKEEPING (Manual Transactions + Invoices)
    // =====================================================================
    renderBookkeeping(windowId) {
        var el = document.getElementById('eb-bookkeeping-' + windowId);
        if (!el) return;

        if (!this._bkTab) this._bkTab = 'transactions';

        var html = '<div class="eb-page-header"><h2>Bookkeeping</h2><div class="eb-header-actions">';
        if (this._bkTab === 'transactions') {
            html += '<button class="eb-btn-sm eb-btn-green" data-action="add-income">' + ElxaIcons.renderAction('plus') + ' Income</button>'
                + '<button class="eb-btn-sm eb-btn-red" data-action="add-expense">' + ElxaIcons.renderAction('minus') + ' Expense</button>';
        } else {
            html += '<button class="eb-btn-sm eb-btn-blue" data-action="new-invoice">' + ElxaIcons.renderAction('plus') + ' New Invoice</button>';
        }
        html += '</div></div>';

        html += '<div class="eb-bk-tabs">'
            + '<button class="eb-bk-tab ' + (this._bkTab === 'transactions' ? 'active' : '') + '" data-action="bk-tab" data-tab="transactions">Transactions</button>'
            + '<button class="eb-bk-tab ' + (this._bkTab === 'invoices' ? 'active' : '') + '" data-action="bk-tab" data-tab="invoices">Invoices</button>'
            + '</div>';

        html += '<div class="eb-bk-content" id="eb-bk-content-' + windowId + '"></div>';

        el.innerHTML = html;

        if (this._bkTab === 'transactions') {
            this._renderBkTransactions(windowId);
        } else {
            this._renderBkInvoices(windowId);
        }
    }

    switchBookkeepingTab(tab, windowId) {
        this._bkTab = tab;
        this.renderBookkeeping(windowId);
    }

    _renderBkTransactions(windowId) {
        var contentEl = document.getElementById('eb-bk-content-' + windowId);
        if (!contentEl) return;

        var sorted = this.data.transactions.slice().reverse();
        var balance = this.calculateBalance();
        var self = this;

        var html = '<div class="eb-bk-balance-bar">'
            + '<span>Book Balance: <strong class="' + (balance >= 0 ? 'eb-positive' : 'eb-negative') + '">\u{1F40D} ' + balance.toFixed(2) + '</strong></span>'
            + '<button class="eb-btn-sm eb-btn-gray" data-action="set-balance">' + ElxaIcons.renderAction('settings') + ' Set Starting Balance</button></div>';

        if (sorted.length === 0) {
            html += '<div class="eb-empty">No manual transactions yet. Record income or expenses for your business!</div>';
        } else {
            html += '<div class="eb-table"><div class="eb-table-header-5">'
                + '<div class="eb-col-date">Date</div>'
                + '<div class="eb-col-desc">Description</div>'
                + '<div class="eb-col-cat">Category</div>'
                + '<div class="eb-col-amount">Amount</div>'
                + '<div class="eb-col-action"></div></div><div class="eb-table-body">';
            sorted.forEach(function(t) {
                var isIncome = t.type === 'income';
                html += '<div class="eb-row ' + (isIncome ? 'eb-row-income' : 'eb-row-expense') + '">'
                    + '<div class="eb-col-date">' + self.formatDate(t.date) + '</div>'
                    + '<div class="eb-col-desc">' + t.description + '</div>'
                    + '<div class="eb-col-cat"><span class="eb-cat-badge">' + (t.category || '') + '</span></div>'
                    + '<div class="eb-col-amount ' + (isIncome ? 'eb-positive' : 'eb-negative') + '">'
                    + (isIncome ? '+' : '-') + Math.abs(t.amount).toFixed(2) + '</div>'
                    + '<div class="eb-col-action"><button class="eb-icon-btn" data-action="delete-txn" data-id="' + t.id + '" title="Delete">'
                    + ElxaIcons.renderAction('delete') + '</button></div></div>';
            });
            html += '</div></div>';
        }

        contentEl.innerHTML = html;
    }

    _renderBkInvoices(windowId) {
        var contentEl = document.getElementById('eb-bk-content-' + windowId);
        if (!contentEl) return;

        var sorted = this.data.invoices.slice().reverse();
        var self = this;

        if (sorted.length === 0) {
            contentEl.innerHTML = '<div class="eb-empty">No invoices yet. Create one to bill someone for your hard work!</div>';
        } else {
            var html = '<div class="eb-invoice-list">';
            sorted.forEach(function(inv) {
                html += self._renderInvoiceCard(inv);
            });
            html += '</div>';
            contentEl.innerHTML = html;
        }
    }

    _renderInvoiceCard(inv) {
        var statusClass = { draft: 'eb-status-draft', sent: 'eb-status-sent', paid: 'eb-status-paid' }[inv.status];
        var statusLabel = { draft: 'Draft', sent: 'Sent', paid: 'Paid' }[inv.status];
        var invNum = 'INV-' + String(inv.id).padStart(4, '0');

        var html = '<div class="eb-invoice-card">';
        html += '<div class="eb-invoice-header">'
            + '<div class="eb-invoice-number">' + invNum + '</div>'
            + '<span class="eb-status-badge ' + statusClass + '">' + statusLabel + '</span></div>';
        html += '<div class="eb-invoice-details-row">'
            + '<div><strong>Bill To:</strong> ' + inv.to + '</div>'
            + '<div><strong>Date:</strong> ' + this.formatDate(inv.createdDate) + '</div>'
            + '<div><strong>Total:</strong> \u{1F40D} ' + inv.total.toFixed(2) + '</div></div>';

        html += '<div class="eb-invoice-items">';
        inv.items.forEach(function(item) {
            html += '<div class="eb-invoice-item-row"><span>' + item.description + '</span>'
                + '<span>\u{1F40D} ' + item.amount.toFixed(2) + '</span></div>';
        });
        html += '</div>';

        html += '<div class="eb-invoice-actions">';
        if (inv.status === 'draft') {
            html += '<button class="eb-btn-sm eb-btn-blue" data-action="send-invoice" data-id="' + inv.id + '">'
                + ElxaIcons.renderAction('send') + ' Send</button>';
        }
        if (inv.status === 'sent') {
            html += '<button class="eb-btn-sm eb-btn-green" data-action="pay-invoice" data-id="' + inv.id + '">'
                + ElxaIcons.renderAction('check') + ' Mark Paid</button>';
        }
        if (inv.status !== 'paid') {
            html += '<button class="eb-btn-sm eb-btn-gray" data-action="delete-invoice" data-id="' + inv.id + '">'
                + ElxaIcons.renderAction('delete') + '</button>';
        }
        if (inv.status === 'paid') {
            html += '<span class="eb-paid-note">' + ElxaIcons.renderAction('check-circle') + ' Paid ' + (inv.paidDate ? this.formatDate(inv.paidDate) : '') + '</span>';
        }
        html += '</div></div>';
        return html;
    }

    // =====================================================================
    //  VIEW: REPORTS
    // =====================================================================
    renderReports(windowId) {
        var el = document.getElementById('eb-reports-' + windowId);
        if (!el) return;

        var balances = this.fin ? this.fin.getAccountBalancesSync() : { checking: 0, savings: 0, trust: 0 };
        var totalBalance = balances.checking + balances.savings + balances.trust;
        var cards = this._getActiveCards();
        var totalCCDebt = cards.reduce(function(s, c) { return s + c.balance; }, 0);
        var loans = this._getActiveLoans();
        var totalLoanDebt = loans.reduce(function(s, l) { return s + l.remainingBalance; }, 0);
        var netWorth = totalBalance - totalCCDebt - totalLoanDebt;

        var bkTotals = this.getAllTimeTotals();
        var byCategory = this.getCategoryBreakdown();

        var recurring = (this.fin && typeof this.fin.getActiveRecurringPayments === 'function') ? this.fin.getActiveRecurringPayments() : [];
        var totalRecurring = recurring.reduce(function(s, r) { return s + r.amount; }, 0);
        var self = this;

        var html = '<div class="eb-page-header"><h2>Reports</h2></div>';

        // Net worth
        html += '<div class="eb-report-section"><div class="eb-section-title">Net Worth</div>';
        html += '<div class="eb-pnl-grid">';
        html += '<div class="eb-pnl-item eb-pnl-income"><div class="eb-pnl-label">Total Assets</div>'
            + '<div class="eb-pnl-value eb-positive">\u{1F40D} ' + self.snk(totalBalance) + '</div></div>';
        html += '<div class="eb-pnl-item eb-pnl-expense"><div class="eb-pnl-label">Total Debt</div>'
            + '<div class="eb-pnl-value eb-negative">\u{1F40D} ' + self.snk(totalCCDebt + totalLoanDebt) + '</div></div>';
        html += '<div class="eb-pnl-item eb-pnl-net"><div class="eb-pnl-label">Net Worth</div>'
            + '<div class="eb-pnl-value ' + (netWorth >= 0 ? 'eb-positive' : 'eb-negative') + '">\u{1F40D} ' + self.snk(netWorth) + '</div></div>';
        html += '</div></div>';

        // Recurring payments
        if (recurring.length > 0) {
            html += '<div class="eb-report-section"><div class="eb-section-title">Monthly Recurring Payments (\u{1F40D} ' + self.snk(totalRecurring) + '/mo)</div>';
            html += '<div class="eb-recurring-list">';
            recurring.forEach(function(r) {
                html += '<div class="eb-recurring-row"><span>' + r.description + '</span>'
                    + '<span>\u{1F40D} ' + self.snk(r.amount) + '/mo</span></div>';
            });
            html += '</div></div>';
        }

        // Business bookkeeping
        html += '<div class="eb-report-section"><div class="eb-section-title">Business Bookkeeping (Manual)</div>';
        html += '<div class="eb-pnl-grid">';
        html += '<div class="eb-pnl-item eb-pnl-income"><div class="eb-pnl-label">Total Income</div>'
            + '<div class="eb-pnl-value eb-positive">\u{1F40D} ' + bkTotals.income.toFixed(2) + '</div></div>';
        html += '<div class="eb-pnl-item eb-pnl-expense"><div class="eb-pnl-label">Total Expenses</div>'
            + '<div class="eb-pnl-value eb-negative">\u{1F40D} ' + bkTotals.expense.toFixed(2) + '</div></div>';
        html += '<div class="eb-pnl-item eb-pnl-net"><div class="eb-pnl-label">Net Profit</div>'
            + '<div class="eb-pnl-value ' + (bkTotals.net >= 0 ? 'eb-positive' : 'eb-negative') + '">\u{1F40D} ' + bkTotals.net.toFixed(2) + '</div></div>';
        html += '</div></div>';

        html += this._renderCategoryReport('Income by Category', byCategory.income, bkTotals.income);
        html += this._renderCategoryReport('Expenses by Category', byCategory.expense, bkTotals.expense);

        el.innerHTML = html;
    }

    _renderCategoryReport(title, categoryData, total) {
        var entries = Object.entries(categoryData).sort(function(a, b) { return b[1] - a[1]; });
        if (entries.length === 0) {
            return '<div class="eb-report-section"><div class="eb-section-title">' + title + '</div><div class="eb-empty">No data yet</div></div>';
        }
        var maxVal = Math.max.apply(null, entries.map(function(e) { return e[1]; }));
        var html = '<div class="eb-report-section"><div class="eb-section-title">' + title + '</div><div class="eb-category-bars">';
        entries.forEach(function(entry) {
            var cat = entry[0], val = entry[1];
            var pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
            var share = total > 0 ? ((val / total) * 100).toFixed(0) : 0;
            html += '<div class="eb-bar-row">'
                + '<div class="eb-bar-label">' + cat + '</div>'
                + '<div class="eb-bar-track"><div class="eb-bar-fill" style="width: ' + pct + '%"></div></div>'
                + '<div class="eb-bar-value">\u{1F40D} ' + val.toFixed(2) + ' (' + share + '%)</div></div>';
        });
        html += '</div></div>';
        return html;
    }

    // =====================================================================
    //  BOOKKEEPING FORMS (Transaction + Invoice)
    // =====================================================================
    showTransactionForm(type, windowId) {
        this._bkTab = 'transactions';
        var el = document.getElementById('eb-bookkeeping-' + windowId);
        if (!el) return;

        var isIncome = type === 'income';
        var categories = isIncome ? this.incomeCategories : this.expenseCategories;
        var today = new Date().toISOString().split('T')[0];

        var html = '<div class="eb-page-header"><h2>' + (isIncome ? 'Record Income' : 'Record Expense') + '</h2></div>';
        html += '<div class="eb-form-card">';
        html += '<div class="eb-form-row"><label class="eb-label">Amount (in snakes \u{1F40D})</label>'
            + '<input type="number" class="eb-input" id="eb-txn-amount-' + windowId + '" placeholder="0.00" step="0.01" min="0"></div>';
        html += '<div class="eb-form-row"><label class="eb-label">Description</label>'
            + '<input type="text" class="eb-input" id="eb-txn-desc-' + windowId + '" placeholder="' + (isIncome ? 'What did you earn money for?' : 'What did you buy?') + '"></div>';
        html += '<div class="eb-form-row"><label class="eb-label">Category</label><select class="eb-input eb-select" id="eb-txn-cat-' + windowId + '">';
        categories.forEach(function(c) { html += '<option value="' + c + '">' + c + '</option>'; });
        html += '</select></div>';
        html += '<div class="eb-form-row"><label class="eb-label">Date</label>'
            + '<input type="date" class="eb-input" id="eb-txn-date-' + windowId + '" value="' + today + '"></div>';
        html += '<input type="hidden" id="eb-txn-type-' + windowId + '" value="' + type + '">';
        html += '<div class="eb-form-actions">'
            + '<button class="eb-btn-sm eb-btn-gray" data-action="cancel-form">Cancel</button>'
            + '<button class="eb-btn-sm ' + (isIncome ? 'eb-btn-green' : 'eb-btn-red') + '" data-action="save-txn">'
            + ElxaIcons.renderAction('check') + ' Save ' + (isIncome ? 'Income' : 'Expense') + '</button></div>';
        html += '</div>';

        el.innerHTML = html;
        var amountInput = el.querySelector('#eb-txn-amount-' + windowId);
        if (amountInput) amountInput.focus();
    }

    saveTransaction(windowId) {
        var container = document.querySelector('.eb-app[data-window-id="' + windowId + '"]');
        if (!container) return;

        var amountEl = container.querySelector('#eb-txn-amount-' + windowId);
        var descEl = container.querySelector('#eb-txn-desc-' + windowId);
        var catEl = container.querySelector('#eb-txn-cat-' + windowId);
        var dateEl = container.querySelector('#eb-txn-date-' + windowId);
        var typeEl = container.querySelector('#eb-txn-type-' + windowId);

        var amount = parseFloat(amountEl ? amountEl.value : 0);
        var desc = descEl ? descEl.value.trim() : '';
        var category = catEl ? catEl.value : '';
        var date = dateEl ? dateEl.value : '';
        var type = typeEl ? typeEl.value : 'expense';

        if (!amount || amount <= 0) {
            ElxaUI.showMessage('Please enter a valid amount!', 'warning');
            return;
        }
        if (!desc) {
            ElxaUI.showMessage('Please add a description!', 'warning');
            return;
        }
        if (type === 'expense' && amount > this.calculateBalance()) {
            ElxaUI.showMessage('Not enough snakes! You only have \u{1F40D} ' + this.calculateBalance().toFixed(2), 'warning');
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
        this.renderBookkeeping(windowId);
        ElxaUI.showMessage(
            type === 'income'
                ? 'Earned \u{1F40D} ' + amount.toFixed(2) + ' \u2014 nice work!'
                : 'Spent \u{1F40D} ' + amount.toFixed(2) + ' on ' + desc,
            type === 'income' ? 'success' : 'info'
        );
    }

    async deleteTransaction(id, windowId) {
        var t = this.data.transactions.find(function(t) { return t.id === id; });
        if (!t) return;

        var confirmed = await ElxaUI.showConfirmDialog(
            'Delete "' + t.description + '" (' + Math.abs(t.amount).toFixed(2) + ' snakes)?',
            'Delete Transaction'
        );
        if (!confirmed) return;

        this.data.transactions = this.data.transactions.filter(function(t) { return t.id !== id; });
        this.saveData();
        this.renderCurrentView(windowId);
        ElxaUI.showMessage('Transaction deleted', 'info');
    }

    showInvoiceForm(windowId) {
        this._bkTab = 'invoices';
        var el = document.getElementById('eb-bookkeeping-' + windowId);
        if (!el) return;

        var html = '<div class="eb-page-header"><h2>Create Invoice</h2></div>';
        html += '<div class="eb-form-card eb-invoice-form">';
        html += '<div class="eb-invoice-form-header">'
            + '<div class="eb-invoice-from">'
            + '<div class="eb-invoice-logo">' + ElxaIcons.render('elxabooks', 'ui') + '</div>'
            + '<div><strong>ElxaCorp</strong><br><span class="eb-subtle">Snakesia\'s Finest Company</span></div></div>'
            + '<div class="eb-invoice-form-number">INVOICE</div></div>';

        html += '<div class="eb-form-row"><label class="eb-label">Bill To</label>'
            + '<select class="eb-input eb-select" id="eb-inv-to-' + windowId + '">';
        this.contacts.forEach(function(c) { html += '<option value="' + c + '">' + c + '</option>'; });
        html += '<option value="custom">Custom...</option></select></div>';

        html += '<div class="eb-form-row" id="eb-inv-custom-row-' + windowId + '" style="display:none;">'
            + '<label class="eb-label">Custom Name</label>'
            + '<input type="text" class="eb-input" id="eb-inv-custom-' + windowId + '" placeholder="Enter name"></div>';

        html += '<div class="eb-section-title">Line Items</div>';
        html += '<div class="eb-line-items" id="eb-inv-items-' + windowId + '">'
            + '<div class="eb-line-item-row">'
            + '<input type="text" class="eb-input eb-line-desc" placeholder="Description (e.g., Lawn mowing)">'
            + '<input type="number" class="eb-input eb-line-amount" placeholder="0.00" step="0.01" min="0">'
            + '<button class="eb-icon-btn" data-action="remove-line-item" title="Remove">' + ElxaIcons.renderAction('close') + '</button>'
            + '</div></div>';

        html += '<button class="eb-btn-sm eb-btn-gray" data-action="add-line-item">' + ElxaIcons.renderAction('plus') + ' Add Line Item</button>';
        html += '<div class="eb-form-actions">'
            + '<button class="eb-btn-sm eb-btn-gray" data-action="cancel-form">Cancel</button>'
            + '<button class="eb-btn-sm eb-btn-blue" data-action="save-invoice">' + ElxaIcons.renderAction('check') + ' Create Invoice</button></div>';
        html += '</div>';

        el.innerHTML = html;

        // Custom contact toggle
        var selectEl = el.querySelector('#eb-inv-to-' + windowId);
        var customRow = el.querySelector('#eb-inv-custom-row-' + windowId);
        if (selectEl && customRow) {
            selectEl.addEventListener('change', function() {
                customRow.style.display = selectEl.value === 'custom' ? 'block' : 'none';
            });
        }
    }

    addInvoiceLineItem(windowId) {
        var container = document.getElementById('eb-inv-items-' + windowId);
        if (!container) return;
        var row = document.createElement('div');
        row.className = 'eb-line-item-row';
        row.innerHTML = '<input type="text" class="eb-input eb-line-desc" placeholder="Description">'
            + '<input type="number" class="eb-input eb-line-amount" placeholder="0.00" step="0.01" min="0">'
            + '<button class="eb-icon-btn" data-action="remove-line-item" title="Remove">' + ElxaIcons.renderAction('close') + '</button>';
        container.appendChild(row);
    }

    saveInvoice(windowId) {
        var container = document.querySelector('.eb-app[data-window-id="' + windowId + '"]');
        if (!container) return;

        var toSelect = container.querySelector('#eb-inv-to-' + windowId);
        var to = toSelect ? toSelect.value : '';
        if (to === 'custom') {
            var customEl = container.querySelector('#eb-inv-custom-' + windowId);
            to = customEl ? customEl.value.trim() : '';
        }
        if (!to) {
            ElxaUI.showMessage('Please select who to bill!', 'warning');
            return;
        }

        var rows = container.querySelectorAll('.eb-line-item-row');
        var items = [];
        rows.forEach(function(row) {
            var descEl = row.querySelector('.eb-line-desc');
            var amtEl = row.querySelector('.eb-line-amount');
            var desc = descEl ? descEl.value.trim() : '';
            var amount = parseFloat(amtEl ? amtEl.value : 0);
            if (desc && amount > 0) items.push({ description: desc, amount: amount });
        });

        if (items.length === 0) {
            ElxaUI.showMessage('Add at least one line item!', 'warning');
            return;
        }

        var total = items.reduce(function(sum, item) { return sum + item.amount; }, 0);
        this.data.invoices.push({
            id: this.data.nextInvoiceId++,
            to: to, items: items, total: total,
            status: 'draft',
            createdDate: new Date().toISOString().split('T')[0],
            paidDate: null
        });

        this.saveData();
        this.renderBookkeeping(windowId);
        ElxaUI.showMessage('Invoice for \u{1F40D} ' + total.toFixed(2) + ' created!', 'success');
    }

    sendInvoice(id, windowId) {
        var inv = this.data.invoices.find(function(i) { return i.id === id; });
        if (!inv) return;
        inv.status = 'sent';
        this.saveData();
        this.renderCurrentView(windowId);
        ElxaUI.showMessage('Invoice sent to ' + inv.to + '!', 'success');
    }

    async markInvoicePaid(id, windowId) {
        var inv = this.data.invoices.find(function(i) { return i.id === id; });
        if (!inv) return;

        var confirmed = await ElxaUI.showConfirmDialog(
            'Mark invoice to ' + inv.to + ' as paid? This will add \u{1F40D} ' + inv.total.toFixed(2) + ' to your income.',
            'Confirm Payment'
        );
        if (!confirmed) return;

        inv.status = 'paid';
        inv.paidDate = new Date().toISOString().split('T')[0];

        this.data.transactions.push({
            id: this.data.nextTransactionId++,
            date: inv.paidDate,
            description: 'Invoice INV-' + String(inv.id).padStart(4, '0') + ' paid by ' + inv.to,
            amount: inv.total,
            type: 'income',
            category: 'Business Sales'
        });

        this.saveData();
        this.renderCurrentView(windowId);
        ElxaUI.showMessage(inv.to + ' paid \u{1F40D} ' + inv.total.toFixed(2) + '!', 'success');
    }

    async deleteInvoice(id, windowId) {
        var inv = this.data.invoices.find(function(i) { return i.id === id; });
        if (!inv) return;
        var confirmed = await ElxaUI.showConfirmDialog('Delete invoice to ' + inv.to + '?', 'Delete Invoice');
        if (!confirmed) return;
        this.data.invoices = this.data.invoices.filter(function(i) { return i.id !== id; });
        this.saveData();
        this.renderCurrentView(windowId);
        ElxaUI.showMessage('Invoice deleted', 'info');
    }

    // =====================================================================
    //  STARTING BALANCE
    // =====================================================================
    async promptStartingBalance(windowId) {
        var result = await ElxaUI.showInputDialog(
            'Enter your starting balance (in snakes):',
            'Set Starting Balance',
            this.data.startingBalance.toString()
        );
        if (result === null) return;
        var amount = parseFloat(result);
        if (isNaN(amount)) {
            ElxaUI.showMessage('Please enter a valid number!', 'warning');
            return;
        }
        this.data.startingBalance = amount;
        this.saveData();
        this.renderCurrentView(windowId);
        ElxaUI.showMessage('Starting balance set to \u{1F40D} ' + amount.toFixed(2), 'success');
    }

    // =====================================================================
    //  CALCULATIONS (Manual Bookkeeping)
    // =====================================================================
    calculateBalance() {
        var txnTotal = this.data.transactions.reduce(function(sum, t) { return sum + t.amount; }, 0);
        return this.data.startingBalance + txnTotal;
    }

    getMonthTotals() {
        var now = new Date();
        var month = now.getMonth();
        var year = now.getFullYear();
        var income = 0, expense = 0, incomeCount = 0, expenseCount = 0;
        this.data.transactions.forEach(function(t) {
            var d = new Date(t.date);
            if (d.getMonth() === month && d.getFullYear() === year) {
                if (t.type === 'income') { income += t.amount; incomeCount++; }
                else { expense += Math.abs(t.amount); expenseCount++; }
            }
        });
        return { income: income, expense: expense, incomeCount: incomeCount, expenseCount: expenseCount };
    }

    getAllTimeTotals() {
        var income = 0, expense = 0;
        this.data.transactions.forEach(function(t) {
            if (t.type === 'income') income += t.amount;
            else expense += Math.abs(t.amount);
        });
        return { income: income, expense: expense, net: income - expense };
    }

    getCategoryBreakdown() {
        var income = {};
        var expense = {};
        this.data.transactions.forEach(function(t) {
            var cat = t.category || 'Other';
            if (t.type === 'income') income[cat] = (income[cat] || 0) + t.amount;
            else expense[cat] = (expense[cat] || 0) + Math.abs(t.amount);
        });
        return { income: income, expense: expense };
    }

    // =====================================================================
    //  PERSISTENCE (Manual bookkeeping data — filesystem/IndexedDB)
    // =====================================================================
    saveData() {
        try {
            var json = JSON.stringify(this.data, null, 2);
            this.fileSystem.createFile(['root', 'System'], 'ElxaBooksPro.json', json);
        } catch (error) {
            console.error('ElxaBooks: Failed to save:', error);
        }
    }

    loadData() {
        try {
            var file = this.fileSystem.getFile(['root', 'System'], 'ElxaBooksPro.json');
            if (!file) {
                file = this.fileSystem.getFile(['root', 'Documents'], 'ElxaBooksPro.json');
                if (file) {
                    this.fileSystem.createFile(['root', 'System'], 'ElxaBooksPro.json', file.content);
                    this.fileSystem.deleteItem(['root', 'Documents'], 'ElxaBooksPro.json');
                }
            }
            if (file && file.content) {
                var loaded = JSON.parse(file.content);
                this.data.startingBalance = loaded.startingBalance || 0;
                this.data.transactions = loaded.transactions || [];
                this.data.invoices = loaded.invoices || [];
                this.data.nextTransactionId = loaded.nextTransactionId || 1;
                this.data.nextInvoiceId = loaded.nextInvoiceId || 1;
                if (this.data.transactions.length > 0) {
                    this.data.nextTransactionId = Math.max(this.data.nextTransactionId, Math.max.apply(null, this.data.transactions.map(function(t) { return t.id; })) + 1);
                }
                if (this.data.invoices.length > 0) {
                    this.data.nextInvoiceId = Math.max(this.data.nextInvoiceId, Math.max.apply(null, this.data.invoices.map(function(i) { return i.id; })) + 1);
                }
            }
        } catch (error) {
            console.error('ElxaBooks: Failed to load:', error);
        }
    }
}
