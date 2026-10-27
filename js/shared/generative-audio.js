/* ==========================================================================
   Generative audio — the Web Audio engine behind Music's generative tracks
   --------------------------------------------------------------------------
   Shared by Music on Mac and iPhone. A track is a small spec (tempo, chord
   loop, filter, swing, delay, drums), rendered live with a look-ahead
   scheduler: a detuned pad, a bass note, an arpeggio through a feedback
   delay, and an optional kick and hi-hat.
   ========================================================================== */

let sharedAudioCtx = null;

/** One AudioContext for the page, resumed on demand (autoplay policies suspend it). */
function getSharedAudioContext() {
    if (!sharedAudioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (Ctx) sharedAudioCtx = new Ctx();
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') sharedAudioCtx.resume().catch(() => {});
    return sharedAudioCtx;
}

/**
 * Starts a generative track described by `spec` (bpm, chords, cutoff, swing,
 * delay, drums, wave) at `startBeat`, at volume 0–1.
 * @returns {{ setVolume(v:number):void, stop():void, beatAt(s:number):number } | null}
 */
function createGenerativeEngine(spec, startBeat = 0, volume = 1) {
    const ctx = getSharedAudioContext();
    if (!ctx) return null;
    const out = ctx.createGain();
    out.gain.value = 0;
    out.gain.linearRampToValueAtTime(volume * 0.55, ctx.currentTime + 0.4);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = spec.cutoff;
    filter.Q.value = 0.7;
    filter.connect(out);
    out.connect(ctx.destination);

    // A short feedback delay gives the plucks some space.
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 60 / spec.bpm * 0.75;
    const fb = ctx.createGain();
    fb.gain.value = spec.delay;
    delay.connect(fb); fb.connect(delay); delay.connect(filter);

    const beatLen = 60 / spec.bpm;
    let beat = startBeat || 0;
    let nextTime = ctx.currentTime + 0.08;
    let noiseBuf = null;

    function noise() {
        if (noiseBuf) return noiseBuf;
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        return noiseBuf;
    }

    function tone(freq, t, dur, type, gain, dest) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.04, dur / 4));
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(dest || filter);
        o.start(t); o.stop(t + dur + 0.05);
    }

    function scheduleBeat(t) {
        const bar = Math.floor(beat / 4) % spec.chords.length;
        const chord = spec.chords[bar];
        const inBar = beat % 4;
        if (inBar === 0) {
            // Pad: the whole chord, slow attack, detuned pair for width.
            chord.forEach(f => {
                tone(f, t, beatLen * 4.2, 'triangle', 0.05);
                tone(f * 1.003, t, beatLen * 4.2, 'sine', 0.035);
            });
            tone(chord[0] / 2, t, beatLen * 3.6, 'sine', 0.12);       // bass
        }
        // Arpeggio: two plucks per beat, an octave up, into the delay.
        for (let k = 0; k < 2; k++) {
            const swing = k === 1 ? spec.swing * beatLen : 0;
            const f = chord[(inBar * 2 + k) % chord.length] * 2;
            tone(f, t + k * beatLen / 2 + swing, beatLen * 0.9, spec.wave || 'triangle', 0.06, delay);
            tone(f, t + k * beatLen / 2 + swing, beatLen * 0.9, spec.wave || 'triangle', 0.05);
        }
        if (spec.drums) {
            if (inBar === 0 || inBar === 2) {            // kick
                const o = ctx.createOscillator(); const g = ctx.createGain();
                o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.18);
                g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
                o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.25);
            }
            const h = ctx.createBufferSource(); h.buffer = noise();     // hat on the off-beat
            const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
            const hg = ctx.createGain();
            const ht = t + beatLen / 2 + spec.swing * beatLen;
            hg.gain.setValueAtTime(0.05, ht); hg.gain.exponentialRampToValueAtTime(0.0001, ht + 0.05);
            h.connect(hp); hp.connect(hg); hg.connect(out); h.start(ht); h.stop(ht + 0.06);
        }
    }

    // Look-ahead scheduler: robust to timer jitter.
    const timer = setInterval(() => {
        while (nextTime < ctx.currentTime + 0.25) {
            scheduleBeat(nextTime);
            nextTime += beatLen;
            beat++;
        }
    }, 60);

    return {
        setVolume(v) { out.gain.setTargetAtTime(v * 0.55, ctx.currentTime, 0.05); },
        stop() {
            clearInterval(timer);
            const t = ctx.currentTime;
            out.gain.cancelScheduledValues(t);
            out.gain.setTargetAtTime(0, t, 0.08);
            setTimeout(() => { try { out.disconnect(); } catch (e) { /* already gone */ } }, 600);
        },
        beatAt(seconds) { return Math.floor(seconds / beatLen); }
    };
}
