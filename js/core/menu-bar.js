/* ==========================================================================
   Menu Bar: Clock, Dynamic Menus (Finder, Go, Window, View, Help) & Dropdowns
   ========================================================================== */

// Formatted per the visitor's own locale (12h vs 24h, day/month order), the
// way the macOS menu bar follows the Mac's region — and consistent with the
// lock screen, which already did this.
const MENU_CLOCK_FMT = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

function updateClock() {
    const clockEl = document.getElementById('clock');
    if (!clockEl) return;
    const parts = MENU_CLOCK_FMT.formatToParts(new Date());
    const get = t => (parts.find(p => p.type === t) || {}).value || '';
    const date = parts.findIndex(p => p.type === 'day') < parts.findIndex(p => p.type === 'month')
        ? `${get('weekday')} ${get('day')} ${get('month')}`
        : `${get('weekday')} ${get('month')} ${get('day')}`;
    const ampm = get('dayPeriod');
    const time = `${get('hour')}:${get('minute')}${ampm ? ' ' + ampm : ''}`;
    // A phone-width menu bar only has room for the time, as on iOS.
    const text = window.innerWidth <= 600 ? time : `${date}  ${time}`;
    if (clockEl.textContent !== text) clockEl.textContent = text;
}

setInterval(updateClock, 1000);
updateClock();

document.addEventListener('DOMContentLoaded', () => {
    // Paint the initial menu bar before any window has been focused.
    if (typeof syncMenuBarToActiveApp === 'function') {
        syncMenuBarToActiveApp(typeof getActiveWindow === 'function' ? getActiveWindow() : null);
    }
});


/* ══════════════════════════════════════════════════════════════════════════
   Per-application menus
   --------------------------------------------------------------------------
   On a Mac the menu bar belongs to the frontmost app. This portfolio used to
   show a hardcoded "Finder / View / Go / Window / Help" bar no matter what was
   in front, which is the single most obvious tell that it isn't really macOS.

   Each app declares its own menus here; syncMenuBarToActiveApp() rebuilds the
   bar whenever focus changes.
   ══════════════════════════════════════════════════════════════════════════ */

const CMD = '⌘';
const OPT = '⌥';

/* Shortcut labels are honest: every one shown here is bound in keyboard.js
   AND reaches the page. ⌘W ⌘Q ⌘N ⌘T ⌘M and ⌘Tab are swallowed by the browser
   or the OS before a web page ever sees them (⌘W would close the visitor's
   tab), so window-level commands use ⌥ instead. */

const SHARED_MENUS = {
    'Window': [
        { label: 'Minimize', shortcut: OPT + 'M', run: 'minimizeActiveWindow()' },
        { label: 'Zoom', run: 'maximizeActiveWindow()' },
        { label: 'Mission Control', shortcut: 'F3', run: 'toggleMissionControl()' },
        { sep: true },
        { label: 'Bring All to Front', run: 'bringAllToFront()' }
    ],
    'Help': [
        { label: 'Keyboard Shortcuts…', shortcut: '?', run: 'showKeyboardShortcuts()' },
        { label: 'Ask Iris…', run: 'openIris()' },
        { sep: true },
        { label: 'Spotlight Search', shortcut: CMD + 'K', run: 'toggleSpotlight()' },
        { label: 'Launchpad', shortcut: OPT + 'L', run: 'toggleLaunchpad()' },
        { label: 'Switch Apps', shortcut: OPT + 'Tab', run: 'showKeyboardShortcuts()' }
    ]
};

const FINDER_FILE_MENU = [
    { label: 'New Finder Window', shortcut: OPT + 'N', run: "openWindow('finder-window')" },
    { label: 'New Message to Mudit', run: "openWindow('mail-window'); openMailCompose();" },
    { sep: true },
    { label: 'Download Résumé', run: 'downloadResume()' },
    { label: 'Save Contact Card', run: 'downloadContactCard()' },
    { sep: true },
    { label: 'Close Window', shortcut: OPT + 'W', run: 'closeActiveWindow()' }
];
const FINDER_EDIT_MENU = [
    { label: 'Copy Email Address', run: "copyTextToClipboard('muditagrawal03@gmail.com', 'Email address copied')" },
    { label: 'Copy Phone Number', run: "copyTextToClipboard('+91-7289887349', 'Phone number copied')" },
    { label: 'Copy LinkedIn URL', run: "copyTextToClipboard('https://www.linkedin.com/in/mudit-agrawal-167610318', 'LinkedIn URL copied')" }
];
const FINDER_GO_MENU = [
    { label: 'Recents',      run: "openFinderPane('recents')" },
    { label: 'Applications', run: "openFinderPane('applications')" },
    { label: 'Desktop',      run: "openFinderPane('desktop')" },
    { label: 'Documents',    run: "openFinderPane('documents')" },
    { sep: true },
    { label: 'Projects',     run: "openFinderPane('projects')" },
    { label: 'Experience',   run: "openFinderPane('experience')" },
    { label: 'Education',    run: "openFinderPane('education')" },
    { label: 'Skills',       run: "openFinderPane('skills')" },
    { label: 'AirDrop',      run: "openFinderPane('airdrop')" },
    { sep: true },
    { label: 'Back',    shortcut: CMD + '[', run: 'finderGoBack()' },
    { label: 'Forward', shortcut: CMD + ']', run: 'finderGoForward()' }
];

