// =================================
// BOND SERVICE — Relationship Tracking for ElxaOS
// =================================
// Tracks bond (relationship level) between the user and each
// Messenger character. Bond grows through chatting and gift-giving.
// Characters can make requests; fulfilling them earns bonus bond.
//
// STORAGE: Registry user state under `bond`
// EVENTS:  bond.giftSent, bond.tierChanged, bond.requestMade, bond.requestFulfilled
//
// USAGE:
//   elxaOS.bondService.recordMessage('remi');
//   elxaOS.bondService.getBondTier('remi');
//   const pts = elxaOS.bondService.calculateGiftPoints('remi', item, false);
//   elxaOS.bondService.recordGift('remi', item, pts, false);
// =================================

// Bond tiers — range is [min, max] inclusive
const BOND_TIERS = [
    { min: 0,  max: 9,   name: 'Stranger',       description: 'You barely know each other — polite but distant' },
    { min: 10, max: 24,  name: 'Acquaintance',    description: "You've chatted a bit — friendly but still getting to know each other" },
    { min: 25, max: 49,  name: 'Casual Friend',   description: "You're on good terms — comfortable and easygoing together" },
    { min: 50, max: 74,  name: 'Close Friend',    description: "You're genuinely close — they trust you and share openly" },
    { min: 75, max: 89,  name: 'Best Buddy',      description: "You're one of their favorite people — loyal and always excited to talk" },
    { min: 90, max: 100, name: 'Ride or Die',     description: "Unbreakable bond — they'd do anything for you" }
];

// Bond increment per message
const BOND_PER_MESSAGE = 0.1;

// Request scheduling
const REQUEST_MIN_INTERVAL = 15;   // minimum messages between requests
const REQUEST_RANDOM_RANGE = 6;    // random(0-5) added to min
const REQUEST_EXPIRY_MESSAGES = 30; // request expires after this many messages

// Characters that should NOT get bond tracking (automated/system contacts)
const NON_BONDABLE_CHARACTERS = ['elxacorp_hr', 'elxacorp_it', 'elxacorp_news'];

class BondService {
    constructor(eventBus, registry) {
        this.eventBus = eventBus;
        this.registry = registry;

        // In-memory cache of bond data
        this._data = null;
        this._ready = false;

        // World context character preferences (loaded on init)
        this._preferences = {};

        this._setupEventListeners();

        console.log('💛 BondService initialized');
    }

    // =================================
    // LIFECYCLE
    // =================================

    _setupEventListeners() {
        this.eventBus.on('registry.userLoaded', async () => {
            await this._loadBondData();
        });

        this.eventBus.on('login.logout', () => {
            this._data = null;
            this._ready = false;
        });

        // Tier change → notification + toast
        this.eventBus.on('bond.tierChanged', (data) => {
            this._onTierChanged(data);
        });
    }

    _onTierChanged(data) {
        // Get character display name from world context
        var charName = data.characterId;
        try {
            var wc = window.conversationHistoryManager && window.conversationHistoryManager.worldContext;
            if (wc && wc.keyCharacters && wc.keyCharacters[data.characterId]) {
                charName = wc.keyCharacters[data.characterId].fullName || charName;
            }
        } catch (e) { /* use ID as fallback */ }

        var heartMap = {
            'Stranger': '🤍', 'Acquaintance': '🤍', 'Casual Friend': '💛',
            'Close Friend': '🧡', 'Best Buddy': '❤️', 'Ride or Die': '💜'
        };
        var heart = heartMap[data.newTier] || '💛';

        // Notification center + toast
        if (typeof elxaOS !== 'undefined' && elxaOS.notificationService) {
            elxaOS.notificationService.addNotification({
                title: heart + ' Bond Level Up!',
                body: 'Your bond with ' + charName + ' grew to ' + data.newTier + '!',
                icon: 'mdi-heart',
                category: 'social',
                urgency: 'info',
                toast: true,
                action: { type: 'launch', program: 'messenger' }
            });
        }

        console.log('💛 Tier changed:', charName, data.oldTier, '→', data.newTier);
    }

    async init() {
        // Load character gift preferences from world context
        this._loadPreferences();

        if (this.registry.isLoggedIn()) {
            await this._loadBondData();
        }
        console.log('💛 BondService ready');
    }

