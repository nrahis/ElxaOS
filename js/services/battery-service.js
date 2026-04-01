// =================================
// ENHANCED BATTERY SERVICE
// =================================
class BatteryService {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.batteryLevel = 100;
        this.isCharging = false;
        this.drainInterval = null;
        this.warningShown = {
            twenty: false,
            five: false
        };

        // Enhanced battery properties
        this.batteryHealth = 98;
        this.temperature = 72;
        this.voltage = 12.6;
        this.chargeCycles = 47;
        this.powerMode = 'balanced';
        this.batteryAge = 8;
        this.batteryType = 'Lithium-Ion';
        this.capacity = 5000;
        this.manufactureDate = 'March 2024';

        this._batteryWindowId = null;

        this.loadSettings();
        this.setupEvents();
        this.startBatteryDrain();
        this.updateBatteryIcon();
    }

    // =================================
    // EVENT SETUP
    // =================================

    setupEvents() {
        this.eventBus.on('battery.click', () => {
            this.showBatteryDialog();
        });

        this.eventBus.on('battery.recharge', () => {
            this.rechargeBattery();
        });
    }

    // =================================
    // BATTERY DRAIN
    // =================================

    startBatteryDrain() {
        const drainRates = {
            performance: 25000,
            balanced: 30000,
            powersaver: 45000
        };

        this.drainInterval = setInterval(() => {
            if (!this.isCharging && this.batteryLevel > 0) {
                this.batteryLevel--;
                this.updateBatteryStats();
                this.updateBatteryIcon();
                this.checkBatteryWarnings();

                this.eventBus.emit('battery.levelChanged', {
                    level: this.batteryLevel
                });
            }
        }, drainRates[this.powerMode]);
    }

    stopBatteryDrain() {
        if (this.drainInterval) {
            clearInterval(this.drainInterval);
            this.drainInterval = null;
        }
    }

    updateBatteryStats() {
        if (this.batteryLevel < 20) {
            this.temperature = Math.max(65, this.temperature - 0.1);
            this.voltage = Math.max(11.8, this.voltage - 0.001);
        } else {
            this.temperature = 72 + Math.random() * 4 - 2;
            this.voltage = 12.6 + Math.random() * 0.2 - 0.1;
        }

        if (Math.random() < 0.001) {
            this.batteryHealth = Math.max(85, this.batteryHealth - 0.1);
        }
    }

    // =================================
    // ACTIONS
    // =================================

    rechargeBattery() {
        this.batteryLevel = 100;
        this.isCharging = false;
        this.temperature = 75;
        this.voltage = 12.8;
        this.chargeCycles++;
        this.warningShown.twenty = false;
        this.warningShown.five = false;
        this.updateBatteryIcon();
        this.hideBatteryDialog();
        this.saveSettings();

        ElxaUI.showMessage('Battery recharged to 100%!', 'success');

        this.eventBus.emit('battery.recharged');
    }

    calibrateBattery() {
        ElxaUI.showMessage('Calibrating battery... Please wait', 'info');

        setTimeout(() => {
            this.batteryHealth = Math.min(100, this.batteryHealth + 2);
            this.voltage = 12.7;
            this.saveSettings();
            ElxaUI.showMessage('Battery calibration complete! Health improved.', 'success');

            // Refresh dialog if open
            if (this._batteryWindowId) {
                this.showBatteryDialog();
            }
        }, 3000);
    }

    setPowerMode(mode) {
        this.powerMode = mode;
        this.stopBatteryDrain();
        this.startBatteryDrain();
        this.saveSettings();
        ElxaUI.showMessage(`Power mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`, 'info');

        // Refresh dialog if open
        if (this._batteryWindowId) {
            this.showBatteryDialog();
        }
    }

    // =================================
    // SYSTEM TRAY ICON
    // =================================

    updateBatteryIcon() {
        const batteryIcon = document.getElementById('batteryIcon');
        if (!batteryIcon) return;

        const iconSpan = batteryIcon.querySelector('.mdi');
        if (!iconSpan) return;

        let mdiClass;
        if (this.batteryLevel > 80) {
            mdiClass = 'mdi-battery';
        } else if (this.batteryLevel > 60) {
            mdiClass = 'mdi-battery-70';
        } else if (this.batteryLevel > 40) {
            mdiClass = 'mdi-battery-50';
        } else if (this.batteryLevel > 20) {
            mdiClass = 'mdi-battery-30';
        } else if (this.batteryLevel > 5) {
            mdiClass = 'mdi-battery-10';
        } else {
            mdiClass = 'mdi-battery-alert';
        }

        iconSpan.className = `mdi ${mdiClass} elxa-icon-ui`;
        batteryIcon.title = `Battery: ${this.batteryLevel}% | Health: ${this.batteryHealth.toFixed(1)}% | ${this.powerMode.charAt(0).toUpperCase() + this.powerMode.slice(1)} Mode`;
    }

    // =================================
    // BATTERY WARNINGS
    // =================================

    checkBatteryWarnings() {
        if (this.batteryLevel <= 0) {
            this.forcedShutdown();
        } else if (this.batteryLevel <= 5 && !this.warningShown.five) {
            this.showBatteryDialog(true, 'Critical Battery Warning',
                `Battery is critically low at ${this.batteryLevel}%! System will shut down soon if not recharged.`);
            this.warningShown.five = true;
        } else if (this.batteryLevel <= 20 && !this.warningShown.twenty) {
            this.showBatteryDialog(true, 'Low Battery Warning',
                `Battery is at ${this.batteryLevel}%. Consider switching to Power Saver mode or recharging soon.`);
            this.warningShown.twenty = true;
        }
    }

    // =================================
    // BATTERY DIALOG
    // =================================

    showBatteryDialog(isWarning = false, title = 'Battery Center', message = '') {
        this.hideBatteryDialog();

        const healthClass = this.batteryHealth >= 95 ? 'bdialog-health-good'
                          : this.batteryHealth >= 85 ? 'bdialog-health-ok'
                          : this.batteryHealth >= 70 ? 'bdialog-health-warn'
                          : 'bdialog-health-bad';

        const modeClass = `bdialog-mode-color-${this.powerMode}`;

        const fillClass = this.batteryLevel > 25 ? 'bdialog-fill-good'
                        : this.batteryLevel > 5 ? 'bdialog-fill-warn'
                        : 'bdialog-fill-critical';

        const content = `
            <div class="bdialog-body">
                ${isWarning ? `<div class="bdialog-warning">${message}</div>` : ''}

                <div class="bdialog-main">
                    <div class="bdialog-visual">
                        <div class="bdialog-icon">${ElxaIcons.renderAction(this.batteryLevel > 5 ? 'battery-charging' : 'power-off')}</div>
                        <div class="bdialog-percentage">${this.batteryLevel}%</div>
                        <div class="bdialog-level-bar">
                            <div class="bdialog-level-fill ${fillClass}" style="width: ${this.batteryLevel}%"></div>
                        </div>
                    </div>

                    <div class="bdialog-stats">
                        <div class="bdialog-stat">
                            <span class="bdialog-stat-label">${ElxaIcons.renderAction('heart-pulse')} Health:</span>
                            <span class="bdialog-stat-value ${healthClass}">${this.batteryHealth.toFixed(1)}%</span>
                        </div>
                        <div class="bdialog-stat">
                            <span class="bdialog-stat-label">${ElxaIcons.renderAction('lightning-bolt')} Power Mode:</span>
                            <span class="bdialog-stat-value ${modeClass}">${this.powerMode.charAt(0).toUpperCase() + this.powerMode.slice(1)}</span>
                        </div>
                        <div class="bdialog-stat">
                            <span class="bdialog-stat-label">${ElxaIcons.renderAction('thermometer')} Temperature:</span>
                            <span class="bdialog-stat-value">${this.temperature.toFixed(1)}°F</span>
                        </div>
                    </div>
                </div>

                ${!isWarning ? this.generateTabsHTML() : ''}

                <div class="bdialog-controls">
                    <button class="bdialog-btn bdialog-btn-recharge" id="bdialogRechargeBtn">
                        ${ElxaIcons.renderAction('lightning-bolt')} Recharge Battery
                    </button>
                    ${!isWarning ? `<button class="bdialog-btn bdialog-btn-calibrate" id="bdialogCalibrateBtn">${ElxaIcons.renderAction('wrench')} Calibrate</button>` : ''}
                </div>
            </div>
        `;

        // Use WindowManager for proper draggable window
        const windowId = 'battery-center-' + Date.now();
        this._batteryWindowId = windowId;

        elxaOS.windowManager.createWindow(
            windowId,
            ElxaIcons.renderAction('battery-charging') + ' ' + title,
            content,
            { width: '600px', height: '550px', x: '120px', y: '60px' }
        );

        // Clean up when window is closed via titlebar X
        this._onBatteryWindowClosed = (data) => {
            if (data.id === windowId) {
                this._batteryWindowId = null;
                elxaOS.eventBus.off('window.closed', this._onBatteryWindowClosed);
                this._onBatteryWindowClosed = null;
            }
        };
        elxaOS.eventBus.on('window.closed', this._onBatteryWindowClosed);

        // Wire buttons inside the window
        const winEl = document.getElementById('window-' + windowId);
        if (winEl) {
            winEl.querySelector('#bdialogRechargeBtn').addEventListener('click', () => this.rechargeBattery());

            if (!isWarning) {
                winEl.querySelector('#bdialogCalibrateBtn').addEventListener('click', () => this.calibrateBattery());
                this.setupTabs(winEl);
            }
        }
    }

    generateTabsHTML() {
        return `
            <div class="bdialog-tabs">
                <div class="bdialog-tab bdialog-tab-active" data-panel="details">${ElxaIcons.renderAction('information')} Details</div>
                <div class="bdialog-tab" data-panel="settings">${ElxaIcons.renderAction('settings')} Settings</div>
                <div class="bdialog-tab" data-panel="history">${ElxaIcons.renderAction('history')} History</div>
            </div>

            <div class="bdialog-content">
                <div class="bdialog-panel bdialog-panel-active" id="bdialog-details">
                    ${this.generateDetailsHTML()}
                </div>

                <div class="bdialog-panel" id="bdialog-settings">
                    ${this.generateSettingsHTML()}
                </div>

                <div class="bdialog-panel" id="bdialog-history">
                    ${this.generateHistoryHTML()}
                </div>
            </div>
        `;
    }

    generateDetailsHTML() {
        return `
            <div class="bdialog-details-grid">
                <div class="bdialog-detail">
                    <span class="bdialog-detail-label">Voltage:</span>
                    <span class="bdialog-detail-value">${this.voltage.toFixed(2)}V</span>
                </div>
                <div class="bdialog-detail">
                    <span class="bdialog-detail-label">Capacity:</span>
                    <span class="bdialog-detail-value">${this.capacity} mAh</span>
                </div>
                <div class="bdialog-detail">
                    <span class="bdialog-detail-label">Charge Cycles:</span>
                    <span class="bdialog-detail-value">${this.chargeCycles}</span>
                </div>
                <div class="bdialog-detail">
                    <span class="bdialog-detail-label">Battery Age:</span>
                    <span class="bdialog-detail-value">${this.batteryAge} months</span>
                </div>
                <div class="bdialog-detail">
                    <span class="bdialog-detail-label">Type:</span>
                    <span class="bdialog-detail-value">${this.batteryType}</span>
                </div>
                <div class="bdialog-detail">
                    <span class="bdialog-detail-label">Manufactured:</span>
                    <span class="bdialog-detail-value">${this.manufactureDate}</span>
                </div>
            </div>

            <div class="bdialog-cells">
                <div class="bdialog-cells-title">Battery Cells Status:</div>
                <div class="bdialog-cells-grid">
                    ${Array.from({length: 6}, (_, i) => `
                        <div class="bdialog-cell ${this.batteryLevel > (i * 16) ? 'bdialog-cell-good' : 'bdialog-cell-empty'}">
                            <div class="bdialog-cell-label">Cell ${i + 1}</div>
                            <div class="bdialog-cell-voltage">${(this.voltage + (Math.random() * 0.1 - 0.05)).toFixed(2)}V</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    generateSettingsHTML() {
        return `
            <div class="bdialog-section">
                <h4 class="bdialog-section-title">Power Management</h4>
                <div class="bdialog-modes">
                    <div class="bdialog-mode ${this.powerMode === 'performance' ? 'bdialog-mode-active' : ''}" data-mode="performance">
                        <div class="bdialog-mode-icon">${ElxaIcons.renderAction('rocket')}</div>
                        <div class="bdialog-mode-name">Performance</div>
                        <div class="bdialog-mode-desc">Maximum power, faster drain</div>
                    </div>
                    <div class="bdialog-mode ${this.powerMode === 'balanced' ? 'bdialog-mode-active' : ''}" data-mode="balanced">
                        <div class="bdialog-mode-icon">${ElxaIcons.renderAction('scale-balance')}</div>
                        <div class="bdialog-mode-name">Balanced</div>
                        <div class="bdialog-mode-desc">Good performance and battery life</div>
                    </div>
                    <div class="bdialog-mode ${this.powerMode === 'powersaver' ? 'bdialog-mode-active' : ''}" data-mode="powersaver">
                        <div class="bdialog-mode-icon">${ElxaIcons.renderAction('shield-lock')}</div>
                        <div class="bdialog-mode-name">Power Saver</div>
                        <div class="bdialog-mode-desc">Longer battery life, reduced performance</div>
                    </div>
                </div>
            </div>

            <div class="bdialog-section">
                <h4 class="bdialog-section-title">Battery Notifications</h4>
                <label class="bdialog-setting">
                    <input type="checkbox" checked> Low battery warning at 20%
                </label>
                <label class="bdialog-setting">
                    <input type="checkbox" checked> Critical battery warning at 5%
                </label>
            </div>
        `;
    }

    generateHistoryHTML() {
        return `
            <div class="bdialog-history-stats">
                <div class="bdialog-stat-card">
                    <div class="bdialog-stat-number">${this.chargeCycles}</div>
                    <div class="bdialog-stat-card-label">Charge Cycles</div>
                </div>
                <div class="bdialog-stat-card">
                    <div class="bdialog-stat-number">${this.batteryHealth.toFixed(1)}%</div>
                    <div class="bdialog-stat-card-label">Health Remaining</div>
                </div>
                <div class="bdialog-stat-card">
                    <div class="bdialog-stat-number">${this.batteryAge}</div>
                    <div class="bdialog-stat-card-label">Months Old</div>
                </div>
            </div>

            <div class="bdialog-tips">
                <h4 class="bdialog-tips-title">${ElxaIcons.renderAction('information')} Battery Tips:</h4>
                <ul>
                    <li>Avoid letting battery drop to 0% frequently</li>
                    <li>Use Power Saver mode to extend battery life</li>
                    <li>Keep your device cool for better battery health</li>
                    <li>Calibrate your battery monthly for best performance</li>
                    <li>Replace battery when health drops below 80%</li>
                </ul>
            </div>
        `;
    }

    setupTabs(dialog) {
        const tabs = dialog.querySelectorAll('.bdialog-tab');
        const panels = dialog.querySelectorAll('.bdialog-panel');

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.stopPropagation();
                const targetPanel = 'bdialog-' + tab.dataset.panel;

                tabs.forEach(t => t.classList.remove('bdialog-tab-active'));
                panels.forEach(p => p.classList.remove('bdialog-panel-active'));

                tab.classList.add('bdialog-tab-active');
                const panel = dialog.querySelector('#' + targetPanel);
                if (panel) {
                    panel.classList.add('bdialog-panel-active');
                }
            });
        });

        // Wire power mode buttons
        const modeButtons = dialog.querySelectorAll('.bdialog-mode[data-mode]');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setPowerMode(btn.dataset.mode);
            });
        });
    }

    hideBatteryDialog() {
        if (this._batteryWindowId) {
            elxaOS.windowManager.closeWindow(this._batteryWindowId);
            this._batteryWindowId = null;
        }
    }

    // =================================
    // FORCED SHUTDOWN
    // =================================

    forcedShutdown() {
        this.stopBatteryDrain();

        const shutdownOverlay = document.createElement('div');
        shutdownOverlay.className = 'bdialog-shutdown-overlay';
        shutdownOverlay.innerHTML = `
            <div class="bdialog-shutdown-content">
                <div class="bdialog-shutdown-icon">${ElxaIcons.renderAction('power-off')}</div>
                <div class="bdialog-shutdown-title">BATTERY DEPLETED</div>
                <div class="bdialog-shutdown-subtitle">SYSTEM SHUTDOWN</div>
                <div class="bdialog-shutdown-message">
                    ElxaOS will restart in 3 seconds...<br>
                    Remember to recharge your battery!
                </div>
            </div>
        `;

        document.body.appendChild(shutdownOverlay);

        this.eventBus.emit('system.forcedShutdown', { reason: 'battery' });

        setTimeout(() => {
            location.reload();
        }, 3000);
    }

    // =================================
    // PERSISTENCE
    // =================================

    saveSettings() {
        try {
            const data = {
                powerMode: this.powerMode,
                batteryHealth: this.batteryHealth,
                chargeCycles: this.chargeCycles
            };
            localStorage.setItem('elxaOS-battery', JSON.stringify(data));
        } catch (error) {
            console.error('❌ Failed to save battery settings:', error);
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('elxaOS-battery');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.powerMode) this.powerMode = data.powerMode;
                if (data.batteryHealth) this.batteryHealth = data.batteryHealth;
                if (data.chargeCycles) this.chargeCycles = data.chargeCycles;
                console.log('🔋 Battery settings loaded');
            }
        } catch (error) {
            console.error('❌ Failed to load battery settings:', error);
        }
    }

    // =================================
    // CLEANUP
    // =================================

    destroy() {
        this.stopBatteryDrain();
        this.hideBatteryDialog();
        if (this._onBatteryWindowClosed) {
            elxaOS.eventBus.off('window.closed', this._onBatteryWindowClosed);
            this._onBatteryWindowClosed = null;
        }
    }

    // =================================
    // DEBUG
    // =================================

    setBatteryLevel(level) {
        this.batteryLevel = Math.max(0, Math.min(100, level));
        this.updateBatteryIcon();
        this.checkBatteryWarnings();
    }
}
