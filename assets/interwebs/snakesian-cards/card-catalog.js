/* ============================================
   SNAKESIAN CARD EXCHANGE — Card Catalog
   ============================================
   All available cards in the SCE set.
   Add new cards by adding entries to CARD_CATALOG.
   
   Rarity tiers: common, uncommon, rare, epic, legendary
   
   Stat ranges by rarity:
     common:    1-3
     uncommon:  2-4
     rare:      3-5
     epic:      4-7
     legendary: 5-8
   ============================================ */

var CARD_CATALOG = [

  // ==========================================
  // RITA
  // ==========================================
  {
    id: "rita_001",
    name: "Batch of Love",
    rarity: "common",
    category: "Rita",
    type: "Character — Human",
    flavor: "The cookies are for everyone. She made extra for you specifically. She noticed you looked hungry.",
    image: "rita_001.png",
    stats: { atk: 1, hp: 3, spd: 2 },
    set: "SCE",
    number: "001"
  },
  {
    id: "rita_002",
    name: "On the Clock",
    rarity: "uncommon",
    category: "Rita",
    type: "Character — Human",
    flavor: "Somehow manages to read, reply, and reorganize the whole filing system before lunch.",
    image: "rita_002.png",
    stats: { atk: 2, hp: 3, spd: 3 },
    set: "SCE",
    number: "002"
  },
  {
    id: "rita_003",
    name: "Morning Commute",
    rarity: "uncommon",
    category: "Rita",
    type: "Character — Human",
    flavor: "Three books, two podcasts, one very organized tote bag. She's ready for anything.",
    image: "rita_003.png",
    stats: { atk: 1, hp: 4, spd: 2 },
    set: "SCE",
    number: "003"
  },
  {
    id: "rita_004",
    name: "Saturday Morning Rita",
    rarity: "rare",
    category: "Rita",
    type: "Character — Human",
    flavor: "Woke up at 7am voluntarily. On a weekend. Don't try to understand it. Just accept it.",
    image: "rita_004.png",
    stats: { atk: 2, hp: 5, spd: 3 },
    set: "SCE",
    number: "004"
  },

  // ==========================================
  // REMI
  // ==========================================
  {
    id: "remi_001",
    name: "Meet & Greet",
    rarity: "uncommon",
    category: "Remi",
    type: "Character — YouTuber",
    flavor: "He remembered your username from a comment you left six months ago. Yes, really.",
    image: "remi_001.png",
    stats: { atk: 2, hp: 3, spd: 3 },
    set: "SCE",
    number: "005"
  },
  {
    id: "remi_002",
    name: "Vlog Day",
    rarity: "rare",
    category: "Remi",
    type: "Character — YouTuber",
    flavor: "Posting this tomorrow. Already has 200k views. He didn't even edit it.",
    image: "remi_002.png",
    stats: { atk: 3, hp: 3, spd: 5 },
    set: "SCE",
    number: "006"
  },
  {
    id: "remi_003",
    name: "The Setup",
    rarity: "epic",
    category: "Remi",
    type: "Character — YouTuber",
    flavor: "Every peripheral hand-picked. Every cable managed. Every game at 240fps. He's twelve.",
    image: "remi_003.png",
    stats: { atk: 5, hp: 5, spd: 6 },
    set: "SCE",
    number: "007"
  },
  {
    id: "remi_004",
    name: "Remi Live",
    rarity: "rare",
    category: "Remi",
    type: "Character — YouTuber",
    flavor: "4,000 viewers watching him lose his diamonds for the third time. The chat is losing it.",
    image: "remi_004.png",
    stats: { atk: 3, hp: 4, spd: 4 },
    set: "SCE",
    number: "008"
  },

  // ==========================================
  // MRS. SNAKE-E
  // ==========================================
  {
    id: "mrs_snake_e_001",
    name: "Fresh From the Oven",
    rarity: "common",
    category: "Mrs. Snake-e",
    type: "Character — Snake",
    flavor: "She made these for the whole family. And the neighbors. And anyone who happens to walk by.",
    image: "mrs_snake_e_001.png",
    stats: { atk: 1, hp: 4, spd: 1 },
    set: "SCE",
    number: "009"
  },
  {
    id: "mrs_snake_e_002",
    name: "Secret Recipe",
    rarity: "uncommon",
    category: "Mrs. Snake-e",
    type: "Character — Snake",
    flavor: "She's been making this for 60 years and has never once written it down. The recipe lives only in her coils.",
    image: "mrs_snake_e_002.png",
    stats: { atk: 2, hp: 4, spd: 2 },
    set: "SCE",
    number: "010"
  },
  {
    id: "mrs_snake_e_003",
    name: "Green Coils",
    rarity: "uncommon",
    category: "Mrs. Snake-e",
    type: "Character — Snake",
    flavor: "Every flower in Snakesia blooms a little brighter when she walks by. Scientific fact. Probably.",
    image: "mrs_snake_e_003.png",
    stats: { atk: 1, hp: 5, spd: 2 },
    set: "SCE",
    number: "011"
  },
  {
    id: "mrs_snake_e_004",
    name: "Well-Deserved Nap",
    rarity: "rare",
    category: "Mrs. Snake-e",
    type: "Character — Snake",
    flavor: "Baked four batches, tended the garden, wrote three letters by tail. She's earned this.",
    image: "mrs_snake_e_004.png",
    stats: { atk: 1, hp: 7, spd: 1 },
    set: "SCE",
    number: "012"
  },

  // ==========================================
  // MR. SNAKE-E
  // ==========================================
  {
    id: "mr_snake_e_001",
    name: "Burning the Midnight Oil",
    rarity: "uncommon",
    category: "Mr. Snake-e",
    type: "Character — Snake",
    flavor: "The lights in the ElxaCorp tower never fully go out. That's how you know he's still up there.",
    image: "mr_snake_e_001.png",
    stats: { atk: 3, hp: 4, spd: 2 },
    set: "SCE",
    number: "013"
  },
  {
    id: "mr_snake_e_002",
    name: "Q4 Results",
    rarity: "rare",
    category: "Mr. Snake-e",
    type: "Character — Snake",
    flavor: "The chart goes up. It always goes up. He wouldn't have it any other way.",
    image: "mr_snake_e_002.png",
    stats: { atk: 4, hp: 5, spd: 3 },
    set: "SCE",
    number: "014"
  },
  {
    id: "mr_snake_e_003",
    name: "Keynote Address",
    rarity: "epic",
    category: "Mr. Snake-e",
    type: "Character — Snake",
    flavor: "He rehearsed this twice. Standing ovation!",
    image: "mr_snake_e_003.png",
    stats: { atk: 5, hp: 6, spd: 4 },
    set: "SCE",
    number: "015"
  },
  {
    id: "mr_snake_e_004",
    name: "Snakesian Businessman of the Year",
    rarity: "legendary",
    category: "Mr. Snake-e",
    type: "Character — Snake",
    flavor: "For the fourteenth consecutive year. The award committee has stopped taking votes.",
    image: "mr_snake_e_004.png",
    stats: { atk: 6, hp: 8, spd: 4 },
    set: "SCE",
    number: "016"
  },

  // ==========================================
  // PUSHING CAT
  // ==========================================
  {
    id: "pushing_cat_001",
    name: "Recharging for Chaos",
    rarity: "common",
    category: "Pushing Cat",
    type: "Creature — Cat",
    flavor: "Don't be fooled. This is not peace. This is a loading screen.",
    image: "pushing_cat_001.png",
    stats: { atk: 1, hp: 3, spd: 1 },
    set: "SCE",
    number: "017"
  },
  {
    id: "pushing_cat_002",
    name: "Five-Finger Discount",
    rarity: "common",
    category: "Pushing Cat",
    type: "Creature — Cat",
    flavor: "He heard 'no.' He considered it. He proceeded anyway.",
    image: "pushing_cat_002.png",
    stats: { atk: 2, hp: 2, spd: 3 },
    set: "SCE",
    number: "018"
  },
  {
    id: "pushing_cat_003",
    name: "This Is My Box Now",
    rarity: "uncommon",
    category: "Pushing Cat",
    type: "Creature — Cat",
    flavor: "It arrived containing something called a 'television.' That is irrelevant. It is his box.",
    image: "pushing_cat_003.png",
    stats: { atk: 2, hp: 4, spd: 2 },
    set: "SCE",
    number: "019"
  },
  {
    id: "pushing_cat_004",
    name: "I Didn't Do That",
    rarity: "uncommon",
    category: "Pushing Cat",
    type: "Creature — Cat",
    flavor: "The plant fell. Gravity is to blame. He is merely a witness. A very smug witness.",
    image: "pushing_cat_004.png",
    stats: { atk: 3, hp: 3, spd: 3 },
    set: "SCE",
    number: "020"
  },
  {
    id: "pushing_cat_005",
    name: "Feather Enemy",
    rarity: "rare",
    category: "Pushing Cat",
    type: "Creature — Cat",
    flavor: "It's a toy. He knows it's a toy. He is going to destroy it anyway.",
    image: "pushing_cat_005.png",
    stats: { atk: 4, hp: 3, spd: 5 },
    set: "SCE",
    number: "021"
  },
  {
    id: "pushing_cat_006",
    name: "Pillow Nemesis",
    rarity: "rare",
    category: "Pushing Cat",
    type: "Creature — Cat",
    flavor: "It had it coming. He doesn't want to talk about it.",
    image: "pushing_cat_006.png",
    stats: { atk: 5, hp: 3, spd: 4 },
    set: "SCE",
    number: "022"
  },
  {
    id: "pushing_cat_007",
    name: "Gravity Researcher",
    rarity: "epic",
    category: "Pushing Cat",
    type: "Creature — Cat",
    flavor: "Hypothesis: this will fall. Methodology: push it. Conclusion: correct. Research ongoing.",
    image: "pushing_cat_007.png",
    stats: { atk: 5, hp: 5, spd: 5 },
    set: "SCE",
    number: "023"
  },
  {
    id: "pushing_cat_008",
    name: "Chef Sussy",
    rarity: "epic",
    category: "Pushing Cat",
    type: "Creature — Cat",
    flavor: "He is not helping. He is the opposite of helping. The hat was not his idea.",
    image: "pushing_cat_008.png",
    stats: { atk: 4, hp: 6, spd: 4 },
    set: "SCE",
    number: "024"
  },
  {
    id: "pushing_cat_009",
    name: "The Great Unrolling",
    rarity: "legendary",
    category: "Pushing Cat",
    type: "Creature — Cat",
    flavor: "Seventeen rolls. Three hours. Zero regrets. This is his magnum opus.",
    image: "pushing_cat_009.png",
    stats: { atk: 7, hp: 7, spd: 6 },
    set: "SCE",
    number: "025"
  },

  // ==========================================
  // SNAKESIAN LANDMARKS
  // ==========================================
  {
    id: "landmark_snakesia",
    name: "The Snakesian Highlands",
    rarity: "uncommon",
    category: "Snakesian Landmarks",
    type: "Landmark — Wilderness",
    flavor: "West of Tennessee, east of legend. Nobody's entirely sure where Snakesia is. It's there though.",
    image: "landmark_snakesia.png",
    stats: { atk: 1, hp: 7, spd: 1 },
    set: "SCE",
    number: "026"
  },
  {
    id: "landmark_lake_denali",
    name: "Lake Denali at Sunset",
    rarity: "rare",
    category: "Snakesian Landmarks",
    type: "Landmark — Nature",
    flavor: "Named after Mr. Snake-e's car, which he once parked a little too close to the shore.",
    image: "landmark_lake_denali.png",
    stats: { atk: 1, hp: 6, spd: 2 },
    set: "SCE",
    number: "027"
  },
  {
    id: "landmark_garden",
    name: "Mrs. Snake-e's Garden",
    rarity: "rare",
    category: "Snakesian Landmarks",
    type: "Landmark — Garden",
    flavor: "Everything grows here. Even things that shouldn't. She once planted a paperclip and got a rose bush.",
    image: "landmark_garden.png",
    stats: { atk: 2, hp: 8, spd: 1 },
    set: "SCE",
    number: "028"
  },
  {
    id: "landmark_remi_gaming_room",
    name: "The Battlestation",
    rarity: "epic",
    category: "Snakesian Landmarks",
    type: "Landmark — Indoor",
    flavor: "Triple monitors. Blue LEDs. A level of cable management that scientists cannot fully explain.",
    image: "landmark_remi_gaming_room.png",
    stats: { atk: 6, hp: 5, spd: 5 },
    set: "SCE",
    number: "029"
  },
  {
    id: "landmark_elxacorp_office",
    name: "The Office Floor",
    rarity: "uncommon",
    category: "Snakesian Landmarks",
    type: "Landmark — Corporate",
    flavor: "Voted 'Best Views in Snakesia' three years running. The employees mostly stare at their monitors.",
    image: "landmark_elxacorp_office.png",
    stats: { atk: 2, hp: 5, spd: 2 },
    set: "SCE",
    number: "030"
  },
  {
    id: "landmark_elxacorp_hq",
    name: "ElxaCorp HQ",
    rarity: "rare",
    category: "Snakesian Landmarks",
    type: "Landmark — Corporate",
    flavor: "The tallest building in Snake Valley. 100% employee satisfaction, five years running.",
    image: "landmark_elxacorp_hq.png",
    stats: { atk: 3, hp: 8, spd: 1 },
    set: "SCE",
    number: "031"
  },
  {
    id: "landmark_snake_e_mansion",
    name: "The Snake-e Estate",
    rarity: "epic",
    category: "Snakesian Landmarks",
    type: "Landmark — Residence",
    flavor: "Twenty-seven rooms. Mrs. Snake-e knows where everything is. Mr. Snake-e does not.",
    image: "landmark_snake_e_mansion.png",
    stats: { atk: 4, hp: 9, spd: 1 },
    set: "SCE",
    number: "032"
  },
  {
    id: "landmark_sussy_lair",
    name: "The Sussy Lair",
    rarity: "legendary",
    category: "Snakesian Landmarks",
    type: "Landmark — Secret Hideout",
    flavor: "Location: classified. Amenities: blankets, fairy lights, stolen snacks. Admission: cats only.",
    image: "landmark_sussy_lair.png",
    stats: { atk: 5, hp: 8, spd: 3 },
    set: "SCE",
    number: "033"
  },
  {
    id: "mr_snake_e_denali",
    name: "The Denali",
    rarity: "epic",
    category: "Snakesian Landmarks",
    type: "Artifact — Vehicle",
    flavor: "Zero hands. Zero feet. Zero accidents. The insurance company finds this deeply unsettling.",
    image: "mr_snake_e_denali.png",
    stats: { atk: 4, hp: 6, spd: 7 },
    set: "SCE",
    number: "034"
  }

];

