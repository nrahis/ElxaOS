// =================================
// ENHANCED WIFI SERVICE
// =================================
class WiFiService {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.isConnected = false;
        this.currentNetwork = null;
        this.signalStrength = 0;
        this.currentTab = 'networks';
        this.connectionHistory = [];
        this.networkAnalytics = {};
        
        // Enhanced network data with more realistic properties
        this.availableNetworks = [
            { 
                name: 'ElxaNet', 
                password: null, 
                signalStrength: 5, 
                type: 'open',
                security: 'None',
                frequency: '2.4GHz',
                channel: 6,
                speed: '54 Mbps',
                encryption: 'None',
                vendor: 'Elxa Corp'
            },
            { 
                name: 'HomeWiFi', 
                password: 'password123', 
                signalStrength: 4, 
                type: 'secured',
                security: 'WPA2-PSK',
                frequency: '5GHz',
                channel: 36,
                speed: '300 Mbps',
                encryption: 'AES',
                vendor: 'Linksys'
            },
            { 
                name: 'GuestNetwork', 
                password: null, 
                signalStrength: 3, 
                type: 'open',
                security: 'None',
                frequency: '2.4GHz',
                channel: 11,
                speed: '54 Mbps',
                encryption: 'None',
                vendor: 'Netgear'
            },
            { 
                name: 'SecureNet', 
                password: 'admin2024', 
                signalStrength: 3, 
                type: 'secured',
                security: 'WPA3-PSK',
                frequency: '5GHz',
                channel: 149,
                speed: '1200 Mbps',
                encryption: 'AES-256',
                vendor: 'ASUS'
            },
            { 
                name: 'CoffeeShop_WiFi', 
                password: null, 
                signalStrength: 2, 
                type: 'open',
                security: 'None',
                frequency: '2.4GHz',
                channel: 1,
                speed: '54 Mbps',
                encryption: 'None',
                vendor: 'TP-Link'
            },
            { 
                name: 'NeighborNet', 
                password: 'dontguess', 
                signalStrength: 1, 
                type: 'secured',
                security: 'WEP',
                frequency: '2.4GHz',
                channel: 9,
                speed: '54 Mbps',
                encryption: 'WEP-64',
                vendor: 'D-Link'
            }
        ];
        
        this.userNetworks = [];
        this.connectionAttempts = new Map();
        this.isScanning = false;
        
