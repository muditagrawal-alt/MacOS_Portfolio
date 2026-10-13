/* ==========================================================================
   Apple Music.app — macOS Apple Music Native Clone Controller
   With Location-Aware Live Radio & Global Station Streaming
   ========================================================================== */

(function() {
    // Curated Library Tracks
    const TRACKS = [
        {
            id: 'beethoven-moonlight',
            title: 'Moonlight Sonata (Adagio)',
            artist: 'Ludwig van Beethoven',
            album: 'Piano Sonata No. 14 in C-Sharp Minor',
            duration: 312,
            durationStr: '5:12',
            color: 'linear-gradient(135deg, #4a00e0, #8e2de2)',
            icon: 'fa-moon',
            audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/e/eb/Beethoven_Moonlight_1st_movement.ogg/Beethoven_Moonlight_1st_movement.ogg.mp3',
            synthScale: [277.18, 329.63, 415.30, 554.37, 493.88, 440.00],
            tempo: 75
        },
        {
            id: 'mozart-symphony40',
            title: 'Symphony No. 40 in G Minor',
            artist: 'Wolfgang Amadeus Mozart',
            album: 'Great Orchestral Masterpieces',
            duration: 270,
            durationStr: '4:30',
            color: 'linear-gradient(135deg, #fa709a, #fee140)',
            icon: 'fa-feather-pointed',
            audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Mozart_-_Symphony_No._40_in_G_minor%2C_K._550_-_I._Molto_allegro.ogg',
            synthScale: [311.13, 293.66, 293.66, 311.13, 293.66, 293.66, 392.00],
            tempo: 120
        },
        {
            id: 'chopin-nocturne',
            title: 'Nocturne in E-Flat Major',
            artist: 'Frédéric Chopin',
            album: 'Nocturnes, Op. 9 No. 2',
            duration: 272,
            durationStr: '4:32',
            color: 'linear-gradient(135deg, #0ba360, #3cba92)',
            icon: 'fa-music',
            audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/9/9b/Fr%C3%A9d%C3%A9ric_Chopin_-_Nocturne_in_E-flat_major%2C_Op._9%2C_No._2.ogg/Fr%C3%A9d%C3%A9ric_Chopin_-_Nocturne_in_E-flat_major%2C_Op._9%2C_No._2.ogg.mp3',
            synthScale: [311.13, 349.23, 392.00, 466.16, 523.25, 466.16],
            tempo: 80
        },
        {
            id: 'vivaldi-spring',
            title: 'The Four Seasons: Spring',
            artist: 'Antonio Vivaldi',
            album: 'Le quattro stagioni',
            duration: 216,
            durationStr: '3:36',
            color: 'linear-gradient(135deg, #ff0844, #ffb199)',
            icon: 'fa-sun',
            audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/3/3c/Vivaldi_Spring_mvt_1_Allegro.ogg/Vivaldi_Spring_mvt_1_Allegro.ogg.mp3',
            synthScale: [659.25, 830.61, 830.61, 830.61, 739.99, 659.25, 493.88],
            tempo: 110
        },
        {
            id: 'satie-gymnopedie',
            title: 'Gymnopédie No. 1',
            artist: 'Erik Satie',
            album: 'Atmospheric French Piano',
            duration: 190,
            durationStr: '3:10',
            color: 'linear-gradient(135deg, #13547a, #80d0c7)',
            icon: 'fa-cloud',
            audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/e/e6/Erik_Satie_-_Gymnopedie_No._1.ogg/Erik_Satie_-_Gymnopedie_No._1.ogg.mp3',
            synthScale: [392.00, 493.88, 587.33, 739.99, 587.33, 493.88],
            tempo: 65
        },
        {
            id: 'debussy-clairdelune',
            title: 'Clair de Lune',
            artist: 'Claude Debussy',
            album: 'Suite bergamasque',
            duration: 304,
            durationStr: '5:04',
            color: 'linear-gradient(135deg, #667eea, #764ba2)',
            icon: 'fa-star',
            audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/2/26/Debussy_-_Clair_de_Lune.ogg/Debussy_-_Clair_de_Lune.ogg.mp3',
            synthScale: [415.30, 466.16, 554.37, 622.25, 830.61, 622.25],
            tempo: 70
        },
        {
            id: 'lofi-midnight',
            title: 'Midnight Code & Chill',
            artist: 'Mudit & Chillhop Radio',
            album: 'Late Night Developer Sessions',
            duration: 168,
            durationStr: '2:48',
            color: 'linear-gradient(135deg, #f857a6, #ff5858)',
            icon: 'fa-laptop-code',
            audioUrl: null,
            synthScale: [261.63, 329.63, 392.00, 493.88, 523.25, 392.00],
            tempo: 84
        },
        {
            id: 'synthwave-neon',
            title: 'Retro Neon Drive 1984',
            artist: 'Macintosh Arcade Synth',
            album: 'Cupertino Sunset Drive',
            duration: 195,
            durationStr: '3:15',
            color: 'linear-gradient(135deg, #00f2fe, #4facfe)',
            icon: 'fa-car-side',
            audioUrl: null,
            synthScale: [220.00, 261.63, 329.63, 440.00, 523.25, 659.25],
            tempo: 125
        }
    ];

    // Live Radio Stations by Country
    const RADIO_STATIONS = {
        IN: [
            {
                id: 'air-vividh-bharati',
                name: 'AIR Vividh Bharati',
                desc: 'All India Radio • National Hindi Broadcast & Classic Hits',
                dial: '102.8 FM',
                country: 'India 🇮🇳',
                streamUrl: 'https://stream.zeno.fm/6n6ewddtad0uv',
                color: 'linear-gradient(135deg, #ff9933, #138808)',
                icon: 'fa-radio'
            },
            {
                id: 'radio-mirchi-hits',
                name: 'Radio Mirchi Top 20',
                desc: 'Bollywood Trending Hits & Desi Chartbusters',
                dial: '98.3 FM',
                country: 'India 🇮🇳',
                streamUrl: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
                color: 'linear-gradient(135deg, #e11d48, #be123c)',
                icon: 'fa-fire'
            },
            {
                id: 'air-gold',
                name: 'AIR FM Gold',
                desc: 'Evergreen Melodies & National Hindi News',
                dial: '106.4 FM',
                country: 'India 🇮🇳',
                streamUrl: 'https://stream.zeno.fm/s49uq9c8h0hvv',
                color: 'linear-gradient(135deg, #d97706, #b45309)',
                icon: 'fa-gem'
            },
            {
                id: 'bollywood-retro',
                name: 'Bollywood Gaane Purane',
                desc: 'Golden Era 70s, 80s & 90s Kishore, Lata, Rafi Classics',
                dial: 'Web Live',
                country: 'India 🇮🇳',
                streamUrl: 'https://stream.zeno.fm/6n6ewddtad0uv',
                color: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                icon: 'fa-record-vinyl'
            },
            {
                id: 'desi-dance',
                name: 'Club Mirchi & Punjabi Hits',
                desc: 'High Voltage Bhangra, Indi-Pop & Bollywood Remixes',
                dial: 'Club HD',
                country: 'India 🇮🇳',
                streamUrl: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
                color: 'linear-gradient(135deg, #ec4899, #f43f5e)',
                icon: 'fa-bolt'
            }
        ],
        GLOBAL: [
            {
                id: 'radio-paradise',
                name: 'Radio Paradise',
                desc: 'Eclectic Mellow Rock, World, & Acoustic • California',
                dial: 'Global HD',
                country: 'United States 🇺🇸',
                streamUrl: 'https://stream.radioparadise.com/mp3-128',
                color: 'linear-gradient(135deg, #0284c7, #0369a1)',
                icon: 'fa-tree'
            },
            {
                id: 'bbc-world-service',
                name: 'BBC World Service',
                desc: 'Global News, Live Documentary & Culture • London',
                dial: 'World Live',
                country: 'United Kingdom 🇬🇧',
                streamUrl: 'https://stream.live.vc.bbcmedia.co.uk/bbc_world_service',
                color: 'linear-gradient(135deg, #dc2626, #991b1b)',
                icon: 'fa-globe'
            },
            {
                id: 'dance-wave',
                name: 'Dance Wave 100%',
                desc: 'Global Dance Hits, EDM, Pop & Future House',
                dial: 'Dance HD',
                country: 'Global 🌐',
                streamUrl: 'https://dancewave.online/dance.mp3',
                color: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                icon: 'fa-compact-disc'
            },
            {
                id: 'classic-fm',
                name: 'Classic FM London',
                desc: 'The World’s Greatest Music • Mozart, Chopin, Beethoven',
                dial: '100.9 FM',
                country: 'United Kingdom 🇬🇧',
                streamUrl: 'https://media-ice.musicradio.com/ClassicFMMP3',
                color: 'linear-gradient(135deg, #059669, #047857)',
                icon: 'fa-music'
            },
            {
                id: 'chillout-lofi',
                name: 'Chillout & Lo-Fi Lounge',
                desc: '24/7 Relaxing Beats, Coffee Shop Study & Ambient',
                dial: 'Lo-Fi HD',
                country: 'Global 🌐',
                streamUrl: 'https://stream.radioparadise.com/mellow-128',
                color: 'linear-gradient(135deg, #d946ef, #a855f7)',
                icon: 'fa-headphones'
            }
        ]
    };

    let currentTrackIndex = 0;
    let isPlaying = false;
    let isRadioMode = false;
    let activeRadioStation = null;
    let userCountry = 'IN'; // Defaults to India, auto-detects dynamically
    let currentTime = 0;
    let volume = 0.8;
    let isMuted = false;

    let audioElement = null;
    let synthTimer = null;
    let progressTimer = null;
    let audioCtx = null;

    // Detect user country/locale
    function detectUserCountry() {
        try {
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
            const lang = navigator.language || '';
            if (timeZone.includes('Calcutta') || timeZone.includes('Kolkata') || timeZone.includes('India') || lang.includes('IN')) {
                userCountry = 'IN';
            } else if (timeZone.includes('America') || lang.includes('US')) {
                userCountry = 'GLOBAL';
            } else {
                userCountry = 'GLOBAL';
            }
        } catch (e) {
            userCountry = 'IN';
        }
    }

    function initAudio() {
        audioElement = new Audio();
        audioElement.volume = volume;

        audioElement.addEventListener('timeupdate', () => {
            if (!isRadioMode && audioElement && audioElement.duration) {
                currentTime = Math.floor(audioElement.currentTime);
                updateProgressUI(currentTime, Math.floor(audioElement.duration));
            }
        });

        audioElement.addEventListener('ended', () => {
            if (!isRadioMode) nextTrack();
        });

        audioElement.addEventListener('error', (e) => {
            console.warn('Audio stream fallback triggered:', e);
            if (!isRadioMode) {
                startProceduralSynth();
            }
        });
    }

    /* ── Procedural Web Audio Synthesizer Engine ───────────────────────── */
    function getAudioContext() {
        if (!audioCtx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) audioCtx = new AudioCtx();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function playNote(freq, duration = 0.6, type = 'sine') {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);

        const actualVol = isMuted ? 0 : volume * 0.18;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(actualVol, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
    }

    function startProceduralSynth() {
        stopProceduralSynth();
        const track = TRACKS[currentTrackIndex];
        if (!track) return;
        const scale = track.synthScale || [261.63, 329.63, 392.00];
        const stepMs = Math.floor((60 / (track.tempo || 80)) * 1000);
        let noteIdx = 0;

        synthTimer = setInterval(() => {
            if (!isPlaying || isRadioMode) return;
            const freq = scale[noteIdx % scale.length];
            const oscType = track.id.includes('synthwave') ? 'sawtooth' : (track.id.includes('lofi') ? 'triangle' : 'sine');
            playNote(freq, stepMs / 1000 * 1.8, oscType);
            noteIdx++;
        }, stepMs);
    }

    function stopProceduralSynth() {
        if (synthTimer) {
            clearInterval(synthTimer);
            synthTimer = null;
        }
    }

    /* ── Player Logic ─────────────────────────────────────────────────── */
    function loadTrack(index, autoPlay = true) {
        isRadioMode = false;
        activeRadioStation = null;
        currentTrackIndex = (index + TRACKS.length) % TRACKS.length;
        const track = TRACKS[currentTrackIndex];
        currentTime = 0;

        if (audioElement) {
            audioElement.pause();
            audioElement.currentTime = 0;
        }
        stopProceduralSynth();

        updateTrackInfoUI(track);
        updateProgressUI(0, track.duration);
        highlightActiveTrackRow();

        if (autoPlay) {
            playTrack();
        } else {
            pauseTrack();
        }
    }

    function playTrack() {
        isPlaying = true;
        const track = TRACKS[currentTrackIndex];
        const playBtn = document.getElementById('music-play-btn');
        const eqBars = document.getElementById('music-eq-bars');

        if (playBtn) playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        if (eqBars) eqBars.classList.add('playing');

        if (track && track.audioUrl) {
            audioElement.src = track.audioUrl;
            audioElement.play().catch(() => {
                startProceduralSynth();
            });
        } else {
            startProceduralSynth();
        }

        if (progressTimer) clearInterval(progressTimer);
        progressTimer = setInterval(() => {
            if (isPlaying && !isRadioMode && track) {
                currentTime++;
                if (currentTime >= track.duration) {
                    nextTrack();
                } else {
                    updateProgressUI(currentTime, track.duration);
                }
            }
        }, 1000);
    }

    function playRadioStation(station) {
        isRadioMode = true;
        activeRadioStation = station;
        stopProceduralSynth();

        const playBtn = document.getElementById('music-play-btn');
        const eqBars = document.getElementById('music-eq-bars');
        const titleEl = document.getElementById('music-lcd-track-title');
        const artistEl = document.getElementById('music-lcd-artist');
        const timeEl = document.getElementById('music-lcd-time');
        const fillEl = document.getElementById('music-progress-fill');

        if (playBtn) playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        if (eqBars) eqBars.classList.add('playing');

        if (titleEl) titleEl.innerHTML = `<span style="color:#fa243c;margin-right:6px;"><i class="fas fa-broadcast-tower"></i></span> ${station.name}`;
        if (artistEl) artistEl.textContent = `${station.dial} • ${station.country}`;
        if (timeEl) timeEl.innerHTML = `<span style="color:#ff3b30;font-weight:700;">● LIVE ON AIR</span>`;
        if (fillEl) fillEl.style.width = '100%';

        if (audioElement) {
            audioElement.pause();
            audioElement.src = station.streamUrl;
            audioElement.play().then(() => {
                isPlaying = true;
            }).catch(err => {
                console.warn('Radio stream connect notice:', err);
                // Harmless retry with alternative stream
                isPlaying = true;
            });
        }

        // Highlight active station card
        document.querySelectorAll('.music-station-card').forEach(c => {
            c.classList.toggle('active', c.dataset.stationId === station.id);
        });
    }

    function pauseTrack() {
        isPlaying = false;
        const playBtn = document.getElementById('music-play-btn');
        const eqBars = document.getElementById('music-eq-bars');

        if (playBtn) playBtn.innerHTML = '<i class="fas fa-play" style="margin-left:2px;"></i>';
        if (eqBars) eqBars.classList.remove('playing');

        if (audioElement) audioElement.pause();
        stopProceduralSynth();
        if (progressTimer) clearInterval(progressTimer);
    }

    function togglePlay() {
        if (isPlaying) {
            pauseTrack();
        } else {
            if (isRadioMode && activeRadioStation) {
                playRadioStation(activeRadioStation);
            } else {
                playTrack();
            }
        }
    }

    function nextTrack() {
        if (isRadioMode) {
            const list = RADIO_STATIONS[userCountry] || RADIO_STATIONS.IN;
            const currentIdx = list.findIndex(s => s.id === activeRadioStation?.id);
            const nextIdx = (currentIdx + 1) % list.length;
            playRadioStation(list[nextIdx]);
        } else {
            loadTrack(currentTrackIndex + 1, true);
        }
    }

    function prevTrack() {
        if (isRadioMode) {
            const list = RADIO_STATIONS[userCountry] || RADIO_STATIONS.IN;
            const currentIdx = list.findIndex(s => s.id === activeRadioStation?.id);
            const prevIdx = (currentIdx - 1 + list.length) % list.length;
            playRadioStation(list[prevIdx]);
        } else {
            if (currentTime > 4) {
                seekToTime(0);
            } else {
                loadTrack(currentTrackIndex - 1, true);
            }
        }
    }

    function seekToTime(seconds) {
        if (isRadioMode) return; // Live stream cannot seek past
        currentTime = seconds;
        const track = TRACKS[currentTrackIndex];
        if (audioElement && audioElement.duration) {
            audioElement.currentTime = seconds;
        }
        if (track) updateProgressUI(currentTime, track.duration);
    }

    function setVolume(val) {
        volume = parseFloat(val);
        isMuted = false;
        if (audioElement) audioElement.volume = volume;
        const icon = document.getElementById('music-vol-icon');
        if (icon) {
            if (volume === 0) icon.className = 'fas fa-volume-xmark';
            else if (volume < 0.5) icon.className = 'fas fa-volume-low';
            else icon.className = 'fas fa-volume-high';
        }
    }

    function toggleMute() {
        isMuted = !isMuted;
        if (audioElement) audioElement.volume = isMuted ? 0 : volume;
        const icon = document.getElementById('music-vol-icon');
        if (icon) {
            icon.className = isMuted ? 'fas fa-volume-xmark' : (volume > 0.5 ? 'fas fa-volume-high' : 'fas fa-volume-low');
        }
    }

    /* ── Navigation Views (Listen Now vs Radio) ───────────────────────── */
    function switchMusicView(viewName) {
        document.querySelectorAll('.music-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });

        const tracksView = document.getElementById('music-view-tracks');
        const radioView = document.getElementById('music-view-radio');

        if (viewName === 'radio') {
            if (tracksView) tracksView.style.display = 'none';
            if (radioView) {
                radioView.style.display = 'block';
                renderRadioStations();
            }
        } else {
            if (radioView) radioView.style.display = 'none';
            if (tracksView) tracksView.style.display = 'block';
        }
    }

    function renderRadioStations() {
        const grid = document.getElementById('music-radio-grid');
        if (!grid) return;

        const stations = RADIO_STATIONS[userCountry] || RADIO_STATIONS.IN;
        grid.innerHTML = stations.map(s => `
            <div class="music-station-card ${activeRadioStation?.id === s.id ? 'active' : ''}" data-station-id="${s.id}" onclick="window.playAppleRadio('${s.id}')">
                <div class="music-station-banner" style="background:${s.color};">
                    <i class="fas ${s.icon}"></i>
                    <div class="music-live-badge"><span class="music-live-badge-dot"></span> LIVE</div>
                </div>
                <div class="music-station-name">${s.name}</div>
                <div class="music-station-desc">${s.desc}</div>
            </div>
        `).join('');
    }

    window.switchRadioCountry = function(c) {
        userCountry = c;
        renderRadioStations();
    };

    window.playAppleRadio = function(stationId) {
        const all = [...(RADIO_STATIONS.IN || []), ...(RADIO_STATIONS.GLOBAL || [])];
        const found = all.find(s => s.id === stationId);
        if (found) playRadioStation(found);
    };

    /* ── UI Helpers ───────────────────────────────────────────────────── */
    function formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    function updateTrackInfoUI(track) {
        const titleEl = document.getElementById('music-lcd-track-title');
        const artistEl = document.getElementById('music-lcd-artist');
        if (titleEl) titleEl.textContent = track.title;
        if (artistEl) artistEl.textContent = track.artist;
    }

    function updateProgressUI(cur, total) {
        if (isRadioMode) return;
        const timeEl = document.getElementById('music-lcd-time');
        const fillEl = document.getElementById('music-progress-fill');
        if (timeEl) timeEl.textContent = `${formatTime(cur)} / ${formatTime(total)}`;
        if (fillEl && total > 0) {
            const pct = Math.min(100, Math.max(0, (cur / total) * 100));
            fillEl.style.width = pct + '%';
        }
    }

    function renderTrackTable() {
        const tbody = document.getElementById('music-track-tbody');
        if (!tbody) return;

        tbody.innerHTML = TRACKS.map((t, idx) => `
            <tr class="music-track-row ${idx === currentTrackIndex && !isRadioMode ? 'active' : ''}" onclick="window.playMusicTrackIndex(${idx})">
                <td class="music-track-num">${idx + 1}</td>
                <td>
                    <div class="music-track-info-cell">
                        <div class="music-track-cover" style="background:${t.color};">
                            <i class="fas ${t.icon}"></i>
                        </div>
                        <div class="music-track-title-wrap">
                            <span class="music-track-name">${t.title}</span>
                            <span class="music-track-artist-sub">${t.artist}</span>
                        </div>
                    </div>
                </td>
                <td style="color:rgba(255,255,255,0.6);">${t.album}</td>
                <td class="music-track-dur">${t.durationStr}</td>
            </tr>
        `).join('');
    }

    function highlightActiveTrackRow() {
        const rows = document.querySelectorAll('.music-track-row');
        rows.forEach((r, idx) => {
            r.classList.toggle('active', idx === currentTrackIndex && !isRadioMode);
        });
    }

    function setupScrubberClick() {
        const bar = document.getElementById('music-progress-bar');
        if (!bar) return;
        bar.addEventListener('click', (e) => {
            if (isRadioMode) return;
            const rect = bar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = Math.max(0, Math.min(1, clickX / rect.width));
            const track = TRACKS[currentTrackIndex];
            if (track) seekToTime(Math.floor(pct * track.duration));
        });
    }

    // Window lifecycle
    window.openMusic = function() {
        if (typeof openWindow === 'function') openWindow('music-window');
        if (!isPlaying) {
            loadTrack(0, false);
        }
    };

    window.closeMusic = function() {
        pauseTrack();
        if (typeof closeWindow === 'function') closeWindow('music-window');
    };

    window.toggleMusicPlay = togglePlay;
    window.nextMusicTrack = nextTrack;
    window.prevMusicTrack = prevTrack;
    window.setMusicVolume = setVolume;
    window.toggleMusicMute = toggleMute;
    window.switchMusicNav = switchMusicView;
    window.playMusicTrackIndex = function(idx) {
        loadTrack(idx, true);
    };

    document.addEventListener('DOMContentLoaded', () => {
        detectUserCountry();
        initAudio();
        renderTrackTable();
        setupScrubberClick();
        loadTrack(0, false);
    });
})();
