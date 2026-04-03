// =================================
// ELXASHEETS PROGRAM
// =================================
class ElxaSheetsProgram {
    constructor(windowManager, fileSystem, eventBus) {
        this.windowManager = windowManager;
        this.fileSystem = fileSystem;
        this.eventBus = eventBus;
        
        // Spreadsheet state
        this.sheets = [{ name: 'Sheet1', data: {}, colWidths: {}, styles: {} }];
        this.activeSheet = 0;
        this.selectedCell = null;
        this.selectedRange = null;
        this.isEditing = false;
        this.editingCell = null;
        this.clipboard = null;
        this.undoStack = [];
        this.redoStack = [];
        this.maxCols = 26; // A-Z
        this.maxRows = 100;
        this.currentFile = null;
        this.isDirty = false;
        
        // Column resize state
        this.isResizing = false;
        this.resizeCol = null;
        this.resizeStartX = 0;
        this.resizeStartWidth = 0;
    }

    launch(args) {
        const windowId = `elxasheets-${Date.now()}`;
        const windowContent = this.createInterface(windowId);
        
        this.windowManager.createWindow(
            windowId,
            `${ElxaIcons.render('elxasheets', 'ui')} ElxaSheets`,
            windowContent,
            { width: '900px', height: '600px', x: '80px', y: '40px' }
        );
        
        this.setupEventHandlers(windowId);
        this.selectCell(windowId, 0, 0);
        
        // If launched with a file argument, try to open it
        if (args && typeof args === 'string') {
            this.openFileByPath(windowId, args);
        }
        
        return windowId;
    }

    // =================================
    // UI CREATION
    // =================================

    createInterface(windowId) {
        return `
            <div class="sheets-container" data-window-id="${windowId}">
                <!-- Toolbar -->
                <div class="sheets-toolbar">
                    <div class="sheets-toolbar-group">
                        <button class="sheets-tool-btn" data-action="new" title="New">${ElxaIcons.renderAction('new-file')}</button>
                        <button class="sheets-tool-btn" data-action="open" title="Open">${ElxaIcons.renderAction('open-file')}</button>
                        <button class="sheets-tool-btn" data-action="save" title="Save">${ElxaIcons.renderAction('save')}</button>
                    </div>
                    <div class="sheets-toolbar-sep"></div>
                    <div class="sheets-toolbar-group">
                        <button class="sheets-tool-btn" data-action="undo" title="Undo"><span class="mdi mdi-undo elxa-icon-ui"></span></button>
                        <button class="sheets-tool-btn" data-action="redo" title="Redo"><span class="mdi mdi-redo elxa-icon-ui"></span></button>
                    </div>
                    <div class="sheets-toolbar-sep"></div>
                    <div class="sheets-toolbar-group">
                        <button class="sheets-tool-btn" data-action="bold" title="Bold"><span class="mdi mdi-format-bold elxa-icon-ui"></span></button>
                        <button class="sheets-tool-btn" data-action="italic" title="Italic"><span class="mdi mdi-format-italic elxa-icon-ui"></span></button>
                    </div>
                    <div class="sheets-toolbar-sep"></div>
                    <div class="sheets-toolbar-group">
                        <button class="sheets-tool-btn" data-action="align-left" title="Align Left"><span class="mdi mdi-format-align-left elxa-icon-ui"></span></button>
                        <button class="sheets-tool-btn" data-action="align-center" title="Align Center"><span class="mdi mdi-format-align-center elxa-icon-ui"></span></button>
                        <button class="sheets-tool-btn" data-action="align-right" title="Align Right"><span class="mdi mdi-format-align-right elxa-icon-ui"></span></button>
                    </div>
                    <div class="sheets-toolbar-sep"></div>
                    <div class="sheets-toolbar-group">
                        <button class="sheets-tool-btn" data-action="sum" title="AutoSum">Σ</button>
                    </div>
                </div>

                <!-- Formula Bar -->
                <div class="sheets-formula-bar">
                    <div class="sheets-cell-ref" id="sheets-cell-ref-${windowId}">A1</div>
                    <div class="sheets-fx-label">fx</div>
                    <input type="text" class="sheets-formula-input" id="sheets-formula-${windowId}" placeholder="Enter value or formula...">
                </div>

                <!-- Grid Area -->
                <div class="sheets-grid-wrapper" id="sheets-grid-wrapper-${windowId}">
                    <div class="sheets-grid" id="sheets-grid-${windowId}">
                        ${this.renderGrid(windowId)}
                    </div>
                </div>

                <!-- Sheet Tabs -->
                <div class="sheets-tab-bar">
                    <button class="sheets-add-tab" data-action="add-sheet" title="Add Sheet">+</button>
                    <div class="sheets-tabs" id="sheets-tabs-${windowId}">
                        ${this.renderTabs(windowId)}
                    </div>
                </div>

                <!-- Status Bar -->
                <div class="sheets-status-bar">
                    <span class="sheets-status-left" id="sheets-status-${windowId}">Ready</span>
                    <span class="sheets-status-right" id="sheets-status-right-${windowId}"></span>
                </div>
            </div>
        `;
    }

    renderGrid(windowId) {
        const sheet = this.sheets[this.activeSheet];
        let html = '<table class="sheets-table"><thead><tr><th class="sheets-row-header sheets-corner"></th>';
        
        // Column headers A-Z
        for (let c = 0; c < this.maxCols; c++) {
            const colLetter = String.fromCharCode(65 + c);
            const width = sheet.colWidths[c] || 80;
            html += `<th class="sheets-col-header" data-col="${c}" style="width:${width}px;min-width:${width}px;max-width:${width}px">
                ${colLetter}
                <div class="sheets-col-resize" data-col="${c}"></div>
            </th>`;
        }
        html += '</tr></thead><tbody>';
        
        // Data rows
        for (let r = 0; r < this.maxRows; r++) {
            html += `<tr><td class="sheets-row-header" data-row="${r}">${r + 1}</td>`;
            for (let c = 0; c < this.maxCols; c++) {
                const key = this.cellKey(r, c);
                const rawValue = sheet.data[key] || '';
                const displayValue = this.getDisplayValue(rawValue, r, c);
                const style = sheet.styles[key] || {};
                const styleStr = this.cellStyleString(style);
                const width = sheet.colWidths[c] || 80;
                html += `<td class="sheets-cell" data-row="${r}" data-col="${c}" style="${styleStr}width:${width}px;min-width:${width}px;max-width:${width}px">${this.escapeHtml(displayValue)}</td>`;
            }
            html += '</tr>';
        }
        
        html += '</tbody></table>';
        return html;
    }

