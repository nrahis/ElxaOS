// =================================
// CORE SYSTEM - Event Bus
// =================================
class EventBus {
    constructor() {
        this.events = {};
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }
}

// =================================
// CORE SYSTEM - Window Manager (FIXED VERSION)
// =================================
class WindowManager {
    constructor() {
        this.windows = new Map();
        this.activeWindow = null;
        this.nextZIndex = 100;
        this.dragData = null;
    }

    createWindow(id, title, content, options = {}) {
        const window = document.createElement('div');
        window.className = 'window';
        window.id = `window-${id}`;
        window.style.width = options.width || '400px';
        window.style.height = options.height || '300px';
        window.style.left = options.x || '100px';
        window.style.top = options.y || '100px';

        window.innerHTML = `
            <div class="window-titlebar" data-window-id="${id}">
                <div class="window-title">${title}</div>
                <div class="window-controls">
                    <div class="window-control" data-action="minimize">−</div>
                    <div class="window-control" data-action="maximize">□</div>
                    <div class="window-control" data-action="close">×</div>
                </div>
            </div>
            <div class="window-content">${content}</div>
        `;

        document.getElementById('desktop').appendChild(window);
        
        // Store window data with original dimensions for restore
        this.windows.set(id, {
            element: window,
            title: title,
            minimized: false,
            maximized: false,
            // Store original dimensions for restore functionality
            originalDimensions: {
                width: options.width || '400px',
                height: options.height || '300px',
                left: options.x || '100px',
                top: options.y || '100px'
            }
        });

        this.setupWindowEvents(id, window);
        this.showWindow(id);
        this.focusWindow(id);

        // Add to taskbar
        this.addToTaskbar(id, title);

        return window;
    }

