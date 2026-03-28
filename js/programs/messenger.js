// =================================
// SNAKESIA MESSENGER - Main Program with Enhanced Conversation History Integration
// =================================
class MessengerProgram {
    constructor(windowManager, fileSystem, eventBus) {
        this.windowManager = windowManager;
        this.fileSystem = fileSystem;
        this.eventBus = eventBus;
        this.isOpen = false;
        this.currentContact = null;
        this.documentClickHandler = null; // Track document-level listener for cleanup

        // Conversation history integration
        this.conversationManager = null;
        this.worldContext = null;
        this.contacts = []; // Will be loaded from world context

        // Character responses for fallbacks
        this.characterResponses = {};
        this.defaultResponse = '';

        this.settings = {
            username: '',
            password: '',
            about: '',
            apiKey: '',
            selectedModel: 'gemini-2.5-flash',
            availableModels: [
                'gemini-2.5-flash',
                'gemini-2.5-flash-lite',
                'gemini-2.5-pro'
            ],
            llm: {
                enabled: true,
                crossPlatformHistory: true,
                historyLength: 25,
                storyProgression: 'balanced',
                responseLength: 'normal',
                autoSummarize: true,
                maxTokens: {
                    brief: 80,
                    normal: 120,
                    detailed: 180
                }
            },
            theme: {
                chatBackground: '#f0f8ff',
                myBubbleColor: '#007bff',
                theirBubbleColor: '#e9ecef',
                myTextColor: '#ffffff',
                theirTextColor: '#000000',
                fontFamily: 'Segoe UI',
                fontSize: '12px'
            }
        };
        this.firstTimeSetup = true;
        this.contextMenuContact = null;

        // Emoji categories for the picker
        this.emojiCategories = {
            'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '😵', '🤯'],
            'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐙', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🐢', '🐍', '🦎', '🐙', '🦑', '🦐', '🦞', '🦀'],
            'Food': ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥒', '🌶️', '🌽', '🥕', '🥔', '🍠', '🥐', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🌮', '🌯', '🥙', '🧆', '🥘', '🍝'],
            'Activities': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏃', '🚶', '🧗', '🤳'],
            'Objects': ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎬', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⏳', '⌛', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷'],
            'Snakesia': ['🐍', '🏢', '💼', '🚗', '💰', '🌟', '👑', '🎯', '🚀', '⚡', '🔥', '💎', '🏆', '🎊', '🎉', '✨', '🌈', '☀️', '🌙', '⭐', '💫', '🌸', '🌻', '🌺', '🌷', '🌹', '🎂', '🍰', '🧁', '🍪', '🍫', '🍬', '🍭', '🎪', '🎨', '🎭', '🎼', '🎵', '🎶', '🎤', '🎧', '📚', '📖', '✏️', '🖍️', '📝', '📌', '📍']
        };

        // Register window close handler once (not in launch)
        this.eventBus.on('window.closed', (data) => {
            if (data.id === 'messenger') {
                this.isOpen = false;
                this.cleanupOnClose();
            }
        });

