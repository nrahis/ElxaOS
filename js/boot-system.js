// =================================
// BOOT SYSTEM - ElxaOS Boot Sequence & BIOS
// =================================
class BootSystem {
    constructor() {
        this.isBooting = false;
        this.biosAccessed = false;
        this.bootKeyPressed = false;
        this.bootMessages = [
            'ElxaBIOS v3.14 (C) 2024 ElxaCorp',
            'CPU: KitKat Processor 3.7GHz (4 cores)',
            'Memory Test: 8192MB OK',
            'USB Device(s): 2 found',
            'Hard Drive: ElxaDrive 1TB detected',
            'Graphics: ElxaGraphics HD 2024',
            'Network: ElxaNet adapter found',
            'Audio: ElxaSound Pro initialized',
            'Keyboard: ElxaKeys v2.0 detected',
            'Mouse: ElxaMouse Pro connected',
            '',
            'Press SHIFT + B to enter BIOS Setup',
            'Press any other key to continue...',
            '',
            'Starting ElxaOS...'
        ];
        
        this.biosSettings = this.loadBiosSettings();
        this.setupEventListeners();
    }

    // Load saved BIOS settings or use defaults
    loadBiosSettings() {
        try {
            const saved = localStorage.getItem('elxaOS-bios-settings');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Could not load BIOS settings');
        }
        
        return {
            systemName: 'ElxaOS Computer',
            cpuSpeed: '3.7',
            ramAmount: '8192',
            bootDelay: '3',
            biosPassword: '',
            soundEnabled: true,
            networkEnabled: true,
            fastBoot: false,
            bootOrder: ['HDD', 'USB', 'Network'],
            dateTime: new Date().toISOString(),
            colorScheme: 'blue'
        };
    }

    // Save BIOS settings
    saveBiosSettings() {
        try {
            localStorage.setItem('elxaOS-bios-settings', JSON.stringify(this.biosSettings));
            console.log('💾 BIOS settings saved');
        } catch (error) {
            console.warn('Could not save BIOS settings');
        }
    }

    // Set up keyboard event listeners
    setupEventListeners() {
        this.boundKeyHandler = this.handleKeyPress.bind(this);
    }

    // Handle keyboard input during boot
    handleKeyPress(event) {
        if (!this.isBooting) return;
        
        // Check for SHIFT + B combination
        if (event.shiftKey && (event.key === 'B' || event.key === 'b')) {
            event.preventDefault();
            this.bootKeyPressed = true;
            this.enterBios();
        } else if (event.key !== 'Shift') {
            // Any other key continues boot
            this.bootKeyPressed = true;
            this.continueBoot();
        }
    }

    // Start the boot sequence
    async startBoot() {
        console.log('🚀 Boot sequence starting...');
        this.isBooting = true;
        this.bootKeyPressed = false;
        this.biosAccessed = false;
        
        try {
            // Hide everything
            this.hideAllUI();
            
            // Create boot screen
            this.createBootScreen();
            
            // Add keyboard listener
            document.addEventListener('keydown', this.boundKeyHandler);
            
            // Start displaying boot messages
            await this.displayBootMessages();
            
            // If no key was pressed, continue with logo
            if (!this.bootKeyPressed) {
                await this.showElxaOSLogo();
                this.completeBoot();
            }
        } catch (error) {
            console.error('❌ Error in boot sequence:', error);
            // Fallback to login screen
            this.completeBoot();
        }
    }

    // Hide all UI elements
    hideAllUI() {
        try {
            const desktop = document.getElementById('desktop');
            const taskbar = document.querySelector('.taskbar');
            const loginScreen = document.getElementById('loginScreen');
            
            if (desktop) desktop.style.display = 'none';
            if (taskbar) taskbar.style.display = 'none';
            if (loginScreen) loginScreen.remove();
            
            console.log('🔍 UI elements hidden for boot sequence');
        } catch (error) {
            console.warn('⚠️ Error hiding UI elements:', error);
        }
    }

