/* ==========================================================================
   App Store.app — every project, with a real product page
   --------------------------------------------------------------------------
   Rendered from the Finder filesystem's Projects folder plus the search
   corpus (one source of truth), instead of ten hand-written cards. The old
   cards carried invented star ratings ("★★★★★ 5.0", "4.9") — fake social
   proof on a portfolio is a liability, so cards now show what's true: live
   or open source, and the real stack.
   ========================================================================== */

let appStoreCategory = 'all';
let appStoreQuery = '';

// Project data shaping lives in js/data/filesystem.js (getPortfolioProjects),
// shared with the iPhone version.
const appStoreProjects = () => getPortfolioProjects();

function renderAppStore() {
    const grid = document.getElementById('appstore-grid-container');
    const hero = document.getElementById('appstore-hero');
    if (!grid) return;
    const all = appStoreProjects();
    const q = appStoreQuery.toLowerCase().trim();
    const list = all.filter(p => (appStoreCategory === 'all' || p.cats.includes(appStoreCategory)) && (!q || p.search.includes(q)));

    if (hero) {
        const featured = all.find(p => p.live) || all[0];
        hero.style.display = (appStoreCategory === 'all' && !q && featured) ? '' : 'none';
        if (featured) {
            hero.innerHTML = `
                <div class="hero-tag">FEATURED · LIVE NOW</div>
                <div class="hero-row">
                    <img class="hero-icon" src="${escapeHtml(featured.icon)}" alt="">
                    <div>
                        <h2>${escapeHtml(featured.title)}</h2>
                        <p>${escapeHtml(featured.blurb)}</p>
                    </div>
                </div>
                <div class="hero-action-row">
                    <button type="button" class="appstore-get-btn hero-btn" onclick="event.stopPropagation(); openExternal('${escapeAttr(featured.link)}')">OPEN</button>
                    <span class="app-rating">${featured.live ? 'Deployed · try it in your browser' : 'Open source'}</span>
                </div>`;
            hero.onclick = () => openAppStoreProduct(featured.id);
        }
    }

    const empty = document.getElementById('appstore-empty-state');
    if (empty) empty.style.display = list.length ? 'none' : 'block';
    const title = document.getElementById('appstore-section-title');
    const category = getProjectCategories().find(c => c.id === appStoreCategory);
    if (title) title.textContent = q ? `Results for “${appStoreQuery}”` : (category ? category.label : `Everything ${window.PROFILE_DATA.first} has shipped`);

    grid.innerHTML = list.map(p => `
        <div class="app-card" role="button" tabindex="0" data-project="${escapeHtml(p.id)}"
             onclick="openAppStoreProduct('${escapeAttr(p.id)}')" onkeydown="if(event.key==='Enter'){openAppStoreProduct('${escapeAttr(p.id)}')}">
            <img class="app-card-icon-img" src="${escapeHtml(p.icon)}" alt="">
            <div class="app-card-details">
                <h3>${escapeHtml(p.name)}</h3>
                <div class="app-category">${escapeHtml(p.subtitle)}</div>
                <p class="app-desc">${escapeHtml(p.blurb)}</p>
            </div>
            <button type="button" class="appstore-get-btn ${p.live ? 'live' : ''}" onclick="event.stopPropagation(); openExternal('${escapeAttr(p.link)}')">${p.live ? 'OPEN' : 'VIEW'}</button>
        </div>`).join('');
}

