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
const LOCK_WEATHER_CACHE_KEY = 'mac-lock-weather-cache';
const LOCK_WEATHER_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// WMO weather codes (Open-Meteo) → icon + short label.
// https://open-meteo.com/en/docs — "WMO Weather interpretation codes"
const WMO_WEATHER = {
    0:  ['fa-sun', 'fa-moon', 'Clear'],
    1:  ['fa-cloud-sun', 'fa-cloud-moon', 'Mostly Clear'],
    2:  ['fa-cloud-sun', 'fa-cloud-moon', 'Partly Cloudy'],
    3:  ['fa-cloud', 'fa-cloud', 'Cloudy'],
    45: ['fa-smog', 'fa-smog', 'Fog'],
    48: ['fa-smog', 'fa-smog', 'Fog'],
    51: ['fa-cloud-rain', 'fa-cloud-rain', 'Light Drizzle'],
    53: ['fa-cloud-rain', 'fa-cloud-rain', 'Drizzle'],
    55: ['fa-cloud-rain', 'fa-cloud-rain', 'Heavy Drizzle'],
    61: ['fa-cloud-rain', 'fa-cloud-rain', 'Light Rain'],
    63: ['fa-cloud-showers-heavy', 'fa-cloud-showers-heavy', 'Rain'],
    65: ['fa-cloud-showers-heavy', 'fa-cloud-showers-heavy', 'Heavy Rain'],
    71: ['fa-snowflake', 'fa-snowflake', 'Light Snow'],
    73: ['fa-snowflake', 'fa-snowflake', 'Snow'],
    75: ['fa-snowflake', 'fa-snowflake', 'Heavy Snow'],
    80: ['fa-cloud-rain', 'fa-cloud-rain', 'Rain Showers'],
    81: ['fa-cloud-showers-heavy', 'fa-cloud-showers-heavy', 'Rain Showers'],
    82: ['fa-cloud-showers-heavy', 'fa-cloud-showers-heavy', 'Violent Showers'],
    95: ['fa-cloud-bolt', 'fa-cloud-bolt', 'Thunderstorm'],
    96: ['fa-cloud-bolt', 'fa-cloud-bolt', 'Thunderstorm'],
    99: ['fa-cloud-bolt', 'fa-cloud-bolt', 'Severe Thunderstorm']
};

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
                    <img src="assets/Professionalimage.jpeg" alt="">
                </div>
                <div class="lock-account-name">Mudit Agrawal</div>
                <button type="button" class="lock-swipe-hint" id="lock-swipe-hint" aria-label="Swipe up to unlock">
                    <i class="fas fa-chevron-up"></i>
                    <span>Swipe up to unlock</span>
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

function readWeatherCache() {
    try {
        const raw = sessionStorage.getItem(LOCK_WEATHER_CACHE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (Date.now() - data.timestamp > LOCK_WEATHER_CACHE_TTL_MS) return null;
        return data;
    } catch (e) {
        return null;
    }
}

function writeWeatherCache(data) {
    try {
        sessionStorage.setItem(LOCK_WEATHER_CACHE_KEY, JSON.stringify({ ...data, timestamp: Date.now() }));
    } catch (e) { /* ignore */ }
}

/* Timezone → approximate city coords. Resolving location this way needs NO
   network call and NO permission prompt, so the widget populates instantly
   and keeps working even if the IP lookup is rate-limited or blocked. The
   IP lookup below only runs to refine the city NAME. */
const TZ_COORDS = {
    'Asia/Kolkata':        [28.61, 77.21, 'India'],
    'Asia/Calcutta':       [28.61, 77.21, 'India'],
    'Asia/Dubai':          [25.20, 55.27, 'Dubai'],
    'Asia/Singapore':      [1.35, 103.82, 'Singapore'],
    'Asia/Tokyo':          [35.68, 139.69, 'Tokyo'],
    'Asia/Shanghai':       [31.23, 121.47, 'Shanghai'],
    'Europe/London':       [51.51, -0.13, 'London'],
    'Europe/Paris':        [48.86, 2.35, 'Paris'],
    'Europe/Berlin':       [52.52, 13.40, 'Berlin'],
    'Europe/Amsterdam':    [52.37, 4.90, 'Amsterdam'],
    'America/New_York':    [40.71, -74.01, 'New York'],
    'America/Chicago':     [41.88, -87.63, 'Chicago'],
    'America/Denver':      [39.74, -104.99, 'Denver'],
    'America/Los_Angeles': [34.05, -118.24, 'Los Angeles'],
    'America/Toronto':     [43.65, -79.38, 'Toronto'],
    'Australia/Sydney':    [-33.87, 151.21, 'Sydney'],
    'Africa/Lagos':        [6.52, 3.38, 'Lagos'],
    'America/Sao_Paulo':   [-23.55, -46.63, 'São Paulo']
};

function coordsFromTimezone() {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (TZ_COORDS[tz]) {
            const [lat, lon, city] = TZ_COORDS[tz];
            return { lat, lon, city, tz };
        }
        // Unknown zone — fall back to the region's rough centre so the
        // widget still shows something plausible rather than nothing.
        return null;
    } catch (e) { return null; }
}

