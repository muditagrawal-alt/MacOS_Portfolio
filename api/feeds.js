/* ==========================================================================
   RSS aggregator — serverless (Vercel / Netlify Functions)
   --------------------------------------------------------------------------
   Medium and Substack publish RSS but send no CORS header, so a browser
   cannot read them directly. This fetches them server-side and returns
   normalised JSON.

   No API key needed — these are public feeds. Deploy alongside api/iris.js
   and set FEEDS_ENDPOINT in js/config/config.js.

   GitHub is deliberately NOT proxied here: api.github.com is CORS-enabled
   and the browser fetches it directly, which keeps this function off the
   critical path for the most important feed.
   ========================================================================== */

const FEEDS = [
    { source: 'medium',   url: 'https://medium.com/feed/@muditagrawal03' },
    { source: 'substack', url: 'https://standardissuemudit.substack.com/feed' }
];

const ALLOWED_ORIGINS = [
    'https://muditagrawal-alt.github.io',
    'http://localhost:8080'
];

/** Minimal RSS <item> extractor — avoids pulling in an XML parser dep. */
function parseRss(xml, source) {
    const items = [];
    const blocks = xml.split(/<item[\s>]/i).slice(1);

    for (const block of blocks.slice(0, 10)) {
        const pick = (tag) => {
            const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
            if (!m) return '';
            return m[1]
                .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
                .replace(/<[^>]+>/g, '')
                .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
                .trim();
        };

        const title = pick('title');
        const link = pick('link');
        if (!title || !link) continue;

        const raw = pick('description') || pick('content:encoded');
        items.push({
            source,
            title,
            link,
            summary: raw.slice(0, 180) + (raw.length > 180 ? '…' : ''),
            published: new Date(pick('pubDate') || Date.now()).toISOString()
        });
    }
    return items;
}

export default async function handler(req, res) {
    const origin = req.headers.origin || '';
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    if (req.method === 'OPTIONS') return res.status(204).end();

    // Cache at the edge so repeat visitors don't re-hit the origins.
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');

    const settled = await Promise.allSettled(
        FEEDS.map(async (feed) => {
            const r = await fetch(feed.url, {
                headers: { 'User-Agent': 'macos-portfolio-feed-reader' }
            });
            if (!r.ok) throw new Error(`${feed.source} ${r.status}`);
            return parseRss(await r.text(), feed.source);
        })
    );

    const items = settled
        .filter(s => s.status === 'fulfilled')
        .flatMap(s => s.value)
        .sort((a, b) => new Date(b.published) - new Date(a.published))
        .slice(0, 10);

    return res.status(200).json({
        items,
        // Surfaces which sources failed without breaking the response.
        failed: settled.map((s, i) => s.status === 'rejected' ? FEEDS[i].source : null).filter(Boolean)
    });
}