    _loadPreferences() {
        try {
            var characters = elxaOS.registry.getCharacters();
            if (characters) {
                for (var id in characters) {
                    if (characters[id].giftPreferences) {
                        this._preferences[id] = characters[id].giftPreferences;
                    }
                }
            }
            console.log('💛 Loaded gift preferences for', Object.keys(this._preferences).length, 'characters');
        } catch (e) {
            console.warn('💛 Could not load gift preferences:', e);
        }
    }

    async _loadBondData() {
        try {
            var stored = await this.registry.getUserState('bond');
            if (stored) {
                this._data = stored;
            } else {
                this._data = { characters: {} };
            }
            this._ready = true;
            console.log('💛 Bond data loaded');
        } catch (e) {
            console.warn('💛 Failed to load bond data, using defaults:', e);
            this._data = { characters: {} };
            this._ready = true;
        }
    }

    async _save() {
        if (!this._data) return;
        try {
            await this.registry.setUserState('bond', this._data);
        } catch (e) {
            console.warn('💛 Failed to save bond data:', e);
        }
    }

    _ensureReady() {
        if (!this._ready || !this._data) {
            console.warn('💛 BondService not ready');
            return false;
        }
        return true;
    }

    // =================================
    // CHARACTER STATE
    // =================================

    /**
     * Get or create the state object for a character.
     */
    _getCharState(characterId) {
        if (!this._data.characters[characterId]) {
            this._data.characters[characterId] = {
                bond: 0,
                messageCount: 0,
                giftHistory: [],
                totalGiftsGiven: 0,
                totalPointsEarned: 0,
                activeRequest: null,
                lastRequestAtMessage: 0
            };
        }
        return this._data.characters[characterId];
    }

    /**
     * Check if a character can have bond tracking.
     */
    isBondable(characterId) {
        return !NON_BONDABLE_CHARACTERS.includes(characterId);
    }

    // =================================
    // BOND TRACKING
    // =================================

    /**
     * Increment bond for a character, clamped at 100.
     */
    incrementBond(characterId, amount) {
        if (!this._ensureReady() || !this.isBondable(characterId)) return;
        var state = this._getCharState(characterId);
        var oldBond = Math.round(state.bond);
        state.bond = Math.min(100, state.bond + amount);
        var newBond = Math.round(state.bond);

        // Check for tier change
        if (oldBond !== newBond) {
            var oldTier = this._getTierForValue(oldBond);
            var newTier = this._getTierForValue(newBond);
            if (oldTier.name !== newTier.name) {
                this.eventBus.emit('bond.tierChanged', {
                    characterId, oldTier: oldTier.name, newTier: newTier.name, bond: newBond
                });
            }
        }
        this._save();
    }

    /**
     * Get raw bond value for a character.
     */
    getBond(characterId) {
        if (!this._ensureReady()) return 0;
        var state = this._getCharState(characterId);
        return state.bond;
    }

    /**
     * Get rounded bond value (for display / LLM).
     */
    getBondRounded(characterId) {
        return Math.round(this.getBond(characterId));
    }

    /**
     * Sync getter for context builder / interwebs.
     */
    getBondSync(characterId) {
        if (!this._ready || !this._data) return 0;
        var state = this._data.characters[characterId];
        return state ? Math.round(state.bond) : 0;
    }

    /**
     * Get bond tier for a character.
     * @returns {{ name: string, description: string }}
     */
    getBondTier(characterId) {
        var rounded = this.getBondRounded(characterId);
        return this._getTierForValue(rounded);
    }

    /**
     * Internal tier lookup by numeric value.
     */
    _getTierForValue(value) {
        for (var tier of BOND_TIERS) {
            if (value >= tier.min && value <= tier.max) {
                return { name: tier.name, description: tier.description };
            }
        }
        return BOND_TIERS[0]; // fallback to Stranger
    }

    /**
     * Get full state for a character (for debug / display).
     */
    getCharacterState(characterId) {
        if (!this._ensureReady()) return null;
        return this._getCharState(characterId);
    }

    /**
     * Get bond summary for all characters (for context builder).
     * @returns {Array<{ characterId, bond, tierName }>}
     */
    getAllBondSummaries() {
        if (!this._ensureReady()) return [];
        var summaries = [];
        for (var id in this._data.characters) {
            var state = this._data.characters[id];
            var tier = this._getTierForValue(Math.round(state.bond));
            summaries.push({
                characterId: id,
                bond: Math.round(state.bond),
                tierName: tier.name
            });
        }
        return summaries;
    }

    // =================================
    // MESSAGE TRACKING
    // =================================

