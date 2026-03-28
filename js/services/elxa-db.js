// =================================
// ElxaDB — IndexedDB wrapper for ElxaOS persistence
// =================================
// Replaces localStorage with IndexedDB for larger storage limits.
// Provides a simple async key-value API so the rest of the codebase
// doesn't need to deal with IndexedDB's callback-heavy native API.

class ElxaDB {
    constructor(dbName = 'ElxaOS', version = 1) {
        this.dbName = dbName;
        this.version = version;
        this.db = null;
    }

    // Open (or create) the database. Call once at startup.
    open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // Single key-value object store — mirrors localStorage simplicity
                if (!db.objectStoreNames.contains('keyval')) {
                    db.createObjectStore('keyval');
                }
                console.log('📦 ElxaDB: database created/upgraded');
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('📦 ElxaDB: database opened');
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error('❌ ElxaDB: failed to open database', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Get a value by key. Returns the value or null if not found.
    get(key) {
        return new Promise((resolve, reject) => {
            if (!this.db) { resolve(null); return; }

            const tx = this.db.transaction('keyval', 'readonly');
            const store = tx.objectStore('keyval');
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result !== undefined ? request.result : null);
            request.onerror = () => reject(request.error);
        });
    }

    // Store a value at a key. Value can be any structured-cloneable object
    // (objects, arrays, Dates, Blobs, etc. — no need for JSON.stringify).
    put(key, value) {
        return new Promise((resolve, reject) => {
            if (!this.db) { reject(new Error('DB not open')); return; }

            const tx = this.db.transaction('keyval', 'readwrite');
            const store = tx.objectStore('keyval');
            const request = store.put(value, key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Delete a key.
    delete(key) {
        return new Promise((resolve, reject) => {
            if (!this.db) { reject(new Error('DB not open')); return; }

            const tx = this.db.transaction('keyval', 'readwrite');
            const store = tx.objectStore('keyval');
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Get all keys in the store.
    keys() {
        return new Promise((resolve, reject) => {
            if (!this.db) { resolve([]); return; }

            const tx = this.db.transaction('keyval', 'readonly');
            const store = tx.objectStore('keyval');
            const request = store.getAllKeys();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Clear everything in the store.
    clear() {
        return new Promise((resolve, reject) => {
            if (!this.db) { reject(new Error('DB not open')); return; }

            const tx = this.db.transaction('keyval', 'readwrite');
            const store = tx.objectStore('keyval');
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// Single global instance
const elxaDB = new ElxaDB();
