/* ==========================================================================
   macOS Launchpad — Application Grid & Launcher Overlay
   ========================================================================== */

let launchpadOpen = false;

const LAUNCHPAD_APPS = [
    {
        id: 'finder',
        name: 'Finder',
        icon: 'assets/icons/finder.png',
        action: () => openWindow('finder-window')
    },
    {
        id: 'safari',
        name: 'Safari',
        icon: 'assets/icons/safari.png',
        action: () => openWindow('safari-window')
    },
    {
        id: 'mail',
        name: 'Mail',
        icon: 'assets/icons/mail.png',
        action: () => openWindow('mail-window')
    },
    {
        id: 'notes',
        name: 'Notes',
        icon: 'assets/icons/notes.png',
        action: () => openWindow('notes-window')
    },
    {
        id: 'photos',
        name: 'Photos',
        icon: 'assets/icons/photos.png',
        action: () => openWindow('photos-window')
    },
    {
        id: 'appstore',
        name: 'App Store',
        icon: 'assets/icons/app-store.png',
        action: () => openWindow('appstore-window')
    },
    {
        id: 'terminal',
        name: 'Terminal',
        icon: 'assets/icons/terminal.png',
        action: () => openWindow('terminal-window')
    },
    {
        id: 'settings',
        name: 'System Settings',
        icon: 'assets/icons/settings.png',
        action: () => openWindow('settings-window')
    },
    {
        id: 'iris',
        name: 'Iris',
        icon: 'assets/icons/siri.png',
        action: () => {
            if (typeof openIris === 'function') openIris();
            else if (typeof toggleIris === 'function') toggleIris();
        }
    },
    {
        id: 'resume',
        name: 'Resume PDF',
        icon: 'assets/icons/filetype-pdf.svg',
        action: () => {
            if (typeof openResumeWindow === 'function') openResumeWindow();
            else openWindow('resume-window');
        }
    },
    {
        id: 'textedit',
        name: 'TextEdit',
        icon: 'assets/icons/notes.png',
        action: () => openWindow('textedit-window')
    },
    {
        id: 'disk-image',
        name: 'Disk Utility',
        icon: 'assets/icons/sf-icons/hard-drive.svg',
        action: () => openWindow('dmg-window')
    },
    {
        id: 'omnidoc',
        name: 'OmniDoc',
        icon: 'assets/icons/app-omnidoc.svg',
        action: () => {
            if (typeof openProjectDetails === 'function') {
                openProjectDetails('OmniDoc');
            } else {
                openWindow('appstore-window');
            }
        }
    },
    {
        id: 'sword',
        name: 'S.W.O.R.D',
        icon: 'assets/icons/app-sword.svg',
        action: () => {
            if (typeof openProjectDetails === 'function') {
                openProjectDetails('Project S.W.O.R.D');
            } else {
                openWindow('appstore-window');
            }
        }
    },
    {
        id: 'sliver',
        name: 'Sliver.Ai',
        icon: 'assets/icons/app-sliver.svg',
        action: () => {
            if (typeof openProjectDetails === 'function') {
                openProjectDetails('Sliver.Ai');
            } else {
                openWindow('appstore-window');
            }
        }
    },
    {
        id: 'multiva',
        name: 'Multiva.Ai',
        icon: 'assets/icons/app-multiva.svg',
        action: () => {
            if (typeof openProjectDetails === 'function') {
                openProjectDetails('Multiva.Ai');
            } else {
                openWindow('appstore-window');
            }
        }
    },
    {
        id: 'helix',
        name: 'Helix Compiler',
        icon: 'assets/icons/app-helix.svg',
        action: () => {
            if (typeof openProjectDetails === 'function') {
                openProjectDetails('Helix-Compiler');
            } else {
                openWindow('appstore-window');
            }
        }
    },
    {
        id: 'trash',
        name: 'Trash',
        icon: 'assets/icons/trash-full.png',
        action: () => openWindow('trash-window')
    }
];

