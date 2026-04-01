// =================================
// FINANCE SERVICE — Monthly Cycle Engine
// Time-based financial processing: interest, payments, fees, score recalc
// =================================
// On boot/login, checks if months have passed since lastProcessedDate.
// For each elapsed month, processes all financial obligations in order:
//   1. Savings interest
//   2. Credit card interest accrual
//   3. Credit card annual fees
//   4. Loan monthly payments
//   5. Credit card minimum payments
//   6. Recurring payments (generic)
//   6.25. Property tax processing (via inventory service)
//   6.5. Vehicle insurance processing (via inventory service)
//   6.5b. Secured card graduation check
//   6.75. Vehicle depreciation processing (via inventory service)
//   7. Credit score recalculation
//
// Emits events for notifications, LLM context, and UI updates.
// Includes debug tools for time manipulation and manual cycle triggers.
// =================================

// =================================
// CONSTANTS
// =================================
var SAVINGS_APR = 2.0;           // 2% annual interest on savings
var CC_LATE_FEE_FIRST = 25;      // First missed CC payment late fee
var CC_LATE_FEE_REPEAT = 50;     // Subsequent missed CC payment late fee
var CC_MISSES_TO_FREEZE = 3;     // Consecutive misses before card is frozen
var CYCLE_LOG_MAX = 24;          // Keep last 24 months of cycle logs

// =================================
// INIT HOOK
// =================================
// Monkey-patch _loadFinanceData to run cycle check after data loads.
var _originalLoadFinanceData = FinanceService.prototype._loadFinanceData;
FinanceService.prototype._loadFinanceData = async function() {
    await _originalLoadFinanceData.call(this);
    if (this._ready) {
        this._checkAndProcessCycles();
    }
};

// =================================
// CYCLE DETECTION
// =================================

/**
 * Check if months have elapsed since lastProcessedDate and process each one.
 * Called automatically after finance data loads.
 */
FinanceService.prototype._checkAndProcessCycles = function() {
    if (!this._data) return;

    var lastDate = this._data.lastProcessedDate;
    if (!lastDate) {
        this._data.lastProcessedDate = new Date().toISOString().split('T')[0];
        this._save();
        return;
    }

    var monthsElapsed = this._getMonthsElapsed(lastDate);
    if (monthsElapsed <= 0) return;

    console.log('\u{1f504} Monthly cycle engine: ' + monthsElapsed + ' month(s) elapsed since ' + lastDate);

    // Process each elapsed month
    var allResults = [];
    for (var i = 0; i < monthsElapsed; i++) {
        var cycleDate = this._advanceDateByMonths(lastDate, i + 1);
        var result = this._runSingleCycle(cycleDate);
        allResults.push(result);
    }

    // Update lastProcessedDate to current month
    var now = new Date();
    this._data.lastProcessedDate = now.toISOString().split('T')[0];
    this._save();

    // Emit summary event
    this.eventBus.emit('finance.cyclesProcessed', {
        monthsProcessed: monthsElapsed,
        results: allResults
    });

    // Log summary
    var totalInterest = allResults.reduce(function(s, r) { return s + (r.creditCardInterest || 0); }, 0);
    var totalLoansPaid = allResults.reduce(function(s, r) { return s + (r.loanPaymentsMade || 0); }, 0);
    var totalMissed = allResults.reduce(function(s, r) { return s + (r.missedPayments || 0); }, 0);
    console.log('\u{1f504} Cycle summary: ' + monthsElapsed + ' months processed. CC interest: $' + totalInterest.toFixed(2) + ', Loan payments: ' + totalLoansPaid + ', Missed: ' + totalMissed);
};

/**
 * Calculate how many full months have elapsed since a date string.
 * @param {string} dateStr — 'YYYY-MM-DD'
 * @returns {number} — months elapsed (0 if same month)
 */
FinanceService.prototype._getMonthsElapsed = function(dateStr) {
    var parts = dateStr.split('-');
    var lastYear = parseInt(parts[0], 10);
    var lastMonth = parseInt(parts[1], 10);

    var now = new Date();
    var currentYear = now.getFullYear();
    var currentMonth = now.getMonth() + 1; // 1-indexed

    return (currentYear - lastYear) * 12 + (currentMonth - lastMonth);
};

/**
 * Advance a date string by N months. Returns 'YYYY-MM-DD' string.
 */
FinanceService.prototype._advanceDateByMonths = function(dateStr, months) {
    var parts = dateStr.split('-');
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);
    var day = parseInt(parts[2], 10);

    month += months;
    while (month > 12) {
        month -= 12;
        year++;
    }

    var mm = month < 10 ? '0' + month : '' + month;
    var dd = day < 10 ? '0' + day : '' + day;
    return year + '-' + mm + '-' + dd;
};

// =================================
// SINGLE CYCLE PROCESSOR
// =================================

/**
 * Run one month's worth of financial processing.
 * @param {string} cycleDate — 'YYYY-MM-DD' representing the month being processed
 * @returns {object} — cycle result log entry
 */
