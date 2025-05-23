// =================================
// ELXAOS PAINT PROGRAM
// =================================
class PaintProgram {
    constructor(windowManager, fileSystem, eventBus) {
        this.windowManager = windowManager;
        this.fileSystem = fileSystem;
        this.eventBus = eventBus;
        this.documents = new Map();
        this.activeDocumentId = null;
        this.documentCounter = 0;
        
        // Drawing tools
        this.tools = {
            brush: { name: 'Brush', icon: '🖌️', cursor: 'crosshair' },
            pencil: { name: 'Pencil', icon: '✏️', cursor: 'crosshair' },
            eraser: { name: 'Eraser', icon: '🧽', cursor: 'crosshair' },
            bucket: { name: 'Fill', icon: '🪣', cursor: 'crosshair' },
            eyedropper: { name: 'Eyedropper', icon: '💉', cursor: 'crosshair' },
            line: { name: 'Line', icon: '📏', cursor: 'crosshair' },
            rectangle: { name: 'Rectangle', icon: '⬜', cursor: 'crosshair' },
            circle: { name: 'Circle', icon: '⭕', cursor: 'crosshair' },
            text: { name: 'Text', icon: 'A', cursor: 'text' }
        };
        
        // Color presets
        this.colorPalette = [
            '#000000', '#404040', '#808080', '#c0c0c0', '#ffffff',
            '#800000', '#ff0000', '#ff8080', '#ff4040', '#ffcccc',
            '#008000', '#00ff00', '#80ff80', '#40ff40', '#ccffcc',
            '#000080', '#0000ff', '#8080ff', '#4040ff', '#ccccff',
            '#008080', '#00ffff', '#80ffff', '#40ffff', '#ccffff',
            '#800080', '#ff00ff', '#ff80ff', '#ff40ff', '#ffccff',
            '#808000', '#ffff00', '#ffff80', '#ffff40', '#ffffcc',
            '#804000', '#ff8000', '#ffcc80', '#ffaa40', '#ffe6cc'
        ];
        
        // Default settings
        this.defaultSettings = {
            tool: 'brush',
            color: '#000000',
            backgroundColor: '#ffffff',
            brushSize: 5,
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
            tempCanvas: null
        };
        
        this.documents.set(documentId, document);
        this.activeDocumentId = documentId;
        
        const windowContent = this.createPaintInterface(documentId);
        
        const window = this.windowManager.createWindow(
            documentId,
            `🎨 ${title}`,
            windowContent,
            { width: '900px', height: '700px', x: '100px', y: '100px' }
        );
        
        this.setupEventHandlers(documentId);
        this.initializeCanvas(documentId);
        this.updateWindowTitle(documentId);
        
        return documentId;
    }

