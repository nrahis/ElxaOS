// =================================
// INSTALLER SERVICE - Handle .abby files and program installation (FIXED VERSION)
// =================================
class InstallerService {
    constructor(eventBus, fileSystem, windowManager, osInstance = null) {
        this.eventBus = eventBus;
        this.fileSystem = fileSystem;
        this.windowManager = windowManager;
        this.osInstance = osInstance; // Store reference to OS instance
        this.installedPrograms = new Map();
        this.setupEventHandlers();
        
        // Delay loading until OS is ready
        if (this.osInstance) {
            this.loadInstalledPrograms();
        }
    }

    setupEventHandlers() {
        // Listen for .abby file opens
        this.eventBus.on('installer.run', (data) => {
            this.runInstaller(data.filename, data.path);
        });

        // Listen for uninstall requests
        this.eventBus.on('program.uninstall', (data) => {
            this.uninstallProgram(data.programId);
        });
    }

    async runInstaller(filename, filePath) {
        // Get the .abby file content
        const abbyFile = this.fileSystem.getFile(filePath, filename);
        if (!abbyFile) {
            this.showMessage('Installation file not found!', 'error');
            return;
        }

        try {
            // Parse the .abby file (it should contain JSON with installation info)
            const installData = JSON.parse(abbyFile.content);
            console.log('Installing program:', installData);

            // Show installation dialog and wait for completion
            const result = await this.showInstallationDialog(installData, filename);
            console.log('Installation dialog result:', result);
        } catch (error) {
            console.error('Failed to parse installation file:', error);
            this.showMessage('Invalid installation file!', 'error');
        }
    }

