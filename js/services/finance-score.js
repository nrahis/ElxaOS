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