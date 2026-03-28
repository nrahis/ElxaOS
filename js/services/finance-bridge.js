// =================================
// FINANCE SERVICE — Bank Bridge, Context API & Debug
// Synchronous bridge methods for bank-system.js, LLM context, debug tools
// =================================

// =================================
// BANK WEBSITE BRIDGE
// =================================

FinanceService.prototype.getAccountBalancesSync = function() {
    if (!this._data) return { checking: 0, savings: 0, trust: 0 };
    return {
        checking: this._data.accounts.checking.balance,
        savings: this._data.accounts.savings.balance,
        trust: this._data.accounts.trust.balance
    };
};

FinanceService.prototype.checkFundsSync = function(amount, accountType) {
    if (!accountType) accountType = 'checking';
    if (!this._data || !this._data.accounts[accountType]) {
        return { hasEnough: false, balance: 0, accountType: accountType };
    }
    return {
        hasEnough: this._data.accounts[accountType].balance >= amount,
        balance: this._data.accounts[accountType].balance,
        accountType: accountType
    };
};

FinanceService.prototype.processPaymentSync = function(amount, description, accountType) {
    if (!accountType) accountType = 'checking';
    if (!this._data) {
        return { success: false, message: 'Finance service not ready.' };
    }
    if (!this._data.accounts[accountType]) {
        return { success: false, message: `Invalid account type: ${accountType}` };
    }

    if (accountType === 'trust') {
        if (!description || !description.includes('[TRUST_AUTHORIZED]')) {
            return { success: false, message: 'Trust account payments require special authorization.' };
        }
        description = description.replace('[TRUST_AUTHORIZED]', '').trim();
    }

    if (this._data.accounts[accountType].balance < amount) {
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
        description: description || 'Online purchase'
    });

    this._save();

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
        message: `Payment of $${amount.toFixed(2)} processed successfully from ${accountType} account.`,
        remainingBalance: this._data.accounts[accountType].balance,
        accountUsed: accountType
    };
};

FinanceService.prototype.depositSync = function(accountType, amount, description) {
    if (!description) description = 'Deposit';
    if (!this._data) {
        return { success: false, message: 'Finance service not ready.' };
    }
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

    this._save();

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
};

FinanceService.prototype.withdrawSync = function(accountType, amount, description) {
    if (!description) description = 'Withdrawal';
    if (!this._data) {
        return { success: false, message: 'Finance service not ready.' };
    }
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

    this._save();

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
};

FinanceService.prototype.transferSync = function(fromAccount, toAccount, amount, description) {
    if (!this._data) {
        return { success: false, message: 'Finance service not ready.' };
    }
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

    this._save();

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
        message: `Transferred $${amount.toFixed(2)} from ${fromAccount} to ${toAccount}.`,
        fromBalance: this._data.accounts[fromAccount].balance,
        toBalance: this._data.accounts[toAccount].balance
    };
};

// =================================
// CONTEXT API (for LLM services)
// =================================

