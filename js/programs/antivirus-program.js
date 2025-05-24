// =================================
// ELXAGUARD ANTIVIRUS PROGRAM - FIXED
// =================================
class AntivirusProgram {
    constructor(windowManager, fileSystem, eventBus) {
        this.windowManager = windowManager;
        this.fileSystem = fileSystem;
        this.eventBus = eventBus;
        this.currentWindowId = null;
        this.isScanning = false;
        this.scanResults = null;
        this.realTimeProtection = true;
        
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // Listen for virus detection
        this.eventBus.on('virus.detected', (data) => {
            this.showVirusAlert(data);
        });

        // Listen for scan progress
        this.eventBus.on('antivirus.scan.progress', (data) => {
            this.updateScanProgress(data);
        });

        // Listen for scan completion
        this.eventBus.on('antivirus.scan.complete', (data) => {
            this.handleScanComplete(data);
        });

        // Listen for virus quarantine
        this.eventBus.on('virus.quarantined', (data) => {
            this.handleVirusQuarantined(data);
        });
    }

    launch() {
        const windowId = `antivirus-${Date.now()}`;
        this.currentWindowId = windowId;
        
        const windowContent = this.createAntivirusInterface(windowId);
        
        const window = this.windowManager.createWindow(
            windowId,
            '🛡️ ElxaGuard Antivirus Pro',
            windowContent,
            { width: '700px', height: '500px', x: '150px', y: '100px' }
        );
        
        // Setup event handlers after window is created and DOM is ready
        setTimeout(() => {
            this.setupWindowEventHandlers(windowId);
            this.updateSystemStatus();
        }, 500);
        
        return windowId;
    }

