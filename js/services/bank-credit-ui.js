// =================================
// FIRST SNAKESIAN BANK — Credit Score & Card UI
// Dashboard widgets, card application page, card payment and closing
// =================================

/**
 * Generate contextual credit tips based on current financial state.
 */
BankSystem.prototype._generateCreditTips = function(fs) {
    var tips = [];
    var scoreData = fs.getCreditScoreSync();
    var utilization = fs.getCreditUtilizationSync();
    var cards = fs.getCreditCardsSync().filter(function(c) { return c.status === 'active'; });

    if (utilization.percentage > 30 && utilization.totalLimit > 0) {
        tips.push('Try to keep your credit card balances below 30% of your limits.');
    }
    if (cards.length === 0) {
        tips.push('Opening a credit card and making on-time payments is a great way to build credit.');
    }
    if (scoreData.score < 580) {
        tips.push('Focus on making all payments on time. Your score will recover over time.');
    }
    if (scoreData.hardInquiries > 2) {
        tips.push('Too many applications can hurt your score. Wait before applying for more cards.');
    }
    if (cards.length > 0 && utilization.percentage < 10) {
        tips.push('Great job keeping your utilization low! This helps your score.');
    }
    return tips;
};

/**
 * Render the credit score widget into the dashboard.
 */
BankSystem.prototype.renderCreditScoreWidget = function() {
    var container = document.getElementById('creditScoreWidget');
    if (!container) return;

    var fs = (typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService.isReady())
        ? elxaOS.financeService : null;

    if (!fs) {
        container.innerHTML = '<div class="bank-score-unavailable">Credit score data unavailable.</div>';
        return;
    }

    var scoreData = fs.getCreditScoreSync();
    var trend = fs.getScoreTrendSync();
    var tips = this._generateCreditTips(fs);
    var trendIcon = trend === 'up' ? '&#9650;' : trend === 'down' ? '&#9660;' : '&#9654;';
    var trendColor = trend === 'up' ? '#006400' : trend === 'down' ? '#dc143c' : '#666';
    var trendLabel = trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable';

    // Score gauge — position the marker on a 300-850 range
    var pct = Math.max(0, Math.min(100, ((scoreData.score - 300) / 550) * 100));

    var tipsHtml = '';
    if (tips.length > 0) {
        tipsHtml = '<div class="bank-score-tips"><strong>Tips:</strong><ul>' +
            tips.map(function(t) { return '<li>' + t + '</li>'; }).join('') +
            '</ul></div>';
    }

    // Score history mini chart
    var history = scoreData.history || [];
    var historyHtml = '';
    if (history.length > 1) {
        var maxScore = 850;
        var minScore = 300;
        historyHtml = '<div class="bank-score-history"><strong>Score History:</strong><div class="bank-score-bars">';
        history.slice(-6).forEach(function(h) {
            var barPct = ((h.score - minScore) / (maxScore - minScore)) * 100;
            historyHtml += '<div class="bank-score-bar-col"><div class="bank-score-bar" style="height:' + barPct + '%;background:' + scoreData.color + '"></div><span>' + h.date.slice(5) + '</span></div>';
        });
        historyHtml += '</div></div>';
    }

    container.innerHTML =
        '<div class="bank-score-card">' +
            '<div class="bank-score-header">' +
                '<h3><span data-icon="chart-line"></span> Your Credit Score</h3>' +
                '<span class="bank-score-trend" style="color:' + trendColor + '">' + trendIcon + ' ' + trendLabel + '</span>' +
            '</div>' +
            '<div class="bank-score-display">' +
                '<div class="bank-score-number" style="color:' + scoreData.color + '">' + scoreData.score + '</div>' +
                '<div class="bank-score-rating" style="background:' + scoreData.color + '">' + scoreData.rating + '</div>' +
            '</div>' +
            '<div class="bank-score-gauge">' +
                '<div class="bank-score-gauge-track">' +
                    '<div class="bank-score-gauge-fill" style="width:' + pct + '%;background:' + scoreData.color + '"></div>' +
                '</div>' +
                '<div class="bank-score-gauge-labels"><span>300</span><span>500</span><span>670</span><span>740</span><span>850</span></div>' +
            '</div>' +
            (scoreData.hardInquiries > 0 ? '<div class="bank-score-inquiries">Hard inquiries this period: ' + scoreData.hardInquiries + '</div>' : '') +
            historyHtml +
            tipsHtml +
        '</div>';

    // Re-inject icons
    container.querySelectorAll('[data-icon]').forEach(function(el) {
        el.innerHTML = ElxaIcons.renderAction(el.dataset.icon);
    });
};

