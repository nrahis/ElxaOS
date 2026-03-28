// =================================
// ELXAGUARD ANTIVIRUS PROGRAM
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

        // Store EventBus handler refs for cleanup
        this._onVirusDetected = (data) => this.showVirusAlert(data);
        this._onScanProgress = (data) => this.updateScanProgress(data);
        this._onScanComplete = (data) => this.handleScanComplete(data);
        this._onVirusQuarantined = (data) => this.handleVirusQuarantined(data);

        this.eventBus.on('virus.detected', this._onVirusDetected);
        this.eventBus.on('antivirus.scan.progress', this._onScanProgress);
        this.eventBus.on('antivirus.scan.complete', this._onScanComplete);
        this.eventBus.on('virus.quarantined', this._onVirusQuarantined);
    }

    launch() {
        const windowId = `antivirus-${Date.now()}`;
        this.currentWindowId = windowId;

        const windowContent = this.createAntivirusInterface(windowId);

        this.windowManager.createWindow(
            windowId,
            `${ElxaIcons.render('antivirus', 'ui')} ElxaGuard Antivirus Pro`,
            windowContent,
            { width: '700px', height: '500px', x: '150px', y: '100px' }
        );

        // Clean up on window close
        this._onWindowClosed = (data) => {
            if (data.id === windowId) this.destroy(windowId);
        };
        this.eventBus.on('window.closed', this._onWindowClosed);

        // Refresh virus selection list when definitions change (e.g. Virus Lab save/delete)
        this._onDefinitionsChanged = () => this.populateVirusSelection(windowId);
        this.eventBus.on('virus.definitions.changed', this._onDefinitionsChanged);

        setTimeout(() => {
            this.setupWindowEventHandlers(windowId);
            this.updateSystemStatus();
            this.populateVirusSelection(windowId);
        }, 100);

        return windowId;
    }

    // =================================
    // CLEANUP
    // =================================
    destroy(windowId) {
        // Remove body-appended alert/restart popups
        document.querySelectorAll('.virus-alert').forEach(el => el.remove());
        document.querySelectorAll('.restart-recommendation').forEach(el => el.remove());

        // Remove EventBus window listener
        if (this._onWindowClosed) {
            this.eventBus.off('window.closed', this._onWindowClosed);
            this._onWindowClosed = null;
        }
        if (this._onDefinitionsChanged) {
            this.eventBus.off('virus.definitions.changed', this._onDefinitionsChanged);
            this._onDefinitionsChanged = null;
        }

        if (windowId === this.currentWindowId) {
            this.currentWindowId = null;
        }
    }

    // =================================
    // INTERFACE
    // =================================
    createAntivirusInterface(windowId) {
        return `
            <div class="antivirus-container" data-window-id="${windowId}">
                <!-- Header Section -->
                <div class="antivirus-header">
                    <div class="antivirus-logo">
                        <div class="shield-icon">${ElxaIcons.render('antivirus', 'ui')}</div>
                        <div class="product-info">
                            <h2>ElxaGuard Pro</h2>
                            <span class="version">Version 2025.1.0</span>
                        </div>
                    </div>
                    <div class="system-status">
                        <div class="status-indicator av-status-good" id="status-light-${windowId}"></div>
                        <div class="status-text" id="status-text-${windowId}">System Protected</div>
                    </div>
                </div>

                <!-- Main Navigation -->
                <div class="antivirus-nav">
                    <button class="nav-tab active" data-tab="dashboard" data-window="${windowId}">${ElxaIcons.renderAction('home')} Dashboard</button>
                    <button class="nav-tab" data-tab="scan" data-window="${windowId}">${ElxaIcons.renderAction('magnify')} Scan</button>
                    <button class="nav-tab" data-tab="quarantine" data-window="${windowId}">${ElxaIcons.renderAction('lock')} Quarantine</button>
                    <button class="nav-tab" data-tab="settings" data-window="${windowId}">${ElxaIcons.renderAction('settings')} Settings</button>
                </div>

                <!-- Content Area -->
                <div class="antivirus-content">
                    <!-- Dashboard Tab -->
                    <div class="tab-content active" id="dashboard-tab-${windowId}">
                        <div class="dashboard-grid">
                            <div class="status-card">
                                <div class="card-header">
                                    <h3>${ElxaIcons.renderAction('shield')} Protection Status</h3>
                                </div>
                                <div class="card-body">
                                    <div class="protection-status" id="protection-status-${windowId}">
                                        <div class="status-icon">${ElxaIcons.renderAction('check-circle')}</div>
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
                                    <h3>${ElxaIcons.renderAction('shield-alert')} Threat Summary</h3>
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
                                    <h3>${ElxaIcons.renderAction('magnify')} Last Scan</h3>
                                </div>
                                <div class="card-body">
                                    <div class="last-scan-info" id="last-scan-${windowId}">
                                        <div class="scan-status">Never scanned</div>
                                        <button class="quick-scan-btn" id="quick-scan-${windowId}">
                                            ${ElxaIcons.renderAction('rocket')} Quick Scan
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
                                <h3>${ElxaIcons.renderAction('magnify')} Scan Options</h3>
                                <div class="scan-types">
                                    <div class="scan-type">
                                        <button class="scan-btn" id="quick-scan-full-${windowId}">
                                            <div class="scan-icon">${ElxaIcons.renderAction('flash')}</div>
                                            <div class="scan-info">
                                                <div class="scan-title">Quick Scan</div>
                                                <div class="scan-desc">Scan common threat locations (~2 min)</div>
                                            </div>
                                        </button>
                                    </div>
                                    <div class="scan-type">
                                        <button class="scan-btn" id="full-scan-${windowId}">
                                            <div class="scan-icon">${ElxaIcons.renderAction('magnify')}</div>
                                            <div class="scan-info">
                                                <div class="scan-title">Full System Scan</div>
                                                <div class="scan-desc">Complete system analysis (~15 min)</div>
                                            </div>
                                        </button>
                                    </div>
                                    <div class="scan-type">
                                        <button class="scan-btn" id="custom-scan-${windowId}">
                                            <div class="scan-icon">${ElxaIcons.renderAction('settings')}</div>
                                            <div class="scan-info">
                                                <div class="scan-title">Custom Scan</div>
                                                <div class="scan-desc">Select specific locations</div>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div class="scan-progress" id="scan-progress-${windowId}" style="display: none;">
                                <h3>${ElxaIcons.renderAction('magnify')} Scanning in Progress...</h3>
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
                                <button class="cancel-scan-btn" id="cancel-scan-${windowId}">${ElxaIcons.renderAction('stop')} Cancel Scan</button>
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
                                <h3>${ElxaIcons.renderAction('lock')} Quarantine Manager</h3>
                                <p>Isolated threats are safely contained here</p>
                            </div>
                            <div class="quarantine-list" id="quarantine-list-${windowId}">
                                <div class="empty-quarantine">
                                    <div class="empty-icon">${ElxaIcons.renderAction('check-circle')}</div>
                                    <div class="empty-message">No threats in quarantine</div>
                                    <div class="empty-desc">Your system is clean!</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Settings Tab -->
                    <div class="tab-content" id="settings-tab-${windowId}">
                        <div class="settings-interface">
                            <h3>${ElxaIcons.renderAction('settings')} Protection Settings</h3>
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
                                    <h4>${ElxaIcons.renderAction('biohazard')} Virus Vulnerability</h4>
                                    <div class="setting-desc av-vuln-desc">Choose which viruses can infect your system when protection is off.</div>
                                    <div class="av-virus-selection" id="virus-selection-${windowId}">
                                        <!-- Populated dynamically -->
                                    </div>
                                </div>

                                <div class="setting-group">
                                    <h4>Debug Tools</h4>
                                    <div class="debug-tools">
                                        <button class="debug-btn" id="debug-infect-buggy-${windowId}">
                                            ${ElxaIcons.renderAction('bug')} Test Buggyworm
                                        </button>
                                        <button class="debug-btn" id="debug-infect-game-${windowId}">
                                            ${ElxaIcons.renderAction('gamepad')} Test VeryFunGame
                                        </button>
                                        <button class="debug-btn" id="debug-infect-lebron-${windowId}">
                                            ${ElxaIcons.renderAction('alert')} Test Lebron James
                                        </button>
                                        <button class="debug-btn" id="debug-infect-horror-${windowId}">
                                            ${ElxaIcons.renderAction('skull')} Test Roblox Horror
                                        </button>
                                        <button class="debug-btn" id="debug-clear-${windowId}">
                                            ${ElxaIcons.renderAction('broom')} Clear All Infections
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

    // =================================
    // EVENT HANDLERS
    // =================================
    setupWindowEventHandlers(windowId) {
        const container = document.querySelector(`.antivirus-container[data-window-id="${windowId}"]`);
        if (!container) return;

        // Unified click delegation
        container.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            // Tab navigation
            if (button.classList.contains('nav-tab') && button.dataset.window === windowId) {
                this.switchTab(button.dataset.tab, windowId);
                return;
            }

            const id = button.id;

            // Scan buttons
            if (id === `quick-scan-${windowId}` || id === `quick-scan-full-${windowId}`) {
                this.startScan(windowId, 'quick');
            } else if (id === `full-scan-${windowId}`) {
                this.startScan(windowId, 'full');
            } else if (id === `custom-scan-${windowId}`) {
                this.startScan(windowId, 'custom');
            } else if (id === `cancel-scan-${windowId}`) {
                this.cancelScan(windowId);
            }
            // Debug buttons
            else if (id === `debug-infect-buggy-${windowId}`) {
                if (elxaOS.virusSystem) elxaOS.virusSystem.debugInfect('buggyworm');
            } else if (id === `debug-infect-game-${windowId}`) {
                if (elxaOS.virusSystem) elxaOS.virusSystem.debugInfect('veryfungame');
            } else if (id === `debug-infect-lebron-${windowId}`) {
                if (elxaOS.virusSystem) elxaOS.virusSystem.debugInfect('lebron-james-scrambler');
            } else if (id === `debug-infect-horror-${windowId}`) {
                if (elxaOS.virusSystem) elxaOS.virusSystem.debugInfect('roblox-horror-jumpscare');
            } else if (id === `debug-clear-${windowId}`) {
                if (elxaOS.virusSystem) {
                    elxaOS.virusSystem.debugClearAll();
                    this.updateSystemStatus();
                }
            }
            // Scan results — quarantine buttons
            else if (button.classList.contains('quarantine-threat-btn')) {
                const virusId = button.dataset.virusId;
                if (virusId) {
                    this.quarantineThreat(virusId);
                    button.innerHTML = `${ElxaIcons.renderAction('check')} Quarantined`;
                    button.disabled = true;
                }
            }
            // Scan results — quarantine all
            else if (button.classList.contains('quarantine-all-btn')) {
                container.querySelectorAll('.quarantine-threat-btn:not(:disabled)').forEach(btn => btn.click());
            }
            // Scan results — new scan
            else if (button.classList.contains('new-scan-btn')) {
                const scanResults = container.querySelector(`#scan-results-${windowId}`);
                const scanOptions = container.querySelector(`#scan-options-${windowId}`);
                if (scanResults) scanResults.style.display = 'none';
                if (scanOptions) scanOptions.style.display = 'block';
            }
            // Quarantine — delete button
            else if (button.classList.contains('av-quarantine-delete-btn')) {
                const item = button.closest('.quarantine-item');
                if (item) item.remove();
            }
        });

        // Handle checkbox changes (settings)
        container.addEventListener('change', (e) => {
            if (e.target.id === `realtime-toggle-${windowId}`) {
                this.toggleRealTimeProtection(e.target.checked);
            }
            // Virus selection checkboxes
            if (e.target.closest('.av-virus-selection') && e.target.dataset.virusId) {
                if (elxaOS.virusSystem) {
                    elxaOS.virusSystem.setVirusEnabled(e.target.dataset.virusId, e.target.checked);
                }
            }
        });
    }

    // =================================
    // TAB NAVIGATION
    // =================================
    switchTab(tabName, windowId) {
        const container = document.querySelector(`.antivirus-container[data-window-id="${windowId}"]`);
        if (!container) return;

        container.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        container.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        const targetTab = container.querySelector(`#${tabName}-tab-${windowId}`);
        if (targetTab) targetTab.classList.add('active');

        if (tabName === 'quarantine') {
            this.updateQuarantineList(windowId);
        } else if (tabName === 'settings') {
            this.populateVirusSelection(windowId);
        }
    }

    // =================================
    // SCANNING
    // =================================
    startScan(windowId, scanType) {
        if (this.isScanning) return;

        this.isScanning = true;
        this.switchTab('scan', windowId);

        const container = document.querySelector(`.antivirus-container[data-window-id="${windowId}"]`);
        if (!container) return;

        const scanOptions = container.querySelector(`#scan-options-${windowId}`);
        const scanProgress = container.querySelector(`#scan-progress-${windowId}`);
        const scanResults = container.querySelector(`#scan-results-${windowId}`);

        if (scanOptions) scanOptions.style.display = 'none';
        if (scanResults) scanResults.style.display = 'none';
        if (scanProgress) scanProgress.style.display = 'block';

        // Reset progress
        const safeSet = (sel, prop, val) => {
            const el = container.querySelector(sel);
            if (el) el[prop] = val;
        };
        safeSet(`#scan-progress-fill-${windowId}`, 'style', 'width: 0%');
        safeSet(`#progress-text-${windowId}`, 'textContent', 'Starting scan...');
        safeSet(`#scanned-files-${windowId}`, 'textContent', '0');
        safeSet(`#total-files-${windowId}`, 'textContent', '0');
        safeSet(`#current-file-${windowId}`, 'textContent', 'Initializing...');

        if (elxaOS.virusSystem) {
            this.eventBus.emit('antivirus.scan');
        } else {
            this.isScanning = false;
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

        const safeSet = (sel, prop, val) => {
            const el = container.querySelector(sel);
            if (el) el[prop] = val;
        };

        const wid = this.currentWindowId;
        safeSet(`#scan-progress-fill-${wid}`, 'style', `width: ${data.progress}%`);
        safeSet(`#progress-text-${wid}`, 'textContent', `Scanning... ${Math.round(data.progress)}%`);
        safeSet(`#scanned-files-${wid}`, 'textContent', data.scannedFiles.toLocaleString());
        safeSet(`#total-files-${wid}`, 'textContent', data.totalFiles.toLocaleString());
        safeSet(`#current-file-${wid}`, 'textContent', data.currentFile);
    }

    handleScanComplete(data) {
        this.isScanning = false;
        this.scanResults = data;

        if (!this.currentWindowId) return;

        const container = document.querySelector(`.antivirus-container[data-window-id="${this.currentWindowId}"]`);
        if (!container) return;

        const scanProgress = container.querySelector(`#scan-progress-${this.currentWindowId}`);
        const scanResults = container.querySelector(`#scan-results-${this.currentWindowId}`);

        if (scanProgress) scanProgress.style.display = 'none';
        if (scanResults) {
            scanResults.style.display = 'block';
            scanResults.innerHTML = this.generateScanResultsHTML(data);
            // NOTE: Button clicks (quarantine, quarantine-all, new-scan) are handled
            // by container delegation in setupWindowEventHandlers — no listeners added here.
        }

        this.updateSystemStatus();
    }

    generateScanResultsHTML(data) {
        const threats = data.threatsFound || [];
        const scanTime = `${data.scanTime || 'Unknown'} seconds`;

        if (threats.length === 0) {
            return `
                <div class="scan-complete clean">
                    <div class="result-header">
                        <div class="result-icon">${ElxaIcons.renderAction('check-circle')}</div>
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
                            <p>Your system is clean and secure!</p>
                        </div>
                    </div>
                    <button class="new-scan-btn">Start New Scan</button>
                </div>
            `;
        }

        const threatsList = threats.map(threat => `
            <div class="threat-item ${threat.severity}">
                <div class="threat-icon"><span class="av-threat-dot av-sev-${threat.severity}"></span></div>
                <div class="threat-info">
                    <div class="threat-name">${threat.name}</div>
                    <div class="threat-location">${threat.location}</div>
                    <div class="threat-description">${threat.description}</div>
                </div>
                <div class="threat-actions">
                    <button class="quarantine-threat-btn" data-virus-id="${threat.id}">
                        ${ElxaIcons.renderAction('lock')} Quarantine
                    </button>
                </div>
            </div>
        `).join('');

        return `
            <div class="scan-complete threats-found">
                <div class="result-header">
                    <div class="result-icon">${ElxaIcons.renderAction('shield-alert')}</div>
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
                    <button class="quarantine-all-btn">
                        ${ElxaIcons.renderAction('lock')} Quarantine All Threats
                    </button>
                    <button class="new-scan-btn">
                        Start New Scan
                    </button>
                </div>
            </div>
        `;
    }

    // =================================
    // QUARANTINE
    // =================================
    quarantineThreat(virusId) {
        this.eventBus.emit('antivirus.quarantine', { virusId });
    }

    handleVirusQuarantined(data) {
        ElxaUI.showMessage(`Threat quarantined: ${data.virusName}`, 'success');
        this.updateSystemStatus();
        this.updateQuarantineList(this.currentWindowId);

        // Check if it was a text-scrambling virus that needs restart
        if (data.virusId === 'lebron-james-scrambler') {
            this.showRestartRecommendation(data.virusName);
        }
    }

    updateQuarantineList(windowId) {
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
                    <div class="empty-icon">${ElxaIcons.renderAction('check-circle')}</div>
                    <div class="empty-message">No threats in quarantine</div>
                    <div class="empty-desc">Your system is clean!</div>
                </div>
            `;
            return;
        }

        quarantineList.innerHTML = `
            <div class="quarantine-header-info">
                <p>${quarantinedThreats.length} threat${quarantinedThreats.length > 1 ? 's' : ''} safely contained</p>
            </div>
            ${quarantinedThreats.map(threat => `
                <div class="quarantine-item">
                    <div class="quarantine-icon"><span class="av-threat-dot av-sev-${threat.definition.severity}"></span></div>
                    <div class="quarantine-info">
                        <div class="quarantine-name">${threat.definition.name}</div>
                        <div class="quarantine-description">${threat.definition.description}</div>
                        <div class="quarantine-date">Quarantined: ${new Date(threat.quarantinedAt).toLocaleString()}</div>
                    </div>
                    <div class="quarantine-actions">
                        <button class="av-quarantine-delete-btn">
                            ${ElxaIcons.renderAction('delete')} Delete
                        </button>
                    </div>
                </div>
            `).join('')}
        `;
        // NOTE: Delete button clicks handled by container delegation.
    }

    // =================================
    // VIRUS ALERT (body-appended popup)
    // =================================
    showVirusAlert(data) {
        const alert = document.createElement('div');
        alert.className = 'virus-alert system-dialog';
        alert.innerHTML = `
            <div class="dialog-content warning">
                <div class="dialog-header">
                    <div class="dialog-title">${ElxaIcons.renderAction('shield-alert')} ElxaGuard Alert</div>
                    <button class="dialog-close-btn">${ElxaIcons.renderAction('close')}</button>
                </div>
                <div class="dialog-body">
                    <div class="alert-content">
                        <div class="alert-icon">${ElxaIcons.renderAction('alert')}</div>
                        <div class="alert-message">
                            <h3>Threat Detected!</h3>
                            <p><strong>${data.virusName}</strong> has been detected on your system.</p>
                            <p>Severity: <span class="severity ${data.severity}">${data.severity.toUpperCase()}</span></p>
                        </div>
                    </div>
                    <div class="alert-actions">
                        <button class="quarantine-now-btn" data-virus-id="${data.virusId}">
                            ${ElxaIcons.renderAction('lock')} Quarantine Now
                        </button>
                        <button class="scan-now-btn">
                            ${ElxaIcons.renderAction('magnify')} Full Scan
                        </button>
                        <button class="dismiss-btn">
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(alert);

        // Random position
        const x = Math.random() * (window.innerWidth - 400);
        const y = Math.random() * (window.innerHeight - 300);
        alert.style.left = x + 'px';
        alert.style.top = y + 'px';

        // Event delegation within the alert
        alert.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            if (btn.classList.contains('dialog-close-btn') || btn.classList.contains('dismiss-btn')) {
                alert.remove();
            } else if (btn.classList.contains('quarantine-now-btn')) {
                this.quarantineThreat(btn.dataset.virusId);
                alert.remove();
            } else if (btn.classList.contains('scan-now-btn')) {
                alert.remove();
                this.launch();
                setTimeout(() => {
                    this.startScan(this.currentWindowId, 'full');
                }, 500);
            }
        });

        // Auto-dismiss after 30 seconds
        setTimeout(() => {
            if (alert.parentNode) alert.remove();
        }, 30000);
    }

    // =================================
    // RESTART RECOMMENDATION
    // =================================
    showRestartRecommendation(virusName) {
        const popup = document.createElement('div');
        popup.className = 'restart-recommendation system-dialog';
        popup.innerHTML = `
            <div class="dialog-content info">
                <div class="dialog-header">
                    <div class="dialog-title">${ElxaIcons.renderAction('refresh')} System Recovery</div>
                    <button class="dialog-close-btn">${ElxaIcons.renderAction('close')}</button>
                </div>
                <div class="dialog-body">
                    <div class="restart-content">
                        <div class="restart-icon">${ElxaIcons.renderAction('shield')}</div>
                        <div class="restart-message">
                            <h3>Threat Successfully Quarantined!</h3>
                            <p><strong>${virusName}</strong> has been removed from your system.</p>
                            <p>Due to text modifications made by this virus, a system restart is recommended to fully restore normal operation.</p>
                        </div>
                    </div>
                    <div class="restart-actions">
                        <button class="restart-now-btn">${ElxaIcons.renderAction('refresh')} Restart System</button>
                        <button class="restart-later-btn">Restart Later</button>
                    </div>
                </div>
            </div>
        `;

        // Center on screen via CSS class
        popup.style.position = 'fixed';
        popup.style.left = '50%';
        popup.style.top = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.zIndex = '3000';

        document.body.appendChild(popup);

        // Event delegation within the popup
        popup.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            if (btn.classList.contains('dialog-close-btn') || btn.classList.contains('restart-later-btn')) {
                popup.remove();
            } else if (btn.classList.contains('restart-now-btn')) {
                popup.querySelector('.dialog-body').innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <div class="restart-icon">${ElxaIcons.renderAction('refresh')}</div>
                        <div style="font-weight: bold; margin-top: 8px;">Restarting ElxaOS...</div>
                        <div style="font-size: 11px; color: #666; margin-top: 8px;">Please wait...</div>
                    </div>
                `;
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        });
    }

    // =================================
    // STATUS UPDATES
    // =================================
    updateRealTimeProtectionUI(enabled) {
        if (!this.currentWindowId) return;

        const container = document.querySelector(`.antivirus-container[data-window-id="${this.currentWindowId}"]`);
        if (!container) return;

        const protectionStatus = container.querySelector(`#protection-status-${this.currentWindowId}`);
        if (protectionStatus) {
            protectionStatus.innerHTML = enabled ? `
                <div class="status-icon">${ElxaIcons.renderAction('check-circle')}</div>
                <div class="status-info">
                    <div class="status-title">Real-time Protection</div>
                    <div class="status-detail">Active and monitoring</div>
                </div>
            ` : `
                <div class="status-icon">${ElxaIcons.renderAction('alert')}</div>
                <div class="status-info">
                    <div class="status-title">Real-time Protection</div>
                    <div class="status-detail">Disabled - Click Settings to enable</div>
                </div>
            `;
        }
    }

    updateSystemStatus() {
        if (!this.currentWindowId) return;

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

        const safeUpdate = (selector, updateFn) => {
            const el = container.querySelector(selector);
            if (el) updateFn(el);
        };

        // Determine overall system status
        let statusClass = 'av-status-good';
        let statusText = 'System Protected';

        if (status.activeInfections > 0) {
            statusClass = 'av-status-danger';
            statusText = 'Threats Detected!';
        } else if (!this.realTimeProtection) {
            statusClass = 'av-status-warning';
            statusText = 'Protection Disabled';
        }

        safeUpdate(`#status-light-${this.currentWindowId}`, (el) => {
            el.className = `status-indicator ${statusClass}`;
        });

        safeUpdate(`#status-text-${this.currentWindowId}`, (el) => {
            el.textContent = statusText;
        });

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

        this.updateRealTimeProtectionUI(this.realTimeProtection);
    }

    getHealthClass(health) {
        if (health >= 80) return 'good';
        if (health >= 50) return 'warning';
        return 'critical';
    }

    toggleRealTimeProtection(enabled) {
        this.realTimeProtection = enabled;
        this.eventBus.emit('antivirus.realtime.toggle', { enabled });
        this.updateSystemStatus();

        ElxaUI.showMessage(
            `Real-time protection ${enabled ? 'enabled' : 'disabled'}`,
            enabled ? 'success' : 'warning'
        );
    }

    // =================================
    // VIRUS SELECTION
    // =================================
    populateVirusSelection(windowId) {
        const container = document.querySelector(`.antivirus-container[data-window-id="${windowId}"]`);
        if (!container) return;

        const selectionDiv = container.querySelector(`#virus-selection-${windowId}`);
        if (!selectionDiv) return;

        if (!elxaOS.virusSystem) {
            selectionDiv.innerHTML = '<div class="av-vuln-empty">Virus system not loaded</div>';
            return;
        }

        const definitions = elxaOS.virusSystem.virusDefinitions;
        if (definitions.size === 0) {
            selectionDiv.innerHTML = '<div class="av-vuln-empty">No virus definitions found</div>';
            return;
        }

        // Separate built-in and custom viruses
        const builtIn = [];
        const custom = [];
        for (const [id, def] of definitions) {
            if (def.custom) {
                custom.push([id, def]);
            } else {
                builtIn.push([id, def]);
            }
        }

        let html = '';

        // Built-in viruses
        for (const [id, def] of builtIn) {
            const checked = elxaOS.virusSystem.isVirusEnabled(id) ? 'checked' : '';
            html += this.renderVirusCheckbox(id, def, checked, windowId);
        }

        // Custom viruses section
        if (custom.length > 0) {
            html += `<div class="av-vuln-divider">${ElxaIcons.renderAction('flask')} Virus Lab Creations</div>`;
            for (const [id, def] of custom) {
                const checked = elxaOS.virusSystem.isVirusEnabled(id) ? 'checked' : '';
                html += this.renderVirusCheckbox(id, def, checked, windowId);
            }
        }

        selectionDiv.innerHTML = html;
    }

    renderVirusCheckbox(virusId, def, checked, windowId) {
        const severityDot = `<span class="av-threat-dot av-sev-${def.severity}"></span>`;
        const customBadge = def.custom ? '<span class="av-custom-badge">CUSTOM</span>' : '';
        return `
            <label class="av-virus-checkbox">
                <input type="checkbox" data-virus-id="${virusId}" ${checked}>
                <span class="av-virus-checkbox-info">
                    <span class="av-virus-checkbox-name">${severityDot} ${def.name} ${customBadge}</span>
                    <span class="av-virus-checkbox-desc">${def.description}</span>
                    <span class="av-virus-checkbox-author">by ${def.author}</span>
                </span>
            </label>
        `;
    }
}
