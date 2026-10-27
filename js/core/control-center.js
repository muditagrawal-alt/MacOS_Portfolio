/* ==========================================================================
   macOS Control Centre — every tile does something real
   --------------------------------------------------------------------------
   • Appearance  → the same Frosted Glass theme System Settings controls
                   (it used to toggle a `light-theme` class with no CSS at all)
   • Display     → a full-screen veil, so the menu bar and Dock dim too
                   (it used to filter only .desktop)
   • Sound       → master volume: system sounds AND Music
   • Battery     → the real Battery Status API reading (was a hardcoded 85%)
   • Now Playing → live Music state
   ========================================================================== */

(function() {
    let ccOpen = false;
    let wifiActive = true;
    let bluetoothActive = true;
    let airdropActive = true;
    let dndActive = false;
    let displayBrightness = 100;
    let lastTick = 0;

    try {
        const savedBright = localStorage.getItem('macos_display_brightness');
        if (savedBright !== null) displayBrightness = Math.min(100, Math.max(35, parseInt(savedBright, 10) || 100));
    } catch (e) { /* storage unavailable — default brightness */ }

    function ensureControlCenterDom() {
        if (document.getElementById('control-center-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'control-center-panel';
        panel.className = 'control-center-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Control Centre');

        const currentVol = typeof window.getMasterVolume === 'function' ? Math.round(window.getMasterVolume() * 100) : 80;
        const glass = typeof currentThemeMode === 'function' && currentThemeMode() === 'glass';

        panel.innerHTML = `
            <div class="cc-grid-row">
                <div class="cc-card cc-connectivity-box">
                    <button type="button" class="cc-toggle-item active" id="cc-toggle-wifi" onclick="toggleCcWifi()" aria-pressed="true">
                        <div class="cc-toggle-icon"><i class="fas fa-wifi"></i></div>
                        <div class="cc-toggle-text">
                            <span class="cc-toggle-title">Wi-Fi</span>
                            <span class="cc-toggle-sub" id="cc-wifi-sub">${navigator.onLine === false ? 'Offline' : 'Connected'}</span>
                        </div>
                    </button>
                    <button type="button" class="cc-toggle-item active" id="cc-toggle-bt" onclick="toggleCcBt()" aria-pressed="true">
                        <div class="cc-toggle-icon"><i class="fab fa-bluetooth-b"></i></div>
                        <div class="cc-toggle-text">
                            <span class="cc-toggle-title">Bluetooth</span>
                            <span class="cc-toggle-sub" id="cc-bt-sub">On</span>
                        </div>
                    </button>
                    <button type="button" class="cc-toggle-item active" id="cc-toggle-airdrop" onclick="toggleCcAirDrop()" aria-pressed="true">
                        <div class="cc-toggle-icon"><i class="fas fa-tower-broadcast"></i></div>
                        <div class="cc-toggle-text">
                            <span class="cc-toggle-title">AirDrop</span>
                            <span class="cc-toggle-sub" id="cc-airdrop-sub">Everyone</span>
                        </div>
                    </button>
                </div>

                <div class="cc-quick-column">
                    <button type="button" class="cc-action-btn" id="cc-btn-dnd" onclick="toggleCcDnd()" aria-pressed="false">
                        <div class="cc-toggle-icon"><i class="fas fa-moon"></i></div>
                        <div class="cc-toggle-text">
                            <span class="cc-toggle-title">Focus</span>
                            <span class="cc-toggle-sub" id="cc-dnd-sub">Off</span>
                        </div>
                    </button>
                    <button type="button" class="cc-action-btn ${glass ? 'active' : ''}" id="cc-btn-theme" onclick="toggleCcTheme()" aria-pressed="${glass}">
                        <div class="cc-toggle-icon"><i class="fas fa-circle-half-stroke"></i></div>
                        <div class="cc-toggle-text">
                            <span class="cc-toggle-title">Frosted Glass</span>
                            <span class="cc-toggle-sub" id="cc-theme-sub">${glass ? 'On' : 'Off'}</span>
                        </div>
                    </button>
                    <button type="button" class="cc-action-btn" onclick="closeControlCenter(); toggleMissionControl();">
                        <div class="cc-toggle-icon"><i class="fas fa-table-cells-large"></i></div>
                        <div class="cc-toggle-text">
                            <span class="cc-toggle-title">Mission Control</span>
                            <span class="cc-toggle-sub">F3</span>
                        </div>
                    </button>
                </div>
            </div>

            <div class="cc-slider-card">
                <div class="cc-slider-header">
                    <span>Display</span>
                    <span id="cc-bright-label">${displayBrightness}%</span>
                </div>
                <div class="cc-slider-track-wrap">
                    <i class="fas fa-sun cc-slider-icon"></i>
                    <div class="cc-slider-fill" id="cc-bright-fill" style="width: ${displayBrightness}%;"></div>
                    <input type="range" class="cc-slider-input" id="cc-bright-input" min="35" max="100" value="${displayBrightness}" oninput="setCcBrightness(this.value)" aria-label="Display Brightness">
                </div>
            </div>

            <div class="cc-slider-card">
                <div class="cc-slider-header">
                    <span>Sound</span>
                    <span id="cc-vol-label">${currentVol}%</span>
                </div>
                <div class="cc-slider-track-wrap">
                    <i class="fas fa-volume-high cc-slider-icon" id="cc-vol-icon"></i>
                    <div class="cc-slider-fill" id="cc-vol-fill" style="width: ${currentVol}%;"></div>
                    <input type="range" class="cc-slider-input" id="cc-vol-input" min="0" max="100" value="${currentVol}" oninput="setCcVolume(this.value)" aria-label="Sound Volume">
                </div>
            </div>

            <div class="cc-now-playing-card">
                <div class="cc-music-art" id="cc-music-art"><i class="fas fa-music"></i></div>
                <div class="cc-music-meta">
                    <span class="cc-music-title" id="cc-music-title">Music</span>
                    <span class="cc-music-artist" id="cc-music-artist">Not Playing</span>
                </div>
                <div class="cc-music-controls">
                    <button type="button" class="cc-music-btn cc-music-play-btn" id="cc-play-btn" onclick="triggerCcPlayPause()" aria-label="Play/Pause">
                        <i class="fas fa-play" style="margin-left:2px;"></i>
                    </button>
                    <button type="button" class="cc-music-btn" onclick="closeControlCenter(); openMusic();" aria-label="Open Music" title="Open Music">
                        <i class="fas fa-up-right-from-square"></i>
                    </button>
                </div>
            </div>

            <div class="cc-bottom-row">
                <div class="cc-battery-pill">
                    <i class="fas fa-battery-three-quarters" id="cc-battery-icon"></i>
                    <span id="cc-battery-text">Battery</span>
                </div>
                <button type="button" class="cc-edit-link" onclick="closeControlCenter(); openSettingsPane('desktop-dock');">Settings…</button>
            </div>
        `;

        document.body.appendChild(panel);
        syncBattery();
    }

    function ensureDimmer() {
        let veil = document.getElementById('display-dimmer');
        if (!veil) {
            veil = document.createElement('div');
            veil.id = 'display-dimmer';
            veil.setAttribute('aria-hidden', 'true');
            document.body.appendChild(veil);
        }
        return veil;
    }

    function toggleControlCenter() {
        ensureControlCenterDom();
        ccOpen ? closeControlCenter() : openControlCenter();
    }

    function openControlCenter() {
        ensureControlCenterDom();
        const panel = document.getElementById('control-center-panel');
        if (!panel) return;
        panel.classList.add('open');
        ccOpen = true;
        if (typeof playSystemSound === 'function') playSystemSound('pop');
        syncNowPlayingWithMusic();
        syncBattery();
    }

    function closeControlCenter() {
        const panel = document.getElementById('control-center-panel');
        if (panel) panel.classList.remove('open');
        ccOpen = false;
    }

    document.addEventListener('click', (e) => {
        if (!ccOpen) return;
        const panel = document.getElementById('control-center-panel');
        const trigger = document.getElementById('control-center-trigger');
        if (panel && !panel.contains(e.target) && trigger && !trigger.contains(e.target)) {
            closeControlCenter();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (ccOpen && e.key === 'Escape') closeControlCenter();
    });

    function setToggle(id, subId, on, onText, offText) {
        const el = document.getElementById(id);
        const sub = document.getElementById(subId);
        if (el) { el.classList.toggle('active', on); el.setAttribute('aria-pressed', String(on)); }
        if (sub) sub.textContent = on ? onText : offText;
        if (typeof playSystemSound === 'function') playSystemSound('click');
    }

    /* ── Toggles ───────────────────────────────────────────────────────── */
    window.toggleCcWifi = function() {
        wifiActive = !wifiActive;
        setToggle('cc-toggle-wifi', 'cc-wifi-sub', wifiActive, navigator.onLine === false ? 'Offline' : 'Connected', 'Off');
        const wifiMenu = document.getElementById('wifi-icon');
        if (wifiMenu) wifiMenu.style.opacity = wifiActive ? '' : '0.4';
    };

    window.toggleCcBt = function() {
        bluetoothActive = !bluetoothActive;
        setToggle('cc-toggle-bt', 'cc-bt-sub', bluetoothActive, 'On', 'Off');
    };

    window.toggleCcAirDrop = function() {
        airdropActive = !airdropActive;
        setToggle('cc-toggle-airdrop', 'cc-airdrop-sub', airdropActive, 'Everyone', 'Receiving Off');
    };

    window.toggleCcDnd = function() {
        dndActive = !dndActive;
        document.body.classList.toggle('focus-mode', dndActive);
        setToggle('cc-btn-dnd', 'cc-dnd-sub', dndActive, 'Do Not Disturb', 'Off');
    };

    window.toggleCcTheme = function() {
        if (typeof toggleTheme === 'function') toggleTheme();
        if (typeof playSystemSound === 'function') playSystemSound('pop');
    };

    // Called by settings.js whenever the theme changes, from anywhere.
    window.syncControlCentreTheme = function(mode) {
        const el = document.getElementById('cc-btn-theme');
        const sub = document.getElementById('cc-theme-sub');
        const on = mode === 'glass';
        if (el) { el.classList.toggle('active', on); el.setAttribute('aria-pressed', String(on)); }
        if (sub) sub.textContent = on ? 'On' : 'Off';
    };

    /* ── Brightness & Volume ─────────────────────────────────────────── */
    window.setCcBrightness = function(val) {
        displayBrightness = Math.min(100, Math.max(35, parseInt(val, 10) || 100));
        const fill = document.getElementById('cc-bright-fill');
        const label = document.getElementById('cc-bright-label');
        if (fill) fill.style.width = displayBrightness + '%';
        if (label) label.textContent = displayBrightness + '%';
        applyBrightness(displayBrightness);
        try { localStorage.setItem('macos_display_brightness', displayBrightness); } catch (e) { /* non-fatal */ }
    };

    function applyBrightness(val) {
        // 100% → fully transparent veil; 35% → ~0.6 black.
        ensureDimmer().style.opacity = String(((100 - val) / 100).toFixed(3));
    }

    window.setCcVolume = function(val) {
        const vol = parseInt(val, 10) || 0;
        const fill = document.getElementById('cc-vol-fill');
        const label = document.getElementById('cc-vol-label');
        const icon = document.getElementById('cc-vol-icon');
        if (fill) fill.style.width = vol + '%';
        if (label) label.textContent = vol + '%';
        if (icon) {
            icon.className = vol === 0 ? 'fas fa-volume-xmark cc-slider-icon' : (vol < 45 ? 'fas fa-volume-low cc-slider-icon' : 'fas fa-volume-high cc-slider-icon');
        }
        if (typeof setMasterVolume === 'function') setMasterVolume(vol / 100);
        // One soft tick per ~90ms of dragging, not one per input event.
        const now = Date.now();
        if (now - lastTick > 90 && typeof playSystemSound === 'function') {
            lastTick = now;
            playSystemSound('tick');
        }
    };

    /* ── Battery ─────────────────────────────────────────────────────── */
    function syncBattery() {
        const text = document.getElementById('cc-battery-text');
        const icon = document.getElementById('cc-battery-icon');
        if (!text) return;
        const level = window.SYSTEM_BATTERY_LEVEL;
        const charging = Boolean(window.SYSTEM_BATTERY_CHARGING);
        if (typeof level !== 'number') { text.textContent = 'Battery'; return; }
        text.textContent = `${level}%${charging ? ' · Charging' : ''}`;
        if (icon) {
            icon.className = 'fas ' + (charging ? 'fa-bolt' : level <= 15 ? 'fa-battery-quarter' : level <= 40 ? 'fa-battery-half' : level <= 75 ? 'fa-battery-three-quarters' : 'fa-battery-full');
            icon.style.color = charging || level > 20 ? '#30d158' : '#ff453a';
        }
    }
    window.addEventListener('battery-status-changed', syncBattery);

    /* ── Now Playing ─────────────────────────────────────────────────── */
    function syncNowPlayingWithMusic(state) {
        const s = state || (typeof window.getMusicState === 'function' ? window.getMusicState() : null);
        const titleEl = document.getElementById('cc-music-title');
        const artistEl = document.getElementById('cc-music-artist');
        const playBtn = document.getElementById('cc-play-btn');
        const art = document.getElementById('cc-music-art');
        if (!titleEl || !s) return;
        titleEl.textContent = s.title || 'Music';
        artistEl.textContent = s.subtitle || (s.playing ? '' : 'Not Playing');
        if (art && s.color) art.style.background = s.color;
        if (playBtn) playBtn.innerHTML = s.playing ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play" style="margin-left:2px;"></i>';
    }
    window.addEventListener('music-state', (e) => syncNowPlayingWithMusic(e.detail));

    window.triggerCcPlayPause = function() {
        if (typeof window.toggleMusicPlay === 'function') window.toggleMusicPlay();
        else openWindow('music-window');
    };

    document.addEventListener('DOMContentLoaded', () => applyBrightness(displayBrightness));

    window.toggleControlCenter = toggleControlCenter;
    window.openControlCenter = openControlCenter;
    window.closeControlCenter = closeControlCenter;
    window.syncNowPlayingWithMusic = syncNowPlayingWithMusic;
})();