FinanceService.prototype._runSingleCycle = function(cycleDate) {
    var cycleMonth = cycleDate.slice(0, 7); // 'YYYY-MM'
    console.log('\u{1f504} Processing cycle for ' + cycleMonth + '...');

    var log = {
        date: cycleMonth,
        processedAt: new Date().toISOString(),
        savingsInterest: 0,
        creditCardInterest: 0,
        annualFees: 0,
        loanPaymentsMade: 0,
        loanPaymentsMissed: 0,
        ccPaymentsMade: 0,
        ccPaymentsMissed: 0,
        recurringProcessed: 0,
        recurringMissed: 0,
        missedPayments: 0,
        scoreChange: 0,
        events: []
    };

    // 1. Savings interest
    var savingsResult = this._processSavingsInterest(cycleMonth);
    log.savingsInterest = savingsResult.interest;
    if (savingsResult.interest > 0) {
        log.events.push('Savings interest: +$' + savingsResult.interest.toFixed(2));
    }

    // 2. Credit card interest accrual
    var ccInterestResult = this._processCreditCardInterest(cycleMonth);
    log.creditCardInterest = ccInterestResult.totalInterest;
    ccInterestResult.details.forEach(function(d) {
        log.events.push('CC interest on ' + d.cardName + ': +$' + d.interest.toFixed(2));
    });

    // 3. Credit card annual fees
    var feeResult = this._processAnnualFees(cycleDate);
    log.annualFees = feeResult.totalFees;
    feeResult.details.forEach(function(d) {
        log.events.push('Annual fee on ' + d.cardName + ': $' + d.fee.toFixed(2));
    });

    // 4. Loan monthly payments
    var loanResult = this._processAllLoanPayments(cycleMonth);
    log.loanPaymentsMade = loanResult.paid;
    log.loanPaymentsMissed = loanResult.missed;
    log.missedPayments += loanResult.missed;
    loanResult.details.forEach(function(d) {
        log.events.push(d.message);
    });

    // 5. Credit card minimum payments
    var ccPayResult = this._processAllCreditCardMinimums(cycleMonth);
    log.ccPaymentsMade = ccPayResult.paid;
    log.ccPaymentsMissed = ccPayResult.missed;
    log.missedPayments += ccPayResult.missed;
    ccPayResult.details.forEach(function(d) {
        log.events.push(d.message);
    });

    // 6. Recurring payments
    var recurResult = this._processRecurringPayments(cycleMonth);
    log.recurringProcessed = recurResult.processed;
    log.recurringMissed = recurResult.missed;
    log.missedPayments += recurResult.missed;
    recurResult.details.forEach(function(d) {
        log.events.push(d.message);
    });

    // 6.25 Property tax processing
    var taxResult = this._processPropertyTaxes(cycleMonth);
    log.propertyTaxPaid = taxResult.totalTaxPaid || 0;
    log.propertyTaxDelinquent = taxResult.delinquent ? taxResult.delinquent.length : 0;
    log.propertyTaxForeclosed = taxResult.forcedSales ? taxResult.forcedSales.length : 0;
    if (taxResult.totalTaxPaid > 0) {
        log.events.push('Property taxes paid: $' + taxResult.totalTaxPaid.toFixed(2));
    }
    if (taxResult.delinquent) {
        taxResult.delinquent.forEach(function(d) {
            log.events.push('TAX DELINQUENT: ' + d.name + ' (missed ' + d.missedCount + '/3)');
        });
    }
    if (taxResult.forcedSales) {
        taxResult.forcedSales.forEach(function(f) {
            log.events.push('TAX FORECLOSURE: ' + f.name + ' — forced sale after 3 missed tax payments');
        });
    }

    // 6.5 Vehicle insurance processing
    var insuranceResult = this._processVehicleInsurance(cycleMonth);
    log.vehicleInsurancePaid = insuranceResult.totalPaid || 0;
    log.vehicleInsuranceMissed = insuranceResult.missed || 0;
    log.vehicleImpounded = insuranceResult.impounded ? insuranceResult.impounded.length : 0;
    if (insuranceResult.totalPaid > 0) {
        log.events.push('Vehicle insurance paid: $' + insuranceResult.totalPaid.toFixed(2));
    }
    if (insuranceResult.delinquent) {
        insuranceResult.delinquent.forEach(function(d) {
            log.events.push('INSURANCE DELINQUENT: ' + d.name + ' (missed ' + d.missedCount + '/3)');
        });
    }
    if (insuranceResult.impounded) {
        insuranceResult.impounded.forEach(function(v) {
            log.events.push('VEHICLE IMPOUNDED: ' + v.name + ' — impounded after 3 missed insurance payments');
        });
    }

    // 6.5b Secured card graduation check
    var gradResult = this._processSecuredCardGraduation(cycleMonth);
    if (gradResult.graduated) {
        log.events.push(gradResult.details.message);
    }

    // 6.75 Vehicle depreciation processing
    var depreciationResult = this._processVehicleDepreciation(cycleMonth);
    log.vehicleDepreciation = depreciationResult.totalDepreciation || 0;
    if (depreciationResult.totalDepreciation > 0) {
        log.events.push('Vehicle depreciation: -$' + depreciationResult.totalDepreciation.toFixed(2) + ' across ' + depreciationResult.processed + ' vehicle(s)');
    }

    // 7. Credit score recalculation
    var scoreResult = this.recalculateCreditScore();
    log.scoreChange = scoreResult.delta;
    if (scoreResult.delta !== 0) {
        var sign = scoreResult.delta > 0 ? '+' : '';
        log.events.push('Credit score: ' + scoreResult.oldScore + ' -> ' + scoreResult.newScore + ' (' + sign + scoreResult.delta + ')');
    }

    // Save the cycle log
    if (!this._data.cycleLog) this._data.cycleLog = [];
    this._data.cycleLog.push(log);
    if (this._data.cycleLog.length > CYCLE_LOG_MAX) {
        this._data.cycleLog = this._data.cycleLog.slice(-CYCLE_LOG_MAX);
    }

    this._save();

    // Emit per-cycle event
    this.eventBus.emit('finance.monthlyCycleCompleted', log);

    console.log('\u{1f504} Cycle ' + cycleMonth + ' complete: ' + log.events.length + ' events');
    return log;
};

