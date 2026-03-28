// =========================================================
// EMPLOYEE DATA SYSTEM
// Handles time clock, payroll, bank integration
// =========================================================
var EmployeeDataSystem = class {
    constructor(employeeId, salary, hireDate) {
        this.employeeId = employeeId;
        this.storageKey = 'elxacorp-employee-data-' + employeeId;
        this.timerInterval = null;

        this.annualSalary = this.parseSalary(salary);
        this.hireDate = new Date(hireDate);

        this.data = this.load();
        this.checkDayReset();
        this.processPaydays();

        if (this.data.timeClock.clockedIn) {
            this.startTimerDisplay();
        }

        this.updateDashboardStats();
    }

    getDefaults() {
        return {
            timeClock: {
                clockedIn: false,
                clockInTime: null,
                todayMinutesWorked: 0,
                todayCookiesEarned: 0,
                totalCookiesEarned: 0,
                lastResetDate: this.todayString()
            },
            payroll: {
                lastPayday: null,
                ytdEarnings: 0,
                payHistory: [],
                bankUsername: null
            },
            tickets: {
                totalCompleted: 0,
                completedIds: [],
                activeTickets: [],
                careerLevel: 1,
                cookiesFromTickets: 0
            }
        };
    }

    load() {
        try {
            var raw = localStorage.getItem(this.storageKey);
            if (raw) {
                var saved = JSON.parse(raw);
                var defaults = this.getDefaults();
                return {
                    timeClock: { ...defaults.timeClock, ...saved.timeClock },
                    payroll: { ...defaults.payroll, ...saved.payroll },
                    tickets: { ...defaults.tickets, ...saved.tickets }
                };
            }
        } catch (e) { console.warn('Employee data load error:', e); }
        return this.getDefaults();
    }

    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (e) { console.warn('Employee data save error:', e); }
    }

    todayString() {
        return new Date().toISOString().slice(0, 10);
    }

    parseSalary(salaryStr) {
        if (typeof salaryStr === 'number') return salaryStr;
        if (!salaryStr) return 50000;
        var match = String(salaryStr).match(/\$([\d,]+)/);
        if (match) return parseInt(match[1].replace(/,/g, ''));
        var snakeMatch = String(salaryStr).match(/([\d,]+)\s*\u{1F40D}/u);
        if (snakeMatch) return Math.floor(parseInt(snakeMatch[1].replace(/,/g, '')) / 2);
        return 50000;
    }

    checkDayReset() {
        var today = this.todayString();
        if (this.data.timeClock.lastResetDate !== today) {
            this.data.timeClock.todayMinutesWorked = 0;
            this.data.timeClock.todayCookiesEarned = 0;
            this.data.timeClock.lastResetDate = today;
            this.save();
        }
    }

    // ===== TIME CLOCK =====
    clockIn() {
        this.data.timeClock.clockedIn = true;
        this.data.timeClock.clockInTime = Date.now();
        this.save();
        this.startTimerDisplay();
    }

    clockOut() {
        if (!this.data.timeClock.clockedIn) return;
        var elapsed = Date.now() - this.data.timeClock.clockInTime;
        var minutes = Math.floor(elapsed / 60000);
        var newCookies = Math.floor(minutes / 15);

        this.data.timeClock.todayMinutesWorked += minutes;
        this.data.timeClock.todayCookiesEarned += newCookies;
        this.data.timeClock.totalCookiesEarned += newCookies;
        this.data.timeClock.clockedIn = false;
        this.data.timeClock.clockInTime = null;
        this.save();
        this.stopTimerDisplay();
        this.updateDashboardStats();
    }

    getSessionElapsed() {
        if (!this.data.timeClock.clockedIn || !this.data.timeClock.clockInTime) return 0;
        return Date.now() - this.data.timeClock.clockInTime;
    }
    getSessionMinutes() { return Math.floor(this.getSessionElapsed() / 60000); }
    getSessionCookies() { return Math.floor(this.getSessionMinutes() / 15); }
    getTodayMinutes() { return this.data.timeClock.todayMinutesWorked + this.getSessionMinutes(); }
    getTodayCookies() { return this.data.timeClock.todayCookiesEarned + this.getSessionCookies(); }
    getTotalCookies() { return this.data.timeClock.totalCookiesEarned + this.getSessionCookies(); }

    startTimerDisplay() {
        this.stopTimerDisplay();
        this.timerInterval = setInterval(() => this.updateTimerUI(), 1000);
        this.updateTimerUI();
    }
    stopTimerDisplay() {
        if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
    }

    updateTimerUI() {
        var el = document.getElementById('tcTimer');
        if (!el) return;
        var ms = this.getSessionElapsed();
        var totalSec = Math.floor(ms / 1000);
        var h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
        var m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
        var s = String(totalSec % 60).padStart(2, '0');
        el.textContent = h + ':' + m + ':' + s;

        var todayMin = this.getTodayMinutes();
        var todayH = Math.floor(todayMin / 60);
        var todayM = todayMin % 60;
        var tcToday = document.getElementById('tcTodayTime');
        if (tcToday) tcToday.textContent = todayH + 'h ' + todayM + 'm';
        var tcDayCookies = document.getElementById('tcTodayCookies');
        if (tcDayCookies) tcDayCookies.textContent = this.getTodayCookies() + ' \u{1F36A}';
        var tcTotal = document.getElementById('tcTotalCookies');
        if (tcTotal) tcTotal.textContent = this.getTotalCookies() + ' \u{1F36A}';

        this.updateDashboardStats();
    }

    updateDashboardStats() {
        var cookiesEl = document.getElementById('cookiesEarned');
        if (cookiesEl) cookiesEl.textContent = this.getTodayCookies() + ' \u{1F36A}';
        var creditsEl = document.getElementById('cookieCredits');
        if (creditsEl) creditsEl.textContent = this.getTotalCookies() + ' \u{1F36A}';
    }

    // ===== PAYROLL ENGINE (Weekly) =====
    getPayPerPeriod() {
        // Weekly: salary / 52 pay periods per year
        return Math.round((this.annualSalary / 52) * 100) / 100;
    }

    getPaySchedule() {
        var paydays = [];
        var today = new Date();
        today.setHours(23, 59, 59, 999);

        // First payday is 1 week after hire
        var payday = new Date(this.hireDate);
        payday.setDate(payday.getDate() + 7);

        while (payday <= today) {
            paydays.push(new Date(payday));
            payday = new Date(payday);
            payday.setDate(payday.getDate() + 7);
        }
        return paydays;
    }

    getNextPayday() {
        var next = new Date(this.hireDate);
        next.setDate(next.getDate() + 7);
        var today = new Date();
        while (next <= today) {
            next.setDate(next.getDate() + 7);
        }
        return next;
    }

    processPaydays() {
        var allPaydays = this.getPaySchedule();
        if (allPaydays.length === 0) return;

        var lastProcessed = this.data.payroll.lastPayday
            ? new Date(this.data.payroll.lastPayday)
            : null;

        var payPerPeriod = this.getPayPerPeriod();
        var newPayments = 0;

        for (var i = 0; i < allPaydays.length; i++) {
            var payday = allPaydays[i];
            if (lastProcessed && payday <= lastProcessed) continue;

            this.data.payroll.ytdEarnings += payPerPeriod;
            this.data.payroll.payHistory.push({
                date: payday.toISOString(),
                amount: payPerPeriod,
                deposited: false
            });
            this.data.payroll.lastPayday = payday.toISOString();

            // Deposit to bank if linked
            var depositOk = this.depositToBank(payPerPeriod, payday);
            if (depositOk) {
                this.data.payroll.payHistory[this.data.payroll.payHistory.length - 1].deposited = true;
            }

            newPayments++;
        }

        this.data.payroll.ytdEarnings = Math.round(this.data.payroll.ytdEarnings * 100) / 100;

        if (newPayments > 0) {
            this.save();
            console.log('Processed ' + newPayments + ' payday(s). YTD: $' + this.data.payroll.ytdEarnings.toLocaleString());
        }
    }

    // ===== BANK INTEGRATION =====
    linkBank(username) {
        // Verify the FSB account exists in localStorage
        var bankData = localStorage.getItem('elxaOS-bank-user-' + username);
        if (!bankData) {
            return { success: false, message: 'No First Snakesian Bank account found for "' + username + '". Make sure you\'ve registered at fsb.ex first!' };
        }

        var parsed = JSON.parse(bankData);
        this.data.payroll.bankUsername = username;
        this.save();

        // Retroactively deposit any undeposited paychecks
        var retroCount = 0;
        for (var i = 0; i < this.data.payroll.payHistory.length; i++) {
            var entry = this.data.payroll.payHistory[i];
            if (!entry.deposited) {
                var ok = this.depositToBank(entry.amount, new Date(entry.date));
                if (ok) {
                    entry.deposited = true;
                    retroCount++;
                }
            }
        }
        if (retroCount > 0) {
            this.save();
        }

        return {
            success: true,
            message: 'Bank account linked! ' + (retroCount > 0 ? retroCount + ' missed paycheck(s) deposited!' : 'Future paychecks will be deposited automatically.'),
            name: parsed.firstName + ' ' + parsed.lastName,
            retroDeposits: retroCount
        };
    }

    unlinkBank() {
        this.data.payroll.bankUsername = null;
        this.save();
    }

    getBankUsername() {
        return this.data.payroll.bankUsername;
    }

    getBankAccountInfo() {
        var username = this.data.payroll.bankUsername;
        if (!username) return null;
        try {
            var raw = localStorage.getItem('elxaOS-bank-user-' + username);
            if (!raw) return null;
            var data = JSON.parse(raw);
            return {
                name: data.firstName + ' ' + data.lastName,
                checkingNumber: data.accounts && data.accounts.checking ? data.accounts.checking.number : null
            };
        } catch (e) { return null; }
    }

    depositToBank(amount, payday) {
        var username = this.data.payroll.bankUsername;
        if (!username) return false;

        try {
            var raw = localStorage.getItem('elxaOS-bank-user-' + username);
            if (!raw) return false;

            var bankData = JSON.parse(raw);
            if (!bankData.accounts || !bankData.accounts.checking) return false;

            // Add to checking balance
            bankData.accounts.checking.balance += amount;
            bankData.accounts.checking.balance = Math.round(bankData.accounts.checking.balance * 100) / 100;

            // Add transaction record
            if (!bankData.transactions) bankData.transactions = [];
            var dateStr = payday instanceof Date ? payday.toISOString() : new Date().toISOString();
            bankData.transactions.unshift({
                id: Date.now() + Math.random(),
                type: 'deposit',
                account: 'checking',
                amount: amount,
                description: 'ElxaCorp Payroll - Direct Deposit',
                date: dateStr,
                timestamp: Date.now()
            });

            // Keep last 50 transactions
            if (bankData.transactions.length > 50) {
                bankData.transactions = bankData.transactions.slice(0, 50);
            }

            localStorage.setItem('elxaOS-bank-user-' + username, JSON.stringify(bankData));

            // Also update live bank system if it's loaded and logged in as same user
            if (window.bankSystem && window.bankSystem.isLoggedIn &&
                window.bankSystem.currentUser && window.bankSystem.currentUser.username === username) {
                window.bankSystem.accounts.checking.balance = bankData.accounts.checking.balance;
                window.bankSystem.transactions = bankData.transactions;
                try { window.bankSystem.updateAccountDisplay(); } catch (e) {}
                try { window.bankSystem.updateTransactionHistory(); } catch (e) {}
            }

            console.log('Deposited $' + amount.toFixed(2) + ' to FSB checking (' + username + ')');
            return true;
        } catch (e) {
            console.warn('Bank deposit failed:', e);
            return false;
        }
    }

    formatCurrency(amount) {
        return '$' + amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    getYTDEarnings() {
        return this.data.payroll.ytdEarnings;
    }

    getNextPaydayFormatted() {
        var next = this.getNextPayday();
        return next.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
};