    /**
     * Record that the user sent a message to a character.
     * Increments messageCount and adds BOND_PER_MESSAGE to bond.
     */
    recordMessage(characterId) {
        if (!this._ensureReady() || !this.isBondable(characterId)) return;
        var state = this._getCharState(characterId);
        state.messageCount++;
        this.incrementBond(characterId, BOND_PER_MESSAGE);
    }

    // =================================
    // GIFT SCORING (Phase 1B)
    // =================================

    /**
     * Calculate gift points for giving an item to a character.
     * @param {string} characterId
     * @param {object} item — inventory item { name, subcategory, unitPrice, ... }
     * @param {boolean} wasRequest — did this fulfill an active request?
     * @returns {object} { points, matchType, breakdown }
     */
    calculateGiftPoints(characterId, item, wasRequest) {
        var prefs = this._preferences[characterId];
        var points = 0;
        var matchType = 'none';
        var breakdown = [];

        if (prefs) {
            // Check dislikes first
            var isDisliked = this._matchesPreference(prefs.dislikes, item);
            if (isDisliked) {
                matchType = 'disliked';
                breakdown.push('Item is disliked (0 pts)');
                return { points: 0, matchType, breakdown };
            }

            // Check request fulfillment (highest base score)
            if (wasRequest) {
                points = 5;
                matchType = 'request';
                breakdown.push('Fulfilled request (+5)');
            } else {
                // Check keyword match (unprompted like)
                var keywordMatch = this._matchesPreference(prefs.likes, item);
                if (keywordMatch === 'keyword') {
                    points = 2;
                    matchType = 'liked';
                    breakdown.push('Matches a liked keyword (+2)');
                } else if (keywordMatch === 'category') {
                    points = 1;
                    matchType = 'category';
                    breakdown.push('Matches a liked category (+1)');
                }
            }

            // Favorite color bonus (check item name for color)
            if (prefs.favoriteColor && points > 0) {
                var nameLower = (item.name || '').toLowerCase();
                if (nameLower.includes(prefs.favoriteColor.toLowerCase())) {
                    points += 1;
                    breakdown.push('Favorite color bonus (+1)');
                }
            }
        }

        // Price bonus (based on unitPrice in USD)
        var price = item.unitPrice || 0;
        if (price > 500) {
            points += 3;
            breakdown.push('Expensive gift bonus (+3)');
        } else if (price > 250) {
            points += 2;
            breakdown.push('Pricey gift bonus (+2)');
        } else if (price > 100) {
            points += 1;
            breakdown.push('Nice gift bonus (+1)');
        }

        // Cap at 8
        points = Math.min(8, points);

        return { points, matchType, breakdown };
    }

    /**
     * Check if an item matches any preference in a likes/dislikes array.
     * @returns {'keyword'|'category'|false} — 'keyword' if name matches,
     *   'category' if subcategory matches, false if no match
     */
    _matchesPreference(prefList, item) {
        if (!prefList || !prefList.length) return false;
        var nameLower = (item.name || '').toLowerCase();
        var subcatLower = (item.subcategory || '').toLowerCase();

        for (var pref of prefList) {
            var kwLower = (pref.keyword || '').toLowerCase();
            // Keyword match: item name contains the preference keyword
            if (kwLower && nameLower.includes(kwLower)) {
                return 'keyword';
            }
        }

        // Category match: item subcategory matches a preference category
        for (var pref of prefList) {
            var catLower = (pref.category || '').toLowerCase();
            if (catLower && subcatLower.includes(catLower)) {
                return 'category';
            }
        }

        return false;
    }

    /**
     * Record a gift given to a character.
     * Updates bond, gift history, emits events.
     */
    recordGift(characterId, item, points, wasRequest) {
        if (!this._ensureReady() || !this.isBondable(characterId)) return;
        var state = this._getCharState(characterId);

        // Add to gift history
        state.giftHistory.push({
            itemName: item.name,
            date: new Date().toISOString().split('T')[0],
            points: points,
            wasRequest: wasRequest
        });
        state.totalGiftsGiven++;
        state.totalPointsEarned += points;

        // Increment bond by points earned
        if (points > 0) {
            this.incrementBond(characterId, points);
        }

        // Emit gift event
        var tier = this.getBondTier(characterId);
        this.eventBus.emit('bond.giftSent', {
            characterId,
            itemName: item.name,
            points,
            matchType: wasRequest ? 'request' : 'gift',
            wasRequest,
            newBond: this.getBondRounded(characterId)
        });

        // If this fulfilled a request, emit and clear it
        if (wasRequest && state.activeRequest) {
            this.eventBus.emit('bond.requestFulfilled', {
                characterId,
                keyword: state.activeRequest.keyword,
                itemName: item.name,
                points
            });
            state.activeRequest = null;
        }

        this._save();
    }

