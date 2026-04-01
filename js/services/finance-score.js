// =================================
// FINANCE SERVICE — Credit Score & Card Application System
// Score tracking, recalculation, tier eligibility, applications
// =================================

/**
 * Get the current credit score and metadata.
 * @returns {{ score, rating, color, history, hardInquiries }}
 */
FinanceService.prototype.getCreditScore = async function() {
    await this._ensureReady();
    return this.getCreditScoreSync();
};

/**
 * Synchronous version for UI display.
 */
FinanceService.prototype.getCreditScoreSync = function() {
    if (!this._data || !this._data.creditScore) {
        return { score: 500, rating: 'Fair', color: '#eab308', history: [], hardInquiries: 0 };
    }
    const cs = this._data.creditScore;
    const bracket = this._getScoreBracket(cs.score);
    return {
        score: cs.score,
        rating: bracket.rating,
        color: bracket.color,
        history: cs.history || [],
        hardInquiries: cs.hardInquiries || 0,
        lastUpdated: cs.lastUpdated
    };
};

/**
 * Get the score rating label for a given score value.
 */
FinanceService.prototype.getScoreRating = function(score) {
    return this._getScoreBracket(score).rating;
};

/**
 * Get the full bracket info for a score.
 */
FinanceService.prototype._getScoreBracket = function(score) {
    for (const bracket of SCORE_BRACKETS) {
        if (score >= bracket.min && score <= bracket.max) return bracket;
    }
    if (score >= 850) return SCORE_BRACKETS[0];
    return SCORE_BRACKETS[SCORE_BRACKETS.length - 1];
};

/**
 * Get the score trend direction based on recent history.
 * @returns {'up' | 'down' | 'stable'}
 */
FinanceService.prototype.getScoreTrendSync = function() {
    if (!this._data?.creditScore?.history || this._data.creditScore.history.length < 2) {
        return 'stable';
    }
    const recent = this._data.creditScore.history;
    const latest = recent[recent.length - 1];
    const previous = recent[recent.length - 2];
    if (latest.score > previous.score) return 'up';
    if (latest.score < previous.score) return 'down';
    return 'stable';
};

/**
 * Get credit utilization across all active cards.
 * @returns {{ totalUsed, totalLimit, percentage, perCard[] }}
 */
FinanceService.prototype.getCreditUtilizationSync = function() {
    if (!this._data) return { totalUsed: 0, totalLimit: 0, percentage: 0, perCard: [] };
    const active = (this._data.creditCards || []).filter(c => c.status === 'active');
    if (active.length === 0) return { totalUsed: 0, totalLimit: 0, percentage: 0, perCard: [] };

    const totalUsed = active.reduce((s, c) => s + c.balance, 0);
    const totalLimit = active.reduce((s, c) => s + c.creditLimit, 0);
    const percentage = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;

    return {
        totalUsed,
        totalLimit,
        percentage: Math.round(percentage * 10) / 10,
        perCard: active.map(c => ({
            id: c.id,
            name: c.name,
            last4: c.last4,
            used: c.balance,
            limit: c.creditLimit,
            percentage: c.creditLimit > 0 ? Math.round((c.balance / c.creditLimit) * 1000) / 10 : 0
        }))
    };
};

/**
 * Add a hard inquiry (called when applying for a card or loan).
 * Costs -5 points per inquiry.
 */
FinanceService.prototype._addHardInquiry = function(reason) {
    if (!this._data?.creditScore) return;

    // Reset hard inquiries if we've crossed into a new month
    const today = new Date().toISOString().split('T')[0];
    const resetDate = this._data.creditScore.hardInquiryResetDate || '';
    if (today.slice(0, 7) !== resetDate.slice(0, 7)) {
        this._data.creditScore.hardInquiries = 0;
        this._data.creditScore.hardInquiryResetDate = today;
    }

    this._data.creditScore.hardInquiries++;
    this._adjustScore(-5, `Hard inquiry: ${reason}`);
};

/**
 * Adjust the credit score by a delta. Clamps to 300-850.
 * All score changes go through here.
 */
