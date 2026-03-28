console.log('🎮 Dissscord: JavaScript loaded');

class DissscordApp {
    constructor() {
        console.log('🎮 Dissscord: Constructor starting...');
        
        this.currentServer = 'remi';
        this.currentChannel = 'general';
        this.messages = []; // Current channel messages
        this.channelMessages = {}; // Persistent messages per server/channel
        this.maxMessages = 50; // Increased from 30 to keep more chat history
        this.messageGenerationActive = false;
        this.typingTimeouts = new Map();
        this.userCanSend = true;
        this.llmService = null;
        this.messageTimeout = null;
        this.messageObserver = null;
        
        console.log('🎮 Dissscord: Basic properties set');
        
        // Initialize asynchronously
        this.initialize();
    }

    async initialize() {
        try {
            await this.initializeData();
            console.log('🎮 Dissscord: Data initialized');
            
            this.setupEventListeners();
            console.log('🎮 Dissscord: Event listeners set up');
            
            this.loadServer('remi');
            console.log('🎮 Dissscord: Server loaded');
            
            this.startMessageGeneration();
            console.log('🎮 Dissscord: Message generation started');
        } catch (error) {
            console.error('❌ Dissscord: Initialization error:', error);
            
            // Show error message to user
            const messageContainer = document.getElementById('messageContainer');
            if (messageContainer) {
                messageContainer.innerHTML = `
                    <div class="ds-loading" style="color: #ff6b6b;">
                        ❌ Failed to load Dissscord data: ${error.message}
                        <br><br>
                        Please make sure the dissscord-data.json file exists in the correct location.
                    </div>
                `;
            }
        }
    }

    async initializeData() {
        console.log('🎮 Loading data from dissscord-data.json...');
        
        try {
            // Load data from external JSON file
            const data = await this.loadDataFile();
            
            // Set properties from loaded data
            this.servers = data.servers;
            this.messageTemplates = data.messageTemplates;
            this.messageVariables = data.messageVariables;
            
            console.log('✅ Data loaded successfully');
            console.log('📊 Servers loaded:', Object.keys(this.servers).length);
            console.log('📝 Message templates loaded:', Object.keys(this.messageTemplates).length);
            console.log('🔤 Message variables loaded:', Object.keys(this.messageVariables).length);
            
        } catch (error) {
            console.error('❌ Failed to load data:', error);
            // Fall back to empty data structures to prevent crashes
            this.servers = {};
            this.messageTemplates = {};
            this.messageVariables = {};
            throw new Error('Failed to load Dissscord data: ' + error.message);
        }
    }

    async loadDataFile() {
        const possiblePaths = [
            // ElxaOS file system paths
            'dissscord-data.json',
            './assets/interwebs/dissscord/dissscord-data.json',
            // Fetch API paths
            './dissscord-data.json',
            './assets/interwebs/dissscord/dissscord-data.json',
            'assets/interwebs/dissscord/dissscord-data.json'
        ];
        
        // Try ElxaOS file system API first
        if (window.fs && window.fs.readFile) {
            console.log('🎮 Using ElxaOS file system...');
            for (const path of possiblePaths.slice(0, 2)) {
                try {
                    console.log(`🎮 Trying ElxaOS path: ${path}`);
                    const fileData = await window.fs.readFile(path, { encoding: 'utf8' });
                    console.log(`✅ Successfully loaded from ElxaOS: ${path}`);
                    return JSON.parse(fileData);
                } catch (error) {
                    console.log(`⚠️ ElxaOS path failed: ${path} - ${error.message}`);
                    continue;
                }
            }
        }
        
        // Fallback to fetch API with multiple path attempts
        console.log('🎮 Using fetch API...');
        for (const path of possiblePaths.slice(2)) {
            try {
                console.log(`🎮 Trying fetch path: ${path}`);
                const response = await fetch(path);
                if (response.ok) {
                    console.log(`✅ Successfully loaded from fetch: ${path}`);
                    return await response.json();
                }
                console.log(`⚠️ Fetch path failed: ${path} - HTTP ${response.status}`);
            } catch (error) {
                console.log(`⚠️ Fetch path error: ${path} - ${error.message}`);
                continue;
            }
        }
        
        throw new Error('Could not find dissscord-data.json in any expected location');
    }

