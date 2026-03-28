// =================================
// ELXAOS DEBUG TOOLS (Updated for IndexedDB)
// =================================

class ElxaOSDebugTools {
    constructor() {
        this.version = '2.0.0';
        console.log(`🔧 ElxaOS Debug Tools v${this.version} loaded`);

        if (typeof elxaOS !== 'undefined') {
            this.initialize();
        } else {
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

        window.debugElxaOS = this;
        this.showAvailableCommands();
    }

    // Show what's stored in IndexedDB and localStorage
    async debugStorage() {
        console.log('=== ElxaOS Storage Debug ===');

        // IndexedDB keys
        try {
            const idbKeys = await elxaDB.keys();
            console.log('📦 IndexedDB keys:', idbKeys);
        } catch (e) {
            console.log('📦 IndexedDB: not available or not open');
        }

        // localStorage keys (for non-migrated data)
        const lsKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.toLowerCase().includes('elxa')) {
                lsKeys.push(key);
            }
        }
        if (lsKeys.length > 0) {
            console.log('📦 localStorage keys (legacy):', lsKeys);
            lsKeys.forEach(key => {
                const data = localStorage.getItem(key);
                console.log(`  ${key}: ${data ? data.length + ' chars' : 'null'}`);
            });
        } else {
            console.log('📦 localStorage: no ElxaOS keys (fully migrated)');
        }

        // In-memory filesystem summary
        if (typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
            const fs = elxaOS.fileSystem;
            console.log('\n📁 In-memory FileSystem:');
            console.log('  Root folders:', Object.keys(fs.root.children || {}));
            console.log('  Ready:', fs.ready);
            if (fs.root.children?.Desktop?.children) {
                console.log('  Desktop files:', Object.keys(fs.root.children.Desktop.children));
            }
            if (fs.root.children?.Programs?.children) {
                console.log('  Programs:', Object.keys(fs.root.children.Programs.children));
            }
        }
    }

    // Clear all ElxaOS data from both IndexedDB and localStorage
    async clearAllStorage() {
        console.log('=== Clearing All ElxaOS Storage ===');

        // Clear IndexedDB
        try {
            await elxaDB.clear();
            console.log('🗑️ IndexedDB cleared');
        } catch (e) {
            console.log('⚠️ Could not clear IndexedDB:', e);
        }

        // Clear localStorage
        const allKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            allKeys.push(localStorage.key(i));
        }
        let clearedCount = 0;
        allKeys.forEach(key => {
            if (key && key.toLowerCase().includes('elxa')) {
                localStorage.removeItem(key);
                console.log(`🗑️ Removed localStorage: ${key}`);
                clearedCount++;
            }
        });

        // Also clear messenger settings
        localStorage.removeItem('snakesia-messenger-settings');

        console.log(`✅ Cleared IndexedDB + ${clearedCount} localStorage items`);
        console.log('🔄 Refresh page to reinitialize');
    }

    // Backup — reads from the in-memory tree (source of truth)
    backup() {
        console.log('=== Creating Backup ===');

        if (typeof elxaOS === 'undefined' || !elxaOS.fileSystem) {
            console.error('❌ ElxaOS not loaded');
            return null;
        }

        const backup = {
            timestamp: new Date().toISOString(),
            version: 2,
            filesystem: JSON.parse(JSON.stringify(elxaOS.fileSystem.root)),
        };

        // Also grab localStorage settings
        backup.settings = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.toLowerCase().includes('elxa') && key !== 'elxaOS-files') {
                backup.settings[key] = localStorage.getItem(key);
            }
        }

        console.log('📋 Backup created:', backup);
        return backup;
    }

    // Restore from backup
    async restore(backup) {
        if (!backup) {
            console.error('❌ No backup data provided');
            return false;
        }

        console.log('=== Restoring from Backup ===');
        console.log('📅 Backup date:', backup.timestamp);

        // v2 backup (IndexedDB era)
        if (backup.version === 2 && backup.filesystem) {
            if (typeof elxaOS !== 'undefined' && elxaOS.fileSystem) {
                elxaOS.fileSystem.root = backup.filesystem;
                elxaOS.fileSystem.restoreDateObjects(elxaOS.fileSystem.root);
                elxaOS.fileSystem.saveToStorage();
                console.log('📦 FileSystem restored');
            }
            if (backup.settings) {
                Object.entries(backup.settings).forEach(([key, value]) => {
                    localStorage.setItem(key, value);
                    console.log(`📦 Restored setting: ${key}`);
                });
            }
        }
        // v1 backup (localStorage era)
        else if (backup.data) {
            Object.entries(backup.data).forEach(([key, value]) => {
                if (key === 'elxaOS-files' && typeof elxaOS !== 'undefined') {
                    // Put filesystem into memory + IndexedDB
                    elxaOS.fileSystem.root = JSON.parse(value);
                    elxaOS.fileSystem.restoreDateObjects(elxaOS.fileSystem.root);
                    elxaOS.fileSystem.saveToStorage();
                    console.log('📦 Migrated v1 FileSystem to IndexedDB');
                } else {
                    localStorage.setItem(key, value);
                    console.log(`📦 Restored: ${key}`);
                }
            });
        }

        console.log('✅ Restore complete — refresh page');
        return true;
    }

    // Show file system tree (reads from memory, not storage)
    showFileTree() {
        if (typeof elxaOS === 'undefined' || !elxaOS.fileSystem) {
            console.log('❌ ElxaOS not loaded');
            return;
        }

        console.log('=== File System Tree ===');
        this._printTree(elxaOS.fileSystem.root, 0);
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

    // Fix Programs folder location
    fixProgramsFolder() {
        if (typeof elxaOS === 'undefined' || !elxaOS.fileSystem) {
            console.log('❌ ElxaOS not loaded');
            return false;
        }

        const root = elxaOS.fileSystem.root;

        if (root.children?.Documents?.children?.Programs) {
            console.log('📁 Found Programs in Documents — moving to root');
            root.children.Programs = root.children.Documents.children.Programs;
            delete root.children.Documents.children.Programs;
            elxaOS.fileSystem.saveToStorage();
            console.log('✅ Moved. Refresh page to see changes.');
            return true;
        } else if (root.children?.Programs) {
            console.log('✅ Programs folder already at root');
            return true;
        } else {
            console.log('❓ No Programs folder found');
            return false;
        }
    }

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

    showAvailableCommands() {
        console.log(`
🔧 ELXAOS DEBUG TOOLS v${this.version} READY!

  debugElxaOS.debugStorage()       — Show IndexedDB + localStorage contents
  debugElxaOS.clearAllStorage()    — Clear ALL ElxaOS data
  debugElxaOS.backup()             — Create backup from memory
  debugElxaOS.restore(backup)      — Restore from backup (v1 or v2)
  debugElxaOS.fixProgramsFolder()  — Fix Programs folder location
  debugElxaOS.showFileTree()       — Print file system tree
        `);
    }
}

const elxaOSDebugTools = new ElxaOSDebugTools();
