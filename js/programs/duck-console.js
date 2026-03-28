// =================================
// DUCK CONSOLE PROGRAM
// =================================
class DuckConsoleProgram {
    constructor(windowManager, fileSystem, eventBus) {
        this.windowManager = windowManager;
        this.fileSystem = fileSystem;
        this.eventBus = eventBus;
        this.currentPath = ['root'];
        this.commandHistory = [];
        this.historyIndex = -1;
        this.user = 'hacker_kit';
        this.isOnline = false;
        this.abbyMood = 'happy'; // Abby's current mood
        this.snakeeCEOMode = false; // Mr. Snake-e CEO mode
        this.securityLevel = 1; // Hacker security clearance
        this.activeWindows = new Set(); // Track open console windows
        
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

    checkInitialWiFiStatus() {
        // Check if WiFi service exists and is connected
        if (typeof elxaOS !== 'undefined' && elxaOS.wifiService) {
            this.isOnline = elxaOS.wifiService.isOnline();
            if (this.isOnline) {
                console.log('DUCK Console: WiFi already connected on startup');
            }
        }
    }

    launch() {
        const windowId = `duck-console-${Date.now()}`;
        
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
        // Echo the command
        this.outputToConsole(`${this.getPrompt()}${command}`, 'command', windowId);

        this.eventBus.emit('console.command', { command: command.trim() });
        
        const args = command.toLowerCase().trim().split(/\s+/);
        const cmd = args[0];
        const params = args.slice(1);

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
        const helpText = [
            '🦆 DUCK Console Command Reference',
            '═══════════════════════════════════',
            '',
            '📁 FILE SYSTEM COMMANDS:',
            '  ls, dir          - List directory contents',
            '  cd [path]        - Change directory',
            '  pwd              - Show current directory',
            '  mkdir [name]     - Create directory',
            '  cat [file]       - Display file contents',
            '',
            '🔐 HACKER COMMANDS:',
            '  hack [target]    - Initiate hacking sequence',
            '  decrypt [data]   - Decrypt encoded messages',
            '  matrix           - Enter the matrix',
            '  scan             - Scan for vulnerabilities',
            '  firewall [cmd]   - Manage firewall settings',
            '  upgrade          - Upgrade security clearance',
            '',
            '🔢 MATH & SCIENCE:',
            '  math [operation] - Advanced calculations',
            '  googolplex       - Explore massive numbers',
            '  tree [n]         - Calculate Tree numbers',
            '  enigma [text]    - Enigma machine encryption',
            '',
            '🐱 VIRTUAL ASSISTANTS:',
            '  abby [command]   - Talk to Abby (your cat assistant)',
            '  snakee [command] - Enter Mr. Snake-e CEO mode',
            '',
            '🌐 NETWORK COMMANDS: (requires WiFi connection)',
            '  network          - Show network status',
            '  ping [target]    - Test network connectivity',
            '  netstat          - Display network statistics',
            '',
            '🔧 SYSTEM COMMANDS:',
            '  whoami           - Display user information',
            '  status           - Show system status',
            '  fortune          - Get a random fortune',
            '  clear, cls       - Clear console',
            '  help             - Show this help menu'
        ];

        helpText.forEach(line => {
            this.outputToConsole(line, line.includes('═') ? 'accent' : 'info', windowId);
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
        if (!path) {
            this.currentPath = ['root'];
            this.updatePrompt(windowId);
            this.outputToConsole('📂 Moved to root directory', 'success', windowId);
            return;
        }

        if (path === '..') {
            if (this.currentPath.length > 1) {
                this.currentPath.pop();
                this.updatePrompt(windowId);
                this.outputToConsole(`📂 Moved up to ${this.getPathString()}`, 'success', windowId);
            } else {
                this.outputToConsole('❌ Already at root directory', 'error', windowId);
            }
            return;
        }

        const newPath = [...this.currentPath, path];
        const folder = this.fileSystem.getFolder(newPath);
        
        if (folder) {
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

        if (this.fileSystem.createFolder(this.currentPath, name)) {
            this.outputToConsole(`📁 Created directory: ${name}`, 'success', windowId);
        } else {
            this.outputToConsole(`❌ Failed to create directory: ${name}`, 'error', windowId);
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
            `👤 User: ${this.user}`,
            `🔐 Security Clearance: Level ${this.securityLevel}`,
            `🎯 Specialization: Advanced Mathematics & Cat Whispering`,
            `🏆 Achievement: Master of the Googolplex`,
            `🐱 Virtual Assistant: Abby (Status: ${this.abbyMood})`,
            `🐍 CEO Contact: Mr. Snake-e of Snakesia Industries`
        ];

        responses.forEach(response => {
            this.outputToConsole(response, 'success', windowId);
        });
    }

    hackCommand(params, windowId) {
        const target = params.join(' ') || 'default_system';
        
        this.outputToConsole(`🔓 Initiating hack sequence on: ${target}`, 'warning', windowId);
        this.outputToConsole('⚡ Scanning for vulnerabilities...', 'info', windowId);
        
        setTimeout(() => {
            this.outputToConsole('🔍 Buffer overflow detected!', 'success', windowId);
            this.outputToConsole('🔑 Bypassing encryption...', 'info', windowId);
            
            setTimeout(() => {
                const successRate = Math.random();
                if (successRate > 0.3) {
                    this.outputToConsole('✅ ACCESS GRANTED!', 'success', windowId);
                    this.outputToConsole(`🏆 You are now the admin of ${target}`, 'success', windowId);
                    if (this.securityLevel < 5) {
                        this.securityLevel++;
                        this.outputToConsole(`⬆️ Security clearance upgraded to Level ${this.securityLevel}!`, 'success', windowId);
                        this.updateSecurityDisplay(windowId);
                    }
                } else {
                    this.outputToConsole('❌ HACK FAILED - ICE detected!', 'error', windowId);
                    this.outputToConsole('🚨 Recommend trying different approach', 'warning', windowId);
                }
            }, 1500);
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
                
            default:
                this.outputToConsole(`🐍 "Hmm, '${command}' isn't in my CEO handbook. Try another command!"`, 'accent', windowId);
        }
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
            this.outputToConsole('🏆 You already have maximum security clearance!', 'success', windowId);
            this.outputToConsole('👑 You are the ultimate hacker master!', 'accent', windowId);
            return;
        }

        this.outputToConsole('⬆️ Initiating security clearance upgrade...', 'info', windowId);
        this.outputToConsole('🔐 Verifying credentials...', 'info', windowId);
        
        setTimeout(() => {
            this.securityLevel++;
            this.outputToConsole(`✅ UPGRADE SUCCESSFUL!`, 'success', windowId);
            this.outputToConsole(`🎖️ New Security Level: ${this.securityLevel}`, 'success', windowId);
            this.outputToConsole('🔓 New commands and privileges unlocked!', 'accent', windowId);
            this.updateSecurityDisplay(windowId);
        }, 2000);
    }

    statusCommand(windowId) {
        const statusInfo = [
            '📊 SYSTEM STATUS REPORT',
            '═══════════════════════',
            `👤 User: ${this.user}`,
            `🔐 Security Level: ${this.securityLevel}/5`,
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

    outputToActiveConsole(text, type = 'info') {
        // Output to all active duck-console windows
        this.activeWindows.forEach(windowId => {
            this.outputToConsole(text, type, windowId);
        });
    }

    getPrompt() {
        const pathStr = this.currentPath.length === 1 ? '~' : this.currentPath.slice(1).join('/');
        return `${this.user}@DUCK:${pathStr}$ `;
    }

    getPathString() {
        return this.currentPath.length === 1 ? 'root' : this.currentPath.slice(1).join('/');
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