// =================================
// FINANCE SERVICE — Loan System
// Personal loans, auto loans, mortgages
// Credit-score-gated approval, amortization, payments
// =================================

// =================================
// LOAN TYPE DEFINITIONS
// =================================
const LOAN_TYPES = {
    personal: {
        key: 'personal',
        name: 'Personal Loan',
        requiredScore: 500,
        requiredRating: 'Fair',
        amountRange: [100, 2000],
        baseApr: 20,
        aprRange: 8,
        termRange: [6, 24],
        maxActive: 2,
        description: 'Quick cash for whatever you need. Higher rates, shorter terms.'
    },
    auto: {
        key: 'auto',
        name: 'Auto Loan',
        requiredScore: 580,
        requiredRating: 'Good',
        amountRange: [500, 300000],
        baseApr: 12,
        aprRange: 6,
        termRange: [12, 60],
        maxActive: 3,
        description: 'Finance your next ride. Moderate rates with flexible terms.'
    },
    mortgage: {
        key: 'mortgage',
        name: 'Mortgage',
        requiredScore: 670,
        requiredRating: 'Very Good',
        amountRange: [5000, 1200000],
        baseApr: 8,
        aprRange: 4,
        termRange: [36, 120],
        maxActive: 2,
        description: 'Own your dream home in Snakesia. Best rates for great credit.'
    }
};

// =================================
// MORTGAGE SCORE TIERS
// Max mortgage amount based on credit score bracket.
// =================================
const MORTGAGE_TIERS = [
    { minScore: 790, maxAmount: 1200000, label: 'Elite' },
    { minScore: 760, maxAmount: 700000,  label: 'Premium' },
    { minScore: 730, maxAmount: 400000,  label: 'Standard Plus' },
    { minScore: 700, maxAmount: 150000,  label: 'Standard' },
    { minScore: 670, maxAmount: 60000,   label: 'Entry' }
];

// =================================
// AUTO LOAN SCORE TIERS
// Max auto loan amount based on credit score bracket.
// =================================
const AUTO_LOAN_TIERS = [
    { minScore: 760, maxAmount: 300000, label: 'Elite' },
    { minScore: 720, maxAmount: 100000, label: 'Premium' },
    { minScore: 670, maxAmount: 40000,  label: 'Standard Plus' },
    { minScore: 630, maxAmount: 15000,  label: 'Standard' },
    { minScore: 580, maxAmount: 5000,   label: 'Starter' }
];

// =================================
// LOAN QUERIES
// =================================

/**
 * Get all loans for the current user.
 */
FinanceService.prototype.getLoans = async function() {
    await this._ensureReady();
    return JSON.parse(JSON.stringify(this._data.loans || []));
};

/**
 * Synchronous version for UI display.
 */
FinanceService.prototype.getLoansSync = function() {
    if (!this._data) return [];
    return JSON.parse(JSON.stringify(this._data.loans || []));
};

/**
 * Get a single loan by ID.
 */
FinanceService.prototype.getLoan = async function(loanId) {
    await this._ensureReady();
    return (this._data.loans || []).find(l => l.id === loanId) || null;
};

/**
 * Get loan summary for display.
 * @returns {{ loans[], totalOwed, totalMonthlyPayments, activeLoanCount }}
 */
FinanceService.prototype.getLoanSummarySync = function() {
    if (!this._data || !this._data.loans) return { loans: [], totalOwed: 0, totalMonthlyPayments: 0, activeLoanCount: 0 };
    const active = this._data.loans.filter(l => l.status === 'active');
    return {
        loans: active.map(l => ({
            id: l.id,
            type: l.type,
            typeName: LOAN_TYPES[l.type]?.name || l.type,
            principal: l.principal,
            remainingBalance: l.remainingBalance,
            apr: l.apr,
            monthlyPayment: l.monthlyPayment,
            termMonths: l.termMonths,
            paidMonths: l.paidMonths,
            remainingMonths: l.termMonths - l.paidMonths,
            dueDay: l.dueDay,
            sourceAccount: l.sourceAccount,
            linkedAsset: l.linkedAsset,
            opened: l.opened,
            status: l.status
        })),
        totalOwed: active.reduce((sum, l) => sum + l.remainingBalance, 0),
        totalMonthlyPayments: active.reduce((sum, l) => sum + l.monthlyPayment, 0),
        activeLoanCount: active.length
    };
};

// =================================
// LOAN TYPE INFO
// =================================

/**
 * Get all loan type definitions.
 */
FinanceService.prototype.getLoanTypes = function() {
    return JSON.parse(JSON.stringify(LOAN_TYPES));
};

