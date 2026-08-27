/* ==========================================================================
   Boot Animation Controller — macOS Startup Sequence
   Phase 1: "Mudit Agrawal" name logo with progress bar
   Phase 2: Apple's handwritten "hello", drawn as one continuous stroke
   ========================================================================== */

// The chime plays once the loading bar finishes filling (or the instant the
// visitor skips) — NOT at boot start. It used to fire immediately alongside
// the name, choreographed against the clip's measured waveform (loud from
// frame one, sustained to ~1.5s, decaying to silence by ~2.56s). That's no
// longer relevant to Phase 1's own timing since the two aren't playing
// together anymore; the interesting acoustic fact that survives is just
// that the chime is instantly loud, so pairing it with an immediate glow
// "beat" (not a slow fade-in) is still what makes it feel synced.
// Measured length of assets/mac_startup.mp3 (decoded to PCM, RMS-sampled):
// 2560ms, loud from the first frame, decaying to silence at the end.
const CHIME_DURATION_MS = 2560;

const BOOT_CONFIG = {
    // The bar fills over exactly the chime's length, so the fill completes
    // as the sound resolves — they are one gesture, not two events that
    // happen to be near each other.
    progressDuration: CHIME_DURATION_MS,
    postChimeHold: 260,         // brief beat after both land, before "hello"
    helloWriteDuration: 2200,   // must match the helloWrite keyframe duration in css/boot.css
    helloHoldAfterWrite: 620,   // ms the finished word stays on screen
    fadeOutDuration: 520        // ms for overlay fade-out
};

let bootFinished = false;
let bootTimers = [];
let bootChimeEl = null;

function bootTimeout(fn, ms) {
    const id = setTimeout(fn, ms);
    bootTimers.push(id);
    return id;
}

/**
 * Routes to the lock screen, or straight past it to the desktop if this
 * session already unlocked once. Every "boot is done/skipped" exit uses
 * this instead of calling showDesktop() directly, so the lock screen is
 * never bypassed on a fresh session no matter which path got here.
 */
function proceedPastBoot() {
    if (typeof showLockScreen === 'function') showLockScreen();
    else showDesktop();
}

function initBootAnimation() {
    const overlay = document.getElementById('boot-overlay');
    if (!overlay) {
        proceedPastBoot();
        return;
    }

    // Respect the OS-level motion preference — skip the animated intro, but
    // still go through the lock screen.
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        overlay.classList.add('hidden');
        proceedPastBoot();
        return;
    }

    hideDesktop();

    // ONE path, every visit, every browser.
    //
    // Previously this probed for autoplay permission and branched: play
    // directly if allowed, otherwise show a gate. Two paths meant two ways
    // to fail, and the "allowed" branch only ever fired once per tab
    // because the boot was skipped on subsequent loads.
    //
    // A real user gesture is the ONLY mechanism guaranteed to unlock audio
    // in every browser, so the gate is now unconditional. The click starts
    // the chime and the progress bar in the same tick — they run in
    // lockstep and finish together.
    showPowerGate(beginBootSequence);
}

/**
 * Arms skip-to-dismiss and runs Phase 1. The chime is already playing by
 * the time this is called (it started with the power-gate click), so this
 * only has to drive the visuals.
 */
function beginBootSequence() {
    const overlay = document.getElementById('boot-overlay');
    if (overlay) overlay.setAttribute('title', 'Click to skip');

    const skip = (e) => {
        if (e.type === 'keydown' && e.key === 'Tab') return;
        finishBoot(true);
    };
    document.addEventListener('click', skip, { once: true });
    document.addEventListener('keydown', skip, { once: true });

    startPhase1();
}

/**
 * The power-on screen. Shown on every visit — this is the single entry
 * point into the boot sequence.
 *
 * Its click is what makes the chime reliable: calling play() synchronously
 * inside a real gesture handler is the one approach every browser honours,
 * with no probing, no sticky-activation assumptions and no fallback path.
 */
function showPowerGate(onStart) {
    const gate = document.getElementById('boot-power-gate');
    if (!gate) { onStart(); return; }

    gate.classList.remove('dismissed');
    gate.classList.add('visible');

    const start = () => {
        gate.removeEventListener('click', start);
        document.removeEventListener('keydown', onKey);
        gate.classList.remove('visible');
        gate.classList.add('dismissed');

        // Directly in the gesture — guaranteed to be permitted.
        playBootChime();

        // Deferred a macrotask: THIS click is still propagating, and the
        // skip listener armed inside onStart is document-level, so it would
        // otherwise be fired by the very same event and skip the boot the
        // visitor just asked to begin.
        setTimeout(onStart, 0);
    };
    const onKey = (e) => {
        if (e.key === 'Tab') return;
        start();
    };

    gate.addEventListener('click', start);
    document.addEventListener('keydown', onKey);
}

let bootChimePlayed = false;

/**
 * Plays the startup chime and fires the name's glow "beat" in the same
 * instant — called when the loading bar finishes, or immediately on skip.
 * Idempotent: harmless if a fast click-then-keydown skip both fire before
 * the first one flips bootFinished.
 *
 * Most browsers block audio-with-sound autoplay on a page nobody has
 * interacted with yet — that's a platform policy, not a bug here. By the
 * time this runs the visitor has either sat through ~1.2s of the loading
 * bar or actively clicked/pressed a key to skip, either of which is real
 * engagement, so playback succeeds far more often than it would have at
 * boot start. If it's still refused, we swallow the rejection and the
 * glow beat plays anyway — the visual doesn't depend on the audio landing.
 */
