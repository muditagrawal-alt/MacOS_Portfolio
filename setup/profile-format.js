/* ==========================================================================
   Info bank file format — shared by the setup questionnaire and its server
   --------------------------------------------------------------------------
   js/data/profile.js is a classic script (no build step), so the info bank
   is written as `window.PROFILE_DATA = { …JSON… };` with a header that tells
   whoever opens it what it is. Hand edits and the questionnaire produce the
   same layout, so diffs stay readable.
   ========================================================================== */

(function (root) {
    const HEADER = `/* ==========================================================================
   Your portfolio's info bank — everything personal lives in this one file
   --------------------------------------------------------------------------
   Every app on both versions (Mac and iPhone) reads from here: Finder,
   Terminal, Mail, Safari, the App Store, Iris, Notes, Photos, the Lock and
   Home Screens… Edit it by hand, or run \`npm run setup\` for a guided
   questionnaire that rewrites it (and copies in your photo and résumé).

   Field reference: setup/README.md
   ========================================================================== */

`;

    /** Drops empty strings, empty arrays and empty objects, so the file only holds what was filled in. */
    function prune(value) {
        if (Array.isArray(value)) {
            const items = value.map(prune).filter(v => v !== undefined);
            return items.length ? items : undefined;
        }
        if (value && typeof value === 'object') {
            const out = {};
            Object.entries(value).forEach(([k, v]) => {
                const p = prune(v);
                if (p !== undefined) out[k] = p;
            });
            return Object.keys(out).length ? out : undefined;
        }
        if (typeof value === 'string') return value.trim() ? value.trim() : undefined;
        if (value === null) return undefined;
        return value;
    }

    function serializeProfile(profile) {
        const body = JSON.stringify(prune(profile) || {}, null, 2)
            // Keep short string arrays (tags, skill lists) on one line.
            .replace(/\[\n\s+("[^"\n]*"(?:,\n\s+"[^"\n]*")*)\n\s+\]/g, (m, inner) => {
                const flat = '[' + inner.split(/,\n\s+/).join(', ') + ']';
                return flat.length <= 110 ? flat : m;
            });
        return `${HEADER}window.PROFILE_DATA = ${body};\n`;
    }

    /** Reads the object back out of a profile.js source (used by the setup server). */
    function parseProfileSource(source) {
        const start = source.indexOf('{', source.indexOf('window.PROFILE_DATA'));
        const end = source.lastIndexOf('}');
        if (start < 0 || end < start) throw new Error('profile.js: window.PROFILE_DATA object not found');
        return JSON.parse(source.slice(start, end + 1));
    }

    const api = { serializeProfile, parseProfileSource, prune };
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.ProfileFormat = api;
})(typeof window !== 'undefined' ? window : globalThis);