function initLaunchpad() {
    const overlay = document.getElementById('launchpad-overlay');
    if (!overlay) return;

    renderLaunchpadGrid(LAUNCHPAD_APPS);

    const searchInput = document.getElementById('launchpad-search-input');
    const searchClear = document.getElementById('launchpad-search-clear');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const val = searchInput.value;
            filterLaunchpad(val);
            if (searchClear) {
                searchClear.classList.toggle('visible', val.length > 0);
            }
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                if (searchInput.value) {
                    searchInput.value = '';
                    filterLaunchpad('');
                    if (searchClear) searchClear.classList.remove('visible');
                } else {
                    closeLaunchpad();
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                launchFirstVisibleApp();
            }
        });
    }

    if (searchClear && searchInput) {
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            filterLaunchpad('');
            searchClear.classList.remove('visible');
            searchInput.focus();
        });
    }

    // Dismiss Launchpad when clicking the backdrop outside of any app item or search box
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.classList.contains('launchpad-content') || e.target.classList.contains('launchpad-grid')) {
            closeLaunchpad();
        }
    });
}

function renderLaunchpadGrid(apps) {
    const grid = document.getElementById('launchpad-grid');
    if (!grid) return;

    grid.innerHTML = apps.map(app => `
        <button class="launchpad-app-item" data-app-id="${app.id}" data-app-name="${escapeHtml(app.name)}" onclick="launchApp('${app.id}')" title="${escapeHtml(app.name)}">
            <div class="launchpad-app-icon-wrapper">
                <img src="${escapeHtml(app.icon)}" alt="${escapeHtml(app.name)}">
            </div>
            <div class="launchpad-app-name">${escapeHtml(app.name)}</div>
        </button>
    `).join('') + `<div class="launchpad-empty-state" id="launchpad-empty-state">No Applications Found</div>`;
}

function filterLaunchpad(query) {
    const q = (query || '').toLowerCase().trim();
    const items = document.querySelectorAll('.launchpad-app-item');
    const emptyState = document.getElementById('launchpad-empty-state');
    let visibleCount = 0;

    items.forEach(item => {
        const name = (item.getAttribute('data-app-name') || '').toLowerCase();
        const matches = !q || name.includes(q);
        item.classList.toggle('hidden-by-search', !matches);
        if (matches) visibleCount++;
    });

    if (emptyState) {
        emptyState.classList.toggle('visible', visibleCount === 0);
    }
}

function launchFirstVisibleApp() {
    const firstVisible = document.querySelector('.launchpad-app-item:not(.hidden-by-search)');
    if (firstVisible) {
        const appId = firstVisible.getAttribute('data-app-id');
        if (appId) launchApp(appId);
    }
}

function launchApp(appId) {
    const app = LAUNCHPAD_APPS.find(a => a.id === appId);
    if (!app) return;

    closeLaunchpad();

    // Smooth staggered window open
    setTimeout(() => {
        if (typeof app.action === 'function') {
            app.action();
        }
    }, 120);
}

function openLaunchpad() {
    const overlay = document.getElementById('launchpad-overlay');
    const searchInput = document.getElementById('launchpad-search-input');
    const searchClear = document.getElementById('launchpad-search-clear');
    if (!overlay) return;

    overlay.classList.add('active');
    launchpadOpen = true;

    if (searchInput) {
        searchInput.value = '';
        filterLaunchpad('');
        if (searchClear) searchClear.classList.remove('visible');
        setTimeout(() => searchInput.focus(), 100);
    }

    const dockLaunchpad = document.getElementById('dock-launchpad');
    if (dockLaunchpad) dockLaunchpad.classList.add('is-running');
}

function closeLaunchpad() {
    const overlay = document.getElementById('launchpad-overlay');
    if (overlay) overlay.classList.remove('active');
    launchpadOpen = false;

    const dockLaunchpad = document.getElementById('dock-launchpad');
    if (dockLaunchpad) dockLaunchpad.classList.remove('is-running');
}

function toggleLaunchpad() {
    if (launchpadOpen) {
        closeLaunchpad();
    } else {
        openLaunchpad();
    }
}

// Initialize reliably
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLaunchpad);
} else {
    initLaunchpad();
}
