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
        
        this.initializeVirusDefinitions();
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
        
        // Randomly start with one of the viruses
        const viruses = ['buggyworm', 'veryfungame', 'lebron-james-scrambler', 'roblox-horror-jumpscare'];
        const randomVirus = viruses[Math.floor(Math.random() * viruses.length)];
        
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
            
            // Schedule reappearance if not quarantined AND real-time protection is disabled
            const infection = this.infections.get('veryfungame');
            if (infection && infection.active && !this.realTimeProtectionEnabled) {
                infection.dismissed = true;
                setTimeout(() => {
                    if (this.infections.has('veryfungame') && this.infections.get('veryfungame').active && !this.realTimeProtectionEnabled) {
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
            
            // Schedule reappearance if not quarantined AND real-time protection is disabled
            const infection = this.infections.get('buggyworm');
            if (infection && infection.active && !this.realTimeProtectionEnabled) {
                infection.dismissed = true;
                setTimeout(() => {
                    if (this.infections.has('buggyworm') && this.infections.get('buggyworm').active && !this.realTimeProtectionEnabled) {
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
        this.activeVirusInstances.forEach((virusInstance, virusId) => {
            if (typeof virusInstance.deactivate === 'function') {
                virusInstance.deactivate();
            }
        });
        this.activeVirusInstances.clear();
        
        this.infections.clear();
        this.quarantine.clear();
        this.systemHealth = 100;
        
        // Clean up UI elements
        document.querySelectorAll('.buggyworm-overlay, .fake-installer, .malicious-popup, .lebron-popup, .roblox-jumpscare, .roblox-death-screen').forEach(el => el.remove());
    }
}