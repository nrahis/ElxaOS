# ElxaOS Changelog (Development)
#
# This file tracks ALL changes made during development.
# When it's time to publish, pick the user-facing highlights
# and write them up in updates.txt for the boot popup.

## ScaleStreet — Phase 7: Polish + World Integration

### Bug Fixes
- **`js/services/stock-service.js`**: Fixed `getUserState`/`setUserState` → `getState`/`setState` (registry API mismatch causing init errors)
- **`assets/interwebs/scalestreet/styles.css`**: Fixed SVSE buy dialog z-index (200 → 1100) so trade overlay renders above detail overlay

### `data/world-context.json` (UPDATED)
- Added `scaleStreet` section: SVSE info, brokerage, 3 journalists (Reginald Hissington III, Viperia Fangsworth, Coby the Intern), sectors, notable stocks
- Added `scalestreet.ex` and `ssj.ex` to approved websites

### `js/services/context-builder.js` (UPDATED)
- Added ScaleStreet/SVSE to `getWorldContext()` (journalists, notable stocks, newspaper)
- Added `_getStockInfo()` — portfolio summary with holdings, value, and gain/loss for LLM context
- Added `_getMarketHeadlines()` — last 3 news headlines so LLM characters can reference market events

### `assets/interwebs/scalestreet/market.js` (UPDATED)
- Sparklines upgraded: polylines → smooth bezier curves (cubic bezier control points) for both table and detail chart
- Detail chart: polygon fill → SVG linearGradient (top-to-bottom fade), added current price dot indicator
- Cross-links: news items in stock detail show "Read in SSJ" link for feature articles
- Added `gotoSSJ()` navigation helper + event delegation handler

### `assets/interwebs/scalestreet/styles.css` (UPDATED)
- Added `.svse-ssj-link` styles for cross-site navigation links

## ScaleStreet — Phase 6: ScaleStreet Journal (ssj.ex)

### `assets/interwebs/ssj/index.html` (NEW)
- WSJ-inspired newspaper shell with masthead, ticker strip, front page, article detail page, market sidebar

### `assets/interwebs/ssj/styles.css` (NEW)
- Classic newspaper styling: serif headlines, cream background, column layout, newspaper rules/dividers
- Market sidebar with top movers, snapshot stats, rotating fake ads
- Article detail page with impact callout badges
- Responsive ticker strip, impact badges with gain/loss coloring

### `assets/interwebs/ssj/journal.js` (NEW)
- IIFE pattern (`SSJournal`), reads from `stockService.getRecentNews()` + `STOCK_ARTICLES`
- Front page: most recent feature article as main story, remaining news as headline blurbs
- Article detail page for features with full body, byline, market impact callout
- Market sidebar: top 6 movers by absolute %, aggregate market snapshot, random ad rotation
- Ticker strip showing all 14 stocks with prices and change %
- Cross-links: ticker badges link to SVSE stock detail, footer links to scalestreet.ex
- Event delegation for all clicks (read-article, back-to-front, goto-svse, goto-stock)

### `js/programs/website-registry.json` (UPDATED)
- Added `ssj.ex` registry entry (The ScaleStreet Journal, Business category)

## ScaleStreet — Phase 5: Portfolio + Dividends UI

### `js/services/stock-service.js` (UPDATED)
- Enhanced `_processDividends()` to emit per-stock dividend breakdown (ticker, company, shares, rate, payout) in `stocks.dividendPaid` event
- Added `_checkBigMoves()` — detects held stocks with >15% monthly price change, emits `stocks.bigMove` event with full position details
- Big move detection runs at end of each monthly simulation cycle

### `js/services/finance-notifications.js` (UPDATED)
- Added `stocks.dividendPaid` listener → `_onDividendPaid()`: notification center entry + email from "ScaleStreet Brokerage" (dividends@scalestreet.ex) with per-stock dividend summary
- Added `stocks.bigMove` listener → `_onBigMove()`: toast notification + email from "ScaleStreet Brokerage — Alerts" (alerts@scalestreet.ex) with position details and investment guidance

### `assets/interwebs/scalestreet/market.js` (UPDATED)
- Rebuilt portfolio tab with 3-stat summary header: Total Value (with gain/loss), Invested, Monthly Dividends estimate
- Holdings table now includes Div/Mo column showing estimated monthly dividend per holding
- Added inline Sell button on each portfolio holding row (no need to go through detail view)
- Ticker in portfolio rows is clickable to view stock detail

### `assets/interwebs/scalestreet/styles.css` (UPDATED)
- Portfolio summary panel (`.svse-portfolio-summary`, `.svse-portfolio-stat`) — 3-column stat layout with dark card background
- Portfolio empty state styling (`.svse-portfolio-empty`)
- Small sell button (`.svse-btn-sell-sm`) — red outline, hover fill
- Dividend and action column styles (`.col-div`, `.col-action`)

## ScaleStreet — Phase 4: Buy/Sell Flow

### `assets/interwebs/scalestreet/index.html` (UPDATED)
- Added trade dialog overlay (buy/sell modal with close button)

### `assets/interwebs/scalestreet/styles.css` (UPDATED)
- Trade dialog panel, title, subtitle, info rows
- Quantity input with quick-set buttons (1, 5, 10, Max/All)
- Total cost/proceeds display, gain/loss indicator
- Confirm buy (green), confirm sell (red), cancel button styles
- Error message and success state styling

### `assets/interwebs/scalestreet/market.js` (UPDATED)
- Buy/Sell buttons now enabled in stock detail view
- `showBuyDialog(ticker)`: price per share, checking balance, max affordable shares, quantity input with live total
- `showSellDialog(ticker)`: current price, shares owned, avg cost basis, gain/loss per share, quantity input with live proceeds + gain/loss preview. Empty-state message if no shares owned.
- `updateTradeTotal()`: live recalculation on quantity change with validation (insufficient funds / exceeds holdings)
- `executeBuy(ticker)`: async — withdraws from checking via financeService, acquires stock via inventoryService, shows success confirmation, refreshes all views
- `executeSell(ticker)`: async — sells stock via inventoryService (returns gain/loss), deposits proceeds to checking, shows profit/loss result, refreshes all views
- Quick quantity buttons (1, 5, 10, Max/All) for fast input
- Event delegation wired for buy-stock, sell-stock, confirm-buy, confirm-sell, close-trade, set-qty actions
- Trade overlay click-to-dismiss on background

## ScaleStreet — Phase 3: SVSE Website (Trading Floor UI)

### `assets/interwebs/scalestreet/index.html` (NEW)
- NYSE-inspired HTML shell with header, scrolling ticker bar, market table, portfolio tab
- Detail overlay for individual stock views
- Filter bar (sector, sort order)