/**
 * Get loan types annotated with eligibility for the current user.
 * @returns {array} — types with eligible, reason, maxApprovedAmount, estimatedApr
 */
FinanceService.prototype.getAvailableLoanTypesSync = function() {
    const score = this._data?.creditScore?.score || 0;
    const activeLoans = (this._data?.loans || []).filter(l => l.status === 'active');

    return Object.values(LOAN_TYPES).map(ltype => {
        const activeOfType = activeLoans.filter(l => l.type === ltype.key).length;
        const atMax = activeOfType >= ltype.maxActive;
        const eligible = score >= ltype.requiredScore && !atMax;

        let reason = null;
        if (atMax) {
            reason = 'Maximum ' + ltype.maxActive + ' active ' + ltype.name.toLowerCase() + (ltype.maxActive > 1 ? 's' : '') + ' reached.';
        } else if (score < ltype.requiredScore) {
            reason = 'Requires ' + ltype.requiredRating + ' credit (' + ltype.requiredScore + '+). Your score: ' + score + '.';
        }

        const terms = this._calculateLoanTerms(ltype, score);

        return {
            ...ltype,
            eligible,
            atMax,
            activeOfType,
            reason,
            maxApprovedAmount: terms.maxAmount,
            estimatedApr: terms.apr,
            estimatedMonthlyPayment: terms.sampleMonthlyPayment,
            sampleAmount: terms.sampleAmount,
            sampleTerm: terms.sampleTerm
        };
    });
};

// =================================
// MORTGAGE HELPERS (for Mallard Realty)
// =================================

/**
 * Get the maximum mortgage amount for a given credit score.
 * Used by Mallard Realty to show affordability without a full application.
 * @param {number} score — optional, uses current user score if omitted
 * @returns {{ eligible, maxAmount, tierLabel, score, apr, allTiers }}
 */
FinanceService.prototype.getMortgageMaxForScore = function(score) {
    if (score === undefined || score === null) {
        score = this._data?.creditScore?.score || 0;
    }

    var mortgage = LOAN_TYPES.mortgage;
    if (score < mortgage.requiredScore) {
        return {
            eligible: false,
            maxAmount: 0,
            tierLabel: null,
            score: score,
            requiredScore: mortgage.requiredScore,
            apr: 0,
            allTiers: MORTGAGE_TIERS.map(function(t) { return { minScore: t.minScore, maxAmount: t.maxAmount, label: t.label }; })
        };
    }

    var terms = this._calculateLoanTerms(mortgage, score);
    return {
        eligible: true,
        maxAmount: terms.maxAmount,
        tierLabel: terms.tierLabel,
        score: score,
        apr: terms.apr,
        allTiers: MORTGAGE_TIERS.map(function(t) { return { minScore: t.minScore, maxAmount: t.maxAmount, label: t.label }; })
    };
};

// =================================
// AUTO LOAN HELPERS (for Pato & Sons Auto)
// =================================

/**
 * Get the maximum auto loan amount for a given credit score.
 * Used by Pato & Sons Auto to show affordability without a full application.
 * @param {number} score — optional, uses current user score if omitted
 * @returns {{ eligible, maxAmount, tierLabel, score, apr, allTiers }}
 */
FinanceService.prototype.getAutoLoanMaxForScore = function(score) {
    if (score === undefined || score === null) {
        score = this._data?.creditScore?.score || 0;
    }

    var auto = LOAN_TYPES.auto;
    if (score < auto.requiredScore) {
        return {
            eligible: false,
            maxAmount: 0,
            tierLabel: null,
            score: score,
            requiredScore: auto.requiredScore,
            apr: 0,
            allTiers: AUTO_LOAN_TIERS.map(function(t) { return { minScore: t.minScore, maxAmount: t.maxAmount, label: t.label }; })
        };
    }

    var terms = this._calculateLoanTerms(auto, score);
    return {
        eligible: true,
        maxAmount: terms.maxAmount,
        tierLabel: terms.tierLabel,
        score: score,
        apr: terms.apr,
        allTiers: AUTO_LOAN_TIERS.map(function(t) { return { minScore: t.minScore, maxAmount: t.maxAmount, label: t.label }; })
    };
};

// =================================
// LOAN MATH
// =================================

/**
 * Calculate personalized loan terms based on credit score.
 * Higher score = higher max amount, lower APR.
 */
