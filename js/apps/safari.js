/* ==========================================================================
   Safari.app (macOS Browser) Controller:
   Tabs Engine, Multi-Engine Web Search (Portfolio + Wiki), YouTube Embed Player & Favorites
   ========================================================================== */

const safariShortcuts = {
    'github': {
        title: 'GitHub — @muditagrawal-alt',
        url: 'https://github.com/muditagrawal-alt',
        icon: 'fab fa-github',
        domain: 'github.com/muditagrawal-alt',
        category: 'Code & Open Source',
        desc: 'Explore 8+ production & research AI/ML repositories authored by Mudit Agrawal including OmniDoc, Sliver.Ai, and Project S.W.O.R.D.',
        pinnedRepos: [
            { name: 'OmniDoc', desc: 'Multimodal RAG Document Intelligence System with Mistral-7B & BLIP.', stars: 'Featured', lang: 'Python' },
            { name: 'Sliver-Smart-Video-Clipping-Tool', desc: 'AI highlight clipping pipeline using YOLOv8 & YOLO11.', stars: 'Featured', lang: 'Python' },
            { name: 'Project-S.W.O.R.D', desc: 'Surveillance for Weapon Observation with Real-Time Deep Learning.', stars: 'Defense', lang: 'Python' },
            { name: 'Helix-Compiler', desc: 'C-based parsing, AST generation and systems compiler.', stars: 'Systems', lang: 'C' }
        ]
    },
    'huggingface': {
        title: 'Hugging Face — @muditagrawal03',
        url: 'https://huggingface.co/muditagrawal03',
        icon: 'fas fa-robot',
        domain: 'huggingface.co/muditagrawal03',
        category: 'AI Models & Spaces',
        desc: 'Model checkpoints, pipelines, and interactive spaces for Speech Synthesis, Multimodal VQA, and LLM fine-tunes.',
        pinnedRepos: [
            { name: 'Speech-Synthesis-Hub', desc: 'Coqui XTTS-v2 and Whisper pipeline experiments.', stars: 'Models', lang: 'PyTorch' },
            { name: 'Multimodal-VQA-Space', desc: 'Visual document reasoning with BLIP & Mistral.', stars: 'Spaces', lang: 'Gradio' }
        ]
    },
    'linkedin': {
        title: `LinkedIn — ${window.PROFILE_DATA?.name || 'Mudit Agrawal'}`,
        url: window.PROFILE_DATA?.contact?.linkedin || 'https://www.linkedin.com/in/mudit-agrawal-167610318',
        icon: 'fab fa-linkedin',
        domain: (window.PROFILE_DATA?.contact?.linkedin || 'linkedin.com/in/mudit-agrawal-167610318').replace(/^https?:\/\//, ''),
        category: 'Professional Network',
        desc: `${window.PROFILE_DATA?.bio || 'Computer Science (AI/ML) Undergraduate at IILM University.'}`,
        pinnedRepos: (window.PROFILE_DATA?.experience || []).map(e => ({
            name: e.role,
            desc: `${e.org} (${e.dates})`,
            stars: 'Experience',
            lang: 'AI/ML'
        }))
    },
    'substack': {
        title: 'Substack — @standardissuemudit',
        url: 'https://substack.com/@standardissuemudit',
        icon: 'fas fa-bookmark',
        iconSvg: '<svg width="28" height="28" viewBox="0 0 24 24" fill="#ffffff"><path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/></svg>',
        domain: 'substack.com/@standardissuemudit',
        category: 'Tech & AI Newsletter',
        desc: 'Deep dives on multimodal RAG architectures, computer vision benchmarks, and AI engineering notes.',
        pinnedRepos: [
            { name: 'Building Multimodal RAG with Mistral-7B & BLIP', desc: 'Full architecture walkthrough from PDF chunking to grounded synthesis.', stars: 'Article', lang: 'RAG' },
            { name: 'Real-Time Video Analytics with YOLOv8 & YOLO11', desc: 'Sub-second highlight generation with multi-cue tracking.', stars: 'Article', lang: 'Vision' }
        ]
    },
    'medium': {
        title: 'Medium — @muditagrawal03',
        url: 'https://medium.com/@muditagrawal03',
        icon: 'fab fa-medium',
        domain: 'medium.com/@muditagrawal03',
        category: 'Articles & Tutorials',
        desc: 'Thought leadership articles on practical AI engineering, avoiding hallucination traps, and real-world system resilience.',
        pinnedRepos: [
            { name: 'Evaluating LLMs for Mission-Critical Defense Systems', desc: 'Naval R&D insights and reliability testing.', stars: 'Article', lang: 'Safety' },
            { name: 'Beyond Theory: What College Doesn’t Teach About Machine Learning', desc: 'Practical lessons from deployment bottlenecks.', stars: 'Guide', lang: 'Career' }
        ]
    },
    'instagram': {
        title: 'Instagram — @muditagrawal_',
        url: 'https://www.instagram.com/muditagrawal_/',
        icon: 'fab fa-instagram',
        domain: 'instagram.com/muditagrawal_',
        category: 'Social & Behind the Scenes',
        desc: 'Campus life at IILM University, hackathon sprints, photography, robotics lab snapshots, and tech journey moments.',
        pinnedRepos: [
            { name: 'Hackathon Highlights', desc: 'Late night debugging, caffeine fuel, and demo pitches.', stars: 'Posts', lang: 'Photos' },
            { name: 'Campus & Navy Life', desc: 'Naval base memories and university campus perspectives.', stars: 'Stories', lang: 'Highlights' }
        ]
    },
    'x': {
        title: 'X (Twitter) — @muditag52751860',
        url: 'https://x.com/muditag52751860',
        icon: 'fab fa-x-twitter',
        domain: 'x.com/muditag52751860',
        category: 'Tech Discussions & Updates',
        desc: 'Sharing daily thoughts on open-source AI weights, research papers from arXiv, and builder updates.',
        pinnedRepos: [
            { name: 'Paper Takeaways', desc: 'Bite-sized threads breaking down new CV and LLM releases.', stars: 'Threads', lang: 'AI' },
            { name: 'Build In Public', desc: 'Weekly progress snapshots on OmniDoc and Sliver.Ai.', stars: 'Updates', lang: 'Dev' }
        ]
    },
    'leetcode': {
        title: 'LeetCode — @muditagrawal03',
        url: 'https://leetcode.com/u/muditagrawal03/',
        icon: 'fas fa-code',
        iconSvg: '<svg width="28" height="28" viewBox="0 0 24 24" fill="#ffffff"><path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .666-1.795l3.86-4.133 5.304-5.694a1.376 1.376 0 0 0-.96-2.352zm3.896 9.615c-.76 0-1.378.618-1.378 1.378v4.973c0 .76.618 1.378 1.378 1.378h5.243c.76 0 1.378-.618 1.378-1.378v-4.973c0-.76-.618-1.378-1.378-1.378h-5.243z"/></svg>',
        domain: 'leetcode.com/u/muditagrawal03',
        category: 'Algorithms & Data Structures',
        desc: 'Problem solving across Trees, Dynamic Programming, Graphs, and Systems Optimization in C and Python.',
        pinnedRepos: [
            { name: 'Data Structures & Algorithms', desc: '200+ problems solved across arrays, DP, and graphs.', stars: 'Profile', lang: 'Algorithms' },
            { name: 'Contest Rankings', desc: 'Consistent competitive programming participant.', stars: 'Contests', lang: 'Problem Solving' }
        ]
    }
};

function stopSafariMedia() {
    const renderArea = document.getElementById('safari-page-render-area');
    if (renderArea) {
        const iframes = renderArea.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            try {
                iframe.src = 'about:blank';
                iframe.remove();
            } catch(e) {}
        });
    }
}

