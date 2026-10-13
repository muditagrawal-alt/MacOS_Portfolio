/* ==========================================================================
   macOS Mission Control (Exposé) Controller
   ========================================================================== */

(function() {
    let isMissionControlActive = false;
    let savedWindowStates = [];

    const APP_ICONS = {
        'finder-window': 'assets/icons/finder.png',
        'safari-window': 'assets/icons/safari.png',
        'mail-window': 'assets/icons/mail.png',
        'notes-window': 'assets/icons/notes.png',
        'terminal-window': 'assets/icons/terminal.png',
        'music-window': 'assets/icons/app-store.png',
        'photobooth-window': 'assets/icons/photobooth.svg',
        'snake-window': 'assets/icons/snake.svg',
        'breakout-window': 'assets/icons/breakout.svg',
        'settings-window': 'assets/icons/settings.png',
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

        if (openWindows.length === 0) {
            // If no windows are currently open, open Finder and Apple Music to showcase
            if (typeof openWindow === 'function') {
                openWindow('finder-window');
            }
            setTimeout(enterMissionControl, 150);
            return;
        }

        isMissionControlActive = true;
        document.body.classList.add('mission-control-active');
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
                const titleText = win.querySelector('.window-title')?.textContent || 'App';
                badge.innerHTML = `<img src="${iconSrc}" alt="Icon"> <span>${titleText}</span>`;
                win.appendChild(badge);
            }

            // Click window to select and bring to front
            win.dataset.mcClick = '1';
            win.onclick = function(e) {
                if (!isMissionControlActive) return;
                e.stopPropagation();
                exitMissionControl(win.id);
            };
        });
    }

    function exitMissionControl(selectedWinId = null) {
        if (!isMissionControlActive) return;
        isMissionControlActive = false;
        document.body.classList.remove('mission-control-active');
        if (typeof playSystemSound === 'function') playSystemSound('windowClose');

        savedWindowStates.forEach(state => {
            const win = state.el;
            win.classList.remove('in-mission-control');
            win.style.transform = state.transform || '';
            const badge = win.querySelector('.mc-window-badge');
            if (badge) badge.remove();
            win.onclick = null;
        });

        savedWindowStates = [];

        if (selectedWinId && typeof bringToFront === 'function') {
            bringToFront(selectedWinId);
        }
    }

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