function playBootChime() {
    if (bootChimePlayed) return;
    bootChimePlayed = true;

    const nameEl = document.getElementById('boot-name');
    if (nameEl) nameEl.classList.add('glowing', 'chime-beat');

    bootChimeEl = document.getElementById('boot-chime');
    if (!bootChimeEl) return;

    bootChimeEl.currentTime = 0;
    bootChimeEl.volume = 0.85;
    const playPromise = bootChimeEl.play();
    if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => { /* autoplay refused — proceed silently */ });
    }
}

function bootChrome() {
    return [
        document.querySelector('.menu-bar'),
        document.getElementById('desktop'),
        document.querySelector('.dock-container')
    ].filter(Boolean);
}

function hideDesktop() {
    // pointer-events too: the invisible desktop was still clickable during boot.
    bootChrome().forEach(el => {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
    });
}

function showDesktop() {
    bootChrome().forEach((el, i) => {
        el.style.transition = `opacity 0.5s ease ${i === 2 ? 0.15 : 0}s`;
        el.style.opacity = '1';
        el.style.pointerEvents = '';
    });
    // Clear the inline opacity once the fade lands so stylesheets stay in charge.
    setTimeout(() => bootChrome().forEach(el => {
        el.style.opacity = '';
        el.style.transition = '';
    }), 750);
}

function startPhase1() {
    const progressBar = document.getElementById('boot-progress-bar');
    if (!progressBar) { startPhase2(); return; }

    // The bar is driven by a single CSS transition rather than a setInterval
    // stepping the width. setInterval was the reason it looked jerky: the
    // callback is throttled and coalesced by the browser, so the width moved
    // in visible jumps of uneven size (it also had deliberate randomness
    // added on top). One linear transition is frame-accurate and smooth.
    progressBar.style.transition = `width ${BOOT_CONFIG.progressDuration}ms linear`;

    let handedOff = false;
    const handOff = () => {
        if (handedOff || bootFinished) return;
        handedOff = true;
        // The chime is already playing — it started with this bar, from the
        // power-gate click. Nothing to trigger here but the hand-off.
        bootTimeout(() => startPhase2(), BOOT_CONFIG.postChimeHold);
    };

    progressBar.addEventListener('transitionend', handOff, { once: true });

    // transitionend does not fire if the tab is backgrounded before the
    // transition starts, so guarantee the hand-off with a safety timer.
    bootTimeout(handOff, BOOT_CONFIG.progressDuration + 120);

    // Force a style flush so the browser commits the 0% starting width
    // before the transition to 100% begins — otherwise it snaps with no
    // animation. Deliberately NOT requestAnimationFrame: rAF is suspended
    // in background tabs, which would leave the bar frozen at 0% for the
    // whole boot (the same trap that stopped the "hello" stroke drawing).
    void progressBar.offsetWidth;
    progressBar.style.width = '100%';
}

function startPhase2() {
    const nameContainer = document.querySelector('.boot-name-container');
    const helloContainer = document.querySelector('.boot-hello-container');

    // Fade out name
    if (nameContainer) {
        nameContainer.style.transition = 'opacity 0.5s ease';
        nameContainer.style.opacity = '0';
    }

    bootTimeout(() => {
        if (bootFinished) return;
        if (!helloContainer) { finishBoot(); return; }

        helloContainer.classList.add('active');
        // Force a style flush so the .active opacity transition and the
        // stroke animation are two separate recalculations.
        //
        // This deliberately does NOT use requestAnimationFrame: rAF is
        // suspended while a tab is backgrounded, so opening the site in a
        // background tab meant .writing was never applied — the stroke
        // stayed at dashoffset 1 (invisible) while the timers marched on,
        // and the visitor came back to a blank screen where "hello" should
        // have been. A forced reflow runs regardless of tab visibility.
        void helloContainer.offsetWidth;
        helloContainer.classList.add('writing');

        bootTimeout(() => {
            if (bootFinished) return;
            helloContainer.classList.add('settled');
            bootTimeout(() => finishBoot(), BOOT_CONFIG.helloHoldAfterWrite);
        }, BOOT_CONFIG.helloWriteDuration);
    }, 380);
}

function finishBoot(skipped) {
    if (bootFinished) return;
    bootFinished = true;
    bootTimers.forEach(clearTimeout);
    bootTimers = [];

    // Deliberately NOT calling stopBootChime() here. On skip, this runs in
    // the same tick as playBootChime() (see the skip handler) — cutting the
    // chime here would kill it within milliseconds of it starting, which is
    // exactly backwards from "the chime should play... when the visitor
    // clicks to skip". Letting it finish in the background over the fade
    // is the correct behavior for both exit paths.

    const overlay = document.getElementById('boot-overlay');
    if (!overlay) { proceedPastBoot(); return; }

    overlay.classList.add('fade-out');
    setTimeout(() => {
        overlay.classList.add('hidden');
        proceedPastBoot();
    }, skipped ? 200 : BOOT_CONFIG.fadeOutDuration);
}

// Initialize boot on DOM ready
document.addEventListener('DOMContentLoaded', initBootAnimation);
