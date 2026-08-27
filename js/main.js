/* ==========================================================================
   Main Application Bootstrap & Event Listeners
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Sync UI elements from single source of truth (window.PROFILE_DATA)
    if (window.PROFILE_DATA) {
        const p = window.PROFILE_DATA;
        const nameEl = document.getElementById('menubar-profile-name');
        const blurbEl = document.getElementById('menubar-profile-blurb');
        const eduEl = document.getElementById('about-mac-education');
        if (nameEl) nameEl.textContent = p.name;
        if (blurbEl) blurbEl.textContent = 'AI Engineer';
        if (eduEl) eduEl.textContent = `${p.education?.degree || ''} @ ${p.education?.university || ''}`;
    }

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

    // Dropping a file anywhere outside the compose attachment zone used to
    // navigate the browser away from the whole desktop. Swallow it.
    ['dragover', 'drop'].forEach(evt => {
        window.addEventListener(evt, e => {
            if (e.target.closest && e.target.closest('#compose-attachment-zone')) return;
            e.preventDefault();
        });
    });
});