let activeYouTubeCategory = 'Trending';

let safariTabs = [
    {
        id: 1,
        title: 'Start Page',
        url: '',
        type: 'start',
        history: ['start'],
        historyIndex: 0
    }
];

let activeSafariTabId = 1;

function renderSafariTabs() {
    const container = document.getElementById('safari-tab-bar-container');
    if (!container) return;

    container.innerHTML = '';
    safariTabs.forEach(tab => {
        const item = document.createElement('div');
        item.className = `safari-tab-item ${tab.id === activeSafariTabId ? 'active' : ''}`;
        item.onclick = function(e) {
            if (!e.target.classList.contains('safari-tab-close')) {
                switchSafariTab(tab.id);
            }
        };

        let iconMarkup = '';
        if (tab.type === 'start') {
            iconMarkup = '<i class="fas fa-compass" style="font-size:12px;opacity:0.85;"></i>';
        } else if (tab.type === 'youtube') {
            iconMarkup = '<i class="fab fa-youtube" style="font-size:12px;color:#ff0000;"></i>';
        } else if (tab.shortcutKey && safariShortcuts[tab.shortcutKey]?.iconSvg) {
            iconMarkup = safariShortcuts[tab.shortcutKey].iconSvg.replace('width="28" height="28"', 'width="13" height="13"');
        } else {
            const iconClass = tab.icon || 'fas fa-globe';
            iconMarkup = `<i class="${iconClass}" style="font-size:12px;opacity:0.85;"></i>`;
        }

        item.innerHTML = `
            ${iconMarkup}
            <span class="safari-tab-title">${escapeHtml(tab.title)}</span>
            <span class="safari-tab-close" onclick="closeSafariTab(${tab.id}, event)">&times;</span>
        `;
        container.appendChild(item);
    });

    const currentTab = safariTabs.find(t => t.id === activeSafariTabId);
    const backBtn = document.getElementById('safari-btn-back');
    const fwdBtn = document.getElementById('safari-btn-forward');
    if (currentTab && backBtn && fwdBtn) {
        backBtn.disabled = currentTab.historyIndex <= 0;
        fwdBtn.disabled = currentTab.historyIndex >= currentTab.history.length - 1;
    }
}

function switchSafariTab(tabId) {
    const prevTab = safariTabs.find(t => t.id === activeSafariTabId);
    if (prevTab && prevTab.type === 'youtube' && prevTab.ytView === 'watch' && tabId !== activeSafariTabId) {
        stopSafariMedia();
    }

    activeSafariTabId = tabId;
    const tab = safariTabs.find(t => t.id === tabId);
    if (!tab) return;

    renderSafariTabs();

    const urlInput = document.getElementById('safari-url-input');
    const startView = document.getElementById('safari-start-page-view');
    const pageView = document.getElementById('safari-web-page-view');

    if (tab.type === 'start') {
        stopSafariMedia();
        if (urlInput) urlInput.value = '';
        if (startView) {
            startView.style.display = 'block';
            startView.classList.remove('hidden');
        }
        if (pageView) {
            pageView.style.display = 'none';
            pageView.classList.add('hidden');
        }
    } else {
        if (urlInput) urlInput.value = tab.url;
        if (startView) {
            startView.style.display = 'none';
            startView.classList.add('hidden');
        }
        if (pageView) {
            pageView.style.display = 'flex';
            pageView.classList.remove('hidden');
        }
        renderSafariWebPage(tab);
    }
}

let safariTabSeq = 1;

function createSafariTab(url, title, type = 'start', icon = 'fas fa-compass') {
    const newId = ++safariTabSeq;
    const newTab = {
        id: newId,
        title: title || 'Start Page',
        url: url || '',
        type: type,
        icon: icon,
        history: [type === 'start' ? 'start' : url],
        historyIndex: 0
    };
    safariTabs.push(newTab);
    switchSafariTab(newId);
}

