// =================================
// SNAKESIA MESSENGER - Main Program
// =================================
class MessengerProgram {
    constructor(windowManager, fileSystem, eventBus) {
        this.windowManager = windowManager;
        this.fileSystem = fileSystem;
        this.eventBus = eventBus;
        this.isOpen = false;
        this.currentContact = null;
        this.messages = new Map(); // Store messages per contact
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
        
        // Character definitions
        this.contacts = [
            {
                id: 'mr_snake_e',
                name: 'Mr. Snake-e 🐍',
                status: 'CEO of ElxaCorp',
                avatar: '🐍',
                avatarImage: '../../assets/messenger/mr_snake_e.png', // Fixed path from js/programs/
                description: '60-year-old snake CEO of ElxaCorp, trillionaire who drives a Denali and knows everything about math and tech',
                personality: 'Intelligent, business-minded, tech-savvy, successful but friendly. Speaks with authority but is kind to friends.'
            },
            {
                id: 'mrs_snake_e',
                name: 'Mrs. Snake-e 🌻',
                status: 'Gardening & Baking Expert',
                avatar: '🌻',
                avatarImage: '../../assets/messenger/mrs_snake_e.png',
                description: '80-year-old wife of Mr. Snake-e who loves gardening and baking, very nurturing and wise',
                personality: 'Sweet, nurturing, loves sharing recipes and garden tips. Very wise and motherly.'
            },
            {
                id: 'remi',
                name: 'Remi Marway 🎮',
                status: 'Famous YouTuber',
                avatar: '🎮',
                avatarImage: '../../assets/messenger/remi.png',
                description: '12-year-old famous YouTuber with his own Minecraft server, very cool and chill, loves gaming and making videos',
                personality: 'Cool, chill, uses gaming slang, talks about YouTube and Minecraft, friendly and laid-back.'
            },
            {
                id: 'rita',
                name: 'Rita 👩‍🦰',
                status: 'Sweet & Protective',
                avatar: '👩‍🦰',
                avatarImage: '../../assets/messenger/rita.png',
                description: 'Red-haired older sister of Remi, sweet and playful but very protective of her family and friends',
                personality: 'Sweet, playful, protective, caring. Uses friendly emojis and shows concern for others.'
            },
            {
                id: 'pushing_cat',
                name: 'Pushing Cat 😼',
                status: 'Professional Troublemaker',
                avatar: '😼',
                avatarImage: '../../assets/messenger/pushing_cat.png',
                description: 'Sneaky black cat who loves pushing things and being "sus", climbs into belly buttons when feeling mischievous, has a secret Sussy Lair',
                personality: 'Mischievous, playful, uses cat puns, talks about pushing things and being sneaky. Very silly and fun.'
            }
        ];
        
        this.loadSettings();
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

    async sendMessage() {
        const input = document.getElementById('messengerMessageInput');
        const messagesContainer = document.getElementById('messengerChatMessages');
        
        if (!input || !messagesContainer || !this.currentContact) return;
        
        const message = input.value.trim();
        if (!message) return;
        
        // Clear input
        input.value = '';
        
        // Add user message
        this.addMessage('user', message, this.currentContact.id);
        
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
        
        // Store message
        if (!this.messages.has(contactId)) {
            this.messages.set(contactId, []);
        }
        this.messages.get(contactId).push({ sender, text, time });
        
        console.log('💬 Message added. Total messages for', contactId, ':', this.messages.get(contactId).length);
        
        // Save messages to storage
        this.saveSettingsToStorage();
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

    async getAIResponse(userMessage, contact) {
        if (!this.settings.apiKey) {
            return "I need an API key to chat! Ask a grown-up to help set it up in Settings. 🔑";
        }

        try {
            // Create the prompt with character context
            const prompt = this.buildPrompt(userMessage, contact);
            
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
                        maxOutputTokens: 150,
                        temperature: 0.8,
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
            return null;
        }
    }

    buildPrompt(userMessage, contact) {
        const userName = this.settings.username || 'Friend';
        const userAbout = this.settings.about || 'a nice person';
        const snakesiaTime = this.getSnakesiaTime();
        
        // Get recent chat history (last 10 messages to avoid token limits)
        const chatHistory = this.messages.get(contact.id) || [];
        const recentHistory = chatHistory.slice(-10);
        
        // Build conversation context
        let conversationContext = '';
        if (recentHistory.length > 0) {
            conversationContext = '\n\nCONVERSATION HISTORY:\n';
            recentHistory.forEach(msg => {
                const speaker = msg.sender === 'user' ? userName : contact.name.replace(/[^\w\s-]/g, '');
                conversationContext += `${speaker}: "${msg.text}"\n`;
            });
        }
        
        return `You are ${contact.name.replace(/[^\w\s-]/g, '')} from Snakesia. ${contact.description}. ${contact.personality}

IMPORTANT CONTEXT:
- You live in Snakesia, west of Tennessee, where the timezone is exactly 2 hours and 1 minute ahead of the user's time
- The current time in Snakesia is: ${snakesiaTime}
- The currency is "snakes" (1 USD = 2 snakes)
- You're chatting with ${userName}, who is ${userAbout}
- Keep responses SHORT like real text messages (1-3 sentences max)
- Stay completely in character as ${contact.name.replace(/[^\w\s-]/g, '')}
- Be friendly and conversational
- Use emojis occasionally but don't overdo it
- Remember and reference the conversation history when appropriate${conversationContext}

Current message from ${userName}: "${userMessage}"

Respond as ${contact.name.replace(/[^\w\s-]/g, '')} would in a text message, considering the conversation history:`;
    }

    clearChat() {
        if (!this.currentContact) {
            this.showSystemMessage('No chat selected to clear! 🤷‍♂️', 'error');
            return;
        }

        console.log('🗑️ Clearing chat for current contact:', this.currentContact.name);

        // Clear messages for this contact (no confirmation)
        this.messages.delete(this.currentContact.id);
        
        // Clear the chat display
        const messagesContainer = document.getElementById('messengerChatMessages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
        
        // Save to storage
        this.saveSettingsToStorage();
        
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
        // MOVED: Only reset contextMenuContact here, after the clearing is done
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

        // IMPORTANT: Store the contact ID BEFORE hiding the context menu
        const contactIdToClick = this.contextMenuContact;
        
        const contact = this.contacts.find(c => c.id === contactIdToClick);
        if (!contact) {
            console.error('❌ Contact not found:', contactIdToClick);
            return;
        }

        console.log('🗑️ Clearing chat for:', contact.name, 'ID:', contactIdToClick);

        // Hide the context menu AFTER we've stored the contact ID
        this.hideContextMenu();

        // Clear messages for this contact using our stored ID
        this.messages.delete(contactIdToClick);
        console.log('🗑️ Messages deleted from memory for:', contactIdToClick);
        
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
        
        // Save to storage
        this.saveSettingsToStorage();
        console.log('💾 Settings saved after clearing chat');
        
        // Show success message
        this.showSystemMessage(`Chat with ${contact.name} cleared! 🧹`, 'success');
    }

    getSnakesiaTime() {
        const now = new Date();
        const snakesiaTime = new Date(now.getTime() + (2 * 60 + 1) * 60 * 1000); // 2 hours 1 minute ahead
        return snakesiaTime.toLocaleString();
    }

    loadMessages(contactId) {
        const messagesContainer = document.getElementById('messengerChatMessages');
        if (!messagesContainer) {
            console.error('❌ Messages container not found when loading messages');
            return;
        }

        console.log('📖 Loading messages for contact:', contactId);
        
        messagesContainer.innerHTML = '';
        
        const messages = this.messages.get(contactId) || [];
        console.log('📖 Found', messages.length, 'messages for', contactId);
        
        messages.forEach((msg, index) => {
            console.log(`📖 Loading message ${index + 1}:`, msg);
            
            const messageElement = document.createElement('div');
            messageElement.className = `messenger-message ${msg.sender === 'user' ? 'user' : 'ai'}`;
            
            if (msg.sender === 'user') {
                messageElement.innerHTML = `
                    <div class="messenger-message-bubble user">
                        <div class="messenger-message-text">${this.escapeHtml(msg.text)}</div>
                        <div class="messenger-message-time">${msg.time}</div>
                    </div>
                `;
            } else {
                messageElement.innerHTML = `
                    <div class="messenger-message-avatar">${this.createAvatarElement(this.currentContact)}</div>
                    <div class="messenger-message-bubble ai">
                        <div class="messenger-message-text">${this.escapeHtml(msg.text)}</div>
                        <div class="messenger-message-time">${msg.time}</div>
                    </div>
                `;
            }
            
            messagesContainer.appendChild(messageElement);
            this.applyThemeToMessage(messageElement);
        });
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

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
            
            // Updated API endpoint - try the correct one
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

        this.saveSettingsToStorage();
        this.updateUserInfo();
        this.applyTheme();
        this.hideSettings();

        this.showSystemMessage('Settings saved! 💾', 'success');
    }

    updateUserInfo() {
        const usernameElement = document.getElementById('messengerUsername');
        if (usernameElement) {
            usernameElement.textContent = this.settings.username || 'Guest';
        }
    }

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

    saveSettingsToStorage() {
        try {
            localStorage.setItem('snakesia-messenger-settings', JSON.stringify(this.settings));
            localStorage.setItem('snakesia-messenger-messages', JSON.stringify(Array.from(this.messages.entries())));
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
                this.settings = { ...this.settings, ...parsed };
                console.log('📁 Messenger settings loaded from localStorage');
            }

            // Load messages
            const savedMessages = localStorage.getItem('snakesia-messenger-messages');
            if (savedMessages) {
                const messagesArray = JSON.parse(savedMessages);
                this.messages = new Map(messagesArray);
                console.log('💬 Message history loaded from localStorage');
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

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export for ElxaOS integration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MessengerProgram;
}