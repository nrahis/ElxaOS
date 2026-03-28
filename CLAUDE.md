# CLAUDE.md — ElxaOS

## What Is This?
ElxaOS is a web-based operating system simulator built with vanilla HTML, CSS, and JavaScript. It's a playful, kid-friendly project that simulates a full desktop OS experience in the browser — complete with a boot sequence, BIOS, login screen, window manager, file system, themed desktop, taskbar, start menu, and a full suite of programs and games. The fictional world is set in **Snakesia**, a country west of Tennessee with its own currency (snakes), characters, and culture.

**Author:** nrahis  
**License:** MIT  
**Current Version:** v4.0.1  
**Repo:** Git-tracked (origin remote exists)

## How to Run
- **Quick:** Open `index.html` in a browser (double-click or drag into browser)
- **Recommended:** Use a local server (`python -m http.server 8000` or VS Code Live Server) — needed for JSON fetches (email system, website registry) and the LLM email service

## Architecture Overview

### Entry Point
`index.html` — loads all CSS/JS via `<link>` and `<script>` tags. No build tools, no bundler, no npm. Pure vanilla.

### Script Load Order (matters!)
1. `elxa-core.js` — Core classes: EventBus, WindowManager, FileSystem
2. `elxa-ui.js` — Shared UI utilities (ElxaUI global: toast notifications, shared dialogs)
3. `icon-config.js` — Centralized icon registry (ElxaIcons global: MDI icon mappings, context-aware rendering)
4. `file-manager.js` — FileManagerProgram (depends on core)
3. Services — battery, wifi, theme, login, installer
4. `clock-system.js`
5. `elxa-debug-tools.js`
6. Programs — browser, messenger, notepad, paint, duck-console, calculator, elxacode, elxabooks
7. Games — snake, snake-deluxe, sussy-cat
8. Virus system — virus-system, antivirus-program, virus-lab
9. `update-popup.js`
10. `boot-system.js`
11. `desktop.js` — Desktop class, Taskbar class, **ElxaOS main class**, and the `DOMContentLoaded` initializer

### Global Object
Everything hangs off a single global: `elxaOS` (created in `desktop.js` on DOMContentLoaded). Access pattern:
```
elxaOS.eventBus       // Event pub/sub
elxaOS.windowManager  // Window create/close/focus/minimize/maximize
elxaOS.fileSystem     // In-memory FS persisted to localStorage
elxaOS.desktop        // Desktop icon management
elxaOS.taskbar        // Start menu, system tray
elxaOS.programs.*     // All program instances (notepad, paint, browser, etc.)
elxaOS.virusSystem    // Virus simulation
elxaOS.themeService   // Theme/wallpaper management
elxaOS.loginService   // Login/user management
elxaOS.bootSystem     // Boot sequence + BIOS
elxaOS.installerService // .abby installer system
```

## Core Systems

### EventBus (`elxa-core.js`)
Simple pub/sub. Key events:
- `program.launch` — `{ program: 'id', args: [...] }`
- `window.closed` — `{ id }`
- `desktop.changed` — triggers desktop icon refresh
- `system.shutdown`
- `battery.click`, `wifi.click`, `clock.click`
- `installer.run` — triggers .abby file installation
- `program.uninstall`
- `file.created`, `folder.created`, `item.deleted`

### WindowManager (`elxa-core.js`)
- Creates draggable, focusable windows with titlebar controls (minimize, maximize/restore, close)
- Windows stored in a `Map` by ID
- Z-index stacking for focus
- Taskbar buttons auto-created/removed with windows
- Maximized windows can't be dragged

### FileSystem (`elxa-core.js`)
- In-memory tree structure rooted at `root` with default folders: Desktop, Programs, System, Documents, Pictures, RecycleBin
- Persisted to `localStorage` under key `elxaOS-files`
- Supports: createFile, createFolder, getFile, getFolder, deleteItem (moves to RecycleBin), updateFileContent, renameItem, listContents
- Emits events on changes; Desktop folder changes trigger icon refresh
- Date objects restored from JSON strings on load

### Boot System (`boot-system.js`)
- Shows POST-style boot messages, then ElxaOS logo with loading bar
- SHIFT+B during boot enters BIOS setup (tabs: Main, Advanced, Boot, Fun Stuff)
- BIOS settings saved to `localStorage` under `elxaOS-bios-settings`
- After boot → checks for update popup → shows login screen

