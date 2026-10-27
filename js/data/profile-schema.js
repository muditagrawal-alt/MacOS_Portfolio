/* ==========================================================================
   Info bank schema — defaults, normalisation and derived fields
   --------------------------------------------------------------------------
   js/data/profile.js holds only what the owner typed in. This file fills in
   sensible defaults (so a half-filled info bank still renders) and derives
   what the apps need: first name, pronoun forms, social links with icons,
   primary project links, note formatting… Every app reads the normalised
   window.PROFILE_DATA, so none of them needs its own fallbacks.

   The setup questionnaire loads this file too (with PROFILE_SCHEMA_ONLY set)
   for the defaults and the list of social networks.
   ========================================================================== */

/** Networks the questionnaire offers. `icon` is an image (Finder, iPhone), `fa` a Font Awesome glyph. */
const SOCIAL_NETWORKS = {
    github:        { label: 'GitHub',         fa: 'fab fa-github',          icon: 'assets/icons/social-github.svg',      color: '#24292f', blurb: 'Code and open-source projects.' },
    linkedin:      { label: 'LinkedIn',       fa: 'fab fa-linkedin-in',     icon: 'assets/icons/social-linkedin.svg',    color: '#0a66c2', blurb: 'Experience and professional updates.' },
    huggingface:   { label: 'Hugging Face',   fa: 'fas fa-robot',           icon: 'assets/icons/social-huggingface.svg', color: '#ffb000', blurb: 'Models, datasets and Spaces.' },
    medium:        { label: 'Medium',         fa: 'fab fa-medium',          icon: 'assets/icons/social-medium.svg',      color: '#111111', blurb: 'Long-form writing.' },
    substack:      { label: 'Substack',       fa: 'fas fa-bookmark',        icon: 'assets/icons/social-substack.svg',    color: '#ff6719', blurb: 'Newsletter.' },
    x:             { label: 'X',              fa: 'fab fa-x-twitter',       icon: 'assets/icons/social-x.svg',           color: '#000000', blurb: 'Updates and threads.' },
    instagram:     { label: 'Instagram',      fa: 'fab fa-instagram',       icon: 'assets/icons/social-instagram.svg',   color: '#e1306c', blurb: 'Photos and stories.' },
    leetcode:      { label: 'LeetCode',       fa: 'fas fa-code',            icon: 'assets/icons/social-leetcode.svg',    color: '#f89f1b', blurb: 'Algorithms and data structures.' },
    youtube:       { label: 'YouTube',        fa: 'fab fa-youtube',         icon: 'assets/icons/youtube.png',            color: '#ff0000', blurb: 'Videos.' },
    kaggle:        { label: 'Kaggle',         fa: 'fab fa-kaggle',          icon: 'assets/icons/sf-icons/network.svg',   color: '#20beff', blurb: 'Competitions and notebooks.' },
    stackoverflow: { label: 'Stack Overflow', fa: 'fab fa-stack-overflow',  icon: 'assets/icons/sf-icons/network.svg',   color: '#f48024', blurb: 'Questions and answers.' },
    dribbble:      { label: 'Dribbble',       fa: 'fab fa-dribbble',        icon: 'assets/icons/sf-icons/network.svg',   color: '#ea4c89', blurb: 'Design work.' },
    behance:       { label: 'Behance',        fa: 'fab fa-behance',         icon: 'assets/icons/sf-icons/network.svg',   color: '#1769ff', blurb: 'Portfolio projects.' },
    mastodon:      { label: 'Mastodon',       fa: 'fab fa-mastodon',        icon: 'assets/icons/sf-icons/network.svg',   color: '#6364ff', blurb: 'Posts.' },
    bluesky:       { label: 'Bluesky',        fa: 'fas fa-cloud',           icon: 'assets/icons/sf-icons/network.svg',   color: '#0085ff', blurb: 'Posts.' },
    website:       { label: 'Website',        fa: 'fas fa-globe',           icon: 'assets/icons/sf-icons/network.svg',   color: '#5e5ce6', blurb: 'Personal website.' }
};

const PRONOUNS = {
    he:   { subject: 'he',   object: 'him',  possessive: 'his',   be: 'is',  have: 'has',  contraction: 'he’s' },
    she:  { subject: 'she',  object: 'her',  possessive: 'her',   be: 'is',  have: 'has',  contraction: 'she’s' },
    they: { subject: 'they', object: 'them', possessive: 'their', be: 'are', have: 'have', contraction: 'they’re' }
};

