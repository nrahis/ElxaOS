// =================================
// DESKTOP MANAGEMENT - Enhanced with Drag & Drop
// =================================
class Desktop {
    constructor() {
        this.selectedIcon = null;
        this.dragData = null;
        this.iconPositions = new Map(); // Store custom icon positions
        this.setupEvents();
        this.loadIconPositions();
    }

    setupEvents() {
        // Desktop icon clicks and drag setup
        document.getElementById('desktopIcons').addEventListener('mousedown', (e) => {
            const icon = e.target.closest('.desktop-icon');
            if (icon) {
                this.selectIcon(icon);
                
                // Start drag after a small delay to distinguish from clicks
                this.dragTimeout = setTimeout(() => {
                    this.startDrag(icon, e);
                }, 150);
                
                e.preventDefault(); // Prevent text selection
            }
        });

        // Handle mouse up for click detection and drag end
        document.getElementById('desktopIcons').addEventListener('mouseup', (e) => {
            const icon = e.target.closest('.desktop-icon');
            if (icon && this.dragTimeout) {
                clearTimeout(this.dragTimeout);
                
                // Double-click detection
                if (this.lastClick && Date.now() - this.lastClick < 300) {
                    this.openProgram(icon.dataset.program);
                }
                this.lastClick = Date.now();
            }
            
            if (this.dragData) {
                this.endDrag();
            }
        });

        // Global mouse move for dragging
        document.addEventListener('mousemove', (e) => {
            if (this.dragData) {
                this.handleDrag(e);
            }
        });

        // Global mouse up to end dragging
        document.addEventListener('mouseup', () => {
            if (this.dragData) {
                this.endDrag();
            }
            if (this.dragTimeout) {
                clearTimeout(this.dragTimeout);
                this.dragTimeout = null;
            }
        });

        // Right-click context menu for desktop icons
        document.getElementById('desktopIcons').addEventListener('contextmenu', (e) => {
            const icon = e.target.closest('.desktop-icon');
            if (icon) {
                e.preventDefault();
                e.stopPropagation();
                this.showContextMenu(e, icon);
            }
        });

        // Hide context menu on any click
        document.addEventListener('click', () => {
            this.hideContextMenu();
        });

        // Clear selection when clicking desktop
        document.getElementById('desktop').addEventListener('click', (e) => {
            if (e.target.id === 'desktop' || e.target.id === 'wallpaper') {
                this.clearSelection();
            }
        });
    }

    startDrag(icon, e) {
        if (!icon) return;
        
        const rect = icon.getBoundingClientRect();
        const containerRect = document.getElementById('desktopIcons').getBoundingClientRect();
        
        this.dragData = {
            icon: icon,
            startX: e.clientX,
            startY: e.clientY,
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top,
            originalLeft: rect.left - containerRect.left,
            originalTop: rect.top - containerRect.top
        };
        
        // Add dragging visual feedback
        icon.classList.add('dragging');
        icon.style.zIndex = '1000';
        icon.style.position = 'absolute';
        icon.style.left = this.dragData.originalLeft + 'px';
        icon.style.top = this.dragData.originalTop + 'px';
        
        // Change cursor
        document.body.style.cursor = 'grabbing';
        
        // Clear any timeout since we're now dragging
        if (this.dragTimeout) {
            clearTimeout(this.dragTimeout);
            this.dragTimeout = null;
        }
    }

    handleDrag(e) {
        if (!this.dragData) return;
        
        const container = document.getElementById('desktopIcons');
        const containerRect = container.getBoundingClientRect();
        
        // Calculate new position
        let newLeft = e.clientX - containerRect.left - this.dragData.offsetX;
        let newTop = e.clientY - containerRect.top - this.dragData.offsetY;
        
        // Constrain to container bounds
        const iconWidth = 64;
        const iconHeight = 64;
        newLeft = Math.max(0, Math.min(newLeft, containerRect.width - iconWidth));
        newTop = Math.max(0, Math.min(newTop, containerRect.height - iconHeight));
        
        // Update position
        this.dragData.icon.style.left = newLeft + 'px';
        this.dragData.icon.style.top = newTop + 'px';
    }

