// =================================
// STOCK SERVICE — Snake Valley Stock Exchange Simulation Engine
// =================================
// Simulates a stock market with 14 companies. Prices update monthly
// during boot (same cadence as finance cycle). Each stock has a
// slow-drifting trend bias and random volatility. News events
// (Phase 2) apply one-time price shocks.
//
// STORAGE: Registry user state under `stocks.*`
// EVENTS:  stocks.pricesUpdated, stocks.newsEvent, stocks.dividendPaid
//
// USAGE:
//   elxaOS.stockService.getCurrentPricesSync()
//   elxaOS.stockService.getStockDetail('ELXA')
//   elxaOS.stockService.getPortfolioSync()
// =================================

// Price floor — stocks can't go below $1
var STOCK_PRICE_FLOOR = 1.00;

// Max months of price history to keep per stock (for sparklines)
var STOCK_HISTORY_LENGTH = 12;

// Max recent news entries to keep
var STOCK_NEWS_LOG_MAX = 15;

// Trend drift clamp — prevents runaway bull/bear
var STOCK_TREND_MIN = -0.05;
var STOCK_TREND_MAX = 0.05;

// Chance of a news event firing per simulated month (0-1)
var STOCK_NEWS_CHANCE = 0.30;

class StockService {
    constructor(eventBus, registry, financeService, inventoryService) {
        this.eventBus = eventBus;
        this.registry = registry;
        this.financeService = financeService;
        this.inventoryService = inventoryService;

        this._prices = {};      // { TICKER: { price, trend, history[], dividendRate } }
        this._news = [];        // recent news log
        this._lastProcessedMonth = null;
        this._ready = false;

        console.log('📈 StockService initialized');
    }

    // =================================
    // LIFECYCLE
    // =================================

    async init() {
        try {
            var saved = await this.registry.getState('stocks');
            if (saved && saved.prices && Object.keys(saved.prices).length > 0) {
                this._prices = saved.prices;
                this._news = saved.news || [];
                this._lastProcessedMonth = saved.lastProcessedMonth || null;
                console.log('📈 Stock data loaded from registry (' + Object.keys(this._prices).length + ' stocks)');
            } else {
                // First run — seed from STOCK_DEFINITIONS
                this._seedFromDefaults();
                console.log('📈 Stock data seeded from defaults (' + STOCK_DEFINITIONS.length + ' stocks)');
            }

            this._ready = true;
            this.debug = this._getDebugTools();

            // Process elapsed months (like finance cycle)
            this._processElapsedMonths();

        } catch (err) {
            console.error('📈 StockService init error:', err);
            this._seedFromDefaults();
            this._ready = true;
            this.debug = this._getDebugTools();
        }
    }

    _seedFromDefaults() {
        this._prices = {};
        for (var i = 0; i < STOCK_DEFINITIONS.length; i++) {
            var def = STOCK_DEFINITIONS[i];
            this._prices[def.ticker] = {
                price: def.startingPrice,
                trend: 0,
                history: [def.startingPrice],
                dividendRate: def.dividendRate
            };
        }
        this._news = [];

        // Simulate a few months of history so sparklines and news aren't empty on first boot
        this._seedInitialHistory();

        this._lastProcessedMonth = this._getCurrentMonthKey();
        this._save();
    }

