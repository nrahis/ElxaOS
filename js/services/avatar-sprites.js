// =================================
// AVATAR SPRITE SYSTEM
// =================================
// Loaded before login-service.js
// Provides global avatar rendering from assets/avatars/ individual PNGs
// Avatar values: "sprite:iconName" for sprite icons, or plain emoji string

const AVATAR_SPRITES = {
    elxa:      { name: 'Elxa' },
    award:     { name: 'Award' },
    paw:       { name: 'Paw' },
    smiley:    { name: 'Smiley' },
    astronaut: { name: 'Astronaut' },
    robot:     { name: 'Robot' },
    person:    { name: 'Person' },
    mountain:  { name: 'Mountain' },
    clover:    { name: 'Clover' },
    cloud:     { name: 'Cloud' },
    shield:    { name: 'Shield' },
    heart:     { name: 'Heart' },
};

/**
 * Render an avatar value as HTML.
 * Works for both sprite IDs ("sprite:robot") and plain emoji ("😸").
 * The returned HTML fills its parent container — parent sets the size.
 */
function renderAvatar(avatar) {
    if (avatar && avatar.startsWith('sprite:')) {
        const spriteId = avatar.substring(7);
        if (AVATAR_SPRITES[spriteId]) {
            return `<img class="avatar-sprite" src="assets/avatars/${spriteId}.png" alt="${AVATAR_SPRITES[spriteId].name}" draggable="false">`;
        }
    }
    // Fallback: render as emoji text
    return `<span class="avatar-emoji">${avatar || '👤'}</span>`;
}

/**
 * Get display name for an avatar value.
 */
function getAvatarName(avatar) {
    if (avatar && avatar.startsWith('sprite:')) {
        const spriteId = avatar.substring(7);
        if (AVATAR_SPRITES[spriteId]) return AVATAR_SPRITES[spriteId].name;
    }
    return avatar ? 'Custom emoji' : 'None';
}

/**
 * Build the avatar picker HTML for dialogs.
 * Shows a 6×2 grid of sprite icons + a custom emoji text input.
 * @param {string} currentAvatar - Current avatar value
 * @param {string} inputId - Base ID for form elements
 * @returns {string} HTML string
 */
function buildAvatarPicker(currentAvatar, inputId) {
    const isSprite = currentAvatar && currentAvatar.startsWith('sprite:');
    const currentSpriteId = isSprite ? currentAvatar.substring(7) : null;
    const currentEmoji = isSprite ? '' : (currentAvatar || '');

    return `
        <div class="avatar-picker-section">
            <div class="avatar-picker-label">Avatar:</div>
            <input type="hidden" id="${inputId}" value="${currentAvatar || 'sprite:smiley'}">
            
            <div class="avatar-picker-preview">
                <div class="avatar-picker-preview-icon" id="${inputId}Preview">
                    ${renderAvatar(currentAvatar || 'sprite:smiley')}
                </div>
                <div class="avatar-picker-preview-name" id="${inputId}PreviewName">
                    ${getAvatarName(currentAvatar || 'sprite:smiley')}
                </div>
            </div>
            
            <div class="avatar-picker-grid">
                ${Object.entries(AVATAR_SPRITES).map(([id, info]) => `
                    <div class="avatar-picker-option ${currentSpriteId === id ? 'selected' : ''}" 
                         data-avatar="sprite:${id}" data-name="${info.name}">
                        <img class="avatar-sprite" src="assets/avatars/${id}.png" alt="${info.name}" draggable="false">
                    </div>
                `).join('')}
            </div>
            
            <div class="avatar-picker-custom">
                <span class="avatar-picker-custom-label">Or custom emoji:</span>
                <input type="text" class="avatar-picker-custom-input" 
                       id="${inputId}Custom" 
                       value="${currentEmoji}" 
                       maxlength="2" 
                       placeholder="😸">
            </div>
        </div>
    `;
}

/**
 * Wire up click/input handlers for an avatar picker after DOM insertion.
 * @param {HTMLElement} container - The dialog element containing the picker
 * @param {string} inputId - Base ID matching the one passed to buildAvatarPicker
 */
function setupAvatarPicker(container, inputId) {
    const hiddenInput = container.querySelector(`#${inputId}`);
    const preview = container.querySelector(`#${inputId}Preview`);
    const previewName = container.querySelector(`#${inputId}PreviewName`);
    const customInput = container.querySelector(`#${inputId}Custom`);

    // Sprite option clicks
    container.querySelectorAll('.avatar-picker-option').forEach(option => {
        option.addEventListener('click', () => {
            container.querySelectorAll('.avatar-picker-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');

            const avatarVal = option.dataset.avatar;
            hiddenInput.value = avatarVal;
            preview.innerHTML = renderAvatar(avatarVal);
            previewName.textContent = option.dataset.name;

            // Clear custom input when picking a sprite
            if (customInput) customInput.value = '';
        });
    });

    // Custom emoji input
    if (customInput) {
        customInput.addEventListener('input', () => {
            const val = customInput.value.trim();
            if (val) {
                container.querySelectorAll('.avatar-picker-option').forEach(o => o.classList.remove('selected'));
                hiddenInput.value = val;
                preview.innerHTML = renderAvatar(val);
                previewName.textContent = 'Custom emoji';
            }
        });
    }
}
