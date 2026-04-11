// =================================
// DEFAULT FILES & FOLDERS - Created on first boot
// =================================
// To add a new default file/folder, just add an entry here.
// The loader in ElxaOS.initialize() handles the rest.

const ELXAOS_DEFAULT_FOLDERS = [
    { path: ['root', 'Documents'], name: 'Projects' },
    { path: ['root', 'Documents'], name: 'Code' },
    { path: ['root', 'System'],    name: 'Bank' },
    { path: ['root', 'Pictures'],  name: 'Screenshots' },
];

const ELXAOS_DEFAULT_FILES = [
    // --- Desktop files ---
    {
        path: ['root', 'Desktop'],
        name: 'Welcome.txt',
        content: 'Welcome to ElxaOS!\n\nThis is your new operating system.\n\nFeatures:\n- File Manager with navigation\n- Rich Text Notepad\n- System Services (Battery, WiFi)\n- And much more!'
    },

    // --- Documents ---
    {
        path: ['root', 'Documents'],
        name: 'ReadMe.txt',
        content: 'ElxaOS Features:\n- File System with folders and files\n- Multiple Programs\n- Window Management\n- System Tray Services\n- Login System\n- Theme Support'
    },
    {
        path: ['root', 'Documents'],
        name: 'Getting Started.html',
        content: '<h1>Getting Started with ElxaOS</h1><p>Welcome to your new operating system!</p><ul><li>Use <strong>My Computer</strong> to browse files</li><li>Try the <em>Notepad</em> for text editing</li><li>Click the battery icon to check power</li><li>Explore the Start Menu for more programs</li></ul>'
    },
    {
        path: ['root', 'Documents', 'Code'],
        name: 'My First Code.elxa',
        content: `// My First ElxaCode Program! 🚀
    // Double-click this file or open it with ElxaCode!

    print "Hello, World!"
    print "I'm learning to code!"

    // Try these special keywords:
    abby
    cat
    duck
    elxa

    // Let's do some math:
    add 10 + 5
    subtract 20 - 3

    // Variables are fun:
    var myname = "Super Coder"
    print "Hello, " + myname

    // Conditionals:
    if myname == "Super Coder"
        print "You are amazing!"
        cat
    else
        print "Keep coding!"
    end

    print "Great job coding!"
    duck`
    },

    // --- Desktop shortcuts ---
    {
        path: ['root', 'Desktop'],
        name: 'Snoogle Browser.lnk',
        content: JSON.stringify({
            type: 'program_shortcut',
            programId: 'browser',
            programInfo: { name: 'Snoogle Browser', icon: ElxaIcons.render('browser', 'desktop'), description: 'Browse the web with Snoogle Browser' }
        })
    },
    {
        path: ['root', 'Desktop'],
        name: 'Snakesia Messenger.lnk',
        content: JSON.stringify({
            type: 'program_shortcut',
            programId: 'messenger',
            programInfo: { name: 'Snakesia Messenger', icon: ElxaIcons.render('messenger', 'desktop'), description: 'Chat with your friends in Snakesia!' }
        })
    },
    {
        path: ['root', 'Desktop'],
        name: 'ElxaBooks Pro.lnk',
        content: JSON.stringify({
            type: 'program_shortcut',
            programId: 'elxabooks',
            programInfo: { name: 'ElxaBooks Pro', icon: ElxaIcons.render('elxabooks', 'desktop'), description: 'Financial dashboard and accounting for ElxaCorp' }
        })
    },
    {
        path: ['root', 'Desktop'],
        name: 'ElxaBooks Pro.lnk',
        content: JSON.stringify({
            type: 'program_shortcut',
            programId: 'elxabooks',
            programInfo: { name: 'ElxaBooks Pro', icon: ElxaIcons.render('elxabooks', 'desktop'), description: 'Financial dashboard and accounting for ElxaCorp' }
        })
    },
    {
        path: ['root', 'Desktop'],
        name: 'ElxaGuard Antivirus.lnk',
        content: JSON.stringify({
            type: 'program_shortcut',
            programId: 'antivirus',
            programInfo: { name: 'ElxaGuard Antivirus', icon: ElxaIcons.render('antivirus', 'desktop'), description: 'Protect your system with ElxaGuard Antivirus' }
        })
    },

    // --- Browser shortcuts with URL args ---
    {
        path: ['root', 'Desktop'],
        name: 'E-Mail.lnk',
        content: JSON.stringify({
            type: 'program_shortcut',
            programId: 'elxamail',
            launchArgs: 'elxamail.ex',
            programInfo: { name: 'E-Mail', icon: '<span class="mdi mdi-email elxa-icon-desktop" style="color: #42A5F5"></span>', description: 'Open ElxaMail in Snoogle Browser' }
        })
    },
    {
        path: ['root', 'Desktop'],
        name: 'ElxaCorp Employee Portal.lnk',
        content: JSON.stringify({
            type: 'program_shortcut',
            programId: 'employee-portal',
            launchArgs: 'snake-e.corp.ex/portal',
            programInfo: { name: 'ElxaCorp Employee Portal', icon: '<span class="mdi mdi-briefcase elxa-icon-desktop" style="color: #FFA726"></span>', description: 'Access your ElxaCorp employee dashboard' }
        })
    },

    {
        path: ['root', 'Desktop'],
        name: 'Sssteam.lnk',
        content: JSON.stringify({
            type: 'program_shortcut',
            programId: 'sssteam',
            launchArgs: 'sssteam.ex',
            programInfo: { name: 'Sssteam', icon: '<span class="mdi mdi-controller elxa-icon-desktop" style="color: #67c1f5"></span>', description: 'Browse and install games from the Sssteam store' }
        })
    },
    {
        path: ['root', 'Desktop'],
        name: 'Card Exchange.lnk',
        content: JSON.stringify({
            type: 'program_shortcut',
            programId: 'snakesian-cards',
            launchArgs: 'snakesian-cards.ex',
            programInfo: { name: 'Card Exchange', icon: '<span class="mdi mdi-cards-outline elxa-icon-desktop" style="color: #d4a535"></span>', description: 'Collect trading cards from the Snakesian Card Exchange' }
        })
    },

    // --- Program installers (.abby) ---
    {
        path: ['root', 'Programs'],
        name: 'Target Game.abby',
        content: JSON.stringify({
            id: 'target_game',
            name: 'Target Game',
            description: 'A fun clicking game where you try to hit as many targets as possible!',
            icon: ElxaIcons.renderAction('install'),
            version: '1.0',
            author: 'ElxaOS Games',
            gameData: { type: 'target_game', difficulty: 'normal' }
        })
    },
    {
        path: ['root', 'Programs'],
        name: 'Snake Game.abby',
        content: JSON.stringify({
            id: 'snake_game',
            name: 'Classic Snake',
            description: 'The classic Snake game! Control the snake, eat food, grow longer, and try not to crash into walls or yourself. Features smooth gameplay, increasing speed, and score tracking.',
            icon: ElxaIcons.renderAction('install'),
            version: '2.0',
            author: 'ElxaOS Games Studio',
            gameData: { type: 'snake_game', speed: 150, boardSize: 20, difficulty: 'normal' }
        })
    },
];