/**
 * Weather provider note (why not OpenWeatherMap):
 *
 *   Open-Meteo — used here — needs NO API key, has no signup, and allows
 *   ~10,000 requests/day for non-commercial use. Because it needs no key,
 *   nothing secret ships to the browser.
 *
 *   OpenWeatherMap's free tier requires an API key. In a purely static
 *   site that key would have to sit in client JS where anyone can read
 *   and burn it — the exact problem we just removed for the Groq key.
 *   Using it safely would mean routing weather through a serverless proxy
 *   for no benefit over a keyless provider.
 *
 * Requests are additionally cached for 30 minutes per session, so a
 * visitor costs about one call regardless of how often they lock/unlock.
 */
async function loadLockWeather() {
    const cached = readWeatherCache();
    if (cached) { renderLockWeather(cached); return; }

    const local = coordsFromTimezone();

    try {
        let lat, lon, place, countryCode = null;

        if (local) {
            ({ lat, lon, city: place } = local);
        }

        // Refine with an IP lookup when possible — better city precision —
        // but never block on it: if it fails and we already have timezone
        // coords, carry on with those.
        try {
            const geoRes = await fetch('https://ipwho.is/');
            const geo = await geoRes.json();
            if (geo && geo.success !== false && typeof geo.latitude === 'number') {
                lat = geo.latitude;
                lon = geo.longitude;
                place = geo.city || geo.region || geo.country || place;
                countryCode = geo.country_code;
            }
        } catch (e) { /* keep timezone coords */ }

        if (typeof lat !== 'number') throw new Error('no location available');

        // US visitors see Fahrenheit; everyone else Celsius.
        const prefersFahrenheit = /-US$/i.test(navigator.language || '') || countryCode === 'US';
        const unit = prefersFahrenheit ? 'fahrenheit' : 'celsius';

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
            + `&current=temperature_2m,weather_code,is_day&temperature_unit=${unit}`;
        const weatherRes = await fetch(weatherUrl);
        const weather = await weatherRes.json();
        const current = weather && weather.current;
        if (!current) throw new Error('weather lookup failed');

        const payload = {
            temp: Math.round(current.temperature_2m),
            unit: unit === 'fahrenheit' ? '°F' : '°C',
            code: current.weather_code,
            isDay: current.is_day === 1,
            place: place || 'Your Location'
        };
        writeWeatherCache(payload);
        renderLockWeather(payload);
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

    function onPointerDown(e) {
        if (overlay.classList.contains('unlocking')) return;
        lockDragState = {
            startY: e.clientY,
            lastY: e.clientY,
            lastT: performance.now(),
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

        // Only upward movement drags the content; resist downward motion.
        const clamped = Math.min(0, dy);
        const progress = Math.min(1, Math.abs(clamped) / (window.innerHeight * 0.6));
        content.style.transform = `translateY(${clamped}px)`;
        overlay.style.setProperty('--lock-progress', progress.toFixed(3));
    }

    function onPointerUp() {
        if (!lockDragState) return;
        const traveled = lockDragState.startY - lockDragState.lastY;
        const fastFlick = lockDragState.velocity < -UNLOCK_VELOCITY;
        lockDragState.dragging = false;

        content.style.transition = 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)';

        if (traveled > UNLOCK_DISTANCE || fastFlick) {
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

    // Arrow-up also unlocks, for keyboard-only visitors.
    overlay.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp' || e.key === 'Enter') {
            e.preventDefault();
            hint && hint.click();
        }
    });
}
