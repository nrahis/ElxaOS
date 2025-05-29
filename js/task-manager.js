// =================================
// ELXAOS TASK MANAGER
// =================================
class ElxaTaskManager {
    constructor(windowManager, eventBus) {
        this.windowManager = windowManager;
        this.eventBus = eventBus;
        this.isOpen = false;
        this.windowId = null;
        this.updateInterval = null;
        this.currentTab = 'processes';
        
        this.setupKeyboardShortcut();
        console.log('🔧 ElxaOS Task Manager initialized (Ctrl+Alt+T to open)');
    }

    setupKeyboardShortcut() {
        document.addEventListener('keydown', (e) => {
            // Ctrl + Alt + T to open Task Manager
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 't') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        if (this.isOpen) return;

        this.windowId = `task-manager-${Date.now()}`;
        
        const windowContent = this.createTaskManagerInterface();
        
        const window = this.windowManager.createWindow(
            this.windowId,
            '⚙️ ElxaOS Task Manager',
            windowContent,
            { 
                width: '650px', 
                height: '500px', 
                x: '150px', 
                y: '100px' 
            }
        );

        this.isOpen = true;
        this.setupEventHandlers();
        this.startUpdateLoop();
        this.refreshCurrentTab();

        // Ensure window gets proper focus
        this.windowManager.focusWindow(this.windowId);
    }

    close() {
        if (!this.isOpen) return;

        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        if (this.windowId) {
            this.windowManager.closeWindow(this.windowId);
        }

        this.isOpen = false;
        this.windowId = null;
    }

    createTaskManagerInterface() {
        return `
            <div class="elxa-task-manager">
                <!-- Tab Navigation -->
                <div class="elxa-tm-tabs">
                    <div class="elxa-tm-tab active" data-tab="processes">
                        <span>📋</span> Processes
                    </div>
                    <div class="elxa-tm-tab" data-tab="performance">
                        <span>📊</span> Performance  
                    </div>
                    <div class="elxa-tm-tab" data-tab="debug">
                        <span>🔧</span> Debug Tools
                    </div>
                    <div class="elxa-tm-tab" data-tab="system">
                        <span>💻</span> System Info
                    </div>
                </div>

                <!-- Tab Content -->
                <div class="elxa-tm-content">
                    <!-- Processes Tab -->
                    <div class="elxa-tm-panel active" data-panel="processes">
                        <div class="elxa-tm-toolbar">
                            <button class="elxa-tm-btn" id="end-task-btn" disabled>
                                🛑 End Task
                            </button>
                            <button class="elxa-tm-btn" id="refresh-btn">
                                🔄 Refresh
                            </button>
                        </div>
                        <div class="elxa-tm-process-list">
                            <div class="elxa-tm-process-header">
                                <div class="proc-name">Program Name</div>
                                <div class="proc-id">Window ID</div>
                                <div class="proc-status">Status</div>
                                <div class="proc-memory">Memory</div>
                            </div>
                            <div class="elxa-tm-process-items" id="process-list">
                                <!-- Processes will be populated here -->
                            </div>
                        </div>
                    </div>

                    <!-- Performance Tab -->
                    <div class="elxa-tm-panel" data-panel="performance">
                        <div class="elxa-tm-perf-grid">
                            <div class="perf-card">
                                <div class="perf-title">🧠 ElxaOS Memory</div>
                                <div class="perf-value" id="memory-usage">Loading...</div>
                                <div class="perf-bar">
                                    <div class="perf-fill" id="memory-bar"></div>
                                </div>
                            </div>
                            <div class="perf-card">
                                <div class="perf-title">⚡ System Performance</div>
                                <div class="perf-value" id="cpu-usage">Loading...</div>
                                <div class="perf-bar">
                                    <div class="perf-fill" id="cpu-bar"></div>
                                </div>
                            </div>
                            <div class="perf-card">
                                <div class="perf-title">📁 File System</div>
                                <div class="perf-value" id="storage-usage">Loading...</div>
                                <div class="perf-bar">
                                    <div class="perf-fill" id="storage-bar"></div>
                                </div>
                            </div>
                            <div class="perf-card">
                                <div class="perf-title">🌐 Network Status</div>
                                <div class="perf-value" id="network-status">Connected to Snakesia</div>
                                <div class="perf-detail">Ping: 42ms • Speed: 1000 Mbps</div>
                            </div>
                        </div>
                        <div class="elxa-tm-uptime">
                            <div class="uptime-card">
                                <div class="uptime-title">⏰ System Uptime</div>
                                <div class="uptime-value" id="system-uptime">Loading...</div>
                            </div>
                        </div>
                    </div>

                    <!-- Debug Tools Tab -->
                    <div class="elxa-tm-panel" data-panel="debug">
                        <div class="elxa-tm-debug-section">
                            <h3>🔧 File System Debug</h3>
                            <div class="debug-buttons">
                                <button class="debug-btn" id="debug-storage">📦 Debug Storage</button>
                                <button class="debug-btn" id="show-file-tree">🌳 Show File Tree</button>
                                <button class="debug-btn" id="backup-data">💾 Backup Data</button>
                                <button class="debug-btn danger" id="clear-storage">🗑️ Clear All Data</button>
                            </div>
                        </div>
                        
                        <div class="elxa-tm-debug-section">
                            <h3>🎮 Program Debug</h3>
                            <div class="debug-buttons">
                                <button class="debug-btn" id="list-programs">📋 List Programs</button>
                                <button class="debug-btn" id="refresh-desktop">🖥️ Refresh Desktop</button>
                                <button class="debug-btn" id="reset-positions">🔄 Reset Icon Positions</button>
                            </div>
                        </div>

                        <div class="elxa-tm-debug-section">
                            <h3>🏗️ System Tools</h3>
                            <div class="debug-buttons">
                                <button class="debug-btn" id="force-garbage-collect">🧹 Force Cleanup</button>
                                <button class="debug-btn" id="test-notifications">📬 Test Notifications</button>
                                <button class="debug-btn" id="export-logs">📋 Export Logs</button>
                            </div>
                        </div>

                        <div class="elxa-tm-debug-output">
                            <div class="debug-output-header">
                                <span>📝 Debug Output</span>
                                <button class="debug-clear-btn" id="clear-debug-output">Clear</button>
                            </div>
                            <div class="debug-console" id="debug-console">
                                <div class="debug-line">ElxaOS Task Manager Debug Console Ready</div>
                                <div class="debug-line">Use the buttons above to run debug commands</div>
                            </div>
                        </div>
                    </div>

                    <!-- System Info Tab -->
                    <div class="elxa-tm-panel" data-panel="system">
                        <div class="elxa-tm-sysinfo">
                            <div class="sysinfo-section">
                                <h3>💻 System Information</h3>
                                <div class="sysinfo-grid">
                                    <div class="sysinfo-item">
                                        <strong>Operating System:</strong>
                                        <span>ElxaOS Professional Edition</span>
                                    </div>
                                    <div class="sysinfo-item">
                                        <strong>Version:</strong>
                                        <span>4.2.0 Build 2024</span>
                                    </div>
                                    <div class="sysinfo-item">
                                        <strong>Manufacturer:</strong>
                                        <span>ElxaCorp Technologies</span>
                                    </div>
                                    <div class="sysinfo-item">
                                        <strong>Location:</strong>
                                        <span>Snakesia (GMT-3:01)</span>
                                    </div>
                                    <div class="sysinfo-item">
                                        <strong>Currency:</strong>
                                        <span>Snakes (🐍)</span>
                                    </div>
                                    <div class="sysinfo-item">
                                        <strong>System Architect:</strong>
                                        <span>Mr. Snake-e, CEO</span>
                                    </div>
                                </div>
                            </div>

                            <div class="sysinfo-section">
                                <h3>🎮 Installed Programs</h3>
                                <div class="program-list" id="installed-programs">
                                    <!-- Will be populated dynamically -->
                                </div>
                            </div>

                            <div class="sysinfo-section">
                                <h3>📊 System Statistics</h3>
                                <div class="stats-grid">
                                    <div class="stat-item">
                                        <div class="stat-value" id="total-files">-</div>
                                        <div class="stat-label">Total Files</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-value" id="total-folders">-</div>
                                        <div class="stat-label">Total Folders</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-value" id="desktop-items">-</div>
                                        <div class="stat-label">Desktop Items</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-value" id="running-programs">-</div>
                                        <div class="stat-label">Running Programs</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventHandlers() {
        const windowElement = document.getElementById(`window-${this.windowId}`);
        if (!windowElement) return;

        // Tab switching
        windowElement.querySelectorAll('.elxa-tm-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Process management buttons
        const endTaskBtn = windowElement.querySelector('#end-task-btn');
        const refreshBtn = windowElement.querySelector('#refresh-btn');

        if (endTaskBtn) {
            endTaskBtn.addEventListener('click', () => this.endSelectedTask());
        }
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshProcesses());
        }

        // Debug buttons
        this.setupDebugHandlers(windowElement);

        // Process selection
        this.setupProcessSelection(windowElement);

        // Listen for window close
        this.eventBus.on('window.closed', (data) => {
            if (data.id === this.windowId) {
                this.close();
            }
        });
    }

    setupDebugHandlers(windowElement) {
        const debugButtons = {
            'debug-storage': () => this.debugCommand('debugStorage'),
            'show-file-tree': () => this.debugCommand('showFileTree'),
            'backup-data': () => this.debugCommand('backupData'),
            'clear-storage': () => this.debugCommand('clearStorage'),
            'list-programs': () => this.debugCommand('listPrograms'),
            'refresh-desktop': () => this.debugCommand('refreshDesktop'),
            'reset-positions': () => this.debugCommand('resetPositions'),
            'force-garbage-collect': () => this.debugCommand('forceGarbageCollect'),
            'test-notifications': () => this.debugCommand('testNotifications'),
            'export-logs': () => this.debugCommand('exportLogs'),
            'clear-debug-output': () => this.clearDebugOutput()
        };

        Object.entries(debugButtons).forEach(([id, handler]) => {
            const btn = windowElement.querySelector(`#${id}`);
            if (btn) {
                btn.addEventListener('click', handler);
            }
        });
    }

    setupProcessSelection(windowElement) {
        const processContainer = windowElement.querySelector('#process-list');
        if (!processContainer) return;

        processContainer.addEventListener('click', (e) => {
            const processItem = e.target.closest('.process-item');
            if (!processItem) return;

            // Clear previous selection
            processContainer.querySelectorAll('.process-item').forEach(item => {
                item.classList.remove('selected');
            });

            // Select clicked item
            processItem.classList.add('selected');

            // Enable end task button
            const endTaskBtn = windowElement.querySelector('#end-task-btn');
            if (endTaskBtn) {
                endTaskBtn.disabled = false;
            }
        });
    }

    switchTab(tabName) {
        const windowElement = document.getElementById(`window-${this.windowId}`);
        if (!windowElement) return;

        // Update tab buttons
        windowElement.querySelectorAll('.elxa-tm-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update panels
        windowElement.querySelectorAll('.elxa-tm-panel').forEach(panel => {
            panel.classList.toggle('active', panel.dataset.panel === tabName);
        });

        this.currentTab = tabName;
        this.refreshCurrentTab();
    }

    refreshCurrentTab() {
        switch (this.currentTab) {
            case 'processes':
                this.refreshProcesses();
                break;
            case 'performance':
                this.refreshPerformance();
                break;
            case 'system':
                this.refreshSystemInfo();
                break;
        }
    }

    refreshProcesses() {
        const windowElement = document.getElementById(`window-${this.windowId}`);
        const processList = windowElement?.querySelector('#process-list');
        if (!processList) return;

        processList.innerHTML = '';

        // Get running windows from window manager
        if (this.windowManager && this.windowManager.windows) {
            this.windowManager.windows.forEach((windowData, windowId) => {
                const processItem = document.createElement('div');
                processItem.className = 'process-item';
                processItem.dataset.windowId = windowId;

                const isActive = this.windowManager.activeWindow === windowId;
                const status = windowData.minimized ? 'Minimized' : (isActive ? 'Active' : 'Running');
                const memory = this.calculateFakeMemory(windowId);

                processItem.innerHTML = `
                    <div class="proc-name">${windowData.title}</div>
                    <div class="proc-id">${windowId}</div>
                    <div class="proc-status ${status.toLowerCase()}">${status}</div>
                    <div class="proc-memory">${memory} KB</div>
                `;

                processList.appendChild(processItem);
            });
        }

        // Add system processes
        const systemProcesses = [
            { name: 'ElxaOS Shell', id: 'shell-001', status: 'Running', memory: '2,048' },
            { name: 'Desktop Manager', id: 'desktop-001', status: 'Running', memory: '1,536' },
            { name: 'File System', id: 'filesystem-001', status: 'Running', memory: '1,024' },
            { name: 'Event Bus', id: 'eventbus-001', status: 'Running', memory: '512' },
            { name: 'Theme Service', id: 'theme-001', status: 'Running', memory: '256' }
        ];

        systemProcesses.forEach(proc => {
            const processItem = document.createElement('div');
            processItem.className = 'process-item system-process';
            processItem.innerHTML = `
                <div class="proc-name">${proc.name}</div>
                <div class="proc-id">${proc.id}</div>
                <div class="proc-status running">${proc.status}</div>
                <div class="proc-memory">${proc.memory} KB</div>
            `;
            processList.appendChild(processItem);
        });
    }

    refreshPerformance() {
        const windowElement = document.getElementById(`window-${this.windowId}`);
        if (!windowElement) return;

        // Simulate system stats
        const memoryUsage = Math.floor(Math.random() * 30) + 20; // 20-50%
        const cpuUsage = Math.floor(Math.random() * 25) + 5; // 5-30%
        const storageUsage = Math.floor(Math.random() * 20) + 10; // 10-30%

        const memoryElement = windowElement.querySelector('#memory-usage');
        const memoryBar = windowElement.querySelector('#memory-bar');
        const cpuElement = windowElement.querySelector('#cpu-usage');
        const cpuBar = windowElement.querySelector('#cpu-bar');
        const storageElement = windowElement.querySelector('#storage-usage');
        const storageBar = windowElement.querySelector('#storage-bar');

        if (memoryElement) memoryElement.textContent = `${memoryUsage}% (${Math.floor(memoryUsage * 0.8)} MB)`;
        if (memoryBar) memoryBar.style.width = `${memoryUsage}%`;
        
        if (cpuElement) cpuElement.textContent = `${cpuUsage}%`;
        if (cpuBar) cpuBar.style.width = `${cpuUsage}%`;
        
        if (storageElement) storageElement.textContent = `${storageUsage}%`;
        if (storageBar) storageBar.style.width = `${storageUsage}%`;

        // Update uptime
        const uptimeElement = windowElement.querySelector('#system-uptime');
        if (uptimeElement) {
            const hours = Math.floor(Math.random() * 12) + 1;
            const minutes = Math.floor(Math.random() * 60);
            uptimeElement.textContent = `${hours}h ${minutes}m`;
        }
    }

    refreshSystemInfo() {
        const windowElement = document.getElementById(`window-${this.windowId}`);
        if (!windowElement) return;

        // Update installed programs
        const programsList = windowElement.querySelector('#installed-programs');
        if (programsList && elxaOS && elxaOS.programs) {
            programsList.innerHTML = '';
            
            const programs = [
                { name: 'Notepad', version: '2.1', icon: '📄' },
                { name: 'Paint', version: '1.8', icon: '🎨' },
                { name: 'File Manager', version: '3.0', icon: '📁' },
                { name: 'Calculator', version: '1.5', icon: '🧮' },
                { name: 'ElxaCode', version: '2.3', icon: '💻' },
                { name: 'Snoogle Browser', version: '4.1', icon: '🌐' },
                { name: 'ElxaGuard Antivirus', version: '1.0', icon: '🛡️' },
                { name: 'Snakesia Messenger', version: '2.0', icon: '💬' }
            ];

            programs.forEach(prog => {
                const progItem = document.createElement('div');
                progItem.className = 'program-item';
                progItem.innerHTML = `
                    <span class="prog-icon">${prog.icon}</span>
                    <span class="prog-name">${prog.name}</span>
                    <span class="prog-version">v${prog.version}</span>
                `;
                programsList.appendChild(progItem);
            });
        }

        // Update statistics
        this.updateSystemStats(windowElement);
    }

    updateSystemStats(windowElement) {
        if (!elxaOS || !elxaOS.fileSystem) return;

        let totalFiles = 0;
        let totalFolders = 0;

        // Count files and folders recursively
        const countItems = (node) => {
            if (node.type === 'file') {
                totalFiles++;
            } else if (node.type === 'folder') {
                totalFolders++;
                if (node.children) {
                    Object.values(node.children).forEach(countItems);
                }
            }
        };

        countItems(elxaOS.fileSystem.root);

        // Desktop items
        const desktopItems = elxaOS.fileSystem.listContents(['root', 'Desktop']).length;
        
        // Running programs
        const runningPrograms = this.windowManager.windows ? this.windowManager.windows.size : 0;

        // Update display
        const totalFilesElement = windowElement.querySelector('#total-files');
        const totalFoldersElement = windowElement.querySelector('#total-folders');
        const desktopItemsElement = windowElement.querySelector('#desktop-items');
        const runningProgramsElement = windowElement.querySelector('#running-programs');

        if (totalFilesElement) totalFilesElement.textContent = totalFiles;
        if (totalFoldersElement) totalFoldersElement.textContent = totalFolders;
        if (desktopItemsElement) desktopItemsElement.textContent = desktopItems;
        if (runningProgramsElement) runningProgramsElement.textContent = runningPrograms;
    }

    calculateFakeMemory(windowId) {
        // Generate consistent fake memory usage based on window ID
        const hash = windowId.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        return Math.abs(hash % 3000) + 500; // 500-3500 KB
    }

    endSelectedTask() {
        const windowElement = document.getElementById(`window-${this.windowId}`);
        const selectedProcess = windowElement?.querySelector('.process-item.selected');
        
        if (!selectedProcess) return;

        const windowId = selectedProcess.dataset.windowId;
        
        if (windowId && this.windowManager.windows.has(windowId)) {
            if (confirm(`End task "${this.windowManager.windows.get(windowId).title}"?`)) {
                this.windowManager.closeWindow(windowId);
                this.refreshProcesses();
                
                // Disable end task button
                const endTaskBtn = windowElement.querySelector('#end-task-btn');
                if (endTaskBtn) endTaskBtn.disabled = true;
            }
        }
    }

    debugCommand(command) {
        this.addDebugOutput(`> Executing ${command}...`);

        switch (command) {
            case 'debugStorage':
                if (window.debugElxaOS) {
                    window.debugElxaOS.debugStorage();
                    this.addDebugOutput('✅ Storage debug complete - check browser console');
                } else {
                    this.addDebugOutput('❌ Debug tools not available');
                }
                break;

            case 'showFileTree':
                if (window.debugElxaOS) {
                    window.debugElxaOS.showFileTree();
                    this.addDebugOutput('✅ File tree displayed in console');
                } else {
                    this.addDebugOutput('❌ Debug tools not available');
                }
                break;

            case 'backupData':
                if (window.debugElxaOS) {
                    const backup = window.debugElxaOS.backup();
                    this.addDebugOutput(`✅ Backup created at ${new Date().toLocaleTimeString()}`);
                } else {
                    this.addDebugOutput('❌ Debug tools not available');
                }
                break;

            case 'clearStorage':
                if (confirm('⚠️ This will delete ALL ElxaOS data and restart setup. Continue?')) {
                    if (window.debugElxaOS) {
                        const cleared = window.debugElxaOS.clearAllStorage();
                        this.addDebugOutput(`✅ Cleared ${cleared} storage items`);
                        this.addDebugOutput('🚀 Restarting setup wizard...');
                        
                        // Close task manager and start setup
                        setTimeout(() => {
                            if (this.windowManager) {
                                this.windowManager.closeWindow(this.windowId);
                            }
                            
                            // Use the integrated setup trigger
                            if (window.triggerElxaOSSetup) {
                                window.triggerElxaOSSetup();
                            } else if (window.elxaOSSetup) {
                                window.elxaOSSetup.startSetup();
                            }
                        }, 1000);
                    } else {
                        this.addDebugOutput('❌ Debug tools not available');
                    }
                }
                break;

            case 'listPrograms':
                if (elxaOS && elxaOS.programs) {
                    const programs = Object.keys(elxaOS.programs);
                    this.addDebugOutput(`📋 Available programs: ${programs.join(', ')}`);
                } else {
                    this.addDebugOutput('❌ ElxaOS not available');
                }
                break;

            case 'refreshDesktop':
                if (elxaOS && elxaOS.refreshDesktop) {
                    elxaOS.refreshDesktop();
                    this.addDebugOutput('✅ Desktop refreshed');
                } else {
                    this.addDebugOutput('❌ Desktop refresh not available');
                }
                break;

            case 'resetPositions':
                if (elxaOS && elxaOS.desktop && elxaOS.desktop.resetIconPositions) {
                    elxaOS.desktop.resetIconPositions();
                    this.addDebugOutput('✅ Icon positions reset');
                } else {
                    this.addDebugOutput('❌ Desktop manager not available');
                }
                break;

            case 'forceGarbageCollect':
                // Simulate garbage collection
                setTimeout(() => {
                    this.addDebugOutput('🧹 Memory cleanup complete');
                    this.addDebugOutput(`💾 Freed ${Math.floor(Math.random() * 500) + 100} KB`);
                }, 1000);
                break;

            case 'testNotifications':
                this.addDebugOutput('📬 Testing notification system...');
                setTimeout(() => {
                    this.showMessage('Test notification from Task Manager', 'info');
                    this.addDebugOutput('✅ Notification test complete');
                }, 500);
                break;

            case 'exportLogs':
                const logs = this.getDebugLogs();
                const blob = new Blob([logs], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `elxaos-debug-${Date.now()}.txt`;
                a.click();
                URL.revokeObjectURL(url);
                this.addDebugOutput('✅ Debug logs exported');
                break;

            default:
                this.addDebugOutput(`❓ Unknown command: ${command}`);
        }
    }

    addDebugOutput(message) {
        const windowElement = document.getElementById(`window-${this.windowId}`);
        const console = windowElement?.querySelector('#debug-console');
        if (!console) return;

        const line = document.createElement('div');
        line.className = 'debug-line';
        line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        
        console.appendChild(line);
        console.scrollTop = console.scrollHeight;

        // Limit to 100 lines
        while (console.children.length > 100) {
            console.removeChild(console.firstChild);
        }
    }

    clearDebugOutput() {
        const windowElement = document.getElementById(`window-${this.windowId}`);
        const console = windowElement?.querySelector('#debug-console');
        if (console) {
            console.innerHTML = '<div class="debug-line">Debug console cleared</div>';
        }
    }

    getDebugLogs() {
        const windowElement = document.getElementById(`window-${this.windowId}`);
        const console = windowElement?.querySelector('#debug-console');
        if (!console) return 'No logs available';

        const lines = Array.from(console.children).map(line => line.textContent);
        return `ElxaOS Debug Logs\n${new Date().toISOString()}\n\n${lines.join('\n')}`;
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
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    startUpdateLoop() {
        this.updateInterval = setInterval(() => {
            if (this.isOpen) {
                this.refreshCurrentTab();
            }
        }, 2000); // Update every 2 seconds
    }
}

// Initialize Task Manager when ElxaOS is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for elxaOS to be available
    const initTaskManager = () => {
        if (typeof elxaOS !== 'undefined' && elxaOS.windowManager && elxaOS.eventBus) {
            elxaOS.taskManager = new ElxaTaskManager(elxaOS.windowManager, elxaOS.eventBus);
            console.log('✅ ElxaOS Task Manager ready! Press Ctrl+Alt+T to open.');
        } else {
            setTimeout(initTaskManager, 500);
        }
    };
    
    initTaskManager();
});