FinanceService.prototype._adjustScore = function(delta, reason) {
    if (!this._data?.creditScore) return;

    const cs = this._data.creditScore;
    const oldScore = cs.score;
    cs.score = Math.max(300, Math.min(850, cs.score + delta));
    const actualDelta = cs.score - oldScore;

    cs.lastUpdated = new Date().toISOString();

    // Update the most recent history entry if same month
    const currentMonth = new Date().toISOString().slice(0, 7);
    const lastEntry = cs.history[cs.history.length - 1];
    if (lastEntry && lastEntry.date === currentMonth) {
        lastEntry.score = cs.score;
        lastEntry.delta += actualDelta;
        if (!lastEntry.reasons.includes(reason)) {
            lastEntry.reasons.push(reason);
        }
    }

    // Save asynchronously
    this._save();

    if (actualDelta !== 0) {
        this.eventBus.emit('finance.creditScoreChanged', {
            oldScore,
            newScore: cs.score,
            delta: actualDelta,
            rating: this._getScoreBracket(cs.score).rating,
            reason
        });
    }
};

/**
 * Full monthly recalculation of credit score.
 * Called by the monthly cycle engine (Phase 4). Can also be triggered manually.
 * @returns {{ oldScore, newScore, delta, reasons[] }}
 */
FinanceService.prototype.recalculateCreditScore = function() {
    if (!this._data?.creditScore) return { oldScore: 500, newScore: 500, delta: 0, reasons: [] };

    const cs = this._data.creditScore;
    const oldScore = cs.score;
    let totalDelta = 0;
    const reasons = [];

    // --- Positive factors ---

    // Low credit utilization bonus
    const utilization = this.getCreditUtilizationSync();
    if (utilization.totalLimit > 0) {
        if (utilization.percentage < 30) {
            totalDelta += 2;
            reasons.push('Low credit utilization (under 30%)');
        } else if (utilization.percentage > 70) {
            totalDelta -= 5;
            reasons.push('High credit utilization (over 70%)');
        }
        // Per-card maxed out penalty
        utilization.perCard.forEach(card => {
            if (card.percentage > 90) {
                totalDelta -= Math.floor(Math.random() * 11) + 10;
                reasons.push('Near-maxed card: ' + card.name);
            }
        });
    }

    // Account age bonus
    const activeCards = (this._data.creditCards || []).filter(c => c.status === 'active');
    if (activeCards.length > 0) {
        const oldest = activeCards.reduce((a, b) => new Date(a.opened) < new Date(b.opened) ? a : b);
        const ageMonths = this._monthsBetween(new Date(oldest.opened), new Date());
        if (ageMonths > 0) {
            const ageBonus = Math.min(ageMonths > 6 ? 2 : 1, 3);
            totalDelta += ageBonus;
            reasons.push('Account age bonus');
        }
    }

    // Employment bonus — rewards having stable income
    if (typeof elxaOS !== 'undefined' && elxaOS.employmentService &&
        elxaOS.employmentService.isEmployed()) {
        totalDelta += 2;
        reasons.push('Stable employment (' + elxaOS.employmentService.getEmploymentData().employer + ')');
    }

    // Savings behavior bonus — rewards maintaining a healthy savings balance
    const savingsBalance = this._data.accounts?.savings?.balance || 0;
    for (let i = 0; i < SAVINGS_SCORE_TIERS.length; i++) {
        if (savingsBalance >= SAVINGS_SCORE_TIERS[i].threshold) {
            totalDelta += SAVINGS_SCORE_TIERS[i].bonus;
            reasons.push(SAVINGS_SCORE_TIERS[i].label);
            break; // Only apply the highest tier
        }
    }

    // --- Apply clamping ---
    totalDelta = Math.max(-100, Math.min(30, totalDelta));

    // Apply the delta
    cs.score = Math.max(300, Math.min(850, cs.score + totalDelta));
    cs.lastUpdated = new Date().toISOString();

    // Add/update history entry for this month
    const currentMonth = new Date().toISOString().slice(0, 7);
    const existingEntry = cs.history.find(h => h.date === currentMonth);
    if (existingEntry) {
        existingEntry.score = cs.score;
        existingEntry.delta = cs.score - oldScore;
        existingEntry.reasons = reasons.length > 0 ? reasons : ['No significant changes'];
    } else {
        cs.history.push({
            date: currentMonth,
            score: cs.score,
            delta: cs.score - oldScore,
            reasons: reasons.length > 0 ? reasons : ['No significant changes']
        });
    }

    // Cap history at 12 months
    if (cs.history.length > 12) {
        cs.history = cs.history.slice(-12);
    }

    // Reset hard inquiries for the new month
    cs.hardInquiries = 0;
    cs.hardInquiryResetDate = new Date().toISOString().split('T')[0];

    this._save();

    const result = {
        oldScore,
        newScore: cs.score,
        delta: cs.score - oldScore,
        rating: this._getScoreBracket(cs.score).rating,
        reasons
    };

    if (result.delta !== 0) {
        this.eventBus.emit('finance.creditScoreChanged', result);
    }

    console.log(`\u{1f4ca} Credit score recalculated: ${oldScore} \u2192 ${cs.score} (${result.delta >= 0 ? '+' : ''}${result.delta})`);
    return result;
};

