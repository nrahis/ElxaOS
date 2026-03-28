// =================================
// ELXACODE PROGRAM - Mock VSCode for Kids
// =================================
class ElxaCodeProgram {
    constructor(windowManager, fileSystem, eventBus) {
        this.windowManager = windowManager;
        this.fileSystem = fileSystem;
        this.eventBus = eventBus;
        this.activeWindows = new Map();
        
        // Program state for code execution
        this.isRunning = false;
        
        // Special code responses
        this.specialResponses = {
            'abby': [
                "🐱 Abby says: *purrs* Hello there! I'm watching over you while you code!",
                "🐱 Abby's spirit appears: *meow* I'm so proud of how smart you are!",
                "🐱 Abby whispers: *soft purr* Keep coding, little one. I love you!",
                "🐱 Abby's love fills the room: *happy meow* You're doing amazing!",
                "🐱 Abby says: *gentle purr* I'm always here in your heart! 💕"
            ],
            'cat': [
                "🐱 *meow* A cat appears and sits on your keyboard!",
                "🐱 Cats are the best programmers - they debug by knocking things off tables!",
                "🐱 *purr* Cat fact: Cats invented the mouse... computer mouse, that is!",
                "🐱 A fluffy cat judges your code... *meow* ...and approves!",
                "🐱 Cat mode activated! *purr* All bugs are now mice to be caught!"
            ],
            'duck': [
                "🦆 DUCK HACKING ACTIVATED! *quack quack*",
                "🦆 Deploying rubber duck debugging protocol... *quack*",
                "🦆 *quack* Duck infiltrating the mainframe...",
                "🦆 QUACK QUACK! Duck has successfully 'ducked' the system!",
                "🦆 Elite hacker duck reporting for duty! *sophisticated quack*"
            ],
            'elxa': [
                "🏢 ElxaCorp HQ responds: Mr. Snake-e is impressed with your coding!",
                "🐍 Mr. Snake-e says: *hiss* Excellent programming! Have a bonus Denali!",
                "🏢 ElxaOS system message: Welcome to the future of computing!",
                "🐍 Mrs. Snake-e from Snakesia: *happy hiss* Math and computers for everyone!",
                "🏢 ElxaCorp stock is up 1000% thanks to your amazing code!"
            ],
            'snake': [
                "🐍 *hiss* A wild snake appears! It's Mr. Snake-e himself!",
                "🐍 Snake says: *sophisticated hiss* I approve of this code!",
                "🐍 Mr. Snake-e slides over in his Denali: *wealthy hiss*",
                "🐍 The CEO snake is pleased! *business hiss* Promotion incoming!"
            ]
        };
    }

    // =========================================================
    // Window state helpers — per-window file/variable tracking
    // =========================================================

    getWindowState(windowId) {
        return this.activeWindows.get(windowId);
    }

    toggleConsole(windowId) {
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        const container = windowElement.querySelector('.elxacode-container');
        if (!container) return;
        
        const consoleOutput = container.querySelector(`#console-${windowId}`);
        const consoleSection = container.querySelector('.console-section');
        const splitter = container.querySelector(`#console-splitter-${windowId}`);
        const minimizeBtn = container.querySelector('.minimize-console');
        
        if (consoleOutput && consoleSection && minimizeBtn && splitter) {
            if (consoleOutput.style.display === 'none') {
                // Expand — show output, restore flex sizing, show splitter
                consoleOutput.style.display = 'block';
                consoleSection.style.flex = '';
                consoleSection.style.minHeight = '';
                consoleSection.style.height = '';
                splitter.style.display = 'flex';
                minimizeBtn.textContent = '−';
            } else {
                // Collapse — hide output, shrink section to header only, hide splitter
                consoleOutput.style.display = 'none';
                consoleSection.style.flex = 'none';
                consoleSection.style.minHeight = '0';
                consoleSection.style.height = 'auto';
                splitter.style.display = 'none';
                minimizeBtn.textContent = '+';
            }
        }
    }

    // =========================================================
    // Launch
    // =========================================================

