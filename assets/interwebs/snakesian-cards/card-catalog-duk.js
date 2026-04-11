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
    number: "001",
    role: "fighter",
    ability: {
      name: "Patrol Report",
      description: "Blocks the next incoming attack. He saw it coming from across the pond.",
      type: "shield",
      value: 1
    }
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
    number: "002",
    role: "fighter",
    ability: {
      name: "Bread Tax",
      description: "Heals self 2 HP. He confiscated your snacks. For the flock.",
      type: "heal",
      value: 2
    }
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
    number: "003",
    role: "fighter",
    ability: {
      name: "Sleepy Drift",
      description: "Stuns the opponent for 1 turn. They fell asleep watching him sleep.",
      type: "stun",
      value: 1
    }
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
    number: "004",
    role: "fighter",
    ability: {
      name: "Dressed to Kill",
      description: "Boosts own ATK by 2 and SPD by 1. Looking good hits different.",
      type: "buff",
      value: 2,
      buffStat: "atk",
      bonusSpd: 1
    }
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
    number: "005",
    role: "fighter",
    ability: {
      name: "Crash Landing",
      description: "Deals 5 damage. The landing was not part of the plan.",
      type: "damage",
      value: 5
    }
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
    number: "006",
    role: "fighter",
    ability: {
      name: "Tactical Quack",
      description: "Forces the opponent to swap to their next card. He saw a weakness.",
      type: "swap",
      value: 1
    }
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
    number: "007",
    role: "fighter",
    ability: {
      name: "Sunset Zen",
      description: "Heals self 3 HP. The golden hour heals all wounds.",
      type: "heal",
      value: 3
    }
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
    number: "008",
    role: "fighter",
    ability: {
      name: "Thunder Quack",
      description: "Deals 6 damage. The storm follows him.",
      type: "damage",
      value: 6
    }
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
    number: "009",
    role: "fighter",
    ability: {
      name: "Party Crasher",
      description: "Stuns the opponent for 1 turn. He just showed up and started eating.",
      type: "stun",
      value: 1
    }
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
    number: "010",
    role: "fighter",
    ability: {
      name: "Double Agent",
      description: "50/50: deals 7 damage OR opponent heals 2 HP. His cover might be blown.",
      type: "gamble",
      value: 7,
      chance: 0.5,
      altValue: -2
    }
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
    number: "011",
    role: "fighter",
    ability: {
      name: "V-Formation Strike",
      description: "Deals 3 damage to ALL remaining opponent cards. The flock obeys.",
      type: "aoe",
      value: 3
    }
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
    number: "012",
    role: "fighter",
    ability: {
      name: "Golden Plumage",
      description: "Boosts own ATK by 3 and HP by 3. Pure gold energy.",
      type: "buff",
      value: 3,
      buffStat: "atk",
      bonusHp: 3
    }
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
    number: "013",
    role: "fighter",
    ability: {
      name: "THE QUACKENING",
      description: "Deals 4 damage to ALL remaining opponent cards. His quack shakes the earth.",
      type: "aoe",
      value: 4
    }
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
