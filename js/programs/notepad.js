// =================================
// PROFESSIONAL RICH TEXT NOTEPAD - WORDPAD STYLE (FIXED)
// =================================
// TODO: document.execCommand() is deprecated and may break in future browsers.
// A future rewrite should migrate to the InputEvent API or custom Selection/Range
// manipulation for formatting (bold, italic, fontSize, fontName, foreColor, etc.).
class NotepadProgram {
    constructor(windowManager, fileSystem, eventBus) {
        this.windowManager = windowManager;
        this.fileSystem = fileSystem;
        this.eventBus = eventBus;
        this.documents = new Map();
        this.activeDocumentId = null;
        this.documentCounter = 0;
        
        // Add this property to track original file paths
        this.documentPaths = new Map();
        
        // Store formatting state per document instead of globally
        this.documentFormats = new Map();
        
        // Default format template
        this.defaultFormat = {
            fontFamily: 'Arial',
            fontSize: 14,
            bold: false,
            italic: false,
            underline: false,
            color: '#000000',
            backgroundColor: 'transparent'
        };
        
        // Available fonts
        this.fonts = [
            'Arial',
            'Times New Roman', 
            'Courier New',
            'Comic Sans MS',
            'Impact',
            'Georgia',
            'Trebuchet MS',
            'Verdana',
            'Tahoma',
            'Helvetica'
        ];
        
        this.colors = [
            { name: 'Black', value: '#000000' },
            { name: 'Red', value: '#FF0000' },
            { name: 'Green', value: '#008000' },
            { name: 'Blue', value: '#0000FF' },
            { name: 'Purple', value: '#800080' },
            { name: 'Orange', value: '#FFA500' },
            { name: 'Pink', value: '#FFC0CB' },
            { name: 'Cyan', value: '#00FFFF' },
            { name: 'Yellow', value: '#FFFF00' },
            { name: 'Brown', value: '#8B4513' }
        ];
    }

    launch() {
        this.createNewDocument();
    }

    createNewDocument(content = '', filename = null) {
        this.documentCounter++;
        const documentId = `notepad-${Date.now()}-${this.documentCounter}`;
        const title = filename || `Untitled Document ${this.documentCounter}`;
        
        const document = {
            id: documentId,
            filename: filename,
            content: content,
            saved: filename ? true : false,
            cursorPosition: 0,
            hasUserFormatting: false // Track if user has actually applied formatting
        };
        
        this.documents.set(documentId, document);
        this.activeDocumentId = documentId;
        
        // Reset formatting for new document
        this.documentFormats.set(documentId, { ...this.defaultFormat });
        
        const windowContent = this.createNotepadInterface(documentId);
        
        const win = this.windowManager.createWindow(
            documentId,
            `${ElxaIcons.render('notepad', 'ui')} ${title}`,
            windowContent,
            { width: '900px', height: '700px', x: '50px', y: '50px' }
        );
        
        this.setupEventHandlers(documentId);
        this.updateDisplay(documentId);
        
        return documentId;
    }

    getCurrentFormat(documentId) {
        return this.documentFormats.get(documentId) || { ...this.defaultFormat };
    }

    setCurrentFormat(documentId, format) {
        this.documentFormats.set(documentId, format);
    }

    applySpecificFormatting(documentId, command, value) {
        const selection = window.getSelection();
        
        if (selection.rangeCount === 0) {
            this.updateToolbarState(documentId);
            return;
        }
        
        // Make sure focus is inside the text area before executing commands
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const textArea = container.querySelector('.text-area');
        if (!textArea.contains(selection.anchorNode) && selection.anchorNode !== textArea) {
            // Restore the saved selection if we have one (e.g. after using a <select>)
            if (this._savedRange) {
                this.restoreSelection(this._savedRange);
            } else {
                textArea.focus();
            }
        }
        
        const hasSelection = selection.toString().length > 0;
        
        // Mark that user has applied formatting (only if there's selected text)
        if (hasSelection) {
            const doc = this.documents.get(documentId);
            doc.hasUserFormatting = true;
        }
        
        // Apply the formatting command — works both with selected text
        // AND at an empty cursor (sets format for next typed characters)
        if (command === 'bold' || command === 'italic' || command === 'underline') {
            document.execCommand(command, false, null);
        } else if (command === 'fontName') {
            document.execCommand('fontName', false, value);
        } else if (command === 'fontSize') {
            document.execCommand('fontSize', false, value);
        } else if (command === 'foreColor') {
            document.execCommand('foreColor', false, value);
        } else if (command === 'hiliteColor' || command === 'backColor') {
            document.execCommand(command, false, value);
        }
        
        // If text was selected, re-read formatting from the DOM after a tick.
        // If no text was selected, the caller already updated internal state —
        // don't let updateToolbarFromSelection overwrite it from the (unchanged) DOM.
        if (hasSelection) {
            setTimeout(() => this.updateToolbarFromSelection(documentId), 10);
        }
    }

