/* ==========================================================================
   Wallet — certificates as passes, hackathons and events as tickets
   --------------------------------------------------------------------------
   From the info bank: certificates (the same ones Photos shows), hackathons
   and events. Passes stack like the real Wallet; tap one to bring it up,
   with what it's for: the certificate itself, or the place on the map.
   A pass's colour comes from its issuer, so the same issuer always matches.
   ========================================================================== */

(function () {
    const P = window.PROFILE_DATA;
    const SWATCHES = [
        ['#1d3557', '#457b9d'], ['#2b2d42', '#5c677d'], ['#3a0ca3', '#7209b7'], ['#0b6e4f', '#2a9d8f'],
        ['#7f1d1d', '#c2410c'], ['#14213d', '#1f6feb'], ['#4a1d6e', '#c2185b'], ['#1b4332', '#52b788'], ['#3d2c8d', '#916bbf']
    ];
    const TICKETS = { hackathon: ['#c2410c', '#f59e0b'], event: ['#9d174d', '#f43f5e'] };

    function swatch(key) {
        let h = 0;
        for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
        return SWATCHES[h % SWATCHES.length];
    }

    const placeId = (kind, name) => {
        const pin = P.places.find(x => x.kind === kind && x.title === name);
        return pin ? pin.id : null;
    };
    const city = (place) => (place && (place.city || place.name)) || '';

    const passes = [
        ...P.hackathons.map((h, i) => ({
            id: `hack-${i + 1}`, type: 'ticket', kind: 'hackathon', colors: TICKETS.hackathon, glyph: 'fas fa-trophy',
            org: 'Hackathon', title: h.name, corner: h.result,
            fields: [['Project', h.project], ['Date', h.date], ['Venue', city(h.place)]],
            back: h.detail, pin: placeId('hackathon', h.name)
        })),
        ...P.events.map((ev, i) => ({
            id: `event-${i + 1}`, type: 'ticket', kind: 'event', colors: TICKETS.event, glyph: 'fas fa-ticket',
            org: 'Event', title: ev.name, corner: ev.date,
            fields: [['Venue', ev.place && ev.place.name], ['City', ev.place && ev.place.city]],
            back: ev.detail, pin: placeId('event', ev.name)
        })),
        ...((window.PHOTO_LIBRARY || {}).certificates || { items: [] }).items.map(c => ({
            id: c.file, type: 'pass', kind: 'certificate', colors: swatch(c.issuer), glyph: 'fas fa-award',
            org: c.issuer, title: c.title, corner: '',
            fields: [['Issued by', c.issuer], ['Type', 'Certificate']], image: c.thumb, file: c.full, photo: c.file
        }))
    ].map(x => ({ ...x, fields: x.fields.filter(([, v]) => v) }));

    const groups = [
        ['Hackathons & Events', passes.filter(x => x.type === 'ticket')],
        ['Certificates', passes.filter(x => x.type === 'pass')]
    ].filter(([, list]) => list.length);

    function card(x, { full = false } = {}) {
        return `<${full ? 'div' : 'button type="button"'} class="wl-card wl-${x.type}${full ? ' full' : ''}" ${full ? '' : `data-pass="${escapeHtml(x.id)}" aria-label="${escapeHtml(`${x.org}: ${x.title}`)}"`} style="--a:${x.colors[0]};--b:${x.colors[1]}">
                <span class="wl-head">
                    <span class="wl-logo"><i class="${x.glyph}"></i></span>
                    <span class="wl-name">${full ? '' : `<b>${escapeHtml(x.title)}</b>`}<small>${escapeHtml(x.org)}</small></span>
                    ${x.corner ? `<span class="wl-corner">${escapeHtml(x.corner)}</span>` : ''}
                </span>
                ${full ? `<span class="wl-title">${escapeHtml(x.title)}</span>` : ''}
                ${x.fields.length ? `<span class="wl-fields">${x.fields.map(([k, v]) => `<span><small>${escapeHtml(k)}</small><b>${escapeHtml(v)}</b></span>`).join('')}</span>` : ''}
                ${full && x.image ? `<span class="wl-image"><img src="${escapeHtml(x.image)}" alt="${escapeHtml(x.title)}"></span>` : ''}
            </${full ? 'div' : 'button'}>`;
    }

    function list(content) {
        content.innerHTML = groups.map(([title, items]) => `
            <div class="ios-section-header">${escapeHtml(title)} · ${items.length}</div>
            <div class="wl-stack">${items.map(x => card(x)).join('')}</div>`).join('');
        content.onclick = (e) => {
            const c = e.target.closest('[data-pass]');
            if (c) { IOS.haptic(); IOS.go('wallet', [c.dataset.pass]); }
        };
    }

    function detail(content, id) {
        const x = passes.find(p => p.id === id);
        if (!x) { content.innerHTML = IOS.emptyState('fas fa-wallet', 'Pass not found', ''); return; }
        const pdf = x.file && /\.pdf$/i.test(x.file);
        content.innerHTML = `
            ${card(x, { full: true })}
            ${x.back ? `<p class="wl-back">${escapeHtml(x.back)}</p>` : ''}
            <div class="wl-actions">
                ${x.photo ? '<button type="button" class="ios-btn" data-action="photo"><i class="fas fa-image"></i> View Certificate</button>' : ''}
                ${pdf ? '<button type="button" class="ios-btn secondary" data-action="pdf"><i class="fas fa-file-pdf"></i> Open PDF</button>' : ''}
                ${x.pin ? '<button type="button" class="ios-btn" data-action="map"><i class="fas fa-map-location-dot"></i> Show on Map</button>' : ''}
                <button type="button" class="ios-btn secondary" data-action="ask"><i class="fas fa-wand-magic-sparkles"></i> Ask Iris</button>
            </div>`;
        IOS.bind(content, {
            photo: () => IOS.go('photos', [x.photo]),
            pdf: () => window.open(new URL(x.file, location.href).href, '_blank', 'noopener'),
            map: () => window.openMapPlace && openMapPlace(x.pin),
            ask: () => IOS.askIris(`Tell me about ${x.title}`)
        });
    }

    if (!passes.length) return;
    IOS.register('wallet', {
        name: 'Wallet',
        icon: 'assets/icons/wallet.svg',
        iconStyle: 'ios',
        keywords: 'wallet passes certificates tickets hackathons events credentials awards',
        pages(path) {
            const root = { key: 'passes', title: 'Wallet', className: 'wl-page', render: list };
            if (path[0]) {
                const x = passes.find(p => p.id === path[0]);
                return [root, { key: `wl-${path[0]}`, title: x ? x.title : 'Pass', largeTitle: false, backTitle: 'Wallet', className: 'wl-page', render: (c) => detail(c, path[0]) }];
            }
            return [root];
        }
    });
})();