    showInstallationDialog(installData, filename) {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'system-dialog installer-dialog';
            
            // Force proper sizing with important styles
            dialog.style.setProperty('max-height', '90vh', 'important');
            dialog.style.setProperty('overflow-y', 'auto', 'important');
            dialog.style.setProperty('min-width', '450px', 'important');
            dialog.style.setProperty('max-width', '600px', 'important');
            dialog.style.setProperty('height', 'auto', 'important');
            
            dialog.innerHTML = `
                <div class="dialog-content">
                    <div class="dialog-header">
                        <div class="dialog-title">📦 ElxaOS Installer</div>
                        <div class="dialog-close">×</div>
                    </div>
                    <div class="dialog-body installer-body" style="min-height: 200px; max-height: none; overflow-y: visible;">
                        <div class="install-header">
                            <div class="install-icon">${installData.icon || '🎮'}</div>
                            <div class="install-info">
                                <h3 class="program-name">${installData.name || 'Unknown Program'}</h3>
                                <p class="program-description">${installData.description || 'A fun program for ElxaOS!'}</p>
                                <div class="program-details">
                                    <div class="detail-item">
                                        <strong>Version:</strong> ${installData.version || '1.0'}
                                    </div>
                                    <div class="detail-item">
                                        <strong>Size:</strong> ${this.formatFileSize(filename.length * 100)} 
                                    </div>
                                    <div class="detail-item">
                                        <strong>Author:</strong> ${installData.author || 'ElxaOS Games'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="install-progress-container" style="display: none;">
                            <div class="install-status">Installing...</div>
                            <div class="progress-bar">
                                <div class="progress-fill"></div>
                            </div>
                            <div class="install-step"></div>
                        </div>
                        
                        <div class="install-actions">
                            <button class="install-btn">🚀 Install Game!</button>
                            <button class="cancel-btn">❌ Cancel</button>
                        </div>
                        
                        <div class="install-complete" style="display: none;">
                            <div class="success-message" style="text-align: center; padding: 20px;">
                                <div class="success-icon" style="font-size: 48px; margin-bottom: 12px;">🎉</div>
                                <h3 style="color: #008800; margin: 0 0 8px 0; font-size: 16px;">Installation Complete!</h3>
                                <p style="margin: 4px 0; font-size: 12px;">${installData.name} has been installed successfully!</p>
                                <p style="margin: 4px 0 16px 0; font-size: 12px;">You can now find it on your Desktop.</p>
                                <button class="finish-btn" style="background: linear-gradient(to bottom, #4CAF50, #45a049); border: 2px outset #4CAF50; padding: 8px 20px; font-size: 12px; font-weight: bold; color: white; cursor: pointer; border-radius: 4px;">✨ Finish</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Add dialog to DOM first
            document.body.appendChild(dialog);
            
            // Now get references to elements (they exist in DOM now)
            const installBtn = dialog.querySelector('.install-btn');
            const cancelBtn = dialog.querySelector('.cancel-btn');
            const finishBtn = dialog.querySelector('.finish-btn');
            const closeBtn = dialog.querySelector('.dialog-close');
            const progressContainer = dialog.querySelector('.install-progress-container');
            const installActions = dialog.querySelector('.install-actions');
            const installComplete = dialog.querySelector('.install-complete');

            // Cleanup function to ensure dialog is removed and promise resolves
            const cleanup = (result) => {
                console.log('Installer cleanup called with result:', result);
                if (dialog.parentNode) {
                    dialog.remove();
                }
                resolve(result);
            };

            // Handle close button (X)
            closeBtn.addEventListener('click', () => {
                console.log('Close (X) button clicked');
                cleanup(false);
            });

            // Handle install button
            installBtn.addEventListener('click', async () => {
                console.log('Install button clicked');
                try {
                    // Hide install actions, show progress
                    installActions.style.display = 'none';
                    progressContainer.style.display = 'block';
                    
                    // Simulate installation with cute steps
                    await this.simulateInstallation(dialog, installData);
                    
                    // Actually install the program
                    const success = this.installProgram(installData);
                    
                    if (success) {
                        console.log('Installation successful, showing completion screen');
                        // Show completion
                        progressContainer.style.display = 'none';
                        installComplete.style.display = 'block';
                        
                        // Force dialog to resize properly
                        const dialogBody = dialog.querySelector('.dialog-body');
                        dialog.style.setProperty('height', 'auto', 'important');
                        dialog.style.setProperty('max-height', '90vh', 'important');
                        dialogBody.style.setProperty('height', 'auto', 'important');
                        dialogBody.style.setProperty('max-height', 'none', 'important');
                        
                        // Force reflow
                        dialog.offsetHeight;
                        
                        console.log('Dialog height after success:', dialog.offsetHeight);
                        console.log('Dialog body height after success:', dialogBody.offsetHeight);
                        
                        // Auto-close after 10 seconds as failsafe
                        setTimeout(() => {
                            console.log('Auto-closing installer dialog after 10 seconds');
                            cleanup(true);
                        }, 10000);
                        
                        // Note: Don't resolve here, wait for finish button
                    } else {
                        console.log('Installation failed');
                        this.showMessage('Installation failed!', 'error');
                        cleanup(false);
                    }
                } catch (error) {
                    console.error('Error during installation:', error);
                    this.showMessage('Installation error: ' + error.message, 'error');
                    cleanup(false);
                }
            });

            // Handle cancel button
            cancelBtn.addEventListener('click', () => {
                console.log('Cancel button clicked');
                cleanup(false);
            });

            // Handle finish button
            finishBtn.addEventListener('click', () => {
                console.log('Finish button clicked');
                cleanup(true);
            });

            // Add ESC key handler for emergency exit
            const handleKeydown = (e) => {
                if (e.key === 'Escape') {
                    console.log('ESC pressed, closing installer');
                    document.removeEventListener('keydown', handleKeydown);
                    cleanup(false);
                }
            };
            document.addEventListener('keydown', handleKeydown);

            // Add timeout as failsafe (30 seconds)
            const timeoutId = setTimeout(() => {
                console.warn('Installer dialog timeout - force closing');
                document.removeEventListener('keydown', handleKeydown);
                cleanup(false);
            }, 30000);

            // Clear timeout when dialog resolves normally
            const originalResolve = resolve;
            resolve = (result) => {
                clearTimeout(timeoutId);
                document.removeEventListener('keydown', handleKeydown);
                originalResolve(result);
            };
        });
    }

    async simulateInstallation(dialog, installData) {
        const progressFill = dialog.querySelector('.progress-fill');
        const stepElement = dialog.querySelector('.install-step');
        
        const steps = [
            'Checking system requirements...',
            'Preparing installation files...',
            'Creating desktop shortcut...',
            'Registering program...',
            'Finalizing installation...'
        ];

        for (let i = 0; i < steps.length; i++) {
            stepElement.textContent = steps[i];
            const progress = ((i + 1) / steps.length) * 100;
            progressFill.style.width = progress + '%';
            
            // Wait a bit for dramatic effect
            await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
        }
    }

    installProgram(installData) {
        try {
            // Generate a unique program ID
            const programId = `installed_${installData.id || installData.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
            
            // Store program data
            const programInfo = {
                id: programId,
                name: installData.name,
                description: installData.description,
                icon: installData.icon || '🎮',
                version: installData.version || '1.0',
                author: installData.author || 'ElxaOS Games',
                installDate: new Date(),
                gameData: installData.gameData || {}
            };

            // Add to installed programs
            this.installedPrograms.set(programId, programInfo);
            this.saveInstalledPrograms();

            // Create a shortcut file in the Desktop folder instead of directly creating DOM
            const shortcutContent = JSON.stringify({
                type: 'program_shortcut',
                programId: programId,
                programInfo: programInfo
            });

            // Create the shortcut file in Desktop folder
            this.fileSystem.createFile(['root', 'Desktop'], `${installData.name}.lnk`, shortcutContent, 'lnk');

            // Register the program with the system
            this.registerProgram(programInfo);

            // Trigger desktop refresh so the icon appears
            this.eventBus.emit('desktop.changed');

            this.showMessage(`${installData.name} installed successfully!`, 'success');
            return true;
        } catch (error) {
            console.error('Installation error:', error);
            return false;
        }
    }