    /**
     * Runs 3 simulated months of price changes + guarantees 2-3 starter news events.
     * Called only on first-ever boot so the market feels alive from the start.
     */
    _seedInitialHistory() {
        // Run 3 months of price simulation (no dividends/big-move checks — user has no portfolio yet)
        for (var m = 0; m < 3; m++) {
            var tickers = Object.keys(this._prices);
            for (var t = 0; t < tickers.length; t++) {
                var ticker = tickers[t];
                var stock = this._prices[ticker];
                var def = this._getDefinition(ticker);
                if (!def) continue;

                stock.trend += (Math.random() - 0.5) * 0.01;
                stock.trend = Math.max(STOCK_TREND_MIN, Math.min(STOCK_TREND_MAX, stock.trend));

                var random = (Math.random() * 2 - 1);
                var change = stock.trend + (random * def.volatility);
                var newPrice = Math.max(STOCK_PRICE_FLOOR, stock.price * (1 + change));
                stock.price = Math.round(newPrice * 100) / 100;
                stock.history.push(stock.price);
            }
        }

        // Guarantee 2-3 news events from the pool so SSJ has content
        if (typeof STOCK_NEWS_EVENTS !== 'undefined' && STOCK_NEWS_EVENTS && STOCK_NEWS_EVENTS.length > 0) {
            var pool = STOCK_NEWS_EVENTS.slice();
            // Shuffle
            for (var s = pool.length - 1; s > 0; s--) {
                var r = Math.floor(Math.random() * (s + 1));
                var tmp = pool[s]; pool[s] = pool[r]; pool[r] = tmp;
            }
            var seedCount = Math.min(3, pool.length);
            for (var n = 0; n < seedCount; n++) {
                var evt = pool[n];
                // Apply price impacts
                if (evt.affects) {
                    for (var a = 0; a < evt.affects.length; a++) {
                        var affect = evt.affects[a];
                        var sd = this._prices[affect.ticker];
                        if (sd) {
                            sd.price = Math.max(STOCK_PRICE_FLOOR, sd.price * (1 + affect.impact));
                            sd.price = Math.round(sd.price * 100) / 100;
                        }
                    }
                }
                this._news.push({
                    eventId: evt.id,
                    headline: evt.headline,
                    affects: evt.affects || [],
                    category: evt.category || 'general'
                });
            }
        }

        console.log('📈 Seeded ' + (Object.keys(this._prices).length) + ' stocks with 3 months history + ' + this._news.length + ' news events');
    }

    _getCurrentMonthKey() {
        var now = new Date();
        var y = now.getFullYear();
        var m = now.getMonth() + 1;
        return y + '-' + (m < 10 ? '0' + m : '' + m);
    }

    async _save() {
        try {
            await this.registry.setState('stocks', {
                prices: this._prices,
                news: this._news,
                lastProcessedMonth: this._lastProcessedMonth
            });
        } catch (err) {
            console.error('📈 StockService save error:', err);
        }
    }

    // =================================
    // ELAPSED MONTH PROCESSING
    // =================================

    _processElapsedMonths() {
        var currentMonth = this._getCurrentMonthKey();
        if (!this._lastProcessedMonth) {
            this._lastProcessedMonth = currentMonth;
            this._save();
            return;
        }

        var elapsed = this._monthsBetween(this._lastProcessedMonth, currentMonth);
        if (elapsed <= 0) return;

        console.log('📈 Stock market: ' + elapsed + ' month(s) elapsed since ' + this._lastProcessedMonth);

        for (var i = 0; i < elapsed; i++) {
            this._runSingleMonth();
        }

        this._lastProcessedMonth = currentMonth;
        this._save();

        this.eventBus.emit('stocks.pricesUpdated', {
            monthsProcessed: elapsed,
            prices: this.getCurrentPricesSync()
        });

        console.log('📈 Stock market processed ' + elapsed + ' month(s)');
    }

    _monthsBetween(fromKey, toKey) {
        var fromParts = fromKey.split('-');
        var toParts = toKey.split('-');
        var fromYear = parseInt(fromParts[0], 10);
        var fromMonth = parseInt(fromParts[1], 10);
        var toYear = parseInt(toParts[0], 10);
        var toMonth = parseInt(toParts[1], 10);
        return (toYear - fromYear) * 12 + (toMonth - fromMonth);
    }

    // =================================
    // SINGLE MONTH SIMULATION
    // =================================