    setupWindowEvents(id, window) {
        const titlebar = window.querySelector('.window-titlebar');
        const controls = window.querySelectorAll('.window-control');

        // Window dragging
        titlebar.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('window-control')) return;
            this.startDrag(id, e);
        });

        // Window controls
        controls.forEach(control => {
            control.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                switch (action) {
                    case 'close':
                        this.closeWindow(id);
                        break;
                    case 'minimize':
                        this.minimizeWindow(id);
                        break;
                    case 'maximize':
                        this.toggleMaximize(id); // Changed to toggle
                        break;
                }
            });
        });

        // Focus on click
        window.addEventListener('mousedown', () => {
            this.focusWindow(id);
        });
    }

    startDrag(windowId, e) {
        const windowData = this.windows.get(windowId);
        if (!windowData || windowData.maximized) return; // Don't drag maximized windows
        
        const window = windowData.element;
        const rect = window.getBoundingClientRect();
        
        this.dragData = {
            windowId,
            startX: e.clientX,
            startY: e.clientY,
            startLeft: rect.left,
            startTop: rect.top
        };

        document.addEventListener('mousemove', this.handleDrag.bind(this));
        document.addEventListener('mouseup', this.stopDrag.bind(this));
    }

    handleDrag(e) {
        if (!this.dragData) return;

        const deltaX = e.clientX - this.dragData.startX;
        const deltaY = e.clientY - this.dragData.startY;
        
        const window = this.windows.get(this.dragData.windowId).element;
        window.style.left = (this.dragData.startLeft + deltaX) + 'px';
        window.style.top = Math.max(0, this.dragData.startTop + deltaY) + 'px';
    }

    stopDrag() {
        this.dragData = null;
        document.removeEventListener('mousemove', this.handleDrag.bind(this));
        document.removeEventListener('mouseup', this.stopDrag.bind(this));
    }

    showWindow(id) {
        const windowData = this.windows.get(id);
        if (windowData) {
            windowData.element.style.display = 'flex';
            windowData.minimized = false;
            this.updateTaskbarButton(id);
        }
    }

    hideWindow(id) {
        const windowData = this.windows.get(id);
        if (windowData) {
            windowData.element.style.display = 'none';
        }
    }

    closeWindow(id) {
        const windowData = this.windows.get(id);
        if (windowData) {
            windowData.element.remove();
            this.windows.delete(id);
            this.removeFromTaskbar(id);
            
            if (this.activeWindow === id) {
                this.activeWindow = null;
            }
            
            elxaOS.eventBus.emit('window.closed', { id });
        }
    }

    minimizeWindow(id) {
        this.hideWindow(id);
        const windowData = this.windows.get(id);
        if (windowData) {
            windowData.minimized = true;
            this.updateTaskbarButton(id);
        }
    }

    // NEW: Toggle maximize/restore functionality
    toggleMaximize(id) {
        const windowData = this.windows.get(id);
        if (!windowData) return;

        if (windowData.maximized) {
            this.restoreWindow(id);
        } else {
            this.maximizeWindow(id);
        }
    }

    maximizeWindow(id) {
        const windowData = this.windows.get(id);
        if (windowData && !windowData.maximized) {
            const window = windowData.element;
            
            // Store current dimensions before maximizing
            const rect = window.getBoundingClientRect();
            windowData.originalDimensions = {
                width: window.style.width || rect.width + 'px',
                height: window.style.height || rect.height + 'px',
                left: window.style.left || rect.left + 'px',
                top: window.style.top || rect.top + 'px'
            };
            
            // Maximize
            window.style.left = '0px';
            window.style.top = '0px';
            window.style.width = '100vw';
            window.style.height = 'calc(100vh - 30px)';
            windowData.maximized = true;
            
            // Update maximize button appearance
            const maximizeBtn = window.querySelector('[data-action="maximize"]');
            if (maximizeBtn) {
                maximizeBtn.textContent = '❐'; // Different symbol for restore
            }
        }
    }

    // NEW: Restore window to original size
    restoreWindow(id) {
        const windowData = this.windows.get(id);
        if (windowData && windowData.maximized) {
            const window = windowData.element;
            const original = windowData.originalDimensions;
            
            // Restore original dimensions
            window.style.width = original.width;
            window.style.height = original.height;
            window.style.left = original.left;
            window.style.top = original.top;
            windowData.maximized = false;
            
            // Update maximize button appearance
            const maximizeBtn = window.querySelector('[data-action="maximize"]');
            if (maximizeBtn) {
                maximizeBtn.textContent = '□'; // Back to maximize symbol
            }
        }
    }

    focusWindow(id) {
        // Remove active class from all windows
        this.windows.forEach((windowData, windowId) => {
            windowData.element.classList.remove('active');
            windowData.element.querySelector('.window-titlebar').classList.add('inactive');
        });

        // Add active class to focused window
        const windowData = this.windows.get(id);
        if (windowData) {
            windowData.element.classList.add('active');
            windowData.element.style.zIndex = this.nextZIndex++;
            windowData.element.querySelector('.window-titlebar').classList.remove('inactive');
            this.activeWindow = id;
        }
    }

    addToTaskbar(id, title) {
        const taskbarPrograms = document.getElementById('taskbarPrograms');
        const button = document.createElement('div');
        button.className = 'taskbar-program';
        button.id = `taskbar-${id}`;
        button.textContent = title;
        
        button.addEventListener('click', () => {
            const windowData = this.windows.get(id);
            if (windowData.minimized) {
                this.showWindow(id);
                this.focusWindow(id);
            } else if (this.activeWindow === id) {
                this.minimizeWindow(id);
            } else {
                this.focusWindow(id);
            }
        });

        taskbarPrograms.appendChild(button);
    }

    removeFromTaskbar(id) {
        const button = document.getElementById(`taskbar-${id}`);
        if (button) {
            button.remove();
        }
    }

    updateTaskbarButton(id) {
        const button = document.getElementById(`taskbar-${id}`);
        const windowData = this.windows.get(id);
        
        if (button && windowData) {
            if (windowData.minimized) {
                button.classList.remove('active');
            } else if (this.activeWindow === id) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        }
    }
}

// =================================
// CORE SYSTEM - File System (FIXED VERSION)
// =================================
class FileSystem {
    constructor() {
        this.root = {
            type: 'folder',
            name: 'root',
            children: {
                'Desktop': { type: 'folder', name: 'Desktop', children: {} },
                'Programs': { type: 'folder', name: 'Programs', children: {} },
                'Documents': { type: 'folder', name: 'Documents', children: {} },
                'Pictures': { type: 'folder', name: 'Pictures', children: {} },
                'RecycleBin': { type: 'folder', name: 'Recycle Bin', children: {} }
            }
        };
        this.currentPath = ['root'];
        this.loadFromStorage();
    }

    createFile(path, name, content, type = 'txt') {
        const folder = this.getFolder(path);
        if (folder) {
            folder.children[name] = {
                type: 'file',
                name: name,
                content: content,
                fileType: type,
                created: new Date(),
                modified: new Date()
            };
            
            // SAVE TO STORAGE AFTER CREATING FILE
            this.saveToStorage();
            
            // Emit event when file is created
            if (elxaOS && elxaOS.eventBus) {
                elxaOS.eventBus.emit('file.created', { path, name });
                
                // Special handling for Desktop folder
                if (path.length === 2 && path[1] === 'Desktop') {
                    elxaOS.eventBus.emit('desktop.changed');
                }
            }
            
            return true;
        }
        return false;
    }

