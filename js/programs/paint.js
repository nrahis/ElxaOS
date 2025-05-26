// =================================
// ENHANCED ELXAOS PAINT PROGRAM
// =================================
class PaintProgram {
    constructor(windowManager, fileSystem, eventBus) {
        this.windowManager = windowManager;
        this.fileSystem = fileSystem;
        this.eventBus = eventBus;
        this.documents = new Map();
        this.activeDocumentId = null;
        this.documentCounter = 0;
        
        // Add this property to track original file paths
        this.documentPaths = new Map();
        
        // Enhanced drawing tools with better differentiation
        this.tools = {
            brush: { name: 'Brush', icon: '🖌️', cursor: 'crosshair' },
            pencil: { name: 'Pencil', icon: '✏️', cursor: 'crosshair' },
            eraser: { name: 'Eraser', icon: '🧽', cursor: 'crosshair' },
            bucket: { name: 'Fill', icon: '🎨', cursor: 'crosshair' },
            eyedropper: { name: 'Eyedropper', icon: '💉', cursor: 'crosshair' },
            line: { name: 'Line', icon: '📏', cursor: 'crosshair' },
            rectangle: { name: 'Rectangle', icon: '⬜', cursor: 'crosshair' },
            circle: { name: 'Circle', icon: '⭕', cursor: 'crosshair' },
            text: { name: 'Text', icon: 'A', cursor: 'text' }
        };
        
        // Quick color presets
        this.quickColors = [
            '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
            '#800000', '#ff0000', '#ff6666', '#ffcccc',
            '#008000', '#00ff00', '#66ff66', '#ccffcc',
            '#000080', '#0000ff', '#6666ff', '#ccccff',
            '#808000', '#ffff00', '#ffff66', '#ffffcc',
            '#800080', '#ff00ff', '#ff66ff', '#ffccff',
            '#008080', '#00ffff', '#66ffff', '#ccffff',
            '#804000', '#ff8000', '#ffcc66', '#ffe6cc'
        ];
        
        // Default settings
        this.defaultSettings = {
            tool: 'brush',
            color: '#000000',
            backgroundColor: '#ffffff',
            brushSize: 5,
            shapeMode: 'outline', // 'outline' or 'fill'
            fontSize: 16,
            fontFamily: 'Arial',
            canvasWidth: 800,
            canvasHeight: 600
        };
    }

    launch() {
        this.createNewDocument();
    }

    createNewDocument(width = 800, height = 600, filename = null) {
        this.documentCounter++;
        const documentId = `paint-${Date.now()}-${this.documentCounter}`;
        const title = filename || `Untitled Image ${this.documentCounter}`;
        
        const document = {
            id: documentId,
            filename: filename,
            saved: filename ? true : false,
            settings: { ...this.defaultSettings },
            canvasWidth: width,
            canvasHeight: height,
            lastModified: new Date(),
            undoStack: [],
            redoStack: [],
            isDrawing: false,
            startX: 0,
            startY: 0,
            tempCanvas: null,
            textInput: null
        };
        
        this.documents.set(documentId, document);
        this.activeDocumentId = documentId;
        
        const windowContent = this.createPaintInterface(documentId);
        
        const window = this.windowManager.createWindow(
            documentId,
            `🎨 ${title}`,
            windowContent,
            { width: '1000px', height: '700px', x: '50px', y: '50px' }
        );
        
        this.setupEventHandlers(documentId);
        this.initializeCanvas(documentId);
        this.updateWindowTitle(documentId);
        
        return documentId;
    }

