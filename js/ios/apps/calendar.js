/* ==========================================================================
   Calendar — the career, by year
   --------------------------------------------------------------------------
   Everything in the info bank with a date: university and school, work,
   hackathons, events (the same entries Maps pins, js/data/profile-schema.js)
   and project launches. Dates there are months or years, not days, so this
   is the year view: twelve months with the busy ones marked, and an agenda
   underneath. Entries without a date stay out until they get one.
   ========================================================================== */

(function () {
    const P = window.PROFILE_DATA;
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const CALENDARS = {
        work: { name: 'Work', color: '#af52de', icon: 'fas fa-briefcase' },
        university: { name: 'Education', color: '#007aff', icon: 'fas fa-graduation-cap' },
        school: { name: 'Education', color: '#32ade6', icon: 'fas fa-school' },
        hackathon: { name: 'Hackathons', color: '#ff9500', icon: 'fas fa-trophy' },
        event: { name: 'Events', color: '#ff2d55', icon: 'fas fa-calendar-check' },
        launch: { name: 'Launches', color: '#34c759', icon: 'fas fa-rocket' }
    };
    const FILTERS = [['all', 'All'], ['work', 'Work'], ['education', 'Education'], ['hackathon', 'Hackathons'], ['event', 'Events'], ['launch', 'Launches']];
    const groupOf = (kind) => (kind === 'university' || kind === 'school' ? 'education' : kind);

    /** "June 2026", "Jan 2026", "2026", "Present" → { y, m } (m null for a year), { present }, or null. */
    function point(text) {
        const s = String(text || '').trim().toLowerCase();
        if (/^(present|now|current|ongoing|today)$/.test(s)) return { present: true };
        const y = s.match(/\b(19|20)\d{2}\b/);
        if (!y) return null;
        const m = MONTHS.findIndex(name => new RegExp(`\\b${name.slice(0, 3).toLowerCase()}`).test(s));
        return { y: Number(y[0]), m: m >= 0 ? m : null };
    }

    /** "December 2025 – January 2026", "2023 – 2027", "June 2026 – Present" → { start, end } */
    function span(text) {
        const [a, b] = String(text || '').split(/\s+[–—-]\s+|\s*[–—]\s*|\s+to\s+/i);
        const start = point(a);
        if (!start || start.present) return null;
        return { start, end: b ? point(b) : null };
    }

    const entries = (() => {
        const list = P.places.map(x => ({ id: x.id, kind: x.kind, title: x.title, subtitle: x.subtitle, when: x.date, place: x }))
            .concat(P.projects.map(x => ({ id: `launch-${x.id}`, kind: 'launch', title: x.name, subtitle: x.title !== x.name ? x.title : x.kind, when: x.date, project: x.fsId })));
        return list.map(e => ({ ...e, span: span(e.when) })).filter(e => e.span)
            .sort((a, b) => (a.span.start.y - b.span.start.y) || ((a.span.start.m ?? -1) - (b.span.start.m ?? -1)));
    })();

    const now = new Date();
    const thisYear = now.getFullYear();
    let year = null;
    let filter = 'all';

    const shown = () => entries.filter(e => filter === 'all' || groupOf(e.kind) === filter);
    const startsIn = (e, y) => e.span.start.y === y;
    const runsInto = (e, y) => e.span.start.y < y && e.span.end && (e.span.end.present ? y <= thisYear : e.span.end.y >= y);
    const years = () => {
        const all = new Set();
        shown().forEach(e => {
            const last = e.span.end ? (e.span.end.present ? thisYear : e.span.end.y) : e.span.start.y;
            for (let y = e.span.start.y; y <= Math.max(last, e.span.start.y); y++) all.add(y);
        });
        return [...all].sort((a, b) => a - b);
    };
    function defaultYear() {
        const ys = years();
        if (ys.includes(thisYear)) return thisYear;
        return ys.filter(y => y < thisYear).pop() || ys[ys.length - 1] || thisYear;
    }

    const monthShort = (m) => MONTHS[m].slice(0, 3);
    const fmtPoint = (p) => (p.present ? 'Present' : `${p.m !== null ? `${MONTHS[p.m]} ` : ''}${p.y}`);
    const whenLabel = (e) => (e.span.end ? `${fmtPoint(e.span.start)} – ${fmtPoint(e.span.end)}` : fmtPoint(e.span.start));
    const shortWhen = (e) => {
        const s = e.span.start;
        if (!e.span.end) return s.m !== null ? monthShort(s.m) : 'All year';
        const end = e.span.end.present ? 'Now' : (e.span.end.m !== null ? monthShort(e.span.end.m) : e.span.end.y);
        return `${s.m !== null ? monthShort(s.m) : s.y} – ${end}`;
    };

    function miniMonth(y, m, busy) {
        const first = new Date(y, m, 1).getDay();
        const days = new Date(y, m + 1, 0).getDate();
        const today = y === thisYear && m === now.getMonth() ? now.getDate() : 0;
        const cells = [...Array(first).fill('<i></i>'), ...Array.from({ length: days }, (_, i) => `<i class="${i + 1 === today ? 'today' : ''}">${i + 1}</i>`)];
        const tag = busy ? 'button' : 'div';
        return `<${tag} ${busy ? 'type="button"' : ''} class="cal-month ${busy ? 'busy' : ''} ${today ? 'current' : ''}" data-month="${m}" ${busy ? `aria-label="${MONTHS[m]} ${y}, ${busy} ${busy === 1 ? 'entry' : 'entries'}"` : 'aria-hidden="true"'}>
                <span class="cal-month-name">${monthShort(m)}${busy ? `<em>${busy}</em>` : ''}</span>
                <span class="cal-days" aria-hidden="true">${cells.join('')}</span>
            </${tag}>`;
    }

    function row(e) {
        const cal = CALENDARS[e.kind];
        return `<button type="button" class="cal-row" data-entry="${escapeHtml(e.id)}" style="--c:${cal.color}">
                <span class="cal-row-text"><strong>${escapeHtml(e.title)}</strong>${e.subtitle ? `<small>${escapeHtml(e.subtitle)}</small>` : ''}</span>
                <span class="cal-row-when">${escapeHtml(shortWhen(e))}</span>
            </button>`;
    }

    function section(title, list) {
        return list.length ? `<div class="ios-section-header">${escapeHtml(title)}</div><div class="cal-list">${list.map(row).join('')}</div>` : '';
    }

    function render(content) {
        if (year === null || !years().includes(year)) year = defaultYear();
        const ys = years();
        const list = shown();
        const starting = list.filter(e => startsIn(e, year));
        const busy = (m) => starting.filter(e => e.span.start.m === m).length;
        content.innerHTML = `
            <div class="cal-yearbar">
                <h2 class="cal-year">${year}</h2>
                <div class="cal-yearnav">
                    <button type="button" data-year="${ys[ys.indexOf(year) - 1] ?? ''}" aria-label="Previous year" ${ys.indexOf(year) > 0 ? '' : 'disabled'}><i class="fas fa-chevron-left"></i></button>
                    <button type="button" data-year="${ys[ys.indexOf(year) + 1] ?? ''}" aria-label="Next year" ${ys.indexOf(year) < ys.length - 1 ? '' : 'disabled'}><i class="fas fa-chevron-right"></i></button>
                </div>
            </div>
            <div class="cal-months">${MONTHS.map((_, m) => miniMonth(year, m, busy(m))).join('')}</div>
            <div class="cal-chips" role="group" aria-label="Calendars">${FILTERS.filter(([g]) => g === 'all' || entries.some(e => groupOf(e.kind) === g)).map(([g, label]) =>
                `<button type="button" class="cal-chip ${filter === g ? 'on' : ''}" data-filter="${g}" aria-pressed="${filter === g}">${g === 'all' ? '' : `<i style="--c:${CALENDARS[g === 'education' ? 'university' : g].color}"></i>`}${label}</button>`).join('')}</div>
            ${section('Ongoing', list.filter(e => runsInto(e, year)))}
            ${section(`During ${year}`, starting.filter(e => e.span.start.m === null))}
            ${MONTHS.map((name, m) => `<div data-month-section="${m}">${section(name, starting.filter(e => e.span.start.m === m))}</div>`).join('')}
            ${list.some(e => runsInto(e, year) || startsIn(e, year)) ? '' : IOS.emptyState('far fa-calendar', 'Nothing here', 'Try another calendar or year.')}`;

        content.onclick = (ev) => {
            const y = ev.target.closest('[data-year]');
            if (y && y.dataset.year) { year = Number(y.dataset.year); render(content); IOS.haptic(); return; }
            const f = ev.target.closest('[data-filter]');
            if (f) { filter = f.dataset.filter; render(content); return; }
            const month = ev.target.closest('.cal-month.busy');
            if (month) {
                const target = content.querySelector(`[data-month-section="${month.dataset.month}"]`);
                if (target) target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
                return;
            }
            const entry = ev.target.closest('[data-entry]');
            if (entry) IOS.go('calendar', [entry.dataset.entry]);
        };
    }

    function detail(content, id) {
        const e = entries.find(x => x.id === id);
        if (!e) { content.innerHTML = IOS.emptyState('far fa-calendar-xmark', 'Not in the calendar', ''); return; }
        const cal = CALENDARS[e.kind];
        content.innerHTML = `
            <div class="cal-event" style="--c:${cal.color}">
                <h2>${escapeHtml(e.title)}</h2>
                ${e.subtitle ? `<p class="cal-event-sub">${escapeHtml(e.subtitle)}</p>` : ''}
                <p class="cal-event-when">${escapeHtml(whenLabel(e))}</p>
            </div>
            ${IOS.group([
                { icon: cal.icon, color: cal.color, title: 'Calendar', detail: cal.name },
                ...(e.place && e.place.place && e.place.place.label ? [{ icon: 'fas fa-location-dot', color: '#ff3b30', title: e.place.place.label, chevron: true, action: 'map' }] : [])
            ])}
            <div class="cal-actions">
                ${e.place ? '<button type="button" class="ios-btn" data-action="map"><i class="fas fa-map-location-dot"></i> Show on Map</button>' : ''}
                ${e.project ? '<button type="button" class="ios-btn" data-action="project"><i class="fas fa-rocket"></i> Open Project</button>' : ''}
                <button type="button" class="ios-btn secondary" data-action="ask"><i class="fas fa-wand-magic-sparkles"></i> Ask Iris</button>
            </div>`;
        IOS.bind(content, {
            map: () => window.openMapPlace && openMapPlace(e.id),
            project: () => IOS.go('projects', [e.project]),
            ask: () => IOS.askIris(`Tell me about ${e.title}`)
        });
    }

    /** Today's weekday and date, like the real icon. */
    function icon() {
        const font = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" fill="#fff"/>`
            + `<text x="64" y="39" text-anchor="middle" font-family="${font}" font-size="21" font-weight="600" fill="#ff3b30">${now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</text>`
            + `<text x="64" y="104" text-anchor="middle" font-family="${font}" font-size="70" font-weight="300" fill="#1c1c1e" letter-spacing="-3">${now.getDate()}</text></svg>`;
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }

    if (!entries.length) return;
    IOS.register('calendar', {
        name: 'Calendar',
        icon: icon(),
        iconStyle: 'ios',
        keywords: 'calendar dates timeline when year month history schedule hackathon event internship launch',
        onClose() { year = null; filter = 'all'; },
        pages(path) {
            const root = { key: 'year', title: 'Calendar', largeTitle: false, className: 'cal-page', render };
            if (path[0]) {
                const e = entries.find(x => x.id === path[0]);
                return [root, { key: `cal-${path[0]}`, title: e ? e.title : 'Event', largeTitle: false, backTitle: String(year ?? defaultYear()), className: 'cal-page', render: (c) => detail(c, path[0]) }];
            }
            return [root];
        }
    });

    window.CalendarData = { entries, span };
})();