function closeSafariTab(tabId, event) {
    if (event) event.stopPropagation();

    if (safariTabs.length === 1) {
        const firstTab = safariTabs[0];
        firstTab.type = 'start';
        firstTab.title = 'Start Page';
        firstTab.url = '';
        firstTab.shortcutKey = null;
        firstTab.history = ['start'];
        firstTab.historyIndex = 0;
        switchSafariTab(firstTab.id);
        return;
    }

    const tabIndex = safariTabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    const closingActive = (tabId === activeSafariTabId);
    safariTabs.splice(tabIndex, 1);

    if (closingActive) {
        const nextActive = safariTabs[Math.max(0, tabIndex - 1)];
        switchSafariTab(nextActive.id);
    } else {
        renderSafariTabs();
    }
}

function loadSafariDestination(tab, dest) {
    // Reset per-destination state up front. Previously shortcutKey survived a
    // navigation away from a shortcut tab, so a search kept the old site's
    // favicon in the tab strip.
    tab.shortcutKey = null;
    tab.searchQuery = null;
    tab.ytView = null;
    tab.ytVideoId = null;
    tab.ytQuery = null;

    if (dest === 'start') {
        tab.type = 'start';
        tab.title = 'Start Page';
        tab.url = '';
    } else if (dest.startsWith('shortcut:')) {
        const key = dest.replace('shortcut:', '');
        const sc = safariShortcuts[key];
        if (sc) {
            tab.type = 'shortcut';
            tab.shortcutKey = key;
            tab.title = sc.title;
            tab.url = sc.url;
            tab.icon = sc.icon;
        }
    } else if (dest.startsWith('web:')) {
        const url = dest.slice(4);
        const key = shortcutForUrl(url);
        if (key) {
            const sc = safariShortcuts[key];
            tab.type = 'shortcut';
            tab.shortcutKey = key;
            tab.title = sc.title;
            tab.url = sc.url;
            tab.icon = sc.icon;
        } else {
            let host = url;
            try { host = new URL(url).host.replace(/^www\./, ''); } catch (e) { /* keep raw */ }
            tab.type = 'web';
            tab.title = host;
            tab.url = url;
            tab.icon = 'fas fa-globe';
        }
    } else if (dest.startsWith('ddg:')) {
        const q = dest.replace('ddg:', '');
        tab.type = 'ddg_search';
        tab.searchQuery = q;
        tab.title = `${q} - Safari Search`;
        tab.url = `https://search.safari.apple/${encodeURIComponent(q)}`;
        tab.icon = 'fas fa-search';
    } else if (dest === 'youtube') {
        tab.type = 'youtube';
        tab.ytView = 'feed';
        tab.ytVideoId = null;
        tab.ytQuery = null;
        tab.title = 'YouTube';
        tab.url = 'https://www.youtube.com';
    } else if (dest.startsWith('yt_search:')) {
        const q = dest.replace('yt_search:', '');
        tab.type = 'youtube';
        tab.ytView = 'feed';
        tab.ytVideoId = null;
        tab.ytQuery = q;
        tab.title = `${q} - YouTube`;
        tab.url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
    } else if (dest.startsWith('yt_watch:')) {
        const vid = dest.replace('yt_watch:', '');
        tab.type = 'youtube';
        tab.ytView = 'watch';
        tab.ytVideoId = vid;
        tab.ytQuery = null;
        tab.url = `https://www.youtube.com/watch?v=${vid}`;
        tab.title = 'YouTube Video';
    }
}

function pushSafariHistory(tab, dest) {
    if (tab.historyIndex < tab.history.length - 1) {
        tab.history = tab.history.slice(0, tab.historyIndex + 1);
    }
    tab.history.push(dest);
    tab.historyIndex = tab.history.length - 1;
}

function openSafariStartPage() {
    const currentTab = safariTabs.find(t => t.id === activeSafariTabId);
    if (currentTab) {
        loadSafariDestination(currentTab, 'start');
        pushSafariHistory(currentTab, 'start');
        switchSafariTab(currentTab.id);
    }
}

function openSafariShortcut(key) {
    const sc = safariShortcuts[key];
    if (!sc) return;
    const currentTab = safariTabs.find(t => t.id === activeSafariTabId);
    if (currentTab) {
        loadSafariDestination(currentTab, `shortcut:${key}`);
        pushSafariHistory(currentTab, `shortcut:${key}`);
        switchSafariTab(currentTab.id);
    }
}

function handleSafariUrlKey(e) {
    if (e.key === 'Enter') {
        const input = document.getElementById('safari-url-input');
        const val = (input.value || '').trim();
        if (!val) return;
        navigateSafariTo(val);
    }
}

function navigateSafariTo(queryOrUrl) {
    const currentTab = safariTabs.find(t => t.id === activeSafariTabId);
    if (!currentTab) return;

    if (queryOrUrl.includes('youtube.com/watch?v=') || queryOrUrl.includes('youtu.be/')) {
        const match = queryOrUrl.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
        if (match && match[1]) {
            currentTab.type = 'youtube';
            currentTab.ytView = 'watch';
            currentTab.ytVideoId = match[1];
            currentTab.ytChannel = 'YouTube';
            currentTab.title = 'YouTube Video';
            currentTab.url = `https://www.youtube.com/watch?v=${match[1]}`;
            pushSafariHistory(currentTab, `yt_watch:${match[1]}`);
            switchSafariTab(currentTab.id);
            return;
        }
    }

    if (queryOrUrl.toLowerCase() === 'youtube' || queryOrUrl.toLowerCase() === 'youtube.com' || queryOrUrl.toLowerCase() === 'www.youtube.com') {
        currentTab.type = 'youtube';
        currentTab.ytView = 'feed';
        currentTab.ytVideoId = null;
        currentTab.ytQuery = null;
        currentTab.title = 'YouTube';
        currentTab.url = 'https://www.youtube.com';
        pushSafariHistory(currentTab, 'youtube');
        switchSafariTab(currentTab.id);
        return;
    }

    // A typed address navigates; anything else searches. (Every input used
    // to be treated as a search query, including "github.com".)
    const url = normaliseTypedUrl(queryOrUrl);
    if (url) {
        loadSafariDestination(currentTab, `web:${url}`);
        pushSafariHistory(currentTab, `web:${url}`);
        switchSafariTab(currentTab.id);
        return;
    }

    loadSafariDestination(currentTab, `ddg:${queryOrUrl}`);
    pushSafariHistory(currentTab, `ddg:${queryOrUrl}`);
    switchSafariTab(currentTab.id);
}