/**
 * Helper: months between two dates.
 */
FinanceService.prototype._monthsBetween = function(d1, d2) {
    return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
};

// =================================
// CREDIT CARD APPLICATION SYSTEM
// =================================

/**
 * Get all card tier definitions.
 */
FinanceService.prototype.getCardTiers = function() {
    return JSON.parse(JSON.stringify(CARD_TIERS));
};

/**
 * Get card tiers annotated with eligibility info for the current user.
 * @returns {array} — tiers with eligible, reason, calculatedLimit, calculatedApr
 */
FinanceService.prototype.getAvailableCardTiersSync = function() {
    const score = this._data?.creditScore?.score || 0;
    const activeCards = (this._data?.creditCards || []).filter(c => c.status === 'active');
    const activeCount = activeCards.length;

    return Object.values(CARD_TIERS).map(tier => {
        const eligible = score >= tier.requiredScore && activeCount < MAX_CREDIT_CARDS;
        const alreadyHas = activeCards.some(c => c.tier === tier.key);
        const recentDenial = this._wasRecentlyDenied(tier.key);

        let reason = null;
        if (alreadyHas) {
            reason = 'You already have this card.';
        } else if (activeCount >= MAX_CREDIT_CARDS) {
            reason = `Maximum ${MAX_CREDIT_CARDS} cards reached. Close one to apply.`;
        } else if (score < tier.requiredScore) {
            reason = `Requires ${tier.requiredRating} credit (${tier.requiredScore}+). Your score: ${score}.`;
        } else if (recentDenial) {
            reason = 'Must wait 30 days after a denial to reapply.';
        }

        const { limit: calculatedLimit, apr: calculatedApr } = this._calculateCardTerms(tier, score);

        return {
            ...tier,
            eligible: eligible && !alreadyHas && !recentDenial,
            alreadyHas,
            reason,
            calculatedLimit,
            calculatedApr,
            activeCardCount: activeCount,
            maxCards: MAX_CREDIT_CARDS
        };
    });
};

/**
 * Calculate personalized card terms based on score within a tier's range.
 * Higher score = higher limit, lower APR.
 */
FinanceService.prototype._calculateCardTerms = function(tier, score) {
    if (score < tier.requiredScore) {
        return { limit: tier.limitRange[0], apr: tier.baseApr + tier.aprRange };
    }

    const tierKeys = Object.keys(CARD_TIERS);
    const currentIdx = tierKeys.indexOf(tier.key);
    const nextTier = currentIdx < tierKeys.length - 1 ? CARD_TIERS[tierKeys[currentIdx + 1]] : null;
    const ceiling = nextTier ? nextTier.requiredScore : 850;

    const range = ceiling - tier.requiredScore;
    const progress = range > 0 ? Math.min((score - tier.requiredScore) / range, 1) : 1;

    const limit = Math.round(tier.limitRange[0] + (tier.limitRange[1] - tier.limitRange[0]) * progress);
    const apr = Math.round((tier.baseApr + tier.aprRange - (tier.aprRange * 2 * progress)) * 100) / 100;

    return { limit, apr: Math.max(apr, tier.baseApr - tier.aprRange) };
};

/**
 * Check if the user was denied this card tier within the last 30 days.
 */
FinanceService.prototype._wasRecentlyDenied = function(tierKey) {
    if (!this._data?.transactions) return false;
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    return this._data.transactions.some(t =>
        t.type === 'credit-application-denied' &&
        t.description.includes(tierKey) &&
        t.timestamp > thirtyDaysAgo
    );
};

