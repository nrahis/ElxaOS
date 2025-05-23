// =================================
// BATTERY SERVICE
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
        // Drain battery by 1% every 30 seconds (realistic for an 8-year-old's attention span)
        this.drainInterval = setInterval(() => {
            if (!this.isCharging && this.batteryLevel > 0) {
                this.batteryLevel--;
                this.updateBatteryIcon();
                this.checkBatteryWarnings();
                
                // Emit battery level change event
                this.eventBus.emit('battery.levelChanged', {
                    level: this.batteryLevel
                });
            }
        }, 30000); // 30 seconds
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
        this.warningShown.twenty = false;
        this.warningShown.five = false;
        this.updateBatteryIcon();
        this.hideBatteryDialog();
        
        // Show success message
        this.showMessage('Battery recharged to 100%!', 'success');
        
        this.eventBus.emit('battery.recharged');
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

        // Update tooltip
        batteryIcon.title = `Battery: ${this.batteryLevel}%`;
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
            `Battery is at ${this.batteryLevel}%. Please recharge soon.`);
    }

    showCriticalBatteryWarning() {
        this.showBatteryDialog(true, 'Critical Battery Warning', 
            `Battery is critically low at ${this.batteryLevel}%! System will shut down soon if not recharged.`);
    }

    showBatteryDialog(isWarning = false, title = 'Battery Status', message = '') {
        // Remove existing dialog if present
        this.hideBatteryDialog();

        const dialog = document.createElement('div');
        dialog.id = 'batteryDialog';
        dialog.className = 'system-dialog battery-dialog';
        
        const displayMessage = message || `Current battery level: ${this.batteryLevel}%`;
        const warningClass = isWarning ? (this.batteryLevel <= 5 ? 'critical' : 'warning') : '';

        dialog.innerHTML = `
            <div class="dialog-content ${warningClass}">
                <div class="dialog-header">
                    <div class="dialog-title">${title}</div>
                    <div class="dialog-close" onclick="elxaOS.batteryService.hideBatteryDialog()">×</div>
                </div>
                <div class="dialog-body">
                    <div class="battery-display">
                        <div class="battery-icon-large">${this.batteryLevel > 5 ? '🔋' : '🪫'}</div>
                        <div class="battery-percentage">${this.batteryLevel}%</div>
                    </div>
                    <div class="battery-message">${displayMessage}</div>
                    <div class="battery-controls">
                        <button class="recharge-button" onclick="elxaOS.batteryService.rechargeBattery()">
                            ⚡ Recharge Battery
                        </button>
                        ${!isWarning ? '<button class="dialog-button" onclick="elxaOS.batteryService.hideBatteryDialog()">OK</button>' : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        // Auto-hide non-warning dialogs after 5 seconds
        if (!isWarning) {
            setTimeout(() => {
                this.hideBatteryDialog();
            }, 5000);
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
            background: ${type === 'success' ? '#00ff00' : '#ffff00'};
            color: black;
            padding: 8px 16px;
            border: 2px outset #c0c0c0;
            z-index: 3000;
            font-weight: bold;
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
                    ElxaOS will restart in 3 seconds...
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
                this.updateBatteryIcon();
                this.checkBatteryWarnings();
            }
        }, 2000);
    }
}