    createDesktopIcon(programInfo) {
        const desktopIcons = document.getElementById('desktopIcons');
        if (!desktopIcons) return;

        // Check if icon already exists
        if (desktopIcons.querySelector(`[data-program="${programInfo.id}"]`)) {
            return; // Don't create duplicate
        }

        const iconElement = document.createElement('div');
        iconElement.className = 'desktop-icon installed-program';
        iconElement.dataset.program = programInfo.id;
        iconElement.dataset.installed = 'true';
        
        iconElement.innerHTML = `
            <div class="desktop-icon-image">${programInfo.icon}</div>
            <div class="desktop-icon-label">${programInfo.name}</div>
        `;

        desktopIcons.appendChild(iconElement);
        
        // Trigger desktop refresh
        this.eventBus.emit('desktop.changed');
    }

    registerProgram(programInfo) {
        // Register the program so it can be launched
        const os = this.osInstance || elxaOS; // Use instance if available, fallback to global
        if (os) {
            if (!os.installedPrograms) {
                os.installedPrograms = {};
            }
            os.installedPrograms[programInfo.id] = programInfo;
        }
    }

    uninstallProgram(programId) {
        const programInfo = this.installedPrograms.get(programId);
        if (!programInfo) {
            this.showMessage('Program not found!', 'error');
            return;
        }

        // Show confirmation dialog
        const confirmed = confirm(`Are you sure you want to uninstall ${programInfo.name}?`);
        if (!confirmed) return;

        // Remove from installed programs
        this.installedPrograms.delete(programId);
        this.saveInstalledPrograms();

        // Find and delete the .lnk shortcut file from Desktop folder
        const desktopFiles = this.fileSystem.listContents(['root', 'Desktop']);
        const shortcutFile = desktopFiles.find(file => {
            if (file.name.endsWith('.lnk')) {
                try {
                    const shortcutData = JSON.parse(file.content);
                    return shortcutData.programId === programId;
                } catch (e) {
                    return false;
                }
            }
            return false;
        });

        if (shortcutFile) {
            // Move the shortcut file to Recycle Bin
            this.fileSystem.deleteItem(['root', 'Desktop'], shortcutFile.name);
        }

        // Unregister from system
        if (elxaOS.installedPrograms) {
            delete elxaOS.installedPrograms[programId];
        }

        this.showMessage(`${programInfo.name} has been uninstalled.`, 'success');
        this.eventBus.emit('desktop.changed');
    }

