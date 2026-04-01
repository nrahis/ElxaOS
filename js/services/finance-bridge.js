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
        return { success: false, message: 'Invalid account type: ' + accountType };
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
            message: 'Insufficient funds in ' + accountType + ' account. Available: $' + this._data.accounts[accountType].balance.toFixed(2)
        };
    }

    this._data.accounts[accountType].balance -= amount;

    var txnType = accountType === 'trust' ? 'trust-payment' : 'payment';
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
        description: description,
        balance: this._data.accounts[accountType].balance
    });
    this.eventBus.emit('finance.accountUpdated', {
        account: accountType,
        newBalance: this._data.accounts[accountType].balance
    });

    return {
        success: true,
        message: 'Payment of $' + amount.toFixed(2) + ' processed successfully from ' + accountType + ' account.',
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
        return { success: false, message: 'Invalid account type: ' + accountType };
    }
    if (!amount || amount <= 0) {
        return { success: false, message: 'Amount must be greater than zero.' };
    }

    this._data.accounts[accountType].balance += amount;

    this._addTransaction({
        type: 'deposit',
        account: accountType,
        amount: amount,
        description: description
    });

    this._save();

    this.eventBus.emit('finance.transactionCompleted', {
        type: 'deposit',
        account: accountType,
        amount: amount,
        description: description,
        balance: this._data.accounts[accountType].balance
    });
    this.eventBus.emit('finance.accountUpdated', {
        account: accountType,
        newBalance: this._data.accounts[accountType].balance
    });

    return {
        success: true,
        message: 'Deposited $' + amount.toFixed(2) + ' to ' + accountType + '.',
        balance: this._data.accounts[accountType].balance
    };
};

FinanceService.prototype.withdrawSync = function(accountType, amount, description) {
    if (!description) description = 'Withdrawal';
    if (!this._data) {
        return { success: false, message: 'Finance service not ready.' };
    }
    if (!this._data.accounts[accountType]) {
        return { success: false, message: 'Invalid account type: ' + accountType };
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
            message: 'Insufficient funds in ' + accountType + '. Available: $' + this._data.accounts[accountType].balance.toFixed(2)
        };
    }

    this._data.accounts[accountType].balance -= amount;

    this._addTransaction({
        type: 'withdrawal',
        account: accountType,
        amount: -amount,
        description: description
    });

    this._save();

    this.eventBus.emit('finance.transactionCompleted', {
        type: 'withdrawal',
        account: accountType,
        amount: -amount,
        description: description,
        balance: this._data.accounts[accountType].balance
    });
    this.eventBus.emit('finance.accountUpdated', {
        account: accountType,
        newBalance: this._data.accounts[accountType].balance
    });

    return {
        success: true,
        message: 'Withdrew $' + amount.toFixed(2) + ' from ' + accountType + '.',
        balance: this._data.accounts[accountType].balance
    };
};

FinanceService.prototype.transferSync = function(fromAccount, toAccount, amount, description) {
    if (!this._data) {
        return { success: false, message: 'Finance service not ready.' };
    }
    if (!this._data.accounts[fromAccount]) {
        return { success: false, message: 'Invalid source account: ' + fromAccount };
    }
    if (!this._data.accounts[toAccount]) {
        return { success: false, message: 'Invalid destination account: ' + toAccount };
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
            message: 'Insufficient funds in ' + fromAccount + '. Available: $' + this._data.accounts[fromAccount].balance.toFixed(2)
        };
    }

    var desc = description || ('Transfer from ' + fromAccount + ' to ' + toAccount);

    this._data.accounts[fromAccount].balance -= amount;
    this._data.accounts[toAccount].balance += amount;

    this._addTransaction({
        type: 'transfer',
        account: fromAccount,
        amount: -amount,
        description: 'Transfer to ' + toAccount + ': ' + desc
    });
    this._addTransaction({
        type: 'transfer',
        account: toAccount,
        amount: amount,
        description: 'Transfer from ' + fromAccount + ': ' + desc
    });

    this._save();

    this.eventBus.emit('finance.transactionCompleted', {
        type: 'transfer',
        fromAccount: fromAccount,
        toAccount: toAccount,
        amount: amount,
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
        message: 'Transferred $' + amount.toFixed(2) + ' from ' + fromAccount + ' to ' + toAccount + '.',
        fromBalance: this._data.accounts[fromAccount].balance,
        toBalance: this._data.accounts[toAccount].balance
    };
};

