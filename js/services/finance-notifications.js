// =================================
// FINANCE NOTIFICATIONS SERVICE
// =================================
// Listens to finance and inventory events emitted during the monthly
// cycle and:
//   1. Sends immersive, in-character emails via ElxaMail
//   2. Creates utilitarian notification center entries
//
// Loads after finance-cycle.js and notification-service.js.
// Uses the ElxaCorp email injection pattern (live → localStorage → queue).
// =================================

class FinanceNotificationService {
    constructor(eventBus) {
        this.eventBus = eventBus;

        // Cache rental property info so we still have it at eviction time
        // (the property gets removed from inventory before the event fires)
        this._rentalCache = {};

        this._setupListeners();

        console.log('📨 FinanceNotificationService initialized');
    }

    // =================================
    // LIFECYCLE
    // =================================

    init() {
        // Process any queued finance emails if ElxaMail is ready
        this._processQueuedEmails();
        console.log('📨 FinanceNotificationService ready');
    }

    // =================================
    // EVENT LISTENERS
    // =================================

    _setupListeners() {
        var self = this;

        // --- CREDIT CARD EVENTS ---

        this.eventBus.on('finance.paymentMissed', function(data) {
            if (!data) return;
            switch (data.type) {
                case 'credit-card':
                    self._onCreditCardMissed(data);
                    break;
                case 'loan':
                    self._onLoanMissed(data);
                    break;
                case 'property-tax':
                    self._onPropertyTaxMissed(data);
                    break;
                case 'vehicle-insurance':
                    self._onVehicleInsuranceMissed(data);
                    break;
                case 'recurring':
                    self._onRecurringMissed(data);
                    break;
            }
        });

        this.eventBus.on('finance.creditCardFrozen', function(data) {
            if (!data) return;
            self._onCreditCardFrozen(data);
        });

        // --- LOAN EVENTS ---

        this.eventBus.on('finance.loanDefaulted', function(data) {
            if (!data) return;
            self._onLoanDefaulted(data);
        });

        this.eventBus.on('finance.loanPaidOff', function(data) {
            if (!data) return;
            self._onLoanPaidOff(data);
        });

        // --- PROPERTY TAX EVENTS ---

        this.eventBus.on('inventory.taxForeclosure', function(data) {
            if (!data) return;
            self._onTaxForeclosure(data);
        });

        // --- EVICTION ---

        this.eventBus.on('inventory.propertyLost', function(data) {
            if (!data) return;
            if (data.reason === 'evicted') {
                self._onEviction(data);
            }
        });

        // --- VEHICLE IMPOUNDMENT ---

        this.eventBus.on('inventory.vehicleImpounded', function(data) {
            if (!data) return;
            self._onVehicleImpounded(data);
        });

        // --- POSITIVE / INFO EVENTS ---

        this.eventBus.on('finance.savingsInterest', function(data) {
            if (!data) return;
            self._onSavingsInterest(data);
        });

        this.eventBus.on('finance.creditScoreChanged', function(data) {
            if (!data) return;
            self._onCreditScoreChanged(data);
        });

        this.eventBus.on('finance.monthlyCycleCompleted', function(data) {
            if (!data) return;
            self._onMonthlyCycleCompleted(data);
        });

        // --- CHARITY / SUBSCRIPTION EVENTS ---

        this.eventBus.on('finance.paymentProcessed', function(data) {
            if (!data) return;
            if (data.type === 'recurring') {
                self._onRecurringPaymentProcessed(data);
            }
        });

        // --- EMPLOYMENT EVENTS ---

        this.eventBus.on('employment.paychecksProcessed', function(data) {
            if (!data) return;
            self._onPaychecksProcessed(data);
        });

        this.eventBus.on('employment.hired', function(data) {
            if (!data) return;
            self._onHired(data);
        });

        // --- STOCK EVENTS ---

        this.eventBus.on('stocks.dividendPaid', function(data) {
            if (!data) return;
            self._onDividendPaid(data);
        });

        this.eventBus.on('stocks.bigMove', function(data) {
            if (!data) return;
            self._onBigMove(data);
        });

        // --- GROCERY ORDER EVENTS ---

        this.eventBus.on('squiggly.orderComplete', function(data) {
            if (!data) return;
            self._onGroceryOrderComplete(data);
        });

        // --- FASHION ORDER EVENTS ---

        this.eventBus.on('fashionco.orderComplete', function(data) {
            if (!data) return;
            self._onFashionOrderComplete(data);
        });
    }

    // =================================
    // EVENT HANDLERS
    // =================================

    // --- CREDIT CARD ---

    _onCreditCardMissed(data) {
        var missesLeft = 3 - data.missedPayments;

        // Notification
        this._notify({
            title: 'Missed Payment',
            body: data.cardName + ' minimum ($' + data.amount.toFixed(2) + ') missed. $' + data.lateFee.toFixed(2) + ' late fee. ' + missesLeft + ' more miss' + (missesLeft !== 1 ? 'es' : '') + ' until frozen.',
            icon: 'mdi-credit-card-off',
            category: 'finance',
            urgency: 'warning',
            action: { type: 'launch', program: 'browser', url: 'snakesian-bank' }
        });

        // Email
        var isFirst = (data.missedPayments === 1);
        var subject = isFirst
            ? 'Important Notice Regarding Your ' + data.cardName + ' Account'
            : 'URGENT: Second Notice — ' + data.cardName + ' Account Past Due';
        var fromAddr = isFirst ? 'notices@firstsnakesian.bank' : 'collections@firstsnakesian.bank';

        var body;
        if (isFirst) {
            body = 'Dear Valued Customer,\n\n'
                + 'We are writing to inform you that the minimum payment of $' + data.amount.toFixed(2) + ' on your ' + data.cardName + ' was not received this billing cycle.\n\n'
                + 'As a result, a late fee of $' + data.lateFee.toFixed(2) + ' has been applied to your account.\n\n'
                + 'We understand that oversights happen. Please ensure your checking account has sufficient funds to cover next month\'s minimum payment to avoid additional fees.\n\n'
                + 'If you continue to miss payments, your account may be subject to suspension after ' + missesLeft + ' additional missed payment' + (missesLeft !== 1 ? 's' : '') + '.\n\n'
                + 'Please contact us if you are experiencing financial difficulties — we may be able to arrange a modified payment plan.\n\n'
                + 'Sincerely,\n\n'
                + 'Collections Department\n'
                + 'First Snakesian Bank\n'
                + 'notices@firstsnakesian.bank';
        } else {
            body = 'Dear Valued Customer,\n\n'
                + 'This is a SECOND NOTICE regarding your ' + data.cardName + ' account.\n\n'
                + 'Your minimum payment of $' + data.amount.toFixed(2) + ' has been missed for the ' + this._ordinal(data.missedPayments) + ' consecutive month. An additional late fee of $' + data.lateFee.toFixed(2) + ' has been applied.\n\n'
                + 'Your continued failure to remit payment is a serious matter. If payment is not received by the next billing cycle, your ' + data.cardName + ' will be SUSPENDED and no further charges will be permitted.\n\n'
                + 'Outstanding fees and interest will continue to accrue on your unpaid balance.\n\n'
                + 'We strongly urge you to bring your account current immediately.\n\n'
                + 'Regards,\n\n'
                + 'Collections Department\n'
                + 'First Snakesian Bank\n'
                + 'collections@firstsnakesian.bank';
        }

        this._sendEmail({
            from: fromAddr,
            fromName: 'First Snakesian Bank',
            subject: subject,
            body: body
        });
    }