## Program Pattern
Every program follows this pattern:
```javascript
class SomethingProgram {
    constructor(windowManager, fileSystem, eventBus) {
        this.windowManager = windowManager;
        this.fileSystem = fileSystem;
        this.eventBus = eventBus;
    }
    
    launch() {
        const windowId = `something-${Date.now()}`;
        const content = this.createInterface(windowId);
        this.windowManager.createWindow(windowId, 'Title', content, { width, height, x, y });
        this.setupEventHandlers(windowId);
    }
}
```
- Window IDs use `programName-${Date.now()}` for uniqueness
- HTML content is built as template literal strings
- Event handlers set up after window creation using DOM queries scoped to the window element
- Programs are instantiated in the ElxaOS constructor and stored in `elxaOS.programs`

## Programs

| ID | Class | Description |
|---|---|---|
| notepad | NotepadProgram | Rich text editor (WordPad-style) with font/color/formatting |
| paint | PaintProgram | Drawing program |
| calculator | CalculatorProgram | Calculator |
| elxacode | ElxaCodeProgram | Code editor for `.elxa` files (custom toy language) |
| elxabooks | ElxaBooksProgram | Accounting software |
| browser | BrowserProgram | "Snoogle Browser" — loads in-universe websites from `assets/interwebs/` |
| messenger | MessengerProgram | Chat with Snakesia characters (supports Gemini LLM integration) |
| duck-console | DuckConsoleProgram | Terminal/command line |
| fileManager | FileManagerProgram | File browser with icons/list view, copy/cut/paste, keyboard shortcuts |
| antivirus | AntivirusProgram | ElxaGuard Antivirus |
| viruslab | VirusLabProgram | Create and release viruses (game mechanic) |

## Services

| Class | Purpose |
|---|---|
| ThemeService | Manages themes (Classic, Luna Blue, Luna Red, etc.) and wallpapers. Colors applied via CSS custom properties. |
| BatteryService | Simulated battery with charge level |
| WiFiService | Simulated WiFi connection |
| LoginService | User login/logout, user settings |
| InstallerService | Handles `.abby` files (JSON-based game/program installers) |
| ClockSystem | Taskbar clock, supports Snakesia timezone (+2h01m) |
| EmailLLMService | AI-powered email responses via Gemini API |
| EmailSystem | Email management for ElxaMail |
| ConversationHistory | Shared conversation state between messenger and email |
| BankSystem | In-game banking (First Snakesian Bank) |
| PaymentSystem | In-game payments |

## Games
- **Snake** (`snake.js`) — Classic snake, installable via `.abby`
- **Snake Deluxe** (`snake-deluxe.js`) — Story-driven snake with Mr. and Mrs. Snake-e characters, 10 levels
- **Sussy Cat Adventure** (`sussy-cat.js`) — Stealth game: Pushing Cat sneaks through rooms collecting items

## CSS Organization
```
css/
├── desktop.css              — Desktop, taskbar, start menu, windows, core layout
├── file-manager.css         — File manager specific styles
├── programs.css             — Shared program styles
├── programs/                — Per-program CSS
│   ├── browser.css, calculator.css, notepad.css, paint.css, etc.
├── games/
│   ├── snake.css, snake-deluxe.css, sussy-cat.css
├── system/
│   ├── boot-system.css, login.css, dialogs.css, personalize.css,
│   ├── battery.css, wifi.css, clock-system.css, payment-system.css,
│   └── update-popup.css
```
Note: `desktop.css` is the only CSS loaded in `index.html` — it likely imports or contains all core styles. Program CSS files are loaded as needed or may be bundled into desktop.css.

## The "Interwebs" (In-Universe Websites)
The browser loads fake websites from `assets/interwebs/`. Each site is a self-contained HTML file (sometimes with its own CSS/images). Sites are registered in `js/programs/website-registry.json` with `.ex` TLD. Key sites:

- **snoogle.ex** — Search engine homepage
- **elxamail.ex** — Email client (connects to EmailSystem/LLM service)
- **fsb.ex** — First Snakesian Bank
- **snakebook.ex** — Social media
- **dissscord.ex** — Chat platform
- **snakesia-gov.ex** — Government site (tourism, maps, embassy, etc.)
- **snoogle-pedia.ex** — Encyclopedia
- Various Xeocities pages (personal fan sites)
- **snake-e-corp.ex** — Corporate site for Snake-E Corp

## File Types
- `.txt`, `.html`, `.rtf` → Opens in Notepad
- `.elxa` → Opens in ElxaCode (custom toy language)
- `.abby` → JSON installer package (games/programs)
- `.png`, `.jpg`, `.gif` → Opens in Paint
- `.lnk` → Program shortcut (JSON with `type: 'program_shortcut'`)

## Storage

### IndexedDB (primary — via ElxaDB wrapper)
- `elxaOS-files` — Full file system tree (auto-migrated from localStorage on first run)

