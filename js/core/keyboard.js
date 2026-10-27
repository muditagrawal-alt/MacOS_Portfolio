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

/* ── App switcher ───────────────────────────────────────────────────────
   ⌥Tab (and ⌥` on platforms where Alt+Tab belongs to the OS). ⌘Tab is still
   handled for the rare environment that delivers it, but on a Mac it never
   reaches a web page — the OS switcher takes it first. */

const APP_ORDER = [
    { id: 'welcome-window',    name: `About ${window.PROFILE_DATA.first}`, icon: window.PROFILE_DATA.photo },
    { id: 'finder-window',     name: 'Finder',          icon: 'assets/icons/finder.png' },
    { id: 'safari-window',     name: 'Safari',          icon: 'assets/icons/safari.png' },
    { id: 'music-window',      name: 'Music',           icon: 'assets/icons/music.png' },
    { id: 'photobooth-window', name: 'Photo Booth',     icon: 'assets/icons/photobooth.svg' },
    { id: 'breakout-window',   name: 'Breakout',        icon: 'assets/icons/breakout.svg' },
    { id: 'snake-window',      name: 'Snake',           icon: 'assets/icons/snake.svg' },
    { id: 'mail-window',       name: 'Mail',            icon: 'assets/icons/mail.png' },
    { id: 'notes-window',      name: 'Notes',           icon: 'assets/icons/notes.png' },
    { id: 'photos-window',     name: 'Photos',          icon: 'assets/icons/photos.png' },
    { id: 'appstore-window',   name: 'App Store',       icon: 'assets/icons/app-store.png' },
    { id: 'terminal-window',   name: 'Terminal',        icon: 'assets/icons/terminal.png' },
    { id: 'settings-window',   name: 'System Settings', icon: 'assets/icons/settings.png' },
    { id: 'textedit-window',   name: 'TextEdit',        icon: 'assets/icons/filetype-txt.svg' },
    { id: 'resume-window',     name: 'Preview',         icon: 'assets/icons/filetype-pdf.svg' },
    { id: 'dmg-window',        name: 'Disk Image',      icon: 'assets/icons/filetype-dmg.svg' },
    { id: 'trash-window',      name: 'Trash',           icon: 'assets/icons/trash-full.png' }
];

