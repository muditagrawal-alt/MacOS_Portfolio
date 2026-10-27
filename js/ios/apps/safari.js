/* ==========================================================================
   Safari — Start Page, portfolio search and a bottom address bar
   --------------------------------------------------------------------------
   Most sites refuse to load inside another page, so Safari here is a start
   page: favourites (live projects, GitHub, LinkedIn), results "From this
   portfolio" (js/data/corpus.js, the index the Mac's Safari, Spotlight and
   Iris share), and an address bar that opens real sites in a new tab.
   ========================================================================== */

(function () {
    const P = window.PROFILE_DATA || {};
    const C = P.contact || {};
    let query = '';

    function favourites() {
        const live = (typeof getPortfolioProjects === 'function' ? getPortfolioProjects() : []).filter(p => p.live);
        return [
            { title: 'GitHub', url: C.github, glyph: 'fab fa-github', bg: '#24292f' },
            { title: 'LinkedIn', url: C.linkedin, glyph: 'fab fa-linkedin-in', bg: '#0a66c2' },
            ...live.map(p => ({ title: p.name, url: p.link, img: p.icon })),
            { title: 'Hugging Face', url: 'https://huggingface.co', emoji: '🤗', bg: '#ffd21e' }
        ];
    }

    function search(q) {
        const words = q.toLowerCase().split(/\s+/).filter(w => w.length > 1);
        if (!words.length) return [];
        return (window.PORTFOLIO_CORPUS || []).map(e => {
            const hay = `${e.title} ${e.text} ${(e.tags || []).join(' ')}`.toLowerCase();
            const title = e.title.toLowerCase();
            const score = words.reduce((s, w) => s + (title.includes(w) ? 3 : 0) + (hay.includes(w) ? 1 : 0), 0);
            return { e, score };
        }).filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, 8).map(r => r.e);
    }

    function toUrl(raw) {
        const t = raw.trim();
        if (/^https?:\/\//i.test(t)) return t;
        if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(t)) return `https://${t}`;
        return null;
    }

    function open(url) {
        const target = safeUrl(url);
        if (target === '#') return;
        window.open(target, '_blank', 'noopener,noreferrer');
    }

    function startPage(content, ctx) {
        content.innerHTML = '<div class="safari-scroll"></div>';
        const scroll = content.querySelector('.safari-scroll');
        const bar = document.createElement('form');
        bar.className = 'safari-bar';
        bar.innerHTML = `
            <label class="safari-field">
                <i class="fas fa-magnifying-glass"></i>
                <input type="search" placeholder="Search or enter website name" aria-label="Address and search" autocomplete="off" autocapitalize="off" enterkeyhint="go" value="${escapeHtml(query)}">
            </label>
            <div class="safari-tools">
                <button type="button" data-tool="back" disabled aria-label="Back"><i class="fas fa-chevron-left"></i></button>
                <button type="button" data-tool="fwd" disabled aria-label="Forward"><i class="fas fa-chevron-right"></i></button>
                <button type="button" data-tool="share" aria-label="Share"><i class="fas fa-arrow-up-from-bracket"></i></button>
                <button type="button" data-tool="ask" aria-label="Ask Iris"><i class="fas fa-wand-magic-sparkles"></i></button>
                <button type="button" data-tool="home" aria-label="Home Screen"><i class="far fa-clone"></i></button>
            </div>`;
        ctx.page.appendChild(bar);
        const input = bar.querySelector('input');

        const draw = () => {
            const q = query.trim();
            if (!q) {
                scroll.innerHTML = `
                    <h2 class="safari-h">Favorites</h2>
                    <div class="safari-favs">${favourites().map((f, i) => `
                        <button type="button" class="safari-fav" data-fav="${i}">
                            ${f.img ? `<span class="ios-art"><img src="${escapeHtml(f.img)}" alt=""></span>` : `<span class="safari-fav-tile" style="background:${escapeHtml(f.bg)}">${f.glyph ? `<i class="${escapeHtml(f.glyph)}"></i>` : escapeHtml(f.emoji)}</span>`}
                            <small>${escapeHtml(f.title)}</small>
                        </button>`).join('')}
                    </div>
                    <h2 class="safari-h">Privacy Report</h2>
                    <div class="safari-privacy">
                        <i class="fas fa-shield-halved"></i>
                        <p><strong>0 trackers</strong> on this portfolio. No analytics, no ads, no cookies. Weather and GitHub are fetched directly, without an account.</p>
                    </div>
                    <h2 class="safari-h">Reading List</h2>
                    ${IOS.group((window.PORTFOLIO_CORPUS || []).filter(e => e.type === 'Project').slice(0, 4).map((e, i) => ({ icon: 'fas fa-cube', color: '#5e5ce6', title: e.title, sub: e.text, action: `read-${i}` })))}`;
            } else {
                const results = search(q);
                const url = toUrl(q);
                scroll.innerHTML = `
                    ${url ? `<div class="ios-group"><button type="button" class="ios-row" data-open="${escapeHtml(url)}"><span class="ios-row-icon" style="--bg:#007aff"><i class="fas fa-globe"></i></span><span class="ios-row-text"><span class="ios-row-title">${escapeHtml(url.replace(/^https?:\/\//, ''))}</span><span class="ios-row-sub">Opens in a new tab</span></span></button></div>` : ''}
                    <div class="ios-section-header">From this portfolio</div>
                    ${results.length ? `<div class="ios-group">${results.map((e, i) => `
                        <button type="button" class="ios-row" data-result="${i}">
                            <span class="ios-row-icon" style="--bg:${e.type === 'Project' ? '#5e5ce6' : '#ff9500'}"><i class="fas fa-${e.type === 'Project' ? 'cube' : 'circle-info'}"></i></span>
                            <span class="ios-row-text"><span class="ios-row-title">${escapeHtml(e.title)}</span><span class="ios-row-sub">${escapeHtml(e.text)}</span></span>
                        </button>`).join('')}</div>` : `<p class="safari-none">No matches in the portfolio.</p>`}
                    <div class="ios-group safari-web">
                        <button type="button" class="ios-row" data-web="1"><span class="ios-row-icon" style="--bg:#8e8e93"><i class="fas fa-magnifying-glass"></i></span><span class="ios-row-text"><span class="ios-row-title">Search the web for “${escapeHtml(q)}”</span></span></button>
                        <button type="button" class="ios-row" data-askq="1"><span class="ios-row-icon" style="--bg:#5e5ce6"><i class="fas fa-wand-magic-sparkles"></i></span><span class="ios-row-text"><span class="ios-row-title">Ask Iris</span></span></button>
                    </div>`;
                scroll.dataset.results = JSON.stringify(results.map(r => r.url || ''));
            }
        };

        input.addEventListener('input', () => { query = input.value; draw(); });
        bar.addEventListener('submit', (e) => {
            e.preventDefault();
            const url = toUrl(input.value);
            if (url) { open(url); return; }
            input.blur();
        });
        bar.querySelector('.safari-tools').addEventListener('click', (e) => {
            const t = e.target.closest('[data-tool]');
            if (!t) return;
            if (t.dataset.tool === 'share') { if (navigator.share) sharePortfolio(); else copyTextToClipboard(portfolioUrl(), 'Link copied'); }
            if (t.dataset.tool === 'ask') IOS.askIris(query.trim() || 'What has Mudit built?');
            if (t.dataset.tool === 'home') IOS.home();
        });
        scroll.addEventListener('click', (e) => {
            const fav = e.target.closest('[data-fav]');
            if (fav) { open(favourites()[+fav.dataset.fav].url); return; }
            const res = e.target.closest('[data-result]');
            if (res) {
                const url = JSON.parse(scroll.dataset.results || '[]')[+res.dataset.result];
                if (url) open(url); else IOS.go('about');
                return;
            }
            const o = e.target.closest('[data-open]');
            if (o) { open(o.dataset.open); return; }
            if (e.target.closest('[data-web]')) { open(`https://duckduckgo.com/?q=${encodeURIComponent(query.trim())}`); return; }
            if (e.target.closest('[data-askq]')) { IOS.askIris(query.trim()); return; }
            const read = e.target.closest('[data-action^="read-"]');
            if (read) {
                const entry = (window.PORTFOLIO_CORPUS || []).filter(x => x.type === 'Project')[+read.dataset.action.slice(5)];
                if (entry && entry.url) open(entry.url);
            }
        });
        draw();
    }

    IOS.register('safari', {
        name: 'Safari',
        icon: 'assets/icons/safari.png',
        keywords: 'browser web search links github linkedin',
        pages: () => [{ key: 'start', title: '', hideNav: true, className: 'safari-page', render: startPage }]
    });
})();