    _runSingleMonth() {
        var tickers = Object.keys(this._prices);

        // 1. Process each stock's price
        for (var i = 0; i < tickers.length; i++) {
            var ticker = tickers[i];
            var stock = this._prices[ticker];
            var def = this._getDefinition(ticker);
            if (!def) continue;

            // Trend drift: slight random shift each month
            stock.trend += (Math.random() - 0.5) * 0.01;
            stock.trend = Math.max(STOCK_TREND_MIN, Math.min(STOCK_TREND_MAX, stock.trend));

            // Price change: trend + random * volatility
            var random = (Math.random() * 2 - 1);
            var change = stock.trend + (random * def.volatility);
            var newPrice = stock.price * (1 + change);

            // Floor at $1
            newPrice = Math.max(STOCK_PRICE_FLOOR, newPrice);

            // Round to 2 decimal places
            stock.price = Math.round(newPrice * 100) / 100;

            // Push to history, trim to max length
            stock.history.push(stock.price);
            if (stock.history.length > STOCK_HISTORY_LENGTH) {
                stock.history = stock.history.slice(-STOCK_HISTORY_LENGTH);
            }
        }

        // 2. Roll for news event (Phase 2 will populate STOCK_NEWS_EVENTS)
        this._rollNewsEvent();

        // 3. Process dividends for held stocks
        this._processDividends();

        // 4. Check for big moves on held stocks (>15%)
        this._checkBigMoves();
    }

    // =================================
    // NEWS EVENT ROLL
    // =================================

    _rollNewsEvent() {
        // Only fire if news events are loaded (Phase 2)
        if (typeof STOCK_NEWS_EVENTS === 'undefined' || !STOCK_NEWS_EVENTS || STOCK_NEWS_EVENTS.length === 0) {
            return;
        }

        // 30% chance per month
        if (Math.random() > STOCK_NEWS_CHANCE) return;

        // Filter out events on cooldown
        var now = this._news.length; // use news log length as rough "time" index
        var available = [];
        for (var i = 0; i < STOCK_NEWS_EVENTS.length; i++) {
            var evt = STOCK_NEWS_EVENTS[i];
            var onCooldown = false;
            for (var j = 0; j < this._news.length; j++) {
                if (this._news[j].eventId === evt.id) {
                    var age = now - j;
                    if (age < (evt.cooldown || 6)) {
                        onCooldown = true;
                        break;
                    }
                }
            }
            if (!onCooldown) available.push(evt);
        }

        if (available.length === 0) return;

        // Pick a random event
        var picked = available[Math.floor(Math.random() * available.length)];

        // Apply price impacts
        if (picked.affects) {
            for (var k = 0; k < picked.affects.length; k++) {
                var affect = picked.affects[k];
                var stockData = this._prices[affect.ticker];
                if (stockData) {
                    var oldPrice = stockData.price;
                    stockData.price = Math.max(STOCK_PRICE_FLOOR, stockData.price * (1 + affect.impact));
                    stockData.price = Math.round(stockData.price * 100) / 100;
                    console.log('📰 News impact: ' + affect.ticker + ' ' + (affect.impact > 0 ? '+' : '') + (affect.impact * 100).toFixed(1) + '% ($' + oldPrice.toFixed(2) + ' → $' + stockData.price.toFixed(2) + ')');
                }
            }
        }

        // Log the event
        this._news.push({
            eventId: picked.id,
            headline: picked.headline,
            affects: picked.affects || [],
            category: picked.category || 'general'
        });

        // Trim log
        if (this._news.length > STOCK_NEWS_LOG_MAX) {
            this._news = this._news.slice(-STOCK_NEWS_LOG_MAX);
        }

        this.eventBus.emit('stocks.newsEvent', {
            eventId: picked.id,
            headline: picked.headline,
            affects: picked.affects
        });

        console.log('📰 News event: ' + picked.headline);
    }

    // =================================
    // DIVIDEND PROCESSING
    // =================================