const DEFAULT_APP = {
    name: 'Finder',
    menus: {
        'File': FINDER_FILE_MENU,
        'Edit': FINDER_EDIT_MENU,
        'View': [
            { label: 'as Icons',   shortcut: OPT + '1', run: "openWindow('finder-window'); setFinderViewMode('icons')" },
            { label: 'as List',    shortcut: OPT + '2', run: "openWindow('finder-window'); setFinderViewMode('list')" },
            { label: 'as Columns', shortcut: OPT + '3', run: "openWindow('finder-window'); setFinderViewMode('columns')" }
        ],
        'Go': FINDER_GO_MENU
    }
};

const CLOSE_ITEM = { label: 'Close Window', shortcut: OPT + 'W', run: 'closeActiveWindow()' };

const APP_MENUS = {
    'finder-window': {
        name: 'Finder',
        menus: {
            'File': FINDER_FILE_MENU,
            'Edit': FINDER_EDIT_MENU,
            'View': [
                { label: 'as Icons',   shortcut: OPT + '1', run: "setFinderViewMode('icons')" },
                { label: 'as List',    shortcut: OPT + '2', run: "setFinderViewMode('list')" },
                { label: 'as Columns', shortcut: OPT + '3', run: "setFinderViewMode('columns')" }
            ],
            'Go': FINDER_GO_MENU
        }
    },
    'welcome-window': {
        name: 'About Mudit',
        menus: {
            'File': [
                { label: 'Download Résumé', run: 'downloadResume()' },
                { label: 'Save Contact Card', run: 'downloadContactCard()' },
                { sep: true },
                CLOSE_ITEM
            ],
            'Go': FINDER_GO_MENU
        }
    },
    'safari-window': {
        name: 'Safari',
        menus: {
            'File': [
                { label: 'New Tab',   shortcut: OPT + 'T', run: "createSafariTab('', 'Start Page', 'start')" },
                { label: 'Close Tab', run: "closeSafariTab(typeof activeSafariTabId !== 'undefined' ? activeSafariTabId : null)" },
                { sep: true },
                { label: 'Open in Your Browser', run: 'openCurrentSafariLink()' }
            ],
            'Edit': [
                { label: 'Copy Page Address', run: 'copyCurrentSafariUrl()' }
            ],
            'View': [
                { label: 'Start Page', run: 'openSafariStartPage()' },
                { label: 'Reload Page', shortcut: CMD + 'R', run: 'safariReload()' }
            ],
            'History': [
                { label: 'Back',    shortcut: CMD + '[', run: 'safariHistoryBack()' },
                { label: 'Forward', shortcut: CMD + ']', run: 'safariHistoryForward()' }
            ],
            'Bookmarks': [
                { label: 'GitHub',       run: "openSafariShortcut('github')" },
                { label: 'LinkedIn',     run: "openSafariShortcut('linkedin')" },
                { label: 'Hugging Face', run: "openSafariShortcut('huggingface')" },
                { label: 'Substack',     run: "openSafariShortcut('substack')" }
            ]
        }
    },
    'mail-window': {
        name: 'Mail',
        menus: {
            'File': [
                { label: 'New Message', shortcut: OPT + 'N', run: 'openMailCompose()' },
                { sep: true },
                { label: 'Move to Trash', run: 'trashActiveEmail()' },
                CLOSE_ITEM
            ],
            'Mailbox': [
                { label: 'Inbox',  run: "switchMailbox('inbox', document.querySelector('[data-mailbox=\\'inbox\\']'))" },
                { label: 'VIPs',   run: "switchMailbox('vip', document.querySelector('[data-mailbox=\\'vip\\']'))" },
                { label: 'Sent',   run: "switchMailbox('sent', document.querySelector('[data-mailbox=\\'sent\\']'))" },
                { label: 'Drafts', run: "switchMailbox('drafts', document.querySelector('[data-mailbox=\\'drafts\\']'))" },
                { label: 'Trash',  run: "switchMailbox('trash', document.querySelector('[data-mailbox=\\'trash\\']'))" }
            ]
        }
    },
    'notes-window': {
        name: 'Notes',
        menus: {
            'File': [
                { label: 'New Note', shortcut: OPT + 'N', run: 'addNewNotePrompt()' },
                { label: 'Delete Note', run: 'deleteActiveNote()' },
                { sep: true },
                CLOSE_ITEM
            ],
            'View': [
                { label: 'All iCloud',       run: "switchNotesCategory('all')" },
                { label: 'Philosophy',       run: "switchNotesCategory('philosophy')" },
                { label: 'Current Learning', run: "switchNotesCategory('learning')" },
                { label: 'Tech Notes',       run: "switchNotesCategory('stack')" }
            ]
        }
    },
    'terminal-window': {
        name: 'Terminal',
        menus: {
            'Shell': [
                { label: 'Clear Screen', shortcut: '⌃L', run: "document.getElementById('terminal-output').innerHTML = ''" },
                { label: 'neofetch', run: "runTerminalCommand('neofetch')" },
                { label: 'help', run: "runTerminalCommand('help')" },
                { sep: true },
                CLOSE_ITEM
            ],
            'View': [
                { label: 'Zoom Window', run: 'maximizeActiveWindow()' }
            ]
        }
    },
    'appstore-window': {
        name: 'App Store',
        menus: {
            'Store': [
                { label: 'Discover',       run: "filterAppStoreCategory('all', document.querySelector('.appstore-sidebar .sidebar-item'))" },
                { label: 'All on GitHub ↗', run: "openExternal('https://github.com/muditagrawal-alt')" }
            ]
        }
    },
    'settings-window': {
        name: 'System Settings',
        menus: {
            'View': [
                { label: 'Appearance',      run: "openSettingsPane('appearance')" },
                { label: 'Wallpaper',       run: "openSettingsPane('wallpaper')" },
                { label: 'Desktop & Dock',  run: "openSettingsPane('desktop-dock')" },
                { label: 'Siri & Iris',     run: "openSettingsPane('siri')" },
                { label: 'Privacy',         run: "openSettingsPane('privacy')" },
                { label: 'About This Mac',  run: "openSettingsPane('about-mac')" }
            ]
        }
    },
    'photos-window': {
        name: 'Photos',
        menus: {
            'File': [CLOSE_ITEM],
            'View': [
                { label: 'Certificates', run: "switchPhotoAlbum('certificates')" }
            ]
        }
    },
    'textedit-window': {
        name: 'TextEdit',
        menus: {
            'File': [
                { label: 'Open README.txt', run: "openTextFile('readme')" },
                CLOSE_ITEM
            ]
        }
    },
    'trash-window': {
        name: 'Finder',
        menus: {
            'File': [
                { label: 'Empty Trash', run: 'emptyTrash()' },
                { label: 'Put Back', run: 'restoreTrash()' },
                { sep: true },
                CLOSE_ITEM
            ]
        }
    },
    'resume-window': {
        name: 'Preview',
        menus: {
            'File': [
                { label: 'Download Résumé', run: 'downloadResume()' },
                { sep: true },
                CLOSE_ITEM
            ]
        }
    },
    'dmg-window': {
        name: 'Finder',
        menus: {
            'File': [
                { label: 'Eject', run: 'ejectDiskImage()' },
                CLOSE_ITEM
            ]
        }
    },
    'music-window': {
        name: 'Music',
        menus: {
            'Controls': [
                { label: 'Play / Pause', shortcut: 'Space', run: 'toggleMusicPlay()' },
                { label: 'Next', run: 'nextMusicTrack()' },
                { label: 'Previous', run: 'prevMusicTrack()' }
            ],
            'View': [
                { label: 'Library', run: "switchMusicNav('listen', 'listen')" },
                { label: 'Radio',   run: "switchMusicNav('radio', 'radio')" }
            ]
        }
    },
    'photobooth-window': {
        name: 'Photo Booth',
        menus: {
            'File': [
                { label: 'Take Photo', run: 'takePhotoBoothPicture()' },
                CLOSE_ITEM
            ],
            'View': [
                { label: 'Show Effects', run: 'togglePhotoBoothEffects()' }
            ]
        }
    },
    'breakout-window': {
        name: 'Breakout',
        menus: {
            'Game': [
                { label: 'New Game', run: 'startBreakoutGame()' },
                { label: 'Pause / Resume', shortcut: 'Space', run: 'toggleBreakoutPause()' },
                CLOSE_ITEM
            ]
        }
    },
    'snake-window': {
        name: 'Snake',
        menus: {
            'Game': [
                { label: 'New Game', run: 'startSnakeGame()' },
                { label: 'Pause / Resume', shortcut: 'Space', run: 'toggleSnakePause()' },
                CLOSE_ITEM
            ]
        }
    }
};

