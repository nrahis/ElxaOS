// =================================
// VIRUS LAB PROGRAM - Kid Hacker Edition! 🔥
// =================================
class VirusLabProgram {
    constructor(windowManager, fileSystem, eventBus) {
        this.windowManager = windowManager;
        this.fileSystem = fileSystem;
        this.eventBus = eventBus;
        this.currentWindowId = null;
        this.currentVirus = null;
        this.savedViruses = new Map();
        this.targetList = ['Liz', 'Colten', 'Mom', 'Dad', 'Uncle Randy', 'Aunt Angel', 'Granddaddy', 'Teacher', 'Classmate'];
        
        this.loadSavedViruses();
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // Listen for virus creation events
        this.eventBus.on('viruslab.create', (data) => {
            this.createCustomVirus(data);
        });
    }

    launch() {
        const windowId = `viruslab-${Date.now()}`;
        this.currentWindowId = windowId;
        
        const windowContent = this.createVirusLabInterface(windowId);
        
        this.windowManager.createWindow(
            windowId,
            '👨‍💻 Virus Lab - Hacker Edition',
            windowContent,
            { width: '800px', height: '600px', x: '100px', y: '50px' }
        );
        
        setTimeout(() => {
            this.setupWindowEventHandlers(windowId);
            this.populateImageList(windowId);
            this.populateSavedViruses(windowId);
        }, 100);
        
        return windowId;
    }

