// =================================
// EMAIL LLM SERVICE - AI Character Responses for ElxaMail
// Handles LLM integration with story progression and memory management
// Uses window.elxaLLM for all API calls (no duplicate fetch code)
// Uses elxaOS.contextBuilder for shared world/user/site context (Phase 7)
// =================================

window.EmailLLMService = class EmailLLMService {
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
        // Delegate to context builder if available
        if (typeof elxaOS !== 'undefined' && elxaOS.contextBuilder) {
            var profile = elxaOS.contextBuilder._getUserProfile();
            if (profile && profile.username !== 'User') return profile;
        }

        // Fallback: Try registry profile + messenger program settings (per-user, no localStorage)
        try {
            if (typeof elxaOS !== 'undefined') {
                if (elxaOS.programs && elxaOS.programs.messenger && elxaOS.programs.messenger.settings) {
                    var settings = elxaOS.programs.messenger.settings;
                    if (settings.username) {
                        return {
                            username: settings.username,
                            about: settings.about || 'a nice person'
                        };
                    }
                }

                if (elxaOS.registry && elxaOS.registry._profileCache) {
                    var profile2 = elxaOS.registry._profileCache;
                    if (profile2.displayName) {
                        return {
                            username: profile2.displayName,
                            about: 'a nice person'
                        };
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ Failed to load user profile from registry:', error);
        }

        // Fall back to localStorage (legacy)
        try {
            var messengerSettings = localStorage.getItem('snakesia-messenger-settings');
            if (messengerSettings) {
                var parsed = JSON.parse(messengerSettings);
                return {
                    username: parsed.username || 'User',
                    about: parsed.about || 'a nice person'
                };
            }
        } catch (error) {
            console.error('❌ Failed to load user profile from localStorage:', error);
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

            var conversationHistory = this.conversationManager ?
                this.conversationManager.getConversationHistory(contact.id, true) : [];

            var userProfile = this.getUserProfile();
            var prompt = this.buildPrompt(contact, incomingEmail, conversationHistory, userProfile);

            console.log(`📝 Prompt length: ${prompt.length} characters`);

            var response = await window.elxaLLM.generateContent(prompt, {
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
        var snakesiaTime = window.elxaLLM ? window.elxaLLM.getSnakesiaTime() : 'Unknown';

        var character = this.getCharacterFromWorldContext(contact.id);

        // --- Context Builder integration (Phase 7) ---
        var worldBlock = '';
        var userBlock = '';
        var approvedSitesBlock = '';

        if (typeof elxaOS !== 'undefined' && elxaOS.contextBuilder && elxaOS.contextBuilder.ready) {
            worldBlock = elxaOS.contextBuilder.getWorldContext();
            userBlock = elxaOS.contextBuilder.getUserContext();
            approvedSitesBlock = elxaOS.contextBuilder.getApprovedSites();
        } else {
            // Fallback to legacy inline context
            worldBlock = 'WORLD CONTEXT — SNAKESIA:\nYou live in ' + (this.worldContext && this.worldContext.world ? this.worldContext.world.name : 'Snakesia') + ', ' + (this.worldContext && this.worldContext.world ? this.worldContext.world.location : 'west of Tennessee') + ' (timezone: exactly 2 hours 1 minute ahead of user\'s time).\nCurrency: ' + (this.worldContext && this.worldContext.world && this.worldContext.world.currency ? this.worldContext.world.currency.name + ' (' + this.worldContext.world.currency.exchangeRate + ')' : 'snakes (1 USD = 2 snakes)');
            userBlock = 'USER INFORMATION:\nYou\'re corresponding with ' + userProfile.username + ', who is ' + userProfile.about;
            approvedSitesBlock = this.getApprovedSitesList();
            if (approvedSitesBlock) {
                approvedSitesBlock = 'APPROVED WEBSITES (only mention these if relevant):\n' + approvedSitesBlock;
            }
        }

        // --- Character details (stays in email service — deep self-knowledge) ---
        var charName = character.fullName || character.name;
        var charDetails = character.description || character.details || '';
        var charPersonality = character.personality || '';
        var charRole = character.role || '';
        var charAge = character.age || '';
        var charInterests = character.interests ? character.interests.join(', ') : '';
        var charRelationships = '';
        if (character.relationships) {
            var relEntries = Object.keys(character.relationships);
            var relParts = [];
            for (var i = 0; i < relEntries.length; i++) {
                relParts.push(relEntries[i] + ' (' + character.relationships[relEntries[i]] + ')');
            }
            charRelationships = relParts.join(', ');
        }

        // --- Conversation history ---
        var conversationContext = '';
        if (conversationHistory && conversationHistory.length > 0) {
            conversationContext = '\n\nCONVERSATION HISTORY:\n';
            for (var h = 0; h < conversationHistory.length; h++) {
                var msg = conversationHistory[h];
                if (msg.type === 'summary') {
                    conversationContext += 'SUMMARY: ' + msg.content + '\n';
                } else {
                    var isFromUser = msg.sender === 'user';
                    var sender = isFromUser ? userProfile.username : charName;
                    var platform = msg.platform ? '[' + msg.platform + ']' : '';
                    var subject = msg.subject ? '"' + msg.subject + '"' : '';
                    conversationContext += (h + 1) + '. ' + sender + ' ' + platform + ' ' + subject + ': "' + this.condenseEmailBody(msg.content) + '"\n';
                }
            }
        }

        // --- Assemble prompt ---
        var basePrompt = 'You are ' + charName + ' from Snakesia. ' + charDetails + ' ' + charPersonality + '\n\n';

        basePrompt += 'CHARACTER BACKGROUND:\n';
        if (charRole) basePrompt += '- Role/Job: ' + charRole + '\n';
        if (charAge) basePrompt += '- Age: ' + charAge + '\n';
        if (charInterests) basePrompt += '- Interests: ' + charInterests + '\n';
        if (charRelationships) basePrompt += '- Relationships: ' + charRelationships + '\n';

        basePrompt += '\n' + worldBlock + '\n';
        basePrompt += '\nCurrent Snakesia time: ' + snakesiaTime + '\n';
        basePrompt += '\n' + userBlock + '\n';

        basePrompt += '\nEMAIL CONTEXT:\n';
        basePrompt += '- This is EMAIL correspondence, not chat - use proper email format\n';
        basePrompt += '- Write professionally but stay in character\n';

        basePrompt += '\nRESPONSE REQUIREMENTS:\n';
        basePrompt += '- KEEP IT SHORT: 2-4 sentences maximum for typical responses\n';
        basePrompt += '- BE PROACTIVE: Don\'t just respond, advance the narrative\n';
        basePrompt += '- Share brief news, events, or developments from your perspective\n';
        basePrompt += '- Reference ongoing activities, projects, or interests when relevant\n';
        basePrompt += '- Create opportunities for future interaction\n';
        basePrompt += '- Use your unique voice while moving the story forward\n';
        basePrompt += '- Make each email feel like a natural part of an ongoing relationship\n';
        basePrompt += '- IMPORTANT: Respond ONLY with the email body text and signature. Do NOT prefix with your name, a colon, or any label.\n';

        basePrompt += conversationContext + '\n';

        basePrompt += '\nCURRENT EMAIL FROM ' + userProfile.username + ':\n';
        basePrompt += 'Subject: "' + incomingEmail.subject + '"\n';
        basePrompt += 'Message: "' + incomingEmail.body + '"\n';

        if (approvedSitesBlock) {
            basePrompt += '\n' + approvedSitesBlock + '\n';
        }

        basePrompt += '\nWrite a SHORT email response as ' + charName + '. Include a brief signature. Be proactive but concise:';

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

        return this.worldContext.approvedWebsites.map(function(site) {
            return '- ' + site.url + ': ' + site.description;
        }).join('\n');
    }

    condenseEmailBody(body) {
        var cleaned = body.replace(/\s+/g, ' ').trim();
        return cleaned.length > 200 ? cleaned.substring(0, 200) + '...' : cleaned;
    }

    // ===== RESPONSE PROCESSING =====

    processResponse(rawResponse) {
        var processed = rawResponse.trim();

        // Hard limit: Keep emails reasonable length
        if (processed.length > 800) {
            var sentences = processed.match(/[^\.!?]*[\.!?]+/g) || [];
            var truncated = '';
            for (var i = 0; i < sentences.length; i++) {
                if ((truncated + sentences[i]).length <= 750) {
                    truncated += sentences[i];
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
        var approvedSites = this.worldContext ? this.worldContext.approvedWebsites || [] : [];

        return text.replace(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.(?:ex|garden|hid))\b/g, function(match, domain) {
            var approved = approvedSites.find(function(site) { return site.url === domain; });
            if (approved) {
                return match;
            } else {
                return '[' + domain + ']';
            }
        });
    }

    getFallbackResponse(contact) {
        var responses = this.emailSystem.characterResponses[contact.id];
        if (responses && responses.length > 0) {
            var templateResponse = responses[Math.floor(Math.random() * responses.length)];
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
        var approvedSitesCount = this.worldContext && this.worldContext.approvedWebsites ? this.worldContext.approvedWebsites.length : 0;

        return {
            available: this.isAvailable(),
            model: window.elxaLLM ? window.elxaLLM.getModel() : 'none',
            approvedSites: approvedSitesCount,
            worldContextLoaded: !!this.worldContext,
            contextBuilderReady: typeof elxaOS !== 'undefined' && elxaOS.contextBuilder ? elxaOS.contextBuilder.ready : false
        };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.EmailLLMService;
}