// =================================
// SAVINGS INTEREST
// =================================

/**
 * Apply monthly savings interest.
 * @returns {{ interest: number }}
 */
FinanceService.prototype._processSavingsInterest = function(cycleMonth) {
    var savings = this._data.accounts.savings;
    if (!savings || savings.balance <= 0) return { interest: 0 };

    var monthlyRate = (SAVINGS_APR / 100) / 12;
    var interest = Math.round(savings.balance * monthlyRate * 100) / 100;

    if (interest < 0.01) return { interest: 0 };

    savings.balance += interest;

    this._addTransaction({
        type: 'savings-interest',
        account: 'savings',
        amount: interest,
        description: 'Monthly savings interest (' + SAVINGS_APR + '% APR) — ' + cycleMonth
    });

    this.eventBus.emit('finance.savingsInterest', {
        interest: interest,
        newBalance: savings.balance,
        apr: SAVINGS_APR
    });

    return { interest: interest };
};

// =================================
// CREDIT CARD INTEREST ACCRUAL
// =================================

/**
 * Accrue monthly interest on all active credit cards with outstanding balances.
 * Interest is added to the card balance (compounds monthly).
 * @returns {{ totalInterest, details[] }}
 */
FinanceService.prototype._processCreditCardInterest = function(cycleMonth) {
    var result = { totalInterest: 0, details: [] };
    var cards = (this._data.creditCards || []).filter(function(c) { return c.status === 'active'; });

    for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        if (card.balance <= 0) continue;

        var monthlyRate = (card.apr / 100) / 12;
        var interest = Math.round(card.balance * monthlyRate * 100) / 100;

        if (interest < 0.01) continue;

        card.balance = Math.round((card.balance + interest) * 100) / 100;
        result.totalInterest += interest;

        result.details.push({
            cardId: card.id,
            cardName: card.name,
            interest: interest,
            newBalance: card.balance,
            apr: card.apr
        });

        this._addTransaction({
            type: 'credit-interest',
            account: 'credit:' + card.id,
            amount: -interest,
            description: 'Monthly interest (' + card.apr + '% APR) on ' + card.name + ' ****' + card.last4 + ' — ' + cycleMonth
        });

        this.eventBus.emit('finance.creditInterestAccrued', {
            cardId: card.id,
            cardName: card.name,
            interest: interest,
            newBalance: card.balance,
            apr: card.apr
        });
    }

    return result;
};

// =================================
// ANNUAL FEES
// =================================

/**
 * Charge annual fees on credit cards on their anniversary month.
 * @param {string} cycleDate — 'YYYY-MM-DD'
 * @returns {{ totalFees, details[] }}
 */
FinanceService.prototype._processAnnualFees = function(cycleDate) {
    var result = { totalFees: 0, details: [] };
    var cycleMonth = parseInt(cycleDate.split('-')[1], 10);
    var cards = (this._data.creditCards || []).filter(function(c) { return c.status === 'active'; });

    for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        if (!card.annualFee || card.annualFee <= 0) continue;

        // Check if this is the anniversary month
        var openedMonth = new Date(card.opened).getMonth() + 1; // 1-indexed
        if (openedMonth !== cycleMonth) continue;

        // Check card has been open for at least 1 year
        var openedDate = new Date(card.opened);
        var cycleYear = parseInt(cycleDate.split('-')[0], 10);
        var openedYear = openedDate.getFullYear();
        if (cycleYear <= openedYear) continue; // Don't charge in the first year

        card.balance += card.annualFee;
        result.totalFees += card.annualFee;

        result.details.push({
            cardId: card.id,
            cardName: card.name,
            fee: card.annualFee,
            newBalance: card.balance
        });

        this._addTransaction({
            type: 'annual-fee',
            account: 'credit:' + card.id,
            amount: -card.annualFee,
            description: 'Annual fee for ' + card.name + ' ****' + card.last4 + ': $' + card.annualFee.toFixed(2)
        });

        this.eventBus.emit('finance.annualFeeCharged', {
            cardId: card.id,
            cardName: card.name,
            fee: card.annualFee,
            newBalance: card.balance
        });
    }

    return result;
};

// =================================
// LOAN MONTHLY PAYMENTS
// =================================