    _processDividends() {
        if (!this.inventoryService || !this.inventoryService._ready) return;
        if (!this.financeService || !this.financeService._ready) return;

        var holdings = this.inventoryService.getStocks();
        if (!holdings || holdings.length === 0) return;

        var totalDividends = 0;
        var breakdown = []; // per-stock dividend info for notifications

        for (var i = 0; i < holdings.length; i++) {
            var holding = holdings[i];
            var stockData = this._prices[holding.ticker];
            if (!stockData || !stockData.dividendRate || stockData.dividendRate <= 0) continue;

            var payout = stockData.dividendRate * stockData.price * holding.shares;
            payout = Math.round(payout * 100) / 100;

            if (payout > 0) {
                this.financeService._depositDirect('checking', payout, 'Dividend: ' + holding.ticker);
                totalDividends += payout;
                breakdown.push({
                    ticker: holding.ticker,
                    companyName: holding.companyName,
                    shares: holding.shares,
                    price: stockData.price,
                    rate: stockData.dividendRate,
                    payout: payout
                });
            }
        }

        if (totalDividends > 0) {
            this.eventBus.emit('stocks.dividendPaid', {
                total: totalDividends,
                breakdown: breakdown
            });
            console.log('💰 Dividends paid: $' + totalDividends.toFixed(2) + ' from ' + breakdown.length + ' stock(s)');
        }
    }

    // =================================
    // BIG MOVE DETECTION (held stocks)
    // =================================

    _checkBigMoves() {
        if (!this.inventoryService || !this.inventoryService._ready) return;

        var holdings = this.inventoryService.getStocks();
        if (!holdings || holdings.length === 0) return;

        for (var i = 0; i < holdings.length; i++) {
            var holding = holdings[i];
            var stockData = this._prices[holding.ticker];
            if (!stockData || stockData.history.length < 2) continue;

            var prevPrice = stockData.history[stockData.history.length - 2];
            var curPrice = stockData.price;
            var changePct = prevPrice > 0 ? ((curPrice - prevPrice) / prevPrice) * 100 : 0;

            if (Math.abs(changePct) >= 15) {
                var def = this._getDefinition(holding.ticker);
                this.eventBus.emit('stocks.bigMove', {
                    ticker: holding.ticker,
                    companyName: def ? def.name : holding.companyName,
                    shares: holding.shares,
                    prevPrice: prevPrice,
                    currentPrice: curPrice,
                    changePct: Math.round(changePct * 100) / 100,
                    direction: changePct > 0 ? 'up' : 'down',
                    currentValue: Math.round(curPrice * holding.shares * 100) / 100,
                    valueChange: Math.round((curPrice - prevPrice) * holding.shares * 100) / 100
                });
                console.log('📊 Big move alert: ' + holding.ticker + ' ' + (changePct > 0 ? '+' : '') + changePct.toFixed(1) + '%');
            }
        }
    }

    // =================================
    // GETTERS — SYNC (for interwebs sites)
    // =================================

    getCurrentPricesSync() {
        var result = [];
        var defs = STOCK_DEFINITIONS;
        for (var i = 0; i < defs.length; i++) {
            var def = defs[i];
            var data = this._prices[def.ticker];
            if (!data) continue;

            var prevPrice = data.history.length >= 2 ? data.history[data.history.length - 2] : data.price;
            var change = data.price - prevPrice;
            var changePct = prevPrice > 0 ? (change / prevPrice) * 100 : 0;

            result.push({
                ticker: def.ticker,
                name: def.name,
                sector: def.sector,
                price: data.price,
                change: Math.round(change * 100) / 100,
                changePct: Math.round(changePct * 100) / 100,
                history: data.history.slice(),
                dividendRate: data.dividendRate || 0,
                description: def.description
            });
        }
        return result;
    }

    async getCurrentPrices() {
        return this.getCurrentPricesSync();
    }

    getStockDetail(ticker) {
        var def = this._getDefinition(ticker);
        var data = this._prices[ticker];
        if (!def || !data) return null;

        var prevPrice = data.history.length >= 2 ? data.history[data.history.length - 2] : data.price;
        var change = data.price - prevPrice;
        var changePct = prevPrice > 0 ? (change / prevPrice) * 100 : 0;

        // Get recent news affecting this stock
        var relevantNews = [];
        for (var i = 0; i < this._news.length; i++) {
            var newsItem = this._news[i];
            if (newsItem.affects) {
                for (var j = 0; j < newsItem.affects.length; j++) {
                    if (newsItem.affects[j].ticker === ticker) {
                        relevantNews.push(newsItem);
                        break;
                    }
                }
            }
        }

        return {
            ticker: def.ticker,
            name: def.name,
            sector: def.sector,
            price: data.price,
            change: Math.round(change * 100) / 100,
            changePct: Math.round(changePct * 100) / 100,
            history: data.history.slice(),
            dividendRate: data.dividendRate || 0,
            volatility: def.volatility,
            description: def.description,
            trend: data.trend,
            recentNews: relevantNews
        };
    }

