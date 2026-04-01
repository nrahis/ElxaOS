// =================================
// EMPLOYMENT SERVICE
// =================================
// Tracks employment status at the OS level so paychecks process
// automatically on boot — even when the employee portal isn't open.
//
// STORAGE: Registry user state under `employment`
// EVENTS:  employment.hired, employment.transferred, employment.paychecksProcessed, employment.terminated
//
// Boot order: runs AFTER financeService.init(), BEFORE inventoryService.init()
// so that paychecks are deposited before the monthly cycle processes bills.
//
// USAGE:
//   elxaOS.employmentService.isEmployed()       // sync check
//   elxaOS.employmentService.getEmploymentData() // sync getter
//   await elxaOS.employmentService.hire({...})   // called by ElxaCorp job system
// =================================

class EmploymentService {
    constructor(eventBus, registry) {
        this.eventBus = eventBus;
        this.registry = registry;

        // In-memory cache of employment data
        this._data = null;
        this._ready = false;

        this._setupEventListeners();

        console.log('\ud83d\udcbc EmploymentService initialized');
    }

    // =================================
    // LIFECYCLE
    // =================================

    _setupEventListeners() {
        var self = this;

        // Reload employment data when a user logs in
        this.eventBus.on('registry.userLoaded', async function() {
            await self._loadEmploymentData();
        });

        // Clear cache on logout
        this.eventBus.on('login.logout', function() {
            self._data = null;
            self._ready = false;
        });
    }

    /**
     * Called during ElxaOS async init, after financeService.init().
     * Loads employment data, runs localStorage migration if needed,
     * and processes any missed paychecks.
     */
    async init() {
        if (this.registry.isLoggedIn()) {
            await this._loadEmploymentData();
        }
        console.log('\ud83d\udcbc EmploymentService ready');
    }

    // =================================
    // DATA LOADING & MIGRATION
    // =================================

    async _loadEmploymentData() {
        var username = this.registry.getCurrentUsername();
        if (!username) return;

        // Load from registry
        var existing = await this.registry.getState('employment');

        if (existing && existing.status) {
            this._data = existing;
            this._ready = true;
            console.log('\ud83d\udcbc Employment data loaded for "' + username + '" \u2014 status: ' + this._data.status);

            // Process any missed paychecks
            if (this._data.status === 'employed') {
                await this.processPaychecks();
            }
            return;
        }

        // No employment data yet — try migrating from localStorage
        console.log('\ud83d\udcbc No employment data found for "' + username + '", checking localStorage...');
        var migrated = await this._migrateFromLocalStorage();

        if (migrated) {
            this._ready = true;
            // Process missed paychecks after migration
            if (this._data.status === 'employed') {
                await this.processPaychecks();
            }
        } else {
            // No employment at all — set default
            this._data = this._createDefault();
            this._ready = true;
        }
    }

    _createDefault() {
        return {
            status: 'unemployed',
            employer: null,
            employeeId: null,
            position: null,
            department: null,
            annualSalary: 0,
            salaryDisplay: null,
            hireDate: null,
            manager: null,
            payFrequency: 'weekly',
            payFormat: 'snakes',
            lastPayday: null,
            ytdEarnings: 0,
            payHistory: [],
            terminatedDate: null,
            terminationReason: null
        };
    }

    // =================================
    // EMPLOYMENT MANAGEMENT
    // =================================

    /**
     * Record a new hire. Called by ElxaCorp job integration on hire.
     * @param {object} employmentData
     *   { employeeId, employer, position, department, annualSalary,
     *     salaryDisplay, hireDate, manager, payFrequency }
     */
    async hire(employmentData) {
        this._data = {
            status: 'employed',
            employer: employmentData.employer || 'ElxaCorp',
            employeeId: employmentData.employeeId,
            position: employmentData.position,
            department: employmentData.department,
            annualSalary: employmentData.annualSalary,
            salaryDisplay: employmentData.salaryDisplay,
            hireDate: employmentData.hireDate,
            manager: employmentData.manager || 'Department Manager',
            payFrequency: employmentData.payFrequency || 'weekly',
            payFormat: employmentData.payFormat || 'snakes',
            lastPayday: null,
            ytdEarnings: 0,
            payHistory: [],
            terminatedDate: null,
            terminationReason: null
        };

        await this._save();

        this.eventBus.emit('employment.hired', {
            employer: this._data.employer,
            position: this._data.position,
            salary: this._data.annualSalary,
            salaryDisplay: this._data.salaryDisplay,
            employeeId: this._data.employeeId
        });

        console.log('\ud83d\udcbc Hired: ' + this._data.position + ' at ' + this._data.employer + ' (' + this._data.salaryDisplay + ')');
        return true;
    }

