// =================================
// ENHANCED BATTERY SERVICE - UPDATED FOR NEW CSS
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
        
        // Enhanced battery properties for pretend play
        this.batteryHealth = 98;
        this.temperature = 72; // Fahrenheit
        this.voltage = 12.6;
        this.chargeCycles = 47;
        this.powerMode = 'balanced'; // balanced, performance, powersaver
        this.batteryAge = 8; // months
        this.batteryType = 'Lithium-Ion';
        this.capacity = 5000; // mAh
        this.manufactureDate = 'March 2024';
        
        this.setupEvents();
        this.startBatteryDrain();
        this.updateBatteryIcon();
    }

    setupEvents() {
        // Listen for battery icon clicks
        this.eventBus.on('battery.click', () => {
            this.showBatteryDialog();
        });

        // Listen for recharge events
        this.eventBus.on('battery.recharge', () => {
            this.rechargeBattery();
        });
    }

    startBatteryDrain() {
        // Different drain rates based on power mode
        const drainRates = {
            performance: 25000, // 25 seconds (faster drain)
            balanced: 30000,    // 30 seconds (normal)
            powersaver: 45000   // 45 seconds (slower drain)
        };

        this.drainInterval = setInterval(() => {
            if (!this.isCharging && this.batteryLevel > 0) {
                this.batteryLevel--;
                this.updateBatteryStats();
                this.updateBatteryIcon();
                this.checkBatteryWarnings();
                
                // Emit battery level change event
                this.eventBus.emit('battery.levelChanged', {
                    level: this.batteryLevel
                });
            }
        }, drainRates[this.powerMode]);
    }

    updateBatteryStats() {
        // Simulate realistic battery behavior
        if (this.batteryLevel < 20) {
            this.temperature = Math.max(65, this.temperature - 0.1);
            this.voltage = Math.max(11.8, this.voltage - 0.001);
        } else {
            this.temperature = 72 + Math.random() * 4 - 2; // 70-74°F
            this.voltage = 12.6 + Math.random() * 0.2 - 0.1; // 12.5-12.7V
        }
        
        // Health slowly degrades over time
        if (Math.random() < 0.001) {
            this.batteryHealth = Math.max(85, this.batteryHealth - 0.1);
        }
    }

    stopBatteryDrain() {
        if (this.drainInterval) {
            clearInterval(this.drainInterval);
            this.drainInterval = null;
        }
    }

    rechargeBattery() {
        this.batteryLevel = 100;
        this.isCharging = false;
        this.temperature = 75; // Slightly warm after charging
        this.voltage = 12.8;
        this.chargeCycles++;
        this.warningShown.twenty = false;
        this.warningShown.five = false;
        this.updateBatteryIcon();
        this.hideBatteryDialog();
        
        // Show success message
        this.showMessage('Battery recharged to 100%! 🔋⚡', 'success');
        
        this.eventBus.emit('battery.recharged');
    }

    calibrateBattery() {
        this.showMessage('Calibrating battery... Please wait', 'info');
        
        setTimeout(() => {
            this.batteryHealth = Math.min(100, this.batteryHealth + 2);
            this.voltage = 12.7;
            this.showMessage('Battery calibration complete! Health improved.', 'success');
            
            // Update displays if dialog is open
            this.updateBatteryDisplays();
        }, 3000);
    }

    setPowerMode(mode) {
        this.powerMode = mode;
        this.stopBatteryDrain();
        this.startBatteryDrain();
        this.showMessage(`Power mode changed to ${mode.charAt(0).toUpperCase() + mode.slice(1)}`, 'info');
        
        // Update displays if dialog is open
        this.updateBatteryDisplays();
    }

    updateBatteryIcon() {
        const batteryIcon = document.getElementById('batteryIcon');
        if (!batteryIcon) return;

        // Update icon based on battery level
        if (this.batteryLevel > 75) {
            batteryIcon.textContent = '🔋';
            batteryIcon.style.color = '#00ff00';
        } else if (this.batteryLevel > 50) {
            batteryIcon.textContent = '🔋';
            batteryIcon.style.color = '#ffff00';
        } else if (this.batteryLevel > 25) {
            batteryIcon.textContent = '🔋';
            batteryIcon.style.color = '#ff8800';
        } else if (this.batteryLevel > 5) {
            batteryIcon.textContent = '🔋';
            batteryIcon.style.color = '#ff0000';
        } else {
            batteryIcon.textContent = '🪫';
            batteryIcon.style.color = '#ff0000';
        }

        // Update tooltip with more info
        batteryIcon.title = `Battery: ${this.batteryLevel}% | Health: ${this.batteryHealth.toFixed(1)}% | ${this.powerMode.charAt(0).toUpperCase() + this.powerMode.slice(1)} Mode`;
    }

    checkBatteryWarnings() {
        if (this.batteryLevel <= 0) {
            this.forcedShutdown();
        } else if (this.batteryLevel <= 5 && !this.warningShown.five) {
            this.showCriticalBatteryWarning();
            this.warningShown.five = true;
        } else if (this.batteryLevel <= 20 && !this.warningShown.twenty) {
            this.showLowBatteryWarning();
            this.warningShown.twenty = true;
        }
    }

    showLowBatteryWarning() {
        this.showBatteryDialog(true, 'Low Battery Warning', 
            `Battery is at ${this.batteryLevel}%. Consider switching to Power Saver mode or recharging soon.`);
    }

    showCriticalBatteryWarning() {
        this.showBatteryDialog(true, 'Critical Battery Warning', 
            `Battery is critically low at ${this.batteryLevel}%! System will shut down soon if not recharged.`);
    }

    getHealthColor() {
        if (this.batteryHealth >= 95) return '#00ff00';
        if (this.batteryHealth >= 85) return '#ffff00';
        if (this.batteryHealth >= 70) return '#ff8800';
        return '#ff0000';
    }

    getPowerModeColor() {
        switch(this.powerMode) {
            case 'performance': return '#ff4444';
            case 'balanced': return '#44ff44';
            case 'powersaver': return '#4444ff';
            default: return '#888888';
        }
    }

    getBatteryFillColor() {
        if (this.batteryLevel > 25) return '#00ff00';
        if (this.batteryLevel > 5) return '#ff8800';
        return '#ff0000';
    }

    showBatteryDialog(isWarning = false, title = 'Battery Center', message = '') {
        // Remove existing dialog if present
        this.hideBatteryDialog();

        const dialog = document.createElement('div');
        dialog.className = 'bdialog-container';
        dialog.id = 'batteryDialog';
        
        dialog.innerHTML = `
            <div class="bdialog-header">
                <div class="bdialog-title">${title}</div>
                <div class="bdialog-close" onclick="elxaOS.batteryService.hideBatteryDialog()">×</div>
            </div>
            <div class="bdialog-body">
                ${isWarning ? `<div class="bdialog-warning">${message}</div>` : ''}
                
                <div class="bdialog-main">
                    <div class="bdialog-visual">
                        <div class="bdialog-icon">${this.batteryLevel > 5 ? '🔋' : '🪫'}</div>
                        <div class="bdialog-percentage">${this.batteryLevel}%</div>
                        <div class="bdialog-level-bar">
                            <div class="bdialog-level-fill" style="width: ${this.batteryLevel}%; background: ${this.getBatteryFillColor()}"></div>
                        </div>
                    </div>
                    
                    <div class="bdialog-stats">
                        <div class="bdialog-stat">
                            <span class="bdialog-stat-label">Health:</span>
                            <span class="bdialog-stat-value" style="color: ${this.getHealthColor()}">${this.batteryHealth.toFixed(1)}%</span>
                        </div>
                        <div class="bdialog-stat">
                            <span class="bdialog-stat-label">Power Mode:</span>
                            <span class="bdialog-stat-value" style="color: ${this.getPowerModeColor()}">${this.powerMode.charAt(0).toUpperCase() + this.powerMode.slice(1)}</span>
                        </div>
                        <div class="bdialog-stat">
                            <span class="bdialog-stat-label">Temperature:</span>
                            <span class="bdialog-stat-value">${this.temperature.toFixed(1)}°F</span>
                        </div>
                    </div>
                </div>

                ${!isWarning ? this.generateTabsHTML() : ''}
                
                <div class="bdialog-controls">
                    <button class="bdialog-btn bdialog-btn-recharge" onclick="elxaOS.batteryService.rechargeBattery()">
                        ⚡ Recharge Battery
                    </button>
                    ${!isWarning ? '<button class="bdialog-btn bdialog-btn-calibrate" onclick="elxaOS.batteryService.calibrateBattery()">🔧 Calibrate</button>' : ''}
                    ${!isWarning ? '<button class="bdialog-btn bdialog-btn-close" onclick="elxaOS.batteryService.hideBatteryDialog()">Close</button>' : ''}
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        // Setup tab functionality if not warning
        if (!isWarning) {
            this.setupTabs();
        }
    }

    generateTabsHTML() {
        return `
            <div class="bdialog-tabs">
                <div class="bdialog-tab bdialog-tab-active" data-panel="details">Details</div>
                <div class="bdialog-tab" data-panel="settings">Settings</div>
                <div class="bdialog-tab" data-panel="history">History</div>
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
                    <div class="bdialog-mode ${this.powerMode === 'performance' ? 'bdialog-mode-active' : ''}" onclick="elxaOS.batteryService.setPowerMode('performance')">
                        <div class="bdialog-mode-icon">🚀</div>
                        <div class="bdialog-mode-name">Performance</div>
                        <div class="bdialog-mode-desc">Maximum power, faster drain</div>
                    </div>
                    <div class="bdialog-mode ${this.powerMode === 'balanced' ? 'bdialog-mode-active' : ''}" onclick="elxaOS.batteryService.setPowerMode('balanced')">
                        <div class="bdialog-mode-icon">⚖️</div>
                        <div class="bdialog-mode-name">Balanced</div>
                        <div class="bdialog-mode-desc">Good performance and battery life</div>
                    </div>
                    <div class="bdialog-mode ${this.powerMode === 'powersaver' ? 'bdialog-mode-active' : ''}" onclick="elxaOS.batteryService.setPowerMode('powersaver')">
                        <div class="bdialog-mode-icon">🛡️</div>
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
                <label class="bdialog-setting">
                    <input type="checkbox"> Show charging animation
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
                <h4 class="bdialog-tips-title">🔋 Battery Tips:</h4>
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

    setupTabs() {
        const tabs = document.querySelectorAll('.bdialog-tab');
        const panels = document.querySelectorAll('.bdialog-panel');

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.stopPropagation();
                const targetPanel = 'bdialog-' + tab.dataset.panel;
                
                // Remove active class from all tabs and panels
                tabs.forEach(t => t.classList.remove('bdialog-tab-active'));
                panels.forEach(p => p.classList.remove('bdialog-panel-active'));
                
                // Add active class to clicked tab and corresponding panel
                tab.classList.add('bdialog-tab-active');
                const panel = document.getElementById(targetPanel);
                if (panel) {
                    panel.classList.add('bdialog-panel-active');
                }
            });
        });
    }

    updateBatteryDisplays() {
        // Update health display
        const healthValue = document.querySelector('.bdialog-stat-value[style*="color"]');
        if (healthValue && healthValue.textContent.includes('%')) {
            healthValue.textContent = `${this.batteryHealth.toFixed(1)}%`;
            healthValue.style.color = this.getHealthColor();
        }
        
        // Update power mode display
        const modeElements = document.querySelectorAll('.bdialog-mode');
        modeElements.forEach(mode => {
            mode.classList.remove('bdialog-mode-active');
            if (mode.onclick.toString().includes(`'${this.powerMode}'`)) {
                mode.classList.add('bdialog-mode-active');
            }
        });
        
        // Update stat cards in history
        const statNumbers = document.querySelectorAll('.bdialog-stat-number');
        if (statNumbers.length >= 2) {
            statNumbers[1].textContent = `${this.batteryHealth.toFixed(1)}%`;
        }
    }

    hideBatteryDialog() {
        const dialog = document.getElementById('batteryDialog');
        if (dialog) {
            dialog.remove();
        }
    }

    showMessage(text, type = 'info') {
        const message = document.createElement('div');
        message.className = `system-message ${type}`;
        message.textContent = text;
        
        message.style.cssText = `
            position: fixed;
            top: 50px;
            right: 20px;
            background: ${type === 'success' ? '#00ff00' : type === 'info' ? '#add8e6' : '#ffff00'};
            color: black;
            padding: 8px 16px;
            border: 2px outset #c0c0c0;
            z-index: 3000;
            font-weight: bold;
            border-radius: 4px;
            box-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        `;

        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    forcedShutdown() {
        // Stop all services
        this.stopBatteryDrain();
        
        // Show shutdown screen
        const shutdownOverlay = document.createElement('div');
        shutdownOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: black;
            color: red;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            font-family: monospace;
            font-size: 24px;
        `;

        shutdownOverlay.innerHTML = `
            <div style="text-align: center;">
                🪫<br><br>
                BATTERY DEPLETED<br>
                SYSTEM SHUTDOWN<br><br>
                <div style="font-size: 16px; color: white;">
                    ElxaOS will restart in 3 seconds...<br>
                    Remember to recharge your battery! 🔌
                </div>
            </div>
        `;

        document.body.appendChild(shutdownOverlay);

        // Emit shutdown event
        this.eventBus.emit('system.forcedShutdown', { reason: 'battery' });

        // Restart after 3 seconds
        setTimeout(() => {
            location.reload();
        }, 3000);
    }

    // Debug methods for testing
    setBatteryLevel(level) {
        this.batteryLevel = Math.max(0, Math.min(100, level));
        this.updateBatteryIcon();
        this.checkBatteryWarnings();
    }

    simulateFastDrain() {
        // For testing - drain battery every 2 seconds
        this.stopBatteryDrain();
        this.drainInterval = setInterval(() => {
            if (!this.isCharging && this.batteryLevel > 0) {
                this.batteryLevel--;
                this.updateBatteryStats();
                this.updateBatteryIcon();
                this.checkBatteryWarnings();
            }
        }, 2000);
    }
}