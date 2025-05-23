// =================================
// FILE MANAGER PROGRAM
// =================================
class FileManagerProgram {
    constructor(windowManager, fileSystem, eventBus) {
        this.windowManager = windowManager;
        this.fileSystem = fileSystem;
        this.eventBus = eventBus;
        this.currentPath = ['root'];
        this.viewMode = 'icons'; // 'icons' or 'list'
        this.selectedItems = new Set();
        this.clipboard = null;
        this.clipboardAction = null; // 'cut' or 'copy'
    }

    launch(startPath = ['root']) {
        const windowId = `file-manager-${Date.now()}`;
        this.currentPath = [...startPath];
        
        const windowContent = this.createFileManagerInterface(windowId);
        
        const window = this.windowManager.createWindow(
            windowId,
            `💻 ${this.getPathString()}`,
            windowContent,
            { width: '600px', height: '450px', x: '100px', y: '100px' }
        );
        
        this.setupEventHandlers(windowId);
        this.refreshView(windowId);
        
        return windowId;
    }

    createFileManagerInterface(windowId) {
        return `
            <div class="file-manager-container" data-window-id="${windowId}">
                <!-- Toolbar -->
                <div class="file-manager-toolbar">
                    <div class="navigation-controls">
                        <button class="nav-btn back-btn" title="Back" disabled>⬅️</button>
                        <button class="nav-btn forward-btn" title="Forward" disabled>➡️</button>
                        <button class="nav-btn up-btn" title="Up">⬆️</button>
                        <button class="nav-btn refresh-btn" title="Refresh">🔄</button>
                    </div>
                    
                    <div class="path-bar">
                        <div class="breadcrumb-path"></div>
                    </div>
                    
                    <div class="view-controls">
                        <button class="view-btn icons-view active" data-view="icons" title="Icon View">⊞</button>
                        <button class="view-btn list-view" data-view="list" title="List View">☰</button>
                    </div>
                </div>
                
                <!-- File/Folder Operations Bar -->
                <div class="operations-bar">
                    <button class="op-btn new-folder-btn">📁 New Folder</button>
                    <button class="op-btn copy-btn" disabled>📋 Copy</button>
                    <button class="op-btn cut-btn" disabled>✂️ Cut</button>
                    <button class="op-btn paste-btn" disabled>📋 Paste</button>
                    <button class="op-btn delete-btn" disabled>🗑️ Delete</button>
                    <button class="op-btn rename-btn" disabled>✏️ Rename</button>
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

    setupEventHandlers(windowId) {
        // Find the window content first, then look for our container inside it
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        // Find our container within the window content
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
        container.querySelector('.copy-btn').addEventListener('click', () => this.copySelected());
        container.querySelector('.cut-btn').addEventListener('click', () => this.cutSelected());
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
    }

    refreshView(windowId) {
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        const container = windowElement.querySelector('.file-manager-container');
        if (!container) return;
        
        const fileGrid = container.querySelector(`#file-grid-${windowId}`);
        if (!fileGrid) return;
        
        // Clear selection
        this.selectedItems.clear();
        this.updateOperationButtons(windowId);
        
        // Get current folder contents
        const contents = this.fileSystem.listContents(this.currentPath);
        
        // Update breadcrumb
        this.updateBreadcrumb(windowId);
        
        // Update status
        const itemCount = container.querySelector('.item-count');
        if (itemCount) itemCount.textContent = `${contents.length} items`;
        
        const currentLocation = container.querySelector('.current-location');
        if (currentLocation) currentLocation.textContent = this.getPathString();
        
        // Update navigation buttons
        const upBtn = container.querySelector('.up-btn');
        if (upBtn) upBtn.disabled = this.currentPath.length <= 1;
        
        // Clear and populate file grid
        fileGrid.innerHTML = '';
        
        contents.forEach(item => {
            const element = this.createFileElement(item, windowId);
            fileGrid.appendChild(element);
        });
        
        // Apply view mode
        fileGrid.className = `file-grid ${this.viewMode}-view`;
        
        // Update window title
        const titleElement = windowElement.querySelector('.window-title');
        if (titleElement) titleElement.textContent = `💻 ${this.getPathString()}`;
    }

