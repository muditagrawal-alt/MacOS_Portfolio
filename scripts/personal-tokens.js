/* ==========================================================================
   What counts as personal — shared by the template gate and the E2E suite
   --------------------------------------------------------------------------
   The distinctive values in an info bank (name, email, phone, handles,
   project names, employers…) as lowercase tokens, and a matcher that finds
   them as whole words in a piece of text.
   ========================================================================== */

const path = require('path');

// Single words that can't tell a leak from the template's own text: filler in
// organisation names, and words the template itself uses — brands it links
// to, its own apps, CSS colours, everyday English. Someone called Will Green
// who worked at Apple is still checked through the longer values (full name,
// email, handles, URLs); only the bare words are let through.
const GENERIC = new Set([
    'research', 'centre', 'center', 'tech', 'technologies', 'innovation', 'startup', 'incubated', 'labs', 'group', 'company', 'india', 'indian', 'defense', 'defence', 'university', 'institute', 'school', 'college', 'project', 'studio', 'engine', 'check', 'compiler', 'ai',
    'apple', 'google', 'github', 'meta', 'linkedin', 'vercel', 'twitter', 'youtube', 'instagram', 'medium', 'figma', 'slack', 'kaggle', 'leetcode', 'openai', 'claude', 'intel', 'react', 'python', 'swift', 'kotlin', 'flutter', 'unity', 'hugging', 'face',
    'portfolio', 'about', 'home', 'welcome', 'contact', 'resume', 'finder', 'safari', 'mail', 'notes', 'photos', 'music', 'terminal', 'launchpad', 'spotlight', 'iris', 'siri', 'weather', 'calendar', 'messages', 'settings', 'chat', 'calculator', 'snake', 'breakout', 'game', 'blog', 'mobile', 'web', 'app', 'apps', 'cloud', 'stack', 'vision',
    'white', 'black', 'green', 'gray', 'grey', 'gold', 'orange', 'pink', 'will', 'mark', 'page', 'long', 'bell', 'park', 'rich', 'june', 'field', 'cross', 'banks', 'sharp', 'strong', 'moon', 'star'
]);

/** token → where it came from ("name", "employer"…), for a normalised profile. */
function personalTokens(p) {
    const tokens = new Map();
    const add = (value, from, min = 4) => {
        const t = String(value || '').trim().toLowerCase();
        if (t.length >= min && !GENERIC.has(t)) tokens.set(t, from);
    };
    p.name.split(/\s+/).forEach(w => add(w, 'name'));
    add(p.contact.email, 'email');
    add(p.contact.phone.replace(/[^\d]/g, '').slice(-8), 'phone', 6);
    add(p.handle, 'handle', 5);
    add(p.github.user, 'GitHub user');
    p.links.forEach(l => add(l.handle.replace(/^@/, ''), `${l.label} handle`, 5));
    p.links.forEach(l => { const m = l.url.match(/\/(?:in|u|@)?\/?([\w.-]{5,})\/?$/); if (m) add(m[1], `${l.label} URL`, 6); });
    p.projects.forEach(x => add(x.name, 'project'));
    p.experience.forEach(x => add(x.org.split(/[^A-Za-z0-9]+/).find(w => w.length >= 4 && !GENERIC.has(w.toLowerCase())), 'employer'));
    add((p.education.university || '').split(/\s+/)[0], 'university');
    if (p.photo.startsWith('assets/') && !p.photo.startsWith('assets/icons/')) add(path.basename(p.photo), 'photo file');
    if (p.resume.file) add(path.basename(p.resume.file), 'résumé file');
    return tokens;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Each token that appears in `text` as a whole word: [{ token, from, index }]. */
function findTokens(text, tokens) {
    const lower = text.toLowerCase();
    const found = [];
    for (const [token, from] of tokens) {
        if (!lower.includes(token)) continue;
        const m = new RegExp(`(^|[^a-z0-9])${escapeRe(token)}($|[^a-z0-9])`, 'i').exec(text);
        if (m) found.push({ token, from, index: m.index + m[1].length });
    }
    return found;
}

module.exports = { GENERIC, personalTokens, findTokens };
