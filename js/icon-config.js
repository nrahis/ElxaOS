// =================================
// ELXA ICONS — Centralized icon registry
// =================================
// Single source of truth for all icons across ElxaOS.
// Loaded after elxa-ui.js, before everything else.
//
// Usage:
//   ElxaIcons.render('browser', 'desktop')  → full-color icon for desktop
//   ElxaIcons.render('browser', 'ui')       → theme-tinted icon for menus/toolbars
//   ElxaIcons.render('browser')             → defaults to 'ui' context
//   ElxaIcons.getFileIcon('.txt', 'ui')     → file-type icon by extension

const ElxaIcons = {

    // =========================================================
    // Program / system icon registry
    // =========================================================
    // Keyed by program ID (matches data-program, registry keys, etc.)
    programs: {
        'computer':     { mdi: 'mdi-monitor',          color: '#4FC3F7' },
        'recycle-bin':  { mdi: 'mdi-trash-can',         color: '#90A4AE' },
        'notepad':      { mdi: 'mdi-note-edit',         color: '#FFF176' },
        'browser':      { mdi: 'mdi-web',               color: '#42A5F5' },
        'messenger':    { mdi: 'mdi-chat',              color: '#66BB6A' },
        'paint':        { mdi: 'mdi-palette',           color: '#EF5350' },
        'calculator':   { mdi: 'mdi-calculator',        color: '#AB47BC' },
        'elxacode':     { mdi: 'mdi-code-tags',         color: '#26C6DA' },
        'elxabooks':    { mdi: 'mdi-cash-register',     color: '#FFA726' },
        'duck-console': { mdi: 'mdi-console',           color: '#78909C' },
        'clock':        { mdi: 'mdi-clock-outline',     color: '#42A5F5' },
        'viruslab':     { mdi: 'mdi-virus',             color: '#EC407A' },
        'antivirus':    { mdi: 'mdi-shield-check',      color: '#66BB6A' },
        'elxaguard':    { mdi: 'mdi-shield-check',      color: '#66BB6A' },
        'fileManager':  { mdi: 'mdi-folder',            color: '#FFD54F' },
        'folder':       { mdi: 'mdi-folder',            color: '#FFD54F' },
        'snakesian-cards': { mdi: 'mdi-cards-outline', color: '#d4a535' },
    },

    // =========================================================
    // File type icon registry
    // =========================================================
    // Keyed by lowercase extension (with dot)
    fileTypes: {
        '.txt':  { mdi: 'mdi-file-document',    color: '#B0BEC5' },
        '.rtf':  { mdi: 'mdi-file-document',    color: '#B0BEC5' },
        '.html': { mdi: 'mdi-language-html5',    color: '#FF7043' },
        '.elxa': { mdi: 'mdi-code-tags',         color: '#26C6DA' },
        '.png':  { mdi: 'mdi-file-image',        color: '#7E57C2' },
        '.jpg':  { mdi: 'mdi-file-image',        color: '#7E57C2' },
        '.jpeg': { mdi: 'mdi-file-image',        color: '#7E57C2' },
        '.gif':  { mdi: 'mdi-file-image',        color: '#7E57C2' },
        '.mp3':  { mdi: 'mdi-file-music',        color: '#EC407A' },
        '.wav':  { mdi: 'mdi-file-music',        color: '#EC407A' },
        '.mp4':  { mdi: 'mdi-file-video',        color: '#AB47BC' },
        '.avi':  { mdi: 'mdi-file-video',        color: '#AB47BC' },
        '.abby': { mdi: 'mdi-package-down',      color: '#8D6E63' },
        '.lnk':  { mdi: 'mdi-link',              color: '#78909C' },
    },

    // Default fallbacks
    defaultFile:   { mdi: 'mdi-file-document',   color: '#B0BEC5' },
    defaultFolder: { mdi: 'mdi-folder',           color: '#FFD54F' },

    // =========================================================
    // System action icons (for dialogs, context menus, etc.)
    // =========================================================
    actions: {
        'open':        { mdi: 'mdi-folder-open' },
        'open-file':   { mdi: 'mdi-file-document' },
        'new-folder':  { mdi: 'mdi-folder-plus' },
        'save':        { mdi: 'mdi-content-save' },
        'copy':        { mdi: 'mdi-content-copy' },
        'cut':         { mdi: 'mdi-content-cut' },
        'paste':       { mdi: 'mdi-content-paste' },
        'delete':      { mdi: 'mdi-delete' },
        'rename':      { mdi: 'mdi-pencil' },
        'refresh':     { mdi: 'mdi-refresh' },
        'restore':     { mdi: 'mdi-restore' },
        'close':       { mdi: 'mdi-close' },
        'launch':      { mdi: 'mdi-launch' },
        'install':     { mdi: 'mdi-package-down' },
        'uninstall':   { mdi: 'mdi-delete' },
        'shutdown':    { mdi: 'mdi-power' },
        'power-off':   { mdi: 'mdi-power-plug-off' },
        'logout':      { mdi: 'mdi-logout' },
        'back':        { mdi: 'mdi-arrow-left' },
        'forward':     { mdi: 'mdi-arrow-right' },
        'up':          { mdi: 'mdi-arrow-up' },
        'view-grid':   { mdi: 'mdi-view-grid' },
        'view-list':   { mdi: 'mdi-view-list' },
        'history':     { mdi: 'mdi-history' },
        'help':        { mdi: 'mdi-help-circle' },
        'personalize': { mdi: 'mdi-palette' },
        'account':     { mdi: 'mdi-account' },
        'home':        { mdi: 'mdi-home' },
        'new-file':    { mdi: 'mdi-file-plus' },
        'highlight':   { mdi: 'mdi-format-color-highlight' },
        'undo':        { mdi: 'mdi-undo' },
        'redo':        { mdi: 'mdi-redo' },
        'clear':       { mdi: 'mdi-eraser' },
        'resize':      { mdi: 'mdi-resize' },
        'zoom-in':     { mdi: 'mdi-magnify-plus-outline' },
        'zoom-out':    { mdi: 'mdi-magnify-minus-outline' },
        'zoom-fit':    { mdi: 'mdi-fit-to-screen' },
        'bold':        { mdi: 'mdi-format-bold' },
        'italic':      { mdi: 'mdi-format-italic' },
        'underline':   { mdi: 'mdi-format-underline' },
        'text-color':  { mdi: 'mdi-format-color-text' },
        'font':        { mdi: 'mdi-format-font' },
        // Paint tools
        'brush':       { mdi: 'mdi-brush' },
        'pencil':      { mdi: 'mdi-pencil' },
        'eraser':      { mdi: 'mdi-eraser' },
        'bucket':      { mdi: 'mdi-format-color-fill' },
        'eyedropper':  { mdi: 'mdi-eyedropper' },
        'line':        { mdi: 'mdi-vector-line' },
        'rectangle':   { mdi: 'mdi-rectangle-outline' },
        'circle':      { mdi: 'mdi-circle-outline' },
        'text-tool':   { mdi: 'mdi-format-text' },
        'swap':        { mdi: 'mdi-swap-horizontal' },
        // ElxaCode actions
        'play':        { mdi: 'mdi-play' },
        'stop':        { mdi: 'mdi-stop' },
        'terminal':    { mdi: 'mdi-console' },
        // Browser actions
        'star':         { mdi: 'mdi-star' },
        'star-outline': { mdi: 'mdi-star-outline' },
        'menu':         { mdi: 'mdi-menu' },
        'wifi':         { mdi: 'mdi-wifi' },
        'wifi-off':     { mdi: 'mdi-wifi-off' },
        'magnify':      { mdi: 'mdi-magnify' },
        // Messenger actions
        'settings':     { mdi: 'mdi-cog' },
        'send':         { mdi: 'mdi-send' },
        'emoticon':     { mdi: 'mdi-emoticon-outline' },
        // Network / WiFi actions
        'link':           { mdi: 'mdi-link-variant' },
        'lock':           { mdi: 'mdi-lock' },
        'lock-open':      { mdi: 'mdi-lock-open-variant' },
        'shield-lock':    { mdi: 'mdi-shield-lock' },
        'information':    { mdi: 'mdi-information-outline' },
        'speedometer':    { mdi: 'mdi-speedometer' },
        'broadcast':      { mdi: 'mdi-access-point' },
        'chart-bar':      { mdi: 'mdi-chart-bar' },
        'wrench':         { mdi: 'mdi-wrench' },
        'download':       { mdi: 'mdi-download' },
        'printer':        { mdi: 'mdi-printer' },
        'alert':          { mdi: 'mdi-alert' },
        'upload':         { mdi: 'mdi-upload' },
        'antenna':        { mdi: 'mdi-antenna' },
        'check':          { mdi: 'mdi-check' },
        // Battery actions
        'rocket':           { mdi: 'mdi-rocket-launch' },
        'scale-balance':    { mdi: 'mdi-scale-balance' },
        'battery-charging': { mdi: 'mdi-battery-charging' },
        'thermometer':      { mdi: 'mdi-thermometer' },
        'heart-pulse':      { mdi: 'mdi-heart-pulse' },
        'power-plug':       { mdi: 'mdi-power-plug' },
        'lightning-bolt':   { mdi: 'mdi-lightning-bolt' },
        // Clock / Time Center actions
        'clock':          { mdi: 'mdi-clock-outline' },
        'timer':          { mdi: 'mdi-timer-outline' },
        'alarm-icon':     { mdi: 'mdi-alarm' },
        'calendar':       { mdi: 'mdi-calendar' },
        'globe':          { mdi: 'mdi-earth' },
        'bell':           { mdi: 'mdi-bell' },
        'bell-off':       { mdi: 'mdi-bell-off' },
        'chevron-left':   { mdi: 'mdi-chevron-left' },
        'chevron-right':  { mdi: 'mdi-chevron-right' },
        'flag':           { mdi: 'mdi-flag-outline' },
        'flash':          { mdi: 'mdi-flash' },
        'plus':           { mdi: 'mdi-plus' },
        // Login / User actions
        'key':            { mdi: 'mdi-key' },
        'account-plus':   { mdi: 'mdi-account-plus' },
        'lightbulb':      { mdi: 'mdi-lightbulb-on-outline' },
        'login':          { mdi: 'mdi-login' },
        'content-save':   { mdi: 'mdi-content-save' },
        // Theme / Personalize actions
        'image':          { mdi: 'mdi-image' },
        'folder-image':   { mdi: 'mdi-folder-image' },
        // Antivirus actions
        'shield':           { mdi: 'mdi-shield' },
        'shield-alert':     { mdi: 'mdi-shield-alert' },
        'check-circle':     { mdi: 'mdi-check-circle' },
        'alert':            { mdi: 'mdi-alert' },
        'bug':              { mdi: 'mdi-bug' },
        'gamepad':          { mdi: 'mdi-gamepad-variant' },
        'broom':            { mdi: 'mdi-broom' },
        // Virus Lab actions
        'flask':            { mdi: 'mdi-flask' },
        'microscope':       { mdi: 'mdi-microscope' },
        'skull':            { mdi: 'mdi-skull' },
        'target':           { mdi: 'mdi-target' },
        'biohazard':        { mdi: 'mdi-biohazard' },
        'eye':              { mdi: 'mdi-eye' },
        'fire':             { mdi: 'mdi-fire' },
        'test-tube':        { mdi: 'mdi-test-tube' },
        'image-multiple':   { mdi: 'mdi-image-multiple' },
        'message-flash':    { mdi: 'mdi-message-flash' },
        'alert-decagram':   { mdi: 'mdi-alert-decagram' },
        // ElxaCorp interwebs icons
        'phone':            { mdi: 'mdi-phone' },
        'email':            { mdi: 'mdi-email' },
        'office-building':  { mdi: 'mdi-office-building' },
        'car':              { mdi: 'mdi-car' },
        'sprout':           { mdi: 'mdi-sprout' },
        'bullhorn':         { mdi: 'mdi-bullhorn' },
        'cash-multiple':    { mdi: 'mdi-cash-multiple' },
        'cellphone':        { mdi: 'mdi-cellphone' },
        'television':       { mdi: 'mdi-television' },
        // ElxaBooks actions
        'list':             { mdi: 'mdi-format-list-bulleted' },
        'file-document':    { mdi: 'mdi-file-document-outline' },
        'minus':            { mdi: 'mdi-minus' },
        // ElxaMail actions
        'email':            { mdi: 'mdi-email' },
        'email-open':       { mdi: 'mdi-email-open-outline' },
        'reply':            { mdi: 'mdi-reply' },
        'forward-email':    { mdi: 'mdi-share' },
        'inbox':            { mdi: 'mdi-inbox-arrow-down' },
        'email-send':       { mdi: 'mdi-email-fast' },
        'drafts':           { mdi: 'mdi-file-edit-outline' },
        'select-all':       { mdi: 'mdi-select-all' },
        'skull-crossbones': { mdi: 'mdi-skull-crossbones' },
        // Bank / FSB actions
        'bank':             { mdi: 'mdi-bank' },
        'credit-card':      { mdi: 'mdi-credit-card' },
        'crown':            { mdi: 'mdi-crown' },
        'cash-multiple':    { mdi: 'mdi-cash-multiple' },
        'cash-plus':        { mdi: 'mdi-cash-plus' },
        'cash-minus':       { mdi: 'mdi-cash-minus' },
        'bank-transfer':    { mdi: 'mdi-bank-transfer' },
        'currency-usd':     { mdi: 'mdi-currency-usd' },
        'receipt':          { mdi: 'mdi-receipt' },
        'phone':            { mdi: 'mdi-phone' },
        // Abbit / social actions
        'arrow-up-bold':    { mdi: 'mdi-arrow-up-bold' },
        'arrow-down-bold':  { mdi: 'mdi-arrow-down-bold' },
        'comment':          { mdi: 'mdi-comment-outline' },
        'share':            { mdi: 'mdi-share-variant' },
        'thumb-up':         { mdi: 'mdi-thumb-up-outline' },
        'new-box':          { mdi: 'mdi-new-box' },
    },

    // =========================================================
    // Render methods
    // =========================================================

    /**
     * Render a program icon.
     * @param {string} programId — key in the programs registry
     * @param {string} context — 'desktop' (full color) or 'ui' (theme-tinted)
     * @returns {string} HTML span string
     */
    render(programId, context = 'ui') {
        const entry = this.programs[programId];
        if (!entry) return this.renderAction('help', context); // fallback

        if (context === 'desktop') {
            return `<span class="mdi ${entry.mdi} elxa-icon-desktop" style="color: ${entry.color}"></span>`;
        }
        // ui context — color comes from CSS variable
        return `<span class="mdi ${entry.mdi} elxa-icon-ui"></span>`;
    },

    /**
     * Render a file-type icon.
     * @param {string} extension — e.g. '.txt', '.png'
     * @param {string} context — 'desktop' or 'ui'
     * @returns {string} HTML span string
     */
    renderFileType(extension, context = 'ui') {
        const entry = this.fileTypes[extension.toLowerCase()] || this.defaultFile;

        if (context === 'desktop') {
            return `<span class="mdi ${entry.mdi} elxa-icon-desktop" style="color: ${entry.color}"></span>`;
        }
        return `<span class="mdi ${entry.mdi} elxa-icon-ui"></span>`;
    },

    /**
     * Render a folder icon.
     * @param {string} context — 'desktop' or 'ui'
     * @returns {string} HTML span string
     */
    renderFolder(context = 'ui') {
        const entry = this.defaultFolder;

        if (context === 'desktop') {
            return `<span class="mdi ${entry.mdi} elxa-icon-desktop" style="color: ${entry.color}"></span>`;
        }
        return `<span class="mdi ${entry.mdi} elxa-icon-ui"></span>`;
    },

    /**
     * Render a system action icon (always ui-tinted).
     * @param {string} actionId — key in the actions registry
     * @param {string} context — 'desktop' or 'ui' (default 'ui')
     * @returns {string} HTML span string
     */
    renderAction(actionId, context = 'ui') {
        const entry = this.actions[actionId];
        if (!entry) return `<span class="mdi mdi-help-circle elxa-icon-ui"></span>`;

        return `<span class="mdi ${entry.mdi} elxa-icon-ui"></span>`;
    },

    /**
     * Get a file icon based on filename (convenience wrapper).
     * Determines extension and returns the right icon.
     * @param {string} filename
     * @param {string} context — 'desktop' or 'ui'
     * @returns {string} HTML span string
     */
    getFileIcon(filename, context = 'ui') {
        const lastDot = filename.lastIndexOf('.');
        if (lastDot === -1) return this.renderFileType('', context);
        const ext = filename.substring(lastDot).toLowerCase();
        return this.renderFileType(ext, context);
    }
};
