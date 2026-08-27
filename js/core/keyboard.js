/* ==========================================================================
   Global Keyboard Shortcuts — the macOS command layer
   --------------------------------------------------------------------------
   window-manager.js already exported closeActiveWindow / minimizeActiveWindow /
   maximizeActiveWindow, but nothing was ever bound to them. This is the wiring.

   Cmd on macOS, Ctrl elsewhere — matched the way a real app does it.
   ========================================================================== */

const IS_APPLE = /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/** True when the platform's primary modifier is held. */
function isCmd(e) {
    return IS_APPLE ? e.metaKey : e.ctrlKey;
}

function isTypingTarget() {
    const el = document.activeElement;
    if (!el) return false;
    if (el.id === 'launchpad-search-input') return false;
    return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
}

/* ── Cmd+Tab application switcher ───────────────────────────────────────── */

const APP_ORDER = [
    { id: 'finder-window',   name: 'Finder',          icon: 'assets/icons/finder.png' },
    { id: 'safari-window',   name: 'Safari',          icon: 'assets/icons/safari.png' },
    { id: 'mail-window',     name: 'Mail',            icon: 'assets/icons/mail.png' },
    { id: 'notes-window',    name: 'Notes',           icon: 'assets/icons/notes.png' },
    { id: 'appstore-window', name: 'App Store',       icon: 'assets/icons/app-store.png' },
    { id: 'terminal-window', name: 'Terminal',        icon: 'assets/icons/terminal.png' },
    { id: 'settings-window', name: 'System Settings', icon: 'assets/icons/settings.png' },
    { id: 'trash-window',    name: 'Trash',           icon: 'assets/icons/trash-full.png' }
];

let switcherOpen = false;
let switcherIndex = 0;
let switcherApps = [];

function openAppSwitcher() {
    // Only apps that are actually running, most-recently-used first — same
    // rule the real switcher uses.
    switcherApps = APP_ORDER
        .map(app => ({ ...app, el: document.getElementById(app.id) }))
        .filter(app => app.el && !app.el.classList.contains('hidden'))
        .sort((a, b) => (parseInt(b.el.style.zIndex, 10) || 0) - (parseInt(a.el.style.zIndex, 10) || 0));

    if (switcherApps.length < 2) return false;

    switcherOpen = true;
    switcherIndex = 1;
    renderAppSwitcher();
    return true;
}

function renderAppSwitcher() {
    let overlay = document.getElementById('app-switcher');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'app-switcher';
        overlay.className = 'app-switcher';
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = switcherApps.map((app, i) => `
        <div class="app-switcher-item ${i === switcherIndex ? 'selected' : ''}">
            <img src="${app.icon}" alt="${escapeHtml(app.name)}">
        </div>
    `).join('') + `<div class="app-switcher-label">${escapeHtml(switcherApps[switcherIndex].name)}</div>`;
    overlay.classList.add('visible');
}

function commitAppSwitcher() {
    const overlay = document.getElementById('app-switcher');
    if (overlay) overlay.classList.remove('visible');
    if (switcherOpen && switcherApps[switcherIndex]) {
        openWindow(switcherApps[switcherIndex].id);
    }
    switcherOpen = false;
}

/* ── Binding table ──────────────────────────────────────────────────────── */

