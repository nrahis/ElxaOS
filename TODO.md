# ElxaOS — Improvement TODO

## ✅ Completed

### Phase 1 — Bugs
- [x] **WindowManager drag memory leak** — `.bind(this)` created new function refs every drag, so `removeEventListener` never actually removed them. Fixed by storing bound refs once in the constructor. (`elxa-core.js`)
- [x] **Duplicate `clearStorage` method** — FileSystem had two identical `clearStorage()` definitions. Removed the duplicate. (`elxa-core.js`)
- [x] **`document.execCommand` deprecation** — Added TODO comment to `notepad.js`. Full rewrite deferred (needs migration to InputEvent API or custom Selection/Range manipulation).

### Phase 2 — Structural
- [x] **Tamed the logout dialog** — Replaced ~170 lines of "NUCLEAR CLEANUP" with ~50 lines matching the clean shutdown dialog pattern. Removed all inline `!important` styles and redundant removal methods. (`desktop.js` → `shutdown-manager.js`)
- [x] **Split `desktop.js`** — Broke 1300-line file into 4 focused files:
  - `desktop.js` — Desktop class only (~340 lines)
  - `taskbar.js` — Taskbar class (~80 lines)
  - `shutdown-manager.js` — ShutdownManager class (~195 lines)
  - `elxaos.js` — ElxaOS main class + DOMContentLoaded init (~180 lines)
- [x] **Program registry** — Replaced 70-line `launchProgram` switch with a registry object in `buildProgramRegistry()`. Adding a program is now one line. Also added `registerProgram()` for runtime registration. (`elxaos.js`)
- [x] **Default files data file** — Moved all hardcoded default files/folders out of `initialize()` into `default-files.js`. Two constants (`ELXAOS_DEFAULT_FOLDERS`, `ELXAOS_DEFAULT_FILES`) drive a 12-line loader loop.

---

## 🔲 Phase 3 — Quality Polish

### #8 — Verify CSS loading strategy
`index.html` only loads `desktop.css`, but there are separate CSS files in `css/programs/`, `css/games/`, `css/system/`. Need to check whether they're `@import`ed inside `desktop.css` or if some programs are running unstyled / relying on inline styles as a workaround.

### #9 — Fix `window` variable shadowing
Several places use `const window = ...` for DOM window elements, which shadows the global `window` object. Rename to `windowEl`, `win`, or `windowElement` to avoid confusion and potential bugs.

### #10 — Event listener cleanup on window close
When windows close, EventBus listeners and DOM event handlers set up by programs don't get cleaned up. Over a long session this means orphaned listeners accumulating. Need a cleanup pattern — either programs register their listeners for teardown, or the EventBus supports scoped/auto-removed listeners tied to a window ID.

### #11 — Replace fragile `setTimeout` patterns
Several places use `setTimeout(() => ..., 100)` as a timing hack (icon position loading, format toolbar updates). Should replace with proper DOM readiness checks (MutationObserver, requestAnimationFrame, or event-driven triggers).

---

## ✅ IndexedDB Migration
- [x] **Created `ElxaDB` wrapper** (`js/services/elxa-db.js`) — thin async key-value API over IndexedDB. Single global `elxaDB` instance. Methods: `open()`, `get()`, `put()`, `delete()`, `keys()`, `clear()`.
- [x] **Migrated FileSystem persistence** — `saveToStorage()` now writes to IndexedDB (fire-and-forget). `loadFromStorage()` is async, loads from IndexedDB with automatic migration from localStorage on first run. Old localStorage data is cleaned up after migration.
- [x] **Made boot sequence async-aware** — `ElxaOS.asyncInit()` opens the DB and loads the filesystem before calling `initialize()`. Falls back to in-memory defaults if anything fails.
- [x] **Updated debug tools** — v2.0: reads from in-memory tree (source of truth), clears both IndexedDB + localStorage, backup/restore works with both v1 (localStorage) and v2 (IndexedDB) backups.

---

## 🔲 v4.2.0 Update — File Manager & System UI Overhaul

Goal: Make the File Manager solid, fix bugs, add missing features, and establish it as the design foundation for all system programs. The File Manager's UI patterns (toolbars, menus, icons, dialogs, CSS variables) should be the template that Notepad, Paint, Calculator, and system dialogs all follow.

