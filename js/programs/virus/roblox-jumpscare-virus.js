// =================================
// ROBLOX HORROR JUMPSCARE VIRUS
// Created by: Buggy (age 14)
// Updated: Now with authentic Roblox UI styling!
// =================================

class RobloxHorrorJumpscareVirus {
    constructor() {
        this.isActive = false;
        this.jumpscareInterval = null;
        this.oofInterval = null;
        this.deathScreenTimeout = null;
        
        // Jumpscare images
        this.jumpscareImages = [
            'jumpscare1.png',
            'jumpscare2.png', 
            'jumpscare3.png'
        ];
        
        // Roblox-style jumpscare scenarios
        this.jumpscareScenarios = [
            {
                type: 'chat_bubble',
                message: 'Behind you! 👻',
                username: 'SpookyPlayer666',
                useImage: true
            },
            {
                type: 'notification',
                title: 'Achievement Unlocked!',
                message: 'You found the ghost! 👻',
                icon: '🏆',
                useImage: true
            },
            {
                type: 'server_message',
                message: 'The lights went out in the server...',
                server: 'Horror Obby #1337'
            },
            {
                type: 'friend_request',
                username: 'DarkEntity',
                message: 'wants to be your friend... forever 💀',
                useImage: true
            },
            {
                type: 'game_invite',
                username: 'MysteriousPlayer',
                game: 'Escape the Haunted House',
                message: 'Join me if you dare... 😈',
                useImage: true
            },
            {
                type: 'trade_request',
                username: 'GhostTrader',
                offering: 'Cursed Sword',
                wanting: 'Your Soul',
                useImage: true
            },
            {
                type: 'image_popup',
                message: 'BOO! Did I scare you?',
                username: 'JumpscareBot',
                useImage: true
            }
        ];
        
        // Roblox death messages (kid-friendly but dramatic)
        this.deathMessages = [
            "You died!",
            "Wasted!",
            "Game Over!",
            "You have been eliminated!",
            "Better luck next time!",
            "Respawning in 5... 4... 3...",
            "You fell into the void!",
            "The monster got you!",
            "Try again, noob!"
        ];
    }

    activate() {
        if (this.isActive) return;
        
        console.log('👻 ROBLOX HORROR JUMPSCARE ACTIVATED BY BUGGY! 👻');
        this.isActive = true;
        
        // Start the horror experience
        this.startRandomJumpscares();
        this.startRandomOofSounds();
        this.scheduleRandomDeathScreen();
        
        // Show initial jumpscare after a short delay
        setTimeout(() => {
            this.showRandomJumpscare();
        }, 3000);
    }

    deactivate() {
        if (!this.isActive) return;
        
        console.log('Roblox Horror virus deactivated (thank goodness!)');
        this.isActive = false;
        
        // Clear all intervals and timeouts
        if (this.jumpscareInterval) {
            clearInterval(this.jumpscareInterval);
            this.jumpscareInterval = null;
        }
        
        if (this.oofInterval) {
            clearInterval(this.oofInterval);
            this.oofInterval = null;
        }
        
        if (this.deathScreenTimeout) {
            clearTimeout(this.deathScreenTimeout);
            this.deathScreenTimeout = null;
        }
        
        // Remove any remaining horror elements
        document.querySelectorAll('.roblox-jumpscare, .roblox-death-screen').forEach(el => el.remove());
    }

    startRandomJumpscares() {
        const scheduleNextJumpscare = () => {
            const delay = 10000 + Math.random() * 15000; // 10-25 seconds
            setTimeout(() => {
                if (this.isActive) {
                    this.showRandomJumpscare();
                    scheduleNextJumpscare();
                }
            }, delay);
        };
        
        scheduleNextJumpscare();
    }

    startRandomOofSounds() {
        const scheduleNextOof = () => {
            const delay = 15000 + Math.random() * 15000; // 15-30 seconds
            setTimeout(() => {
                if (this.isActive) {
                    this.playOofSound();
                    scheduleNextOof();
                }
            }, delay);
        };
        
        scheduleNextOof();
    }

