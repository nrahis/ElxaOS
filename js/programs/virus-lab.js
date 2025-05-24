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
                <div class="hacker-header">
                    <div class="hacker-logo">
                        <div class="skull-icon">💀</div>
                        <div class="lab-info">
                            <h2>VIRUS LAB</h2>
                            <span class="hacker-tag">Elite Hacker Edition v3.37</span>
                        </div>
                    </div>
                    <div class="hacker-status">
                        <div class="status-text">🔥 READY TO HACK 🔥</div>
                        <div class="matrix-effect" id="matrix-${windowId}"></div>
                    </div>
                </div>

                <!-- Navigation Tabs -->
                <div class="lab-nav">
                    <button class="lab-tab active" data-tab="create" data-window="${windowId}">🧪 Create Virus</button>
                    <button class="lab-tab" data-tab="test" data-window="${windowId}">🔬 Test Lab</button>
                    <button class="lab-tab" data-tab="send" data-window="${windowId}">📡 Send Attack</button>
                    <button class="lab-tab" data-tab="gallery" data-window="${windowId}">💾 My Viruses</button>
                </div>

                <!-- Content Area -->
                <div class="lab-content">
                    <!-- Create Tab -->
                    <div class="tab-content active" id="create-tab-${windowId}">
                        <div class="create-interface">
                            <div class="create-form">
                                <h3>🧪 Design Your Virus</h3>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>💀 Virus Name:</label>
                                        <input type="text" id="virus-name-${windowId}" placeholder="SuperCoolVirus" maxlength="20">
                                    </div>
                                    <div class="form-group">
                                        <label>👤 Created By:</label>
                                        <input type="text" id="virus-author-${windowId}" placeholder="Elite Hacker" maxlength="15">
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label>📝 Evil Description:</label>
                                    <textarea id="virus-description-${windowId}" placeholder="This virus will totally prank everyone!" maxlength="100"></textarea>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label>🎯 Target Victim:</label>
                                        <select id="virus-target-${windowId}">
                                            <option value="">Choose your target...</option>
                                            ${this.targetList.map(target => `<option value="${target}">${target}</option>`).join('')}
                                            <option value="custom">🎭 Custom Target</option>
                                        </select>
                                        <input type="text" id="custom-target-${windowId}" placeholder="Enter custom target" style="display:none;" maxlength="15">
                                    </div>
                                    <div class="form-group">
                                        <label>⚡ Danger Level:</label>
                                        <select id="virus-severity-${windowId}">
                                            <option value="low">🟢 Harmless Prank</option>
                                            <option value="medium">🟡 Annoying Bug</option>
                                            <option value="high">🔴 Super Dangerous!</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label>🎨 Virus Type:</label>
                                    <div class="virus-types">
                                        <div class="type-option" data-type="image">
                                            <div class="type-icon">🖼️</div>
                                            <div class="type-name">Image Bomber</div>
                                            <div class="type-desc">Shows funny pictures</div>
                                        </div>
                                        <div class="type-option" data-type="popup">
                                            <div class="type-icon">💥</div>
                                            <div class="type-name">Popup Storm</div>
                                            <div class="type-desc">Lots of silly popups</div>
                                        </div>
                                        <div class="type-option" data-type="message">
                                            <div class="type-icon">💬</div>
                                            <div class="type-name">Message Spammer</div>
                                            <div class="type-desc">Sends funny messages</div>
                                        </div>
                                        <div class="type-option" data-type="screen">
                                            <div class="type-icon">📺</div>
                                            <div class="type-name">Screen Effect</div>
                                            <div class="type-desc">Cool screen effects</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Image Selection (for image type) -->
                                <div class="image-selection" id="image-selection-${windowId}" style="display:none;">
                                    <label>🖼️ Choose Images:</label>
                                    <div class="image-grid" id="image-grid-${windowId}">
                                        <!-- Images will be populated here -->
                                    </div>
                                </div>

                                <!-- Color Selection -->
                                <div class="form-group">
                                    <label>🌈 Virus Colors:</label>
                                    <div class="color-picker">
                                        <div class="color-option" data-color="#ff0000" style="background:#ff0000"></div>
                                        <div class="color-option" data-color="#00ff00" style="background:#00ff00"></div>
                                        <div class="color-option" data-color="#0000ff" style="background:#0000ff"></div>
                                        <div class="color-option" data-color="#ffff00" style="background:#ffff00"></div>
                                        <div class="color-option" data-color="#ff00ff" style="background:#ff00ff"></div>
                                        <div class="color-option" data-color="#00ffff" style="background:#00ffff"></div>
                                        <div class="color-option" data-color="#ff8800" style="background:#ff8800"></div>
                                        <div class="color-option" data-color="#8800ff" style="background:#8800ff"></div>
                                    </div>
                                </div>

                                <!-- Custom Messages (for popup/message types) -->
                                <div class="custom-messages" id="custom-messages-${windowId}" style="display:none;">
                                    <label>💬 Custom Messages:</label>
                                    <div class="message-inputs">
                                        <input type="text" placeholder="Message 1" maxlength="50">
                                        <input type="text" placeholder="Message 2" maxlength="50">
                                        <input type="text" placeholder="Message 3" maxlength="50">
                                    </div>
                                </div>

                                <div class="create-actions">
                                    <button class="create-virus-btn" id="create-virus-${windowId}">
                                        🧪 CREATE VIRUS
                                    </button>
                                    <button class="preview-virus-btn" id="preview-virus-${windowId}">
                                        👁️ Preview
                                    </button>
                                </div>
                            </div>

                            <div class="virus-preview" id="virus-preview-${windowId}">
                                <h3>🔍 Virus Preview</h3>
                                <div class="preview-content">
                                    <div class="preview-placeholder">
                                        <div class="placeholder-icon">🦠</div>
                                        <div class="placeholder-text">Create a virus to see preview!</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Test Tab -->
                    <div class="tab-content" id="test-tab-${windowId}">
                        <div class="test-interface">
                            <h3>🔬 Virus Testing Chamber</h3>
                            <div class="test-chamber">
                                <div class="chamber-display" id="test-display-${windowId}">
                                    <div class="chamber-icon">🧪</div>
                                    <div class="chamber-text">Select a virus to test!</div>
                                </div>
                                <div class="test-controls">
                                    <select id="test-virus-select-${windowId}">
                                        <option value="">Choose virus to test...</option>
                                    </select>
                                    <button class="test-btn" id="test-virus-${windowId}">
                                        🚀 TEST VIRUS
                                    </button>
                                    <button class="stop-test-btn" id="stop-test-${windowId}">
                                        🛑 STOP TEST
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Send Tab -->
                    <div class="tab-content" id="send-tab-${windowId}">
                        <div class="send-interface">
                            <h3>📡 Hacker Attack Center</h3>
                            <div class="attack-center">
                                <div class="target-selection">
                                    <h4>🎯 Select Target</h4>
                                    <div class="target-grid">
                                        ${this.targetList.map(target => `
                                            <div class="target-card" data-target="${target}">
                                                <div class="target-avatar">${this.getTargetAvatar(target)}</div>
                                                <div class="target-name">${target}</div>
                                                <div class="target-status">🟢 Online</div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                                
                                <div class="virus-selection">
                                    <h4>💀 Choose Your Weapon</h4>
                                    <select id="attack-virus-select-${windowId}">
                                        <option value="">Select virus...</option>
                                    </select>
                                </div>

                                <div class="attack-preview" id="attack-preview-${windowId}">
                                    <div class="preview-placeholder">
                                        Select target and virus to preview attack!
                                    </div>
                                </div>

                                <div class="attack-controls">
                                    <button class="launch-attack-btn" id="launch-attack-${windowId}">
                                        🚀 LAUNCH ATTACK!
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Gallery Tab -->
                    <div class="tab-content" id="gallery-tab-${windowId}">
                        <div class="gallery-interface">
                            <h3>💾 My Virus Collection</h3>
                            <div class="virus-gallery" id="virus-gallery-${windowId}">
                                <!-- Saved viruses will be populated here -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="lab-footer">
                    <div class="footer-text">
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
            if (target.classList.contains('lab-tab')) {
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
            }
        });

        // Handle virus type selection
        container.addEventListener('click', (e) => {
            if (e.target.closest('.type-option')) {
                const typeOption = e.target.closest('.type-option');
                container.querySelectorAll('.type-option').forEach(opt => opt.classList.remove('selected'));
                typeOption.classList.add('selected');
                
                const virusType = typeOption.dataset.type;
                this.handleVirusTypeChange(virusType, windowId);
            }
        });

        // Handle color selection
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('color-option')) {
                container.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
                e.target.classList.add('selected');
            }
        });

        // Handle target selection in attack tab
        container.addEventListener('click', (e) => {
            if (e.target.closest('.target-card')) {
                const targetCard = e.target.closest('.target-card');
                container.querySelectorAll('.target-card').forEach(card => card.classList.remove('selected'));
                targetCard.classList.add('selected');
                this.updateAttackPreview(windowId);
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

        // Start matrix effect
        this.startMatrixEffect(windowId);
    }

    switchTab(tabName, windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        if (!container) return;

        // Update nav tabs
        container.querySelectorAll('.lab-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update content tabs
        container.querySelectorAll('.tab-content').forEach(content => {
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
            <div class="image-option" data-image="${img.name}">
                <div class="image-preview">
                    <img src="assets/hack/${img.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                    <div class="image-fallback" style="display:none;">
                        <div class="fallback-icon">${img.icon}</div>
                        <div class="fallback-name">${img.name}</div>
                    </div>
                </div>
                <div class="image-name">${img.name}</div>
            </div>
        `).join('');

        // Handle image selection
        imageGrid.addEventListener('click', (e) => {
            const imageOption = e.target.closest('.image-option');
            if (imageOption) {
                imageGrid.querySelectorAll('.image-option').forEach(opt => opt.classList.remove('selected'));
                imageOption.classList.add('selected');
            }
        });
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

        const selectedType = getSelected('.type-option');
        const selectedColor = getSelected('.color-option');
        const selectedImages = Array.from(container.querySelectorAll('.image-option.selected')).map(img => img.dataset.image);

        // Collect custom messages
        const messageInputs = container.querySelectorAll('#custom-messages-' + windowId + ' input');
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
        const previewContent = container.querySelector(`#virus-preview-${windowId} .preview-content`);
        
        if (!previewContent) return;

        previewContent.innerHTML = `
            <div class="virus-card" style="border-color: ${virusData.color};">
                <div class="virus-header" style="background: ${virusData.color};">
                    <div class="virus-icon">${this.getVirusIcon(virusData.type)}</div>
                    <div class="virus-title">${virusData.name}</div>
                </div>
                <div class="virus-info">
                    <div class="info-row">
                        <span class="label">Author:</span>
                        <span class="value">${virusData.author}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Target:</span>
                        <span class="value">${virusData.target || 'No target selected'}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Danger:</span>
                        <span class="value">${this.getSeverityText(virusData.severity)}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Type:</span>
                        <span class="value">${this.getTypeText(virusData.type)}</span>
                    </div>
                    <div class="virus-description">${virusData.description}</div>
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
        document.querySelectorAll('.test-virus-effect').forEach(el => el.remove());

        const effect = document.createElement('div');
        effect.className = 'test-virus-effect';
        
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

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (effect.parentNode) effect.remove();
        }, 10000);
    }

    createImageEffect(effect, virusData) {
        const image = virusData.images[0] || 'hack1.png';
        effect.innerHTML = `
            <div class="test-image-overlay" style="border-color: ${virusData.color};">
                <div class="test-image-content">
                    <img src="assets/hack/${image}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                    <div class="image-fallback" style="display:none;">
                        <div class="fallback-icon">${this.getVirusIcon(virusData.type)}</div>
                        <div class="fallback-text">${virusData.name}</div>
                    </div>
                    <div class="test-label" style="background: ${virusData.color};">
                        TEST: ${virusData.name}
                    </div>
                </div>
            </div>
        `;

        // Random position
        const x = Math.random() * (window.innerWidth - 300);
        const y = Math.random() * (window.innerHeight - 300);
        effect.style.left = x + 'px';
        effect.style.top = y + 'px';
    }

    createPopupEffect(effect, virusData) {
        const messages = virusData.customMessages.length > 0 ? virusData.customMessages : [
            `${virusData.target}, you've been hacked by ${virusData.author}!`,
            `The ${virusData.name} virus is taking over!`,
            `This is just a test... or is it? 😈`
        ];

        let popupCount = 0;
        const maxPopups = 3;

        const showPopup = () => {
            if (popupCount >= maxPopups) return;

            const popup = document.createElement('div');
            popup.className = 'test-popup';
            popup.innerHTML = `
                <div class="popup-content" style="border-color: ${virusData.color};">
                    <div class="popup-header" style="background: ${virusData.color};">
                        <span>💀 ${virusData.name}</span>
                        <button class="popup-close">×</button>
                    </div>
                    <div class="popup-body">
                        <div class="popup-icon">${this.getVirusIcon(virusData.type)}</div>
                        <div class="popup-message">${messages[popupCount % messages.length]}</div>
                        <div class="popup-test-label">🧪 TEST MODE</div>
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
            popup.querySelector('.popup-close').addEventListener('click', () => {
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
            <div class="test-message-banner" style="background: ${virusData.color};">
                <div class="message-content">
                    <div class="message-icon">${this.getVirusIcon(virusData.type)}</div>
                    <div class="message-text" id="message-text"></div>
                    <div class="test-indicator">🧪 TEST</div>
                </div>
            </div>
        `;

        const messageText = effect.querySelector('#message-text');
        let messageIndex = 0;

        const cycleMessages = () => {
            messageText.textContent = messages[messageIndex % messages.length];
            messageIndex++;
            
            if (messageIndex < messages.length * 2) {
                setTimeout(cycleMessages, 3000);
            }
        };

        cycleMessages();
    }

    createScreenEffect(effect, virusData) {
        effect.innerHTML = `
            <div class="test-screen-effect" style="background: linear-gradient(45deg, ${virusData.color}33, transparent);">
                <div class="effect-content">
                    <div class="glitch-text" style="color: ${virusData.color};">
                        ${virusData.name.toUpperCase()}
                    </div>
                    <div class="effect-subtitle">
                        Created by ${virusData.author}
                    </div>
                    <div class="test-watermark">🧪 TEST MODE 🧪</div>
                </div>
            </div>
        `;

        // Add glitch animation class
        setTimeout(() => {
            effect.querySelector('.glitch-text')?.classList.add('glitch-animation');
        }, 500);
    }

    stopTest(windowId) {
        document.querySelectorAll('.test-virus-effect').forEach(el => el.remove());
        this.showHackerMessage('🛑 Test stopped!', 'info');
    }

    launchAttack(windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        const selectedTarget = container?.querySelector('.target-card.selected');
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
        attack.className = 'attack-sequence';
        attack.innerHTML = `
            <div class="attack-overlay">
                <div class="attack-terminal">
                    <div class="terminal-header">
                        <span>🔥 HACKER TERMINAL 🔥</span>
                        <button class="terminal-close">×</button>
                    </div>
                    <div class="terminal-content">
                        <div class="terminal-line">Initializing attack...</div>
                        <div class="terminal-line">Target: ${target}</div>
                        <div class="terminal-line">Weapon: ${virusData.name}</div>
                        <div class="terminal-line">Status: <span class="status-text">CONNECTING...</span></div>
                        <div class="progress-bar">
                            <div class="progress-fill"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(attack);

        // Close button
        attack.querySelector('.terminal-close').addEventListener('click', () => {
            attack.remove();
        });

        // Simulate attack progress
        const statusText = attack.querySelector('.status-text');
        const progressFill = attack.querySelector('.progress-fill');
        const terminalContent = attack.querySelector('.terminal-content');

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
            line.className = 'terminal-line';
            line.textContent = `> ${steps[step]}`;
            terminalContent.appendChild(line);

            step++;
            
            if (step < steps.length) {
                setTimeout(progressAttack, 1500);
            } else {
                // Attack complete
                setTimeout(() => {
                    const successLine = document.createElement('div');
                    successLine.className = 'terminal-line success';
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
        const selectedTarget = container?.querySelector('.target-card.selected');
        const virusSelect = container?.querySelector(`#attack-virus-select-${windowId}`);
        const preview = container?.querySelector(`#attack-preview-${windowId}`);
        
        if (!preview) return;
        
        if (selectedTarget && virusSelect?.value) {
            const target = selectedTarget.dataset.target;
            const virusData = this.savedViruses.get(virusSelect.value);
            
            if (virusData) {
                preview.innerHTML = `
                    <div class="attack-preview-card">
                        <div class="preview-header">🎯 Attack Preview</div>
                        <div class="preview-details">
                            <div class="detail-row">
                                <span>Target:</span>
                                <span>${target}</span>
                            </div>
                            <div class="detail-row">
                                <span>Virus:</span>
                                <span>${virusData.name}</span>
                            </div>
                            <div class="detail-row">
                                <span>Damage:</span>
                                <span>${this.getSeverityText(virusData.severity)}</span>
                            </div>
                            <div class="preview-message">
                                "${virusData.description}"
                            </div>
                        </div>
                    </div>
                `;
            }
        } else {
            preview.innerHTML = '<div class="preview-placeholder">Select target and virus to preview attack!</div>';
        }
    }

    populateSavedViruses(windowId) {
        const container = document.querySelector(`.virus-lab-container[data-window-id="${windowId}"]`);
        const gallery = container?.querySelector(`#virus-gallery-${windowId}`);
        if (!gallery) return;

        if (this.savedViruses.size === 0) {
            gallery.innerHTML = `
                <div class="empty-gallery">
                    <div class="empty-icon">🧪</div>
                    <div class="empty-text">No viruses created yet!</div>
                    <div class="empty-desc">Go to the Create tab to make your first virus!</div>
                </div>
            `;
            return;
        }

        const virusCards = Array.from(this.savedViruses.entries()).map(([id, virus]) => `
            <div class="virus-gallery-card" data-virus-id="${id}">
                <div class="card-header" style="background: ${virus.color};">
                    <div class="card-icon">${this.getVirusIcon(virus.type)}</div>
                    <div class="card-title">${virus.name}</div>
                </div>
                <div class="card-body">
                    <div class="card-info">
                        <div class="info-item">
                            <span class="label">Author:</span>
                            <span class="value">${virus.author}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Target:</span>
                            <span class="value">${virus.target || 'Anyone'}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Type:</span>
                            <span class="value">${this.getTypeText(virus.type)}</span>
                        </div>
                        <div class="card-description">${virus.description}</div>
                    </div>
                    <div class="card-actions">
                        <button class="test-card-btn" data-virus-id="${id}">🧪 Test</button>
                        <button class="delete-card-btn" data-virus-id="${id}">🗑️ Delete</button>
                    </div>
                </div>
            </div>
        `).join('');

        gallery.innerHTML = virusCards;

        // Handle card actions
        gallery.addEventListener('click', (e) => {
            const virusId = e.target.dataset.virusId;
            if (!virusId) return;

            if (e.target.classList.contains('test-card-btn')) {
                const virusData = this.savedViruses.get(virusId);
                if (virusData) {
                    this.createTestEffect(virusData);
                }
            } else if (e.target.classList.contains('delete-card-btn')) {
                if (confirm('Delete this virus?')) {
                    this.savedViruses.delete(virusId);
                    this.saveVirusesToStorage();
                    this.populateSavedViruses(windowId);
                    this.updateVirusCount(windowId);
                }
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
            'Sister': '👧',
            'Cousin Jake': '👦',
            'Mom': '👩',
            'Dad': '👨',
            'Best Friend': '😎',
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
        messageEl.className = `hacker-message ${type}`;
        messageEl.innerHTML = `
            <div class="message-content">
                <div class="message-icon">🔥</div>
                <div class="message-text">${message}</div>
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