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
            selectedModel: 'gemini-pro',
            availableModels: [
                'gemini-pro',
                'gemini-pro-vision', 
                'gemini-1.5-pro',
                'gemini-1.5-flash',
                'gemini-1.5-pro-latest',
                'gemini-1.5-flash-latest'
            ],
            // Enhanced LLM Integration Settings
            llm: {
                enabled: true,
                crossPlatformHistory: true,
                historyLength: 25, // Increased for better context
                storyProgression: 'balanced', // conservative, balanced, active
                responseLength: 'normal', // brief, normal, detailed
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
        this.contextMenuContact = null; // Track which contact's context menu is open
        
        // Emoji categories for the picker
        this.emojiCategories = {
            'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '😵', '🤯'],
            'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐙', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🐢', '🐍', '🦎', '🐙', '🦑', '🦐', '🦞', '🦀'],
            'Food': ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥒', '🌶️', '🌽', '🥕', '🥔', '🍠', '🥐', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🌮', '🌯', '🥙', '🧆', '🥘', '🍝'],
            'Activities': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏃', '🚶', '🧗', '🤳'],
            'Objects': ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎬', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⏳', '⌛', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷'],
            'Snakesia': ['🐍', '🏢', '💼', '🚗', '💰', '🌟', '👑', '🎯', '🚀', '⚡', '🔥', '💎', '🏆', '🎊', '🎉', '✨', '🌈', '☀️', '🌙', '⭐', '💫', '🌸', '🌻', '🌺', '🌷', '🌹', '🎂', '🍰', '🧁', '🍪', '🍫', '🍬', '🍭', '🎪', '🎨', '🎭', '🎼', '🎵', '🎶', '🎤', '🎧', '📚', '📖', '✏️', '🖍️', '📝', '📌', '📍']
        };
        
        this.initializeManagers();
        this.loadSettings();
    }

    // ===== INITIALIZATION =====

    async initializeManagers() {
        try {
            console.log('🔄 Initializing conversation managers...');
            
            // Try to access conversation history manager from different possible locations
            let conversationManager = null;
            let worldContext = null;
            
            // Method 1: Check if it's globally available
            if (typeof conversationHistoryManager !== 'undefined') {
                conversationManager = conversationHistoryManager;
                worldContext = conversationHistoryManager.worldContext;
                console.log('✅ Found conversation history manager globally');
            }
            // Method 2: Check if it's attached to window
            else if (window.conversationHistoryManager) {
                conversationManager = window.conversationHistoryManager;
                worldContext = window.conversationHistoryManager.worldContext;
                console.log('✅ Found conversation history manager on window');
            }
            // Method 3: Check if it's attached to elxaOS
            else if (typeof elxaOS !== 'undefined' && elxaOS.conversationHistoryManager) {
                conversationManager = elxaOS.conversationHistoryManager;
                worldContext = elxaOS.conversationHistoryManager.worldContext;
                console.log('✅ Found conversation history manager on elxaOS');
            }
            // Method 4: Try to load world context directly
            else {
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
            
            // Set the manager and context
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
            
            // Load characters
            await this.loadCharactersFromWorldContext();
            
            // Load character responses for fallbacks
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
                character: char // Store full character data for better prompts
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
        // Minimal fallback only if world context completely fails
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

        const window = this.windowManager.createWindow(
            'messenger',
            '💬 Snakesia Messenger',
            this.createInterface(),
            { width: '800px', height: '600px', x: '150px', y: '100px' }
        );

        this.isOpen = true;
        this.setupEventHandlers();
        
        // Show setup if first time
        if (this.firstTimeSetup || !this.settings.username) {
            setTimeout(() => this.showFirstTimeSetup(), 500);
        }

        this.eventBus.on('window.closed', (data) => {
            if (data.id === 'messenger') {
                this.isOpen = false;
            }
        });
    }

    createInterface() {
        return `
            <div class="messenger-container">
                <!-- Setup Modal -->
                <div class="messenger-setup-modal" id="messengerSetupModal" style="display: none;">
                    <div class="messenger-setup-content">
                        <h3>Welcome to Snakesia Messenger! 🐍</h3>
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
                                    Start Chatting! 🚀
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
                                <div class="messenger-user-avatar">👤</div>
                                <div class="messenger-user-details">
                                    <div class="messenger-username" id="messengerUsername">Guest</div>
                                    <div class="messenger-user-status">Online in Snakesia</div>
                                </div>
                            </div>
                            <div class="messenger-header-actions">
                                <button class="messenger-icon-btn" onclick="elxaOS.programs.messenger.showSettings()" title="Settings">⚙️</button>
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
                            <div class="messenger-welcome-icon">🐍✨</div>
                            <h3>Welcome to Snakesia Messenger!</h3>
                            <p>Select a friend to start chatting!</p>
                            <p><em>Remember: Snakesia is 2 hours and 1 minute ahead of us!</em></p>
                            ${this.conversationManager ? '<p><small>📚 Cross-platform memory enabled - characters remember conversations from Email too!</small></p>' : ''}
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
                            <h3>Messenger Settings</h3>
                            <button class="messenger-close-btn" onclick="elxaOS.programs.messenger.hideSettings()">×</button>
                        </div>
                        
                        <div class="messenger-settings-tabs">
                            <button class="messenger-tab-btn active" onclick="elxaOS.programs.messenger.switchTab('account')">Account</button>
                            <button class="messenger-tab-btn" onclick="elxaOS.programs.messenger.switchTab('api')">API Settings</button>
                            <button class="messenger-tab-btn" onclick="elxaOS.programs.messenger.switchTab('llm')">LLM Settings</button>
                            <button class="messenger-tab-btn" onclick="elxaOS.programs.messenger.switchTab('appearance')">Appearance</button>
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
                                        🔄 Refresh Models
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
                                
                                <div class="messenger-form-group" style="background: #f0f0f0; padding: 10px; border-radius: 5px; margin-top: 15px;">
                                    <strong>💡 Pro Tips:</strong><br>
                                    <small>• Cross-platform memory creates more immersive conversations<br>
                                    • Longer memory = more context but slower responses<br>
                                    • Active story progression = more engaging but less predictable<br>
                                    • Auto-summarize keeps the experience smooth over time</small>
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
                                Save Changes
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
                        🗑️ Clear Chat History
                    </div>
                    <div class="messenger-context-item" onclick="elxaOS.programs.messenger.hideContextMenu()">
                        ❌ Cancel
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

        // Add click handler to close context menu and emoji picker - SCOPED to messenger container
        document.addEventListener('click', (e) => {
            const contextMenu = document.getElementById('messengerContextMenu');
            const emojiPicker = document.getElementById('messengerEmojiPicker');
            
            if (contextMenu && contextMenu.style.display === 'block' && !contextMenu.contains(e.target)) {
                this.hideContextMenu();
            }
            
            if (emojiPicker && emojiPicker.style.display === 'block' && !emojiPicker.contains(e.target) && !e.target.closest('.messenger-emoji-btn')) {
                this.hideEmojiPicker();
            }
        });

        // FIXED: Scope context menu prevention to just the messenger container
        const messengerContainer = document.querySelector('.messenger-container');
        if (messengerContainer) {
            messengerContainer.addEventListener('contextmenu', (e) => {
                // Only handle context menu within messenger
                if (e.target.closest('.messenger-contact-item')) {
                    // Let the contact item handle its own context menu
                    return;
                }
                
                // Allow default context menu on input fields and text areas
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    return;
                }
                
                // Prevent context menu on other messenger elements
                e.preventDefault();
            });
        }
    }

    // ===== EMOJI FUNCTIONALITY =====

    populateEmojiPicker() {
        const emojiTabs = document.getElementById('messengerEmojiTabs');
        const emojiContent = document.getElementById('messengerEmojiContent');
        
        if (!emojiTabs || !emojiContent) return;

        // Create tabs
        emojiTabs.innerHTML = '';
        const categories = Object.keys(this.emojiCategories);
        
        categories.forEach((category, index) => {
            const tab = document.createElement('button');
            tab.className = `messenger-emoji-tab ${index === 0 ? 'active' : ''}`;
            tab.textContent = category;
            tab.onclick = () => this.switchEmojiCategory(category);
            emojiTabs.appendChild(tab);
        });

        // Show first category by default
        this.switchEmojiCategory(categories[0]);
    }

    switchEmojiCategory(category) {
        // Update active tab
        document.querySelectorAll('.messenger-emoji-tab').forEach(tab => {
            tab.classList.toggle('active', tab.textContent === category);
        });

        // Populate emojis
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

        // Position the picker near the emoji button
        const rect = buttonElement.getBoundingClientRect();
        emojiPicker.style.left = rect.left + 'px';
        emojiPicker.style.top = (rect.top - 200) + 'px'; // Show above the button
        emojiPicker.style.display = 'block';
        emojiPicker.style.zIndex = '5000';

        console.log('😀 Emoji picker shown');
    }

    hideEmojiPicker() {
        const emojiPicker = document.getElementById('messengerEmojiPicker');
        if (emojiPicker) {
            emojiPicker.style.display = 'none';
            console.log('❌ Emoji picker hidden');
        }
    }

    insertEmoji(emoji) {
        const messageInput = document.getElementById('messengerMessageInput');
        if (!messageInput) return;

        // Insert emoji at cursor position
        const start = messageInput.selectionStart;
        const end = messageInput.selectionEnd;
        const text = messageInput.value;
        
        messageInput.value = text.substring(0, start) + emoji + text.substring(end);
        
        // Move cursor after inserted emoji
        const newPosition = start + emoji.length;
        messageInput.setSelectionRange(newPosition, newPosition);
        messageInput.focus();

        console.log('😀 Inserted emoji:', emoji);
        
        // Hide picker after selection
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
            contactElement.onclick = () => this.selectContact(contact.id);
            
            // FIXED: Better context menu handling with proper event stopping
            contactElement.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Prevent bubbling to parent handlers
                console.log('🖱️ Right-click on contact:', contact.name);
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
        // Try to create an image element first, fallback to emoji
        if (contact.avatarImage) {
            return `<img src="${contact.avatarImage}" alt="${contact.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
                    <span style="display: none;">${contact.avatar}</span>`;
        }
        return contact.avatar;
    }

    selectContact(contactId) {
        // Remove active state from all contacts
        document.querySelectorAll('.messenger-contact-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active state to selected contact
        event.target.closest('.messenger-contact-item').classList.add('active');
        
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
                        <div class="messenger-chat-status">Active now • ${this.getSnakesiaTime()}</div>
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
                    <button class="messenger-send-btn" onclick="elxaOS.programs.messenger.sendMessage()">
                        📤
                    </button>
                </div>
            </div>
        `;

        // Load existing messages for this contact
        this.loadMessages(contact.id);
        this.applyTheme();
        
        // Focus input
        setTimeout(() => {
            const input = document.getElementById('messengerMessageInput');
            if (input) input.focus();
        }, 100);
    }

    // ===== ENHANCED MESSAGE HANDLING WITH IMPROVED PROMPTS =====

    async sendMessage() {
        const input = document.getElementById('messengerMessageInput');
        const messagesContainer = document.getElementById('messengerChatMessages');
        
        if (!input || !messagesContainer || !this.currentContact) return;
        
        const message = input.value.trim();
        if (!message) return;
        
        // Clear input
        input.value = '';
        
        // Add user message to display
        this.addMessage('user', message, this.currentContact.id);
        
        // Add to conversation history if available
        if (this.conversationManager) {
            this.conversationManager.addMessage(this.currentContact.id, {
                type: 'message',
                sender: 'user',
                content: message,
                timestamp: new Date().toISOString(),
                platform: 'messenger'
            });
        }
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Get AI response
            const response = await this.getAIResponse(message, this.currentContact);
            
            // Remove typing indicator
            this.hideTypingIndicator();
            
            // Add AI response
            if (response) {
                this.addMessage('ai', response, this.currentContact.id);
                
                // Add AI response to conversation history if available
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
        if (!messagesContainer) {
            console.error('❌ Messages container not found when adding message');
            return;
        }

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
        
        // Apply theme immediately to new message
        this.applyThemeToMessage(messageElement);
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        console.log('💬 Message added for', contactId);
        
        // Note: We don't store messages locally anymore since conversation history manager handles it
        // Save settings to maintain other data
        this.saveSettingsToStorage();
    }

    loadMessages(contactId) {
        const messagesContainer = document.getElementById('messengerChatMessages');
        if (!messagesContainer) {
            console.error('❌ Messages container not found when loading messages');
            return;
        }

        console.log('📖 Loading messages for contact:', contactId);
        
        messagesContainer.innerHTML = '';
        
        if (this.conversationManager) {
            // Load from conversation history manager
            const conversationHistory = this.conversationManager.getConversationHistory(contactId, false);
            const messengerMessages = conversationHistory.filter(msg => msg.platform === 'messenger' && msg.type !== 'summary');
            
            console.log('📖 Found', messengerMessages.length, 'messenger messages for', contactId);
            
            messengerMessages.forEach((msg, index) => {
                console.log(`📖 Loading message ${index + 1}:`, msg);
                
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
        } else {
            console.log('⚠️ Conversation history manager not available, no messages to load');
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

    // ===== ENHANCED AI RESPONSE SYSTEM WITH IMPROVED CROSS-PLATFORM HISTORY =====

    async getAIResponse(userMessage, contact) {
        // Check if LLM is enabled
        if (!this.settings.llm.enabled) {
            return this.getFallbackResponse(contact);
        }

        if (!this.settings.apiKey) {
            return "I need an API key to chat! Ask a grown-up to help set it up in Settings. 🔑";
        }

        try {
            // Create the enhanced prompt with cross-platform conversation history
            const prompt = this.buildEnhancedPrompt(userMessage, contact);
            
            // Get response length setting
            const maxTokens = this.settings.llm.maxTokens[this.settings.llm.responseLength];
            
            // Make API call to Gemini
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.settings.selectedModel}:generateContent?key=${this.settings.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        maxOutputTokens: maxTokens,
                        temperature: 0.85, // Slightly higher for more personality
                        topP: 0.95,
                        topK: 40
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Invalid response format');
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
        
        // Get enhanced character info from world context if available
        let character = contact.character || contact;
        if (this.worldContext && this.worldContext.keyCharacters && this.worldContext.keyCharacters[contact.id]) {
            character = this.worldContext.keyCharacters[contact.id];
        }
        
        // Get FULL conversation history from shared manager (including email!)
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

        // Build enhanced story progression instructions
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

        // Build enhanced response length guidance
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
        
        // Enhanced world context information
        const worldInfo = this.worldContext ? `
- You live in ${this.worldContext.world.name}, ${this.worldContext.world.location}
- Current time in Snakesia: ${snakesiaTime}
- Currency: ${this.worldContext.world.currency.name} (${this.worldContext.world.currency.exchangeRate})
- Key Characters in Snakesia: ${Object.keys(this.worldContext.keyCharacters).map(id => this.worldContext.keyCharacters[id].fullName || this.worldContext.keyCharacters[id].name).join(', ')}` : `
- You live in Snakesia, west of Tennessee, where the timezone is exactly 2 hours and 1 minute ahead of the user's time
- The current time in Snakesia is: ${snakesiaTime}
- The currency is "snakes" (1 USD = 2 snakes)`;

        // Character background and personality
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
        // Use loaded character responses from JSON
        const responses = this.characterResponses[contact.id];
        if (responses && responses.length > 0) {
            const templateResponse = responses[Math.floor(Math.random() * responses.length)];
            console.log('📝 Using template response from character-responses.json for messenger');
            return templateResponse;
        }

        // Final fallback to default response
        console.log('📝 Using default fallback response from character-responses.json for messenger');
        return this.defaultResponse
            .replace('{contactName}', contact.name)
            .replace('{contactTitle}', contact.status || '');
    }

    // ===== CONTEXT MENU AND CHAT MANAGEMENT =====

    clearChat() {
        if (!this.currentContact) {
            this.showSystemMessage('No chat selected to clear! 🤷‍♂️', 'error');
            return;
        }

        console.log('🗑️ Clearing chat for current contact:', this.currentContact.name);

        // Clear from conversation history manager if available
        if (this.conversationManager) {
            this.conversationManager.clearHistory(this.currentContact.id);
        }
        
        // Clear the chat display
        const messagesContainer = document.getElementById('messengerChatMessages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
        
        this.showSystemMessage(`Chat with ${this.currentContact.name} cleared! 🧹`, 'success');
    }

    showContextMenu(event, contactId) {
        console.log('🖱️ Showing context menu for contact:', contactId);
        
        const contextMenu = document.getElementById('messengerContextMenu');
        if (!contextMenu) {
            console.error('❌ Context menu element not found!');
            return;
        }

        // Store which contact this menu is for
        this.contextMenuContact = contactId;

        // Position the menu at the mouse cursor
        contextMenu.style.left = event.pageX + 'px';
        contextMenu.style.top = event.pageY + 'px';
        contextMenu.style.display = 'block';
        contextMenu.style.zIndex = '5000'; // Ensure it's on top

        console.log('📍 Context menu positioned at:', event.pageX, event.pageY);

        // Add event listener to hide menu when clicking elsewhere
        setTimeout(() => {
            document.addEventListener('click', this.handleContextMenuClickAway.bind(this), { once: true });
        }, 10);
    }

    hideContextMenu() {
        const contextMenu = document.getElementById('messengerContextMenu');
        if (contextMenu) {
            contextMenu.style.display = 'none';
            console.log('❌ Context menu hidden');
        }
        this.contextMenuContact = null;
    }

    handleContextMenuClickAway(event) {
        const contextMenu = document.getElementById('messengerContextMenu');
        if (contextMenu && !contextMenu.contains(event.target)) {
            this.hideContextMenu();
        }
    }

    clearChatFromMenu() {
        console.log('🗑️ Clear chat requested for contact:', this.contextMenuContact);
        
        if (!this.contextMenuContact) {
            console.error('❌ No context menu contact set');
            return;
        }

        // Store the contact ID BEFORE hiding the context menu
        const contactIdToClick = this.contextMenuContact;
        
        const contact = this.contacts.find(c => c.id === contactIdToClick);
        if (!contact) {
            console.error('❌ Contact not found:', contactIdToClick);
            return;
        }

        console.log('🗑️ Clearing chat for:', contact.name, 'ID:', contactIdToClick);

        // Hide the context menu AFTER we've stored the contact ID
        this.hideContextMenu();

        // Clear from conversation history manager if available
        if (this.conversationManager) {
            this.conversationManager.clearHistory(contactIdToClick);
            console.log('🗑️ Conversation history cleared for:', contactIdToClick);
        }
        
        // If this contact is currently selected, clear the display too
        if (this.currentContact && this.currentContact.id === contactIdToClick) {
            const messagesContainer = document.getElementById('messengerChatMessages');
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
                console.log('🗑️ Chat display cleared for currently selected contact');
            } else {
                console.error('❌ Messages container not found');
            }
        }
        
        // Show success message
        this.showSystemMessage(`Chat with ${contact.name} cleared! 🧹`, 'success');
    }

    // ===== UTILITY METHODS =====

    getSnakesiaTime() {
        const now = new Date();
        const snakesiaTime = new Date(now.getTime() + (2 * 60 + 1) * 60 * 1000); // 2 hours 1 minute ahead
        return snakesiaTime.toLocaleString();
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
            alert('Please enter a username!');
            return;
        }

        this.settings.username = username;
        this.settings.password = password;
        this.settings.about = about;
        this.settings.apiKey = apiKey;
        this.firstTimeSetup = false;

        this.saveSettingsToStorage();
        this.updateUserInfo();
        
        // Update conversation history manager settings
        if (this.conversationManager) {
            this.conversationManager.updateSettings(this.settings.llm);
        }

        const modal = document.getElementById('messengerSetupModal');
        if (modal) {
            modal.style.display = 'none';
        }

        // Fetch models if API key provided
        if (apiKey) {
            this.fetchAvailableModels();
        }

        // Show success message
        this.showSystemMessage('Welcome to Snakesia Messenger! 🎉', 'success');
    }

    showSettings() {
        const modal = document.getElementById('messengerSettingsModal');
        if (!modal) return;

        // Populate settings form
        document.getElementById('settingsUsername').value = this.settings.username;
        document.getElementById('settingsPassword').value = this.settings.password;
        document.getElementById('settingsAbout').value = this.settings.about;
        document.getElementById('settingsApiKey').value = this.settings.apiKey;

        // Populate model dropdown and refresh available models
        this.populateModelDropdown();
        
        // Only auto-fetch if we have an API key
        if (this.settings.apiKey) {
            this.fetchAvailableModels();
        }

        // Populate appearance settings
        document.getElementById('chatBackground').value = this.settings.theme.chatBackground;
        document.getElementById('myBubbleColor').value = this.settings.theme.myBubbleColor;
        document.getElementById('myTextColor').value = this.settings.theme.myTextColor;
        document.getElementById('theirBubbleColor').value = this.settings.theme.theirBubbleColor;
        document.getElementById('theirTextColor').value = this.settings.theme.theirTextColor;
        document.getElementById('fontSize').value = this.settings.theme.fontSize;

        // Populate LLM settings
        document.getElementById('llmEnabled').checked = this.settings.llm.enabled;
        document.getElementById('crossPlatformHistory').checked = this.settings.llm.crossPlatformHistory;
        document.getElementById('historyLength').value = this.settings.llm.historyLength;
        document.getElementById('storyProgression').value = this.settings.llm.storyProgression;
        document.getElementById('responseLength').value = this.settings.llm.responseLength;
        document.getElementById('autoSummarize').checked = this.settings.llm.autoSummarize;

        modal.style.display = 'flex';
    }

    // New method to manually refresh models
    async refreshModels() {
        const apiKey = document.getElementById('settingsApiKey')?.value || this.settings.apiKey;
        
        if (!apiKey) {
            this.showSystemMessage('Please enter your API key first! 🔑', 'error');
            return;
        }

        this.showSystemMessage('Refreshing available models... 🔄', 'info');
        
        try {
            await this.fetchAvailableModels(apiKey);
            this.showSystemMessage('Models refreshed! 📡', 'success');
        } catch (error) {
            console.error('Failed to refresh models:', error);
            this.showSystemMessage('Failed to refresh models. Check your API key! ❌', 'error');
        }
    }

    async fetchAvailableModels(customApiKey = null) {
        const apiKey = customApiKey || this.settings.apiKey;
        if (!apiKey) {
            console.log('⚠️ No API key available for fetching models');
            return;
        }

        try {
            console.log('📡 Fetching available models from Gemini API...');
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            console.log('📡 API Response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('📡 API Response data:', data);
                
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
                    
                    console.log('📡 Found Gemini models:', geminiModels);
                    
                    if (geminiModels.length > 0) {
                        // Keep existing defaults and add new ones
                        const allModels = [...new Set([...this.settings.availableModels, ...geminiModels])];
                        this.settings.availableModels = allModels;
                        this.populateModelDropdown();
                        console.log('✅ Updated available models:', allModels);
                        return;
                    }
                }
            } else {
                console.error('❌ API Error:', response.status, await response.text());
            }
        } catch (error) {
            console.error('❌ Failed to fetch models:', error);
        }
        
        console.log('⚠️ Using default models fallback');
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
        
        console.log('📋 Populated model dropdown with:', this.settings.availableModels);
    }

    hideSettings() {
        const modal = document.getElementById('messengerSettingsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    switchTab(tabName) {
        // Remove active from all tabs and content
        document.querySelectorAll('.messenger-tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.messenger-tab-content').forEach(content => content.classList.remove('active'));

        // Add active to selected tab and content
        event.target.classList.add('active');
        document.getElementById(tabName + 'Tab').classList.add('active');
    }

    saveSettings() {
        // Get values from form
        this.settings.username = document.getElementById('settingsUsername').value;
        this.settings.password = document.getElementById('settingsPassword').value;
        this.settings.about = document.getElementById('settingsAbout').value;
        this.settings.apiKey = document.getElementById('settingsApiKey').value;
        this.settings.selectedModel = document.getElementById('settingsModel').value;

        // Appearance settings
        this.settings.theme.chatBackground = document.getElementById('chatBackground').value;
        this.settings.theme.myBubbleColor = document.getElementById('myBubbleColor').value;
        this.settings.theme.myTextColor = document.getElementById('myTextColor').value;
        this.settings.theme.theirBubbleColor = document.getElementById('theirBubbleColor').value;
        this.settings.theme.theirTextColor = document.getElementById('theirTextColor').value;
        this.settings.theme.fontSize = document.getElementById('fontSize').value;

        // LLM settings
        this.settings.llm.enabled = document.getElementById('llmEnabled').checked;
        this.settings.llm.crossPlatformHistory = document.getElementById('crossPlatformHistory').checked;
        this.settings.llm.historyLength = parseInt(document.getElementById('historyLength').value);
        this.settings.llm.storyProgression = document.getElementById('storyProgression').value;
        this.settings.llm.responseLength = document.getElementById('responseLength').value;
        this.settings.llm.autoSummarize = document.getElementById('autoSummarize').checked;

        this.saveSettingsToStorage();
        this.updateUserInfo();
        this.applyTheme();
        
        // Update conversation history manager settings
        if (this.conversationManager) {
            this.conversationManager.updateSettings(this.settings.llm);
        }
        
        this.hideSettings();

        this.showSystemMessage('Settings saved! 💾', 'success');
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

        // Apply to message bubbles with very high specificity and using background instead of background-color
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
        
        // Remove old style if exists
        const oldStyle = document.getElementById('messengerThemeStyle');
        if (oldStyle) oldStyle.remove();
        
        style.id = 'messengerThemeStyle';
        document.head.appendChild(style);
        
        // Apply theme to existing messages
        this.applyThemeToExistingMessages();
        
        console.log('🎨 Theme applied:', this.settings.theme);
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

    showSystemMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `messenger-system-message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 50px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 3000;
            animation: slideIn 0.3s ease-out;
        `;

        if (type === 'success') {
            messageDiv.style.backgroundColor = '#28a745';
        } else if (type === 'error') {
            messageDiv.style.backgroundColor = '#dc3545';
        } else {
            messageDiv.style.backgroundColor = '#007bff';
        }

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }

    // ===== STORAGE MANAGEMENT =====

    saveSettingsToStorage() {
        try {
            localStorage.setItem('snakesia-messenger-settings', JSON.stringify(this.settings));
            localStorage.setItem('snakesia-messenger-first-time', JSON.stringify(this.firstTimeSetup));
            console.log('💾 Messenger settings saved to localStorage');
        } catch (error) {
            console.error('❌ Failed to save messenger settings:', error);
        }
    }

    loadSettings() {
        try {
            // Load settings
            const savedSettings = localStorage.getItem('snakesia-messenger-settings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                
                // Merge with defaults to handle new settings
                this.settings = {
                    ...this.settings,
                    ...parsed,
                    // Ensure LLM settings exist with defaults
                    llm: {
                        ...this.settings.llm,
                        ...(parsed.llm || {})
                    },
                    // Ensure theme settings exist with defaults
                    theme: {
                        ...this.settings.theme,
                        ...(parsed.theme || {})
                    }
                };
                
                console.log('📁 Messenger settings loaded from localStorage');
            }

            // Load first-time setup status
            const savedFirstTime = localStorage.getItem('snakesia-messenger-first-time');
            if (savedFirstTime !== null) {
                this.firstTimeSetup = JSON.parse(savedFirstTime);
            }
        } catch (error) {
            console.error('❌ Failed to load messenger settings:', error);
        }
    }
}

// Export for ElxaOS integration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MessengerProgram;
}