    scheduleRandomDeathScreen() {
        const scheduleNext = () => {
            const delay = 30000 + Math.random() * 30000; // 30-60 seconds
            setTimeout(() => {
                if (this.isActive) {
                    this.showDeathScreen();
                    scheduleNext();
                }
            }, delay);
        };
        
        scheduleNext();
    }

    showRandomJumpscare() {
        const scenario = this.jumpscareScenarios[Math.floor(Math.random() * this.jumpscareScenarios.length)];
        
        // Add random jumpscare image if scenario uses images
        if (scenario.useImage) {
            scenario.jumpscareImage = this.jumpscareImages[Math.floor(Math.random() * this.jumpscareImages.length)];
        }
        
        let jumpscareHTML = '';
        
        switch (scenario.type) {
            case 'chat_bubble':
                jumpscareHTML = this.createChatBubble(scenario);
                break;
            case 'notification':
                jumpscareHTML = this.createNotification(scenario);
                break;
            case 'server_message':
                jumpscareHTML = this.createServerMessage(scenario);
                break;
            case 'friend_request':
                jumpscareHTML = this.createFriendRequest(scenario);
                break;
            case 'game_invite':
                jumpscareHTML = this.createGameInvite(scenario);
                break;
            case 'trade_request':
                jumpscareHTML = this.createTradeRequest(scenario);
                break;
            case 'image_popup':
                jumpscareHTML = this.createImagePopup(scenario);
                break;
        }
        
        const jumpscare = document.createElement('div');
        jumpscare.className = `roblox-jumpscare roblox-${scenario.type}`;
        jumpscare.innerHTML = jumpscareHTML;

        // Random position on screen (but keep it visible)
        const x = Math.random() * (window.innerWidth - 350);
        const y = Math.random() * (window.innerHeight - 200);
        jumpscare.style.position = 'fixed';
        jumpscare.style.left = Math.max(10, x) + 'px';
        jumpscare.style.top = Math.max(10, y) + 'px';
        jumpscare.style.zIndex = '2600';

        document.body.appendChild(jumpscare);

        // Add entrance animation
        jumpscare.classList.add('roblox-slide-in');

        // Add click handlers for interactive elements
        this.addJumpscareHandlers(jumpscare, scenario);

        // Auto-close after 8-12 seconds
        const autoCloseTime = 8000 + Math.random() * 4000;
        setTimeout(() => {
            if (jumpscare.parentNode) {
                jumpscare.classList.add('roblox-slide-out');
                setTimeout(() => jumpscare.remove(), 300);
            }
        }, autoCloseTime);

        // Play a spooky sound
        this.playScareSound();
    }

    createChatBubble(scenario) {
        const avatarContent = scenario.useImage ? 
            `<img src="assets/virus/${scenario.jumpscareImage}" alt="Scary Avatar" class="roblox-avatar-img" onerror="this.parentElement.innerHTML='💀'" />` : 
            '💀';
        
        return `
            <div class="roblox-chat-bubble">
                <div class="roblox-chat-header">
                    <div class="roblox-avatar">${avatarContent}</div>
                    <div class="roblox-username">${scenario.username}</div>
                    <div class="roblox-close">×</div>
                </div>
                <div class="roblox-chat-message">${scenario.message}</div>
                <div class="roblox-chat-actions">
                    <button class="roblox-btn roblox-btn-red report-btn">Report</button>
                    <button class="roblox-btn roblox-btn-gray ignore-btn">Ignore</button>
                </div>
            </div>
        `;
    }

    createNotification(scenario) {
        const notificationContent = scenario.useImage ? `
            <div class="roblox-notif-image">
                <img src="assets/virus/${scenario.jumpscareImage}" alt="Achievement Image" 
                     onerror="this.style.display='none'; this.parentElement.innerHTML='${scenario.icon}'" />
            </div>
            <div class="roblox-notif-content">
                <div class="roblox-notif-title">${scenario.title}</div>
                <div class="roblox-notif-message">${scenario.message}</div>
            </div>
        ` : `
            <div class="roblox-notif-icon">${scenario.icon}</div>
            <div class="roblox-notif-content">
                <div class="roblox-notif-title">${scenario.title}</div>
                <div class="roblox-notif-message">${scenario.message}</div>
            </div>
        `;
        
        return `
            <div class="roblox-notification">
                ${notificationContent}
                <div class="roblox-notif-close">×</div>
            </div>
        `;
    }

