// =================================
// CONTEXT BUILDER SERVICE — Centralized LLM Prompt Context
// Assembles world, user, and character context strings for messenger and email.
// NOT an LLM service — purely string assembly that reads from existing services.
// =================================

var ContextBuilderService = class ContextBuilderService {
    constructor() {
        this.worldContext = null;
        this.ready = false;
        console.log('🧱 Context Builder Service created');
    }

    // ===== INITIALIZATION =====

    async init() {
        try {
            // Get world context from conversation history manager (already loaded)
            if (window.conversationHistoryManager && window.conversationHistoryManager.worldContext) {
                this.worldContext = window.conversationHistoryManager.worldContext;
            } else {
                // Fallback: load directly
                var response = await fetch('./data/world-context.json');
                if (response.ok) {
                    this.worldContext = await response.json();
                }
            }

            this.ready = !!this.worldContext;
            console.log(this.ready ? '✅ Context Builder ready' : '⚠️ Context Builder: no world context');
        } catch (error) {
            console.error('❌ Context Builder init failed:', error);
            this.ready = false;
        }
    }

    // ===== PUBLIC API =====

    /**
     * Full world context block — Snakesia worldbuilding, characters, locations, real estate.
     * Used by both messenger and email.
     */
    getWorldContext() {
        if (!this.worldContext) return this._fallbackWorldContext();

        var wc = this.worldContext;
        var world = wc.world || {};
        var lines = [];

        // Core world info
        lines.push('WORLD CONTEXT — SNAKESIA:');
        lines.push('Snakesia is a country located ' + (world.location || 'west of Tennessee') + '. The timezone is Snakesia Time (' + (world.timezone ? world.timezone.description : 'exactly 2 hours and 1 minute ahead of Eastern Time') + '). The currency is "snakes" (' + (world.currency ? world.currency.exchangeRate : '1 USD = 2 snakes') + '), symbolized with the snake emoji.');

        // Internet / ExWeb
        lines.push('');
        lines.push("Snakesia's internet is called the ExWeb:");
        lines.push('- Snoogle: the most popular search engine');
        lines.push('- Sssteam: online platform for buying PC games');
        lines.push('- Social media: Abbit (forums), DisssCord (chat), Snakebook (social network)');
        lines.push('- SnooglePedia and Snoogle Dictionary: online reference');

        // Mrs. Snake-e's site (if in approved websites)
        var approvedSites = wc.approvedWebsites || [];
        var mrsSite = approvedSites.find(function(s) { return s.url === 'mrs-snake-e.garden'; });
        if (mrsSite) {
            lines.push("- Mrs. Snake-e's Corner (mrs-snake-e.garden): Mrs. Snake-e's personal gardening and recipe site");
        }
        var remicraftSite = approvedSites.find(function(s) { return s.url === 'remicraft.ex'; });
        if (remicraftSite) {
            lines.push('- RemiCraft (remicraft.ex): Remi Marway\'s Minecraft server');
        }

        // Key people
        lines.push('');
        lines.push('Key people in Snakesia:');
        var characters = wc.keyCharacters || {};
        var charKeys = Object.keys(characters);
        for (var i = 0; i < charKeys.length; i++) {
            var charId = charKeys[i];
            var c = characters[charId];
            // Skip department/corporate characters for the world overview
            if (c.autoReply !== undefined) continue;

            var charLine = '- ' + (c.fullName || c.name || charId) + ': ';
            var bits = [];
            if (c.age) bits.push(c.age + (c.age.match && c.age.match(/\d+s/) ? '' : '-year-old'));
            if (c.role) bits.push(c.role);
            if (c.personality) {
                // Take first sentence of personality
                var firstSentence = c.personality.split(/[.,]/)[0].trim();
                bits.push(firstSentence);
            }
            if (c.relationships) {
                var relKeys = Object.keys(c.relationships);
                for (var r = 0; r < relKeys.length; r++) {
                    var relName = relKeys[r];
                    var relType = c.relationships[relName];
                    // Only include person relationships, not places
                    if (relType !== 'secret hideout' && relType !== 'CEO and founder') {
                        bits.push(relName + ' is their ' + relType);
                    }
                }
            }
            charLine += bits.join('. ') + '.';
            lines.push(charLine);
        }

        // Real estate
        if (wc.mallardRealty) {
            var mr = wc.mallardRealty;
            lines.push('');
            lines.push('Real estate in Snakesia is handled by ' + mr.name + ' (' + mr.website + '):');
            lines.push(mr.description);
            if (mr.agents && mr.agents.length > 0) {
                var agentBits = [];
                for (var a = 0; a < mr.agents.length; a++) {
                    var agent = mr.agents[a];
                    agentBits.push(agent.name + ' (' + agent.specialty.toLowerCase() + ')');
                }
                lines.push('- Agents: ' + agentBits.join(', '));
            }
            if (mr.neighborhoods && mr.neighborhoods.length > 0) {
                lines.push('- Neighborhoods: ' + mr.neighborhoods.join(', '));
            }
        }

        // Notable places
        var locations = wc.locations || {};
        var attractions = [];
        var locKeys = Object.keys(locations);
        for (var l = 0; l < locKeys.length; l++) {
            var loc = locations[locKeys[l]];
            if (loc.type === 'Attraction' || loc.type === 'Corporate headquarters') {
                attractions.push(loc);
            }
        }
        if (attractions.length > 0) {
            lines.push('');
            lines.push('Notable places:');
            for (var n = 0; n < attractions.length; n++) {
                lines.push('- ' + attractions[n].name + ': ' + attractions[n].description);
            }
        }

        // Pato & Sons Auto
        if (wc.patoAuto) {
            var pa = wc.patoAuto;
            lines.push('');
            lines.push('Vehicle sales in Snakesia are handled by ' + pa.name + ' (' + pa.website + '):');
            lines.push(pa.description);
            if (pa.salespeople && pa.salespeople.length > 0) {
                var spBits = [];
                for (var sp = 0; sp < pa.salespeople.length; sp++) {
                    var person = pa.salespeople[sp];
                    spBits.push(person.name + ' (' + person.role.toLowerCase() + ', handles ' + person.handles.toLowerCase() + ')');
                }
                lines.push('- Salespeople: ' + spBits.join(', '));
            }
            if (pa.vehicleTiers && pa.vehicleTiers.length > 0) {
                var tierNames = [];
                for (var vt = 0; vt < pa.vehicleTiers.length; vt++) {
                    tierNames.push(pa.vehicleTiers[vt].name);
                }
                lines.push('- Vehicle tiers (low to high): ' + tierNames.join(', '));
            }
        }

        // Bank
        var fsbSite = approvedSites.find(function(s) { return s.url === 'fsb.ex'; });
        if (fsbSite) {
            lines.push('- First Snakesian Bank (fsb.ex): The main bank in Snakesia. Checking, savings, credit cards, and loans.');
        }

        // ScaleStreet / Stock Exchange
        if (wc.scaleStreet) {
            var ss = wc.scaleStreet;
            lines.push('');
            lines.push('The stock market in Snakesia is the ' + ss.name + ' (' + ss.website + '):');
            lines.push(ss.description);
            if (ss.newspaper) {
                lines.push('- The ScaleStreet Journal (' + ss.newspaper + '): Financial newspaper covering market news and stock events.');
            }
            if (ss.journalists && ss.journalists.length > 0) {
                var journos = [];
                for (var ji = 0; ji < ss.journalists.length; ji++) {
                    journos.push(ss.journalists[ji].name + ' (' + ss.journalists[ji].role.toLowerCase() + ')');
                }
                lines.push('- Journalists: ' + journos.join(', '));
            }
            if (ss.notableStocks && ss.notableStocks.length > 0) {
                var stockBits = [];
                for (var si = 0; si < ss.notableStocks.length; si++) {
                    var ns = ss.notableStocks[si];
                    stockBits.push(ns.ticker + ' (' + ns.name + ' — ' + ns.note + ')');
                }
                lines.push('- Notable stocks: ' + stockBits.join(', '));
            }
        }

        return lines.join('\n');
    }

    /**
     * Dynamic user context block — only includes info the user has actually unlocked.
     * Used by both messenger and email.
     */
    getUserContext() {
        var profile = this._getUserProfile();
        var lines = [];

        lines.push('USER INFORMATION:');
        lines.push('Here is information about the user, ' + profile.username + '.');
        lines.push('Details about ' + profile.username + ': ' + profile.about);

        // Property info (conditional)
        var properties = this._getPropertyInfo();
        if (properties.length > 0) {
            lines.push(profile.username + ' lives in Snakesia.');
            for (var p = 0; p < properties.length; p++) {
                lines.push(properties[p]);
            }
        }

        // Vehicle info (conditional)
        var vehicles = this._getVehicleInfo();
        if (vehicles.length > 0) {
            for (var v = 0; v < vehicles.length; v++) {
                lines.push(vehicles[v]);
            }
        }

        // Stock portfolio info (conditional)
        var stocks = this._getStockInfo();
        if (stocks.length > 0) {
            for (var si = 0; si < stocks.length; si++) {
                lines.push(stocks[si]);
            }
        }

        // Today's market headlines (conditional)
        var headlines = this._getMarketHeadlines();
        if (headlines) {
            lines.push('');
            lines.push(headlines);
        }

        // Employment info (conditional)
        var employment = this._getEmploymentInfo();
        if (employment) {
            lines.push(employment);
        }

        return lines.join('\n');
    }

    /**
     * Convenience: world + user combined.
     */
    getFullContext() {
        return this.getWorldContext() + '\n\n' + this.getUserContext();
    }

    /**
     * Approved websites block — for email only.
     * Messenger doesn't need URL guidance.
     */
    getApprovedSites() {
        if (!this.worldContext || !this.worldContext.approvedWebsites) return '';

        var sites = this.worldContext.approvedWebsites;
        var lines = ['APPROVED WEBSITES (you may reference these if relevant):'];
        for (var i = 0; i < sites.length; i++) {
            lines.push('- ' + sites[i].url + ': ' + sites[i].description);
        }
        return lines.join('\n');
    }

    // ===== PRIVATE HELPERS =====

    _getUserProfile() {
        // Try messenger settings from registry (same source email-llm already uses)
        try {
            if (typeof elxaOS !== 'undefined') {
                // Check messenger program settings
                if (elxaOS.programs && elxaOS.programs.messenger && elxaOS.programs.messenger.settings) {
                    var settings = elxaOS.programs.messenger.settings;
                    if (settings.username) {
                        return {
                            username: settings.username,
                            about: settings.about || 'a nice person'
                        };
                    }
                }

                // Fall back to registry profile cache
                if (elxaOS.registry && elxaOS.registry._profileCache) {
                    var profile = elxaOS.registry._profileCache;
                    if (profile.displayName) {
                        return {
                            username: profile.displayName,
                            about: 'a nice person'
                        };
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ Context Builder: failed to load user profile:', error);
        }

        // Fallback
        return { username: 'User', about: 'a nice person' };
    }

    _getPropertyInfo() {
        var lines = [];
        try {
            if (typeof elxaOS !== 'undefined' && elxaOS.inventoryService) {
                var inv = elxaOS.inventoryService;
                var props = typeof inv.getProperties === 'function' ? inv.getProperties() : [];
                var profile = this._getUserProfile();

                if (props && props.length > 0) {
                    for (var i = 0; i < props.length; i++) {
                        var prop = props[i];
                        var propName = prop.name || prop.propertyName || 'a property';
                        var neighborhood = prop.neighborhood || 'Snakesia';
                        var isRental = prop.ownershipType === 'rent' || prop.isRental;
                        var isPrimary = prop.isPrimary || i === 0;

                        if (isRental) {
                            lines.push(profile.username + (isPrimary ? ' is renting ' : ' also rents ') + propName + ' in ' + neighborhood + '.');
                        } else {
                            lines.push(profile.username + (isPrimary ? ' owns ' : ' also owns ') + propName + ' in ' + neighborhood + '.');
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ Context Builder: failed to load property info:', error);
        }
        return lines;
    }

    _getVehicleInfo() {
        var lines = [];
        try {
            if (typeof elxaOS !== 'undefined' && elxaOS.inventoryService) {
                var inv = elxaOS.inventoryService;
                var vehicles = typeof inv.getVehicles === 'function' ? inv.getVehicles() : [];
                var profile = this._getUserProfile();

                if (vehicles && vehicles.length > 0) {
                    for (var i = 0; i < vehicles.length; i++) {
                        var veh = vehicles[i];
                        var vehName = veh.name || 'a vehicle';
                        var otype = veh.ownership || 'owned';

                        if (otype === 'leased') {
                            lines.push(profile.username + ' is leasing a ' + vehName + ' from Pato & Sons Auto.');
                        } else if (otype === 'financed') {
                            lines.push(profile.username + ' is financing a ' + vehName + ' through an auto loan.');
                        } else {
                            lines.push(profile.username + ' owns a ' + vehName + ' outright.');
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ Context Builder: failed to load vehicle info:', error);
        }
        return lines;
    }

    _getEmploymentInfo() {
        try {
            if (typeof elxaOS !== 'undefined' && elxaOS.employmentService) {
                var emp = elxaOS.employmentService;
                if (typeof emp.isEmployed === 'function' && emp.isEmployed()) {
                    var data = typeof emp.getEmploymentData === 'function' ? emp.getEmploymentData() : null;
                    var profile = this._getUserProfile();
                    if (data && data.jobTitle) {
                        return profile.username + ' works at ElxaCorp as ' + data.jobTitle + '.';
                    } else {
                        return profile.username + ' works at ElxaCorp.';
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ Context Builder: failed to load employment info:', error);
        }
        return null;
    }

    _getStockInfo() {
        var lines = [];
        try {
            if (typeof elxaOS !== 'undefined' && elxaOS.stockService && elxaOS.inventoryService) {
                var portfolio = elxaOS.stockService.getPortfolioSync();
                var profile = this._getUserProfile();

                if (portfolio && portfolio.length > 0) {
                    var totalValue = 0;
                    var totalGain = 0;
                    var holdingBits = [];

                    for (var i = 0; i < portfolio.length; i++) {
                        var h = portfolio[i];
                        var value = (h.currentPrice || 0) * (h.shares || 0);
                        var gain = value - ((h.avgCost || h.currentPrice) * (h.shares || 0));
                        totalValue += value;
                        totalGain += gain;
                        var gainSign = gain >= 0 ? '+' : '';
                        holdingBits.push(h.ticker + ' (' + h.shares + ' shares, worth ~$' + value.toFixed(0) + ', ' + gainSign + '$' + gain.toFixed(0) + ')');
                    }

                    lines.push(profile.username + ' has a stock portfolio worth ~$' + totalValue.toFixed(0) + ' (' + (totalGain >= 0 ? 'up' : 'down') + ' $' + Math.abs(totalGain).toFixed(0) + ' overall).');
                    lines.push('Holdings: ' + holdingBits.join(', ') + '.');
                }
            }
        } catch (error) {
            console.warn('⚠️ Context Builder: failed to load stock info:', error);
        }
        return lines;
    }

    _getMarketHeadlines() {
        try {
            if (typeof elxaOS !== 'undefined' && elxaOS.stockService) {
                var news = elxaOS.stockService.getRecentNews();
                if (news && news.length > 0) {
                    // Take last 3 headlines
                    var recent = news.slice(-3);
                    var bits = [];
                    for (var i = 0; i < recent.length; i++) {
                        bits.push('"' + recent[i].headline + '"');
                    }
                    return 'Recent financial news in Snakesia: ' + bits.join('; ') + '. Characters may reference these headlines in conversation.';
                }
            }
        } catch (error) {
            console.warn('⚠️ Context Builder: failed to load market headlines:', error);
        }
        return null;
    }

    _fallbackWorldContext() {
        return 'WORLD CONTEXT — SNAKESIA:\nSnakesia is a country located west of Tennessee. The timezone is Snakesia Time (exactly 2 hours and 1 minute ahead of Eastern Time). The currency is "snakes" (1 USD = 2 snakes).';
    }
};