/**
 * Apply for a credit card by tier key.
 * Checks score, max cards, duplicates, cooldowns. Adds hard inquiry regardless.
 *
 * @param {string} tierKey — 'starter' | 'silver' | 'gold' | 'platinum' | 'black'
 * @returns {{ success, approved, message, card?, reason?, tips? }}
 */
FinanceService.prototype.applyForCreditCard = async function(tierKey) {
    await this._ensureReady();

    const tier = CARD_TIERS[tierKey];
    if (!tier) {
        return { success: false, approved: false, message: `Unknown card tier: ${tierKey}` };
    }

    const score = this._data.creditScore?.score || 0;
    const activeCards = this._data.creditCards.filter(c => c.status === 'active');

    // Always add a hard inquiry
    this._addHardInquiry(`${tier.name} application`);

    this._addTransaction({
        type: 'credit-application',
        account: 'credit',
        amount: 0,
        description: `Applied for ${tier.name} (tier:${tierKey})`
    });

    // Check: max cards
    if (activeCards.length >= MAX_CREDIT_CARDS) {
        this._addTransaction({
            type: 'credit-application-denied',
            account: 'credit',
            amount: 0,
            description: `Denied: ${tier.name} (tier:${tierKey}) \u2014 max cards reached`
        });
        await this._save();
        return {
            success: true,
            approved: false,
            message: `Application denied. You already have ${MAX_CREDIT_CARDS} active credit cards. Close one to apply for a new card.`,
            reason: 'max_cards'
        };
    }

    // Check: already has this tier
    if (activeCards.some(c => c.tier === tierKey)) {
        this._addTransaction({
            type: 'credit-application-denied',
            account: 'credit',
            amount: 0,
            description: `Denied: ${tier.name} (tier:${tierKey}) \u2014 already held`
        });
        await this._save();
        return {
            success: true,
            approved: false,
            message: `Application denied. You already have a ${tier.name}.`,
            reason: 'duplicate'
        };
    }

    // Check: recent denial cooldown
    if (this._wasRecentlyDenied(tierKey)) {
        this._addTransaction({
            type: 'credit-application-denied',
            account: 'credit',
            amount: 0,
            description: `Denied: ${tier.name} (tier:${tierKey}) \u2014 cooldown period`
        });
        await this._save();
        return {
            success: true,
            approved: false,
            message: `Application denied. You must wait 30 days after a denial before reapplying for the ${tier.name}.`,
            reason: 'cooldown'
        };
    }

    // Check: credit score
    if (score < tier.requiredScore) {
        this._addTransaction({
            type: 'credit-application-denied',
            account: 'credit',
            amount: 0,
            description: `Denied: ${tier.name} (tier:${tierKey}) \u2014 score ${score} below ${tier.requiredScore}`
        });
        await this._save();

        const tips = [];
        if (this.getCreditUtilizationSync().percentage > 30) {
            tips.push('Pay down your credit card balances to below 30% of your limits.');
        }
        if (activeCards.length === 0) {
            tips.push('Open a basic credit card and make on-time payments to build credit.');
        }
        tips.push('Keep making on-time payments \u2014 your score will improve over time.');

        return {
            success: true,
            approved: false,
            message: `Application denied. Your credit score of ${score} doesn't meet the minimum of ${tier.requiredScore} (${tier.requiredRating}) for the ${tier.name}.`,
            reason: 'low_score',
            currentScore: score,
            requiredScore: tier.requiredScore,
            tips
        };
    }

    // APPROVED
    const { limit, apr } = this._calculateCardTerms(tier, score);

    const result = await this.createCreditCard({
        name: tier.name,
        creditLimit: limit,
        apr: apr,
        annualFee: tier.annualFee,
        minimumPayment: Math.max(25, Math.round(limit * 0.05)),
        dueDay: 15,
        tier: tierKey,
        perks: tier.perks
    });

    if (result.success) {
        console.log(`\u{1f4b3} ${tier.name} APPROVED for score ${score}: limit=$${limit}, APR=${apr}%`);
        return {
            success: true,
            approved: true,
            message: `Congratulations! Your ${tier.name} has been approved!`,
            card: result.card,
            terms: {
                creditLimit: limit,
                apr: apr,
                annualFee: tier.annualFee,
                perks: tier.perks
            }
        };
    }

    return { success: false, approved: false, message: 'An error occurred processing your application.' };
};

// =================================
// SECURED CREDIT CARD SYSTEM
// =================================

