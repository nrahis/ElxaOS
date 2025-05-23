// =================================
// THEME SERVICE
// =================================
class ThemeService {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.currentTheme = 'classic';
        this.currentWallpaper = 'default';
        
        this.themes = {
            classic: {
                name: 'Classic',
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #c0c0c0, #808080)',
                    taskbarBorder: '#ffffff',
                    windowBg: '#c0c0c0',
                    windowBorder: '#c0c0c0',
                    titlebarBg: 'linear-gradient(to right, #0000ff, #4080ff)',
                    titlebarInactive: 'linear-gradient(to right, #808080, #a0a0a0)',
                    buttonBg: 'linear-gradient(to bottom, #dfdfdf, #c0c0c0)',
                    buttonHoverBg: 'linear-gradient(to bottom, #e8e8e8, #d0d0d0)',
                    buttonActiveBg: 'linear-gradient(to bottom, #c0c0c0, #dfdfdf)',
                    desktopBg: 'linear-gradient(45deg, #008080, #20B2AA)',
                    menuBg: '#c0c0c0',
                    menuHoverBg: '#316AC5',
                    menuText: '#333333',
                    menuHoverText: 'white',
                    systemTrayBg: '#c0c0c0',
                    clockBg: '#c0c0c0',
                    clockText: '#333333',
                    iconText: 'white',
                    iconTextShadow: 'rgba(0,0,0,0.8)'
                }
            },
            luna: {
                name: 'Luna Blue',
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #316AC5, #1F4788)',
                    taskbarBorder: '#ffffff',
                    windowBg: '#ece9d8',
                    windowBorder: '#316AC5',
                    titlebarBg: 'linear-gradient(to right, #316AC5, #4A8BC2)',
                    titlebarInactive: 'linear-gradient(to right, #7A96DF, #B4C7E7)',
                    buttonBg: 'linear-gradient(to bottom, #ece9d8, #d4d0c8)',
                    buttonHoverBg: 'linear-gradient(to bottom, #f5f2e9, #e4e1d8)',
                    buttonActiveBg: 'linear-gradient(to bottom, #d4d0c8, #ece9d8)',
                    desktopBg: 'linear-gradient(45deg, #5A8BB0, #3D6B99)',
                    menuBg: '#ece9d8',
                    menuHoverBg: '#316AC5',
                    menuText: '#333333',
                    menuHoverText: 'white',
                    systemTrayBg: '#ece9d8',
                    clockBg: '#ece9d8',
                    clockText: '#333333',
                    iconText: 'white',
                    iconTextShadow: 'rgba(0,0,0,0.8)'
                }
            },
            lunaRed: {
                name: 'Luna Red',
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #9B3519, #9C4F3A)',
                    taskbarBorder: '#ffffff',
                    windowBg: '#ece9d8',
                    windowBorder: '#BD4B4B',
                    titlebarBg: 'linear-gradient(to right, #943331, #C2644A)',
                    titlebarInactive: 'linear-gradient(to right, #B06B69, #D7A192)',
                    buttonBg: 'linear-gradient(to bottom, #ece9d8, #d4d0c8)',
                    buttonHoverBg: 'linear-gradient(to bottom, #f5f2e9, #e4e1d8)',
                    buttonActiveBg: 'linear-gradient(to bottom, #d4d0c8, #ece9d8)',
                    desktopBg: 'linear-gradient(45deg, #902204, #79463C)',
                    menuBg: '#ece9d8',
                    menuHoverBg: '#943331',
                    menuText: '#333333',
                    menuHoverText: 'white',
                    systemTrayBg: '#ece9d8',
                    clockBg: '#ece9d8',
                    clockText: '#333333',
                    iconText: 'white',
                    iconTextShadow: 'rgba(81 78 78 / 0.8)'
                }
            },
            lunaPink: {
                name: 'Luna Pink',
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #9B1953, #B04C7C)',
                    taskbarBorder: '#ffffff',
                    windowBg: '#ece9d8',
                    windowBorder: '#BD4B84',
                    titlebarBg: 'linear-gradient(to right, #94316E, #C24A98)',
                    titlebarInactive: 'linear-gradient(to right, #B06996, #D792BA)',
                    buttonBg: 'linear-gradient(to bottom, #ece9d8, #d4d0c8)',
                    buttonHoverBg: 'linear-gradient(to bottom, #f5f2e9, #e4e1d8)',
                    buttonActiveBg: 'linear-gradient(to bottom, #d4d0c8, #ece9d8)',
                    desktopBg: 'linear-gradient(45deg, #90043E, #793C5A)',
                    menuBg: '#ece9d8',
                    menuHoverBg: '#943166',
                    menuText: '#333333',
                    menuHoverText: 'white',
                    systemTrayBg: '#ece9d8',
                    clockBg: '#ece9d8',
                    clockText: '#333333',
                    iconText: 'white',
                    iconTextShadow: 'rgba(81 78 78 / 0.8)'
                }
            },
            olive: {
                name: 'Luna Olive',
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #627441, #4A5D2A)',
                    taskbarBorder: '#ffffff',
                    windowBg: '#f1efe2',
                    windowBorder: '#627441',
                    titlebarBg: 'linear-gradient(to right, #627441, #7A8F4F)',
                    titlebarInactive: 'linear-gradient(to right, #9AAB7C, #C4D0AA)',
                    buttonBg: 'linear-gradient(to bottom, #f1efe2, #e5e2d0)',
                    buttonHoverBg: 'linear-gradient(to bottom, #f8f6e9, #f1efe2)',
                    buttonActiveBg: 'linear-gradient(to bottom, #e5e2d0, #f1efe2)',
                    desktopBg: 'linear-gradient(45deg, #6B7B47, #52633B)',
                    menuBg: '#f1efe2',
                    menuHoverBg: '#627441',
                    menuText: '#333333',
                    menuHoverText: 'white',
                    systemTrayBg: '#f1efe2',
                    clockBg: '#f1efe2',
                    clockText: '#333333',
                    iconText: 'white',
                    iconTextShadow: 'rgba(0,0,0,0.8)'
                }
            },
            silver: {
                name: 'Luna Silver',
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #94A6C7, #5D6B99)',
                    taskbarBorder: '#ffffff',
                    windowBg: '#f0f0f0',
                    windowBorder: '#94A6C7',
                    titlebarBg: 'linear-gradient(to right, #94A6C7, #B4C7E7)',
                    titlebarInactive: 'linear-gradient(to right, #C0C7D8, #E0E4EC)',
                    buttonBg: 'linear-gradient(to bottom, #f0f0f0, #e0e0e0)',
                    buttonHoverBg: 'linear-gradient(to bottom, #f8f8f8, #e8e8e8)',
                    buttonActiveBg: 'linear-gradient(to bottom, #e0e0e0, #f0f0f0)',
                    desktopBg: 'linear-gradient(45deg, #8A9BB8, #6B7A94)',
                    menuBg: '#f0f0f0',
                    menuHoverBg: '#94A6C7',
                    menuText: '#333333',
                    menuHoverText: 'white',
                    systemTrayBg: '#f0f0f0',
                    clockBg: '#f0f0f0',
                    clockText: '#333333',
                    iconText: 'white',
                    iconTextShadow: 'rgba(0,0,0,0.8)'
                }
            },
            royale: {
                name: 'Royale',
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #2E5C8A, #1F4F7A)',
                    taskbarBorder: '#ffffff',
                    windowBg: '#f7f7f7',
                    windowBorder: '#2E5C8A',
                    titlebarBg: 'linear-gradient(to right, #2E5C8A, #4A7BA7)',
                    titlebarInactive: 'linear-gradient(to right, #7A96DF, #B4C7E7)',
                    buttonBg: 'linear-gradient(to bottom, #f7f7f7, #e7e7e7)',
                    buttonHoverBg: 'linear-gradient(to bottom, #ffffff, #f0f0f0)',
                    buttonActiveBg: 'linear-gradient(to bottom, #e7e7e7, #f7f7f7)',
                    desktopBg: 'linear-gradient(45deg, #1F4F7A, #2E5C8A)',
                    menuBg: '#f7f7f7',
                    menuHoverBg: '#2E5C8A',
                    menuText: '#333333',
                    menuHoverText: 'white',
                    systemTrayBg: '#f7f7f7',
                    clockBg: '#f7f7f7',
                    clockText: '#333333',
                    iconText: 'white',
                    iconTextShadow: 'rgba(0,0,0,0.8)'
                }
            },
            zune: {
                name: 'Zune',
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #1a1a1a, #000000)',
                    taskbarBorder: '#333333',
                    windowBg: '#2d2d2d',
                    windowBorder: '#1a1a1a',
                    titlebarBg: 'linear-gradient(to right, #ff6600, #ff8533)',
                    titlebarInactive: 'linear-gradient(to right, #4d4d4d, #666666)',
                    buttonBg: 'linear-gradient(to bottom, #404040, #2d2d2d)',
                    buttonHoverBg: 'linear-gradient(to bottom, #505050, #404040)',
                    buttonActiveBg: 'linear-gradient(to bottom, #2d2d2d, #404040)',
                    desktopBg: 'linear-gradient(45deg, #0d0d0d, #1a1a1a)',
                    menuBg: '#2d2d2d',
                    menuHoverBg: '#ff6600',
                    menuText: '#ffffff',
                    menuHoverText: 'white',
                    systemTrayBg: '#2d2d2d',
                    clockBg: '#2d2d2d',
                    clockText: '#ffffff',
                    iconText: '#ffffff',
                    iconTextShadow: 'rgba(0,0,0,0.8)'
                }
            }
        };

        this.wallpapers = {
            default: {
                name: 'Default Gradient',
                type: 'gradient',
                value: 'linear-gradient(45deg, #008080, #20B2AA)'
            },
            bliss: {
                name: 'Bliss',
                type: 'gradient',
                value: 'linear-gradient(45deg, #87CEEB, #98FB98)'
            },
            autumn: {
                name: 'Autumn',
                type: 'gradient', 
                value: 'linear-gradient(45deg, #FF8C00, #FF6347)'
            },
            ocean: {
                name: 'Ocean',
                type: 'gradient',
                value: 'linear-gradient(45deg, #006994, #4682B4)'
            },
            sunset: {
                name: 'Sunset',
                type: 'gradient',
                value: 'linear-gradient(45deg, #FF69B4, #FFB6C1)'
            },
            matrix: {
                name: 'Matrix',
                type: 'gradient',
                value: 'linear-gradient(45deg, #000000, #003300)'
            },
            space: {
                name: 'Space',
                type: 'gradient',
                value: 'linear-gradient(45deg, #000428, #004e92)'
            },
            forest: {
                name: 'Forest',
                type: 'gradient',
                value: 'linear-gradient(45deg, #134E5E, #71B280)'
            }
        };
        
        this.customWallpapers = {}; // Store imported images and Paint creations

        this.setupEvents();
        this.loadSavedSettings();
        this.applyTheme();
    }

    setupEvents() {
        // Listen for theme dialog requests (could be triggered from start menu)
        this.eventBus.on('theme.open', () => {
            this.showThemeDialog();
        });

        // Listen for theme changes
        this.eventBus.on('theme.change', (data) => {
            this.setTheme(data.theme);
        });

        // Listen for wallpaper changes
        this.eventBus.on('wallpaper.change', (data) => {
            this.setWallpaper(data.wallpaper);
        });

        // Right-click desktop context menu (for easy access)
        this.setupDesktopContextMenu();

        // Listen for window creation to apply theme
        this.eventBus.on('window.created', () => {
            this.applyThemeToNewElements();
        });
    }

    setupDesktopContextMenu() {
        const desktop = document.getElementById('desktop');
        
        desktop.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e.clientX, e.clientY);
        });

        // Hide context menu on click elsewhere
        document.addEventListener('click', () => {
            this.hideContextMenu();
        });
    }

    showContextMenu(x, y) {
        this.hideContextMenu(); // Remove any existing menu

        const contextMenu = document.createElement('div');
        contextMenu.id = 'desktopContextMenu';
        contextMenu.className = 'context-menu';
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;

        contextMenu.innerHTML = `
            <div class="context-item" onclick="elxaOS.themeService.showThemeDialog()">
                🎨 Personalize
            </div>
            <div class="context-separator"></div>
            <div class="context-item" onclick="elxaOS.themeService.refreshDesktop()">
                🔄 Refresh
            </div>
        `;

        document.body.appendChild(contextMenu);

        // Adjust position if menu goes off screen
        const rect = contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            contextMenu.style.left = `${x - rect.width}px`;
        }
        if (rect.bottom > window.innerHeight - 30) { // Account for taskbar
            contextMenu.style.top = `${y - rect.height}px`;
        }
    }

    hideContextMenu() {
        const contextMenu = document.getElementById('desktopContextMenu');
        if (contextMenu) {
            contextMenu.remove();
        }
    }

    showThemeDialog() {
        this.hideThemeDialog();

        const dialog = document.createElement('div');
        dialog.id = 'themeDialog';
        dialog.className = 'system-dialog theme-dialog';

        const themeOptions = Object.keys(this.themes).map(themeKey => {
            const theme = this.themes[themeKey];
            const isSelected = themeKey === this.currentTheme;
            return `
                <div class="theme-option ${isSelected ? 'selected' : ''}" data-theme="${themeKey}">
                    <div class="theme-preview" style="background: ${theme.colors.titlebarBg};">
                        <div class="theme-preview-window" style="background: ${theme.colors.windowBg}; border-color: ${theme.colors.windowBorder};">
                            <div class="theme-preview-titlebar" style="background: ${theme.colors.titlebarBg};"></div>
                        </div>
                    </div>
                    <div class="theme-name">${theme.name}</div>
                </div>
            `;
        }).join('');

        // Combine built-in and custom wallpapers
        const allWallpapers = { ...this.wallpapers, ...this.customWallpapers };
        const wallpaperOptions = Object.keys(allWallpapers).map(wallpaperKey => {
            const wallpaper = allWallpapers[wallpaperKey];
            const isSelected = wallpaperKey === this.currentWallpaper;
            
            let previewStyle;
            if (wallpaper.type === 'image') {
                previewStyle = `background-image: url(${wallpaper.value}); background-size: cover; background-position: center;`;
            } else {
                previewStyle = `background: ${wallpaper.value};`;
            }
            
            return `
                <div class="wallpaper-option ${isSelected ? 'selected' : ''}" data-wallpaper="${wallpaperKey}">
                    <div class="wallpaper-preview" style="${previewStyle}"></div>
                    <div class="wallpaper-name">${wallpaper.name}</div>
                    ${wallpaper.custom ? '<div class="custom-badge">Custom</div>' : ''}
                </div>
            `;
        }).join('');

        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <div class="dialog-title">🎨 Personalize ElxaOS</div>
                    <div class="dialog-close" onclick="elxaOS.themeService.hideThemeDialog()">×</div>
                </div>
                <div class="dialog-body">
                    <div class="theme-tabs">
                        <div class="theme-tab active" data-tab="themes">Color Schemes</div>
                        <div class="theme-tab" data-tab="wallpapers">Wallpapers</div>
                    </div>
                    
                    <div class="theme-content">
                        <div class="tab-panel active" id="themesPanel">
                            <div class="theme-grid">
                                ${themeOptions}
                            </div>
                        </div>
                        
                        <div class="tab-panel" id="wallpapersPanel">
                            <div class="wallpaper-controls">
                                <button class="import-image-btn">📁 Import Image</button>
                                <button class="browse-paint-btn">🎨 Use Paint File</button>
                            </div>
                            <div class="wallpaper-grid">
                                ${wallpaperOptions}
                            </div>
                        </div>
                    </div>
                    
                    <div class="theme-controls">
                        <button class="apply-btn" onclick="elxaOS.themeService.applySelectedTheme()">Apply</button>
                        <button class="reset-btn" onclick="elxaOS.themeService.resetToDefaults()">Reset</button>
                        <button class="dialog-button" onclick="elxaOS.themeService.hideThemeDialog()">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
        this.setupThemeDialogEvents();
    }

    setupThemeDialogEvents() {
        const dialog = document.getElementById('themeDialog');
        
        // Use event delegation for all dialog events
        dialog.addEventListener('click', (e) => {
            // Tab switching
            if (e.target.classList.contains('theme-tab')) {
                const tabName = e.target.dataset.tab;
                
                // Update tab appearance
                dialog.querySelectorAll('.theme-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                
                // Show correct panel
                dialog.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
                dialog.querySelector(`#${tabName}Panel`).classList.add('active');
            }
            
            // Theme selection
            if (e.target.closest('.theme-option')) {
                const option = e.target.closest('.theme-option');
                dialog.querySelectorAll('.theme-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                
                // Preview the theme immediately
                this.previewTheme(option.dataset.theme);
            }
            
            // Wallpaper selection
            if (e.target.closest('.wallpaper-option')) {
                const option = e.target.closest('.wallpaper-option');
                dialog.querySelectorAll('.wallpaper-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                
                // Preview the wallpaper immediately
                this.previewWallpaper(option.dataset.wallpaper);
            }
            
            // Import image button
            if (e.target.classList.contains('import-image-btn')) {
                e.preventDefault();
                console.log('Import image button clicked!'); // Debug log
                this.showImageImportDialog();
            }
            
            // Browse paint files button
            if (e.target.classList.contains('browse-paint-btn')) {
                e.preventDefault();
                console.log('Browse paint button clicked!'); // Debug log
                this.showPaintFileBrowser();
            }
        });
    }

    previewTheme(themeKey) {
        // Temporarily apply theme for preview
        this.applyThemeColors(this.themes[themeKey]);
    }

    previewWallpaper(wallpaperKey) {
        // Temporarily apply wallpaper for preview
        const allWallpapers = { ...this.wallpapers, ...this.customWallpapers };
        this.applyWallpaper(allWallpapers[wallpaperKey]);
    }

    showImageImportDialog() {
        console.log('showImageImportDialog called'); // Debug log
        
        try {
            const dialog = document.createElement('div');
            dialog.className = 'import-dialog system-dialog';
            dialog.innerHTML = `
                <div class="dialog-content">
                    <div class="dialog-header">
                        <div class="dialog-title">📁 Import Background Image</div>
                        <div class="dialog-close">×</div>
                    </div>
                    <div class="dialog-body">
                        <div class="import-instructions">
                            <p>Select an image file to use as your desktop background:</p>
                            <p class="file-types">Supported: JPG, PNG, GIF, WebP</p>
                        </div>
                        <input type="file" class="image-input" accept="image/*" multiple>
                        <div class="preview-area">
                            <div class="preview-grid"></div>
                        </div>
                        <div class="import-actions">
                            <button class="import-selected-btn" disabled>Import Selected</button>
                            <button class="cancel-btn">Cancel</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);
            console.log('Dialog appended to body'); // Debug log

            // Setup event listeners for this dialog
            const closeBtn = dialog.querySelector('.dialog-close');
            const cancelBtn = dialog.querySelector('.cancel-btn');
            const fileInput = dialog.querySelector('.image-input');
            const previewGrid = dialog.querySelector('.preview-grid');
            const importBtn = dialog.querySelector('.import-selected-btn');
            
            console.log('Found elements:', { closeBtn, cancelBtn, fileInput, previewGrid, importBtn }); // Debug log
            
            let selectedImages = [];

            // Close dialog events
            closeBtn.addEventListener('click', () => {
                console.log('Close button clicked');
                dialog.remove();
            });
            
            cancelBtn.addEventListener('click', () => {
                console.log('Cancel button clicked');
                dialog.remove();
            });

            fileInput.addEventListener('change', (e) => {
                console.log('File input changed', e.target.files);
                const files = Array.from(e.target.files);
                previewGrid.innerHTML = '';
                selectedImages = [];

                files.forEach((file, index) => {
                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const previewItem = document.createElement('div');
                            previewItem.className = 'import-preview-item';
                            previewItem.innerHTML = `
                                <div class="import-preview-image" style="background-image: url(${e.target.result}); background-size: cover; background-position: center;"></div>
                                <div class="import-preview-info">
                                    <div class="image-name">${file.name}</div>
                                    <div class="image-size">${this.formatFileSize(file.size)}</div>
                                </div>
                                <input type="checkbox" class="import-checkbox" data-index="${index}" checked>
                            `;
                            previewGrid.appendChild(previewItem);
                            
                            selectedImages.push({
                                name: file.name,
                                data: e.target.result,
                                size: file.size
                            });
                        };
                        reader.readAsDataURL(file);
                    }
                });

                importBtn.disabled = false;
            });

            importBtn.addEventListener('click', () => {
                console.log('Import button clicked');
                const checkboxes = dialog.querySelectorAll('.import-checkbox:checked');
                let importedCount = 0;

                checkboxes.forEach(checkbox => {
                    const index = parseInt(checkbox.dataset.index);
                    const image = selectedImages[index];
                    if (image) {
                        const wallpaperKey = `custom_${Date.now()}_${index}`;
                        this.customWallpapers[wallpaperKey] = {
                            name: image.name.split('.')[0],
                            type: 'image',
                            value: image.data,
                            custom: true,
                            source: 'imported'
                        };
                        importedCount++;
                    }
                });

                if (importedCount > 0) {
                    this.saveSettings(); // 🔥 Save the new custom wallpapers to localStorage
                    this.showMessage(`Imported ${importedCount} image(s) successfully!`, 'success');
                    this.hideThemeDialog();
                    this.showThemeDialog(); // Refresh dialog to show new wallpapers
                } else {
                    this.showMessage('No images selected for import', 'warning');
                }
                
                dialog.remove();
            });

            // Handle checkbox selection
            previewGrid.addEventListener('change', (e) => {
                if (e.target.classList.contains('import-checkbox')) {
                    const checkedBoxes = dialog.querySelectorAll('.import-checkbox:checked');
                    importBtn.disabled = checkedBoxes.length === 0;
                    importBtn.textContent = checkedBoxes.length > 0 ? 
                        `Import ${checkedBoxes.length} Selected` : 'Import Selected';
                }
            });
            
        } catch (error) {
            console.error('Error in showImageImportDialog:', error);
        }
    }

    showPaintFileBrowser() {
        console.log('showPaintFileBrowser called'); // Debug log
        
        try {
            // Get all image files from the file system that could be Paint creations
            const allImageFiles = this.findImageFiles();
            console.log('Found image files:', allImageFiles); // Debug log
            
            if (allImageFiles.length === 0) {
                this.showMessage('No image files found in the file system', 'info');
                return;
            }

            const dialog = document.createElement('div');
            dialog.className = 'paint-browser-dialog system-dialog';
            dialog.innerHTML = `
                <div class="dialog-content">
                    <div class="dialog-header">
                        <div class="dialog-title">🎨 Use Paint Creation as Background</div>
                        <div class="dialog-close">×</div>
                    </div>
                    <div class="dialog-body">
                        <div class="paint-instructions">
                            <p>Select a Paint creation or image file to use as your background:</p>
                        </div>
                        <div class="paint-files-grid">
                            ${allImageFiles.map((file, index) => `
                                <div class="paint-file-item" data-path="${file.path.join('|')}" data-name="${file.name}">
                                    <div class="paint-file-icon">🖼️</div>
                                    <div class="paint-file-info">
                                        <div class="paint-file-name">${file.name}</div>
                                        <div class="paint-file-location">${file.location}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="paint-actions">
                            <button class="use-paint-btn" disabled>Use as Background</button>
                            <button class="cancel-btn">Cancel</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);
            console.log('Paint dialog appended to body'); // Debug log

            const closeBtn = dialog.querySelector('.dialog-close');
            const cancelBtn = dialog.querySelector('.cancel-btn');
            const paintGrid = dialog.querySelector('.paint-files-grid');
            const useBtn = dialog.querySelector('.use-paint-btn');
            let selectedFile = null;

            // Close dialog events
            closeBtn.addEventListener('click', () => {
                console.log('Paint dialog close clicked');
                dialog.remove();
            });
            
            cancelBtn.addEventListener('click', () => {
                console.log('Paint dialog cancel clicked');
                dialog.remove();
            });

            paintGrid.addEventListener('click', (e) => {
                const fileItem = e.target.closest('.paint-file-item');
                if (fileItem) {
                    console.log('Paint file selected:', fileItem.dataset.name);
                    // Clear previous selection
                    dialog.querySelectorAll('.paint-file-item').forEach(item => 
                        item.classList.remove('selected'));
                    
                    // Select current item
                    fileItem.classList.add('selected');
                    selectedFile = {
                        path: fileItem.dataset.path.split('|'),
                        name: fileItem.dataset.name
                    };
                    useBtn.disabled = false;
                }
            });

            useBtn.addEventListener('click', () => {
                console.log('Use paint file button clicked', selectedFile);
                if (selectedFile) {
                    this.usePaintFileAsBackground(selectedFile);
                }
                dialog.remove();
            });
            
        } catch (error) {
            console.error('Error in showPaintFileBrowser:', error);
        }
    }

    findImageFiles() {
        const imageFiles = [];
        const fileSystem = elxaOS.fileSystem;
        
        // Search through common folders for image files
        const foldersToSearch = [
            ['root', 'Pictures'],
            ['root', 'Desktop'],
            ['root', 'Documents']
        ];

        foldersToSearch.forEach(folderPath => {
            try {
                const contents = fileSystem.listContents(folderPath);
                contents.forEach(item => {
                    if (item.type === 'file' && this.isImageFile(item.name)) {
                        imageFiles.push({
                            name: item.name,
                            path: [...folderPath, item.name],
                            location: folderPath.slice(1).join(' > ')
                        });
                    }
                });
            } catch (e) {
                // Folder doesn't exist or can't be accessed
            }
        });

        return imageFiles;
    }

    isImageFile(filename) {
        const extension = filename.toLowerCase().split('.').pop();
        return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(extension);
    }

    usePaintFileAsBackground(file) {
        console.log('🎨 Loading Paint file as background:', file.name, 'from path:', file.path);
        
        const fileSystem = elxaOS.fileSystem;
        const actualFile = fileSystem.getFile(file.path.slice(0, -1), file.name);
        
        if (!actualFile || !actualFile.content) {
            this.showMessage(`Could not read file: ${file.name}`, 'error');
            console.error('File not found or has no content:', file);
            return;
        }
        
        console.log('📄 File found with content type:', typeof actualFile.content);
        
        if (actualFile.content.startsWith('data:image/')) {
            console.log('✅ Valid image data URL found');
            
            const wallpaperKey = `paint_${Date.now()}`;
            
            this.customWallpapers[wallpaperKey] = {
                name: file.name.split('.')[0],
                type: 'image',
                value: actualFile.content,
                custom: true,
                source: 'paint',
                originalPath: file.path
            };

            // Apply immediately and save settings
            this.setWallpaper(wallpaperKey); // This will auto-save
            this.showMessage(`Now using "${file.name}" as background!`, 'success');
            this.hideThemeDialog();
            this.showThemeDialog();
        } else {
            console.log('⚠️ File content is not a data URL, content preview:', actualFile.content.substring(0, 100));
            
            const wallpaperKey = `paint_${Date.now()}`;
            
            this.customWallpapers[wallpaperKey] = {
                name: file.name.split('.')[0],
                type: 'image',
                value: actualFile.content,
                custom: true,
                source: 'paint',
                originalPath: file.path
            };

            this.setWallpaper(wallpaperKey); // This will auto-save
            this.showMessage(`Attempting to use "${file.name}" as background...`, 'info');
            this.hideThemeDialog();
            this.showThemeDialog();
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    applySelectedTheme() {
        const selectedTheme = document.querySelector('.theme-option.selected');
        const selectedWallpaper = document.querySelector('.wallpaper-option.selected');
        
        if (selectedTheme) {
            this.setTheme(selectedTheme.dataset.theme);
        }
        
        if (selectedWallpaper) {
            this.setWallpaper(selectedWallpaper.dataset.wallpaper);
        }
        
        this.saveSettings();
        this.hideThemeDialog();
        this.showMessage('Theme applied successfully!', 'success');
    }

    setTheme(themeKey) {
        if (this.themes[themeKey]) {
            this.currentTheme = themeKey;
            this.applyTheme();
            this.saveSettings(); // Auto-save when theme changes
            this.eventBus.emit('theme.changed', { theme: themeKey });
        }
    }

    setWallpaper(wallpaperKey) {
        const allWallpapers = { ...this.wallpapers, ...this.customWallpapers };
        if (allWallpapers[wallpaperKey]) {
            this.currentWallpaper = wallpaperKey;
            this.applyWallpaper(allWallpapers[wallpaperKey]);
            this.saveSettings(); // Auto-save when wallpaper changes
            this.eventBus.emit('wallpaper.changed', { wallpaper: wallpaperKey });
        }
    }

    applyTheme() {
        const theme = this.themes[this.currentTheme];
        const allWallpapers = { ...this.wallpapers, ...this.customWallpapers };
        const wallpaper = allWallpapers[this.currentWallpaper];
        
        console.log('🎨 Applying theme:', this.currentTheme, 'with wallpaper:', this.currentWallpaper);
        
        this.applyThemeColors(theme);
        
        if (wallpaper) {
            this.applyWallpaper(wallpaper);
        } else {
            console.warn('⚠️ No wallpaper found for key:', this.currentWallpaper);
            // Apply default wallpaper
            this.applyWallpaper(this.wallpapers.default);
        }
    }

    applyThemeColors(theme) {
        const root = document.documentElement;
        
        // Apply CSS custom properties for theme colors
        Object.keys(theme.colors).forEach(colorKey => {
            root.style.setProperty(`--${colorKey}`, theme.colors[colorKey]);
        });
        
        console.log('🎨 Applied theme colors via CSS custom properties:', theme.colors);

        // Special handling for dark themes - add body class
        if (this.currentTheme === 'zune') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }

        // Force refresh of dynamic elements
        this.applyThemeToNewElements();
    }

    applyThemeToNewElements() {
        // This method handles elements that are created dynamically
        // and may not automatically pick up the CSS custom properties
        
        // Update any elements that have specific theme requirements
        const theme = this.themes[this.currentTheme];
        if (!theme) return;

        // Update window titlebars that exist now
        document.querySelectorAll('.window-titlebar').forEach(titlebar => {
            const window = titlebar.closest('.window');
            if (window) {
                if (window.classList.contains('active')) {
                    titlebar.style.background = theme.colors.titlebarBg;
                } else {
                    titlebar.style.background = theme.colors.titlebarInactive;
                }
            }
        });
    }

    applyWallpaper(wallpaper) {
        console.log('🖼️ Applying wallpaper:', wallpaper);
        
        const desktop = document.querySelector('.desktop');
        let wallpaperElement = document.querySelector('.desktop-wallpaper');
        
        // Create wallpaper element if it doesn't exist
        if (!wallpaperElement && desktop) {
            wallpaperElement = document.createElement('div');
            wallpaperElement.className = 'desktop-wallpaper';
            desktop.appendChild(wallpaperElement);
            console.log('✨ Created wallpaper element');
        }
        
        // Use wallpaper element if available, otherwise fall back to desktop
        const target = wallpaperElement || desktop;
        
        if (!target) {
            console.error('❌ No target element found for wallpaper application');
            return;
        }
        
        console.log('🎯 Target element:', target.className || target.tagName);
        
        if (wallpaper.type === 'gradient') {
            console.log('🎨 Applying gradient wallpaper:', wallpaper.value);
            
            // Clear any existing background image
            target.style.backgroundImage = '';
            
            // Apply the gradient
            target.style.background = wallpaper.value;
            
            // Reset other background properties
            target.style.backgroundSize = '';
            target.style.backgroundPosition = '';
            target.style.backgroundRepeat = '';
            
            console.log('✅ Gradient applied');
            
        } else if (wallpaper.type === 'image') {
            console.log('🖼️ Applying image wallpaper');
            
            // Clear any existing background gradient
            target.style.background = '';
            
            // Apply the image
            target.style.backgroundImage = `url(${wallpaper.value})`;
            target.style.backgroundSize = 'cover';
            target.style.backgroundPosition = 'center';
            target.style.backgroundRepeat = 'no-repeat';
            
            console.log('✅ Image applied');
        }
        
        // Force repaint
        target.offsetHeight;
    }

    // NEW METHOD: Clear theme settings (for testing)
    clearThemeSettings() {
        localStorage.removeItem('elxaOS-theme-settings');
        console.log('🗑️ Theme settings cleared');
    }

    // UPDATED resetToDefaults method - now saves the reset
    resetToDefaults() {
        this.currentTheme = 'classic';
        this.currentWallpaper = 'default';
        this.customWallpapers = {}; // Clear custom wallpapers too
        this.applyTheme();
        this.saveSettings(); // 🔥 Save the reset
        this.hideThemeDialog();
        this.showMessage('Reset to default theme', 'info');
    }

    refreshDesktop() {
        // Simple desktop refresh - could reload icons, etc.
        this.showMessage('Desktop refreshed', 'info');
        this.eventBus.emit('desktop.refresh');
    }

    hideThemeDialog() {
        const dialog = document.getElementById('themeDialog');
        if (dialog) {
            dialog.remove();
        }
    }

    saveSettings() {
        try {
            const settingsToSave = {
                theme: this.currentTheme,
                wallpaper: this.currentWallpaper,
                customWallpapers: this.customWallpapers // Save custom wallpapers too!
            };
            
            localStorage.setItem('elxaOS-theme-settings', JSON.stringify(settingsToSave));
            console.log('🎨 Theme settings saved to localStorage:', settingsToSave);
        } catch (error) {
            console.error('❌ Failed to save theme settings:', error);
        }
    }

    loadSavedSettings() {
        try {
            const saved = localStorage.getItem('elxaOS-theme-settings');
            if (saved) {
                const settings = JSON.parse(saved);
                
                // Load theme and wallpaper
                this.currentTheme = settings.theme || 'classic';
                this.currentWallpaper = settings.wallpaper || 'default';
                
                // Load custom wallpapers (imported images, Paint creations, etc.)
                if (settings.customWallpapers) {
                    this.customWallpapers = settings.customWallpapers;
                }
                
                console.log('🎨 Theme settings loaded from localStorage:', settings);
            } else {
                console.log('🎨 No saved theme settings found, using defaults');
            }
        } catch (error) {
            console.error('❌ Failed to load theme settings:', error);
            // Fallback to defaults if loading fails
            this.currentTheme = 'classic';
            this.currentWallpaper = 'default';
        }
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
        `;

        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    // API methods for other services
    getCurrentTheme() {
        return {
            name: this.themes[this.currentTheme].name,
            key: this.currentTheme,
            colors: this.themes[this.currentTheme].colors
        };
    }

    getCurrentWallpaper() {
        const allWallpapers = { ...this.wallpapers, ...this.customWallpapers };
        const wallpaper = allWallpapers[this.currentWallpaper];
        return {
            name: wallpaper.name,
            key: this.currentWallpaper,
            value: wallpaper.value,
            type: wallpaper.type,
            custom: wallpaper.custom || false
        };
    }

    // Debug methods
    listThemes() {
        return Object.keys(this.themes);
    }

    listWallpapers() {
        return Object.keys(this.wallpapers);
    }
}