/**
 * Render the "My Credit Cards" section on the dashboard.
 */
BankSystem.prototype.renderMyCardsSection = function() {
    var container = document.getElementById('myCardsSection');
    if (!container) return;

    var fs = (typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService.isReady())
        ? elxaOS.financeService : null;

    if (!fs) {
        container.innerHTML = '';
        return;
    }

    var cards = fs.getCreditCardsSync().filter(function(c) { return c.status === 'active'; });

    if (cards.length === 0) {
        container.innerHTML =
            '<div class="bank-my-cards-empty">' +
                '<h3><span data-icon="credit-card-multiple"></span> My Credit Cards</h3>' +
                '<p>You don\'t have any credit cards yet. <a data-action="show-apply-cards" style="cursor:pointer;color:#4169e1;text-decoration:underline;">Apply for your first card!</a></p>' +
            '</div>';
        container.querySelectorAll('[data-icon]').forEach(function(el) {
            el.innerHTML = ElxaIcons.renderAction(el.dataset.icon);
        });
        return;
    }

    var cardsHtml = '<div class="bank-my-cards"><h3><span data-icon="credit-card-multiple"></span> My Credit Cards (' + cards.length + '/3)</h3><div class="bank-cards-grid">';

    cards.forEach(function(card) {
        var utilization = card.creditLimit > 0 ? (card.balance / card.creditLimit) : 0;
        var utilPct = (utilization * 100).toFixed(0);
        var utilColor = utilization > 0.7 ? '#dc143c' : utilization > 0.3 ? '#daa520' : '#006400';
        var available = card.creditLimit - card.balance;

        cardsHtml +=
            '<div class="bank-card-item">' +
                '<div class="bank-card-name">' + card.name + '</div>' +
                '<div class="bank-card-number">**** **** **** ' + card.last4 + '</div>' +
                '<div class="bank-card-details">' +
                    '<div class="bank-card-detail"><span>Balance Owed:</span> <strong style="color:#dc143c">$' + card.balance.toFixed(2) + '</strong></div>' +
                    '<div class="bank-card-detail"><span>Credit Limit:</span> $' + card.creditLimit.toFixed(2) + '</div>' +
                    '<div class="bank-card-detail"><span>Available:</span> <strong style="color:#006400">$' + available.toFixed(2) + '</strong></div>' +
                    '<div class="bank-card-detail"><span>APR:</span> ' + card.apr + '%</div>' +
                    '<div class="bank-card-detail"><span>Min Payment:</span> $' + card.minimumPayment.toFixed(2) + '</div>' +
                    '<div class="bank-card-detail"><span>Due Day:</span> ' + card.dueDay + 'th of month</div>' +
                '</div>' +
                '<div class="bank-card-util">' +
                    '<div class="bank-card-util-label">Utilization: ' + utilPct + '%</div>' +
                    '<div class="bank-card-util-track"><div class="bank-card-util-fill" style="width:' + utilPct + '%;background:' + utilColor + '"></div></div>' +
                '</div>' +
                '<div class="bank-card-actions">' +
                    (card.balance > 0 ? '<button class="bank-btn" data-action="show-card-payment" data-card-id="' + card.id + '">Pay Card</button>' : '') +
                    (card.balance === 0 ? '<button class="bank-btn-secondary" data-action="close-card" data-card-id="' + card.id + '">Close Card</button>' : '<span class="bank-card-close-note">Pay off balance to close</span>') +
                '</div>' +
            '</div>';
    });

    cardsHtml += '</div></div>';
    container.innerHTML = cardsHtml;

    container.querySelectorAll('[data-icon]').forEach(function(el) {
        el.innerHTML = ElxaIcons.renderAction(el.dataset.icon);
    });
};

/**
 * Show the "Apply for a Credit Card" section.
 */