    createPaintInterface(documentId) {
        const paintDoc = this.documents.get(documentId);
        
        return `
            <div class="paint-container" data-document-id="${documentId}" data-tool="${paintDoc.settings.tool}">
                <style>
                    .paint-quick-colors-grid {
                        display: grid;
                        grid-template-columns: repeat(16, 14px);
                        gap: 2px;
                        margin: 4px 0;
                    }
                    
                    .paint-quick-color-item {
                        width: 14px;
                        height: 14px;
                        border: 1px solid #666;
                        cursor: pointer;
                        border-radius: 2px;
                    }
                    
                    .paint-quick-color-item:hover {
                        border: 2px solid #000;
                        box-shadow: 0 0 4px rgba(0,0,0,0.5);
                    }
                    
                    .paint-clickable-color {
                        cursor: pointer;
                        border: 2px outset #c0c0c0;
                        position: relative;
                    }
                    
                    .paint-clickable-color:hover {
                        border: 2px inset #c0c0c0;
                    }
                    
                    .paint-clickable-color:active {
                        border: 2px inset #999;
                    }
                    
                    .paint-color-section-item {
                        margin: 2px 0;
                    }
                    
                    .paint-color-palette-container {
                        background: #f0f0f0;
                        border: 2px inset #c0c0c0;
                        padding: 6px;
                        font-size: 10px;
                        margin: 2px 0;
                    }
                    
                    /* File Dialog Styles - matching Notepad */
                    .file-dialog {
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: #f0f0f0;
                        border: 2px outset #c0c0c0;
                        box-shadow: 4px 4px 8px rgba(0,0,0,0.3);
                        z-index: 2000;
                        min-width: 400px;
                        max-width: 500px;
                    }
                    
                    .dialog-content {
                        padding: 0;
                    }
                    
                    .dialog-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 8px 12px;
                        background: linear-gradient(to bottom, #0078d4, #106ebe);
                        color: white;
                        font-weight: bold;
                        font-size: 12px;
                    }
                    
                    .dialog-title {
                        font-size: 12px;
                    }
                    
                    .dialog-close {
                        background: none;
                        border: none;
                        color: white;
                        font-size: 16px;
                        cursor: pointer;
                        padding: 2px 6px;
                        border-radius: 2px;
                    }
                    
                    .dialog-close:hover {
                        background: rgba(255,255,255,0.2);
                    }
                    
                    .dialog-body {
                        padding: 12px;
                        max-height: 300px;
                    }
                    
                    .file-list {
                        max-height: 200px;
                        overflow-y: auto;
                        border: 1px inset #c0c0c0;
                        background: white;
                        margin-bottom: 12px;
                    }
                    
                    .file-item {
                        padding: 8px 12px;
                        cursor: pointer;
                        border-bottom: 1px solid #f0f0f0;
                        font-size: 11px;
                    }
                    
                    .file-item:hover {
                        background: #e8f4ff;
                    }
                    
                    .file-item.selected {
                        background: #cce7ff;
                        border-color: #99d6ff;
                    }
                    
                    .file-info {
                        font-size: 9px;
                        color: #666;
                        margin-top: 2px;
                    }
                    
                    .save-form {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                        margin-bottom: 12px;
                    }
                    
                    .save-form label {
                        font-weight: bold;
                        font-size: 11px;
                    }
                    
                    .filename-input, .width-input, .height-input {
                        padding: 6px 8px;
                        border: 1px inset #c0c0c0;
                        font-size: 11px;
                    }
                    
                    .filename-input:focus, .width-input:focus, .height-input:focus {
                        outline: none;
                        border-color: #0066cc;
                    }
                    
                    .save-location {
                        font-size: 10px;
                        color: #666;
                        background: #f8f8f8;
                        padding: 4px 8px;
                        border: 1px inset #e0e0e0;
                        border-radius: 2px;
                    }
                    
                    .format-info {
                        font-size: 10px;
                        padding: 4px 8px;
                        border-radius: 2px;
                        background: #fff3cd;
                        border: 1px solid #ffeaa7;
                        color: #856404;
                    }
                    
                    .dialog-buttons {
                        display: flex;
                        gap: 8px;
                        justify-content: center;
                    }
                    
                    .open-btn, .save-btn {
                        background: linear-gradient(to bottom, #4CAF50, #45a049);
                        border: 1px outset #4CAF50;
                        padding: 6px 16px;
                        font-size: 11px;
                        font-weight: bold;
                        color: white;
                        cursor: pointer;
                        border-radius: 2px;
                    }
                    
                    .open-btn:hover, .save-btn:hover {
                        background: linear-gradient(to bottom, #5CBF60, #4CAF50);
                    }
                    
                    .open-btn:active, .save-btn:active {
                        border: 1px inset #4CAF50;
                        background: linear-gradient(to bottom, #45a049, #4CAF50);
                    }
                    
                    .dialog-button {
                        background: linear-gradient(to bottom, #dfdfdf, #c0c0c0);
                        border: 1px outset #c0c0c0;
                        padding: 6px 16px;
                        font-size: 11px;
                        cursor: pointer;
                        border-radius: 2px;
                    }
                    
                    .dialog-button:hover {
                        background: linear-gradient(to bottom, #e8e8e8, #d0d0d0);
                    }
                    
                    .dialog-button:active {
                        border: 1px inset #c0c0c0;
                        background: linear-gradient(to bottom, #c0c0c0, #dfdfdf);
                    }
                    
                    /* Animation for messages */
                    @keyframes slideIn {
                        from {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                </style>
                
                <!-- Menu Bar -->
                <div class="paint-menubar">
                    <div class="menu-item" data-action="new">📄 New</div>
                    <div class="menu-item" data-action="open">📂 Open</div>
                    <div class="menu-item" data-action="save">💾 Save</div>
                    <div class="menu-item" data-action="saveas">💾 Save As</div>
                    <div class="menu-separator">|</div>
                    <div class="menu-item" data-action="undo">↶ Undo</div>
                    <div class="menu-item" data-action="redo">↷ Redo</div>
                    <div class="menu-item" data-action="clear">🗑️ Clear</div>
                    <div class="menu-separator">|</div>
                    <div class="menu-item" data-action="resize">📐 Resize Canvas</div>
                </div>
                
                <!-- Compact Toolbar -->
                <div class="paint-toolbar">
                    <div class="toolbar-section">
                        <label>Tools:</label>
                        <div class="tool-buttons">
                            ${Object.entries(this.tools).map(([key, tool]) => 
                                `<button class="tool-btn ${key === paintDoc.settings.tool ? 'active' : ''}" 
                                         data-tool="${key}" 
                                         title="${tool.name}">
                                    ${tool.icon}
                                </button>`
                            ).join('')}
                        </div>
                    </div>
                    
                    <div class="toolbar-section">
                        <label>Size:</label>
                        <div class="size-controls">
                            <input type="range" class="size-slider" min="1" max="50" value="${paintDoc.settings.brushSize}">
                            <span class="size-display">${paintDoc.settings.brushSize}px</span>
                        </div>
                    </div>
                    
                    <div class="toolbar-section shape-mode">
                        <label>Mode:</label>
                        <button class="mode-btn outline-btn active" data-mode="outline">Outline</button>
                        <button class="mode-btn fill-btn" data-mode="fill">Fill</button>
                    </div>
                    
                    <div class="toolbar-section text-options">
                        <label>Font:</label>
                        <select class="font-select" style="font-size: 10px; padding: 2px;">
                            <option value="Arial">Arial</option>
                            <option value="Times New Roman">Times</option>
                            <option value="Courier New">Courier</option>
                            <option value="Helvetica">Helvetica</option>
                        </select>
                        <input type="number" class="font-size-input" min="8" max="72" value="${paintDoc.settings.fontSize}">
                    </div>
                </div>
                
                <!-- Compact Color Panel -->
                <div class="paint-color-palette-container">
                    <div class="paint-color-section-wrapper">
                        <label style="font-weight: bold; font-size: 10px;">Colors:</label>
                        <div class="paint-current-colors-display">
                            <div class="paint-color-display-wrapper">
                                <div class="paint-primary-color paint-clickable-color" 
                                     style="background-color: ${paintDoc.settings.color}" 
                                     title="Click to choose primary color"
                                     data-color-type="primary"></div>
                                <div class="paint-secondary-color paint-clickable-color" 
                                     style="background-color: ${paintDoc.settings.backgroundColor}" 
                                     title="Click to choose background color"
                                     data-color-type="background"></div>
                            </div>
                            <button class="paint-swap-colors-btn" title="Swap Colors">⇄</button>
                        </div>
                    </div>
                    
                    <div class="paint-color-section-wrapper">
                        <label style="font-weight: bold; font-size: 10px;">Quick Colors:</label>
                        <div class="paint-quick-colors-grid">
                            ${this.quickColors.map(color => 
                                `<div class="paint-quick-color-item" 
                                      style="background-color: ${color}" 
                                      data-color="${color}" 
                                      title="${color}"></div>`
                            ).join('')}
                        </div>
                    </div>
                </div>
                
                <!-- Canvas Area -->
                <div class="canvas-area">
                    <div class="canvas-container" style="width: ${paintDoc.canvasWidth}px; height: ${paintDoc.canvasHeight}px;">
                        <canvas class="paint-canvas" 
                                width="${paintDoc.canvasWidth}" 
                                height="${paintDoc.canvasHeight}"
                                data-document-id="${documentId}">
                        </canvas>
                        <canvas class="temp-canvas" 
                                width="${paintDoc.canvasWidth}" 
                                height="${paintDoc.canvasHeight}"
                                style="position: absolute; top: 0; left: 0; pointer-events: none;">
                        </canvas>
                    </div>
                </div>
                
                <!-- Status Bar -->
                <div class="paint-statusbar">
                    <div class="status-info">
                        <span class="canvas-size">Canvas: ${paintDoc.canvasWidth}×${paintDoc.canvasHeight}</span>
                        <span class="mouse-pos">Position: 0, 0</span>
                        <span class="save-status">${paintDoc.saved ? 'Saved' : 'Unsaved Changes'}</span>
                        <span class="current-tool">Tool: ${this.tools[paintDoc.settings.tool].name}</span>
                    </div>
                    <div class="zoom-controls">
                        <button class="zoom-btn" data-zoom="out">🔍-</button>
                        <span class="zoom-level">100%</span>
                        <button class="zoom-btn" data-zoom="in">🔍+</button>
                        <button class="zoom-btn" data-zoom="fit">📐 Fit</button>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventHandlers(documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const paintDoc = this.documents.get(documentId);
        const canvas = container.querySelector('.paint-canvas');
        const tempCanvas = container.querySelector('.temp-canvas');
        
        // Menu actions
        container.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                this.handleMenuAction(item.dataset.action, documentId);
            });
        });
        
        // Tool buttons
        container.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectTool(btn.dataset.tool, documentId);
            });
        });
        
        // Size slider
        const sizeSlider = container.querySelector('.size-slider');
        const sizeDisplay = container.querySelector('.size-display');
        sizeSlider.addEventListener('input', (e) => {
            const size = parseInt(e.target.value);
            paintDoc.settings.brushSize = size;
            sizeDisplay.textContent = `${size}px`;
        });
        
        // Shape mode buttons
        container.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                paintDoc.settings.shapeMode = btn.dataset.mode;
            });
        });
        
        // Font options
        const fontSelect = container.querySelector('.font-select');
        const fontSizeInput = container.querySelector('.font-size-input');
        
        fontSelect.addEventListener('change', (e) => {
            paintDoc.settings.fontFamily = e.target.value;
        });
        
        fontSizeInput.addEventListener('input', (e) => {
            paintDoc.settings.fontSize = parseInt(e.target.value);
        });
        
        // Quick colors
        container.querySelectorAll('.paint-quick-color-item').forEach(colorBtn => {
            colorBtn.addEventListener('click', (e) => {
                this.setPrimaryColor(colorBtn.dataset.color, documentId);
            });
            
            colorBtn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.setBackgroundColor(colorBtn.dataset.color, documentId);
            });
        });
        
        // Clickable color swatches
        container.querySelectorAll('.paint-clickable-color').forEach(colorSwatch => {
            colorSwatch.addEventListener('click', (e) => {
                this.openColorPicker(colorSwatch.dataset.colorType, documentId);
            });
        });
        
        // Swap colors button
        container.querySelector('.paint-swap-colors-btn').addEventListener('click', () => {
            this.swapColors(documentId);
        });
        
        // Canvas events
        this.setupCanvasEvents(canvas, tempCanvas, documentId);
        
        // Other controls
        this.setupOtherControls(documentId);
        
        // Update tool options visibility
        this.updateToolOptionsVisibility(documentId);
    }

    openColorPicker(colorType, documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const paintDoc = this.documents.get(documentId);
        
        // Create a hidden color input
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.style.position = 'absolute';
        colorInput.style.visibility = 'hidden';
        colorInput.style.width = '0';
        colorInput.style.height = '0';
        
        // Set current color
        if (colorType === 'primary') {
            colorInput.value = paintDoc.settings.color;
        } else {
            colorInput.value = paintDoc.settings.backgroundColor;
        }
        
        // Add to document temporarily
        document.body.appendChild(colorInput);
        
        // Set up event handler
        colorInput.addEventListener('change', (e) => {
            const newColor = e.target.value;
            
            if (colorType === 'primary') {
                this.setPrimaryColor(newColor, documentId);
            } else {
                this.setBackgroundColor(newColor, documentId);
            }
            
            // Clean up
            document.body.removeChild(colorInput);
        }, { once: true });
        
        // Open the color picker
        colorInput.click();
    }

    setupOtherControls(documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvas = container.querySelector('.paint-canvas');
        
        // Zoom controls
        container.querySelectorAll('.zoom-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleZoom(btn.dataset.zoom, documentId);
            });
        });
        
        // Mouse position tracking
        canvas.addEventListener('mousemove', (e) => {
            this.updateMousePosition(e, documentId);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.activeDocumentId === documentId) {
                this.handleKeyboardShortcuts(e, documentId);
            }
        });
    }

    initializeCanvas(documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvas = container.querySelector('.paint-canvas');
        const ctx = canvas.getContext('2d');
        const paintDoc = this.documents.get(documentId);
        
        // Clear canvas and fill with background color - NO TEST DOT!
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = paintDoc.settings.backgroundColor;
        ctx.fillRect(0, 0, paintDoc.canvasWidth, paintDoc.canvasHeight);
        
        // Save initial state for undo
        this.saveState(documentId);
        
        // Update tool options visibility
        this.updateToolOptionsVisibility(documentId);
    }

    selectTool(tool, documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const paintDoc = this.documents.get(documentId);
        
        // Commit any pending text before switching tools
        if (paintDoc.textInput && tool !== 'text') {
            this.commitText(documentId);
        }
        
        paintDoc.settings.tool = tool;
        
        // Update UI
        container.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
        
        // Update container data attribute for CSS
        container.dataset.tool = tool;
        
        // Update cursor
        const canvas = container.querySelector('.paint-canvas');
        canvas.style.cursor = this.tools[tool].cursor;
        
        // Update status
        container.querySelector('.current-tool').textContent = `Tool: ${this.tools[tool].name}`;
        
        // Show/hide tool options
        this.updateToolOptionsVisibility(documentId);
    }

    updateToolOptionsVisibility(documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const paintDoc = this.documents.get(documentId);
        const tool = paintDoc.settings.tool;
        
        // Hide all option sections
        const shapeMode = container.querySelector('.shape-mode');
        const textOptions = container.querySelector('.text-options');
        
        shapeMode.classList.remove('visible');
        textOptions.classList.remove('visible');
        
        // Show relevant options
        if (['rectangle', 'circle'].includes(tool)) {
            shapeMode.classList.add('visible');
        }
        
        if (tool === 'text') {
            textOptions.classList.add('visible');
        }
    }

    setupCanvasEvents(canvas, tempCanvas, documentId) {
        canvas.addEventListener('dragstart', (e) => e.preventDefault());
        canvas.addEventListener('selectstart', (e) => e.preventDefault());
        
        canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.startDrawing(e, documentId);
        });
        
        canvas.addEventListener('mousemove', (e) => {
            e.preventDefault();
            this.draw(e, documentId);
        });
        
        canvas.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.stopDrawing(documentId);
        });
        
        canvas.addEventListener('mouseleave', () => {
            this.stopDrawing(documentId);
        });
        
        // Touch events
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY,
                target: canvas,
                preventDefault: () => {}
            };
            this.startDrawing(mouseEvent, documentId);
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY,
                target: canvas,
                preventDefault: () => {}
            };
            this.draw(mouseEvent, documentId);
        });
        
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopDrawing(documentId);
        });
    }

    startDrawing(e, documentId) {
        const paintDoc = this.documents.get(documentId);
        const canvas = e.target;
        const rect = canvas.getBoundingClientRect();
        
        paintDoc.startX = e.clientX - rect.left;
        paintDoc.startY = e.clientY - rect.top;
        
        const tool = paintDoc.settings.tool;
        
        if (tool === 'text') {
            // Don't set isDrawing for text tool
            this.placeTextInput(paintDoc.startX, paintDoc.startY, documentId);
            return;
        }
        
        // Set isDrawing for all other tools
        paintDoc.isDrawing = true;
        
        if (tool === 'brush' || tool === 'pencil') {
            this.drawDot(paintDoc.startX, paintDoc.startY, documentId);
        } else if (tool === 'eraser') {
            this.erase(paintDoc.startX, paintDoc.startY, documentId);
        } else if (tool === 'bucket') {
            this.floodFill(paintDoc.startX, paintDoc.startY, documentId);
        } else if (tool === 'eyedropper') {
            this.pickColor(paintDoc.startX, paintDoc.startY, documentId);
        }
        
        this.markUnsaved(documentId);
    }

    draw(e, documentId) {
        const paintDoc = this.documents.get(documentId);
        if (!paintDoc.isDrawing) return;
        
        const canvas = e.target;
        const rect = canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        const tool = paintDoc.settings.tool;
        
        if (tool === 'brush' || tool === 'pencil') {
            this.drawLine(paintDoc.startX, paintDoc.startY, currentX, currentY, documentId);
            paintDoc.startX = currentX;
            paintDoc.startY = currentY;
        } else if (tool === 'eraser') {
            this.eraseLine(paintDoc.startX, paintDoc.startY, currentX, currentY, documentId);
            paintDoc.startX = currentX;
            paintDoc.startY = currentY;
        } else if (['line', 'rectangle', 'circle'].includes(tool)) {
            this.drawPreview(paintDoc.startX, paintDoc.startY, currentX, currentY, documentId);
        }
    }

    stopDrawing(documentId) {
        const paintDoc = this.documents.get(documentId);
        if (!paintDoc.isDrawing) return;
        
        paintDoc.isDrawing = false;
        
        const tool = paintDoc.settings.tool;
        
        if (['line', 'rectangle', 'circle'].includes(tool)) {
            this.commitShape(documentId);
        }
        
        this.saveState(documentId);
    }

    drawDot(x, y, documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvas = container.querySelector('.paint-canvas');
        const ctx = canvas.getContext('2d');
        const paintDoc = this.documents.get(documentId);
        
        const tool = paintDoc.settings.tool;
        const size = paintDoc.settings.brushSize;
        
        ctx.save();
        
        if (tool === 'pencil') {
            // Pencil: hard, pixel-perfect squares
            ctx.fillStyle = paintDoc.settings.color;
            const halfSize = Math.floor(size / 2);
            ctx.fillRect(x - halfSize, y - halfSize, size, size);
        } else {
            // Brush: soft, round
            ctx.fillStyle = paintDoc.settings.color;
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        ctx.restore();
    }

    drawLine(x1, y1, x2, y2, documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvas = container.querySelector('.paint-canvas');
        const ctx = canvas.getContext('2d');
        const paintDoc = this.documents.get(documentId);
        
        const tool = paintDoc.settings.tool;
        const size = paintDoc.settings.brushSize;
        
        ctx.save();
        ctx.strokeStyle = paintDoc.settings.color;
        ctx.lineWidth = size;
        
        if (tool === 'pencil') {
            // Pencil: hard, square caps
            ctx.lineCap = 'square';
            ctx.lineJoin = 'miter';
        } else {
            // Brush: soft, round caps
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        ctx.restore();
    }

    erase(x, y, documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvas = container.querySelector('.paint-canvas');
        const ctx = canvas.getContext('2d');
        const paintDoc = this.documents.get(documentId);
        
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, paintDoc.settings.brushSize / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    }

    eraseLine(x1, y1, x2, y2, documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvas = container.querySelector('.paint-canvas');
        const ctx = canvas.getContext('2d');
        const paintDoc = this.documents.get(documentId);
        
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = paintDoc.settings.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
    }

    drawPreview(startX, startY, currentX, currentY, documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const tempCanvas = container.querySelector('.temp-canvas');
        const ctx = tempCanvas.getContext('2d');
        const paintDoc = this.documents.get(documentId);
        
        ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        ctx.strokeStyle = paintDoc.settings.color;
        ctx.fillStyle = paintDoc.settings.color;
        ctx.lineWidth = paintDoc.settings.brushSize;
        ctx.lineCap = 'round';
        
        const tool = paintDoc.settings.tool;
        const mode = paintDoc.settings.shapeMode;
        
        if (tool === 'line') {
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();
        } else if (tool === 'rectangle') {
            const width = currentX - startX;
            const height = currentY - startY;
            
            if (mode === 'fill') {
                ctx.fillRect(startX, startY, width, height);
            } else {
                ctx.strokeRect(startX, startY, width, height);
            }
        } else if (tool === 'circle') {
            const radius = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));
            ctx.beginPath();
            ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
            
            if (mode === 'fill') {
                ctx.fill();
            } else {
                ctx.stroke();
            }
        }
    }

    commitShape(documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvas = container.querySelector('.paint-canvas');
        const tempCanvas = container.querySelector('.temp-canvas');
        const ctx = canvas.getContext('2d');
        const tempCtx = tempCanvas.getContext('2d');
        
        ctx.drawImage(tempCanvas, 0, 0);
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    }

    placeTextInput(x, y, documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvasContainer = container.querySelector('.canvas-container');
        const paintDoc = this.documents.get(documentId);
        
        // Remove existing text input
        if (paintDoc.textInput) {
            this.commitText(documentId);
        }
        
        // Create text input
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.className = 'text-input';
        textInput.style.position = 'absolute';
        textInput.style.left = x + 'px';
        textInput.style.top = y + 'px';
        textInput.style.fontSize = paintDoc.settings.fontSize + 'px';
        textInput.style.fontFamily = paintDoc.settings.fontFamily;
        textInput.style.color = paintDoc.settings.color;
        textInput.style.background = 'rgba(255, 255, 255, 0.9)';
        textInput.style.border = '2px dashed #0066cc';
        textInput.style.outline = 'none';
        textInput.style.padding = '2px 4px';
        textInput.style.minWidth = '100px';
        textInput.style.zIndex = '10';
        textInput.placeholder = 'Type here...';
        textInput.value = '';
        
        canvasContainer.appendChild(textInput);
        paintDoc.textInput = textInput;
        
        // Focus immediately
        textInput.focus();
        
        // Handle committing text
        const commitHandler = () => {
            this.commitText(documentId);
        };
        
        // Commit on Enter
        textInput.addEventListener('keydown', (e) => {
            e.stopPropagation(); // Prevent paint shortcuts
            
            if (e.key === 'Enter') {
                e.preventDefault();
                commitHandler();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                textInput.remove();
                paintDoc.textInput = null;
            }
        });
        
        // Commit on click outside
        textInput.addEventListener('blur', (e) => {
            setTimeout(() => {
                if (paintDoc.textInput === textInput) {
                    commitHandler();
                }
            }, 100);
        });
        
        // Prevent canvas interaction while typing
        textInput.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
        
        textInput.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Auto-resize width as user types
        textInput.addEventListener('input', () => {
            const minWidth = Math.max(100, textInput.value.length * (paintDoc.settings.fontSize * 0.6) + 20);
            textInput.style.width = minWidth + 'px';
        });
    }

    commitText(documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvas = container.querySelector('.paint-canvas');
        const ctx = canvas.getContext('2d');
        const paintDoc = this.documents.get(documentId);
        const textInput = paintDoc.textInput;
        
        if (!textInput) return;
        
        const text = textInput.value.trim();
        
        if (!text) {
            textInput.remove();
            paintDoc.textInput = null;
            return;
        }
        
        const x = parseInt(textInput.style.left);
        const y = parseInt(textInput.style.top);
        
        ctx.save();
        ctx.font = `${paintDoc.settings.fontSize}px ${paintDoc.settings.fontFamily}`;
        ctx.fillStyle = paintDoc.settings.color;
        ctx.textBaseline = 'top';
        
        // Handle multi-line text
        const lines = text.split('\n');
        lines.forEach((line, index) => {
            if (line.trim()) {
                ctx.fillText(line, x, y + (index * paintDoc.settings.fontSize * 1.2));
            }
        });
        
        ctx.restore();
        
        // Clean up
        textInput.remove();
        paintDoc.textInput = null;
        
        this.saveState(documentId);
        this.markUnsaved(documentId);
    }

    floodFill(x, y, documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvas = container.querySelector('.paint-canvas');
        const ctx = canvas.getContext('2d');
        const paintDoc = this.documents.get(documentId);
        
        x = Math.floor(x);
        y = Math.floor(y);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        const targetColor = this.getPixelColor(data, x, y, canvas.width);
        const fillColor = this.hexToRgb(paintDoc.settings.color);
        fillColor.a = 255;
        
        if (this.colorsEqual(targetColor, fillColor)) return;
        
        this.floodFillStack(data, x, y, canvas.width, canvas.height, targetColor, fillColor);
        ctx.putImageData(imageData, 0, 0);
    }

    floodFillStack(data, startX, startY, width, height, targetColor, fillColor) {
        const stack = [[startX, startY]];
        const visited = new Set();
        
        while (stack.length > 0) {
            const [x, y] = stack.pop();
            
            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            
            const key = y * width + x;
            if (visited.has(key)) continue;
            visited.add(key);
            
            const currentColor = this.getPixelColor(data, x, y, width);
            if (!this.colorsEqual(currentColor, targetColor)) continue;
            
            this.setPixelColor(data, x, y, width, fillColor);
            
            stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
    }

    getPixelColor(data, x, y, width) {
        const index = (y * width + x) * 4;
        return {
            r: data[index],
            g: data[index + 1],
            b: data[index + 2],
            a: data[index + 3]
        };
    }

    setPixelColor(data, x, y, width, color) {
        const index = (y * width + x) * 4;
        data[index] = color.r;
        data[index + 1] = color.g;
        data[index + 2] = color.b;
        data[index + 3] = color.a || 255;
    }

    colorsEqual(color1, color2) {
        return color1.r === color2.r && color1.g === color2.g && 
               color1.b === color2.b && color1.a === color2.a;
    }

    pickColor(x, y, documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvas = container.querySelector('.paint-canvas');
        const ctx = canvas.getContext('2d');
        
        const imageData = ctx.getImageData(x, y, 1, 1);
        const data = imageData.data;
        
        const color = this.rgbToHex(data[0], data[1], data[2]);
        this.setPrimaryColor(color, documentId);
    }

    setPrimaryColor(color, documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const paintDoc = this.documents.get(documentId);
        
        paintDoc.settings.color = color;
        
        const primaryColorEl = container.querySelector('.paint-primary-color');
        if (primaryColorEl) {
            primaryColorEl.style.backgroundColor = color;
        }
    }

    setBackgroundColor(color, documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const paintDoc = this.documents.get(documentId);
        
        paintDoc.settings.backgroundColor = color;
        
        const secondaryColorEl = container.querySelector('.paint-secondary-color');
        if (secondaryColorEl) {
            secondaryColorEl.style.backgroundColor = color;
        }
    }

    swapColors(documentId) {
        const paintDoc = this.documents.get(documentId);
        const tempColor = paintDoc.settings.color;
        
        this.setPrimaryColor(paintDoc.settings.backgroundColor, documentId);
        this.setBackgroundColor(tempColor, documentId);
    }

    // Color conversion utilities
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    // Menu actions and file operations
    handleMenuAction(action, documentId) {
        switch (action) {
            case 'new':
                this.showNewCanvasDialog(documentId);
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
                this.undo(documentId);
                break;
            case 'redo':
                this.redo(documentId);
                break;
            case 'clear':
                this.clearCanvas(documentId);
                break;
            case 'resize':
                this.showResizeDialog(documentId);
                break;
        }
    }

    saveState(documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvas = container.querySelector('.paint-canvas');
        const paintDoc = this.documents.get(documentId);
        
        paintDoc.undoStack.push(canvas.toDataURL());
        
        if (paintDoc.undoStack.length > 50) {
            paintDoc.undoStack.shift();
        }
        
        paintDoc.redoStack = [];
    }

    undo(documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvas = container.querySelector('.paint-canvas');
        const ctx = canvas.getContext('2d');
        const paintDoc = this.documents.get(documentId);
        
        if (paintDoc.undoStack.length > 1) {
            paintDoc.redoStack.push(paintDoc.undoStack.pop());
            
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = paintDoc.undoStack[paintDoc.undoStack.length - 1];
            
            this.markUnsaved(documentId);
        }
    }

    redo(documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvas = container.querySelector('.paint-canvas');
        const ctx = canvas.getContext('2d');
        const paintDoc = this.documents.get(documentId);
        
        if (paintDoc.redoStack.length > 0) {
            const redoState = paintDoc.redoStack.pop();
            paintDoc.undoStack.push(redoState);
            
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = redoState;
            
            this.markUnsaved(documentId);
        }
    }

    clearCanvas(documentId) {
        if (confirm('Are you sure you want to clear the canvas?')) {
            const container = document.querySelector(`[data-document-id="${documentId}"]`);
            const canvas = container.querySelector('.paint-canvas');
            const ctx = canvas.getContext('2d');
            const paintDoc = this.documents.get(documentId);
            
            ctx.fillStyle = paintDoc.settings.backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            this.saveState(documentId);
            this.markUnsaved(documentId);
        }
    }

    updateMousePosition(e, documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const rect = e.target.getBoundingClientRect();
        const x = Math.floor(e.clientX - rect.left);
        const y = Math.floor(e.clientY - rect.top);
        
        container.querySelector('.mouse-pos').textContent = `Position: ${x}, ${y}`;
    }

    handleKeyboardShortcuts(e, documentId) {
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
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.redo(documentId);
                    } else {
                        this.undo(documentId);
                    }
                    break;
            }
        }
        
        const toolKeys = {
            'b': 'brush',
            'p': 'pencil',
            'e': 'eraser',
            'f': 'bucket',
            'i': 'eyedropper',
            'l': 'line',
            'r': 'rectangle',
            'c': 'circle',
            't': 'text'
        };
        
        if (toolKeys[e.key.toLowerCase()] && !e.ctrlKey) {
            this.selectTool(toolKeys[e.key.toLowerCase()], documentId);
        }
    }

    handleZoom(direction, documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvasContainer = container.querySelector('.canvas-container');
        const zoomLevel = container.querySelector('.zoom-level');
        
        let currentZoom = parseInt(zoomLevel.textContent.replace('%', ''));
        
        if (direction === 'in' && currentZoom < 500) {
            currentZoom += 25;
        } else if (direction === 'out' && currentZoom > 25) {
            currentZoom -= 25;
        } else if (direction === 'fit') {
            currentZoom = 100;
        }
        
        zoomLevel.textContent = `${currentZoom}%`;
        canvasContainer.style.transform = `scale(${currentZoom / 100})`;
        canvasContainer.style.transformOrigin = 'top left';
    }

    markUnsaved(documentId) {
        const paintDoc = this.documents.get(documentId);
        paintDoc.saved = false;
        this.updateStatus(documentId);
        this.updateWindowTitle(documentId);
    }

    updateStatus(documentId) {
        const paintDoc = this.documents.get(documentId);
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const saveStatus = container.querySelector('.save-status');
        
        saveStatus.textContent = paintDoc.saved ? 'Saved' : 'Unsaved Changes';
        saveStatus.className = `save-status ${paintDoc.saved ? 'saved' : 'unsaved'}`;
    }

    updateWindowTitle(documentId) {
        const paintDoc = this.documents.get(documentId);
        const windowElement = document.getElementById(`window-${documentId}`);
        if (!windowElement) return;
        
        const titleElement = windowElement.querySelector('.window-title');
        const title = paintDoc.filename || `Untitled Image ${documentId.split('-').pop()}`;
        const unsavedMarker = paintDoc.saved ? '' : '*';
        
        titleElement.textContent = `🎨 ${title}${unsavedMarker}`;
    }

    // File operations (working implementations)
    showOpenDialog(documentId) {
        const files = this.fileSystem.listContents(['root', 'Pictures']);
        const imageFiles = files.filter(file => 
            file.name.endsWith('.png') || 
            file.name.endsWith('.jpg') || 
            file.name.endsWith('.jpeg') || 
            file.name.endsWith('.gif') || 
            file.name.endsWith('.bmp')
        );
        
        if (imageFiles.length === 0) {
            this.showMessage('No image files found in Pictures folder', 'info');
            return;
        }
        
        const dialog = document.createElement('div');
        dialog.className = 'file-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <div class="dialog-title">🖼️ Open Image</div>
                    <div class="dialog-close" onclick="this.closest('.file-dialog').remove()">×</div>
                </div>
                <div class="dialog-body">
                    <div class="file-list">
                        ${imageFiles.map(file => {
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
                                🖼️ ${file.name}
                                <div class="file-info">Modified: ${modifiedDate}</div>
                            </div>`;
                        }).join('')}
                    </div>
                    <div class="dialog-buttons">
                        <button class="open-btn" onclick="elxaOS.programs.paint.openSelectedFile('${documentId}')">Open</button>
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
        const filePath = path || ['root', 'Pictures'];
        
        console.log('Opening image file:', filename, 'from path:', filePath);
        
        const file = this.fileSystem.getFile(filePath, filename);
        if (!file) {
            this.showMessage(`File not found: ${filename}`, 'error');
            return;
        }
        
        // Create new document and load image
        const documentId = this.createNewDocument(800, 600, filename);
        this.documentPaths.set(documentId, [...filePath]);
        
        // Load image content into canvas
        this.loadImageToCanvas(file.content, documentId);
        
        this.showMessage(`Opened ${filename}`, 'success');
    }

    loadImageToCanvas(imageData, documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvas = container.querySelector('.paint-canvas');
        const ctx = canvas.getContext('2d');
        
        const img = new Image();
        img.onload = () => {
            // Resize canvas to fit image
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Update document settings
            const paintDoc = this.documents.get(documentId);
            paintDoc.canvasWidth = img.width;
            paintDoc.canvasHeight = img.height;
            
            // Update canvas container size
            const canvasContainer = container.querySelector('.canvas-container');
            canvasContainer.style.width = img.width + 'px';
            canvasContainer.style.height = img.height + 'px';
            
            // Update temp canvas too
            const tempCanvas = container.querySelector('.temp-canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            
            // Draw image
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            
            // Update status
            container.querySelector('.canvas-size').textContent = `Canvas: ${img.width}×${img.height}`;
            
            // Save initial state
            this.saveState(documentId);
            
            // Mark as saved since we just loaded it
            paintDoc.saved = true;
            this.updateStatus(documentId);
            this.updateWindowTitle(documentId);
        };
        
        img.onerror = () => {
            this.showMessage('Error loading image file', 'error');
        };
        
        img.src = imageData;
    }

    saveDocument(documentId) {
        const paintDoc = this.documents.get(documentId);
        
        if (paintDoc.filename) {
            const container = document.querySelector(`[data-document-id="${documentId}"]`);
            const canvas = container.querySelector('.paint-canvas');
            
            // Get canvas data as PNG
            const imageData = canvas.toDataURL('image/png');
            
            const savePath = this.documentPaths.get(documentId) || ['root', 'Pictures'];
            const existingFile = this.fileSystem.getFile(savePath, paintDoc.filename);
            
            if (existingFile) {
                console.log('🎨 Updating existing image:', paintDoc.filename);
                this.fileSystem.updateFileContent(savePath, paintDoc.filename, imageData);
            } else {
                console.log('🖼️ Creating new image:', paintDoc.filename);
                this.fileSystem.createFile(savePath, paintDoc.filename, imageData);
            }
            
            paintDoc.saved = true;
            this.updateStatus(documentId);
            this.updateWindowTitle(documentId);
            this.showMessage(`Saved ${paintDoc.filename}`, 'success');
        } else {
            this.showSaveAsDialog(documentId);
        }
    }

    showSaveAsDialog(documentId) {
        const paintDoc = this.documents.get(documentId);
        const defaultExt = '.png';
        
        const currentPath = this.documentPaths.get(documentId) || ['root', 'Pictures'];
        const locationName = currentPath.length > 1 ? currentPath[currentPath.length - 1] : 'Pictures';
        
        const dialog = document.createElement('div');
        dialog.className = 'file-dialog save-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <div class="dialog-title">💾 Save Image As</div>
                    <div class="dialog-close" onclick="this.closest('.file-dialog').remove()">×</div>
                </div>
                <div class="dialog-body">
                    <div class="save-form">
                        <label>Filename:</label>
                        <input type="text" class="filename-input" value="${paintDoc.filename || ('Untitled' + defaultExt)}" placeholder="Enter filename">
                        <div class="save-location">Save to: ${locationName} folder</div>
                        <div class="format-info">
                            ℹ️ Image will be saved as PNG format
                        </div>
                    </div>
                    <div class="dialog-buttons">
                        <button class="save-btn" onclick="elxaOS.programs.paint.saveWithFilename('${documentId}')">Save</button>
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
        
        const paintDoc = this.documents.get(documentId);
        
        let finalFilename = filename;
        
        // Ensure it has a proper image extension
        if (!this.hasImageExtension(finalFilename)) {
            finalFilename += '.png';
        }
        
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvas = container.querySelector('.paint-canvas');
        const imageData = canvas.toDataURL('image/png');
        
        const savePath = this.documentPaths.get(documentId) || ['root', 'Pictures'];
        const existingFile = this.fileSystem.getFile(savePath, finalFilename);
        
        if (existingFile) {
            if (confirm(`File "${finalFilename}" already exists. Do you want to overwrite it?`)) {
                console.log('🎨 Overwriting existing image:', finalFilename);
                this.fileSystem.updateFileContent(savePath, finalFilename, imageData);
            } else {
                return;
            }
        } else {
            console.log('🖼️ Creating new image:', finalFilename);
            this.fileSystem.createFile(savePath, finalFilename, imageData);
        }
        
        paintDoc.filename = finalFilename;
        paintDoc.saved = true;
        this.updateStatus(documentId);
        this.updateWindowTitle(documentId);
        
        dialog.remove();
        this.showMessage(`Saved as ${finalFilename}`, 'success');
    }

    hasImageExtension(filename) {
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp'];
        return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
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

    showNewCanvasDialog(documentId) {
        const dialog = document.createElement('div');
        dialog.className = 'file-dialog new-canvas-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <div class="dialog-title">📐 New Canvas</div>
                    <div class="dialog-close" onclick="this.closest('.file-dialog').remove()">×</div>
                </div>
                <div class="dialog-body">
                    <div class="save-form">
                        <label>Width:</label>
                        <input type="number" class="width-input" value="800" min="1" max="2000">
                        <label>Height:</label>
                        <input type="number" class="height-input" value="600" min="1" max="2000">
                        <div class="format-info">
                            ℹ️ Create a new blank canvas with specified dimensions
                        </div>
                    </div>
                    <div class="dialog-buttons">
                        <button class="save-btn" onclick="elxaOS.programs.paint.createNewWithDimensions()">Create</button>
                        <button class="dialog-button" onclick="this.closest('.file-dialog').remove()">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        const widthInput = dialog.querySelector('.width-input');
        widthInput.focus();
        widthInput.select();
    }

    createNewWithDimensions() {
        const dialog = document.querySelector('.new-canvas-dialog');
        const width = parseInt(dialog.querySelector('.width-input').value);
        const height = parseInt(dialog.querySelector('.height-input').value);
        
        if (width > 0 && height > 0 && width <= 2000 && height <= 2000) {
            this.createNewDocument(width, height);
            dialog.remove();
        } else {
            this.showMessage('Please enter valid dimensions (1-2000)', 'warning');
        }
    }

    showResizeDialog(documentId) {
        const paintDoc = this.documents.get(documentId);
        
        const dialog = document.createElement('div');
        dialog.className = 'file-dialog resize-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <div class="dialog-title">📐 Resize Canvas</div>
                    <div class="dialog-close" onclick="this.closest('.file-dialog').remove()">×</div>
                </div>
                <div class="dialog-body">
                    <div class="save-form">
                        <label>New Width:</label>
                        <input type="number" class="width-input" value="${paintDoc.canvasWidth}" min="1" max="2000">
                        <label>New Height:</label>
                        <input type="number" class="height-input" value="${paintDoc.canvasHeight}" min="1" max="2000">
                        <div class="format-info">
                            ⚠️ Resizing may crop or alter your image content
                        </div>
                    </div>
                    <div class="dialog-buttons">
                        <button class="save-btn" onclick="elxaOS.programs.paint.resizeCanvas('${documentId}')">Resize</button>
                        <button class="dialog-button" onclick="this.closest('.file-dialog').remove()">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        const widthInput = dialog.querySelector('.width-input');
        widthInput.focus();
        widthInput.select();
    }

    resizeCanvas(documentId) {
        const dialog = document.querySelector('.resize-dialog');
        const newWidth = parseInt(dialog.querySelector('.width-input').value);
        const newHeight = parseInt(dialog.querySelector('.height-input').value);
        
        if (newWidth > 0 && newHeight > 0 && newWidth <= 2000 && newHeight <= 2000) {
            const container = document.querySelector(`[data-document-id="${documentId}"]`);
            const canvas = container.querySelector('.paint-canvas');
            const tempCanvas = container.querySelector('.temp-canvas');
            const ctx = canvas.getContext('2d');
            const paintDoc = this.documents.get(documentId);
            
            // Save current image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Resize canvases
            canvas.width = newWidth;
            canvas.height = newHeight;
            tempCanvas.width = newWidth;
            tempCanvas.height = newHeight;
            
            // Update container size
            const canvasContainer = container.querySelector('.canvas-container');
            canvasContainer.style.width = newWidth + 'px';
            canvasContainer.style.height = newHeight + 'px';
            
            // Fill with background color
            ctx.fillStyle = paintDoc.settings.backgroundColor;
            ctx.fillRect(0, 0, newWidth, newHeight);
            
            // Put back the old image data (will crop if smaller, or show on white background if larger)
            ctx.putImageData(imageData, 0, 0);
            
            // Update document settings
            paintDoc.canvasWidth = newWidth;
            paintDoc.canvasHeight = newHeight;
            
            // Update status
            container.querySelector('.canvas-size').textContent = `Canvas: ${newWidth}×${newHeight}`;
            
            // Save state and mark as modified
            this.saveState(documentId);
            this.markUnsaved(documentId);
            
            dialog.remove();
            this.showMessage(`Canvas resized to ${newWidth}×${newHeight}`, 'success');
        } else {
            this.showMessage('Please enter valid dimensions (1-2000)', 'warning');
        }
    }
}