    endDrag() {
        if (!this.dragData) return;
        
        const icon = this.dragData.icon;
        const iconId = icon.dataset.program || icon.dataset.file || 'unknown';
        
        // Save the new position
        const finalLeft = parseInt(icon.style.left);
        const finalTop = parseInt(icon.style.top);
        
        this.iconPositions.set(iconId, {
            left: finalLeft,
            top: finalTop
        });
        
        // Save to storage
        this.saveIconPositions();
        
        // Remove dragging visual feedback
        icon.classList.remove('dragging');
        icon.style.zIndex = '';
        document.body.style.cursor = '';
        
        // Reset drag data
        this.dragData = null;
        
        console.log(`📍 Icon "${iconId}" moved to position (${finalLeft}, ${finalTop})`);
    }

    selectIcon(icon) {
        this.clearSelection();
        icon.classList.add('selected');
        this.selectedIcon = icon;
    }

    clearSelection() {
        if (this.selectedIcon) {
            this.selectedIcon.classList.remove('selected');
            this.selectedIcon = null;
        }
    }

    // Apply saved positions to icons
    applyIconPositions() {
        const icons = document.querySelectorAll('.desktop-icon');
        icons.forEach(icon => {
            const iconId = icon.dataset.program || icon.dataset.file || 'unknown';
            const savedPosition = this.iconPositions.get(iconId);
            
            if (savedPosition) {
                icon.style.position = 'absolute';
                icon.style.left = savedPosition.left + 'px';
                icon.style.top = savedPosition.top + 'px';
            }
        });
    }

    // Save icon positions to localStorage
    saveIconPositions() {
        try {
            const positionsArray = Array.from(this.iconPositions.entries());
            localStorage.setItem('elxaOS-icon-positions', JSON.stringify(positionsArray));
            console.log('💾 Icon positions saved');
        } catch (error) {
            console.error('❌ Failed to save icon positions:', error);
        }
    }

    // Load icon positions from localStorage
    loadIconPositions() {
        try {
            const saved = localStorage.getItem('elxaOS-icon-positions');
            if (saved) {
                const positionsArray = JSON.parse(saved);
                this.iconPositions = new Map(positionsArray);
                console.log('📍 Icon positions loaded');
                
                // Apply positions after a short delay to ensure icons are rendered
                setTimeout(() => {
                    this.applyIconPositions();
                }, 100);
            }
        } catch (error) {
            console.error('❌ Failed to load icon positions:', error);
        }
    }

    // Reset all icon positions to default grid
    resetIconPositions() {
        this.iconPositions.clear();
        localStorage.removeItem('elxaOS-icon-positions');
        
        // Remove custom positioning from all icons
        const icons = document.querySelectorAll('.desktop-icon');
        icons.forEach(icon => {
            icon.style.position = '';
            icon.style.left = '';
            icon.style.top = '';
            icon.style.zIndex = '';
        });
        
        console.log('🔄 Icon positions reset to default');
    }

    openProgram(programId) {
        console.log('Opening program:', programId, 'Selected icon:', this.selectedIcon);
        
        // Check if this is a file icon with file path data
        if (this.selectedIcon && this.selectedIcon.dataset.filepath) {
            try {
                const filePath = JSON.parse(this.selectedIcon.dataset.filepath);
                const fileName = filePath[filePath.length - 1];
                const folderPath = filePath.slice(0, -1);
                
                // Get the program from the icon
                const program = this.selectedIcon.dataset.program;
                
                // Launch the program with the file
                if (program === 'notepad') {
                    if (elxaOS.programs.notepad) {
                        elxaOS.programs.notepad.openFile(fileName, folderPath);
                    }
                } else if (program === 'paint') {
                    if (elxaOS.programs.paint) {
                        elxaOS.programs.paint.openFile(fileName, folderPath);
                    }
                } else if (program === 'elxacode') {
                    if (elxaOS.programs.elxacode) {
                        elxaOS.programs.elxacode.openFile(fileName, folderPath);
                    }
                }
            } catch (e) {
                console.error('Error opening file:', e);
                alert('Error opening file: ' + e.message);
            }
        } else if (this.selectedIcon && this.selectedIcon.dataset.program === 'folder') {
            // Handle folder opening
            const folderName = this.selectedIcon.dataset.file;
            console.log('Opening folder:', folderName);
            
            elxaOS.eventBus.emit('program.launch', { 
                program: 'fileManager', 
                args: ['root', 'Desktop', folderName]
            });
        } else {
            // Regular program launch
            elxaOS.eventBus.emit('program.launch', { program: programId });
        }
    }