    // --- Selection save/restore (for toolbar controls that steal focus) ---
    saveSelection() {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            return sel.getRangeAt(0).cloneRange();
        }
        return null;
    }

    restoreSelection(range) {
        if (range) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }

    createNotepadInterface(documentId) {
        return `
            <div class="notepad-pro" data-document-id="${documentId}">
                <!-- Toolbar -->
                <div class="toolbar">
                    <div class="toolbar-section">
                        <button class="tool-btn" data-action="new" title="New" onmousedown="event.preventDefault()">${ElxaIcons.renderAction('new-file')}</button>
                        <button class="tool-btn" data-action="open" title="Open" onmousedown="event.preventDefault()">${ElxaIcons.renderAction('open')}</button>
                        <button class="tool-btn" data-action="save" title="Save" onmousedown="event.preventDefault()">${ElxaIcons.renderAction('save')}</button>
                        <button class="tool-btn" data-action="saveas" title="Save As" onmousedown="event.preventDefault()">${ElxaIcons.renderAction('save')}</button>
                        <div class="separator"></div>
                        <button class="tool-btn" data-action="undo" title="Undo" onmousedown="event.preventDefault()">${ElxaIcons.renderAction('undo')}</button>
                        <button class="tool-btn" data-action="redo" title="Redo" onmousedown="event.preventDefault()">${ElxaIcons.renderAction('redo')}</button>
                    </div>
                    
                    <div class="toolbar-section">
                        <select class="font-select">
                            ${this.fonts.map(font => 
                                `<option value="${font}" ${font === 'Arial' ? 'selected' : ''}>${font}</option>`
                            ).join('')}
                        </select>
                        
                        <select class="size-select">
                            ${[8,9,10,11,12,14,16,18,20,24,28,32,36,48,72].map(size => 
                                `<option value="${size}" ${size === 14 ? 'selected' : ''}>${size}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="toolbar-section">
                        <button class="format-btn bold-btn" data-format="bold" title="Bold" onmousedown="event.preventDefault()">${ElxaIcons.renderAction('bold')}</button>
                        <button class="format-btn italic-btn" data-format="italic" title="Italic" onmousedown="event.preventDefault()">${ElxaIcons.renderAction('italic')}</button>
                        <button class="format-btn underline-btn" data-format="underline" title="Underline" onmousedown="event.preventDefault()">${ElxaIcons.renderAction('underline')}</button>
                        
                        <div class="color-picker-wrapper">
                            <button class="color-btn text-color-btn" title="Text Color" onmousedown="event.preventDefault()">${ElxaIcons.renderAction('text-color')}</button>
                            <div class="color-palette text-color-palette">
                                ${this.colors.map(color => 
                                    `<div class="color-swatch" data-color="${color.value}" style="background: ${color.value}" title="${color.name}" onmousedown="event.preventDefault()"></div>`
                                ).join('')}
                            </div>
                        </div>
                        
                        <div class="color-picker-wrapper">
                            <button class="color-btn bg-color-btn" title="Highlight" onmousedown="event.preventDefault()">${ElxaIcons.renderAction('highlight')}</button>
                            <div class="color-palette bg-color-palette">
                                <div class="color-swatch" data-color="transparent" style="background: white; border: 2px solid #333;" title="Remove highlight" onmousedown="event.preventDefault()">×</div>
                                ${this.colors.filter(c => c.name !== 'Black').map(color => 
                                    `<div class="color-swatch" data-color="${color.value}" style="background: ${color.value}" title="${color.name}" onmousedown="event.preventDefault()"></div>`
                                ).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Editor Area -->
                <div class="editor-container">
                    <div class="ruler"></div>
                    <div class="text-area" 
                         contenteditable="true" 
                         data-document-id="${documentId}"
                         spellcheck="false">
                    </div>
                </div>
                
                <!-- Status Bar -->
                <div class="status-bar">
                    <span class="status-text">Ready</span>
                    <span class="word-count">Words: 0 | Characters: 0</span>
                </div>
            </div>
        `;
    }

    setupEventHandlers(documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const textArea = container.querySelector('.text-area');
        
        // Toolbar actions
        container.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleAction(btn.dataset.action, documentId);
            });
        });
        
        // Font selection — save caret before the <select> steals focus
        const fontSelect = container.querySelector('.font-select');
        fontSelect.addEventListener('focus', () => {
            this._savedRange = this.saveSelection();
        });
        fontSelect.addEventListener('change', (e) => {
            const currentFormat = this.getCurrentFormat(documentId);
            currentFormat.fontFamily = e.target.value;
            this.setCurrentFormat(documentId, currentFormat);
            this.restoreSelection(this._savedRange);
            this.applySpecificFormatting(documentId, 'fontName', e.target.value);
            this._savedRange = null;
            this.updateToolbarState(documentId);
        });
        
        // Size selection — save caret before the <select> steals focus
        const sizeSelect = container.querySelector('.size-select');
        sizeSelect.addEventListener('focus', () => {
            this._savedRange = this.saveSelection();
        });
        sizeSelect.addEventListener('change', (e) => {
            const currentFormat = this.getCurrentFormat(documentId);
            currentFormat.fontSize = parseInt(e.target.value);
            this.setCurrentFormat(documentId, currentFormat);
            this.restoreSelection(this._savedRange);
            this.applySpecificFormatting(documentId, 'fontSize', this.convertFontSize(parseInt(e.target.value)));
            this._savedRange = null;
            this.updateToolbarState(documentId);
        });
        
        // Format buttons
        container.querySelectorAll('[data-format]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.toggleFormat(btn.dataset.format, documentId);
            });
        });
        
        // Color pickers
        this.setupColorPickers(container, documentId);
        
        // Text area events - SIMPLIFIED AND FIXED
        textArea.addEventListener('input', (e) => {
            // Don't apply automatic formatting - just update counters and save state
            this.updateWordCount(documentId);
            this.markUnsaved(documentId);
        });
        
        textArea.addEventListener('keydown', (e) => {
            this.handleKeyDown(e, documentId);
        });
        
        textArea.addEventListener('paste', (e) => {
            this.handlePaste(e, documentId);
        });
        
        // Update toolbar when selection changes
        textArea.addEventListener('mouseup', () => {
            setTimeout(() => this.updateToolbarFromSelection(documentId), 10);
        });
        
        textArea.addEventListener('keyup', () => {
            setTimeout(() => this.updateToolbarFromSelection(documentId), 10);
        });
        
        // Focus the text area
        textArea.focus();
    }

    setupColorPickers(container, documentId) {
        // Text color
        const textColorBtn = container.querySelector('.text-color-btn');
        const textColorPalette = container.querySelector('.text-color-palette');
        
        textColorBtn.addEventListener('click', () => {
            textColorPalette.style.display = textColorPalette.style.display === 'block' ? 'none' : 'block';
        });
        
        textColorPalette.addEventListener('click', (e) => {
            if (e.target.classList.contains('color-swatch')) {
                const currentFormat = this.getCurrentFormat(documentId);
                currentFormat.color = e.target.dataset.color;
                this.setCurrentFormat(documentId, currentFormat);
                this.applySpecificFormatting(documentId, 'foreColor', e.target.dataset.color);
                textColorPalette.style.display = 'none';
            }
        });
        
        // Background color
        const bgColorBtn = container.querySelector('.bg-color-btn');
        const bgColorPalette = container.querySelector('.bg-color-palette');
        
        bgColorBtn.addEventListener('click', () => {
            bgColorPalette.style.display = bgColorPalette.style.display === 'block' ? 'none' : 'block';
        });
        
        bgColorPalette.addEventListener('click', (e) => {
            if (e.target.classList.contains('color-swatch')) {
                const currentFormat = this.getCurrentFormat(documentId);
                currentFormat.backgroundColor = e.target.dataset.color;
                this.setCurrentFormat(documentId, currentFormat);
                
                if (e.target.dataset.color === 'transparent') {
                    this.applySpecificFormatting(documentId, 'hiliteColor', 'transparent');
                    this.applySpecificFormatting(documentId, 'backColor', 'transparent');
                } else {
                    this.applySpecificFormatting(documentId, 'hiliteColor', e.target.dataset.color);
                }
                bgColorPalette.style.display = 'none';
            }
        });
        
        // Close palettes when clicking elsewhere (scoped to avoid leaks)
        const closePalettes = (e) => {
            if (!e.target.closest('.color-picker-wrapper')) {
                textColorPalette.style.display = 'none';
                bgColorPalette.style.display = 'none';
            }
        };
        document.addEventListener('click', closePalettes);
        
        // Clean up on window close
        this.eventBus.on('window.closed', (data) => {
            if (data.id === documentId) {
                document.removeEventListener('click', closePalettes);
            }
        });
    }

    handleKeyDown(e, documentId) {
        // Handle TAB key
        if (e.key === 'Tab') {
            e.preventDefault();
            // Insert 4 spaces for tab
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const tabText = document.createTextNode('    '); // 4 spaces
                range.deleteContents();
                range.insertNode(tabText);
                range.setStartAfter(tabText);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
            }
            return;
        }
        
        if (e.ctrlKey) {
            switch(e.key) {
                case 'b':
                    e.preventDefault();
                    this.toggleFormat('bold', documentId);
                    break;
                case 'i':
                    e.preventDefault();
                    this.toggleFormat('italic', documentId);
                    break;
                case 'u':
                    e.preventDefault();
                    this.toggleFormat('underline', documentId);
                    break;
                case 's':
                    e.preventDefault();
                    this.handleAction('save', documentId);
                    break;
            }
        }
    }

    handlePaste(e, documentId) {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        
        // Use browser's built-in command to insert text
        document.execCommand('insertText', false, text);
        
        // Mark as unsaved
        this.markUnsaved(documentId);
    }

    toggleFormat(type, documentId) {
        const currentFormat = this.getCurrentFormat(documentId);
        currentFormat[type] = !currentFormat[type];
        this.setCurrentFormat(documentId, currentFormat);
        
        // Apply only the specific formatting that was toggled
        this.applySpecificFormatting(documentId, type, currentFormat[type]);
        this.updateToolbarState(documentId);
    }

    convertFontSize(size) {
        // Convert pixel size to HTML font size (1-7)
        if (size <= 10) return 1;
        if (size <= 12) return 2;
        if (size <= 14) return 3;
        if (size <= 18) return 4;
        if (size <= 24) return 5;
        if (size <= 32) return 6;
        return 7;
    }

    updateToolbarFromSelection(documentId) {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        if (!container) return;
        const textArea = container.querySelector('.text-area');
        
        // Only read from DOM if the selection is actually inside the text area
        const range = selection.getRangeAt(0);
        if (!textArea.contains(range.startContainer)) return;
        
        let element = range.startContainer;
        if (element.nodeType === Node.TEXT_NODE) {
            element = element.parentElement;
        }
        
        const currentFormat = this.getCurrentFormat(documentId);
        
        // Read current formatting from DOM
        const computedStyle = window.getComputedStyle(element);
        
        currentFormat.bold = computedStyle.fontWeight === 'bold' || computedStyle.fontWeight >= 700;
        currentFormat.italic = computedStyle.fontStyle === 'italic';
        currentFormat.underline = computedStyle.textDecoration.includes('underline');
        currentFormat.fontFamily = computedStyle.fontFamily.replace(/"/g, '').split(',')[0].trim();
        currentFormat.color = this.rgbToHex(computedStyle.color);
        
        // Snap computed font size to the nearest available dropdown value
        const computedSize = parseInt(computedStyle.fontSize);
        const sizeOptions = [8,9,10,11,12,14,16,18,20,24,28,32,36,48,72];
        currentFormat.fontSize = sizeOptions.reduce((prev, curr) =>
            Math.abs(curr - computedSize) < Math.abs(prev - computedSize) ? curr : prev
        );
        
        const bgColor = computedStyle.backgroundColor;
        if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
            currentFormat.backgroundColor = 'transparent';
        } else {
            currentFormat.backgroundColor = this.rgbToHex(bgColor);
        }
        
        this.setCurrentFormat(documentId, currentFormat);
        this.updateToolbarState(documentId);
    }

    rgbToHex(rgb) {
        if (rgb.startsWith('#')) return rgb;
        
        const result = rgb.match(/\d+/g);
        if (!result) return '#000000';
        
        const r = parseInt(result[0]);
        const g = parseInt(result[1]);
        const b = parseInt(result[2]);
        
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    updateToolbarState(documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        if (!container) return;
        const currentFormat = this.getCurrentFormat(documentId);
        
        // Update format buttons
        container.querySelector('.bold-btn').classList.toggle('active', currentFormat.bold);
        container.querySelector('.italic-btn').classList.toggle('active', currentFormat.italic);
        container.querySelector('.underline-btn').classList.toggle('active', currentFormat.underline);
        
        // Update selects
        container.querySelector('.font-select').value = currentFormat.fontFamily;
        container.querySelector('.size-select').value = currentFormat.fontSize;
        
        // Update color indicators
        container.querySelector('.text-color-btn').style.borderBottom = `3px solid ${currentFormat.color}`;
        
        if (currentFormat.backgroundColor !== 'transparent') {
            container.querySelector('.bg-color-btn').style.background = currentFormat.backgroundColor;
        } else {
            container.querySelector('.bg-color-btn').style.background = '';
        }
    }

    updateDisplay(documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const textArea = container.querySelector('.text-area');
        const doc = this.documents.get(documentId);
        
        if (doc.content) {
            // Check if content is HTML or plain text
            if (this.hasUserFormatting(doc.content)) {
                textArea.innerHTML = doc.content;
            } else {
                // Convert plain text newlines to <br> so they display in contenteditable
                const escaped = doc.content
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/\n/g, '<br>');
                textArea.innerHTML = escaped;
            }
        }
        
        this.updateWordCount(documentId);
        this.updateToolbarState(documentId);
    }

    updateWordCount(documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const textArea = container.querySelector('.text-area');
        const wordCountEl = container.querySelector('.word-count');
        
        const text = textArea.textContent || '';
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;
        
        wordCountEl.textContent = `Words: ${words} | Characters: ${chars}`;
    }

    handleAction(action, documentId) {
        switch (action) {
            case 'new':
                this.createNewDocument();
                break;
            case 'open':
                this.showOpenDialog(documentId);
                break;
            case 'save':
                this.saveDocument(documentId);
                break;
            case 'saveas':
                this.showSaveAsDialog(documentId);
                break;
            case 'undo':
                document.execCommand('undo');
                break;
            case 'redo':
                document.execCommand('redo');
                break;
        }
    }

    showOpenDialog(documentId) {
        const files = this.fileSystem.listContents(['root', 'Documents']);
        const textFiles = files.filter(file => 
            file.name.endsWith('.txt') || 
            file.name.endsWith('.html') || 
            file.name.endsWith('.rtf')
        );
        
        if (textFiles.length === 0) {
            this.showMessage('No text files found in Documents folder', 'info');
            return;
        }
        
        const dialog = document.createElement('div');
        dialog.className = 'file-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <div class="dialog-title">${ElxaIcons.renderAction('open')} Open File</div>
                    <div class="dialog-close" onclick="this.closest('.file-dialog').remove()">×</div>
                </div>
                <div class="dialog-body">
                    <div class="file-list">
                        ${textFiles.map(file => {
                            let modifiedDate = 'Unknown';
                            if (file.modified) {
                                if (file.modified instanceof Date) {
                                    modifiedDate = file.modified.toLocaleDateString();
                                } else if (typeof file.modified === 'string') {
                                    try {
                                        modifiedDate = new Date(file.modified).toLocaleDateString();
                                    } catch (e) {
                                        modifiedDate = 'Unknown';
                                    }
                                }
                            }
                            
                            return `<div class="file-item" data-filename="${file.name}">
                                ${ElxaIcons.renderAction('open-file')} ${file.name}
                                <div class="file-info">Modified: ${modifiedDate}</div>
                            </div>`;
                        }).join('')}
                    </div>
                    <div class="dialog-buttons">
                        <button class="open-btn" onclick="elxaOS.programs.notepad.openSelectedFile('${documentId}')">Open</button>
                        <button class="dialog-button" onclick="this.closest('.file-dialog').remove()">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // File selection
        dialog.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', () => {
                dialog.querySelectorAll('.file-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
            });
            
            item.addEventListener('dblclick', () => {
                this.openFile(item.dataset.filename);
                dialog.remove();
            });
        });
    }

    openSelectedFile(documentId) {
        const dialog = document.querySelector('.file-dialog');
        const selected = dialog.querySelector('.file-item.selected');
        
        if (selected) {
            this.openFile(selected.dataset.filename);
            dialog.remove();
        } else {
            this.showMessage('Please select a file to open', 'warning');
        }
    }

    openFile(filename, path = null) {
        const filePath = path || ['root', 'Documents'];
        
        console.log('Opening file:', filename, 'from path:', filePath);
        
        const file = this.fileSystem.getFile(filePath, filename);
        if (!file) {
            alert(`File not found: ${filename}`);
            return;
        }
        
        const content = file.content;
        const newDocumentId = this.createNewDocument(content, filename);
        this.documentPaths.set(newDocumentId, [...filePath]);
        
        // Check if the loaded content has user formatting
        const doc = this.documents.get(newDocumentId);
        doc.hasUserFormatting = this.hasUserFormatting(content);
        
        this.showMessage(`Opened ${filename}`, 'success');
    }

    saveDocument(documentId) {
        const doc = this.documents.get(documentId);
        
        if (doc.filename) {
            const container = document.querySelector(`[data-document-id="${documentId}"]`);
            const textArea = container.querySelector('.text-area');
            
            let contentToSave;
            let fileExtension = this.getFileExtension(doc.filename);
            
            // Only save as HTML if user has actually applied formatting
            if (doc.hasUserFormatting && this.hasUserFormatting(textArea.innerHTML)) {
                contentToSave = textArea.innerHTML;
                if (fileExtension === '.txt') {
                    doc.filename = doc.filename.replace('.txt', '.html');
                }
            } else {
                // Save as plain text — innerText preserves line breaks from <br>/block elements
                contentToSave = textArea.innerText || '';
                if (fileExtension === '.html' && !doc.hasUserFormatting) {
                    // If it was HTML but has no user formatting, save as txt
                    doc.filename = doc.filename.replace('.html', '.txt');
                }
            }
            
            const savePath = this.documentPaths.get(documentId) || ['root', 'Documents'];
            const existingFile = this.fileSystem.getFile(savePath, doc.filename);
            
            if (existingFile) {
                console.log('📝 Updating existing file:', doc.filename);
                this.fileSystem.updateFileContent(savePath, doc.filename, contentToSave);
            } else {
                console.log('📄 Creating new file:', doc.filename);
                this.fileSystem.createFile(savePath, doc.filename, contentToSave);
            }
            
            doc.saved = true;
            this.updateWindowTitle(documentId);
            this.showMessage(`Saved ${doc.filename}`, 'success');
        } else {
            this.showSaveAsDialog(documentId);
        }
    }

    showSaveAsDialog(documentId) {
        const doc = this.documents.get(documentId);
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const textArea = container.querySelector('.text-area');
        
        // FIXED: Check if user has actually applied formatting
        const hasFormatting = doc.hasUserFormatting && this.hasUserFormatting(textArea.innerHTML);
        const defaultExt = hasFormatting ? '.html' : '.txt';
        
        const currentPath = this.documentPaths.get(documentId) || ['root', 'Documents'];
        const locationName = currentPath.length > 1 ? currentPath[currentPath.length - 1] : 'Documents';
        
        const dialog = document.createElement('div');
        dialog.className = 'file-dialog save-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <div class="dialog-title">${ElxaIcons.renderAction('save')} Save As</div>
                    <div class="dialog-close" onclick="this.closest('.file-dialog').remove()">×</div>
                </div>
                <div class="dialog-body">
                    <div class="save-form">
                        <label>Filename:</label>
                        <input type="text" class="filename-input" value="${doc.filename || ('Untitled' + defaultExt)}" placeholder="Enter filename">
                        <div class="save-location">Save to: ${locationName} folder</div>
                        <div class="format-info">
                            ${hasFormatting ? '⚠️ Document contains formatting - will save as HTML' : 'ℹ️ Plain text document - will save as TXT'}
                        </div>
                    </div>
                    <div class="dialog-buttons">
                        <button class="save-btn" onclick="elxaOS.programs.notepad.saveWithFilename('${documentId}')">Save</button>
                        <button class="dialog-button" onclick="this.closest('.file-dialog').remove()">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        const filenameInput = dialog.querySelector('.filename-input');
        filenameInput.focus();
        filenameInput.select();
        
        filenameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveWithFilename(documentId);
            }
        });
    }

    saveWithFilename(documentId) {
        const dialog = document.querySelector('.save-dialog');
        const filename = dialog.querySelector('.filename-input').value.trim();
        
        if (!filename) {
            this.showMessage('Please enter a filename', 'warning');
            return;
        }
        
        const doc = this.documents.get(documentId);
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const textArea = container.querySelector('.text-area');
        
        // FIXED: Check if user has actually applied formatting
        const hasFormatting = doc.hasUserFormatting && this.hasUserFormatting(textArea.innerHTML);
        
        let finalFilename = filename;
        let contentToSave;
        
        if (hasFormatting) {
            if (!finalFilename.endsWith('.html') && !finalFilename.endsWith('.rtf')) {
                finalFilename += '.html';
            }
            contentToSave = textArea.innerHTML;
        } else {
            if (!finalFilename.endsWith('.txt') && !finalFilename.includes('.')) {
                finalFilename += '.txt';
            }
            // innerText preserves line breaks from <br>/block elements
            contentToSave = textArea.innerText || '';
        }
        
        const savePath = this.documentPaths.get(documentId) || ['root', 'Documents'];
        const existingFile = this.fileSystem.getFile(savePath, finalFilename);
        
        if (existingFile) {
            if (confirm(`File "${finalFilename}" already exists. Do you want to overwrite it?`)) {
                console.log('📝 Overwriting existing file:', finalFilename);
                this.fileSystem.updateFileContent(savePath, finalFilename, contentToSave);
            } else {
                return;
            }
        } else {
            console.log('📄 Creating new file:', finalFilename);
            this.fileSystem.createFile(savePath, finalFilename, contentToSave);
        }
        
        doc.filename = finalFilename;
        doc.saved = true;
        this.updateWindowTitle(documentId);
        
        dialog.remove();
        this.showMessage(`Saved as ${finalFilename}`, 'success');
    }

    hasUserFormatting(htmlContent) {
        if (!htmlContent) return false;
        
        // Look for obvious formatting tags
        const formattingTags = /<(b|i|u|strong|em|font|span[^>]*style|div[^>]*style|p[^>]*style)\b[^>]*>/i;
        if (formattingTags.test(htmlContent)) {
            // Check for meaningful formatting — CSS properties or font tag attributes
            const hasColors = /(color|background-color):\s*(?!rgb\(0,\s*0,\s*0\)|#000000|black|transparent)/i;
            const hasWeights = /font-weight:\s*bold/i;
            const hasStyles = /font-style:\s*italic/i;
            const hasDecoration = /text-decoration:\s*underline/i;
            const hasFontFace = /<font[^>]+face\s*=/i;
            const hasFontSize = /<font[^>]+size\s*=/i;
            const hasFontFamily = /font-family:/i;
            const hasCssFontSize = /font-size:/i;
            
            return hasColors.test(htmlContent) || 
                   hasWeights.test(htmlContent) || 
                   hasStyles.test(htmlContent) || 
                   hasDecoration.test(htmlContent) ||
                   hasFontFace.test(htmlContent) ||
                   hasFontSize.test(htmlContent) ||
                   hasFontFamily.test(htmlContent) ||
                   hasCssFontSize.test(htmlContent);
        }
        
        return false;
    }

    getFileExtension(filename) {
        return filename.substring(filename.lastIndexOf('.'));
    }

    showMessage(text, type = 'info') {
        ElxaUI.showMessage(text, type);
    }

    markUnsaved(documentId) {
        const doc = this.documents.get(documentId);
        doc.saved = false;
        this.updateWindowTitle(documentId);
    }

    updateWindowTitle(documentId) {
        const doc = this.documents.get(documentId);
        const windowElement = document.getElementById(`window-${documentId}`);
        if (!windowElement) return;
        const titleElement = windowElement.querySelector('.window-title');
        
        const title = doc.filename || `Untitled Document ${documentId.split('-').pop()}`;
        const unsavedMarker = doc.saved ? '' : '*';
        
        titleElement.innerHTML = `${ElxaIcons.render('notepad', 'ui')} ${title}${unsavedMarker}`;
    }
}

// NOTE: All Notepad styles are in css/programs/notepad.css (theme-aware via CSS variables).
// No inline style injection needed.