document.addEventListener('keydown', (e) => {
    // Cmd+Tab cycles while Cmd is held
    if (isCmd(e) && e.key === 'Tab') {
        e.preventDefault();
        if (!switcherOpen) {
            if (!openAppSwitcher()) return;
        } else {
            switcherIndex = e.shiftKey
                ? (switcherIndex - 1 + switcherApps.length) % switcherApps.length
                : (switcherIndex + 1) % switcherApps.length;
            renderAppSwitcher();
        }
        return;
    }

    if (switcherOpen && e.key === 'Escape') {
        e.preventDefault();
        const overlay = document.getElementById('app-switcher');
        if (overlay) overlay.classList.remove('visible');
        switcherOpen = false;
        return;
    }

    // Launchpad Escape handler
    if (typeof launchpadOpen !== 'undefined' && launchpadOpen && (e.key === 'Escape' || e.code === 'Escape')) {
        e.preventDefault();
        if (typeof closeLaunchpad === 'function') closeLaunchpad();
        return;
    }

    // Launchpad: ⌥L / Alt+L (primary), ⌘⇧L / Ctrl+Shift+L (alternate), F4 (bonus).
    //
    // F4 is NOT reliable and is intentionally not the advertised shortcut: on
    // real Mac hardware with the default F-row (media-key) setting, F4 opens
    // the OS's own Launchpad and is consumed by WindowServer before the
    // keydown ever reaches the browser tab — no web page can intercept that.
    // We still bind it for the cases where it *does* arrive (external
    // keyboards, "use F1-F12 as standard function keys" enabled, non-Mac).
    //
    // None of these combos type a visible character worth protecting (⌥L
    // alone only inserts "¬", which nobody is relying on), so — unlike a
    // shortcut such as ⌘F — this one must NOT be gated by isTypingTarget().
    // It used to be, which meant ⌥L and F4 silently did nothing the instant
    // focus sat in the Terminal input, the Safari address bar, Mail compose,
    // or the Notes editor — i.e. most of the time a visitor had touched
    // anything. Only ⌘⇧L bypassed the gate, which is why that one "worked"
    // and the others appeared broken.
    const isKeyL = e.code === 'KeyL' || (e.key && e.key.toLowerCase() === 'l') || e.key === '¬';
    const isLaunchpadShortcut =
        (e.altKey && !e.metaKey && !e.ctrlKey && isKeyL) ||
        ((e.metaKey || e.ctrlKey) && e.shiftKey && isKeyL) ||
        (e.code === 'F4' || e.key === 'F4');

    if (isLaunchpadShortcut && typeof toggleLaunchpad === 'function') {
        e.preventDefault();
        toggleLaunchpad();
        return;
    }

    // Lock Screen: ⌃⌘Q on Mac (the real macOS binding). On other platforms
    // plain Ctrl+Q already means "close window" below, so this uses
    // Ctrl+Alt+Q there instead to avoid stealing that binding.
    const isLockShortcut = IS_APPLE
        ? (e.ctrlKey && e.metaKey && e.key.toLowerCase() === 'q')
        : (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'q');
    if (isLockShortcut) {
        e.preventDefault();
        if (typeof lockScreenNow === 'function') lockScreenNow();
        return;
    }

    // Spotlight / Command Palette: Cmd+K, Ctrl+K, or Alt+K (avoids macOS/Windows Cmd+Space OS collisions)
    if ((isCmd(e) && e.key.toLowerCase() === 'k') || (e.altKey && e.code === 'Space') || (e.ctrlKey && e.key === '/')) {
        if (!isTypingTarget() || (isCmd(e) && e.key.toLowerCase() === 'k')) {
            e.preventDefault();
            toggleSpotlight();
            return;
        }
    }

    if (!isCmd(e)) return;

    switch (e.key.toLowerCase()) {
        case 'w':                       // Close window
            e.preventDefault();
            closeActiveWindow();
            break;
        case 'm':                       // Minimise window
            e.preventDefault();
            minimizeActiveWindow();
            break;
        case 'q':                       // Quit app — closes its window
            e.preventDefault();
            closeActiveWindow();
            break;
        case 't':                       // New Safari tab
            if (isWindowActive('safari-window')) {
                e.preventDefault();
                createSafariTab('', 'Start Page', 'start');
            }
            break;
        case 'n':                       // New Finder window / new Note
            e.preventDefault();
            if (isWindowActive('notes-window')) addNewNotePrompt();
            else openWindow('finder-window');
            break;
        case 'f':                       // Focus the active app's search field
            if (!isTypingTarget()) {
                const field = focusableSearchField();
                if (field) { e.preventDefault(); field.focus(); field.select(); }
            }
            break;
        case ',':                       // System Settings
            e.preventDefault();
            openWindow('settings-window');
            break;
        case 'l':                       // Focus the Safari URL bar
            if (isWindowActive('safari-window')) {
                const url = document.getElementById('safari-url-input');
                if (url) { e.preventDefault(); url.focus(); url.select(); }
            }
            break;
    }
});

document.addEventListener('keyup', (e) => {
    // The switcher commits when Cmd is released, exactly like macOS.
    if (switcherOpen && (e.key === 'Meta' || e.key === 'Control')) {
        commitAppSwitcher();
    }
});

function isWindowActive(windowId) {
    const active = getActiveWindow();
    return Boolean(active && active.id === windowId);
}

/** The search input belonging to whichever window is frontmost. */
function focusableSearchField() {
    const active = getActiveWindow();
    if (!active) return null;
    return active.querySelector('input[type="text"][placeholder*="Search" i], input[type="search"]');
}
