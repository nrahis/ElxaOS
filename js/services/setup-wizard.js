// =================================
// ELXAOS SETUP WIZARD
// =================================
class ElxaOSSetupWizard {
    constructor() {
        this.currentStep = 0;
        this.setupData = {
            userName: '',
            userAvatar: '👤',
            userPassword: '',
            confirmPassword: '',
            timeZone: 'Snakesia (GMT-3:01)',
            theme: 'classic',
            wallpaper: 'default',
            language: 'English (Snakesia)',
            acceptedLicense: false
        };
        
        this.steps = [
            { id: 'welcome', title: 'Welcome to ElxaOS', handler: 'renderWelcome' },
            { id: 'license', title: 'License Agreement', handler: 'renderLicense' },
            { id: 'userAccount', title: 'Create Your Account', handler: 'renderUserAccount' },
            { id: 'personalization', title: 'Personalize Your Experience', handler: 'renderPersonalization' },
            { id: 'installation', title: 'Setting Up ElxaOS', handler: 'renderInstallation' },
            { id: 'complete', title: 'Setup Complete', handler: 'renderComplete' }
        ];
        
        this.avatars = ['👤', '👦', '👧', '🧑', '👩', '👨', '🐱', '🐍', '🦆', '🎮', '🚀', '⭐'];
        this.programsToInstall = [
            { name: 'ElxaOS Shell', progress: 0, icon: '🖥️' },
            { name: 'File Manager', progress: 0, icon: '📁' },
            { name: 'Notepad', progress: 0, icon: '📄' },
            { name: 'Paint', progress: 0, icon: '🎨' },
            { name: 'Calculator', progress: 0, icon: '🧮' },
            { name: 'ElxaCode', progress: 0, icon: '💻' },
            { name: 'Snoogle Browser', progress: 0, icon: '🌐' },
            { name: 'ElxaGuard Antivirus', progress: 0, icon: '🛡️' },
            { name: 'ElxaMail', progress: 0, icon: '📧' },
            { name: 'Snakesia Messenger', progress: 0, icon: '💬' }
        ];
        
        this.installationStep = 0;
        this.installationTimer = null;
    }

    // Check if setup should run
    shouldRunSetup() {
        try {
            // Check if login service has any users (other than default user)
            const loginUsers = localStorage.getItem('elxaOS-users');
            if (loginUsers) {
                const users = JSON.parse(loginUsers);
                // If there are users other than default user, or user has been customized
                const userCount = Object.keys(users).length;
                const defaultUser = users.user;
                
                if (userCount > 1 || (defaultUser && defaultUser.loginCount > 0)) {
                    return false; // Setup already completed
                }
            }
            
            // Check for setup completion flag
            const setupComplete = localStorage.getItem('elxaOS-setup-complete');
            if (setupComplete === 'true') {
                return false;
            }
            
            // If no users or setup data exists, we need setup
            return true;
        } catch (error) {
            console.log('Error checking setup status:', error);
            return true; // Default to running setup if we can't check
        }
    }

    // Start the setup wizard
    async startSetup() {
        console.log('🚀 Starting ElxaOS Setup Wizard...');
        
        // Hide everything else
        this.hideAllUI();
        
        // Create setup container
        this.createSetupUI();
        
        // Start with first step
        this.currentStep = 0;
        this.renderCurrentStep();
        
        // Play setup sound if available
        this.playSetupSound();
    }

    hideAllUI() {
        try {
            const elements = [
                document.getElementById('desktop'),
                document.querySelector('.taskbar'),
                document.getElementById('loginScreen'),
                document.getElementById('bootScreen')
            ];
            
            elements.forEach(el => {
                if (el) el.style.display = 'none';
            });
            
            console.log('🔍 UI hidden for setup wizard');
        } catch (error) {
            console.warn('⚠️ Error hiding UI elements:', error);
        }
    }