FinanceService.prototype._calculateLoanTerms = function(ltype, score) {
    if (score < ltype.requiredScore) {
        return {
            maxAmount: 0,
            apr: ltype.baseApr + ltype.aprRange,
            sampleMonthlyPayment: 0,
            sampleAmount: ltype.amountRange[0],
            sampleTerm: ltype.termRange[0]
        };
    }

    // --- Mortgage: use score-tiered max amounts ---
    if (ltype.key === 'mortgage') {
        var maxAmount = MORTGAGE_TIERS[MORTGAGE_TIERS.length - 1].maxAmount; // lowest tier default
        var tierLabel = MORTGAGE_TIERS[MORTGAGE_TIERS.length - 1].label;
        for (var i = 0; i < MORTGAGE_TIERS.length; i++) {
            if (score >= MORTGAGE_TIERS[i].minScore) {
                maxAmount = MORTGAGE_TIERS[i].maxAmount;
                tierLabel = MORTGAGE_TIERS[i].label;
                break;
            }
        }

        // APR still scales with score (higher score = lower rate)
        var range = 850 - ltype.requiredScore;
        var progress = range > 0 ? Math.min((score - ltype.requiredScore) / range, 1) : 1;
        var apr = Math.round((ltype.baseApr - (ltype.aprRange * progress)) * 100) / 100;

        var sampleAmount = Math.round(Math.min(maxAmount * 0.7, maxAmount));
        var sampleTerm = Math.round((ltype.termRange[0] + ltype.termRange[1]) / 2);
        var sampleMonthlyPayment = this._calculateMonthlyPayment(sampleAmount, apr, sampleTerm);

        return { maxAmount: maxAmount, apr: apr, sampleMonthlyPayment: sampleMonthlyPayment, sampleAmount: sampleAmount, sampleTerm: sampleTerm, tierLabel: tierLabel };
    }

    // --- Auto loan: use score-tiered max amounts ---
    if (ltype.key === 'auto') {
        var maxAmount = AUTO_LOAN_TIERS[AUTO_LOAN_TIERS.length - 1].maxAmount; // lowest tier default
        var tierLabel = AUTO_LOAN_TIERS[AUTO_LOAN_TIERS.length - 1].label;
        for (var i = 0; i < AUTO_LOAN_TIERS.length; i++) {
            if (score >= AUTO_LOAN_TIERS[i].minScore) {
                maxAmount = AUTO_LOAN_TIERS[i].maxAmount;
                tierLabel = AUTO_LOAN_TIERS[i].label;
                break;
            }
        }

        // APR still scales with score (higher score = lower rate)
        var range = 850 - ltype.requiredScore;
        var progress = range > 0 ? Math.min((score - ltype.requiredScore) / range, 1) : 1;
        var apr = Math.round((ltype.baseApr - (ltype.aprRange * progress)) * 100) / 100;

        var sampleAmount = Math.round(Math.min(maxAmount * 0.7, maxAmount));
        var sampleTerm = Math.round((ltype.termRange[0] + ltype.termRange[1]) / 2);
        var sampleMonthlyPayment = this._calculateMonthlyPayment(sampleAmount, apr, sampleTerm);

        return { maxAmount: maxAmount, apr: apr, sampleMonthlyPayment: sampleMonthlyPayment, sampleAmount: sampleAmount, sampleTerm: sampleTerm, tierLabel: tierLabel };
    }

    // --- All other loan types: linear interpolation ---
    // Progress within the qualifying range: requiredScore -> 850
    var range = 850 - ltype.requiredScore;
    var progress = range > 0 ? Math.min((score - ltype.requiredScore) / range, 1) : 1;

    // Higher progress = higher max amount
    var maxAmount = Math.round(ltype.amountRange[0] + (ltype.amountRange[1] - ltype.amountRange[0]) * progress);

    // Higher progress = lower APR
    var apr = Math.round((ltype.baseApr - (ltype.aprRange * progress)) * 100) / 100;

    // Sample: middle of the amount range, middle of the term range
    var sampleAmount = Math.round(maxAmount * 0.7);
    var sampleTerm = Math.round((ltype.termRange[0] + ltype.termRange[1]) / 2);
    var sampleMonthlyPayment = this._calculateMonthlyPayment(sampleAmount, apr, sampleTerm);

    return { maxAmount: maxAmount, apr: apr, sampleMonthlyPayment: sampleMonthlyPayment, sampleAmount: sampleAmount, sampleTerm: sampleTerm };
};

/**
 * Standard amortization formula.
 * M = P * [r(1+r)^n] / [(1+r)^n - 1]
 * @param {number} principal — loan amount
 * @param {number} annualRate — APR as a percentage (e.g. 12.5)
 * @param {number} termMonths — number of months
 * @returns {number} — monthly payment rounded to 2 decimals
 */
FinanceService.prototype._calculateMonthlyPayment = function(principal, annualRate, termMonths) {
    if (principal <= 0 || termMonths <= 0) return 0;
    if (annualRate <= 0) return Math.round((principal / termMonths) * 100) / 100;

    const r = (annualRate / 100) / 12; // monthly rate
    const n = termMonths;
    const factor = Math.pow(1 + r, n);
    const payment = principal * (r * factor) / (factor - 1);
    return Math.round(payment * 100) / 100;
};

