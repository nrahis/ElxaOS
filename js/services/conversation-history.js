// =================================
// CONVERSATION HISTORY MANAGER - Cross-Platform Chat History
// Manages unified conversation history across Email and Messenger systems
// Handles intelligent summarization and memory management
// Uses window.elxaLLM for all API calls (no duplicate fetch code)
//
// STORAGE: Per-user conversation data via ElxaRegistry (IndexedDB)
// WORLD DATA: Via ElxaRegistry (no independent fetch)
// =================================

class ConversationHistoryManager {
    constructor() {
        this.worldContext = null;
        this.conversations = new Map(); // Character ID -> conversation data
        this._registry = null;
        this._connected = false;
        this._savePending = false;
        this._saveTimer = null;

        this.settings = {
            enabled: true,
            crossPlatformHistory: true,
            historyLength: 20, // messages before summarization
            autoSummarize: true,
            maxSummaryLength: 200,
            summarizationThreshold: 30
        };

        // Promise that resolves when worldContext is available.
        // Messenger awaits this before reading this.worldContext.
        this._resolveWorldReady = null;
        this.worldContextReady = new Promise(resolve => {
            this._resolveWorldReady = resolve;
        });

        // Load LLM behavior settings (these live in messenger settings
        // until the full messenger migration happens)
        this._loadLLMSettings();

        console.log('📚 Conversation History Manager initialized (waiting for registry)');
    }

    // =================================
    // REGISTRY CONNECTION
    // =================================
    // Called by ElxaOS.asyncInit() after registry is ready.

    async init() {
        if (typeof elxaOS === 'undefined' || !elxaOS.registry) {
            console.warn('⚠️ ConversationHistory: registry not available, using fallback');
            await this._fallbackInit();
            return;
        }

        this._registry = elxaOS.registry;
        this._connected = true;

        // World context — grab from registry (already loaded)
        await this._registry.worldReady();
        this.worldContext = this._registry.getFullWorldContext();
        this._resolveWorldReady();
        console.log('📚 World context loaded via registry');

        // Listen for user login/logout to swap conversation data
        elxaOS.eventBus.on('registry.userLoaded', async (data) => {
            await this._onUserLoaded(data.username);
        });

        elxaOS.eventBus.on('login.logout', () => {
            this._onLogout();
        });

        // If a user is already logged in (shouldn't normally happen, but just in case)
        if (this._registry.isLoggedIn()) {
            await this._onUserLoaded(this._registry.getCurrentUsername());
        }

        console.log('📚 Conversation History Manager connected to registry');
    }

    // Fallback for the unlikely case registry isn't available
    async _fallbackInit() {
        try {
            const response = await fetch('./data/world-context.json');
            if (response.ok) this.worldContext = await response.json();
        } catch (e) {
            this.worldContext = { world: { name: 'Snakesia' }, keyCharacters: {} };
        }
        this._resolveWorldReady();
        this._loadFromLocalStorage();
    }

    // =================================
    // USER SWITCH HANDLING
    // =================================

    async _onUserLoaded(username) {
        // Flush any pending saves for previous user
        this._flushSave();

        console.log(`📚 Loading conversations for user "${username}"`);

        // Try registry state first
        const saved = await this._registry.getState('conversationHistory');
        if (saved) {
            this.conversations = new Map(saved);
            console.log(`📚 Loaded ${this.conversations.size} conversations from registry`);
        } else {
            // One-time migration: pull from old shared localStorage
            this._migrateFromLocalStorage();
        }
    }

    _onLogout() {
        this._flushSave();
        this.conversations = new Map();
        console.log('📚 Conversations cleared on logout');
    }

    // =================================
    // ONE-TIME MIGRATION
    // =================================

    _migrateFromLocalStorage() {
        try {
            const localData = localStorage.getItem('elxaOS-conversation-history');
            if (localData) {
                const parsed = JSON.parse(localData);
                this.conversations = new Map(parsed);
                console.log(`📚 Migrated ${this.conversations.size} conversations from localStorage`);
                // Save to registry immediately so we don't migrate again
                this._saveToRegistry();
            } else {
                this.conversations = new Map();
                console.log('📚 No existing conversation history, starting fresh');
            }
        } catch (e) {
            console.error('❌ Migration from localStorage failed:', e);
            this.conversations = new Map();
        }
    }

    _loadFromLocalStorage() {
        try {
            const localData = localStorage.getItem('elxaOS-conversation-history');
            if (localData) {
                this.conversations = new Map(JSON.parse(localData));
                console.log(`📚 Loaded ${this.conversations.size} conversations from localStorage (fallback)`);
            }
        } catch (e) {
            this.conversations = new Map();
        }
    }

    // =================================
    // MESSAGE MANAGEMENT
    // =================================

