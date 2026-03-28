// =================================
// FILE MANAGER PROGRAM
// =================================
class FileManagerProgram {
    constructor(windowManager, fileSystem, eventBus) {
        this.windowManager = windowManager;
        this.fileSystem = fileSystem;
        this.eventBus = eventBus;

        // Shared clipboard (copy in one window, paste in another)
        this.clipboard = null;

        // Per-window state: windowId → { currentPath, selectedItems, viewMode, navHistory, navIndex }
        this.windowStates = new Map();
    }

    // =========================================================
    // Per-window state helpers
    // =========================================================
    _createWindowState(startPath) {
        return {
            currentPath: [...startPath],
            selectedItems: new Set(),
            viewMode: 'icons',
            navHistory: [[ ...startPath ]],
            navIndex: 0
        };
    }

    _getState(windowId) {
        return this.windowStates.get(windowId);
    }

    // Push a new path onto the navigation history (called on every folder navigation)
    _pushNav(state, path) {
        // Trim any forward history when navigating to a new place
        state.navHistory = state.navHistory.slice(0, state.navIndex + 1);
        state.navHistory.push([...path]);
        state.navIndex = state.navHistory.length - 1;
    }

    // =========================================================
    // Launch
    // =========================================================
    launch(startPath = ['root']) {
        const windowId = `file-manager-${Date.now()}`;
        const state = this._createWindowState(startPath);
        this.windowStates.set(windowId, state);

        const windowContent = this.createFileManagerInterface(windowId);

        this.windowManager.createWindow(
            windowId,
            `${ElxaIcons.render('fileManager', 'ui')} ${this.getPathString(state)}`,
            windowContent,
            { width: '600px', height: '450px', x: '100px', y: '100px' }
        );

        this.setupEventHandlers(windowId);
        this.refreshView(windowId);

        return windowId;
    }

    // =========================================================
    // UI Template
    // =========================================================
    createFileManagerInterface(windowId) {
        return `
            <div class="file-manager-container" data-window-id="${windowId}">
                <!-- Toolbar -->
                <div class="file-manager-toolbar">
                    <div class="navigation-controls">
                        <button class="nav-btn back-btn" title="Back" disabled>${ElxaIcons.renderAction('back')}</button>
                        <button class="nav-btn forward-btn" title="Forward" disabled>${ElxaIcons.renderAction('forward')}</button>
                        <button class="nav-btn up-btn" title="Up">${ElxaIcons.renderAction('up')}</button>
                        <button class="nav-btn refresh-btn" title="Refresh">${ElxaIcons.renderAction('refresh')}</button>
                    </div>

                    <div class="path-bar">
                        <div class="breadcrumb-path"></div>
                    </div>

                    <div class="view-controls">
                        <button class="view-btn icons-view active" data-view="icons" title="Icon View">${ElxaIcons.renderAction('view-grid')}</button>
                        <button class="view-btn list-view" data-view="list" title="List View">${ElxaIcons.renderAction('view-list')}</button>
                    </div>
                </div>

                <!-- File/Folder Operations Bar -->
                <div class="operations-bar">
                    <button class="op-btn new-folder-btn">${ElxaIcons.renderAction('new-folder')} New Folder</button>
                    <button class="op-btn copy-btn" disabled>${ElxaIcons.renderAction('copy')} Copy</button>
                    <button class="op-btn cut-btn" disabled>${ElxaIcons.renderAction('cut')} Cut</button>
                    <button class="op-btn paste-btn" disabled>${ElxaIcons.renderAction('paste')} Paste</button>
                    <button class="op-btn delete-btn" disabled>${ElxaIcons.renderAction('delete')} Delete</button>
                    <button class="op-btn rename-btn" disabled>${ElxaIcons.renderAction('rename')} Rename</button>
                </div>

                <!-- Main Content Area -->
                <div class="file-manager-content">
                    <div class="file-grid" id="file-grid-${windowId}">
                        <!-- Files and folders will be populated here -->
                    </div>
                </div>

                <!-- Status Bar -->
                <div class="file-manager-status">
                    <div class="item-count">0 items</div>
                    <div class="selected-count"></div>
                    <div class="current-location"></div>
                </div>
            </div>
        `;
    }