/**
 * Process monthly payments for all active loans.
 * Uses the existing processMonthlyLoanPayment() for each loan.
 * @returns {{ paid, missed, details[] }}
 */
FinanceService.prototype._processAllLoanPayments = function(cycleMonth) {
    var result = { paid: 0, missed: 0, details: [] };
    var loans = (this._data.loans || []).filter(function(l) { return l.status === 'active'; });

    for (var i = 0; i < loans.length; i++) {
        var loan = loans[i];
        var payResult = this.processMonthlyLoanPayment(loan.id);

        if (payResult.paid) {
            result.paid++;
        } else if (payResult.missed) {
            result.missed++;
        }

        result.details.push({
            loanId: loan.id,
            type: loan.type,
            paid: payResult.paid,
            missed: payResult.missed,
            defaulted: payResult.defaulted || false,
            paidOff: payResult.paidOff || false,
            message: 'Loan ' + loan.id.slice(-6) + ': ' + payResult.message
        });
    }

    return result;
};

// =================================
// CREDIT CARD MINIMUM PAYMENTS
// =================================

/**
 * Auto-pay credit card minimums from checking account.
 * If insufficient funds, tracks missed payment and applies consequences.
 * @returns {{ paid, missed, details[] }}
 */
FinanceService.prototype._processAllCreditCardMinimums = function(cycleMonth) {
    var self = this;
    var result = { paid: 0, missed: 0, details: [] };
    var cards = (this._data.creditCards || []).filter(function(c) { return c.status === 'active'; });

    for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        if (card.balance <= 0) continue;

        var minimumDue = Math.min(card.minimumPayment, card.balance);
        if (minimumDue <= 0) continue;

        var checking = this._data.accounts.checking;

        if (checking.balance >= minimumDue) {
            // Pay the minimum
            checking.balance -= minimumDue;
            card.balance = Math.round((card.balance - minimumDue) * 100) / 100;

            // Reset missed payment counter on successful payment
            if (!card.missedPayments) card.missedPayments = 0;
            card.missedPayments = 0;

            this._addTransaction({
                type: 'credit-auto-payment',
                account: 'checking',
                amount: -minimumDue,
                description: 'Auto minimum payment: ' + card.name + ' ****' + card.last4 + ' — ' + cycleMonth
            });

            // Score boost for on-time CC payment
            var boost = Math.floor(Math.random() * 11) + 5; // +5 to +15
            this._adjustScore(boost, 'On-time credit card payment (' + card.name + ')');

            // Track on-time payments for secured card graduation
            if (card.secured) {
                if (!card.onTimePayments) card.onTimePayments = 0;
                card.onTimePayments++;
                console.log('\ud83d\udd12 Secured card on-time payment #' + card.onTimePayments + '/' + (card.graduationTarget || 1));
            }

            // Extra boost if this pays off the card
            if (card.balance <= 0) {
                card.balance = 0;
                this._adjustScore(Math.floor(Math.random() * 11) + 10, 'Paid off ' + card.name + ' in full');
            }

            result.paid++;
            result.details.push({
                cardId: card.id,
                cardName: card.name,
                paid: true,
                amount: minimumDue,
                message: card.name + ' minimum paid: $' + minimumDue.toFixed(2) + ' from checking'
            });

            this.eventBus.emit('finance.creditPayment', {
                cardId: card.id,
                cardName: card.name,
                amount: minimumDue,
                newBalance: card.balance,
                fromAccount: 'checking',
                auto: true
            });
            this.eventBus.emit('finance.accountUpdated', {
                account: 'checking',
                newBalance: checking.balance
            });

        } else {
            // MISSED PAYMENT
            if (!card.missedPayments) card.missedPayments = 0;
            card.missedPayments++;

            // Reset secured card graduation progress on missed payment
            if (card.secured) {
                card.onTimePayments = 0;
                console.log('\ud83d\udd12 Secured card graduation progress reset due to missed payment.');
            }

            var lateFee = card.missedPayments === 1 ? CC_LATE_FEE_FIRST : CC_LATE_FEE_REPEAT;
            card.balance += lateFee;

            this._addTransaction({
                type: 'credit-missed-payment',
                account: 'credit:' + card.id,
                amount: -lateFee,
                description: 'MISSED minimum payment + $' + lateFee.toFixed(2) + ' late fee: ' + card.name + ' ****' + card.last4 + ' (miss #' + card.missedPayments + ') — ' + cycleMonth
            });

            // Score hit for missed CC payment
            var penalty = -(Math.floor(Math.random() * 16) + 15); // -15 to -30
            this._adjustScore(penalty, 'Missed ' + card.name + ' payment');

            // Check for card freeze (3 consecutive misses)
            if (card.missedPayments >= CC_MISSES_TO_FREEZE) {
                card.status = 'frozen';
                card.frozenDate = new Date().toISOString();

                // Catastrophic score hit
                this._adjustScore(-30, card.name + ' frozen for non-payment');

                this._addTransaction({
                    type: 'credit-card-frozen',
                    account: 'credit:' + card.id,
                    amount: 0,
                    description: card.name + ' FROZEN after ' + CC_MISSES_TO_FREEZE + ' consecutive missed payments'
                });

                this.eventBus.emit('finance.creditCardFrozen', {
                    cardId: card.id,
                    cardName: card.name,
                    balance: card.balance,
                    missedPayments: card.missedPayments
                });

                result.details.push({
                    cardId: card.id,
                    cardName: card.name,
                    paid: false,
                    frozen: true,
                    message: card.name + ' FROZEN after ' + CC_MISSES_TO_FREEZE + ' missed payments! Balance: $' + card.balance.toFixed(2)
                });
            } else {
                this.eventBus.emit('finance.paymentMissed', {
                    type: 'credit-card',
                    cardId: card.id,
                    cardName: card.name,
                    amount: minimumDue,
                    lateFee: lateFee,
                    missedPayments: card.missedPayments,
                    available: checking.balance
                });

                result.details.push({
                    cardId: card.id,
                    cardName: card.name,
                    paid: false,
                    lateFee: lateFee,
                    missedPayments: card.missedPayments,
                    message: 'MISSED ' + card.name + ' minimum ($' + minimumDue.toFixed(2) + '). Late fee: $' + lateFee.toFixed(2) + '. ' + (CC_MISSES_TO_FREEZE - card.missedPayments) + ' more misses until frozen.'
                });
            }

            result.missed++;
        }
    }

    return result;
};

