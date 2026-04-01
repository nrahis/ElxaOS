// =================================
// STOCK ARTICLES — ScaleStreet Phase 2
// =================================
// Maps each news event ID to journalistic content for the ScaleStreet Journal.
//
// Two types:
//   'blurb' — 2-3 sentence summary. Self-contained. Shows on SSJ front page as short news items.
//   'feature' — Full article with summary, body (1-3 paragraphs), and byline.
//              Gets "MAIN STORY" treatment on SSJ front page and links to detail page.
//
// Every event in STOCK_NEWS_EVENTS MUST have a matching entry here.
//
// Recurring journalists:
//   Reginald Hissington III — Senior Correspondent (serious finance/market stories)
//   Viperia Fangsworth — Business & Tech Editor (tech, biotech, defense)
//   Coby the Intern — Junior Reporter (weird stories, wildcards, SCAT coverage)
// =================================

var STOCK_ARTICLES = {

    // =================================
    // ELXA — ElxaCorp
    // =================================
    'elxa-os-update': {
        type: 'feature',
        summary: "ElxaCorp has officially unveiled ElxaOS 5.0, its most ambitious operating system update in years. Investors responded enthusiastically, sending ELXA shares soaring in early trading.",
        body: "In a packed press conference at ElxaCorp headquarters in downtown Serpentine Estates, CEO Mr. Snake-e took the stage to thunderous applause. The new OS features a completely redesigned desktop, faster boot times, and what Mr. Snake-e called 'the most intuitive computing experience any snake has ever had.'\n\nAnalysts at First Snakesian Bank immediately upgraded ELXA to a strong buy, citing the update's potential to drive enterprise adoption across Snakesian government agencies. 'This is the kind of product refresh that happens once a decade,' said senior tech analyst Fiona Slithers. 'Every business in Snakesia is going to want this on their machines.'\n\nThe announcement also included a partnership with Coil Communications to bundle ElxaOS 5.0 with new broadband subscriptions, potentially reaching millions of households that still run older versions.",
        byline: "Viperia Fangsworth, Business & Tech Editor",
        image: null
    },

    'elxa-data-breach': {
        type: 'blurb',
        summary: "ElxaCorp confirmed that a security breach exposed the personal data of approximately 3.2 million Snakesian users. The company's head of security resigned immediately, and CEO Mr. Snake-e issued a public apology promising 'ironclad improvements.' ELXA shares fell sharply on the news."
    },

    'elxa-dividend-hike': {
        type: 'blurb',
        summary: "ElxaCorp announced a 20% increase to its quarterly dividend, delighting long-term shareholders. CFO numbers Numberguy cited strong recurring revenue from ElxaOS subscriptions as the primary driver. The stock rose modestly on the news."
    },

    // =================================
    // SNGL — Snoogle Inc.
    // =================================
    'sngl-ai-launch': {
        type: 'blurb',
        summary: "Snoogle Inc. launched SnAI, an AI-powered search assistant that can answer questions in fluent Snakesian, Parseltongue, and three human languages nobody uses. Early reviews praise its ability to find things you did not know you were looking for. SNGL shares jumped on the announcement."
    },

    'sngl-antitrust': {
        type: 'blurb',
        summary: "Snakesian regulators have opened a formal antitrust investigation into Snoogle's dominance of the search market. The company controls an estimated 94% of all searches in Snakesia. A Snoogle spokesperson responded, 'Try searching for a better search engine. Oh wait, you would use Snoogle to do that.' SNGL shares dipped on the news."
    },

    'sngl-ad-revenue': {
        type: 'blurb',
        summary: "Snoogle reported that advertising revenue surged 30% last quarter, driven by an unexpected spike in searches related to snake care tips, shed remedies, and tail maintenance products. CEO Sergei Scaleston attributed the growth to 'the Snakesian dedication to personal grooming.' SNGL shares climbed on the strong earnings."
    },

    // =================================
    // DSSC — Dissscord Technologies
    // =================================
    'dssc-outage': {
        type: 'blurb',
        summary: "Dissscord Technologies experienced a catastrophic three-hour server outage yesterday, leaving millions of Snakesians unable to argue about video games. Economists at First Snakesian Bank noted a brief but measurable spike in national productivity during the downtime. DSSC shares dipped on the disruption."
    },

    'dssc-viral-feature': {
        type: 'feature',
        summary: "Dissscord's newly launched Hiss Reactions feature has taken Snakesia by storm, racking up 50 million reactions in its first 24 hours. The stock surged as analysts scrambled to upgrade their forecasts.",
        body: "What started as a simple addition to Dissscord's messaging platform has become a cultural phenomenon overnight. Hiss Reactions allows users to respond to messages with animated snake emoji that physically slither across the screen, and apparently that is exactly what 50 million Snakesians were waiting for.\n\n'We knew Hiss Reactions would be popular, but this exceeds every internal projection we had,' said Dissscord CTO Pythonia Bytes at an emergency press briefing called solely to celebrate. The most popular reaction so far is the Dramatic Cobra, a tiny animated cobra that rises up, spreads its hood, and hisses disapprovingly at the message. It has been used 12 million times in one day, primarily in response to workplace messages about Monday morning meetings.\n\nMedia analysts believe the feature could drive a new wave of user growth, as screenshots of elaborate Hiss Reaction chains have gone viral on every other platform in Snakesia.",
        byline: "Viperia Fangsworth, Business & Tech Editor",
        image: null
    },

    'dssc-user-exodus': {
        type: 'blurb',
        summary: "Dissscord lost approximately 2 million users this month after a controversial update that enabled read receipts for all messages by default. Users were furious to discover that friends could see they had been ignoring messages for days. An online petition titled 'Let Us Lurk In Peace' gathered 500,000 signatures. DSSC shares fell sharply."
    },

    // =================================
    // FSB — First Snakesian Bank
    // =================================
    'fsb-expansion': {
        type: 'blurb',
        summary: "First Snakesian Bank announced plans to open 15 new branches across the rapidly growing Dusty Flats region. CEO Harold Scales III said the expansion reflects FSB's commitment to serving underbanked communities. Shares rose on the growth outlook."
    },

    'fsb-fraud-scandal': {
        type: 'blurb',
        summary: "A First Snakesian Bank employee in the Cozy Burrows branch was caught opening hundreds of fake accounts, each registered to fictional characters including 'Slippy McScale' and 'Sir Hisses-a-Lot.' The employee claimed they were accounts for imaginary friends. FSB shares slid as the bank announced an internal investigation."
    },

    'fsb-record-profits': {
        type: 'blurb',
        summary: "First Snakesian Bank reported record quarterly profits of 847 million snakes, driven by surging mortgage demand and strong fee income. Analysts noted that FSB processed more home loans in one quarter than any bank in Snakesian history. Shares climbed on the results."
    },

    // =================================
    // MALD — Mallard Realty Holdings
    // =================================
    'mald-luxury-development': {
        type: 'blurb',
        summary: "Mallard Realty Holdings announced a 200-unit luxury development in the heart of Serpentine Estates, featuring heated floors, private sunning decks, and what they describe as 'the finest burrow architecture in Snakesia.' Pre-sales have already exceeded expectations. MALD shares rose on the announcement."
    },

    'mald-housing-complaint': {
        type: 'blurb',
        summary: "Mallard Realty is facing a wave of complaints from tenants in its budget property line, who allege that doorways were designed for snakes rather than snake-people. 'I have to slither sideways to get into my own bathroom,' said one frustrated renter. A spokesperson insisted the dimensions meet all Snakesian building codes. MALD shares dipped."
    },

    'mald-agent-award': {
        type: 'blurb',
        summary: "Mallard Realty's star agent Patty Quacksworth was named Snakesia's Top Real Estate Agent for the third consecutive year, an unprecedented achievement in the industry. Patty attributed her success to 'knowing every hiding spot in every neighborhood.' MALD shares edged higher on the positive publicity."
    },

    // =================================
    // PATO — Pato & Sons Automotive Group
    // =================================
    'pato-electric-vehicle': {
        type: 'feature',
        summary: "Pato & Sons Automotive Group has unveiled the Sidewinder EV, Snakesia's first fully electric vehicle. The announcement sent PATO shares surging as the family dealership positions itself at the forefront of automotive innovation.",
        body: "In a reveal event that Pato Sr. described as 'the proudest day since Junior sold his first car at age six,' the Sidewinder EV rolled onto the showroom floor to gasps and applause. The vehicle features a range of 300 miles per charge, seats that warm to 'optimal basking temperature,' and a horn that plays a different hiss depending on urgency.\n\n'We looked at what every other automaker was doing and said, we can do that but with more personality,' said Pato Jr., who personally designed the dashboard layout. The base model starts at 45,000 snakes, placing it squarely in the mid-range tier, with a premium variant expected next year.\n\nIndustry analysts were caught off guard by the announcement, as Pato & Sons has traditionally been known for selling used vehicles with colorful histories rather than cutting-edge technology. Sal, the dealership's legendary top salesman, reportedly already has a waitlist of 200 buyers.",
        byline: "Reginald Hissington III, Senior Correspondent",
        image: null
    },

    'pato-recall': {
        type: 'blurb',
        summary: "Pato & Sons Automotive Group issued a recall of approximately 5,000 vehicles after an internal audit revealed that a batch of steering wheels had been installed purely for decorative purposes and were not connected to the steering column. Pato Sr. called it 'a minor oversight' and offered affected customers free floor mats. PATO shares dropped on the news."
    },

    'pato-sales-record': {
        type: 'blurb',
        summary: "Legendary salesman Sal at Pato & Sons shattered the dealership's monthly sales record by selling 47 vehicles in a single weekend. When asked about his technique, Sal simply winked and said, 'They don't call me Sal for nothing. Actually, they do. That is my name.' PATO shares rose on the strong sales figures."
    },

    // =================================
    // SCAT — Sussy Cat Entertainment
    // =================================
    'scat-meme-rally': {
        type: 'feature',
        summary: "SCAT stock exploded upward as the hashtag SussyCatToTheMoon trended across Dissscord, driving a frenzy of retail buying. Analysts are baffled. Investors are euphoric. Nothing has fundamentally changed about the company.",
        body: "It started, as these things always do, with a meme. Someone on Dissscord posted an image of Sussy Cat wearing a tiny astronaut helmet with the caption 'SCAT holders when the stock goes up 1%' and within hours, the hashtag SussyCatToTheMoon was the number one trend in Snakesia.\n\nRetail investors piled in with reckless enthusiasm, many openly admitting they have no idea what Sussy Cat Entertainment actually does. 'I think they make cat videos? Or maybe games? Honestly I just like the ticker symbol,' said one buyer who asked to remain anonymous. Trading volume on SVSE hit levels not seen since the exchange's founding.\n\nProfessional analysts have stopped trying to apply fundamental analysis to SCAT entirely. 'We have given up attempting to model this stock,' admitted First Snakesian Bank's head of equity research. 'It does not respond to revenue, earnings, or reality. Our new price target is a shrug emoji.'",
        byline: "Coby the Intern, Junior Reporter",
        image: null
    },

    'scat-ceo-tweet': {
        type: 'blurb',
        summary: "Sussy Cat Entertainment CEO posted a single image on social media: a poorly drawn cat sitting inside a rocket ship, with no caption or explanation. SCAT shares immediately surged as investors interpreted the image as a sign of an upcoming space-themed game, a partnership with Slither Dynamics, a coded financial message, or simply good vibes. The CEO has not posted since."
    },

    'scat-earnings-miss': {
        type: 'blurb',
        summary: "Sussy Cat Entertainment reported zero revenue for the eighth consecutive quarter, confirming that the company has not sold a product, service, or even a sticker in two years. Despite this, SCAT shares rallied sharply, with retail investors calling the earnings miss 'priced in' and 'actually bullish if you think about it.' One analyst simply wrote 'I quit' in his note to clients."
    },

    'scat-crash': {
        type: 'blurb',
        summary: "The SCAT bubble deflated violently after a leaked internal memo revealed that Sussy Cat Entertainment's entire staff consists of one person and a cat. The stock cratered as reality set in, though a contingent of devoted holders insisted this was merely 'a healthy correction before the next moon mission.' Many others were less optimistic."
    },

    // =================================
    // FANG — Fang Foods International
    // =================================
    'fang-pasta-recall': {
        type: 'feature',
        summary: "Fang Foods International issued an emergency recall of its popular Snake-Shaped Pasta product line after multiple customers reported the pasta moving on their own. FANG shares dropped sharply on the unsettling news.",
        body: "The recall covers approximately 10 million boxes of Fang's signature Snake-Shaped Pasta distributed across all six Snakesian neighborhoods. Reports began trickling in from the Dusty Flats region, where a family claimed their dinner slithered off the plate during a meal. 'We thought the dog was under the table, but we do not have a dog,' said homeowner Gerald Rattlebottom.\n\nFang Foods spokesperson Diane Cobratti held an emergency press conference insisting the issue was a 'seasoning-related anomaly' and categorically denying any sentience in the pasta. 'Our pasta is made from 100% wheat, water, and proprietary flavor compounds. It is not alive,' she stated firmly, before adding, 'probably.'\n\nThe Snakesian Food Safety Authority has launched an investigation. In the meantime, Fang Foods is offering full refunds and has temporarily replaced the product with a new, completely motionless square-shaped pasta.",
        byline: "Coby the Intern, Junior Reporter",
        image: null
    },

    'fang-new-product': {
        type: 'blurb',
        summary: "Fang Foods International launched Venom Crunch, a new breakfast cereal featuring tiny fang-shaped marshmallows and a mascot called Captain Crunch-a-Lot. The product sold out in every grocery store across Snakesia within 48 hours. FANG shares climbed on the blockbuster debut."
    },

    'fang-supply-chain': {
        type: 'blurb',
        summary: "Fang Foods warned investors of potential supply chain disruptions after a mouse shortage hit Snakesian farms. The company sources a significant portion of its protein ingredients from domestic suppliers, and the shortage could impact production of several product lines. FANG shares slipped on the cautious outlook."
    },

    // =================================
    // VENM — Venom Energy Corp
    // =================================
    'venm-sports-deal': {
        type: 'feature',
        summary: "Venom Energy Corp signed an exclusive sponsorship deal with the Snakesian National Slithering League, making it the official energy drink of professional slithering. VENM shares surged on the brand exposure.",
        body: "The multi-year deal, reported to be worth 150 million snakes, gives Venom Energy exclusive pouring rights at all SNSL arenas and prominently features the brand's neon green logo on team uniforms. Venom Energy CEO Toxica Vipress called it 'the biggest moment in sports beverage history.'\n\nThe SNSL is Snakesia's most-watched sporting league, with an average viewership of 8 million per match. Analysts estimate the sponsorship will double Venom Energy's brand recognition overnight, particularly among the 18-35 demographic that the company has been aggressively targeting.\n\nCompeting beverage companies were reportedly blindsided by the deal. A source at Fang Foods, which had been in talks for a similar arrangement, said simply, 'We got outbid by a drink that makes people vibrate.'",
        byline: "Reginald Hissington III, Senior Correspondent",
        image: null
    },

    'venm-health-scare': {
        type: 'blurb',
        summary: "A study published by the Snakesian Institute of Health linked heavy Venom Energy consumption to a condition researchers are calling 'excessive involuntary vibrating.' Venom Energy disputed the findings, noting that the study was funded by a competing tea company. VENM shares fell as health concerns spread."
    },

    'venm-flavor-launch': {
        type: 'blurb',
        summary: "Venom Energy's new Cobra Colada flavor shattered first-week sales records, moving 2 million cans in seven days. The tropical-themed drink features a cobra on the can wearing sunglasses and a Hawaiian shirt. Reviews have been overwhelmingly positive, with one critic calling it 'dangerously delicious.' VENM shares rose."
    },

    // =================================
    // BITE — SnakeBite Labs
    // =================================
    'bite-drug-approval': {
        type: 'feature',
        summary: "SnakeBite Labs received regulatory approval for VenoClear, a groundbreaking treatment for venom allergies that affects an estimated 15% of the Snakesian population. BITE shares soared on the landmark decision.",
        body: "The Snakesian Drug Authority gave VenoClear its seal of approval after a rigorous three-year review process, making it the first treatment of its kind to reach the market. Venom allergies, which cause symptoms ranging from mild itching to dramatic fainting at the mere mention of venom, have plagued Snakesian society for generations.\n\n'This is what we have been working toward for a decade,' said Mr. Snake-e, SnakeBite Labs founder and chairman, in a statement. The company expects to begin distribution within 60 days, with pricing set at 50 snakes per monthly dose, making it accessible to most Snakesians with basic health coverage.\n\nAnalysts estimate VenoClear could generate annual revenue of 200 million snakes within its first year, fundamentally transforming SnakeBite Labs from a research-stage company into a profitable pharmaceutical operation.",
        byline: "Viperia Fangsworth, Business & Tech Editor",
        image: null
    },

    'bite-trial-failure': {
        type: 'blurb',
        summary: "SnakeBite Labs' highly anticipated scale regeneration drug, ScaleGrow Pro, failed its Phase 3 clinical trial after patients reported growing scales in unexpected locations. One participant allegedly grew a patch of scales on his elbow that 'looked like a tiny armadillo.' BITE shares plummeted on the devastating setback."
    },

    'bite-partnership': {
        type: 'blurb',
        summary: "SnakeBite Labs and ElxaCorp announced a joint venture to develop an AI-powered drug discovery platform. The collaboration combines SnakeBite's pharmaceutical expertise with ElxaCorp's computing power. Both BITE and ELXA shares rose on the news, which analysts called 'a natural pairing of Snakesia's two most innovative companies.'"
    },

    // =================================
    // COIL — Coil Communications
    // =================================
    'coil-5g-rollout': {
        type: 'blurb',
        summary: "Coil Communications announced the completion of its 5G network rollout, covering all six Snakesian neighborhoods including the notoriously difficult-to-reach Dusty Flats. CEO Cabella Coilsworth called it 'a historic moment for connectivity.' COIL shares rose modestly, as the stock does all things modestly."
    },

    'coil-rate-hike': {
        type: 'blurb',
        summary: "Coil Communications raised prices across all plans by 15%, prompting outrage from customers who noted that Coil is the only telecom provider in Snakesia. CEO Cabella Coilsworth responded to complaints by asking, 'Where else are you going to go? We are literally a monopoly.' Regulators said they are 'looking into it.' COIL shares dipped slightly."
    },

    'coil-streaming-launch': {
        type: 'blurb',
        summary: "Coil Communications launched CoilTV, a streaming service featuring original Snakesian programming. The platform attracted 10,000 subscribers on day one, buoyed by its flagship show, 'Keeping Up With The Cobras.' COIL shares climbed on the surprisingly strong debut."
    },

    // =================================
    // STFC — Scales & Tails Fashion Co.
    // =================================
    'stfc-celebrity-collab': {
        type: 'feature',
        summary: "Scales & Tails Fashion Co. announced a blockbuster collaboration with Snakesian pop icon Hissy Elliot, sending the stock surging as fashionistas and investors alike reacted with excitement.",
        body: "The collaboration, dubbed 'Hissy x S&T,' will feature a 40-piece collection of streetwear designed by Hissy Elliot herself. The line includes hoodies, jackets, and what Hissy calls 'the first pants specifically designed for creatures that do not have legs, but want to feel like they could.'\n\n'Fashion is about attitude, and nobody has more attitude than a snake in a hoodie,' said Hissy Elliot at the launch party in Serpentine Estates, which was attended by every influencer in Snakesia. Pre-orders opened immediately and crashed the Scales & Tails website within minutes.\n\nRetail analysts are projecting the collaboration could generate 80 million snakes in revenue over its first quarter alone, which would be a record for any celebrity fashion partnership in Snakesian history.",
        byline: "Coby the Intern, Junior Reporter",
        image: null
    },

    'stfc-fashion-flop': {
        type: 'blurb',
        summary: "Scales & Tails Fashion Co.'s highly anticipated 'Invisible Clothing' line was universally panned after customers realized the clothes were, in fact, invisible. 'I paid 200 snakes for something I cannot see, touch, or wear,' complained one buyer. The company insisted the line was 'conceptual fashion' but issued refunds within hours. STFC shares plummeted."
    },

    'stfc-viral-trend': {
        type: 'blurb',
        summary: "Scales & Tails hoodies unexpectedly went viral after a popular Dissscord influencer was photographed wearing one, sparking a nationwide trend. The company is now back-ordered for three months across all sizes. STFC shares surged on the organic marketing windfall."
    },

    // =================================
    // HISS — Hiss Hotels & Resorts
    // =================================
    'hiss-resort-opening': {
        type: 'blurb',
        summary: "Hiss Hotels & Resorts opened its newest luxury property in Serpentine Estates, a 500-room resort featuring heated basking rocks in every room, a 24-hour cricket buffet, and an infinity pool shaped like a coiled snake. Bookings are already at 85% capacity through next season. HISS shares climbed on the expansion."
    },

    'hiss-food-poisoning': {
        type: 'blurb',
        summary: "A Hiss Hotels buffet sent approximately 200 guests to the hospital after what health inspectors are calling 'a suspicious mouse mousse incident.' The hotel's head chef was placed on administrative leave, and the entire buffet was shut down pending investigation. Hiss Hotels' CEO personally apologized and offered affected guests a free future stay. HISS shares fell sharply."
    },

    'hiss-tourism-boom': {
        type: 'blurb',
        summary: "Hiss Hotels reported 95% occupancy rates across all properties as Snakesian tourism hit an all-time high. International visitors are flocking to Snakesia's unique blend of warm climate, distinctive cuisine, and what travel magazines call 'a charmingly bizarre culture.' HISS shares rose on the strong bookings."
    },

    // =================================
    // SLTH — Slither Dynamics
    // =================================
    'slth-government-contract': {
        type: 'blurb',
        summary: "Slither Dynamics was awarded a 2 billion snake government defense contract to develop next-generation surveillance drones shaped like actual snakes. The contract, the largest in Snakesian military history, will create an estimated 3,000 new jobs. SLTH shares soared on the massive deal."
    },

    'slth-rocket-failure': {
        type: 'blurb',
        summary: "A Slither Dynamics rocket test ended in spectacular failure when the prototype veered off course and deposited debris across a Dusty Flats playground. No one was injured, as it was a Tuesday and the playground was empty. Slither Dynamics blamed 'a calibration issue with the tail fin stabilizers.' SLTH shares tumbled."
    },

    'slth-space-program': {
        type: 'feature',
        summary: "Slither Dynamics has been selected by the Snakesian Space Agency to design and build the nation's first orbital space station. SLTH shares rocketed on the historic announcement.",
        body: "The contract, valued at an undisclosed but reportedly enormous sum, tasks Slither Dynamics with constructing a modular space station capable of supporting a crew of six for extended missions. The station, tentatively named 'The Coil,' will serve as Snakesia's foothold in orbital space and a platform for future deep-space exploration.\n\n'Snakes have always looked up at the stars and wondered what it would be like to slither among them,' said Slither Dynamics CEO General (Ret.) Viper Strikington at a press conference that also featured a scale model of the station and a patriotic fireworks display. 'Today, we take the first real step toward that dream.'\n\nThe announcement caught competitors off guard, as Slither Dynamics had been considered primarily a defense contractor. Analysts say the space station contract could transform the company into a major aerospace player and provide steady revenue for the next decade.",
        byline: "Viperia Fangsworth, Business & Tech Editor",
        image: null
    },

    // =================================
    // SECTOR EVENTS
    // =================================
    'sector-tech-boom': {
        type: 'feature',
        summary: "The Snakesian government announced a 5 billion snake investment in national technology infrastructure, sending all major tech stocks higher. Analysts are calling it the largest public investment in the sector since Snakesia's founding.",
        body: "Prime Minister Rattleston unveiled the sweeping investment package at a joint session of parliament, calling technology 'the backbone of Snakesia's future prosperity.' The funds will be allocated across broadband expansion, cybersecurity upgrades, AI research grants, and a new national computing center to be built in the Cozy Burrows district.\n\nElxaCorp, Snoogle, and Dissscord Technologies all stand to benefit directly, with ElxaCorp expected to receive a substantial contract for the computing center's operating system. Smaller tech firms and startups will have access to a new 500 million snake innovation fund.\n\nThe opposition party criticized the spending as excessive, but market reaction was overwhelmingly positive. The SVSE tech sector index posted its largest single-day gain in three years.",
        byline: "Reginald Hissington III, Senior Correspondent",
        image: null
    },

    'sector-tech-regulation': {
        type: 'blurb',
        summary: "The Snakesian Parliament passed the new Data Privacy Act, imposing strict data handling requirements on technology companies. Compliance costs are expected to hit tech profits significantly, with Snoogle facing the heaviest burden due to its advertising model. All three major tech stocks declined on the news."
    },

    'sector-housing-boom': {
        type: 'blurb',
        summary: "Home prices surged across all six Snakesian neighborhoods, with the strongest gains in Dusty Flats and Cozy Burrows. Mallard Realty reported its best quarter ever, while First Snakesian Bank saw mortgage applications double. The housing boom also lifted Hiss Hotels, which benefits from rising property values in resort areas."
    },

    'sector-housing-crash': {
        type: 'blurb',
        summary: "Growing fears of a housing bubble sent real estate and banking stocks tumbling. Several major developments have stalled due to rising construction costs, and mortgage application volumes fell for the first time in two years. Analysts warn that Snakesian home prices may have outpaced what ordinary snake-people can afford."
    },

    'sector-consumer-spending': {
        type: 'blurb',
        summary: "A new survey from the Snakesian Bureau of Economic Research showed consumer confidence at record highs, with Snakesians spending freely on food, fashion, travel, and energy drinks. The broad-based spending spree lifted consumer-facing stocks across the board."
    },

    'sector-consumer-pullback': {
        type: 'blurb',
        summary: "Snakesian households are cutting back on discretionary spending amid rising living costs, according to new economic data. Restaurants, fashion retailers, and hotels are all reporting slower traffic. Consumer stocks slid as investors braced for a leaner quarter ahead."
    },

    'sector-defense-budget': {
        type: 'blurb',
        summary: "The Snakesian parliament approved a 25% increase to the national defense budget, citing 'evolving security needs and the importance of looking tough.' Slither Dynamics surged as the primary beneficiary, while Coil Communications also rose on expectations of military communication contracts."
    },

    'sector-auto-incentives': {
        type: 'blurb',
        summary: "The Snakesian government announced generous tax credits for vehicle purchases, aiming to stimulate the auto industry and reduce the average age of vehicles on Snakesian roads. Pato & Sons Automotive Group jumped on expectations of increased foot traffic. Venom Energy also rose, as its dealership vending machine partnership stands to benefit from more showroom visits."
    },

    // =================================
    // MARKET-WIDE EVENTS
    // =================================
    'market-bull-run': {
        type: 'feature',
        summary: "The Snake Valley Stock Exchange hit an all-time high today, with virtually every listed stock posting gains. Traders on the exchange floor were seen high-fiving, which is remarkable given that most of them do not have hands.",
        body: "The historic milestone caps a month of steady gains driven by strong corporate earnings, low unemployment, and what economists are calling 'an unprecedented period of Snakesian optimism.' The SVSE Composite Index crossed the 10,000 mark for the first time, a level that analysts once considered aspirational at best.\n\n'I have been watching this market for 30 years and I have never seen anything like this,' said veteran trader Cornelius Pit-Viper from the exchange floor. 'Everyone is making money. The shoeshine boy is making money. The shoeshine boy's pet cricket is making money. It is a beautiful thing.'\n\nSkeptics cautioned that all-time highs often precede corrections, but the mood on the exchange floor was decisively festive. First Snakesian Bank popped complimentary champagne, which spilled everywhere because the bottles were designed for creatures without opposable thumbs.",
        byline: "Reginald Hissington III, Senior Correspondent",
        image: null
    },

    'market-correction': {
        type: 'blurb',
        summary: "Markets tumbled broadly after the Snakesian Central Bank announced an interest rate hike to combat inflation. Growth stocks took the hardest hit, with Dissscord and Scales & Tails leading the decline. Defensive sectors held up relatively better, but no corner of the market was spared. Analysts called it 'a much-needed reality check.'"
    },

    'market-foreign-investment': {
        type: 'blurb',
        summary: "A wave of foreign investment poured into Snakesian markets after an international financial magazine ranked Snakesia the 'most promising emerging economy' for the third year running. Blue-chip stocks and established companies saw the largest inflows, with First Snakesian Bank and Hiss Hotels among the top beneficiaries."
    },

    'market-scandal': {
        type: 'blurb',
        summary: "The Snakesian finance minister was caught making suspiciously well-timed stock trades ahead of major policy announcements. The scandal rocked investor confidence and sent markets into a broad decline. Financial stocks were hit hardest, with First Snakesian Bank falling the most on concerns about regulatory credibility. The minister denied wrongdoing, calling his timing 'coincidental and also lucky.'"
    },

    'market-tax-cut': {
        type: 'blurb',
        summary: "Parliament passed a sweeping corporate tax cut, reducing rates from 28% to 22%. Business groups hailed the move as 'transformative for Snakesian enterprise,' while opposition leaders warned it would widen inequality. Markets rallied broadly as investors priced in higher after-tax earnings across nearly every sector."
    },

    // =================================
    // ABSURD WILDCARDS
    // =================================
    'wild-snake-parade': {
        type: 'blurb',
        summary: "The Annual Great Snakesian Parade drew record attendance this year, with an estimated 2 million spectators lining the streets of downtown. Hotels were booked solid, food vendors reported triple normal sales, and fashion brand Scales & Tails debuted a limited-edition parade hoodie that sold out in 40 minutes. Multiple consumer stocks benefited from the celebration."
    },

    'wild-alien-sighting': {
        type: 'feature',
        summary: "An unidentified flying object was spotted hovering over Dusty Flats late last night, sparking a frenzy of speculation, excitement, and defense-related stock buying. Slither Dynamics surged as investors bet on increased space defense spending.",
        body: "Multiple witnesses reported a glowing, disc-shaped object hovering silently above the Dusty Flats water tower for approximately 15 minutes before accelerating straight up and vanishing. Videos flooded Dissscord within minutes, and the hashtag SlitherToTheSkies trended for eight straight hours.\n\nSlither Dynamics stock surged as investors speculated that the Snakesian government would fast-track defense and space surveillance contracts. Dissscord also benefited from the massive spike in platform activity, while Coil Communications rose on assumptions that any alien communication would, by necessity, go through their network.\n\nThe Snakesian Air Force released a statement calling the object 'an atmospheric anomaly, probably,' while declining to comment further. Slither Dynamics CEO General Strikington was more direct: 'Whether it is aliens or not, the sky needs defending. We are happy to help.'",
        byline: "Coby the Intern, Junior Reporter",
        image: null
    },

    'wild-crypto-craze': {
        type: 'blurb',
        summary: "A cryptocurrency called SnakeCoin went viral after a Dissscord group pumped it from worthless to 50 snakes per coin in a single week. Traditional financial stocks dipped as money flowed into the speculative craze. SCAT surged in sympathy because, according to one trader, 'SCAT and crypto attract the same type of investor.' First Snakesian Bank's CEO called SnakeCoin 'a solution in search of a problem, wrapped in a meme.'"
    },

    'wild-weather-disaster': {
        type: 'blurb',
        summary: "A freak sandstorm engulfed the Dusty Flats region for an entire week, forcing businesses to close and residents to shelter in their burrows. Property damage was estimated at 50 million snakes, hitting real estate, auto, and hospitality stocks. Fang Foods reported disrupted deliveries. Insurance claims are expected to take months to process."
    },

    'wild-celebrity-ipo': {
        type: 'blurb',
        summary: "Famous Snakesian social media influencer Mr. Scales announced plans to launch a rival fashion brand called 'ScaleDrip,' sending Scales & Tails Fashion Co. into a tailspin. Mr. Scales has 4 million followers and a reputation for setting trends. STFC shares cratered on the competitive threat. Oddly, SCAT also rose, as Mr. Scales had been spotted wearing a Sussy Cat t-shirt in the announcement video."
    }
};
