// =================================
// CONVERSATION HISTORY MANAGER - Cross-Platform Chat History
// Manages unified conversation history across Email and Messenger systems
// Handles intelligent summarization and memory management
// =================================

class ConversationHistoryManager {
    constructor() {
        this.worldContext = null;
        this.conversations = new Map(); // Character ID -> conversation data
        this.settings = {
            enabled: true,
            crossPlatformHistory: true,
            historyLength: 20, // messages before summarization
            autoSummarize: true,
            maxSummaryLength: 200, // max characters for each summary chunk
            summarizationThreshold: 30 // when to trigger summarization
        };
        
        this.apiKey = null;
        this.selectedModel = 'gemini-pro';
        
        console.log('📚 Conversation History Manager initialized');
        this.loadSettings();
        this.loadWorldContext();
        this.loadConversations();
    }

    // ===== INITIALIZATION =====

    async loadWorldContext() {
        try {
            console.log('🌍 Loading world context...');
            const response = await fetch('./assets/interwebs/exmail/world-context.json');
            if (!response.ok) {
                throw new Error(`Failed to load world context: ${response.status}`);
            }
            this.worldContext = await response.json();
            console.log('✅ World context loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load world context:', error);
            // Create minimal fallback context
            this.worldContext = {
                world: {
                    name: "Snakesia",
                    location: "west of Tennessee",
                    timezone: { offsetHours: 2, offsetMinutes: 1 }
                },
                keyCharacters: {},
                promptGuidelines: {}
            };
        }
    }

    loadSettings() {
        try {
            // Load settings from messenger system
            const messengerSettings = localStorage.getItem('snakesia-messenger-settings');
            if (messengerSettings) {
                const settings = JSON.parse(messengerSettings);
                this.apiKey = settings.apiKey;
                this.selectedModel = settings.selectedModel || 'gemini-pro';
                
                // Load LLM settings if they exist
                if (settings.llm) {
                    this.settings = {
                        ...this.settings,
                        enabled: settings.llm.enabled !== false,
                        crossPlatformHistory: settings.llm.crossPlatformHistory !== false,
                        historyLength: settings.llm.historyLength || 20,
                        autoSummarize: settings.llm.autoSummarize !== false
                    };
                }
                
                console.log('🔧 Loaded settings from messenger system');
            }
        } catch (error) {
            console.error('❌ Failed to load settings:', error);
        }
    }

    // ===== MESSAGE MANAGEMENT =====

    addMessage(characterId, messageData) {
        if (!this.settings.enabled || !this.settings.crossPlatformHistory) {
            console.log('📚 Cross-platform history disabled, skipping');
            return;
        }

        console.log(`📝 Adding message to history for ${characterId}:`, messageData);

        // Ensure conversation exists
        if (!this.conversations.has(characterId)) {
            this.conversations.set(characterId, {
                characterId: characterId,
                summary: '',
                recentHistory: [],
                totalMessages: 0,
                lastUpdated: new Date().toISOString(),
                lastSummarized: null
            });
        }

        const conversation = this.conversations.get(characterId);

        // Standardize message format
        const standardMessage = this.standardizeMessage(messageData);
        
        // Add to recent history
        conversation.recentHistory.push(standardMessage);
        conversation.totalMessages++;
        conversation.lastUpdated = new Date().toISOString();

        // Check if we need to summarize
        if (this.shouldSummarize(conversation)) {
            this.scheduleSummarization(characterId);
        }

        // Save immediately
        this.saveConversations();
    }

    standardizeMessage(messageData) {
        // Convert different message formats (email/messenger) to standard format
        return {
            type: messageData.type || 'message', // 'message', 'email'
            sender: messageData.sender || (messageData.from ? 'character' : 'user'),
            content: messageData.content || messageData.text || messageData.body || '',
            subject: messageData.subject || null, // Only for emails
            timestamp: messageData.timestamp || messageData.date || new Date().toISOString(),
            platform: messageData.platform || 'unknown' // 'messenger', 'email'
        };
    }

    // ===== HISTORY RETRIEVAL =====

    getConversationHistory(characterId, includeContext = true) {
        if (!this.conversations.has(characterId)) {
            return includeContext ? this.getEmptyHistoryWithContext(characterId) : [];
        }

        const conversation = this.conversations.get(characterId);
        
        if (!includeContext) {
            return conversation.recentHistory || [];
        }

        // Build context with summary + recent history
        let contextualHistory = [];

        // Add summary as context if it exists
        if (conversation.summary && conversation.summary.trim()) {
            contextualHistory.push({
                type: 'summary',
                sender: 'system',
                content: `Previous conversation summary: ${conversation.summary}`,
                timestamp: conversation.lastSummarized || conversation.lastUpdated,
                platform: 'system'
            });
        }

        // Add recent detailed history
        contextualHistory = contextualHistory.concat(conversation.recentHistory || []);

        return contextualHistory;
    }

