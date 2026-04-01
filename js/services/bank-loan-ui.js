// =================================
// FIRST SNAKESIAN BANK — Loan UI
// Dashboard loan widget, loan application page, loan payment form, application modal
// =================================

/**
 * Render the "My Loans" section on the dashboard.
 */
BankSystem.prototype.renderMyLoansSection = function() {
    var container = document.getElementById('myLoansSection');
    if (!container) return;

    var fs = (typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService.isReady())
        ? elxaOS.financeService : null;

    if (!fs) {
        container.innerHTML = '';
        return;
    }

    var loans = fs.getLoansSync().filter(function(l) { return l.status === 'active'; });

    if (loans.length === 0) {
        container.innerHTML =
            '<div class="bank-my-loans-empty">' +
                '<h3><span data-icon="bank"></span> My Loans</h3>' +
                '<p>You don\'t have any active loans. <a data-action="show-apply-loans" style="cursor:pointer;color:#4169e1;text-decoration:underline;">Apply for a loan!</a></p>' +
            '</div>';
        container.querySelectorAll('[data-icon]').forEach(function(el) {
            el.innerHTML = ElxaIcons.renderAction(el.dataset.icon);
        });
        return;
    }

    var totalOwed = loans.reduce(function(s, l) { return s + l.remainingBalance; }, 0);
    var totalMonthly = loans.reduce(function(s, l) { return s + l.monthlyPayment; }, 0);

    var loansHtml = '<div class="bank-my-loans"><h3><span data-icon="bank"></span> My Loans (' + loans.length + ' active)</h3>';
    loansHtml += '<div class="bank-loans-summary">Total owed: <strong style="color:#dc143c">$' + totalOwed.toFixed(2) + '</strong> &bull; Monthly payments: <strong>$' + totalMonthly.toFixed(2) + '</strong></div>';
    loansHtml += '<div class="bank-loans-grid">';

    loans.forEach(function(loan) {
        var typeName = loan.type.charAt(0).toUpperCase() + loan.type.slice(1);
        var progressPct = loan.termMonths > 0 ? Math.round((loan.paidMonths / loan.termMonths) * 100) : 0;
        var remainingMonths = loan.termMonths - loan.paidMonths;
        var paidPct = loan.principal > 0 ? Math.round(((loan.principal - loan.remainingBalance) / loan.principal) * 100) : 0;

        var missedWarning = '';
        if (loan.missedPayments > 0) {
            missedWarning = '<div class="bank-loan-warning">\u26a0\ufe0f ' + loan.missedPayments + ' missed payment' + (loan.missedPayments > 1 ? 's' : '') + ' &mdash; ' + (3 - loan.missedPayments) + ' more until default!</div>';
        }

        loansHtml +=
            '<div class="bank-loan-item">' +
                '<div class="bank-loan-type-badge bank-loan-type-' + loan.type + '">' + typeName + ' Loan</div>' +
                '<div class="bank-loan-details">' +
                    '<div class="bank-loan-detail"><span>Original Amount:</span> $' + loan.principal.toFixed(2) + '</div>' +
                    '<div class="bank-loan-detail"><span>Remaining Balance:</span> <strong style="color:#dc143c">$' + loan.remainingBalance.toFixed(2) + '</strong></div>' +
                    '<div class="bank-loan-detail"><span>Monthly Payment:</span> $' + loan.monthlyPayment.toFixed(2) + '</div>' +
                    '<div class="bank-loan-detail"><span>APR:</span> ' + loan.apr + '%</div>' +
                    '<div class="bank-loan-detail"><span>Progress:</span> ' + loan.paidMonths + ' of ' + loan.termMonths + ' months (' + remainingMonths + ' left)</div>' +
                    '<div class="bank-loan-detail"><span>Payment Source:</span> ' + (loan.sourceAccount || 'checking') + '</div>' +
                    (loan.linkedAsset ? '<div class="bank-loan-detail"><span>Linked Asset:</span> ' + loan.linkedAsset.type + ' #' + loan.linkedAsset.id + '</div>' : '') +
                '</div>' +
                '<div class="bank-loan-progress">' +
                    '<div class="bank-loan-progress-label">Paid: ' + paidPct + '%</div>' +
                    '<div class="bank-loan-progress-track"><div class="bank-loan-progress-fill" style="width:' + paidPct + '%"></div></div>' +
                '</div>' +
                missedWarning +
                '<div class="bank-loan-actions">' +
                    '<button class="bank-btn" data-action="show-loan-payment" data-loan-id="' + loan.id + '">Make Payment</button>' +
                    '<button class="bank-btn-secondary" data-action="show-loan-schedule" data-loan-id="' + loan.id + '">View Schedule</button>' +
                '</div>' +
            '</div>';
    });

    loansHtml += '</div></div>';
    container.innerHTML = loansHtml;

    container.querySelectorAll('[data-icon]').forEach(function(el) {
        el.innerHTML = ElxaIcons.renderAction(el.dataset.icon);
    });
};