let switcherOpen = false;
let switcherIndex = 0;
let switcherApps = [];
let switcherModifier = null;   // 'Alt' | 'Meta' | 'Control' — released to commit

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
        <div class="app-switcher-item ${i === switcherIndex ? 'selected' : ''}" data-index="${i}">
            <img src="${escapeHtml(app.icon)}" alt="${escapeHtml(app.name)}">
        </div>
    `).join('') + `<div class="app-switcher-label">${escapeHtml(switcherApps[switcherIndex].name)}</div>`;
    overlay.querySelectorAll('.app-switcher-item').forEach(item => {
        item.addEventListener('mouseenter', () => { switcherIndex = Number(item.dataset.index); renderAppSwitcher(); });
        item.addEventListener('mousedown', (e) => { e.preventDefault(); switcherIndex = Number(item.dataset.index); commitAppSwitcher(); });
    });
    overlay.classList.add('visible');
}

function commitAppSwitcher() {
    const overlay = document.getElementById('app-switcher');
    if (overlay) overlay.classList.remove('visible');
    if (switcherOpen && switcherApps[switcherIndex]) {
        openWindow(switcherApps[switcherIndex].id);
    }
    switcherOpen = false;
    switcherModifier = null;
}

/* ── Keyboard Shortcuts sheet (Help ▸ Keyboard Shortcuts, or "?") ─────── */
function showKeyboardShortcuts() {
    const rows = [
        ['Everywhere'],
        ['Spotlight — search everything', ['⌘', 'K']],
        ['Launchpad', ['⌥', 'L']],
        ['Mission Control', ['F3']],
        ['Switch apps', ['⌥', 'Tab']],
        ['This list', ['?']],
        ['Windows'],
        ['Close window', ['⌥', 'W']],
        ['Minimise window', ['⌥', 'M']],
        ['New Finder window / note / message', ['⌥', 'N']],
        ['System Settings', ['⌥', ',']],
        ['In apps'],
        ['Quick Look the selection', ['Space']],
        ['Finder views: icons · list · columns', ['⌥', '1–3']],
        ['Back · Forward (Finder, Safari)', ['⌘', '[  ]']],
        ['New Safari tab', ['⌥', 'T']],
        ['Focus the search field', ['⌘', 'F']],
        ['Clear the Terminal', ['⌃', 'L']]
    ];
    const html = '<dl class="kbd-sheet">' + rows.map(r => r.length === 1
        ? `<div class="kbd-sheet-group">${escapeHtml(r[0])}</div>`
        : `<dt>${escapeHtml(r[0])}</dt><dd>${r[1].map(k => `<kbd>${escapeHtml(k)}</kbd>`).join('')}</dd>`
    ).join('') + '</dl>';
    if (typeof openQuickLookData === 'function') {
        openQuickLookData({ title: 'Keyboard Shortcuts', icon: 'fas fa-keyboard', meta: 'Every shortcut here works in the browser', html: `<div class="ql-text-preview">${html}</div>` });
    }
}

/* ── Binding table ──────────────────────────────────────────────────────── */

// ⌥ + letter produces a special character on macOS (⌥W → ∑), so these are
// matched on the physical key code, not e.key.
const OPTION_COMMANDS = {
    KeyW: () => closeActiveWindow(),
    KeyM: () => minimizeActiveWindow(),
    KeyN: () => newInActiveApp(),
    KeyT: () => { if (isWindowActive('safari-window')) createSafariTab('', 'Start Page', 'start'); else return false; },
    Comma: () => openWindow('settings-window'),
    Digit1: () => finderView('icons'),
    Digit2: () => finderView('list'),
    Digit3: () => finderView('columns')
};

function newInActiveApp() {
    if (isWindowActive('notes-window')) addNewNotePrompt();
    else if (isWindowActive('mail-window')) openMailCompose();
    else if (isWindowActive('safari-window')) createSafariTab('', 'Start Page', 'start');
    else openWindow('finder-window');
}

function finderView(mode) {
    if (!isWindowActive('finder-window')) return false;
    setFinderViewMode(mode);
}

document.addEventListener('keydown', (e) => {
    const switcherCombo = (e.key === 'Tab' && (e.altKey || isCmd(e))) || (e.altKey && e.code === 'Backquote');
    if (switcherCombo) {
        e.preventDefault();
        if (!switcherOpen) {
            if (!openAppSwitcher()) return;
            switcherModifier = e.altKey ? 'Alt' : (IS_APPLE ? 'Meta' : 'Control');
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
    // F4 is unreliable on Mac hardware (the OS takes it), so it isn't the
    // advertised one. Not gated by isTypingTarget(): ⌥L types nothing anyone
    // relies on, and gating it made it dead whenever an input had focus.
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

    // Lock Screen: ⌃⌥Q. (⌃⌘Q is the real macOS binding — and it locks the
    // visitor's actual Mac before the page ever sees it.)
    if (e.ctrlKey && e.altKey && e.code === 'KeyQ') {
        e.preventDefault();
        if (typeof lockScreenNow === 'function') lockScreenNow();
        return;
    }

    // Spotlight / Command Palette: ⌘K / Ctrl+K, plus ⌥Space and Ctrl+/
    if ((isCmd(e) && e.key && e.key.toLowerCase() === 'k') || (e.altKey && e.code === 'Space') || (e.ctrlKey && e.key === '/')) {
        if (!isTypingTarget() || (isCmd(e) && e.key.toLowerCase() === 'k')) {
            e.preventDefault();
            toggleSpotlight();
            return;
        }
    }

    // ⌥-commands (see OPTION_COMMANDS)
    if (e.altKey && !e.metaKey && !e.ctrlKey && OPTION_COMMANDS[e.code]) {
        if (OPTION_COMMANDS[e.code]() !== false) e.preventDefault();
        return;
    }

    // ⌃L clears the Terminal, as in a real shell.
    if (e.ctrlKey && !e.metaKey && e.code === 'KeyL' && isWindowActive('terminal-window')) {
        e.preventDefault();
        const out = document.getElementById('terminal-output');
        if (out) out.innerHTML = '';
        return;
    }

    // "?" opens the shortcut sheet when nobody is typing.
    if (e.key === '?' && !isTypingTarget() && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        showKeyboardShortcuts();
        return;
    }

    if (!isCmd(e) || !e.key) return;

    switch (e.key.toLowerCase()) {
        // ⌘W/⌘M/⌘Q/⌘N/⌘T are bound for environments that deliver them (an
        // installed PWA, some browsers on Windows/Linux); menus advertise ⌥.
        case 'w':
            e.preventDefault();
            closeActiveWindow();
            break;
        case 'm':
            e.preventDefault();
            minimizeActiveWindow();
            break;
        case 'q':
            e.preventDefault();
            closeActiveWindow();
            break;
        case 't':
            if (isWindowActive('safari-window')) {
                e.preventDefault();
                createSafariTab('', 'Start Page', 'start');
            }
            break;
        case 'n':
            e.preventDefault();
            newInActiveApp();
            break;
        case 'f':                       // Focus the active app's search field
            if (!isTypingTarget()) {
                const field = focusableSearchField();
                if (field) { e.preventDefault(); field.focus(); field.select(); }
            }
            break;
        case ',':
            e.preventDefault();
            openWindow('settings-window');
            break;
        case 'l':                       // Focus the Safari URL bar
            if (isWindowActive('safari-window')) {
                const url = document.getElementById('safari-url-input');
                if (url) { e.preventDefault(); url.focus(); url.select(); }
            }
            break;
        case 'r':                       // Reload the Safari page, not the portfolio
            if (isWindowActive('safari-window')) { e.preventDefault(); safariReload(); }
            break;
        case '[':
            if (isWindowActive('finder-window')) { e.preventDefault(); finderGoBack(); }
            else if (isWindowActive('safari-window')) { e.preventDefault(); safariHistoryBack(); }
            break;
        case ']':
            if (isWindowActive('finder-window')) { e.preventDefault(); finderGoForward(); }
            else if (isWindowActive('safari-window')) { e.preventDefault(); safariHistoryForward(); }
            break;
    }
});

document.addEventListener('keyup', (e) => {
    // The switcher commits when its modifier is released, exactly like macOS.
    if (switcherOpen && e.key === switcherModifier) {
        commitAppSwitcher();
    }
});

// A switcher left open by a lost keyup (focus moved to another window) closes.
window.addEventListener('blur', () => { if (switcherOpen) commitAppSwitcher(); });

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

// SOTA Accessibility: Keyboard activation (Enter / Space) for role="button", .dock-item, and .desktop-icon
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        const target = document.activeElement;
        if (target && target !== document.body) {
            const isClickable = target.classList.contains('dock-item') ||
                                target.classList.contains('desktop-icon') ||
                                target.getAttribute('role') === 'button';
            if (isClickable && target.tagName !== 'BUTTON' && target.tagName !== 'A' && target.tagName !== 'INPUT') {
                e.preventDefault();
                target.click();
            }
        }
    }
});
