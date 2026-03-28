// =================================
// VIRUS LAB PROGRAM - Kid Hacker Edition!
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

        // Interval tracking for cleanup
        this._matrixInterval = null;
        this._previewMessageInterval = null;

        // EventBus handler ref for cleanup
        this._onVirusCreate = (data) => this.createCustomVirus(data);
        this.eventBus.on('viruslab.create', this._onVirusCreate);

        this.loadSavedViruses();
    }

    launch() {
        const windowId = `viruslab-${Date.now()}`;
        this.currentWindowId = windowId;

        const windowContent = this.createVirusLabInterface(windowId);

        this.windowManager.createWindow(
            windowId,
            `${ElxaIcons.render('viruslab', 'ui')} Virus Lab - Hacker Edition`,
            windowContent,
            { width: '800px', height: '600px', x: '100px', y: '50px' }
        );

        // Clean up on window close
        this._onWindowClosed = (data) => {
            if (data.id === windowId) this.destroy(windowId);
        };
        this.eventBus.on('window.closed', this._onWindowClosed);

        setTimeout(() => {
            this.setupWindowEventHandlers(windowId);
            this.populateImageList(windowId);
            this.populateSavedViruses(windowId);
        }, 100);

        return windowId;
    }

    // =================================
    // CLEANUP
    // =================================
    destroy(windowId) {
        // Clear intervals
        if (this._matrixInterval) {
            clearInterval(this._matrixInterval);
            this._matrixInterval = null;
        }
        if (this._previewMessageInterval) {
            clearInterval(this._previewMessageInterval);
            this._previewMessageInterval = null;
        }

        // Remove any test effects / attack sequences from document.body
        document.querySelectorAll('.vlab-test-virus-effect').forEach(el => el.remove());
        document.querySelectorAll('.vlab-attack-sequence').forEach(el => el.remove());

        // Remove EventBus listeners
        if (this._onWindowClosed) {
            this.eventBus.off('window.closed', this._onWindowClosed);
            this._onWindowClosed = null;
        }

        if (windowId === this.currentWindowId) {
            this.currentWindowId = null;
        }
    }

    // =================================
    // INTERFACE
    // =================================
    createVirusLabInterface(windowId) {
        return `
            <div class="virus-lab-container" data-window-id="${windowId}">
                <!-- Cool Hacker Header -->
                <div class="vlab-hacker-header">
                    <div class="vlab-logo">
                        <div class="vlab-skull-icon">${ElxaIcons.renderAction('skull')}</div>
                        <div class="vlab-info">
                            <h2>VIRUS LAB</h2>
                            <span class="vlab-tag">Elite Hacker Edition v3.37</span>
                        </div>
                    </div>
                    <div class="vlab-status">
                        <div class="vlab-status-text">${ElxaIcons.renderAction('fire')} READY TO HACK ${ElxaIcons.renderAction('fire')}</div>
                        <div class="vlab-matrix-effect" id="matrix-${windowId}"></div>
                    </div>
                </div>

                <!-- Navigation Tabs -->
                <div class="vlab-nav">
                    <button class="vlab-tab active" data-tab="create" data-window="${windowId}">${ElxaIcons.renderAction('flask')} Create Virus</button>
                    <button class="vlab-tab" data-tab="test" data-window="${windowId}">${ElxaIcons.renderAction('microscope')} Test Lab</button>
                    <button class="vlab-tab" data-tab="send" data-window="${windowId}">${ElxaIcons.renderAction('broadcast')} Send Attack</button>
                    <button class="vlab-tab" data-tab="gallery" data-window="${windowId}">${ElxaIcons.renderAction('save')} My Viruses</button>
                </div>

                <!-- Content Area -->
                <div class="vlab-content">
                    <!-- Create Tab -->
                    <div class="vlab-tab-content active" id="create-tab-${windowId}">
                        <div class="vlab-create-interface">
                            <div class="vlab-create-form">
                                <h3>${ElxaIcons.renderAction('flask')} Design Your Virus</h3>

                                <div class="vlab-form-row">
                                    <div class="vlab-form-group">
                                        <label>${ElxaIcons.renderAction('skull')} Virus Name:</label>
                                        <input type="text" id="virus-name-${windowId}" placeholder="SuperCoolVirus" maxlength="20">
                                    </div>
                                    <div class="vlab-form-group">
                                        <label>${ElxaIcons.renderAction('account')} Created By:</label>
                                        <input type="text" id="virus-author-${windowId}" placeholder="Elite Hacker" maxlength="15">
                                    </div>
                                </div>

                                <div class="vlab-form-group">
                                    <label>${ElxaIcons.renderAction('pencil')} Evil Description:</label>
                                    <textarea id="virus-description-${windowId}" placeholder="This virus will totally prank everyone!" maxlength="100"></textarea>
                                </div>

                                <div class="vlab-form-row">
                                    <div class="vlab-form-group">
                                        <label>${ElxaIcons.renderAction('target')} Target Victim:</label>
                                        <select id="virus-target-${windowId}">
                                            <option value="">Choose your target...</option>
                                            ${this.targetList.map(target => `<option value="${target}">${target}</option>`).join('')}
                                            <option value="custom">Custom Target</option>
                                        </select>
                                        <input type="text" id="custom-target-${windowId}" placeholder="Enter custom target" style="display:none;" maxlength="15">
                                    </div>
                                    <div class="vlab-form-group">
                                        <label>${ElxaIcons.renderAction('flash')} Danger Level:</label>
                                        <select id="virus-severity-${windowId}">
                                            <option value="low">Harmless Prank</option>
                                            <option value="medium">Annoying Bug</option>
                                            <option value="high">Super Dangerous!</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="vlab-form-group">
                                    <label>${ElxaIcons.renderAction('biohazard')} Virus Type:</label>
                                    <div class="vlab-virus-types">
                                        <div class="vlab-type-option" data-type="image">
                                            <div class="vlab-type-icon">${ElxaIcons.renderAction('image-multiple')}</div>
                                            <div class="vlab-type-name">Image Bomber</div>
                                            <div class="vlab-type-desc">Shows funny pictures</div>
                                        </div>
                                        <div class="vlab-type-option" data-type="popup">
                                            <div class="vlab-type-icon">${ElxaIcons.renderAction('alert-decagram')}</div>
                                            <div class="vlab-type-name">Popup Storm</div>
                                            <div class="vlab-type-desc">Lots of silly popups</div>
                                        </div>
                                        <div class="vlab-type-option" data-type="message">
                                            <div class="vlab-type-icon">${ElxaIcons.renderAction('message-flash')}</div>
                                            <div class="vlab-type-name">Message Spammer</div>
                                            <div class="vlab-type-desc">Sends funny messages</div>
                                        </div>
                                        <div class="vlab-type-option" data-type="screen">
                                            <div class="vlab-type-icon">${ElxaIcons.renderAction('television')}</div>
                                            <div class="vlab-type-name">Screen Effect</div>
                                            <div class="vlab-type-desc">Cool screen effects</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Image Selection (for image type) -->
                                <div class="vlab-image-selection" id="image-selection-${windowId}" style="display:none;">
                                    <label>${ElxaIcons.renderAction('image-multiple')} Choose Images: <small>(Select multiple for variety!)</small></label>
                                    <div class="vlab-image-grid" id="image-grid-${windowId}">
                                        <!-- Images will be populated here -->
                                    </div>
                                </div>

                                <!-- Color Selection -->
                                <div class="vlab-form-group">
                                    <label>${ElxaIcons.renderAction('personalize')} Virus Colors:</label>
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
                                    <label>${ElxaIcons.renderAction('message-flash')} Custom Messages:</label>
                                    <div class="vlab-message-inputs" id="message-inputs-${windowId}">
                                        <input type="text" placeholder="Message 1" maxlength="50">
                                        <input type="text" placeholder="Message 2" maxlength="50">
                                        <input type="text" placeholder="Message 3" maxlength="50">
                                    </div>
                                    <button type="button" class="vlab-add-message-btn" id="add-message-${windowId}">
                                        ${ElxaIcons.renderAction('plus')} Add Another Message
                                    </button>
                                </div>

                                <div class="vlab-create-actions">
                                    <button class="vlab-create-virus-btn" id="create-virus-${windowId}">
                                        ${ElxaIcons.renderAction('flask')} CREATE VIRUS
                                    </button>
                                    <button class="vlab-preview-virus-btn" id="preview-virus-${windowId}">
                                        ${ElxaIcons.renderAction('eye')} Preview
                                    </button>
                                </div>
                            </div>

                            <div class="vlab-virus-preview" id="virus-preview-${windowId}">
                                <h3>${ElxaIcons.renderAction('eye')} Virus Preview</h3>
                                <div class="vlab-preview-content">
                                    <div class="vlab-preview-placeholder">
                                        <div class="vlab-placeholder-icon">${ElxaIcons.renderAction('biohazard')}</div>
                                        <div class="vlab-placeholder-text">Create a virus to see preview!</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Test Tab -->
                    <div class="vlab-tab-content" id="test-tab-${windowId}">
                        <div class="vlab-test-interface">
                            <h3>${ElxaIcons.renderAction('microscope')} Virus Testing Chamber</h3>
                            <div class="vlab-test-chamber">
                                <div class="vlab-chamber-display" id="test-display-${windowId}">
                                    <div class="vlab-chamber-icon">${ElxaIcons.renderAction('test-tube')}</div>
                                    <div class="vlab-chamber-text">Select a virus to test!</div>
                                </div>
                                <div class="vlab-test-controls">
                                    <select id="test-virus-select-${windowId}">
                                        <option value="">Choose virus to test...</option>
                                    </select>
                                    <button class="vlab-test-btn" id="test-virus-${windowId}">
                                        ${ElxaIcons.renderAction('rocket')} TEST VIRUS
                                    </button>
                                    <button class="vlab-stop-test-btn" id="stop-test-${windowId}">
                                        ${ElxaIcons.renderAction('stop')} STOP TEST
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Send Tab -->
                    <div class="vlab-tab-content" id="send-tab-${windowId}">
                        <div class="vlab-send-interface">
                            <h3>${ElxaIcons.renderAction('broadcast')} Hacker Attack Center</h3>
                            <div class="vlab-attack-center">
                                <div class="vlab-target-selection">
                                    <h4>${ElxaIcons.renderAction('target')} Select Target</h4>
                                    <div class="vlab-target-grid">
                                        ${this.targetList.map(target => `
                                            <div class="vlab-target-card" data-target="${target}">
                                                <div class="vlab-target-avatar">${this.getTargetAvatar(target)}</div>
                                                <div class="vlab-target-name">${target}</div>
                                                <div class="vlab-target-status vlab-status-online">Online</div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>

                                <div class="vlab-virus-selection">
                                    <h4>${ElxaIcons.renderAction('skull')} Choose Your Weapon</h4>
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
                                        ${ElxaIcons.renderAction('rocket')} LAUNCH ATTACK!
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Gallery Tab -->
                    <div class="vlab-tab-content" id="gallery-tab-${windowId}">
                        <div class="vlab-gallery-interface">
                            <h3>${ElxaIcons.renderAction('save')} My Virus Collection</h3>
                            <div class="vlab-virus-gallery" id="virus-gallery-${windowId}">
                                <!-- Saved viruses will be populated here -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="vlab-footer">
                    <div class="vlab-footer-text">
                        <span>${ElxaIcons.renderAction('fire')} Elite Hacker Status: ACTIVE</span>
                        <span>${ElxaIcons.renderAction('skull')} Viruses Created: <span id="virus-count-${windowId}">0</span></span>
                        <span>${ElxaIcons.renderAction('target')} Successful Attacks: <span id="attack-count-${windowId}">0</span></span>
                    </div>
                </div>
            </div>
        `;
    }

    // =================================
    // EVENT HANDLERS
    // =================================
    setupWindowEventHandlers(windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        if (!container) return;

        // Unified click delegation
        container.addEventListener('click', (e) => {
            // Tab navigation
            const tab = e.target.closest('.vlab-tab');
            if (tab) {
                this.switchTab(tab.dataset.tab, windowId);
                return;
            }

            // Virus type selection
            const typeOption = e.target.closest('.vlab-type-option');
            if (typeOption) {
                container.querySelectorAll('.vlab-type-option').forEach(opt => opt.classList.remove('selected'));
                typeOption.classList.add('selected');
                this.handleVirusTypeChange(typeOption.dataset.type, windowId);
                return;
            }

            // Color selection
            const colorOption = e.target.closest('.vlab-color-option');
            if (colorOption) {
                container.querySelectorAll('.vlab-color-option').forEach(opt => opt.classList.remove('selected'));
                colorOption.classList.add('selected');
                return;
            }

            // Target card selection in attack tab
            const targetCard = e.target.closest('.vlab-target-card');
            if (targetCard) {
                container.querySelectorAll('.vlab-target-card').forEach(card => card.classList.remove('selected'));
                targetCard.classList.add('selected');
                this.updateAttackPreview(windowId);
                return;
            }

            // Remove message button
            const removeBtn = e.target.closest('.vlab-remove-message-btn');
            if (removeBtn) {
                const messageContainer = removeBtn.closest('.vlab-message-input-container');
                if (messageContainer) messageContainer.remove();
                return;
            }

            // Gallery card actions (test / delete)
            const testCardBtn = e.target.closest('.vlab-test-card-btn');
            if (testCardBtn) {
                const virusId = testCardBtn.dataset.virusId;
                const virusData = this.savedViruses.get(virusId);
                if (virusData) this.createTestEffect(virusData);
                return;
            }

            const deleteCardBtn = e.target.closest('.vlab-delete-card-btn');
            if (deleteCardBtn) {
                const virusId = deleteCardBtn.dataset.virusId;
                this.savedViruses.delete(virusId);
                this.saveVirusesToStorage();
                this.populateSavedViruses(windowId);
                this.updateVirusCount(windowId);
                this.eventBus.emit('viruslab.virus.deleted', { virusId });
                ElxaUI.showMessage('Virus deleted!', 'info');
                return;
            }

            // Button actions by ID
            const button = e.target.closest('button');
            if (!button) return;
            const id = button.id;

            if (id === `create-virus-${windowId}`) {
                this.createVirus(windowId);
            } else if (id === `preview-virus-${windowId}`) {
                this.previewVirus(windowId);
            } else if (id === `test-virus-${windowId}`) {
                this.testVirus(windowId);
            } else if (id === `stop-test-${windowId}`) {
                this.stopTest(windowId);
            } else if (id === `launch-attack-${windowId}`) {
                this.launchAttack(windowId);
            } else if (id === `add-message-${windowId}`) {
                this.addMessageInput(windowId);
            }
        });

        // Custom target input toggle
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

        // Virus selection change in attack tab
        const attackVirusSelect = container.querySelector(`#attack-virus-select-${windowId}`);
        if (attackVirusSelect) {
            attackVirusSelect.addEventListener('change', () => {
                this.updateAttackPreview(windowId);
            });
        }

        // Start matrix effect (store interval for cleanup)
        this.startMatrixEffect(windowId);
    }

    // =================================
    // TAB NAVIGATION
    // =================================
    switchTab(tabName, windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        if (!container) return;

        container.querySelectorAll('.vlab-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        container.querySelectorAll('.vlab-tab-content').forEach(content => {
            content.classList.remove('active');
        });

        const targetTab = container.querySelector(`#${tabName}-tab-${windowId}`);
        if (targetTab) targetTab.classList.add('active');

        // Clear preview message interval when leaving a tab
        if (this._previewMessageInterval) {
            clearInterval(this._previewMessageInterval);
            this._previewMessageInterval = null;
        }

        if (tabName === 'test') {
            this.updateTestVirusList(windowId);
        } else if (tabName === 'send') {
            this.updateAttackVirusList(windowId);
        } else if (tabName === 'gallery') {
            this.populateSavedViruses(windowId);
        }
    }

    // =================================
    // VIRUS TYPE HANDLING
    // =================================
    handleVirusTypeChange(virusType, windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        if (!container) return;

        const imageSelection = container.querySelector(`#image-selection-${windowId}`);
        const customMessages = container.querySelector(`#custom-messages-${windowId}`);

        if (imageSelection) imageSelection.style.display = 'none';
        if (customMessages) customMessages.style.display = 'none';

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

        const images = [
            { name: 'hack1.png', fallback: 'H1' },
            { name: 'hack2.png', fallback: 'H2' },
            { name: 'hack3.png', fallback: 'H3' },
            { name: 'virus.png', fallback: 'VR' },
            { name: 'skull.png', fallback: 'SK' },
            { name: 'explosion.png', fallback: 'EX' },
            { name: 'matrix.png', fallback: 'MX' },
            { name: 'warning.png', fallback: 'WN' }
        ];

        imageGrid.innerHTML = images.map(img => `
            <div class="vlab-image-option" data-image="${img.name}">
                <div class="vlab-image-preview">
                    <img src="assets/hack/${img.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                    <div class="vlab-image-fallback" style="display:none;">
                        <div class="vlab-fallback-icon">${ElxaIcons.renderAction('image-multiple')}</div>
                        <div class="vlab-fallback-name">${img.name}</div>
                    </div>
                </div>
                <div class="vlab-image-name">${img.name}</div>
            </div>
        `).join('');

        // Handle image selection (single listener, set once)
        imageGrid.addEventListener('click', (e) => {
            const imageOption = e.target.closest('.vlab-image-option');
            if (imageOption) {
                imageOption.classList.toggle('selected');
                const selectedCount = imageGrid.querySelectorAll('.vlab-image-option.selected').length;
                const label = container.querySelector(`#image-selection-${windowId} label`);
                if (label) {
                    label.innerHTML = selectedCount > 0
                        ? `${ElxaIcons.renderAction('image-multiple')} Choose Images: <small>(${selectedCount} selected)</small>`
                        : `${ElxaIcons.renderAction('image-multiple')} Choose Images: <small>(Select multiple for variety!)</small>`;
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
            ElxaUI.showMessage('Maximum 10 messages allowed!', 'warning');
            return;
        }

        const newInput = document.createElement('input');
        newInput.type = 'text';
        newInput.placeholder = `Message ${currentInputs + 1}`;
        newInput.maxLength = 50;

        if (currentInputs >= 3) {
            const inputContainer = document.createElement('div');
            inputContainer.className = 'vlab-message-input-container';
            inputContainer.appendChild(newInput);

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'vlab-remove-message-btn';
            removeBtn.innerHTML = ElxaIcons.renderAction('close');
            removeBtn.title = 'Remove this message';
            inputContainer.appendChild(removeBtn);

            messageInputs.appendChild(inputContainer);
        } else {
            messageInputs.appendChild(newInput);
        }
    }

    // =================================
    // VIRUS CREATION
    // =================================
    createVirus(windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        if (!container) return;

        const virusData = this.collectVirusData(container, windowId);

        if (!this.validateVirusData(virusData)) {
            ElxaUI.showMessage('Fill out all required fields!', 'warning');
            return;
        }

        const virusId = `custom_virus_${Date.now()}`;
        virusData.id = virusId;
        virusData.created = new Date();

        this.savedViruses.set(virusId, virusData);
        this.saveVirusesToStorage();
        this.updateVirusCount(windowId);
        this.eventBus.emit('viruslab.virus.saved', { virusId, virusData });

        ElxaUI.showMessage(`Virus "${virusData.name}" created successfully!`, 'success');
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

        const messageInputs = container.querySelectorAll(`#custom-messages-${windowId} input, #custom-messages-${windowId} .vlab-message-input-container input`);
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

    // =================================
    // PREVIEW
    // =================================
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

    // =================================
    // TEST LAB
    // =================================
    testVirus(windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        const virusSelect = container?.querySelector(`#test-virus-select-${windowId}`);

        if (!virusSelect?.value) {
            ElxaUI.showMessage('Select a virus to test!', 'warning');
            return;
        }

        const virusData = this.savedViruses.get(virusSelect.value);
        if (!virusData) return;

        ElxaUI.showMessage(`Testing ${virusData.name}...`, 'info');
        this.createTestEffect(virusData);
    }

    createTestEffect(virusData) {
        document.querySelectorAll('.vlab-test-virus-effect').forEach(el => el.remove());

        const effect = document.createElement('div');
        effect.className = 'vlab-test-virus-effect';

        switch (virusData.type) {
            case 'image':  this.createImageEffect(effect, virusData); break;
            case 'popup':  this.createPopupEffect(effect, virusData); break;
            case 'message': this.createMessageEffect(effect, virusData); break;
            case 'screen': this.createScreenEffect(effect, virusData); break;
        }

        document.body.appendChild(effect);

        setTimeout(() => {
            if (effect.parentNode) effect.remove();
        }, 15000);
    }

    createImageEffect(effect, virusData) {
        if (!virusData.images || virusData.images.length === 0) {
            virusData.images = ['hack1.png'];
        }

        let imageCount = 0;
        const maxImages = Math.min(virusData.images.length * 2, 6);

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
                        <button class="vlab-image-close-btn" style="background: ${virusData.color};">${ElxaIcons.renderAction('close')}</button>
                    </div>
                </div>
            `;

            const x = Math.random() * (window.innerWidth - 300);
            const y = Math.random() * (window.innerHeight - 300);
            imageElement.style.position = 'fixed';
            imageElement.style.left = x + 'px';
            imageElement.style.top = y + 'px';
            imageElement.style.zIndex = '5000';

            effect.appendChild(imageElement);

            imageElement.querySelector('.vlab-image-close-btn').addEventListener('click', () => {
                imageElement.remove();
            });

            setTimeout(() => {
                if (imageElement.parentNode) imageElement.remove();
            }, Math.random() * 8000 + 5000);

            imageCount++;
            if (imageCount < maxImages) {
                setTimeout(showRandomImage, Math.random() * 3000 + 2000);
            }
        };

        showRandomImage();
    }

    createPopupEffect(effect, virusData) {
        const messages = virusData.customMessages.length > 0 ? virusData.customMessages : [
            `${virusData.target}, you've been hacked by ${virusData.author}!`,
            `The ${virusData.name} virus is taking over!`,
            'This is just a test... or is it?'
        ];

        let popupCount = 0;
        const maxPopups = Math.min(messages.length * 2, 8);

        const showPopup = () => {
            if (popupCount >= maxPopups) return;

            const popup = document.createElement('div');
            popup.className = 'vlab-test-popup';
            popup.innerHTML = `
                <div class="vlab-popup-content" style="border-color: ${virusData.color};">
                    <div class="vlab-popup-header" style="background: ${virusData.color};">
                        <span>${ElxaIcons.renderAction('skull')} ${virusData.name}</span>
                        <button class="vlab-popup-close">${ElxaIcons.renderAction('close')}</button>
                    </div>
                    <div class="vlab-popup-body">
                        <div class="vlab-popup-icon">${this.getVirusIcon(virusData.type)}</div>
                        <div class="vlab-popup-message">${messages[popupCount % messages.length]}</div>
                        <div class="vlab-popup-test-label">${ElxaIcons.renderAction('test-tube')} TEST MODE (${popupCount + 1}/${maxPopups})</div>
                    </div>
                </div>
            `;

            const x = Math.random() * (window.innerWidth - 350);
            const y = Math.random() * (window.innerHeight - 200);
            popup.style.left = x + 'px';
            popup.style.top = y + 'px';

            effect.appendChild(popup);

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
            'This message will self-destruct in 5 seconds...'
        ];

        effect.innerHTML = `
            <div class="vlab-test-message-banner" style="background: ${virusData.color};">
                <div class="vlab-message-content">
                    <div class="vlab-message-icon">${this.getVirusIcon(virusData.type)}</div>
                    <div class="vlab-message-text" id="vlab-cycling-text"></div>
                    <div class="vlab-test-indicator">${ElxaIcons.renderAction('test-tube')} TEST</div>
                </div>
            </div>
        `;

        const messageText = effect.querySelector('#vlab-cycling-text');
        let messageIndex = 0;

        const cycleMessages = () => {
            if (messageText) messageText.textContent = messages[messageIndex % messages.length];
            messageIndex++;
        };
        cycleMessages();
        // Store interval ref so it can be cleaned up
        if (this._previewMessageInterval) clearInterval(this._previewMessageInterval);
        this._previewMessageInterval = setInterval(() => {
            if (messageIndex < messages.length * 3) {
                cycleMessages();
            } else {
                clearInterval(this._previewMessageInterval);
                this._previewMessageInterval = null;
            }
        }, 3000);
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
                    <div class="vlab-test-watermark">${ElxaIcons.renderAction('test-tube')} TEST MODE ${ElxaIcons.renderAction('test-tube')}</div>
                </div>
            </div>
        `;

        setTimeout(() => {
            effect.querySelector('.vlab-glitch-text')?.classList.add('vlab-glitch-animation');
        }, 500);
    }

    stopTest(windowId) {
        document.querySelectorAll('.vlab-test-virus-effect').forEach(el => el.remove());
        if (this._previewMessageInterval) {
            clearInterval(this._previewMessageInterval);
            this._previewMessageInterval = null;
        }
        ElxaUI.showMessage('Test stopped!', 'info');
    }

    // =================================
    // SEND ATTACK
    // =================================
    launchAttack(windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        const selectedTarget = container?.querySelector('.vlab-target-card.selected');
        const virusSelect = container?.querySelector(`#attack-virus-select-${windowId}`);

        if (!selectedTarget || !virusSelect?.value) {
            ElxaUI.showMessage('Select target and virus!', 'warning');
            return;
        }

        const target = selectedTarget.dataset.target;
        const virusData = this.savedViruses.get(virusSelect.value);
        if (!virusData) return;

        this.showAttackSequence(target, virusData, windowId);
    }

    showAttackSequence(target, virusData, windowId) {
        const attack = document.createElement('div');
        attack.className = 'vlab-attack-sequence';
        attack.innerHTML = `
            <div class="vlab-attack-overlay">
                <div class="vlab-attack-terminal">
                    <div class="vlab-terminal-header">
                        <span>${ElxaIcons.renderAction('fire')} HACKER TERMINAL ${ElxaIcons.renderAction('fire')}</span>
                        <button class="vlab-terminal-close">${ElxaIcons.renderAction('close')}</button>
                    </div>
                    <div class="vlab-terminal-content">
                        <div class="vlab-terminal-line">Initializing attack...</div>
                        <div class="vlab-terminal-line">Target: ${target}</div>
                        <div class="vlab-terminal-line">Weapon: ${virusData.name}</div>
                        <div class="vlab-terminal-line">Status: <span class="vlab-terminal-status">CONNECTING...</span></div>
                        <div class="vlab-progress-bar">
                            <div class="vlab-progress-fill"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(attack);

        attack.querySelector('.vlab-terminal-close').addEventListener('click', () => {
            attack.remove();
        });

        const statusText = attack.querySelector('.vlab-terminal-status');
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

            const line = document.createElement('div');
            line.className = 'vlab-terminal-line';
            line.textContent = `> ${steps[step]}`;
            terminalContent.appendChild(line);

            step++;

            if (step < steps.length) {
                setTimeout(progressAttack, 1500);
            } else {
                setTimeout(() => {
                    const successLine = document.createElement('div');
                    successLine.className = 'vlab-terminal-line success';
                    successLine.textContent = `${target} has been successfully pranked with ${virusData.name}!`;
                    terminalContent.appendChild(successLine);

                    this.updateAttackCount(windowId);
                    setTimeout(() => attack.remove(), 3000);
                }, 1000);
            }
        };

        setTimeout(progressAttack, 1000);
    }

    // =================================
    // LIST UPDATES
    // =================================
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
                        <div class="vlab-preview-header">${ElxaIcons.renderAction('target')} Attack Simulation</div>
                        <div class="vlab-preview-simulation">
                            <div class="vlab-fake-desktop">
                                <div class="vlab-desktop-header">
                                    <span>${target}'s Computer</span>
                                    <div class="vlab-desktop-status vlab-status-online">Online</div>
                                </div>
                                <div class="vlab-desktop-screen" id="preview-screen-${windowId}">
                                    <div class="vlab-desktop-icons">
                                        <div class="vlab-desktop-icon">${ElxaIcons.renderAction('open')}</div>
                                        <div class="vlab-desktop-icon">${ElxaIcons.renderAction('play')}</div>
                                        <div class="vlab-desktop-icon">${ElxaIcons.renderAction('save')}</div>
                                    </div>
                                    <div class="vlab-attack-preview-effect" id="preview-effect-${windowId}"></div>
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
                                <span class="vlab-success-rate">98.7%</span>
                            </div>
                            <div class="vlab-preview-message">
                                ${ElxaIcons.renderAction('broadcast')} Ready to deploy "${virusData.description}"
                            </div>
                        </div>
                    </div>
                `;

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
            case 'image':   this.showPreviewImageEffect(effectContainer, virusData); break;
            case 'popup':   this.showPreviewPopupEffect(effectContainer, virusData); break;
            case 'message': this.showPreviewMessageEffect(effectContainer, virusData); break;
            case 'screen':  this.showPreviewScreenEffect(effectContainer, virusData); break;
        }
    }

    showPreviewImageEffect(container, virusData) {
        const image = virusData.images[0] || 'hack1.png';
        container.innerHTML = `
            <div class="vlab-mini-image-popup" style="border-color: ${virusData.color};">
                <img src="assets/hack/${image}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                <div class="vlab-mini-fallback" style="display:none; color: ${virusData.color};">${ElxaIcons.renderAction('image-multiple')}</div>
                <div class="vlab-mini-label" style="background: ${virusData.color};">
                    ${virusData.name}
                </div>
            </div>
        `;

        setTimeout(() => {
            container.querySelector('.vlab-mini-image-popup')?.classList.add('vlab-preview-bounce');
        }, 200);
    }

    showPreviewPopupEffect(container, virusData) {
        container.innerHTML = `
            <div class="vlab-mini-popup-preview" style="border-color: ${virusData.color};">
                <div class="vlab-mini-popup-header" style="background: ${virusData.color};">
                    <span>${ElxaIcons.renderAction('skull')} Alert!</span>
                    <span>${ElxaIcons.renderAction('close')}</span>
                </div>
                <div class="vlab-mini-popup-body">
                    <div class="vlab-mini-popup-icon">${this.getVirusIcon(virusData.type)}</div>
                    <div class="vlab-mini-popup-text">Popup Storm!</div>
                </div>
            </div>
        `;

        setTimeout(() => {
            container.innerHTML += `
                <div class="vlab-mini-popup-preview vlab-mini-popup-2" style="border-color: ${virusData.color};">
                    <div class="vlab-mini-popup-header" style="background: ${virusData.color};">
                        <span>${ElxaIcons.renderAction('alert-decagram')} Warning!</span>
                        <span>${ElxaIcons.renderAction('close')}</span>
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
                    <span class="vlab-mini-cycling-text">Message Spam Active!</span>
                </div>
            </div>
        `;

        const textEl = container.querySelector('.vlab-mini-cycling-text');
        let messageIndex = 0;
        const messages = ['Spam Mode ON!', 'Message Flood!', 'Prank Activated!'];

        // Store interval for cleanup
        if (this._previewMessageInterval) clearInterval(this._previewMessageInterval);
        this._previewMessageInterval = setInterval(() => {
            if (textEl) {
                textEl.textContent = messages[messageIndex % messages.length];
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

        setTimeout(() => {
            container.querySelector('.vlab-mini-glitch-text')?.classList.add('vlab-mini-glitch');
        }, 300);
    }

    // =================================
    // GALLERY
    // =================================
    populateSavedViruses(windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        const gallery = container?.querySelector(`#virus-gallery-${windowId}`);
        if (!gallery) return;

        if (this.savedViruses.size === 0) {
            gallery.innerHTML = `
                <div class="vlab-empty-gallery">
                    <div class="vlab-empty-icon">${ElxaIcons.renderAction('flask')}</div>
                    <div class="vlab-empty-text">No viruses created yet!</div>
                    <div class="vlab-empty-desc">Go to the Create tab to make your first virus!</div>
                </div>
            `;
            return;
        }

        gallery.innerHTML = Array.from(this.savedViruses.entries()).map(([id, virus]) => `
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
                        <button class="vlab-test-card-btn" data-virus-id="${id}">${ElxaIcons.renderAction('test-tube')} Test</button>
                        <button class="vlab-delete-card-btn" data-virus-id="${id}">${ElxaIcons.renderAction('delete')} Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
        // NOTE: Click handling for gallery cards is done via container delegation
        // in setupWindowEventHandlers — no listener added here.
    }

    // =================================
    // MATRIX EFFECT
    // =================================
    startMatrixEffect(windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        const matrix = container?.querySelector(`#matrix-${windowId}`);
        if (!matrix) return;

        const chars = '01ハッカー';

        if (this._matrixInterval) clearInterval(this._matrixInterval);
        this._matrixInterval = setInterval(() => {
            let matrixText = '';
            for (let i = 0; i < 20; i++) {
                matrixText += chars[Math.floor(Math.random() * chars.length)];
            }
            matrix.textContent = matrixText;
        }, 150);
    }

    // =================================
    // COUNTER UPDATES
    // =================================
    updateVirusCount(windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        const counter = container?.querySelector(`#virus-count-${windowId}`);
        if (counter) counter.textContent = this.savedViruses.size;
    }

    updateAttackCount(windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        const counter = container?.querySelector(`#attack-count-${windowId}`);
        if (counter) {
            counter.textContent = (parseInt(counter.textContent) || 0) + 1;
        }
    }

    // =================================
    // HELPERS
    // =================================
    getTargetAvatar(target) {
        const avatars = {
            'Liz': '👧', 'Colten': '👦', 'Mom': '👩', 'Dad': '👨',
            'Uncle Randy': '👨‍🦲', 'Aunt Angel': '👩‍🦰', 'Granddaddy': '👴',
            'Teacher': '👩‍🏫', 'Classmate': '🧒'
        };
        return avatars[target] || '🎯';
    }

    getVirusIcon(type) {
        const iconMap = {
            'image': 'image-multiple',
            'popup': 'alert-decagram',
            'message': 'message-flash',
            'screen': 'television'
        };
        return ElxaIcons.renderAction(iconMap[type] || 'biohazard');
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
            'low':    { cls: 'vlab-sev-low',    text: 'Harmless Prank' },
            'medium': { cls: 'vlab-sev-medium',  text: 'Annoying Bug' },
            'high':   { cls: 'vlab-sev-high',    text: 'Super Dangerous!' }
        };
        const s = severities[severity] || { cls: 'vlab-sev-unknown', text: 'Unknown' };
        return `<span class="vlab-severity-dot ${s.cls}"></span> ${s.text}`;
    }

    // =================================
    // PERSISTENCE
    // =================================
    saveVirusesToStorage() {
        try {
            const virusArray = Array.from(this.savedViruses.entries());
            localStorage.setItem('viruslab-saved-viruses', JSON.stringify(virusArray));
        } catch (error) {
            console.error('💾 Failed to save viruses:', error);
        }
    }

    loadSavedViruses() {
        try {
            const saved = localStorage.getItem('viruslab-saved-viruses');
            if (saved) {
                this.savedViruses = new Map(JSON.parse(saved));
            }
        } catch (error) {
            console.error('💾 Failed to load saved viruses:', error);
        }
    }
}