    // =================================
    // PORTFOLIO (enriched from inventory)
    // =================================

    getPortfolioSync() {
        if (!this.inventoryService || !this.inventoryService._ready) return [];

        var holdings = this.inventoryService.getStocks();
        var result = [];

        for (var i = 0; i < holdings.length; i++) {
            var holding = holdings[i];
            var stockData = this._prices[holding.ticker];
            if (!stockData) continue;

            var currentValue = stockData.price * holding.shares;
            var gainLoss = currentValue - holding.totalInvested;
            var gainLossPct = holding.totalInvested > 0 ? (gainLoss / holding.totalInvested) * 100 : 0;

            result.push({
                ticker: holding.ticker,
                companyName: holding.companyName,
                shares: holding.shares,
                avgCostBasis: holding.avgCostBasis,
                totalInvested: holding.totalInvested,
                currentPrice: stockData.price,
                currentValue: Math.round(currentValue * 100) / 100,
                gainLoss: Math.round(gainLoss * 100) / 100,
                gainLossPct: Math.round(gainLossPct * 100) / 100,
                dividendRate: stockData.dividendRate || 0,
                history: stockData.history.slice()
            });
        }

        return result;
    }

    async getPortfolio() {
        return this.getPortfolioSync();
    }

    // =================================
    // NEWS GETTERS
    // =================================

    getRecentNews() {
        return this._news.slice();
    }

    getTodaysHeadlines() {
        // Return just headline strings from most recent events (for LLM context)
        var headlines = [];
        var recent = this._news.slice(-5);
        for (var i = 0; i < recent.length; i++) {
            headlines.push(recent[i].headline);
        }
        return headlines;
    }

    // =================================
    // PORTFOLIO SUMMARY (for LLM context)
    // =================================

    getPortfolioSummary() {
        var portfolio = this.getPortfolioSync();
        if (portfolio.length === 0) return 'No stock holdings.';

        var totalValue = 0;
        var totalInvested = 0;
        var lines = [];

        for (var i = 0; i < portfolio.length; i++) {
            var p = portfolio[i];
            totalValue += p.currentValue;
            totalInvested += p.totalInvested;
            var sign = p.gainLoss >= 0 ? '+' : '';
            lines.push(p.ticker + ': ' + p.shares + ' shares @ $' + p.currentPrice.toFixed(2) + ' (' + sign + p.gainLossPct.toFixed(1) + '%)');
        }

        var totalGainLoss = totalValue - totalInvested;
        var totalPct = totalInvested > 0 ? ((totalGainLoss / totalInvested) * 100).toFixed(1) : '0.0';
        var sign = totalGainLoss >= 0 ? '+' : '';

        return 'Stock portfolio: $' + totalValue.toFixed(2) + ' total (' + sign + totalPct + '%). Holdings: ' + lines.join(', ');
    }

    // =================================
    // HELPERS
    // =================================

    _getDefinition(ticker) {
        for (var i = 0; i < STOCK_DEFINITIONS.length; i++) {
            if (STOCK_DEFINITIONS[i].ticker === ticker) return STOCK_DEFINITIONS[i];
        }
        return null;
    }

    getStockPrice(ticker) {
        var data = this._prices[ticker];
        return data ? data.price : null;
    }

    getStockPriceSync(ticker) {
        return this.getStockPrice(ticker);
    }

    getTopMovers(count) {
        count = count || 5;
        var prices = this.getCurrentPricesSync();
        // Sort by absolute change %
        prices.sort(function(a, b) {
            return Math.abs(b.changePct) - Math.abs(a.changePct);
        });
        return prices.slice(0, count);
    }