BankSystem.prototype.showApplyForCards = function() {
    this.hideAllSections();

    var container = document.getElementById('cardApplySection');
    if (!container) return;
    container.classList.remove('hidden');

    var fs = (typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService.isReady())
        ? elxaOS.financeService : null;

    if (!fs) {
        container.innerHTML = '<div class="bank-error">Finance service unavailable.</div>';
        container.classList.remove('hidden');
        return;
    }

    var tiers = fs.getAvailableCardTiersSync();
    var scoreData = fs.getCreditScoreSync();

    var html = '<h3 class="bank-form-header"><span data-icon="credit-card-plus"></span> Apply for a Credit Card</h3>';
    html += '<p style="font-size:11px;margin-bottom:15px;">Your credit score: <strong style="color:' + scoreData.color + '">' + scoreData.score + ' (' + scoreData.rating + ')</strong>. Better scores unlock better cards with higher limits and lower rates.</p>';
    html += '<div class="bank-security-notice"><strong>Note:</strong> Each application results in a hard inquiry on your credit report (-5 points). Maximum ' + tiers[0].maxCards + ' cards allowed at one time. You have ' + tiers[0].activeCardCount + '.</div>';
    html += '<div class="bank-card-tiers">';

    tiers.forEach(function(tier) {
        var isAvailable = tier.eligible;
        var isOwned = tier.alreadyHas;
        var cardClass = isAvailable ? 'bank-tier-card available' : isOwned ? 'bank-tier-card owned' : 'bank-tier-card locked';
        var perksText = (tier.perks && tier.perks.length > 0) ? tier.perks.join(', ') : 'None';

        html +=
            '<div class="' + cardClass + '">' +
                '<div class="bank-tier-header">' +
                    '<div class="bank-tier-name">' + tier.name + '</div>' +
                    (isOwned ? '<span class="bank-tier-badge owned-badge">OWNED</span>' : '') +
                    (!isAvailable && !isOwned ? '<span class="bank-tier-badge locked-badge">' + tier.requiredRating + ' (' + tier.requiredScore + '+)</span>' : '') +
                '</div>' +
                '<div class="bank-tier-details">' +
                    '<div class="bank-tier-detail"><strong>Credit Limit:</strong> $' + tier.limitRange[0] + ' &ndash; $' + tier.limitRange[1] + (isAvailable ? ' (yours: $' + tier.calculatedLimit + ')' : '') + '</div>' +
                    '<div class="bank-tier-detail"><strong>APR:</strong> ' + tier.baseApr + '%' + (isAvailable ? ' (yours: ' + tier.calculatedApr + '%)' : '') + '</div>' +
                    '<div class="bank-tier-detail"><strong>Annual Fee:</strong> ' + (tier.annualFee > 0 ? '$' + tier.annualFee + '/yr' : 'None') + '</div>' +
                    '<div class="bank-tier-detail"><strong>Perks:</strong> ' + perksText + '</div>' +
                    '<div class="bank-tier-detail" style="font-style:italic;color:#666;margin-top:4px">' + tier.description + '</div>' +
                '</div>' +
                '<div class="bank-tier-actions">' +
                    (isAvailable ? '<button class="bank-btn" data-action="apply-card" data-tier="' + tier.key + '">Apply Now</button>' : '') +
                    (!isAvailable && !isOwned ? '<div class="bank-tier-reason">' + tier.reason + '</div>' : '') +
                    (isOwned ? '<div class="bank-tier-reason">&#10003; You have this card</div>' : '') +
                '</div>' +
            '</div>';
    });

    html += '</div>';
    html += '<div class="bank-form-actions"><button class="bank-btn-secondary" data-action="nav-dashboard">Back to Dashboard</button></div>';

    container.innerHTML = html;

    container.querySelectorAll('[data-icon]').forEach(function(el) {
        el.innerHTML = ElxaIcons.renderAction(el.dataset.icon);
    });
};

BankSystem.prototype.showMyCards = function() {
    this.hideTransactionForms();
    this.hideCardSections();
    var el = document.getElementById('myCardsSection');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
};

BankSystem.prototype.hideCardSections = function() {
    var sections = ['cardPaymentSection'];
    sections.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
};


// =================================
// CARD APPLICATION MODAL
// =================================

/**
 * Inject modal CSS once into the document.
 */
