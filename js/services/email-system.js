// =================================
// ELXAMAIL SYSTEM - Enhanced Email Service for ElxaOS with LLM Integration
// Handles email functionality with AI character integration and story progression
// =================================

class ElxaMailSystem {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.currentFolder = 'inbox';
        this.selectedEmails = new Set();
        this.emails = {
            inbox: [],
            sent: [],
            drafts: [],
            trash: []
        };
        this.contextMenuEmail = null;
        this.composeMode = false;
        this.currentViewedEmail = null; // Replaces JSON.stringify in onclick

        // Data loaded from JSON files
        this.contacts = [];
        this.spamTemplates = [];
        this.characterResponses = {};
        this.defaultResponse = '';
        this.corporateMessages = {};
        this.corporateVariables = {};
        this.corporateScheduling = {};

        // LLM Integration
        this.llmService = null;
        this.conversationManager = null;

        // Timer tracking for cleanup
        this._timerIds = [];
        this._initialized = false;

        this.loadSettings();
    }

    // ===== INITIALIZATION =====

    async init() {
        // Guard against double init
        if (this._initialized) {
            console.log('⚠️ ElxaMail already initialized, skipping');
            return;
        }
        this._initialized = true;

        console.log('🔄 Initializing ElxaMail system...');

        // Load data from JSON files first
        await this.loadAllData();

        // Initialize conversation history manager
        this.initializeConversationHistory();

        // Initialize LLM service after email system is ready
        this.initializeLLMService();

        // Build dynamic UI elements
        this.buildContextMenu();

        // Set up event delegation (replaces all inline onclick)
        this.setupEventListeners();

        // Try to restore session if user was logged in
        this.loadUserSession();

        // Show appropriate section
        if (this.isLoggedIn) {
            this.showEmailInterface();
            this.processQueuedExternalEmails();
        } else {
            this.showWelcome();
        }

        // Set up spam generation and corporate messages
        this.scheduleSpamGeneration();
        this.scheduleCorporateMessages();

        // Register cleanup for when browser navigates away
        this.registerBrowserCleanup();

        console.log('✅ ElxaMail system initialized successfully');
    }

    // ===== CLEANUP =====

    registerBrowserCleanup() {
        // The browser's executePageScripts() creates a cleanup array
        if (!window.browserPageCleanup) {
            window.browserPageCleanup = [];
        }
        window.browserPageCleanup.push(() => this.destroy());
    }

    destroy() {
        console.log('🧹 ElxaMail: cleaning up...');

        // Clear all scheduled timers
        this._timerIds.forEach(id => clearTimeout(id));
        this._timerIds = [];

        this._initialized = false;
        console.log('✅ ElxaMail cleanup complete');
    }

    // Track a timer so we can clean it up later
    _trackTimer(id) {
        this._timerIds.push(id);
        return id;
    }

    initializeConversationHistory() {
        try {
            if (typeof conversationHistoryManager !== 'undefined') {
                this.conversationManager = conversationHistoryManager;
                console.log('✅ Conversation history manager connected to email system');
            } else {
                console.log('⚠️ Conversation history manager not available');
                this.conversationManager = null;
            }
        } catch (error) {
            console.error('❌ Failed to initialize conversation history:', error);
            this.conversationManager = null;
        }
    }

    initializeLLMService() {
        try {
            if (typeof EmailLLMService === 'undefined') {
                console.log('⚠️ EmailLLMService class not available, using fallback responses');
                this.llmService = null;
                return;
            }
            this.llmService = new EmailLLMService(this);
            const status = this.llmService.getStatus();
            console.log('✅ LLM service initialized:', status);
        } catch (error) {
            console.error('❌ Failed to initialize LLM service:', error);
            this.llmService = null;
        }
    }

    // ===== DATA LOADING METHODS =====

    async loadCharacters() {
        try {
            const response = await fetch('./data/world-context.json');
            if (!response.ok) throw new Error(`Failed to load world context: ${response.status}`);
            const worldData = await response.json();

            this.contacts = [];
            const characters = worldData.keyCharacters || {};

            Object.keys(characters).forEach(characterId => {
                const char = characters[characterId];
                this.contacts.push({
                    id: characterId,
                    name: char.fullName || char.name || characterId,
                    email: char.email || `${characterId}@snakesia.ex`,
                    title: char.role || 'Snakesia Resident',
                    description: char.details || char.personality || 'A friendly resident of Snakesia.',
                    personality: char.personality || 'Friendly and helpful.',
                    autoReply: char.autoReply !== false,
                    canSendProactiveEmails: char.canSendProactiveEmails || false
                });
            });

            console.log(`✅ Loaded ${this.contacts.length} characters from world context`);
        } catch (error) {
            console.error('❌ Failed to load characters from world context:', error);
            this.contacts = [
                {
                    id: 'elxacorp_hr',
                    name: 'ElxaCorp HR',
                    email: 'hr@elxacorp.ex',
                    title: 'Human Resources Department',
                    description: 'Professional HR department.',
                    personality: 'Professional, corporate, helpful.',
                    autoReply: true
                }
            ];
        }
    }

    async loadSpamTemplates() {
        try {
            const response = await fetch('./assets/interwebs/exmail/spam-messages.json');
            if (!response.ok) throw new Error(`Failed to load spam templates: ${response.status}`);
            const data = await response.json();
            this.spamTemplates = data.spamTemplates || [];
            console.log(`✅ Loaded ${this.spamTemplates.length} spam templates`);
        } catch (error) {
            console.error('❌ Failed to load spam templates:', error);
            this.spamTemplates = [{
                from: 'spam@example.ex',
                fromName: 'Generic Spam',
                subject: 'Generic Spam Message',
                body: 'This is a generic spam message because the templates failed to load.'
            }];
        }
    }

    async loadCharacterResponses() {
        try {
            const response = await fetch('./assets/interwebs/exmail/character-responses.json');
            if (!response.ok) throw new Error(`Failed to load character responses: ${response.status}`);
            const data = await response.json();
            this.characterResponses = data.responses || {};
            this.defaultResponse = data.defaultResponse || 'Thank you for your message. We will respond soon.';
            console.log(`✅ Loaded responses for ${Object.keys(this.characterResponses).length} characters`);
        } catch (error) {
            console.error('❌ Failed to load character responses:', error);
            this.characterResponses = {};
            this.defaultResponse = 'Thank you for your message. We will respond soon.';
        }
    }

    async loadCorporateMessages() {
        try {
            const response = await fetch('./assets/interwebs/exmail/corporate-messages.json');
            if (!response.ok) throw new Error(`Failed to load corporate messages: ${response.status}`);
            const data = await response.json();
            this.corporateMessages = data.corporateMessages || {};
            this.corporateVariables = data.variables || {};
            this.corporateScheduling = data.scheduling || {};
            console.log(`✅ Loaded corporate messages for ${Object.keys(this.corporateMessages).length} departments`);
        } catch (error) {
            console.error('❌ Failed to load corporate messages:', error);
            this.corporateMessages = {};
            this.corporateVariables = {};
            this.corporateScheduling = {};
        }
    }

    async loadAllData() {
        await Promise.all([
            this.loadCharacters(),
            this.loadSpamTemplates(),
            this.loadCharacterResponses(),
            this.loadCorporateMessages()
        ]);
    }

    // ===== CORPORATE MESSAGE TEMPLATING SYSTEM =====

    replacePlaceholders(template, variables) {
        let result = template;
        const placeholderRegex = /\{\{([^}]+)\}\}/g;
        const matches = template.match(placeholderRegex);
        if (!matches) return result;

        matches.forEach(match => {
            const variableName = match.replace(/[{}]/g, '');
            const variableValues = variables[variableName];

            if (variableValues && Array.isArray(variableValues) && variableValues.length > 0) {
                const randomValue = variableValues[Math.floor(Math.random() * variableValues.length)];
                result = result.replace(new RegExp(match.replace(/[{}]/g, '\\{\\}'), 'g'), randomValue);
            } else {
                result = result.replace(new RegExp(match.replace(/[{}]/g, '\\{\\}'), 'g'), `[${variableName}]`);
            }
        });

        return result;
    }

    generateCorporateEmail(departmentId) {
        const templates = this.corporateMessages[departmentId];
        if (!templates || templates.length === 0) return null;

        const template = templates[Math.floor(Math.random() * templates.length)];
        const subject = this.replacePlaceholders(template.subject, this.corporateVariables);
        const body = this.replacePlaceholders(template.body, this.corporateVariables);

        return {
            id: Date.now() + Math.random(),
            from: template.from,
            fromName: template.fromName,
            to: this.currentUser.email,
            subject: subject,
            body: body,
            date: new Date().toISOString(),
            read: false,
            isCorporate: true,
            category: template.category,
            department: departmentId
        };
    }

    // ===== CORPORATE MESSAGE SCHEDULING =====

    scheduleCorporateMessages() {
        if (!this.isLoggedIn) return;
        Object.keys(this.corporateMessages).forEach(departmentId => {
            this.scheduleDepartmentMessage(departmentId);
        });
    }

    scheduleDepartmentMessage(departmentId) {
        const scheduling = this.corporateScheduling[departmentId];
        const minDays = scheduling?.min_days || 7;
        const maxDays = scheduling?.max_days || 14;
        const weight = scheduling?.weight || 0.2;

        const minDelay = minDays * 24 * 60 * 60 * 1000;
        const maxDelay = maxDays * 24 * 60 * 60 * 1000;
        const delay = Math.random() * (maxDelay - minDelay) + minDelay;

        const timerId = setTimeout(() => {
            if (this.isLoggedIn && Math.random() < weight) {
                this.sendCorporateMessage(departmentId);
            }
            this.scheduleDepartmentMessage(departmentId);
        }, delay);

        this._trackTimer(timerId);
    }

    sendCorporateMessage(departmentId) {
        const corporateEmail = this.generateCorporateEmail(departmentId);
        if (!corporateEmail) return;

        this.emails.inbox.unshift(corporateEmail);
        this.saveCurrentUser();

        if (this.currentFolder === 'inbox') {
            this.updateEmailList();
        }

        this.showSuccess(`New corporate message from ${corporateEmail.fromName}!`);
    }

    // ===== UI BUILDING =====

    buildSidebar() {
        const sidebar = document.getElementById('elxamailSidebar');
        if (!sidebar) return;

        const icon = (name) => typeof ElxaIcons !== 'undefined' ? ElxaIcons.renderAction(name) : '';

        sidebar.innerHTML = `
            <div class="elxamail-sidebar-compose">
                <button class="elxamail-btn elxamail-btn-primary" data-action="compose">
                    ${icon('email-send')} Compose
                </button>
            </div>

            <div class="elxamail-sidebar-section-label">FOLDERS</div>
            <a href="javascript:void(0)" class="elxamail-folder active" data-folder="inbox">
                <span class="elxamail-folder-icon">${icon('inbox')}</span>Inbox (<span id="inboxCount">0</span>)
            </a>
            <a href="javascript:void(0)" class="elxamail-folder" data-folder="sent">
                <span class="elxamail-folder-icon">${icon('send')}</span>Sent
            </a>
            <a href="javascript:void(0)" class="elxamail-folder" data-folder="drafts">
                <span class="elxamail-folder-icon">${icon('drafts')}</span>Drafts
            </a>
            <a href="javascript:void(0)" class="elxamail-folder" data-folder="trash">
                <span class="elxamail-folder-icon">${icon('delete')}</span>Trash
            </a>

            <div class="elxamail-sidebar-section-label" style="margin-top: 20px;">CONTACTS</div>
            <div id="contactsList"></div>
        `;
    }

    buildToolbar() {
        const toolbar = document.getElementById('elxamailToolbar');
        if (!toolbar) return;

        const icon = (name) => typeof ElxaIcons !== 'undefined' ? ElxaIcons.renderAction(name) : '';

        toolbar.innerHTML = `
            <button class="elxamail-btn" data-action="refresh">${icon('refresh')} Refresh</button>
            <button class="elxamail-btn" data-action="delete-selected">${icon('delete')} Delete</button>
            <button class="elxamail-btn" data-action="mark-read">${icon('email-open')} Mark Read</button>
            <button class="elxamail-btn" data-action="mark-unread">${icon('email')} Mark Unread</button>
            <span class="elxamail-toolbar-status" id="emailStatus">Loading...</span>
        `;
    }

    buildBulkActions() {
        const bulkActions = document.getElementById('elxamailBulkActions');
        if (!bulkActions) return;

        const icon = (name) => typeof ElxaIcons !== 'undefined' ? ElxaIcons.renderAction(name) : '';

        bulkActions.innerHTML = `
            <label class="elxamail-bulk-select">
                <input type="checkbox" id="selectAllEmails">
                Select All
            </label>
            <button class="elxamail-btn" data-action="bulk-mark-read">${icon('email-open')} Mark Read</button>
            <button class="elxamail-btn" data-action="bulk-mark-unread">${icon('email')} Mark Unread</button>
            <button class="elxamail-btn" data-action="bulk-delete" id="bulkDeleteBtn">${icon('delete')} Delete</button>
            <button class="elxamail-btn elxamail-btn-danger hidden" data-action="bulk-delete-permanent" id="bulkDeletePermanentBtn">${icon('skull-crossbones')} Delete Forever</button>
        `;
    }

    buildComposeWindow() {
        const compose = document.getElementById('composeWindow');
        if (!compose) return;

        const icon = (name) => typeof ElxaIcons !== 'undefined' ? ElxaIcons.renderAction(name) : '';

        compose.innerHTML = `
            <div class="elxamail-compose-header">Compose New Message</div>

            <div class="elxamail-compose-field">
                <label>To:</label>
                <input type="text" id="composeTo" placeholder="recipient@elxamail.ex">
            </div>

            <div class="elxamail-compose-field">
                <label>Subject:</label>
                <input type="text" id="composeSubject" placeholder="Enter subject">
            </div>

            <textarea id="composeBody" class="elxamail-compose-body"
                      placeholder="Type your message here..."></textarea>

            <div class="elxamail-compose-actions">
                <button class="elxamail-btn elxamail-btn-primary" data-action="send-email">
                    ${icon('send')} Send
                </button>
                <button class="elxamail-btn" data-action="save-draft">
                    ${icon('content-save')} Save Draft
                </button>
                <button class="elxamail-btn" data-action="cancel-compose">
                    ${icon('close')} Cancel
                </button>
            </div>
        `;
    }

    buildContextMenu() {
        const menu = document.getElementById('emailContextMenu');
        if (!menu) return;

        const icon = (name) => typeof ElxaIcons !== 'undefined' ? ElxaIcons.renderAction(name) : '';

        menu.innerHTML = `
            <div class="elxamail-context-item" data-context="reply">${icon('reply')} Reply</div>
            <div class="elxamail-context-item" data-context="forward">${icon('forward-email')} Forward</div>
            <div class="elxamail-context-separator"></div>
            <div class="elxamail-context-item" data-context="markRead" id="ctxMarkRead">${icon('email-open')} Mark as Read</div>
            <div class="elxamail-context-item" data-context="markUnread" id="ctxMarkUnread">${icon('email')} Mark as Unread</div>
            <div class="elxamail-context-separator"></div>
            <div class="elxamail-context-item" data-context="moveToTrash" id="ctxMoveToTrash">${icon('delete')} Move to Trash</div>
            <div class="elxamail-context-item elxamail-context-danger" data-context="delete" id="ctxDelete">${icon('skull-crossbones')} Delete Permanently</div>
        `;
    }

    // ===== EVENT DELEGATION =====

    setupEventListeners() {
        const root = document.querySelector('.elxamail-website-root');
        if (!root) return;

        // Main click delegation
        root.addEventListener('click', (e) => {
            const target = e.target;

            // Nav bar links
            const navLink = target.closest('[data-nav]');
            if (navLink) {
                e.preventDefault();
                this.handleNavAction(navLink.dataset.nav);
                return;
            }

            // Action buttons
            const actionBtn = target.closest('[data-action]');
            if (actionBtn) {
                e.preventDefault();
                this.handleAction(actionBtn.dataset.action);
                return;
            }

            // Folder links
            const folder = target.closest('[data-folder]');
            if (folder) {
                e.preventDefault();
                this.selectFolder(folder.dataset.folder);
                return;
            }

            // Email items (but not checkboxes)
            const emailItem = target.closest('.elxamail-email-item');
            if (emailItem && !target.closest('.elxamail-email-checkbox')) {
                const index = parseInt(emailItem.dataset.emailIndex);
                this.selectEmail(index);
                return;
            }

            // Contact items
            const contact = target.closest('.elxamail-contact-item');
            if (contact) {
                this.composeToContact(contact.dataset.email);
                return;
            }

            // Email viewer action buttons
            const viewerAction = target.closest('[data-viewer-action]');
            if (viewerAction) {
                this.handleViewerAction(viewerAction.dataset.viewerAction);
                return;
            }

            // Context menu items
            const ctxItem = target.closest('[data-context]');
            if (ctxItem) {
                this.handleContextAction(ctxItem.dataset.context);
                this.hideContextMenu();
                return;
            }
        });

        // Checkbox changes (email selection)
        root.addEventListener('change', (e) => {
            if (e.target.classList.contains('elxamail-email-checkbox')) {
                e.stopPropagation();
                const index = parseInt(e.target.closest('.elxamail-email-item').dataset.emailIndex);
                this.toggleEmailSelection(index);
                return;
            }
            if (e.target.id === 'selectAllEmails') {
                this.toggleSelectAll();
                return;
            }
        });

        // Enter key in forms
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (document.querySelector('#loginSection:not(.hidden)')) {
                    this.login();
                    return;
                }
                if (document.querySelector('#registerSection:not(.hidden)')) {
                    this.register();
                    return;
                }
                if (document.querySelector('#composeWindow:not(.hidden)') && e.ctrlKey) {
                    this.sendEmail();
                    return;
                }
            }
        });

        // Context menu — right-click on email items
        root.addEventListener('contextmenu', (e) => {
            const emailItem = e.target.closest('.elxamail-email-item');
            if (emailItem) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                this.showContextMenu(e, emailItem);
                return false;
            }
        });

        // Close context menu on outside click
        document.addEventListener('click', (e) => {
            const contextMenu = document.getElementById('emailContextMenu');
            if (contextMenu && !contextMenu.contains(e.target)) {
                this.hideContextMenu();
            }
        });
    }

    handleNavAction(action) {
        switch (action) {
            case 'login':    this.showLogin(); break;
            case 'register': this.showRegister(); break;
            case 'help':     this.showHelp(); break;
            case 'logout':   this.logout(); break;
        }
    }

    handleAction(action) {
        switch (action) {
            // Login / Register
            case 'login':            this.login(); break;
            case 'register':         this.register(); break;
            case 'show-login':       this.showLogin(); break;
            case 'show-register':    this.showRegister(); break;
            // Compose
            case 'compose':          this.showCompose(); break;
            case 'send-email':       this.sendEmail(); break;
            case 'save-draft':       this.saveDraft(); break;
            case 'cancel-compose':   this.cancelCompose(); break;
            // Toolbar
            case 'refresh':          this.refreshEmails(); break;
            case 'delete-selected':  this.deleteSelected(); break;
            case 'mark-read':        this.markAsRead(); break;
            case 'mark-unread':      this.markAsUnread(); break;
            // Bulk actions
            case 'bulk-mark-read':       this.bulkMarkRead(); break;
            case 'bulk-mark-unread':     this.bulkMarkUnread(); break;
            case 'bulk-delete':          this.bulkDelete(); break;
            case 'bulk-delete-permanent': this.bulkDeletePermanently(); break;
            // Viewer
            case 'close-viewer':     this.closeEmailViewer(); break;
        }
    }

    handleViewerAction(action) {
        if (!this.currentViewedEmail) return;
        switch (action) {
            case 'reply':   this.replyToEmail(this.currentViewedEmail); break;
            case 'forward': this.forwardEmail(this.currentViewedEmail); break;
            case 'delete':  this.deleteEmailFromViewer(this.currentViewedEmail); break;
        }
    }

    // ===== ACCOUNT MANAGEMENT =====

    register() {
        const displayName = document.getElementById('regDisplayName').value.trim();
        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;

        if (!displayName || !username || !password) {
            this.showError('Please fill in all required fields.');
            return;
        }
        if (username.length < 3) {
            this.showError('Email username must be at least 3 characters long.');
            return;
        }
        if (password.length < 6) {
            this.showError('Password must be at least 6 characters long.');
            return;
        }
        if (password !== confirmPassword) {
            this.showError('Passwords do not match.');
            return;
        }
        if (this.userExists(username)) {
            this.showError('Email address already exists. Please choose a different username.');
            return;
        }

        const newUser = {
            username: username,
            email: `${username}@elxamail.ex`,
            displayName: displayName,
            password: password,
            dateCreated: new Date().toISOString(),
            lastLogin: null,
            settings: {
                signature: `\n\n--\n${displayName}\nSent from ElxaMail`,
                autoReply: false,
                spamFilter: true
            },
            folders: { inbox: [], sent: [], drafts: [], trash: [] }
        };

        this.saveUser(newUser);
        this.showSuccess('Account created successfully! Please sign in with your new credentials.');
        this.showLogin();
        this.clearRegistrationForm();
    }

    login() {
        const email = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showError('Please enter both email address and password.');
            return;
        }

        const username = email.includes('@') ? email.split('@')[0] : email;
        const userData = this.loadUser(username);

        if (!userData || userData.password !== password) {
            this.showError('Invalid email address or password.');
            return;
        }

        userData.lastLogin = new Date().toISOString();
        this.saveUser(userData);

        this.currentUser = userData;
        this.isLoggedIn = true;
        this.emails = userData.folders || { inbox: [], sent: [], drafts: [], trash: [] };

        this.loadSettings();
        this.saveUserSession();
        this.showEmailInterface();
        this.showSuccess(`Welcome back, ${userData.displayName}!`);

        if (this.emails.inbox.length === 0) {
            this.generateWelcomeEmails();
        }

        this.processQueuedExternalEmails();
    }

    logout() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.emails = { inbox: [], sent: [], drafts: [], trash: [] };
        this.composeMode = false;
        this.currentViewedEmail = null;

        this.clearUserSession();
        this.showWelcome();
        this.showSuccess('You have been signed out successfully.');
    }

    // ===== USER INTERFACE =====

    showLogin() {
        this.hideAllSections();
        document.getElementById('loginSection').classList.remove('hidden');
        document.getElementById('loggedInNav').classList.add('hidden');
        setTimeout(() => document.getElementById('loginUsername').focus(), 100);
    }

    showRegister() {
        this.hideAllSections();
        document.getElementById('registerSection').classList.remove('hidden');
        document.getElementById('loggedInNav').classList.add('hidden');
        setTimeout(() => document.getElementById('regDisplayName').focus(), 100);
    }

    showWelcome() {
        this.hideAllSections();
        document.getElementById('welcomeScreen').classList.remove('hidden');
        document.getElementById('loggedInNav').classList.add('hidden');
    }

    showEmailInterface() {
        if (!this.isLoggedIn) {
            this.showLogin();
            return;
        }

        this.hideAllSections();
        document.getElementById('emailInterface').classList.remove('hidden');
        document.getElementById('loggedInNav').classList.remove('hidden');

        // Build dynamic UI components
        this.buildSidebar();
        this.buildToolbar();
        this.buildBulkActions();
        this.buildComposeWindow();

        // Update user info in header
        this.updateUserInfo();
        this.updateContactsList();
        this.selectFolder(this.currentFolder);

        // Check for pending compose request (e.g. from Employee Portal "Email Supervisor")
        this.checkPendingCompose();
    }

    /**
     * Check localStorage for a pending compose request.
     * Used by the Employee Portal to hand off a pre-filled email.
     */
    checkPendingCompose() {
        try {
            var raw = localStorage.getItem('elxamail-pending-compose');
            if (!raw) return;
            localStorage.removeItem('elxamail-pending-compose');

            var data = JSON.parse(raw);
            this.showCompose();

            // Small delay to ensure compose DOM is ready
            setTimeout(() => {
                var toField = document.getElementById('composeTo');
                var subjectField = document.getElementById('composeSubject');
                var bodyField = document.getElementById('composeBody');
                if (toField && data.to) toField.value = data.to;
                if (subjectField && data.subject) subjectField.value = data.subject;
                if (bodyField && data.body) bodyField.value = data.body;
                // Focus the body so user can start typing
                if (bodyField) bodyField.focus();
            }, 150);

            console.log('ElxaMail: opened compose from pending request (to: ' + data.to + ')');
        } catch (e) {
            console.warn('ElxaMail: failed to process pending compose:', e);
        }
    }

    hideAllSections() {
        ['loginSection', 'registerSection', 'emailInterface', 'welcomeScreen'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
    }

    updateUserInfo() {
        const userInfo = document.getElementById('elxamailUserInfo');
        if (userInfo && this.currentUser) {
            const icon = typeof ElxaIcons !== 'undefined' ? ElxaIcons.renderAction('email') : '';
            userInfo.innerHTML = `
                <span>${icon} ${this.currentUser.email} |
                    <a href="javascript:void(0)" data-nav="logout">Sign Out</a>
                </span>
            `;
        }
    }

    updateContactsList() {
        const contactsList = document.getElementById('contactsList');
        if (!contactsList) return;

        contactsList.innerHTML = this.contacts.map(contact => `
            <div class="elxamail-contact-item" data-email="${contact.email}" title="${contact.title}">
                ${contact.name}
            </div>
        `).join('');
    }

    // ===== EMAIL MANAGEMENT =====

    selectFolder(folderName) {
        this.currentFolder = folderName;

        // Update folder selection UI
        document.querySelectorAll('.elxamail-folder').forEach(folder => {
            folder.classList.toggle('active', folder.dataset.folder === folderName);
        });

        this.selectedEmails.clear();
        this.cancelCompose();
        this.closeEmailViewer();
        this.updateEmailList();
        this.updateEmailStatus();
    }

    updateEmailList() {
        const emailList = document.getElementById('emailList');
        const emails = this.emails[this.currentFolder] || [];

        if (emails.length === 0) {
            emailList.innerHTML = `
                <div class="elxamail-empty-folder">${this.getEmptyFolderMessage()}</div>
            `;
            this.hideBulkActions();
            return;
        }

        const icon = (name) => typeof ElxaIcons !== 'undefined' ? ElxaIcons.renderAction(name) : '';

        emailList.innerHTML = emails.map((email, index) => {
            const classes = ['elxamail-email-item'];
            if (!email.read) classes.push('unread');
            if (email.isSpam) classes.push('elxamail-spam-item');
            if (email.isCorporate) classes.push('elxamail-corporate-item');

            let prefix = '';
            if (email.isSpam) prefix = `<span class="elxamail-email-prefix">${icon('alert')}</span>`;
            else if (email.isCorporate) prefix = `<span class="elxamail-email-prefix">${icon('shield')}</span>`;

            return `
                <div class="${classes.join(' ')}" data-email-index="${index}">
                    <input type="checkbox" class="elxamail-email-checkbox">
                    <div class="elxamail-email-from">
                        ${prefix}${email.fromName || email.from}
                    </div>
                    <div class="elxamail-email-subject">
                        ${email.subject || '(no subject)'}
                    </div>
                    <div class="elxamail-email-date">
                        ${this.formatDate(email.date)}
                    </div>
                </div>
            `;
        }).join('');

        this.updateInboxCount();
        this.updateBulkActionsForFolder();
    }

    getEmptyFolderMessage() {
        const messages = {
            inbox: 'No messages in your inbox.',
            sent: 'No sent messages.',
            drafts: 'No draft messages.',
            trash: 'Trash is empty.'
        };
        return messages[this.currentFolder] || 'No messages in this folder.';
    }

    updateInboxCount() {
        const inboxCount = document.getElementById('inboxCount');
        if (inboxCount) {
            inboxCount.textContent = this.emails.inbox.filter(e => !e.read).length;
        }
    }

    updateEmailStatus() {
        const status = document.getElementById('emailStatus');
        if (status) {
            const folderName = this.currentFolder.charAt(0).toUpperCase() + this.currentFolder.slice(1);
            status.textContent = `${folderName}: ${this.emails[this.currentFolder].length} messages`;
        }
    }

    selectEmail(index) {
        const email = this.emails[this.currentFolder][index];
        if (!email) return;

        if (!email.read) {
            email.read = true;
            this.saveCurrentUser();
            this.updateEmailList();
        }

        this.showEmailViewer(email);
    }

    // ===== EMAIL VIEWER =====

    showEmailViewer(email) {
        const viewer = document.getElementById('emailViewer');
        if (!viewer) return;

        // Store reference (replaces JSON.stringify in onclick)
        this.currentViewedEmail = email;

        const icon = (name) => typeof ElxaIcons !== 'undefined' ? ElxaIcons.renderAction(name) : '';

        let banners = '';
        if (email.isSpam) {
            banners += `<div class="elxamail-spam-banner"><strong>${icon('alert')} Warning:</strong> This message may be spam. Be cautious of suspicious links or requests.</div>`;
        }
        if (email.isCorporate) {
            const dept = email.department ? email.department.replace('elxacorp_', '').toUpperCase() : '';
            banners += `<div class="elxamail-corporate-banner"><strong>${icon('shield')} Corporate Communication:</strong> Official message from ElxaCorp ${dept} department.</div>`;
        }

        viewer.innerHTML = `
            <div class="elxamail-viewer-header">
                <span>Email Message</span>
                <button class="elxamail-btn" data-action="close-viewer">${icon('close')} Close</button>
            </div>
            <div class="elxamail-viewer-content">
                ${banners}
                <div class="elxamail-viewer-meta">
                    <div class="elxamail-viewer-subject">${email.subject || '(no subject)'}</div>
                    <div class="elxamail-viewer-meta-line">
                        <strong>From:</strong> ${email.fromName || email.from} &lt;${email.from}&gt;
                    </div>
                    <div class="elxamail-viewer-meta-line">
                        <strong>To:</strong> ${email.to}
                    </div>
                    <div class="elxamail-viewer-meta-line">
                        <strong>Date:</strong> ${this.formatFullDate(email.date)}
                    </div>
                </div>
                <div class="elxamail-viewer-body">${email.body}</div>
                <div class="elxamail-viewer-actions">
                    <button class="elxamail-btn elxamail-btn-primary" data-viewer-action="reply">
                        ${icon('reply')} Reply
                    </button>
                    <button class="elxamail-btn" data-viewer-action="forward">
                        ${icon('forward-email')} Forward
                    </button>
                    <button class="elxamail-btn" data-viewer-action="delete">
                        ${icon('delete')} Delete
                    </button>
                </div>
            </div>
        `;

        viewer.classList.remove('hidden');
        document.getElementById('emailListContainer').style.display = 'none';
    }

    closeEmailViewer() {
        const viewer = document.getElementById('emailViewer');
        if (viewer) viewer.classList.add('hidden');
        this.currentViewedEmail = null;
        const listContainer = document.getElementById('emailListContainer');
        if (listContainer) listContainer.style.display = 'block';
    }

    deleteEmailFromViewer(email) {
        const emailIndex = this.emails[this.currentFolder].findIndex(e => e.id === email.id);
        if (emailIndex === -1) return;

        if (this.currentFolder === 'trash') {
            this.emails.trash.splice(emailIndex, 1);
            this.showSuccess('Email deleted permanently.');
        } else {
            this.emails.trash.unshift(email);
            this.emails[this.currentFolder].splice(emailIndex, 1);
            this.showSuccess('Email moved to trash.');
        }

        this.saveCurrentUser();
        this.closeEmailViewer();
        this.updateEmailList();
    }

    // ===== BULK ACTIONS =====

    toggleEmailSelection(index) {
        if (this.selectedEmails.has(index)) {
            this.selectedEmails.delete(index);
        } else {
            this.selectedEmails.add(index);
        }
        this.updateBulkActionsVisibility();
        this.updateSelectAllCheckbox();
    }

    updateBulkActionsVisibility() {
        const bulkActions = document.getElementById('elxamailBulkActions');
        if (bulkActions) {
            bulkActions.classList.toggle('active', this.selectedEmails.size > 0);
        }
    }

    hideBulkActions() {
        const bulkActions = document.getElementById('elxamailBulkActions');
        if (bulkActions) bulkActions.classList.remove('active');
        this.selectedEmails.clear();
    }

    updateBulkActionsForFolder() {
        const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
        const bulkDeletePermanentBtn = document.getElementById('bulkDeletePermanentBtn');
        const isTrash = this.currentFolder === 'trash';

        if (bulkDeleteBtn) bulkDeleteBtn.classList.toggle('hidden', isTrash);
        if (bulkDeletePermanentBtn) bulkDeletePermanentBtn.classList.toggle('hidden', !isTrash);
    }

    updateSelectAllCheckbox() {
        const cb = document.getElementById('selectAllEmails');
        if (!cb) return;

        const total = this.emails[this.currentFolder].length;
        const selected = this.selectedEmails.size;

        cb.checked = selected > 0 && selected === total;
        cb.indeterminate = selected > 0 && selected < total;
    }

    toggleSelectAll() {
        const cb = document.getElementById('selectAllEmails');
        if (!cb) return;

        this.selectedEmails.clear();
        if (cb.checked) {
            for (let i = 0; i < this.emails[this.currentFolder].length; i++) {
                this.selectedEmails.add(i);
            }
        }

        document.querySelectorAll('.elxamail-email-checkbox').forEach((checkbox, index) => {
            checkbox.checked = this.selectedEmails.has(index);
        });

        this.updateBulkActionsVisibility();
    }

    bulkMarkRead() {
        if (this.selectedEmails.size === 0) { this.showError('Please select emails to mark as read.'); return; }
        this.selectedEmails.forEach(i => { if (this.emails[this.currentFolder][i]) this.emails[this.currentFolder][i].read = true; });
        this.selectedEmails.clear();
        this.saveCurrentUser();
        this.updateEmailList();
        this.showSuccess('Selected emails marked as read.');
    }

    bulkMarkUnread() {
        if (this.selectedEmails.size === 0) { this.showError('Please select emails to mark as unread.'); return; }
        this.selectedEmails.forEach(i => { if (this.emails[this.currentFolder][i]) this.emails[this.currentFolder][i].read = false; });
        this.selectedEmails.clear();
        this.saveCurrentUser();
        this.updateEmailList();
        this.showSuccess('Selected emails marked as unread.');
    }

    bulkDelete() {
        if (this.selectedEmails.size === 0) { this.showError('Please select emails to delete.'); return; }

        const indices = Array.from(this.selectedEmails).sort((a, b) => b - a);
        indices.forEach(i => {
            const email = this.emails[this.currentFolder][i];
            if (email) {
                this.emails.trash.unshift(email);
                this.emails[this.currentFolder].splice(i, 1);
            }
        });

        this.selectedEmails.clear();
        this.saveCurrentUser();
        this.updateEmailList();
        this.showSuccess('Selected emails moved to trash.');
    }

    async bulkDeletePermanently() {
        if (this.selectedEmails.size === 0) { this.showError('Please select emails to delete permanently.'); return; }

        const count = this.selectedEmails.size;

        if (typeof ElxaUI !== 'undefined') {
            const confirmed = await ElxaUI.showConfirmDialog({
                title: 'Delete Forever',
                message: `Are you sure you want to permanently delete ${count} email(s)? This cannot be undone!`,
                confirmText: 'Delete Forever',
                confirmClass: 'elxa-dialog-btn-danger'
            });
            if (!confirmed) return;
        }

        const indices = Array.from(this.selectedEmails).sort((a, b) => b - a);
        indices.forEach(i => this.emails.trash.splice(i, 1));

        this.selectedEmails.clear();
        this.saveCurrentUser();
        this.updateEmailList();
        this.showSuccess('Selected emails deleted permanently.');
    }

    // ===== COMPOSE FUNCTIONALITY =====

    showCompose() {
        this.composeMode = true;
        document.getElementById('composeWindow').classList.remove('hidden');
        document.getElementById('emailListContainer').style.display = 'none';

        document.getElementById('composeTo').value = '';
        document.getElementById('composeSubject').value = '';
        document.getElementById('composeBody').value = '';

        setTimeout(() => document.getElementById('composeTo').focus(), 100);
    }

    composeToContact(email) {
        this.showCompose();
        document.getElementById('composeTo').value = email;
        document.getElementById('composeSubject').focus();
    }

    cancelCompose() {
        this.composeMode = false;
        const compose = document.getElementById('composeWindow');
        if (compose) compose.classList.add('hidden');
        const listContainer = document.getElementById('emailListContainer');
        if (listContainer) listContainer.style.display = 'block';
        this.closeEmailViewer();
    }

    async sendEmail() {
        const to = document.getElementById('composeTo').value.trim();
        const subject = document.getElementById('composeSubject').value.trim();
        const body = document.getElementById('composeBody').value.trim();

        if (!to) { this.showError('Please enter a recipient email address.'); return; }
        if (!subject && !body) { this.showError('Please enter a subject or message.'); return; }

        const email = {
            id: Date.now() + Math.random(),
            from: this.currentUser.email,
            fromName: this.currentUser.displayName,
            to: to,
            subject: subject || '(no subject)',
            body: body + (this.currentUser.settings.signature || ''),
            date: new Date().toISOString(),
            read: true
        };

        this.emails.sent.unshift(email);

        // Add to conversation history
        const contact = this.contacts.find(c => c.email.toLowerCase() === to.toLowerCase());
        if (contact && this.conversationManager) {
            this.conversationManager.addMessage(contact.id, {
                type: 'email', sender: 'user', content: body,
                subject: subject, timestamp: email.date, platform: 'email'
            });
        }

        this.saveCurrentUser();
        this.cancelCompose();
        this.showSuccess('Message sent successfully!');

        // Schedule auto-reply from character
        if (contact && contact.autoReply) {
            this.scheduleAutoReply(contact, email);
        }

        if (this.currentFolder === 'sent') this.updateEmailList();
    }

    saveDraft() {
        const to = document.getElementById('composeTo').value.trim();
        const subject = document.getElementById('composeSubject').value.trim();
        const body = document.getElementById('composeBody').value.trim();

        if (!to && !subject && !body) { this.showError('Draft is empty.'); return; }

        this.emails.drafts.unshift({
            id: Date.now() + Math.random(),
            from: this.currentUser.email,
            fromName: this.currentUser.displayName,
            to: to, subject: subject || '(no subject)', body: body,
            date: new Date().toISOString(), read: true, isDraft: true
        });

        this.saveCurrentUser();
        this.showSuccess('Draft saved successfully!');
        if (this.currentFolder === 'drafts') this.updateEmailList();
    }

    // ===== AUTO-REPLY SYSTEM =====

    async scheduleAutoReply(contact, originalEmail) {
        const delay = Math.random() * (5 * 60 * 1000 - 30 * 1000) + 30 * 1000;

        const timerId = setTimeout(async () => {
            try {
                const response = await this.generateCharacterResponse(contact, originalEmail);
                if (!response) return;

                const replyEmail = {
                    id: Date.now() + Math.random(),
                    from: contact.email,
                    fromName: contact.name,
                    to: this.currentUser.email,
                    subject: `Re: ${originalEmail.subject}`,
                    body: response,
                    date: new Date().toISOString(),
                    read: false,
                    isAutoReply: true
                };

                this.emails.inbox.unshift(replyEmail);

                if (this.conversationManager) {
                    this.conversationManager.addMessage(contact.id, {
                        type: 'email', sender: 'character', content: response,
                        subject: `Re: ${originalEmail.subject}`,
                        timestamp: replyEmail.date, platform: 'email'
                    });
                }

                this.saveCurrentUser();
                if (this.currentFolder === 'inbox') this.updateEmailList();
                this.showSuccess(`New message from ${contact.name}!`);
            } catch (error) {
                console.error('❌ Failed to generate auto-reply:', error);
            }
        }, delay);

        this._trackTimer(timerId);
    }

    async generateCharacterResponse(contact, originalEmail) {
        // Try LLM first
        if (this.llmService && this.llmService.isAvailable()) {
            try {
                const llmResponse = await this.llmService.generateCharacterResponse(contact, originalEmail);
                if (llmResponse) return llmResponse;
            } catch (error) {
                console.error('❌ LLM response failed, falling back to templates:', error);
            }
        }

        // Fallback to world context
        if (this.conversationManager && this.conversationManager.worldContext) {
            const character = this.conversationManager.worldContext.keyCharacters[contact.id];
            if (character) return this.generateContextualFallback(character, originalEmail);
        }

        // Legacy template fallback
        const responses = this.characterResponses[contact.id];
        if (responses && responses.length > 0) {
            return responses[Math.floor(Math.random() * responses.length)];
        }

        return this.defaultResponse
            .replace('{contactName}', contact.name)
            .replace('{contactTitle}', contact.title || '');
    }

    generateContextualFallback(character, originalEmail) {
        const responses = {
            'mr_snake_e': `Thank you for your email regarding "${originalEmail.subject}". I'll review this matter and respond accordingly.\n\nBest regards,\n${character.fullName}\nCEO, ElxaCorp\n\n"Innovation drives everything we do."`,
            'mrs_snake_e': `Dear, what a lovely message! I'm so glad you wrote to me about "${originalEmail.subject}". I'll write back soon with a proper response.\n\nWith love and garden-fresh wishes,\n${character.fullName}`,
            'remi': `yo thanks for the message about "${originalEmail.subject}"! been super busy with youtube stuff and minecraft but ill get back to you soon\n\nstay cool,\n${character.fullName}`,
            'rita': `Hi! Thanks so much for writing about "${originalEmail.subject}". I really appreciate you reaching out. I'll respond properly soon!\n\nTake care,\n${character.fullName}`,
            'pushing_cat': `*suspicious cat noises*\n\nmeow meow i got your message about "${originalEmail.subject}" but im busy being sus in my lair right now\n\n-${character.fullName} (definitely not plotting anything)`
        };

        return responses[character.id] || `Thank you for your message about "${originalEmail.subject}". I will respond soon.\n\nBest regards,\n${character.fullName}`;
    }

    // ===== SPAM SYSTEM =====

    scheduleSpamGeneration() {
        if (!this.isLoggedIn) return;

        const delay = Math.random() * (30 * 60 * 1000 - 10 * 60 * 1000) + 10 * 60 * 1000;

        const timerId = setTimeout(() => {
            if (this.isLoggedIn && Math.random() < 0.3) {
                this.generateSpamEmail();
            }
            this.scheduleSpamGeneration();
        }, delay);

        this._trackTimer(timerId);
    }

    generateSpamEmail() {
        if (!this.spamTemplates || this.spamTemplates.length === 0) return;

        const template = this.spamTemplates[Math.floor(Math.random() * this.spamTemplates.length)];

        this.emails.inbox.unshift({
            id: Date.now() + Math.random(),
            from: template.from,
            fromName: template.fromName,
            to: this.currentUser.email,
            subject: template.subject,
            body: template.body,
            date: new Date().toISOString(),
            read: false,
            isSpam: true
        });

        this.saveCurrentUser();
        if (this.currentFolder === 'inbox') this.updateEmailList();
    }

    generateWelcomeEmails() {
        const welcomeEmails = [
            {
                id: Date.now() + Math.random(),
                from: 'welcome@elxacorp.ex',
                fromName: 'ElxaMail Team',
                to: this.currentUser.email,
                subject: 'Welcome to ElxaMail!',
                body: `Dear ${this.currentUser.displayName},\n\nWelcome to ElxaMail, Snakesia's premier email service!\n\nYour account ${this.currentUser.email} is now active and ready to use.\n\nFeatures you'll love:\n- Reliable email delivery\n- 100MB storage space\n- Spam filtering\n- Contact management\n- Mobile access\n\nIf you have any questions, reply to this email or visit our help center.\n\nWelcome to the family!\n\nThe ElxaMail Team\nElxaCorp Communications Division`,
                date: new Date().toISOString(),
                read: false
            },
            {
                id: Date.now() + Math.random() + 1,
                from: 'mr.snake.e@elxacorp.ex',
                fromName: 'Mr. Snake-e',
                to: this.currentUser.email,
                subject: 'Welcome to the ElxaCorp Family!',
                body: `Dear ${this.currentUser.displayName},\n\nPersonally welcoming you to ElxaCorp's email service!\n\nAs CEO, I'm committed to providing the best technology experience for all Snakesians. ElxaMail represents our dedication to innovation and reliable communication.\n\nFeel free to reach out if you have any feedback or suggestions. We value every user's input.\n\nBest regards,\nMr. Snake-e\nCEO, ElxaCorp\n\n"Innovation drives everything we do."`,
                date: new Date(Date.now() - 60000).toISOString(),
                read: false,
            }
        ];

        welcomeEmails.forEach(email => this.emails.inbox.push(email));
        this.saveCurrentUser();
    }

    // ===== EMAIL ACTIONS =====

    refreshEmails() {
        this.updateEmailList();
        this.showSuccess('Emails refreshed!');
    }

    async deleteSelected() {
        if (this.selectedEmails.size === 0) { this.showError('Please select emails to delete.'); return; }

        if (this.currentFolder === 'trash') {
            // Permanent deletion — confirm first
            const count = this.selectedEmails.size;
            if (typeof ElxaUI !== 'undefined') {
                const confirmed = await ElxaUI.showConfirmDialog({
                    title: 'Delete Forever',
                    message: `Are you sure you want to permanently delete ${count} email(s)? This cannot be undone!`,
                    confirmText: 'Delete Forever',
                    confirmClass: 'elxa-dialog-btn-danger'
                });
                if (!confirmed) return;
            }

            const indices = Array.from(this.selectedEmails).sort((a, b) => b - a);
            indices.forEach(i => this.emails.trash.splice(i, 1));
            this.selectedEmails.clear();
            this.saveCurrentUser();
            this.updateEmailList();
            this.showSuccess('Selected emails deleted permanently.');
        } else {
            // Move to trash
            const indices = Array.from(this.selectedEmails).sort((a, b) => b - a);
            indices.forEach(i => {
                const email = this.emails[this.currentFolder][i];
                if (email) {
                    this.emails.trash.unshift(email);
                    this.emails[this.currentFolder].splice(i, 1);
                }
            });
            this.selectedEmails.clear();
            this.saveCurrentUser();
            this.updateEmailList();
            this.showSuccess('Selected emails moved to trash.');
        }
    }

    markAsRead() {
        if (this.selectedEmails.size === 0) { this.showError('Please select emails to mark as read.'); return; }
        this.selectedEmails.forEach(i => { if (this.emails[this.currentFolder][i]) this.emails[this.currentFolder][i].read = true; });
        this.selectedEmails.clear();
        this.saveCurrentUser();
        this.updateEmailList();
        this.showSuccess('Selected emails marked as read.');
    }

    markAsUnread() {
        if (this.selectedEmails.size === 0) { this.showError('Please select emails to mark as unread.'); return; }
        this.selectedEmails.forEach(i => { if (this.emails[this.currentFolder][i]) this.emails[this.currentFolder][i].read = false; });
        this.selectedEmails.clear();
        this.saveCurrentUser();
        this.updateEmailList();
        this.showSuccess('Selected emails marked as unread.');
    }

    // ===== CONTEXT MENU =====

    showContextMenu(event, emailItem) {
        const contextMenu = document.getElementById('emailContextMenu');
        const index = parseInt(emailItem.dataset.emailIndex);
        this.contextMenuEmail = index;

        contextMenu.style.left = event.pageX + 'px';
        contextMenu.style.top = event.pageY + 'px';
        contextMenu.classList.remove('hidden');

        const email = this.emails[this.currentFolder][index];
        const markRead = document.getElementById('ctxMarkRead');
        const markUnread = document.getElementById('ctxMarkUnread');
        const moveToTrash = document.getElementById('ctxMoveToTrash');
        const deleteItem = document.getElementById('ctxDelete');

        if (markRead) markRead.style.display = email?.read ? 'none' : 'block';
        if (markUnread) markUnread.style.display = email?.read ? 'block' : 'none';

        if (this.currentFolder === 'trash') {
            if (moveToTrash) moveToTrash.style.display = 'none';
        } else {
            if (moveToTrash) moveToTrash.style.display = 'block';
        }
    }

    hideContextMenu() {
        const contextMenu = document.getElementById('emailContextMenu');
        if (contextMenu) contextMenu.classList.add('hidden');
        this.contextMenuEmail = null;
    }

    async handleContextAction(action) {
        if (this.contextMenuEmail === null) return;

        const index = this.contextMenuEmail;
        const email = this.emails[this.currentFolder][index];
        if (!email) return;

        switch (action) {
            case 'reply':
                this.replyToEmail(email);
                break;
            case 'forward':
                this.forwardEmail(email);
                break;
            case 'markRead':
                email.read = true;
                this.saveCurrentUser();
                this.updateEmailList();
                break;
            case 'markUnread':
                email.read = false;
                this.saveCurrentUser();
                this.updateEmailList();
                break;
            case 'moveToTrash':
                this.emails.trash.unshift(email);
                this.emails[this.currentFolder].splice(index, 1);
                this.saveCurrentUser();
                this.updateEmailList();
                this.showSuccess('Email moved to trash.');
                break;
            case 'delete':
                if (this.currentFolder === 'trash') {
                    if (typeof ElxaUI !== 'undefined') {
                        const confirmed = await ElxaUI.showConfirmDialog({
                            title: 'Delete Forever',
                            message: 'Are you sure you want to permanently delete this email? This cannot be undone!',
                            confirmText: 'Delete Forever',
                            confirmClass: 'elxa-dialog-btn-danger'
                        });
                        if (!confirmed) return;
                    }
                    this.emails.trash.splice(index, 1);
                    this.showSuccess('Email deleted permanently.');
                } else {
                    this.emails.trash.unshift(email);
                    this.emails[this.currentFolder].splice(index, 1);
                    this.showSuccess('Email moved to trash.');
                }
                this.saveCurrentUser();
                this.updateEmailList();
                break;
        }
    }

    replyToEmail(email) {
        this.closeEmailViewer();
        this.showCompose();
        document.getElementById('composeTo').value = email.from;
        document.getElementById('composeSubject').value = `Re: ${email.subject}`;
        document.getElementById('composeBody').value = `\n\n--- Original Message ---\nFrom: ${email.fromName || email.from}\nDate: ${this.formatFullDate(email.date)}\nSubject: ${email.subject}\n\n${email.body}`;
        document.getElementById('composeBody').setSelectionRange(0, 0);
    }

    forwardEmail(email) {
        this.closeEmailViewer();
        this.showCompose();
        document.getElementById('composeSubject').value = `Fwd: ${email.subject}`;
        document.getElementById('composeBody').value = `\n\n--- Forwarded Message ---\nFrom: ${email.fromName || email.from}\nDate: ${this.formatFullDate(email.date)}\nTo: ${email.to}\nSubject: ${email.subject}\n\n${email.body}`;
        document.getElementById('composeTo').focus();
    }

    // ===== HELP DIALOG =====

    showHelp() {
        if (typeof ElxaUI !== 'undefined' && ElxaUI.createDialog) {
            const icon = (name) => ElxaIcons.renderAction(name);

            ElxaUI.createDialog({
                title: `${icon('help')} ElxaMail Help`,
                body: `
                    <div style="font-size: 11px; line-height: 1.6;">
                        <p><strong>Features:</strong></p>
                        <p>${icon('send')} Send and receive emails</p>
                        <p>${icon('inbox')} Organize emails in folders</p>
                        <p>${icon('menu')} Right-click emails for more options</p>
                        <p>${icon('email-send')} Compose new messages</p>
                        <p>${icon('account')} Contact management</p>
                        <br>
                        <p>For technical support, contact: <strong>help@elxacorp.ex</strong></p>
                    </div>
                `,
                buttons: [
                    { text: 'Got it!', className: 'elxa-dialog-btn-primary', onClick: 'close' }
                ]
            });
        }
    }

    // ===== UTILITY METHODS =====

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.ceil(Math.abs(now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (diffDays <= 7) return date.toLocaleDateString([], { weekday: 'short' });
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    formatFullDate(dateString) {
        return new Date(dateString).toLocaleDateString([], {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    clearRegistrationForm() {
        ['regDisplayName', 'regUsername', 'regPassword', 'regConfirmPassword'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    }

    // ===== STORAGE METHODS =====

    saveUser(userData) {
        try {
            localStorage.setItem(`elxaOS-mail-user-${userData.username}`, JSON.stringify(userData));

            try {
                if (typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
                    try { elxaOS.fileSystem.createFolder(['root', 'System'], 'Mail'); } catch (e) { /* exists */ }
                    elxaOS.fileSystem.createFile(['root', 'System', 'Mail'], `mail-user-${userData.username}.json`, JSON.stringify(userData, null, 2), 'json');
                }
            } catch (fsError) { /* localStorage succeeded, FS optional */ }
        } catch (error) {
            console.error('❌ Failed to save user data:', error);
        }
    }

    loadUser(username) {
        try {
            const data = localStorage.getItem(`elxaOS-mail-user-${username}`);
            if (data) return JSON.parse(data);

            if (typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
                try {
                    const file = elxaOS.fileSystem.getFile(['root', 'System', 'Mail'], `mail-user-${username}.json`);
                    if (file && file.content) {
                        const userData = JSON.parse(file.content);
                        localStorage.setItem(`elxaOS-mail-user-${username}`, JSON.stringify(userData));
                        return userData;
                    }
                } catch (fsError) { /* FS optional */ }
            }
            return null;
        } catch (error) {
            console.error('❌ Failed to load user data:', error);
            return null;
        }
    }

    userExists(username) {
        return this.loadUser(username) !== null;
    }

    saveCurrentUser() {
        if (this.currentUser) {
            this.currentUser.folders = this.emails;
            this.saveUser(this.currentUser);
        }
    }

    saveUserSession() {
        try {
            const sessionData = { username: this.currentUser.username, loginTime: Date.now() };
            localStorage.setItem('elxaOS-mail-session', JSON.stringify(sessionData));

            if (typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
                try {
                    try { elxaOS.fileSystem.createFolder(['root', 'System'], 'Mail'); } catch (e) { /* exists */ }
                    elxaOS.fileSystem.createFile(['root', 'System', 'Mail'], 'mail-session.json', JSON.stringify(sessionData), 'json');
                } catch (fsError) { /* FS optional */ }
            }
        } catch (error) {
            console.error('❌ Failed to save mail session:', error);
        }
    }

    loadUserSession() {
        try {
            let sessionData = null;

            const localData = localStorage.getItem('elxaOS-mail-session');
            if (localData) {
                sessionData = JSON.parse(localData);
            }

            if (!sessionData && typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
                try {
                    const file = elxaOS.fileSystem.getFile(['root', 'System', 'Mail'], 'mail-session.json');
                    if (file && file.content) {
                        sessionData = JSON.parse(file.content);
                        localStorage.setItem('elxaOS-mail-session', JSON.stringify(sessionData));
                    }
                } catch (fsError) { /* FS optional */ }
            }

            if (sessionData) {
                const sessionAge = Date.now() - sessionData.loginTime;
                if (sessionAge < 24 * 60 * 60 * 1000) {
                    const userData = this.loadUser(sessionData.username);
                    if (userData) {
                        this.currentUser = userData;
                        this.isLoggedIn = true;
                        this.emails = userData.folders || { inbox: [], sent: [], drafts: [], trash: [] };
                        return true;
                    }
                } else {
                    this.clearUserSession();
                }
            }
        } catch (error) {
            console.error('❌ Failed to load mail session:', error);
        }
        return false;
    }

    clearUserSession() {
        try {
            localStorage.removeItem('elxaOS-mail-session');
            if (typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
                try { elxaOS.fileSystem.deleteItem(['root', 'System', 'Mail'], 'mail-session.json'); } catch (e) { /* ok */ }
            }
        } catch (error) {
            console.error('❌ Failed to clear mail session:', error);
        }
    }

    loadSettings() {
        try {
            const messengerSettings = localStorage.getItem('snakesia-messenger-settings');
            if (messengerSettings) {
                console.log('🔧 API settings available for LLM integration');
            }
        } catch (error) { /* no settings */ }
    }

    // ===== QUEUED EMAIL PROCESSING =====

    processQueuedExternalEmails() {
        // Process all external email queues (ElxaCorp + Finance notifications)
        const queueKeys = ['elxacorp-queued-emails', 'finance-queued-emails'];
        let totalDelivered = 0;

        for (const key of queueKeys) {
            try {
                const queuedEmails = JSON.parse(localStorage.getItem(key) || '[]');
                if (queuedEmails.length === 0) continue;

                const myEmail = this.currentUser.email;
                const delivered = [];
                const remaining = [];

                queuedEmails.forEach(email => {
                    if (email.to === myEmail || email.to === 'user@elxamail.ex') {
                        email.to = myEmail;
                        this.emails.inbox.unshift(email);
                        delivered.push(email);
                    } else {
                        remaining.push(email);
                    }
                });

                if (remaining.length > 0) {
                    localStorage.setItem(key, JSON.stringify(remaining));
                } else {
                    localStorage.removeItem(key);
                }

                totalDelivered += delivered.length;
            } catch (error) {
                console.error('❌ Failed to process queued emails from ' + key + ':', error);
            }
        }

        if (totalDelivered > 0) {
            this.saveCurrentUser();
            this.updateEmailList();
            this.showSuccess(`📧 ${totalDelivered} queued email(s) delivered!`);
        }
    }

    // ===== MESSAGE DISPLAY — Uses ElxaUI =====

    showError(message) {
        if (typeof ElxaUI !== 'undefined') {
            ElxaUI.showMessage(message, 'error');
        } else {
            console.error('ElxaMail Error:', message);
        }
    }

    showSuccess(message) {
        if (typeof ElxaUI !== 'undefined') {
            ElxaUI.showMessage(message, 'success');
        } else {
            console.log('ElxaMail:', message);
        }
    }

    showInfo(message) {
        if (typeof ElxaUI !== 'undefined') {
            ElxaUI.showMessage(message, 'info');
        } else {
            console.log('ElxaMail:', message);
        }
    }
}

// Create global instance and initialize
window.elxaMailSystem = new ElxaMailSystem();

// Init immediately — DOM is already loaded since this runs
// inside the browser's executePageScripts() after innerHTML injection
elxaMailSystem.init();
