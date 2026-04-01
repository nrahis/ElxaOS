// =================================
// STOCK NEWS EVENTS — ScaleStreet Phase 2
// =================================
// Pool of news events that fire randomly during monthly stock simulation.
// Each event has a headline, affected tickers with price impacts, a category,
// and a cooldown (months before it can fire again).
//
// Categories: company, sector, market, wildcard
// Every event ID MUST have a matching entry in STOCK_ARTICLES.
//
// LOADED BEFORE stock-service.js — service checks for this global.
// =================================

var STOCK_NEWS_EVENTS = [

    // =================================
    // ELXA — ElxaCorp (Tech, Blue Chip)
    // =================================
    {
        id: 'elxa-os-update',
        headline: "ElxaCorp unveils ElxaOS 5.0 — analysts slithering with excitement!",
        affects: [{ ticker: 'ELXA', impact: +0.15 }],
        category: 'company',
        cooldown: 8
    },
    {
        id: 'elxa-data-breach',
        headline: "ElxaCorp suffers data breach — millions of Snakesian passwords exposed!",
        affects: [{ ticker: 'ELXA', impact: -0.12 }],
        category: 'company',
        cooldown: 8
    },
    {
        id: 'elxa-dividend-hike',
        headline: "ElxaCorp raises quarterly dividend by 20% — shareholders celebrate!",
        affects: [{ ticker: 'ELXA', impact: +0.08 }],
        category: 'company',
        cooldown: 10
    },

    // =================================
    // SNGL — Snoogle Inc. (Tech, Search)
    // =================================
    {
        id: 'sngl-ai-launch',
        headline: "Snoogle launches SnAI — Snakesia's first AI-powered search assistant!",
        affects: [{ ticker: 'SNGL', impact: +0.14 }],
        category: 'company',
        cooldown: 8
    },
    {
        id: 'sngl-antitrust',
        headline: "Snakesian regulators open antitrust investigation into Snoogle's search monopoly!",
        affects: [{ ticker: 'SNGL', impact: -0.10 }],
        category: 'company',
        cooldown: 8
    },
    {
        id: 'sngl-ad-revenue',
        headline: "Snoogle ad revenue surges 30% — 'everyone is searching for snake facts' says CEO!",
        affects: [{ ticker: 'SNGL', impact: +0.09 }],
        category: 'company',
        cooldown: 7
    },

    // =================================
    // DSSC — Dissscord Technologies (Tech, Social)
    // =================================
    {
        id: 'dssc-outage',
        headline: "Dissscord suffers three-hour outage — national productivity briefly spikes!",
        affects: [{ ticker: 'DSSC', impact: -0.15 }],
        category: 'company',
        cooldown: 6
    },
    {
        id: 'dssc-viral-feature',
        headline: "Dissscord's new Hiss Reactions feature goes viral — 50 million reactions in one day!",
        affects: [{ ticker: 'DSSC', impact: +0.20 }],
        category: 'company',
        cooldown: 7
    },
    {
        id: 'dssc-user-exodus',
        headline: "Dissscord loses 2 million users after controversial 'read receipts for everyone' update!",
        affects: [{ ticker: 'DSSC', impact: -0.18 }],
        category: 'company',
        cooldown: 8
    },

    // =================================
    // FSB — First Snakesian Bank (Finance)
    // =================================
    {
        id: 'fsb-expansion',
        headline: "First Snakesian Bank opens 15 new branches across Dusty Flats region!",
        affects: [{ ticker: 'FSB', impact: +0.08 }],
        category: 'company',
        cooldown: 8
    },
    {
        id: 'fsb-fraud-scandal',
        headline: "FSB employee caught opening fake accounts — 'they were for my imaginary friends' he claims!",
        affects: [{ ticker: 'FSB', impact: -0.10 }],
        category: 'company',
        cooldown: 9
    },
    {
        id: 'fsb-record-profits',
        headline: "First Snakesian Bank posts record quarterly profits — mortgage demand surging!",
        affects: [{ ticker: 'FSB', impact: +0.10 }],
        category: 'company',
        cooldown: 7
    },

    // =================================
    // MALD — Mallard Realty Holdings (Real Estate)
    // =================================
    {
        id: 'mald-luxury-development',
        headline: "Mallard Realty announces luxury development in Serpentine Estates — 200 new units!",
        affects: [{ ticker: 'MALD', impact: +0.12 }],
        category: 'company',
        cooldown: 8
    },
    {
        id: 'mald-housing-complaint',
        headline: "Mallard Realty hit with complaints about 'snake-sized doorways' in budget properties!",
        affects: [{ ticker: 'MALD', impact: -0.08 }],
        category: 'company',
        cooldown: 7
    },
    {
        id: 'mald-agent-award',
        headline: "Mallard Realty's Patty Quacksworth named Snakesia's Top Agent for third year running!",
        affects: [{ ticker: 'MALD', impact: +0.06 }],
        category: 'company',
        cooldown: 9
    },

    // =================================
    // PATO — Pato & Sons Automotive Group (Auto)
    // =================================
    {
        id: 'pato-electric-vehicle',
        headline: "Pato & Sons unveils the Sidewinder EV — Snakesia's first electric vehicle!",
        affects: [{ ticker: 'PATO', impact: +0.15 }],
        category: 'company',
        cooldown: 8
    },
    {
        id: 'pato-recall',
        headline: "Pato & Sons recalls 5,000 vehicles after steering wheels found to be decorative!",
        affects: [{ ticker: 'PATO', impact: -0.12 }],
        category: 'company',
        cooldown: 8
    },
    {
        id: 'pato-sales-record',
        headline: "Pato & Sons smashes monthly sales record — Sal sold 47 cars in one weekend!",
        affects: [{ ticker: 'PATO', impact: +0.10 }],
        category: 'company',
        cooldown: 7
    },

    // =================================
    // SCAT — Sussy Cat Entertainment (Meme Stock)
    // =================================
    {
        id: 'scat-meme-rally',
        headline: "SCAT stock surges as 'Sussy Cat to the Moon' trends on Dissscord!",
        affects: [{ ticker: 'SCAT', impact: +0.35 }],
        category: 'company',
        cooldown: 5
    },
    {
        id: 'scat-ceo-tweet',
        headline: "Sussy Cat CEO posts cryptic image of a cat in a rocket — SCAT immediately skyrockets!",
        affects: [{ ticker: 'SCAT', impact: +0.30 }],
        category: 'company',
        cooldown: 5
    },
    {
        id: 'scat-earnings-miss',
        headline: "Sussy Cat Entertainment reports zero revenue for 8th consecutive quarter — stock rallies anyway!",
        affects: [{ ticker: 'SCAT', impact: +0.25 }],
        category: 'company',
        cooldown: 6
    },
    {
        id: 'scat-crash',
        headline: "SCAT bubble pops — 'turns out a cat game studio needs to actually make games' says analyst!",
        affects: [{ ticker: 'SCAT', impact: -0.30 }],
        category: 'company',
        cooldown: 5
    },

    // =================================
    // FANG — Fang Foods International (Consumer)
    // =================================
    {
        id: 'fang-pasta-recall',
        headline: "Fang Foods recalls 10 million snake-shaped pastas after reports of them moving on their own!",
        affects: [{ ticker: 'FANG', impact: -0.12 }],
        category: 'company',
        cooldown: 7
    },
    {
        id: 'fang-new-product',
        headline: "Fang Foods launches Venom Crunch cereal — sells out in every Snakesian grocery store!",
        affects: [{ ticker: 'FANG', impact: +0.10 }],
        category: 'company',
        cooldown: 7
    },
    {
        id: 'fang-supply-chain',
        headline: "Fang Foods warns of supply chain disruptions after mouse shortage hits farms!",
        affects: [{ ticker: 'FANG', impact: -0.08 }],
        category: 'company',
        cooldown: 7
    },

    // =================================
    // VENM — Venom Energy Corp (Consumer, Energy Drink)
    // =================================
    {
        id: 'venm-sports-deal',
        headline: "Venom Energy signs exclusive deal with Snakesian National Slithering League!",
        affects: [{ ticker: 'VENM', impact: +0.20 }],
        category: 'company',
        cooldown: 8
    },
    {
        id: 'venm-health-scare',
        headline: "Study links Venom Energy to 'excessive vibrating' — company disputes findings!",
        affects: [{ ticker: 'VENM', impact: -0.18 }],
        category: 'company',
        cooldown: 7
    },
    {
        id: 'venm-flavor-launch',
        headline: "Venom Energy's new Cobra Colada flavor breaks first-week sales records!",
        affects: [{ ticker: 'VENM', impact: +0.15 }],
        category: 'company',
        cooldown: 7
    },

    // =================================
    // BITE — SnakeBite Labs (Biotech)
    // =================================
    {
        id: 'bite-drug-approval',
        headline: "SnakeBite Labs gets regulatory approval for anti-venom allergy treatment!",
        affects: [{ ticker: 'BITE', impact: +0.18 }],
        category: 'company',
        cooldown: 8
    },
    {
        id: 'bite-trial-failure',
        headline: "SnakeBite Labs' scale regeneration drug fails Phase 3 trials — devastating setback!",
        affects: [{ ticker: 'BITE', impact: -0.15 }],
        category: 'company',
        cooldown: 8
    },
    {
        id: 'bite-partnership',
        headline: "SnakeBite Labs partners with ElxaCorp on AI-powered drug discovery platform!",
        affects: [{ ticker: 'BITE', impact: +0.12 }, { ticker: 'ELXA', impact: +0.05 }],
        category: 'company',
        cooldown: 8
    },

    // =================================
    // COIL — Coil Communications (Telecom)
    // =================================
    {
        id: 'coil-5g-rollout',
        headline: "Coil Communications completes 5G rollout to all six Snakesian neighborhoods!",
        affects: [{ ticker: 'COIL', impact: +0.08 }],
        category: 'company',
        cooldown: 9
    },
    {
        id: 'coil-rate-hike',
        headline: "Coil Communications raises prices 15% — 'where else are you gonna go?' says CEO!",
        affects: [{ ticker: 'COIL', impact: -0.05 }],
        category: 'company',
        cooldown: 8
    },
    {
        id: 'coil-streaming-launch',
        headline: "Coil Communications launches CoilTV streaming service — 10,000 subscribers day one!",
        affects: [{ ticker: 'COIL', impact: +0.10 }],
        category: 'company',
        cooldown: 8
    },

    // =================================
    // STFC — Scales & Tails Fashion Co. (Lifestyle)
    // =================================
    {
        id: 'stfc-celebrity-collab',
        headline: "Scales & Tails announces collaboration with pop star Hissy Elliot — stock surges!",
        affects: [{ ticker: 'STFC', impact: +0.22 }],
        category: 'company',
        cooldown: 7
    },
    {
        id: 'stfc-fashion-flop',
        headline: "Scales & Tails' new 'invisible clothing' line universally panned — 'we can literally see everything'!",
        affects: [{ ticker: 'STFC', impact: -0.20 }],
        category: 'company',
        cooldown: 7
    },
    {
        id: 'stfc-viral-trend',
        headline: "Scales & Tails hoodies go viral on social media — back-ordered for 3 months!",
        affects: [{ ticker: 'STFC', impact: +0.18 }],
        category: 'company',
        cooldown: 6
    },

    // =================================
    // HISS — Hiss Hotels & Resorts (Hospitality)
    // =================================
    {
        id: 'hiss-resort-opening',
        headline: "Hiss Hotels opens luxury resort in Serpentine Estates — 500 rooms with heated rocks!",
        affects: [{ ticker: 'HISS', impact: +0.12 }],
        category: 'company',
        cooldown: 8
    },
    {
        id: 'hiss-food-poisoning',
        headline: "Hiss Hotels buffet sends 200 guests to hospital — 'the mouse mousse was suspicious'!",
        affects: [{ ticker: 'HISS', impact: -0.14 }],
        category: 'company',
        cooldown: 7
    },
    {
        id: 'hiss-tourism-boom',
        headline: "Hiss Hotels reports 95% occupancy as Snakesian tourism hits all-time high!",
        affects: [{ ticker: 'HISS', impact: +0.10 }],
        category: 'company',
        cooldown: 7
    },

    // =================================
    // SLTH — Slither Dynamics (Defense/Aerospace)
    // =================================
    {
        id: 'slth-government-contract',
        headline: "Slither Dynamics wins §2 billion government defense contract!",
        affects: [{ ticker: 'SLTH', impact: +0.22 }],
        category: 'company',
        cooldown: 8
    },
    {
        id: 'slth-rocket-failure',
        headline: "Slither Dynamics rocket test fails spectacularly — debris lands in Dusty Flats playground!",
        affects: [{ ticker: 'SLTH', impact: -0.20 }],
        category: 'company',
        cooldown: 7
    },
    {
        id: 'slth-space-program',
        headline: "Slither Dynamics selected to build Snakesia's first space station — stock soars!",
        affects: [{ ticker: 'SLTH', impact: +0.25 }],
        category: 'company',
        cooldown: 9
    },

    // =================================
    // SECTOR EVENTS
    // =================================
    {
        id: 'sector-tech-boom',
        headline: "Snakesian government announces massive tech infrastructure investment!",
        affects: [
            { ticker: 'ELXA', impact: +0.10 },
            { ticker: 'SNGL', impact: +0.08 },
            { ticker: 'DSSC', impact: +0.12 }
        ],
        category: 'sector',
        cooldown: 10
    },
    {
        id: 'sector-tech-regulation',
        headline: "New Snakesian Data Privacy Act threatens tech company profits!",
        affects: [
            { ticker: 'ELXA', impact: -0.06 },
            { ticker: 'SNGL', impact: -0.10 },
            { ticker: 'DSSC', impact: -0.08 }
        ],
        category: 'sector',
        cooldown: 10
    },
    {
        id: 'sector-housing-boom',
        headline: "Snakesian housing market heats up — home prices surge across all neighborhoods!",
        affects: [
            { ticker: 'MALD', impact: +0.12 },
            { ticker: 'FSB', impact: +0.08 },
            { ticker: 'HISS', impact: +0.05 }
        ],
        category: 'sector',
        cooldown: 9
    },
    {
        id: 'sector-housing-crash',
        headline: "Housing bubble fears grip Snakesia — multiple developments stall!",
        affects: [
            { ticker: 'MALD', impact: -0.14 },
            { ticker: 'FSB', impact: -0.08 }
        ],
        category: 'sector',
        cooldown: 9
    },
    {
        id: 'sector-consumer-spending',
        headline: "Snakesian consumer confidence hits record high — spending spree across the nation!",
        affects: [
            { ticker: 'FANG', impact: +0.08 },
            { ticker: 'STFC', impact: +0.12 },
            { ticker: 'HISS', impact: +0.08 },
            { ticker: 'VENM', impact: +0.10 }
        ],
        category: 'sector',
        cooldown: 8
    },
    {
        id: 'sector-consumer-pullback',
        headline: "Snakesian households tighten budgets amid rising costs — consumer stocks slide!",
        affects: [
            { ticker: 'FANG', impact: -0.06 },
            { ticker: 'STFC', impact: -0.10 },
            { ticker: 'HISS', impact: -0.08 },
            { ticker: 'VENM', impact: -0.07 }
        ],
        category: 'sector',
        cooldown: 8
    },
    {
        id: 'sector-defense-budget',
        headline: "Snakesian defense budget increased 25% — military contractors rejoice!",
        affects: [
            { ticker: 'SLTH', impact: +0.18 },
            { ticker: 'COIL', impact: +0.06 }
        ],
        category: 'sector',
        cooldown: 10
    },
    {
        id: 'sector-auto-incentives',
        headline: "Government announces vehicle purchase tax credits — auto industry celebrates!",
        affects: [
            { ticker: 'PATO', impact: +0.12 },
            { ticker: 'VENM', impact: +0.05 }
        ],
        category: 'sector',
        cooldown: 9
    },

    // =================================
    // MARKET-WIDE EVENTS
    // =================================
    {
        id: 'market-bull-run',
        headline: "Snake Valley Stock Exchange hits all-time high — everything is up!",
        affects: [
            { ticker: 'ELXA', impact: +0.06 },
            { ticker: 'SNGL', impact: +0.06 },
            { ticker: 'FSB', impact: +0.05 },
            { ticker: 'MALD', impact: +0.05 },
            { ticker: 'PATO', impact: +0.06 },
            { ticker: 'FANG', impact: +0.04 },
            { ticker: 'COIL', impact: +0.04 },
            { ticker: 'BITE', impact: +0.06 },
            { ticker: 'HISS', impact: +0.05 }
        ],
        category: 'market',
        cooldown: 12
    },
    {
        id: 'market-correction',
        headline: "Markets tumble as Snakesian Central Bank raises interest rates!",
        affects: [
            { ticker: 'ELXA', impact: -0.06 },
            { ticker: 'SNGL', impact: -0.07 },
            { ticker: 'DSSC', impact: -0.10 },
            { ticker: 'MALD', impact: -0.08 },
            { ticker: 'PATO', impact: -0.06 },
            { ticker: 'STFC', impact: -0.08 },
            { ticker: 'VENM', impact: -0.07 },
            { ticker: 'SLTH', impact: -0.05 }
        ],
        category: 'market',
        cooldown: 12
    },
    {
        id: 'market-foreign-investment',
        headline: "Foreign investors pour billions into Snakesian markets — broad rally ensues!",
        affects: [
            { ticker: 'ELXA', impact: +0.05 },
            { ticker: 'FSB', impact: +0.07 },
            { ticker: 'MALD', impact: +0.06 },
            { ticker: 'FANG', impact: +0.05 },
            { ticker: 'COIL', impact: +0.05 },
            { ticker: 'HISS', impact: +0.06 }
        ],
        category: 'market',
        cooldown: 10
    },
    {
        id: 'market-scandal',
        headline: "Snakesian finance minister caught insider trading — markets rocked by uncertainty!",
        affects: [
            { ticker: 'FSB', impact: -0.10 },
            { ticker: 'ELXA', impact: -0.04 },
            { ticker: 'SNGL', impact: -0.05 },
            { ticker: 'MALD', impact: -0.06 },
            { ticker: 'BITE', impact: -0.05 }
        ],
        category: 'market',
        cooldown: 12
    },
    {
        id: 'market-tax-cut',
        headline: "Snakesian parliament passes corporate tax cut — business community thrilled!",
        affects: [
            { ticker: 'ELXA', impact: +0.07 },
            { ticker: 'SNGL', impact: +0.06 },
            { ticker: 'FSB', impact: +0.05 },
            { ticker: 'FANG', impact: +0.06 },
            { ticker: 'PATO', impact: +0.07 },
            { ticker: 'COIL', impact: +0.04 }
        ],
        category: 'market',
        cooldown: 12
    },

    // =================================
    // ABSURD WILDCARDS
    // =================================
    {
        id: 'wild-snake-parade',
        headline: "Annual Great Snakesian Parade draws record crowds — downtown businesses boom!",
        affects: [
            { ticker: 'HISS', impact: +0.10 },
            { ticker: 'FANG', impact: +0.06 },
            { ticker: 'STFC', impact: +0.08 }
        ],
        category: 'wildcard',
        cooldown: 12
    },
    {
        id: 'wild-alien-sighting',
        headline: "UFO spotted over Dusty Flats — Slither Dynamics stock surges on space defense hopes!",
        affects: [
            { ticker: 'SLTH', impact: +0.20 },
            { ticker: 'DSSC', impact: +0.10 },
            { ticker: 'COIL', impact: +0.05 }
        ],
        category: 'wildcard',
        cooldown: 10
    },
    {
        id: 'wild-crypto-craze',
        headline: "SnakeCoin cryptocurrency mania sweeps Snakesia — traditional stocks suffer!",
        affects: [
            { ticker: 'FSB', impact: -0.08 },
            { ticker: 'SCAT', impact: +0.25 },
            { ticker: 'DSSC', impact: +0.08 }
        ],
        category: 'wildcard',
        cooldown: 10
    },
    {
        id: 'wild-weather-disaster',
        headline: "Freak sandstorm buries Dusty Flats — businesses shut down for a week!",
        affects: [
            { ticker: 'MALD', impact: -0.08 },
            { ticker: 'PATO', impact: -0.06 },
            { ticker: 'HISS', impact: -0.10 },
            { ticker: 'FANG', impact: -0.05 }
        ],
        category: 'wildcard',
        cooldown: 10
    },
    {
        id: 'wild-celebrity-ipo',
        headline: "Famous Snakesian influencer Mr. Scales announces rival fashion brand — STFC panics!",
        affects: [
            { ticker: 'STFC', impact: -0.15 },
            { ticker: 'SCAT', impact: +0.10 }
        ],
        category: 'wildcard',
        cooldown: 8
    }
];
