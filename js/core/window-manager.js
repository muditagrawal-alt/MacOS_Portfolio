/* ==========================================================================
   Window Manager: Dragging, Stacking, Window Controls & Dock Running Indicators
   ========================================================================== */

let highestZIndex = 10;
const MAX_WINDOW_Z = 900;   // dock and menu bar sit at 1000
let cascadeStep = 0;

function updateDockRunningIndicators() {
    const dockMap = {
        'finder-window': 'dock-finder',
        'mail-window': 'dock-mail',
        'notes-window': 'dock-notes',
        'safari-window': 'dock-safari',
        'appstore-window': 'dock-appstore',
        'settings-window': 'dock-settings',
        'terminal-window': 'dock-terminal',
        'trash-window': 'dock-trash',
        'photos-window': 'dock-photos',
        'photobooth-window': 'dock-photobooth',
        'music-window': 'dock-music',
        'breakout-window': 'dock-breakout',
        'snake-window': 'dock-snake'
    };

    Object.keys(dockMap).forEach(winId => {
        const win = document.getElementById(winId);
        const dockItem = document.getElementById(dockMap[winId]);
        if (win && dockItem) {
            if (!win.classList.contains('hidden') && !win.classList.contains('minimized')) {
                dockItem.classList.add('is-running');
            } else {
                dockItem.classList.remove('is-running');
            }
        }
    });

    const irisOverlay = document.getElementById('iris-overlay');
    const dockIris = document.getElementById('dock-iris');
    if (irisOverlay && dockIris) {
        if (irisOverlay.classList.contains('active')) {
            dockIris.classList.add('is-running');
        } else {
            dockIris.classList.remove('is-running');
        }
    }
}

function bringToFront(windowId) {
    const win = document.getElementById(windowId);
    if (!win) return;

    // Renormalise instead of climbing forever past the dock's z-index.
    if (highestZIndex >= MAX_WINDOW_Z) {
        const stack = [...document.querySelectorAll('.window')]
            .sort((a, b) => (parseInt(a.style.zIndex, 10) || 0) - (parseInt(b.style.zIndex, 10) || 0));
        highestZIndex = 10;
        stack.forEach(w => { w.style.zIndex = ++highestZIndex; });
    }

    win.style.zIndex = ++highestZIndex;
    updateWindowFocusStates();
}

function syncFullscreenState() {
    const activeMaximizedWin = document.querySelector('.window.is-maximized:not(.hidden):not(.minimized)');
    const isFullscreen = !!activeMaximizedWin;
    document.body.classList.toggle('has-fullscreen-app', isFullscreen);
    
    if (!isFullscreen) {
        const dock = document.querySelector('.dock-container');
        const menubar = document.querySelector('.menu-bar');
        if (dock) dock.classList.remove('is-revealed');
        if (menubar) menubar.classList.remove('is-revealed');
    }
}

/**
 * macOS dims every window except the frontmost one. Without this every window
 * looked equally focused and the stack read as flat.
 */
function updateWindowFocusStates() {
    const active = getActiveWindow();
    document.querySelectorAll('.window').forEach(w => {
        w.classList.toggle('is-active', w === active);
    });
    if (typeof syncMenuBarToActiveApp === 'function') syncMenuBarToActiveApp(active);
    syncFullscreenState();
}

function openWindow(windowId) {
    const win = document.getElementById(windowId);
    if (win) {
        const wasClosed = win.classList.contains('hidden');
        win.classList.remove('hidden');
        win.classList.remove('minimized');

        // Cascade genuinely-new windows so they don't stack pixel-on-pixel.
        if (wasClosed && window.innerWidth > 768 && !win.dataset.placed && !win.classList.contains('is-maximized')) {
            const offset = (cascadeStep++ % 6) * 26;
            const pos = clampWindowPosition(win, win.offsetLeft + offset, win.offsetTop + offset);
            win.style.left = pos.left + 'px';
            win.style.top  = pos.top + 'px';
            win.dataset.placed = '1';
        }

        bringToFront(windowId);
        updateDockRunningIndicators();
        syncFullscreenState();
        if (typeof playSystemSound === 'function') playSystemSound('windowOpen');

        // Authentic macOS dock bounce on open
        const dockMapLookup = {
            'finder-window': 'dock-finder', 'mail-window': 'dock-mail', 'notes-window': 'dock-notes',
            'safari-window': 'dock-safari', 'appstore-window': 'dock-appstore', 'settings-window': 'dock-settings',
            'terminal-window': 'dock-terminal', 'trash-window': 'dock-trash', 'photos-window': 'dock-photos',
            'photobooth-window': 'dock-photobooth', 'music-window': 'dock-music', 'breakout-window': 'dock-breakout',
            'snake-window': 'dock-snake'
        };
        const dockEl = document.getElementById(dockMapLookup[windowId]);
        if (dockEl) {
            dockEl.classList.remove('bouncing');
            void dockEl.offsetWidth;
            dockEl.classList.add('bouncing');
            setTimeout(() => dockEl.classList.remove('bouncing'), 750);
        }
        
        if (windowId === 'safari-window' && typeof renderSafariTabs === 'function') {
            renderSafariTabs();
            if (typeof activeSafariTabId !== 'undefined' && typeof switchSafariTab === 'function') {
                switchSafariTab(activeSafariTabId);
            }
        }
        if (windowId === 'photobooth-window' && typeof initPhotoBoothCamera === 'function') {
            initPhotoBoothCamera();
        }
    }
}