    // Create the boot screen
    createBootScreen() {
        // Remove any existing boot screen
        const existing = document.getElementById('bootScreen');
        if (existing) existing.remove();
        
        const bootScreen = document.createElement('div');
        bootScreen.id = 'bootScreen';
        bootScreen.className = 'boot-screen';
        
        bootScreen.innerHTML = `
            <div class="boot-content">
                <div class="boot-messages" id="bootMessages"></div>
                <div class="boot-cursor">_</div>
            </div>
        `;
        
        document.body.appendChild(bootScreen);
    }

    // Display boot messages one by one
    async displayBootMessages() {
        const messagesContainer = document.getElementById('bootMessages');
        
        for (let i = 0; i < this.bootMessages.length; i++) {
            if (this.bootKeyPressed) break;
            
            const message = this.bootMessages[i];
            const messageElement = document.createElement('div');
            messageElement.className = 'boot-message';
            messageElement.textContent = message;
            
            messagesContainer.appendChild(messageElement);
            
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            // Wait between messages (faster if fast boot enabled)
            const delay = this.biosSettings.fastBoot ? 200 : 400;
            await this.sleep(delay);
        }
        
        // Wait a bit longer for user input
        if (!this.bootKeyPressed) {
            await this.sleep(2000);
        }
    }

    // Show ElxaOS logo
    async showElxaOSLogo() {
        const bootScreen = document.getElementById('bootScreen');
        if (!bootScreen) return;
        
        bootScreen.innerHTML = `
            <div class="elxaos-logo-container">
                <div class="elxaos-logo">
                    <div class="logo-icon">🖥️</div>
                    <div class="logo-text">ElxaOS</div>
                    <div class="logo-subtitle">Starting your computer...</div>
                </div>
                <div class="loading-bar">
                    <div class="loading-fill"></div>
                </div>
            </div>
        `;
        
        // Animate loading bar
        const loadingFill = document.querySelector('.loading-fill');
        if (loadingFill) {
            loadingFill.style.width = '100%';
        }
        
        await this.sleep(3000);
    }

    // Continue boot sequence (without BIOS)
    async continueBoot() {
        document.removeEventListener('keydown', this.boundKeyHandler);
        await this.showElxaOSLogo();
        this.completeBoot();
    }

    // Complete the boot and show login
    completeBoot() {
        console.log('✅ Boot sequence complete, showing login screen');
        this.isBooting = false;
        document.removeEventListener('keydown', this.boundKeyHandler);
        
        // Remove boot screen
        const bootScreen = document.getElementById('bootScreen');
        if (bootScreen) {
            bootScreen.remove();
        }
        
        // Show login screen
        if (elxaOS && elxaOS.loginService) {
            elxaOS.loginService.showLoginScreen();
        } else {
            console.error('❌ ElxaOS or login service not available');
        }
    }

    // Enter BIOS setup
    enterBios() {
        this.biosAccessed = true;
        document.removeEventListener('keydown', this.boundKeyHandler);
        
        // Remove boot screen
        const bootScreen = document.getElementById('bootScreen');
        if (bootScreen) {
            bootScreen.remove();
        }
        
        this.showBiosInterface();
    }

