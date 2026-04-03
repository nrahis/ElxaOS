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
        this.registry = new ElxaRegistry(this.eventBus);
        this.financeService = new FinanceService(this.eventBus, this.registry);
        this.inventoryService = new InventoryService(this.eventBus, this.registry);
        this.stockService = new StockService(this.eventBus, this.registry, this.financeService, this.inventoryService);
        this.notificationService = new NotificationService(this.eventBus, this.registry);
        this.financeNotificationService = new FinanceNotificationService(this.eventBus);
        this.employmentService = new EmploymentService(this.eventBus, this.registry);
        this.installerService = new InstallerService(this.eventBus, this.fileSystem, this.windowManager, this, this.registry);
        this.adService = AdService;
        AdService.init(this.eventBus);
        this.bondService = new BondService(this.eventBus, this.registry);
        this.bootSystem = new BootSystem();
        this.updatePopup = new UpdatePopup();

        // Initialize virus system BEFORE programs that might need it
        this.virusSystem = new VirusSystem(this.eventBus);
        
        // Initialize programs
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
            antivirus: new AntivirusProgram(this.windowManager, this.fileSystem, this.eventBus),
            viruslab: new VirusLabProgram(this.windowManager, this.fileSystem, this.eventBus),
            elxasheets: new ElxaSheetsProgram(this.windowManager, this.fileSystem, this.eventBus)
        };

        // Initialize installed programs storage
        this.installedPrograms = {};

        // Build program registry for launch routing
        this.buildProgramRegistry();

        // Initialize System 0 AFTER everything else is set up
        this.system0 = new System0(this.eventBus);
        console.log('🔴 System 0 initialized and listening for commands...');
        
        this.setupEventHandlers();

        // Kick off async initialization (DB open → filesystem load → boot)
        this.asyncInit();
    }

    async asyncInit() {
        try {
            // 1. Open IndexedDB
            await elxaDB.open();

            // 2. Initialize the central registry (loads world context)
            await this.registry.init();

            // 2.5. Load login service data from IndexedDB
            await this.loginService.init();

            // 2.6. Initialize finance service (loads/migrates financial data)
            await this.financeService.init();

            // 2.65. Initialize employment service (processes missed paychecks)
            await this.employmentService.init();

            // 2.7. Initialize inventory service (loads ownership data)
            await this.inventoryService.init();

            // 2.73. Initialize stock service (loads stock data, processes elapsed months)
            await this.stockService.init();

            // 2.75. Initialize context builder (reads world context + user state)
            if (window.ContextBuilderService) {
                this.contextBuilder = new ContextBuilderService();
                await this.contextBuilder.init();
            }

            // 2.77. Initialize bond service (relationship tracking + gift preferences)
            await this.bondService.init();

            // 2.8. Initialize notification service (loads notification data)
            await this.notificationService.init();

            // 2.9. Initialize finance notification service (event→email/notification bridge)
            this.financeNotificationService.init();

            // 3. Connect conversation history manager to registry
            if (window.conversationHistoryManager) {
                await window.conversationHistoryManager.init();
            }

            // 4. Load filesystem from IndexedDB (or migrate from localStorage)
            await this.fileSystem.loadFromStorage();

            // 5. Now that the filesystem is ready, proceed with normal init
            this.initialize();
        } catch (error) {
            console.error('❌ Failed to initialize ElxaOS storage:', error);
            // Proceed anyway with in-memory defaults so the OS still boots
            this.initialize();
        }
    }

    setupEventHandlers() {
        // Program launch handler
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

    buildProgramRegistry() {
        // Registry maps program IDs to launch functions.
        // To add a new program, just add one line here.
        this.programRegistry = {
            'notepad':      (args) => this.programs.notepad.launch(),
            'paint':        (args) => this.programs.paint.launch(),
            'calculator':   (args) => this.programs.calculator.launch(),
            'elxacode':     (args) => this.programs.elxacode.launch(),
            'elxabooks':    (args) => this.programs.elxabooks.launch(),
            'browser':      (args) => this.programs.browser.launch(args),
            'messenger':    (args) => this.programs.messenger.launch(),
            'duck-console': (args) => this.programs.duckConsole.launch(),
            'antivirus':    (args) => this.programs.antivirus.launch(),
            'elxaguard':    (args) => this.programs.antivirus.launch(),
            'viruslab':     (args) => this.programs.viruslab.launch(),
            'computer':     (args) => this.programs.fileManager.launch(['root']),
            'recycle-bin':  (args) => this.programs.fileManager.launch(['root', 'RecycleBin']),
            'fileManager':  (args) => this.programs.fileManager.launch(args || ['root']),
            'folder':       (args) => this.programs.fileManager.launch(args || ['root']),
            'snakesian-cards': () => this.programs.browser.launch('snakesian-cards.ex'),
        'elxasheets':   (args) => this.programs.elxasheets.launch(args),
        };
    }

    // Register an installed program (called by InstallerService)
    registerProgram(id, launchFn) {
        this.programRegistry[id] = launchFn;
    }

    launchProgram(programId, args = null) {
        console.log('Launching program:', programId, 'with args:', args);

        // Check registry first (covers built-in + installed programs)
        const launcher = this.programRegistry[programId];
        if (launcher) {
            launcher(args);
            return;
        }

        // Fallback for legacy installed_ prefix programs
        if (programId && programId.startsWith('installed_')) {
            const programInfo = this.installedPrograms[programId];
            if (programInfo) {
                const game = new SimpleGame(this.windowManager, programInfo.gameData);
                game.launch(programInfo);
                return;
            }
        }

        console.warn('Unknown program:', programId);
    }

    async shutdown() {
        console.log('🔌 Initiating ElxaOS shutdown...');
        
        // Initialize shutdown manager if not exists
        if (!this.shutdownManager) {
            this.shutdownManager = new ShutdownManager();
        }
        
        // Show custom confirmation dialog
        const confirmed = await this.shutdownManager.showShutdownConfirmation();
        
        if (confirmed) {
            console.log('🔌 Shutdown confirmed, proceeding...');
            
            // Flush pending conversation & registry data before shutdown
            if (window.conversationHistoryManager) window.conversationHistoryManager._flushSave();
            if (this.registry) await this.registry.forceSave();
            
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
        console.log('ElxaOS initialized successfully!');

        // Create default folders (skip any that already exist)
        for (const folder of ELXAOS_DEFAULT_FOLDERS) {
            const contents = this.fileSystem.listContents(folder.path);
            if (!contents.some(item => item.name === folder.name)) {
                this.fileSystem.createFolder(folder.path, folder.name);
            }
        }

        // Create default files (skip any that already exist)
        for (const file of ELXAOS_DEFAULT_FILES) {
            const contents = this.fileSystem.listContents(file.path);
            if (!contents.some(item => item.name === file.name)) {
                this.fileSystem.createFile(file.path, file.name, file.content);
            }
        }
        
        // Sync desktop icons
        if (this.programs.fileManager) {
            this.programs.fileManager.syncDesktopFiles();
        }

        // Load installed programs after everything is set up
        this.installerService.init();
        
        // Start boot sequence
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
var elxaOS;
document.addEventListener('DOMContentLoaded', () => {
    elxaOS = new ElxaOS();
});