function openAppStoreProduct(id) {
    const p = appStoreProjects().find(x => x.id === id);
    const page = document.getElementById('appstore-product');
    const feed = document.getElementById('appstore-feed-main');
    if (!p || !page || !feed) return;
    let host = '';
    try { host = new URL(p.link).host.replace(/^www\./, ''); } catch (e) { host = ''; }
    page.innerHTML = `
        <button type="button" class="appstore-back" onclick="closeAppStoreProduct()"><i class="fas fa-chevron-left"></i> Back</button>
        <header class="product-header">
            <img src="${escapeHtml(p.icon)}" alt="">
            <div>
                <h2>${escapeHtml(p.title)}</h2>
                <div class="product-sub">${escapeHtml(p.subtitle)}</div>
                <div class="product-actions">
                    <button type="button" class="appstore-get-btn ${p.live ? 'live' : ''}" onclick="openExternal('${escapeAttr(p.link)}')">${p.live ? 'OPEN APP' : 'VIEW SOURCE'}</button>
                    <button type="button" class="product-share" onclick="copyTextToClipboard('${escapeAttr(p.link)}', 'Link copied')" aria-label="Copy link"><i class="fas fa-link"></i></button>
                </div>
            </div>
        </header>
        <div class="product-facts">
            <div><span>Status</span><strong>${p.live ? 'Live' : 'Open source'}</strong></div>
            <div><span>Hosted on</span><strong>${escapeHtml(host || '—')}</strong></div>
            <div><span>Updated</span><strong>${escapeHtml(p.date || '—')}</strong></div>
        </div>
        <section class="product-section">
            <h3>About this project</h3>
            <p>${escapeHtml(p.desc)}</p>
        </section>
        ${p.stack.length ? `<section class="product-section"><h3>Built with</h3><div class="product-tags">${p.stack.map(t => `<span>${escapeHtml(t)}</span>`).join('')}</div></section>` : ''}
        <section class="product-section">
            <h3>Ask about it</h3>
            <button type="button" class="app-pill-btn" onclick="openIris(); setTimeout(() => { const i = document.getElementById('iris-input'); if (i) { i.value = 'Tell me about ${escapeAttr(p.name)}'; sendIrisMessage(); } }, 300);"><i class="fas fa-wand-magic-sparkles"></i> Ask Iris about ${escapeHtml(p.name)}</button>
        </section>`;
    feed.style.display = 'none';
    page.style.display = 'block';
    page.scrollTop = 0;
    const scroller = document.querySelector('#appstore-window .appstore-feed');
    if (scroller) scroller.scrollTop = 0;
}

function closeAppStoreProduct() {
    const page = document.getElementById('appstore-product');
    const feed = document.getElementById('appstore-feed-main');
    if (page) page.style.display = 'none';
    if (feed) feed.style.display = '';
}

function filterAppStoreCategory(category, element) {
    const row = element || document.querySelector(`.appstore-sidebar .sidebar-item[data-cat="${category}"]`);
    document.querySelectorAll('.appstore-sidebar .sidebar-item').forEach(item => item.classList.toggle('active', item === row));
    appStoreCategory = category;
    closeAppStoreProduct();
    renderAppStore();
}

function filterAppStoreProjects(query) {
    appStoreQuery = query || '';
    closeAppStoreProduct();
    renderAppStore();
}

/** Launchpad / Spotlight: jump straight to a project's product page. */
window.openProjectDetails = function(name) {
    openWindow('appstore-window');
    // Best word overlap ("Image Search" ↔ "Semantic Image Search Engine").
    const words = s => String(s || '').toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 1);
    const want = words(name);
    let best = null, bestScore = 0;
    appStoreProjects().forEach(x => {
        const have = new Set(words(`${x.name} ${x.title}`));
        const score = want.filter(w => have.has(w)).length;
        if (score > bestScore) { best = x; bestScore = score; }
    });
    if (best && bestScore >= Math.min(2, want.length)) openAppStoreProduct(best.id);
    else closeAppStoreProduct();
};

/** Sidebar rows for the categories the projects actually fall into. */
function renderAppStoreSidebar() {
    const sidebar = document.querySelector('.appstore-sidebar');
    if (!sidebar) return;
    sidebar.querySelectorAll('.sidebar-item:not([data-cat="all"])').forEach(r => r.remove());
    sidebar.insertAdjacentHTML('beforeend', getProjectCategories().map(c =>
        `<div class="sidebar-item" data-cat="${escapeHtml(c.id)}" onclick="filterAppStoreCategory('${escapeAttr(c.id)}', this)"><i class="${escapeHtml(c.icon)}"></i> ${escapeHtml(c.label)}</div>`).join(''));
}

document.addEventListener('DOMContentLoaded', () => { renderAppStoreSidebar(); setTimeout(renderAppStore, 150); });