    // Show BIOS interface
    showBiosInterface() {
        const biosScreen = document.createElement('div');
        biosScreen.id = 'biosScreen';
        biosScreen.className = 'bios-screen';
        
        biosScreen.innerHTML = `
            <div class="bios-container">
                <div class="bios-header">
                    <div class="bios-title">ElxaBIOS Setup Utility v3.14</div>
                    <div class="bios-subtitle">Press F10 to save and exit, ESC to exit without saving</div>
                </div>
                
                <div class="bios-content">
                    <div class="bios-tabs">
                        <div class="bios-tab active" data-tab="main">Main</div>
                        <div class="bios-tab" data-tab="advanced">Advanced</div>
                        <div class="bios-tab" data-tab="boot">Boot</div>
                        <div class="bios-tab" data-tab="fun">Fun Stuff</div>
                    </div>
                    
                    <div class="bios-panels">
                        <!-- Main Panel -->
                        <div class="bios-panel active" id="mainPanel">
                            <div class="bios-section">
                                <div class="section-title">System Information</div>
                                <div class="bios-item">
                                    <span class="item-label">System Name:</span>
                                    <input type="text" class="bios-input" id="systemName" value="${this.biosSettings.systemName}" maxlength="30">
                                </div>
                                <div class="bios-item">
                                    <span class="item-label">CPU Speed:</span>
                                    <input type="number" class="bios-input" id="cpuSpeed" value="${this.biosSettings.cpuSpeed}" min="1" max="10" step="0.1"> GHz
                                </div>
                                <div class="bios-item">
                                    <span class="item-label">RAM Amount:</span>
                                    <select class="bios-select" id="ramAmount">
                                        <option value="4096" ${this.biosSettings.ramAmount === '4096' ? 'selected' : ''}>4 GB</option>
                                        <option value="8192" ${this.biosSettings.ramAmount === '8192' ? 'selected' : ''}>8 GB</option>
                                        <option value="16384" ${this.biosSettings.ramAmount === '16384' ? 'selected' : ''}>16 GB</option>
                                        <option value="32768" ${this.biosSettings.ramAmount === '32768' ? 'selected' : ''}>32 GB</option>
                                    </select>
                                </div>
                                <div class="bios-item">
                                    <span class="item-label">Date & Time:</span>
                                    <input type="datetime-local" class="bios-input" id="dateTime" value="${new Date().toISOString().slice(0, 16)}">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Advanced Panel -->
                        <div class="bios-panel" id="advancedPanel">
                            <div class="bios-section">
                                <div class="section-title">Hardware Settings</div>
                                <div class="bios-item">
                                    <span class="item-label">Sound:</span>
                                    <select class="bios-select" id="soundEnabled">
                                        <option value="true" ${this.biosSettings.soundEnabled ? 'selected' : ''}>Enabled</option>
                                        <option value="false" ${!this.biosSettings.soundEnabled ? 'selected' : ''}>Disabled</option>
                                    </select>
                                </div>
                                <div class="bios-item">
                                    <span class="item-label">Network:</span>
                                    <select class="bios-select" id="networkEnabled">
                                        <option value="true" ${this.biosSettings.networkEnabled ? 'selected' : ''}>Enabled</option>
                                        <option value="false" ${!this.biosSettings.networkEnabled ? 'selected' : ''}>Disabled</option>
                                    </select>
                                </div>
                                <div class="bios-item">
                                    <span class="item-label">BIOS Password:</span>
                                    <input type="password" class="bios-input" id="biosPassword" value="${this.biosSettings.biosPassword}" placeholder="Leave empty for no password">
                                </div>
                                <div class="bios-item">
                                    <span class="item-label">Color Scheme:</span>
                                    <select class="bios-select" id="colorScheme">
                                        <option value="blue" ${this.biosSettings.colorScheme === 'blue' ? 'selected' : ''}>Classic Blue</option>
                                        <option value="green" ${this.biosSettings.colorScheme === 'green' ? 'selected' : ''}>Matrix Green</option>
                                        <option value="amber" ${this.biosSettings.colorScheme === 'amber' ? 'selected' : ''}>Retro Amber</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Boot Panel -->
                        <div class="bios-panel" id="bootPanel">
                            <div class="bios-section">
                                <div class="section-title">Boot Configuration</div>
                                <div class="bios-item">
                                    <span class="item-label">Fast Boot:</span>
                                    <select class="bios-select" id="fastBoot">
                                        <option value="false" ${!this.biosSettings.fastBoot ? 'selected' : ''}>Disabled (Show all messages)</option>
                                        <option value="true" ${this.biosSettings.fastBoot ? 'selected' : ''}>Enabled (Quick boot)</option>
                                    </select>
                                </div>
                                <div class="bios-item">
                                    <span class="item-label">Boot Delay:</span>
                                    <input type="number" class="bios-input" id="bootDelay" value="${this.biosSettings.bootDelay}" min="1" max="10"> seconds
                                </div>
                                <div class="bios-item">
                                    <span class="item-label">Boot Order:</span>
                                    <div class="boot-order-list" id="bootOrderList">
                                        ${this.biosSettings.bootOrder.map((device, index) => `
                                            <div class="boot-device" data-device="${device}">
                                                ${index + 1}. ${device}
                                                <button class="move-up" onclick="elxaOS.bootSystem.moveBootDevice('${device}', -1)" ${index === 0 ? 'disabled' : ''}>↑</button>
                                                <button class="move-down" onclick="elxaOS.bootSystem.moveBootDevice('${device}', 1)" ${index === this.biosSettings.bootOrder.length - 1 ? 'disabled' : ''}>↓</button>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Fun Panel -->
                        <div class="bios-panel" id="funPanel">
                            <div class="bios-section">
                                <div class="section-title">🎮 Fun Computer Stuff</div>
                                <div class="bios-item">
                                    <button class="fun-button" onclick="elxaOS.bootSystem.runCPUTest()">🔥 CPU Stress Test</button>
                                    <span class="fun-description">Make the CPU work really hard!</span>
                                </div>
                                <div class="bios-item">
                                    <button class="fun-button" onclick="elxaOS.bootSystem.runMemoryTest()">🧠 Memory Test</button>
                                    <span class="fun-description">Check if RAM is working properly</span>
                                </div>
                                <div class="bios-item">
                                    <button class="fun-button" onclick="elxaOS.bootSystem.showSystemStats()">📊 System Stats</button>
                                    <span class="fun-description">See cool computer information</span>
                                </div>
                                <div class="bios-item">
                                    <button class="fun-button" onclick="elxaOS.bootSystem.playBiosSound()">🔊 BIOS Beep Test</button>
                                    <span class="fun-description">Play the classic computer beep!</span>
                                </div>
                                <div class="bios-item">
                                    <button class="fun-button" onclick="elxaOS.bootSystem.showEasterEgg()">🥚 Secret Easter Egg</button>
                                    <span class="fun-description">Find the hidden surprise!</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="bios-footer">
                    <div class="bios-help">
                        <span>F10: Save & Exit</span>
                        <span>ESC: Exit Without Saving</span>
                        <span>F9: Reset to Defaults</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(biosScreen);
        this.setupBiosEvents();
        this.applyBiosColorScheme();
    }

