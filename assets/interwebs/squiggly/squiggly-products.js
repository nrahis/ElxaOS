// ============================================================
// Squiggly Wiggly — Product Catalog
// Snakesia's favorite grocery chain
// ============================================================

var SQUIGGLY_DEPARTMENTS = [
    { id: 'produce', name: 'Produce', icon: 'mdi-fruit-cherries', description: 'Fresh fruits, vegetables & Snakesian specialties' },
    { id: 'pantry', name: 'Pantry', icon: 'mdi-food-variant', description: 'Pasta, rice, canned goods & sauces' },
    { id: 'snacks', name: 'Snacks', icon: 'mdi-cookie', description: 'Chips, cookies, candy & branded treats' },
    { id: 'drinks', name: 'Drinks', icon: 'mdi-cup', description: 'Energy drinks, juices, coffee & more' },
    { id: 'frozen', name: 'Frozen', icon: 'mdi-snowflake', description: 'Frozen meals, ice cream & frozen snacks' },
    { id: 'bakery', name: 'Bakery', icon: 'mdi-bread-slice', description: 'Fresh bread, pastries & cakes' },
    { id: 'deli', name: 'Deli', icon: 'mdi-food-steak', description: 'Meats, cheeses & prepared foods' },
    { id: 'household', name: 'Household', icon: 'mdi-spray-bottle', description: 'Cleaning supplies & everyday essentials' }
];