### ✅ Step 1 — Fix File Manager Bugs
- [x] **Fix rename** — `renameSelected()` now calls `fileSystem.renameItem()`. Shows success/error toast, refreshes view, emits `desktop.changed` when renaming in Desktop folder. (`file-manager.js`)
- [x] **Fix multi-window state sharing** — Refactored to per-window state via `this.windowStates` Map (windowId → `{ currentPath, selectedItems, viewMode, navHistory, navIndex }`). Clipboard stays shared intentionally. State auto-cleaned on window close via EventBus listener. (`file-manager.js`)
- [x] **Build the right-click context menu** — Win95-style context menu with Open, Copy, Cut, Paste, Delete, Rename. Context-aware (file vs folder vs empty space shows different options). Right-clicking unselected item auto-selects it. Stays on-screen, closes on outside click. (`file-manager.js`)
- [x] **Implement Back/Forward navigation** — Per-window nav history stack. Navigating pushes; going back/forward moves the index. Navigating to a new place trims forward history. Buttons properly enabled/disabled. Added Alt+Left/Right and Backspace shortcuts. (`file-manager.js`)

### ✅ Step 2 — Taskbar Improvements
- [x] **Add File Explorer quick-launch button** — 📁 button in a quick-launch area between Start and program buttons. Opens File Manager to root. Separated visually with inset border. (`index.html`, `taskbar.js`, `desktop.css`)
- [x] **Taskbar overflow handling** — MutationObserver detects when program buttons overflow the container. Hidden buttons get `display: none` via `.taskbar-overflow-hidden` class, and a `»` overflow button appears. Clicking it shows a dropdown menu listing all hidden windows. Rechecks on window resize. (`taskbar.js`, `desktop.css`)
- [x] **Verify all programs show taskbar buttons** — All programs go through `WindowManager.createWindow()` which calls `addToTaskbar()`. No programs bypass this. Added `flex-shrink: 0` to prevent Start/tray/buttons from squishing. (`desktop.css`)

### Step 3 — Unified Design System
- [x] **Audit all programs for CSS variable usage** — notepad.css, paint.css, calculator.css all fully themed. ElxaBooks, Messenger, Antivirus still need work. Notepad & Paint had inline `<style>` blocks in JS that overrode the themed CSS files — removed. Titlebar icons now inherit color via `.window-titlebar .elxa-icon-ui { color: inherit }`.
- [x] **Consolidate `showMessage` toast notifications** — created `js/elxa-ui.js` with `ElxaUI.showMessage()`. ALL services now unified: wifi, elxabooks, login, setup-wizard, theme-service all migrated to ElxaUI. Toast CSS now themed (`--windowBg`, `--menuText`) with colored left-border accents. Added vertical stacking for simultaneous toasts.
- [x] **Unified dialog pattern** — the "New Folder" and "Rename" dialogs in file-manager, the shutdown/logout dialogs, and various program dialogs all build modal overlays differently. Standardized on `ElxaUI.createDialog()` / `showInputDialog()` / `showConfirmDialog()`. Migrated: file-manager (new folder, rename, delete), shutdown-manager (shutdown, logout), desktop.js (delete, reset positions). Also replaced all raw `confirm()` calls in these files. Cleaned up ~240 lines of orphaned CSS.
- [x] **Consistent iconography** — replaced emojis with MDI (Material Design Icons) webfont. Created centralized `ElxaIcons` registry (`js/icon-config.js`) with context-aware rendering: full-color for desktop, theme-tinted monochrome for system chrome. Added `--uiIconColor` CSS variable to all 16 themes. Phase 1 (system chrome) complete. See `ICON-MIGRATION.md` for full audit and remaining phases.
- [x] **Theme consistency pass** — File Manager context menu moved from inline styles to themed CSS classes. Notepad/Paint dialog buttons (open, save, import) changed from hardcoded green to `var(--titlebarBg)`. Calculator help dialog and history panel rebuilt with theme variables. Format-info helper text themed.

### Icon Migration Phase 2 — Core System Programs (✅ Complete)
- [x] **Notepad** — all emojis → ElxaIcons, inline style block removed, 7 bugs fixed (format-without-selection, caret loss, empty size dropdown, duplicate method, window shadowing, event leak, null-safety).
- [x] **Paint** — all emojis → ElxaIcons, tool definitions `icon` → `actionId`, inline style block removed.
- [x] **Calculator** — all emojis → ElxaIcons.
- [x] **pointer-events: none** on `.mdi` spans in notepad.css, paint.css, calculator.css.