// =================================
// LOAN APPLICATION PAGE
// =================================

/**
 * Show the "Apply for a Loan" section.
 */
BankSystem.prototype.showApplyForLoans = function() {
    this.hideAllSections();

    var container = document.getElementById('loanApplySection');
    if (!container) return;
    container.classList.remove('hidden');

    var fs = (typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService.isReady())
        ? elxaOS.financeService : null;

    if (!fs) {
        container.innerHTML = '<div class="bank-error">Finance service unavailable.</div>';
        return;
    }

    var types = fs.getAvailableLoanTypesSync();
    var scoreData = fs.getCreditScoreSync();

    var html = '<h3 class="bank-form-header"><span data-icon="bank"></span> Apply for a Loan</h3>';
    html += '<p style="font-size:11px;margin-bottom:15px;">Your credit score: <strong style="color:' + scoreData.color + '">' + scoreData.score + ' (' + scoreData.rating + ')</strong>. Better scores unlock larger loans with lower interest rates.</p>';
    html += '<div class="bank-security-notice"><strong>Note:</strong> Each application results in a hard inquiry on your credit report (-5 points). Loan funds are deposited directly into your checking account.</div>';
    html += '<div class="bank-loan-tiers">';

    types.forEach(function(ltype) {
        var isAvailable = ltype.eligible;
        var cardClass = isAvailable ? 'bank-tier-card available' : 'bank-tier-card locked';

        html +=
            '<div class="' + cardClass + '">' +
                '<div class="bank-tier-header">' +
                    '<div class="bank-tier-name">' + ltype.name + '</div>' +
                    (!isAvailable ? '<span class="bank-tier-badge locked-badge">' + ltype.requiredRating + ' (' + ltype.requiredScore + '+)</span>' : '') +
                    (ltype.activeOfType > 0 ? '<span class="bank-tier-badge owned-badge">' + ltype.activeOfType + '/' + ltype.maxActive + ' active</span>' : '') +
                '</div>' +
                '<div class="bank-tier-details">' +
                    '<div class="bank-tier-detail"><strong>Loan Amount:</strong> $' + ltype.amountRange[0] + ' &ndash; $' + ltype.amountRange[1] + (isAvailable ? ' (max approved: $' + ltype.maxApprovedAmount + ')' : '') + '</div>' +
                    '<div class="bank-tier-detail"><strong>APR:</strong> ~' + ltype.baseApr + '%' + (isAvailable ? ' (yours: ~' + ltype.estimatedApr + '%)' : '') + '</div>' +
                    '<div class="bank-tier-detail"><strong>Term:</strong> ' + ltype.termRange[0] + ' &ndash; ' + ltype.termRange[1] + ' months</div>' +
                    (isAvailable ? '<div class="bank-tier-detail"><strong>Sample:</strong> Borrow $' + ltype.sampleAmount + ' for ' + ltype.sampleTerm + ' months &asymp; $' + ltype.estimatedMonthlyPayment.toFixed(2) + '/mo</div>' : '') +
                    '<div class="bank-tier-detail" style="font-style:italic;color:#666;margin-top:4px">' + ltype.description + '</div>' +
                '</div>' +
                '<div class="bank-tier-actions">' +
                    (isAvailable ? '<button class="bank-btn" data-action="show-loan-form" data-loan-type="' + ltype.key + '">Apply Now</button>' : '') +
                    (!isAvailable ? '<div class="bank-tier-reason">' + ltype.reason + '</div>' : '') +
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

// =================================
// LOAN APPLICATION FORM (within the apply section)
// =================================

/**
 * Show the loan application form for a specific type.
 */
BankSystem.prototype.showLoanApplicationForm = function(loanType) {
    var fs = (typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService.isReady())
        ? elxaOS.financeService : null;
    if (!fs) return;

    var types = fs.getAvailableLoanTypesSync();
    var ltype = types.find(function(t) { return t.key === loanType; });
    if (!ltype || !ltype.eligible) {
        this.showError('You are not eligible for this loan type.');
        return;
    }

    this.hideAllSections();
    var container = document.getElementById('loanApplySection');
    if (!container) return;
    container.classList.remove('hidden');

    var html =
        '<h3 class="bank-form-header"><span data-icon="bank"></span> Apply for ' + ltype.name + '</h3>' +
        '<div class="bank-security-notice">' +
            '<strong>' + ltype.name + ':</strong> ' + ltype.description + '<br>' +
            'Max approved amount: <strong>$' + ltype.maxApprovedAmount + '</strong> &bull; Estimated APR: <strong>' + ltype.estimatedApr + '%</strong>' +
        '</div>' +
        '<input type="hidden" id="loanApplyType" value="' + ltype.key + '">' +
        '<div class="bank-form-group">' +
            '<label for="loanApplyAmount">Loan Amount (USD):</label>' +
            '<input type="number" id="loanApplyAmount" min="' + ltype.amountRange[0] + '" max="' + ltype.maxApprovedAmount + '" step="1" placeholder="' + ltype.sampleAmount + '" value="' + ltype.sampleAmount + '">' +
            '<div style="font-size:10px;color:#666;margin-top:2px;">Min: $' + ltype.amountRange[0] + ' &bull; Max: $' + ltype.maxApprovedAmount + '</div>' +
        '</div>' +
        '<div class="bank-form-group">' +
            '<label for="loanApplyTerm">Loan Term (months):</label>' +
            '<input type="number" id="loanApplyTerm" min="' + ltype.termRange[0] + '" max="' + ltype.termRange[1] + '" step="1" value="' + ltype.sampleTerm + '">' +
            '<div style="font-size:10px;color:#666;margin-top:2px;">Min: ' + ltype.termRange[0] + ' months &bull; Max: ' + ltype.termRange[1] + ' months</div>' +
        '</div>' +
        '<div class="bank-form-group">' +
            '<label for="loanApplyPurpose">Purpose (optional):</label>' +
            '<input type="text" id="loanApplyPurpose" placeholder="e.g., New car, home improvement...">' +
        '</div>' +
        '<div id="loanEstimate" class="bank-loan-estimate"></div>' +
        '<div class="bank-form-actions">' +
            '<button class="bank-btn" data-action="submit-loan-application">Submit Application</button>' +
            '<button class="bank-btn-secondary" data-action="show-apply-loans">Back to Loan Types</button>' +
        '</div>';

    container.innerHTML = html;

    container.querySelectorAll('[data-icon]').forEach(function(el) {
        el.innerHTML = ElxaIcons.renderAction(el.dataset.icon);
    });

    // Live estimate calculator
    var self = this;
    var amountInput = document.getElementById('loanApplyAmount');
    var termInput = document.getElementById('loanApplyTerm');
    var updateEstimate = function() { self._updateLoanEstimate(ltype); };
    if (amountInput) amountInput.addEventListener('input', updateEstimate);
    if (termInput) termInput.addEventListener('input', updateEstimate);
    updateEstimate();

    setTimeout(function() {
        if (amountInput) amountInput.focus();
    }, 100);
};

/**
 * Update the live loan estimate display.
 */
BankSystem.prototype._updateLoanEstimate = function(ltype) {
    var estimateEl = document.getElementById('loanEstimate');
    if (!estimateEl) return;

    var fs = (typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService.isReady())
        ? elxaOS.financeService : null;
    if (!fs) return;

    var amount = parseFloat(document.getElementById('loanApplyAmount')?.value) || 0;
    var term = parseInt(document.getElementById('loanApplyTerm')?.value) || 0;

    if (amount <= 0 || term <= 0) {
        estimateEl.innerHTML = '';
        return;
    }

    var apr = ltype.estimatedApr;
    var monthly = fs._calculateMonthlyPayment(amount, apr, term);
    var totalInterest = fs._calculateTotalInterest(amount, monthly, term);
    var totalCost = amount + totalInterest;

    estimateEl.innerHTML =
        '<div class="bank-estimate-box">' +
            '<strong>Loan Estimate</strong>' +
            '<div class="bank-estimate-row"><span>Monthly Payment:</span> <strong>$' + monthly.toFixed(2) + '</strong></div>' +
            '<div class="bank-estimate-row"><span>Total Interest:</span> $' + totalInterest.toFixed(2) + '</div>' +
            '<div class="bank-estimate-row"><span>Total Cost:</span> $' + totalCost.toFixed(2) + '</div>' +
            '<div class="bank-estimate-row"><span>APR:</span> ' + apr + '%</div>' +
        '</div>';
};


// =================================
// LOAN APPLICATION MODAL
// =================================

/**
 * Submit a loan application — shows processing modal, runs application, shows result.
 */
BankSystem.prototype.submitLoanApplication = async function() {
    var self = this;
    var loanType = document.getElementById('loanApplyType')?.value;
    var amount = parseFloat(document.getElementById('loanApplyAmount')?.value) || 0;
    var term = parseInt(document.getElementById('loanApplyTerm')?.value) || 0;
    var purpose = document.getElementById('loanApplyPurpose')?.value || '';

    if (!loanType || amount <= 0 || term <= 0) {
        this.showError('Please fill in all required fields.');
        return;
    }

    var fs = (typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService.isReady())
        ? elxaOS.financeService : null;
    if (!fs) {
        this.showError('Finance service unavailable.');
        return;
    }

    // Inject CSS (reuses card modal styles)
    this._injectCardModalCSS();

    var root = this._root;
    if (!root) return;
    root.style.position = 'relative';

    var overlay = document.createElement('div');
    overlay.className = 'bank-apply-overlay';
    overlay.id = 'bankLoanModal';
    overlay.innerHTML =
        '<div class="bank-apply-backdrop"></div>' +
        '<div class="bank-apply-dialog">' +
            '<div class="bank-apply-titlebar">' +
                '<span>Loan Application</span>' +
                '<button class="bank-apply-close" data-action="close-loan-modal">&times;</button>' +
            '</div>' +
            '<div class="bank-apply-body" id="bankLoanBody">' +
                '<div class="bank-apply-spinner"></div>' +
                '<div style="font-size:13px;font-weight:bold;color:#000080;margin-bottom:4px;">Processing Application</div>' +
                '<div class="bank-apply-progress-track">' +
                    '<div class="bank-apply-progress-fill" id="bankLoanProgress"></div>' +
                '</div>' +
                '<div class="bank-apply-status-msg" id="bankLoanStatus">Pulling your credit report...</div>' +
            '</div>' +
        '</div>';

    root.appendChild(overlay);

    // Pin overlay
    var scrollContainer = root.closest('.window-content') || root.parentElement || root;
    var scrollTop = scrollContainer.scrollTop || 0;
    var visibleHeight = scrollContainer.clientHeight || scrollContainer.offsetHeight;
    overlay.style.top = scrollTop + 'px';
    overlay.style.bottom = 'auto';
    overlay.style.height = visibleHeight + 'px';

    // Animate processing
    var messages = [
        'Pulling your credit report...',
        'Verifying income sources...',
        'Calculating risk assessment...',
        'Consulting the treasury snakes...',
        'Finalizing decision...'
    ];
    var statusEl = document.getElementById('bankLoanStatus');
    var progressEl = document.getElementById('bankLoanProgress');
    var msgIndex = 0;
    var progressPct = 0;

    var messageInterval = setInterval(function() {
        msgIndex++;
        if (msgIndex < messages.length && statusEl) {
            statusEl.textContent = messages[msgIndex];
        }
    }, 600);

    var progressInterval = setInterval(function() {
        progressPct = Math.min(progressPct + 10, 85);
        if (progressEl) progressEl.style.width = progressPct + '%';
    }, 350);

    // Run the application
    var startTime = Date.now();
    var result = await fs.applyForLoan({
        type: loanType,
        amount: amount,
        termMonths: term,
        purpose: purpose
    });
    var elapsed = Date.now() - startTime;
    var remaining = Math.max(0, 2800 - elapsed);
    await new Promise(function(r) { setTimeout(r, remaining); });

    clearInterval(messageInterval);
    clearInterval(progressInterval);

    if (progressEl) progressEl.style.width = '100%';
    await new Promise(function(r) { setTimeout(r, 400); });

    // Show result
    var body = document.getElementById('bankLoanBody');
    if (!body) return;

    if (result.approved) {
        var loan = result.loan || {};
        var terms = result.terms || {};
        var typeName = loanType.charAt(0).toUpperCase() + loanType.slice(1);

        body.innerHTML =
            '<div class="bank-apply-check">&#10004;</div>' +
            '<div class="bank-apply-result-title approved">Loan Approved!</div>' +
            '<div style="font-size:12px;color:#333;margin-bottom:10px;">' + typeName + ' Loan &mdash; funds deposited to your checking account!</div>' +
            '<div class="bank-apply-detail-rows">' +
                '<div class="bank-apply-detail-row"><span>Loan Amount:</span> <strong>$' + terms.principal.toFixed(2) + '</strong></div>' +
                '<div class="bank-apply-detail-row"><span>APR:</span> <strong>' + terms.apr + '%</strong></div>' +
                '<div class="bank-apply-detail-row"><span>Term:</span> <strong>' + terms.termMonths + ' months</strong></div>' +
                '<div class="bank-apply-detail-row"><span>Monthly Payment:</span> <strong>$' + terms.monthlyPayment.toFixed(2) + '</strong></div>' +
                '<div class="bank-apply-detail-row"><span>Total Interest:</span> <strong>$' + terms.totalInterest.toFixed(2) + '</strong></div>' +
                '<div class="bank-apply-detail-row"><span>Total Cost:</span> <strong>$' + terms.totalCost.toFixed(2) + '</strong></div>' +
            '</div>' +
            '<div class="bank-apply-score-change negative">Credit score: -5 (hard inquiry)</div>' +
            '<div class="bank-apply-buttons">' +
                '<button class="bank-apply-btn-primary bank-apply-btn" data-action="loan-modal-dashboard">View Dashboard</button>' +
                '<button class="bank-apply-btn" data-action="close-loan-modal">Continue Browsing</button>' +
            '</div>';
    } else {
        var tips = result.tips || [];
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
            '<div class="bank-apply-result-title denied">Loan Denied</div>' +
            '<div class="bank-apply-denied-reason">' + (result.message || 'Your application was not approved at this time.') + '</div>' +
            tipsHtml +
            '<div class="bank-apply-score-change negative">Credit score: -5 (hard inquiry)</div>' +
            '<div class="bank-apply-buttons">' +
                '<button class="bank-apply-btn-primary bank-apply-btn" data-action="close-loan-modal">Back to Loans</button>' +
            '</div>';
    }

    // Refresh underlying displays
    self.showApplyForLoans();
    self.renderCreditScoreWidget();
    self.renderMyLoansSection();
};

/**
 * Close the loan application modal.
 */
BankSystem.prototype.closeLoanModal = function() {
    var modal = document.getElementById('bankLoanModal');
    if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
    }
};


// =================================
// LOAN PAYMENT FORM
// =================================

BankSystem.prototype.showLoanPaymentForm = function(loanId) {
    this.hideTransactionForms();
    this.hideLoanSections();

    var fs = (typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService.isReady())
        ? elxaOS.financeService : null;
    if (!fs) return;

    var loans = fs.getLoansSync();
    var loan = loans.find(function(l) { return l.id === loanId; });
    if (!loan) return;

    var typeName = loan.type.charAt(0).toUpperCase() + loan.type.slice(1);
    var container = document.getElementById('loanPaymentSection');
    if (!container) return;

    container.innerHTML =
        '<h3 class="bank-form-header"><span data-icon="bank"></span> Pay ' + typeName + ' Loan</h3>' +
        '<div class="bank-card-pay-info">' +
            '<div>Loan ID: ...' + loan.id.slice(-6) + '</div>' +
            '<div>Remaining Balance: <strong style="color:#dc143c">$' + loan.remainingBalance.toFixed(2) + '</strong></div>' +
            '<div>Monthly Payment: $' + loan.monthlyPayment.toFixed(2) + '</div>' +
            '<div>Progress: ' + loan.paidMonths + '/' + loan.termMonths + ' months</div>' +
        '</div>' +
        '<input type="hidden" id="payLoanId" value="' + loan.id + '">' +
        '<div class="bank-form-group">' +
            '<label for="loanPayAmount">Payment Amount (USD):</label>' +
            '<input type="number" id="loanPayAmount" min="0.01" step="0.01" max="' + loan.remainingBalance.toFixed(2) + '" placeholder="0.00" value="' + loan.monthlyPayment.toFixed(2) + '">' +
            '<div style="font-size:10px;color:#666;margin-top:2px;">Monthly payment: $' + loan.monthlyPayment.toFixed(2) + ' &bull; Pay more to reduce interest!</div>' +
        '</div>' +
        '<div class="bank-form-group">' +
            '<label for="loanPayFrom">Pay From:</label>' +
            '<select id="loanPayFrom">' +
                '<option value="checking"' + (loan.sourceAccount === 'checking' ? ' selected' : '') + '>Checking Account</option>' +
                '<option value="savings"' + (loan.sourceAccount === 'savings' ? ' selected' : '') + '>Savings Account</option>' +
            '</select>' +
        '</div>' +
        '<div class="bank-form-actions">' +
            '<button class="bank-btn" data-action="process-loan-payment">Make Payment</button>' +
            '<button class="bank-btn" data-action="payoff-loan" data-loan-id="' + loan.id + '">Pay Off Entire Loan ($' + loan.remainingBalance.toFixed(2) + ')</button>' +
            '<button class="bank-btn-secondary" data-action="cancel-loan-section">Cancel</button>' +
        '</div>';

    container.classList.remove('hidden');

    container.querySelectorAll('[data-icon]').forEach(function(el) {
        el.innerHTML = ElxaIcons.renderAction(el.dataset.icon);
    });

    setTimeout(function() {
        var el = document.getElementById('loanPayAmount');
        if (el) el.focus();
    }, 100);
};

BankSystem.prototype.processLoanPayment = async function() {
    var loanId = document.getElementById('payLoanId')?.value;
    var amount = parseFloat(document.getElementById('loanPayAmount')?.value);
    var fromAccount = document.getElementById('loanPayFrom')?.value;

    if (!loanId || !amount || amount <= 0) {
        this.showError('Please enter a valid payment amount.');
        return;
    }

    var fs = (typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService.isReady())
        ? elxaOS.financeService : null;
    if (!fs) {
        this.showError('Finance service unavailable.');
        return;
    }

    var result = await fs.payLoan(loanId, amount, fromAccount);

    if (result.success) {
        this.showSuccess(result.message);
        this.hideLoanSections();
        this._syncFromFinanceService();
        this.updateAccountDisplay();
        this.renderMyLoansSection();
        this.renderCreditScoreWidget();
    } else {
        this.showError(result.message);
    }
};

BankSystem.prototype.payOffLoan = async function(loanId) {
    var fs = (typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService.isReady())
        ? elxaOS.financeService : null;
    if (!fs) {
        this.showError('Finance service unavailable.');
        return;
    }

    var result = await fs.payOffLoan(loanId);

    if (result.success) {
        this.showSuccess(result.message);
        this.hideLoanSections();
        this._syncFromFinanceService();
        this.updateAccountDisplay();
        this.renderMyLoansSection();
        this.renderCreditScoreWidget();
    } else {
        this.showError(result.message);
    }
};

BankSystem.prototype.hideLoanSections = function() {
    var sections = ['loanPaymentSection'];
    sections.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
};


// =================================
// AMORTIZATION SCHEDULE DISPLAY
// =================================

BankSystem.prototype.showAmortizationSchedule = function(loanId) {
    var fs = (typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService.isReady())
        ? elxaOS.financeService : null;
    if (!fs) return;

    var schedule = fs.getAmortizationSchedule(loanId);
    if (!schedule || schedule.length === 0) return;

    var loan = fs.getLoansSync().find(function(l) { return l.id === loanId; });
    var typeName = loan ? (loan.type.charAt(0).toUpperCase() + loan.type.slice(1)) : 'Loan';

    // Reuse the card modal CSS for the overlay
    this._injectCardModalCSS();

    var root = this._root;
    if (!root) return;
    root.style.position = 'relative';

    var overlay = document.createElement('div');
    overlay.className = 'bank-apply-overlay';
    overlay.id = 'bankScheduleModal';

    var tableRows = schedule.map(function(s) {
        var rowClass = s.isPaid ? 'style="background:#e8f5e9;"' : '';
        return '<tr ' + rowClass + '>' +
            '<td>' + s.month + (s.isPaid ? ' \u2713' : '') + '</td>' +
            '<td>$' + s.payment.toFixed(2) + '</td>' +
            '<td>$' + s.principal.toFixed(2) + '</td>' +
            '<td>$' + s.interest.toFixed(2) + '</td>' +
            '<td>$' + s.balance.toFixed(2) + '</td>' +
        '</tr>';
    }).join('');

    overlay.innerHTML =
        '<div class="bank-apply-backdrop"></div>' +
        '<div class="bank-apply-dialog" style="max-width:500px;max-height:80vh;overflow:auto;">' +
            '<div class="bank-apply-titlebar">' +
                '<span>' + typeName + ' Loan &mdash; Amortization Schedule</span>' +
                '<button class="bank-apply-close" data-action="close-schedule-modal">&times;</button>' +
            '</div>' +
            '<div style="padding:10px;font-size:11px;overflow:auto;max-height:60vh;">' +
                '<table style="width:100%;border-collapse:collapse;font-size:10px;">' +
                    '<thead><tr style="background:#ddd;font-weight:bold;"><td>Mo</td><td>Payment</td><td>Principal</td><td>Interest</td><td>Balance</td></tr></thead>' +
                    '<tbody>' + tableRows + '</tbody>' +
                '</table>' +
            '</div>' +
            '<div style="padding:8px;text-align:center;">' +
                '<button class="bank-apply-btn" data-action="close-schedule-modal">Close</button>' +
            '</div>' +
        '</div>';

    root.appendChild(overlay);

    // Pin overlay
    var scrollContainer = root.closest('.window-content') || root.parentElement || root;
    overlay.style.top = (scrollContainer.scrollTop || 0) + 'px';
    overlay.style.bottom = 'auto';
    overlay.style.height = (scrollContainer.clientHeight || scrollContainer.offsetHeight) + 'px';
};

BankSystem.prototype.closeScheduleModal = function() {
    var modal = document.getElementById('bankScheduleModal');
    if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
    }
};