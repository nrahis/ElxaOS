// =================================
// ELXA REGISTRY — Central Data Hub for ElxaOS
// =================================
// Single source of truth for user profile, world context, and user state.
// Programs query the registry instead of fishing through scattered localStorage keys.
//
// STORAGE STRATEGY:
//   Per-user data  →  IndexedDB via ElxaDB  (keyed by username)
//   Shared data    →  Loaded from world-context.json, cached in memory
//
// USAGE:
//   const profile = await elxaOS.registry.getUserProfile();
//   const remi    = elxaOS.registry.getCharacter('remi');
//   const inv     = await elxaOS.registry.getState('inventory');
//   await elxaOS.registry.setState('ownedProperties', [{ id: 3, ... }]);
// =================================

class ElxaRegistry {
    constructor(eventBus) {
        this.eventBus = eventBus;

        // Current session
        this._currentUsername = null;
        this._profileCache = null;   // in-memory copy of active user's profile
        this._stateCache = null;     // in-memory copy of active user's state

        // World context (shared, loaded once)
        this._worldContext = null;
        this._worldReady = null;     // promise that resolves when world data is loaded

        // Dirty flags for batched saves
        this._profileDirty = false;
        this._stateDirty = false;
        this._saveTimer = null;

        this._setupEventListeners();

        console.log('📋 ElxaRegistry initialized');
    }

    // =================================
    // INITIALIZATION
    // =================================

    /**
     * Boot the registry. Call once during ElxaOS.asyncInit(), after ElxaDB is open.
     * Loads world context and, if a user is already logged in, their data.
     */
    async init() {
        // Start loading world context immediately
        this._worldReady = this._loadWorldContext();
        await this._worldReady;

        console.log('📋 ElxaRegistry ready');
    }

    // =================================
    // EVENT WIRING
    // =================================

    _setupEventListeners() {
        // When a user logs in, load their profile + state from IndexedDB
        this.eventBus.on('login.success', async (data) => {
            await this._onLogin(data.user);
        });

        this.eventBus.on('login.guest', async () => {
            await this._onLogin('guest');
        });

        // When user logs out, flush and clear
        this.eventBus.on('login.logout', () => {
            this._onLogout();
        });

        // When user settings change in the login service, sync to registry
        this.eventBus.on('login.settingsChanged', async (data) => {
            if (data.displayName !== undefined) {
                await this.updateUserProfile({ displayName: data.displayName });
            }
            if (data.avatar !== undefined) {
                await this.updateUserProfile({ avatar: data.avatar });
            }
        });
    }

    async _onLogin(username) {
        console.log(`📋 Registry: loading data for user "${username}"`);
        this._currentUsername = username;
        await this._loadUserProfile();
        await this._loadUserState();
        this.eventBus.emit('registry.userLoaded', {
            username: this._currentUsername,
            profile: { ...this._profileCache }
        });
    }

    _onLogout() {
        // Flush any pending saves before clearing
        this._flushSaves();
        console.log(`📋 Registry: user "${this._currentUsername}" logged out`);
        this._currentUsername = null;
        this._profileCache = null;
        this._stateCache = null;
    }

    // =================================
    // USER PROFILE  (per-user, IndexedDB)
    // =================================
    // Canonical fields:
    //   displayName, avatar, about, preferences
    // Extensible — any key can be added.

    /**
     * Get the full profile object for the current user.
     * Returns a copy so callers can't accidentally mutate the cache.
     */
    async getUserProfile() {
        if (!this._profileCache) await this._loadUserProfile();
        return this._profileCache ? { ...this._profileCache } : null;
    }

    /**
     * Get a single profile field.
     */
    async getUserField(field) {
        if (!this._profileCache) await this._loadUserProfile();
        return this._profileCache ? this._profileCache[field] : undefined;
    }

    /**
     * Update one or more profile fields. Merges into existing profile.
     * @param {object} updates — e.g. { about: 'I love snakes', displayName: 'KitKat' }
     */
    async updateUserProfile(updates) {
        if (!this._currentUsername) {
            console.warn('📋 Registry: cannot update profile — no user logged in');
            return;
        }
        if (!this._profileCache) await this._loadUserProfile();

        Object.assign(this._profileCache, updates);
        this._profileDirty = true;
        this._scheduleSave();

        this.eventBus.emit('registry.profileUpdated', {
            username: this._currentUsername,
            updates: { ...updates }
        });
    }

    // --- internal ---

    _userProfileKey() {
        return `user:${this._currentUsername}:profile`;
    }

