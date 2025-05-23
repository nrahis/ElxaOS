// =================================
// WIFI SERVICE
// =================================
class WiFiService {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.isConnected = false;
        this.currentNetwork = null;
        this.signalStrength = 0;
        this.availableNetworks = [
            { name: 'ElxaNet', password: null, signalStrength: 5, type: 'open' },
            { name: 'HomeWiFi', password: 'password123', signalStrength: 4, type: 'secured' },
            { name: 'GuestNetwork', password: null, signalStrength: 3, type: 'open' },
            { name: 'SecureNet', password: 'admin2024', signalStrength: 3, type: 'secured' },
            { name: 'CoffeeShop_WiFi', password: null, signalStrength: 2, type: 'open' },
            { name: 'NeighborNet', password: 'dontguess', signalStrength: 1, type: 'secured' }
        ];
        this.userNetworks = []; // Networks created by user
        this.connectionAttempts = new Map(); // Track failed attempts
        
        // LOAD SAVED DATA FIRST
        this.loadWiFiData();
        
        this.setupEvents();
        this.updateWiFiIcon();
        this.startNetworkScan();
    }

    setupEvents() {
        // Listen for WiFi icon clicks
        this.eventBus.on('wifi.click', () => {
            this.showWiFiDialog();
        });

        // Listen for connection requests
        this.eventBus.on('wifi.connect', (data) => {
            this.connectToNetwork(data.network, data.password);
        });

        // Listen for disconnect requests
        this.eventBus.on('wifi.disconnect', () => {
            this.disconnect();
        });

        // Listen for new network creation
        this.eventBus.on('wifi.createNetwork', (data) => {
            this.createUserNetwork(data.name, data.password);
        });
    }

    startNetworkScan() {
        // Simulate periodic network scanning and signal changes
        setInterval(() => {
            this.updateNetworkSignals();
            if (this.isConnected && this.currentNetwork) {
                // Occasionally simulate connection issues
                if (Math.random() < 0.05) { // 5% chance
                    this.simulateConnectionIssue();
                }
            }
        }, 10000); // Every 10 seconds
    }

    updateNetworkSignals() {
        // Randomly fluctuate signal strengths slightly
        this.availableNetworks.forEach(network => {
            const change = Math.random() - 0.5; // -0.5 to +0.5
            network.signalStrength = Math.max(1, Math.min(5, network.signalStrength + change));
        });

        this.userNetworks.forEach(network => {
            const change = Math.random() - 0.5;
            network.signalStrength = Math.max(1, Math.min(5, network.signalStrength + change));
        });

        if (this.isConnected) {
            this.signalStrength = this.currentNetwork.signalStrength;
            this.updateWiFiIcon();
        }
    }

    updateWiFiIcon() {
        const wifiIcon = document.getElementById('wifiIcon');
        if (!wifiIcon) return;

        if (!this.isConnected) {
            wifiIcon.textContent = '📶';
            wifiIcon.style.color = '#666';
            wifiIcon.title = 'WiFi: Disconnected';
        } else {
            // Update icon based on signal strength
            const strength = Math.round(this.signalStrength);
            if (strength >= 4) {
                wifiIcon.textContent = '📶';
                wifiIcon.style.color = '#00ff00';
            } else if (strength >= 3) {
                wifiIcon.textContent = '📶';
                wifiIcon.style.color = '#ffff00';
            } else if (strength >= 2) {
                wifiIcon.textContent = '📶';
                wifiIcon.style.color = '#ff8800';
            } else {
                wifiIcon.textContent = '📶';
                wifiIcon.style.color = '#ff0000';
            }
            wifiIcon.title = `WiFi: Connected to ${this.currentNetwork.name} (${strength}/5 bars)`;
        }
    }

    getAllNetworks() {
        return [...this.availableNetworks, ...this.userNetworks]
            .sort((a, b) => b.signalStrength - a.signalStrength);
    }

    showWiFiDialog() {
        // Remove existing dialog if present
        this.hideWiFiDialog();

        const dialog = document.createElement('div');
        dialog.id = 'wifiDialog';
        dialog.className = 'system-dialog wifi-dialog';
        
        const networks = this.getAllNetworks();
        const networkListHtml = networks.map(network => {
            const isConnected = this.isConnected && this.currentNetwork.name === network.name;
            const signalBars = '█'.repeat(Math.round(network.signalStrength)) + '░'.repeat(5 - Math.round(network.signalStrength));
            const lockIcon = network.type === 'secured' ? '🔒' : '';
            const connectedIcon = isConnected ? '✓' : '';
            
            return `
                <div class="network-item ${isConnected ? 'connected' : ''}" data-network='${JSON.stringify(network)}'>
                    <div class="network-info">
                        <div class="network-name">${connectedIcon} ${network.name} ${lockIcon}</div>
                        <div class="network-signal">${signalBars}</div>
                    </div>
                    <div class="network-actions">
                        ${isConnected ? 
                            '<button class="disconnect-btn" onclick="elxaOS.wifiService.disconnect()">Disconnect</button>' :
                            '<button class="connect-btn" onclick="elxaOS.wifiService.connectFromDialog(this)">Connect</button>'
                        }
                    </div>
                </div>
            `;
        }).join('');

        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <div class="dialog-title">WiFi Networks</div>
                    <div class="dialog-close" onclick="elxaOS.wifiService.hideWiFiDialog()">×</div>
                </div>
                <div class="dialog-body">
                    <div class="wifi-status">
                        Status: ${this.isConnected ? `Connected to ${this.currentNetwork.name}` : 'Disconnected'}
                    </div>
                    <div class="network-list">
                        ${networkListHtml}
                    </div>
                    <div class="wifi-controls">
                        <button class="create-network-btn" onclick="elxaOS.wifiService.showCreateNetworkDialog()">
                            📡 Create Network
                        </button>
                        <button class="refresh-btn" onclick="elxaOS.wifiService.refreshNetworks()">
                            🔄 Refresh
                        </button>
                        <button class="dialog-button" onclick="elxaOS.wifiService.hideWiFiDialog()">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
    }

    hideWiFiDialog() {
        const dialog = document.getElementById('wifiDialog');
        if (dialog) {
            dialog.remove();
        }
    }

    connectFromDialog(button) {
        const networkItem = button.closest('.network-item');
        const network = JSON.parse(networkItem.dataset.network);
        
        if (network.type === 'secured') {
            this.showPasswordDialog(network);
        } else {
            this.connectToNetwork(network);
        }
    }

    showPasswordDialog(network) {
        const passwordDialog = document.createElement('div');
        passwordDialog.id = 'passwordDialog';
        passwordDialog.className = 'system-dialog password-dialog';
        
        passwordDialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <div class="dialog-title">Enter Password</div>
                    <div class="dialog-close" onclick="document.getElementById('passwordDialog').remove()">×</div>
                </div>
                <div class="dialog-body">
                    <div class="password-prompt">
                        Enter password for "${network.name}":
                    </div>
                    <input type="password" id="networkPassword" class="password-input" placeholder="Password">
                    <div class="password-controls">
                        <button class="connect-btn" onclick="elxaOS.wifiService.connectWithPassword('${network.name}')">Connect</button>
                        <button class="dialog-button" onclick="document.getElementById('passwordDialog').remove()">Cancel</button>
                    </div>
                    <div class="password-hint" style="font-size: 9px; color: #666; margin-top: 8px;">
                        Hint: Try common passwords like "password123" or "admin2024"
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(passwordDialog);
        document.getElementById('networkPassword').focus();
        
        // Allow Enter key to connect
        document.getElementById('networkPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.connectWithPassword(network.name);
            }
        });
    }

    connectWithPassword(networkName) {
        const password = document.getElementById('networkPassword').value;
        const network = this.getAllNetworks().find(n => n.name === networkName);
        
        document.getElementById('passwordDialog').remove();
        this.connectToNetwork(network, password);
    }

    connectToNetwork(network, password = null) {
        // Show connecting animation
        this.showMessage('Connecting...', 'info');
        
        setTimeout(() => {
            let success = false;
            
            if (network.type === 'open') {
                success = true;
            } else if (network.type === 'secured') {
                // Check if password is correct
                success = password === network.password;
                
                if (!success) {
                    // Track failed attempts
                    const attempts = this.connectionAttempts.get(network.name) || 0;
                    this.connectionAttempts.set(network.name, attempts + 1);
                    
                    if (attempts >= 2) {
                        this.showMessage(`Too many failed attempts for ${network.name}`, 'error');
                        return;
                    } else {
                        this.showMessage('Incorrect password', 'error');
                        return;
                    }
                }
            }

            if (success) {
                // Disconnect from current network if connected
                if (this.isConnected) {
                    this.disconnect(false);
                }
                
                this.isConnected = true;
                this.saveWiFiData();
                this.currentNetwork = network;
                this.signalStrength = network.signalStrength;
                this.connectionAttempts.delete(network.name); // Reset failed attempts
                
                this.updateWiFiIcon();
                this.showMessage(`Connected to ${network.name}`, 'success');
                this.hideWiFiDialog();
                
                // Emit connection event for other services
                this.eventBus.emit('wifi.connected', {
                    network: network.name,
                    signalStrength: this.signalStrength
                });
            }
        }, 1500); // Simulate connection delay
    }

    disconnect(showMessage = true) {
        if (this.isConnected) {
            const networkName = this.currentNetwork.name;
            this.isConnected = false;
            this.saveWiFiData();
            this.currentNetwork = null;
            this.signalStrength = 0;
            
            this.updateWiFiIcon();
            if (showMessage) {
                this.showMessage(`Disconnected from ${networkName}`, 'info');
            }
            
            // Emit disconnection event
            this.eventBus.emit('wifi.disconnected');
            
            // Refresh dialog if open
            if (document.getElementById('wifiDialog')) {
                this.showWiFiDialog();
            }
        }
    }

    showCreateNetworkDialog() {
        const createDialog = document.createElement('div');
        createDialog.id = 'createNetworkDialog';
        createDialog.className = 'system-dialog create-network-dialog';
        
        createDialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <div class="dialog-title">Create Network</div>
                    <div class="dialog-close" onclick="document.getElementById('createNetworkDialog').remove()">×</div>
                </div>
                <div class="dialog-body">
                    <div class="create-network-form">
                        <label>Network Name:</label>
                        <input type="text" id="newNetworkName" class="network-input" placeholder="My Network" maxlength="32">
                        
                        <label>
                            <input type="checkbox" id="usePassword"> Password Protected
                        </label>
                        
                        <div id="passwordSection" style="display: none;">
                            <label>Password:</label>
                            <input type="password" id="newNetworkPassword" class="network-input" placeholder="Enter password">
                        </div>
                        
                        <div class="create-controls">
                            <button class="create-btn" onclick="elxaOS.wifiService.createNetworkFromDialog()">Create</button>
                            <button class="dialog-button" onclick="document.getElementById('createNetworkDialog').remove()">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(createDialog);
        document.getElementById('newNetworkName').focus();
        
        // Toggle password section
        document.getElementById('usePassword').addEventListener('change', (e) => {
            const passwordSection = document.getElementById('passwordSection');
            passwordSection.style.display = e.target.checked ? 'block' : 'none';
        });
    }

    createNetworkFromDialog() {
        const name = document.getElementById('newNetworkName').value.trim();
        const usePassword = document.getElementById('usePassword').checked;
        const password = usePassword ? document.getElementById('newNetworkPassword').value : null;
        
        if (!name) {
            this.showMessage('Please enter a network name', 'error');
            return;
        }
        
        if (usePassword && !password) {
            this.showMessage('Please enter a password', 'error');
            return;
        }
        
        // Check if network name already exists
        if (this.getAllNetworks().some(n => n.name === name)) {
            this.showMessage('Network name already exists', 'error');
            return;
        }
        
        this.createUserNetwork(name, password);
        document.getElementById('createNetworkDialog').remove();
    }

    createUserNetwork(name, password = null) {
        const newNetwork = {
            name: name,
            password: password,
            signalStrength: 4 + Math.random(), // Strong signal for user networks
            type: password ? 'secured' : 'open',
            isUserCreated: true
        };
        
        this.userNetworks.push(newNetwork);
        
        // SAVE AFTER CREATING NETWORK
        this.saveWiFiData();
        
        this.showMessage(`Network "${name}" created!`, 'success');
        
        // Refresh WiFi dialog if open
        if (document.getElementById('wifiDialog')) {
            this.showWiFiDialog();
        }
        
        this.eventBus.emit('wifi.networkCreated', { network: newNetwork });
    }

    refreshNetworks() {
        this.showMessage('Scanning for networks...', 'info');
        
        setTimeout(() => {
            // Simulate finding new networks occasionally
            if (Math.random() < 0.3) {
                const randomNames = ['PublicWiFi', 'Hotel_Guest', 'Airport_Free', 'Library_WiFi'];
                const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
                
                if (!this.getAllNetworks().some(n => n.name === randomName)) {
                    this.availableNetworks.push({
                        name: randomName,
                        password: null,
                        signalStrength: 1 + Math.random() * 3,
                        type: 'open'
                    });
                }
            }
            
            this.updateNetworkSignals();
            this.showWiFiDialog(); // Refresh the dialog
            this.showMessage('Network scan complete', 'success');
        }, 2000);
    }

    simulateConnectionIssue() {
        if (this.isConnected && Math.random() < 0.5) {
            this.showMessage(`Connection to ${this.currentNetwork.name} unstable`, 'warning');
            
            // Temporarily reduce signal strength
            this.signalStrength = Math.max(1, this.signalStrength - 1);
            this.updateWiFiIcon();
            
            // Restore after a few seconds
            setTimeout(() => {
                if (this.isConnected) {
                    this.signalStrength = this.currentNetwork.signalStrength;
                    this.updateWiFiIcon();
                }
            }, 5000);
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
            z-index: 3000;
            font-weight: bold;
            font-size: 11px;
        `;

        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    // API methods for other services to check connectivity
    isOnline() {
        return this.isConnected;
    }

    getConnectionInfo() {
        if (!this.isConnected) return null;
        
        return {
            network: this.currentNetwork.name,
            signalStrength: this.signalStrength,
            type: this.currentNetwork.type
        };
    }

    // Debug methods
    forceDisconnect() {
        this.disconnect();
    }

    setSignalStrength(strength) {
        if (this.isConnected) {
            this.signalStrength = Math.max(1, Math.min(5, strength));
            this.currentNetwork.signalStrength = this.signalStrength;
            this.updateWiFiIcon();
        }
    }

    // =================================
// WIFI SERVICE - PERSISTENCE METHODS
// =================================

    // NEW: Save WiFi data to localStorage
    saveWiFiData() {
        try {
            const wifiData = {
                userNetworks: this.userNetworks,
                isConnected: this.isConnected,
                currentNetwork: this.currentNetwork,
                signalStrength: this.signalStrength
            };
            localStorage.setItem('elxaOS-wifi', JSON.stringify(wifiData));
            console.log('📶 WiFi data saved to localStorage');
        } catch (error) {
            console.error('❌ Failed to save WiFi data:', error);
        }
    }

    // NEW: Load WiFi data from localStorage
    loadWiFiData() {
        try {
            const saved = localStorage.getItem('elxaOS-wifi');
            if (saved) {
                const wifiData = JSON.parse(saved);
                
                // Restore user networks
                if (wifiData.userNetworks && Array.isArray(wifiData.userNetworks)) {
                    this.userNetworks = wifiData.userNetworks;
                    console.log(`📶 Loaded ${this.userNetworks.length} user networks`);
                }
                
                // Restore connection state (optional - you might want to start disconnected)
                if (wifiData.isConnected && wifiData.currentNetwork) {
                    // Find the network in our available or user networks
                    const network = this.getAllNetworks().find(n => n.name === wifiData.currentNetwork.name);
                    if (network) {
                        this.isConnected = true;
                        this.currentNetwork = network;
                        this.signalStrength = wifiData.signalStrength || network.signalStrength;
                        console.log(`📶 Restored connection to ${network.name}`);
                    }
                }
                
                console.log('📶 WiFi data loaded from localStorage');
            } else {
                console.log('📶 No saved WiFi data found, using defaults');
            }
        } catch (error) {
            console.error('❌ Failed to load WiFi data:', error);
        }
    }

    // NEW: Clear WiFi data (for testing)
    clearWiFiData() {
        localStorage.removeItem('elxaOS-wifi');
        this.userNetworks = [];
        this.isConnected = false;
        this.currentNetwork = null;
        this.signalStrength = 0;
        this.updateWiFiIcon();
        console.log('🗑️ WiFi data cleared');
    }
}