/* ============================================
   SERIES CONFIG
   ============================================ */
window.SERIES_CONFIG = {
  SCE: {
    name: "Series 1",
    key: "SCE",
    image: "./assets/interwebs/snakesian-cards/images/sets/SCE/series_1.png",
    banner: "./assets/interwebs/snakesian-cards/images/banners/SCE_banner.jpg",
    description: "The original collection — meet the characters, creatures, and legends of Snakesia.",
    cardCount: CARD_CATALOG.filter(function(c) { return c.set === 'SCE'; }).length
  }
};

// Ordered array for display
window.SERIES_LIST = [SERIES_CONFIG.SCE];

/* ============================================
   PACK CONFIG
   ============================================ */
var PACK_CONFIG = {
  standard5: {
    name: "Standard Pack",
    description: "5 random cards",
    cardCount: 5,
    price: 10,
    guaranteedRarity: null
  },
  standard10: {
    name: "Mega Pack",
    description: "10 random cards",
    cardCount: 10,
    price: 18,
    guaranteedRarity: null
  },
  premium: {
    name: "Premium Pack",
    description: "5 cards — guaranteed Rare or better!",
    cardCount: 5,
    price: 50,
    guaranteedRarity: "rare"
  }
};

/* ============================================
   DROP RATE WEIGHTS
   ============================================ */