    // =================================
    // REQUEST SYSTEM (Phase 1C)
    // =================================

    /**
     * Check if it's time to trigger a new request for this character.
     */
    shouldTriggerRequest(characterId) {
        if (!this._ensureReady() || !this.isBondable(characterId)) return false;
        var state = this._getCharState(characterId);

        // Don't trigger if there's already an active request
        if (state.activeRequest) return false;

        // Need enough messages since last request
        var messagesSinceRequest = state.messageCount - state.lastRequestAtMessage;
        var threshold = REQUEST_MIN_INTERVAL + Math.floor(Math.random() * REQUEST_RANDOM_RANGE);
        return messagesSinceRequest >= threshold;
    }

    /**
     * Check if an active request has expired.
     */
    checkRequestExpiry(characterId) {
        if (!this._ensureReady()) return;
        var state = this._getCharState(characterId);
        if (!state.activeRequest) return;

        var messagesSince = state.messageCount - state.activeRequest.messageIndex;
        if (messagesSince >= REQUEST_EXPIRY_MESSAGES) {
            console.log('💛 Request expired for', characterId);
            state.activeRequest = null;
            this._save();
        }
    }

    /**
     * Generate the LLM prompt snippet to trigger a request.
     * Returns null if character has no preferences.
     */
    generateRequestPrompt(characterId) {
        var prefs = this._preferences[characterId];
        if (!prefs || !prefs.likes || !prefs.likes.length) return null;

        var likesList = prefs.likes.map(function(l) { return l.keyword; }).join(', ');
        var color = prefs.favoriteColor || 'none';

        return `SPECIAL INSTRUCTION FOR THIS MESSAGE ONLY:
You want to casually ask the user for something you'd enjoy.
Your preferences: ${likesList}
Your favorite color: ${color}

Make a natural, in-character request. Wrap the item keyword in square brackets like [energy drink] or [shorts].
Keep it casual — don't beg, just mention you'd like something.
Examples: "man im thirsty, i could really go for an [energy drink] rn"
Only use ONE set of brackets for the main item.`;
    }

    /**
     * Store an active request parsed from LLM response.
     */
    setActiveRequest(characterId, keyword, category, messageText) {
        if (!this._ensureReady()) return;
        var state = this._getCharState(characterId);

        state.activeRequest = {
            keyword: keyword,
            category: category || null,
            messageText: messageText,
            createdAt: new Date().toISOString(),
            messageIndex: state.messageCount
        };
        state.lastRequestAtMessage = state.messageCount;

        this.eventBus.emit('bond.requestMade', {
            characterId, keyword, category
        });

        this._save();
        console.log('💛 Request stored for', characterId, ':', keyword);
    }

    /**
     * Get the active request for a character (or null).
     */
    getActiveRequest(characterId) {
        if (!this._ensureReady()) return null;
        var state = this._data.characters[characterId];
        return state ? state.activeRequest : null;
    }

    /**
     * Clear the active request for a character.
     */
    clearRequest(characterId) {
        if (!this._ensureReady()) return;
        var state = this._data.characters[characterId];
        if (state) {
            state.activeRequest = null;
            this._save();
        }
    }

    /**
     * Check if a given item fulfills the active request.
     * @returns {boolean}
     */
    matchesActiveRequest(characterId, item) {
        var request = this.getActiveRequest(characterId);
        if (!request) return false;

        var nameLower = (item.name || '').toLowerCase();
        var kwLower = (request.keyword || '').toLowerCase();
        return nameLower.includes(kwLower);
    }

    /**
     * Get gift preferences for a character.
     */
    getPreferences(characterId) {
        return this._preferences[characterId] || null;
    }

    // =================================
    // LLM CONTEXT HELPERS
    // =================================

    /**
     * Get bond context string for Messenger LLM prompts.
     */
    getBondContext(characterId, userName) {
        if (!this._ensureReady() || !this.isBondable(characterId)) return '';
        var bond = this.getBondRounded(characterId);
        var tier = this.getBondTier(characterId);
        return `RELATIONSHIP WITH USER:
Your bond with ${userName || 'the user'} is ${bond}/100 (${tier.name}).
${tier.description}
Adjust your warmth, openness, and familiarity accordingly.`;
    }

