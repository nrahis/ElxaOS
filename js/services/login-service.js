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
                avatar: '😸',
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
                            <div class="user-avatar">${user.avatar}</div>
                            <div class="user-name">${user.displayName}</div>
                        </div>
                    `).join('')}
                    </div>
                    
                    <div class="login-input-section">
                        <div class="selected-user">
                            <div class="selected-avatar">${this.users[this.getPrimaryUser()].avatar}</div>
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
                            💡 Password Hint
                        </button>
                        <button class="guest-button" id="guestButton">
                            👤 Guest Login
                        </button>
                        <button class="new-user-button" id="newUserButton">
                            ➕ New User
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
                
                document.querySelector('.selected-avatar').textContent = user.avatar;
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

        // Escape key for guest login
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.guestLogin();
            }
        });
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
            avatar: '👤',
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

        const dialog = document.createElement('div');
        dialog.id = 'changePasswordDialog';
        dialog.className = 'system-dialog change-password-dialog';

        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <div class="dialog-title">🔐 Change Password</div>
                    <div class="dialog-close" onclick="document.getElementById('changePasswordDialog').remove()">×</div>
                </div>
                <div class="dialog-body">
                    <div class="change-password-form">
                        <div class="form-group">
                            <label>Current Password:</label>
                            <input type="password" id="currentPassword" class="password-input">
                        </div>
                        
                        <div class="form-group">
                            <label>New Password:</label>
                            <input type="password" id="newPassword" class="password-input">
                        </div>
                        
                        <div class="form-group">
                            <label>Confirm New Password:</label>
                            <input type="password" id="confirmPassword" class="password-input">
                        </div>
                        
                        <div class="password-strength">
                            <div class="strength-meter">
                                <div class="strength-bar" id="strengthBar"></div>
                            </div>
                            <div class="strength-text" id="strengthText">Enter a password</div>
                        </div>
                        
                        <div class="form-actions">
                            <button class="change-btn" onclick="elxaOS.loginService.changePassword()">Change Password</button>
                            <button class="dialog-button" onclick="document.getElementById('changePasswordDialog').remove()">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
        
        // Password strength checker
        document.getElementById('newPassword').addEventListener('input', (e) => {
            this.updatePasswordStrength(e.target.value);
        });

        document.getElementById('currentPassword').focus();
    }

    updatePasswordStrength(password) {
        const strengthBar = document.getElementById('strengthBar');
        const strengthText = document.getElementById('strengthText');
        
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

    changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
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
        
        document.getElementById('changePasswordDialog').remove();
        this.showMessage('Password changed successfully!', 'success');
        
        this.eventBus.emit('login.passwordChanged', { username: this.currentUser.username });
    }

    showUserSettingsDialog() {
        if (!this.isLoggedIn || this.currentUser.isGuest) {
            this.showMessage('Please log in first', 'error');
            return;
        }

        const dialog = document.createElement('div');
        dialog.id = 'userSettingsDialog';
        dialog.className = 'system-dialog user-settings-dialog';

        const user = this.users[this.currentUser.username];

        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <div class="dialog-title">👤 User Settings</div>
                    <div class="dialog-close" onclick="document.getElementById('userSettingsDialog').remove()">×</div>
                </div>
                <div class="dialog-body">
                    <div class="user-settings-form">
                        <div class="form-group">
                            <label>Display Name:</label>
                            <input type="text" id="displayName" class="text-input" value="${user.displayName}">
                        </div>
                        
                        <div class="form-group">
                            <label>Avatar (Emoji):</label>
                            <div class="avatar-selection">
                                <input type="text" id="avatarInput" class="avatar-input" value="${user.avatar}" maxlength="2">
                                <div class="avatar-options">
                                    ${['😸', '🐱', '👤', '🤖', '🎮', '🚀', '⭐', '🔥'].map(emoji => 
                                        `<div class="avatar-option" onclick="elxaOS.loginService.selectAvatar('${emoji}')">${emoji}</div>`
                                    ).join('')}
                                </div>
                            </div>
                        </div>
                        
                        <div class="user-stats">
                            <h4>Account Information</h4>
                            <div class="stat-item">Username: <strong>${user.username}</strong></div>
                            <div class="stat-item">Created: <strong>${user.created.toLocaleDateString()}</strong></div>
                            <div class="stat-item">Total Logins: <strong>${user.loginCount}</strong></div>
                            <div class="stat-item">Last Login: <strong>${user.lastLogin ? user.lastLogin.toLocaleDateString() : 'Never'}</strong></div>
                        </div>
                        
                        <div class="form-actions">
                            <button class="save-btn" onclick="elxaOS.loginService.saveUserSettings()">Save Changes</button>
                            <button class="change-password-btn" onclick="elxaOS.loginService.showChangePasswordDialog()">Change Password</button>
                            <button class="dialog-button" onclick="document.getElementById('userSettingsDialog').remove()">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
    }

    selectAvatar(emoji) {
        document.getElementById('avatarInput').value = emoji;
    }

    saveUserSettings() {
        const displayName = document.getElementById('displayName').value.trim();
        const avatar = document.getElementById('avatarInput').value.trim();
        
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
        
        document.getElementById('userSettingsDialog').remove();
        this.showMessage('Settings saved successfully!', 'success');
        
        this.eventBus.emit('login.settingsChanged', { 
            username: this.currentUser.username,
            displayName: displayName,
            avatar: avatar 
        });
    }

    // FIXED: Show version edit dialog with proper sizing
    showVersionEditDialog() {
        // Remove any existing dialog first
        const existingDialog = document.getElementById('versionEditDialog');
        if (existingDialog) existingDialog.remove();

        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.id = 'versionEditDialog';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.6);
            z-index: 9999;
            display: block;
        `;

        // Create the actual dialog
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #c0c0c0;
            border: 3px outset #c0c0c0;
            width: 420px;
            max-width: 90vw;
            max-height: 85vh;
            box-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            display: flex;
            flex-direction: column;
        `;

        dialog.innerHTML = `
            <div class="dialog-header" style="
                background: linear-gradient(90deg, #0000ff, #008080);
                color: white;
                padding: 6px 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-weight: bold;
                font-size: 11px;
                cursor: move;
                flex-shrink: 0;
            ">
                <div class="dialog-title">⚙️ Edit OS Version</div>
                <div class="dialog-close" style="
                    cursor: pointer;
                    padding: 2px 6px;
                    border: 1px outset #c0c0c0;
                    background: #c0c0c0;
                    color: black;
                    font-size: 12px;
                    line-height: 1;
                ">×</div>
            </div>
            <div class="dialog-body" style="
                padding: 16px; 
                font-size: 11px;
                overflow-y: auto;
                max-height: calc(85vh - 60px);
                flex: 1;
            ">
                <div class="version-edit-form">
                    <div style="text-align: center; margin-bottom: 16px; color: #666; font-size: 10px;">
                        Customize your operating system version information
                    </div>
                    
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 4px; font-weight: bold;">OS Name:</label>
                        <input type="text" id="osName" value="${this.versionInfo.name}" style="
                            width: calc(100% - 8px);
                            padding: 6px 4px;
                            border: 2px inset #c0c0c0;
                            font-family: 'MS Sans Serif', sans-serif;
                            font-size: 11px;
                        " placeholder="e.g., ElxaOS" maxlength="20">
                        <div style="font-size: 9px; color: #666; margin-top: 2px;">The main name of your OS</div>
                    </div>
                    
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 4px; font-weight: bold;">Version Number:</label>
                        <input type="text" id="versionNumber" value="${this.versionInfo.version}" style="
                            width: calc(100% - 8px);
                            padding: 6px 4px;
                            border: 2px inset #c0c0c0;
                            font-family: 'MS Sans Serif', sans-serif;
                            font-size: 11px;
                        " placeholder="e.g., 1.0, 2.1, 13.4" maxlength="15">
                        <div style="font-size: 9px; color: #666; margin-top: 2px;">Version like 1.0, 2.5, 14.2, etc.</div>
                    </div>
                    
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 4px; font-weight: bold;">Codename (Optional):</label>
                        <input type="text" id="codeName" value="${this.versionInfo.codename}" style="
                            width: calc(100% - 8px);
                            padding: 6px 4px;
                            border: 2px inset #c0c0c0;
                            font-family: 'MS Sans Serif', sans-serif;
                            font-size: 11px;
                        " placeholder="e.g., KitKat, Oreo, Ice Cream" maxlength="25">
                        <div style="font-size: 9px; color: #666; margin-top: 2px;">Fun name like Android versions (optional)</div>
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 4px; font-weight: bold;">Build Number:</label>
                        <input type="text" id="buildNumber" value="${this.versionInfo.build}" style="
                            width: calc(100% - 8px);
                            padding: 6px 4px;
                            border: 2px inset #c0c0c0;
                            font-family: 'MS Sans Serif', sans-serif;
                            font-size: 11px;
                        " placeholder="e.g., 2024.01, 230415.1" maxlength="20">
                        <div style="font-size: 9px; color: #666; margin-top: 2px;">Build identifier (date or number)</div>
                    </div>
                    
                    <div style="
                        border: 1px inset #c0c0c0;
                        background: #f8f8f8;
                        padding: 12px;
                        margin-bottom: 16px;
                        border-radius: 2px;
                    ">
                        <div style="font-weight: bold; margin-bottom: 6px; color: #333;">Preview:</div>
                        <div id="versionPreview" style="
                            font-size: 12px;
                            color: #0066cc;
                            text-align: center;
                            background: white;
                            padding: 8px;
                            border: 1px solid #ddd;
                            border-radius: 2px;
                        ">
                            <div class="preview-name"></div>
                            <div class="preview-build" style="font-size: 10px; color: #666; margin-top: 2px;"></div>
                        </div>
                    </div>
                    
                    <div style="
                        display: flex;
                        gap: 8px;
                        justify-content: center;
                        margin-top: 16px;
                    ">
                        <button class="save-version-btn" style="
                            padding: 6px 16px;
                            border: 2px outset #4CAF50;
                            background: linear-gradient(to bottom, #4CAF50, #45a049);
                            color: white;
                            cursor: pointer;
                            font-weight: bold;
                            font-size: 11px;
                            border-radius: 2px;
                        ">💾 Save Version</button>
                        <button class="reset-version-btn" style="
                            padding: 6px 16px;
                            border: 2px outset #ff8800;
                            background: linear-gradient(to bottom, #ff8800, #ff6600);
                            color: white;
                            cursor: pointer;
                            font-size: 11px;
                            border-radius: 2px;
                        ">🔄 Reset</button>
                        <button class="cancel-version-btn" style="
                            padding: 6px 16px;
                            border: 2px outset #c0c0c0;
                            background: #c0c0c0;
                            cursor: pointer;
                            font-size: 11px;
                            border-radius: 2px;
                        ">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        // Add dialog to backdrop
        backdrop.appendChild(dialog);
        document.body.appendChild(backdrop);

        // Update preview function
        const updatePreview = () => {
            const name = document.getElementById('osName').value.trim() || 'ElxaOS';
            const version = document.getElementById('versionNumber').value.trim() || '1.0';
            const codename = document.getElementById('codeName').value.trim();
            const build = document.getElementById('buildNumber').value.trim() || '2024.01';
            
            const previewName = dialog.querySelector('.preview-name');
            const previewBuild = dialog.querySelector('.preview-build');
            
            previewName.textContent = `${name} ${version}${codename ? ` "${codename}"` : ''}`;
            previewBuild.textContent = `Build ${build}`;
        };

        // Set up event listeners
        dialog.querySelector('.dialog-close').addEventListener('click', () => {
            backdrop.remove();
        });

        dialog.querySelector('.cancel-version-btn').addEventListener('click', () => {
            backdrop.remove();
        });

        dialog.querySelector('.save-version-btn').addEventListener('click', () => {
            this.saveVersionChanges();
            backdrop.remove();
        });

        dialog.querySelector('.reset-version-btn').addEventListener('click', () => {
            if (confirm('Reset to default version info?')) {
                document.getElementById('osName').value = 'ElxaOS';
                document.getElementById('versionNumber').value = '1.0';
                document.getElementById('codeName').value = 'KitKat';
                document.getElementById('buildNumber').value = '2024.01';
                updatePreview();
            }
        });

        // Live preview updates
        ['osName', 'versionNumber', 'codeName', 'buildNumber'].forEach(id => {
            document.getElementById(id).addEventListener('input', updatePreview);
        });

        // Click backdrop to close
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                backdrop.remove();
            }
        });

        // Initial preview update
        updatePreview();

        // Focus first input
        setTimeout(() => {
            document.getElementById('osName').focus();
        }, 100);

        console.log('Version edit dialog created and displayed');
    }

    // NEW METHOD: Save version changes
    saveVersionChanges() {
        const name = document.getElementById('osName').value.trim() || 'ElxaOS';
        const version = document.getElementById('versionNumber').value.trim() || '1.0';
        const codename = document.getElementById('codeName').value.trim();
        const build = document.getElementById('buildNumber').value.trim() || '2024.01';

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
                    avatar: '😸',
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
        const message = document.createElement('div');
        message.className = `system-message ${type}`;
        message.textContent = text;
        
        const colors = {
            info: { bg: '#add8e6', color: 'black' },
            success: { bg: '#00ff00', color: 'black' },
            warning: { bg: '#ffff00', color: 'black' },
            error: { bg: '#ff0000', color: 'white' }
        };
        
        message.style.cssText = `
            position: fixed;
            top: 50px;
            right: 20px;
            background: ${colors[type].bg};
            color: ${colors[type].color};
            padding: 8px 16px;
            border: 2px outset #c0c0c0;
            z-index: 3000;
            font-weight: bold;
            font-size: 11px;
        `;

        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    // FIXED: Updated showCreateUserDialog method - replace your existing one
    showCreateUserDialog() {
        // Remove any existing dialog first
        const existingDialog = document.getElementById('createUserDialog');
        if (existingDialog) existingDialog.remove();

        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.id = 'createUserDialog';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.6);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Create the actual dialog
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: #c0c0c0;
            border: 3px outset #c0c0c0;
            width: 380px;
            max-height: 90vh;
            max-width: 90vw;
            box-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            display: flex;
            flex-direction: column;
        `;

        dialog.innerHTML = `
            <div class="dialog-header" style="
                background: linear-gradient(90deg, #0000ff, #008080);
                color: white;
                padding: 6px 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-weight: bold;
                font-size: 11px;
                cursor: move;
                flex-shrink: 0;
            ">
                <div class="dialog-title">➕ Create New User</div>
                <div class="dialog-close" style="
                    cursor: pointer;
                    padding: 2px 6px;
                    border: 1px outset #c0c0c0;
                    background: #c0c0c0;
                    color: black;
                    font-size: 12px;
                    line-height: 1;
                ">×</div>
            </div>
            <div class="dialog-body" style="
                padding: 16px;
                font-size: 11px;
                overflow-y: auto;
                flex: 1;
                min-height: 0;
            ">
                <div class="create-user-form">
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 4px; font-weight: bold;">Username:</label>
                        <input type="text" id="newUsername" style="
                            width: calc(100% - 8px);
                            padding: 3px 4px;
                            border: 2px inset #c0c0c0;
                            font-family: 'MS Sans Serif', sans-serif;
                            font-size: 11px;
                        " placeholder="Enter username" maxlength="20">
                        <div style="font-size: 9px; color: #666; margin-top: 2px;">Letters, numbers, and underscores only</div>
                    </div>
                    
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 4px; font-weight: bold;">Display Name:</label>
                        <input type="text" id="newDisplayName" style="
                            width: calc(100% - 8px);
                            padding: 3px 4px;
                            border: 2px inset #c0c0c0;
                            font-family: 'MS Sans Serif', sans-serif;
                            font-size: 11px;
                        " placeholder="Enter display name" maxlength="30">
                    </div>
                    
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 4px; font-weight: bold;">Password:</label>
                        <input type="password" id="newUserPassword" style="
                            width: calc(100% - 8px);
                            padding: 3px 4px;
                            border: 2px inset #c0c0c0;
                            font-family: 'MS Sans Serif', sans-serif;
                            font-size: 11px;
                        " placeholder="Enter password">
                    </div>
                    
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 4px; font-weight: bold;">Confirm Password:</label>
                        <input type="password" id="confirmUserPassword" style="
                            width: calc(100% - 8px);
                            padding: 3px 4px;
                            border: 2px inset #c0c0c0;
                            font-family: 'MS Sans Serif', sans-serif;
                            font-size: 11px;
                        " placeholder="Confirm password">
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 4px; font-weight: bold;">Avatar:</label>
                        <input type="text" id="newUserAvatar" value="👤" maxlength="2" style="
                            width: 40px;
                            padding: 3px;
                            border: 2px inset #c0c0c0;
                            text-align: center;
                            font-size: 14px;
                            margin-bottom: 6px;
                            display: block;
                        ">
                        <div style="
                            display: grid;
                            grid-template-columns: repeat(6, 1fr);
                            gap: 4px;
                            max-height: 80px;
                            overflow-y: auto;
                            border: 1px inset #c0c0c0;
                            padding: 4px;
                            background: white;
                        ">
                            ${['👤', '😸', '🐱', '🤖', '👦', '👧', '🚀', '⭐', '🔥', '🎮', '🦆', '🐧'].map(emoji => 
                                `<div class="avatar-option" style="
                                    cursor: pointer;
                                    padding: 4px;
                                    border: 1px outset #c0c0c0;
                                    background: #e0e0e0;
                                    font-size: 12px;
                                    line-height: 1;
                                    text-align: center;
                                    transition: all 0.1s;
                                " data-emoji="${emoji}">${emoji}</div>`
                            ).join('')}
                        </div>
                    </div>
                </div>
            </div>
            <div style="
                padding: 12px 16px;
                border-top: 1px solid #808080;
                display: flex;
                gap: 8px;
                justify-content: flex-end;
                flex-shrink: 0;
                background: #c0c0c0;
            ">
                <button class="create-user-btn" style="
                    padding: 4px 12px;
                    border: 2px outset #c0c0c0;
                    background: #c0c0c0;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 11px;
                ">Create User</button>
                <button class="cancel-btn" style="
                    padding: 4px 12px;
                    border: 2px outset #c0c0c0;
                    background: #c0c0c0;
                    cursor: pointer;
                    font-size: 11px;
                ">Cancel</button>
            </div>
        `;

        // Add dialog to backdrop
        backdrop.appendChild(dialog);
        document.body.appendChild(backdrop);

        // Set up event listeners
        dialog.querySelector('.dialog-close').addEventListener('click', () => {
            backdrop.remove();
        });

        dialog.querySelector('.cancel-btn').addEventListener('click', () => {
            backdrop.remove();
        });

        dialog.querySelector('.create-user-btn').addEventListener('click', () => {
            this.createNewUser();
        });

        // Avatar selection with hover effects
        dialog.querySelectorAll('.avatar-option').forEach(option => {
            option.addEventListener('click', () => {
                document.getElementById('newUserAvatar').value = option.dataset.emoji;
                
                // Visual feedback
                dialog.querySelectorAll('.avatar-option').forEach(opt => {
                    opt.style.background = '#e0e0e0';
                    opt.style.border = '1px outset #c0c0c0';
                });
                option.style.background = '#b0d0ff';
                option.style.border = '1px inset #c0c0c0';
            });

            // Hover effects
            option.addEventListener('mouseenter', () => {
                if (option.style.background !== 'rgb(176, 208, 255)') {
                    option.style.background = '#f0f0f0';
                }
            });

            option.addEventListener('mouseleave', () => {
                if (option.style.background !== 'rgb(176, 208, 255)') {
                    option.style.background = '#e0e0e0';
                }
            });
        });

        // Handle Enter key in form fields
        const formInputs = dialog.querySelectorAll('input[type="text"], input[type="password"]');
        formInputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.createNewUser();
                }
            });
        });

        // Click backdrop to close
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                backdrop.remove();
            }
        });

        // Focus first input
        setTimeout(() => {
            document.getElementById('newUsername').focus();
        }, 100);

        console.log('Create user dialog created and displayed');
    }

    // NEW METHOD: Select avatar for new user
    selectNewUserAvatar(emoji) {
        document.getElementById('newUserAvatar').value = emoji;
    }

    // NEW METHOD: Create new user
    createNewUser() {
        const username = document.getElementById('newUsername').value.trim().toLowerCase();
        const displayName = document.getElementById('newDisplayName').value.trim();
        const password = document.getElementById('newUserPassword').value;
        const confirmPassword = document.getElementById('confirmUserPassword').value;
        const avatar = document.getElementById('newUserAvatar').value.trim();

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
        document.getElementById('createUserDialog').remove();

        // Show success message and refresh login screen
        this.showMessage(`User "${displayName}" created successfully!`, 'success');
        this.showLoginScreen();

        this.eventBus.emit('user.created', { 
            username: username,
            displayName: displayName 
        });
    }

    // NEW METHOD: Delete user (admin function)
    deleteUser(username) {
        if (username === 'kitkat') {
            this.showMessage('Cannot delete the default admin user', 'error');
            return false;
        }

        if (this.users[username]) {
            if (confirm(`Are you sure you want to delete user "${this.users[username].displayName}"? This cannot be undone.`)) {
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