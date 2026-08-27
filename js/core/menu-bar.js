/* ==========================================================================
   Menu Bar: Clock, Dynamic Menus (Finder, Go, Window, View, Help) & Dropdowns
   ========================================================================== */

function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; 
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    const timeString = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' ' + hours + ':' + minutes + ' ' + ampm;
    const clockEl = document.getElementById('clock');
    if (clockEl) {
        clockEl.textContent = timeString;
    }
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

const CMD = '\u2318';

const SHARED_MENUS = {
    'Window': [
        { label: 'Minimize', shortcut: CMD + 'M', run: 'minimizeActiveWindow()' },
        // No shortcut annotation here — the label previously claimed ⌘F, but
        // ⌘F is bound to "focus search field" (below), not Zoom. A menu that
        // advertises a shortcut which does something else is worse than one
        // that advertises nothing.
        { label: 'Zoom', run: 'maximizeActiveWindow()' },
        { sep: true },
        { label: 'Bring All to Front', run: 'openWindow("finder-window")' }
    ],
    'Help': [
        { label: 'Ask Siri / Iris', run: 'openIris()' },
        { label: 'Open Launchpad', shortcut: '⌥L', run: 'toggleLaunchpad()' },
        { label: 'Spotlight Search', shortcut: CMD + 'K', run: 'toggleSpotlight()' },
        { label: 'Quick Look a File', shortcut: 'Space', run: '' },
        { label: 'Switch Apps', shortcut: CMD + 'Tab', run: '' }
    ]
};

const DEFAULT_APP = {
    name: 'Finder',
    menus: {
        'File': [
            { label: 'New Contact Request', shortcut: CMD + 'N', run: "openWindow('mail-window'); if(typeof openMailCompose==='function') openMailCompose();" },
            { label: 'Export Resume as PDF', shortcut: CMD + 'E', run: 'downloadResume()' },
            { label: 'Download Resume', shortcut: CMD + 'D', run: 'downloadResume()' }
        ],
        'Edit': [
            { label: 'Copy Email Address', shortcut: CMD + 'C', run: "copyTextToClipboard('muditagrawal03@gmail.com', 'Copied email to clipboard!')" },
            { label: 'Copy Phone Number', run: "copyTextToClipboard('+91-7289887349', 'Copied phone number to clipboard!')" },
            { label: 'Copy LinkedIn URL', run: "copyTextToClipboard('https://www.linkedin.com/in/mudit-agrawal-167610318', 'Copied LinkedIn URL to clipboard!')" }
        ],
        'View': [
            { label: 'Grid View (Projects)', shortcut: CMD + '1', run: "openWindow('finder-window'); finderSidebarNav('projects'); setFinderViewMode('icons')" },
            { label: 'List View (Projects)', shortcut: CMD + '2', run: "openWindow('finder-window'); finderSidebarNav('projects'); setFinderViewMode('list')" },
            { label: 'Icon View (Projects)', run: "openWindow('finder-window'); finderSidebarNav('projects'); setFinderViewMode('icons')" },
            { label: 'Last Viewed View (Recents)', shortcut: CMD + '4', run: "openWindow('finder-window'); finderSidebarNav('recents')" }
        ],
        'Go': [
            { label: 'Recents',    run: "openWindow('finder-window'); finderSidebarNav('recents')" },
            { label: 'Documents',  run: "openWindow('finder-window'); finderSidebarNav('documents')" },
            { label: 'Projects',   run: "openWindow('finder-window'); finderSidebarNav('projects')" },
            { label: 'Experience', run: "openWindow('finder-window'); finderSidebarNav('experience')" },
            { label: 'Education',  run: "openWindow('finder-window'); finderSidebarNav('education')" },
            { label: 'Skills',     run: "openWindow('finder-window'); finderSidebarNav('skills')" },
            { sep: true },
            { label: 'Back',    shortcut: CMD + '[', run: 'finderGoBack()' },
            { label: 'Forward', shortcut: CMD + ']', run: 'finderGoForward()' }
        ]
    }
};