    renderTabs(windowId) {
        return this.sheets.map((sheet, i) => {
            const activeClass = i === this.activeSheet ? 'active' : '';
            return `<div class="sheets-tab ${activeClass}" data-sheet="${i}">
                <span class="sheets-tab-name">${sheet.name}</span>
                ${this.sheets.length > 1 ? '<span class="sheets-tab-close" data-action="remove-sheet" data-sheet="' + i + '">×</span>' : ''}
            </div>`;
        }).join('');
    }

    // =================================
    // EVENT HANDLERS
    // =================================

    setupEventHandlers(windowId) {
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        const container = windowElement.querySelector('.sheets-container');
        if (!container) return;

        // Toolbar buttons
        container.querySelectorAll('.sheets-tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const action = btn.dataset.action;
                this.handleToolbarAction(windowId, action);
            });
        });

        // Formula bar input
        const formulaInput = container.querySelector(`#sheets-formula-${windowId}`);
        if (formulaInput) {
            formulaInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.commitFormulaBar(windowId);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.cancelEdit(windowId);
                }
            });
            formulaInput.addEventListener('focus', () => {
                if (this.selectedCell) {
                    this.isEditing = true;
                    this.editingCell = { ...this.selectedCell };
                }
            });
        }

        // Grid clicks — event delegation
        const grid = container.querySelector(`#sheets-grid-${windowId}`);
        if (grid) {
            grid.addEventListener('mousedown', (e) => {
                const cell = e.target.closest('.sheets-cell');
                if (cell) {
                    const row = parseInt(cell.dataset.row);
                    const col = parseInt(cell.dataset.col);
                    
                    if (e.shiftKey && this.selectedCell) {
                        // Shift-click for range select
                        this.selectRange(windowId, this.selectedCell.row, this.selectedCell.col, row, col);
                    } else {
                        if (this.isEditing) {
                            this.commitEdit(windowId);
                        }
                        this.selectCell(windowId, row, col);
                    }
                }
                
                // Column header click for column select
                const colHeader = e.target.closest('.sheets-col-header');
                if (colHeader && !e.target.classList.contains('sheets-col-resize')) {
                    const col = parseInt(colHeader.dataset.col);
                    this.selectColumn(windowId, col);
                }
                
                // Row header click for row select
                const rowHeader = e.target.closest('.sheets-row-header');
                if (rowHeader && rowHeader.dataset.row !== undefined) {
                    const row = parseInt(rowHeader.dataset.row);
                    this.selectRow(windowId, row);
                }
                
                // Column resize handle
                const resizeHandle = e.target.closest('.sheets-col-resize');
                if (resizeHandle) {
                    e.preventDefault();
                    this.startColResize(windowId, parseInt(resizeHandle.dataset.col), e.clientX);
                }
            });

            grid.addEventListener('dblclick', (e) => {
                const cell = e.target.closest('.sheets-cell');
                if (cell) {
                    const row = parseInt(cell.dataset.row);
                    const col = parseInt(cell.dataset.col);
                    this.startCellEdit(windowId, row, col);
                }
            });
        }

        // Tab bar
        const tabBar = container.querySelector('.sheets-tab-bar');
        if (tabBar) {
            tabBar.addEventListener('click', (e) => {
                const addBtn = e.target.closest('[data-action="add-sheet"]');
                if (addBtn) {
                    this.addSheet(windowId);
                    return;
                }
                const removeBtn = e.target.closest('[data-action="remove-sheet"]');
                if (removeBtn) {
                    this.removeSheet(windowId, parseInt(removeBtn.dataset.sheet));
                    return;
                }
                const tab = e.target.closest('.sheets-tab');
                if (tab) {
                    this.switchSheet(windowId, parseInt(tab.dataset.sheet));
                }
            });
            
            // Double-click tab to rename
            tabBar.addEventListener('dblclick', (e) => {
                const tab = e.target.closest('.sheets-tab-name');
                if (tab) {
                    const tabEl = tab.closest('.sheets-tab');
                    this.renameSheet(windowId, parseInt(tabEl.dataset.sheet));
                }
            });
        }

        // Keyboard handler on the window
        windowElement.addEventListener('keydown', (e) => {
            this.handleKeydown(windowId, e);
        });
        
        // Mouse move/up for column resize (on document level)
        this._resizeMove = (e) => this.handleColResize(windowId, e.clientX);
        this._resizeEnd = () => this.endColResize(windowId);
        
        windowElement.setAttribute('tabindex', '0');
    }

    // =================================
    // CELL SELECTION
    // =================================

    selectCell(windowId, row, col) {
        this.clearSelection(windowId);
        this.selectedCell = { row, col };
        this.selectedRange = null;
        
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        const cell = windowElement.querySelector(`.sheets-cell[data-row="${row}"][data-col="${col}"]`);
        if (cell) cell.classList.add('selected');
        
        // Highlight row/col headers
        const rowHeader = windowElement.querySelector(`.sheets-row-header[data-row="${row}"]`);
        if (rowHeader) rowHeader.classList.add('highlighted');
        const colHeader = windowElement.querySelector(`.sheets-col-header[data-col="${col}"]`);
        if (colHeader) colHeader.classList.add('highlighted');
        
        // Update cell ref display
        const cellRef = windowElement.querySelector(`#sheets-cell-ref-${windowId}`);
        if (cellRef) cellRef.textContent = this.colLetter(col) + (row + 1);
        
        // Update formula bar with raw value
        const formulaInput = windowElement.querySelector(`#sheets-formula-${windowId}`);
        if (formulaInput) {
            const key = this.cellKey(row, col);
            formulaInput.value = this.sheets[this.activeSheet].data[key] || '';
        }
        
        // Update status bar with selection info
        this.updateStatusBar(windowId);
    }

    selectRange(windowId, r1, c1, r2, c2) {
        this.clearSelection(windowId);
        this.selectedRange = {
            r1: Math.min(r1, r2), c1: Math.min(c1, c2),
            r2: Math.max(r1, r2), c2: Math.max(c1, c2)
        };
        
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        for (let r = this.selectedRange.r1; r <= this.selectedRange.r2; r++) {
            for (let c = this.selectedRange.c1; c <= this.selectedRange.c2; c++) {
                const cell = windowElement.querySelector(`.sheets-cell[data-row="${r}"][data-col="${c}"]`);
                if (cell) cell.classList.add('range-selected');
            }
        }
        
        // Update cell ref to show range
        const cellRef = windowElement.querySelector(`#sheets-cell-ref-${windowId}`);
        if (cellRef) {
            cellRef.textContent = `${this.colLetter(this.selectedRange.c1)}${this.selectedRange.r1 + 1}:${this.colLetter(this.selectedRange.c2)}${this.selectedRange.r2 + 1}`;
        }
        
        this.updateStatusBar(windowId);
    }

    selectColumn(windowId, col) {
        this.selectRange(windowId, 0, col, this.maxRows - 1, col);
    }

    selectRow(windowId, row) {
        this.selectRange(windowId, row, 0, row, this.maxCols - 1);
    }

    clearSelection(windowId) {
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        windowElement.querySelectorAll('.sheets-cell.selected, .sheets-cell.range-selected').forEach(el => {
            el.classList.remove('selected', 'range-selected');
        });
        windowElement.querySelectorAll('.sheets-row-header.highlighted, .sheets-col-header.highlighted').forEach(el => {
            el.classList.remove('highlighted');
        });
    }

    // =================================
    // CELL EDITING
    // =================================

    startCellEdit(windowId, row, col) {
        this.selectCell(windowId, row, col);
        this.isEditing = true;
        this.editingCell = { row, col };
        
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        const cell = windowElement.querySelector(`.sheets-cell[data-row="${row}"][data-col="${col}"]`);
        if (!cell) return;
        
        const key = this.cellKey(row, col);
        const rawValue = this.sheets[this.activeSheet].data[key] || '';
        
        cell.classList.add('editing');
        cell.contentEditable = true;
        cell.textContent = rawValue;
        cell.focus();
        
        // Select all text
        const range = document.createRange();
        range.selectNodeContents(cell);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    commitEdit(windowId) {
        if (!this.isEditing || !this.editingCell) return;
        
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        const { row, col } = this.editingCell;
        const cell = windowElement.querySelector(`.sheets-cell[data-row="${row}"][data-col="${col}"]`);
        
        let newValue = '';
        if (cell) {
            newValue = cell.textContent.trim();
            cell.contentEditable = false;
            cell.classList.remove('editing');
        }
        
        this.setCellValue(windowId, row, col, newValue);
        this.isEditing = false;
        this.editingCell = null;
    }

    commitFormulaBar(windowId) {
        if (!this.selectedCell) return;
        
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        const formulaInput = windowElement.querySelector(`#sheets-formula-${windowId}`);
        if (!formulaInput) return;
        
        const { row, col } = this.selectedCell;
        this.setCellValue(windowId, row, col, formulaInput.value);
        
        // Re-focus the grid area
        windowElement.focus();
    }

    cancelEdit(windowId) {
        if (!this.isEditing || !this.editingCell) {
            // If editing formula bar, just restore
            if (this.selectedCell) {
                const windowElement = document.getElementById(`window-${windowId}`);
                const formulaInput = windowElement?.querySelector(`#sheets-formula-${windowId}`);
                const key = this.cellKey(this.selectedCell.row, this.selectedCell.col);
                if (formulaInput) formulaInput.value = this.sheets[this.activeSheet].data[key] || '';
            }
            return;
        }
        
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        const { row, col } = this.editingCell;
        const cell = windowElement.querySelector(`.sheets-cell[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            const key = this.cellKey(row, col);
            const rawValue = this.sheets[this.activeSheet].data[key] || '';
            cell.textContent = this.getDisplayValue(rawValue, row, col);
            cell.contentEditable = false;
            cell.classList.remove('editing');
        }
        
        this.isEditing = false;
        this.editingCell = null;
    }

    setCellValue(windowId, row, col, value) {
        const sheet = this.sheets[this.activeSheet];
        const key = this.cellKey(row, col);
        const oldValue = sheet.data[key] || '';
        
        if (value === oldValue) return;
        
        // Push to undo stack
        this.undoStack.push({ sheet: this.activeSheet, key, oldValue, newValue: value });
        this.redoStack = [];
        
        if (value === '') {
            delete sheet.data[key];
        } else {
            sheet.data[key] = value;
        }
        
        this.isDirty = true;
        this.refreshCell(windowId, row, col);
        this.refreshDependents(windowId, row, col);
        this.updateStatusBar(windowId);
        
        // Update formula bar if this cell is selected
        if (this.selectedCell && this.selectedCell.row === row && this.selectedCell.col === col) {
            const windowElement = document.getElementById(`window-${windowId}`);
            const formulaInput = windowElement?.querySelector(`#sheets-formula-${windowId}`);
            if (formulaInput) formulaInput.value = value;
        }
    }

    refreshCell(windowId, row, col) {
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        const cell = windowElement.querySelector(`.sheets-cell[data-row="${row}"][data-col="${col}"]`);
        if (!cell) return;
        
        const key = this.cellKey(row, col);
        const rawValue = this.sheets[this.activeSheet].data[key] || '';
        const displayValue = this.getDisplayValue(rawValue, row, col);
        cell.textContent = displayValue;
        
        // Apply styles
        const style = this.sheets[this.activeSheet].styles[key] || {};
        cell.style.fontWeight = style.bold ? 'bold' : '';
        cell.style.fontStyle = style.italic ? 'italic' : '';
        cell.style.textAlign = style.align || '';
    }

    refreshDependents(windowId, row, col) {
        // Find all cells that reference this cell and refresh them
        const ref = this.colLetter(col) + (row + 1);
        const sheet = this.sheets[this.activeSheet];
        
        for (const [key, value] of Object.entries(sheet.data)) {
            if (typeof value === 'string' && value.startsWith('=') && value.toUpperCase().includes(ref)) {
                const [r, c] = this.keyToRowCol(key);
                this.refreshCell(windowId, r, c);
            }
        }
    }

    // =================================
    // FORMULA ENGINE
    // =================================

    getDisplayValue(rawValue, row, col) {
        if (!rawValue) return '';
        if (typeof rawValue !== 'string') return String(rawValue);
        if (!rawValue.startsWith('=')) return rawValue;
        
        try {
            const result = this.evaluateFormula(rawValue.substring(1), row, col);
            return result === undefined || result === null ? '' : String(result);
        } catch (e) {
            return '#ERROR';
        }
    }

    evaluateFormula(formula, sourceRow, sourceCol, visited = new Set()) {
        // Circular reference detection
        const cellId = `${this.activeSheet}:${sourceRow}:${sourceCol}`;
        if (visited.has(cellId)) return '#CIRC!';
        visited.add(cellId);
        
        const upper = formula.toUpperCase().trim();
        
        // Check for functions: SUM, AVERAGE, COUNT, MIN, MAX
        const funcMatch = upper.match(/^(SUM|AVERAGE|AVG|COUNT|MIN|MAX|COUNTA)\((.+)\)$/);
        if (funcMatch) {
            const funcName = funcMatch[1];
            const argStr = funcMatch[2];
            return this.evaluateFunction(funcName, argStr, sourceRow, sourceCol, visited);
        }
        
        // IF function
        const ifMatch = upper.match(/^IF\((.+)\)$/);
        if (ifMatch) {
            return this.evaluateIf(ifMatch[1], sourceRow, sourceCol, visited);
        }
        
        // Replace cell references with values for arithmetic
        let expression = formula;
        
        // Replace range references first (shouldn't appear in arithmetic, but just in case)
        // Replace individual cell references: A1, B2, etc.
        expression = expression.replace(/\b([A-Z])(\d{1,3})\b/gi, (match, colStr, rowStr) => {
            const refCol = colStr.toUpperCase().charCodeAt(0) - 65;
            const refRow = parseInt(rowStr) - 1;
            if (refCol < 0 || refCol >= this.maxCols || refRow < 0 || refRow >= this.maxRows) return 0;
            
            const key = this.cellKey(refRow, refCol);
            const val = this.sheets[this.activeSheet].data[key] || '';
            if (val === '') return 0;
            if (typeof val === 'string' && val.startsWith('=')) {
                const resolved = this.evaluateFormula(val.substring(1), refRow, refCol, new Set(visited));
                return isNaN(resolved) ? 0 : resolved;
            }
            const num = parseFloat(val);
            return isNaN(num) ? 0 : num;
        });
        
        // Evaluate the arithmetic expression safely
        try {
            // Only allow numbers, operators, parens, spaces, and decimal points
            if (/^[\d\s+\-*/().]+$/.test(expression)) {
                const result = Function('"use strict"; return (' + expression + ')')();
                if (!isFinite(result)) return '#DIV/0!';
                // Round to avoid floating point weirdness
                return Math.round(result * 1e10) / 1e10;
            }
            // If it's just a plain number after resolving refs
            const num = parseFloat(expression);
            if (!isNaN(num)) return num;
            return expression; // Return as text
        } catch (e) {
            return '#ERROR';
        }
    }

    evaluateFunction(funcName, argStr, sourceRow, sourceCol, visited) {
        const values = this.resolveArguments(argStr, sourceRow, sourceCol, visited);
        const numbers = values.filter(v => typeof v === 'number' && !isNaN(v));
        
        switch (funcName) {
            case 'SUM':
                return numbers.reduce((a, b) => a + b, 0);
            case 'AVERAGE':
            case 'AVG':
                return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
            case 'COUNT':
                return numbers.length;
            case 'COUNTA':
                return values.filter(v => v !== '' && v !== null && v !== undefined).length;
            case 'MIN':
                return numbers.length > 0 ? Math.min(...numbers) : 0;
            case 'MAX':
                return numbers.length > 0 ? Math.max(...numbers) : 0;
            default:
                return '#NAME?';
        }
    }

    evaluateIf(argStr, sourceRow, sourceCol, visited) {
        // Simple IF(condition, trueVal, falseVal)
        // Split by commas, respecting nesting
        const args = this.splitArgs(argStr);
        if (args.length < 2) return '#ERROR';
        
        const condition = args[0].trim();
        const trueVal = args[1] ? args[1].trim() : '';
        const falseVal = args[2] ? args[2].trim() : '';
        
        // Evaluate condition — look for comparison operators
        let result = false;
        const compMatch = condition.match(/(.+?)(>=|<=|<>|!=|=|>|<)(.+)/);
        if (compMatch) {
            let left = this.evaluateFormula(compMatch[1].trim(), sourceRow, sourceCol, new Set(visited));
            let right = this.evaluateFormula(compMatch[3].trim(), sourceRow, sourceCol, new Set(visited));
            left = parseFloat(left) || 0;
            right = parseFloat(right) || 0;
            
            switch (compMatch[2]) {
                case '>': result = left > right; break;
                case '<': result = left < right; break;
                case '>=': result = left >= right; break;
                case '<=': result = left <= right; break;
                case '=': result = left === right; break;
                case '<>': case '!=': result = left !== right; break;
            }
        }
        
        const retExpr = result ? trueVal : falseVal;
        if (retExpr.startsWith('"') && retExpr.endsWith('"')) {
            return retExpr.slice(1, -1); // String literal
        }
        return this.evaluateFormula(retExpr, sourceRow, sourceCol, new Set(visited));
    }

    splitArgs(str) {
        const args = [];
        let depth = 0;
        let current = '';
        for (const ch of str) {
            if (ch === '(') depth++;
            else if (ch === ')') depth--;
            else if (ch === ',' && depth === 0) {
                args.push(current);
                current = '';
                continue;
            }
            current += ch;
        }
        args.push(current);
        return args;
    }

    resolveArguments(argStr, sourceRow, sourceCol, visited) {
        const parts = argStr.split(',');
        let values = [];
        
        for (let part of parts) {
            part = part.trim();
            // Check if it's a range like A1:B5
            const rangeMatch = part.match(/^([A-Z])(\d{1,3}):([A-Z])(\d{1,3})$/i);
            if (rangeMatch) {
                const c1 = rangeMatch[1].toUpperCase().charCodeAt(0) - 65;
                const r1 = parseInt(rangeMatch[2]) - 1;
                const c2 = rangeMatch[3].toUpperCase().charCodeAt(0) - 65;
                const r2 = parseInt(rangeMatch[4]) - 1;
                
                for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) {
                    for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) {
                        const key = this.cellKey(r, c);
                        const val = this.sheets[this.activeSheet].data[key] || '';
                        if (val === '') {
                            values.push('');
                        } else if (typeof val === 'string' && val.startsWith('=')) {
                            const resolved = this.evaluateFormula(val.substring(1), r, c, new Set(visited));
                            values.push(typeof resolved === 'number' ? resolved : parseFloat(resolved) || resolved);
                        } else {
                            const num = parseFloat(val);
                            values.push(isNaN(num) ? val : num);
                        }
                    }
                }
            } else {
                // Single cell reference or literal
                const cellMatch = part.match(/^([A-Z])(\d{1,3})$/i);
                if (cellMatch) {
                    const refCol = cellMatch[1].toUpperCase().charCodeAt(0) - 65;
                    const refRow = parseInt(cellMatch[2]) - 1;
                    const key = this.cellKey(refRow, refCol);
                    const val = this.sheets[this.activeSheet].data[key] || '';
                    if (val === '') {
                        values.push('');
                    } else if (typeof val === 'string' && val.startsWith('=')) {
                        const resolved = this.evaluateFormula(val.substring(1), refRow, refCol, new Set(visited));
                        values.push(typeof resolved === 'number' ? resolved : parseFloat(resolved) || resolved);
                    } else {
                        const num = parseFloat(val);
                        values.push(isNaN(num) ? val : num);
                    }
                } else {
                    // Literal number
                    const num = parseFloat(part);
                    values.push(isNaN(num) ? part : num);
                }
            }
        }
        
        return values;
    }

    // =================================
    // KEYBOARD HANDLER
    // =================================

    handleKeydown(windowId, e) {
        // If formula bar is focused, let it handle its own keys
        const windowElement = document.getElementById(`window-${windowId}`);
        const formulaInput = windowElement?.querySelector(`#sheets-formula-${windowId}`);
        if (document.activeElement === formulaInput) return;
        
        // If a cell is being edited inline
        if (this.isEditing && this.editingCell) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.commitEdit(windowId);
                this.moveSelection(windowId, 1, 0); // Move down
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this.commitEdit(windowId);
                this.moveSelection(windowId, 0, e.shiftKey ? -1 : 1);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.cancelEdit(windowId);
            }
            return;
        }
        
        if (!this.selectedCell) return;
        
        // Navigation
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.moveSelection(windowId, -1, 0);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.moveSelection(windowId, 1, 0);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.moveSelection(windowId, 0, -1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.moveSelection(windowId, 0, 1);
                break;
            case 'Tab':
                e.preventDefault();
                this.moveSelection(windowId, 0, e.shiftKey ? -1 : 1);
                break;
            case 'Enter':
                e.preventDefault();
                this.moveSelection(windowId, 1, 0);
                break;
            case 'F2':
                e.preventDefault();
                this.startCellEdit(windowId, this.selectedCell.row, this.selectedCell.col);
                break;
            case 'Delete':
            case 'Backspace':
                e.preventDefault();
                this.deleteSelection(windowId);
                break;
            default:
                // Start typing to edit
                if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    this.startCellEdit(windowId, this.selectedCell.row, this.selectedCell.col);
                    // Set the cell content to the typed character
                    const cell = windowElement?.querySelector(`.sheets-cell[data-row="${this.selectedCell.row}"][data-col="${this.selectedCell.col}"]`);
                    if (cell) {
                        cell.textContent = e.key;
                        // Place cursor at end
                        const range = document.createRange();
                        range.selectNodeContents(cell);
                        range.collapse(false);
                        const sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                }
                break;
        }
        
        // Ctrl shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'c':
                    e.preventDefault();
                    this.copySelection(windowId);
                    break;
                case 'v':
                    e.preventDefault();
                    this.pasteSelection(windowId);
                    break;
                case 'x':
                    e.preventDefault();
                    this.cutSelection(windowId);
                    break;
                case 'z':
                    e.preventDefault();
                    this.undo(windowId);
                    break;
                case 'y':
                    e.preventDefault();
                    this.redo(windowId);
                    break;
                case 's':
                    e.preventDefault();
                    this.saveFile(windowId);
                    break;
                case 'b':
                    e.preventDefault();
                    this.toggleStyle(windowId, 'bold');
                    break;
                case 'i':
                    e.preventDefault();
                    this.toggleStyle(windowId, 'italic');
                    break;
            }
        }
    }

    moveSelection(windowId, dRow, dCol) {
        if (!this.selectedCell) return;
        const newRow = Math.max(0, Math.min(this.maxRows - 1, this.selectedCell.row + dRow));
        const newCol = Math.max(0, Math.min(this.maxCols - 1, this.selectedCell.col + dCol));
        this.selectCell(windowId, newRow, newCol);
        this.scrollCellIntoView(windowId, newRow, newCol);
    }

    scrollCellIntoView(windowId, row, col) {
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        const cell = windowElement.querySelector(`.sheets-cell[data-row="${row}"][data-col="${col}"]`);
        const wrapper = windowElement.querySelector(`#sheets-grid-wrapper-${windowId}`);
        if (cell && wrapper) {
            cell.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
    }

    // =================================
    // TOOLBAR ACTIONS
    // =================================

    handleToolbarAction(windowId, action) {
        switch (action) {
            case 'new': this.newFile(windowId); break;
            case 'open': this.openFile(windowId); break;
            case 'save': this.saveFile(windowId); break;
            case 'undo': this.undo(windowId); break;
            case 'redo': this.redo(windowId); break;
            case 'bold': this.toggleStyle(windowId, 'bold'); break;
            case 'italic': this.toggleStyle(windowId, 'italic'); break;
            case 'align-left': this.setAlign(windowId, 'left'); break;
            case 'align-center': this.setAlign(windowId, 'center'); break;
            case 'align-right': this.setAlign(windowId, 'right'); break;
            case 'sum': this.insertAutoSum(windowId); break;
        }
    }

    toggleStyle(windowId, prop) {
        if (!this.selectedCell) return;
        const sheet = this.sheets[this.activeSheet];
        
        const applyToCell = (row, col) => {
            const key = this.cellKey(row, col);
            if (!sheet.styles[key]) sheet.styles[key] = {};
            sheet.styles[key][prop] = !sheet.styles[key][prop];
            this.refreshCell(windowId, row, col);
        };
        
        if (this.selectedRange) {
            for (let r = this.selectedRange.r1; r <= this.selectedRange.r2; r++) {
                for (let c = this.selectedRange.c1; c <= this.selectedRange.c2; c++) {
                    applyToCell(r, c);
                }
            }
        } else {
            applyToCell(this.selectedCell.row, this.selectedCell.col);
        }
        this.isDirty = true;
    }

    setAlign(windowId, align) {
        if (!this.selectedCell) return;
        const sheet = this.sheets[this.activeSheet];
        
        const applyToCell = (row, col) => {
            const key = this.cellKey(row, col);
            if (!sheet.styles[key]) sheet.styles[key] = {};
            sheet.styles[key].align = align;
            this.refreshCell(windowId, row, col);
        };
        
        if (this.selectedRange) {
            for (let r = this.selectedRange.r1; r <= this.selectedRange.r2; r++) {
                for (let c = this.selectedRange.c1; c <= this.selectedRange.c2; c++) {
                    applyToCell(r, c);
                }
            }
        } else {
            applyToCell(this.selectedCell.row, this.selectedCell.col);
        }
        this.isDirty = true;
    }

    insertAutoSum(windowId) {
        if (!this.selectedCell) return;
        const { row, col } = this.selectedCell;
        
        // Look upward for contiguous numbers
        let startRow = row - 1;
        while (startRow >= 0) {
            const key = this.cellKey(startRow, col);
            const val = this.sheets[this.activeSheet].data[key] || '';
            if (val === '' && startRow < row - 1) break;
            if (val === '') { startRow--; continue; }
            const display = this.getDisplayValue(val, startRow, col);
            if (isNaN(parseFloat(display))) break;
            startRow--;
        }
        startRow++;
        
        if (startRow < row) {
            const formula = `=SUM(${this.colLetter(col)}${startRow + 1}:${this.colLetter(col)}${row})`;
            this.setCellValue(windowId, row, col, formula);
        }
    }

    // =================================
    // CLIPBOARD
    // =================================

    copySelection(windowId) {
        const sheet = this.sheets[this.activeSheet];
        
        if (this.selectedRange) {
            this.clipboard = { type: 'range', data: {}, styles: {}, range: { ...this.selectedRange } };
            for (let r = this.selectedRange.r1; r <= this.selectedRange.r2; r++) {
                for (let c = this.selectedRange.c1; c <= this.selectedRange.c2; c++) {
                    const key = this.cellKey(r, c);
                    const relKey = this.cellKey(r - this.selectedRange.r1, c - this.selectedRange.c1);
                    if (sheet.data[key]) this.clipboard.data[relKey] = sheet.data[key];
                    if (sheet.styles[key]) this.clipboard.styles[relKey] = { ...sheet.styles[key] };
                }
            }
        } else if (this.selectedCell) {
            const key = this.cellKey(this.selectedCell.row, this.selectedCell.col);
            this.clipboard = {
                type: 'cell',
                data: sheet.data[key] || '',
                styles: sheet.styles[key] ? { ...sheet.styles[key] } : {}
            };
        }
        
        this.setStatus(windowId, 'Copied');
    }

    cutSelection(windowId) {
        this.copySelection(windowId);
        this.deleteSelection(windowId);
        this.setStatus(windowId, 'Cut');
    }

    pasteSelection(windowId) {
        if (!this.clipboard || !this.selectedCell) return;
        const { row, col } = this.selectedCell;
        const sheet = this.sheets[this.activeSheet];
        
        if (this.clipboard.type === 'cell') {
            this.setCellValue(windowId, row, col, this.clipboard.data);
            const key = this.cellKey(row, col);
            if (Object.keys(this.clipboard.styles).length > 0) {
                sheet.styles[key] = { ...this.clipboard.styles };
            }
            this.refreshCell(windowId, row, col);
        } else if (this.clipboard.type === 'range') {
            const range = this.clipboard.range;
            const h = range.r2 - range.r1;
            const w = range.c2 - range.c1;
            for (let dr = 0; dr <= h; dr++) {
                for (let dc = 0; dc <= w; dc++) {
                    const targetRow = row + dr;
                    const targetCol = col + dc;
                    if (targetRow >= this.maxRows || targetCol >= this.maxCols) continue;
                    const relKey = this.cellKey(dr, dc);
                    const val = this.clipboard.data[relKey] || '';
                    this.setCellValue(windowId, targetRow, targetCol, val);
                    if (this.clipboard.styles[relKey]) {
                        const targetKey = this.cellKey(targetRow, targetCol);
                        sheet.styles[targetKey] = { ...this.clipboard.styles[relKey] };
                        this.refreshCell(windowId, targetRow, targetCol);
                    }
                }
            }
        }
        
        this.setStatus(windowId, 'Pasted');
    }

    deleteSelection(windowId) {
        if (this.selectedRange) {
            for (let r = this.selectedRange.r1; r <= this.selectedRange.r2; r++) {
                for (let c = this.selectedRange.c1; c <= this.selectedRange.c2; c++) {
                    this.setCellValue(windowId, r, c, '');
                }
            }
        } else if (this.selectedCell) {
            this.setCellValue(windowId, this.selectedCell.row, this.selectedCell.col, '');
        }
    }

    // =================================
    // UNDO / REDO
    // =================================

    undo(windowId) {
        if (this.undoStack.length === 0) return;
        const action = this.undoStack.pop();
        const sheet = this.sheets[action.sheet];
        
        this.redoStack.push(action);
        
        if (action.oldValue === '') {
            delete sheet.data[action.key];
        } else {
            sheet.data[action.key] = action.oldValue;
        }
        
        const [row, col] = this.keyToRowCol(action.key);
        this.refreshCell(windowId, row, col);
        this.setStatus(windowId, 'Undone');
    }

    redo(windowId) {
        if (this.redoStack.length === 0) return;
        const action = this.redoStack.pop();
        const sheet = this.sheets[action.sheet];
        
        this.undoStack.push(action);
        
        if (action.newValue === '') {
            delete sheet.data[action.key];
        } else {
            sheet.data[action.key] = action.newValue;
        }
        
        const [row, col] = this.keyToRowCol(action.key);
        this.refreshCell(windowId, row, col);
        this.setStatus(windowId, 'Redone');
    }

    // =================================
    // COLUMN RESIZE
    // =================================

    startColResize(windowId, col, startX) {
        this.isResizing = true;
        this.resizeCol = col;
        this.resizeStartX = startX;
        this.resizeStartWidth = this.sheets[this.activeSheet].colWidths[col] || 80;
        
        document.addEventListener('mousemove', this._resizeMove);
        document.addEventListener('mouseup', this._resizeEnd);
    }

    handleColResize(windowId, clientX) {
        if (!this.isResizing) return;
        const delta = clientX - this.resizeStartX;
        const newWidth = Math.max(30, this.resizeStartWidth + delta);
        
        this.sheets[this.activeSheet].colWidths[this.resizeCol] = newWidth;
        
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        // Update header width
        const header = windowElement.querySelector(`.sheets-col-header[data-col="${this.resizeCol}"]`);
        if (header) {
            header.style.width = newWidth + 'px';
            header.style.minWidth = newWidth + 'px';
            header.style.maxWidth = newWidth + 'px';
        }
        
        // Update all cells in this column
        windowElement.querySelectorAll(`.sheets-cell[data-col="${this.resizeCol}"]`).forEach(cell => {
            cell.style.width = newWidth + 'px';
            cell.style.minWidth = newWidth + 'px';
            cell.style.maxWidth = newWidth + 'px';
        });
    }

    endColResize(windowId) {
        this.isResizing = false;
        document.removeEventListener('mousemove', this._resizeMove);
        document.removeEventListener('mouseup', this._resizeEnd);
    }

    // =================================
    // SHEET TABS
    // =================================

    addSheet(windowId) {
        const name = 'Sheet' + (this.sheets.length + 1);
        this.sheets.push({ name, data: {}, colWidths: {}, styles: {} });
        this.switchSheet(windowId, this.sheets.length - 1);
    }

    removeSheet(windowId, index) {
        if (this.sheets.length <= 1) return;
        this.sheets.splice(index, 1);
        if (this.activeSheet >= this.sheets.length) {
            this.activeSheet = this.sheets.length - 1;
        }
        this.refreshAll(windowId);
    }

    switchSheet(windowId, index) {
        if (this.isEditing) this.commitEdit(windowId);
        this.activeSheet = index;
        this.selectedCell = null;
        this.selectedRange = null;
        this.refreshAll(windowId);
        this.selectCell(windowId, 0, 0);
    }

    renameSheet(windowId, index) {
        const newName = prompt('Rename sheet:', this.sheets[index].name);
        if (newName && newName.trim()) {
            this.sheets[index].name = newName.trim();
            this.refreshTabs(windowId);
        }
    }

    // =================================
    // FILE OPERATIONS
    // =================================

    newFile(windowId) {
        if (this.isDirty) {
            if (!confirm('Discard unsaved changes?')) return;
        }
        this.sheets = [{ name: 'Sheet1', data: {}, colWidths: {}, styles: {} }];
        this.activeSheet = 0;
        this.currentFile = null;
        this.isDirty = false;
        this.undoStack = [];
        this.redoStack = [];
        this.refreshAll(windowId);
        this.selectCell(windowId, 0, 0);
        this.updateTitle(windowId, 'ElxaSheets');
        this.setStatus(windowId, 'New spreadsheet');
    }

    saveFile(windowId) {
        // Build CSV from active sheet
        const sheet = this.sheets[this.activeSheet];
        let maxRow = 0, maxCol = 0;
        
        for (const key of Object.keys(sheet.data)) {
            const [r, c] = this.keyToRowCol(key);
            if (r > maxRow) maxRow = r;
            if (c > maxCol) maxCol = c;
        }
        
        let csv = '';
        for (let r = 0; r <= maxRow; r++) {
            const row = [];
            for (let c = 0; c <= maxCol; c++) {
                const key = this.cellKey(r, c);
                let val = sheet.data[key] || '';
                // Escape CSV
                if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                    val = '"' + val.replace(/"/g, '""') + '"';
                }
                row.push(val);
            }
            csv += row.join(',') + '\n';
        }
        
        const fileName = this.currentFile || prompt('Save as (filename.csv):', 'spreadsheet.csv');
        if (!fileName) return;
        
        // Save to ElxaOS filesystem — Documents folder
        try {
            const docsFolder = this.fileSystem.getFolder(['root', 'Documents']);
            if (docsFolder) {
                // Check if file already exists
                const existingFile = docsFolder.contents?.find(f => f.name === fileName);
                if (existingFile) {
                    this.fileSystem.updateFileContent(existingFile, csv);
                } else {
                    this.fileSystem.createFile(docsFolder, fileName, csv);
                }
                this.currentFile = fileName;
                this.isDirty = false;
                this.updateTitle(windowId, `ElxaSheets - ${fileName}`);
                this.setStatus(windowId, `Saved: ${fileName}`);
                ElxaUI.showToast(`Saved ${fileName}`, 'success');
            }
        } catch (e) {
            console.error('Save failed:', e);
            this.setStatus(windowId, 'Save failed!');
        }
    }

    openFile(windowId) {
        // Show a simple file picker dialog listing CSV files from Documents
        try {
            const docsFolder = this.fileSystem.getFolder(['root', 'Documents']);
            if (!docsFolder || !docsFolder.contents) {
                this.setStatus(windowId, 'No files found');
                return;
            }
            
            const csvFiles = docsFolder.contents.filter(f => 
                f.type === 'file' && (f.name.endsWith('.csv') || f.name.endsWith('.txt'))
            );
            
            if (csvFiles.length === 0) {
                ElxaUI.showToast('No CSV files found in Documents', 'info');
                return;
            }
            
            // Build file picker dialog
            const fileList = csvFiles.map(f => `<div class="sheets-file-item" data-filename="${f.name}">${ElxaIcons.getFileIcon(f.name, 'ui')} ${f.name}</div>`).join('');
            
            const dialog = document.createElement('div');
            dialog.className = 'sheets-dialog-overlay';
            dialog.innerHTML = `
                <div class="sheets-dialog">
                    <div class="sheets-dialog-header">Open File</div>
                    <div class="sheets-dialog-body">
                        <div class="sheets-file-list">${fileList}</div>
                    </div>
                    <div class="sheets-dialog-footer">
                        <button class="sheets-dialog-btn cancel">Cancel</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(dialog);
            
            dialog.querySelector('.cancel').addEventListener('click', () => dialog.remove());
            dialog.querySelectorAll('.sheets-file-item').forEach(item => {
                item.addEventListener('click', () => {
                    const fileName = item.dataset.filename;
                    dialog.remove();
                    this.loadCSV(windowId, fileName, docsFolder);
                });
            });
        } catch (e) {
            console.error('Open failed:', e);
        }
    }

    loadCSV(windowId, fileName, folder) {
        const file = folder.contents.find(f => f.name === fileName);
        if (!file || !file.content) {
            this.setStatus(windowId, 'Could not read file');
            return;
        }
        
        // Parse CSV
        const lines = file.content.split('\n').filter(l => l.trim());
        const newData = {};
        
        for (let r = 0; r < lines.length; r++) {
            const cells = this.parseCSVLine(lines[r]);
            for (let c = 0; c < cells.length && c < this.maxCols; c++) {
                if (cells[c]) {
                    newData[this.cellKey(r, c)] = cells[c];
                }
            }
        }
        
        this.sheets = [{ name: 'Sheet1', data: newData, colWidths: {}, styles: {} }];
        this.activeSheet = 0;
        this.currentFile = fileName;
        this.isDirty = false;
        this.undoStack = [];
        this.redoStack = [];
        this.refreshAll(windowId);
        this.selectCell(windowId, 0, 0);
        this.updateTitle(windowId, `ElxaSheets - ${fileName}`);
        this.setStatus(windowId, `Opened: ${fileName}`);
    }

    openFileByPath(windowId, filePath) {
        // Try to open a file from the filesystem by path string
        try {
            const parts = filePath.split('/').filter(p => p);
            const fileName = parts[parts.length - 1];
            const folderPath = parts.slice(0, -1);
            if (folderPath.length === 0) folderPath.push('root', 'Documents');
            
            const folder = this.fileSystem.getFolder(folderPath);
            if (folder) {
                this.loadCSV(windowId, fileName, folder);
            }
        } catch (e) {
            console.error('Could not open file:', filePath, e);
        }
    }

    parseCSVLine(line) {
        const cells = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (inQuotes) {
                if (ch === '"' && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else if (ch === '"') {
                    inQuotes = false;
                } else {
                    current += ch;
                }
            } else {
                if (ch === '"') {
                    inQuotes = true;
                } else if (ch === ',') {
                    cells.push(current);
                    current = '';
                } else {
                    current += ch;
                }
            }
        }
        cells.push(current);
        return cells;
    }

    // =================================
    // UI REFRESH
    // =================================

    refreshAll(windowId) {
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        const grid = windowElement.querySelector(`#sheets-grid-${windowId}`);
        if (grid) grid.innerHTML = this.renderGrid(windowId);
        
        this.refreshTabs(windowId);
        
        // Re-setup grid event handlers (since innerHTML was replaced)
        this.setupGridEvents(windowId);
    }

    setupGridEvents(windowId) {
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        const grid = windowElement.querySelector(`#sheets-grid-${windowId}`);
        if (!grid) return;
        
        grid.addEventListener('mousedown', (e) => {
            const cell = e.target.closest('.sheets-cell');
            if (cell) {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                if (e.shiftKey && this.selectedCell) {
                    this.selectRange(windowId, this.selectedCell.row, this.selectedCell.col, row, col);
                } else {
                    if (this.isEditing) this.commitEdit(windowId);
                    this.selectCell(windowId, row, col);
                }
            }
            
            const colHeader = e.target.closest('.sheets-col-header');
            if (colHeader && !e.target.classList.contains('sheets-col-resize')) {
                this.selectColumn(windowId, parseInt(colHeader.dataset.col));
            }
            
            const rowHeader = e.target.closest('.sheets-row-header');
            if (rowHeader && rowHeader.dataset.row !== undefined) {
                this.selectRow(windowId, parseInt(rowHeader.dataset.row));
            }
            
            const resizeHandle = e.target.closest('.sheets-col-resize');
            if (resizeHandle) {
                e.preventDefault();
                this.startColResize(windowId, parseInt(resizeHandle.dataset.col), e.clientX);
            }
        });

        grid.addEventListener('dblclick', (e) => {
            const cell = e.target.closest('.sheets-cell');
            if (cell) {
                this.startCellEdit(windowId, parseInt(cell.dataset.row), parseInt(cell.dataset.col));
            }
        });
    }

    refreshTabs(windowId) {
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        const tabContainer = windowElement.querySelector(`#sheets-tabs-${windowId}`);
        if (tabContainer) tabContainer.innerHTML = this.renderTabs(windowId);
    }

    updateTitle(windowId, title) {
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        const titleEl = windowElement.querySelector('.window-title');
        if (titleEl) titleEl.innerHTML = `${ElxaIcons.render('elxasheets', 'ui')} ${title}`;
    }

    setStatus(windowId, text) {
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        const status = windowElement.querySelector(`#sheets-status-${windowId}`);
        if (status) status.textContent = text;
    }

    updateStatusBar(windowId) {
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        const rightStatus = windowElement.querySelector(`#sheets-status-right-${windowId}`);
        if (!rightStatus) return;
        
        // Show sum/avg/count for selected range
        if (this.selectedRange) {
            let sum = 0, count = 0, numCount = 0;
            const sheet = this.sheets[this.activeSheet];
            for (let r = this.selectedRange.r1; r <= this.selectedRange.r2; r++) {
                for (let c = this.selectedRange.c1; c <= this.selectedRange.c2; c++) {
                    const key = this.cellKey(r, c);
                    const val = sheet.data[key] || '';
                    if (val) count++;
                    const display = this.getDisplayValue(val, r, c);
                    const num = parseFloat(display);
                    if (!isNaN(num)) {
                        sum += num;
                        numCount++;
                    }
                }
            }
            const avg = numCount > 0 ? (sum / numCount) : 0;
            rightStatus.textContent = `Sum: ${Math.round(sum * 100) / 100}  |  Avg: ${Math.round(avg * 100) / 100}  |  Count: ${count}`;
        } else {
            rightStatus.textContent = '';
        }
    }

    // =================================
    // UTILITY METHODS
    // =================================

    cellKey(row, col) { return `${row}:${col}`; }
    
    keyToRowCol(key) {
        const [r, c] = key.split(':').map(Number);
        return [r, c];
    }
    
    colLetter(col) { return String.fromCharCode(65 + col); }
    
    cellStyleString(style) {
        let s = '';
        if (style.bold) s += 'font-weight:bold;';
        if (style.italic) s += 'font-style:italic;';
        if (style.align) s += `text-align:${style.align};`;
        return s;
    }
    
    escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
}