/**
 * Calculate total interest paid over the life of a loan.
 */
FinanceService.prototype._calculateTotalInterest = function(principal, monthlyPayment, termMonths) {
    return Math.round((monthlyPayment * termMonths - principal) * 100) / 100;
};

// =================================
// LOAN APPLICATION
// =================================

/**
 * Apply for a loan. Checks credit score, calculates terms, creates loan if approved.
 *
 * @param {object} options
 *   @param {string} options.type — 'personal' | 'auto' | 'mortgage'
 *   @param {number} options.amount — requested loan amount
 *   @param {number} options.termMonths — requested term (must be within type's range)
 *   @param {string} options.sourceAccount — account for payments (default: 'checking')
 *   @param {object} options.linkedAsset — optional { type: 'property', id: N } for mortgages
 *   @param {string} options.purpose — optional description (e.g. '14 Maple Heights')
 * @returns {{ success, approved, message, loan?, terms?, reason?, tips? }}
 */
FinanceService.prototype.applyForLoan = async function(options) {
    if (!options) options = {};
    await this._ensureReady();

    const ltype = LOAN_TYPES[options.type];
    if (!ltype) {
        return { success: false, approved: false, message: 'Unknown loan type: ' + options.type };
    }

    const score = this._data.creditScore?.score || 0;
    const activeLoans = (this._data.loans || []).filter(l => l.status === 'active');
    const activeOfType = activeLoans.filter(l => l.type === options.type).length;
    const amount = options.amount || ltype.amountRange[0];
    const sourceAccount = options.sourceAccount || 'checking';

    // Always add a hard inquiry
    this._addHardInquiry(ltype.name + ' application');

    this._addTransaction({
        type: 'loan-application',
        account: 'loan',
        amount: 0,
        description: 'Applied for ' + ltype.name + ': $' + amount.toFixed(2)
    });

    // Check: max active loans of this type
    if (activeOfType >= ltype.maxActive) {
        this._addTransaction({
            type: 'loan-application-denied',
            account: 'loan',
            amount: 0,
            description: 'Denied: ' + ltype.name + ' — max active reached'
        });
        await this._save();
        return {
            success: true,
            approved: false,
            message: 'Application denied. You already have ' + activeOfType + ' active ' + ltype.name.toLowerCase() + (activeOfType > 1 ? 's' : '') + '. Pay off an existing loan to apply for a new one.',
            reason: 'max_loans'
        };
    }

    // Check: credit score
    if (score < ltype.requiredScore) {
        this._addTransaction({
            type: 'loan-application-denied',
            account: 'loan',
            amount: 0,
            description: 'Denied: ' + ltype.name + ' — score ' + score + ' below ' + ltype.requiredScore
        });
        await this._save();

        var tips = [];
        if (score < 500) {
            tips.push('Your score is below 500. Focus on making on-time payments to rebuild.');
        }
        var utilization = this.getCreditUtilizationSync();
        if (utilization.percentage > 30) {
            tips.push('Pay down credit card balances to below 30% of your limits.');
        }
        tips.push('Keep making on-time payments — your score will improve over time.');

        return {
            success: true,
            approved: false,
            message: 'Application denied. Your credit score of ' + score + ' does not meet the minimum of ' + ltype.requiredScore + ' (' + ltype.requiredRating + ') for a ' + ltype.name + '.',
            reason: 'low_score',
            currentScore: score,
            requiredScore: ltype.requiredScore,
            tips: tips
        };
    }

    // Calculate personalized terms
    var terms = this._calculateLoanTerms(ltype, score);

    // Check: requested amount within approved range
    if (amount > terms.maxAmount) {
        this._addTransaction({
            type: 'loan-application-denied',
            account: 'loan',
            amount: 0,
            description: 'Denied: ' + ltype.name + ' $' + amount.toFixed(2) + ' — exceeds max $' + terms.maxAmount.toFixed(2)
        });
        await this._save();
        return {
            success: true,
            approved: false,
            message: 'Application denied. Based on your credit score of ' + score + ', the maximum ' + ltype.name.toLowerCase() + ' amount is $' + terms.maxAmount.toFixed(2) + '. You requested $' + amount.toFixed(2) + '.',
            reason: 'amount_too_high',
            maxApprovedAmount: terms.maxAmount,
            requestedAmount: amount,
            tips: ['Improve your credit score to qualify for larger loan amounts.', 'Consider applying for a smaller amount within your approved range.']
        };
    }

    // Check: requested amount within type minimums
    if (amount < ltype.amountRange[0]) {
        return {
            success: false,
            approved: false,
            message: 'Minimum ' + ltype.name.toLowerCase() + ' amount is $' + ltype.amountRange[0].toFixed(2) + '.'
        };
    }

    // Validate term
    var termMonths = options.termMonths || Math.round((ltype.termRange[0] + ltype.termRange[1]) / 2);
    if (termMonths < ltype.termRange[0] || termMonths > ltype.termRange[1]) {
        return {
            success: false,
            approved: false,
            message: ltype.name + ' terms must be between ' + ltype.termRange[0] + ' and ' + ltype.termRange[1] + ' months.'
        };
    }

    // APPROVED — create the loan
    var monthlyPayment = this._calculateMonthlyPayment(amount, terms.apr, termMonths);
    var totalInterest = this._calculateTotalInterest(amount, monthlyPayment, termMonths);

    var result = await this._createLoanRecord({
        type: options.type,
        principal: amount,
        apr: terms.apr,
        termMonths: termMonths,
        monthlyPayment: monthlyPayment,
        sourceAccount: sourceAccount,
        linkedAsset: options.linkedAsset || null,
        purpose: options.purpose || ltype.name
    });

    if (result.success) {
        // Deposit the loan amount into the source account (you receive the money!)
        this._data.accounts[sourceAccount].balance += amount;

        this._addTransaction({
            type: 'loan-disbursement',
            account: sourceAccount,
            amount: amount,
            description: ltype.name + ' disbursement: $' + amount.toFixed(2) + ' (Loan ' + result.loan.id.slice(-6) + ')'
        });

        await this._save();

        this.eventBus.emit('finance.accountUpdated', {
            account: sourceAccount,
            newBalance: this._data.accounts[sourceAccount].balance
        });

        console.log('\ud83c\udfe6 ' + ltype.name + ' APPROVED for score ' + score + ': $' + amount.toFixed(2) + ' at ' + terms.apr + '% for ' + termMonths + 'mo ($' + monthlyPayment + '/mo)');

        return {
            success: true,
            approved: true,
            message: 'Congratulations! Your ' + ltype.name + ' has been approved!',
            loan: result.loan,
            terms: {
                principal: amount,
                apr: terms.apr,
                termMonths: termMonths,
                monthlyPayment: monthlyPayment,
                totalInterest: totalInterest,
                totalCost: amount + totalInterest,
                sourceAccount: sourceAccount,
                linkedAsset: options.linkedAsset || null
            }
        };
    }

    return { success: false, approved: false, message: 'An error occurred processing your loan application.' };
};

