// =================================
// FIRST SNAKESIAN BANK — Transaction Forms & Processing
// Adds transaction UI and processing methods to BankSystem
// =================================

// --- TRANSACTION FORMS ---

BankSystem.prototype.showDepositForm = function() {
    this.hideTransactionForms();
    var form = document.getElementById('depositForm');
    if (form) {
        form.classList.remove('hidden');
        setTimeout(function() { var el = document.getElementById('depositAmount'); if (el) el.focus(); }, 100);
    }
};

BankSystem.prototype.showWithdrawForm = function() {
    this.hideTransactionForms();
    var form = document.getElementById('withdrawForm');
    if (form) {
        form.classList.remove('hidden');
        setTimeout(function() { var el = document.getElementById('withdrawAmount'); if (el) el.focus(); }, 100);
    }
};

BankSystem.prototype.showTransferForm = function() {
    this.hideTransactionForms();
    var form = document.getElementById('transferForm');
    if (form) {
        form.classList.remove('hidden');
        setTimeout(function() { var el = document.getElementById('transferAmount'); if (el) el.focus(); }, 100);
    }
};

BankSystem.prototype.showTrustForm = function() {
    this.hideTransactionForms();
    var form = document.getElementById('trustForm');
    if (form) {
        form.classList.remove('hidden');
        this.updateTrustFormFields();
        setTimeout(function() { var el = document.getElementById('trustPassword'); if (el) el.focus(); }, 100);
    }
};

BankSystem.prototype.updateTrustFormFields = function() {
    var action = document.getElementById('trustAction').value;
    var otherAccountDiv = document.getElementById('trustOtherAccount');
    if (!otherAccountDiv) return;

    if (action === 'deposit' || action === 'withdraw') {
        otherAccountDiv.classList.add('hidden');
    } else {
        otherAccountDiv.classList.remove('hidden');
    }
};

BankSystem.prototype.hideTransactionForms = function() {
    var forms = ['depositForm', 'withdrawForm', 'transferForm', 'trustForm', 'cardPaymentSection'];
    forms.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
};

// --- TRANSACTION PROCESSING ---

BankSystem.prototype.processDeposit = function() {
    var account = document.getElementById('depositAccount').value;
    var amount = parseFloat(document.getElementById('depositAmount').value);

    if (!amount || amount <= 0) {
        this.showError('Please enter a valid amount.');
        return;
    }

    if (typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService.isReady()) {
        var result = elxaOS.financeService.depositSync(account, amount, 'Deposit to ' + account + ' account');
        if (!result.success) {
            this.showError(result.message);
            return;
        }
        this._syncFromFinanceService();
    } else {
        this.accounts[account].balance += amount;
        this.addTransaction('deposit', account, amount, 'Deposit to ' + account + ' account');
        this.saveCurrentUser();
    }

    this.updateAccountDisplay();
    this.updateTransactionHistory();
    this.hideTransactionForms();
    this.showSuccess('Successfully deposited $' + amount.toFixed(2) + ' to your ' + account + ' account.');
    document.getElementById('depositAmount').value = '';
};

BankSystem.prototype.processWithdraw = function() {
    var account = document.getElementById('withdrawAccount').value;
    var amount = parseFloat(document.getElementById('withdrawAmount').value);

    if (!amount || amount <= 0) {
        this.showError('Please enter a valid amount.');
        return;
    }

    if (typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService.isReady()) {
        var result = elxaOS.financeService.withdrawSync(account, amount, 'Withdrawal from ' + account + ' account');
        if (!result.success) {
            this.showError(result.message);
            return;
        }
        this._syncFromFinanceService();
    } else {
        if (this.accounts[account].balance < amount) {
            this.showError('Insufficient funds for this withdrawal.');
            return;
        }
        this.accounts[account].balance -= amount;
        this.addTransaction('withdrawal', account, -amount, 'Withdrawal from ' + account + ' account');
        this.saveCurrentUser();
    }

    this.updateAccountDisplay();
    this.updateTransactionHistory();
    this.hideTransactionForms();
    this.showSuccess('Successfully withdrew $' + amount.toFixed(2) + ' from your ' + account + ' account.');
    document.getElementById('withdrawAmount').value = '';
};