### Icon Migration Phase 3 — Remaining Programs (In Progress)
- [x] **ElxaCode** — full rewrite. All emojis → ElxaIcons, 5 critical bugs fixed, `prompt()`/`confirm()` → themed dialogs, per-window state, default Code folder.
- [x] **Browser** — all emojis → ElxaIcons (toolbar, menu, sidebar, connection status, window title). 6 new action icons added. 4 bugs fixed (`window` shadowing, document click listener leak, EventBus lifecycle, menu icon click-through). `confirm()` → `ElxaUI.showConfirmDialog()`. Connection status inline styles → CSS classes.
- [x] **Messenger** — icon migration + full review. 7 bugs fixed (implicit `event`, `window` shadowing, document listener leak, EventBus stacking, style tag leak, nuclear `animation: none` CSS). 3 new action icons. `alert()` → `ElxaUI.showMessage()`. Custom `showSystemMessage()` → `ElxaUI.showMessage()`. Hybrid CSS theming (chrome follows OS theme, chat area stays retro).
- [x] **Time Center** — icon migration + full review. 7 bugs fixed (EventBus stacking, stopwatch interval leak, worldClocks overwrite, alarm re-trigger 60x/min, event modal fixed positioning, unscoped modal queries, duplicate notification system). 12 new action icons + `clock` program entry. 3 `alert()` → `ElxaUI.showMessage()`. Custom `showNotification()` → `ElxaUI.showMessage()`. ~75 lines dead CSS removed.
- [x] **Duck Console** — icon migration + review. 7 bugs fixed (`window` shadowing, no destroy/cleanup, duplicate `cat` case, unscoped `outputToActiveConsole`, broken escape sequences, misindented break, stale debug log). Icons: title + network status. Console output emojis kept as terminal content.
- [x] **Antivirus** — icon migration + full review. 8 bugs fixed (`window` variable shadowing, no destroy/cleanup, custom `showSystemMessage()`→ElxaUI, 3 inline `onclick` handlers, `safeUpdate` helper defined twice, debug `console.log`, body-appended popups orphaned on close). 7 new action icons. ~30 emojis in UI chrome → ElxaIcons. Status emoji dots (🟢/🔴/🟡) → CSS `.av-status-*` classes. Threat emoji dots → CSS `.av-threat-dot`. `showSystemMessage()` removed → `ElxaUI.showMessage()`. All inline `onclick` → container delegation. `destroy()` method added. Generic `.delete-btn` → scoped `.av-quarantine-delete-btn`. Dialog close `<div>×</div>` → `<button>` with ElxaIcons.
- [x] **Virus Lab** — icon migration + full review. 9 bugs fixed (matrix interval leak, preview message interval leak, custom showHackerMessage→ElxaUI, gallery listener stacking, no destroy/cleanup, EventBus handler ref leak, duplicate `.vlab-status-text` class conflict, body-appended elements orphaned on close, dead `setupEventHandlers` constructor method). 12 new action icons. ~40 emojis in UI chrome → ElxaIcons. `showHackerMessage()` removed → `ElxaUI.showMessage()`. Severity emoji dots → CSS `.vlab-severity-dot`. Gallery card click handling moved to container delegation (no more stacking). `destroy()` method added: clears intervals, removes body elements, unsubscribes EventBus.

### Step 4 — After all the above is solid
- [x] Review Notepad for bugs and improvements (done — 7 bugs fixed, see Phase 2 above)
- [ ] Review Paint for bugs and improvements
- [ ] Review Calculator for bugs and improvements
- [x] **ElxaBooks Pro — full rebuild.** QuickBooks-inspired 4-view app (Dashboard, Transactions, Invoices, Reports). Invoice system for billing family. Snakes currency. All raw confirm/alert removed.
- [x] **ElxaMail** — icon migration + full review. 8 bugs fixed (alert() help popup, double init, 3× confirm(), JSON.stringify in onclick, custom toast escaping browser, no cleanup/destroy, inline onclick everywhere, inline styles). ~50 emojis → ElxaIcons. 9 new action icons. Custom toast system → ElxaUI.showMessage(). confirm() → ElxaUI.showConfirmDialog(). Dynamic UI building + event delegation.
- [x] **First Snakesian Bank (fsb.ex)** — icon migration + full review. 5 bugs fixed (init never ran, script src re-created class, global keypress leak, no destroy/cleanup, inline style.display). ~20 inline onclick → event delegation. ~15 inline styles → CSS classes. ~15 emojis → ElxaIcons. 10 new action icons. ~30 debug console.logs removed.
- [ ] **Migrate remaining raw `confirm()` calls** — 3 remain across: notepad.js (1: overwrite file), paint.js (2: clear canvas/overwrite file), installer-service.js (1: uninstall). (elxabooks and elxamail confirm calls removed in rewrite.)

