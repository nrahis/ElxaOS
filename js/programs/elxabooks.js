// =================================
// SIMPLE ELXABOOKS FOR KIDS
// FIXED: Window manager compatibility
// =================================
class ElxaBooksProgram {
    constructor(windowManager, fileSystem, eventBus) {
        this.windowManager = windowManager;
        this.fileSystem = fileSystem;
        this.eventBus = eventBus;
        
        // Simple data structure - start fresh!
        this.data = {
            startingBalance: 0.00, // Manual starting balance
            transactions: []
        };
        
        this.nextId = 1;
    }

    launch() {
        const windowId = `elxabooks-${Date.now()}`;
        const windowContent = this.createInterface(windowId);
        
        const window = this.windowManager.createWindow(
            windowId,
            '💰 ElxaBooks Professional',
            windowContent,
            { width: '600px', height: '500px', x: '100px', y: '100px' }
        );
        
        // Make this instance available globally for event handlers
        if (typeof globalThis !== 'undefined') {
            if (!globalThis.elxaBooks) globalThis.elxaBooks = {};
            globalThis.elxaBooks[windowId] = this;
        } else if (typeof window !== 'undefined') {
            if (!window.elxaBooks) window.elxaBooks = {};
            window.elxaBooks[windowId] = this;
        }
        
        // Try multiple times to set up events until DOM is ready
        this.attemptSetup(windowId, 0);
        
        return windowId;
    }

    attemptSetup(windowId, attempt) {
        const maxAttempts = 10;
        const container = document.querySelector(`[data-window-id="${windowId}"]`);
        
        if (container) {
            console.log(`✅ ElxaBooks DOM found on attempt ${attempt + 1}, setting up events...`);
            this.setupEvents(windowId);
            this.updateDisplay(windowId);
            this.loadData(); // Also load saved data
        } else if (attempt < maxAttempts) {
            console.log(`⏳ ElxaBooks DOM not ready, attempt ${attempt + 1}/${maxAttempts}...`);
            setTimeout(() => {
                this.attemptSetup(windowId, attempt + 1);
            }, 100);
        } else {
            console.error('❌ ElxaBooks failed to find DOM after max attempts');
        }
    }

