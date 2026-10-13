/* ==========================================================================
   macOS Control Center Controller — Big Sur / Sequoia Glassmorphic Panel
   ========================================================================== */

(function() {
    let ccOpen = false;
    let wifiActive = true;
    let bluetoothActive = true;
    let airdropActive = true;
    let dndActive = false;
    let displayBrightness = 100;

    // Load saved preferences
    try {
        const savedBright = localStorage.getItem('macos_display_brightness');
        if (savedBright !== null) displayBrightness = parseInt(savedBright, 10) || 100;
    } catch (e) {}

    function ensureControlCenterDom() {
        if (document.getElementById('control-center-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'control-center-panel';
        panel.className = 'control-center-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Control Centre');

        const currentVol = typeof window.getMasterVolume === 'function' ? Math.round(window.getMasterVolume() * 100) : 80;

        panel.innerHTML = `
            <!-- Top Grid: Connectivity & Toggles -->
            <div class="cc-grid-row">
                <div class="cc-card cc-connectivity-box">
                    <div class="cc-toggle-item active" id="cc-toggle-wifi" onclick="toggleCcWifi()">
                        <div class="cc-toggle-icon"><i class="fas fa-wifi"></i></div>
                        <div class="cc-toggle-text">
                            <span class="cc-toggle-title">Wi-Fi</span>
                            <span class="cc-toggle-sub" id="cc-wifi-sub">Mudit's 5G</span>
                        </div>
                    </div>
                    <div class="cc-toggle-item active" id="cc-toggle-bt" onclick="toggleCcBt()">
                        <div class="cc-toggle-icon"><i class="fab fa-bluetooth-b"></i></div>
                        <div class="cc-toggle-text">
                            <span class="cc-toggle-title">Bluetooth</span>
                            <span class="cc-toggle-sub" id="cc-bt-sub">AirPods Pro</span>
                        </div>
                    </div>
                    <div class="cc-toggle-item active" id="cc-toggle-airdrop" onclick="toggleCcAirDrop()">
                        <div class="cc-toggle-icon"><i class="fas fa-rss"></i></div>
                        <div class="cc-toggle-text">
                            <span class="cc-toggle-title">AirDrop</span>
                            <span class="cc-toggle-sub" id="cc-airdrop-sub">Contacts Only</span>
                        </div>
                    </div>
                </div>

                <div class="cc-quick-column">
                    <div class="cc-action-btn" id="cc-btn-dnd" onclick="toggleCcDnd()">
                        <div class="cc-toggle-icon"><i class="fas fa-moon"></i></div>
                        <div class="cc-toggle-text">
                            <span class="cc-toggle-title">Focus</span>
                            <span class="cc-toggle-sub" id="cc-dnd-sub">Do Not Disturb</span>
                        </div>
                    </div>
                    <div class="cc-action-btn" id="cc-btn-theme" onclick="toggleCcTheme()">
                        <div class="cc-toggle-icon"><i class="fas fa-circle-half-stroke"></i></div>
                        <div class="cc-toggle-text">
                            <span class="cc-toggle-title">Appearance</span>
                            <span class="cc-toggle-sub" id="cc-theme-sub">Dark Mode</span>
                        </div>
                    </div>
                    <div class="cc-action-btn" onclick="toggleMissionControl(); toggleControlCenter();">
                        <div class="cc-toggle-icon"><i class="fas fa-table-cells-large"></i></div>
                        <div class="cc-toggle-text">
                            <span class="cc-toggle-title">Stage View</span>
                            <span class="cc-toggle-sub">Mission Control</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Display Brightness Slider -->
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

            <!-- Sound Volume Slider -->
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

            <!-- Now Playing Widget (Linked to Apple Music) -->
            <div class="cc-now-playing-card">
                <div class="cc-music-art" id="cc-music-art">
                    <i class="fas fa-music"></i>
                </div>
                <div class="cc-music-meta">
                    <span class="cc-music-title" id="cc-music-title">Apple Music</span>
                    <span class="cc-music-artist" id="cc-music-artist">Ready to play</span>
                </div>
                <div class="cc-music-controls">
                    <button type="button" class="cc-music-btn cc-music-play-btn" id="cc-play-btn" onclick="triggerCcPlayPause()" aria-label="Play/Pause">
                        <i class="fas fa-play" style="margin-left:2px;"></i>
                    </button>
                    <button type="button" class="cc-music-btn" onclick="openWindow('music-window')" aria-label="Open Apple Music" title="Open Apple Music">
                        <i class="fas fa-up-right-from-square"></i>
                    </button>
                </div>
            </div>

            <!-- Bottom Row: Battery & Status -->
            <div class="cc-bottom-row">
                <div class="cc-battery-pill">
                    <i class="fas fa-battery-three-quarters" style="color:#00e676;"></i>
                    <span id="cc-battery-text">Battery: 85% (Power Adapter)</span>
                </div>
                <span style="opacity:0.6;">macOS Sequoia</span>
            </div>
        `;

        document.body.appendChild(panel);

        // Apply saved brightness
        applyBrightness(displayBrightness);
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
    }

    function closeControlCenter() {
        const panel = document.getElementById('control-center-panel');
        if (panel) panel.classList.remove('open');
        ccOpen = false;
    }

    // Outside click & Esc listener
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

    /* ── Toggles ───────────────────────────────────────────────────────── */
    window.toggleCcWifi = function() {
        wifiActive = !wifiActive;
        const el = document.getElementById('cc-toggle-wifi');
        const sub = document.getElementById('cc-wifi-sub');
        if (el) el.classList.toggle('active', wifiActive);
        if (sub) sub.textContent = wifiActive ? "Mudit's 5G" : "Disconnected";
        const wifiMenu = document.getElementById('wifi-icon');
        if (wifiMenu) wifiMenu.style.opacity = wifiActive ? '1' : '0.4';
        if (typeof playSystemSound === 'function') playSystemSound('click');
    };

    window.toggleCcBt = function() {
        bluetoothActive = !bluetoothActive;
        const el = document.getElementById('cc-toggle-bt');
        const sub = document.getElementById('cc-bt-sub');
        if (el) el.classList.toggle('active', bluetoothActive);
        if (sub) sub.textContent = bluetoothActive ? "AirPods Pro" : "Off";
        if (typeof playSystemSound === 'function') playSystemSound('click');
    };

    window.toggleCcAirDrop = function() {
        airdropActive = !airdropActive;
        const el = document.getElementById('cc-toggle-airdrop');
        const sub = document.getElementById('cc-airdrop-sub');
        if (el) el.classList.toggle('active', airdropActive);
        if (sub) sub.textContent = airdropActive ? "Contacts Only" : "Off";
        if (typeof playSystemSound === 'function') playSystemSound('click');
    };

    window.toggleCcDnd = function() {
        dndActive = !dndActive;
        const el = document.getElementById('cc-btn-dnd');
        const sub = document.getElementById('cc-dnd-sub');
        if (el) el.classList.toggle('active', dndActive);
        if (sub) sub.textContent = dndActive ? "Active" : "Do Not Disturb";
        if (typeof playSystemSound === 'function') playSystemSound('click');
    };

    window.toggleCcTheme = function() {
        const isDark = document.body.classList.toggle('light-theme');
        const sub = document.getElementById('cc-theme-sub');
        if (sub) sub.textContent = isDark ? "Light Mode" : "Dark Mode";
        if (typeof playSystemSound === 'function') playSystemSound('pop');
    };

    /* ── Brightness & Volume Sliders ──────────────────────────────────── */
    window.setCcBrightness = function(val) {
        displayBrightness = parseInt(val, 10) || 100;
        const fill = document.getElementById('cc-bright-fill');
        const label = document.getElementById('cc-bright-label');
        if (fill) fill.style.width = displayBrightness + '%';
        if (label) label.textContent = displayBrightness + '%';
        applyBrightness(displayBrightness);
        try { localStorage.setItem('macos_display_brightness', displayBrightness); } catch (e) {}
    };

    function applyBrightness(val) {
        const desktop = document.getElementById('desktop');
        if (desktop) {
            desktop.style.filter = `brightness(${val / 100})`;
        }
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

        if (typeof setMasterVolume === 'function') {
            setMasterVolume(vol / 100);
        }
        if (typeof playSystemSound === 'function') {
            playSystemSound('tick');
        }
    };

    /* ── Now Playing Card Synchronization ─────────────────────────────── */
    function syncNowPlayingWithMusic() {
        const titleEl = document.getElementById('cc-music-title');
        const artistEl = document.getElementById('cc-music-artist');
        const playBtn = document.getElementById('cc-play-btn');

        const musicTitle = document.getElementById('music-lcd-track-title');
        const musicArtist = document.getElementById('music-lcd-artist');
        const musicPlayBtn = document.getElementById('music-play-btn');

        if (titleEl && musicTitle && musicTitle.textContent.trim()) {
            titleEl.textContent = musicTitle.textContent.replace(/● LIVE ON AIR/g, '').trim() || 'Apple Music';
        }
        if (artistEl && musicArtist && musicArtist.textContent.trim()) {
            artistEl.textContent = musicArtist.textContent.trim();
        }
        if (playBtn && musicPlayBtn) {
            const isPlaying = musicPlayBtn.innerHTML.includes('fa-pause');
            playBtn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play" style="margin-left:2px;"></i>';
        }
    }

    window.triggerCcPlayPause = function() {
        const musicPlayBtn = document.getElementById('music-play-btn');
        if (musicPlayBtn) {
            musicPlayBtn.click();
            setTimeout(syncNowPlayingWithMusic, 60);
        } else {
            openWindow('music-window');
        }
    };

    // Expose globally
    window.toggleControlCenter = toggleControlCenter;
    window.openControlCenter = openControlCenter;
    window.closeControlCenter = closeControlCenter;
    window.syncNowPlayingWithMusic = syncNowPlayingWithMusic;
})();