BankSystem.prototype._injectCardModalCSS = function() {
    if (document.getElementById('bank-apply-modal-styles')) return;

    var style = document.createElement('style');
    style.id = 'bank-apply-modal-styles';
    style.textContent = [
        // Overlay
        '.bank-apply-overlay {',
        '  position: absolute;',
        '  top: 0; left: 0; right: 0; bottom: 0;',
        '  z-index: 9000;',
        '  display: flex;',
        '  align-items: center;',
        '  justify-content: center;',
        '  animation: bankApplyFadeIn 0.25s ease-out;',
        '}',
        '.bank-apply-backdrop {',
        '  position: absolute;',
        '  top: 0; left: 0; right: 0; bottom: 0;',
        '  background: rgba(0, 0, 20, 0.55);',
        '}',

        // Dialog box
        '.bank-apply-dialog {',
        '  position: relative;',
        '  width: 88%;',
        '  max-width: 420px;',
        '  background: var(--windowBg, #c0c0c0);',
        '  border: 2px outset var(--windowBorder, #c0c0c0);',
        '  box-shadow: 4px 4px 10px rgba(0,0,0,0.35);',
        '  font-family: "MS Sans Serif", sans-serif;',
        '  font-size: 11px;',
        '  color: #000;',
        '  overflow: hidden;',
        '  animation: bankApplySlideIn 0.3s ease-out;',
        '}',

        // Title bar
        '.bank-apply-titlebar {',
        '  background: var(--titlebarBg, linear-gradient(90deg, #0a246a 0%, #a6caf0 100%));',
        '  padding: 4px 8px;',
        '  display: flex;',
        '  align-items: center;',
        '  justify-content: space-between;',
        '  border-bottom: 1px solid #808080;',
        '  min-height: 20px;',
        '}',
        '.bank-apply-titlebar span {',
        '  color: white;',
        '  font-weight: bold;',
        '  font-size: 11px;',
        '  text-shadow: 1px 1px 0 rgba(0,0,0,0.5);',
        '}',
        '.bank-apply-close {',
        '  width: 16px; height: 14px;',
        '  background: var(--windowBg, #c0c0c0);',
        '  border: 1px outset var(--windowBorder, #c0c0c0);',
        '  font-size: 9px; font-weight: bold;',
        '  cursor: pointer;',
        '  display: flex; align-items: center; justify-content: center;',
        '  color: #000;',
        '}',
        '.bank-apply-close:hover { background: #d4d0c8; }',
        '.bank-apply-close:active { border: 1px inset #c0c0c0; background: #b0b0b0; }',

        // Body
        '.bank-apply-body {',
        '  padding: 20px 16px;',
        '  text-align: center;',
        '  min-height: 180px;',
        '  display: flex;',
        '  flex-direction: column;',
        '  align-items: center;',
        '  justify-content: center;',
        '}',

        // --- PROCESSING STATE ---
        '.bank-apply-spinner {',
        '  width: 36px; height: 36px;',
        '  border: 3px solid #e0e0e0;',
        '  border-top: 3px solid #0a246a;',
        '  border-radius: 50%;',
        '  animation: bankApplySpin 0.9s linear infinite;',
        '  margin: 0 auto 14px auto;',
        '}',
        '.bank-apply-progress-track {',
        '  width: 220px; height: 16px;',
        '  background: white;',
        '  border: 1px inset #c0c0c0;',
        '  margin: 10px auto 0 auto;',
        '  overflow: hidden;',
        '}',
        '.bank-apply-progress-fill {',
        '  height: 100%;',
        '  background: linear-gradient(90deg, #4a90e2, #2e5ea8);',
        '  width: 0%;',
        '  transition: width 0.4s ease;',
        '}',
        '.bank-apply-status-msg {',
        '  font-size: 11px; color: #333;',
        '  margin-top: 10px;',
        '  min-height: 16px;',
        '}',

        // --- APPROVED STATE ---
        '.bank-apply-check {',
        '  font-size: 52px;',
        '  color: #008000;',
        '  animation: bankApplyBounce 0.6s ease-out;',
        '  margin-bottom: 6px;',
        '}',
        '.bank-apply-result-title {',
        '  font-size: 14px; font-weight: bold;',
        '  margin-bottom: 12px;',
        '}',
        '.bank-apply-result-title.approved { color: #006400; }',
        '.bank-apply-result-title.denied { color: #b22222; }',

        // Card preview (approved)
        '.bank-apply-card-preview {',
        '  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);',
        '  color: #fff;',
        '  border-radius: 8px;',
        '  padding: 14px 18px;',
        '  width: 280px;',
        '  text-align: left;',
        '  margin: 8px auto 14px auto;',
        '  box-shadow: 2px 2px 8px rgba(0,0,0,0.3);',
        '  font-family: "Consolas", "Courier New", monospace;',
        '  position: relative;',
        '  overflow: hidden;',
        '}',
        '.bank-apply-card-preview::after {',
        '  content: "";',
        '  position: absolute;',
        '  top: -30px; right: -30px;',
        '  width: 80px; height: 80px;',
        '  background: rgba(255,255,255,0.05);',
        '  border-radius: 50%;',
        '}',
        '.bank-apply-card-preview .card-bank-name {',
        '  font-size: 9px; opacity: 0.7;',
        '  letter-spacing: 1px;',
        '  text-transform: uppercase;',
        '  margin-bottom: 10px;',
        '}',
        '.bank-apply-card-preview .card-number {',
        '  font-size: 13px;',
        '  letter-spacing: 2px;',
        '  margin-bottom: 10px;',
        '}',
        '.bank-apply-card-preview .card-name {',
        '  font-size: 11px; font-weight: bold;',
        '  margin-bottom: 2px;',
        '}',
        '.bank-apply-card-preview .card-meta {',
        '  display: flex; justify-content: space-between;',
        '  font-size: 9px; opacity: 0.8;',
        '}',

        // Detail rows (approved)
        '.bank-apply-detail-rows {',
        '  background: white;',
        '  border: 1px inset #c0c0c0;',
        '  padding: 8px 12px;',
        '  margin: 0 auto 14px auto;',
        '  width: 280px;',
        '  text-align: left;',
        '}',
        '.bank-apply-detail-row {',
        '  display: flex;',
        '  justify-content: space-between;',
        '  padding: 3px 0;',
        '  font-size: 11px;',
        '  border-bottom: 1px dotted #e0e0e0;',
        '}',
        '.bank-apply-detail-row:last-child { border-bottom: none; }',
        '.bank-apply-detail-row strong { color: #000080; }',

        // --- DENIED STATE ---
        '.bank-apply-denied-icon {',
        '  font-size: 52px;',
        '  color: #b22222;',
        '  animation: bankApplyBounce 0.6s ease-out;',
        '  margin-bottom: 6px;',
        '}',
        '.bank-apply-denied-reason {',
        '  background: #fff0f0;',
        '  border: 1px solid #e0b0b0;',
        '  border-left: 3px solid #dc143c;',
        '  padding: 8px 12px;',
        '  margin: 8px auto 12px auto;',
        '  width: 280px;',
        '  text-align: left;',
        '  font-size: 11px;',
        '  color: #333;',
        '}',
        '.bank-apply-tips {',
        '  background: #fffff0;',
        '  border: 1px solid #e0e0b0;',
        '  border-left: 3px solid #daa520;',
        '  padding: 8px 12px;',
        '  margin: 0 auto 14px auto;',
        '  width: 280px;',
        '  text-align: left;',
        '  font-size: 10px;',
        '  color: #555;',
        '}',
        '.bank-apply-tips strong { color: #333; display: block; margin-bottom: 4px; }',
        '.bank-apply-tips ul { margin: 0; padding-left: 16px; }',
        '.bank-apply-tips li { margin-bottom: 2px; }',

        // Buttons row
        '.bank-apply-buttons {',
        '  display: flex;',
        '  gap: 8px;',
        '  justify-content: center;',
        '  padding-top: 10px;',
        '  border-top: 1px solid #a0a0a0;',
        '  margin-top: 4px;',
        '}',
        '.bank-apply-btn {',
        '  padding: 6px 16px;',
        '  font-size: 11px;',
        '  font-family: inherit;',
        '  cursor: pointer;',
        '  border: 1px outset var(--windowBorder, #c0c0c0);',
        '  background: var(--windowBg, #c0c0c0);',
        '  color: #000;',
        '  min-width: 90px;',
        '}',
        '.bank-apply-btn:hover { background: #d4d0c8; }',
        '.bank-apply-btn:active { border: 1px inset #c0c0c0; background: #b0b0b0; }',
        '.bank-apply-btn-primary {',
        '  background: linear-gradient(to bottom, #4a90e2, #2e5ea8);',
        '  color: white;',
        '  border: 1px outset #4a90e2;',
        '  font-weight: bold;',
        '}',
        '.bank-apply-btn-primary:hover { background: linear-gradient(to bottom, #5ba0f2, #3e6eb8); }',
        '.bank-apply-btn-primary:active { border: 1px inset #4a90e2; background: linear-gradient(to bottom, #2e5ea8, #1e4e98); }',

        // Score change badge
        '.bank-apply-score-change {',
        '  display: inline-block;',
        '  font-size: 10px;',
        '  padding: 2px 8px;',
        '  border-radius: 3px;',
        '  margin-top: 6px;',
        '}',
        '.bank-apply-score-change.negative {',
        '  background: #fff0f0; color: #b22222; border: 1px solid #e0b0b0;',
        '}',

        // Animations
        '@keyframes bankApplyFadeIn {',
        '  from { opacity: 0; } to { opacity: 1; }',
        '}',
        '@keyframes bankApplySlideIn {',
        '  from { transform: scale(0.85) translateY(-15px); opacity: 0; }',
        '  to { transform: scale(1) translateY(0); opacity: 1; }',
        '}',
        '@keyframes bankApplySpin {',
        '  0% { transform: rotate(0deg); }',
        '  100% { transform: rotate(360deg); }',
        '}',
        '@keyframes bankApplyBounce {',
        '  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }',
        '  40% { transform: translateY(-12px); }',
        '  60% { transform: translateY(-5px); }',
        '}',
        '@media (prefers-reduced-motion: reduce) {',
        '  .bank-apply-overlay, .bank-apply-dialog,',
        '  .bank-apply-spinner, .bank-apply-check,',
        '  .bank-apply-denied-icon { animation: none; }',
        '}'
    ].join('\n');

    document.head.appendChild(style);
};