    createPaintInterface(documentId) {
        const paintDoc = this.documents.get(documentId);
        
        return `
            <div class="paint-container" data-document-id="${documentId}">
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
                
                <!-- Tools Toolbar -->
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
                        <input type="range" class="size-slider" min="1" max="50" value="${paintDoc.settings.brushSize}">
                        <span class="size-display">${paintDoc.settings.brushSize}px</span>
                    </div>
                    
                    <div class="toolbar-section">
                        <label>Colors:</label>
                        <div class="color-indicators">
                            <div class="primary-color" style="background-color: ${paintDoc.settings.color}" title="Primary Color"></div>
                            <div class="secondary-color" style="background-color: ${paintDoc.settings.backgroundColor}" title="Background Color"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Color Palette -->
                <div class="paint-palette">
                    <div class="palette-colors">
                        ${this.colorPalette.map(color => 
                            `<div class="palette-color" 
                                  style="background-color: ${color}" 
                                  data-color="${color}" 
                                  title="${color}"></div>`
                        ).join('')}
                    </div>
                    <div class="custom-colors">
                        <input type="color" class="color-picker" value="${paintDoc.settings.color}">
                        <input type="color" class="bg-color-picker" value="${paintDoc.settings.backgroundColor}">
                        <button class="swap-colors" title="Swap Colors">⇄</button>
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
        
        // Initialize the UI with current colors
        this.setPrimaryColor(paintDoc.settings.color, documentId);
        this.setBackgroundColor(paintDoc.settings.backgroundColor, documentId);
        
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
            const size = e.target.value;
            paintDoc.settings.brushSize = parseInt(size);
            sizeDisplay.textContent = `${size}px`;
        });
        
        // Color palette
        container.querySelectorAll('.palette-color').forEach(colorBtn => {
            colorBtn.addEventListener('click', (e) => {
                if (e.button === 0 || e.type === 'click') { // Left click
                    this.setPrimaryColor(colorBtn.dataset.color, documentId);
                }
            });
            
            colorBtn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.setBackgroundColor(colorBtn.dataset.color, documentId);
            });
        });
        
        // Color pickers
        const colorPicker = container.querySelector('.color-picker');
        const bgColorPicker = container.querySelector('.bg-color-picker');
        
        colorPicker.addEventListener('change', (e) => {
            this.setPrimaryColor(e.target.value, documentId);
        });
        
        bgColorPicker.addEventListener('change', (e) => {
            this.setBackgroundColor(e.target.value, documentId);
        });
        
        // Swap colors button
        container.querySelector('.swap-colors').addEventListener('click', () => {
            this.swapColors(documentId);
        });
        
        // Canvas drawing events
        this.setupCanvasEvents(canvas, tempCanvas, documentId);
        
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

    setupCanvasEvents(canvas, tempCanvas, documentId) {
        const paintDoc = this.documents.get(documentId);
        
        // Prevent default drag behavior
        canvas.addEventListener('dragstart', (e) => e.preventDefault());
        canvas.addEventListener('selectstart', (e) => e.preventDefault());
        
        canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            console.log('Canvas mousedown event fired');
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
        
        // Touch events for mobile support
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
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
            const rect = canvas.getBoundingClientRect();
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

    initializeCanvas(documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvas = container.querySelector('.paint-canvas');
        const ctx = canvas.getContext('2d');
        const paintDoc = this.documents.get(documentId);
        
        console.log('Initializing canvas:', canvas.width, 'x', canvas.height);
        console.log('Canvas element:', canvas);
        console.log('Canvas context:', ctx);
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Fill with background color
        ctx.fillStyle = paintDoc.settings.backgroundColor;
        ctx.fillRect(0, 0, paintDoc.canvasWidth, paintDoc.canvasHeight);
        
        console.log('Canvas initialized with background:', paintDoc.settings.backgroundColor);
        
        // Save initial state for undo
        this.saveState(documentId);
        
        // Test that canvas is working by drawing a small test dot
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(10, 10, 5, 5);
        console.log('Test red square drawn at 10,10');
    }

    startDrawing(e, documentId) {
        const paintDoc = this.documents.get(documentId);
        const canvas = e.target;
        const rect = canvas.getBoundingClientRect();
        
        paintDoc.isDrawing = true;
        paintDoc.startX = e.clientX - rect.left;
        paintDoc.startY = e.clientY - rect.top;
        
        const tool = paintDoc.settings.tool;
        
        // Debug log
        console.log('Starting to draw with color:', paintDoc.settings.color, 'tool:', tool);
        
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
        
        // Debug log for drawing
        console.log('Drawing with color:', paintDoc.settings.color, 'at', currentX, currentY);
        
        if (tool === 'brush' || tool === 'pencil') {
            this.drawLine(paintDoc.startX, paintDoc.startY, currentX, currentY, documentId);
            paintDoc.startX = currentX;
            paintDoc.startY = currentY;
        } else if (tool === 'eraser') {
            this.eraseLine(paintDoc.startX, paintDoc.startY, currentX, currentY, documentId);
            paintDoc.startX = currentX;
            paintDoc.startY = currentY;
        } else if (tool === 'line' || tool === 'rectangle' || tool === 'circle') {
            this.drawPreview(paintDoc.startX, paintDoc.startY, currentX, currentY, documentId);
        }
    }

    stopDrawing(documentId) {
        const paintDoc = this.documents.get(documentId);
        if (!paintDoc.isDrawing) return;
        
        paintDoc.isDrawing = false;
        
        const tool = paintDoc.settings.tool;
        
        if (tool === 'line' || tool === 'rectangle' || tool === 'circle') {
            this.commitShape(documentId);
        }
        
        this.saveState(documentId);
    }

    drawDot(x, y, documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvas = container.querySelector('.paint-canvas');
        const ctx = canvas.getContext('2d');
        const paintDoc = this.documents.get(documentId);
        
        console.log('Drawing dot at', x, y, 'with color', paintDoc.settings.color);
        
        // Reset context and set properties
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = paintDoc.settings.color;
        
        ctx.beginPath();
        ctx.arc(x, y, paintDoc.settings.brushSize / 2, 0, 2 * Math.PI);
        ctx.fill();
        
        console.log('Dot drawn, fillStyle was:', ctx.fillStyle);
    }

    drawLine(x1, y1, x2, y2, documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvas = container.querySelector('.paint-canvas');
        const ctx = canvas.getContext('2d');
        const paintDoc = this.documents.get(documentId);
        
        console.log('Drawing line from', x1, y1, 'to', x2, y2, 'with color', paintDoc.settings.color);
        
        // Reset context and set properties
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = paintDoc.settings.color;
        ctx.lineWidth = paintDoc.settings.brushSize;
        ctx.lineCap = paintDoc.settings.tool === 'pencil' ? 'square' : 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        console.log('Line drawn, strokeStyle was:', ctx.strokeStyle);
    }

    erase(x, y, documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvas = container.querySelector('.paint-canvas');
        const ctx = canvas.getContext('2d');
        const paintDoc = this.documents.get(documentId);
        
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, paintDoc.settings.brushSize / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }

    eraseLine(x1, y1, x2, y2, documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvas = container.querySelector('.paint-canvas');
        const ctx = canvas.getContext('2d');
        const paintDoc = this.documents.get(documentId);
        
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = paintDoc.settings.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
    }

    drawPreview(startX, startY, currentX, currentY, documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const tempCanvas = container.querySelector('.temp-canvas');
        const ctx = tempCanvas.getContext('2d');
        const paintDoc = this.documents.get(documentId);
        
        // Clear previous preview
        ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Reset context and set properties
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = paintDoc.settings.color;
        ctx.lineWidth = paintDoc.settings.brushSize;
        ctx.lineCap = 'round';
        
        const tool = paintDoc.settings.tool;
        
        if (tool === 'line') {
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();
        } else if (tool === 'rectangle') {
            const width = currentX - startX;
            const height = currentY - startY;
            ctx.strokeRect(startX, startY, width, height);
        } else if (tool === 'circle') {
            const radius = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));
            ctx.beginPath();
            ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
            ctx.stroke();
        }
    }

    commitShape(documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvas = container.querySelector('.paint-canvas');
        const tempCanvas = container.querySelector('.temp-canvas');
        const ctx = canvas.getContext('2d');
        const tempCtx = tempCanvas.getContext('2d');
        
        // Copy temp canvas to main canvas
        ctx.drawImage(tempCanvas, 0, 0);
        
        // Clear temp canvas
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    }

    floodFill(x, y, documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvas = container.querySelector('.paint-canvas');
        const ctx = canvas.getContext('2d');
        const paintDoc = this.documents.get(documentId);
        
        // Round coordinates to integers
        x = Math.floor(x);
        y = Math.floor(y);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        const targetColor = this.getPixelColor(data, x, y, canvas.width);
        const fillColor = this.hexToRgb(paintDoc.settings.color);
        
        console.log('Flood fill - Target color:', targetColor, 'Fill color:', fillColor);
        
        // Don't fill if colors are the same
        if (this.colorsEqual(targetColor, fillColor)) {
            console.log('Colors are equal, not filling');
            return;
        }
        
        // Use stack-based flood fill to avoid recursion
        this.floodFillStack(data, x, y, canvas.width, canvas.height, targetColor, fillColor);
        
        // Apply the changes
        ctx.putImageData(imageData, 0, 0);
    }

    floodFillStack(data, startX, startY, width, height, targetColor, fillColor) {
        const stack = [[startX, startY]];
        const visited = new Set();
        
        while (stack.length > 0) {
            const [x, y] = stack.pop();
            
            // Check bounds
            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            
            // Create unique key for this pixel
            const key = y * width + x;
            if (visited.has(key)) continue;
            visited.add(key);
            
            // Check if this pixel matches target color
            const currentColor = this.getPixelColor(data, x, y, width);
            if (!this.colorsEqual(currentColor, targetColor)) continue;
            
            // Fill this pixel
            this.setPixelColor(data, x, y, width, fillColor);
            
            // Add adjacent pixels to stack
            stack.push([x + 1, y]);
            stack.push([x - 1, y]);
            stack.push([x, y + 1]);
            stack.push([x, y - 1]);
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
        return color1.r === color2.r && color1.g === color2.g && color1.b === color2.b && color1.a === color2.a;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
            a: 255
        } : null;
    }

    pickColor(x, y, documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvas = container.querySelector('.paint-canvas');
        const ctx = canvas.getContext('2d');
        
        const imageData = ctx.getImageData(x, y, 1, 1);
        const data = imageData.data;
        
        const color = `#${((1 << 24) + (data[0] << 16) + (data[1] << 8) + data[2]).toString(16).slice(1)}`;
        this.setPrimaryColor(color, documentId);
    }