    showContextMenu(e, icon) {
        console.log('Context menu triggered for icon:', icon);
        console.log('Icon datasets:', icon.dataset);
        console.log('Is installed?', icon.dataset.installed === 'true');
        console.log('Has filepath?', icon.dataset.filepath);
        
        this.hideContextMenu(); // Hide any existing menu
        
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.id = 'desktop-context-menu';
        
        // Different menu items based on icon type
        const isInstalled = icon.dataset.installed === 'true';
        const isFile = icon.dataset.filepath;
        
        if (isInstalled) {
            // Installed program menu
            menu.innerHTML = `
                <div class="context-item" data-action="open">
                    <span>🚀</span> Open
                </div>
                <div class="context-separator"></div>
                <div class="context-item" data-action="uninstall">
                    <span>🗑️</span> Uninstall
                </div>
            `;
        } else if (isFile) {
            // File menu
            const fileName = JSON.parse(icon.dataset.filepath)[2];
            if (fileName.endsWith('.abby')) {
                menu.innerHTML = `
                    <div class="context-item" data-action="install">
                        <span>📦</span> Install
                    </div>
                    <div class="context-separator"></div>
                    <div class="context-item" data-action="delete">
                        <span>🗑️</span> Delete
                    </div>
                `;
            } else {
                menu.innerHTML = `
                    <div class="context-item" data-action="open">
                        <span>📂</span> Open
                    </div>
                    <div class="context-separator"></div>
                    <div class="context-item" data-action="delete">
                        <span>🗑️</span> Delete
                    </div>
                `;
            }
        } else {
            // System icon menu
            menu.innerHTML = `
                <div class="context-item" data-action="open">
                    <span>📂</span> Open
                </div>
                <div class="context-separator"></div>
                <div class="context-item" data-action="reset-positions">
                    <span>🔄</span> Reset Icon Layout
                </div>
            `;
        }
        
        // Position the menu
        menu.style.left = e.pageX + 'px';
        menu.style.top = e.pageY + 'px';
        
        // Add event listeners
        menu.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = e.target.closest('.context-item');
            if (item) {
                this.handleContextAction(item.dataset.action, icon);
                this.hideContextMenu();
            }
        });

        // Also prevent the menu itself from triggering other context menus
        menu.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        
        document.body.appendChild(menu);
        
        // Adjust position if menu goes off-screen
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            menu.style.left = (e.pageX - rect.width) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            menu.style.top = (e.pageY - rect.height) + 'px';
        }
    }

    handleContextAction(action, icon) {
        switch (action) {
            case 'open':
            case 'install':
                this.openProgram(icon.dataset.program);
                break;
            
            case 'uninstall':
                if (icon.dataset.program) {
                    elxaOS.eventBus.emit('program.uninstall', { 
                        programId: icon.dataset.program 
                    });
                }
                break;
            
            case 'delete':
                if (icon.dataset.filepath) {
                    const filePath = JSON.parse(icon.dataset.filepath);
                    const fileName = filePath[filePath.length - 1];
                    const folderPath = filePath.slice(0, -1);
                    
                    if (confirm(`Delete "${fileName}"?`)) {
                        elxaOS.fileSystem.deleteItem(folderPath, fileName);
                        elxaOS.refreshDesktop();
                    }
                }
                break;
                
            case 'reset-positions':
                if (confirm('Reset all desktop icons to default positions?')) {
                    this.resetIconPositions();
                }
                break;
        }
    }

    hideContextMenu() {
        const menu = document.getElementById('desktop-context-menu');
        if (menu) {
            menu.remove();
        }
    }
}

// =================================
// TASKBAR MANAGEMENT  
// =================================
class Taskbar {
    constructor() {
        this.startMenuOpen = false;
        this.setupEvents();
    }

