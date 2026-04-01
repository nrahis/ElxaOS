// =================================
// SNAKESIA WILDLIFE FUND — DATA
// =================================
// Animal profiles and message pools for the charity sponsorship system.
// Loaded globally so both the SWF website and finance-notifications can access it.
// =================================

window.SWF_DATA = {

    // ===== CHARITY INFO =====
    charityName: 'Snakesia Wildlife Fund',
    charityEmail: 'sponsors@snakesia-wildlife.ex',
    charityFromName: 'Snakesia Wildlife Fund',
    charityTagline: 'Protecting Snakesia\'s Most Precious Creatures',

    // ===== DONATION TIERS (USD internally, displayed as snakes) =====
    tiers: [
        { amount: 5,  label: '$10/mo',  badge: 'Friend' },
        { amount: 10, label: '$20/mo',  badge: 'Guardian' },
        { amount: 20, label: '$40/mo',  badge: 'Protector' },
        { amount: 50, label: '$100/mo', badge: 'Champion' }
    ],

    // ===== ANIMALS =====
    animals: {
        elephant: {
            id: 'elephant',
            name: 'Ellie',
            species: 'Snakesian Forest Elephant',
            image: './assets/interwebs/animal-charity/images/elephant.png',
            bio: 'Ellie was rescued as a calf after her herd was displaced by flooding in the Snakesian lowlands. Now 8 years old, she loves mud baths, watermelon, and trumpeting at clouds.',
            welcomeMessage: 'Dear Friend,\n\n'
                + 'Thank you SO much for sponsoring Ellie! She may not know your name yet, but trust us — she can sense kindness from miles away (elephants are incredible like that).\n\n'
                + 'Your generous contribution will go directly toward Ellie\'s care: fresh fruit, veterinary checkups, and maintaining her 3-acre habitat at the Snakesia Wildlife Sanctuary.\n\n'
                + 'We\'ll send you monthly updates on how Ellie is doing. Get ready for lots of adorable elephant stories!\n\n'
                + 'With gratitude,\n'
                + 'The Snakesia Wildlife Fund Team\n'
                + 'sponsors@snakesia-wildlife.ex',
            farewellMessage: 'Dear Former Sponsor,\n\n'
                + 'We\'re sorry to see you go! Ellie will miss having you in her corner. Your support made a real difference during your time as a sponsor.\n\n'
                + 'If you ever want to come back, Ellie will be here — probably eating watermelon and splashing in her mud pool.\n\n'
                + 'Thank you for everything,\n'
                + 'The Snakesia Wildlife Fund Team',
            monthlyMessages: [
                'Ellie Update: Ellie had a GREAT month! She discovered a new scratching tree near the east fence and has been spending every morning rubbing against it. The keepers measured her — she\'s grown 2 inches since last year!\n\nThank you for making her care possible.',
                'Ellie Update: Big news — Ellie made a friend! A wild bird has started perching on her back during afternoon walks. She stands very still so it won\'t fly away. The keepers have named the bird "Tiny."\n\nYour sponsorship keeps these moments happening.',
                'Ellie Update: Ellie tried pumpkin for the first time this month. Verdict: she LOVED it. She stomped on the first one (on purpose, we think) and then ate the pieces off the ground. We\'re adding pumpkin to her regular rotation!\n\nThank you for keeping Ellie fed and happy.',
                'Ellie Update: Ellie had her annual veterinary checkup and passed with flying colors! Healthy weight, strong tusks, and her feet are in excellent condition. The vet said she\'s "one of the happiest elephants I\'ve examined."\n\nThat\'s thanks to sponsors like you!',
                'Ellie Update: We caught Ellie painting! Well, sort of. She picked up a muddy stick and dragged it along the sanctuary wall, leaving a long brown streak. Our head keeper jokes that she\'s the sanctuary\'s first resident artist.\n\nYour support funds enrichment activities just like this.',
                'Ellie Update: Rainy season brought out Ellie\'s playful side. She spent three straight hours dancing in puddles yesterday. DANCING. Ears flapping, trunk swinging. One of the interns cried (happy tears).\n\nThank you for giving Ellie a life worth dancing about.',
                'Ellie Update: Ellie has developed a new trick — she\'s learned to turn on the water hose by stepping on it. The keepers find this less amusing than she does, especially when she sprays them during feeding time.\n\nYour sponsorship keeps the fun (and water) flowing!',
                'Ellie Update: This month we celebrated Ellie\'s "Rescue Day" — 7 years since she arrived at the sanctuary! The keepers made her a special fruit cake (watermelon base, banana frosting, mango decorations). She ate the whole thing in 4 minutes.\n\nThank you for being part of her story.'
            ]
        },

        orangutan: {
            id: 'orangutan',
            name: 'Mango',
            species: 'Snakesian Red Orangutan',
            image: './assets/interwebs/animal-charity/images/orangutan.png',
            bio: 'Mango is a 12-year-old orangutan who was born at the sanctuary. He\'s incredibly clever — he once unscrewed the bolts on his enrichment puzzle in under 30 seconds. His favorite activities include napping in hammocks and stealing hats.',
            welcomeMessage: 'Dear Friend,\n\n'
                + 'Mango just did a little happy dance! OK, we can\'t confirm that, but we KNOW he\'d be thrilled to have you as a sponsor.\n\n'
                + 'Your contribution helps fund Mango\'s enrichment programs (he goes through puzzle toys like candy), his specialized diet, and the upkeep of his treehouse habitat.\n\n'
                + 'Expect monthly updates full of Mango\'s latest antics — fair warning, he\'s a troublemaker in the best way.\n\n'
                + 'Welcome to Team Mango!\n'
                + 'The Snakesia Wildlife Fund Team\n'
                + 'sponsors@snakesia-wildlife.ex',
            farewellMessage: 'Dear Former Sponsor,\n\n'
                + 'Mango will miss you! Well, he\'ll miss anyone who supports his puzzle toy habit. Your sponsorship made a tangible difference in his daily life.\n\n'
                + 'You\'re always welcome back — Mango doesn\'t hold grudges (unless you take his hammock).\n\n'
                + 'Thank you,\n'
                + 'The Snakesia Wildlife Fund Team',
            monthlyMessages: [
                'Mango Update: Mango figured out how to braid grass this month. Nobody taught him. He just... started doing it. He\'s made about 15 little grass braids and arranged them in a neat row in his sleeping nest.\n\nYour sponsorship fuels his creative genius!',
                'Mango Update: Keeper Report — Mango stole three hats this week. Three. He puts them on, looks at his reflection in the water trough, and then hides them in his nest. We\'ve started wearing chin straps.\n\nThank you for supporting our magnificent hat thief.',
                'Mango Update: We gave Mango a new multi-layer puzzle box this month. Most orangutans take days to solve it. Mango did it in 47 minutes, then looked at the keeper like "is that all you\'ve got?" We\'re ordering a harder one.\n\nYour support keeps Mango\'s big brain busy!',
                'Mango Update: Mango discovered he can make funny faces at the sanctuary cameras. He now spends at least 20 minutes a day pressing his face against the lens. We\'ve attached a photo. You\'re welcome.\n\nThank you for supporting this absolute goofball.',
                'Mango Update: Big milestone — Mango shared his mango (yes, his actual mango) with a younger orangutan this month. This is HUGE for orangutan social development. The keepers were genuinely moved.\n\nYour sponsorship helps build these connections.',
                'Mango Update: Mango built a blanket fort. A real, structured blanket fort using sticks and the sheets from his sleeping platform. He spent the entire afternoon inside it, peeking out occasionally. We have no idea where he learned this.\n\nThank you for supporting Snakesia\'s best architect.',
                'Mango Update: Mango had his health screening this month — all clear! Strong grip strength, healthy coat, good dental health. The vet described him as "suspiciously fit for someone who naps 14 hours a day."\n\nThat\'s the Mango lifestyle, funded by you!',
                'Mango Update: It rained all week and Mango was NOT happy about it. He sat under his shelter making grumpy faces at the sky. When the sun finally came out, he immediately climbed to the top of his platform and sunbathed for three hours straight.\n\nYour support keeps Mango comfy in all weather!'
            ]
        },

        otter: {
            id: 'otter',
            name: 'Oliver',
            species: 'Snakesian River Otter',
            image: './assets/interwebs/animal-charity/images/otter.png',
            bio: 'Oliver is a 4-year-old river otter who was found orphaned near Lake Hissington. He\'s the sanctuary\'s resident charmer — always sliding, splashing, and showing off for visitors. He has a favorite rock that he carries everywhere.',
            welcomeMessage: 'Dear Friend,\n\n'
                + 'SQUEAK! That\'s Oliver-speak for "thank you!"\n\n'
                + 'By sponsoring Oliver, you\'re helping maintain his aquatic habitat, fund his (frankly excessive) fish diet, and keep his enrichment pool at the perfect temperature.\n\n'
                + 'Oliver is an absolute delight and we can\'t wait to share his monthly adventures with you. Spoiler: there will be splashing.\n\n'
                + 'Welcome aboard!\n'
                + 'The Snakesia Wildlife Fund Team\n'
                + 'sponsors@snakesia-wildlife.ex',
            farewellMessage: 'Dear Former Sponsor,\n\n'
                + 'Oliver did a sad little squeak when we told him. (OK fine, he was just asking for fish, but we like to think he\'ll miss you.)\n\n'
                + 'Your support truly mattered — every fish, every pool cleaning, every enrichment toy. Thank you for being part of Oliver\'s journey.\n\n'
                + 'Warm regards,\n'
                + 'The Snakesia Wildlife Fund Team',
            monthlyMessages: [
                'Oliver Update: Oliver learned a new trick — he can now balance TWO rocks on his belly while floating! He\'s very proud of this achievement and does it every time someone walks by. Show-off.\n\nYour sponsorship keeps Oliver in peak performance!',
                'Oliver Update: Oliver got a new ball this month and it\'s his new favorite thing. He pushes it around the pool, dives under it, flips it in the air. His old favorite rock seems a little jealous (he still sleeps with it though).\n\nThank you for keeping Oliver entertained!',
                'Oliver Update: The keepers set up a fish-finding puzzle — frozen fish inside ice blocks. Oliver figured out he could bash the ice against his belly rock to break it open. Genius? We think so.\n\nYour support funds enrichment activities like this!',
                'Oliver Update: Oliver made the keepers laugh so hard this week. He found a leaf, put it on his head, and swam around the pool with it like a little hat. When it fell off, he dove down, retrieved it, and put it back. Repeat x20.\n\nThank you for supporting this comedian.',
                'Oliver Update: Health update — Oliver is in fantastic shape! Sleek coat, healthy weight, strong teeth. The vet noted his "exceptional enthusiasm" during the exam, which is code for "he splashed everyone."\n\nYour sponsorship keeps Oliver healthy and splashy!',
                'Oliver Update: Oliver discovered the drain grate makes a funny vibrating sound when he rubs his paws on it. He now does this EVERY MORNING at 6 AM. The night keepers are less amused than we are.\n\nThank you for supporting our noisy little friend!',
                'Oliver Update: We introduced a new enrichment element — a small waterfall feature in Oliver\'s pool. He spent the entire first day swimming through it, over and over. We counted 87 passes before we stopped counting.\n\nYour generosity made this upgrade possible!',
                'Oliver Update: Oliver has started "gifting" rocks to the keepers. He swims up, drops a small pebble at their feet, and squeaks until they pick it up. He\'s done this 11 times this month. We now have a collection.\n\nYour support means the world — just like Oliver\'s rocks mean the world to him.'
            ]
        },

        owl: {
            id: 'owl',
            name: 'Professor Hoot',
            species: 'Snakesian Great Horned Owl',
            image: './assets/interwebs/animal-charity/images/owl.png',
            bio: 'Professor Hoot arrived at the sanctuary with a wing injury that prevents him from flying long distances. Despite this, he\'s the most dignified resident — always perched at the highest point, surveying his domain with what can only be described as academic disapproval.',
            welcomeMessage: 'Dear Friend,\n\n'
                + 'Professor Hoot has acknowledged your sponsorship with a slow, dignified blink. In owl language, this is basically a standing ovation.\n\n'
                + 'Your contribution supports Professor Hoot\'s specialized care, including his wing therapy sessions, his (very specific) diet of ethically-sourced rodent treats, and the maintenance of his elevated perching habitat.\n\n'
                + 'Monthly updates incoming — Professor Hoot may look serious, but he\'s full of surprises.\n\n'
                + 'Welcome,\n'
                + 'The Snakesia Wildlife Fund Team\n'
                + 'sponsors@snakesia-wildlife.ex',
            farewellMessage: 'Dear Former Sponsor,\n\n'
                + 'Professor Hoot would like you to know that he understands. He gave a single, solemn hoot when informed of your decision. (He may have just been hooting at a moth, but we choose to interpret it as gratitude.)\n\n'
                + 'Thank you for your support,\n'
                + 'The Snakesia Wildlife Fund Team',
            monthlyMessages: [
                'Professor Hoot Update: The Professor spent this month perfecting his "disappointed stare" at the sanctuary\'s squirrel population. His technique involves zero movement for up to 45 minutes. The squirrels remain unbothered. The Professor remains committed.\n\nYour sponsorship funds his ongoing research.',
                'Professor Hoot Update: Exciting news — Professor Hoot\'s wing therapy is showing results! He managed a short glide across his enclosure this week. He landed with what we can only describe as smug satisfaction.\n\nThank you for making this progress possible!',
                'Professor Hoot Update: Professor Hoot has chosen a new favorite perch — the top of the keeper\'s equipment shed. He sits there every evening at exactly 6:47 PM. We don\'t know why 6:47 specifically. Neither does he, probably.\n\nYour support keeps the Professor in high places!',
                'Professor Hoot Update: A wild owl visited the sanctuary this month and hooted outside Professor Hoot\'s enclosure. The Professor hooted back. This went on for THREE HOURS. The night keepers described it as "the longest conversation they\'ve ever had to listen to."\n\nThank you for supporting our social butterfly. Er, owl.',
                'Professor Hoot Update: The Professor knocked over his water dish this month and then stared at the puddle for 20 minutes as if it had personally offended him. He did not drink from it. He did not move. He just... judged it.\n\nYour sponsorship funds these important contemplations.',
                'Professor Hoot Update: Health check time! Professor Hoot received a clean bill of health. The vet noted he is "in excellent condition and deeply uncooperative." His wing continues to strengthen. He bit the thermometer. Classic Professor.\n\nThank you for keeping him healthy (and feisty)!',
                'Professor Hoot Update: A keeper accidentally left their lunch bag near Professor Hoot\'s enclosure. When they came back, the Professor was sitting directly on top of it, making unblinking eye contact. The sandwich was unharmed but claimed.\n\nYour support keeps our owl fed — even when he helps himself.',
                'Professor Hoot Update: Professor Hoot discovered that if he hoots at exactly the right pitch, it makes the motion-sensor light turn on. He now does this at 3 AM. Repeatedly. For fun. We\'re considering relocating the light.\n\nThank you for supporting our nocturnal genius!'
            ]
        },

        penguins: {
            id: 'penguins',
            name: 'The Waddle Squad',
            species: 'Snakesian Rock Penguins',
            image: './assets/interwebs/animal-charity/images/penguins.png',
            bio: 'The Waddle Squad is a group of five rock penguins — Pip, Pop, Percy, Patches, and Pudding. They were rescued from a polluted coastal area and now live in the sanctuary\'s climate-controlled habitat. They do everything together, including their famous synchronized swimming routine.',
            welcomeMessage: 'Dear Friend,\n\n'
                + 'Five little penguins just did a happy waddle! You\'re now the official sponsor of The Waddle Squad — Pip, Pop, Percy, Patches, and Pudding.\n\n'
                + 'Your sponsorship helps maintain their climate-controlled habitat (penguins are VERY particular about temperature), fund their fish supply (5 penguins = a LOT of fish), and support their enrichment activities.\n\n'
                + 'Get ready for quintuple the cuteness in your monthly updates!\n\n'
                + 'Welcome to the Squad!\n'
                + 'The Snakesia Wildlife Fund Team\n'
                + 'sponsors@snakesia-wildlife.ex',
            farewellMessage: 'Dear Former Sponsor,\n\n'
                + 'The Waddle Squad did a sad little huddle when they heard the news. (They may have just been cold. It\'s hard to tell with penguins.)\n\n'
                + 'Your support helped five little penguins thrive, and that\'s something to be proud of. If you ever want to rejoin the Squad, they\'ll be here — probably swimming in circles.\n\n'
                + 'Thank you,\n'
                + 'The Snakesia Wildlife Fund Team',
            monthlyMessages: [
                'Waddle Squad Update: Pip learned to jump onto the big rock this month! The other four watched, tried to copy, and all slid off. Pip is very smug about it. The rivalry continues.\n\nYour sponsorship keeps the competition fierce!',
                'Waddle Squad Update: The Squad developed a new formation — they now line up by height before feeding time. Pudding (the smallest) always pushes to the front anyway. Democracy has failed. Pudding reigns supreme.\n\nThank you for feeding the revolution!',
                'Waddle Squad Update: Pop and Percy had a disagreement over a fish. This involved a lot of squawking, wing-flapping, and one dramatic belly-slide. They made up within 4 minutes and went swimming together. Penguin grudges are short.\n\nYour sponsorship keeps the peace (and the fish flowing)!',
                'Waddle Squad Update: We added a new slide to the habitat and ALL FIVE penguins have been using it nonstop. They slide down, waddle back up, slide down again. Patches does a little spin at the bottom. We\'ve lost count of how many runs they\'ve done.\n\nThank you for making this upgrade possible!',
                'Waddle Squad Update: Health checkups for all five! Pip — perfect. Pop — perfect. Percy — perfect. Patches — perfect. Pudding — perfect but grumpy about being last. All weights on target, feathers in great condition.\n\nYour sponsorship keeps the whole Squad healthy!',
                'Waddle Squad Update: The Waddle Squad discovered their reflection in the new glass panel. They spent an HOUR trying to befriend the "other penguins." Pudding tried to give the reflection a fish. It did not accept.\n\nYour support funds these important social experiments.',
                'Waddle Squad Update: Synchronized swimming update — the Squad has added a new move! It involves all five diving simultaneously and popping up in a star formation. They land it about 60% of the time. The other 40% is chaos.\n\nYour sponsorship supports their artistic vision!',
                'Waddle Squad Update: It was enrichment day and we filled the pool with safe, floating balls. Pip claimed 4 of them and defended them aggressively. Percy tried to steal one and got HONKED at. Pop just swam underneath and ignored the drama entirely.\n\nThank you for keeping the Squad entertained!'
            ]
        },

        'snow-leopard': {
            id: 'snow-leopard',
            name: 'Sssylvia',
            species: 'Snakesian Snow Leopard',
            image: './assets/interwebs/animal-charity/images/snow leopard.png',
            bio: 'Sssylvia is a majestic 6-year-old snow leopard who came to the sanctuary from a closed wildlife park. She\'s elusive, graceful, and has the fluffiest tail in all of Snakesia. She spends most of her time stalking imaginary prey and looking breathtakingly beautiful.',
            welcomeMessage: 'Dear Friend,\n\n'
                + 'Somewhere in her enclosure, Sssylvia just did an elegant flick of her magnificent tail. That\'s her version of a thank you.\n\n'
                + 'Your sponsorship supports Sssylvia\'s specialized care — including her climate-controlled mountain habitat, her enrichment program (she\'s a natural hunter and needs lots of mental stimulation), and her veterinary care.\n\n'
                + 'Snow leopards are among the rarest cats in Snakesia, and your support helps protect this incredible species.\n\n'
                + 'Welcome to Team Sssylvia,\n'
                + 'The Snakesia Wildlife Fund Team\n'
                + 'sponsors@snakesia-wildlife.ex',
            farewellMessage: 'Dear Former Sponsor,\n\n'
                + 'Sssylvia looked into the distance with quiet dignity when she heard. (She does this anyway, but we like to think it was about you.)\n\n'
                + 'Your sponsorship made a real difference for one of Snakesia\'s rarest creatures. Thank you for your time as a supporter.\n\n'
                + 'Gracefully yours,\n'
                + 'The Snakesia Wildlife Fund Team',
            monthlyMessages: [
                'Sssylvia Update: Sssylvia was caught doing something adorable this month — she was chasing her own tail. For TWENTY MINUTES. When she noticed the keeper watching, she immediately stopped and pretended to be surveying the horizon. Dignity restored.\n\nYour sponsorship keeps Sssylvia in top form!',
                'Sssylvia Update: Sssylvia pounced on a falling leaf this week with the precision of a apex predator. She pinned it, inspected it, and then walked away as if to say "I COULD have caught real prey." We were all very impressed.\n\nThank you for supporting our fierce huntress!',
                'Sssylvia Update: We set up a new elevated platform in Sssylvia\'s habitat and she LOVES it. She spends hours up there, tail draped over the edge, watching the world below with an expression of regal indifference. It\'s the most snow leopard thing ever.\n\nYour support made this upgrade possible!',
                'Sssylvia Update: Sssylvia had her checkup this month — beautiful coat, healthy weight, excellent reflexes (she swatted the stethoscope). The vet called her "the picture of feline health." She responded by ignoring him completely.\n\nYour sponsorship keeps this queen healthy!',
                'Sssylvia Update: SNOW DAY! We brought in fresh snow for Sssylvia\'s enclosure and she went WILD. Rolling, leaping, pouncing on snowballs. She made a snow angel. A SNOW LEOPARD SNOW ANGEL. The keepers nearly passed out from cuteness.\n\nThank you for funding these magical moments!',
                'Sssylvia Update: Sssylvia has started "hiding" behind a small bush that absolutely does not conceal her. She crouches there, tail sticking out, and waits for the keeper to walk by so she can "ambush" them. The keeper plays along every time.\n\nYour support funds the best game of hide-and-seek in Snakesia!',
                'Sssylvia Update: Sssylvia discovered the heating vent in her den this month and has been sleeping directly on top of it. She stretches out to maximum floof, all four paws in the air. The security camera footage is genuinely healing.\n\nYour sponsorship keeps Sssylvia warm and cozy!',
                'Sssylvia Update: A butterfly landed on Sssylvia\'s nose this week. She went cross-eyed looking at it. She sat perfectly still for almost a minute before gently shaking her head. The butterfly flew away. Sssylvia watched it go with what appeared to be genuine wonder.\n\nThank you for giving Sssylvia a life full of small wonders.'
            ]
        }
    }
};