/* ==========================================================================
   Lock Screen — Apple-style swipe-to-unlock
   --------------------------------------------------------------------------
   Shown once per session right after the boot animation finishes, exactly
   like waking a real Mac: blurred wallpaper, a huge frosted time widget,
   date, weather (from the visitor's own location), and battery. Drag or
   swipe upward to unlock — there's no password, matching how a portfolio
   visitor actually expects this to work.

   Location: derived from the browser's own timezone first (instant, no
   network, no rate limit), then optionally refined by an IP lookup for a
   better city name. Deliberately NOT navigator.geolocation — a permission
   prompt is not something a portfolio should spring on a recruiter.
   ========================================================================== */

const LOCK_UNLOCK_SESSION_KEY = 'mac-unlocked';
let lockDragState = null;

/* ── DOM ──────────────────────────────────────────────────────────────── */

function ensureLockScreenDom() {
    if (document.getElementById('lock-screen-overlay')) return;

    const el = document.createElement('div');
    el.id = 'lock-screen-overlay';
    el.className = 'lock-screen-overlay';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Lock Screen');
    el.innerHTML = `
        <div class="lock-bg" id="lock-bg"></div>
        <div class="lock-scrim"></div>

        <!-- Top-right status cluster — plain icons directly on the
             wallpaper, matching the real macOS lock screen's menu-bar-style
             readout (no card/blur chrome here; that's reserved for the time). -->
        <div class="lock-status-bar">
            <span class="lock-status-item" id="lock-status-weather" title="Weather">
                <i class="fas fa-cloud" id="lock-weather-icon"></i>
                <span id="lock-weather-temp">&mdash;</span>
            </span>
            <span class="lock-status-item" id="lock-status-battery" title="Battery">
                <span id="lock-battery-pct">&mdash;</span>
                <i class="fas fa-battery-full" id="lock-battery-icon"></i>
            </span>
            <span class="lock-status-item">
                <i class="fas fa-wifi"></i>
            </span>
        </div>

        <div class="lock-content" id="lock-content">
            <div class="lock-center">
                <div class="lock-time" id="lock-time">--:--</div>
                <div class="lock-date" id="lock-date">&hellip;</div>
            </div>

            <div class="lock-content-spacer"></div>

            <div class="lock-account">
                <div class="lock-avatar">
                    <img src="${escapeHtml(window.PROFILE_DATA.photo)}" alt="">
                </div>
                <div class="lock-account-name">${escapeHtml(window.PROFILE_DATA.name)}</div>
                <button type="button" class="lock-swipe-hint" id="lock-swipe-hint" aria-label="Unlock">
                    <i class="fas fa-chevron-up"></i>
                    <span>Click or swipe up to unlock</span>
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(el);

    wireLockSwipe(el);
}

/* ── Show / unlock ────────────────────────────────────────────────────── */

function showLockScreen() {
    if (typeof sessionStorage !== 'undefined') {
        try {
            if (sessionStorage.getItem(LOCK_UNLOCK_SESSION_KEY)) {
                showDesktop();
                return;
            }
        } catch (e) { /* private browsing — just show the lock screen */ }
    }

    ensureLockScreenDom();
    const overlay = document.getElementById('lock-screen-overlay');
    if (!overlay) { showDesktop(); return; }

    // Mirror whatever wallpaper is actually active (including a custom one
    // set via System Settings), not a hardcoded default.
    const bg = document.getElementById('lock-bg');
    if (bg) bg.style.backgroundImage = getComputedStyle(document.body).backgroundImage;

    overlay.classList.remove('unlocking');
    overlay.style.display = '';
    // Force reflow so the entrance transition (opacity/blur) actually plays
    // instead of the browser coalescing it with the display change above.
    void overlay.offsetHeight;
    overlay.classList.add('active');

    updateLockClock();
    if (!lockClockTimer) lockClockTimer = setInterval(updateLockClock, 1000);

    refreshLockBattery();
    window.addEventListener('battery-status-changed', refreshLockBattery);

    loadLockWeather();
}

function unlockDesktop() {
    const overlay = document.getElementById('lock-screen-overlay');
    if (!overlay) { showDesktop(); return; }

    overlay.classList.add('unlocking');
    window.removeEventListener('battery-status-changed', refreshLockBattery);
    if (lockClockTimer) { clearInterval(lockClockTimer); lockClockTimer = null; }

    try { sessionStorage.setItem(LOCK_UNLOCK_SESSION_KEY, 'true'); } catch (e) {}

    setTimeout(() => {
        overlay.classList.remove('active');
        overlay.style.display = 'none';
        // Reset drag transform so re-locking (Apple menu → Lock Screen)
        // starts from a clean position next time.
        const content = document.getElementById('lock-content');
        if (content) content.style.transform = '';
    }, 520);

    showDesktop();
}

/** Re-shows the lock screen on demand — wired to the Apple menu. */
function lockScreenNow() {
    try { sessionStorage.removeItem(LOCK_UNLOCK_SESSION_KEY); } catch (e) {}
    document.querySelectorAll('.menu-dropdown').forEach(m => m.classList.add('hidden'));
    showLockScreen();
}

/* ── Clock / date ─────────────────────────────────────────────────────── */

let lockClockTimer = null;

function updateLockClock() {
    const now = new Date();
    const timeEl = document.getElementById('lock-time');
    const dateEl = document.getElementById('lock-date');
    if (!timeEl || !dateEl) return;

    // Respect the visitor's OWN locale for 12h vs 24h — same as the real
    // macOS lock screen, which always reflects the Mac's current region
    // format rather than a hardcoded one. formatToParts (not a manual
    // getHours()/12 check) is what correctly omits AM/PM entirely for
    // 24h locales instead of always appending one.
    const parts = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).formatToParts(now);
    let hour = '', minute = '', ampm = '';
    parts.forEach(p => {
        if (p.type === 'hour') hour = p.value;
        else if (p.type === 'minute') minute = p.value;
        else if (p.type === 'dayPeriod') ampm = p.value;
    });
    timeEl.innerHTML = ampm ? `${hour}:${minute}<span class="lock-time-ampm">${ampm}</span>` : `${hour}:${minute}`;

    dateEl.textContent = now.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

/* ── Battery ──────────────────────────────────────────────────────────── */

function refreshLockBattery() {
    const pctEl = document.getElementById('lock-battery-pct');
    const iconEl = document.getElementById('lock-battery-icon');
    if (!pctEl || !iconEl) return;

    const level = window.SYSTEM_BATTERY_LEVEL;
    const charging = Boolean(window.SYSTEM_BATTERY_CHARGING);
    if (typeof level !== 'number') return;

    pctEl.textContent = `${level}%`;
    iconEl.className = 'fas ' + (
        charging ? 'fa-bolt' :
        level <= 15 ? 'fa-battery-quarter' :
        level <= 40 ? 'fa-battery-half' :
        level <= 75 ? 'fa-battery-three-quarters' : 'fa-battery-full'
    );
}

/* ── Weather ──────────────────────────────────────────────────────────── */

async function loadLockWeather() {
    try {
        renderLockWeather(await fetchLiveWeather());
    } catch (e) {
        renderLockWeatherError();
    }
}

function renderLockWeather(data) {
    const tempEl = document.getElementById('lock-weather-temp');
    const iconEl = document.getElementById('lock-weather-icon');
    const itemEl = document.getElementById('lock-status-weather');
    if (!tempEl || !iconEl) return;

    const entry = WMO_WEATHER[data.code] || WMO_WEATHER[3];
    const iconClass = data.isDay ? entry[0] : entry[1];

    tempEl.textContent = `${data.temp}${data.unit}`;
    iconEl.className = `fas ${iconClass}`;
    // City name isn't shown inline (keeps the corner readout compact, like
    // the real lock screen's status icons) but is still available on hover.
    if (itemEl) itemEl.title = `${entry[2]} in ${data.place}`;
}

function renderLockWeatherError() {
    const itemEl = document.getElementById('lock-status-weather');
    const tempEl = document.getElementById('lock-weather-temp');
    const iconEl = document.getElementById('lock-weather-icon');
    if (tempEl) tempEl.textContent = '';
    if (iconEl) iconEl.className = 'fas fa-cloud-slash';
    if (itemEl) itemEl.title = 'Weather unavailable';
}

/* ── Swipe / drag to unlock ───────────────────────────────────────────── */

function wireLockSwipe(overlay) {
    const content = document.getElementById('lock-content');
    const hint = document.getElementById('lock-swipe-hint');
    if (!content) return;

    const UNLOCK_DISTANCE = 120;   // px dragged before it counts as unlocked
    const UNLOCK_VELOCITY = 0.6;   // px/ms — a fast flick unlocks even if short
    const TAP_SLOP = 8;            // px of movement still treated as a tap
    const TAP_MAX_MS = 500;

    function onPointerDown(e) {
        if (overlay.classList.contains('unlocking')) return;
        // The hint is a real button with its own click handler. Starting a
        // drag (and capturing the pointer) here retargeted its click to the
        // overlay, so clicking "unlock" did nothing at all.
        if (e.target.closest && e.target.closest('#lock-swipe-hint')) return;
        lockDragState = {
            startY: e.clientY,
            lastY: e.clientY,
            startT: performance.now(),
            lastT: performance.now(),
            maxTravel: 0,
            velocity: 0,
            dragging: true
        };
        content.style.transition = 'none';
        overlay.setPointerCapture && overlay.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e) {
        if (!lockDragState || !lockDragState.dragging) return;
        const dy = e.clientY - lockDragState.startY;
        const now = performance.now();
        const dt = now - lockDragState.lastT;
        // A tiny dt (two pointermove events firing back-to-back — common
        // with high-poll-rate input, and the only thing that happens with
        // synthetic/programmatic events) makes px/ms spike unrealistically
        // and could flag an ordinary small move as a "fast flick". Only
        // recompute velocity once at least one frame's worth of time has
        // actually passed; otherwise keep the last real reading.
        if (dt >= 8) {
            lockDragState.velocity = (e.clientY - lockDragState.lastY) / dt;
            lockDragState.lastY = e.clientY;
            lockDragState.lastT = now;
        }
        lockDragState.maxTravel = Math.max(lockDragState.maxTravel, Math.abs(dy));

        // Only upward movement drags the content; resist downward motion.
        const clamped = Math.min(0, dy);
        const progress = Math.min(1, Math.abs(clamped) / (window.innerHeight * 0.6));
        content.style.transform = `translateY(${clamped}px)`;
        overlay.style.setProperty('--lock-progress', progress.toFixed(3));
    }

    function onPointerUp(e) {
        if (!lockDragState) return;
        if (e && typeof e.clientY === 'number') lockDragState.lastY = e.clientY;
        const traveled = lockDragState.startY - lockDragState.lastY;
        const fastFlick = lockDragState.velocity < -UNLOCK_VELOCITY;
        // A plain click/tap wakes the Mac — most visitors click rather than
        // drag, and a lock screen that ignores clicks reads as frozen.
        const isTap = e && e.type === 'pointerup'
            && lockDragState.maxTravel < TAP_SLOP
            && (performance.now() - lockDragState.startT) < TAP_MAX_MS;
        lockDragState.dragging = false;

        content.style.transition = 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)';

        if (traveled > UNLOCK_DISTANCE || fastFlick || isTap) {
            content.style.transform = 'translateY(-120vh)';
            unlockDesktop();
        } else {
            content.style.transform = '';
            overlay.style.setProperty('--lock-progress', '0');
        }
        lockDragState = null;
    }

    overlay.addEventListener('pointerdown', onPointerDown);
    overlay.addEventListener('pointermove', onPointerMove);
    overlay.addEventListener('pointerup', onPointerUp);
    overlay.addEventListener('pointercancel', onPointerUp);

    // Accessible fallback: the hint itself is a real <button>, so Enter,
    // Space, and a plain click/tap all unlock without requiring a drag.
    if (hint) {
        hint.addEventListener('click', () => {
            if (overlay.classList.contains('unlocking')) return;
            content.style.transition = 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)';
            content.style.transform = 'translateY(-120vh)';
            unlockDesktop();
        });
    }

    // Keyboard: listened for on the window in the capture phase, so it works
    // without focus inside the overlay (it used to require focus, i.e. it
    // never fired) AND so global shortcuts — ⌘K, ⌥L, F3 — can't open things
    // behind the lock screen.
    window.addEventListener('keydown', (e) => {
        if (!isLockScreenActive()) return;
        if (e.key === 'Tab') return;
        e.stopImmediatePropagation();
        if (e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            hint && hint.click();
        }
    }, true);
}

function isLockScreenActive() {
    const overlay = document.getElementById('lock-screen-overlay');
    return Boolean(overlay && overlay.classList.contains('active') && !overlay.classList.contains('unlocking'));
}