/** "github.com/x" or "https://…" → absolute https URL; a search phrase → null. */
function normaliseTypedUrl(input) {
    const raw = String(input || '').trim();
    if (!raw || /\s/.test(raw)) return null;
    if (/^https?:\/\//i.test(raw)) return safeUrl(raw) === '#' ? null : raw;
    if (/^(localhost|[a-z0-9-]+(\.[a-z0-9-]+)+)(:\d+)?(\/\S*)?$/i.test(raw) && /\.[a-z]{2,}(:\d+)?(\/|$)/i.test(raw)) {
        return 'https://' + raw;
    }
    return null;
}

/** If a URL is one of the portfolio's own profiles, show its rich page. */
function shortcutForUrl(url) {
    const norm = u => u.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/+$/, '').toLowerCase();
    const target = norm(url);
    return Object.keys(safariShortcuts).find(k => norm(safariShortcuts[k].url) === target) || null;
}

// Portfolio corpus + search now live in js/data/corpus.js (shared with
// Spotlight and Iris). handlePortfolioMatchClick delegates to runCorpusAction.
function handlePortfolioMatchClick(action, url) {
    runCorpusAction(action, url);
}

const wikiSearchCache = new Map();
const WIKI_CACHE_TTL_MS = 10 * 60 * 1000;

function getCachedWikiResult(q) {
  if (!q) return null;
  const hit = wikiSearchCache.get(q.toLowerCase().trim());
  if (hit && (Date.now() - hit.timestamp) < WIKI_CACHE_TTL_MS) return hit;
  return null;
}

function setCachedWikiResult(q, searchArticles, summaryData, totalHits) {
  if (!q) return;
  wikiSearchCache.set(q.toLowerCase().trim(), { searchArticles, summaryData, totalHits, timestamp: Date.now() });
}

/** "From this portfolio" cards — shared by the cached and live render paths. */
function buildPortfolioMatchesHtml(portfolioMatches) {
    if (!portfolioMatches || portfolioMatches.length === 0) return '';
    return `
        <div class="safari-portfolio-match-section">
            <div class="safari-portfolio-match-header">
                <i class="fas fa-wand-magic-sparkles"></i>
                <span>From this portfolio</span>
            </div>
            <div class="safari-portfolio-cards">
                ${portfolioMatches.map(item => `
                    <div class="safari-portfolio-card" role="button" tabindex="0" onclick="handlePortfolioMatchClick('${escapeAttr(item.action || '')}', '${escapeAttr(item.url || '')}')">
                        <div class="safari-portfolio-card-top">
                            <span class="safari-portfolio-badge">${escapeHtml(item.type)}</span>
                            ${item.url ? `<a href="${escapeHtml(safeUrl(item.url))}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" class="safari-portfolio-link-icon" title="Open Link"><i class="fas fa-external-link-alt"></i></a>` : `<span class="safari-portfolio-link-icon" title="View in Finder"><i class="fas fa-folder-open"></i></span>`}
                        </div>
                        <div class="safari-portfolio-card-title">${escapeHtml(item.title)}</div>
                        <p class="safari-portfolio-card-text">${escapeHtml(item.text)}</p>
                    </div>
                `).join('')}
            </div>
        </div>`;
}

/** Wikipedia snippets arrive as HTML with <span class="searchmatch">; keep only that emphasis. */
function cleanWikiSnippet(snippet) {
    return escapeHtml(String(snippet || '').replace(/<span class="searchmatch">(.*?)<\/span>/g, '\u0001$1\u0002').replace(/<[^>]+>/g, ''))
        .replace(/\u0001/g, '<strong>').replace(/\u0002/g, '</strong>');
}

