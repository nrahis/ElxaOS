# ElxaOS Emoji → MDI Icon Migration Map

## Summary
- **Total unique UI-facing emojis:** ~50+  
- **Files with emoji:** 15+  
- **Console-only emojis (keep as-is):** ~15  
- **CDN:** `https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css` (added to index.html)

---

## INDEX.HTML (Static HTML)

### Desktop Icons
| Emoji | Context | MDI Icon |
|-------|---------|----------|
| 💻 | My Computer | `mdi-monitor` |
| 🗑️ | Recycle Bin | `mdi-trash-can` |
| 📝 | Notepad | `mdi-note-edit` |

### Taskbar
| Emoji | Context | MDI Icon |
|-------|---------|----------|
| 🏠 | Start button | `mdi-home` |
| 📁 | Quick Launch (File Explorer) | `mdi-folder` |
| 🛡️ | Antivirus tray icon | `mdi-shield-check` |
| 🔋 | Battery tray icon | `mdi-battery` |
| 📶 | WiFi tray icon | `mdi-wifi` |

### Start Menu
| Emoji | Context | MDI Icon |
|-------|---------|----------|
| 🌐 | Snoogle Browser | `mdi-web` |
| 💬 | Messenger | `mdi-chat` |
| 📝 | Notepad | `mdi-note-edit` |
| 🎨 | Paint | `mdi-palette` |
| 🧮 | Calculator | `mdi-calculator` |
| 💻 | ElxaCode | `mdi-code-tags` |
| 💰 | ElxaBooks Pro | `mdi-cash-register` |
| ⚫ | DUCK Console | `mdi-console` |
| 👨‍💻 | Virus Lab | `mdi-virus` |
| 💻 | My Computer | `mdi-monitor` |
| 🎨 | Personalize | `mdi-palette` |
| 👤 | User Settings | `mdi-account` |
| 🛡️ | ElxaGuard Antivirus | `mdi-shield-check` |
| 🚪 | Log Off | `mdi-logout` |
| ⚡ | Shut Down | `mdi-power` |

---

## DESKTOP.JS (Context menus & dialogs)

| Emoji | Context | MDI Icon |
|-------|---------|----------|
| 🚀 | Open (installed) | `mdi-launch` |
| 🗑️ | Uninstall / Delete | `mdi-delete` |
| 📦 | Install (.abby) | `mdi-package-down` |
| 📂 | Open folder/file | `mdi-folder-open` |
| 🔄 | Reset Icon Layout | `mdi-restore` |
| ❌ | Cancel icon | `mdi-close` |

---

## FILE-MANAGER.JS

### Toolbar
| Emoji | Context | MDI Icon |
|-------|---------|----------|
| ⬅️ | Back | `mdi-arrow-left` |
| ➡️ | Forward | `mdi-arrow-right` |
| ⬆️ | Up | `mdi-arrow-up` |
| 🔄 | Refresh | `mdi-refresh` |
| ⊞ | Icon view | `mdi-view-grid` |
| ☰ | List view | `mdi-view-list` |
| 📁 | New Folder | `mdi-folder-plus` |
| 📋 | Copy / Paste | `mdi-content-copy` / `mdi-content-paste` |
| ✂️ | Cut | `mdi-content-cut` |
| 🗑️ | Delete | `mdi-delete` |
| ✏️ | Rename | `mdi-pencil` |

### File type icons
| Emoji | File type | MDI Icon |
|-------|-----------|----------|
| 📁 | Folder | `mdi-folder` |
| 📄 | .txt, .rtf, default | `mdi-file-document` |
| 🌐 | .html | `mdi-language-html5` |
| 💻 | .elxa | `mdi-code-tags` |
| 🖼️ | .png, .jpg, .gif | `mdi-file-image` |
| 🎵 | .mp3, .wav | `mdi-file-music` |
| 🎬 | .mp4, .avi | `mdi-file-video` |

### Window title & dialogs
| Emoji | Context | MDI Icon |
|-------|---------|----------|
| 💻 | Window title | `mdi-folder` |
| 📁 | New Folder dialog | `mdi-folder-plus` |
| ✏️ | Rename dialog | `mdi-pencil` |
| 🗑️ | Confirm Delete | `mdi-delete` |
| ❌ | Cancel icon | `mdi-close` |

---

## SHUTDOWN-MANAGER.JS

| Emoji | Context | MDI Icon |
|-------|---------|----------|
| ⚡ | Shut Down title | `mdi-power` |
| 🔌 | Confirm/shutdown icon | `mdi-power-plug-off` |
| ❌ | Cancel icon | `mdi-close` |
| ⏻ | Power Off button | `mdi-power` |
| 👋 | Log Out title/icon | `mdi-logout` |

---

## NOTEPAD.JS

| Emoji | Context | MDI Icon |
|-------|---------|----------|
| 📝 | Window title | `mdi-note-edit` |
| 📄 | New / file items | `mdi-file-plus` / `mdi-file-document` |
| 📂 | Open | `mdi-folder-open` |
| 💾 | Save / Save As | `mdi-content-save` |
| 🎨 | Highlight button | `mdi-format-color-highlight` |

---

## CALCULATOR.JS

| Emoji | Context | MDI Icon |
|-------|---------|----------|
| 🧮 | Window title | `mdi-calculator` |
| 📜 | History | `mdi-history` |
| ❓ | Help | `mdi-help-circle` |
| 🎲 | Random | `mdi-dice-multiple` |