    async _loadUserProfile() {
        if (!this._currentUsername) { this._profileCache = null; return; }

        try {
            const saved = await elxaDB.get(this._userProfileKey());
            if (saved) {
                this._profileCache = saved;
                console.log(`📋 Profile loaded for "${this._currentUsername}"`);
            } else {
                // First time — seed from whatever the login service knows
                this._profileCache = this._seedProfileFromLogin();
                this._profileDirty = true;
                this._scheduleSave();
                console.log(`📋 Seeded new profile for "${this._currentUsername}"`);
            }
        } catch (err) {
            console.error('❌ Registry: failed to load profile', err);
            this._profileCache = this._seedProfileFromLogin();
        }
    }

    /**
     * Pull initial profile data from existing systems so the first load
     * isn't empty. This is a one-time migration bridge.
     */
    _seedProfileFromLogin() {
        const profile = {
            displayName: this._currentUsername,
            avatar: '👤',
            about: '',
            preferences: {}
        };

        // Try to grab data from the login service
        try {
            if (typeof elxaOS !== 'undefined' && elxaOS.loginService) {
                const user = elxaOS.loginService.getCurrentUser();
                if (user) {
                    profile.displayName = user.displayName || profile.displayName;
                    profile.avatar = user.avatar || profile.avatar;
                }
            }
        } catch (e) { /* ignore */ }

        // Try to grab "about" from messenger settings (legacy location)
        try {
            const messengerSettings = localStorage.getItem('snakesia-messenger-settings');
            if (messengerSettings) {
                const ms = JSON.parse(messengerSettings);
                if (ms.about) profile.about = ms.about;
                if (ms.username && !profile.displayName) profile.displayName = ms.username;
            }
        } catch (e) { /* ignore */ }

        return profile;
    }

    async _saveUserProfile() {
        if (!this._currentUsername || !this._profileCache) return;
        try {
            await elxaDB.put(this._userProfileKey(), this._profileCache);
            this._profileDirty = false;
        } catch (err) {
            console.error('❌ Registry: failed to save profile', err);
        }
    }

    // =================================
    // WORLD CONTEXT  (shared, from JSON)
    // =================================
    // Synchronous getters — data is loaded once at init.
    // If you need to wait for it, await registry.worldReady()

    /**
     * Wait for world context to finish loading.
     */
    async worldReady() {
        if (this._worldReady) await this._worldReady;
    }

    /**
     * Get top-level world info (name, currency, government, culture, etc.)
     */
    getWorld() {
        return this._worldContext?.world || null;
    }

    /**
     * Get a single character by ID (e.g. 'remi', 'mr_snake_e', 'pushing_cat')
     */
    getCharacter(characterId) {
        return this._worldContext?.keyCharacters?.[characterId] || null;
    }

    /**
     * Get all characters as an object keyed by ID.
     */
    getCharacters() {
        return this._worldContext?.keyCharacters || {};
    }

    /**
     * Get just the character IDs.
     */
    getCharacterIds() {
        return Object.keys(this._worldContext?.keyCharacters || {});
    }

    /**
     * Get technology info.
     */
    getTechnology() {
        return this._worldContext?.technology || null;
    }

    /**
     * Get prompt guidelines (used by LLM services).
     */
    getPromptGuidelines() {
        return this._worldContext?.promptGuidelines || null;
    }

    /**
     * Get the full raw world context object.
     */
    getFullWorldContext() {
        return this._worldContext ? { ...this._worldContext } : null;
    }

    // --- internal ---