    launch(filePath = null, fileName = null) {
        const windowId = `elxacode-${Date.now()}`;
        
        const windowContent = this.createElxaCodeInterface(windowId, fileName);
        
        const win = this.windowManager.createWindow(
            windowId,
            `${ElxaIcons.render('elxacode', 'ui')} ElxaCode - ${fileName || 'Untitled'}`,
            windowContent,
            { width: '800px', height: '600px', x: '50px', y: '50px' }
        );
        
        // Per-window state: variables, file info, console history
        this.activeWindows.set(windowId, {
            variables: new Map(),
            console: [],
            currentFile: fileName || null,
            currentPath: filePath || null
        });
        
        this.setupEventHandlers(windowId);
        
        // Load file if specified, otherwise show welcome code
        if (filePath && fileName) {
            this.loadFileIntoEditor(windowId, filePath, fileName);
        } else {
            this.setWelcomeCode(windowId);
        }
        
        return windowId;
    }

    // =========================================================
    // Interface
    // =========================================================

    createElxaCodeInterface(windowId, fileName) {
        return `
            <div class="elxacode-container" data-window-id="${windowId}">
                <!-- Toolbar -->
                <div class="elxacode-toolbar">
                    <div class="toolbar-group">
                        <button class="toolbar-btn new-btn" title="New File" onmousedown="event.preventDefault()">${ElxaIcons.renderAction('new-file')} New</button>
                        <button class="toolbar-btn open-btn" title="Open File" onmousedown="event.preventDefault()">${ElxaIcons.renderAction('open')} Open</button>
                        <button class="toolbar-btn save-btn" title="Save File" onmousedown="event.preventDefault()">${ElxaIcons.renderAction('save')} Save</button>
                    </div>
                    <div class="toolbar-group">
                        <button class="toolbar-btn run-btn" title="Run Code" onmousedown="event.preventDefault()">${ElxaIcons.renderAction('play')} Run</button>
                        <button class="toolbar-btn stop-btn" title="Stop" disabled onmousedown="event.preventDefault()">${ElxaIcons.renderAction('stop')} Stop</button>
                        <button class="toolbar-btn clear-btn" title="Clear Console" onmousedown="event.preventDefault()">${ElxaIcons.renderAction('clear')} Clear</button>
                    </div>
                    <div class="toolbar-group">
                        <span class="toolbar-text">ElxaCode v1.0 - For Young Coders!</span>
                    </div>
                </div>

                <!-- Main Content Area -->
                <div class="elxacode-main">
                    <!-- Code Editor -->
                    <div class="code-editor-section" id="code-editor-${windowId}">
                        <div class="editor-header">
                            <div class="editor-tabs">
                                <div class="editor-tab active">
                                    <span class="tab-name">${fileName || 'Untitled.elxa'}</span>
                                    <span class="tab-close">×</span>
                                </div>
                            </div>
                        </div>
                        <div class="code-editor">
                            <div class="line-numbers" id="line-numbers-${windowId}">1</div>
                            <textarea class="code-input" id="code-input-${windowId}" 
                                placeholder="Write your ElxaCode here! Try keywords like 'print', 'abby', 'cat', 'duck', or 'elxa'!"></textarea>
                        </div>
                    </div>

                    <!-- Resizable Splitter -->
                    <div class="console-splitter" id="console-splitter-${windowId}">
                        <div class="splitter-handle">⋯</div>
                    </div>

                    <!-- Console -->
                    <div class="console-section" id="console-section-${windowId}">
                        <div class="console-header">
                            <span>${ElxaIcons.renderAction('terminal')} ElxaCode Console</span>
                            <div class="console-controls">
                                <button class="console-btn minimize-console">−</button>
                            </div>
                        </div>
                        <div class="console-output" id="console-${windowId}">
                            <div class="console-line welcome">Welcome to ElxaCode! Ready to code something amazing? 🚀</div>
                        </div>
                    </div>
                </div>

                <!-- Status Bar -->
                <div class="elxacode-status">
                    <div class="status-left">
                        <span class="file-status">Ready</span>
                        <span class="separator">|</span>
                        <span class="line-col">Ln 1, Col 1</span>
                    </div>
                    <div class="status-right">
                        <span class="language">ElxaCode</span>
                        <span class="separator">|</span>
                        <span class="encoding">UTF-8</span>
                    </div>
                </div>
            </div>
        `;
    }

    // =========================================================
    // Event handlers
    // =========================================================