    setupEvents() {
        // Start button
        document.getElementById('startButton').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleStartMenu();
        });

        // Start menu items
        document.getElementById('startMenu').addEventListener('click', (e) => {
            const item = e.target.closest('.start-menu-item');
            if (item) {
                if (item.dataset.program) {
                    elxaOS.eventBus.emit('program.launch', { program: item.dataset.program });
                } else if (item.dataset.action === 'shutdown') {
                    elxaOS.eventBus.emit('system.shutdown');
                } else if (item.dataset.action === 'personalize') {
                    elxaOS.themeService.showThemeDialog();
                } else if (item.dataset.action === 'userSettings') {
                    elxaOS.loginService.showUserSettingsDialog();
                } else if (item.dataset.action === 'logout') {
                    elxaOS.loginService.logout();
                }
                this.hideStartMenu();
            }
        });

        // Close start menu when clicking elsewhere
        document.addEventListener('click', () => {
            this.hideStartMenu();
        });

        // System tray icons
        const antivirusIcon = document.getElementById('antivirusIcon');
        if (antivirusIcon) {
            antivirusIcon.addEventListener('click', () => {
                elxaOS.eventBus.emit('program.launch', { program: 'antivirus' });
            });
        }

        document.getElementById('batteryIcon').addEventListener('click', () => {
            elxaOS.eventBus.emit('battery.click');
        });

        document.getElementById('wifiIcon').addEventListener('click', () => {
            elxaOS.eventBus.emit('wifi.click');
        });

        // Clock click to open Time Center
        document.getElementById('clock').addEventListener('click', () => {
            elxaOS.eventBus.emit('clock.click');
        });
    }

    toggleStartMenu() {
        if (this.startMenuOpen) {
            this.hideStartMenu();
        } else {
            this.showStartMenu();
        }
    }

    showStartMenu() {
        document.getElementById('startMenu').style.display = 'flex';
        this.startMenuOpen = true;
    }

    hideStartMenu() {
        document.getElementById('startMenu').style.display = 'none';
        this.startMenuOpen = false;
    }

}

// =================================
// MAIN SYSTEM INITIALIZATION
// =================================
class ElxaOS {
    constructor() {
        this.eventBus = new EventBus();
        this.windowManager = new WindowManager();
        this.fileSystem = new FileSystem();
        this.desktop = new Desktop();
        this.taskbar = new Taskbar();
        this.clockSystem = new ClockSystem(this.eventBus, this.windowManager);
        this.batteryService = new BatteryService(this.eventBus);
        this.wifiService = new WiFiService(this.eventBus);
        this.themeService = new ThemeService(this.eventBus);
        this.loginService = new LoginService(this.eventBus);
        this.installerService = new InstallerService(this.eventBus, this.fileSystem, this.windowManager, this);
        this.bootSystem = new BootSystem();
        this.updatePopup = new UpdatePopup();

        // Initialize virus system BEFORE programs that might need it
        this.virusSystem = new VirusSystem(this.eventBus);
        
        // Initialize programs (including the new antivirus)
        this.programs = {
            notepad: new NotepadProgram(this.windowManager, this.fileSystem, this.eventBus),
            paint: new PaintProgram(this.windowManager, this.fileSystem, this.eventBus), 
            fileManager: new FileManagerProgram(this.windowManager, this.fileSystem, this.eventBus),
            duckConsole: new DuckConsoleProgram(this.windowManager, this.fileSystem, this.eventBus),
            calculator: new CalculatorProgram(this.windowManager, this.fileSystem, this.eventBus),
            elxacode: new ElxaCodeProgram(this.windowManager, this.fileSystem, this.eventBus),
            elxabooks: new ElxaBooksProgram(this.windowManager, this.fileSystem, this.eventBus),
            browser: new BrowserProgram(this.windowManager, this.fileSystem, this.eventBus),
            // NEW: Add the antivirus program
            antivirus: new AntivirusProgram(this.windowManager, this.fileSystem, this.eventBus),
            viruslab: new VirusLabProgram(this.windowManager, this.fileSystem, this.eventBus)
        };

        // Initialize installed programs storage
        this.installedPrograms = {};
        
        this.setupEventHandlers();
        this.initialize();
    }

    setupEventHandlers() {
        // Program launch handler - FIXED: Now passes the entire data object
        this.eventBus.on('program.launch', (data) => {
            this.launchProgram(data.program, data.args);
        });

        // System handlers
        this.eventBus.on('system.shutdown', () => {
            this.shutdown();
        });

        // Desktop sync handler
        this.eventBus.on('desktop.changed', () => {
            this.refreshDesktop();
        });
    }