    getEmptyHistoryWithContext(characterId) {
        // Return empty history but with character context for new conversations
        return [];
    }

    // ===== SUMMARIZATION =====

    shouldSummarize(conversation) {
        if (!this.settings.autoSummarize) return false;
        
        const recentCount = conversation.recentHistory.length;
        return recentCount >= this.settings.summarizationThreshold;
    }

    async scheduleSummarization(characterId) {
        // Add small delay to batch multiple rapid messages
        setTimeout(() => {
            this.performSummarization(characterId);
        }, 2000);
    }

    async performSummarization(characterId) {
        console.log(`🧠 Starting summarization for ${characterId}...`);

        const conversation = this.conversations.get(characterId);
        if (!conversation || conversation.recentHistory.length < this.settings.summarizationThreshold) {
            return;
        }

        try {
            // Take the oldest messages to summarize
            const messagesToSummarize = conversation.recentHistory.slice(0, this.settings.historyLength);
            const keepRecent = conversation.recentHistory.slice(this.settings.historyLength);

            // Generate summary using LLM
            const newSummary = await this.generateSummary(characterId, messagesToSummarize, conversation.summary);

            if (newSummary) {
                // Update conversation
                conversation.summary = newSummary;
                conversation.recentHistory = keepRecent;
                conversation.lastSummarized = new Date().toISOString();

                console.log(`✅ Summarization completed for ${characterId}. Recent history: ${keepRecent.length} messages`);
                this.saveConversations();
            } else {
                console.log(`⚠️ Summarization failed for ${characterId}, keeping full history`);
            }

        } catch (error) {
            console.error(`❌ Summarization error for ${characterId}:`, error);
        }
    }