const APP_MENUS = {
    'finder-window': {
        name: 'Finder',
        menus: {
            'File': [
                { label: 'New Contact Request', shortcut: CMD + 'N', run: "openWindow('mail-window'); if(typeof openMailCompose==='function') openMailCompose();" },
                { label: 'Export Resume as PDF', shortcut: CMD + 'E', run: 'downloadResume()' },
                { label: 'Download Resume', shortcut: CMD + 'D', run: 'downloadResume()' },
                { sep: true },
                { label: 'Close Window', shortcut: CMD + 'W', run: 'closeActiveWindow()' }
            ],
            'Edit': [
                { label: 'Copy Email Address', shortcut: CMD + 'C', run: "copyTextToClipboard('muditagrawal03@gmail.com', 'Copied email to clipboard!')" },
                { label: 'Copy Phone Number', run: "copyTextToClipboard('+91-7289887349', 'Copied phone number to clipboard!')" },
                { label: 'Copy LinkedIn URL', run: "copyTextToClipboard('https://www.linkedin.com/in/mudit-agrawal-167610318', 'Copied LinkedIn URL to clipboard!')" }
            ],
            'View': [
                { label: 'Grid View (Projects)', shortcut: CMD + '1', run: "finderSidebarNav('projects'); setFinderViewMode('icons')" },
                { label: 'List View (Projects)', shortcut: CMD + '2', run: "finderSidebarNav('projects'); setFinderViewMode('list')" },
                { label: 'Icon View (Projects)', run: "finderSidebarNav('projects'); setFinderViewMode('icons')" },
                { label: 'Last Viewed View (Recents)', shortcut: CMD + '4', run: "finderSidebarNav('recents')" }
            ],
            'Go': [
                { label: 'Recents',    run: "finderSidebarNav('recents')" },
                { label: 'Documents',  run: "finderSidebarNav('documents')" },
                { label: 'Projects',   run: "finderSidebarNav('projects')" },
                { label: 'Experience', run: "finderSidebarNav('experience')" },
                { label: 'Education',  run: "finderSidebarNav('education')" },
                { label: 'Skills',     run: "finderSidebarNav('skills')" },
                { sep: true },
                { label: 'Back',    shortcut: CMD + '[', run: 'finderGoBack()' },
                { label: 'Forward', shortcut: CMD + ']', run: 'finderGoForward()' }
            ]
        }
    },
    'safari-window': {
        name: 'Safari',
        menus: {
            'File': [
                { label: 'New Tab',   shortcut: CMD + 'T', run: "createSafariTab('', 'Start Page', 'start')" },
                { label: 'Close Tab', shortcut: CMD + 'W', run: "closeSafariTab(typeof activeSafariTabId !== 'undefined' ? activeSafariTabId : null)" },
                { sep: true },
                { label: 'Open in Live Browser', run: 'openCurrentSafariLink()' }
            ],
            'Edit': [
                { label: 'Undo', shortcut: CMD + 'Z', disabled: true },
                { label: 'Copy Address', shortcut: CMD + 'L', run: 'copyCurrentSafariUrl()' },
                { label: 'Find in Page', shortcut: CMD + 'F', disabled: true }
            ],
            'View': [
                { label: 'Start Page', run: 'openSafariStartPage()' },
                { label: 'Reload Page', shortcut: CMD + 'R', run: 'safariReload()' },
                { label: 'Full Screen', shortcut: CMD + 'F', run: 'maximizeActiveWindow()' }
            ],
            'History': [
                { label: 'Back',    shortcut: CMD + '[', run: 'safariHistoryBack()' },
                { label: 'Forward', shortcut: CMD + ']', run: 'safariHistoryForward()' }
            ]
        }
    },
    'mail-window': {
        name: 'Mail',
        menus: {
            'File': [
                { label: 'New Message', shortcut: CMD + 'N', run: 'openMailCompose()' },
                { sep: true },
                { label: 'Move to Trash', run: 'trashActiveEmail()' },
                { label: 'Close Window',  shortcut: CMD + 'W', run: 'closeActiveWindow()' }
            ],
            'Edit': [
                { label: 'Undo', shortcut: CMD + 'Z', disabled: true },
                { label: 'Select All', shortcut: CMD + 'A', disabled: true }
            ],
            'View': [
                { label: 'Show Inbox', run: "switchMailbox('inbox', document.querySelector('[data-mailbox=\\'inbox\\']'))" },
                { label: 'Show VIPs', run: "switchMailbox('vip', document.querySelector('[data-mailbox=\\'vip\\']'))" }
            ],
            'Mailbox': [
                { label: 'Inbox',  run: "switchMailbox('inbox', document.querySelector('[data-mailbox=\\'inbox\\']'))" },
                { label: 'VIPs',   run: "switchMailbox('vip', document.querySelector('[data-mailbox=\\'vip\\']'))" },
                { label: 'Sent',   run: "switchMailbox('sent', document.querySelector('[data-mailbox=\\'sent\\']'))" },
                { label: 'Trash',  run: "switchMailbox('trash', document.querySelector('[data-mailbox=\\'trash\\']'))" }
            ]
        }
    },
    'notes-window': {
        name: 'Notes',
        menus: {
            'File': [
                { label: 'New Note', shortcut: CMD + 'N', run: 'addNewNotePrompt()' },
                { sep: true },
                { label: 'Close Window', shortcut: CMD + 'W', run: 'closeActiveWindow()' }
            ],
            'Edit': [
                { label: 'Undo', shortcut: CMD + 'Z', disabled: true },
                { label: 'Cut', shortcut: CMD + 'X', disabled: true },
                { label: 'Copy', shortcut: CMD + 'C', disabled: true },
                { label: 'Paste', shortcut: CMD + 'V', disabled: true },
                { label: 'Select All', shortcut: CMD + 'A', disabled: true }
            ],
            'View': [
                { label: 'All Notes', run: '' }
            ]
        }
    },
    'terminal-window': {
        name: 'Terminal',
        menus: {
            'Shell': [
                { label: 'Clear Buffer', shortcut: CMD + 'K', run: "document.getElementById('terminal-output').innerHTML = ''" },
                { sep: true },
                { label: 'Close Window', shortcut: CMD + 'W', run: 'closeActiveWindow()' }
            ],
            'Edit': [
                { label: 'Clear Scrollback', shortcut: CMD + 'K', run: "document.getElementById('terminal-output').innerHTML = ''" },
                { label: 'Select All', shortcut: CMD + 'A', disabled: true }
            ],
            'View': [
                { label: 'Zoom Window', run: 'maximizeActiveWindow()' }
            ]
        }
    },
    'appstore-window': {
        name: 'App Store',
        menus: {
            'Discover': [
                { label: 'All Projects',   run: "filterAppStoreCategory('all', null)" },
                { label: 'Open on GitHub', run: "openExternal('https://github.com/muditagrawal-alt')" }
            ],
            'Edit': [
                { label: 'Select All', disabled: true }
            ],
            'View': [
                { label: 'All Categories', run: "filterAppStoreCategory('all', null)" }
            ]
        }
    },
    'settings-window': {
        name: 'System Settings',
        menus: {
            'Edit': [
                { label: 'Select All', disabled: true }
            ],
            'View': [
                { label: 'Appearance', run: "switchSettingsTab('appearance', null)" },
                { label: 'Wallpaper',  run: "switchSettingsTab('wallpaper', null)" },
                { label: 'About',      run: "switchSettingsTab('about', null)" }
            ]
        }
    },
    'photos-window': {
        name: 'Photos',
        menus: {
            'File': [
                { label: 'Close Window', shortcut: CMD + 'W', run: 'closeActiveWindow()' }
            ],
            'Edit': [
                { label: 'Select All', disabled: true }
            ],
            'View': [
                { label: 'Certificates & Artifacts', run: '' }
            ]
        }
    },
    'textedit-window': {
        name: 'TextEdit',
        menus: {
            'File': [
                { label: 'Close Window', shortcut: CMD + 'W', run: 'closeActiveWindow()' }
            ],
            'Edit': [
                { label: 'Undo', shortcut: CMD + 'Z', disabled: true },
                { label: 'Select All', shortcut: CMD + 'A', disabled: true }
            ],
            'View': [
                { label: 'Wrap to Page', disabled: true }
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
                { label: 'Close Window', shortcut: CMD + 'W', run: 'closeActiveWindow()' }
            ],
            'Edit': [
                { label: 'Select All', disabled: true }
            ],
            'View': [
                { label: 'as Icons', disabled: true }
            ]
        }
    },
    'resume-window': {
        name: 'Preview',
        menus: {
            'File': [
                { label: 'Download Resume', shortcut: CMD + 'S', run: 'downloadResume()' },
                { sep: true },
                { label: 'Close Window', shortcut: CMD + 'W', run: 'closeActiveWindow()' }
            ],
            'Edit': [
                { label: 'Copy', disabled: true }
            ],
            'View': [
                { label: 'Zoom In', disabled: true },
                { label: 'Zoom Out', disabled: true }
            ]
        }
    }
};

let currentMenuAppId = null;

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