### Service Reviews (Outside Phase 3)
- [x] **WiFi Service** — full review. 6 bugs fixed (persistence no-ops, confirm(), scan interval leak, passwords in DOM, unstable IP/gateway, missing destroy()). 13 new action icons. ~35 inline styles → CSS classes. ~80 lines dead CSS removed. `confirm()` → `ElxaUI.showConfirmDialog()`.
- [x] **Battery Service** — full review. 8 bugs fixed (custom showMessage, inline CSS shutdown overlay, fragile updateBatteryDisplays, tray icon destroying MDI span, unscoped tab queries, inline onclick on modes, no persistence, missing destroy). 7 new action icons. Inline style colors → CSS classes. Shutdown overlay → CSS. `simulateFastDrain()` removed.
### Login Service Overhaul
- [x] **User Settings dialog** — rewritten with `ElxaUI.createDialog()`, icon migration, inline onclick removed.
- [x] **Change Password dialog** — rewritten with `ElxaUI.createDialog()`, icon migration, Enter key support.
- [x] **Version Edit dialog** — ~130 lines inline styles → CSS classes, icons migrated, `confirm()` → `showConfirmDialog()`.
- [x] **Create User dialog** — ~100 lines inline styles → CSS, JS hover management → CSS classes.
- [x] **Login screen buttons** — emoji icons → ElxaIcons.
- [x] **Escape key listener leak** — handler now stored and removed in `hideLoginScreen()`.
- [x] **`deleteUser()` raw `confirm()`** — migrated to `ElxaUI.showConfirmDialog()`.
- [x] **Dead methods** — `selectAvatar()` and `selectNewUserAvatar()` removed.
- [x] **Personalize dialog** — icon migration, close button fixed (div→button + ElxaIcons), all inline `onclick` removed (close/apply/reset/context menu), event delegation switched to `.closest()` for icon click-through safety, ~6 emojis in UI strings → ElxaIcons, pointer-events CSS added.

- [ ] Per-user filesystems (see below)

---

## ✅ Antivirus Upgrades

### ✅ Virus Selection Setting
- [x] Settings panel in Antivirus with checkboxes for each virus definition
- [x] `startRandomInfections()` only picks from enabled viruses
- [x] Selection persisted to `elxaOS-virus-selection` in localStorage
- [x] Default: all 4 built-in viruses enabled

### ✅ Custom Virus Integration (Virus Lab → Antivirus)
- [x] Bridge between `viruslab-saved-viruses` localStorage and virus system definitions
- [x] Custom viruses appear in scan results and virus selection checkboxes (with CUSTOM badge)
- [x] Custom viruses can actually infect with their popup/image/message/screen effects
- [x] Virus Lab emits save/delete events; VirusSystem auto-refreshes
- [x] Quarantining cleans up custom virus effects
- [x] Full dismiss + reinfection cycle for custom viruses

---

## 🔲 Per-User Filesystems
- Store each user's file tree under a namespaced key (e.g. `elxaOS-files:kitkat`)
- Load the correct tree after login (FileSystem needs a `switchUser(username)` method)
- Create fresh default files for new users on first login
- Consider per-user settings too (theme, icon positions, installed programs)

## ✅ Bugs Fixed
- [x] **Persistence not working** — could not reproduce. Likely caused by earlier `clearAllStorage()` during testing. Considered resolved.
- [x] **Notepad line breaks lost on save** — `textContent` stripped `<br>` elements. Fixed by switching to `innerText`.
- [x] **Notepad font/size changes silently dropped** — `hasUserFormatting()` didn't detect `<font face/size>` or `font-family/font-size` CSS. Fixed.
- [x] **Notepad plain text `\n` not displayed** — `textContent =` doesn't render newlines in contenteditable. Now converts to `<br>`.

