// =================================
// ELXA MOCK PAYMENT SYSTEM WITH DOWNLOAD AND BANK INTEGRATION - ENHANCED FOR TRUST ACCOUNTS
// A realistic payment dialog for pretend play with bank account integration
// =================================

// Guard against re-declaration when loaded by multiple pages in the mock browser
if (typeof ElxaMockPayment === 'undefined') {
window.ElxaMockPayment = class ElxaMockPayment {
    constructor() {
        this.isOpen = false;
        this.currentOrder = null;
        this.setupEventListeners();
        this.injectCSS();
    }

    // Inject the CSS if not already present
    injectCSS() {
        if (!document.querySelector('#elxa-payment-styles')) {
            const link = document.createElement('link');
            link.id = 'elxa-payment-styles';
            link.rel = 'stylesheet';
            link.href = './css/system/payment-system.css';
            document.head.appendChild(link);
        }
    }

    // Initialize the payment system for a product
    // Enhanced with account type support
    purchase(productInfo) {
        this.currentOrder = {
            productName: productInfo.name || 'Unknown Product',
            price: productInfo.price || '$0.00',
            description: productInfo.description || '',
            orderNumber: this.generateOrderNumber(),
            timestamp: new Date().toLocaleString(),
            priceValue: this.extractPriceValue(productInfo.price || '$0.00'),
            // Store installer data if provided (data-driven game downloads)
            installerData: productInfo.installerData || null,
            // NEW: Detect if this is a privilege purchase
            isPrivilegePurchase: productInfo.name && productInfo.name.includes('Privilege Palace'),
            privilegeData: productInfo.privilegeData || null,
            // NEW: Specify which bank account to use
            preferredAccount: productInfo.preferredAccount || 'checking',
            // NEW: Trust account authorization (for Privilege Palace)
            trustAuthorized: productInfo.trustAuthorized || false,
            // NEW: Card pack purchase (for Snakesian Card Exchange)
            isCardPurchase: productInfo.isCardPurchase || false,
            cardPurchaseData: productInfo.cardPurchaseData || null
        };
        
        this.showPaymentDialog();
    }

    // Extract numeric value from price string (e.g., "$14.99" -> 14.99)
    extractPriceValue(priceString) {
        const match = priceString.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : 0;
    }

    // Generate a realistic-looking order number
    generateOrderNumber() {
        const prefix = 'ELX';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
        return `${prefix}-${timestamp}-${random}`;
    }

    // Show the payment dialog
    showPaymentDialog() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        const dialog = this.createPaymentDialog();
        document.body.appendChild(dialog);
        
        // Add the modal backdrop
        document.body.classList.add('elxa-payment-modal-open');
        
        // Focus on the first input
        setTimeout(() => {
            const firstInput = dialog.querySelector('input[type="text"]');
            if (firstInput) firstInput.focus();
        }, 100);
        
        // Setup form validation
        this.setupFormValidation(dialog);
    }

    // Create the payment dialog HTML
    createPaymentDialog() {
        // Check if finance service is ready (means user is logged into ElxaOS)
        const financeReady = typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService.isReady();
        const creditCards = financeReady ? elxaOS.financeService.getCreditCardsSync().filter(c => c.status === 'active') : [];
        const hasCreditCards = creditCards.length > 0;
        
        let bankNotice = '';
        let paymentMethodSection = '';

        // --- Build payment method options ---
        let methodOptions = '';
        let defaultMethod = 'card'; // fake card is always the fallback default

        // Option 1: Bank account (debit) — uses finance service directly
        if (financeReady) {
            const targetAccount = this.currentOrder.preferredAccount;
            const balances = elxaOS.financeService.getAccountBalancesSync();
            const fundsCheck = elxaOS.financeService.checkFundsSync(this.currentOrder.priceValue, targetAccount);
            
            let accountDisplayName = 'Checking Account';
            let accountIcon = '🏛️';
            if (targetAccount === 'trust') { accountDisplayName = 'Trust Account'; accountIcon = '👑'; }
            else if (targetAccount === 'savings') { accountDisplayName = 'Savings Account'; accountIcon = '🏦'; }

            bankNotice = `
                <div class="elxa-payment-bank-notice ${fundsCheck.hasEnough ? 'sufficient' : 'insufficient'}">
                    <div class="elxa-payment-bank-title">${accountIcon} First Snakesian Bank - ${accountDisplayName}</div>
                    <div class="elxa-payment-bank-balance">
                        Available: $${balances[targetAccount].toFixed(2)} 
                        ${fundsCheck.hasEnough ? '✅' : '❌'}
                    </div>
                    ${!fundsCheck.hasEnough ? 
                        `<div class="elxa-payment-insufficient">Insufficient funds! ${targetAccount === 'trust' ? 'Ask a parent to add money to your Trust Account.' : 'Please add money to your account first.'}</div>` : 
                        `<div class="elxa-payment-sufficient">✅ Sufficient funds available</div>`
                    }
                    ${targetAccount === 'trust' ? 
                        `<div class="elxa-payment-trust-notice">💡 This purchase uses your parent-managed Trust Account for special privileges.</div>` : 
                        ''
                    }
                </div>
            `;

            if (fundsCheck.hasEnough) defaultMethod = 'bank';

            methodOptions += `
                <label class="elxa-payment-method-option">
                    <input type="radio" name="paymentMethod" value="bank" ${fundsCheck.hasEnough ? 'checked' : 'disabled'}>
                    <span>${accountIcon} Bank Account (Debit)</span>
                    <small>Pay from ${accountDisplayName} — $${balances[targetAccount].toFixed(2)} available</small>
                </label>
            `;
        }

        // Option 2: Credit card (from finance service)
        if (hasCreditCards) {
            let cardDropdown = '<select id="creditCardSelect" class="elxa-payment-cc-select">';
            creditCards.forEach(card => {
                const avail = (card.creditLimit - card.balance).toFixed(2);
                cardDropdown += `<option value="${card.id}">${card.name} (****${card.last4}) — $${avail} available</option>`;
            });
            cardDropdown += '</select>';

            const ccChecked = (defaultMethod !== 'bank') ? 'checked' : '';
            if (ccChecked) defaultMethod = 'creditcard';

            methodOptions += `
                <label class="elxa-payment-method-option">
                    <input type="radio" name="paymentMethod" value="creditcard" ${ccChecked}>
                    <span>💳 My Credit Card</span>
                    <small>Charge to one of your credit cards</small>
                </label>
                <div class="elxa-payment-cc-picker" id="creditCardPicker" style="${ccChecked ? '' : 'display:none;'}">
                    ${cardDropdown}
                </div>
            `;
        }

        // Option 3: Enter card info (always available)
        const fakeChecked = (defaultMethod !== 'bank' && defaultMethod !== 'creditcard') ? 'checked' : '';
        methodOptions += `
            <label class="elxa-payment-method-option">
                <input type="radio" name="paymentMethod" value="card" ${fakeChecked}>
                <span>⌨️ Enter Card Info</span>
                <small>Type in any card details${hasCreditCards || financeReady ? '' : ' (just make something up!)'}</small>
            </label>
        `;

        paymentMethodSection = `
            <div class="elxa-payment-section">
                <h3>💳 Payment Method</h3>
                <div class="elxa-payment-method-options">
                    ${methodOptions}
                </div>
            </div>
        `;

        const dialog = document.createElement('div');
        dialog.className = 'elxa-payment-modal';
        dialog.innerHTML = `
            <div class="elxa-payment-backdrop"></div>
            <div class="elxa-payment-dialog">
                <div class="elxa-payment-header">
                    <div class="elxa-payment-title">💳 ElxaCorp Secure Payment</div>
                    <button class="elxa-payment-close" type="button">×</button>
                </div>
                
                <div class="elxa-payment-content">
                    <div class="elxa-payment-order-summary">
                        <h3>Order Summary</h3>
                        <div class="elxa-payment-order-item">
                            <div class="elxa-payment-product-name">${this.currentOrder.productName}</div>
                            <div class="elxa-payment-product-price">${this.currentOrder.price}</div>
                        </div>
                        <div class="elxa-payment-order-total">
                            <strong>Total: ${this.currentOrder.price}</strong>
                        </div>
                        <div class="elxa-payment-order-number">Order #${this.currentOrder.orderNumber}</div>
                    </div>
                    
                    ${bankNotice}
                    
                    <form class="elxa-payment-form" id="elxaPaymentForm">
                        ${paymentMethodSection}
                        
                        <div class="elxa-payment-section" id="cardPaymentSection">
                            <h3>💳 Credit Card Information</h3>
                            
                            <div class="elxa-payment-field">
                                <label for="cardNumber">Card Number</label>
                                <input type="text" id="cardNumber" name="cardNumber" 
                                       placeholder="1234 5678 9012 3456" maxlength="19" required>
                                <div class="elxa-payment-card-icons">
                                    <span title="Visa">💳</span>
                                    <span title="MasterCard">💳</span>
                                    <span title="ElxaCard">🎯</span>
                                </div>
                            </div>
                            
                            <div class="elxa-payment-field-row">
                                <div class="elxa-payment-field">
                                    <label for="expiryDate">Expiry Date</label>
                                    <input type="text" id="expiryDate" name="expiryDate" 
                                           placeholder="MM/YY" maxlength="5" required>
                                </div>
                                <div class="elxa-payment-field">
                                    <label for="cvv">CVV</label>
                                    <input type="text" id="cvv" name="cvv" 
                                           placeholder="123" maxlength="4" required>
                                </div>
                            </div>
                            
                            <div class="elxa-payment-field">
                                <label for="cardName">Name on Card</label>
                                <input type="text" id="cardName" name="cardName" 
                                       placeholder="JOHN SNAKE" required>
                            </div>
                        </div>
                        
                        <div class="elxa-payment-section" id="billingSection">
                            <h3>📮 Billing Address</h3>
                            
                            <div class="elxa-payment-field">
                                <label for="email">Email Address</label>
                                <input type="email" id="email" name="email" 
                                       placeholder="john@example.ex" required>
                            </div>
                            
                            <div class="elxa-payment-field">
                                <label for="address1">Street Address</label>
                                <input type="text" id="address1" name="address1" 
                                       placeholder="123 Snake Street" required>
                            </div>
                            
                            <div class="elxa-payment-field">
                                <label for="address2">Apartment, suite, etc. (optional)</label>
                                <input type="text" id="address2" name="address2" 
                                       placeholder="Apt 4B">
                            </div>
                            
                            <div class="elxa-payment-field-row">
                                <div class="elxa-payment-field">
                                    <label for="city">City</label>
                                    <input type="text" id="city" name="city" 
                                           placeholder="Snake City" required>
                                </div>
                                <div class="elxa-payment-field">
                                    <label for="state">State/Province</label>
                                    <select id="state" name="state" required>
                                        <option value="">Select State</option>
                                        <option value="NS">North Snakesia</option>
                                        <option value="SS">South Snakesia</option>
                                        <option value="ES">East Snakesia</option>
                                        <option value="WS">West Snakesia</option>
                                        <option value="CS">Central Snakesia</option>
                                    </select>
                                </div>
                                <div class="elxa-payment-field">
                                    <label for="zipCode">ZIP Code</label>
                                    <input type="text" id="zipCode" name="zipCode" 
                                           placeholder="12345" maxlength="5" required>
                                </div>
                            </div>
                        </div>
                        
                        <div class="elxa-payment-security-notice">
                            🔒 Your payment information is secure and encrypted using ElxaCorp's advanced security technology.
                        </div>
                        
                        <div class="elxa-payment-buttons">
                            <button type="button" class="elxa-payment-btn elxa-payment-btn-cancel">Cancel</button>
                            <button type="submit" class="elxa-payment-btn elxa-payment-btn-primary">
                                Complete Purchase ${this.currentOrder.price}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        return dialog;
    }

    // Open bank login in a new browser tab
    openBankLogin() {
        if (typeof elxaOS !== 'undefined' && elxaOS.programs && elxaOS.programs.browser) {
            // Load the bank website in the browser
            elxaOS.programs.browser.loadPage('first-snakesian-bank.ex');
        } else {
            alert('Please open the Snoogle Browser and navigate to first-snakesian-bank.ex to log in to your account.');
        }
    }

    // Setup form validation and interactions
    setupFormValidation(dialog) {
        const form = dialog.querySelector('#elxaPaymentForm');
        const cardNumberInput = dialog.querySelector('#cardNumber');
        const expiryInput = dialog.querySelector('#expiryDate');
        const cvvInput = dialog.querySelector('#cvv');
        const zipInput = dialog.querySelector('#zipCode');
        const cardSection = dialog.querySelector('#cardPaymentSection');
        const billingSection = dialog.querySelector('#billingSection');
        
        // Handle payment method changes
        const paymentMethods = dialog.querySelectorAll('input[name="paymentMethod"]');
        const ccPicker = dialog.querySelector('#creditCardPicker');
        
        const hideCardForm = () => {
            cardSection.style.display = 'none';
            billingSection.style.display = 'none';
            cardSection.querySelectorAll('input[required]').forEach(input => input.removeAttribute('required'));
            billingSection.querySelectorAll('input[required], select[required]').forEach(input => input.removeAttribute('required'));
        };
        
        const showCardForm = () => {
            cardSection.style.display = 'block';
            billingSection.style.display = 'block';
            cardSection.querySelectorAll('input').forEach(input => {
                if (input.id !== 'address2') input.setAttribute('required', 'required');
            });
            billingSection.querySelectorAll('input, select').forEach(input => {
                if (input.id !== 'address2') input.setAttribute('required', 'required');
            });
        };
        
        paymentMethods.forEach(method => {
            method.addEventListener('change', () => {
                // Show/hide credit card picker
                if (ccPicker) ccPicker.style.display = (method.value === 'creditcard') ? '' : 'none';
                
                if (method.value === 'bank' || method.value === 'creditcard') {
                    // Bank debit or credit card from finance service — no manual card form needed
                    hideCardForm();
                } else {
                    // "Enter card info" — show the manual card form
                    showCardForm();
                }
            });
        });
        
        // Trigger initial setup
        const selectedMethod = dialog.querySelector('input[name="paymentMethod"]:checked');
        if (selectedMethod) {
            selectedMethod.dispatchEvent(new Event('change'));
        }
        
        // Format card number with spaces
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/g, '');
                let formattedValue = value.replace(/(.{4})/g, '$1 ').trim();
                if (formattedValue.length > 19) formattedValue = formattedValue.substr(0, 19);
                e.target.value = formattedValue;
            });
        }
        
        // Format expiry date
        if (expiryInput) {
            expiryInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/[^0-9]/g, '');
                if (value.length >= 2) {
                    value = value.substr(0, 2) + '/' + value.substr(2, 2);
                }
                e.target.value = value;
            });
        }
        
        // Restrict CVV to numbers only
        if (cvvInput) {
            cvvInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
            });
        }
        
        // Restrict ZIP to numbers only
        if (zipInput) {
            zipInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
            });
        }
        
        // Handle form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processPayment(form);
        });
        
        // Handle close buttons
        dialog.querySelector('.elxa-payment-close').addEventListener('click', () => {
            this.closePaymentDialog();
        });
        
        dialog.querySelector('.elxa-payment-btn-cancel').addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('elxa-payment-cancelled'));
            this.closePaymentDialog();
        });
        
        // Handle backdrop click
        dialog.querySelector('.elxa-payment-backdrop').addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('elxa-payment-cancelled'));
            this.closePaymentDialog();
        });
    }

    // Process the "payment" (with bank integration and account selection)
    processPayment(form) {
        console.log('💳 Processing payment...');
        const formData = new FormData(form);
        const paymentData = Object.fromEntries(formData.entries());
        const paymentMethod = paymentData.paymentMethod || 'card';
        
        // --- Credit card payment (from finance service) ---
        if (paymentMethod === 'creditcard') {
            const cardSelect = document.getElementById('creditCardSelect');
            const cardId = cardSelect ? cardSelect.value : null;
            
            if (!cardId) {
                this.showPaymentError('Please select a credit card.');
                return;
            }
            
            const financeReady = typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService.isReady();
            if (!financeReady) {
                this.showPaymentError('Finance service not available.');
                return;
            }
            
            const description = `${this.currentOrder.productName} - ${this.currentOrder.orderNumber}`;
            const ccResult = elxaOS.financeService.chargeCreditSync(cardId, this.currentOrder.priceValue, description);
            
            if (!ccResult.success) {
                console.log('❌ Credit card payment failed:', ccResult.message);
                this.showPaymentError(ccResult.message);
                return;
            }
            
            console.log(`✅ Credit card payment successful: ${ccResult.cardName} ****${ccResult.cardLast4}`);
            paymentData.paymentMethod = 'creditcard';
            paymentData.cardName = ccResult.cardName;
            paymentData.cardLast4 = ccResult.cardLast4;
            paymentData.email = 'customer@snakesia.ex';
        }
        
        // --- Bank (debit) payment — routes through finance service directly ---
        if (paymentMethod === 'bank') {
            const financeReady = typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService.isReady();
            if (!financeReady) {
                this.showPaymentError('Finance service not available.');
                return;
            }

            console.log(`🏛️ Processing debit payment from ${this.currentOrder.preferredAccount} account...`);
            
            // Prepare description with trust authorization if needed
            let description = `${this.currentOrder.productName} - ${this.currentOrder.orderNumber}`;
            if (this.currentOrder.preferredAccount === 'trust' && this.currentOrder.trustAuthorized) {
                description = '[TRUST_AUTHORIZED] ' + description;
            }
            
            // Process payment through finance service
            const debitResult = elxaOS.financeService.processPaymentSync(
                this.currentOrder.priceValue, 
                description,
                this.currentOrder.preferredAccount
            );
            
            if (!debitResult.success) {
                console.log('❌ Debit payment failed:', debitResult.message);
                this.showPaymentError(debitResult.message);
                return;
            }
            
            // Get user info from registry for receipt
            var username = (elxaOS.registry && elxaOS.registry.getCurrentUsername()) || 'customer';
            var displayName = username;
            try {
                var cached = elxaOS.registry._profileCache;
                if (cached && cached.displayName) displayName = cached.displayName;
            } catch (_) {}
            
            console.log(`✅ Debit payment successful from ${this.currentOrder.preferredAccount} account`);
            paymentData.paymentMethod = 'bank';
            paymentData.accountUsed = this.currentOrder.preferredAccount;
            paymentData.cardName = displayName;
            paymentData.email = `${username}@snakesia.ex`;
        }
        
        // Show processing state
        this.showProcessingState();
        
        // Simulate payment processing delay
        setTimeout(() => {
            this.showSuccessMessage(paymentData);
        }, 2000 + Math.random() * 2000); // 2-4 seconds
    }

    // Show payment error
    showPaymentError(message) {
        const dialog = document.querySelector('.elxa-payment-dialog');
        const existingError = dialog.querySelector('.elxa-payment-error');
        
        if (existingError) {
            existingError.remove();
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'elxa-payment-error';
        errorDiv.innerHTML = `
            <div class="elxa-payment-error-box">
                <strong>Payment Failed:</strong> ${message}
                <br><br>
                <button class="elxa-payment-error-dismiss" onclick="this.parentElement.parentElement.remove()">
                    Dismiss
                </button>
            </div>
        `;
        
        const content = dialog.querySelector('.elxa-payment-content');
        content.insertBefore(errorDiv, content.firstChild);
    }

    // Show processing animation
    showProcessingState() {
        const dialog = document.querySelector('.elxa-payment-dialog');
        const processingDiv = document.createElement('div');
        processingDiv.className = 'elxa-payment-processing';
        processingDiv.innerHTML = `
            <div class="elxa-payment-processing-content">
                <div class="elxa-payment-spinner"></div>
                <h3>Processing Payment...</h3>
                <p>Please wait while we securely process your transaction.</p>
                <div class="elxa-payment-progress-bar">
                    <div class="elxa-payment-progress-fill"></div>
                </div>
            </div>
        `;
        
        const contentArea = dialog.querySelector('.elxa-payment-content');
        contentArea.innerHTML = '';
        contentArea.appendChild(processingDiv);
    }

    // Show success message with conditional download option
    showSuccessMessage(paymentData) {
        const dialog = document.querySelector('.elxa-payment-dialog');
        const processingDiv = dialog.querySelector('.elxa-payment-processing');
        
        if (processingDiv) {
            processingDiv.remove();
        }
        
        // Create payment method text with account info
        let paymentMethodText = 'Credit/Debit Card';
        if (paymentData.paymentMethod === 'creditcard') {
            paymentMethodText = `💳 ${paymentData.cardName || 'Credit Card'} (****${paymentData.cardLast4 || '????'})`;
        } else if (paymentData.paymentMethod === 'bank') {
            const accountUsed = paymentData.accountUsed || this.currentOrder.preferredAccount;
            let accountDisplayName = 'Bank Account';
            
            if (accountUsed === 'trust') {
                accountDisplayName = 'Trust Account';
                paymentMethodText = '👑 First Snakesian Bank - Trust Account';
            } else if (accountUsed === 'savings') {
                accountDisplayName = 'Savings Account';
                paymentMethodText = '🏦 First Snakesian Bank - Savings Account';
            } else {
                accountDisplayName = 'Checking Account';
                paymentMethodText = '🏛️ First Snakesian Bank - Checking Account';
            }
        }
        
        // Build the success content based on purchase type
        let successContent;
        
        if (this.currentOrder.isPrivilegePurchase) {
            // For Privilege Palace purchases - no download section
            successContent = this.buildPrivilegeSuccessContent(paymentData, paymentMethodText);
        } else if (this.currentOrder.isCardPurchase) {
            // For Snakesian Card Exchange purchases - no download, triggers pack opening
            successContent = this.buildCardPurchaseSuccessContent(paymentData, paymentMethodText);
        } else if (!this.currentOrder.installerData) {
            // Purchase-only (e.g. Sssteam handles install separately)
            successContent = this.buildPurchaseOnlySuccessContent(paymentData, paymentMethodText);
        } else {
            // For game purchases with installer data - include download section
            successContent = this.buildGameSuccessContent(paymentData, paymentMethodText);
        }
        
        const successDiv = document.createElement('div');
        successDiv.className = 'elxa-payment-success';
        successDiv.innerHTML = successContent;
        
        const contentArea = dialog.querySelector('.elxa-payment-content');
        contentArea.innerHTML = '';
        contentArea.style.display = '';
        contentArea.appendChild(successDiv);

        // Dispatch payment-complete event so other systems can react
        document.dispatchEvent(new CustomEvent('elxa-payment-complete', {
            detail: {
                orderNumber: this.currentOrder.orderNumber,
                productName: this.currentOrder.productName,
                priceValue: this.currentOrder.priceValue,
                isCardPurchase: this.currentOrder.isCardPurchase,
                cardPurchaseData: this.currentOrder.cardPurchaseData,
                installerData: this.currentOrder.installerData
            }
        }));
        
        // Auto-close timing depends on purchase type
        const autoCloseTime = this.currentOrder.isCardPurchase ? 5000 : (this.currentOrder.isPrivilegePurchase ? 15000 : 30000);
        setTimeout(() => {
            this.closePaymentDialog();
        }, autoCloseTime);
    }

    // Build success content for privilege purchases
    buildPrivilegeSuccessContent(paymentData, paymentMethodText) {
        // Handle special Privilege Palace data if available
        let privilegeDetails = '';
        if (this.currentOrder.privilegeData) {
            const { cart, total } = this.currentOrder.privilegeData;
            privilegeDetails = `
                <div class="elxa-payment-receipt-line">
                    <span>Items:</span>
                    <span>${cart.length} Privilege${cart.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="elxa-payment-receipt-line">
                    <span>Details:</span>
                    <span>${cart.map(item => item.name).join(', ')}</span>
                </div>
            `;
        }
        
        return `
            <div class="elxa-payment-success-content">
                <div class="elxa-payment-success-icon">✅</div>
                <h2>Payment Successful!</h2>
                <p>Thank you for your purchase, ${paymentData.cardName}!</p>
                
                <div class="elxa-payment-receipt">
                    <h3>📧 Receipt</h3>
                    <div class="elxa-payment-receipt-line">
                        <span>Product:</span>
                        <span>${this.currentOrder.productName}</span>
                    </div>
                    ${privilegeDetails}
                    <div class="elxa-payment-receipt-line">
                        <span>Amount:</span>
                        <span>${this.currentOrder.price}</span>
                    </div>
                    <div class="elxa-payment-receipt-line">
                        <span>Payment Method:</span>
                        <span>${paymentMethodText}</span>
                    </div>
                    <div class="elxa-payment-receipt-line">
                        <span>Order #:</span>
                        <span>${this.currentOrder.orderNumber}</span>
                    </div>
                    <div class="elxa-payment-receipt-line">
                        <span>Date:</span>
                        <span>${this.currentOrder.timestamp}</span>
                    </div>
                    <div class="elxa-payment-receipt-line">
                        <span>Email:</span>
                        <span>${paymentData.email}</span>
                    </div>
                </div>
                
                <div class="elxa-payment-success-message">
                    <p>🏰 Your privileges have been activated!</p>
                    <p>A confirmation email has been sent to ${paymentData.email}</p>
                    <p>⭐ Your privileges are now available for use</p>
                    <p>🎉 Thanks for shopping with Privilege Palace!</p>
                    ${paymentData.accountUsed === 'trust' ? 
                        '<p class="elxa-payment-trust-success">👑 Payment processed from your parent-managed Trust Account</p>' : 
                        ''
                    }
                </div>
                
                <button class="elxa-payment-btn elxa-payment-btn-primary" onclick="elxaMockPayment.closePaymentDialog()">
                    Close
                </button>
            </div>
        `;
    }

    // Build success content for card pack purchases (no download, auto-closes)
    buildCardPurchaseSuccessContent(paymentData, paymentMethodText) {
        const packName = this.currentOrder.cardPurchaseData ? this.currentOrder.cardPurchaseData.packName : 'Card Pack';
        return `
            <div class="elxa-payment-success-content">
                <div class="elxa-payment-success-icon">✅</div>
                <h2>Payment Successful!</h2>
                <p>Thank you for your purchase, ${paymentData.cardName}!</p>
                
                <div class="elxa-payment-receipt">
                    <h3>📧 Receipt</h3>
                    <div class="elxa-payment-receipt-line">
                        <span>Product:</span>
                        <span>${this.currentOrder.productName}</span>
                    </div>
                    <div class="elxa-payment-receipt-line">
                        <span>Amount:</span>
                        <span>${this.currentOrder.price}</span>
                    </div>
                    <div class="elxa-payment-receipt-line">
                        <span>Payment Method:</span>
                        <span>${paymentMethodText}</span>
                    </div>
                    <div class="elxa-payment-receipt-line">
                        <span>Order #:</span>
                        <span>${this.currentOrder.orderNumber}</span>
                    </div>
                </div>
                
                <div class="elxa-payment-success-message">
                    <p>🃏 Your <strong>${packName}</strong> is ready to open!</p>
                    <p>This window will close automatically...</p>
                </div>
                
                <button class="elxa-payment-btn elxa-payment-btn-primary" onclick="elxaMockPayment.closePaymentDialog()">
                    Close
                </button>
            </div>
        `;
    }

    // Build success content for purchase-only (no download — store handles install)
    buildPurchaseOnlySuccessContent(paymentData, paymentMethodText) {
        return `
            <div class="elxa-payment-success-content">
                <div class="elxa-payment-success-icon">✅</div>
                <h2>Payment Successful!</h2>
                <p>Thank you for your purchase, ${paymentData.cardName}!</p>
                
                <div class="elxa-payment-receipt">
                    <h3>📧 Receipt</h3>
                    <div class="elxa-payment-receipt-line">
                        <span>Product:</span>
                        <span>${this.currentOrder.productName}</span>
                    </div>
                    <div class="elxa-payment-receipt-line">
                        <span>Amount:</span>
                        <span>${this.currentOrder.price}</span>
                    </div>
                    <div class="elxa-payment-receipt-line">
                        <span>Payment Method:</span>
                        <span>${paymentMethodText}</span>
                    </div>
                    <div class="elxa-payment-receipt-line">
                        <span>Order #:</span>
                        <span>${this.currentOrder.orderNumber}</span>
                    </div>
                    <div class="elxa-payment-receipt-line">
                        <span>Date:</span>
                        <span>${this.currentOrder.timestamp}</span>
                    </div>
                </div>
                
                <div class="elxa-payment-success-message">
                    <p>🎮 Your purchase is complete!</p>
                    <p>Head to your <strong>Library</strong> to install your new game.</p>
                </div>
                
                <button class="elxa-payment-btn elxa-payment-btn-primary" onclick="elxaMockPayment.closePaymentDialog()">
                    Close
                </button>
            </div>
        `;
    }

    // Build success content for game purchases (with download)
    buildGameSuccessContent(paymentData, paymentMethodText) {
        return `
            <div class="elxa-payment-success-content">
                <div class="elxa-payment-success-icon">✅</div>
                <h2>Payment Successful!</h2>
                <p>Thank you for your purchase, ${paymentData.cardName}!</p>
                
                <div class="elxa-payment-receipt">
                    <h3>📧 Receipt</h3>
                    <div class="elxa-payment-receipt-line">
                        <span>Product:</span>
                        <span>${this.currentOrder.productName}</span>
                    </div>
                    <div class="elxa-payment-receipt-line">
                        <span>Amount:</span>
                        <span>${this.currentOrder.price}</span>
                    </div>
                    <div class="elxa-payment-receipt-line">
                        <span>Payment Method:</span>
                        <span>${paymentMethodText}</span>
                    </div>
                    <div class="elxa-payment-receipt-line">
                        <span>Order #:</span>
                        <span>${this.currentOrder.orderNumber}</span>
                    </div>
                    <div class="elxa-payment-receipt-line">
                        <span>Date:</span>
                        <span>${this.currentOrder.timestamp}</span>
                    </div>
                    <div class="elxa-payment-receipt-line">
                        <span>Email:</span>
                        <span>${paymentData.email}</span>
                    </div>
                </div>
                
                <div class="elxa-payment-success-message">
                    <p>🎮 Your game purchase is complete!</p>
                    <p>A confirmation email has been sent to ${paymentData.email}</p>
                    <p>💾 Click below to download your game installer:</p>
                </div>
                
                <div class="elxa-payment-download-section">
                    <button class="elxa-payment-btn elxa-payment-btn-download" onclick="elxaMockPayment.downloadGame()">
                        💾 Download ${this.currentOrder.productName}
                    </button>
                    <div class="elxa-payment-download-info">
                        <small>The installer will be saved to your Programs folder</small>
                    </div>
                </div>
                
                <button class="elxa-payment-btn elxa-payment-btn-primary" onclick="elxaMockPayment.closePaymentDialog()">
                    Close
                </button>
            </div>
        `;
    }

    // Download the purchased game (data-driven)
    downloadGame() {
        if (!this.currentOrder) {
            alert('No active order found!');
            return;
        }

        // Use installer data from the order if provided (Sssteam / data-driven)
        // Fall back to legacy hardcoded lookup for old game sites
        let installerData = this.currentOrder.installerData;
        
        if (!installerData) {
            // Legacy fallback for old individual game sites
            const legacyInstallers = {
                'Sussy Cat Adventure': {
                    id: 'sussy_cat_adventure',
                    name: 'Sussy Cat Adventure',
                    description: 'A Cozy Stealth Game for Kids - Help Pushing Cat collect items while avoiding detection!',
                    icon: '<img src="./assets/games/sussycat/icon.png" style="width:1em;height:1em;object-fit:contain;vertical-align:middle">',
                    version: '1.2',
                    author: 'ElxaCorp Games Division',
                    gameData: {
                        type: 'sussy_cat_game',
                        levels: 6,
                        rooms: ['Living Room', 'Kitchen', 'Bedroom', 'Bathroom'],
                        features: ['Sussy Lair hiding spot', 'Plotting mechanic', 'Retro pixel art', 'Family-friendly gameplay']
                    }
                },
                'Mail Room Mayhem': {
                    id: 'mail_room_mayhem',
                    name: 'Mail Room Mayhem',
                    description: 'ElxaCorp\'s Fast-Paced Sorting Challenge - Sort Snakesian mail with keyboard-optimized controls!',
                    icon: '<img src="./assets/games/mail-room-mayhem/icon.png" style="width:1em;height:1em;object-fit:contain;vertical-align:middle">',
                    version: '1.0',
                    author: 'ElxaCorp Games Division - Mail Dept.',
                    gameData: {
                        type: 'mail_room_mayhem',
                        features: ['Keyboard-optimized controls', 'Pushing Cat events', 'Snakesian mail content', 'High score tracking'],
                        departments: ['Executive', 'Tech', 'Snakesia', 'Recycle'],
                        difficulty: 'Progressive - starts easy, gets intense!'
                    }
                }
            };
            
            installerData = legacyInstallers[this.currentOrder.productName] || {
                id: 'generic_game',
                name: this.currentOrder.productName,
                description: 'A fun game from ElxaCorp!',
                icon: '🎮',
                version: '1.0',
                author: 'ElxaCorp Games',
                gameData: { type: 'target_game' }
            };
        }

        // Try to access the file system through the global elxaOS object
        if (typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
            try {
                // Create the .abby installer file in Programs folder
                const installerContent = JSON.stringify(installerData, null, 2);
                const fileName = `${installerData.name.replace(/[^a-zA-Z0-9]/g, '_')}_Installer.abby`;
                
                // Save to Programs folder
                elxaOS.fileSystem.createFile(['root', 'Programs'], fileName, installerContent, 'abby');
                
                // Show success message and update the download button
                this.showDownloadSuccess(fileName);
                
                // Trigger desktop refresh so the file appears
                if (elxaOS.eventBus) {
                    elxaOS.eventBus.emit('desktop.changed');
                }
                
            } catch (error) {
                console.error('Failed to create installer file:', error);
                alert('Download failed! Please check if the Programs folder exists.');
            }
        } else {
            console.error('File system not available');
            alert('Download failed! File system not available.');
        }
    }

    // Show download success message
    showDownloadSuccess(fileName) {
        const dialog = document.querySelector('.elxa-payment-dialog');
        const downloadSection = dialog.querySelector('.elxa-payment-download-section');
        
        if (downloadSection) {
            downloadSection.innerHTML = `
                <div class="elxa-payment-download-success">
                    <div class="elxa-payment-success-icon">✅</div>
                    <h4>Download Complete!</h4>
                    <p><strong>${fileName}</strong> has been saved to your Programs folder.</p>
                    <p>💡 Double-click the installer file to install your game!</p>
                </div>
            `;
        }
        
        // Force cleanup of any lingering modal effects
        setTimeout(() => {
            document.body.classList.remove('elxa-payment-modal-open');
            document.body.style.cssText = ''; // Reset all inline styles
            
            // Also remove any leftover backdrop elements
            const leftoverBackdrops = document.querySelectorAll('.elxa-payment-backdrop');
            leftoverBackdrops.forEach(backdrop => backdrop.remove());
        }, 100);
    }

    // Close the payment dialog
    closePaymentDialog() {
        const modal = document.querySelector('.elxa-payment-modal');
        if (modal) {
            modal.remove();
        }
        
        // Remove the modal class from body
        document.body.classList.remove('elxa-payment-modal-open');
        
        // Reset any body styles that might have been affected
        document.body.style.overflow = '';
        document.body.style.background = '';
        
        this.isOpen = false;
        this.currentOrder = null;
    }

    // Setup any global event listeners
    setupEventListeners() {
        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                document.dispatchEvent(new CustomEvent('elxa-payment-cancelled'));
                this.closePaymentDialog();
            }
        });

        // Bank/method/download styles now live in payment-system.css (theme-aware)
    }
}; // end class ElxaMockPayment
} // end if (typeof ElxaMockPayment === 'undefined')

// Only create global instance if it doesn't exist
if (!window.elxaMockPayment) {
    window.elxaMockPayment = new ElxaMockPayment();
    console.log('💳 Payment system initialized');
} else {
    console.log('💳 Payment system already exists, skipping initialization');
}

// Helper functions - only create if they don't exist
if (!window.purchaseProduct) {
    window.purchaseProduct = function(productInfo) {
        window.elxaMockPayment.purchase(productInfo);
    };
}

// Enhanced purchase functions with account specification
if (!window.purchaseWithTrust) {
    window.purchaseWithTrust = function(productInfo) {
        productInfo.preferredAccount = 'trust';
        productInfo.trustAuthorized = true;
        window.elxaMockPayment.purchase(productInfo);
    };
}

if (!window.purchaseSussyCat) {
    window.purchaseSussyCat = function() {
        window.purchaseProduct({
            name: 'Sussy Cat Adventure',
            price: '$14.99',
            description: 'A Cozy Stealth Game for Kids'
        });
    };
}

if (!window.downloadSussyCatDemo) {
    window.downloadSussyCatDemo = function() {
        // Set up a temporary order for the demo
        elxaMockPayment.currentOrder = {
            productName: 'Sussy Cat Adventure',
            price: 'FREE DEMO',
            description: 'Demo version'
        };
        
        // Directly download the game
        elxaMockPayment.downloadGame();
        
        // Show a simple success message
        alert('Demo downloaded! Check your Programs folder for the Sussy Cat Adventure installer.');
    };
}

// Download a free game directly (no payment dialog)
if (!window.downloadFreeGame) {
    window.downloadFreeGame = function(installerData) {
        if (!installerData) {
            ElxaUI.showMessage('No game data provided!', 'error');
            return;
        }
        
        if (typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
            try {
                const installerContent = JSON.stringify(installerData, null, 2);
                const fileName = `${installerData.name.replace(/[^a-zA-Z0-9]/g, '_')}_Installer.abby`;
                
                elxaOS.fileSystem.createFile(['root', 'Programs'], fileName, installerContent, 'abby');
                
                if (elxaOS.eventBus) {
                    elxaOS.eventBus.emit('desktop.changed');
                }
                
                ElxaUI.showMessage(`${installerData.name} downloaded to Programs folder! Double-click the installer to install.`, 'success');
            } catch (error) {
                console.error('Failed to download free game:', error);
                ElxaUI.showMessage('Download failed! Please try again.', 'error');
            }
        } else {
            ElxaUI.showMessage('File system not available!', 'error');
        }
    };
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ElxaMockPayment;
}