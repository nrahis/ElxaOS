// =================================
// TASKBAR MANAGEMENT  
// =================================
class Taskbar {
    constructor() {
        this.startMenuOpen = false;
        this.overflowMenuOpen = false;
        this._checkingOverflow = false; // re-entrancy guard
        this._activeSubmenu = null;     // currently visible submenu element
        this._hoverTimeout = null;
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
            // Don't close if clicking inside a submenu
            if (this._activeSubmenu && this._activeSubmenu.contains(e.target)) return;

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

        buttons.forEach(btn => {
            btn.style.display = '';
            btn.dataset.overflowHidden = '';
        });
        overflowBtn.style.display = 'none';

        const taskbarWidth = taskbar.offsetWidth;
        const startWidth = startBtn ? startBtn.offsetWidth + 6 : 0;
        const qlWidth = quickLaunch ? quickLaunch.offsetWidth + 4 : 0;
        const trayWidth = systemTray ? systemTray.offsetWidth : 0;
        const overflowBtnWidth = 26;
        const extraPadding = 12;

        const availableForButtons = taskbarWidth - startWidth - qlWidth - trayWidth - extraPadding;

        const BUTTON_WIDTH = 110;
        const GAP = 2;
        const totalNeeded = (buttons.length * BUTTON_WIDTH) + ((buttons.length - 1) * GAP);

        if (totalNeeded <= availableForButtons) {
            return;
        }

        overflowBtn.style.display = 'flex';
        const adjustedAvailable = availableForButtons - overflowBtnWidth;
        const maxVisible = Math.max(1, Math.floor(adjustedAvailable / (BUTTON_WIDTH + GAP)));

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
                btn.style.display = '';
                btn.click();
                this.hideOverflowMenu();
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
    // Start Menu — Dynamic Builder
    // =========================================================
    toggleStartMenu() {
        if (this.startMenuOpen) {
            this.hideStartMenu();
        } else {
            this.showStartMenu();
        }
    }

    showStartMenu() {
        const menu = document.getElementById('startMenu');
        menu.innerHTML = this._buildStartMenuHTML();
        menu.style.display = 'flex';
        this.startMenuOpen = true;
        this._bindStartMenuEvents(menu);
    }

    hideStartMenu() {
        const menu = document.getElementById('startMenu');
        menu.style.display = 'none';
        this.startMenuOpen = false;
        this._hideActiveSubmenu();
    }

    // =========================================================
    // Start Menu — HTML Generation
    // =========================================================
    _buildStartMenuHTML() {
        let html = '';

        html += '<div class="start-menu-header">ElxaOS</div>';
        html += '<div class="start-menu-items">';

        // --- Top-level pinned items ---
        html += this._menuItem('computer', 'mdi-monitor', 'My Computer');
        html += this._menuItemBrowser('browser', 'mdi-web', 'Snoogle Browser');
        html += this._menuItem('messenger', 'mdi-chat', 'Messenger');
        html += this._menuItemSite('elxamail.ex', 'mdi-email', 'ElxaMail');
        html += this._menuItemSite('fsb.ex', 'mdi-bank', 'First Snakesian Bank');
        html += this._menuItemSite('snakesian-cards.ex', 'mdi-cards-outline', 'Card Exchange');
        html += this._menuItemSite('snake-e.corp.ex/portal', 'mdi-badge-account', 'Employee Portal');

        html += '<div class="start-menu-separator"></div>';

        // --- Submenus ---
        html += this._submenuTrigger('programs', 'mdi-application', 'Programs');
        html += this._submenuTrigger('games', 'mdi-gamepad-variant', 'Games');
        html += this._submenuTrigger('utilities', 'mdi-wrench', 'Utilities');
        html += this._submenuTrigger('system', 'mdi-cog', 'System');

        html += '<div class="start-menu-separator"></div>';

        // --- System tray shortcut ---
        html += this._menuItem('antivirus', 'mdi-shield-check', 'ElxaGuard');

        html += '<div class="start-menu-separator"></div>';

        // --- Log Off / Shut Down ---
        html += this._menuAction('logout', 'mdi-logout', 'Log Off');
        html += this._menuAction('shutdown', 'mdi-power', 'Shut Down');

        html += '</div>';
        return html;
    }

    _menuItem(program, icon, label) {
        return `<div class="start-menu-item" data-program="${program}"><span class="mdi ${icon} elxa-icon-ui"></span> ${label}</div>`;
    }

    _menuItemBrowser(program, icon, label) {
        // For programs that are actual registered programs (like 'browser')
        return `<div class="start-menu-item" data-program="${program}"><span class="mdi ${icon} elxa-icon-ui"></span> ${label}</div>`;
    }

    _menuItemSite(url, icon, label) {
        return `<div class="start-menu-item" data-browser-url="${url}"><span class="mdi ${icon} elxa-icon-ui"></span> ${label}</div>`;
    }

    _menuAction(action, icon, label) {
        return `<div class="start-menu-item" data-action="${action}"><span class="mdi ${icon} elxa-icon-ui"></span> ${label}</div>`;
    }

    _submenuTrigger(submenuId, icon, label) {
        return `<div class="start-menu-item start-menu-submenu-trigger" data-submenu="${submenuId}"><span class="mdi ${icon} elxa-icon-ui"></span> ${label}<span class="mdi mdi-chevron-right start-menu-arrow"></span></div>`;
    }

    // =========================================================
    // Submenu Content Definitions
    // =========================================================
    _getSubmenuItems(submenuId) {
        switch (submenuId) {
            case 'programs':
                return [
                    { program: 'elxabooks', icon: 'mdi-cash-register', label: 'ElxaBooks Pro' },
                    { program: 'elxasheets', icon: 'mdi-table', label: 'ElxaSheets' },
                    { program: 'elxacode', icon: 'mdi-code-tags', label: 'ElxaCode' },
                    { program: 'notepad', icon: 'mdi-note-edit', label: 'Notepad' },
                ];

            case 'games':
                return this._getGameSubmenuItems();

            case 'utilities':
                return [
                    { program: 'calculator', icon: 'mdi-calculator', label: 'Calculator' },
                    { program: 'paint', icon: 'mdi-palette', label: 'Paint' },
                    { program: 'duck-console', icon: 'mdi-console', label: 'DUCK Console' },
                    { program: 'viruslab', icon: 'mdi-virus', label: 'Virus Lab' },
                ];

            case 'system':
                return [
                    { program: 'help', icon: 'mdi-help-circle', label: 'Help' },
                    { separator: true },
                    { action: 'personalize', icon: 'mdi-palette', label: 'Personalize' },
                    { action: 'userSettings', icon: 'mdi-account', label: 'User Settings' },
                ];

            default:
                return [];
        }
    }

    _getGameSubmenuItems() {
        const items = [];

        // Pull installed games from installerService
        if (elxaOS.installerService && elxaOS.installerService.installedPrograms) {
            const installed = elxaOS.installerService.installedPrograms;
            if (installed instanceof Map) {
                installed.forEach((info, programId) => {
                    items.push({
                        program: programId,
                        icon: 'mdi-gamepad-variant',
                        label: info.name || programId
                    });
                });
            } else if (typeof installed === 'object') {
                for (const [programId, info] of Object.entries(installed)) {
                    items.push({
                        program: programId,
                        icon: 'mdi-gamepad-variant',
                        label: info.name || programId
                    });
                }
            }
        }

        // Show hint if no games installed
        if (items.length === 0) {
            items.push({ label: 'No games installed', disabled: true, icon: 'mdi-information-outline' });
        }

        // Separator + Sssteam Store link at bottom
        items.push({ separator: true });
        items.push({
            browserUrl: 'sssteam.ex',
            icon: 'mdi-store',
            label: 'Sssteam Store'
        });

        return items;
    }

    // =========================================================
    // Submenu Display
    // =========================================================
    _showSubmenu(triggerEl, submenuId) {
        this._hideActiveSubmenu();

        const items = this._getSubmenuItems(submenuId);
        if (!items.length) return;

        const submenu = document.createElement('div');
        submenu.className = 'start-menu-submenu';
        submenu.dataset.submenuId = submenuId;

        items.forEach(item => {
            if (item.separator) {
                const sep = document.createElement('div');
                sep.className = 'start-menu-separator';
                submenu.appendChild(sep);
                return;
            }

            const div = document.createElement('div');
            div.className = 'start-menu-item';
            if (item.disabled) div.classList.add('start-menu-item-disabled');
            if (item.program) div.dataset.program = item.program;
            if (item.browserUrl) div.dataset.browserUrl = item.browserUrl;
            if (item.action) div.dataset.action = item.action;
            div.innerHTML = `<span class="mdi ${item.icon} elxa-icon-ui"></span> ${item.label}`;
            submenu.appendChild(div);
        });

        // Position: flush right edge of start menu, aligned to trigger item
        const menuRect = document.getElementById('startMenu').getBoundingClientRect();
        const triggerRect = triggerEl.getBoundingClientRect();

        submenu.style.position = 'fixed';
        submenu.style.left = menuRect.right + 'px';
        submenu.style.bottom = (window.innerHeight - triggerRect.bottom) + 'px';

        document.body.appendChild(submenu);
        this._activeSubmenu = submenu;

        // Click events on submenu items
        submenu.addEventListener('click', (e) => {
            const clickedItem = e.target.closest('.start-menu-item');
            if (!clickedItem || clickedItem.classList.contains('start-menu-item-disabled')) return;
            this._handleMenuItemClick(clickedItem);
        });

        // Clamp to viewport if it extends above screen
        requestAnimationFrame(() => {
            const subRect = submenu.getBoundingClientRect();
            if (subRect.top < 0) {
                submenu.style.bottom = 'auto';
                submenu.style.top = '0px';
            }
        });
    }

    _hideActiveSubmenu() {
        if (this._activeSubmenu) {
            this._activeSubmenu.remove();
            this._activeSubmenu = null;
        }
        // Clear active highlight on triggers
        const menu = document.getElementById('startMenu');
        if (menu) {
            menu.querySelectorAll('.start-menu-submenu-trigger').forEach(t => t.classList.remove('submenu-active'));
        }
    }

    // =========================================================
    // Start Menu — Event Binding
    // =========================================================
    _bindStartMenuEvents(menu) {
        // Click handler for all items
        menu.addEventListener('click', (e) => {
            const item = e.target.closest('.start-menu-item');
            if (!item) return;

            // Submenu triggers open on hover, but also on click for accessibility
            if (item.classList.contains('start-menu-submenu-trigger')) {
                this._showSubmenu(item, item.dataset.submenu);
                return;
            }
            if (item.classList.contains('start-menu-item-disabled')) return;

            this._handleMenuItemClick(item);
        });

        // Hover handler for submenu triggers
        menu.addEventListener('mouseover', (e) => {
            const item = e.target.closest('.start-menu-item');
            if (!item) return;

            clearTimeout(this._hoverTimeout);

            if (item.classList.contains('start-menu-submenu-trigger')) {
                this._hoverTimeout = setTimeout(() => {
                    this._showSubmenu(item, item.dataset.submenu);
                    menu.querySelectorAll('.start-menu-submenu-trigger').forEach(t => t.classList.remove('submenu-active'));
                    item.classList.add('submenu-active');
                }, 100);
            } else {
                // Hovering a non-submenu item — hide submenu after brief delay
                this._hoverTimeout = setTimeout(() => {
                    this._hideActiveSubmenu();
                }, 250);
            }
        });

        // Keep submenu alive when hovering over it
        document.addEventListener('mouseover', (e) => {
            if (this._activeSubmenu && this._activeSubmenu.contains(e.target)) {
                clearTimeout(this._hoverTimeout);
            }
        });
    }

    _handleMenuItemClick(item) {
        if (item.dataset.program) {
            elxaOS.eventBus.emit('program.launch', { program: item.dataset.program });
        } else if (item.dataset.browserUrl) {
            elxaOS.eventBus.emit('program.launch', { program: 'browser', args: item.dataset.browserUrl });
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
}