        // Load saved data first
        this.loadWiFiData();
        this.setupEvents();
        this.updateWiFiIcon();
        this.startNetworkScan();
    }

    setupEvents() {
        this.eventBus.on('wifi.click', () => {
            this.showWiFiDialog();
        });

        this.eventBus.on('wifi.connect', (data) => {
            this.connectToNetwork(data.network, data.password);
        });

        this.eventBus.on('wifi.disconnect', () => {
            this.disconnect();
        });

        this.eventBus.on('wifi.createNetwork', (data) => {
            this.createUserNetwork(data.name, data.password, data.options);
        });
    }

    startNetworkScan() {
        setInterval(() => {
            this.updateNetworkSignals();
            this.updateNetworkAnalytics();
            
            if (this.isConnected && this.currentNetwork) {
                if (Math.random() < 0.05) {
                    this.simulateConnectionIssue();
                }
            }
        }, 8000);
    }

    updateNetworkSignals() {
        this.availableNetworks.forEach(network => {
            const change = (Math.random() - 0.5) * 0.3;
            network.signalStrength = Math.max(0.5, Math.min(5, network.signalStrength + change));
        });

        this.userNetworks.forEach(network => {
            const change = (Math.random() - 0.5) * 0.3;
            network.signalStrength = Math.max(0.5, Math.min(5, network.signalStrength + change));
        });

        if (this.isConnected) {
            this.signalStrength = this.currentNetwork.signalStrength;
            this.updateWiFiIcon();
        }
    }

    updateNetworkAnalytics() {
        const allNetworks = this.getAllNetworks();
        allNetworks.forEach(network => {
            if (!this.networkAnalytics[network.name]) {
                this.networkAnalytics[network.name] = {
                    firstSeen: Date.now(),
                    signalHistory: [],
                    connectionAttempts: 0,
                    successfulConnections: 0
                };
            }
            
            this.networkAnalytics[network.name].signalHistory.push({
                timestamp: Date.now(),
                strength: network.signalStrength
            });
            
            // Keep only last 20 readings
            if (this.networkAnalytics[network.name].signalHistory.length > 20) {
                this.networkAnalytics[network.name].signalHistory.shift();
            }
        });
    }

    updateWiFiIcon() {
        const wifiIcon = document.getElementById('wifiIcon');
        if (!wifiIcon) return;

        if (!this.isConnected) {
            wifiIcon.textContent = '📶';
            wifiIcon.style.color = '#666';
            wifiIcon.title = 'WiFi: Disconnected';
        } else {
            const strength = Math.round(this.signalStrength);
            const colors = {
                5: '#00ff00', 4: '#80ff00', 3: '#ffff00', 2: '#ff8000', 1: '#ff0000'
            };
            wifiIcon.textContent = '📶';
            wifiIcon.style.color = colors[strength] || '#ff0000';
            wifiIcon.title = `WiFi: Connected to ${this.currentNetwork.name} (${strength}/5 bars, ${this.currentNetwork.frequency})`;
        }
    }

    getAllNetworks() {
        return [...this.availableNetworks, ...this.userNetworks]
            .sort((a, b) => b.signalStrength - a.signalStrength);
    }

    getSecurityIcon(security) {
        const icons = {
            'None': '🌐',
            'WEP': '🔓',
            'WPA2-PSK': '🔒',
            'WPA3-PSK': '🛡️'
        };
        return icons[security] || '🔒';
    }

    getFrequencyColor(frequency) {
        return frequency === '5GHz' ? '#0080ff' : '#008000';
    }

    showWiFiDialog() {
        this.hideWiFiDialog();

        const dialog = document.createElement('div');
        dialog.id = 'wifiDialog';
        dialog.className = 'wifi-main-dialog';
        
        dialog.innerHTML = `
            <div class="wifi-dialog-content">
                <div class="wifi-dialog-header">
                    <div class="wifi-dialog-title">
                        📡 Network Control Center
                    </div>
                    <div class="wifi-dialog-close" onclick="elxaOS.wifiService.hideWiFiDialog()">×</div>
                </div>
                <div class="wifi-dialog-body">
                    ${this.renderConnectionStatus()}
                    ${this.renderTabs()}
                    ${this.renderTabContent()}
                    ${this.renderControlPanel()}
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
    }

    renderConnectionStatus() {
        const connectionInfo = this.isConnected ? {
            network: this.currentNetwork.name,
            signal: `${Math.round(this.signalStrength)}/5`,
            security: this.currentNetwork.security,
            frequency: this.currentNetwork.frequency,
            speed: this.currentNetwork.speed,
            ip: this.generateFakeIP()
        } : null;

        return `
            <div class="wifi-status-panel">
                <div class="wifi-status-header">
                    🔗 Connection Status
                </div>
                <div class="wifi-status-details">
                    <div class="wifi-status-item">
                        <span class="wifi-status-label">Status:</span>
                        <span class="wifi-status-value">${this.isConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                    ${connectionInfo ? `
                        <div class="wifi-status-item">
                            <span class="wifi-status-label">Network:</span>
                            <span class="wifi-status-value">${connectionInfo.network}</span>
                        </div>
                        <div class="wifi-status-item">
                            <span class="wifi-status-label">Signal:</span>
                            <span class="wifi-status-value">${connectionInfo.signal}</span>
                        </div>
                        <div class="wifi-status-item">
                            <span class="wifi-status-label">Security:</span>
                            <span class="wifi-status-value">${connectionInfo.security}</span>
                        </div>
                        <div class="wifi-status-item">
                            <span class="wifi-status-label">Frequency:</span>
                            <span class="wifi-status-value">${connectionInfo.frequency}</span>
                        </div>
                        <div class="wifi-status-item">
                            <span class="wifi-status-label">Speed:</span>
                            <span class="wifi-status-value">${connectionInfo.speed}</span>
                        </div>
                        <div class="wifi-status-item">
                            <span class="wifi-status-label">IP Address:</span>
                            <span class="wifi-status-value">${connectionInfo.ip}</span>
                        </div>
                        <div class="wifi-status-item">
                            <span class="wifi-status-label">Gateway:</span>
                            <span class="wifi-status-value">${this.generateFakeGateway()}</span>
                        </div>
                    ` : `
                        <div class="wifi-status-item">
                            <span class="wifi-status-label">Available:</span>
                            <span class="wifi-status-value">${this.getAllNetworks().length} networks</span>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    renderTabs() {
        const tabs = [
            { id: 'networks', label: '📡 Networks', icon: '📡' },
            { id: 'tools', label: '🔧 Tools', icon: '🔧' },
            { id: 'history', label: '📊 History', icon: '📊' }
        ];

        return `
            <div class="wifi-tabs">
                ${tabs.map(tab => `
                    <div class="wifi-tab ${this.currentTab === tab.id ? 'wifi-tab-active' : ''}" 
                         onclick="elxaOS.wifiService.switchTab('${tab.id}')">
                        ${tab.label}
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderTabContent() {
        return `
            <div class="wifi-network-container">
                <div class="wifi-tab-content ${this.currentTab === 'networks' ? 'wifi-tab-active' : ''}" id="wifi-tab-networks">
                    ${this.renderNetworkList()}
                </div>
                <div class="wifi-tab-content ${this.currentTab === 'tools' ? 'wifi-tab-active' : ''}" id="wifi-tab-tools">
                    ${this.renderToolsPanel()}
                </div>
                <div class="wifi-tab-content ${this.currentTab === 'history' ? 'wifi-tab-active' : ''}" id="wifi-tab-history">
                    ${this.renderHistoryPanel()}
                </div>
            </div>
        `;
    }

    renderNetworkList() {
        if (this.isScanning) {
            return `
                <div class="wifi-scanning">
                    <span>Scanning for networks...</span>
                    <div class="wifi-scanning-dots">
                        <div class="wifi-scanning-dot"></div>
                        <div class="wifi-scanning-dot"></div>
                        <div class="wifi-scanning-dot"></div>
                    </div>
                </div>
            `;
        }

        const networks = this.getAllNetworks();
        
        return `
            <div class="wifi-network-list">
                ${networks.map(network => this.renderNetworkItem(network)).join('')}
            </div>
        `;
    }

    renderNetworkItem(network) {
        const isConnected = this.isConnected && this.currentNetwork.name === network.name;
        const signalBars = '█'.repeat(Math.max(1, Math.round(network.signalStrength))) + 
                          '░'.repeat(5 - Math.max(1, Math.round(network.signalStrength)));
        
        return `
            <div class="wifi-network-item ${isConnected ? 'wifi-network-connected' : ''}" 
                 data-network='${JSON.stringify(network)}'>
                <div class="wifi-network-icon">
                    ${isConnected ? '✅' : this.getSecurityIcon(network.security)}
                </div>
                <div class="wifi-network-info">
                    <div class="wifi-network-name">
                        ${network.name}
                        ${network.isUserCreated ? '👤' : ''}
                        ${isConnected ? '🔗' : ''}
                    </div>
                    <div class="wifi-network-details">
                        <span class="wifi-network-signal">📶 ${signalBars}</span>
                        <span class="wifi-network-security">${network.security}</span>
                        <span class="wifi-network-frequency" style="color: ${this.getFrequencyColor(network.frequency)}">
                            ${network.frequency}
                        </span>
                        <span style="color: #666">Ch ${network.channel}</span>
                    </div>
                </div>
                <div class="wifi-network-actions">
                    <button class="wifi-btn-info" onclick="elxaOS.wifiService.showNetworkInfo('${network.name}')">
                        ℹ️
                    </button>
                    ${isConnected ? 
                        '<button class="wifi-btn-disconnect" onclick="elxaOS.wifiService.disconnect()">Disconnect</button>' :
                        '<button class="wifi-btn-connect" onclick="elxaOS.wifiService.connectFromDialog(this)">Connect</button>'
                    }
                </div>
            </div>
        `;
    }

    renderToolsPanel() {
        return `
            <div style="padding: 16px;">
                <h3 style="color: #000080; margin-bottom: 16px;">🔧 Network Tools</h3>
                <div class="wifi-tools-grid">
                    <div class="wifi-tool-item" onclick="elxaOS.wifiService.runNetworkScan()">
                        🔍<br>Network Scan
                    </div>
                    <div class="wifi-tool-item" onclick="elxaOS.wifiService.runPingTest()">
                        📡<br>Ping Test
                    </div>
                    <div class="wifi-tool-item" onclick="elxaOS.wifiService.runSpeedTest()">
                        ⚡<br>Speed Test
                    </div>
                    <div class="wifi-tool-item" onclick="elxaOS.wifiService.showNetworkMap()">
                        🗺️<br>Network Map
                    </div>
                    <div class="wifi-tool-item" onclick="elxaOS.wifiService.analyzeChannels()">
                        📊<br>Channel Analysis
                    </div>
                    <div class="wifi-tool-item" onclick="elxaOS.wifiService.securityScan()">
                        🛡️<br>Security Scan
                    </div>
                </div>
                <div style="margin-top: 16px;">
                    <h4 style="color: #800080; margin-bottom: 8px;">Advanced Options</h4>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="wifi-btn-secondary" onclick="elxaOS.wifiService.showCreateNetworkDialog()">
                            📡 Create Network
                        </button>
                        <button class="wifi-btn-secondary" onclick="elxaOS.wifiService.exportSettings()">
                            💾 Export Settings
                        </button>
                        <button class="wifi-btn-secondary" onclick="elxaOS.wifiService.resetAllNetworks()">
                            🔄 Reset Networks
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderHistoryPanel() {
        const recentConnections = this.connectionHistory.slice(-10).reverse();
        
        return `
            <div style="padding: 16px;">
                <h3 style="color: #000080; margin-bottom: 16px;">📊 Connection History</h3>
                <div style="max-height: 200px; overflow-y: auto; border: 1px inset #c0c0c0; background: white; padding: 8px;">
                    ${recentConnections.length > 0 ? 
                        recentConnections.map(entry => `
                            <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #eee; font-size: 10px;">
                                <span><strong>${entry.network}</strong></span>
                                <span style="color: #666;">${new Date(entry.timestamp).toLocaleString()}</span>
                                <span style="color: ${entry.success ? '#008000' : '#800000'};">
                                    ${entry.success ? '✅ Connected' : '❌ Failed'}
                                </span>
                            </div>
                        `).join('') :
                        '<div style="text-align: center; color: #666; font-style: italic;">No connection history yet</div>'
                    }
                </div>
                <div style="margin-top: 12px;">
                    <h4 style="color: #800080; margin-bottom: 8px;">Network Statistics</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 10px;">
                        <div style="padding: 6px; background: rgba(255,255,255,0.7); border: 1px inset #c0c0c0;">
                            <strong>Total Networks Seen:</strong> ${Object.keys(this.networkAnalytics).length}
                        </div>
                        <div style="padding: 6px; background: rgba(255,255,255,0.7); border: 1px inset #c0c0c0;">
                            <strong>Successful Connections:</strong> ${this.connectionHistory.filter(h => h.success).length}
                        </div>
                        <div style="padding: 6px; background: rgba(255,255,255,0.7); border: 1px inset #c0c0c0;">
                            <strong>Open Networks:</strong> ${this.getAllNetworks().filter(n => n.security === 'None').length}
                        </div>
                        <div style="padding: 6px; background: rgba(255,255,255,0.7); border: 1px inset #c0c0c0;">
                            <strong>Secured Networks:</strong> ${this.getAllNetworks().filter(n => n.security !== 'None').length}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderControlPanel() {
        return `
            <div class="wifi-control-panel">
                <button class="wifi-btn-primary" onclick="elxaOS.wifiService.refreshNetworks()">
                    🔄 Refresh Networks
                </button>
                <button class="wifi-btn-secondary" onclick="elxaOS.wifiService.hideWiFiDialog()">
                    ❌ Close
                </button>
            </div>
        `;
    }

    switchTab(tabId) {
        this.currentTab = tabId;
        this.showWiFiDialog(); // Refresh the dialog with new tab
    }

    hideWiFiDialog() {
        const dialog = document.getElementById('wifiDialog');
        if (dialog) {
            dialog.remove();
        }
    }

    connectFromDialog(button) {
        const networkItem = button.closest('.wifi-network-item');
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
        passwordDialog.className = 'wifi-password-dialog';
        
        passwordDialog.innerHTML = `
            <div class="wifi-dialog-header">
                <div class="wifi-dialog-title">🔒 Network Authentication</div>
                <div class="wifi-dialog-close" onclick="document.getElementById('passwordDialog').remove()">×</div>
            </div>
            <div class="wifi-password-content">
                <div class="wifi-password-prompt">
                    Enter password for "${network.name}":
                    <br><small style="color: #666;">Security: ${network.security} | Channel: ${network.channel}</small>
                </div>
                <input type="password" id="networkPassword" class="wifi-password-input" placeholder="Password">
                <div class="wifi-password-controls">
                    <button class="wifi-btn-connect" onclick="elxaOS.wifiService.connectWithPassword('${network.name}')">Connect</button>
                    <button class="wifi-btn-secondary" onclick="document.getElementById('passwordDialog').remove()">Cancel</button>
                </div>
                <div class="wifi-password-hint">
                    💡 Hint: Try common passwords like "password123" or "admin2024"
                </div>
            </div>
        `;

        document.body.appendChild(passwordDialog);
        document.getElementById('networkPassword').focus();
        
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
        this.showMessage('Establishing connection...', 'info');
        
        // Add to analytics
        if (this.networkAnalytics[network.name]) {
            this.networkAnalytics[network.name].connectionAttempts++;
        }
        
        setTimeout(() => {
            let success = false;
            
            if (network.type === 'open') {
                success = true;
            } else if (network.type === 'secured') {
                success = password === network.password;
                
                if (!success) {
                    const attempts = this.connectionAttempts.get(network.name) || 0;
                    this.connectionAttempts.set(network.name, attempts + 1);
                    
                    if (attempts >= 2) {
                        this.showMessage(`Access denied for ${network.name} - Too many failed attempts`, 'error');
                        return;
                    } else {
                        this.showMessage('Authentication failed - Incorrect password', 'error');
                        this.recordConnectionHistory(network.name, false, 'Authentication failed');
                        return;
                    }
                }
            }

            if (success) {
                if (this.isConnected) {
                    this.disconnect(false);
                }
                
                this.isConnected = true;
                this.currentNetwork = network;
                this.signalStrength = network.signalStrength;
                this.connectionAttempts.delete(network.name);
                
                // Record successful connection
                this.recordConnectionHistory(network.name, true, 'Connected successfully');
                if (this.networkAnalytics[network.name]) {
                    this.networkAnalytics[network.name].successfulConnections++;
                }
                
                this.updateWiFiIcon();
                this.showMessage(`Connected to ${network.name} (${network.frequency}, ${network.security})`, 'success');
                this.saveWiFiData();
                
                // Refresh dialog if open
                if (document.getElementById('wifiDialog')) {
                    this.showWiFiDialog();
                }
                
                this.eventBus.emit('wifi.connected', {
                    network: network.name,
                    signalStrength: this.signalStrength,
                    security: network.security,
                    frequency: network.frequency
                });
            }
        }, 2000);
    }

    disconnect(showMessage = true) {
        if (this.isConnected) {
            const networkName = this.currentNetwork.name;
            this.recordConnectionHistory(networkName, false, 'Disconnected by user');
            
            this.isConnected = false;
            this.currentNetwork = null;
            this.signalStrength = 0;
            
            this.updateWiFiIcon();
            this.saveWiFiData();
            
            if (showMessage) {
                this.showMessage(`Disconnected from ${networkName}`, 'info');
            }
            
            this.eventBus.emit('wifi.disconnected');
            
            if (document.getElementById('wifiDialog')) {
                this.showWiFiDialog();
            }
        }
    }

    recordConnectionHistory(networkName, success, reason = '') {
        this.connectionHistory.push({
            network: networkName,
            timestamp: Date.now(),
            success: success,
            reason: reason
        });
        
        // Keep only last 50 entries
        if (this.connectionHistory.length > 50) {
            this.connectionHistory.shift();
        }
        
        this.saveWiFiData();
    }

    showCreateNetworkDialog() {
        const createDialog = document.createElement('div');
        createDialog.id = 'createNetworkDialog';
        createDialog.className = 'wifi-create-dialog';
        
        createDialog.innerHTML = `
            <div class="wifi-dialog-header">
                <div class="wifi-dialog-title">📡 Create Virtual Network</div>
                <div class="wifi-dialog-close" onclick="document.getElementById('createNetworkDialog').remove()">×</div>
            </div>
            <div class="wifi-create-content">
                <div class="wifi-create-form">
                    <div class="wifi-form-group">
                        <label class="wifi-form-label">Network Name (SSID):</label>
                        <input type="text" id="newNetworkName" class="wifi-form-input" placeholder="MyNetwork" maxlength="32">
                    </div>
                    
                    <div class="wifi-form-group">
                        <label class="wifi-form-label">Security Type:</label>
                        <select id="securityType" class="wifi-form-select">
                            <option value="open">Open (No Password)</option>
                            <option value="wep">WEP (Legacy)</option>
                            <option value="wpa2" selected>WPA2-PSK (Recommended)</option>
                            <option value="wpa3">WPA3-PSK (Most Secure)</option>
                        </select>
                    </div>
                    
                    <div class="wifi-form-group" id="passwordGroup">
                        <label class="wifi-form-label">Password:</label>
                        <input type="password" id="newNetworkPassword" class="wifi-form-input" placeholder="Enter password (8+ characters)">
                    </div>
                    
                    <div class="wifi-advanced-section">
                        <div class="wifi-advanced-header" onclick="this.parentElement.classList.toggle('expanded')">
                            ⚙️ Advanced Settings
                        </div>
                        <div style="display: none;" class="advanced-content">
                            <div class="wifi-form-group">
                                <label class="wifi-form-label">Frequency Band:</label>
                                <select id="frequencyBand" class="wifi-form-select">
                                    <option value="2.4GHz">2.4 GHz (Better Range)</option>
                                    <option value="5GHz" selected>5 GHz (Better Speed)</option>
                                </select>
                            </div>
                            
                            <div class="wifi-form-group">
                                <label class="wifi-form-label">Channel:</label>
                                <select id="channelSelect" class="wifi-form-select">
                                    <option value="auto" selected>Auto</option>
                                    <option value="1">Channel 1</option>
                                    <option value="6">Channel 6</option>
                                    <option value="11">Channel 11</option>
                                    <option value="36">Channel 36 (5GHz)</option>
                                    <option value="149">Channel 149 (5GHz)</option>
                                </select>
                            </div>
                            
                            <div class="wifi-form-checkbox">
                                <input type="checkbox" id="hideNetwork">
                                <label>Hide network name (SSID)</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="wifi-password-controls">
                        <button class="wifi-btn-connect" onclick="elxaOS.wifiService.createNetworkFromDialog()">Create Network</button>
                        <button class="wifi-btn-secondary" onclick="document.getElementById('createNetworkDialog').remove()">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(createDialog);
        document.getElementById('newNetworkName').focus();
        
        // Handle security type changes
        document.getElementById('securityType').addEventListener('change', (e) => {
            const passwordGroup = document.getElementById('passwordGroup');
            passwordGroup.style.display = e.target.value === 'open' ? 'none' : 'block';
        });
        
        // Handle advanced section toggle
        const advancedSection = createDialog.querySelector('.wifi-advanced-section');
        advancedSection.addEventListener('click', (e) => {
            if (e.target.classList.contains('wifi-advanced-header')) {
                const content = advancedSection.querySelector('.advanced-content');
                const isExpanded = content.style.display !== 'none';
                content.style.display = isExpanded ? 'none' : 'block';
                e.target.textContent = isExpanded ? '⚙️ Advanced Settings' : '⬇️ Advanced Settings';
            }
        });
    }

    createNetworkFromDialog() {
        const name = document.getElementById('newNetworkName').value.trim();
        const securityType = document.getElementById('securityType').value;
        const password = securityType !== 'open' ? document.getElementById('newNetworkPassword').value : null;
        const frequency = document.getElementById('frequencyBand').value;
        const channel = document.getElementById('channelSelect').value;
        const hideNetwork = document.getElementById('hideNetwork').checked;
        
        if (!name) {
            this.showMessage('Please enter a network name', 'error');
            return;
        }
        
        if (securityType !== 'open' && (!password || password.length < 8)) {
            this.showMessage('Password must be at least 8 characters', 'error');
            return;
        }
        
        if (this.getAllNetworks().some(n => n.name === name)) {
            this.showMessage('Network name already exists', 'error');
            return;
        }
        
        const options = {
            security: this.getSecurityName(securityType),
            frequency: frequency,
            channel: channel === 'auto' ? Math.floor(Math.random() * 11) + 1 : parseInt(channel),
            hidden: hideNetwork
        };
        
        this.createUserNetwork(name, password, options);
        document.getElementById('createNetworkDialog').remove();
    }

    getSecurityName(type) {
        const mapping = {
            'open': 'None',
            'wep': 'WEP',
            'wpa2': 'WPA2-PSK',
            'wpa3': 'WPA3-PSK'
        };
        return mapping[type] || 'WPA2-PSK';
    }

    createUserNetwork(name, password = null, options = {}) {
        const newNetwork = {
            name: name,
            password: password,
            signalStrength: 4 + Math.random(),
            type: password ? 'secured' : 'open',
            security: options.security || (password ? 'WPA2-PSK' : 'None'),
            frequency: options.frequency || '5GHz',
            channel: options.channel || 36,
            speed: options.frequency === '5GHz' ? '300 Mbps' : '54 Mbps',
            encryption: options.security === 'WPA3-PSK' ? 'AES-256' : (options.security === 'WPA2-PSK' ? 'AES' : 'None'),
            vendor: 'User Created',
            isUserCreated: true,
            hidden: options.hidden || false
        };
        
        this.userNetworks.push(newNetwork);
        this.saveWiFiData();
        
        this.showMessage(`Network "${name}" created successfully! 📡`, 'success');
        
        if (document.getElementById('wifiDialog')) {
            this.showWiFiDialog();
        }
        
        this.eventBus.emit('wifi.networkCreated', { network: newNetwork });
    }

    // Tool methods
    runNetworkScan() {
        this.showMessage('Starting deep network scan...', 'info');
        this.isScanning = true;
        
        if (document.getElementById('wifiDialog')) {
            this.showWiFiDialog();
        }
        
        setTimeout(() => {
            // Simulate finding new networks
            if (Math.random() < 0.6) {
                const randomNetworks = [
                    'PublicWiFi', 'Hotel_Guest', 'Airport_Free', 'Library_WiFi', 
                    'Starbucks_WiFi', 'McDonald_WiFi', 'xfinitywifi', 'ATT_WiFi'
                ];
                const randomName = randomNetworks[Math.floor(Math.random() * randomNetworks.length)];
                
                if (!this.getAllNetworks().some(n => n.name === randomName)) {
                    this.availableNetworks.push({
                        name: randomName,
                        password: null,
                        signalStrength: 1 + Math.random() * 3,
                        type: 'open',
                        security: 'None',
                        frequency: Math.random() > 0.5 ? '2.4GHz' : '5GHz',
                        channel: Math.floor(Math.random() * 11) + 1,
                        speed: '54 Mbps',
                        encryption: 'None',
                        vendor: 'Unknown'
                    });
                }
            }
            
            this.isScanning = false;
            this.showMessage(`Scan complete - Found ${this.getAllNetworks().length} networks`, 'success');
            
            if (document.getElementById('wifiDialog')) {
                this.showWiFiDialog();
            }
        }, 3000);
    }

    runPingTest() {
        if (!this.isConnected) {
            this.showMessage('Must be connected to a network to run ping test', 'error');
            return;
        }
        
        this.showMessage('Running ping test...', 'info');
        
        setTimeout(() => {
            const pingTime = Math.round(Math.random() * 50 + 10);
            const packetLoss = Math.random() > 0.9 ? Math.round(Math.random() * 5) : 0;
            this.showMessage(`Ping: ${pingTime}ms | Packet Loss: ${packetLoss}%`, 'success');
        }, 2000);
    }

    runSpeedTest() {
        if (!this.isConnected) {
            this.showMessage('Must be connected to a network to run speed test', 'error');
            return;
        }
        
        this.showMessage('Testing connection speed...', 'info');
        
        setTimeout(() => {
            const download = Math.round(Math.random() * 100 + 20);
            const upload = Math.round(download * 0.3 + Math.random() * 10);
            this.showMessage(`⬇️ ${download} Mbps | ⬆️ ${upload} Mbps`, 'success');
        }, 4000);
    }

    showNetworkMap() {
        this.showMessage('Generating network topology map...', 'info');
        setTimeout(() => {
            this.showMessage('Network map feature coming soon! 🗺️', 'info');
        }, 1500);
    }

    analyzeChannels() {
        this.showMessage('Analyzing WiFi channels...', 'info');
        setTimeout(() => {
            const channels = {};
            this.getAllNetworks().forEach(net => {
                channels[net.channel] = (channels[net.channel] || 0) + 1;
            });
            
            const leastUsed = Object.keys(channels).reduce((a, b) => 
                channels[a] < channels[b] ? a : b
            );
            
            this.showMessage(`Recommended channel: ${leastUsed} (least congested)`, 'success');
        }, 2000);
    }

    securityScan() {
        this.showMessage('Scanning for security vulnerabilities...', 'info');
        setTimeout(() => {
            const weakNetworks = this.getAllNetworks().filter(n => n.security === 'WEP' || n.security === 'None');
            this.showMessage(`Found ${weakNetworks.length} networks with weak security`, 
                weakNetworks.length > 0 ? 'warning' : 'success');
        }, 3000);
    }

    showNetworkInfo(networkName) {
        const network = this.getAllNetworks().find(n => n.name === networkName);
        if (!network) return;
        
        const infoDialog = document.createElement('div');
        infoDialog.id = 'networkInfoDialog';
        infoDialog.className = 'wifi-info-dialog';
        
        const analytics = this.networkAnalytics[networkName];
        const avgSignal = analytics && analytics.signalHistory.length > 0 ? 
            (analytics.signalHistory.reduce((sum, h) => sum + h.strength, 0) / analytics.signalHistory.length).toFixed(1) : 
            'N/A';
        
        infoDialog.innerHTML = `
            <div class="wifi-dialog-header">
                <div class="wifi-dialog-title">📊 Network Information</div>
                <div class="wifi-dialog-close" onclick="document.getElementById('networkInfoDialog').remove()">×</div>
            </div>
            <div class="wifi-info-content">
                <h3 style="color: #000080; margin-bottom: 12px;">${network.name}</h3>
                <div class="wifi-info-grid">
                    <div class="wifi-info-item">
                        <div class="wifi-info-label">Security Type</div>
                        <div class="wifi-info-value">${network.security}</div>
                    </div>
                    <div class="wifi-info-item">
                        <div class="wifi-info-label">Frequency</div>
                        <div class="wifi-info-value">${network.frequency}</div>
                    </div>
                    <div class="wifi-info-item">
                        <div class="wifi-info-label">Channel</div>
                        <div class="wifi-info-value">${network.channel}</div>
                    </div>
                    <div class="wifi-info-item">
                        <div class="wifi-info-label">Max Speed</div>
                        <div class="wifi-info-value">${network.speed}</div>
                    </div>
                    <div class="wifi-info-item">
                        <div class="wifi-info-label">Encryption</div>
                        <div class="wifi-info-value">${network.encryption}</div>
                    </div>
                    <div class="wifi-info-item">
                        <div class="wifi-info-label">Vendor</div>
                        <div class="wifi-info-value">${network.vendor}</div>
                    </div>
                    <div class="wifi-info-item">
                        <div class="wifi-info-label">Signal Strength</div>
                        <div class="wifi-info-value">${Math.round(network.signalStrength)}/5</div>
                    </div>
                    <div class="wifi-info-item">
                        <div class="wifi-info-label">Average Signal</div>
                        <div class="wifi-info-value">${avgSignal}/5</div>
                    </div>
                </div>
                ${analytics ? `
                    <h4 style="color: #800080; margin: 12px 0 8px 0;">Connection Statistics</h4>
                    <div class="wifi-info-grid">
                        <div class="wifi-info-item">
                            <div class="wifi-info-label">First Seen</div>
                            <div class="wifi-info-value">${new Date(analytics.firstSeen).toLocaleDateString()}</div>
                        </div>
                        <div class="wifi-info-item">
                            <div class="wifi-info-label">Connection Attempts</div>
                            <div class="wifi-info-value">${analytics.connectionAttempts}</div>
                        </div>
                        <div class="wifi-info-item">
                            <div class="wifi-info-label">Successful Connections</div>
                            <div class="wifi-info-value">${analytics.successfulConnections}</div>
                        </div>
                        <div class="wifi-info-item">
                            <div class="wifi-info-label">Success Rate</div>
                            <div class="wifi-info-value">${analytics.connectionAttempts > 0 ? 
                                Math.round((analytics.successfulConnections / analytics.connectionAttempts) * 100) : 0}%</div>
                        </div>
                    </div>
                ` : ''}
                <div style="text-align: center; margin-top: 16px;">
                    <button class="wifi-btn-secondary" onclick="document.getElementById('networkInfoDialog').remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(infoDialog);
    }

    // Utility methods
    generateFakeIP() {
        return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    }

    generateFakeGateway() {
        return `192.168.${Math.floor(Math.random() * 255)}.1`;
    }

    refreshNetworks() {
        this.runNetworkScan();
    }

    exportSettings() {
        const settings = {
            userNetworks: this.userNetworks,
            connectionHistory: this.connectionHistory,
            networkAnalytics: this.networkAnalytics
        };
        
        this.showMessage('Settings exported to console (F12 to view)', 'info');
        console.log('WiFi Settings Export:', JSON.stringify(settings, null, 2));
    }

    resetAllNetworks() {
        if (confirm('Reset all network settings? This will clear user networks and history.')) {
            this.userNetworks = [];
            this.connectionHistory = [];
            this.networkAnalytics = {};
            this.disconnect(false);
            this.saveWiFiData();
            this.showMessage('All network settings reset', 'success');
            
            if (document.getElementById('wifiDialog')) {
                this.showWiFiDialog();
            }
        }
    }

    simulateConnectionIssue() {
        if (this.isConnected && Math.random() < 0.5) {
            const issues = [
                'Signal interference detected',
                'Connection unstable',
                'High network congestion',
                'Router overload detected'
            ];
            
            const issue = issues[Math.floor(Math.random() * issues.length)];
            this.showMessage(`⚠️ ${issue}`, 'warning');
            
            this.signalStrength = Math.max(1, this.signalStrength - 0.5);
            this.updateWiFiIcon();
            
            setTimeout(() => {
                if (this.isConnected) {
                    this.signalStrength = this.currentNetwork.signalStrength;
                    this.updateWiFiIcon();
                }
            }, 8000);
        }
    }

    showMessage(text, type = 'info') {
        const message = document.createElement('div');
        message.className = `wifi-system-message wifi-message-${type}`;
        message.textContent = text;
        
        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 4000);
    }

    // API methods
    isOnline() {
        return this.isConnected;
    }

    getConnectionInfo() {
        if (!this.isConnected) return null;
        
        return {
            network: this.currentNetwork.name,
            signalStrength: this.signalStrength,
            type: this.currentNetwork.type,
            security: this.currentNetwork.security,
            frequency: this.currentNetwork.frequency,
            speed: this.currentNetwork.speed
        };
    }

    // Persistence methods
    saveWiFiData() {
        // Note: This would use localStorage in a real environment
        // For now, we'll simulate saving to memory
        const wifiData = {
            userNetworks: this.userNetworks,
            isConnected: this.isConnected,
            currentNetwork: this.currentNetwork,
            signalStrength: this.signalStrength,
            connectionHistory: this.connectionHistory,
            networkAnalytics: this.networkAnalytics
        };
    }

    loadWiFiData() {
        // Note: This would load from localStorage in a real environment
        // For now, we'll initialize with empty data
        console.log('📶 WiFi data loaded (simulated)');
    }

    clearWiFiData() {
        this.userNetworks = [];
        this.isConnected = false;
        this.currentNetwork = null;
        this.signalStrength = 0;
        this.connectionHistory = [];
        this.networkAnalytics = {};
        this.updateWiFiIcon();
        console.log('🗑️ WiFi data cleared');
    }
}