// =================================
// ELXA UI — Shared UI utilities
// =================================
// Toast notifications, shared dialogs, and common UI patterns.
// Loaded early (after elxa-core.js) so all programs and services can use it.

const ElxaUI = {

    // =========================================================
    // Toast Notification
    // =========================================================
    // Usage: ElxaUI.showMessage('Saved!', 'success')
    // Types: 'info', 'success', 'warning', 'error'

    showMessage(text, type = 'info') {
        const message = document.createElement('div');
        message.className = `elxa-toast elxa-toast-${type}`;
        message.textContent = text;

        document.body.appendChild(message);

        // Stack below any existing toasts
        const existingToasts = document.querySelectorAll('.elxa-toast');
        let topOffset = 50;
        existingToasts.forEach(t => {
            if (t !== message) {
                const rect = t.getBoundingClientRect();
                topOffset = Math.max(topOffset, rect.bottom + 6);
            }
        });
        message.style.top = topOffset + 'px';

        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 3000);
    },

    // =========================================================
    // Dialog System
    // =========================================================
    // Low-level builder. Returns { dialog, close }.
    //
    // Usage:
    //   const { dialog, close } = ElxaUI.createDialog({
    //       title: '📁 New Folder',
    //       body: '<label>Name:</label><input ...>',
    //       buttons: [
    //           { text: 'Create', className: 'elxa-dialog-btn-primary', onClick: () => { ... } },
    //           { text: 'Cancel', className: 'elxa-dialog-btn', onClick: 'close' }
    //       ],
    //       className: 'my-extra-class',   // optional, added to the dialog box
    //       overlay: true                   // default true — dark backdrop
    //   });

    createDialog({ title = '', body = '', buttons = [], className = '', overlay = true }) {
        const wrapper = document.createElement('div');
        wrapper.className = 'elxa-dialog-overlay';
        if (!overlay) {
            wrapper.style.background = 'none';
            wrapper.style.pointerEvents = 'none';
        }

        const dialogBox = document.createElement('div');
        dialogBox.className = `elxa-dialog ${className}`.trim();
        if (!overlay) dialogBox.style.pointerEvents = 'auto';

        // Header
        const header = document.createElement('div');
        header.className = 'elxa-dialog-header';
        header.innerHTML = `
            <div class="elxa-dialog-title">${title}</div>
            <div class="elxa-dialog-close">×</div>
        `;

        // Body
        const bodyEl = document.createElement('div');
        bodyEl.className = 'elxa-dialog-body';
        if (typeof body === 'string') {
            bodyEl.innerHTML = body;
        } else {
            bodyEl.appendChild(body);
        }

        // Buttons
        const btnBar = document.createElement('div');
        btnBar.className = 'elxa-dialog-buttons';
        buttons.forEach(btn => {
            const b = document.createElement('button');
            b.className = btn.className || 'elxa-dialog-btn';
            b.innerHTML = btn.text;
            if (btn.onClick === 'close') {
                b.addEventListener('click', close);
            } else if (typeof btn.onClick === 'function') {
                b.addEventListener('click', btn.onClick);
            }
            btnBar.appendChild(b);
        });

        dialogBox.appendChild(header);
        dialogBox.appendChild(bodyEl);
        if (buttons.length) dialogBox.appendChild(btnBar);
        wrapper.appendChild(dialogBox);
        document.body.appendChild(wrapper);

        // Close helper
        function close() {
            if (wrapper.parentNode) wrapper.remove();
        }

        // Wire up close button & Escape key
        header.querySelector('.elxa-dialog-close').addEventListener('click', close);
        const onKey = (e) => {
            if (e.key === 'Escape') {
                close();
                document.removeEventListener('keydown', onKey);
            }
        };
        document.addEventListener('keydown', onKey);

        return { dialog: wrapper, dialogBox, bodyEl, close };
    },

    // =========================================================
    // Input Dialog (text prompt)
    // =========================================================
    // Returns a Promise that resolves with the entered string, or null if cancelled.
    //
    // Usage:
    //   const name = await ElxaUI.showInputDialog({
    //       title: '📁 New Folder',
    //       label: 'Folder name:',
    //       value: 'New Folder',
    //       placeholder: 'Enter folder name',
    //       confirmText: 'Create'
    //   });
    //   if (name !== null) { /* user confirmed */ }

    showInputDialog({ title = 'Input', label = '', value = '', placeholder = '', confirmText = 'OK' }) {
        return new Promise((resolve) => {
            let resolved = false;

            const inputHtml = `
                <label class="elxa-dialog-label">${label}</label>
                <input type="text" class="elxa-dialog-input" value="${value.replace(/"/g, '&quot;')}" placeholder="${placeholder}">
            `;

            const confirm = () => {
                if (resolved) return;
                resolved = true;
                const val = dlg.bodyEl.querySelector('.elxa-dialog-input').value.trim();
                dlg.close();
                resolve(val || null);
            };

            const cancel = () => {
                if (resolved) return;
                resolved = true;
                dlg.close();
                resolve(null);
            };

            const dlg = ElxaUI.createDialog({
                title,
                body: inputHtml,
                buttons: [
                    { text: confirmText, className: 'elxa-dialog-btn-primary', onClick: confirm },
                    { text: 'Cancel', className: 'elxa-dialog-btn', onClick: cancel }
                ]
            });

            // Override the default Escape-close to resolve null
            const origClose = dlg.close;
            dlg.close = () => {
                if (!resolved) { resolved = true; resolve(null); }
                origClose();
            };
            // Re-wire the header close button
            dlg.dialogBox.querySelector('.elxa-dialog-close').onclick = dlg.close;

            // Focus and select the input
            const input = dlg.bodyEl.querySelector('.elxa-dialog-input');
            input.focus();
            input.select();

            // Enter = confirm, Escape = cancel
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') confirm();
                if (e.key === 'Escape') cancel();
            });
        });
    },

    // =========================================================
    // Confirm Dialog (yes/no)
    // =========================================================
    // Returns a Promise that resolves true (confirm) or false (cancel).
    //
    // Usage:
    //   const yes = await ElxaUI.showConfirmDialog({
    //       title: '⚡ Shut Down ElxaOS',
    //       message: 'Are you sure you want to shut down?',
    //       confirmText: 'Shut Down',
    //       cancelText: 'Cancel',
    //       confirmIcon: '🔌',
    //       cancelIcon: '❌',
    //       confirmClass: 'elxa-dialog-btn-danger'  // optional, default 'elxa-dialog-btn-primary'
    //   });

    showConfirmDialog({ title = 'Confirm', message = '', confirmText = 'OK', cancelText = 'Cancel', confirmIcon = '', cancelIcon = '', confirmClass = 'elxa-dialog-btn-primary' }) {
        return new Promise((resolve) => {
            let resolved = false;

            const bodyHtml = `<p class="elxa-dialog-message">${message}</p>`;

            const confirm = () => {
                if (resolved) return;
                resolved = true;
                dlg.close();
                resolve(true);
            };

            const cancel = () => {
                if (resolved) return;
                resolved = true;
                dlg.close();
                resolve(false);
            };

            const cLabel = confirmIcon ? `${confirmIcon} ${confirmText}` : confirmText;
            const xLabel = cancelIcon ? `${cancelIcon} ${cancelText}` : cancelText;

            const dlg = ElxaUI.createDialog({
                title,
                body: bodyHtml,
                buttons: [
                    { text: xLabel, className: 'elxa-dialog-btn', onClick: cancel },
                    { text: cLabel, className: confirmClass, onClick: confirm }
                ]
            });

            // Override close to resolve false
            const origClose = dlg.close;
            dlg.close = () => {
                if (!resolved) { resolved = true; resolve(false); }
                origClose();
            };
            dlg.dialogBox.querySelector('.elxa-dialog-close').onclick = dlg.close;
        });
    }
};
