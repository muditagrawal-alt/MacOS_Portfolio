/* ==========================================================================
   Weather — live conditions, 24-hour and 7-day forecasts
   --------------------------------------------------------------------------
   Open-Meteo through js/shared/live-data.js (no API key; cached and shared
   with the Home Screen widget and the Mac's desktop widget).
   ========================================================================== */

(function () {
    const pad = (n) => String(n).padStart(2, '0');

    function hourLabel(iso, i) {
        if (i === 0) return 'Now';
        const h = Number(String(iso).slice(11, 13));
        return new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).format(new Date(2000, 0, 1, h));
    }

    function dayLabel(iso, i) {
        if (i === 0) return 'Today';
        const [y, m, d] = String(iso).split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short' });
    }

    /** Hourly entries from the current hour on (times are local to the place). */
    function upcoming(hourly) {
        const now = new Date();
        const key = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}`;
        const start = Math.max(0, hourly.findIndex(h => String(h.time) >= key));
        return hourly.slice(start, start + 24);
    }

    function scene(w) {
        if (!w.isDay) return 'night';
        if ([61, 63, 65, 80, 81, 82, 51, 53, 55, 95, 96, 99].includes(w.code)) return 'rain';
        if ([3, 45, 48].includes(w.code)) return 'cloudy';
        return 'day';
    }

    async function render(content, ctx) {
        ctx.page.dataset.scene = 'day';
        content.innerHTML = `
            <button type="button" class="wx-close" aria-label="Back to Home Screen"><i class="fas fa-chevron-down"></i></button>
            <div class="wx-hero"><span class="wx-place">Locating…</span><span class="wx-temp">--°</span><span class="wx-cond">&nbsp;</span></div>`;
        content.querySelector('.wx-close').addEventListener('click', () => IOS.home());
        let w;
        try { w = await fetchLiveWeather(); } catch (e) {
            content.innerHTML += IOS.emptyState('fas fa-cloud-sun', 'Weather unavailable', 'Check your connection and try again.');
            content.querySelector('.wx-place').textContent = 'Weather';
            return;
        }
        ctx.page.dataset.scene = scene(w);
        const hours = upcoming(w.hourly || []);
        const days = w.daily || [];
        const lo = Math.min(...days.map(d => d.low)), hi = Math.max(...days.map(d => d.high));
        const span = Math.max(1, hi - lo);
        content.innerHTML = `
            <button type="button" class="wx-close" aria-label="Back to Home Screen"><i class="fas fa-chevron-down"></i></button>
            <div class="wx-hero">
                <span class="wx-kicker"><i class="fas fa-location-arrow"></i> My Location</span>
                <span class="wx-place">${escapeHtml(w.place)}</span>
                <span class="wx-temp">${w.temp}°</span>
                <span class="wx-cond">${escapeHtml(w.label)}</span>
                ${w.high !== null ? `<span class="wx-hl">H:${w.high}°  L:${w.low}°</span>` : ''}
            </div>
            ${hours.length ? `
            <section class="wx-card">
                <h3><i class="far fa-clock"></i> Hourly forecast</h3>
                <div class="wx-hours">${hours.map((h, i) => {
                    const info = weatherCodeInfo(h.code, h.isDay);
                    return `<div class="wx-hour"><span>${escapeHtml(hourLabel(h.time, i))}</span><i class="fas ${escapeHtml(info.icon)}" title="${escapeHtml(info.label)}"></i><strong>${h.temp}°</strong></div>`;
                }).join('')}</div>
            </section>` : ''}
            ${days.length ? `
            <section class="wx-card">
                <h3><i class="far fa-calendar"></i> ${days.length}-day forecast</h3>
                ${days.map((d, i) => {
                    const info = weatherCodeInfo(d.code, true);
                    const left = ((d.low - lo) / span) * 100, width = ((d.high - d.low) / span) * 100;
                    return `<div class="wx-day">
                        <span class="wx-day-name">${escapeHtml(dayLabel(d.date, i))}</span>
                        <i class="fas ${escapeHtml(info.icon)}" title="${escapeHtml(info.label)}"></i>
                        <span class="wx-day-lo">${d.low}°</span>
                        <span class="wx-range"><span style="left:${left}%;width:${Math.max(width, 6)}%"></span>${i === 0 ? `<i style="left:${((w.temp - lo) / span) * 100}%"></i>` : ''}</span>
                        <span class="wx-day-hi">${d.high}°</span>
                    </div>`;
                }).join('')}
            </section>` : ''}
            <p class="wx-credit">Weather data by Open-Meteo · ${escapeHtml(w.unit || '°C')}</p>`;
        content.querySelector('.wx-close').addEventListener('click', () => IOS.home());
    }

    IOS.register('weather', {
        name: 'Weather',
        icon: 'assets/icons/ios/weather.svg',
        iconStyle: 'full',
        statusBar: 'light',
        keywords: 'forecast temperature rain sun',
        pages: () => [{ key: 'wx', title: 'Weather', hideNav: true, className: 'wx-page', render }]
    });
})();
