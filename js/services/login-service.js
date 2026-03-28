// =================================
// LOGIN SERVICE
// =================================
class LoginService {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.isLoggedIn = false;
        this.currentUser = null;
        this.loginAttempts = 0;
        this.maxAttempts = 3;
        this.lockoutTime = 30000; // 30 seconds
        this.isLockedOut = false;
        
        // Default version info - can be customized
        this.versionInfo = {
            name: 'ElxaOS',
            version: '1.0',
            codename: 'KitKat',
            build: '2024.01'
        };
        
        // Default user - can be changed
        this.users = {
            kitkat: {
                username: 'kitkat',
                password: '3722',
                displayName: 'KitKat',
                avatar: 'sprite:paw',
                created: new Date(),
                lastLogin: null,
                loginCount: 0
            }
        };

        this.setupEvents();
        this.loadSavedUsers();
        this.loadVersionInfo();
    }

    setupEvents() {
        // Listen for login attempts
        this.eventBus.on('login.attempt', (data) => {
            this.attemptLogin(data.username, data.password);
        });

        // Listen for logout requests
        this.eventBus.on('login.logout', () => {
            this.logout();
        });

        // Listen for password change requests
        this.eventBus.on('login.changePassword', () => {
            this.showChangePasswordDialog();
        });

        // Listen for user settings requests
        this.eventBus.on('login.userSettings', () => {
            this.showUserSettingsDialog();
        });
    }

    showLoginScreen() {
        // Hide desktop and taskbar
        document.getElementById('desktop').style.display = 'none';
        document.querySelector('.taskbar').style.display = 'none';

        // Remove any existing login screen
        const existingLogin = document.getElementById('loginScreen');
        if (existingLogin) existingLogin.remove();

        // Create login screen
        const loginScreen = document.createElement('div');
        loginScreen.id = 'loginScreen';
        loginScreen.className = 'login-screen';

        const welcomeText = this.isLockedOut ? 
            `Account locked. Try again in ${Math.ceil(this.lockoutTime / 1000)} seconds.` :
            this.loginAttempts > 0 ? 
                `Incorrect password. ${this.maxAttempts - this.loginAttempts} attempts remaining.` :
                'Welcome to ElxaOS';

        loginScreen.innerHTML = `
            <div class="login-background"></div>
            <div class="login-container">
                <div class="login-header">
                    <div class="login-logo">ElxaOS</div>
                    <div class="login-welcome">${welcomeText}</div>
                </div>
                
                <div class="login-form">
                    <div class="user-selection">
                    ${Object.values(this.users).filter(user => user.isActive !== false).map(user => `
                        <div class="user-tile ${user.username === this.getPrimaryUser() ? 'selected' : ''}" data-username="${user.username}">
                            <div class="user-avatar">${renderAvatar(user.avatar)}</div>
                            <div class="user-name">${user.displayName}</div>
                        </div>
                    `).join('')}
                    </div>
                    
                    <div class="login-input-section">
                        <div class="selected-user">
                            <div class="selected-avatar">${renderAvatar(this.users[this.getPrimaryUser()].avatar)}</div>
                            <div class="selected-name">${this.users[this.getPrimaryUser()].displayName}</div>
                        </div>
                        
                        <div class="password-section">
                            <input type="password" 
                                   id="loginPassword" 
                                   class="login-password" 
                                   placeholder="Enter password"
                                   ${this.isLockedOut ? 'disabled' : ''}>
                            <button id="loginButton" 
                                    class="login-button" 
                                    ${this.isLockedOut ? 'disabled' : ''}>
                                →
                            </button>
                        </div>
                        
                        <div class="login-options">
                            <div class="password-hint" style="display: none;">
                                Hint: It's your usual!
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="login-footer">
                    <div class="login-info">
                        ${this.currentUser && this.currentUser.lastLogin ? 
                            `Last login: ${this.currentUser.lastLogin.toLocaleDateString()}` : 
                            'First time login'}
                    </div>
                    <div class="login-actions">
                        <button class="hint-button" id="hintButton">
                            ${ElxaIcons.renderAction('lightbulb')} Password Hint
                        </button>
                        <button class="guest-button" id="guestButton">
                            ${ElxaIcons.renderAction('login')} Guest Login
                        </button>
                        <button class="new-user-button" id="newUserButton">
                            ${ElxaIcons.renderAction('account-plus')} New User
                        </button>
                    </div>
                    <div class="version-info" id="versionInfo" title="Click to edit version">
                        <div class="version-text">
                            ${this.versionInfo.name} ${this.versionInfo.version}
                            ${this.versionInfo.codename ? `"${this.versionInfo.codename}"` : ''}
                        </div>
                        <div class="build-text">Build ${this.versionInfo.build}</div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(loginScreen);
        
        this.setupLoginEvents();
        
        // Auto-focus password field
        if (!this.isLockedOut) {
            setTimeout(() => {
                document.getElementById('loginPassword').focus();
            }, 100);
        }

        // Handle lockout timer
        if (this.isLockedOut) {
            this.startLockoutTimer();
        }
    }

    // UPDATED setupLoginEvents method - replace your existing one
    setupLoginEvents() {
        // Login button
        document.getElementById('loginButton').addEventListener('click', () => {
            this.handleLoginClick();
        });

        // User tile selection
        document.querySelectorAll('.user-tile').forEach(tile => {
            tile.addEventListener('click', () => {
                document.querySelectorAll('.user-tile').forEach(t => t.classList.remove('selected'));
                tile.classList.add('selected');
                
                const username = tile.dataset.username;
                const user = this.users[username];
                
                document.querySelector('.selected-avatar').innerHTML = renderAvatar(user.avatar);
                document.querySelector('.selected-name').textContent = user.displayName;
            });
        });

        // Enter key in password field
        document.getElementById('loginPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.isLockedOut) {
                this.handleLoginClick();
            }
        });

        // FIXED: Use proper event listeners instead of onclick
        document.getElementById('hintButton').addEventListener('click', () => {
            this.showPasswordHint();
        });

        document.getElementById('guestButton').addEventListener('click', () => {
            this.guestLogin();
        });

        document.getElementById('newUserButton').addEventListener('click', () => {
            this.showCreateUserDialog();
        });

        // Version info click
        document.getElementById('versionInfo').addEventListener('click', () => {
            this.showVersionEditDialog();
        });

        // Escape key for guest login — store ref so it can be removed
        this._loginEscapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.guestLogin();
            }
        };
        document.addEventListener('keydown', this._loginEscapeHandler);
    }

    handleLoginClick() {
        if (this.isLockedOut) return;

        const selectedTile = document.querySelector('.user-tile.selected');
        const username = selectedTile ? selectedTile.dataset.username : 'kitkat';
        const password = document.getElementById('loginPassword').value;

        this.attemptLogin(username, password);
    }

    attemptLogin(username, password) {
        const user = this.users[username];
        
        if (!user) {
            this.showMessage('User not found', 'error');
            return;
        }

        if (user.password === password) {
            // Successful login
            this.loginAttempts = 0;
            this.isLockedOut = false;
            this.currentUser = user;
            this.isLoggedIn = true;
            
            // Update user stats
            user.lastLogin = new Date();
            user.loginCount++;
            
            // SAVE USER DATA after login stats update
            this.saveUsers();
            
            this.hideLoginScreen();
            this.showDesktop();
            
            // Welcome message
            setTimeout(() => {
                this.showMessage(`Welcome back, ${user.displayName}!`, 'success');
            }, 500);

            this.eventBus.emit('login.success', { 
                user: user.username,
                displayName: user.displayName 
            });
        } else {
            // Failed login
            this.loginAttempts++;
            
            if (this.loginAttempts >= this.maxAttempts) {
                this.lockAccount();
            } else {
                this.showLoginScreen(); // Refresh with error message
                // Clear password field
                setTimeout(() => {
                    const passwordField = document.getElementById('loginPassword');
                    if (passwordField) {
                        passwordField.value = '';
                        passwordField.focus();
                    }
                }, 100);
            }

            this.eventBus.emit('login.failed', { 
                username: username,
                attemptsRemaining: this.maxAttempts - this.loginAttempts 
            });
        }
    }

    lockAccount() {
        this.isLockedOut = true;
        this.showLoginScreen();
        this.showMessage('Account locked due to too many failed attempts', 'error');
        
        this.eventBus.emit('login.locked', { lockoutTime: this.lockoutTime });
    }

    startLockoutTimer() {
        const timer = setInterval(() => {
            this.lockoutTime -= 1000;
            
            const welcomeElement = document.querySelector('.login-welcome');
            if (welcomeElement) {
                welcomeElement.textContent = `Account locked. Try again in ${Math.ceil(this.lockoutTime / 1000)} seconds.`;
            }
            
            if (this.lockoutTime <= 0) {
                clearInterval(timer);
                this.isLockedOut = false;
                this.loginAttempts = 0;
                this.lockoutTime = 30000; // Reset timer
                this.showLoginScreen();
            }
        }, 1000);
    }

    guestLogin() {
        // Quick guest access with limited features
        this.currentUser = {
            username: 'guest',
            displayName: 'Guest User',
            avatar: 'sprite:person',
            isGuest: true
        };
        this.isLoggedIn = true;
        
        this.hideLoginScreen();
        this.showDesktop();
        
        setTimeout(() => {
            this.showMessage('Logged in as Guest (limited features)', 'info');
        }, 500);

        this.eventBus.emit('login.guest');
    }

    async logout() {
        console.log('👋 Initiating logout...');
        
        // Initialize shutdown manager if not exists (we reuse it for logout dialogs)
        if (!elxaOS.shutdownManager) {
            elxaOS.shutdownManager = new ShutdownManager();
        }
        
        // Show custom logout confirmation
        const confirmed = await elxaOS.shutdownManager.showLogoutConfirmation();
        
        if (confirmed) {
            console.log('👋 Logout confirmed');
            this.isLoggedIn = false;
            this.currentUser = null;
            this.loginAttempts = 0;
            
            this.hideDesktop();
            this.showLoginScreen();
            
            this.eventBus.emit('login.logout');
        } else {
            console.log('👋 Logout cancelled');
        }
    }

    hideLoginScreen() {
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) {
            loginScreen.remove();
        }
        // Clean up escape key listener to prevent stacking
        if (this._loginEscapeHandler) {
            document.removeEventListener('keydown', this._loginEscapeHandler);
            this._loginEscapeHandler = null;
        }
    }

    showDesktop() {
        document.getElementById('desktop').style.display = 'block';
        document.querySelector('.taskbar').style.display = 'flex';
    }

    hideDesktop() {
        document.getElementById('desktop').style.display = 'none';
        document.querySelector('.taskbar').style.display = 'none';
        
        // Close all windows
        document.querySelectorAll('.window').forEach(window => {
            window.remove();
        });
        
        // Clear taskbar programs
        document.getElementById('taskbarPrograms').innerHTML = '';
    }

    showPasswordHint() {
        const hintElement = document.querySelector('.password-hint');
        if (hintElement) {
            hintElement.style.display = 'block';
            
            setTimeout(() => {
                hintElement.style.display = 'none';
            }, 5000);
        }
    }

    showChangePasswordDialog() {
        if (!this.isLoggedIn || this.currentUser.isGuest) {
            this.showMessage('Please log in first', 'error');
            return;
        }

        const bodyHTML = `
            <div class="change-password-form">
                <div class="form-group">
                    <label>Current Password:</label>
                    <input type="password" id="cpCurrentPassword" class="password-input">
                </div>
                
                <div class="form-group">
                    <label>New Password:</label>
                    <input type="password" id="cpNewPassword" class="password-input">
                </div>
                
                <div class="form-group">
                    <label>Confirm New Password:</label>
                    <input type="password" id="cpConfirmPassword" class="password-input">
                </div>
                
                <div class="password-strength">
                    <div class="strength-meter">
                        <div class="strength-bar" id="cpStrengthBar"></div>
                    </div>
                    <div class="strength-text" id="cpStrengthText">Enter a password</div>
                </div>
            </div>
        `;

        const { dialog, close } = ElxaUI.createDialog({
            title: `${ElxaIcons.renderAction('key')} Change Password`,
            body: bodyHTML,
            className: 'change-password-dialog',
            buttons: [
                {
                    text: `${ElxaIcons.renderAction('save')} Change Password`,
                    className: 'elxa-dialog-btn-primary',
                    onClick: () => {
                        this.changePassword(close);
                    }
                },
                {
                    text: 'Cancel',
                    className: 'elxa-dialog-btn',
                    onClick: 'close'
                }
            ]
        });
        
        // Password strength checker
        dialog.querySelector('#cpNewPassword').addEventListener('input', (e) => {
            this.updatePasswordStrength(e.target.value);
        });

        // Enter key support
        dialog.querySelectorAll('.password-input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.changePassword(close);
            });
        });

        dialog.querySelector('#cpCurrentPassword').focus();
    }

    updatePasswordStrength(password) {
        const strengthBar = document.getElementById('cpStrengthBar');
        const strengthText = document.getElementById('cpStrengthText');
        
        let strength = 0;
        let feedback = '';
        
        if (password.length >= 4) strength += 25;
        if (password.length >= 8) strength += 25;
        if (/\d/.test(password)) strength += 25;
        if (/[!@#$%^&*]/.test(password)) strength += 25;
        
        strengthBar.style.width = strength + '%';
        
        if (strength === 0) {
            strengthBar.className = 'strength-bar';
            feedback = 'Enter a password';
        } else if (strength <= 25) {
            strengthBar.className = 'strength-bar weak';
            feedback = 'Weak';
        } else if (strength <= 50) {
            strengthBar.className = 'strength-bar fair';
            feedback = 'Fair';
        } else if (strength <= 75) {
            strengthBar.className = 'strength-bar good';
            feedback = 'Good';
        } else {
            strengthBar.className = 'strength-bar strong';
            feedback = 'Strong';
        }
        
        strengthText.textContent = feedback;
    }

    changePassword(closeDialog) {
        const currentPassword = document.getElementById('cpCurrentPassword').value;
        const newPassword = document.getElementById('cpNewPassword').value;
        const confirmPassword = document.getElementById('cpConfirmPassword').value;
        
        // Validate current password
        if (currentPassword !== this.currentUser.password) {
            this.showMessage('Current password is incorrect', 'error');
            return;
        }
        
        // Validate new password
        if (newPassword.length < 1) {
            this.showMessage('New password cannot be empty', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showMessage('New passwords do not match', 'error');
            return;
        }
        
        if (newPassword === currentPassword) {
            this.showMessage('New password must be different', 'error');
            return;
        }
        
        // Change password
        this.users[this.currentUser.username].password = newPassword;
        
        // SAVE USER DATA after password change
        this.saveUsers();
        
        if (closeDialog) closeDialog();
        this.showMessage('Password changed successfully!', 'success');
        
        this.eventBus.emit('login.passwordChanged', { username: this.currentUser.username });
    }

    showUserSettingsDialog() {
        if (!this.isLoggedIn || this.currentUser.isGuest) {
            this.showMessage('Please log in first', 'error');
            return;
        }

        const user = this.users[this.currentUser.username];

        const bodyHTML = `
            <div class="user-settings-form">
                <div class="form-group">
                    <label>Display Name:</label>
                    <input type="text" id="settingsDisplayName" class="text-input" value="${user.displayName}">
                </div>
                
                <div class="form-group">
                    ${buildAvatarPicker(user.avatar, 'settingsAvatarInput')}
                </div>
                
                <div class="user-stats">
                    <div class="user-stats-title">${ElxaIcons.renderAction('information')} Account Information</div>
                    <div class="stat-item">Username: <strong>${user.username}</strong></div>
                    <div class="stat-item">Created: <strong>${user.created ? user.created.toLocaleDateString() : 'Unknown'}</strong></div>
                    <div class="stat-item">Total Logins: <strong>${user.loginCount}</strong></div>
                    <div class="stat-item">Last Login: <strong>${user.lastLogin ? user.lastLogin.toLocaleDateString() : 'Never'}</strong></div>
                </div>
            </div>
        `;

        const { dialog, close } = ElxaUI.createDialog({
            title: `${ElxaIcons.renderAction('account')} User Settings`,
            body: bodyHTML,
            className: 'user-settings-dialog',
            buttons: [
                {
                    text: `${ElxaIcons.renderAction('save')} Save Changes`,
                    className: 'elxa-dialog-btn-primary',
                    onClick: () => {
                        this.saveUserSettings(close);
                    }
                },
                {
                    text: `${ElxaIcons.renderAction('key')} Change Password`,
                    className: 'elxa-dialog-btn',
                    onClick: () => {
                        close();
                        this.showChangePasswordDialog();
                    }
                },
                {
                    text: 'Close',
                    className: 'elxa-dialog-btn',
                    onClick: 'close'
                }
            ]
        });

        // Wire up avatar picker
        setupAvatarPicker(dialog, 'settingsAvatarInput');
    }

    saveUserSettings(closeDialog) {
        const displayName = document.getElementById('settingsDisplayName').value.trim();
        const avatar = document.getElementById('settingsAvatarInput').value.trim();
        
        if (!displayName) {
            this.showMessage('Display name cannot be empty', 'error');
            return;
        }
        
        if (!avatar) {
            this.showMessage('Please select an avatar', 'error');
            return;
        }
        
        // Update user settings
        this.users[this.currentUser.username].displayName = displayName;
        this.users[this.currentUser.username].avatar = avatar;
        this.currentUser.displayName = displayName;
        this.currentUser.avatar = avatar;
        
        // SAVE USER DATA after settings change
        this.saveUsers();
        
        if (closeDialog) closeDialog();
        this.showMessage('Settings saved successfully!', 'success');
        
        this.eventBus.emit('login.settingsChanged', { 
            username: this.currentUser.username,
            displayName: displayName,
            avatar: avatar 
        });
    }

    showVersionEditDialog() {
        // Remove any existing dialog first
        const existingDialog = document.getElementById('versionEditDialog');
        if (existingDialog) existingDialog.remove();

        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.id = 'versionEditDialog';
        backdrop.className = 'login-dialog-overlay';

        // Create the actual dialog
        const dialog = document.createElement('div');
        dialog.className = 'login-dialog-box';

        dialog.innerHTML = `
            <div class="login-dialog-header">
                <div class="login-dialog-title">${ElxaIcons.renderAction('settings')} Edit OS Version</div>
                <button class="login-dialog-close-btn">${ElxaIcons.renderAction('close')}</button>
            </div>
            <div class="login-dialog-body">
                <div class="version-edit-form">
                    <div class="login-dialog-hint">
                        Customize your operating system version information
                    </div>
                    
                    <div class="login-form-group">
                        <label class="login-form-label">OS Name:</label>
                        <input type="text" id="veOsName" class="login-form-input" value="${this.versionInfo.name}" placeholder="e.g., ElxaOS" maxlength="20">
                        <div class="login-form-help">The main name of your OS</div>
                    </div>
                    
                    <div class="login-form-group">
                        <label class="login-form-label">Version Number:</label>
                        <input type="text" id="veVersionNumber" class="login-form-input" value="${this.versionInfo.version}" placeholder="e.g., 1.0, 2.1, 13.4" maxlength="15">
                        <div class="login-form-help">Version like 1.0, 2.5, 14.2, etc.</div>
                    </div>
                    
                    <div class="login-form-group">
                        <label class="login-form-label">Codename (Optional):</label>
                        <input type="text" id="veCodeName" class="login-form-input" value="${this.versionInfo.codename}" placeholder="e.g., KitKat, Oreo, Ice Cream" maxlength="25">
                        <div class="login-form-help">Fun name like Android versions (optional)</div>
                    </div>
                    
                    <div class="login-form-group">
                        <label class="login-form-label">Build Number:</label>
                        <input type="text" id="veBuildNumber" class="login-form-input" value="${this.versionInfo.build}" placeholder="e.g., 2024.01, 230415.1" maxlength="20">
                        <div class="login-form-help">Build identifier (date or number)</div>
                    </div>
                    
                    <div class="version-preview-box">
                        <div class="version-preview-label">Preview:</div>
                        <div class="version-preview-content">
                            <div class="preview-name"></div>
                            <div class="preview-build"></div>
                        </div>
                    </div>
                    
                    <div class="login-dialog-actions">
                        <button class="login-btn-primary save-version-btn">${ElxaIcons.renderAction('save')} Save Version</button>
                        <button class="login-btn-warning reset-version-btn">${ElxaIcons.renderAction('restore')} Reset</button>
                        <button class="login-btn cancel-version-btn">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        backdrop.appendChild(dialog);
        document.body.appendChild(backdrop);

        // Update preview function
        const updatePreview = () => {
            const name = document.getElementById('veOsName').value.trim() || 'ElxaOS';
            const version = document.getElementById('veVersionNumber').value.trim() || '1.0';
            const codename = document.getElementById('veCodeName').value.trim();
            const build = document.getElementById('veBuildNumber').value.trim() || '2024.01';
            
            dialog.querySelector('.preview-name').textContent = `${name} ${version}${codename ? ` "${codename}"` : ''}`;
            dialog.querySelector('.preview-build').textContent = `Build ${build}`;
        };

        // Event listeners
        dialog.querySelector('.login-dialog-close-btn').addEventListener('click', () => backdrop.remove());
        dialog.querySelector('.cancel-version-btn').addEventListener('click', () => backdrop.remove());

        dialog.querySelector('.save-version-btn').addEventListener('click', () => {
            this.saveVersionChanges();
            backdrop.remove();
        });

        dialog.querySelector('.reset-version-btn').addEventListener('click', async () => {
            const confirmed = await ElxaUI.showConfirmDialog(
                'Reset to default version info?',
                'Reset Version'
            );
            if (confirmed) {
                document.getElementById('veOsName').value = 'ElxaOS';
                document.getElementById('veVersionNumber').value = '1.0';
                document.getElementById('veCodeName').value = 'KitKat';
                document.getElementById('veBuildNumber').value = '2024.01';
                updatePreview();
            }
        });

        // Live preview updates
        ['veOsName', 'veVersionNumber', 'veCodeName', 'veBuildNumber'].forEach(id => {
            document.getElementById(id).addEventListener('input', updatePreview);
        });

        // Click backdrop to close
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) backdrop.remove();
        });

        updatePreview();
        setTimeout(() => document.getElementById('veOsName').focus(), 100);
    }

    saveVersionChanges() {
        const name = document.getElementById('veOsName').value.trim() || 'ElxaOS';
        const version = document.getElementById('veVersionNumber').value.trim() || '1.0';
        const codename = document.getElementById('veCodeName').value.trim();
        const build = document.getElementById('veBuildNumber').value.trim() || '2024.01';

        this.versionInfo = {
            name: name,
            version: version,
            codename: codename,
            build: build
        };

        this.saveVersionInfo();
        this.showMessage('Version information updated!', 'success');
        
        // Refresh login screen to show new version
        this.showLoginScreen();

        this.eventBus.emit('version.updated', this.versionInfo);
    }

    // NEW METHOD: Save version info to storage
    saveVersionInfo() {
        try {
            localStorage.setItem('elxaOS-version', JSON.stringify(this.versionInfo));
            console.log('📱 Version info saved to localStorage');
        } catch (error) {
            console.error('❌ Failed to save version info:', error);
        }
    }

    // NEW METHOD: Load version info from storage
    loadVersionInfo() {
        try {
            const saved = localStorage.getItem('elxaOS-version');
            if (saved) {
                this.versionInfo = JSON.parse(saved);
                console.log('📱 Version info loaded from localStorage');
            } else {
                console.log('📱 No saved version info found, using defaults');
            }
        } catch (error) {
            console.error('❌ Failed to load version info:', error);
        }
    }

    // NEW METHOD: Clear user data (for testing/reset)
    clearUserData() {
        try {
            localStorage.removeItem('elxaOS-users');
            console.log('🗑️ User data cleared from localStorage');
            
            // Reset to defaults
            this.users = {
                kitkat: {
                    username: 'kitkat',
                    password: '3722',
                    displayName: 'KitKat',
                    avatar: 'sprite:paw',
                    created: new Date(),
                    lastLogin: null,
                    loginCount: 0
                }
            };
            
            this.currentUser = null;
            this.isLoggedIn = false;
            
        } catch (error) {
            console.error('❌ Failed to clear user data:', error);
        }
    }

    // NEW METHOD: Export user data (for backup)
    exportUserData() {
        try {
            const userData = JSON.stringify(this.users, null, 2);
            const blob = new Blob([userData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'elxaOS-user-backup.json';
            a.click();
            
            URL.revokeObjectURL(url);
            this.showMessage('User data exported successfully!', 'success');
        } catch (error) {
            console.error('❌ Failed to export user data:', error);
            this.showMessage('Failed to export user data', 'error');
        }
    }

    saveUsers() {
        try {
            localStorage.setItem('elxaOS-users', JSON.stringify(this.users));
            console.log('👤 User data saved to localStorage');
        } catch (error) {
            console.error('❌ Failed to save user data:', error);
            // Fallback to memory storage
            this.savedUsers = JSON.parse(JSON.stringify(this.users));
        }
    }

    loadSavedUsers() {
        try {
            const saved = localStorage.getItem('elxaOS-users');
            if (saved) {
                this.users = JSON.parse(saved);
                
                // FIX: Convert date strings back to Date objects
                Object.values(this.users).forEach(user => {
                    if (user.created && typeof user.created === 'string') {
                        user.created = new Date(user.created);
                    }
                    if (user.lastLogin && typeof user.lastLogin === 'string') {
                        user.lastLogin = new Date(user.lastLogin);
                    }
                });
                
                console.log('👤 User data loaded from localStorage');
            } else {
                console.log('👤 No saved user data found, using defaults');
            }
        } catch (error) {
            console.error('❌ Failed to load user data:', error);
            // Fallback to memory storage
            if (this.savedUsers) {
                this.users = this.savedUsers;
                Object.values(this.users).forEach(user => {
                    if (user.created) user.created = new Date(user.created);
                    if (user.lastLogin) user.lastLogin = new Date(user.lastLogin);
                });
            }
        }
    }

    showMessage(text, type = 'info') {
        ElxaUI.showMessage(text, type);
    }

    showCreateUserDialog() {
        // Remove any existing dialog first
        const existingDialog = document.getElementById('createUserDialog');
        if (existingDialog) existingDialog.remove();

        const backdrop = document.createElement('div');
        backdrop.id = 'createUserDialog';
        backdrop.className = 'login-dialog-overlay';

        const dialog = document.createElement('div');
        dialog.className = 'login-dialog-box';

        dialog.innerHTML = `
            <div class="login-dialog-header">
                <div class="login-dialog-title">${ElxaIcons.renderAction('account-plus')} Create New User</div>
                <button class="login-dialog-close-btn">${ElxaIcons.renderAction('close')}</button>
            </div>
            <div class="login-dialog-body">
                <div class="create-user-form">
                    <div class="login-form-group">
                        <label class="login-form-label">Username:</label>
                        <input type="text" id="cuUsername" class="login-form-input" placeholder="Enter username" maxlength="20">
                        <div class="login-form-help">Letters, numbers, and underscores only</div>
                    </div>
                    
                    <div class="login-form-group">
                        <label class="login-form-label">Display Name:</label>
                        <input type="text" id="cuDisplayName" class="login-form-input" placeholder="Enter display name" maxlength="30">
                    </div>
                    
                    <div class="login-form-group">
                        <label class="login-form-label">Password:</label>
                        <input type="password" id="cuPassword" class="login-form-input" placeholder="Enter password">
                    </div>
                    
                    <div class="login-form-group">
                        <label class="login-form-label">Confirm Password:</label>
                        <input type="password" id="cuConfirmPassword" class="login-form-input" placeholder="Confirm password">
                    </div>
                    
                    <div class="login-form-group">
                        ${buildAvatarPicker('sprite:smiley', 'cuAvatar')}
                    </div>
                </div>
            </div>
            <div class="login-dialog-footer">
                <button class="login-btn-primary create-user-btn">${ElxaIcons.renderAction('account-plus')} Create User</button>
                <button class="login-btn cancel-btn">Cancel</button>
            </div>
        `;

        backdrop.appendChild(dialog);
        document.body.appendChild(backdrop);

        // Event listeners
        dialog.querySelector('.login-dialog-close-btn').addEventListener('click', () => backdrop.remove());
        dialog.querySelector('.cancel-btn').addEventListener('click', () => backdrop.remove());

        dialog.querySelector('.create-user-btn').addEventListener('click', () => {
            this.createNewUser(backdrop);
        });

        // Wire up avatar picker
        setupAvatarPicker(dialog, 'cuAvatar');

        // Enter key in form fields
        dialog.querySelectorAll('input[type="text"], input[type="password"]').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.createNewUser(backdrop);
            });
        });

        // Click backdrop to close
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) backdrop.remove();
        });

        setTimeout(() => document.getElementById('cuUsername').focus(), 100);
    }

    createNewUser(backdrop) {
        const username = document.getElementById('cuUsername').value.trim().toLowerCase();
        const displayName = document.getElementById('cuDisplayName').value.trim();
        const password = document.getElementById('cuPassword').value;
        const confirmPassword = document.getElementById('cuConfirmPassword').value;
        const avatar = document.getElementById('cuAvatar').value.trim();

        // Validation
        if (!username) {
            this.showMessage('Username is required', 'error');
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            this.showMessage('Username can only contain letters, numbers, and underscores', 'error');
            return;
        }

        if (this.users[username]) {
            this.showMessage('Username already exists', 'error');
            return;
        }

        if (!displayName) {
            this.showMessage('Display name is required', 'error');
            return;
        }

        if (!password) {
            this.showMessage('Password is required', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }

        if (!avatar) {
            this.showMessage('Please select an avatar', 'error');
            return;
        }

        // Create new user
        this.users[username] = {
            username: username,
            password: password,
            displayName: displayName,
            avatar: avatar,
            created: new Date(),
            lastLogin: null,
            loginCount: 0
        };

        // Save to localStorage
        this.saveUsers();

        // Close dialog
        if (backdrop) backdrop.remove();

        // Show success message and refresh login screen
        this.showMessage(`User "${displayName}" created successfully!`, 'success');
        this.showLoginScreen();

        this.eventBus.emit('user.created', { 
            username: username,
            displayName: displayName 
        });
    }

    async deleteUser(username) {
        if (username === 'kitkat') {
            this.showMessage('Cannot delete the default admin user', 'error');
            return false;
        }

        if (this.users[username]) {
            const confirmed = await ElxaUI.showConfirmDialog(
                `Are you sure you want to delete user "${this.users[username].displayName}"? This cannot be undone.`,
                'Delete User'
            );
            if (confirmed) {
                delete this.users[username];
                this.saveUsers();
                this.showMessage('User deleted successfully', 'success');
                
                // If it was the current user, log out
                if (this.currentUser && this.currentUser.username === username) {
                    this.logout();
                }
                
                return true;
            }
        }
        return false;
    }

    // NEW METHOD: List all users (for admin purposes)
    getAllUsers() {
        return Object.values(this.users).map(user => ({
            username: user.username,
            displayName: user.displayName,
            avatar: user.avatar,
            created: user.created,
            lastLogin: user.lastLogin,
            loginCount: user.loginCount
        }));
    }

    // NEW METHOD: Clear version data (for testing/reset)
    clearVersionData() {
        try {
            localStorage.removeItem('elxaOS-version');
            console.log('🗑️ Version data cleared from localStorage');
            
            // Reset to defaults
            this.versionInfo = {
                name: 'ElxaOS',
                version: '1.0',
                codename: 'KitKat',
                build: '2024.01'
            };
            
        } catch (error) {
            console.error('❌ Failed to clear version data:', error);
        }
    }

    // Add this method to detect the primary user after setup
    getPrimaryUser() {
        const setupUser = localStorage.getItem('elxaOS-primary-user');
        if (setupUser && this.users[setupUser]) {
            return setupUser;
        }
        // Fallback to first non-default user, then 'user'
        const usernames = Object.keys(this.users);
        const nonDefaultUser = usernames.find(username => !this.users[username].isDefault && this.users[username].isSetupUser);
        return nonDefaultUser || 'user';
    }

    // NEW METHOD: Get current version info
    getVersionInfo() {
        return { ...this.versionInfo };
    }

    // API methods
    getCurrentUser() {
        return this.currentUser;
    }

    isUserLoggedIn() {
        return this.isLoggedIn;
    }

    isGuestUser() {
        return this.currentUser && this.currentUser.isGuest;
    }

    // Initialize the login system
    initialize() {
        // Start with login screen
        this.showLoginScreen();
    }
}