    // =========================================================
    // Event Handlers Setup
    // =========================================================
    setupEventHandlers(windowId) {
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;

        const container = windowElement.querySelector('.file-manager-container');
        if (!container) return;

        // Navigation buttons
        container.querySelector('.back-btn').addEventListener('click', () => this.goBack(windowId));
        container.querySelector('.forward-btn').addEventListener('click', () => this.goForward(windowId));
        container.querySelector('.up-btn').addEventListener('click', () => this.goUp(windowId));
        container.querySelector('.refresh-btn').addEventListener('click', () => this.refreshView(windowId));

        // View mode buttons
        container.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setViewMode(btn.dataset.view, windowId);
            });
        });

        // Operation buttons
        container.querySelector('.new-folder-btn').addEventListener('click', () => this.createNewFolder(windowId));
        container.querySelector('.copy-btn').addEventListener('click', () => this.copySelected(windowId));
        container.querySelector('.cut-btn').addEventListener('click', () => this.cutSelected(windowId));
        container.querySelector('.paste-btn').addEventListener('click', () => this.paste(windowId));
        container.querySelector('.delete-btn').addEventListener('click', () => this.deleteSelected(windowId));
        container.querySelector('.rename-btn').addEventListener('click', () => this.renameSelected(windowId));

        // File grid interactions
        const fileGrid = container.querySelector(`#file-grid-${windowId}`);
        fileGrid.addEventListener('click', (e) => this.handleFileGridClick(e, windowId));
        fileGrid.addEventListener('dblclick', (e) => this.handleFileGridDoubleClick(e, windowId));

        // Context menu (right-click)
        fileGrid.addEventListener('contextmenu', (e) => this.showContextMenu(e, windowId));

        // Keyboard shortcuts
        container.addEventListener('keydown', (e) => this.handleKeyboard(e, windowId));

        // Make container focusable for keyboard events
        container.setAttribute('tabindex', '0');
        container.focus();

        // Clean up state when window closes
        const onWindowClosed = (data) => {
            if (data.id === windowId) {
                this.windowStates.delete(windowId);
                this.eventBus.off('window.closed', onWindowClosed);
            }
        };
        this.eventBus.on('window.closed', onWindowClosed);
    }

    // =========================================================
    // Refresh / Render
    // =========================================================
    refreshView(windowId) {
        const state = this._getState(windowId);
        if (!state) return;

        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;

        const container = windowElement.querySelector('.file-manager-container');
        if (!container) return;

        const fileGrid = container.querySelector(`#file-grid-${windowId}`);
        if (!fileGrid) return;

        // Clear selection
        state.selectedItems.clear();
        this.updateOperationButtons(windowId);

        // Get current folder contents
        const contents = this.fileSystem.listContents(state.currentPath);

        // Update breadcrumb
        this.updateBreadcrumb(windowId);

        // Update status bar
        const itemCount = container.querySelector('.item-count');
        if (itemCount) itemCount.textContent = `${contents.length} items`;

        const currentLocation = container.querySelector('.current-location');
        if (currentLocation) currentLocation.textContent = this.getPathString(state);

        // Update navigation buttons
        const upBtn = container.querySelector('.up-btn');
        if (upBtn) upBtn.disabled = state.currentPath.length <= 1;

        const backBtn = container.querySelector('.back-btn');
        if (backBtn) backBtn.disabled = state.navIndex <= 0;

        const forwardBtn = container.querySelector('.forward-btn');
        if (forwardBtn) forwardBtn.disabled = state.navIndex >= state.navHistory.length - 1;

        // Clear and populate file grid
        fileGrid.innerHTML = '';

        contents.forEach(item => {
            const element = this.createFileElement(item, windowId);
            fileGrid.appendChild(element);
        });

        // Apply view mode
        fileGrid.className = `file-grid ${state.viewMode}-view`;

        // Update window title
        const titleElement = windowElement.querySelector('.window-title');
        if (titleElement) titleElement.innerHTML = `${ElxaIcons.render('fileManager', 'ui')} ${this.getPathString(state)}`;
    }

    createFileElement(item, windowId) {
        const element = document.createElement('div');
        element.className = 'file-item';
        element.setAttribute('data-name', item.name);
        element.setAttribute('data-type', item.type);

        const icon = item.type === 'folder' ? ElxaIcons.renderFolder('ui') : ElxaIcons.getFileIcon(item.name, 'ui');

        // Size calculation
        let size = '';
        if (item.type === 'file') {
            const bytes = item.content ? item.content.length : 0;
            size = this.formatFileSize(bytes);
        } else {
            size = '--';
        }

        // Date formatting
        let modified = '--';
        const dateSource = item.type === 'file' ? item.modified : item.created;
        if (dateSource) {
            if (dateSource instanceof Date) {
                modified = dateSource.toLocaleDateString();
            } else if (typeof dateSource === 'string') {
                try {
                    const date = new Date(dateSource);
                    if (!isNaN(date.getTime())) modified = date.toLocaleDateString();
                } catch (e) { /* keep '--' */ }
            }
        }

        const state = this._getState(windowId);
        if (state && state.viewMode === 'list') {
            element.innerHTML = `
                <div class="file-icon-small">${icon}</div>
                <div class="file-name">${item.name}</div>
                <div class="file-size">${size}</div>
                <div class="file-date">${modified}</div>
            `;
        } else {
            element.innerHTML = `
                <div class="file-icon">${icon}</div>
                <div class="file-name">${item.name}</div>
            `;
        }

        return element;
    }

    // =========================================================
    // Selection Handling
    // =========================================================
    handleFileGridClick(e, windowId) {
        const state = this._getState(windowId);
        if (!state) return;

        const fileItem = e.target.closest('.file-item');
        if (!fileItem) {
            this.clearSelection(windowId);
            return;
        }

        const isCtrlClick = e.ctrlKey || e.metaKey;
        const itemName = fileItem.getAttribute('data-name');

        if (isCtrlClick) {
            if (state.selectedItems.has(itemName)) {
                state.selectedItems.delete(itemName);
                fileItem.classList.remove('selected');
            } else {
                state.selectedItems.add(itemName);
                fileItem.classList.add('selected');
            }
        } else {
            this.clearSelection(windowId);
            state.selectedItems.add(itemName);
            fileItem.classList.add('selected');
        }

        this.updateSelectionStatus(windowId);
        this.updateOperationButtons(windowId);
    }

    handleFileGridDoubleClick(e, windowId) {
        const state = this._getState(windowId);
        if (!state) return;

        const fileItem = e.target.closest('.file-item');
        if (!fileItem) return;

        const itemName = fileItem.getAttribute('data-name');
        const itemType = fileItem.getAttribute('data-type');

        if (itemType === 'folder') {
            if (itemName === 'Recycle Bin') {
                this.windowManager.closeWindow(windowId);
                elxaOS.eventBus.emit('program.launch', { program: 'recycle-bin' });
            } else {
                this.navigateToFolder(itemName, windowId);
            }
        } else {
            this.openFile(itemName, windowId);
        }
    }

    clearSelection(windowId) {
        const state = this._getState(windowId);
        if (!state) return;

        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;

        const container = windowElement.querySelector('.file-manager-container');
        if (!container) return;

        container.querySelectorAll('.file-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        state.selectedItems.clear();
        this.updateSelectionStatus(windowId);
        this.updateOperationButtons(windowId);
    }

    updateSelectionStatus(windowId) {
        const state = this._getState(windowId);
        if (!state) return;

        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;

        const container = windowElement.querySelector('.file-manager-container');
        if (!container) return;

        const selectedCount = container.querySelector('.selected-count');
        if (selectedCount) {
            selectedCount.textContent = state.selectedItems.size > 0
                ? `${state.selectedItems.size} selected`
                : '';
        }
    }

    updateOperationButtons(windowId) {
        const state = this._getState(windowId);
        if (!state) return;

        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;

        const container = windowElement.querySelector('.file-manager-container');
        if (!container) return;

        const hasSelection = state.selectedItems.size > 0;
        const hasClipboard = this.clipboard && this.clipboard.items && this.clipboard.items.length > 0;

        const copyBtn = container.querySelector('.copy-btn');
        const cutBtn = container.querySelector('.cut-btn');
        const pasteBtn = container.querySelector('.paste-btn');
        const deleteBtn = container.querySelector('.delete-btn');
        const renameBtn = container.querySelector('.rename-btn');

        if (copyBtn) copyBtn.disabled = !hasSelection;
        if (cutBtn) cutBtn.disabled = !hasSelection;
        if (pasteBtn) pasteBtn.disabled = !hasClipboard;
        if (deleteBtn) deleteBtn.disabled = !hasSelection;
        if (renameBtn) renameBtn.disabled = state.selectedItems.size !== 1;
    }

    // =========================================================
    // Navigation
    // =========================================================
    navigateToFolder(folderName, windowId) {
        const state = this._getState(windowId);
        if (!state) return;

        const newPath = [...state.currentPath, folderName];
        const folder = this.fileSystem.getFolder(newPath);
        if (folder) {
            state.currentPath = newPath;
            this._pushNav(state, newPath);
            this.refreshView(windowId);
        }
    }

    goUp(windowId) {
        const state = this._getState(windowId);
        if (!state || state.currentPath.length <= 1) return;

        state.currentPath = state.currentPath.slice(0, -1);
        this._pushNav(state, state.currentPath);
        this.refreshView(windowId);
    }

    goBack(windowId) {
        const state = this._getState(windowId);
        if (!state || state.navIndex <= 0) return;

        state.navIndex--;
        state.currentPath = [...state.navHistory[state.navIndex]];
        this.refreshView(windowId);
    }

    goForward(windowId) {
        const state = this._getState(windowId);
        if (!state || state.navIndex >= state.navHistory.length - 1) return;

        state.navIndex++;
        state.currentPath = [...state.navHistory[state.navIndex]];
        this.refreshView(windowId);
    }

    // =========================================================
    // File Operations
    // =========================================================
    openFile(filename, windowId) {
        const state = this._getState(windowId);
        if (!state) return;

        const file = this.fileSystem.getFile(state.currentPath, filename);
        if (!file) return;

        const extension = this.getFileExtension(filename).toLowerCase();

        switch (extension) {
            case '.txt':
            case '.html':
            case '.rtf':
                if (elxaOS.programs.notepad) {
                    elxaOS.programs.notepad.openFile(filename, state.currentPath);
                }
                break;
            case '.elxa':
                if (elxaOS.programs.elxacode) {
                    elxaOS.programs.elxacode.openFile(filename, state.currentPath);
                }
                break;
            case '.abby':
                elxaOS.eventBus.emit('installer.run', {
                    filename: filename,
                    path: state.currentPath
                });
                break;
            case '.png':
            case '.jpg':
            case '.jpeg':
            case '.gif':
                if (elxaOS.programs.paint) {
                    elxaOS.programs.paint.openFile(filename, state.currentPath);
                } else {
                    this.showMessage('Paint program not available', 'error');
                }
                break;
            default:
                this.showMessage(`Don't know how to open ${extension} files`, 'warning');
        }
    }

    createNewFolder(windowId) {
        const state = this._getState(windowId);
        if (!state) return;

        ElxaUI.showInputDialog({
            title: `${ElxaIcons.renderAction('new-folder')} New Folder`,
            label: 'Folder name:',
            value: 'New Folder',
            placeholder: 'Enter folder name',
            confirmText: 'Create'
        }).then(folderName => {
            if (folderName) {
                if (this.fileSystem.createFolder(state.currentPath, folderName)) {
                    this.refreshView(windowId);
                    this.showMessage(`Created folder: ${folderName}`, 'success');

                    if (state.currentPath.length === 2 && state.currentPath[1] === 'Desktop') {
                        if (elxaOS && typeof elxaOS.refreshDesktop === 'function') {
                            elxaOS.refreshDesktop();
                        }
                    }
                } else {
                    this.showMessage('Failed to create folder', 'error');
                }
            }
        });
    }

    copySelected(windowId) {
        const state = this._getState(windowId);
        if (!state || state.selectedItems.size === 0) return;

        this.clipboard = {
            items: Array.from(state.selectedItems),
            sourcePath: [...state.currentPath],
            action: 'copy'
        };

        this.showMessage(`Copied ${state.selectedItems.size} item(s)`, 'success');
        this.updateAllPasteButtons();
    }

    cutSelected(windowId) {
        const state = this._getState(windowId);
        if (!state || state.selectedItems.size === 0) return;

        this.clipboard = {
            items: Array.from(state.selectedItems),
            sourcePath: [...state.currentPath],
            action: 'cut'
        };

        this.showMessage(`Cut ${state.selectedItems.size} item(s)`, 'success');
        this.updateAllPasteButtons();
    }

    paste(windowId) {
        const state = this._getState(windowId);
        if (!state) return;

        if (!this.clipboard || !this.clipboard.items || this.clipboard.items.length === 0) {
            this.showMessage('Nothing to paste', 'warning');
            return;
        }

        const { items, sourcePath, action } = this.clipboard;
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        items.forEach(itemName => {
            try {
                if (action === 'copy') {
                    if (this.copyItem(sourcePath, itemName, state.currentPath)) {
                        successCount++;
                    } else {
                        errorCount++;
                        errors.push(`Failed to copy ${itemName}`);
                    }
                } else if (action === 'cut') {
                    if (this.moveItem(sourcePath, itemName, state.currentPath)) {
                        successCount++;
                    } else {
                        errorCount++;
                        errors.push(`Failed to move ${itemName}`);
                    }
                }
            } catch (error) {
                errorCount++;
                errors.push(`Error with ${itemName}: ${error.message}`);
            }
        });

        if (action === 'cut') {
            this.clipboard = null;
            this.updateAllPasteButtons();
        }

        if (successCount > 0) {
            const actionWord = action === 'copy' ? 'copied' : 'moved';
            this.showMessage(`Successfully ${actionWord} ${successCount} item(s)`, 'success');
        }

        if (errorCount > 0) {
            this.showMessage(`Failed to process ${errorCount} item(s)`, 'error');
            console.error('Paste errors:', errors);
        }

        this.refreshView(windowId);

        if (state.currentPath.length === 2 && state.currentPath[1] === 'Desktop') {
            elxaOS.eventBus.emit('desktop.changed');
        }
    }

    async deleteSelected(windowId) {
        const state = this._getState(windowId);
        if (!state || state.selectedItems.size === 0) return;

        const itemCount = state.selectedItems.size;
        const message = itemCount === 1
            ? `Delete "${Array.from(state.selectedItems)[0]}"?`
            : `Delete ${itemCount} selected items?`;

        const confirmed = await ElxaUI.showConfirmDialog({
            title: `${ElxaIcons.renderAction('delete')} Confirm Delete`,
            message: message,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            confirmIcon: ElxaIcons.renderAction('delete'),
            cancelIcon: ElxaIcons.renderAction('close'),
            confirmClass: 'elxa-dialog-btn-danger'
        });

        if (confirmed) {
            let deletedCount = 0;

            state.selectedItems.forEach(itemName => {
                if (this.fileSystem.deleteItem(state.currentPath, itemName)) {
                    deletedCount++;
                }
            });

            state.selectedItems.clear();
            this.refreshView(windowId);
            this.showMessage(`Moved ${deletedCount} item(s) to Recycle Bin`, 'success');
        }
    }

    // =========================================================
    // Rename — now wired to fileSystem.renameItem()
    // =========================================================
    renameSelected(windowId) {
        const state = this._getState(windowId);
        if (!state || state.selectedItems.size !== 1) return;

        const oldName = Array.from(state.selectedItems)[0];

        ElxaUI.showInputDialog({
            title: `${ElxaIcons.renderAction('rename')} Rename`,
            label: 'New name:',
            value: oldName,
            confirmText: 'Rename'
        }).then(newName => {
            if (newName && newName !== oldName) {
                if (this.fileSystem.renameItem(state.currentPath, oldName, newName)) {
                    this.showMessage(`Renamed to "${newName}"`, 'success');
                    this.refreshView(windowId);

                    // Refresh desktop if renaming inside Desktop folder
                    if (state.currentPath.length === 2 && state.currentPath[1] === 'Desktop') {
                        elxaOS.eventBus.emit('desktop.changed');
                    }
                } else {
                    this.showMessage('Rename failed — name may already exist', 'error');
                }
            }
        });
    }

    // =========================================================
    // Context Menu
    // =========================================================
    showContextMenu(e, windowId) {
        e.preventDefault();

        const state = this._getState(windowId);
        if (!state) return;

        // Remove any existing context menu
        this._removeContextMenu();

        // Figure out what was right-clicked
        const fileItem = e.target.closest('.file-item');
        const clickedName = fileItem ? fileItem.getAttribute('data-name') : null;
        const clickedType = fileItem ? fileItem.getAttribute('data-type') : null;

        // If right-clicking an unselected item, select it
        if (fileItem && !state.selectedItems.has(clickedName)) {
            this.clearSelection(windowId);
            state.selectedItems.add(clickedName);
            fileItem.classList.add('selected');
            this.updateSelectionStatus(windowId);
            this.updateOperationButtons(windowId);
        }

        const hasSelection = state.selectedItems.size > 0;
        const singleSelection = state.selectedItems.size === 1;
        const hasClipboard = this.clipboard && this.clipboard.items && this.clipboard.items.length > 0;

        // Build menu items
        const menuItems = [];

        if (hasSelection && singleSelection && clickedType === 'folder') {
            menuItems.push({ label: `${ElxaIcons.renderAction('open')} Open`, action: () => this.navigateToFolder(clickedName, windowId) });
            menuItems.push({ separator: true });
        } else if (hasSelection && singleSelection && clickedType === 'file') {
            menuItems.push({ label: `${ElxaIcons.renderAction('open-file')} Open`, action: () => this.openFile(clickedName, windowId) });
            menuItems.push({ separator: true });
        }

        if (hasSelection) {
            menuItems.push({ label: `${ElxaIcons.renderAction('copy')} Copy`, action: () => this.copySelected(windowId) });
            menuItems.push({ label: `${ElxaIcons.renderAction('cut')} Cut`, action: () => this.cutSelected(windowId) });
        }

        if (hasClipboard) {
            menuItems.push({ label: `${ElxaIcons.renderAction('paste')} Paste`, action: () => this.paste(windowId) });
        }

        if (hasSelection) {
            menuItems.push({ separator: true });
            menuItems.push({ label: `${ElxaIcons.renderAction('delete')} Delete`, action: () => this.deleteSelected(windowId) });
        }

        if (singleSelection) {
            menuItems.push({ label: `${ElxaIcons.renderAction('rename')} Rename`, action: () => this.renameSelected(windowId) });
        }

        // Empty-space actions
        if (!hasSelection) {
            menuItems.push({ label: `${ElxaIcons.renderAction('new-folder')} New Folder`, action: () => this.createNewFolder(windowId) });
            if (hasClipboard) {
                menuItems.push({ label: `${ElxaIcons.renderAction('paste')} Paste`, action: () => this.paste(windowId) });
            }
            menuItems.push({ separator: true });
            menuItems.push({ label: `${ElxaIcons.renderAction('refresh')} Refresh`, action: () => this.refreshView(windowId) });
        }

        // Create the DOM element
        const menu = document.createElement('div');
        menu.className = 'fm-context-menu';
        menu.style.left = `${e.clientX}px`;
        menu.style.top = `${e.clientY}px`;

        menuItems.forEach(item => {
            if (item.separator) {
                const sep = document.createElement('div');
                sep.className = 'fm-context-menu-separator';
                menu.appendChild(sep);
                return;
            }

            const row = document.createElement('div');
            row.className = 'fm-context-menu-item';
            row.innerHTML = item.label;
            row.addEventListener('click', () => {
                this._removeContextMenu();
                item.action();
            });
            menu.appendChild(row);
        });

        document.body.appendChild(menu);

        // Keep menu on screen
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) menu.style.left = (window.innerWidth - rect.width - 4) + 'px';
        if (rect.bottom > window.innerHeight) menu.style.top = (window.innerHeight - rect.height - 4) + 'px';

        // Close on any click elsewhere
        const closeHandler = (ev) => {
            if (!menu.contains(ev.target)) {
                this._removeContextMenu();
                document.removeEventListener('mousedown', closeHandler, true);
            }
        };
        // Use setTimeout so the current right-click event doesn't immediately close
        setTimeout(() => document.addEventListener('mousedown', closeHandler, true), 0);
    }

    _removeContextMenu() {
        document.querySelectorAll('.fm-context-menu').forEach(m => m.remove());
    }

    // =========================================================
    // Keyboard Shortcuts
    // =========================================================
    handleKeyboard(e, windowId) {
        const state = this._getState(windowId);
        if (!state) return;

        switch (e.key) {
            case 'Delete':
                this.deleteSelected(windowId);
                break;
            case 'F2':
                this.renameSelected(windowId);
                break;
            case 'F5':
                this.refreshView(windowId);
                break;
            case 'Escape':
                this.clearSelection(windowId);
                break;
            case 'Backspace':
                this.goUp(windowId);
                break;
        }

        if (e.ctrlKey) {
            switch (e.key) {
                case 'c':
                    this.copySelected(windowId);
                    break;
                case 'x':
                    this.cutSelected(windowId);
                    break;
                case 'v':
                    this.paste(windowId);
                    break;
                case 'a':
                    e.preventDefault();
                    const windowElement = document.getElementById(`window-${windowId}`);
                    if (!windowElement) break;
                    const container = windowElement.querySelector('.file-manager-container');
                    if (!container) break;
                    container.querySelectorAll('.file-item').forEach(item => {
                        item.classList.add('selected');
                        state.selectedItems.add(item.getAttribute('data-name'));
                    });
                    this.updateSelectionStatus(windowId);
                    this.updateOperationButtons(windowId);
                    break;
            }
        }

        if (e.altKey) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.goBack(windowId);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.goForward(windowId);
            }
        }
    }

    // =========================================================
    // View Mode
    // =========================================================
    setViewMode(mode, windowId) {
        const state = this._getState(windowId);
        if (!state) return;

        state.viewMode = mode;
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;

        const container = windowElement.querySelector('.file-manager-container');
        if (!container) return;

        container.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === mode);
        });

        this.refreshView(windowId);
    }

    // =========================================================
    // Breadcrumb
    // =========================================================
    updateBreadcrumb(windowId) {
        const state = this._getState(windowId);
        if (!state) return;

        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;

        const container = windowElement.querySelector('.file-manager-container');
        if (!container) return;

        const breadcrumb = container.querySelector('.breadcrumb-path');
        if (!breadcrumb) return;

        breadcrumb.innerHTML = '';

        state.currentPath.forEach((part, index) => {
            if (index > 0) {
                const separator = document.createElement('span');
                separator.textContent = ' > ';
                separator.className = 'breadcrumb-separator';
                breadcrumb.appendChild(separator);
            }

            const crumb = document.createElement('span');
            crumb.textContent = index === 0 ? 'My Computer' : part;
            crumb.className = 'breadcrumb-item';

            if (index < state.currentPath.length - 1) {
                crumb.classList.add('clickable');
                crumb.addEventListener('click', () => {
                    state.currentPath = state.currentPath.slice(0, index + 1);
                    this._pushNav(state, state.currentPath);
                    this.refreshView(windowId);
                });
            }

            breadcrumb.appendChild(crumb);
        });
    }

    // =========================================================
    // Paste button sync across windows
    // =========================================================
    updateAllPasteButtons() {
        const hasClipboard = this.clipboard && this.clipboard.items && this.clipboard.items.length > 0;

        document.querySelectorAll('.file-manager-container').forEach(container => {
            const pasteBtn = container.querySelector('.paste-btn');
            if (pasteBtn) pasteBtn.disabled = !hasClipboard;
        });
    }

    // =========================================================
    // Copy / Move / Duplicate helpers (unchanged logic)
    // =========================================================
    copyItem(sourcePath, itemName, targetPath) {
        if (this.pathsEqual(sourcePath, targetPath)) {
            const newName = this.generateCopyName(itemName, targetPath);
            return this.duplicateItem(sourcePath, itemName, targetPath, newName);
        }

        const targetFolder = this.fileSystem.getFolder(targetPath);
        if (!targetFolder) return false;

        if (targetFolder.children[itemName]) {
            const newName = this.generateCopyName(itemName, targetPath);
            return this.duplicateItem(sourcePath, itemName, targetPath, newName);
        }

        return this.duplicateItem(sourcePath, itemName, targetPath, itemName);
    }

    moveItem(sourcePath, itemName, targetPath) {
        if (this.pathsEqual(sourcePath, targetPath)) return true;

        const sourceItem = this.fileSystem.getFile(sourcePath, itemName);
        if (!sourceItem) return false;

        const targetFolder = this.fileSystem.getFolder(targetPath);
        if (!targetFolder) return false;

        let finalName = itemName;
        if (targetFolder.children[itemName]) {
            finalName = this.generateCopyName(itemName, targetPath);
        }

        if (!this.duplicateItem(sourcePath, itemName, targetPath, finalName)) return false;
        return this.fileSystem.deleteItem(sourcePath, itemName);
    }

    duplicateItem(sourcePath, sourceItemName, targetPath, targetItemName) {
        const sourceItem = this.fileSystem.getFile(sourcePath, sourceItemName);
        if (!sourceItem) return false;

        if (sourceItem.type === 'file') {
            return this.fileSystem.createFile(targetPath, targetItemName, sourceItem.content, sourceItem.fileType);
        } else if (sourceItem.type === 'folder') {
            return this.copyFolderRecursively(sourcePath, sourceItemName, targetPath, targetItemName);
        }
        return false;
    }

    copyFolderRecursively(sourceFolderPath, sourceFolderName, targetPath, targetFolderName) {
        if (!this.fileSystem.createFolder(targetPath, targetFolderName)) return false;

        const sourceFullPath = [...sourceFolderPath, sourceFolderName];
        const contents = this.fileSystem.listContents(sourceFullPath);
        const targetFullPath = [...targetPath, targetFolderName];
        let allSuccess = true;

        contents.forEach(item => {
            if (!this.duplicateItem(sourceFullPath, item.name, targetFullPath, item.name)) {
                allSuccess = false;
            }
        });

        return allSuccess;
    }

    generateCopyName(originalName, targetPath) {
        const targetFolder = this.fileSystem.getFolder(targetPath);
        if (!targetFolder) return originalName;

        const extension = this.getFileExtension(originalName);
        const baseName = extension ? originalName.slice(0, -extension.length) : originalName;

        let copyName = `Copy of ${originalName}`;
        let counter = 2;

        while (targetFolder.children[copyName]) {
            copyName = extension ? `${baseName} (${counter})${extension}` : `${originalName} (${counter})`;
            counter++;
            if (counter > 100) {
                copyName = `${originalName}_${Date.now()}`;
                break;
            }
        }

        return copyName;
    }

    pathsEqual(path1, path2) {
        if (path1.length !== path2.length) return false;
        return path1.every((segment, index) => segment === path2[index]);
    }

    // =========================================================
    // Utility helpers
    // =========================================================
    getPathString(state) {
        if (!state) return 'My Computer';
        return state.currentPath.length === 1 ? 'My Computer' : state.currentPath.slice(1).join(' > ');
    }

    getFileIcon(filename, context = 'ui') {
        return ElxaIcons.getFileIcon(filename, context);
    }

    getFileExtension(filename) {
        const lastDot = filename.lastIndexOf('.');
        return lastDot === -1 ? '' : filename.substring(lastDot);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    showMessage(text, type = 'info') {
        ElxaUI.showMessage(text, type);
    }

    // =========================================================
    // Desktop sync (called externally)
    // =========================================================
    syncDesktopFiles() {
        const desktopFiles = this.fileSystem.listContents(['root', 'Desktop']);
        const desktopIcons = document.getElementById('desktopIcons');
        if (!desktopIcons) return;

        const systemIcons = Array.from(desktopIcons.querySelectorAll('.desktop-icon')).filter(icon =>
            ['computer', 'recycle-bin', 'notepad'].includes(icon.dataset.program) && !icon.dataset.file
        );

        desktopIcons.innerHTML = '';
        systemIcons.forEach(icon => desktopIcons.appendChild(icon));

        desktopFiles.forEach(file => {
            if (desktopIcons.querySelector(`.desktop-icon[data-file="${file.name}"]`)) return;

            const iconElement = document.createElement('div');
            iconElement.className = 'desktop-icon';
            iconElement.dataset.file = file.name;

            let icon, program;

            if (file.type === 'folder') {
                icon = ElxaIcons.renderFolder('desktop');
                program = 'folder';
            } else {
                const extension = this.getFileExtension(file.name).toLowerCase();
                switch (extension) {
                    case '.lnk':
                        try {
                            const shortcutData = JSON.parse(file.content);
                            if (shortcutData.type === 'program_shortcut') {
                                icon = shortcutData.programInfo.icon;
                                program = shortcutData.programId;
                                iconElement.dataset.installed = 'true';
                                if (shortcutData.launchArgs) {
                                    iconElement.dataset.launchargs = shortcutData.launchArgs;
                                }
                            }
                        } catch (e) {
                            icon = ElxaIcons.getFileIcon(file.name, 'desktop');
                            program = 'notepad';
                        }
                        break;
                    case '.txt': icon = ElxaIcons.getFileIcon(file.name, 'desktop'); program = 'notepad'; break;
                    case '.html': icon = ElxaIcons.getFileIcon(file.name, 'desktop'); program = 'notepad'; break;
                    case '.elxa': icon = ElxaIcons.getFileIcon(file.name, 'desktop'); program = 'elxacode'; break;
                    case '.png': case '.jpg': case '.jpeg': case '.gif':
                        icon = ElxaIcons.getFileIcon(file.name, 'desktop'); program = 'paint'; break;
                    default: icon = ElxaIcons.getFileIcon(file.name, 'desktop'); program = 'notepad';
                }
            }

            iconElement.dataset.program = program;

            if (file.type === 'file' && (program === 'notepad' || program === 'paint')) {
                iconElement.dataset.filepath = JSON.stringify(['root', 'Desktop', file.name]);
            }

            const displayName = file.name.endsWith('.lnk') ? file.name.slice(0, -4) : file.name;

            iconElement.innerHTML = `
                <div class="desktop-icon-image">${icon}</div>
                <div class="desktop-icon-label">${displayName}</div>
            `;

            desktopIcons.appendChild(iconElement);
        });
    }
}