    selectTool(tool, documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const paintDoc = this.documents.get(documentId);
        
        paintDoc.settings.tool = tool;
        
        // Update UI
        container.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
        
        // Update cursor
        const canvas = container.querySelector('.paint-canvas');
        canvas.style.cursor = this.tools[tool].cursor;
        
        // Update status
        container.querySelector('.current-tool').textContent = `Tool: ${this.tools[tool].name}`;
    }

    setPrimaryColor(color, documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const paintDoc = this.documents.get(documentId);
        
        // Debug log
        console.log('Setting primary color to:', color);
        
        paintDoc.settings.color = color;
        
        // Update UI
        const primaryColorEl = container.querySelector('.primary-color');
        const colorPickerEl = container.querySelector('.color-picker');
        
        if (primaryColorEl) {
            primaryColorEl.style.backgroundColor = color;
        }
        if (colorPickerEl) {
            colorPickerEl.value = color;
        }
        
        // Debug log current state
        console.log('Paint doc color is now:', paintDoc.settings.color);
    }

    setBackgroundColor(color, documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const paintDoc = this.documents.get(documentId);
        
        paintDoc.settings.backgroundColor = color;
        
        // Update UI
        const secondaryColorEl = container.querySelector('.secondary-color');
        const bgColorPickerEl = container.querySelector('.bg-color-picker');
        
        if (secondaryColorEl) {
            secondaryColorEl.style.backgroundColor = color;
        }
        if (bgColorPickerEl) {
            bgColorPickerEl.value = color;
        }
    }

