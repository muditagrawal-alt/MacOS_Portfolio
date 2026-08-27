/* ==========================================================================
   Notification Centre — live social/activity feed
   --------------------------------------------------------------------------
   Pulls the newest items from your platforms so the portfolio updates itself.
   Push a new repo and it shows up here on the next visitor's load; you never
   touch the code.

   WHAT CAN AND CANNOT WORK FROM THE BROWSER — verified, not assumed:

     GitHub    ✅ direct. api.github.com sends CORS headers and needs no key.
                  60 requests/hour per visitor IP unauthenticated, which is
                  far more than one page load costs. Zero backend required.

     Medium    ⚠️  RSS only, and medium.com sends no CORS header — a direct
     Substack     fetch fails. Routed through APP_CONFIG.FEEDS_ENDPOINT
                  (api/feeds.js) which fetches server-side and returns JSON.

     LinkedIn  ❌ no public API. Their v2 API needs OAuth plus Partner
                  Program approval, and personal post history isn't exposed
                  even then. There is no honest way to auto-pull it — the
                  LinkedIn card below links to the profile instead of
                  pretending to show live posts.

   Everything degrades independently: a dead feed hides its own section
   rather than emptying the panel.
   ========================================================================== */

const NOTIF_CACHE_KEY = 'mac-notif-cache';
const NOTIF_CACHE_TTL_MS = 15 * 60 * 1000;   // 15 min — well inside GitHub's budget

const GITHUB_USER = 'muditagrawal-alt';

let notifOpen = false;
let notifLoaded = false;

/* ── Panel ─────────────────────────────────────────────────────────────── */

function ensureNotificationCenter() {
    if (document.getElementById('notification-center')) return;

    const el = document.createElement('div');
    el.id = 'notification-center';
    el.className = 'notif-center';
    el.setAttribute('role', 'complementary');
    el.setAttribute('aria-label', 'Notification Centre');
    el.innerHTML = `
        <div class="notif-header">
            <span class="notif-title">Notification Centre</span>
            <button type="button" class="notif-refresh" id="notif-refresh"
                    aria-label="Refresh feeds" title="Refresh">
                <i class="fas fa-rotate"></i>
            </button>
        </div>
        <div class="notif-scroll" id="notif-scroll">
            <div class="notif-loading">Loading activity&hellip;</div>
        </div>
    `;
    document.body.appendChild(el);

    document.getElementById('notif-refresh').addEventListener('click', () => {
        try { sessionStorage.removeItem(NOTIF_CACHE_KEY); } catch (e) {}
        notifLoaded = false;
        loadNotifications(true);
    });
}

function toggleNotificationCenter() {
    notifOpen ? closeNotificationCenter() : openNotificationCenter();
}

function openNotificationCenter() {
    ensureNotificationCenter();
    const el = document.getElementById('notification-center');
    el.classList.add('open');
    notifOpen = true;
    loadNotifications(false);
}

function closeNotificationCenter() {
    const el = document.getElementById('notification-center');
    if (el) el.classList.remove('open');
    notifOpen = false;
}

/* ── Data ──────────────────────────────────────────────────────────────── */

function readNotifCache() {
    try {
        const raw = sessionStorage.getItem(NOTIF_CACHE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (Date.now() - data.timestamp > NOTIF_CACHE_TTL_MS) return null;
        return data.sections;
    } catch (e) { return null; }
}

function writeNotifCache(sections) {
    try {
        sessionStorage.setItem(NOTIF_CACHE_KEY, JSON.stringify({ sections, timestamp: Date.now() }));
    } catch (e) {}
}

async function loadNotifications(force) {
    if (notifLoaded && !force) return;

    const cached = !force && readNotifCache();
    if (cached) { renderNotifications(cached); notifLoaded = true; return; }

    const scroll = document.getElementById('notif-scroll');
    if (scroll) scroll.innerHTML = '<div class="notif-loading">Loading activity&hellip;</div>';

    // Independent so one failing source can't blank the others.
    const [github, articles] = await Promise.all([
        fetchGitHubActivity().catch(() => null),
        fetchArticleFeeds().catch(() => null)
    ]);

    const sections = [];
    if (github && github.length) sections.push({ id: 'github', title: 'GitHub', items: github });
    if (articles && articles.length) sections.push({ id: 'writing', title: 'Writing', items: articles });

    writeNotifCache(sections);
    renderNotifications(sections);
    notifLoaded = true;
}

/**
 * Newest public repos, most-recently-pushed first.
 * Forks and archived repos are filtered out — they're noise, not activity.
 */
async function fetchGitHubActivity() {
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
            meta: [r.language, r.stargazers_count ? `★ ${r.stargazers_count}` : null]
                    .filter(Boolean).join(' · '),
            time: r.pushed_at,
            url: r.html_url
        }));
}