/** The shape of an empty info bank — what "Start from scratch" in the questionnaire begins with. */
const PROFILE_TEMPLATE = {
    name: '', pronouns: 'they', role: '', tagline: '', bio: '', focus: '', location: '', lookingFor: '',
    photo: '', handle: '', values: [],
    contact: { email: '', phone: '', linkedin: '', github: '' },
    socials: [],
    experience: [],
    education: { degree: '', university: '', years: '', grade: '', gradeLabel: 'GPA', schooling: [] },
    courses: [], certificates: [], projects: [], skills: [], writing: [], notes: [], cutIdeas: [],
    resume: { file: '', preview: '', updated: '' },
    site: { title: '', description: '', url: '', image: '' }
};

const capitalise = (s) => String(s || '').replace(/^./, c => c.toUpperCase());

const slugify = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';

const isGitHubUrl = (url) => /^https?:\/\/(www\.)?github\.com\//i.test(String(url || ''));

/** "https://github.com/someone/" → "someone" (or '' if it isn't a GitHub profile URL). */
function githubUserFrom(url) {
    const m = String(url || '').match(/github\.com\/([^/?#]+)/i);
    return m ? m[1] : '';
}

/** Escaped, lightly formatted note text: **bold**, *italic*, [links](url), "- " lists, "> " quotes, blank-line paragraphs. */
function renderNoteMarkup(text) {
    const inline = (s) => escapeProfileHtml(s)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    return String(text || '').split(/\n{2,}/).map(block => {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length && lines.every(l => /^[-•]\s+/.test(l))) {
            return `<div class="note-checklist">${lines.map(l => `<div class="checklist-item"><i class="fas fa-circle-check" aria-hidden="true"></i> <span>${inline(l.replace(/^[-•]\s+/, ''))}</span></div>`).join('')}</div>`;
        }
        if (lines.length && lines.every(l => l.startsWith('>'))) {
            return `<blockquote class="note-quote">${inline(lines.map(l => l.replace(/^>\s?/, '')).join(' '))}</blockquote>`;
        }
        return `<p>${lines.map(inline).join('<br>')}</p>`;
    }).join('');
}

// utils.js (escapeHtml) loads after the data files, so the schema carries its own.
function escapeProfileHtml(value) {
    return String(value === null || value === undefined ? '' : value)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function normalizeProfile(raw) {
    const p = raw || {};
    const str = (v, d = '') => (typeof v === 'string' && v.trim() ? v.trim() : d);
    const arr = (v) => (Array.isArray(v) ? v.filter(Boolean) : []);

    p.name = str(p.name, 'Your Name');
    p.first = p.name.split(/\s+/)[0];
    p.initials = p.name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
    p.pronouns = PRONOUNS[p.pronouns] ? p.pronouns : 'they';
    const pr = PRONOUNS[p.pronouns];
    p.pron = { ...pr, Subject: capitalise(pr.subject), Possessive: capitalise(pr.possessive), Contraction: capitalise(pr.contraction) };
    p.role = str(p.role, str(p.tagline).split(/[&,·|]/)[0].trim());
    p.tagline = str(p.tagline, p.role);
    p.bio = str(p.bio);
    p.focus = str(p.focus);
    p.location = str(p.location);
    p.lookingFor = str(p.lookingFor);
    p.photo = str(p.photo, 'assets/icons/filetype-contact.svg');
    p.handle = str(p.handle, slugify(p.name).replace(/-/g, '')).toLowerCase();
    p.values = arr(p.values).map(String);

    p.contact = { email: '', phone: '', linkedin: '', github: '', ...(p.contact || {}) };
    p.github = { url: str(p.contact.github), user: githubUserFrom(p.contact.github) };

    // Every link in one list: GitHub and LinkedIn from contact, then the rest.
    const own = [
        p.contact.github && { network: 'github', url: p.contact.github, handle: p.github.user ? `@${p.github.user}` : '' },
        p.contact.linkedin && { network: 'linkedin', url: p.contact.linkedin, handle: p.name }
    ].filter(Boolean);
    p.socials = arr(p.socials).filter(s => s.url);
    p.links = [...own, ...p.socials].map(s => {
        const meta = SOCIAL_NETWORKS[s.network] || SOCIAL_NETWORKS.website;
        return { network: SOCIAL_NETWORKS[s.network] ? s.network : 'website', label: str(s.label, meta.label), url: s.url, handle: str(s.handle), blurb: str(s.blurb, meta.blurb), fa: meta.fa, icon: meta.icon, color: meta.color };
    });
    p.link = (network) => p.links.find(l => l.network === network) || null;

    p.experience = arr(p.experience).map(x => ({ role: str(x.role), org: str(x.org), dates: str(x.dates), bullets: arr(x.bullets).map(String) }));
    const e = p.education || {};
    p.education = {
        degree: str(e.degree), university: str(e.university), years: str(e.years),
        grade: str(e.grade || e.cgpa), gradeLabel: str(e.gradeLabel, 'GPA'),
        schooling: arr(e.schooling).map(s => ({ title: str(s.title), school: str(s.school), year: str(s.year), score: str(s.score), detail: str(s.detail) }))
    };
    p.courses = arr(p.courses).map(c => ({ title: str(c.title), issuer: str(c.issuer), year: str(c.year), detail: str(c.detail) }));
    p.certificates = arr(p.certificates).filter(c => c.title).map(c => ({ title: str(c.title), issuer: str(c.issuer), image: str(c.image, str(c.file)), file: str(c.file, str(c.image)) }));

    const seen = new Set();
    p.projects = arr(p.projects).filter(x => x.name).map(x => {
        let id = slugify(x.id || x.name);
        while (seen.has(id)) id += '-2';
        seen.add(id);
        const link = str(x.link, str(x.repo));
        return {
            id, fsId: `proj-${id}`,
            name: str(x.name), title: str(x.title, str(x.name)), subtitle: str(x.subtitle, str(x.kind)), kind: str(x.kind, 'Project'),
            summary: str(x.summary, str(x.description)), description: str(x.description, str(x.summary)),
            highlights: arr(x.highlights).map(String), tags: arr(x.tags).map(t => String(t).toLowerCase()), aliases: arr(x.aliases).map(String),
            link, repo: str(x.repo, isGitHubUrl(x.link) ? x.link : ''),
            live: x.live !== undefined ? Boolean(x.live) : Boolean(link && !isGitHubUrl(link)),
            date: str(x.date), icon: str(x.icon, 'assets/icons/filetype-project.svg'),
            featured: Boolean(x.featured), demo: x.demo || null, category: x.category || null
        };
    });
    if (p.projects.length && !p.projects.some(x => x.featured)) (p.projects.find(x => x.live) || p.projects[0]).featured = true;

    // Skills as groups; an older { languages: [...] } object still works.
    const skills = Array.isArray(p.skills) ? p.skills : Object.entries(p.skills || {}).map(([k, items]) => ({ label: capitalise(k), items }));
    p.skills = skills.map(g => ({ label: str(g.label, 'Skills'), items: arr(g.items).map(String) })).filter(g => g.items.length);

    p.writing = arr(p.writing).filter(w => w.title).map(w => ({ title: str(w.title), topic: str(w.topic), summary: str(w.summary), url: str(w.url), minutes: Number(w.minutes) || 0 }));

    p.notes = arr(p.notes).filter(n => n.title || n.body).map((n, i) => {
        const when = n.date ? new Date(n.date) : null;
        const valid = when && !isNaN(when);
        return {
            id: `note-${i + 1}`, title: str(n.title, 'Note'), folder: str(n.folder, 'Notes'), body: str(n.body),
            html: renderNoteMarkup(n.body),
            dateLong: valid ? `${when.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} at ${when.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}` : '',
            dateShort: valid ? when.toLocaleDateString() : '',
            sortKey: valid ? when.getTime() : 0
        };
    });
    p.cutIdeas = arr(p.cutIdeas).filter(t => t.name).map(t => ({ name: str(t.name), kind: str(t.kind, 'Idea'), reason: str(t.reason) }));

    const r = p.resume || {};
    const file = str(r.file);
    p.resume = { file, preview: str(r.preview), updated: str(r.updated), downloadName: file ? file.split('/').pop() : '' };

    const s = p.site || {};
    p.siteDescription = str(s.description);   // only when the owner wrote one (setup/site-meta.js)
    p.site = {
        title: str(s.title, `${p.name} — Portfolio`),
        description: str(s.description, [p.tagline, p.bio].filter(Boolean).join('. ')),
        url: str(s.url),
        image: str(s.image)   // the link-preview card (1200×630); setup draws one if there isn't
    };
    return p;
}

// The setup questionnaire's live preview: show its unsaved draft instead.
if (window.PORTFOLIO_PREVIEW) {
    try {
        const draft = JSON.parse(localStorage.getItem('portfolio-setup-preview') || 'null');
        if (draft && draft.name) window.PROFILE_DATA = draft;
    } catch (e) { /* no draft — show the saved info bank */ }
}

if (!window.PROFILE_SCHEMA_ONLY) window.PROFILE_DATA = normalizeProfile(window.PROFILE_DATA);
