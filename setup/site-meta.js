/* ==========================================================================
   Site metadata — the parts of the pages that can't be filled in by script
   --------------------------------------------------------------------------
   Link previews (iMessage, Slack, LinkedIn) and search engines read <title>
   and the og:/twitter: tags without running JavaScript, so those are written
   into index.html and ios.html, between `profile:meta` markers, and into the
   web app manifest. The setup server uses this to rewrite them; the test
   suite uses it to check they still match the info bank.

   Takes a normalised profile (js/data/profile-schema.js).
   ========================================================================== */

(function (root) {
    const START = '<!-- profile:meta — generated from the info bank by `npm run setup`; edit js/data/profile.js, not here -->';
    const END = '<!-- /profile:meta -->';

    const attr = (v) => String(v || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const text = (v) => String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    function metaFor(p, page) {
        const his = p.pron.possessive;
        const lead = [p.name, p.tagline].filter(Boolean).join(' — ');
        const custom = p.siteDescription;   // an explicit site.description from the info bank wins
        if (page === 'ios') {
            return {
                title: `${p.name} — Portfolio`,
                description: custom || `${lead}. The iPhone edition of ${his} portfolio: résumé, projects, experience, and Iris, an assistant that answers questions about ${his} work with cited sources.`,
                ogDescription: custom || `${p.tagline ? `${p.tagline} — ` : ''}résumé, projects and experience, plus an assistant that answers questions about ${his} work.`,
                imageAlt: `${p.name}'s portfolio on iPhone`,
                appTitle: p.first
            };
        }
        return {
            title: `${p.name} - macOS Portfolio`,
            description: custom || `${lead}. An interactive macOS-style portfolio: résumé, projects, experience, and Iris, an assistant that answers questions about ${his} work with cited sources.`,
            ogDescription: custom || `Explore ${p.name}'s interactive macOS portfolio: résumé, projects, experience, and an assistant that answers questions about ${his} work.`,
            imageAlt: `${p.name}'s portfolio: a macOS desktop with an About window showing ${his} role, projects and experience`
        };
    }

    // Crawlers want an absolute image URL, so resolve it against the site's address when there is one.
    function imageUrl(p) {
        const src = p.site.image;
        if (!src || src.startsWith('data:')) return '';
        try { return p.site.url ? new URL(src, p.site.url).href : src; } catch (e) { return src; }
    }

    /** The managed block for one page ('mac' → index.html, 'ios' → ios.html), indented to sit in <head>. */
    function renderMetaBlock(p, page) {
        const m = metaFor(p, page);
        const image = imageUrl(p);
        const lines = [
            START,
            `<title>${text(m.title)}</title>`,
            `<meta name="description" content="${attr(m.description)}">`,
            ...(m.appTitle ? [`<meta name="apple-mobile-web-app-title" content="${attr(m.appTitle)}">`] : []),
            `<meta property="og:title" content="${attr(m.title)}">`,
            `<meta property="og:description" content="${attr(m.ogDescription)}">`,
            '<meta property="og:type" content="website">',
            ...(p.site.url ? [`<meta property="og:url" content="${attr(p.site.url)}">`] : []),
            ...(image ? [
                `<meta property="og:image" content="${attr(image)}">`,
                '<meta property="og:image:width" content="1200">',
                '<meta property="og:image:height" content="630">',
                `<meta property="og:image:alt" content="${attr(m.imageAlt)}">`
            ] : []),
            `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`,
            `<meta name="twitter:title" content="${attr(m.title)}">`,
            `<meta name="twitter:description" content="${attr(m.ogDescription)}">`,
            ...(image ? [`<meta name="twitter:image" content="${attr(image)}">`] : []),
            END
        ];
        return lines.map(l => `    ${l}`).join('\n');
    }

    const START_TAG = '<!-- profile:meta';

    /** Replaces the managed block in a page's HTML. Throws if the markers are missing. */
    function applyMetaBlock(html, block) {
        const s = html.indexOf(START_TAG);
        const e = html.indexOf(END);
        if (s < 0 || e < 0) throw new Error('profile:meta markers not found');
        const lineStart = html.lastIndexOf('\n', s) + 1;
        return html.slice(0, lineStart) + block + html.slice(e + END.length);
    }

    function extractMetaBlock(html) {
        const s = html.indexOf(START_TAG);
        const e = html.indexOf(END);
        if (s < 0 || e < 0) return null;
        return html.slice(html.lastIndexOf('\n', s) + 1, e + END.length);
    }

    function renderManifest(p) {
        return JSON.stringify({
            name: `${p.name} — Portfolio`,
            short_name: p.first,
            description: [p.tagline, 'résumé, projects, experience, and Iris, an assistant that answers with cited sources.'].filter(Boolean).join(' — '),
            start_url: './',
            scope: './',
            display: 'standalone',
            background_color: '#000000',
            theme_color: '#000000',
            icons: [
                { src: 'assets/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'assets/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
            ]
        }, null, 2) + '\n';
    }

    const api = { renderMetaBlock, applyMetaBlock, extractMetaBlock, renderManifest, START, END };
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.SiteMeta = api;
})(typeof window !== 'undefined' ? window : globalThis);