    createInterface(windowId) {
        return `
            <div class="elxa-books-app" data-window-id="${windowId}">
                <!-- Main Content Area -->
                <div class="elxa-books-content">
                    <!-- Balance Display -->
                    <div class="elxa-books-balance-card">
                        <div class="elxa-books-balance-label">Current Account Balance</div>
                        <div class="elxa-books-balance-amount" id="elxa-balance-${windowId}">${this.calculateCurrentBalance().toFixed(2)}</div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="elxa-books-actions">
                        <button class="elxa-books-btn elxa-books-btn-income" id="elxa-add-income-${windowId}">
                            💚 Record Income
                        </button>
                        <button class="elxa-books-btn elxa-books-btn-expense" id="elxa-add-expense-${windowId}">
                            💸 Record Expense
                        </button>
                    </div>

                    <!-- Management Actions -->
                    <div class="elxa-books-actions">
                        <button class="elxa-books-btn elxa-books-btn-success" id="elxa-set-starting-${windowId}">
                            ⚖️ Set Starting Balance
                        </button>
                        <button class="elxa-books-btn elxa-books-btn-cancel" id="elxa-reset-all-${windowId}">
                            🗑️ Reset Everything
                        </button>
                    </div>

                    <!-- Starting Balance Form (hidden by default) -->
                    <div class="elxa-books-form" id="elxa-starting-form-${windowId}" style="display: none;">
                        <div class="elxa-books-form-title">⚖️ Set Starting Balance</div>
                        <div class="elxa-books-form-row">
                            <label class="elxa-books-label">Starting Balance Amount</label>
                            <input type="number" class="elxa-books-input" id="elxa-starting-amount-${windowId}" placeholder="0.00" step="0.01" value="${this.data.startingBalance.toFixed(2)}">
                        </div>
                        <div class="elxa-books-form-row">
                            <label class="elxa-books-label">Notes (Optional)</label>
                            <input type="text" class="elxa-books-input" id="elxa-starting-desc-${windowId}" placeholder="e.g., Money I had saved up, Birthday money, etc.">
                        </div>
                        <div class="elxa-books-form-buttons">
                            <button class="elxa-books-btn elxa-books-btn-cancel" id="elxa-cancel-starting-${windowId}">Cancel</button>
                            <button class="elxa-books-btn elxa-books-btn-success" id="elxa-save-starting-${windowId}">Update Starting Balance</button>
                        </div>
                    </div>

                    <!-- Income Form (hidden by default) -->
                    <div class="elxa-books-form" id="elxa-income-form-${windowId}" style="display: none;">
                        <div class="elxa-books-form-title">💚 Record New Income</div>
                        <div class="elxa-books-form-row">
                            <label class="elxa-books-label">Income Amount</label>
                            <input type="number" class="elxa-books-input" id="elxa-income-amount-${windowId}" placeholder="0.00" step="0.01" min="0">
                        </div>
                        <div class="elxa-books-form-row">
                            <label class="elxa-books-label">Income Description</label>
                            <input type="text" class="elxa-books-input" id="elxa-income-desc-${windowId}" placeholder="Source of income (e.g., allowance, chores, business earnings)">
                        </div>
                        <div class="elxa-books-form-buttons">
                            <button class="elxa-books-btn elxa-books-btn-cancel" id="elxa-cancel-income-${windowId}">Cancel</button>
                            <button class="elxa-books-btn elxa-books-btn-success" id="elxa-save-income-${windowId}">Save Transaction</button>
                        </div>
                    </div>

                    <!-- Expense Form (hidden by default) -->
                    <div class="elxa-books-form" id="elxa-expense-form-${windowId}" style="display: none;">
                        <div class="elxa-books-form-title">💸 Record New Expense</div>
                        <div class="elxa-books-form-row">
                            <label class="elxa-books-label">Expense Amount</label>
                            <input type="number" class="elxa-books-input" id="elxa-expense-amount-${windowId}" placeholder="0.00" step="0.01" min="0">
                        </div>
                        <div class="elxa-books-form-row">
                            <label class="elxa-books-label">Expense Description</label>
                            <input type="text" class="elxa-books-input" id="elxa-expense-desc-${windowId}" placeholder="What was purchased (e.g., supplies, snacks, equipment)">
                        </div>
                        <div class="elxa-books-form-buttons">
                            <button class="elxa-books-btn elxa-books-btn-cancel" id="elxa-cancel-expense-${windowId}">Cancel</button>
                            <button class="elxa-books-btn elxa-books-btn-success" id="elxa-save-expense-${windowId}">Save Transaction</button>
                        </div>
                    </div>

                    <!-- Transaction History -->
                    <div class="elxa-books-history">
                        <div class="elxa-books-history-title">📊 Transaction History</div>
                        <div class="elxa-books-transaction-header">
                            <div>Date</div>
                            <div>Description</div>
                            <div>Amount</div>
                            <div>Type</div>
                            <div>Action</div>
                        </div>
                        <div class="elxa-books-transaction-list" id="elxa-transactions-${windowId}">
                            <!-- Transactions will be populated here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEvents(windowId) {
        // FIXED: More careful event setup that doesn't interfere with window manager
        console.log('🔧 Setting up ElxaBooks events for window:', windowId);

        // Set up direct event handlers on specific elements only
        this.setupDirectEventHandlers(windowId);
        
        console.log('✅ ElxaBooks events set up successfully for window:', windowId);
    }

    setupDirectEventHandlers(windowId) {
        // FIXED: Only set up events on specific buttons, not the whole container
        const buttonConfigs = [
            { id: `elxa-add-income-${windowId}`, handler: () => this.showIncomeForm(windowId) },
            { id: `elxa-add-expense-${windowId}`, handler: () => this.showExpenseForm(windowId) },
            { id: `elxa-set-starting-${windowId}`, handler: () => this.showStartingForm(windowId) },
            { id: `elxa-reset-all-${windowId}`, handler: () => this.resetEverything(windowId) },
            { id: `elxa-save-income-${windowId}`, handler: () => this.saveIncome(windowId) },
            { id: `elxa-save-expense-${windowId}`, handler: () => this.saveExpense(windowId) },
            { id: `elxa-save-starting-${windowId}`, handler: () => this.saveStartingBalance(windowId) },
            { id: `elxa-cancel-income-${windowId}`, handler: () => this.hideIncomeForm(windowId) },
            { id: `elxa-cancel-expense-${windowId}`, handler: () => this.hideExpenseForm(windowId) },
            { id: `elxa-cancel-starting-${windowId}`, handler: () => this.hideStartingForm(windowId) }
        ];

        buttonConfigs.forEach(config => {
            const element = document.getElementById(config.id);
            if (element) {
                // FIXED: Use addEventListener instead of onclick for better control
                element.addEventListener('click', (e) => {
                    // Only prevent default and stop propagation for our specific app events
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔘 Button clicked:', config.id);
                    config.handler();
                });
                console.log('✅ Event handler set for:', config.id);
            } else {
                console.warn('⚠️ Button not found:', config.id);
            }
        });

        // Set up delete button handlers (they get added dynamically)
        this.setupDeleteButtonHandlers(windowId);
    }

    setupDeleteButtonHandlers(windowId) {
        // FIXED: More targeted approach for delete buttons
        setTimeout(() => {
            const transactionList = document.getElementById(`elxa-transactions-${windowId}`);
            if (transactionList) {
                // Use event delegation, but only within the transaction list
                transactionList.addEventListener('click', (e) => {
                    if (e.target.classList.contains('elxa-books-btn-delete')) {
                        e.preventDefault();
                        e.stopPropagation();
                        const transactionId = parseInt(e.target.dataset.transactionId);
                        console.log('🗑️ Delete transaction clicked:', transactionId);
                        this.deleteTransaction(transactionId, windowId);
                    }
                });
                console.log('✅ Delete button handlers set up');
            }
        }, 100);
    }

    showIncomeForm(windowId) {
        console.log('💚 Showing income form for window:', windowId);
        this.hideAllForms(windowId);
        const form = document.getElementById(`elxa-income-form-${windowId}`);
        if (form) {
            form.style.display = 'block';
            // Clear form
            const amountInput = document.getElementById(`elxa-income-amount-${windowId}`);
            const descInput = document.getElementById(`elxa-income-desc-${windowId}`);
            if (amountInput) amountInput.value = '';
            if (descInput) descInput.value = '';
            // Focus on amount input
            if (amountInput) amountInput.focus();
            console.log('✅ Income form shown and cleared');
        } else {
            console.error('❌ Income form not found:', `elxa-income-form-${windowId}`);
        }
    }

    showExpenseForm(windowId) {
        console.log('💸 Showing expense form for window:', windowId);
        this.hideAllForms(windowId);
        const form = document.getElementById(`elxa-expense-form-${windowId}`);
        if (form) {
            form.style.display = 'block';
            // Clear form
            const amountInput = document.getElementById(`elxa-expense-amount-${windowId}`);
            const descInput = document.getElementById(`elxa-expense-desc-${windowId}`);
            if (amountInput) amountInput.value = '';
            if (descInput) descInput.value = '';
            // Focus on amount input
            if (amountInput) amountInput.focus();
            console.log('✅ Expense form shown and cleared');
        } else {
            console.error('❌ Expense form not found:', `elxa-expense-form-${windowId}`);
        }
    }

    showStartingForm(windowId) {
        console.log('⚖️ Showing starting balance form for window:', windowId);
        this.hideAllForms(windowId);
        const form = document.getElementById(`elxa-starting-form-${windowId}`);
        if (form) {
            form.style.display = 'block';
            // Pre-fill with current starting balance
            const amountInput = document.getElementById(`elxa-starting-amount-${windowId}`);
            const descInput = document.getElementById(`elxa-starting-desc-${windowId}`);
            if (amountInput) amountInput.value = this.data.startingBalance.toFixed(2);
            if (descInput) descInput.value = '';
            // Focus on amount input
            if (amountInput) amountInput.focus();
            console.log('✅ Starting balance form shown');
        } else {
            console.error('❌ Starting balance form not found:', `elxa-starting-form-${windowId}`);
        }
    }

    hideAllForms(windowId) {
        const forms = [
            `elxa-income-form-${windowId}`,
            `elxa-expense-form-${windowId}`,
            `elxa-starting-form-${windowId}`
        ];
        
        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (form) {
                form.style.display = 'none';
            }
        });
        console.log('🙈 All forms hidden');
    }

    hideIncomeForm(windowId) {
        const form = document.getElementById(`elxa-income-form-${windowId}`);
        if (form) {
            form.style.display = 'none';
            console.log('🙈 Income form hidden');
        }
    }

    hideExpenseForm(windowId) {
        const form = document.getElementById(`elxa-expense-form-${windowId}`);
        if (form) {
            form.style.display = 'none';
            console.log('🙈 Expense form hidden');
        }
    }

    hideStartingForm(windowId) {
        const form = document.getElementById(`elxa-starting-form-${windowId}`);
        if (form) {
            form.style.display = 'none';
            console.log('🙈 Starting balance form hidden');
        }
    }

    calculateCurrentBalance() {
        // Calculate balance from starting balance + all transactions
        const transactionTotal = this.data.transactions.reduce((total, transaction) => {
            return total + transaction.amount;
        }, 0);
        
        return this.data.startingBalance + transactionTotal;
    }

    resetEverything(windowId) {
        console.log('🗑️ Resetting everything for window:', windowId);
        
        if (!confirm('Are you sure you want to delete ALL transactions and reset everything to zero? This cannot be undone!')) {
            return;
        }
        
        // Reset all data
        this.data.startingBalance = 0.00;
        this.data.transactions = [];
        this.nextId = 1;
        
        // Also clear any saved data to prevent old transactions from reappearing
        this.clearSavedData();
        
        console.log('✅ Everything reset to zero');
        
        this.hideAllForms(windowId);
        this.updateDisplay(windowId);
        this.saveData(); // Save the empty state
        
        this.showMessage('Everything has been reset! Starting fresh! 🆕', 'success');
    }

    saveStartingBalance(windowId) {
        console.log('⚖️ Saving starting balance for window:', windowId);
        
        const amountInput = document.getElementById(`elxa-starting-amount-${windowId}`);
        const descInput = document.getElementById(`elxa-starting-desc-${windowId}`);
        
        if (!amountInput || !descInput) {
            console.error('❌ Input elements not found');
            alert('Form elements not found! Please try again.');
            return;
        }
        
        const amount = parseFloat(amountInput.value);
        const description = descInput.value.trim();
        
        console.log('📊 Starting balance data:', { amount, description });
        
        if (isNaN(amount)) {
            alert('Please enter a valid amount!');
            amountInput.focus();
            return;
        }
        
        // Update starting balance
        this.data.startingBalance = amount;
        
        // If there's a description, add it as a special transaction for reference
        if (description) {
            const transaction = {
                id: this.nextId++,
                date: new Date().toISOString().split('T')[0],
                description: `Starting Balance: ${description}`,
                amount: 0, // This doesn't affect balance since it's already in startingBalance
                type: 'starting',
                isStartingNote: true
            };
            
            this.data.transactions.unshift(transaction); // Add to beginning
        }
        
        console.log('✅ Starting balance updated:', this.data.startingBalance);
        
        this.hideStartingForm(windowId);
        this.updateDisplay(windowId);
        this.saveData();
        
        this.showMessage(`Starting balance set to ${amount.toFixed(2)}! 💰`, 'success');
    }

    saveIncome(windowId) {
        console.log('💰 Saving income for window:', windowId);
        
        const amountInput = document.getElementById(`elxa-income-amount-${windowId}`);
        const descInput = document.getElementById(`elxa-income-desc-${windowId}`);
        
        if (!amountInput || !descInput) {
            console.error('❌ Input elements not found');
            alert('Form elements not found! Please try again.');
            return;
        }
        
        const amount = parseFloat(amountInput.value);
        const description = descInput.value.trim();
        
        console.log('📊 Income data:', { amount, description });
        
        if (!amount || amount <= 0) {
            alert('Please enter a valid amount!');
            amountInput.focus();
            return;
        }
        
        if (!description) {
            alert('Please tell us what you did to earn the money!');
            descInput.focus();
            return;
        }

        // Add transaction
        const transaction = {
            id: this.nextId++,
            date: new Date().toISOString().split('T')[0],
            description: description,
            amount: amount,
            type: 'income'
        };
        
        this.data.transactions.push(transaction);
        
        console.log('✅ Income transaction added:', transaction);
        console.log('💰 New balance:', this.calculateCurrentBalance());
        
        this.hideIncomeForm(windowId);
        this.updateDisplay(windowId);
        this.saveData();
        
        this.showMessage(`Great! You earned ${amount.toFixed(2)}! 💰`, 'success');
    }

    saveExpense(windowId) {
        console.log('💸 Saving expense for window:', windowId);
        
        const amountInput = document.getElementById(`elxa-expense-amount-${windowId}`);
        const descInput = document.getElementById(`elxa-expense-desc-${windowId}`);
        
        if (!amountInput || !descInput) {
            console.error('❌ Input elements not found');
            alert('Form elements not found! Please try again.');
            return;
        }
        
        const amount = parseFloat(amountInput.value);
        const description = descInput.value.trim();
        
        console.log('📊 Expense data:', { amount, description });
        
        if (!amount || amount <= 0) {
            alert('Please enter a valid amount!');
            amountInput.focus();
            return;
        }
        
        if (!description) {
            alert('Please tell us what you bought!');
            descInput.focus();
            return;
        }

        const currentBalance = this.calculateCurrentBalance();
        if (amount > currentBalance) {
            alert(`You don't have enough money! You only have ${currentBalance.toFixed(2)}`);
            return;
        }