    _onCreditCardFrozen(data) {
        // Notification
        this._notify({
            title: 'Card Frozen',
            body: data.cardName + ' suspended after ' + data.missedPayments + ' missed payments. Balance: $' + data.balance.toFixed(2) + '.',
            icon: 'mdi-credit-card-lock',
            category: 'finance',
            urgency: 'critical',
            action: { type: 'launch', program: 'browser', url: 'snakesian-bank' }
        });

        // Email
        this._sendEmail({
            from: 'urgent@firstsnakesian.bank',
            fromName: 'First Snakesian Bank',
            subject: 'ACCOUNT SUSPENDED — Immediate Action Required: ' + data.cardName,
            body: 'Dear Valued Customer,\n\n'
                + 'We regret to inform you that your ' + data.cardName + ' has been SUSPENDED effective immediately due to ' + data.missedPayments + ' consecutive missed payments.\n\n'
                + 'ACCOUNT DETAILS:\n'
                + '  Card: ' + data.cardName + '\n'
                + '  Status: SUSPENDED\n'
                + '  Outstanding Balance: $' + data.balance.toFixed(2) + '\n\n'
                + 'No further charges may be made on this card. Your outstanding balance of $' + data.balance.toFixed(2) + ' remains due and interest will continue to accrue.\n\n'
                + 'This suspension will be reflected in your credit history and may significantly impact your credit score.\n\n'
                + 'To discuss repayment options or account reinstatement, please visit any First Snakesian Bank branch or contact our Account Recovery Division.\n\n'
                + 'Further collection actions may be pursued if the outstanding balance is not addressed.\n\n'
                + 'Regards,\n\n'
                + 'Account Recovery Division\n'
                + 'First Snakesian Bank\n'
                + 'urgent@firstsnakesian.bank'
        });
    }

    // --- LOANS ---

    _onLoanMissed(data) {
        var loanTypeName = this._getLoanTypeName(data.loanType);
        var loanShortId = data.loanId ? data.loanId.slice(-6) : '------';
        var missesLeft = 3 - data.missedPayments;

        // Notification
        this._notify({
            title: 'Missed Loan Payment',
            body: loanTypeName + ' payment ($' + data.amount.toFixed(2) + ') missed. $' + data.lateFee.toFixed(2) + ' late fee. ' + missesLeft + ' miss' + (missesLeft !== 1 ? 'es' : '') + ' until default.',
            icon: 'mdi-bank-off',
            category: 'finance',
            urgency: 'warning',
            action: { type: 'launch', program: 'browser', url: 'snakesian-bank' }
        });

        // Email
        var isFirst = (data.missedPayments === 1);
        var subject = isFirst
            ? 'Past Due Notice — Your ' + loanTypeName + ' Account (' + loanShortId + ')'
            : 'URGENT: Second Past Due Notice — ' + loanTypeName + ' (' + loanShortId + ')';

        var body;
        if (isFirst) {
            body = 'Dear Valued Customer,\n\n'
                + 'We noticed that your monthly payment of $' + data.amount.toFixed(2) + ' for your ' + loanTypeName + ' (Account ending ' + loanShortId + ') did not go through this billing cycle.\n\n'
                + 'A late fee of $' + data.lateFee.toFixed(2) + ' has been applied to your account.\n\n'
                + 'Please ensure that sufficient funds are available in your checking account to cover next month\'s payment. If you are experiencing temporary financial difficulty, please contact our Loan Servicing Department to discuss your options.\n\n'
                + 'Sincerely,\n\n'
                + 'Loan Servicing Department\n'
                + 'First Snakesian Bank\n'
                + 'loans@firstsnakesian.bank';
        } else {
            body = 'Dear Valued Customer,\n\n'
                + 'This is a SECOND NOTICE regarding your past due ' + loanTypeName + ' (Account ending ' + loanShortId + ').\n\n'
                + 'Your monthly payment of $' + data.amount.toFixed(2) + ' has now been missed for ' + data.missedPayments + ' consecutive months. An additional late fee of $' + data.lateFee.toFixed(2) + ' has been applied.\n\n'
                + 'Failure to bring your account current by the next billing cycle will result in DEFAULT and potential loss of any collateral securing this loan.\n\n'
                + 'This is a serious matter that will significantly impact your credit standing.\n\n'
                + 'We strongly urge you to contact us immediately.\n\n'
                + 'Regards,\n\n'
                + 'Loan Servicing Department\n'
                + 'First Snakesian Bank\n'
                + 'loans@firstsnakesian.bank';
        }

        this._sendEmail({
            from: 'loans@firstsnakesian.bank',
            fromName: 'First Snakesian Bank',
            subject: subject,
            body: body
        });
    }

    _onLoanDefaulted(data) {
        var loanTypeName = this._getLoanTypeName(data.type);
        var loanShortId = data.loanId ? data.loanId.slice(-6) : '------';
        var hasLinkedAsset = data.linkedAsset && data.linkedAsset.name;

        // Notification
        var notifBody = loanTypeName + ' defaulted after 3 missed payments.';
        if (hasLinkedAsset) {
            notifBody += ' Collateral: ' + data.linkedAsset.name + '.';
        }
        notifBody += ' Balance: $' + data.remainingBalance.toFixed(2) + '.';

        this._notify({
            title: 'Loan Defaulted',
            body: notifBody,
            icon: 'mdi-bank-remove',
            category: 'finance',
            urgency: 'critical',
            action: { type: 'launch', program: 'browser', url: 'snakesian-bank' }
        });

        // Email
        var assetSection = '';
        if (hasLinkedAsset) {
            if (data.type === 'mortgage') {
                assetSection = '\nPursuant to the terms of your loan agreement, the collateral securing this obligation — ' + data.linkedAsset.name + ' — is subject to foreclosure proceedings. The property will be transferred to satisfy the outstanding obligation.\n';
            } else if (data.type === 'auto') {
                assetSection = '\nPursuant to the terms of your loan agreement, the vehicle securing this obligation — ' + data.linkedAsset.name + ' — is subject to repossession. Please arrange for its return to our designated facility.\n';
            } else {
                assetSection = '\nThe collateral securing this obligation — ' + data.linkedAsset.name + ' — may be subject to seizure to satisfy the outstanding balance.\n';
            }
        }

        this._sendEmail({
            from: 'legal@firstsnakesian.bank',
            fromName: 'First Snakesian Bank — Legal',
            subject: 'NOTICE OF DEFAULT — ' + loanTypeName + ' Account (' + loanShortId + ')',
            body: 'Dear Valued Customer,\n\n'
                + 'This letter serves as formal notice that your ' + loanTypeName + ' (Account ending ' + loanShortId + ') has been declared IN DEFAULT due to 3 consecutive missed payments.\n\n'
                + 'ACCOUNT DETAILS:\n'
                + '  Loan Type: ' + loanTypeName + '\n'
                + '  Account: ' + loanShortId + '\n'
                + '  Outstanding Balance: $' + data.remainingBalance.toFixed(2) + '\n'
                + '  Status: DEFAULTED\n'
                + assetSection + '\n'
                + 'This default will be reported to credit agencies and will have a severe impact on your credit score.\n\n'
                + 'To discuss settlement options, contact our Legal & Collections division immediately.\n\n'
                + 'Regards,\n\n'
                + 'Legal & Collections\n'
                + 'First Snakesian Bank\n'
                + 'legal@firstsnakesian.bank'
        });
    }

    _onLoanPaidOff(data) {
        var loanTypeName = this._getLoanTypeName(data.type);

        // Notification
        this._notify({
            title: 'Loan Paid Off',
            body: loanTypeName + ' fully repaid! Total paid: $' + data.totalPaid.toFixed(2) + '.',
            icon: 'mdi-party-popper',
            category: 'finance',
            urgency: 'info',
            toast: true
        });

        // Email
        this._sendEmail({
            from: 'congratulations@firstsnakesian.bank',
            fromName: 'First Snakesian Bank',
            subject: 'Congratulations! Your ' + loanTypeName + ' Has Been Paid in Full!',
            body: 'Dear Valued Customer,\n\n'
                + 'On behalf of everyone at First Snakesian Bank, CONGRATULATIONS on paying off your ' + loanTypeName + '!\n\n'
                + 'This is a significant financial milestone. Your total payments over the life of the loan came to $' + data.totalPaid.toFixed(2) + '.\n\n'
                + 'Paying off a loan demonstrates strong financial responsibility and will be reflected positively in your credit history. You should see an improvement to your credit score in the coming weeks.\n\n'
                + 'Now that you\'ve freed up your monthly payment, have you considered:\n'
                + '  - Building your savings with a high-yield savings account?\n'
                + '  - Exploring our investment products?\n'
                + '  - Putting extra toward other debts?\n\n'
                + 'Whatever your next financial goal, First Snakesian Bank is here to help.\n\n'
                + 'Warmest regards,\n\n'
                + 'Your Friends at First Snakesian Bank\n'
                + 'congratulations@firstsnakesian.bank'
        });
    }

