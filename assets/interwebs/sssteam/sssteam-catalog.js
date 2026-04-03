// =======================================
// SSSTEAM GAME CATALOG — Data Only
// =======================================
window.SSSTEAM_CATALOG = [
    {
        id: 'classic_snake',
        name: 'Classic Snake',
        description: 'The timeless classic! Guide your snake to eat food and grow longer, but watch out — one wrong turn and it\'s game over. Simple to learn, impossible to master.',
        shortDesc: 'The original snake game — simple, addictive, timeless.',
        price: 0,
        priceDisplay: 'Free to Play',
        icon: '🐍',
        author: 'ElxaOS Games Studio',
        version: '2.0',
        rating: 4.5,
        reviewCount: 3247,
        tags: ['Arcade', 'Classic', 'Free'],
        heroColor: '#1a5c2a',
        screenshots: [],
        features: [
            'Classic arcade gameplay',
            'Smooth controls',
            'Increasing speed as you grow',
            'High score tracking',
            'Retro charm with modern polish'
        ],
        sysReqs: { os: 'ElxaOS 1.0+', ram: '8 MB', disk: '2 MB', display: 'VGA (640x480)' },
        reviews: [
            { author: 'Slinky_Steve', rating: 5, text: 'Been playing this since ElxaOS 0.9. Still the best way to waste an afternoon. Pure snake perfection.', helpful: 142 },
            { author: 'CasualGamer99', rating: 4, text: 'Great little time-killer. Wish there were more levels but honestly the simplicity is what makes it.', helpful: 87 },
            { author: 'RetroFan_SS', rating: 5, text: 'They don\'t make \'em like this anymore! Classic gameplay that never gets old.', helpful: 63 }
        ],
        installerData: {
            id: 'snake_game',
            name: 'Classic Snake',
            description: 'The classic Snake game! Control the snake, eat food, grow longer, and try not to crash.',
            icon: '🐍',
            version: '2.0',
            author: 'ElxaOS Games Studio',
            gameData: { type: 'snake_game', speed: 150, boardSize: 20, difficulty: 'normal' }
        }
    },
    {
        id: 'target_game',
        name: 'Target Practice',
        description: 'Test your reflexes in this fast-paced clicking challenge! Targets appear randomly across the screen — click them before they vanish. You\'ve got 30 seconds. How many can you hit?',
        shortDesc: 'Click fast! 30 seconds of target-smashing action.',
        price: 0,
        priceDisplay: 'Free to Play',
        icon: '🎯',
        author: 'ElxaOS Games',
        version: '1.0',
        rating: 3.8,
        reviewCount: 1523,
        tags: ['Arcade', 'Casual', 'Free'],
        heroColor: '#5c1a1a',
        screenshots: [],
        features: [
            '30-second challenge mode',
            'Random target spawning',
            'Score tracking',
            'Quick to pick up, hard to put down',
            'Great for short breaks'
        ],
        sysReqs: { os: 'ElxaOS 1.0+', ram: '8 MB', disk: '1 MB', display: 'VGA (640x480)' },
        reviews: [
            { author: 'ClickMaster3000', rating: 4, text: 'Simple but surprisingly addictive. My personal best is 280! Try to beat that.', helpful: 98 },
            { author: 'OfficeDrone_42', rating: 4, text: 'Perfect for a quick break between spreadsheets. Don\'t tell my boss.', helpful: 214 }
        ],
        installerData: {
            id: 'target_game',
            name: 'Target Practice',
            description: 'A fun clicking game where you try to hit as many targets as possible!',
            icon: '🎯',
            version: '1.0',
            author: 'ElxaOS Games',
            gameData: { type: 'target_game', difficulty: 'normal' }
        }
    },
    {
        id: 'mail_room_mayhem',
        name: 'Mail Room Mayhem',
        description: 'Welcome to the ElxaCorp mail room! Sort incoming Snakesian mail into the correct departments before time runs out. Use keyboard controls for lightning-fast sorting — but watch out for Pushing Cat, who loves to cause chaos in the mail room!',
        shortDesc: 'Fast-paced Snakesian mail sorting — watch out for the cat!',
        price: 29.99,
        priceDisplay: '$29.99',
        icon: '<img src="./assets/games/mail-room-mayhem/icon.png" style="width:1em;height:1em;object-fit:contain;vertical-align:middle">',
        iconEmoji: '📬',
        author: 'ElxaCorp Games Division',
        version: '1.0',
        rating: 4.2,
        reviewCount: 876,
        tags: ['Action', 'Arcade', 'Workplace'],
        heroColor: '#1a3b5c',
        heroImage: './assets/interwebs/sssteam/images/mrm/mrm_cover.png',
        screenshots: [
            { src: './assets/interwebs/sssteam/images/mrm/mrm1.png', caption: 'Sorting the Mail' },
            { src: './assets/interwebs/sssteam/images/mrm/mrm2.png', caption: 'Pushing Cat Chaos' },
            { src: './assets/interwebs/sssteam/images/mrm/mrm3.png', caption: 'Mail Room Action' }
        ],
        features: [
            'Keyboard-optimized sorting controls',
            'Pushing Cat surprise events',
            'Authentic Snakesian mail content',
            'Progressive difficulty — starts easy, gets intense',
            '4 sorting departments: Executive, Tech, Snakesia, Recycle',
            'High score tracking'
        ],
        sysReqs: { os: 'ElxaOS 1.0+', ram: '16 MB', disk: '25 MB', display: 'SVGA (800x600)' },
        reviews: [
            { author: 'MailSnake_Pro', rating: 5, text: 'Finally a game that understands the thrill of mail sorting! The Pushing Cat events are hilarious.', helpful: 156 },
            { author: 'ElxaCorp_Intern', rating: 4, text: 'This is literally my job but somehow it\'s more fun as a game?? The keyboard controls are super snappy.', helpful: 203 },
            { author: 'CatLover_2000', rating: 3, text: 'Great game but Pushing Cat knocked my mail off the desk IRL while I was playing. 10/10 immersion.', helpful: 341 }
        ],
        installerData: {
            id: 'mail_room_mayhem',
            name: 'Mail Room Mayhem',
            description: 'ElxaCorp\'s Fast-Paced Sorting Challenge - Sort Snakesian mail with keyboard-optimized controls!',
            icon: '<img src="./assets/games/mail-room-mayhem/icon.png" style="width:1em;height:1em;object-fit:contain;vertical-align:middle">',
            version: '1.0',
            author: 'ElxaCorp Games Division - Mail Dept.',
            gameData: {
                type: 'mail_room_mayhem',
                features: ['Keyboard-optimized controls', 'Pushing Cat events', 'Snakesian mail content', 'High score tracking'],
                departments: ['Executive', 'Tech', 'Snakesia', 'Recycle'],
                difficulty: 'Progressive - starts easy, gets intense!'
            }
        }
    },
    {
        id: 'sussy_cat',
        name: 'Sussy Cat Adventure',
        description: 'Meet Pushing Cat, the most mischievous little black cat in Snakesia! When his family leaves the house, it\'s time for some serious sus adventures. Sneak around the house, collect items, hide in the secret Sussy Lair, and master the art of being perfectly sus. A cozy stealth game the whole family can enjoy.',
        shortDesc: 'A cozy stealth game starring Snakesia\'s sussiest cat.',
        price: 29.99,
        priceDisplay: '$29.99',
        icon: '<img src="./assets/games/sussycat/icon.png" style="width:1em;height:1em;object-fit:contain;vertical-align:middle">',
        iconEmoji: '😼',
        author: 'ElxaCorp Games Division',
        version: '1.2',
        rating: 4.7,
        reviewCount: 2103,
        tags: ['Stealth', 'Adventure', 'Family'],
        heroColor: '#2a1f4f',
        heroImage: './assets/interwebs/sssteam/images/sussy-cat/sussy-cat_cover.png',
        screenshots: [
            { src: './assets/interwebs/sssteam/images/sussy-cat/sussy-cat1.png', caption: 'Start Screen' },
            { src: './assets/interwebs/sssteam/images/sussy-cat/sussy-cat2.png', caption: 'Kitchen Level' },
            { src: './assets/interwebs/sssteam/images/sussy-cat/sussy-cat3.png', caption: 'Bedroom & Sussy Lair' }
        ],
        features: [
            '6 challenging levels with increasing difficulty',
            '4 rooms: Living Room, Kitchen, Bedroom, Bathroom',
            'Secret Sussy Lair hiding spot',
            'Advanced Plotting mechanic with power-ups',
            'Over 24 items to collect',
            'Retro pixel art with smooth controls',
            'Family-friendly stealth gameplay',
            'Save progress and beat your best times'
        ],
        sysReqs: { os: 'ElxaOS 1.0+', ram: '16 MB (32 MB rec.)', disk: '50 MB', display: 'SVGA (640x480, 256 colors)' },
        reviews: [
            { author: 'PushingCatFan', rating: 5, text: 'The BEST game on ElxaOS, no contest. The plotting mechanic in v1.2 is genius. My cat watched me play and looked offended.', helpful: 412 },
            { author: 'StealthySnake', rating: 5, text: 'Who knew a cat stealth game could be this good? The Sussy Lair mechanic is so creative.', helpful: 178 },
            { author: 'GameDad_Steve', rating: 4, text: 'My kids absolutely love this. We take turns trying to beat each other\'s scores. Family game night winner!', helpful: 265 },
            { author: 'SnakesiaToday', rating: 5, text: 'ElxaCorp Games Division has outdone themselves. A must-play for every ElxaOS user.', helpful: 89 }
        ],
        installerData: {
            id: 'sussy_cat_adventure',
            name: 'Sussy Cat Adventure',
            description: 'A Cozy Stealth Game for Kids - Help Pushing Cat collect items while avoiding detection!',
            icon: '<img src="./assets/games/sussycat/icon.png" style="width:1em;height:1em;object-fit:contain;vertical-align:middle">',
            version: '1.2',
            author: 'ElxaCorp Games Division',
            gameData: {
                type: 'sussy_cat_game',
                levels: 6,
                rooms: ['Living Room', 'Kitchen', 'Bedroom', 'Bathroom'],
                features: ['Sussy Lair hiding spot', 'Plotting mechanic', 'Retro pixel art', 'Family-friendly gameplay']
            }
        }
    },
    {
        id: 'snake_deluxe',
        name: 'Snake Deluxe Executive Training Suite',
        description: 'More than a game — it\'s a leadership experience. Guide CEO Snake-E through increasingly complex corporate challenges in this premium snake experience. Features boardroom-approved graphics, executive-grade controls, and a "strategic navigation" mechanic that definitely isn\'t just snake with extra steps.',
        shortDesc: 'Premium corporate snake — leadership has never been this smooth.',
        price: 39.99,
        priceDisplay: '$39.99',
        icon: '🏢',
        author: 'ElxaCorp Business Solutions',
        version: '3.0',
        rating: 4.4,
        reviewCount: 567,
        tags: ['Strategy', 'Business', 'Premium'],
        heroColor: '#1a1a2e',
        screenshots: [],
        features: [
            'Premium "executive-grade" snake gameplay',
            'CEO Snake-E character with business attire',
            'Boardroom-approved visual styling',
            '"Strategic Navigation" mechanics',
            'Corporate leadership training (technically)',
            'Multiple difficulty tiers: Intern to CEO',
            'Expense-reportable (check with your manager)'
        ],
        sysReqs: { os: 'ElxaOS 1.0+', ram: '32 MB', disk: '75 MB', display: 'SVGA (800x600, 16-bit color)' },
        reviews: [
            { author: 'CEO_SnakeE', rating: 5, text: 'I approved this product myself. It is excellent. Buy it. That\'s not a suggestion.', helpful: 567 },
            { author: 'MiddleMgmt_Mike', rating: 4, text: 'Put it on my expense report as "leadership development software." It wasn\'t questioned.', helpful: 423 },
            { author: 'InternJessie', rating: 5, text: 'My boss told me to play this during my lunch break. I think it counts as professional development??', helpful: 198 },
            { author: 'FinanceDept', rating: 3, text: '$39.99 for snake with a tie on? ...Actually it IS pretty fun. Don\'t tell my team I said that.', helpful: 356 }
        ],
        installerData: {
            id: 'snake_deluxe',
            name: 'Snake Deluxe Executive Training Suite',
            description: 'Premium corporate leadership training disguised as the world\'s most sophisticated snake game.',
            icon: '🏢',
            version: '3.0',
            author: 'ElxaCorp Business Solutions',
            gameData: {
                type: 'snake_deluxe',
                features: ['Executive graphics', 'CEO Snake-E character', 'Corporate challenges'],
                difficulty: 'Intern to CEO progression'
            }
        }
    },
    {
        id: 'chess',
        name: 'Chess',
        description: 'The classic game of strategy and tactics! Learn to play chess with helpful features like move highlighting, piece info tooltips, and undo. Three difficulty levels let you grow from beginner to advanced player. Beautiful pixel art pieces and multiple board themes make every game a treat.',
        shortDesc: 'Classic chess with beginner-friendly features.',
        price: 25.99,
        priceDisplay: '$25.99',
        icon: '♟️',
        author: 'ElxaCorp Games Division',
        version: '1.0',
        rating: 4.5,
        reviewCount: 1247,
        tags: ['Strategy', 'Board Game', 'Educational'],
        heroColor: '#5d4037',
        heroImage: './assets/interwebs/sssteam/images/chess/chess_cover.png',
        screenshots: [
            { src: './assets/interwebs/sssteam/images/chess/chess1.png', caption: 'Game Setup' },
            { src: './assets/interwebs/sssteam/images/chess/chess2.png', caption: 'Opening Board' },
            { src: './assets/interwebs/sssteam/images/chess/chess3.png', caption: 'Mid-Game with Check' }
        ],
        features: [
            'Three difficulty levels: Easy, Medium, Hard',
            'Legal move highlighting — see where every piece can go',
            'Piece info tooltips — learn what each piece does',
            'Undo moves — take back mistakes while learning',
            'Multiple board color themes',
            'Captured pieces display with point tracking',
            'Play as White or Black',
            'Beautiful pixel art chess pieces'
        ],
        sysReqs: { os: 'ElxaOS 1.0+', ram: '16 MB', disk: '2 MB', display: 'VGA (640x480)' },
        reviews: [
            { author: 'ChessKid42', rating: 5, text: 'My dad got me this and now I can beat him! The move highlights make it so much easier to learn.', helpful: 89 },
            { author: 'SnakeGrandmaster', rating: 4, text: 'Great for learning. Hard mode is actually challenging. Would love to see online multiplayer someday.', helpful: 34 },
            { author: 'PawnStar', rating: 5, text: 'Finally a chess game that teaches you as you play. The piece info tooltips are perfect for beginners.', helpful: 56 },
            { author: 'BoardGameFan_99', rating: 5, text: 'The pixel art pieces are adorable and the different board themes keep things fresh. Worth every snake!', helpful: 122 }
        ],
        installerData: {
            id: 'chess',
            name: 'Chess',
            description: 'Classic chess with beginner-friendly features',
            icon: '♟️',
            version: '1.0',
            author: 'ElxaCorp Games Division',
            gameData: {
                type: 'chess',
                difficulty: 'easy',
                features: ['move_highlights', 'piece_info', 'undo', 'captured_display']
            }
        }
    },

    // ============================================
    //  QUACKER POND
    // ============================================
    {
        id: 'quacker_pond',
        name: 'Quacker Pond',
        description: 'Welcome to Quacker Pond — your very own duck sanctuary! Hatch eggs, raise adorable ducks, feed and care for them, breed rare color combinations, and build the ultimate flock. Mix duck colors to discover Uncommon, Rare, Epic, and even Legendary breeds. Every duck has a name, a mood, and a price tag — sell your prized quackers for snakes or release them into the wild. Just don\'t forget to clean up after them!\n\nCan you breed the mythical Golden Duck?',
        shortDesc: 'Hatch, breed, and collect ducks — discover rare colors!',
        price: 29.99,
        priceDisplay: '$29.99',
        icon: '🦆',
        author: 'ElxaCorp Games Division',
        version: '1.0',
        rating: 4.7,
        reviewCount: 312,
        tags: ['Simulation', 'Casual', 'Collecting'],
        heroColor: '#2e7d32',
        heroImage: '',
        screenshots: [],
        features: [
            'Hatch ducks from eggs and name your flock',
            'Breed ducks to discover 14+ color varieties',
            'Color mixing system — combine parents for rare offspring',
            'Feed, clean, and keep your ducks happy',
            'Sell rare breeds for big snakes',
            'Animated duck sprites with walking and swimming',
            'Scenic pond backdrop with land and water zones',
            'Hunt for the Legendary Golden Duck (5% chance!)'
        ],
        sysReqs: { os: 'ElxaOS 1.0+', ram: '32 MB', disk: '4 MB', display: 'VGA (640x480)' },
        reviews: [
            { author: 'DuckLover99', rating: 5, text: 'I spent three hours trying to breed a Golden Duck. No regrets. Mr. Quackers is my best friend now.', helpful: 203 },
            { author: 'SnakesiaFarmer', rating: 4, text: 'Great sim! The breeding system is surprisingly deep. Wish I could have more than 8 ducks though.', helpful: 87 },
            { author: 'CasualGamer_Snek', rating: 5, text: 'So relaxing. I just watch my ducks waddle around the pond. 10/10 would quack again.', helpful: 156 },
            { author: 'ColorMixer42', rating: 5, text: 'Finally bred a Purple duck after 20 tries! The color mixing table is genius.', helpful: 94 }
        ],
        installerData: {
            id: 'quacker_pond',
            name: 'Quacker Pond',
            description: 'Duck management sim — hatch, breed, collect!',
            icon: '🦆',
            version: '1.0',
            author: 'ElxaCorp Games Division',
            gameData: {
                type: 'quacker_pond',
                features: ['hatching', 'breeding', 'feeding', 'cleaning', 'selling']
            }
        }
    }
];
