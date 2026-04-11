// =================================
// THEME SERVICE
// =================================
class ThemeService {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.currentTheme = 'classic';
        this.currentWallpaper = 'default';
        this.wallpaperFit = 'fill';  // fill, fit, stretch, center, tile
        
        this.themes = {
            classic: {
                name: 'Classic',
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #c0c0c0, #808080)',
                    taskbarBorder: '#ffffff',
                    windowBg: '#c0c0c0',
                    windowBorder: '#c0c0c0',
                    titlebarBg: 'linear-gradient(to right, #0000ff, #4080ff)',
                    titlebarInactive: 'linear-gradient(to right, #808080, #a0a0a0)',
                    buttonBg: 'linear-gradient(to bottom, #dfdfdf, #c0c0c0)',
                    buttonHoverBg: 'linear-gradient(to bottom, #e8e8e8, #d0d0d0)',
                    buttonActiveBg: 'linear-gradient(to bottom, #c0c0c0, #dfdfdf)',
                    desktopBg: 'linear-gradient(45deg, #008080, #20B2AA)',
                    menuBg: '#c0c0c0',
                    menuHoverBg: '#316AC5',
                    menuText: '#333333',
                    menuHoverText: 'white',
                    systemTrayBg: '#c0c0c0',
                    clockBg: '#c0c0c0',
                    clockText: '#333333',
                    iconText: 'white',
                    iconTextShadow: 'rgba(0,0,0,0.8)',
                    uiIconColor: '#555555'
                }
            },
            luna: {
                name: 'Luna Blue',
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #316AC5, #1F4788)',
                    taskbarBorder: '#ffffff',
                    windowBg: '#ece9d8',
                    windowBorder: '#316AC5',
                    titlebarBg: 'linear-gradient(to right, #316AC5, #4A8BC2)',
                    titlebarInactive: 'linear-gradient(to right, #7A96DF, #B4C7E7)',
                    buttonBg: 'linear-gradient(to bottom, #ece9d8, #d4d0c8)',
                    buttonHoverBg: 'linear-gradient(to bottom, #f5f2e9, #e4e1d8)',
                    buttonActiveBg: 'linear-gradient(to bottom, #d4d0c8, #ece9d8)',
                    desktopBg: 'linear-gradient(45deg, #5A8BB0, #3D6B99)',
                    menuBg: '#ece9d8',
                    menuHoverBg: '#316AC5',
                    menuText: '#333333',
                    menuHoverText: 'white',
                    systemTrayBg: '#ece9d8',
                    clockBg: '#ece9d8',
                    clockText: '#333333',
                    iconText: 'white',
                    iconTextShadow: 'rgba(0,0,0,0.8)',
                    uiIconColor: '#3D5A80'
                }
            },
            lunaRed: {
                name: 'Luna Red',
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #9B3519, #9C4F3A)',
                    taskbarBorder: '#ffffff',
                    windowBg: '#ece9d8',
                    windowBorder: '#BD4B4B',
                    titlebarBg: 'linear-gradient(to right, #943331, #C2644A)',
                    titlebarInactive: 'linear-gradient(to right, #B06B69, #D7A192)',
                    buttonBg: 'linear-gradient(to bottom, #ece9d8, #d4d0c8)',
                    buttonHoverBg: 'linear-gradient(to bottom, #f5f2e9, #e4e1d8)',
                    buttonActiveBg: 'linear-gradient(to bottom, #d4d0c8, #ece9d8)',
                    desktopBg: 'linear-gradient(45deg, #902204, #79463C)',
                    menuBg: '#ece9d8',
                    menuHoverBg: '#943331',
                    menuText: '#333333',
                    menuHoverText: 'white',
                    systemTrayBg: '#ece9d8',
                    clockBg: '#ece9d8',
                    clockText: '#333333',
                    iconText: 'white',
                    iconTextShadow: 'rgba(81 78 78 / 0.8)',
                    uiIconColor: '#7A3030'
                }
            },
            lunaPink: {
                name: 'Luna Pink',
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #9B1953, #B04C7C)',
                    taskbarBorder: '#ffffff',
                    windowBg: '#ece9d8',
                    windowBorder: '#BD4B84',
                    titlebarBg: 'linear-gradient(to right, #94316E, #C24A98)',
                    titlebarInactive: 'linear-gradient(to right, #B06996, #D792BA)',
                    buttonBg: 'linear-gradient(to bottom, #ece9d8, #d4d0c8)',
                    buttonHoverBg: 'linear-gradient(to bottom, #f5f2e9, #e4e1d8)',
                    buttonActiveBg: 'linear-gradient(to bottom, #d4d0c8, #ece9d8)',
                    desktopBg: 'linear-gradient(45deg, #90043E, #793C5A)',
                    menuBg: '#ece9d8',
                    menuHoverBg: '#943166',
                    menuText: '#333333',
                    menuHoverText: 'white',
                    systemTrayBg: '#ece9d8',
                    clockBg: '#ece9d8',
                    clockText: '#333333',
                    iconText: 'white',
                    iconTextShadow: 'rgba(81 78 78 / 0.8)',
                    uiIconColor: '#7A3060'
                }
            },
            // NEW CUTESY LIGHT PINK THEME! 🌸
            bubblegum: {
                name: 'Bubblegum',
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #FFB6D9, #FF91C7)',
                    taskbarBorder: '#ffffff',
                    windowBg: '#FFF0F8',
                    windowBorder: '#FFB6D9',
                    titlebarBg: 'linear-gradient(to right, #FF91C7, #FFADD6)',
                    titlebarInactive: 'linear-gradient(to right, #F5C2E7, #FADDEE)',
                    buttonBg: 'linear-gradient(to bottom, #FFF0F8, #FFE0F0)',
                    buttonHoverBg: 'linear-gradient(to bottom, #FFF8FC, #FFF0F8)',
                    buttonActiveBg: 'linear-gradient(to bottom, #FFE0F0, #FFF0F8)',
                    desktopBg: 'linear-gradient(45deg, #FF69B4, #FFB6D9)',
                    menuBg: '#FFF0F8',
                    menuHoverBg: '#FF91C7',
                    menuText: '#8B008B',
                    menuHoverText: 'white',
                    systemTrayBg: '#FFF0F8',
                    clockBg: '#FFF0F8',
                    clockText: '#8B008B',
                    iconText: 'white',
                    iconTextShadow: 'rgba(139,0,139,0.8)',
                    uiIconColor: '#C2185B'
                }
            },
            // SOFT PASTEL THEME
            pastels: {
                name: 'Soft Pastels',
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #E6E6FA, #D8BFD8)',
                    taskbarBorder: '#ffffff',
                    windowBg: '#F8F8FF',
                    windowBorder: '#E6E6FA',
                    titlebarBg: 'linear-gradient(to right, #DDA0DD, #E6E6FA)',
                    titlebarInactive: 'linear-gradient(to right, #F0E6FF, #F8F8FF)',
                    buttonBg: 'linear-gradient(to bottom, #F8F8FF, #F0F0F8)',
                    buttonHoverBg: 'linear-gradient(to bottom, #FEFEFE, #F8F8FF)',
                    buttonActiveBg: 'linear-gradient(to bottom, #F0F0F8, #F8F8FF)',
                    desktopBg: 'linear-gradient(45deg, #E6E6FA, #FFE4E1)',
                    menuBg: '#F8F8FF',
                    menuHoverBg: '#DDA0DD',
                    menuText: '#483D8B',
                    menuHoverText: 'white',
                    systemTrayBg: '#F8F8FF',
                    clockBg: '#F8F8FF',
                    clockText: '#483D8B',
                    iconText: 'white',
                    iconTextShadow: 'rgba(72,61,139,0.8)',
                    uiIconColor: '#5C4B9E'
                }
            },
            // MINT GREEN THEME
            mint: {
                name: 'Fresh Mint',
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #98FB98, #90EE90)',
                    taskbarBorder: '#ffffff',
                    windowBg: '#F0FFF0',
                    windowBorder: '#98FB98',
                    titlebarBg: 'linear-gradient(to right, #90EE90, #98FB98)',
                    titlebarInactive: 'linear-gradient(to right, #C1FFC1, #E0FFE0)',
                    buttonBg: 'linear-gradient(to bottom, #F0FFF0, #E8FFE8)',
                    buttonHoverBg: 'linear-gradient(to bottom, #F8FFF8, #F0FFF0)',
                    buttonActiveBg: 'linear-gradient(to bottom, #E8FFE8, #F0FFF0)',
                    desktopBg: 'linear-gradient(45deg, #00FA9A, #98FB98)',
                    menuBg: '#F0FFF0',
                    menuHoverBg: '#90EE90',
                    menuText: '#006400',
                    menuHoverText: 'white',
                    systemTrayBg: '#F0FFF0',
                    clockBg: '#F0FFF0',
                    clockText: '#006400',
                    iconText: 'white',
                    iconTextShadow: 'rgba(0,100,0,0.8)',
                    uiIconColor: '#2E7D32'
                }
            },
            // WARM PEACH THEME
            peach: {
                name: 'Warm Peach',
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #FFDAB9, #FFB07A)',
                    taskbarBorder: '#ffffff',
                    windowBg: '#FFF8F0',
                    windowBorder: '#FFDAB9',
                    titlebarBg: 'linear-gradient(to right, #FFB07A, #FFDAB9)',
                    titlebarInactive: 'linear-gradient(to right, #FFE4D1, #FFF0E6)',
                    buttonBg: 'linear-gradient(to bottom, #FFF8F0, #FFF0E8)',
                    buttonHoverBg: 'linear-gradient(to bottom, #FFFCF8, #FFF8F0)',
                    buttonActiveBg: 'linear-gradient(to bottom, #FFF0E8, #FFF8F0)',
                    desktopBg: 'linear-gradient(45deg, #FF7F50, #FFDAB9)',
                    menuBg: '#FFF8F0',
                    menuHoverBg: '#FFB07A',
                    menuText: '#8B4513',
                    menuHoverText: 'white',
                    systemTrayBg: '#FFF8F0',
                    clockBg: '#FFF8F0',
                    clockText: '#8B4513',
                    iconText: 'white',
                    iconTextShadow: 'rgba(139,69,19,0.8)',
                    uiIconColor: '#A1603A'
                }
            },
            // SYNTHWAVE/RETRO THEME
            synthwave: {
                name: 'Synthwave',
                dark: true,
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #FF00FF, #8A2BE2)',
                    taskbarBorder: '#00FFFF',
                    windowBg: '#1a0033',
                    windowBorder: '#FF00FF',
                    titlebarBg: 'linear-gradient(to right, #FF00FF, #00FFFF)',
                    titlebarInactive: 'linear-gradient(to right, #4B0082, #663399)',
                    buttonBg: 'linear-gradient(to bottom, #330066, #1a0033)',
                    buttonHoverBg: 'linear-gradient(to bottom, #4d0099, #330066)',
                    buttonActiveBg: 'linear-gradient(to bottom, #1a0033, #330066)',
                    desktopBg: 'linear-gradient(45deg, #000033, #330066)',
                    menuBg: '#1a0033',
                    menuHoverBg: '#FF00FF',
                    menuText: '#00FFFF',
                    menuHoverText: 'white',
                    systemTrayBg: '#1a0033',
                    clockBg: '#1a0033',
                    clockText: '#00FFFF',
                    iconText: '#00FFFF',
                    iconTextShadow: 'rgba(255,0,255,0.8)',
                    uiIconColor: '#00FFFF'
                }
            },
            // LAVENDER THEME
            lavender: {
                name: 'Lavender Dreams',
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #9370DB, #8968CD)',
                    taskbarBorder: '#ffffff',
                    windowBg: '#F8F0FF',
                    windowBorder: '#9370DB',
                    titlebarBg: 'linear-gradient(to right, #8968CD, #9370DB)',
                    titlebarInactive: 'linear-gradient(to right, #C8A8E9, #E6D8F5)',
                    buttonBg: 'linear-gradient(to bottom, #F8F0FF, #F0E8FF)',
                    buttonHoverBg: 'linear-gradient(to bottom, #FCFAFF, #F8F0FF)',
                    buttonActiveBg: 'linear-gradient(to bottom, #F0E8FF, #F8F0FF)',
                    desktopBg: 'linear-gradient(45deg, #663399, #9370DB)',
                    menuBg: '#F8F0FF',
                    menuHoverBg: '#8968CD',
                    menuText: '#4B0082',
                    menuHoverText: 'white',
                    systemTrayBg: '#F8F0FF',
                    clockBg: '#F8F0FF',
                    clockText: '#4B0082',
                    iconText: 'white',
                    iconTextShadow: 'rgba(75,0,130,0.8)',
                    uiIconColor: '#6A4CB5'
                }
            },
            // OCEAN BREEZE THEME
            oceanBreeze: {
                name: 'Ocean Breeze',
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #40E0D0, #00CED1)',
                    taskbarBorder: '#ffffff',
                    windowBg: '#F0FFFF',
                    windowBorder: '#40E0D0',
                    titlebarBg: 'linear-gradient(to right, #00CED1, #40E0D0)',
                    titlebarInactive: 'linear-gradient(to right, #AFEEEE, #E0FFFF)',
                    buttonBg: 'linear-gradient(to bottom, #F0FFFF, #E8FFFE)',
                    buttonHoverBg: 'linear-gradient(to bottom, #F8FFFF, #F0FFFF)',
                    buttonActiveBg: 'linear-gradient(to bottom, #E8FFFE, #F0FFFF)',
                    desktopBg: 'linear-gradient(45deg, #008B8B, #40E0D0)',
                    menuBg: '#F0FFFF',
                    menuHoverBg: '#00CED1',
                    menuText: '#008B8B',
                    menuHoverText: 'white',
                    systemTrayBg: '#F0FFFF',
                    clockBg: '#F0FFFF',
                    clockText: '#008B8B',
                    iconText: 'white',
                    iconTextShadow: 'rgba(0,139,139,0.8)',
                    uiIconColor: '#00838F'
                }
            },
            olive: {
                name: 'Luna Olive',
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #627441, #4A5D2A)',
                    taskbarBorder: '#ffffff',
                    windowBg: '#f1efe2',
                    windowBorder: '#627441',
                    titlebarBg: 'linear-gradient(to right, #627441, #7A8F4F)',
                    titlebarInactive: 'linear-gradient(to right, #9AAB7C, #C4D0AA)',
                    buttonBg: 'linear-gradient(to bottom, #f1efe2, #e5e2d0)',
                    buttonHoverBg: 'linear-gradient(to bottom, #f8f6e9, #f1efe2)',
                    buttonActiveBg: 'linear-gradient(to bottom, #e5e2d0, #f1efe2)',
                    desktopBg: 'linear-gradient(45deg, #6B7B47, #52633B)',
                    menuBg: '#f1efe2',
                    menuHoverBg: '#627441',
                    menuText: '#333333',
                    menuHoverText: 'white',
                    systemTrayBg: '#f1efe2',
                    clockBg: '#f1efe2',
                    clockText: '#333333',
                    iconText: 'white',
                    iconTextShadow: 'rgba(0,0,0,0.8)',
                    uiIconColor: '#4A5D2A'
                }
            },
            silver: {
                name: 'Luna Silver',
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #94A6C7, #5D6B99)',
                    taskbarBorder: '#ffffff',
                    windowBg: '#f0f0f0',
                    windowBorder: '#94A6C7',
                    titlebarBg: 'linear-gradient(to right, #94A6C7, #B4C7E7)',
                    titlebarInactive: 'linear-gradient(to right, #C0C7D8, #E0E4EC)',
                    buttonBg: 'linear-gradient(to bottom, #f0f0f0, #e0e0e0)',
                    buttonHoverBg: 'linear-gradient(to bottom, #f8f8f8, #e8e8e8)',
                    buttonActiveBg: 'linear-gradient(to bottom, #e0e0e0, #f0f0f0)',
                    desktopBg: 'linear-gradient(45deg, #8A9BB8, #6B7A94)',
                    menuBg: '#f0f0f0',
                    menuHoverBg: '#94A6C7',
                    menuText: '#333333',
                    menuHoverText: 'white',
                    systemTrayBg: '#f0f0f0',
                    clockBg: '#f0f0f0',
                    clockText: '#333333',
                    iconText: 'white',
                    iconTextShadow: 'rgba(0,0,0,0.8)',
                    uiIconColor: '#5D6B99'
                }
            },
            royale: {
                name: 'Royale',
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #2E5C8A, #1F4F7A)',
                    taskbarBorder: '#ffffff',
                    windowBg: '#f7f7f7',
                    windowBorder: '#2E5C8A',
                    titlebarBg: 'linear-gradient(to right, #2E5C8A, #4A7BA7)',
                    titlebarInactive: 'linear-gradient(to right, #7A96DF, #B4C7E7)',
                    buttonBg: 'linear-gradient(to bottom, #f7f7f7, #e7e7e7)',
                    buttonHoverBg: 'linear-gradient(to bottom, #ffffff, #f0f0f0)',
                    buttonActiveBg: 'linear-gradient(to bottom, #e7e7e7, #f7f7f7)',
                    desktopBg: 'linear-gradient(45deg, #1F4F7A, #2E5C8A)',
                    menuBg: '#f7f7f7',
                    menuHoverBg: '#2E5C8A',
                    menuText: '#333333',
                    menuHoverText: 'white',
                    systemTrayBg: '#f7f7f7',
                    clockBg: '#f7f7f7',
                    clockText: '#333333',
                    iconText: 'white',
                    iconTextShadow: 'rgba(0,0,0,0.8)',
                    uiIconColor: '#2E5C8A'
                }
            },
            zune: {
                name: 'Zune',
                dark: true,
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #1a1a1a, #000000)',
                    taskbarBorder: '#333333',
                    windowBg: '#2d2d2d',
                    windowBorder: '#1a1a1a',
                    titlebarBg: 'linear-gradient(to right, #ff6600, #ff8533)',
                    titlebarInactive: 'linear-gradient(to right, #4d4d4d, #666666)',
                    buttonBg: 'linear-gradient(to bottom, #404040, #2d2d2d)',
                    buttonHoverBg: 'linear-gradient(to bottom, #505050, #404040)',
                    buttonActiveBg: 'linear-gradient(to bottom, #2d2d2d, #404040)',
                    desktopBg: 'linear-gradient(45deg, #0d0d0d, #1a1a1a)',
                    menuBg: '#2d2d2d',
                    menuHoverBg: '#ff6600',
                    menuText: '#ffffff',
                    menuHoverText: 'white',
                    systemTrayBg: '#2d2d2d',
                    clockBg: '#2d2d2d',
                    clockText: '#ffffff',
                    iconText: '#ffffff',
                    iconTextShadow: 'rgba(0,0,0,0.8)',
                    uiIconColor: '#FF6600'
                }
            },
            slate: {
                name: 'Slate',
                dark: true,
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #35354a, #252538)',
                    taskbarBorder: '#45455a',
                    windowBg: '#2d2d3d',
                    windowBorder: '#45455a',
                    titlebarBg: 'linear-gradient(to right, #585868, #6a6a7a)',
                    titlebarInactive: 'linear-gradient(to right, #404050, #4a4a5a)',
                    buttonBg: 'linear-gradient(to bottom, #3a3a4e, #2d2d3d)',
                    buttonHoverBg: 'linear-gradient(to bottom, #45455a, #3a3a4e)',
                    buttonActiveBg: 'linear-gradient(to bottom, #2d2d3d, #3a3a4e)',
                    desktopBg: 'linear-gradient(135deg, #1e1e2e, #2a2a3a)',
                    menuBg: '#2d2d3d',
                    menuHoverBg: '#585868',
                    menuText: '#c0c0cc',
                    menuHoverText: '#ffffff',
                    systemTrayBg: '#2d2d3d',
                    clockBg: '#2d2d3d',
                    clockText: '#a0a0b0',
                    iconText: '#e0e0e8',
                    iconTextShadow: 'rgba(0,0,0,0.8)',
                    uiIconColor: '#a0a0b0'
                }
            },
            frost: {
                name: 'Frost',
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #e8eaee, #d8dade)',
                    taskbarBorder: '#ffffff',
                    windowBg: '#f4f5f7',
                    windowBorder: '#c8cad0',
                    titlebarBg: 'linear-gradient(to right, #8a8e96, #a0a4ac)',
                    titlebarInactive: 'linear-gradient(to right, #b8bcc4, #d0d2d8)',
                    buttonBg: 'linear-gradient(to bottom, #f4f5f7, #e8eaee)',
                    buttonHoverBg: 'linear-gradient(to bottom, #fafbfc, #f0f1f3)',
                    buttonActiveBg: 'linear-gradient(to bottom, #e8eaee, #f4f5f7)',
                    desktopBg: 'linear-gradient(135deg, #e0e2e6, #cdd0d5)',
                    menuBg: '#f4f5f7',
                    menuHoverBg: '#8a8e96',
                    menuText: '#4a4d55',
                    menuHoverText: '#ffffff',
                    systemTrayBg: '#f4f5f7',
                    clockBg: '#f4f5f7',
                    clockText: '#5a5d65',
                    iconText: 'white',
                    iconTextShadow: 'rgba(0,0,0,0.6)',
                    uiIconColor: '#6a6d75'
                }
            },
            rose: {
                name: 'Rosé',
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #d8b8b8, #c0a0a0)',
                    taskbarBorder: '#ffffff',
                    windowBg: '#faf5f3',
                    windowBorder: '#d4b0b0',
                    titlebarBg: 'linear-gradient(to right, #a67070, #c08888)',
                    titlebarInactive: 'linear-gradient(to right, #c8a8a8, #dcc4c4)',
                    buttonBg: 'linear-gradient(to bottom, #faf5f3, #f0e8e5)',
                    buttonHoverBg: 'linear-gradient(to bottom, #fdfaf9, #f5f0ee)',
                    buttonActiveBg: 'linear-gradient(to bottom, #f0e8e5, #faf5f3)',
                    desktopBg: 'linear-gradient(135deg, #c9a0a0, #d4b0b0)',
                    menuBg: '#faf5f3',
                    menuHoverBg: '#a67070',
                    menuText: '#5a3535',
                    menuHoverText: '#ffffff',
                    systemTrayBg: '#faf5f3',
                    clockBg: '#faf5f3',
                    clockText: '#5a3535',
                    iconText: 'white',
                    iconTextShadow: 'rgba(90,53,53,0.8)',
                    uiIconColor: '#8a5555'
                }
            },
            matcha: {
                name: 'Matcha',
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #98a882, #7a8a68)',
                    taskbarBorder: '#ffffff',
                    windowBg: '#f8f6f0',
                    windowBorder: '#a0b08a',
                    titlebarBg: 'linear-gradient(to right, #6b7a58, #8a9a72)',
                    titlebarInactive: 'linear-gradient(to right, #a0aa90, #c0c8b4)',
                    buttonBg: 'linear-gradient(to bottom, #f8f6f0, #eeece4)',
                    buttonHoverBg: 'linear-gradient(to bottom, #fcfaf6, #f4f2ec)',
                    buttonActiveBg: 'linear-gradient(to bottom, #eeece4, #f8f6f0)',
                    desktopBg: 'linear-gradient(135deg, #8a9a78, #a0b08a)',
                    menuBg: '#f8f6f0',
                    menuHoverBg: '#6b7a58',
                    menuText: '#2a3520',
                    menuHoverText: '#ffffff',
                    systemTrayBg: '#f8f6f0',
                    clockBg: '#f8f6f0',
                    clockText: '#2a3520',
                    iconText: 'white',
                    iconTextShadow: 'rgba(42,53,32,0.8)',
                    uiIconColor: '#4a5a3a'
                }
            },
            mocha: {
                name: 'Mocha',
                dark: true,
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #2a221c, #1a1410)',
                    taskbarBorder: '#3a3028',
                    windowBg: '#2c241e',
                    windowBorder: '#3e342a',
                    titlebarBg: 'linear-gradient(to right, #7a5c40, #967050)',
                    titlebarInactive: 'linear-gradient(to right, #4a3c30, #5a4a3a)',
                    buttonBg: 'linear-gradient(to bottom, #3a3028, #2c241e)',
                    buttonHoverBg: 'linear-gradient(to bottom, #4a3e32, #3a3028)',
                    buttonActiveBg: 'linear-gradient(to bottom, #2c241e, #3a3028)',
                    desktopBg: 'linear-gradient(135deg, #1e1814, #2a221c)',
                    menuBg: '#2c241e',
                    menuHoverBg: '#7a5c40',
                    menuText: '#c0a888',
                    menuHoverText: '#ffffff',
                    systemTrayBg: '#2c241e',
                    clockBg: '#2c241e',
                    clockText: '#a08868',
                    iconText: '#f0e8dd',
                    iconTextShadow: 'rgba(0,0,0,0.8)',
                    uiIconColor: '#b09070'
                }
            },
            dusk: {
                name: 'Dusk',
                dark: true,
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #241c2a, #181220)',
                    taskbarBorder: '#342840',
                    windowBg: '#261e2c',
                    windowBorder: '#3a2e44',
                    titlebarBg: 'linear-gradient(to right, #6a4878, #806090)',
                    titlebarInactive: 'linear-gradient(to right, #3e2e48, #4e3a58)',
                    buttonBg: 'linear-gradient(to bottom, #342840, #261e2c)',
                    buttonHoverBg: 'linear-gradient(to bottom, #40304e, #342840)',
                    buttonActiveBg: 'linear-gradient(to bottom, #261e2c, #342840)',
                    desktopBg: 'linear-gradient(135deg, #1e1620, #2a2030)',
                    menuBg: '#261e2c',
                    menuHoverBg: '#6a4878',
                    menuText: '#b898c8',
                    menuHoverText: '#ffffff',
                    systemTrayBg: '#261e2c',
                    clockBg: '#261e2c',
                    clockText: '#9878a8',
                    iconText: '#ece0f0',
                    iconTextShadow: 'rgba(0,0,0,0.8)',
                    uiIconColor: '#a080b8'
                }
            },
            studio: {
                name: 'Studio',
                dark: true,
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #252540, #1a1a30)',
                    taskbarBorder: '#0f9b8e',
                    windowBg: '#1e1e30',
                    windowBorder: '#2a2a45',
                    titlebarBg: 'linear-gradient(to right, #0f9b8e, #20b2aa)',
                    titlebarInactive: 'linear-gradient(to right, #4a5568, #5a6578)',
                    buttonBg: 'linear-gradient(to bottom, #2a2a45, #1e1e30)',
                    buttonHoverBg: 'linear-gradient(to bottom, #353555, #2a2a45)',
                    buttonActiveBg: 'linear-gradient(to bottom, #1e1e30, #2a2a45)',
                    desktopBg: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                    menuBg: '#1e1e30',
                    menuHoverBg: '#0f9b8e',
                    menuText: '#a0aec0',
                    menuHoverText: '#ffffff',
                    systemTrayBg: '#1e1e30',
                    clockBg: '#1e1e30',
                    clockText: '#0f9b8e',
                    iconText: '#c0d0e0',
                    iconTextShadow: 'rgba(0,0,0,0.8)',
                    uiIconColor: '#0f9b8e'
                }
            },
            coastal: {
                name: 'Coastal',
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #c8b898, #b8a888)',
                    taskbarBorder: '#ffffff',
                    windowBg: '#faf8f4',
                    windowBorder: '#c8b898',
                    titlebarBg: 'linear-gradient(to right, #3d7a6a, #5a9a88)',
                    titlebarInactive: 'linear-gradient(to right, #8aaa98, #b0c8b8)',
                    buttonBg: 'linear-gradient(to bottom, #faf8f4, #f0ece4)',
                    buttonHoverBg: 'linear-gradient(to bottom, #fcfaf6, #faf8f4)',
                    buttonActiveBg: 'linear-gradient(to bottom, #f0ece4, #faf8f4)',
                    desktopBg: 'linear-gradient(135deg, #5b8a72, #7aaa90)',
                    menuBg: '#faf8f4',
                    menuHoverBg: '#3d7a6a',
                    menuText: '#3a3020',
                    menuHoverText: '#ffffff',
                    systemTrayBg: '#faf8f4',
                    clockBg: '#faf8f4',
                    clockText: '#3a3020',
                    iconText: 'white',
                    iconTextShadow: 'rgba(0,0,0,0.8)',
                    uiIconColor: '#3d7a6a'
                }
            },
            aurora: {
                name: 'Aurora',
                dark: true,
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #161b22, #0d1117)',
                    taskbarBorder: '#30363d',
                    windowBg: '#161b22',
                    windowBorder: '#30363d',
                    titlebarBg: 'linear-gradient(to right, #4EA83E, #4C66C2)',
                    titlebarInactive: 'linear-gradient(to right, #30363d, #3a424a)',
                    buttonBg: 'linear-gradient(to bottom, #21262d, #161b22)',
                    buttonHoverBg: 'linear-gradient(to bottom, #30363d, #21262d)',
                    buttonActiveBg: 'linear-gradient(to bottom, #161b22, #21262d)',
                    desktopBg: 'linear-gradient(135deg, #0d1117, #161b22)',
                    menuBg: '#161b22',
                    menuHoverBg: '#4EA83E',
                    menuText: '#8b949e',
                    menuHoverText: '#ffffff',
                    systemTrayBg: '#161b22',
                    clockBg: '#161b22',
                    clockText: '#4EA83E',
                    iconText: '#c9d1d9',
                    iconTextShadow: 'rgba(0,0,0,0.8)',
                    uiIconColor: '#4EA83E'
                }
            },
            noire: {
                name: 'Noire',
                dark: true,
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #1a1a1a, #0a0a0a)',
                    taskbarBorder: '#2a2518',
                    windowBg: '#1a1a1a',
                    windowBorder: '#2a2a2a',
                    titlebarBg: 'linear-gradient(to right, #b08818, #d5a021)',
                    titlebarInactive: 'linear-gradient(to right, #2a2a2a, #3a3a3a)',
                    buttonBg: 'linear-gradient(to bottom, #2a2a2a, #1a1a1a)',
                    buttonHoverBg: 'linear-gradient(to bottom, #3a3a3a, #2a2a2a)',
                    buttonActiveBg: 'linear-gradient(to bottom, #1a1a1a, #2a2a2a)',
                    desktopBg: 'linear-gradient(135deg, #0a0a0a, #141414)',
                    menuBg: '#1a1a1a',
                    menuHoverBg: '#d5a021',
                    menuText: '#999999',
                    menuHoverText: '#1a1200',
                    systemTrayBg: '#1a1a1a',
                    clockBg: '#1a1a1a',
                    clockText: '#d5a021',
                    iconText: '#e0e0e0',
                    iconTextShadow: 'rgba(0,0,0,0.8)',
                    uiIconColor: '#d5a021'
                }
            },
            neonBloom: {
                name: 'Neon Bloom',
                dark: true,
                colors: {
                    taskbarBg: 'linear-gradient(to bottom, #222230, #18181f)',
                    taskbarBorder: '#35354a',
                    windowBg: '#1e1e28',
                    windowBorder: '#2c2c38',
                    titlebarBg: 'linear-gradient(to right, #d44a8a, #F564A9)',
                    titlebarInactive: 'linear-gradient(to right, #38384a, #44445a)',
                    buttonBg: 'linear-gradient(to bottom, #2c2c38, #1e1e28)',
                    buttonHoverBg: 'linear-gradient(to bottom, #38384a, #2c2c38)',
                    buttonActiveBg: 'linear-gradient(to bottom, #1e1e28, #2c2c38)',
                    desktopBg: 'linear-gradient(135deg, #18181f, #222230)',
                    menuBg: '#1e1e28',
                    menuHoverBg: '#F564A9',
                    menuText: '#a0a0b8',
                    menuHoverText: '#ffffff',
                    systemTrayBg: '#1e1e28',
                    clockBg: '#1e1e28',
                    clockText: '#F564A9',
                    iconText: '#e0e0f0',
                    iconTextShadow: 'rgba(0,0,0,0.8)',
                    uiIconColor: '#F564A9'
                }
            }
        };

        this.wallpapers = {
            default: {
                name: 'Default Gradient',
                type: 'gradient',
                value: 'linear-gradient(45deg, #008080, #20B2AA)'
            },
            bliss: {
                name: 'Bliss',
                type: 'gradient',
                value: 'linear-gradient(45deg, #87CEEB, #98FB98)'
            },
            autumn: {
                name: 'Autumn',
                type: 'gradient', 
                value: 'linear-gradient(45deg, #FF8C00, #FF6347)'
            },
            ocean: {
                name: 'Ocean',
                type: 'gradient',
                value: 'linear-gradient(45deg, #006994, #4682B4)'
            },
            sunset: {
                name: 'Sunset',
                type: 'gradient',
                value: 'linear-gradient(45deg, #FF69B4, #FFB6C1)'
            },
            matrix: {
                name: 'Matrix',
                type: 'gradient',
                value: 'linear-gradient(45deg, #000000, #003300)'
            },
            space: {
                name: 'Space',
                type: 'gradient',
                value: 'linear-gradient(45deg, #000428, #004e92)'
            },
            forest: {
                name: 'Forest',
                type: 'gradient',
                value: 'linear-gradient(45deg, #134E5E, #71B280)'
            },
            cottonCandy: {
                name: 'Cotton Candy',
                type: 'gradient',
                value: 'linear-gradient(135deg, #F9A8D4, #C4B5FD, #93C5FD)'
            },
            midnight: {
                name: 'Midnight',
                type: 'gradient',
                value: 'linear-gradient(135deg, #020617, #0F172A, #1E293B)'
            },
            spotlight: {
                name: 'Spotlight',
                type: 'gradient',
                value: 'radial-gradient(circle at 50% 30%, #475569, #1E293B, #020617)'
            },
            carbonFiber: {
                name: 'Carbon Fiber',
                type: 'pattern',
                value: 'linear-gradient(27deg, #151515 5px, transparent 5px) 0 5px, linear-gradient(207deg, #151515 5px, transparent 5px) 10px 0px, linear-gradient(27deg, #222 5px, transparent 5px) 0px 10px, linear-gradient(207deg, #222 5px, transparent 5px) 10px 5px, linear-gradient(90deg, #1b1b1b 10px, transparent 10px), linear-gradient(#1d1d1d 25%, #1a1a1a 25%, #1a1a1a 50%, transparent 50%, transparent 75%, #242424 75%, #242424)',
                size: '20px 20px'
            }
        };
        
        this.customWallpapers = {}; // Store imported images and Paint creations
        this.assetWallpapers = {}; // Store wallpapers from assets/backgrounds folder

        this.setupEvents();
        this.loadSavedSettings();
        this.loadAssetBackgrounds(); // 🎨 NEW: Load backgrounds from project assets folder
        this.applyTheme();
    }

    // 🎨 NEW METHOD: Load wallpapers from project assets/backgrounds folder
    loadAssetBackgrounds() {
        
        // 🎨 SIMPLE APPROACH: Just list your actual background images here
        // Add the relative path from js/services/ to your assets/backgrounds/
        const assetBackgrounds = {
            // Add your actual background files here like this:
            'ElxaOS': {
                 name: 'ElxaOS',
                 path: '../../assets/backgrounds/elxaos.png'
             },
            'ElxaOS Dark': {
                 name: 'ElxaOS Dark', 
                 path: '../../assets/backgrounds/elxaos_dark.png'
             },
             'Buggy Elephant': {
                 name: 'Buggy Elephant',
                 path: '../../assets/backgrounds/buggy.png'
             },
             'ElxaOS Pastel': {
                 name: 'ElxaOS Pastel',
                 path: '../../assets/backgrounds/elxaos_pastel.png'
             },
			 'ElxaOS Strawberry': {
                 name: 'ElxaOS Strawberry',
                 path: '../../assets/backgrounds/elxaos_strawberry.png'
             },
			 'ElxaOS Pink': {
                 name: 'ElxaOS Pink',
                 path: '../../assets/backgrounds/elxaos_palepink.png'
             },
			 'ElxaOS Witchy': {
                 name: 'ElxaOS Witchy',
                 path: '../../assets/backgrounds/elxaos_witchy.png'
             },
			 'ElxaOS Colorpop': {
                 name: 'ElxaOS Colorpop',
                 path: '../../assets/backgrounds/elxaos_colorful.png'
             },
			 'ElxaOS Moon': {
                 name: 'ElxaOS Moon',
                 path: '../../assets/backgrounds/elxaos_moon.png'
             },
			 'ElxaOS Sun': {
                 name: 'ElxaOS Sun',
                 path: '../../assets/backgrounds/elxaos_sun.png'
             }
        };
        
        // Convert to wallpaper format
        Object.keys(assetBackgrounds).forEach(key => {
            const bg = assetBackgrounds[key];
            this.assetWallpapers[`asset_${key}`] = {
                name: bg.name,
                type: 'image',
                value: bg.path, // Just use the path directly
                source: 'assets',
                originalPath: bg.path
            };
        });
        
        const loadedCount = Object.keys(assetBackgrounds).length;
    }

    setupEvents() {
        // Listen for theme dialog requests (could be triggered from start menu)
        this.eventBus.on('theme.open', () => {
            this.showThemeDialog();
        });

        // Listen for theme changes
        this.eventBus.on('theme.change', (data) => {
            this.setTheme(data.theme);
        });

        // Listen for wallpaper changes
        this.eventBus.on('wallpaper.change', (data) => {
            this.setWallpaper(data.wallpaper);
        });

        // Right-click desktop context menu (for easy access)
        this.setupDesktopContextMenu();

        // Listen for window creation to apply theme
        this.eventBus.on('window.created', () => {
            this.applyThemeToNewElements();
        });
    }

    setupDesktopContextMenu() {
        const desktop = document.getElementById('desktop');
        
        desktop.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e.clientX, e.clientY);
        });

        // Hide context menu on click elsewhere
        document.addEventListener('click', () => {
            this.hideContextMenu();
        });
    }

    showContextMenu(x, y) {
        this.hideContextMenu(); // Remove any existing menu

        const contextMenu = document.createElement('div');
        contextMenu.id = 'desktopContextMenu';
        contextMenu.className = 'context-menu';
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;

        contextMenu.innerHTML = `
            <div class="context-item" data-action="personalize">
                ${ElxaIcons.renderAction('personalize')} Personalize
            </div>
            <div class="context-separator"></div>
            <div class="context-item" data-action="refresh">
                ${ElxaIcons.renderAction('refresh')} Refresh Desktop
            </div>
        `;

        // Event delegation for context menu actions
        contextMenu.addEventListener('click', (e) => {
            const item = e.target.closest('.context-item');
            if (!item) return;
            const action = item.dataset.action;
            if (action === 'personalize') this.showThemeDialog();
            if (action === 'refresh') this.refreshDesktop();
            this.hideContextMenu();
        });

        document.body.appendChild(contextMenu);

        // Adjust position if menu goes off screen
        const rect = contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            contextMenu.style.left = `${x - rect.width}px`;
        }
        if (rect.bottom > window.innerHeight - 30) { // Account for taskbar
            contextMenu.style.top = `${y - rect.height}px`;
        }
    }

    hideContextMenu() {
        const contextMenu = document.getElementById('desktopContextMenu');
        if (contextMenu) {
            contextMenu.remove();
        }
    }

    showThemeDialog() {
        this.hideThemeDialog();

        var self = this;

        const themeOptions = Object.keys(this.themes).map(themeKey => {
            const theme = this.themes[themeKey];
            const isSelected = themeKey === this.currentTheme;
            return `
                <div class="theme-option ${isSelected ? 'selected' : ''}" data-theme="${themeKey}">
                    <div class="theme-preview" style="background: ${theme.colors.titlebarBg};">
                        <div class="theme-preview-window" style="background: ${theme.colors.windowBg}; border-color: ${theme.colors.windowBorder};">
                            <div class="theme-preview-titlebar" style="background: ${theme.colors.titlebarBg};"></div>
                        </div>
                    </div>
                    <div class="theme-name">${theme.name}</div>
                </div>
            `;
        }).join('');

        // 🎨 UPDATED: Combine built-in, custom, AND asset wallpapers
        const allWallpapers = { 
            ...this.wallpapers, 
            ...this.assetWallpapers,  // 🎨 NEW: Add asset wallpapers
            ...this.customWallpapers 
        };
        
        const wallpaperOptions = Object.keys(allWallpapers).map(wallpaperKey => {
            const wallpaper = allWallpapers[wallpaperKey];
            const isSelected = wallpaperKey === this.currentWallpaper;
            
            let previewStyle;
            if (wallpaper.type === 'image') {
                previewStyle = `background-image: url(${wallpaper.value}); background-size: cover; background-position: center;`;
            } else {
                previewStyle = `background: ${wallpaper.value};`;
            }
            
            // Determine badge text based on source
            let badgeText = '';
            if (wallpaper.source === 'assets') {
                badgeText = '<div class="asset-badge">Asset</div>';
            } else if (wallpaper.custom || wallpaper.source === 'imported' || wallpaper.source === 'paint') {
                badgeText = '<div class="custom-badge">Custom</div>';
            }
            
            return `
                <div class="wallpaper-option ${isSelected ? 'selected' : ''}" data-wallpaper="${wallpaperKey}">
                    <div class="wallpaper-preview" style="${previewStyle}"></div>
                    <div class="wallpaper-name">${wallpaper.name}</div>
                    ${badgeText}
                </div>
            `;
        }).join('');

        var contentHTML = `
            <div class="personalize-app">
                <div class="personalize-tabs">
                    <div class="personalize-tab active" data-tab="themes">${ElxaIcons.renderAction('personalize')} Color Schemes</div>
                    <div class="personalize-tab" data-tab="wallpapers">${ElxaIcons.renderAction('image')} Wallpapers</div>
                </div>
                
                <div class="personalize-content">
                    <div class="personalize-panel active" id="themesPanel">
                        <div class="personalize-theme-grid">
                            ${themeOptions}
                        </div>
                    </div>
                    
                    <div class="personalize-panel" id="wallpapersPanel">
                        <div class="personalize-wp-controls">
                            <button class="import-image-btn">${ElxaIcons.renderAction('folder-image')} Import Image</button>
                            <button class="browse-paint-btn">${ElxaIcons.renderAction('image')} Use Paint File</button>
                            <label style="margin-left:auto; display:flex; align-items:center; gap:4px; font-size:11px;">Fit:
                                <select class="wallpaper-fit-select" style="font-size:11px; padding:1px 2px;">
                                    <option value="fill"${this.wallpaperFit === 'fill' ? ' selected' : ''}>Fill</option>
                                    <option value="fit"${this.wallpaperFit === 'fit' ? ' selected' : ''}>Fit</option>
                                    <option value="stretch"${this.wallpaperFit === 'stretch' ? ' selected' : ''}>Stretch</option>
                                    <option value="center"${this.wallpaperFit === 'center' ? ' selected' : ''}>Center</option>
                                    <option value="tile"${this.wallpaperFit === 'tile' ? ' selected' : ''}>Tile</option>
                                </select>
                            </label>
                        </div>
                        <div class="personalize-wp-stats">
                            ${Object.keys(this.wallpapers).length} built-in, 
                            ${Object.keys(this.assetWallpapers).length} asset, 
                            ${Object.keys(this.customWallpapers).length} custom
                        </div>
                        <div class="personalize-wp-grid">
                            ${wallpaperOptions}
                        </div>
                    </div>
                </div>
                
                <div class="personalize-controls">
                    <button class="elxa-dialog-btn-primary apply-btn">${ElxaIcons.renderAction('check')} Apply</button>
                    <button class="elxa-dialog-btn reset-btn">${ElxaIcons.renderAction('restore')} Reset</button>
                </div>
            </div>
        `;

        this._personalizeWindowId = 'personalize-' + Date.now();
        var winW = 720, winH = 520;
        var centerX = Math.max(20, Math.round((window.innerWidth - winW) / 2));
        var centerY = Math.max(20, Math.round((window.innerHeight - 30 - winH) / 2));
        elxaOS.windowManager.createWindow(
            this._personalizeWindowId,
            ElxaIcons.render('personalize', 'ui') + ' Personalize ElxaOS',
            contentHTML,
            { width: winW + 'px', height: winH + 'px', x: centerX + 'px', y: centerY + 'px' }
        );

        this._onPersonalizeClose = function(data) {
            if (data.id === self._personalizeWindowId) {
                self._personalizeWindowId = null;
                self.eventBus.off('window.closed', self._onPersonalizeClose);
            }
        };
        this.eventBus.on('window.closed', this._onPersonalizeClose);

        this.setupThemeDialogEvents();
    }

    setupThemeDialogEvents() {
        const dialog = document.getElementById('window-' + this._personalizeWindowId);
        if (!dialog) return;
        
        // Use event delegation for all dialog events
        dialog.addEventListener('click', (e) => {
            // Tab switching
            const tab = e.target.closest('.personalize-tab');
            if (tab) {
                const tabName = tab.dataset.tab;
                dialog.querySelectorAll('.personalize-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                dialog.querySelectorAll('.personalize-panel').forEach(panel => panel.classList.remove('active'));
                dialog.querySelector(`#${tabName}Panel`).classList.add('active');
            }
            
            // Theme selection
            const themeOption = e.target.closest('.theme-option');
            if (themeOption) {
                dialog.querySelectorAll('.theme-option').forEach(o => o.classList.remove('selected'));
                themeOption.classList.add('selected');
                this.previewTheme(themeOption.dataset.theme);
            }
            
            // Wallpaper selection
            const wallpaperOption = e.target.closest('.wallpaper-option');
            if (wallpaperOption) {
                dialog.querySelectorAll('.wallpaper-option').forEach(o => o.classList.remove('selected'));
                wallpaperOption.classList.add('selected');
                this.previewWallpaper(wallpaperOption.dataset.wallpaper);
            }
            
            // Import image button
            if (e.target.closest('.import-image-btn')) {
                e.preventDefault();
                this.showImageImportDialog();
            }
            
            // Browse paint files button
            if (e.target.closest('.browse-paint-btn')) {
                e.preventDefault();
                this.showPaintFileBrowser();
            }

            // Refresh assets button
            if (e.target.closest('.refresh-assets-btn')) {
                e.preventDefault();
                this.refreshAssetBackgrounds();
                this.hideThemeDialog();
                setTimeout(() => this.showThemeDialog(), 100);
            }

            // Apply button
            if (e.target.closest('.apply-btn')) {
                // Grab fit selection before applying
                const fitSelect = dialog.querySelector('.wallpaper-fit-select');
                if (fitSelect) this.wallpaperFit = fitSelect.value;
                this.applySelectedTheme();
            }

            // Reset button
            if (e.target.closest('.reset-btn')) {
                this.resetToDefaults();
            }
        });
    }

    previewTheme(themeKey) {
        // Temporarily apply theme for preview
        this.applyThemeColors(this.themes[themeKey]);
    }

    previewWallpaper(wallpaperKey) {
        // Temporarily apply wallpaper for preview
        const allWallpapers = { 
            ...this.wallpapers, 
            ...this.assetWallpapers,  // 🎨 UPDATED: Include asset wallpapers
            ...this.customWallpapers 
        };
        this.applyWallpaper(allWallpapers[wallpaperKey]);
    }

    showImageImportDialog() {
        
        try {
            const dialog = document.createElement('div');
            dialog.className = 'import-dialog system-dialog';
            dialog.innerHTML = `
                <div class="dialog-content">
                    <div class="dialog-header">
                        <div class="dialog-title">${ElxaIcons.renderAction('folder-image')} Import Background Image</div>
                        <button class="dialog-close">${ElxaIcons.renderAction('close')}</button>
                    </div>
                    <div class="dialog-body">
                        <div class="import-instructions">
                            <p>Select an image file to use as your desktop background:</p>
                            <p class="file-types">Supported: JPG, PNG, GIF, WebP</p>
                        </div>
                        <input type="file" class="image-input" accept="image/*" multiple>
                        <div class="preview-area">
                            <div class="preview-grid"></div>
                        </div>
                        <div class="import-actions">
                            <button class="import-selected-btn" disabled>Import Selected</button>
                            <button class="cancel-btn">Cancel</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);

            // Setup event listeners for this dialog
            const closeBtn = dialog.querySelector('.dialog-close');
            const cancelBtn = dialog.querySelector('.cancel-btn');
            const fileInput = dialog.querySelector('.image-input');
            const previewGrid = dialog.querySelector('.preview-grid');
            const importBtn = dialog.querySelector('.import-selected-btn');
            
            let selectedImages = [];

            // Close dialog events
            closeBtn.addEventListener('click', () => {
                dialog.remove();
            });
            
            cancelBtn.addEventListener('click', () => {
                dialog.remove();
            });

            fileInput.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                previewGrid.innerHTML = '';
                selectedImages = [];

                files.forEach((file, index) => {
                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const previewItem = document.createElement('div');
                            previewItem.className = 'import-preview-item';
                            previewItem.innerHTML = `
                                <div class="import-preview-image" style="background-image: url(${e.target.result}); background-size: cover; background-position: center;"></div>
                                <div class="import-preview-info">
                                    <div class="image-name">${file.name}</div>
                                    <div class="image-size">${this.formatFileSize(file.size)}</div>
                                </div>
                                <input type="checkbox" class="import-checkbox" data-index="${index}" checked>
                            `;
                            previewGrid.appendChild(previewItem);
                            
                            selectedImages.push({
                                name: file.name,
                                data: e.target.result,
                                size: file.size
                            });
                        };
                        reader.readAsDataURL(file);
                    }
                });

                importBtn.disabled = false;
            });

            importBtn.addEventListener('click', () => {
                const checkboxes = dialog.querySelectorAll('.import-checkbox:checked');
                let importedCount = 0;

                checkboxes.forEach(checkbox => {
                    const index = parseInt(checkbox.dataset.index);
                    const image = selectedImages[index];
                    if (image) {
                        const wallpaperKey = `custom_${Date.now()}_${index}`;
                        this.customWallpapers[wallpaperKey] = {
                            name: image.name.split('.')[0],
                            type: 'image',
                            value: image.data,
                            custom: true,
                            source: 'imported'
                        };
                        importedCount++;
                    }
                });

                if (importedCount > 0) {
                    this.saveSettings(); // 🔥 Save the new custom wallpapers to localStorage
                    this.showMessage(`Imported ${importedCount} image(s) successfully!`, 'success');
                    this.hideThemeDialog();
                    this.showThemeDialog(); // Refresh dialog to show new wallpapers
                } else {
                    this.showMessage('No images selected for import', 'warning');
                }
                
                dialog.remove();
            });

            // Handle checkbox selection
            previewGrid.addEventListener('change', (e) => {
                if (e.target.classList.contains('import-checkbox')) {
                    const checkedBoxes = dialog.querySelectorAll('.import-checkbox:checked');
                    importBtn.disabled = checkedBoxes.length === 0;
                    importBtn.textContent = checkedBoxes.length > 0 ? 
                        `Import ${checkedBoxes.length} Selected` : 'Import Selected';
                }
            });
            
        } catch (error) {
            console.error('Error in showImageImportDialog:', error);
        }
    }

    showPaintFileBrowser() {        
        try {
            // Get all image files from the file system that could be Paint creations
            const allImageFiles = this.findImageFiles();
            
            if (allImageFiles.length === 0) {
                this.showMessage('No image files found in the file system', 'info');
                return;
            }

            const dialog = document.createElement('div');
            dialog.className = 'paint-browser-dialog system-dialog';
            dialog.innerHTML = `
                <div class="dialog-content">
                    <div class="dialog-header">
                        <div class="dialog-title">${ElxaIcons.renderAction('image')} Use Paint Creation as Background</div>
                        <button class="dialog-close">${ElxaIcons.renderAction('close')}</button>
                    </div>
                    <div class="dialog-body">
                        <div class="paint-instructions">
                            <p>Select a Paint creation or image file to use as your background:</p>
                        </div>
                        <div class="paint-files-grid">
                            ${allImageFiles.map((file, index) => `
                                <div class="paint-file-item" data-path="${file.path.join('|')}" data-name="${file.name}">
                                    <div class="paint-file-icon">${ElxaIcons.renderAction('image')}</div>
                                    <div class="paint-file-info">
                                        <div class="paint-file-name">${file.name}</div>
                                        <div class="paint-file-location">${file.location}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="paint-actions">
                            <button class="use-paint-btn" disabled>Use as Background</button>
                            <button class="cancel-btn">Cancel</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);

            const closeBtn = dialog.querySelector('.dialog-close');
            const cancelBtn = dialog.querySelector('.cancel-btn');
            const paintGrid = dialog.querySelector('.paint-files-grid');
            const useBtn = dialog.querySelector('.use-paint-btn');
            let selectedFile = null;

            // Close dialog events
            closeBtn.addEventListener('click', () => {
                dialog.remove();
            });
            
            cancelBtn.addEventListener('click', () => {
                dialog.remove();
            });

            paintGrid.addEventListener('click', (e) => {
                const fileItem = e.target.closest('.paint-file-item');
                if (fileItem) {
                    // Clear previous selection
                    dialog.querySelectorAll('.paint-file-item').forEach(item => 
                        item.classList.remove('selected'));
                    
                    // Select current item
                    fileItem.classList.add('selected');
                    selectedFile = {
                        path: fileItem.dataset.path.split('|'),
                        name: fileItem.dataset.name
                    };
                    useBtn.disabled = false;
                }
            });

            useBtn.addEventListener('click', () => {
                if (selectedFile) {
                    this.usePaintFileAsBackground(selectedFile);
                }
                dialog.remove();
            });
            
        } catch (error) {
            console.error('Error in showPaintFileBrowser:', error);
        }
    }

    findImageFiles() {
        const imageFiles = [];
        const fileSystem = elxaOS.fileSystem;
        
        // Search through common folders for image files
        const foldersToSearch = [
            ['root', 'Pictures'],
            ['root', 'Desktop'],
            ['root', 'Documents'],
            ['root', 'assets', 'backgrounds']  // 🎨 UPDATED: Also search in assets/backgrounds
        ];

        foldersToSearch.forEach(folderPath => {
            try {
                const contents = fileSystem.listContents(folderPath);
                contents.forEach(item => {
                    if (item.type === 'file' && this.isImageFile(item.name)) {
                        imageFiles.push({
                            name: item.name,
                            path: [...folderPath, item.name],
                            location: folderPath.slice(1).join(' > ')
                        });
                    }
                });
            } catch (e) {
                // Folder doesn't exist or can't be accessed
            }
        });

        return imageFiles;
    }

    isImageFile(filename) {
        const extension = filename.toLowerCase().split('.').pop();
        return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(extension);
    }

    usePaintFileAsBackground(file) {
        console.log('🎨 Loading Paint file as background:', file.name, 'from path:', file.path);
        
        const fileSystem = elxaOS.fileSystem;
        const actualFile = fileSystem.getFile(file.path.slice(0, -1), file.name);
        
        if (!actualFile || !actualFile.content) {
            this.showMessage(`Could not read file: ${file.name}`, 'error');
            console.error('File not found or has no content:', file);
            return;
        }
        
        if (actualFile.content.startsWith('data:image/')) {
            
            const wallpaperKey = `paint_${Date.now()}`;
            
            this.customWallpapers[wallpaperKey] = {
                name: file.name.split('.')[0],
                type: 'image',
                value: actualFile.content,
                custom: true,
                source: 'paint',
                originalPath: file.path
            };

            // Apply immediately and save settings
            this.setWallpaper(wallpaperKey); // This will auto-save
            this.showMessage(`Now using "${file.name}" as background!`, 'success');
            this.hideThemeDialog();
            this.showThemeDialog();
        } else {
            console.log('⚠️ File content is not a data URL, content preview:', actualFile.content.substring(0, 100));
            
            const wallpaperKey = `paint_${Date.now()}`;
            
            this.customWallpapers[wallpaperKey] = {
                name: file.name.split('.')[0],
                type: 'image',
                value: actualFile.content,
                custom: true,
                source: 'paint',
                originalPath: file.path
            };

            this.setWallpaper(wallpaperKey); // This will auto-save
            this.showMessage(`Attempting to use "${file.name}" as background...`, 'info');
            this.hideThemeDialog();
            this.showThemeDialog();
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    applySelectedTheme() {
        const selectedTheme = document.querySelector('.theme-option.selected');
        const selectedWallpaper = document.querySelector('.wallpaper-option.selected');
        
        if (selectedTheme) {
            this.setTheme(selectedTheme.dataset.theme);
        }
        
        if (selectedWallpaper) {
            this.setWallpaper(selectedWallpaper.dataset.wallpaper);
        }
        
        this.saveSettings();
        this.hideThemeDialog();
        this.showMessage('Theme applied successfully!', 'success');
    }

    setTheme(themeKey) {
        if (this.themes[themeKey]) {
            this.currentTheme = themeKey;
            this.applyTheme();
            this.saveSettings(); // Auto-save when theme changes
            this.eventBus.emit('theme.changed', { theme: themeKey });
        }
    }

    setWallpaper(wallpaperKey) {
        const allWallpapers = { 
            ...this.wallpapers, 
            ...this.assetWallpapers,  // 🎨 UPDATED: Include asset wallpapers
            ...this.customWallpapers 
        };
        if (allWallpapers[wallpaperKey]) {
            this.currentWallpaper = wallpaperKey;
            this.applyWallpaper(allWallpapers[wallpaperKey]);
            this.saveSettings(); // Auto-save when wallpaper changes
            this.eventBus.emit('wallpaper.changed', { wallpaper: wallpaperKey });
        }
    }

    applyTheme() {
        const theme = this.themes[this.currentTheme];
        const allWallpapers = { 
            ...this.wallpapers, 
            ...this.assetWallpapers,  // 🎨 UPDATED: Include asset wallpapers
            ...this.customWallpapers 
        };
        const wallpaper = allWallpapers[this.currentWallpaper];
        
        console.log('🎨 Applying theme:', this.currentTheme, 'with wallpaper:', this.currentWallpaper);
        
        this.applyThemeColors(theme);
        
        if (wallpaper) {
            this.applyWallpaper(wallpaper);
        } else {
            console.warn('⚠️ No wallpaper found for key:', this.currentWallpaper);
            // Apply default wallpaper
            this.applyWallpaper(this.wallpapers.default);
        }
    }

    applyThemeColors(theme) {
        const root = document.documentElement;
        
        // Apply CSS custom properties for theme colors
        Object.keys(theme.colors).forEach(colorKey => {
            root.style.setProperty(`--${colorKey}`, theme.colors[colorKey]);
        });

        // Special handling for dark themes - add body class
        if (theme && theme.dark) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }

        // Force refresh of dynamic elements — pass theme so preview uses correct colors
        this.applyThemeToNewElements(theme);
    }

    applyThemeToNewElements(themeOverride) {
        // This method handles elements that are created dynamically
        // and may not automatically pick up the CSS custom properties
        
        // Use passed theme (for preview) or fall back to current theme
        var theme = themeOverride || this.themes[this.currentTheme];
        if (!theme) return;

        // Update window titlebars that exist now
        document.querySelectorAll('.window-titlebar').forEach(titlebar => {
            const window = titlebar.closest('.window');
            if (window) {
                if (window.classList.contains('active')) {
                    titlebar.style.background = theme.colors.titlebarBg;
                } else {
                    titlebar.style.background = theme.colors.titlebarInactive;
                }
            }
        });
    }

    applyWallpaper(wallpaper) {
        
        const desktop = document.querySelector('.desktop');
        let wallpaperElement = document.querySelector('.desktop-wallpaper');
        
        // Create wallpaper element if it doesn't exist
        if (!wallpaperElement && desktop) {
            wallpaperElement = document.createElement('div');
            wallpaperElement.className = 'desktop-wallpaper';
            desktop.appendChild(wallpaperElement);
        }
        
        // Use wallpaper element if available, otherwise fall back to desktop
        const target = wallpaperElement || desktop;
        
        if (!target) {
            console.error('❌ No target element found for wallpaper application');
            return;
        }
        
        if (wallpaper.type === 'gradient') {
            
            // Clear any existing background image
            target.style.backgroundImage = '';
            
            // Apply the gradient
            target.style.background = wallpaper.value;
            
            // Reset other background properties
            target.style.backgroundSize = '';
            target.style.backgroundPosition = '';
            target.style.backgroundRepeat = '';
            
        } else if (wallpaper.type === 'pattern') {
            
            // Clear any existing background
            target.style.backgroundImage = '';
            
            // Apply the pattern background
            target.style.background = wallpaper.value;
            
            // Apply background-size for tiling patterns
            target.style.backgroundSize = wallpaper.size || '20px 20px';
            target.style.backgroundPosition = '';
            target.style.backgroundRepeat = '';
            
        } else if (wallpaper.type === 'image') {
            
            // Clear any existing background gradient
            target.style.background = '';
            
            // Apply the image
            target.style.backgroundImage = `url(${wallpaper.value})`;
            
            // Apply fit mode
            switch (this.wallpaperFit) {
                case 'fit':
                    target.style.backgroundSize = 'contain';
                    target.style.backgroundPosition = 'center';
                    target.style.backgroundRepeat = 'no-repeat';
                    break;
                case 'stretch':
                    target.style.backgroundSize = '100% 100%';
                    target.style.backgroundPosition = 'center';
                    target.style.backgroundRepeat = 'no-repeat';
                    break;
                case 'center':
                    target.style.backgroundSize = 'auto';
                    target.style.backgroundPosition = 'center';
                    target.style.backgroundRepeat = 'no-repeat';
                    break;
                case 'tile':
                    target.style.backgroundSize = 'auto';
                    target.style.backgroundPosition = 'top left';
                    target.style.backgroundRepeat = 'repeat';
                    break;
                case 'fill':
                default:
                    target.style.backgroundSize = 'cover';
                    target.style.backgroundPosition = 'center';
                    target.style.backgroundRepeat = 'no-repeat';
                    break;
            }
        }
        
        // Force repaint
        target.offsetHeight;
    }

    // NEW METHOD: Clear theme settings (for testing)
    clearThemeSettings() {
        localStorage.removeItem('elxaOS-theme-settings');
        console.log('🗑️ Theme settings cleared');
    }

    // UPDATED resetToDefaults method - now saves the reset
    resetToDefaults() {
        this.currentTheme = 'classic';
        this.currentWallpaper = 'default';
        this.wallpaperFit = 'fill';
        this.customWallpapers = {}; // Clear custom wallpapers too
        this.applyTheme();
        this.saveSettings(); // 🔥 Save the reset
        this.hideThemeDialog();
        this.showMessage('Reset to default theme', 'info');
    }

    refreshDesktop() {
        // Simple desktop refresh - could reload icons, etc.
        this.showMessage('Desktop refreshed', 'info');
        this.eventBus.emit('desktop.refresh');
    }

    hideThemeDialog() {
        if (this._personalizeWindowId) {
            elxaOS.windowManager.closeWindow(this._personalizeWindowId);
            this._personalizeWindowId = null;
        }
        // Fallback: remove old-style dialog if it exists
        const oldDialog = document.getElementById('themeDialog');
        if (oldDialog) oldDialog.remove();
    }

    saveSettings() {
        try {
            const settingsToSave = {
                theme: this.currentTheme,
                wallpaper: this.currentWallpaper,
                wallpaperFit: this.wallpaperFit,
                customWallpapers: this.customWallpapers // Save custom wallpapers too!
                // Note: We don't save assetWallpapers as they're loaded dynamically from the file system
            };
            
            localStorage.setItem('elxaOS-theme-settings', JSON.stringify(settingsToSave));
        } catch (error) {
            console.error('❌ Failed to save theme settings:', error);
        }
    }

    loadSavedSettings() {
        try {
            const saved = localStorage.getItem('elxaOS-theme-settings');
            if (saved) {
                const settings = JSON.parse(saved);
                
                // Load theme and wallpaper
                this.currentTheme = settings.theme || 'classic';
                this.currentWallpaper = settings.wallpaper || 'default';
                this.wallpaperFit = settings.wallpaperFit || 'fill';
                
                // Load custom wallpapers (imported images, Paint creations, etc.)
                if (settings.customWallpapers) {
                    this.customWallpapers = settings.customWallpapers;
                }
                
            } else {
                console.log('🎨 No saved theme settings found, using defaults');
            }
        } catch (error) {
            console.error('❌ Failed to load theme settings:', error);
            // Fallback to defaults if loading fails
            this.currentTheme = 'classic';
            this.currentWallpaper = 'default';
        }
    }

    showMessage(text, type = 'info') {
        ElxaUI.showMessage(text, type);
    }

    // API methods for other services
    getCurrentTheme() {
        return {
            name: this.themes[this.currentTheme].name,
            key: this.currentTheme,
            colors: this.themes[this.currentTheme].colors
        };
    }

    getCurrentWallpaper() {
        const allWallpapers = { 
            ...this.wallpapers, 
            ...this.assetWallpapers,  // 🎨 UPDATED: Include asset wallpapers
            ...this.customWallpapers 
        };
        const wallpaper = allWallpapers[this.currentWallpaper];
        return {
            name: wallpaper.name,
            key: this.currentWallpaper,
            value: wallpaper.value,
            type: wallpaper.type,
            custom: wallpaper.custom || false,
            source: wallpaper.source || 'builtin'  // 🎨 NEW: Include source info
        };
    }

    // 🎨 NEW: Get wallpaper counts by source
    getWallpaperStats() {
        return {
            builtin: Object.keys(this.wallpapers).length,
            assets: Object.keys(this.assetWallpapers).length,
            custom: Object.keys(this.customWallpapers).length,
            total: Object.keys(this.wallpapers).length + 
                   Object.keys(this.assetWallpapers).length + 
                   Object.keys(this.customWallpapers).length
        };
    }

    // Debug methods
    listThemes() {
        return Object.keys(this.themes);
    }

    listWallpapers() {
        const allWallpapers = { 
            ...this.wallpapers, 
            ...this.assetWallpapers,  // 🎨 UPDATED: Include asset wallpapers
            ...this.customWallpapers 
        };
        return Object.keys(allWallpapers);
    }

    // 🎨 NEW: List asset wallpapers specifically
    listAssetWallpapers() {
        return Object.keys(this.assetWallpapers);
    }
}