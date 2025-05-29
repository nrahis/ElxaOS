// =================================
// SYSTEM 0 - The Cursed Mode
// =================================

class System0 {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.isActive = false;
        this.glitchInterval = null;
        this.corruptionLevel = 0;
        this.secretSequence = ['duck', 'snake', 'cat', 'zero']; // Command sequence to activate
        this.commandHistory = [];
        this.originalState = {};
        
        // Cursed messages that appear randomly
        this.cursedMessages = [
            "SYSTEM_0_AWAKENS",
            "PUSHING_CAT_WAS_HERE",
            "MR_SNAKE_E_KNOWS",
            "THE_SUSSY_LAIR_CALLS",
            "SNAKESIA_TIME_ERROR",
            "REMI_IS_WATCHING",
            "RITA_TRIED_TO_WARN_YOU",
            "DENALI.EXE_STOPPED_WORKING",
            "2_HOURS_1_MINUTE_OFF",
            "ERROR_404_BELLY_BUTTON_NOT_FOUND",
            "SYSTEM_INTEGRITY_COMPROMISED",
            "WELCOME_TO_THE_VOID"
        ];
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for console commands
        this.eventBus.on('console.command', (data) => {
            if (data && data.command) {
                this.checkCommandSequence(data.command.toLowerCase());
            }
        });
        