    // Set up BIOS event listeners
    setupBiosEvents() {
        // Tab switching
        document.querySelectorAll('.bios-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchBiosTab(e.target.dataset.tab);
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F10') {
                e.preventDefault();
                this.saveBiosAndExit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.exitBiosWithoutSaving();
            } else if (e.key === 'F9') {
                e.preventDefault();
                this.resetBiosDefaults();
            }
        });
        
        // Color scheme change
        const colorSchemeSelect = document.getElementById('colorScheme');
        if (colorSchemeSelect) {
            colorSchemeSelect.addEventListener('change', () => {
                this.applyBiosColorScheme(colorSchemeSelect.value);
            });
        }
    }

    // Switch BIOS tabs
    switchBiosTab(tabName) {
        // Hide all panels and tabs
        document.querySelectorAll('.bios-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.bios-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        // Show selected tab and panel
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}Panel`).classList.add('active');
    }

    // Apply BIOS color scheme
    applyBiosColorScheme(scheme = null) {
        const biosScreen = document.getElementById('biosScreen');
        if (!biosScreen) return;
        
        const currentScheme = scheme || this.biosSettings.colorScheme;
        
        // Remove existing scheme classes
        biosScreen.classList.remove('blue-scheme', 'green-scheme', 'amber-scheme');
        
        // Apply new scheme
        biosScreen.classList.add(`${currentScheme}-scheme`);
    }

    // Move boot device in order
    moveBootDevice(device, direction) {
        const currentIndex = this.biosSettings.bootOrder.indexOf(device);
        const newIndex = currentIndex + direction;
        
        if (newIndex >= 0 && newIndex < this.biosSettings.bootOrder.length) {
            // Swap devices
            [this.biosSettings.bootOrder[currentIndex], this.biosSettings.bootOrder[newIndex]] = 
            [this.biosSettings.bootOrder[newIndex], this.biosSettings.bootOrder[currentIndex]];
            
            // Refresh the boot order display
            this.refreshBootOrderDisplay();
        }
    }

    // Refresh boot order display
    refreshBootOrderDisplay() {
        const bootOrderList = document.getElementById('bootOrderList');
        if (!bootOrderList) return;
        
        bootOrderList.innerHTML = this.biosSettings.bootOrder.map((device, index) => `
            <div class="boot-device" data-device="${device}">
                ${index + 1}. ${device}
                <button class="move-up" onclick="elxaOS.bootSystem.moveBootDevice('${device}', -1)" ${index === 0 ? 'disabled' : ''}>↑</button>
                <button class="move-down" onclick="elxaOS.bootSystem.moveBootDevice('${device}', 1)" ${index === this.biosSettings.bootOrder.length - 1 ? 'disabled' : ''}>↓</button>
            </div>
        `).join('');
    }

    // Fun functions for the kids!
    runCPUTest() {
        this.showTestDialog('CPU Stress Test', '🔥 Running CPU at maximum power!', [
            'CPU Core 1: 100% load',
            'CPU Core 2: 100% load', 
            'CPU Core 3: 100% load',
            'CPU Core 4: 100% load',
            'Temperature: 65°C (Safe)',
            'Performance: EXCELLENT!',
            'Your CPU is super fast! 🚀'
        ]);
    }

    runMemoryTest() {
        this.showTestDialog('Memory Test', '🧠 Testing RAM memory...', [
            'Testing address 0x00000000... OK',
            'Testing address 0x10000000... OK',
            'Testing address 0x20000000... OK',
            'Testing address 0x30000000... OK',
            'Pattern test: 0xAAAA5555... OK',
            'Random pattern test... OK',
            'All 8192 MB tested successfully! ✅'
        ]);
    }

    showSystemStats() {
        const stats = [
            `Computer Name: ${this.biosSettings.systemName}`,
            `CPU: KitKat Processor ${this.biosSettings.cpuSpeed}GHz`,
            `RAM: ${Math.round(this.biosSettings.ramAmount / 1024)} GB`,
            `Graphics: ElxaGraphics HD 2024`,
            `Storage: 1TB ElxaDrive SSD`,
            `Network: ElxaNet Gigabit`,
            `USB Ports: 4 available`,
            `Operating System: ElxaOS`,
            `Uptime: ${Math.floor(Math.random() * 100)} minutes`,
            `Temperature: ${Math.floor(Math.random() * 20) + 45}°C`
        ];
        
        this.showTestDialog('System Statistics', '📊 Your computer specs:', stats);
    }

    playBiosSound() {
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800; // Beep frequency
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            
            this.showMessage('🔊 BEEP! Classic computer sound played!', 'success');
        } catch (error) {
            this.showMessage('🔊 BEEP! (Sound not available in this browser)', 'info');
        }
    }

    showEasterEgg() {
        const easterEggs = [
            '🐱 Meow! A wild cat appeared in your computer!',
            '🦆 Quack! The DUCK Console sends its regards!',
            '🥚 You found the secret egg! You are now a certified computer expert!',
            '🎮 Achievement unlocked: BIOS Master!',
            '🌟 Fun fact: The first computer was as big as a room!',
            '🤖 Beep boop! I am a friendly computer robot!',
            '🎯 Did you know? ElxaOS was designed by someone who loves math and cats!'
        ];
        
        const randomEgg = easterEggs[Math.floor(Math.random() * easterEggs.length)];
        this.showMessage(randomEgg, 'success');
    }

    // Show test dialog with animated results
    showTestDialog(title, subtitle, results) {
        const dialog = document.createElement('div');
        dialog.className = 'test-dialog';
        dialog.innerHTML = `
            <div class="test-content">
                <div class="test-header">
                    <h3>${title}</h3>
                    <p>${subtitle}</p>
                </div>
                <div class="test-results" id="testResults"></div>
                <button onclick="this.parentElement.parentElement.remove()" class="test-close">Close</button>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Animate results
        const resultsContainer = document.getElementById('testResults');
        let index = 0;
        
        const showNextResult = () => {
            if (index < results.length) {
                const resultDiv = document.createElement('div');
                resultDiv.className = 'test-result';
                resultDiv.textContent = results[index];
                resultsContainer.appendChild(resultDiv);
                index++;
                setTimeout(showNextResult, 500);
            }
        };
        
        setTimeout(showNextResult, 500);
    }

    // Save BIOS settings and exit
    saveBiosAndExit() {
        // Collect all settings from the form
        const systemName = document.getElementById('systemName')?.value || this.biosSettings.systemName;
        const cpuSpeed = document.getElementById('cpuSpeed')?.value || this.biosSettings.cpuSpeed;
        const ramAmount = document.getElementById('ramAmount')?.value || this.biosSettings.ramAmount;
        const dateTime = document.getElementById('dateTime')?.value || this.biosSettings.dateTime;
        const soundEnabled = document.getElementById('soundEnabled')?.value === 'true';
        const networkEnabled = document.getElementById('networkEnabled')?.value === 'true';
        const biosPassword = document.getElementById('biosPassword')?.value || this.biosSettings.biosPassword;
        const colorScheme = document.getElementById('colorScheme')?.value || this.biosSettings.colorScheme;
        const fastBoot = document.getElementById('fastBoot')?.value === 'true';
        const bootDelay = document.getElementById('bootDelay')?.value || this.biosSettings.bootDelay;
        
        // Update settings
        this.biosSettings = {
            systemName,
            cpuSpeed,
            ramAmount,
            dateTime,
            soundEnabled,
            networkEnabled,
            biosPassword,
            colorScheme,
            fastBoot,
            bootDelay,
            bootOrder: this.biosSettings.bootOrder
        };
        
        // Save to storage
        this.saveBiosSettings();
        
        // Show save message
        this.showMessage('💾 BIOS settings saved successfully!', 'success');
        
        // Continue boot
        this.exitBiosAndContinue();
    }

    // Exit BIOS without saving
    exitBiosWithoutSaving() {
        this.showMessage('🚫 Exiting BIOS without saving changes', 'info');
        this.exitBiosAndContinue();
    }

    // Reset BIOS to defaults
    resetBiosDefaults() {
        if (confirm('Reset all BIOS settings to defaults?')) {
            this.biosSettings = {
                systemName: 'ElxaOS Computer',
                cpuSpeed: '3.7',
                ramAmount: '8192',
                bootDelay: '3',
                biosPassword: '',
                soundEnabled: true,
                networkEnabled: true,
                fastBoot: false,
                bootOrder: ['HDD', 'USB', 'Network'],
                dateTime: new Date().toISOString(),
                colorScheme: 'blue'
            };
            
            this.showMessage('🔄 BIOS settings reset to defaults', 'info');
            
            // Refresh the interface
            document.getElementById('biosScreen').remove();
            this.showBiosInterface();
        }
    }

    // Exit BIOS and continue boot
    exitBiosAndContinue() {
        // Remove BIOS screen
        const biosScreen = document.getElementById('biosScreen');
        if (biosScreen) {
            biosScreen.remove();
        }
        
        // Continue with boot sequence
        setTimeout(async () => {
            await this.showElxaOSLogo();
            this.completeBoot();
        }, 1000);
    }

    // Show message
    showMessage(text, type = 'info') {
        const message = document.createElement('div');
        message.className = `bios-message ${type}`;
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
            border-radius: 4px;
        `;

        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    // Utility function for delays
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // API method to start boot from shutdown
    startFromShutdown() {
        console.log('🔌 Starting boot sequence from shutdown...');
        setTimeout(() => {
            try {
                this.startBoot();
            } catch (error) {
                console.error('❌ Error starting boot from shutdown:', error);
                // Fallback to page reload
                location.reload();
            }
        }, 2000); // Wait for shutdown animation
    }
}