    /**
     * Terminate employment.
     * @param {string} reason — 'quit', 'fired', 'layoff', etc.
     */
    async terminate(reason) {
        if (this._data.status !== 'employed') return false;

        var finalPay = this.getPayPerPeriod();

        this._data.status = 'terminated';
        this._data.terminatedDate = new Date().toISOString().slice(0, 10);
        this._data.terminationReason = reason || 'unspecified';

        await this._save();

        this.eventBus.emit('employment.terminated', {
            employer: this._data.employer,
            position: this._data.position,
            reason: reason,
            finalPaycheck: finalPay
        });

        console.log('\ud83d\udcbc Employment terminated: ' + reason);
        return true;
    }

    /**
     * Update pay format preference.
     * @param {string} format — 'snakes', 'dollars', or 'mixed'
     */
    async setPayFormat(format) {
        if (!this._data || this._data.status !== 'employed') return false;
        if (['snakes', 'dollars', 'mixed'].indexOf(format) === -1) return false;

        this._data.payFormat = format;
        await this._save();

        console.log('\ud83d\udcbc Pay format updated to: ' + format);
        return true;
    }

    /**
     * Get the current pay format preference.
     * @returns {string} 'snakes', 'dollars', or 'mixed'
     */
    getPayFormat() {
        return (this._data && this._data.payFormat) ? this._data.payFormat : 'snakes';
    }

    /**
     * Format a USD amount according to the current pay format preference.
     * @param {number} usdAmount — dollar amount
     * @returns {string} formatted string
     */
    formatPay(usdAmount) {
        var format = this.getPayFormat();
        var dollarStr = '$' + usdAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        var snakeStr = (usdAmount * 2).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' \ud83d\udc0d';

        if (format === 'dollars') {
            return dollarStr;
        } else if (format === 'mixed') {
            return dollarStr + ' / ' + snakeStr;
        } else {
            // snakes (default)
            return snakeStr;
        }
    }

    /**
     * Transfer to a new position within the same employer.
     * Keeps: employeeId, hireDate, ytdEarnings, payHistory, lastPayday, employer, payFrequency
     * Updates: position, department, annualSalary, salaryDisplay, manager
     * @param {object} transferData
     *   { position, department, annualSalary, salaryDisplay, manager }
     */
    async transfer(transferData) {
        if (!this._data || this._data.status !== 'employed') return false;

        var oldPosition = this._data.position;
        var oldSalary = this._data.annualSalary;

        // Update position-related fields only
        this._data.position = transferData.position;
        this._data.department = transferData.department;
        this._data.annualSalary = transferData.annualSalary;
        this._data.salaryDisplay = transferData.salaryDisplay;
        this._data.manager = transferData.manager || 'Department Manager';
        if (transferData.payFormat) {
            this._data.payFormat = transferData.payFormat;
        }

        await this._save();

        this.eventBus.emit('employment.transferred', {
            employer: this._data.employer,
            oldPosition: oldPosition,
            newPosition: this._data.position,
            oldSalary: oldSalary,
            newSalary: this._data.annualSalary,
            salaryDisplay: this._data.salaryDisplay,
            department: this._data.department,
            employeeId: this._data.employeeId
        });

        console.log('\ud83d\udcbc Transferred: ' + oldPosition + ' \u2192 ' + this._data.position + ' (' + this._data.salaryDisplay + ')');
        return true;
    }

    /**
     * Sync check — is the user currently employed?
     */
    isEmployed() {
        return this._data && this._data.status === 'employed';
    }

    /**
     * Sync getter — returns the full employment data object.
     */
    getEmploymentData() {
        return this._data;
    }

    // =================================
    // PAYROLL
    // =================================

    /**
     * Get pay per period (weekly by default).
     * @returns {number} Dollar amount per paycheck
     */
    getPayPerPeriod() {
        if (!this._data || !this._data.annualSalary) return 0;
        var divisor = this._data.payFrequency === 'biweekly' ? 26 : 52;
        return Math.round((this._data.annualSalary / divisor) * 100) / 100;
    }

