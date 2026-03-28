/* ============================================
   SNAKESIAN CARD EXCHANGE — Shop Logic
   ============================================
   Handles purchasing (via ElxaCorp payment system),
   pack opening, collection storage, and collection viewing.
   ============================================ */

(function() {
  'use strict';

  // Image path — resolved from the ElxaOS root since the browser
  // injects site HTML into the main document's DOM
  var IMAGE_PATH = 'assets/interwebs/snakesian-cards/images/';

  // ==========================================
  // COLLECTION STORAGE
  // ==========================================
  var STORAGE_KEY = 'elxaOS-card-collection';

  function loadCollection() {
    try {
      var data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.warn('Failed to load card collection:', e);
      return {};
    }
  }

  function saveCollection(collection) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
    } catch (e) {
      console.warn('Failed to save card collection:', e);
    }
  }

  function addCardsToCollection(cards) {
    var collection = loadCollection();
    cards.forEach(function(card) {
      if (collection[card.id]) {
        collection[card.id]++;
      } else {
        collection[card.id] = 1;
      }
    });
    saveCollection(collection);
    return collection;
  }

  function getOwnedCount() {
    var collection = loadCollection();
    return Object.keys(collection).length;
  }

  // ==========================================
  // BANK INTEGRATION (for balance display only)
  // ==========================================

  function isBankAvailable() {
    return typeof window.bankSystem !== 'undefined' && window.bankSystem.isLoggedIn;
  }

  function getBankBalance() {
    if (!isBankAvailable()) return null;
    var balances = window.bankSystem.getAccountBalances();
    return balances ? balances.checking : null;
  }

  function updateBalanceDisplay() {
    var el = document.getElementById('sceBalanceDisplay');
    if (!el) return;

    if (isBankAvailable()) {
      var balance = getBankBalance();
      if (balance !== null) {
        el.innerHTML = 'Balance: <strong>$' + balance.toFixed(2) + ' snakes</strong>';
      } else {
        el.innerHTML = 'Balance: <strong>\u2014</strong>';
      }
    } else {
      el.innerHTML = '<span class="sce-balance-warning">Log in to your bank to purchase packs</span>';
    }
  }

  // ==========================================
  // NAVIGATION
  // ==========================================

  // Currently selected series key (null = showing series grid)
  var currentSeries = null;

  function showSection(section) {
    var shopSection = document.getElementById('sceShopSection');
    var collectionSection = document.getElementById('sceCollectionSection');
    var navLinks = document.querySelectorAll('.sce-shop-nav-link');

    navLinks.forEach(function(link) { link.classList.remove('active'); });

    if (section === 'collection') {
      shopSection.style.display = 'none';
      collectionSection.style.display = 'block';
      document.querySelector('[data-section="collection"]').classList.add('active');
      renderCollection();
    } else {
      shopSection.style.display = 'block';
      collectionSection.style.display = 'none';
      document.querySelector('[data-section="shop"]').classList.add('active');
      // Reset to series view when switching back to shop
      showSeriesView();
    }
  }

  // ==========================================
  // SERIES NAVIGATION
  // ==========================================

  function renderSeriesGrid() {
    var grid = document.getElementById('sceSeriesGrid');
    if (!grid) return;

    grid.innerHTML = '';
    SERIES_LIST.forEach(function(series) {
      var card = document.createElement('div');
      card.className = 'sce-series-card';
      card.dataset.series = series.key;
      card.innerHTML =
        '<img class="sce-series-card-img" src="' + series.image + '" alt="' + series.name + '">' +
        '<div class="sce-series-card-info">' +
          '<div class="sce-series-card-name">' + series.name + '</div>' +
          '<div class="sce-series-card-desc">' + series.description + '</div>' +
          '<div class="sce-series-card-count">' + series.cardCount + ' cards in set</div>' +
        '</div>';
      grid.appendChild(card);
    });
  }

  function showSeriesView() {
    currentSeries = null;
    document.getElementById('sceSeriesView').style.display = 'block';
    document.getElementById('scePackView').style.display = 'none';
  }

  function showPackView(seriesKey) {
    var series = SERIES_CONFIG[seriesKey];
    if (!series) return;

    currentSeries = seriesKey;
    document.getElementById('sceSeriesView').style.display = 'none';
    document.getElementById('scePackView').style.display = 'block';
    document.getElementById('scePackViewSeriesName').textContent = series.name;
    document.getElementById('scePackViewSeriesCount').textContent = series.cardCount + ' cards in set';
  }

  // ==========================================
  // PURCHASE FLOW (uses ElxaCorp Payment System)
  // ==========================================

  // Pending pack info — set before opening payment dialog,
  // read when payment-complete event fires
  var pendingPackType = null;
  var pendingPackSeries = null;

  function purchasePack(packType) {
    var config = PACK_CONFIG[packType];
    if (!config) return;

    // Store which pack + series we're buying
    pendingPackType = packType;
    pendingPackSeries = currentSeries;

    var seriesLabel = currentSeries && SERIES_CONFIG[currentSeries] ? SERIES_CONFIG[currentSeries].name + ' ' : '';

    // Use the shared ElxaCorp payment dialog (same as Sssteam)
    purchaseProduct({
      name: 'SCE ' + seriesLabel + config.name,
      price: '$' + config.price.toFixed(2),
      description: config.description,
      isCardPurchase: true,
      cardPurchaseData: {
        packType: packType,
        packName: config.name,
        cardCount: config.cardCount,
        series: currentSeries
      }
    });
  }

  // Listen for successful payment from the payment system
  document.addEventListener('elxa-payment-complete', function(e) {
    var detail = e.detail;
    if (!detail || !detail.isCardPurchase || !detail.cardPurchaseData) return;

    var packType = detail.cardPurchaseData.packType;
    if (!packType) packType = pendingPackType;
    if (!packType) return;

    var series = detail.cardPurchaseData.series || pendingPackSeries;

    var config = PACK_CONFIG[packType];
    if (!config) return;

    // Clear pending
    pendingPackType = null;
    pendingPackSeries = null;

    // Update balance display
    updateBalanceDisplay();

    // Roll cards from the correct series and start pack opening!
    var cards = openPack(packType, series);
    var seriesLabel = series && SERIES_CONFIG[series] ? SERIES_CONFIG[series].name + ' ' : '';
    startPackOpening(cards, seriesLabel + config.name);
  });

  // ==========================================
  // PACK OPENING EXPERIENCE
  // ==========================================

  var currentPackCards = [];
  var revealedCount = 0;

  function startPackOpening(cards, packName) {
    currentPackCards = cards;
    revealedCount = 0;

    var overlay = document.getElementById('sceOpeningOverlay');
    var cardsContainer = document.getElementById('sceOpeningCards');
    var actionsEl = document.getElementById('sceOpeningActions');
    var titleEl = document.getElementById('sceOpeningTitle');

    titleEl.textContent = 'Opening ' + packName + '...';
    actionsEl.style.display = 'none';
    cardsContainer.innerHTML = '';

    // Create face-down cards
    cards.forEach(function(card, index) {
      var cardEl = document.createElement('div');
      cardEl.className = 'sce-opening-card';
      cardEl.dataset.index = index;
      cardEl.dataset.rarity = card.rarity;
      cardEl.innerHTML =
        '<div class="sce-opening-card-inner">' +
          '<div class="sce-opening-card-face sce-opening-card-back">' +
            '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
              '<polygon points="12,1 15.1,8.5 23,9.5 17,15 18.8,23 12,19 5.2,23 7,15 1,9.5 8.9,8.5" ' +
                'fill="#d4a535" stroke="#8b6914" stroke-width="0.8"/>' +
            '</svg>' +
            '<span class="sce-opening-card-back-label">SCE</span>' +
          '</div>' +
          '<div class="sce-opening-card-face sce-opening-card-front" id="sceRevealSlot' + index + '">' +
          '</div>' +
        '</div>';
      cardsContainer.appendChild(cardEl);
    });

    overlay.style.display = 'flex';
  }

  function revealCard(index) {
    var cardEl = document.querySelector('.sce-opening-card[data-index="' + index + '"]');
    if (!cardEl || cardEl.classList.contains('revealed')) return;

    var card = currentPackCards[index];
    var frontSlot = document.getElementById('sceRevealSlot' + index);

    // Render the mini card with correct image path
    var renderedCard = renderCard(card, { imagePath: IMAGE_PATH });
    frontSlot.appendChild(renderedCard);

    // Trigger flip
    cardEl.classList.add('revealed');
    revealedCount++;

    // Update title
    var titleEl = document.getElementById('sceOpeningTitle');
    if (revealedCount < currentPackCards.length) {
      titleEl.textContent = revealedCount + ' / ' + currentPackCards.length + ' revealed \u2014 tap to flip!';
    } else {
      titleEl.textContent = 'All cards revealed!';
      document.getElementById('sceOpeningActions').style.display = 'block';
    }
  }

  function collectCards() {
    addCardsToCollection(currentPackCards);
    currentPackCards = [];
    revealedCount = 0;

    // Close overlay
    document.getElementById('sceOpeningOverlay').style.display = 'none';

    // Update balance
    updateBalanceDisplay();

    showQuickMessage('Cards added to your collection!', 'success');
  }

  // ==========================================
  // DYNAMIC CATEGORY FILTERS
  // ==========================================

  function buildCategoryFilters() {
    var filtersEl = document.getElementById('sceCollectionFilters');
    if (!filtersEl) return;

    // Extract unique categories from the card catalog
    var categories = [];
    var seen = {};
    CARD_CATALOG.forEach(function(card) {
      if (!seen[card.category]) {
        seen[card.category] = true;
        categories.push(card.category);
      }
    });

    // Build buttons: "All" first, then one per category
    var html = '<button class="sce-filter-btn active" data-filter="all">All</button>';
    categories.forEach(function(cat) {
      html += '<button class="sce-filter-btn" data-filter="' + cat + '">' + cat + '</button>';
    });

    filtersEl.innerHTML = html;
  }

  // ==========================================
  // COLLECTION VIEWER
  // ==========================================

  var currentFilter = 'all';

  function renderCollection() {
    var grid = document.getElementById('sceCollectionGrid');
    var collection = loadCollection();

    // Filter cards
    var cards = CARD_CATALOG;
    if (currentFilter !== 'all') {
      cards = cards.filter(function(c) { return c.category === currentFilter; });
    }

    // Sort: owned first, then by rarity
    var rarityOrder = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
    cards = [].concat(cards).sort(function(a, b) {
      var aOwned = collection[a.id] ? 1 : 0;
      var bOwned = collection[b.id] ? 1 : 0;
      if (aOwned !== bOwned) return bOwned - aOwned;
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });

    // Update progress
    var totalCards = CARD_CATALOG.length;
    var ownedCards = getOwnedCount();
    var pct = totalCards > 0 ? Math.round((ownedCards / totalCards) * 100) : 0;
    document.getElementById('sceCollectionCount').textContent = ownedCards + ' / ' + totalCards + ' collected (' + pct + '%)';
    document.getElementById('sceCollectionBarFill').style.width = pct + '%';

    // Render grid
    grid.innerHTML = '';
    cards.forEach(function(card) {
      var owned = collection[card.id] || 0;
      var slot = document.createElement('div');
      slot.className = 'sce-collection-slot ' + (owned ? 'sce-collection-slot--owned' : 'sce-collection-slot--unowned');
      slot.dataset.cardId = card.id;
      slot.dataset.rarity = card.rarity;

      var displayName = owned ? card.name : '???';

      slot.innerHTML =
        (owned > 1 ? '<div class="sce-card__count">&times;' + owned + '</div>' : '') +
        '<div class="sce-collection-slot-inner">' +
          '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
            '<polygon points="12,1 15.1,8.5 23,9.5 17,15 18.8,23 12,19 5.2,23 7,15 1,9.5 8.9,8.5" ' +
              'fill="' + (owned ? '#d4a535' : '#3a2a1a') + '" stroke="' + (owned ? '#8b6914' : '#2a1f14') + '" stroke-width="0.8"/>' +
          '</svg>' +
          '<span class="sce-collection-slot-name">' + displayName + '</span>' +
        '</div>';

      if (owned) {
        slot.addEventListener('click', (function(c, o) {
          return function() { inspectCard(c, o); };
        })(card, owned));
      }

      grid.appendChild(slot);
    });
  }

  function inspectCard(cardData, count) {
    var overlay = document.getElementById('sceInspectOverlay');
    var content = document.getElementById('sceInspectContent');

    content.innerHTML = '';
    // Render the inspected card with correct image path
    var cardEl = renderCard(cardData, { imagePath: IMAGE_PATH, count: count > 1 ? count : undefined });
    content.appendChild(cardEl);

    overlay.style.display = 'flex';
  }

  // ==========================================
  // QUICK MESSAGE
  // ==========================================

  function showQuickMessage(text, type) {
    var existing = document.querySelector('.sce-quick-msg');
    if (existing) existing.remove();

    var msg = document.createElement('div');
    msg.className = 'sce-quick-msg';
    msg.style.cssText =
      'position: fixed; top: 60px; left: 50%; transform: translateX(-50%);' +
      'background: ' + (type === 'warning' ? '#5a2020' : '#2a4a20') + ';' +
      'border: 1px solid ' + (type === 'warning' ? '#8a3030' : '#4a7a30') + ';' +
      'color: ' + (type === 'warning' ? '#f0a0a0' : '#b0e0a0') + ';' +
      'padding: 10px 20px; border-radius: 4px; font-size: 13px;' +
      'z-index: 200; box-shadow: 0 4px 12px rgba(0,0,0,0.4);' +
      'animation: sce-fadeIn 0.2s ease;';
    msg.textContent = text;
    document.querySelector('.sce-shop-root').appendChild(msg);
    setTimeout(function() {
      msg.style.opacity = '0';
      msg.style.transition = 'opacity 0.3s';
      setTimeout(function() { msg.remove(); }, 300);
    }, 2500);
  }

  // ==========================================
  // EVENT DELEGATION
  // ==========================================

  function init() {
    var root = document.querySelector('.sce-shop-root');
    if (!root) return;

    updateBalanceDisplay();
    buildCategoryFilters();
    renderSeriesGrid();

    // Main click handler
    root.addEventListener('click', function(e) {
      // Nav links
      var navLink = e.target.closest('.sce-shop-nav-link');
      if (navLink) {
        showSection(navLink.dataset.section);
        return;
      }

      // Series card click → show packs for that series
      var seriesCard = e.target.closest('.sce-series-card');
      if (seriesCard) {
        showPackView(seriesCard.dataset.series);
        return;
      }

      // Back to series button
      if (e.target.closest('#sceBackToSeries')) {
        showSeriesView();
        return;
      }

      // Pack buy buttons → open payment dialog
      var buyBtn = e.target.closest('.sce-pack-buy');
      if (buyBtn) {
        purchasePack(buyBtn.dataset.pack);
        return;
      }

      // Pack opening — flip a card
      var openingCard = e.target.closest('.sce-opening-card');
      if (openingCard && !openingCard.classList.contains('revealed')) {
        revealCard(parseInt(openingCard.dataset.index));
        return;
      }

      // Collect button
      if (e.target.closest('#sceCollectBtn')) {
        collectCards();
        return;
      }

      // Collection filter buttons
      var filterBtn = e.target.closest('.sce-filter-btn');
      if (filterBtn) {
        document.querySelectorAll('.sce-filter-btn').forEach(function(b) { b.classList.remove('active'); });
        filterBtn.classList.add('active');
        currentFilter = filterBtn.dataset.filter;
        renderCollection();
        return;
      }

      // Close inspect overlay
      if (e.target.closest('.sce-inspect-overlay')) {
        document.getElementById('sceInspectOverlay').style.display = 'none';
        return;
      }
    });

    // Periodically update balance (in case user logs into bank while on this page)
    setInterval(updateBalanceDisplay, 3000);
  }

  // Start when DOM is ready
  init();

})();
