/* ==========================================================================
   macOS Mission Control (Exposé) Controller
   ========================================================================== */

(function() {
    let isMissionControlActive = false;
    let savedWindowStates = [];

    const APP_ICONS = {
        'welcome-window': 'assets/Professionalimage.jpeg',
        'finder-window': 'assets/icons/finder.png',
        'safari-window': 'assets/icons/safari.png',
        'mail-window': 'assets/icons/mail.png',
        'notes-window': 'assets/icons/notes.png',
        'terminal-window': 'assets/icons/terminal.png',
        'music-window': 'assets/icons/music.png',
        'photos-window': 'assets/icons/photos.png',
        'photobooth-window': 'assets/icons/photobooth.svg',
        'snake-window': 'assets/icons/snake.svg',
        'breakout-window': 'assets/icons/breakout.svg',
        'appstore-window': 'assets/icons/app-store.png',
        'settings-window': 'assets/icons/settings.png',
        'textedit-window': 'assets/icons/filetype-txt.svg',
        'resume-window': 'assets/icons/filetype-pdf.svg',
        'dmg-window': 'assets/icons/filetype-dmg.svg',
        'trash-window': 'assets/icons/trash-full.png'
    };

    function ensureMissionControlDom() {
        if (document.getElementById('mission-control-bar')) return;

        // Spaces Bar at top
        const bar = document.createElement('div');
        bar.id = 'mission-control-bar';
        bar.className = 'mission-control-bar';
        bar.innerHTML = `
            <div class="mc-space-item" onclick="toggleMissionControl()">
                <div class="mc-space-thumb"></div>
                <span class="mc-space-label">Desktop 1</span>
            </div>
        `;
        document.body.appendChild(bar);

        // Dimmer overlay
        const overlay = document.createElement('div');
        overlay.id = 'mission-control-overlay';
        overlay.className = 'mission-control-overlay';
        overlay.onclick = () => exitMissionControl();
        document.body.appendChild(overlay);
    }

    function toggleMissionControl() {
        isMissionControlActive ? exitMissionControl() : enterMissionControl();
    }

    function enterMissionControl() {
        ensureMissionControlDom();
        const openWindows = Array.from(document.querySelectorAll('.window:not(.hidden):not(.minimized)'));

        isMissionControlActive = true;
        document.body.classList.add('mission-control-active');
        // The Space thumbnail shows whatever wallpaper is actually set.
        const thumb = document.querySelector('.mc-space-thumb');
        if (thumb) thumb.style.backgroundImage = getComputedStyle(document.body).backgroundImage;

        // With nothing open, macOS still shows Mission Control — just the
        // Spaces bar over an empty desktop. Say so instead of doing nothing.
        let empty = document.getElementById('mission-control-empty');
        if (openWindows.length === 0) {
            if (!empty) {
                empty = document.createElement('div');
                empty.id = 'mission-control-empty';
                empty.className = 'mission-control-empty';
                empty.innerHTML = '<i class="fas fa-table-cells-large"></i><span>No open windows</span><small>Open an app, then press F3 to see every window at once.</small>';
                document.body.appendChild(empty);
            }
            empty.classList.add('visible');
            savedWindowStates = [];
            if (typeof playSystemSound === 'function') playSystemSound('windowOpen');
            return;
        }
        if (empty) empty.classList.remove('visible');
        if (typeof playSystemSound === 'function') playSystemSound('windowOpen');

        // Save original styles
        savedWindowStates = openWindows.map(win => ({
            el: win,
            left: win.style.left,
            top: win.style.top,
            transform: win.style.transform,
            transition: win.style.transition,
            zIndex: win.style.zIndex
        }));

        // Compute grid arrangement
        const count = openWindows.length;
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const topOffset = 130; // below space bar
        const bottomOffset = 90; // above dock
        const availH = screenH - topOffset - bottomOffset;

        let cols = count === 1 ? 1 : (count <= 4 ? 2 : 3);
        let rows = Math.ceil(count / cols);

        const cellW = screenW / cols;
        const cellH = availH / rows;

        openWindows.forEach((win, idx) => {
            const col = idx % cols;
            const row = Math.floor(idx / cols);

            const targetCenterX = col * cellW + cellW / 2;
            const targetCenterY = topOffset + row * cellH + cellH / 2;

            const winRect = win.getBoundingClientRect();
            const winW = winRect.width || 650;
            const winH = winRect.height || 400;

            const scale = Math.min(0.55, (cellW * 0.85) / winW, (cellH * 0.82) / winH);

            win.style.setProperty('--mc-scale', scale);
            win.classList.add('in-mission-control');

            const currentLeft = win.offsetLeft;
            const currentTop = win.offsetTop;
            const targetLeft = targetCenterX - winW / 2;
            const targetTop = targetCenterY - winH / 2;

            const transX = targetLeft - currentLeft;
            const transY = targetTop - currentTop;

            win.style.transform = `translate(${transX}px, ${transY}px) scale(${scale})`;

            // Add title badge if not present
            let badge = win.querySelector('.mc-window-badge');
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'mc-window-badge';
                const iconSrc = APP_ICONS[win.id] || 'assets/icons/finder.png';
                // The app's own name (Safari has no .window-title element).
                const appName = (typeof APP_MENUS === 'object' && APP_MENUS[win.id]) ? APP_MENUS[win.id].name : null;
                const titleText = appName || win.querySelector('.window-title')?.textContent || 'App';
                badge.innerHTML = `<img src="${escapeHtml(iconSrc)}" alt=""> <span>${escapeHtml(titleText)}</span>`;
                win.appendChild(badge);
            }

            win.dataset.mcClick = '1';
        });
    }

    function exitMissionControl(selectedWinId = null) {
        if (!isMissionControlActive) return;
        isMissionControlActive = false;
        document.body.classList.remove('mission-control-active');
        const empty = document.getElementById('mission-control-empty');
        if (empty) empty.classList.remove('visible');
        if (typeof playSystemSound === 'function') playSystemSound('windowClose');

        savedWindowStates.forEach(state => {
            const win = state.el;
            win.classList.remove('in-mission-control');
            win.style.transform = state.transform || '';
            const badge = win.querySelector('.mc-window-badge');
            if (badge) badge.remove();
            delete win.dataset.mcClick;
        });

        savedWindowStates = [];

        if (selectedWinId && typeof bringToFront === 'function') {
            bringToFront(selectedWinId);
        }
    }

    // A click anywhere on a thumbnail picks that window. Captured at the
    // document so the app's own handlers inside the window (Finder rows,
    // buttons, drag/resize) never see it — they used to swallow the click.
    ['mousedown', 'click'].forEach(type => document.addEventListener(type, (e) => {
        if (!isMissionControlActive) return;
        const win = e.target instanceof Element && e.target.closest('.window.in-mission-control');
        if (!win) return;
        e.preventDefault();
        e.stopPropagation();
        if (type === 'click') exitMissionControl(win.id);
    }, true));

    // Keyboard bindings (F3 or Esc)
    window.addEventListener('keydown', (e) => {
        if (e.key === 'F3') {
            e.preventDefault();
            toggleMissionControl();
        } else if (isMissionControlActive && e.key === 'Escape') {
            e.preventDefault();
            exitMissionControl();
        }
    });

    // Expose globally
    window.toggleMissionControl = toggleMissionControl;
    window.enterMissionControl = enterMissionControl;
    window.exitMissionControl = exitMissionControl;
})();