function closeWindow(windowId) {
    const win = document.getElementById(windowId);
    if (win) {
        if (win.classList.contains('hidden')) return; // Guard against re-entrant calls
        win.classList.add('hidden');
        win.classList.remove('is-active');
        delete win.dataset.placed;
        if (typeof playSystemSound === 'function') playSystemSound('windowClose');
        if (windowId === 'safari-window' && typeof stopSafariMedia === 'function') {
            stopSafariMedia();
        }
        if (windowId === 'photobooth-window' && typeof stopPhotoBoothCamera === 'function') {
            stopPhotoBoothCamera();
        }
        if (windowId === 'breakout-window' && typeof closeBreakout === 'function') {
            closeBreakout();
        }
        if (windowId === 'snake-window' && typeof closeSnake === 'function') {
            closeSnake();
        }
        updateDockRunningIndicators();
        updateWindowFocusStates();
        syncFullscreenState();
    }
}

function minimizeWindow(windowId) {
    const win = document.getElementById(windowId);
    if (!win) return;
    win.classList.add('minimized');
    if (typeof playSystemSound === 'function') playSystemSound('windowMinimize');
    // A minimised Safari kept playing audio from an invisible window.
    if (windowId === 'safari-window' && typeof stopSafariMedia === 'function') {
        stopSafariMedia();
    }
    if (windowId === 'breakout-window' && typeof toggleBreakoutPause === 'function') {
        toggleBreakoutPause();
    }
    if (windowId === 'snake-window' && typeof toggleSnakePause === 'function') {
        toggleSnakePause();
    }
    updateDockRunningIndicators();
    updateWindowFocusStates();
    syncFullscreenState();
}

function maximizeWindow(windowId) {
    const win = document.getElementById(windowId);
    if (!win) return;

    // State lives in a class, not in a string comparison against inline CSS
    if (win.classList.contains('is-maximized')) {
        win.classList.remove('is-maximized');
        win.style.width  = win.dataset.restoreWidth  || '';
        win.style.height = win.dataset.restoreHeight || '';
        win.style.top    = win.dataset.restoreTop    || '';
        win.style.left   = win.dataset.restoreLeft   || '';
    } else {
        const rect = win.getBoundingClientRect();
        win.dataset.restoreWidth  = win.style.width  || rect.width + 'px';
        win.dataset.restoreHeight = win.style.height || rect.height + 'px';
        win.dataset.restoreTop    = win.style.top    || rect.top + 'px';
        win.dataset.restoreLeft   = win.style.left   || rect.left + 'px';
        win.classList.add('is-maximized');
        win.style.top = ''; win.style.left = ''; win.style.width = ''; win.style.height = '';
    }
    bringToFront(windowId);
    syncFullscreenState();
}

function getActiveWindow() {
    let topWin = null;
    let maxZ = -1;
    document.querySelectorAll('.window:not(.hidden):not(.minimized)').forEach(w => {
        const z = parseInt(w.style.zIndex || 0, 10);
        if (z > maxZ) {
            maxZ = z;
            topWin = w;
        }
    });
    return topWin;
}

function closeActiveWindow() {
    const win = getActiveWindow();
    if (win) closeWindow(win.id);
}

function minimizeActiveWindow() {
    const win = getActiveWindow();
    if (win) minimizeWindow(win.id);
}

function maximizeActiveWindow() {
    const win = getActiveWindow();
    if (win) maximizeWindow(win.id);
}

// ── Dragging ───────────────────────────────────────────────────────────────
const MENU_BAR_HEIGHT = 28;
const MIN_VISIBLE_EDGE = 80;   // px of title bar that must stay on screen

/**
 * Keeps a window reachable. Previously only `top` was clamped, so a window
 * could be dragged off the left/right/bottom and never recovered.
 */