    swapColors(documentId) {
        const paintDoc = this.documents.get(documentId);
        const tempColor = paintDoc.settings.color;
        
        this.setPrimaryColor(paintDoc.settings.backgroundColor, documentId);
        this.setBackgroundColor(tempColor, documentId);
    }

    saveState(documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvas = container.querySelector('.paint-canvas');
        const paintDoc = this.documents.get(documentId);
        
        // Save canvas state for undo
        paintDoc.undoStack.push(canvas.toDataURL());
        
        // Limit undo stack size
        if (paintDoc.undoStack.length > 50) {
            paintDoc.undoStack.shift();
        }
        
        // Clear redo stack
        paintDoc.redoStack = [];
    }

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

    undo(documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvas = container.querySelector('.paint-canvas');
        const ctx = canvas.getContext('2d');
        const paintDoc = this.documents.get(documentId);
        
        if (paintDoc.undoStack.length > 1) {
            // Move current state to redo stack
            paintDoc.redoStack.push(paintDoc.undoStack.pop());
            
            // Restore previous state
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

    showNewCanvasDialog(documentId) {
        const dialog = document.createElement('div');
        dialog.className = 'canvas-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <div class="dialog-title">📄 New Canvas</div>
                    <div class="dialog-close" onclick="this.closest('.canvas-dialog').remove()">×</div>
                </div>
                <div class="dialog-body">
                    <div class="new-canvas-form">
                        <div class="form-group">
                            <label>Width:</label>
                            <input type="number" class="width-input" value="800" min="100" max="2000">
                        </div>
                        <div class="form-group">
                            <label>Height:</label>
                            <input type="number" class="height-input" value="600" min="100" max="2000">
                        </div>
                        <div class="form-group">
                            <label>Background:</label>
                            <input type="color" class="bg-input" value="#ffffff">
                        </div>
                    </div>
                    <div class="dialog-buttons">
                        <button class="create-btn" onclick="elxaOS.programs.paint.createNewCanvas()">Create</button>
                        <button class="dialog-button" onclick="this.closest('.canvas-dialog').remove()">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
    }

    createNewCanvas() {
        const dialog = document.querySelector('.canvas-dialog');
        const width = parseInt(dialog.querySelector('.width-input').value);
        const height = parseInt(dialog.querySelector('.height-input').value);
        const bgColor = dialog.querySelector('.bg-input').value;
        
        this.createNewDocument(width, height);
        
        // Set background color
        const newDoc = this.documents.get(this.activeDocumentId);
        newDoc.settings.backgroundColor = bgColor;
        this.initializeCanvas(this.activeDocumentId);
        
        dialog.remove();
    }

    saveDocument(documentId) {
        const paintDoc = this.documents.get(documentId);
        
        if (paintDoc.filename) {
            this.saveToFile(paintDoc.filename, documentId);
        } else {
            this.showSaveAsDialog(documentId);
        }
    }

    showSaveAsDialog(documentId) {
        const paintDoc = this.documents.get(documentId);
        
        const dialog = document.createElement('div');
        dialog.className = 'file-dialog save-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <div class="dialog-title">💾 Save Image</div>
                    <div class="dialog-close" onclick="this.closest('.file-dialog').remove()">×</div>
                </div>
                <div class="dialog-body">
                    <div class="save-form">
                        <label>Filename:</label>
                        <input type="text" class="filename-input" value="${paintDoc.filename || 'untitled.png'}" placeholder="Enter filename">
                        <div class="save-location">Save to: Pictures folder</div>
                        <div class="format-info">
                            💡 Supported formats: .png, .jpg, .jpeg
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
    }

    saveWithFilename(documentId) {
        const dialog = document.querySelector('.save-dialog');
        const filename = dialog.querySelector('.filename-input').value.trim();
        
        if (!filename) {
            this.showMessage('Please enter a filename', 'warning');
            return;
        }
        
        let finalFilename = filename;
        if (!finalFilename.match(/\.(png|jpg|jpeg)$/i)) {
            finalFilename += '.png';
        }
        
        // CHECK IF FILE EXISTS - ask before overwriting
        const existingFile = this.fileSystem.getFile(['root', 'Pictures'], finalFilename);
        
        if (existingFile) {
            if (!confirm(`Image "${finalFilename}" already exists. Do you want to overwrite it?`)) {
                return; // Don't save if they don't want to overwrite
            }
        }
        
        this.saveToFile(finalFilename, documentId);
        dialog.remove();
    }

    saveToFile(filename, documentId) {
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvas = container.querySelector('.paint-canvas');
        const paintDoc = this.documents.get(documentId);
        
        // Convert canvas to data URL
        const dataURL = canvas.toDataURL('image/png');
        
        // Get the document's current path or default to Pictures
        const savePath = ['root', 'Pictures'];
        
        // CHECK IF FILE EXISTS - if so, update it; if not, create it
        const existingFile = this.fileSystem.getFile(savePath, filename);
        
        if (existingFile) {
            // File exists - update it
            console.log('🎨 Updating existing image:', filename);
            this.fileSystem.updateFileContent(savePath, filename, dataURL);
        } else {
            // File doesn't exist - create it
            console.log('🖼️ Creating new image:', filename);
            this.fileSystem.createFile(savePath, filename, dataURL, 'image');
        }
        
        paintDoc.filename = filename;
        paintDoc.saved = true;
        this.updateWindowTitle(documentId);
        this.updateStatus(documentId);
        
        this.showMessage(`Saved ${filename}`, 'success');
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
        
        // Tool shortcuts
        const toolKeys = {
            'b': 'brush',
            'p': 'pencil',
            'e': 'eraser',
            'f': 'bucket',
            'i': 'eyedropper',
            'l': 'line',
            'r': 'rectangle',
            'c': 'circle'
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
        const titleElement = windowElement.querySelector('.window-title');
        
        const title = paintDoc.filename || `Untitled Image ${documentId.split('-').pop()}`;
        const unsavedMarker = paintDoc.saved ? '' : '*';
        
        titleElement.textContent = `🎨 ${title}${unsavedMarker}`;
    }

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
                    <div class="dialog-title">📂 Open Image</div>
                    <div class="dialog-close" onclick="this.closest('.file-dialog').remove()">×</div>
                </div>
                <div class="dialog-body">
                    <div class="file-list">
                        ${imageFiles.map(file => {
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

    openFile(filename, folderPath = null) {
        // If folderPath is not provided, use Pictures folder
        const path = folderPath || ['root', 'Pictures'];
        
        // Get the file from the file system
        const file = this.fileSystem.getFile(path, filename);
        
        if (file && file.content) {
            // Create new document
            const newDocId = this.createNewDocument(800, 600, filename);
            const container = document.querySelector(`[data-document-id="${newDocId}"]`);
            const canvas = container.querySelector('.paint-canvas');
            const tempCanvas = container.querySelector('.temp-canvas');
            const ctx = canvas.getContext('2d');
            
            const img = new Image();
            img.onload = () => {
                // Resize canvas to match image
                canvas.width = img.width;
                canvas.height = img.height;
                tempCanvas.width = img.width;
                tempCanvas.height = img.height;
                
                const paintDoc = this.documents.get(newDocId);
                paintDoc.canvasWidth = img.width;
                paintDoc.canvasHeight = img.height;
                
                // Update UI
                const canvasContainer = container.querySelector('.canvas-container');
                canvasContainer.style.width = img.width + 'px';
                canvasContainer.style.height = img.height + 'px';
                container.querySelector('.canvas-size').textContent = `Canvas: ${img.width}×${img.height}`;
                
                // Draw image
                ctx.drawImage(img, 0, 0);
                this.saveState(newDocId);
                
                // Mark as saved
                paintDoc.saved = true;
                paintDoc.filename = filename;
                this.updateStatus(newDocId);
                this.updateWindowTitle(newDocId);
            };
            
            img.onerror = () => {
                this.showMessage('Failed to load image', 'error');
                console.error('Failed to load image:', filename);
            };
            
            // Load the image from the data URL
            img.src = file.content;
            
            this.showMessage(`Opened ${filename}`, 'success');
        } else {
            this.showMessage('Image not found or invalid format', 'error');
        }
    }

    showResizeDialog(documentId) {
        const paintDoc = this.documents.get(documentId);
        
        const dialog = document.createElement('div');
        dialog.className = 'canvas-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <div class="dialog-title">📐 Resize Canvas</div>
                    <div class="dialog-close" onclick="this.closest('.canvas-dialog').remove()">×</div>
                </div>
                <div class="dialog-body">
                    <div class="resize-form">
                        <div class="form-group">
                            <label>Width:</label>
                            <input type="number" class="width-input" value="${paintDoc.canvasWidth}" min="100" max="2000">
                        </div>
                        <div class="form-group">
                            <label>Height:</label>
                            <input type="number" class="height-input" value="${paintDoc.canvasHeight}" min="100" max="2000">
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" class="maintain-ratio" checked>
                                Maintain aspect ratio
                            </label>
                        </div>
                    </div>
                    <div class="dialog-buttons">
                        <button class="apply-btn" onclick="elxaOS.programs.paint.resizeCanvas('${documentId}')">Apply</button>
                        <button class="dialog-button" onclick="this.closest('.canvas-dialog').remove()">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Aspect ratio maintenance
        const widthInput = dialog.querySelector('.width-input');
        const heightInput = dialog.querySelector('.height-input');
        const maintainRatio = dialog.querySelector('.maintain-ratio');
        
        const originalRatio = paintDoc.canvasWidth / paintDoc.canvasHeight;
        
        widthInput.addEventListener('input', () => {
            if (maintainRatio.checked) {
                heightInput.value = Math.round(widthInput.value / originalRatio);
            }
        });
        
        heightInput.addEventListener('input', () => {
            if (maintainRatio.checked) {
                widthInput.value = Math.round(heightInput.value * originalRatio);
            }
        });
    }

    resizeCanvas(documentId) {
        const dialog = document.querySelector('.canvas-dialog');
        const newWidth = parseInt(dialog.querySelector('.width-input').value);
        const newHeight = parseInt(dialog.querySelector('.height-input').value);
        
        const container = document.querySelector(`[data-document-id="${documentId}"]`);
        const canvas = container.querySelector('.paint-canvas');
        const tempCanvas = container.querySelector('.temp-canvas');
        const paintDoc = this.documents.get(documentId);
        
        // Save current canvas content
        const imageData = canvas.toDataURL();
        
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
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = paintDoc.settings.backgroundColor;
        ctx.fillRect(0, 0, newWidth, newHeight);
        
        // Restore image if it existed
        if (imageData !== 'data:,') {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                this.saveState(documentId);
            };
            img.src = imageData;
        }
        
        // Update document properties
        paintDoc.canvasWidth = newWidth;
        paintDoc.canvasHeight = newHeight;
        
        // Update status
        container.querySelector('.canvas-size').textContent = `Canvas: ${newWidth}×${newHeight}`;
        this.markUnsaved(documentId);
        
        dialog.remove();
        this.showMessage(`Canvas resized to ${newWidth}×${newHeight}`, 'success');
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