/**
 * Show the card application modal in processing state, run the application,
 * then transition to approved or denied.
 */
BankSystem.prototype.applyForCard = async function(tierKey) {
    var self = this;
    var fs = (typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService.isReady())
        ? elxaOS.financeService : null;

    if (!fs) {
        this.showError('Finance service unavailable.');
        return;
    }

    // Inject CSS if first time
    this._injectCardModalCSS();

    // Build overlay
    var root = this._root;
    if (!root) return;

    // Make root position:relative so the overlay is scoped to the bank app
    root.style.position = 'relative';

    var overlay = document.createElement('div');
    overlay.className = 'bank-apply-overlay';
    overlay.id = 'bankApplyModal';
    overlay.innerHTML =
        '<div class="bank-apply-backdrop"></div>' +
        '<div class="bank-apply-dialog">' +
            '<div class="bank-apply-titlebar">' +
                '<span>Credit Card Application</span>' +
                '<button class="bank-apply-close" data-action="close-apply-modal">&times;</button>' +
            '</div>' +
            '<div class="bank-apply-body" id="bankApplyBody">' +
                '<div class="bank-apply-spinner"></div>' +
                '<div style="font-size:13px;font-weight:bold;color:#000080;margin-bottom:4px;">Processing Application</div>' +
                '<div class="bank-apply-progress-track">' +
                    '<div class="bank-apply-progress-fill" id="bankApplyProgress"></div>' +
                '</div>' +
                '<div class="bank-apply-status-msg" id="bankApplyStatus">Pulling your credit report...</div>' +
            '</div>' +
        '</div>';

    root.appendChild(overlay);

    // Pin overlay to the visible scroll area, not the full page height
    var scrollContainer = root.closest('.window-content') || root.parentElement || root;
    var scrollTop = scrollContainer.scrollTop || 0;
    var visibleHeight = scrollContainer.clientHeight || scrollContainer.offsetHeight;
    overlay.style.top = scrollTop + 'px';
    overlay.style.bottom = 'auto';
    overlay.style.height = visibleHeight + 'px';

    // Animate the processing messages
    var messages = [
        'Pulling your credit report...',
        'Checking your score...',
        'Running the numbers...',
        'Consulting the snakes...',
        'Almost there...'
    ];
    var statusEl = document.getElementById('bankApplyStatus');
    var progressEl = document.getElementById('bankApplyProgress');
    var msgIndex = 0;
    var progressPct = 0;

    var messageInterval = setInterval(function() {
        msgIndex++;
        if (msgIndex < messages.length && statusEl) {
            statusEl.textContent = messages[msgIndex];
        }
    }, 600);

    var progressInterval = setInterval(function() {
        progressPct = Math.min(progressPct + 12, 85);
        if (progressEl) progressEl.style.width = progressPct + '%';
    }, 350);

    // Run the actual application (with a minimum display time of 2.5s so it feels real)
    var startTime = Date.now();
    var result = await fs.applyForCreditCard(tierKey);
    var elapsed = Date.now() - startTime;
    var remaining = Math.max(0, 2500 - elapsed);
    await new Promise(function(r) { setTimeout(r, remaining); });

    clearInterval(messageInterval);
    clearInterval(progressInterval);

    // Fill progress to 100%
    if (progressEl) progressEl.style.width = '100%';
    await new Promise(function(r) { setTimeout(r, 400); });

    // Transition to result
    var body = document.getElementById('bankApplyBody');
    if (!body) return;

    if (result.approved) {
        // --- APPROVED ---
        var card = result.card || {};
        var cardNumber = card.number || 'XXXX-XXXX-XXXX-????';
        var last4 = cardNumber.slice(-4);
        var maskedNumber = 'XXXX  XXXX  XXXX  ' + last4;

        body.innerHTML =
            '<div class="bank-apply-check">&#10004;</div>' +
            '<div class="bank-apply-result-title approved">Application Approved!</div>' +
            '<div class="bank-apply-card-preview">' +
                '<div class="card-bank-name">First Snakesian Bank</div>' +
                '<div class="card-number">' + maskedNumber + '</div>' +
                '<div class="card-name">' + (card.name || tierKey) + '</div>' +
                '<div class="card-meta">' +
                    '<span>MEMBER SINCE ' + new Date().getFullYear() + '</span>' +
                    '<span>CREDIT CARD</span>' +
                '</div>' +
            '</div>' +
            '<div class="bank-apply-detail-rows">' +
                '<div class="bank-apply-detail-row"><span>Credit Limit:</span> <strong>$' + (card.creditLimit ? card.creditLimit.toFixed(2) : '???') + '</strong></div>' +
                '<div class="bank-apply-detail-row"><span>APR:</span> <strong>' + (card.apr || '???') + '%</strong></div>' +
                '<div class="bank-apply-detail-row"><span>Annual Fee:</span> <strong>' + (card.annualFee > 0 ? '$' + card.annualFee.toFixed(2) + '/yr' : 'None') + '</strong></div>' +
                '<div class="bank-apply-detail-row"><span>Min Payment:</span> <strong>$' + (card.minimumPayment ? card.minimumPayment.toFixed(2) : '???') + '</strong></div>' +
                '<div class="bank-apply-detail-row"><span>Due Day:</span> <strong>' + (card.dueDay || '??') + 'th of month</strong></div>' +
            '</div>' +
            '<div class="bank-apply-score-change negative">Credit score: -5 (hard inquiry)</div>' +
            '<div class="bank-apply-buttons">' +
                '<button class="bank-apply-btn-primary bank-apply-btn" data-action="apply-modal-view-cards">View My Cards</button>' +
                '<button class="bank-apply-btn" data-action="apply-modal-back">Continue Browsing</button>' +
            '</div>';
    } else {
        // --- DENIED ---
        var reason = result.message || 'Your application was not approved at this time.';
        var tips = self._generateCreditTips(fs);
        var tipsHtml = '';
        if (tips.length > 0) {
            tipsHtml =
                '<div class="bank-apply-tips">' +
                    '<strong>Tips to Improve:</strong>' +
                    '<ul>' + tips.map(function(t) { return '<li>' + t + '</li>'; }).join('') + '</ul>' +
                '</div>';
        }

        body.innerHTML =
            '<div class="bank-apply-denied-icon">&#10008;</div>' +
            '<div class="bank-apply-result-title denied">Application Denied</div>' +
            '<div class="bank-apply-denied-reason">' + reason + '</div>' +
            tipsHtml +
            '<div class="bank-apply-score-change negative">Credit score: -5 (hard inquiry)</div>' +
            '<div class="bank-apply-buttons">' +
                '<button class="bank-apply-btn-primary bank-apply-btn" data-action="apply-modal-back">Back to Cards</button>' +
            '</div>';
    }

    // Refresh underlying data
    self.showApplyForCards();
    self.renderCreditScoreWidget();
    self.renderMyCardsSection();
};

