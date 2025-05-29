// =================================
// LEBRON JAMES WORD SCRAMBLER VIRUS
// Created by: Colten (age 10)
// =================================

class LebronJamesWordScramblerVirus {
    constructor() {
        this.isActive = false;
        this.scramblerInterval = null;
        this.popupInterval = null;
        this.textNodes = [];
        
        // Lebron James substitutions and scrambles
        this.lebronSubstitutions = [
            { from: /\bhello\b/gi, to: 'Lebron James hello' },
            { from: /\bhi\b/gi, to: 'Lebron James hi' },
            { from: /\bgood\b/gi, to: 'Lebron James good' },
            { from: /\bgreat\b/gi, to: 'Lebron James great' },
            { from: /\bawesome\b/gi, to: 'Lebron James awesome' },
            { from: /\bcool\b/gi, to: 'Lebron James cool' },
            { from: /\bfun\b/gi, to: 'Lebron James fun' },
            { from: /\bgame\b/gi, to: 'Lebron James game' },
            { from: /\bplay\b/gi, to: 'Lebron James play' },
            { from: /\bcomputer\b/gi, to: 'Lebron James computer' },
            { from: /\bfast\b/gi, to: 'Lebron James fast' },
            { from: /\bslow\b/gi, to: 'Lebron James slow' }
        ];
        
        // Random word scrambles (Colten-style)
        this.wordScrambles = [
            { from: /\byou\b/gi, to: 'sus' },
            { from: /\band\b/gi, to: 'sus and' },
            { from: /\bthe\b/gi, to: 'among the us' },
            { from: /\bwhy\b/gi, to: 'why sus' },
            { from: /\bwhat\b/gi, to: 'what sus' },
            { from: /\bhow\b/gi, to: 'how sus' }
        ];
        
        // Random Lebron James phrases
        this.lebronPhrases = [
            "LEBRON JAMES",
            "THE KING LEBRON JAMES",
            "LEBRON JAMES IS HERE",
            "LEBRON JAMES SAYS HI",
            "LEBRON JAMES APPROVED",
            "LEBRON JAMES MOMENT",
            "LEBRON JAMES ENTERED THE CHAT"
        ];
        
        // Random popup messages
        this.popupMessages = [
            "🏀 LEBRON JAMES HAS ENTERED YOUR COMPUTER! 🏀",
            "Breaking News: LEBRON JAMES is now your computer's owner!",
            "Your computer has been LEBRON JAMESIFIED!",
            "LEBRON JAMES wants to know your location... to play basketball!",
            "System Alert: Too much LEBRON JAMES detected!",
            "Warning: Your computer is now 23% LEBRON JAMES!",
            "LEBRON JAMES says: 'Just keep swimming... wait wrong movie'"
        ];
    }

    activate() {
        if (this.isActive) return;
        
        console.log('🏀 LEBRON JAMES WORD SCRAMBLER ACTIVATED! 🏀');
        this.isActive = true;
        
        // Start the text scrambling madness
        this.startTextScrambling();
        
        // Start random Lebron James popups
        this.startLebronPopups();
        
        // Inject some immediate chaos
        this.scrambleExistingText();
        
        // Show initial popup
        this.showLebronPopup();
    }

    deactivate() {
        if (!this.isActive) return;
        
        console.log('Lebron James virus deactivated (probably by The King himself)');
        this.isActive = false;
        
        if (this.scramblerInterval) {
            clearInterval(this.scramblerInterval);
            this.scramblerInterval = null;
        }
        
        if (this.popupInterval) {
            clearInterval(this.popupInterval);
            this.popupInterval = null;
        }
        
        // Remove any remaining Lebron popups
        document.querySelectorAll('.lebron-popup').forEach(popup => popup.remove());
    }

    startTextScrambling() {
        // Scramble text every 3-8 seconds (random intervals like Colten's attention span)
        const scheduleNextScramble = () => {
            const delay = 3000 + Math.random() * 5000; // 3-8 seconds
            setTimeout(() => {
                if (this.isActive) {
                    this.scrambleRandomText();
                    scheduleNextScramble();
                }
            }, delay);
        };
        
        scheduleNextScramble();
        
        // Also intercept typing in real-time
        this.interceptTyping();
    }

    startLebronPopups() {
        // Random Lebron James popups every 15-30 seconds
        const scheduleNextPopup = () => {
            const delay = 15000 + Math.random() * 15000; // 15-30 seconds
            setTimeout(() => {
                if (this.isActive) {
                    this.showLebronPopup();
                    scheduleNextPopup();
                }
            }, delay);
        };
        
        scheduleNextPopup();
    }

