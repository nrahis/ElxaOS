// =================================
// ELXAOS DEBUG TOOLS
// =================================
// Save this as: elxa-debug-tools.js

class ElxaOSDebugTools {
    constructor() {
        this.version = '1.0.0';
        console.log(`🔧 ElxaOS Debug Tools v${this.version} loaded`);
        
        // Auto-initialize when ElxaOS is ready
        if (typeof elxaOS !== 'undefined') {
            this.initialize();
        } else {
            // Wait for ElxaOS to load
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.initialize(), 1000);
            });
        }
    }

    initialize() {
        if (typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
            this.attachToElxaOS();
            console.log('🔗 Debug tools attached to elxaOS');
        }
        
        // Make tools globally available
        window.debugElxaOS = this;
        this.showAvailableCommands();
    }

    // Debug what's in localStorage
    debugStorage() {
        console.log('=== ElxaOS localStorage Debug ===');
        
        const elxaKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.toLowerCase().includes('elxa')) {
                elxaKeys.push(key);
            }
        }
        
        console.log('📦 Found ElxaOS keys:', elxaKeys);
        
        elxaKeys.forEach(key => {
            const data = localStorage.getItem(key);
            console.log(`\n📄 ${key}:`);
            console.log(`  Size: ${data ? data.length + ' characters' : 'null'}`);
            
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    if (key === 'elxaOS-files') {
                        console.log('  📁 Folders:', Object.keys(parsed.children || {}));
                        
                        // Show desktop files
                        if (parsed.children?.Desktop?.children) {
                            const desktopFiles = Object.keys(parsed.children.Desktop.children);
                            console.log('  🖥️  Desktop files:', desktopFiles);
                        }
                        
                        // Show programs folder
                        if (parsed.children?.Programs?.children) {
                            const programFiles = Object.keys(parsed.children.Programs.children);
                            console.log('  🎮 Programs folder:', programFiles);
                        }
                        
                    } else if (key === 'elxaOS-installed-programs') {
                        console.log('  🎮 Installed programs:', Object.keys(parsed));
                    }
                } catch (e) {
                    console.log('  📝 Raw data (not JSON)');
                }
            }
        });
        
        return elxaKeys;
    }

    // Clear all ElxaOS data
    clearAllStorage() {
        console.log('=== Clearing ElxaOS Storage ===');
        
        const knownKeys = [
            'elxaOS-files',
            'elxaOS-installed-programs',
            'elxaOS-theme',
            'elxaOS-user',
            'elxaOS-settings'
        ];
        
        let clearedCount = 0;
        
        // Clear known keys
        knownKeys.forEach(key => {
            if (localStorage.getItem(key) !== null) {
                localStorage.removeItem(key);
                console.log(`🗑️ Removed: ${key}`);
                clearedCount++;
            }
        });
        
        // Search for other elxa keys
        const allKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            allKeys.push(localStorage.key(i));
        }
        
        allKeys.forEach(key => {
            if (key && key.toLowerCase().includes('elxa') && !knownKeys.includes(key)) {
                localStorage.removeItem(key);
                console.log(`🗑️ Removed unknown key: ${key}`);
                clearedCount++;
            }
        });
        
        console.log(`✅ Cleared ${clearedCount} items`);
        console.log('🔄 Refresh page to reinitialize');
        
        return clearedCount;
    }

    // Backup storage
    backup() {
        console.log('=== Creating Backup ===');
        
        const backup = {
            timestamp: new Date().toISOString(),
            data: {}
        };
        
        const keys = this.debugStorage();
        
        keys.forEach(key => {
            const data = localStorage.getItem(key);
            if (data) {
                backup.data[key] = data;
            }
        });
        
        console.log('📋 Backup created:', backup);
        return backup;
    }

    // Restore from backup
    restore(backup) {
        if (!backup || !backup.data) {
            console.error('❌ Invalid backup data');
            return false;
        }
        
        console.log('=== Restoring from Backup ===');
        console.log('📅 Backup date:', backup.timestamp);
        
        Object.entries(backup.data).forEach(([key, value]) => {
            localStorage.setItem(key, value);
            console.log(`📦 Restored: ${key}`);
        });
        
        console.log('✅ Restore complete - refresh page');
        return true;
    }

    // Quick fix for Programs folder issue
    fixProgramsFolder() {
        console.log('=== Fixing Programs Folder Location ===');
        
        const filesData = localStorage.getItem('elxaOS-files');
        if (!filesData) {
            console.log('❌ No file system data found');
            return false;
        }
        
        try {
            const parsed = JSON.parse(filesData);
            
            // Check if Programs exists in Documents
            if (parsed.children?.Documents?.children?.Programs) {
                console.log('📁 Found Programs folder in Documents - moving to root');
                
                // Move to root
                parsed.children.Programs = parsed.children.Documents.children.Programs;
                delete parsed.children.Documents.children.Programs;
                
                // Save back
                localStorage.setItem('elxaOS-files', JSON.stringify(parsed));
                console.log('✅ Moved Programs folder to root level');
                console.log('🔄 Refresh page to see changes');
                return true;
            } else if (parsed.children?.Programs) {
                console.log('✅ Programs folder already at root level');
                return true;
            } else {
                console.log('❓ No Programs folder found');
                return false;
            }
        } catch (error) {
            console.error('❌ Error fixing Programs folder:', error);
            return false;
        }
    }

    // Show file system structure
    showFileTree() {
        const filesData = localStorage.getItem('elxaOS-files');
        if (!filesData) {
            console.log('❌ No file system data');
            return;
        }
        
        try {
            const parsed = JSON.parse(filesData);
            console.log('=== File System Tree ===');
            this._printTree(parsed, 0);
        } catch (error) {
            console.error('❌ Error reading file tree:', error);
        }
    }

    _printTree(node, depth) {
        const indent = '  '.repeat(depth);
        const icon = node.type === 'folder' ? '📁' : '📄';
        console.log(`${indent}${icon} ${node.name}`);
        
        if (node.children) {
            Object.values(node.children).forEach(child => {
                this._printTree(child, depth + 1);
            });
        }
    }

    // Attach methods to elxaOS for easy access
    attachToElxaOS() {
        if (typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
            elxaOS.fileSystem.debug = () => this.debugStorage();
            elxaOS.fileSystem.clearAll = () => this.clearAllStorage();
            elxaOS.fileSystem.backup = () => this.backup();
            elxaOS.fileSystem.restore = (backup) => this.restore(backup);
            elxaOS.fileSystem.fixPrograms = () => this.fixProgramsFolder();
            elxaOS.fileSystem.showTree = () => this.showFileTree();
        }
    }

    // Show available commands
    showAvailableCommands() {
        console.log(`
🔧 ELXAOS DEBUG TOOLS READY!

Direct commands:
  debugElxaOS.debugStorage()     - Show localStorage contents
  debugElxaOS.clearAllStorage()  - Clear all ElxaOS data
  debugElxaOS.backup()           - Create backup
  debugElxaOS.restore(backup)    - Restore from backup
  debugElxaOS.fixProgramsFolder() - Fix Programs folder location
  debugElxaOS.showFileTree()     - Show file system tree

Via elxaOS (if loaded):
  elxaOS.fileSystem.debug()
  elxaOS.fileSystem.clearAll()
  elxaOS.fileSystem.backup()
  elxaOS.fileSystem.fixPrograms()
  elxaOS.fileSystem.showTree()

Quick fix for your issue:
  debugElxaOS.fixProgramsFolder()
        `);
    }
}

// Initialize when script loads
const elxaOSDebugTools = new ElxaOSDebugTools();