    /**
     * Get the date of the next payday.
     * @returns {string|null} ISO date string, or null if not employed
     */
    getNextPayday() {
        if (!this.isEmployed() || !this._data.hireDate) return null;

        var hireDate = new Date(this._data.hireDate);
        var today = new Date();
        var intervalDays = this._data.payFrequency === 'biweekly' ? 14 : 7;

        // Walk paydays forward from hire date until we find one after today
        var payday = new Date(hireDate);
        payday.setDate(payday.getDate() + intervalDays);

        while (payday <= today) {
            payday.setDate(payday.getDate() + intervalDays);
        }

        return payday.toISOString().slice(0, 10);
    }

    /**
     * Get pay history array.
     */
    getPayHistory() {
        return (this._data && this._data.payHistory) ? this._data.payHistory : [];
    }

    /**
     * Get year-to-date earnings.
     */
    getYTDEarnings() {
        return (this._data && this._data.ytdEarnings) ? this._data.ytdEarnings : 0;
    }

    /**
     * Process all missed paychecks since last processed date.
     * Deposits each paycheck via financeService and records history.
     * Called on boot/login and after hire.
     */
    async processPaychecks() {
        if (!this._data || this._data.status !== 'employed') return { processed: 0, totalDeposited: 0 };

        var hireDate = new Date(this._data.hireDate);
        var today = new Date();
        today.setHours(23, 59, 59, 999);

        var intervalDays = this._data.payFrequency === 'biweekly' ? 14 : 7;

        // First payday is one interval after hire
        var payday = new Date(hireDate);
        payday.setDate(payday.getDate() + intervalDays);

        var lastProcessed = this._data.lastPayday
            ? new Date(this._data.lastPayday)
            : null;

        var payPerPeriod = this.getPayPerPeriod();
        var newPayments = 0;
        var totalDeposited = 0;

        while (payday <= today) {
            if (!lastProcessed || payday > lastProcessed) {
                var dateStr = payday.toISOString().slice(0, 10);
                var deposited = this._depositPaycheck(payPerPeriod, dateStr);

                this._data.payHistory.push({
                    date: dateStr,
                    grossPay: payPerPeriod,
                    deposited: deposited,
                    depositAccount: 'checking'
                });

                this._data.ytdEarnings += payPerPeriod;
                this._data.lastPayday = dateStr;
                totalDeposited += payPerPeriod;
                newPayments++;
            }

            payday = new Date(payday);
            payday.setDate(payday.getDate() + intervalDays);
        }

        if (newPayments > 0) {
            this._data.ytdEarnings = Math.round(this._data.ytdEarnings * 100) / 100;
            totalDeposited = Math.round(totalDeposited * 100) / 100;
            await this._save();

            this.eventBus.emit('employment.paychecksProcessed', {
                count: newPayments,
                totalAmount: totalDeposited,
                payPerPeriod: payPerPeriod,
                employer: this._data.employer,
                position: this._data.position
            });

            console.log('\ud83d\udcbc Processed ' + newPayments + ' paycheck(s): $' + totalDeposited.toFixed(2) + ' deposited to checking');
        }

        return { processed: newPayments, totalDeposited: totalDeposited };
    }

    /**
     * Deposit a single paycheck via financeService.
     * Uses _depositDirect() for a sync balance+transaction update
     * without per-paycheck save overhead (we save once after batch).
     *
     * @param {number} amount — dollar amount
     * @param {string} dateStr — ISO date for the pay period
     * @returns {boolean} whether the deposit succeeded
     */
    _depositPaycheck(amount, dateStr) {
        if (typeof elxaOS === 'undefined' || !elxaOS.financeService || !elxaOS.financeService._ready) {
            console.warn('\ud83d\udcbc Finance service not ready \u2014 paycheck deposit skipped');
            return false;
        }

        elxaOS.financeService._depositDirect('checking', amount,
            this._data.employer + ' Payroll \u2014 Direct Deposit (' + dateStr + ')');
        return true;
    }

    // =================================
    // LLM CONTEXT
    // =================================

