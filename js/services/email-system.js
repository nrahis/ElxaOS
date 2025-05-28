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
        
        // Data loaded from JSON files
        this.contacts = [];
        this.spamTemplates = [];
        this.characterResponses = {};
        this.defaultResponse = '';
        this.corporateMessages = {}; // Corporate message templates
        this.corporateVariables = {}; // Template variables
        this.corporateScheduling = {}; // Scheduling configuration
        
        // LLM Integration
        this.llmService = null; // Will be initialized after loading
        this.conversationManager = null; // Will be connected after loading
        
        this.setupEventListeners();
        this.loadSettings();
    }

    // ===== INITIALIZATION =====

    async init() {
        console.log('🔄 Initializing ElxaMail system...');
        
        // Load data from JSON files first
        await this.loadAllData();
        
        // Initialize conversation history manager
        this.initializeConversationHistory();
        
        // Initialize LLM service after email system is ready
        this.initializeLLMService();
        
        // Try to restore session if user was logged in
        this.loadUserSession();
        
        // Show appropriate section
        if (this.isLoggedIn) {
            this.showEmailInterface();
        } else {
            this.showWelcome();
        }
        
        // Set up spam generation and corporate messages
        this.scheduleSpamGeneration();
        this.scheduleCorporateMessages();
        
        console.log('✅ ElxaMail system initialized successfully');
    }

    initializeConversationHistory() {
        try {
            // Wait for conversation history manager to be ready
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
            // Make sure EmailLLMService is available
            if (typeof EmailLLMService === 'undefined') {
                console.log('⚠️ EmailLLMService class not available, using fallback responses');
                this.llmService = null;
                return;
            }
            
            // Initialize LLM service - we'll load it dynamically
            this.llmService = new EmailLLMService(this);
            const status = this.llmService.getStatus();
            console.log('✅ LLM service initialized:', status);
        } catch (error) {
            console.error('❌ Failed to initialize LLM service:', error);
            console.log('📧 Email system will use template responses as fallback');
            this.llmService = null;
        }
    }

    // ===== DATA LOADING METHODS =====

    async loadCharacters() {
        try {
            console.log('📁 Loading characters from world context...');
            // Use world context file instead of separate characters.json
            const response = await fetch('./assets/interwebs/exmail/world-context.json');
            if (!response.ok) {
                throw new Error(`Failed to load world context: ${response.status}`);
            }
            const worldData = await response.json();
            
            // Convert world context characters to contact format
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
                    autoReply: char.autoReply !== false, // Default to true unless explicitly false
                    canSendProactiveEmails: char.canSendProactiveEmails || false
                });
            });
            
            console.log(`✅ Loaded ${this.contacts.length} characters from world context`);
        } catch (error) {
            console.error('❌ Failed to load characters from world context:', error);
            // Fallback to minimal contacts
            this.contacts = [
                {
                    id: 'elxacorp_hr',
                    name: 'ElxaCorp HR',
                    email: 'hr@elxacorp.ex',
                    title: 'Human Resources Department',
                    description: 'Professional HR department handling employee communications and company policies.',
                    personality: 'Professional, corporate, helpful. Uses formal business language.',
                    autoReply: true
                }
            ];
        }
    }

    async loadSpamTemplates() {
        try {
            console.log('📁 Loading spam templates from JSON...');
            // Use absolute path from assets folder
            const response = await fetch('./assets/interwebs/exmail/spam-messages.json');
            if (!response.ok) {
                throw new Error(`Failed to load spam templates: ${response.status}`);
            }
            const data = await response.json();
            this.spamTemplates = data.spamTemplates || [];
            console.log(`✅ Loaded ${this.spamTemplates.length} spam templates`);
        } catch (error) {
            console.error('❌ Failed to load spam templates:', error);
            // Fallback to minimal spam
            this.spamTemplates = [
                {
                    from: 'spam@example.ex',
                    fromName: 'Generic Spam',
                    subject: 'Generic Spam Message',
                    body: 'This is a generic spam message because the templates failed to load.'
                }
            ];
        }
    }

    async loadCharacterResponses() {
        try {
            console.log('📁 Loading character responses from JSON...');
            // Use absolute path from assets folder
            const response = await fetch('./assets/interwebs/exmail/character-responses.json');
            if (!response.ok) {
                throw new Error(`Failed to load character responses: ${response.status}`);
            }
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
            console.log('📁 Loading corporate messages from JSON...');
            const response = await fetch('./assets/interwebs/exmail/corporate-messages.json');
            if (!response.ok) {
                throw new Error(`Failed to load corporate messages: ${response.status}`);
            }
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

    // ===== CORPORATE MESSAGE TEMPLATING SYSTEM =====

    replacePlaceholders(template, variables) {
        let result = template;
        
        // Find all {{variable}} placeholders
        const placeholderRegex = /\{\{([^}]+)\}\}/g;
        const matches = template.match(placeholderRegex);
        
        if (!matches) return result;
        
        // Replace each placeholder with a random value from the variables
        matches.forEach(match => {
            const variableName = match.replace(/[{}]/g, ''); // Remove {{ }}
            const variableValues = variables[variableName];
            
            if (variableValues && Array.isArray(variableValues) && variableValues.length > 0) {
                const randomValue = variableValues[Math.floor(Math.random() * variableValues.length)];
                result = result.replace(new RegExp(match.replace(/[{}]/g, '\\{\\}'), 'g'), randomValue);
            } else {
                // If variable not found, leave placeholder or replace with fallback
                console.warn(`⚠️ Variable ${variableName} not found in corporate variables`);
                result = result.replace(new RegExp(match.replace(/[{}]/g, '\\{\\}'), 'g'), `[${variableName}]`);
            }
        });
        
        return result;
    }

    generateCorporateEmail(departmentId) {
        const templates = this.corporateMessages[departmentId];
        if (!templates || templates.length === 0) {
            console.warn(`⚠️ No corporate message templates found for ${departmentId}`);
            return null;
        }
        
        // Pick a random template
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        // Replace placeholders in subject and body
        const subject = this.replacePlaceholders(template.subject, this.corporateVariables);
        const body = this.replacePlaceholders(template.body, this.corporateVariables);
        
        // Create email object
        const corporateEmail = {
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
        
        console.log(`📨 Generated corporate email from ${departmentId}:`, subject);
        return corporateEmail;
    }

    // ===== CORPORATE MESSAGE SCHEDULING =====

    scheduleCorporateMessages() {
        if (!this.isLoggedIn) return;

        // Schedule messages for each department
        Object.keys(this.corporateMessages).forEach(departmentId => {
            this.scheduleDepartmentMessage(departmentId);
        });
    }

    scheduleDepartmentMessage(departmentId) {
        const scheduling = this.corporateScheduling[departmentId];
        if (!scheduling) {
            console.log(`⚠️ No scheduling config for ${departmentId}, using defaults`);
            // Use default scheduling
            this.scheduleDepartmentMessage_internal(departmentId, 7, 14, 0.2);
            return;
        }
        
        this.scheduleDepartmentMessage_internal(
            departmentId, 
            scheduling.min_days || 7, 
            scheduling.max_days || 14, 
            scheduling.weight || 0.2
        );
    }

    scheduleDepartmentMessage_internal(departmentId, minDays, maxDays, weight) {
        // Calculate random delay between min and max days
        const minDelay = minDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds
        const maxDelay = maxDays * 24 * 60 * 60 * 1000;
        const delay = Math.random() * (maxDelay - minDelay) + minDelay;
        
        console.log(`📅 Scheduling next ${departmentId} message in ${Math.round(delay / (24 * 60 * 60 * 1000))} days`);
        
        setTimeout(() => {
            if (this.isLoggedIn && Math.random() < weight) {
                console.log(`📨 Triggering corporate message for ${departmentId}`);
                this.sendCorporateMessage(departmentId);
            } else {
                console.log(`🎲 Corporate message for ${departmentId} skipped this cycle`);
            }
            
            // Schedule the next message
            this.scheduleDepartmentMessage(departmentId);
        }, delay);
    }

    sendCorporateMessage(departmentId) {
        const corporateEmail = this.generateCorporateEmail(departmentId);
        if (!corporateEmail) {
            console.error(`❌ Failed to generate corporate email for ${departmentId}`);
            return;
        }
        
        // Add to inbox
        this.emails.inbox.unshift(corporateEmail);
        
        // Save user data
        this.saveCurrentUser();
        
        // Update display if viewing inbox
        if (this.currentFolder === 'inbox') {
            this.updateEmailList();
        }
        
        // Show notification
        this.showSuccess(`📨 New corporate message from ${corporateEmail.fromName}!`);
        
        console.log(`✅ Corporate message delivered from ${departmentId}`);
    }

    async loadAllData() {
        console.log('🔄 Loading ElxaMail data from JSON files...');
        await Promise.all([
            this.loadCharacters(),
            this.loadSpamTemplates(),
            this.loadCharacterResponses(),
            this.loadCorporateMessages()
        ]);
        console.log('✅ All ElxaMail data loaded successfully!');
    }

    setupEventListeners() {
        // Handle Enter key in login/register forms
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const activeLogin = document.querySelector('#loginSection:not(.hidden)');
                if (activeLogin) {
                    this.login();
                    return;
                }
                const activeRegister = document.querySelector('#registerSection:not(.hidden)');
                if (activeRegister) {
                    this.register();
                    return;
                }
                const activeCompose = document.querySelector('#composeWindow:not(.hidden)');
                if (activeCompose && e.ctrlKey) {
                    this.sendEmail();
                    return;
                }
            }
        });

        // Context menu handling - IMPROVED: Better event handling
        document.addEventListener('click', (e) => {
            const contextMenu = document.getElementById('emailContextMenu');
            if (contextMenu && !contextMenu.contains(e.target)) {
                this.hideContextMenu();
            }
        });

        // Email list context menu - IMPROVED: Better event propagation handling
        document.addEventListener('contextmenu', (e) => {
            const emailItem = e.target.closest('.elxamail-email-item');
            if (emailItem) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation(); // ADDED: Prevent other context menus
                this.showContextMenu(e, emailItem);
                return false; // ADDED: Extra prevention
            }
        });

        // Context menu actions
        document.addEventListener('click', (e) => {
            const contextItem = e.target.closest('.elxamail-context-item');
            if (contextItem) {
                const action = contextItem.dataset.action;
                this.handleContextAction(action);
                this.hideContextMenu();
            }
        });
    }

    // ===== ACCOUNT MANAGEMENT =====

    register() {
        const displayName = document.getElementById('regDisplayName').value.trim();
        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;

        // Validation
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

        // Check if username already exists
        if (this.userExists(username)) {
            this.showError('Email address already exists. Please choose a different username.');
            return;
        }

        // Create new user account
        const newUser = {
            username: username,
            email: `${username}@elxamail.ex`,
            displayName: displayName,
            password: password, // In a real system, this would be hashed
            dateCreated: new Date().toISOString(),
            lastLogin: null,
            settings: {
                signature: `\n\n--\n${displayName}\nSent from ElxaMail`,
                autoReply: false,
                spamFilter: true
            },
            folders: {
                inbox: [],
                sent: [],
                drafts: [],
                trash: []
            }
        };

        // Save user to storage
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

        // Extract username from email
        let username;
        if (email.includes('@')) {
            username = email.split('@')[0];
        } else {
            username = email;
        }

        // Load user data
        const userData = this.loadUser(username);
        
        if (!userData || userData.password !== password) {
            this.showError('Invalid email address or password.');
            return;
        }

        // Update last login
        userData.lastLogin = new Date().toISOString();
        this.saveUser(userData);

        // Set current user
        this.currentUser = userData;
        this.isLoggedIn = true;
        this.emails = userData.folders || {
            inbox: [],
            sent: [],
            drafts: [],
            trash: []
        };

        // Load API settings if available
        this.loadSettings();

        // Save session
        this.saveUserSession();

        // Show email interface
        this.showEmailInterface();
        this.showSuccess(`Welcome back, ${userData.displayName}!`);
        
        // Generate initial emails for new users
        if (this.emails.inbox.length === 0) {
            this.generateWelcomeEmails();
        }
    }

    logout() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.emails = { inbox: [], sent: [], drafts: [], trash: [] };
        this.composeMode = false;
        
        // Clear session
        this.clearUserSession();
        
        // Show welcome page
        this.showWelcome();
        this.showSuccess('You have been signed out successfully.');
    }

    // ===== USER INTERFACE =====

    showLogin() {
        this.hideAllSections();
        document.getElementById('loginSection').classList.remove('hidden');
        document.getElementById('loggedInNav').classList.add('hidden');
        
        this.clearMessages();
        
        setTimeout(() => {
            document.getElementById('loginUsername').focus();
        }, 100);
    }

    showRegister() {
        this.hideAllSections();
        document.getElementById('registerSection').classList.remove('hidden');
        document.getElementById('loggedInNav').classList.add('hidden');
        
        this.clearMessages();
        
        setTimeout(() => {
            document.getElementById('regDisplayName').focus();
        }, 100);
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
        
        // Update user info
        this.updateUserInfo();
        
        // Update contacts list
        this.updateContactsList();
        
        // Load current folder
        this.selectFolder(this.currentFolder);
    }

    hideAllSections() {
        const sections = ['loginSection', 'registerSection', 'emailInterface', 'welcomeScreen'];
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.classList.add('hidden');
            }
        });
    }

    updateUserInfo() {
        const userInfo = document.getElementById('elxamailUserInfo');
        if (userInfo && this.currentUser) {
            userInfo.innerHTML = `
                <span style="font-size: 11px;">
                    📧 ${this.currentUser.email} | 
                    <a href="javascript:void(0)" onclick="elxaMailSystem.logout()" style="color: #ffcc00;">Sign Out</a>
                </span>
            `;
        }
    }

    updateContactsList() {
        const contactsList = document.getElementById('contactsList');
        if (!contactsList) return;

        let html = '';
        this.contacts.forEach(contact => {
            html += `
                <div style="padding: 3px 8px; font-size: 10px; cursor: pointer; color: #666;" 
                     onclick="elxaMailSystem.composeToContact('${contact.email}')"
                     title="${contact.title}">
                    ${contact.name}
                </div>
            `;
        });

        contactsList.innerHTML = html;
    }

    // ===== EMAIL MANAGEMENT =====

    selectFolder(folderName) {
        this.currentFolder = folderName;
        
        // Update folder selection UI
        document.querySelectorAll('.elxamail-folder').forEach(folder => {
            folder.classList.remove('active');
        });
        document.querySelector(`[data-folder="${folderName}"]`).classList.add('active');
        
        // Clear selections when changing folders
        this.selectedEmails.clear();
        
        // Hide compose window and email viewer
        this.cancelCompose();
        this.closeEmailViewer();
        
        // Update email list
        this.updateEmailList();
        
        // Update status
        this.updateEmailStatus();
    }

    updateEmailList() {
        const emailList = document.getElementById('emailList');
        const emails = this.emails[this.currentFolder] || [];
        
        if (emails.length === 0) {
            emailList.innerHTML = `
                <div style="padding: 40px; text-align: center; color: #666; font-size: 11px;">
                    ${this.getEmptyFolderMessage()}
                </div>
            `;
            this.hideBulkActions();
            return;
        }

        let html = '';
        emails.forEach((email, index) => {
            const isUnread = !email.read;
            const isSpam = email.isSpam;
            const isCorporate = email.isCorporate;
            
            let emailStyle = '';
            let emailPrefix = '';
            
            if (isSpam) {
                emailStyle = 'background-color: #ffe6e6;';
                emailPrefix = '⚠️ ';
            } else if (isCorporate) {
                emailStyle = 'background-color: #e6f3ff; border-left: 3px solid #007bff;';
                emailPrefix = '🏢 ';
            }
            
            html += `
                <div class="elxamail-email-item ${isUnread ? 'unread' : ''}" 
                     data-email-index="${index}" 
                     onclick="elxaMailSystem.selectEmail(${index})"
                     style="${emailStyle}">
                    <input type="checkbox" class="elxamail-email-checkbox" 
                           onchange="elxaMailSystem.toggleEmailSelection(${index})" 
                           onclick="event.stopPropagation()">
                    <div class="elxamail-email-from">
                        ${emailPrefix}${email.fromName || email.from}
                    </div>
                    <div class="elxamail-email-subject">
                        ${email.subject || '(no subject)'}
                    </div>
                    <div class="elxamail-email-date">
                        ${this.formatDate(email.date)}
                    </div>
                </div>
            `;
        });

        emailList.innerHTML = html;
        
        // Update inbox count
        this.updateInboxCount();
        
        // Update bulk actions based on folder
        this.updateBulkActionsForFolder();
    }

    getEmptyFolderMessage() {
        switch (this.currentFolder) {
            case 'inbox':
                return 'No messages in your inbox.';
            case 'sent':
                return 'No sent messages.';
            case 'drafts':
                return 'No draft messages.';
            case 'trash':
                return 'Trash is empty.';
            default:
                return 'No messages in this folder.';
        }
    }

    updateInboxCount() {
        const inboxCount = document.getElementById('inboxCount');
        if (inboxCount) {
            const unreadCount = this.emails.inbox.filter(email => !email.read).length;
            inboxCount.textContent = unreadCount;
        }
    }

    updateEmailStatus() {
        const status = document.getElementById('emailStatus');
        if (status) {
            const folderName = this.currentFolder.charAt(0).toUpperCase() + this.currentFolder.slice(1);
            const emailCount = this.emails[this.currentFolder].length;
            status.textContent = `${folderName}: ${emailCount} messages`;
        }
    }

    selectEmail(index) {
        const email = this.emails[this.currentFolder][index];
        if (!email) return;

        // Mark as read
        if (!email.read) {
            email.read = true;
            this.saveCurrentUser();
            this.updateEmailList();
        }

        // Show email in proper viewer
        this.showEmailViewer(email);
    }

    showEmailViewer(email) {
        const viewer = document.getElementById('emailViewer');
        const content = document.getElementById('emailViewerContent');
        
        if (!viewer || !content) return;

        // Format the email content with proper styling
        const isSpam = email.isSpam ? '<div style="background: #ffe6e6; border: 1px solid #ff9999; padding: 8px; margin-bottom: 10px; color: #cc0000; font-size: 11px;"><strong>⚠️ Warning:</strong> This message may be spam. Be cautious of suspicious links or requests.</div>' : '';
        const isCorporate = email.isCorporate ? '<div style="background: #e6f3ff; border: 1px solid #007bff; padding: 8px; margin-bottom: 10px; color: #0066cc; font-size: 11px;"><strong>🏢 Corporate Communication:</strong> Official message from ElxaCorp ' + (email.department ? email.department.replace('elxacorp_', '').toUpperCase() : '') + ' department.</div>' : '';
        
        content.innerHTML = `
            ${isSpam}
            ${isCorporate}
            <div style="border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 15px;">
                <div style="font-weight: bold; font-size: 12px; margin-bottom: 5px;">${email.subject || '(no subject)'}</div>
                <div style="font-size: 10px; color: #666; margin-bottom: 3px;">
                    <strong>From:</strong> ${email.fromName || email.from} &lt;${email.from}&gt;
                </div>
                <div style="font-size: 10px; color: #666; margin-bottom: 3px;">
                    <strong>To:</strong> ${email.to}
                </div>
                <div style="font-size: 10px; color: #666;">
                    <strong>Date:</strong> ${this.formatFullDate(email.date)}
                </div>
            </div>
            <div style="font-size: 11px; line-height: 1.4; white-space: pre-wrap; font-family: Arial, sans-serif;">
                ${email.body}
            </div>
            <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #e0e0e0;">
                <button class="elxamail-btn elxamail-btn-primary" onclick="elxaMailSystem.replyToEmail(${JSON.stringify(email).replace(/"/g, '&quot;')})">
                    📧 Reply
                </button>
                <button class="elxamail-btn" onclick="elxaMailSystem.forwardEmail(${JSON.stringify(email).replace(/"/g, '&quot;')})">
                    📨 Forward
                </button>
                <button class="elxamail-btn" onclick="elxaMailSystem.deleteEmailFromViewer(${JSON.stringify(email).replace(/"/g, '&quot;')})">
                    🗑️ Delete
                </button>
            </div>
        `;

        viewer.classList.remove('hidden');
        
        // Hide email list to make room for viewer
        document.getElementById('emailListContainer').style.display = 'none';
    }

    closeEmailViewer() {
        const viewer = document.getElementById('emailViewer');
        if (viewer) {
            viewer.classList.add('hidden');
        }
        
        // Show email list again
        document.getElementById('emailListContainer').style.display = 'block';
    }

    deleteEmailFromViewer(email) {
        // Find the email in current folder and delete it
        const emailIndex = this.emails[this.currentFolder].findIndex(e => e.id === email.id);
        if (emailIndex !== -1) {
            // Move to trash or permanently delete
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
    }

    formatFullDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString([], { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    toggleEmailSelection(index) {
        if (this.selectedEmails.has(index)) {
            this.selectedEmails.delete(index);
        } else {
            this.selectedEmails.add(index);
        }
        
        this.updateBulkActionsVisibility();
        this.updateSelectAllCheckbox();
    }

    // ===== BULK ACTIONS =====

    updateBulkActionsVisibility() {
        const bulkActions = document.getElementById('elxamailBulkActions');
        if (bulkActions) {
            if (this.selectedEmails.size > 0) {
                bulkActions.classList.add('active');
            } else {
                bulkActions.classList.remove('active');
            }
        }
    }

    hideBulkActions() {
        const bulkActions = document.getElementById('elxamailBulkActions');
        if (bulkActions) {
            bulkActions.classList.remove('active');
        }
        this.selectedEmails.clear();
    }

    updateBulkActionsForFolder() {
        const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
        const bulkDeletePermanentBtn = document.getElementById('bulkDeletePermanentBtn');
        
        if (this.currentFolder === 'trash') {
            if (bulkDeleteBtn) bulkDeleteBtn.classList.add('hidden');
            if (bulkDeletePermanentBtn) bulkDeletePermanentBtn.classList.remove('hidden');
        } else {
            if (bulkDeleteBtn) bulkDeleteBtn.classList.remove('hidden');
            if (bulkDeletePermanentBtn) bulkDeletePermanentBtn.classList.add('hidden');
        }
    }

    updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('selectAllEmails');
        if (!selectAllCheckbox) return;
        
        const totalEmails = this.emails[this.currentFolder].length;
        const selectedCount = this.selectedEmails.size;
        
        if (selectedCount === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (selectedCount === totalEmails) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    }

    toggleSelectAll() {
        const selectAllCheckbox = document.getElementById('selectAllEmails');
        if (!selectAllCheckbox) return;
        
        if (selectAllCheckbox.checked) {
            // Select all emails
            this.selectedEmails.clear();
            for (let i = 0; i < this.emails[this.currentFolder].length; i++) {
                this.selectedEmails.add(i);
            }
        } else {
            // Deselect all emails
            this.selectedEmails.clear();
        }
        
        // Update individual checkboxes
        const checkboxes = document.querySelectorAll('.elxamail-email-checkbox');
        checkboxes.forEach((checkbox, index) => {
            checkbox.checked = this.selectedEmails.has(index);
        });
        
        this.updateBulkActionsVisibility();
    }

    bulkMarkRead() {
        if (this.selectedEmails.size === 0) {
            this.showError('Please select emails to mark as read.');
            return;
        }

        this.selectedEmails.forEach(index => {
            const email = this.emails[this.currentFolder][index];
            if (email) {
                email.read = true;
            }
        });

        this.selectedEmails.clear();
        this.saveCurrentUser();
        this.updateEmailList();
        this.showSuccess('Selected emails marked as read.');
    }

    bulkMarkUnread() {
        if (this.selectedEmails.size === 0) {
            this.showError('Please select emails to mark as unread.');
            return;
        }

        this.selectedEmails.forEach(index => {
            const email = this.emails[this.currentFolder][index];
            if (email) {
                email.read = false;
            }
        });

        this.selectedEmails.clear();
        this.saveCurrentUser();
        this.updateEmailList();
        this.showSuccess('Selected emails marked as unread.');
    }

    bulkDelete() {
        if (this.selectedEmails.size === 0) {
            this.showError('Please select emails to delete.');
            return;
        }

        const emailsToDelete = Array.from(this.selectedEmails).sort((a, b) => b - a);
        
        emailsToDelete.forEach(index => {
            const email = this.emails[this.currentFolder][index];
            if (email) {
                // Move to trash
                this.emails.trash.unshift(email);
                this.emails[this.currentFolder].splice(index, 1);
            }
        });

        this.selectedEmails.clear();
        this.saveCurrentUser();
        this.updateEmailList();
        this.showSuccess('Selected emails moved to trash.');
    }

    bulkDeletePermanently() {
        if (this.selectedEmails.size === 0) {
            this.showError('Please select emails to delete permanently.');
            return;
        }

        if (!confirm(`Are you sure you want to permanently delete ${this.selectedEmails.size} email(s)? This cannot be undone!`)) {
            return;
        }

        const emailsToDelete = Array.from(this.selectedEmails).sort((a, b) => b - a);
        
        emailsToDelete.forEach(index => {
            this.emails.trash.splice(index, 1);
        });

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
        
        // Clear form
        document.getElementById('composeTo').value = '';
        document.getElementById('composeSubject').value = '';
        document.getElementById('composeBody').value = '';
        
        // Focus on To field
        setTimeout(() => {
            document.getElementById('composeTo').focus();
        }, 100);
    }

    composeToContact(email) {
        this.showCompose();
        document.getElementById('composeTo').value = email;
        document.getElementById('composeSubject').focus();
    }

    cancelCompose() {
        this.composeMode = false;
        document.getElementById('composeWindow').classList.add('hidden');
        document.getElementById('emailListContainer').style.display = 'block';
        this.closeEmailViewer(); // Also close email viewer when canceling compose
    }

    async sendEmail() {
        const to = document.getElementById('composeTo').value.trim();
        const subject = document.getElementById('composeSubject').value.trim();
        const body = document.getElementById('composeBody').value.trim();

        if (!to) {
            this.showError('Please enter a recipient email address.');
            return;
        }

        if (!subject && !body) {
            this.showError('Please enter a subject or message.');
            return;
        }

        // Create email object
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

        // Add to sent folder
        this.emails.sent.unshift(email);
        
        // Add to conversation history if enabled
        const contact = this.contacts.find(c => c.email.toLowerCase() === to.toLowerCase());
        if (contact && this.conversationManager) {
            this.conversationManager.addMessage(contact.id, {
                type: 'email',
                sender: 'user',
                content: body,
                subject: subject,
                timestamp: email.date,
                platform: 'email'
            });
        }
        
        // Save user data
        this.saveCurrentUser();
        
        // Cancel compose
        this.cancelCompose();
        
        this.showSuccess('Message sent successfully!');
        
        // Check if this is to a character and generate auto-reply
        if (contact && contact.autoReply) {
            this.scheduleAutoReply(contact, email);
        }
        
        // Update display
        if (this.currentFolder === 'sent') {
            this.updateEmailList();
        }
    }

    saveDraft() {
        const to = document.getElementById('composeTo').value.trim();
        const subject = document.getElementById('composeSubject').value.trim();
        const body = document.getElementById('composeBody').value.trim();

        if (!to && !subject && !body) {
            this.showError('Draft is empty.');
            return;
        }

        const draft = {
            id: Date.now() + Math.random(),
            from: this.currentUser.email,
            fromName: this.currentUser.displayName,
            to: to,
            subject: subject || '(no subject)',
            body: body,
            date: new Date().toISOString(),
            read: true,
            isDraft: true
        };

        // Add to drafts folder
        this.emails.drafts.unshift(draft);
        
        // Save user data
        this.saveCurrentUser();
        
        this.showSuccess('Draft saved successfully!');
        
        // Update display if viewing drafts
        if (this.currentFolder === 'drafts') {
            this.updateEmailList();
        }
    }

    // ===== AUTO-REPLY SYSTEM WITH LLM INTEGRATION =====

    async scheduleAutoReply(contact, originalEmail) {
        // Schedule a response after a realistic delay (30 seconds to 5 minutes)
        const delay = Math.random() * (5 * 60 * 1000 - 30 * 1000) + 30 * 1000;
        
        console.log(`📧 Scheduling auto-reply from ${contact.name} in ${Math.round(delay/1000)} seconds`);
        
        setTimeout(async () => {
            try {
                const response = await this.generateCharacterResponse(contact, originalEmail);
                if (response) {
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

                    // Add to inbox
                    this.emails.inbox.unshift(replyEmail);
                    
                    // Add to conversation history if enabled
                    if (this.conversationManager) {
                        this.conversationManager.addMessage(contact.id, {
                            type: 'email',
                            sender: 'character',
                            content: response,
                            subject: `Re: ${originalEmail.subject}`,
                            timestamp: replyEmail.date,
                            platform: 'email'
                        });
                    }
                    
                    // Save user data
                    this.saveCurrentUser();
                    
                    // Update display if viewing inbox
                    if (this.currentFolder === 'inbox') {
                        this.updateEmailList();
                    }
                    
                    // Show notification
                    this.showSuccess(`New message from ${contact.name}!`);
                    
                    console.log(`✅ Auto-reply delivered from ${contact.name}`);
                }
            } catch (error) {
                console.error('❌ Failed to generate auto-reply:', error);
            }
        }, delay);
    }

    async generateCharacterResponse(contact, originalEmail) {
        console.log(`🤖 Generating response for ${contact.name} (${contact.id})`);
        
        // Try LLM first if available
        if (this.llmService && this.llmService.isAvailable()) {
            try {
                console.log('🤖 Using LLM service for character response...');
                const llmResponse = await this.llmService.generateCharacterResponse(contact, originalEmail);
                if (llmResponse) {
                    console.log('✅ LLM response generated successfully');
                    return llmResponse;
                }
            } catch (error) {
                console.error('❌ LLM response failed, falling back to templates:', error);
            }
        } else {
            console.log('⚠️ LLM service not available, using template responses');
        }
        
        // Fallback to template responses from conversation history manager or local templates
        if (this.conversationManager && this.conversationManager.worldContext) {
            // Use world context for character info to generate appropriate fallback
            const character = this.conversationManager.worldContext.keyCharacters[contact.id];
            if (character) {
                return this.generateContextualFallback(character, originalEmail);
            }
        }
        
        // Legacy fallback system
        const responses = this.characterResponses[contact.id];
        if (responses && responses.length > 0) {
            const templateResponse = responses[Math.floor(Math.random() * responses.length)];
            console.log('📝 Using template response');
            return templateResponse;
        }

        // Final fallback to default response
        console.log('📝 Using default fallback response');
        return this.defaultResponse
            .replace('{contactName}', contact.name)
            .replace('{contactTitle}', contact.title || '');
    }

    generateContextualFallback(character, originalEmail) {
        // Generate a more contextual fallback based on character info from world context
        const responses = {
            'mr_snake_e': `Thank you for your email regarding "${originalEmail.subject}". I'll review this matter and respond accordingly.\n\nBest regards,\n${character.fullName}\nCEO, ElxaCorp\n\n"Innovation drives everything we do."`,
            'mrs_snake_e': `Dear, what a lovely message! I'm so glad you wrote to me about "${originalEmail.subject}". I'll write back soon with a proper response.\n\nWith love and garden-fresh wishes,\n${character.fullName}`,
            'remi': `yo thanks for the message about "${originalEmail.subject}"! been super busy with youtube stuff and minecraft but ill get back to you soon 🎮\n\nstay cool,\n${character.fullName}`,
            'rita': `Hi! Thanks so much for writing about "${originalEmail.subject}". I really appreciate you reaching out. I'll respond properly soon! 💕\n\nTake care,\n${character.fullName}`,
            'pushing_cat': `*suspicious cat noises* 🐱\n\nmeow meow i got your message about "${originalEmail.subject}" but im busy being sus in my lair right now\n\n-${character.fullName} (definitely not plotting anything)`
        };
        
        return responses[character.id] || `Thank you for your message about "${originalEmail.subject}". I will respond soon.\n\nBest regards,\n${character.fullName}`;
    }

    // ===== SPAM SYSTEM =====

    scheduleSpamGeneration() {
        if (!this.isLoggedIn) return;

        // Generate spam every 10-30 minutes (much slower!)
        const delay = Math.random() * (30 * 60 * 1000 - 10 * 60 * 1000) + 10 * 60 * 1000;
        
        setTimeout(() => {
            if (this.isLoggedIn && Math.random() < 0.3) { // 30% chance (reduced from 70%)
                this.generateSpamEmail();
            }
            this.scheduleSpamGeneration(); // Schedule next potential spam
        }, delay);
    }

    generateSpamEmail() {
        // UPDATED: Now uses loaded spam templates instead of hardcoded ones
        if (!this.spamTemplates || this.spamTemplates.length === 0) {
            console.log('⚠️ No spam templates loaded, skipping spam generation');
            return;
        }
        
        const template = this.spamTemplates[Math.floor(Math.random() * this.spamTemplates.length)];
        
        const spamEmail = {
            id: Date.now() + Math.random(),
            from: template.from,
            fromName: template.fromName,
            to: this.currentUser.email,
            subject: template.subject,
            body: template.body,
            date: new Date().toISOString(),
            read: false,
            isSpam: true
        };

        // Add to inbox
        this.emails.inbox.unshift(spamEmail);
        
        // Save user data
        this.saveCurrentUser();
        
        // Update display if viewing inbox
        if (this.currentFolder === 'inbox') {
            this.updateEmailList();
        }
    }

    generateWelcomeEmails() {
        const welcomeEmails = [
            {
                id: Date.now() + Math.random(),
                from: 'welcome@elxacorp.ex',
                fromName: 'ElxaMail Team',
                to: this.currentUser.email,
                subject: '🎉 Welcome to ElxaMail!',
                body: `Dear ${this.currentUser.displayName},\n\nWelcome to ElxaMail, Snakesia's premier email service!\n\nYour account ${this.currentUser.email} is now active and ready to use.\n\nFeatures you'll love:\n• Reliable email delivery\n• 100MB storage space\n• Spam filtering\n• Contact management\n• Mobile access\n\nIf you have any questions, reply to this email or visit our help center.\n\nWelcome to the family!\n\nThe ElxaMail Team\nElxaCorp Communications Division`,
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
                date: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
                read: false,
            }
        ];

        // Add welcome emails to inbox
        welcomeEmails.forEach(email => {
            this.emails.inbox.push(email);
        });

        this.saveCurrentUser();
    }

    // ===== EMAIL ACTIONS =====

    refreshEmails() {
        this.updateEmailList();
        this.showSuccess('Emails refreshed!');
    }

    deleteSelected() {
        if (this.selectedEmails.size === 0) {
            this.showError('Please select emails to delete.');
            return;
        }

        if (this.currentFolder === 'trash') {
            // Permanent deletion from trash
            if (!confirm(`Are you sure you want to permanently delete ${this.selectedEmails.size} email(s)? This cannot be undone!`)) {
                return;
            }
            
            const emailsToDelete = Array.from(this.selectedEmails).sort((a, b) => b - a);
            
            emailsToDelete.forEach(index => {
                this.emails.trash.splice(index, 1);
            });

            this.selectedEmails.clear();
            this.saveCurrentUser();
            this.updateEmailList();
            this.showSuccess('Selected emails deleted permanently.');
        } else {
            // Move to trash
            const emailsToDelete = Array.from(this.selectedEmails).sort((a, b) => b - a);
            
            emailsToDelete.forEach(index => {
                const email = this.emails[this.currentFolder][index];
                if (email) {
                    this.emails.trash.unshift(email);
                    this.emails[this.currentFolder].splice(index, 1);
                }
            });

            this.selectedEmails.clear();
            this.saveCurrentUser();
            this.updateEmailList();
            this.showSuccess('Selected emails moved to trash.');
        }
    }

    markAsRead() {
        if (this.selectedEmails.size === 0) {
            this.showError('Please select emails to mark as read.');
            return;
        }

        this.selectedEmails.forEach(index => {
            const email = this.emails[this.currentFolder][index];
            if (email) {
                email.read = true;
            }
        });

        this.selectedEmails.clear();
        this.saveCurrentUser();
        this.updateEmailList();
        this.showSuccess('Selected emails marked as read.');
    }

    markAsUnread() {
        if (this.selectedEmails.size === 0) {
            this.showError('Please select emails to mark as unread.');
            return;
        }

        this.selectedEmails.forEach(index => {
            const email = this.emails[this.currentFolder][index];
            if (email) {
                email.read = false;
            }
        });

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
        
        // Position menu
        contextMenu.style.left = event.pageX + 'px';
        contextMenu.style.top = event.pageY + 'px';
        contextMenu.classList.remove('hidden');
        
        // Update menu items based on email state and current folder
        const email = this.emails[this.currentFolder][index];
        const markReadItem = contextMenu.querySelector('[data-action="markRead"]');
        const markUnreadItem = contextMenu.querySelector('[data-action="markUnread"]');
        const moveToTrashItem = contextMenu.querySelector('[data-action="moveToTrash"]');
        const deleteItem = contextMenu.querySelector('[data-action="delete"]');
        
        if (email && email.read) {
            markReadItem.style.display = 'none';
            markUnreadItem.style.display = 'block';
        } else {
            markReadItem.style.display = 'block';
            markUnreadItem.style.display = 'none';
        }
        
        // Update delete options based on current folder
        if (this.currentFolder === 'trash') {
            moveToTrashItem.style.display = 'none';
            deleteItem.textContent = '💀 Delete Forever';
            deleteItem.style.color = '#cc0000';
            deleteItem.style.fontWeight = 'bold';
        } else {
            moveToTrashItem.style.display = 'block';
            deleteItem.textContent = '❌ Delete Permanently';
            deleteItem.style.color = '';
            deleteItem.style.fontWeight = '';
        }
    }

    hideContextMenu() {
        const contextMenu = document.getElementById('emailContextMenu');
        contextMenu.classList.add('hidden');
        this.contextMenuEmail = null;
    }

    handleContextAction(action) {
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
                    // Permanent deletion from trash
                    if (confirm('Are you sure you want to permanently delete this email? This cannot be undone!')) {
                        this.emails.trash.splice(index, 1);
                        this.showSuccess('Email deleted permanently.');
                        this.saveCurrentUser();
                        this.updateEmailList();
                    }
                } else {
                    // Move to trash
                    this.emails.trash.unshift(email);
                    this.emails[this.currentFolder].splice(index, 1);
                    this.showSuccess('Email moved to trash.');
                    this.saveCurrentUser();
                    this.updateEmailList();
                }
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

    // ===== UTILITY METHODS =====

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays <= 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    }

    clearRegistrationForm() {
        const fields = ['regDisplayName', 'regUsername', 'regPassword', 'regConfirmPassword'];
        fields.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });
    }

    // ===== STORAGE METHODS =====

    saveUser(userData) {
        try {
            console.log(`💾 Saving user ${userData.username}...`);
            
            // Save to localStorage (primary storage)
            localStorage.setItem(`elxaOS-mail-user-${userData.username}`, JSON.stringify(userData));
            console.log(`✅ Saved user ${userData.username} to localStorage`);
            
            // Also try to save to ElxaOS file system if available
            try {
                if (typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
                    const fileName = `mail-user-${userData.username}.json`;
                    const content = JSON.stringify(userData, null, 2);
                    
                    // Ensure the Mail folder exists
                    try {
                        elxaOS.fileSystem.createFolder(['root', 'System'], 'Mail');
                    } catch (e) {
                        // Folder probably already exists, that's fine
                    }
                    
                    elxaOS.fileSystem.createFile(['root', 'System', 'Mail'], fileName, content, 'json');
                    console.log(`✅ Also saved user ${userData.username} to ElxaOS file system`);
                }
            } catch (fsError) {
                console.log('📁 ElxaOS file system not available or failed, but localStorage succeeded');
            }
            
        } catch (error) {
            console.error('❌ Failed to save user data:', error);
        }
    }

    loadUser(username) {
        try {
            console.log(`📁 Loading user ${username}...`);
            
            // First try localStorage (primary storage)
            const localStorageData = localStorage.getItem(`elxaOS-mail-user-${username}`);
            if (localStorageData) {
                const userData = JSON.parse(localStorageData);
                console.log(`✅ Loaded user ${username} from localStorage`);
                return userData;
            }
            
            // If not found in localStorage, try ElxaOS file system
            if (typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
                try {
                    const fileName = `mail-user-${username}.json`;
                    const file = elxaOS.fileSystem.getFile(['root', 'System', 'Mail'], fileName);
                    if (file && file.content) {
                        const userData = JSON.parse(file.content);
                        console.log(`✅ Loaded user ${username} from ElxaOS file system`);
                        
                        // Save to localStorage for future quick access
                        localStorage.setItem(`elxaOS-mail-user-${username}`, JSON.stringify(userData));
                        console.log(`✅ Cached user ${username} to localStorage`);
                        
                        return userData;
                    }
                } catch (fsError) {
                    console.log('📁 ElxaOS file system failed, but that\'s okay');
                }
            }
            
            console.log(`❌ User ${username} not found in any storage`);
            return null;
        } catch (error) {
            console.error('❌ Failed to load user data:', error);
            return null;
        }
    }

    userExists(username) {
        const userData = this.loadUser(username);
        return userData !== null;
    }

    saveCurrentUser() {
        if (this.currentUser) {
            // Update current user data with latest email folders
            this.currentUser.folders = this.emails;
            this.saveUser(this.currentUser);
        }
    }

    saveUserSession() {
        try {
            const sessionData = {
                username: this.currentUser.username,
                loginTime: Date.now()
            };
            
            // Save session to localStorage (primary)
            localStorage.setItem('elxaOS-mail-session', JSON.stringify(sessionData));
            console.log('💾 Saved mail session to localStorage');
            
            // Also try to save to ElxaOS file system
            if (typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
                try {
                    // Ensure the Mail folder exists
                    try {
                        elxaOS.fileSystem.createFolder(['root', 'System'], 'Mail');
                    } catch (e) {
                        // Folder probably already exists, that's fine
                    }
                    
                    elxaOS.fileSystem.createFile(['root', 'System', 'Mail'], 'mail-session.json', JSON.stringify(sessionData), 'json');
                    console.log('✅ Also saved mail session to ElxaOS file system');
                } catch (fsError) {
                    console.log('📁 ElxaOS file system not available for session, but localStorage succeeded');
                }
            }
        } catch (error) {
            console.error('❌ Failed to save mail session:', error);
        }
    }

    loadUserSession() {
        try {
            let sessionData = null;
            
            // First try localStorage (primary)
            const localStorageSession = localStorage.getItem('elxaOS-mail-session');
            if (localStorageSession) {
                sessionData = JSON.parse(localStorageSession);
                console.log('📁 Loaded mail session from localStorage');
            }
            
            // If not found, try ElxaOS file system
            if (!sessionData && typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
                try {
                    const file = elxaOS.fileSystem.getFile(['root', 'System', 'Mail'], 'mail-session.json');
                    if (file && file.content) {
                        sessionData = JSON.parse(file.content);
                        console.log('📁 Loaded mail session from ElxaOS file system');
                        
                        // Cache to localStorage for future
                        localStorage.setItem('elxaOS-mail-session', JSON.stringify(sessionData));
                    }
                } catch (fsError) {
                    console.log('📁 ElxaOS file system session load failed');
                }
            }

            if (sessionData) {
                // Check if session is still valid (24 hours)
                const sessionAge = Date.now() - sessionData.loginTime;
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours

                if (sessionAge < maxAge) {
                    // Restore user session
                    const userData = this.loadUser(sessionData.username);
                    if (userData) {
                        this.currentUser = userData;
                        this.isLoggedIn = true;
                        this.emails = userData.folders || {
                            inbox: [],
                            sent: [],
                            drafts: [],
                            trash: []
                        };
                        console.log('✅ Mail user session restored for:', userData.username);
                        return true;
                    }
                } else {
                    console.log('⏰ Mail session expired, clearing...');
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
            // Clear from localStorage
            localStorage.removeItem('elxaOS-mail-session');
            console.log('🗑️ Cleared mail session from localStorage');
            
            // Also try to clear from ElxaOS file system
            if (typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
                try {
                    elxaOS.fileSystem.deleteItem(['root', 'System', 'Mail'], 'mail-session.json');
                    console.log('🗑️ Also cleared mail session from ElxaOS file system');
                } catch (e) {
                    // File might not exist, that's okay
                }
            }
        } catch (error) {
            console.error('❌ Failed to clear mail session:', error);
        }
    }

    loadSettings() {
        // Load API settings for LLM integration (similar to messenger)
        try {
            const messengerSettings = localStorage.getItem('snakesia-messenger-settings');
            if (messengerSettings) {
                const settings = JSON.parse(messengerSettings);
                // LLM service will load these automatically
                console.log('🔧 API settings available for LLM integration');
            }
        } catch (error) {
            console.log('No messenger settings found for API integration');
        }
    }

    // ===== MESSAGE DISPLAY - FIXED: Toast-style notifications =====

    showError(message) {
        this.createToastMessage(message, 'error');
    }

    showSuccess(message) {
        this.createToastMessage(message, 'success');
    }

    showInfo(message) {
        this.createToastMessage(message, 'info');
    }

    createToastMessage(message, type) {
        // Clear any existing messages first
        this.clearMessages();
        
        // Create toast message element
        const toast = document.createElement('div');
        toast.className = `elxamail-toast elxamail-toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 300px;
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 11px;
            font-family: Arial, sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            ${type === 'error' ? 'background: #ffe6e6; border: 1px solid #ff9999; color: #cc0000;' :
              type === 'success' ? 'background: #e6ffe6; border: 1px solid #99ff99; color: #006600;' :
              'background: #e6f3ff; border: 1px solid #99ccff; color: #0066cc;'}
        `;
        toast.textContent = message;
        
        // Add close button
        const closeBtn = document.createElement('span');
        closeBtn.innerHTML = '✖';
        closeBtn.style.cssText = `
            float: right;
            margin-left: 10px;
            cursor: pointer;
            font-weight: bold;
            opacity: 0.7;
        `;
        closeBtn.onclick = () => this.removeToastMessage(toast);
        toast.appendChild(closeBtn);
        
        // Add to document
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto-remove after delay
        const delay = type === 'error' ? 6000 : 4000;
        setTimeout(() => {
            this.removeToastMessage(toast);
        }, delay);
        
        // Store reference for cleanup
        toast.setAttribute('data-elxamail-toast', 'true');
    }

    removeToastMessage(toast) {
        if (!toast || !toast.parentNode) return;
        
        // Animate out
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        
        // Remove after animation
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    clearMessages() {
        // Remove all existing toast messages
        const existingToasts = document.querySelectorAll('[data-elxamail-toast="true"]');
        existingToasts.forEach(toast => {
            this.removeToastMessage(toast);
        });
        
        // Also remove any old-style messages that might still exist
        const oldMessages = document.querySelectorAll('.elxamail-error, .elxamail-success, .elxamail-info');
        oldMessages.forEach(msg => {
            if (msg.parentNode) {
                msg.parentNode.removeChild(msg);
            }
        });
    }

    showHelp() {
        alert('ElxaMail Help\n\nFeatures:\n• Send and receive emails\n• Organize emails in folders\n• Right-click emails for more options\n• Compose new messages\n• Contact management\n\nFor technical support, contact: help@elxacorp.ex');
    }
}

// Create global instance and initialize
window.elxaMailSystem = new ElxaMailSystem();

// Initialize when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🔄 DOM loaded, initializing ElxaMail...');
        elxaMailSystem.init();
    });
} else {
    // DOM already loaded
    console.log('🔄 DOM already loaded, initializing ElxaMail immediately...');
    elxaMailSystem.init();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ElxaMailSystem;
}