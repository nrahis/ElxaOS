// =================================
// EMAIL LLM SERVICE - AI Character Responses for ElxaMail
// Handles LLM integration with story progression and memory management
// Uses window.elxaLLM for all API calls (no duplicate fetch code)
// =================================

class EmailLLMService {
    constructor(emailSystem) {
        this.emailSystem = emailSystem;

        // Use conversation history manager for cross-platform memory
        this.conversationManager = null;
        this.worldContext = null;

        this.initializeManagers();

        console.log('📧🤖 Email LLM Service initialized');
    }

    // ===== INITIALIZATION =====

    initializeManagers() {
        try {
            if (window.conversationHistoryManager) {
                this.conversationManager = window.conversationHistoryManager;
                this.worldContext = window.conversationHistoryManager.worldContext;
                console.log('✅ Connected to conversation history manager and world context');
            } else {
                console.log('⚠️ Conversation history manager not available');
            }
        } catch (error) {
            console.error('❌ Failed to initialize managers:', error);
        }
    }

    getUserProfile() {
        try {
            const messengerSettings = localStorage.getItem('snakesia-messenger-settings');
            if (messengerSettings) {
                const settings = JSON.parse(messengerSettings);
                return {
                    username: settings.username || 'User',
                    about: settings.about || 'a nice person'
                };
            }
        } catch (error) {
            console.error('❌ Failed to load user profile:', error);
        }

        if (this.emailSystem.currentUser) {
            return {
                username: this.emailSystem.currentUser.displayName,
                about: 'an ElxaMail user'
            };
        }

        return { username: 'User', about: 'a nice person' };
    }

    // ===== MAIN LLM INTEGRATION =====

    async generateCharacterResponse(contact, incomingEmail) {
        if (!window.elxaLLM || !window.elxaLLM.isAvailable()) {
            console.log('⚠️ LLM not available for email response');
            return this.getFallbackResponse(contact);
        }

        try {
            console.log(`🤖 Generating LLM response for ${contact.name}`);

            const conversationHistory = this.conversationManager ?
                this.conversationManager.getConversationHistory(contact.id, true) : [];

            const userProfile = this.getUserProfile();
            const prompt = this.buildPrompt(contact, incomingEmail, conversationHistory, userProfile);

            console.log(`📝 Prompt length: ${prompt.length} characters`);

            const response = await window.elxaLLM.generateContent(prompt, {
                maxTokens: 200,
                temperature: 0.8,
                topP: 0.9
            });

            if (response) {
                console.log('✅ LLM response generated successfully');
                return this.processResponse(response);
            } else {
                throw new Error('Empty response from LLM');
            }
        } catch (error) {
            console.error('❌ LLM generation failed:', error);
            return this.getFallbackResponse(contact);
        }
    }

    // ===== PROMPT CONSTRUCTION =====

    buildPrompt(contact, incomingEmail, conversationHistory, userProfile) {
        const snakesiaTime = window.elxaLLM ? window.elxaLLM.getSnakesiaTime() : 'Unknown';
        const approvedSitesList = this.getApprovedSitesList();

        const character = this.getCharacterFromWorldContext(contact.id);

        let conversationContext = '';
        if (conversationHistory && conversationHistory.length > 0) {
            conversationContext = '\n\nCONVERSATION HISTORY:\n';
            conversationHistory.forEach((msg, index) => {
                if (msg.type === 'summary') {
                    conversationContext += `SUMMARY: ${msg.content}\n`;
                } else {
                    const isFromUser = msg.sender === 'user';
                    const sender = isFromUser ? userProfile.username : character.fullName || character.name;
                    const platform = msg.platform ? `[${msg.platform}]` : '';
                    const subject = msg.subject ? `"${msg.subject}"` : '';
                    conversationContext += `${index + 1}. ${sender} ${platform} ${subject}: "${this.condenseEmailBody(msg.content)}"\n`;
                }
            });
        }

        const basePrompt = `You are ${character.fullName || character.name} from Snakesia. ${character.description || character.details || ''} ${character.personality}

IMPORTANT CONTEXT:
- You live in ${this.worldContext?.world?.name || 'Snakesia'}, ${this.worldContext?.world?.location || 'west of Tennessee'} (timezone: exactly 2 hours 1 minute ahead of user's time)
- Current Snakesia time: ${snakesiaTime}
- Currency: ${this.worldContext?.world?.currency?.name || 'snakes'} (${this.worldContext?.world?.currency?.exchangeRate || '1 USD = 2 snakes'})
- You're corresponding with ${userProfile.username}, who is ${userProfile.about}
- This is EMAIL correspondence, not chat - use proper email format
- Write professionally but stay in character

RESPONSE REQUIREMENTS:
- KEEP IT SHORT: 2-4 sentences maximum for typical responses
- BE PROACTIVE: Don't just respond, advance the narrative
- Share brief news, events, or developments from your perspective
- Reference ongoing activities, projects, or interests when relevant
- Create opportunities for future interaction
- Use your unique voice while moving the story forward
- Make each email feel like a natural part of an ongoing relationship${conversationContext}

CURRENT EMAIL FROM ${userProfile.username}:
Subject: "${incomingEmail.subject}"
Message: "${incomingEmail.body}"

${approvedSitesList ? `APPROVED WEBSITES (only mention these if relevant):
${approvedSitesList}` : ''}

Write a SHORT email response as ${character.fullName || character.name}. Include a brief signature. Be proactive but concise:`;

        return basePrompt;
    }

