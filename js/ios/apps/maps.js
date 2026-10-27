/* ==========================================================================
   Maps — everywhere the owner studied, worked, competed and showed up
   --------------------------------------------------------------------------
   Pins come from the info bank's places (PROFILE_DATA.places: the degree,
   schools, roles, hackathons and events that have coordinates). The map is
   Leaflet with OpenStreetMap's own tiles (free with attribution; dark mode
   is the same tiles through a filter), loaded only when Maps opens. Without
   a connection the list still works. Routes: #/maps, #/maps/hackathon (a filter), #/maps/<place id>.
   ========================================================================== */

(function () {
    const P = window.PROFILE_DATA;
    const LEAFLET = {
        js: ['https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js', 'sha512-puJW3E/qXDqYp9IfhAI54BJEaWIfloJ7JWs7OeD5i6ruC9JZL1gERT1wjtwXFlh7CjE7ZJ+/vcRZRkIYIb6p4g=='],
        css: ['https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css', 'sha512-h9FcoyWjHcOcmEVkxOfTLnmZFWIH0iZhZT1H2TbOq55xssQGEJHEaIm+PgoUaZbRvQTNTluNOEfb1ZRy6D3BOw==']
    };
    const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    const KINDS = {
        university: { group: 'education', icon: 'fas fa-graduation-cap', color: '#007aff', word: 'University' },
        school: { group: 'education', icon: 'fas fa-school', color: '#32ade6', word: 'School' },
        work: { group: 'work', icon: 'fas fa-briefcase', color: '#af52de', word: 'Work' },
        hackathon: { group: 'hackathon', icon: 'fas fa-trophy', color: '#ff9500', word: 'Hackathon' },
        event: { group: 'event', icon: 'fas fa-calendar-check', color: '#ff2d55', word: 'Event' }
    };
    const FILTERS = [['all', 'All'], ['education', 'Education'], ['work', 'Work'], ['hackathon', 'Hackathons'], ['event', 'Events']];

    const pins = P.places || [];
    let view = null;          // { root, map, markers } while the page is mounted
    let filter = 'all';
    let selected = null;
    let wanted = null;        // the route to apply once the page is up

    function loadLeaflet() {
        if (window.L) return Promise.resolve(window.L);
        if (loadLeaflet.promise) return loadLeaflet.promise;
        loadLeaflet.promise = new Promise((resolve, reject) => {
            const css = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: LEAFLET.css[0], integrity: LEAFLET.css[1], crossOrigin: 'anonymous' });
            const js = Object.assign(document.createElement('script'), { src: LEAFLET.js[0], integrity: LEAFLET.js[1], crossOrigin: 'anonymous' });
            js.onload = () => resolve(window.L);
            js.onerror = () => { loadLeaflet.promise = null; reject(new Error('Leaflet unavailable')); };
            document.head.append(css, js);
        });
        return loadLeaflet.promise;
    }

    const shown = () => pins.filter(x => filter === 'all' || KINDS[x.kind].group === filter);
    const count = (group) => pins.filter(x => group === 'all' || KINDS[x.kind].group === group).length;

    function rowHtml(x) {
        const k = KINDS[x.kind];
        return `<li><button type="button" class="map-row" data-place="${escapeHtml(x.id)}">
            <span class="map-glyph" style="--c:${k.color}"><i class="${k.icon}"></i></span>
            <span class="map-row-text"><strong>${escapeHtml(x.title)}</strong><small>${escapeHtml([x.subtitle, x.place.city || x.place.name].filter(Boolean).join(' · '))}</small></span>
            ${x.date ? `<em>${escapeHtml(x.date)}</em>` : ''}
        </button></li>`;
    }

    function detailHtml(x) {
        const k = KINDS[x.kind];
        const directions = `https://www.google.com/maps/search/?api=1&query=${x.place.lat},${x.place.lng}`;
        return `
            <button type="button" class="map-detail-close" data-act="list" aria-label="Back to all places"><i class="fas fa-xmark"></i></button>
            <span class="map-kind" style="--c:${k.color}"><i class="${k.icon}"></i> ${k.word}</span>
            <h3>${escapeHtml(x.title)}</h3>
            ${x.subtitle ? `<p class="map-sub">${escapeHtml(x.subtitle)}</p>` : ''}
            <p class="map-where"><i class="fas fa-location-dot"></i> ${escapeHtml(x.place.label)}${x.date ? ` · ${escapeHtml(x.date)}` : ''}</p>
            <div class="map-actions">
                <a class="ios-btn" href="${escapeHtml(directions)}" target="_blank" rel="noopener noreferrer"><i class="fas fa-diamond-turn-right"></i> Directions</a>
                <button type="button" class="ios-btn secondary" data-act="ask"><i class="fas fa-wand-magic-sparkles"></i> Ask Iris</button>
            </div>`;
    }

    function renderSheet() {
        const root = view.root;
        root.querySelector('.map-chips').innerHTML = FILTERS.filter(([g]) => count(g)).map(([g, label]) =>
            `<button type="button" class="${g === filter ? 'on' : ''}" data-filter="${g}" aria-pressed="${g === filter}">${label} <b>${count(g)}</b></button>`).join('');
        const x = selected && pins.find(p => p.id === selected);
        const detail = root.querySelector('.map-detail');
        detail.hidden = !x;
        detail.innerHTML = x ? detailHtml(x) : '';
        root.querySelector('.map-list').hidden = Boolean(x);
        root.querySelector('.map-list').innerHTML = shown().map(rowHtml).join('') || `<li class="map-empty">No places here yet.</li>`;
        if (view.markers) {
            view.markers.forEach(({ marker, pin }) => {
                const visible = filter === 'all' || KINDS[pin.kind].group === filter;
                marker.setOpacity(visible ? 1 : 0);
                const el = marker.getElement();
                if (el) { el.classList.toggle('selected', pin.id === selected); el.style.pointerEvents = visible ? '' : 'none'; }
            });
        }
    }

    function sheetPadding() {
        const sheet = view.root.querySelector('.map-sheet');
        return [44, 30 + (sheet ? sheet.getBoundingClientRect().height : 0)];   // room for a pin at the edge
    }

    function fit(list = shown()) {
        if (!view || !view.map || !list.length) return;
        const [side, bottom] = sheetPadding();
        if (list.length === 1) {
            view.map.setView([list[0].place.lat, list[0].place.lng], 14, { animate: true });
            view.map.panBy([0, (bottom - side) / 2], { animate: false });
            return;
        }
        view.map.fitBounds(list.map(x => [x.place.lat, x.place.lng]), { paddingTopLeft: [side, side + 40], paddingBottomRight: [side, bottom], maxZoom: 13, animate: true });
    }

    function select(id, { fly = true } = {}) {
        const x = pins.find(p => p.id === id);
        selected = x ? x.id : null;
        if (x && filter !== 'all' && KINDS[x.kind].group !== filter) filter = 'all';
        setSheet('peek');
        renderSheet();
        if (x && fly && view.map) {
            const [, bottom] = sheetPadding();
            view.map.flyTo([x.place.lat, x.place.lng], 15, { duration: 0.8 });
            view.map.once('moveend', () => view && view.map.panBy([0, bottom / 2 - 40], { animate: true }));
        }
        IOS.haptic();
    }

    function setSheet(state) {
        const sheet = view && view.root.querySelector('.map-sheet');
        if (sheet) sheet.dataset.state = state;
    }

    /** #/maps/<id> selects a place; #/maps/<group> filters; #/maps shows everything. */
    function applyRoute(arg) {
        if (!view) return;
        if (arg && FILTERS.some(([g]) => g === arg)) { filter = arg; selected = null; renderSheet(); fit(); }
        else if (arg && pins.some(p => p.id === arg)) select(arg);
        else { selected = null; renderSheet(); }
    }

    async function drawMap() {
        try {
            const L = await loadLeaflet();
            if (!view) return;
            const canvas = view.root.querySelector('.map-canvas');
            const map = L.map(canvas, { zoomControl: false, attributionControl: false, tapTolerance: 20 }).setView([22.5, 79], 4);
            L.tileLayer(TILES, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(map);
            canvas.classList.toggle('dark', IOS.isDarkAppearance());
            // Credits at the top, where the sheet doesn't cover them.
            L.control.attribution({ position: 'topleft', prefix: false }).addTo(map);
            // Two pins at one address (a hackathon on campus) sit side by side instead of stacking.
            const seen = {};
            view.markers = pins.map(pin => {
                const key = `${pin.place.lat.toFixed(4)},${pin.place.lng.toFixed(4)}`;
                const n = (seen[key] = (seen[key] || 0) + 1) - 1;
                const k = KINDS[pin.kind];
                const icon = L.divIcon({ className: 'map-pin-wrap', html: `<span class="map-pin" style="--c:${k.color}"><i class="${k.icon}"></i></span>`, iconSize: [34, 42], iconAnchor: [17 - n * 30, 40] });
                const marker = L.marker([pin.place.lat, pin.place.lng], { icon, title: pin.title, keyboard: true }).addTo(map);
                marker.on('click', () => IOS.go('maps', [pin.id], { replace: true }));
                return { marker, pin };
            });
            view.map = map;
            setTimeout(() => { if (!view) return; map.invalidateSize(); renderSheet(); if (selected) select(selected); else fit(); }, 380);
        } catch (e) {
            if (view) view.root.querySelector('.map-fallback').hidden = false;
        }
    }

    function page(content) {
        content.innerHTML = `
            <div class="map-wrap">
                <div class="map-canvas" aria-label="Map"></div>
                <p class="map-fallback" hidden><i class="fas fa-map"></i> The map needs a connection — every place is listed below.</p>
                <button type="button" class="map-fit" data-act="fit" aria-label="Show every place"><i class="fas fa-location-arrow"></i></button>
                <section class="map-sheet" data-state="peek" aria-label="Places">
                    <button type="button" class="map-grabber" data-act="grab" aria-label="Expand the list"><span></span></button>
                    <header class="map-head"><h2>${escapeHtml(P.first)}’s Places</h2><span>${pins.length} pin${pins.length === 1 ? '' : 's'}</span></header>
                    <div class="map-chips" role="toolbar" aria-label="Filter places"></div>
                    <div class="map-detail" hidden></div>
                    <ul class="map-list"></ul>
                </section>
            </div>`;
        view = { root: content.querySelector('.map-wrap'), map: null, markers: null };
        const root = view.root;
        root.addEventListener('click', (e) => {
            const row = e.target.closest('[data-place]');
            if (row) { IOS.go('maps', [row.dataset.place], { replace: true }); return; }
            const chip = e.target.closest('[data-filter]');
            if (chip) { IOS.go('maps', chip.dataset.filter === 'all' ? [] : [chip.dataset.filter], { replace: true }); return; }
            const act = e.target.closest('[data-act]');
            if (!act) return;
            if (act.dataset.act === 'fit') { selected = null; renderSheet(); fit(); }
            if (act.dataset.act === 'list') IOS.go('maps', filter === 'all' ? [] : [filter], { replace: true });
            if (act.dataset.act === 'grab') setSheet(root.querySelector('.map-sheet').dataset.state === 'full' ? 'peek' : 'full');
            if (act.dataset.act === 'ask') { const x = pins.find(p => p.id === selected); if (x) IOS.askIris(`Tell me about ${x.title}`); }
        });
        // Drag the grabber up or down, like the Maps sheet.
        const grab = root.querySelector('.map-grabber');
        let y0 = null;
        grab.addEventListener('pointerdown', (e) => { y0 = e.clientY; });
        grab.addEventListener('pointerup', (e) => {
            if (y0 === null) return;
            const dy = e.clientY - y0;
            if (Math.abs(dy) > 30) setSheet(dy < 0 ? 'full' : 'peek');
            y0 = null;
        });
        applyRoute(wanted);
        if (!selected) renderSheet();
        drawMap();
    }

    if (pins.length) {
        IOS.register('maps', {
            name: 'Maps',
            icon: 'assets/icons/maps.png',
            keywords: 'maps places map location university school internship hackathon event where travel',
            onClose() { if (view && view.map) view.map.remove(); view = null; selected = null; filter = 'all'; },
            screenSubject: () => { const x = selected && pins.find(p => p.id === selected); return x ? x.title : ''; },
            pages(path) {
                wanted = path[0] || null;
                // The map stays mounted; a new route only moves it.
                if (view) setTimeout(() => applyRoute(wanted), 0);
                return [{ key: 'map', title: 'Maps', hideNav: true, className: 'map-page', render: page }];
            }
        });
    }

    window.openMapPlace = (id) => IOS.go('maps', [id]);
})();
