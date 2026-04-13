// =============================================================
// SNAKETUNES — Desktop Music Player Program
// Depends on: snaketunes-catalog.js, midi-player-js CDN, soundfont-player CDN
// =============================================================

// General MIDI instrument names (program 0-127) matching soundfont-player CDN
var GM_INSTRUMENTS = [
    'acoustic_grand_piano','bright_acoustic_piano','electric_grand_piano','honkytonk_piano',
    'electric_piano_1','electric_piano_2','harpsichord','clavinet',
    'celesta','glockenspiel','music_box','vibraphone',
    'marimba','xylophone','tubular_bells','dulcimer',
    'drawbar_organ','percussive_organ','rock_organ','church_organ',
    'reed_organ','accordion','harmonica','tango_accordion',
    'acoustic_guitar_nylon','acoustic_guitar_steel','electric_guitar_jazz','electric_guitar_clean',
    'electric_guitar_muted','overdriven_guitar','distortion_guitar','guitar_harmonics',
    'acoustic_bass','electric_bass_finger','electric_bass_pick','fretless_bass',
    'slap_bass_1','slap_bass_2','synth_bass_1','synth_bass_2',
    'violin','viola','cello','contrabass',
    'tremolo_strings','pizzicato_strings','orchestral_harp','timpani',
    'string_ensemble_1','string_ensemble_2','synth_strings_1','synth_strings_2',
    'choir_aahs','voice_oohs','synth_choir','orchestra_hit',
    'trumpet','trombone','tuba','muted_trumpet',
    'french_horn','brass_section','synth_brass_1','synth_brass_2',
    'soprano_sax','alto_sax','tenor_sax','baritone_sax',
    'oboe','english_horn','bassoon','clarinet',
    'piccolo','flute','recorder','pan_flute',
    'blown_bottle','shakuhachi','whistle','ocarina',
    'lead_1_square','lead_2_sawtooth','lead_3_calliope','lead_4_chiff',
    'lead_5_charang','lead_6_voice','lead_7_fifths','lead_8_bass_lead',
    'pad_1_new_age','pad_2_warm','pad_3_polysynth','pad_4_choir',
    'pad_5_bowed','pad_6_metallic','pad_7_halo','pad_8_sweep',
    'fx_1_rain','fx_2_soundtrack','fx_3_crystal','fx_4_atmosphere',
    'fx_5_brightness','fx_6_goblins','fx_7_echoes','fx_8_scifi',
    'sitar','banjo','shamisen','koto',
    'kalimba','bagpipe','fiddle','shanai',
    'tinkle_bell','agogo','steel_drums','woodblock',
    'taiko_drum','melodic_tom','synth_drum','reverse_cymbal',
    'guitar_fret_noise','breath_noise','seashore','bird_tweet',
    'telephone_ring','helicopter','applause','gunshot'
];

class SnakeTunesProgram {
    constructor(windowManager, fileSystem, eventBus) {
        this.windowManager = windowManager;
        this.fileSystem = fileSystem;
        this.eventBus = eventBus;

        // UI state
        this._view = 'library';       // library | allsongs | store | album-detail | store-detail | playlist
        this._detailAlbumId = null;
        this._detailPlaylistId = null;
        this._windowId = null;

        // Playback state
        this._midiPlayer = null;
        this._audioCtx = null;
        this._gainNode = null;
        this._isPlaying = false;
        this._currentTrack = null;     // { albumId, idx, title, file, folder }
        this._queue = [];
        this._currentTime = 0;
        this._duration = 0;
        this._volume = 0.8;
        this._progressInterval = null;
        this._activeNotes = {};        // keyed by 'channel_note'

        // Multi-instrument support
        this._instruments = {};        // programNumber -> loaded Soundfont instrument
        this._channelPrograms = {};    // channelNumber -> programNumber
        this._loadingPrograms = {};    // programNumber -> Promise (prevents duplicate loads)

        // Playlists (loaded from registry)
        this._playlists = [];
    }

    // =========================================================
    //  LAUNCH
    // =========================================================
    launch() {
        var windowId = 'snaketunes-' + Date.now();
        this._windowId = windowId;

        this.windowManager.createWindow(
            windowId,
            '<span class="mdi mdi-music elxa-icon-ui"></span> SnakeTunes',
            '<div class="snaketunes-app" id="' + windowId + '-app">Loading...</div>',
            { width: '820px', height: '560px' }
        );

        // Clean up MIDI playback when window is closed
        if (this.eventBus) {
            var self = this;
            var onClosed = function(data) {
                if (data.id === windowId) {
                    self._onClose();
                    self.eventBus.off('window.closed', onClosed);
                }
            };
            this.eventBus.on('window.closed', onClosed);
        }

        this._loadUserData().then(() => {
            this._render();
            this._bindEvents();
        });
    }

    // =========================================================
    //  USER DATA (owned songs + playlists from registry)
    // =========================================================
    async _loadUserData() {
        try {
            if (typeof elxaOS !== 'undefined' && elxaOS.registry) {
                var state = await elxaOS.registry.getState('snaketunes');
                if (state && state.playlists) {
                    this._playlists = state.playlists;
                }
            }
        } catch (e) {
            console.warn('SnakeTunes: could not load user data', e);
        }
    }

    async _saveUserData() {
        try {
            if (typeof elxaOS !== 'undefined' && elxaOS.registry) {
                await elxaOS.registry.setState('snaketunes', {
                    playlists: this._playlists
                });
            }
        } catch (e) {
            console.warn('SnakeTunes: could not save user data', e);
        }
    }