    // --- PROPERTY TAXES ---

    _onPropertyTaxMissed(data) {
        var missesLeft = 3 - data.missedCount;

        // Notification
        this._notify({
            title: 'Tax Delinquent',
            body: 'Property tax missed for ' + data.propertyName + '. (' + data.missedCount + '/3 before forced sale.)',
            icon: 'mdi-home-alert',
            category: 'finance',
            urgency: data.missedCount >= 2 ? 'critical' : 'warning'
        });

        // Email
        var subject, body, fromAddr;

        if (data.missedCount === 1) {
            fromAddr = 'collections@srs.snakesia.gov';
            subject = 'Tax Payment Reminder — ' + data.propertyName;
            body = 'Dear Property Owner,\n\n'
                + 'Our records indicate that the property tax payment of $' + data.amount.toFixed(2) + ' for "' + data.propertyName + '" was not received for this billing period.\n\n'
                + 'PROPERTY DETAILS:\n'
                + '  Property: ' + data.propertyName + '\n'
                + '  Property ID: ' + data.propertyId + '\n'
                + '  Monthly Tax Due: $' + data.amount.toFixed(2) + '\n\n'
                + 'Please remit payment at your earliest convenience to avoid additional penalties. Continued failure to pay property taxes may result in the initiation of tax lien proceedings.\n\n'
                + 'If you believe this notice was sent in error, please contact our office.\n\n'
                + 'Sincerely,\n\n'
                + 'Snakesian Revenue Service\n'
                + 'Property Tax Division\n'
                + 'Government of Snakesia\n'
                + 'collections@srs.snakesia.gov';
        } else {
            fromAddr = 'enforcement@srs.snakesia.gov';
            subject = 'URGENT: Second Notice of Tax Delinquency — ' + data.propertyName;
            body = 'Dear Property Owner,\n\n'
                + 'This is the SECOND NOTICE regarding unpaid property taxes on "' + data.propertyName + '". Your account is now delinquent for ' + data.missedCount + ' consecutive months.\n\n'
                + 'PROPERTY DETAILS:\n'
                + '  Property: ' + data.propertyName + '\n'
                + '  Property ID: ' + data.propertyId + '\n'
                + '  Monthly Tax Due: $' + data.amount.toFixed(2) + '\n'
                + '  Months Delinquent: ' + data.missedCount + '\n\n'
                + 'WHAT HAPPENS NEXT:\n'
                + 'Failure to remit payment within the next billing cycle will result in the initiation of tax lien proceedings and FORCED SALE of the property. Under Snakesian Tax Code Section 42.7, properties with 3 or more consecutive months of unpaid taxes are subject to immediate seizure and public auction.\n\n'
                + 'This is not a matter to be taken lightly. Act now to avoid losing your property.\n\n'
                + 'Regards,\n\n'
                + 'Office of the Tax Collector\n'
                + 'Snakesian Revenue Service\n'
                + 'Government of Snakesia\n'
                + 'enforcement@srs.snakesia.gov';
        }

        this._sendEmail({
            from: fromAddr,
            fromName: 'Snakesian Revenue Service',
            subject: subject,
            body: body
        });
    }

    _onTaxForeclosure(data) {
        var prop = data.property || {};
        var propName = prop.name || 'Unknown Property';
        var propId = data.propertyId || prop.id || 'N/A';
        var value = prop.currentValue || 0;
        var wasPrimary = prop.isPrimaryResidence || false;

        // Notification
        this._notify({
            title: 'Tax Foreclosure',
            body: propName + ' seized and sold due to 3 missed tax payments.',
            icon: 'mdi-home-remove',
            category: 'finance',
            urgency: 'critical'
        });

        // Email
        var residenceNote = wasPrimary
            ? '\n\nAs this was your registered primary residence, you are advised to make alternative living arrangements immediately.\n'
            : '';

        this._sendEmail({
            from: 'enforcement@srs.snakesia.gov',
            fromName: 'Snakesian Revenue Service',
            subject: 'NOTICE OF TAX LIEN AND FORCED SALE — ' + propName,
            body: 'Dear Former Property Owner,\n\n'
                + 'Pursuant to Snakesian Tax Code Section 42.7, the property known as "' + propName + '", Tax ID ' + propId + ', has been SEIZED by the Snakesian Revenue Service due to persistent failure to remit required property tax payments.\n\n'
                + 'SEIZURE DETAILS:\n'
                + '  Property: ' + propName + '\n'
                + '  Tax ID: ' + propId + '\n'
                + '  Assessed Value: $' + value.toFixed(2) + '\n'
                + '  Reason: 3 consecutive months of unpaid property taxes\n'
                + '  Status: SEIZED — Scheduled for public auction\n\n'
                + 'You are hereby notified that your ownership interest in the above-described property has been terminated effective immediately. The property will be sold at public auction to satisfy the outstanding tax obligation.'
                + residenceNote + '\n\n'
                + 'By order of the Office of the Tax Collector,\n\n'
                + 'Snakesian Revenue Service\n'
                + 'Government of Snakesia\n'
                + 'enforcement@srs.snakesia.gov'
        });
    }

    // --- RENT / EVICTION ---

    _onRecurringMissed(data) {
        // Check if this is a rent payment by looking up the recurring payment
        var payment = this._lookupRecurringPayment(data.paymentId);
        if (!payment || payment.type !== 'rent') return; // Not rent — skip for now

        // Find the linked rental property
        var property = this._findRentalByPaymentId(data.paymentId);
        var propName = property ? property.name : data.description;
        var missedCount = payment.missedPayments || 1;

        // Cache property info for eviction email
        if (property) {
            this._rentalCache[data.paymentId] = {
                name: property.name,
                neighborhood: property.neighborhood || '',
                id: property.id,
                amount: data.amount
            };
        }

        var missesLeft = 3 - missedCount;

        // Notification
        this._notify({
            title: 'Missed Rent',
            body: 'Rent payment for ' + propName + ' missed. (' + missedCount + '/3 before eviction.)',
            icon: 'mdi-home-alert',
            category: 'finance',
            urgency: missedCount >= 2 ? 'critical' : 'warning'
        });

        // Email
        var subject, body;

        if (missedCount === 1) {
            subject = 'Rent Payment Reminder — ' + propName;
            body = 'Hi there!\n\n'
                + 'We noticed that rent for your unit at ' + propName + ' ($' + data.amount.toFixed(2) + '/month) hasn\'t come through this month.\n\n'
                + 'Sometimes these things slip through the cracks! Please make sure your payment is squared away to avoid any issues with your lease.\n\n'
                + 'We value you as a tenant and want to keep things smooth.\n\n'
                + 'Thanks!\n\n'
                + 'Snakesia Property Management\n'
                + '"Making Snakesia Feel Like Home"\n'
                + 'leasing@snakesia-properties.ex';
        } else {
            subject = 'Second Notice: Past Due Rent — ' + propName;
            body = 'Dear Tenant,\n\n'
                + 'This is a formal notice that your rent at ' + propName + ' is now ' + missedCount + ' months past due.\n\n'
                + 'ACCOUNT DETAILS:\n'
                + '  Property: ' + propName + '\n'
                + '  Monthly Rent: $' + data.amount.toFixed(2) + '\n'
                + '  Months Past Due: ' + missedCount + '\n\n'
                + 'Per the terms of your lease agreement, continued failure to pay rent constitutes a material breach of your tenancy. If payment is not received by the next billing cycle, we will be forced to begin eviction proceedings.\n\n'
                + 'Please contact our office immediately to discuss payment arrangements.\n\n'
                + 'Regards,\n\n'
                + 'Snakesia Property Management\n'
                + 'Tenant Relations Department\n'
                + 'leasing@snakesia-properties.ex';
        }

        this._sendEmail({
            from: 'leasing@snakesia-properties.ex',
            fromName: 'Snakesia Property Management',
            subject: subject,
            body: body
        });
    }