### localStorage (settings & small data)
- `elxaOS-bios-settings` — BIOS configuration
- `elxaOS-icon-positions` — Desktop icon positions
- `elxaOS-installed-programs` — Installed .abby programs
- `elxaOS-theme` — Current theme
- `elxaOS-user` — User/login data
- `elxaOS-users` — All user accounts
- `elxaOS-version` — Custom version info
- `snakesia-messenger-settings` — Messenger + LLM API settings

## Debug Tools
`elxa-debug-tools.js` provides `debugElxaOS` global:
- `debugElxaOS.debugStorage()` — Inspect localStorage
- `debugElxaOS.clearAllStorage()` — Nuke all ElxaOS data
- `debugElxaOS.backup()` / `.restore(backup)` — Backup/restore
- `debugElxaOS.showFileTree()` — Print file system tree
- `debugElxaOS.fixProgramsFolder()` — Fix misplaced Programs folder

Console shortcuts: `elxaOS.updatePopup.forceShowUpdate()`, `elxaOS.updatePopup.resetUpdateStatus()`

## Icon System (ElxaIcons)
All icons across ElxaOS are managed through `js/icon-config.js` — the `ElxaIcons` global. MDI (Material Design Icons) loaded via CDN.

**Two rendering contexts:**
- `ElxaIcons.render('browser', 'desktop')` — full distinct color + drop-shadow (for desktop icons)
- `ElxaIcons.render('browser', 'ui')` — monochrome, tinted by `--uiIconColor` CSS variable (for start menu, taskbar, toolbars, dialogs)
- `ElxaIcons.renderAction('delete')` — system action icons (always ui context)
- `ElxaIcons.getFileIcon('readme.txt', 'ui')` — file type icons by extension

**Theme integration:** Each theme in `theme-service.js` has a `uiIconColor` property. Applied via `--uiIconColor` CSS variable → `.elxa-icon-ui` class. Theme switching auto-recolors all UI icons.

**MDI CDN quirk:** The CDN stylesheet sets `font-size: inherit` on `.mdi:before`. To size icons, set `font-size` on `.mdi` via a parent selector (e.g. `.desktop-icon-image .mdi { font-size: 28px }`), not on the container.

**Migration status:** Phase 1 (system chrome) complete. See `ICON-MIGRATION.md` for remaining phases.

## Key Conventions
- **No build tools** — Everything is vanilla JS loaded via script tags. Order matters.
- **Class-based** — Each program/service/system is a class instantiated by ElxaOS
- **EventBus for decoupling** — Programs communicate through events, not direct references
- **IndexedDB for filesystem, localStorage for settings** — FileSystem tree is stored in IndexedDB via the ElxaDB wrapper. Smaller settings (theme, BIOS, icon positions, users) still use localStorage.
- **Template literals for UI** — HTML content built as strings in JS, inserted via innerHTML
- **Window ID pattern** — `programName-${Date.now()}`
- **Emoji as icons** — Desktop icons, file icons, and system tray all use emoji
- **Section comments** — Files use `// =================================` banner comments for sections
- **Console logging** — Emoji-prefixed logs (💾, 📂, 🚀, ❌, etc.) for debugging

## Project Tracking Files (IMPORTANT!)
These files live in the project root and should be kept updated during every work session:

- **`CHANGELOG.md`** — Dev changelog tracking ALL changes. Newest entries at top. Each version has a "User-Facing Highlights" section at the bottom — this is where we note things worth mentioning to the end user. When it's time to publish, those highlights get rewritten in a fun kid-friendly tone and added to `updates.txt`. **Always add entries here when making changes.**
- **`TODO.md`** — Living task list. Tracks completed work and planned improvements. **If we discuss something we plan to do but don't do it yet, add it here** so it doesn't get lost between sessions.
- **`updates.txt`** — The user-facing update notes shown in the boot popup. Only update this when actually publishing a new version for the end user (the author's son). Written in a fun, enthusiastic tone.

The workflow: make changes → log them in CHANGELOG.md → if something is deferred, add it to TODO.md → when publishing, cherry-pick highlights into updates.txt.

## World-Building Notes (for content consistency)
- **Snakesia** — Fictional country west of Tennessee
- **Timezone** — Exactly 2 hours 1 minute ahead of user's local time
- **Currency** — "Snakes" (1 USD = 2 snakes)
- **Key characters** — Mr. Snake-e (60yo billionaire CEO of ElxaCorp), Mrs. Snake-e (82yo wife), Pushing Cat (sussy cat), Remi, Rita
- **Companies** — ElxaCorp (makes ElxaOS), Snake-E Corp
- **TLD** — `.ex` for all in-universe websites
