/* ==========================================================================
   macOS Acoustics Engine — Zero-Latency Web Audio API Synthesizer
   --------------------------------------------------------------------------
   100% Procedurally Synthesized System Acoustics.
   Zero external audio files, zero network latency, 0.00ms response time.
   ========================================================================== */

(function() {
    let audioCtx = null;
    let isSoundMuted = false;
    let masterVolume = 0.8;

    // Load saved preferences
    try {
        const savedMute = localStorage.getItem('macos_sound_muted');
        if (savedMute !== null) isSoundMuted = savedMute === 'true';
        const savedVol = localStorage.getItem('macos_master_volume');
        if (savedVol !== null) masterVolume = parseFloat(savedVol) || 0.8;
    } catch (e) {}

    function getAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) audioCtx = new AudioContextClass();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        return audioCtx;
    }

    /**
     * Synthesizes authentic macOS acoustic micro-sounds
     * @param {'startup'|'click'|'windowOpen'|'windowClose'|'windowMinimize'|'trashEmpty'|'shutter'|'tick'|'boop'|'pop'} type
     */
    function playSystemSound(type = 'click') {
        if (isSoundMuted || masterVolume <= 0) return;
        if (typeof window.getPreference === 'function' && window.getPreference('sounds') === false) return;
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const vol = masterVolume;

        switch (type) {
            case 'click': {
                // Crisp mechanical micro-click
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(1200, now);
                osc.frequency.exponentialRampToValueAtTime(300, now + 0.025);
                gain.gain.setValueAtTime(0.08 * vol, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.025);
                break;
            }

            case 'tick': {
                // Ultra-short subtle slider tick
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                gain.gain.setValueAtTime(0.04 * vol, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.012);
                break;
            }

            case 'pop': {
                // Soft bubbly pop for dock & notifications
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(450, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);
                gain.gain.setValueAtTime(0.12 * vol, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.06);
                break;
            }

            case 'windowOpen': {
                // Smooth ascending spatial swoosh
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(320, now);
                osc.frequency.exponentialRampToValueAtTime(640, now + 0.08);
                gain.gain.setValueAtTime(0.05 * vol, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.08);
                break;
            }

            case 'windowClose': {
                // Soft descending click
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(520, now);
                osc.frequency.exponentialRampToValueAtTime(220, now + 0.05);
                gain.gain.setValueAtTime(0.06 * vol, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
            }

            case 'windowMinimize': {
                // Smooth descending swoop
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(180, now + 0.14);
                gain.gain.setValueAtTime(0.07 * vol, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.14);
                break;
            }

            case 'trashEmpty': {
                // Authentic paper crumple / slide sound
                const bufferSize = Math.floor(ctx.sampleRate * 0.22);
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
                }
                const noise = ctx.createBufferSource();
                noise.buffer = buffer;
                const filter = ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(1600, now);
                filter.frequency.exponentialRampToValueAtTime(600, now + 0.2);
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0.25 * vol, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
                noise.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);
                noise.start(now);
                break;
            }

            case 'shutter': {
                // Dual blade mechanical camera shutter
                const dur = 0.14;
                const bufferSize = Math.floor(ctx.sampleRate * dur);
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
                }
                const noise = ctx.createBufferSource();
                noise.buffer = buffer;
                const filter = ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.value = 1800;
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0.28 * vol, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
                noise.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);
                noise.start(now);
                break;
            }

            case 'boop': {
                // macOS alert boop
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(320, now);
                gain.gain.setValueAtTime(0.12 * vol, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.12);
                break;
            }

            case 'startup': {
                // Iconic macOS F-Sharp Major Chord Chime (F#2, C#3, F#3, A#3, C#4)
                const freqs = [92.50, 138.59, 185.00, 233.08, 277.18, 369.99];
                freqs.forEach((f, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = idx < 2 ? 'triangle' : 'sine';
                    osc.frequency.setValueAtTime(f, now);
                    const chimeVol = (0.16 / (idx + 1)) * vol;
                    gain.gain.setValueAtTime(0.001, now);
                    gain.gain.linearRampToValueAtTime(chimeVol, now + 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + 2.5);
                });
                break;
            }
        }
    }

    // Music (and anything else that plays audio) listens for this, so the
    // system volume and mute apply everywhere, as on a Mac.
    function broadcastVolume() {
        window.dispatchEvent(new CustomEvent('master-volume-changed', {
            detail: { volume: masterVolume, muted: isSoundMuted }
        }));
    }

    function toggleSystemMute() {
        isSoundMuted = !isSoundMuted;
        try { localStorage.setItem('macos_sound_muted', isSoundMuted); } catch (e) {}
        updateSoundUI();
        broadcastVolume();
        if (!isSoundMuted) playSystemSound('pop');
        return isSoundMuted;
    }

    function setMasterVolume(val) {
        masterVolume = Math.max(0, Math.min(1, parseFloat(val) || 0));
        try { localStorage.setItem('macos_master_volume', masterVolume); } catch (e) {}
        if (masterVolume > 0 && isSoundMuted) {
            isSoundMuted = false;
            try { localStorage.setItem('macos_sound_muted', false); } catch (e) {}
        }
        updateSoundUI();
        broadcastVolume();
    }

    function updateSoundUI() {
        const soundIcons = document.querySelectorAll('.sound-status-icon');
        soundIcons.forEach(icon => {
            const label = isSoundMuted ? 'Sound: muted — click to unmute' : `Sound: ${Math.round(masterVolume * 100)}% — click to mute`;
            icon.setAttribute('data-tooltip', label);
            icon.title = label;
            if (isSoundMuted || masterVolume === 0) {
                icon.className = 'fas fa-volume-xmark menu-icon sound-status-icon';
            } else if (masterVolume < 0.4) {
                icon.className = 'fas fa-volume-low menu-icon sound-status-icon';
            } else {
                icon.className = 'fas fa-volume-high menu-icon sound-status-icon';
            }
        });
    }

    // Expose globally
    window.playSystemSound = playSystemSound;
    window.toggleSystemMute = toggleSystemMute;
    window.setMasterVolume = setMasterVolume;
    window.isSystemMuted = () => isSoundMuted;
    window.getMasterVolume = () => masterVolume;

    document.addEventListener('DOMContentLoaded', () => {
        updateSoundUI();
    });
})();
