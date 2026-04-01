// =================================
// CURRENCY SYMBOL REPLACER
// Globally replaces the snake emoji (🐍) with § in all DOM text nodes.
// Load this script early — it processes existing content and watches
// for any new content via MutationObserver.
// =================================

(function() {
    'use strict';

    var SNAKE_EMOJI = '\uD83D\uDC0D';  // 🐍
    var CURRENCY_SYMBOL = '\u00A7';     // §

    function replaceInTextNode(node) {
        if (node.nodeValue && node.nodeValue.indexOf(SNAKE_EMOJI) !== -1) {
            node.nodeValue = node.nodeValue.split(SNAKE_EMOJI).join(CURRENCY_SYMBOL);
        }
    }

    function walkTextNodes(root) {
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
            replaceInTextNode(walker.currentNode);
        }
    }

    // Process any content already in the DOM
    if (document.body) {
        walkTextNodes(document.body);
    }

    // Watch for new/changed content
    var observer = new MutationObserver(function(mutations) {
        for (var i = 0; i < mutations.length; i++) {
            var mutation = mutations[i];

            if (mutation.type === 'childList') {
                for (var j = 0; j < mutation.addedNodes.length; j++) {
                    var node = mutation.addedNodes[j];
                    if (node.nodeType === Node.TEXT_NODE) {
                        replaceInTextNode(node);
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        walkTextNodes(node);
                    }
                }
            } else if (mutation.type === 'characterData') {
                replaceInTextNode(mutation.target);
            }
        }
    });

    observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true
    });

})();