    createAntivirusInterface(windowId) {
        return `
            <div class="antivirus-container" data-window-id="${windowId}">
                <!-- Header Section -->
                <div class="antivirus-header">
                    <div class="antivirus-logo">
                        <div class="shield-icon">🛡️</div>
                        <div class="product-info">
                            <h2>ElxaGuard Pro</h2>
                            <span class="version">Version 2025.1.0</span>
                        </div>
                    </div>
                    <div class="system-status">
                        <div class="status-indicator" id="status-light-${windowId}">🟢</div>
                        <div class="status-text" id="status-text-${windowId}">System Protected</div>
                    </div>
                </div>

                <!-- Main Navigation -->
                <div class="antivirus-nav">
                    <button class="nav-tab active" data-tab="dashboard" data-window="${windowId}">🏠 Dashboard</button>
                    <button class="nav-tab" data-tab="scan" data-window="${windowId}">🔍 Scan</button>
                    <button class="nav-tab" data-tab="quarantine" data-window="${windowId}">🔒 Quarantine</button>
                    <button class="nav-tab" data-tab="settings" data-window="${windowId}">⚙️ Settings</button>
                </div>

                <!-- Content Area -->
                <div class="antivirus-content">
                    <!-- Dashboard Tab -->
                    <div class="tab-content active" id="dashboard-tab-${windowId}">
                        <div class="dashboard-grid">
                            <div class="status-card">
                                <div class="card-header">
                                    <h3>🛡️ Protection Status</h3>
                                </div>
                                <div class="card-body">
                                    <div class="protection-status">
                                        <div class="status-icon">✅</div>
                                        <div class="status-info">
                                            <div class="status-title">Real-time Protection</div>
                                            <div class="status-detail">Active and monitoring</div>
                                        </div>
                                    </div>
                                    <div class="health-meter">
                                        <div class="health-label">System Health:</div>
                                        <div class="health-bar">
                                            <div class="health-fill" id="health-fill-${windowId}"></div>
                                        </div>
                                        <div class="health-percentage" id="health-percentage-${windowId}">100%</div>
                                    </div>
                                </div>
                            </div>

                            <div class="threats-card">
                                <div class="card-header">
                                    <h3>⚠️ Threat Summary</h3>
                                </div>
                                <div class="card-body">
                                    <div class="threat-stats">
                                        <div class="stat-item">
                                            <div class="stat-number" id="active-threats-${windowId}">0</div>
                                            <div class="stat-label">Active Threats</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-number" id="quarantined-${windowId}">0</div>
                                            <div class="stat-label">Quarantined</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-number" id="total-scans-${windowId}">0</div>
                                            <div class="stat-label">Total Scans</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="scan-card">
                                <div class="card-header">
                                    <h3>🔍 Last Scan</h3>
                                </div>
                                <div class="card-body">
                                    <div class="last-scan-info" id="last-scan-${windowId}">
                                        <div class="scan-status">Never scanned</div>
                                        <button class="quick-scan-btn" id="quick-scan-${windowId}">
                                            🚀 Quick Scan
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Scan Tab -->
                    <div class="tab-content" id="scan-tab-${windowId}">
                        <div class="scan-interface">
                            <div class="scan-options" id="scan-options-${windowId}">
                                <h3>🔍 Scan Options</h3>
                                <div class="scan-types">
                                    <div class="scan-type">
                                        <button class="scan-btn" id="quick-scan-full-${windowId}">
                                            <div class="scan-icon">⚡</div>
                                            <div class="scan-info">
                                                <div class="scan-title">Quick Scan</div>
                                                <div class="scan-desc">Scan common threat locations (~2 min)</div>
                                            </div>
                                        </button>
                                    </div>
                                    <div class="scan-type">
                                        <button class="scan-btn" id="full-scan-${windowId}">
                                            <div class="scan-icon">🔍</div>
                                            <div class="scan-info">
                                                <div class="scan-title">Full System Scan</div>
                                                <div class="scan-desc">Complete system analysis (~15 min)</div>
                                            </div>
                                        </button>
                                    </div>
                                    <div class="scan-type">
                                        <button class="scan-btn" id="custom-scan-${windowId}">
                                            <div class="scan-icon">⚙️</div>
                                            <div class="scan-info">
                                                <div class="scan-title">Custom Scan</div>
                                                <div class="scan-desc">Select specific locations</div>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div class="scan-progress" id="scan-progress-${windowId}" style="display: none;">
                                <h3>🔍 Scanning in Progress...</h3>
                                <div class="progress-container">
                                    <div class="progress-bar">
                                        <div class="progress-fill" id="scan-progress-fill-${windowId}"></div>
                                    </div>
                                    <div class="progress-info">
                                        <div class="progress-text" id="progress-text-${windowId}">Initializing scan...</div>
                                        <div class="progress-stats">
                                            <span id="scanned-files-${windowId}">0</span> / 
                                            <span id="total-files-${windowId}">0</span> files scanned
                                        </div>
                                        <div class="current-file" id="current-file-${windowId}">Preparing...</div>
                                    </div>
                                </div>
                                <button class="cancel-scan-btn" id="cancel-scan-${windowId}">Cancel Scan</button>
                            </div>

                            <div class="scan-results" id="scan-results-${windowId}" style="display: none;">
                                <!-- Results will be populated here -->
                            </div>
                        </div>
                    </div>

                    <!-- Quarantine Tab -->
                    <div class="tab-content" id="quarantine-tab-${windowId}">
                        <div class="quarantine-interface">
                            <div class="quarantine-header">
                                <h3>🔒 Quarantine Manager</h3>
                                <p>Isolated threats are safely contained here</p>
                            </div>
                            <div class="quarantine-list" id="quarantine-list-${windowId}">
                                <div class="empty-quarantine">
                                    <div class="empty-icon">🎉</div>
                                    <div class="empty-message">No threats in quarantine</div>
                                    <div class="empty-desc">Your system is clean!</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Settings Tab -->
                    <div class="tab-content" id="settings-tab-${windowId}">
                        <div class="settings-interface">
                            <h3>⚙️ Protection Settings</h3>
                            <div class="settings-grid">
                                <div class="setting-group">
                                    <h4>Real-time Protection</h4>
                                    <div class="setting-item">
                                        <label class="toggle-switch">
                                            <input type="checkbox" id="realtime-toggle-${windowId}" checked>
                                            <span class="toggle-slider"></span>
                                        </label>
                                        <div class="setting-info">
                                            <div class="setting-title">Enable Real-time Scanning</div>
                                            <div class="setting-desc">Automatically detect and block threats</div>
                                        </div>
                                    </div>
                                </div>

                                <div class="setting-group">
                                    <h4>Scan Schedule</h4>
                                    <div class="setting-item">
                                        <select id="scan-schedule-${windowId}" class="scan-schedule-select">
                                            <option value="daily">Daily</option>
                                            <option value="weekly" selected>Weekly</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="manual">Manual only</option>
                                        </select>
                                        <div class="setting-info">
                                            <div class="setting-title">Automatic Scan Frequency</div>
                                            <div class="setting-desc">How often to run full system scans</div>
                                        </div>
                                    </div>
                                </div>

                                <div class="setting-group">
                                    <h4>Debug Tools</h4>
                                    <div class="debug-tools">
                                        <button class="debug-btn" id="debug-infect-buggy-${windowId}">
                                            🐛 Test Buggyworm
                                        </button>
                                        <button class="debug-btn" id="debug-infect-game-${windowId}">
                                            🎮 Test VeryFunGame
                                        </button>
                                        <button class="debug-btn" id="debug-clear-${windowId}">
                                            🧹 Clear All Infections
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="antivirus-footer">
                    <div class="footer-info">
                        <span>ElxaGuard Pro - Advanced Threat Protection</span>
                        <span>Last Update: ${new Date().toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        `;
    }

