// =========================================================
// EMPLOYEE PORTAL SYSTEM
// =========================================================
var EmployeePortalSystem = class {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.employeeData = null;
        this.init();
    }

    init() {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 60000);
        console.log('Employee Portal initialized');
    }

    async handleLogin() {
        var username = document.getElementById('username').value.trim();
        var password = document.getElementById('password').value;

        if (!username || !password) {
            this.showError('Please enter both username and password.');
            return;
        }
        this.hideMessages();

        try {
            var userProfile = this.findUserByCredentials(username, password);
            if (userProfile) {
                this.currentUser = userProfile;
                this.isLoggedIn = true;
                if (userProfile.credentials && userProfile.credentials.mustChangePassword) {
                    this.showSuccess("Welcome! You'll need to change your password soon.");
                } else {
                    this.showSuccess('Login successful!');
                }
                setTimeout(() => this.showDashboard(), 1200);
            } else {
                this.showError('Invalid username or password.');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Login failed. Please try again.');
        }
    }

    findUserByCredentials(username, password) {
        try {
            var stored = localStorage.getItem('elxacorp-user-profiles');
            if (stored) {
                var profiles = JSON.parse(stored);
                for (var profileId in profiles) {
                    var profile = profiles[profileId];
                    if (profile.credentials &&
                        profile.credentials.username === username &&
                        profile.credentials.temporaryPassword === password) {
                        return profile;
                    }
                }
            }
        } catch (e) {
            console.warn('Error reading profiles from localStorage:', e);
        }

        if (username === 'test.user' && password === 'ElxaCorp123') {
            return {
                employeeId: 'EMP-TU0001',
                personalInfo: { name: 'Test User', age: 25, location: 'snakesia' },
                position: { title: 'IT Specialist', department: 'Information Technology', manager: 'Mr. Snake-E (CEO)', startDate: new Date().toISOString(), salary: '$75,000/yr' },
                credentials: { username: 'test.user', mustChangePassword: false },
                skills: { elxaosExperience: 'advanced', denaliSkills: 'learning', susDetection: 'expert', additionalSkills: 'Portal testing' },
                preferences: { cookieType: 'all', favoriteGame: 'Snake-Man', motivationStatement: 'Testing!' }
            };
        }
        return null;
    }

    showDashboard() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('portalDashboard').style.display = 'block';

        if (this.currentUser) {
            var u = this.currentUser;
            document.getElementById('employeeName').textContent = u.personalInfo.name;
            document.getElementById('employeeId').textContent = u.employeeId;
            document.getElementById('employeePosition').textContent = u.position.title;
            document.getElementById('employeeDepartment').textContent = u.position.department || 'General';

            document.getElementById('profileSalary').textContent = u.position.salary || '\u2014';
            document.getElementById('profileManager').textContent = u.position.manager || 'Dept. Manager';

            if (u.skills) {
                var susLabels = { expert: 'Expert \u{1F575}\u{FE0F}', good: 'Good', average: 'Average', poor: 'Developing', sus: 'Self-Sus \u{1F431}' };
                document.getElementById('profileSusLevel').textContent = susLabels[u.skills.susDetection] || u.skills.susDetection || '\u2014';
            }
            if (u.preferences) {
                var cookieLabels = { 'chocolate-chip': 'Choc Chip \u{1F36A}', oatmeal: 'Oatmeal Raisin', snickerdoodle: 'Snickerdoodle', sugar: 'Sugar Cookie', all: 'All! \u{1F36A}', none: 'Non-cookie' };
                document.getElementById('profileCookie').textContent = cookieLabels[u.preferences.cookieType] || u.preferences.cookieType || '\u2014';
                document.getElementById('profileGame').textContent = u.preferences.favoriteGame || '\u2014';
            }
            if (u.position.startDate) {
                document.getElementById('profileStartDate').textContent = new Date(u.position.startDate).toLocaleDateString();
            }

            // Initialize employee data system
            this.employeeData = new EmployeeDataSystem(
                u.employeeId,
                u.position.salary,
                u.position.startDate
            );

            // Initialize ticket system
            var dept = u.position.department || 'Technology Operations';
            this.ticketSystem = new TicketSystem(this.employeeData, dept);

            // Update position badge with career title
            var careerLevel = this.ticketSystem.getCurrentLevel();
            document.getElementById('employeePosition').textContent = careerLevel.badge + ' ' + careerLevel.title;

            // Populate Priority Tasks card with real active tickets
            this.updatePriorityTasksCard();
        }

        this.updateStats();
    }

    updateStats() {
        if (this.ticketSystem) {
            document.getElementById('tasksCompleted').textContent = this.ticketSystem.data.totalCompleted;
        } else {
            document.getElementById('tasksCompleted').textContent = 0;
        }
        document.getElementById('susIncidents').textContent = Math.floor(Math.random() * 5) + 1 + ' \u{1F431}';
        document.getElementById('denaliMiles').textContent = Math.floor(Math.random() * 50) + 10 + ' \u{1F697}';

        if (this.employeeData) {
            document.getElementById('cookiesEarned').textContent = this.employeeData.getTodayCookies() + ' \u{1F36A}';
            document.getElementById('weeklyPay').textContent = this.employeeData.formatCurrency(this.employeeData.getPayPerPeriod());
            document.getElementById('nextPayday').textContent = this.employeeData.getNextPaydayFormatted();
            document.getElementById('ytdEarnings').textContent = this.employeeData.formatCurrency(this.employeeData.getYTDEarnings());
            document.getElementById('cookieCredits').textContent = this.employeeData.getTotalCookies() + ' \u{1F36A}';

            // Direct deposit status
            this.updateDirectDepositDisplay();
        } else {
            document.getElementById('cookiesEarned').textContent = '0 \u{1F36A}';
            document.getElementById('weeklyPay').textContent = '\u2014';
            document.getElementById('nextPayday').textContent = '\u2014';
            document.getElementById('ytdEarnings').textContent = '$0.00';
            document.getElementById('cookieCredits').textContent = '0 \u{1F36A}';
        }
    }

    updateDirectDepositDisplay() {
        var ddEl = document.getElementById('directDepositStatus');
        if (!ddEl || !this.employeeData) return;

        var bankInfo = this.employeeData.getBankAccountInfo();
        if (bankInfo) {
            ddEl.innerHTML = '<span class="dd-linked"><span class="mdi mdi-check-circle"></span> FSB Linked</span>';
        } else {
            ddEl.innerHTML = '<button class="dd-link-btn" onclick="portalSystem.openBankLink()"><span class="mdi mdi-bank-outline"></span> Link Bank</button>';
        }
    }

    updateDateTime() {
        var now = new Date();
        var snakesiaTime = new Date(now.getTime() + (2 * 60 + 1) * 60000);
        var el = document.getElementById('currentDate');
        if (el) {
            el.textContent = snakesiaTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
                + ' ' + snakesiaTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ST';
        }
    }

    logout() {
        if (this.employeeData) this.employeeData.stopTimerDisplay();
        this.currentUser = null;
        this.isLoggedIn = false;
        this.employeeData = null;
        document.getElementById('portalDashboard').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('loginForm').reset();
        this.hideMessages();
        this.showSuccess('Signed out successfully.');
    }

    // ===== TIME CLOCK UI =====
    openTimeClock() {
        if (!this.employeeData) return;
        this.refreshTimeClockUI();
        document.getElementById('timeClockOverlay').classList.remove('hidden');
    }
    closeTimeClock() { document.getElementById('timeClockOverlay').classList.add('hidden'); }

    toggleClock() {
        if (!this.employeeData) return;
        if (this.employeeData.data.timeClock.clockedIn) {
            this.employeeData.clockOut();
        } else {
            this.employeeData.clockIn();
        }
        this.refreshTimeClockUI();
    }

    refreshTimeClockUI() {
        if (!this.employeeData) return;
        var isClockedIn = this.employeeData.data.timeClock.clockedIn;
        var statusEl = document.getElementById('tcStatus');
        var labelEl = document.getElementById('tcStatusLabel');
        var btnEl = document.getElementById('tcToggleBtn');

        if (isClockedIn) {
            statusEl.className = 'tc-status clocked-in';
            labelEl.textContent = 'Clocked In';
            btnEl.className = 'tc-toggle clock-out';
            btnEl.innerHTML = '<span class="mdi mdi-clock-out"></span> Clock Out';
        } else {
            statusEl.className = 'tc-status clocked-out';
            labelEl.textContent = 'Clocked Out';
            btnEl.className = 'tc-toggle clock-in';
            btnEl.innerHTML = '<span class="mdi mdi-clock-in"></span> Clock In';
            document.getElementById('tcTimer').textContent = '00:00:00';
        }

        var todayMin = this.employeeData.getTodayMinutes();
        document.getElementById('tcTodayTime').textContent = Math.floor(todayMin / 60) + 'h ' + (todayMin % 60) + 'm';
        document.getElementById('tcTodayCookies').textContent = this.employeeData.getTodayCookies() + ' \u{1F36A}';
        document.getElementById('tcTotalCookies').textContent = this.employeeData.getTotalCookies() + ' \u{1F36A}';
    }

    // ===== BANK LINK UI =====
    openBankLink() {
        if (!this.employeeData) return;
        this.refreshBankLinkUI();
        document.getElementById('bankLinkOverlay').classList.remove('hidden');
    }
    closeBankLink() { document.getElementById('bankLinkOverlay').classList.add('hidden'); }

    refreshBankLinkUI() {
        var bankInfo = this.employeeData.getBankAccountInfo();
        var statusBox = document.getElementById('bankLinkStatusBox');
        var labelEl = document.getElementById('bankLinkLabel');
        var nameEl = document.getElementById('bankLinkName');
        var detailEl = document.getElementById('bankLinkDetail');
        var formEl = document.getElementById('bankLinkForm');
        var unlinkEl = document.getElementById('bankUnlinkSection');
        var msgEl = document.getElementById('bankLinkMsg');
        msgEl.style.display = 'none';

        if (bankInfo) {
            statusBox.className = 'bank-link-status linked';
            statusBox.querySelector('.bank-link-icon').innerHTML = '<span class="mdi mdi-bank-check"></span>';
            labelEl.textContent = 'Bank Linked';
            nameEl.textContent = 'First Snakesian Bank';
            detailEl.textContent = 'Account: ' + (bankInfo.checkingNumber || 'Checking') + ' \u2022 ' + bankInfo.name;
            formEl.classList.add('hidden');
            unlinkEl.classList.remove('hidden');
        } else {
            statusBox.className = 'bank-link-status unlinked';
            statusBox.querySelector('.bank-link-icon').innerHTML = '<span class="mdi mdi-bank-off-outline"></span>';
            labelEl.textContent = 'No Bank Linked';
            nameEl.textContent = '';
            detailEl.textContent = 'Link your First Snakesian Bank account to receive your paycheck via direct deposit.';
            formEl.classList.remove('hidden');
            unlinkEl.classList.add('hidden');
        }
    }

    linkBankAccount() {
        var usernameInput = document.getElementById('bankUsername');
        var username = usernameInput.value.trim();
        var msgEl = document.getElementById('bankLinkMsg');

        if (!username) {
            msgEl.className = 'overlay-msg overlay-msg-error';
            msgEl.textContent = 'Please enter your FSB username.';
            msgEl.style.display = 'block';
            return;
        }

        var result = this.employeeData.linkBank(username);

        if (result.success) {
            msgEl.className = 'overlay-msg overlay-msg-success';
            msgEl.textContent = result.message;
            msgEl.style.display = 'block';
            usernameInput.value = '';
            this.refreshBankLinkUI();
            this.updateDirectDepositDisplay();
            // Refresh YTD display in case retro-deposits happened
            document.getElementById('ytdEarnings').textContent = this.employeeData.formatCurrency(this.employeeData.getYTDEarnings());
        } else {
            msgEl.className = 'overlay-msg overlay-msg-error';
            msgEl.textContent = result.message;
            msgEl.style.display = 'block';
        }
    }

    unlinkBankAccount() {
        this.employeeData.unlinkBank();
        this.refreshBankLinkUI();
        this.updateDirectDepositDisplay();
        var msgEl = document.getElementById('bankLinkMsg');
        msgEl.className = 'overlay-msg overlay-msg-success';
        msgEl.textContent = 'Bank account unlinked. Future paychecks will not be deposited.';
        msgEl.style.display = 'block';
    }

    // ===== PASSWORD CHANGE UI =====
    changePassword() {
        if (!this.currentUser) return;
        // Clear fields
        document.getElementById('pwCurrent').value = '';
        document.getElementById('pwNew').value = '';
        document.getElementById('pwConfirm').value = '';
        var msgEl = document.getElementById('pwMsg');
        msgEl.style.display = 'none';

        // Show badge indicating if password change is required
        var badge = document.getElementById('pwBadge');
        if (this.currentUser.credentials && this.currentUser.credentials.mustChangePassword) {
            badge.className = 'pw-current-badge pw-must-change';
            badge.innerHTML = '<span class="mdi mdi-alert"></span> Password change required';
        } else {
            badge.className = 'pw-current-badge pw-optional';
            badge.innerHTML = '<span class="mdi mdi-information-outline"></span> Change your password anytime';
        }

        document.getElementById('passwordOverlay').classList.remove('hidden');
    }

    closePasswordChange() {
        document.getElementById('passwordOverlay').classList.add('hidden');
    }

    submitPasswordChange() {
        var currentPw = document.getElementById('pwCurrent').value;
        var newPw = document.getElementById('pwNew').value;
        var confirmPw = document.getElementById('pwConfirm').value;
        var msgEl = document.getElementById('pwMsg');

        if (!currentPw || !newPw || !confirmPw) {
            msgEl.className = 'overlay-msg overlay-msg-error';
            msgEl.textContent = 'Please fill in all fields.';
            msgEl.style.display = 'block';
            return;
        }

        // Validate current password
        var storedPw = this.currentUser.credentials.temporaryPassword || this.currentUser.credentials.password;
        if (currentPw !== storedPw) {
            msgEl.className = 'overlay-msg overlay-msg-error';
            msgEl.textContent = 'Current password is incorrect.';
            msgEl.style.display = 'block';
            return;
        }

        if (newPw.length < 4) {
            msgEl.className = 'overlay-msg overlay-msg-error';
            msgEl.textContent = 'New password must be at least 4 characters.';
            msgEl.style.display = 'block';
            return;
        }

        if (newPw !== confirmPw) {
            msgEl.className = 'overlay-msg overlay-msg-error';
            msgEl.textContent = 'New passwords do not match.';
            msgEl.style.display = 'block';
            return;
        }

        if (newPw === currentPw) {
            msgEl.className = 'overlay-msg overlay-msg-error';
            msgEl.textContent = 'New password must be different from current password.';
            msgEl.style.display = 'block';
            return;
        }

        // Update password in user profile
        this.currentUser.credentials.password = newPw;
        this.currentUser.credentials.temporaryPassword = newPw;
        this.currentUser.credentials.mustChangePassword = false;

        // Save to elxacorp-user-profiles in localStorage
        try {
            var stored = localStorage.getItem('elxacorp-user-profiles');
            if (stored) {
                var profiles = JSON.parse(stored);
                for (var profileId in profiles) {
                    if (profiles[profileId].employeeId === this.currentUser.employeeId) {
                        profiles[profileId].credentials.password = newPw;
                        profiles[profileId].credentials.temporaryPassword = newPw;
                        profiles[profileId].credentials.mustChangePassword = false;
                        break;
                    }
                }
                localStorage.setItem('elxacorp-user-profiles', JSON.stringify(profiles));
            }
        } catch (e) {
            console.warn('Failed to save password to profiles:', e);
        }

        msgEl.className = 'overlay-msg overlay-msg-success';
        msgEl.textContent = 'Password changed successfully!';
        msgEl.style.display = 'block';

        // Clear fields
        document.getElementById('pwCurrent').value = '';
        document.getElementById('pwNew').value = '';
        document.getElementById('pwConfirm').value = '';

        // Update badge
        var badge = document.getElementById('pwBadge');
        badge.className = 'pw-current-badge pw-optional';
        badge.innerHTML = '<span class="mdi mdi-check-circle"></span> Password updated';

        // Auto-close after 2 seconds
        setTimeout(() => this.closePasswordChange(), 2000);
    }
    // ===== TICKET SYSTEM UI =====
    openTicketSystem() {
        if (!this.ticketSystem) return;
        this.renderCareerBar();
        this.renderTicketList();
        this.renderTicketFooter();
        document.getElementById('ticketOverlay').classList.remove('hidden');
    }

    closeTickets() {
        document.getElementById('ticketOverlay').classList.add('hidden');
    }

    renderCareerBar() {
        var ts = this.ticketSystem;
        var current = ts.getCurrentLevel();
        var next = ts.getNextLevel();
        var pct = ts.getProgressPercent();

        var progressLabel = next
            ? ts.data.totalCompleted + '/' + next.ticketsNeeded + ' tickets'
            : 'MAX LEVEL';

        document.getElementById('careerBar').innerHTML =
            '<div class="career-badge">' + current.badge + '</div>' +
            '<div class="career-info">' +
                '<div class="career-title">' + current.title + ' — Level ' + current.level + '</div>' +
                '<div class="career-progress-row">' +
                    '<div class="career-progress-track">' +
                        '<div class="career-progress-fill" style="width:' + pct + '%"></div>' +
                    '</div>' +
                    '<span class="career-progress-label">' + progressLabel + '</span>' +
                '</div>' +
            '</div>';
    }

    renderTicketList() {
        var ts = this.ticketSystem;
        var tickets = ts.data.activeTickets || [];
        var container = document.getElementById('ticketContent');

        if (tickets.length === 0) {
            container.innerHTML =
                '<div class="ticket-empty">' +
                    '<span class="mdi mdi-check-decagram"></span>' +
                    'All caught up! No active tickets.' +
                    '<br><br>Hit <b>New Tickets</b> below to get more work.' +
                '</div>';
            return;
        }

        var cookieMap = { high: '3 🍪', medium: '2 🍪', low: '1 🍪' };
        var html = '<div class="ticket-list">';
        for (var i = 0; i < tickets.length; i++) {
            var t = tickets[i];
            html +=
                '<div class="ticket-item" onclick="portalSystem.openTicketDetail(\'' + t.id + '\')">' +
                    '<div class="ticket-item-header">' +
                        '<span class="ticket-item-title">' + t.title + '</span>' +
                        '<span class="ticket-priority tp-' + t.priority + '">' + t.priority + '</span>' +
                    '</div>' +
                    '<div class="ticket-item-meta">From: ' + t.submitter + '</div>' +
                    '<div class="ticket-cookie-hint">Reward: ' + cookieMap[t.priority] + '</div>' +
                '</div>';
        }
        html += '</div>';
        container.innerHTML = html;
    }

    renderTicketFooter() {
        var ts = this.ticketSystem;
        document.getElementById('ticketFooter').innerHTML =
            '<span class="ticket-footer-stat">Completed: <strong>' + ts.data.totalCompleted + '</strong> &bull; Cookies earned: <strong>' + ts.data.cookiesFromTickets + ' 🍪</strong></span>' +
            '<button class="ticket-refresh-btn" onclick="portalSystem.refreshTickets()" id="ticketRefreshBtn"><span class="mdi mdi-refresh"></span> New Tickets</button>';
    }

    openTicketDetail(ticketId) {
        var ts = this.ticketSystem;
        var ticket = ts.data.activeTickets.find(function(t) { return t.id === ticketId; });
        if (!ticket) return;
        ts.currentTicket = ticket;

        var approaches = ticket.approaches || ['Handle it', 'Escalate', 'Investigate', 'Defer'];
        var optionsHtml = '<option value="" disabled selected>Choose your approach...</option>';
        for (var i = 0; i < approaches.length; i++) {
            optionsHtml += '<option value="' + approaches[i].replace(/"/g, '&quot;') + '">' + approaches[i] + '</option>';
        }

        var cookieMap = { high: '3 🍪', medium: '2 🍪', low: '1 🍪' };

        document.getElementById('ticketContent').innerHTML =
            '<div class="ticket-detail">' +
                '<button class="ticket-detail-back" onclick="portalSystem.renderTicketList()"><span class="mdi mdi-arrow-left"></span> Back to tickets</button>' +
                '<div class="ticket-detail-title">' + ticket.title + '</div>' +
                '<div class="ticket-detail-submitter">' +
                    '<span class="ticket-priority tp-' + ticket.priority + '" style="margin-right:6px">' + ticket.priority + '</span>' +
                    'Submitted by ' + ticket.submitter + ' &bull; Reward: ' + cookieMap[ticket.priority] +
                '</div>' +
                '<div class="ticket-detail-desc">' + ticket.description + '</div>' +
                '<div class="ticket-field-label">Your Approach</div>' +
                '<select class="ticket-select" id="ticketApproach">' + optionsHtml + '</select>' +
                '<div class="ticket-field-label">Notes (optional)</div>' +
                '<textarea class="ticket-notes" id="ticketNotes" placeholder="Add any notes, observations, or witty commentary..."></textarea>' +
                '<button class="ticket-submit-btn" id="ticketSubmitBtn" onclick="portalSystem.submitTicketResolution()"><span class="mdi mdi-check-bold"></span> Resolve Ticket</button>' +
            '</div>';
    }

    async submitTicketResolution() {
        var ts = this.ticketSystem;
        var ticket = ts.currentTicket;
        if (!ticket) return;

        var approachEl = document.getElementById('ticketApproach');
        var notesEl = document.getElementById('ticketNotes');
        var approach = approachEl.value;
        var notes = notesEl.value.trim();

        if (!approach) {
            approachEl.style.borderColor = 'var(--ec-danger)';
            approachEl.focus();
            return;
        }

        // Disable button while processing
        var btn = document.getElementById('ticketSubmitBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="mdi mdi-loading mdi-spin"></span> Resolving...';

        // Complete the ticket
        var result = ts.completeTicket(ticket.id, approach, notes);
        if (!result) { btn.disabled = false; return; }

        // Try LLM response, fall back to canned
        var responseMsg = await ts.generateLLMCompletionResponse(result.ticket, approach, notes);
        if (!responseMsg) responseMsg = ts.getCannedCompletion();

        // Show completion screen
        document.getElementById('ticketContent').innerHTML =
            '<div class="ticket-completion">' +
                '<div class="ticket-completion-icon">✅</div>' +
                '<div class="ticket-completion-title">Ticket Resolved!</div>' +
                '<div class="ticket-completion-reward">+' + result.cookieReward + ' 🍪 earned</div>' +
                '<div class="ticket-completion-msg">' + responseMsg + '</div>' +
                '<button class="ticket-completion-btn" onclick="portalSystem.returnToTicketList()">Continue</button>' +
            '</div>';

        // Update footer stats
        this.renderTicketFooter();
        this.renderCareerBar();

        // Update dashboard stats
        this.updateStats();
        if (this.employeeData) {
            document.getElementById('cookieCredits').textContent = this.employeeData.getTotalCookies() + ' \u{1F36A}';
        }

        // If no more active tickets, auto-draw
        if (ts.data.activeTickets.length === 0) {
            ts.drawNewTickets();
        }

        // Update Priority Tasks card
        this.updatePriorityTasksCard();

        // Show promotion toast if promoted
        if (result.promoted && result.newLevel) {
            this.showPromotionToast(result.newLevel);
        }
    }

    returnToTicketList() {
        this.renderTicketList();
        this.renderCareerBar();
        this.renderTicketFooter();
    }

    async refreshTickets() {
        var ts = this.ticketSystem;
        var btn = document.getElementById('ticketRefreshBtn');
        btn.classList.add('spinning');
        btn.disabled = true;

        // Try to generate one LLM ticket to add variety
        var llmTicket = await ts.generateLLMTicket();

        ts.drawNewTickets();

        // If we got an LLM ticket, inject it into the active list
        if (llmTicket) {
            ts.data.activeTickets.push({
                ...llmTicket,
                id: 'TK-LLM-' + Date.now(),
                assignedAt: new Date().toISOString(),
                isLLMGenerated: true
            });
            ts.save();
        }

        // Brief delay for visual feedback
        setTimeout(() => {
            btn.classList.remove('spinning');
            btn.disabled = false;
            this.renderTicketList();
            this.renderTicketFooter();
            this.updatePriorityTasksCard();
        }, 600);
    }

    updatePriorityTasksCard() {
        var container = document.getElementById('tasksContainer');
        if (!container || !this.ticketSystem) return;

        var tickets = this.ticketSystem.data.activeTickets || [];
        if (tickets.length === 0) {
            container.innerHTML =
                '<div style="text-align:center;color:var(--ec-text-dim);font-size:13px;padding:12px;">' +
                    '<span class="mdi mdi-check-decagram" style="font-size:20px;display:block;margin-bottom:4px;"></span>' +
                    'All clear! Open Tickets to get new tasks.' +
                '</div>';
            return;
        }

        var priorityClassMap = { high: 'ticket-critical', medium: 'ticket-high', low: 'ticket-sus' };
        var priorityLabelMap = { high: 'Urgent', medium: 'High Priority', low: 'Normal' };
        var html = '';
        for (var i = 0; i < Math.min(tickets.length, 3); i++) {
            var t = tickets[i];
            var cls = priorityClassMap[t.priority] || 'ticket-sus';
            html +=
                '<div class="ticket ' + cls + '" style="cursor:pointer" onclick="portalSystem.openTicketSystem()">' +
                    '<div class="ticket-title">' + (t.priority === 'high' ? '<span class="mdi mdi-alert"></span> ' : '') + t.title + '</div>' +
                    '<div class="ticket-meta">From ' + t.submitter + ' &bull; ' + priorityLabelMap[t.priority] + '</div>' +
                '</div>';
        }
        container.innerHTML = html;
    }

    showPromotionToast(newLevel) {
        // Remove existing toast if any
        var existing = document.querySelector('.promo-toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.className = 'promo-toast';
        toast.innerHTML =
            '<div class="promo-toast-icon">🎉</div>' +
            '<div class="promo-toast-title">PROMOTION!</div>' +
            '<div class="promo-toast-detail">' +
                'You are now <strong>' + newLevel.badge + ' ' + newLevel.title + '</strong> (Level ' + newLevel.level + ')' +
                '<br>Salary multiplier: ' + newLevel.salaryMultiplier + 'x' +
            '</div>';
        document.body.appendChild(toast);

        // Update dashboard position badge
        document.getElementById('employeePosition').textContent = newLevel.badge + ' ' + newLevel.title;

        // Auto-remove after 4 seconds
        setTimeout(function() {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.5s ease';
            setTimeout(function() { toast.remove(); }, 500);
        }, 4000);
    }
    openDirectory() { document.getElementById("directoryOverlay").classList.remove("hidden"); }
    closeDirectory() { document.getElementById("directoryOverlay").classList.add("hidden"); }
    openBenefits() { document.getElementById("benefitsOverlay").classList.remove("hidden"); }
    closeBenefits() { document.getElementById("benefitsOverlay").classList.add("hidden"); }
    openTraining() { document.getElementById("trainingOverlay").classList.remove("hidden"); }
    closeTraining() { document.getElementById("trainingOverlay").classList.add("hidden"); }
    openGameRoom() { alert('\u{1F3AE} Game Room:\n\n\u2022 Arcade machines\n\u2022 Minecraft server: play.elxacorp.ex\n\u2022 Break time gaming encouraged!\n\nBasement level, next to Remi\'s office'); }

    showError(msg) {
        var el = document.getElementById('loginError');
        el.textContent = msg; el.style.display = 'block';
        setTimeout(function() { el.style.display = 'none'; }, 5000);
    }
    showSuccess(msg) {
        var el = document.getElementById('loginSuccess');
        el.textContent = msg; el.style.display = 'block';
        setTimeout(function() { el.style.display = 'none'; }, 3000);
    }
    hideMessages() {
        document.getElementById('loginError').style.display = 'none';
        document.getElementById('loginSuccess').style.display = 'none';
    }
};

var portalSystem = new EmployeePortalSystem();
window.portalSystem = portalSystem;
console.log('Employee Portal loaded');