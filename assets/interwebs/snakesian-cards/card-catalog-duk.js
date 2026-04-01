/* ============================================
   SNAKESIAN CARD EXCHANGE — DUK Series Catalog
   ============================================
   The Ducks of Snakesia — a beloved flock of
   waterfowl who've made Snakesia their home.
   
   Loads AFTER card-catalog.js and appends to
   CARD_CATALOG, SERIES_CONFIG, and SERIES_LIST.
   ============================================ */

var DUK_CARDS = [

  // ==========================================
  // COMMON (3 cards)
  // ==========================================
  {
    id: "duk_001",
    name: "Pond Patrol",
    rarity: "common",
    category: "Ducks of Snakesia",
    type: "Creature — Duck",
    flavor: "Every morning, same route. Every morning, the pond is exactly how he left it. He checks anyway.",
    image: "1.png",
    stats: { atk: 1, hp: 3, spd: 2 },
    set: "DUK",
    number: "001"
  },
  {
    id: "duk_002",
    name: "Breadcrumb Bandit",
    rarity: "common",
    category: "Ducks of Snakesia",
    type: "Creature — Duck",
    flavor: "You threw one piece. Now there are forty ducks. This is your life now.",
    image: "2.png",
    stats: { atk: 2, hp: 2, spd: 2 },
    set: "DUK",
    number: "002"
  },
  {
    id: "duk_003",
    name: "Naptime Navigator",
    rarity: "common",
    category: "Ducks of Snakesia",
    type: "Creature — Duck",
    flavor: "Fell asleep on the water. Drifted two miles downstream. Woke up in a different zip code. Unbothered.",
    image: "3.png",
    stats: { atk: 1, hp: 3, spd: 1 },
    set: "DUK",
    number: "003"
  },

  // ==========================================
  // UNCOMMON (4 cards)
  // ==========================================
  {
    id: "duk_004",
    name: "Sharp Dresser",
    rarity: "uncommon",
    category: "Ducks of Snakesia",
    type: "Creature — Duck",
    flavor: "The bowtie is real. The confidence is earned. The strut is copyrighted.",
    image: "4.png",
    stats: { atk: 2, hp: 4, spd: 2 },
    set: "DUK",
    number: "004"
  },
  {
    id: "duk_005",
    name: "Takeoff!",
    rarity: "uncommon",
    category: "Ducks of Snakesia",
    type: "Creature — Duck",
    flavor: "Wings out. Feet slapping water. Twelve seconds of pure chaos before achieving liftoff. Majestic? Debatable.",
    image: "5.png",
    stats: { atk: 2, hp: 3, spd: 4 },
    set: "DUK",
    number: "005"
  },
  {
    id: "duk_006",
    name: "The Lookout",
    rarity: "uncommon",
    category: "Ducks of Snakesia",
    type: "Creature — Duck",
    flavor: "Sees everything. Reports nothing. Has opinions about all of it.",
    image: "6.png",
    stats: { atk: 2, hp: 4, spd: 3 },
    set: "DUK",
    number: "006"
  },
  {
    id: "duk_007",
    name: "Dusk Drifter",
    rarity: "uncommon",
    category: "Ducks of Snakesia",
    type: "Creature — Duck",
    flavor: "When the sun sets over Lake Denali, the ducks own the water. No one disputes this.",
    image: "7.png",
    stats: { atk: 3, hp: 3, spd: 3 },
    set: "DUK",
    number: "007"
  },

  // ==========================================
  // RARE (3 cards)
  // ==========================================
  {
    id: "duk_008",
    name: "Storm Chaser",
    rarity: "rare",
    category: "Ducks of Snakesia",
    type: "Creature — Duck",
    flavor: "Rain? Wind? Thunder? He's been through worse. He once survived bath time with a toddler.",
    image: "8.png",
    stats: { atk: 3, hp: 5, spd: 4 },
    set: "DUK",
    number: "008"
  },
  {
    id: "duk_009",
    name: "Party Fowl",
    rarity: "rare",
    category: "Ducks of Snakesia",
    type: "Creature — Duck",
    flavor: "Crashed the company picnic. Ate half the potato salad. Got invited back next year.",
    image: "9.png",
    stats: { atk: 4, hp: 4, spd: 3 },
    set: "DUK",
    number: "009"
  },
  {
    id: "duk_010",
    name: "Undercover Quacker",
    rarity: "rare",
    category: "Ducks of Snakesia",
    type: "Creature — Duck",
    flavor: "Infiltrated the snake community years ago. Nobody suspects a thing. The accent is flawless.",
    image: "10.png",
    stats: { atk: 3, hp: 5, spd: 4 },
    set: "DUK",
    number: "010"
  },

  // ==========================================
  // EPIC (2 cards)
  // ==========================================
  {
    id: "duk_011",
    name: "The General",
    rarity: "epic",
    category: "Ducks of Snakesia",
    type: "Creature — Duck",
    flavor: "Commands a flock of two hundred. Battle formation: V-shape. Weakness: white bread.",
    image: "11.png",
    stats: { atk: 5, hp: 6, spd: 5 },
    set: "DUK",
    number: "011"
  },
  {
    id: "duk_012",
    name: "Gilded Mallard",
    rarity: "epic",
    category: "Ducks of Snakesia",
    type: "Creature — Duck",
    flavor: "Some say his feathers shimmer with actual gold. He has never confirmed nor denied this.",
    image: "12.png",
    stats: { atk: 5, hp: 7, spd: 4 },
    set: "DUK",
    number: "012"
  },

  // ==========================================
  // LEGENDARY (1 card)
  // ==========================================
  {
    id: "duk_013",
    name: "The Grand Quackmaster",
    rarity: "legendary",
    category: "Ducks of Snakesia",
    type: "Creature — Legendary Duck",
    flavor: "Ruler of every pond, lake, and puddle in Snakesia. His quack echoes across the highlands. All ducks answer.",
    image: "13.png",
    stats: { atk: 7, hp: 8, spd: 6 },
    set: "DUK",
    number: "013"
  }

];

/* ============================================
   REGISTER DUK SERIES
   ============================================
   Push cards into the shared CARD_CATALOG and
   add this series to SERIES_CONFIG / SERIES_LIST.
   ============================================ */

// Append DUK cards to the master catalog
DUK_CARDS.forEach(function(card) {
  CARD_CATALOG.push(card);
});

// Register the series
SERIES_CONFIG.DUK = {
  name: "Ducks of Snakesia",
  key: "DUK",
  image: "./assets/interwebs/snakesian-cards/images/sets/DUK/DUK_series.png",
  banner: "./assets/interwebs/snakesian-cards/images/banners/SCE_banner.jpg",
  description: "The beloved waterfowl of Snakesia \u2014 from lazy pond-drifters to the legendary Grand Quackmaster.",
  cardCount: DUK_CARDS.length
};

SERIES_LIST.push(SERIES_CONFIG.DUK);