---

## PAINT.JS

| Emoji | Context | MDI Icon |
|-------|---------|----------|
| 🎨 | Window title / bucket | `mdi-palette` |
| 🖌️ | Brush | `mdi-brush` |
| ✏️ | Pencil | `mdi-pencil` |
| 🧽 | Eraser | `mdi-eraser` |
| 💉 | Eyedropper | `mdi-eyedropper` |
| 📏 | Line | `mdi-vector-line` |
| ⬜ | Rectangle | `mdi-rectangle-outline` |
| ⭕ | Circle | `mdi-circle-outline` |
| 📄 | New | `mdi-file-plus` |
| 📂 | Open | `mdi-folder-open` |
| 💾 | Save / Save As | `mdi-content-save` |
| 🗑️ | Clear | `mdi-delete` |
| 📐 | Resize | `mdi-resize` |
| 🖼️ | Open Image dialog | `mdi-file-image` |
| 🔍 | Zoom | `mdi-magnify-plus` / `mdi-magnify-minus` |

---

## BOOT-SYSTEM.JS (BIOS Fun Panel)

| Emoji | Context | MDI Icon |
|-------|---------|----------|
| 🎮 | Fun Stuff header | `mdi-gamepad-variant` |
| 🔥 | CPU Stress Test | `mdi-fire` |
| 🧠 | Memory Test | `mdi-memory` |
| 📊 | System Stats | `mdi-chart-bar` |
| 🔊 | BIOS Beep | `mdi-volume-high` |
| 🎵 | Startup Sound | `mdi-music` |
| 🥚 | Easter Egg | `mdi-egg-easter` |

---

## OTHER FILES

| Emoji | File | Context | MDI Icon |
|-------|------|---------|----------|
| 🆕 | update-popup.js | Update icon | `mdi-new-box` |
| 🌐 | default-files.js | Browser shortcut | `mdi-web` |
| 💬 | default-files.js | Messenger shortcut | `mdi-chat` |
| 🛡️ | default-files.js | ElxaGuard shortcut | `mdi-shield-check` |
| 🎯 | default-files.js | Target Game | `mdi-target` |
| 🐍 | default-files.js | Snake Game | `mdi-snake` |

---

## NOT YET AUDITED (Phase 3+)

- `browser.js`, `messenger.js`, `elxacode.js`, `elxabooks.js`
- `duck-console.js`, `antivirus-program.js`, `virus-lab.js`
- `login-service.js`, `installer-service.js`, `theme-service.js`
- `battery-service.js`, `wifi-service.js`, `setup-wizard.js`
- `games/*.js`, `assets/interwebs/*.html`

---

## CONSOLE LOG EMOJIS — KEEP AS-IS

💾 📂 🚀 ❌ 🔌 🔄 📍 🔊 🔇 ⚠️ 📄 🆕 ✅ 🗑️ 📝 🎨 🖼️ 🔍 📌 🔴

These are only visible in DevTools and help with debugging. No migration needed.

---

## MIGRATION APPROACH

### Replacement pattern
```html
<!-- Before -->
<span>📁</span> New Folder

<!-- After -->
<span class="mdi mdi-folder-plus"></span> New Folder
```

### Migration phases
1. **System chrome** — index.html, desktop.js, file-manager.js, taskbar.js, shutdown-manager.js
2. **Core programs** — notepad.js, paint.js, calculator.js
3. **Other programs** — browser, messenger, elxabooks, elxacode, duck-console, antivirus, viruslab
4. **Services & games** — login, installer, theme, battery, wifi; snake, sussy-cat, etc.
5. **Content files** — default-files.js shortcut icons, .abby installers, interwebs sites

---

## INTERWEBS SITE MIGRATIONS (Phase 5)

### ✅ Abbit (`assets/interwebs/abbit/`)
- Vote buttons (⬆️/⬇️) → `arrow-up-bold` / `arrow-down-bold`
- Comment count (💬) → `comment`
- Share button (🔗) → `share`
- Modal close (×) → `mdi-close`
- Modal vote info (👍) → `thumb-up`
- Reply button (↩️) → `reply`
- LLM badge (💬) → `mdi-robot`
- Sidebar "All" (🏠) → `home`
- `pointer-events: none` on `.ab-container .mdi`
- 6 new action icons added to `icon-config.js`
- Logo snake emoji (🐍) → `mdi-rabbit` in styled circular mark (orange bg, white icon)
- Kept as content: user avatars, subbabbit icons, sort option emojis (can't use HTML in `<option>`)

### ✅ Snakesia.gov (`assets/interwebs/snakesia-gov/`)
- Alert banner (🚨) → `mdi-alert`
- Business notice (🚨) → `mdi-alert`
- Embassy marquee (🚨) → `mdi-alert`
- Info panel close (×) → `mdi-close`
- Map Zoom In → `mdi-magnify-plus-outline`
- Map Zoom Out → `mdi-magnify-minus-outline`
- Map Print → `mdi-printer`
- Map Download → `mdi-download`
- `pointer-events: none` on `.snakesia-gov .mdi`
- 2 new action icons added to `icon-config.js`: `printer`, `alert`
- Removed redundant `<link rel="stylesheet">` (404 fix)
- CSS cleanup: removed ~40 lines of dead/duplicate CSS, resolved `.snakesia-notice` conflict
- Kept as content: all page emojis (news, attractions, visa types, sidebar data, map POIs, characters)
