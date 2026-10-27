/* ==========================================================================
   Music — library, radio and generative tracks, with a Now Playing screen
   --------------------------------------------------------------------------
   Same catalogue as the Mac (js/data/music.js) and the same generative
   engine (js/shared/generative-audio.js). Playback keeps going when you
   leave the app, like iOS: the Dynamic Island (framed preview) and the
   Media Session (real phones' lock screen) show what's playing.
   ========================================================================== */

(function () {
    const TRACKS = window.MUSIC_TRACKS || [];
    const COLORS = window.RADIO_STATION_COLORS || ['linear-gradient(135deg,#4f46e5,#7c3aed)'];
    const stations = () => {
        const S = window.RADIO_FALLBACK_STATIONS || { IN: [], GLOBAL: [] };
        const inIndia = /Asia\/(Kolkata|Calcutta)/.test(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
        return inIndia ? [...S.IN.slice(0, 3), ...S.GLOBAL.slice(0, 3)] : [...S.GLOBAL, ...S.IN.slice(0, 2)];
    };

    const audio = new Audio();
    audio.preload = 'none';
    let current = null;        // { kind: 'track'|'radio', item, index }
    let playing = false;
    let synth = null;
    let synthElapsed = 0;
    let ticker = null;
    let ui = null;             // live elements of the mounted Now Playing / mini player
    let attempt = 0;           // play() calls, so one failure is reported once

    const fmt = (s) => (typeof formatClockTime === 'function' ? formatClockTime(s) : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`);
    const art = (item, kind) => `<span class="music-art" style="background:${escapeHtml(kind === 'radio' ? COLORS[stations().indexOf(item) % COLORS.length] : item.color)}"><i class="fas ${kind === 'radio' ? 'fa-tower-broadcast' : escapeHtml(item.icon || 'fa-music')}"></i></span>`;

    /* ── Engine ───────────────────────────────────────────────────────── */
    function stopAll() {
        audio.pause();
        if (synth) { synth.stop(); synth = null; }
        if (ticker) { clearInterval(ticker); ticker = null; }
    }

    function play(kind, item, index) {
        stopAll();
        attempt++;
        current = { kind, item, index };
        synthElapsed = 0;
        if (kind === 'track' && item.synth) {
            synth = createGenerativeEngine(item.synth, 0, 0.9);
            ticker = setInterval(() => {
                synthElapsed += 0.25;
                if (synthElapsed >= item.duration) next();
                sync();
            }, 250);
            playing = Boolean(synth);
        } else {
            audio.src = kind === 'radio' ? item.streamUrl : item.audioUrl;
            audio.play().then(() => { playing = true; sync(); }).catch(() => fail());
            playing = true;
        }
        mediaSession();
        sync();
    }

    let failedAttempt = -1;
    function fail() {
        // A dead recording rejects play() AND fires 'error': say so once.
        if (failedAttempt === attempt) return;
        failedAttempt = attempt;
        playing = false;
        sync();
        showToast(current && current.kind === 'radio' ? 'Station unavailable' : 'Track unavailable', { body: 'Try another one.', icon: 'fas fa-triangle-exclamation' });
    }

    function toggle() {
        if (!current) { play('track', TRACKS[0], 0); return; }
        if (playing) {
            if (synth) { synth.stop(); synth = null; clearInterval(ticker); ticker = null; }
            else audio.pause();
            playing = false;
        } else if (current.item.synth) {
            const spec = current.item.synth;
            synth = createGenerativeEngine(spec, Math.floor(synthElapsed / (60 / spec.bpm)), 0.9);
            ticker = setInterval(() => { synthElapsed += 0.25; if (synthElapsed >= current.item.duration) next(); sync(); }, 250);
            playing = true;
        } else {
            audio.play().then(() => { playing = true; sync(); }).catch(() => fail());
            playing = true;
        }
        sync();
    }

    function next(step = 1) {
        if (!current) return;
        if (current.kind === 'radio') {
            const list = stations();
            const i = (current.index + step + list.length) % list.length;
            play('radio', list[i], i);
        } else {
            const i = (current.index + step + TRACKS.length) % TRACKS.length;
            play('track', TRACKS[i], i);
        }
    }

    function elapsed() { return current && current.item.synth ? synthElapsed : (audio.currentTime || 0); }
    function duration() { return current ? (current.item.synth ? current.item.duration : (isFinite(audio.duration) && audio.duration) || current.item.duration || 0) : 0; }

    audio.addEventListener('timeupdate', () => sync(true));
    audio.addEventListener('ended', () => next());
    audio.addEventListener('error', () => { if (current && !current.item.synth) fail(); });

    function mediaSession() {
        if (!('mediaSession' in navigator) || !current) return;
        try {
            navigator.mediaSession.metadata = new MediaMetadata({ title: current.item.title || current.item.name, artist: current.item.artist || current.item.desc || 'Radio', album: current.item.album || 'Mudit’s Portfolio' });
            navigator.mediaSession.setActionHandler('play', toggle);
            navigator.mediaSession.setActionHandler('pause', toggle);
            navigator.mediaSession.setActionHandler('nexttrack', () => next(1));
            navigator.mediaSession.setActionHandler('previoustrack', () => next(-1));
        } catch (e) { /* partial support */ }
    }

    /* ── UI sync ──────────────────────────────────────────────────────── */
    function sync(timeOnly) {
        IOS.setIslandActivity(playing && current ? { color: current.kind === 'radio' ? '#5e5ce6' : '#fa243c', onClick: () => IOS.go('music', ['now']) } : null);
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
        if (!ui) return;
        const t = elapsed(), d = duration();
        if (ui.bar) {
            const live = current && current.kind === 'radio';
            ui.bar.style.setProperty('--p', live || !d ? '0' : String(Math.min(1, t / d)));
            ui.now.textContent = live ? 'LIVE' : fmt(t);
            ui.left.textContent = live ? '' : `-${fmt(Math.max(0, d - t))}`;
        }
        if (timeOnly) return;
        ui.root.querySelectorAll('[data-toggle-icon]').forEach(i => { i.className = `fas ${playing ? 'fa-pause' : 'fa-play'}`; });
        ui.root.querySelectorAll('[data-track]').forEach(r => r.classList.toggle('active', Boolean(current && current.kind === 'track' && current.index === +r.dataset.track)));
        ui.root.querySelectorAll('[data-station]').forEach(r => r.classList.toggle('active', Boolean(current && current.kind === 'radio' && current.index === +r.dataset.station)));
        if (ui.mini) {
            ui.mini.hidden = !current;
            if (current) ui.mini.querySelector('.music-mini-title').textContent = current.item.title || current.item.name;
        }
        if (ui.title && current) {
            ui.title.textContent = current.item.title || current.item.name;
            ui.artist.textContent = current.item.artist || current.item.desc || '';
            ui.cover.outerHTML = art(current.item, current.kind).replace('music-art', 'music-art music-cover');
            ui.cover = ui.root.querySelector('.music-cover');
            ui.cover.classList.toggle('paused', !playing);
        }
    }

    /* ── Pages ────────────────────────────────────────────────────────── */
    function library(content, ctx) {
        const list = stations();
        content.innerHTML = `
            <div class="music-hero">
                <button type="button" class="ios-btn" data-action="play"><i class="fas fa-play"></i> Play</button>
                <button type="button" class="ios-btn secondary" data-action="shuffle"><i class="fas fa-shuffle"></i> Shuffle</button>
            </div>
            <div class="ios-section-header">Songs</div>
            <div class="ios-group music-list">${TRACKS.map((t, i) => `
                <button type="button" class="music-row" data-track="${i}">
                    ${art(t, 'track')}
                    <span class="music-row-text"><strong>${escapeHtml(t.title)}</strong><small>${escapeHtml(t.artist)}</small></span>
                    <span class="music-row-meta">${t.synth ? '<em>LIVE SYNTH</em>' : fmt(t.duration)}</span>
                </button>`).join('')}
            </div>
            <div class="ios-section-header">Radio</div>
            <div class="ios-group music-list">${list.map((s, i) => `
                <button type="button" class="music-row" data-station="${i}">
                    ${art(s, 'radio')}
                    <span class="music-row-text"><strong>${escapeHtml(s.name)}</strong><small>${escapeHtml(s.desc)} · ${escapeHtml(s.country)}</small></span>
                    <span class="music-row-meta"><i class="fas fa-signal"></i></span>
                </button>`).join('')}
            </div>
            <p class="ios-section-footer">Recordings from Wikimedia Commons (public domain and CC BY-SA). “Live synth” tracks are generated in your browser with Web Audio.</p>`;
        const mini = document.createElement('button');
        mini.type = 'button';
        mini.className = 'music-mini';
        mini.hidden = true;
        mini.innerHTML = `<span class="music-mini-title"></span><span class="music-mini-btn" role="button" aria-label="Play or pause"><i data-toggle-icon class="fas fa-play"></i></span><span class="music-mini-btn" role="button" aria-label="Next"><i class="fas fa-forward"></i></span>`;
        ctx.page.appendChild(mini);
        mini.addEventListener('click', (e) => {
            const btns = mini.querySelectorAll('.music-mini-btn');
            if (btns[0].contains(e.target)) { toggle(); return; }
            if (btns[1].contains(e.target)) { next(); return; }
            IOS.go('music', ['now']);
        });
        content.addEventListener('click', (e) => {
            const tr = e.target.closest('[data-track]');
            if (tr) { play('track', TRACKS[+tr.dataset.track], +tr.dataset.track); return; }
            const st = e.target.closest('[data-station]');
            if (st) { play('radio', list[+st.dataset.station], +st.dataset.station); return; }
            const a = e.target.closest('[data-action]');
            if (a && a.dataset.action === 'play') play('track', TRACKS[0], 0);
            if (a && a.dataset.action === 'shuffle') { const i = Math.floor(Math.random() * TRACKS.length); play('track', TRACKS[i], i); }
        });
        ui = { root: ctx.page.closest('.ios-app-window') || ctx.page, mini };
        sync();
    }

    function nowPlaying(content, ctx) {
        if (!current) current = { kind: 'track', item: TRACKS[0], index: 0 };
        content.innerHTML = `
            <div class="music-now">
                ${art(current.item, current.kind).replace('music-art', 'music-art music-cover')}
                <div class="music-now-text">
                    <strong class="music-now-title"></strong>
                    <span class="music-now-artist"></span>
                </div>
                <div class="music-progress"><div class="music-bar"></div><span class="music-t-now">0:00</span><span class="music-t-left"></span></div>
                <div class="music-controls">
                    <button type="button" data-c="prev" aria-label="Previous"><i class="fas fa-backward"></i></button>
                    <button type="button" data-c="toggle" class="big" aria-label="Play or pause"><i data-toggle-icon class="fas fa-play"></i></button>
                    <button type="button" data-c="next" aria-label="Next"><i class="fas fa-forward"></i></button>
                </div>
                <p class="music-now-note">${current.item.synth ? 'Generated live in your browser — no file is streaming.' : current.kind === 'radio' ? 'Live radio stream.' : 'Recording from Wikimedia Commons.'}</p>
            </div>`;
        const root = ctx.page.closest('.ios-app-window') || ctx.page;
        ui = Object.assign(ui || {}, {
            root,
            title: content.querySelector('.music-now-title'),
            artist: content.querySelector('.music-now-artist'),
            cover: content.querySelector('.music-cover'),
            bar: content.querySelector('.music-bar'),
            now: content.querySelector('.music-t-now'),
            left: content.querySelector('.music-t-left')
        });
        content.querySelector('.music-controls').addEventListener('click', (e) => {
            const b = e.target.closest('[data-c]');
            if (!b) return;
            if (b.dataset.c === 'toggle') toggle();
            if (b.dataset.c === 'next') next(1);
            if (b.dataset.c === 'prev') { if (elapsed() > 3 && !current.item.synth && current.kind !== 'radio') { audio.currentTime = 0; } else next(-1); }
        });
        content.querySelector('.music-progress').addEventListener('click', (e) => {
            if (!current || current.kind === 'radio' || current.item.synth || !isFinite(audio.duration)) return;
            const r = e.currentTarget.getBoundingClientRect();
            audio.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * audio.duration;
        });
        sync();
    }

    IOS.register('music', {
        name: 'Music',
        icon: 'assets/icons/music.png',
        keywords: 'songs radio play audio classical synth',
        onClose() { ui = null; },
        pages(path) {
            const root = { key: 'library', title: 'Music', render: library };
            if (path[0] === 'now') return [root, { key: 'now', title: 'Now Playing', largeTitle: false, className: 'music-now-page', backTitle: 'Library', render: nowPlaying }];
            return [root];
        }
    });
})();
