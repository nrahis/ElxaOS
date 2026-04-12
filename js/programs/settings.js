// =================================
// SETTINGS PROGRAM
// =================================
// Centralized settings: User profile, LLM configuration, System tools
class SettingsProgram {
    constructor(windowManager, fileSystem, eventBus) {
        this.windowManager = windowManager;
        this.fileSystem = fileSystem;
        this.eventBus = eventBus;
        this.isOpen = false;
        this.windowId = 'settings';
        this.activeTab = 'user';

        // Listen for window close
        this.eventBus.on('window.closed', (data) => {
            if (data.id === this.windowId) {
                this.isOpen = false;
            }
        });

        // Listen for LLM settings changes from Messenger
        this.eventBus.on('messenger.settingsChanged', () => {
            if (this.isOpen && this.activeTab === 'llm') {
                this._populateLLMTab();
            }
        });
    }

    launch() {
        if (this.isOpen) {
            this.windowManager.focusWindow(this.windowId);
            return;
        }

        const content = this._buildHTML();

        this.windowManager.createWindow(
            this.windowId,
            `${ElxaIcons.renderAction('settings')} Settings`,
            content,
            { width: '420', height: '460' }
        );

        this.isOpen = true;

        // Defer binding so DOM is ready
        requestAnimationFrame(() => {
            this._bindEvents();
            this._populateUserTab();
        });
    }

    // =========================================================
    // HTML
    // =========================================================
    _buildHTML() {
        return `
            <div class="settings-container">
                <div class="settings-tabs">
                    <button class="settings-tab active" data-tab="user">
                        <span class="mdi mdi-account elxa-icon-ui"></span> User
                    </button>
                    <button class="settings-tab" data-tab="llm">
                        <span class="mdi mdi-robot elxa-icon-ui"></span> LLM
                    </button>
                    <button class="settings-tab" data-tab="system">
                        <span class="mdi mdi-wrench elxa-icon-ui"></span> System
                    </button>
                </div>

                <div class="settings-body">
                    <!-- User Tab -->
                    <div class="settings-panel active" id="settingsUserPanel">
                        ${this._buildUserTab()}
                    </div>

                    <!-- LLM Tab -->
                    <div class="settings-panel" id="settingsLLMPanel">
                        ${this._buildLLMTab()}
                    </div>

                    <!-- System Tab -->
                    <div class="settings-panel" id="settingsSystemPanel">
                        ${this._buildSystemTab()}
                    </div>
                </div>
            </div>
        `;
    }

    _buildUserTab() {
        const user = elxaOS.loginService.currentUser;
        if (!user || user.isGuest) {
            return '<div class="settings-notice">Please log in to access user settings.</div>';
        }

        const userData = elxaOS.loginService.users[user.username];

        return `
            <div class="settings-section">
                <div class="settings-form-group">
                    <label class="settings-label">Display Name:</label>
                    <input type="text" id="sysSettingsDisplayName" class="settings-input" value="${userData.displayName}">
                </div>

                <div class="settings-form-group">
                    ${buildAvatarPicker(userData.avatar, 'sysSettingsAvatar')}
                </div>

                <div class="settings-account-info">
                    <div class="settings-account-title">
                        <span class="mdi mdi-information elxa-icon-ui"></span> Account Information
                    </div>
                    <div class="settings-stat">Username: <strong>${userData.username}</strong></div>
                    <div class="settings-stat">Created: <strong>${userData.created ? userData.created.toLocaleDateString() : 'Unknown'}</strong></div>
                    <div class="settings-stat">Total Logins: <strong>${userData.loginCount}</strong></div>
                    <div class="settings-stat">Last Login: <strong>${userData.lastLogin ? userData.lastLogin.toLocaleDateString() : 'Never'}</strong></div>
                </div>

                <div class="settings-actions">
                    <button class="settings-btn settings-btn-primary" id="sysSettingsSaveUser">
                        <span class="mdi mdi-content-save elxa-icon-ui"></span> Save Changes
                    </button>
                    <button class="settings-btn" id="sysSettingsChangePassword">
                        <span class="mdi mdi-key elxa-icon-ui"></span> Change Password
                    </button>
                </div>
            </div>
        `;
    }

