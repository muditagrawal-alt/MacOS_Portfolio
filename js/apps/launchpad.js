/* ==========================================================================
   macOS Launchpad — Application Grid & Launcher Overlay
   ========================================================================== */

let launchpadOpen = false;

const LAUNCHPAD_APPS = [
    {
        id: 'welcome',
        name: `About ${window.PROFILE_DATA.first}`,
        icon: window.PROFILE_DATA.photo,
        action: () => openWelcome()
    },
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
        id: 'photobooth',
        name: 'Photo Booth',
        icon: 'assets/icons/photobooth.svg',
        action: () => {
            if (typeof openPhotoBooth === 'function') openPhotoBooth();
            else openWindow('photobooth-window');
        }
    },
    {
        id: 'music',
        name: 'Music',
        icon: 'assets/icons/music.png',
        action: () => {
            if (typeof openMusic === 'function') openMusic();
            else openWindow('music-window');
        }
    },
    {
        id: 'breakout',
        name: 'Breakout',
        icon: 'assets/icons/breakout.svg',
        action: () => {
            if (typeof openBreakout === 'function') openBreakout();
            else openWindow('breakout-window');
        }
    },
    {
        id: 'snake',
        name: 'Snake',
        icon: 'assets/icons/snake.svg',
        action: () => {
            if (typeof openSnake === 'function') openSnake();
            else openWindow('snake-window');
        }
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
        icon: 'assets/icons/filetype-txt.svg',
        // Opened an empty window unless README had been opened first.
        action: () => openTextFile('readme')
    },
    // The owner's projects, from the info bank: a demo installer for a
    // project with a `demo`, then one icon per project, which opens its App
    // Store page (where OPEN launches the live app).
    ...window.PROFILE_DATA.projects.filter(x => x.demo).slice(0, 1).map(x => ({
        id: 'disk-image',
        name: `${x.name} Installer`,
        icon: 'assets/icons/filetype-dmg.svg',
        action: () => mountDiskImage(x.id)
    })),
    ...window.PROFILE_DATA.projects.map(x => ({
        id: `project-${x.id}`,
        name: x.name,
        icon: x.icon,
        action: () => {
            if (typeof openProjectDetails === 'function') openProjectDetails(x.name);
            else openWindow('appstore-window');
        }
    })),
    {
        id: 'missioncontrol',
        name: 'Mission Control',
        icon: 'assets/icons/mission-control.svg',
        action: () => toggleMissionControl()
    },
    {
        id: 'trash',
        name: 'Trash',
        icon: 'assets/icons/trash-full.png',
        action: () => openWindow('trash-window')
    }
];

// openProjectDetails() lives in appstore.js — it opens the project's product page.

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
            <div class="launchpad-app-icon-wrapper${app.icon === window.PROFILE_DATA.photo ? ' is-photo' : ''}">
                <img src="${escapeHtml(app.icon)}" alt="">
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