    createServerMessage(scenario) {
        return `
            <div class="roblox-server-msg">
                <div class="roblox-server-header">
                    <span class="roblox-server-icon">🏰</span>
                    <span class="roblox-server-name">${scenario.server}</span>
                    <span class="roblox-close">×</span>
                </div>
                <div class="roblox-server-content">
                    <div class="roblox-system-msg">
                        <span class="roblox-system-icon">⚠️</span>
                        ${scenario.message}
                    </div>
                </div>
            </div>
        `;
    }

    createFriendRequest(scenario) {
        const avatarContent = scenario.useImage ? 
            `<img src="assets/virus/${scenario.jumpscareImage}" alt="Friend Avatar" class="roblox-friend-avatar-img" onerror="this.parentElement.innerHTML='👻'" />` : 
            '👻';
        
        return `
            <div class="roblox-friend-request">
                <div class="roblox-friend-header">
                    <span class="roblox-friend-icon">👥</span>
                    Friend Request
                    <span class="roblox-close">×</span>
                </div>
                <div class="roblox-friend-content">
                    <div class="roblox-friend-avatar">${avatarContent}</div>
                    <div class="roblox-friend-info">
                        <div class="roblox-friend-username">${scenario.username}</div>
                        <div class="roblox-friend-message">${scenario.message}</div>
                    </div>
                </div>
                <div class="roblox-friend-actions">
                    <button class="roblox-btn roblox-btn-green accept-btn">Accept</button>
                    <button class="roblox-btn roblox-btn-red decline-btn">Decline</button>
                </div>
            </div>
        `;
    }

    createGameInvite(scenario) {
        const gameImageContent = scenario.useImage ? `
            <div class="roblox-game-thumbnail">
                <img src="assets/virus/${scenario.jumpscareImage}" alt="Game Thumbnail" 
                     onerror="this.parentElement.innerHTML='<div class=&quot;fallback-game-icon&quot;>🎮</div>'" />
            </div>
        ` : '';
        
        return `
            <div class="roblox-game-invite">
                <div class="roblox-invite-header">
                    <span class="roblox-game-icon">🎮</span>
                    Game Invite
                    <span class="roblox-close">×</span>
                </div>
                <div class="roblox-invite-content">
                    ${gameImageContent}
                    <div class="roblox-invite-user">${scenario.username}</div>
                    <div class="roblox-invite-text">invites you to play</div>
                    <div class="roblox-invite-game">${scenario.game}</div>
                    <div class="roblox-invite-message">"${scenario.message}"</div>
                </div>
                <div class="roblox-invite-actions">
                    <button class="roblox-btn roblox-btn-green join-btn">Join Game</button>
                    <button class="roblox-btn roblox-btn-gray ignore-btn">Ignore</button>
                </div>
            </div>
        `;
    }

