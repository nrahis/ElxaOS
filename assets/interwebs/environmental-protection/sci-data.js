// ============================================
// SERPENTVILLE CONSERVATION INITIATIVE — DATA
// ============================================
// Global data for monthly email messages.
// Loaded via <script> in root index.html so
// finance-notifications.js can access it.
// ============================================

var SCI_DATA = {
    orgName: 'Serpentville Conservation Initiative',
    orgEmail: 'director@sci.ex',
    orgFromName: 'Dr. Ivy Fernscale',

    // Rotating monthly update messages (8 total, cycles through)
    monthlyMessages: [
        'Great news from the Emerald Corridor! Our reforestation crew planted 340 native saplings along the Serpentine River this month. The young canopy snake maples are already attracting nesting songbirds. Your support makes every seedling possible.',

        'Our river cleanup volunteers pulled over 200 kilograms of debris from Copperhead Creek last week. Water quality tests show the healthiest readings in three years, and local fish populations are rebounding beautifully. Thank you for keeping our waterways clean!',

        'The annual wildlife census results are in! We counted 47 species of birds, 12 amphibian species, and 8 native reptile species across our protected areas. The spotted forest gecko population has grown 15% since last year — a wonderful sign of a healthy ecosystem.',

        'Our Junior Rangers program just graduated 28 young Snakesians! These kids spent the month learning about native plants, tracking animal footprints, and building birdhouses for the Fernwick Nature Reserve. Inspiring the next generation of conservationists is at the heart of everything we do.',

        'We are thrilled to announce that 40 additional hectares of old-growth forest near Mossbank Valley have been placed under permanent protection. This brings our total conserved land to over 1,200 hectares — habitats that will remain wild for generations to come.',

        'Our invasive species task force had a productive month removing thornvine clusters from the Greenscale Wetlands. Native marsh orchids are already reclaiming the cleared areas. It is painstaking work, but your support keeps our team equipped and motivated.',

        'Trail maintenance crews finished upgrading the Owl\'s Watch Loop at Fernwick Nature Reserve — new boardwalks over sensitive wetland areas and improved signage about local wildlife. Over 3,000 visitors walked our trails last month. Conservation begins with connection to nature.',

        'Exciting research update! Our field biologist Dr. Moss Pondscale has documented a previously unknown population of blue-tailed creek salamanders in the upper Serpentine watershed. This rare find underscores why protecting these habitats matters so deeply.'
    ],

    // Tier definitions (for reference — actual tiers also in index.html)
    tiers: {
        seedling:     { name: 'Seedling',     priceUSD: 5,  priceSnakes: 10, level: 1 },
        guardian:     { name: 'Guardian',      priceUSD: 15, priceSnakes: 30, level: 2 },
        conservator:  { name: 'Conservator',   priceUSD: 30, priceSnakes: 60, level: 3 }
    }
};
