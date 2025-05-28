// =================================
// EMAIL LLM SERVICE - AI Character Responses for ElxaMail
// Handles LLM integration with story progression and memory management
// =================================

class EmailLLMService {
    constructor(emailSystem) {
        this.emailSystem = emailSystem;
        this.apiKey = null;
        this.selectedModel = 'gemini-pro';
        
        // Use conversation history manager instead of local history
        this.conversationManager = null;
        this.worldContext = null;
        
        this.loadSettings();
        this.initializeManagers();
        
        console.log('📧🤖 Email LLM Service initialized');
    }

    // ===== INITIALIZATION =====

    initializeManagers() {
        try {
            // Connect to conversation history manager
            if (typeof conversationHistoryManager !== 'undefined') {
                this.conversationManager = conversationHistoryManager;
                this.worldContext = conversationHistoryManager.worldContext;
                console.log('✅ Connected to conversation history manager and world context');
            } else {
                console.log('⚠️ Conversation history manager not available');
            }
        } catch (error) {
            console.error('❌ Failed to initialize managers:', error);
        }
    }

    // ===== SETTINGS MANAGEMENT =====

    loadSettings() {
        try {
            // Load API settings from messenger system for consistency
            const messengerSettings = localStorage.getItem('snakesia-messenger-settings');
            if (messengerSettings) {
                const settings = JSON.parse(messengerSettings);
                this.apiKey = settings.apiKey;
                this.selectedModel = settings.selectedModel || 'gemini-pro';
                console.log('🔑 Loaded API settings from messenger system');
            } else {
                console.log('⚠️ No messenger settings found, API not available');
            }
        } catch (error) {
            console.error('❌ Failed to load LLM settings:', error);
        }
    }

    getUserProfile() {
        try {
            // Load user profile from messenger for consistency
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
        
        // Fallback to email user if messenger profile not available
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
        if (!this.apiKey) {
            console.log('⚠️ No API key available for LLM response');
            return this.getFallbackResponse(contact);
        }

        try {
            console.log(`🤖 Generating LLM response for ${contact.name}`);
            
            // Get conversation history from shared manager
            const conversationHistory = this.conversationManager ? 
                this.conversationManager.getConversationHistory(contact.id, true) : [];
            
            // Get user profile for context
            const userProfile = this.getUserProfile();
            
            // Build the LLM prompt using world context and conversation history
            const prompt = this.buildPrompt(contact, incomingEmail, conversationHistory, userProfile);
            
            console.log(`📝 Prompt length: ${prompt.length} characters`);
            
            // Make API call to Gemini
            const response = await this.callGeminiAPI(prompt);
            
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

    async callGeminiAPI(prompt) {
        try {
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
                        maxOutputTokens: 200, // Much shorter - typical email length
                        temperature: 0.8,
                        topP: 0.9
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH", 
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`Gemini API Error: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
                return data.candidates[0].content.parts[0].text;
            } else {
                console.error('🚫 Invalid API response format:', data);
                return null;
            }
        } catch (error) {
            console.error('🚫 Gemini API call failed:', error);
            return null;  
        }
    }

    // ===== PROMPT CONSTRUCTION =====

    buildPrompt(contact, incomingEmail, conversationHistory, userProfile) {
        // Use world context for consistent information
        const snakesiaTime = this.getSnakesiaTime();
        const approvedSitesList = this.getApprovedSitesList();
        
        // Get character info from world context
        const character = this.getCharacterFromWorldContext(contact.id);
        
        // Build conversation history (condensed)
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
        
        // Fallback character info
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
        // Remove extra whitespace and truncate if too long
        const cleaned = body.replace(/\s+/g, ' ').trim();
        return cleaned.length > 200 ? cleaned.substring(0, 200) + '...' : cleaned;
    }

    // ===== RESPONSE PROCESSING =====

    processResponse(rawResponse) {
        // Clean up the response
        let processed = rawResponse.trim();
        
        // Hard limit: Keep emails reasonable length (about 800 characters max)
        if (processed.length > 800) {
            // Try to cut at a natural break point (sentence end)
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
                // Fallback: hard cut with ellipsis
                processed = processed.substring(0, 750).trim() + '...';
            }
        }
        
        // Validate any links mentioned
        processed = this.validateLinks(processed);
        
        return processed;
    }

    validateLinks(text) {
        // Simple regex to find potential website mentions
        const urlPattern = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.ex)\b/g;
        
        return text.replace(urlPattern, (match, domain) => {
            // Check approved sites from world context
            const approvedSites = this.worldContext?.approvedWebsites || [];
            const approved = approvedSites.find(site => site.url === domain);
            if (approved) {
                return match; // Keep approved links
            } else {
                return `[${domain}]`; // Replace unapproved with brackets
            }
        });
    }

    getFallbackResponse(contact) {
        // Use the character responses already loaded by the email system
        const responses = this.emailSystem.characterResponses[contact.id];
        if (responses && responses.length > 0) {
            const templateResponse = responses[Math.floor(Math.random() * responses.length)];
            console.log('📝 Using template response from character-responses.json');
            return templateResponse;
        }

        // Final fallback to default response from the loaded data
        console.log('📝 Using default fallback response from character-responses.json');
        return this.emailSystem.defaultResponse
            .replace('{contactName}', contact.name)
            .replace('{contactTitle}', contact.title || '');
    }

    // ===== UTILITY METHODS =====

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

    // ===== MEMORY MANAGEMENT =====

    async cleanupOldEmails() {
        // This would be called periodically to manage memory
        // For now, we just log - implementation depends on requirements
        console.log('🧹 Email cleanup check - not implemented yet');
        
        // Potential logic:
        // - Remove very old emails from prompt history
        // - Keep them in storage but mark as "archived"
        // - Clean up spam emails older than X days
    }

    // ===== PUBLIC API =====

    isAvailable() {
        return this.apiKey !== null;
    }

    updateSettings(apiKey, model) {
        this.apiKey = apiKey;
        this.selectedModel = model;
        console.log('🔧 LLM settings updated');
    }

    getStatus() {
        const approvedSitesCount = this.worldContext?.approvedWebsites?.length || 0;
        
        return {
            available: this.isAvailable(),
            model: this.selectedModel,
            approvedSites: approvedSitesCount,
            worldContextLoaded: !!this.worldContext
        };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmailLLMService;
}