    // FIXED: Updated launchProgram to properly handle args parameter
    launchProgram(programId, args = null) {
        console.log('Launching program:', programId, 'with args:', args);
        
        // Check if this is an installed program
        if (programId && programId.startsWith('installed_')) {
            const programInfo = this.installedPrograms[programId];
            if (programInfo) {
                const game = new SimpleGame(this.windowManager, programInfo.gameData);
                game.launch(programInfo);
                return;
            }
        }
        
        switch (programId) {
            case 'notepad':
                this.programs.notepad.launch();
                break;
            
            case 'computer':
                this.programs.fileManager.launch(['root']);
                break;
            
            case 'recycle-bin':
                this.programs.fileManager.launch(['root', 'RecycleBin']);
                break;

            case 'paint':
                this.programs.paint.launch();
                break;

            case 'calculator':
                this.programs.calculator.launch();
                break;

            case 'elxacode':
                this.programs.elxacode.launch();
                break;

            case 'elxabooks':
                this.programs.elxabooks.launch();
                break;

            case 'browser':
                this.programs.browser.launch();
                break;

            case 'antivirus':
            case 'elxaguard':
                this.programs.antivirus.launch();
                break;

            case 'viruslab':
                this.programs.viruslab.launch();
                break;

            case 'fileManager':
                // FIXED: Handle file manager with optional path argument
                if (args && Array.isArray(args)) {
                    console.log('Opening file manager with path:', args);
                    this.programs.fileManager.launch(args);
                } else {
                    this.programs.fileManager.launch(['root']);
                }
                break;

            case 'folder':
                // FIXED: This case now properly handles folder paths
                console.log('Folder case in launchProgram with args:', args);
                if (args && Array.isArray(args)) {
                    this.programs.fileManager.launch(args);
                } else {
                    // Fallback to root if no args provided
                    this.programs.fileManager.launch(['root']);
                }
                break;

            case 'duck-console':
                this.programs.duckConsole.launch();
                break;
                
            default:
                console.warn('Unknown program:', programId);
                break;
        }
    }

    shutdown() {
        if (confirm('Are you sure you want to shut down ElxaOS?')) {
            console.log('🔌 Shutting down ElxaOS...');
            document.body.style.background = 'black';
            document.body.innerHTML = '<div style="color: white; text-align: center; padding-top: 200px; font-size: 24px;">ElxaOS is shutting down...</div>';
            
            if (this.bootSystem && typeof this.bootSystem.startFromShutdown === 'function') {
                this.bootSystem.startFromShutdown();
            } else {
                setTimeout(() => location.reload(), 2000);
            }
        }
    }