// undefined (not null) so the very first sync — with no window open — still renders
let currentMenuAppId;

function renderMenuItems(items) {
    return items.map(item => {
        if (item.sep) return '<div class="dropdown-divider"></div>';
        const cls = item.disabled ? 'dropdown-item disabled is-static' : 'dropdown-item';
        const handler = (!item.disabled && item.run) ? ` onclick="${escapeHtml(item.run)}"` : '';
        const sc = item.shortcut ? `<span class="menu-shortcut">${escapeHtml(item.shortcut)}</span>` : '';
        return `<div class="${cls}"${handler}>${escapeHtml(item.label)}${sc}</div>`;
    }).join('');
}

/**
 * Rebuilds the menu bar for whichever window is frontmost.
 * Called by window-manager.updateWindowFocusStates().
 */
function syncMenuBarToActiveApp(activeWin) {
    const container = document.getElementById('menubar-app-menus');
    if (!container) return;

    const appId = activeWin ? activeWin.id : null;
    if (appId === currentMenuAppId) return;    // nothing changed — don't thrash the DOM
    currentMenuAppId = appId;

    const app = (appId && APP_MENUS[appId]) || DEFAULT_APP;
    const menus = { ...app.menus, ...SHARED_MENUS };

    let html = `<span class="menu-item bold app-name-item">${escapeHtml(app.name)}</span>`;
    Object.entries(menus).forEach(([title, items], i) => {
        const id = `appmenu-${i}`;
        html += `
            <div class="menu-dropdown-container hide-mobile">
                <span class="menu-item" onclick="toggleMenu('${id}')">${escapeHtml(title)}</span>
                <div class="menu-dropdown hidden" id="${id}">${renderMenuItems(items)}</div>
            </div>`;
    });
    container.innerHTML = html;
}