    setupEventHandlers(windowId) {
        // Use setTimeout to ensure DOM is fully rendered
        setTimeout(() => {
            const windowElement = document.getElementById(`window-${windowId}`);
            if (!windowElement) {
                console.error('Window element not found for ElxaCode');
                return;
            }
            
            const container = windowElement.querySelector('.elxacode-container');
            if (!container) {
                console.error('ElxaCode container not found');
                return;
            }

            // Toolbar buttons
            const newBtn = container.querySelector('.new-btn');
            const openBtn = container.querySelector('.open-btn');
            const saveBtn = container.querySelector('.save-btn');
            const runBtn = container.querySelector('.run-btn');
            const stopBtn = container.querySelector('.stop-btn');
            const clearBtn = container.querySelector('.clear-btn');
            
            if (newBtn) newBtn.addEventListener('click', () => this.newFile(windowId));
            if (openBtn) openBtn.addEventListener('click', () => this.showOpenDialog(windowId));
            if (saveBtn) saveBtn.addEventListener('click', () => this.saveFile(windowId));
            if (runBtn) runBtn.addEventListener('click', () => this.runCode(windowId));
            if (stopBtn) stopBtn.addEventListener('click', () => this.stopCode(windowId));
            if (clearBtn) clearBtn.addEventListener('click', () => this.clearConsole(windowId));

            // Code editor
            const codeInput = container.querySelector(`#code-input-${windowId}`);
            if (codeInput) {
                codeInput.addEventListener('input', () => this.updateLineNumbers(windowId));
                codeInput.addEventListener('scroll', () => this.syncLineNumbers(windowId));
                codeInput.addEventListener('keydown', (e) => this.handleKeyDown(e, windowId));
                // Update cursor position on clicks and key presses
                codeInput.addEventListener('click', () => this.updateStatusBar(windowId, codeInput));
                codeInput.addEventListener('keyup', () => this.updateStatusBar(windowId, codeInput));
            }

            // Console minimize
            const minimizeConsole = container.querySelector('.minimize-console');
            if (minimizeConsole) {
                minimizeConsole.addEventListener('click', () => this.toggleConsole(windowId));
            }

            // Tab close
            const tabClose = container.querySelector('.tab-close');
            if (tabClose) {
                tabClose.addEventListener('click', () => {
                    this.windowManager.closeWindow(windowId);
                });
            }

            // Setup console resizer
            this.setupConsoleResizer(windowId);

            // Initial setup
            this.updateLineNumbers(windowId);
        }, 100);
    }

    // =========================================================
    // Welcome code
    // =========================================================

    setWelcomeCode(windowId) {
        setTimeout(() => {
            const codeInput = document.querySelector(`#code-input-${windowId}`);
            if (codeInput) {
                codeInput.value = `// Welcome to ElxaCode! 🚀
// Try running this code by clicking the Run button!

print "Hello, young coder!"
print "Let's learn some ElxaCode!"

// Try some special keywords:
abby
cat
duck
elxa

// Basic math:
add 5 + 3
subtract 10 - 2

// Variables:
var name = "Super Coder"
print "Welcome, " + name

// Conditions:
if name == "Super Coder"
    print "You are amazing!"
else
    print "Keep coding!"
end`;
                this.updateLineNumbers(windowId);
            }
        }, 150);
    }

    // =========================================================
    // Editor utilities
    // =========================================================

    updateLineNumbers(windowId) {
        const codeInput = document.querySelector(`#code-input-${windowId}`);
        const lineNumbers = document.querySelector(`#line-numbers-${windowId}`);
        
        if (codeInput && lineNumbers) {
            const lines = codeInput.value.split('\n');
            const lineNumbersText = lines.map((_, index) => index + 1).join('\n');
            lineNumbers.textContent = lineNumbersText;
        }
    }

    syncLineNumbers(windowId) {
        const codeInput = document.querySelector(`#code-input-${windowId}`);
        const lineNumbers = document.querySelector(`#line-numbers-${windowId}`);
        
        if (codeInput && lineNumbers) {
            lineNumbers.scrollTop = codeInput.scrollTop;
        }
    }

    updateStatusBar(windowId, codeInput) {
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        const container = windowElement.querySelector('.elxacode-container');
        if (!container) return;
        
        const lineCol = container.querySelector('.line-col');
        
        if (lineCol && codeInput) {
            const text = codeInput.value;
            const cursorPos = codeInput.selectionStart;
            const lines = text.substring(0, cursorPos).split('\n');
            const line = lines.length;
            const col = lines[lines.length - 1].length + 1;
            
            lineCol.textContent = `Ln ${line}, Col ${col}`;
        }
    }