    createSetupUI() {
        // Remove any existing setup screen
        const existing = document.getElementById('elxaosSetup');
        if (existing) existing.remove();
        
        const setupContainer = document.createElement('div');
        setupContainer.id = 'elxaosSetup';
        setupContainer.className = 'elxaos-setup-container';
        
        setupContainer.innerHTML = `
            <div class="setup-window">
                <div class="setup-header">
                    <div class="setup-logo">
                        <div class="setup-logo-icon">🏢</div>
                        <div class="setup-logo-text">
                            <div class="logo-main">ElxaOS</div>
                            <div class="logo-sub">Professional Edition</div>
                        </div>
                    </div>
                    <div class="setup-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" id="setupProgress"></div>
                        </div>
                        <div class="progress-text" id="progressText">Step 1 of ${this.steps.length}</div>
                    </div>
                </div>
                <div class="setup-content" id="setupContent">
                    <!-- Step content will be rendered here -->
                </div>
                <div class="setup-footer">
                    <div class="setup-buttons">
                        <button class="setup-btn" id="backBtn" disabled>⬅️ Back</button>
                        <button class="setup-btn primary" id="nextBtn">Next ➡️</button>
                    </div>
                    <div class="setup-info">
                        <div class="elxacorp-branding">© 2024 ElxaCorp Technologies, Snakesia</div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(setupContainer);
        
        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        const nextBtn = document.getElementById('nextBtn');
        const backBtn = document.getElementById('backBtn');
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextStep());
        }
        
        if (backBtn) {
            backBtn.addEventListener('click', () => this.previousStep());
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!document.getElementById('elxaosSetup')) return;
            
            if (e.key === 'Enter' && !nextBtn.disabled) {
                this.nextStep();
            } else if (e.key === 'Escape' && !backBtn.disabled) {
                this.previousStep();
            }
        });
    }

    renderCurrentStep() {
        const step = this.steps[this.currentStep];
        if (!step) return;
        
        // Update progress
        this.updateProgress();
        
        // Render step content
        this[step.handler]();
        
        // Update navigation buttons
        this.updateNavigationButtons();
    }

    updateProgress() {
        const progressFill = document.getElementById('setupProgress');
        const progressText = document.getElementById('progressText');
        
        const percentage = ((this.currentStep + 1) / this.steps.length) * 100;
        
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = `Step ${this.currentStep + 1} of ${this.steps.length}`;
        }
    }

    updateNavigationButtons() {
        const nextBtn = document.getElementById('nextBtn');
        const backBtn = document.getElementById('backBtn');
        
        if (backBtn) {
            backBtn.disabled = this.currentStep <= 0;
        }
        
        if (nextBtn) {
            if (this.currentStep >= this.steps.length - 1) {
                nextBtn.textContent = '🎉 Finish';
                nextBtn.className = 'setup-btn finish';
            } else {
                nextBtn.textContent = 'Next ➡️';
                nextBtn.className = 'setup-btn primary';
            }
            
            // Disable next button based on current step validation
            nextBtn.disabled = !this.validateCurrentStep();
        }
    }

    validateCurrentStep() {
        switch (this.currentStep) {
            case 1: // License
                return this.setupData.acceptedLicense;
            case 2: // User Account
                return this.setupData.userName.trim().length > 0 && 
                       this.setupData.userPassword.length > 0 && 
                       this.setupData.userPassword === this.setupData.confirmPassword;
            case 4: // Installation
                return this.installationStep >= this.programsToInstall.length;
            default:
                return true;
        }
    }

    validatePasswords() {
        const passwordHelp = document.getElementById('passwordHelp');
        const userPassword = this.setupData.userPassword;
        const confirmPassword = this.setupData.confirmPassword;
        
        if (!passwordHelp) return;
        
        if (userPassword.length === 0) {
            passwordHelp.textContent = 'Please enter a password';
            passwordHelp.style.color = '#666666';
        } else if (confirmPassword.length === 0) {
            passwordHelp.textContent = 'Please confirm your password';
            passwordHelp.style.color = '#666666';
        } else if (userPassword === confirmPassword) {
            passwordHelp.textContent = '✅ Passwords match!';
            passwordHelp.style.color = '#00aa00';
        } else {
            passwordHelp.textContent = '❌ Passwords do not match';
            passwordHelp.style.color = '#ff0000';
        }
    }

    // Step rendering methods
    renderWelcome() {
        const content = document.getElementById('setupContent');
        content.innerHTML = `
            <div class="setup-step welcome-step">
                <div class="welcome-hero">
                    <div class="welcome-icon">🎉</div>
                    <h1>Welcome to ElxaOS!</h1>
                    <p class="welcome-subtitle">Professional Edition</p>
                </div>
                
                <div class="welcome-content">
                    <div class="feature-grid">
                        <div class="feature-item">
                            <div class="feature-icon">🖥️</div>
                            <div class="feature-text">
                                <strong>Full Desktop Experience</strong>
                                <p>Complete with windows, taskbar, and file management</p>
                            </div>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">🌐</div>
                            <div class="feature-text">
                                <strong>Snoogle Browser</strong>
                                <p>Browse the Snakesian internet with our advanced browser</p>
                            </div>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">💬</div>
                            <div class="feature-text">
                                <strong>Communication Suite</strong>
                                <p>Stay connected with ElxaMail and Snakesia Messenger</p>
                            </div>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">🎮</div>
                            <div class="feature-text">
                                <strong>Entertainment & Games</strong>
                                <p>Install and play games from the Snakesian app store</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="welcome-footer">
                        <p>This setup wizard will help you configure ElxaOS for the best experience.</p>
                        <p class="snakesia-note">🐍 Proudly developed in Snakesia by ElxaCorp Technologies</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderLicense() {
        const content = document.getElementById('setupContent');
        content.innerHTML = `
            <div class="setup-step license-step">
                <h2>ElxaOS License Agreement</h2>
                <div class="license-text">
                    <div class="license-header">
                        <strong>ELXACORP TECHNOLOGIES END USER LICENSE AGREEMENT</strong>
                        <br><em>For ElxaOS Professional Edition</em>
                    </div>
                    
                    <div class="license-content">
                        <h3>🐍 Welcome to Snakesia!</h3>
                        <p>By using ElxaOS, you agree to have the most amazing computer experience ever! This operating system was lovingly crafted by Mr. Snake-e and the talented team at ElxaCorp.</p>
                        
                        <h3>📜 Terms of Awesomeness:</h3>
                        <ul>
                            <li>✅ You may use ElxaOS to create, play, and explore to your heart's content</li>
                            <li>✅ You are encouraged to try all the programs and games</li>
                            <li>✅ Pushing Cat is allowed in the system, but please keep an eye on them</li>
                            <li>✅ All virtual currency (Snakes 🐍) has no real-world value but infinite fun value</li>
                            <li>✅ Rita and Remi are available for tech support via messenger</li>
                            <li>✅ Mrs. Snake-e's garden tips are included free of charge</li>
                        </ul>
                        
                        <h3>🚫 Please Don't:</h3>
                        <ul>
                            <li>❌ Try to make real money from virtual Snakes</li>
                            <li>❌ Feed the computer actual food (it prefers data)</li>
                            <li>❌ Let Pushing Cat access the Sussy Lair settings</li>
                        </ul>
                        
                        <h3>💝 Special Thanks:</h3>
                        <p>This system exists to make computing fun and spark your imagination! Mr. Snake-e wants you to know that learning about computers should be an adventure.</p>
                        
                        <div class="license-footer">
                            <em>ElxaCorp Technologies - "Making Technology Magical Since 2024"</em><br>
                            <em>Headquartered in Beautiful Snakesia 🏛️</em>
                        </div>
                    </div>
                </div>
                
                <div class="license-agreement">
                    <label class="checkbox-container">
                        <input type="checkbox" id="acceptLicense" ${this.setupData.acceptedLicense ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        <span class="checkbox-text">I accept the terms of this agreement and am ready for an awesome ElxaOS experience! 🎉</span>
                    </label>
                </div>
            </div>
        `;
        
        // Setup license checkbox
        const checkbox = document.getElementById('acceptLicense');
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                this.setupData.acceptedLicense = e.target.checked;
                this.updateNavigationButtons();
            });
        }
    }

    renderUserAccount() {
        const content = document.getElementById('setupContent');
        
        // Build avatar options HTML
        const avatarOptionsHTML = this.avatars.map(avatar => {
            const isSelected = this.setupData.userAvatar === avatar ? 'selected' : '';
            return `
                <div class="avatar-option ${isSelected}" data-avatar="${avatar}">
                    ${avatar}
                </div>
            `;
        }).join('');
        
        content.innerHTML = `
            <div class="setup-step user-account-step">
                <h2>Create Your User Account</h2>
                <p class="step-description">Tell us a bit about yourself so we can personalize your ElxaOS experience!</p>
                
                <div class="account-form">
                    <div class="form-group">
                        <label for="userName">What should we call you?</label>
                        <input type="text" id="userName" class="setup-input" placeholder="Enter your name" 
                               value="${this.setupData.userName}" maxlength="50">
                        <div class="input-help">This will appear on your desktop and in programs</div>
                    </div>
                    
                    <div class="form-group">
                        <label>Choose your avatar:</label>
                        <div class="avatar-grid">
                            ${avatarOptionsHTML}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="userPassword">Create a password:</label>
                        <input type="password" id="userPassword" class="setup-input" placeholder="Enter password" 
                               value="${this.setupData.userPassword}" maxlength="50">
                        <div class="input-help">Keep it simple and memorable!</div>
                    </div>
                    
                    <div class="form-group">
                        <label for="confirmPassword">Confirm your password:</label>
                        <input type="password" id="confirmPassword" class="setup-input" placeholder="Enter password again" 
                               value="${this.setupData.confirmPassword}" maxlength="50">
                        <div class="input-help" id="passwordHelp">Passwords must match</div>
                    </div>
                    
                    <div class="form-group">
                        <label for="timeZone">Time Zone:</label>
                        <select id="timeZone" class="setup-select">
                            <option value="Snakesia (GMT-3:01)" ${this.setupData.timeZone === 'Snakesia (GMT-3:01)' ? 'selected' : ''}>
                                🐍 Snakesia (GMT-3:01) - Recommended
                            </option>
                            <option value="Eastern (GMT-5:00)" ${this.setupData.timeZone === 'Eastern (GMT-5:00)' ? 'selected' : ''}>
                                🇺🇸 Eastern Time (GMT-5:00)
                            </option>
                            <option value="Central (GMT-6:00)" ${this.setupData.timeZone === 'Central (GMT-6:00)' ? 'selected' : ''}>
                                🇺🇸 Central Time (GMT-6:00)
                            </option>
                            <option value="Pacific (GMT-8:00)" ${this.setupData.timeZone === 'Pacific (GMT-8:00)' ? 'selected' : ''}>
                                🇺🇸 Pacific Time (GMT-8:00)
                            </option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="language">Language:</label>
                        <select id="language" class="setup-select">
                            <option value="English (Snakesia)">🐍 English (Snakesia)</option>
                            <option value="English (US)">🇺🇸 English (United States)</option>
                            <option value="Snakesian">🗣️ Snakesian (Advanced)</option>
                        </select>
                    </div>
                </div>
                
                <div class="account-preview">
                    <div class="preview-card">
                        <div class="preview-avatar">${this.setupData.userAvatar}</div>
                        <div class="preview-info">
                            <div class="preview-name">${this.setupData.userName || 'Your Name'}</div>
                            <div class="preview-location">${this.setupData.timeZone}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Setup event handlers
        const userNameInput = document.getElementById('userName');
        const userPasswordInput = document.getElementById('userPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const timeZoneSelect = document.getElementById('timeZone');
        const languageSelect = document.getElementById('language');
        
        if (userNameInput) {
            userNameInput.addEventListener('input', (e) => {
                this.setupData.userName = e.target.value;
                this.updateAccountPreview();
                this.updateNavigationButtons();
            });
            
            // Focus the input
            setTimeout(() => userNameInput.focus(), 100);
        }
        
        if (userPasswordInput) {
            userPasswordInput.addEventListener('input', (e) => {
                this.setupData.userPassword = e.target.value;
                this.validatePasswords();
                this.updateNavigationButtons();
            });
        }
        
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', (e) => {
                this.setupData.confirmPassword = e.target.value;
                this.validatePasswords();
                this.updateNavigationButtons();
            });
        }
        
        if (timeZoneSelect) {
            timeZoneSelect.addEventListener('change', (e) => {
                this.setupData.timeZone = e.target.value;
                this.updateAccountPreview();
            });
        }
        
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.setupData.language = e.target.value;
            });
        }
        
        // Avatar selection
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                this.setupData.userAvatar = option.dataset.avatar;
                this.updateAccountPreview();
            });
        });
    }

    updateAccountPreview() {
        const previewName = document.querySelector('.preview-name');
        const previewAvatar = document.querySelector('.preview-avatar');
        const previewLocation = document.querySelector('.preview-location');
        
        if (previewName) previewName.textContent = this.setupData.userName || 'Your Name';
        if (previewAvatar) previewAvatar.textContent = this.setupData.userAvatar;
        if (previewLocation) previewLocation.textContent = this.setupData.timeZone;
    }

    renderPersonalization() {
        const content = document.getElementById('setupContent');
        
        // Get available themes and wallpapers
        const themes = elxaOS?.themeService?.themes || {
            classic: { name: 'Classic', colors: {} },
            luna: { name: 'Luna Blue', colors: {} },
            bubblegum: { name: 'Bubblegum', colors: {} }
        };
        
        const wallpapers = elxaOS?.themeService?.wallpapers || {
            default: { name: 'Default Gradient', type: 'gradient' },
            bliss: { name: 'Bliss', type: 'gradient' },
            ocean: { name: 'Ocean', type: 'gradient' }
        };
        
        // Build theme options HTML
        const themeOptionsHTML = Object.entries(themes).map(([key, theme]) => {
            const isSelected = this.setupData.theme === key ? 'selected' : '';
            const windowBg = theme.colors?.windowBg || '#c0c0c0';
            const windowBorder = theme.colors?.windowBorder || '#808080';
            const titlebarBg = theme.colors?.titlebarBg || 'linear-gradient(to right, #0000ff, #4080ff)';
            
            return `
                <div class="theme-option ${isSelected}" data-theme="${key}">
                    <div class="theme-preview">
                        <div class="theme-window" style="background: ${windowBg}; border-color: ${windowBorder};">
                            <div class="theme-titlebar" style="background: ${titlebarBg};"></div>
                        </div>
                    </div>
                    <div class="theme-name">${theme.name}</div>
                </div>
            `;
        }).join('');
        
        // Build wallpaper options HTML
        const wallpaperOptionsHTML = Object.entries(wallpapers).slice(0, 6).map(([key, wallpaper]) => {
            const isSelected = this.setupData.wallpaper === key ? 'selected' : '';
            const bgValue = wallpaper.value || (wallpaper.type === 'gradient' ? wallpaper.value : '#008080');
            
            return `
                <div class="wallpaper-option ${isSelected}" data-wallpaper="${key}">
                    <div class="wallpaper-preview" style="background: ${bgValue};"></div>
                    <div class="wallpaper-name">${wallpaper.name}</div>
                </div>
            `;
        }).join('');
        
        content.innerHTML = `
            <div class="setup-step personalization-step">
                <h2>Personalize Your Experience</h2>
                <p class="step-description">Choose how you want ElxaOS to look and feel!</p>
                
                <div class="personalization-content">
                    <div class="theme-section">
                        <h3>🎨 Color Theme</h3>
                        <div class="theme-options">
                            ${themeOptionsHTML}
                        </div>
                    </div>
                    
                    <div class="wallpaper-section">
                        <h3>🖼️ Desktop Background</h3>
                        <div class="wallpaper-options">
                            ${wallpaperOptionsHTML}
                        </div>
                    </div>
                    
                    <div class="preview-section">
                        <h3>👀 Preview</h3>
                        <div class="desktop-preview">
                            <div class="preview-desktop" id="desktopPreview">
                                <div class="preview-icons">
                                    <div class="preview-icon">🖥️<br><span>My Computer</span></div>
                                    <div class="preview-icon">🗑️<br><span>Recycle Bin</span></div>
                                    <div class="preview-icon">📄<br><span>Document</span></div>
                                </div>
                                <div class="preview-taskbar" id="taskbarPreview">
                                    <div class="preview-start">Start</div>
                                    <div class="preview-clock">12:34 PM</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Setup theme selection
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                this.setupData.theme = option.dataset.theme;
                this.updatePersonalizationPreview();
            });
        });
        
        // Setup wallpaper selection
        document.querySelectorAll('.wallpaper-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.wallpaper-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                this.setupData.wallpaper = option.dataset.wallpaper;
                this.updatePersonalizationPreview();
            });
        });
        
        // Initial preview update
        this.updatePersonalizationPreview();
    }

    updatePersonalizationPreview() {
        const desktopPreview = document.getElementById('desktopPreview');
        const taskbarPreview = document.getElementById('taskbarPreview');
        
        if (!desktopPreview || !taskbarPreview) return;
        
        const themes = elxaOS?.themeService?.themes || {};
        const wallpapers = elxaOS?.themeService?.wallpapers || {};
        
        const currentTheme = themes[this.setupData.theme] || themes.classic;
        const currentWallpaper = wallpapers[this.setupData.wallpaper] || wallpapers.default;
        
        // Update desktop background
        if (currentWallpaper.value) {
            desktopPreview.style.background = currentWallpaper.value;
        }
        
        // Update taskbar colors
        if (currentTheme.colors) {
            taskbarPreview.style.background = currentTheme.colors.taskbarBg || '#c0c0c0';
            taskbarPreview.style.borderColor = currentTheme.colors.taskbarBorder || '#ffffff';
        }
    }

    renderInstallation() {
        const content = document.getElementById('setupContent');
        
        // Build program list HTML
        const programListHTML = this.programsToInstall.map((program, index) => {
            return `
                <div class="program-item" id="program-${index}">
                    <div class="program-icon">${program.icon}</div>
                    <div class="program-info">
                        <div class="program-name">${program.name}</div>
                        <div class="program-progress">
                            <div class="progress-bar small">
                                <div class="progress-fill" id="progress-${index}"></div>
                            </div>
                            <div class="program-status" id="status-${index}">Waiting...</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        content.innerHTML = `
            <div class="setup-step installation-step">
                <h2>Setting Up ElxaOS</h2>
                <p class="step-description">Please wait while we install and configure your programs...</p>
                
                <div class="installation-content">
                    <div class="installation-status">
                        <div class="status-text" id="installationStatus">Preparing installation...</div>
                        <div class="overall-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" id="overallProgress"></div>
                            </div>
                            <div class="progress-text" id="overallProgressText">0%</div>
                        </div>
                    </div>
                    
                    <div class="program-list">
                        ${programListHTML}
                    </div>
                    
                    <div class="installation-info">
                        <div class="info-item">
                            <span class="info-label">Installing to:</span>
                            <span class="info-value">C:\\ElxaOS\\</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">User:</span>
                            <span class="info-value">${this.setupData.userName}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Time Zone:</span>
                            <span class="info-value">${this.setupData.timeZone}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Start installation process
        this.startInstallation();
    }

    startInstallation() {
        this.installationStep = 0;
        this.installPrograms();
    }

    async installPrograms() {
        if (this.installationStep >= this.programsToInstall.length) {
            this.finishInstallation();
            return;
        }
        
        const program = this.programsToInstall[this.installationStep];
        const statusElement = document.getElementById(`status-${this.installationStep}`);
        const progressElement = document.getElementById(`progress-${this.installationStep}`);
        const programElement = document.getElementById(`program-${this.installationStep}`);
        const installationStatus = document.getElementById('installationStatus');
        
        if (statusElement) statusElement.textContent = 'Installing...';
        if (programElement) programElement.classList.add('installing');
        if (installationStatus) installationStatus.textContent = `Installing ${program.name}...`;
        
        // Animate installation progress
        let progress = 0;
        const installInterval = setInterval(() => {
            progress += Math.random() * 25 + 5; // Random progress increments
            if (progress >= 100) {
                progress = 100;
                clearInterval(installInterval);
                
                // Mark as complete
                if (statusElement) statusElement.textContent = 'Complete ✅';
                if (programElement) {
                    programElement.classList.remove('installing');
                    programElement.classList.add('complete');
                }
                
                this.installationStep++;
                this.updateOverallProgress();
                
                // Move to next program after a short delay
                setTimeout(() => {
                    this.installPrograms();
                }, 300);
            }
            
            if (progressElement) {
                progressElement.style.width = `${Math.min(progress, 100)}%`;
            }
        }, Math.random() * 200 + 100); // Random timing between 100-300ms
    }

    updateOverallProgress() {
        const overallProgress = document.getElementById('overallProgress');
        const overallProgressText = document.getElementById('overallProgressText');
        
        const percentage = (this.installationStep / this.programsToInstall.length) * 100;
        
        if (overallProgress) {
            overallProgress.style.width = `${percentage}%`;
        }
        
        if (overallProgressText) {
            overallProgressText.textContent = `${Math.round(percentage)}%`;
        }
    }

    finishInstallation() {
        const installationStatus = document.getElementById('installationStatus');
        if (installationStatus) {
            installationStatus.textContent = 'Installation complete! 🎉';
        }
        
        // Enable next button
        this.updateNavigationButtons();
        
        // Auto-advance after a moment
        setTimeout(() => {
            this.nextStep();
        }, 2000);
    }

    renderComplete() {
        const content = document.getElementById('setupContent');
        content.innerHTML = `
            <div class="setup-step complete-step">
                <div class="complete-hero">
                    <div class="complete-icon">🎉</div>
                    <h1>Welcome to ElxaOS!</h1>
                    <p class="complete-subtitle">Setup is now complete</p>
                </div>
                
                <div class="complete-content">
                    <div class="welcome-message">
                        <h3>Hello, ${this.setupData.userName}! 👋</h3>
                        <p>Your ElxaOS system is ready to use. Here's what we've set up for you:</p>
                    </div>
                    
                    <div class="setup-summary">
                        <div class="summary-grid">
                            <div class="summary-item">
                                <div class="summary-icon">${this.setupData.userAvatar}</div>
                                <div class="summary-text">
                                    <strong>Your Account</strong>
                                    <div>${this.setupData.userName}</div>
                                </div>
                            </div>
                            <div class="summary-item">
                                <div class="summary-icon">🌍</div>
                                <div class="summary-text">
                                    <strong>Location</strong>
                                    <div>${this.setupData.timeZone}</div>
                                </div>
                            </div>
                            <div class="summary-item">
                                <div class="summary-icon">🎨</div>
                                <div class="summary-text">
                                    <strong>Theme</strong>
                                    <div>${elxaOS?.themeService?.themes[this.setupData.theme]?.name || 'Classic'}</div>
                                </div>
                            </div>
                            <div class="summary-item">
                                <div class="summary-icon">💻</div>
                                <div class="summary-text">
                                    <strong>Programs</strong>
                                    <div>${this.programsToInstall.length} installed</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="getting-started">
                        <h3>🚀 Getting Started</h3>
                        <div class="tips-grid">
                            <div class="tip-item">
                                <div class="tip-icon">🖱️</div>
                                <div class="tip-text">
                                    <strong>Desktop</strong>
                                    <p>Right-click the desktop to personalize themes and wallpapers</p>
                                </div>
                            </div>
                            <div class="tip-item">
                                <div class="tip-icon">📁</div>
                                <div class="tip-text">
                                    <strong>File Manager</strong>
                                    <p>Double-click "My Computer" to explore your files</p>
                                </div>
                            </div>
                            <div class="tip-item">
                                <div class="tip-icon">🌐</div>
                                <div class="tip-text">
                                    <strong>Internet</strong>
                                    <p>Use Snoogle Browser to explore Snakesian websites</p>
                                </div>
                            </div>
                            <div class="tip-item">
                                <div class="tip-icon">🎮</div>
                                <div class="tip-text">
                                    <strong>Games</strong>
                                    <p>Visit the Snakesian app store to download and install games</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="complete-footer">
                        <div class="thank-you">
                            <p>Thank you for choosing ElxaOS! We hope you have an amazing experience.</p>
                            <p class="signature">— Mr. Snake-e and the ElxaCorp Team 🐍</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Navigation methods
    nextStep() {
        if (this.currentStep >= this.steps.length - 1) {
            this.completeSetup();
            return;
        }
        
        if (!this.validateCurrentStep()) {
            this.showValidationError();
            return;
        }
        
        this.currentStep++;
        this.renderCurrentStep();
    }

    previousStep() {
        if (this.currentStep <= 0) return;
        
        this.currentStep--;
        this.renderCurrentStep();
    }

    showValidationError() {
        const errorMessages = {
            1: 'Please accept the license agreement to continue.',
            2: (() => {
                if (!this.setupData.userName.trim()) return 'Please enter your name to continue.';
                if (!this.setupData.userPassword) return 'Please create a password to continue.';
                if (this.setupData.userPassword !== this.setupData.confirmPassword) return 'Passwords do not match. Please check and try again.';
                return 'Please complete all fields to continue.';
            })()
        };
        
        const message = errorMessages[this.currentStep] || 'Please complete this step to continue.';
        this.showMessage(message, 'warning');
    }

    async completeSetup() {
        console.log('🎯 Completing ElxaOS setup...');
        
        // Save user data and create account
        this.saveSetupData();
        
        // Apply theme settings
        this.applySettings();
        
        // Initialize file system with defaults
        this.initializeFileSystem();
        
        // Show completion message
        this.showMessage('ElxaOS setup complete! Welcome! 🎉', 'success');
        
        // Remove setup UI and transition to login
        setTimeout(() => {
            this.removeSetupUI();
            this.transitionToLogin();
        }, 2000);
    }

    transitionToLogin() {
        try {
            // Check if login service is available
            if (typeof elxaOS !== 'undefined' && elxaOS.loginService) {
                console.log('🔑 Transitioning to login service...');
                
                // Force reload the users in the login service
                if (elxaOS.loginService.loadSavedUsers) {
                    elxaOS.loginService.loadSavedUsers();
                }
                
                // Show login screen
                elxaOS.loginService.showLoginScreen();
                
                // Show welcome message for the new user
                setTimeout(() => {
                    const username = localStorage.getItem('elxaOS-setup-user');
                    this.showMessage(`Setup complete! Welcome, ${this.setupData.userName}! Your username is "${username}"`, 'success');
                }, 1500);
                
            } else {
                // Fallback: show desktop directly
                console.log('⚠️ Login service not available, showing desktop directly');
                this.launchElxaOS();
            }
        } catch (error) {
            console.error('❌ Failed to transition to login:', error);
            this.launchElxaOS(); // Fallback
        }
    }

    saveSetupData() {
        try {
            // Generate a safe username
            let username = this.setupData.userName.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (!username || username.length < 2) {
                username = 'user' + Math.floor(Math.random() * 1000); // Fallback username
            }
            
            // Create user in login service format
            const newUser = {
                username: username,
                password: this.setupData.userPassword, // Use the user's chosen password
                displayName: this.setupData.userName,
                avatar: this.setupData.userAvatar,
                created: new Date(),
                lastLogin: null,
                loginCount: 0,
                timeZone: this.setupData.timeZone,
                language: this.setupData.language,
                isSetupUser: true
            };
            
            // Start with default login service structure
            const users = {
                // Keep a default user but mark it as inactive
                user: {
                    username: 'user',
                    password: '3722',
                    displayName: 'Default User',
                    avatar: '👤',
                    created: new Date(),
                    lastLogin: null,
                    loginCount: 0,
                    isDefault: true,
                    isActive: false
                }
            };
            
            // Add the new user and make them the primary user
            users[username] = newUser;
            
            // Save users to localStorage
            localStorage.setItem('elxaOS-users', JSON.stringify(users));
            
            // Mark setup as complete and set primary user
            localStorage.setItem('elxaOS-setup-complete', 'true');
            localStorage.setItem('elxaOS-setup-user', username);
            localStorage.setItem('elxaOS-primary-user', username);
            
            // Save theme preferences
            const themeSettings = {
                currentTheme: this.setupData.theme,
                currentWallpaper: this.setupData.wallpaper,
                customThemes: {}
            };
            localStorage.setItem('elxaOS-theme-settings', JSON.stringify(themeSettings));
            
            console.log('💾 Setup data saved, user created:', username);
            
        } catch (error) {
            console.error('❌ Failed to save setup data:', error);
        }
    }

    applySettings() {
        try {
            // Apply theme and wallpaper if theme service is available
            if (elxaOS && elxaOS.themeService) {
                elxaOS.themeService.setTheme(this.setupData.theme);
                elxaOS.themeService.setWallpaper(this.setupData.wallpaper);
                console.log('🎨 Theme settings applied');
            }
        } catch (error) {
            console.error('❌ Failed to apply settings:', error);
        }
    }

    initializeFileSystem() {
        // The file system will be initialized by the main ElxaOS system
        // We just need to make sure it has the default structure
        console.log('📁 File system will be initialized by ElxaOS');
    }

    removeSetupUI() {
        const setupContainer = document.getElementById('elxaosSetup');
        if (setupContainer) {
            setupContainer.remove();
        }
    }

    launchElxaOS() {
        // Show the desktop and taskbar
        try {
            const desktop = document.getElementById('desktop');
            const taskbar = document.querySelector('.taskbar');
            
            if (desktop) desktop.style.display = 'block';
            if (taskbar) taskbar.style.display = 'flex';
            
            console.log('🚀 ElxaOS launched successfully!');
            
            // Show welcome message
            setTimeout(() => {
                this.showMessage(`Welcome to ElxaOS, ${this.setupData.userName}! 🎉`, 'success');
            }, 1000);
            
        } catch (error) {
            console.error('❌ Failed to launch ElxaOS:', error);
        }
    }

    // Utility methods
    playSetupSound() {
        // Play Windows startup-style sound if available
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Play a nice startup chord
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 1);
            
        } catch (error) {
            // Sound not available, continue silently
            console.log('🔇 Setup sound not available');
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
            z-index: 10000;
            font-weight: bold;
            font-size: 11px;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 4000);
    }
}

// Initialize setup wizard
document.addEventListener('DOMContentLoaded', () => {
    // Create global instance
    window.elxaOSSetup = new ElxaOSSetupWizard();
    
    // Function to check and run setup
    window.checkAndRunSetup = () => {
        if (window.elxaOSSetup && window.elxaOSSetup.shouldRunSetup()) {
            console.log('🚀 First time setup detected - launching setup wizard');
            window.elxaOSSetup.startSetup();
            return true;
        }
        return false;
    };
    
    // Function for Task Manager to trigger setup after data clear
    window.triggerElxaOSSetup = () => {
        if (window.elxaOSSetup) {
            window.elxaOSSetup.triggerSetupAfterClear();
        }
    };
    
    console.log('✅ ElxaOS Setup Wizard ready');
});