var DROP_RATES = {
  common: 50,
  uncommon: 30,
  rare: 13,
  epic: 5,
  legendary: 2
};

/**
 * Roll a random rarity based on drop rates.
 * @param {string} [minimumRarity] - Minimum rarity to guarantee (for premium packs)
 * @returns {string} The rolled rarity
 */
function rollRarity(minimumRarity = null) {
  const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  let rates = { ...DROP_RATES };

  // If minimum rarity set, zero out everything below it
  if (minimumRarity) {
    const minIndex = rarityOrder.indexOf(minimumRarity);
    for (let i = 0; i < minIndex; i++) {
      rates[rarityOrder[i]] = 0;
    }
  }

  const total = Object.values(rates).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;

  for (const rarity of rarityOrder) {
    roll -= rates[rarity];
    if (roll <= 0) return rarity;
  }
  return 'common';
}

/**
 * Roll a random card from the catalog.
 * @param {string} [minimumRarity] - Minimum rarity guarantee
 * @param {string} [series] - Series key to filter by (e.g. 'SCE')
 * @returns {Object} A random card data object
 */
function rollCard(minimumRarity = null, series = null) {
  const rarity = rollRarity(minimumRarity);
  let pool = CARD_CATALOG.filter(c => c.rarity === rarity);
  if (series) {
    pool = pool.filter(c => c.set === series);
  }
  if (pool.length === 0) {
    // Fallback: if no cards at this rarity in this series, use all cards of this rarity
    pool = CARD_CATALOG.filter(c => c.rarity === rarity);
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Open a pack and get an array of cards.
 * @param {string} packType - Key from PACK_CONFIG
 * @param {string} [series] - Series key to filter by
 * @returns {Array} Array of card data objects
 */
function openPack(packType, series = null) {
  const config = PACK_CONFIG[packType];
  if (!config) return [];

  const cards = [];
  for (let i = 0; i < config.cardCount; i++) {
    cards.push(rollCard(config.guaranteedRarity, series));
  }
  return cards;
}
