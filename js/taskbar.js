// =================================
// TASKBAR MANAGEMENT  
// =================================
class Taskbar {
    constructor() {
        this.startMenuOpen = false;
        this.overflowMenuOpen = false;
        this._checkingOverflow = false; // re-entrancy guard
        this.setupEvents();
        this.setupOverflowDetection();
    }

    setupEvents() {
        // Start button
        document.getElementById('startButton').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleStartMenu();
        });

        // Quick-launch: File Explorer
        const explorerBtn = document.getElementById('quickLaunchExplorer');
        if (explorerBtn) {
            explorerBtn.addEventListener('click', () => {
                elxaOS.eventBus.emit('program.launch', { program: 'computer' });
            });
        }

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

        // Overflow button
        const overflowBtn = document.getElementById('taskbarOverflowBtn');
        if (overflowBtn) {
            overflowBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleOverflowMenu();
            });
        }

        // Close start menu and overflow when clicking elsewhere
        document.addEventListener('click', (e) => {
            this.hideStartMenu();
            const overflowMenu = document.getElementById('taskbarOverflowMenu');
            const overflowBtn = document.getElementById('taskbarOverflowBtn');
            if (overflowMenu && !overflowMenu.contains(e.target) && e.target !== overflowBtn) {
                this.hideOverflowMenu();
            }
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

        document.getElementById('clock').addEventListener('click', () => {
            elxaOS.eventBus.emit('clock.click');
        });
    }

    // =========================================================
    // Overflow Detection
    // =========================================================
    setupOverflowDetection() {
        const programsContainer = document.getElementById('taskbarPrograms');
        if (!programsContainer) return;

        this._overflowObserver = new MutationObserver(() => {
            requestAnimationFrame(() => this.checkOverflow());
        });
        this._overflowObserver.observe(programsContainer, { childList: true });

        window.addEventListener('resize', () => this.checkOverflow());
    }

    checkOverflow() {
        // Prevent re-entrancy — hiding buttons can trigger MutationObserver
        if (this._checkingOverflow) return;
        this._checkingOverflow = true;

        try {
            this._doCheckOverflow();
        } finally {
            this._checkingOverflow = false;
        }
    }

    _doCheckOverflow() {
        const taskbar = document.querySelector('.taskbar');
        const container = document.getElementById('taskbarPrograms');
        const overflowBtn = document.getElementById('taskbarOverflowBtn');
        const startBtn = document.getElementById('startButton');
        const quickLaunch = document.getElementById('quickLaunch');
        const systemTray = document.querySelector('.system-tray');
        if (!taskbar || !container || !overflowBtn) return;

        const buttons = Array.from(container.querySelectorAll('.taskbar-program'));
        if (buttons.length === 0) {
            overflowBtn.style.display = 'none';
            return;
        }

        // Step 1: Reset — show all buttons, hide overflow btn
        buttons.forEach(btn => {
            btn.style.display = '';
            btn.dataset.overflowHidden = '';
        });
        overflowBtn.style.display = 'none';

        // Step 2: Calculate available space from the taskbar layout
        const taskbarWidth = taskbar.offsetWidth;
        const startWidth = startBtn ? startBtn.offsetWidth + 6 : 0;    // +margin
        const qlWidth = quickLaunch ? quickLaunch.offsetWidth + 4 : 0;  // +margin
        const trayWidth = systemTray ? systemTray.offsetWidth : 0;
        const overflowBtnWidth = 26; // 20px + borders/margin
        const extraPadding = 12;

        const availableForButtons = taskbarWidth - startWidth - qlWidth - trayWidth - extraPadding;

        // Step 3: Estimate each button's natural width
        // Each button: 8px padding each side + 2px border + text width
        // CSS max-width is 150px. We use a fixed estimate per button.
        const BUTTON_WIDTH = 110; // average for titles like "💻 My Computer"
        const GAP = 2;
        const totalNeeded = (buttons.length * BUTTON_WIDTH) + ((buttons.length - 1) * GAP);

        if (totalNeeded <= availableForButtons) {
            return; // Everything fits
        }

        // Step 4: Show overflow button, calculate how many fit
        overflowBtn.style.display = 'flex';
        const adjustedAvailable = availableForButtons - overflowBtnWidth;

        const maxVisible = Math.max(1, Math.floor(adjustedAvailable / (BUTTON_WIDTH + GAP)));

        // Step 5: Hide buttons beyond the limit using inline style
        for (let i = maxVisible; i < buttons.length; i++) {
            buttons[i].style.display = 'none';
            buttons[i].dataset.overflowHidden = 'true';
        }

        console.log(`📌 Taskbar overflow: ${maxVisible} visible, ${buttons.length - maxVisible} hidden`);
    }

    // =========================================================
    // Overflow Menu
    // =========================================================
    toggleOverflowMenu() {
        if (this.overflowMenuOpen) {
            this.hideOverflowMenu();
        } else {
            this.showOverflowMenu();
        }
    }

    showOverflowMenu() {
        this.hideOverflowMenu();

        // Find hidden buttons using the data attribute
        const hiddenButtons = Array.from(
            document.querySelectorAll('.taskbar-program[data-overflow-hidden="true"]')
        );
        if (hiddenButtons.length === 0) return;

        const overflowBtn = document.getElementById('taskbarOverflowBtn');
        const menu = document.createElement('div');
        menu.id = 'taskbarOverflowMenu';
        menu.className = 'taskbar-overflow-menu';

        const btnRect = overflowBtn.getBoundingClientRect();
        menu.style.cssText = `
            position: fixed;
            bottom: ${window.innerHeight - btnRect.top + 2}px;
            right: ${window.innerWidth - btnRect.right}px;
            background: #c0c0c0;
            border: 2px outset #ffffff;
            padding: 2px;
            z-index: 2000;
            min-width: 160px;
            max-width: 250px;
            font-size: 11px;
            font-family: 'MS Sans Serif', 'Segoe UI', Tahoma, sans-serif;
        `;

        hiddenButtons.forEach(btn => {
            const row = document.createElement('div');
            row.className = 'taskbar-overflow-item';
            row.innerHTML = btn.innerHTML;
            row.style.cssText = `
                padding: 4px 8px;
                cursor: pointer;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            `;

            if (btn.classList.contains('active')) {
                row.style.fontWeight = 'bold';
            }

            row.addEventListener('mouseenter', () => {
                row.style.background = '#000080';
                row.style.color = '#ffffff';
            });
            row.addEventListener('mouseleave', () => {
                row.style.background = '';
                row.style.color = '';
            });
            row.addEventListener('click', () => {
                // Temporarily show the button so .click() works for focus/minimize
                btn.style.display = '';
                btn.click();
                this.hideOverflowMenu();
                // Re-run overflow check to re-hide if needed
                requestAnimationFrame(() => this.checkOverflow());
            });

            menu.appendChild(row);
        });

        document.body.appendChild(menu);
        this.overflowMenuOpen = true;
    }

    hideOverflowMenu() {
        const menu = document.getElementById('taskbarOverflowMenu');
        if (menu) menu.remove();
        this.overflowMenuOpen = false;
    }

    // =========================================================
    // Start Menu
    // =========================================================
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