    createFileElement(item, windowId) {
        const element = document.createElement('div');
        element.className = 'file-item';
        element.setAttribute('data-name', item.name);
        element.setAttribute('data-type', item.type);
        
        const icon = item.type === 'folder' ? '📁' : this.getFileIcon(item.name);
        
        // Better size calculation
        let size = '';
        if (item.type === 'file') {
            const bytes = item.content ? item.content.length : 0;
            size = this.formatFileSize(bytes);
        } else {
            size = '--'; // For folders, show -- instead of size
        }
        
        // IMPROVED DATE FORMATTING
        let modified = '--';
        
        // For files, try to get modified date
        if (item.type === 'file' && item.modified) {
            if (item.modified instanceof Date) {
                modified = item.modified.toLocaleDateString();
            } else if (typeof item.modified === 'string') {
                try {
                    const date = new Date(item.modified);
                    if (!isNaN(date.getTime())) {
                        modified = date.toLocaleDateString();
                    }
                } catch (e) {
                    modified = '--';
                }
            }
        }
        // For folders, try to get created date
        else if (item.type === 'folder' && item.created) {
            if (item.created instanceof Date) {
                modified = item.created.toLocaleDateString();
            } else if (typeof item.created === 'string') {
                try {
                    const date = new Date(item.created);
                    if (!isNaN(date.getTime())) {
                        modified = date.toLocaleDateString();
                    }
                } catch (e) {
                    modified = '--';
                }
            }
        }
        
        if (this.viewMode === 'icons') {
            element.innerHTML = `
                <div class="file-icon">${icon}</div>
                <div class="file-name">${item.name}</div>
            `;
        } else {
            // IMPROVED LIST VIEW LAYOUT
            element.innerHTML = `
                <div class="file-icon-small">${icon}</div>
                <div class="file-name">${item.name}</div>
                <div class="file-size">${size}</div>
                <div class="file-date">${modified}</div>
            `;
        }
        
        return element;
    }

    handleFileGridClick(e, windowId) {
        const fileItem = e.target.closest('.file-item');
        if (!fileItem) {
            // Clicked empty space - clear selection
            this.clearSelection(windowId);
            return;
        }

        const isCtrlClick = e.ctrlKey || e.metaKey;
        const itemName = fileItem.getAttribute('data-name');

        if (isCtrlClick) {
            // Toggle selection
            if (this.selectedItems.has(itemName)) {
                this.selectedItems.delete(itemName);
                fileItem.classList.remove('selected');
            } else {
                this.selectedItems.add(itemName);
                fileItem.classList.add('selected');
            }
        } else {
            // Single selection
            this.clearSelection(windowId);
            this.selectedItems.add(itemName);
            fileItem.classList.add('selected');
        }

        this.updateSelectionStatus(windowId);
        this.updateOperationButtons(windowId);
    }

    handleFileGridDoubleClick(e, windowId) {
        const fileItem = e.target.closest('.file-item');
        if (!fileItem) return;

        const itemName = fileItem.getAttribute('data-name');
        const itemType = fileItem.getAttribute('data-type');

        if (itemType === 'folder') {
            // Special folder handling
            if (itemName === 'Recycle Bin') {
                // Close current window
                this.windowManager.closeWindow(windowId);
                
                // Launch file manager pointing to Recycle Bin
                elxaOS.eventBus.emit('program.launch', { program: 'recycle-bin' });
            } else {
                // Normal folder navigation
                this.navigateToFolder(itemName, windowId);
            }
        } else {
            this.openFile(itemName);
        }
    }

    navigateToFolder(folderName, windowId) {
        const newPath = [...this.currentPath, folderName];
        
        // Check if folder exists
        const folder = this.fileSystem.getFolder(newPath);
        if (folder) {
            this.currentPath = newPath;
            this.refreshView(windowId);
        }
    }

    goUp(windowId) {
        if (this.currentPath.length > 1) {
            this.currentPath.pop();
            this.refreshView(windowId);
        }
    }

    goBack(windowId) {
        // TODO: Implement navigation history
    }