// =================================
// LOAN CREATION (internal)
// =================================

/**
 * Create a loan record. Internal — use applyForLoan() for the user-facing flow.
 */
FinanceService.prototype._createLoanRecord = async function(options) {
    if (!options) options = {};
    await this._ensureReady();

    if (!this._data.loans) this._data.loans = [];

    var loan = {
        id: 'loan-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
        type: options.type,
        principal: options.principal,
        apr: options.apr,
        termMonths: options.termMonths,
        monthlyPayment: options.monthlyPayment,
        remainingBalance: options.principal,
        paidMonths: 0,
        totalPaid: 0,
        linkedAsset: options.linkedAsset || null,
        purpose: options.purpose || '',
        sourceAccount: options.sourceAccount || 'checking',
        dueDay: 1,
        status: 'active',
        missedPayments: 0,
        opened: new Date().toISOString()
    };

    this._data.loans.push(loan);

    this._addTransaction({
        type: 'loan-opened',
        account: 'loan',
        amount: -options.principal,
        description: 'Opened ' + (LOAN_TYPES[options.type]?.name || options.type) + ': $' + options.principal.toFixed(2) + ' at ' + options.apr + '% for ' + options.termMonths + ' months'
    });

    await this._save();

    this.eventBus.emit('finance.loanCreated', {
        loanId: loan.id,
        type: loan.type,
        principal: loan.principal,
        monthlyPayment: loan.monthlyPayment,
        apr: loan.apr,
        termMonths: loan.termMonths,
        purpose: loan.purpose,
        linkedAsset: loan.linkedAsset
    });

    return { success: true, loan: { ...loan } };
};

// =================================
// LOAN PAYMENTS
// =================================

/**
 * Make a payment toward a loan.
 * @param {string} loanId
 * @param {number} amount — payment amount (if omitted, pays the monthly payment)
 * @param {string} fromAccount — 'checking' | 'savings' (default: loan's sourceAccount)
 * @returns {{ success, message, remainingBalance, paidOff }}
 */
