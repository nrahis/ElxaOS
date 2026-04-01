// =================================
// NOTIFICATION SERVICE
// =================================
// System tray notification center (bell icon → slide-out panel)
// with desktop toast popups and badge indicator.
// Registry-backed, per-user persistence.

const NOTIFICATION_MAX = 50;
const TOAST_DURATION_DEFAULT = 5000;
const TOAST_DURATION_CRITICAL = 8000;
const TOAST_MAX_VISIBLE = 3;

class NotificationService {
    constructor(eventBus, registry) {
        this.eventBus = eventBus;
        this.registry = registry;

        // In-memory state
        this._notifications = [];
        this._ready = false;
        this._panelOpen = false;
        this._activeToasts = [];

        this._setupEventListeners();
        this._setupUI();

        console.log('🔔 NotificationService initialized');
    }

    // =================================
    // LIFECYCLE
    // =================================

    _setupEventListeners() {
        // Load notifications when user logs in
        this.eventBus.on('registry.userLoaded', async () => {
            await this._loadData();
        });

        // Clear on logout
        this.eventBus.on('login.logout', () => {
            this._notifications = [];
            this._ready = false;
            this._panelOpen = false;
            this.hidePanel();
            this._updateBadge();
        });

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!this._panelOpen) return;
            const panel = document.getElementById('notificationPanel');
            const icon = document.getElementById('notificationIcon');
            if (panel && !panel.contains(e.target) && icon && !icon.contains(e.target)) {
                this.hidePanel();
            }
        });
    }

    _setupUI() {
        // Wire the bell icon click
        const icon = document.getElementById('notificationIcon');
        if (icon) {
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePanel();
            });
        }
    }

    /**
     * Called during ElxaOS async init. If a user is already logged in
     * (session restore), load notification data immediately.
     */
    async init() {
        if (this.registry.isLoggedIn()) {
            await this._loadData();
        }
        console.log('🔔 NotificationService ready');
    }

    // =================================
    // DATA LOADING / SAVING
    // =================================

    async _loadData() {
        const username = this.registry.getCurrentUsername();
        if (!username) return;

        const existing = await this.registry.getState('notifications');

        if (existing && existing.items) {
            this._notifications = existing.items;
            this._ready = true;
            console.log(`🔔 Notifications loaded for "${username}" — ${this._notifications.length} items, ${this.getUnreadCount()} unread`);
        } else {
            this._notifications = [];
            await this._save();
            this._ready = true;
            console.log(`🔔 Created empty notification store for "${username}"`);
        }

        this._updateBadge();
    }

    async _save() {
        if (!this.registry.isLoggedIn()) return;
        await this.registry.setState('notifications', {
            items: this._notifications,
            lastCleared: this._lastCleared || null
        });
    }

    // =================================
    // CORE API
    // =================================

    /**
     * Add a notification.
     * @param {object} options
     * @param {string} options.title - e.g. "Missed Payment"
     * @param {string} options.body - e.g. "Credit card minimum payment missed."
     * @param {string} [options.icon='mdi-bell'] - MDI icon class
     * @param {string} [options.category='system'] - 'finance' | 'system' | 'email' | 'employment'
     * @param {string} [options.urgency='info'] - 'info' | 'warning' | 'critical'
     * @param {object|null} [options.action=null] - click action: { type: 'launch', program: '...', args: ... }
     * @param {boolean} [options.toast] - show desktop toast (default: true for warning/critical)
     * @returns {string} notification ID
     */
    addNotification(options) {
        const {
            title,
            body,
            icon = 'mdi-bell',
            category = 'system',
            urgency = 'info',
            action = null,
            toast
        } = options;

        const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

        const notification = {
            id,
            title,
            body,
            icon,
            category,
            urgency,
            read: false,
            timestamp: new Date().toISOString(),
            action
        };

        // Add to front (most recent first)
        this._notifications.unshift(notification);

        // Prune oldest if over cap
        if (this._notifications.length > NOTIFICATION_MAX) {
            this._notifications = this._notifications.slice(0, NOTIFICATION_MAX);
        }

        // Persist
        this._save();

        // Update badge
        this._updateBadge();

        // Re-render panel if it's open
        if (this._panelOpen) {
            this._renderPanel();
        }

        // Show toast if appropriate
        const shouldToast = toast !== undefined ? toast : (urgency === 'warning' || urgency === 'critical');
        if (shouldToast) {
            this._showToast(notification);
        }

        // Emit event for other systems
        this.eventBus.emit('notification.added', { id, category, urgency });

        return id;
    }

    markRead(notificationId) {
        const notif = this._notifications.find(n => n.id === notificationId);
        if (notif && !notif.read) {
            notif.read = true;
            this._save();
            this._updateBadge();
            if (this._panelOpen) this._renderPanel();
        }
    }

    markAllRead() {
        let changed = false;
        for (const n of this._notifications) {
            if (!n.read) {
                n.read = true;
                changed = true;
            }
        }
        if (changed) {
            this._save();
            this._updateBadge();
            if (this._panelOpen) this._renderPanel();
        }
    }

    dismissNotification(id) {
        const idx = this._notifications.findIndex(n => n.id === id);
        if (idx !== -1) {
            this._notifications.splice(idx, 1);
            this._save();
            this._updateBadge();
            if (this._panelOpen) this._renderPanel();
        }
    }

    clearAll() {
        this._notifications = [];
        this._lastCleared = new Date().toISOString();
        this._save();
        this._updateBadge();
        if (this._panelOpen) this._renderPanel();
    }

    getUnreadCount() {
        return this._notifications.filter(n => !n.read).length;
    }

    getNotifications(limit = 50) {
        return this._notifications.slice(0, limit);
    }

    // =================================
    // PANEL UI
    // =================================

    togglePanel() {
        if (this._panelOpen) {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    }

    showPanel() {
        // Close start menu if open
        if (elxaOS && elxaOS.taskbar) {
            elxaOS.taskbar.hideStartMenu();
        }

        let panel = document.getElementById('notificationPanel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'notificationPanel';
            panel.className = 'notification-panel';
            document.body.appendChild(panel);
        }

        this._renderPanel();
        panel.classList.add('notification-panel-open');
        this._panelOpen = true;
    }

    hidePanel() {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.classList.remove('notification-panel-open');
        }
        this._panelOpen = false;
    }

    _renderPanel() {
        const panel = document.getElementById('notificationPanel');
        if (!panel) return;

        const unreadCount = this.getUnreadCount();
        const notifications = this.getNotifications();

        let headerButtons = '';
        if (notifications.length > 0) {
            headerButtons = `
                <div class="notification-panel-actions">
                    ${unreadCount > 0 ? '<button class="notif-action-btn" data-action="markAllRead">Mark all read</button>' : ''}
                    <button class="notif-action-btn" data-action="clearAll">Clear all</button>
                </div>
            `;
        }

        let itemsHtml = '';
        if (notifications.length === 0) {
            itemsHtml = '<div class="notification-empty">No notifications</div>';
        } else {
            for (const n of notifications) {
                const readClass = n.read ? '' : ' notification-item-unread';
                const urgencyClass = n.urgency === 'critical' ? ' notification-item-critical' :
                                     n.urgency === 'warning' ? ' notification-item-warning' : '';
                const timeStr = this._formatTime(n.timestamp);

                itemsHtml += `
                    <div class="notification-item${readClass}${urgencyClass}" data-id="${n.id}">
                        <div class="notification-item-icon">
                            <span class="mdi ${n.icon} elxa-icon-ui"></span>
                        </div>
                        <div class="notification-item-content">
                            <div class="notification-item-title">${this._escapeHtml(n.title)}</div>
                            <div class="notification-item-body">${this._escapeHtml(n.body)}</div>
                            <div class="notification-item-time">${timeStr}</div>
                        </div>
                        <button class="notification-item-dismiss" data-dismiss="${n.id}" title="Dismiss">&times;</button>
                    </div>
                `;
            }
        }

        panel.innerHTML = `
            <div class="notification-panel-header">
                <span class="notification-panel-title">Notifications${unreadCount > 0 ? ' (' + unreadCount + ')' : ''}</span>
                ${headerButtons}
            </div>
            <div class="notification-panel-list">
                ${itemsHtml}
            </div>
        `;

        // Wire up event handlers
        panel.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't trigger if clicking dismiss button
                if (e.target.closest('.notification-item-dismiss')) return;

                const id = item.dataset.id;
                this.markRead(id);

                const notif = this._notifications.find(n => n.id === id);
                if (notif && notif.action) {
                    this._executeAction(notif.action);
                }
            });
        });

        panel.querySelectorAll('.notification-item-dismiss').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.dismissNotification(btn.dataset.dismiss);
            });
        });

        const markAllBtn = panel.querySelector('[data-action="markAllRead"]');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', () => this.markAllRead());
        }

        const clearAllBtn = panel.querySelector('[data-action="clearAll"]');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAll());
        }
    }

    // =================================
    // TOAST POPUPS
    // =================================

    _showToast(notification) {
        const toast = document.createElement('div');
        toast.className = `notification-toast notification-toast-${notification.urgency}`;
        toast.innerHTML = `
            <div class="notification-toast-icon">
                <span class="mdi ${notification.icon} elxa-icon-ui"></span>
            </div>
            <div class="notification-toast-content">
                <div class="notification-toast-title">${this._escapeHtml(notification.title)}</div>
                <div class="notification-toast-body">${this._escapeHtml(notification.body)}</div>
            </div>
        `;

        // Click to open panel (or execute action)
        toast.addEventListener('click', () => {
            this._removeToast(toast);
            if (notification.action) {
                this._executeAction(notification.action);
            } else {
                this.showPanel();
            }
            this.markRead(notification.id);
        });

        document.body.appendChild(toast);
        this._activeToasts.push(toast);

        // Enforce max visible toasts
        while (this._activeToasts.length > TOAST_MAX_VISIBLE) {
            this._removeToast(this._activeToasts[0]);
        }

        // Position toasts from bottom-right, stacking upward
        this._repositionToasts();

        // Trigger slide-in animation
        requestAnimationFrame(() => {
            toast.classList.add('notification-toast-visible');
        });

        // Auto-dismiss
        const duration = notification.urgency === 'critical' ? TOAST_DURATION_CRITICAL : TOAST_DURATION_DEFAULT;
        setTimeout(() => {
            this._removeToast(toast);
        }, duration);
    }

    _removeToast(toast) {
        const idx = this._activeToasts.indexOf(toast);
        if (idx !== -1) {
            this._activeToasts.splice(idx, 1);
        }
        toast.classList.remove('notification-toast-visible');
        toast.classList.add('notification-toast-fading');
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
            this._repositionToasts();
        }, 300);
    }

    _repositionToasts() {
        const taskbarHeight = 30;
        const gap = 8;
        let bottomOffset = taskbarHeight + gap;

        for (let i = this._activeToasts.length - 1; i >= 0; i--) {
            const t = this._activeToasts[i];
            t.style.bottom = bottomOffset + 'px';
            bottomOffset += t.offsetHeight + gap;
        }
    }

    // =================================
    // BADGE
    // =================================

    _updateBadge() {
        const icon = document.getElementById('notificationIcon');
        if (!icon) return;

        const count = this.getUnreadCount();

        // Update bell icon style
        let badge = icon.querySelector('.notification-badge');

        if (count > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'notification-badge';
                icon.appendChild(badge);
            }
            badge.textContent = count > 9 ? '9+' : count;
            badge.classList.add('notification-badge-pulse');
            setTimeout(() => badge.classList.remove('notification-badge-pulse'), 600);
        } else {
            if (badge) badge.remove();
        }
    }

    // =================================
    // HELPERS
    // =================================

    _executeAction(action) {
        if (!action) return;
        if (action.type === 'launch' && action.program) {
            const args = action.url ? action.url : (action.args || null);
            elxaOS.eventBus.emit('program.launch', { program: action.program, args });
        }
    }

    _formatTime(isoString) {
        try {
            const date = new Date(isoString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return diffMins + 'm ago';
            if (diffHours < 24) return diffHours + 'h ago';
            if (diffDays < 7) return diffDays + 'd ago';

            return date.toLocaleDateString();
        } catch {
            return '';
        }
    }

    _escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}
