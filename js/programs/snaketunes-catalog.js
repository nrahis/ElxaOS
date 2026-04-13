// =======================================
// SNAKETUNES MUSIC CATALOG — Data Only
// =======================================
// All 10 albums with full track listings.
// Prices in USD internally (displayed as snakes × 2).
// Song price: $0.175 (§0.35)
// Album prices: discounted from individual total.
// =======================================

var SNAKETUNES_SONG_PRICE = 0.175; // $0.175 USD = §0.35 snakes

var SNAKETUNES_CATALOG = [
    // ==========================================
    //  1. Card Captor Sakura
    // ==========================================
    {
        id: 'card_captor_sakura',
        title: 'Card Captor Sakura',
        artist: 'CCS Original Soundtrack',
        folder: 'Card_Captor_Sakura',
        trackCount: 10,
        albumPrice: 1.245,   // §2.49
        heroColor: '#e91e90',
        icon: 'mdi-star-four-points',
        tracks: [
            { idx: 0, title: 'Dreaming of You', file: 'dreaming_of_you.mid' },
            { idx: 1, title: 'Ending Theme', file: 'ending_theme.mid' },
            { idx: 2, title: 'Fruits', file: 'fruits.mid' },
            { idx: 3, title: 'Haruyoi', file: 'haruyoi.mid' },
            { idx: 4, title: 'Hitori', file: 'hitori.mid' },
            { idx: 5, title: 'Honey', file: 'honey.mid' },
            { idx: 6, title: "It's My Life", file: 'it__s_my_life.mid' },
            { idx: 7, title: 'Opening Theme', file: 'opening_theme.mid' },
            { idx: 8, title: 'Platinum', file: 'platinum.mid' },
            { idx: 9, title: 'Prism', file: 'prism.mid' }
        ]
    },

    // ==========================================
    //  2. Chrono Cross
    // ==========================================
    {
        id: 'chrono_cross',
        title: 'Chrono Cross',
        artist: 'Yasunori Mitsuda',
        folder: 'Chrono_Cross',
        trackCount: 9,
        albumPrice: 1.145,   // §2.29
        heroColor: '#1565c0',
        icon: 'mdi-clock-outline',
        tracks: [
            { idx: 0, title: 'Another Termina', file: 'cc-another_termina.mid' },
            { idx: 1, title: 'Dead Sea Tower of Destruction', file: 'cc-dead_sea_tower_of_destruction.mid' },
            { idx: 2, title: 'Dragon Rider', file: 'cc-dragon_rider.mid' },
            { idx: 3, title: 'Drowning Valley', file: 'cc-drowning_valley.mid' },
            { idx: 4, title: 'Fates Gods of Destiny', file: 'cc-fates_gods_of_destiny.mid' },
            { idx: 5, title: 'Primal Forest', file: 'cc-primal_forest.mid' },
            { idx: 6, title: "Serge's Village", file: 'cc-serge__s_village.mid' },
            { idx: 7, title: 'Star Stealing Girl', file: 'cc-star_stealing_girl.mid' },
            { idx: 8, title: 'The Brink of Death', file: 'cc-the_brink_of_death.mid' }
        ]
    },

    // ==========================================
    //  3. Final Fantasy VII
    // ==========================================
    {
        id: 'ff7',
        title: 'Final Fantasy VII',
        artist: 'Nobuo Uematsu',
        folder: 'Final_Fantasy_7',
        trackCount: 82,
        albumPrice: 7.495,   // §14.99
        heroColor: '#1b5e20',
        icon: 'mdi-sword-cross',
        tracks: [
            // Disc 1
            { idx: 0, title: 'Prelude', file: '1-01 Prelude Xg.mid' },
            { idx: 1, title: 'Opening ~ Bombing Mission', file: '1-02 Opening ~ Bombing Mission Xg.mid' },
            { idx: 2, title: 'Makou Reactor', file: '1-03 Makou Reactor Xg.mid' },
            { idx: 3, title: 'Anxious Heart', file: '1-04 Anxious Heart Xg.mid' },
            { idx: 4, title: "Tifa's Theme", file: "1-05 Tifa's Theme Xg.mid" },
            { idx: 5, title: "Barett's Theme", file: "1-06 Barett's Theme Xg.mid" },
            { idx: 6, title: 'Hurry!', file: '1-07 Hurry! Xg.mid' },
            { idx: 7, title: 'Lurking in the Darkness', file: '1-08 Lurking in the Darkness Xg.mid' },
            { idx: 8, title: 'ShinRa Company', file: '1-09 ShinRa Company Xg.mid' },
            { idx: 9, title: 'Fighting', file: '1-10 Fighting Xg.mid' },
            { idx: 10, title: 'Fanfare', file: '1-11 Fanfare Xg.mid' },
            { idx: 11, title: 'Flowers Blooming in the Church', file: '1-12 Flowers Blooming in the Church Xg.mid' },
            { idx: 12, title: "Turk's Theme", file: "1-13 Turk's Theme Xg.mid" },
            { idx: 13, title: 'Underneath the Rotting Pizza', file: '1-14 Underneath the Rotting Pizza Xg.mid' },
            { idx: 14, title: 'Oppressed People', file: '1-15 Opressed People Xg.mid' },
            { idx: 15, title: 'Honeybee Manor', file: '1-16 Honeybee Manor Xg.mid' },
            { idx: 16, title: 'Who Are You', file: '1-17 Who Are You Xg.mid' },
            { idx: 17, title: 'Don of the Slums', file: '1-18 Don of the Slums Xg(1).mid' },
            { idx: 18, title: 'Infiltrating ShinRa Tower', file: '1-19 Infiltrating ShinRa Tower Xg.mid' },
            { idx: 19, title: 'Still More Fighting', file: '1-20 Still More Fighitng Xg.mid' },
            { idx: 20, title: "Red XIII's Theme", file: "1-21 Red XIII's Theme Xg.mid" },
            { idx: 21, title: 'Crazy Motorcycle', file: '1-22 Crazy Motorcycle Xg.mid' },
            { idx: 22, title: 'Holding My Thoughts in My Heart', file: '1-23 Holding My Thoughts in My Heart Xg.mid' },
            // Disc 2
            { idx: 23, title: 'FFVII Main Theme', file: '2-01 FFVII Main Theme Xg.mid' },
            { idx: 24, title: 'Ahead on Our Way', file: '2-02 Ahead on Our Way Xg.mid' },
            { idx: 25, title: 'Good Night, Until Tomorrow', file: '2-03 Good Night, Until Tommorow Xg.mid' },
            { idx: 26, title: 'On That Day, 5 Years Ago', file: '2-04 On That Day, 5 Years Ago Xg.mid' },
            { idx: 27, title: 'Farm Boy', file: '2-05 Farm Boy Xg.mid' },
            { idx: 28, title: 'Waltz de Chocobo', file: '2-06 Waltz de Chocobo Xg.mid' },
            { idx: 29, title: 'Electric de Chocobo', file: '2-07 Electric de Chocobo Xg.mid' },
            { idx: 30, title: 'Cinco de Chocobo', file: '2-08 Cinco de Chocobo Xg.mid' },
            { idx: 31, title: 'Chasing the Black-Caped Man', file: '2-09 Chasing the Black-Caped Man Xg.mid' },
            { idx: 32, title: 'Fortress of the Condor', file: '2-10 Fortress of the Condor Xg.mid' },
            { idx: 33, title: "Rufus's Welcoming Ceremony", file: "2-11 Rufus's Welcoming Ceremony Xg.mid" },
            { idx: 34, title: "It's Difficult to Stand on Both Feet", file: "2-12 It's Difficult to Stand on Both Feet, Isn't It Xg.mid" },
            { idx: 35, title: 'Trail of Blood', file: '2-13 Trail of Blood Xg.mid' },
            { idx: 36, title: 'J-E-N-O-V-A', file: '2-14 J-E-N-O-V-A Xg.mid' },
            { idx: 37, title: 'Continue', file: '2-15 Conitnue Xg.mid' },
            { idx: 38, title: 'Costa Del Sol', file: '2-16 Costa Del Sol Xg.mid' },
            { idx: 39, title: 'Mark of the Traitor', file: '2-17 Mark of the Traitor Xg.mid' },
            { idx: 40, title: 'Mining Town', file: '2-18 Mining Town Xg.mid' },
            { idx: 41, title: 'Gold Saucer', file: '2-19 Gold Saucer Xg.mid' },
            { idx: 42, title: "Cait Sith's Theme", file: "2-20 Cait Sith's Theme Xg.mid" },
            { idx: 43, title: 'Sandy Badlands', file: '2-21 Sandy Badlands Xg.mid' },
            // Disc 3
            { idx: 44, title: 'Cosmo Canyon', file: '3-01 Cosmo Canyon Xg.mid' },
            { idx: 45, title: 'Life Stream', file: '3-02 Life Stream Xg.mid' },
            { idx: 46, title: 'Great Warrior', file: '3-03 Great Warrior Xg.mid' },
            { idx: 47, title: 'Descendant of Shinobi', file: '3-04 Descendant of Shinobi Xg .mid' },
            { idx: 48, title: 'Those Chosen by the Planet', file: '3-05 Those Chosen by the Planet Xg .mid' },
            { idx: 49, title: "The Nightmare's Beginning", file: "3-06 The Nightmare's Beginning Xg.mid" },
            { idx: 50, title: "Cid's Theme", file: "3-07 Cid's Theme Xg.mid" },
            { idx: 51, title: 'Steal the Tiny Bronco!', file: '3-08 Steal the Tiny Bronco! Xg.mid' },
            { idx: 52, title: 'Wutai', file: '3-09 Wutai Xg.mid' },
            { idx: 53, title: 'Stolen Materia', file: '3-10 Stolen Materia Xg.mid' },
            { idx: 54, title: 'Racing Chocobos', file: '3-11 Racing Chocobos-Place Your Bets Xg.mid' },
            { idx: 55, title: 'Fiddle de Chocobo', file: '3-12 Fiddle de Chocobo Xg.mid' },
            { idx: 56, title: 'A Great Success', file: '3-13 A Great Success Xg.mid' },
            { idx: 57, title: 'Tango of Tears', file: '3-14 Tango of Tears Xg.mid' },
            { idx: 58, title: 'Debut', file: '3-15 Debut Xg.mid' },
            { idx: 59, title: 'Interrupted by Fireworks', file: '3-16 Interupted by Fireworks Xg.mid' },
            { idx: 60, title: 'Forested Temple', file: '3-17 Forested Temple Xg.mid' },
            { idx: 61, title: 'You Can Hear the Cry of the Planet', file: '3-18 You Can Hear the Cry of the Planet Xg.mid' },
            { idx: 62, title: "Aerith's Theme", file: "3-19 Aerith's Theme Xg.mid" },
            { idx: 63, title: 'Buried in the Snow', file: '3-20 Buried in the Snow Xg.mid' },
            { idx: 64, title: 'The Great Northern Cave', file: '3-21 The Great Northern Cave Xg.mid' },
            { idx: 65, title: 'Reunion', file: '3-22 Reunion Xg.mid' },
            { idx: 66, title: 'Who Am I', file: '3-23 Who Am I Xg.mid' },
            // Disc 4
            { idx: 67, title: 'ShinRa Army Full Scale Attack', file: '4-01 ShinRa Army Wages a Full Scale Attack Xg .mid' },
            { idx: 68, title: 'Weapon Raid', file: '4-02 Weapon Raid Xg.mid' },
            { idx: 69, title: 'Highwind Takes to the Skies', file: '4-03 Highwind Takes to the Skies Xg.mid' },
            { idx: 70, title: 'A Secret Sleeping in the Deep Sea', file: '4-04 A Secret, Sleeping in the Deep Sea Xg .mid' },
            { idx: 71, title: 'Parochial Town', file: '4-05 Parochial Town Xg.mid' },
            { idx: 72, title: 'Off the Edge of Despair', file: '4-06 Off the Edge of Dispair Xg.mid' },
            { idx: 73, title: 'On the Other Side of the Mountain', file: '4-07 On the Other Side of the Mountain Xg.mid' },
            { idx: 74, title: 'Hurry Faster!', file: '4-08 Hurry Faster! Xg.mid' },
            { idx: 75, title: 'Sending a Dream Into the Universe', file: '4-09 Sending a Dream Into the Universe Xg.mid' },
            { idx: 76, title: 'The Countdown Begins', file: '4-10 The Countdown Begins Xg.mid' },
            { idx: 77, title: 'If You Open Your Heart', file: '4-11 If You Open Your Heart___ Xg.mid' },
            { idx: 78, title: 'The Makou Cannon Is Fired', file: '4-12 The Makou Cannon is Fired ~ ShinRa Explodes Xg.mid' },
            { idx: 79, title: 'Judgement Day', file: '4-13 Judgement Day Xg.mid' },
            { idx: 80, title: 'Jenova Absolute', file: '4-14 Jenova Absolute Xg.mid' },
            { idx: 81, title: 'The Birth of God', file: '4-15 The Birth of God Xg.mid' },
            { idx: 82, title: 'One Winged Angel', file: '4-16 One Winged Angel Xg.mid' },
            { idx: 83, title: 'World Crisis', file: '4-17 World Crisis Xg.mid' },
            { idx: 84, title: 'Staff Roll', file: '4-18 Staff Roll Xg.mid' }
        ]
    },

    // ==========================================
    //  4. Final Fantasy VIII
    // ==========================================
    {
        id: 'ff8',
        title: 'Final Fantasy VIII',
        artist: 'Nobuo Uematsu',
        folder: 'Final_Fantasy_8',
        trackCount: 74,
        albumPrice: 6.495,   // §12.99
        heroColor: '#b71c1c',
        icon: 'mdi-shield-sword',
        tracks: [
            // Disc 1
            { idx: 0, title: 'Liberi Fatali', file: '1-01-Liberi_Fatali.mid' },
            { idx: 1, title: 'Balamb Garden', file: '1-02-Balamb_Garden.mid' },
            { idx: 2, title: 'Blue Fields', file: '1-03-Blue_Fields.mid' },
            { idx: 3, title: "Don't Be Afraid", file: '1-04-Dont_Be_Afraid.mid' },
            { idx: 4, title: 'The Winner', file: '1-05-The_Winner.mid' },
            { idx: 5, title: 'Find Your Way', file: '1-06-Find_Your_Way.mid' },
            { idx: 6, title: 'SeeD', file: '1-07-Seed.mid' },
            { idx: 7, title: 'The Landing', file: '1-08-The_Landing.mid' },
            { idx: 8, title: 'Starting Up', file: '1-09-Starting_Up.mid' },
            { idx: 9, title: 'Force Your Way', file: '1-10-Force_Your_Way.mid' },
            { idx: 10, title: 'The Loser', file: '1-11-The_Loser.mid' },
            { idx: 11, title: 'Never Look Back', file: '1-12-Never_Look_Back.mid' },
            { idx: 12, title: 'Dead End', file: '1-13-Dead_End.mid' },
            { idx: 13, title: 'Breezy', file: '1-14-Breezy.mid' },
            { idx: 14, title: 'Shuffle or Boogie', file: '1-15-Shuffle_or_Boogie.mid' },
            { idx: 15, title: 'Waltz for the Moon', file: '1-16-Waltz_for_the_Moon.mid' },
            { idx: 16, title: 'Tell Me', file: '1-17-Tell_Me.mid' },
            { idx: 17, title: 'Fear', file: '1-18-Fear.mid' },
            { idx: 18, title: 'The Man With the Machine Gun', file: '1-19-The_Man_With_the_Machine_Gun.mid' },
            { idx: 19, title: 'Julia', file: '1-20-Julia.mid' },
            { idx: 20, title: 'Roses and Wine', file: '1-21-Roses_and_Wine.mid' },
            { idx: 21, title: 'Junction', file: '1-22-Junction.mid' },
            { idx: 22, title: 'Timber Owls', file: '1-23-Timber_Owls.mid' },
            // Disc 2
            { idx: 23, title: 'My Mind', file: '2-01-My_Mind.mid' },
            { idx: 24, title: 'The Mission', file: '2-02-The_Mission.mid' },
            { idx: 25, title: 'Martial Law', file: '2-03-Martial_Law.mid' },
            { idx: 26, title: 'Cactus Jack', file: '2-04-Cactus_Jack.mid' },
            { idx: 27, title: 'Only a Plank Between One and Perdition', file: '2-05-Only_A_Plank_Between_One_and_Perdition.mid' },
            { idx: 28, title: 'Succession of Witches', file: '2-06-Succession_of_Witches.mid' },
            { idx: 29, title: 'Galbadia Garden', file: '2-07-Galbadia_Garden.mid' },
            { idx: 30, title: 'Unrest', file: '2-08-Unrest.mid' },
            { idx: 31, title: 'Under Her Control', file: '2-09-Under_Her_Control.mid' },
            { idx: 32, title: 'The Stage Is Set', file: '2-10-The_Stage_Is_Set.mid' },
            { idx: 33, title: 'A Sacrifice', file: '2-11-A_Sacrifice.mid' },
            { idx: 34, title: 'Fithos Lusec Wecos Vinosec', file: '2-12-Fithos_Lusec_Wecos_Vinosec.mid' },
            { idx: 35, title: 'Intruders', file: '2-13-Intruders.mid' },
            { idx: 36, title: 'Premonition', file: '2-14-Premonition.mid' },
            { idx: 37, title: 'Wounded', file: '2-15-Wounded.mid' },
            { idx: 38, title: 'Fragments of Memories', file: '2-16-Fragments_of_Memories.mid' },
            { idx: 39, title: 'Jailed', file: '2-17-Jailed.mid' },
            { idx: 40, title: 'Rivals', file: '2-18-Rivals.mid' },
            { idx: 41, title: 'Ami', file: '2-19-Ami.mid' },
            // Disc 3
            { idx: 42, title: 'The Spy', file: '3-01-The_Spy.mid' },
            { idx: 43, title: 'Retaliation', file: '3-02-Retaliation.mid' },
            { idx: 44, title: "Movin'", file: '3-03-Movin.mid' },
            { idx: 45, title: 'Blue Sky', file: '3-04-Blue_Sky.mid' },
            { idx: 46, title: 'Drifting', file: '3-05-Drifting.mid' },
            { idx: 47, title: 'Heresy', file: '3-06-Heresy.mid' },
            { idx: 48, title: "Fisherman's Horizon", file: '3-07-Fishermans_Horizon.mid' },
            { idx: 49, title: 'Odeka de Chocobo', file: '3-08-Odeka_de_Chocobo.mid' },
            { idx: 50, title: 'Where I Belong', file: '3-09-Where_I_Belong.mid' },
            { idx: 51, title: 'The Oath', file: '3-10-The_Oath.mid' },
            { idx: 52, title: 'Slide Show Part 1', file: '3-11-Slide_Show_Part_1.mid' },
            { idx: 53, title: 'Slide Show Part 2', file: '3-12-Slide_Show_Part_2.mid' },
            { idx: 54, title: 'Love Grows', file: '3-13-Love_Grows.mid' },
            { idx: 55, title: 'The Salt Flats', file: '3-14-The_Salt_Flats.mid' },
            { idx: 56, title: 'Trust Me', file: '3-15-Trust_Me.mid' },
            { idx: 57, title: 'Silence and Motion', file: '3-16-Silence_and_Motion.mid' },
            { idx: 58, title: 'Dance With the Balamb Fish', file: '3-17-Dance_With_the_Balamb_Fish.mid' },
            { idx: 59, title: 'Tears of the Moon', file: '3-18-Tears_of_the_Moon.mid' },
            { idx: 60, title: 'Residents', file: '3-19-Residents.mid' },
            { idx: 61, title: 'Eyes on Me', file: '3-20-Eyes_On_Me.mid' },
            { idx: 62, title: 'Eyes on Me (Version 2)', file: '3-20-Eyes_On_Me_2.mid' },
            // Disc 4
            { idx: 63, title: 'Mods de Chocobo', file: '4-01-Mods_de_Chocobo.mid' },
            { idx: 64, title: 'Ride On', file: '4-02-Ride_On.mid' },
            { idx: 65, title: 'Truth', file: '4-03-Truth.mid' },
            { idx: 66, title: 'Lunatic Pandora', file: '4-04-Lunatic_Pandora.mid' },
            { idx: 67, title: 'Compression of Time', file: '4-05-Compression_of_Time.mid' },
            { idx: 68, title: 'The Castle', file: '4-06-The_Castle.mid' },
            { idx: 69, title: 'The Legendary Beast', file: '4-07-The_Legendary_Beast.mid' },
            { idx: 70, title: "Maybe I'm a Lion", file: '4-08-Maybe_Im_a_Lion.mid' },
            { idx: 71, title: 'The Extreme', file: '4-09-The_Extreme.mid' },
            { idx: 72, title: 'The Successor', file: '4-10-The_Successor.mid' },
            { idx: 73, title: 'Ending Theme', file: '4-11-Ending_Theme.mid' },
            { idx: 74, title: 'Overture', file: '4-12-Overture.mid' },
            { idx: 75, title: 'Battle Theme', file: 'a-FF8battle-theme.mid' }
        ]
    },

    // ==========================================
    //  5. Final Fantasy IX
    // ==========================================
    {
        id: 'ff9',
        title: 'Final Fantasy IX',
        artist: 'Nobuo Uematsu',
        folder: 'Final_Fantasy_9',
        trackCount: 93,
        albumPrice: 7.495,   // §14.99
        heroColor: '#4a148c',
        icon: 'mdi-crystal-ball',
        tracks: [
            { idx: 0, title: 'Alexandria', file: 'Alexandria.mid' },
            { idx: 1, title: 'Aloha del Chocobo', file: 'Aloha_del_Chocobo.mid' },
            { idx: 2, title: 'Amarant', file: 'Amarant.mid' },
            { idx: 3, title: 'Ambush Attack', file: 'ambush_attack.mid' },
            { idx: 4, title: 'A Night in Alexandria', file: 'a_night_in_alexandria.mid' },
            { idx: 5, title: 'Battle Theme', file: 'Battle_Theme.mid' },
            { idx: 6, title: 'Battle Theme II', file: 'Battle_Theme2.mid' },
            { idx: 7, title: 'Battle Theme (Piano)', file: 'battle_theme_piano.mid' },
            { idx: 8, title: 'Behind the Door', file: 'Behind_the_door.mid' },
            { idx: 9, title: 'Bittersweet Romance', file: 'Bittersweet_Romance.mid' },
            { idx: 10, title: 'Black Mage Village', file: 'black_mage_village.mid' },
            { idx: 11, title: 'Black Waltz', file: 'Black_waltz.mid' },
            { idx: 12, title: 'Boss Battle', file: 'Boss_Battle.mid' },
            { idx: 13, title: 'Boundary South Gate', file: 'boundary_south_gate.mid' },
            { idx: 14, title: 'Chosen Summoner', file: 'Chosen_summoner.mid' },
            { idx: 15, title: 'Cleyra Settlement', file: 'cleyra_settlement.mid' },
            { idx: 16, title: 'Conde Petit', file: 'Conde_Petit.mid' },
            { idx: 17, title: 'Consecutive Battles', file: 'consecutive_battles.mid' },
            { idx: 18, title: 'Crossing the Knoll', file: 'crossing_the_knoll.mid' },
            { idx: 19, title: 'Crystal World', file: 'crysyal world.mid' },
            { idx: 20, title: 'Dali', file: 'Dali.mid' },
            { idx: 21, title: 'Danger in the Forest', file: 'Danger_in_the_forest.mid' },
            { idx: 22, title: "Didn't Capture the Hearts of Both", file: "didn't_capture_the_hearts_of_both.mid" },
            { idx: 23, title: 'Dissipating Magic', file: 'Dissipating_Magic.mid' },
            { idx: 24, title: 'Dissipating Sorrow', file: 'dissipating_sorrow.mid' },
            { idx: 25, title: "Eiko's Theme", file: 'Eikos_Theme.mid' },
            { idx: 26, title: 'Esto Gaza', file: 'Esto_Gaza.mid' },
            { idx: 27, title: 'Eternal Harvest', file: 'Eternal_Harvest (Cleira_dance).mid' },
            { idx: 28, title: 'Fairy Battle', file: 'fairy battle.mid' },
            { idx: 29, title: 'Fanfare', file: 'Fanfare.mid' },
            { idx: 30, title: 'Far Away Twilight', file: 'Far_Away_Twilight.mid' },
            { idx: 31, title: 'Feel My Blade', file: 'Feel_My_Blade (theatre_battle).mid' },
            { idx: 32, title: 'Forgotten Face', file: 'Forgotten_Face (Freija_theme).mid' },
            { idx: 33, title: 'Forgotten Memory in the Storm', file: 'forgotten_memory_in_the_storm.mid' },
            { idx: 34, title: 'Fossil Roo', file: 'Fossil_Roo.mid' },
            { idx: 35, title: 'Game Over', file: 'Game_Over.mid' },
            { idx: 36, title: 'Gargan Roo', file: 'gargan_roo.mid' },
            { idx: 37, title: "Garnet's Theme", file: 'garnets_theme.mid' },
            { idx: 38, title: 'Ghizamaluk', file: 'Ghizamaluk.mid' },
            { idx: 39, title: 'Zidane', file: 'Gidan.mid' },
            { idx: 40, title: 'Goodnight', file: 'Goodnight.mid' },
            { idx: 41, title: 'Gulgu Volcano', file: 'gulgu_volcano.mid' },
            { idx: 42, title: 'Heaven Distress', file: 'Heaven_Distress.mid' },
            { idx: 43, title: 'Hilda Garde III', file: 'HildaGardeIII.mid' },
            { idx: 44, title: 'Hunter Chance', file: 'Hunter_Chance.mid' },
            { idx: 45, title: 'Ice Cavern', file: 'icecavern.mid' },
            { idx: 46, title: 'Iifa Tree', file: 'Iifa_tree.mid' },
            { idx: 47, title: 'Immoral Melody', file: 'Immoral_Melody (Angelofdeath).mid' },
            { idx: 48, title: 'Janitor of Time', file: 'janitor_of_time.mid' },
            { idx: 49, title: 'Jesters of the Moon', file: 'Jesters_of_the_Moon (SonZon_theme).mid' },
            { idx: 50, title: "Kuja's Theme", file: 'Kujas_theme.mid' },
            { idx: 51, title: 'Last Battle', file: 'last_battle.mid' },
            { idx: 52, title: 'Lindblum', file: 'Lindblum.mid' },
            { idx: 53, title: 'Lindblum Castle', file: 'Lindblum_Castle.mid' },
            { idx: 54, title: 'Loss of Me I', file: 'loss_of_me1.mid' },
            { idx: 55, title: 'Loss of Me II', file: 'Loss_of_Me2.mid' },
            { idx: 56, title: 'Loss of Me III', file: 'Loss_of_Me3.mid' },
            { idx: 57, title: 'Melodies of Life', file: 'melodies_of_life.mid' },
            { idx: 58, title: 'Melodies of Life II', file: 'Melodies_of_Life2.mid' },
            { idx: 59, title: 'Memoria', file: 'memoria.mid' },
            { idx: 60, title: 'Mystery Sword', file: 'Mystery_Sword.mid' },
            { idx: 61, title: 'One Problem Settled', file: 'One_problem_settled.mid' },
            { idx: 62, title: 'Overworld', file: 'Overworld.mid' },
            { idx: 63, title: 'Pandemonium', file: 'Pandemonium.mid' },
            { idx: 64, title: 'Prelude', file: 'prelude.mid' },
            { idx: 65, title: 'Prima Vista Band', file: 'Prima_Vista_band.mid' },
            { idx: 66, title: 'Privation of Summons', file: 'Privation_of_Summons (Extraction).mid' },
            { idx: 67, title: 'Protecting My Devotion', file: 'Protecting_My_Devotion (lossofme_battle).mid' },
            { idx: 68, title: 'Qu', file: 'Qu.mid' },
            { idx: 69, title: 'Queen of Frogs', file: 'Queen_of_frogs.mid' },
            { idx: 70, title: 'Rebirth of Evil Mist', file: 'Rebirth_of_Evil_Mist (Invincible).mid' },
            { idx: 71, title: 'Remembering', file: 'remembering.mid' },
            { idx: 72, title: 'Ruins of Madain Sari', file: 'ruins_of_Madain_Sari.mid' },
            { idx: 73, title: 'Run!', file: 'Run.mid' },
            { idx: 74, title: 'Search for the Princess', file: 'Seach_for_the_Princess.mid' },
            { idx: 75, title: 'Secret Library Daguerreo', file: 'secret_library_daguerreo.mid' },
            { idx: 76, title: 'Skirmish With the Silver Dragons', file: 'skirmish_with_the_Silver_Dragons.mid' },
            { idx: 77, title: 'Slew of Love Letters', file: 'Slew_of_love_letters.mid' },
            { idx: 78, title: 'Song of Memory', file: 'Song_of_Memory.mid' },
            { idx: 79, title: 'Soulless Village Bran Bal', file: 'souless_village_Branbul.mid' },
            { idx: 80, title: "Steiner's Theme", file: 'Steiner_theme.mid' },
            { idx: 81, title: 'Tantalus Theme', file: 'tantarus_theme.mid' },
            { idx: 82, title: 'Terra', file: 'tera.mid' },
            { idx: 83, title: 'Tetra Master', file: 'tetra master.mid' },
            { idx: 84, title: 'The City That Never Sleeps', file: 'the_city_that_never_sleeps_toleno.mid' },
            { idx: 85, title: 'The Dark Messenger', file: 'the_dark_messenger.mid' },
            { idx: 86, title: "The Place I'll Return to Someday", file: 'the_place_ill_return_to_someday.mid' },
            { idx: 87, title: 'The Thing I Must Protect', file: 'the_thing_i_must_protect.mid' },
            { idx: 88, title: 'Track 1', file: 'track1.mid' },
            { idx: 89, title: 'Track 2', file: 'track2.mid' },
            { idx: 90, title: 'Ukulele de Chocobo', file: 'ukelele_del_chocobo.mid' },
            { idx: 91, title: 'Vamo Alla Flamenco', file: 'vamo_alla_flamenco.mid' },
            { idx: 92, title: 'Vamo Alla Flamenco II', file: 'vamo_alla_flamenco2.mid' },
            { idx: 93, title: "Vivi's Theme", file: "Vivi's Theme.mid" },
            { idx: 94, title: 'Wall of Sacred Beasts', file: 'wall_of_sacred_beasts.mid' },
            { idx: 95, title: "You're Not Alone", file: 'Youre_not_alone.mid' },
            { idx: 96, title: "You're Not Alone II", file: 'youre_not_alone2.mid' }
        ]
    },

    // ==========================================
    //  6. Fullmetal Alchemist
    // ==========================================
    {
        id: 'fullmetal_alchemist',
        title: 'Fullmetal Alchemist',
        artist: 'FMA Original Soundtrack',
        folder: 'Fullmetal_Alchemist',
        trackCount: 7,
        albumPrice: 0.895,   // §1.79
        heroColor: '#e65100',
        icon: 'mdi-fire',
        tracks: [
            { idx: 0, title: 'Kesenai Tsumi', file: 'kesenai_tsumi.mid' },
            { idx: 1, title: 'Melissa', file: 'melissa.mid' },
            { idx: 2, title: 'Motherland', file: 'motherland.mid' },
            { idx: 3, title: 'Ready Steady Go', file: 'ready_steady_go.mid' },
            { idx: 4, title: 'Rewrite', file: 'rewrite.mid' },
            { idx: 5, title: 'Tobira no Mukou e', file: 'tobira_no_mukou_e.mid' },
            { idx: 6, title: 'Undo', file: 'undo.mid' }
        ]
    },

    // ==========================================
    //  7. Inuyasha
    // ==========================================
    {
        id: 'inuyasha',
        title: 'Inuyasha',
        artist: 'Inuyasha Original Soundtrack',
        folder: 'Inuyasha',
        trackCount: 24,
        albumPrice: 2.995,   // §5.99
        heroColor: '#c62828',
        icon: 'mdi-bow-arrow',
        tracks: [
            { idx: 0, title: 'Affections', file: 'affections.mid' },
            { idx: 1, title: 'Change the World (Opening 1)', file: 'change_the_world_opening_1.mid' },
            { idx: 2, title: 'Change the World (Opening 2)', file: 'change_the_world_opening_2.mid' },
            { idx: 3, title: 'Change the World (Opening 3)', file: 'change_the_world_opening_3.mid' },
            { idx: 4, title: 'Change the World (Opening 4)', file: 'change_the_world_opening_4.mid' },
            { idx: 5, title: 'Dearest', file: 'dearest.mid' },
            { idx: 6, title: 'Every Heart', file: 'every_heart.mid' },
            { idx: 7, title: 'Fairy Tale', file: 'fairy_tale.mid' },
            { idx: 8, title: 'Fukai Mori', file: 'fuaki_mori.mid' },
            { idx: 9, title: 'Fukai Mori (Version 2)', file: 'fuaki_mori_2.mid' },
            { idx: 10, title: 'Fukai Mori (Version 3)', file: 'fuaki_mori_3.mid' },
            { idx: 11, title: 'Ganbare! Houjou-kun', file: 'ganbare!_houjou_kun.mid' },
            { idx: 12, title: 'I Am', file: 'i_am.mid' },
            { idx: 13, title: 'Kikyou no Kokoro', file: 'kikyou_no_kokoro.mid' },
            { idx: 14, title: 'Kohaku no Omokage', file: 'kohaku_no_omokage.mid' },
            { idx: 15, title: 'Kyuuchi', file: 'kyuuchi.mid' },
            { idx: 16, title: 'My Will (Ending 1)', file: 'my_will_ending_1.mid' },
            { idx: 17, title: 'My Will (Ending 2)', file: 'my_will_ending_2.mid' },
            { idx: 18, title: 'My Will (Ending 3)', file: 'my_will_ending_3.mid' },
            { idx: 19, title: 'My Will (Ending 4)', file: 'my_will_ending_4.mid' },
            { idx: 20, title: 'My Will (Ending 5)', file: 'my_will_ending_5.mid' },
            { idx: 21, title: 'My Will (Ending 6)', file: 'my_will_ending_6.mid' },
            { idx: 22, title: 'No More Words', file: 'no_more_words.mid' },
            { idx: 23, title: 'Taijia Sango', file: 'taijia_sango.mid' }
        ]
    },

    // ==========================================
    //  8. Kingdom Hearts
    // ==========================================
    {
        id: 'kingdom_hearts',
        title: 'Kingdom Hearts',
        artist: 'Yoko Shimomura',
        folder: 'Kingdom_Hearts',
        trackCount: 18,
        albumPrice: 2.245,   // §4.49
        heroColor: '#0d47a1',
        icon: 'mdi-key-variant',
        tracks: [
            { idx: 0, title: 'Always on My Mind', file: 'Always_On_My_Mind.mid' },
            { idx: 1, title: 'Dearly Beloved', file: 'Dearly_Beloved.mid' },
            { idx: 2, title: 'Deep Jungle', file: 'Deep_Jungle.mid' },
            { idx: 3, title: 'Destiny Islands', file: 'Destiny_Islands.mid' },
            { idx: 4, title: 'Dive Into the Heart', file: 'Dive_Into_The_Heart.mid' },
            { idx: 5, title: 'Forze del Mal', file: 'Forze_Del_Mal.mid' },
            { idx: 6, title: 'Go For It!', file: 'Go_For_It.mid' },
            { idx: 7, title: 'Gummi Ship', file: 'Gummi_Ship.mid' },
            { idx: 8, title: 'Halloween Town', file: 'Halloween_Town.mid' },
            { idx: 9, title: 'Hollow Bastion', file: 'Hallow_Bastion.mid' },
            { idx: 10, title: 'Hand in Hand', file: 'Hand_In_Hand.mid' },
            { idx: 11, title: 'Kairi', file: 'Kairi.mid' },
            { idx: 12, title: 'Neverland Sky', file: 'Neverland_Sky.mid' },
            { idx: 13, title: 'Night of Fate', file: 'Night_Of_Fate.mid' },
            { idx: 14, title: 'Scherzo di Notte', file: 'Scherzo_Di_Notte.mid' },
            { idx: 15, title: 'Traverse Town', file: 'Traverse_town.mid' },
            { idx: 16, title: 'Under the Sea', file: 'Under_The_Sea.mid' },
            { idx: 17, title: 'Wonderland', file: 'Wonderland.mid' }
        ]
    },

    // ==========================================
    //  9. Legend of Dragoon
    // ==========================================
    {
        id: 'legend_of_dragoon',
        title: 'Legend of Dragoon',
        artist: 'Dennis Martin & Takeo Miratsu',
        folder: 'Legend_of_Dragoon',
        trackCount: 28,
        albumPrice: 3.495,   // §6.99
        heroColor: '#880e4f',
        icon: 'mdi-dragon',
        tracks: [
            { idx: 0, title: 'Ancient Story', file: 'ancient_story.mid' },
            { idx: 1, title: 'Bale Theme', file: 'bale_theme.mid' },
            { idx: 2, title: 'Battle Theme', file: 'battle_theme.mid' },
            { idx: 3, title: 'Boss Theme', file: 'boss_theme.mid' },
            { idx: 4, title: 'Boss Theme II', file: 'boss_theme_2.mid' },
            { idx: 5, title: 'Castle Theme', file: 'castle_theme.mid' },
            { idx: 6, title: 'Chapter 1', file: 'chapter_1.mid' },
            { idx: 7, title: 'Chapter 2', file: 'chapter_2.mid' },
            { idx: 8, title: 'Chapter 3', file: 'chapter_3.mid' },
            { idx: 9, title: 'Crystal Palace', file: 'crystal_palace.mid' },
            { idx: 10, title: 'Dabas', file: 'dabas.mid' },
            { idx: 11, title: "Dart's Theme", file: 'dart__s_theme.mid' },
            { idx: 12, title: 'Deningrad', file: 'deningrad.mid' },
            { idx: 13, title: 'Furni', file: 'furni.mid' },
            { idx: 14, title: 'Hellena Prison', file: 'hellena_prison.mid' },
            { idx: 15, title: 'Intro', file: 'intro.mid' },
            { idx: 16, title: "Lavitz's Theme", file: 'lavitz__s_theme.mid' },
            { idx: 17, title: 'Lohan', file: 'lohan.mid' },
            { idx: 18, title: "Meru's Theme", file: 'meru__s_theme.mid' },
            { idx: 19, title: 'Moon', file: 'moon.mid' },
            { idx: 20, title: 'Prepare for Battle', file: 'prepare_for_battle.mid' },
            { idx: 21, title: 'Remember', file: 'remember.mid' },
            { idx: 22, title: "Rose's Theme", file: 'rose__s_theme.mid' },
            { idx: 23, title: 'Seles', file: 'seles.mid' },
            { idx: 24, title: 'Shana', file: 'shana.mid' },
            { idx: 25, title: 'Superboss Theme', file: 'superboss_theme.mid' },
            { idx: 26, title: 'Swamp Battle Theme', file: 'swamp_battle_theme.mid' },
            { idx: 27, title: "Zieg's Theme", file: 'zieg__s_theme.mid' }
        ]
    },

    // ==========================================
    //  10. Neon Genesis Evangelion
    // ==========================================
    {
        id: 'neon_genesis_evangelion',
        title: 'Neon Genesis Evangelion',
        artist: 'Shiro Sagisu',
        folder: 'Neon_Genesis_Evangelion',
        trackCount: 16,
        albumPrice: 1.995,   // §3.99
        heroColor: '#311b92',
        icon: 'mdi-robot',
        tracks: [
            { idx: 0, title: 'Angel Attack', file: 'angel_attack.mid' },
            { idx: 1, title: 'Angel Attack II', file: 'angel_attack_2.mid' },
            { idx: 2, title: 'Arael the Angel', file: 'arael_the_angel.mid' },
            { idx: 3, title: "A Cruel Angel's Thesis", file: 'cruel_angel__s_thesis.mid' },
            { idx: 4, title: 'Deployment', file: 'deployment.mid' },
            { idx: 5, title: 'Dream Message', file: 'dream_message.mid' },
            { idx: 6, title: 'Fly Me to the Moon', file: 'fly_me_to_the_moon.mid' },
            { idx: 7, title: 'Get Along', file: 'get_along.mid' },
            { idx: 8, title: "Hedgehog's Dilemma", file: 'hedgehog__s_dilemma.mid' },
            { idx: 9, title: 'Misato Theme', file: 'misato_theme.mid' },
            { idx: 10, title: 'No Hatred', file: 'no_hatred.mid' },
            { idx: 11, title: 'Peace of Mind', file: 'peace_of_mind.mid' },
            { idx: 12, title: 'Rei Theme I', file: 'rei_theme_1.mid' },
            { idx: 13, title: 'Rei Theme II', file: 'rei_theme_2.MID' },
            { idx: 14, title: "Soul's Refrain", file: 'soul__s_refrain.mid' },
            { idx: 15, title: "Soul's Refrain II", file: 'soul__s_refrain_2.mid' }
        ]
    },

    // ==========================================
    //  11. Best Rock Hits of All Time
    // ==========================================
    {
        id: 'best_rock_hits',
        title: 'Best Rock Hits of All Time',
        artist: 'Various Artists',
        folder: 'Best_Rock_Hits_of_All_Time',
        trackCount: 63,
        albumPrice: 7.495,   // §14.99
        heroColor: '#b71c1c',
        icon: 'mdi-guitar-electric',
        tracks: [
            { idx: 0, title: 'Another One Bites the Dust', file: 'AnotherOneBitesTheDust.mid' },
            { idx: 1, title: 'Any Way You Want It', file: 'AnyWayYouWantIt.mid' },
            { idx: 2, title: 'Bad Company', file: 'BadCompany.mid' },
            { idx: 3, title: 'Bad Moon Rising', file: 'BadMoonRising.mid' },
            { idx: 4, title: 'Bohemian Rhapsody', file: 'BohemianRhapsody.mid' },
            { idx: 5, title: "Burnin' for You", file: 'BurninForYou.mid' },
            { idx: 6, title: 'Call Me the Breeze', file: 'CallmetheBreeze.mid' },
            { idx: 7, title: 'Crazy', file: 'Crazy.mid' },
            { idx: 8, title: 'Crazy Train', file: 'CrazyTrain.mid' },
            { idx: 9, title: 'Dani California', file: 'DaniCalifornia.mid' },
            { idx: 10, title: 'The Devil Went Down to Georgia', file: 'DevilWentDownToGeorgia.mid' },
            { idx: 11, title: 'Dirty Deeds Done Dirt Cheap', file: 'DirtyDeedsDoneDirtCheap.mid' },
            { idx: 12, title: "Don't Fear the Reaper", file: 'DontFearTheReaper.mid' },
            { idx: 13, title: "Don't Stop Believin'", file: 'DontStopBelievin.mid' },
            { idx: 14, title: 'Dude Looks Like a Lady', file: 'DudeLooksLikeALady.mid' },
            { idx: 15, title: 'Everlong', file: 'Everlong.mid' },
            { idx: 16, title: 'Faithfully', file: 'Faithfully.mid' },
            { idx: 17, title: 'Fat Bottomed Girls', file: 'FatBottomedGirls.mid' },
            { idx: 18, title: 'Feel Like Making Love', file: 'FeelLikeMakingLove.mid' },
            { idx: 19, title: 'Feels Like the First Time', file: 'FeelsLikeTheFirstTime.mid' },
            { idx: 20, title: 'For Those About to Rock', file: 'ForThoseAboutToRock.mid' },
            { idx: 21, title: 'Fortunate Son', file: 'FortunateSon.mid' },
            { idx: 22, title: "Give Me All Your Lovin'", file: 'GiveMeAllYourLovin.mid' },
            { idx: 23, title: 'Give Me Three Steps', file: 'GiveMeThreeSteps.mid' },
            { idx: 24, title: 'Have You Ever Seen the Rain', file: 'HaveYouEverSeenTheRain.mid' },
            { idx: 25, title: 'Highway to Hell', file: 'HighwayToHell.mid' },
            { idx: 26, title: 'Hot Blooded', file: 'HotBlooded.mid' },
            { idx: 27, title: 'Hotel California', file: 'HotelCalifornia.mid' },
            { idx: 28, title: 'Jaded', file: 'Jaded.mid' },
            { idx: 29, title: "Janie's Got a Gun", file: 'JaniesGotAGun.mid' },
            { idx: 30, title: 'Killer Queen', file: 'KillerQueen.mid' },
            { idx: 31, title: "Knockin' on Heaven's Door", file: 'KnockingOnHeavensDoor.mid' },
            { idx: 32, title: 'Landslide', file: 'Landslide.mid' },
            { idx: 33, title: 'Layla', file: 'Layla.mid' },
            { idx: 34, title: 'Life in the Fast Lane', file: 'LifeInTheFastLane.mid' },
            { idx: 35, title: 'Love in an Elevator', file: 'LoveInAnElevator.mid' },
            { idx: 36, title: "Mama I'm Coming Home", file: 'MamaImComingHome.mid' },
            { idx: 37, title: 'Mama Kin', file: 'MamaKin.mid' },
            { idx: 38, title: 'Money for Nothing', file: 'MoneyForNothing.mid' },
            { idx: 39, title: 'More Than a Feeling', file: 'MoreThanAFeeling.mid' },
            { idx: 40, title: 'Old Time Rock and Roll', file: 'OldTimeRockAndRoll.mid' },
            { idx: 41, title: 'Paradise City', file: 'ParadiseCity.mid' },
            { idx: 42, title: 'Pour Some Sugar on Me', file: 'PourSomeSugarOnMe.mid' },
            { idx: 43, title: 'Ramble On Rose', file: 'RambleOnRose.mid' },
            { idx: 44, title: 'Rebel Yell', file: 'RebelYell.mid' },
            { idx: 45, title: 'Rock of Ages', file: 'RockOfAges.mid' },
            { idx: 46, title: 'Sharp Dressed Man', file: 'SharpDressedMan.mid' },
            { idx: 47, title: 'Shot in the Dark', file: 'ShotInTheDark.mid' },
            { idx: 48, title: 'Somebody to Love', file: 'SomebodyToLove.mid' },
            { idx: 49, title: 'Stairway to Heaven', file: 'StairwayToHeaven.mid' },
            { idx: 50, title: 'Sweet Child O\' Mine', file: 'SweetChildOfMine.mid' },
            { idx: 51, title: 'Sympathy for the Devil', file: 'SympathyForTheDevil.mid' },
            { idx: 52, title: 'Take It Easy', file: 'TakeItEasy.mid' },
            { idx: 53, title: 'That Smell', file: 'ThatSmell.mid' },
            { idx: 54, title: 'The Other Side', file: 'TheOtherSide.mid' },
            { idx: 55, title: 'TNT', file: 'TNT.mid' },
            { idx: 56, title: 'Voodoo Child', file: 'VoodooChild.mid' },
            { idx: 57, title: 'Welcome to the Jungle', file: 'WelcomeToTheJungle.mid' },
            { idx: 58, title: 'We Will Rock You', file: 'WeWillRockYou.mid' },
            { idx: 59, title: "What's Your Name", file: 'WhatsYourName.mid' },
            { idx: 60, title: 'When Love and Hate Collide', file: 'WhenLoveAndHateCollide.mid' },
            { idx: 61, title: 'White Wedding', file: 'WhiteWedding.mid' },
            { idx: 62, title: 'You Shook Me All Night Long', file: 'YouShookMeAllNightLong.mid' }
        ]
    },

    // ==========================================
    //  12. Classical Greats
    // ==========================================
    {
        id: 'classical_greats',
        title: 'Classical Greats',
        artist: 'Various Composers',
        folder: 'Classical_Greats',
        trackCount: 6,
        albumPrice: 0.745,   // §1.49
        heroColor: '#4a148c',
        icon: 'mdi-violin',
        tracks: [
            { idx: 0, title: 'Clair de Lune', file: 'ClairdeLune.mid' },
            { idx: 1, title: 'Flight of the Bumblebee', file: 'FlightoftheBumblee.mid' },
            { idx: 2, title: 'Goldberg Variations', file: 'GoldbergVariations.mid' },
            { idx: 3, title: 'Hallelujah Chorus', file: 'hallujah.mid' },
            { idx: 4, title: 'In the Hall of the Mountain King', file: 'IntheHalloftheMountainKing.mid' },
            { idx: 5, title: 'Ride of the Valkyries', file: 'RideoftheValkyries.mid' }
        ]
    }
];

// ==========================================
//  HELPER: Get total track count
// ==========================================
var SNAKETUNES_TOTAL_TRACKS = 0;
for (var i = 0; i < SNAKETUNES_CATALOG.length; i++) {
    SNAKETUNES_TOTAL_TRACKS += SNAKETUNES_CATALOG[i].tracks.length;
}