        // Add transaction
        const transaction = {
            id: this.nextId++,
            date: new Date().toISOString().split('T')[0],
            description: description,
            amount: -amount, // Negative for expenses
            type: 'expense'
        };
        
        this.data.transactions.push(transaction);
        
        console.log('✅ Expense transaction added:', transaction);
        console.log('💰 New balance:', this.calculateCurrentBalance());
        
        this.hideExpenseForm(windowId);
        this.updateDisplay(windowId);
        this.saveData();
        
        this.showMessage(`You spent ${amount.toFixed(2)} on ${description}! 💸`, 'info');
    }

    deleteTransaction(transactionId, windowId) {
        console.log('🗑️ Deleting transaction:', transactionId);
        
        const transaction = this.data.transactions.find(t => t.id === transactionId);
        if (!transaction) {
            console.error('❌ Transaction not found:', transactionId);
            return;
        }

        // Confirm deletion
        if (!confirm(`Delete this transaction: ${transaction.description}?`)) {
            return;
        }

        // Remove from transactions
        this.data.transactions = this.data.transactions.filter(t => t.id !== transactionId);
        
        console.log('✅ Transaction deleted, new balance:', this.calculateCurrentBalance());
        
        this.updateDisplay(windowId);
        this.saveData();
        
        this.showMessage('Transaction deleted! 🗑️', 'info');
    }

    updateDisplay(windowId) {
        console.log('🔄 Updating display for window:', windowId);
        
        // Update balance using calculated value
        const currentBalance = this.calculateCurrentBalance();
        const balanceEl = document.getElementById(`elxa-balance-${windowId}`);
        if (balanceEl) {
            balanceEl.textContent = `${currentBalance.toFixed(2)}`;
            balanceEl.className = `elxa-books-balance-amount ${currentBalance >= 0 ? 'elxa-books-positive' : 'elxa-books-negative'}`;
            console.log('✅ Balance updated:', currentBalance);
        } else {
            console.error('❌ Balance element not found');
        }

        // Update transaction list
        this.updateTransactionList(windowId);
    }

    updateTransactionList(windowId) {
        const listEl = document.getElementById(`elxa-transactions-${windowId}`);
        if (!listEl) {
            console.error('❌ Transaction list element not found');
            return;
        }

        console.log('📋 Updating transaction list, count:', this.data.transactions.length);

        // Sort transactions by date (newest first)
        const sortedTransactions = [...this.data.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

        if (sortedTransactions.length === 0) {
            listEl.innerHTML = '<div class="elxa-books-no-transactions">No transactions yet! Add your first one above! 😊</div>';
            return;
        }

        listEl.innerHTML = sortedTransactions.map(t => {
            const typeEmoji = t.type === 'income' ? '💚' : 
                             t.type === 'expense' ? '💸' : 
                             t.type === 'starting' ? '⚖️' : '❓';
            
            const showDeleteButton = !t.isStartingNote; // Don't show delete for starting balance notes
            
            return `
                <div class="elxa-books-transaction ${t.type}">
                    <div class="elxa-books-transaction-date">${this.formatDate(t.date)}</div>
                    <div class="elxa-books-transaction-desc">${t.description}</div>
                    <div class="elxa-books-transaction-amount ${t.amount >= 0 ? 'elxa-books-positive' : 'elxa-books-negative'}">
                        ${t.amount === 0 ? '—' : (t.amount >= 0 ? '+' : '') + t.amount.toFixed(2)}
                    </div>
                    <div class="elxa-books-transaction-type">${typeEmoji}</div>
                    <div class="elxa-books-transaction-delete">
                        ${showDeleteButton ? `<button class="elxa-books-btn-delete" data-transaction-id="${t.id}">🗑️</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        // Set up delete button handlers for the new content
        this.setupDeleteButtonHandlers(windowId);
        
        console.log('✅ Transaction list updated');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    saveData() {
        try {
            // Create a clean copy of data to save
            const dataToSave = {
                startingBalance: this.data.startingBalance,
                transactions: this.data.transactions,
                nextId: this.nextId,
                lastSaved: new Date().toISOString()
            };
            
            const dataString = JSON.stringify(dataToSave, null, 2);
            this.fileSystem.createFile(['root', 'Documents'], 'MyMoneyTracker.json', dataString);
            console.log('💾 Money tracker data saved');
        } catch (error) {
            console.error('❌ Failed to save data:', error);
        }
    }

    loadData() {
        try {
            const file = this.fileSystem.getFile(['root', 'Documents'], 'MyMoneyTracker.json');
            if (file && file.content) {
                const loadedData = JSON.parse(file.content);
                
                // Merge loaded data with defaults
                this.data.startingBalance = loadedData.startingBalance || 0.00;
                this.data.transactions = loadedData.transactions || [];
                this.nextId = loadedData.nextId || 1;
                
                // Update next ID to be safe
                if (this.data.transactions.length > 0) {
                    this.nextId = Math.max(this.nextId, Math.max(...this.data.transactions.map(t => t.id)) + 1);
                }
                
                console.log('📂 Money tracker data loaded, balance:', this.calculateCurrentBalance());
            } else {
                console.log('📂 No saved data found, starting fresh');
            }
        } catch (error) {
            console.error('❌ Failed to load data:', error);
            console.log('🆕 Starting with fresh data due to load error');
        }
    }

    clearSavedData() {
        try {
            // Try to delete the saved file
            this.fileSystem.deleteFile(['root', 'Documents'], 'MyMoneyTracker.json');
            console.log('🗑️ Saved data file deleted');
        } catch (error) {
            console.log('ℹ️ No saved data file to delete or deletion failed');
        }
    }

    showMessage(text, type = 'info') {
        const message = document.createElement('div');
        message.className = `elxa-books-message elxa-books-message-${type}`;
        message.textContent = text;
        
        message.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${type === 'success' ? '#d4edda' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : '#0c5460'};
            padding: 12px 16px;
            border: 2px solid ${type === 'success' ? '#c3e6cb' : '#bee5eb'};
            border-radius: 8px;
            z-index: 50; /* FIXED: Lower z-index to not interfere with window controls */
            font-weight: bold;
            font-size: 12px;
            max-width: 300px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            pointer-events: none;
        `;

        document.body.appendChild(message);

        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 3000);
    }

    // Debug method - can be called from console
    debug(windowId) {
        console.log('🐛 ElxaBooks Debug Info:');
        console.log('Window ID:', windowId);
        console.log('Current Data:', this.data);
        
        const container = document.querySelector(`[data-window-id="${windowId}"]`);
        console.log('Container found:', !!container);
        
        if (container) {
            const buttons = container.querySelectorAll('button');
            console.log('Buttons found:', buttons.length);
            buttons.forEach((btn, i) => {
                console.log(`Button ${i}:`, btn.id, btn.textContent.trim());
            });
        }
        
        return {
            windowId,
            data: this.data,
            containerExists: !!container,
            buttonCount: container ? container.querySelectorAll('button').length : 0
        };
    }
}