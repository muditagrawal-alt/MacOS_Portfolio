/* ==========================================================================
   Portfolio Search Corpus — Single Source of Truth
   --------------------------------------------------------------------------
   ONE index, THREE consumers. Do not duplicate this list:
     • Safari    — "From this portfolio" results alongside web search
     • Spotlight — Cmd+Space system-wide search
     • Iris      — grounding for offline answers when no model endpoint is set

   Generated from the info bank (js/data/profile.js).

   Each entry: { title, type, url?, action?, text, tags[] }
   `action` is a verb the app layer resolves (open_finder: / open_project: /
   open_app:), never a string that gets eval'd.
   ========================================================================== */

window.PORTFOLIO_CORPUS = (() => {
    const P = window.PROFILE_DATA;
    const e = P.education;
    const words = (s) => String(s || '').toLowerCase().split(/[^a-z0-9+#.]+/).filter(w => w.length > 1);
    return [
        ...P.projects.map(x => ({
            title: x.title, type: 'Project', url: x.link || null,
            action: `open_project:${x.name}`,
            text: x.summary,
            tags: [...x.tags, x.name.toLowerCase(), ...(x.live ? ['live app', 'deployed'] : []), 'project', 'projects', 'repo']
        })),
        ...P.experience.map(x => ({
            title: `${x.role} — ${x.org}`, type: 'Experience', url: null,
            action: 'open_finder:experience',
            text: `${x.dates}. ${x.role} at ${x.org}.`,
            tags: ['experience', 'internship', 'work', 'job', ...words(x.org)]
        })),
        ...(e.degree ? [{
            title: e.degree, type: 'Education', url: null,
            action: 'open_finder:education',
            text: [e.university, e.years, e.grade && `${e.gradeLabel} ${e.grade}`].filter(Boolean).join('. ') + '.',
            tags: ['education', 'university', 'degree', 'college', e.gradeLabel.toLowerCase(), ...words(e.university), ...words(e.degree)]
        }] : []),
        {
            title: 'Contact Information', type: 'Contact', url: P.contact.email ? `mailto:${P.contact.email}` : null,
            action: 'open_finder:contact',
            text: [P.contact.email && `Email ${P.contact.email}`, P.contact.phone && `Phone ${P.contact.phone}`, ...P.links.map(l => `${l.label}: ${l.url}`)].filter(Boolean).join(' • '),
            tags: ['contact', 'email', 'phone', 'reach out', 'hire', 'call', ...P.links.map(l => l.network)]
        },
        ...(P.skills.length ? [{
            title: `${P.name} — Skills`, type: 'Skills', url: null,
            action: 'open_finder:skills',
            text: P.skills.map(g => `${g.label} (${g.items.join(', ')})`).join(', ') + '.',
            tags: ['skills', 'stack', ...P.skills.flatMap(g => g.items.map(i => i.toLowerCase()))]
        }] : []),
        ...P.writing.map(w => ({
            title: w.title, type: 'Article', url: w.url || null,
            action: null,
            text: w.summary,
            tags: ['writing', 'article', 'blog', ...words(w.topic)]
        })),
        {
            title: `${P.name} — About`, type: 'About', url: null,
            action: 'open_finder:about',
            text: P.bio,
            tags: ['about', 'bio', 'profile', P.first.toLowerCase()]
        }
    ];
})();

const STOP_WORDS = new Set(['what', 'are', 'is', 'the', 'of', 'in', 'and', 'for', 'to', 'a', 'an', 'tell', 'me', 'about', 'his', 'best', 'some', 'can', 'you', 'give', 'how', 'do', 'does', 'show']);

/**
 * Ranked substring search over the corpus.
 * @param {string} query
 * @param {{minScore?:number, limit?:number}} opts
 * @returns {Array} matching corpus entries, best first
 */
function searchPortfolioCorpus(query, opts = {}) {
    const { minScore = 2, limit = 5 } = opts;
    const q = (query || '').toLowerCase().trim();
    if (!q) return [];

    // Filter stopwords, keeping meaningful terms (including 2-char like "ai", "cv", "ml", "c")
    let rawTerms = q.split(/\s+/).map(t => t.replace(/[^a-z0-9#+.-]/g, '')).filter(Boolean);
    let terms = rawTerms.filter(t => !STOP_WORDS.has(t) && t.length >= 2);
    
    // If all words were stopwords, fallback to raw terms
    if (terms.length === 0) {
        terms = rawTerms.filter(t => t.length >= 2);
    }
    if (terms.length === 0) return [];

    // Intent expansion: if user query mentions "project", "repo", "built", boost projects
    const isProjectQuery = rawTerms.some(t => /^(project|projects|repo|repos|built|apps?|code)$/.test(t));

    return window.PORTFOLIO_CORPUS
        .map(entry => {
            const titleLower = entry.title.toLowerCase();
            const haystack = `${entry.title} ${entry.text} ${entry.tags.join(' ')}`.toLowerCase();
            let score = 0;

            if (isProjectQuery && entry.type === 'Project') {
                score += 4;
            }

            terms.forEach(term => {
                if (titleLower.includes(term)) score += 5;
                if (entry.tags.some(t => t.includes(term))) score += 3;
                if (haystack.includes(term)) score += 1;
            });
            return { entry, score };
        })
        .filter(r => r.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(r => r.entry);
}

/**
 * Resolves a corpus `action` verb to a real app action.
 */
function runCorpusAction(action, url) {
    if (!action) {
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
        return;
    }
    const [verb, arg] = [action.slice(0, action.indexOf(':')), action.slice(action.indexOf(':') + 1)];
    switch (verb) {
        case 'open_finder':  openFinderPane(arg); break;
        case 'open_app':     openWindow(arg); break;
        case 'open_project':
            if (url) window.open(url, '_blank', 'noopener,noreferrer');
            else openWindow('appstore-window');
            break;
        default:
            if (url) window.open(url, '_blank', 'noopener,noreferrer');
    }
}