    addMessage(characterId, messageData) {
        if (!this.settings.enabled || !this.settings.crossPlatformHistory) {
            return;
        }

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
        conversation.recentHistory.push(this._standardizeMessage(messageData));
        conversation.totalMessages++;
        conversation.lastUpdated = new Date().toISOString();

        if (this._shouldSummarize(conversation)) {
            this._scheduleSummarization(characterId);
        }

        this.saveConversations();
    }

    _standardizeMessage(messageData) {
        return {
            type: messageData.type || 'message',
            sender: messageData.sender || (messageData.from ? 'character' : 'user'),
            content: messageData.content || messageData.text || messageData.body || '',
            subject: messageData.subject || null,
            timestamp: messageData.timestamp || messageData.date || new Date().toISOString(),
            platform: messageData.platform || 'unknown'
        };
    }

    // =================================
    // HISTORY RETRIEVAL
    // =================================

    getConversationHistory(characterId, includeContext = true) {
        if (!this.conversations.has(characterId)) {
            return [];
        }

        const conversation = this.conversations.get(characterId);

        if (!includeContext) {
            return conversation.recentHistory || [];
        }

        let contextualHistory = [];

        if (conversation.summary && conversation.summary.trim()) {
            contextualHistory.push({
                type: 'summary',
                sender: 'system',
                content: `Previous conversation summary: ${conversation.summary}`,
                timestamp: conversation.lastSummarized || conversation.lastUpdated,
                platform: 'system'
            });
        }

        contextualHistory = contextualHistory.concat(conversation.recentHistory || []);
        return contextualHistory;
    }

    // =================================
    // SUMMARIZATION
    // =================================

    _shouldSummarize(conversation) {
        if (!this.settings.autoSummarize) return false;
        return conversation.recentHistory.length >= this.settings.summarizationThreshold;
    }

    _scheduleSummarization(characterId) {
        setTimeout(() => this._performSummarization(characterId), 2000);
    }

    async _performSummarization(characterId) {
        console.log(`🧠 Starting summarization for ${characterId}...`);

        const conversation = this.conversations.get(characterId);
        if (!conversation || conversation.recentHistory.length < this.settings.summarizationThreshold) {
            return;
        }

        try {
            const messagesToSummarize = conversation.recentHistory.slice(0, this.settings.historyLength);
            const keepRecent = conversation.recentHistory.slice(this.settings.historyLength);

            const newSummary = await this._generateSummary(characterId, messagesToSummarize, conversation.summary);

            if (newSummary) {
                conversation.summary = newSummary;
                conversation.recentHistory = keepRecent;
                conversation.lastSummarized = new Date().toISOString();
                console.log(`✅ Summarization completed for ${characterId}. Kept ${keepRecent.length} recent messages`);
                this.saveConversations();
            }
        } catch (error) {
            console.error(`❌ Summarization error for ${characterId}:`, error);
        }
    }