    /**
     * Plain-English employment summary for LLM context.
     */
    getEmploymentSummary() {
        if (!this._data || this._data.status === 'unemployed') {
            return 'User is currently unemployed. No regular income.';
        }

        if (this._data.status === 'terminated') {
            return 'User was formerly employed at ' + this._data.employer + ' as ' + this._data.position
                + '. Terminated on ' + this._data.terminatedDate + ' (' + this._data.terminationReason + '). No current income.';
        }

        var payPerPeriod = this.getPayPerPeriod();
        var freqLabel = this._data.payFrequency === 'biweekly' ? 'biweekly' : 'weekly';
        var summary = 'Employed at ' + this._data.employer + ' as ' + this._data.position + '. ';
        summary += 'Salary: ' + this._data.salaryDisplay + ' ($' + payPerPeriod.toFixed(2) + '/' + freqLabel + ', deposited to checking). ';
        summary += 'YTD earnings: $' + this.getYTDEarnings().toFixed(2) + '. ';

        var nextPay = this.getNextPayday();
        if (nextPay) {
            summary += 'Next payday: ' + nextPay + '.';
        }

        return summary;
    }

    // =================================
    // LOCALSTORAGE MIGRATION
    // =================================

    /**
     * One-time migration from ElxaCorp localStorage data to registry.
     * Checks elxacorp-user-profiles for hired profiles, and
     * elxacorp-employee-data-{id} for payroll history.
     */
    async _migrateFromLocalStorage() {
        try {
            var profiles = JSON.parse(localStorage.getItem('elxacorp-user-profiles') || '{}');
            var hiredProfile = null;

            // Find the most recent hired profile
            for (var appId in profiles) {
                if (!profiles.hasOwnProperty(appId)) continue;
                var profile = profiles[appId];
                if (profile.status === 'hired') {
                    hiredProfile = profile;
                }
            }

            if (!hiredProfile) return false;

            // Parse salary from display string
            var salaryStr = hiredProfile.position ? hiredProfile.position.salary : null;
            var annualSalary = this._parseSalary(salaryStr);

            // Check for existing employee payroll data
            var empData = null;
            try {
                var empRaw = localStorage.getItem('elxacorp-employee-data-' + hiredProfile.employeeId);
                if (empRaw) empData = JSON.parse(empRaw);
            } catch (e) {
                // ignore parse errors
            }

            // Build employment record
            this._data = {
                status: 'employed',
                employer: 'ElxaCorp',
                employeeId: hiredProfile.employeeId,
                position: hiredProfile.position ? hiredProfile.position.title : 'Team Member',
                department: hiredProfile.position ? hiredProfile.position.department : 'General Operations',
                annualSalary: annualSalary,
                salaryDisplay: salaryStr || ('$' + annualSalary.toLocaleString() + ' per year'),
                hireDate: hiredProfile.position ? hiredProfile.position.startDate : new Date().toISOString().slice(0, 10),
                manager: hiredProfile.position ? hiredProfile.position.manager : 'Department Manager',
                payFrequency: 'weekly',
                payFormat: 'snakes',

                // Migrate payroll data if available
                lastPayday: (empData && empData.payroll) ? empData.payroll.lastPayday : null,
                ytdEarnings: (empData && empData.payroll) ? (empData.payroll.ytdEarnings || 0) : 0,
                payHistory: (empData && empData.payroll) ? (empData.payroll.payHistory || []) : [],

                terminatedDate: null,
                terminationReason: null,

                migrated: true,
                migratedDate: new Date().toISOString()
            };

            await this._save();
            console.log('\u2705 Employment data migrated from localStorage to registry');
            return true;
        } catch (e) {
            console.warn('\ud83d\udcbc Employment migration failed:', e);
            return false;
        }
    }

    /**
     * Parse a salary display string into a numeric USD amount.
     * Handles "$75,000 per year", "150,000 \ud83d\udc0d per year", mixed formats.
     */
    _parseSalary(salaryStr) {
        if (typeof salaryStr === 'number') return salaryStr;
        if (!salaryStr) return 50000;

        // Try USD first: "$75,000"
        var match = String(salaryStr).match(/\$([\d,]+)/);
        if (match) return parseInt(match[1].replace(/,/g, ''), 10);

        // Try snakes: "150,000 \ud83d\udc0d" — divide by 2 for USD
        var snakeMatch = String(salaryStr).match(/([\d,]+)\s*\ud83d\udc0d/u);
        if (snakeMatch) return Math.floor(parseInt(snakeMatch[1].replace(/,/g, ''), 10) / 2);

        return 50000;
    }

    // =================================
    // PERSISTENCE
    // =================================

    async _save() {
        if (!this._data) return;
        await this.registry.setState('employment', this._data);
    }

    clear() {
        this._data = null;
        this._ready = false;
    }
}