    getTopGainers(count) {
        count = count || 5;
        var prices = this.getCurrentPricesSync();
        prices.sort(function(a, b) { return b.changePct - a.changePct; });
        return prices.filter(function(s) { return s.changePct > 0; }).slice(0, count);
    }

    getTopLosers(count) {
        count = count || 5;
        var prices = this.getCurrentPricesSync();
        prices.sort(function(a, b) { return a.changePct - b.changePct; });
        return prices.filter(function(s) { return s.changePct < 0; }).slice(0, count);
    }

    // =================================
    // DEBUG TOOLS
    // =================================

    _getDebugTools() {
        var self = this;
        return {
            prices() {
                console.table(self.getCurrentPricesSync().map(function(s) {
                    return {
                        ticker: s.ticker,
                        name: s.name,
                        price: '$' + s.price.toFixed(2),
                        change: (s.changePct >= 0 ? '+' : '') + s.changePct.toFixed(1) + '%',
                        dividend: s.dividendRate > 0 ? (s.dividendRate * 100).toFixed(1) + '%/mo' : 'none'
                    };
                }));
            },

            advanceMonth(months) {
                months = months || 1;
                for (var i = 0; i < months; i++) {
                    self._runSingleMonth();
                }
                self._save();
                console.log('📈 Advanced ' + months + ' month(s). New prices:');
                this.prices();
            },

            setPrice(ticker, price) {
                if (self._prices[ticker]) {
                    self._prices[ticker].price = price;
                    self._save();
                    console.log('📈 Set ' + ticker + ' to $' + price.toFixed(2));
                } else {
                    console.warn('📈 Unknown ticker: ' + ticker);
                }
            },

            portfolio() {
                var p = self.getPortfolioSync();
                if (p.length === 0) {
                    console.log('📈 No stock holdings.');
                    return;
                }
                console.table(p.map(function(h) {
                    return {
                        ticker: h.ticker,
                        shares: h.shares,
                        avgCost: '$' + h.avgCostBasis.toFixed(2),
                        current: '$' + h.currentPrice.toFixed(2),
                        value: '$' + h.currentValue.toFixed(2),
                        gainLoss: (h.gainLoss >= 0 ? '+$' : '-$') + Math.abs(h.gainLoss).toFixed(2) + ' (' + h.gainLossPct.toFixed(1) + '%)'
                    };
                }));
            },

            news() {
                var n = self.getRecentNews();
                if (n.length === 0) {
                    console.log('📰 No recent news events.');
                    return;
                }
                console.table(n.map(function(item) {
                    return {
                        event: item.eventId,
                        headline: item.headline.substring(0, 60) + '...',
                        category: item.category
                    };
                }));
            },

            triggerEvent(eventId) {
                if (typeof STOCK_NEWS_EVENTS === 'undefined') {
                    console.warn('📰 No news events loaded (Phase 2)');
                    return;
                }
                var evt = null;
                for (var i = 0; i < STOCK_NEWS_EVENTS.length; i++) {
                    if (STOCK_NEWS_EVENTS[i].id === eventId) {
                        evt = STOCK_NEWS_EVENTS[i];
                        break;
                    }
                }
                if (!evt) {
                    console.warn('📰 Unknown event ID: ' + eventId);
                    return;
                }
                // Apply impacts manually
                if (evt.affects) {
                    for (var j = 0; j < evt.affects.length; j++) {
                        var affect = evt.affects[j];
                        var stockData = self._prices[affect.ticker];
                        if (stockData) {
                            stockData.price = Math.max(STOCK_PRICE_FLOOR, stockData.price * (1 + affect.impact));
                            stockData.price = Math.round(stockData.price * 100) / 100;
                        }
                    }
                }
                self._news.push({
                    eventId: evt.id,
                    headline: evt.headline,
                    affects: evt.affects || [],
                    category: evt.category || 'general'
                });
                self._save();
                console.log('📰 Triggered: ' + evt.headline);
                this.prices();
            },

            reset() {
                console.warn('📈 Resetting all stock data to defaults!');
                self._seedFromDefaults();
            }
        };
    }
}
