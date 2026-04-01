// =================================
// SSJ — The ScaleStreet Journal
// Financial newspaper, WSJ-inspired
// =================================

var SSJournal = (function() {
    'use strict';

    // ---- Helpers ----
    function mdi(name) {
        return '<span class="mdi mdi-' + name + '"></span>';
    }

    function snakes(usd) {
        var s = Math.round(usd * 2);
        return s.toLocaleString() + ' \u00A7';
    }

    function changeClass(val) {
        if (val > 0) return 'gain';
        if (val < 0) return 'loss';
        return 'neutral';
    }

    function changeSign(val) {
        return val > 0 ? '+' : '';
    }

    function categoryLabel(cat) {
        var labels = {
            company: 'Company News',
            sector: 'Sector Report',
            market: 'Market Watch',
            wildcard: 'Snakesia Today',
            general: 'News'
        };
        return labels[cat] || 'News';
    }

    // ---- Fake Ads ----
    var ADS = [
        { title: 'First Snakesian Bank', text: 'Your savings, our priority. Open a high-yield account today at fsb.ex' },
        { title: 'Pato & Sons Auto', text: 'Life is too short for boring cars. Visit pato.ex' },
        { title: 'Mallard Realty', text: 'Find your dream burrow. Browse listings at mallard.ex' },
        { title: 'Venom Energy', text: 'Cobra Colada. Dangerously Delicious. Available everywhere.' },
        { title: 'Scales & Tails', text: 'New season, new look. Shop the collection at scalestails.ex' },
        { title: 'Hiss Hotels', text: 'Luxury basking. World-class cricket buffets. Book at hisshotels.ex' },
        { title: 'Coil Communications', text: '5G everywhere. Even Dusty Flats. You are welcome.' },
        { title: 'SVSE', text: 'Your money. Your market. Trade at scalestreet.ex' }
    ];

    // ---- Data Access ----
    function getStockService() {
        return window.elxaOS && window.elxaOS.stockService;
    }

    function getNews() {
        var svc = getStockService();
        if (!svc) return [];
        return svc.getRecentNews();
    }

    function getPrices() {
        var svc = getStockService();
        if (!svc) return [];
        return svc.getCurrentPricesSync();
    }

    function getArticle(eventId) {
        if (typeof STOCK_ARTICLES === 'undefined') return null;
        return STOCK_ARTICLES[eventId] || null;
    }

    function getStockData() {
        if (typeof STOCK_DATA === 'undefined') return [];
        return STOCK_DATA;
    }

    // ---- Render: Dateline ----
    function renderDateline() {
        var el = document.getElementById('dateline');
        if (!el) return;
        var d = new Date();
        var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        el.textContent = days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
    }

    // ---- Render: Ticker Strip ----
    function renderTickerStrip() {
        var el = document.getElementById('tickerStrip');
        if (!el) return;
        var prices = getPrices();
        if (prices.length === 0) {
            el.innerHTML = '<span style="color:#888;font-style:italic;">Market data unavailable</span>';
            return;
        }
        var html = '';
        for (var i = 0; i < prices.length; i++) {
            var s = prices[i];
            var cls = changeClass(s.changePct);
            html += '<span class="ssj-ticker-item" data-action="goto-stock" data-ticker="' + s.ticker + '">';
            html += '<span class="ticker-sym">' + s.ticker + '</span>';
            html += '<span class="ticker-price">' + snakes(s.price) + '</span>';
            html += '<span class="' + cls + '">' + changeSign(s.changePct) + s.changePct.toFixed(1) + '%</span>';
            html += '</span>';
        }
        el.innerHTML = html;
    }

    // ---- Build enriched news list (newest first, with articles) ----
    function buildNewsList() {
        var news = getNews();
        var enriched = [];
        for (var i = news.length - 1; i >= 0; i--) {
            var item = news[i];
            var article = getArticle(item.eventId);
            if (!article) continue;
            enriched.push({
                eventId: item.eventId,
                headline: item.headline,
                affects: item.affects || [],
                category: item.category || 'general',
                type: article.type,
                summary: article.summary,
                body: article.body || null,
                byline: article.byline || null
            });
        }
        return enriched;
    }

    // ---- Render impact badges ----
    function renderImpactBadges(affects) {
        if (!affects || affects.length === 0) return '';
        var html = '<div class="story-impact">';
        for (var i = 0; i < affects.length; i++) {
            var a = affects[i];
            var cls = a.impact > 0 ? 'gain' : 'loss';
            var sign = a.impact > 0 ? '+' : '';
            html += '<span class="impact-badge ' + cls + '">' + a.ticker + ' ' + sign + (a.impact * 100).toFixed(0) + '%</span>';
        }
        html += '</div>';
        return html;
    }

    // ---- Render: Main Story ----
    function renderMainStory(feature) {
        var el = document.getElementById('mainStory');
        if (!el) return;
        if (!feature) {
            el.innerHTML = '';
            return;
        }
        var html = '<div class="story-kicker">' + categoryLabel(feature.category) + ' &mdash; Main Story</div>';
        html += '<h2 class="story-headline">' + feature.headline + '</h2>';
        html += '<p class="story-summary">' + feature.summary + '</p>';
        if (feature.byline) {
            html += '<div class="story-byline">By ' + feature.byline + '</div>';
        }
        html += renderImpactBadges(feature.affects);
        html += '<a class="story-read-more" data-action="read-article" data-event="' + feature.eventId + '">Read Full Story &rarr;</a>';
        el.innerHTML = html;
    }

    // ---- Render: Headlines ----
    function renderHeadlines(items) {
        var el = document.getElementById('headlines');
        if (!el) return;
        if (items.length === 0) {
            el.innerHTML = '<div class="ssj-empty">' + mdi('newspaper-variant-outline') + 'No recent news. Check back after the market moves.</div>';
            return;
        }
        var html = '';
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            html += '<div class="ssj-headline-item">';
            html += '<div class="hl-category">' + categoryLabel(item.category) + '</div>';
            html += '<div class="hl-title">' + item.headline + '</div>';
            html += '<p class="hl-summary">' + item.summary + '</p>';

            // Ticker badges
            if (item.affects && item.affects.length > 0) {
                html += '<div class="hl-tickers">';
                for (var j = 0; j < item.affects.length; j++) {
                    var a = item.affects[j];
                    var cls = a.impact > 0 ? 'gain' : 'loss';
                    var sign = a.impact > 0 ? '+' : '';
                    html += '<span class="ticker-badge ' + cls + '" data-action="goto-stock" data-ticker="' + a.ticker + '">';
                    html += a.ticker + ' ' + sign + (a.impact * 100).toFixed(0) + '%';
                    html += '</span>';
                }
                html += '</div>';
            }

            // Read more link for features
            if (item.type === 'feature') {
                html += '<a class="hl-read-more" data-action="read-article" data-event="' + item.eventId + '">Read Full Story &rarr;</a>';
            }

            html += '</div>'; // .ssj-headline-item
        }
        el.innerHTML = html;
    }

    // ---- Render: Market Sidebar ----
    function renderSidebar() {
        renderTopMovers();
        renderMarketSnapshot();
        renderAd();
    }

    function renderTopMovers() {
        var el = document.getElementById('topMovers');
        if (!el) return;
        var prices = getPrices();
        if (prices.length === 0) {
            el.innerHTML = '<div style="color:#888;font-size:12px;">No market data</div>';
            return;
        }

        // Sort by absolute change percent
        var sorted = prices.slice();
        sorted.sort(function(a, b) { return Math.abs(b.changePct) - Math.abs(a.changePct); });

        var top = sorted.slice(0, 6);
        var html = '';
        for (var i = 0; i < top.length; i++) {
            var m = top[i];
            var cls = changeClass(m.changePct);
            html += '<div class="ssj-mover-row" data-action="goto-stock" data-ticker="' + m.ticker + '">';
            html += '<span class="mover-ticker">' + m.ticker + '</span>';
            html += '<span class="mover-price">' + snakes(m.price) + '</span>';
            html += '<span class="mover-change ' + cls + '">' + changeSign(m.changePct) + m.changePct.toFixed(1) + '%</span>';
            html += '</div>';
        }
        el.innerHTML = html;
    }

    function renderMarketSnapshot() {
        var el = document.getElementById('marketSnapshot');
        if (!el) return;
        var prices = getPrices();
        if (prices.length === 0) {
            el.innerHTML = '';
            return;
        }

        // Calculate aggregate stats
        var totalGainers = 0;
        var totalLosers = 0;
        var avgChange = 0;

        for (var i = 0; i < prices.length; i++) {
            var pct = prices[i].changePct || 0;
            avgChange += pct;
            if (pct > 0) totalGainers++;
            else if (pct < 0) totalLosers++;
        }
        avgChange = avgChange / prices.length;
        var avgCls = changeClass(avgChange);

        var html = '';
        html += '<div class="ssj-snapshot-row"><span class="snap-label">Stocks Listed</span><span class="snap-value">' + prices.length + '</span></div>';
        html += '<div class="ssj-snapshot-row"><span class="snap-label">Gainers</span><span class="snap-value gain">' + totalGainers + '</span></div>';
        html += '<div class="ssj-snapshot-row"><span class="snap-label">Losers</span><span class="snap-value loss">' + totalLosers + '</span></div>';
        html += '<div class="ssj-snapshot-row"><span class="snap-label">Avg Change</span><span class="snap-value ' + avgCls + '">' + changeSign(avgChange) + avgChange.toFixed(1) + '%</span></div>';
        el.innerHTML = html;
    }

    function renderAd() {
        var el = document.getElementById('adContent');
        if (!el) return;
        var ad = ADS[Math.floor(Math.random() * ADS.length)];
        el.innerHTML = '<strong>' + ad.title + '</strong>' + ad.text;
    }

    // ---- Render: Article Detail Page ----
    function showArticle(eventId) {
        var news = getNews();
        var article = getArticle(eventId);
        if (!article || article.type !== 'feature') return;

        // Find the news item for headline + affects
        var newsItem = null;
        for (var i = 0; i < news.length; i++) {
            if (news[i].eventId === eventId) {
                newsItem = news[i];
                break;
            }
        }
        if (!newsItem) return;

        var el = document.getElementById('articleContent');
        if (!el) return;

        var html = '<div class="art-kicker">' + categoryLabel(newsItem.category) + '</div>';
        html += '<h1 class="art-headline">' + newsItem.headline + '</h1>';
        if (article.byline) {
            html += '<div class="art-byline">By ' + article.byline + '</div>';
        }

        // Body paragraphs
        html += '<div class="art-body">';
        if (article.body) {
            var paragraphs = article.body.split('\n\n');
            for (var j = 0; j < paragraphs.length; j++) {
                var p = paragraphs[j].trim();
                if (p) html += '<p>' + p + '</p>';
            }
        } else {
            html += '<p>' + article.summary + '</p>';
        }
        html += '</div>';

        // Market impact callout
        if (newsItem.affects && newsItem.affects.length > 0) {
            html += '<div class="art-impact">';
            html += '<div class="art-impact-title">Market Impact</div>';
            html += '<div class="art-impact-list">';
            for (var k = 0; k < newsItem.affects.length; k++) {
                var a = newsItem.affects[k];
                var cls = a.impact > 0 ? 'gain' : 'loss';
                var sign = a.impact > 0 ? '+' : '';
                html += '<span class="art-impact-badge ' + cls + '">' + a.ticker + ' ' + sign + (a.impact * 100).toFixed(0) + '%</span>';
            }
            html += '</div></div>';
        }

        el.innerHTML = html;
        showPage('articlePage');
    }

    // ---- Page Switching ----
    function showPage(pageId) {
        var pages = document.querySelectorAll('.ssj-page');
        for (var i = 0; i < pages.length; i++) {
            pages[i].classList.remove('active');
        }
        var target = document.getElementById(pageId);
        if (target) target.classList.add('active');
    }

    // ---- Navigate to SVSE ----
    function gotoSVSE(ticker) {
        var url = 'scalestreet.ex';
        if (ticker) url += '#stock-' + ticker;
        if (window.elxaOS && window.elxaOS.programs && window.elxaOS.programs.browser) {
            window.elxaOS.programs.browser.navigate(url);
        }
    }

    // ---- Event Delegation ----
    function initEvents() {
        var root = document.querySelector('.ssj-root');
        if (!root) return;

        root.addEventListener('click', function(e) {
            var target = e.target.closest('[data-action]');
            if (!target) return;

            var action = target.getAttribute('data-action');

            switch (action) {
                case 'read-article':
                    var eventId = target.getAttribute('data-event');
                    if (eventId) showArticle(eventId);
                    break;

                case 'back-to-front':
                    showPage('frontPage');
                    break;

                case 'goto-svse':
                    e.preventDefault();
                    gotoSVSE();
                    break;

                case 'goto-stock':
                    var ticker = target.getAttribute('data-ticker');
                    if (ticker) gotoSVSE(ticker);
                    break;
            }
        });
    }

    // ---- Main Render ----
    function renderFrontPage() {
        var items = buildNewsList();

        // Find the most recent feature for main story
        var mainFeature = null;
        var headlineItems = [];

        for (var i = 0; i < items.length; i++) {
            if (!mainFeature && items[i].type === 'feature') {
                mainFeature = items[i];
            } else {
                headlineItems.push(items[i]);
            }
        }

        renderMainStory(mainFeature);
        renderHeadlines(headlineItems);
        renderSidebar();
    }

    // ---- Init ----
    function init() {
        renderDateline();
        renderTickerStrip();
        renderFrontPage();
        initEvents();
    }

    // Run init
    init();

    // Public API (for debug)
    return {
        refresh: function() {
            renderTickerStrip();
            renderFrontPage();
        }
    };

})();