    createTradeRequest(scenario) {
        const traderAvatarContent = scenario.useImage ? 
            `<img src="assets/virus/${scenario.jumpscareImage}" alt="Trader Avatar" class="roblox-trader-avatar-img" onerror="this.parentElement.innerHTML='💀'" />` : 
            '💀';
        
        return `
            <div class="roblox-trade-request">
                <div class="roblox-trade-header">
                    <span class="roblox-trade-icon">🔄</span>
                    Trade Request
                    <span class="roblox-close">×</span>
                </div>
                <div class="roblox-trade-content">
                    <div class="roblox-trader">
                        <div class="roblox-trader-avatar">${traderAvatarContent}</div>
                        <div class="roblox-trader-name">${scenario.username}</div>
                    </div>
                    <div class="roblox-trade-details">
                        <div class="roblox-trade-offering">
                            <div class="roblox-trade-label">Offering:</div>
                            <div class="roblox-trade-item">${scenario.offering}</div>
                        </div>
                        <div class="roblox-trade-arrow">⬌</div>
                        <div class="roblox-trade-wanting">
                            <div class="roblox-trade-label">Wants:</div>
                            <div class="roblox-trade-item">${scenario.wanting}</div>
                        </div>
                    </div>
                </div>
                <div class="roblox-trade-actions">
                    <button class="roblox-btn roblox-btn-green accept-trade-btn">Accept Trade</button>
                    <button class="roblox-btn roblox-btn-red decline-trade-btn">Decline</button>
                </div>
            </div>
        `;
    }

    createImagePopup(scenario) {
        return `
            <div class="roblox-image-popup">
                <div class="roblox-popup-header">
                    <span class="roblox-popup-icon">📸</span>
                    Screenshot from ${scenario.username}
                    <span class="roblox-close">×</span>
                </div>
                <div class="roblox-popup-content">
                    <div class="roblox-popup-image">
                        <img src="assets/virus/${scenario.jumpscareImage}" alt="Jumpscare Image" 
                             onerror="this.parentElement.innerHTML='<div class=&quot;fallback-scary&quot;>👻<br>BOO!</div>'" />
                    </div>
                    <div class="roblox-popup-message">${scenario.message}</div>
                    <div class="roblox-popup-user">- ${scenario.username}</div>
                </div>
                <div class="roblox-popup-actions">
                    <button class="roblox-btn roblox-btn-red scared-btn">😱 That's scary!</button>
                    <button class="roblox-btn roblox-btn-gray not-scared-btn">😤 Not scared!</button>
                </div>
            </div>
        `;
    }

