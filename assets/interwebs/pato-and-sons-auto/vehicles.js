// ============================================================
// Pato & Sons Auto — Vehicle Listings
// All prices in USD (displayed as snakes ×2 in UI)
// 23 vehicles across 5 tiers, ordered cheapest to most expensive
// ============================================================

var PATO_VEHICLES = [

    // ========================================
    // BEATERS & BUDGET — IDs 1-4
    // Salesperson: Pato Sr. (brutally honest)
    // Price range: $1,500–$5,000
    // Lease rate: 3.0% of value/month
    // Depreciation: 0.5%/month
    // Insurance: 2.0% of current value/month
    // ========================================

    {
        id: 1,
        name: "The Rust Bucket",
        image: "./assets/vehicles/old beat up truck.jpg",
        price: 1500,
        tier: "beaters",
        tierName: "Beaters & Budget",
        type: "Pickup Truck",
        year: 1984,
        mileage: 287000,
        color: "Rust (formerly red)",
        engine: "V6 (4 cylinders currently participating)",
        features: ["AM radio (one speaker works)", "Manual windows (good arm workout)", "Bench seat fits three cozy snakes", "Authentic patina finish"],
        description: "Look kid, I'm gonna level with you. This truck has seen things. Wars, probably. The odometer rolled over twice and gave up. The bed's got more rust than metal, and the tailgate is held on by what I think is hope. But you know what? Turn that key and she fires up. Eventually. She's the cheapest thing on the lot because I feel bad charging more. A deal's a deal, kid.",
        quirks: "Makes a grinding noise when you turn left. Only left. Right turns are silent and frankly suspicious. The radio picks up exactly one station — Snakesian polka. Previous owner claimed it was haunted. We can neither confirm nor deny.",
        salesperson: "Pato Sr.",
        leasable: true,
        buyable: true,
        leaseRate: 0.03,
        depreciationRate: 0.005,
        insuranceRate: 0.02
    },

    {
        id: 2,
        name: "The Road Warrior",
        image: "./assets/vehicles/hatchback travelworn.jpg",
        price: 2200,
        tier: "beaters",
        tierName: "Beaters & Budget",
        type: "Hatchback",
        year: 1996,
        mileage: 198000,
        color: "Faded teal (identity crisis blue)",
        engine: "4-cylinder",
        features: ["Hatchback storage (surprisingly roomy)", "Four doors that all close", "Working AC (when it feels like it)", "Bumper stickers from three previous owners"],
        description: "This little hatchback has been everywhere. And I mean EVERYWHERE. The paint tells a story — mostly a sad one, but a story nonetheless. She's got dents from adventures and scratches from parallel parking attempts that got... ambitious. The trunk space is actually decent though, and she's surprisingly fuel efficient. Probably because half the engine weight rusted off. She's not pretty, but she's BEEN places.",
        quirks: "There's a faded bumper sticker that says 'I Brake For Snakes' which is both sweet and concerning. The glove box only opens if you hit the dashboard in exactly the right spot. Previous owner was apparently a traveling salesnake who drove this thing across all of Snakesia twice.",
        salesperson: "Pato Sr.",
        leasable: true,
        buyable: true,
        leaseRate: 0.03,
        depreciationRate: 0.005,
        insuranceRate: 0.02
    },

    {
        id: 3,
        name: "The Sidewinder",
        image: "./assets/vehicles/motorcycle.jpg",
        price: 3200,
        tier: "beaters",
        tierName: "Beaters & Budget",
        type: "Motorcycle",
        year: 2001,
        mileage: 67000,
        color: "Black and chrome",
        engine: "2-cylinder, 650cc",
        features: ["Loud exhaust (free alarm system)", "Leather seat (cracked, adds character)", "Kickstart AND electric start", "Saddlebags included (one zipper works)"],
        description: "Now HERE'S something with a little soul. The Sidewinder ain't fancy — she's got some miles on her and the chrome's a bit dull — but there's nothing like the feeling of two wheels on an open Snakesian highway. My cousin Sal rode one of these for ten years. Well, he crashed it after two, but he TALKED about riding it for ten. Good bike. Honest bike. Just don't ride her in the rain.",
        quirks: "The horn plays a note that sounds exactly like a duck. Not a honk — a quack. Nobody knows why. The kickstand has a sweet spot; miss it and she'll lean dramatically to the right like she's posing for a photo.",
        salesperson: "Pato Sr.",
        leasable: true,
        buyable: true,
        leaseRate: 0.03,
        depreciationRate: 0.005,
        insuranceRate: 0.02
    },

    {
        id: 4,
        name: "Ol' Reliable",
        image: "./assets/vehicles/older pickup.jpg",
        price: 4800,
        tier: "beaters",
        tierName: "Beaters & Budget",
        type: "Pickup Truck",
        year: 1998,
        mileage: 156000,
        color: "Forest green",
        engine: "V6",
        features: ["Extended cab (tiny back seat, big dreams)", "Working radio with CD player", "Tow hitch (rated for light loads)", "Bed liner (some rust underneath, don't look)"],
        description: "This is the crown jewel of the budget tier, and I mean that with minimal irony. Ol' Reliable earned her name — she starts every morning, hauls what you need, and only makes weird noises on Tuesdays. The paint's faded but it's all original, the interior's clean-ish, and she's got a working CD player. IN THIS ECONOMY. She's the best truck under five grand in all of Snakesia, and I will fight anyone who disagrees. A deal's a deal, kid.",
        quirks: "There's a coffee stain on the ceiling of the cab that looks exactly like the outline of Snakesia. The previous owner was a farmer who claims this truck 'knows the way home' on its own. The turn signal makes a clicking sound that's weirdly soothing.",
        salesperson: "Pato Sr.",
        leasable: true,
        buyable: true,
        leaseRate: 0.03,
        depreciationRate: 0.005,
        insuranceRate: 0.02
    },

    // ========================================
    // RELIABLE RIDES — IDs 5-8
    // Salesperson: Pato Jr. (enthusiastic)
    // Price range: $6,000–$15,000
    // Lease rate: 2.0% of value/month
    // Depreciation: 1.0%/month
    // Insurance: 1.5% of current value/month
    // ========================================

    {
        id: 5,
        name: "The Daily Grind",
        image: "./assets/vehicles/decent hatchback.jpg",
        price: 6500,
        tier: "reliable",
        tierName: "Reliable Rides",
        type: "Hatchback",
        year: 2014,
        mileage: 78000,
        color: "Silver",
        engine: "4-cylinder, 1.8L",
        features: ["Bluetooth audio", "Power windows and locks", "Fold-down rear seats", "Backup camera"],
        description: "NOW we're talking! This right here is the sweet spot, friend. She's not flashy, she's not trying to impress anyone — she just WORKS. Every. Single. Day. The AC blows cold, the heat blows hot, and the engine purrs like a content snake on a warm rock. Fuel economy? Outstanding. Reliability? You could set your watch to it. This is the car that gets you to work on time and never complains about it. You're gonna LOVE this one.",
        quirks: "The previous owner was a driving instructor. So this car has seen some things. There's a faint imprint on the passenger side where someone gripped the dashboard VERY hard. The trunk has a mysterious collection of orange cones.",
        salesperson: "Pato Jr.",
        leasable: true,
        buyable: true,
        leaseRate: 0.02,
        depreciationRate: 0.01,
        insuranceRate: 0.015
    },

    {
        id: 6,
        name: "The Wanderer",
        image: "./assets/vehicles/cheerful camper.jpg",
        price: 9000,
        tier: "reliable",
        tierName: "Reliable Rides",
        type: "Camper Van",
        year: 2008,
        mileage: 112000,
        color: "Sky blue and cream",
        engine: "4-cylinder, 2.0L",
        features: ["Fold-out bed in the back", "Mini cooler built into the dash", "Roof rack for adventure gear", "Curtains on all windows (very cozy)"],
        description: "Oh MAN, you gotta see this one. It's a CAMPER. A real honest-to-goodness camper van! She's got personality for DAYS — look at that color! The previous owner was a traveling musician who drove this beauty up and down the Snakesian coast. There's a fold-out bed in the back, a little cooler, and enough room to live your best road trip life. Is she fast? No. Does she corner well? Absolutely not. But does she make you SMILE? Every single time. You're gonna LOVE this one.",
        quirks: "Smells permanently like campfire and good decisions. There's a ukulele pick lodged in the AC vent that nobody can get out. The horn plays a cheerful little tune instead of a normal honk. The previous owner painted a tiny sunset on the inside of the gas cap.",
        salesperson: "Pato Jr.",
        leasable: true,
        buyable: true,
        leaseRate: 0.02,
        depreciationRate: 0.01,
        insuranceRate: 0.015
    },

    {
        id: 7,
        name: "The Sprout",
        image: "./assets/vehicles/green electric car 2 passenger.jpg",
        price: 8500,
        tier: "reliable",
        tierName: "Reliable Rides",
        type: "Electric Micro Car",
        year: 2019,
        mileage: 22000,
        color: "Leaf green",
        engine: "Electric motor, 45kW",
        features: ["Zero emissions (very eco-friendly)", "USB charging port", "Digital dashboard display", "Surprisingly zippy acceleration"],
        description: "Okay okay okay — hear me out. I KNOW she's small. I know she only seats two. But this little green machine is the FUTURE, my friend. Pure electric, charges overnight from a regular outlet, and zips around town like nobody's business. Parking? You can fit this thing in spaces other cars can only DREAM about. The range is about 80 miles per charge, which is plenty unless you're commuting to the next country. She's cheap to run, fun to drive, and green in every sense of the word. You're gonna LOVE this one.",
        quirks: "Other cars don't notice her in traffic because she's so quiet and small. The horn sounds like a bicycle bell, which is oddly fitting. There's a little sprout air freshener hanging from the mirror that the previous owner refused to remove as part of the sale. It stays with the car. Those are the rules.",
        salesperson: "Pato Jr.",
        leasable: true,
        buyable: true,
        leaseRate: 0.02,
        depreciationRate: 0.01,
        insuranceRate: 0.015
    },

    {
        id: 8,
        name: "The Blossom",
        image: "./assets/vehicles/pink hybrid car.jpg",
        price: 14000,
        tier: "reliable",
        tierName: "Reliable Rides",
        type: "Hybrid Sedan",
        year: 2020,
        mileage: 34000,
        color: "Rose pink",
        engine: "Hybrid 4-cylinder, 1.6L + electric motor",
        features: ["Hybrid fuel economy (amazing mileage)", "Touchscreen infotainment", "Lane departure warning", "Heated front seats"],
        description: "This is the top of the Reliable Rides tier and honestly? She could pass for mid-range. The Blossom is a hybrid — she sips fuel like a refined snake sipping tea. That pink isn't just a color, it's a STATEMENT. You pull up in this and people know you've got taste AND financial sense. Low mileage, modern safety features, and a ride so smooth you'll forget you're driving a budget car. She's the best value on the lot right now. You're gonna LOVE this one.",
        quirks: "The previous owner exclusively listened to smooth jazz in this car, and somehow the seats still feel... sophisticated because of it. The pink paint sparkles slightly in direct sunlight — the original owner paid extra for that. There's a flower-shaped scratch on the trunk that actually looks intentional.",
        salesperson: "Pato Jr.",
        leasable: true,
        buyable: true,
        leaseRate: 0.02,
        depreciationRate: 0.01,
        insuranceRate: 0.015
    },

    // ========================================
    // MID-RANGE — IDs 9-13
    // Salesperson: Mix of Pato Jr. and Pato Sr.
    // Price range: $16,000–$35,000
    // Lease rate: 1.5% of value/month
    // Depreciation: 1.5%/month
    // Insurance: 1.2% of current value/month
    // ========================================

    {
        id: 9,
        name: "The Commuter",
        image: "./assets/vehicles/midrange car.jpg",
        price: 18000,
        tier: "midrange",
        tierName: "Mid-Range",
        type: "Sedan",
        year: 2022,
        mileage: 19000,
        color: "Slate gray",
        engine: "4-cylinder, 2.0L turbo",
        features: ["Turbocharged engine", "Apple CarPlay and Android Auto", "Blind spot monitoring", "Leather-wrapped steering wheel"],
        description: "Now THIS is what I call a responsible purchase. The Commuter is everything you need and nothing you don't. Turbo engine for when you need to merge with confidence, modern tech so you're not living in the past, and enough room for the whole family. She's practical, she's smart, and she looks good doing it. My dad would say she's boring. I say she's EFFICIENT. You're gonna love this one.",
        quirks: "The turbo makes a little whistle when you floor it that sounds like a tiny cheerleader. The seat memory has three settings — all saved by the previous owner who was apparently three different heights depending on the day. The trunk has a false bottom with a secret compartment that contains... nothing. But it COULD contain something. Mysterious.",
        salesperson: "Pato Jr.",
        leasable: true,
        buyable: true,
        leaseRate: 0.015,
        depreciationRate: 0.015,
        insuranceRate: 0.012
    },

    {
        id: 10,
        name: "The Rugged Plum",
        image: "./assets/vehicles/purple jeep.jpg",
        price: 24000,
        tier: "midrange",
        tierName: "Mid-Range",
        type: "SUV",
        year: 2021,
        mileage: 31000,
        color: "Deep purple",
        engine: "V6, 3.6L",
        features: ["4x4 all-wheel drive", "Removable roof panels", "All-terrain tires", "Tow package (5,000 lb rated)"],
        description: "Purple. PURPLE! Look at this thing! She's got personality, she's got power, and she goes anywhere. Mud, sand, gravel, that weird road outside of Dusty Flats that's technically a river sometimes — the Rugged Plum doesn't care. V6 engine, four-wheel drive, removable roof for when the Snakesian sun is shining. This is the car for snakes who have places to BE and don't care if there's a road to get there.",
        quirks: "The purple paint was a custom order that the original buyer's spouse apparently vetoed too late. There are still traces of a bumper sticker that said 'If you can read this, you're off-road too.' The all-terrain tires have a very specific hum at 55 mph that sounds almost musical.",
        salesperson: "Sal",
        leasable: true,
        buyable: true,
        leaseRate: 0.015,
        depreciationRate: 0.015,
        insuranceRate: 0.012
    },

    {
        id: 11,
        name: "The Volt Viper",
        image: "./assets/vehicles/yellow electric car.jpg",
        price: 28000,
        tier: "midrange",
        tierName: "Mid-Range",
        type: "Electric Sedan",
        year: 2023,
        mileage: 8000,
        color: "Sunburst yellow",
        engine: "Dual electric motors, 200kW",
        features: ["250-mile range per charge", "Regenerative braking", "Panoramic glass roof", "0-60 in 5.2 seconds"],
        description: "This car is from the FUTURE, kid. Full electric, dual motors, and she's yellow because she wants everyone to KNOW she's coming. 250 miles on a single charge — you could drive from one end of Snakesia to the other and back with juice to spare. The acceleration will pin you to your seat. My cousin Sal test drove one and screamed the entire time. In a good way. Zero emissions, zero gas bills, zero regrets. This is the responsible adult car that also happens to be secretly fast. You're gonna LOVE this one.",
        quirks: "The yellow paint literally glows at dusk — something about the reflective coating. The car makes a subtle sci-fi hum when accelerating that the manufacturer calls 'acoustic vehicle alerting' but we call 'the spaceship noise.' The touchscreen has an Easter egg where if you tap the logo five times, it plays a little snake animation.",
        salesperson: "Pato Jr.",
        leasable: true,
        buyable: true,
        leaseRate: 0.015,
        depreciationRate: 0.015,
        insuranceRate: 0.012
    },

    {
        id: 12,
        name: "Big Bertha",
        image: "./assets/vehicles/sturdy 4-door truck.jpg",
        price: 32000,
        tier: "midrange",
        tierName: "Mid-Range",
        type: "Pickup Truck",
        year: 2021,
        mileage: 42000,
        color: "Gunmetal gray",
        engine: "V8, 5.0L",
        features: ["Crew cab seats five", "8-foot bed with spray-in liner", "Tow package (10,000 lb rated)", "Running boards and LED light bar"],
        description: "Now we're talking TRUCK. Big Bertha is the real deal — V8 power, crew cab, full-size bed, and she'll tow a house if you ask her nicely. The previous owner was a contractor who kept her in great shape because — and I quote — 'she's the only employee who never called in sick.' She's got some miles on her but trucks like this are built to last. You want to haul things? Tow things? Feel like the king of the Snakesian highway? Bertha's your girl. A deal's a deal, kid.",
        quirks: "There's a toolbox bolted into the bed that the previous owner included 'as a gift.' It's locked and nobody has the key. She rides a little high so shorter snakes might need the running boards, which light up at night for dramatic effect. The V8 rumble is so deep the rearview mirror vibrates slightly at idle.",
        salesperson: "Pato Sr.",
        leasable: true,
        buyable: true,
        leaseRate: 0.015,
        depreciationRate: 0.015,
        insuranceRate: 0.012
    },

    {
        id: 13,
        name: "The Shadow",
        image: "./assets/vehicles/upper mid range black car.jpg",
        price: 35000,
        tier: "midrange",
        tierName: "Mid-Range",
        type: "Sport Sedan",
        year: 2023,
        mileage: 11000,
        color: "Midnight black",
        engine: "4-cylinder, 2.5L turbo",
        features: ["Sport-tuned suspension", "Heated and cooled leather seats", "360-degree camera system", "Premium sound system"],
        description: "All black everything. The Shadow is the top of the mid-range tier and she KNOWS it. Sport-tuned suspension so she hugs corners, turbo engine so she's got punch, and that midnight black paint makes her disappear at night — which is honestly a safety concern but it looks INCREDIBLE. Premium leather, premium sound, premium everything. She's for the snake who's done being practical and wants to start being cool. But like, responsibly cool. The best kind.",
        quirks: "The black paint shows every single speck of dust, which means she always looks either immaculate or terrible — no in between. The sport suspension means you feel every pebble on the road, which the previous owner described as 'connected to the earth.' The headlights have a little sweep animation when you unlock her. Very dramatic.",
        salesperson: "Pato Jr.",
        leasable: true,
        buyable: true,
        leaseRate: 0.015,
        depreciationRate: 0.015,
        insuranceRate: 0.012
    },

    // ========================================
    // PREMIUM — IDs 14-18
    // Salesperson: Pato Sr. (sentimental)
    // Price range: $40,000–$80,000
    // NO LEASING — buy only
    // Depreciation: 2.0%/month
    // Insurance: 1.0% of current value/month
    // ========================================

    {
        id: 14,
        name: "The War Machine",
        image: "./assets/vehicles/weird military looking truck.jpg",
        price: 42000,
        tier: "premium",
        tierName: "Premium",
        type: "Tactical Truck",
        year: 2022,
        mileage: 15000,
        color: "Matte olive drab",
        engine: "V8, 6.2L diesel",
        features: ["Armored body panels", "Portal axles for extreme clearance", "Roof-mounted searchlight", "Snorkel intake (fords rivers)"],
        description: "This one's... different. I'm not even sure how we got it. Sal says he won it in a card game, but Sal says a lot of things. She's built like a tank, drives like a tank, and gets the gas mileage of a tank. But you know what? Nobody — and I mean NOBODY — is going to mess with you on the road. She'll go through anything. Over anything. Probably through a wall if you asked her to. This one's special, kid. Not pretty-special. SCARY-special.",
        quirks: "The horn sounds like an air raid siren, which is both terrifying and kind of cool. The glove box is lockable and reinforced — we don't know why. There's a mount on the roof that Sal insists is 'for a flag' but it looks suspiciously like it was meant for something else. The diesel engine is so loud you can hear her from three blocks away.",
        salesperson: "Sal",
        leasable: false,
        buyable: true,
        leaseRate: 0,
        depreciationRate: 0.02,
        insuranceRate: 0.01
    },

    {
        id: 15,
        name: "The Copperhead",
        image: "./assets/vehicles/classic muscle car.jpg",
        price: 55000,
        tier: "premium",
        tierName: "Premium",
        type: "Muscle Car",
        year: 1971,
        mileage: 48000,
        color: "Burnt orange",
        engine: "V8, 7.0L (426 Hemi)",
        features: ["Numbers-matching Hemi engine", "4-speed manual transmission", "Restored original interior", "Rally stripes (hand-painted)"],
        description: "Oh... oh kid. Come here. Look at this. Just... look at her. The Copperhead is a 1971 original with a numbers-matching Hemi under the hood. She's been restored with love — not factory love, BETTER than factory love. That burnt orange paint? Original color, hand-mixed to match. The rumble when you turn that key... it's not a sound, it's a FEELING. I've had this car on the lot for two months and I almost don't want to sell her. Almost. A deal's a deal. This one's special, kid.",
        quirks: "She has no power steering, no ABS, no traction control, and no mercy. The 4-speed manual has a heavy clutch that builds character. The exhaust note at idle sounds like a sleeping dragon. There's a tiny snake etched into the dashboard by a previous owner — nobody knows when or why, but it feels right.",
        salesperson: "Pato Sr.",
        leasable: false,
        buyable: true,
        leaseRate: 0,
        depreciationRate: 0.02,
        insuranceRate: 0.01
    },

    {
        id: 16,
        name: "The Duchess",
        image: "./assets/vehicles/luxury classic convertible car.jpg",
        price: 62000,
        tier: "premium",
        tierName: "Premium",
        type: "Convertible",
        year: 1965,
        mileage: 32000,
        color: "Pearl white with red interior",
        engine: "Straight-6, 4.0L",
        features: ["Power convertible top", "Chrome wire wheels", "White-wall tires", "Walnut wood dashboard trim"],
        description: "The Duchess doesn't drive. The Duchess ARRIVES. This 1965 convertible is pure class — pearl white paint that glows in the Snakesian sunset, red leather interior that smells like old money, and chrome details you can see your reflection in. She's not fast, she's not aggressive — she doesn't need to be. When you drive The Duchess, everybody already knows. My wife says this car has more elegance in one hubcap than I have in my entire body. She's probably right. This one's special, kid.",
        quirks: "The convertible top mechanism plays a gentle whirring melody that sounds almost like a music box. The rearview mirror has a tiny crack shaped like a heart that the previous owner refused to fix because their spouse said it was romantic. The horn plays a dignified 'ahooga.' The red leather seats are somehow always the perfect temperature.",
        salesperson: "Pato Sr.",
        leasable: false,
        buyable: true,
        leaseRate: 0,
        depreciationRate: 0.02,
        insuranceRate: 0.01
    },

    {
        id: 17,
        name: "The Amethyst",
        image: "./assets/vehicles/nice electric purple 4 door truck.jpg",
        price: 72000,
        tier: "premium",
        tierName: "Premium",
        type: "Electric Pickup Truck",
        year: 2025,
        mileage: 3200,
        color: "Deep amethyst purple",
        engine: "Quad electric motors, 600kW",
        features: ["300-mile range per charge", "Frunk (front trunk) storage", "Adaptive air suspension", "Integrated bed power outlets (240V)"],
        description: "The future of trucks is here, and she's PURPLE. The Amethyst is all-electric with quad motors — one for each wheel — and she'll tow a boat while doing zero to sixty in four seconds flat. The bed has built-in power outlets strong enough to run a construction site. The frunk up front holds more than most car trunks. And that purple... it's not just purple, it's DEEP purple. Like staring into a gem. I don't even like trucks that much and this one makes me emotional. This one's special, kid.",
        quirks: "The acceleration is so instant that the first owner spilled coffee on himself three separate times before learning to respect the throttle. The truck makes a subtle humming chord when you lock it — different notes depending on the battery level. The tailgate has a built-in step that folds out, which Sal calls 'the gentleman's entrance.'",
        salesperson: "Pato Sr.",
        leasable: false,
        buyable: true,
        leaseRate: 0,
        depreciationRate: 0.02,
        insuranceRate: 0.01
    },

    {
        id: 18,
        name: "The Monarch",
        image: "./assets/vehicles/luxury SUV.jpg",
        price: 78000,
        tier: "premium",
        tierName: "Premium",
        type: "Luxury SUV",
        year: 2024,
        mileage: 8500,
        color: "Obsidian black",
        engine: "Twin-turbo V6, 3.0L",
        features: ["Massage seats (front and rear)", "Air suspension with adjustable ride height", "Premium surround sound system", "Third-row seating"],
        description: "The Monarch doesn't just drive — she REIGNS. This is the kind of SUV that makes other SUVs feel bad about themselves. Twin-turbo V6 for power, air suspension for comfort, massage seats because you DESERVE it, and enough room to bring the whole family plus their luggage plus a small piece of furniture if needed. The interior is all hand-stitched leather and real wood trim. Every surface you touch feels expensive because it IS expensive. You sure you're ready for this? This one's special, kid.",
        quirks: "The massage seats have seven different modes and the previous owner only ever used 'Deep Tissue Deluxe.' The ambient interior lighting can be set to any color — the trade-in paperwork noted the previous owner's preferred setting was 'sunset romance.' The doors close with a satisfying thunk that sounds like money.",
        salesperson: "Pato Sr.",
        leasable: false,
        buyable: true,
        leaseRate: 0,
        depreciationRate: 0.02,
        insuranceRate: 0.01
    },

    // ========================================
    // SHOWROOM ELITE — IDs 19-23
    // Salesperson: Pato Sr. (dead serious)
    // Price range: $100,000–$300,000
    // NO LEASING — buy only
    // Depreciation: 2.5%/month
    // Insurance: 0.8% of current value/month
    // ========================================

    {
        id: 19,
        name: "The Sovereign",
        image: "./assets/vehicles/luxury car.jpg",
        price: 105000,
        tier: "elite",
        tierName: "Showroom Elite",
        type: "Luxury Sedan",
        year: 2025,
        mileage: 4200,
        color: "Midnight blue metallic",
        engine: "Twin-turbo V8, 4.0L",
        features: ["Executive rear seating with recline", "Refrigerated center console", "Night vision assist", "Handcrafted interior by Snakesian artisans"],
        description: "Sit down, kid. No, really — sit down. I need you to understand what you're looking at. The Sovereign isn't a car. It's a statement. It's a lifestyle. It's rolling proof that you made it. Twin-turbo V8 that whispers instead of roars, because when you have this much power you don't need to be loud about it. The back seat is nicer than most snakes' living rooms. You sure you're ready for this?",
        quirks: "The doors are so heavy and well-insulated that when you close them, the outside world just... disappears. The refrigerated console came stocked with sparkling water from the previous owner, which we left in there because it felt wrong to remove it. The seat leather is so soft that Sal sat in it once and fell asleep in eleven minutes. We timed it.",
        salesperson: "Pato Sr.",
        leasable: false,
        buyable: true,
        leaseRate: 0,
        depreciationRate: 0.025,
        insuranceRate: 0.008
    },

    {
        id: 20,
        name: "The Grand Basilisk",
        image: "./assets/vehicles/high end classy car.jpg",
        price: 145000,
        tier: "elite",
        tierName: "Showroom Elite",
        type: "Grand Tourer",
        year: 2024,
        mileage: 6100,
        color: "British racing green",
        engine: "V12, 6.0L naturally aspirated",
        features: ["Naturally aspirated V12 (no turbos needed)", "Hand-stitched leather dashboard", "Crystal gear selector", "Bespoke luggage set in trunk"],
        description: "A V12. Naturally aspirated. Do you know what that means? It means twelve cylinders breathing freely, making a sound that would make angels weep. The Grand Basilisk is old-school luxury — no screens replacing buttons, no beeping when you drift out of your lane. Just a massive engine, impeccable craftsmanship, and the kind of presence that makes valets nervous. She comes with a matching luggage set in the trunk because the people who buy this car go places. You sure you're ready for this?",
        quirks: "The V12 engine note changes character at exactly 4,000 RPM from a refined hum to something primal and magnificent. The crystal gear selector catches the light and throws little rainbows around the cabin. The previous owner left a pair of driving gloves in the glove box that fit perfectly — we think the car comes with them.",
        salesperson: "Pato Sr.",
        leasable: false,
        buyable: true,
        leaseRate: 0,
        depreciationRate: 0.025,
        insuranceRate: 0.008
    },

    {
        id: 21,
        name: "The Venom GT",
        image: "./assets/vehicles/high end european car.jpg",
        price: 190000,
        tier: "elite",
        tierName: "Showroom Elite",
        type: "Sports Car",
        year: 2025,
        mileage: 1800,
        color: "Titanium silver",
        engine: "Twin-turbo flat-6, 4.0L",
        features: ["Rear-engine, rear-wheel drive", "Carbon ceramic brakes", "Active rear spoiler", "Launch control system"],
        description: "This is not a car for beginners. The Venom GT is a European-engineered precision instrument that happens to have four wheels and a steering wheel. Flat-six in the back, twin turbos screaming, carbon brakes that could stop a freight train. She corners like she's on rails and accelerates like she's personally offended by the concept of standing still. The previous owner traded her in because — and I am not making this up — 'she was too fast and it scared me.' Respect this car, kid. You sure you're ready for this?",
        quirks: "The active spoiler rises and falls based on speed, which Pato Jr. calls 'the car doing push-ups.' The flat-six makes a distinctive wail above 5,000 RPM that can be heard from two blocks away. The key is shaped like the car itself, which is either adorable or excessive depending on your outlook. There's a launch control button that has a flip-up safety cover like a missile switch.",
        salesperson: "Pato Sr.",
        leasable: false,
        buyable: true,
        leaseRate: 0,
        depreciationRate: 0.025,
        insuranceRate: 0.008
    },

    {
        id: 22,
        name: "The Pink Mamba",
        image: "./assets/vehicles/luxury pink car.jpg",
        price: 225000,
        tier: "elite",
        tierName: "Showroom Elite",
        type: "Exotic Coupe",
        year: 2025,
        mileage: 900,
        color: "Mamba pink (custom)",
        engine: "V10, 5.2L naturally aspirated",
        features: ["V10 that revs to 8,500 RPM", "Scissor doors", "Custom Mamba pink paint (one of one)", "Carbon fiber everything"],
        description: "I need you to take a breath. Are you breathing? Good. The Pink Mamba is a one-of-one custom build with a V10 engine, scissor doors, and a paint job that cost more than most cars on this lot. That pink isn't just pink — it's Mamba Pink, a custom color mixed specifically for this car by a Snakesian paint master who retired after this job because he said he'd peaked. She revs to eighty-five hundred RPM and sounds like the end of the world in the best possible way. Only 900 miles on her. You sure you're ready for this?",
        quirks: "The scissor doors make everyone within a 50-foot radius stop and stare every single time. The V10 at full throttle has been compared to 'a symphony conducted by a maniac.' The custom pink paint has micro-flake metallic particles that shift between pink and gold in different light. Sal tried to sit in this car once and Pato Sr. physically blocked him.",
        salesperson: "Pato Sr.",
        leasable: false,
        buyable: true,
        leaseRate: 0,
        depreciationRate: 0.025,
        insuranceRate: 0.008
    },

    {
        id: 23,
        name: "The Apex Predator",
        image: "./assets/vehicles/hyper modern sports car luxury.jpg",
        price: 300000,
        tier: "elite",
        tierName: "Showroom Elite",
        type: "Hypercar",
        year: 2026,
        mileage: 200,
        color: "Carbon black with neon accents",
        engine: "Hybrid V8 + triple electric motors, 1,200 HP",
        features: ["1,200 combined horsepower", "Active aerodynamics (DRS system)", "Monocoque carbon fiber chassis", "0-60 in 2.1 seconds"],
        description: "... \n\nKid. Come into my office. Close the door. \n\nWhat you're looking at is the most expensive, most powerful, most absurd machine on this lot. On ANY lot. The Apex Predator is a hybrid hypercar with twelve hundred horsepower, active aerodynamics, and a carbon fiber body that weighs less than some motorcycles. She does zero to sixty in two point one seconds. TWO POINT ONE. This car was built to break records, win races, and make grown snakes cry. She's got 200 miles on her because the previous owner was too intimidated to drive her more than once. This isn't just a car, kid. This is a legend you can park in your garage. You sure you're ready for this?",
        quirks: "The neon accent lighting pulses gently when the car is parked, like it's breathing. The DRS rear wing deploys at speed with an audible CHUNK that Pato Jr. says sounds like a transformer. The steering wheel is shaped like a fighter jet yoke. The key fob has a tiny screen that shows the car's vital stats in real time. Pato Sr. keeps this one in a separate section of the lot with a velvet rope.",
        salesperson: "Pato Sr.",
        leasable: false,
        buyable: true,
        leaseRate: 0,
        depreciationRate: 0.025,
        insuranceRate: 0.008
    }

];