    _onEviction(data) {
        // Property is already removed from inventory by the time this fires.
        // Use cached data if available.
        var cached = null;
        var propName = 'your rental property';

        // Try to find cached info by scanning the cache
        for (var key in this._rentalCache) {
            if (this._rentalCache[key].id === data.propertyId) {
                cached = this._rentalCache[key];
                propName = cached.name;
                delete this._rentalCache[key];
                break;
            }
        }

        // Notification
        this._notify({
            title: 'Evicted',
            body: 'You have been evicted from ' + propName + ' after 3 missed rent payments.',
            icon: 'mdi-home-remove',
            category: 'finance',
            urgency: 'critical'
        });

        // Email
        this._sendEmail({
            from: 'legal@snakesia-properties.ex',
            fromName: 'Snakesia Property Management — Legal',
            subject: 'NOTICE OF EVICTION — ' + propName,
            body: 'Dear Former Tenant,\n\n'
                + 'This letter serves as official notice that your tenancy at ' + propName + ' has been TERMINATED effective immediately due to non-payment of rent.\n\n'
                + 'You are required to vacate the premises within 24 hours.\n\n'
                + 'Your security deposit, if applicable, will be applied toward the outstanding balance of unpaid rent. Any personal property remaining on the premises after the vacating period will be disposed of in accordance with Snakesian tenant law.\n\n'
                + 'This eviction will be reported and may affect your ability to secure housing in the future.\n\n'
                + 'Regards,\n\n'
                + 'Snakesia Property Management\n'
                + 'Legal Department\n'
                + 'legal@snakesia-properties.ex'
        });
    }

    // --- VEHICLE INSURANCE ---

    _onVehicleInsuranceMissed(data) {
        var missesLeft = 3 - data.missedCount;

        // Notification
        this._notify({
            title: 'Insurance Lapsed',
            body: 'Vehicle insurance missed for ' + data.vehicleName + '. (' + data.missedCount + '/3 before impoundment.)',
            icon: 'mdi-car-off',
            category: 'finance',
            urgency: data.missedCount >= 2 ? 'critical' : 'warning'
        });

        // Email
        var subject, body, fromAddr;

        if (data.missedCount === 1) {
            fromAddr = 'notices@snakesian-auto-insurance.ex';
            subject = 'Insurance Payment Reminder — ' + data.vehicleName;
            body = 'Dear Policyholder,\n\n'
                + 'Our records indicate that your vehicle insurance payment of $' + data.amount.toFixed(2) + ' for your ' + data.vehicleName + ' was not received this billing period.\n\n'
                + 'POLICY DETAILS:\n'
                + '  Vehicle: ' + data.vehicleName + '\n'
                + '  Monthly Premium: $' + data.amount.toFixed(2) + '\n\n'
                + 'Please ensure your checking account has sufficient funds to cover next month\'s premium. Driving without valid insurance is a violation of Snakesian Motor Vehicle Code Section 17.3.\n\n'
                + 'If payment is not received, your policy will remain lapsed and your vehicle may be subject to impoundment.\n\n'
                + 'Sincerely,\n\n'
                + 'Snakesian Auto Insurance Authority\n'
                + 'notices@snakesian-auto-insurance.ex';
        } else {
            fromAddr = 'enforcement@snakesian-auto-insurance.ex';
            subject = 'URGENT: Second Notice — Insurance Lapsed on ' + data.vehicleName;
            body = 'Dear Policyholder,\n\n'
                + 'This is a SECOND NOTICE regarding your lapsed vehicle insurance for your ' + data.vehicleName + '.\n\n'
                + 'POLICY DETAILS:\n'
                + '  Vehicle: ' + data.vehicleName + '\n'
                + '  Monthly Premium: $' + data.amount.toFixed(2) + '\n'
                + '  Months Lapsed: ' + data.missedCount + '\n\n'
                + 'WHAT HAPPENS NEXT:\n'
                + 'Failure to remit payment within the next billing cycle will result in VEHICLE IMPOUNDMENT. Under Snakesian Motor Vehicle Code Section 17.3, vehicles with 3 or more consecutive months of lapsed insurance are subject to immediate seizure.\n\n'
                + 'Your vehicle will be towed and held at the Snakesian Impound Lot. Recovery fees will apply.\n\n'
                + 'Act now to avoid losing your vehicle.\n\n'
                + 'Regards,\n\n'
                + 'Enforcement Division\n'
                + 'Snakesian Auto Insurance Authority\n'
                + 'enforcement@snakesian-auto-insurance.ex';
        }

        this._sendEmail({
            from: fromAddr,
            fromName: 'Snakesian Auto Insurance Authority',
            subject: subject,
            body: body
        });
    }

    _onVehicleImpounded(data) {
        var vehicle = data.vehicle || {};
        var vehicleName = vehicle.name || 'Unknown Vehicle';

        // Notification
        this._notify({
            title: 'Vehicle Impounded',
            body: vehicleName + ' seized after 3 missed insurance payments.',
            icon: 'mdi-car-off',
            category: 'finance',
            urgency: 'critical'
        });

        // Email
        this._sendEmail({
            from: 'enforcement@snakesian-auto-insurance.ex',
            fromName: 'Snakesian Auto Insurance Authority',
            subject: 'NOTICE OF IMPOUNDMENT — ' + vehicleName,
            body: 'Dear Former Vehicle Owner,\n\n'
                + 'Pursuant to Snakesian Motor Vehicle Code Section 17.3, your vehicle "' + vehicleName + '" has been IMPOUNDED by the Snakesian Auto Insurance Authority due to persistent failure to maintain valid insurance coverage.\n\n'
                + 'IMPOUNDMENT DETAILS:\n'
                + '  Vehicle: ' + vehicleName + '\n'
                + '  Reason: 3 consecutive months of lapsed insurance\n'
                + '  Status: IMPOUNDED — Vehicle seized\n\n'
                + 'Your ownership interest in the above-described vehicle has been terminated effective immediately. The vehicle has been towed to the Snakesian Impound Lot.\n\n'
                + 'This impoundment will be reflected in your driving record and may impact your ability to insure future vehicles.\n\n'
                + 'By order of the Insurance Enforcement Division,\n\n'
                + 'Snakesian Auto Insurance Authority\n'
                + 'Government of Snakesia\n'
                + 'enforcement@snakesian-auto-insurance.ex'
        });
    }

    // --- POSITIVE / INFO EVENTS ---

    _onSavingsInterest(data) {
        // Notification only — no email
        this._notify({
            title: 'Interest Earned',
            body: '$' + data.interest.toFixed(2) + ' savings interest deposited. Balance: $' + data.newBalance.toFixed(2) + '.',
            icon: 'mdi-piggy-bank',
            category: 'finance',
            urgency: 'info',
            toast: false
        });
    }

    _onCreditScoreChanged(data) {
        // Notification only — no email
        if (data.delta > 0) {
            this._notify({
                title: 'Credit Score Up',
                body: 'Score increased to ' + data.newScore + ' (' + data.rating + '). +' + data.delta + ' points.',
                icon: 'mdi-trending-up',
                category: 'finance',
                urgency: 'info',
                toast: false
            });
        } else if (data.delta < 0) {
            this._notify({
                title: 'Credit Score Down',
                body: 'Score decreased to ' + data.newScore + ' (' + data.rating + '). ' + data.delta + ' points.',
                icon: 'mdi-trending-down',
                category: 'finance',
                urgency: 'info',
                toast: false
            });
        }
    }