    goForward(windowId) {
        // TODO: Implement navigation history
    }

    openFile(filename) {
        const file = this.fileSystem.getFile(this.currentPath, filename);
        if (!file) return;

        // Determine how to open based on file type
        const extension = this.getFileExtension(filename).toLowerCase();
        
        switch (extension) {
            case '.txt':
            case '.html':
            case '.rtf':
                // Open in Notepad
                if (elxaOS.programs.notepad) {
                    elxaOS.programs.notepad.openFile(filename, this.currentPath);
                }
                break;
            case '.elxa':
                // Open in ElxaCode
                if (elxaOS.programs.elxacode) {
                    elxaOS.programs.elxacode.openFile(filename, this.currentPath);
                }
                break;
            case '.abby':
                // Run installer
                elxaOS.eventBus.emit('installer.run', { 
                    filename: filename, 
                    path: this.currentPath 
                });
                break;
            case '.png':
            case '.jpg':
            case '.jpeg':
            case '.gif':
                // Open in Paint program
                if (elxaOS.programs.paint) {
                    elxaOS.programs.paint.openFile(filename, this.currentPath);
                } else {
                    this.showMessage(`Paint program not available`, 'error');
                }
                break;
            default:
                this.showMessage(`Don't know how to open ${extension} files`, 'warning');
        }
    }