// =================================
// RECURRING PAYMENTS
// =================================

/**
 * Process all active recurring payments.
 * Generic system for subscriptions, rent, etc.
 * @returns {{ processed, missed, details[] }}
 */
FinanceService.prototype._processRecurringPayments = function(cycleMonth) {
    var result = { processed: 0, missed: 0, details: [] };
    var payments = (this._data.recurringPayments || []).filter(function(p) { return p.status === 'active'; });

    for (var i = 0; i < payments.length; i++) {
        var payment = payments[i];
        var account = payment.sourceAccount || 'checking';
        var accountData = this._data.accounts[account];

        if (!accountData) continue;

        if (accountData.balance >= payment.amount) {
            // Process the payment
            accountData.balance -= payment.amount;

            this._addTransaction({
                type: 'recurring-payment',
                account: account,
                amount: -payment.amount,
                description: payment.description + ' (recurring) — ' + cycleMonth
            });

            this.eventBus.emit('finance.paymentProcessed', {
                type: 'recurring',
                paymentId: payment.id,
                description: payment.description,
                amount: payment.amount,
                account: account
            });
            this.eventBus.emit('finance.accountUpdated', {
                account: account,
                newBalance: accountData.balance
            });

            result.processed++;
            result.details.push({
                paymentId: payment.id,
                description: payment.description,
                amount: payment.amount,
                paid: true,
                message: 'Recurring: ' + payment.description + ' — $' + payment.amount.toFixed(2) + ' from ' + account
            });
        } else {
            // Missed recurring payment
            if (!payment.missedPayments) payment.missedPayments = 0;
            payment.missedPayments++;

            this._addTransaction({
                type: 'recurring-missed',
                account: account,
                amount: 0,
                description: 'MISSED recurring payment: ' + payment.description + ' ($' + payment.amount.toFixed(2) + ') — insufficient funds'
            });

            this.eventBus.emit('finance.paymentMissed', {
                type: 'recurring',
                paymentId: payment.id,
                description: payment.description,
                amount: payment.amount,
                available: accountData.balance
            });

            result.missed++;
            result.details.push({
                paymentId: payment.id,
                description: payment.description,
                amount: payment.amount,
                paid: false,
                message: 'MISSED recurring: ' + payment.description + ' ($' + payment.amount.toFixed(2) + ') — insufficient funds in ' + account
            });
        }
    }

    return result;
};

// =================================
// RECURRING PAYMENT MANAGEMENT
// =================================

/**
 * Add a recurring payment.
 * @param {object} options
 *   @param {string} options.description — e.g. 'Netflix Subscription'
 *   @param {number} options.amount — monthly amount
 *   @param {string} options.sourceAccount — default 'checking'
 *   @param {string} options.linkedId — optional reference ID
 *   @param {string} options.type — 'subscription' | 'rent' | 'other'
 * @returns {{ success, payment }}
 */
FinanceService.prototype.addRecurringPayment = function(options) {
    if (!options) options = {};
    if (!this._data) return { success: false, message: 'Finance service not ready.' };
    if (!this._data.recurringPayments) this._data.recurringPayments = [];

    var payment = {
        id: 'rec-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
        type: options.type || 'other',
        description: options.description || 'Recurring payment',
        amount: options.amount || 0,
        sourceAccount: options.sourceAccount || 'checking',
        frequency: 'monthly',
        linkedId: options.linkedId || null,
        missedPayments: 0,
        status: 'active',
        created: new Date().toISOString()
    };

    this._data.recurringPayments.push(payment);
    this._save();

    this.eventBus.emit('finance.recurringPaymentAdded', {
        paymentId: payment.id,
        description: payment.description,
        amount: payment.amount
    });

    return { success: true, payment: payment };
};

/**
 * Cancel a recurring payment.
 * @param {string} paymentId
 */