    _buildLLMTab() {
        return `
            <div class="settings-section" id="settingsLLMContent">
                <div class="settings-form-group">
                    <label class="settings-label">Gemini API Key:</label>
                    <input type="password" id="sysSettingsApiKey" class="settings-input" placeholder="Enter your API key">
                    <small class="settings-hint">Keep this secret! It's like your password for talking to AI friends.</small>
                </div>

                <div class="settings-form-group">
                    <label class="settings-label">AI Model:</label>
                    <select id="sysSettingsModel" class="settings-select"></select>
                    <small class="settings-hint">Available models refresh when you add your API key.</small>
                </div>

                <div class="settings-form-group">
                    <button class="settings-btn" id="sysSettingsRefreshModels">
                        <span class="mdi mdi-refresh elxa-icon-ui"></span> Refresh Models
                    </button>
                </div>

                <div class="settings-separator"></div>

                <div class="settings-form-group">
                    <label class="settings-label-inline">
                        <input type="checkbox" id="sysSettingsLLMEnabled" class="settings-checkbox">
                        Enable AI Character Responses
                    </label>
                    <small class="settings-hint">Turn on/off AI responses. Characters will use template responses when disabled.</small>
                </div>

                <div class="settings-form-group">
                    <label class="settings-label-inline">
                        <input type="checkbox" id="sysSettingsCrossPlatform" class="settings-checkbox">
                        Cross-Platform Memory (Email + Messenger)
                    </label>
                    <small class="settings-hint">Characters remember conversations across both Messenger and Email.</small>
                </div>

                <div class="settings-form-group">
                    <label class="settings-label">Conversation Memory Length:</label>
                    <select id="sysSettingsHistoryLength" class="settings-select">
                        <option value="15">Short (15 messages)</option>
                        <option value="25">Normal (25 messages)</option>
                        <option value="40">Long (40 messages)</option>
                    </select>
                    <small class="settings-hint">How many recent messages to remember before summarizing older ones.</small>
                </div>

                <div class="settings-form-group">
                    <label class="settings-label">Story Progression Style:</label>
                    <select id="sysSettingsStoryProgression" class="settings-select">
                        <option value="conservative">Conservative - Characters respond naturally</option>
                        <option value="balanced">Balanced - Some proactive story elements</option>
                        <option value="active">Active - Characters drive story forward</option>
                    </select>
                    <small class="settings-hint">How actively characters advance the story and share news.</small>
                </div>

                <div class="settings-form-group">
                    <label class="settings-label">Response Length:</label>
                    <select id="sysSettingsResponseLength" class="settings-select">
                        <option value="brief">Brief - Very short responses</option>
                        <option value="normal">Normal - Typical message length</option>
                        <option value="detailed">Detailed - Longer, more descriptive</option>
                    </select>
                    <small class="settings-hint">How long character responses should be.</small>
                </div>

                <div class="settings-form-group">
                    <label class="settings-label-inline">
                        <input type="checkbox" id="sysSettingsAutoSummarize" class="settings-checkbox">
                        Auto-Summarize Old Conversations
                    </label>
                    <small class="settings-hint">Automatically compress old messages to save memory and improve performance.</small>
                </div>

                <div class="settings-actions">
                    <button class="settings-btn settings-btn-primary" id="sysSettingsSaveLLM">
                        <span class="mdi mdi-content-save elxa-icon-ui"></span> Save LLM Settings
                    </button>
                </div>
            </div>
        `;
    }