    getCharacterFromWorldContext(characterId) {
        if (this.worldContext && this.worldContext.keyCharacters && this.worldContext.keyCharacters[characterId]) {
            return this.worldContext.keyCharacters[characterId];
        }

        return {
            name: characterId.replace('_', ' '),
            fullName: characterId.replace('_', ' '),
            personality: 'Friendly and helpful.',
            description: 'A resident of Snakesia.'
        };
    }

    getApprovedSitesList() {
        if (!this.worldContext || !this.worldContext.approvedWebsites) return '';

        return this.worldContext.approvedWebsites.map(site =>
            `- ${site.url}: ${site.description}`
        ).join('\n');
    }

    condenseEmailBody(body) {
        const cleaned = body.replace(/\s+/g, ' ').trim();
        return cleaned.length > 200 ? cleaned.substring(0, 200) + '...' : cleaned;
    }

    // ===== RESPONSE PROCESSING =====

    processResponse(rawResponse) {
        let processed = rawResponse.trim();

        // Hard limit: Keep emails reasonable length
        if (processed.length > 800) {
            const sentences = processed.match(/[^\.!?]*[\.!?]+/g) || [];
            let truncated = '';
            for (const sentence of sentences) {
                if ((truncated + sentence).length <= 750) {
                    truncated += sentence;
                } else {
                    break;
                }
            }

            if (truncated.length > 100) {
                processed = truncated.trim();
            } else {
                processed = processed.substring(0, 750).trim() + '...';
            }
        }

        processed = this.validateLinks(processed);
        return processed;
    }

    validateLinks(text) {
        const urlPattern = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.ex)\b/g;

        return text.replace(urlPattern, (match, domain) => {
            const approvedSites = this.worldContext?.approvedWebsites || [];
            const approved = approvedSites.find(site => site.url === domain);
            if (approved) {
                return match;
            } else {
                return `[${domain}]`;
            }
        });
    }

    getFallbackResponse(contact) {
        const responses = this.emailSystem.characterResponses[contact.id];
        if (responses && responses.length > 0) {
            const templateResponse = responses[Math.floor(Math.random() * responses.length)];
            console.log('📝 Using template response from character-responses.json');
            return templateResponse;
        }

        console.log('📝 Using default fallback response from character-responses.json');
        return this.emailSystem.defaultResponse
            .replace('{contactName}', contact.name)
            .replace('{contactTitle}', contact.title || '');
    }

    // ===== PUBLIC API =====

    isAvailable() {
        return window.elxaLLM && window.elxaLLM.isAvailable();
    }

    getStatus() {
        const approvedSitesCount = this.worldContext?.approvedWebsites?.length || 0;

        return {
            available: this.isAvailable(),
            model: window.elxaLLM ? window.elxaLLM.getModel() : 'none',
            approvedSites: approvedSitesCount,
            worldContextLoaded: !!this.worldContext
        };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmailLLMService;
}
