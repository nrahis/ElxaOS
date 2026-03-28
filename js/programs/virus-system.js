// =================================
// VIRUS SYSTEM - Core Engine
// =================================
class VirusSystem {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.infections = new Map();
        this.quarantine = new Map();
        this.virusDefinitions = new Map();
        this.activeVirusInstances = new Map(); // Track active virus class instances
        this.isScanning = false;
        this.systemHealth = 100;
        this.lastScanTime = null;
        this.realTimeProtectionEnabled = true;
        this.enabledViruses = new Set(); // Which viruses the user is "vulnerable" to
        
        this.initializeVirusDefinitions();
        this.loadCustomViruses();
        this.loadVirusSelection();
        this.setupEventHandlers();
        
        // Start the virus system after a delay
        setTimeout(() => {
            this.startRandomInfections();
        }, 30000); // Start infections after 30 seconds
    }

    initializeVirusDefinitions() {
        // Buggyworm Virus
        this.virusDefinitions.set('buggyworm', {
            id: 'buggyworm',
            name: 'Buggyworm.A',
            type: 'image_overlay',
            severity: 'medium',
            description: 'A mischievous worm that displays random images on your desktop',
            author: 'Buggy Gang',
            discovered: new Date().toLocaleDateString(),
            symptoms: ['Random images appearing on screen', 'Desktop overlay infections'],
            removeKey: 'x',
            reinfectionTime: 45000, // 45 seconds
            images: [
                'bug1.png', 'bug2.png', 'bug3.png', 'buggy_cat.png', 
                'silly_bug.png', 'bug_dance.png'
            ],
            behavior: {
                showImage: true,
                imageSize: { width: '200px', height: '200px' },
                position: 'random',
                dismissible: true
            }
        });

        // VeryFunGame Virus
        this.virusDefinitions.set('veryfungame', {
            id: 'veryfungame',
            name: 'VeryFunGame.Trojan',
            type: 'fake_installer',
            severity: 'high',
            description: 'A trojan disguised as a game installer',
            author: 'colten14',
            discovered: new Date().toLocaleDateString(),
            symptoms: ['Fake installer popups', 'System password threats', 'Persistent notifications'],
            reinfectionTime: 60000, // 60 seconds
            behavior: {
                showInstaller: true,
                installerTitle: 'VeryFunGame Setup',
                installerMessage: 'Install the most fun game ever created!',
                maliciousMessages: [
                    'Changing your password to: IAmVeryStupid',
                    'Installing 47 viruses...',
                    'Deleting your homework folder...',
                    'Sending embarrassing emails to your friends...',
                    'Converting all your music to baby shark remixes...',
                    'Replacing all your photos with pictures of vegetables...'
                ],
                popupInterval: 3000 // 3 seconds between malicious popups
            }
        });

        // Lebron James Word Scrambler Virus
        this.virusDefinitions.set('lebron-james-scrambler', {
            id: 'lebron-james-scrambler',
            name: 'Lebron James Word Scrambler Supreme',
            type: 'text_scrambler',
            severity: 'medium',
            description: 'Randomly injects "LEBRON JAMES" into text and scrambles words with sus energy',
            author: 'Colten (age 10)',
            discovered: new Date().toLocaleDateString(),
            symptoms: ['Text replaced with LEBRON JAMES', 'Sus and Among Us references', 'Basketball popups', 'Typing interference'],
            reinfectionTime: 20000, // 20 seconds (because Colten is persistent)
            images: [
                'lebron-face.jpg', 'lebron-dunking.gif', 'basketball.png', 'lakers-logo.png'
            ],
            behavior: {
                scrambleText: true,
                showPopups: true,
                interceptTyping: true,
                popupInterval: 15000, // 15-30 seconds between popups
                lebronPhrases: [
                    "LEBRON JAMES",
                    "THE KING LEBRON JAMES", 
                    "LEBRON JAMES IS HERE",
                    "LEBRON JAMES SAYS HI",
                    "LEBRON JAMES APPROVED",
                    "LEBRON JAMES MOMENT",
                    "LEBRON JAMES ENTERED THE CHAT"
                ]
            }
        });

        // Roblox Horror Jumpscare Virus  
        this.virusDefinitions.set('roblox-horror-jumpscare', {
            id: 'roblox-horror-jumpscare',
            name: 'Roblox Horror Jumpscare',
            type: 'horror_jumpscare',
            severity: 'medium',
            description: 'Displays scary Roblox-themed jumpscares and death screens',
            author: 'Buggy (age 14)',
            discovered: new Date().toLocaleDateString(),
            symptoms: ['Random horror jumpscares', 'Fake death screens', 'OOF sound effects', 'Spooky popups'],
            reinfectionTime: 25000, // 25 seconds (Buggy loves to scare!)
            images: [
                'jumpscare1.png', 'jumpscare2.png', 'jumpscare3.png', 'youdied.png'
            ],
            behavior: {
                showJumpscares: true,
                showDeathScreens: true,
                playOofSounds: true,
                jumpscareInterval: 15000, // 10-25 seconds between scares
                deathScreenInterval: 45000 // 30-60 seconds between deaths
            }
        });
    }

    setupEventHandlers() {
        this.eventBus.on('antivirus.scan', () => {
            this.performFullScan();
        });

        this.eventBus.on('antivirus.quarantine', (data) => {
            this.quarantineVirus(data.virusId);
        });

        this.eventBus.on('virus.dismiss', (data) => {
            this.handleVirusDismiss(data.virusId);
        });

        this.eventBus.on('antivirus.realtime.toggle', (data) => {
            this.realTimeProtectionEnabled = data.enabled;
            console.log(`🛡️ Real-time protection ${data.enabled ? 'enabled' : 'disabled'}`);
            
            // If protection was just disabled, start the infection cycle
            if (!data.enabled) {
                console.log('🦠 Starting infection cycle since protection was disabled');
                this.startRandomInfections();
            }
        });

        // Refresh custom virus definitions when Virus Lab saves
        this.eventBus.on('viruslab.virus.saved', () => {
            this.loadCustomViruses();
            this.eventBus.emit('virus.definitions.changed');
        });

        this.eventBus.on('viruslab.virus.deleted', () => {
            this.loadCustomViruses();
            this.eventBus.emit('virus.definitions.changed');
        });

        // Handle X key for Buggyworm
        document.addEventListener('keydown', (e) => {
            if (e.key === 'x' || e.key === 'X') {
                this.dismissBuggyworm();
            }
        });
    }

    startRandomInfections() {
        // Don't start infections if real-time protection is enabled
        if (this.realTimeProtectionEnabled) {
            console.log('🛡️ Real-time protection enabled - no new infections will start');
            return;
        }
        
        // Only pick from enabled viruses
        const candidates = Array.from(this.enabledViruses).filter(id => 
            this.virusDefinitions.has(id) && !this.infections.has(id) && !this.quarantine.has(id)
        );
        
        if (candidates.length === 0) {
            console.log('🦠 No eligible viruses to infect with (none enabled or all active/quarantined)');
            return;
        }
        
        const randomVirus = candidates[Math.floor(Math.random() * candidates.length)];
        
        setTimeout(() => {
            this.infectSystem(randomVirus);
        }, Math.random() * 20000 + 10000); // 10-30 seconds
    }

    infectSystem(virusId, debugMode = false) {
        // Don't allow new infections if real-time protection is enabled (unless debug mode)
        if (this.realTimeProtectionEnabled && !debugMode) {
            console.log('🛡️ Real-time protection blocked infection attempt');
            return;
        }
        
        if (this.infections.has(virusId) || this.quarantine.has(virusId)) {
            return; // Already infected or quarantined
        }

        const virusDef = this.virusDefinitions.get(virusId);
        if (!virusDef) return;

        console.log(`🦠 System infected with ${virusDef.name}`);
        
        const infection = {
            id: virusId,
            definition: virusDef,
            infectedAt: Date.now(),
            active: true,
            dismissed: false
        };

        this.infections.set(virusId, infection);
        this.systemHealth = Math.max(0, this.systemHealth - 15);
        
        // Trigger virus behavior
        this.activateVirus(virusId);
        
        // Notify antivirus if running
        this.eventBus.emit('virus.detected', {
            virusId: virusId,
            virusName: virusDef.name,
            severity: virusDef.severity
        });
    }

    activateVirus(virusId) {
        const infection = this.infections.get(virusId);
        if (!infection || !infection.active) return;

        const virusDef = infection.definition;

        // Custom viruses from Virus Lab
        if (virusDef.custom) {
            this.activateCustomVirus(virusId, virusDef);
            return;
        }

        switch (virusDef.type) {
            case 'image_overlay':
                this.showBuggywormImage();
                break;
            case 'fake_installer':
                this.showFakeInstaller();
                break;
            case 'text_scrambler':
                this.activateLebronJamesVirus();
                break;
            case 'horror_jumpscare':
                this.activateRobloxHorrorVirus();
                break;
        }
    }

    // NEW: Activate Lebron James virus
    activateLebronJamesVirus() {
        // Import and create the Lebron James virus instance
        // You'll need to make sure lebron-james-virus.js is loaded
        if (typeof LebronJamesWordScramblerVirus !== 'undefined') {
            const lebronVirus = new LebronJamesWordScramblerVirus();
            lebronVirus.activate();
            this.activeVirusInstances.set('lebron-james-scrambler', lebronVirus);
            console.log('🏀 LEBRON JAMES VIRUS ACTIVATED! 🏀');
        } else {
            console.error('LebronJamesWordScramblerVirus class not found - make sure lebron-james-virus.js is loaded');
        }
    }

    activateRobloxHorrorVirus() {
        // Import and create the Roblox Horror virus instance
        if (typeof RobloxHorrorJumpscareVirus !== 'undefined') {
            const horrorVirus = new RobloxHorrorJumpscareVirus();
            horrorVirus.activate();
            this.activeVirusInstances.set('roblox-horror-jumpscare', horrorVirus);
            console.log('👻 ROBLOX HORROR VIRUS ACTIVATED BY BUGGY! 👻');
        } else {
            console.error('RobloxHorrorJumpscareVirus class not found - make sure roblox-jumpscare-virus.js is loaded');
        }
    }

    showBuggywormImage() {
        // Remove any existing buggyworm overlays
        const existing = document.querySelector('.buggyworm-overlay');
        if (existing) existing.remove();

        const virusDef = this.virusDefinitions.get('buggyworm');
        const randomImage = virusDef.images[Math.floor(Math.random() * virusDef.images.length)];

        const overlay = document.createElement('div');
        overlay.className = 'buggyworm-overlay';
        overlay.innerHTML = `
            <div class="virus-image">
                <img src="assets/virus/${randomImage}" alt="Buggyworm" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmY2NmNjIi8+PHRleHQgeD0iNTAlIiB5PSI0MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+QmzwvdGV4dD48dGV4dCB4PSI1MCUiIHk9IjYwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjMzMzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5CdWdneXdvcm08L3RleHQ+PC9zdmc+'" />
                <div class="virus-label">
                    🐛 Buggyworm detected!<br>
                    <small>Press X to dismiss</small>
                </div>
            </div>
        `;

        // Random position
        const maxX = window.innerWidth - 250;
        const maxY = window.innerHeight - 250;
        const x = Math.random() * maxX;
        const y = Math.random() * maxY;

        overlay.style.left = x + 'px';
        overlay.style.top = y + 'px';

        document.body.appendChild(overlay);

        // Add wiggle animation
        setTimeout(() => {
            overlay.classList.add('wiggle');
        }, 500);
    }

    showFakeInstaller() {
        // Check if installer is already showing
        if (document.querySelector('.fake-installer')) return;

        const virusDef = this.virusDefinitions.get('veryfungame');
        
        const installer = document.createElement('div');
        installer.className = 'fake-installer system-dialog';
        installer.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <div class="dialog-title">🎮 ${virusDef.behavior.installerTitle}</div>
                    <div class="dialog-close">×</div>
                </div>
                <div class="dialog-body">
                    <div class="installer-content">
                        <div class="installer-icon">🎮</div>
                        <div class="installer-info">
                            <h3>VeryFunGame v2.0</h3>
                            <p>${virusDef.behavior.installerMessage}</p>
                            <div class="fake-details">
                                <div>📅 Released: Today</div>
                                <div>👤 Author: colten14</div>
                                <div>⭐ Rating: 5/5 stars</div>
                                <div>📦 Size: 1.337 GB</div>
                            </div>
                        </div>
                    </div>
                    <div class="installer-buttons">
                        <button class="install-virus-btn">Install Now!</button>
                        <button class="cancel-virus-btn">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(installer);

        // Event handlers
        installer.querySelector('.dialog-close').addEventListener('click', () => {
            this.dismissFakeInstaller();
        });

        installer.querySelector('.cancel-virus-btn').addEventListener('click', () => {
            this.dismissFakeInstaller();
        });

        installer.querySelector('.install-virus-btn').addEventListener('click', () => {
            this.triggerMaliciousBehavior();
        });
    }

    dismissFakeInstaller() {
        const installer = document.querySelector('.fake-installer');
        if (installer) {
            installer.remove();
            
            // Schedule reappearance if still actively infecting (not quarantined)
            // NOTE: Don't gate on realTimeProtectionEnabled here — the virus is
            // already active. Protection only blocks NEW infections.
            const infection = this.infections.get('veryfungame');
            if (infection && infection.active) {
                infection.dismissed = true;
                setTimeout(() => {
                    if (this.infections.has('veryfungame') && this.infections.get('veryfungame').active) {
                        this.showFakeInstaller();
                    }
                }, this.virusDefinitions.get('veryfungame').reinfectionTime);
            }
        }
    }

    triggerMaliciousBehavior() {
        // Remove installer
        this.dismissFakeInstaller();
        
        const virusDef = this.virusDefinitions.get('veryfungame');
        let popupCount = 0;
        const maxPopups = 8;

        const showMaliciousPopup = () => {
            if (popupCount >= maxPopups) return;
            if (!this.infections.has('veryfungame') || !this.infections.get('veryfungame').active) return;

            const messages = virusDef.behavior.maliciousMessages;
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];

            const popup = document.createElement('div');
            popup.className = 'malicious-popup system-dialog';
            popup.innerHTML = `
                <div class="dialog-content warning">
                    <div class="dialog-header">
                        <div class="dialog-title">⚠️ System Alert</div>
                        <div class="dialog-close">×</div>
                    </div>
                    <div class="dialog-body">
                        <div class="warning-content">
                            <div class="warning-icon">💀</div>
                            <div class="warning-message">${randomMessage}</div>
                            <div class="progress-bar">
                                <div class="progress-fill"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Random position
            const x = Math.random() * (window.innerWidth - 300);
            const y = Math.random() * (window.innerHeight - 200);
            popup.style.left = x + 'px';
            popup.style.top = y + 'px';

            document.body.appendChild(popup);

            // Animate progress bar
            const progressFill = popup.querySelector('.progress-fill');
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(progressInterval);
                }
                progressFill.style.width = progress + '%';
            }, 200);

            // Close handler
            popup.querySelector('.dialog-close').addEventListener('click', () => {
                popup.remove();
                clearInterval(progressInterval);
            });

            popupCount++;
            
            // Schedule next popup
            if (popupCount < maxPopups) {
                setTimeout(showMaliciousPopup, virusDef.behavior.popupInterval);
            }
        };

        showMaliciousPopup();
    }

    dismissBuggyworm() {
        const overlay = document.querySelector('.buggyworm-overlay');
        if (overlay) {
            overlay.remove();
            
            // Schedule reappearance if still actively infecting (not quarantined)
            // NOTE: Don't gate on realTimeProtectionEnabled here — the virus is
            // already active. Protection only blocks NEW infections.
            const infection = this.infections.get('buggyworm');
            if (infection && infection.active) {
                infection.dismissed = true;
                setTimeout(() => {
                    if (this.infections.has('buggyworm') && this.infections.get('buggyworm').active) {
                        this.showBuggywormImage();
                    }
                }, this.virusDefinitions.get('buggyworm').reinfectionTime);
            }
        }
    }

    performFullScan() {
        if (this.isScanning) return;
        
        this.isScanning = true;
        this.lastScanTime = new Date();
        
        return new Promise((resolve) => {
            const results = {
                totalFiles: Math.floor(Math.random() * 50000) + 10000,
                scannedFiles: 0,
                threatsFound: [],
                cleanFiles: 0,
                scanTime: 0,
                virusesDetected: Array.from(this.infections.values()).filter(i => i.active)
            };

            // Add current infections to threats
            this.infections.forEach((infection, id) => {
                if (infection.active) {
                    results.threatsFound.push({
                        id: id,
                        name: infection.definition.name,
                        type: infection.definition.type,
                        severity: infection.definition.severity,
                        location: this.generateFakeLocation(),
                        description: infection.definition.description
                    });
                }
            });

            // Simulate scan progress
            const scanInterval = setInterval(() => {
                results.scannedFiles += Math.floor(Math.random() * 1000) + 100;
                
                this.eventBus.emit('antivirus.scan.progress', {
                    progress: Math.min(100, (results.scannedFiles / results.totalFiles) * 100),
                    currentFile: this.generateRandomFileName(),
                    scannedFiles: results.scannedFiles,
                    totalFiles: results.totalFiles
                });

                if (results.scannedFiles >= results.totalFiles) {
                    clearInterval(scanInterval);
                    results.cleanFiles = results.totalFiles - results.threatsFound.length;
                    results.scanTime = Math.floor(Math.random() * 30) + 10; // 10-40 seconds
                    this.isScanning = false;
                    
                    this.eventBus.emit('antivirus.scan.complete', results);
                    resolve(results);
                }
            }, 50);
        });
    }

    quarantineVirus(virusId) {
        const infection = this.infections.get(virusId);
        if (!infection) return false;

        console.log(`🔒 Quarantining ${infection.definition.name}`);
        
        // Deactivate virus-specific instances
        if (this.activeVirusInstances.has(virusId)) {
            const virusInstance = this.activeVirusInstances.get(virusId);
            if (typeof virusInstance.deactivate === 'function') {
                virusInstance.deactivate();
            }
            this.activeVirusInstances.delete(virusId);
        }
        
        // Move to quarantine
        this.quarantine.set(virusId, {
            ...infection,
            quarantinedAt: Date.now(),
            active: false
        });

        // Remove from active infections
        this.infections.delete(virusId);

        // Clean up virus effects
        if (virusId === 'buggyworm') {
            const overlay = document.querySelector('.buggyworm-overlay');
            if (overlay) overlay.remove();
        } else if (virusId === 'veryfungame') {
            const installer = document.querySelector('.fake-installer');
            if (installer) installer.remove();
            
            // Clean up malicious popups
            document.querySelectorAll('.malicious-popup').forEach(popup => popup.remove());
        } else if (virusId === 'lebron-james-scrambler') {
            // Clean up Lebron James effects
            document.querySelectorAll('.lebron-popup').forEach(popup => popup.remove());
        } else if (virusId === 'roblox-horror-jumpscare') {
            // Clean up horror effects
            document.querySelectorAll('.roblox-jumpscare, .roblox-death-screen').forEach(el => el.remove());
        }

        // Clean up custom virus effects
        document.querySelectorAll(`.custom-virus-effect[data-virus-id="${virusId}"]`).forEach(el => el.remove());

        // Clean up custom virus message interval if running
        const intervalKey = virusId + '-interval';
        if (this.activeVirusInstances.has(intervalKey)) {
            clearInterval(this.activeVirusInstances.get(intervalKey));
            this.activeVirusInstances.delete(intervalKey);
        }

        // Improve system health
        this.systemHealth = Math.min(100, this.systemHealth + 20);

        this.eventBus.emit('virus.quarantined', {
            virusId: virusId,
            virusName: infection.definition.name
        });

        return true;
    }

    generateFakeLocation() {
        const locations = [
            'C:\\Windows\\System32\\drivers\\etc\\hosts',
            'C:\\Program Files\\Common Files\\microsoft shared\\ink\\evil.exe',
            'C:\\Users\\Public\\Documents\\temp\\suspicious.dll',
            'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\badfile.exe',
            'C:\\Windows\\Temp\\downloaded_fun_game.exe',
            'C:\\Users\\Default\\AppData\\Local\\Temp\\virus.tmp',
            'C:\\System32\\lebron_james_infiltrator.exe',
            'C:\\Users\\Kit\\Documents\\sus_among_us.dll',
            'C:\\Games\\RobloxPlayerBeta.exe',
            'C:\\Users\\Kit\\Desktop\\ScaryGame.rbxl',
            'C:\\Temp\\jumpscare_loader.dll',
            'C:\\System32\\oof_sound_hijacker.exe'
        ];
        return locations[Math.floor(Math.random() * locations.length)];
    }

    generateRandomFileName() {
        const names = [
            'kernel32.dll', 'user32.dll', 'ntdll.dll', 'system.exe', 'explorer.exe',
            'notepad.exe', 'calc.exe', 'mspaint.exe', 'cmd.exe', 'powershell.exe',
            'chrome.exe', 'firefox.exe', 'steam.exe', 'discord.exe', 'game.exe',
            'lebron_james.exe', 'basketball.dll', 'sus_imposter.exe'
        ];
        return names[Math.floor(Math.random() * names.length)];
    }

    getSystemStatus() {
        return {
            health: this.systemHealth,
            activeInfections: this.infections.size,
            quarantinedThreats: this.quarantine.size,
            lastScanTime: this.lastScanTime,
            isScanning: this.isScanning
        };
    }

    // Method to manually trigger infections for testing
    debugInfect(virusId) {
        // Pass true as second parameter to bypass real-time protection
        this.infectSystem(virusId, true);
    }

    // Method to clear all infections (for testing)
    debugClearAll() {
        // Deactivate all active virus instances
        this.activeVirusInstances.forEach((virusInstance, key) => {
            if (typeof virusInstance === 'number') {
                // It's a setInterval ID (e.g. custom virus message interval)
                clearInterval(virusInstance);
            } else if (typeof virusInstance.deactivate === 'function') {
                virusInstance.deactivate();
            }
        });
        this.activeVirusInstances.clear();
        
        this.infections.clear();
        this.quarantine.clear();
        this.systemHealth = 100;
        
        // Clean up UI elements
        document.querySelectorAll('.buggyworm-overlay, .fake-installer, .malicious-popup, .lebron-popup, .roblox-jumpscare, .roblox-death-screen, .custom-virus-effect').forEach(el => el.remove());
    }

    // =================================
    // VIRUS SELECTION (user picks vulnerability)
    // =================================
    loadVirusSelection() {
        try {
            const saved = localStorage.getItem('elxaOS-virus-selection');
            if (saved) {
                this.enabledViruses = new Set(JSON.parse(saved));
            } else {
                // Default: all built-in viruses enabled
                this.enabledViruses = new Set([
                    'buggyworm', 'veryfungame', 'lebron-james-scrambler', 'roblox-horror-jumpscare'
                ]);
            }
        } catch (error) {
            console.error('💾 Failed to load virus selection:', error);
            this.enabledViruses = new Set([
                'buggyworm', 'veryfungame', 'lebron-james-scrambler', 'roblox-horror-jumpscare'
            ]);
        }
    }

    saveVirusSelection() {
        try {
            localStorage.setItem('elxaOS-virus-selection', JSON.stringify(Array.from(this.enabledViruses)));
        } catch (error) {
            console.error('💾 Failed to save virus selection:', error);
        }
    }

    setVirusEnabled(virusId, enabled) {
        if (enabled) {
            this.enabledViruses.add(virusId);
        } else {
            this.enabledViruses.delete(virusId);
        }
        this.saveVirusSelection();
    }

    isVirusEnabled(virusId) {
        return this.enabledViruses.has(virusId);
    }

    // =================================
    // CUSTOM VIRUS INTEGRATION (Virus Lab bridge)
    // =================================
    loadCustomViruses() {
        try {
            const saved = localStorage.getItem('viruslab-saved-viruses');
            if (!saved) return;

            const virusEntries = JSON.parse(saved);

            // Track which custom IDs we see so we can clean up stale ones
            const currentCustomIds = new Set();

            for (const [id, data] of virusEntries) {
                const customId = `custom-${id}`;
                currentCustomIds.add(customId);

                // Don't overwrite if already registered (avoid resetting mid-infection)
                if (this.virusDefinitions.has(customId)) continue;

                this.virusDefinitions.set(customId, {
                    id: customId,
                    name: data.name || 'Custom Virus',
                    type: data.type || 'popup',
                    severity: data.severity || 'medium',
                    description: data.description || 'A custom virus from the Virus Lab',
                    author: data.author || 'Anonymous Hacker',
                    discovered: data.created ? new Date(data.created).toLocaleDateString() : new Date().toLocaleDateString(),
                    symptoms: this.getCustomVirusSymptoms(data.type),
                    reinfectionTime: 30000,
                    custom: true,
                    labData: data // Keep full Virus Lab data for activation
                });
            }

            // Remove definitions for custom viruses that were deleted in Virus Lab
            // (only if not currently infecting or quarantined)
            for (const [defId, def] of this.virusDefinitions) {
                if (def.custom && !currentCustomIds.has(defId)
                    && !this.infections.has(defId) && !this.quarantine.has(defId)) {
                    this.virusDefinitions.delete(defId);
                    this.enabledViruses.delete(defId);
                }
            }

            console.log(`🧪 Loaded ${currentCustomIds.size} custom virus definition(s) from Virus Lab`);
        } catch (error) {
            console.error('🧪 Failed to load custom viruses:', error);
        }
    }

    getCustomVirusSymptoms(type) {
        switch (type) {
            case 'image':   return ['Random images appearing on screen'];
            case 'popup':   return ['Annoying popup windows'];
            case 'message': return ['Strange messages on screen'];
            case 'screen':  return ['Full-screen takeover effects'];
            default:        return ['Unknown symptoms'];
        }
    }

    // Helper: get icon for custom virus type (mirrors Virus Lab's getVirusIcon)
    getCustomVirusIcon(type) {
        const iconMap = {
            'image': 'image-multiple',
            'popup': 'alert-decagram',
            'message': 'message-flash',
            'screen': 'television'
        };
        return ElxaIcons.renderAction(iconMap[type] || 'biohazard');
    }

    activateCustomVirus(virusId, virusDef) {
        const labData = virusDef.labData;
        if (!labData) return;

        console.log(`🧪 Activating custom virus: ${virusDef.name}`);

        // Create the effect container (uses same wrapper as Virus Lab test effects)
        const effect = document.createElement('div');
        effect.className = 'custom-virus-effect';
        effect.dataset.virusId = virusId;

        switch (labData.type) {
            case 'image':
                this.showCustomImageVirus(effect, virusId, labData);
                break;
            case 'popup':
                this.showCustomPopupVirus(effect, virusId, labData);
                break;
            case 'message':
                this.showCustomMessageVirus(effect, virusId, labData);
                break;
            case 'screen':
                this.showCustomScreenVirus(effect, virusId, labData);
                break;
        }

        document.body.appendChild(effect);
    }

    // Image Bomber — cascading image popups (mirrors Virus Lab's createImageEffect)
    showCustomImageVirus(effect, virusId, labData) {
        const images = labData.images && labData.images.length > 0
            ? labData.images
            : ['hack1.png'];

        let imageCount = 0;
        const maxImages = Math.min(images.length * 2, 6);
        const color = labData.color || '#ff0000';

        const showRandomImage = () => {
            if (imageCount >= maxImages) return;
            if (!this.infections.has(virusId) || !this.infections.get(virusId).active) return;

            const randomImage = images[Math.floor(Math.random() * images.length)];
            const imageElement = document.createElement('div');
            imageElement.className = 'vlab-test-image-popup';
            imageElement.innerHTML = `
                <div class="vlab-test-image-overlay" style="border-color: ${color};">
                    <div class="vlab-test-image-content">
                        <img src="assets/hack/${randomImage}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                        <div class="vlab-image-fallback" style="display:none;">
                            <div class="vlab-fallback-icon">${this.getCustomVirusIcon(labData.type)}</div>
                            <div class="vlab-fallback-text">${labData.name}</div>
                        </div>
                        <div class="vlab-test-label" style="background: ${color};">
                            ${labData.name}
                        </div>
                        <button class="vlab-image-close-btn" style="background: ${color};">${ElxaIcons.renderAction('close')}</button>
                    </div>
                </div>
            `;

            const x = Math.random() * (window.innerWidth - 300);
            const y = Math.random() * (window.innerHeight - 300);
            imageElement.style.position = 'fixed';
            imageElement.style.left = x + 'px';
            imageElement.style.top = y + 'px';
            imageElement.style.zIndex = '5000';

            effect.appendChild(imageElement);

            imageElement.querySelector('.vlab-image-close-btn').addEventListener('click', () => {
                imageElement.remove();
            });

            // Auto-dismiss individual images
            setTimeout(() => {
                if (imageElement.parentNode) imageElement.remove();
            }, Math.random() * 8000 + 5000);

            imageCount++;
            if (imageCount < maxImages) {
                setTimeout(showRandomImage, Math.random() * 3000 + 2000);
            } else {
                // All images done — schedule reinfection
                setTimeout(() => {
                    this.scheduleCustomVirusReinfection(virusId, labData);
                }, 10000);
            }
        };

        showRandomImage();
    }

    // Popup Storm — cascading popup windows (mirrors Virus Lab's createPopupEffect)
    showCustomPopupVirus(effect, virusId, labData) {
        const messages = labData.customMessages && labData.customMessages.length > 0
            ? labData.customMessages
            : [
                `${labData.target || 'You'}, you've been hacked by ${labData.author}!`,
                `The ${labData.name} virus is taking over!`,
                'Your computer belongs to me now!'
            ];
        const color = labData.color || '#ff0000';

        let popupCount = 0;
        const maxPopups = Math.min(messages.length * 2, 8);

        const showPopup = () => {
            if (popupCount >= maxPopups) return;
            if (!this.infections.has(virusId) || !this.infections.get(virusId).active) return;

            const popup = document.createElement('div');
            popup.className = 'vlab-test-popup';
            popup.innerHTML = `
                <div class="vlab-popup-content" style="border-color: ${color};">
                    <div class="vlab-popup-header" style="background: ${color};">
                        <span>${ElxaIcons.renderAction('skull')} ${labData.name}</span>
                        <button class="vlab-popup-close">${ElxaIcons.renderAction('close')}</button>
                    </div>
                    <div class="vlab-popup-body">
                        <div class="vlab-popup-icon">${this.getCustomVirusIcon(labData.type)}</div>
                        <div class="vlab-popup-message">${messages[popupCount % messages.length]}</div>
                    </div>
                </div>
            `;

            const x = Math.random() * (window.innerWidth - 350);
            const y = Math.random() * (window.innerHeight - 200);
            popup.style.left = x + 'px';
            popup.style.top = y + 'px';

            effect.appendChild(popup);

            popup.querySelector('.vlab-popup-close').addEventListener('click', () => {
                popup.remove();
            });

            popupCount++;
            if (popupCount < maxPopups) {
                setTimeout(showPopup, 2000);
            } else {
                // All popups done — schedule reinfection
                setTimeout(() => {
                    // Clean up remaining popups
                    effect.querySelectorAll('.vlab-test-popup').forEach(p => p.remove());
                    this.scheduleCustomVirusReinfection(virusId, labData);
                }, 8000);
            }
        };

        showPopup();
    }

    // Message Spammer — full-width banner with cycling messages (mirrors Virus Lab's createMessageEffect)
    showCustomMessageVirus(effect, virusId, labData) {
        const messages = labData.customMessages && labData.customMessages.length > 0
            ? labData.customMessages
            : [
                `Message from ${labData.author}: You've been pranked!`,
                `${labData.name} says: ${labData.description}`,
                'This message will self-destruct in 5 seconds...'
            ];
        const color = labData.color || '#ff0000';

        effect.innerHTML = `
            <div class="vlab-test-message-banner" style="background: ${color};">
                <div class="vlab-message-content">
                    <div class="vlab-message-icon">${this.getCustomVirusIcon(labData.type)}</div>
                    <div class="vlab-message-text"></div>
                </div>
            </div>
        `;

        const messageText = effect.querySelector('.vlab-message-text');
        let messageIndex = 0;
        let cycleCount = 0;
        const maxCycles = messages.length * 3;

        const cycleMessages = () => {
            if (messageText) messageText.textContent = messages[messageIndex % messages.length];
            messageIndex++;
        };
        cycleMessages();

        const messageInterval = setInterval(() => {
            cycleCount++;
            if (cycleCount < maxCycles && this.infections.has(virusId) && this.infections.get(virusId).active) {
                cycleMessages();
            } else {
                clearInterval(messageInterval);
                // Remove banner and schedule reinfection
                const banner = effect.querySelector('.vlab-test-message-banner');
                if (banner) banner.remove();
                this.scheduleCustomVirusReinfection(virusId, labData);
            }
        }, 3000);

        // Store interval for cleanup if quarantined mid-cycle
        this.activeVirusInstances.set(virusId + '-interval', messageInterval);
    }

    // Screen Effect — fullscreen overlay with glitch text (mirrors Virus Lab's createScreenEffect)
    showCustomScreenVirus(effect, virusId, labData) {
        const color = labData.color || '#ff0000';

        effect.innerHTML = `
            <div class="vlab-test-screen-effect" style="background: linear-gradient(45deg, ${color}33, transparent); pointer-events: auto; cursor: pointer;">
                <div class="vlab-effect-content">
                    <div class="vlab-glitch-text" style="color: ${color};">
                        ${(labData.name || 'VIRUS').toUpperCase()}
                    </div>
                    <div class="vlab-effect-subtitle">
                        Created by ${labData.author || 'Anonymous Hacker'}
                    </div>
                    <div style="color: #888; font-size: 12px; margin-top: 12px;">Click anywhere to dismiss</div>
                </div>
            </div>
        `;

        // Start glitch animation
        setTimeout(() => {
            effect.querySelector('.vlab-glitch-text')?.classList.add('vlab-glitch-animation');
        }, 500);

        // Click anywhere to dismiss
        effect.querySelector('.vlab-test-screen-effect').addEventListener('click', () => {
            effect.innerHTML = '';
            this.scheduleCustomVirusReinfection(virusId, labData);
        });
    }

    scheduleCustomVirusReinfection(virusId, labData) {
        const infection = this.infections.get(virusId);
        if (infection && infection.active) {
            infection.dismissed = true;
            const reinfectionTime = 30000; // 30 seconds for custom viruses
            setTimeout(() => {
                if (this.infections.has(virusId) && this.infections.get(virusId).active) {
                    this.activateCustomVirus(virusId, this.virusDefinitions.get(virusId));
                }
            }, reinfectionTime);
        }
    }
}