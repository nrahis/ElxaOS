// =======================================
// ELXASTORE APP CATALOG — Data Only
// =======================================
// To add a new app:
// 1. Push a new entry to window.ELXASTORE_CATALOG (or add to array below)
// 2. Each entry needs: id, name, description, shortDesc, price, priceDisplay,
//    icon (MDI class), author, version, rating, reviewCount, category, tags,
//    features, installerData
// 3. The installerData.gameData.type must match a case in SimpleGame or
//    a registered program launcher in installer-service.js
// =======================================

window.ELXASTORE_CATALOG = [
    // ============================================
    //  SnakeTunes — Music Player
    // ============================================
    {
        id: 'snaketunes',
        name: 'SnakeTunes',
        description: 'The ultimate music player for Snakesia! Browse the SnakeTunes Store to purchase songs and albums from your favorite soundtracks. Build your personal library, create playlists, and enjoy crystal-clear MIDI playback right from your desktop. Published by SnakeBite Entertainment.',
        shortDesc: 'Buy, collect, and play your favorite music.',
        price: 2.995,
        priceDisplay: '5.99 snakes',
        icon: 'mdi-music',
        author: 'SnakeBite Entertainment',
        version: '1.0',
        rating: 4.7,
        reviewCount: 2841,
        category: 'Entertainment',
        tags: ['Music', 'Player', 'Store', 'Playlists', 'MIDI'],
        heroColor: '#c62828',
        features: [
            'Browse and purchase from 12 albums with 430+ tracks',
            'Buy individual songs or full albums at a discount',
            'Build and manage custom playlists',
            'Now Playing bar with playback controls',
            'Crystal-clear soundfont MIDI playback'
        ],
        screenshots: [],
        reviews: [
            { author: 'Remi', rating: 5, text: 'Finally I can listen to music on my computer!! The FF7 soundtrack is amazing.', helpful: 127 },
            { author: 'Mrs. Snake-e', rating: 4, text: 'Very nice app. I wish there were more albums from Snakesian artists though.', helpful: 84 },
            { author: 'Sal', rating: 5, text: 'One Winged Angel on repeat all day. 10/10 would buy again.', helpful: 203 }
        ],
        installerData: {
            id: 'snaketunes',
            name: 'SnakeTunes',
            description: 'Music player and store by SnakeBite Entertainment',
            icon: 'mdi-music',
            version: '1.0',
            author: 'SnakeBite Entertainment',
            gameData: { type: 'snaketunes' }
        }
    },
];

// ============================================
//  COMING SOON APPS — shown but not installable
// ============================================
window.ELXASTORE_COMING_SOON = [
    {
        id: 'coming_elxanotes',
        name: 'ElxaNotes Pro',
        shortDesc: 'Rich note-taking with folders, tags, and search.',
        icon: 'mdi-notebook-edit',
        category: 'Productivity',
        author: 'ElxaCorp Software',
        heroColor: '#2e7d32'
    },
    {
        id: 'coming_elxacalendar',
        name: 'ElxaCalendar',
        shortDesc: 'Keep track of events, reminders, and appointments.',
        icon: 'mdi-calendar-month',
        category: 'Productivity',
        author: 'ElxaCorp Software',
        heroColor: '#1565c0'
    },
    {
        id: 'coming_pixelstudio',
        name: 'Pixel Studio',
        shortDesc: 'Advanced pixel art editor with layers and animation.',
        icon: 'mdi-palette',
        category: 'Creative',
        author: 'ElxaCorp Creative Labs',
        heroColor: '#6a1b9a'
    },
    {
        id: 'coming_snakechat',
        name: 'SnakeChat Desktop',
        shortDesc: 'Snakesia\'s favorite messaging app — now on desktop!',
        icon: 'mdi-chat',
        category: 'Social',
        author: 'Coil Communications',
        heroColor: '#00838f'
    },
    {
        id: 'coming_codetangle',
        name: 'CodeTangle',
        shortDesc: 'A beginner-friendly code editor for learning to program.',
        icon: 'mdi-code-braces',
        category: 'Education',
        author: 'ElxaCorp Software',
        heroColor: '#37474f'
    }
];