FinanceService.prototype.cancelRecurringPayment = function(paymentId) {
    if (!this._data || !this._data.recurringPayments) return { success: false, message: 'No recurring payments.' };

    var payment = this._data.recurringPayments.find(function(p) { return p.id === paymentId; });
    if (!payment) return { success: false, message: 'Recurring payment not found.' };

    payment.status = 'cancelled';
    payment.cancelledDate = new Date().toISOString();
    this._save();

    this.eventBus.emit('finance.recurringPaymentCancelled', {
        paymentId: payment.id,
        description: payment.description
    });

    return { success: true, message: 'Cancelled recurring payment: ' + payment.description };
};

/**
 * Update fields on an active recurring payment (e.g., amount change after property revaluation).
 * @param {string} paymentId
 * @param {object} updates — fields to merge (e.g., { amount: 12.50 })
 * @returns {{ success, payment }}
 */
FinanceService.prototype.updateRecurringPayment = function(paymentId, updates) {
    if (!this._data || !this._data.recurringPayments) return { success: false, message: 'No recurring payments.' };
    if (!updates) return { success: false, message: 'No updates provided.' };

    var payment = this._data.recurringPayments.find(function(p) { return p.id === paymentId; });
    if (!payment) return { success: false, message: 'Recurring payment not found.' };

    // Apply allowed updates
    if (updates.amount !== undefined) payment.amount = updates.amount;
    if (updates.description !== undefined) payment.description = updates.description;
    if (updates.sourceAccount !== undefined) payment.sourceAccount = updates.sourceAccount;

    this._save();

    this.eventBus.emit('finance.recurringPaymentUpdated', {
        paymentId: payment.id,
        description: payment.description,
        updates: updates
    });

    return { success: true, payment: payment };
};

/**
 * Get all recurring payments.
 */
FinanceService.prototype.getRecurringPayments = function() {
    if (!this._data || !this._data.recurringPayments) return [];
    return JSON.parse(JSON.stringify(this._data.recurringPayments));
};

/**
 * Get active recurring payments only.
 */
FinanceService.prototype.getActiveRecurringPayments = function() {
    if (!this._data || !this._data.recurringPayments) return [];
    return this._data.recurringPayments.filter(function(p) { return p.status === 'active'; });
};

// =================================
// CYCLE LOG ACCESS
// =================================

/**
 * Get the cycle log (last N months of processing history).
 */
FinanceService.prototype.getCycleLog = function() {
    if (!this._data || !this._data.cycleLog) return [];
    return JSON.parse(JSON.stringify(this._data.cycleLog));
};

/**
 * Get the most recent cycle log entry.
 */
FinanceService.prototype.getLastCycleResult = function() {
    if (!this._data || !this._data.cycleLog || this._data.cycleLog.length === 0) return null;
    return JSON.parse(JSON.stringify(this._data.cycleLog[this._data.cycleLog.length - 1]));
};

// =================================
// FINANCIAL SUMMARY FOR CYCLE
// =================================

/**
 * Get a summary of monthly financial obligations.
 * Useful for UI display and LLM context.
 * @returns {{ totalMonthlyObligations, breakdown }}
 */
FinanceService.prototype.getMonthlyObligationsSync = function() {
    if (!this._data) return { totalMonthlyObligations: 0, breakdown: [] };

    var breakdown = [];
    var total = 0;

    // Loan payments
    var activeLoans = (this._data.loans || []).filter(function(l) { return l.status === 'active'; });
    activeLoans.forEach(function(l) {
        var typeName = (typeof LOAN_TYPES !== 'undefined' && LOAN_TYPES[l.type]) ? LOAN_TYPES[l.type].name : l.type;
        breakdown.push({
            type: 'loan',
            description: typeName + ' (' + l.id.slice(-6) + ')',
            amount: l.monthlyPayment,
            account: l.sourceAccount || 'checking'
        });
        total += l.monthlyPayment;
    });

    // Credit card minimums
    var activeCards = (this._data.creditCards || []).filter(function(c) { return c.status === 'active' && c.balance > 0; });
    activeCards.forEach(function(c) {
        var min = Math.min(c.minimumPayment, c.balance);
        breakdown.push({
            type: 'credit-card',
            description: c.name + ' minimum',
            amount: min,
            account: 'checking'
        });
        total += min;
    });

    // Recurring payments
    var activeRecurring = (this._data.recurringPayments || []).filter(function(p) { return p.status === 'active'; });
    activeRecurring.forEach(function(p) {
        breakdown.push({
            type: 'recurring',
            description: p.description,
            amount: p.amount,
            account: p.sourceAccount || 'checking'
        });
        total += p.amount;
    });

    // Property taxes (from inventory service)
    if (typeof elxaOS !== 'undefined' && elxaOS.inventoryService) {
        var taxObligations = elxaOS.inventoryService.getFinancialObligations();
        taxObligations.forEach(function(ob) {
            if (ob.type === 'property-tax' && ob.monthlyAmount) {
                breakdown.push({
                    type: 'property-tax',
                    description: ob.name,
                    amount: ob.monthlyAmount,
                    account: 'checking'
                });
                total += ob.monthlyAmount;
            }
        });

        // Vehicle insurance (owned/financed only — leased have it baked in)
        var insuredVehicles = elxaOS.inventoryService.getOwnedVehicles();
        insuredVehicles.forEach(function(v) {
            if (v.insuranceRate && v.insuranceRate > 0) {
                var currentVal = v.currentValue || v.purchasePrice || 0;
                var cost = Math.round(currentVal * v.insuranceRate * 100) / 100;
                if (cost > 0) {
                    breakdown.push({
                        type: 'vehicle-insurance',
                        description: v.name + ' insurance',
                        amount: cost,
                        account: 'checking'
                    });
                    total += cost;
                }
            }
        });
    }

    return {
        totalMonthlyObligations: Math.round(total * 100) / 100,
        breakdown: breakdown
    };
};

