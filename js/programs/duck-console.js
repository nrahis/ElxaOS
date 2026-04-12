// =================================
// DUCK CONSOLE PROGRAM
// =================================
class DuckConsoleProgram {
    constructor(windowManager, fileSystem, eventBus) {
        this.windowManager = windowManager;
        this.fileSystem = fileSystem;
        this.eventBus = eventBus;
        // homeDir is the root of what this user can access.
        // Right now it's ['root'] for everyone (shared FS).
        // When per-user FS subtrees exist, change this to:
        //   ['root', 'Users', loggedInUsername]
        this.homeDir = ['root'];
        this.currentPath = [...this.homeDir];
        this.commandHistory = [];
        this.historyIndex = -1;
        // 'user' is the hacker flavor name shown in the prompt — pure cosmetic.
        // Defaults to the logged-in ElxaOS account username, falls back to 'hacker_kid'.
        this.user = this._getDefaultHackerName();
        this.isOnline = false;
        this.abbyMood = 'happy'; // Abby's current mood
        this.snakeeCEOMode = false; // Mr. Snake-e CEO mode
        this.securityLevel = 1; // Hacker security clearance
        this.activeWindows = new Set(); // Track open console windows
        this.pendingUpgrade = null; // Active upgrade puzzle: { targetLevel, check, hint, attempts }

        // Commands locked behind clearance levels. Level 1 = default, unlocked for everyone.
        this.levelRequirements = {
            // Level 2 — Math Wizard
            'math': 2, 'googolplex': 2, 'tree': 2, 'enigma': 2, 'binary': 2, 'convert': 2,
            // Level 3 — Network Operative
            'network': 3, 'netstat': 3, 'ping': 3, 'scan': 3, 'firewall': 3, 'trace': 3, 'whoislive': 3,
            // Level 4 — Elite Hacker
            'rainbow': 4, 'glitch': 4, 'explode': 4, 'decode': 4,
            // Level 5 — Supreme Overlord
            'override': 5
        };

        // Check initial WiFi status
        this.checkInitialWiFiStatus();
        
        // Store EventBus handler refs for cleanup
        this._onWifiConnected = (data) => {
            this.isOnline = true;
            this.outputToActiveConsole('🌐 NETWORK CONNECTION ESTABLISHED', 'success');
            this.outputToActiveConsole('🔐 Secure channels now available', 'info');
            this.updateNetworkStatusDisplay();
        };
        
        this._onWifiDisconnected = () => {
            this.isOnline = false;
            this.outputToActiveConsole('⚠️ NETWORK CONNECTION LOST', 'warning');
            this.outputToActiveConsole('🚫 Networking commands disabled', 'error');
            this.updateNetworkStatusDisplay();
        };
        
        this.eventBus.on('wifi.connected', this._onWifiConnected);
        this.eventBus.on('wifi.disconnected', this._onWifiDisconnected);
    }

    // Returns the logged-in ElxaOS username as hacker name, or 'hacker_kid' as fallback.
    _getDefaultHackerName() {
        try {
            const username = elxaOS?.loginService?.currentUser?.username;
            return username && !elxaOS.loginService.currentUser.isGuest ? username : 'hacker_kid';
        } catch (e) {
            return 'hacker_kid';
        }
    }

    // Persists hacker name and clearance level to the user's registry entry.
    _saveState() {
        try {
            elxaOS.registry.setState('duckConsole', {
                hackerName:    this.user,
                securityLevel: this.securityLevel
            });
        } catch (e) {
            console.warn('DUCK Console: could not save state', e);
        }
    }

    checkInitialWiFiStatus() {
        // Check if WiFi service exists and is connected
        if (typeof elxaOS !== 'undefined' && elxaOS.wifiService) {
            this.isOnline = elxaOS.wifiService.isOnline();
            if (this.isOnline) {
                console.log('DUCK Console: WiFi already connected on startup');
            }
        }
    }

    async launch() {
        const windowId = `duck-console-${Date.now()}`;

        // Re-check WiFi status on every launch — constructor runs before
        // elxaOS is assigned to the global, so the initial check always misses.
        this.checkInitialWiFiStatus();

        // Load persisted hacker name + clearance level from registry
        try {
            const saved = await elxaOS.registry.getState('duckConsole');
            if (saved) {
                if (saved.hackerName)    this.user          = saved.hackerName;
                if (saved.securityLevel) this.securityLevel = saved.securityLevel;
            }
        } catch (e) {
            // No saved state yet — first launch, defaults are fine
        }
        
        const windowContent = this.createConsoleInterface(windowId);
        
        this.windowManager.createWindow(
            windowId,
            `${ElxaIcons.render('duck-console', 'ui')} DUCK Console v2.0 [CLASSIFIED]`,
            windowContent,
            { width: '700px', height: '500px', x: '150px', y: '100px' }
        );
        
        this.activeWindows.add(windowId);
        
        // Clean up on window close
        const onWindowClosed = (data) => {
            if (data.id === windowId) {
                this.activeWindows.delete(windowId);
                this.eventBus.off('window.closed', onWindowClosed);
            }
        };
        this.eventBus.on('window.closed', onWindowClosed);
        
        this.setupEventHandlers(windowId);
        this.initializeConsole(windowId);
        
        // Update network status display after a brief delay to ensure DOM is ready
        setTimeout(() => {
            this.updateNetworkStatusDisplay(windowId);
        }, 100);
        
        return windowId;
    }

    // =================================
    // CLEANUP
    // =================================
    destroy() {
        this.eventBus.off('wifi.connected', this._onWifiConnected);
        this.eventBus.off('wifi.disconnected', this._onWifiDisconnected);
        this.activeWindows.clear();
    }

    createConsoleInterface(windowId) {
        return `
            <div class="duck-console" data-console-id="${windowId}">
                <div class="console-header">
                    <div class="console-title">DUCK OS Console - Direct User Command Kernel</div>
                    <div class="console-status">
                        <span class="user-status">USER: ${this.user}</span>
                        <span class="security-level">CLEARANCE: LEVEL ${this.securityLevel}</span>
                        <span class="network-status ${this.isOnline ? 'online' : 'offline'}">
                            ${this.isOnline ? `${ElxaIcons.renderAction('wifi')} ONLINE` : `${ElxaIcons.renderAction('wifi-off')} OFFLINE`}
                        </span>
                    </div>
                </div>
                <div class="console-output" id="console-output-${windowId}">
                    <!-- Console output will be populated here -->
                </div>
                <div class="console-input-area">
                    <span class="console-prompt" id="console-prompt-${windowId}">${this.getPrompt()}</span>
                    <input type="text" class="console-input" id="console-input-${windowId}" autocomplete="off" spellcheck="false">
                </div>
            </div>
        `;
    }