    addJumpscareHandlers(jumpscare, scenario) {
        // Close button handler
        const closeBtn = jumpscare.querySelector('.roblox-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                jumpscare.classList.add('roblox-slide-out');
                setTimeout(() => jumpscare.remove(), 300);
            });
        }

        // Scenario-specific handlers
        const reportBtn = jumpscare.querySelector('.report-btn');
        if (reportBtn) {
            reportBtn.addEventListener('click', () => {
                jumpscare.remove();
                // 30% chance for another jumpscare when they report
                if (Math.random() < 0.3) {
                    setTimeout(() => this.showRandomJumpscare(), 2000);
                }
            });
        }

        const ignoreBtn = jumpscare.querySelector('.ignore-btn');
        if (ignoreBtn) {
            ignoreBtn.addEventListener('click', () => {
                jumpscare.remove();
            });
        }

        const acceptBtn = jumpscare.querySelector('.accept-btn');
        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => {
                jumpscare.remove();
                // Always trigger another jumpscare if they accept scary friend requests
                setTimeout(() => this.showRandomJumpscare(), 1500);
            });
        }

        const joinBtn = jumpscare.querySelector('.join-btn');
        if (joinBtn) {
            joinBtn.addEventListener('click', () => {
                jumpscare.remove();
                // 60% chance for death screen if they join scary games
                if (Math.random() < 0.6) {
                    setTimeout(() => this.showDeathScreen(), 2000);
                }
            });
        }

        const acceptTradeBtn = jumpscare.querySelector('.accept-trade-btn');
        if (acceptTradeBtn) {
            acceptTradeBtn.addEventListener('click', () => {
                jumpscare.remove();
                // Definitely trigger death screen for soul trades!
                setTimeout(() => this.showDeathScreen(), 1000);
            });
        }

        // Generic decline buttons
        jumpscare.querySelectorAll('.decline-btn, .decline-trade-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                jumpscare.remove();
            });
        });

        // Image popup specific handlers
        const scaredBtn = jumpscare.querySelector('.scared-btn');
        if (scaredBtn) {
            scaredBtn.addEventListener('click', () => {
                jumpscare.remove();
                // 50% chance for another jumpscare if they admit being scared
                if (Math.random() < 0.5) {
                    setTimeout(() => this.showRandomJumpscare(), 2000);
                }
            });
        }

        const notScaredBtn = jumpscare.querySelector('.not-scared-btn');
        if (notScaredBtn) {
            notScaredBtn.addEventListener('click', () => {
                jumpscare.remove();
                // Definitely show another jumpscare if they're "not scared"
                setTimeout(() => this.showRandomJumpscare(), 1000);
            });
        }
    }

    showDeathScreen() {
        // Remove any existing death screen
        const existing = document.querySelector('.roblox-death-screen');
        if (existing) existing.remove();

        const randomMessage = this.deathMessages[Math.floor(Math.random() * this.deathMessages.length)];
        
        const deathScreen = document.createElement('div');
        deathScreen.className = 'roblox-death-screen';
        deathScreen.innerHTML = `
            <div class="death-overlay">
                <div class="death-content">
                    <div class="death-image">
                        <img src="assets/virus/youdied.png" alt="You Died" 
                             onerror="this.parentElement.innerHTML='<div class=&quot;fallback-death&quot;>💀<br>YOU DIED<br>💀</div>'" />
                    </div>
                    <div class="death-message">${randomMessage}</div>
                    <div class="death-stats">
                        <div>💀 Deaths: ${Math.floor(Math.random() * 50) + 1}</div>
                        <div>⏱️ Survival Time: ${Math.floor(Math.random() * 300) + 30} seconds</div>
                        <div>👻 Scared Level: ${Math.floor(Math.random() * 10) + 1}/10</div>
                    </div>
                    <div class="respawn-buttons">
                        <button class="respawn-btn">🔄 Respawn</button>
                        <button class="quit-btn">❌ Rage Quit</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(deathScreen);

        // Event handlers
        deathScreen.querySelector('.respawn-btn').addEventListener('click', () => {
            deathScreen.remove();
        });

        deathScreen.querySelector('.quit-btn').addEventListener('click', () => {
            deathScreen.remove();
            // Show a "quitter" message
            setTimeout(() => {
                if (this.isActive) {
                    this.showRandomJumpscare();
                }
            }, 2000);
        });

        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (deathScreen.parentNode) {
                deathScreen.remove();
            }
        }, 8000);

        // Play the iconic Roblox "OOF" sound
        this.playOofSound();
    }

    playOofSound() {
        try {
            const audio = new Audio('assets/sounds/oof.mp3');
            audio.volume = 0.3;
            audio.play().catch(e => {
                console.log('OOF! (Audio failed to play)');
            });
        } catch (e) {
            console.log('OOF! (No audio available)');
        }
    }

    playScareSound() {
        try {
            const audio = new Audio('assets/sounds/scare.mp3');
            audio.volume = 0.2;
            audio.play().catch(e => {
                console.log('👻 (Scare sound failed)');
            });
        } catch (e) {
            console.log('👻 (No scare sound available)');
        }
    }

    getDetectionSignatures() {
        return [
            'roblox-jumpscare',
            'roblox-death-screen',
            'RobloxHorrorJumpscareVirus',
            'roblox-chat-bubble',
            'roblox-notification',
            'Buggy\'s horror collection'
        ];
    }

    getVirusDefinition() {
        return {
            id: 'roblox-horror-jumpscare',
            name: 'Roblox Horror Jumpscare',
            description: 'Displays scary Roblox-themed game UI jumpscares',
            author: 'Buggy (age 14)',
            severity: 'medium',
            category: 'Horror Prank Virus',
            effects: [
                'Fake Roblox friend requests from spooky users',
                'Scary game invites and notifications',
                'Horror-themed chat messages',
                'Creepy trade requests',
                'Authentic Roblox UI styling',
                'Kid-friendly but startling content'
            ],
            created: new Date().toISOString()
        };
    }
}

// Make available globally for browser use
window.RobloxHorrorJumpscareVirus = RobloxHorrorJumpscareVirus;

// Also export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RobloxHorrorJumpscareVirus;
}