        this.initializeManagers();
        this.loadSettings();
    }

    // ===== LIFECYCLE =====

    cleanupOnClose() {
        // Remove document-level click listener
        if (this.documentClickHandler) {
            document.removeEventListener('click', this.documentClickHandler);
            this.documentClickHandler = null;
        }

        // Remove injected theme style tag
        const themeStyle = document.getElementById('messengerThemeStyle');
        if (themeStyle) themeStyle.remove();
    }

    // ===== INITIALIZATION =====

    async initializeManagers() {
        try {
            console.log('🔄 Initializing conversation managers...');

            let conversationManager = null;
            let worldContext = null;

            if (window.conversationHistoryManager) {
                conversationManager = window.conversationHistoryManager;
                console.log('✅ Found conversation history manager globally');

                // Wait for world context to finish loading (it's async)
                if (conversationManager.worldContextReady) {
                    await conversationManager.worldContextReady;
                }
                worldContext = conversationManager.worldContext;
            } else {
                console.log('⚠️ Conversation history manager not found, trying to load world context directly...');
                try {
                    const response = await fetch('./assets/interwebs/exmail/world-context.json');
                    if (response.ok) {
                        worldContext = await response.json();
                        console.log('✅ Loaded world context directly from JSON');
                    } else {
                        throw new Error(`Failed to load world context: ${response.status}`);
                    }
                } catch (error) {
                    console.error('❌ Failed to load world context directly:', error);
                }
            }

            this.conversationManager = conversationManager;
            this.worldContext = worldContext;

            if (this.worldContext) {
                console.log('🌍 World context available');
                if (this.worldContext.keyCharacters) {
                    console.log('👥 Available characters in world context:', Object.keys(this.worldContext.keyCharacters));
                }
            } else {
                console.log('⚠️ No world context available');
            }

            await this.loadCharactersFromWorldContext();
            await this.loadCharacterResponses();
        } catch (error) {
            console.error('❌ Failed to initialize managers:', error);
            console.log('🔄 Loading fallback characters due to error...');
            this.loadFallbackCharacters();
        }
    }

    async loadCharacterResponses() {
        try {
            console.log('📁 Loading character responses from JSON...');
            const response = await fetch('./assets/interwebs/exmail/character-responses.json');
            if (!response.ok) {
                throw new Error(`Failed to load character responses: ${response.status}`);
            }
            const data = await response.json();
            this.characterResponses = data.responses || {};
            this.defaultResponse = data.defaultResponse || 'Thanks for your message! I\'ll respond soon.';
            console.log(`✅ Loaded fallback responses for ${Object.keys(this.characterResponses).length} characters`);
        } catch (error) {
            console.error('❌ Failed to load character responses:', error);
            this.characterResponses = {};
            this.defaultResponse = 'Thanks for your message! I\'ll respond soon.';
        }
    }

    async loadCharactersFromWorldContext() {
        if (!this.worldContext || !this.worldContext.keyCharacters) {
            console.log('⚠️ No world context available, using fallback characters');
            this.loadFallbackCharacters();
            return;
        }

        console.log('📁 Loading characters from world context...');
        this.contacts = [];

        const characters = this.worldContext.keyCharacters;
        Object.keys(characters).forEach(characterId => {
            const char = characters[characterId];
            this.contacts.push({
                id: characterId,
                name: `${char.fullName || char.name} ${this.getCharacterEmoji(characterId)}`,
                status: char.role || 'Snakesia Resident',
                avatar: this.getCharacterEmoji(characterId),
                avatarImage: `../../assets/messenger/${characterId}.png`,
                description: char.details || char.personality || 'A friendly resident of Snakesia.',
                personality: char.personality || 'Friendly and helpful.',
                character: char
            });
        });

        console.log(`✅ Loaded ${this.contacts.length} characters from world context`);
    }

    getCharacterEmoji(characterId) {
        const emojiMap = {
            'mr_snake_e': '🐍',
            'mrs_snake_e': '🌻',
            'remi': '🎮',
            'rita': '👩‍🦰',
            'pushing_cat': '😼',
            'elxacorp_hr': '📋',
            'elxacorp_it': '💻',
            'elxacorp_news': '📰'
        };
        return emojiMap[characterId] || '👤';
    }

    loadFallbackCharacters() {
        console.log('⚠️ World context not available - using minimal fallback characters');
        this.contacts = [
            {
                id: 'mr_snake_e',
                name: 'Mr. Snake-e 🐍',
                status: 'CEO of ElxaCorp',
                avatar: '🐍',
                avatarImage: '../../assets/messenger/mr_snake_e.png',
                description: 'CEO of ElxaCorp',
                personality: 'Professional business leader, tech-savvy and friendly.'
            }
        ];
    }

    launch() {
        if (this.isOpen) {
            this.windowManager.focusWindow('messenger');
            return;
        }

        const win = this.windowManager.createWindow(
            'messenger',
            `${ElxaIcons.render('messenger', 'ui')} Snakesia Messenger`,
            this.createInterface(),
            { width: '800px', height: '600px', x: '150px', y: '100px' }
        );

        this.isOpen = true;
        this.setupEventHandlers();

        // Show setup if first time
        if (this.firstTimeSetup || !this.settings.username) {
            setTimeout(() => this.showFirstTimeSetup(), 500);
        }
    }

    createInterface() {
        return `
            <div class="messenger-container">
                <!-- Setup Modal -->
                <div class="messenger-setup-modal" id="messengerSetupModal" style="display: none;">
                    <div class="messenger-setup-content">
                        <h3>Welcome to Snakesia Messenger!</h3>
                        <p>Let's set up your account to chat with your friends in Snakesia!</p>

                        <div class="messenger-setup-form">
                            <div class="messenger-form-group">
                                <label>Your Username:</label>
                                <input type="text" id="setupUsername" class="messenger-input" placeholder="Enter your cool username">
                            </div>

                            <div class="messenger-form-group">
                                <label>Password:</label>
                                <input type="password" id="setupPassword" class="messenger-input" placeholder="Create a password">
                            </div>

                            <div class="messenger-form-group">
                                <label>Tell us about yourself:</label>
                                <textarea id="setupAbout" class="messenger-textarea" placeholder="What do you like? What are your hobbies? This helps your friends know you better!"></textarea>
                            </div>

                            <div class="messenger-form-group">
                                <label>Gemini API Key (ask a grown-up to help):</label>
                                <input type="password" id="setupApiKey" class="messenger-input" placeholder="Your Gemini API key">
                                <small>This lets you chat with your Snakesia friends!</small>
                            </div>

                            <div class="messenger-setup-actions">
                                <button class="messenger-btn messenger-btn-primary" onclick="elxaOS.programs.messenger.completeSetup()">
                                    Start Chatting!
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Interface -->
                <div class="messenger-main" id="messengerMain">
                    <!-- Sidebar -->
                    <div class="messenger-sidebar">
                        <div class="messenger-header">
                            <div class="messenger-user-info">
                                <div class="messenger-user-avatar">${ElxaIcons.renderAction('account')}</div>
                                <div class="messenger-user-details">
                                    <div class="messenger-username" id="messengerUsername">Guest</div>
                                    <div class="messenger-user-status">Online in Snakesia</div>
                                </div>
                            </div>
                            <div class="messenger-header-actions">
                                <button class="messenger-icon-btn" onclick="elxaOS.programs.messenger.showSettings()" title="Settings">${ElxaIcons.renderAction('settings')}</button>
                            </div>
                        </div>

                        <div class="messenger-contacts">
                            <div class="messenger-contacts-header">Snakesia Friends</div>
                            <div class="messenger-contact-list" id="messengerContactList">
                                <!-- Contacts will be populated here -->
                            </div>
                        </div>
                    </div>

                    <!-- Chat Area -->
                    <div class="messenger-chat-area" id="messengerChatArea">
                        <div class="messenger-welcome">
                            <div class="messenger-welcome-icon">${ElxaIcons.render('messenger', 'desktop')}</div>
                            <h3>Welcome to Snakesia Messenger!</h3>
                            <p>Select a friend to start chatting!</p>
                            <p><em>Remember: Snakesia is 2 hours and 1 minute ahead of us!</em></p>
                            ${this.conversationManager ? '<p><small>Cross-platform memory enabled - characters remember conversations from Email too!</small></p>' : ''}
                        </div>
                    </div>
                </div>

                <!-- Emoji Picker -->
                <div class="messenger-emoji-picker" id="messengerEmojiPicker" style="display: none;">
                    <div class="messenger-emoji-header">
                        <div class="messenger-emoji-tabs" id="messengerEmojiTabs">
                            <!-- Emoji category tabs will be populated here -->
                        </div>
                        <button class="messenger-close-btn" onclick="elxaOS.programs.messenger.hideEmojiPicker()">×</button>
                    </div>
                    <div class="messenger-emoji-content" id="messengerEmojiContent">
                        <!-- Emojis will be populated here -->
                    </div>
                </div>

                <!-- Settings Modal -->
                <div class="messenger-settings-modal" id="messengerSettingsModal" style="display: none;">
                    <div class="messenger-settings-content">
                        <div class="messenger-settings-header">
                            <h3>${ElxaIcons.renderAction('settings')} Messenger Settings</h3>
                            <button class="messenger-close-btn" onclick="elxaOS.programs.messenger.hideSettings()">×</button>
                        </div>

                        <div class="messenger-settings-tabs">
                            <button class="messenger-tab-btn active" onclick="elxaOS.programs.messenger.switchTab('account', this)">Account</button>
                            <button class="messenger-tab-btn" onclick="elxaOS.programs.messenger.switchTab('api', this)">API Settings</button>
                            <button class="messenger-tab-btn" onclick="elxaOS.programs.messenger.switchTab('llm', this)">LLM Settings</button>
                            <button class="messenger-tab-btn" onclick="elxaOS.programs.messenger.switchTab('appearance', this)">Appearance</button>
                        </div>

                        <div class="messenger-settings-body">
                            <!-- Account Tab -->
                            <div class="messenger-tab-content active" id="accountTab">
                                <div class="messenger-form-group">
                                    <label>Username:</label>
                                    <input type="text" id="settingsUsername" class="messenger-input">
                                </div>
                                <div class="messenger-form-group">
                                    <label>Password:</label>
                                    <input type="password" id="settingsPassword" class="messenger-input">
                                </div>
                                <div class="messenger-form-group">
                                    <label>About You:</label>
                                    <textarea id="settingsAbout" class="messenger-textarea"></textarea>
                                </div>
                            </div>

                            <!-- API Tab -->
                            <div class="messenger-tab-content" id="apiTab">
                                <div class="messenger-form-group">
                                    <label>Gemini API Key:</label>
                                    <input type="password" id="settingsApiKey" class="messenger-input">
                                    <small>Keep this secret! It's like your password for talking to AI friends.</small>
                                </div>
                                <div class="messenger-form-group">
                                    <label>AI Model:</label>
                                    <select id="settingsModel" class="messenger-select">
                                        <!-- Options populated dynamically -->
                                    </select>
                                    <small>Available models will refresh when you add your API key.</small>
                                </div>
                                <div class="messenger-form-group">
                                    <button class="messenger-btn" onclick="elxaOS.programs.messenger.refreshModels()">
                                        ${ElxaIcons.renderAction('refresh')} Refresh Models
                                    </button>
                                </div>
                            </div>

                            <!-- LLM Settings Tab -->
                            <div class="messenger-tab-content" id="llmTab">
                                <div class="messenger-form-group">
                                    <label>
                                        <input type="checkbox" id="llmEnabled" class="messenger-checkbox">
                                        Enable AI Character Responses
                                    </label>
                                    <small>Turn on/off AI responses. Characters will use template responses when disabled.</small>
                                </div>

                                <div class="messenger-form-group">
                                    <label>
                                        <input type="checkbox" id="crossPlatformHistory" class="messenger-checkbox">
                                        Cross-Platform Memory (Email + Messenger)
                                    </label>
                                    <small>Characters remember conversations across both Messenger and Email.</small>
                                </div>

                                <div class="messenger-form-group">
                                    <label>Conversation Memory Length:</label>
                                    <select id="historyLength" class="messenger-select">
                                        <option value="15">Short (15 messages)</option>
                                        <option value="25">Normal (25 messages)</option>
                                        <option value="40">Long (40 messages)</option>
                                    </select>
                                    <small>How many recent messages to remember before summarizing older ones.</small>
                                </div>

                                <div class="messenger-form-group">
                                    <label>Story Progression Style:</label>
                                    <select id="storyProgression" class="messenger-select">
                                        <option value="conservative">Conservative - Characters respond naturally</option>
                                        <option value="balanced">Balanced - Some proactive story elements</option>
                                        <option value="active">Active - Characters drive story forward</option>
                                    </select>
                                    <small>How actively characters advance the story and share news.</small>
                                </div>

                                <div class="messenger-form-group">
                                    <label>Response Length:</label>
                                    <select id="responseLength" class="messenger-select">
                                        <option value="brief">Brief - Very short responses</option>
                                        <option value="normal">Normal - Typical message length</option>
                                        <option value="detailed">Detailed - Longer, more descriptive</option>
                                    </select>
                                    <small>How long character responses should be.</small>
                                </div>

                                <div class="messenger-form-group">
                                    <label>
                                        <input type="checkbox" id="autoSummarize" class="messenger-checkbox">
                                        Auto-Summarize Old Conversations
                                    </label>
                                    <small>Automatically compress old messages to save memory and improve performance.</small>
                                </div>

                                <div class="messenger-pro-tips">
                                    <strong>Pro Tips:</strong><br>
                                    <small>Cross-platform memory creates more immersive conversations.
                                    Longer memory = more context but slower responses.
                                    Active story progression = more engaging but less predictable.
                                    Auto-summarize keeps the experience smooth over time.</small>
                                </div>
                            </div>

                            <!-- Appearance Tab -->
                            <div class="messenger-tab-content" id="appearanceTab">
                                <div class="messenger-form-group">
                                    <label>Chat Background:</label>
                                    <input type="color" id="chatBackground" class="messenger-color-input">
                                </div>
                                <div class="messenger-form-group">
                                    <label>Your Message Bubble Color:</label>
                                    <input type="color" id="myBubbleColor" class="messenger-color-input">
                                </div>
                                <div class="messenger-form-group">
                                    <label>Your Text Color:</label>
                                    <input type="color" id="myTextColor" class="messenger-color-input">
                                </div>
                                <div class="messenger-form-group">
                                    <label>Friend Message Bubble Color:</label>
                                    <input type="color" id="theirBubbleColor" class="messenger-color-input">
                                </div>
                                <div class="messenger-form-group">
                                    <label>Friend Text Color:</label>
                                    <input type="color" id="theirTextColor" class="messenger-color-input">
                                </div>
                                <div class="messenger-form-group">
                                    <label>Font Size:</label>
                                    <select id="fontSize" class="messenger-select">
                                        <option value="10px">Small</option>
                                        <option value="12px">Normal</option>
                                        <option value="14px">Large</option>
                                        <option value="16px">Extra Large</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="messenger-settings-actions">
                            <button class="messenger-btn messenger-btn-primary" onclick="elxaOS.programs.messenger.saveSettings()">
                                ${ElxaIcons.renderAction('save')} Save Changes
                            </button>
                            <button class="messenger-btn" onclick="elxaOS.programs.messenger.hideSettings()">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Context Menu -->
                <div class="messenger-context-menu" id="messengerContextMenu" style="display: none;">
                    <div class="messenger-context-item" onclick="elxaOS.programs.messenger.clearChatFromMenu()">
                        ${ElxaIcons.renderAction('delete')} Clear Chat History
                    </div>
                    <div class="messenger-context-item" onclick="elxaOS.programs.messenger.hideContextMenu()">
                        ${ElxaIcons.renderAction('close')} Cancel
                    </div>
                </div>
            </div>
        `;
    }

    setupEventHandlers() {
        // Initialize contacts and emoji picker
        this.populateContacts();
        this.populateEmojiPicker();
        this.updateUserInfo();
        this.applyTheme();

        // Document-level click handler for closing context menu and emoji picker
        // Store ref for cleanup on window close
        this.cleanupOnClose(); // Remove any stale handler first
        this.documentClickHandler = (e) => {
            const contextMenu = document.getElementById('messengerContextMenu');
            const emojiPicker = document.getElementById('messengerEmojiPicker');

            if (contextMenu && contextMenu.style.display === 'block' && !contextMenu.contains(e.target)) {
                this.hideContextMenu();
            }

            if (emojiPicker && emojiPicker.style.display === 'block' && !emojiPicker.contains(e.target) && !e.target.closest('.messenger-emoji-btn')) {
                this.hideEmojiPicker();
            }
        };
        document.addEventListener('click', this.documentClickHandler);

        // Scope context menu prevention to just the messenger container
        const messengerContainer = document.querySelector('.messenger-container');
        if (messengerContainer) {
            messengerContainer.addEventListener('contextmenu', (e) => {
                if (e.target.closest('.messenger-contact-item')) {
                    return;
                }
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    return;
                }
                e.preventDefault();
            });
        }
    }

    // ===== EMOJI FUNCTIONALITY =====

    populateEmojiPicker() {
        const emojiTabs = document.getElementById('messengerEmojiTabs');
        const emojiContent = document.getElementById('messengerEmojiContent');

        if (!emojiTabs || !emojiContent) return;

        emojiTabs.innerHTML = '';
        const categories = Object.keys(this.emojiCategories);

        categories.forEach((category, index) => {
            const tab = document.createElement('button');
            tab.className = `messenger-emoji-tab ${index === 0 ? 'active' : ''}`;
            tab.textContent = category;
            tab.onclick = () => this.switchEmojiCategory(category);
            emojiTabs.appendChild(tab);
        });

        this.switchEmojiCategory(categories[0]);
    }

    switchEmojiCategory(category) {
        document.querySelectorAll('.messenger-emoji-tab').forEach(tab => {
            tab.classList.toggle('active', tab.textContent === category);
        });

        const emojiContent = document.getElementById('messengerEmojiContent');
        if (!emojiContent) return;

        emojiContent.innerHTML = '';
        const emojis = this.emojiCategories[category] || [];

        emojis.forEach(emoji => {
            const emojiBtn = document.createElement('button');
            emojiBtn.className = 'messenger-emoji-item';
            emojiBtn.textContent = emoji;
            emojiBtn.title = emoji;
            emojiBtn.onclick = () => this.insertEmoji(emoji);
            emojiContent.appendChild(emojiBtn);
        });
    }

    showEmojiPicker(buttonElement) {
        const emojiPicker = document.getElementById('messengerEmojiPicker');
        if (!emojiPicker || !buttonElement) return;

        const rect = buttonElement.getBoundingClientRect();
        emojiPicker.style.left = rect.left + 'px';
        emojiPicker.style.top = (rect.top - 200) + 'px';
        emojiPicker.style.display = 'block';
        emojiPicker.style.zIndex = '5000';
    }

    hideEmojiPicker() {
        const emojiPicker = document.getElementById('messengerEmojiPicker');
        if (emojiPicker) {
            emojiPicker.style.display = 'none';
        }
    }

    insertEmoji(emoji) {
        const messageInput = document.getElementById('messengerMessageInput');
        if (!messageInput) return;

        const start = messageInput.selectionStart;
        const end = messageInput.selectionEnd;
        const text = messageInput.value;

        messageInput.value = text.substring(0, start) + emoji + text.substring(end);

        const newPosition = start + emoji.length;
        messageInput.setSelectionRange(newPosition, newPosition);
        messageInput.focus();

        this.hideEmojiPicker();
    }

    // ===== CONTACT MANAGEMENT =====

    populateContacts() {
        const contactList = document.getElementById('messengerContactList');
        if (!contactList) return;

        contactList.innerHTML = '';

        this.contacts.forEach(contact => {
            const contactElement = document.createElement('div');
            contactElement.className = 'messenger-contact-item';

            // Pass the element directly to avoid relying on implicit event
            contactElement.onclick = (e) => this.selectContact(contact.id, e.currentTarget);

            contactElement.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showContextMenu(e, contact.id);
            });

            contactElement.innerHTML = `
                <div class="messenger-contact-avatar">${this.createAvatarElement(contact)}</div>
                <div class="messenger-contact-info">
                    <div class="messenger-contact-name">${contact.name}</div>
                    <div class="messenger-contact-status">${contact.status}</div>
                </div>
                <div class="messenger-contact-indicator">
                    <div class="messenger-online-dot"></div>
                </div>
            `;

            contactList.appendChild(contactElement);
        });
    }

    createAvatarElement(contact) {
        if (contact.avatarImage) {
            return `<img src="${contact.avatarImage}" alt="${contact.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
                    <span style="display: none;">${contact.avatar}</span>`;
        }
        return contact.avatar;
    }

    selectContact(contactId, clickedElement) {
        // Remove active state from all contacts
        document.querySelectorAll('.messenger-contact-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active state to the clicked element
        if (clickedElement) {
            clickedElement.classList.add('active');
        }

        const contact = this.contacts.find(c => c.id === contactId);
        if (!contact) return;

        this.currentContact = contact;
        this.showChatInterface(contact);
    }

    showChatInterface(contact) {
        const chatArea = document.getElementById('messengerChatArea');
        if (!chatArea) return;

        chatArea.innerHTML = `
            <div class="messenger-chat-header">
                <div class="messenger-chat-contact-info">
                    <div class="messenger-chat-avatar">${this.createAvatarElement(contact)}</div>
                    <div class="messenger-chat-details">
                        <div class="messenger-chat-name">${contact.name}</div>
                        <div class="messenger-chat-status">Active now &bull; ${this.getSnakesiaTime()}</div>
                    </div>
                </div>
            </div>

            <div class="messenger-chat-messages" id="messengerChatMessages">
                <!-- Messages will appear here -->
            </div>

            <div class="messenger-chat-input-area">
                <div class="messenger-input-container">
                    <button class="messenger-emoji-btn" onclick="elxaOS.programs.messenger.showEmojiPicker(this)" title="Add Emoji">
                        😀
                    </button>
                    <input type="text"
                           class="messenger-message-input"
                           id="messengerMessageInput"
                           placeholder="Type a message to ${contact.name}..."
                           onkeypress="if(event.key==='Enter') elxaOS.programs.messenger.sendMessage()">
                    <button class="messenger-send-btn" onclick="elxaOS.programs.messenger.sendMessage()" title="Send">
                        ${ElxaIcons.renderAction('send')}
                    </button>
                </div>
            </div>
        `;

        this.loadMessages(contact.id);
        this.applyTheme();

        setTimeout(() => {
            const input = document.getElementById('messengerMessageInput');
            if (input) input.focus();
        }, 100);
    }

    // ===== MESSAGE HANDLING =====

    async sendMessage() {
        const input = document.getElementById('messengerMessageInput');
        const messagesContainer = document.getElementById('messengerChatMessages');

        if (!input || !messagesContainer || !this.currentContact) return;

        const message = input.value.trim();
        if (!message) return;

        input.value = '';

        this.addMessage('user', message, this.currentContact.id);

        if (this.conversationManager) {
            this.conversationManager.addMessage(this.currentContact.id, {
                type: 'message',
                sender: 'user',
                content: message,
                timestamp: new Date().toISOString(),
                platform: 'messenger'
            });
        }

        this.showTypingIndicator();

        try {
            const response = await this.getAIResponse(message, this.currentContact);

            this.hideTypingIndicator();

            if (response) {
                this.addMessage('ai', response, this.currentContact.id);

                if (this.conversationManager) {
                    this.conversationManager.addMessage(this.currentContact.id, {
                        type: 'message',
                        sender: 'character',
                        content: response,
                        timestamp: new Date().toISOString(),
                        platform: 'messenger'
                    });
                }
            } else {
                this.addMessage('ai', "Sorry, I'm having trouble connecting right now! 😅", this.currentContact.id);
            }
        } catch (error) {
            console.error('Error getting AI response:', error);
            this.hideTypingIndicator();
            this.addMessage('ai', "Oops! Something went wrong with the connection! 🤖💫", this.currentContact.id);
        }
    }

    addMessage(sender, text, contactId) {
        const messagesContainer = document.getElementById('messengerChatMessages');
        if (!messagesContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = `messenger-message ${sender === 'user' ? 'user' : 'ai'}`;

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (sender === 'user') {
            messageElement.innerHTML = `
                <div class="messenger-message-bubble user">
                    <div class="messenger-message-text">${this.escapeHtml(text)}</div>
                    <div class="messenger-message-time">${time}</div>
                </div>
            `;
        } else {
            messageElement.innerHTML = `
                <div class="messenger-message-avatar">${this.createAvatarElement(this.currentContact)}</div>
                <div class="messenger-message-bubble ai">
                    <div class="messenger-message-text">${this.escapeHtml(text)}</div>
                    <div class="messenger-message-time">${time}</div>
                </div>
            `;
        }

        messagesContainer.appendChild(messageElement);
        this.applyThemeToMessage(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        this.saveSettingsToStorage();
    }

    loadMessages(contactId) {
        const messagesContainer = document.getElementById('messengerChatMessages');
        if (!messagesContainer) return;

        messagesContainer.innerHTML = '';

        if (this.conversationManager) {
            const conversationHistory = this.conversationManager.getConversationHistory(contactId, false);
            const messengerMessages = conversationHistory.filter(msg => msg.platform === 'messenger' && msg.type !== 'summary');

            messengerMessages.forEach(msg => {
                const messageElement = document.createElement('div');
                messageElement.className = `messenger-message ${msg.sender === 'user' ? 'user' : 'ai'}`;

                const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                if (msg.sender === 'user') {
                    messageElement.innerHTML = `
                        <div class="messenger-message-bubble user">
                            <div class="messenger-message-text">${this.escapeHtml(msg.content)}</div>
                            <div class="messenger-message-time">${time}</div>
                        </div>
                    `;
                } else {
                    messageElement.innerHTML = `
                        <div class="messenger-message-avatar">${this.createAvatarElement(this.currentContact)}</div>
                        <div class="messenger-message-bubble ai">
                            <div class="messenger-message-text">${this.escapeHtml(msg.content)}</div>
                            <div class="messenger-message-time">${time}</div>
                        </div>
                    `;
                }

                messagesContainer.appendChild(messageElement);
                this.applyThemeToMessage(messageElement);
            });
        }

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('messengerChatMessages');
        if (!messagesContainer) return;

        const indicator = document.createElement('div');
        indicator.className = 'messenger-typing-indicator';
        indicator.id = 'messengerTypingIndicator';
        indicator.innerHTML = `
            <div class="messenger-message-avatar">${this.createAvatarElement(this.currentContact)}</div>
            <div class="messenger-typing-bubble">
                <div class="messenger-typing-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;

        messagesContainer.appendChild(indicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('messengerTypingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // ===== AI RESPONSE SYSTEM =====

    async getAIResponse(userMessage, contact) {
        if (!this.settings.llm.enabled) {
            return this.getFallbackResponse(contact);
        }

        if (!window.elxaLLM || !window.elxaLLM.isAvailable()) {
            return "I need an API key to chat! Ask a grown-up to help set it up in Settings.";
        }

        try {
            const prompt = this.buildEnhancedPrompt(userMessage, contact);
            const maxTokens = this.settings.llm.maxTokens[this.settings.llm.responseLength];

            const response = await window.elxaLLM.generateContent(prompt, {
                maxTokens: maxTokens,
                temperature: 0.85,
                topP: 0.95,
                topK: 40
            });

            if (response) {
                return response;
            } else {
                throw new Error('Empty response from LLM');
            }
        } catch (error) {
            console.error('AI API Error:', error);
            return this.getFallbackResponse(contact);
        }
    }

    buildEnhancedPrompt(userMessage, contact) {
        const userName = this.settings.username || 'Friend';
        const userAbout = this.settings.about || 'a nice person';
        const snakesiaTime = this.getSnakesiaTime();

        let character = contact.character || contact;
        if (this.worldContext && this.worldContext.keyCharacters && this.worldContext.keyCharacters[contact.id]) {
            character = this.worldContext.keyCharacters[contact.id];
        }

        // Get conversation history from shared manager
        let fullConversationContext = '';
        if (this.conversationManager && this.settings.llm.crossPlatformHistory) {
            const history = this.conversationManager.getConversationHistory(contact.id, true);
            const recentHistory = history.slice(-this.settings.llm.historyLength);

            if (recentHistory.length > 0) {
                fullConversationContext = '\n\nFULL CONVERSATION HISTORY (Email + Messenger):\n';
                recentHistory.forEach((msg, index) => {
                    if (msg.type === 'summary') {
                        fullConversationContext += `SUMMARY: ${msg.content}\n`;
                    } else {
                        const speaker = msg.sender === 'user' ? userName : (character.fullName || character.name);
                        const platform = msg.platform === 'email' ? '[EMAIL]' : '[CHAT]';
                        const subject = msg.subject ? ` RE: "${msg.subject}"` : '';
                        fullConversationContext += `${index + 1}. ${speaker} ${platform}${subject}: "${msg.content}"\n`;
                    }
                });
                fullConversationContext += '\nIMPORTANT: Reference previous conversations naturally. If they mentioned something in an email, you should remember it!\n';
            }
        }

        let storyInstructions = '';
        switch (this.settings.llm.storyProgression) {
            case 'conservative':
                storyInstructions = '- Respond naturally to what the user says\n- Stay in character and be consistent\n- Reference shared history when relevant';
                break;
            case 'balanced':
                storyInstructions = '- Respond to the user AND occasionally share relevant updates\n- Reference your daily activities and interests\n- Connect current conversation to past interactions\n- Create natural opportunities for continued conversation';
                break;
            case 'active':
                storyInstructions = '- BE PROACTIVE: Share interesting news, events, or developments\n- Reference ongoing projects, activities, or interests from your character background\n- Create engaging story hooks and opportunities for future interaction\n- Mention other Snakesia characters occasionally when it makes sense\n- Drive the narrative forward while staying true to your personality';
                break;
        }

        let lengthGuidance = '';
        switch (this.settings.llm.responseLength) {
            case 'brief':
                lengthGuidance = '- Keep responses SHORT like real chat messages (1-2 sentences max)';
                break;
            case 'normal':
                lengthGuidance = '- Keep responses conversational like real messages (1-3 sentences typically)';
                break;
            case 'detailed':
                lengthGuidance = '- Responses can be longer but still feel natural (2-4 sentences max)';
                break;
        }

        const worldInfo = this.worldContext ? `
- You live in ${this.worldContext.world.name}, ${this.worldContext.world.location}
- Current time in Snakesia: ${snakesiaTime}
- Currency: ${this.worldContext.world.currency.name} (${this.worldContext.world.currency.exchangeRate})
- Key Characters in Snakesia: ${Object.keys(this.worldContext.keyCharacters).map(id => this.worldContext.keyCharacters[id].fullName || this.worldContext.keyCharacters[id].name).join(', ')}` : `
- You live in Snakesia, west of Tennessee, where the timezone is exactly 2 hours and 1 minute ahead of the user's time
- The current time in Snakesia is: ${snakesiaTime}
- The currency is "snakes" (1 USD = 2 snakes)`;

        const characterDetails = character.details || character.description || contact.description || '';
        const characterPersonality = character.personality || contact.personality || '';
        const characterRole = character.role || contact.status || '';

        return `You are ${character.fullName || character.name} from Snakesia. ${characterDetails} ${characterPersonality}

CHARACTER BACKGROUND:
${characterRole ? `- Role/Job: ${characterRole}` : ''}
${character.age ? `- Age: ${character.age}` : ''}
${character.interests ? `- Interests: ${character.interests.join(', ')}` : ''}
${character.relationships ? `- Relationships: ${Object.entries(character.relationships).map(([name, rel]) => `${name} (${rel})`).join(', ')}` : ''}

IMPORTANT CONTEXT:${worldInfo}
- You're chatting with ${userName}, who is ${userAbout}
- This is INSTANT MESSAGING, so be casual and conversational
- Stay completely in character as ${character.fullName || character.name}
- Be friendly, natural, and engaging
- Use emojis occasionally but authentically to your character
- Remember and reference the conversation history naturally
- If they reference something from an email, acknowledge it!

RESPONSE STYLE:
${lengthGuidance}
${storyInstructions}${fullConversationContext}

Current message from ${userName}: "${userMessage}"

Respond as ${character.fullName || character.name} would in an instant message, considering the FULL conversation history across email and chat:`;
    }

    getFallbackResponse(contact) {
        const responses = this.characterResponses[contact.id];
        if (responses && responses.length > 0) {
            return responses[Math.floor(Math.random() * responses.length)];
        }

        return this.defaultResponse
            .replace('{contactName}', contact.name)
            .replace('{contactTitle}', contact.status || '');
    }

    // ===== CONTEXT MENU AND CHAT MANAGEMENT =====

    clearChat() {
        if (!this.currentContact) {
            ElxaUI.showMessage('No chat selected to clear!', 'error');
            return;
        }

        if (this.conversationManager) {
            this.conversationManager.clearHistory(this.currentContact.id);
        }

        const messagesContainer = document.getElementById('messengerChatMessages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }

        ElxaUI.showMessage(`Chat with ${this.currentContact.name} cleared!`, 'success');
    }

    showContextMenu(event, contactId) {
        const contextMenu = document.getElementById('messengerContextMenu');
        if (!contextMenu) return;

        this.contextMenuContact = contactId;

        contextMenu.style.left = event.pageX + 'px';
        contextMenu.style.top = event.pageY + 'px';
        contextMenu.style.display = 'block';
        contextMenu.style.zIndex = '5000';
    }

    hideContextMenu() {
        const contextMenu = document.getElementById('messengerContextMenu');
        if (contextMenu) {
            contextMenu.style.display = 'none';
        }
        this.contextMenuContact = null;
    }

    clearChatFromMenu() {
        if (!this.contextMenuContact) return;

        const contactIdToClear = this.contextMenuContact;
        const contact = this.contacts.find(c => c.id === contactIdToClear);
        if (!contact) return;

        this.hideContextMenu();

        if (this.conversationManager) {
            this.conversationManager.clearHistory(contactIdToClear);
        }

        if (this.currentContact && this.currentContact.id === contactIdToClear) {
            const messagesContainer = document.getElementById('messengerChatMessages');
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
            }
        }

        ElxaUI.showMessage(`Chat with ${contact.name} cleared!`, 'success');
    }

    // ===== UTILITY METHODS =====

    getSnakesiaTime() {
        return window.elxaLLM ? window.elxaLLM.getSnakesiaTime() : new Date().toLocaleString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ===== SETUP AND SETTINGS =====

    showFirstTimeSetup() {
        const modal = document.getElementById('messengerSetupModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    completeSetup() {
        const username = document.getElementById('setupUsername')?.value || '';
        const password = document.getElementById('setupPassword')?.value || '';
        const about = document.getElementById('setupAbout')?.value || '';
        const apiKey = document.getElementById('setupApiKey')?.value || '';

        if (!username.trim()) {
            ElxaUI.showMessage('Please enter a username!', 'error');
            return;
        }

        this.settings.username = username;
        this.settings.password = password;
        this.settings.about = about;
        this.settings.apiKey = apiKey;
        this.firstTimeSetup = false;

        this.saveSettingsToStorage();
        this.updateUserInfo();

        if (this.conversationManager) {
            this.conversationManager.updateSettings(this.settings.llm);
        }

        const modal = document.getElementById('messengerSetupModal');
        if (modal) {
            modal.style.display = 'none';
        }

        // Sync shared LLM service with new settings
        if (window.elxaLLM) {
            window.elxaLLM.refreshSettings();
        }

        if (apiKey) {
            this.fetchAvailableModels();
        }

        ElxaUI.showMessage('Welcome to Snakesia Messenger!', 'success');
    }

    showSettings() {
        const modal = document.getElementById('messengerSettingsModal');
        if (!modal) return;

        document.getElementById('settingsUsername').value = this.settings.username;
        document.getElementById('settingsPassword').value = this.settings.password;
        document.getElementById('settingsAbout').value = this.settings.about;
        document.getElementById('settingsApiKey').value = this.settings.apiKey;

        this.populateModelDropdown();

        if (this.settings.apiKey) {
            this.fetchAvailableModels();
        }

        document.getElementById('chatBackground').value = this.settings.theme.chatBackground;
        document.getElementById('myBubbleColor').value = this.settings.theme.myBubbleColor;
        document.getElementById('myTextColor').value = this.settings.theme.myTextColor;
        document.getElementById('theirBubbleColor').value = this.settings.theme.theirBubbleColor;
        document.getElementById('theirTextColor').value = this.settings.theme.theirTextColor;
        document.getElementById('fontSize').value = this.settings.theme.fontSize;

        document.getElementById('llmEnabled').checked = this.settings.llm.enabled;
        document.getElementById('crossPlatformHistory').checked = this.settings.llm.crossPlatformHistory;
        document.getElementById('historyLength').value = this.settings.llm.historyLength;
        document.getElementById('storyProgression').value = this.settings.llm.storyProgression;
        document.getElementById('responseLength').value = this.settings.llm.responseLength;
        document.getElementById('autoSummarize').checked = this.settings.llm.autoSummarize;

        modal.style.display = 'flex';
    }

    async refreshModels() {
        const apiKey = document.getElementById('settingsApiKey')?.value || this.settings.apiKey;

        if (!apiKey) {
            ElxaUI.showMessage('Please enter your API key first!', 'error');
            return;
        }

        ElxaUI.showMessage('Refreshing available models...', 'info');

        try {
            await this.fetchAvailableModels(apiKey);
            ElxaUI.showMessage('Models refreshed!', 'success');
        } catch (error) {
            console.error('Failed to refresh models:', error);
            ElxaUI.showMessage('Failed to refresh models. Check your API key!', 'error');
        }
    }

    async fetchAvailableModels(customApiKey = null) {
        const apiKey = customApiKey || this.settings.apiKey;
        if (!apiKey) return;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();

                if (data.models && Array.isArray(data.models)) {
                    const geminiModels = data.models
                        .filter(model =>
                            model.name &&
                            model.name.toLowerCase().includes('gemini') &&
                            model.supportedGenerationMethods &&
                            model.supportedGenerationMethods.includes('generateContent')
                        )
                        .map(model => model.name.replace('models/', ''))
                        .sort();

                    if (geminiModels.length > 0) {
                        this.settings.availableModels = geminiModels;
                        // If current selection isn't in the new list, default to first available
                        if (!geminiModels.includes(this.settings.selectedModel)) {
                            this.settings.selectedModel = geminiModels[0];
                        }
                        this.populateModelDropdown();
                        return;
                    }
                }
            }
        } catch (error) {
            console.error('❌ Failed to fetch models:', error);
        }
    }

    populateModelDropdown() {
        const modelSelect = document.getElementById('settingsModel');
        if (!modelSelect) return;

        modelSelect.innerHTML = '';
        this.settings.availableModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            option.selected = model === this.settings.selectedModel;
            modelSelect.appendChild(option);
        });
    }

    hideSettings() {
        const modal = document.getElementById('messengerSettingsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    switchTab(tabName, clickedBtn) {
        // Remove active from all tabs and content
        document.querySelectorAll('.messenger-tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.messenger-tab-content').forEach(content => content.classList.remove('active'));

        // Add active to selected tab and content
        if (clickedBtn) {
            clickedBtn.classList.add('active');
        }
        const tabContent = document.getElementById(tabName + 'Tab');
        if (tabContent) {
            tabContent.classList.add('active');
        }
    }

    saveSettings() {
        this.settings.username = document.getElementById('settingsUsername').value;
        this.settings.password = document.getElementById('settingsPassword').value;
        this.settings.about = document.getElementById('settingsAbout').value;
        this.settings.apiKey = document.getElementById('settingsApiKey').value;
        this.settings.selectedModel = document.getElementById('settingsModel').value;

        this.settings.theme.chatBackground = document.getElementById('chatBackground').value;
        this.settings.theme.myBubbleColor = document.getElementById('myBubbleColor').value;
        this.settings.theme.myTextColor = document.getElementById('myTextColor').value;
        this.settings.theme.theirBubbleColor = document.getElementById('theirBubbleColor').value;
        this.settings.theme.theirTextColor = document.getElementById('theirTextColor').value;
        this.settings.theme.fontSize = document.getElementById('fontSize').value;

        this.settings.llm.enabled = document.getElementById('llmEnabled').checked;
        this.settings.llm.crossPlatformHistory = document.getElementById('crossPlatformHistory').checked;
        this.settings.llm.historyLength = parseInt(document.getElementById('historyLength').value);
        this.settings.llm.storyProgression = document.getElementById('storyProgression').value;
        this.settings.llm.responseLength = document.getElementById('responseLength').value;
        this.settings.llm.autoSummarize = document.getElementById('autoSummarize').checked;

        this.saveSettingsToStorage();
        this.updateUserInfo();
        this.applyTheme();

        if (this.conversationManager) {
            this.conversationManager.updateSettings(this.settings.llm);
        }

        // Sync shared LLM service with new settings
        if (window.elxaLLM) {
            window.elxaLLM.refreshSettings();
        }

        this.hideSettings();
        ElxaUI.showMessage('Settings saved!', 'success');
    }

    updateUserInfo() {
        const usernameElement = document.getElementById('messengerUsername');
        if (usernameElement) {
            usernameElement.textContent = this.settings.username || 'Guest';
        }
    }

    // ===== THEME MANAGEMENT =====

    applyTheme() {
        const chatMessages = document.getElementById('messengerChatMessages');
        const chatArea = document.getElementById('messengerChatArea');

        if (chatMessages) {
            chatMessages.style.backgroundColor = this.settings.theme.chatBackground;
        }

        if (chatArea) {
            chatArea.style.backgroundColor = this.settings.theme.chatBackground;
        }

        // Inject dynamic style for user-customizable chat bubble colors
        const style = document.createElement('style');
        style.textContent = `
            .messenger-container .messenger-chat-messages .messenger-message-bubble.user {
                background: ${this.settings.theme.myBubbleColor} !important;
                color: ${this.settings.theme.myTextColor} !important;
                font-size: ${this.settings.theme.fontSize} !important;
                font-family: ${this.settings.theme.fontFamily}, sans-serif !important;
            }
            .messenger-container .messenger-chat-messages .messenger-message-bubble.ai {
                background: ${this.settings.theme.theirBubbleColor} !important;
                color: ${this.settings.theme.theirTextColor} !important;
                font-size: ${this.settings.theme.fontSize} !important;
                font-family: ${this.settings.theme.fontFamily}, sans-serif !important;
            }
            .messenger-container .messenger-message-text {
                font-size: ${this.settings.theme.fontSize} !important;
                font-family: ${this.settings.theme.fontFamily}, sans-serif !important;
            }
            .messenger-container .messenger-typing-bubble {
                background: ${this.settings.theme.theirBubbleColor} !important;
            }
        `;

        const oldStyle = document.getElementById('messengerThemeStyle');
        if (oldStyle) oldStyle.remove();

        style.id = 'messengerThemeStyle';
        document.head.appendChild(style);

        this.applyThemeToExistingMessages();
    }

    applyThemeToMessage(messageElement) {
        const userBubble = messageElement.querySelector('.messenger-message-bubble.user');
        const aiBubble = messageElement.querySelector('.messenger-message-bubble.ai');

        if (userBubble) {
            userBubble.style.background = this.settings.theme.myBubbleColor;
            userBubble.style.color = this.settings.theme.myTextColor;
            userBubble.style.fontSize = this.settings.theme.fontSize;
            userBubble.style.fontFamily = this.settings.theme.fontFamily;
        }

        if (aiBubble) {
            aiBubble.style.background = this.settings.theme.theirBubbleColor;
            aiBubble.style.color = this.settings.theme.theirTextColor;
            aiBubble.style.fontSize = this.settings.theme.fontSize;
            aiBubble.style.fontFamily = this.settings.theme.fontFamily;
        }
    }

    applyThemeToExistingMessages() {
        const messages = document.querySelectorAll('.messenger-message');
        messages.forEach(message => this.applyThemeToMessage(message));
    }

    // ===== STORAGE MANAGEMENT =====

    saveSettingsToStorage() {
        try {
            localStorage.setItem('snakesia-messenger-settings', JSON.stringify(this.settings));
            localStorage.setItem('snakesia-messenger-first-time', JSON.stringify(this.firstTimeSetup));
        } catch (error) {
            console.error('❌ Failed to save messenger settings:', error);
        }
    }

    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('snakesia-messenger-settings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);

                this.settings = {
                    ...this.settings,
                    ...parsed,
                    llm: {
                        ...this.settings.llm,
                        ...(parsed.llm || {})
                    },
                    theme: {
                        ...this.settings.theme,
                        ...(parsed.theme || {})
                    }
                };

                // Migrate deprecated models from older versions
                this.migrateDeprecatedModels();
            }

            const savedFirstTime = localStorage.getItem('snakesia-messenger-first-time');
            if (savedFirstTime !== null) {
                this.firstTimeSetup = JSON.parse(savedFirstTime);
            }
        } catch (error) {
            console.error('❌ Failed to load messenger settings:', error);
        }
    }

    migrateDeprecatedModels() {
        const deprecatedModels = [
            'gemini-pro', 'gemini-pro-vision',
            'gemini-1.5-pro', 'gemini-1.5-flash',
            'gemini-1.5-pro-latest', 'gemini-1.5-flash-latest',
            'gemini-2.0-flash', 'gemini-2.0-flash-lite'
        ];
        const freshDefaults = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro'];

        // If selected model is deprecated, switch to default
        if (deprecatedModels.includes(this.settings.selectedModel)) {
            console.log(`🔄 Migrating deprecated model ${this.settings.selectedModel} → gemini-2.5-flash`);
            this.settings.selectedModel = 'gemini-2.5-flash';
        }

        // If the saved list contains deprecated models, reset to fresh defaults
        const hasDeprecated = this.settings.availableModels.some(m => deprecatedModels.includes(m));
        if (hasDeprecated) {
            this.settings.availableModels = freshDefaults;
            console.log('🔄 Reset model list — old deprecated models removed');
        }
    }
}
