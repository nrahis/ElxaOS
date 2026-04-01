// =================================
// SVSE — Snake Valley Stock Exchange
// Market overview, stock detail, scrolling ticker, portfolio
// =================================

var ScaleStreet = (function() {
    'use strict';

    // ---- State ----
    var currentTab = 'market';
    var currentDetailTicker = null;

    // ---- Helpers ----
    function mdi(name) {
        return '<span class="mdi mdi-' + name + '"></span>';
    }

    function snakes(usd) {
        var s = Math.round(usd * 2);
        return s.toLocaleString() + ' \u00A7';
    }

    function snakesShort(usd) {
        var s = usd * 2;
        if (s >= 1000000) return (s / 1000000).toFixed(1).replace(/\.0$/, '') + 'M \u00A7';
        if (s >= 1000) return (s / 1000).toFixed(0) + 'k \u00A7';
        return Math.round(s).toLocaleString() + ' \u00A7';
    }

    function changeClass(val) {
        if (val > 0) return 'gain';
        if (val < 0) return 'loss';
        return 'neutral';
    }

    function changeSign(val) {
        return val > 0 ? '+' : '';
    }

    // ---- Sparkline SVG ----
    function sparkline(history, cssClass) {
        if (!history || history.length < 2) return '';
        var w = 80, h = 24, pad = 2;
        var min = Infinity, max = -Infinity;
        for (var i = 0; i < history.length; i++) {
            if (history[i] < min) min = history[i];
            if (history[i] > max) max = history[i];
        }
        var range = max - min || 1;
        var pts = [];
        for (var j = 0; j < history.length; j++) {
            var x = pad + (j / (history.length - 1)) * (w - pad * 2);
            var y = pad + (1 - (history[j] - min) / range) * (h - pad * 2);
            pts.push({ x: x, y: y });
        }
        var color = history[history.length - 1] >= history[0] ? '#3fb950' : '#f85149';
        // Bezier path
        var d = 'M' + pts[0].x.toFixed(1) + ',' + pts[0].y.toFixed(1);
        for (var k = 1; k < pts.length; k++) {
            var prev = pts[k - 1];
            var cur = pts[k];
            var cpx = (prev.x + cur.x) / 2;
            d += ' C' + cpx.toFixed(1) + ',' + prev.y.toFixed(1) + ' ' + cpx.toFixed(1) + ',' + cur.y.toFixed(1) + ' ' + cur.x.toFixed(1) + ',' + cur.y.toFixed(1);
        }
        return '<svg class="svse-sparkline" viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">' +
            '<path fill="none" stroke="' + color + '" stroke-width="1.5" stroke-linecap="round" d="' + d + '"/>' +
            '</svg>';
    }

    // Larger detail chart
    function detailChart(history) {
        if (!history || history.length < 2) return '<div style="color:#8b949e;font-size:12px;">No history data</div>';
        var w = 520, h = 120, pad = 8;
        var min = Infinity, max = -Infinity;
        for (var i = 0; i < history.length; i++) {
            if (history[i] < min) min = history[i];
            if (history[i] > max) max = history[i];
        }
        var range = max - min || 1;
        var pts = [];
        for (var j = 0; j < history.length; j++) {
            var x = pad + (j / (history.length - 1)) * (w - pad * 2);
            var y = pad + (1 - (history[j] - min) / range) * (h - pad * 2);
            pts.push({ x: x, y: y });
        }

        // Build smooth bezier path
        var linePath = 'M' + pts[0].x.toFixed(1) + ',' + pts[0].y.toFixed(1);
        for (var k = 1; k < pts.length; k++) {
            var prev = pts[k - 1];
            var cur = pts[k];
            var cpx = (prev.x + cur.x) / 2;
            linePath += ' C' + cpx.toFixed(1) + ',' + prev.y.toFixed(1) + ' ' + cpx.toFixed(1) + ',' + cur.y.toFixed(1) + ' ' + cur.x.toFixed(1) + ',' + cur.y.toFixed(1);
        }
        // Area path closes down to bottom
        var areaPath = linePath + ' L' + pts[pts.length - 1].x.toFixed(1) + ',' + (h - pad) + ' L' + pts[0].x.toFixed(1) + ',' + (h - pad) + ' Z';

        var isUp = history[history.length - 1] >= history[0];
        var color = isUp ? '#3fb950' : '#f85149';
        var gradId = 'detGrad' + Date.now();

        var labelHigh = snakes(max);
        var labelLow = snakes(min);

        return '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">' +
            '<defs><linearGradient id="' + gradId + '" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="' + color + '" stop-opacity="0.25"/>' +
            '<stop offset="100%" stop-color="' + color + '" stop-opacity="0.02"/>' +
            '</linearGradient></defs>' +
            '<path fill="url(#' + gradId + ')" d="' + areaPath + '"/>' +
            '<path fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" d="' + linePath + '"/>' +
            '<circle cx="' + pts[pts.length - 1].x.toFixed(1) + '" cy="' + pts[pts.length - 1].y.toFixed(1) + '" r="3" fill="' + color + '"/>' +
            '<text x="' + (w - pad) + '" y="' + (pad + 10) + '" fill="#8b949e" font-size="10" text-anchor="end">' + labelHigh + '</text>' +
            '<text x="' + (w - pad) + '" y="' + (h - pad) + '" fill="#8b949e" font-size="10" text-anchor="end">' + labelLow + '</text>' +
            '</svg>';
    }

    // ---- Header Stats ----
    function renderHeaderStats() {
        var el = document.getElementById('headerStats');
        if (!el || !elxaOS || !elxaOS.stockService) return;
        var prices = elxaOS.stockService.getCurrentPricesSync();
        var gainers = 0, losers = 0;
        for (var i = 0; i < prices.length; i++) {
            if (prices[i].changePct > 0) gainers++;
            else if (prices[i].changePct < 0) losers++;
        }
        el.innerHTML =
            '<div class="svse-header-stat"><div class="label">Stocks</div><div class="value">' + prices.length + '</div></div>' +
            '<div class="svse-header-stat"><div class="label">Gainers</div><div class="value gain">' + gainers + '</div></div>' +
            '<div class="svse-header-stat"><div class="label">Losers</div><div class="value loss">' + losers + '</div></div>';
    }

    // ---- Scrolling Ticker ----
    function renderTicker() {
        var el = document.getElementById('tickerTrack');
        if (!el || !elxaOS || !elxaOS.stockService) return;
        var prices = elxaOS.stockService.getCurrentPricesSync();
        var news = elxaOS.stockService.getRecentNews();
        var html = '';
        // Stock prices in ticker
        for (var i = 0; i < prices.length; i++) {
            var s = prices[i];
            var cls = changeClass(s.changePct);
            html += '<span class="svse-ticker-item">' +
                '<span class="ticker-sym">' + s.ticker + '</span>' +
                '<span class="' + cls + '">' + snakes(s.price) + ' ' + changeSign(s.changePct) + s.changePct.toFixed(1) + '%</span>' +
                '</span>';
        }
        // News headlines
        for (var j = 0; j < news.length; j++) {
            html += '<span class="svse-ticker-item" style="color:#d4a843;">' +
                mdi('newspaper') + ' ' + news[j].headline +
                '</span>';
        }
        // Duplicate for seamless scroll
        el.innerHTML = html + html;
    }

    // ---- Sector Filter ----
    function populateSectorFilter() {
        var sel = document.getElementById('filterSector');
        if (!sel || !elxaOS || !elxaOS.stockService) return;
        var prices = elxaOS.stockService.getCurrentPricesSync();
        var sectors = {};
        for (var i = 0; i < prices.length; i++) {
            sectors[prices[i].sector] = true;
        }
        var keys = Object.keys(sectors).sort();
        for (var j = 0; j < keys.length; j++) {
            var opt = document.createElement('option');
            opt.value = keys[j];
            opt.textContent = keys[j];
            sel.appendChild(opt);
        }
    }

    // ---- Market Table ----
    function renderMarketTable() {
        var tbody = document.getElementById('stockTableBody');
        if (!tbody || !elxaOS || !elxaOS.stockService) return;

        var stocks = elxaOS.stockService.getCurrentPricesSync();
        var sector = document.getElementById('filterSector').value;
        var sort = document.getElementById('filterSort').value;

        // Filter
        if (sector !== 'all') {
            stocks = stocks.filter(function(s) { return s.sector === sector; });
        }

        // Sort
        switch (sort) {
            case 'price-desc':
                stocks.sort(function(a, b) { return b.price - a.price; });
                break;
            case 'price-asc':
                stocks.sort(function(a, b) { return a.price - b.price; });
                break;
            case 'change-desc':
                stocks.sort(function(a, b) { return b.changePct - a.changePct; });
                break;
            case 'change-asc':
                stocks.sort(function(a, b) { return a.changePct - b.changePct; });
                break;
            default: // ticker-asc
                stocks.sort(function(a, b) { return a.ticker.localeCompare(b.ticker); });
        }

        var html = '';
        for (var i = 0; i < stocks.length; i++) {
            var s = stocks[i];
            var cls = changeClass(s.changePct);
            var divText = s.dividendRate > 0 ? (s.dividendRate * 100).toFixed(1) + '%' : '—';

            html += '<tr data-action="view-stock" data-ticker="' + s.ticker + '">' +
                '<td class="col-ticker"><div class="svse-stock-ticker">' + s.ticker + '</div></td>' +
                '<td class="col-name"><div class="svse-stock-name">' + s.name + '</div></td>' +
                '<td class="col-sector"><span class="svse-sector-badge">' + s.sector + '</span></td>' +
                '<td class="col-price">' + snakes(s.price) + '</td>' +
                '<td class="col-change"><span class="svse-change-val ' + cls + '">' + changeSign(s.change) + snakes(Math.abs(s.change)) + '</span>' +
                    '<span class="svse-change-pct ' + cls + '">' + changeSign(s.changePct) + s.changePct.toFixed(2) + '%</span></td>' +
                '<td class="col-chart">' + sparkline(s.history) + '</td>' +
                '<td class="col-div"><span class="svse-div-rate">' + divText + '</span></td>' +
                '</tr>';
        }
        tbody.innerHTML = html;
    }

    // ---- Stock Detail View ----
    function showStockDetail(ticker) {
        if (!elxaOS || !elxaOS.stockService) return;
        var stock = elxaOS.stockService.getStockDetail(ticker);
        if (!stock) return;

        currentDetailTicker = ticker;
        var cls = changeClass(stock.changePct);
        var divText = stock.dividendRate > 0 ? (stock.dividendRate * 100).toFixed(1) + '%/mo' : 'None';

        var volLabels = { '0.05': 'Low', '0.12': 'Medium', '0.25': 'High', '0.4': 'Extreme' };
        var volText = volLabels[String(stock.volatility)] || 'Unknown';

        // 12-month range
        var low12 = Infinity, high12 = -Infinity;
        for (var i = 0; i < stock.history.length; i++) {
            if (stock.history[i] < low12) low12 = stock.history[i];
            if (stock.history[i] > high12) high12 = stock.history[i];
        }

        var html = '';

        // Header
        html += '<div class="svse-detail-header">' +
            '<span class="svse-detail-ticker">' + stock.ticker + '</span>' +
            '<span class="svse-detail-name">' + stock.name + '</span>' +
            '<span class="svse-sector-badge">' + stock.sector + '</span>' +
            '</div>';

        // Price row
        html += '<div class="svse-detail-price-row">' +
            '<span class="svse-detail-price">' + snakes(stock.price) + '</span>' +
            '<span class="svse-detail-change ' + cls + '">' +
                changeSign(stock.change) + snakes(Math.abs(stock.change)) +
                ' (' + changeSign(stock.changePct) + stock.changePct.toFixed(2) + '%)' +
            '</span>' +
            '</div>';

        // Chart
        html += '<div class="svse-detail-chart">' + detailChart(stock.history) + '</div>';

        // Info grid
        html += '<div class="svse-detail-info">' +
            '<div class="svse-detail-info-item"><span class="svse-detail-info-label">Volatility</span><span class="svse-detail-info-value">' + volText + '</span></div>' +
            '<div class="svse-detail-info-item"><span class="svse-detail-info-label">Dividend</span><span class="svse-detail-info-value">' + divText + '</span></div>' +
            '<div class="svse-detail-info-item"><span class="svse-detail-info-label">12-Mo Low</span><span class="svse-detail-info-value">' + snakes(low12) + '</span></div>' +
            '<div class="svse-detail-info-item"><span class="svse-detail-info-label">12-Mo High</span><span class="svse-detail-info-value">' + snakes(high12) + '</span></div>' +
            '</div>';

        // Description
        html += '<div class="svse-detail-desc">' + stock.description + '</div>';

        // Recent news
        if (stock.recentNews && stock.recentNews.length > 0) {
            html += '<div class="svse-detail-news-title">' + mdi('newspaper') + ' Recent News</div>';
            for (var n = stock.recentNews.length - 1; n >= 0; n--) {
                var newsItem = stock.recentNews[n];
                var article = (typeof STOCK_ARTICLES !== 'undefined') ? STOCK_ARTICLES[newsItem.eventId] : null;
                var isFeature = article && article.type === 'feature';
                html += '<div class="svse-detail-news-item">' + newsItem.headline;
                if (isFeature) {
                    html += ' <a href="#" class="svse-ssj-link" data-action="goto-ssj" data-event="' + newsItem.eventId + '">' + mdi('newspaper-variant-outline') + ' Read in SSJ</a>';
                }
                html += '</div>';
            }
        }

        // Action buttons
        html += '<div class="svse-detail-actions">' +
            '<button class="svse-btn svse-btn-buy" data-action="buy-stock" data-ticker="' + stock.ticker + '">' +
                mdi('cart-plus') + ' Buy' +
            '</button>' +
            '<button class="svse-btn svse-btn-sell" data-action="sell-stock" data-ticker="' + stock.ticker + '">' +
                mdi('cash-minus') + ' Sell' +
            '</button>' +
            '</div>';

        document.getElementById('detailContent').innerHTML = html;
        document.getElementById('detailOverlay').classList.remove('hidden');
    }

    function closeDetail() {
        document.getElementById('detailOverlay').classList.add('hidden');
        currentDetailTicker = null;
    }

    // ---- Trade Dialogs ----
    function closeTrade() {
        document.getElementById('tradeOverlay').classList.add('hidden');
    }

    function getCheckingBalance() {
        if (!elxaOS || !elxaOS.financeService) return 0;
        var balances = elxaOS.financeService.getAccountBalancesSync();
        return balances ? balances.checking : 0;
    }

    function showBuyDialog(ticker) {
        var stock = elxaOS.stockService.getStockDetail(ticker);
        if (!stock) return;

        var balance = getCheckingBalance();
        var maxShares = Math.floor(balance / stock.price);

        var html = '<div class="svse-trade-title">' + mdi('cart-plus') + ' Buy ' + stock.ticker + '</div>' +
            '<div class="svse-trade-subtitle">' + stock.name + '</div>';

        html += '<div class="svse-trade-row"><span class="label">Price per share</span><span class="value">' + snakes(stock.price) + '</span></div>';
        html += '<div class="svse-trade-row"><span class="label">Checking balance</span><span class="value">' + snakes(balance) + '</span></div>';
        html += '<div class="svse-trade-row"><span class="label">Max you can buy</span><span class="value">' + maxShares + ' shares</span></div>';

        html += '<div class="svse-trade-qty-row">' +
            '<label>Quantity</label>' +
            '<input type="number" class="svse-trade-qty-input" id="tradeQty" min="1" max="' + maxShares + '" value="1" data-price="' + stock.price + '" data-balance="' + balance + '" data-mode="buy">' +
            '<div class="svse-trade-qty-btns">' +
                '<button class="svse-trade-qty-btn" data-action="set-qty" data-qty="1">1</button>' +
                '<button class="svse-trade-qty-btn" data-action="set-qty" data-qty="5">5</button>' +
                '<button class="svse-trade-qty-btn" data-action="set-qty" data-qty="10">10</button>' +
                (maxShares > 0 ? '<button class="svse-trade-qty-btn" data-action="set-qty" data-qty="' + maxShares + '">Max</button>' : '') +
            '</div></div>';

        html += '<div class="svse-trade-total">' +
            '<div class="amount" id="tradeTotalDisplay">' + snakes(stock.price) + '</div>' +
            '<div class="sub">Total Cost</div>' +
            '</div>';

        html += '<div class="svse-trade-error" id="tradeError"></div>';

        html += '<div class="svse-trade-actions">' +
            '<button class="svse-btn svse-btn-cancel" data-action="close-trade">Cancel</button>' +
            '<button class="svse-btn svse-btn-confirm-buy" data-action="confirm-buy" data-ticker="' + ticker + '"' +
                (maxShares < 1 ? ' disabled' : '') + '>' +
                mdi('check') + ' Confirm Buy</button>' +
            '</div>';

        document.getElementById('tradeContent').innerHTML = html;
        document.getElementById('tradeOverlay').classList.remove('hidden');
    }

    function showSellDialog(ticker) {
        var stock = elxaOS.stockService.getStockDetail(ticker);
        if (!stock) return;

        var portfolio = elxaOS.stockService.getPortfolioSync();
        var holding = null;
        for (var i = 0; i < portfolio.length; i++) {
            if (portfolio[i].ticker === ticker) { holding = portfolio[i]; break; }
        }

        if (!holding || holding.shares < 1) {
            // No shares to sell — show message
            var html = '<div class="svse-trade-title">' + mdi('cash-minus') + ' Sell ' + stock.ticker + '</div>' +
                '<div class="svse-trade-subtitle">' + stock.name + '</div>' +
                '<div style="text-align:center;padding:30px 0;color:#8b949e;">' +
                    '<div style="font-size:32px;margin-bottom:8px;">' + mdi('alert-circle-outline') + '</div>' +
                    '<p>You don\'t own any shares of ' + stock.ticker + '.</p>' +
                    '<p style="font-size:12px;">Buy some first on the market!</p>' +
                '</div>' +
                '<div class="svse-trade-actions">' +
                    '<button class="svse-btn svse-btn-cancel" data-action="close-trade" style="flex:1;">Got it</button>' +
                '</div>';
            document.getElementById('tradeContent').innerHTML = html;
            document.getElementById('tradeOverlay').classList.remove('hidden');
            return;
        }

        var gainPer = stock.price - holding.avgCostBasis;

        var html = '<div class="svse-trade-title">' + mdi('cash-minus') + ' Sell ' + stock.ticker + '</div>' +
            '<div class="svse-trade-subtitle">' + stock.name + '</div>';

        html += '<div class="svse-trade-row"><span class="label">Current price</span><span class="value">' + snakes(stock.price) + '</span></div>';
        html += '<div class="svse-trade-row"><span class="label">Shares owned</span><span class="value">' + holding.shares + '</span></div>';
        html += '<div class="svse-trade-row"><span class="label">Avg cost basis</span><span class="value">' + snakes(holding.avgCostBasis) + '</span></div>';
        html += '<div class="svse-trade-row"><span class="label">Gain/loss per share</span><span class="value ' + changeClass(gainPer) + '">' +
            changeSign(gainPer) + snakes(Math.abs(gainPer)) + '</span></div>';

        html += '<div class="svse-trade-qty-row">' +
            '<label>Quantity</label>' +
            '<input type="number" class="svse-trade-qty-input" id="tradeQty" min="1" max="' + holding.shares + '" value="1" data-price="' + stock.price + '" data-costbasis="' + holding.avgCostBasis + '" data-max="' + holding.shares + '" data-mode="sell">' +
            '<div class="svse-trade-qty-btns">' +
                '<button class="svse-trade-qty-btn" data-action="set-qty" data-qty="1">1</button>' +
                (holding.shares >= 5 ? '<button class="svse-trade-qty-btn" data-action="set-qty" data-qty="5">5</button>' : '') +
                (holding.shares >= 10 ? '<button class="svse-trade-qty-btn" data-action="set-qty" data-qty="10">10</button>' : '') +
                '<button class="svse-trade-qty-btn" data-action="set-qty" data-qty="' + holding.shares + '">All</button>' +
            '</div></div>';

        html += '<div class="svse-trade-total">' +
            '<div class="amount" id="tradeTotalDisplay">' + snakes(stock.price) + '</div>' +
            '<div class="sub">Total Proceeds</div>' +
            '<div class="gainloss ' + changeClass(gainPer) + '" id="tradeGainDisplay">' +
                changeSign(gainPer) + snakes(Math.abs(gainPer)) + ' gain/loss' +
            '</div>' +
            '</div>';

        html += '<div class="svse-trade-error" id="tradeError"></div>';

        html += '<div class="svse-trade-actions">' +
            '<button class="svse-btn svse-btn-cancel" data-action="close-trade">Cancel</button>' +
            '<button class="svse-btn svse-btn-confirm-sell" data-action="confirm-sell" data-ticker="' + ticker + '">' +
                mdi('check') + ' Confirm Sell</button>' +
            '</div>';

        document.getElementById('tradeContent').innerHTML = html;
        document.getElementById('tradeOverlay').classList.remove('hidden');
    }

    function updateTradeTotal() {
        var input = document.getElementById('tradeQty');
        if (!input) return;

        var qty = parseInt(input.value) || 0;
        var price = parseFloat(input.getAttribute('data-price'));
        var mode = input.getAttribute('data-mode');
        var total = qty * price;

        var totalEl = document.getElementById('tradeTotalDisplay');
        if (totalEl) totalEl.textContent = snakes(total);

        // Update gain/loss for sell mode
        if (mode === 'sell') {
            var costBasis = parseFloat(input.getAttribute('data-costbasis'));
            var gl = (price - costBasis) * qty;
            var gainEl = document.getElementById('tradeGainDisplay');
            if (gainEl) {
                gainEl.className = 'gainloss ' + changeClass(gl);
                gainEl.textContent = changeSign(gl) + snakes(Math.abs(gl)) + ' gain/loss';
            }
        }

        // Validate
        var errorEl = document.getElementById('tradeError');
        if (mode === 'buy') {
            var balance = parseFloat(input.getAttribute('data-balance'));
            if (total > balance) {
                if (errorEl) { errorEl.textContent = 'Insufficient funds! You need ' + snakes(total - balance) + ' more.'; errorEl.classList.add('visible'); }
            } else if (qty < 1) {
                if (errorEl) { errorEl.textContent = 'Enter at least 1 share.'; errorEl.classList.add('visible'); }
            } else {
                if (errorEl) errorEl.classList.remove('visible');
            }
        } else {
            var maxShares = parseInt(input.getAttribute('data-max'));
            if (qty > maxShares) {
                if (errorEl) { errorEl.textContent = 'You only own ' + maxShares + ' shares!'; errorEl.classList.add('visible'); }
            } else if (qty < 1) {
                if (errorEl) { errorEl.textContent = 'Enter at least 1 share.'; errorEl.classList.add('visible'); }
            } else {
                if (errorEl) errorEl.classList.remove('visible');
            }
        }
    }

    async function executeBuy(ticker) {
        var input = document.getElementById('tradeQty');
        var qty = parseInt(input.value) || 0;
        var price = parseFloat(input.getAttribute('data-price'));
        var balance = parseFloat(input.getAttribute('data-balance'));
        var total = qty * price;

        if (qty < 1 || total > balance) return;

        var stock = elxaOS.stockService.getStockDetail(ticker);
        if (!stock) return;

        // Withdraw from checking
        var withdrawResult = await elxaOS.financeService.withdraw('checking', total, 'SVSE: Bought ' + qty + ' shares of ' + ticker);
        if (!withdrawResult.success) {
            var errorEl = document.getElementById('tradeError');
            if (errorEl) { errorEl.textContent = withdrawResult.message; errorEl.classList.add('visible'); }
            return;
        }

        // Acquire stock
        await elxaOS.inventoryService.acquireStock(ticker, stock.name, qty, price);

        // Show success
        var html = '<div class="svse-trade-success">' +
            '<div class="icon" style="color:#3fb950;">' + mdi('check-circle') + '</div>' +
            '<div class="msg">Purchase Complete!</div>' +
            '<div class="detail">Bought ' + qty + ' share' + (qty > 1 ? 's' : '') + ' of ' + ticker + '</div>' +
            '<div class="detail" style="margin-top:4px;">Total: ' + snakes(total) + '</div>' +
            '</div>' +
            '<div class="svse-trade-actions">' +
                '<button class="svse-btn svse-btn-cancel" data-action="close-trade" style="flex:1;">Done</button>' +
            '</div>';

        document.getElementById('tradeContent').innerHTML = html;

        // Refresh all views
        renderHeaderStats();
        renderTicker();
        renderMarketTable();
        if (currentTab === 'portfolio') renderPortfolio();
        if (currentDetailTicker === ticker) showStockDetail(ticker);
    }

    async function executeSell(ticker) {
        var input = document.getElementById('tradeQty');
        var qty = parseInt(input.value) || 0;
        var price = parseFloat(input.getAttribute('data-price'));
        var maxShares = parseInt(input.getAttribute('data-max'));

        if (qty < 1 || qty > maxShares) return;

        var proceeds = qty * price;

        // Sell stock (returns gainLoss info)
        var sellResult = await elxaOS.inventoryService.sellStock(ticker, qty, price);
        if (!sellResult) {
            var errorEl = document.getElementById('tradeError');
            if (errorEl) { errorEl.textContent = 'Failed to sell shares.'; errorEl.classList.add('visible'); }
            return;
        }

        // Deposit proceeds to checking
        await elxaOS.financeService.deposit('checking', proceeds, 'SVSE: Sold ' + qty + ' shares of ' + ticker);

        var gl = sellResult.gainLoss;
        var glClass = changeClass(gl);
        var glIcon = gl >= 0 ? 'trending-up' : 'trending-down';
        var glColor = gl >= 0 ? '#3fb950' : '#f85149';

        // Show success
        var html = '<div class="svse-trade-success">' +
            '<div class="icon" style="color:' + glColor + ';">' + mdi(glIcon) + '</div>' +
            '<div class="msg">Sale Complete!</div>' +
            '<div class="detail">Sold ' + qty + ' share' + (qty > 1 ? 's' : '') + ' of ' + ticker + '</div>' +
            '<div class="detail" style="margin-top:4px;">Proceeds: ' + snakes(proceeds) + '</div>' +
            '<div class="gainloss ' + glClass + '">' +
                changeSign(gl) + snakes(Math.abs(gl)) + ' ' + (gl >= 0 ? 'profit' : 'loss') +
            '</div>' +
            '</div>' +
            '<div class="svse-trade-actions">' +
                '<button class="svse-btn svse-btn-cancel" data-action="close-trade" style="flex:1;">Done</button>' +
            '</div>';

        document.getElementById('tradeContent').innerHTML = html;

        // Refresh all views
        renderHeaderStats();
        renderTicker();
        renderMarketTable();
        if (currentTab === 'portfolio') renderPortfolio();
        if (currentDetailTicker === ticker) showStockDetail(ticker);
    }

    // ---- Portfolio Tab ----
    function renderPortfolio() {
        var el = document.getElementById('portfolioContent');
        if (!el || !elxaOS || !elxaOS.stockService) return;

        var portfolio = elxaOS.stockService.getPortfolioSync();

        if (!portfolio || portfolio.length === 0) {
            el.innerHTML = '<div class="svse-portfolio-empty">' +
                '<div class="icon">' + mdi('briefcase-outline') + '</div>' +
                '<p><strong>No holdings yet</strong></p>' +
                '<p>Browse the market and buy your first shares!</p>' +
                '</div>';
            return;
        }

        // Summary calculations
        var totalValue = 0, totalInvested = 0, totalMonthlyDiv = 0;
        for (var i = 0; i < portfolio.length; i++) {
            totalValue += portfolio[i].currentValue;
            totalInvested += portfolio[i].totalInvested;
            if (portfolio[i].dividendRate > 0) {
                totalMonthlyDiv += portfolio[i].dividendRate * portfolio[i].currentPrice * portfolio[i].shares;
            }
        }
        var totalGL = totalValue - totalInvested;
        var totalPct = totalInvested > 0 ? (totalGL / totalInvested) * 100 : 0;
        var cls = changeClass(totalGL);

        // Summary header
        var html = '<div class="svse-portfolio-summary">' +
            '<div class="svse-portfolio-stat">' +
                '<div class="label">Total Value</div>' +
                '<div class="value big">' + snakes(totalValue) + '</div>' +
                '<div class="sub ' + cls + '">' + changeSign(totalGL) + snakes(Math.abs(totalGL)) +
                    ' (' + changeSign(totalPct) + totalPct.toFixed(2) + '%)' +
                '</div>' +
            '</div>' +
            '<div class="svse-portfolio-stat">' +
                '<div class="label">Invested</div>' +
                '<div class="value">' + snakes(totalInvested) + '</div>' +
            '</div>' +
            '<div class="svse-portfolio-stat">' +
                '<div class="label">' + mdi('cash-plus') + ' Monthly Dividends</div>' +
                '<div class="value gain">~' + snakes(totalMonthlyDiv) + '</div>' +
                '<div class="sub" style="color:#8b949e;">estimated at current prices</div>' +
            '</div>' +
            '</div>';

        // Holdings table
        html += '<table class="svse-table"><thead><tr>' +
            '<th class="col-ticker">Ticker</th>' +
            '<th>Shares</th>' +
            '<th class="col-price">Avg Cost</th>' +
            '<th class="col-price">Price</th>' +
            '<th class="col-price">Value</th>' +
            '<th class="col-change">Gain/Loss</th>' +
            '<th class="col-div">Div/Mo</th>' +
            '<th class="col-action"></th>' +
            '</tr></thead><tbody>';

        for (var j = 0; j < portfolio.length; j++) {
            var p = portfolio[j];
            var pCls = changeClass(p.gainLoss);
            var monthlyDiv = p.dividendRate > 0 ? p.dividendRate * p.currentPrice * p.shares : 0;
            var divText = monthlyDiv > 0 ? snakes(monthlyDiv) : '—';

            html += '<tr>' +
                '<td class="col-ticker"><span class="svse-stock-ticker" data-action="view-stock" data-ticker="' + p.ticker + '">' + p.ticker + '</span></td>' +
                '<td style="font-family:Consolas,monospace;">' + p.shares + '</td>' +
                '<td class="col-price">' + snakes(p.avgCostBasis) + '</td>' +
                '<td class="col-price">' + snakes(p.currentPrice) + '</td>' +
                '<td class="col-price">' + snakes(p.currentValue) + '</td>' +
                '<td class="col-change"><span class="' + pCls + '">' +
                    changeSign(p.gainLoss) + snakes(Math.abs(p.gainLoss)) +
                    ' (' + changeSign(p.gainLossPct) + p.gainLossPct.toFixed(1) + '%)' +
                '</span></td>' +
                '<td class="col-div"><span class="' + (monthlyDiv > 0 ? 'gain' : '') + '">' + divText + '</span></td>' +
                '<td class="col-action">' +
                    '<button class="svse-btn-sell-sm" data-action="sell-stock" data-ticker="' + p.ticker + '">' +
                        mdi('cash-minus') + ' Sell' +
                    '</button>' +
                '</td>' +
                '</tr>';
        }
        html += '</tbody></table>';
        el.innerHTML = html;
    }

    // ---- Tab Navigation ----
    function switchTab(tab) {
        currentTab = tab;
        // Update tab styling
        var tabs = document.querySelectorAll('.svse-nav-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.toggle('active', tabs[i].getAttribute('data-tab') === tab);
        }
        // Show/hide content
        var contents = document.querySelectorAll('.svse-tab-content');
        for (var j = 0; j < contents.length; j++) {
            contents[j].classList.remove('active');
        }
        var target = document.getElementById(tab + 'Tab');
        if (target) target.classList.add('active');

        // Render tab content
        if (tab === 'portfolio') renderPortfolio();
    }

    // ---- Navigate to SSJ ----
    function gotoSSJ() {
        var url = 'ssj.ex';
        if (window.elxaOS && window.elxaOS.programs && window.elxaOS.programs.browser) {
            window.elxaOS.programs.browser.navigate(url);
        }
    }

    // ---- Event Delegation ----
    function initEvents() {
        var root = document.querySelector('.svse-root');
        if (!root) return;

        root.addEventListener('click', function(e) {
            var target = e.target;

            // Tab clicks
            var tab = target.closest('.svse-nav-tab');
            if (tab) {
                e.preventDefault();
                switchTab(tab.getAttribute('data-tab'));
                return;
            }

            // Stock row clicks
            var row = target.closest('[data-action="view-stock"]');
            if (row) {
                showStockDetail(row.getAttribute('data-ticker'));
                return;
            }

            // Close detail
            var closeBtn = target.closest('[data-action="close-detail"]');
            if (closeBtn) {
                closeDetail();
                return;
            }

            // Buy stock button (from detail view)
            var buyBtn = target.closest('[data-action="buy-stock"]');
            if (buyBtn) {
                e.stopPropagation();
                showBuyDialog(buyBtn.getAttribute('data-ticker'));
                return;
            }

            // Sell stock button (from detail view)
            var sellBtn = target.closest('[data-action="sell-stock"]');
            if (sellBtn) {
                e.stopPropagation();
                showSellDialog(sellBtn.getAttribute('data-ticker'));
                return;
            }

            // Go to SSJ article
            var ssjLink = target.closest('[data-action="goto-ssj"]');
            if (ssjLink) {
                e.preventDefault();
                e.stopPropagation();
                gotoSSJ();
                return;
            }

            // Close trade dialog
            var closeTrd = target.closest('[data-action="close-trade"]');
            if (closeTrd) {
                closeTrade();
                return;
            }

            // Confirm buy
            var confBuy = target.closest('[data-action="confirm-buy"]');
            if (confBuy && !confBuy.disabled) {
                executeBuy(confBuy.getAttribute('data-ticker'));
                return;
            }

            // Confirm sell
            var confSell = target.closest('[data-action="confirm-sell"]');
            if (confSell && !confSell.disabled) {
                executeSell(confSell.getAttribute('data-ticker'));
                return;
            }

            // Quick quantity buttons
            var qtyBtn = target.closest('[data-action="set-qty"]');
            if (qtyBtn) {
                var input = document.getElementById('tradeQty');
                if (input) {
                    input.value = qtyBtn.getAttribute('data-qty');
                    updateTradeTotal();
                }
                return;
            }
        });

        // Click overlay backgrounds to close
        var overlay = document.getElementById('detailOverlay');
        if (overlay) {
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) closeDetail();
            });
        }

        var tradeOverlay = document.getElementById('tradeOverlay');
        if (tradeOverlay) {
            tradeOverlay.addEventListener('click', function(e) {
                if (e.target === tradeOverlay) closeTrade();
            });
        }

        // Quantity input live update (delegated)
        root.addEventListener('input', function(e) {
            if (e.target.id === 'tradeQty') {
                updateTradeTotal();
            }
        });

        // Filter changes
        var sectorFilter = document.getElementById('filterSector');
        var sortFilter = document.getElementById('filterSort');
        if (sectorFilter) sectorFilter.addEventListener('change', renderMarketTable);
        if (sortFilter) sortFilter.addEventListener('change', renderMarketTable);
    }

    // ---- Init ----
    function init() {
        if (!elxaOS || !elxaOS.stockService) {
            console.warn('SVSE: stockService not available');
            return;
        }
        renderHeaderStats();
        renderTicker();
        populateSectorFilter();
        renderMarketTable();
        initEvents();
        console.log('📈 SVSE website loaded');
    }

    // Auto-init
    init();

    // Public API (for future phases)
    return {
        refresh: function() {
            renderHeaderStats();
            renderTicker();
            renderMarketTable();
            if (currentTab === 'portfolio') renderPortfolio();
        }
    };

})();
