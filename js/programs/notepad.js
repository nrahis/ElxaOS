// =================================
// NOTEPAD — FULL REWRITE
// =================================
// Rich text editor with menu bar, formatting ribbon, find & replace,
// zoom, alignment, lists, and proper file management.
// Still uses document.execCommand() — deprecated but functional everywhere.

class NotepadProgram {
    constructor(windowManager, fileSystem, eventBus) {
        this.windowManager = windowManager;
        this.fileSystem = fileSystem;
        this.eventBus = eventBus;
        this.documentCounter = 0;

        // Per-window state keyed by windowId
        this.docs = new Map();

        // Fonts & sizes available in dropdowns
        this.fonts = [
            'Arial', 'Arial Black', 'Brush Script MT', 'Calibri', 'Cambria',
            'Comic Sans MS', 'Consolas', 'Copperplate', 'Courier New',
            'Cursive', 'Fantasy', 'Garamond', 'Georgia', 'Helvetica',
            'Impact', 'Ink Free', 'Lucida Console', 'Lucida Handwriting',
            'Lucida Sans', 'Monospace', 'Palatino Linotype', 'Papyrus',
            'Segoe UI', 'Segoe Print', 'Segoe Script', 'Tahoma',
            'Times New Roman', 'Trebuchet MS', 'Verdana'
        ];
        this.sizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

        this.colors = [
            { n: 'Black',  v: '#000000' }, { n: 'Dark Red',   v: '#8B0000' },
            { n: 'Red',    v: '#FF0000' }, { n: 'Orange',     v: '#FFA500' },
            { n: 'Yellow', v: '#FFD700' }, { n: 'Green',      v: '#008000' },
            { n: 'Teal',   v: '#008080' }, { n: 'Blue',       v: '#0000FF' },
            { n: 'Purple', v: '#800080' }, { n: 'Pink',       v: '#FF69B4' },
            { n: 'Brown',  v: '#8B4513' }, { n: 'Gray',       v: '#808080' },
            { n: 'Silver', v: '#C0C0C0' }, { n: 'White',      v: '#FFFFFF' },
            { n: 'Cyan',   v: '#00FFFF' }, { n: 'Lime',       v: '#00FF00' }
        ];
    }

    // ===========================
    // LAUNCH & WINDOW CREATION
    // ===========================

    launch(content = '', filename = null, path = null) {
        this.documentCounter++;
        const wid = 'notepad-' + Date.now() + '-' + this.documentCounter;
        const title = filename || ('Untitled ' + this.documentCounter);

        this.docs.set(wid, {
            filename: filename,
            path: path || ['root', 'Documents'],
            saved: !!filename,
            hasFormatting: false,
            zoom: 100,
            findOpen: false
        });

        const html = this._buildUI(wid);
        this.windowManager.createWindow(
            wid,
            ElxaIcons.render('notepad', 'ui') + ' ' + title,
            html,
            { width: '920px', height: '680px', x: '60px', y: '40px' }
        );

        this._bind(wid);
        if (content) this._loadContent(wid, content);
        this._updateStatusBar(wid);

        // Focus editor
        const el = this._el(wid);
        if (el) el.querySelector('.np-editor').focus();

        return wid;
    }

    // Open a file from the filesystem (called externally, e.g. from file manager)
    openFile(filename, path) {
        const filePath = path || ['root', 'Documents'];
        const file = this.fileSystem.getFile(filePath, filename);
        if (!file) {
            ElxaUI.showMessage('File not found: ' + filename, 'error');
            return;
        }
        this.launch(file.content || '', filename, [...filePath]);
    }

    // ===========================
    // UI BUILDER
    // ===========================

