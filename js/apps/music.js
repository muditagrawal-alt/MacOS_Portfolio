/* ==========================================================================
   Music.app — library, live radio and a generative Web Audio engine
   --------------------------------------------------------------------------
   What changed and why (all verified in a real browser):
   • Five of the six recordings pointed at Wikimedia URLs that 404, so they
     silently fell back to a beeping sine arpeggio labelled "Mozart". Every
     URL below was resolved through the Commons API and plays.
   • Resume after pause restarted the song (src was reassigned on every
     play), and a 1s setInterval raced the audio clock. One clock now: the
     <audio> element's own currentTime.
   • Radio errors were swallowed and the UI still said "LIVE". Failures now
     surface, and stations come from the open Radio Browser directory (with a
     verified fallback list) instead of a hardcoded set with duplicates.
   • System volume / mute (Control Centre, menu bar) now apply to Music.
   ========================================================================== */

(function() {
    // Catalogue shared with the iPhone version: js/data/music.js
    const TRACKS = window.MUSIC_TRACKS;
    const FALLBACK_STATIONS = window.RADIO_FALLBACK_STATIONS;
    const STATION_COLORS = window.RADIO_STATION_COLORS;

    let currentTrackIndex = 0;
    let isPlaying = false;
    let isRadioMode = false;
    let activeRadioStation = null;
    let userCountry = 'IN';
    let appVolume = 0.8;
    let isMuted = false;
    let currentView = 'listen';
    let viewTrackIndices = TRACKS.map((_, i) => i);
    let stationsByRegion = {};

    let audioElement = null;
    let loadedSrc = null;
    let synth = null;          // running generative engine
    let synthElapsed = 0;      // seconds into the current generative track
    let synthTicker = null;

    /* ── Volume: app volume × system volume (and system mute) ─────────── */
    function effectiveVolume() {
        const master = typeof window.getMasterVolume === 'function' ? window.getMasterVolume() : 1;
        const sysMuted = typeof window.isSystemMuted === 'function' && window.isSystemMuted();
        return (isMuted || sysMuted) ? 0 : Math.max(0, Math.min(1, appVolume * master));
    }

    function applyVolume() {
        const v = effectiveVolume();
        if (audioElement) audioElement.volume = v;
        if (synth) synth.setVolume(v);
    }
    window.addEventListener('master-volume-changed', applyVolume);

    function detectUserCountry() {
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
            userCountry = /Calcutta|Kolkata/.test(tz) ? 'IN' : 'GLOBAL';
        } catch (e) {
            userCountry = 'GLOBAL';
        }
        const sel = document.getElementById('music-country-select');
        if (sel) sel.value = userCountry;
    }

    function initAudio() {
        audioElement = new Audio();
        audioElement.preload = 'none';
        audioElement.addEventListener('timeupdate', () => {
            if (!isRadioMode) updateProgressUI(audioElement.currentTime, trackDuration());
        });
        audioElement.addEventListener('loadedmetadata', () => {
            if (!isRadioMode) updateProgressUI(audioElement.currentTime, trackDuration());
        });
        audioElement.addEventListener('ended', () => { if (!isRadioMode) nextTrack(); });
        audioElement.addEventListener('playing', () => { setStatus(''); broadcastState(); });
        audioElement.addEventListener('waiting', () => setStatus(isRadioMode ? 'Connecting…' : 'Buffering…'));
        audioElement.addEventListener('error', () => {
            if (!audioElement.getAttribute('src')) return;
            const what = isRadioMode && activeRadioStation ? activeRadioStation.name : (TRACKS[currentTrackIndex] || {}).title;
            handlePlaybackFailure(what);
        });
    }

    function trackDuration() {
        const t = TRACKS[currentTrackIndex];
        if (audioElement && isFinite(audioElement.duration) && audioElement.duration > 0) return audioElement.duration;
        return t ? t.duration : 0;
    }

    function handlePlaybackFailure(what) {
        setPlayingUI(false);
        isPlaying = false;
        setStatus(isRadioMode ? 'Station unavailable' : 'Couldn’t load this track');
        if (typeof showToast === 'function') {
            showToast(isRadioMode ? 'Station unavailable' : 'Track unavailable', { body: `${what} couldn’t be reached. Try another.`, icon: 'fas fa-triangle-exclamation' });
        }
        broadcastState();
    }

    function startSynth(track) {
        stopSynth();
        synth = createGenerativeEngine(track.synth, Math.floor(synthElapsed / (60 / track.synth.bpm)), effectiveVolume());
        synthTicker = setInterval(() => {
            synthElapsed += 0.25;
            updateProgressUI(synthElapsed, track.duration);
            if (synthElapsed >= track.duration) nextTrack();
        }, 250);
    }

    function stopSynth() {
        if (synth) { synth.stop(); synth = null; }
        if (synthTicker) { clearInterval(synthTicker); synthTicker = null; }
    }

    /* ── Player logic ─────────────────────────────────────────────────── */
    function loadTrack(index, autoPlay = true) {
        isRadioMode = false;
        activeRadioStation = null;
        currentTrackIndex = (index + TRACKS.length) % TRACKS.length;
        const track = TRACKS[currentTrackIndex];
        stopSynth();
        synthElapsed = 0;
        if (audioElement) {
            audioElement.pause();
            if (track.audioUrl) {
                audioElement.src = track.audioUrl;
                loadedSrc = track.audioUrl;
            } else {
                audioElement.removeAttribute('src');
                loadedSrc = null;
            }
        }
        updateTrackInfoUI(track);
        updateProgressUI(0, track.duration);
        highlightActiveTrackRow();
        document.querySelectorAll('.music-station-card').forEach(c => c.classList.remove('active'));
        setStatus('');
        if (autoPlay) playTrack();
        else { isPlaying = false; setPlayingUI(false); broadcastState(); }
    }

    function playTrack() {
        const track = TRACKS[currentTrackIndex];
        if (!track) return;
        isPlaying = true;
        setPlayingUI(true);
        applyVolume();

        if (track.audioUrl) {
            // Only (re)assign src when the track actually changed — assigning
            // it again is what made "resume" restart the song from 0:00.
            if (loadedSrc !== track.audioUrl) {
                audioElement.src = track.audioUrl;
                loadedSrc = track.audioUrl;
            }
            audioElement.play().catch(err => {
                if (err && err.name === 'NotAllowedError') { isPlaying = false; setPlayingUI(false); setStatus('Click play to start'); broadcastState(); }
            });
        } else {
            startSynth(track);
        }
        broadcastState();
    }

    function playRadioStation(station) {
        isRadioMode = true;
        activeRadioStation = station;
        stopSynth();
        isPlaying = true;
        setPlayingUI(true);

        const titleEl = document.getElementById('music-lcd-track-title');
        const artistEl = document.getElementById('music-lcd-artist');
        const timeEl = document.getElementById('music-lcd-time');
        const fillEl = document.getElementById('music-progress-fill');
        if (titleEl) titleEl.textContent = station.name;
        if (artistEl) artistEl.textContent = `${station.desc || 'Live radio'}${station.country ? ' · ' + station.country : ''}`;
        if (timeEl) timeEl.innerHTML = '<span class="music-live-pill">● LIVE</span>';
        if (fillEl) fillEl.style.width = '100%';
        setStatus('Connecting…');

        audioElement.pause();
        audioElement.src = station.streamUrl;
        loadedSrc = station.streamUrl;
        applyVolume();
        audioElement.play().catch(err => {
            if (err && err.name === 'NotAllowedError') { isPlaying = false; setPlayingUI(false); setStatus('Click play to start'); }
            else handlePlaybackFailure(station.name);
            broadcastState();
        });

        document.querySelectorAll('.music-station-card').forEach(c => {
            c.classList.toggle('active', c.dataset.stationId === station.id);
        });
        highlightActiveTrackRow();
        broadcastState();
    }

    function pauseTrack() {
        isPlaying = false;
        setPlayingUI(false);
        if (audioElement) audioElement.pause();
        if (isRadioMode) {
            // Live streams can't be resumed from a buffer — drop the connection.
            audioElement.removeAttribute('src');
            audioElement.load();
            loadedSrc = null;
        }
        stopSynth();
        setStatus('');
        broadcastState();
    }

    function togglePlay() {
        if (isPlaying) pauseTrack();
        else if (isRadioMode && activeRadioStation) playRadioStation(activeRadioStation);
        else playTrack();
    }

    function nextTrack() {
        if (isRadioMode) {
            const list = stationsByRegion[userCountry] || FALLBACK_STATIONS[userCountry] || [];
            if (!list.length) return;
            const i = list.findIndex(s => s.id === (activeRadioStation && activeRadioStation.id));
            playRadioStation(list[(i + 1) % list.length]);
        } else {
            const order = viewTrackIndices.length ? viewTrackIndices : TRACKS.map((_, i) => i);
            const pos = order.indexOf(currentTrackIndex);
            loadTrack(order[(pos + 1) % order.length], true);
        }
    }

    function prevTrack() {
        if (isRadioMode) {
            const list = stationsByRegion[userCountry] || FALLBACK_STATIONS[userCountry] || [];
            if (!list.length) return;
            const i = list.findIndex(s => s.id === (activeRadioStation && activeRadioStation.id));
            playRadioStation(list[(i - 1 + list.length) % list.length]);
            return;
        }
        const elapsed = TRACKS[currentTrackIndex].audioUrl ? audioElement.currentTime : synthElapsed;
        if (elapsed > 4) { seekToTime(0); return; }
        const order = viewTrackIndices.length ? viewTrackIndices : TRACKS.map((_, i) => i);
        const pos = order.indexOf(currentTrackIndex);
        loadTrack(order[(pos - 1 + order.length) % order.length], true);
    }

    function seekToTime(seconds) {
        if (isRadioMode) return; // live streams can't seek
        const track = TRACKS[currentTrackIndex];
        if (track.audioUrl) {
            if (audioElement && isFinite(audioElement.duration)) audioElement.currentTime = seconds;
        } else {
            synthElapsed = seconds;
            if (isPlaying) startSynth(track);
        }
        updateProgressUI(seconds, trackDuration());
    }

    function setVolume(val) {
        appVolume = Math.max(0, Math.min(1, parseFloat(val) || 0));
        isMuted = false;
        applyVolume();
        updateVolumeIcon();
    }

    function toggleMute() {
        isMuted = !isMuted;
        applyVolume();
        updateVolumeIcon();
    }

    function updateVolumeIcon() {
        const icon = document.getElementById('music-vol-icon');
        if (!icon) return;
        icon.className = (isMuted || appVolume === 0) ? 'fas fa-volume-xmark' : (appVolume < 0.5 ? 'fas fa-volume-low' : 'fas fa-volume-high');
    }

    function shuffleMusic() {
        const order = (viewTrackIndices.length ? viewTrackIndices : TRACKS.map((_, i) => i)).slice();
        for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
        viewTrackIndices = order;
        loadTrack(order[0], true);
    }

    /* ── Views ────────────────────────────────────────────────────────── */
    function switchMusicView(view, navKey) {
        currentView = view;
        document.querySelectorAll('.music-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.nav === (navKey || view));
        });

        const tracksView = document.getElementById('music-view-tracks');
        const gridView = document.getElementById('music-view-grid');
        const radioView = document.getElementById('music-view-radio');
        [tracksView, gridView, radioView].forEach(v => { if (v) v.style.display = 'none'; });

        if (view === 'radio') {
            radioView.style.display = 'block';
            renderRadioStations();
            return;
        }
        if (view === 'artists' || view === 'albums') {
            gridView.style.display = 'block';
            renderCardGrid(view);
            return;
        }

        tracksView.style.display = 'block';
        const hero = document.getElementById('music-hero');
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        if (view.startsWith('playlist:')) {
            const pl = view.split(':')[1];
            viewTrackIndices = TRACKS.map((t, i) => t.playlist === pl ? i : -1).filter(i => i >= 0);
            set('music-hero-title', pl === 'classical' ? 'Classical Masters' : 'Generative Beats');
            set('music-hero-subtitle', pl === 'classical' ? 'Public-domain recordings from Wikimedia Commons' : 'Synthesised live in your browser — no audio files');
            set('music-section-title', `${viewTrackIndices.length} songs`);
            if (hero) hero.style.display = '';
        } else if (view === 'songs') {
            viewTrackIndices = TRACKS.map((_, i) => i);
            set('music-section-title', 'Songs');
            if (hero) hero.style.display = 'none';
        } else {
            viewTrackIndices = TRACKS.map((_, i) => i);
            set('music-hero-title', 'Classical & Coding Essentials');
            set('music-hero-subtitle', 'Six public-domain recordings and two generative tracks');
            set('music-section-title', 'Top Tracks');
            if (hero) hero.style.display = '';
        }
        renderTrackTable();
    }

    function playMusicView() {
        const order = viewTrackIndices.length ? viewTrackIndices : TRACKS.map((_, i) => i);
        loadTrack(order[0], true);
    }

    function renderCardGrid(kind) {
        const grid = document.getElementById('music-card-grid');
        const title = document.getElementById('music-grid-title');
        if (!grid) return;
        if (title) title.textContent = kind === 'artists' ? 'Artists' : 'Albums';
        const groups = new Map();
        TRACKS.forEach((t, i) => {
            const key = kind === 'artists' ? t.artist : t.album;
            if (!groups.has(key)) groups.set(key, { first: i, track: t, count: 0 });
            groups.get(key).count++;
        });
        grid.innerHTML = [...groups.entries()].map(([name, g]) => `
            <button type="button" class="music-card" onclick="window.playMusicTrackIndex(${g.first})">
                <div class="music-card-art ${kind === 'artists' ? 'round' : ''}" style="background:${g.track.color};"><i class="fas ${g.track.icon}"></i></div>
                <div class="music-card-name">${escapeHtml(name)}</div>
                <div class="music-card-sub">${escapeHtml(kind === 'artists' ? `${g.count} song${g.count > 1 ? 's' : ''}` : g.track.artist)}</div>
            </button>`).join('');
    }

    /* ── Radio directory ──────────────────────────────────────────────── */
    async function loadStations(region) {
        if (stationsByRegion[region]) return stationsByRegion[region];
        const cacheKey = `music-stations-${region}`;
        try {
            const hit = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
            if (hit && Date.now() - hit.t < 3600000) return (stationsByRegion[region] = hit.list);
        } catch (e) { /* no cache */ }

        const path = region === 'IN'
            ? '/json/stations/search?countrycode=IN&hidebroken=true&order=clickcount&reverse=true&limit=60'
            : '/json/stations/search?hidebroken=true&order=clickcount&reverse=true&limit=80';
        const servers = ['https://de1.api.radio-browser.info', 'https://nl1.api.radio-browser.info', 'https://at1.api.radio-browser.info'];
        for (const base of servers) {
            try {
                const ctrl = new AbortController();
                const to = setTimeout(() => ctrl.abort(), 5000);
                const res = await fetch(base + path, { signal: ctrl.signal });
                clearTimeout(to);
                if (!res.ok) continue;
                const raw = await res.json();
                const seen = new Set();
                const list = raw
                    // HTTPS only (an http stream is blocked on an https page),
                    // direct audio only (no HLS/playlist wrappers), healthy only.
                    .filter(s => s.lastcheckok === 1 && /^https:\/\//.test(s.url_resolved || '') && !/\.(m3u8?|pls)(\?|$)/i.test(s.url_resolved) && /MP3|AAC/i.test(s.codec || ''))
                    .filter(s => { const k = (s.name || '').trim().toLowerCase(); if (!k || seen.has(k) || seen.has(s.url_resolved)) return false; seen.add(k); seen.add(s.url_resolved); return true; })
                    .slice(0, 12)
                    .map(s => ({
                        id: s.stationuuid,
                        name: (s.name || '').trim(),
                        desc: (s.tags || '').split(',').filter(Boolean).slice(0, 3).join(' · ') || 'Live radio',
                        country: s.country || '',
                        streamUrl: s.url_resolved,
                        favicon: /^https:\/\//.test(s.favicon || '') ? s.favicon : ''
                    }));
                if (list.length >= 4) {
                    try { sessionStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), list })); } catch (e) { /* non-fatal */ }
                    return (stationsByRegion[region] = list);
                }
            } catch (e) { /* try the next mirror */ }
        }
        return (stationsByRegion[region] = FALLBACK_STATIONS[region] || FALLBACK_STATIONS.GLOBAL);
    }

    async function renderRadioStations() {
        const grid = document.getElementById('music-radio-grid');
        if (!grid) return;
        const region = userCountry;
        if (!stationsByRegion[region]) {
            grid.innerHTML = Array.from({ length: 6 }, () => '<div class="music-station-card skeleton"><div class="music-station-banner"></div><div class="music-station-name">&nbsp;</div></div>').join('');
        }
        const stations = await loadStations(region);
        if (region !== userCountry) return;   // the visitor switched region meanwhile
        grid.innerHTML = stations.map((s, i) => `
            <button type="button" class="music-station-card ${activeRadioStation && activeRadioStation.id === s.id ? 'active' : ''}" data-station-id="${escapeHtml(s.id)}" onclick="window.playAppleRadio('${escapeAttr(s.id)}')">
                <div class="music-station-banner" style="background:${STATION_COLORS[i % STATION_COLORS.length]};">
                    ${s.favicon ? `<img src="${escapeHtml(s.favicon)}" alt="" loading="lazy" onerror="this.remove()">` : '<i class="fas fa-radio"></i>'}
                    <div class="music-live-badge"><span class="music-live-badge-dot"></span> LIVE</div>
                </div>
                <div class="music-station-name">${escapeHtml(s.name)}</div>
                <div class="music-station-desc">${escapeHtml(s.desc)}</div>
            </button>`).join('');
    }

    window.switchRadioCountry = function(c) {
        userCountry = c === 'IN' ? 'IN' : 'GLOBAL';
        renderRadioStations();
    };

    window.playAppleRadio = function(stationId) {
        const all = [...Object.values(stationsByRegion).flat(), ...FALLBACK_STATIONS.IN, ...FALLBACK_STATIONS.GLOBAL];
        const found = all.find(s => s.id === stationId);
        if (found) playRadioStation(found);
    };

    /* ── UI helpers ───────────────────────────────────────────────────── */
    function setStatus(text) {
        const timeEl = document.getElementById('music-lcd-time');
        if (!timeEl) return;
        if (text) {
            timeEl.dataset.status = '1';
            timeEl.textContent = text;
        } else if (timeEl.dataset.status) {
            delete timeEl.dataset.status;
            if (isRadioMode) timeEl.innerHTML = '<span class="music-live-pill">● LIVE</span>';
            else updateProgressUI(TRACKS[currentTrackIndex].audioUrl ? audioElement.currentTime : synthElapsed, trackDuration());
        }
    }

    function setPlayingUI(playing) {
        const playBtn = document.getElementById('music-play-btn');
        const eqBars = document.getElementById('music-eq-bars');
        if (playBtn) {
            playBtn.innerHTML = playing ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play" style="margin-left:2px;"></i>';
            playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
        }
        if (eqBars) eqBars.classList.toggle('playing', playing);
        document.querySelectorAll('.music-track-row').forEach(r => r.classList.toggle('is-playing', playing && r.classList.contains('active')));
    }

    function updateTrackInfoUI(track) {
        const titleEl = document.getElementById('music-lcd-track-title');
        const artistEl = document.getElementById('music-lcd-artist');
        if (titleEl) titleEl.textContent = track.title;
        if (artistEl) artistEl.textContent = track.artist;
        const cover = document.getElementById('music-hero-cover');
        if (cover && currentView === 'listen') cover.style.background = track.color;
    }

    function updateProgressUI(cur, total) {
        if (isRadioMode) return;
        const timeEl = document.getElementById('music-lcd-time');
        const fillEl = document.getElementById('music-progress-fill');
        const bar = document.getElementById('music-progress-bar');
        if (timeEl && !timeEl.dataset.status) timeEl.textContent = `${formatClockTime(cur)} / ${formatClockTime(total)}`;
        const pct = total > 0 ? Math.min(100, Math.max(0, (cur / total) * 100)) : 0;
        if (fillEl) fillEl.style.width = pct + '%';
        if (bar) { bar.setAttribute('aria-valuenow', String(Math.round(cur))); bar.setAttribute('aria-valuemax', String(Math.round(total))); }
    }

    function renderTrackTable() {
        const tbody = document.getElementById('music-track-tbody');
        if (!tbody) return;
        const indices = viewTrackIndices.length ? viewTrackIndices : TRACKS.map((_, i) => i);
        tbody.innerHTML = indices.map((idx, n) => {
            const t = TRACKS[idx];
            const active = idx === currentTrackIndex && !isRadioMode;
            return `
            <tr class="music-track-row ${active ? 'active' : ''} ${active && isPlaying ? 'is-playing' : ''}" data-track-index="${idx}" tabindex="0" onclick="window.playMusicTrackIndex(${idx})" onkeydown="if(event.key==='Enter'){window.playMusicTrackIndex(${idx})}">
                <td class="music-track-num"><span class="num">${n + 1}</span><i class="fas fa-volume-high playing-glyph" aria-hidden="true"></i></td>
                <td>
                    <div class="music-track-info-cell">
                        <div class="music-track-cover" style="background:${t.color};"><i class="fas ${t.icon}"></i></div>
                        <div class="music-track-title-wrap">
                            <span class="music-track-name">${escapeHtml(t.title)}</span>
                            <span class="music-track-artist-sub">${escapeHtml(t.artist)}</span>
                        </div>
                    </div>
                </td>
                <td style="color:rgba(255,255,255,0.6);">${escapeHtml(t.album)}</td>
                <td class="music-track-dur">${formatClockTime(t.duration)}</td>
            </tr>`;
        }).join('');
    }

    function highlightActiveTrackRow() {
        document.querySelectorAll('.music-track-row').forEach(r => {
            const active = Number(r.dataset.trackIndex) === currentTrackIndex && !isRadioMode;
            r.classList.toggle('active', active);
            r.classList.toggle('is-playing', active && isPlaying);
        });
    }

    function setupScrubber() {
        const bar = document.getElementById('music-progress-bar');
        if (!bar) return;
        bar.setAttribute('role', 'slider');
        bar.setAttribute('tabindex', '0');
        bar.setAttribute('aria-label', 'Playback position');
        const seekFromEvent = (e) => {
            if (isRadioMode) return;
            const rect = bar.getBoundingClientRect();
            const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            seekToTime(pct * trackDuration());
        };
        let dragging = false;
        bar.addEventListener('pointerdown', (e) => { dragging = true; bar.setPointerCapture(e.pointerId); seekFromEvent(e); });
        bar.addEventListener('pointermove', (e) => { if (dragging) seekFromEvent(e); });
        bar.addEventListener('pointerup', () => { dragging = false; });
        bar.addEventListener('keydown', (e) => {
            if (isRadioMode) return;
            const cur = TRACKS[currentTrackIndex].audioUrl ? audioElement.currentTime : synthElapsed;
            if (e.key === 'ArrowRight') { e.preventDefault(); seekToTime(Math.min(trackDuration(), cur + 5)); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); seekToTime(Math.max(0, cur - 5)); }
        });
    }

    /* ── State broadcast (Control Centre, Media Session) ─────────────── */
    function currentState() {
        const t = TRACKS[currentTrackIndex];
        return isRadioMode && activeRadioStation
            ? { playing: isPlaying, title: activeRadioStation.name, subtitle: 'Live Radio', color: 'linear-gradient(135deg,#fa243c,#ff7a59)' }
            : { playing: isPlaying, title: t.title, subtitle: t.artist, color: t.color };
    }

    function broadcastState() {
        const s = currentState();
        window.dispatchEvent(new CustomEvent('music-state', { detail: s }));
        if ('mediaSession' in navigator && window.MediaMetadata) {
            try {
                navigator.mediaSession.metadata = new MediaMetadata({ title: s.title, artist: s.subtitle, album: isRadioMode ? 'Radio' : TRACKS[currentTrackIndex].album });
                navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
            } catch (e) { /* unsupported */ }
        }
    }

    function setupMediaSession() {
        if (!('mediaSession' in navigator)) return;
        const set = (a, fn) => { try { navigator.mediaSession.setActionHandler(a, fn); } catch (e) { /* unsupported action */ } };
        set('play', () => { if (!isPlaying) togglePlay(); });
        set('pause', () => { if (isPlaying) togglePlay(); });
        set('nexttrack', nextTrack);
        set('previoustrack', prevTrack);
    }

    // Space toggles playback while Music is frontmost.
    document.addEventListener('keydown', (e) => {
        if (e.code !== 'Space') return;
        const win = typeof getActiveWindow === 'function' ? getActiveWindow() : null;
        if (!win || win.id !== 'music-window') return;
        const t = document.activeElement;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'BUTTON' || t.tagName === 'SELECT' || t.isContentEditable)) return;
        e.preventDefault();
        togglePlay();
    });

    // Window lifecycle
    window.openMusic = function() {
        if (typeof openWindow === 'function') openWindow('music-window');
    };

    window.closeMusic = function() {
        pauseTrack();
        if (typeof closeWindow === 'function') closeWindow('music-window');
    };

    window.toggleMusicPlay = togglePlay;
    window.pauseMusic = function() { if (isPlaying) pauseTrack(); };
    window.nextMusicTrack = nextTrack;
    window.prevMusicTrack = prevTrack;
    window.setMusicVolume = setVolume;
    window.toggleMusicMute = toggleMute;
    window.switchMusicNav = switchMusicView;
    window.playMusicView = playMusicView;
    window.shuffleMusic = shuffleMusic;
    window.getMusicVolume = effectiveVolume;
    window.getMusicState = currentState;
    window.playMusicTrackIndex = function(idx) {
        loadTrack(idx, true);
    };

    document.addEventListener('DOMContentLoaded', () => {
        detectUserCountry();
        initAudio();
        renderTrackTable();
        setupScrubber();
        setupMediaSession();
        loadTrack(0, false);
    });
})();