    _onMonthlyCycleCompleted(data) {
        // Notification only — no email
        var eventCount = (data.events && data.events.length) || 0;
        this._notify({
            title: 'Monthly Summary',
            body: data.date + ' processed. ' + eventCount + ' financial event' + (eventCount !== 1 ? 's' : '') + '.',
            icon: 'mdi-calendar-check',
            category: 'finance',
            urgency: 'info',
            toast: false
        });
    }

    // --- EMPLOYMENT ---

    _onPaychecksProcessed(data) {
        var count = data.count || 0;
        var total = data.totalAmount || 0;
        var perPay = data.payPerPeriod || 0;
        var employer = data.employer || 'Employer';

        // Notification
        if (count === 1) {
            this._notify({
                title: 'Paycheck Deposited',
                body: employer + ' payroll: $' + perPay.toFixed(2) + ' deposited to checking.',
                icon: 'mdi-cash-check',
                category: 'finance',
                urgency: 'info',
                toast: true
            });
        } else {
            this._notify({
                title: 'Paychecks Deposited',
                body: count + ' paychecks from ' + employer + ' totaling $' + total.toFixed(2) + ' deposited to checking.',
                icon: 'mdi-cash-check',
                category: 'finance',
                urgency: 'info',
                toast: true
            });
        }

        // Email — pay stub
        var empData = (typeof elxaOS !== 'undefined' && elxaOS.employmentService)
            ? elxaOS.employmentService.getEmploymentData()
            : null;

        var empName = empData ? (empData.employeeId || 'Employee') : 'Employee';
        var position = empData ? (empData.position || 'Team Member') : 'Team Member';
        var ytd = empData ? (elxaOS.employmentService.getYTDEarnings() || 0) : 0;
        var nextPay = empData ? (elxaOS.employmentService.getNextPayday() || 'TBD') : 'TBD';

        var body;
        if (count === 1) {
            body = 'Dear ' + empName + ',\n\n'
                + 'Your paycheck has been processed and deposited.\n\n'
                + 'PAY STUB\n'
                + '  Employee: ' + empName + '\n'
                + '  Position: ' + position + '\n'
                + '  Pay Period: Weekly\n'
                + '  Gross Pay: $' + perPay.toFixed(2) + '\n'
                + '  Deposited To: First Snakesian Bank \u2014 Checking\n\n'
                + '  YTD Earnings: $' + ytd.toFixed(2) + '\n'
                + '  Next Payday: ' + nextPay + '\n\n'
                + 'Thank you for your continued hard work!\n\n'
                + 'ElxaCorp Payroll Department\n'
                + 'payroll@elxacorp.ex';
        } else {
            body = 'Dear ' + empName + ',\n\n'
                + 'Multiple paychecks have been processed and deposited.\n\n'
                + 'PAYROLL SUMMARY\n'
                + '  Employee: ' + empName + '\n'
                + '  Position: ' + position + '\n'
                + '  Paychecks Processed: ' + count + '\n'
                + '  Amount Per Paycheck: $' + perPay.toFixed(2) + '\n'
                + '  Total Deposited: $' + total.toFixed(2) + '\n'
                + '  Deposited To: First Snakesian Bank \u2014 Checking\n\n'
                + '  YTD Earnings: $' + ytd.toFixed(2) + '\n'
                + '  Next Payday: ' + nextPay + '\n\n'
                + 'Thank you for your continued hard work!\n\n'
                + 'ElxaCorp Payroll Department\n'
                + 'payroll@elxacorp.ex';
        }

        this._sendEmail({
            from: 'payroll@elxacorp.ex',
            fromName: 'ElxaCorp Payroll',
            subject: count === 1
                ? 'Your Pay Stub \u2014 ElxaCorp Payroll'
                : 'Payroll Summary \u2014 ' + count + ' Paychecks Processed',
            body: body
        });
    }

    _onHired(data) {
        var position = data.position || 'Team Member';
        var employer = data.employer || 'ElxaCorp';
        var salaryDisplay = data.salaryDisplay || ('$' + (data.salary || 0).toLocaleString() + ' per year');

        this._notify({
            title: 'Employed!',
            body: 'You\u2019ve been hired at ' + employer + ' as ' + position + '! Salary: ' + salaryDisplay + '.',
            icon: 'mdi-briefcase-check',
            category: 'finance',
            urgency: 'info',
            toast: true
        });
        // No additional email — ElxaCorp already sends hiring emails
    }

    // --- STOCKS ---

    _onDividendPaid(data) {
        var total = data.total || 0;
        var breakdown = data.breakdown || [];

        // Notification
        this._notify({
            title: 'Dividends Received',
            body: '$' + total.toFixed(2) + ' in dividends deposited from ' + breakdown.length + ' stock' + (breakdown.length !== 1 ? 's' : '') + '.',
            icon: 'mdi-cash-plus',
            category: 'finance',
            urgency: 'info',
            toast: false
        });

        // Email from ScaleStreet Brokerage
        var lines = '';
        for (var i = 0; i < breakdown.length; i++) {
            var b = breakdown[i];
            lines += '  ' + b.ticker + ' (' + b.companyName + '): '
                + b.shares + ' shares × ' + (b.rate * 100).toFixed(1) + '% = $' + b.payout.toFixed(2) + '\n';
        }

        this._sendEmail({
            from: 'dividends@scalestreet.ex',
            fromName: 'ScaleStreet Brokerage',
            subject: 'Dividend Payment Confirmation — $' + total.toFixed(2) + ' Deposited',
            body: 'Dear Investor,\n\n'
                + 'Your monthly dividend payments have been processed and deposited to your checking account at First Snakesian Bank.\n\n'
                + 'DIVIDEND SUMMARY\n'
                + lines + '\n'
                + '  TOTAL: $' + total.toFixed(2) + '\n\n'
                + 'Dividends are calculated based on the current share price and your holdings as of the distribution date. Rates are subject to change based on company performance.\n\n'
                + 'Keep building your portfolio — dividend income compounds over time!\n\n'
                + 'Happy investing,\n\n'
                + 'ScaleStreet Brokerage\n'
                + 'Snake Valley Stock Exchange\n'
                + 'dividends@scalestreet.ex'
        });
    }

    _onBigMove(data) {
        var dir = data.direction === 'up' ? 'surged' : 'plunged';
        var icon = data.direction === 'up' ? 'mdi-trending-up' : 'mdi-trending-down';
        var urgency = data.direction === 'down' ? 'warning' : 'info';
        var sign = data.changePct > 0 ? '+' : '';

        // Notification (with toast for big moves)
        this._notify({
            title: data.ticker + ' ' + dir.charAt(0).toUpperCase() + dir.slice(1) + '!',
            body: data.companyName + ' ' + sign + data.changePct.toFixed(1) + '% this month. Your ' + data.shares + ' shares now worth $' + data.currentValue.toFixed(2) + '.',
            icon: icon,
            category: 'finance',
            urgency: urgency,
            toast: true
        });

        // Email
        var valueSign = data.valueChange >= 0 ? '+$' : '-$';
        var sentiment = data.direction === 'up'
            ? 'This is a significant positive move. Consider reviewing your position to lock in gains or let it ride.'
            : 'This is a significant decline. Consider reviewing your position — this may be a buying opportunity or a signal to limit losses.';

        this._sendEmail({
            from: 'alerts@scalestreet.ex',
            fromName: 'ScaleStreet Brokerage — Alerts',
            subject: 'MARKET ALERT: ' + data.ticker + ' ' + sign + data.changePct.toFixed(1) + '%',
            body: 'Dear Investor,\n\n'
                + 'One of your holdings has experienced a significant price movement this month.\n\n'
                + 'ALERT DETAILS\n'
                + '  Stock: ' + data.ticker + ' (' + data.companyName + ')\n'
                + '  Previous Price: $' + data.prevPrice.toFixed(2) + '\n'
                + '  Current Price: $' + data.currentPrice.toFixed(2) + '\n'
                + '  Change: ' + sign + data.changePct.toFixed(1) + '%\n\n'
                + 'YOUR POSITION\n'
                + '  Shares: ' + data.shares + '\n'
                + '  Current Value: $' + data.currentValue.toFixed(2) + '\n'
                + '  Value Change: ' + valueSign + Math.abs(data.valueChange).toFixed(2) + '\n\n'
                + sentiment + '\n\n'
                + 'Visit the Snake Valley Stock Exchange at scalestreet.ex to manage your portfolio.\n\n'
                + 'ScaleStreet Brokerage\n'
                + 'alerts@scalestreet.ex'
        });
    }