    setupEventListeners() {
        console.log('🎮 Setting up event listeners...');
        
        // Clean up existing observer if any
        if (this.messageObserver) {
            this.messageObserver.disconnect();
            this.messageObserver = null;
        }
        
        // Server switching
        document.querySelectorAll('.ds-server-icon').forEach(server => {
            server.addEventListener('click', (e) => {
                const serverId = e.target.dataset.server;
                console.log('🎮 Server clicked:', serverId);
                if (serverId) {
                    this.loadServer(serverId);
                }
            });
        });

        // Message input
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            console.log('✅ Message input found, adding listeners');
            
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    console.log('🎮 Enter pressed, sending message...');
                    this.sendUserMessage();
                }
            });

            messageInput.addEventListener('input', (e) => {
                // Auto-resize textarea
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 144) + 'px';
                
                // Update placeholder
                const channelName = document.getElementById('channelName').textContent;
                e.target.placeholder = `Message ${channelName}`;
            });
        } else {
            console.error('❌ Message input not found!');
        }

        // Simplified auto-scroll (less memory intensive)
        const messageContainer = document.getElementById('messageContainer');
        if (messageContainer) {
            // Use a simpler approach - just scroll after updates
            this.scrollToBottom = () => {
                messageContainer.scrollTop = messageContainer.scrollHeight;
            };
            console.log('✅ Scroll function set up');
        } else {
            console.error('❌ Message container not found!');
        }
        
        console.log('✅ Event listeners setup complete');
    }

    loadServer(serverId) {
        console.log('🎮 Loading server:', serverId);
        
        // Save current channel messages before switching servers (with proper key)
        if (this.currentServer && this.currentChannel) {
            this.saveCurrentChannelMessages();
        }
        
        // Stop message generation for current server
        this.stopMessageGeneration();
        
        // Clear current messages completely when switching servers
        this.messages = [];
        
        // Update server context
        this.currentServer = serverId;
        this.currentChannel = 'general';
        
        console.log(`🔄 Switched to server: ${serverId}, channel: general`);
        
        // Update server selection UI immediately
        document.querySelectorAll('.ds-server-icon').forEach(icon => {
            icon.classList.remove('active');
        });
        const serverElement = document.querySelector(`[data-server="${serverId}"]`);
        if (serverElement) {
            serverElement.classList.add('active');
        }
        
        // Update server name immediately
        document.getElementById('serverName').textContent = this.servers[serverId].name;
        
        // Load channels for new server
        this.loadChannels(serverId);
        
        // Load members for new server
        this.loadMembers(serverId);
        
        // Clear current messages display immediately
        const messageContainer = document.getElementById('messageContainer');
        if (messageContainer) {
            messageContainer.innerHTML = '<div class="ds-loading">Loading messages for new server...</div>';
        }
        
        // Load channel (default to general) - this will handle message loading
        this.loadChannel('general');
        
        // Start message generation for new server after a brief delay
        setTimeout(() => {
            this.startMessageGeneration();
        }, 500);
        
        // Clean up old messages periodically to prevent memory buildup
        this.cleanupChannelMessages();
        
        console.log('✅ Server loaded:', serverId);
    }

    loadChannels(serverId) {
        const channelsList = document.getElementById('channelsList');
        const channels = this.servers[serverId].channels;
        
        let html = '<div class="ds-channel-category">Text Channels</div>';
        
        Object.entries(channels).forEach(([channelId, channel]) => {
            if (channel.type === 'text') {
                const isActive = channelId === this.currentChannel ? 'active' : '';
                html += `
                    <div class="ds-channel ${isActive}" data-channel="${channelId}">
                        <span class="ds-channel-prefix">#</span>
                        <span class="ds-channel-name">${channel.name}</span>
                    </div>
                `;
            }
        });
        
        // Add voice channels if any
        const voiceChannels = Object.entries(channels).filter(([_, channel]) => channel.type === 'voice');
        if (voiceChannels.length > 0) {
            html += '<div class="ds-channel-category">Voice Channels</div>';
            voiceChannels.forEach(([channelId, channel]) => {
                html += `
                    <div class="ds-channel" data-channel="${channelId}">
                        <span class="ds-channel-prefix">🔊</span>
                        <span class="ds-channel-name">${channel.name}</span>
                    </div>
                `;
            });
        }
        
        channelsList.innerHTML = html;
        
        // Add channel click listeners
        document.querySelectorAll('.ds-channel').forEach(channel => {
            channel.addEventListener('click', (e) => {
                const channelId = e.target.closest('.ds-channel').dataset.channel;
                if (channelId && this.servers[this.currentServer].channels[channelId].type === 'text') {
                    this.loadChannel(channelId);
                }
            });
        });
    }

    loadChannel(channelId) {
        console.log('🎮 Loading channel:', channelId, 'in server:', this.currentServer);
        
        // Save current channel messages before switching
        this.saveCurrentChannelMessages();
        
        // Update current channel
        this.currentChannel = channelId;
        const channel = this.servers[this.currentServer].channels[channelId];
        
        // Update channel selection UI immediately
        document.querySelectorAll('.ds-channel').forEach(ch => {
            ch.classList.remove('active');
        });
        const channelElement = document.querySelector(`[data-channel="${channelId}"]`);
        if (channelElement) {
            channelElement.classList.add('active');
        }
        
        // Update channel header immediately
        document.getElementById('channelName').textContent = `# ${channel.name}`;
        document.getElementById('channelTopic').textContent = channel.topic;
        
        // Update message input placeholder immediately
        document.getElementById('messageInput').placeholder = `Message #${channel.name}`;
        
        // Show loading state immediately
        const messageContainer = document.getElementById('messageContainer');
        if (messageContainer) {
            messageContainer.innerHTML = '<div class="ds-loading">Loading channel messages...</div>';
        }
        
        // Load saved messages for this channel
        const hasMessages = this.loadChannelMessages(this.currentServer, channelId);
        
        // Update message display immediately
        this.updateMessageDisplay();
        
        // Only generate new messages if channel is empty
        if (!hasMessages) {
            // Stop current generation and restart for new channel
            this.stopMessageGeneration();
            
            // Start generation after a brief delay
            setTimeout(() => {
                this.startMessageGeneration();
            }, 100);
        }
        
        console.log('✅ Channel loaded:', channelId);
    }

    loadMembers(serverId) {
        const membersList = document.getElementById('membersList');
        const members = this.servers[serverId].members;
        
        let html = '';
        
        if (members.online.length > 0) {
            html += `<div class="ds-members-category">Online — ${members.online.length}</div>`;
            members.online.forEach(member => {
                const roleClass = member.role ? `ds-role-${member.role}` : '';
                html += `
                    <div class="ds-member">
                        <div class="ds-member-avatar">${member.avatar}</div>
                        <div class="ds-member-name">${member.name}</div>
                    </div>
                `;
            });
        }
        
        if (members.away.length > 0) {
            html += `<div class="ds-members-category">Away — ${members.away.length}</div>`;
            members.away.forEach(member => {
                html += `
                    <div class="ds-member">
                        <div class="ds-member-avatar" style="opacity: 0.5">${member.avatar}</div>
                        <div class="ds-member-name" style="opacity: 0.5">${member.name}</div>
                    </div>
                `;
            });
        }
        
        membersList.innerHTML = html;
    }

    startMessageGeneration() {
        if (this.messageGenerationActive) return;
        
        this.messageGenerationActive = true;
        
        // Generate a few initial messages immediately
        console.log('🎮 Starting message generation...');
        this.generateInitialMessages();
        
        // Then start the regular generation cycle
        this.generateNextMessage();
    }

    generateInitialMessages() {
        console.log(`🎮 Generating initial messages for ${this.currentServer}:${this.currentChannel}...`);
        
        // Verify we have templates for this server/channel
        if (!this.messageTemplates[this.currentServer] || !this.messageTemplates[this.currentServer][this.currentChannel]) {
            console.error(`❌ No message templates for ${this.currentServer}:${this.currentChannel}`);
            
            // Add a fallback message
            const fallbackMessage = {
                id: Date.now(),
                author: 'System',
                authorInfo: { avatar: '🤖', role: 'member', status: 'online' },
                text: `Welcome to ${this.servers[this.currentServer].name}! Chat is loading...`,
                timestamp: new Date(),
                type: 'system'
            };
            this.addMessage(fallbackMessage);
            return;
        }
        
        // Generate 3-5 initial messages to populate the chat
        const initialCount = Math.floor(Math.random() * 3) + 3; // 3-5 messages
        console.log(`🎮 Generating ${initialCount} initial messages...`);

        let lastAuthor = null;
        const initialMessages = [];
        for (let i = 0; i < initialCount; i++) {
            const message = this.createRandomMessage(lastAuthor);
            if (message) {
                lastAuthor = message.author;
                initialMessages.push(message);
                console.log(`✅ Generated initial message ${i+1}/${initialCount}: ${message.author} → "${message.text.substring(0, 50)}..."`);
            } else {
                console.error(`❌ Failed to create initial message ${i+1} for ${this.currentServer}:${this.currentChannel}`);
            }
        }

        // Space timestamps out chronologically (oldest first)
        initialMessages.sort(() => Math.random() - 0.5);
        initialMessages.forEach((msg, i) => {
            msg.timestamp = new Date(Date.now() - (initialMessages.length - i) * 120000 - Math.random() * 60000);
            this.addMessage(msg);
        });
        
        console.log(`🎮 Initial messages complete for ${this.currentServer}:${this.currentChannel}, total: ${this.messages.length}`);
    }

    saveCurrentChannelMessages() {
        // Save current messages to persistent storage with server:channel key
        if (!this.currentServer || !this.currentChannel) {
            console.log('⚠️ Cannot save - no current server/channel set');
            return;
        }
        
        const key = `${this.currentServer}:${this.currentChannel}`;
        if (this.messages.length > 0) {
            this.channelMessages[key] = [...this.messages];
            console.log(`💾 Saved ${this.messages.length} messages for ${key}`);
            
            // Debug: Show first message to verify uniqueness
            if (this.messages.length > 0) {
                console.log(`💾 First message preview: ${this.messages[0].author} → "${this.messages[0].text.substring(0, 50)}..."`);
            }
        } else {
            console.log(`💾 No messages to save for ${key}`);
        }
    }

    loadChannelMessages(serverId, channelId) {
        // Load messages for specific server/channel
        const key = `${serverId}:${channelId}`;
        const savedMessages = this.channelMessages[key];
        
        console.log(`📂 Loading messages for key: ${key}`);
        console.log(`📂 Available cached channels:`, Object.keys(this.channelMessages));
        
        if (savedMessages && savedMessages.length > 0) {
            this.messages = [...savedMessages];
            console.log(`📂 Loaded ${this.messages.length} messages for ${key}`);
            
            // Debug: Show first message to verify it's correct for this server
            if (this.messages.length > 0) {
                console.log(`📂 First loaded message: ${this.messages[0].author} → "${this.messages[0].text.substring(0, 50)}..."`);
            }
            return true;
        } else {
            this.messages = [];
            console.log(`📂 No saved messages for ${key}, starting fresh`);
            return false;
        }
    }

    cleanupChannelMessages() {
        // Clean up old messages to prevent memory buildup
        const keys = Object.keys(this.channelMessages);
        console.log(`🧹 Cleaning up ${keys.length} channel message caches`);
        
        // Keep only the most recent messages per channel, but be more aggressive about cleanup
        keys.forEach(key => {
            if (this.channelMessages[key].length > this.maxMessages) {
                // Keep the most recent maxMessages
                this.channelMessages[key] = this.channelMessages[key].slice(-this.maxMessages);
                console.log(`🧹 Trimmed ${key} to ${this.maxMessages} messages`);
            }
        });
        
        // If we have too many channels cached, remove the oldest ones (keep last 10 channels)
        if (keys.length > 10) {
            const sortedKeys = keys.sort(); // Simple alphabetical sort
            const keysToRemove = sortedKeys.slice(0, keys.length - 10);
            keysToRemove.forEach(key => {
                delete this.channelMessages[key];
                console.log(`🧹 Removed old channel cache: ${key}`);
            });
        }
    }

    stopMessageGeneration() {
        this.messageGenerationActive = false;
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
            this.messageTimeout = null;
            console.log('⏹️ Message generation stopped and timeout cleared');
        }
    }

    generateNextMessage() {
        if (!this.messageGenerationActive) return;
        
        console.log('🎮 Generating next message for', this.currentServer, this.currentChannel);
        
        // Generate a message for current server/channel
        const message = this.createRandomMessage();
        if (message) {
            this.addMessage(message);
            console.log('✅ Generated message:', message.author, message.text);
        } else {
            console.error('❌ Failed to generate message for', this.currentServer, this.currentChannel);
        }
        
        // Schedule next message (30 seconds to 3 minutes for more active chat)
        const delay = Math.random() * (180000 - 30000) + 30000; // 30 seconds to 3 minutes
        console.log(`⏰ Next message in ${Math.round(delay/1000)} seconds`);
        this.messageTimeout = setTimeout(() => {
            this.generateNextMessage();
        }, delay);
    }

    createRandomMessage(excludeAuthor = null) {
        console.log(`🎯 Creating message for server: ${this.currentServer}, channel: ${this.currentChannel}`);
        
        const serverTemplates = this.messageTemplates[this.currentServer];
        if (!serverTemplates) {
            console.error(`❌ No templates found for server: ${this.currentServer}`);
            return null;
        }
        
        const channelTemplates = serverTemplates[this.currentChannel];
        if (!channelTemplates || channelTemplates.length === 0) {
            console.error(`❌ No templates found for channel: ${this.currentChannel} in server: ${this.currentServer}`);
            return null;
        }

        // Filter to only online members (away members shouldn't post)
        const onlineNames = new Set(
            this.servers[this.currentServer].members.online.map(m => m.name)
        );
        let eligible = channelTemplates.filter(t => onlineNames.has(t.author));

        // Also exclude the specified author to prevent back-to-back repeats
        if (excludeAuthor) {
            const filtered = eligible.filter(t => t.author !== excludeAuthor);
            if (filtered.length > 0) eligible = filtered;
        }

        if (eligible.length === 0) {
            console.log('⚠️ No eligible templates after filtering');
            return null;
        }
        
        // Weighted random selection
        const totalWeight = eligible.reduce((sum, template) => sum + template.weight, 0);
        let random = Math.random() * totalWeight;
        
        let selectedTemplate = null;
        for (const template of eligible) {
            random -= template.weight;
            if (random <= 0) {
                selectedTemplate = template;
                break;
            }
        }
        
        if (!selectedTemplate) {
            selectedTemplate = eligible[0];
        }
        
        // Replace variables in message text
        const messageText = this.replaceMessageVariables(selectedTemplate.text);
        
        // Get author info
        const authorInfo = this.getAuthorInfo(selectedTemplate.author);
        
        console.log(`✅ Generated message: ${selectedTemplate.author} in ${this.currentServer}:${this.currentChannel} → "${messageText}"`);
        
        return {
            id: Date.now() + Math.random(),
            author: selectedTemplate.author,
            authorInfo: authorInfo,
            text: messageText,
            timestamp: new Date(),
            type: 'generated'
        };
    }

    isAuthorInCurrentServer(authorName) {
        // Check if the author is actually a member of the current server
        const serverMembers = this.servers[this.currentServer].members;
        const allMembers = [...serverMembers.online, ...serverMembers.away];
        
        const found = allMembers.some(member => member.name === authorName);
        console.log(`🔍 Checking if ${authorName} is in ${this.currentServer}: ${found}`);
        return found;
    }

    replaceMessageVariables(text) {
        // Find all {{variable}} patterns
        return text.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
            const values = this.messageVariables[variableName];
            if (values && values.length > 0) {
                return values[Math.floor(Math.random() * values.length)];
            }
            return match; // Return original if variable not found
        });
    }

    getAuthorInfo(authorName) {
        // Find author in current server's members
        const serverMembers = this.servers[this.currentServer].members;
        const allMembers = [...serverMembers.online, ...serverMembers.away];
        
        const member = allMembers.find(m => m.name === authorName);
        if (member) {
            return {
                avatar: member.avatar,
                role: member.role,
                status: member.status
            };
        }
        
        // Default fallback
        return {
            avatar: '👤',
            role: 'member',
            status: 'online'
        };
    }

    addMessage(message) {
        this.messages.push(message);
        
        // Keep only last maxMessages
        if (this.messages.length > this.maxMessages) {
            this.messages = this.messages.slice(-this.maxMessages);
        }
        
        this.updateMessageDisplay();
    }

    updateMessageDisplay() {
        const container = document.getElementById('messageContainer');
        
        if (this.messages.length === 0) {
            container.innerHTML = '<div class="ds-loading">No messages yet... generating content...</div>';
            return;
        }
        
        // Build HTML more efficiently
        const htmlParts = [];
        this.messages.forEach((message, index) => {
            const roleClass = message.authorInfo.role ? `ds-role-${message.authorInfo.role}` : '';
            const roleText = message.authorInfo.role && message.authorInfo.role !== 'member' ? 
                `<span class="ds-role ${roleClass}">${message.authorInfo.role}</span>` : '';
            
            const messageClass = message.type === 'user' ? 'ds-message user-message' : 'ds-message';
            
            htmlParts.push(`
                <div class="${messageClass}">
                    <div class="ds-avatar">${message.authorInfo.avatar}</div>
                    <div class="ds-message-content">
                        <div class="ds-message-header">
                            <span class="ds-username">${message.author}</span>
                            ${roleText}
                            <span class="ds-timestamp">${this.formatTimestamp(message.timestamp)}</span>
                        </div>
                        <div class="ds-message-text">${this.formatMessageText(message.text)}</div>
                    </div>
                </div>
            `);
        });
        
        container.innerHTML = htmlParts.join('');
        
        // Use the simpler scroll method
        if (this.scrollToBottom) {
            this.scrollToBottom();
        }
    }

    formatMessageText(text) {
        // Format mentions
        text = text.replace(/@(\w+)/g, '<span class="ds-mention">@$1</span>');
        
        // Format emojis (basic)
        text = text.replace(/:\w+:/g, (match) => {
            const emojiMap = {
                ':smile:': '😊',
                ':laugh:': '😂',
                ':heart:': '❤️',
                ':fire:': '🔥',
                ':thumbsup:': '👍'
            };
            return emojiMap[match] || match;
        });
        
        return text;
    }

    formatTimestamp(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        
        if (diff < 60000) { // Less than 1 minute
            return 'just now';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        } else if (diff < 86400000) { // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        } else {
            return timestamp.toLocaleDateString();
        }
    }

    sendUserMessage() {
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        
        console.log('🎮 User trying to send message:', text);
        
        if (!text || !this.userCanSend) {
            console.log('⚠️ Message empty or user cannot send');
            return;
        }
        
        console.log('✅ Sending user message:', text);
        
        // Create user message
        const userMessage = {
            id: Date.now() + Math.random(),
            author: 'You',
            authorInfo: {
                avatar: '👤',
                role: 'member',
                status: 'online'
            },
            text: text,
            timestamp: new Date(),
            type: 'user'
        };
        
        this.addMessage(userMessage);
        console.log('✅ User message added to chat');
        
        // Clear input
        input.value = '';
        input.style.height = 'auto';
        
        // Show typing indicator and schedule LLM response
        this.handleUserMessage(text);
    }

    async handleUserMessage(messageText) {
        console.log('🎮 Handling user message:', messageText);

        // Check if user mentioned a specific character
        const mentionedCharacter = this.findMentionedCharacter(messageText);
        console.log('🎮 Mentioned character:', mentionedCharacter);

        let firstResponder = null;

        if (mentionedCharacter) {
            firstResponder = mentionedCharacter;
            this.showTypingIndicator(mentionedCharacter);
            await this.generateLLMResponse(messageText, mentionedCharacter);
        } else {
            if (Math.random() < 0.7) { // 70% chance someone responds
                const randomCharacter = this.getRandomActiveCharacter();
                if (randomCharacter) {
                    firstResponder = randomCharacter;
                    this.showTypingIndicator(randomCharacter);
                    await this.generateLLMResponse(messageText, randomCharacter);
                }
            }
        }

        // 30% chance a second character also chimes in (after a longer delay)
        if (firstResponder && Math.random() < 0.3) {
            const secondCharacter = this.getRandomActiveCharacter(firstResponder);
            if (secondCharacter) {
                console.log('🎮 Second responder:', secondCharacter);
                setTimeout(() => {
                    this.showTypingIndicator(secondCharacter);
                    this.generateLLMResponse(messageText, secondCharacter);
                }, 4000 + Math.random() * 5000);
            }
        }
    }

    findMentionedCharacter(messageText) {
        const serverMembers = this.servers[this.currentServer].members;
        const allMembers = [...serverMembers.online, ...serverMembers.away];
        const text = messageText.toLowerCase();

        // Display name aliases for fuzzy matching
        const aliases = {
            'RemiMarway': ['remi', 'marway'],
            'Snake_E_CEO': ['snake-e', 'snake e', 'mr snake', 'ceo'],
            'Mrs_Snake_E': ['mrs snake', 'grandma', 'mrs snake-e'],
            'PushingCat': ['pushing cat', 'cat', 'sussy cat', 'pushing'],
            'Rita': ['rita'],
            'BlockMaster99': ['blockmaster', 'block'],
            'RedstoneGuru': ['redstone', 'guru'],
            'CreativeBuilder': ['creative', 'builder'],
            'ElxaCorp_HR': ['hr'],
            'ElxaCorp_IT': ['it support', 'it dept'],
            'DevTeamLead': ['dev lead', 'dev team'],
            'LocalMerchant': ['merchant'],
            'CommunityHelper': ['helper'],
            'MischievousCat': ['mischievous']
        };

        for (const member of allMembers) {
            const username = member.name.toLowerCase();

            // Exact @mention or full username
            if (text.includes(`@${username}`) || text.includes(username)) {
                return member.name;
            }

            // Check aliases
            const memberAliases = aliases[member.name] || [];
            for (const alias of memberAliases) {
                if (text.includes(alias)) {
                    return member.name;
                }
            }
        }

        return null;
    }

    getRandomActiveCharacter(exclude = null) {
        const serverMembers = this.servers[this.currentServer].members;
        let activeMembers = serverMembers.online.filter(member => member.name !== 'You');

        if (exclude) {
            activeMembers = activeMembers.filter(member => member.name !== exclude);
        }

        if (activeMembers.length === 0) return null;

        return activeMembers[Math.floor(Math.random() * activeMembers.length)].name;
    }

    showTypingIndicator(characterName) {
        const indicator = document.getElementById('typingIndicator');
        const userSpan = document.getElementById('typingUser');
        
        userSpan.textContent = characterName;
        indicator.style.display = 'block';
        
        // Hide after a delay
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 3000);
    }

    async generateLLMResponse(userMessage, characterName) {
        console.log('🎮 Generating LLM response for:', characterName, 'Message:', userMessage);
        
        try {
            // Try to use LLM service (similar to messenger/email)
            const response = await this.callLLMService(userMessage, characterName);
            
            if (response) {
                console.log('✅ LLM response received:', response);
                // Add delay to simulate typing
                setTimeout(() => {
                    this.addCharacterResponse(characterName, response);
                }, 2000 + Math.random() * 3000);
            } else {
                console.log('⚠️ No LLM response, using template fallback');
                // Fallback to template response
                setTimeout(() => {
                    this.addTemplateResponse(characterName, userMessage);
                }, 2000 + Math.random() * 3000);
            }
        } catch (error) {
            console.error('❌ LLM response failed:', error);
            // Fallback to template response
            setTimeout(() => {
                this.addTemplateResponse(characterName, userMessage);
            }, 2000 + Math.random() * 3000);
        }
    }

    async callLLMService(userMessage, characterName) {
        console.log('🎮 Calling LLM service for:', characterName);
        
        // Use shared LLM service
        const llm = window.elxaLLM;
        if (!llm || !llm.isAvailable()) {
            console.log('⚠️ LLM service not available');
            return null;
        }
        
        try {
            const prompt = this.buildLLMPrompt(userMessage, characterName);
            console.log(`📝 Prompt length: ${prompt.length} characters`);
            
            const response = await llm.generateContent(prompt, {
                maxTokens: 150,
                temperature: 0.8
            });
            
            if (response) {
                console.log('✅ LLM response generated successfully');
                return llm.truncateResponse(response, 300);
            }
            return null;
        } catch (error) {
            console.error('❌ LLM generation failed:', error);
            return null;
        }
    }

    buildLLMPrompt(userMessage, characterName) {
        // Build prompt similar to messenger/email but for Discord-style chat
        const character = this.getCharacterInfo(characterName);
        const context = this.getCurrentContext();
        
        // Get some recent messages for context (last 3)
        const recentMessages = this.messages.slice(-3).map(msg => 
            `${msg.author}: ${msg.text}`
        ).join('\n');
        
        const snakesiaTime = this.getSnakesiaTime();
        
        return `You are ${characterName} in a Discord-like chat server called Dissscord. ${character.description}

CONTEXT:
- Current time in Snakesia: ${snakesiaTime}
- Server: ${this.servers[this.currentServer].name}
- Channel: #${this.servers[this.currentServer].channels[this.currentChannel].name}
- Topic: ${this.servers[this.currentServer].channels[this.currentChannel].topic}

RECENT CHAT:
${recentMessages}

User just said: "${userMessage}"

RESPONSE RULES:
- Respond as ${characterName} in casual Discord chat style
- Keep it SHORT: 1-2 sentences maximum
- Be conversational and natural
- Stay in character
- Don't be overly helpful or formal
- React naturally to what the user said
- Use emoji occasionally if it fits the character

Response as ${characterName}:`;
    }

    getCharacterInfo(characterName) {
        // Try world context first (shared with messenger/email)
        const wcm = window.conversationHistoryManager;
        if (wcm && wcm.worldContext && wcm.worldContext.keyCharacters) {
            // Map dissscord usernames to world context IDs
            const usernameToId = {
                'RemiMarway': 'remi',
                'Snake_E_CEO': 'mr_snake_e',
                'Mrs_Snake_E': 'mrs_snake_e',
                'Rita': 'rita',
                'PushingCat': 'pushing_cat'
            };
            const charId = usernameToId[characterName];
            if (charId) {
                const char = wcm.worldContext.keyCharacters[charId];
                if (char) {
                    return {
                        description: `You are ${char.fullName || char.name}. ${char.details || char.description || ''} ${char.personality || ''}`
                    };
                }
            }
        }

        // Fallback: hardcoded descriptions for characters not in world context
        const fallbackMap = {
            'RemiMarway': 'You are Remi, a cool 12-year-old YouTuber and Minecraft player. You talk casually like "yo", "dude", "epic". You love gaming, making videos, and building in Minecraft.',
            'Snake_E_CEO': 'You are Mr. Snake-e, the 60-year-old CEO of ElxaCorp. You are intelligent, business-minded, and friendly. You talk professionally but warmly.',
            'Mrs_Snake_E': 'You are Mrs. Snake-e, an 80-year-old sweet grandmother who loves gardening and cooking. Very motherly, calls people "dear" and "sweetie".',
            'Rita': 'You are Rita, a kind and patient older sister with curly red hair. Very sweet, protective, and caring.',
            'PushingCat': 'You are Pushing Cat, a mischievous black cat who is very "sus" and playful. You talk like "*suspicious purring*" and use cat emojis.',
            'BlockMaster99': 'You are BlockMaster99, a dedicated Minecraft player who loves building. Enthusiastic about construction and admires Remi\'s work.',
            'RedstoneGuru': 'You are RedstoneGuru, a technical Minecraft player who specializes in redstone contraptions. Helpful and knowledgeable.',
            'CreativeBuilder': 'You are CreativeBuilder, a creative Minecraft player who loves designing structures. Artistic and always working on new projects.',
            'DevTeamLead': 'You are the lead developer at ElxaCorp. Technical, focused, and passionate about building great software.',
            'ElxaCorp_HR': 'You are the HR representative at ElxaCorp. Professional, friendly, and focused on company culture.',
            'ElxaCorp_IT': 'You are IT support at ElxaCorp. Tech-savvy, helpful, and always ready to troubleshoot.',
            'LocalMerchant': 'You are a local merchant in Snakesia. Friendly shopkeeper who knows everyone in town.',
            'CommunityHelper': 'You are a helpful community volunteer in Snakesia. Cheerful and always lending a hand.',
            'SnakesiaResident1': 'You are a friendly resident of Snakesia. You enjoy community events and chatting with neighbors.',
            'MischievousCat': 'You are a mischievous cat who hangs out with Pushing Cat. Equally sus and chaotic.',
            'SussyHelper1': 'You are one of Pushing Cat\'s loyal minions. You assist in suspicious schemes and say things like "yes boss".'
        };

        return { description: fallbackMap[characterName] || 'You are a friendly member of the Snakesia community.' };
    }

    getSnakesiaTime() {
        return window.elxaLLM ? window.elxaLLM.getSnakesiaTime() : new Date().toLocaleString();
    }

    getCurrentContext() {
        return {
            server: this.currentServer,
            channel: this.currentChannel,
            recentMessages: this.messages.slice(-5)
        };
    }

    addCharacterResponse(characterName, responseText) {
        console.log('🎮 Adding character response:', characterName, '→', responseText);
        
        const authorInfo = this.getAuthorInfo(characterName);
        
        const response = {
            id: Date.now() + Math.random(),
            author: characterName,
            authorInfo: authorInfo,
            text: responseText,
            timestamp: new Date(),
            type: 'llm_response'
        };
        
        this.addMessage(response);
        console.log('✅ Character response added to chat');
    }

    addTemplateResponse(characterName, userMessage) {
        console.log('🎮 Adding template response for:', characterName);
        
        // Personality-appropriate fallback lines for each character
        const responses = {
            'RemiMarway': [
                "yo that's cool!",
                "nice one dude",
                "haha awesome",
                "totally agree",
                "that's epic! 🔥"
            ],
            'Snake_E_CEO': [
                "Excellent point!",
                "Innovation at its finest.",
                "That's the spirit we need.",
                "Well said!",
                "Precisely."
            ],
            'Mrs_Snake_E': [
                "How wonderful, dear!",
                "That's so sweet!",
                "Bless your heart!",
                "Lovely to hear!",
                "You're such a sweetie!"
            ],
            'PushingCat': [
                "*suspicious purring*",
                "very sus... 😼",
                "*pushes something off table*",
                "meow meow",
                "*plots mischief*"
            ],
            'Rita': [
                "Aw, that's really nice!",
                "I love that! ❤️",
                "You're the best!",
                "That's so sweet of you",
                "haha you're too funny"
            ],
            'BlockMaster99': [
                "that's awesome, we should build that!",
                "nice! reminds me of my latest project",
                "oh sick, i love it",
                "yo we gotta try that in survival",
                "building time! 🧱"
            ],
            'RedstoneGuru': [
                "hmm interesting, could wire that up with redstone",
                "nice concept! the mechanics check out",
                "oh that's clever",
                "i could automate that tbh",
                "solid idea 🔧"
            ],
            'CreativeBuilder': [
                "ooh that gives me an idea for a build!",
                "love the aesthetic of that",
                "that would look amazing in game",
                "adding that to my inspiration board",
                "the vibes are immaculate ✨"
            ],
            'DevTeamLead': [
                "noted, adding to the backlog",
                "good feedback, thanks!",
                "we're working on something similar",
                "that's on the roadmap",
                "interesting use case"
            ],
            'ElxaCorp_HR': [
                "Great teamwork everyone!",
                "Love the collaboration!",
                "Reminder: team lunch this Friday!",
                "Wonderful energy in here!",
                "Keep up the great work!"
            ],
            'ElxaCorp_IT': [
                "have you tried turning it off and on again?",
                "should be patched in the next update",
                "works on my machine 🤷",
                "submitting a ticket for that",
                "that's a feature, not a bug"
            ],
            'MischievousCat': [
                "*knocks over monitor*",
                "hehe 😈",
                "*stares suspiciously*",
                "mrow?",
                "*is definitely up to something*"
            ],
            'SussyHelper1': [
                "yes boss! 😼",
                "on it!",
                "*takes notes suspiciously*",
                "operation is a go",
                "understood, very sus"
            ],
            'LocalMerchant': [
                "got a great deal for you!",
                "business is booming today!",
                "stop by the shop anytime!",
                "best prices in all of Snakesia!",
                "that's what I always say!"
            ],
            'CommunityHelper': [
                "happy to help!",
                "love seeing the community come together!",
                "that's the Snakesia spirit!",
                "let me know if you need anything!",
                "welcome, friend! 👋"
            ],
            'SnakesiaResident1': [
                "beautiful day in Snakesia!",
                "couldn't agree more",
                "that's the word around town",
                "haha classic",
                "love this community"
            ]
        };
        
        const characterResponses = responses[characterName] || ["haha nice", "oh cool!", "interesting!", "lol", "true true"];
        const randomResponse = characterResponses[Math.floor(Math.random() * characterResponses.length)];
        
        console.log('✅ Template response selected:', randomResponse);
        this.addCharacterResponse(characterName, randomResponse);
    }
}

// Initialize the app when the page loads
function initDissscord() {
    console.log('🎮 Dissscord: Starting initialization...');
    try {
        window.dissscordApp = new DissscordApp();
        console.log('✅ Dissscord: App initialized successfully');
    } catch (error) {
        console.error('❌ Dissscord: Failed to initialize:', error);
    }
}

// Try multiple initialization methods
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDissscord);
} else {
    // DOM already loaded, initialize immediately
    initDissscord();
}

// Fallback initialization after a short delay
setTimeout(() => {
    if (!window.dissscordApp) {
        console.log('🎮 Dissscord: Fallback initialization...');
        initDissscord();
    }
}, 500);