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

        // Right-click context menu for desktop icons - IMPROVED: Better targeting
        document.getElementById('desktopIcons').addEventListener('contextmenu', (e) => {
            const icon = e.target.closest('.desktop-icon');
            if (icon) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation(); // ADDED: Prevent other handlers
                this.showContextMenu(e, icon);
                return false; // ADDED: Extra prevention
            }
        });

        // IMPROVED: Better context menu hiding with more specific targeting
        document.addEventListener('click', (e) => {
            // Only hide if click is not within an email interface or other special areas
            const isEmailInterface = e.target.closest('#emailInterface, .elxamail-container, .elxamail-context-menu');
            const isBrowserInterface = e.target.closest('.browser-window, .browser-page');
            
            if (!isEmailInterface && !isBrowserInterface) {
                this.hideContextMenu();
            }
        });

        // IMPROVED: Desktop context menu - only for actual desktop areas
        document.addEventListener('contextmenu', (e) => {
            // Check if we're right-clicking on the actual desktop (not in email, browser, etc.)
            const isDesktopArea = e.target.id === 'desktop' || e.target.id === 'wallpaper' || 
                                  e.target.closest('#desktop') && !e.target.closest('.desktop-icon');
            
            // Don't show desktop context menu if we're in email interface, browser, or other apps
            const isInApp = e.target.closest('#emailInterface, .elxamail-container, .browser-window, .window-content');
            
            if (isDesktopArea && !isInApp) {
                // Could add desktop-wide context menu here in the future
                // For now, just prevent default browser context menu
                e.preventDefault();
            }
        });

        // Clear selection when clicking desktop - IMPROVED: Better targeting
        document.getElementById('desktop').addEventListener('click', (e) => {
            // Only clear selection if clicking actual desktop areas, not app content
            const isDesktopArea = e.target.id === 'desktop' || e.target.id === 'wallpaper';
            const isInApp = e.target.closest('.window-content, #emailInterface, .elxamail-container');
            
            if (isDesktopArea && !isInApp) {
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
            messenger: new MessengerProgram(this.windowManager, this.fileSystem, this.eventBus),
            // NEW: Add the antivirus program
            antivirus: new AntivirusProgram(this.windowManager, this.fileSystem, this.eventBus),
            viruslab: new VirusLabProgram(this.windowManager, this.fileSystem, this.eventBus)
        };

        // Initialize installed programs storage
        this.installedPrograms = {};

        // Initialize System 0 AFTER everything else is set up
        this.system0 = new System0(this.eventBus);
        console.log('🔴 System 0 initialized and listening for commands...');
        
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

            case 'messenger':
                this.programs.messenger.launch();
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

    async shutdown() {
        console.log('🔌 Initiating ElxaOS shutdown...');
        
        // Initialize shutdown manager if not exists
        if (!this.shutdownManager) {
            this.shutdownManager = new ShutdownManager();
        }
        
        // Show custom confirmation dialog (no more browser alerts!)
        const confirmed = await this.shutdownManager.showShutdownConfirmation();
        
        if (confirmed) {
            console.log('🔌 Shutdown confirmed, proceeding...');
            
            // Hide main UI
            const desktop = document.getElementById('desktop');
            const taskbar = document.querySelector('.taskbar');
            if (desktop) desktop.style.display = 'none';
            if (taskbar) taskbar.style.display = 'none';
            
            // Show shutdown screen with power button
            this.shutdownManager.showShutdownScreen();
        } else {
            console.log('🔌 Shutdown cancelled by user');
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

        if (!documentsContents.some(file => file.name === 'Bank')) {
            this.fileSystem.createFolder(['root', 'System'], 'Bank');
        }
        
        const picturesContents = this.fileSystem.listContents(['root', 'Pictures']);
        if (!picturesContents.some(file => file.name === 'Screenshots')) {
            this.fileSystem.createFolder(['root', 'Pictures'], 'Screenshots');
        }

        // Create desktop shortcuts for browser and antivirus
        const currentDesktopContents = this.fileSystem.listContents(['root', 'Desktop']);
        
        // Browser shortcut
        if (!currentDesktopContents.some(file => file.name === 'Snoogle Browser.lnk')) {
            const browserShortcut = {
                type: 'program_shortcut',
                programId: 'browser',
                programInfo: {
                    name: 'Snoogle Browser',
                    icon: '🌐',
                    description: 'Browse the web with Snoogle Browser'
                }
            };
            this.fileSystem.createFile(['root', 'Desktop'], 'Snoogle Browser.lnk', JSON.stringify(browserShortcut));
        }

        // Messenger shortcut
        if (!currentDesktopContents.some(file => file.name === 'Snakesia Messenger.lnk')) {
            const messengerShortcut = {
                type: 'program_shortcut',
                programId: 'messenger',
                programInfo: {
                    name: 'Snakesia Messenger',
                    icon: '💬',
                    description: 'Chat with your friends in Snakesia!'
                }
            };
            this.fileSystem.createFile(['root', 'Desktop'], 'Snakesia Messenger.lnk', JSON.stringify(messengerShortcut));
        }

        // Antivirus shortcut
        if (!currentDesktopContents.some(file => file.name === 'ElxaGuard Antivirus.lnk')) {
            const antivirusShortcut = {
                type: 'program_shortcut',
                programId: 'antivirus',
                programInfo: {
                    name: 'ElxaGuard Antivirus',
                    icon: '🛡️',
                    description: 'Protect your system with ElxaGuard Antivirus'
                }
            };
            this.fileSystem.createFile(['root', 'Desktop'], 'ElxaGuard Antivirus.lnk', JSON.stringify(antivirusShortcut));
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

// =================================
// ENHANCED SHUTDOWN SYSTEM - ElxaOS Shutdown with Sound & Power Button
// =================================

class ShutdownManager {
    constructor() {
        this.isShuttingDown = false;
        this.shutdownSoundEnabled = true;
    }

    // Play shutdown sound
    async playShutdownSound() {
        if (!this.shutdownSoundEnabled) {
            console.log('🔇 Shutdown sound disabled');
            return;
        }

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create a gentle descending shutdown sound (opposite of startup)
            const notes = [
                { freq: 1046.50, start: 0.0, duration: 0.4 },    // C6
                { freq: 783.99, start: 0.3, duration: 0.4 },     // G5
                { freq: 659.25, start: 0.6, duration: 0.4 },     // E5
                { freq: 523.25, start: 0.9, duration: 0.6 }      // C5
            ];

            const masterGain = audioContext.createGain();
            masterGain.connect(audioContext.destination);
            masterGain.gain.setValueAtTime(0.25, audioContext.currentTime);

            notes.forEach(note => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(masterGain);
                
                oscillator.frequency.setValueAtTime(note.freq, audioContext.currentTime);
                oscillator.type = 'sine';
                
                // Smooth attack and release
                gainNode.gain.setValueAtTime(0, audioContext.currentTime + note.start);
                gainNode.gain.linearRampToValueAtTime(0.7, audioContext.currentTime + note.start + 0.05);
                gainNode.gain.setValueAtTime(0.7, audioContext.currentTime + note.start + note.duration - 0.15);
                gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + note.start + note.duration);
                
                oscillator.start(audioContext.currentTime + note.start);
                oscillator.stop(audioContext.currentTime + note.start + note.duration);
            });

            console.log('🔊 ElxaOS shutdown sound played');
            
        } catch (error) {
            console.warn('⚠️ Could not play shutdown sound:', error);
        }
    }

    // Show ElxaOS-styled confirmation dialog
    showShutdownConfirmation() {
        return new Promise((resolve) => {
            // Create custom dialog
            const elxaShutdownDialog = document.createElement('div');
            elxaShutdownDialog.className = 'elxa-shutdown-dialog-overlay';
            elxaShutdownDialog.innerHTML = `
                <div class="elxa-shutdown-dialog">
                    <div class="elxa-shutdown-dialog-header">
                        <span class="elxa-shutdown-dialog-icon">⚡</span>
                        <span class="elxa-shutdown-dialog-title">Shut Down ElxaOS</span>
                    </div>
                    <div class="elxa-shutdown-dialog-content">
                        <p>Are you sure you want to shut down your computer?</p>
                        <p>Make sure to save any work before shutting down.</p>
                    </div>
                    <div class="elxa-shutdown-dialog-buttons">
                        <button class="elxa-shutdown-btn elxa-shutdown-btn-cancel" id="elxaShutdownCancel">
                            <span class="elxa-btn-icon">❌</span>
                            Cancel
                        </button>
                        <button class="elxa-shutdown-btn elxa-shutdown-btn-confirm" id="elxaShutdownConfirm">
                            <span class="elxa-btn-icon">🔌</span>
                            Shut Down
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(elxaShutdownDialog);

            // Handle button clicks
            document.getElementById('elxaShutdownCancel').addEventListener('click', () => {
                elxaShutdownDialog.remove();
                resolve(false);
            });

            document.getElementById('elxaShutdownConfirm').addEventListener('click', () => {
                elxaShutdownDialog.remove();
                resolve(true);
            });

            // Handle escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    elxaShutdownDialog.remove();
                    document.removeEventListener('keydown', handleEscape);
                    resolve(false);
                }
            };
            document.addEventListener('keydown', handleEscape);
        });
    }

    // Show shutdown screen with power off button
    showShutdownScreen() {
        // Play shutdown sound first
        this.playShutdownSound();

        // Create shutdown screen
        const elxaShutdownScreen = document.createElement('div');
        elxaShutdownScreen.className = 'elxa-shutdown-screen';
        elxaShutdownScreen.innerHTML = `
            <div class="elxa-shutdown-content">
                <div class="elxa-shutdown-logo">
                    <div class="elxa-shutdown-icon">🔌</div>
                    <div class="elxa-shutdown-title">ElxaOS</div>
                </div>
                <div class="elxa-shutdown-message">
                    <p>ElxaOS is shutting down...</p>
                    <p>It's now safe to turn off your computer.</p>
                </div>
                <div class="elxa-shutdown-progress">
                    <div class="elxa-shutdown-dots">
                        <span class="elxa-dot elxa-dot-1">●</span>
                        <span class="elxa-dot elxa-dot-2">●</span>
                        <span class="elxa-dot elxa-dot-3">●</span>
                    </div>
                </div>
                <button class="elxa-power-off-btn" id="elxaPowerOffBtn">
                    <span class="elxa-power-icon">⏻</span>
                    <span class="elxa-power-text">Power Off</span>
                </button>
            </div>
        `;
        document.body.appendChild(elxaShutdownScreen);

        // Handle power off button click
        document.getElementById('elxaPowerOffBtn').addEventListener('click', () => {
            // Add clicking animation
            const btn = document.getElementById('elxaPowerOffBtn');
            btn.style.transform = 'scale(0.95)';
            btn.innerHTML = `
                <span class="elxa-power-icon">⚡</span>
                <span class="elxa-power-text">Powering Off...</span>
            `;
            
            // Brief delay then reload
            setTimeout(() => {
                location.reload();
            }, 1000);
        });
    }

    // Show logout confirmation (ElxaOS styled)
// AGGRESSIVE LOGOUT DIALOG FIX
// Replace the showLogoutConfirmation method in ShutdownManager class

showLogoutConfirmation() {
    return new Promise((resolve) => {
        console.log('🚪 Creating logout confirmation dialog...');
        
        // AGGRESSIVE CLEANUP: Remove ALL possible logout dialogs
        const allLogoutDialogs = document.querySelectorAll('.elxa-logout-dialog-overlay, #logoutConfirmationDialog, [class*="logout"]');
        allLogoutDialogs.forEach(dialog => {
            console.log('🗑️ Removing existing logout dialog:', dialog.className);
            dialog.remove();
        });

        // Create the dialog
        const dialogId = 'logoutDialog_' + Date.now(); // Unique ID to prevent conflicts
        const elxaLogoutDialog = document.createElement('div');
        elxaLogoutDialog.id = dialogId;
        elxaLogoutDialog.className = 'elxa-logout-dialog-overlay';
        elxaLogoutDialog.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(0, 0, 0, 0.5) !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            z-index: 99999 !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        `;

        elxaLogoutDialog.innerHTML = `
            <div class="elxa-logout-dialog" style="
                background: #c0c0c0 !important;
                border: 2px outset #c0c0c0 !important;
                border-radius: 4px !important;
                min-width: 320px !important;
                max-width: 400px !important;
                box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.3) !important;
            ">
                <div class="elxa-logout-dialog-header" style="
                    background: linear-gradient(to bottom, #cc7a00, #b36600) !important;
                    color: white !important;
                    padding: 8px 12px !important;
                    display: flex !important;
                    align-items: center !important;
                    font-weight: bold !important;
                    font-size: 12px !important;
                    border-radius: 2px 2px 0 0 !important;
                ">
                    <span class="elxa-logout-dialog-icon" style="margin-right: 8px; font-size: 14px;">👋</span>
                    <span class="elxa-logout-dialog-title">Log Out</span>
                </div>
                <div class="elxa-logout-dialog-content" style="
                    padding: 16px !important;
                    font-size: 11px !important;
                    line-height: 1.4 !important;
                ">
                    <p style="margin: 0 0 8px 0;">Are you sure you want to log out?</p>
                    <p style="margin: 0;">Make sure to save your work first!</p>
                </div>
                <div class="elxa-logout-dialog-buttons" style="
                    padding: 0 16px 16px 16px !important;
                    display: flex !important;
                    justify-content: flex-end !important;
                    gap: 8px !important;
                ">
                    <button class="elxa-logout-btn-cancel" style="
                        padding: 4px 12px !important;
                        font-size: 11px !important;
                        border: 1px outset #c0c0c0 !important;
                        background: #c0c0c0 !important;
                        cursor: pointer !important;
                        display: flex !important;
                        align-items: center !important;
                        gap: 4px !important;
                        min-width: 80px !important;
                        justify-content: center !important;
                    ">
                        <span style="font-size: 10px;">❌</span>
                        Cancel
                    </button>
                    <button class="elxa-logout-btn-confirm" style="
                        padding: 4px 12px !important;
                        font-size: 11px !important;
                        border: 1px outset #c0c0c0 !important;
                        background: #c0c0c0 !important;
                        cursor: pointer !important;
                        display: flex !important;
                        align-items: center !important;
                        gap: 4px !important;
                        min-width: 80px !important;
                        justify-content: center !important;
                        font-weight: bold !important;
                    ">
                        <span style="font-size: 10px;">👋</span>
                        Log Out
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(elxaLogoutDialog);
        console.log('✅ Logout dialog created with ID:', dialogId);

        // Track resolution state
        let hasResolved = false;

        // NUCLEAR CLEANUP FUNCTION
        const nuclearCleanup = () => {
            console.log('💥 NUCLEAR CLEANUP: Removing logout dialog');
            
            // Method 1: Remove by ID
            const dialogById = document.getElementById(dialogId);
            if (dialogById) {
                dialogById.remove();
                console.log('🗑️ Removed dialog by ID');
            }
            
            // Method 2: Remove by class
            const dialogsByClass = document.querySelectorAll('.elxa-logout-dialog-overlay');
            dialogsByClass.forEach((dialog, index) => {
                dialog.remove();
                console.log(`🗑️ Removed dialog by class #${index + 1}`);
            });
            
            // Method 3: Remove anything with logout in the class name
            const anyLogoutElements = document.querySelectorAll('[class*="logout"]');
            anyLogoutElements.forEach((element, index) => {
                if (element.style.position === 'fixed' && element.style.zIndex) {
                    element.remove();
                    console.log(`🗑️ Removed suspicious logout element #${index + 1}`);
                }
            });

            // Method 4: Remove high z-index overlays (just in case)
            const highZElements = document.querySelectorAll('[style*="z-index"]');
            highZElements.forEach(element => {
                const zIndex = parseInt(element.style.zIndex);
                if (zIndex > 50000 && element.className.includes('logout')) {
                    element.remove();
                    console.log('🗑️ Removed high z-index logout element');
                }
            });
        };

        // Safe resolve with nuclear cleanup
        const resolveAndDestroy = (result) => {
            if (hasResolved) {
                console.log('⚠️ Already resolved, ignoring');
                return;
            }
            
            hasResolved = true;
            console.log('🎯 Resolving logout dialog with result:', result);
            
            // Use immediate cleanup
            nuclearCleanup();
            
            // Also schedule cleanup for next tick (just in case)
            setTimeout(nuclearCleanup, 0);
            
            // And one more for good measure
            setTimeout(nuclearCleanup, 100);
            
            resolve(result);
        };

        // Button event handlers
        const cancelBtn = elxaLogoutDialog.querySelector('.elxa-logout-btn-cancel');
        const confirmBtn = elxaLogoutDialog.querySelector('.elxa-logout-btn-confirm');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('❌ User clicked Cancel');
                resolveAndDestroy(false);
            });
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('✅ User clicked Log Out');
                resolveAndDestroy(true);
            });
        }

        // Escape key handler
        const escapeHandler = (e) => {
            if (e.key === 'Escape' && !hasResolved) {
                e.preventDefault();
                console.log('⏭️ User pressed Escape');
                document.removeEventListener('keydown', escapeHandler);
                resolveAndDestroy(false);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        // Click outside handler
        elxaLogoutDialog.addEventListener('click', (e) => {
            if (e.target === elxaLogoutDialog && !hasResolved) {
                console.log('🖱️ User clicked outside dialog');
                resolveAndDestroy(false);
            }
        });

        // Emergency timeout
        setTimeout(() => {
            if (!hasResolved) {
                console.warn('⏰ Emergency timeout: Force closing logout dialog');
                resolveAndDestroy(false);
            }
        }, 15000);

        console.log('🎬 Logout dialog setup complete');
    });
}
}