FinanceService.prototype.getFinancialSummary = async function() {
    await this._ensureReady();

    const a = this._data.accounts;
    const snakes = (usd) => (usd * this.exchangeRate).toFixed(0);
    const recentTxns = this._data.transactions.slice(0, 5);

    let summary = 'Financial Status: ';
    summary += `Checking: $${a.checking.balance.toFixed(2)} (${snakes(a.checking.balance)} snakes), `;
    summary += `Savings: $${a.savings.balance.toFixed(2)} (${snakes(a.savings.balance)} snakes), `;
    summary += `Trust: $${a.trust.balance.toFixed(2)} (${snakes(a.trust.balance)} snakes). `;

    const total = a.checking.balance + a.savings.balance + a.trust.balance;
    summary += `Total net worth: $${total.toFixed(2)} (${snakes(total)} snakes). `;

    // Credit score
    const cs = this._data.creditScore;
    if (cs) {
        const bracket = this._getScoreBracket(cs.score);
        summary += `Credit score: ${cs.score} (${bracket.rating}). `;
        const trend = this.getScoreTrendSync();
        if (trend === 'up') summary += 'Score is trending upward. ';
        else if (trend === 'down') summary += 'Score is trending downward. ';
    }

    // Credit cards
    const activeCards = (this._data.creditCards || []).filter(c => c.status === 'active');
    if (activeCards.length > 0) {
        const totalOwed = activeCards.reduce((s, c) => s + c.balance, 0);
        summary += `Credit cards: ${activeCards.length} active, total owed: $${totalOwed.toFixed(2)}. `;
        activeCards.forEach(c => {
            const pct = c.creditLimit > 0 ? Math.round((c.balance / c.creditLimit) * 100) : 0;
            summary += `${c.name} (****${c.last4}): $${c.balance.toFixed(2)}/$${c.creditLimit.toFixed(2)} (${pct}% used). `;
        });
    } else {
        summary += 'No credit cards. ';
    }

    if (recentTxns.length > 0) {
        summary += 'Recent activity: ';
        summary += recentTxns.map(t => {
            const sign = t.amount >= 0 ? '+' : '';
            return `${t.description} (${sign}$${t.amount.toFixed(2)})`;
        }).join('; ');
        summary += '.';
    }

    return summary;
};

// =================================
// DEBUG TOOLS
// =================================

