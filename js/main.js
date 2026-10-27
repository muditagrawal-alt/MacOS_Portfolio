/* ==========================================================================
   Main Application Bootstrap & Event Listeners
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Personal details are filled in by js/core/profile-bind.js (data-tpl).

    // Bring window to front on click (delegated — works for any window,
    // including ones that gain content later).
    document.addEventListener('mousedown', (e) => {
        const win = e.target.closest && e.target.closest('.window');
        if (win && typeof bringToFront === 'function') bringToFront(win.id);
    }, true);

    // Initialize System Status
    if (typeof loadSystemBatteryFeed === 'function') {
        loadSystemBatteryFeed();
    }
    if (typeof updateWifiStatus === 'function') {
        updateWifiStatus();
    }

    // Initialize Safari Tabs
    if (typeof renderSafariTabs === 'function') {
        renderSafariTabs();
        if (typeof switchSafariTab === 'function' && typeof activeSafariTabId !== 'undefined') {
            switchSafariTab(activeSafariTabId);
        }
    }

    // Initialize Mail.app
    if (typeof updateMailBadges === 'function') {
        updateMailBadges();
    }
    if (typeof renderMailList === 'function') {
        renderMailList();
        if (typeof selectEmail === 'function') {
            selectEmail(1);
        }
    }

    // Initialize Dock State
    if (typeof updateDockRunningIndicators === 'function') {
        updateDockRunningIndicators();
    }
    if (typeof updateWindowFocusStates === 'function') {
        updateWindowFocusStates();
    }

    // Keyboard access: much of the UI is <div onclick> (sidebars, favourites,
    // wallpaper cards, menu titles…). Give those button semantics and a tab
    // stop — including ones rendered later — so they can be reached and, via
    // keyboard.js, activated with Enter/Space.
    const CLICKABLE = '.sidebar-v2-item, .sidebar-item, .music-nav-item, .favorite-item, .reading-card, .wallpaper-card, .theme-option, .accent-dot, .pb-effect-card, .menu-item[onclick], .finder-path-segment, .finder-column-row, .safari-tab-item';
    const enhance = (root) => {
        if (!(root instanceof Element)) return;
        const nodes = root.matches(CLICKABLE) ? [root] : [];
        nodes.push(...root.querySelectorAll(CLICKABLE));
        nodes.forEach(el => {
            if (el.tagName === 'BUTTON' || el.tagName === 'A') return;
            if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
            if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
            if (!el.hasAttribute('aria-label') && el.title) el.setAttribute('aria-label', el.title);
        });
    };
    enhance(document.body);
    new MutationObserver(muts => muts.forEach(m => m.addedNodes.forEach(enhance)))
        .observe(document.body, { childList: true, subtree: true });

    // Dropping a file anywhere outside the compose attachment zone used to
    // navigate the browser away from the whole desktop. Swallow it.
    ['dragover', 'drop'].forEach(evt => {
        window.addEventListener(evt, e => {
            if (e.target.closest && e.target.closest('#compose-attachment-zone')) return;
            e.preventDefault();
        });
    });
});