// =================================
// CONTEXT API (for LLM services)
// =================================

FinanceService.prototype.getFinancialSummary = async function() {
    await this._ensureReady();

    var a = this._data.accounts;
    var snakes = function(usd) { return (usd * 2).toFixed(0); };
    var recentTxns = this._data.transactions.slice(0, 5);

    var summary = 'Financial Status: ';
    summary += 'Checking: $' + a.checking.balance.toFixed(2) + ' (' + snakes(a.checking.balance) + ' snakes), ';
    summary += 'Savings: $' + a.savings.balance.toFixed(2) + ' (' + snakes(a.savings.balance) + ' snakes), ';
    summary += 'Trust: $' + a.trust.balance.toFixed(2) + ' (' + snakes(a.trust.balance) + ' snakes). ';

    var total = a.checking.balance + a.savings.balance + a.trust.balance;
    summary += 'Total net worth: $' + total.toFixed(2) + ' (' + snakes(total) + ' snakes). ';

    // Credit score
    var cs = this._data.creditScore;
    if (cs) {
        var bracket = this._getScoreBracket(cs.score);
        summary += 'Credit score: ' + cs.score + ' (' + bracket.rating + '). ';
        var trend = this.getScoreTrendSync();
        if (trend === 'up') summary += 'Score is trending upward. ';
        else if (trend === 'down') summary += 'Score is trending downward. ';
    }

    // Credit cards
    var activeCards = (this._data.creditCards || []).filter(function(c) { return c.status === 'active'; });
    if (activeCards.length > 0) {
        var totalOwed = activeCards.reduce(function(s, c) { return s + c.balance; }, 0);
        summary += 'Credit cards: ' + activeCards.length + ' active, total owed: $' + totalOwed.toFixed(2) + '. ';
        activeCards.forEach(function(c) {
            var pct = c.creditLimit > 0 ? Math.round((c.balance / c.creditLimit) * 100) : 0;
            summary += c.name + ' (****' + c.last4 + '): $' + c.balance.toFixed(2) + '/$' + c.creditLimit.toFixed(2) + ' (' + pct + '% used). ';
        });
    } else {
        summary += 'No credit cards. ';
    }

    // Secured card info
    var securedCard = this.getSecuredCard();
    if (securedCard) {
        summary += 'Secured card active: ' + securedCard.name + ' (deposit: $' + (securedCard.securedDeposit || 0).toFixed(2) + ', limit: $' + securedCard.creditLimit.toFixed(2) + ', on-time payments: ' + (securedCard.onTimePayments || 0) + '/' + (securedCard.graduationTarget || 1) + ' for graduation). ';
    }

    // Savings bonus status
    var savBal = a.savings.balance;
    if (savBal >= 1000) {
        summary += 'Savings bonus: +3/month (balance over $1,000). ';
    } else if (savBal >= 500) {
        summary += 'Savings bonus: +2/month (balance over $500). ';
    } else if (savBal >= 200) {
        summary += 'Savings bonus: +1/month (balance over $200). ';
    } else {
        summary += 'No savings bonus (need $200+ in savings for credit score boost). ';
    }

    // Loans
    var activeLoans = (this._data.loans || []).filter(function(l) { return l.status === 'active'; });
    if (activeLoans.length > 0) {
        var totalLoanDebt = activeLoans.reduce(function(s, l) { return s + l.remainingBalance; }, 0);
        var totalMonthly = activeLoans.reduce(function(s, l) { return s + l.monthlyPayment; }, 0);
        summary += 'Loans: ' + activeLoans.length + ' active, total owed: $' + totalLoanDebt.toFixed(2) + ', monthly payments: $' + totalMonthly.toFixed(2) + '. ';
        activeLoans.forEach(function(l) {
            var typeName = l.type.charAt(0).toUpperCase() + l.type.slice(1);
            summary += typeName + ' loan: $' + l.remainingBalance.toFixed(2) + ' remaining (' + (l.termMonths - l.paidMonths) + ' months left, $' + l.monthlyPayment.toFixed(2) + '/mo). ';
        });
    } else {
        summary += 'No active loans. ';
    }

    // Monthly obligations
    var obligations = this.getMonthlyObligationsSync();
    if (obligations.totalMonthlyObligations > 0) {
        summary += 'Monthly obligations: $' + obligations.totalMonthlyObligations.toFixed(2) + ' total. ';
    }

    // Recurring payments
    var recurring = this.getActiveRecurringPayments();
    if (recurring.length > 0) {
        var recurTotal = recurring.reduce(function(s, p) { return s + p.amount; }, 0);
        summary += 'Recurring payments: ' + recurring.length + ' active, $' + recurTotal.toFixed(2) + '/mo. ';
    }

    // Inventory / ownership summary (from inventory service)
    if (typeof elxaOS !== 'undefined' && elxaOS.inventoryService) {
        var ownershipSummary = elxaOS.inventoryService.getOwnershipSummary();
        if (ownershipSummary && ownershipSummary !== 'User does not currently own any tracked items.') {
            summary += 'Ownership: ' + ownershipSummary + ' ';
        }
    }

    // Employment summary
    if (typeof elxaOS !== 'undefined' && elxaOS.employmentService) {
        summary += elxaOS.employmentService.getEmploymentSummary() + ' ';
    }

    if (recentTxns.length > 0) {
        summary += 'Recent activity: ';
        summary += recentTxns.map(function(t) {
            var sign = t.amount >= 0 ? '+' : '';
            return t.description + ' (' + sign + '$' + t.amount.toFixed(2) + ')';
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
        var self = this;
        return {
            dump: function() {
                console.group('\ud83d\udcb0 FinanceService Debug');
                console.log('Ready:', self._ready);
                console.log('Accounts:', self._data?.accounts);
                console.log('Credit cards:', self._data?.creditCards?.length || 0);
                if (self._data?.creditCards?.length) {
                    self._data.creditCards.forEach(function(c) {
                        console.log('  ' + c.name + ' ****' + c.last4 + ': bal=$' + c.balance + ', limit=$' + c.creditLimit + ', tier=' + c.tier + ', status=' + c.status);
                    });
                }
                console.log('Loans:', self._data?.loans?.length || 0);
                if (self._data?.loans?.length) {
                    self._data.loans.forEach(function(l) {
                        var typeName = (LOAN_TYPES[l.type]?.name || l.type);
                        console.log('  ' + typeName + ' (' + l.id.slice(-6) + '): $' + l.remainingBalance.toFixed(2) + ' remaining, $' + l.monthlyPayment + '/mo, ' + l.paidMonths + '/' + l.termMonths + ' months, status=' + l.status);
                    });
                }
                console.log('Credit score:', self._data?.creditScore?.score, '(' + self._getScoreBracket(self._data?.creditScore?.score || 500).rating + ')');
                console.log('Score history:', self._data?.creditScore?.history);
                console.log('Hard inquiries this month:', self._data?.creditScore?.hardInquiries || 0);
                console.log('Transactions:', self._data?.transactions?.length, 'total');
                console.log('Last 5:', self._data?.transactions?.slice(0, 5));
                console.log('Last processed date:', self._data?.lastProcessedDate);
                console.groupEnd();
            },

            setBalance: async function(account, amount) {
                await self._ensureReady();
                if (!self._data.accounts[account]) {
                    console.error('Unknown account: ' + account);
                    return;
                }
                var old = self._data.accounts[account].balance;
                self._data.accounts[account].balance = amount;
                self._addTransaction({
                    type: 'debug-adjustment',
                    account: account,
                    amount: amount - old,
                    description: '[DEBUG] Balance set from $' + old.toFixed(2) + ' to $' + amount.toFixed(2)
                });
                await self._save();
                self.eventBus.emit('finance.accountUpdated', { account: account, newBalance: amount });
                console.log('\ud83d\udcb0 [DEBUG] ' + account + ' balance: $' + old.toFixed(2) + ' -> $' + amount.toFixed(2));
            },

            resetFinance: async function() {
                self._data = self._createDefaultFinanceData();
                await self._save();
                console.log('\ud83d\udcb0 [DEBUG] Finance data reset to defaults');
            },

            addMoney: async function(amount) {
                if (amount === undefined) amount = 1000;
                await self.deposit('checking', amount, '[DEBUG] Test deposit');
                console.log('\ud83d\udcb0 [DEBUG] Added $' + amount + ' to checking');
            },

            addCreditCard: async function(name, limit) {
                var result = await self.createCreditCard({
                    name: name || 'Snakesian Gold Card',
                    creditLimit: limit || 500
                });
                console.log('\ud83d\udcb3 [DEBUG]', result.message);
                return result;
            },

            listCards: function() {
                var cards = self.getCreditCardsSync();
                console.group('\ud83d\udcb3 Credit Cards');
                if (cards.length === 0) {
                    console.log('No credit cards.');
                } else {
                    cards.forEach(function(c) {
                        var used = c.balance;
                        var avail = c.creditLimit - c.balance;
                        console.log(c.name + ' (****' + c.last4 + ') \u2014 Balance: $' + used.toFixed(2) + ' / Limit: $' + c.creditLimit.toFixed(2) + ' / Available: $' + avail.toFixed(2) + ' [' + c.status + '] tier=' + (c.tier || 'none'));
                    });
                }
                console.groupEnd();
                return cards;
            },

            setScore: async function(score) {
                await self._ensureReady();
                if (!self._data.creditScore) self._data.creditScore = self._createDefaultCreditScore();
                var old = self._data.creditScore.score;
                self._data.creditScore.score = Math.max(300, Math.min(850, score));
                self._data.creditScore.lastUpdated = new Date().toISOString();
                await self._save();
                var bracket = self._getScoreBracket(self._data.creditScore.score);
                console.log('\ud83d\udcca [DEBUG] Credit score: ' + old + ' -> ' + self._data.creditScore.score + ' (' + bracket.rating + ')');
            },

            adjustScore: async function(delta, reason) {
                await self._ensureReady();
                self._adjustScore(delta, reason || '[DEBUG] Manual adjustment');
                await self._save();
                console.log('\ud83d\udcca [DEBUG] Credit score adjusted by ' + (delta >= 0 ? '+' : '') + delta + ' -> ' + self._data.creditScore.score);
            },

            scoreInfo: function() {
                var cs = self._data?.creditScore;
                if (!cs) { console.log('No credit score data.'); return; }
                var bracket = self._getScoreBracket(cs.score);
                var util = self.getCreditUtilizationSync();
                console.group('\ud83d\udcca Credit Score Info');
                console.log('Score: ' + cs.score + ' (' + bracket.rating + ')');
                console.log('Trend: ' + self.getScoreTrendSync());
                console.log('Hard inquiries this month: ' + cs.hardInquiries);
                console.log('Credit utilization: ' + util.percentage + '% ($' + util.totalUsed.toFixed(2) + ' / $' + util.totalLimit.toFixed(2) + ')');
                console.log('History:', cs.history);
                console.groupEnd();
            },

            recalcScore: function() {
                var result = self.recalculateCreditScore();
                console.log('\ud83d\udcca [DEBUG] Recalculated: ' + result.oldScore + ' -> ' + result.newScore + ' (' + (result.delta >= 0 ? '+' : '') + result.delta + ')');
                console.log('Reasons:', result.reasons);
                return result;
            },

            showCardTiers: function() {
                var tiers = self.getAvailableCardTiersSync();
                console.group('\ud83d\udcb3 Card Tiers');
                tiers.forEach(function(t) {
                    var status = t.eligible ? '\u2705 ELIGIBLE' : t.alreadyHas ? '\ud83d\udd35 OWNED' : '\u274c LOCKED';
                    console.log(status + ' ' + t.name + ' \u2014 Score: ' + t.requiredScore + '+ | Limit: $' + t.calculatedLimit + ' | APR: ' + t.calculatedApr + '% | Fee: $' + t.annualFee + '/yr');
                    if (t.reason) console.log('   ' + t.reason);
                    if (t.perks.length) console.log('   Perks: ' + t.perks.join(', '));
                });
                console.log('Cards: ' + (tiers[0]?.activeCardCount || 0) + '/' + MAX_CREDIT_CARDS + ' slots used');
                console.groupEnd();
            },

            applyForCard: async function(tierKey) {
                var result = await self.applyForCreditCard(tierKey);
                if (result.approved) {
                    console.log('\ud83d\udcb3 [DEBUG] APPROVED: ' + result.card.name + ' \u2014 Limit: $' + result.terms.creditLimit + ', APR: ' + result.terms.apr + '%');
                } else {
                    console.log('\ud83d\udcb3 [DEBUG] DENIED: ' + result.message);
                    if (result.tips) console.log('Tips:', result.tips);
                }
                return result;
            },

            // === LOAN DEBUG TOOLS ===

            listLoans: function() {
                var loans = self.getLoansSync();
                console.group('\ud83c\udfe6 Loans');
                if (loans.length === 0) {
                    console.log('No loans.');
                } else {
                    loans.forEach(function(l) {
                        var typeName = (LOAN_TYPES[l.type]?.name || l.type);
                        var remaining = l.termMonths - l.paidMonths;
                        console.log(typeName + ' (' + l.id.slice(-6) + ') \u2014 Bal: $' + l.remainingBalance.toFixed(2) + ' / Orig: $' + l.principal.toFixed(2) + ' | $' + l.monthlyPayment + '/mo | ' + l.paidMonths + '/' + l.termMonths + ' months (' + remaining + ' left) | APR: ' + l.apr + '% | [' + l.status + ']');
                        if (l.linkedAsset) console.log('   Linked: ' + l.linkedAsset.type + ' #' + l.linkedAsset.id);
                        if (l.missedPayments > 0) console.log('   \u26a0\ufe0f Missed payments: ' + l.missedPayments);
                    });
                }
                console.groupEnd();
                return loans;
            },

            showLoanTypes: function() {
                var types = self.getAvailableLoanTypesSync();
                console.group('\ud83c\udfe6 Loan Types');
                types.forEach(function(t) {
                    var status = t.eligible ? '\u2705 ELIGIBLE' : '\u274c LOCKED';
                    console.log(status + ' ' + t.name + ' \u2014 Score: ' + t.requiredScore + '+ | Max: $' + t.maxApprovedAmount + ' | APR: ~' + t.estimatedApr + '% | Term: ' + t.termRange[0] + '-' + t.termRange[1] + 'mo');
                    if (t.reason) console.log('   ' + t.reason);
                    if (t.activeOfType > 0) console.log('   Active: ' + t.activeOfType + '/' + t.maxActive);
                });
                console.groupEnd();
            },

            applyForLoan: async function(type, amount, termMonths) {
                var result = await self.applyForLoan({
                    type: type || 'personal',
                    amount: amount || 500,
                    termMonths: termMonths || 12
                });
                if (result.approved) {
                    console.log('\ud83c\udfe6 [DEBUG] APPROVED: ' + (LOAN_TYPES[type]?.name || type) + ' \u2014 $' + result.terms.principal.toFixed(2) + ' at ' + result.terms.apr + '% for ' + result.terms.termMonths + 'mo ($' + result.terms.monthlyPayment + '/mo)');
                    console.log('   Total interest: $' + result.terms.totalInterest.toFixed(2) + ' | Total cost: $' + result.terms.totalCost.toFixed(2));
                } else {
                    console.log('\ud83c\udfe6 [DEBUG] DENIED: ' + result.message);
                    if (result.tips) console.log('Tips:', result.tips);
                }
                return result;
            },

            payLoan: async function(loanId, amount) {
                if (!loanId) {
                    var active = (self._data?.loans || []).filter(function(l) { return l.status === 'active'; });
                    if (active.length === 0) { console.log('No active loans.'); return; }
                    loanId = active[0].id;
                    console.log('Using first active loan: ' + loanId.slice(-6));
                }
                var result = await self.payLoan(loanId, amount);
                console.log('\ud83c\udfe6 [DEBUG] ' + result.message);
                return result;
            },

            payOffLoan: async function(loanId) {
                if (!loanId) {
                    var active = (self._data?.loans || []).filter(function(l) { return l.status === 'active'; });
                    if (active.length === 0) { console.log('No active loans.'); return; }
                    loanId = active[0].id;
                }
                var result = await self.payOffLoan(loanId);
                console.log('\ud83c\udfe6 [DEBUG] ' + result.message);
                return result;
            },

            showAmortization: function(loanId) {
                if (!loanId) {
                    var active = (self._data?.loans || []).filter(function(l) { return l.status === 'active'; });
                    if (active.length === 0) { console.log('No active loans.'); return []; }
                    loanId = active[0].id;
                }
                var schedule = self.getAmortizationSchedule(loanId);
                console.group('\ud83c\udfe6 Amortization Schedule');
                console.table(schedule.map(function(s) {
                    return {
                        Month: s.month,
                        Payment: '$' + s.payment.toFixed(2),
                        Principal: '$' + s.principal.toFixed(2),
                        Interest: '$' + s.interest.toFixed(2),
                        Balance: '$' + s.balance.toFixed(2),
                        Paid: s.isPaid ? '\u2705' : ''
                    };
                }));
                console.groupEnd();
                return schedule;
            },

            simulateMissedPayment: function(loanId) {
                if (!loanId) {
                    var active = (self._data?.loans || []).filter(function(l) { return l.status === 'active'; });
                    if (active.length === 0) { console.log('No active loans.'); return; }
                    loanId = active[0].id;
                }
                var result = self.processMonthlyLoanPayment(loanId);
                console.log('\ud83c\udfe6 [DEBUG] Monthly payment result:', result.message);
                if (result.defaulted) console.log('\u26a0\ufe0f LOAN DEFAULTED!');
                return result;
            },

            // === MONTHLY CYCLE DEBUG TOOLS ===

            triggerCycle: function() {
                console.log('\ud83d\udd04 [DEBUG] Manually triggering monthly cycle...');
                var result = self._runSingleCycle(new Date().toISOString().split('T')[0]);
                console.group('\ud83d\udd04 Cycle Results');
                result.events.forEach(function(e) { console.log(e); });
                console.groupEnd();
                return result;
            },

            advanceMonth: function(n) {
                if (!n) n = 1;
                console.log('\ud83d\udd04 [DEBUG] Advancing ' + n + ' month(s)...');
                var results = [];
                var date = self._data?.lastProcessedDate || new Date().toISOString().split('T')[0];
                for (var i = 0; i < n; i++) {
                    date = self._advanceDateByMonths(date, 1);
                    var result = self._runSingleCycle(date);
                    results.push(result);
                    console.group('\ud83d\udd04 Month ' + (i + 1) + ' (' + date.slice(0, 7) + ')');
                    result.events.forEach(function(e) { console.log(e); });
                    console.groupEnd();
                }
                self._data.lastProcessedDate = date;
                self._save();
                console.log('\ud83d\udd04 [DEBUG] Advanced ' + n + ' months. Last processed: ' + date);
                return results;
            },

            showCycleLog: function() {
                var log = self.getCycleLog();
                console.group('\ud83d\udd04 Cycle Log (' + log.length + ' entries)');
                if (log.length === 0) {
                    console.log('No cycle history yet.');
                } else {
                    log.forEach(function(entry) {
                        var missed = entry.missedPayments > 0 ? ' \u26a0\ufe0f ' + entry.missedPayments + ' missed' : '';
                        console.log(entry.date + ': score ' + (entry.scoreChange >= 0 ? '+' : '') + entry.scoreChange + ' | savings +$' + entry.savingsInterest.toFixed(2) + ' | CC interest $' + entry.creditCardInterest.toFixed(2) + missed);
                    });
                }
                console.groupEnd();
                return log;
            },

            showObligations: function() {
                var obligations = self.getMonthlyObligationsSync();
                console.group('\ud83d\udd04 Monthly Obligations: $' + obligations.totalMonthlyObligations.toFixed(2));
                if (obligations.breakdown.length === 0) {
                    console.log('No monthly obligations.');
                } else {
                    obligations.breakdown.forEach(function(b) {
                        console.log('[' + b.type + '] ' + b.description + ': $' + b.amount.toFixed(2) + ' from ' + b.account);
                    });
                }
                console.groupEnd();
                return obligations;
            },

            addRecurring: function(description, amount, account) {
                var result = self.addRecurringPayment({
                    description: description || 'Test Subscription',
                    amount: amount || 9.99,
                    sourceAccount: account || 'checking',
                    type: 'subscription'
                });
                console.log('\ud83d\udd04 [DEBUG] Added recurring: ' + result.payment.description + ' $' + result.payment.amount.toFixed(2) + '/mo');
                return result;
            },

            listRecurring: function() {
                var payments = self.getRecurringPayments();
                console.group('\ud83d\udd04 Recurring Payments');
                if (payments.length === 0) {
                    console.log('No recurring payments.');
                } else {
                    payments.forEach(function(p) {
                        console.log('[' + p.status + '] ' + p.description + ': $' + p.amount.toFixed(2) + '/mo from ' + p.sourceAccount + (p.missedPayments > 0 ? ' (missed: ' + p.missedPayments + ')' : ''));
                    });
                }
                console.groupEnd();
                return payments;
            },

            cancelRecurring: function(paymentId) {
                if (!paymentId) {
                    var active = self.getActiveRecurringPayments();
                    if (active.length === 0) { console.log('No active recurring payments.'); return; }
                    paymentId = active[0].id;
                    console.log('Cancelling first active: ' + active[0].description);
                }
                var result = self.cancelRecurringPayment(paymentId);
                console.log('\ud83d\udd04 [DEBUG] ' + result.message);
                return result;
            },

            // === SECURED CARD DEBUG TOOLS ===

            applySecured: async function(deposit) {
                var result = await self.applyForSecuredCard(deposit || 100);
                if (result.approved) {
                    console.log('\ud83d\udd12 [DEBUG] SECURED CARD OPENED: deposit=$' + result.deposit + ', limit=$' + result.card.creditLimit);
                    console.log('   ' + result.graduationInfo);
                } else {
                    console.log('\ud83d\udd12 [DEBUG] Secured card: ' + result.message);
                }
                return result;
            },

            showSecuredCard: function() {
                var card = self.getSecuredCard();
                if (!card) {
                    console.log('\ud83d\udd12 No active secured card.');
                    return null;
                }
                console.group('\ud83d\udd12 Secured Card');
                console.log('Name: ' + card.name + ' (****' + card.last4 + ')');
                console.log('Deposit: $' + (card.securedDeposit || 0).toFixed(2));
                console.log('Limit: $' + card.creditLimit.toFixed(2));
                console.log('Balance: $' + card.balance.toFixed(2));
                console.log('On-time payments: ' + (card.onTimePayments || 0) + '/' + (card.graduationTarget || 1));
                var remaining = (card.graduationTarget || 1) - (card.onTimePayments || 0);
                if (remaining > 0) {
                    console.log('Payments until graduation: ' + remaining);
                } else {
                    console.log('\u2705 Ready to graduate on next cycle!');
                }
                console.groupEnd();
                return card;
            }
        };
    }
});