    async _loadWorldContext() {
        try {
            console.log('🌍 Registry: loading world context...');
            const response = await fetch('./data/world-context.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            this._worldContext = await response.json();
            console.log('🌍 Registry: world context loaded');
        } catch (err) {
            console.error('❌ Registry: failed to load world context', err);
            // Minimal fallback so nothing crashes
            this._worldContext = {
                world: {
                    name: 'Snakesia',
                    currency: { name: 'snakes', symbol: '🐍' }
                },
                keyCharacters: {},
                technology: {},
                promptGuidelines: {}
            };
        }
    }

    // =================================
    // USER STATE  (per-user, IndexedDB)
    // =================================
    // General-purpose key-value store for per-user game/app state.
    // Keys are strings, values can be anything structured-cloneable.
    //
    // Common keys (convention, not enforced):
    //   'inventory'        → array of owned items
    //   'ownedProperties'  → array of property objects (Mallard Realty)
    //   'primaryResidence' → property ID
    //   'bankSummary'      → { checking, savings, trust }
    //   'installedGames'   → array of game IDs
    //   'cardCollection'   → array of card objects
    //   'achievements'     → array of achievement IDs

    /**
     * Get a state value by key.
     */
    async getState(key) {
        if (!this._stateCache) await this._loadUserState();
        return this._stateCache ? this._stateCache[key] : undefined;
    }

    /**
     * Set a state value by key.
     */
    async setState(key, value) {
        if (!this._currentUsername) {
            console.warn('📋 Registry: cannot set state — no user logged in');
            return;
        }
        if (!this._stateCache) await this._loadUserState();

        this._stateCache[key] = value;
        this._stateDirty = true;
        this._scheduleSave();

        this.eventBus.emit('registry.stateUpdated', {
            username: this._currentUsername,
            key,
            value
        });
    }

    /**
     * Remove a state key.
     */
    async removeState(key) {
        if (!this._stateCache) await this._loadUserState();
        if (this._stateCache && key in this._stateCache) {
            delete this._stateCache[key];
            this._stateDirty = true;
            this._scheduleSave();
        }
    }

    /**
     * Get the full state object (copy).
     */
    async getAllState() {
        if (!this._stateCache) await this._loadUserState();
        return this._stateCache ? { ...this._stateCache } : null;
    }

    /**
     * Merge an object into state (shallow merge).
     * Useful for batch updates: await registry.mergeState({ bankSummary: {...}, achievements: [...] })
     */
    async mergeState(updates) {
        if (!this._currentUsername) return;
        if (!this._stateCache) await this._loadUserState();

        Object.assign(this._stateCache, updates);
        this._stateDirty = true;
        this._scheduleSave();

        this.eventBus.emit('registry.stateUpdated', {
            username: this._currentUsername,
            key: '__merge__',
            value: updates
        });
    }

    // --- internal ---

    _userStateKey() {
        return `user:${this._currentUsername}:state`;
    }

    async _loadUserState() {
        if (!this._currentUsername) { this._stateCache = null; return; }

        try {
            const saved = await elxaDB.get(this._userStateKey());
            this._stateCache = saved || {};
            console.log(`📋 State loaded for "${this._currentUsername}" (${Object.keys(this._stateCache).length} keys)`);
        } catch (err) {
            console.error('❌ Registry: failed to load state', err);
            this._stateCache = {};
        }
    }

    async _saveUserState() {
        if (!this._currentUsername || !this._stateCache) return;
        try {
            await elxaDB.put(this._userStateKey(), this._stateCache);
            this._stateDirty = false;
        } catch (err) {
            console.error('❌ Registry: failed to save state', err);
        }
    }

    // =================================
    // CONVENIENCE HELPERS
    // =================================

    /** Get the currently logged-in username. */
    getCurrentUsername() {
        return this._currentUsername;
    }

    /** Is anyone logged in? */
    isLoggedIn() {
        return this._currentUsername !== null;
    }

    /** Is the current user a guest? */
    isGuest() {
        return this._currentUsername === 'guest';
    }

    // =================================
    // SAVE BATCHING
    // =================================
    // Writes are batched with a short debounce so rapid-fire setState()
    // calls don't spam IndexedDB.

    _scheduleSave() {
        if (this._saveTimer) return; // already scheduled
        this._saveTimer = setTimeout(() => {
            this._flushSaves();
        }, 300);
    }

    async _flushSaves() {
        if (this._saveTimer) {
            clearTimeout(this._saveTimer);
            this._saveTimer = null;
        }

        const promises = [];
        if (this._profileDirty) promises.push(this._saveUserProfile());
        if (this._stateDirty) promises.push(this._saveUserState());

        if (promises.length > 0) {
            await Promise.all(promises);
            console.log('📋 Registry: data flushed to IndexedDB');
        }
    }

    // =================================
    // DEBUG / ADMIN
    // =================================

    /**
     * Dump current registry state to console. Useful for debugging.
     */
    debug() {
        console.group('📋 ElxaRegistry Debug');
        console.log('Current user:', this._currentUsername);
        console.log('Profile:', this._profileCache);
        console.log('State:', this._stateCache);
        console.log('World loaded:', !!this._worldContext);
        console.log('Characters:', this.getCharacterIds());
        console.groupEnd();
    }

    /**
     * Force-save everything right now (e.g. before shutdown).
     */
    async forceSave() {
        await this._flushSaves();
    }

    /**
     * Clear all registry data for the current user. Use with caution!
     */
    async clearUserData() {
        if (!this._currentUsername) return;
        await elxaDB.delete(this._userProfileKey());
        await elxaDB.delete(this._userStateKey());
        this._profileCache = {};
        this._stateCache = {};
        console.log(`🗑️ Registry: cleared all data for "${this._currentUsername}"`);
    }
}