        // Listen for escape sequence
        document.addEventListener('keydown', (e) => {
            if (this.isActive && e.ctrlKey && e.shiftKey && e.key === 'X') {
                this.deactivate();
            }
        });
    }
    
    checkCommandSequence(command) {
        // Add command to history
        this.commandHistory.push(command);
        
        // Keep only last N commands where N is sequence length
        if (this.commandHistory.length > this.secretSequence.length) {
            this.commandHistory.shift();
        }
        
        // Check if the last commands match our secret sequence
        if (this.commandHistory.length === this.secretSequence.length) {
            const matches = this.commandHistory.every((cmd, idx) => 
                cmd === this.secretSequence[idx]
            );
            
            if (matches && !this.isActive) {
                this.activate();
            }
        }
    }
    
    activate() {
        if (this.isActive) return;
        
        console.log('🔴 SYSTEM 0 ACTIVATED 🔴');
        this.isActive = true;
        
        // Store original state
        this.storeOriginalState();
        
        // Add System 0 class to body
        document.body.classList.add('sys0-active');
        
        // Create overlay
        this.createOverlay();
        
        // Start corruption effects
        this.startGlitchEffects();
        this.corruptDesktopIcons();
        this.modifySystemClock();
        this.injectCursedElements();
        
        // Play activation sound (if available)
        this.playSound('activate');
        
        // Show warning message
        this.showCursedMessage('SYSTEM_0_ACTIVATED', true);
        
        // Emit event
        this.eventBus.emit('system0.activated');
    }
    
    deactivate() {
        if (!this.isActive) return;
        
        console.log('✅ SYSTEM 0 DEACTIVATED ✅');
        this.isActive = false;
        
        // Stop all effects
        this.stopGlitchEffects();
        
        // Remove System 0 class
        document.body.classList.remove('sys0-active');
        
        // Remove overlay
        const overlay = document.querySelector('.sys0-overlay');
        if (overlay) overlay.remove();
        
        // Restore original state
        this.restoreOriginalState();
        
        // Clear command history
        this.commandHistory = [];
        this.corruptionLevel = 0;
        
        // Play deactivation sound
        this.playSound('deactivate');
        
        // Show exit message
        this.showSystemMessage('System restored to normal mode', 'success');
        
        // Emit event
        this.eventBus.emit('system0.deactivated');
    }
    
    createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'sys0-overlay';
        overlay.innerHTML = `
            <div class="sys0-static"></div>
            <div class="sys0-scanlines"></div>
            <div class="sys0-corruption-indicator">
                <span class="sys0-corruption-text">SYSTEM_0</span>
                <div class="sys0-corruption-bar">
                    <div class="sys0-corruption-fill"></div>
                </div>
            </div>
            <div class="sys0-exit-hint">Press Ctrl+Shift+X to exit</div>
        `;
        document.body.appendChild(overlay);
    }
    
    startGlitchEffects() {
        // Random glitch effects
        this.glitchInterval = setInterval(() => {
            this.applyRandomGlitch();
            this.corruptionLevel = Math.min(100, this.corruptionLevel + 1);
            this.updateCorruptionIndicator();
            
            // Random cursed messages
            if (Math.random() < 0.1) {
                this.showCursedMessage(
                    this.cursedMessages[Math.floor(Math.random() * this.cursedMessages.length)]
                );
            }
            
            // Random cursor changes
            if (Math.random() < 0.05) {
                this.glitchCursor();
            }
        }, 1000);
        
        // Screen flicker
        this.flickerInterval = setInterval(() => {
            if (Math.random() < 0.3) {
                document.body.classList.add('sys0-flicker');
                setTimeout(() => {
                    document.body.classList.remove('sys0-flicker');
                }, 100);
            }
        }, 2000);
    }
    
    stopGlitchEffects() {
        clearInterval(this.glitchInterval);
        clearInterval(this.flickerInterval);
        
        // Remove all cursed elements
        document.querySelectorAll('.sys0-cursed-element').forEach(el => el.remove());
        document.querySelectorAll('.sys0-glitch-text').forEach(el => el.remove());
        document.querySelectorAll('.sys0-message').forEach(el => el.remove());
    }
    
    applyRandomGlitch() {
        const glitchTypes = [
            () => this.glitchText(),
            () => this.invertColors(),
            () => this.shakeScreen(),
            () => this.distortWindows(),
            () => this.corruptTaskbar()
        ];
        
        const glitch = glitchTypes[Math.floor(Math.random() * glitchTypes.length)];
        glitch();
    }
    
    glitchText() {
        const elements = document.querySelectorAll('.window-title, .desktop-icon-label, .start-menu-item');
        const target = elements[Math.floor(Math.random() * elements.length)];
        
        if (target && !target.classList.contains('sys0-glitched')) {
            target.classList.add('sys0-glitched');
            const original = target.textContent;
            
            // Corrupt the text
            const corrupted = this.corruptString(original);
            target.textContent = corrupted;
            
            // Sometimes restore it
            if (Math.random() < 0.5) {
                setTimeout(() => {
                    target.textContent = original;
                    target.classList.remove('sys0-glitched');
                }, 2000);
            }
        }
    }
    
    corruptString(str) {
        const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`ΣΩΔ₹¥€£₩';
        return str.split('').map(char => 
            Math.random() < 0.3 ? chars[Math.floor(Math.random() * chars.length)] : char
        ).join('');
    }
    
    invertColors() {
        document.body.classList.add('sys0-invert');
        setTimeout(() => {
            document.body.classList.remove('sys0-invert');
        }, 200);
    }
    
    shakeScreen() {
        document.body.classList.add('sys0-shake');
        setTimeout(() => {
            document.body.classList.remove('sys0-shake');
        }, 500);
    }
    
    distortWindows() {
        const windows = document.querySelectorAll('.window');
        windows.forEach(win => {
            if (Math.random() < 0.3) {
                win.classList.add('sys0-distort');
                setTimeout(() => {
                    win.classList.remove('sys0-distort');
                }, 1000);
            }
        });
    }
    
    corruptTaskbar() {
        const taskbar = document.querySelector('.taskbar');
        if (taskbar && Math.random() < 0.2) {
            taskbar.classList.add('sys0-corrupt-taskbar');
            setTimeout(() => {
                taskbar.classList.remove('sys0-corrupt-taskbar');
            }, 800);
        }
    }
    
    corruptDesktopIcons() {
        const icons = document.querySelectorAll('.desktop-icon');
        icons.forEach((icon, index) => {
            setTimeout(() => {
                if (Math.random() < 0.6) {
                    icon.classList.add('sys0-corrupt-icon');
                    
                    // Sometimes change the icon
                    const iconImage = icon.querySelector('.desktop-icon-image');
                    if (iconImage && Math.random() < 0.3) {
                        iconImage.textContent = '👁️';
                    }
                }
            }, index * 100);
        });
    }
    
    modifySystemClock() {
        const clock = document.getElementById('clock');
        if (clock) {
            // Check if clockSystem exists and has the right method
            if (elxaOS && elxaOS.clockSystem && elxaOS.clockSystem.updateTaskbarClock) {
                // Store the original method (it's called updateTaskbarClock, not updateClock)
                this.originalState.clockUpdate = elxaOS.clockSystem.updateTaskbarClock.bind(elxaOS.clockSystem);
                
                // Override clock update
                elxaOS.clockSystem.updateTaskbarClock = () => {
                    const now = new Date();
                    // Create Snakesia time (2 hours 1 minute ahead of local time)
                    const snakesiaTime = new Date(now.getTime() + (2 * 60 + 1) * 60 * 1000);
                    const hours = String(snakesiaTime.getHours()).padStart(2, '0');
                    const minutes = String(snakesiaTime.getMinutes()).padStart(2, '0');
                    
                    // Sometimes show corrupted time for extra spookiness
                    if (Math.random() < 0.2) {
                        clock.textContent = '??:??';
                    } else {
                        clock.textContent = `${hours}:${minutes}`;
                    }
                    
                    // Add glitch effect
                    clock.classList.add('sys0-time-glitch');
                };
                
                // Apply the change immediately
                elxaOS.clockSystem.updateTaskbarClock();
            } else {
                console.log('🔴 Clock system not found, using direct clock manipulation');
                // Fallback: directly manipulate the clock element
                this.directClockInterval = setInterval(() => {
                    const now = new Date();
                    const snakesiaTime = new Date(now.getTime() + (2 * 60 + 1) * 60 * 1000);
                    const hours = String(snakesiaTime.getHours()).padStart(2, '0');
                    const minutes = String(snakesiaTime.getMinutes()).padStart(2, '0');
                    
                    if (Math.random() < 0.2) {
                        clock.textContent = '??:??';
                    } else {
                        clock.textContent = `${hours}:${minutes}`;
                    }
                    
                    clock.classList.add('sys0-time-glitch');
                }, 1000);
            }
        }
    }
    
    injectCursedElements() {
        // Floating Pushing Cat eyes
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const eye = document.createElement('div');
                eye.className = 'sys0-cursed-element sys0-floating-eye';
                eye.textContent = '👁️';
                eye.style.left = Math.random() * window.innerWidth + 'px';
                eye.style.top = Math.random() * window.innerHeight + 'px';
                document.body.appendChild(eye);
            }, i * 500);
        }
        
        // Hidden Sussy Lair entrance
        const lair = document.createElement('div');
        lair.className = 'sys0-cursed-element sys0-sussy-lair';
        lair.textContent = '🕳️';
        lair.title = 'The Sussy Lair...';
        lair.onclick = () => this.enterSussyLair();
        document.body.appendChild(lair);
    }
    
    enterSussyLair() {
        this.showCursedMessage('PUSHING_CAT_SAYS_HELLO', true);
        document.body.classList.add('sys0-sussy-mode');
        
        // Add Pushing Cat everywhere
        for (let i = 0; i < 10; i++) {
            const cat = document.createElement('div');
            cat.className = 'sys0-pushing-cat';
            cat.textContent = '🐈‍⬛';
            cat.style.left = Math.random() * window.innerWidth + 'px';
            cat.style.top = Math.random() * window.innerHeight + 'px';
            document.body.appendChild(cat);
            
            // Make them move towards cursor
            cat.addEventListener('mouseover', () => {
                cat.style.transform = 'scale(1.5) rotate(360deg)';
                setTimeout(() => cat.remove(), 1000);
            });
        }
        
        setTimeout(() => {
            document.body.classList.remove('sys0-sussy-mode');
        }, 5000);
    }
    
    glitchCursor() {
        const cursors = ['crosshair', 'not-allowed', 'wait', 'help', 'move'];
        document.body.style.cursor = cursors[Math.floor(Math.random() * cursors.length)];
        
        setTimeout(() => {
            if (this.isActive) {
                document.body.style.cursor = 'default';
            }
        }, 2000);
    }
    
    showCursedMessage(message, important = false) {
        const msg = document.createElement('div');
        msg.className = `sys0-message ${important ? 'sys0-important' : ''}`;
        msg.textContent = message;
        msg.style.left = Math.random() * (window.innerWidth - 200) + 'px';
        msg.style.top = Math.random() * (window.innerHeight - 100) + 'px';
        document.body.appendChild(msg);
        
        setTimeout(() => msg.remove(), important ? 5000 : 3000);
    }
    
    updateCorruptionIndicator() {
        const fill = document.querySelector('.sys0-corruption-fill');
        if (fill) {
            fill.style.width = this.corruptionLevel + '%';
            
            // Change color based on corruption level
            if (this.corruptionLevel > 75) {
                fill.style.background = '#ff0000';
            } else if (this.corruptionLevel > 50) {
                fill.style.background = '#ff8800';
            } else if (this.corruptionLevel > 25) {
                fill.style.background = '#ffff00';
            }
        }
    }
    
    storeOriginalState() {
        // Store various states to restore later
        this.originalState.bodyClasses = [...document.body.classList];
        this.originalState.cursor = document.body.style.cursor;
    }
    
    restoreOriginalState() {
        // Restore cursor
        document.body.style.cursor = this.originalState.cursor || 'default';
        
        // Restore clock if it was modified
        if (this.originalState.clockUpdate && elxaOS && elxaOS.clockSystem) {
            elxaOS.clockSystem.updateTaskbarClock = this.originalState.clockUpdate;
            elxaOS.clockSystem.updateTaskbarClock();
        }
        
        // Clear direct clock interval if it was used
        if (this.directClockInterval) {
            clearInterval(this.directClockInterval);
            this.directClockInterval = null;
            
            // Restore normal clock display
            const clock = document.getElementById('clock');
            if (clock) {
                const now = new Date();
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                clock.textContent = `${hours}:${minutes}`;
                clock.classList.remove('sys0-time-glitch');
            }
        }
        
        // Remove all System 0 classes
        document.querySelectorAll('[class*="sys0-"]').forEach(el => {
            if (el.className.includes('sys0-cursed-element') || 
                el.className.includes('sys0-pushing-cat')) {
                el.remove();
            } else {
                // Remove sys0 classes but keep the element
                const classes = el.className.split(' ').filter(c => !c.startsWith('sys0-'));
                el.className = classes.join(' ');
            }
        });
        
        // Restore corrupted text
        document.querySelectorAll('.sys0-glitched').forEach(el => {
            el.classList.remove('sys0-glitched');
        });
    }
    
    playSound(type) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            if (type === 'activate') {
                // Descending ominous tone
                oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(110, audioContext.currentTime + 0.5);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            } else {
                // Ascending relief tone
                oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.3);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            }
            
            oscillator.type = 'sine';
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Could not play sound:', e);
        }
    }
    
    showSystemMessage(text, type) {
        if (elxaOS && elxaOS.showSystemMessage) {
            elxaOS.showSystemMessage(text, type);
        }
    }
}