    _buildSystemTab() {
        const user = elxaOS.loginService.currentUser;
        const displayName = user ? user.displayName : 'User';
        const isDefault = user && user.username === 'kitkat';

        return `
            <div class="settings-section">
                <div class="settings-system-group">
                    <div class="settings-system-title">
                        <span class="mdi mdi-monitor elxa-icon-ui"></span> Desktop
                    </div>
                    <button class="settings-btn settings-system-btn" id="sysSettingsRefreshDesktop">
                        <span class="mdi mdi-refresh elxa-icon-ui"></span> Refresh Desktop
                    </button>
                    <small class="settings-hint">Re-sync desktop icons and shortcuts from the filesystem.</small>
                </div>

                <div class="settings-separator"></div>

                <div class="settings-system-group">
                    <div class="settings-system-title">
                        <span class="mdi mdi-reload elxa-icon-ui"></span> Reload
                    </div>
                    <button class="settings-btn settings-system-btn" id="sysSettingsReload">
                        <span class="mdi mdi-reload elxa-icon-ui"></span> Reload ElxaOS
                    </button>
                    <small class="settings-hint">Reload the page. Picks up code changes but keeps all saved data.</small>
                </div>

                <div class="settings-separator"></div>

                <div class="settings-system-group">
                    <div class="settings-system-title">
                        <span class="mdi mdi-account-remove elxa-icon-ui"></span> Danger Zone
                    </div>
                    <button class="settings-btn settings-btn-danger settings-system-btn" id="sysSettingsDeleteUser"
                        ${isDefault ? 'disabled title="Cannot delete the default admin account"' : ''}>
                        <span class="mdi mdi-account-remove elxa-icon-ui"></span> Delete User "${displayName}"
                    </button>
                    <small class="settings-hint">
                        ${isDefault
                            ? 'The default admin account cannot be deleted.'
                            : 'Permanently removes this user account and all associated data. You will be logged out.'}
                    </small>
                </div>
            </div>
        `;
    }