### `assets/interwebs/scalestreet/styles.css` (NEW)
- Dark navy/charcoal financial terminal aesthetic
- Green (#3fb950) for gains, red (#f85149) for losses, gold (#d4a843) accents
- Monospace font for all price data
- Scrolling ticker animation, sparkline styling, responsive detail overlay

### `assets/interwebs/scalestreet/market.js` (NEW)
- IIFE pattern (`var ScaleStreet`), event delegation, sync bridge methods
- Market tab: all 14 stocks in sortable table with price, change %, sector badges
- Mini SVG sparklines from 12-month history (green/red based on overall trend)
- Scrolling news ticker bar: stock prices + recent news headlines
- Stock detail view: large chart with area fill, company info grid, recent news, description
- Volatility and dividend info per stock, 12-month high/low range
- Portfolio tab: total value, gain/loss, holdings table (reads from inventoryService)
- Sector filter + sort (ticker, price, change)
- Header stats: stock count, gainers, losers
- Buy/sell buttons present but disabled (Phase 4)

### `js/programs/website-registry.json` (UPDATED)
- Added `scalestreet.ex` registry entry with keywords and description

## ScaleStreet — Phase 2: News Events + Articles Pool

### `js/services/stock-news.js` (NEW)
- 61 news events across 4 categories: company (42), sector (8), market (5), wildcard (5)
- Every company gets 3+ events (mix of positive/negative impacts)
- SCAT gets 4 events (meme stock needs extra chaos)
- Each event: id, headline, affects (ticker + impact multiplier), category, cooldown
- Sector events hit multiple related tickers simultaneously
- Market-wide events affect 5-9 stocks at once
- Cooldowns range 5-12 months to prevent repetition

### `js/services/stock-articles.js` (NEW)
- Matching article for every event ID (61 total)
- 49 blurbs (2-3 sentence summaries, self-contained)
- 12 features (full articles with body paragraphs + bylines)
- Three recurring journalists: Reginald Hissington III (serious finance), Viperia Fangsworth (tech/biotech), Coby the Intern (weird stories + SCAT)
- Features spread across sectors: tech, auto, meme stocks, biotech, defense, fashion, food, market, wildcard

### `index.html` (UPDATED)
- Added script tags for `stock-news.js` and `stock-articles.js` between `stock-data.js` and `stock-service.js`
- Load order: stock-data → stock-news → stock-articles → stock-service

---

## ScaleStreet — Phase 1: Stock Data + Simulation Service

### `js/services/stock-data.js` (NEW)
- 14 publicly traded Snakesian companies across 7 sectors (Tech, Finance, Real Estate, Auto, Consumer, Entertainment, Biotech, Telecom, Lifestyle, Defense)
- Each stock: ticker, name, sector, starting price, volatility rating (Low/Medium/High/Extreme), monthly dividend rate
- Dividend-paying stocks: ELXA, SNGL, FSB, MALD, PATO, FANG, BITE, COIL, HISS (8 of 14)
- Meme stock: SCAT (Sussy Cat Entertainment, Extreme volatility, no dividend)

### `js/services/stock-service.js` (NEW)
- StockService class — stock market simulation engine
- Prices update monthly on boot (same cadence as finance cycle), with trend drift + random volatility per stock
- Price floor at $1.00, 12-month price history per stock (for sparklines)
- News event system ready for Phase 2 data (30% chance/month, cooldown tracking, sector-wide impacts)
- Dividend processing: monthly payouts to checking for held dividend stocks
- Sync getters for interwebs sites: `getCurrentPricesSync()`, `getStockDetail(ticker)`, `getPortfolioSync()`, `getTopMovers/Gainers/Losers()`
- Portfolio enrichment from inventoryService with gain/loss and % calculations
- LLM context helper: `getPortfolioSummary()`, `getTodaysHeadlines()`
- Debug tools: `elxaOS.stockService.debug.prices()`, `.advanceMonth(n)`, `.setPrice(ticker, price)`, `.portfolio()`, `.news()`, `.triggerEvent(id)`, `.reset()`

### `js/elxaos.js` (UPDATED)
- Added `stockService` construction (after inventoryService)
- Added `stockService.init()` at boot step 2.73 (after inventory, before context builder)

### `index.html` (UPDATED)
- Added `<script>` tags for `stock-data.js` and `stock-service.js` (after inventory-service.js)

**User-Facing Highlights:**
- Stock market engine running behind the scenes! 14 Snakesian companies with live price simulation. Website coming in Phase 3.

## New CSS Wallpapers + Pattern Type Support

### `js/services/theme-service.js` (UPDATED)
- Added 4 new built-in wallpapers: Cotton Candy (pink-lavender-blue gradient), Midnight (near-black blue gradient), Spotlight (dark radial spotlight), Carbon Fiber (repeating dark woven pattern)
- Added new `type: 'pattern'` wallpaper support in `applyWallpaper()` for CSS patterns that need `background-size` tiling. Pattern wallpapers use `value` for the background shorthand and `size` for background-size.
- Carbon Fiber is the first pattern-type wallpaper, using repeating linear gradients with 20x20px tile size.

**User-Facing Highlights:**
- 4 new desktop wallpapers to choose from in Personalize! Cotton Candy, Midnight, Spotlight, and Carbon Fiber.

## New Themes + Dark Theme Fix + Browser Fixes

### `css/programs/browser.css` (UPDATED)
- Fixed History/Favorites sidebar rendering as a proper sidebar instead of stacking on top of the page. Changed `.browser-content` from `flex-direction: column` to `flex-direction: row`.
- Added `min-height: 0` and `flex-shrink: 0` to `.browser-sidebar` to prevent overflow and squishing.
- Added `min-height: 0` to `.browser-page` for proper flex scrolling.
- Themed Go button: now uses `var(--titlebarBg)` instead of hardcoded green (`#00aa00`).
- Themed Clear History button: now uses `var(--menuHoverBg)` instead of hardcoded red (`#ff6666`).
- Both hover states now use `filter: brightness(1.15)` for theme-agnostic lightening.

### `js/services/theme-service.js` (UPDATED)
- Added 6 new themes: Slate (neutral dark), Frost (silver-gray light), Rosé (dusty mauve light), Matcha (sage green + cream light), Mocha (warm brown dark), Dusk (muted plum dark)
- Added 5 more themes: Studio (dark charcoal + teal accents), Coastal (sandy tan + sea green light), Aurora (dark + green-to-indigo gradient), Noire (jet black + amber accent), Neon Bloom (dark charcoal + hot pink accent)
- Added `dark: true` property to all dark themes (Synthwave, Zune, Slate, Mocha, Dusk)
- Fixed dark-theme CSS class detection: now checks `theme.dark` property instead of hardcoding `'zune'`. Synthwave was missing the dark-theme class entirely before this fix.
- Dark theme preview now works correctly — previewing a dark theme applies the class, previewing a light theme removes it.

## Personalize Dialog — WindowManager Migration & Layout Revamp

### `js/services/theme-service.js` (UPDATED)
- Migrated Personalize dialog from raw DOM `system-dialog` to `WindowManager.createWindow()`. Now draggable, minimizable, with taskbar entry — matches ElxaBooks and other modern windows.
- Removed custom `dialog-header`/`dialog-close` (WindowManager provides these).
- Removed footer "Close" button (redundant with titlebar X).
- Updated all class names: `personalize-tabs`, `personalize-tab`, `personalize-content`, `personalize-panel`, `personalize-theme-grid`, `personalize-wp-grid`, `personalize-wp-controls`, `personalize-controls`.
- `hideThemeDialog()` now uses `WindowManager.closeWindow()` with fallback cleanup.
- Added `_personalizeWindowId` tracking and `window.closed` event listener cleanup.

### `css/system/personalize.css` (REWRITTEN)
- Complete rewrite with new class names matching JS changes.
- Theme grid uses `auto-fill, minmax(90px, 1fr)` — gracefully scales from 5 to 50+ themes.
- Wallpaper grid uses `auto-fill, minmax(75px, 1fr)` — same auto-scaling.
- All buttons (Apply, Reset, Import, Browse, Change Password) now use `var(--buttonBg/HoverBg/ActiveBg)` instead of hardcoded green/red/orange gradients.
- All text/borders use CSS variables throughout.

### `css/system/dialogs.css` (UPDATED)
- Removed old `.theme-dialog`, `.theme-tabs`, `.theme-tab`, `.theme-content`, `.tab-panel`, `.theme-controls` blocks — no longer needed.
- Removed old responsive rules for `.theme-dialog`.

## Secure Payment Modal — Theme Color Fix

### `css/system/payment-system.css` (REWRITTEN)
- Replaced all hardcoded text colors (`#000`, `#000080`, `#666`, `#333`, `#006600`) with `var(--menuText)` and `color-mix()` opacity blends.
- Replaced hardcoded white backgrounds with `var(--menuBg)`.
- Replaced hardcoded button states (`#d4d0c8`, `#b0b0b0`) with `var(--buttonHoverBg/ActiveBg)`.
- Primary button and progress bar now use `var(--titlebarBg)` with brightness filter for states.
- Security notice uses `color-mix(#ffcc00 20%, var(--windowBg))` instead of hardcoded `#ffffcc`.
- Success message uses `color-mix(#00cc00 15%, var(--windowBg))` instead of hardcoded `#e6ffe6`.
- Invalid input uses `color-mix(#ff4444 15%, var(--menuBg))` instead of hardcoded `#ffe6e6`.
- Spinner/focus ring now use `var(--uiIconColor)`.
- Added theme-aware styles for bank notice, payment methods, CC picker, download section, and error box (moved from injected JS `<style>` block).

### `js/services/payment-system.js` (UPDATED)
- Replaced inline error `style="background: #ffe6e6..."` with CSS class `.elxa-payment-error-box`.
- Removed 198-line injected `<style>` block from `setupEventListeners()` — all styles now in `payment-system.css`.

## Battery Center — WindowManager Migration & Theme Fix

### `js/services/battery-service.js` (UPDATED)
- Migrated Battery Center from raw DOM dialog (`document.body.appendChild`) to `WindowManager.createWindow()`. Now appears as a proper draggable, minimizable, focusable window with standard titlebar — matching ElxaBooks and other modern programs.
- Added `_batteryWindowId` tracking for proper window lifecycle management.
- Added `window.closed` event listener cleanup in `destroy()`.
- Removed custom header/close button HTML (WindowManager provides these).
- Removed bottom "Close" button (redundant with titlebar X).

### `css/system/battery.css` (REWRITTEN)
- Removed `.bdialog-container` fixed positioning and custom `.bdialog-header`/`.bdialog-close` styles (WindowManager handles window chrome now).
- Replaced all hardcoded colors with CSS variables: `#000080` → `var(--menuText)`, `white` backgrounds → `var(--menuBg)`, `#666` → `var(--menuText)` with opacity, `#e6f3ff` active mode → `color-mix()` with `var(--titlebarBg)`.
- Cell status colors (good/empty) now use `color-mix()` to blend semantic colors with theme background.
- Kept semantic status colors (health good/ok/warn/bad, fill levels, power mode indicators) as fixed — these need to stay recognizable regardless of theme.
- Shutdown overlay unchanged (full-screen black is intentional for all themes).

### `css/desktop.css` (UPDATED)
- Changed `.window-content` background from hardcoded `white` to `var(--windowBg)`. All programs already set their own backgrounds on their containers, so this was the last holdout preventing system dialogs from respecting themes.

## Pato & Sons Auto — Phase 8: World Integration & Polish

### `data/world-context.json` (UPDATED)
- Added `patoAuto` section with dealership name, website, description, salespeople (Pato Sr., Pato Jr., Sal) with roles/personalities/catchphrases, and 5 vehicle tiers with price ranges and lease availability.
- Added `pato.ex` to `approvedWebsites` list.

### `js/services/context-builder.js` (UPDATED)
- Added Pato & Sons Auto block to `getWorldContext()` — includes dealership description, salespeople summary, and vehicle tier names. Mirrors the Mallard Realty pattern.
- Added `_getVehicleInfo()` private helper — reads vehicle inventory and generates context lines like "User is leasing a Rust Bucket from Pato & Sons Auto" or "User owns a Sidewinder outright."
- `getUserContext()` now includes vehicle ownership info alongside property and employment context.

### `assets/interwebs/pato-and-sons-auto/dealership.js` (UPDATED)
- **renderTiers()**: Overhauled — now includes "Meet the Team" staff bio section with cards for Pato Sr., Pato Jr., and Sal (name, role, bio, catchphrase). Each tier card now shows insurance rate, depreciation rate, assigned salesperson, and a flavor review quote.
- **getOwnedVehicles()**: Cleaned up debug console.log statements left over from caching debug session. Function is now clean.

### `assets/interwebs/pato-and-sons-auto/styles.css` (UPDATED)
- Added `.pato-staff-section`, `.pato-staff-grid`, `.pato-staff-card`, `.pato-staff-name`, `.pato-staff-role`, `.pato-staff-bio`, `.pato-staff-catchphrase` — staff bio card styling on the Tiers page.
- Added `.pato-tier-review` — italic review quotes with warm accent border on tier cards.

### Bug Fixes
- Fixed `getOwnedVehicles()` — was calling nonexistent `getItemsByCategory('vehicles')`, now uses `getVehicles()`. (Fix from previous session, now verified working after cache resolution.)
- `itemId` vs `id` field mismatch in `renderMyVehicles()` and `getVehicleOwnership()` — confirmed already fixed on disk. Code correctly uses `item.id`.
- Removed leftover debug logging from `getOwnedVehicles()`.

## Pato & Sons Auto — Phase 7: Sell Flow

### `assets/interwebs/pato-and-sons-auto/dealership.js` (UPDATED)
- **renderMyVehicles()**: Now shows current depreciated value (from inventory), depreciation % from purchase price, "Current Value" label, and a Sell button for owned/financed vehicles. Leased vehicles still show monthly lease rate and Return button.
- **renderDetail()**: Owned/financed vehicles now show a "Sell Vehicle" button alongside the ownership badge.
- **handleSell(vehicleId)**: Entry point for sell flow. Reads depreciated `currentValue` from inventory, looks up active auto loan via `getLoansSync()`, calculates net proceeds (currentValue - remainingBalance), then shows sell overlay.
- **showSellOverlay()**: Confirmation dialog with vehicle valuation (purchase price vs current value), depreciation %, auto loan payoff section (if financed), net proceeds box (green if positive, red if underwater). Underwater detection: if net < 0, checks checking balance — blocks sale if user can't cover shortfall.
- **confirmSell()**: Deposits sale price to checking → pays off auto loan via `payOffLoan()` (if financed) → removes vehicle via `loseVehicle('sold')` → shows sale ceremony → notification.
- **showSaleCeremony()**: Ceremony overlay with financial summary (sale price, loan payoff, net deposited), profit/loss indicator, salesperson farewell quote.
- **getSalespersonSellQuote()**: Per-salesperson farewell quotes (Pato Sr., Pato Jr., Sal).
- **Event delegation**: Wired `sell-vehicle` action.
- **Public API**: Added `handleSell`.

### `assets/interwebs/pato-and-sons-auto/styles.css` (UPDATED)
- Added `.pato-btn-sell` button styles (warm mustard, matches buy button).
- Added `.pato-confirm-btn-sell` and `.pato-confirm-btn-disabled` confirm dialog button styles.
- Added `.pato-my-vehicle-value-label`, `.pato-my-vehicle-depreciation` styles for My Vehicles tab.
- Added `.pato-sell-*` styles: section labels, depreciation indicator, deduction text, net proceeds box (positive/negative variants).
- Added `.pato-sale-*` ceremony styles: summary rows, total row, profit/loss indicators.
- Added `.pato-ceremony-*.sale` variants: icon gradient, title color, border, message accent, button.

## Pato & Sons Auto — Phase 6: Insurance + Depreciation (Finance Cycle)

### `js/services/inventory-service.js` (UPDATED)
- **acquireVehicle** now stores `tier`, `insuranceRate`, `depreciationRate`, and `insuranceMissed` fields on vehicle objects.
- **getOwnedVehicles()**: Returns non-leased vehicles (subject to insurance/depreciation).
- **getLeasedVehicles()**: Returns leased vehicles only.
- **recordInsurancePayment(vehicleId, amount)**: Resets missed counter, tracks total paid.
- **recordMissedInsurancePayment(vehicleId)**: Increments missed counter. At 3 consecutive misses, emits `inventory.vehicleImpounded` event and calls `loseVehicle()` with reason 'impounded'.
- **applyDepreciation(vehicleId, newValue)**: Updates `currentValue` with 20% purchase price floor.

### `js/services/finance-cycle.js` (UPDATED)
- **Step 6.5 — Vehicle Insurance**: `_processVehicleInsurance(cycleMonth)` — iterates owned/financed vehicles, charges insurance based on current depreciated value × insuranceRate. Missed payments tracked per-vehicle with graduated credit score penalties (-5 first, -10 second, -25 impoundment). Emits `finance.paymentMissed` with type `vehicle-insurance`.
- **Step 6.75 — Vehicle Depreciation**: `_processVehicleDepreciation(cycleMonth)` — applies compound depreciation to ALL vehicles (including leased). Formula: `currentValue * (1 - depreciationRate)`. Floor at 20% of purchase price.
- **getMonthlyObligationsSync()** now includes vehicle insurance costs in the breakdown.
- Step numbering updated: secured card graduation is now step 6.5b.

### `assets/interwebs/pato-and-sons-auto/dealership.js` (UPDATED)
- Both `acquireVehicle` calls (lease + buy) now pass `tier`, `insuranceRate`, `depreciationRate` fields.

### `js/services/finance-notifications.js` (UPDATED)
- **_onVehicleInsuranceMissed(data)**: Notification (warning/critical) + in-character emails from Snakesian Auto Insurance Authority. First notice (gentle reminder) and second notice (impoundment threat).
- **_onVehicleImpounded(data)**: Critical notification + formal impoundment notice email.
- New event listeners: `finance.paymentMissed` type `vehicle-insurance`, `inventory.vehicleImpounded`.

## Pato & Sons Auto — Phase 5: Buy Flow (Auto Loan)

### `assets/interwebs/pato-and-sons-auto/dealership.js` (UPDATED)
- **Loan math helpers**: `calcMonthlyPayment(principal, annualRate, termMonths)`, `calcTotalInterest(principal, monthlyPayment, termMonths)`, `getAutoLoanApr(score)` — mirrors finance-loans.js APR calculation. `termLabel(months)` for display.
- **Buy flow**: `handleBuy(vehicleId)` → ownership check → credit score eligibility (580+) → tier check (loan amount vs max for score) → active auto loan count check (max 3) → down payment check (10% from checking) → APR calculation → `showBuyOverlay()`.
- **Buy overlay**: `showBuyOverlay(vehicle, downPayment, loanAmount, apr, balance)` — vehicle preview, "Auto Loan Application" section label, price/down payment/loan amount/APR breakdown, term selector buttons (1-5 years), dynamic payment preview (monthly amount, total interest, total cost), checking balance before/after, payment warning note. "Apply for Auto Loan" confirm button.
- **Term selector**: `wireBuyTermSelector(loanAmount, apr, downPayment)` — click handler updates active button, recalculates monthly payment/interest/total cost, updates all display elements live.
- **Confirm buy**: `confirmBuy(vehicleId)` — withdraws 10% down payment → `applyForLoan({ type: 'auto' })` → refunds down payment on denial → clawback loan disbursement (paid to dealership) → `acquireVehicle()` as 'financed' with loanId → purchase ceremony → notification → refresh views.
- **Purchase ceremony**: `showPurchaseCeremony(vehicle, loanTerms)` — gold sparkles, seal icon with pulse animation, "It's Official! Title Transfer Complete", vehicle preview, deed document (date, vehicle name, loan terms breakdown: down payment, loan amount, monthly payment, APR, term), salesperson buy quote, "Take Her Home" button.
- **Salesperson buy quotes**: `getSalespersonBuyQuote(vehicle)` — in-character purchase quotes from Pato Sr., Pato Jr., Sal.
- **Detail view updated**: Buy button now active (removed disabled/coming-soon state). Wired to `data-action="buy"`.
- **Event delegation updated**: Handles `data-action="buy"`.
- **Public API updated**: Exposes `handleBuy`.
- **State variable added**: `pendingBuyTermMonths` for term selector persistence.

### `assets/interwebs/pato-and-sons-auto/styles.css` (UPDATED)
- **Buy confirm button**: `.pato-confirm-btn-buy` — gold/amber gradient, white text.
- **Buy overlay dialog**: `.pato-confirm-dialog-buy` max-width 500px. `.pato-buy-section-label` — gold accent with bottom border (matches "Auto Loan Application" header).
- **Term selector**: `.pato-buy-term-section`, `.pato-buy-term-label`, `.pato-buy-term-options` flex row, `.pato-term-btn` buttons with hover/active states (gold active).
- **Payment preview**: `.pato-buy-payment-preview` — cream background, gold border, large monthly amount display, interest/total cost breakdown row.
- **Purchase ceremony**: `.pato-ceremony-purchase` title/subtitle colors, `.pato-ceremony-icon-wrap.purchase` gold gradient with pulse animation.
- **Deed document**: `.pato-purchase-deed` — cream card with border, `.pato-deed-vehicle-name` large gold text, `.pato-deed-terms` term breakdown rows.
- **Ceremony button**: `.pato-ceremony-btn.purchase` — gold gradient button.
- **Financed badge**: `.pato-badge-financed` — gold background, white text.

### User-Facing Highlights
- Buy vehicles at Pato & Sons Auto! Apply for auto loans with down payment, term selection, and monthly payment preview.
- Purchase ceremony with title transfer document and salesperson congratulations.

---

## Pato & Sons Auto — Phase 4: Lease Flow

### `assets/interwebs/pato-and-sons-auto/dealership.js` (UPDATED)
- **Lease flow**: `handleLease(vehicleId)` → balance check → confirmation dialog (vehicle preview, monthly cost, balance before/after, payment warning) → `confirmLease()` → creates recurring payment + withdraws first month from checking + acquires vehicle as 'leased' via inventoryService → keys handover ceremony overlay.
- **Return vehicle flow**: `handleReturnVehicle(vehicleId)` → confirmation dialog (vehicle info, lease since date, warning) → `confirmReturnVehicle()` → calls `loseVehicle()` (auto-cancels lease payment) → return farewell ceremony overlay.
- **Ceremony overlays**: `showKeysHandoverCeremony(vehicle)` — animated key icon with sparkles, vehicle preview, salesperson quote. `showReturnFarewell(vehicle, acquiredDate)` — subdued car-back icon, time-spent note, farewell message.
- **Salesperson quotes**: `getSalespersonLeaseQuote(vehicle)` — returns in-character quote from Pato Sr., Pato Jr., or Sal.
- **Confirm overlay system**: Generic `showConfirmOverlay({ title, body, confirmText, cancelText, confirmClass, onConfirm })` / `hideConfirmOverlay()` — reusable for Phase 5 buy flow.
- **Toast helper**: `showToast(html)` — uses ElxaOS ui.showToast if available, inline fallback otherwise.
- **Detail view updated**: Lease button now functional (no longer disabled/coming-soon) for tiers 1-3 vehicles. Buy button still disabled. Leased vehicles show "Return Vehicle" button in detail view.
- **My Vehicles updated**: Leased vehicles show inline "Return" button.
- **Event delegation updated**: Handles `data-action="lease"`, `data-action="return-vehicle"`, `data-confirm-action="confirm"`, `data-confirm-action="cancel"`. Ceremony dismiss now refreshes current view after closing.
- **Public API updated**: Exposes `handleLease`, `handleReturnVehicle`.

### `assets/interwebs/pato-and-sons-auto/styles.css` (UPDATED)
- **Confirmation dialog styles**: Full component CSS — `.pato-confirm-btn` variants (lease/danger/cancel), `.pato-confirm-vehicle` preview card, `.pato-confirm-details` + `.pato-confirm-row` summary rows, `.pato-confirm-note` info/warning notes, `.pato-confirm-row-after` green balance-after row.
- **Ceremony overlay styles**: `.pato-ceremony-icon-wrap` with pulse animation, `.pato-ceremony-vehicle` preview card, `.pato-ceremony-message` with salesperson quote, `.pato-ceremony-btn` variants (lease/return), `.pato-sparkle` animated particles (6 positions, staggered delays), `@keyframes sparkleFloat` + `@keyframes ceremonyPulse`.
- **Return button**: `.pato-btn-return` styling for detail view and my vehicles tab.
- **Toast fallback**: `.pato-toast` fixed positioning with slide-in animation.

### `js/services/inventory-service.js` (UPDATED)
- **`loseVehicle()` now cancels linked lease payment**: Before removing a vehicle, checks for `leasePaymentId` and calls `financeService.cancelRecurringPayment()`. Mirrors how `loseProperty()` cancels rent payments via `_cancelLinkedPayments()`.

---

## Pato & Sons Auto — Phase 3: Website Build

### `assets/interwebs/pato-and-sons-auto/index.html` (NEW)
- **Full site structure**: Banner, 3-tab navigation (Browse, Tiers, My Vehicles), vehicle grid, filter bar, detail overlay, confirmation dialog overlay, ceremony overlay, footer.
- **Mirrors Mallard Realty architecture**: Same HTML pattern — banner + nav + tabs + overlay system.

### `assets/interwebs/pato-and-sons-auto/styles.css` (NEW)
- **Warm family-dealership styling**: Mustard/amber (#f5c542) + charcoal (#3a3330) + cream (#faf5eb) color scheme. Distinct from Mallard's teal.
- **Full component CSS**: Nav tabs, filter bar, vehicle grid cards with hover lift, tier badge colors (5 tiers), availability badges, status badges, detail overlay with specs grid + features list + salesperson quote, confirmation dialog, ceremony overlay, tiers info cards, my vehicles horizontal cards, footer.
- **Responsive grid**: `grid-template-columns: repeat(auto-fill, minmax(260px, 1fr))` for vehicle cards.

### `assets/interwebs/pato-and-sons-auto/dealership.js` (NEW)
- **IIFE pattern** (`var PatoAuto`): Same architecture as Mallard's `realty.js`. Uses `var` for globals (interwebs re-execution safety).
- **Browsing**: Vehicle grid with card rendering (image, name, year/type/mileage, price, tier + availability badges).
- **Filtering**: By tier (5 options), price range (5 brackets in snakes), vehicle type (dynamically populated from data), sort (price asc/desc, newest, name A-Z).
- **Detail view**: Full-screen overlay with vehicle image, specs grid (year, type, mileage, color, engine, insurance rate), features list, description, quirks, salesperson quote, lease/buy cost preview. Action buttons present but disabled (functional in Phases 4-5).
- **Auto loan banner**: Shows user's credit score, auto loan tier, and max financing amount using sync finance bridge methods.
- **Tiers info page**: All 5 tiers with price ranges, lease/buy availability, descriptions, and score qualification status (green check vs lock icon).
- **My Vehicles tab**: Shows owned vehicles with image, name, type, ownership badge. Empty state with car-off icon.
- **Event delegation**: Single click handler on `.pato-root` for nav tabs, card clicks, detail close, ceremony dismiss. Filter change listeners on all 4 dropdowns.
- **Finance integration**: Uses `getCreditScoreSync()`, `getAccountBalancesSync()`, `getAutoLoanMaxForScore()` for reads. Reads inventory via `getItemsByCategory('vehicles')`.
- **Public API**: Exposes renderGrid, renderMyVehicles, renderDetail, closeDetail, switchTab, helpers for future phase use.

### `js/programs/website-registry.json` (UPDATED)
- **Added `pato.ex` entry**: Title "Pato & Sons Auto — Quality Rides for Every Snake", path to index.html + styles.css, keywords include car/vehicle/dealership/auto loan/lease, category "Business".

## Pato & Sons Auto — Phase 1: Finance Service Updates

### `js/services/finance-loans.js` (UPDATED)
- **`LOAN_TYPES.auto` updated**: Amount range expanded from [500, 5000] to [500, 300000]. Max active loans increased from 1 to 3. Term range extended from [12, 48] to [12, 60] months. Base APR lowered from 14 to 12.
- **`AUTO_LOAN_TIERS` constant added**: 5 score-based tiers — Starter (580+, $5k), Standard (630+, $15k), Standard Plus (670+, $40k), Premium (720+, $100k), Elite (760+, $300k). Same pattern as `MORTGAGE_TIERS`.
- **Auto branch added to `_calculateLoanTerms()`**: Uses `AUTO_LOAN_TIERS` for score-gated max amounts instead of linear interpolation. APR still scales linearly with score. Mirrors the mortgage branch exactly.
- **`getAutoLoanMaxForScore()` helper added**: Returns max auto loan amount, tier label, APR, and all tiers for a given credit score. Used by Pato & Sons Auto dealership website to show affordability without a full application. Mirrors `getMortgageMaxForScore()`.

## Phase 7 — Centralized Context Builder + World Context Enrichment

### `js/services/context-builder.js` (NEW)
- **Centralized LLM prompt context service**: Single source of truth for world/user context that both messenger and email consume. Purely string assembly — not an LLM service.
- **`getWorldContext()`**: Builds narrative worldbuilding block dynamically from world-context.json. Covers Snakesia overview, ExWeb/internet, key characters with relationships, Mallard Realty (agents + neighborhoods), notable attractions, bank.
- **`getUserContext()`**: Dynamic user info block. Only includes lines the user has actually unlocked — property ownership/rental (from inventoryService), employment (from employmentService), username/about (from messenger settings).
- **`getFullContext()`**: Convenience method combining world + user blocks.
- **`getApprovedSites()`**: Formatted approved websites list for email only.
- **Graceful fallback**: If context builder isn't ready, both messenger and email fall back to their legacy inline context construction.
- **Global access**: `elxaOS.contextBuilder`

### `data/world-context.json` (UPDATED)
- **Rita Marway age corrected**: 20 (was missing). Added interests and relationships.
- **Relationships added** to all key characters: Mr. Snake-e (wife), Mrs. Snake-e (husband), Remi (sister), Rita (brother), Pushing Cat (hideout).
- **Interests added** to Mr. Snake-e.
- **6 neighborhoods added** to locations: Dusty Flats, Pine Hollow, Cloverfield, Downtown Snake Valley, Maple Heights, Serpentine Estates.
- **2 attractions added**: Snakesia Aquarium, Snake Valley National Museum.
- **mallardRealty section added**: agents with specialties/personalities, neighborhood list.
- **approvedWebsites expanded**: Added mallard.ex, sssteam.ex, mrs-snake-e.garden.

### `js/services/email-llm-service.js` (REFACTORED)
- **`buildPrompt()` refactored**: Uses context builder for world/user/site context instead of manual inline construction.
- **Character enrichment**: Prompt now includes role, age, interests, relationships (email now has parity with messenger).
- **Graceful fallback**: Falls back to legacy if context builder unavailable.

### `js/programs/messenger.js` (REFACTORED)
- **`buildEnhancedPrompt()` refactored**: Uses context builder for world/user context instead of manual inline construction.
- **Relationships now included** in character background section.

### `js/elxaos.js` (EDITED)
- **asyncInit step 2.75**: Initialize ContextBuilderService after inventory (2.7), before notification (2.8).

### `index.html` (EDITED)
- **Script tag added**: `context-builder.js` after `conversation-history.js`.

---

## Phase 6 — Mallard Realty Sell Flow + Property Appreciation

### `assets/interwebs/mallard/realty.js` (REWRITTEN)
- **Property appreciation system**: Per-neighborhood monthly rates (Dusty Flats 0.5%, Pine Hollow 0.8%, Cloverfield 1.0%, Downtown 1.2%, Maple Heights 1.5%, Serpentine Estates 2.0%). Compound growth capped at 200% of purchase price.
- **Full sell flow**: Click Sell → property valuation overlay (purchase price, current market value, appreciation %, mortgage payoff if applicable, net proceeds) → confirmation → sale processing → sale ceremony overlay
- **Sell overlay**: Shows property preview, valuation section with appreciation indicator, mortgage payoff deduction (if mortgaged), net proceeds box (green for profit, red for underwater). Warns if property is underwater and blocks sale if user can't cover the shortfall.
- **`confirmSell()`**: Deposits sale price to checking → pays off active mortgage via `payOffLoan()` → removes property from inventory via `loseProperty('sold')` → sale ceremony → notification
- **Sale ceremony overlay**: Green themed, cash-check icon, property preview, financial summary table (sale price, mortgage payoff, net deposited), profit/loss indicator, farewell message
- **Underwater sale handling**: If mortgage balance exceeds property value, shows warning + checks checking balance can cover difference. Disables confirm button if user can't afford the shortfall.
- **`isLoanActive()` helper**: Checks if a loan ID corresponds to an active loan. Used throughout to distinguish MORTGAGED (active loan) from OWNED (paid off) badges/labels.
- **Updated browse grid badges**: Now shows separate MORTGAGED badge (amber) vs OWNED badge (gold) based on active loan status instead of just checking for loanId existence.
- **Updated detail view**: Sell button enabled with current market value. Owned label correctly reflects mortgage status.
- **Updated My Properties tab**: Shows current market value with appreciation percentage (green +% or red -%), enabled Sell button (was disabled "Coming Soon"), purchase price renamed to "Purchased".
- **Appreciation helpers**: `calcMonthsOwned()`, `calcCurrentValue()`, `calcAppreciationPercent()` — compound appreciation from acquired date.

### `assets/interwebs/mallard/styles.css` (APPENDED)
- MORTGAGED badge (amber, distinct from gold OWNED badge)
- Sell button styles (detail view + My Properties)
- Appreciation labels in My Properties (green positive, red negative)
- Sell overlay: section labels, appreciation indicator, mortgage deduction, net proceeds box (green/red variants), disabled confirm state
- Sale ceremony: green theme (border, icon gradient, property preview, summary table, profit/loss indicator, button)

---

## Phase 5 — Mallard Realty Buy Flow (Mortgage + Deed Ceremony)

### `assets/interwebs/mallard/realty.js` (REWRITTEN)
- **Full buy flow**: Click Buy → eligibility checks (credit score, tier max, active mortgage count, down payment balance) → mortgage application overlay → confirm → purchase
- **Mortgage application overlay**: Property preview, 5% down payment breakdown, loan amount, APR, interactive term selector (3/5/7/10 year toggle buttons), live monthly payment preview that updates on term change, total interest + total cost display, checking balance before/after
- **`confirmBuy()`**: Withdraws 5% down payment → `applyForLoan({ type: 'mortgage' })` → claws back disbursement (loan money pays seller, not buyer) → `acquireProperty('mortgaged', { loanId })` → deed ceremony → notification
- **Deed ceremony overlay**: Gold/parchment themed, official seal icon, property deed document text with date + address, property image, mortgage summary (down payment, loan amount, monthly payment, term + APR), agent congratulations quote
- **`getMortgageApr()`**: Mirrors finance-loans.js APR calculation locally for the confirmation dialog
- **Updated property card badges**: Now shows MORTGAGED badge for mortgaged properties (was just OWNED)
- **Updated detail view**: Owned state now shows "Mortgaged — You Own This Property" with seal icon when loanId exists
- **Refund on denial**: If mortgage application is denied after down payment withdrawal, automatically refunds the down payment
- **Error handling**: Toast messages for every failure path (score too low, tier exceeded, max mortgages, insufficient funds)

### `assets/interwebs/mallard/styles.css` (APPENDED)
- Buy confirmation dialog (wider 420px variant)
- Mortgage section label styling
- Term selector toggle button row (flex, active state = teal)
- Payment preview card (green tint, big monthly amount, interest/cost details)
- Buy confirm button (teal gradient)
- Deed ceremony overlay (gold/parchment theme: border, seal icon gradient, document section, summary rows, gold button)
- Owned button state for detail view

---

## ElxaBooks NaN Bug Fixes + Mallard Realty Notification Integration

### `js/programs/elxabooks.js` (UPDATED)
- Fixed NaN on Monthly Obligations card: `getMonthlyObligationsSync()` returns an object, not a number — now reads `.totalMonthlyObligations`
- Fixed undefined/NaN on Employment card: was calling `getEmploymentSummary()` (returns string) instead of `getEmploymentData()` (returns data object with `.position`, `.annualSalary`)

### `assets/interwebs/mallard/realty.js` (UPDATED)
- Added notification center entry on successful rent ("Welcome Home!" with `mdi-home-plus`)
- Added notification center entry on move-out ("Moved Out" with `mdi-home-minus`)
- Both use `toast: false` since ceremony overlays already provide visual feedback

---

## Serpentville Conservation Initiative — New Donation Site

### `assets/interwebs/environmental-protection/index.html` (NEW)
- Full donation website for the Serpentville Conservation Initiative (sci.ex)
- Unique sidebar layout with vertical hero image (forest/stream scene)
- 3 monthly donation tiers: Seedling (10 snakes), Guardian (30 snakes), Conservator (60 snakes)
- Payment processing, recurring payments, inventory subscription tracking
- Active supporter banner, cancel flow, welcome/farewell emails from Dr. Ivy Fernscale
- Earth-tone design (forest greens, amber accents, cream backgrounds)

### `assets/interwebs/environmental-protection/styles.css` (NEW)
- Sidebar hero layout with sticky positioning and gradient overlay
- Tier selection cards, confirm box, supporter note, active banner

### `assets/interwebs/environmental-protection/sci-data.js` (NEW)
- Global SCI_DATA object with 8 rotating monthly email messages
- Conservation themes: reforestation, river cleanup, wildlife census, education, habitat protection, invasive species, trail maintenance, research findings

### `js/services/finance-notifications.js` (UPDATED)
- Added `sci-donation` linkedId check in `_onRecurringPaymentProcessed()`
- Added `_handleSCIPayment()` method — monthly update emails with rotating messages, payment count tracking, annual Conservation Gala invitations for Conservator tier

### `js/programs/website-registry.json` (UPDATED)
- Added `sci.ex` entry pointing to environmental-protection site, category "Charity"

### `index.html` (UPDATED)
- Added `<script>` tag for `sci-data.js` (loaded after swf-data.js)

## Museum & Aquarium — Ticket Purchasing System

### `js/services/inventory-service.js` (UPDATED)
- Added `'tickets'` to `INVENTORY_CATEGORIES` (now 7 categories)
- Added ticket methods: `getTickets()`, `getValidTickets()`, `getTicketsByVenue(venue)`, `getGiftableTickets()`
- Updated `getOwnershipSummary()` to include valid tickets grouped by venue in LLM context
- Added `debug.addTicket(venue, type, price)` helper

### `assets/interwebs/museum/index.html` (UPDATED)
- Added "Buy Tickets" section in Visit area below hours/admission/location grid
- 3 ticket types with quantity selectors (0-10): Adult ($20/snakes, $10 USD), Child ($10/snakes, $5 USD), Senior ($14/snakes, $7 USD)
- `buyTickets()` — one-time `processPaymentSync`, creates individual ticket items in inventory
- Live total calculation updates as quantities change
- Confirmation email from Dr. Helena Cobrish with itemized order
- Toast notification on purchase
- Supporters see "Buy Gift Tickets" header with note about free admission
- `checkSupporterTicketNote()` refreshes on init and after donation changes

### `assets/interwebs/museum/styles.css` (UPDATED)
- Added ticket purchase box styles: navy header, supporter note banner, ticket type rows, quantity selectors, total + purchase button footer

### `assets/interwebs/aquarium/index.html` (UPDATED)
- Same ticket system as museum with aquarium pricing: Adult ($24/snakes, $12 USD), Child ($14/snakes, $7 USD), Senior ($18/snakes, $9 USD)
- Confirmation email from Dr. Marina Coralscale
- All aquarium-prefixed IDs and class names

### `assets/interwebs/aquarium/styles.css` (UPDATED)
- Added ticket purchase box styles matching aquarium teal + coral theme

### Ticket Inventory Item Structure
- Category: `tickets`
- Fields: `venue`, `venueShort` ('museum'|'aquarium'), `ticketType` ('adult'|'child'|'senior'), `ticketLabel`, `price` (USD), `purchaseDate`, `status` ('valid'), `giftable` (true)
- Each ticket is an individual item for future gifting support

---

## Snake Valley Aquarium — Monthly Donation Site

### `assets/interwebs/aquarium/index.html` (NEW)
- Full aquarium website: header with nav, hero banner, about section, 6 exhibit cards with images, visit info (hours/admission/location), and 4-tier donation system
- Uses `processPaymentSync()` for first payment, `addRecurringPayment()` with linkedId `aquarium-donation` for monthly charges
- `addItem('subscriptions')` for ElxaBooks integration
- 3-path email injection for welcome/farewell emails from Dr. Marina Coralscale
- One donation at a time, with tier change support (silent cancel of old + new signup)
- Cancel flow with ElxaUI confirm dialog
- Tiers: Friend ($50/mo) / Explorer ($200/mo) / Guardian ($500/mo) / Benefactor ($1000/mo) in snakes
- Tier amounts in USD internally: 25/100/250/500

### `assets/interwebs/aquarium/styles.css` (NEW)
- Deep teal + coral theme (#0e4d64 primary, #e87461 coral accent)
- Exhibit cards with image headers, same flex column layout pattern as museum
- Tier cards in 4-column grid, modal overlay for tier selection

### `assets/interwebs/aquarium/images/` (user-created)
- `shark tank.png`, `clownfish tank.png`, `jellyfish.png`, `penguins.png`, `kids petting starfish.png`, `starfish dry display.png`
- `banner.png` in parent folder

### `js/programs/website-registry.json` (UPDATED)
- Added `aquarium.ex` entry with path, CSS, search keywords, category "Education"

### `js/services/finance-notifications.js` (UPDATED)
- Added `aquarium-donation` linkedId check in `_onRecurringPaymentProcessed()` before SWF handler
- Added `_handleAquariumPayment()` method — tracks payment count, sends annual event invitations every 12 payments for Guardian (level 2) and Benefactor (level 3)
- Guardian gets "Ocean Night Experience" invite (first Friday in May, smart casual)
- Benefactor gets "Annual Benefactor's Gala Dinner" invite (second Saturday in September, formal) plus Ocean Night

---

## Employment Management — Step 3: Portal Manage Employment UI

### Employment Service (`employment-service.js`)
- Added `payFormat` field to employment data (default: `'snakes'`)
- Added `setPayFormat(format)`, `getPayFormat()`, `formatPay(usdAmount)`
- `payFormat` carried through `hire()`, `transfer()`, `_createDefault()`, and migration

### Employee Portal HTML (`employee-portal.html`)
- Replaced "Game Room" button with "My Job" button
- Added My Job overlay: Current Position, Contact Supervisor, Pay Format, Internal Transfer, Resign

### Employee Portal JS (`employee-portal.js`)
- Added `ELXACORP_POSITIONS` lookup table (8 positions) and `MANAGER_EMAILS` mapping
- Added methods: `openManageEmployment`, `emailSupervisor`, `updatePayFormat`, `requestTransfer`, `resignFromElxaCorp`
- Transfer: confirm → update employment service → update localStorage → queue HR email → refresh UI
- Resign: double-confirm → terminate → queue farewell email → clear data → logout
- Removed `openGameRoom()`

### Portal Styles (`portal-styles.css`)
- My Job overlay styles: sections, position list, pay format radios, transfer buttons, danger zone

---

## Employment Management — Step 2: Transfer Method

### Employment Service (`employment-service.js`)
- Added `transfer(transferData)` method — internal position transfer within the same employer
- Accepts `{ position, department, annualSalary, salaryDisplay, manager }`
- Preserves: employeeId, hireDate, ytdEarnings, payHistory, lastPayday, payFrequency
- Updates: position, department, annualSalary, salaryDisplay, manager
- Emits `employment.transferred` event with both old and new position/salary data
- Updated header comment to document the new event
- Console-testable: `await elxaOS.employmentService.transfer({position: 'Cookie Quality Assurance Tester', department: 'Quality Assurance', annualSalary: 40000, salaryDisplay: '80,000 snakes per year', manager: 'Mrs. Snake-E'})`

---

## Employment Management — Step 1: Inquiry Safety Valve

### Apply Page Rewrite (`index.html`)
- Rewrote `checkEmploymentStatus()` to detect three states:
  - **State 1 (Fresh)**: No applications, not employed — shows normal apply form
  - **State 2 (Pending)**: Application submitted but not yet employed — hides form, shows application status with **"Inquire About Application"** button
  - **State 3 (Employed)**: Already employed (checks employment service first, then localStorage profiles) — hides form, shows position/department/ID + portal link + "Didn't receive your credentials?" resend link
- Employment service is checked first for State 3 (modern path), with localStorage profiles as fallback (legacy)
- Added `inquireAboutApplication()` — calls `resendHiringEmail()`, shows success message with portal link
- Added `resendCredentials()` — same resend but for State 3 users who lost their email

### Job Integration (`elxacorp-job-integration.js`)
- Added `resendHiringEmail()` — safety valve that finds the most recent application, re-bridges to employment service (in case original bridge failed), and re-sends the hiring email with credentials

## Phase 6 Steps 3-4: ElxaCorp Job Integration + Employee Portal Migration

### Step 3: ElxaCorp Job Integration (`elxacorp-job-integration.js`)
- Added `_bridgeToEmploymentService()` — on hire, calls `elxaOS.employmentService.hire()` with parsed employment data (employeeId, position, department, annual salary, hire date, manager, pay frequency)
- Added `_parseSalaryNumeric()` — extracts raw USD annual salary from position lookup table (same numbers as `calculateSalary()` but returns a number, not a display string)
- Bridge call fires right after user profile creation, before confirmation emails are sent
- Graceful degradation: if ElxaOS or employment service isn't available (e.g. portal loaded standalone), hire proceeds normally without OS registration
- Converted all template literals to string concatenation throughout file to prevent `edit_file` dollar-sign stripping

### Step 4: Employee Portal Migration (`employee-data.js`)
- Added `_hasEmploymentService()` / `_hasFinanceService()` — sync checks for OS service availability
- Added `_syncFromEmploymentService()` — on portal load, syncs payroll data (lastPayday, ytdEarnings, payHistory) from the employment service registry into the portal's local data for UI display
- **Constructor**: checks for employment service first; if available, syncs from it instead of running legacy `processPaydays()`
- **`processPaydays()`**: skips entirely when employment service is handling paychecks (prevents double-deposit)
- **`depositToBank()`**: routes through `financeService._depositDirect()` when available; falls back to direct localStorage bank manipulation for legacy/standalone use
- **`getPayPerPeriod()`**: delegates to employment service when available
- **`getNextPayday()`**: delegates to employment service when available
- **`getYTDEarnings()`**: reads from employment service when available
- **`getBankAccountInfo()`**: reads from finance service when available
- **`linkBank()`**: simplified response when finance service handles deposits
- Time clock + tickets remain portal-managed in localStorage (portal-specific features)
- Converted spread operators to `Object.assign()` and arrow functions to regular functions

## ElxaBooks Pro — Financial Dashboard Expansion

### Full Rewrite: `js/programs/elxabooks.js` + `css/programs/elxabooks.css`
- **Window size**: 780x540 → 900x600
- **8 views** (was 4): Dashboard, Accounts, Credit Cards, Loans, Subscriptions, Taxes, Bookkeeping, Reports
- **Real finance integration**: Dashboard, Accounts, Cards, Loans, Taxes, and Reports now pull live data from `financeService`, `inventoryService`, and `employmentService`
- **Dashboard**: Total balance across all accounts, credit score, monthly obligations, employment status, debt summary, recent transactions from financeService
- **Accounts**: Checking/savings/trust balances + full transaction history from financeService
- **Credit Cards**: Active cards with balance, limit, utilization bar, APR. Make payment button delegates to financeService
- **Loans**: Active loans with progress bars, remaining balance, payment schedule. Extra payment button
- **Subscriptions**: Shell UI ready for future money sinks. Shows active subs from inventoryService with cancel button
- **Taxes**: Property tax obligations from inventoryService — value, rate, annual/monthly tax, missed payments warning
- **Bookkeeping**: Existing manual transactions + invoices preserved, now under sub-tabs
- **Reports**: Net worth (assets minus debt), recurring payments summary, plus original category breakdowns
- **Currency**: All financeService amounts (stored in USD) converted to snakes (×2) for display via `snk()` helper
- **Sidebar**: Section labels (Overview / Finance / Business) for navigation clarity
- **CSS**: New styles for credit cards grid, loan cards, score banner, subscription list, tax cards, bookkeeping tabs, debt banner

## Notification System (Steps 1-4)

### Step 1: NotificationService Infrastructure (NEW)
- **`js/services/notification-service.js`** — Full NotificationService class. Bell icon in system tray (between WiFi and clock), slide-out panel from right side, desktop toast popups, badge with unread count. Registry-backed per-user persistence. API: `addNotification()`, `markRead()`, `markAllRead()`, `dismissNotification()`, `clearAll()`, `getUnreadCount()`. Max 50 notifications. Toasts stack bottom-right (max 3 visible), auto-dismiss 5s (8s critical).
- **`css/system/notifications.css`** — Panel (320px slide-out), notification items (unread/urgency highlights), dismiss on hover, toast popups (slide-in from right), badge (red dot with pulse animation).
- **`index.html`** — Added bell icon to system tray, added script tags for notification-service.js and finance-notifications.js.
- **`css/desktop.css`** — Added `@import url('system/notifications.css')`.
- **`js/elxaos.js`** — Constructor + asyncInit wiring for NotificationService and FinanceNotificationService.

### Step 2+3: Finance Notifications — Emails + Notification Entries (NEW)
- **`js/services/finance-notifications.js`** — FinanceNotificationService: listens to finance/inventory events and sends both immersive in-character emails AND utilitarian notification center entries. Covers: credit card missed/frozen, loan missed/defaulted/paid off, property tax missed/foreclosure, rent missed/eviction, savings interest, credit score changes, monthly cycle summary. Uses ElxaCorp email injection pattern (live → localStorage → queue). Rental property cache for eviction emails (property already removed from inventory when event fires).

### Step 4: Polish
- **`css/system/notifications.css`** — Full theme compatibility pass:
  - All hardcoded colors → CSS variables (`--menuText`, `--menuHoverText`, `--menuHoverBg`, `--windowBg`)
  - Unread/urgency highlights use `color-mix()` for theme-adaptive tinting
  - Toast `bottom` transition for smooth stacking animation when toasts are removed
  - Toast hover shadow effect
  - Dismiss button opacity states (idle → hover → active)
  - Panel empty state, body text, timestamps all theme-aware via opacity layering
- **`js/services/email-system.js`** — `processQueuedExternalEmails()` now processes BOTH `elxacorp-queued-emails` and `finance-queued-emails` queues. Finance emails that were queued during monthly cycle (because ElxaMail wasn't open) are now delivered on ElxaMail login/session restore.

---

## Finance Service — Phase 2: Credit Card System

### Changes
- **`js/services/finance-service.js`** — Added full credit card system:
  - `createCreditCard(options)` — create cards with name, limit, APR, minimum payment, due day
  - `getCreditCards()` / `getCreditCardsSync()` — list all cards
  - `getCreditCard(cardId)` — get single card by ID
  - `chargeCredit()` / `chargeCreditSync()` — charge purchases, checks credit limit
  - `payCredit(cardId, amount, fromAccount)` — pay down card balance from bank account
  - `getCreditSummarySync()` — quick overview for UIs
  - Data auto-initializes `creditCards: []` on existing finance data (backward compatible)
  - Financial summary (`getFinancialSummary()`) now includes credit card info
  - Debug tools: `debug.addCreditCard(name, limit)`, `debug.listCards()`
  - Events: `finance.creditCardCreated`, `finance.creditCharged`, `finance.creditLimitExceeded`, `finance.creditPayment`

- **`js/services/payment-system.js`** — Payment dialog now shows THREE payment methods:
  1. Bank Account (Debit) — if logged into bank, shows balance (existing behavior)
  2. My Credit Card — dropdown of real cards from finance service, charges on purchase
  3. Enter Card Info — type any random numbers, always works (the fun/immersion option for kids)
  - `setupFormValidation()` updated: bank + creditcard both hide manual card form; only "Enter Card Info" shows it
  - `processPayment()` handles `creditcard` method via `financeService.chargeCreditSync()`
  - Success receipt shows credit card name + last 4 digits
  - CSS added for `.elxa-payment-cc-picker` and `.elxa-payment-cc-select`

### Registry Key Addition
```
finance: {
  ...existing...,
  creditCards: [
    { id, name, number, last4, creditLimit, balance, apr, minimumPayment, dueDay, opened, status }
  ]
}
```

---

## Finance Service — Phase 1 (finance-service.js)

### New Files
- `js/services/finance-service.js` — FinanceService class, central money management for all of ElxaOS

### What It Does
- **Account Management**: checking, savings, trust accounts with balances, account numbers, and open dates
- **Payment API**: `processPayment(amount, options)` — single entry point for all purchases across ElxaOS
- **Core Operations**: `deposit()`, `withdraw()`, `transfer()` — all async, all validated, all event-emitting
- **Transaction Ledger**: full history stored in registry (up to 200 transactions, increased from old 50 cap)
- **Bank Data Migration**: auto-migrates from old `localStorage` bank-system format to registry on first load
- **Sync Bridge Methods**: `processPaymentSync()`, `checkFundsSync()`, `getAccountBalancesSync()` for backward compat with bank-system.js
- **LLM Context API**: `getFinancialSummary()` returns plain-English financial status for messenger/email
- **Debug Tools**: `debug.dump()`, `debug.setBalance()`, `debug.resetFinance()`, `debug.addMoney()`

### Storage
- All data under `finance` key in registry user state (per-user, IndexedDB)
- Structure: `{ accounts: {...}, transactions: [...], lastProcessedDate, migrated }`
- Writes through to registry which debounces at 300ms

### Events Emitted
- `finance.transactionCompleted` — any payment, deposit, withdrawal, or transfer
- `finance.accountUpdated` — balance changed on any account
- `finance.insufficientFunds` — payment/withdrawal attempted without enough money

### Integration
- `index.html` — added `<script>` tag for finance-service.js (after elxa-registry.js)
- `js/elxaos.js` — `financeService` created in constructor, `init()` called in asyncInit step 2.6
- `js/services/bank-system.js` — `processPayment()`, `checkFunds()`, `getAccountBalances()` now delegate to financeService when available, with legacy fallback
- Added `_syncFromFinanceService()` to bank-system.js to keep bank dashboard in sync after payments

### Migration Strategy
- On first load for a user, checks `localStorage['elxaOS-bank-user-{username}']`
- If found: reads accounts + transactions, writes to registry, sets `migrated: true`
- Bank website UI unchanged — still manages its own login/session, but balance operations go through financeService
- Old localStorage data is NOT deleted (safe rollback)

## Central Data Registry (elxa-registry.js)

### New Files
- `js/services/elxa-registry.js` — ElxaRegistry class (~350 lines), central data hub for all of ElxaOS

### What It Does
- **User Profile** (per-user, IndexedDB): displayName, avatar, about, preferences. Single source of truth — replaces the split between login-service users and messenger settings.
- **World Context** (shared, loaded from world-context.json): Snakesia world info, character bios, technology info, prompt guidelines. Cached in memory, synchronous getters after init.
- **User State** (per-user, IndexedDB): general-purpose key-value store for inventory, owned properties, bank summary, installed games, card collection, achievements, etc.

### Storage Strategy
- Per-user data keyed by username in IndexedDB (e.g. `user:kitkat:profile`, `user:kitkat:state`)
- World/character data loaded once from `data/world-context.json` (moved from assets/interwebs/exmail/)
- Write batching with 300ms debounce to avoid spamming IndexedDB
- Auto-flush on shutdown

### Integration
- `index.html` — added `<script>` tag for elxa-registry.js (after elxa-core.js)
- `js/elxaos.js` — registry created in constructor, `init()` called in asyncInit after DB open, `forceSave()` called on shutdown
- Hooks into EventBus: listens for `login.success`, `login.guest`, `login.logout`, `login.settingsChanged`
- Emits: `registry.userLoaded`, `registry.profileUpdated`, `registry.stateUpdated`

### API Surface
```
// User Profile
await elxaOS.registry.getUserProfile()
await elxaOS.registry.getUserField('about')
await elxaOS.registry.updateUserProfile({ about: 'snake lover' })

// World Context (sync after init)
elxaOS.registry.getWorld()
elxaOS.registry.getCharacter('remi')
elxaOS.registry.getCharacters()
elxaOS.registry.getTechnology()
elxaOS.registry.getPromptGuidelines()

// User State
await elxaOS.registry.getState('ownedProperties')
await elxaOS.registry.setState('inventory', [...])
await elxaOS.registry.mergeState({ bankSummary: {...} })
await elxaOS.registry.getAllState()

// Helpers
elxaOS.registry.getCurrentUsername()
elxaOS.registry.isLoggedIn()
elxaOS.registry.debug()
```

### Seeds from Existing Data
- On first login for a user, profile is seeded from login service (displayName, avatar) and messenger settings (about/username) — one-time migration bridge

### Conversation History Manager Refactored
- **Storage**: Moved from shared localStorage blob to per-user IndexedDB via registry state (`conversationHistory` key)
- **World context**: No longer fetches `world-context.json` independently — reads from registry
- **User name**: Uses registry profile when available, falls back to messenger settings
- **Character info**: Uses `registry.getCharacter()` when available
- **Removed**: Dual-write to virtual filesystem (was saving to System/ConversationHistory/conversations.json)
- **Added**: Save debouncing (500ms), login/logout hooks to swap per-user data
- **One-time migration**: Pulls existing localStorage conversation data into registry on first login
- **Backward compatible**: Same public API — messenger and email don't need changes
- `elxaos.js` updated: calls `conversationHistoryManager.init()` in asyncInit, flushes on shutdown

### Login Service Migrated to IndexedDB
- **Users** stored at `system:users` in IndexedDB (was `elxaOS-users` in localStorage)
- **Version info** stored at `system:version` (was `elxaOS-version`)
- **Primary user** stored at `system:primaryUser` (was `elxaOS-primary-user`)
- Constructor no longer calls sync load methods — async `init()` called from ElxaOS.asyncInit
- `saveUsers()` is fire-and-forget (async write, callers don't await) — in-memory state is always current
- One-time migration from localStorage for all three keys
- Setup wizard compatibility: `loadSavedUsers()` public wrapper preserved, setup still writes to localStorage and migration picks it up
- Added `setPrimaryUser(username)` method for future setup wizard migration
- `clearUserData()` and `clearVersionData()` now async, clear from IndexedDB

### NOT YET DONE (future sessions)
- Migrate messenger to read user profile from registry instead of its own settings
- Migrate messenger's stale fallback path (still references old world-context.json location)
- Migrate email LLM service to use registry for world context instead of going through conversation manager
- Migrate bank system to sync balance summary to registry state
- Migrate card collection to registry state
- Build Mallard Realty using registry for property ownership

---

## New Game: Chess for Learners ($25.99 on Sssteam)

### New Files
- `js/libs/chess.min.js` — chess.js v0.10.3 rules engine (~15KB, vanilla script tag, no ESM)
- `js/games/chess-game.js` — ChessGame class (~35KB) with full game logic, AI, and UI
- `css/games/chess-game.css` — All chess styles, 6 board themes, splash screen, game over overlay
- `assets/games/chess/main.png` — 500x400 title art ("Chess for Learners" splash)
- `assets/interwebs/sssteam/images/chess/` — Store page assets: cover image + 3 screenshots

### Features
- **Splash screen** — full-window title art, click to continue to options
- **Options screen** — difficulty (Easy/Medium/Hard), play as White or Black, board theme picker
- **Full chess rules** via chess.js — legal moves, castling, en passant, pawn promotion, check/checkmate/stalemate/draw detection
- **AI engine** — hand-rolled minimax with alpha-beta pruning + piece-square tables. Easy (depth 1, 30% random), Medium (depth 2), Hard (depth 3)
- **Beginner features** — legal move highlighting (dots for moves, rings for captures), piece info tooltips on hover (name, value, movement description), undo (undoes both player + AI move), captured pieces display with point differential
- **6 board themes** — Wood (brown/tan), Classic, Mist, Steel, Midnight, Amber (colors sampled from existing board PNGs). Cycle with settings button in-game
- **Visual feedback** — last-move highlighting (per-theme yellow tint), check glow on king, AI thinking indicator with animated dots
- **Pawn promotion** — popup picker with piece images (Queen, Rook, Bishop, Knight)
- **Pixel art pieces** — uses individual 16x32 PNGs scaled with `image-rendering: pixelated`
- **Game over overlay** — result message, Play Again / Title Screen buttons

### Integration
- `index.html` — added `<script>` tags for chess.min.js and chess-game.js
- `css/desktop.css` — added `@import` for chess-game.css
- `js/services/installer-service.js` — added `case 'chess'` to SimpleGame router
- `assets/interwebs/sssteam/index.html` — full Sssteam catalog entry ($25.99, screenshots, hero image, reviews, features, install flow)

### User-Facing Highlights (for updates.txt later)
- New game on Sssteam: Chess for Learners! Learn chess with move hints, piece info, and undo
- Three difficulty levels — Easy for beginners, Hard for a real challenge
- Beautiful pixel art pieces with 6 board color themes

---

## Sussy Cat Adventure — Complete UI Overhaul + Icon Migration

### `css/games/sussy-cat.css` — Full CSS Rewrite
- Swapped font from Courier Prime (monospace) to Nunito (rounded, friendly)
- Added CSS custom properties system (`--sussy-purple`, `--sussy-gold`, `--sussy-mint`, etc.) from splash art palette
- Replaced all Win95 beveled borders with soft rounded corners, pill shapes, gentle shadows
- Removed CRT scanline overlay
- Header: rounded bottom, frosted pill stat badges, hidden redundant title label
- Level select: purple gradient zone with frosted glass level cards + gold accent strip
- Story/how-to-play: two-column flex layout (blurb left, controls right with tinted bg)
- Buttons: pill-shaped with hover lift
- Timeout screen: pink gradient, responsive cat image (`width: 45%; max-width: 280px; aspect-ratio: 1`)
- End screen: green gradient, frosted card
- Tutorial/message bar: frosted glass with backdrop blur
- Game-scoped MDI icon styling (`.sc-i`, `.sc-i-badge`, color modifiers `--purple/gold/mint/pink`)
- Responsive breakpoints updated throughout

### `js/games/sussy-cat.js` — Emoji → MDI Icon Migration + Fixes
- Replaced ALL user-visible emojis with MDI icons using game-scoped `sc-i` class system
- Room bg fallbacks, cat/timeout fallbacks, story instructions, level labels, gameplay messages, timeout stories, end screen, level progress stars — all converted
- Fixed 5x `textContent` → `innerHTML` for MDI icon rendering
- Fixed quote conflict in timeout messages (double-quoted strings → backtick template literals)
- Story section restructured into two-column HTML layout

---

## Snakesia.gov — CSS Fix + CSS Polish + Icon Migration

### `assets/interwebs/snakesia-gov/index.html`

**CSS `<link>` fix:**
- Removed redundant `<link rel="stylesheet" href="styles.css">` — 404'd because `innerHTML` resolves relative paths against the server root. Browser loads CSS via the registry's `css` field anyway.

**Icon Migration (Phase 5 interwebs):**
- Alert banner `🚨` → `mdi-alert`
- Business notice `🚨` → `mdi-alert`
- Embassy marquee `🚨` → `mdi-alert`
- Info panel close `×` → `mdi-close` (button with flexbox centering)
- Map Zoom In `(+)` → `mdi-magnify-plus-outline`
- Map Zoom Out `(-)` → `mdi-magnify-minus-outline`
- Map Print → `mdi-printer`
- Map Download → `mdi-download`
- Kept as content: all page emojis (news items, attractions, visa types, sidebar data, map POIs, character spotlights) — these describe subject matter, not UI chrome.

**HTML fix:**
- Embassy fee note `<p class="snakesia-notice">` → `<p class="snakesia-fee-note">` — resolved CSS conflict where two `.snakesia-notice` definitions with different purposes overwrote each other.

### `assets/interwebs/snakesia-gov/styles.css`

**CSS Polish / Cleanup:**
- Removed 2 duplicate `.snakesia-footer` blocks (3 identical copies → 1)
- Removed duplicate `@keyframes blink` definition
- Removed dead `.snakesia-nav a` rules (nav uses `<button>` elements, not `<a>`)
- Removed dead `.snakesia-quicklinks a` rules (uses `<button>` elements)
- Split conflicting `.snakesia-notice` into `.snakesia-notice` (bold alert box) and `.snakesia-fee-note` (small italic note)
- ~40 lines of dead/duplicate CSS removed

**MDI icon CSS:**
- `pointer-events: none` on `.snakesia-gov .mdi`
- Vertical alignment for icons in alerts, notices, marquee, map buttons
- Info panel close button: flexbox centering, removed hardcoded `font-size`/`font-weight`
- Map buttons: `inline-flex` with `gap` for icon+text alignment

### `assets/interwebs/snakesia-gov/index.html` — Layout Fix
- Bottom population counters: `<div class="snakesia-stats">` → `<div class="snakesia-bottom-stats">` — was sharing the Business page's 4-column grid class, now has its own centered flex row.

### `assets/interwebs/snakesia-gov/styles.css` — Visual Design Polish
Comprehensive visual overhaul of the entire site. Retro early-2000s .gov aesthetic preserved but everything looks substantially more polished:

- **Base**: Switched font from Arial to Trebuchet MS, better line-height (1.5), slightly cooler bg color
- **Header**: Deeper gradient, gold divider line via `::after`, letter-spacing on title, uppercase subtitle
- **Nav**: Seamless tab-style buttons (no borders/gaps), underline accent on active tab, subtle hover
- **Alert banner**: Full-width dark maroon gradient bar with white text (was pale pink box)
- **Content sections**: Added left-border accents (4px colored bar) to news, calculator, tips, hours, notices, requirements, parking, schedule, rules, job listings. Consistent visual language.
- **News items**: Individual dotted separators between items
- **Sidebar**: Distinct background (`#f4f4fa`), top-border accents on quicklinks/spotlight sections
- **Digital clock**: Larger, inset border, green glow effect (`text-shadow`)
- **Stats cards**: Top-border accent, larger numbers, uppercase labels
- **Tables**: Gradient header, hover highlight on rows, uppercase headers
- **Attraction cards**: Maroon gradient header bar (was plain text), hover shadow
- **Ticket cards**: Different header colors per tier (navy/dark blue/maroon/green)
- **Stock ticker**: Green-on-navy monospace styling (was white-on-blue)
- **VIP notice**: Gold text on dark maroon gradient
- **Footer**: Dark navy gradient background (was plain text)
- **Bottom stats bar**: Centered flex row with gray background
- **Info panel**: Top-border accent, drop shadow
- **Pushing Cat warning**: Left-border accent instead of full red border
- **Buttons (calculator, map)**: Subtle gradients
- **Responsive**: Added margin normalization for inner sections on mobile

### `assets/interwebs/snakesia-gov/index.html` — Map Overhaul
Complete redesign of the SVG map from two flat rectangles to an illustrated cartographic-style map:
- **Snakesia**: organic country shape with terrain features (Serpent Woods forest, Snake-e Hills, Lake Denali, Snake River)
- **Tennessee**: organic blob shape with Nashville/Memphis markers
- **Distant landmasses**: faded Kentucky and Alabama/Georgia outlines for geographic context
- **Road system**: Denali Highway (thick red with yellow center-line dashes), 3 secondary roads (tan dashed), border crossing to Tennessee
- **POI markers**: star for capital (with glow filter), bullseye circles for landmarks, colored squares for institutions. Added Denali Museum and Downtown Arcade.
- **Pushing Cat's Lair**: semi-transparent with scattered `?` marks around it
- **Compass rose**: proper 8-point star design with Georgia serif labels and maroon north pointer
- **Scale bar**: alternating black/white with mile markings
- **Title cartouche**: "Republic of Snakesia — Official Government Survey Map" in bordered parchment box
- **Map frame**: double-line border in antique gold
- **SVG patterns**: rippling water, forest dots, hill curves
- **Legend**: updated to match all new marker types, uses inline SVGs for marker icons instead of plain color squares

### `js/icon-config.js`
- Added 2 new action icons: `printer`, `alert`

---

## First Snakesian Bank — Post-Review Fixes

**Bug 3 fix: Class re-declaration crash**
- Changed `class BankSystem {` → `var BankSystem = class BankSystem {` — `class` declarations can't be re-declared in the same scope, but `var` can. When the browser's `executePageScripts()` re-fetches the `<script src>` on repeat visits to FSB, the `var` form overwrites cleanly instead of crashing with `Identifier already declared`.
- Corrected prior diagnosis: `bank-system.js` is NOT loaded by main `index.html`. The crash happens on repeat visits within the same browser session.

**Bug 4 fix: Login→Dashboard nav swap**
- Added `_updateNav()` method — when logged in, swaps "Login" link text to "Dashboard" (with `data-action="nav-dashboard"`), hides "Open Account" link, shows Logout. Reverses on logout.
- Added `id="navLoginLink"` and `id="navRegisterLink"` to `fsb/index.html` nav links.
- Added `nav-dashboard` case to delegation switch.
- Refactored `showLogin()`, `showRegister()`, `showDashboard()` to call `_updateNav()` instead of manually toggling `loggedInNav`.

---

## First Snakesian Bank (fsb.ex) — Icon Migration + Full Review

### Rewrite (`bank-system.js`, `fsb/index.html`, `icon-config.js`)

**Bugs Fixed:**
1. **`init()` never ran** — inline script wrapped init in `DOMContentLoaded` listener, but that event already fired (main page loaded long ago). Session restore, currency converter, and Enter-key login never worked. Fixed by calling `bankSystem.init()` directly.
2. **`<script src>` re-created BankSystem** — `fsb/index.html` had a `<script src>` tag for `bank-system.js` which the browser's `executePageScripts()` re-executed, creating a new `BankSystem()` that overwrote the global instance. Removed — script is already loaded by main `index.html`.
3. **Global `keypress` listener leak** — constructor added `document.addEventListener('keypress')` that was never removed, firing globally even when not on the bank page. Moved to `init()` with stored ref, removed in `destroy()`.
4. **No `destroy()` / cleanup** — no `window.browserPageCleanup` registration. Timeouts from `showError`/`showSuccess` became orphaned. Added `destroy()` method with cleanup registration.
5. **`updateTrustFormFields()` inline style** — used `style.display = 'none'/'block'` instead of `.hidden` class toggle. Fixed.

**Pattern Fixes:**
6. **~20 inline `onclick`/`onchange` handlers → event delegation** — single click handler on `.bank-website-root` routes all actions via `data-action` attributes.
7. **~15 inline styles → CSS classes** — form actions, form links, form subtitles, headings, branch cards, FAQ items, contact info, converter inputs, trust notes, no-transactions placeholder.
8. **Redundant constructor guard removed** — `if (typeof window.bankSystem === 'undefined')` was pointless since bottom of file always assigned.
9. **~30 debug `console.log` calls removed** — kept only `console.error` for actual failures.

**Icon Migration (~15 emojis → ElxaIcons):**
- Header logo (🏛️→bank), login title (🔐→lock), register title (🆕→account-plus), checking (💳→credit-card), savings (🏦→bank), trust (👑→crown), actions header (💰→cash-multiple), deposit (💵→cash-plus), withdraw (💸→cash-minus), transfer (↔️→bank-transfer), currency converter (🔄→currency-usd), transactions (📊→receipt), trust password (🔒→lock), contact phone (📞→phone), contact email (📧→email), contact chat (💬→send).
- Trust transaction history items: 👑→ElxaIcons crown.
- 10 new action icons: `bank`, `credit-card`, `crown`, `cash-multiple`, `cash-plus`, `cash-minus`, `bank-transfer`, `currency-usd`, `receipt`, `phone`.

**Architecture:**
- `_injectIcons()` batch-processes `data-icon` attributes on page load.
- `_setupDelegation()` wires single click handler + trust action change handler.
- `_setupCurrencyConverter()` and `_setupKeyHandler()` set up scoped listeners.
- `_registerCleanup()` hooks into `window.browserPageCleanup`.
- `pointer-events: none` on `.mdi` spans inside buttons and links.
- Icon colors overridden per-context: white in header, navy in general, inherit in form headers/account types.

**Files changed:** `icon-config.js`, `bank-system.js`, `fsb/index.html`, `CHANGELOG.md`, `TODO.md`.

---

## ElxaMail — Icon Migration + Full Review

### Complete Rewrite (`email-system.js`, `exmail/index.html`, `icon-config.js`)

**Bugs Fixed:**
1. **`showHelp()` used `alert()`** — popped up real browser dialog. Replaced with `ElxaUI.createDialog()` that renders inside ElxaOS.
2. **Double init** — both `<script>` in index.html AND bottom of email-system.js called `init()`. Fixed with `_initialized` guard and single init point.
3. **`confirm()` calls** — `bulkDeletePermanently()`, `deleteSelected()`, and context menu permanent delete all used raw `confirm()`. Replaced with `ElxaUI.showConfirmDialog()` (async).
4. **`JSON.stringify(email)` in inline onclick** — Reply/Forward/Delete buttons in email viewer embedded entire email object serialized into onclick attributes. Replaced with `currentViewedEmail` reference + `data-viewer-action` delegation.
5. **Toasts appended to `document.body`** — custom toast system escaped the browser window. Replaced entire custom toast system with `ElxaUI.showMessage()` (3 methods replace ~60 lines).
6. **No cleanup/destroy** — spam timers and corporate message timers kept running after navigating away. Added `destroy()` method, timer tracking via `_timerIds` array, and `registerBrowserCleanup()` integration.
7. **Inline `onclick` everywhere** — nav links, folders, toolbar, compose buttons, contacts, bulk actions, form buttons. Replaced ALL with event delegation using `data-action`, `data-nav`, `data-folder`, `data-context`, `data-viewer-action` attributes.
8. **Inline styles everywhere** — contacts list, user info, email viewer content, welcome screen, form actions. Moved to CSS classes.

**Icon Migration (~50 emojis → ElxaIcons):**
- Header logo, nav links, form titles, sidebar folders, toolbar buttons, bulk action buttons, compose buttons, email viewer buttons, context menu items, email list prefixes (spam/corporate), welcome screen icon.
- 9 new action icons: `email`, `email-open`, `reply`, `forward-email`, `inbox`, `email-send`, `drafts`, `select-all`, `skull-crossbones`.

**Architecture Improvements:**
- Dynamic UI building: `buildSidebar()`, `buildToolbar()`, `buildBulkActions()`, `buildComposeWindow()`, `buildContextMenu()` — all use `ElxaIcons.renderAction()` for consistent icon rendering.
- Centralized event delegation: single click handler on `.elxamail-website-root` routes all actions.
- `pointer-events: none` on `.mdi` spans inside buttons/folders/context items.

**What was removed:**
- Custom toast system (`createToastMessage`, `removeToastMessage`, `clearMessages`) — ~60 lines → 3 `ElxaUI.showMessage()` wrappers.
- All inline `onclick` attributes from HTML.
- Double-init `DOMContentLoaded` listener from HTML `<script>` tag.
- ~30 debug `console.log` calls.

### Files Changed
- `js/icon-config.js` — 9 new action icons (ElxaMail section)
- `assets/interwebs/exmail/index.html` — full rewrite (static HTML + CSS, no inline handlers)
- `js/services/email-system.js` — full rewrite (event delegation, ElxaUI integration, cleanup)

---

## ElxaBooks Pro — Full Rebuild

### Complete Rewrite (`elxabooks.js`, `elxabooks.css`, `icon-config.js`)
- **Full QuickBooks-inspired rebuild** — replaced placeholder money tracker with a proper 4-view accounting app for ElxaCorp.
- **Dashboard** — balance card (in snakes 🐍), monthly income/expense summary cards, pending invoices count, recent transactions list, quick action buttons.
- **Transactions** — full ledger table with date/description/category/amount columns. Add income/expense forms with category dropdowns (Allowance, Chores, Business Sales, etc.). Delete with `ElxaUI.showConfirmDialog()`.
- **Invoices** — create invoices from ElxaCorp to family members (Mom, Dad, Uncle Randy, Aunt Angel, Granddaddy, Teacher, Friend, or custom). Multi-line-item support. Draft → Sent → Paid workflow. Marking paid auto-creates income transaction under "Business Sales".
- **Reports** — Profit & Loss summary (total income, expenses, net profit). Income and expense breakdown by category with horizontal bar chart visualization.
- Dark sidebar nav with ElxaCorp branding and gold "PRO" badge. Status badges on invoices (Draft/Sent/Paid).
- All amounts in snakes (🐍) — Snakesia's currency.
- Proper ElxaOS patterns: constructor/launch/destroy, window.closed listener, ElxaIcons throughout, ElxaUI dialogs (no raw alert/confirm), single delegated click handler.
- Saves to `ElxaBooksPro.json` in Documents (new filename — old `MyMoneyTracker.json` data is not migrated).
- 3 new action icons: `list`, `file-document`, `minus`.

### What was removed
- `globalThis.elxaBooks` instance hack
- `pointer-events: none` on root container + `pointer-events: auto` on every child (workaround for window manager conflicts)
- `attemptSetup` retry loop (replaced with standard `setTimeout`)
- `setupDeleteButtonHandlers` re-registering delegation on every render
- All raw `confirm()` and `alert()` calls
- ~40 debug `console.log` calls
- All `elxa-books-` prefixed CSS classes (replaced with `eb-` prefix)

### Files Changed
- `js/programs/elxabooks.js` — complete rewrite (580+ lines)
- `css/programs/elxabooks.css` — complete rewrite (730+ lines)
- `js/icon-config.js` — added list, file-document, minus action icons

---

## Duck Console — Icon Migration + Review

### Icon Migration (`duck-console.js`, `duck-console.css`)
- Window title `🦆` emoji → `ElxaIcons.render('duck-console', 'ui')`.
- Network status header `🌐 ONLINE` / `🚫 OFFLINE` → `ElxaIcons.renderAction('wifi')` / `ElxaIcons.renderAction('wifi-off')`.
- `updateNetworkStatusDisplay()` switched from `textContent` to `innerHTML` for icon rendering.
- Network status `.elxa-icon-ui` color overridden to `inherit` from parent (green/red), not theme color.
- `pointer-events: none` on `.mdi` spans in duck-console.css.
- Console output emojis (help text, Abby quotes, hacker messages) kept — these are terminal content/flavor, same reasoning as Virus Lab hacker theme.

### Bug Fixes
- **`window` variable shadowing** — `const window = this.windowManager.createWindow(...)` in `launch()` shadowed the global `window`. Removed assignment.
- **No cleanup on window close** — No `window.closed` listener existed. EventBus handlers for `wifi.connected` and `wifi.disconnected` (registered in constructor) were never removed. Added per-window close listener that removes window from `activeWindows` set. Added `destroy()` method.
- **Duplicate `cat` case** — `case 'cat':` appeared twice in the command switch. First one handled file display (`displayFile`), second one (🐱 emoji response) was dead code. Renamed the System 0 cat command to `meow`.
- **`outputToActiveConsole` unscoped** — Queried all `.console-output` elements on the page, not just duck-console windows. Now uses `activeWindows` set to target only duck-console output areas.
- **Broken escape sequences in Abby memory** — `there\s` and `Don\t` were invalid escapes (backslash-s, backslash-t). Fixed to proper `\'s` and `\'t`.
- **`break;` indentation** — Misindented break after Abby memory case.
- **Stale dev comment** — Removed `// ADD THIS LINE FOR SYSTEM 0 DETECTION` and debug `console.log`.

### Files Changed
- `js/programs/duck-console.js` — icon migration, destroy(), activeWindows tracking, bug fixes
- `css/programs/duck-console.css` — pointer-events, network status icon color override

---

## Antivirus Upgrade: Virus Selection Setting + Custom Virus Integration

### Virus Selection Setting (`virus-system.js`, `antivirus-program.js`, `antivirus.css`)
- **New "Virus Vulnerability" settings panel** — Checkboxes in Settings tab for each virus definition. Users pick which viruses they're vulnerable to when protection is off.
- `VirusSystem.enabledViruses` (Set) tracks which viruses are eligible for random infection.
- `startRandomInfections()` now only picks from enabled viruses (filtered by not-already-active, not-quarantined).
- Selection persisted to `localStorage` under `elxaOS-virus-selection`.
- Default: all 4 built-in viruses enabled.
- New methods: `setVirusEnabled()`, `isVirusEnabled()`, `loadVirusSelection()`, `saveVirusSelection()`.

### Custom Virus Integration — Virus Lab → Antivirus bridge (`virus-system.js`, `virus-lab.js`, `antivirus-program.js`, `antivirus.css`)
- **`loadCustomViruses()`** reads `viruslab-saved-viruses` from localStorage and registers them as virus definitions with `custom: true` flag and `labData` payload.
- Custom virus IDs prefixed with `custom-` to avoid collisions with built-in IDs.
- Custom viruses appear in the Virus Vulnerability checkboxes (with purple "CUSTOM" badge) and in scan results.
- Custom viruses can actually infect and show their effects:
  - `image` type → popup with random image from Virus Lab selection
  - `popup` type → popup with skull icon and random custom message
  - `message` type → colored banner with message text
  - `screen` type → fullscreen takeover with animated text
- All custom effects use the virus's chosen color from Virus Lab.
- Dismiss + reinfection cycle (30s) mirrors built-in virus behavior.
- Quarantining cleans up custom effects via `data-virus-id` attribute selector.
- **Virus Lab now emits events** — `viruslab.virus.saved` and `viruslab.virus.deleted` so VirusSystem auto-refreshes definitions.
- Antivirus listens for `virus.definitions.changed` and re-renders the checkbox list live.
- Stale custom definitions (deleted from Virus Lab) are automatically cleaned up from the definitions map.

### UI/CSS additions
- `.av-virus-checkbox` — card-style checkbox labels with severity dot, name, description, author.
- `.av-custom-badge` — purple badge for custom virus entries.
- `.av-vuln-divider` — separator between built-in and custom virus sections.
- `.custom-virus-effect` — positioned container for custom virus popups.
- `.custom-virus-popup`, `.custom-virus-message`, `.custom-virus-screen` — styling for image/popup/message/screen effect types.
- `.custom-virus-fullscreen` — screen takeover overlay.
- All custom virus animations prefixed with `customVirus` to avoid conflicts.

### Files Changed
- `js/programs/virus-system.js` — enabledViruses, loadVirusSelection, saveVirusSelection, setVirusEnabled, isVirusEnabled, loadCustomViruses, activateCustomVirus, showCustomImageVirus, showCustomPopupVirus, showCustomMessageVirus, showCustomScreenVirus, positionAndAppendCustomVirus, scheduleCustomVirusReinfection, updated startRandomInfections, updated activateVirus, updated quarantineVirus, updated debugClearAll
- `js/programs/antivirus-program.js` — virus selection UI in settings tab, populateVirusSelection, renderVirusCheckbox, checkbox change handler, definitions-changed listener, cleanup in destroy
- `js/programs/virus-lab.js` — emit viruslab.virus.saved / viruslab.virus.deleted events
- `css/programs/antivirus.css` — virus selection checkbox styles, custom virus effect styles

---

## Roblox Horror Virus — Close Button Fix + Cleanup

### Bug Fixes
- **Notification close button broken** — Notification used class `.roblox-notif-close` but the JS handler only looked for `.roblox-close`. Notification × button did nothing. Fixed: handler now matches both selectors.
- **Close button × positioned inconsistently** — Several headers (`friend-request`, `game-invite`, `trade-request`, `image-popup`) had raw text between the icon and the × span, with no `flex: 1` element to push × right. Added `margin-left: auto` to both `.roblox-close` and `.roblox-notif-close` so the × always hugs the right edge.
- **Close button invisible on dark/colored headers** — Base color was `#666`/`#999`, hard to see on the dark chat header, blue notification, orange server header, etc. Added context-specific overrides: white on colored/dark headers, red hover on light backgrounds, white hover glow on dark backgrounds.

### CSS Improvements
- **Unified `.roblox-close` and `.roblox-notif-close`** — Merged into one rule block with consistent sizing (20×20px flex-centered), border-radius, and hover effect.
- **Close button hover** — Added subtle background highlight on hover (`rgba(255,68,68,0.15)` on light, `rgba(255,255,255,0.15)` on dark).

### Files Changed
- `css/programs/virus/roblox-jumpscare-virus.css` — close button fixes
- `js/programs/virus/roblox-jumpscare-virus.js` — close handler selector fix

---

## Virus System — Reinfection Bug Fix

### Bug Fix (`virus-system.js`)
- **Buggyworm and VeryFunGame only showed one popup** — Both `dismissBuggyworm()` and `dismissFakeInstaller()` gated their reinfection `setTimeout` on `!this.realTimeProtectionEnabled`. But real-time protection is `true` by default, so after dismissing the first popup the condition was always `false` and the reinfection timer never fired. The protection check was already handled in `infectSystem()` to block *new* infections — once a virus is already active, it should keep reappearing until quarantined. Removed the `!this.realTimeProtectionEnabled` guard from both dismiss methods.

### Files Changed
- `js/programs/virus-system.js` — dismissBuggyworm() + dismissFakeInstaller()

---

## LeBron James Virus — Popup Redesign

### CSS Overhaul (`lebron-james-virus.css`)
- **Layout:** Switched from vertical stack (icon → message → stats → buttons) to compact grid (icon left, message+stats right). Entire popup now fits ~200px tall — no more scrolling to reach buttons.
- **Stat badges:** Column list → horizontal badge row with gold values + tiny labels. "Invasions" count is random per popup.
- **Court floor effect:** Subtle vertical stripe overlay on the dialog background.
- **Title animation:** Lakers gold → shimmering gold flash.
- **Icon animation:** Replaced infinite spinning with a playful bounce/wobble.
- **Bounce-in animation:** More exaggerated spring with rotation.
- **Box shadow:** Added purple glow alongside the gold glow.
- **Buttons:** More compact, uppercase, basketball emoji on OK button, snappier hover/active states.
- **All animation keyframes prefixed** with `lebron-` to avoid conflicts with other virus CSS.

### JS Tweaks (`lebron-james-virus.js`)
- **Popup positioning:** Now accounts for popup height + taskbar, clamped so it never spawns with buttons below the viewport.
- **Stat badges:** "Career Points" → "38K+ Points", "Championships" → "4 Rings", "Times in computer" → random 1–999 "Invasions".
- **Button text:** "OK, LEBRON JAMES 🏀" and "NO MORE LEBRON PLS" (shorter, sillier).

### Files Changed
- `css/programs/virus/lebron-james-virus.css` — full rewrite
- `js/programs/virus/lebron-james-virus.js` — popup HTML + positioning

---

## Antivirus (ElxaGuard) — Icon Migration + Full Review

### Bug Fixes
- **`window` variable shadowing** — `const window = this.windowManager.createWindow(...)` in `launch()` shadowed the global `window` object. Removed the variable (return value wasn't used).
- **No `destroy()` method** — No cleanup on window close. Added `destroy()`: removes body-appended alert/restart popups, unsubscribes EventBus `window.closed` listener.
- **Custom `showSystemMessage()` toast** — Built its own toast with inline `style.cssText`, appended to `document.body`. Removed entirely; all calls replaced with `ElxaUI.showMessage()`.
- **3 inline `onclick` handlers** — `generateScanResultsHTML()` had inline `onclick` on "Quarantine All" and "Start New Scan" buttons. `updateQuarantineList()` had inline `onclick` on delete buttons. All replaced with proper container click delegation.
- **`safeUpdate` helper defined twice** — Identical function defined in both `updateRealTimeProtectionUI()` and `updateSystemStatus()`. Unused in the first. Consolidated to single definition in `updateSystemStatus()`.
- **Debug `console.log` left in** — `updateQuarantineList()` had `console.log('Updating quarantine list')`. Removed.
- **Body-appended popups orphaned** — `.virus-alert` and `.restart-recommendation` popups appended to `document.body` could persist after window close. Now cleaned up in `destroy()`.
- **`setTimeout 500ms`** — Reduced to 100ms (consistent with other programs).

### Icon Migration
- **`icon-config.js`** — Added 7 new action icons: `shield`, `shield-alert`, `check-circle`, `alert`, `bug`, `gamepad`, `broom`.
- **Window title** — `'🛡️ ElxaGuard'` → `ElxaIcons.render('antivirus', 'ui')`.
- **Header** — Shield emoji → `ElxaIcons.render('antivirus', 'ui')`.
- **Status indicator** — `🟢`/`🔴`/`🟡` emoji → CSS `.av-status-good`/`.av-status-danger`/`.av-status-warning` dots.
- **Nav tabs** — `🏠`/`🔍`/`🔒`/`⚙️` → `home`/`magnify`/`lock`/`settings`.
- **Dashboard cards** — `🛡️ Protection`/`⚠️ Threats`/`🔍 Last Scan` → ElxaIcons.
- **Protection status** — `✅`/`⚠️` → `check-circle`/`alert`.
- **Scan buttons** — `🚀`/`⚡`/`🔍`/`⚙️` → `rocket`/`flash`/`magnify`/`settings`.
- **Cancel scan** — Added `stop` icon.
- **Scan results** — `✅`/`⚠️` result icons → `check-circle`/`shield-alert`. Threat dots → CSS `.av-threat-dot`.
- **Quarantine** — `🔒` header, `🎉`/`✅` empty state, `🗑️` delete → ElxaIcons.
- **Debug buttons** — `🐛`/`🎮`/`🏀`/`👻`/`🧹` → `bug`/`gamepad`/`alert`/`skull`/`broom`.
- **Alert dialog** — `🛡️`/`⚠️`/`🔒`/`🔍` → ElxaIcons. `<div>×</div>` close → `<button>` with ElxaIcons.
- **Restart popup** — `🔄`/`🛡️` → `refresh`/`shield`. `<div>×</div>` close → `<button>` with ElxaIcons.
- **`getThreatIcon()`** — Removed (replaced inline with CSS `.av-threat-dot` spans).

### CSS Changes
- **`antivirus.css`** — Added `pointer-events: none` on `.mdi` spans.
- **`antivirus.css`** — Added `.av-status-good`/`.av-status-warning`/`.av-status-danger` CSS dot indicators with glow.
- **`antivirus.css`** — Added `.av-threat-dot` severity dots (`.av-sev-high`/`medium`/`low`).
- **`antivirus.css`** — Added `.dialog-close-btn` styles for virus-alert and restart popups.
- **`antivirus.css`** — Renamed generic `.delete-btn` → `.av-quarantine-delete-btn` (avoids conflicts).
- **`antivirus.css`** — Removed `.status-indicator { font-size: 16px }` (now uses dot sizing).

### Structural
- **Unified click delegation** — All button clicks (scan results quarantine, quarantine-all, new-scan, quarantine delete) now handled via container delegation. No inline `onclick` anywhere.
- **`destroy()` lifecycle** — Listens for `window.closed` EventBus event, cleans up body-appended popups.
- **EventBus handler refs** — All 4 constructor listeners stored as `this._on*` for potential cleanup.
- **`showSystemMessage()` removed** — Entire custom toast method deleted; all calls use `ElxaUI.showMessage()`.

### Files Changed
- `js/programs/antivirus-program.js` — full rewrite
- `css/programs/antivirus.css` — additions + renames
- `js/icon-config.js` — 7 new action icons

---

## Virus Lab — Icon Migration + Full Review

### Bug Fixes
- **Matrix interval leak** — `startMatrixEffect()` called `setInterval` every 150ms with no stored ref. Never cleared on window close. Now stored in `this._matrixInterval`, cleared in `destroy()`.
- **Preview message interval leak** — `showPreviewMessageEffect()` created an `setInterval` with no ref, leaked forever. Now stored in `this._previewMessageInterval`, cleared on tab switch and in `destroy()`.
- **Custom `showHackerMessage()` toast** — Built its own toast system with inline `style.cssText`, positioned fixed, appended to `document.body`. Replaced all calls with `ElxaUI.showMessage()`.
- **Gallery listener stacking** — `populateSavedViruses()` added a new `click` listener to the gallery div every time the gallery tab was visited. Moved card action handling (Test/Delete buttons) into the unified container click delegation in `setupWindowEventHandlers()`. Gallery now just renders HTML.
- **No `destroy()` method** — No cleanup on window close. Added `destroy()`: clears both intervals, removes body-appended test effects and attack sequences, unsubscribes EventBus `window.closed` listener.
- **EventBus handler leak** — Constructor `setupEventHandlers()` added a permanent `viruslab.create` listener with no stored ref. Now stored as `this._onVirusCreate` for potential cleanup.
- **Duplicate `.vlab-status-text` class** — Same class name used for header status text and terminal status text, causing style conflicts. Renamed terminal status to `.vlab-terminal-status`.
- **Body-appended elements orphaned** — Test effects (`.vlab-test-virus-effect`) and attack sequences (`.vlab-attack-sequence`) appended to `document.body` could persist after window close. Now cleaned up in `destroy()`.
- **Dead `setupEventHandlers()` constructor method** — Removed separate method; handler stored directly in constructor.

### Icon Migration
- **`icon-config.js`** — Added 12 new action icons: `flask`, `microscope`, `skull`, `target`, `biohazard`, `eye`, `fire`, `test-tube`, `image-multiple`, `message-flash`, `alert-decagram`, `television`.
- **Window title** — `'👨‍💻 Virus Lab'` → `ElxaIcons.render('viruslab', 'ui')`.
- **Header** — `💀` skull → `ElxaIcons.renderAction('skull')`. `🔥 READY TO HACK 🔥` → ElxaIcons fire.
- **Tab buttons** — `🧪`/`🔬`/`📡`/`💾` → `flask`/`microscope`/`broadcast`/`save`.
- **Form labels** — 10 emoji labels (💀/👤/📝/🎯/⚡/🎨/🌈/💬 etc.) → ElxaIcons.
- **Virus type cards** — `🖼️`/`💥`/`💬`/`📺` → `image-multiple`/`alert-decagram`/`message-flash`/`television`.
- **Action buttons** — `🧪 CREATE VIRUS`/`👁️ Preview`/`🚀 TEST`/`🛑 STOP`/`🚀 LAUNCH ATTACK!`/`➕ Add` → ElxaIcons.
- **Footer status** — `🔥`/`💀`/`🎯` → `fire`/`skull`/`target`.
- **Gallery** — Empty state, card buttons (`🧪 Test`/`🗑️ Delete`) → ElxaIcons.
- **Test/attack effects** — Popup headers, close buttons, test labels all → ElxaIcons.
- **`getVirusIcon()`** — Now returns `ElxaIcons.renderAction()` instead of emoji.
- **`getSeverityText()`** — `🟢`/`🟡`/`🔴` emoji dots → CSS `.vlab-severity-dot` spans with colored backgrounds.
- **Target avatars** — Kept as emojis (character content, not UI chrome).

### CSS Changes
- **`virus-lab.css`** — Added `pointer-events: none` on `.mdi` spans inside virus lab container.
- **`virus-lab.css`** — Added `.vlab-severity-dot` styles (`.vlab-sev-low`/`medium`/`high`/`unknown`).
- **`virus-lab.css`** — Added `.vlab-status-online` CSS dot (replacing `🟢 Online` emoji).
- **`virus-lab.css`** — Added `.vlab-success-rate` style.
- **`virus-lab.css`** — Renamed `.vlab-status-text` → `.vlab-terminal-status` (terminal section).
- **`virus-lab.css`** — Removed ~38 lines of `.vlab-hacker-message` CSS (now uses `ElxaUI.showMessage()`).

### Structural
- **Unified click delegation** — Consolidated 5 separate `container.addEventListener('click')` calls + gallery listener into a single delegated handler in `setupWindowEventHandlers()`.
- **`destroy()` lifecycle** — Listens for `window.closed` EventBus event, cleans up intervals, body elements, and EventBus subscriptions.

### Files Changed
- `js/programs/virus-lab.js` — full rewrite
- `css/programs/virus-lab.css` — additions + removals
- `js/icon-config.js` — 12 new action icons

---

## Theme Service — Personalize Dialog Overhaul

### Inline `onclick` Removal
- **`theme-service.js`** — `showThemeDialog()`: Removed inline `onclick` from close button (`×`), Apply, Reset, and Close buttons. All now handled via event delegation in `setupThemeDialogEvents()`.
- **`theme-service.js`** — `showContextMenu()`: Replaced inline `onclick` on "Personalize" and "Refresh Desktop" items with `data-action` attributes + `addEventListener` event delegation.

### Icon Migration
- **`icon-config.js`** — Added 2 new action icons: `image` (`mdi-image`), `folder-image` (`mdi-folder-image`).
- **`showThemeDialog()`** — Title: `🎨` → `ElxaIcons.renderAction('personalize')`. Close: `×` div → `<button>` with `ElxaIcons.renderAction('close')`. Tab labels: added icons. Apply/Reset buttons: added icons. Import/Paint buttons: `📁`/`🎨` → ElxaIcons.
- **`showImageImportDialog()`** — Title: `📁` → `ElxaIcons.renderAction('folder-image')`. Close: `×` div → `<button>` with ElxaIcons.
- **`showPaintFileBrowser()`** — Title: `🎨` → `ElxaIcons.renderAction('image')`. Close: `×` div → `<button>`. File icon: `🖼️` → `ElxaIcons.renderAction('image')`.
- **`showContextMenu()`** — `🎨 Personalize` → `ElxaIcons.renderAction('personalize')`. `🔄 Refresh Desktop` → `ElxaIcons.renderAction('refresh')`.

### Event Delegation Fixes
- **`setupThemeDialogEvents()`** — Switched from `e.target.classList.contains()` to `e.target.closest()` for all button/tab checks. This prevents click-through failures when clicking on `.mdi` icon spans inside buttons.

### CSS
- **`personalize.css`** — Added `pointer-events: none` on `.mdi` spans in all theme dialog elements (tabs, buttons, close, context menu, paint file icons). Added `.asset-badge` themed styling. Added `.wallpaper-stats` styling.

---

## Login Service — User Settings & Login Dialogs Overhaul

### Bug Fixes
- **`login-service.js`** — Fixed escape key listener stacking. `setupLoginEvents()` added a new `document.keydown` listener every time the login screen was shown, creating multiple listeners. Now stores the handler ref and removes it in `hideLoginScreen()`.
- **`login-service.js`** — Fixed `deleteUser()` using raw `confirm()`. Now uses `ElxaUI.showConfirmDialog()` (async).
- **`login-service.js`** — Fixed Version Edit dialog reset button using raw `confirm()`. Now uses `ElxaUI.showConfirmDialog()` (async).
- **`login-service.js`** — Removed dead methods `selectAvatar()` and `selectNewUserAvatar()` — avatar selection now handled by `addEventListener` inside each dialog.

### Dialog Rewrites
- **User Settings dialog** — Rewrote using `ElxaUI.createDialog()`. Removed all inline `onclick` handlers. Emoji title → `ElxaIcons.renderAction('account')`. Buttons use ElxaIcons (save, key). Avatar options use `data-emoji` + CSS `.selected` class instead of inline `onclick`.
- **Change Password dialog** — Rewrote using `ElxaUI.createDialog()`. Emoji title → `ElxaIcons.renderAction('key')`. Removed all inline `onclick` handlers. Added Enter key support on all password fields. Scoped element IDs (`cp` prefix).
- **Version Edit dialog** — Removed ~130 lines of inline `style.cssText`. All styling now via CSS classes (`login-dialog-overlay`, `login-dialog-box`, `login-form-group`, etc.). Emoji icons (⚙️💾🔄) → ElxaIcons (`settings`, `save`, `restore`). Scoped element IDs (`ve` prefix).
- **Create User dialog** — Removed ~100 lines of inline styles. JS hover-state management (mouseenter/mouseleave with `style.background` comparisons) → CSS `:hover`/`.selected` classes. Emoji `➕` → `ElxaIcons.renderAction('account-plus')`. Scoped element IDs (`cu` prefix).

### Icon Migration
- **`icon-config.js`** — Added 5 new action icons: `key`, `account-plus`, `lightbulb`, `login`, `content-save`.
- **Login screen buttons** — `💡 Password Hint` → `ElxaIcons.renderAction('lightbulb')`, `👤 Guest Login` → `login`, `➕ New User` → `account-plus`.

### CSS
- **`login.css`** — Added ~280 lines of new CSS for login dialog system, form elements, button variants, avatar picker, version preview, and pointer-events rules. Added missing `.new-user-button` styles (previously unstyled).
- **`login.css`** — Login dialog classes intentionally use hardcoded Win95 colors (not CSS variables) because they render on the login screen before any theme is loaded. User Settings and Change Password dialogs use the themed `ElxaUI.createDialog()` system.

---

## Battery Center (Battery Service) — Icon Migration + Full Review

### Bug Fixes
- **`battery-service.js`** — Fixed custom `showMessage()` with full inline `style.cssText` duplicating ElxaUI. Removed entirely; all calls now go to `ElxaUI.showMessage()`.
- **`battery-service.js`** — Fixed `forcedShutdown()` overlay built with massive inline CSS. Moved to `.bdialog-shutdown-overlay` CSS class.
- **`battery-service.js`** — Fixed `updateBatteryDisplays()` using extremely fragile selectors (`querySelector('[style*="color"]')`, `onclick.toString().includes()`). Replaced with simple dialog re-render on state change.
- **`battery-service.js`** — Fixed tray icon using `batteryIcon.textContent = '🔋'` which destroyed the MDI span. Now swaps MDI classes (`mdi-battery`, `mdi-battery-70`, `mdi-battery-50`, `mdi-battery-30`, `mdi-battery-10`, `mdi-battery-alert`).
- **`battery-service.js`** — Fixed `setupTabs()` using global `document.querySelectorAll('.bdialog-tab')`. Now scoped to the dialog element passed as parameter.
- **`battery-service.js`** — Fixed power mode buttons using inline `onclick`. Now wired via `addEventListener` with `data-mode` attributes.
- **`battery-service.js`** — Fixed no persistence. Power mode, battery health, and charge cycles now saved to localStorage under `elxaOS-battery`.
- **`battery-service.js`** — Added `destroy()` method for proper cleanup.
- **`battery-service.js`** — Removed `simulateFastDrain()` debug method (leaked interval, no cleanup).
- **`battery-service.js`** — Removed non-functional "Show charging animation" checkbox from settings.

### Icon Migration
- **`icon-config.js`** — Added 7 new action icons: `rocket`, `scale-balance`, `battery-charging`, `thermometer`, `heart-pulse`, `power-plug`, `lightning-bolt`.
- **`battery-service.js`** — Tray icon: 🔋/🪭 emoji → MDI battery level classes.
- **`battery-service.js`** — Dialog title/icon: emoji → `ElxaIcons.renderAction('battery-charging')`.
- **`battery-service.js`** — Stats labels: plain text → ElxaIcons (heart-pulse, lightning-bolt, thermometer).
- **`battery-service.js`** — Recharge/calibrate/close buttons: ⚡/🔧 → ElxaIcons (lightning-bolt, wrench, close).
- **`battery-service.js`** — Power mode icons: 🚀/⚖️/🛡️ → ElxaIcons (rocket, scale-balance, shield-lock).
- **`battery-service.js`** — Tab labels: plain text → ElxaIcons (information, settings, history).
- **`battery-service.js`** — Tips title, shutdown icon: emoji → ElxaIcons.

### Inline Styles → CSS Classes
- **`battery-service.js`** — Health color inline style → `.bdialog-health-good`/`ok`/`warn`/`bad`.
- **`battery-service.js`** — Power mode color inline style → `.bdialog-mode-color-performance`/`balanced`/`powersaver`.
- **`battery-service.js`** — Battery fill color inline style → `.bdialog-fill-good`/`warn`/`critical`.
- **`battery-service.js`** — Shutdown overlay: ~20 lines inline CSS → `.bdialog-shutdown-*` classes.
- **`battery.css`** — Added all new color/fill/shutdown classes. Added `pointer-events: none` on `.mdi` spans. Added `.mdi` font-size rules for icon, mode-icon, and shutdown-icon.

---

## Network Control Center (WiFi Service) — Icon Migration + Full Review

### Bug Fixes
- **`wifi-service.js`** — Fixed `saveWiFiData()` / `loadWiFiData()` being no-ops. `saveWiFiData()` created an object and discarded it. `loadWiFiData()` just logged a message. Now actually persists to localStorage under `elxaOS-wifi`. User networks, connection state, and history survive page reload.
- **`wifi-service.js`** — Fixed `resetAllNetworks()` using raw `confirm()`. Now uses `ElxaUI.showConfirmDialog()` (async).
- **`wifi-service.js`** — Fixed scan interval never stored. `setInterval()` in `startNetworkScan()` had no reference, so it could never be cleared. Now stored as `this.scanInterval` and cleaned up in `destroy()`.
- **`wifi-service.js`** — Fixed network passwords exposed in DOM. Network items stored the full network object (including passwords) as `data-network` JSON attribute. Now stores only `data-network-name` and looks up the network object from memory.
- **`wifi-service.js`** — Fixed IP/gateway regenerated on every dialog refresh. `generateFakeIP()` / `generateFakeGateway()` used `Math.random()`, so every render showed a different IP. Now generates stable values at connection time, stored as `connectionIP` / `connectionGateway`.
- **`wifi-service.js`** — Removed emoji prefixes from `simulateConnectionIssue()` messages.
- **`wifi-service.js`** — Added `destroy()` method for proper cleanup.

### Icon Migration
- **`icon-config.js`** — Added 13 new action icons: `link`, `lock`, `lock-open`, `shield-lock`, `information`, `speedometer`, `broadcast`, `chart-bar`, `wrench`, `download`, `upload`, `antenna`, `check`.
- **`wifi-service.js`** — Dialog title: 📡 → `ElxaIcons.renderAction('antenna')`.
- **`wifi-service.js`** — Connection status header: 🔗 → `ElxaIcons.renderAction('link')`.
- **`wifi-service.js`** — Tab labels: emoji → ElxaIcons (antenna, wrench, chart-bar).
- **`wifi-service.js`** — Security icons: 🌐/🔓/🔒/🛡️ → ElxaIcons (lock-open, lock, shield-lock).
- **`wifi-service.js`** — Network items: ✅/📶/👤/🔗 → ElxaIcons (check, wifi, account, link).
- **`wifi-service.js`** — Tool buttons: all 6 emoji tool icons → ElxaIcons (magnify, antenna, speedometer, globe, chart-bar, shield-lock).
- **`wifi-service.js`** — Advanced options: 📡/💾/🔄 → ElxaIcons (broadcast, save, refresh).
- **`wifi-service.js`** — Control panel: 🔄/❌ → ElxaIcons (refresh, close).
- **`wifi-service.js`** — Password dialog: 🔒/💡 → ElxaIcons (lock, information).
- **`wifi-service.js`** — Create dialog: 📡/⚙️ → ElxaIcons (broadcast, settings).
- **`wifi-service.js`** — Info dialog: 📊 → ElxaIcons (information).
- **`wifi-service.js`** — History entries: ✅/❌ → ElxaIcons (check, close).

### Inline Styles → CSS Classes
- **`wifi-service.js`** — Tools panel: removed ~20 inline `style="..."` attributes. New CSS classes: `.wifi-tools-panel`, `.wifi-panel-title`, `.wifi-advanced-options`, `.wifi-advanced-title`, `.wifi-advanced-buttons`.
- **`wifi-service.js`** — History panel: removed ~15 inline `style="..."` attributes. New CSS classes: `.wifi-history-panel`, `.wifi-history-list`, `.wifi-history-item`, `.wifi-history-name`, `.wifi-history-date`, `.wifi-history-success`, `.wifi-history-fail`, `.wifi-history-empty`, `.wifi-stats-section`, `.wifi-stats-grid`, `.wifi-stat-item`.
- **`wifi-service.js`** — Network items: frequency color via inline style → `.wifi-freq-5ghz` / `.wifi-freq-2ghz` CSS classes.

### CSS Cleanup
- **`wifi.css`** — Removed ~80 lines of dead/orphaned CSS: `.wifi-system-message` (unused, service uses ElxaUI), `.browser-toast` (orphaned), `.import-dialog` / `.paint-browser-dialog` (wrong file), WiFi connection state animations.
- **`wifi.css`** — Added `pointer-events: none` on `.mdi` spans in all WiFi dialogs.
- **`wifi.css`** — Added new classes for `.wifi-advanced-content` toggle, `.wifi-info-network-name`, `.wifi-info-close-section`, `.wifi-value-connected` / `.wifi-value-disconnected`, `.wifi-password-meta`.

### Other Cleanup
- **`wifi-service.js`** — All inline `onclick` attributes on dialog close/cancel buttons → `addEventListener` wiring.
- **`wifi-service.js`** — `exportSettings()` now redacts passwords from output.
- **`wifi-service.js`** — Removed `showMessage()` wrapper (was a thin delegation to `ElxaUI.showMessage()`; now calls `ElxaUI.showMessage()` directly).

---

## ElxaOS Time Center — Icon Migration + Full Review (Phase 3)

### Bug Fixes
- **`clock-system.js`** — Fixed EventBus `window.closed` listener stacking. A new listener was registered every `openClockWindow()` call, never removed. Moved to constructor (runs once). Same pattern fixed in Messenger/Browser.
- **`clock-system.js`** — Fixed stopwatch interval not cleaned on window close. `clockWindowInterval` was cleared but `stopwatchInterval` kept ticking invisibly, leaking CPU. Now cleared in the `window.closed` handler.
- **`clock-system.js`** — Fixed `worldClocks` array overwritten on every window open. `setupWorldClockEvents()` always reset to `[Local Time]`, nuking any saved world clocks loaded from localStorage. Now only sets defaults if no data was loaded.
- **`clock-system.js`** — Fixed alarm re-trigger bug. `checkAlarms()` checks `HH:MM` every second, so a matching alarm fired ~60 times per minute. Added `lastTriggered` minute-key guard to fire once per match.
- **`clock-system.js`** — Fixed event modal appended to `document.body` with `position: fixed`, drifting away from the draggable window. Now appended to the clock window element with `position: absolute`.
- **`clock-system.js`** — Fixed event modal using global `document.getElementById()` for form fields. Now uses `data-*` attributes and scoped `modal.querySelector()` queries via `this.currentEventModal` reference.
- **`clock-system.js`** — Removed custom `showNotification()` method (duplicated ElxaUI). Timer/alarm notifications now use `ElxaUI.showMessage()`.
- **`clock-system.css`** — Removed ~75 lines of dead `.clock-notification` / `@keyframes slideInRight` / `@keyframes pulseAlarm` CSS.

### Icon Migration
- **`icon-config.js`** — Added `clock` to programs registry (mdi-clock-outline, #42A5F5).
- **`icon-config.js`** — Added 12 new action icons: `clock`, `timer`, `alarm-icon`, `calendar`, `globe`, `bell`, `bell-off`, `chevron-left`, `chevron-right`, `flag`, `flash`, `plus`.
- **`clock-system.js`** — Window title: ⏰ emoji → `ElxaIcons.render('clock', 'ui')`.
- **`clock-system.js`** — All 5 tab labels: emoji → `ElxaIcons.renderAction()` (clock, timer, alarm-icon, calendar, globe).
- **`clock-system.js`** — Stopwatch button, start/stop/reset/lap buttons: emoji → ElxaIcons (timer, play, stop, refresh, flag).
- **`clock-system.js`** — Timer create/cancel buttons: emoji → ElxaIcons (play, close).
- **`clock-system.js`** — Alarm create button, toggle/delete buttons: emoji → ElxaIcons (alarm-icon, bell/bell-off, delete).
- **`clock-system.js`** — Calendar nav arrows: ◀▶ → ElxaIcons (chevron-left, chevron-right).
- **`clock-system.js`** — Event modal header, add/edit/delete buttons: emoji → ElxaIcons (calendar, plus, rename, delete, close).
- **`clock-system.js`** — World clock add/remove buttons: emoji → ElxaIcons (plus, close).
- **`clock-system.js`** — Running Timers header: ⚡ → `ElxaIcons.renderAction('flash')`.
- **`clock-system.css`** — Added `pointer-events: none` on `.clock-system .mdi` and `.event-control-btn .mdi`.

### alert() → ElxaUI
- **`clock-system.js`** — 3 raw `alert()` calls replaced with `ElxaUI.showMessage()` (timer validation, alarm validation, event title validation).

### Other Cleanup
- **`clock-system.js`** — Removed `speechSynthesis` fallback from `playSound()` (was reading "ALARM!" aloud as backup — not useful).
- **`clock-system.js`** — Stopwatch state (`stopwatchTime`, `lapTimes`) moved to constructor so it persists across window open/close within a session.
- **`clock-system.js`** — Removed hardcoded Mother's Day and Thanksgiving from special dates (they're variable-date holidays, were showing wrong dates).
- **`clock-system.js`** — `saveSettings()` now called when adding/removing world clocks.
- **`clock-system.js`** — Event modal buttons wired via `addEventListener` instead of inline `onclick` attributes.
- **`clock-system.css`** — Added `.event-modal-close-btn` styles, `.no-events` placeholder, `.event-indicator-overflow` class (was inline style).
- **`clock-system.js`** — `destroy()` now cleans up all intervals and the event modal.

---

## System Tray — Remove Background
- **`desktop.css`** — Removed `background: var(--systemTrayBg)` from `.system-tray`. The tray now inherits the taskbar background, which looks cleaner.

---

## Paint — Move Colors Into Toolbar
- **`paint.js`** — Moved primary/secondary color swatches and quick colors grid from separate `paint-color-palette-container` row into the toolbar. Removed "Colors:" and "Quick Colors:" labels. Saves one full row of vertical space for the canvas.
- **`paint.css`** — Removed `.paint-color-palette-container` and `.paint-color-section-wrapper` styles. Added `.paint-colors-section` for inline toolbar layout. Shrunk color swatches from 28px to 22px to fit toolbar height. Removed dead responsive rule for removed container.

---

## Snakesia Messenger — Icon Migration + Full Review (Phase 3)

### Bug Fixes
- **`messenger.js`** — Fixed `selectContact()` relying on implicit `window.event` global. The onclick handler `() => this.selectContact(contact.id)` passed no event, but the method did `event.target.closest(...)`. Fails silently in Firefox. Now passes `e.currentTarget` directly from the click handler.
- **`messenger.js`** — Fixed `switchTab()` same implicit `event` bug. Inline `onclick` now passes `this` (the button element) as a parameter.
- **`messenger.js`** — Fixed `const window = this.windowManager.createWindow(...)` shadowing global `window` in `launch()`. Renamed to `const win`.
- **`messenger.js`** — Fixed document-level click listener leak. `document.addEventListener('click', ...)` for closing context menu/emoji picker was added in `setupEventHandlers()` but never removed on window close. Now stored as `this.documentClickHandler` and cleaned up via `cleanupOnClose()`.
- **`messenger.js`** — Fixed EventBus listener stacking. `this.eventBus.on('window.closed', ...)` was inside `launch()`, so each open added a new listener. Moved to constructor (runs once).
- **`messenger.js`** — Fixed injected `<style id="messengerThemeStyle">` never removed from `<head>` on window close. Now cleaned up in `cleanupOnClose()`.
- **`messenger.css`** — **Removed nuclear `* { animation: none !important; transition: none !important; }` rule** that was killing ALL animations on the entire page (boot sequence, ElxaCode, typing indicator dots, everything). The typing indicator animation now works.

### Icon Migration
- **`icon-config.js`** — Added 3 new action icons: `settings` (mdi-cog), `send` (mdi-send), `emoticon` (mdi-emoticon-outline).
- **`messenger.js`** — Window title: 💬 emoji → `ElxaIcons.render('messenger', 'ui')`.
- **`messenger.js`** — Settings button: ⚙️ → `ElxaIcons.renderAction('settings')`.
- **`messenger.js`** — Send button: 📤 → `ElxaIcons.renderAction('send')`.
- **`messenger.js`** — User avatar: 👤 → `ElxaIcons.renderAction('account')`.
- **`messenger.js`** — Welcome icon: 🐍✨ → `ElxaIcons.render('messenger', 'desktop')`.
- **`messenger.js`** — Context menu: 🗑️ → `ElxaIcons.renderAction('delete')`, ❌ → `ElxaIcons.renderAction('close')`.
- **`messenger.js`** — Settings modal header, save/refresh buttons now use ElxaIcons.
- **`messenger.css`** — Added `pointer-events: none` on all `.mdi` spans inside messenger.

### alert() → ElxaUI
- **`messenger.js`** — Replaced `alert('Please enter a username!')` with `ElxaUI.showMessage()`.

### showSystemMessage() → ElxaUI.showMessage()
- **`messenger.js`** — Removed entire custom `showSystemMessage()` method (which used `position: fixed`, inline styles, and `document.body.appendChild()`). All 7 call sites now use `ElxaUI.showMessage()` instead.

### CSS Hybrid Theming
- **`messenger.css`** — Chrome elements now use OS theme variables: sidebar header, chat header, settings header, emoji picker header, context menu, buttons, borders, scrollbars, contacts header, tabs, form inputs, text input, avatars. These all follow `var(--titlebarBg)`, `var(--windowBg)`, `var(--menuHoverBg)`, `var(--menuText)`, etc. No more bright white backgrounds on dark themes.
- **`messenger.css`** — All hardcoded `#000`, `white`, `#808080`, `#666` text colors in chrome areas → `var(--menuText)` with opacity for secondary text.
- **`messenger.css`** — Chat content area stays retro/user-customizable: message bubbles, typing indicator, chat message avatars all remain controlled by the user’s appearance settings (not OS theme).
- **`messenger.css`** — Setup and settings modals changed from `position: fixed` to `position: absolute` (contained within the window, not viewport).
- **`messenger.css`** — Renamed `typingDot` keyframe to `messengerTypingDot` to avoid global collision.

### Cleanup
- **`messenger.js`** — Removed `handleContextMenuClickAway()` method (redundant with the document click handler).
- **`messenger.js`** — Removed `module.exports` block at bottom (not needed in vanilla script-tag environment).
- **`messenger.js`** — Reduced excessive `console.log` verbosity throughout.

---

## Snoogle Browser — Icon Migration + Review (Phase 3)

### Icon Migration
- **`icon-config.js`** — Added 6 new action icons: `star` (mdi-star), `star-outline` (mdi-star-outline), `menu` (mdi-menu), `wifi` (mdi-wifi), `wifi-off` (mdi-wifi-off), `magnify` (mdi-magnify).
- **`browser.js`** — All toolbar emojis → ElxaIcons: ◄→back, ►→forward, ↻→refresh, 🏠→home, ⭐→star/star-outline, 📶→wifi, ☰→menu, 🔍→magnify.
- **`browser.js`** — Menu items: ⭐→star, 📋→history, 🗑️→delete, ❌→close, 📶→wifi.
- **`browser.js`** — Connection status: 📶→wifi, 🌐→wifi, 📡→wifi-off. Inline styles replaced with CSS classes.
- **`browser.js`** — Sidebar: 🌐 emoji icons → `ElxaIcons.render('browser', 'ui')` for all items.
- **`browser.js`** — Window title: emoji 🌐 → `ElxaIcons.render('browser', 'ui')`.
- **`browser.js`** — Favorite button now toggles between star and star-outline icons via `updateFavoriteButton()`.
- **`browser.js`** — Sidebar tabs now have icons: star for Favorites, history for History.
- **`browser.js`** — Clear History button in sidebar now has delete icon.

### Bug Fixes
- **`browser.js`** — Fixed `const window` shadowing global `window` in 14 methods. All renamed to `const win`.
- **`browser.js`** — Fixed document-level click listener leak. `document.addEventListener('click', ...)` for menu close was never removed on window close. Now stored as `this.documentClickHandler` and cleaned up in `cleanupDocumentListeners()` on window close.
- **`browser.js`** — Fixed EventBus listener lifecycle. WiFi listeners are now permanent (registered once in constructor, guarded by `isWindowValid()`). Previously they were cleaned up on window close and never re-registered on relaunch.
- **`browser.js`** — Menu item click handler now uses `e.target.closest('.browser-menu-item')` instead of `e.target.dataset.action` — clicking on an icon span inside a menu item no longer silently fails.

### confirm() → ElxaUI
- **`browser.js`** — Replaced 2 raw `confirm()` calls (clear history, clear favorites) with `ElxaUI.showConfirmDialog()`.

### CSS
- **`browser.css`** — Added `.connection-status`, `.connection-online`, `.connection-offline` classes (replaces inline styles).
- **`browser.css`** — Added `pointer-events: none` on `.mdi` spans inside toolbar, menu, sidebar, and clear-history button.

### Cleanup
- **`browser.js`** — Removed unused `getPageIcon()` method and `getSiteIcon()` method (emojis for website categories). Favorites no longer store an `icon` field — sidebar renders ElxaIcons at display time instead.
- **`browser.js`** — Removed unused `eventListeners` array property from constructor.

---

## ElxaCode — Full Rewrite (Icon Migration Phase 3 + Bug Fixes)

### Critical Bug Fixes
- **`elxacode.js`** — Fixed `openFile()` defined twice. The toolbar "Open" dialog version was silently overwritten by the file-manager entry point at the bottom of the file. Clicking Open in the toolbar was completely broken. Renamed toolbar version to `showOpenDialog()`, kept file-manager entry point as `openFile(fileName, filePath)` for interface compatibility.
- **`elxacode.js`** — Fixed `loadFile(windowId)` called but undefined. `launch()` called `this.loadFile(windowId)` which didn't exist — only `loadFileFromPath()` existed. Opening .elxa files from the file manager silently failed. Created unified `loadFileIntoEditor(windowId, filePath, fileName)` used by both paths.
- **`elxacode.js`** — Fixed `const window = this.windowManager.createWindow(...)` shadowing global `window`. Renamed to `const win`.
- **`elxacode.js`** — Fixed `setupConsoleResizer` referencing undefined `windowElement` inside `setTimeout`. Now properly queries `document.getElementById()` at the start of the method.
- **`elxacode.js`** — Fixed shared `currentFile`/`currentPath` across all windows. These were instance-level properties, so opening a second ElxaCode window overwrote the first window's file info. Moved to per-window state inside `this.activeWindows` Map.

### Icon Migration
- **`icon-config.js`** — Added 3 new action icons: `play` (mdi-play), `stop` (mdi-stop), `terminal` (mdi-console).
- **`elxacode.js`** — All toolbar emojis → ElxaIcons: 📄→new-file, 📂→open, 💾→save, ▶️→play, ⏹️→stop, 🗑️→clear. Console header 📟→terminal. Window title 💻→elxacode program icon. File dialog header 📂→open. File icons in dialog 💻→`ElxaIcons.getFileIcon()`.
- **`elxacode.js`** — Window title uses `innerHTML` with `ElxaIcons.render()` instead of `textContent` with emoji.

### Save As Dialog
- **`elxacode.js`** — Replaced raw `prompt()` in `saveFile()` with a proper themed Save As dialog (matches Open dialog pattern). Uses `ElxaUI.showConfirmDialog()` for overwrite confirmation instead of raw `confirm()`.

### CSS Theming
- **`elxacode.css`** — Toolbar now uses OS theme variables (`--menuBg`, `--buttonBg`, `--menuText`, `--windowBorder`, etc.) instead of hardcoded Win95 gradients.
- **`elxacode.css`** — File browser dialog uses theme variables for header, background, borders, buttons, selection colors.
- **`elxacode.css`** — Status bar uses `--titlebarBg` / `--menuHoverText` instead of hardcoded `#007acc`.
- **`elxacode.css`** — Added `pointer-events: none` on `.mdi` spans inside toolbar buttons and console header.
- **`elxacode.css`** — Editor and console dark theme preserved intentionally (VS Code style).
- **`elxacode.css`** — Added Save As form styles (`.save-form`, `.filename-input`, `.save-location`).
- **`elxacode.css`** — Removed dark-theme overrides that duplicated default dark styles.
- **`elxacode.css`** — Added double-click to open in file list dialog.

### Default Code Folder
- **`default-files.js`** — Added `Documents > Code` as a default folder. Moved `My First Code.elxa` from Documents into Documents/Code.
- **`elxacode.js`** — Save As defaults to `Documents > Code` instead of Desktop. Open dialog searches Code folder first, then Documents, then Desktop.

### Other Improvements
- **`elxacode.js`** — Removed unused `applySyntaxHighlighting()` call (was just a status bar update). Cursor position now updates on click and keyup directly.
- **`elxacode.js`** — Removed the stale initial console resizer `setTimeout` that referenced an undefined `windowElement` variable and tried to calculate initial heights.
- **`elxacode.js`** — Added `onmousedown="event.preventDefault()"` on toolbar buttons to prevent stealing focus from the code editor.

---

## Theme Consistency Pass — Dialogs, Context Menu, Calculator

### Notepad Save Bug Fix
- **`notepad.js`** — Fixed line breaks lost on save. Changed `textArea.textContent` → `textArea.innerText` in both `saveDocument()` and `saveWithFilename()`. `textContent` ignores `<br>` and block boundaries; `innerText` respects visual line breaks.
- **`notepad.js`** — Fixed plain text loading. `updateDisplay()` now converts `\n` to `<br>` with HTML-escaping instead of using `textContent` (which doesn't render newlines in contenteditable).
- **`notepad.js`** — Fixed `hasUserFormatting()` missing font changes. Added detection for `<font face=...>`, `<font size=...>`, `font-family:`, and `font-size:` CSS. Previously changing only font/size would silently save as plain text.

### File Manager Context Menu → Themed
- **`file-manager.js`** — Replaced hardcoded inline styles (background `#c0c0c0`, hover `#000080/#ffffff`, separator `#808080`) with CSS classes: `.fm-context-menu`, `.fm-context-menu-item`, `.fm-context-menu-separator`. Removed JS `mouseenter`/`mouseleave` handlers in favor of CSS `:hover`.
- **`file-manager.css`** — Added context menu CSS using theme variables (`--windowBg`, `--windowBorder`, `--menuHoverBg`, `--menuHoverText`, `--menuText`).

### Notepad/Paint Dialog Buttons → Themed
- **`notepad.css`** — `.open-btn` / `.save-btn` changed from hardcoded green `#4CAF50` to `var(--titlebarBg)` with `filter: brightness()` for hover/active. `.format-info` changed from hardcoded yellow to theme variables. `.import-selected-btn` and `.use-paint-btn` also themed.

### Calculator Help & History → Themed
- **`calculator.js`** — `showMessage()` rebuilt from inline-styled `<div>` to structured dialog with themed header (`.calculator-message-header`), body (`.calculator-message-body`), and OK button (`.calculator-message-ok`). No more hardcoded `#fff`/`#000`/`#c0c0c0`.
- **`calculator.css`** — Added themed styles for `.calculator-message`, `.calculator-message-header`, `.calculator-message-body`, `.calculator-message-ok`. History panel background changed from hardcoded `rgba(255,255,255,0.98)` to `var(--windowBg)`. History header title color fixed.

---

## Icon Migration Phase 2 — Core System Programs & Toast Unification

### Notepad, Paint, Calculator → Full Theme + MDI Icons
- **`icon-config.js`** — added 25 new action icons (undo, redo, bold, italic, brush, pencil, eraser, bucket, eyedropper, line, rectangle, circle, text-tool, swap, zoom-in/out/fit, resize, clear, text-color, font, underline, highlight).
- **`notepad.js`** — all emojis → ElxaIcons. Removed 370-line hardcoded inline `<style>` block. Fixed format-without-selection bug, caret loss on font/size select, empty size dropdown, duplicate `hasUserFormatting`, `const window` shadowing, event listener leak, null-safety.
- **`paint.js`** — all emojis → ElxaIcons. Tool definitions changed from `icon` to `actionId`. Removed ~200-line inline `<style>` block. `textContent` → `innerHTML` for window titles.
- **`calculator.js`** — all emojis → ElxaIcons for window title, history, help, backspace buttons.

### Theme Fixes
- **`desktop.css`** — added `.window-titlebar .elxa-icon-ui { color: inherit }` so titlebar icons match text color across all themes.
- **`notepad.css` / `paint.css` / `calculator.css`** — added `pointer-events: none` on `.mdi` spans inside buttons to prevent click interception (critical for contenteditable focus).

### Toast Notification Unification
- **`elxa-ui.js`** — stripped inline styles from `showMessage()`, added vertical stacking logic for multiple simultaneous toasts.
- **`desktop.css`** — added `.elxa-toast` CSS using theme variables with colored left-border accents per type.
- **Migrated 6 services to `ElxaUI.showMessage()`** — wifi-service.js, elxabooks.js, login-service.js, setup-wizard.js, theme-service.js all had copy-pasted hardcoded toast implementations. All now delegate to the central themed system. (installer-service.js was already migrated.)

---

## MDI Icon System & Centralized Icon Config

- **Added MDI (Material Design Icons) webfont** — loaded via CDN in `index.html`. Replaces emojis across the system chrome with professional vector icons.
- **Created `js/icon-config.js`** — centralized icon registry (`ElxaIcons` global). Maps all program IDs, file types, and system actions to their MDI icon class and color. Provides `render()`, `renderFileType()`, `renderFolder()`, `renderAction()`, and `getFileIcon()` methods with context-aware rendering: `'desktop'` context uses full distinct colors with drop-shadow; `'ui'` context uses monochrome theme-tinted color via CSS variable.
- **Added `--uiIconColor` CSS variable** — new theme color property added to all 16 themes in `theme-service.js`. Each theme has a tuned monochrome icon tint (e.g. dark gray for Classic, muted blue for Luna Blue, cyan for Synthwave, orange for Zune). Applied to `.elxa-icon-ui` class.
- **Updated `desktop.css`** — removed box/border/background from `.desktop-icon-image`, increased icon size to 36px. Added `.elxa-icon-desktop` (full color + drop-shadow) and `.elxa-icon-ui` (theme-tinted) classes. Added context-specific sizing for start menu, taskbar, quick-launch, and system tray icons. Start menu icons recolor on hover to match `--menuHoverText`.
- **Migrated `index.html`** — all desktop icons, Start button, quick-launch, system tray, and start menu items now use MDI icons with proper context classes.
- **Migrated `desktop.js`** — all context menu items and confirm dialog calls now use `ElxaIcons.renderAction()`.
- **Migrated `file-manager.js`** — toolbar, nav buttons, view buttons, operations bar, context menu, file type icons, window titles, syncDesktopFiles, and all dialog calls now use `ElxaIcons` methods. `getFileIcon()` now delegates to `ElxaIcons.getFileIcon()`. Desktop files use `'desktop'` context; file manager UI uses `'ui'` context.
- **Migrated `shutdown-manager.js`** — shutdown/logout dialogs and shutdown screen now use `ElxaIcons.renderAction()`.
- **Migrated `default-files.js`** — desktop shortcut `.lnk` icons now use `ElxaIcons.render(programId, 'desktop')`. Game installer `.abby` icons use `ElxaIcons.renderAction('install')`.
- **Updated `elxa-ui.js`** — dialog button labels switched from `textContent` to `innerHTML` to render icon HTML.
- **Updated `elxa-core.js`** — `addToTaskbar()` switched from `textContent` to `innerHTML`.
- **Updated `taskbar.js`** — overflow menu row switched from `textContent` to `innerHTML`.
- **Created `ICON-MIGRATION.md`** — full emoji audit and MDI migration map documenting all ~50+ UI emojis, their replacements, and the phased migration plan.
#
# Format: newest entries at the top.

---

## v4.2.0 (in progress)

### Unified Design System (Step 3 — in progress)
- **Created `ElxaUI` shared utility** (`js/elxa-ui.js`) — global object providing common UI patterns. Loaded right after `elxa-core.js` so all programs and services can use it. First method: `ElxaUI.showMessage(text, type)` — the canonical toast notification.
- **Consolidated `showMessage` toast notifications** — found 9 separate copy-pasted implementations across the codebase (file-manager, login-service, paint, notepad, theme-service, setup-wizard, installer-service, elxabooks, calculator). Replaced 8 of them with thin wrappers that delegate to `ElxaUI.showMessage()`. Calculator keeps its own implementation since it uses a centered modal dialog with an OK button, which is a different UX pattern.
- **Fixed installer-service notifications** — its `showMessage` was broken (no inline styles, just a CSS class), so toasts were invisible. Now uses the shared utility and actually works.
- **Fixed elxabooks notification z-index** — was z-index 50, which put toasts behind windows. Now uses the shared z-index 9000.
- **Standardized toast z-index** — all toasts now use z-index 9000 (was inconsistent: 3000 in most places, 10000 in setup-wizard, 50 in elxabooks). High enough to appear above windows but below true modal overlays.
- **Migrated shutdown & logout dialogs to ElxaUI** — `showShutdownConfirmation()` and `showLogoutConfirmation()` in `shutdown-manager.js` now delegate to `ElxaUI.showConfirmDialog()`. Deleted ~90 lines of hand-built dialog HTML/event wiring. Dialogs now use the unified `.elxa-dialog-*` CSS instead of the old `.elxa-shutdown-dialog-*` classes.
- **Migrated File Manager delete confirmation** — `deleteSelected()` in `file-manager.js` replaced raw `confirm()` browser dialog with `ElxaUI.showConfirmDialog()` using the danger button style. Method is now async.
- **Migrated desktop delete & reset confirmations** — desktop right-click "Delete" and "Reset Positions" actions in `desktop.js` now use `ElxaUI.showConfirmDialog()` instead of raw `confirm()`.
- **Added `confirmClass` option to `showConfirmDialog`** — allows callers to pass e.g. `'elxa-dialog-btn-danger'` for red destructive-action buttons. Defaults to `'elxa-dialog-btn-primary'`.
- **Removed orphaned dialog CSS** — deleted `~100` lines of `.elxa-shutdown-dialog-*` and `.elxa-logout-dialog-*` styles from `css/system/dialogs.css` (no longer referenced). Deleted `~140` lines of `.input-dialog` / `.folder-name-input` / `.rename-input` styles from `css/file-manager.css` (replaced by ElxaUI dialog system last session). Removed dead `.dark-theme .folder-name-input` rule.

### Taskbar Improvements (Step 2)
- **File Explorer quick-launch button** — added a 📁 button in a quick-launch area between Start and the program buttons. Clicking it opens the File Manager to root (My Computer). Area is visually separated with an inset border, matching the classic Win95 quick-launch tray. (index.html, taskbar.js, desktop.css)
- **Taskbar overflow handling** — when too many programs are open, buttons that don't fit are hidden and a `»` overflow button appears. Clicking it shows a dropdown menu listing all hidden windows. Uses MutationObserver to auto-detect when buttons are added/removed, and rechecks on window resize. Menu items click through to the real taskbar buttons (minimize/restore/focus). (taskbar.js, desktop.css)
- **Taskbar button audit** — verified that all programs create exactly one taskbar entry via WindowManager.createWindow → addToTaskbar. No programs bypass this path, no duplicates observed. Added `flex-shrink: 0` to Start button, system tray, and individual program buttons to prevent squishing. (desktop.css)

### File Manager Overhaul (Step 1)
- **Per-window state** — opening multiple File Manager windows no longer clobbers each other's state. Each window now gets its own `currentPath`, `selectedItems`, `viewMode`, and navigation history via a `windowStates` Map. Clipboard remains shared (intentional — copy in one window, paste in another). State is auto-cleaned when a window closes via EventBus listener. (file-manager.js)
- **Wired up rename** — the Rename button/F2 now actually calls `fileSystem.renameItem()` instead of showing "not yet implemented". Shows success/error toast, refreshes the view, and emits `desktop.changed` if renaming inside the Desktop folder. (file-manager.js)
- **Built right-click context menu** — `showContextMenu` is no longer a stub. Renders a classic Win95-style context menu with Open, Copy, Cut, Paste, Delete, Rename. Menu items change based on context: right-clicking a file vs folder vs empty space shows different options. Right-clicking an unselected item auto-selects it. Menu stays on-screen and closes on outside click. (file-manager.js)
- **Implemented Back/Forward navigation** — each window maintains a navigation history stack. Navigating into a folder pushes onto the stack. Back/Forward buttons move through history without losing forward entries (until you navigate somewhere new, which trims forward). Buttons are properly enabled/disabled. Also added Alt+Left/Right keyboard shortcuts and Backspace for Go Up. (file-manager.js)

### Bug Fixes
- **Fixed window drag memory leak** — dragging windows no longer leaks mousemove/mouseup event listeners. Previously, every drag added listeners that were never removed because `.bind(this)` created new function references each time. Now uses stored bound references. (elxa-core.js)
- **Removed duplicate `clearStorage` method** — FileSystem had two identical definitions; removed the extra. (elxa-core.js)
- **Flagged `document.execCommand` deprecation** — added TODO to notepad.js noting this API is deprecated and should eventually be replaced with InputEvent API or custom Selection/Range manipulation.

### Structural Improvements
- **Tamed the logout dialog** — replaced ~170 lines of "NUCLEAR CLEANUP" code (4 redundant DOM removal methods, triple-scheduled timeouts, all inline `!important` styles) with ~50 clean lines matching the shutdown dialog pattern. Same functionality, way less chaos. (shutdown-manager.js)
- **Split desktop.js into 4 files** — the original 1300-line file is now:
  - `desktop.js` — Desktop class only (~340 lines)
  - `taskbar.js` — Taskbar class (~80 lines)
  - `shutdown-manager.js` — ShutdownManager class (~195 lines)
  - `elxaos.js` — ElxaOS main class + DOMContentLoaded init (~180 lines)
- **Program launch registry** — replaced the 70-line `launchProgram()` switch statement with a registry object. Adding a new program is now one line in `buildProgramRegistry()`. Also added `registerProgram(id, fn)` for runtime registration. (elxaos.js)
- **Default files data file** — moved all hardcoded default files/folders (Welcome.txt, shortcuts, game installers, etc.) out of `initialize()` into `default-files.js`. Two constants (`ELXAOS_DEFAULT_FOLDERS`, `ELXAOS_DEFAULT_FILES`) drive a 12-line loader loop. Adding a new default file = adding one object to an array. (default-files.js, elxaos.js)

### Major: IndexedDB Migration
- **Created ElxaDB wrapper** (`js/services/elxa-db.js`) — thin async key-value API over IndexedDB. Replaces localStorage for filesystem storage. Methods: `open()`, `get()`, `put()`, `delete()`, `keys()`, `clear()`.
- **Migrated FileSystem persistence** — `saveToStorage()` now writes to IndexedDB (fire-and-forget async). `loadFromStorage()` is async, tries IndexedDB first, then auto-migrates from localStorage on first run and cleans up the old data. Storage limit goes from ~5MB to effectively unlimited.
- **Async boot sequence** — `ElxaOS.asyncInit()` opens the database and loads the filesystem before calling `initialize()`. Falls back gracefully to in-memory defaults if anything fails. Boot screen covers the async wait so users see no difference.
- **Updated debug tools to v2.0** — all debug commands now read from the in-memory tree (source of truth). `clearAllStorage()` clears both IndexedDB and localStorage. Backup/restore supports both old v1 (localStorage) and new v2 (IndexedDB) backup formats.
- **Automatic migration** — existing users' localStorage filesystem data is seamlessly moved to IndexedDB on first load. Zero user action required, nothing lost.

### User-Facing Highlights (for updates.txt later)
- Improved system stability (drag bug, memory leaks)
- Under-the-hood storage upgrade — way more space for Paint images, saved files, etc.
- Faster saves (async, non-blocking)
- File Manager: rename files, right-click menus, back/forward navigation all work now!
- Quick-launch File Explorer button on the taskbar
- Taskbar handles tons of open windows without overflowing off-screen

---

## v4.1.0 (previous release)
- E-mail system (elxamail.ex)
- Messenger upgrade with memory/history
- Snake Deluxe improvements
- New game: Mail Room Mayhem (WIP)