FinanceService.prototype.payLoan = async function(loanId, amount, fromAccount) {
    await this._ensureReady();

    var loan = (this._data.loans || []).find(function(l) { return l.id === loanId; });
    if (!loan) return { success: false, message: 'Loan not found.' };
    if (loan.status !== 'active') return { success: false, message: 'Loan is ' + loan.status + '.' };

    if (!fromAccount) fromAccount = loan.sourceAccount || 'checking';
    if (!amount) amount = loan.monthlyPayment;
    if (amount <= 0) return { success: false, message: 'Payment amount must be greater than zero.' };

    // Check funds
    if (!this._data.accounts[fromAccount]) {
        return { success: false, message: 'Invalid account: ' + fromAccount };
    }
    if (this._data.accounts[fromAccount].balance < amount) {
        return {
            success: false,
            message: 'Insufficient funds in ' + fromAccount + '. Available: $' + this._data.accounts[fromAccount].balance.toFixed(2)
        };
    }

    // Cap payment at remaining balance
    var payAmount = Math.min(amount, loan.remainingBalance);
    if (payAmount <= 0) {
        return { success: true, message: 'Loan is already paid off.', remainingBalance: 0, paidOff: true };
    }

    // Process the payment
    this._data.accounts[fromAccount].balance -= payAmount;
    loan.remainingBalance = Math.round((loan.remainingBalance - payAmount) * 100) / 100;
    loan.totalPaid += payAmount;

    // Count as a monthly payment if >= the monthly payment amount
    if (payAmount >= loan.monthlyPayment) {
        loan.paidMonths++;
        loan.missedPayments = 0; // reset consecutive misses on payment
    }

    var isExtra = payAmount > loan.monthlyPayment;
    var loanTypeName = LOAN_TYPES[loan.type]?.name || loan.type;

    this._addTransaction({
        type: 'loan-payment',
        account: fromAccount,
        amount: -payAmount,
        description: loanTypeName + ' payment' + (isExtra ? ' (extra)' : '') + ': $' + payAmount.toFixed(2) + ' (Loan ' + loan.id.slice(-6) + ')'
    });

    // Credit score boost for on-time payment
    var scoreBoost = Math.floor(Math.random() * 6) + 5; // +5 to +10
    if (isExtra) scoreBoost += Math.floor(Math.random() * 4) + 2; // extra +2 to +5 for overpayment
    this._adjustScore(scoreBoost, 'On-time ' + loanTypeName.toLowerCase() + ' payment');

    var paidOff = loan.remainingBalance <= 0;

    if (paidOff) {
        loan.remainingBalance = 0;
        loan.status = 'paid';
        loan.paidOffDate = new Date().toISOString();

        // Big score boost for paying off a loan
        var payoffBoost = Math.floor(Math.random() * 11) + 15; // +15 to +25
        this._adjustScore(payoffBoost, 'Paid off ' + loanTypeName.toLowerCase());

        this._addTransaction({
            type: 'loan-paid-off',
            account: 'loan',
            amount: 0,
            description: loanTypeName + ' PAID OFF! (Loan ' + loan.id.slice(-6) + ')'
        });

        this.eventBus.emit('finance.loanPaidOff', {
            loanId: loan.id,
            type: loan.type,
            totalPaid: loan.totalPaid
        });
    }

    await this._save();

    this.eventBus.emit('finance.loanPayment', {
        loanId: loan.id,
        type: loan.type,
        amount: payAmount,
        remainingBalance: loan.remainingBalance,
        paidMonths: loan.paidMonths,
        fromAccount: fromAccount,
        isExtra: isExtra
    });
    this.eventBus.emit('finance.accountUpdated', {
        account: fromAccount,
        newBalance: this._data.accounts[fromAccount].balance
    });

    var msg;
    if (paidOff) {
        msg = loanTypeName + ' PAID OFF! Total paid: $' + loan.totalPaid.toFixed(2) + '. Congratulations!';
    } else {
        msg = 'Paid $' + payAmount.toFixed(2) + ' toward ' + loanTypeName + '. Remaining: $' + loan.remainingBalance.toFixed(2) + ' (' + (loan.termMonths - loan.paidMonths) + ' months left).';
    }

    return {
        success: true,
        message: msg,
        remainingBalance: loan.remainingBalance,
        paidOff: paidOff,
        paidMonths: loan.paidMonths
    };
};

/**
 * Synchronous loan payment — for bank website UI compatibility.
 */