Object.defineProperty(FinanceService.prototype, 'debug', {
    get: function() {
        const self = this;
        return {
            dump() {
                console.group('\u{1f4b0} FinanceService Debug');
                console.log('Ready:', self._ready);
                console.log('Accounts:', self._data?.accounts);
                console.log('Credit cards:', self._data?.creditCards?.length || 0);
                if (self._data?.creditCards?.length) {
                    self._data.creditCards.forEach(c => console.log(`  ${c.name} ****${c.last4}: bal=$${c.balance}, limit=$${c.creditLimit}, tier=${c.tier}, status=${c.status}`));
                }
                console.log('Credit score:', self._data?.creditScore?.score, '(' + self._getScoreBracket(self._data?.creditScore?.score || 500).rating + ')');
                console.log('Score history:', self._data?.creditScore?.history);
                console.log('Hard inquiries this month:', self._data?.creditScore?.hardInquiries || 0);
                console.log('Transactions:', self._data?.transactions?.length, 'total');
                console.log('Last 5:', self._data?.transactions?.slice(0, 5));
                console.log('Last processed date:', self._data?.lastProcessedDate);
                console.groupEnd();
            },

            async setBalance(account, amount) {
                await self._ensureReady();
                if (!self._data.accounts[account]) {
                    console.error('Unknown account: ' + account);
                    return;
                }
                const old = self._data.accounts[account].balance;
                self._data.accounts[account].balance = amount;
                self._addTransaction({
                    type: 'debug-adjustment',
                    account,
                    amount: amount - old,
                    description: '[DEBUG] Balance set from $' + old.toFixed(2) + ' to $' + amount.toFixed(2)
                });
                await self._save();
                self.eventBus.emit('finance.accountUpdated', { account, newBalance: amount });
                console.log('\u{1f4b0} [DEBUG] ' + account + ' balance: $' + old.toFixed(2) + ' -> $' + amount.toFixed(2));
            },

            async resetFinance() {
                self._data = self._createDefaultFinanceData();
                await self._save();
                console.log('\u{1f4b0} [DEBUG] Finance data reset to defaults');
            },

            async addMoney(amount) {
                if (amount === undefined) amount = 1000;
                await self.deposit('checking', amount, '[DEBUG] Test deposit');
                console.log('\u{1f4b0} [DEBUG] Added $' + amount + ' to checking');
            },

            async addCreditCard(name, limit) {
                const result = await self.createCreditCard({
                    name: name || 'Snakesian Gold Card',
                    creditLimit: limit || 500
                });
                console.log('\u{1f4b3} [DEBUG]', result.message);
                return result;
            },

            listCards() {
                const cards = self.getCreditCardsSync();
                console.group('\u{1f4b3} Credit Cards');
                if (cards.length === 0) {
                    console.log('No credit cards.');
                } else {
                    cards.forEach(c => {
                        const used = c.balance;
                        const avail = c.creditLimit - c.balance;
                        console.log(c.name + ' (****' + c.last4 + ') \u2014 Balance: $' + used.toFixed(2) + ' / Limit: $' + c.creditLimit.toFixed(2) + ' / Available: $' + avail.toFixed(2) + ' [' + c.status + '] tier=' + (c.tier || 'none'));
                    });
                }
                console.groupEnd();
                return cards;
            },

            async setScore(score) {
                await self._ensureReady();
                if (!self._data.creditScore) self._data.creditScore = self._createDefaultCreditScore();
                const old = self._data.creditScore.score;
                self._data.creditScore.score = Math.max(300, Math.min(850, score));
                self._data.creditScore.lastUpdated = new Date().toISOString();
                await self._save();
                const bracket = self._getScoreBracket(self._data.creditScore.score);
                console.log('\u{1f4ca} [DEBUG] Credit score: ' + old + ' -> ' + self._data.creditScore.score + ' (' + bracket.rating + ')');
            },

            async adjustScore(delta, reason) {
                await self._ensureReady();
                self._adjustScore(delta, reason || '[DEBUG] Manual adjustment');
                await self._save();
                console.log('\u{1f4ca} [DEBUG] Credit score adjusted by ' + (delta >= 0 ? '+' : '') + delta + ' -> ' + self._data.creditScore.score);
            },

            scoreInfo() {
                const cs = self._data?.creditScore;
                if (!cs) { console.log('No credit score data.'); return; }
                const bracket = self._getScoreBracket(cs.score);
                const util = self.getCreditUtilizationSync();
                console.group('\u{1f4ca} Credit Score Info');
                console.log('Score: ' + cs.score + ' (' + bracket.rating + ')');
                console.log('Trend: ' + self.getScoreTrendSync());
                console.log('Hard inquiries this month: ' + cs.hardInquiries);
                console.log('Credit utilization: ' + util.percentage + '% ($' + util.totalUsed.toFixed(2) + ' / $' + util.totalLimit.toFixed(2) + ')');
                console.log('History:', cs.history);
                console.groupEnd();
            },

            recalcScore() {
                const result = self.recalculateCreditScore();
                console.log('\u{1f4ca} [DEBUG] Recalculated: ' + result.oldScore + ' -> ' + result.newScore + ' (' + (result.delta >= 0 ? '+' : '') + result.delta + ')');
                console.log('Reasons:', result.reasons);
                return result;
            },

            showCardTiers() {
                const tiers = self.getAvailableCardTiersSync();
                console.group('\u{1f4b3} Card Tiers');
                tiers.forEach(t => {
                    const status = t.eligible ? '\u2705 ELIGIBLE' : t.alreadyHas ? '\u{1f535} OWNED' : '\u274c LOCKED';
                    console.log(status + ' ' + t.name + ' \u2014 Score: ' + t.requiredScore + '+ | Limit: $' + t.calculatedLimit + ' | APR: ' + t.calculatedApr + '% | Fee: $' + t.annualFee + '/yr');
                    if (t.reason) console.log('   ' + t.reason);
                    if (t.perks.length) console.log('   Perks: ' + t.perks.join(', '));
                });
                console.log('Cards: ' + (tiers[0]?.activeCardCount || 0) + '/' + MAX_CREDIT_CARDS + ' slots used');
                console.groupEnd();
            },

            async applyForCard(tierKey) {
                const result = await self.applyForCreditCard(tierKey);
                if (result.approved) {
                    console.log('\u{1f4b3} [DEBUG] APPROVED: ' + result.card.name + ' \u2014 Limit: $' + result.terms.creditLimit + ', APR: ' + result.terms.apr + '%');
                } else {
                    console.log('\u{1f4b3} [DEBUG] DENIED: ' + result.message);
                    if (result.tips) console.log('Tips:', result.tips);
                }
                return result;
            }
        };
    }
});