    createVirusLabInterface(windowId) {
        return `
            <div class="virus-lab-container" data-window-id="${windowId}">
                <!-- Cool Hacker Header -->
                <div class="vlab-hacker-header">
                    <div class="vlab-logo">
                        <div class="vlab-skull-icon">💀</div>
                        <div class="vlab-info">
                            <h2>VIRUS LAB</h2>
                            <span class="vlab-tag">Elite Hacker Edition v3.37</span>
                        </div>
                    </div>
                    <div class="vlab-status">
                        <div class="vlab-status-text">🔥 READY TO HACK 🔥</div>
                        <div class="vlab-matrix-effect" id="matrix-${windowId}"></div>
                    </div>
                </div>

                <!-- Navigation Tabs -->
                <div class="vlab-nav">
                    <button class="vlab-tab active" data-tab="create" data-window="${windowId}">🧪 Create Virus</button>
                    <button class="vlab-tab" data-tab="test" data-window="${windowId}">🔬 Test Lab</button>
                    <button class="vlab-tab" data-tab="send" data-window="${windowId}">📡 Send Attack</button>
                    <button class="vlab-tab" data-tab="gallery" data-window="${windowId}">💾 My Viruses</button>
                </div>

                <!-- Content Area -->
                <div class="vlab-content">
                    <!-- Create Tab -->
                    <div class="vlab-tab-content active" id="create-tab-${windowId}">
                        <div class="vlab-create-interface">
                            <div class="vlab-create-form">
                                <h3>🧪 Design Your Virus</h3>
                                
                                <div class="vlab-form-row">
                                    <div class="vlab-form-group">
                                        <label>💀 Virus Name:</label>
                                        <input type="text" id="virus-name-${windowId}" placeholder="SuperCoolVirus" maxlength="20">
                                    </div>
                                    <div class="vlab-form-group">
                                        <label>👤 Created By:</label>
                                        <input type="text" id="virus-author-${windowId}" placeholder="Elite Hacker" maxlength="15">
                                    </div>
                                </div>

                                <div class="vlab-form-group">
                                    <label>📝 Evil Description:</label>
                                    <textarea id="virus-description-${windowId}" placeholder="This virus will totally prank everyone!" maxlength="100"></textarea>
                                </div>

                                <div class="vlab-form-row">
                                    <div class="vlab-form-group">
                                        <label>🎯 Target Victim:</label>
                                        <select id="virus-target-${windowId}">
                                            <option value="">Choose your target...</option>
                                            ${this.targetList.map(target => `<option value="${target}">${target}</option>`).join('')}
                                            <option value="custom">🎭 Custom Target</option>
                                        </select>
                                        <input type="text" id="custom-target-${windowId}" placeholder="Enter custom target" style="display:none;" maxlength="15">
                                    </div>
                                    <div class="vlab-form-group">
                                        <label>⚡ Danger Level:</label>
                                        <select id="virus-severity-${windowId}">
                                            <option value="low">🟢 Harmless Prank</option>
                                            <option value="medium">🟡 Annoying Bug</option>
                                            <option value="high">🔴 Super Dangerous!</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="vlab-form-group">
                                    <label>🎨 Virus Type:</label>
                                    <div class="vlab-virus-types">
                                        <div class="vlab-type-option" data-type="image">
                                            <div class="vlab-type-icon">🖼️</div>
                                            <div class="vlab-type-name">Image Bomber</div>
                                            <div class="vlab-type-desc">Shows funny pictures</div>
                                        </div>
                                        <div class="vlab-type-option" data-type="popup">
                                            <div class="vlab-type-icon">💥</div>
                                            <div class="vlab-type-name">Popup Storm</div>
                                            <div class="vlab-type-desc">Lots of silly popups</div>
                                        </div>
                                        <div class="vlab-type-option" data-type="message">
                                            <div class="vlab-type-icon">💬</div>
                                            <div class="vlab-type-name">Message Spammer</div>
                                            <div class="vlab-type-desc">Sends funny messages</div>
                                        </div>
                                        <div class="vlab-type-option" data-type="screen">
                                            <div class="vlab-type-icon">📺</div>
                                            <div class="vlab-type-name">Screen Effect</div>
                                            <div class="vlab-type-desc">Cool screen effects</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Image Selection (for image type) -->
                                <div class="vlab-image-selection" id="image-selection-${windowId}" style="display:none;">
                                    <label>🖼️ Choose Images: <small>(Select multiple for variety!)</small></label>
                                    <div class="vlab-image-grid" id="image-grid-${windowId}">
                                        <!-- Images will be populated here -->
                                    </div>
                                </div>

                                <!-- Color Selection -->
                                <div class="vlab-form-group">
                                    <label>🌈 Virus Colors:</label>
                                    <div class="vlab-color-picker-grid">
                                        <div class="vlab-color-option" data-color="#ff0000" style="background:#ff0000"></div>
                                        <div class="vlab-color-option" data-color="#00ff00" style="background:#00ff00"></div>
                                        <div class="vlab-color-option" data-color="#0000ff" style="background:#0000ff"></div>
                                        <div class="vlab-color-option" data-color="#ffff00" style="background:#ffff00"></div>
                                        <div class="vlab-color-option" data-color="#ff00ff" style="background:#ff00ff"></div>
                                        <div class="vlab-color-option" data-color="#00ffff" style="background:#00ffff"></div>
                                        <div class="vlab-color-option" data-color="#ff8800" style="background:#ff8800"></div>
                                        <div class="vlab-color-option" data-color="#8800ff" style="background:#8800ff"></div>
                                    </div>
                                </div>

                                <!-- Custom Messages (for popup/message types) -->
                                <div class="vlab-custom-messages" id="custom-messages-${windowId}" style="display:none;">
                                    <label>💬 Custom Messages:</label>
                                    <div class="vlab-message-inputs" id="message-inputs-${windowId}">
                                        <input type="text" placeholder="Message 1" maxlength="50">
                                        <input type="text" placeholder="Message 2" maxlength="50">
                                        <input type="text" placeholder="Message 3" maxlength="50">
                                    </div>
                                    <button type="button" class="vlab-add-message-btn" id="add-message-${windowId}">
                                        ➕ Add Another Message
                                    </button>
                                </div>

                                <div class="vlab-create-actions">
                                    <button class="vlab-create-virus-btn" id="create-virus-${windowId}">
                                        🧪 CREATE VIRUS
                                    </button>
                                    <button class="vlab-preview-virus-btn" id="preview-virus-${windowId}">
                                        👁️ Preview
                                    </button>
                                </div>
                            </div>

                            <div class="vlab-virus-preview" id="virus-preview-${windowId}">
                                <h3>🔍 Virus Preview</h3>
                                <div class="vlab-preview-content">
                                    <div class="vlab-preview-placeholder">
                                        <div class="vlab-placeholder-icon">🦠</div>
                                        <div class="vlab-placeholder-text">Create a virus to see preview!</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Test Tab -->
                    <div class="vlab-tab-content" id="test-tab-${windowId}">
                        <div class="vlab-test-interface">
                            <h3>🔬 Virus Testing Chamber</h3>
                            <div class="vlab-test-chamber">
                                <div class="vlab-chamber-display" id="test-display-${windowId}">
                                    <div class="vlab-chamber-icon">🧪</div>
                                    <div class="vlab-chamber-text">Select a virus to test!</div>
                                </div>
                                <div class="vlab-test-controls">
                                    <select id="test-virus-select-${windowId}">
                                        <option value="">Choose virus to test...</option>
                                    </select>
                                    <button class="vlab-test-btn" id="test-virus-${windowId}">
                                        🚀 TEST VIRUS
                                    </button>
                                    <button class="vlab-stop-test-btn" id="stop-test-${windowId}">
                                        🛑 STOP TEST
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Send Tab -->
                    <div class="vlab-tab-content" id="send-tab-${windowId}">
                        <div class="vlab-send-interface">
                            <h3>📡 Hacker Attack Center</h3>
                            <div class="vlab-attack-center">
                                <div class="vlab-target-selection">
                                    <h4>🎯 Select Target</h4>
                                    <div class="vlab-target-grid">
                                        ${this.targetList.map(target => `
                                            <div class="vlab-target-card" data-target="${target}">
                                                <div class="vlab-target-avatar">${this.getTargetAvatar(target)}</div>
                                                <div class="vlab-target-name">${target}</div>
                                                <div class="vlab-target-status">🟢 Online</div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                                
                                <div class="vlab-virus-selection">
                                    <h4>💀 Choose Your Weapon</h4>
                                    <select id="attack-virus-select-${windowId}">
                                        <option value="">Select virus...</option>
                                    </select>
                                </div>

                                <div class="vlab-attack-preview" id="attack-preview-${windowId}">
                                    <div class="vlab-preview-placeholder">
                                        Select target and virus to preview attack!
                                    </div>
                                </div>

                                <div class="vlab-attack-controls">
                                    <button class="vlab-launch-attack-btn" id="launch-attack-${windowId}">
                                        🚀 LAUNCH ATTACK!
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Gallery Tab -->
                    <div class="vlab-tab-content" id="gallery-tab-${windowId}">
                        <div class="vlab-gallery-interface">
                            <h3>💾 My Virus Collection</h3>
                            <div class="vlab-virus-gallery" id="virus-gallery-${windowId}">
                                <!-- Saved viruses will be populated here -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="vlab-footer">
                    <div class="vlab-footer-text">
                        <span>🔥 Elite Hacker Status: ACTIVE</span>
                        <span>💀 Viruses Created: <span id="virus-count-${windowId}">0</span></span>
                        <span>🎯 Successful Attacks: <span id="attack-count-${windowId}">0</span></span>
                    </div>
                </div>
            </div>
        `;
    }

    setupWindowEventHandlers(windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        if (!container) return;

        // Tab navigation
        container.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            // Handle tab navigation
            if (target.classList.contains('vlab-tab')) {
                this.switchTab(target.dataset.tab, windowId);
                return;
            }

            const id = target.id;

            // Handle all button clicks
            if (id.includes('create-virus')) {
                this.createVirus(windowId);
            } else if (id.includes('preview-virus')) {
                this.previewVirus(windowId);
            } else if (id.includes('test-virus')) {
                this.testVirus(windowId);
            } else if (id.includes('stop-test')) {
                this.stopTest(windowId);
            } else if (id.includes('launch-attack')) {
                this.launchAttack(windowId);
            } else if (id.includes('add-message')) {
                this.addMessageInput(windowId);
            }
        });

        // Handle virus type selection
        container.addEventListener('click', (e) => {
            if (e.target.closest('.vlab-type-option')) {
                const typeOption = e.target.closest('.vlab-type-option');
                container.querySelectorAll('.vlab-type-option').forEach(opt => opt.classList.remove('selected'));
                typeOption.classList.add('selected');
                
                const virusType = typeOption.dataset.type;
                this.handleVirusTypeChange(virusType, windowId);
            }
        });

        // Handle color selection
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('vlab-color-option')) {
                container.querySelectorAll('.vlab-color-option').forEach(opt => opt.classList.remove('selected'));
                e.target.classList.add('selected');
            }
        });

        // Handle target selection in attack tab
        container.addEventListener('click', (e) => {
            if (e.target.closest('.vlab-target-card')) {
                const targetCard = e.target.closest('.vlab-target-card');
                container.querySelectorAll('.vlab-target-card').forEach(card => card.classList.remove('selected'));
                targetCard.classList.add('selected');
                this.updateAttackPreview(windowId);
            }
        });

        // Handle remove message button clicks
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('vlab-remove-message-btn')) {
                const messageContainer = e.target.closest('.vlab-message-input-container');
                if (messageContainer) {
                    messageContainer.remove();
                }
            }
        });

        // Handle custom target input
        const targetSelect = container.querySelector(`#virus-target-${windowId}`);
        const customTargetInput = container.querySelector(`#custom-target-${windowId}`);
        
        if (targetSelect && customTargetInput) {
            targetSelect.addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    customTargetInput.style.display = 'block';
                    customTargetInput.focus();
                } else {
                    customTargetInput.style.display = 'none';
                }
            });
        }

        // Handle virus selection change in attack tab
        const attackVirusSelect = container.querySelector(`#attack-virus-select-${windowId}`);
        if (attackVirusSelect) {
            attackVirusSelect.addEventListener('change', () => {
                this.updateAttackPreview(windowId);
            });
        }

        // Start matrix effect
        this.startMatrixEffect(windowId);
    }

    switchTab(tabName, windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        if (!container) return;

        // Update nav tabs
        container.querySelectorAll('.vlab-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update content tabs
        container.querySelectorAll('.vlab-tab-content').forEach(content => {
            content.classList.remove('active');
        });

        const targetTab = container.querySelector(`#${tabName}-tab-${windowId}`);
        if (targetTab) {
            targetTab.classList.add('active');
        }

        // Refresh specific tab content
        if (tabName === 'test') {
            this.updateTestVirusList(windowId);
        } else if (tabName === 'send') {
            this.updateAttackVirusList(windowId);
        } else if (tabName === 'gallery') {
            this.populateSavedViruses(windowId);
        }
    }

    handleVirusTypeChange(virusType, windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        if (!container) return;

        const imageSelection = container.querySelector(`#image-selection-${windowId}`);
        const customMessages = container.querySelector(`#custom-messages-${windowId}`);

        // Hide all type-specific options
        if (imageSelection) imageSelection.style.display = 'none';
        if (customMessages) customMessages.style.display = 'none';

        // Show relevant options based on type
        if (virusType === 'image' && imageSelection) {
            imageSelection.style.display = 'block';
        } else if ((virusType === 'popup' || virusType === 'message') && customMessages) {
            customMessages.style.display = 'block';
        }
    }

    populateImageList(windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        const imageGrid = container?.querySelector(`#image-grid-${windowId}`);
        if (!imageGrid) return;

        // List of available hacker images
        const images = [
            { name: 'hack1.png', icon: '🔥' },
            { name: 'hack2.png', icon: '💀' },
            { name: 'hack3.png', icon: '👾' },
            { name: 'virus.png', icon: '🦠' },
            { name: 'skull.png', icon: '💀' },
            { name: 'explosion.png', icon: '💥' },
            { name: 'matrix.png', icon: '🔢' },
            { name: 'warning.png', icon: '⚠️' }
        ];

        imageGrid.innerHTML = images.map(img => `
            <div class="vlab-image-option" data-image="${img.name}">
                <div class="vlab-image-preview">
                    <img src="assets/hack/${img.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                    <div class="vlab-image-fallback" style="display:none;">
                        <div class="vlab-fallback-icon">${img.icon}</div>
                        <div class="vlab-fallback-name">${img.name}</div>
                    </div>
                </div>
                <div class="vlab-image-name">${img.name}</div>
            </div>
        `).join('');

        // Handle image selection
        imageGrid.addEventListener('click', (e) => {
            const imageOption = e.target.closest('.vlab-image-option');
            if (imageOption) {
                // Allow multiple selection for image type
                imageOption.classList.toggle('selected');
                
                // Update selection count
                const selectedCount = imageGrid.querySelectorAll('.vlab-image-option.selected').length;
                const label = container.querySelector('#image-selection-' + windowId + ' label');
                if (label) {
                    const baseText = '🖼️ Choose Images: <small>(Select multiple for variety!)</small>';
                    if (selectedCount > 0) {
                        label.innerHTML = `🖼️ Choose Images: <small>(${selectedCount} selected)</small>`;
                    } else {
                        label.innerHTML = baseText;
                    }
                }
            }
        });
    }

    addMessageInput(windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        const messageInputs = container?.querySelector(`#message-inputs-${windowId}`);
        if (!messageInputs) return;

        const currentInputs = messageInputs.querySelectorAll('input, .vlab-message-input-container').length;
        if (currentInputs >= 10) {
            this.showHackerMessage('⚠️ Maximum 10 messages allowed!', 'warning');
            return;
        }

        const newInput = document.createElement('input');
        newInput.type = 'text';
        newInput.placeholder = `Message ${currentInputs + 1}`;
        newInput.maxLength = 50;

        // Add remove button to new inputs (except first 3)
        if (currentInputs >= 3) {
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'vlab-remove-message-btn';
            removeBtn.innerHTML = '❌';
            removeBtn.title = 'Remove this message';
            
            const inputContainer = document.createElement('div');
            inputContainer.className = 'vlab-message-input-container';
            inputContainer.appendChild(newInput);
            inputContainer.appendChild(removeBtn);
            
            messageInputs.appendChild(inputContainer);
        } else {
            messageInputs.appendChild(newInput);
        }
    }

    createVirus(windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        if (!container) return;

        const virusData = this.collectVirusData(container, windowId);
        
        if (!this.validateVirusData(virusData)) {
            this.showHackerMessage('⚠️ Fill out all required fields!', 'warning');
            return;
        }

        // Generate unique virus ID
        const virusId = `custom_virus_${Date.now()}`;
        virusData.id = virusId;
        virusData.created = new Date();

        // Save virus
        this.savedViruses.set(virusId, virusData);
        this.saveVirusesToStorage();

        // Update counts
        this.updateVirusCount(windowId);

        // Show success message
        this.showHackerMessage(`🔥 Virus "${virusData.name}" created successfully!`, 'success');

        // Switch to test tab
        this.switchTab('test', windowId);
    }

    collectVirusData(container, windowId) {
        const getName = (id) => container.querySelector(`#${id}-${windowId}`)?.value || '';
        const getSelected = (selector) => container.querySelector(`${selector}.selected`);

        const targetSelect = container.querySelector(`#virus-target-${windowId}`);
        const customTarget = container.querySelector(`#custom-target-${windowId}`);
        let target = targetSelect?.value || '';
        if (target === 'custom') {
            target = customTarget?.value || 'Unknown Target';
        }

        const selectedType = getSelected('.vlab-type-option');
        const selectedColor = getSelected('.vlab-color-option');
        const selectedImages = Array.from(container.querySelectorAll('.vlab-image-option.selected')).map(img => img.dataset.image);

        // Collect custom messages from both regular inputs and container inputs
        const messageInputs = container.querySelectorAll('#custom-messages-' + windowId + ' input, #custom-messages-' + windowId + ' .vlab-message-input-container input');
        const customMessages = Array.from(messageInputs).map(input => input.value).filter(msg => msg.trim());

        return {
            name: getName('virus-name') || 'Unnamed Virus',
            author: getName('virus-author') || 'Anonymous Hacker',
            description: getName('virus-description') || 'A mysterious virus...',
            target: target,
            severity: getName('virus-severity') || 'medium',
            type: selectedType?.dataset.type || 'popup',
            color: selectedColor?.dataset.color || '#ff0000',
            images: selectedImages,
            customMessages: customMessages
        };
    }

    validateVirusData(data) {
        return data.name && data.author && data.description && data.type;
    }

    previewVirus(windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        if (!container) return;

        const virusData = this.collectVirusData(container, windowId);
        const previewContent = container.querySelector(`#virus-preview-${windowId} .vlab-preview-content`);
        
        if (!previewContent) return;

        previewContent.innerHTML = `
            <div class="vlab-virus-card" style="border-color: ${virusData.color};">
                <div class="vlab-virus-header" style="background: ${virusData.color};">
                    <div class="vlab-virus-icon">${this.getVirusIcon(virusData.type)}</div>
                    <div class="vlab-virus-title">${virusData.name}</div>
                </div>
                <div class="vlab-virus-info">
                    <div class="vlab-info-row">
                        <span class="label">Author:</span>
                        <span class="value">${virusData.author}</span>
                    </div>
                    <div class="vlab-info-row">
                        <span class="label">Target:</span>
                        <span class="value">${virusData.target || 'No target selected'}</span>
                    </div>
                    <div class="vlab-info-row">
                        <span class="label">Danger:</span>
                        <span class="value">${this.getSeverityText(virusData.severity)}</span>
                    </div>
                    <div class="vlab-info-row">
                        <span class="label">Type:</span>
                        <span class="value">${this.getTypeText(virusData.type)}</span>
                    </div>
                    ${virusData.type === 'image' && virusData.images.length > 0 ? `
                    <div class="vlab-info-row">
                        <span class="label">Images:</span>
                        <span class="value">${virusData.images.length} selected</span>
                    </div>` : ''}
                    ${(virusData.type === 'popup' || virusData.type === 'message') && virusData.customMessages.length > 0 ? `
                    <div class="vlab-info-row">
                        <span class="label">Messages:</span>
                        <span class="value">${virusData.customMessages.length} custom</span>
                    </div>` : ''}
                    <div class="vlab-virus-description">${virusData.description}</div>
                </div>
            </div>
        `;
    }

    testVirus(windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        const virusSelect = container?.querySelector(`#test-virus-select-${windowId}`);
        
        if (!virusSelect?.value) {
            this.showHackerMessage('⚠️ Select a virus to test!', 'warning');
            return;
        }

        const virusData = this.savedViruses.get(virusSelect.value);
        if (!virusData) return;

        this.showHackerMessage(`🚀 Testing ${virusData.name}...`, 'info');
        
        // Create test virus effect
        this.createTestEffect(virusData);
    }

    createTestEffect(virusData) {
        // Remove any existing test effects
        document.querySelectorAll('.vlab-test-virus-effect').forEach(el => el.remove());

        const effect = document.createElement('div');
        effect.className = 'vlab-test-virus-effect';
        
        switch (virusData.type) {
            case 'image':
                this.createImageEffect(effect, virusData);
                break;
            case 'popup':
                this.createPopupEffect(effect, virusData);
                break;
            case 'message':
                this.createMessageEffect(effect, virusData);
                break;
            case 'screen':
                this.createScreenEffect(effect, virusData);
                break;
        }

        document.body.appendChild(effect);

        // Auto-remove after 15 seconds
        setTimeout(() => {
            if (effect.parentNode) effect.remove();
        }, 15000);
    }

    createImageEffect(effect, virusData) {
        if (!virusData.images || virusData.images.length === 0) {
            virusData.images = ['hack1.png']; // Default fallback
        }

        let imageCount = 0;
        const maxImages = Math.min(virusData.images.length * 2, 6); // Show each image up to 2 times, max 6 total

        const showRandomImage = () => {
            if (imageCount >= maxImages) return;

            const randomImage = virusData.images[Math.floor(Math.random() * virusData.images.length)];
            const imageElement = document.createElement('div');
            imageElement.className = 'vlab-test-image-popup';
            imageElement.innerHTML = `
                <div class="vlab-test-image-overlay" style="border-color: ${virusData.color};">
                    <div class="vlab-test-image-content">
                        <img src="assets/hack/${randomImage}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                        <div class="vlab-image-fallback" style="display:none;">
                            <div class="vlab-fallback-icon">${this.getVirusIcon(virusData.type)}</div>
                            <div class="vlab-fallback-text">${virusData.name}</div>
                        </div>
                        <div class="vlab-test-label" style="background: ${virusData.color};">
                            TEST: ${virusData.name} (${imageCount + 1}/${maxImages})
                        </div>
                        <button class="vlab-image-close-btn" style="background: ${virusData.color};">×</button>
                    </div>
                </div>
            `;

            // Random position
            const x = Math.random() * (window.innerWidth - 300);
            const y = Math.random() * (window.innerHeight - 300);
            imageElement.style.position = 'fixed';
            imageElement.style.left = x + 'px';
            imageElement.style.top = y + 'px';
            imageElement.style.zIndex = '5000';

            effect.appendChild(imageElement);

            // Close button functionality
            const closeBtn = imageElement.querySelector('.vlab-image-close-btn');
            closeBtn.addEventListener('click', () => {
                imageElement.remove();
            });

            // Auto-remove after random time
            setTimeout(() => {
                if (imageElement.parentNode) {
                    imageElement.remove();
                }
            }, Math.random() * 8000 + 5000); // 5-13 seconds

            imageCount++;
            
            // Schedule next image
            if (imageCount < maxImages) {
                setTimeout(showRandomImage, Math.random() * 3000 + 2000); // 2-5 seconds between images
            }
        };

        showRandomImage();
    }

    createPopupEffect(effect, virusData) {
        const messages = virusData.customMessages.length > 0 ? virusData.customMessages : [
            `${virusData.target}, you've been hacked by ${virusData.author}!`,
            `The ${virusData.name} virus is taking over!`,
            `This is just a test... or is it? 😈`
        ];

        let popupCount = 0;
        const maxPopups = Math.min(messages.length * 2, 8); // Show each message up to 2 times, max 8 total

        const showPopup = () => {
            if (popupCount >= maxPopups) return;

            const popup = document.createElement('div');
            popup.className = 'vlab-test-popup';
            popup.innerHTML = `
                <div class="vlab-popup-content" style="border-color: ${virusData.color};">
                    <div class="vlab-popup-header" style="background: ${virusData.color};">
                        <span>💀 ${virusData.name}</span>
                        <button class="vlab-popup-close">×</button>
                    </div>
                    <div class="vlab-popup-body">
                        <div class="vlab-popup-icon">${this.getVirusIcon(virusData.type)}</div>
                        <div class="vlab-popup-message">${messages[popupCount % messages.length]}</div>
                        <div class="vlab-popup-test-label">🧪 TEST MODE (${popupCount + 1}/${maxPopups})</div>
                    </div>
                </div>
            `;

            // Random position
            const x = Math.random() * (window.innerWidth - 350);
            const y = Math.random() * (window.innerHeight - 200);
            popup.style.left = x + 'px';
            popup.style.top = y + 'px';

            effect.appendChild(popup);

            // Close button
            popup.querySelector('.vlab-popup-close').addEventListener('click', () => {
                popup.remove();
            });

            popupCount++;
            if (popupCount < maxPopups) {
                setTimeout(showPopup, 2000);
            }
        };

        showPopup();
    }

    createMessageEffect(effect, virusData) {
        const messages = virusData.customMessages.length > 0 ? virusData.customMessages : [
            `Message from ${virusData.author}: You've been pranked!`,
            `${virusData.name} says: ${virusData.description}`,
            `This message will self-destruct in 5 seconds...`
        ];

        effect.innerHTML = `
            <div class="vlab-test-message-banner" style="background: ${virusData.color};">
                <div class="vlab-message-content">
                    <div class="vlab-message-icon">${this.getVirusIcon(virusData.type)}</div>
                    <div class="vlab-message-text" id="message-text"></div>
                    <div class="vlab-test-indicator">🧪 TEST</div>
                </div>
            </div>
        `;

        const messageText = effect.querySelector('#message-text');
        let messageIndex = 0;

        const cycleMessages = () => {
            messageText.textContent = messages[messageIndex % messages.length];
            messageIndex++;
            
            if (messageIndex < messages.length * 3) { // Show each message 3 times
                setTimeout(cycleMessages, 3000);
            }
        };

        cycleMessages();
    }

    createScreenEffect(effect, virusData) {
        effect.innerHTML = `
            <div class="vlab-test-screen-effect" style="background: linear-gradient(45deg, ${virusData.color}33, transparent);">
                <div class="vlab-effect-content">
                    <div class="vlab-glitch-text" style="color: ${virusData.color};">
                        ${virusData.name.toUpperCase()}
                    </div>
                    <div class="vlab-effect-subtitle">
                        Created by ${virusData.author}
                    </div>
                    <div class="vlab-test-watermark">🧪 TEST MODE 🧪</div>
                </div>
            </div>
        `;

        // Add glitch animation class
        setTimeout(() => {
            effect.querySelector('.vlab-glitch-text')?.classList.add('vlab-glitch-animation');
        }, 500);
    }

    stopTest(windowId) {
        document.querySelectorAll('.vlab-test-virus-effect').forEach(el => el.remove());
        this.showHackerMessage('🛑 Test stopped!', 'info');
    }

    launchAttack(windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        const selectedTarget = container?.querySelector('.vlab-target-card.selected');
        const virusSelect = container?.querySelector(`#attack-virus-select-${windowId}`);
        
        if (!selectedTarget || !virusSelect?.value) {
            this.showHackerMessage('⚠️ Select target and virus!', 'warning');
            return;
        }

        const target = selectedTarget.dataset.target;
        const virusData = this.savedViruses.get(virusSelect.value);
        
        if (!virusData) return;

        // Show attack sequence
        this.showAttackSequence(target, virusData, windowId);
    }

    showAttackSequence(target, virusData, windowId) {
        const attack = document.createElement('div');
        attack.className = 'vlab-attack-sequence';
        attack.innerHTML = `
            <div class="vlab-attack-overlay">
                <div class="vlab-attack-terminal">
                    <div class="vlab-terminal-header">
                        <span>🔥 HACKER TERMINAL 🔥</span>
                        <button class="vlab-terminal-close">×</button>
                    </div>
                    <div class="vlab-terminal-content">
                        <div class="vlab-terminal-line">Initializing attack...</div>
                        <div class="vlab-terminal-line">Target: ${target}</div>
                        <div class="vlab-terminal-line">Weapon: ${virusData.name}</div>
                        <div class="vlab-terminal-line">Status: <span class="vlab-status-text">CONNECTING...</span></div>
                        <div class="vlab-progress-bar">
                            <div class="vlab-progress-fill"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(attack);

        // Close button
        attack.querySelector('.vlab-terminal-close').addEventListener('click', () => {
            attack.remove();
        });

        // Simulate attack progress
        const statusText = attack.querySelector('.vlab-status-text');
        const progressFill = attack.querySelector('.vlab-progress-fill');
        const terminalContent = attack.querySelector('.vlab-terminal-content');

        const steps = [
            'CONNECTING...',
            'BYPASSING FIREWALL...',
            'UPLOADING VIRUS...',
            'INSTALLING PAYLOAD...',
            'ATTACK COMPLETE!'
        ];

        let step = 0;
        const progressAttack = () => {
            if (step >= steps.length) return;

            statusText.textContent = steps[step];
            progressFill.style.width = ((step + 1) / steps.length * 100) + '%';

            // Add terminal line
            const line = document.createElement('div');
            line.className = 'vlab-terminal-line';
            line.textContent = `> ${steps[step]}`;
            terminalContent.appendChild(line);

            step++;
            
            if (step < steps.length) {
                setTimeout(progressAttack, 1500);
            } else {
                // Attack complete
                setTimeout(() => {
                    const successLine = document.createElement('div');
                    successLine.className = 'vlab-terminal-line success';
                    successLine.innerHTML = `🎉 ${target} has been successfully pranked with ${virusData.name}!`;
                    terminalContent.appendChild(successLine);
                    
                    // Update attack count
                    this.updateAttackCount(windowId);
                    
                    // Auto-close after success
                    setTimeout(() => attack.remove(), 3000);
                }, 1000);
            }
        };

        setTimeout(progressAttack, 1000);
    }

    updateTestVirusList(windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        const select = container?.querySelector(`#test-virus-select-${windowId}`);
        if (!select) return;

        select.innerHTML = '<option value="">Choose virus to test...</option>';
        
        this.savedViruses.forEach((virus, id) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = `${virus.name} (${this.getTypeText(virus.type)})`;
            select.appendChild(option);
        });
    }

    updateAttackVirusList(windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        const select = container?.querySelector(`#attack-virus-select-${windowId}`);
        if (!select) return;

        select.innerHTML = '<option value="">Select virus...</option>';
        
        this.savedViruses.forEach((virus, id) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = `${virus.name} (Target: ${virus.target || 'Anyone'})`;
            select.appendChild(option);
        });
    }

    updateAttackPreview(windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        const selectedTarget = container?.querySelector('.vlab-target-card.selected');
        const virusSelect = container?.querySelector(`#attack-virus-select-${windowId}`);
        const preview = container?.querySelector(`#attack-preview-${windowId}`);
        
        if (!preview) return;
        
        if (selectedTarget && virusSelect?.value) {
            const target = selectedTarget.dataset.target;
            const virusData = this.savedViruses.get(virusSelect.value);
            
            if (virusData) {
                preview.innerHTML = `
                    <div class="vlab-attack-preview-card">
                        <div class="vlab-preview-header">🎯 Attack Simulation</div>
                        <div class="vlab-preview-simulation">
                            <div class="vlab-fake-desktop">
                                <div class="vlab-desktop-header">
                                    <span>💻 ${target}'s Computer</span>
                                    <div class="vlab-desktop-status">🟢 Online</div>
                                </div>
                                <div class="vlab-desktop-screen" id="preview-screen-${windowId}">
                                    <div class="vlab-desktop-icons">
                                        <div class="vlab-desktop-icon">📁</div>
                                        <div class="vlab-desktop-icon">🎮</div>
                                        <div class="vlab-desktop-icon">💼</div>
                                    </div>
                                    <div class="vlab-attack-preview-effect" id="preview-effect-${windowId}">
                                        <!-- Virus effect will appear here -->
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="vlab-preview-details">
                            <div class="vlab-detail-row">
                                <span>Target Device:</span>
                                <span>${target}'s Computer</span>
                            </div>
                            <div class="vlab-detail-row">
                                <span>Attack Vector:</span>
                                <span>${virusData.name}</span>
                            </div>
                            <div class="vlab-detail-row">
                                <span>Predicted Damage:</span>
                                <span>${this.getSeverityText(virusData.severity)}</span>
                            </div>
                            <div class="vlab-detail-row">
                                <span>Success Rate:</span>
                                <span style="color: #00ff00;">98.7%</span>
                            </div>
                            <div class="vlab-preview-message">
                                📡 Ready to deploy "${virusData.description}"
                            </div>
                        </div>
                    </div>
                `;
                
                // Start the preview effect
                setTimeout(() => {
                    this.startAttackPreviewEffect(virusData, windowId);
                }, 500);
            }
        } else {
            preview.innerHTML = '<div class="vlab-preview-placeholder">Select target and virus to preview attack!</div>';
        }
    }

    startAttackPreviewEffect(virusData, windowId) {
        const effectContainer = document.querySelector(`#preview-effect-${windowId}`);
        if (!effectContainer) return;

        switch (virusData.type) {
            case 'image':
                this.showPreviewImageEffect(effectContainer, virusData);
                break;
            case 'popup':
                this.showPreviewPopupEffect(effectContainer, virusData);
                break;
            case 'message':
                this.showPreviewMessageEffect(effectContainer, virusData);
                break;
            case 'screen':
                this.showPreviewScreenEffect(effectContainer, virusData);
                break;
        }
    }

    showPreviewImageEffect(container, virusData) {
        const image = virusData.images[0] || 'hack1.png';
        container.innerHTML = `
            <div class="vlab-mini-image-popup" style="border-color: ${virusData.color};">
                <img src="assets/hack/${image}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                <div class="vlab-mini-fallback" style="display:none; color: ${virusData.color};">🖼️</div>
                <div class="vlab-mini-label" style="background: ${virusData.color};">
                    ${virusData.name}
                </div>
            </div>
        `;
        
        // Animate it appearing
        setTimeout(() => {
            container.querySelector('.vlab-mini-image-popup').classList.add('vlab-preview-bounce');
        }, 200);
    }

    showPreviewPopupEffect(container, virusData) {
        container.innerHTML = `
            <div class="vlab-mini-popup-preview" style="border-color: ${virusData.color};">
                <div class="vlab-mini-popup-header" style="background: ${virusData.color};">
                    <span>💀 Alert!</span>
                    <span>×</span>
                </div>
                <div class="vlab-mini-popup-body">
                    <div class="vlab-mini-popup-icon">${this.getVirusIcon(virusData.type)}</div>
                    <div class="vlab-mini-popup-text">Popup Storm!</div>
                </div>
            </div>
        `;
        
        // Show multiple mini popups
        setTimeout(() => {
            container.innerHTML += `
                <div class="vlab-mini-popup-preview vlab-mini-popup-2" style="border-color: ${virusData.color};">
                    <div class="vlab-mini-popup-header" style="background: ${virusData.color};">
                        <span>⚠️ Warning!</span>
                        <span>×</span>
                    </div>
                </div>
            `;
        }, 800);
    }

    showPreviewMessageEffect(container, virusData) {
        container.innerHTML = `
            <div class="vlab-mini-message-banner" style="background: ${virusData.color};">
                <div class="vlab-mini-message-content">
                    <span>${this.getVirusIcon(virusData.type)}</span>
                    <span>Message Spam Active!</span>
                </div>
            </div>
        `;
        
        // Animate the message
        const banner = container.querySelector('.vlab-mini-message-banner');
        let messageIndex = 0;
        const messages = ['Spam Mode ON!', 'Message Flood!', 'Prank Activated!'];
        
        setInterval(() => {
            const textElement = banner.querySelector('.vlab-mini-message-content span:last-child');
            if (textElement) {
                textElement.textContent = messages[messageIndex % messages.length];
                messageIndex++;
            }
        }, 1500);
    }

    showPreviewScreenEffect(container, virusData) {
        container.innerHTML = `
            <div class="vlab-mini-screen-effect" style="color: ${virusData.color};">
                <div class="vlab-mini-glitch-text">${virusData.name.toUpperCase()}</div>
                <div class="vlab-mini-effect-lines">
                    <div class="vlab-effect-line"></div>
                    <div class="vlab-effect-line"></div>
                    <div class="vlab-effect-line"></div>
                </div>
            </div>
        `;
        
        // Add glitch animation
        setTimeout(() => {
            container.querySelector('.vlab-mini-glitch-text').classList.add('vlab-mini-glitch');
        }, 300);
    }

    populateSavedViruses(windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        const gallery = container?.querySelector(`#virus-gallery-${windowId}`);
        if (!gallery) return;

        if (this.savedViruses.size === 0) {
            gallery.innerHTML = `
                <div class="vlab-empty-gallery">
                    <div class="vlab-empty-icon">🧪</div>
                    <div class="vlab-empty-text">No viruses created yet!</div>
                    <div class="vlab-empty-desc">Go to the Create tab to make your first virus!</div>
                </div>
            `;
            return;
        }

        const virusCards = Array.from(this.savedViruses.entries()).map(([id, virus]) => `
            <div class="vlab-virus-gallery-card" data-virus-id="${id}">
                <div class="vlab-card-header" style="background: ${virus.color};">
                    <div class="vlab-card-icon">${this.getVirusIcon(virus.type)}</div>
                    <div class="vlab-card-title">${virus.name}</div>
                </div>
                <div class="vlab-card-body">
                    <div class="vlab-card-info">
                        <div class="vlab-info-item">
                            <span class="label">Author:</span>
                            <span class="value">${virus.author}</span>
                        </div>
                        <div class="vlab-info-item">
                            <span class="label">Target:</span>
                            <span class="value">${virus.target || 'Anyone'}</span>
                        </div>
                        <div class="vlab-info-item">
                            <span class="label">Type:</span>
                            <span class="value">${this.getTypeText(virus.type)}</span>
                        </div>
                        <div class="vlab-card-description">${virus.description}</div>
                    </div>
                    <div class="vlab-card-actions">
                        <button class="vlab-test-card-btn" data-virus-id="${id}">🧪 Test</button>
                        <button class="vlab-delete-card-btn" data-virus-id="${id}">🗑️ Delete</button>
                    </div>
                </div>
            </div>
        `).join('');

        gallery.innerHTML = virusCards;

        // Handle card actions
        gallery.addEventListener('click', (e) => {
            const virusId = e.target.dataset.virusId;
            if (!virusId) return;

            if (e.target.classList.contains('vlab-test-card-btn')) {
                const virusData = this.savedViruses.get(virusId);
                if (virusData) {
                    this.createTestEffect(virusData);
                }
            } else if (e.target.classList.contains('vlab-delete-card-btn')) {
                this.savedViruses.delete(virusId);
                this.saveVirusesToStorage();
                this.populateSavedViruses(windowId);
                this.updateVirusCount(windowId);
                this.showHackerMessage('🗑️ Virus deleted!', 'info');
            }
        });
    }

    startMatrixEffect(windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        const matrix = container?.querySelector(`#matrix-${windowId}`);
        if (!matrix) return;

        const chars = '01ハッカー';
        let matrixText = '';
        
        const updateMatrix = () => {
            matrixText = '';
            for (let i = 0; i < 20; i++) {
                matrixText += chars[Math.floor(Math.random() * chars.length)];
            }
            matrix.textContent = matrixText;
        };

        setInterval(updateMatrix, 150);
    }

    updateVirusCount(windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        const counter = container?.querySelector(`#virus-count-${windowId}`);
        if (counter) {
            counter.textContent = this.savedViruses.size;
        }
    }

    updateAttackCount(windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        const counter = container?.querySelector(`#attack-count-${windowId}`);
        if (counter) {
            const currentCount = parseInt(counter.textContent) || 0;
            counter.textContent = currentCount + 1;
        }
    }

    // Helper methods
    getTargetAvatar(target) {
        const avatars = {
            'Liz': '👧',
            'Colten': '👦',
            'Mom': '👩',
            'Dad': '👨',
            'Uncle Randy': '👨‍🦲',
            'Aunt Angel': '👩‍🦰',
            'Granddaddy': '👴',
            'Teacher': '👩‍🏫',
            'Classmate': '🧒'
        };
        return avatars[target] || '🎯';
    }

    getVirusIcon(type) {
        const icons = {
            'image': '🖼️',
            'popup': '💥',
            'message': '💬',
            'screen': '📺'
        };
        return icons[type] || '🦠';
    }

    getTypeText(type) {
        const types = {
            'image': 'Image Bomber',
            'popup': 'Popup Storm',
            'message': 'Message Spammer',
            'screen': 'Screen Effect'
        };
        return types[type] || 'Unknown';
    }

    getSeverityText(severity) {
        const severities = {
            'low': '🟢 Harmless Prank',
            'medium': '🟡 Annoying Bug',
            'high': '🔴 Super Dangerous!'
        };
        return severities[severity] || '⚪ Unknown';
    }

    showHackerMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `vlab-hacker-message ${type}`;
        messageEl.innerHTML = `
            <div class="vlab-message-content">
                <div class="vlab-message-icon">🔥</div>
                <div class="vlab-message-text">${message}</div>
            </div>
        `;

        const colors = {
            info: { bg: '#00ffff', color: 'black' },
            success: { bg: '#00ff00', color: 'black' },
            warning: { bg: '#ffff00', color: 'black' },
            error: { bg: '#ff0000', color: 'white' }
        };

        messageEl.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            background: ${colors[type].bg};
            color: ${colors[type].color};
            padding: 8px 16px;
            border: 2px solid #000;
            z-index: 3000;
            font-weight: bold;
            font-size: 11px;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 0 10px ${colors[type].bg};
        `;

        document.body.appendChild(messageEl);
        setTimeout(() => messageEl.remove(), 4000);
    }

    saveVirusesToStorage() {
        try {
            const virusArray = Array.from(this.savedViruses.entries());
            localStorage.setItem('viruslab-saved-viruses', JSON.stringify(virusArray));
        } catch (error) {
            console.error('Failed to save viruses:', error);
        }
    }

    loadSavedViruses() {
        try {
            const saved = localStorage.getItem('viruslab-saved-viruses');
            if (saved) {
                const virusArray = JSON.parse(saved);
                this.savedViruses = new Map(virusArray);
            }
        } catch (error) {
            console.error('Failed to load saved viruses:', error);
        }
    }
}