    // =========================================================
    // Event Binding
    // =========================================================
    _bindEvents() {
        const win = document.getElementById(`window-${this.windowId}`);
        if (!win) return;

        // Tab switching
        win.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                this._switchTab(tabId, win);
            });
        });

        // User tab
        const saveUserBtn = win.querySelector('#sysSettingsSaveUser');
        if (saveUserBtn) saveUserBtn.addEventListener('click', () => this._saveUserSettings());

        const changePwBtn = win.querySelector('#sysSettingsChangePassword');
        if (changePwBtn) changePwBtn.addEventListener('click', () => {
            elxaOS.loginService.showChangePasswordDialog();
        });

        // Wire up avatar picker
        setupAvatarPicker(win, 'sysSettingsAvatar');

        // LLM tab
        const saveLLMBtn = win.querySelector('#sysSettingsSaveLLM');
        if (saveLLMBtn) saveLLMBtn.addEventListener('click', () => this._saveLLMSettings());

        const refreshModelsBtn = win.querySelector('#sysSettingsRefreshModels');
        if (refreshModelsBtn) refreshModelsBtn.addEventListener('click', () => this._refreshModels());

        // System tab
        const refreshDesktopBtn = win.querySelector('#sysSettingsRefreshDesktop');
        if (refreshDesktopBtn) refreshDesktopBtn.addEventListener('click', () => {
            elxaOS.refreshDesktop();
            ElxaUI.showMessage('Desktop refreshed!', 'success');
        });

        const reloadBtn = win.querySelector('#sysSettingsReload');
        if (reloadBtn) reloadBtn.addEventListener('click', () => {
            location.reload();
        });

        const deleteUserBtn = win.querySelector('#sysSettingsDeleteUser');
        if (deleteUserBtn && !deleteUserBtn.disabled) {
            deleteUserBtn.addEventListener('click', () => this._deleteCurrentUser());
        }
    }

    _switchTab(tabId, win) {
        if (!win) {
            win = document.getElementById(`window-${this.windowId}`);
        }
        if (!win) return;

        this.activeTab = tabId;

        // Update tab buttons
        win.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
        win.querySelector(`.settings-tab[data-tab="${tabId}"]`)?.classList.add('active');

        // Update panels
        win.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
        const panelMap = { user: 'settingsUserPanel', llm: 'settingsLLMPanel', system: 'settingsSystemPanel' };
        win.querySelector(`#${panelMap[tabId]}`)?.classList.add('active');

        // Populate LLM fields when switching to that tab
        if (tabId === 'llm') {
            this._populateLLMTab();
        }
    }

    // =========================================================
    // User Settings
    // =========================================================
    _populateUserTab() {
        // Nothing extra needed — values are baked into the HTML at build time
    }

    _saveUserSettings() {
        const displayName = document.getElementById('sysSettingsDisplayName')?.value?.trim();
        const avatar = document.getElementById('sysSettingsAvatar')?.value?.trim();

        if (!displayName) {
            ElxaUI.showMessage('Display name cannot be empty', 'error');
            return;
        }

        if (!avatar) {
            ElxaUI.showMessage('Please select an avatar', 'error');
            return;
        }

        const username = elxaOS.loginService.currentUser.username;
        elxaOS.loginService.users[username].displayName = displayName;
        elxaOS.loginService.users[username].avatar = avatar;
        elxaOS.loginService.currentUser.displayName = displayName;
        elxaOS.loginService.currentUser.avatar = avatar;

        elxaOS.loginService.saveUsers();
        ElxaUI.showMessage('User settings saved!', 'success');

        this.eventBus.emit('login.settingsChanged', {
            username: username,
            displayName: displayName,
            avatar: avatar
        });
    }

    // =========================================================
    // LLM Settings
    // =========================================================
    _getMessengerSettings() {
        const messenger = elxaOS.programs?.messenger;
        if (!messenger) return null;
        return messenger.settings;
    }

    _populateLLMTab() {
        const ms = this._getMessengerSettings();
        if (!ms) return;

        const apiKeyEl = document.getElementById('sysSettingsApiKey');
        const llmEnabledEl = document.getElementById('sysSettingsLLMEnabled');
        const crossPlatformEl = document.getElementById('sysSettingsCrossPlatform');
        const historyLengthEl = document.getElementById('sysSettingsHistoryLength');
        const storyEl = document.getElementById('sysSettingsStoryProgression');
        const responseLengthEl = document.getElementById('sysSettingsResponseLength');
        const autoSummarizeEl = document.getElementById('sysSettingsAutoSummarize');

        if (apiKeyEl) apiKeyEl.value = ms.apiKey || '';
        if (llmEnabledEl) llmEnabledEl.checked = ms.llm?.enabled ?? true;
        if (crossPlatformEl) crossPlatformEl.checked = ms.llm?.crossPlatformHistory ?? true;
        if (historyLengthEl) historyLengthEl.value = ms.llm?.historyLength ?? 25;
        if (storyEl) storyEl.value = ms.llm?.storyProgression ?? 'balanced';
        if (responseLengthEl) responseLengthEl.value = ms.llm?.responseLength ?? 'normal';
        if (autoSummarizeEl) autoSummarizeEl.checked = ms.llm?.autoSummarize ?? true;

        // Populate model dropdown
        this._populateModelDropdown(ms);
    }

    _populateModelDropdown(ms) {
        const modelEl = document.getElementById('sysSettingsModel');
        if (!modelEl || !ms) return;

        modelEl.innerHTML = '';
        const models = ms.availableModels || ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-pro'];
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            option.selected = model === ms.selectedModel;
            modelEl.appendChild(option);
        });
    }

    async _refreshModels() {
        const messenger = elxaOS.programs?.messenger;
        if (!messenger) {
            ElxaUI.showMessage('Messenger not available', 'error');
            return;
        }

        const apiKey = document.getElementById('sysSettingsApiKey')?.value || messenger.settings.apiKey;
        if (!apiKey) {
            ElxaUI.showMessage('Please enter your API key first!', 'error');
            return;
        }

        ElxaUI.showMessage('Refreshing available models...', 'info');

        try {
            // Temporarily set the API key on messenger so fetchAvailableModels can use it
            messenger.settings.apiKey = apiKey;
            await messenger.fetchAvailableModels(apiKey);

            // Re-populate our dropdown with the updated list
            this._populateModelDropdown(messenger.settings);
            ElxaUI.showMessage('Models refreshed!', 'success');
        } catch (error) {
            console.error('Failed to refresh models:', error);
            ElxaUI.showMessage('Failed to refresh models. Check your API key!', 'error');
        }
    }

    _saveLLMSettings() {
        const messenger = elxaOS.programs?.messenger;
        if (!messenger) {
            ElxaUI.showMessage('Messenger not available — settings not saved', 'error');
            return;
        }

        // Read values from our form
        const apiKey = document.getElementById('sysSettingsApiKey')?.value || '';
        const selectedModel = document.getElementById('sysSettingsModel')?.value || messenger.settings.selectedModel;
        const llmEnabled = document.getElementById('sysSettingsLLMEnabled')?.checked ?? true;
        const crossPlatform = document.getElementById('sysSettingsCrossPlatform')?.checked ?? true;
        const historyLength = parseInt(document.getElementById('sysSettingsHistoryLength')?.value) || 25;
        const storyProgression = document.getElementById('sysSettingsStoryProgression')?.value || 'balanced';
        const responseLength = document.getElementById('sysSettingsResponseLength')?.value || 'normal';
        const autoSummarize = document.getElementById('sysSettingsAutoSummarize')?.checked ?? true;

        // Write to messenger's settings object
        messenger.settings.apiKey = apiKey;
        messenger.settings.selectedModel = selectedModel;
        messenger.settings.llm.enabled = llmEnabled;
        messenger.settings.llm.crossPlatformHistory = crossPlatform;
        messenger.settings.llm.historyLength = historyLength;
        messenger.settings.llm.storyProgression = storyProgression;
        messenger.settings.llm.responseLength = responseLength;
        messenger.settings.llm.autoSummarize = autoSummarize;

        // Persist via messenger's storage
        messenger.saveSettingsToStorage();

        // Update conversation manager if active
        if (messenger.conversationManager) {
            messenger.conversationManager.updateSettings(messenger.settings.llm);
        }

        // Sync shared LLM service
        if (window.elxaLLM) {
            window.elxaLLM.refreshSettings();
        }

        // Notify messenger (in case its settings panel is open)
        this.eventBus.emit('settings.llmChanged');

        ElxaUI.showMessage('LLM settings saved!', 'success');
    }

    // =========================================================
    // System Tools
    // =========================================================
    async _deleteCurrentUser() {
        const user = elxaOS.loginService.currentUser;
        if (!user) return;

        if (user.username === 'kitkat') {
            ElxaUI.showMessage('Cannot delete the default admin account', 'error');
            return;
        }

        const confirmed = await ElxaUI.showConfirmDialog(
            `Are you sure you want to delete "${user.displayName}"?\n\nThis will permanently remove this account and all associated data. You will be logged out immediately.\n\nThis action cannot be undone.`,
            'Delete User Account'
        );

        if (!confirmed) return;

        // Double confirmation for safety
        const reallyConfirmed = await ElxaUI.showConfirmDialog(
            `Final confirmation: Delete "${user.displayName}" forever?`,
            'Confirm Deletion'
        );

        if (!reallyConfirmed) return;

        try {
            // Clear this user's registry data (per-user state + profile)
            await elxaOS.registry.clearUserData();

            // Remove the user from login service
            const username = user.username;
            delete elxaOS.loginService.users[username];
            elxaOS.loginService.saveUsers();

            ElxaUI.showMessage(`User "${user.displayName}" has been deleted.`, 'info');

            // Log out after a brief moment so the message is visible
            setTimeout(() => {
                elxaOS.loginService.logout();
            }, 1500);
        } catch (error) {
            console.error('Failed to delete user:', error);
            ElxaUI.showMessage('Failed to delete user account', 'error');
        }
    }
}