/**
 * Check if the user currently has an active secured card.
 * @returns {object|null} — the secured card object, or null
 */
FinanceService.prototype.getSecuredCard = function() {
    if (!this._data?.creditCards) return null;
    return this._data.creditCards.find(c => c.secured === true && c.status === 'active') || null;
};

/**
 * Apply for a secured credit card.
 * No credit check — anyone can get one as long as they have the deposit.
 * The deposit amount becomes the credit limit.
 *
 * @param {number} depositAmount — how much to deposit (min: SECURED_CARD_CONFIG.minDeposit, max: SECURED_CARD_CONFIG.maxDeposit)
 * @returns {{ success, approved, message, card?, deposit? }}
 */
FinanceService.prototype.applyForSecuredCard = async function(depositAmount) {
    await this._ensureReady();

    const config = SECURED_CARD_CONFIG;

    // Check: already has a secured card
    if (this.getSecuredCard()) {
        return {
            success: true,
            approved: false,
            message: 'You already have an active secured card. Graduate it first or close it before applying for a new one.'
        };
    }

    // Validate deposit amount
    if (!depositAmount || depositAmount < config.minDeposit) {
        return {
            success: false,
            approved: false,
            message: 'Minimum deposit for a secured card is $' + config.minDeposit.toFixed(2) + '.'
        };
    }
    if (depositAmount > config.maxDeposit) {
        return {
            success: false,
            approved: false,
            message: 'Maximum deposit for a secured card is $' + config.maxDeposit.toFixed(2) + '.'
        };
    }

    // Check: sufficient funds in checking
    const checking = this._data.accounts.checking;
    if (checking.balance < depositAmount) {
        return {
            success: false,
            approved: false,
            message: 'Insufficient funds in checking. You need $' + depositAmount.toFixed(2) + ' for the deposit but only have $' + checking.balance.toFixed(2) + '.'
        };
    }

    // Deduct deposit from checking
    checking.balance -= depositAmount;

    this._addTransaction({
        type: 'secured-card-deposit',
        account: 'checking',
        amount: -depositAmount,
        description: 'Security deposit for ' + config.name + ' (held as collateral)'
    });

    this.eventBus.emit('finance.accountUpdated', {
        account: 'checking',
        newBalance: checking.balance
    });

    // Create the secured card — NO hard inquiry
    const result = await this.createCreditCard({
        name: config.name,
        creditLimit: depositAmount,
        apr: config.apr,
        annualFee: config.annualFee,
        minimumPayment: Math.max(15, Math.round(depositAmount * 0.05)),
        dueDay: 15,
        tier: 'secured',
        perks: ['Build your credit history', 'Graduate to a real card']
    });

    if (result.success) {
        // Mark the card as secured with extra tracking fields
        const card = this._data.creditCards.find(c => c.id === result.card.id);
        if (card) {
            card.secured = true;
            card.securedDeposit = depositAmount;
            card.onTimePayments = 0;
            card.graduationTarget = config.graduationMonths;
        }

        await this._save();

        console.log('\ud83d\udd12 Secured card opened: deposit=$' + depositAmount + ', limit=$' + depositAmount);

        this.eventBus.emit('finance.securedCardOpened', {
            cardId: result.card.id,
            deposit: depositAmount,
            creditLimit: depositAmount
        });

        return {
            success: true,
            approved: true,
            message: 'Your ' + config.name + ' has been approved! A deposit of $' + depositAmount.toFixed(2) + ' has been held as collateral and is your credit limit.',
            card: { ...card },
            deposit: depositAmount,
            graduationInfo: 'Make ' + config.graduationMonths + ' on-time payment(s) to graduate to a real Starter card and get your deposit back!'
        };
    }

    // If card creation failed, refund the deposit
    checking.balance += depositAmount;
    this._addTransaction({
        type: 'secured-card-deposit-refund',
        account: 'checking',
        amount: depositAmount,
        description: 'Refund: ' + config.name + ' application failed'
    });
    await this._save();

    return { success: false, approved: false, message: 'An error occurred processing your secured card application.' };
};

/**
 * Process secured card graduation during monthly cycle.
 * Checks if any secured card has met the on-time payment requirement.
 * If so: closes the secured card, refunds the deposit, and opens a real Starter card.
 *
 * @param {string} cycleMonth — 'YYYY-MM' for logging
 * @returns {{ graduated: boolean, details: object|null }}
 */