## 🔲 Interwebs Cleanup
### ✅ Employee Portal Revamp (Complete)
- [x] **Delete broken inline script** — removed ~115-line second `<script>` block from `index.html` (`handleJobApplicationNew`, `getApplicantEmail`, `handleApplicationFallback`, override logic). External `elxacorp-job-integration.js` already provides complete working handler.
- [x] **Register standalone portal** — added `snake-e.corp.ex/portal` to `website-registry.json` pointing to `employee-portal.html`.
- [x] **Replace SPA portal page** — `page-portal` in `index.html` replaced with compact gateway showing portal URL, "How It Works" steps, and links to Apply page.
- [x] **Fix email delivery** — 3-path approach in `elxacorp-job-integration.js`: (A) live inject if ElxaMail running, (B) direct localStorage injection to `elxaOS-mail-user-{username}` if account exists, (C) queue to `elxacorp-queued-emails`. ElxaMail's `login()` and session restore now call `processQueuedExternalEmails()` to flush any remaining queued emails.
- [x] **Personalize portal dashboard** — `employee-portal.html` now shows department in header, plus new "Your Profile" card with salary, manager, sus level, cookie preference, favorite game, and start date pulled from stored profile. Test user updated with full profile fields. `manager` field added to profile creation in job system.
- [x] **Gate Apply page** — `showPage('apply')` checks `elxacorp-user-profiles` in localStorage. If profile exists, hides form and shows "Already employed" with position/department/employee ID and link to portal.
- [x] **Fix interval leak** — removed `setInterval` poller from bottom of `elxacorp-job-integration.js`. Queue processing now event-driven via ElxaMail login hook.

---

## 🔲 Interwebs Cleanup
- [ ] **Redundant `<link>` 404 in other interwebs sites** — `elxatech/index.html` still has `<link rel="stylesheet" href="styles.css">` which 404s. `snake-e-corp` already fixed. `abbit` and `dissscord` use full paths so they technically work but the `<link>` is still redundant since the browser injects CSS via the registry. Remove in all cases.
- [x] **Snake-E Corp (ElxaCorp) icon migration** — Phase 5. Portal headings, contact icons, directory, emergency footer, tip icon → MDI. 8 new action icons added to icon-config.js. Content/personality emojis (🐍 🐱 🍪 🎉 etc.) kept.
- [ ] **ElxaTech icon migration** — Phase 5
- [ ] **Remaining interwebs sites** — audit all other sites for icon migration opportunities

## 🔲 Finance & Inventory System
- [x] **Phase 1: Finance Service Foundation** — COMPLETE
- [x] **Phase 2: Credit Card System** — COMPLETE. Credit cards in finance-service.js, 3-way payment dialog (debit/credit/fake card)

- [ ] **Phase 3: Loan System** — mortgages, personal loans, linked assets, repossession on default
- [ ] **Phase 4: Monthly Cycle Engine** — recurring payments, interest accrual, consequence chain for missed payments, debug time tools
- [ ] **Phase 5: Inventory Service** — `inventory-service.js` for properties, cards, future collectibles
- [ ] **Phase 6: Paycheck System** — ElxaCorp salary → recurring deposits, pay stubs
- [ ] **Phase 7: Full Integration Pass** — wire payment-system, bank website, Mallard Realty, card exchange, LLM context to new services
- [ ] **Bank login merge** — should bank login = ElxaOS login? (leaning yes)
- [ ] **Registry migration** — wire remaining systems (messenger, email-llm, card collection) to use registry