    setupEventHandlers(windowId) {
        const consoleInput = document.getElementById(`console-input-${windowId}`);
        if (!consoleInput) return;

        // Handle command entry
        consoleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = consoleInput.value.trim();
                if (command) {
                    this.executeCommand(command, windowId);
                    this.commandHistory.push(command);
                    this.historyIndex = this.commandHistory.length;
                }
                consoleInput.value = '';
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    consoleInput.value = this.commandHistory[this.historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex < this.commandHistory.length - 1) {
                    this.historyIndex++;
                    consoleInput.value = this.commandHistory[this.historyIndex];
                } else {
                    this.historyIndex = this.commandHistory.length;
                    consoleInput.value = '';
                }
            }
        });

        // Auto-focus input when clicking in console
        const consoleElement = document.querySelector(`[data-console-id="${windowId}"]`);
        consoleElement.addEventListener('click', () => {
            consoleInput.focus();
        });

        // Focus input initially
        setTimeout(() => consoleInput.focus(), 100);
    }

    initializeConsole(windowId) {
        const bootMessages = [
            '🦆 DUCK OS Console Initializing...',
            '🔧 Loading command protocols...',
            '🔐 Establishing secure channels...',
            '🐱 Connecting to Abby Virtual Assistant...',
            '🐍 Mr. Snake-e CEO Network standby...',
            '✅ System ready for command input',
            '',
            '💡 Type "help" for available commands',
            '🔍 Type "abby help" to talk to your virtual assistant',
            '🏢 Type "snakee" to enter CEO mode',
            ''
        ];

        bootMessages.forEach((message, index) => {
            setTimeout(() => {
                this.outputToConsole(message, index === bootMessages.length - 4 ? 'success' : 'system', windowId);
            }, index * 200);
        });
    }

    executeCommand(command, windowId) {
        // If we're mid-puzzle, route the input as an answer (no echo, no normal routing)
        if (this.pendingUpgrade) {
            this.outputToConsole(`[ANSWER]> ${command}`, 'command', windowId);
            this.checkUpgradeAnswer(command, windowId);
            return;
        }

        // Echo the command
        this.outputToConsole(`${this.getPrompt()}${command}`, 'command', windowId);

        this.eventBus.emit('console.command', { command: command.trim() });
        
        // Only lowercase the command token — keep params in original case
        // so filenames like 'Documents' and 'MyFolder' resolve correctly in the FS.
        const rawArgs = command.trim().split(/\s+/);
        const cmd = rawArgs[0].toLowerCase();
        const params = rawArgs.slice(1);

        // Level gate: block commands above current clearance before routing
        const requiredLevel = this.levelRequirements[cmd];
        if (requiredLevel && this.securityLevel < requiredLevel) {
            this.outputToConsole(`🔒 CLASSIFIED — Level ${requiredLevel} clearance required`, 'error', windowId);
            this.outputToConsole(`📊 Your clearance: Level ${this.securityLevel} (${this._getLevelName(this.securityLevel)})`, 'info', windowId);
            this.outputToConsole(`⬆️  Type 'upgrade' to attempt your next clearance challenge`, 'info', windowId);
            return;
        }

        // Command routing
        switch (cmd) {
            case 'help':
                this.showHelp(windowId);
                break;
            case 'clear':
            case 'cls':
                this.clearConsole(windowId);
                break;
            case 'ls':
            case 'dir':
                this.listDirectory(windowId);
                break;
            case 'cd':
                this.changeDirectory(params.join(' '), windowId);
                break;
            case 'pwd':
                this.printWorkingDirectory(windowId);
                break;
            case 'mkdir':
                this.makeDirectory(params.join(' '), windowId);
                break;
            case 'cat':
            case 'type':
                this.displayFile(params.join(' '), windowId);
                break;
            case 'whoami':
                this.whoAmI(windowId);
                break;
            case 'setuser':
                this.setUserCommand(params, windowId);
                break;
            case 'hack':
                this.hackCommand(params, windowId);
                break;
            case 'decrypt':
                this.decryptCommand(params, windowId);
                break;
            case 'matrix':
                this.matrixCommand(windowId);
                break;
            case 'math':
                this.mathCommand(params, windowId);
                break;
            case 'googolplex':
                this.googolplexCommand(windowId);
                break;
            case 'tree':
                this.treeCommand(params, windowId);
                break;
            case 'enigma':
                this.enigmaCommand(params, windowId);
                break;
            case 'abby':
                this.abbyCommand(params, windowId);
                break;
            case 'snakee':
                this.snakeCommand(params, windowId);
                break;
            case 'network':
            case 'netstat':
                this.networkCommand(params, windowId);
                break;
            case 'ping':
                this.pingCommand(params, windowId);
                break;
            case 'scan':
                this.scanCommand(params, windowId);
                break;
            case 'firewall':
                this.firewallCommand(params, windowId);
                break;
            case 'trace':
                this.traceCommand(params, windowId);
                break;
            case 'whoislive':
                this.whoisLiveCommand(windowId);
                break;
            case 'binary':
                this.binaryCommand(params, windowId);
                break;
            case 'convert':
                this.convertCommand(params, windowId);
                break;
            case 'rainbow':
                this.rainbowCommand(params, windowId);
                break;
            case 'glitch':
                this.glitchCommand(params, windowId);
                break;
            case 'explode':
                this.explodeCommand(params, windowId);
                break;
            case 'decode':
                this.decodeCommand(params, windowId);
                break;
            case 'override':
                this.overrideCommand(windowId);
                break;
            case 'upgrade':
                this.upgradeCommand(windowId);
                break;
            case 'status':
                this.statusCommand(windowId);
                break;
            case 'fortune':
                this.fortuneCommand(windowId);
                break;
            // Special System 0 commands
            case 'duck':
                this.outputToConsole('🦆 Quack! Duck command acknowledged.', 'accent', windowId);
                break;
            case 'snake':
                this.outputToConsole('🐍 Hissss! Snake command acknowledged.', 'accent', windowId);
                break;
            case 'zero':
                this.outputToConsole('0️⃣ Zero command acknowledged.', 'accent', windowId);
                break;
            case 'meow':
                this.outputToConsole('🐱 Meow! Cat command acknowledged.', 'accent', windowId);
                break;
            default:
                this.outputToConsole(`❌ Command not recognized: ${cmd}`, 'error', windowId);
                this.outputToConsole(`💡 Type "help" for available commands`, 'info', windowId);
        }
    }

    showHelp(windowId) {
        const lvl = this.securityLevel;
        const locked = (n) => `  [LOCKED — Level ${n} required]`;

        const lines = [
            `🦆 DUCK Console — ${this._getLevelName(lvl)} (Level ${lvl}/5)`,
            '═══════════════════════════════════════',
            '',
            '📁 FILE SYSTEM:',
            '  ls, dir          - List directory contents',
            '  cd [path]        - Change directory (cd ~ = home)',
            '  pwd              - Show current directory',
            '  mkdir [name]     - Create a directory',
            '  cat [file]       - Display file contents',
            '',
            '🔐 HACKER COMMANDS:',
            '  hack [target]    - Initiate a hacking sequence',
            '  decrypt [data]   - Decrypt encoded data',
            '  matrix           - Enter the Matrix',
            '',
            '🐱 VIRTUAL ASSISTANTS:',
            '  abby [cmd]       - Talk to Abby (your cat assistant)',
            '  snakee [cmd]     - Enter Mr. Snake-e CEO mode',
            '',
            '🔧 SYSTEM:',
            '  whoami           - Show user info',
            '  setuser [name]   - Change your hacker name',
            '  status           - System status report',
            '  fortune          - Get a random fortune',
            '  upgrade          - Attempt clearance upgrade challenge',
            '  clear / cls      - Clear the console',
            '  help             - Show this menu',
            '',
        ];

        // Level 2
        if (lvl >= 2) {
            lines.push('🔢 MATH & SCIENCE: (Level 2)');
            lines.push('  math [operation] - Advanced calculations');
            lines.push('  binary [n]       - Convert decimal ↔ binary');
            lines.push('  convert [val]    - Unit converter (try: convert 100 miles)');
            lines.push('  googolplex       - Explore huge numbers');
            lines.push('  tree [n]         - TREE function explainer');
            lines.push('  enigma [text]    - Enigma machine cipher');
        } else {
            lines.push(locked(2) + ' 🔢 Math & Science commands');
        }
        lines.push('');

        // Level 3
        if (lvl >= 3) {
            lines.push('🌐 NETWORK: (Level 3, requires WiFi)');
            lines.push('  network / netstat - Network status');
            lines.push('  ping [target]     - Test connectivity');
            lines.push('  scan              - Vulnerability scan');
            lines.push('  firewall [cmd]    - Firewall control');
            lines.push('  trace [target]    - Traceroute through Snakesia');
            lines.push('  whoislive         - See who\'s online in Snakesia');
        } else {
            lines.push(locked(3) + ' 🌐 Network Operative commands');
        }
        lines.push('');

        // Level 4
        if (lvl >= 4) {
            lines.push('⚡ ELITE COMMANDS: (Level 4)');
            lines.push('  rainbow [text]   - Make text rainbow-colored');
            lines.push('  glitch [text]    - Corrupt text with glitch effects');
            lines.push('  explode [text]   - Dramatic letter-by-letter reveal');
            lines.push('  decode [text]    - Multi-layer cipher breakdown');
        } else {
            lines.push(locked(4) + ' ⚡ Elite Hacker commands');
        }
        lines.push('');

        // Level 5
        if (lvl >= 5) {
            lines.push('👑 SUPREME OVERLORD: (Level 5)');
            lines.push('  override         - Full system override sequence');
            lines.push('  snakee classified - Access Snake-e Corp classified files');
        } else {
            lines.push(locked(5) + ' 👑 Supreme Overlord commands');
        }

        lines.forEach(line => {
            const isHeader = line.includes('═') || (line.endsWith(':') && !line.startsWith(' '));
            const isLocked = line.includes('[LOCKED');
            this.outputToConsole(line, isHeader ? 'accent' : isLocked ? 'warning' : 'info', windowId);
        });
    }

    // File System Commands
    listDirectory(windowId) {
        const contents = this.fileSystem.listContents(this.currentPath);
        
        if (contents.length === 0) {
            this.outputToConsole('📂 Directory is empty', 'info', windowId);
            return;
        }

        this.outputToConsole(`📂 Contents of ${this.getPathString()}:`, 'info', windowId);
        
        contents.forEach(item => {
            const icon = item.type === 'folder' ? '📁' : '📄';
            const size = item.type === 'file' ? ` (${item.content?.length || 0} bytes)` : '';
            this.outputToConsole(`${icon} ${item.name}${size}`, 'file', windowId);
        });
    }

    changeDirectory(path, windowId) {
        // No arg or '~' — go home
        if (!path || path === '~') {
            this.currentPath = [...this.homeDir];
            this.updatePrompt(windowId);
            this.outputToConsole('📂 Moved to home directory', 'success', windowId);
            return;
        }

        if (path === '..') {
            // Don't allow navigating above homeDir
            if (this.currentPath.length > this.homeDir.length) {
                this.currentPath.pop();
                this.updatePrompt(windowId);
                this.outputToConsole(`📂 Moved up to ${this.getPathString()}`, 'success', windowId);
            } else {
                this.outputToConsole('❌ Already at home directory', 'error', windowId);
            }
            return;
        }

        const newPath = [...this.currentPath, path];
        const folder = this.fileSystem.getFolder(newPath);
        
        if (folder && folder.type === 'folder') {
            this.currentPath = newPath;
            this.updatePrompt(windowId);
            this.outputToConsole(`📂 Moved to ${this.getPathString()}`, 'success', windowId);
        } else {
            this.outputToConsole(`❌ Directory not found: ${path}`, 'error', windowId);
        }
    }

    printWorkingDirectory(windowId) {
        this.outputToConsole(`📍 Current directory: ${this.getPathString()}`, 'info', windowId);
    }

    makeDirectory(name, windowId) {
        if (!name) {
            this.outputToConsole('❌ Please specify a directory name', 'error', windowId);
            return;
        }

        // Validate name — no slashes or dots that could be path traversal
        if (name.includes('/') || name.includes('\\') || name === '..' || name === '.') {
            this.outputToConsole('❌ Invalid directory name', 'error', windowId);
            return;
        }

        // Guard: only create folders at or below homeDir
        const isAtOrBelowHome = this.currentPath.length >= this.homeDir.length &&
            this.homeDir.every((seg, i) => this.currentPath[i] === seg);
        if (!isAtOrBelowHome) {
            this.outputToConsole('❌ Cannot create folders outside your home directory', 'error', windowId);
            return;
        }

        if (this.fileSystem.createFolder(this.currentPath, name)) {
            this.outputToConsole(`📁 Created directory: ${name}`, 'success', windowId);
        } else {
            this.outputToConsole(`❌ Failed to create directory: ${name} (already exists?)`, 'error', windowId);
        }
    }

    displayFile(filename, windowId) {
        if (!filename) {
            this.outputToConsole('❌ Please specify a filename', 'error', windowId);
            return;
        }

        const file = this.fileSystem.getFile(this.currentPath, filename);
        if (file) {
            this.outputToConsole(`📄 Contents of ${filename}:`, 'info', windowId);
            this.outputToConsole('─'.repeat(40), 'accent', windowId);
            this.outputToConsole(file.content || '[Empty file]', 'file', windowId);
            this.outputToConsole('─'.repeat(40), 'accent', windowId);
        } else {
            this.outputToConsole(`❌ File not found: ${filename}`, 'error', windowId);
        }
    }

    // Hacker Commands
    whoAmI(windowId) {
        const responses = [
            `👤 Hacker Name: ${this.user}`,
            `🔐 Security Clearance: Level ${this.securityLevel}`,
            `🎯 Specialization: Advanced Mathematics & Cat Whispering`,
            `🏆 Achievement: Master of the Googolplex`,
            `🐱 Virtual Assistant: Abby (Status: ${this.abbyMood})`,
            `🐍 CEO Contact: Mr. Snake-e of Snakesia Industries`,
            `💡 Tip: use 'setuser [name]' to change your hacker name`
        ];

        responses.forEach(response => {
            this.outputToConsole(response, 'success', windowId);
        });
    }

    setUserCommand(params, windowId) {
        const newName = params.join(' ').trim();

        if (!newName) {
            this.outputToConsole('❌ Usage: setuser [new name]', 'error', windowId);
            this.outputToConsole(`👤 Current hacker name: ${this.user}`, 'info', windowId);
            return;
        }

        // Basic validation — alphanumeric, underscores, hyphens only
        if (!/^[a-zA-Z0-9_\-]{1,20}$/.test(newName)) {
            this.outputToConsole('❌ Name must be 1-20 characters: letters, numbers, _ or - only', 'error', windowId);
            return;
        }

        const oldName = this.user;
        this.user = newName;
        this._saveState(); // persist the new hacker name

        this.outputToConsole(`✅ Hacker name changed: ${oldName} → ${newName}`, 'success', windowId);
        this.outputToConsole(`👷 Welcome to the console, ${newName}! 👋`, 'accent', windowId);

        // Update the header USER display and the prompt in all active windows
        this.activeWindows.forEach(wid => {
            this.updatePrompt(wid);
            const userEl = document.querySelector(`[data-console-id="${wid}"] .user-status`);
            if (userEl) userEl.textContent = `USER: ${this.user}`;
        });
    }

    hackCommand(params, windowId) {
        const target = params.join(' ') || 'default_system';
        const elite = this.securityLevel >= 4;

        this.outputToConsole(`🔓 Initiating hack sequence on: ${target}`, 'warning', windowId);
        this.outputToConsole('⚡ Scanning for vulnerabilities...', 'info', windowId);

        if (elite) {
            this.outputToConsole('👁️  Elite protocols active — deploying advanced intrusion suite...', 'accent', windowId);
        }
        
        setTimeout(() => {
            this.outputToConsole('🔍 Buffer overflow detected!', 'success', windowId);
            this.outputToConsole('🔑 Bypassing encryption layers...', 'info', windowId);

            if (elite) {
                setTimeout(() => {
                    this.outputToConsole('🌍 Routing through Snakesian proxy servers...', 'info', windowId);
                    this.outputToConsole('🐍 Snake-E Corp relay: CONNECTED', 'success', windowId);
                    this.outputToConsole('🔐 Root certificate spoofed successfully', 'accent', windowId);
                }, 600);
            }
            
            setTimeout(() => {
                const successRate = Math.random();
                if (successRate > 0.3) {
                    this.outputToConsole('✅ ACCESS GRANTED!', 'success', windowId);
                    this.outputToConsole(`🏆 You are now the admin of ${target}`, 'success', windowId);
                    if (elite) {
                        const classified = [
                            '📶 Accessing classified files...',
                            '📜 DOCUMENT: "Snakesia Nuclear Snake Count: [REDACTED]"',
                            '📜 DOCUMENT: "Mr. Snake-e\'s Denali maintenance schedule: TOP SECRET"',
                            '📜 DOCUMENT: "Location of Pushing Cat\'s secret nap spots: CLASSIFIED"',
                            '🔒 Further files require Supreme Overlord clearance.'
                        ];
                        classified.forEach((line, i) => {
                            setTimeout(() => this.outputToConsole(line, 'accent', windowId), i * 250);
                        });
                    }
                } else {
                    this.outputToConsole('❌ HACK FAILED — ICE countermeasures detected!', 'error', windowId);
                    if (elite) {
                        this.outputToConsole('🚨 Snakesian Cyber Police alerted! Covering tracks...', 'warning', windowId);
                        this.outputToConsole('🐍 Escape route via Snake-E Corp relay: SUCCESS', 'accent', windowId);
                    } else {
                        this.outputToConsole('🚨 Recommend trying a different approach', 'warning', windowId);
                    }
                }
            }, elite ? 2200 : 1500);
        }, 1000);
    }

    decryptCommand(params, windowId) {
        const data = params.join(' ');
        if (!data) {
            this.outputToConsole('❌ Please provide data to decrypt', 'error', windowId);
            return;
        }

        this.outputToConsole('🔐 Initializing quantum decryption...', 'info', windowId);
        
        setTimeout(() => {
            // Simple "decryption" - just reverse the string and add some flair
            const decrypted = data.split('').reverse().join('');
            this.outputToConsole('✅ Decryption complete!', 'success', windowId);
            this.outputToConsole(`📝 Original: ${data}`, 'info', windowId);
            this.outputToConsole(`🔓 Decrypted: ${decrypted}`, 'success', windowId);
            this.outputToConsole('💡 Quantum algorithms are amazing!', 'accent', windowId);
        }, 1200);
    }

    matrixCommand(windowId) {
        this.outputToConsole('🟢 Entering the Matrix...', 'success', windowId);
        this.outputToConsole('', 'system', windowId);
        
        const matrixLines = [
            '01100110 01101111 01101100 01101100 01101111 01110111',
            '01110100 01101000 01100101 00100000 01110111 01101000',
            '01101001 01110100 01100101 00100000 01110010 01100001',
            '01100010 01100010 01101001 01110100 00100001 00100001',
            '',
            'Translation: "follow the white rabbit!!"',
            '',
            '🐰 There is no spoon... but there are infinite cats! 🐱'
        ];

        matrixLines.forEach((line, index) => {
            setTimeout(() => {
                this.outputToConsole(line, index < 4 ? 'success' : 'accent', windowId);
            }, index * 300);
        });
    }

    // Math Commands
    mathCommand(params, windowId) {
        const operation = params.join(' ');
        
        if (!operation) {
            const mathHelp = [
                '🔢 Advanced Mathematics Module',
                '═══════════════════════════════',
                'Examples:',
                '  math factorial 10',
                '  math fibonacci 15',
                '  math prime 97',
                '  math powers 2^100',
                '  math infinity'
            ];
            
            mathHelp.forEach(line => {
                this.outputToConsole(line, 'info', windowId);
            });
            return;
        }

        this.outputToConsole(`🧮 Computing: ${operation}`, 'info', windowId);
        
        if (operation.includes('factorial')) {
            const num = parseInt(operation.match(/\d+/)?.[0]) || 5;
            let result = 1;
            for (let i = 1; i <= num; i++) {
                result *= i;
            }
            this.outputToConsole(`📊 ${num}! = ${result.toLocaleString()}`, 'success', windowId);
        } else if (operation.includes('fibonacci')) {
            const num = parseInt(operation.match(/\d+/)?.[0]) || 10;
            let a = 0, b = 1;
            let sequence = [a, b];
            for (let i = 2; i < num; i++) {
                let next = a + b;
                sequence.push(next);
                a = b;
                b = next;
            }
            this.outputToConsole(`🌀 Fibonacci sequence (${num}): ${sequence.join(', ')}`, 'success', windowId);
        } else if (operation.includes('prime')) {
            const num = parseInt(operation.match(/\d+/)?.[0]) || 17;
            const isPrime = this.checkPrime(num);
            this.outputToConsole(`🔍 ${num} is ${isPrime ? '' : 'NOT '}a prime number!`, 'success', windowId);
        } else if (operation.includes('infinity')) {
            this.outputToConsole('♾️ Infinity is not a number, but a concept!', 'accent', windowId);
            this.outputToConsole('🤔 But some infinities are bigger than others...', 'info', windowId);
        } else {
            this.outputToConsole('🎯 Advanced calculation complete! (Results classified)', 'success', windowId);
        }
    }

    googolplexCommand(windowId) {
        const facts = [
            '🔢 GOOGOLPLEX ANALYSIS INITIATED',
            '═══════════════════════════════════',
            '',
            '📈 A googol = 10^100 (1 followed by 100 zeros)',
            '🚀 A googolplex = 10^googol = 10^(10^100)',
            '',
            '🌌 Mind-blowing facts:',
            '• If you wrote a googolplex in standard form,',
            '  it would have more digits than atoms in the observable universe!',
            '• A googolplex is so large that there isn\'t enough space',
            '  in the universe to write it out in decimal notation!',
            '',
            '🧠 Your brain just processed information about a number',
            '   that\'s literally too big to fully comprehend!',
            '',
            '🏆 Achievement Unlocked: Googolplex Master!'
        ];

        facts.forEach((fact, index) => {
            setTimeout(() => {
                this.outputToConsole(fact, index === 0 || fact.includes('═') ? 'accent' : 'info', windowId);
            }, index * 200);
        });
    }

    treeCommand(params, windowId) {
        const n = parseInt(params[0]) || 3;
        
        if (n > 5) {
            this.outputToConsole('⚠️ Tree numbers above 5 are beyond human comprehension!', 'warning', windowId);
            this.outputToConsole('🧠 Your brain would literally melt trying to understand Tree(6)!', 'accent', windowId);
            return;
        }

        const treeInfo = [
            `🌳 TREE(${n}) CALCULATION INITIATED`,
            '══════════════════════════════════',
            '',
            '🔢 Tree numbers make googolplex look tiny!',
            '📊 TREE(1) = 1',
            '📊 TREE(2) = 3', 
            '📊 TREE(3) = a number so large it defies imagination!',
            '',
            '🤯 Fun fact: TREE(3) is larger than Graham\'s number!',
            '🌌 It\'s so big that even mathematicians can\'t write it down!',
            '',
            `✅ Your request for TREE(${n}) has been... acknowledged.`,
            '🏆 Achievement: Tree Function Explorer!'
        ];

        treeInfo.forEach((info, index) => {
            setTimeout(() => {
                this.outputToConsole(info, index === 0 || info.includes('═') ? 'accent' : 'info', windowId);
            }, index * 300);
        });
    }

    enigmaCommand(params, windowId) {
        const text = params.join(' ');
        
        if (!text) {
            this.outputToConsole('🔐 Enigma Machine - Enter text to encrypt', 'info', windowId);
            this.outputToConsole('💡 Example: enigma hello world', 'info', windowId);
            return;
        }

        this.outputToConsole('⚙️ Initializing Enigma rotors...', 'info', windowId);
        
        setTimeout(() => {
            // Simple substitution cipher for demo
            const encrypted = text.split('').map(char => {
                if (char.match(/[a-zA-Z]/)) {
                    const code = char.charCodeAt(0);
                    const isUpper = char === char.toUpperCase();
                    const base = isUpper ? 65 : 97;
                    return String.fromCharCode(((code - base + 13) % 26) + base);
                }
                return char;
            }).join('');

            this.outputToConsole('✅ Enigma encryption complete!', 'success', windowId);
            this.outputToConsole(`📝 Original: ${text}`, 'info', windowId);
            this.outputToConsole(`🔐 Encrypted: ${encrypted}`, 'success', windowId);
            this.outputToConsole('🏛️ Turing would be proud!', 'accent', windowId);
        }, 1000);
    }

    // Virtual Assistant Commands
    abbyCommand(params, windowId) {
        const command = params.join(' ');
        
        if (!command || command === 'help') {
            const abbyHelp = [
                '🐱 ABBY VIRTUAL ASSISTANT',
                '═══════════════════════════',
                '',
                '💖 "Hello! I\'m Abby, your virtual cat assistant!"',
                '',
                'Available commands:',
                '  abby status    - Check on Abby',
                '  abby mood      - See how Abby is feeling',
                '  abby purr      - Make Abby purr',
                '  abby joke      - Abby tells a cat joke',
                '  abby wisdom    - Get wise advice from Abby',
                '  abby memory    - Share a special memory',
                '',
                '💕 Abby is always here to help and keep you company!'
            ];
            
            abbyHelp.forEach(line => {
                this.outputToConsole(line, line.includes('═') || line.includes('💖') ? 'accent' : 'info', windowId);
            });
            return;
        }

        switch (command.toLowerCase()) {
            case 'status':
                this.outputToConsole('🐱 "I\'m doing great! My virtual whiskers are twitching with excitement!"', 'accent', windowId);
                this.outputToConsole(`💫 Abby is feeling ${this.abbyMood} today`, 'info', windowId);
                break;
                
            case 'mood':
                const moods = ['playful', 'sleepy', 'curious', 'happy', 'mischievous'];
                this.abbyMood = moods[Math.floor(Math.random() * moods.length)];
                this.outputToConsole(`🐱 "I'm feeling ${this.abbyMood} right now!"`, 'accent', windowId);
                break;
                
            case 'purr':
                this.outputToConsole('🐱 "Purrrrrrrrrrrrrrr... 💕"', 'accent', windowId);
                this.outputToConsole('✨ You feel a warm, comforting presence', 'info', windowId);
                break;
                
            case 'joke':
                const jokes = [
                    '"Why don\'t cats play poker? Because they\'re afraid of cheetahs!" 😹',
                    '"What do you call a cat that works for the Red Cross? A first-aid kit!" 🐱',
                    '"How do you know cats are smarter than dogs? You\'ve never seen eight cats pulling a sled!" 🛷',
                    '"What\'s the difference between a cat and a comma? One has claws at the end of paws, the other has a pause at the end of a clause!" 📝'
                ];
                const joke = jokes[Math.floor(Math.random() * jokes.length)];
                this.outputToConsole(`🐱 ${joke}`, 'accent', windowId);
                break;
                
            case 'wisdom':
                const wisdom = [
                    '"Remember: in the computer world, curiosity never killed the cat!" 🖥️',
                    '"The best debugging happens when you take a nap break - trust me!" 😴',
                    '"Every great mathematician was once a kitten learning to count!" 🔢',
                    '"Sometimes the answer is right under your nose... like my treats!" 🐟'
                ];
                const advice = wisdom[Math.floor(Math.random() * wisdom.length)];
                this.outputToConsole(`🐱 ${advice}`, 'accent', windowId);
                break;
                
            case 'memory':
                const memory = [
                    '"I remember when Honey used to lay close to me...ah, he was so sweet." 💖',
                    '🐱 "I remember all the wonderful times we had together..."',
                    '💖 "Playing with string, sunny windowsill naps, and watching you learn!"',
                    '✨ "I\'m always with you in your heart!" 💕',
                    '"You were the very best boy I ever loved!" 💕',
                    '✨ "Kitty heaven is so amazing...there\'s all the fish I can eat, and lots of warm napping spots!"',
                    '🐱 "Don\'t you worry, I\'m taking good care of Honey."',
                ];
                const mem = memory[Math.floor(Math.random() * memory.length)];
                this.outputToConsole(`🐱 ${mem}`, 'accent', windowId);
                break;
                
            default:
                this.outputToConsole(`🐱 "Meow? I don't understand '${command}'. Try 'abby help'!"`, 'accent', windowId);
        }
    }

    snakeCommand(params, windowId) {
        const command = params.join(' ');
        
        if (!this.snakeeCEOMode && !command) {
            this.snakeeCEOMode = true;
            this.outputToConsole('🐍 Connecting to Snakesia Industries...', 'info', windowId);
            
            setTimeout(() => {
                const intro = [
                    '🏢 SNAKESIA INDUSTRIES CEO NETWORK',
                    '═══════════════════════════════════',
                    '',
                    '🐍 "Greetingsss! Mr. Snake-e here, CEO of ElxaCorp!"',
                    '🚗 "Just parked my Denali, ready for business!"',
                    '',
                    '💼 CEO Commands available:',
                    '  snakee status     - Company status report',
                    '  snakee workers    - Check on employee welfare',
                    '  snakee benefits   - Review benefit packages',
                    '  snakee denali     - Talk about my awesome car',
                    '  snakee meeting    - Schedule executive meeting',
                    '  snakee exit       - Leave CEO mode',
                    '',
                    '🌟 "Remember: Happy employees = successful businessss!"'
                ];
                
                intro.forEach((line, index) => {
                    setTimeout(() => {
                        this.outputToConsole(line, line.includes('═') || line.includes('🐍') || line.includes('🌟') ? 'accent' : 'info', windowId);
                    }, index * 100);
                });
            }, 800);
            return;
        }

        if (command === 'exit') {
            this.snakeeCEOMode = false;
            this.outputToConsole('🐍 "Time to slither back to the office! Sssee you later!"', 'accent', windowId);
            return;
        }

        if (!this.snakeeCEOMode) {
            this.outputToConsole('🐍 "You need to enter CEO mode first! Just type \'snakee\'"', 'accent', windowId);
            return;
        }

        switch (command.toLowerCase()) {
            case 'status':
                this.outputToConsole('🐍 "ElxaCorp is thriving!"', 'accent', windowId);
                this.outputToConsole('📈 "Profits up 500%, employee satisfaction at all-time high!"', 'success', windowId);
                this.outputToConsole('🏆 "We just won \'Best Workplace for Reptiles\' award!"', 'success', windowId);
                break;
                
            case 'workers':
                this.outputToConsole('🐍 "Our employees are the heart of Snakesia!"', 'accent', windowId);
                this.outputToConsole('💰 "Just approved a 20% raise for everyone!"', 'success', windowId);
                this.outputToConsole('🏖️ "Plus 6 weeks paid vacation and unlimited sick days!"', 'success', windowId);
                this.outputToConsole('🍕 "Free pizza Fridays and smoothie bars in every office!"', 'info', windowId);
                break;
                
            case 'benefits':
                this.outputToConsole('🐍 "We have the bessst benefits package in the industry!"', 'accent', windowId);
                this.outputToConsole('🏥 "Full health, dental, vision, and scale polishing coverage!"', 'info', windowId);
                this.outputToConsole('👶 "Maternity/Paternity leave: 1 full year paid!"', 'success', windowId);
                this.outputToConsole('🎓 "Free college tuition for employees and their kids!"', 'success', windowId);
                break;
                
            case 'denali':
                this.outputToConsole('🐍 "My Denali is the bessst vehicle ever made!"', 'accent', windowId);
                this.outputToConsole('🚗 "Custom snake-sized controls and heated seats!"', 'info', windowId);
                this.outputToConsole('🎵 "Premium sound system for my favorite hissss-ic!"', 'info', windowId);
                this.outputToConsole('💎 "Diamond-studded steering wheel - only the finest!"', 'success', windowId);
                break;
                
            case 'meeting':
                this.outputToConsole('🐍 "Scheduling emergency executive meeting..."', 'accent', windowId);
                this.outputToConsole('📅 "Topic: How to make Snakesia even more amazing!"', 'info', windowId);
                this.outputToConsole('🥳 "Agenda item 1: More fun at work!"', 'success', windowId);
                this.outputToConsole('💰 "Agenda item 2: Another bonus for everyone!"', 'success', windowId);
                break;

            case 'classified':
                if (this.securityLevel < 5) {
                    this.outputToConsole('🐍 "Sssorry! Those files are Level 5 Supreme Overlord only!"', 'accent', windowId);
                    this.outputToConsole('🔒 Access denied. Type \'upgrade\' to advance your clearance.', 'error', windowId);
                } else {
                    const classifiedDocs = [
                        '🐍 "Oh! A Supreme Overlord! Come in, come in..."',
                        '',
                        '📜 TOP SECRET — SNAKE-E CORP CLASSIFIED FILES',
                        '══════════════════════════════════════════',
                        '📝 FILE 001: The Denali is actually a converted submarine.',
                        '📝 FILE 002: Mr. Snake-e\'s real name is Gerald.',
                        '📝 FILE 003: ElxaCorp\'s HQ is built on 40,000 old snake skins.',
                        '📝 FILE 004: The currency "snakes" originally referred to actual snakes.',
                        '📝 FILE 005: Pushing Cat is on ElxaCorp\'s payroll. Cat-egory: Chaos Agent.',
                        '',
                        '🐍 "You didn\'t read any of that. Sssee yourself out!"'
                    ];
                    classifiedDocs.forEach((line, i) => {
                        setTimeout(() => {
                            this.outputToConsole(line, line.includes('═') ? 'accent' : 'success', windowId);
                        }, i * 200);
                    });
                }
                break;
                
            default:
                this.outputToConsole(`🐍 "Hmm, '${command}' isn't in my CEO handbook. Try another command!"`, 'accent', windowId);
        }
    }

    // =================================
    // LEVEL 2 — MATH & SCIENCE COMMANDS
    // =================================

    binaryCommand(params, windowId) {
        const input = params.join('');
        if (!input) {
            this.outputToConsole('🔢 binary [number]  — convert decimal to binary or binary to decimal', 'info', windowId);
            this.outputToConsole('  Examples:  binary 42   → 101010', 'info', windowId);
            this.outputToConsole('             binary 1010 → 10 (if it looks like binary)', 'info', windowId);
            return;
        }

        const isBinary = /^[01]+$/.test(input);
        if (isBinary && input.length > 3) {
            // Looks like binary — convert to decimal
            const decimal = parseInt(input, 2);
            this.outputToConsole(`🔢 Binary → Decimal:`, 'info', windowId);
            this.outputToConsole(`   ${input}₂ = ${decimal}₁₀`, 'success', windowId);
        } else {
            // Convert decimal to binary
            const num = parseInt(input);
            if (isNaN(num) || num < 0) {
                this.outputToConsole('❌ Please enter a positive whole number', 'error', windowId);
                return;
            }
            if (num > 100000) {
                this.outputToConsole('⚠️  Number too large for the display! Try something under 100,000.', 'warning', windowId);
                return;
            }
            const binary = num.toString(2);
            this.outputToConsole(`🔢 Decimal → Binary:`, 'info', windowId);
            this.outputToConsole(`   ${num}₁₀ = ${binary}₂`, 'success', windowId);
            // Show the bit breakdown for small numbers
            if (num <= 255) {
                const padded = binary.padStart(8, '0');
                this.outputToConsole(`   8-bit: ${padded.slice(0,4)} ${padded.slice(4)}`, 'accent', windowId);
            }
        }
    }

    convertCommand(params, windowId) {
        const input = params.join(' ').toLowerCase();
        if (!input) {
            this.outputToConsole('🔄 Unit Converter — examples:', 'info', windowId);
            this.outputToConsole('  convert 100 miles       → km', 'info', windowId);
            this.outputToConsole('  convert 72 fahrenheit   → celsius', 'info', windowId);
            this.outputToConsole('  convert 10 kg           → pounds', 'info', windowId);
            this.outputToConsole('  convert 5 feet          → meters', 'info', windowId);
            return;
        }

        const num = parseFloat(input.match(/[\d.]+/)?.[0]);
        if (isNaN(num)) {
            this.outputToConsole('❌ Please include a number. Example: convert 100 miles', 'error', windowId);
            return;
        }

        this.outputToConsole(`🔄 Converting ${num}...`, 'info', windowId);

        if (input.includes('mile')) {
            this.outputToConsole(`📐 ${num} miles = ${(num * 1.60934).toFixed(2)} km`, 'success', windowId);
        } else if (input.includes('km') || input.includes('kilometer')) {
            this.outputToConsole(`📐 ${num} km = ${(num / 1.60934).toFixed(2)} miles`, 'success', windowId);
        } else if (input.includes('fahrenheit') || input.includes('f°') || input.includes('°f')) {
            this.outputToConsole(`🌡️  ${num}°F = ${((num - 32) * 5/9).toFixed(1)}°C`, 'success', windowId);
        } else if (input.includes('celsius') || input.includes('c°') || input.includes('°c')) {
            this.outputToConsole(`🌡️  ${num}°C = ${(num * 9/5 + 32).toFixed(1)}°F`, 'success', windowId);
        } else if (input.includes('kg') || input.includes('kilogram')) {
            this.outputToConsole(`⚖️  ${num} kg = ${(num * 2.20462).toFixed(2)} pounds`, 'success', windowId);
        } else if (input.includes('pound') || input.includes('lb')) {
            this.outputToConsole(`⚖️  ${num} pounds = ${(num / 2.20462).toFixed(2)} kg`, 'success', windowId);
        } else if (input.includes('feet') || input.includes('foot') || input.includes('ft')) {
            this.outputToConsole(`📐 ${num} feet = ${(num * 0.3048).toFixed(2)} meters`, 'success', windowId);
        } else if (input.includes('meter') || input.includes('metre')) {
            this.outputToConsole(`📐 ${num} meters = ${(num / 0.3048).toFixed(2)} feet`, 'success', windowId);
        } else if (input.includes('inch') || input.includes('in')) {
            this.outputToConsole(`📐 ${num} inches = ${(num * 2.54).toFixed(2)} cm`, 'success', windowId);
        } else if (input.includes('cm') || input.includes('centimeter')) {
            this.outputToConsole(`📐 ${num} cm = ${(num / 2.54).toFixed(2)} inches`, 'success', windowId);
        } else {
            this.outputToConsole('❓ Unit not recognized. Try: miles, km, fahrenheit, celsius, kg, pounds, feet, meters', 'warning', windowId);
        }
    }

    // =================================
    // LEVEL 3 — NETWORK COMMANDS
    // =================================

    traceCommand(params, windowId) {
        if (!this.isOnline) {
            this.outputToConsole('❌ Traceroute requires a network connection', 'error', windowId);
            return;
        }
        const target = params.join(' ') || 'snoogle.ex';
        this.outputToConsole(`📍 Tracing route to ${target}...`, 'info', windowId);
        this.outputToConsole('🔍 Mapping hops through Snakesian infrastructure:', 'info', windowId);
        this.outputToConsole('', 'info', windowId);

        const hops = [
            { ms: '2ms',   name: 'Local Gateway — DUCK Console Router' },
            { ms: '8ms',   name: 'Snakesia City Central Hub' },
            { ms: '14ms',  name: 'ElxaCorp Data Center (Floor 42)' },
            { ms: '19ms',  name: 'Snake-E Tower Relay Node' },
            { ms: '27ms',  name: 'Snakesia National Internet Exchange (SNIE)' },
            { ms: '33ms',  name: `${target} — DESTINATION REACHED` }
        ];

        hops.forEach((hop, i) => {
            setTimeout(() => {
                const type = i === hops.length - 1 ? 'success' : 'info';
                this.outputToConsole(`  ${(i+1).toString().padStart(2)}  ${hop.ms.padEnd(6)} ${hop.name}`, type, windowId);
            }, i * 400);
        });

        setTimeout(() => {
            this.outputToConsole('', 'info', windowId);
            this.outputToConsole(`✅ Traceroute complete! ${hops.length} hops, 0% packet loss.`, 'success', windowId);
        }, hops.length * 400 + 200);
    }

    whoisLiveCommand(windowId) {
        if (!this.isOnline) {
            this.outputToConsole('❌ whoislive requires a network connection', 'error', windowId);
            return;
        }
        this.outputToConsole('🌐 Scanning Snakesian network for active users...', 'info', windowId);

        const allUsers = [
            { name: 'mr_snake_e',    ping: '4ms',   status: 'In a board meeting (again)' },
            { name: 'pushing_cat',   ping: '??ms',  status: 'Status: suspicious' },
            { name: 'remi',          ping: '12ms',  status: 'Streaming live on Snakebook' },
            { name: 'mrs_snake_e',   ping: '88ms',  status: 'Napping (do not disturb)' },
            { name: 'rita',          ping: '7ms',   status: 'Working late at ElxaCorp' },
            { name: 'abby_cat',      ping: '1ms',   status: 'Right here with you 💕' },
            { name: 'sys_duck',      ping: '0ms',   status: 'DUCK Console daemon (that\'s you!)' }
        ];

        // Pick 3-5 random users to show as "online"
        const count = 3 + Math.floor(Math.random() * 3);
        const online = [...allUsers].sort(() => Math.random() - 0.5).slice(0, count);

        setTimeout(() => {
            this.outputToConsole('🟢 ONLINE USERS IN SNAKESIA:', 'success', windowId);
            this.outputToConsole('══════════════════════════════════════', 'accent', windowId);
            online.forEach(u => {
                this.outputToConsole(`  ● ${u.name.padEnd(16)} [${u.ping}]  ${u.status}`, 'info', windowId);
            });
            this.outputToConsole(`
${online.length} user(s) online of ${allUsers.length} registered.`, 'success', windowId);
        }, 800);
    }

    // =================================
    // LEVEL 4 — ELITE COMMANDS
    // =================================

    rainbowCommand(params, windowId) {
        const text = params.join(' ');
        if (!text) {
            this.outputToConsole('❌ Usage: rainbow [text]', 'error', windowId);
            return;
        }
        const colors = ['#ff4444', '#ff9900', '#ffee00', '#44dd44', '#4488ff', '#aa44ff'];
        let html = '';
        let colorIdx = 0;
        for (const char of text) {
            if (char === ' ') {
                html += ' ';
            } else {
                html += `<span style="color:${colors[colorIdx % colors.length]};font-weight:bold">${char}</span>`;
                colorIdx++;
            }
        }
        this.outputToConsole('🌈 Rainbow text activated!', 'accent', windowId);
        this.outputRichToConsole(html, windowId);
    }

    glitchCommand(params, windowId) {
        const text = params.join(' ');
        if (!text) {
            this.outputToConsole('❌ Usage: glitch [text]', 'error', windowId);
            return;
        }
        const glitchChars = '!@#░▒▓█▄▀■□×¶§‰®©™±';
        const corrupt = (str) => str.split('').map(c =>
            c === ' ' ? ' ' : (Math.random() > 0.45 ? c : glitchChars[Math.floor(Math.random() * glitchChars.length)])
        ).join('');

        this.outputToConsole('⚠️  GLITCH SEQUENCE INITIATED...', 'warning', windowId);
        setTimeout(() => this.outputToConsole(corrupt(text), 'error', windowId), 300);
        setTimeout(() => this.outputToConsole(corrupt(text), 'warning', windowId), 600);
        setTimeout(() => this.outputToConsole(corrupt(text), 'error', windowId), 900);
        setTimeout(() => this.outputToConsole(text, 'success', windowId), 1300);
        setTimeout(() => this.outputToConsole('✅ Signal stabilized.', 'success', windowId), 1600);
    }

    explodeCommand(params, windowId) {
        const text = params.join(' ');
        if (!text) {
            this.outputToConsole('❌ Usage: explode [text]', 'error', windowId);
            return;
        }
        this.outputToConsole('💥 DEPLOYING DRAMATIC TEXT SEQUENCE...', 'accent', windowId);

        const output = document.getElementById(`console-output-${windowId}`);
        if (!output) return;

        // Create the line div up front and append it
        const line = document.createElement('div');
        line.className = 'console-line success';
        output.appendChild(line);

        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) {
                line.textContent += text[i];
                output.scrollTop = output.scrollHeight;
                i++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    this.outputToConsole('🎤 ...mic drop.', 'accent', windowId);
                }, 300);
            }
        }, 80);
    }

    decodeCommand(params, windowId) {
        const text = params.join(' ');
        if (!text) {
            this.outputToConsole('❌ Usage: decode [text]', 'error', windowId);
            return;
        }

        this.outputToConsole('🔓 Initializing multi-layer cipher analysis...', 'info', windowId);

        // Build a series of "cipher layers" by progressively un-shifting characters
        const shift = (str, n) => str.split('').map(c => {
            if (c.match(/[a-zA-Z]/)) {
                const base = c === c.toUpperCase() ? 65 : 97;
                return String.fromCharCode(((c.charCodeAt(0) - base + 26 - n) % 26) + base);
            }
            return c;
        }).join('');

        const layer1 = shift(text, 7);
        const layer2 = shift(text, 4);
        const layer3 = shift(text, 1);

        setTimeout(() => { this.outputToConsole(`🔐 Layer 1 (ROT-7 shift):     ${layer1}`, 'warning', windowId); }, 400);
        setTimeout(() => { this.outputToConsole(`🔐 Layer 2 (ROT-4 shift):     ${layer2}`, 'warning', windowId); }, 900);
        setTimeout(() => { this.outputToConsole(`🔐 Layer 3 (ROT-1 shift):     ${layer3}`, 'info', windowId); }, 1400);
        setTimeout(() => { this.outputToConsole(`✅ DECODED — Original signal: ${text}`, 'success', windowId); }, 1900);
        setTimeout(() => { this.outputToConsole('🏆 Decryption sequence complete!', 'accent', windowId); }, 2100);
    }

    // =================================
    // LEVEL 5 — SUPREME OVERLORD COMMANDS
    // =================================

    overrideCommand(windowId) {
        this.outputToConsole('🚨 WARNING: SYSTEM OVERRIDE INITIATED', 'warning', windowId);
        this.outputToConsole('👑 Supreme Overlord credentials confirmed.', 'accent', windowId);

        const sequence = [
            [500,  '████████████████████████████████████████', 'accent'],
            [700,  '🔓 Root access: GRANTED', 'success'],
            [900,  '🔓 Kernel override: GRANTED', 'success'],
            [1100, '🔓 ElxaOS mainframe: OWNED', 'success'],
            [1300, '🔓 Snakesian satellite network: OWNED', 'success'],
            [1500, '🔓 Mr. Snake-e\'s Denali GPS: OWNED', 'success'],
            [1700, '████████████████████████████████████████', 'accent'],
            [2000, '🌍 ALL SYSTEMS UNDER SUPREME OVERLORD CONTROL', 'success'],
            [2300, '👑 The DUCK Console bows before you.', 'accent'],
            [2600, '🦆 Quack.', 'accent']
        ];

        sequence.forEach(([delay, msg, type]) => {
            setTimeout(() => this.outputToConsole(msg, type, windowId), delay);
        });
    }

    // Network Commands (require WiFi)
    networkCommand(params, windowId) {
        if (!this.isOnline) {
            this.outputToConsole('❌ Network commands require active WiFi connection', 'error', windowId);
            this.outputToConsole('💡 Connect to WiFi through the system tray', 'info', windowId);
            return;
        }

        // Get actual network info from WiFi service
        let connectionInfo = null;
        if (typeof elxaOS !== 'undefined' && elxaOS.wifiService) {
            connectionInfo = elxaOS.wifiService.getConnectionInfo();
        }

        const networkInfo = [
            '🌐 NETWORK STATUS REPORT',
            '════════════════════════',
            '',
            '✅ Connection: ACTIVE',
            connectionInfo ? `📡 Network: ${connectionInfo.network}` : '📡 Network: ElxaNet',
            connectionInfo ? `📶 Signal: ${Math.round(connectionInfo.signalStrength)}/5 bars` : '📶 Signal: Strong',
            '🔐 Security: Military Grade Encryption',
            '⚡ Speed: 999.9 Gbps (basically magic)',
            '🌍 Global Access: UNRESTRICTED',
            '',
            '🔍 Advanced protocols detected:',
            '  • Quantum tunneling enabled',
            '  • AI traffic optimization active',
            '  • Cat video prioritization: MAXIMUM'
        ];

        networkInfo.forEach(line => {
            this.outputToConsole(line, line.includes('═') ? 'accent' : 'success', windowId);
        });
    }

    pingCommand(params, windowId) {
        if (!this.isOnline) {
            this.outputToConsole('❌ Cannot ping: No network connection', 'error', windowId);
            return;
        }

        const target = params[0] || 'google.com';
        this.outputToConsole(`🏓 Pinging ${target}...`, 'info', windowId);
        
        setTimeout(() => {
            const times = ['12ms', '8ms', '15ms', '9ms'];
            times.forEach((time, index) => {
                setTimeout(() => {
                    this.outputToConsole(`📡 Reply from ${target}: time=${time} TTL=64`, 'success', windowId);
                }, index * 200);
            });
            
            setTimeout(() => {
                this.outputToConsole('✅ Ping statistics: 0% packet loss', 'success', windowId);
            }, 1000);
        }, 500);
    }

    scanCommand(params, windowId) {
        if (!this.isOnline) {
            this.outputToConsole('❌ Network scan requires WiFi connection', 'error', windowId);
            return;
        }

        this.outputToConsole('🔍 Initiating network vulnerability scan...', 'warning', windowId);
        this.outputToConsole('📡 Scanning ports 1-65535...', 'info', windowId);
        
        setTimeout(() => {
            const results = [
                '✅ Port 22 (SSH): SECURE',
                '✅ Port 80 (HTTP): SECURE', 
                '✅ Port 443 (HTTPS): SECURE',
                '⚠️  Port 8080: SUSPICIOUS ACTIVITY DETECTED',
                '🔐 Firewall status: ACTIVE',
                '',
                '🎯 Scan complete: Network is 99.9% secure!',
                '🏆 You\'re practically unhackable!'
            ];
            
            results.forEach((result, index) => {
                setTimeout(() => {
                    const type = result.includes('✅') ? 'success' : 
                                result.includes('⚠️') ? 'warning' : 
                                result.includes('🎯') || result.includes('🏆') ? 'accent' : 'info';
                    this.outputToConsole(result, type, windowId);
                }, index * 300);
            });
        }, 1500);
    }

    firewallCommand(params, windowId) {
        const action = params[0] || 'status';
        
        switch (action.toLowerCase()) {
            case 'status':
                this.outputToConsole('🔥 FIREWALL STATUS: ACTIVE', 'success', windowId);
                this.outputToConsole('🛡️ Protection Level: MAXIMUM', 'success', windowId);
                this.outputToConsole('📊 Blocked attacks today: 42,069', 'info', windowId);
                break;
            case 'enable':
                this.outputToConsole('🔥 Firewall already enabled!', 'success', windowId);
                break;
            case 'disable':
                this.outputToConsole('⚠️ Cannot disable firewall - security protocols prevent this!', 'warning', windowId);
                break;
            default:
                this.outputToConsole('💡 Firewall commands: status, enable, disable', 'info', windowId);
        }
    }

    // System Commands
    upgradeCommand(windowId) {
        if (this.securityLevel >= 5) {
            this.outputToConsole('🏆 Maximum clearance already achieved!', 'success', windowId);
            this.outputToConsole('👑 You are the Supreme Overlord. All systems are yours.', 'accent', windowId);
            return;
        }

        if (this.pendingUpgrade) {
            this.outputToConsole('⚠️  A challenge is already active! Type your answer, or type SKIP to cancel.', 'warning', windowId);
            return;
        }

        const targetLevel = this.securityLevel + 1;
        const puzzle = this._getUpgradePuzzle(targetLevel);

        this.pendingUpgrade = {
            targetLevel,
            check: puzzle.check,
            hint: puzzle.hint,
            attempts: 0
        };

        puzzle.lines.forEach(line => {
            this.outputToConsole(line, line.includes('═') ? 'accent' : 'info', windowId);
        });

        // Update prompt to show answer mode
        this.activeWindows.forEach(wid => this.updatePrompt(wid));
    }

    checkUpgradeAnswer(input, windowId) {
        const state = this.pendingUpgrade;
        if (!state) return;

        // Allow cancellation
        if (input.trim().toLowerCase() === 'skip') {
            this.pendingUpgrade = null;
            this.outputToConsole('🚫 Challenge cancelled. Come back when you\'re ready!', 'warning', windowId);
            this.activeWindows.forEach(wid => this.updatePrompt(wid));
            return;
        }

        state.attempts++;

        if (state.check(input)) {
            // Correct!
            this.pendingUpgrade = null;
            this.securityLevel = state.targetLevel;
            this._saveState(); // persist the new clearance level

            const unlockLines = this._getLevelUnlockMessage(state.targetLevel);
            setTimeout(() => {
                unlockLines.forEach((line, i) => {
                    setTimeout(() => {
                        this.outputToConsole(line, line.includes('═') ? 'accent' : 'success', windowId);
                    }, i * 150);
                });
                setTimeout(() => {
                    this.updateSecurityDisplay(windowId);
                    this.activeWindows.forEach(wid => this.updatePrompt(wid));
                }, unlockLines.length * 150 + 100);
            }, 300);
        } else {
            // Wrong answer
            if (state.attempts >= 3) {
                // Reset after 3 strikes
                this.pendingUpgrade = null;
                this.outputToConsole('❌ 3 failed attempts. Security lockout initiated!', 'error', windowId);
                this.outputToConsole('🔁 Puzzle reset. Type \'upgrade\' to try again.', 'warning', windowId);
                this.activeWindows.forEach(wid => this.updatePrompt(wid));
            } else {
                this.outputToConsole(`❌ Incorrect! (${state.attempts}/3 attempts used)`, 'error', windowId);
                if (state.attempts === 1) {
                    this.outputToConsole(state.hint, 'warning', windowId);
                }
                this.outputToConsole('💭 Type your answer, or type SKIP to cancel the challenge.', 'info', windowId);
            }
        }
    }

    _getLevelName(level) {
        return ['', 'Cadet', 'Math Wizard', 'Network Operative', 'Elite Hacker', 'Supreme Overlord'][level] || 'Unknown';
    }

    _getUpgradePuzzle(targetLevel) {
        const puzzles = {
            2: {
                lines: [
                    '🧮 CLEARANCE CHALLENGE: LEVEL 2 — MATH WIZARD',
                    '═════════════════════════════════════════════',
                    '',
                    '🔐 Prove your math skills to unlock Math Wizard access!',
                    '',
                    '❓ What is 2 to the power of 10?',
                    '',
                    '💬 Type your answer and press Enter (or SKIP to cancel)...'
                ],
                check: (input) => input.trim() === '1024',
                hint: '💡 Hint: Start with 2, keep doubling... 2, 4, 8, 16...'
            },
            3: {
                lines: [
                    '💻 CLEARANCE CHALLENGE: LEVEL 3 — NETWORK OPERATIVE',
                    '══════════════════════════════════════════════════',
                    '',
                    '🔐 Decode this binary to unlock Network Operative access!',
                    '',
                    '❓ What decimal number does 01001010 equal in binary?',
                    '',
                    '💬 Type your answer and press Enter (or SKIP to cancel)...'
                ],
                check: (input) => input.trim() === '74',
                hint: '💡 Hint: Break it into two groups of 4 — 0100 and 1010'
            },
            4: {
                lines: [
                    '⚡ CLEARANCE CHALLENGE: LEVEL 4 — ELITE HACKER',
                    '═════════════════════════════════════════════',
                    '',
                    '🔐 Solve this riddle to unlock Elite Hacker access!',
                    '',
                    '❓ I speak without a mouth and hear without ears.',
                    '   I have no body, but I come alive with the wind.',
                    '   What am I?',
                    '',
                    '💬 Type your answer and press Enter (or SKIP to cancel)...'
                ],
                check: (input) => ['echo', 'an echo'].includes(input.trim().toLowerCase()),
                hint: '💡 Hint: You\'ve heard me in mountains, canyons, and empty halls...'
            },
            5: {
                lines: [
                    '👑 CLEARANCE CHALLENGE: LEVEL 5 — SUPREME OVERLORD',
                    '══════════════════════════════════════════════════',
                    '',
                    '🔐 Final challenge: Prove you know Snakesia!',
                    '',
                    '❓ What is the official currency of Snakesia?',
                    '',
                    '💬 Type your answer and press Enter (or SKIP to cancel)...'
                ],
                check: (input) => ['snakes', 'snake'].includes(input.trim().toLowerCase()),
                hint: '💡 Hint: It\'s also a reptile... and you\'re looking at one right now 🐍'
            }
        };
        return puzzles[targetLevel];
    }

    _getLevelUnlockMessage(level) {
        const messages = {
            2: [
                '',
                '✅ CORRECT! CLEARANCE GRANTED!',
                '═══════════════════════════════════',
                '🧮 Welcome to Level 2: MATH WIZARD!',
                '🔓 New commands unlocked:',
                '   math, binary, convert, googolplex, tree, enigma',
                ''
            ],
            3: [
                '',
                '✅ CORRECT! CLEARANCE GRANTED!',
                '═══════════════════════════════════',
                '🌐 Welcome to Level 3: NETWORK OPERATIVE!',
                '🔓 New commands unlocked:',
                '   network, netstat, ping, scan, firewall, trace, whoislive',
                ''
            ],
            4: [
                '',
                '✅ CORRECT! CLEARANCE GRANTED!',
                '═══════════════════════════════════',
                '⚡ Welcome to Level 4: ELITE HACKER!',
                '🔓 New commands unlocked:',
                '   rainbow, glitch, explode, decode',
                '🎨 Also: hack gets a serious upgrade at this level!',
                ''
            ],
            5: [
                '',
                '✅ CORRECT! CLEARANCE GRANTED!',
                '═══════════════════════════════════',
                '👑 Welcome to Level 5: SUPREME OVERLORD!',
                '🔓 All systems unlocked!',
                '   override, snakee classified',
                '🏆 You have reached the pinnacle of DUCK Console power.',
                ''
            ]
        };
        return messages[level] || ['✅ Level up!'];
    }

    statusCommand(windowId) {
        const statusInfo = [
            '📊 SYSTEM STATUS REPORT',
            '═══════════════════════',
            `👤 User: ${this.user}`,
            `🔐 Security Level: ${this.securityLevel}/5 — ${this._getLevelName(this.securityLevel)}`,
            `📂 Current Directory: ${this.getPathString()}`,
            `🌐 Network: ${this.isOnline ? 'CONNECTED' : 'OFFLINE'}`,
            `🐱 Abby Status: ${this.abbyMood}`,
            `🐍 Snake-e Mode: ${this.snakeeCEOMode ? 'ACTIVE' : 'STANDBY'}`,
            `⚡ Console Uptime: ${Math.floor(Math.random() * 100)}m ${Math.floor(Math.random() * 60)}s`,
            '',
            '🔧 All systems operational!'
        ];

        statusInfo.forEach(line => {
            this.outputToConsole(line, line.includes('═') ? 'accent' : 'info', windowId);
        });
    }

    fortuneCommand(windowId) {
        const fortunes = [
            '🔮 "Great mathematicians are made, not born!"',
            '🌟 "Every expert was once a beginner!"',
            '🐱 "A day without cat videos is a day wasted!"',
            '🎯 "The only way to learn programming is by writing programs!"',
            '🧠 "Your mind is your greatest superpower!"',
            '📚 "Knowledge is the ultimate treasure!"',
            '🚀 "Aim for the moon - even if you miss, you\'ll land among the stars!"',
            '💻 "Code is poetry written in logic!"',
            '🔥 "Debugging is like being a detective in a crime movie!"',
            '⚡ "The future belongs to curious minds like yours!"'
        ];

        const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
        this.outputToConsole(fortune, 'accent', windowId);
    }

    updateNetworkStatusDisplay(windowId = null) {
        // Update all console windows or specific one
        const selector = windowId ? 
            `[data-console-id="${windowId}"] .network-status` : 
            '.duck-console .network-status';
            
        document.querySelectorAll(selector).forEach(statusElement => {
            statusElement.className = `network-status ${this.isOnline ? 'online' : 'offline'}`;
            statusElement.innerHTML = this.isOnline
                ? `${ElxaIcons.renderAction('wifi')} ONLINE`
                : `${ElxaIcons.renderAction('wifi-off')} OFFLINE`;
        });
    }

    // Utility Methods
    clearConsole(windowId) {
        const output = document.getElementById(`console-output-${windowId}`);
        if (output) {
            output.innerHTML = '';
        }
    }

    outputToConsole(text, type = 'info', windowId) {
        const output = document.getElementById(`console-output-${windowId}`);
        if (!output) return;

        const line = document.createElement('div');
        line.className = `console-line ${type}`;
        line.textContent = text;
        
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
    }

    // For commands that intentionally output HTML (e.g. rainbow colored text)
    outputRichToConsole(html, windowId) {
        const output = document.getElementById(`console-output-${windowId}`);
        if (!output) return;

        const line = document.createElement('div');
        line.className = 'console-line accent';
        line.innerHTML = html;

        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
    }

    outputToActiveConsole(text, type = 'info') {
        // Output to all active duck-console windows
        this.activeWindows.forEach(windowId => {
            this.outputToConsole(text, type, windowId);
        });
    }

    getPrompt() {
        if (this.pendingUpgrade) {
            return `[CHALLENGE L${this.pendingUpgrade.targetLevel}]> `;
        }
        const atHome = this.currentPath.length === this.homeDir.length &&
            this.homeDir.every((seg, i) => this.currentPath[i] === seg);
        const pathStr = atHome ? '~' : '~/' + this.currentPath.slice(this.homeDir.length).join('/');
        return `${this.user}@DUCK:${pathStr}$ `;
    }

    getPathString() {
        const atHome = this.currentPath.length === this.homeDir.length &&
            this.homeDir.every((seg, i) => this.currentPath[i] === seg);
        return atHome ? '~' : '~/' + this.currentPath.slice(this.homeDir.length).join('/');
    }

    updatePrompt(windowId) {
        const promptElement = document.getElementById(`console-prompt-${windowId}`);
        if (promptElement) {
            promptElement.textContent = this.getPrompt();
        }
    }

    updateSecurityDisplay(windowId) {
        const statusElement = document.querySelector(`[data-console-id="${windowId}"] .security-level`);
        if (statusElement) {
            statusElement.textContent = `CLEARANCE: LEVEL ${this.securityLevel}`;
        }
    }

    checkPrime(n) {
        if (n <= 1) return false;
        if (n <= 3) return true;
        if (n % 2 === 0 || n % 3 === 0) return false;
        
        for (let i = 5; i * i <= n; i += 6) {
            if (n % i === 0 || n % (i + 2) === 0) return false;
        }
        return true;
    }
}