    _buildUI(wid) {
        const fontOpts = this.fonts.map(f =>
            '<option value="' + f + '"' + (f === 'Arial' ? ' selected' : '') + '>' + f + '</option>'
        ).join('');

        const sizeOpts = this.sizes.map(s =>
            '<option value="' + s + '"' + (s === 14 ? ' selected' : '') + '>' + s + '</option>'
        ).join('');

        const colorSwatches = this.colors.map(c =>
            '<div class="np-swatch" data-color="' + c.v + '" style="background:' + c.v + (c.v === '#FFFFFF' ? ';border:1px solid #ccc' : '') + '" title="' + c.n + '"></div>'
        ).join('');

        const hlSwatches = '<div class="np-swatch" data-color="transparent" style="background:#fff;border:1px solid #999" title="None">\u00D7</div>' +
            this.colors.filter(c => c.v !== '#000000').map(c =>
                '<div class="np-swatch" data-color="' + c.v + '" style="background:' + c.v + '" title="' + c.n + '"></div>'
            ).join('');

        return '<div class="np-wrap" data-wid="' + wid + '">' +

            // ---- Menu Bar ----
            '<div class="np-menubar">' +
                '<div class="np-menu" data-menu="file"><span class="np-menu-label">File</span>' +
                    '<div class="np-dropdown">' +
                        '<div class="np-menu-item" data-action="new">' + ElxaIcons.renderAction('new-file') + ' New</div>' +
                        '<div class="np-menu-item" data-action="open">' + ElxaIcons.renderAction('open') + ' Open\u2026</div>' +
                        '<div class="np-menu-sep"></div>' +
                        '<div class="np-menu-item" data-action="save">' + ElxaIcons.renderAction('save') + ' Save<span class="np-shortcut">Ctrl+S</span></div>' +
                        '<div class="np-menu-item" data-action="saveas">' + ElxaIcons.renderAction('save') + ' Save As\u2026</div>' +
                    '</div>' +
                '</div>' +
                '<div class="np-menu" data-menu="edit"><span class="np-menu-label">Edit</span>' +
                    '<div class="np-dropdown">' +
                        '<div class="np-menu-item" data-action="undo">' + ElxaIcons.renderAction('undo') + ' Undo<span class="np-shortcut">Ctrl+Z</span></div>' +
                        '<div class="np-menu-item" data-action="redo">' + ElxaIcons.renderAction('redo') + ' Redo<span class="np-shortcut">Ctrl+Y</span></div>' +
                        '<div class="np-menu-sep"></div>' +
                        '<div class="np-menu-item" data-action="find">' + ElxaIcons.renderAction('search') + ' Find & Replace<span class="np-shortcut">Ctrl+H</span></div>' +
                        '<div class="np-menu-sep"></div>' +
                        '<div class="np-menu-item" data-action="selectall">Select All<span class="np-shortcut">Ctrl+A</span></div>' +
                    '</div>' +
                '</div>' +
                '<div class="np-menu" data-menu="format"><span class="np-menu-label">Format</span>' +
                    '<div class="np-dropdown">' +
                        '<div class="np-menu-item" data-action="bold">' + ElxaIcons.renderAction('bold') + ' Bold<span class="np-shortcut">Ctrl+B</span></div>' +
                        '<div class="np-menu-item" data-action="italic">' + ElxaIcons.renderAction('italic') + ' Italic<span class="np-shortcut">Ctrl+I</span></div>' +
                        '<div class="np-menu-item" data-action="underline">' + ElxaIcons.renderAction('underline') + ' Underline<span class="np-shortcut">Ctrl+U</span></div>' +
                        '<div class="np-menu-item" data-action="strikethrough">Strikethrough</div>' +
                    '</div>' +
                '</div>' +
                '<div class="np-menu" data-menu="view"><span class="np-menu-label">View</span>' +
                    '<div class="np-dropdown">' +
                        '<div class="np-menu-item" data-action="zoomin">Zoom In<span class="np-shortcut">Ctrl++</span></div>' +
                        '<div class="np-menu-item" data-action="zoomout">Zoom Out<span class="np-shortcut">Ctrl+-</span></div>' +
                        '<div class="np-menu-item" data-action="zoomreset">Reset Zoom<span class="np-shortcut">Ctrl+0</span></div>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // ---- Formatting Ribbon ----
            '<div class="np-ribbon">' +
                // Font group
                '<div class="np-rgroup">' +
                    '<select class="np-font-sel" title="Font" onmousedown="event.stopPropagation()">' + fontOpts + '</select>' +
                    '<select class="np-size-sel" title="Size" onmousedown="event.stopPropagation()">' + sizeOpts + '</select>' +
                '</div>' +

                '<div class="np-rsep"></div>' +

                // Style group
                '<div class="np-rgroup">' +
                    '<button class="np-rbtn np-fmt-bold" data-cmd="bold" title="Bold (Ctrl+B)" onmousedown="event.preventDefault()">' + ElxaIcons.renderAction('bold') + '</button>' +
                    '<button class="np-rbtn np-fmt-italic" data-cmd="italic" title="Italic (Ctrl+I)" onmousedown="event.preventDefault()">' + ElxaIcons.renderAction('italic') + '</button>' +
                    '<button class="np-rbtn np-fmt-underline" data-cmd="underline" title="Underline (Ctrl+U)" onmousedown="event.preventDefault()">' + ElxaIcons.renderAction('underline') + '</button>' +
                    '<button class="np-rbtn np-fmt-strike" data-cmd="strikethrough" title="Strikethrough" onmousedown="event.preventDefault()"><span class="mdi mdi-format-strikethrough"></span></button>' +
                '</div>' +

                '<div class="np-rsep"></div>' +

                // Color group
                '<div class="np-rgroup">' +
                    '<div class="np-color-wrap">' +
                        '<button class="np-rbtn np-text-color-btn" title="Text Color" onmousedown="event.preventDefault()">' + ElxaIcons.renderAction('text-color') + '</button>' +
                        '<div class="np-palette np-text-palette">' + colorSwatches + '</div>' +
                    '</div>' +
                    '<div class="np-color-wrap">' +
                        '<button class="np-rbtn np-hl-color-btn" title="Highlight" onmousedown="event.preventDefault()">' + ElxaIcons.renderAction('highlight') + '</button>' +
                        '<div class="np-palette np-hl-palette">' + hlSwatches + '</div>' +
                    '</div>' +
                '</div>' +

                '<div class="np-rsep"></div>' +

                // Alignment group
                '<div class="np-rgroup">' +
                    '<button class="np-rbtn np-align-left active" data-align="justifyLeft" title="Align Left" onmousedown="event.preventDefault()"><span class="mdi mdi-format-align-left"></span></button>' +
                    '<button class="np-rbtn np-align-center" data-align="justifyCenter" title="Center" onmousedown="event.preventDefault()"><span class="mdi mdi-format-align-center"></span></button>' +
                    '<button class="np-rbtn np-align-right" data-align="justifyRight" title="Align Right" onmousedown="event.preventDefault()"><span class="mdi mdi-format-align-right"></span></button>' +
                    '<button class="np-rbtn np-align-justify" data-align="justifyFull" title="Justify" onmousedown="event.preventDefault()"><span class="mdi mdi-format-align-justify"></span></button>' +
                '</div>' +

                '<div class="np-rsep"></div>' +

                // List group
                '<div class="np-rgroup">' +
                    '<button class="np-rbtn" data-cmd="insertUnorderedList" title="Bullet List" onmousedown="event.preventDefault()"><span class="mdi mdi-format-list-bulleted"></span></button>' +
                    '<button class="np-rbtn" data-cmd="insertOrderedList" title="Numbered List" onmousedown="event.preventDefault()"><span class="mdi mdi-format-list-numbered"></span></button>' +
                '</div>' +
            '</div>' +

            // ---- Find & Replace Bar (hidden by default) ----
            '<div class="np-findbar" style="display:none">' +
                '<div class="np-find-row">' +
                    '<label>Find:</label>' +
                    '<input type="text" class="np-find-input" placeholder="Search text\u2026">' +
                    '<button class="np-find-btn" data-faction="findprev" title="Previous">\u25C0</button>' +
                    '<button class="np-find-btn" data-faction="findnext" title="Next">\u25B6</button>' +
                    '<span class="np-find-count"></span>' +
                '</div>' +
                '<div class="np-find-row">' +
                    '<label>Replace:</label>' +
                    '<input type="text" class="np-replace-input" placeholder="Replace with\u2026">' +
                    '<button class="np-find-btn" data-faction="replace">Replace</button>' +
                    '<button class="np-find-btn" data-faction="replaceall">Replace All</button>' +
                    '<button class="np-find-close" data-faction="closefind" title="Close">\u2715</button>' +
                '</div>' +
            '</div>' +

            // ---- Editor ----
            '<div class="np-editor-wrap">' +
                '<div class="np-editor" contenteditable="true" spellcheck="false" data-wid="' + wid + '"></div>' +
            '</div>' +

            // ---- Status Bar ----
            '<div class="np-statusbar">' +
                '<span class="np-status-left">Ready</span>' +
                '<span class="np-status-counts">Words: 0 &nbsp;|&nbsp; Chars: 0 &nbsp;|&nbsp; Lines: 1</span>' +
                '<span class="np-status-zoom">' +
                    '<button class="np-zoom-btn" data-action="zoomout" title="Zoom Out">\u2212</button>' +
                    '<span class="np-zoom-level">100%</span>' +
                    '<button class="np-zoom-btn" data-action="zoomin" title="Zoom In">+</button>' +
                '</span>' +
            '</div>' +

        '</div>';
    }

