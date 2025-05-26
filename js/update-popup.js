// =================================
// UPDATE POPUP SYSTEM - What's New notifications
// =================================
class UpdatePopup {
    constructor() {
        // VERSION CONTROL - Manually increment this to trigger the popup
        this.currentVersion = '4.0.1';
        
        this.isVisible = false;
        this.contentLoaded = false;
        this.updateContent = '';
        
        // Load the updates content
        this.loadUpdateContent();
    }

    // Check if we should show the update popup
    shouldShowUpdate() {
        try {
            const lastSeenVersion = localStorage.getItem('elxaOS-last-update-version');
            
            // If no version stored, or current version is different, show update
            if (!lastSeenVersion || lastSeenVersion !== this.currentVersion) {
                console.log(`🆕 Update available: ${lastSeenVersion || 'none'} → ${this.currentVersion}`);
                return true;
            }
            
            console.log(`✅ Update already seen: ${this.currentVersion}`);
            return false;
        } catch (error) {
            console.error('❌ Error checking update version:', error);
            return false;
        }
    }

    // Load update content from the updates.txt file
    async loadUpdateContent() {
        try {
            // Try to fetch the updates.txt file from the project directory
            const response = await fetch('updates.txt');
            
            if (response.ok) {
                const content = await response.text();
                this.updateContent = content;
                this.contentLoaded = true;
                console.log('📄 Update content loaded from updates.txt');
                return;
            } else {
                console.log('📄 updates.txt not found (HTTP ' + response.status + '), using default content');
            }
            
        } catch (error) {
            console.log('📄 Could not fetch updates.txt:', error.message);
        }
        
        // Fallback to default content if file not found or fetch failed
        this.updateContent = this.getDefaultUpdateContent();
        this.contentLoaded = true;
        console.log('📄 Using default update content');
    }

    // Default update content if no file is found
    getDefaultUpdateContent() {
        return `Welcome to ElxaOS ${this.currentVersion}! 🚀

What's New:
• Enhanced Boot System with BIOS Setup
• New Desktop Icon Management
• Improved File System
• Better Window Management
• Fun BIOS Features & Easter Eggs

Enjoy exploring your new operating system!`;
    }

    // Show the update popup
    async showUpdatePopup() {
        if (!this.shouldShowUpdate()) {
            return false;
        }

        // Wait for content to load if it hasn't yet
        if (!this.contentLoaded) {
            await this.waitForContent();
        }

        // Create and show the popup
        this.createPopup();
        this.isVisible = true;
        
        console.log('🆕 Showing update popup');
        return true;
    }

    // Wait for content to finish loading
    waitForContent() {
        return new Promise((resolve) => {
            const checkContent = () => {
                if (this.contentLoaded) {
                    resolve();
                } else {
                    setTimeout(checkContent, 100);
                }
            };
            checkContent();
        });
    }

    // Create the popup HTML
    createPopup() {
        // Remove any existing popup
        this.hideUpdatePopup();

        const popup = document.createElement('div');
        popup.id = 'updatePopup';
        popup.className = 'update-popup-overlay';

        popup.innerHTML = `
            <div class="update-popup-container">
                <div class="update-popup-header">
                    <div class="update-popup-title">
                        <span class="update-icon">🆕</span>
                        What's New in ElxaOS
                    </div>
                    <div class="update-popup-version">v${this.currentVersion}</div>
                </div>
                
                <div class="update-popup-content">
                    <div class="update-content-text">${this.formatUpdateContent(this.updateContent)}</div>
                </div>
                
                <div class="update-popup-footer">
                    <div class="update-popup-hint">Click anywhere to continue</div>
                </div>
            </div>
        `;

        // Add click handlers for dismissal
        popup.addEventListener('click', (e) => {
            this.dismissUpdate();
        });

        // Prevent event bubbling on the container to allow clicking inside
        popup.querySelector('.update-popup-container').addEventListener('click', (e) => {
            // Still allow dismissal when clicking the container itself
            if (e.target.classList.contains('update-popup-container') || 
                e.target.closest('.update-popup-header') || 
                e.target.closest('.update-popup-footer')) {
                this.dismissUpdate();
            }
        });

        // Add keyboard handler for ESC key
        document.addEventListener('keydown', this.handleKeyDown.bind(this));

        document.body.appendChild(popup);

        // Animate in
        setTimeout(() => {
            popup.classList.add('visible');
        }, 10);
    }

    // Format the update content (convert line breaks to HTML)
    formatUpdateContent(content) {
        return content
            .replace(/\n/g, '<br>')
            .replace(/•/g, '<span class="bullet">•</span>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    // Handle keyboard input
    handleKeyDown(e) {
        if (this.isVisible && e.key === 'Escape') {
            this.dismissUpdate();
        }
    }

    // Dismiss the update popup
    dismissUpdate() {
        const popup = document.getElementById('updatePopup');
        if (popup) {
            popup.classList.remove('visible');
            popup.classList.add('hiding');
            
            setTimeout(() => {
                popup.remove();
                this.isVisible = false;
                
                // Mark this version as seen
                this.markUpdateAsSeen();
                
                // Continue with login screen
                this.continueToLogin();
                
            }, 300); // Match animation duration
        }

        // Remove keyboard listener
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }

    // Mark the current version as seen
    markUpdateAsSeen() {
        try {
            localStorage.setItem('elxaOS-last-update-version', this.currentVersion);
            console.log(`✅ Update ${this.currentVersion} marked as seen`);
        } catch (error) {
            console.error('❌ Error saving update version:', error);
        }
    }

    // Continue to login screen after dismissing update
    continueToLogin() {
        if (elxaOS && elxaOS.loginService) {
            elxaOS.loginService.showLoginScreen();
        } else {
            console.error('❌ ElxaOS or login service not available');
        }
    }

    // Hide the popup without marking as seen (for programmatic hiding)
    hideUpdatePopup() {
        const popup = document.getElementById('updatePopup');
        if (popup) {
            popup.remove();
            this.isVisible = false;
        }
    }

    // Manual method to force show update (for testing)
    forceShowUpdate() {
        console.log('🔧 Forcing update popup display');
        localStorage.removeItem('elxaOS-last-update-version');
        this.showUpdatePopup();
    }

    // Manual method to reset update status
    resetUpdateStatus() {
        localStorage.removeItem('elxaOS-last-update-version');
        console.log('🔄 Update status reset');
    }

    // Get current version info
    getVersionInfo() {
        const lastSeen = localStorage.getItem('elxaOS-last-update-version');
        return {
            currentVersion: this.currentVersion,
            lastSeenVersion: lastSeen,
            shouldShow: this.shouldShowUpdate()
        };
    }
}