    // --- GROCERY ORDER ---

    _onGroceryOrderComplete(data) {
        var itemCount = data.itemCount || 0;
        var total = data.total || 0;

        // Notification (toast)
        this._notify({
            title: 'Squiggly Wiggly Order Placed',
            body: itemCount + ' item' + (itemCount !== 1 ? 's' : '') + ' ordered — $' + total.toFixed(2) + ' total.',
            icon: 'mdi-cart-check',
            category: 'shopping',
            urgency: 'info',
            toast: false  // delivery ceremony is already showing
        });

        // Build receipt lines
        var receiptLines = '';
        if (data.items && data.items.length > 0) {
            for (var i = 0; i < data.items.length; i++) {
                var item = data.items[i];
                var lineTotal = (item.unitPrice * item.quantity).toFixed(2);
                receiptLines += '  ' + item.quantity + 'x ' + item.name + '  $' + lineTotal + '\n';
            }
        }

        // Order confirmation email
        this._sendEmail({
            from: 'orders@squigglywiggly.ex',
            fromName: 'Squiggly Wiggly Online',
            subject: 'Order Confirmation — ' + itemCount + ' item' + (itemCount !== 1 ? 's' : ''),
            body: 'Thank you for shopping at Squiggly Wiggly!\n\n'
                + 'Your order has been delivered. Here is your receipt:\n\n'
                + 'ORDER RECEIPT\n'
                + receiptLines
                + '  ————————————————————\n'
                + '  Total: $' + total.toFixed(2) + '\n\n'
                + 'We hope you enjoy your groceries! Visit us again at squiggly.ex.\n\n'
                + 'Squiggly Wiggly — "Slithering Savings, Every Aisle!"\n'
                + 'Main Street, Sidewinder Springs\n'
                + 'orders@squigglywiggly.ex'
        });
    }

    // --- FASHION ORDER ---

    _onFashionOrderComplete(data) {
        var itemCount = data.itemCount || 0;
        var total = data.total || 0;

        // Notification (no toast — delivery ceremony already showing)
        this._notify({
            title: 'Scales & Tails Order Placed',
            body: itemCount + ' item' + (itemCount !== 1 ? 's' : '') + ' ordered — $' + total.toFixed(2) + ' total.',
            icon: 'mdi-hanger',
            category: 'shopping',
            urgency: 'info',
            toast: false
        });

        // Build receipt lines
        var receiptLines = '';
        if (data.items && data.items.length > 0) {
            for (var i = 0; i < data.items.length; i++) {
                var item = data.items[i];
                var lineTotal = (item.price * item.qty).toFixed(2);
                var label = item.name + ' (' + item.color + ')';
                if (item.qty > 1) label += ' x' + item.qty;
                receiptLines += '  ' + label + '  $' + lineTotal + '\n';
            }
        }

        // Order confirmation email
        this._sendEmail({
            from: 'orders@fashionco.ex',
            fromName: 'Scales & Tails Fashion Co.',
            subject: 'Order Confirmation — ' + itemCount + ' item' + (itemCount !== 1 ? 's' : ''),
            body: 'Thank you for shopping at Scales & Tails Fashion Co.!\n\n'
                + 'Your order has been delivered. Here is your receipt:\n\n'
                + 'ORDER RECEIPT\n'
                + receiptLines
                + '  ————————————————————\n'
                + '  Total: $' + total.toFixed(2) + '\n\n'
                + 'Wear it well! Visit us again at fashionco.ex.\n\n'
                + 'Scales & Tails Fashion Co.\n'
                + '"Bold Prints. Bolder You."\n'
                + 'orders@fashionco.ex'
        });
    }

    // =================================
    // NOTIFICATION HELPER
    // =================================

    /**
     * Shorthand for adding a notification via the notification service.
     */
    _notify(options) {
        if (typeof elxaOS !== 'undefined' && elxaOS.notificationService) {
            elxaOS.notificationService.addNotification(options);
        } else {
            console.warn('📨 NotificationService not available — skipping notification:', options.title);
        }
    }

    // =================================
    // EMAIL SENDING (ElxaCorp pattern)
    // =================================

    /**
     * Send an email via ElxaMail.
     * Tries: live injection → localStorage → queue.
     * @param {object} opts — { from, fromName, subject, body }
     */
    _sendEmail(opts) {
        var emailData = {
            from: opts.from,
            fromName: opts.fromName || opts.from,
            to: this._getUserEmail(),
            subject: opts.subject,
            body: opts.body,
            date: new Date().toISOString(),
            read: false,
            isFinanceEmail: true
        };

        // Path A: ElxaMail is running and logged in — inject into live system
        if (typeof elxaMailSystem !== 'undefined' && elxaMailSystem.isLoggedIn) {
            elxaMailSystem.emails.inbox.unshift(emailData);
            elxaMailSystem.saveCurrentUser();
            if (elxaMailSystem.currentFolder === 'inbox') {
                elxaMailSystem.updateEmailList();
            }
            console.log('📨 Finance email sent (live):', opts.subject);
            return;
        }

        // Path B: Direct localStorage injection
        if (this._injectEmailToStorage(emailData)) {
            console.log('📨 Finance email injected (storage):', opts.subject);
            return;
        }

        // Path C: Queue for later delivery
        this._queueEmail(emailData);
        console.log('📨 Finance email queued:', opts.subject);
    }

    /**
     * Inject email directly into ElxaMail localStorage data.
     */
    _injectEmailToStorage(emailData) {
        try {
            var toEmail = emailData.to || '';
            var username = toEmail.includes('@') ? toEmail.split('@')[0] : toEmail;
            if (!username) return false;

            var raw = localStorage.getItem('elxaOS-mail-user-' + username);
            if (!raw) return false;

            var userData = JSON.parse(raw);
            if (!userData.folders) userData.folders = { inbox: [], sent: [], drafts: [], trash: [] };
            if (!userData.folders.inbox) userData.folders.inbox = [];

            userData.folders.inbox.unshift(emailData);
            localStorage.setItem('elxaOS-mail-user-' + username, JSON.stringify(userData));
            return true;
        } catch (error) {
            console.error('📨 Failed to inject finance email to storage:', error);
            return false;
        }
    }

    /**
     * Queue an email for delivery when ElxaMail is opened.
     */
    _queueEmail(emailData) {
        try {
            var queued = JSON.parse(localStorage.getItem('finance-queued-emails') || '[]');
            queued.push(emailData);
            localStorage.setItem('finance-queued-emails', JSON.stringify(queued));
        } catch (error) {
            console.error('📨 Failed to queue finance email:', error);
        }
    }

    /**
     * Detect the current user's email address.
     */
    _getUserEmail() {
        // Try ElxaMail live
        if (typeof elxaMailSystem !== 'undefined' && elxaMailSystem.isLoggedIn && elxaMailSystem.currentUser) {
            return elxaMailSystem.currentUser.email || 'user@elxamail.ex';
        }
        // Fallback
        return 'user@elxamail.ex';
    }

    /**
     * Process any finance emails that were queued while ElxaMail wasn't running.
     * Called on init, and can be called from ElxaMail on login.
     */
    _processQueuedEmails() {
        if (typeof elxaMailSystem === 'undefined' || !elxaMailSystem.isLoggedIn) return;

        try {
            var queued = JSON.parse(localStorage.getItem('finance-queued-emails') || '[]');
            if (queued.length === 0) return;

            console.log('📨 Processing ' + queued.length + ' queued finance email(s)');

            for (var i = 0; i < queued.length; i++) {
                elxaMailSystem.emails.inbox.unshift(queued[i]);
            }

            elxaMailSystem.saveCurrentUser();
            if (elxaMailSystem.currentFolder === 'inbox') {
                elxaMailSystem.updateEmailList();
            }

            localStorage.removeItem('finance-queued-emails');
        } catch (error) {
            console.error('📨 Failed to process queued finance emails:', error);
        }
    }