FinanceService.prototype._processSecuredCardGraduation = function(cycleMonth) {
    var securedCard = this.getSecuredCard();
    if (!securedCard) return { graduated: false, details: null };

    var config = SECURED_CARD_CONFIG;

    // Check if the card has enough on-time payments
    if ((securedCard.onTimePayments || 0) < config.graduationMonths) {
        return { graduated: false, details: null };
    }

    console.log('\ud83c\udf93 Secured card graduation! ' + securedCard.onTimePayments + '/' + config.graduationMonths + ' on-time payments met.');

    var deposit = securedCard.securedDeposit || config.minDeposit;
    var oldCardId = securedCard.id;

    // 1. Close the secured card (force-close even with balance — pay it from deposit)
    var remainingBalance = securedCard.balance;
    if (remainingBalance > 0) {
        // Deduct any remaining balance from the deposit refund
        deposit = Math.max(0, deposit - remainingBalance);
    }
    securedCard.status = 'graduated';
    securedCard.closedDate = new Date().toISOString();
    securedCard.graduatedDate = new Date().toISOString();

    this._addTransaction({
        type: 'secured-card-graduated',
        account: 'credit',
        amount: 0,
        description: config.name + ' graduated! Card closed, deposit refunded.'
    });

    // 2. Refund deposit to checking
    if (deposit > 0) {
        this._data.accounts.checking.balance += deposit;

        this._addTransaction({
            type: 'secured-card-deposit-refund',
            account: 'checking',
            amount: deposit,
            description: 'Security deposit refund from ' + config.name + ' graduation'
        });

        this.eventBus.emit('finance.accountUpdated', {
            account: 'checking',
            newBalance: this._data.accounts.checking.balance
        });
    }

    // 3. Score boost for graduation
    this._adjustScore(config.graduationBonus, 'Secured card graduation \u2014 promoted to Starter card');

    // 4. Create a real Starter card (using current score for terms)
    var score = this._data.creditScore?.score || 500;
    var starterTier = CARD_TIERS.starter;
    var terms = this._calculateCardTerms(starterTier, score);

    // Generate a new card directly (bypass application flow — this is an automatic promotion)
    var last4 = Math.floor(1000 + Math.random() * 9000).toString();
    var seg = function() { return Math.floor(1000 + Math.random() * 9000).toString(); };
    var fullNumber = seg() + ' ' + seg() + ' ' + seg() + ' ' + last4;

    var starterCard = {
        id: 'cc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
        name: starterTier.name,
        number: fullNumber,
        last4: last4,
        creditLimit: terms.limit,
        balance: 0,
        apr: terms.apr,
        annualFee: starterTier.annualFee,
        minimumPayment: Math.max(25, Math.round(terms.limit * 0.05)),
        dueDay: 15,
        tier: 'starter',
        perks: starterTier.perks,
        opened: new Date().toISOString(),
        status: 'active',
        promotedFrom: oldCardId
    };

    this._data.creditCards.push(starterCard);

    this._addTransaction({
        type: 'credit-card-opened',
        account: 'credit',
        amount: 0,
        description: 'Promoted to ' + starterTier.name + ' (limit: $' + terms.limit.toFixed(2) + ') from secured card graduation'
    });

    this._save();

    this.eventBus.emit('finance.securedCardGraduated', {
        oldCardId: oldCardId,
        newCardId: starterCard.id,
        newCardName: starterCard.name,
        depositRefunded: deposit,
        scoreBoost: config.graduationBonus,
        newCreditLimit: terms.limit
    });

    this.eventBus.emit('finance.creditCardCreated', {
        cardId: starterCard.id,
        name: starterCard.name,
        creditLimit: starterCard.creditLimit
    });

    var details = {
        graduated: true,
        oldCardName: config.name,
        newCardName: starterCard.name,
        newCardId: starterCard.id,
        depositRefunded: deposit,
        balanceDeducted: remainingBalance,
        scoreBoost: config.graduationBonus,
        newCreditLimit: terms.limit,
        message: config.name + ' graduated! Deposit of $' + deposit.toFixed(2) + ' refunded. New ' + starterCard.name + ' opened with $' + terms.limit.toFixed(2) + ' limit.'
    };

    console.log('\ud83c\udf93 ' + details.message);
    return { graduated: true, details: details };
};