/* ==========================================================================
   iOS shell — apps, navigation, gestures, Lock & Home Screens
   --------------------------------------------------------------------------
   Navigation is built on the History API: opening an app or a page pushes a
   history entry (#/app/path…), and Back pops it. That's what makes the real
   phone's own back gestures work — iOS Safari's edge swipe and Android's
   back button both move through the portfolio exactly like an app.

   Apps register themselves with IOS.register(id, { name, icon, pages(path) })
   where pages() returns the whole navigation stack for a path, e.g.
   projects/proj-vlm → [list page, product page]. The shell diffs stacks to
   animate pushes and pops.
   ========================================================================== */

const IOS = (() => {
    const apps = {};
    const prefersReducedMotion = () => Boolean(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    const $ = (id) => document.getElementById(id);

    let openAppId = null;
    let stack = [];           // [{ key, el, desc }]
    let unlocked = false;

    /* ── Registry ─────────────────────────────────────────────────────── */
    function register(id, def) {
        apps[id] = { id, iconStyle: 'mac', ...def };
    }

    /* ── Routing (History API) ────────────────────────────────────────── */
    function parseHash(hash = location.hash) {
        const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(p => { try { return decodeURIComponent(p); } catch (e) { return p; } });
        const app = parts[0] && apps[parts[0]] ? parts[0] : null;
        return { app, path: app ? parts.slice(1) : [] };
    }

    function hashFor(app, path = []) {
        return '#/' + [app, ...path].filter(p => p !== undefined && p !== null && p !== '').map(p => encodeURIComponent(p)).join('/');
    }

    function depth() {
        return (history.state && history.state.iosDepth) || 0;
    }

    /** Open an app (or a page inside one). Pushes history unless replace. */
    function go(app, path = [], { replace = false } = {}) {
        const target = hashFor(app, path);
        if (location.hash === target) { apply(); return; }
        if (replace) history.replaceState({ iosDepth: depth() }, '', target);
        else history.pushState({ iosDepth: depth() + 1 }, '', target);
        apply();
    }

    function back() {
        if (depth() > 0) { history.back(); return; }
        // Deep-linked straight into a page: Back goes to its parent instead.
        const r = parseHash();
        if (r.path.length) go(r.app, r.path.slice(0, -1), { replace: true });
        else home();
    }

    function home() {
        if (!openAppId) return;
        const d = depth();
        if (d > 0) { history.go(-d); return; }
        history.replaceState({ iosDepth: 0 }, '', location.pathname + location.search);
        apply();
    }

    window.addEventListener('popstate', () => apply());

    function apply() {
        if (!unlocked) return;
        const r = parseHash();
        closeSearch();
        if (!r.app) { if (openAppId) closeApp(); return; }
        if (openAppId && openAppId !== r.app) closeApp({ instant: true });
        if (openAppId) reconcile(r.path);
        else openApp(r.app, r.path);
    }

    /* ── App window ───────────────────────────────────────────────────── */
    function pagesFor(id, path) {
        try {
            const pages = apps[id].pages(path || []);
            return pages && pages.length ? pages : apps[id].pages([]);
        } catch (e) {
            console.error(`[iOS] ${id} failed to render`, e);
            return [{ key: 'error', title: apps[id].name, render: (el) => { el.innerHTML = emptyState('fas fa-triangle-exclamation', 'Something went wrong', 'Go back and try again.'); } }];
        }
    }

    function openApp(id, path) {
        const app = apps[id];
        const win = $('ios-app-window');
        openAppId = id;
        stack = [];
        win.innerHTML = '';
        win.dataset.app = id;
        win.className = 'ios-app-window' + (app.theme ? ` theme-${app.theme}` : '');
        pagesFor(id, path).forEach((desc, i) => mountPage(desc, i, false));
        document.body.classList.add('ios-in-app');
        syncStatusBar();
        launchAnimation(id);
        if (app.onOpen) app.onOpen();
        haptic();
    }

    function closeApp({ instant = false } = {}) {
        const win = $('ios-app-window');
        const id = openAppId;
        const app = apps[id];
        openAppId = null;
        document.body.classList.remove('ios-in-app');
        $('ios-home').classList.remove('zoomed');
        syncStatusBar();
        if (app && app.onClose) app.onClose();
        const finish = () => {
            if (openAppId) return;   // another app opened meanwhile
            win.className = 'ios-app-window';
            win.removeAttribute('style');
            win.innerHTML = '';
            delete win.dataset.app;
            stack = [];
        };
        if (instant || prefersReducedMotion()) { finish(); return; }
        const icon = visibleIcon(id);
        win.classList.add('closing');
        win.style.clipPath = icon ? iconClip(icon) : 'inset(42% 38% 42% 38% round 40px)';
        win.style.opacity = '0';
        setTimeout(finish, 380);
    }

    function visibleIcon(id) {
        const icon = document.querySelector(`#ios-home [data-app-icon="${id}"] .ios-icon-art`);
        if (!icon) return null;
        const r = icon.getBoundingClientRect();
        return r.width ? icon : null;
    }

    /** clip-path that masks the full-screen window down to an icon's rectangle. */
    function iconClip(icon) {
        const d = $('ios-device').getBoundingClientRect();
        const r = icon.getBoundingClientRect();
        return `inset(${r.top - d.top}px ${d.right - r.right}px ${d.bottom - r.bottom}px ${r.left - d.left}px round ${r.width * 0.225}px)`;
    }

    /** Apps zoom out of their icon, like iOS. */
    function launchAnimation(id) {
        const win = $('ios-app-window');
        $('ios-home').classList.add('zoomed');
        const icon = visibleIcon(id);
        if (prefersReducedMotion() || !icon) { win.classList.add('shown'); return; }
        win.classList.add('launching');
        win.style.clipPath = iconClip(icon);
        win.style.opacity = '0.6';
        void win.offsetWidth;
        win.classList.remove('launching');
        win.classList.add('shown');
        win.style.clipPath = 'inset(0px 0px 0px 0px round 0px)';
        win.style.opacity = '1';
        setTimeout(() => { if (openAppId === id) { win.style.clipPath = ''; } }, 460);
    }

    /* ── Pages & navigation bar ───────────────────────────────────────── */
    function mountPage(desc, index, animate) {
        const win = $('ios-app-window');
        const page = document.createElement('section');
        page.className = 'ios-page' + (desc.className ? ` ${desc.className}` : '') + (desc.largeTitle === false ? ' no-large-title' : '');
        page.dataset.key = desc.key;
        const prev = stack[index - 1];
        const backLabel = prev ? (prev.desc.backTitle || prev.desc.title || 'Back') : 'Home';
        page.innerHTML = `
            ${desc.hideNav ? '' : `
            <header class="ios-nav">
                <button type="button" class="ios-nav-back" data-ios-back aria-label="Back to ${escapeHtml(backLabel)}"><i class="fas fa-chevron-left"></i><span>${escapeHtml(backLabel)}</span></button>
                <div class="ios-nav-title">${escapeHtml(desc.title || '')}</div>
                <div class="ios-nav-actions"></div>
            </header>`}
            <div class="ios-page-body">
                ${desc.largeTitle === false || desc.hideNav ? '' : `<h1 class="ios-large-title">${escapeHtml(desc.title || '')}</h1>`}
                <div class="ios-page-content"></div>
            </div>`;
        const content = page.querySelector('.ios-page-content');
        const body = page.querySelector('.ios-page-body');
        const ctx = { page, body, content, key: desc.key, refresh: () => { content.innerHTML = ''; desc.render(content, ctx); } };

        const backBtn = page.querySelector('[data-ios-back]');
        if (backBtn) backBtn.addEventListener('click', () => (index === 0 ? home() : back()));

        const actions = page.querySelector('.ios-nav-actions');
        (desc.actions || []).forEach(a => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'ios-nav-action';
            b.setAttribute('aria-label', a.label);
            b.innerHTML = a.icon ? `<i class="${escapeHtml(a.icon)}"></i>` : escapeHtml(a.label);
            b.addEventListener('click', () => a.onClick(ctx));
            actions.appendChild(b);
        });

        body.addEventListener('scroll', () => {
            page.classList.toggle('scrolled', body.scrollTop > (desc.largeTitle === false ? 2 : 38));
        }, { passive: true });

        win.appendChild(page);
        try { desc.render(content, ctx); } catch (e) { console.error('[iOS] page render failed', e); content.innerHTML = emptyState('fas fa-triangle-exclamation', 'Couldn’t show this page', ''); }

        if (stack.length) stack[stack.length - 1].el.classList.add('covered');
        stack.push({ key: desc.key, el: page, desc });
        if (animate && !prefersReducedMotion()) {
            page.classList.add('entering');
            void page.offsetWidth;
            page.classList.remove('entering');
        }
        return page;
    }

    function popPage(animate) {
        const top = stack.pop();
        if (!top) return;
        const under = stack[stack.length - 1];
        if (under) under.el.classList.remove('covered');
        if (animate && !prefersReducedMotion()) {
            top.el.classList.add('leaving');
            setTimeout(() => top.el.remove(), 360);
        } else {
            top.el.remove();
        }
    }

    function reconcile(path) {
        const next = pagesFor(openAppId, path);
        let common = 0;
        while (common < stack.length && common < next.length && stack[common].key === next[common].key) common++;
        const pops = stack.length - common;
        const pushes = next.length - common;
        for (let i = 0; i < pops; i++) popPage(pushes === 0 && i === pops - 1);
        next.slice(common).forEach((desc, i) => mountPage(desc, common + i, i === pushes - 1));
    }

    /* ── Status bar, island, framed preview ───────────────────────────── */
    function syncStatusBar() {
        const dev = $('ios-device');
        const app = openAppId && apps[openAppId];
        let tone = 'light';
        if (app) tone = app.statusBar === 'light' ? 'light' : (isDarkAppearance() ? 'light' : 'dark');
        dev.dataset.statusbar = tone;
    }

    function isDarkAppearance() {
        const mode = document.documentElement.dataset.appearance;
        if (mode === 'dark') return true;
        if (mode === 'light') return false;
        return Boolean(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    }

    function tickClock() {
        const now = new Date();
        const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(now).replace(/\s?[AP]M$/i, '');
        const sb = $('ios-sb-time');
        if (sb) sb.textContent = time;
        const lt = $('ios-lock-time');
        if (lt) lt.textContent = time;
        const ld = $('ios-lock-date');
        if (ld) ld.textContent = now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
    }

    function syncBattery() {
        const fill = $('ios-sb-battery-fill');
        if (!fill || !navigator.getBattery) return;
        navigator.getBattery().then(b => {
            const set = () => { fill.style.width = Math.round(b.level * 100) + '%'; fill.parentElement.classList.toggle('charging', b.charging); };
            set();
            b.addEventListener('levelchange', set);
            b.addEventListener('chargingchange', set);
        }).catch(() => {});
    }

    /** Dynamic Island: shows a live activity while music plays elsewhere. */
    function setIslandActivity(activity) {
        const island = $('ios-island');
        if (!island) return;
        island.classList.toggle('active', Boolean(activity));
        island.innerHTML = activity ? `<span class="ios-island-art" style="background:${activity.color || '#fa243c'}"><i class="fas fa-music"></i></span><span class="ios-island-bars"><i></i><i></i><i></i><i></i></span>` : '';
        island.onclick = activity && activity.onClick ? activity.onClick : null;
    }

    /* ── Lock Screen ──────────────────────────────────────────────────── */
    function showLock() {
        const lock = $('ios-lock');
        lock.classList.add('visible');
        let start = null;
        const onDown = (e) => {
            if (e.target.closest('#ios-lock-notification')) return;
            start = { y: e.clientY, t: performance.now(), max: 0 };
            lock.setPointerCapture && lock.setPointerCapture(e.pointerId);
        };
        const onMove = (e) => {
            if (!start) return;
            const dy = Math.min(0, e.clientY - start.y);
            start.max = Math.max(start.max, Math.abs(e.clientY - start.y));
            lock.style.transform = `translateY(${dy}px)`;
            lock.style.opacity = String(1 + dy / 600);
        };
        const onUp = (e) => {
            if (!start) return;
            const dy = start.y - e.clientY;
            const quickTap = start.max < 8 && performance.now() - start.t < 500;
            start = null;
            lock.style.transform = '';
            lock.style.opacity = '';
            if (dy > 80 || quickTap) unlock();
        };
        lock.addEventListener('pointerdown', onDown);
        lock.addEventListener('pointermove', onMove);
        lock.addEventListener('pointerup', onUp);
        lock.addEventListener('pointercancel', () => { start = null; lock.style.transform = ''; lock.style.opacity = ''; });
        $('ios-lock-notification').addEventListener('click', () => unlock(() => go('messages')));
        document.addEventListener('keydown', function onKey(e) {
            if (!lock.classList.contains('visible')) return;
            if (['Enter', ' ', 'ArrowUp'].includes(e.key)) { e.preventDefault(); unlock(); }
        });
        renderLockWidgets();
    }

    function unlock(then) {
        const lock = $('ios-lock');
        if (unlocked) { if (then) then(); return; }
        unlocked = true;
        try { sessionStorage.setItem('ios-unlocked', '1'); } catch (e) { /* private mode */ }
        $('ios-lock-glyph').className = 'fas fa-lock-open ios-lock-glyph';
        lock.classList.add('unlocking');
        document.body.classList.add('ios-unlocked');
        haptic();
        setTimeout(() => { lock.classList.remove('visible', 'unlocking'); }, 420);
        if (then) then();
        else apply();
    }

    function lockNow() {
        unlocked = false;
        try { sessionStorage.removeItem('ios-unlocked'); } catch (e) { /* ignore */ }
        if (openAppId) closeApp({ instant: true });
        $('ios-lock-glyph').className = 'fas fa-lock ios-lock-glyph';
        document.body.classList.remove('ios-unlocked');
        $('ios-lock').classList.add('visible');
    }

    async function renderLockWidgets() {
        const box = $('ios-lock-widgets');
        if (!box) return;
        const now = (window.PROFILE_DATA.experience || [])[0];
        box.innerHTML = now ? `<span class="ios-lw"><i class="fas fa-briefcase"></i> ${escapeHtml(now.role)} · ${escapeHtml(shortOrg(now.org))}</span>` : '';
        try {
            const w = await fetchLiveWeather();
            box.insertAdjacentHTML('afterbegin', `<span class="ios-lw"><i class="fas ${escapeHtml(w.icon)}"></i> ${w.temp}° ${escapeHtml(w.place)}</span>`);
        } catch (e) { /* weather is optional */ }
    }

    /* ── Home Screen ──────────────────────────────────────────────────── */
    const HOME = {
        grid: ['about', 'projects', 'resume', 'photos', 'notes', 'weather', 'calculator', 'settings'],
        dock: ['messages', 'mail', 'safari', 'music']
    };

    function iconHtml(id, { label = true } = {}) {
        const app = apps[id];
        if (!app) return '';
        return `<button type="button" class="ios-icon" data-app-icon="${id}" aria-label="${escapeHtml(app.name)}">
                    <span class="ios-icon-art ${app.iconStyle === 'mac' ? 'is-mac' : ''}"><img src="${escapeHtml(app.icon)}" alt="" draggable="false"></span>
                    ${label ? `<span class="ios-icon-label">${escapeHtml(app.label || app.name)}</span>` : ''}
                </button>`;
    }

    function renderHome() {
        const P = window.PROFILE_DATA || {};
        const now = (P.experience || [])[0];
        const grid = $('ios-home-grid');
        grid.innerHTML = `
            <button type="button" class="ios-widget ios-widget-profile" data-open="about" aria-label="About ${escapeHtml(P.name)}">
                <img src="assets/Professionalimage.jpeg" alt="">
                <span class="ios-wp-text">
                    <strong>${escapeHtml(P.name)}</strong>
                    <span>${escapeHtml(P.tagline)}</span>
                    ${now ? `<span class="ios-wp-now"><i></i><span>${escapeHtml(now.role)} · ${escapeHtml(shortOrg(now.org))}</span></span>` : ''}
                </span>
            </button>
            <button type="button" class="ios-widget ios-widget-weather" data-open="weather" id="ios-widget-weather" aria-label="Weather">
                <span class="ios-ww-place">Weather</span>
                <span class="ios-ww-temp">--°</span>
                <span class="ios-ww-cond"><i class="fas fa-cloud"></i></span>
                <span class="ios-ww-range">Loading…</span>
            </button>
            <button type="button" class="ios-widget ios-widget-github" data-open="projects" id="ios-widget-github" aria-label="Latest on GitHub">
                <span class="ios-wg-head"><img src="assets/icons/social-github.svg" alt=""> GitHub</span>
                <span class="ios-wg-list"><span class="ios-wg-skel"></span><span class="ios-wg-skel"></span></span>
            </button>
            ${HOME.grid.map(id => iconHtml(id)).join('')}`;
        $('ios-dock').innerHTML = HOME.dock.map(id => iconHtml(id, { label: false })).join('');
        hydrateWidgets();
    }

    async function hydrateWidgets() {
        const w = $('ios-widget-weather');
        try {
            const data = await fetchLiveWeather();
            w.querySelector('.ios-ww-place').textContent = data.place;
            w.querySelector('.ios-ww-temp').textContent = `${data.temp}°`;
            w.querySelector('.ios-ww-cond').innerHTML = `<i class="fas ${escapeHtml(data.icon)}"></i>`;
            w.querySelector('.ios-ww-range').textContent = data.high !== null ? `${data.label} · H:${data.high}° L:${data.low}°` : data.label;
            w.dataset.day = data.isDay ? '1' : '0';
        } catch (e) {
            w.querySelector('.ios-ww-range').textContent = 'Unavailable';
        }
        const g = $('ios-widget-github');
        try {
            const repos = (await fetchGitHubActivity()).slice(0, 2);
            g.querySelector('.ios-wg-list').innerHTML = repos.map(r => `<span class="ios-wg-row"><strong>${escapeHtml(r.title)}</strong><small>${escapeHtml([r.language, relativeTime(r.time)].filter(Boolean).join(' · '))}</small></span>`).join('');
        } catch (e) {
            g.querySelector('.ios-wg-list').innerHTML = '<span class="ios-wg-row"><strong>@muditagrawal-alt</strong><small>Projects →</small></span>';
        }
    }

    function wireHome() {
        $('ios-home').addEventListener('click', (e) => {
            const target = e.target.closest('[data-app-icon], [data-open]');
            if (!target) return;
            go(target.dataset.appIcon || target.dataset.open);
        });
        $('ios-search-pill').addEventListener('click', openSearch);
        // Swipe down on the Home Screen opens Search, like iOS.
        let sy = null;
        $('ios-home').addEventListener('pointerdown', (e) => { sy = e.clientY; });
        $('ios-home').addEventListener('pointerup', (e) => { if (sy !== null && e.clientY - sy > 70 && !openAppId) openSearch(); sy = null; });
    }

    /* ── Home bar gesture: drag up (or tap) to go home ────────────────── */
    function wireHomeBar() {
        const bar = $('ios-home-bar');
        let s = null;
        bar.addEventListener('pointerdown', (e) => {
            if (!unlocked) { unlock(); return; }
            if (!openAppId) return;
            s = { y: e.clientY, t: performance.now(), dy: 0 };
            bar.setPointerCapture && bar.setPointerCapture(e.pointerId);
            $('ios-app-window').classList.add('dragging');
        });
        bar.addEventListener('pointermove', (e) => {
            if (!s) return;
            s.dy = Math.max(0, s.y - e.clientY);
            const p = Math.min(1, s.dy / 320);
            const win = $('ios-app-window');
            win.style.transform = `translateY(${-s.dy * 0.55}px) scale(${1 - p * 0.32})`;
            win.style.borderRadius = `${Math.round(12 + p * 30)}px`;
        });
        const end = (e) => {
            if (!s) { return; }
            const win = $('ios-app-window');
            win.classList.remove('dragging');
            const fast = s.dy / Math.max(1, performance.now() - s.t) > 0.5;
            const tap = s.dy < 6;
            const goHome = s.dy > 90 || fast || tap;
            s = null;
            win.style.transform = '';
            win.style.borderRadius = '';
            if (goHome) home();
        };
        bar.addEventListener('pointerup', end);
        bar.addEventListener('pointercancel', end);
        bar.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); home(); } });
    }

    /* ── Spotlight search ─────────────────────────────────────────────── */
    function openSearch() {
        const s = $('ios-search');
        s.hidden = false;
        void s.offsetWidth;
        s.classList.add('open');
        const input = $('ios-search-input');
        input.value = '';
        renderSearch('');
        setTimeout(() => input.focus(), 60);
    }

    function closeSearch() {
        const s = $('ios-search');
        if (!s || s.hidden) return;
        s.classList.remove('open');
        setTimeout(() => { s.hidden = true; }, 220);
    }

    function renderSearch(q) {
        const box = $('ios-search-results');
        const query = q.trim().toLowerCase();
        const appHits = Object.values(apps).filter(a => !a.hidden && (!query || a.name.toLowerCase().includes(query) || (a.keywords || '').includes(query)));
        let html = `<div class="ios-search-apps">${appHits.slice(0, query ? 8 : 8).map(a => iconHtml(a.id)).join('')}</div>`;
        if (query && window.IrisBrain) {
            const hits = IrisBrain.retrieve(q, { k: 5 }).filter(h => h.score > 1.2);
            if (hits.length) {
                html += `<div class="ios-section-header">From this portfolio</div><div class="ios-group">${hits.map((h, i) => `
                    <button type="button" class="ios-row" data-hit="${i}">
                        <span class="ios-row-icon" style="--bg:#5e5ce6"><i class="fas fa-${h.p.kind === 'project' ? 'cube' : h.p.kind.startsWith('experience') ? 'briefcase' : 'circle-info'}"></i></span>
                        <span class="ios-row-text"><span class="ios-row-title">${escapeHtml(h.p.title)}</span><span class="ios-row-sub">${escapeHtml(h.p.text.slice(0, 90))}…</span></span>
                        <i class="fas fa-chevron-right ios-row-chevron"></i>
                    </button>`).join('')}</div>`;
                box.innerHTML = html;
                box.querySelectorAll('[data-hit]').forEach(el => el.addEventListener('click', () => {
                    const src = hits[Number(el.dataset.hit)].p.source;
                    closeSearch();
                    if (src && src.open) src.open();
                }));
            } else box.innerHTML = html;
            box.insertAdjacentHTML('beforeend', `<button type="button" class="ios-search-ask" id="ios-search-ask"><i class="fas fa-wand-magic-sparkles"></i> Ask Iris “${escapeHtml(q)}”</button>`);
            $('ios-search-ask').addEventListener('click', () => { closeSearch(); askIris(q); });
        } else {
            box.innerHTML = html;
        }
        box.querySelectorAll('[data-app-icon]').forEach(el => el.addEventListener('click', () => { closeSearch(); go(el.dataset.appIcon); }));
    }

    function wireSearch() {
        $('ios-search-input').addEventListener('input', (e) => renderSearch(e.target.value));
        $('ios-search-cancel').addEventListener('click', closeSearch);
        $('ios-search').addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSearch(); });
    }

    /* ── Small helpers apps use ───────────────────────────────────────── */
    /** Opens Messages and puts a question to Iris (Messages defines iosAskIris). */
    function askIris(question) {
        go('messages');
        setTimeout(() => window.iosAskIris && window.iosAskIris(question), 350);
    }

    function haptic() {
        // Browsers refuse (and log) vibration before the visitor has interacted.
        if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
        const on = readPref('haptics', true);
        if (on && navigator.vibrate) { try { navigator.vibrate(8); } catch (e) { /* unsupported */ } }
    }

    function readPref(key, fallback) {
        try {
            const v = localStorage.getItem(`ios-pref-${key}`);
            return v === null ? fallback : JSON.parse(v);
        } catch (e) { return fallback; }
    }

    function writePref(key, value) {
        try { localStorage.setItem(`ios-pref-${key}`, JSON.stringify(value)); } catch (e) { /* private mode */ }
    }

    function shortOrg(org) {
        return String(org || '').split(' (')[0].replace(/ Pvt\. Ltd\./, '');
    }

    function emptyState(icon, title, body) {
        return `<div class="ios-empty"><i class="${escapeHtml(icon)}"></i><strong>${escapeHtml(title)}</strong>${body ? `<span>${escapeHtml(body)}</span>` : ''}</div>`;
    }

    /**
     * Grouped inset list (Settings-style). rows: [{ icon, color, title, sub,
     * detail, chevron, action, href, toggle, checked, danger }]
     */
    function group(rows, { header, footer } = {}) {
        return `${header ? `<div class="ios-section-header">${escapeHtml(header)}</div>` : ''}
            <div class="ios-group">${rows.map(row).join('')}</div>
            ${footer ? `<div class="ios-section-footer">${escapeHtml(footer)}</div>` : ''}`;
    }

    function row(r) {
        const tag = r.toggle !== undefined ? 'label' : (r.href ? 'a' : (r.action ? 'button' : 'div'));
        const attrs = r.href ? ` href="${escapeHtml(safeUrl(r.href))}" target="_blank" rel="noopener noreferrer"` : (r.action ? ` type="button" data-action="${escapeHtml(r.action)}"` : '');
        const icon = r.icon ? `<span class="ios-row-icon${r.img ? ' is-img' : ''}" style="--bg:${escapeHtml(r.color || '#8e8e93')}">${r.img ? `<img src="${escapeHtml(r.img)}" alt="">` : `<i class="${escapeHtml(r.icon)}"></i>`}</span>` : '';
        const right = r.toggle !== undefined
            ? `<input type="checkbox" class="ios-switch" data-toggle="${escapeHtml(r.toggle)}" ${r.checked ? 'checked' : ''}>`
            : `${r.detail ? `<span class="ios-row-detail">${escapeHtml(r.detail)}</span>` : ''}${r.chevron || r.href ? `<i class="fas ${r.href ? 'fa-arrow-up-right-from-square' : 'fa-chevron-right'} ios-row-chevron"></i>` : ''}`;
        return `<${tag} class="ios-row${r.danger ? ' danger' : ''}${r.className ? ' ' + r.className : ''}"${attrs}>
                    ${icon}
                    <span class="ios-row-text"><span class="ios-row-title">${escapeHtml(r.title)}</span>${r.sub ? `<span class="ios-row-sub">${escapeHtml(r.sub)}</span>` : ''}</span>
                    ${right}
                </${tag}>`;
    }

    /** Delegated [data-action] handlers within a page's content. */
    function bind(container, handlers) {
        container.addEventListener('click', (e) => {
            const el = e.target.closest('[data-action]');
            if (el && container.contains(el) && handlers[el.dataset.action]) handlers[el.dataset.action](el, e);
        });
        container.addEventListener('change', (e) => {
            const el = e.target.closest('[data-toggle]');
            if (el && handlers[`toggle:${el.dataset.toggle}`]) handlers[`toggle:${el.dataset.toggle}`](el.checked, el);
        });
    }

    /* ── Boot ─────────────────────────────────────────────────────────── */
    function start() {
        const dev = $('ios-device');
        const shell = window.PORTFOLIO_SHELL || { detected: 'ios', overridden: false };
        // Opened on a computer with ?view=ios (or "View iPhone Version"): show
        // the phone as a framed device, with a way back to the Mac version.
        const framed = shell.detected === 'mac';
        document.body.classList.toggle('ios-framed', framed);
        $('ios-frame-caption').hidden = !framed;

        const sizeForm = () => { dev.dataset.form = dev.clientWidth >= 700 ? 'tablet' : 'phone'; };
        sizeForm();
        if (window.ResizeObserver) new ResizeObserver(sizeForm).observe(dev);

        // Software keyboard: expose its height (--kb) so composers sit above it.
        if (window.visualViewport) {
            const kb = () => {
                const h = Math.max(0, window.innerHeight - visualViewport.height - visualViewport.offsetTop);
                dev.style.setProperty('--kb', `${Math.round(h)}px`);
            };
            visualViewport.addEventListener('resize', kb);
            visualViewport.addEventListener('scroll', kb);
        }

        renderHome();
        wireHome();
        wireHomeBar();
        wireSearch();
        tickClock();
        setInterval(tickClock, 15000);
        syncBattery();
        syncStatusBar();
        if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', syncStatusBar);

        // Deep link (#/projects/proj-vlm): rebuild the history beneath it, so
        // Back walks up the app (product → Projects) and then to the Home Screen.
        const initial = parseHash();
        if (initial.app && depth() === 0) {
            history.replaceState({ iosDepth: 0 }, '', location.pathname + location.search);
            let d = 0, lastStack = '';
            for (let i = 0; i <= initial.path.length; i++) {
                const prefix = initial.path.slice(0, i);
                const stackKey = pagesFor(initial.app, prefix).map(p => p.key).join('/');
                if (stackKey === lastStack && i < initial.path.length) continue;   // a segment that isn't a page of its own
                lastStack = stackKey;
                history.pushState({ iosDepth: ++d }, '', hashFor(initial.app, prefix));
            }
        }

        let wasUnlocked = false;
        try { wasUnlocked = sessionStorage.getItem('ios-unlocked') === '1'; } catch (e) { wasUnlocked = false; }
        if (wasUnlocked) {
            unlocked = true;
            document.body.classList.add('ios-unlocked');
            apply();
        }
        showLock();
        if (wasUnlocked) $('ios-lock').classList.remove('visible');
    }

    return {
        register, go, back, home, start, unlock, lockNow, haptic, readPref, writePref, askIris,
        group, row, bind, emptyState, shortOrg, setIslandActivity, syncStatusBar, isDarkAppearance,
        get apps() { return apps; },
        get currentApp() { return openAppId; },
        get isUnlocked() { return unlocked; }
    };
})();

/* ── Compatibility layer for the shared Iris engine ──────────────────────
   js/apps/iris-brain.js was written against the Mac's functions (its answer
   "sources" call openFinderPane(), openWindow()…). These map those calls to
   the matching iOS apps, so the shared engine works unchanged on iPhone. */
function openWelcome() { IOS.go('about'); }
function openFinderPane(pane) {
    if (pane === 'projects') IOS.go('projects');
    else if (['experience', 'education', 'skills'].includes(pane)) IOS.go('about', [pane]);
    else IOS.go('about');
}
function openWindow(id) {
    const map = {
        'mail-window': ['mail'], 'notes-window': ['notes'], 'photos-window': ['photos'],
        'trash-window': ['notes', ['deleted']], 'resume-window': ['resume'], 'music-window': ['music'],
        'appstore-window': ['projects'], 'settings-window': ['settings'], 'finder-window': ['about'],
        'safari-window': ['safari'], 'welcome-window': ['about']
    };
    const t = map[id];
    if (t) IOS.go(t[0], t[1] || []);
}
function selectNote(id) { IOS.go('notes', ['all', String(id)]); }
function openMailCompose() { IOS.go('mail', ['compose']); }
function closeIris() { /* Iris lives inside Messages on iPhone — nothing to close */ }