    // =================================
    // LOOKUP HELPERS
    // =================================

    // =================================
    // CHARITY SPONSORSHIP EMAILS
    // =================================

    /**
     * When a recurring payment succeeds, check if it's a charity sponsorship
     * and send a monthly update email with a rotating message.
     */
    _onRecurringPaymentProcessed(data) {
        // Look up the recurring payment to check its linkedId
        var payment = this._lookupRecurringPayment(data.paymentId);
        if (!payment || !payment.linkedId) return;

        // Museum Membership
        if (payment.linkedId === 'museum-donation') {
            this._handleMuseumPayment(data);
            return;
        }

        // Aquarium Membership
        if (payment.linkedId === 'aquarium-donation') {
            this._handleAquariumPayment(data);
            return;
        }

        // SCI Membership
        if (payment.linkedId === 'sci-donation') {
            this._handleSCIPayment(data);
            return;
        }

        // SWF Sponsorship
        if (!payment.linkedId.startsWith('swf-')) return;

        // Extract animal ID from linkedId (e.g. 'swf-otter' -> 'otter')
        var animalId = payment.linkedId.replace('swf-', '');

        // Need SWF_DATA to be loaded globally
        if (typeof SWF_DATA === 'undefined' || !SWF_DATA.animals || !SWF_DATA.animals[animalId]) return;

        var animal = SWF_DATA.animals[animalId];

        // Find the subscription in inventory to get/update message index
        var messageIndex = 0;
        var subItem = null;
        if (typeof elxaOS !== 'undefined' && elxaOS.inventoryService) {
            var subs = elxaOS.inventoryService.getItems('subscriptions') || [];
            for (var i = 0; i < subs.length; i++) {
                if (subs[i].provider === 'Snakesia Wildlife Fund' && subs[i].animalId === animalId && subs[i].status === 'active') {
                    subItem = subs[i];
                    messageIndex = subs[i].messageIndex || 0;
                    break;
                }
            }
        }

        // Pick the message (rotate through the pool)
        var messages = animal.monthlyMessages || [];
        if (messages.length === 0) return;

        var msgText = messages[messageIndex % messages.length];

        // Increment message index for next month
        if (subItem && typeof elxaOS !== 'undefined' && elxaOS.inventoryService) {
            elxaOS.inventoryService.updateItem('subscriptions', subItem.id, {
                messageIndex: (messageIndex + 1) % messages.length
            });
        }

        // Build the email
        var body = 'Dear Sponsor,\n\n'
            + msgText + '\n\n'
            + 'With love and gratitude,\n'
            + 'The Snakesia Wildlife Fund Team\n'
            + SWF_DATA.charityEmail;

        this._sendEmail({
            from: SWF_DATA.charityEmail,
            fromName: SWF_DATA.charityFromName,
            subject: animal.name + ' Monthly Update \uD83D\uDC3E',
            body: body
        });

        // Notification
        this._notify({
            title: 'Update from ' + animal.name + '!',
            body: 'Your monthly update from the Snakesia Wildlife Fund is in your inbox!',
            icon: 'mdi-paw',
            category: 'general',
            urgency: 'info'
        });
    }

    /**
     * Handle museum recurring payment — track payment count and send
     * annual event invitations for Curator and Benefactor tiers.
     */
    _handleMuseumPayment(data) {
        if (typeof elxaOS === 'undefined' || !elxaOS.inventoryService) return;

        var subs = elxaOS.inventoryService.getItems('subscriptions') || [];
        var museumSub = null;
        for (var i = 0; i < subs.length; i++) {
            if (subs[i].provider === 'Snake Valley National Museum' && subs[i].status === 'active') {
                museumSub = subs[i];
                break;
            }
        }
        if (!museumSub) return;

        // Increment payment count
        var count = (museumSub.paymentCount || 0) + 1;
        elxaOS.inventoryService.updateItem('subscriptions', museumSub.id, { paymentCount: count });

        // Annual event invitations (every 12 payments) for Curator (level 2) and Benefactor (level 3)
        if (count % 12 === 0 && museumSub.tierLevel >= 2) {
            var isBenefactor = (museumSub.tierLevel >= 3);
            var eventName = isBenefactor ? 'Annual Benefactor\'s Gala' : 'Annual Curator\'s Reception';

            var body;
            if (isBenefactor) {
                body = 'Dear Benefactor,\n\n'
                    + 'The Snake Valley National Museum is honored to invite you to the Annual Benefactor\'s Gala!\n\n'
                    + 'EVENT DETAILS:\n'
                    + '  Event: Annual Benefactor\'s Gala\n'
                    + '  Date: Last Saturday in June\n'
                    + '  Time: 7:00 PM\n'
                    + '  Venue: Grand Atrium, Snake Valley National Museum\n'
                    + '  Dress Code: Formal\n\n'
                    + 'As one of our most generous supporters, you are invited to an exclusive evening of fine dining, live music, and a private viewing of our newest acquisitions. Meet our curatorial team, mingle with fellow benefactors, and enjoy a night celebrating Snakesia\'s natural heritage.\n\n'
                    + 'You are also welcome at the Curator\'s Reception (first Friday in March).\n\n'
                    + 'We are deeply grateful for your continued support.\n\n'
                    + 'Warm regards,\n\n'
                    + 'Dr. Helena Cobrish\n'
                    + 'Director, Snake Valley National Museum\n'
                    + 'director@svnm.ex';
            } else {
                body = 'Dear Curator-Level Supporter,\n\n'
                    + 'The Snake Valley National Museum is pleased to invite you to the Annual Curator\'s Reception!\n\n'
                    + 'EVENT DETAILS:\n'
                    + '  Event: Annual Curator\'s Reception\n'
                    + '  Date: First Friday in March\n'
                    + '  Time: 6:00 PM\n'
                    + '  Venue: Geological Wonders Hall, Snake Valley National Museum\n'
                    + '  Dress Code: Smart Casual\n\n'
                    + 'Join us for an intimate evening with our curatorial team. Enjoy refreshments, a behind-the-scenes tour of our conservation lab, and be the first to preview our upcoming exhibition season.\n\n'
                    + 'Thank you for your generous support of the museum.\n\n'
                    + 'Warm regards,\n\n'
                    + 'Dr. Helena Cobrish\n'
                    + 'Director, Snake Valley National Museum\n'
                    + 'director@svnm.ex';
            }

            this._sendEmail({
                from: 'director@svnm.ex',
                fromName: 'Snake Valley National Museum',
                subject: 'You\'re Invited: ' + eventName,
                body: body
            });

            this._notify({
                title: 'Museum Invitation',
                body: 'You\'ve been invited to the ' + eventName + '! Check your email.',
                icon: 'mdi-ticket',
                category: 'general',
                urgency: 'info',
                toast: true
            });
        }
    }