    /**
     * Get gift reaction prompt for when the user sends a gift.
     */
    getGiftReactionPrompt(characterId, item, scoreResult) {
        var prefs = this._preferences[characterId];
        var likesStr = prefs ? prefs.likes.map(function(l) { return l.keyword; }).join(', ') : 'unknown';
        var dislikesStr = prefs && prefs.dislikes ? prefs.dislikes.map(function(d) { return d.keyword; }).join(', ') : 'nothing specific';
        var colorStr = prefs ? prefs.favoriteColor : 'unknown';

        var reactionHint = '';
        switch (scoreResult.matchType) {
            case 'request':
                reactionHint = 'You specifically asked for this! Be thrilled and grateful!';
                break;
            case 'liked':
                reactionHint = 'Something you love! Show genuine excitement.';
                break;
            case 'category':
                reactionHint = 'Nice — in a category you enjoy, not your top pick. Be pleasantly surprised.';
                break;
            case 'disliked':
                reactionHint = "You don't really like this... try to be polite about it but don't fake enthusiasm.";
                break;
            default:
                reactionHint = "Appreciate the thought. Be polite but don't go overboard.";
        }

        return `The user just gave you a gift: ${item.name}

GIFT REACTION INSTRUCTIONS:
${reactionHint}

Your preferences for reference:
- Favorite color: ${colorStr}
- Things you like: ${likesStr}
- Things you don't like: ${dislikesStr}

React naturally and in character. Don't list your preferences — just respond to the gift.`;
    }

    /**
     * Get light preference context for general Messenger prompts.
     */
    getPreferenceContext(characterId) {
        var prefs = this._preferences[characterId];
        if (!prefs) return '';
        var likes = prefs.likes ? prefs.likes.map(function(l) { return l.keyword; }).join(', ') : '';
        var color = prefs.favoriteColor || '';
        var lines = [];
        if (likes) lines.push('THINGS YOU ENJOY: ' + likes);
        if (color) lines.push('FAVORITE COLOR: ' + color);
        return lines.join('\n');
    }

    // =================================
    // DEBUG TOOLS
    // =================================

    get debug() {
        var self = this;
        return {
            status() {
                if (!self._ready) {
                    console.log('💛 BondService not ready');
                    return;
                }
                console.log('💛 Bond Status:');
                for (var id in self._data.characters) {
                    var s = self._data.characters[id];
                    var tier = self._getTierForValue(Math.round(s.bond));
                    console.log(`  ${id}: ${Math.round(s.bond)}/100 (${tier.name}) | msgs: ${s.messageCount} | gifts: ${s.totalGiftsGiven} | pts: ${s.totalPointsEarned}`);
                    if (s.activeRequest) {
                        console.log(`    Active request: [${s.activeRequest.keyword}]`);
                    }
                }
            },

            setBond(characterId, value) {
                if (!self._ensureReady()) return;
                var state = self._getCharState(characterId);
                state.bond = Math.max(0, Math.min(100, value));
                self._save();
                var tier = self._getTierForValue(Math.round(state.bond));
                console.log(`💛 Set ${characterId} bond to ${Math.round(state.bond)} (${tier.name})`);
            },

            gift(characterId, itemName) {
                var fakeItem = { name: itemName || 'Test Gift', subcategory: 'test', unitPrice: 5 };
                var score = self.calculateGiftPoints(characterId, fakeItem, false);
                console.log('💛 Gift score:', score);
                return score;
            },

            request(characterId) {
                var prompt = self.generateRequestPrompt(characterId);
                console.log('💛 Request prompt:\n', prompt);
                return prompt;
            },

            history(characterId) {
                if (!self._ensureReady()) return;
                var state = self._getCharState(characterId);
                if (!state.giftHistory.length) {
                    console.log(`💛 No gift history for ${characterId}`);
                    return;
                }
                console.log(`💛 Gift history for ${characterId}:`);
                state.giftHistory.forEach(function(g) {
                    var tag = g.wasRequest ? ' [REQUEST]' : '';
                    console.log(`  ${g.date}: ${g.itemName} (+${g.points} pts)${tag}`);
                });
            },

            preferences(characterId) {
                var prefs = self._preferences[characterId];
                if (!prefs) {
                    console.log(`💛 No preferences for ${characterId}`);
                    return;
                }
                console.log(`💛 Preferences for ${characterId}:`, prefs);
                return prefs;
            },

            reset() {
                self._data = { characters: {} };
                self._save();
                console.log('💛 Bond data reset');
            }
        };
    }
}
