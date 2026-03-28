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
                e.stopImmediatePropagation();
                this.showContextMenu(e, icon);
                return false;
            }
        });

        // Context menu hiding with specific targeting
        document.addEventListener('click', (e) => {
            const isEmailInterface = e.target.closest('#emailInterface, .elxamail-container, .elxamail-context-menu');
            const isBrowserInterface = e.target.closest('.browser-window, .browser-page');
            
            if (!isEmailInterface && !isBrowserInterface) {
                this.hideContextMenu();
            }
        });

        // Desktop context menu - only for actual desktop areas
        document.addEventListener('contextmenu', (e) => {
            const isDesktopArea = e.target.id === 'desktop' || e.target.id === 'wallpaper' || 
                                  e.target.closest('#desktop') && !e.target.closest('.desktop-icon');
            const isInApp = e.target.closest('#emailInterface, .elxamail-container, .browser-window, .window-content');
            
            if (isDesktopArea && !isInApp) {
                e.preventDefault();
            }
        });

        // Clear selection when clicking desktop
        document.getElementById('desktop').addEventListener('click', (e) => {
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
        const iconId = icon.dataset.file || icon.dataset.program || 'unknown';
        
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

    applyIconPositions() {
        const icons = document.querySelectorAll('.desktop-icon');
        icons.forEach(icon => {
            const iconId = icon.dataset.file || icon.dataset.program || 'unknown';
            const savedPosition = this.iconPositions.get(iconId);
            
            if (savedPosition) {
                icon.style.position = 'absolute';
                icon.style.left = savedPosition.left + 'px';
                icon.style.top = savedPosition.top + 'px';
            }
        });
    }

    saveIconPositions() {
        try {
            const positionsArray = Array.from(this.iconPositions.entries());
            localStorage.setItem('elxaOS-icon-positions', JSON.stringify(positionsArray));
            console.log('💾 Icon positions saved');
        } catch (error) {
            console.error('❌ Failed to save icon positions:', error);
        }
    }

    loadIconPositions() {
        try {
            const saved = localStorage.getItem('elxaOS-icon-positions');
            if (saved) {
                const positionsArray = JSON.parse(saved);
                this.iconPositions = new Map(positionsArray);
                console.log('📍 Icon positions loaded');
                
                setTimeout(() => {
                    this.applyIconPositions();
                }, 100);
            }
        } catch (error) {
            console.error('❌ Failed to load icon positions:', error);
        }
    }

    findFreePosition() {
        const container = document.getElementById('desktopIcons');
        if (!container) return { left: 8, top: 8 };

        const containerRect = container.getBoundingClientRect();
        const cellW = 80; // icon width + gap
        const cellH = 80; // icon height + gap
        const cols = Math.floor(containerRect.width / cellW) || 1;
        const rows = Math.floor(containerRect.height / cellH) || 10;

        // Build a set of occupied grid cells
        const occupied = new Set();
        this.iconPositions.forEach((pos) => {
            const col = Math.round(pos.left / cellW);
            const row = Math.round(pos.top / cellH);
            occupied.add(`${col},${row}`);
        });

        // Also check icons currently in the DOM without saved positions
        container.querySelectorAll('.desktop-icon').forEach(icon => {
            const rect = icon.getBoundingClientRect();
            const relLeft = rect.left - containerRect.left;
            const relTop = rect.top - containerRect.top;
            const col = Math.round(relLeft / cellW);
            const row = Math.round(relTop / cellH);
            occupied.add(`${col},${row}`);
        });

        // Find first free cell (scan columns top-to-bottom, then left-to-right)
        for (let col = 0; col < cols; col++) {
            for (let row = 0; row < rows; row++) {
                if (!occupied.has(`${col},${row}`)) {
                    return { left: col * cellW + 8, top: row * cellH + 8 };
                }
            }
        }

        // Fallback: just go past the last row
        return { left: 8, top: rows * cellH + 8 };
    }

    resetIconPositions() {
        this.iconPositions.clear();
        localStorage.removeItem('elxaOS-icon-positions');
        
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
                
                const program = this.selectedIcon.dataset.program;
                
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
            const folderName = this.selectedIcon.dataset.file;
            console.log('Opening folder:', folderName);
            
            elxaOS.eventBus.emit('program.launch', { 
                program: 'fileManager', 
                args: ['root', 'Desktop', folderName]
            });
        } else {
            const launchArgs = this.selectedIcon && this.selectedIcon.dataset.launchargs;
            elxaOS.eventBus.emit('program.launch', { program: programId, args: launchArgs || null });
        }
    }

    showContextMenu(e, icon) {
        this.hideContextMenu();
        
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.id = 'desktop-context-menu';
        
        const isInstalled = icon.dataset.installed === 'true';
        const isFile = icon.dataset.filepath;
        
        if (isInstalled) {
            menu.innerHTML = `
                <div class="context-item" data-action="open">
                    ${ElxaIcons.renderAction('launch')} Open
                </div>
                <div class="context-separator"></div>
                <div class="context-item" data-action="uninstall">
                    ${ElxaIcons.renderAction('uninstall')} Uninstall
                </div>
            `;
        } else if (isFile) {
            const fileName = JSON.parse(icon.dataset.filepath)[2];
            if (fileName.endsWith('.abby')) {
                menu.innerHTML = `
                    <div class="context-item" data-action="install">
                        ${ElxaIcons.renderAction('install')} Install
                    </div>
                    <div class="context-separator"></div>
                    <div class="context-item" data-action="delete">
                        ${ElxaIcons.renderAction('delete')} Delete
                    </div>
                `;
            } else {
                menu.innerHTML = `
                    <div class="context-item" data-action="open">
                        ${ElxaIcons.renderAction('open')} Open
                    </div>
                    <div class="context-separator"></div>
                    <div class="context-item" data-action="delete">
                        ${ElxaIcons.renderAction('delete')} Delete
                    </div>
                `;
            }
        } else {
            menu.innerHTML = `
                <div class="context-item" data-action="open">
                    ${ElxaIcons.renderAction('open')} Open
                </div>
                <div class="context-separator"></div>
                <div class="context-item" data-action="reset-positions">
                    ${ElxaIcons.renderAction('restore')} Reset Icon Layout
                </div>
            `;
        }
        
        menu.style.left = e.pageX + 'px';
        menu.style.top = e.pageY + 'px';
        
        menu.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = e.target.closest('.context-item');
            if (item) {
                this.handleContextAction(item.dataset.action, icon);
                this.hideContextMenu();
            }
        });

        menu.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        
        document.body.appendChild(menu);
        
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
                    
                    ElxaUI.showConfirmDialog({
                        title: `${ElxaIcons.renderAction('delete')} Confirm Delete`,
                        message: `Delete "${fileName}"?`,
                        confirmText: 'Delete',
                        cancelText: 'Cancel',
                        confirmIcon: ElxaIcons.renderAction('delete'),
                        cancelIcon: ElxaIcons.renderAction('close'),
                        confirmClass: 'elxa-dialog-btn-danger'
                    }).then(confirmed => {
                        if (confirmed) {
                            elxaOS.fileSystem.deleteItem(folderPath, fileName);
                            elxaOS.refreshDesktop();
                        }
                    });
                }
                break;
                
            case 'reset-positions':
                ElxaUI.showConfirmDialog({
                    title: `${ElxaIcons.renderAction('restore')} Reset Positions`,
                    message: 'Reset all desktop icons to default positions?',
                    confirmText: 'Reset',
                    cancelText: 'Cancel',
                    confirmIcon: ElxaIcons.renderAction('restore')
                }).then(confirmed => {
                    if (confirmed) {
                        this.resetIconPositions();
                    }
                });
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
