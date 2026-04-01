// =======================================
// SSSTEAM INSTALLER — Themed Install/Uninstall Dialogs
// Handles game installation directly via installerService
// =======================================
window.SssteamInstaller = {

    // ===== MDI ICON HELPER =====
    _mdi: function(iconClass) {
        return '<span class="mdi ' + iconClass + ' elxa-icon-ui"></span>';
    },

    // ===== GAME-SPECIFIC INSTALL STEPS =====
    _installSteps: {
        snake_game: [
            { text: 'Hatching snake eggs...', mdi: 'mdi-egg-easter' },
            { text: 'Teaching snake to slither...', mdi: 'mdi-sine-wave' },
            { text: 'Scattering delicious food pellets...', mdi: 'mdi-food-apple' },
            { text: 'Calibrating growth hormones...', mdi: 'mdi-ruler' },
            { text: 'Building the arena walls...', mdi: 'mdi-wall' },
            { text: 'Polishing high score table...', mdi: 'mdi-trophy' }
        ],
        target_game: [
            { text: 'Sharpening your aim...', mdi: 'mdi-target' },
            { text: 'Scattering targets across the field...', mdi: 'mdi-flare' },
            { text: 'Winding the countdown clock...', mdi: 'mdi-timer-outline' },
            { text: 'Loading satisfying click sounds...', mdi: 'mdi-volume-high' },
            { text: 'Setting difficulty curve...', mdi: 'mdi-chart-line' }
        ],
        mail_room_mayhem: [
            { text: 'Sorting incoming mail...', mdi: 'mdi-email-multiple' },
            { text: 'Setting up department bins...', mdi: 'mdi-folder-multiple' },
            { text: 'Locating Pushing Cat...', mdi: 'mdi-cat' },
            { text: 'Stacking unread memos...', mdi: 'mdi-note-multiple' },
            { text: 'Training keyboard reflexes...', mdi: 'mdi-keyboard' },
            { text: 'Warning: cat detected near mail room...', mdi: 'mdi-alert' }
        ],
        sussy_cat_game: [
            { text: 'Hiding in the Sussy Lair...', mdi: 'mdi-eye-off' },
            { text: 'Plotting devious plans...', mdi: 'mdi-clipboard-list' },
            { text: 'Concealing stolen items...', mdi: 'mdi-package-variant-closed' },
            { text: 'Calibrating sus-detector...', mdi: 'mdi-radar' },
            { text: 'Scoping out all four rooms...', mdi: 'mdi-home-search' },
            { text: 'Pushing Cat is ready for mischief...', mdi: 'mdi-cat' }
        ],
        snake_deluxe: [
            { text: 'Pressing CEO Snake-E\'s suit...', mdi: 'mdi-hanger' },
            { text: 'Polishing the boardroom table...', mdi: 'mdi-auto-fix' },
            { text: 'Inflating corporate jargon database...', mdi: 'mdi-chart-bar' },
            { text: 'Scheduling executive lunch meetings...', mdi: 'mdi-silverware-fork-knife' },
            { text: 'Loading premium snake physics...', mdi: 'mdi-office-building' },
            { text: 'Filing expense report for game...', mdi: 'mdi-receipt' }
        ],
        chess: [
            { text: 'Carving the chess pieces...', mdi: 'mdi-chess-pawn' },
            { text: 'Polishing the crown jewels...', mdi: 'mdi-crown' },
            { text: 'Teaching AI to overthink moves...', mdi: 'mdi-head-cog' },
            { text: 'Painting the board squares...', mdi: 'mdi-palette' },
            { text: 'Loading opening book strategies...', mdi: 'mdi-book-open-variant' },
            { text: 'Positioning the pawns...', mdi: 'mdi-chess-king' }
        ],
        _default: [
            { text: 'Unpacking game files...', mdi: 'mdi-package-down' },
            { text: 'Loading textures and sprites...', mdi: 'mdi-image' },
            { text: 'Compiling game shaders...', mdi: 'mdi-cog' },
            { text: 'Optimizing for your system...', mdi: 'mdi-wrench' },
            { text: 'Registering with ElxaOS...', mdi: 'mdi-clipboard-check' },
            { text: 'Creating desktop shortcut...', mdi: 'mdi-monitor' }
        ]
    },

    _uninstallSteps: [
        { text: 'Saving your high scores...', mdi: 'mdi-content-save' },
        { text: 'Removing game files...', mdi: 'mdi-delete' },
        { text: 'Cleaning up registry...', mdi: 'mdi-broom' },
        { text: 'Removing desktop shortcut...', mdi: 'mdi-link-off' },
        { text: 'Freeing disk space...', mdi: 'mdi-harddisk' }
    ],

    _getSteps: function(gameType) {
        return this._installSteps[gameType] || this._installSteps._default;
    },

    // ===== INSTALL =====

    install: function(game) {
        // Check if already installed
        if (SssteamStore.isInstalled(game.id)) {
            ElxaUI.showMessage(game.name + ' is already installed!', 'info');
            return;
        }

        this._showInstallDialog(game);
    },

    _showInstallDialog: function(game) {
        var self = this;
        var gameType = game.installerData.gameData.type;
        var fakeSize = (Math.random() * 40 + 10).toFixed(1);
        var iconDisplay = game.iconEmoji || game.icon;
        // Strip img tags for the dialog icon — use MDI fallback
        if (iconDisplay.indexOf('<img') !== -1) {
            iconDisplay = game.iconEmoji || this._mdi('mdi-gamepad-variant');
        }

        var overlay = document.createElement('div');
        overlay.className = 'sst-inst-overlay';
        overlay.innerHTML =
            '<div class="sst-inst-dialog">' +
                // Header
                '<div class="sst-inst-header">' +
                    '<div class="sst-inst-header-icon">' + this._mdi('mdi-package-down') + '</div>' +
                    '<div class="sst-inst-header-text">SSSTEAM INSTALLER</div>' +
                    '<button class="sst-inst-close" id="sstInstClose">&times;</button>' +
                '</div>' +
                // Body — Info screen
                '<div class="sst-inst-body" id="sstInstBody">' +
                    '<div class="sst-inst-info">' +
                        '<div class="sst-inst-game-icon">' + iconDisplay + '</div>' +
                        '<div class="sst-inst-game-details">' +
                            '<div class="sst-inst-game-name">' + game.name + '</div>' +
                            '<div class="sst-inst-game-meta">' +
                                '<span>v' + game.installerData.version + '</span>' +
                                '<span>' + game.installerData.author + '</span>' +
                                '<span>' + fakeSize + ' MB</span>' +
                            '</div>' +
                            '<div class="sst-inst-game-desc">' + game.installerData.description + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="sst-inst-actions">' +
                        '<button class="sst-inst-btn sst-inst-btn-go" id="sstInstGo">' + this._mdi('mdi-download') + ' Install Now</button>' +
                        '<button class="sst-inst-btn sst-inst-btn-cancel" id="sstInstCancel">Cancel</button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        // Force reflow then animate in
        overlay.offsetHeight;
        overlay.classList.add('sst-inst-visible');

        // Event handlers
        var close = function() {
            overlay.classList.remove('sst-inst-visible');
            setTimeout(function() { overlay.remove(); }, 300);
        };

        overlay.querySelector('#sstInstClose').addEventListener('click', close);
        overlay.querySelector('#sstInstCancel').addEventListener('click', close);
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) close();
        });

        overlay.querySelector('#sstInstGo').addEventListener('click', function() {
            self._runInstall(overlay, game);
        });
    },

    _runInstall: function(overlay, game) {
        var self = this;
        var gameType = game.installerData.gameData.type;
        var steps = this._getSteps(gameType);
        var body = overlay.querySelector('#sstInstBody');

        // Build progress UI
        body.innerHTML =
            '<div class="sst-inst-progress">' +
                '<div class="sst-inst-progress-title">Installing ' + game.name + '...</div>' +
                '<div class="sst-inst-bar-track">' +
                    '<div class="sst-inst-bar-fill" id="sstInstFill"></div>' +
                '</div>' +
                '<div class="sst-inst-bar-pct" id="sstInstPct">0%</div>' +
                '<div class="sst-inst-step" id="sstInstStep">' +
                    '<span class="sst-inst-step-icon">' + this._mdi(steps[0].mdi) + '</span> ' +
                    '<span class="sst-inst-step-text">' + steps[0].text + '</span>' +
                '</div>' +
            '</div>';

        var fill = overlay.querySelector('#sstInstFill');
        var pct = overlay.querySelector('#sstInstPct');
        var stepIcon = overlay.querySelector('.sst-inst-step-icon');
        var stepText = overlay.querySelector('.sst-inst-step-text');
        var currentStep = 0;

        var advanceStep = function() {
            if (currentStep >= steps.length) {
                // Done — do the actual install
                self._doInstall(overlay, game);
                return;
            }

            var progress = ((currentStep + 1) / steps.length) * 100;
            fill.style.width = progress + '%';
            pct.textContent = Math.round(progress) + '%';
            stepIcon.innerHTML = self._mdi(steps[currentStep].mdi);
            stepText.textContent = steps[currentStep].text;

            currentStep++;
            var delay = 600 + Math.random() * 800;
            setTimeout(advanceStep, delay);
        };

        // Start after a beat
        setTimeout(advanceStep, 400);
    },

    _doInstall: function(overlay, game) {
        var self = this;
        var success = false;

        // Call installerService.installProgram directly
        if (typeof elxaOS !== 'undefined' && elxaOS.installerService) {
            try {
                // installProgram is async but we can fire-and-forget
                elxaOS.installerService.installProgram(game.installerData).then(function(result) {
                    if (result) {
                        console.log('[Sssteam] Game installed via installerService:', game.name);
                    }
                });
                success = true;
            } catch (e) {
                console.error('[Sssteam] Install error:', e);
            }
        }

        if (success) {
            this._showInstallSuccess(overlay, game);
        } else {
            this._showInstallError(overlay, game);
        }
    },

    _showInstallSuccess: function(overlay, game) {
        var iconDisplay = game.iconEmoji || game.icon;
        if (iconDisplay.indexOf('<img') !== -1) {
            iconDisplay = game.iconEmoji || this._mdi('mdi-gamepad-variant');
        }

        var body = overlay.querySelector('#sstInstBody');
        body.innerHTML =
            '<div class="sst-inst-success">' +
                '<div class="sst-inst-success-burst">' +
                    '<div class="sst-inst-success-icon">' + this._mdi('mdi-check-circle') + '</div>' +
                '</div>' +
                '<div class="sst-inst-success-title">Installation Complete!</div>' +
                '<div class="sst-inst-success-game">' +
                    '<span class="sst-inst-success-game-icon">' + iconDisplay + '</span> ' +
                    game.name +
                '</div>' +
                '<div class="sst-inst-success-msg">' +
                    'You can find <strong>' + game.name + '</strong> on your Desktop.' +
                '</div>' +
                '<div class="sst-inst-success-tip">' + this._mdi('mdi-lightbulb-on-outline') + ' Double-click the desktop shortcut to play!</div>' +
                '<div class="sst-inst-actions">' +
                    '<button class="sst-inst-btn sst-inst-btn-go" id="sstInstDone">' + this._mdi('mdi-gamepad-variant') + ' Awesome!</button>' +
                '</div>' +
            '</div>';

        // Refresh Sssteam views
        if (typeof SssteamStore !== 'undefined') {
            SssteamStore.renderWallet();
            // Small delay so installerService Map is updated
            setTimeout(function() {
                if (SssteamStore.currentView === 'library') {
                    SssteamStore.renderLibrary();
                }
            }, 300);
        }

        var close = function() {
            overlay.classList.remove('sst-inst-visible');
            setTimeout(function() { overlay.remove(); }, 300);
            // Refresh detail view if visible
            if (typeof SssteamStore !== 'undefined' && SssteamStore._currentDetailId) {
                SssteamStore.renderDetail(SssteamStore._currentDetailId);
            }
        };

        overlay.querySelector('#sstInstDone').addEventListener('click', close);
        overlay.querySelector('.sst-inst-close').addEventListener('click', close);

        // Auto-close after 15s
        setTimeout(close, 15000);
    },

    _showInstallError: function(overlay, game) {
        var body = overlay.querySelector('#sstInstBody');
        body.innerHTML =
            '<div class="sst-inst-error">' +
                '<div class="sst-inst-error-icon">' + this._mdi('mdi-close-circle') + '</div>' +
                '<div class="sst-inst-error-title">Installation Failed</div>' +
                '<div class="sst-inst-error-msg">' +
                    'Could not install ' + game.name + '. The installer service may not be available.' +
                '</div>' +
                '<div class="sst-inst-actions">' +
                    '<button class="sst-inst-btn sst-inst-btn-cancel" id="sstInstErrClose">Close</button>' +
                '</div>' +
            '</div>';

        var close = function() {
            overlay.classList.remove('sst-inst-visible');
            setTimeout(function() { overlay.remove(); }, 300);
        };
        overlay.querySelector('#sstInstErrClose').addEventListener('click', close);
        overlay.querySelector('.sst-inst-close').addEventListener('click', close);
    },

    // ===== UNINSTALL =====

    uninstall: function(game) {
        if (!SssteamStore.isInstalled(game.id)) {
            ElxaUI.showMessage(game.name + ' is not installed.', 'info');
            return;
        }
        this._showUninstallDialog(game);
    },

    _showUninstallDialog: function(game) {
        var self = this;
        var iconDisplay = game.iconEmoji || game.icon;
        if (iconDisplay.indexOf('<img') !== -1) {
            iconDisplay = game.iconEmoji || this._mdi('mdi-gamepad-variant');
        }

        var overlay = document.createElement('div');
        overlay.className = 'sst-inst-overlay';
        overlay.innerHTML =
            '<div class="sst-inst-dialog sst-inst-dialog-sm">' +
                '<div class="sst-inst-header sst-inst-header-danger">' +
                    '<div class="sst-inst-header-icon">' + this._mdi('mdi-delete') + '</div>' +
                    '<div class="sst-inst-header-text">UNINSTALL</div>' +
                    '<button class="sst-inst-close" id="sstUninstClose">&times;</button>' +
                '</div>' +
                '<div class="sst-inst-body" id="sstUninstBody">' +
                    '<div class="sst-inst-uninstall-confirm">' +
                        '<div class="sst-inst-uninstall-icon">' + iconDisplay + '</div>' +
                        '<div class="sst-inst-uninstall-msg">' +
                            'Are you sure you want to uninstall <strong>' + game.name + '</strong>?' +
                        '</div>' +
                        '<div class="sst-inst-uninstall-note">' +
                            'Your save data and high scores will be preserved.' +
                        '</div>' +
                    '</div>' +
                    '<div class="sst-inst-actions">' +
                        '<button class="sst-inst-btn sst-inst-btn-danger" id="sstUninstGo">' + this._mdi('mdi-delete') + ' Uninstall</button>' +
                        '<button class="sst-inst-btn sst-inst-btn-cancel" id="sstUninstCancel">Keep Game</button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);
        overlay.offsetHeight;
        overlay.classList.add('sst-inst-visible');

        var close = function() {
            overlay.classList.remove('sst-inst-visible');
            setTimeout(function() { overlay.remove(); }, 300);
        };

        overlay.querySelector('#sstUninstClose').addEventListener('click', close);
        overlay.querySelector('#sstUninstCancel').addEventListener('click', close);

        overlay.querySelector('#sstUninstGo').addEventListener('click', function() {
            self._runUninstall(overlay, game);
        });
    },

    _runUninstall: function(overlay, game) {
        var self = this;
        var steps = this._uninstallSteps;
        var body = overlay.querySelector('#sstUninstBody');

        body.innerHTML =
            '<div class="sst-inst-progress">' +
                '<div class="sst-inst-progress-title">Uninstalling ' + game.name + '...</div>' +
                '<div class="sst-inst-bar-track">' +
                    '<div class="sst-inst-bar-fill sst-inst-bar-fill-danger" id="sstUninstFill"></div>' +
                '</div>' +
                '<div class="sst-inst-bar-pct" id="sstUninstPct">0%</div>' +
                '<div class="sst-inst-step" id="sstUninstStep">' +
                    '<span class="sst-inst-step-icon">' + this._mdi(steps[0].mdi) + '</span> ' +
                    '<span class="sst-inst-step-text">' + steps[0].text + '</span>' +
                '</div>' +
            '</div>';

        var fill = overlay.querySelector('#sstUninstFill');
        var pct = overlay.querySelector('#sstUninstPct');
        var stepIcon = overlay.querySelector('.sst-inst-step-icon');
        var stepText = overlay.querySelector('.sst-inst-step-text');
        var currentStep = 0;

        var advanceStep = function() {
            if (currentStep >= steps.length) {
                self._doUninstall(overlay, game);
                return;
            }

            var progress = ((currentStep + 1) / steps.length) * 100;
            fill.style.width = progress + '%';
            pct.textContent = Math.round(progress) + '%';
            stepIcon.innerHTML = self._mdi(steps[currentStep].mdi);
            stepText.textContent = steps[currentStep].text;

            currentStep++;
            setTimeout(advanceStep, 500 + Math.random() * 500);
        };

        setTimeout(advanceStep, 300);
    },

    _doUninstall: function(overlay, game) {
        var self = this;
        var success = false;

        if (typeof elxaOS !== 'undefined' && elxaOS.installerService) {
            try {
                var gameType = game.installerData.gameData.type;
                var programId = null;
                var programInfo = null;

                // Find the installed program by gameData.type
                for (var entry of elxaOS.installerService.installedPrograms) {
                    if (entry[1].gameData && entry[1].gameData.type === gameType) {
                        programId = entry[0];
                        programInfo = entry[1];
                        break;
                    }
                }

                if (programId && programInfo) {
                    // Remove from Map
                    elxaOS.installerService.installedPrograms.delete(programId);
                    // Save to registry
                    elxaOS.installerService.saveInstalledPrograms();

                    // Remove .lnk shortcut from Desktop
                    if (elxaOS.fileSystem) {
                        var desktopFiles = elxaOS.fileSystem.listContents(['root', 'Desktop']);
                        for (var i = 0; i < desktopFiles.length; i++) {
                            var file = desktopFiles[i];
                            if (file.name && file.name.endsWith('.lnk')) {
                                try {
                                    var shortcutData = JSON.parse(file.content);
                                    if (shortcutData.programId === programId) {
                                        elxaOS.fileSystem.deleteItem(['root', 'Desktop'], file.name);
                                        break;
                                    }
                                } catch (e) { /* skip */ }
                            }
                        }
                    }

                    // Unregister from OS
                    if (elxaOS.installedPrograms) {
                        delete elxaOS.installedPrograms[programId];
                    }

                    // Refresh desktop
                    elxaOS.eventBus.emit('desktop.changed');
                    success = true;
                    console.log('[Sssteam] Uninstalled:', game.name);
                }
            } catch (e) {
                console.error('[Sssteam] Uninstall error:', e);
            }
        }

        if (success) {
            this._showUninstallSuccess(overlay, game);
        } else {
            var body = overlay.querySelector('#sstUninstBody');
            body.innerHTML =
                '<div class="sst-inst-error">' +
                    '<div class="sst-inst-error-icon">' + this._mdi('mdi-close-circle') + '</div>' +
                    '<div class="sst-inst-error-title">Uninstall Failed</div>' +
                    '<div class="sst-inst-error-msg">Could not find the installed program.</div>' +
                    '<div class="sst-inst-actions">' +
                        '<button class="sst-inst-btn sst-inst-btn-cancel" id="sstUninstErrClose">Close</button>' +
                    '</div>' +
                '</div>';
            overlay.querySelector('#sstUninstErrClose').addEventListener('click', function() {
                overlay.classList.remove('sst-inst-visible');
                setTimeout(function() { overlay.remove(); }, 300);
            });
        }
    },

    _showUninstallSuccess: function(overlay, game) {
        var body = overlay.querySelector('#sstUninstBody');
        body.innerHTML =
            '<div class="sst-inst-success">' +
                '<div class="sst-inst-success-burst">' +
                    '<div class="sst-inst-success-icon" style="font-size:40px;">' + this._mdi('mdi-check-circle') + '</div>' +
                '</div>' +
                '<div class="sst-inst-success-title">Game Removed</div>' +
                '<div class="sst-inst-success-msg">' +
                    '<strong>' + game.name + '</strong> has been uninstalled.' +
                '</div>' +
                '<div class="sst-inst-success-tip">' + this._mdi('mdi-information-outline') + ' You can always reinstall it from the Store!</div>' +
                '<div class="sst-inst-actions">' +
                    '<button class="sst-inst-btn sst-inst-btn-cancel" id="sstUninstDone">Got it</button>' +
                '</div>' +
            '</div>';

        // Refresh Sssteam views
        if (typeof SssteamStore !== 'undefined') {
            setTimeout(function() {
                if (SssteamStore.currentView === 'library') {
                    SssteamStore.renderLibrary();
                }
                if (SssteamStore._currentDetailId) {
                    SssteamStore.renderDetail(SssteamStore._currentDetailId);
                }
            }, 200);
        }

        var close = function() {
            overlay.classList.remove('sst-inst-visible');
            setTimeout(function() { overlay.remove(); }, 300);
        };
        overlay.querySelector('#sstUninstDone').addEventListener('click', close);
        overlay.querySelector('.sst-inst-close').addEventListener('click', close);

        setTimeout(close, 10000);
    }
};