    handleKeyDown(e, windowId) {
        // Handle special key combinations
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    this.saveFile(windowId);
                    break;
                case 'r':
                    e.preventDefault();
                    this.runCode(windowId);
                    break;
                case 'n':
                    e.preventDefault();
                    this.newFile(windowId);
                    break;
            }
        }
        
        // Handle tab for indentation
        if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = e.target;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            
            textarea.value = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + 4;
            
            this.updateLineNumbers(windowId);
        }
    }

    // =========================================================
    // File operations
    // =========================================================

    newFile(windowId) {
        const codeInput = document.querySelector(`#code-input-${windowId}`);
        if (!codeInput) return;
        
        codeInput.value = '';
        
        const state = this.getWindowState(windowId);
        if (state) {
            state.currentFile = null;
            state.currentPath = null;
        }
        
        this.updateWindowTitle(windowId, 'Untitled.elxa');
        this.updateLineNumbers(windowId);
        this.clearConsole(windowId);
    }

    showOpenDialog(windowId) {
        const dialog = document.createElement('div');
        dialog.className = 'file-browser-dialog';
        dialog.innerHTML = `
            <div class="dialog-overlay">
                <div class="dialog-content">
                    <div class="dialog-header">
                        <span>${ElxaIcons.renderAction('open')} Open ElxaCode File</span>
                        <button class="dialog-close">×</button>
                    </div>
                    <div class="dialog-body">
                        <div class="file-list" id="file-list-${windowId}">
                            <!-- Files will be populated here -->
                        </div>
                        <div class="dialog-actions">
                            <button class="btn-cancel">Cancel</button>
                            <button class="btn-open" disabled>Open</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Populate with .elxa and .txt files
        this.populateFileList(windowId, dialog);
        
        // Setup dialog events
        dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.remove());
        dialog.querySelector('.btn-cancel').addEventListener('click', () => dialog.remove());
        dialog.querySelector('.btn-open').addEventListener('click', () => {
            const selected = dialog.querySelector('.file-item.selected');
            if (selected) {
                const fileName = selected.dataset.filename;
                const filePath = JSON.parse(selected.dataset.filepath);
                this.loadFileIntoEditor(windowId, filePath, fileName);
            }
            dialog.remove();
        });
    }

    populateFileList(windowId, dialog) {
        const fileList = dialog.querySelector(`#file-list-${windowId}`);
        const folders = [['root', 'Documents', 'Code'], ['root', 'Documents'], ['root', 'Desktop']];
        
        folders.forEach(folderPath => {
            const files = this.fileSystem.listContents(folderPath);
            files.forEach(file => {
                if (file.type === 'file' && (file.name.endsWith('.elxa') || file.name.endsWith('.txt'))) {
                    const fileItem = document.createElement('div');
                    fileItem.className = 'file-item';
                    fileItem.dataset.filename = file.name;
                    fileItem.dataset.filepath = JSON.stringify(folderPath);
                    
                    fileItem.innerHTML = `
                        <div class="file-icon">${ElxaIcons.getFileIcon(file.name, 'ui')}</div>
                        <div class="file-info">
                            <div class="file-name">${file.name}</div>
                            <div class="file-path">${folderPath.slice(1).join(' > ')}</div>
                        </div>
                    `;
                    
                    fileItem.addEventListener('click', () => {
                        dialog.querySelectorAll('.file-item').forEach(item => item.classList.remove('selected'));
                        fileItem.classList.add('selected');
                        dialog.querySelector('.btn-open').disabled = false;
                    });
                    
                    fileItem.addEventListener('dblclick', () => {
                        this.loadFileIntoEditor(windowId, folderPath, file.name);
                        dialog.remove();
                    });
                    
                    fileList.appendChild(fileItem);
                }
            });
        });
    }

    /**
     * Load a file into the editor of an existing window.
     * Used by both the Open dialog and external launch (file manager).
     */
    loadFileIntoEditor(windowId, filePath, fileName) {
        const file = this.fileSystem.getFile(filePath, fileName);
        if (!file) {
            this.addToConsole(windowId, `❌ File not found: ${fileName}`, 'error');
            return;
        }
        
        setTimeout(() => {
            const codeInput = document.querySelector(`#code-input-${windowId}`);
            if (codeInput) {
                codeInput.value = file.content || '';
                
                const state = this.getWindowState(windowId);
                if (state) {
                    state.currentFile = fileName;
                    state.currentPath = [...filePath];
                }
                
                this.updateWindowTitle(windowId, fileName);
                this.updateLineNumbers(windowId);
                
                this.addToConsole(windowId, `📂 Opened: ${fileName}`, 'info');
            }
        }, 100);
    }

    saveFile(windowId) {
        const codeInput = document.querySelector(`#code-input-${windowId}`);
        if (!codeInput) return;
        
        const state = this.getWindowState(windowId);
        if (!state) return;
        
        if (!state.currentFile) {
            // Show Save As dialog
            this.showSaveAsDialog(windowId);
            return;
        }
        
        // Save to existing file
        if (this.fileSystem.getFile(state.currentPath, state.currentFile)) {
            this.fileSystem.updateFileContent(state.currentPath, state.currentFile, codeInput.value);
        } else {
            this.fileSystem.createFile(state.currentPath, state.currentFile, codeInput.value, 'elxa');
        }
        
        this.updateWindowTitle(windowId, state.currentFile);
        this.addToConsole(windowId, `💾 Saved: ${state.currentFile}`, 'success');
    }

    showSaveAsDialog(windowId) {
        const state = this.getWindowState(windowId);
        if (!state) return;
        
        const dialog = document.createElement('div');
        dialog.className = 'file-browser-dialog';
        dialog.innerHTML = `
            <div class="dialog-overlay">
                <div class="dialog-content">
                    <div class="dialog-header">
                        <span>${ElxaIcons.renderAction('save')} Save As</span>
                        <button class="dialog-close">×</button>
                    </div>
                    <div class="dialog-body">
                        <div class="save-form">
                            <label>Filename:</label>
                            <input type="text" class="filename-input" value="${state.currentFile || 'mycode.elxa'}" placeholder="Enter filename">
                            <div class="save-location">Save to: Documents > Code</div>
                        </div>
                        <div class="dialog-actions">
                            <button class="btn-cancel">Cancel</button>
                            <button class="btn-open">Save</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        const filenameInput = dialog.querySelector('.filename-input');
        filenameInput.focus();
        filenameInput.select();
        
        const doSave = () => {
            const fileName = filenameInput.value.trim();
            if (!fileName) {
                ElxaUI.showMessage('Please enter a filename', 'warning');
                return;
            }
            
            let finalName = fileName;
            if (!finalName.includes('.')) {
                finalName += '.elxa';
            }
            
            const savePath = ['root', 'Documents', 'Code'];
            const codeInput = document.querySelector(`#code-input-${windowId}`);
            if (!codeInput) return;
            
            const existingFile = this.fileSystem.getFile(savePath, finalName);
            
            if (existingFile) {
                ElxaUI.showConfirmDialog({
                    title: `${ElxaIcons.renderAction('save')} Overwrite File`,
                    message: `File "${finalName}" already exists. Overwrite it?`,
                    confirmText: 'Overwrite',
                    cancelText: 'Cancel',
                    confirmClass: 'elxa-dialog-btn-danger'
                }).then(confirmed => {
                    if (confirmed) {
                        this.fileSystem.updateFileContent(savePath, finalName, codeInput.value);
                        state.currentFile = finalName;
                        state.currentPath = savePath;
                        this.updateWindowTitle(windowId, finalName);
                        this.addToConsole(windowId, `💾 Saved: ${finalName}`, 'success');
                        dialog.remove();
                    }
                });
            } else {
                this.fileSystem.createFile(savePath, finalName, codeInput.value, 'elxa');
                state.currentFile = finalName;
                state.currentPath = savePath;
                this.updateWindowTitle(windowId, finalName);
                this.addToConsole(windowId, `💾 Saved: ${finalName}`, 'success');
                dialog.remove();
            }
        };
        
        dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.remove());
        dialog.querySelector('.btn-cancel').addEventListener('click', () => dialog.remove());
        dialog.querySelector('.btn-open').addEventListener('click', doSave);
        filenameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') doSave();
        });
    }

    // =========================================================
    // Code execution
    // =========================================================

    runCode(windowId) {
        const codeInput = document.querySelector(`#code-input-${windowId}`);
        if (!codeInput) return;
        
        const code = codeInput.value;
        
        if (!code.trim()) {
            this.addToConsole(windowId, '⚠️ No code to run!', 'warning');
            return;
        }
        
        this.isRunning = true;
        this.updateRunButtons(windowId, true);
        
        this.addToConsole(windowId, '▶️ Running code...', 'info');
        this.addToConsole(windowId, '═'.repeat(50), 'separator');
        
        // Reset variables for this run
        const windowState = this.getWindowState(windowId);
        if (windowState) {
            windowState.variables.clear();
        }
        
        // Parse and execute code
        try {
            this.executeCode(code, windowId);
        } catch (error) {
            this.addToConsole(windowId, `❌ Error: ${error.message}`, 'error');
        }
        
        this.addToConsole(windowId, '═'.repeat(50), 'separator');
        this.addToConsole(windowId, '✅ Code execution completed!', 'success');
        
        this.isRunning = false;
        this.updateRunButtons(windowId, false);
    }

    executeCode(code, windowId) {
        const lines = code.split('\n');
        let i = 0;
        
        while (i < lines.length) {
            const line = lines[i].trim();
            
            // Skip empty lines and comments
            if (!line || line.startsWith('//')) {
                i++;
                continue;
            }
            
            // Check if this is special code
            if (this.isSpecialCode(line)) {
                this.executeSpecialCode(line, windowId);
            } else {
                // Execute as pseudocode
                const result = this.executePseudoCode(line, lines, i, windowId);
                if (result.skip) {
                    i = result.newIndex;
                    continue;
                }
            }
            
            i++;
        }
    }

    isSpecialCode(line) {
        const specialKeywords = ['abby', 'cat', 'duck', 'elxa', 'snake'];
        const firstWord = line.toLowerCase().split(' ')[0];
        return specialKeywords.includes(firstWord);
    }

    executeSpecialCode(line, windowId) {
        const keyword = line.toLowerCase().split(' ')[0];
        const responses = this.specialResponses[keyword];
        
        if (responses) {
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            this.addToConsole(windowId, randomResponse, 'special');
            
            // Add some extra flair for certain keywords
            if (keyword === 'duck') {
                setTimeout(() => {
                    this.addToConsole(windowId, '🦆 *hacker duck typing intensifies*', 'special');
                }, 500);
            } else if (keyword === 'abby') {
                setTimeout(() => {
                    this.addToConsole(windowId, '💕 *warm fuzzy feeling*', 'special');
                }, 300);
            }
        }
    }

    executePseudoCode(line, allLines, currentIndex, windowId) {
        const windowState = this.getWindowState(windowId);
        const tokens = this.tokenize(line);
        
        if (tokens.length === 0) return { skip: false };
        
        const command = tokens[0].toLowerCase();
        
        switch (command) {
            case 'print':
                this.executePrint(tokens.slice(1), windowId, windowState);
                break;
                
            case 'add':
            case 'subtract':
            case 'multiply':
            case 'divide':
                this.executeMath(command, tokens.slice(1), windowId);
                break;
                
            case 'var':
                this.executeVar(tokens.slice(1), windowId, windowState);
                break;
                
            case 'getvar':
                this.executeGetVar(tokens.slice(1), windowId, windowState);
                break;
                
            case 'if':
                return this.executeIf(tokens.slice(1), allLines, currentIndex, windowId, windowState);
                
            default:
                this.addToConsole(windowId, `❓ Unknown command: ${command}`, 'warning');
        }
        
        return { skip: false };
    }

    tokenize(line) {
        const tokens = [];
        let current = '';
        let inString = false;
        let stringChar = '';
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (!inString && (char === '"' || char === "'")) {
                if (current) {
                    tokens.push(current);
                    current = '';
                }
                inString = true;
                stringChar = char;
            } else if (inString && char === stringChar) {
                tokens.push(current);
                current = '';
                inString = false;
                stringChar = '';
            } else if (!inString && char === ' ') {
                if (current) {
                    tokens.push(current);
                    current = '';
                }
            } else {
                current += char;
            }
        }
        
        if (current) {
            tokens.push(current);
        }
        
        return tokens;
    }

    executePrint(tokens, windowId, windowState) {
        let output = '';
        
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            
            if (token === '+') continue;
            
            // Check if it's a variable
            if (windowState && windowState.variables.has(token)) {
                const value = windowState.variables.get(token);
                if (Array.isArray(value)) {
                    output += value.join(', ');
                } else {
                    output += value;
                }
            } else {
                output += token;
            }
            
            if (i < tokens.length - 1 && tokens[i + 1] !== '+') {
                output += ' ';
            }
        }
        
        this.addToConsole(windowId, output, 'output');
    }

    executeMath(operation, tokens, windowId) {
        const numbers = tokens.filter(token => !isNaN(parseFloat(token))).map(parseFloat);
        
        if (numbers.length < 2) {
            this.addToConsole(windowId, `❌ ${operation} needs at least 2 numbers`, 'error');
            return;
        }
        
        let result;
        switch (operation) {
            case 'add':
                result = numbers.reduce((a, b) => a + b);
                break;
            case 'subtract':
                result = numbers[0] - numbers[1];
                break;
            case 'multiply':
                result = numbers.reduce((a, b) => a * b);
                break;
            case 'divide':
                if (numbers[1] === 0) {
                    this.addToConsole(windowId, '❌ Cannot divide by zero!', 'error');
                    return;
                }
                result = numbers[0] / numbers[1];
                break;
        }
        
        this.addToConsole(windowId, `🔢 ${numbers.join(` ${operation} `)} = ${result}`, 'output');
    }

    executeVar(tokens, windowId, windowState) {
        if (tokens.length < 3 || tokens[1] !== '=') {
            this.addToConsole(windowId, '❌ Variable syntax: var name = value', 'error');
            return;
        }
        
        const varName = tokens[0];
        let value;
        
        // Check if it's a list
        if (tokens[2] === '[' && tokens[tokens.length - 1] === ']') {
            const listContent = tokens.slice(3, -1).join(' ');
            value = listContent.split(',').map(item => item.trim());
        } else {
            value = tokens.slice(2).join(' ');
        }
        
        windowState.variables.set(varName, value);
        this.addToConsole(windowId, `📝 Variable '${varName}' set to: ${Array.isArray(value) ? `[${value.join(', ')}]` : value}`, 'info');
    }

    executeGetVar(tokens, windowId, windowState) {
        if (tokens.length === 0) {
            this.addToConsole(windowId, '❌ getvar syntax: getvar varname', 'error');
            return;
        }
        
        const varName = tokens[0];
        
        if (!windowState.variables.has(varName)) {
            this.addToConsole(windowId, `❌ Variable '${varName}' not found`, 'error');
            return;
        }
        
        const value = windowState.variables.get(varName);
        
        if (Array.isArray(value)) {
            if (tokens.length > 1) {
                const index = parseInt(tokens[1]);
                if (index >= 0 && index < value.length) {
                    this.addToConsole(windowId, value[index], 'output');
                } else {
                    this.addToConsole(windowId, `❌ Index ${index} out of range`, 'error');
                }
            } else {
                this.addToConsole(windowId, `[${value.join(', ')}]`, 'output');
            }
        } else {
            this.addToConsole(windowId, value, 'output');
        }
    }

    executeIf(tokens, allLines, currentIndex, windowId, windowState) {
        if (tokens.length < 3) {
            this.addToConsole(windowId, '❌ If syntax: if variable == value', 'error');
            return { skip: false };
        }
        
        const variable = tokens[0];
        const operator = tokens[1];
        const value = tokens[2];
        
        let variableValue = windowState.variables.get(variable) || variable;
        let testValue = windowState.variables.get(value) || value;
        
        let condition = false;
        
        switch (operator) {
            case '==':
                condition = variableValue == testValue;
                break;
            case '!=':
                condition = variableValue != testValue;
                break;
            case '>':
                condition = parseFloat(variableValue) > parseFloat(testValue);
                break;
            case '<':
                condition = parseFloat(variableValue) < parseFloat(testValue);
                break;
        }
        
        // Find the end of the if block
        let i = currentIndex + 1;
        let ifLines = [];
        let elseLines = [];
        let inElse = false;
        
        while (i < allLines.length) {
            const line = allLines[i].trim();
            
            if (line === 'end') {
                break;
            } else if (line === 'else') {
                inElse = true;
            } else if (line) {
                if (inElse) {
                    elseLines.push(line);
                } else {
                    ifLines.push(line);
                }
            }
            i++;
        }
        
        // Execute appropriate block
        const linesToExecute = condition ? ifLines : elseLines;
        
        for (const line of linesToExecute) {
            if (this.isSpecialCode(line)) {
                this.executeSpecialCode(line, windowId);
            } else {
                this.executePseudoCode(line, [line], 0, windowId);
            }
        }
        
        return { skip: true, newIndex: i };
    }

    stopCode(windowId) {
        this.isRunning = false;
        this.updateRunButtons(windowId, false);
        this.addToConsole(windowId, '⏹️ Code execution stopped', 'warning');
    }

    // =========================================================
    // Console
    // =========================================================

    clearConsole(windowId) {
        const consoleEl = document.querySelector(`#console-${windowId}`);
        if (consoleEl) {
            consoleEl.innerHTML = '<div class="console-line welcome">Console cleared! Ready for new code! 🚀</div>';
        }
    }

    addToConsole(windowId, message, type = 'output') {
        const consoleEl = document.querySelector(`#console-${windowId}`);
        if (consoleEl) {
            const line = document.createElement('div');
            line.className = `console-line ${type}`;
            line.textContent = message;
            consoleEl.appendChild(line);
            consoleEl.scrollTop = consoleEl.scrollHeight;
        }
    }

    // =========================================================
    // UI helpers
    // =========================================================

    updateRunButtons(windowId, isRunning) {
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        const container = windowElement.querySelector('.elxacode-container');
        if (!container) return;
        
        const runBtn = container.querySelector('.run-btn');
        const stopBtn = container.querySelector('.stop-btn');
        
        if (runBtn) runBtn.disabled = isRunning;
        if (stopBtn) stopBtn.disabled = !isRunning;
    }

    updateWindowTitle(windowId, fileName) {
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        const titleElement = windowElement.querySelector('.window-title');
        if (titleElement) {
            titleElement.innerHTML = `${ElxaIcons.render('elxacode', 'ui')} ElxaCode - ${fileName}`;
        }
        
        // Update tab name
        const container = windowElement.querySelector('.elxacode-container');
        if (container) {
            const tabName = container.querySelector('.tab-name');
            if (tabName) {
                tabName.textContent = fileName;
            }
        }
    }

    setupConsoleResizer(windowId) {
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        const splitter = windowElement.querySelector(`#console-splitter-${windowId}`);
        const codeEditor = windowElement.querySelector(`#code-editor-${windowId}`);
        const consoleSection = windowElement.querySelector(`#console-section-${windowId}`);
        
        if (!splitter || !codeEditor || !consoleSection) return;
        
        let isResizing = false;
        let startY = 0;
        let startEditorHeight = 0;
        let startConsoleHeight = 0;
        
        const startResize = (e) => {
            isResizing = true;
            startY = e.clientY;
            
            const editorRect = codeEditor.getBoundingClientRect();
            const consoleRect = consoleSection.getBoundingClientRect();
            startEditorHeight = editorRect.height;
            startConsoleHeight = consoleRect.height;
            
            document.addEventListener('mousemove', doResize);
            document.addEventListener('mouseup', stopResize);
            
            splitter.classList.add('resizing');
            document.body.style.cursor = 'ns-resize';
        };
        
        const doResize = (e) => {
            if (!isResizing) return;
            
            const deltaY = e.clientY - startY;
            const newEditorHeight = startEditorHeight + deltaY;
            const newConsoleHeight = startConsoleHeight - deltaY;
            
            const minHeight = 100;
            
            if (newEditorHeight >= minHeight && newConsoleHeight >= minHeight) {
                codeEditor.style.height = newEditorHeight + 'px';
                consoleSection.style.height = newConsoleHeight + 'px';
                codeEditor.style.flex = 'none';
                consoleSection.style.flex = 'none';
            }
        };
        
        const stopResize = () => {
            isResizing = false;
            document.removeEventListener('mousemove', doResize);
            document.removeEventListener('mouseup', stopResize);
            
            splitter.classList.remove('resizing');
            document.body.style.cursor = '';
        };
        
        splitter.addEventListener('mousedown', startResize);
    }

    // =========================================================
    // Entry point for file manager — opens a NEW window with the file
    // Called as: elxaOS.programs.elxacode.openFile(filename, path)
    // =========================================================

    openFile(fileName, filePath) {
        return this.launch(filePath, fileName);
    }
}

// NOTE: All ElxaCode styles are in css/programs/elxacode.css.
// The editor/console use a dark VS Code–style theme intentionally.
// Toolbar and dialog chrome use OS theme variables.