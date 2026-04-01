/* ============================================
   SNAKESIAN CARD EXCHANGE — Card Renderer
   ============================================
   Renders a card element from catalog data.
   
   Usage:
     const el = renderCard(cardData);
     container.appendChild(el);
   
   Card data shape:
     {
       id: "pushing_cat_001",
       name: "Pushing Cat",
       rarity: "common",          // common | uncommon | rare | epic | legendary
       category: "Pushing Cat",
       type: "Creature — Cat",
       flavor: "Just a regular cat...",
       image: "pushing_cat.png",  // filename in images/sets/{SET}/ folder (or null)
       stats: { atk: 2, hp: 3, spd: 1 },
       set: "SCE",
       number: "001"
     }
   ============================================ */

var RARITY_STARS = {
  common: '★',
  uncommon: '★★',
  rare: '★★★',
  epic: '★★★★',
  legendary: '★★★★★'
};

var STAT_ICONS = {
  atk: `<svg class="sce-card__stat-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="8,1 10,6 15.5,6.5 11.5,10 12.8,15.5 8,12.5 3.2,15.5 4.5,10 0.5,6.5 6,6" fill="#b8860b" opacity="0.7"/>
  </svg>`,
  hp: `<svg class="sce-card__stat-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 14s-5.5-3.5-5.5-7.5C2.5 3.5 5 2 8 5c3-3 5.5-1.5 5.5 1.5S8 14 8 14z" fill="#c05050" opacity="0.7"/>
  </svg>`,
  spd: `<svg class="sce-card__stat-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2v9M5 8l3 3 3-3" stroke="#5080a0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`
};

/**
 * Render a single card element from card data.
 * @param {Object} cardData - Card catalog entry
 * @param {Object} [options] - Rendering options
 * @param {boolean} [options.silhouette=false] - Render as unowned silhouette
 * @param {number} [options.count] - Owned count badge (omit to hide)
 * @param {string} [options.imagePath='images/'] - Path prefix for card art images
 * @returns {HTMLElement} The card DOM element
 */
function renderCard(cardData, options = {}) {
  const {
    silhouette = false,
    count,
    imagePath = 'images/'
  } = options;

  const card = document.createElement('div');
  card.className = `sce-card sce-card--${cardData.rarity}${silhouette ? ' sce-card--silhouette' : ''}`;
  card.dataset.cardId = cardData.id;
  card.dataset.rarity = cardData.rarity;

  // Art content: image or placeholder
  // Images live in sets/{SET_KEY}/ subfolders (e.g. images/sets/SCE/rita_001.png)
  const artContent = cardData.image
    ? `<img src="${imagePath}sets/${cardData.set}/${cardData.image}" alt="${cardData.name}" loading="lazy">`
    : `<span class="sce-card__art-placeholder">[ ${cardData.name} ]</span>`;

  // Stats
  const statsHtml = ['atk', 'hp', 'spd'].map(stat => `
    <div class="sce-card__stat">
      ${STAT_ICONS[stat]}
      <span class="sce-card__stat-val">${cardData.stats[stat]}</span>
    </div>
  `).join('');

  // Count badge (for collection viewer)
  const countBadge = (count !== undefined && count > 0)
    ? `<div class="sce-card__count">×${count}</div>`
    : '';

  card.innerHTML = `
    ${countBadge}
    <div class="sce-card__frame">
      <div class="sce-card__body">
        <div class="sce-card__header">
          <span class="sce-card__name">${cardData.name}</span>
          <span class="sce-card__set">${cardData.set}</span>
        </div>
        <div class="sce-card__art-wrap">
          <div class="sce-card__art">
            ${artContent}
          </div>
          <div class="sce-card__gem">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <polygon class="gem-fill" 
                points="12,1 15.1,8.5 23,9.5 17,15 18.8,23 12,19 5.2,23 7,15 1,9.5 8.9,8.5"
                fill="var(--gem-1)" stroke="var(--gem-2)" stroke-width="0.8"/>
            </svg>
          </div>
        </div>
        <div class="sce-card__type-bar">
          <span class="sce-card__type">${cardData.type}</span>
          <span class="sce-card__stars">${RARITY_STARS[cardData.rarity]}</span>
        </div>
        <div class="sce-card__text">
          <span class="sce-card__flavor">"${cardData.flavor}"</span>
        </div>
        <div class="sce-card__stats">
          ${statsHtml}
        </div>
        <div class="sce-card__footer">
          <span class="sce-card__number">${cardData.set}-${cardData.number}</span>
          <span class="sce-card__exchange">Snakesian Card Exchange</span>
        </div>
      </div>
    </div>
  `;

  return card;
}

/**
 * Render multiple cards into a container.
 * @param {HTMLElement} container - Target container element
 * @param {Array} cards - Array of card data objects
 * @param {Object} [options] - Options passed to each renderCard call
 */
function renderCards(container, cards, options = {}) {
  container.innerHTML = '';
  cards.forEach(cardData => {
    container.appendChild(renderCard(cardData, options));
  });
}

/**
 * Get a card from the catalog by ID.
 * @param {string} id - Card ID
 * @returns {Object|undefined} Card data or undefined
 */
function getCard(id) {
  return CARD_CATALOG.find(c => c.id === id);
}

/**
 * Get all cards of a specific rarity.
 * @param {string} rarity - Rarity tier
 * @returns {Array} Matching cards
 */
function getCardsByRarity(rarity) {
  return CARD_CATALOG.filter(c => c.rarity === rarity);
}

/**
 * Get all cards in a specific category.
 * @param {string} category - Category name
 * @returns {Array} Matching cards
 */
function getCardsByCategory(category) {
  return CARD_CATALOG.filter(c => c.category === category);
}
