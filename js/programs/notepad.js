// =================================
// ENHANCED RICH TEXT NOTEPAD PROGRAM
// =================================
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
        
        // Font and styling options
        this.fontFamilies = [
            { name: 'Arial', value: 'Arial, sans-serif' },
            { name: 'Times New Roman', value: '"Times New Roman", serif' },
            { name: 'Comic Sans', value: '"Comic Sans MS", cursive' },
            { name: 'Courier New', value: '"Courier New", monospace' },
            { name: 'Impact', value: 'Impact, sans-serif' },
            { name: 'Georgia', value: 'Georgia, serif' },
            { name: 'Trebuchet', value: '"Trebuchet MS", sans-serif' },
            { name: 'Verdana', value: 'Verdana, sans-serif' },
            { name: 'Papyrus', value: 'Papyrus, fantasy' },
            { name: 'Brush Script', value: '"Brush Script MT", cursive' }
        ];
        
        this.colorPresets = [
            { name: 'Black', value: '#000000' },
            { name: 'Red', value: '#ff0000' },
            { name: 'Green', value: '#00aa00' },
            { name: 'Blue', value: '#0000ff' },
            { name: 'Purple', value: '#800080' },
            { name: 'Orange', value: '#ff8800' },
            { name: 'Pink', value: '#ff69b4' },
            { name: 'Cyan', value: '#00ffff' },
            { name: 'Yellow', value: '#ffdd00' },
            { name: 'Brown', value: '#8b4513' },
            { name: 'Gray', value: '#808080' },
            { name: 'White', value: '#ffffff' }
        ];
        
        this.backgroundPresets = [
            { name: 'Transparent', value: 'transparent' },
            { name: 'White', value: '#ffffff' },
            { name: 'Light Yellow', value: '#fffacd' },
            { name: 'Light Blue', value: '#e6f3ff' },
            { name: 'Light Green', value: '#f0fff0' },
            { name: 'Light Pink', value: '#ffe4e6' },
            { name: 'Light Purple', value: '#f3e6ff' },
            { name: 'Light Gray', value: '#f5f5f5' },
            { name: 'Cream', value: '#fff8dc' },
            { name: 'Lavender', value: '#e6e6fa' }
        ];
        
        this.defaultSettings = {
            fontFamily: 'Arial, sans-serif',
            fontSize: 14,
            textColor: '#000000',
            backgroundColor: 'white',
            textAlign: 'left',
            lineHeight: 1.5
        };
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
            htmlContent: content, // Store both plain text and HTML
            saved: filename ? true : false,
            settings: { ...this.defaultSettings },
            lastModified: new Date(),
            currentSelection: null
        };
        
        this.documents.set(documentId, document);
        this.activeDocumentId = documentId;
        
        const windowContent = this.createNotepadInterface(documentId);
        
        const window = this.windowManager.createWindow(
            documentId,
            `📝 ${title}`,
            windowContent,
            { width: '800px', height: '600px', x: '50px', y: '50px' }
        );
        
        this.setupEventHandlers(documentId);
        this.applyGlobalSettings(documentId);
        this.updateWindowTitle(documentId);
        
        return documentId;
    }

    createNotepadInterface(documentId) {
        const notepadDoc = this.documents.get(documentId);
        
        return `
            <div class="notepad-container" data-document-id="${documentId}">
                <!-- Menu Bar -->
                <div class="notepad-menubar">
                    <div class="menu-item" data-action="new">📄 New</div>
                    <div class="menu-item" data-action="open">📂 Open</div>
                    <div class="menu-item" data-action="save">💾 Save</div>
                    <div class="menu-item" data-action="saveas">💾 Save As</div>
                    <div class="menu-separator">|</div>
                    <div class="menu-item" data-action="undo">↶ Undo</div>
                    <div class="menu-item" data-action="redo">↷ Redo</div>
                    <div class="menu-separator">|</div>
                    <div class="menu-item" data-action="print">🖨️ Print</div>
                </div>
                
                <!-- Formatting Toolbar -->
                <div class="notepad-toolbar">
                    <!-- Font Family -->
                    <div class="toolbar-group">
                        <label>Font:</label>
                        <select class="font-selector">
                            ${this.fontFamilies.map(font => 
                                `<option value="${font.value}">${font.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <!-- Font Size -->
                    <div class="toolbar-group">
                        <label>Size:</label>
                        <input type="range" class="font-size-slider" min="8" max="72" value="14">
                        <span class="font-size-display">14px</span>
                    </div>
                    
                    <!-- Font Style Buttons -->
                    <div class="toolbar-group">
                        <button class="style-btn bold-btn" data-command="bold" title="Bold">B</button>
                        <button class="style-btn italic-btn" data-command="italic" title="Italic">I</button>
                        <button class="style-btn underline-btn" data-command="underline" title="Underline">U</button>
                        <button class="style-btn strikethrough-btn" data-command="strikeThrough" title="Strikethrough">S</button>
                    </div>
                    
                    <!-- Text Alignment -->
                    <div class="toolbar-group">
                        <button class="align-btn" data-command="justifyLeft" title="Align Left">⬅️</button>
                        <button class="align-btn" data-command="justifyCenter" title="Center">⬜</button>
                        <button class="align-btn" data-command="justifyRight" title="Align Right">➡️</button>
                        <button class="align-btn" data-command="justifyFull" title="Justify">⬛</button>
                    </div>
                    
                    <!-- Lists -->
                    <div class="toolbar-group">
                        <button class="list-btn" data-command="insertUnorderedList" title="Bullet List">• List</button>
                        <button class="list-btn" data-command="insertOrderedList" title="Numbered List">1. List</button>
                    </div>
                </div>
                
                <!-- Color Toolbar -->
                <div class="notepad-color-toolbar">
                    <!-- Text Color -->
                    <div class="color-group">
                        <label>Text Color:</label>
                        <div class="color-preset-grid">
                            ${this.colorPresets.map(color => 
                                `<div class="color-preset text-color-preset" 
                                      style="background-color: ${color.value}; border: ${color.value === '#ffffff' ? '1px solid #ccc' : 'none'};" 
                                      data-color="${color.value}" 
                                      title="${color.name}"></div>`
                            ).join('')}
                        </div>
                        <input type="color" class="custom-text-color-picker" value="#000000">
                    </div>
                    
                    <!-- Background Color -->
                    <div class="color-group">
                        <label>Highlight:</label>
                        <div class="color-preset-grid">
                            ${this.backgroundPresets.map(bg => 
                                `<div class="color-preset bg-color-preset" 
                                      style="background: ${bg.value === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%); background-size: 8px 8px; background-position: 0 0, 4px 4px;' : bg.value}" 
                                      data-color="${bg.value}" 
                                      title="${bg.name}"></div>`
                            ).join('')}
                        </div>
                        <input type="color" class="custom-bg-color-picker" value="#ffff00">
                    </div>
                    
                    <!-- Special Formatting -->
                    <div class="effects-group">
                        <label>Effects:</label>
                        <button class="effect-btn" data-action="superscript" title="Superscript">X²</button>
                        <button class="effect-btn" data-action="subscript" title="Subscript">X₂</button>
                        <button class="effect-btn" data-action="removeFormat" title="Clear Formatting">🚫</button>
                    </div>
                </div>
                
                <!-- Rich Text Editor -->
                <div class="notepad-editor">
                    <div class="rich-text-editor" 
                         contenteditable="true" 
                         data-document-id="${documentId}"
                         style="font-family: ${notepadDoc.settings.fontFamily}; 
                                font-size: ${notepadDoc.settings.fontSize}px;
                                background-color: ${notepadDoc.settings.backgroundColor};
                                text-align: ${notepadDoc.settings.textAlign};
                                line-height: ${notepadDoc.settings.lineHeight};">
                        ${notepadDoc.htmlContent || ''}
                    </div>
                </div>
                
                <!-- Status Bar -->
                <div class="notepad-statusbar">
                    <div class="status-info">
                        <span class="word-count">Words: 0</span>
                        <span class="char-count">Characters: 0</span>
                        <span class="save-status">${notepadDoc.saved ? 'Saved' : 'Unsaved Changes'}</span>
                        <span class="selection-info">Ready</span>
                    </div>
                    <div class="zoom-controls">
                        <button class="zoom-btn" data-zoom="out">🔍-</button>
                        <span class="zoom-level">100%</span>
                        <button class="zoom-btn" data-zoom="in">🔍+</button>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventHandlers(documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        if (!container) return;
        
        const notepadDoc = this.documents.get(documentId);
        const editor = container.querySelector('.rich-text-editor');
        
        // Menu actions
        container.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                this.handleMenuAction(item.dataset.action, documentId);
            });
        });
        
        // Font family selector
        const fontSelector = container.querySelector('.font-selector');
        fontSelector.addEventListener('change', (e) => {
            this.applyFontFamily(e.target.value);
            this.markUnsaved(documentId);
        });
        
        // Font size slider
        const fontSizeSlider = container.querySelector('.font-size-slider');
        const fontSizeDisplay = container.querySelector('.font-size-display');
        fontSizeSlider.addEventListener('input', (e) => {
            const size = e.target.value;
            fontSizeDisplay.textContent = `${size}px`;
            this.applyFontSize(size);
            this.markUnsaved(documentId);
        });
        
        // Style buttons (Bold, Italic, Underline, etc.)
        container.querySelectorAll('.style-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const command = btn.dataset.command;
                this.executeCommand(command);
                this.updateToolbarState(documentId);
                this.markUnsaved(documentId);
            });
        });
        
        // Alignment buttons
        container.querySelectorAll('.align-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const command = btn.dataset.command;
                this.executeCommand(command);
                this.updateToolbarState(documentId);
                this.markUnsaved(documentId);
            });
        });
        
        // List buttons
        container.querySelectorAll('.list-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const command = btn.dataset.command;
                this.executeCommand(command);
                this.updateToolbarState(documentId);
                this.markUnsaved(documentId);
            });
        });
        
        // Text color presets
        container.querySelectorAll('.text-color-preset').forEach(preset => {
            preset.addEventListener('click', () => {
                const color = preset.dataset.color;
                this.applyFormatToSelection('foreColor', color);
                this.updateColorSelection(container, '.text-color-preset', preset);
                this.markUnsaved(documentId);
            });
        });
        
        // Background color presets
        container.querySelectorAll('.bg-color-preset').forEach(preset => {
            preset.addEventListener('click', () => {
                const color = preset.dataset.color;
                if (color === 'transparent') {
                    this.executeCommand('removeFormat');
                } else {
                    this.applyFormatToSelection('backColor', color);
                }
                this.updateColorSelection(container, '.bg-color-preset', preset);
                this.markUnsaved(documentId);
            });
        });
        
        // Custom color pickers
        const textColorPicker = container.querySelector('.custom-text-color-picker');
        textColorPicker.addEventListener('change', (e) => {
            this.applyFormatToSelection('foreColor', e.target.value);
            this.markUnsaved(documentId);
        });
        
        const bgColorPicker = container.querySelector('.custom-bg-color-picker');
        bgColorPicker.addEventListener('change', (e) => {
            this.applyFormatToSelection('backColor', e.target.value);
            this.markUnsaved(documentId);
        });
        
        // Effect buttons
        container.querySelectorAll('.effect-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                switch(action) {
                    case 'superscript':
                        this.executeCommand('superscript');
                        break;
                    case 'subscript':
                        this.executeCommand('subscript');
                        break;
                    case 'removeFormat':
                        this.clearFormatting();
                        break;
                }
                this.markUnsaved(documentId);
            });
        });
        
        // Rich text editor events
        editor.addEventListener('input', () => {
            notepadDoc.htmlContent = editor.innerHTML;
            notepadDoc.content = editor.textContent; // Store plain text version too
            this.updateWordCount(documentId);
            this.markUnsaved(documentId);
        });
        
        editor.addEventListener('keydown', (e) => {
            // Handle keyboard shortcuts
            if (e.ctrlKey) {
                switch(e.key) {
                    case 's':
                        e.preventDefault();
                        this.handleMenuAction('save', documentId);
                        break;
                    case 'n':
                        e.preventDefault();
                        this.handleMenuAction('new', documentId);
                        break;
                    case 'o':
                        e.preventDefault();
                        this.handleMenuAction('open', documentId);
                        break;
                    case 'b':
                        e.preventDefault();
                        this.executeCommand('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        this.executeCommand('italic');
                        break;
                    case 'u':
                        e.preventDefault();
                        this.executeCommand('underline');
                        break;
                    case 'z':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.executeCommand('redo');
                        } else {
                            e.preventDefault();
                            this.executeCommand('undo');
                        }
                        break;
                }
            }
        });
        
        // Update toolbar state when selection changes
        editor.addEventListener('selectionchange', () => {
            this.updateToolbarState(documentId);
            this.updateSelectionInfo(documentId);
        });
        
        editor.addEventListener('mouseup', () => {
            this.updateToolbarState(documentId);
            this.updateSelectionInfo(documentId);
        });
        
        editor.addEventListener('keyup', () => {
            this.updateToolbarState(documentId);
            this.updateSelectionInfo(documentId);
        });
        
        // Zoom controls
        container.querySelectorAll('.zoom-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleZoom(btn.dataset.zoom, documentId);
            });
        });
        
        // Focus the editor
        editor.focus();
        
        // Initial updates
        this.updateWordCount(documentId);
        this.updateToolbarState(documentId);
    }

    executeCommand(command, value = null) {
        document.execCommand(command, false, value);
    }

    applyFormatToSelection(command, value) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            // Enable CSS styling for better control
            document.execCommand('styleWithCSS', false, true);
            document.execCommand(command, false, value);
        }
    }

    applyFontSize(pixelSize) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            // Enable CSS styling mode
            document.execCommand('styleWithCSS', false, true);
            
            if (!selection.isCollapsed) {
                // For selected text, use CSS font-size
                this.wrapSelectionInSpan('font-size', pixelSize + 'px');
            } else {
                // For cursor position, we need to set up the next typed characters
                const range = selection.getRangeAt(0);
                const span = document.createElement('span');
                span.style.fontSize = pixelSize + 'px';
                
                // Insert a zero-width space to maintain the formatting context
                span.appendChild(document.createTextNode('\u200B'));
                range.insertNode(span);
                
                // Move cursor to end of span
                range.setStart(span.firstChild, 1);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }

    applyFontFamily(fontFamily) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            // Enable CSS styling mode
            document.execCommand('styleWithCSS', false, true);
            
            if (!selection.isCollapsed) {
                // For selected text, use CSS font-family
                this.wrapSelectionInSpan('font-family', fontFamily);
            } else {
                // For cursor position
                const range = selection.getRangeAt(0);
                const span = document.createElement('span');
                span.style.fontFamily = fontFamily;
                
                // Insert a zero-width space to maintain the formatting context
                span.appendChild(document.createTextNode('\u200B'));
                range.insertNode(span);
                
                // Move cursor to end of span
                range.setStart(span.firstChild, 1);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }

    wrapSelectionInSpan(styleProperty, styleValue) {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        if (range.collapsed) return;
        
        // Check if selection is already wrapped in a span with this property
        const parentElement = range.commonAncestorContainer.nodeType === Node.TEXT_NODE 
            ? range.commonAncestorContainer.parentElement 
            : range.commonAncestorContainer;
            
        // Create new span with the desired style
        const span = document.createElement('span');
        span.style.setProperty(styleProperty, styleValue);
        
        try {
            // Extract the selected content
            const contents = range.extractContents();
            span.appendChild(contents);
            range.insertNode(span);
            
            // Restore selection
            selection.removeAllRanges();
            const newRange = document.createRange();
            newRange.selectNodeContents(span);
            selection.addRange(newRange);
        } catch (e) {
            console.warn('Font size application failed:', e);
            // Fallback to basic execCommand
            document.execCommand('fontSize', false, '3');
        }
    }

    updateToolbarState(documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        
        // Update style buttons
        const commands = ['bold', 'italic', 'underline', 'strikeThrough'];
        commands.forEach(command => {
            const btn = container.querySelector(`[data-command="${command}"]`);
            if (btn) {
                const isActive = document.queryCommandState(command);
                btn.classList.toggle('active', isActive);
            }
        });
        
        // Update alignment buttons
        const alignCommands = ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'];
        alignCommands.forEach(command => {
            const btn = container.querySelector(`[data-command="${command}"]`);
            if (btn) {
                const isActive = document.queryCommandState(command);
                btn.classList.toggle('active', isActive);
            }
        });
        
        // Update list buttons
        const listCommands = ['insertUnorderedList', 'insertOrderedList'];
        listCommands.forEach(command => {
            const btn = container.querySelector(`[data-command="${command}"]`);
            if (btn) {
                const isActive = document.queryCommandState(command);
                btn.classList.toggle('active', isActive);
            }
        });
        
        // Update font family and size based on current selection
        this.updateFontControls(container);
    }

    updateFontControls(container) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            let element = range.startContainer;
            
            // Get the element containing the selection
            if (element.nodeType === Node.TEXT_NODE) {
                element = element.parentElement;
            }
            
            // Update font family selector
            const fontSelector = container.querySelector('.font-selector');
            const computedStyle = window.getComputedStyle(element);
            const currentFontFamily = computedStyle.fontFamily;
            
            // Try to match with our font options
            for (let option of fontSelector.options) {
                if (currentFontFamily.includes(option.value.split(',')[0].replace(/['"]/g, ''))) {
                    fontSelector.value = option.value;
                    break;
                }
            }
            
            // Update font size
            const fontSizeSlider = container.querySelector('.font-size-slider');
            const fontSizeDisplay = container.querySelector('.font-size-display');
            const currentFontSize = parseInt(computedStyle.fontSize);
            
            if (currentFontSize >= 8 && currentFontSize <= 72) {
                fontSizeSlider.value = currentFontSize;
                fontSizeDisplay.textContent = `${currentFontSize}px`;
            }
        }
    }

    updateColorSelection(container, selector, selectedElement) {
        container.querySelectorAll(selector).forEach(el => el.classList.remove('selected'));
        selectedElement.classList.add('selected');
    }

    updateSelectionInfo(documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const selectionInfo = container.querySelector('.selection-info');
        const selection = window.getSelection();
        
        if (selection.rangeCount > 0 && !selection.isCollapsed) {
            const selectedText = selection.toString();
            selectionInfo.textContent = `Selected: ${selectedText.length} chars`;
        } else {
            selectionInfo.textContent = 'Ready';
        }
    }

    applyGlobalSettings(documentId) {
        const notepadDoc = this.documents.get(documentId);
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const editor = container.querySelector('.rich-text-editor');
        
        // Apply default document settings
        editor.style.backgroundColor = notepadDoc.settings.backgroundColor;
        editor.style.lineHeight = notepadDoc.settings.lineHeight;
    }

    handleMenuAction(action, documentId) {
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
                this.executeCommand('undo');
                break;
            case 'redo':
                this.executeCommand('redo');
                break;
            case 'print':
                this.printDocument(documentId);
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
                    <div class="dialog-title">📂 Open File</div>
                    <div class="dialog-close" onclick="this.closest('.file-dialog').remove()">×</div>
                </div>
                <div class="dialog-body">
                    <div class="file-list">
                        ${textFiles.map(file => {
                            // SAFE DATE FORMATTING
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
                                📄 ${file.name}
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

    // Update the openFile method to store the path
    openFile(filename, path = null) {
        // Default to Documents folder if no path provided
        const filePath = path || ['root', 'Documents'];
        
        console.log('Opening file:', filename, 'from path:', filePath);
        
        // Get the file from the specified path
        const file = this.fileSystem.getFile(filePath, filename);
        if (!file) {
            alert(`File not found: ${filename}`);
            return;
        }
        
        let content = file.content;
        
        // Determine if the file contains HTML formatting
        if (filename.endsWith('.html') || filename.endsWith('.rtf') || content.includes('<')) {
            this.createNewDocument('', filename);
            const newDocId = this.activeDocumentId;
            const newDoc = this.documents.get(newDocId);
            newDoc.htmlContent = content;
            newDoc.content = this.stripHtml(content);
            
            // Store the original path
            this.documentPaths.set(newDocId, [...filePath]);
            
            // Update the editor
            const container = document.querySelector(`[data-document-id="${newDocId}"]`);
            const editor = container.querySelector('.rich-text-editor');
            editor.innerHTML = content;
        } else {
            this.createNewDocument(content, filename);
            
            // Store the original path
            this.documentPaths.set(this.activeDocumentId, [...filePath]);
        }
        
        this.showMessage(`Opened ${filename}`, 'success');
    }

    // Update the saveDocument method to use the stored path
    saveDocument(documentId) {
        const notepadDoc = this.documents.get(documentId);
        
        if (notepadDoc.filename) {
            let contentToSave;
            let fileExtension = this.getFileExtension(notepadDoc.filename);
            
            // Save as HTML if it has formatting, otherwise as plain text
            if (this.hasFormatting(notepadDoc.htmlContent)) {
                contentToSave = notepadDoc.htmlContent;
                if (fileExtension === '.txt') {
                    // Change extension to preserve formatting
                    notepadDoc.filename = notepadDoc.filename.replace('.txt', '.html');
                }
            } else {
                contentToSave = notepadDoc.content;
            }
            
            // Get the document's original path, fallback to Documents if not found
            const savePath = this.documentPaths.get(documentId) || ['root', 'Documents'];
            
            // CHECK IF FILE EXISTS - if so, update it; if not, create it
            const existingFile = this.fileSystem.getFile(savePath, notepadDoc.filename);
            
            if (existingFile) {
                // File exists - update it
                console.log('📝 Updating existing file:', notepadDoc.filename);
                this.fileSystem.updateFileContent(savePath, notepadDoc.filename, contentToSave);
            } else {
                // File doesn't exist - create it
                console.log('📄 Creating new file:', notepadDoc.filename);
                this.fileSystem.createFile(savePath, notepadDoc.filename, contentToSave);
            }
            
            notepadDoc.saved = true;
            this.updateStatus(documentId);
            this.updateWindowTitle(documentId);
            this.showMessage(`Saved ${notepadDoc.filename}`, 'success');
        } else {
            this.showSaveAsDialog(documentId);
        }
    }

    // Update showSaveAsDialog to show current location
    showSaveAsDialog(documentId) {
        const notepadDoc = this.documents.get(documentId);
        const hasFormatting = this.hasFormatting(notepadDoc.htmlContent);
        const defaultExt = hasFormatting ? '.html' : '.txt';
        
        // Get the current document path or default to Documents
        const currentPath = this.documentPaths.get(documentId) || ['root', 'Documents'];
        const locationName = currentPath.length > 1 ? currentPath[currentPath.length - 1] : 'Documents';
        
        const dialog = document.createElement('div');
        dialog.className = 'file-dialog save-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <div class="dialog-title">💾 Save As</div>
                    <div class="dialog-close" onclick="this.closest('.file-dialog').remove()">×</div>
                </div>
                <div class="dialog-body">
                    <div class="save-form">
                        <label>Filename:</label>
                        <input type="text" class="filename-input" value="${notepadDoc.filename || ('Untitled' + defaultExt)}" placeholder="Enter filename">
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

    // Update saveWithFilename to use the stored path
    saveWithFilename(documentId) {
        const dialog = document.querySelector('.save-dialog');
        const filename = dialog.querySelector('.filename-input').value.trim();
        
        if (!filename) {
            this.showMessage('Please enter a filename', 'warning');
            return;
        }
        
        const notepadDoc = this.documents.get(documentId);
        const hasFormatting = this.hasFormatting(notepadDoc.htmlContent);
        
        let finalFilename = filename;
        let contentToSave;
        
        // Determine file type and content
        if (hasFormatting) {
            if (!finalFilename.endsWith('.html') && !finalFilename.endsWith('.rtf')) {
                finalFilename += '.html';
            }
            contentToSave = notepadDoc.htmlContent;
        } else {
            if (!finalFilename.endsWith('.txt') && !finalFilename.includes('.')) {
                finalFilename += '.txt';
            }
            contentToSave = notepadDoc.content;
        }
        
        // Get the document's current path or default to Documents
        const savePath = this.documentPaths.get(documentId) || ['root', 'Documents'];
        
        // CHECK IF FILE EXISTS - if so, update it; if not, create it
        const existingFile = this.fileSystem.getFile(savePath, finalFilename);
        
        if (existingFile) {
            // File exists - ask if they want to overwrite
            if (confirm(`File "${finalFilename}" already exists. Do you want to overwrite it?`)) {
                console.log('📝 Overwriting existing file:', finalFilename);
                this.fileSystem.updateFileContent(savePath, finalFilename, contentToSave);
            } else {
                return; // Don't save if they don't want to overwrite
            }
        } else {
            // File doesn't exist - create it
            console.log('📄 Creating new file:', finalFilename);
            this.fileSystem.createFile(savePath, finalFilename, contentToSave);
        }
        
        notepadDoc.filename = finalFilename;
        notepadDoc.saved = true;
        this.updateWindowTitle(documentId);
        this.updateStatus(documentId);
        
        dialog.remove();
        this.showMessage(`Saved as ${finalFilename}`, 'success');
    }

    hasFormatting(htmlContent) {
        if (!htmlContent) return false;
        
        // Check if there are any formatting tags
        const formattingTags = /<(b|i|u|strong|em|span|font|div|p)\b[^>]*>/i;
        const hasStyles = /style\s*=\s*["'][^"']*["']/i;
        const hasColors = /(color|background-color|font-family|font-size):/i;
        
        return formattingTags.test(htmlContent) || 
               hasStyles.test(htmlContent) || 
               hasColors.test(htmlContent) ||
               htmlContent.includes('<ul>') || 
               htmlContent.includes('<ol>');
    }

    stripHtml(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || '';
    }

    getFileExtension(filename) {
        return filename.substring(filename.lastIndexOf('.'));
    }

    printDocument(documentId) {
        const notepadDoc = this.documents.get(documentId);
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print - ${notepadDoc.filename || 'Untitled'}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            padding: 20px;
                            max-width: 100%;
                        }
                        @media print {
                            body { margin: 0; }
                        }
                    </style>
                </head>
                <body>${notepadDoc.htmlContent}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        
        this.showMessage('Print preview opened', 'info');
    }

    handleZoom(direction, documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const zoomLevel = container.querySelector('.zoom-level');
        const editor = container.querySelector('.rich-text-editor');
        
        let currentZoom = parseInt(zoomLevel.textContent.replace('%', ''));
        
        if (direction === 'in' && currentZoom < 300) {
            currentZoom += 25;
        } else if (direction === 'out' && currentZoom > 50) {
            currentZoom -= 25;
        }
        
        zoomLevel.textContent = `${currentZoom}%`;
        editor.style.transform = `scale(${currentZoom / 100})`;
        editor.style.transformOrigin = 'top left';
    }

    updateWordCount(documentId) {
        const notepadDoc = this.documents.get(documentId);
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        
        const plainText = notepadDoc.content || '';
        const words = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
        const chars = plainText.length;
        
        container.querySelector('.word-count').textContent = `Words: ${words}`;
        container.querySelector('.char-count').textContent = `Characters: ${chars}`;
    }

    markUnsaved(documentId) {
        const notepadDoc = this.documents.get(documentId);
        notepadDoc.saved = false;
        this.updateStatus(documentId);
        this.updateWindowTitle(documentId);
    }

    updateStatus(documentId) {
        const notepadDoc = this.documents.get(documentId);
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const saveStatus = container.querySelector('.save-status');
        
        saveStatus.textContent = notepadDoc.saved ? 'Saved' : 'Unsaved Changes';
        saveStatus.className = `save-status ${notepadDoc.saved ? 'saved' : 'unsaved'}`;
    }

    updateWindowTitle(documentId) {
        const notepadDoc = this.documents.get(documentId);
        const windowElement = document.getElementById(`window-${documentId}`);
        const titleElement = windowElement.querySelector('.window-title');
        
        const title = notepadDoc.filename || `Untitled Document ${documentId.split('-').pop()}`;
        const unsavedMarker = notepadDoc.saved ? '' : '*';
        
        titleElement.textContent = `📝 ${title}${unsavedMarker}`;
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
}