FinanceService.prototype.payLoanSync = function(loanId, amount, fromAccount) {
    if (!this._data) return { success: false, message: 'Finance service not ready.' };

    var loan = (this._data.loans || []).find(function(l) { return l.id === loanId; });
    if (!loan) return { success: false, message: 'Loan not found.' };
    if (loan.status !== 'active') return { success: false, message: 'Loan is ' + loan.status + '.' };

    if (!fromAccount) fromAccount = loan.sourceAccount || 'checking';
    if (!amount) amount = loan.monthlyPayment;
    if (amount <= 0) return { success: false, message: 'Payment amount must be greater than zero.' };

    if (!this._data.accounts[fromAccount]) {
        return { success: false, message: 'Invalid account: ' + fromAccount };
    }
    if (this._data.accounts[fromAccount].balance < amount) {
        return {
            success: false,
            message: 'Insufficient funds in ' + fromAccount + '. Available: $' + this._data.accounts[fromAccount].balance.toFixed(2)
        };
    }

    var payAmount = Math.min(amount, loan.remainingBalance);
    if (payAmount <= 0) {
        return { success: true, message: 'Loan is already paid off.', remainingBalance: 0, paidOff: true };
    }

    this._data.accounts[fromAccount].balance -= payAmount;
    loan.remainingBalance = Math.round((loan.remainingBalance - payAmount) * 100) / 100;
    loan.totalPaid += payAmount;

    if (payAmount >= loan.monthlyPayment) {
        loan.paidMonths++;
        loan.missedPayments = 0;
    }

    var isExtra = payAmount > loan.monthlyPayment;
    var loanTypeName = LOAN_TYPES[loan.type]?.name || loan.type;

    this._addTransaction({
        type: 'loan-payment',
        account: fromAccount,
        amount: -payAmount,
        description: loanTypeName + ' payment' + (isExtra ? ' (extra)' : '') + ': $' + payAmount.toFixed(2) + ' (Loan ' + loan.id.slice(-6) + ')'
    });

    var scoreBoost = Math.floor(Math.random() * 6) + 5;
    if (isExtra) scoreBoost += Math.floor(Math.random() * 4) + 2;
    this._adjustScore(scoreBoost, 'On-time ' + loanTypeName.toLowerCase() + ' payment');

    var paidOff = loan.remainingBalance <= 0;
    if (paidOff) {
        loan.remainingBalance = 0;
        loan.status = 'paid';
        loan.paidOffDate = new Date().toISOString();
        var payoffBoost = Math.floor(Math.random() * 11) + 15;
        this._adjustScore(payoffBoost, 'Paid off ' + loanTypeName.toLowerCase());

        this._addTransaction({
            type: 'loan-paid-off',
            account: 'loan',
            amount: 0,
            description: loanTypeName + ' PAID OFF! (Loan ' + loan.id.slice(-6) + ')'
        });

        this.eventBus.emit('finance.loanPaidOff', {
            loanId: loan.id,
            type: loan.type,
            totalPaid: loan.totalPaid
        });
    }

    this._save();

    this.eventBus.emit('finance.loanPayment', {
        loanId: loan.id,
        type: loan.type,
        amount: payAmount,
        remainingBalance: loan.remainingBalance,
        paidMonths: loan.paidMonths,
        fromAccount: fromAccount,
        isExtra: isExtra
    });
    this.eventBus.emit('finance.accountUpdated', {
        account: fromAccount,
        newBalance: this._data.accounts[fromAccount].balance
    });

    var msg;
    if (paidOff) {
        msg = loanTypeName + ' PAID OFF! Total paid: $' + loan.totalPaid.toFixed(2) + '.';
    } else {
        msg = 'Paid $' + payAmount.toFixed(2) + ' toward ' + loanTypeName + '. Remaining: $' + loan.remainingBalance.toFixed(2) + '.';
    }

    return {
        success: true,
        message: msg,
        remainingBalance: loan.remainingBalance,
        paidOff: paidOff,
        paidMonths: loan.paidMonths
    };
};

// =================================
// LOAN MANAGEMENT
// =================================

/**
 * Process a monthly loan payment (called by the monthly cycle engine).
 * Deducts from source account. If insufficient funds, records a missed payment.
 * @param {string} loanId
 * @returns {{ success, paid, missed, message }}
 */
