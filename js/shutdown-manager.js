// =================================
// ENHANCED SHUTDOWN SYSTEM - ElxaOS Shutdown with Sound & Power Button
// =================================

class ShutdownManager {
    constructor() {
        this.isShuttingDown = false;
        this.shutdownSoundEnabled = true;
    }

    // Play shutdown sound
    async playShutdownSound() {
        if (!this.shutdownSoundEnabled) {
            console.log('🔇 Shutdown sound disabled');
            return;
        }

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create a gentle descending shutdown sound (opposite of startup)
            const notes = [
                { freq: 1046.50, start: 0.0, duration: 0.4 },    // C6
                { freq: 783.99, start: 0.3, duration: 0.4 },     // G5
                { freq: 659.25, start: 0.6, duration: 0.4 },     // E5
                { freq: 523.25, start: 0.9, duration: 0.6 }      // C5
            ];

            const masterGain = audioContext.createGain();
            masterGain.connect(audioContext.destination);
            masterGain.gain.setValueAtTime(0.25, audioContext.currentTime);

            notes.forEach(note => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(masterGain);
                
                oscillator.frequency.setValueAtTime(note.freq, audioContext.currentTime);
                oscillator.type = 'sine';
                
                // Smooth attack and release
                gainNode.gain.setValueAtTime(0, audioContext.currentTime + note.start);
                gainNode.gain.linearRampToValueAtTime(0.7, audioContext.currentTime + note.start + 0.05);
                gainNode.gain.setValueAtTime(0.7, audioContext.currentTime + note.start + note.duration - 0.15);
                gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + note.start + note.duration);
                
                oscillator.start(audioContext.currentTime + note.start);
                oscillator.stop(audioContext.currentTime + note.start + note.duration);
            });

            console.log('🔊 ElxaOS shutdown sound played');
            
        } catch (error) {
            console.warn('⚠️ Could not play shutdown sound:', error);
        }
    }

    // Show ElxaOS-styled confirmation dialog
    showShutdownConfirmation() {
        return ElxaUI.showConfirmDialog({
            title: `${ElxaIcons.renderAction('shutdown')} Shut Down ElxaOS`,
            message: 'Are you sure you want to shut down your computer?<br>Make sure to save any work before shutting down.',
            confirmText: 'Shut Down',
            cancelText: 'Cancel',
            confirmIcon: ElxaIcons.renderAction('power-off'),
            cancelIcon: ElxaIcons.renderAction('close')
        });
    }

    // Show shutdown screen with power off button
    showShutdownScreen() {
        // Play shutdown sound first
        this.playShutdownSound();

        // Create shutdown screen
        const elxaShutdownScreen = document.createElement('div');
        elxaShutdownScreen.className = 'elxa-shutdown-screen';
        elxaShutdownScreen.innerHTML = `
            <div class="elxa-shutdown-content">
                <div class="elxa-shutdown-logo">
                    <div class="elxa-shutdown-icon">${ElxaIcons.renderAction('power-off')}</div>
                    <div class="elxa-shutdown-title">ElxaOS</div>
                </div>
                <div class="elxa-shutdown-message">
                    <p>ElxaOS is shutting down...</p>
                    <p>It's now safe to turn off your computer.</p>
                </div>
                <div class="elxa-shutdown-progress">
                    <div class="elxa-shutdown-dots">
                        <span class="elxa-dot elxa-dot-1">●</span>
                        <span class="elxa-dot elxa-dot-2">●</span>
                        <span class="elxa-dot elxa-dot-3">●</span>
                    </div>
                </div>
                <button class="elxa-power-off-btn" id="elxaPowerOffBtn">
                    <span class="elxa-power-icon">${ElxaIcons.renderAction('shutdown')}</span>
                    <span class="elxa-power-text">Power Off</span>
                </button>
            </div>
        `;
        document.body.appendChild(elxaShutdownScreen);

        // Handle power off button click
        document.getElementById('elxaPowerOffBtn').addEventListener('click', () => {
            // Add clicking animation
            const btn = document.getElementById('elxaPowerOffBtn');
            btn.style.transform = 'scale(0.95)';
            btn.innerHTML = `
                <span class="elxa-power-icon">${ElxaIcons.renderAction('shutdown')}</span>
                <span class="elxa-power-text">Powering Off...</span>
            `;
            
            // Brief delay then reload
            setTimeout(() => {
                location.reload();
            }, 1000);
        });
    }

    // Show logout confirmation — mirrors showShutdownConfirmation pattern
    showLogoutConfirmation() {
        return ElxaUI.showConfirmDialog({
            title: `${ElxaIcons.renderAction('logout')} Log Out`,
            message: 'Are you sure you want to log out?<br>Make sure to save your work first!',
            confirmText: 'Log Out',
            cancelText: 'Cancel',
            confirmIcon: ElxaIcons.renderAction('logout'),
            cancelIcon: ElxaIcons.renderAction('close')
        });
    }
}
