/* ==========================================================================
   Projects — every project as an App Store product page
   --------------------------------------------------------------------------
   Same data as the Mac's App Store (getPortfolioProjects: the Finder
   Projects folder joined with the search corpus), so a new project appears
   in both versions at once. Deep links work: #/projects/proj-vlm.
   ========================================================================== */

(function () {
    const FILTERS = [['all', 'All'], ['ai', 'AI'], ['vision', 'Vision'], ['systems', 'Systems'], ['defense', 'Defense']];
    let filter = 'all';

    const all = () => (typeof getPortfolioProjects === 'function' ? getPortfolioProjects() : []);
    const hostOf = (link) => { try { return new URL(link).host.replace(/^www\./, ''); } catch (e) { return ''; } };
    const actionLabel = (p) => (p.live ? 'OPEN' : 'VIEW');

    function getButton(p, extra = '') {
        // A live app that runs inside the phone opens there, like an installed app.
        if (p.appId && IOS.apps[p.appId]) {
            return `<button type="button" class="proj-get live ${extra}" data-open-app="${escapeHtml(p.appId)}" aria-label="${escapeHtml(`OPEN ${p.name}`)}">OPEN</button>`;
        }
        return `<a class="proj-get ${p.live ? 'live' : ''} ${extra}" href="${escapeHtml(safeUrl(p.link))}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(`${actionLabel(p)} ${p.name}`)}">${actionLabel(p)}</a>`;
    }

    const githubButton = (p, extra = '') => (p.repo
        ? `<a class="proj-gh ${extra}" href="${escapeHtml(safeUrl(p.repo))}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(`${p.name} on GitHub`)}"><i class="fab fa-github"></i></a>` : '');

    function list(content) {
        const projects = all();
        const featured = projects.find(p => p.live) || projects[0];
        const shown = projects.filter(p => filter === 'all' || p.cats.includes(filter));
        content.innerHTML = `
            ${featured ? `
            <button type="button" class="proj-feature" data-project="${escapeHtml(featured.id)}">
                <span class="proj-feature-kicker">FEATURED · ${featured.live ? 'LIVE NOW' : 'OPEN SOURCE'}</span>
                <span class="proj-feature-title">${escapeHtml(featured.title)}</span>
                <span class="proj-feature-sub">${escapeHtml(featured.blurb)}</span>
                <span class="proj-feature-row">
                    <span class="ios-art"><img src="${escapeHtml(featured.icon)}" alt=""></span>
                    <span><strong>${escapeHtml(featured.name)}</strong><small>${escapeHtml(featured.subtitle)}</small></span>
                </span>
            </button>` : ''}
            <div class="ios-segmented proj-filter" role="tablist">
                ${FILTERS.map(([k, label]) => `<button type="button" role="tab" aria-selected="${k === filter}" class="${k === filter ? 'active' : ''}" data-filter="${k}">${label}</button>`).join('')}
            </div>
            <div class="proj-list">
                ${shown.map(p => `
                <div class="proj-item" data-project="${escapeHtml(p.id)}" role="button" tabindex="0">
                    <span class="ios-art"><img src="${escapeHtml(p.icon)}" alt=""></span>
                    <span class="proj-item-text">
                        <strong>${escapeHtml(p.name)}</strong>
                        <small>${escapeHtml(p.subtitle)}</small>
                    </span>
                    ${p.live ? githubButton(p) : ''}
                    ${getButton(p)}
                </div>`).join('') || IOS.emptyState('fas fa-cube', 'No projects here', 'Try another category.')}
            </div>
            <p class="proj-footnote">${projects.filter(p => p.live).length} live apps · ${projects.length - projects.filter(p => p.live).length} open-source repositories</p>`;

        content.onclick = (e) => {
            const app = e.target.closest('[data-open-app]');
            if (app) { IOS.go(app.dataset.openApp); return; }
            if (e.target.closest('.proj-get, .proj-gh')) return;
            const f = e.target.closest('[data-filter]');
            if (f) { filter = f.dataset.filter; list(content); return; }
            const item = e.target.closest('[data-project]');
            if (item) IOS.go('projects', [item.dataset.project]);
        };
        content.onkeydown = (e) => {
            const item = e.target.closest('.proj-item');
            if (item && e.key === 'Enter') IOS.go('projects', [item.dataset.project]);
        };
    }

    function product(content, id) {
        const p = all().find(x => x.id === id);
        if (!p) { content.innerHTML = IOS.emptyState('fas fa-cube', 'Project not found', 'It may have been renamed.'); return; }
        const paras = String(p.desc || '').split('\n').map(s => s.trim()).filter(Boolean);
        const prose = paras.filter(s => !s.startsWith('•'));
        const bullets = paras.filter(s => s.startsWith('•')).map(s => s.replace(/^•\s*/, ''));
        const host = hostOf(p.link);
        content.innerHTML = `
            <header class="proj-header">
                <span class="ios-art"><img src="${escapeHtml(p.icon)}" alt=""></span>
                <div>
                    <h2>${escapeHtml(p.title)}</h2>
                    <p>${escapeHtml(p.subtitle)}</p>
                    <div class="proj-header-actions">
                        ${getButton(p, 'big')}
                        ${githubButton(p, 'big')}
                        <button type="button" class="proj-share" data-action="share" aria-label="Share link"><i class="fas fa-arrow-up-from-bracket"></i></button>
                    </div>
                </div>
            </header>
            <div class="proj-facts">
                <div><span>STATUS</span><strong>${p.live ? 'Live' : 'Source'}</strong><small>${p.live ? 'Deployed' : 'Open source'}</small></div>
                <div><span>HOSTED ON</span><strong><i class="fa${/github/.test(host) ? 'b fa-github' : 's fa-globe'}"></i></strong><small>${escapeHtml(host || '—')}</small></div>
                <div><span>UPDATED</span><strong>${escapeHtml(p.date || '—')}</strong><small>&nbsp;</small></div>
            </div>
            ${p.video ? `<section class="proj-section"><h3>Demo</h3>${projectVideoHtml(p.video)}</section>` : ''}
            <section class="proj-section">
                <h3>About this project</h3>
                ${prose.map(s => `<p>${escapeHtml(s)}</p>`).join('')}
                ${bullets.length ? `<ul>${bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>` : ''}
            </section>
            ${p.stack.length ? `<section class="proj-section"><h3>Built with</h3><div class="proj-tags">${p.stack.map(t => `<span>${escapeHtml(t)}</span>`).join('')}</div></section>` : ''}
            ${p.repo ? `<section class="proj-section"><h3>Source code</h3><a class="ios-btn block secondary" href="${escapeHtml(safeUrl(p.repo))}" target="_blank" rel="noopener noreferrer"><i class="fab fa-github"></i> View on GitHub · ${escapeHtml(p.repo.replace(/^https?:\/\/(www\.)?github\.com\//, ''))}</a></section>` : ''}
            <section class="proj-section">
                <h3>Questions?</h3>
                <button type="button" class="ios-btn block secondary" data-action="ask"><i class="fas fa-wand-magic-sparkles"></i> Ask Iris about ${escapeHtml(p.name)}</button>
            </section>`;
        content.querySelectorAll('[data-open-app]').forEach(b => b.addEventListener('click', () => IOS.go(b.dataset.openApp)));
        IOS.bind(content, {
            share: () => {
                if (navigator.share) navigator.share({ title: p.title, text: p.blurb, url: p.link }).catch(() => {});
                else copyTextToClipboard(p.link, 'Link copied');
            },
            ask: () => IOS.askIris(`Tell me about ${p.name}`)
        });
    }

    IOS.register('projects', {
        name: 'Projects',
        icon: 'assets/icons/app-store.png',
        keywords: 'app store apps work portfolio github live rag vision',
        pages(path) {
            const root = { key: 'list', title: 'Projects', render: list };
            if (path[0]) {
                const p = all().find(x => x.id === path[0]);
                return [root, { key: `p-${path[0]}`, title: p ? p.name : 'Project', largeTitle: false, backTitle: 'Projects', render: (c) => product(c, path[0]) }];
            }
            return [root];
        }
    });

    // Launchpad/Spotlight-style entry point the shared Iris engine may call.
    window.openProjectDetails = (name) => {
        const words = s => String(s || '').toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 1);
        const want = words(name);
        let best = null, score = 0;
        all().forEach(p => {
            const have = new Set(words(`${p.name} ${p.title}`));
            const s = want.filter(w => have.has(w)).length;
            if (s > score) { best = p; score = s; }
        });
        IOS.go('projects', best ? [best.id] : []);
    };
})();