// =================================
// PROPERTY TAX PROCESSING (bridge to inventory service)
// =================================

/**
 * Process monthly property taxes for all owned/mortgaged properties.
 * Called by _runSingleCycle at step 6.25.
 * Follows the same pattern as other cycle steps: direct balance manipulation + _addTransaction.
 * @param {string} cycleMonth — 'YYYY-MM'
 * @returns {object} — tax processing results
 */
FinanceService.prototype._processPropertyTaxes = function(cycleMonth) {
    // If inventory service is not available, skip gracefully
    if (typeof elxaOS === 'undefined' || !elxaOS.inventoryService) {
        return { processed: 0, totalTaxPaid: 0, delinquent: [], forcedSales: [] };
    }

    var inventoryService = elxaOS.inventoryService;
    if (!inventoryService._ready) {
        return { processed: 0, totalTaxPaid: 0, delinquent: [], forcedSales: [] };
    }

    var taxableProperties = inventoryService.getOwnedProperties();
    var results = {
        processed: 0,
        totalTaxPaid: 0,
        delinquent: [],
        forcedSales: []
    };

    var checking = this._data.accounts.checking;
    if (!checking) return results;

    for (var i = 0; i < taxableProperties.length; i++) {
        var prop = taxableProperties[i];
        if (!prop.monthlyTax || prop.monthlyTax <= 0) continue;

        if (checking.balance >= prop.monthlyTax) {
            // Pay the tax — direct balance manipulation (same pattern as CC/loan payments)
            checking.balance = Math.round((checking.balance - prop.monthlyTax) * 100) / 100;

            this._addTransaction({
                type: 'property-tax',
                account: 'checking',
                amount: -prop.monthlyTax,
                description: 'Property tax: ' + prop.name + ' — ' + cycleMonth
            });

            this.eventBus.emit('finance.accountUpdated', {
                account: 'checking',
                newBalance: checking.balance
            });

            // Record in inventory — tracks totalTaxPaid and resets taxesMissed
            // (async but fire-and-forget — balance already updated synchronously)
            inventoryService.recordTaxPayment(prop.id, prop.monthlyTax);

            results.totalTaxPaid += prop.monthlyTax;
            results.processed++;

        } else {
            // Tax payment failed — insufficient funds
            this._addTransaction({
                type: 'property-tax-missed',
                account: 'checking',
                amount: 0,
                description: 'MISSED property tax: ' + prop.name + ' ($' + prop.monthlyTax.toFixed(2) + ') — insufficient funds — ' + cycleMonth
            });

            // Record missed payment in inventory (handles taxesMissed counter + forced sale at 3)
            // The method is async but updates in-memory state immediately
            inventoryService.recordMissedTaxPayment(prop.id);

            // Read the missed count directly from the property (just updated in memory)
            var missedCount = prop.taxesMissed || 1;

            if (missedCount >= 3) {
                results.forcedSales.push({ propertyId: prop.id, name: prop.name });

                // Credit score penalty for foreclosure
                this._adjustScore(-25, 'Tax foreclosure: ' + prop.name);

                this.eventBus.emit('inventory.taxForeclosure', {
                    propertyId: prop.id,
                    property: prop
                });
            } else {
                results.delinquent.push({
                    propertyId: prop.id,
                    name: prop.name,
                    missedCount: missedCount,
                    monthlyTax: prop.monthlyTax
                });

                // Graduated score penalty
                if (missedCount === 1) {
                    this._adjustScore(-5, 'Tax delinquency warning: ' + prop.name);
                } else if (missedCount === 2) {
                    this._adjustScore(-10, 'Tax delinquency penalty: ' + prop.name);
                }

                this.eventBus.emit('finance.paymentMissed', {
                    type: 'property-tax',
                    propertyId: prop.id,
                    propertyName: prop.name,
                    amount: prop.monthlyTax,
                    available: checking.balance,
                    missedCount: missedCount
                });
            }
        }
    }

    return results;
};

// =================================
// VEHICLE INSURANCE PROCESSING
// =================================

/**
 * Process monthly vehicle insurance for all owned/financed vehicles.
 * Called by _runSingleCycle at step 6.5.
 * Leased vehicles are exempt (insurance baked into lease payment).
 * 3 consecutive missed insurance payments → vehicle impounded.
 * @param {string} cycleMonth — 'YYYY-MM'
 * @returns {object} — insurance processing results
 */