    /**
     * Handle aquarium recurring payment — track payment count and send
     * annual event invitations for Guardian and Benefactor tiers.
     */
    _handleAquariumPayment(data) {
        if (typeof elxaOS === 'undefined' || !elxaOS.inventoryService) return;

        var subs = elxaOS.inventoryService.getItems('subscriptions') || [];
        var aquariumSub = null;
        for (var i = 0; i < subs.length; i++) {
            if (subs[i].provider === 'Snake Valley Aquarium' && subs[i].status === 'active') {
                aquariumSub = subs[i];
                break;
            }
        }
        if (!aquariumSub) return;

        // Increment payment count
        var count = (aquariumSub.paymentCount || 0) + 1;
        elxaOS.inventoryService.updateItem('subscriptions', aquariumSub.id, { paymentCount: count });

        // Annual event invitations (every 12 payments) for Guardian (level 2) and Benefactor (level 3)
        if (count % 12 === 0 && aquariumSub.tierLevel >= 2) {
            var isBenefactor = (aquariumSub.tierLevel >= 3);
            var eventName = isBenefactor ? 'Annual Benefactor\'s Gala Dinner' : 'Ocean Night Experience';

            var body;
            if (isBenefactor) {
                body = 'Dear Benefactor,\n\n'
                    + 'The Snake Valley Aquarium is honored to invite you to the Annual Benefactor\'s Gala Dinner!\n\n'
                    + 'EVENT DETAILS:\n'
                    + '  Event: Annual Benefactor\'s Gala Dinner\n'
                    + '  Date: Second Saturday in September\n'
                    + '  Time: 7:00 PM\n'
                    + '  Venue: Shark Encounter Hall, Snake Valley Aquarium\n'
                    + '  Dress Code: Formal\n\n'
                    + 'Join us for an unforgettable evening of fine dining beneath the sharks, live music, and a private guided tour of our newest marine habitats. Meet our marine biology team, connect with fellow benefactors, and celebrate Snakesia\'s ocean wonders.\n\n'
                    + 'You are also welcome at our exclusive Ocean Night (first Friday in May).\n\n'
                    + 'We are deeply grateful for your continued support.\n\n'
                    + 'Warm regards,\n\n'
                    + 'Dr. Marina Coralscale\n'
                    + 'Director, Snake Valley Aquarium\n'
                    + 'director@svaquarium.ex';
            } else {
                body = 'Dear Guardian-Level Supporter,\n\n'
                    + 'The Snake Valley Aquarium is pleased to invite you to our exclusive Ocean Night!\n\n'
                    + 'EVENT DETAILS:\n'
                    + '  Event: Ocean Night Experience\n'
                    + '  Date: First Friday in May\n'
                    + '  Time: 7:00 PM\n'
                    + '  Venue: Snake Valley Aquarium (after hours)\n'
                    + '  Dress Code: Smart Casual\n\n'
                    + 'Experience the aquarium like never before — after dark and all to yourselves. Enjoy the bioluminescent jellyfish gallery under moonlight, a behind-the-scenes feeding with our marine biologists, and refreshments by the penguin cove.\n\n'
                    + 'Thank you for your generous support of the aquarium.\n\n'
                    + 'Warm regards,\n\n'
                    + 'Dr. Marina Coralscale\n'
                    + 'Director, Snake Valley Aquarium\n'
                    + 'director@svaquarium.ex';
            }

            this._sendEmail({
                from: 'director@svaquarium.ex',
                fromName: 'Snake Valley Aquarium',
                subject: 'You\'re Invited: ' + eventName,
                body: body
            });

            this._notify({
                title: 'Aquarium Invitation',
                body: 'You\'ve been invited to the ' + eventName + '! Check your email.',
                icon: 'mdi-ticket',
                category: 'general',
                urgency: 'info',
                toast: true
            });
        }
    }

    /**
     * Handle SCI recurring payment — track payment count, send monthly
     * update email with rotating messages, and annual gala invitations.
     */
    _handleSCIPayment(data) {
        if (typeof elxaOS === 'undefined' || !elxaOS.inventoryService) return;
        if (typeof SCI_DATA === 'undefined') return;

        var subs = elxaOS.inventoryService.getItems('subscriptions') || [];
        var sciSub = null;
        for (var i = 0; i < subs.length; i++) {
            if (subs[i].provider === 'Serpentville Conservation Initiative' && subs[i].status === 'active') {
                sciSub = subs[i];
                break;
            }
        }
        if (!sciSub) return;

        // Increment payment count and get message index
        var count = (sciSub.paymentCount || 0) + 1;
        var messageIndex = sciSub.messageIndex || 0;
        var messages = SCI_DATA.monthlyMessages || [];

        if (messages.length > 0) {
            var msgText = messages[messageIndex % messages.length];

            var body = 'Dear Supporter,\n\n'
                + msgText + '\n\n'
                + 'With gratitude,\n'
                + 'Dr. Ivy Fernscale\n'
                + 'Serpentville Conservation Initiative\n'
                + SCI_DATA.orgEmail;

            this._sendEmail({
                from: SCI_DATA.orgEmail,
                fromName: SCI_DATA.orgFromName,
                subject: 'Conservation Update \uD83C\uDF3F',
                body: body
            });

            this._notify({
                title: 'SCI Monthly Update',
                body: 'Your conservation update from the Serpentville Conservation Initiative is in your inbox!',
                icon: 'mdi-leaf',
                category: 'general',
                urgency: 'info'
            });
        }

        // Update payment count and rotate message index
        elxaOS.inventoryService.updateItem('subscriptions', sciSub.id, {
            paymentCount: count,
            messageIndex: (messageIndex + 1) % (messages.length || 1)
        });

        // Annual Conservation Gala invitation (every 12 payments) for Conservator (level 3)
        if (count % 12 === 0 && sciSub.tierLevel >= 3) {
            var galaBody = 'Dear Conservator,\n\n'
                + 'The Serpentville Conservation Initiative is honored to invite you to our Annual Conservation Gala!\n\n'
                + 'EVENT DETAILS:\n'
                + '  Event: Annual Conservation Gala\n'
                + '  Date: Second Saturday in October\n'
                + '  Time: 6:30 PM\n'
                + '  Venue: Fernwick Nature Reserve Lodge\n'
                + '  Dress Code: Smart Casual\n\n'
                + 'Join us for an evening celebrating Snakesia\'s natural heritage. Enjoy local cuisine, live music, a guided twilight walk through the reserve, and hear directly from our field researchers about the year\'s most exciting discoveries.\n\n'
                + 'Your extraordinary generosity makes our work possible. We cannot wait to see you there.\n\n'
                + 'Warm regards,\n\n'
                + 'Dr. Ivy Fernscale\n'
                + 'Director, Serpentville Conservation Initiative\n'
                + 'director@sci.ex';

            this._sendEmail({
                from: SCI_DATA.orgEmail,
                fromName: SCI_DATA.orgFromName,
                subject: 'You\'re Invited: Annual Conservation Gala \uD83C\uDF3F',
                body: galaBody
            });

            this._notify({
                title: 'Gala Invitation!',
                body: 'You\'ve been invited to the SCI Annual Conservation Gala! Check your email.',
                icon: 'mdi-ticket',
                category: 'general',
                urgency: 'info',
                toast: true
            });
        }
    }

    // =================================
    // HELPERS
    // =================================

    /**
     * Look up a recurring payment by ID from the finance service.
     */
    _lookupRecurringPayment(paymentId) {
        if (!paymentId) return null;
        if (typeof elxaOS === 'undefined' || !elxaOS.financeService) return null;

        var payments = elxaOS.financeService.getRecurringPayments();
        return payments.find(function(p) { return p.id === paymentId; }) || null;
    }

    /**
     * Find a rental property linked to a recurring payment ID.
     */
    _findRentalByPaymentId(paymentId) {
        if (!paymentId) return null;
        if (typeof elxaOS === 'undefined' || !elxaOS.inventoryService) return null;

        var properties = elxaOS.inventoryService.getProperties ? elxaOS.inventoryService.getProperties() : [];
        return properties.find(function(p) {
            return p.rentPaymentId === paymentId && p.ownership === 'rented';
        }) || null;
    }

    /**
     * Get a human-readable loan type name.
     */
    _getLoanTypeName(type) {
        var names = {
            'personal': 'Personal Loan',
            'auto': 'Auto Loan',
            'mortgage': 'Mortgage',
            'student': 'Student Loan',
            'business': 'Business Loan',
            'secured': 'Secured Loan'
        };
        return names[type] || (type ? type.charAt(0).toUpperCase() + type.slice(1) + ' Loan' : 'Loan');
    }

    /**
     * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
     */
    _ordinal(n) {
        var s = ['th', 'st', 'nd', 'rd'];
        var v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }
}