    createNewFolder(windowId) {
        const container = document.querySelector(`[data-window-id="${windowId}"]`);
        
        // Create input dialog
        const dialog = document.createElement('div');
        dialog.className = 'input-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <div class="dialog-title">📁 New Folder</div>
                    <div class="dialog-close">×</div>
                </div>
                <div class="dialog-body">
                    <label>Folder name:</label>
                    <input type="text" class="folder-name-input" value="New Folder" placeholder="Enter folder name">
                    <div class="dialog-buttons">
                        <button class="create-btn">Create</button>
                        <button class="cancel-btn">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        const nameInput = dialog.querySelector('.folder-name-input');
        nameInput.focus();
        nameInput.select();

        const create = () => {
            const folderName = nameInput.value.trim();
            if (folderName) {
                if (this.fileSystem.createFolder(this.currentPath, folderName)) {
                    this.refreshView(windowId);
                    this.showMessage(`Created folder: ${folderName}`, 'success');
                    
                    // Immediately refresh desktop if we created a folder in Desktop
                    if (this.currentPath.length === 2 && this.currentPath[1] === 'Desktop') {
                        if (elxaOS && typeof elxaOS.refreshDesktop === 'function') {
                            elxaOS.refreshDesktop();
                        }
                    }
                } else {
                    this.showMessage('Failed to create folder', 'error');
                }
            }
            dialog.remove();
        };

        const cancel = () => dialog.remove();

        dialog.querySelector('.create-btn').addEventListener('click', create);
        dialog.querySelector('.cancel-btn').addEventListener('click', cancel);
        dialog.querySelector('.dialog-close').addEventListener('click', cancel);
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') create();
            if (e.key === 'Escape') cancel();
        });
    }

    copySelected() {
        if (this.selectedItems.size > 0) {
            this.clipboard = {
                items: Array.from(this.selectedItems),
                sourcePath: [...this.currentPath], // Store where items came from
                action: 'copy'
            };
            
            this.showMessage(`Copied ${this.selectedItems.size} item(s)`, 'success');
            
            // Update paste button state for all file manager windows
            this.updateAllPasteButtons();
        }
    }

    cutSelected() {
        if (this.selectedItems.size > 0) {
            this.clipboard = {
                items: Array.from(this.selectedItems),
                sourcePath: [...this.currentPath], // Store where items came from
                action: 'cut'
            };
            
            this.showMessage(`Cut ${this.selectedItems.size} item(s)`, 'success');
            
            // Update paste button state for all file manager windows
            this.updateAllPasteButtons();
        }
    }

    paste(windowId) {
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
                    if (this.copyItem(sourcePath, itemName, this.currentPath)) {
                        successCount++;
                    } else {
                        errorCount++;
                        errors.push(`Failed to copy ${itemName}`);
                    }
                } else if (action === 'cut') {
                    if (this.moveItem(sourcePath, itemName, this.currentPath)) {
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

        // Clear clipboard after cut operation
        if (action === 'cut') {
            this.clipboard = null;
            this.updateAllPasteButtons();
        }

        // Show results
        if (successCount > 0) {
            const actionWord = action === 'copy' ? 'copied' : 'moved';
            this.showMessage(`Successfully ${actionWord} ${successCount} item(s)`, 'success');
        }
        
        if (errorCount > 0) {
            this.showMessage(`Failed to process ${errorCount} item(s)`, 'error');
            console.error('Paste errors:', errors);
        }

        // Refresh the current view
        this.refreshView(windowId);
        
        // If we're in Desktop folder, refresh desktop icons
        if (this.currentPath.length === 2 && this.currentPath[1] === 'Desktop') {
            elxaOS.eventBus.emit('desktop.changed');
        }
    }

    // NEW: Copy an item (file or folder) to a new location
    copyItem(sourcePath, itemName, targetPath) {
        // Don't copy to the same location
        if (this.pathsEqual(sourcePath, targetPath)) {
            // Generate a new name for the copy
            const newName = this.generateCopyName(itemName, targetPath);
            return this.duplicateItem(sourcePath, itemName, targetPath, newName);
        }
        
        // Check if item already exists in target
        const targetFolder = this.fileSystem.getFolder(targetPath);
        if (!targetFolder) {
            console.error('Target folder not found:', targetPath);
            return false;
        }
        
        if (targetFolder.children[itemName]) {
            // Item already exists, generate new name
            const newName = this.generateCopyName(itemName, targetPath);
            return this.duplicateItem(sourcePath, itemName, targetPath, newName);
        }
        
        return this.duplicateItem(sourcePath, itemName, targetPath, itemName);
    }

    // NEW: Move an item to a new location
    moveItem(sourcePath, itemName, targetPath) {
        // Don't move to the same location
        if (this.pathsEqual(sourcePath, targetPath)) {
            return true; // No-op, but not an error
        }
        
        // Get the item to move
        const sourceItem = this.fileSystem.getFile(sourcePath, itemName);
        if (!sourceItem) {
            console.error('Source item not found:', itemName, 'in', sourcePath);
            return false;
        }
        
        // Check if target location exists
        const targetFolder = this.fileSystem.getFolder(targetPath);
        if (!targetFolder) {
            console.error('Target folder not found:', targetPath);
            return false;
        }
        
        // Check if item already exists in target
        let finalName = itemName;
        if (targetFolder.children[itemName]) {
            finalName = this.generateCopyName(itemName, targetPath);
        }
        
        // Create copy in target location
        if (!this.duplicateItem(sourcePath, itemName, targetPath, finalName)) {
            return false;
        }
        
        // Remove from source location
        return this.fileSystem.deleteItem(sourcePath, itemName);
    }

    // NEW: Duplicate an item (used by both copy and move)
    duplicateItem(sourcePath, sourceItemName, targetPath, targetItemName) {
        const sourceItem = this.fileSystem.getFile(sourcePath, sourceItemName);
        if (!sourceItem) {
            console.error('Source item not found:', sourceItemName);
            return false;
        }
        
        if (sourceItem.type === 'file') {
            // Copy file
            return this.fileSystem.createFile(
                targetPath, 
                targetItemName, 
                sourceItem.content, 
                sourceItem.fileType
            );
        } else if (sourceItem.type === 'folder') {
            // Copy folder and all its contents recursively
            return this.copyFolderRecursively(sourcePath, sourceItemName, targetPath, targetItemName);
        }
        
        return false;
    }

    // NEW: Recursively copy a folder and all its contents
    copyFolderRecursively(sourceFolderPath, sourceFolderName, targetPath, targetFolderName) {
        // Create the target folder
        if (!this.fileSystem.createFolder(targetPath, targetFolderName)) {
            console.error('Failed to create target folder:', targetFolderName);
            return false;
        }
        
        // Get source folder contents
        const sourceFullPath = [...sourceFolderPath, sourceFolderName];
        const contents = this.fileSystem.listContents(sourceFullPath);
        
        // Copy each item in the folder
        const targetFullPath = [...targetPath, targetFolderName];
        let allSuccess = true;
        
        contents.forEach(item => {
            const success = this.duplicateItem(sourceFullPath, item.name, targetFullPath, item.name);
            if (!success) {
                allSuccess = false;
                console.error('Failed to copy item:', item.name);
            }
        });
        
        return allSuccess;
    }

    // NEW: Generate a name for copies (like "Copy of file.txt" or "file (2).txt")
    generateCopyName(originalName, targetPath) {
        const targetFolder = this.fileSystem.getFolder(targetPath);
        if (!targetFolder) return originalName;
        
        // For files, try "Copy of filename" first
        const extension = this.getFileExtension(originalName);
        const baseName = extension ? originalName.slice(0, -extension.length) : originalName;
        
        let copyName = `Copy of ${originalName}`;
        let counter = 2;
        
        // If "Copy of" name exists, try numbered versions
        while (targetFolder.children[copyName]) {
            if (extension) {
                copyName = `${baseName} (${counter})${extension}`;
            } else {
                copyName = `${originalName} (${counter})`;
            }
            counter++;
            
            // Prevent infinite loop
            if (counter > 100) {
                copyName = `${originalName}_${Date.now()}`;
                break;
            }
        }
        
        return copyName;
    }

    // NEW: Check if two paths are equal
    pathsEqual(path1, path2) {
        if (path1.length !== path2.length) return false;
        return path1.every((segment, index) => segment === path2[index]);
    }

    // NEW: Update paste button state for all file manager windows
    updateAllPasteButtons() {
        const hasClipboard = this.clipboard && this.clipboard.items && this.clipboard.items.length > 0;
        
        // Find all file manager windows and update their paste buttons
        document.querySelectorAll('.file-manager-container').forEach(container => {
            const pasteBtn = container.querySelector('.paste-btn');
            if (pasteBtn) {
                pasteBtn.disabled = !hasClipboard;
            }
        });
    }

    deleteSelected(windowId) {
        if (this.selectedItems.size === 0) return;

        const itemCount = this.selectedItems.size;
        const message = itemCount === 1 ? 
            `Delete "${Array.from(this.selectedItems)[0]}"?` : 
            `Delete ${itemCount} selected items?`;

        if (confirm(message)) {
            let deletedCount = 0;
            
            this.selectedItems.forEach(itemName => {
                if (this.fileSystem.deleteItem(this.currentPath, itemName)) {
                    deletedCount++;
                }
            });

            this.selectedItems.clear();
            this.refreshView(windowId);
            this.showMessage(`Moved ${deletedCount} item(s) to Recycle Bin`, 'success');
        }
    }

    renameSelected(windowId) {
        if (this.selectedItems.size !== 1) return;

        const oldName = Array.from(this.selectedItems)[0];
        
        const dialog = document.createElement('div');
        dialog.className = 'input-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <div class="dialog-title">✏️ Rename</div>
                    <div class="dialog-close">×</div>
                </div>
                <div class="dialog-body">
                    <label>New name:</label>
                    <input type="text" class="rename-input" value="${oldName}">
                    <div class="dialog-buttons">
                        <button class="rename-btn">Rename</button>
                        <button class="cancel-btn">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        const nameInput = dialog.querySelector('.rename-input');
        nameInput.focus();
        nameInput.select();

        const rename = () => {
            const newName = nameInput.value.trim();
            if (newName && newName !== oldName) {
                // TODO: Implement rename functionality in file system
                this.showMessage(`Rename from "${oldName}" to "${newName}" (not yet implemented)`, 'info');
            }
            dialog.remove();
        };

        const cancel = () => dialog.remove();

        dialog.querySelector('.rename-btn').addEventListener('click', rename);
        dialog.querySelector('.cancel-btn').addEventListener('click', cancel);
        dialog.querySelector('.dialog-close').addEventListener('click', cancel);
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') rename();
            if (e.key === 'Escape') cancel();
        });
    }

    // Helper methods
    getPathString() {
        return this.currentPath.length === 1 ? 'My Computer' : this.currentPath.slice(1).join(' > ');
    }

    updateBreadcrumb(windowId) {
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        const container = windowElement.querySelector('.file-manager-container');
        if (!container) return;
        
        const breadcrumb = container.querySelector('.breadcrumb-path');
        if (!breadcrumb) return;
        
        breadcrumb.innerHTML = '';

        this.currentPath.forEach((part, index) => {
            if (index > 0) {
                const separator = document.createElement('span');
                separator.textContent = ' > ';
                separator.className = 'breadcrumb-separator';
                breadcrumb.appendChild(separator);
            }

            const crumb = document.createElement('span');
            crumb.textContent = index === 0 ? 'My Computer' : part;
            crumb.className = 'breadcrumb-item';
            
            if (index < this.currentPath.length - 1) {
                crumb.classList.add('clickable');
                crumb.addEventListener('click', () => {
                    this.currentPath = this.currentPath.slice(0, index + 1);
                    this.refreshView(windowId);
                });
            }

            breadcrumb.appendChild(crumb);
        });
    }

    clearSelection(windowId) {
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        const container = windowElement.querySelector('.file-manager-container');
        if (!container) return;
        
        container.querySelectorAll('.file-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        this.selectedItems.clear();
        this.updateSelectionStatus(windowId);
        this.updateOperationButtons(windowId);
    }

    updateSelectionStatus(windowId) {
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        const container = windowElement.querySelector('.file-manager-container');
        if (!container) return;
        
        const selectedCount = container.querySelector('.selected-count');
        if (!selectedCount) return;
        
        if (this.selectedItems.size > 0) {
            selectedCount.textContent = `${this.selectedItems.size} selected`;
        } else {
            selectedCount.textContent = '';
        }
    }

    updateOperationButtons(windowId) {
        // Find the window first
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        // Find the container within the window
        const container = windowElement.querySelector('.file-manager-container');
        if (!container) return;
        
        const hasSelection = this.selectedItems.size > 0;
        const hasClipboard = this.clipboard && this.clipboard.items && this.clipboard.items.length > 0;
        
        // Now safely find the buttons
        const copyBtn = container.querySelector('.copy-btn');
        const cutBtn = container.querySelector('.cut-btn');
        const pasteBtn = container.querySelector('.paste-btn');
        const deleteBtn = container.querySelector('.delete-btn');
        const renameBtn = container.querySelector('.rename-btn');
        
        if (copyBtn) copyBtn.disabled = !hasSelection;
        if (cutBtn) cutBtn.disabled = !hasSelection;
        if (pasteBtn) pasteBtn.disabled = !hasClipboard;
        if (deleteBtn) deleteBtn.disabled = !hasSelection;
        if (renameBtn) renameBtn.disabled = this.selectedItems.size !== 1;
    }

    setViewMode(mode, windowId) {
        this.viewMode = mode;
        const container = document.querySelector(`[data-window-id="${windowId}"]`);
        
        // Update button states
        container.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === mode);
        });
        
        this.refreshView(windowId);
    }

    getFileIcon(filename) {
        const extension = this.getFileExtension(filename).toLowerCase();
        const iconMap = {
            '.txt': '📄',
            '.html': '🌐',
            '.rtf': '📄',
            '.elxa': '💻',
            '.png': '🖼️',
            '.jpg': '🖼️',
            '.jpeg': '🖼️',
            '.gif': '🖼️',
            '.mp3': '🎵',
            '.wav': '🎵',
            '.mp4': '🎬',
            '.avi': '🎬'
        };
        return iconMap[extension] || '📄';
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
        const message = document.createElement('div');
        message.className = `system-message ${type}`;
        message.textContent = text;
        
        const colors = {
            info: { bg: '#add8e6', color: 'black' },
            success: { bg: '#00ff00', color: 'black' },
            warning: { bg: '#ffff00', color: 'black' },
            error: { bg: '#ff0000', color: 'white' }
        };
        
        message.style.cssText = `
            position: fixed;
            top: 50px;
            right: 20px;
            background: ${colors[type].bg};
            color: ${colors[type].color};
            padding: 8px 16px;
            border: 2px outset #c0c0c0;
            z-index: 3000;
            font-weight: bold;
            font-size: 11px;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    handleKeyboard(e, windowId) {
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
        }
        
        if (e.ctrlKey) {
            switch (e.key) {
                case 'c':
                    this.copySelected();
                    break;
                case 'x':
                    this.cutSelected();
                    break;
                case 'v':
                    this.paste(windowId);
                    break;
                case 'a':
                    e.preventDefault();
                    // Select all items
                    const container = document.querySelector(`[data-window-id="${windowId}"]`);
                    container.querySelectorAll('.file-item').forEach(item => {
                        item.classList.add('selected');
                        this.selectedItems.add(item.getAttribute('data-name'));
                    });
                    this.updateSelectionStatus(windowId);
                    this.updateOperationButtons(container);
                    break;
            }
        }
    }

    showContextMenu(e, windowId) {
        e.preventDefault();
        // TODO: Implement context menu
        console.log('Context menu at', e.clientX, e.clientY);
    }

    syncDesktopFiles() {
        // Get all files in the Desktop folder
        const desktopFiles = this.fileSystem.listContents(['root', 'Desktop']);
        
        // Get the desktop icons container
        const desktopIcons = document.getElementById('desktopIcons');
        if (!desktopIcons) return;
        
        // First clear existing file icons but keep system icons (careful approach)
        const systemIcons = Array.from(desktopIcons.querySelectorAll('.desktop-icon')).filter(icon => 
            ['computer', 'recycle-bin', 'notepad'].includes(icon.dataset.program)
        );
        
        // Clear the desktop icons container completely
        desktopIcons.innerHTML = '';
        
        // Add back the system icons
        systemIcons.forEach(icon => desktopIcons.appendChild(icon));
        
        // Log what we're adding
        console.log('Desktop files to sync:', desktopFiles);
        
        // Add icons for each file in the Desktop folder
        desktopFiles.forEach(file => {
            // Don't create duplicate icons for any file
            if (desktopIcons.querySelector(`.desktop-icon[data-file="${file.name}"]`)) {
                return;
            }
            
            const iconElement = document.createElement('div');
            iconElement.className = 'desktop-icon';
            iconElement.dataset.file = file.name; // Store filename for reference
            
            let icon, program;
            
            if (file.type === 'folder') {
                icon = '📁';
                program = 'folder';
                console.log('Adding folder to desktop:', file.name);
            } else {
                // Determine icon and program based on file extension
                const extension = this.getFileExtension(file.name).toLowerCase();
                switch (extension) {
                case '.lnk':
                    // Handle program shortcuts
                    try {
                        const shortcutData = JSON.parse(file.content);
                        console.log('Processing .lnk file:', file.name, shortcutData);
                        if (shortcutData.type === 'program_shortcut') {
                            icon = shortcutData.programInfo.icon;
                            program = shortcutData.programId;
                            iconElement.dataset.installed = 'true';
                            console.log('Set installed=true for:', file.name);
                        }
                    } catch (e) {
                        console.error('Error parsing .lnk file:', e);
                        icon = '📄';
                        program = 'notepad';
                    }
                    break;
                    case '.txt':
                        icon = '📄';
                        program = 'notepad';
                        break;
                    case '.html':
                        icon = '🌐';
                        program = 'notepad';
                        break;
                    case '.elxa':
                        icon = '💻';
                        program = 'elxacode';
                        break;
                    case '.png':
                    case '.jpg':
                    case '.jpeg':
                    case '.gif':
                        icon = '🖼️';
                        program = 'paint';
                        break;
                    default:
                        icon = '📄';
                        program = 'notepad';
                }
            }
            
            iconElement.dataset.program = program;
            
            // For regular files, store path information for opening
            if (file.type === 'file' && (program === 'notepad' || program === 'paint')) {
                iconElement.dataset.filepath = JSON.stringify(['root', 'Desktop', file.name]);
            }
            
            iconElement.innerHTML = `
                <div class="desktop-icon-image">${icon}</div>
                <div class="desktop-icon-label">${file.name}</div>
            `;
            
            desktopIcons.appendChild(iconElement);
        });
    }

}