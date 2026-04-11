/* ============================================
   SNAKESIAN CARD EXCHANGE — Arena Opponent Data
   ============================================
   AI opponents, decks, ante pools, and dialogues.
   Loaded BEFORE card-battle.js.
   ============================================ */

var ARENA_OPPONENTS = [

  // ==========================================
  // REMI — Easy
  // ==========================================
  {
    id: "remi",
    name: "Remi",
    portrait: "remi.png",
    description: "Trash-talks like a streamer. Plays fast and loose.",
    difficulty: "easy",
    deck: ["remi_002", "remi_004", "pushing_cat_002", "landmark_sussy_lair"],
    antePool: ["remi_001", "duk_005", "pushing_cat_001", "duk_002"],
    reward: 8.00,
    dialogues: {
      intro: "Chat, we're live. Let's speed-run this kid.",
      turnStart: [
        "Let's gooo!",
        "Easy clap.",
        "No way you survive this.",
        "Chat says I should go all in.",
        "This is content, baby."
      ],
      useAbility: "WAIT WAIT WAIT — hold on — WATCH THIS.",
      cardKO: [
        "Okay that was lag.",
        "That doesn't count, I wasn't ready.",
        "Chat, they're stream sniping."
      ],
      playerCardKO: [
        "GET CLIPPED! GET CLIPPED!",
        "Did you see that?! HIGHLIGHT REEL.",
        "And the crowd goes WILD!"
      ],
      winning: "GG already, just give up.",
      losing: "Okay okay I'm just warming up. WARMING UP.",
      victory: "Another W for the content. Subscribe button's right there.",
      defeat: "Whatever, that was a warm-up round. Run it back."
    }
  },

  // ==========================================
  // MRS. SNAKE-E — Easy
  // ==========================================
  {
    id: "mrs_snake_e",
    name: "Mrs. Snake-e",
    portrait: "mrs_snake_e.png",
    description: "Compliments you while absolutely destroying you.",
    difficulty: "easy",
    deck: ["mrs_snake_e_004", "mrs_snake_e_003", "mrs_snake_e_001", "landmark_garden"],
    antePool: ["mrs_snake_e_002", "duk_003", "duk_001", "pushing_cat_001"],
    reward: 8.00,
    dialogues: {
      intro: "Oh, how nice! I haven't had a visitor in ages. Would you like a cookie before we start?",
      turnStart: [
        "Now hold still, dear.",
        "This won't hurt a bit. Well, maybe a bit.",
        "Oh my, is it my turn already?",
        "Let me just — oh, there we go.",
        "You're doing so well, sweetie!"
      ],
      useAbility: "I baked something special, just for this occasion!",
      cardKO: [
        "Oh! Well, she needed a rest anyway.",
        "Oh dear. Let me get the next one.",
        "That's quite all right, I have more."
      ],
      playerCardKO: [
        "Oh no, are they okay? I feel terrible. Well, not THAT terrible.",
        "Down you go, dear. Nothing personal!",
        "Oh my! That was a good one, wasn't it?"
      ],
      winning: "I'm so sorry, sweetie. But a win is a win!",
      losing: "Oh, you're quite good at this! Mr. Snake-e will hear about you.",
      victory: "That was lovely! Come back anytime. I'll save you a cookie.",
      defeat: "Well done, dear! You earned it. Now take a cookie for the road."
    }
  },

  // ==========================================
  // PUSHING CAT — Medium
  // ==========================================
  {
    id: "pushing_cat",
    name: "Pushing Cat",
    portrait: "pushing_cat.png",
    description: "Chaotic. Unpredictable. Suspiciously smug.",
    difficulty: "medium",
    deck: ["pushing_cat_007", "pushing_cat_004", "pushing_cat_008", "landmark_sussy_lair"],
    antePool: ["pushing_cat_003", "pushing_cat_005", "duk_004", "duk_007"],
    reward: 15.00,
    dialogues: {
      intro: "*stares at you* *pushes your cards off the table* We're doing this.",
      turnStart: [
        "*knocks something over*",
        "*sits on your cards* What.",
        "*yawns aggressively*",
        "Meow. (Translated: you're finished.)",
        "*slow blink of superiority*"
      ],
      useAbility: "*pushes the ability button with extreme prejudice*",
      cardKO: [
        "*looks at fallen card* *pushes it further off the table*",
        "That wasn't my best one anyway. *licks paw*",
        "*shrug* I have eight more lives."
      ],
      playerCardKO: [
        "*pushes your KO'd card off the table* Oops.",
        "*smug face* Meow.",
        "*knocks your card into the shadow realm*"
      ],
      winning: "*curls up on your remaining cards* These are mine now.",
      losing: "*ears flatten* This changes nothing between us.",
      victory: "*takes your ante card AND knocks your water glass over* Good game.",
      defeat: "*pushes the ante card toward you* FINE. *knocks over a lamp on the way out*"
    }
  },

  // ==========================================
  // RITA — Medium
  // ==========================================
  {
    id: "rita",
    name: "Rita",
    portrait: "rita.png",
    description: "Encouraging, organized, and tougher than she looks.",
    difficulty: "medium",
    deck: ["rita_004", "rita_002", "remi_003", "landmark_elxacorp_hq"],
    antePool: ["rita_001", "rita_003", "duk_006", "duk_004"],
    reward: 15.00,
    dialogues: {
      intro: "Oh fun, I love a good card game! Don't worry, I'll go easy on — actually, no. No I won't.",
      turnStart: [
        "Okay, let me think about this strategically...",
        "I've been practicing!",
        "Hmm, interesting board state.",
        "You're good, but I planned for this.",
        "Let's see what we've got here!"
      ],
      useAbility: "I've been saving this one! Hope you don't mind.",
      cardKO: [
        "Okay, that's fine. I have a backup plan. I always have a backup plan.",
        "Well played! But I'm not done yet.",
        "Noted. Adjusting strategy."
      ],
      playerCardKO: [
        "Sorry! Well, not THAT sorry.",
        "That one's for the filing cabinet!",
        "Oof, that had to sting. You okay?"
      ],
      winning: "I organized my deck by win probability. It's paying off!",
      losing: "Okay you're really good. This is stressful. Fun-stressful.",
      victory: "Great game! I'm going to go journal about this. Highlight of my week!",
      defeat: "You beat me fair and square. Respect! Let's do this again sometime."
    }
  },

  // ==========================================
  // MR. SNAKE-E — Hard
  // ==========================================
  {
    id: "mr_snake_e",
    name: "Mr. Snake-e",
    portrait: "mr_snake_e.png",
    description: "Corporate intimidation. Legendary cards. No mercy.",
    difficulty: "hard",
    deck: ["mr_snake_e_004", "mr_snake_e_003", "pushing_cat_009", "landmark_snake_e_mansion"],
    antePool: ["mr_snake_e_001", "mr_snake_e_002", "pushing_cat_006", "remi_002"],
    reward: 30.00,
    dialogues: {
      intro: "I've cleared my 3 o'clock for this. Don't waste my time.",
      turnStart: [
        "Let's talk numbers.",
        "This is a growth opportunity. For me.",
        "Per my last attack...",
        "I see an opening in your portfolio.",
        "The market favors the bold."
      ],
      useAbility: "Consider this a hostile takeover.",
      cardKO: [
        "A minor setback. We'll restructure.",
        "That division was underperforming anyway.",
        "File that under acceptable losses."
      ],
      playerCardKO: [
        "Downsized.",
        "Your quarterly performance is... concerning.",
        "That's what we call a leveraged buyout."
      ],
      winning: "The board will be pleased with these results.",
      losing: "Interesting. I haven't seen numbers this bad since '08.",
      victory: "Another successful acquisition. Janice, cancel my 4 o'clock — I'm celebrating.",
      defeat: "Well. I'll have my people look into this. Congratulations. Don't let it happen again."
    }
  }

];