    setupWindowEventHandlers(windowId) {
        const container = document.querySelector(`.antivirus-container[data-window-id="${windowId}"]`);
        
        if (!container) {
            return;
        }

        // Use event delegation for ALL clicks within the container
        container.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) {
                return;
            }

            const id = target.id;

            // Handle tab navigation
            if (target.classList.contains('nav-tab')) {
                if (target.dataset.window === windowId) {
                    this.switchTab(target.dataset.tab, windowId);
                }
                return;
            }

            // Handle all other button clicks based on ID patterns
            if (id.includes('quick-scan')) {
                this.startQuickScan(windowId);
            } else if (id.includes('full-scan')) {
                this.startFullScan(windowId);
            } else if (id.includes('custom-scan')) {
                this.startCustomScan(windowId);
            } else if (id.includes('cancel-scan')) {
                this.cancelScan(windowId);
            } else if (id.includes('debug-infect-buggy')) {
                if (elxaOS.virusSystem) {
                    elxaOS.virusSystem.debugInfect('buggyworm');
                }
            } else if (id.includes('debug-infect-game')) {
                if (elxaOS.virusSystem) {
                    elxaOS.virusSystem.debugInfect('veryfungame');
                }
            } else if (id.includes('debug-clear')) {
                if (elxaOS.virusSystem) {
                    elxaOS.virusSystem.debugClearAll();
                    this.updateSystemStatus();
                }
            }
        });

        // Handle checkbox changes (for settings)
        container.addEventListener('change', (e) => {
            if (e.target.id.includes('realtime-toggle')) {
                this.toggleRealTimeProtection(e.target.checked);
            }
        });
    }

    switchTab(tabName, windowId) {
        const container = document.querySelector(`.antivirus-container[data-window-id="${windowId}"]`);
        if (!container) {
            return;
        }

        // Update nav tabs
        const navTabs = container.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            const isActive = tab.dataset.tab === tabName;
            tab.classList.toggle('active', isActive);
        });

        // Update content tabs
        const contentTabs = container.querySelectorAll('.tab-content');
        contentTabs.forEach(content => {
            content.classList.remove('active');
        });

        const targetTab = container.querySelector(`#${tabName}-tab-${windowId}`);
        if (targetTab) {
            targetTab.classList.add('active');
        }

        // Refresh specific tab content
        if (tabName === 'quarantine') {
            this.updateQuarantineList(windowId);
        }
    }

    startQuickScan(windowId) {
        this.startScan(windowId, 'quick');
    }

    startFullScan(windowId) {
        this.startScan(windowId, 'full');
    }

    startCustomScan(windowId) {
        this.startScan(windowId, 'custom');
    }

    startScan(windowId, scanType) {
        if (this.isScanning) {
            return;
        }

        this.isScanning = true;
        this.switchTab('scan', windowId);

        const container = document.querySelector(`.antivirus-container[data-window-id="${windowId}"]`);
        if (!container) {
            return;
        }

        const scanOptions = container.querySelector(`#scan-options-${windowId}`);
        const scanProgress = container.querySelector(`#scan-progress-${windowId}`);
        const scanResults = container.querySelector(`#scan-results-${windowId}`);

        // Hide options, show progress
        if (scanOptions) scanOptions.style.display = 'none';
        if (scanResults) scanResults.style.display = 'none';
        if (scanProgress) scanProgress.style.display = 'block';

        // Reset progress
        const progressFill = container.querySelector(`#scan-progress-fill-${windowId}`);
        const progressText = container.querySelector(`#progress-text-${windowId}`);
        const scannedFiles = container.querySelector(`#scanned-files-${windowId}`);
        const totalFiles = container.querySelector(`#total-files-${windowId}`);
        const currentFile = container.querySelector(`#current-file-${windowId}`);

        if (progressFill) progressFill.style.width = '0%';
        if (progressText) progressText.textContent = 'Starting scan...';
        if (scannedFiles) scannedFiles.textContent = '0';
        if (totalFiles) totalFiles.textContent = '0';
        if (currentFile) currentFile.textContent = 'Initializing...';

        // Start the actual scan
        if (elxaOS.virusSystem) {
            this.eventBus.emit('antivirus.scan');
        } else {
            this.isScanning = false;
            // Fallback - simulate scan completion
            setTimeout(() => {
                this.handleScanComplete({
                    totalFiles: 1234,
                    scannedFiles: 1234,
                    threatsFound: [],
                    scanTime: 5
                });
            }, 2000);
        }
    }

    cancelScan(windowId) {
        this.isScanning = false;
        
        const container = document.querySelector(`.antivirus-container[data-window-id="${windowId}"]`);
        if (!container) return;

        const scanOptions = container.querySelector(`#scan-options-${windowId}`);
        const scanProgress = container.querySelector(`#scan-progress-${windowId}`);

        if (scanOptions) scanOptions.style.display = 'block';
        if (scanProgress) scanProgress.style.display = 'none';
    }

    updateScanProgress(data) {
        if (!this.currentWindowId) return;

        const container = document.querySelector(`.antivirus-container[data-window-id="${this.currentWindowId}"]`);
        if (!container) return;

        const progressFill = container.querySelector(`#scan-progress-fill-${this.currentWindowId}`);
        const progressText = container.querySelector(`#progress-text-${this.currentWindowId}`);
        const scannedFiles = container.querySelector(`#scanned-files-${this.currentWindowId}`);
        const totalFiles = container.querySelector(`#total-files-${this.currentWindowId}`);
        const currentFile = container.querySelector(`#current-file-${this.currentWindowId}`);

        if (progressFill) progressFill.style.width = `${data.progress}%`;
        if (progressText) progressText.textContent = `Scanning... ${Math.round(data.progress)}%`;
        if (scannedFiles) scannedFiles.textContent = data.scannedFiles.toLocaleString();
        if (totalFiles) totalFiles.textContent = data.totalFiles.toLocaleString();
        if (currentFile) currentFile.textContent = data.currentFile;
    }

    handleScanComplete(data) {
        this.isScanning = false;
        this.scanResults = data;

        if (!this.currentWindowId) return;

        const container = document.querySelector(`.antivirus-container[data-window-id="${this.currentWindowId}"]`);
        if (!container) return;

        const scanProgress = container.querySelector(`#scan-progress-${this.currentWindowId}`);
        const scanResults = container.querySelector(`#scan-results-${this.currentWindowId}`);

        // Hide progress, show results
        if (scanProgress) scanProgress.style.display = 'none';
        if (scanResults) {
            scanResults.style.display = 'block';
            scanResults.innerHTML = this.generateScanResultsHTML(data);
            
            // Setup quarantine buttons
            scanResults.querySelectorAll('.quarantine-threat-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const virusId = btn.dataset.virusId;
                    this.quarantineThreat(virusId);
                    btn.textContent = 'Quarantined ✅';
                    btn.disabled = true;
                });
            });
        }

        // Update system status
        this.updateSystemStatus();
    }

    generateScanResultsHTML(data) {
        const threats = data.threatsFound || [];
        const scanTime = `${data.scanTime || 'Unknown'} seconds`;
        
        if (threats.length === 0) {
            return `
                <div class="scan-complete clean">
                    <div class="result-header">
                        <div class="result-icon">✅</div>
                        <h3>Scan Complete - No Threats Found!</h3>
                    </div>
                    <div class="scan-summary">
                        <div class="summary-stats">
                            <div class="stat">
                                <span class="stat-number">${(data.totalFiles || 0).toLocaleString()}</span>
                                <span class="stat-label">Files Scanned</span>
                            </div>
                            <div class="stat">
                                <span class="stat-number">${scanTime}</span>
                                <span class="stat-label">Scan Time</span>
                            </div>
                            <div class="stat">
                                <span class="stat-number">${threats.length}</span>
                                <span class="stat-label">Threats Found</span>
                            </div>
                        </div>
                        <div class="clean-message">
                            <p>Your system is clean and secure! 🎉</p>
                        </div>
                    </div>
                    <button class="new-scan-btn" onclick="this.parentElement.parentElement.style.display='none'; document.querySelector('#scan-options-${this.currentWindowId}').style.display='block';">
                        Start New Scan
                    </button>
                </div>
            `;
        }

        const threatsList = threats.map(threat => `
            <div class="threat-item ${threat.severity}">
                <div class="threat-icon">${this.getThreatIcon(threat.severity)}</div>
                <div class="threat-info">
                    <div class="threat-name">${threat.name}</div>
                    <div class="threat-location">${threat.location}</div>
                    <div class="threat-description">${threat.description}</div>
                </div>
                <div class="threat-actions">
                    <button class="quarantine-threat-btn" data-virus-id="${threat.id}">
                        🔒 Quarantine
                    </button>
                </div>
            </div>
        `).join('');

        return `
            <div class="scan-complete threats-found">
                <div class="result-header">
                    <div class="result-icon">⚠️</div>
                    <h3>Scan Complete - ${threats.length} Threat${threats.length > 1 ? 's' : ''} Found!</h3>
                </div>
                <div class="scan-summary">
                    <div class="summary-stats">
                        <div class="stat">
                            <span class="stat-number">${(data.totalFiles || 0).toLocaleString()}</span>
                            <span class="stat-label">Files Scanned</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">${scanTime}</span>
                            <span class="stat-label">Scan Time</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">${threats.length}</span>
                            <span class="stat-label">Threats Found</span>
                        </div>
                    </div>
                </div>
                <div class="threats-list">
                    <h4>Detected Threats:</h4>
                    ${threatsList}
                </div>
                <div class="scan-actions">
                    <button class="quarantine-all-btn" onclick="document.querySelectorAll('.quarantine-threat-btn').forEach(btn => btn.click())">
                        🔒 Quarantine All Threats
                    </button>
                    <button class="new-scan-btn" onclick="this.parentElement.parentElement.style.display='none'; document.querySelector('#scan-options-${this.currentWindowId}').style.display='block';">
                        Start New Scan
                    </button>
                </div>
            </div>
        `;
    }

    getThreatIcon(severity) {
        switch (severity) {
            case 'high': return '🔴';
            case 'medium': return '🟡';
            case 'low': return '🟢';
            default: return '⚠️';
        }
    }

    quarantineThreat(virusId) {
        console.log('Quarantining threat:', virusId);
        this.eventBus.emit('antivirus.quarantine', { virusId });
    }

    handleVirusQuarantined(data) {
        this.showSystemMessage(`Threat quarantined: ${data.virusName}`, 'success');
        this.updateSystemStatus();
        this.updateQuarantineList(this.currentWindowId);
    }

    updateRealTimeProtectionUI(enabled) {
        if (!this.currentWindowId) return;
        
        const container = document.querySelector(`.antivirus-container[data-window-id="${this.currentWindowId}"]`);
        if (!container) return;

        // Helper function to safely update elements
        const safeUpdate = (selector, updateFn) => {
            const element = container.querySelector(selector);
            if (element) {
                updateFn(element);
            }
        };

        // Update the dashboard protection status
        const protectionStatus = container.querySelector('.protection-status');
        if (protectionStatus) {
            protectionStatus.innerHTML = enabled ? `
                <div class="status-icon">✅</div>
                <div class="status-info">
                    <div class="status-title">Real-time Protection</div>
                    <div class="status-detail">Active and monitoring</div>
                </div>
            ` : `
                <div class="status-icon">⚠️</div>
                <div class="status-info">
                    <div class="status-title">Real-time Protection</div>
                    <div class="status-detail">Disabled - Click Settings to enable</div>
                </div>
            `;
        }
    }

    updateSystemStatus() {
        if (!this.currentWindowId) return;
        
        // Get status from virus system or use defaults
        let status = {
            health: 100,
            activeInfections: 0,
            quarantinedThreats: 0,
            lastScanTime: null
        };

        if (elxaOS.virusSystem) {
            status = elxaOS.virusSystem.getSystemStatus();
        }

        const container = document.querySelector(`.antivirus-container[data-window-id="${this.currentWindowId}"]`);
        if (!container) return;

        // Helper function to safely update elements
        const safeUpdate = (selector, updateFn) => {
            const element = container.querySelector(selector);
            if (element) {
                updateFn(element);
            }
        };

        // Determine overall system status
        let statusLight = '🟢';
        let statusText = 'System Protected';
        
        if (status.activeInfections > 0) {
            statusLight = '🔴';
            statusText = 'Threats Detected!';
        } else if (!this.realTimeProtection) {
            statusLight = '🟡';
            statusText = 'Protection Disabled';
        }

        // Update status light and text
        safeUpdate(`#status-light-${this.currentWindowId}`, (el) => {
            el.textContent = statusLight;
        });

        safeUpdate(`#status-text-${this.currentWindowId}`, (el) => {
            el.textContent = statusText;
        });

        // Update health meter
        safeUpdate(`#health-fill-${this.currentWindowId}`, (el) => {
            el.style.width = `${status.health}%`;
            el.className = `health-fill ${this.getHealthClass(status.health)}`;
        });

        safeUpdate(`#health-percentage-${this.currentWindowId}`, (el) => {
            el.textContent = `${status.health}%`;
        });

        safeUpdate(`#active-threats-${this.currentWindowId}`, (el) => {
            el.textContent = status.activeInfections;
        });

        safeUpdate(`#quarantined-${this.currentWindowId}`, (el) => {
            el.textContent = status.quarantinedThreats;
        });

        // Update real-time protection UI
        this.updateRealTimeProtectionUI(this.realTimeProtection);
    }

    getHealthClass(health) {
        if (health >= 80) return 'good';
        if (health >= 50) return 'warning';
        return 'critical';
    }

    updateQuarantineList(windowId) {
        console.log('Updating quarantine list');
        const container = document.querySelector(`.antivirus-container[data-window-id="${windowId}"]`);
        if (!container) return;

        const quarantineList = container.querySelector(`#quarantine-list-${windowId}`);
        if (!quarantineList) return;

        let quarantinedThreats = [];
        if (elxaOS.virusSystem) {
            quarantinedThreats = Array.from(elxaOS.virusSystem.quarantine.values());
        }

        if (quarantinedThreats.length === 0) {
            quarantineList.innerHTML = `
                <div class="empty-quarantine">
                    <div class="empty-icon">🎉</div>
                    <div class="empty-message">No threats in quarantine</div>
                    <div class="empty-desc">Your system is clean!</div>
                </div>
            `;
            return;
        }

        const threatsList = quarantinedThreats.map(threat => `
            <div class="quarantine-item">
                <div class="quarantine-icon">${this.getThreatIcon(threat.definition.severity)}</div>
                <div class="quarantine-info">
                    <div class="quarantine-name">${threat.definition.name}</div>
                    <div class="quarantine-description">${threat.definition.description}</div>
                    <div class="quarantine-date">Quarantined: ${new Date(threat.quarantinedAt).toLocaleString()}</div>
                </div>
                <div class="quarantine-actions">
                    <button class="delete-btn" onclick="this.closest('.quarantine-item').remove()">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `).join('');

        quarantineList.innerHTML = `
            <div class="quarantine-header-info">
                <p>${quarantinedThreats.length} threat${quarantinedThreats.length > 1 ? 's' : ''} safely contained</p>
            </div>
            ${threatsList}
        `;
    }

    showVirusAlert(data) {
        const alert = document.createElement('div');
        alert.className = 'virus-alert system-dialog';
        alert.innerHTML = `
            <div class="dialog-content warning">
                <div class="dialog-header">
                    <div class="dialog-title">🛡️ ElxaGuard Alert</div>
                    <div class="dialog-close">×</div>
                </div>
                <div class="dialog-body">
                    <div class="alert-content">
                        <div class="alert-icon">⚠️</div>
                        <div class="alert-message">
                            <h3>Threat Detected!</h3>
                            <p><strong>${data.virusName}</strong> has been detected on your system.</p>
                            <p>Severity: <span class="severity ${data.severity}">${data.severity.toUpperCase()}</span></p>
                        </div>
                    </div>
                    <div class="alert-actions">
                        <button class="quarantine-now-btn" data-virus-id="${data.virusId}">
                            🔒 Quarantine Now
                        </button>
                        <button class="scan-now-btn">
                            🔍 Full Scan
                        </button>
                        <button class="dismiss-btn">
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(alert);

        // Position randomly
        const x = Math.random() * (window.innerWidth - 400);
        const y = Math.random() * (window.innerHeight - 300);
        alert.style.left = x + 'px';
        alert.style.top = y + 'px';

        // Event handlers
        alert.querySelector('.dialog-close').addEventListener('click', () => alert.remove());
        alert.querySelector('.dismiss-btn').addEventListener('click', () => alert.remove());
        
        alert.querySelector('.quarantine-now-btn').addEventListener('click', () => {
            this.quarantineThreat(data.virusId);
            alert.remove();
        });

        alert.querySelector('.scan-now-btn').addEventListener('click', () => {
            alert.remove();
            this.launch(); // Open antivirus if not open
            setTimeout(() => {
                this.startFullScan(this.currentWindowId);
            }, 500);
        });

        // Auto-dismiss after 30 seconds
        setTimeout(() => {
            if (alert.parentNode) alert.remove();
        }, 30000);
    }

    toggleRealTimeProtection(enabled) {
        this.realTimeProtection = enabled;
        
        // Tell the virus system about the setting change
        this.eventBus.emit('antivirus.realtime.toggle', { enabled });
        
        // Update the entire UI to reflect the change (including top status)
        this.updateSystemStatus();
        
        this.showSystemMessage(
            `Real-time protection ${enabled ? 'enabled' : 'disabled'}`,
            enabled ? 'success' : 'warning'
        );
    }

    showSystemMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `system-message ${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            padding: 8px 16px;
            border: 2px outset #c0c0c0;
            z-index: 3000;
            font-weight: bold;
            font-size: 11px;
            animation: slideIn 0.3s ease-out;
        `;

        const colors = {
            info: { bg: '#add8e6', color: 'black' },
            success: { bg: '#90ee90', color: 'black' },
            warning: { bg: '#ffff00', color: 'black' },
            error: { bg: '#ff6666', color: 'white' }
        };

        messageEl.style.background = colors[type].bg;
        messageEl.style.color = colors[type].color;

        document.body.appendChild(messageEl);

        setTimeout(() => messageEl.remove(), 3000);
    }
}