    async generateSummary(characterId, messages, existingSummary) {
        if (!this.apiKey) {
            console.log('⚠️ No API key available for summarization');
            return this.createFallbackSummary(messages);
        }

        try {
            const character = this.getCharacterInfo(characterId);
            const prompt = this.buildSummarizationPrompt(characterId, messages, existingSummary, character);

            console.log(`🤖 Generating LLM summary for ${characterId}...`);

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.selectedModel}:generateContent?key=${this.apiKey}`, {
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
                        temperature: 0.3, // Lower for more consistent summaries
                        topP: 0.8
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Gemini API Error: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
                const summary = data.candidates[0].content.parts[0].text.trim();
                console.log('✅ LLM summary generated successfully');
                return summary;
            } else {
                throw new Error('Invalid API response format');
            }

        } catch (error) {
            console.error('❌ LLM summarization failed:', error);
            return this.createFallbackSummary(messages);
        }
    }

    buildSummarizationPrompt(characterId, messages, existingSummary, character) {
        const userName = this.getUserName();
        
        let prompt = `You are helping to summarize a conversation between ${userName} and ${character.name} from Snakesia.

TASK: Create a concise summary of the following conversation messages that preserves:
- Key topics discussed
- Important events or developments mentioned
- Character personality and relationship dynamics
- Story progression elements

`;

        if (existingSummary) {
            prompt += `EXISTING SUMMARY: ${existingSummary}\n\n`;
        }

        prompt += `MESSAGES TO SUMMARIZE:\n`;
        messages.forEach((msg, index) => {
            const speaker = msg.sender === 'user' ? userName : character.name;
            const platform = msg.platform ? `[${msg.platform}]` : '';
            const subject = msg.subject ? `"${msg.subject}"` : '';
            prompt += `${index + 1}. ${speaker} ${platform} ${subject}: ${msg.content}\n`;
        });

        prompt += `\nCreate a brief summary (2-3 sentences max) that captures the essential information from these messages. Focus on story elements and character development:`;

        return prompt;
    }

    createFallbackSummary(messages) {
        // Simple fallback summarization when LLM isn't available
        const messageCount = messages.length;
        const platforms = [...new Set(messages.map(m => m.platform))].join(' and ');
        const timespan = this.getTimespan(messages);
        
        return `Previous ${messageCount} messages exchanged via ${platforms} ${timespan}. Conversation covered various topics and continued building the relationship.`;
    }

    getTimespan(messages) {
        if (messages.length < 2) return 'recently';
        
        const first = new Date(messages[0].timestamp);
        const last = new Date(messages[messages.length - 1].timestamp);
        const diffDays = Math.ceil((last - first) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 1) return 'today';
        if (diffDays <= 7) return 'this week';
        if (diffDays <= 30) return 'this month';
        return 'recently';
    }

    // ===== UTILITY METHODS =====

    getCharacterInfo(characterId) {
        if (this.worldContext && this.worldContext.keyCharacters && this.worldContext.keyCharacters[characterId]) {
            return this.worldContext.keyCharacters[characterId];
        }
        
        // Fallback character info
        return {
            name: characterId.replace('_', ' '),
            fullName: characterId.replace('_', ' ')
        };
    }

    getUserName() {
        // Try to get user name from messenger settings
        try {
            const messengerSettings = localStorage.getItem('snakesia-messenger-settings');
            if (messengerSettings) {
                const settings = JSON.parse(messengerSettings);
                return settings.username || 'User';
            }
        } catch (error) {
            console.error('Failed to get username:', error);
        }
        return 'User';
    }

    getSnakesiaTime() {
        const now = new Date();
        const snakesiaTime = new Date(now.getTime() + (2 * 60 + 1) * 60 * 1000);
        return snakesiaTime.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric', 
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        }) + ' (Snakesia Time)';
    }

    // ===== PROMPT BUILDING =====

    buildContextPrompt(characterId, includeWorldContext = true) {
        const character = this.getCharacterInfo(characterId);
        const userName = this.getUserName();
        let prompt = '';

        if (includeWorldContext && this.worldContext) {
            const world = this.worldContext.world;
            prompt += `WORLD CONTEXT:
- You live in ${world.name}, ${world.location}
- Current time: ${this.getSnakesiaTime()}
- Currency: ${world.currency.name} (${world.currency.exchangeRate})
- You communicate via the ExWeb

`;
        }

        prompt += `CHARACTER CONTEXT:
- You are ${character.fullName || character.name}
- ${character.role ? `Role: ${character.role}` : ''}
- ${character.personality ? `Personality: ${character.personality}` : ''}
- You're communicating with ${userName}

`;

        return prompt;
    }

    // ===== STORAGE MANAGEMENT =====

    saveConversations() {
        try {
            const conversationData = Array.from(this.conversations.entries());
            
            // Save to localStorage
            localStorage.setItem('elxaOS-conversation-history', JSON.stringify(conversationData));
            console.log('💾 Conversation history saved to localStorage');

            // Also save to ElxaOS file system if available
            if (typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
                try {
                    // Ensure the ConversationHistory folder exists
                    elxaOS.fileSystem.createFolder(['root', 'System'], 'ConversationHistory');
                    
                    const content = JSON.stringify(conversationData, null, 2);
                    elxaOS.fileSystem.createFile(['root', 'System', 'ConversationHistory'], 'conversations.json', content, 'json');
                    console.log('✅ Also saved conversation history to ElxaOS file system');
                } catch (fsError) {
                    console.log('📁 ElxaOS file system not available for conversations');
                }
            }

        } catch (error) {
            console.error('❌ Failed to save conversation history:', error);
        }
    }

    loadConversations() {
        try {
            // First try localStorage
            const localData = localStorage.getItem('elxaOS-conversation-history');
            if (localData) {
                const conversationData = JSON.parse(localData);
                this.conversations = new Map(conversationData);
                console.log(`📁 Loaded ${this.conversations.size} conversations from localStorage`);
                return;
            }

            // Try ElxaOS file system as fallback
            if (typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
                try {
                    const file = elxaOS.fileSystem.getFile(['root', 'System', 'ConversationHistory'], 'conversations.json');
                    if (file && file.content) {
                        const conversationData = JSON.parse(file.content);
                        this.conversations = new Map(conversationData);
                        console.log(`📁 Loaded ${this.conversations.size} conversations from ElxaOS file system`);
                        
                        // Cache to localStorage for future
                        localStorage.setItem('elxaOS-conversation-history', JSON.stringify(conversationData));
                        return;
                    }
                } catch (fsError) {
                    console.log('📁 No existing conversation history in file system');
                }
            }

            console.log('📚 No existing conversation history found, starting fresh');

        } catch (error) {
            console.error('❌ Failed to load conversation history:', error);
            this.conversations = new Map();
        }
    }

    // ===== PUBLIC API =====

    isEnabled() {
        return this.settings.enabled && this.settings.crossPlatformHistory;
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        console.log('🔧 Conversation history settings updated:', this.settings);
    }

    getStats() {
        const totalConversations = this.conversations.size;
        const totalMessages = Array.from(this.conversations.values())
            .reduce((sum, conv) => sum + conv.totalMessages, 0);
        
        return {
            enabled: this.isEnabled(),
            totalConversations,
            totalMessages,
            settings: this.settings
        };
    }

    clearHistory(characterId = null) {
        if (characterId) {
            // Clear specific character
            this.conversations.delete(characterId);
            console.log(`🗑️ Cleared conversation history for ${characterId}`);
        } else {
            // Clear all
            this.conversations.clear();
            console.log('🗑️ Cleared all conversation history');
        }
        
        this.saveConversations();
    }

    // Export conversation for backup/analysis
    exportConversation(characterId) {
        const conversation = this.conversations.get(characterId);
        if (!conversation) return null;

        return {
            characterId,
            exportDate: new Date().toISOString(),
            conversation: {
                ...conversation,
                recentHistory: [...conversation.recentHistory]
            }
        };
    }
}

// Create global instance
window.conversationHistoryManager = new ConversationHistoryManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConversationHistoryManager;
}