// =================================
// STOCK DATA — Company Definitions for Snake Valley Stock Exchange
// =================================
// Pure data file. 14 publicly traded Snakesian companies.
// Loaded before stock-service.js. Referenced by ticker symbol.
//
// Volatility ratings:
//   Low    = 0.05 (+/-2-5% monthly)
//   Medium = 0.12 (+/-5-12% monthly)
//   High   = 0.25 (+/-10-25% monthly)
//   Extreme = 0.40 (+/-15-40% monthly)
//
// Dividend rates are MONTHLY, based on current share price.
// 0 = no dividend (pure growth/speculation).
// =================================

var STOCK_DEFINITIONS = [
    // ---- TECH SECTOR ----
    {
        ticker: 'ELXA',
        name: 'ElxaCorp',
        sector: 'Technology',
        startingPrice: 120,
        volatility: 0.05,
        dividendRate: 0.008,
        description: "The user's employer. Makes ElxaOS. Stable blue chip with a loyal investor base."
    },
    {
        ticker: 'SNGL',
        name: 'Snoogle Inc.',
        sector: 'Technology',
        startingPrice: 85,
        volatility: 0.12,
        dividendRate: 0.003,
        description: "Snakesia's dominant search engine. Solid tech stock with moderate growth."
    },
    {
        ticker: 'DSSC',
        name: 'Dissscord Technologies',
        sector: 'Technology',
        startingPrice: 30,
        volatility: 0.25,
        dividendRate: 0,
        description: 'Social platform. Massively popular but famously unprofitable. Volatile.'
    },

    // ---- FINANCE SECTOR ----
    {
        ticker: 'FSB',
        name: 'First Snakesian Bank',
        sector: 'Finance',
        startingPrice: 95,
        volatility: 0.05,
        dividendRate: 0.010,
        description: 'The oldest bank in Snakesia. Rock-solid dividend payer. Boring in the best way.'
    },

    // ---- REAL ESTATE & AUTO ----
    {
        ticker: 'MALD',
        name: 'Mallard Realty Holdings',
        sector: 'Real Estate',
        startingPrice: 55,
        volatility: 0.12,
        dividendRate: 0.005,
        description: 'Real estate empire. Steady growth tied to the Snakesian housing market.'
    },
    {
        ticker: 'PATO',
        name: 'Pato & Sons Automotive Group',
        sector: 'Automotive',
        startingPrice: 40,
        volatility: 0.12,
        dividendRate: 0.004,
        description: 'Family dealership chain gone public. Mid-cap steady performer.'
    },

    // ---- CONSUMER & ENTERTAINMENT ----
    {
        ticker: 'SCAT',
        name: 'Sussy Cat Entertainment',
        sector: 'Entertainment',
        startingPrice: 12,
        volatility: 0.40,
        dividendRate: 0,
        description: 'Meme stock king. Runs on hype and chaos. Basically a casino with a ticker symbol.'
    },
    {
        ticker: 'FANG',
        name: 'Fang Foods International',
        sector: 'Consumer',
        startingPrice: 65,
        volatility: 0.05,
        dividendRate: 0.006,
        description: "Snakesia's biggest food company. Boring but reliable. Everyone eats."
    },
    {
        ticker: 'VENM',
        name: 'Venom Energy Corp',
        sector: 'Consumer',
        startingPrice: 18,
        volatility: 0.25,
        dividendRate: 0,
        description: 'Energy drink startup. Wild price swings. The young snakes love it.'
    },
    {
        ticker: 'BITE',
        name: 'SnakeBite Labs',
        sector: 'Biotech',
        startingPrice: 70,
        volatility: 0.12,
        dividendRate: 0.003,
        description: "Mr. Snake-e's biotech R&D company. Innovative but risky. Big potential."
    },

    // ---- TELECOM & INFRASTRUCTURE ----
    {
        ticker: 'COIL',
        name: 'Coil Communications',
        sector: 'Telecom',
        startingPrice: 50,
        volatility: 0.05,
        dividendRate: 0.007,
        description: "Snakesia's telecom monopoly. Boring, pays dividends, barely moves."
    },

    // ---- LIFESTYLE & OTHER ----
    {
        ticker: 'STFC',
        name: 'Scales & Tails Fashion Co.',
        sector: 'Lifestyle',
        startingPrice: 25,
        volatility: 0.25,
        dividendRate: 0,
        description: 'Trendy fashion brand. Surges on hype, crashes on bad press.'
    },
    {
        ticker: 'HISS',
        name: 'Hiss Hotels & Resorts',
        sector: 'Hospitality',
        startingPrice: 45,
        volatility: 0.12,
        dividendRate: 0.004,
        description: 'Luxury hospitality chain. Seasonal swings but solid dividend payer.'
    },
    {
        ticker: 'SLTH',
        name: 'Slither Dynamics',
        sector: 'Defense',
        startingPrice: 35,
        volatility: 0.25,
        dividendRate: 0,
        description: 'Defense and aerospace contractor. Big government contracts mean big swings.'
    }
];