FinanceService.prototype._processVehicleInsurance = function(cycleMonth) {
    if (typeof elxaOS === 'undefined' || !elxaOS.inventoryService) {
        return { processed: 0, totalPaid: 0, missed: 0, delinquent: [], impounded: [] };
    }

    var inventoryService = elxaOS.inventoryService;
    if (!inventoryService._ready) {
        return { processed: 0, totalPaid: 0, missed: 0, delinquent: [], impounded: [] };
    }

    var insuredVehicles = inventoryService.getOwnedVehicles();
    var results = {
        processed: 0,
        totalPaid: 0,
        missed: 0,
        delinquent: [],
        impounded: []
    };

    var checking = this._data.accounts.checking;
    if (!checking) return results;

    for (var i = 0; i < insuredVehicles.length; i++) {
        var vehicle = insuredVehicles[i];
        var rate = vehicle.insuranceRate || 0;
        if (rate <= 0) continue;

        var currentVal = vehicle.currentValue || vehicle.purchasePrice || 0;
        var insuranceCost = Math.round(currentVal * rate * 100) / 100;
        if (insuranceCost < 0.01) continue;

        if (checking.balance >= insuranceCost) {
            // Pay insurance
            checking.balance = Math.round((checking.balance - insuranceCost) * 100) / 100;

            this._addTransaction({
                type: 'vehicle-insurance',
                account: 'checking',
                amount: -insuranceCost,
                description: 'Vehicle insurance: ' + vehicle.name + ' — ' + cycleMonth
            });

            this.eventBus.emit('finance.accountUpdated', {
                account: 'checking',
                newBalance: checking.balance
            });

            inventoryService.recordInsurancePayment(vehicle.id, insuranceCost);
            results.totalPaid += insuranceCost;
            results.processed++;

        } else {
            // Missed insurance payment
            this._addTransaction({
                type: 'vehicle-insurance-missed',
                account: 'checking',
                amount: 0,
                description: 'MISSED vehicle insurance: ' + vehicle.name + ' ($' + insuranceCost.toFixed(2) + ') — insufficient funds — ' + cycleMonth
            });

            var missedCount = vehicle.insuranceMissed || 0;
            missedCount++;

            if (missedCount >= 3) {
                // Impound — inventoryService handles the removal + event
                inventoryService.recordMissedInsurancePayment(vehicle.id);
                results.impounded.push({ vehicleId: vehicle.id, name: vehicle.name });
                this._adjustScore(-25, 'Vehicle impounded: ' + vehicle.name);
            } else {
                inventoryService.recordMissedInsurancePayment(vehicle.id);
                results.delinquent.push({
                    vehicleId: vehicle.id,
                    name: vehicle.name,
                    missedCount: missedCount,
                    insuranceCost: insuranceCost
                });

                // Graduated score penalty
                if (missedCount === 1) {
                    this._adjustScore(-5, 'Insurance delinquency warning: ' + vehicle.name);
                } else if (missedCount === 2) {
                    this._adjustScore(-10, 'Insurance delinquency penalty: ' + vehicle.name);
                }

                this.eventBus.emit('finance.paymentMissed', {
                    type: 'vehicle-insurance',
                    vehicleId: vehicle.id,
                    vehicleName: vehicle.name,
                    amount: insuranceCost,
                    available: checking.balance,
                    missedCount: missedCount
                });
            }

            results.missed++;
        }
    }

    return results;
};

// =================================
// VEHICLE DEPRECIATION PROCESSING
// =================================

/**
 * Apply monthly depreciation to all owned/financed vehicles.
 * Called by _runSingleCycle at step 6.75.
 * Compound depreciation: newValue = currentValue * (1 - depreciationRate)
 * Floor at 20% of purchase price.
 * Leased vehicles also depreciate (affects return/sell value).
 * @param {string} cycleMonth — 'YYYY-MM'
 * @returns {object} — depreciation processing results
 */
FinanceService.prototype._processVehicleDepreciation = function(cycleMonth) {
    if (typeof elxaOS === 'undefined' || !elxaOS.inventoryService) {
        return { processed: 0, totalDepreciation: 0 };
    }

    var inventoryService = elxaOS.inventoryService;
    if (!inventoryService._ready) {
        return { processed: 0, totalDepreciation: 0 };
    }

    // All vehicles depreciate (owned, financed, AND leased)
    var allVehicles = inventoryService.getVehicles();
    var results = { processed: 0, totalDepreciation: 0 };

    for (var i = 0; i < allVehicles.length; i++) {
        var vehicle = allVehicles[i];
        var rate = vehicle.depreciationRate || 0;
        if (rate <= 0) continue;

        var currentVal = vehicle.currentValue || vehicle.purchasePrice || 0;
        var purchasePrice = vehicle.purchasePrice || 0;
        var floor = purchasePrice * 0.20;

        // Already at floor — skip
        if (currentVal <= floor) continue;

        var newValue = currentVal * (1 - rate);
        newValue = Math.max(Math.round(newValue * 100) / 100, floor);
        var lost = currentVal - newValue;

        if (lost < 0.01) continue;

        inventoryService.applyDepreciation(vehicle.id, newValue);
        results.totalDepreciation += lost;
        results.processed++;
    }

    return results;
};
