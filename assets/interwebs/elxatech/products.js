// ============================================================
// ElxaTech — Product Catalog
// ElxaCorp's consumer electronics lineup
// ============================================================

var ELXATECH_CATEGORIES = [
    { id: 'phones', name: 'Phones', icon: 'mdi-cellphone', tagline: 'Talk. Text. Dominate.' },
    { id: 'tablets', name: 'Tablets', icon: 'mdi-tablet', tagline: 'Bigger screen. Bigger ideas.' },
    { id: 'laptops', name: 'Laptops', icon: 'mdi-laptop', tagline: 'Power wherever you go.' },
    { id: 'accessories', name: 'Accessories', icon: 'mdi-watch', tagline: 'Complete your setup.' }
];

var ELXATECH_PRODUCTS = [

    // ── Phones ──────────────────────────────────────────────

    {
        id: 'elxaphone-se',
        name: 'ElxaPhone SE',
        category: 'phones',
        tier: 'budget',
        price: 199,
        priceDisplay: '§398',
        tagline: 'Everything you need. Nothing you don\'t.',
        description: 'The ElxaPhone SE packs the essentials into a compact, no-nonsense design. Perfect for first-time smartphone buyers or anyone who thinks a phone should just be a phone. Runs ElxaOS Mobile with zero bloatware.',
        specs: {
            display: '5.4" Retina LCD',
            chip: 'Elxa S3',
            camera: '12 MP Single Lens',
            battery: 'All-day battery life',
            storage: '64 GB',
            os: 'ElxaOS Mobile 5'
        },
        image: 'images/cheap phone.png',
        badge: null
    },

    {
        id: 'elxaphone-6',
        name: 'ElxaPhone 6',
        category: 'phones',
        tier: 'mid',
        price: 499,
        priceDisplay: '§998',
        tagline: 'The phone for the rest of us.',
        description: 'The flagship ElxaPhone experience. Gorgeous edge-to-edge display, dual cameras that make your selfies look professional, and enough horsepower to run anything the ExWeb throws at it.',
        specs: {
            display: '6.1" Super AMOLED',
            chip: 'Elxa S6',
            camera: '48 MP Dual Lens',
            battery: '2-day battery life',
            storage: '128 GB',
            os: 'ElxaOS Mobile 5'
        },
        image: 'images/mid phone.png',
        badge: 'Popular'
    },

    {
        id: 'elxaphone-6-pro',
        name: 'ElxaPhone 6 Pro',
        category: 'phones',
        tier: 'premium',
        price: 899,
        priceDisplay: '§1,798',
        tagline: 'Pro cameras. Pro display. Pro everything.',
        description: 'The most advanced ElxaPhone ever. Triple-lens camera system with night mode, ProMotion 120Hz display, and the Elxa S6 Pro chip. Built for creators, power users, and people who just like nice things.',
        specs: {
            display: '6.7" ProMotion OLED (120Hz)',
            chip: 'Elxa S6 Pro',
            camera: '108 MP Triple Lens + LiDAR',
            battery: '2-day battery life',
            storage: '256 GB',
            os: 'ElxaOS Mobile 5'
        },
        image: 'images/high phone.png',
        badge: 'New'
    },

    // ── Tablets ──────────────────────────────────────────────

    {
        id: 'elxatab-se',
        name: 'ElxaTab SE',
        category: 'tablets',
        tier: 'budget',
        price: 249,
        priceDisplay: '§498',
        tagline: 'Your first tablet. Your new favorite screen.',
        description: 'A great tablet at a great price. The ElxaTab SE is perfect for browsing the ExWeb, watching videos, and casual gaming. Light enough to hold with one hand, powerful enough to keep up.',
        specs: {
            display: '8.3" LCD',
            chip: 'Elxa S3',
            camera: '8 MP Rear',
            battery: '10 hours',
            storage: '64 GB',
            os: 'ElxaOS Mobile 5'
        },
        image: 'images/cheap tablet.png',
        badge: null
    },

    {
        id: 'elxatab-6',
        name: 'ElxaTab 6',
        category: 'tablets',
        tier: 'mid',
        price: 549,
        priceDisplay: '§1,098',
        tagline: 'The tablet that replaces everything else.',
        description: 'Stunning 11-inch display, split-screen multitasking, and stylus support make the ElxaTab 6 as capable as a laptop. Perfect for artists, students, and anyone who wants a bigger canvas.',
        specs: {
            display: '11" Liquid Retina IPS',
            chip: 'Elxa S6',
            camera: '12 MP Rear + 8 MP Front',
            battery: '12 hours',
            storage: '128 GB',
            os: 'ElxaOS Mobile 5'
        },
        image: 'images/mid tablet.png',
        badge: 'Popular'
    },

    {
        id: 'elxatab-6-pro',
        name: 'ElxaTab 6 Pro',
        category: 'tablets',
        tier: 'premium',
        price: 999,
        priceDisplay: '§1,998',
        tagline: 'A canvas with no limits.',
        description: 'The ElxaTab 6 Pro is a creative powerhouse. 12.9-inch ProMotion display with P3 wide color, the Elxa S6 Pro chip, and Thunderbolt connectivity. This isn\'t a tablet — it\'s a studio.',
        specs: {
            display: '12.9" ProMotion OLED (120Hz)',
            chip: 'Elxa S6 Pro',
            camera: '12 MP Rear + 12 MP Ultra Wide',
            battery: '14 hours',
            storage: '256 GB',
            os: 'ElxaOS Mobile 5'
        },
        image: 'images/high tablet.png',
        badge: 'New'
    },

    // ── Laptops ──────────────────────────────────────────────

    {
        id: 'elxabook-air',
        name: 'ElxaBook Air',
        category: 'laptops',
        tier: 'budget',
        price: 399,
        priceDisplay: '§798',
        tagline: 'Light on weight. Heavy on value.',
        description: 'The ElxaBook Air is impossibly thin, surprisingly powerful, and won\'t empty your bank account. Great for schoolwork, ExWeb browsing, and light productivity. Fanless design means zero noise.',
        specs: {
            display: '13.3" IPS (1080p)',
            chip: 'Elxa M1',
            memory: '8 GB RAM',
            battery: '12 hours',
            storage: '128 GB SSD',
            ports: 'USB-C x2, Headphone jack'
        },
        image: 'images/cheap laptop.png',
        badge: null
    },

    {
        id: 'elxabook',
        name: 'ElxaBook',
        category: 'laptops',
        tier: 'mid',
        price: 799,
        priceDisplay: '§1,598',
        tagline: 'The laptop that does it all.',
        description: 'The standard ElxaBook is the sweet spot. Vibrant 14-inch Retina display, the M3 chip handles everything from spreadsheets to photo editing, and 18 hours of battery life means you leave the charger at home.',
        specs: {
            display: '14" Retina IPS (2560x1600)',
            chip: 'Elxa M3',
            memory: '16 GB RAM',
            battery: '18 hours',
            storage: '256 GB SSD',
            ports: 'USB-C x2, USB-A, HDMI, Headphone jack'
        },
        image: 'images/mid laptop.png',
        badge: 'Popular'
    },

    {
        id: 'elxabook-pro',
        name: 'ElxaBook Pro',
        category: 'laptops',
        tier: 'premium',
        price: 1499,
        priceDisplay: '§2,998',
        tagline: 'Built for those who build things.',
        description: 'The ElxaBook Pro is a workstation disguised as a laptop. 16-inch Liquid Retina XDR display, the Elxa M3 Pro chip with 12-core GPU, and enough ports to connect your entire desk. For developers, designers, and anyone who demands the best.',
        specs: {
            display: '16" Liquid Retina XDR (3456x2234)',
            chip: 'Elxa M3 Pro (12-core GPU)',
            memory: '32 GB RAM',
            battery: '22 hours',
            storage: '512 GB SSD',
            ports: 'Thunderbolt x3, USB-A, HDMI, SD Card, Headphone jack'
        },
        image: 'images/high laptop.png',
        badge: 'New'
    },

    // ── Accessories ──────────────────────────────────────────

    {
        id: 'elxawatch',
        name: 'ElxaWatch',
        category: 'accessories',
        tier: 'single',
        price: 299,
        priceDisplay: '§598',
        tagline: 'Time well spent.',
        description: 'The ElxaWatch keeps you connected without pulling out your phone. Notifications, fitness tracking, heart rate monitoring, and a gorgeous always-on display. Water-resistant to 50 meters — because Snakesian rain is no joke.',
        specs: {
            display: '1.9" Always-On OLED',
            chip: 'Elxa W2',
            sensors: 'Heart Rate, SpO2, Accelerometer, GPS',
            battery: '36 hours',
            resistance: 'Water-resistant (50m)',
            connectivity: 'Bluetooth 5.3, Wi-Fi'
        },
        image: 'images/smart watch.png',
        badge: null
    },

    {
        id: 'elxapods',
        name: 'ElxaPods',
        category: 'accessories',
        tier: 'single',
        price: 149,
        priceDisplay: '§298',
        tagline: 'Sound that slithers into your soul.',
        description: 'ElxaPods deliver rich, immersive audio with active noise cancellation so good you\'ll forget you\'re on a crowded Snakesian bus. Seamless pairing with any ElxaCorp device. 6 hours of listening, 24 hours with the charging case.',
        specs: {
            driver: '11mm Custom Driver',
            anc: 'Active Noise Cancellation',
            battery: '6 hrs (24 hrs with case)',
            connectivity: 'Bluetooth 5.3',
            resistance: 'IPX4 Sweat-resistant',
            features: 'Spatial Audio, Transparency Mode'
        },
        image: 'images/earpods.png',
        badge: null
    }
];