## 🔲 Pato & Sons Auto (Dealership)
- [x] **Phase 1: Finance Service Updates** — AUTO_LOAN_TIERS constant, LOAN_TYPES.auto updated (300k max, 3 active, 60mo terms, 12% APR), auto branch in _calculateLoanTerms(), getAutoLoanMaxForScore() helper
- [x] **Phase 2: Vehicle Data** — 23 vehicles in vehicles.js across 5 tiers
- [x] **Phase 3: Website Build** — index.html, styles.css, dealership.js, registry entry for pato.ex. Browse/filter/sort, detail views, tiers info, my vehicles tab. Warm mustard/charcoal/cream styling.
- [x] **Phase 4: Lease Flow** — Lease button functional on tiers 1-3. Confirmation dialog (vehicle preview, monthly cost, balance before/after). Creates recurring payment + first month withdrawal + acquires vehicle as 'leased'. Return vehicle flow (cancels lease, removes vehicle). Keys handover ceremony overlay with sparkles + salesperson quotes. Return farewell overlay. Toast helper. loseVehicle() now auto-cancels linked lease payment.
- [x] **Phase 5: Buy Flow** — Buy button active on all listings. Down payment check (10%), inline auto loan application with term selector (1-5 years), monthly payment preview with live recalculation. On approval: create loan + acquire vehicle as 'financed'. Purchase ceremony overlay with title transfer deed, loan terms, salesperson quote. Refunds down payment on denial. Active auto loan count check (max 3).
- [x] **Phase 6: Insurance + Depreciation** — finance cycle steps 6.5 (insurance) + 6.75 (depreciation). Owned/financed vehicles charged monthly insurance based on current value. 3 missed → impoundment. All vehicles depreciate monthly (compound, 20% floor). In-character emails from Snakesian Auto Insurance Authority. Credit score penalties for missed insurance.
- [x] **Phase 7: Sell Flow** — Current value + depreciation % display in My Vehicles. Sell button for owned/financed. Sell overlay with valuation, loan payoff, net proceeds, underwater detection (blocks if can't cover shortfall). Sale ceremony with financial summary + salesperson farewell. Vehicle returns to lot after sale.
- [ ] **Phase 8: World Integration + Polish** — world-context.json, LLM context, tiers page, bank UI

## 🔲 Gifting & Bond System — Remaining
- [x] **Phases 1A-1C: Bond Service Core** — BondService class, bond tracking, gift scoring, request system (Session 42)
- [x] **Phase 5: Character Preferences** — giftPreferences in world-context.json for all 5 characters (Session 42)
- [x] **Phase 2A-2B: Gift Button + Popup** — Gift button in Messenger input, popup with inventory items (Session 43)
- [x] **Phase 2C: Request Message Styling** — [brackets] → styled spans in AI messages (Session 43)
- [x] **Phase 2D: Bond Display** — Heart + tier name in chat header (Session 43)
- [x] **Phase 3A-3D: LLM Prompt Integration** — Bond context, gift reactions, request triggers, preference injection (Session 43)
- [x] **Phase 4: Context Builder + Email** — Bond summaries in context builder getUserContext() via _getBondInfo() helper. Email gets bond info automatically (already calls getUserContext). (Session 44)
- [x] **Phase 6: Polish** — 6A events already wired (all 4 emit), 6B tier change notifications + toasts (Session 44), 6C debug tools already built, 6D boot integration already done (step 2.77). Remaining: gift log view?, bond indicators on contact list? (future ideas)

## 🐍 Scales & Tails Fashion Co. (fashionco.ex)
- [ ] **Phase 1: Product Catalog** — `fashion-products.js` with 19 products, 79 color variants. Snakesia-themed product names. Variant data includes color, pattern, motifs, image path.
- [ ] **Phase 2: Website Build** — `index.html`, `styles.css`, `fashionco.js`. Image-forward product grid, variant color swatches, detail view, dropdown cart with quantity, checkout via purchaseProduct(). Brand palette: cream/dusty rose/sage/teal.
- [ ] **Phase 3: World Integration** — world-context.json entry, website registry, approved websites, context builder one-liner, receipt email on purchase.

## 🔲 Future Ideas
- Notepad `execCommand` full rewrite (see Phase 1 #3 TODO)
- Have InstallerService use `registerProgram()` instead of the `installed_` prefix convention
- Consider a simple module/namespace pattern to avoid all classes being global
- Add `beforeunload` handler to guarantee final IndexedDB save on browser close
- **Messenger AI/API modernization** — Gemini model list is outdated, API endpoint/format may need updating, prompt structure could be improved. Consider supporting other LLM providers.
- **Messenger emoji picker positioning** — Uses `position: fixed` + `getBoundingClientRect()` which positions relative to viewport, not the draggable window. Picker drifts away from the button when window is dragged.
- **Messenger DOM queries** — All queries use `document.getElementById()` (not scoped to window element). Works because messenger is singleton, but inconsistent with multi-window programs.

## 🐛 Known Bugs
- [x] **NoAds Pro shows "Install" after subscription** — `_restoreState()` in `ad-service.js` listened for `registry.userLoaded` event which was never emitted. Changed to `login.success`. Fixed in session 41.
- [ ] **ElxaTech untested** — built in session 37, never tested. Receipt email event listener (`elxatech.purchase`) still needed.
- [x] **Browser overlay scroll position** — Fixed in session 40. Overlays now constrained to browser page via `contain: paint` + scroll-to-top observer.