    async _generateSummary(characterId, messages, existingSummary) {
        if (!window.elxaLLM || !window.elxaLLM.isAvailable()) {
            return this._createFallbackSummary(messages);
        }

        try {
            const character = this.getCharacterInfo(characterId);
            const userName = this.getUserName();

            let prompt = `You are helping to summarize a conversation between ${userName} and ${character.name || character.fullName} from Snakesia.

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
                const speaker = msg.sender === 'user' ? userName : (character.name || character.fullName);
                const platform = msg.platform ? `[${msg.platform}]` : '';
                const subject = msg.subject ? `"${msg.subject}"` : '';
                prompt += `${index + 1}. ${speaker} ${platform} ${subject}: ${msg.content}\n`;
            });

            prompt += `\nCreate a brief summary (2-3 sentences max) that captures the essential information from these messages. Focus on story elements and character development:`;

            const summary = await window.elxaLLM.generateContent(prompt, {
                maxTokens: 150,
                temperature: 0.3,
                topP: 0.8
            });

            if (summary) return summary.trim();
            throw new Error('Empty response');
        } catch (error) {
            console.error('❌ LLM summarization failed:', error);
            return this._createFallbackSummary(messages);
        }
    }

    _createFallbackSummary(messages) {
        const count = messages.length;
        const platforms = [...new Set(messages.map(m => m.platform))].join(' and ');
        const first = new Date(messages[0].timestamp);
        const last = new Date(messages[messages.length - 1].timestamp);
        const days = Math.ceil((last - first) / (1000 * 60 * 60 * 24));
        const timespan = days <= 1 ? 'today' : days <= 7 ? 'this week' : days <= 30 ? 'this month' : 'recently';
        return `Previous ${count} messages exchanged via ${platforms} ${timespan}. Conversation covered various topics and continued building the relationship.`;
    }

    // =================================
    // DATA ACCESS (via registry when available)
    // =================================

    getCharacterInfo(characterId) {
        // Prefer registry (canonical source)
        if (this._registry) {
            const character = this._registry.getCharacter(characterId);
            if (character) return character;
        }

        // Fallback to local worldContext cache
        if (this.worldContext?.keyCharacters?.[characterId]) {
            return this.worldContext.keyCharacters[characterId];
        }

        return {
            name: characterId.replace(/_/g, ' '),
            fullName: characterId.replace(/_/g, ' ')
        };
    }

    getUserName() {
        // Prefer registry (canonical source)
        if (this._registry && this._registry.isLoggedIn()) {
            // getUserField is async, but we need sync here.
            // Use the cached profile if available.
            const username = this._registry._profileCache?.displayName;
            if (username) return username;
        }

        // Fallback to messenger settings (legacy)
        try {
            const messengerSettings = localStorage.getItem('snakesia-messenger-settings');
            if (messengerSettings) {
                const settings = JSON.parse(messengerSettings);
                return settings.username || 'User';
            }
        } catch (e) { /* ignore */ }

        return 'User';
    }

    // =================================
    // PROMPT BUILDING
    // =================================

    buildContextPrompt(characterId, includeWorldContext = true) {
        const character = this.getCharacterInfo(characterId);
        const userName = this.getUserName();
        const snakesiaTime = window.elxaLLM ? window.elxaLLM.getSnakesiaTime() : 'Unknown';
        let prompt = '';

        const world = this._registry ? this._registry.getWorld() : this.worldContext?.world;

        if (includeWorldContext && world) {
            prompt += `WORLD CONTEXT:
- You live in ${world.name}, ${world.location || 'west of Tennessee'}
- Current time: ${snakesiaTime}
- Currency: ${world.currency?.name || 'snakes'} (${world.currency?.exchangeRate || '1 USD = 2 snakes'})
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

    // =================================
    // STORAGE
    // =================================

    saveConversations() {
        // Debounce saves — multiple addMessage calls in quick succession
        if (this._saveTimer) return;
        this._savePending = true;
        this._saveTimer = setTimeout(() => {
            this._saveTimer = null;
            this._flushSave();
        }, 500);
    }

    _flushSave() {
        if (this._saveTimer) {
            clearTimeout(this._saveTimer);
            this._saveTimer = null;
        }
        if (!this._savePending) return;
        this._savePending = false;

        if (this._connected && this._registry && this._registry.isLoggedIn()) {
            this._saveToRegistry();
        } else {
            this._saveToLocalStorage();
        }
    }

    async _saveToRegistry() {
        try {
            const data = Array.from(this.conversations.entries());
            await this._registry.setState('conversationHistory', data);
            console.log('💾 Conversations saved via registry');
        } catch (err) {
            console.error('❌ Failed to save conversations to registry:', err);
            this._saveToLocalStorage(); // fallback
        }
    }

    _saveToLocalStorage() {
        try {
            const data = Array.from(this.conversations.entries());
            localStorage.setItem('elxaOS-conversation-history', JSON.stringify(data));
        } catch (err) {
            console.error('❌ Failed to save conversations to localStorage:', err);
        }
    }

    // =================================
    // SETTINGS
    // =================================

    _loadLLMSettings() {
        try {
            const messengerSettings = localStorage.getItem('snakesia-messenger-settings');
            if (messengerSettings) {
                const settings = JSON.parse(messengerSettings);
                if (settings.llm) {
                    this.settings = {
                        ...this.settings,
                        enabled: settings.llm.enabled !== false,
                        crossPlatformHistory: settings.llm.crossPlatformHistory !== false,
                        historyLength: settings.llm.historyLength || 20,
                        autoSummarize: settings.llm.autoSummarize !== false
                    };
                }
            }
        } catch (e) { /* ignore */ }
    }

    // =================================
    // PUBLIC API
    // =================================

    isEnabled() {
        return this.settings.enabled && this.settings.crossPlatformHistory;
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }

    getStats() {
        const totalMessages = Array.from(this.conversations.values())
            .reduce((sum, conv) => sum + conv.totalMessages, 0);

        return {
            enabled: this.isEnabled(),
            totalConversations: this.conversations.size,
            totalMessages,
            settings: this.settings
        };
    }

    clearHistory(characterId = null) {
        if (characterId) {
            this.conversations.delete(characterId);
        } else {
            this.conversations.clear();
        }
        this.saveConversations();
    }

    exportConversation(characterId) {
        const conversation = this.conversations.get(characterId);
        if (!conversation) return null;

        return {
            characterId,
            exportDate: new Date().toISOString(),
            conversation: { ...conversation, recentHistory: [...conversation.recentHistory] }
        };
    }
}

// Global instance — created at load, connected to registry later via init()
window.conversationHistoryManager = new ConversationHistoryManager();