    // ===========================
    // HELPERS
    // ===========================

    _el(wid) {
        return document.querySelector('.np-wrap[data-wid="' + wid + '"]');
    }

    _editor(wid) {
        const w = this._el(wid);
        return w ? w.querySelector('.np-editor') : null;
    }

    _doc(wid) {
        return this.docs.get(wid);
    }

    _widFromEl(el) {
        const wrap = el.closest('.np-wrap');
        return wrap ? wrap.dataset.wid : null;
    }

    // ===========================
    // EVENT BINDING
    // ===========================

    _bind(wid) {
        const wrap = this._el(wid);
        if (!wrap) return;
        const editor = wrap.querySelector('.np-editor');
        const doc = this._doc(wid);

        // ---- Menu bar ----
        wrap.querySelectorAll('.np-menu').forEach(menu => {
            const label = menu.querySelector('.np-menu-label');
            const dd = menu.querySelector('.np-dropdown');
            label.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close all other menus
                wrap.querySelectorAll('.np-dropdown.open').forEach(d => {
                    if (d !== dd) d.classList.remove('open');
                });
                dd.classList.toggle('open');
            });
        });

        // Close menus on click outside
        const closeMenus = (e) => {
            if (!e.target.closest('.np-menu')) {
                wrap.querySelectorAll('.np-dropdown.open').forEach(d => d.classList.remove('open'));
            }
        };
        document.addEventListener('click', closeMenus);
        this.eventBus.on('window.closed', (data) => {
            if (data.id === wid) document.removeEventListener('click', closeMenus);
        });

        // Menu item clicks
        wrap.querySelectorAll('.np-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                wrap.querySelectorAll('.np-dropdown.open').forEach(d => d.classList.remove('open'));
                this._handleAction(wid, item.dataset.action);
            });
        });

        // ---- Ribbon: format buttons ----
        wrap.querySelectorAll('.np-rbtn[data-cmd]').forEach(btn => {
            btn.addEventListener('click', () => {
                this._execCmd(wid, btn.dataset.cmd);
            });
        });

        // ---- Ribbon: alignment ----
        wrap.querySelectorAll('.np-rbtn[data-align]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.execCommand(btn.dataset.align, false, null);
                this._updateToolbar(wid);
                this._markDirty(wid);
            });
        });

        // ---- Ribbon: font select ----
        const fontSel = wrap.querySelector('.np-font-sel');
        fontSel.addEventListener('focus', () => { this._savedRange = this._saveSelection(); });
        fontSel.addEventListener('change', () => {
            this._restoreSelection(this._savedRange);
            document.execCommand('fontName', false, fontSel.value);
            this._savedRange = null;
            this._markDirty(wid);
            this._updateToolbar(wid);
        });

        // ---- Ribbon: size select ----
        const sizeSel = wrap.querySelector('.np-size-sel');
        sizeSel.addEventListener('focus', () => { this._savedRange = this._saveSelection(); });
        sizeSel.addEventListener('change', () => {
            this._restoreSelection(this._savedRange);
            document.execCommand('fontSize', false, this._pxToHtmlSize(parseInt(sizeSel.value)));
            this._savedRange = null;
            this._markDirty(wid);
            this._updateToolbar(wid);
        });

        // ---- Ribbon: color palettes ----
        this._bindPalette(wrap, '.np-text-color-btn', '.np-text-palette', (color) => {
            document.execCommand('foreColor', false, color);
            this._markDirty(wid);
        });
        this._bindPalette(wrap, '.np-hl-color-btn', '.np-hl-palette', (color) => {
            if (color === 'transparent') {
                document.execCommand('hiliteColor', false, 'transparent');
                document.execCommand('backColor', false, 'transparent');
            } else {
                document.execCommand('hiliteColor', false, color);
            }
            this._markDirty(wid);
        });

        // ---- Editor events ----
        editor.addEventListener('input', () => {
            this._markDirty(wid);
            this._updateStatusBar(wid);
        });

        editor.addEventListener('mouseup', () => {
            setTimeout(() => this._updateToolbar(wid), 10);
        });
        editor.addEventListener('keyup', () => {
            setTimeout(() => this._updateToolbar(wid), 10);
        });

        editor.addEventListener('keydown', (e) => this._onKeyDown(e, wid));

        editor.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
            this._markDirty(wid);
        });

        // ---- Find bar ----
        wrap.querySelectorAll('[data-faction]').forEach(btn => {
            btn.addEventListener('click', () => this._handleFind(wid, btn.dataset.faction));
        });
        const findInput = wrap.querySelector('.np-find-input');
        findInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this._handleFind(wid, e.shiftKey ? 'findprev' : 'findnext');
            }
            if (e.key === 'Escape') this._handleFind(wid, 'closefind');
        });
        const replaceInput = wrap.querySelector('.np-replace-input');
        replaceInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this._handleFind(wid, 'closefind');
        });

        // ---- Status bar zoom buttons ----
        wrap.querySelectorAll('.np-zoom-btn').forEach(btn => {
            btn.addEventListener('click', () => this._handleAction(wid, btn.dataset.action));
        });

        // ---- Font preview: render each option in its own typeface ----
        fontSel.querySelectorAll('option').forEach(opt => {
            opt.style.fontFamily = opt.value;
        });
    }

    _bindPalette(wrap, btnSel, paletteSel, onPick) {
        const btn = wrap.querySelector(btnSel);
        const palette = wrap.querySelector(paletteSel);

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Save selection before palette steals focus
            this._savedRange = this._saveSelection();
            const isOpen = palette.classList.contains('open');
            // Close all palettes first
            wrap.querySelectorAll('.np-palette.open').forEach(p => p.classList.remove('open'));
            if (!isOpen) palette.classList.add('open');
        });

        palette.addEventListener('click', (e) => {
            const swatch = e.target.closest('.np-swatch');
            if (!swatch) return;
            this._restoreSelection(this._savedRange);
            onPick(swatch.dataset.color);
            palette.classList.remove('open');
            this._savedRange = null;
        });

        // Close palette on outside click
        const closePal = (e) => {
            if (!e.target.closest('.np-color-wrap')) {
                palette.classList.remove('open');
            }
        };
        document.addEventListener('click', closePal);
        // Clean up later — we rely on window.closed event in the menu close handler
    }

    // ===========================
    // SELECTION SAVE/RESTORE
    // ===========================

    _saveSelection() {
        const sel = window.getSelection();
        return sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;
    }

    _restoreSelection(range) {
        if (!range) return;
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    // ===========================
    // EXEC COMMAND WRAPPER
    // ===========================

    _execCmd(wid, cmd, val) {
        document.execCommand(cmd, false, val || null);
        const doc = this._doc(wid);
        if (doc) doc.hasFormatting = true;
        this._markDirty(wid);
        this._updateToolbar(wid);
    }

    _pxToHtmlSize(px) {
        if (px <= 10) return 1;
        if (px <= 12) return 2;
        if (px <= 14) return 3;
        if (px <= 18) return 4;
        if (px <= 24) return 5;
        if (px <= 32) return 6;
        return 7;
    }

    // ===========================
    // KEYBOARD HANDLER
    // ===========================

    _onKeyDown(e, wid) {
        if (e.key === 'Tab') {
            e.preventDefault();
            document.execCommand('insertText', false, '    ');
            return;
        }

        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'b': e.preventDefault(); this._execCmd(wid, 'bold'); break;
                case 'i': e.preventDefault(); this._execCmd(wid, 'italic'); break;
                case 'u': e.preventDefault(); this._execCmd(wid, 'underline'); break;
                case 's': e.preventDefault(); this._handleAction(wid, 'save'); break;
                case 'h': e.preventDefault(); this._handleAction(wid, 'find'); break;
                case '=': case '+': e.preventDefault(); this._handleAction(wid, 'zoomin'); break;
                case '-': e.preventDefault(); this._handleAction(wid, 'zoomout'); break;
                case '0': e.preventDefault(); this._handleAction(wid, 'zoomreset'); break;
            }
        }
    }

    // ===========================
    // ACTION DISPATCHER
    // ===========================

    _handleAction(wid, action) {
        switch (action) {
            case 'new':           this.launch(); break;
            case 'open':          this._showOpenDialog(wid); break;
            case 'save':          this._save(wid); break;
            case 'saveas':        this._showSaveAsDialog(wid); break;
            case 'undo':          document.execCommand('undo'); break;
            case 'redo':          document.execCommand('redo'); break;
            case 'find':          this._toggleFind(wid); break;
            case 'selectall':     this._selectAll(wid); break;
            case 'bold':          this._execCmd(wid, 'bold'); break;
            case 'italic':        this._execCmd(wid, 'italic'); break;
            case 'underline':     this._execCmd(wid, 'underline'); break;
            case 'strikethrough': this._execCmd(wid, 'strikeThrough'); break;
            case 'zoomin':        this._zoom(wid, 10); break;
            case 'zoomout':       this._zoom(wid, -10); break;
            case 'zoomreset':     this._zoom(wid, 0); break;
        }
    }

    // ===========================
    // TOOLBAR STATE UPDATE
    // ===========================

    _updateToolbar(wid) {
        const wrap = this._el(wid);
        if (!wrap) return;
        const editor = wrap.querySelector('.np-editor');
        const sel = window.getSelection();
        if (sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        if (!editor.contains(range.startContainer)) return;

        let node = range.startContainer;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
        const cs = window.getComputedStyle(node);

        // Bold / Italic / Underline / Strikethrough
        const isBold = cs.fontWeight === 'bold' || parseInt(cs.fontWeight) >= 700;
        const isItalic = cs.fontStyle === 'italic';
        const isUnder = cs.textDecoration.includes('underline');
        const isStrike = cs.textDecoration.includes('line-through');

        wrap.querySelector('.np-fmt-bold').classList.toggle('active', isBold);
        wrap.querySelector('.np-fmt-italic').classList.toggle('active', isItalic);
        wrap.querySelector('.np-fmt-underline').classList.toggle('active', isUnder);
        wrap.querySelector('.np-fmt-strike').classList.toggle('active', isStrike);

        // Font family
        const family = cs.fontFamily.replace(/"/g, '').split(',')[0].trim();
        wrap.querySelector('.np-font-sel').value = family;

        // Font size — snap to nearest dropdown value
        const cpx = parseInt(cs.fontSize);
        const snapped = this.sizes.reduce((prev, curr) =>
            Math.abs(curr - cpx) < Math.abs(prev - cpx) ? curr : prev
        );
        wrap.querySelector('.np-size-sel').value = snapped;

        // Alignment
        const align = cs.textAlign;
        wrap.querySelectorAll('.np-rbtn[data-align]').forEach(b => b.classList.remove('active'));
        if (align === 'center') wrap.querySelector('.np-align-center').classList.add('active');
        else if (align === 'right') wrap.querySelector('.np-align-right').classList.add('active');
        else if (align === 'justify') wrap.querySelector('.np-align-justify').classList.add('active');
        else wrap.querySelector('.np-align-left').classList.add('active');

        // Text color indicator
        wrap.querySelector('.np-text-color-btn').style.borderBottomColor = cs.color;
    }

    // ===========================
    // STATUS BAR
    // ===========================

    _updateStatusBar(wid) {
        const wrap = this._el(wid);
        if (!wrap) return;
        const editor = wrap.querySelector('.np-editor');
        const text = editor.innerText || '';
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;
        const lines = text.split('\n').length;

        wrap.querySelector('.np-status-counts').textContent =
            'Words: ' + words + '  |  Chars: ' + chars + '  |  Lines: ' + lines;
    }

    // ===========================
    // ZOOM
    // ===========================

    _zoom(wid, delta) {
        const doc = this._doc(wid);
        if (!doc) return;
        const editor = this._editor(wid);
        const wrap = this._el(wid);
        if (!editor || !wrap) return;

        if (delta === 0) {
            doc.zoom = 100;
        } else {
            doc.zoom = Math.max(50, Math.min(250, doc.zoom + delta));
        }

        editor.style.transform = 'scale(' + (doc.zoom / 100) + ')';
        editor.style.transformOrigin = 'top left';
        // Adjust width so text reflows properly
        editor.style.width = (10000 / doc.zoom) + '%';

        wrap.querySelector('.np-zoom-level').textContent = doc.zoom + '%';
    }

    // ===========================
    // DIRTY / TITLE MANAGEMENT
    // ===========================

    _markDirty(wid) {
        const doc = this._doc(wid);
        if (!doc) return;
        doc.saved = false;
        this._updateTitle(wid);
    }

    _updateTitle(wid) {
        const doc = this._doc(wid);
        if (!doc) return;
        const winEl = document.getElementById('window-' + wid);
        if (!winEl) return;
        const titleEl = winEl.querySelector('.window-title');
        const name = doc.filename || ('Untitled ' + wid.split('-').pop());
        titleEl.innerHTML = ElxaIcons.render('notepad', 'ui') + ' ' + name + (doc.saved ? '' : '*');
    }

    // ===========================
    // CONTENT LOAD
    // ===========================

    _loadContent(wid, content) {
        const editor = this._editor(wid);
        if (!editor) return;
        const doc = this._doc(wid);

        if (this._hasRichFormatting(content)) {
            editor.innerHTML = content;
            doc.hasFormatting = true;
        } else {
            // Escape and convert newlines
            const safe = content
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n/g, '<br>');
            editor.innerHTML = safe;
        }
        this._updateStatusBar(wid);
    }

    _hasRichFormatting(html) {
        if (!html) return false;
        // Bare formatting tags — unambiguous, no further check needed
        if (/<(b|i|u|strong|em|strike|s)\b[^>]*>/i.test(html)) return true;
        // <font> tags with attributes (face, size, color) from execCommand
        if (/<font[^>]+(face|size|color)\s*=/i.test(html)) return true;
        // Ordered/unordered lists
        if (/<(ul|ol)\b/i.test(html)) return true;
        // Styled spans/divs/paragraphs — check for actual formatting CSS
        if (/<(span|div|p)[^>]*style\s*=/i.test(html)) {
            const fmtTest = /(color|background-color|font-weight:\s*bold|font-style:\s*italic|text-decoration:\s*(underline|line-through)|font-family:|font-size:|text-align:\s*(center|right|justify))/i;
            return fmtTest.test(html);
        }
        return false;
    }

    // ===========================
    // SELECT ALL
    // ===========================

    _selectAll(wid) {
        const editor = this._editor(wid);
        if (!editor) return;
        const range = document.createRange();
        range.selectNodeContents(editor);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    // ===========================
    // FIND & REPLACE
    // ===========================

    _toggleFind(wid) {
        const wrap = this._el(wid);
        if (!wrap) return;
        const bar = wrap.querySelector('.np-findbar');
        const isVisible = bar.style.display !== 'none';
        bar.style.display = isVisible ? 'none' : 'flex';
        if (!isVisible) {
            wrap.querySelector('.np-find-input').focus();
        }
    }

    _handleFind(wid, action) {
        const wrap = this._el(wid);
        if (!wrap) return;
        const editor = wrap.querySelector('.np-editor');
        const findInput = wrap.querySelector('.np-find-input');
        const replaceInput = wrap.querySelector('.np-replace-input');
        const countEl = wrap.querySelector('.np-find-count');
        const needle = findInput.value;

        switch (action) {
            case 'findnext':
            case 'findprev': {
                if (!needle) return;
                // Use window.find for simplicity
                const backwards = action === 'findprev';
                const found = window.find(needle, false, backwards, true, false, false, false);
                if (!found) {
                    countEl.textContent = 'Not found';
                } else {
                    countEl.textContent = '';
                }
                break;
            }
            case 'replace': {
                if (!needle) return;
                const sel = window.getSelection();
                if (sel.toString().toLowerCase() === needle.toLowerCase()) {
                    document.execCommand('insertText', false, replaceInput.value);
                    this._markDirty(wid);
                    // Find next
                    window.find(needle, false, false, true, false, false, false);
                } else {
                    window.find(needle, false, false, true, false, false, false);
                }
                break;
            }
            case 'replaceall': {
                if (!needle) return;
                let count = 0;
                // Move to start
                editor.focus();
                const sel = window.getSelection();
                sel.collapse(editor, 0);
                while (window.find(needle, false, false, true, false, false, false)) {
                    // Check if result is inside our editor
                    const selNow = window.getSelection();
                    if (!editor.contains(selNow.anchorNode)) break;
                    document.execCommand('insertText', false, replaceInput.value);
                    count++;
                    if (count > 5000) break; // Safety
                }
                if (count > 0) this._markDirty(wid);
                countEl.textContent = count + ' replaced';
                break;
            }
            case 'closefind':
                wrap.querySelector('.np-findbar').style.display = 'none';
                editor.focus();
                break;
        }
    }

    // ===========================
    // FILE: OPEN DIALOG
    // ===========================

    _showOpenDialog(wid) {
        const files = this.fileSystem.listContents(['root', 'Documents']);
        const textFiles = files.filter(f =>
            f.name.endsWith('.txt') || f.name.endsWith('.html') || f.name.endsWith('.rtf')
        );

        if (textFiles.length === 0) {
            ElxaUI.showMessage('No text files in Documents folder', 'info');
            return;
        }

        const items = textFiles.map(f => {
            let modified = '';
            if (f.modified) {
                try { modified = new Date(f.modified).toLocaleDateString(); } catch(e) {}
            }
            return '<div class="np-dlg-file" data-fname="' + f.name + '">' +
                '<span class="np-dlg-file-icon">' + ElxaIcons.getFileIcon(f.name, 'ui') + '</span>' +
                '<span class="np-dlg-file-name">' + f.name + '</span>' +
                '<span class="np-dlg-file-date">' + modified + '</span>' +
            '</div>';
        }).join('');

        const dlg = document.createElement('div');
        dlg.className = 'np-dialog-overlay';
        dlg.innerHTML =
            '<div class="np-dialog">' +
                '<div class="np-dlg-titlebar">' +
                    '<span>' + ElxaIcons.renderAction('open') + ' Open File</span>' +
                    '<span class="np-dlg-close">\u2715</span>' +
                '</div>' +
                '<div class="np-dlg-body">' +
                    '<div class="np-dlg-filelist">' + items + '</div>' +
                    '<div class="np-dlg-buttons">' +
                        '<button class="np-dlg-btn np-dlg-primary np-open-btn" disabled>Open</button>' +
                        '<button class="np-dlg-btn np-dlg-cancel">Cancel</button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        document.body.appendChild(dlg);

        let selected = null;
        dlg.querySelectorAll('.np-dlg-file').forEach(item => {
            item.addEventListener('click', () => {
                dlg.querySelectorAll('.np-dlg-file').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                selected = item.dataset.fname;
                dlg.querySelector('.np-open-btn').disabled = false;
            });
            item.addEventListener('dblclick', () => {
                this.openFile(item.dataset.fname);
                dlg.remove();
            });
        });

        dlg.querySelector('.np-open-btn').addEventListener('click', () => {
            if (selected) {
                this.openFile(selected);
                dlg.remove();
            }
        });
        dlg.querySelector('.np-dlg-cancel').addEventListener('click', () => dlg.remove());
        dlg.querySelector('.np-dlg-close').addEventListener('click', () => dlg.remove());
    }

    // ===========================
    // FILE: SAVE
    // ===========================

    _save(wid) {
        const doc = this._doc(wid);
        if (!doc) return;

        if (doc.filename) {
            this._writeFile(wid, doc.filename, doc.path);
        } else {
            this._showSaveAsDialog(wid);
        }
    }

    _writeFile(wid, filename, path) {
        const editor = this._editor(wid);
        const doc = this._doc(wid);
        if (!editor || !doc) return;

        let content;
        let finalName = filename;

        // Check if content has rich formatting
        if (this._hasRichFormatting(editor.innerHTML)) {
            // Save as HTML content but keep whatever extension the user chose
            content = editor.innerHTML;
        } else {
            content = editor.innerText || '';
            if (!finalName.includes('.')) {
                finalName += '.txt';
            }
        }

        const existing = this.fileSystem.getFile(path, finalName);
        if (existing) {
            this.fileSystem.updateFileContent(path, finalName, content);
        } else {
            this.fileSystem.createFile(path, finalName, content);
        }

        doc.filename = finalName;
        doc.path = path;
        doc.saved = true;
        this._updateTitle(wid);
        ElxaUI.showMessage('Saved ' + finalName, 'success');
    }

    // ===========================
    // FILE: SAVE AS DIALOG
    // ===========================

    _showSaveAsDialog(wid) {
        const doc = this._doc(wid);
        if (!doc) return;
        const editor = this._editor(wid);
        const hasFormat = this._hasRichFormatting(editor.innerHTML);
        const defaultName = doc.filename || 'Untitled.txt';
        const locationName = doc.path[doc.path.length - 1] || 'Documents';

        const dlg = document.createElement('div');
        dlg.className = 'np-dialog-overlay';
        dlg.innerHTML =
            '<div class="np-dialog">' +
                '<div class="np-dlg-titlebar">' +
                    '<span>' + ElxaIcons.renderAction('save') + ' Save As</span>' +
                    '<span class="np-dlg-close">\u2715</span>' +
                '</div>' +
                '<div class="np-dlg-body">' +
                    '<div class="np-dlg-form">' +
                        '<label class="np-dlg-label">Filename:</label>' +
                        '<input type="text" class="np-dlg-input np-save-name" value="' + defaultName + '">' +
                        '<div class="np-dlg-hint">Save to: ' + locationName + ' folder</div>' +
                        (hasFormat ? '<div class="np-dlg-hint">\u2139 Formatting will be preserved</div>' : '') +
                    '</div>' +
                    '<div class="np-dlg-buttons">' +
                        '<button class="np-dlg-btn np-dlg-primary np-save-btn">Save</button>' +
                        '<button class="np-dlg-btn np-dlg-cancel">Cancel</button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        document.body.appendChild(dlg);

        const nameInput = dlg.querySelector('.np-save-name');
        nameInput.focus();
        nameInput.select();

        const doSave = () => {
            let name = nameInput.value.trim();
            if (!name) { ElxaUI.showMessage('Please enter a filename', 'warning'); return; }
            if (!name.includes('.')) name += '.txt';

            const path = doc.path || ['root', 'Documents'];
            const existing = this.fileSystem.getFile(path, name);
            if (existing && !confirm('Overwrite "' + name + '"?')) return;

            this._writeFile(wid, name, path);
            dlg.remove();
        };

        dlg.querySelector('.np-save-btn').addEventListener('click', doSave);
        nameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') doSave(); });
        dlg.querySelector('.np-dlg-cancel').addEventListener('click', () => dlg.remove());
        dlg.querySelector('.np-dlg-close').addEventListener('click', () => dlg.remove());
    }

    // ===========================
    // RGB → HEX UTILITY
    // ===========================

    _rgbToHex(rgb) {
        if (!rgb || rgb.startsWith('#')) return rgb || '#000000';
        const m = rgb.match(/\d+/g);
        if (!m) return '#000000';
        return '#' + ((1 << 24) + (parseInt(m[0]) << 16) + (parseInt(m[1]) << 8) + parseInt(m[2])).toString(16).slice(1);
    }
}