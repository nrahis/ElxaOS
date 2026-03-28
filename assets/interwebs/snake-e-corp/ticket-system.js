// =========================================================
// TICKET SYSTEM CLASS
// =========================================================
var TicketSystem = class {
    constructor(employeeData, department) {
        this.employeeData = employeeData;
        this.department = department;
        this.pool = TICKET_POOLS[department] || TICKET_POOLS['Technology Operations'];
        this.ladder = CAREER_LADDER[department] || CAREER_LADDER['Technology Operations'];
        this.currentTicket = null; // the one open in detail view

        // Ensure active tickets exist
        if (!this.employeeData.data.tickets.activeTickets || this.employeeData.data.tickets.activeTickets.length === 0) {
            this.drawNewTickets();
        }
    }

    get data() { return this.employeeData.data.tickets; }

    save() { this.employeeData.save(); }

    // ===== CAREER =====
    getCurrentLevel() {
        var completed = this.data.totalCompleted;
        var current = this.ladder[0];
        for (var i = 0; i < this.ladder.length; i++) {
            if (completed >= this.ladder[i].ticketsNeeded) current = this.ladder[i];
        }
        return current;
    }

    getNextLevel() {
        var current = this.getCurrentLevel();
        for (var i = 0; i < this.ladder.length; i++) {
            if (this.ladder[i].level > current.level) return this.ladder[i];
        }
        return null; // max level
    }

    getProgressPercent() {
        var current = this.getCurrentLevel();
        var next = this.getNextLevel();
        if (!next) return 100;
        var rangeStart = current.ticketsNeeded;
        var rangeEnd = next.ticketsNeeded;
        var progress = this.data.totalCompleted - rangeStart;
        return Math.min(100, Math.round((progress / (rangeEnd - rangeStart)) * 100));
    }

    // ===== TICKET DRAWING =====
    drawNewTickets() {
        var pool = this.pool.slice();
        var completedIds = this.data.completedIds || [];
        // filter out recently completed (keep variety)
        var available = pool.filter((_, i) => !completedIds.includes(this.department + '-' + i));
        // if pool is exhausted, reset
        if (available.length < 3) {
            this.data.completedIds = [];
            available = pool.slice();
        }
        // shuffle and pick 3-4
        for (var i = available.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = available[i]; available[i] = available[j]; available[j] = tmp;
        }
        var count = Math.min(available.length, Math.random() < 0.5 ? 3 : 4);
        this.data.activeTickets = available.slice(0, count).map((t, idx) => ({
            ...t,
            id: 'TK-' + Date.now() + '-' + idx,
            assignedAt: new Date().toISOString()
        }));
        this.save();
    }

    // ===== TICKET COMPLETION =====
    completeTicket(ticketId, approach, notes) {
        var ticket = this.data.activeTickets.find(t => t.id === ticketId);
        if (!ticket) return null;

        // Reward cookies based on priority
        var cookieReward = ticket.priority === 'high' ? 3 : ticket.priority === 'medium' ? 2 : 1;
        this.data.totalCompleted++;
        this.data.cookiesFromTickets += cookieReward;
        this.employeeData.data.timeClock.totalCookiesEarned += cookieReward;

        // Track completed pool index for variety
        var poolIdx = this.pool.findIndex(p => p.title === ticket.title);
        if (poolIdx >= 0) {
            if (!this.data.completedIds) this.data.completedIds = [];
            this.data.completedIds.push(this.department + '-' + poolIdx);
        }

        // Remove from active
        this.data.activeTickets = this.data.activeTickets.filter(t => t.id !== ticketId);

        // Check promotion
        var oldLevel = this.data.careerLevel;
        var newLevelObj = this.getCurrentLevel();
        var promoted = newLevelObj.level > oldLevel;
        if (promoted) {
            this.data.careerLevel = newLevelObj.level;
            // Update salary in payroll
            this.employeeData.annualSalary = Math.round(this.employeeData.parseSalary(this.employeeData.annualSalary) * newLevelObj.salaryMultiplier / this.getMultiplierForLevel(oldLevel));
        }

        this.save();
        this.employeeData.updateDashboardStats();

        return {
            ticket: ticket,
            cookieReward: cookieReward,
            approach: approach,
            notes: notes,
            promoted: promoted,
            newLevel: promoted ? newLevelObj : null
        };
    }

    getMultiplierForLevel(level) {
        var entry = this.ladder.find(l => l.level === level);
        return entry ? entry.salaryMultiplier : 1.0;
    }

    // ===== LLM TICKET GENERATION =====
    async generateLLMTicket() {
        if (typeof window.elxaLLM === 'undefined' || !window.elxaLLM.isAvailable()) return null;

        var prompt = 'You are generating a fun work ticket for a fictional company called ElxaCorp. The employee works in the "' + this.department + '" department. ElxaCorp is run by Mr. Snake-E (CEO, loves his GMC Denali) and Mrs. Snake-E (CIO, famous for her cookies and garden). Other characters: Remi Marway (gaming division head, YouTuber), Rita Martinez (HR/customer relations), and Pushing Cat (a suspicious cat that lurks around the office).\n\nGenerate ONE ticket as JSON with these fields:\n- title: short problem title (under 60 chars)\n- description: 2-3 sentence fun description of the problem\n- submitter: who reported it (a character name or department)\n- priority: "high", "medium", or "low"\n- approaches: array of exactly 4 possible ways to handle it\n\nRespond with ONLY the JSON object, no other text.';

        try {
            var response = await window.elxaLLM.generateContent(prompt, { maxTokens: 300, temperature: 0.9 });
            if (!response) return null;
            var cleaned = response.replace(/```json|```/g, '').trim();
            var ticket = JSON.parse(cleaned);
            if (ticket.title && ticket.description && ticket.approaches && ticket.approaches.length >= 2) {
                return ticket;
            }
        } catch (e) {
            console.warn('LLM ticket generation failed:', e);
        }
        return null;
    }

    async generateLLMCompletionResponse(ticket, approach, notes) {
        if (typeof window.elxaLLM === 'undefined' || !window.elxaLLM.isAvailable()) return null;

        var prompt = 'You are writing a short, funny response for completing a work ticket at ElxaCorp (a fictional company). The employee just resolved this ticket:\n\nTicket: "' + ticket.title + '"\nProblem: ' + ticket.description + '\nApproach chosen: ' + approach + '\n' + (notes ? 'Employee notes: ' + notes + '\n' : '') + '\nWrite a 2-3 sentence humorous acknowledgment of their work. Keep it lighthearted and corporate-silly. Reference ElxaCorp characters if relevant (Mr. Snake-E the CEO, Mrs. Snake-E the cookie-baking CIO, Remi Marway the gaming YouTuber, Pushing Cat the suspicious office cat). Respond with ONLY the message text.';

        try {
            var response = await window.elxaLLM.generateContent(prompt, { maxTokens: 150, temperature: 0.9 });
            if (response && response.length > 20) return response.trim();
        } catch (e) {
            console.warn('LLM completion response failed:', e);
        }
        return null;
    }

    getCannedCompletion() {
        return CANNED_COMPLETIONS[Math.floor(Math.random() * CANNED_COMPLETIONS.length)];
    }
};