/**
 * Medium + Substack via the serverless RSS proxy. Silently yields nothing
 * when no endpoint is configured, so the panel still works pre-deploy.
 */
async function fetchArticleFeeds() {
    const endpoint = window.APP_CONFIG && window.APP_CONFIG.FEEDS_ENDPOINT;
    if (!endpoint) return [];

    const res = await fetch(endpoint);
    if (!res.ok) throw new Error('feeds ' + res.status);
    const data = await res.json();

    return (data.items || []).slice(0, 5).map(item => ({
        icon: item.source === 'substack'
            ? 'assets/icons/social-substack.svg'
            : 'assets/icons/social-medium.svg',
        app: item.source === 'substack' ? 'Substack' : 'Medium',
        title: item.title,
        body: item.summary || '',
        meta: '',
        time: item.published,
        url: item.link
    }));
}

/* ── Render ────────────────────────────────────────────────────────────── */

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

function renderNotifications(sections) {
    const scroll = document.getElementById('notif-scroll');
    if (!scroll) return;

    if (!sections || !sections.length) {
        scroll.innerHTML = `
            <div class="notif-empty">
                <i class="fas fa-cloud-slash"></i>
                <div>No activity to show</div>
                <p>Live feeds couldn't be reached right now.</p>
            </div>`;
        return;
    }

    let html = '';
    sections.forEach(section => {
        html += `<div class="notif-section-title">${escapeHtml(section.title)}</div>`;
        section.items.forEach(item => {
            html += `
                <a class="notif-card" href="${escapeHtml(safeUrl(item.url))}"
                   target="_blank" rel="noopener noreferrer">
                    <img class="notif-card-icon" src="${escapeHtml(item.icon)}" alt="">
                    <div class="notif-card-body">
                        <div class="notif-card-top">
                            <span class="notif-card-app">${escapeHtml(item.app)}</span>
                            <span class="notif-card-time">${escapeHtml(relativeTime(item.time))}</span>
                        </div>
                        <div class="notif-card-title">${escapeHtml(item.title)}</div>
                        <div class="notif-card-text">${escapeHtml(item.body)}</div>
                        ${item.meta ? `<div class="notif-card-meta">${escapeHtml(item.meta)}</div>` : ''}
                    </div>
                </a>`;
        });
    });

    // LinkedIn can't be fetched (see header note) — link out instead of faking it.
    html += `
        <div class="notif-section-title">Elsewhere</div>
        <a class="notif-card" href="https://www.linkedin.com/in/mudit-agrawal-167610318"
           target="_blank" rel="noopener noreferrer">
            <img class="notif-card-icon" src="assets/icons/social-linkedin.svg" alt="">
            <div class="notif-card-body">
                <div class="notif-card-top"><span class="notif-card-app">LinkedIn</span></div>
                <div class="notif-card-title">View profile</div>
                <div class="notif-card-text">Experience, recommendations and updates.</div>
            </div>
        </a>`;

    scroll.innerHTML = html;
}

/* Close when clicking outside the panel. */
document.addEventListener('click', (e) => {
    if (!notifOpen) return;
    if (!(e.target instanceof Element)) return;
    if (e.target.closest('#notification-center')) return;
    if (e.target.closest('#clock')) return;      // the toggle handles itself
    closeNotificationCenter();
});