function toggleMenu(menuId) {
    // Close all other menus first
    document.querySelectorAll('.menu-dropdown').forEach(menu => {
        if (menu.id !== menuId) {
            menu.classList.add('hidden');
            menu.parentElement.classList.remove('active');
        }
    });

    const menu = document.getElementById(menuId);
    if (menu) {
        menu.classList.toggle('hidden');
        menu.parentElement.classList.toggle('active');
    }
}

function closeAllMenus() {
    document.querySelectorAll('.menu-dropdown').forEach(menu => {
        menu.classList.add('hidden');
        menu.parentElement.classList.remove('active');
    });
}

// Dismiss on outside click, on Escape, AND after choosing an item.
// Previously the handler bailed whenever the click was inside a
// .menu-dropdown-container — and dropdown items live inside one, so picking
// anything left the menu hanging open, which no real Mac menu does.
document.addEventListener('click', function(event) {
    // event.target is occasionally not an Element (e.g. a click that
    // resolves to the Document itself at the very edge of the viewport) —
    // closest() doesn't exist there, so guard rather than let it throw.
    if (!(event.target instanceof Element)) return;

    const item = event.target.closest('.dropdown-item');
    if (item && !item.classList.contains('is-static')) {
        closeAllMenus();
        return;
    }
    if (!event.target.closest('.menu-dropdown-container')) {
        closeAllMenus();
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') closeAllMenus();
});

// Once a menu is open, hovering a sibling title switches to it — the way the
// macOS menu bar tracks the pointer.
document.addEventListener('mouseover', function(event) {
    if (!(event.target instanceof Element)) return;
    const anyOpen = document.querySelector('.menu-dropdown:not(.hidden)');
    if (!anyOpen) return;
    const title = event.target.closest('.menu-dropdown-container > .menu-item');
    if (!title) return;
    const container = title.parentElement;
    const menu = container.querySelector('.menu-dropdown');
    if (menu && menu.classList.contains('hidden')) {
        toggleMenu(menu.id);
    }
});