    saveInstalledPrograms() {
        try {
            const data = {};
            this.installedPrograms.forEach((value, key) => {
                data[key] = value;
            });
            localStorage.setItem('elxaOS-installed-programs', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save installed programs:', error);
        }
    }

    loadInstalledPrograms() {
        try {
            const saved = localStorage.getItem('elxaOS-installed-programs');
            if (saved) {
                const data = JSON.parse(saved);
                Object.entries(data).forEach(([key, value]) => {
                    // Restore date objects
                    if (value.installDate && typeof value.installDate === 'string') {
                        value.installDate = new Date(value.installDate);
                    }
                    this.installedPrograms.set(key, value);
                });
                
                // Recreate desktop icons for installed programs
                this.installedPrograms.forEach(programInfo => {
                    this.createDesktopIcon(programInfo);
                    this.registerProgram(programInfo);
                });
            }
        } catch (error) {
            console.error('Failed to load installed programs:', error);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    showMessage(text, type = 'info') {
        const message = document.createElement('div');
        message.className = `system-message ${type}`;
        message.textContent = text;
        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 3000);
    }
}

// =================================
// SIMPLE PLACEHOLDER GAME (unchanged)
// =================================
class SimpleGame {
    constructor(windowManager, gameData = {}) {
        this.windowManager = windowManager;
        this.gameData = gameData;
        this.score = 0;
        this.gameActive = false;
    }

    launch(programInfo) {
        // Check game type and launch appropriate game
        const gameType = this.gameData.type || 'target_game';
        
        switch (gameType) {

            case 'snake_deluxe':
                // Launch Snake Deluxe game
                if (typeof SnakeDeluxe !== 'undefined') {
                    const snakeDeluxeGame = new SnakeDeluxe(this.windowManager, this.gameData);
                    return snakeDeluxeGame.launch(programInfo);
                } else {
                    console.error('SnakeDeluxe class not found! Make sure snake-deluxe.js is loaded.');
                    alert('Snake Deluxe not available. Please check if the game files are loaded.');
                    return null;
                }

            case 'snake_game':
                // Launch Snake game
                if (typeof SnakeGame !== 'undefined') {
                    const snakeGame = new SnakeGame(this.windowManager, this.gameData);
                    return snakeGame.launch(programInfo);
                } else {
                    console.error('SnakeGame class not found! Make sure snake-game.js is loaded.');
                    alert('Snake Game not available. Please check if the game files are loaded.');
                    return null;
                }

            case 'mail_room_mayhem':
                // Launch Mail Room Mayhem game
                if (typeof MailRoomMayhem !== 'undefined') {
                    const mailRoomMayhemGame = new MailRoomMayhem(this.windowManager, this.gameData); // Assuming this.gameData is relevant or can be adapted
                    return mailRoomMayhemGame.launch(programInfo);
                } else {
                    console.error('MailRoomMayhem class not found! Make sure mail-room-mayhem.js is loaded.');
                    alert('Mail Room Mayhem not available. Please check if the game files are loaded.');
                    return null;
                }
            
            case 'sussy_cat_game':
                // Launch Sussy Cat Adventure game
                if (typeof SussyCatGame !== 'undefined') {
                    const sussyCatGame = new SussyCatGame(this.windowManager, this.gameData);
                    return sussyCatGame.launch(programInfo);
                } else {
                    console.error('SussyCatGame class not found! Make sure sussy-cat-game.js is loaded.');
                    alert('Sussy Cat Adventure not available. Please check if the game files are loaded.');
                    return null;
                }

            case 'target_game':
            default:
                // Launch Target game (existing implementation)
                const windowId = `game-${programInfo.id}-${Date.now()}`;
                const windowContent = this.createGameInterface();
                
                const window = this.windowManager.createWindow(
                    windowId,
                    `🎮 ${programInfo.name}`,
                    windowContent,
                    { width: '500px', height: '400px', x: '200px', y: '150px' }
                );
                
                this.setupGameEvents(windowId);
                return windowId;
        }
    }

    createGameInterface() {
        return `
            <div class="simple-game-container">
                <div class="game-header">
                    <div class="game-title">🎯 Click the Targets!</div>
                    <div class="game-score">Score: <span class="score-value">0</span></div>
                    <div class="game-timer">Time: <span class="timer-value">30</span>s</div>
                </div>
                
                <div class="game-area">
                    <div class="game-start-screen">
                        <div class="start-message">
                            <h3>🎮 Welcome to the Target Game!</h3>
                            <p>Click the targets as fast as you can!</p>
                            <p>You have 30 seconds - good luck!</p>
                            <button class="start-game-btn">🚀 Start Game</button>
                        </div>
                    </div>
                    
                    <div class="game-play-area" style="display: none;">
                        <!-- Targets will appear here -->
                    </div>
                    
                    <div class="game-over-screen" style="display: none;">
                        <div class="game-over-message">
                            <h3>🎉 Game Over!</h3>
                            <p>Your Score: <span class="final-score">0</span></p>
                            <p class="score-message"></p>
                            <button class="play-again-btn">🔄 Play Again</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupGameEvents(windowId) {
        const window = document.getElementById(`window-${windowId}`);
        const container = window.querySelector('.simple-game-container');
        
        const startBtn = container.querySelector('.start-game-btn');
        const playAgainBtn = container.querySelector('.play-again-btn');
        const gameArea = container.querySelector('.game-play-area');
        const startScreen = container.querySelector('.game-start-screen');
        const gameOverScreen = container.querySelector('.game-over-screen');

        startBtn.addEventListener('click', () => {
            this.startGame(container);
        });

        playAgainBtn.addEventListener('click', () => {
            this.resetGame(container);
        });
    }

    startGame(container) {
        const startScreen = container.querySelector('.game-start-screen');
        const gameArea = container.querySelector('.game-play-area');
        const scoreElement = container.querySelector('.score-value');
        const timerElement = container.querySelector('.timer-value');
        
        // Hide start screen, show game area
        startScreen.style.display = 'none';
        gameArea.style.display = 'block';
        
        // Reset game state
        this.score = 0;
        this.gameActive = true;
        this.timeLeft = 30;
        
        scoreElement.textContent = this.score;
        timerElement.textContent = this.timeLeft;
        
        // Start the timer
        this.gameTimer = setInterval(() => {
            this.timeLeft--;
            timerElement.textContent = this.timeLeft;
            
            if (this.timeLeft <= 0) {
                this.endGame(container);
            }
        }, 1000);
        
        // Start spawning targets
        this.spawnTarget(container);
        this.targetInterval = setInterval(() => {
            if (this.gameActive) {
                this.spawnTarget(container);
            }
        }, 1500);
    }

    spawnTarget(container) {
        const gameArea = container.querySelector('.game-play-area');
        const target = document.createElement('div');
        target.className = 'game-target';
        target.innerHTML = '🎯';
        
        // Random position
        const maxX = gameArea.offsetWidth - 40;
        const maxY = gameArea.offsetHeight - 40;
        target.style.left = Math.random() * maxX + 'px';
        target.style.top = Math.random() * maxY + 'px';
        
        // Target click handler
        target.addEventListener('click', () => {
            if (this.gameActive) {
                this.score += 10;
                container.querySelector('.score-value').textContent = this.score;
                target.remove();
                
                // Visual feedback
                target.innerHTML = '💥';
                setTimeout(() => target.remove(), 200);
            }
        });
        
        gameArea.appendChild(target);
        
        // Remove target after 2 seconds if not clicked
        setTimeout(() => {
            if (target.parentNode) {
                target.remove();
            }
        }, 2000);
    }

    endGame(container) {
        this.gameActive = false;
        clearInterval(this.gameTimer);
        clearInterval(this.targetInterval);
        
        const gameArea = container.querySelector('.game-play-area');
        const gameOverScreen = container.querySelector('.game-over-screen');
        const finalScore = container.querySelector('.final-score');
        const scoreMessage = container.querySelector('.score-message');
        
        // Clear remaining targets
        gameArea.innerHTML = '';
        
        // Show game over screen
        gameArea.style.display = 'none';
        gameOverScreen.style.display = 'block';
        
        finalScore.textContent = this.score;
        
        // Score message
        let message = '';
        if (this.score >= 200) {
            message = "🏆 Amazing! You're a target master!";
        } else if (this.score >= 100) {
            message = "🎉 Great job! Nice shooting!";
        } else if (this.score >= 50) {
            message = "👍 Not bad! Keep practicing!";
        } else {
            message = "🙂 Good try! Play again to improve!";
        }
        
        scoreMessage.textContent = message;
    }

    resetGame(container) {
        const startScreen = container.querySelector('.game-start-screen');
        const gameOverScreen = container.querySelector('.game-over-screen');
        
        gameOverScreen.style.display = 'none';
        startScreen.style.display = 'block';
        
        // Reset score display
        container.querySelector('.score-value').textContent = '0';
        container.querySelector('.timer-value').textContent = '30';
    }
}