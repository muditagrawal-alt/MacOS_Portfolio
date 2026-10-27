/* ==========================================================================
   Desktop Widgets — Sonoma / Sequoia style, all backed by live data
   --------------------------------------------------------------------------
   Every number on these cards is real: the clock is the visitor's own clock,
   the weather is the same Open-Meteo reading the lock screen shows, and the
   GitHub card is the account's actual most-recently-pushed repositories.
   (The previous column showed a hardcoded "Sunny 26° H:29 L:19" — sunny at
   night — and an "M3 Max" CPU meter driven by Math.sin.)

   The column lives on the LEFT edge. It used to sit on the right, directly on
   top of the desktop icons, and intercepted clicks on five of them.
   ========================================================================== */

(function() {
    function cityFromTimezone() {
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
            // IST is one zone for the whole country; naming a single city
            // would be wrong for most visitors in it.
            const known = { 'Asia/Calcutta': 'India', 'Asia/Kolkata': 'India' };
            if (known[tz]) return known[tz];
            const leaf = tz.split('/').pop();
            return leaf ? leaf.replace(/_/g, ' ') : 'Local Time';
        } catch (e) {
            return 'Local Time';
        }
    }

    function initDesktopWidgets() {
        const desktop = document.getElementById('desktop');
        if (!desktop || document.getElementById('desktop-widgets-column')) return;

        const col = document.createElement('div');
        col.id = 'desktop-widgets-column';
        col.className = 'desktop-widgets-column';
        col.setAttribute('aria-label', 'Desktop widgets');

        col.innerHTML = `
            <button type="button" class="mac-widget-card widget-clock" onclick="toggleNotificationCenter()" title="Open Notification Centre">
                <div class="widget-clock-wrap">
                    <div class="analog-clock" aria-hidden="true">
                        <div class="clock-hand hour" id="widget-hour-hand"></div>
                        <div class="clock-hand minute" id="widget-minute-hand"></div>
                        <div class="clock-hand second" id="widget-second-hand"></div>
                        <div class="clock-center-dot"></div>
                    </div>
                    <div class="clock-meta">
                        <span class="clock-city">${escapeHtml(cityFromTimezone())}</span>
                        <span class="clock-digital-time" id="widget-digital-time">--:--</span>
                        <span class="clock-date-tag" id="widget-date-tag"></span>
                    </div>
                </div>
            </button>

            <div class="mac-widget-card widget-weather" id="widget-weather" aria-live="polite">
                <div class="widget-weather-header">
                    <div>
                        <div class="weather-city-name" id="widget-weather-place">Weather</div>
                        <div class="weather-temp-main" id="widget-weather-temp">--°</div>
                    </div>
                    <i class="fas fa-cloud weather-icon" id="widget-weather-icon" aria-hidden="true"></i>
                </div>
                <div class="weather-sub" id="widget-weather-sub">Loading forecast…</div>
            </div>

            <div class="mac-widget-card widget-github" id="widget-github">
                <div class="widget-github-header">
                    <img src="assets/icons/social-github.svg" alt="" width="16" height="16">
                    <span>Latest on GitHub</span>
                </div>
                <div class="widget-github-list" id="widget-github-list">
                    <div class="widget-github-skel"></div>
                    <div class="widget-github-skel"></div>
                    <div class="widget-github-skel short"></div>
                </div>
            </div>

            <div class="mac-widget-card mac-sticky-note">
                <div class="sticky-header"><i class="fas fa-thumbtack"></i> Start here</div>
                <div class="sticky-text">
                    Double-click <strong>Resume.pdf</strong>, press <kbd>⌘K</kbd> to search everything, or ask <strong>Iris</strong> about my work.
                </div>
            </div>
        `;

        desktop.appendChild(col);

        startClockTicks();
        loadWeather();
        loadGitHub();
    }

    function startClockTicks() {
        const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
        const dateFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

        function updateClock() {
            const now = new Date();
            const sec = now.getSeconds();
            const min = now.getMinutes();
            const hr = now.getHours();

            const set = (id, deg) => { const el = document.getElementById(id); if (el) el.style.transform = `rotate(${deg}deg)`; };
            set('widget-second-hand', sec * 6);
            set('widget-minute-hand', (min + sec / 60) * 6);
            set('widget-hour-hand', ((hr % 12) + min / 60) * 30);

            const digitalEl = document.getElementById('widget-digital-time');
            if (digitalEl) digitalEl.textContent = timeFmt.format(now);
            const dateEl = document.getElementById('widget-date-tag');
            if (dateEl) dateEl.textContent = dateFmt.format(now);
        }

        setInterval(updateClock, 1000);
        updateClock();
    }

    async function loadWeather() {
        const place = document.getElementById('widget-weather-place');
        const temp = document.getElementById('widget-weather-temp');
        const icon = document.getElementById('widget-weather-icon');
        const sub = document.getElementById('widget-weather-sub');
        if (typeof window.fetchLiveWeather !== 'function') return;

        try {
            const w = await window.fetchLiveWeather();
            if (place) place.textContent = w.place;
            if (temp) temp.textContent = `${w.temp}°`;
            if (icon) icon.className = `fas ${w.icon} weather-icon${w.isDay && /sun/.test(w.icon) ? ' is-sun' : ''}`;
            if (sub) {
                const range = (w.high !== null && w.low !== null) ? ` · H:${w.high}° L:${w.low}°` : '';
                sub.textContent = `${w.label}${range}`;
            }
        } catch (e) {
            if (sub) sub.textContent = 'Weather unavailable right now';
            if (icon) icon.className = 'fas fa-cloud-slash weather-icon';
        }
    }

    async function loadGitHub() {
        const list = document.getElementById('widget-github-list');
        if (!list || typeof fetchGitHubActivity !== 'function') return;

        try {
            const repos = (await fetchGitHubActivity()).slice(0, 3);
            if (!repos.length) throw new Error('empty');
            list.innerHTML = repos.map(r => `
                <a class="widget-github-row" href="${escapeHtml(safeUrl(r.url))}" target="_blank" rel="noopener noreferrer">
                    <span class="widget-github-name">${escapeHtml(r.title)}</span>
                    <span class="widget-github-meta">${escapeHtml([r.language, relativeTime(r.time)].filter(Boolean).join(' · '))}</span>
                </a>`).join('');
        } catch (e) {
            list.innerHTML = `<a class="widget-github-row" href="https://github.com/muditagrawal-alt" target="_blank" rel="noopener noreferrer">
                <span class="widget-github-name">@muditagrawal-alt</span>
                <span class="widget-github-meta">Open profile ↗</span></a>`;
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        initDesktopWidgets();
    });

    window.initDesktopWidgets = initDesktopWidgets;
})();
