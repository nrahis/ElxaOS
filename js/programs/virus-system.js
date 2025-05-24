// =================================
// VIRUS SYSTEM - Core Engine
// =================================
class VirusSystem {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.infections = new Map();
        this.quarantine = new Map();
        this.virusDefinitions = new Map();
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
        });

        // Handle X key for Buggyworm
        document.addEventListener('keydown', (e) => {
            if (e.key === 'x' || e.key === 'X') {
                this.dismissBuggyworm();
            }
        });
    }

    startRandomInfections() {
        // Don't start infections if real-time protection is disabled
        if (!this.realTimeProtectionEnabled) {
            console.log('🛡️ Real-time protection disabled - no new infections will start');
            return;
        }
        
        // Randomly start with one of the viruses
        const viruses = ['buggyworm', 'veryfungame'];
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
            'C:\\Users\\Default\\AppData\\Local\\Temp\\virus.tmp'
        ];
        return locations[Math.floor(Math.random() * locations.length)];
    }

    generateRandomFileName() {
        const names = [
            'kernel32.dll', 'user32.dll', 'ntdll.dll', 'system.exe', 'explorer.exe',
            'notepad.exe', 'calc.exe', 'mspaint.exe', 'cmd.exe', 'powershell.exe',
            'chrome.exe', 'firefox.exe', 'steam.exe', 'discord.exe', 'game.exe'
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
        this.infections.clear();
        this.quarantine.clear();
        this.systemHealth = 100;
        
        // Clean up UI elements
        document.querySelectorAll('.buggyworm-overlay, .fake-installer, .malicious-popup').forEach(el => el.remove());
    }
}