FinanceService.prototype.processMonthlyLoanPayment = function(loanId) {
    if (!this._data) return { success: false, paid: false, missed: false, message: 'Not ready.' };

    var loan = (this._data.loans || []).find(function(l) { return l.id === loanId; });
    if (!loan || loan.status !== 'active') return { success: false, paid: false, missed: false, message: 'Loan not active.' };

    var account = loan.sourceAccount || 'checking';
    var payment = loan.monthlyPayment;

    // Check if they have enough
    if (this._data.accounts[account] && this._data.accounts[account].balance >= payment) {
        // Process the payment
        var result = this.payLoanSync(loanId, payment, account);
        return { success: true, paid: true, missed: false, message: result.message, paidOff: result.paidOff };
    }

    // MISSED PAYMENT
    loan.missedPayments++;
    var loanTypeName = LOAN_TYPES[loan.type]?.name || loan.type;

    // Late fee: $25 for first miss, $50 for subsequent
    var lateFee = loan.missedPayments === 1 ? 25 : 50;
    loan.remainingBalance += lateFee;

    this._addTransaction({
        type: 'loan-missed-payment',
        account: 'loan',
        amount: -lateFee,
        description: 'MISSED ' + loanTypeName + ' payment + $' + lateFee.toFixed(2) + ' late fee (Loan ' + loan.id.slice(-6) + ', miss #' + loan.missedPayments + ')'
    });

    // Credit score hit for missed payment
    var scorePenalty = -(Math.floor(Math.random() * 11) + 15); // -15 to -25
    this._adjustScore(scorePenalty, 'Missed ' + loanTypeName.toLowerCase() + ' payment');

    // Check for default (3 consecutive misses)
    if (loan.missedPayments >= 3) {
        loan.status = 'defaulted';
        loan.defaultedDate = new Date().toISOString();

        // Catastrophic score hit
        this._adjustScore(-(Math.floor(Math.random() * 51) + 50), 'Defaulted on ' + loanTypeName.toLowerCase());

        this._addTransaction({
            type: 'loan-defaulted',
            account: 'loan',
            amount: 0,
            description: loanTypeName + ' DEFAULTED after 3 missed payments (Loan ' + loan.id.slice(-6) + ')'
        });

        this.eventBus.emit('finance.loanDefaulted', {
            loanId: loan.id,
            type: loan.type,
            remainingBalance: loan.remainingBalance,
            linkedAsset: loan.linkedAsset
        });

        this._save();

        return {
            success: true,
            paid: false,
            missed: true,
            defaulted: true,
            message: loanTypeName + ' has DEFAULTED after 3 consecutive missed payments. Remaining balance: $' + loan.remainingBalance.toFixed(2) + '.',
            missedPayments: loan.missedPayments
        };
    }

    this.eventBus.emit('finance.paymentMissed', {
        type: 'loan',
        loanId: loan.id,
        loanType: loan.type,
        amount: payment,
        lateFee: lateFee,
        missedPayments: loan.missedPayments,
        available: this._data.accounts[account]?.balance || 0
    });

    this._save();

    return {
        success: true,
        paid: false,
        missed: true,
        defaulted: false,
        message: 'MISSED ' + loanTypeName + ' payment. Late fee of $' + lateFee.toFixed(2) + ' applied. ' + (3 - loan.missedPayments) + ' more misses until default.',
        missedPayments: loan.missedPayments,
        lateFee: lateFee
    };
};

/**
 * Early payoff — pay the full remaining balance of a loan.
 * @param {string} loanId
 * @param {string} fromAccount — optional, defaults to loan's sourceAccount
 */
FinanceService.prototype.payOffLoan = async function(loanId, fromAccount) {
    await this._ensureReady();

    var loan = (this._data.loans || []).find(function(l) { return l.id === loanId; });
    if (!loan) return { success: false, message: 'Loan not found.' };
    if (loan.status !== 'active') return { success: false, message: 'Loan is ' + loan.status + '.' };

    if (!fromAccount) fromAccount = loan.sourceAccount || 'checking';

    return await this.payLoan(loanId, loan.remainingBalance, fromAccount);
};

/**
 * Get the amortization schedule for a loan (for display purposes).
 * @param {string} loanId
 * @returns {array} — [{ month, payment, principal, interest, balance }]
 */
FinanceService.prototype.getAmortizationSchedule = function(loanId) {
    if (!this._data) return [];

    var loan = (this._data.loans || []).find(function(l) { return l.id === loanId; });
    if (!loan) return [];

    var schedule = [];
    var balance = loan.principal;
    var monthlyRate = (loan.apr / 100) / 12;

    for (var month = 1; month <= loan.termMonths; month++) {
        var interestPayment = Math.round(balance * monthlyRate * 100) / 100;
        var principalPayment = Math.round((loan.monthlyPayment - interestPayment) * 100) / 100;

        // Last payment adjustment
        if (balance - principalPayment < 0.01) {
            principalPayment = balance;
        }

        balance = Math.round((balance - principalPayment) * 100) / 100;
        if (balance < 0) balance = 0;

        schedule.push({
            month: month,
            payment: loan.monthlyPayment,
            principal: principalPayment,
            interest: interestPayment,
            balance: balance,
            isPaid: month <= loan.paidMonths
        });

        if (balance <= 0) break;
    }

    return schedule;
};