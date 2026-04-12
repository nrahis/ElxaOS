/* ============================================
   SNAKESIAN CARD EXCHANGE — The Arena
   ============================================
   Turn-based card battle engine.
   Requires: card-catalog.js, card-template.js,
             card-battle-data.js (opponent data)
   ============================================ */

(function() {
  'use strict';

  var IMAGE_PATH = 'assets/interwebs/snakesian-cards/images/';

  // ==========================================
  // SERVICE HELPERS (mirror card-shop patterns)
  // ==========================================

  function isInventoryAvailable() {
    return typeof elxaOS !== 'undefined' && elxaOS.inventoryService && elxaOS.inventoryService._ready;
  }

  function isFinanceReady() {
    return typeof elxaOS !== 'undefined' && elxaOS.financeService && elxaOS.financeService.isReady();
  }

  function loadCollection() {
    if (isInventoryAvailable()) {
      var cards = elxaOS.inventoryService.getItems('cards');
      var collection = {};
      cards.forEach(function(c) {
        if (c.cardId) collection[c.cardId] = c.quantity || 1;
      });
      return collection;
    }
    try {
      var data = localStorage.getItem('elxaOS-card-collection');
      return data ? JSON.parse(data) : {};
    } catch (e) { return {}; }
  }

  function getCardById(id) {
    for (var i = 0; i < CARD_CATALOG.length; i++) {
      if (CARD_CATALOG[i].id === id) return CARD_CATALOG[i];
    }
    return null;
  }

  // Add a card to the player's collection
  async function addCardToCollection(cardId) {
    if (!isInventoryAvailable()) {
      // localStorage fallback
      try {
        var key = 'elxaOS-card-collection';
        var data = localStorage.getItem(key);
        var col = data ? JSON.parse(data) : {};
        col[cardId] = (col[cardId] || 0) + 1;
        localStorage.setItem(key, JSON.stringify(col));
      } catch (e) {}
      return;
    }
    var existing = elxaOS.inventoryService.getItems('cards');
    var entry = null;
    for (var i = 0; i < existing.length; i++) {
      if (existing[i].cardId === cardId) { entry = existing[i]; break; }
    }
    if (entry) {
      await elxaOS.inventoryService.updateItem('cards', entry.id, { quantity: (entry.quantity || 1) + 1 });
    } else {
      var card = getCardById(cardId);
      await elxaOS.inventoryService.addItem('cards', {
        cardId: cardId,
        name: card ? card.name : cardId,
        rarity: card ? card.rarity : 'common',
        quantity: 1,
        acquiredFrom: 'arena-ante',
        acquiredDate: new Date().toISOString().split('T')[0]
      });
    }
  }

  // Remove one copy of a card from the player's collection
  async function removeCardFromCollection(cardId) {
    if (!isInventoryAvailable()) {
      try {
        var key = 'elxaOS-card-collection';
        var data = localStorage.getItem(key);
        var col = data ? JSON.parse(data) : {};
        if (col[cardId] && col[cardId] > 1) {
          col[cardId]--;
        } else {
          delete col[cardId];
        }
        localStorage.setItem(key, JSON.stringify(col));
      } catch (e) {}
      return;
    }
    var existing = elxaOS.inventoryService.getItems('cards');
    for (var i = 0; i < existing.length; i++) {
      if (existing[i].cardId === cardId) {
        if ((existing[i].quantity || 1) > 1) {
          await elxaOS.inventoryService.updateItem('cards', existing[i].id, {
            quantity: existing[i].quantity - 1
          });
        } else {
          await elxaOS.inventoryService.removeItem('cards', existing[i].id);
        }
        return;
      }
    }
  }

  // Pay snakes to the player
  async function paySnakes(amount) {
    if (!isFinanceReady()) return;
    try {
      await elxaOS.financeService.addTransaction({
        type: 'income',
        category: 'entertainment',
        description: 'Arena winnings',
        amount: amount,
        account: 'checking'
      });
    } catch (e) {
      console.warn('Arena: failed to pay snakes', e);
    }
  }

  // ==========================================
  // BATTLE STATE
  // ==========================================

  var battle = null; // null when not in battle

  function createBattleState(playerTeam, playerSupport, playerAnte, opponent) {
    // Pick opponent's ante card
    var aiAnteId = opponent.antePool[Math.floor(Math.random() * opponent.antePool.length)];

    // Build fighter arrays with HP tracking
    function buildFighters(cardIds, supportCard) {
      var fighters = cardIds.map(function(id) {
        var card = getCardById(id);
        if (!card) return null;
        // Apply support stat buffs
        var bonusAtk = 0, bonusHp = 0, bonusSpd = 0;
        if (supportCard) {
          var eff = supportCard.supportEffect;
          if (eff) {
            if (eff.stat === 'atk') bonusAtk += eff.value;
            if (eff.stat === 'hp') bonusHp += eff.value;
            if (eff.stat === 'spd') bonusSpd += eff.value;
            if (eff.stat === 'all') { bonusAtk += eff.value; bonusHp += eff.value; bonusSpd += eff.value; }
            if (eff.bonusStats) {
              bonusAtk += eff.bonusStats.atk || 0;
              bonusHp += eff.bonusStats.hp || 0;
              bonusSpd += eff.bonusStats.spd || 0;
            }
          }
        }
        return {
          card: card,
          atk: card.stats.atk + bonusAtk,
          maxHp: card.stats.hp + bonusHp,
          hp: card.stats.hp + bonusHp,
          spd: card.stats.spd + bonusSpd,
          abilityUsed: false,
          ko: false
        };
      }).filter(Boolean);
      return fighters;
    }

    var playerSupportCard = playerSupport ? getCardById(playerSupport) : null;
    var aiSupportCard = opponent.deck.length > 3 ? getCardById(opponent.deck[3]) : null;
    var aiFighterIds = opponent.deck.slice(0, 3);

    return {
      player: {
        fighters: buildFighters(playerTeam, playerSupportCard),
        support: playerSupportCard,
        active: 0,
        anteCardId: playerAnte
      },
      ai: {
        fighters: buildFighters(aiFighterIds, aiSupportCard),
        support: aiSupportCard,
        active: 0,
        anteCardId: aiAnteId
      },
      opponent: opponent,
      turn: 0,
      phase: 'start', // start, playerTurn, aiTurn, animating, ko, done
      log: [],
      firstStrikePlayer: false,
      firstStrikeAi: false,
      stunPlayer: 0,
      stunAi: 0,
      aiActedFirst: false
    };
  }

  function getActive(side) {
    return battle[side].fighters[battle[side].active];
  }

  function getNextAlive(side) {
    for (var i = battle[side].active + 1; i < battle[side].fighters.length; i++) {
      if (!battle[side].fighters[i].ko) return i;
    }
    return -1;
  }

  function allKO(side) {
    return battle[side].fighters.every(function(f) { return f.ko; });
  }

  // ==========================================
  // TURN LOGIC
  // ==========================================

  function startTurn() {
    battle.turn++;
    var pActive = getActive('player');
    var aActive = getActive('ai');

    // Per-turn support heals
    applySupportHeal('player');
    applySupportHeal('ai');

    // Determine who goes first
    var playerFirst;
    if (battle.firstStrikePlayer) {
      playerFirst = true;
      battle.firstStrikePlayer = false;
    } else if (battle.firstStrikeAi) {
      playerFirst = false;
      battle.firstStrikeAi = false;
    } else if (pActive.spd > aActive.spd) {
      playerFirst = true;
    } else if (aActive.spd > pActive.spd) {
      playerFirst = false;
    } else {
      playerFirst = Math.random() < 0.5;
    }

    if (playerFirst) {
      // Check stun
      if (battle.stunPlayer > 0) {
        battle.stunPlayer--;
        addLog('Your ' + pActive.card.name + ' is stunned!');
        battle.phase = 'aiTurn';
        renderBattle();
        setTimeout(doAiTurn, 1200);
      } else {
        battle.phase = 'playerTurn';
        renderBattle();
      }
    } else {
      // AI goes first
      if (battle.stunAi > 0) {
        battle.stunAi--;
        addLog(aActive.card.name + ' is stunned!');
        if (battle.stunPlayer > 0) {
          battle.stunPlayer--;
          addLog('Your ' + pActive.card.name + ' is also stunned!');
          // Both stunned, next turn
          setTimeout(function() { startTurn(); }, 1500);
        } else {
          battle.phase = 'playerTurn';
          renderBattle();
        }
      } else {
        battle.aiActedFirst = true;
        battle.phase = 'animating';
        renderBattle();
        setTimeout(doAiTurn, 800);
      }
    }
  }

  function doPlayerAttack() {
    if (battle.phase !== 'playerTurn') return;
    battle.phase = 'animating';
    var pActive = getActive('player');
    var aActive = getActive('ai');
    var dmg = pActive.atk;
    aActive.hp -= dmg;
    addLog(pActive.card.name + ' attacks for ' + dmg + ' damage!');
    afterPlayerAction();
  }

  function doPlayerAbility() {
    if (battle.phase !== 'playerTurn') return;
    var pActive = getActive('player');
    if (pActive.abilityUsed) return;
    if (!pActive.card.ability) return;

    battle.phase = 'animating';
    pActive.abilityUsed = true;
    executeAbility(pActive, 'player');
    afterPlayerAction();
  }

  function afterPlayerAction() {
    var aActive = getActive('ai');

    // Check if AI's active card is KO'd
    if (aActive.hp <= 0) {
      aActive.hp = 0;
      aActive.ko = true;
      addLog(aActive.card.name + ' is KO\'d!');
      showDialogue('cardKO');

      if (allKO('ai')) {
        battle.phase = 'done';
        setTimeout(function() { showResult('win'); }, 1200);
        renderBattle();
        return;
      }

      // Swap in next AI card
      var next = getNextAlive('ai');
      if (next >= 0) {
        battle.ai.active = next;
        var newActive = getActive('ai');
        addLog(battle.opponent.name + ' sends in ' + newActive.card.name + '!');

        // Support: firstStrike for AI
        if (battle.ai.support && battle.ai.support.supportEffect && battle.ai.support.supportEffect.stat === 'firstStrike') {
          battle.firstStrikeAi = true;
        }
        // Support: swapHeal for AI
        applySupportSwapHeal('ai');
      }

      renderBattle();
      battle.aiActedFirst = false;
      setTimeout(function() { startTurn(); }, 1500);
      return;
    }

    renderBattle();

    // If AI already acted first this turn, player just went second — start new turn
    if (battle.aiActedFirst) {
      battle.aiActedFirst = false;
      setTimeout(function() { startTurn(); }, 1200);
    } else {
      // AI hasn't gone yet — let AI take their turn
      if (battle.stunAi > 0) {
        battle.stunAi--;
        addLog(getActive('ai').card.name + ' is stunned!');
        setTimeout(function() { startTurn(); }, 1200);
      } else {
        setTimeout(doAiTurn, 800);
      }
    }
  }

  function doAiTurn() {
    var aActive = getActive('ai');
    var pActive = getActive('player');

    // AI decision
    var useAbility = aiShouldUseAbility(aActive, pActive);

    if (useAbility) {
      aActive.abilityUsed = true;
      showDialogue('useAbility');
      executeAbility(aActive, 'ai');
    } else {
      var dmg = aActive.atk;
      pActive.hp -= dmg;
      addLog(aActive.card.name + ' attacks for ' + dmg + ' damage!');
    }

    // Check if player's active is KO'd
    if (pActive.hp <= 0) {
      pActive.hp = 0;
      pActive.ko = true;
      addLog('Your ' + pActive.card.name + ' is KO\'d!');
      showDialogue('playerCardKO');

      if (allKO('player')) {
        battle.phase = 'done';
        renderBattle();
        setTimeout(function() { showResult('lose'); }, 1200);
        return;
      }

      // Swap in next player card
      var next = getNextAlive('player');
      if (next >= 0) {
        battle.player.active = next;
        var newActive = getActive('player');
        addLog(newActive.card.name + ' steps in!');

        // Support: firstStrike for player
        if (battle.player.support && battle.player.support.supportEffect && battle.player.support.supportEffect.stat === 'firstStrike') {
          battle.firstStrikePlayer = true;
        }
        applySupportSwapHeal('player');
      }

      renderBattle();
      if (battle.aiActedFirst) {
        battle.aiActedFirst = false;
        if (battle.stunPlayer > 0) {
          battle.stunPlayer--;
          addLog('Your ' + getActive('player').card.name + ' is stunned!');
          setTimeout(function() { startTurn(); }, 1200);
        } else {
          setTimeout(function() { battle.phase = 'playerTurn'; renderBattle(); }, 1000);
        }
      } else {
        setTimeout(function() { startTurn(); }, 1500);
      }
      return;
    }

    renderBattle();
    if (battle.aiActedFirst) {
      battle.aiActedFirst = false;
      if (battle.stunPlayer > 0) {
        battle.stunPlayer--;
        addLog('Your ' + getActive('player').card.name + ' is stunned!');
        setTimeout(function() { startTurn(); }, 1200);
      } else {
        setTimeout(function() { battle.phase = 'playerTurn'; renderBattle(); }, 1000);
      }
    } else {
      setTimeout(function() { startTurn(); }, 1200);
    }
  }

  // ==========================================
  // ABILITY EXECUTION
  // ==========================================

  function executeAbility(fighter, side) {
    var ab = fighter.card.ability;
    if (!ab) return;
    var otherSide = side === 'player' ? 'ai' : 'player';
    var target = getActive(otherSide);

    addLog(fighter.card.name + ' uses ' + ab.name + '!');

    switch (ab.type) {
      case 'damage':
        target.hp -= ab.value;
        addLog('Deals ' + ab.value + ' damage!');
        break;

      case 'heal':
        fighter.hp = Math.min(fighter.maxHp, fighter.hp + ab.value);
        addLog('Heals ' + ab.value + ' HP!');
        break;

      case 'stun':
        if (side === 'player') {
          battle.stunAi += ab.value;
        } else {
          battle.stunPlayer += ab.value;
        }
        addLog(target.card.name + ' is stunned for ' + ab.value + ' turn(s)!');
        break;

      case 'swap':
        var nextIdx = getNextAlive(otherSide);
        if (nextIdx >= 0) {
          battle[otherSide].active = nextIdx;
          addLog(target.card.name + ' is forced out!');
          applySupportSwapHeal(otherSide);
        } else {
          addLog('No one to swap to!');
        }
        break;

      case 'buff':
        if (ab.buffStat === 'atk' || ab.buffStat === 'all') fighter.atk += ab.value;
        if (ab.buffStat === 'hp') {
          fighter.maxHp += ab.value;
          fighter.hp += ab.value;
        }
        if (ab.buffStat === 'spd' || ab.buffStat === 'all') fighter.spd += ab.value;
        if (ab.buffStat === 'all') {
          fighter.maxHp += ab.value;
          fighter.hp += ab.value;
        }
        if (ab.bonusSpd) fighter.spd += ab.bonusSpd;
        if (ab.bonusHp) {
          fighter.maxHp += ab.bonusHp;
          fighter.hp += ab.bonusHp;
        }
        addLog('Stats boosted!');
        break;

      case 'shield':
        fighter._shielded = (ab.value || 1);
        if (ab.bonusHeal) {
          fighter.hp = Math.min(fighter.maxHp, fighter.hp + ab.bonusHeal);
          addLog('Also heals ' + ab.bonusHeal + ' HP!');
        }
        addLog(fighter.card.name + ' is shielded!');
        break;

      case 'gamble':
        var win = Math.random() < (ab.chance || 0.5);
        if (win) {
          target.hp -= ab.value;
          addLog('Lucky! Deals ' + ab.value + ' damage!');
        } else {
          // altValue is negative for self-damage, positive for opponent heal
          if (ab.altValue < 0) {
            // Negative altValue: self damage or opponent heal
            // Convention: negative = heal opponent by that amount
            target.hp = Math.min(target.maxHp, target.hp + Math.abs(ab.altValue));
            addLog('Unlucky! Opponent heals ' + Math.abs(ab.altValue) + ' HP!');
          } else {
            fighter.hp -= ab.altValue;
            addLog('Unlucky! Takes ' + ab.altValue + ' damage!');
          }
        }
        break;

      case 'aoe':
        var count = 0;
        battle[otherSide].fighters.forEach(function(f) {
          if (!f.ko) {
            f.hp -= ab.value;
            if (f.hp <= 0) { f.hp = 0; f.ko = true; }
            count++;
          }
        });
        addLog('Hits ' + count + ' card(s) for ' + ab.value + ' each!');
        break;
    }

    // Handle shield blocking — intercept damage on the shielded fighter
    // (We apply the shield effect when taking damage elsewhere is complicated,
    //  so we handle it as a pre-check in damage application)
  }

  // Override damage for shield — we need to hook into the attack flow.
  // Wrap the attack damage to check for shields:
  var _origDoPlayerAttack = doPlayerAttack;
  doPlayerAttack = function() {
    if (battle.phase !== 'playerTurn') return;
    var aActive = getActive('ai');
    if (aActive._shielded && aActive._shielded > 0) {
      aActive._shielded--;
      battle.phase = 'animating';
      addLog(aActive.card.name + '\'s shield blocks the attack!');
      afterPlayerAction();
      return;
    }
    battle.phase = 'animating';
    var pActive = getActive('player');
    var dmg = pActive.atk;
    aActive.hp -= dmg;
    addLog(pActive.card.name + ' attacks for ' + dmg + ' damage!');
    afterPlayerAction();
  };

  // Also need to shield-check AI attacks
  var _origDoAiTurn = doAiTurn;
  doAiTurn = function() {
    var aActive = getActive('ai');
    var pActive = getActive('player');

    var useAbility = aiShouldUseAbility(aActive, pActive);

    if (useAbility) {
      aActive.abilityUsed = true;
      showDialogue('useAbility');
      executeAbility(aActive, 'ai');
    } else {
      // Shield check on player
      if (pActive._shielded && pActive._shielded > 0) {
        pActive._shielded--;
        addLog(pActive.card.name + '\'s shield blocks the attack!');
      } else {
        var dmg = aActive.atk;
        pActive.hp -= dmg;
        addLog(aActive.card.name + ' attacks for ' + dmg + ' damage!');
      }
    }

    // Check KO
    if (pActive.hp <= 0) {
      pActive.hp = 0;
      pActive.ko = true;
      addLog('Your ' + pActive.card.name + ' is KO\'d!');
      showDialogue('playerCardKO');

      if (allKO('player')) {
        battle.phase = 'done';
        renderBattle();
        setTimeout(function() { showResult('lose'); }, 1200);
        return;
      }

      var next = getNextAlive('player');
      if (next >= 0) {
        battle.player.active = next;
        addLog(getActive('player').card.name + ' steps in!');
        if (battle.player.support && battle.player.support.supportEffect && battle.player.support.supportEffect.stat === 'firstStrike') {
          battle.firstStrikePlayer = true;
        }
        applySupportSwapHeal('player');
      }

      renderBattle();
      if (battle.aiActedFirst) {
        battle.aiActedFirst = false;
        if (battle.stunPlayer > 0) {
          battle.stunPlayer--;
          addLog('Your ' + getActive('player').card.name + ' is stunned!');
          setTimeout(function() { startTurn(); }, 1200);
        } else {
          setTimeout(function() { battle.phase = 'playerTurn'; renderBattle(); }, 1000);
        }
      } else {
        setTimeout(function() { startTurn(); }, 1500);
      }
      return;
    }

    renderBattle();
    if (battle.aiActedFirst) {
      battle.aiActedFirst = false;
      if (battle.stunPlayer > 0) {
        battle.stunPlayer--;
        addLog('Your ' + getActive('player').card.name + ' is stunned!');
        setTimeout(function() { startTurn(); }, 1200);
      } else {
        setTimeout(function() { battle.phase = 'playerTurn'; renderBattle(); }, 1000);
      }
    } else {
      setTimeout(function() { startTurn(); }, 1200);
    }
  };

  // ==========================================
  // SUPPORT CARD HELPERS
  // ==========================================

  function applySupportHeal(side) {
    var support = battle[side].support;
    if (!support || !support.supportEffect) return;
    if (support.supportEffect.stat !== 'heal') return;
    var active = getActive(side);
    if (active.ko) return;
    var healed = Math.min(active.maxHp - active.hp, support.supportEffect.value);
    if (healed > 0) {
      active.hp += healed;
      addLog((side === 'player' ? 'Your ' : '') + support.name + ' heals ' + healed + ' HP!');
    }
  }

  function applySupportSwapHeal(side) {
    var support = battle[side].support;
    if (!support || !support.supportEffect) return;
    if (support.supportEffect.stat !== 'swapHeal') return;
    var active = getActive(side);
    if (active.ko) return;
    var healed = Math.min(active.maxHp - active.hp, support.supportEffect.value);
    if (healed > 0) {
      active.hp += healed;
      addLog(support.name + ' heals ' + healed + ' HP on swap-in!');
    }
  }

  // ==========================================
  // AI DECISION MAKING
  // ==========================================

  function aiShouldUseAbility(aiCard, playerCard) {
    if (aiCard.abilityUsed || !aiCard.card.ability) return false;
    var ab = aiCard.card.ability;
    var difficulty = battle.opponent.difficulty;

    // Easy: 30% chance to use ability when available
    // Medium: use when strategic
    // Hard: always use at best moment

    if (difficulty === 'easy') {
      return Math.random() < 0.3;
    }

    // Medium + Hard: use ability based on type
    switch (ab.type) {
      case 'heal':
        return aiCard.hp <= aiCard.maxHp * 0.5;
      case 'damage':
        return playerCard.hp <= ab.value + 2 || Math.random() < 0.6;
      case 'stun':
        return playerCard.atk >= 4 || Math.random() < 0.5;
      case 'buff':
        return battle.turn <= 2 || Math.random() < 0.4;
      case 'shield':
        return aiCard.hp <= aiCard.maxHp * 0.6;
      case 'swap':
        return playerCard.hp > playerCard.maxHp * 0.7 && Math.random() < 0.5;
      case 'gamble':
        return Math.random() < 0.5;
      case 'aoe':
        var aliveCount = battle.player.fighters.filter(function(f) { return !f.ko; }).length;
        return aliveCount >= 2 || (difficulty === 'hard' && Math.random() < 0.7);
      default:
        return Math.random() < 0.4;
    }
  }

  // ==========================================
  // BATTLE LOG
  // ==========================================

  function addLog(msg) {
    if (!battle) return;
    battle.log.push(msg);
    // Keep last 6
    if (battle.log.length > 6) battle.log.shift();
  }

  // ==========================================
  // DIALOGUE
  // ==========================================

  var currentDialogue = '';

  function showDialogue(event) {
    if (!battle || !battle.opponent || !battle.opponent.dialogues) return;
    var lines = battle.opponent.dialogues[event];
    if (!lines) return;
    if (Array.isArray(lines)) {
      currentDialogue = lines[Math.floor(Math.random() * lines.length)];
    } else {
      currentDialogue = lines;
    }
  }

  // ==========================================
  // UI RENDERING
  // ==========================================

  var arenaScreen = 'select'; // select, team, ante, battle, result

  function getArenaRoot() {
    return document.getElementById('sceArenaSection');
  }

  function renderArena() {
    var root = getArenaRoot();
    if (!root) return;

    switch (arenaScreen) {
      case 'select': renderOpponentSelect(root); break;
      case 'team': renderTeamBuilder(root); break;
      case 'ante': renderAnteSelect(root); break;
      case 'battle': renderBattle(); break;
      case 'result': break; // handled by showResult
    }
  }

  // --- Opponent Select ---
  var selectedOpponent = null;

  function renderOpponentSelect(root) {
    // Check if player has enough cards
    var collection = loadCollection();
    var ownedFighters = [];
    var ownedSupports = [];
    CARD_CATALOG.forEach(function(card) {
      if (collection[card.id]) {
        if (card.role === 'fighter') ownedFighters.push(card);
        else if (card.role === 'support') ownedSupports.push(card);
      }
    });

    if (ownedFighters.length < 3) {
      root.innerHTML =
        '<div class="arena-gate">' +
          '<div class="arena-gate-icon">⚔️</div>' +
          '<div class="arena-gate-title">The Arena</div>' +
          '<div class="arena-gate-msg">You need at least <strong>3 fighter cards</strong>' +
            (ownedSupports.length < 1 ? ' and <strong>1 support card</strong>' : '') +
            ' to enter The Arena!<br>Visit the Shop to open some packs.</div>' +
          '<div class="arena-gate-count">Fighters: ' + ownedFighters.length + '/3' +
            ' &bull; Support: ' + ownedSupports.length + '/1</div>' +
        '</div>';
      return;
    }

    if (typeof ARENA_OPPONENTS === 'undefined' || !ARENA_OPPONENTS.length) {
      root.innerHTML = '<div class="arena-gate"><div class="arena-gate-msg">No opponents available.</div></div>';
      return;
    }

    var html = '<div class="arena-select">' +
      '<div class="arena-select-title">⚔️ The Arena</div>' +
      '<div class="arena-select-sub">Choose your opponent!</div>' +
      '<div class="arena-opponents">';

    ARENA_OPPONENTS.forEach(function(opp) {
      var diffColor = opp.difficulty === 'easy' ? '#5a8a65' : opp.difficulty === 'medium' ? '#d4a535' : '#9a3038';
      html += '<div class="arena-opponent-card" data-opponent="' + opp.id + '">' +
        '<div class="arena-opponent-portrait">' +
          '<img src="assets/messenger/' + opp.portrait + '" alt="' + opp.name + '" onerror="this.style.display=\'none\'">' +
        '</div>' +
        '<div class="arena-opponent-info">' +
          '<div class="arena-opponent-name">' + opp.name + '</div>' +
          '<div class="arena-opponent-diff" style="color:' + diffColor + ';">' +
            opp.difficulty.charAt(0).toUpperCase() + opp.difficulty.slice(1) +
          '</div>' +
          '<div class="arena-opponent-desc">' + opp.description + '</div>' +
          '<div class="arena-opponent-reward">Reward: $' + opp.reward.toFixed(2) + ' snakes</div>' +
        '</div>' +
      '</div>';
    });

    html += '</div></div>';
    root.innerHTML = html;
  }

  // --- Team Builder ---
  var teamFighters = []; // card IDs (max 3)
  var teamSupport = null; // card ID

  function renderTeamBuilder(root) {
    var collection = loadCollection();
    var fighters = [];
    var supports = [];

    CARD_CATALOG.forEach(function(card) {
      if (collection[card.id]) {
        if (card.role === 'fighter') fighters.push(card);
        else if (card.role === 'support') supports.push(card);
      }
    });

    // Sort by rarity
    var ro = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
    fighters.sort(function(a, b) { return ro[b.rarity] - ro[a.rarity]; });
    supports.sort(function(a, b) { return ro[b.rarity] - ro[a.rarity]; });

    var html = '<div class="arena-team">' +
      '<div class="arena-team-header">' +
        '<button class="arena-back-btn" id="arenaBackToSelect">&larr; Back</button>' +
        '<span class="arena-team-title">Build Your Team</span>' +
        '<span class="arena-team-vs">vs ' + selectedOpponent.name + '</span>' +
      '</div>';

    // Selected slots
    html += '<div class="arena-team-slots">';
    for (var i = 0; i < 3; i++) {
      var fId = teamFighters[i];
      var fCard = fId ? getCardById(fId) : null;
      html += '<div class="arena-slot arena-slot-fighter' + (fCard ? ' arena-slot-filled' : '') + '" data-slot="fighter-' + i + '">' +
        (fCard
          ? '<div class="arena-slot-name">' + fCard.name + '</div><div class="arena-slot-stats">ATK ' + fCard.stats.atk + ' HP ' + fCard.stats.hp + ' SPD ' + fCard.stats.spd + '</div><div class="arena-slot-remove" data-remove-fighter="' + i + '">✕</div>'
          : '<div class="arena-slot-empty">Fighter ' + (i + 1) + '</div>'
        ) +
      '</div>';
    }
    var sCard = teamSupport ? getCardById(teamSupport) : null;
    html += '<div class="arena-slot arena-slot-support' + (sCard ? ' arena-slot-filled' : '') + '" data-slot="support">' +
      (sCard
        ? '<div class="arena-slot-name">' + sCard.name + '</div><div class="arena-slot-effect">' + sCard.supportEffect.description + '</div><div class="arena-slot-remove" data-remove-support="1">✕</div>'
        : '<div class="arena-slot-empty">Support</div>'
      ) +
    '</div></div>';

    // Confirm button
    var ready = teamFighters.length === 3;
    html += '<button class="arena-confirm-btn" id="arenaConfirmTeam"' + (ready ? '' : ' disabled') + '>Confirm Team →</button>';

    // Available fighters
    html += '<div class="arena-pool-label">Your Fighters</div><div class="arena-pool">';
    fighters.forEach(function(card) {
      var selected = teamFighters.indexOf(card.id) >= 0;
      html += '<div class="arena-pool-card' + (selected ? ' arena-pool-card-selected' : '') + '" data-pick-fighter="' + card.id + '">' +
        '<div class="arena-pool-card-name">' + card.name + '</div>' +
        '<div class="arena-pool-card-rarity arena-rarity-' + card.rarity + '">' + card.rarity + '</div>' +
        '<div class="arena-pool-card-stats">ATK ' + card.stats.atk + ' HP ' + card.stats.hp + ' SPD ' + card.stats.spd + '</div>' +
        (card.ability ? '<div class="arena-pool-card-ability">' + card.ability.name + '</div>' : '') +
      '</div>';
    });
    html += '</div>';

    // Available supports
    if (supports.length > 0) {
      html += '<div class="arena-pool-label">Your Support Cards</div><div class="arena-pool">';
      supports.forEach(function(card) {
        var selected = teamSupport === card.id;
        html += '<div class="arena-pool-card' + (selected ? ' arena-pool-card-selected' : '') + '" data-pick-support="' + card.id + '">' +
          '<div class="arena-pool-card-name">' + card.name + '</div>' +
          '<div class="arena-pool-card-rarity arena-rarity-' + card.rarity + '">' + card.rarity + '</div>' +
          '<div class="arena-pool-card-effect">' + card.supportEffect.description + '</div>' +
        '</div>';
      });
      html += '</div>';
    }

    html += '</div>';
    root.innerHTML = html;
  }

  // --- Ante Select ---
  var anteCardId = null;

  function renderAnteSelect(root) {
    var collection = loadCollection();
    var available = [];

    CARD_CATALOG.forEach(function(card) {
      if (!collection[card.id]) return;
      // Can't ante a card that's on your team
      if (teamFighters.indexOf(card.id) >= 0) return;
      if (teamSupport === card.id) return;
      available.push(card);
    });

    var ro = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
    available.sort(function(a, b) { return ro[a.rarity] - ro[b.rarity]; });

    var html = '<div class="arena-ante">' +
      '<div class="arena-team-header">' +
        '<button class="arena-back-btn" id="arenaBackToTeam">&larr; Back</button>' +
        '<span class="arena-team-title">Choose Your Ante</span>' +
      '</div>' +
      '<div class="arena-ante-desc">Pick one card to wager. If you win, you\'ll get your opponent\'s ante card too! If you lose... you lose this one.</div>';

    if (anteCardId) {
      var ac = getCardById(anteCardId);
      html += '<div class="arena-ante-chosen">Wagering: <strong>' + ac.name + '</strong> (' + ac.rarity + ')</div>';
    }

    html += '<button class="arena-confirm-btn" id="arenaConfirmAnte"' + (anteCardId ? '' : ' disabled') + '>Enter The Arena! →</button>';

    html += '<div class="arena-pool">';
    available.forEach(function(card) {
      var selected = anteCardId === card.id;
      html += '<div class="arena-pool-card' + (selected ? ' arena-pool-card-selected' : '') + '" data-pick-ante="' + card.id + '">' +
        '<div class="arena-pool-card-name">' + card.name + '</div>' +
        '<div class="arena-pool-card-rarity arena-rarity-' + card.rarity + '">' + card.rarity + '</div>' +
        '<div class="arena-pool-card-stats">' +
          (card.role === 'fighter' ? 'ATK ' + card.stats.atk + ' HP ' + card.stats.hp + ' SPD ' + card.stats.spd : card.supportEffect ? card.supportEffect.description : '') +
        '</div>' +
      '</div>';
    });
    html += '</div></div>';
    root.innerHTML = html;
  }

  // --- Battle Screen ---

  function renderBattle() {
    var root = getArenaRoot();
    if (!root || !battle) return;

    var pActive = getActive('player');
    var aActive = getActive('ai');

    var html = '<div class="arena-battle">';

    // === LEFT COLUMN: Card matchup ===
    html += '<div class="arena-battle-field">';

    // AI bench (compact)
    html += '<div class="arena-bench">';
    battle.ai.fighters.forEach(function(f, i) {
      if (i === battle.ai.active) return;
      html += '<div class="arena-bench-card' + (f.ko ? ' arena-bench-ko' : '') + '">' +
        '<span class="arena-bench-name">' + f.card.name + '</span>' +
        (f.ko ? '<span class="arena-bench-status">KO</span>' : '<span class="arena-bench-hp">' + f.hp + '/' + f.maxHp + '</span>') +
      '</div>';
    });
    if (battle.ai.support) {
      html += '<div class="arena-bench-support">' + battle.ai.support.name + '</div>';
    }
    html += '</div>';

    // AI active card
    html += '<div class="arena-active-side-label">Opponent</div>';
    html += '<div class="arena-active-card arena-active-ai' + (aActive.ko ? ' arena-card-ko' : '') + '">' +
      '<div class="arena-active-name">' + aActive.card.name + '</div>' +
      '<div class="arena-active-stats">ATK ' + aActive.atk + ' | SPD ' + aActive.spd + '</div>' +
      '<div class="arena-hp-bar"><div class="arena-hp-fill" style="width:' + Math.max(0, (aActive.hp / aActive.maxHp) * 100) + '%;"></div></div>' +
      '<div class="arena-hp-text">' + Math.max(0, aActive.hp) + ' / ' + aActive.maxHp + ' HP</div>' +
      (aActive._shielded ? '<div class="arena-shield-badge">🛡️</div>' : '') +
    '</div>';

    // VS
    html += '<div class="arena-vs">⚔️</div>';

    // Player active card
    html += '<div class="arena-active-card arena-active-player' + (pActive.ko ? ' arena-card-ko' : '') + '">' +
      '<div class="arena-active-name">' + pActive.card.name + '</div>' +
      '<div class="arena-active-stats">ATK ' + pActive.atk + ' | SPD ' + pActive.spd + '</div>' +
      '<div class="arena-hp-bar"><div class="arena-hp-fill arena-hp-fill-player" style="width:' + Math.max(0, (pActive.hp / pActive.maxHp) * 100) + '%;"></div></div>' +
      '<div class="arena-hp-text">' + Math.max(0, pActive.hp) + ' / ' + pActive.maxHp + ' HP</div>' +
      (pActive._shielded ? '<div class="arena-shield-badge">🛡️</div>' : '') +
    '</div>';
    html += '<div class="arena-active-side-label">You</div>';

    // Player bench
    html += '<div class="arena-bench">';
    battle.player.fighters.forEach(function(f, i) {
      if (i === battle.player.active) return;
      html += '<div class="arena-bench-card' + (f.ko ? ' arena-bench-ko' : '') + '">' +
        '<span class="arena-bench-name">' + f.card.name + '</span>' +
        (f.ko ? '<span class="arena-bench-status">KO</span>' : '<span class="arena-bench-hp">' + f.hp + '/' + f.maxHp + '</span>') +
      '</div>';
    });
    if (battle.player.support) {
      html += '<div class="arena-bench-support">' + battle.player.support.name + '</div>';
    }
    html += '</div>';

    html += '</div>'; // end field

    // === RIGHT COLUMN: Dialogue + Actions + Log ===
    html += '<div class="arena-battle-panel">';

    // Dialogue
    if (currentDialogue) {
      html += '<div class="arena-dialogue">' +
        '<span class="arena-dialogue-name">' + battle.opponent.name + ':</span> ' +
        '<span class="arena-dialogue-text">"' + currentDialogue + '"</span>' +
      '</div>';
    }

    // Action buttons
    if (battle.phase === 'playerTurn') {
      var canAbility = !pActive.abilityUsed && pActive.card.ability;
      html += '<div class="arena-actions">' +
        '<button class="arena-action-btn arena-btn-attack" id="arenaAttack">⚔️ Attack</button>' +
        '<button class="arena-action-btn arena-btn-ability' + (canAbility ? '' : ' arena-btn-disabled') + '" id="arenaAbility"' + (canAbility ? '' : ' disabled') + '>' +
          '✨ ' + (pActive.card.ability ? pActive.card.ability.name : 'No Ability') +
        '</button>' +
      '</div>';
      if (canAbility && pActive.card.ability) {
        html += '<div class="arena-ability-desc">' + pActive.card.ability.description + '</div>';
      }
    } else if (battle.phase === 'animating') {
      html += '<div class="arena-actions"><div class="arena-waiting">...</div></div>';
    }

    // Battle log
    html += '<div class="arena-log">';
    battle.log.forEach(function(msg) {
      html += '<div class="arena-log-entry">' + msg + '</div>';
    });
    html += '</div>';

    html += '</div>'; // end panel

    html += '</div>'; // end battle
    root.innerHTML = html;
  }

  // --- Result Screen ---

  async function showResult(outcome) {
    arenaScreen = 'result';
    var root = getArenaRoot();
    if (!root) return;

    var isWin = outcome === 'win';

    // Show dialogue
    showDialogue(isWin ? 'defeat' : 'victory');

    var html = '<div class="arena-result">';
    html += '<div class="arena-result-title">' + (isWin ? '🏆 VICTORY!' : '💀 DEFEAT') + '</div>';

    if (currentDialogue) {
      html += '<div class="arena-dialogue">' +
        '<span class="arena-dialogue-name">' + battle.opponent.name + ':</span> ' +
        '"' + currentDialogue + '"' +
      '</div>';
    }

    // Ante exchange
    var wonCard = isWin ? getCardById(battle.ai.anteCardId) : null;
    var lostCard = !isWin ? getCardById(battle.player.anteCardId) : null;

    html += '<div class="arena-ante-result">';
    if (isWin) {
      html += '<div class="arena-ante-won">You won: <strong>' + (wonCard ? wonCard.name : 'a card') + '</strong>!</div>';
      html += '<div class="arena-ante-reward">+ $' + battle.opponent.reward.toFixed(2) + ' snakes</div>';
    } else {
      html += '<div class="arena-ante-lost">You lost: <strong>' + (lostCard ? lostCard.name : 'a card') + '</strong></div>';
    }
    html += '</div>';

    html += '<button class="arena-confirm-btn" id="arenaBackToArena">Back to Arena</button>';
    html += '</div>';

    root.innerHTML = html;

    // Process ante exchange + rewards
    if (isWin) {
      await addCardToCollection(battle.ai.anteCardId);
      await paySnakes(battle.opponent.reward);
    } else {
      await removeCardFromCollection(battle.player.anteCardId);
    }

    battle = null;
  }

  // ==========================================
  // EVENT HANDLING
  // ==========================================

  function initArena() {
    var root = getArenaRoot();
    if (!root) return;

    root.addEventListener('click', function(e) {
      // Opponent select
      var oppCard = e.target.closest('.arena-opponent-card');
      if (oppCard && arenaScreen === 'select') {
        var oppId = oppCard.dataset.opponent;
        for (var i = 0; i < ARENA_OPPONENTS.length; i++) {
          if (ARENA_OPPONENTS[i].id === oppId) { selectedOpponent = ARENA_OPPONENTS[i]; break; }
        }
        if (selectedOpponent) {
          teamFighters = [];
          teamSupport = null;
          anteCardId = null;
          arenaScreen = 'team';
          renderArena();
        }
        return;
      }

      // Back to select
      if (e.target.closest('#arenaBackToSelect')) {
        arenaScreen = 'select';
        renderArena();
        return;
      }

      // Pick fighter
      var pickF = e.target.closest('[data-pick-fighter]');
      if (pickF && arenaScreen === 'team') {
        var fId = pickF.dataset.pickFighter;
        var idx = teamFighters.indexOf(fId);
        if (idx >= 0) {
          teamFighters.splice(idx, 1);
        } else if (teamFighters.length < 3) {
          teamFighters.push(fId);
        }
        renderArena();
        return;
      }

      // Remove fighter from slot
      var remF = e.target.closest('[data-remove-fighter]');
      if (remF && arenaScreen === 'team') {
        var rIdx = parseInt(remF.dataset.removeFighter);
        teamFighters.splice(rIdx, 1);
        renderArena();
        return;
      }

      // Pick support
      var pickS = e.target.closest('[data-pick-support]');
      if (pickS && arenaScreen === 'team') {
        var sId = pickS.dataset.pickSupport;
        teamSupport = teamSupport === sId ? null : sId;
        renderArena();
        return;
      }

      // Remove support
      var remS = e.target.closest('[data-remove-support]');
      if (remS && arenaScreen === 'team') {
        teamSupport = null;
        renderArena();
        return;
      }

      // Confirm team
      if (e.target.closest('#arenaConfirmTeam') && teamFighters.length === 3) {
        arenaScreen = 'ante';
        anteCardId = null;
        renderArena();
        return;
      }

      // Back to team
      if (e.target.closest('#arenaBackToTeam')) {
        arenaScreen = 'team';
        renderArena();
        return;
      }

      // Pick ante
      var pickA = e.target.closest('[data-pick-ante]');
      if (pickA && arenaScreen === 'ante') {
        var aId = pickA.dataset.pickAnte;
        anteCardId = anteCardId === aId ? null : aId;
        renderArena();
        return;
      }

      // Confirm ante → START BATTLE
      if (e.target.closest('#arenaConfirmAnte') && anteCardId) {
        arenaScreen = 'battle';
        battle = createBattleState(teamFighters, teamSupport, anteCardId, selectedOpponent);
        currentDialogue = '';
        showDialogue('intro');
        renderBattle();
        // Start first turn after intro delay
        setTimeout(function() { startTurn(); }, 1500);
        return;
      }

      // Battle actions
      if (e.target.closest('#arenaAttack')) {
        doPlayerAttack();
        return;
      }
      if (e.target.closest('#arenaAbility') && !e.target.closest('#arenaAbility').disabled) {
        doPlayerAbility();
        return;
      }

      // Back to arena from results
      if (e.target.closest('#arenaBackToArena')) {
        arenaScreen = 'select';
        battle = null;
        renderArena();
        return;
      }
    });

    renderArena();
  }

  // ==========================================
  // EXPOSE FOR NAV INTEGRATION
  // ==========================================

  window.arenaInit = initArena;
  window.arenaRender = renderArena;

})();