    // =========================================================
    //  OWNERSHIP HELPERS
    // =========================================================
    _getOwnedSongs() {
        // Returns array of music items, with metadata guaranteed
        if (typeof elxaOS === 'undefined' || !elxaOS.inventoryService) return [];
        try {
            var allItems = elxaOS.inventoryService.getItemsSync ? elxaOS.inventoryService.getItemsSync() : [];
            var musicItems = allItems.filter(function(s) { return s.subcategory === 'music'; });

            // Migrate items that were stored without metadata (pre-fix)
            for (var i = 0; i < musicItems.length; i++) {
                var item = musicItems[i];
                if (!item.metadata && item.itemId) {
                    // Reconstruct metadata from itemId (pattern: albumId_trackIdx)
                    for (var j = 0; j < SNAKETUNES_CATALOG.length; j++) {
                        var album = SNAKETUNES_CATALOG[j];
                        var prefix = album.id + '_';
                        if (item.itemId.indexOf(prefix) === 0) {
                            var idx = parseInt(item.itemId.slice(prefix.length));
                            var track = album.tracks.find(function(t) { return t.idx === idx; });
                            if (track) {
                                item.metadata = {
                                    albumId: album.id,
                                    trackIdx: idx,
                                    title: track.title,
                                    file: track.file
                                };
                            }
                            break;
                        }
                    }
                }
            }

            return musicItems.filter(function(s) { return s.metadata; });
        } catch (e) { return []; }
    }

    _getOwnedSongsForAlbum(albumId) {
        var owned = this._getOwnedSongs();
        return owned.filter(function(s) {
            return s.metadata && s.metadata.albumId === albumId;
        });
    }

    _isSongOwned(albumId, trackIdx) {
        var owned = this._getOwnedSongsForAlbum(albumId);
        return owned.some(function(s) {
            return s.metadata && s.metadata.trackIdx === trackIdx;
        });
    }

    _isAlbumFullyOwned(albumId) {
        var album = this._getAlbum(albumId);
        if (!album) return false;
        var ownedCount = this._getOwnedSongsForAlbum(albumId).length;
        return ownedCount >= album.tracks.length;
    }

    _getAlbumAdjustedPrice(albumId) {
        var album = this._getAlbum(albumId);
        if (!album) return 0;
        var ownedCount = this._getOwnedSongsForAlbum(albumId).length;
        var fullPrice = album.albumPrice;
        var discount = ownedCount * SNAKETUNES_SONG_PRICE;
        return Math.max(0, fullPrice - discount);
    }

    _getAlbum(albumId) {
        return SNAKETUNES_CATALOG.find(function(a) { return a.id === albumId; });
    }

    _hasOwnedSongs() {
        return this._getOwnedSongs().filter(function(s) {
            return s.subcategory === 'music';
        }).length > 0;
    }

    // =========================================================
    //  FINANCE HELPERS
    // =========================================================
    _getBalance() {
        if (typeof elxaOS === 'undefined' || !elxaOS.financeService) return 0;
        try {
            var bal = elxaOS.financeService.getAccountBalancesSync();
            return bal.checking || 0;
        } catch (e) { return 0; }
    }

    _snakes(usd) {
        return '§' + (usd * 2).toFixed(2);
    }

    // =========================================================
    //  MDI HELPER
    // =========================================================
    _mdi(name) {
        return '<span class="mdi mdi-' + name + ' elxa-icon-ui"></span>';
    }

    // =========================================================
    //  RENDER — Main Router
    // =========================================================
    _render() {
        var appEl = document.getElementById(this._windowId + '-app');
        if (!appEl) return;

        appEl.innerHTML = this._buildSidebar() +
            '<div class="snaketunes-main" id="' + this._windowId + '-main">' +
                this._buildMainContent() +
            '</div>' +
            '</div>' + // close snaketunes-body
            this._buildNowPlaying();

        // Wrap body and now-playing properly
        appEl.innerHTML =
            '<div class="snaketunes-body">' +
                this._buildSidebar() +
                '<div class="snaketunes-main" id="' + this._windowId + '-main">' +
                    this._buildMainContent() +
                '</div>' +
            '</div>' +
            this._buildNowPlaying();
    }

    _renderMain() {
        var mainEl = document.getElementById(this._windowId + '-main');
        if (!mainEl) return;
        mainEl.innerHTML = this._buildMainContent();
    }

    // =========================================================
    //  SIDEBAR
    // =========================================================
    _buildSidebar() {
        var self = this;
        var html = '<div class="snaketunes-sidebar">';

        // Library section
        html += '<div class="snaketunes-sidebar-section">';
        html += '<div class="snaketunes-sidebar-label">Library</div>';
        html += this._sidebarItem('library', 'mdi-album', 'My Music');
        html += this._sidebarItem('allsongs', 'mdi-music', 'All Songs');
        html += '</div>';

        // Store section
        html += '<div class="snaketunes-sidebar-section">';
        html += '<div class="snaketunes-sidebar-label">Store</div>';
        html += this._sidebarItem('store', 'mdi-shopping', 'Browse Music');
        html += '</div>';

        // Playlists section
        html += '<div class="snaketunes-sidebar-section">';
        html += '<div class="snaketunes-sidebar-label">Playlists</div>';
        for (var i = 0; i < this._playlists.length; i++) {
            var pl = this._playlists[i];
            html += '<div class="snaketunes-sidebar-item' + (this._view === 'playlist' && this._detailPlaylistId === pl.id ? ' active' : '') + '" data-action="nav-playlist" data-id="' + pl.id + '">';
            html += this._mdi('playlist-music') + '<span>' + this._escHtml(pl.name) + '</span>';
            html += '</div>';
        }
        html += '<div class="snaketunes-sidebar-add" data-action="new-playlist">' + this._mdi('plus') + ' New Playlist</div>';
        html += '</div>';

        html += '</div>';
        return html;
    }