    scrambleExistingText() {
        // Find and scramble existing text on the page
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Skip script and style elements
                    const parent = node.parentElement;
                    if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.trim()) {
                textNodes.push(node);
            }
        }

        // Scramble a random selection of text nodes
        const nodesToScramble = textNodes.slice(0, Math.min(10, textNodes.length));
        nodesToScramble.forEach(textNode => {
            textNode.textContent = this.scrambleText(textNode.textContent);
        });
    }

    scrambleRandomText() {
        // Find new text nodes that have appeared
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    const parent = node.parentElement;
                    if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.trim()) {
                textNodes.push(node);
            }
        }

        // Pick 1-3 random text nodes to scramble
        const numToScramble = Math.min(3, Math.max(1, textNodes.length));
        for (let i = 0; i < numToScramble; i++) {
            const randomIndex = Math.floor(Math.random() * textNodes.length);
            const textNode = textNodes[randomIndex];
            if (textNode && !textNode.textContent.includes('LEBRON JAMES')) {
                textNode.textContent = this.scrambleText(textNode.textContent);
            }
        }
    }

    scrambleText(text) {
        let scrambled = text;
        
        // 50% chance for Lebron James substitution
        if (Math.random() < 0.5) {
            this.lebronSubstitutions.forEach(sub => {
                scrambled = scrambled.replace(sub.from, sub.to);
            });
        }
        
        // 30% chance for word scrambles
        if (Math.random() < 0.3) {
            this.wordScrambles.forEach(scramble => {
                scrambled = scrambled.replace(scramble.from, scramble.to);
            });
        }
        
        // 20% chance to just randomly inject LEBRON JAMES
        if (Math.random() < 0.2) {
            const words = scrambled.split(' ');
            const insertIndex = Math.floor(Math.random() * words.length);
            words.splice(insertIndex, 0, 'LEBRON JAMES');
            scrambled = words.join(' ');
        }
        
        return scrambled;
    }

    interceptTyping() {
        // Override typing in input fields and textareas
        document.addEventListener('input', (e) => {
            if (!this.isActive) return;
            
            const target = e.target;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                // 30% chance to scramble what they just typed
                if (Math.random() < 0.3) {
                    setTimeout(() => {
                        const originalValue = target.value;
                        const scrambledValue = this.scrambleText(originalValue);
                        if (scrambledValue !== originalValue) {
                            target.value = scrambledValue;
                            // Trigger change event
                            target.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    }, 500); // Small delay so they see their original text first
                }
            }
        });
    }

    showLebronPopup() {
        const popup = document.createElement('div');
        popup.className = 'lebron-popup system-dialog';
        popup.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <div class="dialog-title">🏀 LEBRON JAMES ALERT 🏀</div>
                    <div class="dialog-close">×</div>
                </div>
                <div class="dialog-body">
                    <div class="lebron-content">
                        <div class="lebron-icon">
                            <img src="assets/virus/${this.getRandomLebronImage()}" alt="LEBRON JAMES" onerror="this.parentElement.innerHTML='👑🏀'">
                        </div>
                        <div class="lebron-message">
                            ${this.popupMessages[Math.floor(Math.random() * this.popupMessages.length)]}
                        </div>
                        <div class="lebron-stats">
                            <div>Career Points: 38,000+</div>
                            <div>Championships: 4</div>
                            <div>Times in your computer: ${Math.floor(Math.random() * 100) + 1}</div>
                        </div>
                    </div>
                    <div class="lebron-actions">
                        <button class="ok-lebron-btn">OK, LEBRON JAMES</button>
                        <button class="no-lebron-btn">Please no more Lebron James</button>
                    </div>
                </div>
            </div>
        `;

        // Position randomly on screen
        const x = Math.random() * (window.innerWidth - 350);
        const y = Math.random() * (window.innerHeight - 250);
        popup.style.position = 'fixed';
        popup.style.left = x + 'px';
        popup.style.top = y + 'px';
        popup.style.zIndex = '2500';

        document.body.appendChild(popup);

        // Event handlers
        popup.querySelector('.dialog-close').addEventListener('click', () => {
            popup.remove();
        });

        popup.querySelector('.ok-lebron-btn').addEventListener('click', () => {
            popup.remove();
            // 50% chance to spawn another popup immediately (because Colten would)
            if (Math.random() < 0.5) {
                setTimeout(() => this.showLebronPopup(), 2000);
            }
        });

        popup.querySelector('.no-lebron-btn').addEventListener('click', () => {
            popup.remove();
            // Definitely spawn another popup (Colten doesn't listen!)
            setTimeout(() => {
                this.showLebronPopup();
            }, 3000);
        });

        // Auto-close after 45 seconds
        setTimeout(() => {
            if (popup.parentNode) {
                popup.remove();
            }
        }, 45000);
    }

    getRandomLebronImage() {
        const images = ['lebron-face.jpg', 'lebron-dunking.gif', 'basketball.png', 'lakers-logo.png'];
        return images[Math.floor(Math.random() * images.length)];
    }

    getDetectionSignatures() {
        return [
            'LEBRON JAMES',
            'lebron-popup',
            'LebronJamesWordScramblerVirus',
            'scrambleText',
            'THE KING LEBRON JAMES'
        ];
    }

    getVirusDefinition() {
        return {
            id: 'lebron-james-scrambler',
            name: 'Lebron James Word Scrambler Supreme',
            description: 'Randomly injects "LEBRON JAMES" into text and scrambles words with sus energy',
            author: 'Colten (age 10)',
            severity: 'medium',
            category: 'Annoying Meme Virus',
            effects: [
                'Replaces random words with "LEBRON JAMES"',
                'Scrambles text with "sus" and "among us" references',
                'Shows random basketball-themed popups',
                'Intercepts typing to add chaos',
                'General 10-year-old meme energy'
            ],
            created: new Date().toISOString()
        };
    }
}

// Export for use in the virus system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LebronJamesWordScramblerVirus;
}