    initialize() {
        // Just set up the service, don't show login screen yet
        // The boot system will call showLoginScreen() when ready
        console.log('Login service initialized and ready');
        console.log('ElxaOS initialized successfully!');
        
        // Check if Welcome.txt already exists before creating it
        const desktopContents = this.fileSystem.listContents(['root', 'Desktop']);
        const welcomeExists = desktopContents.some(file => file.name === 'Welcome.txt');
        
        if (!welcomeExists) {
            // Create Welcome.txt only if it doesn't exist
            this.fileSystem.createFile(['root', 'Desktop'], 'Welcome.txt', 'Welcome to ElxaOS!\n\nThis is your new operating system.\n\nFeatures:\n- File Manager with navigation\n- Rich Text Notepad\n- System Services (Battery, WiFi)\n- And much more!');
        }
        
        // Create other default files only if they don't exist
        const documentsContents = this.fileSystem.listContents(['root', 'Documents']);
        
        if (!documentsContents.some(file => file.name === 'ReadMe.txt')) {
            this.fileSystem.createFile(['root', 'Documents'], 'ReadMe.txt', 'ElxaOS Features:\n- File System with folders and files\n- Multiple Programs\n- Window Management\n- System Tray Services\n- Login System\n- Theme Support');
        }
        
        if (!documentsContents.some(file => file.name === 'Getting Started.html')) {
            this.fileSystem.createFile(['root', 'Documents'], 'Getting Started.html', '<h1>Getting Started with ElxaOS</h1><p>Welcome to your new operating system!</p><ul><li>Use <strong>My Computer</strong> to browse files</li><li>Try the <em>Notepad</em> for text editing</li><li>Click the battery icon to check power</li><li>Explore the Start Menu for more programs</li></ul>');
        }
        
        // Create some folders for organization if they don't exist
        if (!documentsContents.some(file => file.name === 'Projects')) {
            this.fileSystem.createFolder(['root', 'Documents'], 'Projects');
        }
        
        const picturesContents = this.fileSystem.listContents(['root', 'Pictures']);
        if (!picturesContents.some(file => file.name === 'Screenshots')) {
            this.fileSystem.createFolder(['root', 'Pictures'], 'Screenshots');
        }

        // FIXED: Don't create Programs folder in Documents - it should be at root level
        // The Programs folder is already created in FileSystem constructor at root level
        
        // Create game installers in Programs folder (at root level)
        const programsContents = this.fileSystem.listContents(['root', 'Programs']);

        // Target Game installer
        if (!programsContents.some(file => file.name === 'Target Game.abby')) {
            const targetGameInstaller = {
                id: 'target_game',
                name: 'Target Game', 
                description: 'A fun clicking game where you try to hit as many targets as possible!',
                icon: '🎯',
                version: '1.0',
                author: 'ElxaOS Games',
                gameData: {
                    type: 'target_game',
                    difficulty: 'normal'
                }
            };
            
            this.fileSystem.createFile(['root', 'Programs'], 'Target Game.abby', JSON.stringify(targetGameInstaller));
        }

        // Snake Game installer
        if (!programsContents.some(file => file.name === 'Snake Game.abby')) {
            const snakeGameInstaller = {
                id: 'snake_game',
                name: 'Classic Snake',
                description: 'The classic Snake game! Control the snake, eat food, grow longer, and try not to crash into walls or yourself. Features smooth gameplay, increasing speed, and score tracking.',
                icon: '🐍',
                version: '2.0',
                author: 'ElxaOS Games Studio',
                gameData: {
                    type: 'snake_game',
                    speed: 150,
                    boardSize: 20,
                    difficulty: 'normal'
                }
            };
            
            this.fileSystem.createFile(['root', 'Programs'], 'Snake Game.abby', JSON.stringify(snakeGameInstaller));
        }

        // Snake Deluxe installer - The Epic Adventure!
        if (!programsContents.some(file => file.name === 'Snake Deluxe.abby')) {
            const snakeDeluxeInstaller = {
                id: 'snake_deluxe',
                name: 'Snake Deluxe: Mr. Snake-e\'s Adventure',
                description: 'Join Mr. Snake-e, the 60-year-old billionaire CEO of ElxaCorp, on his epic adventures through Snakesia! Navigate through 10 magical levels with his 82-year-old wife Mrs. Snake-e!',
                icon: '🐍',
                version: '1.0',
                author: 'ElxaCorp Game Studios',
                gameData: {
                    type: 'snake_deluxe',
                    difficulty: 'normal',
                    boardSize: 24
                }
            };
            
            this.fileSystem.createFile(['root', 'Programs'], 'Snake Deluxe.abby', JSON.stringify(snakeDeluxeInstaller));
        }

        if (!documentsContents.some(file => file.name === 'My First Code.elxa')) {
            this.fileSystem.createFile(['root', 'Documents'], 'My First Code.elxa', `// My First ElxaCode Program! 🚀
    // Double-click this file or open it with ElxaCode!

    print "Hello, World!"
    print "I'm learning to code!"

    // Try these special keywords:
    abby
    cat
    duck
    elxa

    // Let's do some math:
    add 10 + 5
    subtract 20 - 3

    // Variables are fun:
    var myname = "Super Coder"
    print "Hello, " + myname

    // Conditionals:
    if myname == "Super Coder"
        print "You are amazing!"
        cat
    else
        print "Keep coding!"
    end

    print "Great job coding!"
    duck`);
        }
        
        // Sync desktop icons
        if (this.programs.fileManager) {
            this.programs.fileManager.syncDesktopFiles();
        }

        // Load installed programs after everything is set up
        this.installerService.loadInstalledPrograms();
        
        // Debug: Check if bootSystem exists and start boot sequence
        console.log('🚀 Checking boot system:', this.bootSystem);
        if (this.bootSystem && typeof this.bootSystem.startBoot === 'function') {
            console.log('🚀 Starting boot sequence...');
            this.bootSystem.startBoot();
        } else {
            console.error('❌ Boot system not found, falling back to login');
            this.loginService.initialize();
        }
    }

    refreshDesktop() {
        if (this.programs.fileManager) {
            this.programs.fileManager.syncDesktopFiles();
        }
    }
}

// Initialize ElxaOS when page loads
let elxaOS;
document.addEventListener('DOMContentLoaded', () => {
    elxaOS = new ElxaOS();
});