    _sidebarItem(view, icon, label) {
        var active = this._view === view ? ' active' : '';
        return '<div class="snaketunes-sidebar-item' + active + '" data-action="nav" data-view="' + view + '">' +
            this._mdi(icon.replace('mdi-', '')) + '<span>' + label + '</span></div>';
    }

    // =========================================================
    //  MAIN CONTENT ROUTER
    // =========================================================
    _buildMainContent() {
        switch (this._view) {
            case 'library': return this._buildLibrary();
            case 'allsongs': return this._buildAllSongs();
            case 'store': return this._buildStore();
            case 'album-detail': return this._buildAlbumDetail(this._detailAlbumId, true);
            case 'store-detail': return this._buildAlbumDetail(this._detailAlbumId, false);
            case 'playlist': return this._buildPlaylist(this._detailPlaylistId);
            default: return this._buildLibrary();
        }
    }

    // =========================================================
    //  LIBRARY VIEW (My Music — owned albums)
    // =========================================================
    _buildLibrary() {
        var owned = this._getOwnedSongs().filter(function(s) { return s.subcategory === 'music'; });
        if (owned.length === 0) {
            return '<div class="snaketunes-empty">' +
                this._mdi('music-off') +
                '<p>Your library is empty</p>' +
                '<p style="font-size:12px">Head to the Store to buy some tunes!</p>' +
                '</div>';
        }

        // Group owned songs by album
        var albumIds = {};
        for (var i = 0; i < owned.length; i++) {
            var s = owned[i];
            if (s.metadata && s.metadata.albumId) {
                albumIds[s.metadata.albumId] = true;
            }
        }

        var html = '<h2 style="font-size:20px;font-weight:700;margin:0 0 16px 0">My Music</h2>';
        html += '<div class="snaketunes-album-grid">';
        for (var j = 0; j < SNAKETUNES_CATALOG.length; j++) {
            var album = SNAKETUNES_CATALOG[j];
            if (!albumIds[album.id]) continue;
            html += this._albumCard(album, 'album-detail');
        }
        html += '</div>';
        return html;
    }