function buildWikiResultHtml(art) {
    const artUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(art.title.replace(/\s+/g, '_'))}`;
    return `
        <div class="safari-result-item">
            <div class="safari-result-source-row">
                <img src="https://www.google.com/s2/favicons?domain=en.wikipedia.org&sz=32" class="safari-result-favicon" alt="" loading="lazy">
                <div class="safari-result-source-info">
                    <span class="safari-result-site-name">Wikipedia</span>
                    <span class="safari-result-url">${escapeHtml(artUrl)}</span>
                </div>
            </div>
            <a href="${escapeHtml(artUrl)}" target="_blank" rel="noopener noreferrer" class="safari-result-title">${escapeHtml(art.title)}</a>
            <p class="safari-result-snippet">${cleanWikiSnippet(art.snippet)}…</p>
        </div>`;
}

/* Every value interpolated below is escaped. The query used to be written
   raw into innerHTML (and into an onclick attribute), so typing
   <img src=x onerror=…> into the address bar executed it. */
function buildSearchResultsHtml(q, searchArticles, summaryData, portfolioMatches) {
    const qh = escapeHtml(q);
    let organicHtml = buildPortfolioMatchesHtml(portfolioMatches);

    searchArticles.slice(0, 2).forEach(art => { organicHtml += buildWikiResultHtml(art); });

    organicHtml += `
        <div class="safari-video-spotlight" role="button" tabindex="0" onclick="searchYouTube('${escapeAttr(q)}')" style="cursor:pointer;">
            <div class="safari-video-spotlight-title"><i class="fab fa-youtube" style="color:#ff0000;"></i> Videos for “${qh}”</div>
            <div style="font-size:12.5px;color:#d1d1d6;margin-bottom:10px;">Find talks, tutorials and demos about <strong>${qh}</strong> on YouTube.</div>
            <button type="button" class="app-pill-btn" style="color:#fff;background:rgba(255,0,0,0.2);border:1px solid rgba(255,0,0,0.4);"><i class="fab fa-youtube" style="color:#ff4444;"></i> Search YouTube</button>
        </div>`;

    if (summaryData && summaryData.extract) {
        organicHtml += `
            <div class="safari-faq-card">
                <div class="safari-faq-header">Quick answer</div>
                <div class="safari-faq-item open">
                    <div class="safari-faq-question"><span>What is ${escapeHtml(summaryData.title || q)}?</span></div>
                    <div class="safari-faq-answer">${escapeHtml(summaryData.extract)}</div>
                </div>
            </div>`;
    }

    searchArticles.slice(2, 6).forEach(art => { organicHtml += buildWikiResultHtml(art); });

    if (searchArticles.length === 0 && (!portfolioMatches || portfolioMatches.length === 0)) {
        organicHtml += `
            <div class="safari-noresults-card">
                <i class="fas fa-info-circle" style="color:#8e8e93;font-size:28px;margin-bottom:8px;"></i>
                <div class="safari-noresults-title">No matches in this portfolio or Wikipedia for “${qh}”</div>
                <p class="safari-noresults-sub">This search covers Mudit’s portfolio and Wikipedia — not the whole web.</p>
                <a href="https://duckduckgo.com/?q=${encodeURIComponent(q)}" target="_blank" rel="noopener noreferrer" class="app-pill-btn primary" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;margin-top:4px;">
                    <i class="fas fa-external-link-alt"></i> Search the web ↗
                </a>
            </div>`;
    }

    const relatedSearches = [`${q} overview`, `${q} tutorial`, `${q} examples`, `${q} research`];
    organicHtml += `
        <div class="safari-related-section">
            <div class="safari-related-title">Related searches</div>
            <div class="safari-related-chips">
                ${relatedSearches.map(term => `
                    <div class="safari-related-chip" role="button" tabindex="0" onclick="navigateSafariTo('${escapeAttr(term)}')">
                        <i class="fas fa-search" style="font-size:10px;color:#8e8e93;"></i> ${escapeHtml(term)}
                    </div>`).join('')}
            </div>
        </div>`;

    return organicHtml;
}

function buildKnowledgeCardHtml(summaryData) {
    if (!summaryData) return '';
    const thumbSrc = summaryData.thumbnail ? safeUrl(summaryData.thumbnail.source) : '';
    const pageUrl = safeUrl(summaryData.content_urls ? summaryData.content_urls.desktop.page : `https://en.wikipedia.org/wiki/${encodeURIComponent(summaryData.title)}`);

    return `
        <div class="safari-knowledge-card">
            ${thumbSrc && thumbSrc !== '#' ? `<img src="${escapeHtml(thumbSrc)}" alt="" class="safari-kc-thumb" loading="lazy">` : ''}
            <div class="safari-kc-title">${escapeHtml(summaryData.title)}</div>
            <div class="safari-kc-subtitle">${escapeHtml(summaryData.description || 'From Wikipedia')}</div>
            <div class="safari-kc-extract">${escapeHtml(summaryData.extract)}</div>
            <div class="safari-kc-actions">
                <a href="${escapeHtml(pageUrl)}" target="_blank" rel="noopener noreferrer" class="app-pill-btn primary" style="justify-content:center;text-decoration:none;"><i class="fas fa-external-link-alt"></i> Read on Wikipedia</a>
                <button type="button" class="app-pill-btn" onclick="searchYouTube('${escapeAttr(summaryData.title)}')"><i class="fab fa-youtube" style="color:#ff0000;"></i> Videos</button>
            </div>
        </div>
    `;
}

function toggleSafariFaq(el) {
    if (el) el.classList.toggle('open');
}

// Monotonic token. A slow Wikipedia response used to write its results into
// whatever tab happened to be on screen when it landed.
let safariRenderToken = 0;

