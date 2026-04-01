// ============================================================
// Mallard Realty — Property Listings
// All prices in USD (displayed as snakes ×2 in UI)
// Images ordered 1-23 from lowest to highest value
// ============================================================

var MALLARD_PROPERTIES = [

    // ========================================
    // DUSTY FLATS — IDs 1-3
    // Agent: Hank Pondsworth (brutally honest)
    // Price range: $15,000–$25,000
    // Rent rate: 1.5% of value/month
    // ========================================

    {
        id: 1,
        name: "The Dusty Shack",
        image: "./assets/properties/1.png",
        price: 15000,
        neighborhood: "dusty-flats",
        neighborhoodName: "Dusty Flats",
        address: "14 Tumbleweed Rd",
        type: "Shack",
        bedrooms: 1,
        bathrooms: 1,
        sqft: 380,
        yearBuilt: 1953,
        description: "Look, I'm not gonna sugarcoat this one. It's a shack. The porch leans a little — okay, a lot — and the roof has what I'd generously call 'natural ventilation.' But you know what? It's got walls. Most of them. The upstairs window gives it character, and the lot is huge because nobody else wanted to build near it. If you're the kind of snake who sees 'fixer-upper' and gets excited instead of nauseous, this is your place. Cheapest property in all of Snakesia. That's gotta count for something.",
        features: [
            "Covered front porch (load-tested up to one snake)",
            "Spacious lot with zero neighbors",
            "Corrugated metal accent walls (rustic chic)",
            "Upstairs loft window for stargazing"
        ],
        quirks: "The previous owner swore the house was level and the rest of Snakesia was crooked. There's a barrel out back that nobody has opened. Nobody wants to.",
        agent: "Hank Pondsworth",
        rentable: true,
        buyable: true,
        rentRate: 0.015
    },

    {
        id: 2,
        name: "Pebble Creek Cottage",
        image: "./assets/properties/2.png",
        price: 20000,
        neighborhood: "dusty-flats",
        neighborhoodName: "Dusty Flats",
        address: "7 Gravel Ln",
        type: "Cottage",
        bedrooms: 1,
        bathrooms: 1,
        sqft: 450,
        yearBuilt: 1967,
        description: "This is what I call an 'honest' house. It's small, the paint's seen better decades, and the front yard is mostly rocks. But the bones are decent — wooden frame, real door, two windows that both open AND close. That's luxury out here in Dusty Flats. The attic vent up top lets you pretend you have a second floor. Previous owners kept it standing for 60 years, so it's clearly not going anywhere. Probably.",
        features: [
            "Solid wooden frame construction",
            "Functional front door with working knob",
            "Two symmetrical windows (very classy)",
            "Covered porch — big enough for a chair"
        ],
        quirks: "The trash can out front has been there longer than the house. Locals consider it a landmark. Please don't move it.",
        agent: "Hank Pondsworth",
        rentable: true,
        buyable: true,
        rentRate: 0.015
    },

    {
        id: 3,
        name: "Sunny Acres Mobile Estate",
        image: "./assets/properties/3.png",
        price: 25000,
        neighborhood: "dusty-flats",
        neighborhoodName: "Dusty Flats",
        address: "22 Flatline Dr",
        type: "Mobile Home",
        bedrooms: 2,
        bathrooms: 1,
        sqft: 620,
        yearBuilt: 1978,
        description: "Now THIS is the crown jewel of Dusty Flats. Two bedrooms! A propane hookup! An awning that provides at least four feet of shade! I know 'mobile home' sounds temporary, but trust me, this thing hasn't moved since the Carter administration and it's not starting now. The steps up front are metal — very industrial, very sturdy. Inside you've got more square footage than both other Dusty Flats properties combined. If you squint, this is basically a ranch house that's just... closer to the ground.",
        features: [
            "Two bedrooms (the second one fits a bed AND a thought)",
            "Propane tank included",
            "Metal entry stairs with safety railing",
            "Covered awning — practically a patio"
        ],
        quirks: "The previous owner called it 'The Palace' without a hint of irony. The name stuck. Neighbors still refer to it that way.",
        agent: "Hank Pondsworth",
        rentable: true,
        buyable: true,
        rentRate: 0.015
    },

    // ========================================
    // PINE HOLLOW — IDs 4-6
    // Agent: Hank Pondsworth (budget/honest)
    // Price range: $30,000–$55,000
    // Rent rate: 1.2% of value/month
    // ========================================

    {
        id: 4,
        name: "Timber Peak A-Frame",
        image: "./assets/properties/4.png",
        price: 30000,
        neighborhood: "pine-hollow",
        neighborhoodName: "Pine Hollow",
        address: "3 Pinecone Trail",
        type: "A-Frame Cabin",
        bedrooms: 1,
        bathrooms: 1,
        sqft: 540,
        yearBuilt: 1971,
        description: "Alright, I'll level with you — this is a triangle. You're buying a triangle. BUT, it's a charming triangle nestled right in the pines with that classic A-frame look that never goes out of style. Cozy living space downstairs, loft sleeping area up top where the roof angles in and bonks you on the head if you sit up too fast. The cedar shingle exterior actually looks great, and the trees around it make you feel like you're miles from civilization. You basically are, but in a good way.",
        features: [
            "Classic cedar shingle A-frame design",
            "Loft bedroom with vaulted ceiling",
            "Surrounded by mature pine trees",
            "Three front-facing windows for natural light"
        ],
        quirks: "A family of woodpeckers has claimed the north side as their ancestral home. They're very punctual — every morning at 6 AM.",
        agent: "Hank Pondsworth",
        rentable: true,
        buyable: true,
        rentRate: 0.012
    },

    {
        id: 5,
        name: "Mossy Brook Bungalow",
        image: "./assets/properties/5.png",
        price: 42000,
        neighborhood: "pine-hollow",
        neighborhoodName: "Pine Hollow",
        address: "18 Fern Rd",
        type: "Bungalow",
        bedrooms: 2,
        bathrooms: 1,
        sqft: 780,
        yearBuilt: 1985,
        description: "Now we're talking. This is a proper little house — vinyl siding, shingled roof, a porch with actual railings. The flower bed out front even has flowers in it, which is more than I can say for half the properties I sell. Two bedrooms, a real kitchen, and enough space to have a guest over without making them sleep in the bathtub. It's tucked into the trees but close enough to the road that the pizza delivery guy will actually find you. Best value in Pine Hollow if you ask me.",
        features: [
            "Covered front porch with railing",
            "Landscaped flower bed (flowers included!)",
            "Concrete walkway — no more muddy boots",
            "Two bedrooms with closet space"
        ],
        quirks: "The mailbox is about 200 yards from the front door down a gravel path. The walk builds character. And calves.",
        agent: "Hank Pondsworth",
        rentable: true,
        buyable: true,
        rentRate: 0.012
    },

    {
        id: 6,
        name: "Willow Glen Ranch",
        image: "./assets/properties/6.png",
        price: 55000,
        neighborhood: "pine-hollow",
        neighborhoodName: "Pine Hollow",
        address: "9 Birchwood Ave",
        type: "Ranch",
        bedrooms: 3,
        bathrooms: 1,
        sqft: 960,
        yearBuilt: 1992,
        description: "This is the nicest thing I've ever been asked to sell, and honestly I feel a little out of my league. Three bedrooms, fresh-looking siding, trimmed hedges — someone actually took CARE of this place. The front porch has columns. COLUMNS. There's a gabled entryway that makes you feel like you're walking into somewhere important. The lawn is green and mowed. I keep checking the address because this doesn't feel like a property I should be handling. If you can swing it, this is Pine Hollow's best kept secret.",
        features: [
            "Three bedrooms — actual rooms with doors",
            "Gabled front entry with decorative columns",
            "Manicured lawn and sculpted hedges",
            "Vinyl siding in excellent condition"
        ],
        quirks: "The previous owner left behind a very detailed lawn care schedule taped inside the kitchen cabinet. It's color-coded. Following it is not required, but the neighbors will know if you don't.",
        agent: "Hank Pondsworth",
        rentable: true,
        buyable: true,
        rentRate: 0.012
    },

    // ========================================
    // DOWNTOWN SNAKE VALLEY — IDs 7, 10, 12
    // Agent: Victor Quackwell (urban/trying to be cool)
    // Price range: $75,000–$130,000
    // Rent rate: 1.0% of value/month
    // ========================================

    {
        id: 7,
        name: "The Copperhead Arms",
        image: "./assets/properties/7.png",
        price: 75000,
        neighborhood: "downtown",
        neighborhoodName: "Downtown Snake Valley",
        address: "110 Copper St, Unit 3B",
        type: "Apartment",
        bedrooms: 2,
        bathrooms: 1,
        sqft: 850,
        yearBuilt: 1948,
        description: "Yo, this brownstone is OG downtown. We're talking pre-renovation, pre-gentrification, been-here-since-the-beginning energy. Your unit's on the third floor — iron balcony, street views, fire escape access for when you wanna feel dramatic. Yeah the building's got some weathering on the outside, but that's called CHARACTER, bro. Inside, the units got updated fixtures, exposed brick walls that you literally cannot fake, and the buzzer system actually works which is more than I can say for half the buildings on this block. This is the entry point into downtown living and honestly? It's kind of a flex to say you live in the Copperhead Arms. The ground floor used to be a jazz club in the '60s. You can still hear the bass if the walls vibrate right.",
        features: [
            "Exposed brick interior walls",
            "Iron balcony off the living room",
            "Updated kitchen and bathroom fixtures",
            "Secure building entry with buzzer system"
        ],
        quirks: "The building has a ghost named Gerald. He's harmless — mostly just opens cabinets and hides socks. Tenants have learned to buy socks in bulk.",
        agent: "Victor Quackwell",
        rentable: true,
        buyable: true,
        rentRate: 0.01
    },

    // ========================================
    // CLOVERFIELD — IDs 8, 9, 11, 13
    // Agent: Lily Featherstone (suburban/perky)
    // Price range: $60,000–$110,000
    // Rent rate: 0.9% of value/month
    // ========================================

    {
        id: 8,
        name: "Cloverfield Heights Ranch",
        image: "./assets/properties/8.png",
        price: 78000,
        neighborhood: "cloverfield",
        neighborhoodName: "Cloverfield",
        address: "42 Dandelion Dr",
        type: "Ranch",
        bedrooms: 3,
        bathrooms: 1,
        sqft: 1150,
        yearBuilt: 1988,
        description: "This is it!! This is the one you show your parents and they finally stop worrying about you!! Three bedrooms, an attached garage, trimmed hedges, a DRIVEWAY — this home has everything a young snake needs to feel like a real grown-up! The open layout is perfect for hosting game nights or just sprawling out on the living room floor! The backyard has mature trees for shade and the neighborhood is super quiet! I've sold four families into this street and they ALL send me holiday cards! ALL OF THEM!!",
        features: [
            "Attached single-car garage",
            "Large picture window in living room",
            "Paved driveway with room for two cars",
            "Mature trees in front and back yard"
        ],
        quirks: "The garage door makes a sound exactly like a tuba when it opens. The neighbors set their watches by it.",
        agent: "Lily Featherstone",
        rentable: true,
        buyable: true,
        rentRate: 0.009
    },

    {
        id: 9,
        name: "Clover Lane Split-Level",
        image: "./assets/properties/9.png",
        price: 92000,
        neighborhood: "cloverfield",
        neighborhoodName: "Cloverfield",
        address: "15 Clover Ln",
        type: "Split-Level",
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1280,
        yearBuilt: 1994,
        description: "Oh you are going to LOVE this one! It's got that gorgeous brick-and-siding combo that just screams 'I have my life together!' Three bedrooms, TWO bathrooms — that's right, no more morning bathroom negotiations! The covered entry is so welcoming, and the hedges out front are shaped by Mr. Fernsworth who lives next door and does it for free because he 'can't stand looking at uneven bushes!' The garage fits a car AND your holiday decorations! This is peak Cloverfield living!!",
        features: [
            "Brick and vinyl siding exterior",
            "Attached garage with interior access",
            "Two full bathrooms (life-changing!)",
            "Covered front entry with landscaping"
        ],
        quirks: "Mr. Fernsworth next door WILL trim your hedges whether you ask or not. Resistance is futile. His hedges have won awards.",
        agent: "Lily Featherstone",
        rentable: true,
        buyable: true,
        rentRate: 0.009
    },

    {
        id: 10,
        name: "The Millworks Loft",
        image: "./assets/properties/10.png",
        price: 130000,
        neighborhood: "downtown",
        neighborhoodName: "Downtown Snake Valley",
        address: "200 Foundry Row, Unit 4A",
        type: "Loft",
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1400,
        yearBuilt: 1932,
        description: "Alright sit down because this one's gonna change your whole perspective on downtown living. Converted textile mill from the '30s — we're talking fourteen-foot ceilings, original hardwood beams, massive factory windows on three sides that make the whole space glow. The exposed ductwork isn't a design choice, it's AUTHENTIC. There's a rooftop garden situation up top — herbs, tomatoes, vibes. Ground floor has a coffee shop so your whole lobby smells like fresh espresso every morning. This is the kind of place where you invite someone over and they physically stop in the doorway because they can't process how cool it is. I've seen it happen. Multiple times. This is the crown jewel of downtown Snake Valley and honestly I'm a little jealous of whoever gets it.",
        features: [
            "14-foot ceilings with exposed beams",
            "Massive industrial windows on three sides",
            "Shared rooftop garden with city views",
            "Ground-floor coffee shop in the building"
        ],
        quirks: "Unit 4A has a freight elevator that only goes to floors 2 and 4. Nobody knows why it skips 3. Floor 3 residents have opinions about this.",
        agent: "Victor Quackwell",
        rentable: true,
        buyable: true,
        rentRate: 0.01
    },

    {
        id: 11,
        name: "Bluebell Cottage",
        image: "./assets/properties/11.png",
        price: 68000,
        neighborhood: "cloverfield",
        neighborhoodName: "Cloverfield",
        address: "8 Bluebell Way",
        type: "Cape Cod",
        bedrooms: 2,
        bathrooms: 1,
        sqft: 1050,
        yearBuilt: 1946,
        description: "Oh my GOSH, you guys, this house is the CUTEST thing I have ever listed!! Look at that blue siding with the white trim — it's like a little storybook cottage!! The brick chimney means you have a REAL working fireplace, which is absolutely perfect for cozy winter nights! The two dormer bedrooms upstairs have these sloped ceilings that just make you want to curl up with a book! And the landscaping!! The stone walkway through the front yard is so charming I actually teared up a little the first time I saw it! This is Cloverfield's best-kept secret for first-time buyers — all the charm of a bigger home at a price that won't make your checking account cry!!",
        features: [
            "Classic blue clapboard with white trim",
            "Working brick fireplace (brings the cozy!!)",
            "Two dormer bedrooms with sloped ceilings",
            "Stone walkway through landscaped front yard"
        ],
        quirks: "The house was originally painted yellow. Every owner since has painted it blue. The one time someone tried green, the neighbors staged an intervention. Blue it stays.",
        agent: "Lily Featherstone",
        rentable: true,
        buyable: true,
        rentRate: 0.009
    },

    {
        id: 12,
        name: "Copperstone Foursquare",
        image: "./assets/properties/12.png",
        price: 105000,
        neighborhood: "downtown",
        neighborhoodName: "Downtown Snake Valley",
        address: "33 Mainline Ave",
        type: "Foursquare",
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1600,
        yearBuilt: 1921,
        description: "Bro. BRO. This Foursquare is straight-up heritage. 1921 build, brick-and-siding combo, wide covered porch — they literally do not make them like this anymore. Three bedrooms upstairs, the whole downstairs is your living situation with the original trim work still intact. The porch columns are thick — I'm talking STRUCTURAL thick, not decorative thick. This place has hosted a hundred years of downtown Snake Valley history and it's still standing there looking better than most new builds. You walk up to this house and people KNOW you're serious about real estate.",
        features: [
            "Original 1921 trim and millwork throughout",
            "Wide covered front porch with brick columns",
            "Three upstairs bedrooms with hardwood floors",
            "Fenced backyard with mature landscaping"
        ],
        quirks: "There's a tiny door in the upstairs hallway that leads to a crawlspace. Every owner has found exactly one mysterious object in there. It's tradition to leave one behind for the next owner.",
        agent: "Victor Quackwell",
        rentable: true,
        buyable: true,
        rentRate: 0.01
    },

    {
        id: 13,
        name: "The Fieldstone Craftsman",
        image: "./assets/properties/13.png",
        price: 110000,
        neighborhood: "cloverfield",
        neighborhoodName: "Cloverfield",
        address: "7 Cloverfield Crest",
        type: "Craftsman",
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1850,
        yearBuilt: 1918,
        description: "Okay I need everyone to take a deep breath because THIS IS THE ONE!! A 1918 Craftsman bungalow and it is GORGEOUS!! The original cedar shingle siding! The stone foundation! Those tapered porch columns!! I can't even talk about the wrap-around porch without getting emotional — it's SO perfect for morning coffee or watching the fireflies in the summer! Inside there are built-in bookshelves, window seats, original woodwork that you just cannot find anymore!! The flower beds out front have won ACTUAL AWARDS — the Cloverfield Garden Society has a plaque and everything!! This is the crown jewel of the entire neighborhood and I am not exaggerating when I say I have cried at two separate open houses for this property!! Happy tears!! SO many happy tears!!",
        features: [
            "Original cedar shingle and stone exterior",
            "Wrap-around porch with tapered columns",
            "Built-in bookshelves and window seats",
            "Award-winning landscaping and flower beds"
        ],
        quirks: "The attic has a perfectly preserved collection of newspapers from 1918. The headlines are wild. The previous owner refused to move them, claiming they 'came with the house' like a load-bearing wall.",
        agent: "Lily Featherstone",
        rentable: true,
        buyable: true,
        rentRate: 0.009
    },

    // ========================================
    // MAPLE HEIGHTS — IDs 14-18
    // Agent: Darla Duckworth (luxury/enthusiastic)
    // Price range: $150,000–$350,000
    // Rent rate: N/A (buy only)
    // ========================================

    {
        id: 14,
        name: "The Maplewood Colonial",
        image: "./assets/properties/14.png",
        price: 150000,
        neighborhood: "maple-heights",
        neighborhoodName: "Maple Heights",
        address: "24 Maple Crest Dr",
        type: "Colonial",
        bedrooms: 4,
        bathrooms: 2,
        sqft: 2200,
        yearBuilt: 2001,
        description: "Welcome to Maple Heights, darling! This classic colonial is the perfect introduction to our most distinguished neighborhood! Four bedrooms, a symmetrical facade that just radiates elegance, and those gorgeous shuttered windows — chef's kiss! The front walkway is lined with mature hedges, and the chimney tells you there's a fireplace waiting for you inside. Every room has been thoughtfully proportioned — this is the kind of home where you host dinner parties and everyone comments on how lovely everything is. The school ratings on this street? Impeccable. The neighbors? Delightful. You belong here, I can feel it!",
        features: [
            "Classic symmetrical colonial design",
            "Four spacious bedrooms on the second floor",
            "Working fireplace with brick chimney",
            "Manicured front lawn with mature hedges"
        ],
        quirks: "The HOA newsletter is 12 pages long and published monthly. There's a gossip column on page 8 written anonymously by someone who signs off as 'The Maple Maven.' Everyone suspects Darlene from 22 Maple Crest.",
        agent: "Darla Duckworth",
        rentable: false,
        buyable: true,
        rentRate: 0
    },

    {
        id: 15,
        name: "Blackshutter Manor",
        image: "./assets/properties/15.png",
        price: 210000,
        neighborhood: "maple-heights",
        neighborhoodName: "Maple Heights",
        address: "11 Prestige Ln",
        type: "Colonial",
        bedrooms: 4,
        bathrooms: 3,
        sqft: 2600,
        yearBuilt: 2005,
        description: "Oh, NOW we're talking serious real estate! Blackshutter Manor is what happens when a colonial decides to dress up for the gala. Those striking dark shutters against the cream siding? Absolutely commanding. The arched entryway with the covered portico? You feel important just walking to your own front door. Four bedrooms, three bathrooms, dormer windows that flood the upstairs with natural light — this home was designed for a family that appreciates the finer things. The hedgerow is trimmed to perfection, the lawn is championship-grade, and the whole property says 'I've arrived' without being gauche about it. This is Maple Heights at its finest!",
        features: [
            "Grand arched entryway with covered portico",
            "Dramatic black shutters on cream siding",
            "Three full bathrooms including primary ensuite",
            "Dormer windows with premium millwork"
        ],
        quirks: "The doorbell plays a custom chime that the original owner composed herself. It sounds vaguely like a lullaby but nobody can place which one. Visitors have been known to hum it for days afterward.",
        agent: "Darla Duckworth",
        rentable: false,
        buyable: true,
        rentRate: 0
    },

    {
        id: 16,
        name: "Stonerow Townhome",
        image: "./assets/properties/16.png",
        price: 265000,
        neighborhood: "maple-heights",
        neighborhoodName: "Maple Heights",
        address: "4 Heritage Row",
        type: "Townhome",
        bedrooms: 3,
        bathrooms: 2,
        sqft: 2100,
        yearBuilt: 1895,
        description: "Darling, Heritage Row is THE most exclusive street in Maple Heights and this townhome is an absolute gem! These brownstone row homes were built in 1895 by the original Snakesian railroad families — the ornamental stonework, the iron railings, the bay windows — you simply cannot replicate this level of craftsmanship today! Your unit is the one with the turret, which means you get a circular reading nook on the third floor with panoramic views of the neighborhood. The stoop alone has more character than most entire houses! Heritage Row has its own private lamplighter who still lights the gas lamps every evening — yes, REAL gas lamps! This is living history and you could be part of it!",
        features: [
            "Original 1895 ornamental stonework facade",
            "Third-floor turret with circular reading nook",
            "Iron railings and brownstone stoop",
            "Gas-lit street with private lamplighter service"
        ],
        quirks: "The Heritage Row residents have a secret knock for the shared courtyard gate. It changes every season. If you knock wrong, Mrs. Pemberton from Unit 2 will peer out her window and shake her head slowly until you leave.",
        agent: "Darla Duckworth",
        rentable: false,
        buyable: true,
        rentRate: 0
    },

    {
        id: 17,
        name: "Briarstone Estate",
        image: "./assets/properties/17.png",
        price: 310000,
        neighborhood: "maple-heights",
        neighborhoodName: "Maple Heights",
        address: "1 Briarstone Ct",
        type: "French Country",
        bedrooms: 4,
        bathrooms: 3,
        sqft: 2800,
        yearBuilt: 2010,
        description: "I need you to sit down before I describe this property because I don't want you to faint. Briarstone Estate is a French Country masterpiece — full brick exterior, arched entryway with coach lamps, a flagstone walkway that winds through sculpted evergreens, and that gorgeous Palladian window above the door that lets golden light pour into the foyer. The interior? Hardwood throughout, a gourmet kitchen with a center island, a primary suite that has its own sitting room. The lot is on a private court — a CUL-DE-SAC, darling — which means no through traffic, ever. This is the kind of home that makes you want to learn how to arrange flowers and host brunches. I have never shown this property without someone gasping. Not once.",
        features: [
            "Full brick exterior with arched entryway",
            "Palladian window above the front door",
            "Flagstone walkway through sculpted evergreens",
            "Private cul-de-sac location"
        ],
        quirks: "The previous owner installed a doorbell camera shaped like a tiny gargoyle. It's become a beloved neighborhood landmark. Children wave to it. It has a name. It's Reginald.",
        agent: "Darla Duckworth",
        rentable: false,
        buyable: true,
        rentRate: 0
    },

    {
        id: 18,
        name: "Thornwood Victorian",
        image: "./assets/properties/18.png",
        price: 350000,
        neighborhood: "maple-heights",
        neighborhoodName: "Maple Heights",
        address: "8 Thornwood Hill",
        type: "Victorian",
        bedrooms: 5,
        bathrooms: 3,
        sqft: 3400,
        yearBuilt: 1889,
        description: "This is it. The crown jewel of Maple Heights. The Thornwood Victorian has been the talk of this neighborhood for over a century and it is EVERYTHING. Five bedrooms. Three bathrooms. A TURRET with a spiral staircase inside that leads to a private study with 270-degree views. The wrap-around porch was made for lemonade and judging the neighbors' landscaping. The fish-scale shingle detailing on the upper floors is original — 1889, darling! — and the stone foundation has survived everything Snakesia has thrown at it. The woodwork inside would make a carpenter weep. I have personally cried showing this house. Twice. I am not ashamed. If you can afford this home, you owe it to yourself to own it. This is legacy real estate.",
        features: [
            "Turret with spiral staircase and private study",
            "Wrap-around covered porch",
            "Original 1889 fish-scale shingle detailing",
            "Stone foundation with five bedrooms"
        ],
        quirks: "The turret study has a brass telescope pointed at Serpentine Estates. Nobody knows if it was installed out of curiosity or spite. Either way, you can see Mr. Snake-e's pool from up there.",
        agent: "Darla Duckworth",
        rentable: false,
        buyable: true,
        rentRate: 0
    },

    // ========================================
    // SERPENTINE ESTATES — IDs 19-23
    // Agent: Darla Duckworth (luxury/enthusiastic)
    // Price range: $400,000–$1,000,000
    // Rent rate: N/A (buy only)
    // ========================================

    {
        id: 19,
        name: "The Emerald Victorian",
        image: "./assets/properties/19.png",
        price: 400000,
        neighborhood: "serpentine-estates",
        neighborhoodName: "Serpentine Estates",
        address: "12 Serpentine Gate",
        type: "Victorian",
        bedrooms: 4,
        bathrooms: 3,
        sqft: 3200,
        yearBuilt: 1892,
        description: "Welcome to Serpentine Estates, darling. From this point forward, we are in a different world. The Emerald Victorian is the first thing you see when you pass through the gate and it sets the TONE. That stunning teal-and-cream color scheme with gold trim? Hand-selected by the original owner, a railroad magnate with exquisite taste. The turret has a bay window reading room that overlooks the entire street. The iron fence out front isn't decorative — it's wrought by the same smithy who forged the Serpentine Gates themselves. Four bedrooms, three baths, original millwork throughout, and a parlor with a fireplace that could roast a whole pig. Not that you would. But you COULD. That's what luxury means.",
        features: [
            "Stunning teal-and-cream exterior with gold trim",
            "Turret with bay window reading room",
            "Original wrought iron fence and gate",
            "Formal parlor with oversized fireplace"
        ],
        quirks: "The turret room has perfect acoustics. If you whisper in the center, someone on the opposite side can hear you clearly. The original owner used this to eavesdrop on his guests. Allegedly.",
        agent: "Darla Duckworth",
        rentable: false,
        buyable: true,
        rentRate: 0
    },

    {
        id: 20,
        name: "Gingerbread Manor",
        image: "./assets/properties/20.png",
        price: 525000,
        neighborhood: "serpentine-estates",
        neighborhoodName: "Serpentine Estates",
        address: "5 Grandview Blvd",
        type: "Queen Anne Victorian",
        bedrooms: 5,
        bathrooms: 4,
        sqft: 3800,
        yearBuilt: 1886,
        description: "I need you to prepare yourself because Gingerbread Manor is not just a house — it is a STATEMENT. This Queen Anne Victorian has the most elaborate gingerbread trim in all of Snakesia. Every single piece was hand-carved in 1886 and it has been meticulously maintained ever since. The blue siding with cream and navy trim is absolutely breathtaking. Five bedrooms, four bathrooms, a stained glass transom window above the front door that catches the morning light and turns your entire foyer into a cathedral. The covered front porch has original turned posts and spindlework that architectural historians have literally published papers about. I am not even slightly exaggerating. This house has been in textbooks. TEXTBOOKS, darling!",
        features: [
            "Hand-carved 1886 gingerbread trim throughout",
            "Stained glass transom window in the foyer",
            "Original turned porch posts and spindlework",
            "Five bedrooms with period-appropriate fixtures"
        ],
        quirks: "Every December, Gingerbread Manor wins the Serpentine Estates holiday decoration contest. It has won 14 years in a row. The other residents have stopped competing and now just vote for it preemptively in November.",
        agent: "Darla Duckworth",
        rentable: false,
        buyable: true,
        rentRate: 0
    },

    {
        id: 21,
        name: "The Glass & Grain",
        image: "./assets/properties/21.png",
        price: 650000,
        neighborhood: "serpentine-estates",
        neighborhoodName: "Serpentine Estates",
        address: "18 Architect's Row",
        type: "Modern Contemporary",
        bedrooms: 4,
        bathrooms: 3,
        sqft: 3100,
        yearBuilt: 2019,
        description: "Now THIS caused quite the stir when it went up. A modern contemporary home in Serpentine Estates? The neighbors clutched their pearls so hard several necklaces broke. But you know what happened next? They saw it finished and every single one of them shut right up. The Glass & Grain is warm wood paneling meets polished concrete meets floor-to-ceiling windows that make the whole house glow. The attached garage has heated floors — HEATED. FLOORS. The open-plan interior is all clean lines and natural light, with a floating staircase that people have literally stopped on the sidewalk to photograph through the windows. It's the newest build in the Estates and it proves that luxury doesn't have to look like 1886. Sometimes luxury looks like RIGHT NOW.",
        features: [
            "Floor-to-ceiling windows on all three levels",
            "Warm wood and polished concrete exterior",
            "Attached garage with heated floors",
            "Floating staircase visible from the street"
        ],
        quirks: "The Victorian homeowners on either side initially started a petition against the modern design. They now fight over who gets invited to the rooftop deck parties. The petition has been framed and hangs in the downstairs bathroom.",
        agent: "Darla Duckworth",
        rentable: false,
        buyable: true,
        rentRate: 0
    },

    {
        id: 22,
        name: "Villa Serpentina",
        image: "./assets/properties/22.png",
        price: 850000,
        neighborhood: "serpentine-estates",
        neighborhoodName: "Serpentine Estates",
        address: "3 Palm Terrace",
        type: "Mediterranean Villa",
        bedrooms: 6,
        bathrooms: 5,
        sqft: 5200,
        yearBuilt: 2008,
        description: "I have sold a LOT of homes in my career, darling, but Villa Serpentina is the one that made me reconsider my own life choices. Six bedrooms. Five bathrooms. A COURTYARD with a FOUNTAIN that you walk past every single time you come home. The terracotta roof tiles were imported from the coast. The arched windows, the iron juliet balconies, the Italian cypress trees flanking the entrance — this is not a house, this is a LIFESTYLE. The interior has marble floors, a chef's kitchen with dual ovens, and a primary suite with its own sitting room AND a balcony overlooking the courtyard. Mr. Snake-e himself attended the housewarming party when this was built. He brought a casserole. It was mediocre but the gesture was lovely.",
        features: [
            "Private courtyard with stone fountain",
            "Imported terracotta roof tiles",
            "Iron juliet balconies on second floor",
            "Chef's kitchen with dual ovens and marble island"
        ],
        quirks: "The fountain has a small frog who moved in three years ago. The homeowner named him Fontaine. He has his own Instagram account run by the gardener. Fontaine has more followers than most of the residents.",
        agent: "Darla Duckworth",
        rentable: false,
        buyable: true,
        rentRate: 0
    },

    {
        id: 23,
        name: "The Apex",
        image: "./assets/properties/23.png",
        price: 1000000,
        neighborhood: "serpentine-estates",
        neighborhoodName: "Serpentine Estates",
        address: "1 Summit Dr",
        type: "Ultra-Modern Estate",
        bedrooms: 6,
        bathrooms: 6,
        sqft: 6500,
        yearBuilt: 2022,
        description: "This is it. The top. The summit. The single most expensive property in all of Snakesia. The Apex was built in 2022 by an architect who was told 'money is not a factor' and took that VERY seriously. Floor-to-ceiling glass walls that make the entire house feel like it's floating. Polished concrete and steel construction that will outlast civilization itself. An infinity pool that overlooks the valley. Six bedrooms, six bathrooms — yes, every bedroom has its own ensuite because at this price point sharing a bathroom is simply not a conversation we're having. The smart home system controls lighting, climate, security, music, and the pool temperature from a single panel. Mr. Snake-e lives next door and has been seen peering over the fence more than once. I believe the word he used was 'adequate.' From Mr. Snake-e, that is the highest compliment imaginable.",
        features: [
            "Floor-to-ceiling glass walls throughout",
            "Infinity pool overlooking the valley",
            "Six ensuite bedrooms — no bathroom sharing",
            "Full smart home system with single-panel control"
        ],
        quirks: "The architect left a tiny signature etched into the concrete foundation. It reads: 'I'm sorry about the budget.' The original owner thought it was hilarious and refused to cover it up. It's now considered part of the home's charm.",
        agent: "Darla Duckworth",
        rentable: false,
        buyable: true,
        rentRate: 0
    }
];