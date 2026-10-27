/* ==========================================================================
   Live data — weather and GitHub activity, shared by Mac and iPhone
   --------------------------------------------------------------------------
   One request per source per session window (cached in sessionStorage);
   concurrent callers share the same in-flight promise. Everything here is
   keyless: Open-Meteo for weather, ipwho.is to refine the city name, and the
   public GitHub REST API.
   ========================================================================== */

/* ── Weather ──────────────────────────────────────────────────────────── */

// v3: payload now carries hourly + 7-day forecasts.
const LOCK_WEATHER_CACHE_KEY = 'mac-lock-weather-cache-v3';
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

/**
 * Shared live-weather service (lock screen + desktop widget). One request per
 * 30 minutes per session; concurrent callers share the same in-flight promise.
 * Resolves to { temp, unit, code, isDay, place, high, low, label, icon }.
 */
let liveWeatherPromise = null;
function fetchLiveWeather() {
    const cached = readWeatherCache();
    if (cached) return Promise.resolve(decorateWeather(cached));
    if (!liveWeatherPromise) {
        liveWeatherPromise = requestLiveWeather()
            .then(payload => { writeWeatherCache(payload); return decorateWeather(payload); })
            .finally(() => { liveWeatherPromise = null; });
    }
    return liveWeatherPromise;
}
window.fetchLiveWeather = fetchLiveWeather;

function decorateWeather(data) {
    const entry = WMO_WEATHER[data.code] || WMO_WEATHER[3];
    return { ...data, label: entry[2], icon: data.isDay ? entry[0] : entry[1], hourly: data.hourly || [], daily: data.daily || [] };
}

/** Font Awesome icon + label for any WMO weather code. */
function weatherCodeInfo(code, isDay = true) {
    const entry = WMO_WEATHER[code] || WMO_WEATHER[3];
    return { icon: isDay ? entry[0] : entry[1], label: entry[2] };
}

async function requestLiveWeather() {
    const local = coordsFromTimezone();
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

    // Fahrenheit only for visitors actually in the US. Browser language is a
    // poor proxy (en-US is the default in much of India), so it's only used
    // when the IP lookup didn't tell us the country.
    const prefersFahrenheit = countryCode ? countryCode === 'US' : /-US$/i.test(navigator.language || '');
    const unit = prefersFahrenheit ? 'fahrenheit' : 'celsius';

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
        + `&current=temperature_2m,weather_code,is_day`
        + `&hourly=temperature_2m,weather_code,is_day&forecast_hours=24`
        + `&daily=temperature_2m_max,temperature_2m_min,weather_code&forecast_days=7`
        + `&timezone=auto&temperature_unit=${unit}`;
    const weatherRes = await fetch(weatherUrl);
    const weather = await weatherRes.json();
    const current = weather && weather.current;
    if (!current) throw new Error('weather lookup failed');
    const daily = weather.daily || {};
    const hourly = weather.hourly || {};
    const arr = v => (Array.isArray(v) ? v : []);

    return {
        temp: Math.round(current.temperature_2m),
        unit: unit === 'fahrenheit' ? '°F' : '°C',
        code: current.weather_code,
        isDay: current.is_day === 1,
        place: place || 'Your Location',
        high: arr(daily.temperature_2m_max).length ? Math.round(daily.temperature_2m_max[0]) : null,
        low: arr(daily.temperature_2m_min).length ? Math.round(daily.temperature_2m_min[0]) : null,
        hourly: arr(hourly.time).map((t, i) => ({
            time: t, temp: Math.round(arr(hourly.temperature_2m)[i]), code: arr(hourly.weather_code)[i], isDay: arr(hourly.is_day)[i] === 1
        })),
        daily: arr(daily.time).map((t, i) => ({
            date: t, high: Math.round(arr(daily.temperature_2m_max)[i]), low: Math.round(arr(daily.temperature_2m_min)[i]), code: arr(daily.weather_code)[i]
        }))
    };
}

/* ── GitHub ───────────────────────────────────────────────────────────── */

// Shared by the Notification Centre, the desktop GitHub widget and the iPhone
// widgets, so a page load costs one API call however many surfaces show it.
// The owner's GitHub account, from the info bank (empty: no GitHub surfaces).
const GITHUB_USER = window.PROFILE_DATA.github.user;
const GITHUB_CACHE_TTL_MS = 15 * 60 * 1000;   // well inside GitHub's 60 req/hour
let githubActivityPromise = null;
const GITHUB_CACHE_KEY = `mac-github-activity-${GITHUB_USER}`;

function fetchGitHubActivity() {
    if (!GITHUB_USER) return Promise.resolve([]);
    try {
        const raw = sessionStorage.getItem(GITHUB_CACHE_KEY);
        if (raw) {
            const hit = JSON.parse(raw);
            if (Date.now() - hit.timestamp < GITHUB_CACHE_TTL_MS) return Promise.resolve(hit.items);
        }
    } catch (e) { /* storage unavailable — fall through to the network */ }

    if (!githubActivityPromise) {
        githubActivityPromise = requestGitHubActivity()
            .then(items => {
                try { sessionStorage.setItem(GITHUB_CACHE_KEY, JSON.stringify({ items, timestamp: Date.now() })); } catch (e) { /* non-fatal */ }
                return items;
            })
            .finally(() => { githubActivityPromise = null; });
    }
    return githubActivityPromise;
}

async function requestGitHubActivity() {
    const res = await fetch(
        `https://api.github.com/users/${GITHUB_USER}/repos?sort=pushed&per_page=12`,
        { headers: { 'Accept': 'application/vnd.github+json' } }
    );
    if (!res.ok) throw new Error('github ' + res.status);

    const repos = await res.json();
    if (!Array.isArray(repos)) throw new Error('unexpected github payload');

    return repos
        .filter(r => !r.fork && !r.archived)
        .slice(0, 5)
        .map(r => ({
            icon: 'assets/icons/social-github.svg',
            app: 'GitHub',
            title: r.name,
            body: r.description || 'No description provided.',
            language: r.language || '',
            meta: [r.language, r.stargazers_count ? `★ ${r.stargazers_count}` : null]
                    .filter(Boolean).join(' · '),
            time: r.pushed_at,
            url: r.html_url
        }));
}

/* ── Formatting ───────────────────────────────────────────────────────── */

function relativeTime(iso) {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    const mins = Math.floor((Date.now() - then) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
}