async function renderDuckDuckGoSearch(tab, renderArea) {
    const myToken = ++safariRenderToken;
    const myTabId = tab.id;
    const q = tab.searchQuery || 'macOS';
    const mathResult = evaluateMathExpression(q);

    const portfolioMatches = searchPortfolioCorpus(q);
    const cachedWiki = getCachedWikiResult(q);

    renderArea.innerHTML = `
        <div class="safari-search-container">
            <div class="safari-search-nav-bar">
                <div class="safari-search-tabs">
                    <span class="safari-search-tab active"><i class="fas fa-search"></i> All</span>
                    <span class="safari-search-tab" onclick="searchYouTube('${escapeAttr(q)}')"><i class="fab fa-youtube" style="color:#ff0000;"></i> Videos</span>
                    <span class="safari-search-tab" onclick="window.open('https://news.google.com/search?q=${encodeURIComponent(q)}', '_blank', 'noopener,noreferrer')"><i class="far fa-newspaper"></i> News</span>
                    <span class="safari-search-tab" onclick="window.open('https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}', '_blank', 'noopener,noreferrer')"><i class="far fa-image"></i> Images</span>
                </div>
                <div class="safari-search-stats" id="safari-search-stats">${cachedWiki ? searchStatsText(cachedWiki.totalHits, portfolioMatches.length) : 'Searching…'}</div>
            </div>

            ${mathResult !== null ? `
                <div class="safari-calc-card">
                    <div class="safari-calc-expr">${escapeHtml(q)} =</div>
                    <div class="safari-calc-val">${mathResult}</div>
                </div>
            ` : ''}

            <div class="safari-search-layout" id="safari-search-layout-root">
                <div class="safari-results-feed" id="safari-organic-slot">
                    ${cachedWiki ? buildSearchResultsHtml(q, cachedWiki.searchArticles, cachedWiki.summaryData, portfolioMatches) : `
                        ${buildPortfolioMatchesHtml(portfolioMatches)}
                        <div class="safari-skel-block">
                            <div class="safari-skel-line" style="width:35%;height:10px;margin-bottom:12px;"></div>
                            <div class="safari-skel-line" style="width:80%;height:18px;margin-bottom:10px;"></div>
                            <div class="safari-skel-line" style="width:100%;"></div>
                            <div class="safari-skel-line" style="width:65%;"></div>
                        </div>
                    `}
                </div>

                <div id="safari-knowledge-slot">
                    ${cachedWiki ? buildKnowledgeCardHtml(cachedWiki.summaryData) : `
                        <div class="safari-knowledge-card">
                            <div class="safari-skel-line" style="width:100%;height:140px;border-radius:10px;margin-bottom:14px;"></div>
                            <div class="safari-skel-line" style="width:70%;height:20px;margin-bottom:10px;"></div>
                            <div class="safari-skel-line" style="width:40%;height:12px;margin-bottom:16px;"></div>
                            <div class="safari-skel-line" style="width:100%;"></div>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;

    if (cachedWiki) return;

    // Only paint if this is still the newest render AND its tab is still active.
    const isStillCurrent = () => myToken === safariRenderToken && activeSafariTabId === myTabId;

    try {
        const wikiSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&utf8=&format=json&origin=*`;
        const searchRes = await fetch(wikiSearchUrl);
        const searchData = await searchRes.json();
        const searchArticles = (searchData.query && searchData.query.search) ? searchData.query.search : [];
        const totalHits = (searchData.query && searchData.query.searchinfo && searchData.query.searchinfo.totalhits) || searchArticles.length;

        let summaryData = null;
        if (searchArticles.length > 0) {
            try {
                const topTitle = searchArticles[0].title;
                const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topTitle)}`);
                if (summaryRes.ok) {
                    const sData = await summaryRes.json();
                    if (sData && sData.title && sData.extract) {
                        summaryData = sData;
                    }
                }
            } catch(err) {}
        }

        setCachedWikiResult(q, searchArticles, summaryData, totalHits);
        if (!isStillCurrent()) return;

        const organicSlot = document.getElementById('safari-organic-slot');
        const knowledgeSlot = document.getElementById('safari-knowledge-slot');
        const stats = document.getElementById('safari-search-stats');
        if (organicSlot) organicSlot.innerHTML = buildSearchResultsHtml(q, searchArticles, summaryData, portfolioMatches);
        if (knowledgeSlot) knowledgeSlot.innerHTML = buildKnowledgeCardHtml(summaryData);
        if (stats) stats.textContent = searchStatsText(totalHits, portfolioMatches.length);
    } catch (e) {
        if (!isStillCurrent()) return;
        const organicSlot = document.getElementById('safari-organic-slot');
        const knowledgeSlot = document.getElementById('safari-knowledge-slot');
        if (organicSlot) organicSlot.innerHTML = buildSearchResultsHtml(q, [], null, portfolioMatches);
        if (knowledgeSlot) knowledgeSlot.innerHTML = '';
        const stats = document.getElementById('safari-search-stats');
        if (stats) stats.textContent = portfolioMatches.length ? `${portfolioMatches.length} from this portfolio · Wikipedia unreachable` : 'Wikipedia unreachable';
    }
}

/** Real numbers only — the old header claimed "About 1,840,000 results (0.24s)". */
function searchStatsText(totalHits, portfolioCount) {
    const parts = [];
    if (portfolioCount) parts.push(`${portfolioCount} from this portfolio`);
    parts.push(`${Number(totalHits || 0).toLocaleString()} Wikipedia articles`);
    return parts.join(' · ');
}

function renderYouTubeEngine(tab, renderArea) {
    if (tab.ytView === 'watch' && tab.ytVideoId) {
        renderYouTubeWatchPage(tab, renderArea);
    } else {
        renderYouTubeFeedPage(tab, renderArea);
    }
}

/* YouTube removed search-based embeds (`embed?listType=search`) years ago,
   so the old "feed" was a dead player. What does work without an API key:
   embedding a specific video. So the feed is a curated grid of talks
   (IDs verified via YouTube oEmbed), pasted links play inline, and searches
   hand off to YouTube itself rather than pretending. */
const FEATURED_VIDEOS = [
    { id: 'zjkBMFhNj_g', title: 'Intro to Large Language Models', channel: 'Andrej Karpathy' },
    { id: 'kCc8FmEb1nY', title: "Let's build GPT: from scratch, in code, spelled out", channel: 'Andrej Karpathy' },
    { id: 'wjZofJX0v4M', title: 'Transformers, the tech behind LLMs', channel: '3Blue1Brown' },
    { id: 'eMlx5fFNoYc', title: 'Attention in transformers, step-by-step', channel: '3Blue1Brown' },
    { id: 'aircAruvnKk', title: 'But what is a neural network?', channel: '3Blue1Brown' }
];

function renderYouTubeFeedPage(tab, renderArea) {
    stopSafariMedia();
    const query = (tab.ytQuery || '').trim();
    const resultsUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

    renderArea.innerHTML = `
        <div class="yt-engine-container">
            <div class="yt-top-bar">
                <div class="yt-logo" role="button" tabindex="0" onclick="returnToYouTubeFeed()" title="YouTube Home"><i class="fab fa-youtube"></i> YouTube</div>
                <div class="yt-search-form">
                    <i class="fas fa-search" style="color:#888;margin-right:8px;font-size:12px;"></i>
                    <input type="text" id="yt-search-input" placeholder="Search YouTube, or paste a video link" value="${escapeHtml(query)}" onkeydown="handleYouTubeSearchKey(event)" aria-label="Search YouTube">
                </div>
                <div class="yt-nav-actions">
                    <button type="button" class="app-pill-btn" onclick="openSafariStartPage()"><i class="fas fa-th"></i> Favorites</button>
                </div>
            </div>

            ${query ? `
                <div class="yt-search-handoff">
                    <div>
                        <div class="yt-handoff-title">Results for “${escapeHtml(query)}”</div>
                        <div class="yt-handoff-sub">YouTube search opens on youtube.com. Paste any video link above to watch it here.</div>
                    </div>
                    <a href="${escapeHtml(resultsUrl)}" target="_blank" rel="noopener noreferrer" class="app-pill-btn primary"><i class="fab fa-youtube"></i> Open on YouTube ↗</a>
                </div>` : ''}

            <div class="yt-section-title">Featured · AI &amp; machine learning</div>
            <div class="yt-video-grid">
                ${FEATURED_VIDEOS.map(v => `
                    <button type="button" class="yt-video-card" onclick="selectYouTubeVideo('${escapeAttr(v.id)}', '${escapeAttr(v.title)}', '${escapeAttr(v.channel)}')">
                        <div class="yt-thumb"><img src="https://i.ytimg.com/vi/${escapeHtml(v.id)}/hqdefault.jpg" alt="" loading="lazy"><span class="yt-play-badge"><i class="fas fa-play"></i></span></div>
                        <div class="yt-video-title">${escapeHtml(v.title)}</div>
                        <div class="yt-video-channel">${escapeHtml(v.channel)}</div>
                    </button>`).join('')}
            </div>
        </div>
    `;
}