/**
 * Close the card application modal.
 */
BankSystem.prototype.closeCardApplicationModal = function() {
    var modal = document.getElementById('bankApplyModal');
    if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
    }
};


// =================================
// CARD PAYMENT FORM
// =================================

BankSystem.prototype.showCardPaymentForm = function(cardId) {
    this.hideTransactionForms();
    this.hideCardSections();

    var fs = (typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService.isReady())
        ? elxaOS.financeService : null;

    if (!fs) return;

    var cards = fs.getCreditCardsSync();
    var card = cards.find(function(c) { return c.id === cardId; });
    if (!card) return;

    var container = document.getElementById('cardPaymentSection');
    if (!container) return;

    container.innerHTML =
        '<h3 class="bank-form-header"><span data-icon="credit-card"></span> Pay Credit Card: ' + card.name + '</h3>' +
        '<div class="bank-card-pay-info">' +
            '<div>Card: **** **** **** ' + card.last4 + '</div>' +
            '<div>Balance Owed: <strong style="color:#dc143c">$' + card.balance.toFixed(2) + '</strong></div>' +
            '<div>Minimum Payment: $' + card.minimumPayment.toFixed(2) + '</div>' +
        '</div>' +
        '<input type="hidden" id="payCardId" value="' + card.id + '">' +
        '<div class="bank-form-group">' +
            '<label for="cardPayAmount">Payment Amount (USD):</label>' +
            '<input type="number" id="cardPayAmount" min="0.01" step="0.01" max="' + card.balance.toFixed(2) + '" placeholder="0.00" value="' + card.balance.toFixed(2) + '">' +
        '</div>' +
        '<div class="bank-form-group">' +
            '<label for="cardPayFrom">Pay From:</label>' +
            '<select id="cardPayFrom">' +
                '<option value="checking">Checking Account</option>' +
                '<option value="savings">Savings Account</option>' +
            '</select>' +
        '</div>' +
        '<div class="bank-form-actions">' +
            '<button class="bank-btn" data-action="process-card-payment">Make Payment</button>' +
            '<button class="bank-btn-secondary" data-action="cancel-card-section">Cancel</button>' +
        '</div>';

    container.classList.remove('hidden');

    container.querySelectorAll('[data-icon]').forEach(function(el) {
        el.innerHTML = ElxaIcons.renderAction(el.dataset.icon);
    });

    setTimeout(function() {
        var el = document.getElementById('cardPayAmount');
        if (el) el.focus();
    }, 100);
};