    // =========================================================
    //  ALL SONGS VIEW
    // =========================================================
    _buildAllSongs() {
        var owned = this._getOwnedSongs().filter(function(s) { return s.subcategory === 'music'; });
        if (owned.length === 0) {
            return '<div class="snaketunes-empty">' +
                this._mdi('music-off') +
                '<p>No songs yet</p>' +
                '</div>';
        }

        var html = '<h2 style="font-size:20px;font-weight:700;margin:0 0 16px 0">All Songs</h2>';
        html += '<div class="snaketunes-tracklist">';

        // Sort owned songs by album then track index
        var sorted = owned.slice().sort(function(a, b) {
            if (a.metadata.albumId !== b.metadata.albumId) return a.metadata.albumId < b.metadata.albumId ? -1 : 1;
            return (a.metadata.trackIdx || 0) - (b.metadata.trackIdx || 0);
        });

        for (var i = 0; i < sorted.length; i++) {
            var s = sorted[i];
            var album = this._getAlbum(s.metadata.albumId);
            var isPlaying = this._currentTrack && this._currentTrack.albumId === s.metadata.albumId && this._currentTrack.idx === s.metadata.trackIdx;
            html += '<div class="snaketunes-track-row' + (isPlaying ? ' playing' : '') + '" data-action="play-song" data-album="' + s.metadata.albumId + '" data-idx="' + s.metadata.trackIdx + '">';
            html += '<div class="snaketunes-track-num">' + (isPlaying ? this._mdi('volume-high') : (i + 1)) + '</div>';
            html += '<div class="snaketunes-track-title">' + this._escHtml(s.metadata.title || s.name) + '</div>';
            html += '<div class="snaketunes-track-duration" style="color:rgba(255,255,255,0.3);font-size:11px">' + (album ? album.title : '') + '</div>';
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    // =========================================================
    //  STORE VIEW
    // =========================================================
    _buildStore() {
        var balance = this._getBalance();
        var html = '<div class="snaketunes-store-header">';
        html += '<h2>SnakeTunes Store</h2>';
        html += '<div class="snaketunes-store-wallet">' + this._mdi('wallet') + ' ' + this._snakes(balance) + '</div>';
        html += '</div>';

        html += '<div class="snaketunes-album-grid">';
        for (var i = 0; i < SNAKETUNES_CATALOG.length; i++) {
            var album = SNAKETUNES_CATALOG[i];
            var fullyOwned = this._isAlbumFullyOwned(album.id);
            html += '<div class="snaketunes-store-card" data-action="open-album" data-album="' + album.id + '" data-target="store-detail">';
            html += '<div class="snaketunes-album-art" style="background:' + album.heroColor + '">' + this._mdi(album.icon.replace('mdi-', '')) + '</div>';
            html += '<div class="snaketunes-album-card-info">';
            html += '<div><div class="snaketunes-album-card-title">' + this._escHtml(album.title) + '</div>';
            html += '<div class="snaketunes-album-card-artist">' + this._escHtml(album.artist) + '</div></div>';
            html += '<div class="snaketunes-store-price' + (fullyOwned ? ' owned' : '') + '">' + (fullyOwned ? 'Owned' : this._snakes(album.albumPrice)) + '</div>';
            html += '</div></div>';
        }
        html += '</div>';
        return html;
    }

    // =========================================================
    //  ALBUM DETAIL VIEW (library or store)
    // =========================================================
    _buildAlbumDetail(albumId, isLibrary) {
        var album = this._getAlbum(albumId);
        if (!album) return '<div class="snaketunes-empty"><p>Album not found</p></div>';

        var ownedForAlbum = this._getOwnedSongsForAlbum(albumId);
        var ownedIdxSet = {};
        for (var o = 0; o < ownedForAlbum.length; o++) {
            ownedIdxSet[ownedForAlbum[o].metadata.trackIdx] = true;
        }
        var fullyOwned = ownedForAlbum.length >= album.tracks.length;
        var adjustedPrice = this._getAlbumAdjustedPrice(albumId);

        var html = '<div class="snaketunes-back" data-action="nav" data-view="' + (isLibrary ? 'library' : 'store') + '">' + this._mdi('arrow-left') + ' Back</div>';

        // Album header
        html += '<div class="snaketunes-album-header">';
        html += '<div class="snaketunes-album-header-art" style="background:' + album.heroColor + '">' + this._mdi(album.icon.replace('mdi-', '')) + '</div>';
        html += '<div class="snaketunes-album-header-info">';
        html += '<div class="album-type">Album</div>';
        html += '<div class="album-title">' + this._escHtml(album.title) + '</div>';
        html += '<div class="album-artist">' + this._escHtml(album.artist) + '</div>';
        html += '<div class="album-meta">' + album.tracks.length + ' songs' + (ownedForAlbum.length > 0 ? ' &middot; ' + ownedForAlbum.length + ' owned' : '') + '</div>';
        html += '</div></div>';

        // Action buttons
        html += '<div class="snaketunes-album-actions">';
        if (ownedForAlbum.length > 0) {
            html += '<button class="snaketunes-btn snaketunes-btn-primary" data-action="play-album" data-album="' + albumId + '">' + this._mdi('play') + ' Play</button>';
        }
        if (!fullyOwned && !isLibrary) {
            var priceLabel = ownedForAlbum.length > 0
                ? 'Complete Album ' + this._snakes(adjustedPrice)
                : 'Buy Album ' + this._snakes(album.albumPrice);
            html += '<button class="snaketunes-btn snaketunes-btn-buy" style="padding:8px 16px;font-size:13px;border-radius:20px" data-action="buy-album" data-album="' + albumId + '">' + this._mdi('cart') + ' ' + priceLabel + '</button>';
        }
        if (ownedForAlbum.length > 0 && this._playlists.length > 0) {
            html += '<button class="snaketunes-btn snaketunes-btn-secondary" data-action="add-album-to-playlist" data-album="' + albumId + '">' + this._mdi('playlist-plus') + ' Add to Playlist</button>';
        }
        html += '</div>';

        // Track list
        html += '<div class="snaketunes-tracklist">';
        for (var i = 0; i < album.tracks.length; i++) {
            var track = album.tracks[i];
            var owned = ownedIdxSet[track.idx] === true;
            var isPlaying = this._currentTrack && this._currentTrack.albumId === albumId && this._currentTrack.idx === track.idx;

            html += '<div class="snaketunes-track-row' + (isPlaying ? ' playing' : '') + (!owned ? ' unowned' : '') + '"' +
                (owned ? ' data-action="play-song" data-album="' + albumId + '" data-idx="' + track.idx + '"' : '') + '>';
            html += '<div class="snaketunes-track-num">' + (isPlaying ? this._mdi('volume-high') : (i + 1)) + '</div>';
            html += '<div class="snaketunes-track-title">' + this._escHtml(track.title) + '</div>';

            if (!owned && !isLibrary) {
                html += '<div class="snaketunes-track-buy"><button class="snaketunes-btn snaketunes-btn-buy" data-action="buy-song" data-album="' + albumId + '" data-idx="' + track.idx + '">' + this._snakes(SNAKETUNES_SONG_PRICE) + '</button></div>';
            } else if (owned) {
                html += '<div class="snaketunes-track-duration">' + this._mdi('check') + '</div>';
            }

            html += '</div>';
        }
        html += '</div>';
        return html;
    }

    // =========================================================
    //  PLAYLIST VIEW
    // =========================================================
    _buildPlaylist(playlistId) {
        var pl = this._playlists.find(function(p) { return p.id === playlistId; });
        if (!pl) return '<div class="snaketunes-empty"><p>Playlist not found</p></div>';

        var html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">';
        html += '<h2 style="font-size:20px;font-weight:700;margin:0">' + this._escHtml(pl.name) + '</h2>';
        html += '<div style="display:flex;gap:8px">';
        if (pl.songs.length > 0) {
            html += '<button class="snaketunes-btn snaketunes-btn-primary" data-action="play-playlist" data-id="' + playlistId + '">' + this._mdi('play') + ' Play All</button>';
        }
        html += '<button class="snaketunes-btn snaketunes-btn-secondary" data-action="delete-playlist" data-id="' + playlistId + '">' + this._mdi('delete') + '</button>';
        html += '</div></div>';

        if (pl.songs.length === 0) {
            html += '<div class="snaketunes-empty">' + this._mdi('playlist-music') + '<p>This playlist is empty</p><p style="font-size:12px">Open an album and add songs here</p></div>';
            return html;
        }

        html += '<div class="snaketunes-tracklist">';
        for (var i = 0; i < pl.songs.length; i++) {
            var ref = pl.songs[i];
            var album = this._getAlbum(ref.albumId);
            var track = album ? album.tracks.find(function(t) { return t.idx === ref.trackIdx; }) : null;
            if (!track) continue;
            var isPlaying = this._currentTrack && this._currentTrack.albumId === ref.albumId && this._currentTrack.idx === ref.trackIdx;

            html += '<div class="snaketunes-track-row' + (isPlaying ? ' playing' : '') + '" data-action="play-song" data-album="' + ref.albumId + '" data-idx="' + ref.trackIdx + '">';
            html += '<div class="snaketunes-track-num">' + (isPlaying ? this._mdi('volume-high') : (i + 1)) + '</div>';
            html += '<div class="snaketunes-track-title">' + this._escHtml(track.title) + '</div>';
            html += '<div class="snaketunes-track-duration" style="color:rgba(255,255,255,0.3);font-size:11px">' + (album ? album.title : '') + '</div>';
            html += '<div class="snaketunes-playlist-remove" data-action="remove-from-playlist" data-playlist="' + playlistId + '" data-index="' + i + '">' + this._mdi('close') + '</div>';
            html += '</div>';
        }
        html += '</div>';
        return html;
    }

    // =========================================================
    //  ALBUM CARD COMPONENT
    // =========================================================
    _albumCard(album, target) {
        return '<div class="snaketunes-album-card" data-action="open-album" data-album="' + album.id + '" data-target="' + target + '">' +
            '<div class="snaketunes-album-art" style="background:' + album.heroColor + '">' + this._mdi(album.icon.replace('mdi-', '')) + '</div>' +
            '<div class="snaketunes-album-card-info">' +
            '<div class="snaketunes-album-card-title">' + this._escHtml(album.title) + '</div>' +
            '<div class="snaketunes-album-card-artist">' + this._escHtml(album.artist) + '</div>' +
            '</div></div>';
    }

    // =========================================================
    //  NOW PLAYING BAR
    // =========================================================
    _buildNowPlaying() {
        var ct = this._currentTrack;
        var album = ct ? this._getAlbum(ct.albumId) : null;

        var html = '<div class="snaketunes-now-playing">';

        // Track info
        html += '<div class="snaketunes-np-info">';
        if (album) {
            html += '<div class="snaketunes-np-art" style="background:' + album.heroColor + '">' + this._mdi(album.icon.replace('mdi-', '')) + '</div>';
            html += '<div class="snaketunes-np-text">';
            html += '<div class="snaketunes-np-title">' + this._escHtml(ct.title) + '</div>';
            html += '<div class="snaketunes-np-artist">' + this._escHtml(album.artist) + '</div>';
            html += '</div>';
        } else {
            html += '<div class="snaketunes-np-art" style="background:rgba(255,255,255,0.06)">' + this._mdi('music-note') + '</div>';
            html += '<div class="snaketunes-np-text"><div class="snaketunes-np-title" style="color:rgba(255,255,255,0.3)">Not Playing</div></div>';
        }
        html += '</div>';

        // Controls
        html += '<div class="snaketunes-np-controls">';
        html += '<div class="snaketunes-np-buttons">';
        html += '<button class="snaketunes-np-btn" data-action="prev">' + this._mdi('skip-previous') + '</button>';
        html += '<button class="snaketunes-np-btn play-btn" data-action="toggle-play">' + this._mdi(this._isPlaying ? 'pause' : 'play') + '</button>';
        html += '<button class="snaketunes-np-btn" data-action="next">' + this._mdi('skip-next') + '</button>';
        html += '</div>';
        html += '<div class="snaketunes-np-progress">';
        html += '<div class="snaketunes-np-time" id="' + this._windowId + '-time-cur">' + this._formatTime(this._currentTime) + '</div>';
        html += '<div class="snaketunes-progress-bar" data-action="seek"><div class="snaketunes-progress-fill" id="' + this._windowId + '-progress" style="width:' + this._progressPercent() + '%"></div></div>';
        html += '<div class="snaketunes-np-time" id="' + this._windowId + '-time-dur">' + this._formatTime(this._duration) + '</div>';
        html += '</div>';
        html += '</div>';

        // Volume
        html += '<div class="snaketunes-np-volume">';
        html += '<button class="snaketunes-np-btn" data-action="toggle-mute" style="font-size:16px">' + this._mdi(this._volume > 0 ? 'volume-high' : 'volume-off') + '</button>';
        html += '<div class="snaketunes-volume-bar" data-action="set-volume"><div class="snaketunes-volume-fill" id="' + this._windowId + '-vol" style="width:' + (this._volume * 100) + '%"></div></div>';
        html += '</div>';

        html += '</div>';
        return html;
    }

    // =========================================================
    //  EVENT BINDING
    // =========================================================
    _bindEvents() {
        var appEl = document.getElementById(this._windowId + '-app');
        if (!appEl) return;
        var self = this;

        appEl.addEventListener('click', function(e) {
            var target = e.target.closest('[data-action]');
            if (!target) return;
            var action = target.getAttribute('data-action');

            switch (action) {
                case 'nav':
                    self._view = target.getAttribute('data-view');
                    self._render();
                    break;

                case 'nav-playlist':
                    self._view = 'playlist';
                    self._detailPlaylistId = target.getAttribute('data-id');
                    self._render();
                    break;

                case 'open-album':
                    self._detailAlbumId = target.getAttribute('data-album');
                    self._view = target.getAttribute('data-target') || 'album-detail';
                    self._render();
                    break;

                case 'play-song':
                    self._playSong(target.getAttribute('data-album'), parseInt(target.getAttribute('data-idx')));
                    break;

                case 'play-album':
                    self._playAlbum(target.getAttribute('data-album'));
                    break;

                case 'play-playlist':
                    self._playPlaylist(target.getAttribute('data-id'));
                    break;

                case 'buy-song':
                    e.stopPropagation();
                    self._buySong(target.getAttribute('data-album'), parseInt(target.getAttribute('data-idx')));
                    break;

                case 'buy-album':
                    self._buyAlbum(target.getAttribute('data-album'));
                    break;

                case 'toggle-play':
                    self._togglePlay();
                    break;

                case 'prev':
                    self._prevTrack();
                    break;

                case 'next':
                    self._nextTrack();
                    break;

                case 'seek':
                    self._handleSeek(e, target);
                    break;

                case 'set-volume':
                    self._handleVolume(e, target);
                    break;

                case 'toggle-mute':
                    self._volume = self._volume > 0 ? 0 : 0.8;
                    self._applyVolume();
                    self._render();
                    break;

                case 'new-playlist':
                    self._createPlaylist();
                    break;

                case 'delete-playlist':
                    self._deletePlaylist(target.getAttribute('data-id'));
                    break;

                case 'remove-from-playlist':
                    self._removeFromPlaylist(target.getAttribute('data-playlist'), parseInt(target.getAttribute('data-index')));
                    break;

                case 'add-album-to-playlist':
                    self._addAlbumToPlaylistPrompt(target.getAttribute('data-album'));
                    break;
            }
        });
    }

    // =========================================================
    //  PLAYBACK ENGINE
    // =========================================================
    async _initAudio() {
        if (this._audioCtx) return;
        this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this._gainNode = this._audioCtx.createGain();
        this._gainNode.gain.value = this._volume;
        this._gainNode.connect(this._audioCtx.destination);

        // Load piano as default fallback instrument (program 0)
        await this._loadInstrument(0);
    }

    async _loadInstrument(program) {
        // Already loaded
        if (this._instruments[program]) return this._instruments[program];

        // Already loading — wait for it
        if (this._loadingPrograms[program]) return this._loadingPrograms[program];

        var name = GM_INSTRUMENTS[program] || 'acoustic_grand_piano';
        var self = this;

        this._loadingPrograms[program] = (async function() {
            try {
                if (typeof Soundfont !== 'undefined' && self._audioCtx) {
                    var inst = await Soundfont.instrument(self._audioCtx, name, {
                        destination: self._gainNode
                    });
                    self._instruments[program] = inst;
                    console.log('SnakeTunes: Loaded instrument ' + program + ' (' + name + ')');
                    return inst;
                }
            } catch (e) {
                console.warn('SnakeTunes: Could not load ' + name + ', falling back to piano', e);
                // Fall back to piano if we have it
                return self._instruments[0] || null;
            } finally {
                delete self._loadingPrograms[program];
            }
            return null;
        })();

        return this._loadingPrograms[program];
    }

    async _playSong(albumId, trackIdx) {
        var album = this._getAlbum(albumId);
        if (!album) return;
        var track = album.tracks.find(function(t) { return t.idx === trackIdx; });
        if (!track) return;

        // Check ownership
        if (!this._isSongOwned(albumId, trackIdx)) return;

        await this._initAudio();

        // Stop current
        this._stopPlayback();

        this._currentTrack = {
            albumId: albumId,
            idx: trackIdx,
            title: track.title,
            file: track.file,
            folder: album.folder
        };

        // Build queue from album (remaining tracks after this one)
        this._queue = [];
        var foundCurrent = false;
        for (var i = 0; i < album.tracks.length; i++) {
            var t = album.tracks[i];
            if (t.idx === trackIdx) { foundCurrent = true; continue; }
            if (foundCurrent && this._isSongOwned(albumId, t.idx)) {
                this._queue.push({ albumId: albumId, idx: t.idx, title: t.title, file: t.file, folder: album.folder });
            }
        }

        await this._loadAndPlay();
    }

    async _playAlbum(albumId) {
        var album = this._getAlbum(albumId);
        if (!album) return;

        // Find first owned track
        for (var i = 0; i < album.tracks.length; i++) {
            if (this._isSongOwned(albumId, album.tracks[i].idx)) {
                await this._playSong(albumId, album.tracks[i].idx);
                return;
            }
        }
    }

    async _playPlaylist(playlistId) {
        var pl = this._playlists.find(function(p) { return p.id === playlistId; });
        if (!pl || pl.songs.length === 0) return;

        var first = pl.songs[0];
        var album = this._getAlbum(first.albumId);
        if (!album) return;
        var track = album.tracks.find(function(t) { return t.idx === first.trackIdx; });
        if (!track) return;

        await this._initAudio();
        this._stopPlayback();

        this._currentTrack = {
            albumId: first.albumId,
            idx: first.trackIdx,
            title: track.title,
            file: track.file,
            folder: album.folder
        };

        // Queue = rest of playlist
        this._queue = [];
        for (var i = 1; i < pl.songs.length; i++) {
            var ref = pl.songs[i];
            var a = this._getAlbum(ref.albumId);
            var t = a ? a.tracks.find(function(tr) { return tr.idx === ref.trackIdx; }) : null;
            if (t && this._isSongOwned(ref.albumId, ref.trackIdx)) {
                this._queue.push({ albumId: ref.albumId, idx: ref.trackIdx, title: t.title, file: t.file, folder: a.folder });
            }
        }

        await this._loadAndPlay();
    }

    async _loadAndPlay() {
        if (!this._currentTrack) return;

        var path = 'assets/music/' + this._currentTrack.folder + '/' + this._currentTrack.file;

        // Reset per-channel instrument assignments for new track
        this._channelPrograms = {};

        try {
            // Load MIDI file
            var response = await fetch(path);
            if (!response.ok) throw new Error('HTTP ' + response.status);
            var arrayBuffer = await response.arrayBuffer();

            // Create MidiPlayer
            if (this._midiPlayer) {
                this._midiPlayer.stop();
            }

            var self = this;
            this._midiPlayer = new MidiPlayer.Player(function(event) {
                self._onMidiEvent(event);
            });

            this._midiPlayer.on('endOfFile', function() {
                self._onTrackEnd();
            });

            this._midiPlayer.loadArrayBuffer(arrayBuffer);
            this._duration = this._midiPlayer.getSongTime();
            this._currentTime = 0;
            this._midiPlayer.play();
            this._isPlaying = true;

            // Start progress update interval
            this._startProgressUpdates();

            this._render();
        } catch (e) {
            console.error('SnakeTunes: Failed to load MIDI file', path, e);
            this._isPlaying = false;
            this._render();
        }
    }

    _onMidiEvent(event) {
        // Handle Program Change: tells us which instrument a channel should use
        if (event.name === 'Program Change') {
            var ch = event.channel || 1;
            var program = event.value || 0;
            this._channelPrograms[ch] = program;

            // Start loading this instrument in the background (non-blocking)
            if (!this._instruments[program]) {
                this._loadInstrument(program);
            }
            return;
        }

        // Skip channel 10 (drums/percussion) — GM percussion needs special handling
        var ch = event.channel || 1;
        if (ch === 10) return;

        // Look up which instrument this channel should use
        var program = this._channelPrograms[ch];
        var instrument = (program !== undefined && this._instruments[program])
            ? this._instruments[program]
            : this._instruments[0]; // fallback to piano

        if (!instrument) return;

        var noteKey = ch + '_' + event.noteNumber;

        if (event.name === 'Note on' && event.velocity > 0) {
            try {
                var node = instrument.play(event.noteNumber, this._audioCtx.currentTime, {
                    gain: event.velocity / 127,
                    duration: 2
                });
                if (!this._activeNotes[noteKey]) {
                    this._activeNotes[noteKey] = [];
                }
                this._activeNotes[noteKey].push(node);
            } catch (e) { /* ignore playback errors */ }
        } else if (event.name === 'Note off' || (event.name === 'Note on' && event.velocity === 0)) {
            if (this._activeNotes[noteKey]) {
                var nodes = this._activeNotes[noteKey];
                for (var i = 0; i < nodes.length; i++) {
                    try { nodes[i].stop(); } catch (e) {}
                }
                delete this._activeNotes[noteKey];
            }
        }
    }

    _onTrackEnd() {
        this._isPlaying = false;
        this._stopAllNotes();

        // Auto-advance to next in queue
        if (this._queue.length > 0) {
            var next = this._queue.shift();
            this._currentTrack = next;
            this._loadAndPlay();
        } else {
            this._currentTime = 0;
            this._render();
        }
    }

    _togglePlay() {
        if (!this._midiPlayer || !this._currentTrack) return;

        if (this._isPlaying) {
            this._midiPlayer.pause();
            this._isPlaying = false;
            this._stopAllNotes();
            this._stopProgressUpdates();
        } else {
            if (this._audioCtx && this._audioCtx.state === 'suspended') {
                this._audioCtx.resume();
            }
            this._midiPlayer.play();
            this._isPlaying = true;
            this._startProgressUpdates();
        }
        this._render();
    }

    _nextTrack() {
        if (this._queue.length > 0) {
            this._stopPlayback();
            var next = this._queue.shift();
            this._currentTrack = next;
            this._loadAndPlay();
        }
    }

    _prevTrack() {
        // Restart current track
        if (this._midiPlayer && this._currentTrack) {
            this._stopPlayback();
            this._loadAndPlay();
        }
    }

    _stopPlayback() {
        if (this._midiPlayer) {
            try { this._midiPlayer.stop(); } catch (e) {}
        }
        this._isPlaying = false;
        this._stopAllNotes();
        this._stopProgressUpdates();
        this._currentTime = 0;
    }

    _stopAllNotes() {
        for (var note in this._activeNotes) {
            var nodes = this._activeNotes[note];
            for (var i = 0; i < nodes.length; i++) {
                try { nodes[i].stop(); } catch (e) {}
            }
        }
        this._activeNotes = {};
    }

    _applyVolume() {
        if (this._gainNode) {
            this._gainNode.gain.value = this._volume;
        }
    }

    _handleSeek(e, bar) {
        var rect = bar.getBoundingClientRect();
        var pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        if (this._midiPlayer && this._duration > 0) {
            var seekTo = pct * this._duration;
            this._stopAllNotes();
            this._midiPlayer.skipToSeconds(seekTo);
            this._currentTime = seekTo;
            this._updateProgressUI();
        }
    }

    _handleVolume(e, bar) {
        var rect = bar.getBoundingClientRect();
        var pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        this._volume = pct;
        this._applyVolume();
        var volFill = document.getElementById(this._windowId + '-vol');
        if (volFill) volFill.style.width = (pct * 100) + '%';
    }

    _startProgressUpdates() {
        this._stopProgressUpdates();
        var self = this;
        this._progressInterval = setInterval(function() {
            if (self._midiPlayer && self._isPlaying) {
                self._currentTime = self._midiPlayer.getSongTime() - self._midiPlayer.getSongTimeRemaining();
                self._updateProgressUI();
            }
        }, 500);
    }

    _stopProgressUpdates() {
        if (this._progressInterval) {
            clearInterval(this._progressInterval);
            this._progressInterval = null;
        }
    }

    _updateProgressUI() {
        var fill = document.getElementById(this._windowId + '-progress');
        var curEl = document.getElementById(this._windowId + '-time-cur');
        var durEl = document.getElementById(this._windowId + '-time-dur');
        if (fill) fill.style.width = this._progressPercent() + '%';
        if (curEl) curEl.textContent = this._formatTime(this._currentTime);
        if (durEl) durEl.textContent = this._formatTime(this._duration);
    }

    _progressPercent() {
        if (!this._duration || this._duration <= 0) return 0;
        return Math.min(100, (this._currentTime / this._duration) * 100);
    }

    _formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        var m = Math.floor(seconds / 60);
        var s = Math.floor(seconds % 60);
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    // =========================================================
    //  PURCHASE FLOW
    // =========================================================
    async _buySong(albumId, trackIdx) {
        if (this._isSongOwned(albumId, trackIdx)) return;

        var album = this._getAlbum(albumId);
        var track = album ? album.tracks.find(function(t) { return t.idx === trackIdx; }) : null;
        if (!album || !track) return;

        var price = SNAKETUNES_SONG_PRICE;
        var snakePrice = price * 2;
        var productName = track.title + ' - ' + album.title;
        var self = this;

        // Set up payment listener
        var handler = function(e) {
            if (e.detail && e.detail.productName === productName) {
                document.removeEventListener('elxa-payment-complete', handler);

                // Add to inventory
                try {
                    elxaOS.inventoryService.addItems(albumId + '_' + trackIdx, {
                        name: track.title,
                        subcategory: 'music',
                        unitPrice: price,
                        metadata: {
                            albumId: albumId,
                            trackIdx: trackIdx,
                            title: track.title,
                            file: track.file
                        }
                    }, 1);
                } catch (err) {
                    console.warn('SnakeTunes: Could not add song to inventory', err);
                }

                self._showToast('Purchased: ' + track.title, 'success');
                self._renderMain();
            }
        };
        document.addEventListener('elxa-payment-complete', handler);

        // Open payment dialog
        purchaseProduct({
            name: productName,
            price: '\u00A7' + snakePrice.toFixed(2),
            description: 'Song from ' + album.title
        });
    }

    async _buyAlbum(albumId) {
        var album = this._getAlbum(albumId);
        if (!album) return;
        if (this._isAlbumFullyOwned(albumId)) return;

        var adjustedPrice = this._getAlbumAdjustedPrice(albumId);
        if (adjustedPrice <= 0) {
            this._showToast('You already own all songs!', 'success');
            return;
        }

        var snakePrice = adjustedPrice * 2;
        var productName = album.title + ' (Album)';
        var self = this;

        // Set up payment listener
        var handler = function(e) {
            if (e.detail && e.detail.productName === productName) {
                document.removeEventListener('elxa-payment-complete', handler);

                // Add all unowned tracks
                var ownedSet = {};
                var ownedForAlbum = self._getOwnedSongsForAlbum(albumId);
                for (var o = 0; o < ownedForAlbum.length; o++) {
                    ownedSet[ownedForAlbum[o].metadata.trackIdx] = true;
                }

                for (var i = 0; i < album.tracks.length; i++) {
                    var track = album.tracks[i];
                    if (ownedSet[track.idx]) continue;

                    try {
                        elxaOS.inventoryService.addItems(albumId + '_' + track.idx, {
                            name: track.title,
                            subcategory: 'music',
                            unitPrice: SNAKETUNES_SONG_PRICE,
                            metadata: {
                                albumId: albumId,
                                trackIdx: track.idx,
                                title: track.title,
                                file: track.file
                            }
                        }, 1);
                    } catch (err) {
                        console.warn('SnakeTunes: Could not add track to inventory', err);
                    }
                }

                self._showToast('Album purchased: ' + album.title, 'success');
                self._renderMain();
            }
        };
        document.addEventListener('elxa-payment-complete', handler);

        // Open payment dialog
        purchaseProduct({
            name: productName,
            price: '\u00A7' + snakePrice.toFixed(2),
            description: album.tracks.length + ' tracks'
        });
    }

    // =========================================================
    //  PLAYLIST MANAGEMENT
    // =========================================================
    _createPlaylist() {
        var name = prompt('Playlist name:');
        if (!name || !name.trim()) return;
        var pl = {
            id: 'pl_' + Date.now(),
            name: name.trim(),
            created: new Date().toISOString(),
            songs: []
        };
        this._playlists.push(pl);
        this._saveUserData();
        this._view = 'playlist';
        this._detailPlaylistId = pl.id;
        this._render();
    }

    _deletePlaylist(id) {
        if (!confirm('Delete this playlist?')) return;
        this._playlists = this._playlists.filter(function(p) { return p.id !== id; });
        this._saveUserData();
        this._view = 'library';
        this._render();
    }

    _removeFromPlaylist(playlistId, index) {
        var pl = this._playlists.find(function(p) { return p.id === playlistId; });
        if (!pl) return;
        pl.songs.splice(index, 1);
        this._saveUserData();
        this._renderMain();
    }

    _addAlbumToPlaylistPrompt(albumId) {
        if (this._playlists.length === 0) {
            this._showToast('Create a playlist first!', 'error');
            return;
        }

        // Simple: add all owned songs from this album to first playlist
        // TODO: show playlist picker dialog
        var pl = this._playlists[0];
        var ownedSongs = this._getOwnedSongsForAlbum(albumId);
        var added = 0;
        for (var i = 0; i < ownedSongs.length; i++) {
            var s = ownedSongs[i];
            // Avoid duplicates
            var exists = pl.songs.some(function(x) {
                return x.albumId === s.metadata.albumId && x.trackIdx === s.metadata.trackIdx;
            });
            if (!exists) {
                pl.songs.push({ albumId: s.metadata.albumId, trackIdx: s.metadata.trackIdx });
                added++;
            }
        }
        this._saveUserData();
        this._showToast('Added ' + added + ' songs to ' + pl.name, 'success');
    }

    // =========================================================
    //  TOAST HELPER
    // =========================================================
    _showToast(message, type) {
        if (typeof elxaOS !== 'undefined' && elxaOS.notificationService) {
            elxaOS.notificationService.addNotification({
                title: 'SnakeTunes',
                body: message,
                icon: 'mdi-music',
                category: 'app',
                urgency: type === 'error' ? 'warning' : 'info',
                toast: true
            });
        }
    }

    // =========================================================
    //  CLEANUP
    // =========================================================
    _onClose() {
        this._stopPlayback();
        if (this._audioCtx) {
            try { this._audioCtx.close(); } catch (e) {}
            this._audioCtx = null;
        }
        this._instruments = {};
        this._channelPrograms = {};
        this._loadingPrograms = {};
    }

    // =========================================================
    //  HTML ESCAPE
    // =========================================================
    _escHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}