BankSystem.prototype.processTransfer = function() {
    var fromAccount = document.getElementById('transferFrom').value;
    var toAccount = document.getElementById('transferTo').value;
    var amount = parseFloat(document.getElementById('transferAmount').value);

    if (!amount || amount <= 0) {
        this.showError('Please enter a valid amount.');
        return;
    }
    if (fromAccount === toAccount) {
        this.showError('Cannot transfer to the same account.');
        return;
    }

    if (typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService.isReady()) {
        var result = elxaOS.financeService.transferSync(fromAccount, toAccount, amount);
        if (!result.success) {
            this.showError(result.message);
            return;
        }
        this._syncFromFinanceService();
    } else {
        if (this.accounts[fromAccount].balance < amount) {
            this.showError('Insufficient funds for this transfer.');
            return;
        }
        this.accounts[fromAccount].balance -= amount;
        this.accounts[toAccount].balance += amount;
        this.addTransaction('transfer', fromAccount, -amount, 'Transfer to ' + toAccount + ' account');
        this.addTransaction('transfer', toAccount, amount, 'Transfer from ' + fromAccount + ' account');
        this.saveCurrentUser();
    }

    this.updateAccountDisplay();
    this.updateTransactionHistory();
    this.hideTransactionForms();
    this.showSuccess('Successfully transferred $' + amount.toFixed(2) + ' from ' + fromAccount + ' to ' + toAccount + '.');
    document.getElementById('transferAmount').value = '';
};

BankSystem.prototype.processTrustTransaction = function() {
    var password = document.getElementById('trustPassword').value;
    var action = document.getElementById('trustAction').value;
    var amount = parseFloat(document.getElementById('trustAmount').value);
    var memo = document.getElementById('trustMemo').value.trim() || 'Trust account transaction';

    if (password !== this.bankerPassword) {
        this.showError('Invalid banker password. Only authorized personnel can manage trust accounts.');
        return;
    }
    if (!amount || amount <= 0) {
        this.showError('Please enter a valid amount.');
        return;
    }

    var otherAccount = null;
    if (action === 'transfer-to' || action === 'transfer-from') {
        otherAccount = document.getElementById('trustOtherSelect').value;
    }

    var useFinance = typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService.isReady();

    switch (action) {
        case 'deposit':
            if (useFinance) {
                var result = elxaOS.financeService.depositSync('trust', amount, 'Trust Account: ' + memo);
                if (!result.success) { this.showError(result.message); return; }
                this._syncFromFinanceService();
            } else {
                this.accounts.trust.balance += amount;
                this.addTransaction('trust-deposit', 'trust', amount, 'Trust Account: ' + memo);
                this.saveCurrentUser();
            }
            this.showSuccess('Successfully deposited $' + amount.toFixed(2) + ' to Trust Account.');
            break;

        case 'withdraw':
            if (useFinance) {
                var result = elxaOS.financeService.withdrawSync('trust', amount, 'Trust Account: ' + memo);
                if (!result.success) { this.showError(result.message); return; }
                this._syncFromFinanceService();
            } else {
                if (this.accounts.trust.balance < amount) {
                    this.showError('Insufficient funds in Trust Account.');
                    return;
                }
                this.accounts.trust.balance -= amount;
                this.addTransaction('trust-withdrawal', 'trust', -amount, 'Trust Account: ' + memo);
                this.saveCurrentUser();
            }
            this.showSuccess('Successfully withdrew $' + amount.toFixed(2) + ' from Trust Account.');
            break;

        case 'transfer-to':
            if (useFinance) {
                var result = elxaOS.financeService.transferSync(otherAccount, 'trust', amount, 'Trust transfer: ' + memo);
                if (!result.success) { this.showError(result.message); return; }
                this._syncFromFinanceService();
            } else {
                if (this.accounts[otherAccount].balance < amount) {
                    this.showError('Insufficient funds in ' + otherAccount + ' account.');
                    return;
                }
                this.accounts[otherAccount].balance -= amount;
                this.accounts.trust.balance += amount;
                this.addTransaction('trust-transfer', otherAccount, -amount, 'Transfer to Trust Account: ' + memo);
                this.addTransaction('trust-transfer', 'trust', amount, 'Transfer from ' + otherAccount + ': ' + memo);
                this.saveCurrentUser();
            }
            this.showSuccess('Successfully transferred $' + amount.toFixed(2) + ' from ' + otherAccount + ' to Trust Account.');
            break;

        case 'transfer-from':
            if (useFinance) {
                var result = elxaOS.financeService.transferSync('trust', otherAccount, amount, 'Trust transfer: ' + memo);
                if (!result.success) { this.showError(result.message); return; }
                this._syncFromFinanceService();
            } else {
                if (this.accounts.trust.balance < amount) {
                    this.showError('Insufficient funds in Trust Account.');
                    return;
                }
                this.accounts.trust.balance -= amount;
                this.accounts[otherAccount].balance += amount;
                this.addTransaction('trust-transfer', 'trust', -amount, 'Transfer to ' + otherAccount + ': ' + memo);
                this.addTransaction('trust-transfer', otherAccount, amount, 'Transfer from Trust Account: ' + memo);
                this.saveCurrentUser();
            }
            this.showSuccess('Successfully transferred $' + amount.toFixed(2) + ' from Trust Account to ' + otherAccount + '.');
            break;
    }

    this.updateAccountDisplay();
    this.updateTransactionHistory();
    this.hideTransactionForms();
    document.getElementById('trustPassword').value = '';
    document.getElementById('trustAmount').value = '';
    document.getElementById('trustMemo').value = '';
};