function renderYouTubeWatchPage(tab, renderArea) {
    const videoId = String(tab.ytVideoId || '').replace(/[^0-9A-Za-z_-]/g, '');
    const featured = FEATURED_VIDEOS.find(v => v.id === videoId);
    const title = (featured && featured.title) || tab.title.replace(' - YouTube', '') || 'YouTube Video';
    const channel = (featured && featured.channel) || tab.ytChannel || 'YouTube';
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    // youtube-nocookie: the privacy-enhanced embed, no tracking cookies until play.
    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`;

    renderArea.innerHTML = `
        <div class="yt-engine-container">
            <div class="yt-top-bar">
                <div class="yt-logo" role="button" tabindex="0" onclick="returnToYouTubeFeed()" title="YouTube Home"><i class="fab fa-youtube"></i> YouTube</div>
                <div class="yt-search-form">
                    <i class="fas fa-search" style="color:#888;margin-right:8px;font-size:12px;"></i>
                    <input type="text" id="yt-search-input" placeholder="Search YouTube, or paste a video link" onkeydown="handleYouTubeSearchKey(event)" aria-label="Search YouTube">
                </div>
                <div class="yt-nav-actions">
                    <button type="button" class="app-pill-btn" onclick="returnToYouTubeFeed()"><i class="fas fa-arrow-left"></i> Back</button>
                </div>
            </div>

            <div class="yt-main-player-box">
                <div class="yt-iframe-responsive">
                    <iframe id="yt-active-iframe" src="${escapeHtml(embedUrl)}" title="${escapeHtml(title)}"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
                </div>
                <div class="yt-player-details">
                    <div class="yt-active-title" id="yt-watch-title-text">${escapeHtml(title)}</div>
                    <div class="yt-active-meta">
                        <div class="yt-channel-badge"><i class="fas fa-user-circle fa-lg" style="color:#ff0000;"></i> <span id="yt-watch-channel-text">${escapeHtml(channel)}</span></div>
                    </div>
                    <div class="yt-action-pills">
                        <span class="yt-action-pill" role="button" tabindex="0" onclick="copyCurrentSafariUrl()"><i class="fas fa-link"></i> Copy Link</span>
                        <a href="${escapeHtml(watchUrl)}" target="_blank" rel="noopener noreferrer" class="yt-action-pill"><i class="fas fa-external-link-alt"></i> Watch on YouTube ↗</a>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function selectYouTubeVideo(videoId, title, channel) {
    const currentTab = safariTabs.find(t => t.id === activeSafariTabId);
    if (currentTab) {
        currentTab.type = 'youtube';
        currentTab.ytView = 'watch';
        currentTab.ytVideoId = videoId;
        currentTab.ytChannel = channel || 'YouTube';
        currentTab.ytQuery = null;
        currentTab.url = `https://www.youtube.com/watch?v=${videoId}`;
        currentTab.title = title || 'YouTube Video';
        pushSafariHistory(currentTab, `yt_watch:${videoId}`);
        switchSafariTab(currentTab.id);
    }
}

function returnToYouTubeFeed() {
    stopSafariMedia();
    const currentTab = safariTabs.find(t => t.id === activeSafariTabId);
    if (currentTab) {
        currentTab.type = 'youtube';
        currentTab.ytView = 'feed';
        currentTab.ytVideoId = null;
        currentTab.ytQuery = null;
        currentTab.url = 'https://www.youtube.com';
        currentTab.title = 'YouTube';
        pushSafariHistory(currentTab, 'youtube');
        switchSafariTab(currentTab.id);
    }
}

function searchYouTube(query) {
    stopSafariMedia();
    const currentTab = safariTabs.find(t => t.id === activeSafariTabId);
    if (currentTab) {
        currentTab.type = 'youtube';
        currentTab.ytView = 'feed';
        currentTab.ytVideoId = null;
        currentTab.ytQuery = query;
        currentTab.url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        currentTab.title = `${query} - YouTube`;
        pushSafariHistory(currentTab, `yt_search:${query}`);
        switchSafariTab(currentTab.id);
    }
}

function selectYouTubeCategory(cat) {
    activeYouTubeCategory = cat;
    const currentTab = safariTabs.find(t => t.id === activeSafariTabId);
    if (currentTab) {
        currentTab.type = 'youtube';
        currentTab.ytView = 'feed';
        currentTab.ytVideoId = null;
        currentTab.ytQuery = null;
        switchSafariTab(currentTab.id);
    }
}

function handleYouTubeSearchKey(e) {
    if (e.key === 'Enter') {
        const input = document.getElementById('yt-search-input');
        const q = (input.value || '').trim();
        if (!q) return;

        if (q.includes('youtube.com/watch?v=') || q.includes('youtu.be/')) {
            const match = q.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
            if (match && match[1]) {
                selectYouTubeVideo(match[1]);
                return;
            }
        }
        searchYouTube(q);
    }
}

function renderSafariWebPage(tab) {
    const renderArea = document.getElementById('safari-page-render-area');
    if (!renderArea) return;

    if (tab.type === 'youtube') {
        renderYouTubeEngine(tab, renderArea);
    } else if (tab.type === 'ddg_search') {
        renderDuckDuckGoSearch(tab, renderArea);
    } else if (tab.shortcutKey && safariShortcuts[tab.shortcutKey]) {
        const sc = safariShortcuts[tab.shortcutKey];
        let itemsHtml = '';
        (sc.pinnedRepos || []).forEach(repo => {
            let itemIcon = `<i class="${sc.icon}"></i>`;
            if (sc.iconSvg) {
                itemIcon = sc.iconSvg.replace('width="28" height="28"', 'width="16" height="16"');
            }
            itemsHtml += `
                <div class="gh-repo-card" onclick="window.open('${sc.url}', '_blank', 'noopener,noreferrer')">
                    <div class="gh-repo-title" style="display:flex;align-items:center;gap:6px;">${itemIcon} ${repo.name} <span class="gh-badge">${repo.stars}</span></div>
                    <p>${repo.desc}</p>
                    <div class="gh-meta"><span class="lang-dot python"></span> ${repo.lang} <span style="margin-left:auto;color:#007aff;">Open ↗</span></div>
                </div>
            `;
        });

        const heroIcon = sc.iconSvg || `<i class="${sc.icon}"></i>`;

        renderArea.innerHTML = `
            <div class="platform-hero-view">
                <div class="fav-icon-box bg-fav-${tab.shortcutKey}" style="width:72px;height:72px;font-size:32px;margin:0 auto 12px auto;display:flex;align-items:center;justify-content:center;">
                    ${heroIcon}
                </div>
                <h2>${sc.title}</h2>
                <p>${sc.desc}</p>
                <div style="display:flex;justify-content:center;gap:12px;margin-bottom:28px;">
                    <a href="${sc.url}" target="_blank" rel="noopener noreferrer" class="app-pill-btn primary"><i class="fas fa-external-link-alt"></i> Visit Live Platform</a>
                    <button type="button" class="app-pill-btn" onclick="openSafariStartPage()"><i class="fas fa-th"></i> All Favorites</button>
                </div>
                <div class="github-repos-grid" style="text-align:left;">
                    ${itemsHtml}
                </div>
            </div>
        `;
    } else {
        // Most sites forbid being framed (X-Frame-Options / CSP), so rather
        // than show a broken iframe, hand off to a real tab.
        let host = tab.url;
        try { host = new URL(tab.url).host.replace(/^www\./, ''); } catch (e) { /* keep raw */ }
        renderArea.innerHTML = `
            <div class="safari-handoff">
                <img class="safari-handoff-favicon" src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64" alt="" onerror="this.style.display='none'">
                <h2>${escapeHtml(host)}</h2>
                <p>This site can’t be shown inside the portfolio — most sites don’t allow being embedded in another page.</p>
                <div class="safari-handoff-actions">
                    <a href="${escapeHtml(safeUrl(tab.url))}" target="_blank" rel="noopener noreferrer" class="app-pill-btn primary"><i class="fas fa-external-link-alt"></i> Open in a New Tab</a>
                    <button type="button" class="app-pill-btn" onclick="openSafariStartPage()"><i class="fas fa-th"></i> Start Page</button>
                </div>
            </div>
        `;
    }
}

function safariHistoryBack() {
    const currentTab = safariTabs.find(t => t.id === activeSafariTabId);
    if (currentTab && currentTab.historyIndex > 0) {
        currentTab.historyIndex--;
        const dest = currentTab.history[currentTab.historyIndex];
        loadSafariDestination(currentTab, dest);
        switchSafariTab(currentTab.id);
    }
}

function safariHistoryForward() {
    const currentTab = safariTabs.find(t => t.id === activeSafariTabId);
    if (currentTab && currentTab.historyIndex < currentTab.history.length - 1) {
        currentTab.historyIndex++;
        const dest = currentTab.history[currentTab.historyIndex];
        loadSafariDestination(currentTab, dest);
        switchSafariTab(currentTab.id);
    }
}

function safariReload() {
    const icon = document.querySelector('.safari-reload-icon');
    if (icon) {
        icon.style.transform = 'rotate(360deg)';
        setTimeout(() => { icon.style.transform = ''; }, 400);
    }
    const currentTab = safariTabs.find(t => t.id === activeSafariTabId);
    if (currentTab) switchSafariTab(currentTab.id);
}

/**
 * The URL a tab should open in the visitor's real browser.
 * Search tabs carry a synthetic `search.safari.apple` host for display only —
 * opening or copying that gave people a domain that doesn't resolve.
 */
function externalSafariUrl(tab) {
    if (!tab) return 'https://github.com/muditagrawal-alt';
    if (tab.type === 'ddg_search' && tab.searchQuery) {
        return `https://duckduckgo.com/?q=${encodeURIComponent(tab.searchQuery)}`;
    }
    if (tab.type === 'start' || !tab.url) return 'https://github.com/muditagrawal-alt';
    return tab.url;
}

function openCurrentSafariLink() {
    const currentTab = safariTabs.find(t => t.id === activeSafariTabId);
    openExternal(externalSafariUrl(currentTab));
}

function copyCurrentSafariUrl() {
    const currentTab = safariTabs.find(t => t.id === activeSafariTabId);
    const url = externalSafariUrl(currentTab);
    copyTextToClipboard(url, "Link copied to clipboard: " + url);
}

function shareCurrentSafariUrl() {
    const currentTab = safariTabs.find(t => t.id === activeSafariTabId);
    const url = externalSafariUrl(currentTab);
    if (navigator.share) {
        navigator.share({ title: currentTab ? currentTab.title : 'Mudit Agrawal', url: url });
    } else {
        copyCurrentSafariUrl();
    }
}