var SQUIGGLY_PRODUCTS = [
    // ── Produce ──────────────────────────────────────────────
    { id: 'garden-apples-bag', name: 'Sidewinder Orchard Apples (6-Pack)', department: 'produce', price: 3.50, priceDisplay: '§7.00', brand: "Squiggly's Best", description: 'Crisp apples from the orchards outside Sidewinder Springs.', icon: 'mdi-food-apple', tags: [] },
    { id: 'banana-bunch', name: 'Banana Bunch', department: 'produce', price: 1.75, priceDisplay: '§3.50', brand: "Squiggly's Best", description: 'A perfectly yellow bunch. No brown spots, we promise.', icon: 'mdi-fruit-citrus', tags: [] },
    { id: 'rattlesnake-peppers', name: 'Rattlesnake Peppers (3-Pack)', department: 'produce', price: 2.25, priceDisplay: '§4.50', brand: "Squiggly's Best", description: 'Locally grown hot peppers with a bite that sneaks up on you.', icon: 'mdi-chili-mild', tags: ['popular'] },
    { id: 'fang-salad-kit', name: 'Fang Fresh Salad Kit', department: 'produce', price: 4.00, priceDisplay: '§8.00', brand: 'Fang Foods International', description: 'Pre-washed greens, croutons, and dressing. Dinner in 30 seconds.', icon: 'mdi-leaf', tags: [] },
    { id: 'coiled-squash', name: 'Coiled Squash', department: 'produce', price: 2.00, priceDisplay: '§4.00', brand: "Squiggly's Best", description: 'A Snakesian heirloom variety. Curls up naturally — not named after us, we swear.', icon: 'mdi-spa', tags: [] },
    { id: 'viper-vine-tomatoes', name: 'Viper Vine Tomatoes (4-Pack)', department: 'produce', price: 3.00, priceDisplay: '§6.00', brand: 'Fang Foods International', description: 'Plump, juicy tomatoes still on the vine. Perfect for slicing.', icon: 'mdi-circle', tags: [] },

    // ── Pantry ──────────────────────────────────────────────
    { id: 'snake-pasta-3pk', name: 'Snake-Shaped Pasta (3-Pack)', department: 'pantry', price: 2.50, priceDisplay: '§5.00', brand: 'Fang Foods International', description: 'The pasta that definitely does NOT move on its own.', icon: 'mdi-pasta', tags: ['popular'] },
    { id: 'fang-marinara', name: 'Fang Famous Marinara Sauce', department: 'pantry', price: 3.25, priceDisplay: '§6.50', brand: 'Fang Foods International', description: 'Slow-simmered tomato sauce. Secret family recipe since 1923.', icon: 'mdi-bottle-soda-classic', tags: [] },
    { id: 'hiss-olive-oil', name: 'Hiss Reserve Olive Oil', department: 'pantry', price: 6.50, priceDisplay: '§13.00', brand: 'Hiss Hotels & Resorts', description: 'Cold-pressed extra virgin. The fancy stuff from the Hiss estate groves.', icon: 'mdi-bottle-wine', tags: [] },
    { id: 'fang-canned-soup', name: 'Fang Condensed Tomato Soup', department: 'pantry', price: 1.50, priceDisplay: '§3.00', brand: 'Fang Foods International', description: 'Classic comfort in a can. Just add water and warmth.', icon: 'mdi-bowl-mix', tags: [] },
    { id: 'squig-white-rice', name: "Squiggly's Best White Rice (2 lb)", department: 'pantry', price: 2.75, priceDisplay: '§5.50', brand: "Squiggly's Best", description: 'Fluffy long-grain rice. A Snakesian kitchen staple.', icon: 'mdi-grain', tags: [] },
    { id: 'fang-peanut-butter', name: 'Fang Creamy Peanut Butter', department: 'pantry', price: 3.00, priceDisplay: '§6.00', brand: 'Fang Foods International', description: 'So smooth it practically slithers off the spoon.', icon: 'mdi-jar', tags: [] },

    // ── Snacks ──────────────────────────────────────────────
    { id: 'sussy-cheese-puffs', name: 'Sussy Cat Cheese Puffs', department: 'snacks', price: 2.75, priceDisplay: '§5.50', brand: 'Sussy Cat Entertainment', description: 'Dangerously cheesy. Sussy Cat approved — suspiciously addictive.', icon: 'mdi-chips', tags: ['popular'] },
    { id: 'sussy-gummy-snakes', name: 'Sussy Gummy Snakes (Party Size)', department: 'snacks', price: 4.00, priceDisplay: '§8.00', brand: 'Sussy Cat Entertainment', description: 'Assorted fruity gummy snakes. Every bag has one sour one hiding in there.', icon: 'mdi-candy', tags: [] },
    { id: 'fang-trail-mix', name: 'Fang Trail Mix', department: 'snacks', price: 3.50, priceDisplay: '§7.00', brand: 'Fang Foods International', description: 'Nuts, dried fruit, and chocolate chips. Fuel for desert hikes.', icon: 'mdi-peanut', tags: [] },
    { id: 'sussy-cat-cereal', name: 'Sussy Cat Crunch Cereal', department: 'snacks', price: 3.75, priceDisplay: '§7.50', brand: 'Sussy Cat Entertainment', description: 'Cat-ear shaped marshmallows in every bite. Part of a suspicious breakfast.', icon: 'mdi-bowl', tags: ['popular'] },
    { id: 'bite-protein-bar-6pk', name: 'SnakeBite Protein Bar (6-Pack)', department: 'snacks', price: 5.50, priceDisplay: '§11.00', brand: 'SnakeBite Labs', description: 'Chocolate peanut butter. 20g protein per bar. Gym snakes swear by them.', icon: 'mdi-food', tags: [] },
    { id: 'squig-tortilla-chips', name: "Squiggly's Tortilla Chips", department: 'snacks', price: 2.25, priceDisplay: '§4.50', brand: "Squiggly's Best", description: 'Restaurant-style chips. Perfect with salsa or just... by the fistful.', icon: 'mdi-triangle', tags: [] },
    { id: 'sussy-chocolate-bar', name: 'Sussy Cat Chocolate Bar', department: 'snacks', price: 1.50, priceDisplay: '§3.00', brand: 'Sussy Cat Entertainment', description: 'Milk chocolate with a cat face molded into each square. Collectible wrappers!', icon: 'mdi-candy-outline', tags: [] },

    // ── Drinks ──────────────────────────────────────────────
    { id: 'venom-original-6pk', name: 'Venom Energy Original (6-Pack)', department: 'drinks', price: 5.00, priceDisplay: '§10.00', brand: 'Venom Energy Corp', description: 'The classic green can. Tastes like electricity and poor decisions.', icon: 'mdi-lightning-bolt', tags: ['popular'] },
    { id: 'venom-mango-6pk', name: 'Venom Energy Mango Fang (6-Pack)', department: 'drinks', price: 5.00, priceDisplay: '§10.00', brand: 'Venom Energy Corp', description: 'Tropical mango with a venomous kick. Limited edition flavor.', icon: 'mdi-lightning-bolt', tags: ['sale'] },
    { id: 'bite-vitamin-water', name: 'SnakeBite Vitamin Water (4-Pack)', department: 'drinks', price: 3.75, priceDisplay: '§7.50', brand: 'SnakeBite Labs', description: 'Electrolytes, vitamins, and a vaguely medicinal aftertaste. Healthy!', icon: 'mdi-water', tags: [] },
    { id: 'squig-orange-juice', name: "Squiggly's Fresh Squeezed OJ", department: 'drinks', price: 3.50, priceDisplay: '§7.00', brand: "Squiggly's Best", description: 'Not from concentrate. Squeezed this morning. Probably.', icon: 'mdi-cup-water', tags: [] },
    { id: 'squig-whole-milk', name: "Squiggly's Whole Milk (1 gal)", department: 'drinks', price: 3.25, priceDisplay: '§6.50', brand: "Squiggly's Best", description: 'From happy Snakesian cows. Do snakes drink milk? Do not ask.', icon: 'mdi-cup', tags: [] },
    { id: 'hiss-ground-coffee', name: 'Hiss Reserve Ground Coffee', department: 'drinks', price: 8.00, priceDisplay: '§16.00', brand: 'Hiss Hotels & Resorts', description: 'Premium dark roast. The same blend served at Hiss Hotels worldwide.', icon: 'mdi-coffee', tags: [] },
    { id: 'venom-sport-4pk', name: 'Venom Sport Hydration (4-Pack)', department: 'drinks', price: 4.00, priceDisplay: '§8.00', brand: 'Venom Energy Corp', description: 'Low-sugar sports drink. Three electrolytes. Zero regrets.', icon: 'mdi-bottle-tonic', tags: [] },

    // ── Frozen ──────────────────────────────────────────────
    { id: 'fang-frozen-lasagna', name: 'Fang Family Lasagna (Frozen)', department: 'frozen', price: 5.50, priceDisplay: '§11.00', brand: 'Fang Foods International', description: 'Feeds a family of four. Or one very hungry snake on a Friday night.', icon: 'mdi-food-takeout-box', tags: ['popular'] },
    { id: 'fang-frozen-pizza', name: 'Fang Rising Crust Pizza', department: 'frozen', price: 4.50, priceDisplay: '§9.00', brand: 'Fang Foods International', description: 'Pepperoni and mozzarella on a self-rising crust. 18 minutes to happiness.', icon: 'mdi-pizza', tags: [] },
    { id: 'sussy-ice-cream', name: 'Sussy Cat Ice Cream (Cookies & Cream)', department: 'frozen', price: 4.00, priceDisplay: '§8.00', brand: 'Sussy Cat Entertainment', description: 'Cat-paw shaped cookie chunks in vanilla. Suspiciously good.', icon: 'mdi-ice-cream', tags: ['popular'] },
    { id: 'squig-frozen-veggies', name: "Squiggly's Mixed Vegetables (Frozen)", department: 'frozen', price: 2.00, priceDisplay: '§4.00', brand: "Squiggly's Best", description: 'Peas, carrots, corn, and green beans. The responsible choice.', icon: 'mdi-leaf', tags: [] },
    { id: 'fang-chicken-nuggets', name: 'Fang Dino Nuggets (Party Bag)', department: 'frozen', price: 5.00, priceDisplay: '§10.00', brand: 'Fang Foods International', description: 'Dinosaur-shaped chicken nuggets. Yes, adults buy these. No judgment.', icon: 'mdi-food-drumstick', tags: [] },
    { id: 'bite-smoothie-packs', name: 'SnakeBite Smoothie Packs (4-Pack)', department: 'frozen', price: 6.00, priceDisplay: '§12.00', brand: 'SnakeBite Labs', description: 'Pre-portioned frozen fruit and protein. Just add milk and blend.', icon: 'mdi-blender', tags: [] },

    // ── Bakery ──────────────────────────────────────────────
    { id: 'squig-white-bread', name: "Squiggly's Sliced White Bread", department: 'bakery', price: 2.25, priceDisplay: '§4.50', brand: "Squiggly's Best", description: 'Soft, pre-sliced, and perfect for sandwiches. A kitchen classic.', icon: 'mdi-bread-slice', tags: [] },
    { id: 'squig-sourdough', name: "Squiggly's Sourdough Loaf", department: 'bakery', price: 3.50, priceDisplay: '§7.00', brand: "Squiggly's Best", description: 'Crusty outside, tangy inside. Baked fresh in-store daily.', icon: 'mdi-bread-slice', tags: ['popular'] },
    { id: 'sussy-birthday-cake', name: 'Sussy Cat Celebration Cake', department: 'bakery', price: 12.00, priceDisplay: '§24.00', brand: 'Sussy Cat Entertainment', description: 'Two-layer vanilla cake with Sussy Cat face in frosting. Party essential.', icon: 'mdi-cake-variant', tags: [] },
    { id: 'fang-croissants-4pk', name: 'Fang Butter Croissants (4-Pack)', department: 'bakery', price: 4.00, priceDisplay: '§8.00', brand: 'Fang Foods International', description: 'Flaky, buttery, and gone before lunch. Reheat at 350 for best results.', icon: 'mdi-croissant', tags: [] },
    { id: 'squig-cinnamon-rolls', name: "Squiggly's Cinnamon Rolls (6-Pack)", department: 'bakery', price: 3.75, priceDisplay: '§7.50', brand: "Squiggly's Best", description: 'Coiled up with cinnamon sugar and cream cheese icing. Naturally spiraled.', icon: 'mdi-cookie', tags: [] },

    // ── Deli ────────────────────────────────────────────────
    { id: 'hiss-brie-wedge', name: 'Hiss Reserve Brie Wedge', department: 'deli', price: 5.50, priceDisplay: '§11.00', brand: 'Hiss Hotels & Resorts', description: 'Imported soft-ripened brie. Pairs well with crackers and pretension.', icon: 'mdi-cheese', tags: [] },
    { id: 'squig-turkey-sliced', name: "Squiggly's Deli Turkey (Sliced)", department: 'deli', price: 4.50, priceDisplay: '§9.00', brand: "Squiggly's Best", description: 'Oven-roasted, thinly sliced. The foundation of a solid sandwich.', icon: 'mdi-food-steak', tags: [] },
    { id: 'fang-rotisserie-chicken', name: 'Fang Rotisserie Chicken (Whole)', department: 'deli', price: 6.00, priceDisplay: '§12.00', brand: 'Fang Foods International', description: 'Hot and ready. The universal answer to "what\'s for dinner?"', icon: 'mdi-food-turkey', tags: ['popular'] },
    { id: 'hiss-charcuterie-box', name: 'Hiss Charcuterie Sampler Box', department: 'deli', price: 9.00, priceDisplay: '§18.00', brand: 'Hiss Hotels & Resorts', description: 'Prosciutto, salami, aged cheddar, and fancy crackers. Instant class.', icon: 'mdi-food-variant', tags: [] },
    { id: 'squig-potato-salad', name: "Squiggly's Homestyle Potato Salad", department: 'deli', price: 3.25, priceDisplay: '§6.50', brand: "Squiggly's Best", description: 'Made in-store with real potatoes. Grandma-approved recipe.', icon: 'mdi-bowl-mix', tags: [] },

    // ── Household ───────────────────────────────────────────
    { id: 'squig-paper-towels', name: "Squiggly's Paper Towels (4-Roll)", department: 'household', price: 4.50, priceDisplay: '§9.00', brand: "Squiggly's Best", description: 'Extra absorbent. For spills, messes, and questionable cooking experiments.', icon: 'mdi-paper-roll', tags: [] },
    { id: 'squig-dish-soap', name: "Squiggly's Dish Soap (Lemon)", department: 'household', price: 2.50, priceDisplay: '§5.00', brand: "Squiggly's Best", description: 'Cuts through grease. Smells like lemons. What more do you need?', icon: 'mdi-spray-bottle', tags: [] },
    { id: 'coil-aa-batteries-8pk', name: 'Coil Power AA Batteries (8-Pack)', department: 'household', price: 5.00, priceDisplay: '§10.00', brand: 'Coil Communications', description: 'Long-lasting alkaline batteries. Keeps your remotes alive.', icon: 'mdi-battery', tags: [] },
    { id: 'squig-trash-bags', name: "Squiggly's Tall Kitchen Bags (20ct)", department: 'household', price: 3.75, priceDisplay: '§7.50', brand: "Squiggly's Best", description: '13-gallon drawstring bags. Strong enough for whatever is in there.', icon: 'mdi-delete', tags: [] },
    { id: 'coil-phone-charger', name: 'Coil USB-C Charging Cable (6ft)', department: 'household', price: 7.00, priceDisplay: '§14.00', brand: 'Coil Communications', description: 'Braided nylon cable. Extra long so you can use your phone in bed. No shame.', icon: 'mdi-usb', tags: [] },
    { id: 'bite-hand-sanitizer', name: 'SnakeBite Hand Sanitizer (2-Pack)', department: 'household', price: 3.00, priceDisplay: '§6.00', brand: 'SnakeBite Labs', description: 'Kills 99.9% of germs. Aloe-infused so your scales stay moisturized.', icon: 'mdi-hand-wash', tags: [] }
];