function clampWindowPosition(win, left, top) {
    const w = win.offsetWidth;
    const maxLeft = window.innerWidth - MIN_VISIBLE_EDGE;
    const minLeft = MIN_VISIBLE_EDGE - w;
    const maxTop  = window.innerHeight - MENU_BAR_HEIGHT - 12;
    return {
        left: Math.min(Math.max(left, minLeft), maxLeft),
        top:  Math.min(Math.max(top, MENU_BAR_HEIGHT), maxTop)
    };
}

function dragMouseDown(e, windowId) {
    e = e || window.event;

    if (e.target.classList.contains('control') || e.target.tagName === 'INPUT' ||
        e.target.tagName === 'BUTTON' || e.target.closest('button')) return;

    const win = document.getElementById(windowId);
    if (!win) return;

    bringToFront(windowId);

    // Maximised windows don't drag (matches macOS full-screen behaviour)
    if (win.classList.contains('is-maximized')) return;

    const touch = e.touches ? e.touches[0] : null;
    let lastX = touch ? touch.clientX : e.clientX;
    let lastY = touch ? touch.clientY : e.clientY;

    if (e.cancelable) e.preventDefault();

    function onMove(ev) {
        const pt = ev.touches ? ev.touches[0] : ev;
        const dx = pt.clientX - lastX;
        const dy = pt.clientY - lastY;
        lastX = pt.clientX;
        lastY = pt.clientY;

        const pos = clampWindowPosition(win, win.offsetLeft + dx, win.offsetTop + dy);
        win.style.left = pos.left + 'px';
        win.style.top  = pos.top + 'px';
        win.dataset.placed = '1';
        if (ev.cancelable) ev.preventDefault();
    }

    function onEnd() {
        // Scoped listeners instead of document.onmousemove/onmouseup, which
        // were global slots that clobbered any other handler on the page.
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
}

// Nudge windows back on screen if the viewport shrinks below them.
window.addEventListener('resize', () => {
    document.querySelectorAll('.window:not(.hidden)').forEach(win => {
        if (win.classList.contains('is-maximized')) return;
        const pos = clampWindowPosition(win, win.offsetLeft, win.offsetTop);
        win.style.left = pos.left + 'px';
        win.style.top  = pos.top + 'px';
    });
});

// Enable smooth edge/corner resizing and title bar double-click zoom
function initWindowInteraction() {
    const RESIZE_BORDER = 10;
    let resizingWin = null;
    let resizeDir = '';
    let startX = 0, startY = 0, startW = 0, startH = 0, startL = 0, startT = 0;

    // Double click title bar to toggle maximize
    document.addEventListener('dblclick', (e) => {
        const titleBar = e.target.closest('.title-bar');
        if (titleBar && !e.target.closest('.control')) {
            const win = titleBar.closest('.window');
            if (win) maximizeWindow(win.id);
        }
    });

    // Mouse down for window edge/corner resizing
    document.addEventListener('mousedown', (e) => {
        if (e.target.closest('.control') || e.target.closest('.title-bar') || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        const win = e.target.closest('.window');
        if (!win || win.classList.contains('is-maximized')) return;

        const rect = win.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        let dir = '';

        const nearTop = y <= RESIZE_BORDER;
        const nearBottom = y >= rect.height - RESIZE_BORDER;
        const nearLeft = x <= RESIZE_BORDER;
        const nearRight = x >= rect.width - RESIZE_BORDER;

        if (nearTop && nearLeft) dir = 'nw';
        else if (nearTop && nearRight) dir = 'ne';
        else if (nearBottom && nearLeft) dir = 'sw';
        else if (nearBottom && nearRight) dir = 'se';
        else if (nearTop) dir = 'n';
        else if (nearBottom) dir = 's';
        else if (nearLeft) dir = 'w';
        else if (nearRight) dir = 'e';

        if (dir) {
            resizingWin = win;
            resizeDir = dir;
            startX = e.clientX;
            startY = e.clientY;
            startW = rect.width;
            startH = rect.height;
            startL = win.offsetLeft;
            startT = win.offsetTop;
            bringToFront(win.id);
            e.preventDefault();
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (resizingWin) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            const minW = parseInt(window.getComputedStyle(resizingWin).minWidth, 10) || 400;
            const minH = parseInt(window.getComputedStyle(resizingWin).minHeight, 10) || 250;

            if (resizeDir.includes('e')) {
                resizingWin.style.width = Math.max(minW, startW + dx) + 'px';
            }
            if (resizeDir.includes('s')) {
                resizingWin.style.height = Math.max(minH, startH + dy) + 'px';
            }
            if (resizeDir.includes('w')) {
                const newW = Math.max(minW, startW - dx);
                resizingWin.style.width = newW + 'px';
                if (newW > minW) resizingWin.style.left = (startL + dx) + 'px';
            }
            if (resizeDir.includes('n')) {
                const newH = Math.max(minH, startH - dy);
                resizingWin.style.height = newH + 'px';
                if (newH > minH) resizingWin.style.top = (startT + dy) + 'px';
            }
            resizingWin.dataset.placed = '1';
        }
    });

    document.addEventListener('mouseup', () => {
        resizingWin = null;
        resizeDir = '';
    });
}

// ── macOS Fullscreen Edge Hover & Reveal Controller ────────────────────────
let menuHideTimer = null;
let dockHideTimer = null;

function initFullscreenEdgeReveal() {
    const menubar = document.querySelector('.menu-bar');
    const dockContainer = document.querySelector('.dock-container');

    document.addEventListener('mousemove', (e) => {
        if (!document.body.classList.contains('has-fullscreen-app')) return;

        const y = e.clientY;
        const h = window.innerHeight;

        // Top edge trigger (cursor pushes to top edge <= 8px or inside menu-bar)
        if (y <= 8) {
            if (menuHideTimer) { clearTimeout(menuHideTimer); menuHideTimer = null; }
            if (menubar) menubar.classList.add('is-revealed');
        } else if (y > 38 && menubar && menubar.classList.contains('is-revealed')) {
            const hasOpenMenu = !!document.querySelector('.menu-dropdown:not(.hidden)');
            if (!hasOpenMenu && !menubar.matches(':hover')) {
                if (!menuHideTimer) {
                    menuHideTimer = setTimeout(() => {
                        const stillHovered = menubar.matches(':hover') || !!document.querySelector('.menu-dropdown:not(.hidden)');
                        if (!stillHovered) {
                            menubar.classList.remove('is-revealed');
                        }
                        menuHideTimer = null;
                    }, 220);
                }
            }
        }

        // Bottom edge trigger (cursor pushes to bottom edge >= h - 10px or inside dock)
        if (y >= h - 10) {
            if (dockHideTimer) { clearTimeout(dockHideTimer); dockHideTimer = null; }
            if (dockContainer) dockContainer.classList.add('is-revealed');
        } else if (y < h - 90 && dockContainer && dockContainer.classList.contains('is-revealed')) {
            if (!dockContainer.matches(':hover')) {
                if (!dockHideTimer) {
                    dockHideTimer = setTimeout(() => {
                        if (!dockContainer.matches(':hover')) {
                            dockContainer.classList.remove('is-revealed');
                        }
                        dockHideTimer = null;
                    }, 240);
                }
            }
        }
    });

    if (menubar) {
        menubar.addEventListener('mouseenter', () => {
            if (menuHideTimer) { clearTimeout(menuHideTimer); menuHideTimer = null; }
            if (document.body.classList.contains('has-fullscreen-app')) {
                menubar.classList.add('is-revealed');
            }
        });
        menubar.addEventListener('mouseleave', () => {
            if (document.body.classList.contains('has-fullscreen-app')) {
                const hasOpenMenu = !!document.querySelector('.menu-dropdown:not(.hidden)');
                if (!hasOpenMenu) {
                    if (menuHideTimer) clearTimeout(menuHideTimer);
                    menuHideTimer = setTimeout(() => {
                        if (!menubar.matches(':hover') && !document.querySelector('.menu-dropdown:not(.hidden)')) {
                            menubar.classList.remove('is-revealed');
                        }
                        menuHideTimer = null;
                    }, 220);
                }
            }
        });
    }

    if (dockContainer) {
        dockContainer.addEventListener('mouseenter', () => {
            if (dockHideTimer) { clearTimeout(dockHideTimer); dockHideTimer = null; }
            if (document.body.classList.contains('has-fullscreen-app')) {
                dockContainer.classList.add('is-revealed');
            }
        });
        dockContainer.addEventListener('mouseleave', () => {
            if (document.body.classList.contains('has-fullscreen-app')) {
                if (dockHideTimer) clearTimeout(dockHideTimer);
                dockHideTimer = setTimeout(() => {
                    if (!dockContainer.matches(':hover')) {
                        dockContainer.classList.remove('is-revealed');
                    }
                    dockHideTimer = null;
                }, 240);
            }
        });
    }
}

function initWindowManager() {
    initWindowInteraction();
    initFullscreenEdgeReveal();
    syncFullscreenState();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWindowManager);
} else {
    initWindowManager();
}