    createFolder(path, name) {
        const folder = this.getFolder(path);
        if (folder) {
            folder.children[name] = {
                type: 'folder',
                name: name,
                children: {},
                created: new Date()
            };
            
            // SAVE TO STORAGE AFTER CREATING FOLDER
            this.saveToStorage();
            
            // Emit event when folder is created
            if (elxaOS && elxaOS.eventBus) {
                elxaOS.eventBus.emit('folder.created', { path, name });
                
                // Special handling for Desktop folder
                if (path.length === 2 && path[1] === 'Desktop') {
                    elxaOS.eventBus.emit('desktop.changed');
                }
            }
            
            return true;
        }
        return false;
    }

    getFolder(path) {
        let current = this.root;
        for (let i = 1; i < path.length; i++) {
            if (current.children[path[i]]) {
                current = current.children[path[i]];
            } else {
                return null;
            }
        }
        return current;
    }

    getFile(path, filename) {
        const folder = this.getFolder(path);
        return folder ? folder.children[filename] : null;
    }

    deleteItem(path, name) {
        const folder = this.getFolder(path);
        if (folder && folder.children[name]) {
            const item = folder.children[name];
            // Move to recycle bin
            this.root.children['RecycleBin'].children[name] = item;
            delete folder.children[name];
            
            // SAVE TO STORAGE AFTER DELETING
            this.saveToStorage();
            
            // Emit event when item is deleted
            if (elxaOS && elxaOS.eventBus) {
                elxaOS.eventBus.emit('item.deleted', { path, name });
                
                // Special handling for Desktop folder
                if (path.length === 2 && path[1] === 'Desktop') {
                    elxaOS.eventBus.emit('desktop.changed');
                }
            }
            
            return true;
        }
        return false;
    }

    // NEW METHOD: Update file content (for when Notepad saves)
    updateFileContent(path, filename, newContent) {
        const file = this.getFile(path, filename);
        if (file && file.type === 'file') {
            file.content = newContent;
            file.modified = new Date();
            
            // SAVE TO STORAGE AFTER UPDATING
            this.saveToStorage();
            
            return true;
        }
        return false;
    }

    // NEW METHOD: Rename file or folder
    renameItem(path, oldName, newName) {
        const folder = this.getFolder(path);
        if (folder && folder.children[oldName] && !folder.children[newName]) {
            const item = folder.children[oldName];
            item.name = newName;
            folder.children[newName] = item;
            delete folder.children[oldName];
            
            // SAVE TO STORAGE AFTER RENAMING
            this.saveToStorage();
            
            return true;
        }
        return false;
    }

    listContents(path) {
        const folder = this.getFolder(path);
        return folder ? Object.values(folder.children) : [];
    }

    saveToStorage() {
        try {
            localStorage.setItem('elxaOS-files', JSON.stringify(this.root));
            console.log('💾 FileSystem saved to localStorage');
        } catch (error) {
            console.error('❌ Failed to save to localStorage:', error);
        }
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('elxaOS-files');
            if (saved) {
                this.root = JSON.parse(saved);
                
                // FIX: Convert date strings back to Date objects
                this.restoreDateObjects(this.root);
                
                console.log('📂 FileSystem loaded from localStorage');
            } else {
                console.log('📂 No saved FileSystem found, using defaults');
            }
        } catch (error) {
            console.error('❌ Failed to load from localStorage:', error);
        }
    }

    // NEW METHOD: Clear all data (for testing)
    clearStorage() {
        localStorage.removeItem('elxaOS-files');
        console.log('🗑️ FileSystem storage cleared');
    }

    // NEW METHOD: Recursively restore Date objects from strings
    restoreDateObjects(node) {
        if (node.type === 'file') {
            // Convert date strings back to Date objects
            if (node.created && typeof node.created === 'string') {
                node.created = new Date(node.created);
            }
            if (node.modified && typeof node.modified === 'string') {
                node.modified = new Date(node.modified);
            }
        } else if (node.type === 'folder') {
            // Convert folder dates
            if (node.created && typeof node.created === 'string') {
                node.created = new Date(node.created);
            }
            
            // Recursively process all children
            if (node.children) {
                Object.values(node.children).forEach(child => {
                    this.restoreDateObjects(child);
                });
            }
        }
    }

    // ALTERNATIVE: Safe date display method (add this as a helper)
    formatDate(dateValue) {
        if (!dateValue) return 'Unknown';
        
        // If it's already a Date object
        if (dateValue instanceof Date) {
            return dateValue.toLocaleDateString();
        }
        
        // If it's a string, try to convert it
        if (typeof dateValue === 'string') {
            try {
                return new Date(dateValue).toLocaleDateString();
            } catch (e) {
                return 'Unknown';
            }
        }
        
        return 'Unknown';
    }

    clearStorage() {
        localStorage.removeItem('elxaOS-files');
        console.log('🗑️ FileSystem storage cleared');
    }
}