BankSystem.prototype.processCardPayment = async function() {
    var cardId = document.getElementById('payCardId').value;
    var amount = parseFloat(document.getElementById('cardPayAmount').value);
    var fromAccount = document.getElementById('cardPayFrom').value;

    if (!amount || amount <= 0) {
        this.showError('Please enter a valid payment amount.');
        return;
    }

    var fs = (typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService.isReady())
        ? elxaOS.financeService : null;

    if (!fs) {
        this.showError('Finance service unavailable.');
        return;
    }

    var result = await fs.payCredit(cardId, amount, fromAccount);

    if (result.success) {
        this.showSuccess(result.message);
        this.hideCardSections();
        this._syncFromFinanceService();
        this.updateAccountDisplay();
        this.renderMyCardsSection();
        this.renderCreditScoreWidget();
    } else {
        this.showError(result.message);
    }
};

BankSystem.prototype.closeCard = async function(cardId) {
    var fs = (typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService.isReady())
        ? elxaOS.financeService : null;

    if (!fs) {
        this.showError('Finance service unavailable.');
        return;
    }

    var result = await fs.closeCreditCard(cardId);

    if (result.success) {
        this.showSuccess(result.message);
        this.renderMyCardsSection();
    } else {
        this.showError(result.message);
    }
};
