/* ==========================================================================
   Setup questionnaire — fill in the info bank, see it live, build it
   --------------------------------------------------------------------------
   Edits a draft of js/data/profile.js (the "info bank") step by step. The
   draft lives in this browser until you build, and the preview on the right
   is the real site rendering it (?preview=draft). Building sends the draft,
   uploaded files and service keys to the local setup server (`npm start` /
   `npm run setup`), which writes them into the repository. Without that
   server, Build downloads a profile.js to drop in by hand.

   With ?admin=1 (`npm run admin`) it's the owner's admin: no "start fresh",
   an admin home with every section and what's unpublished, edits that start
   from the live info bank, and a Publish button (setup/publish.js).
   ========================================================================== */

(function () {
    const ADMIN = new URLSearchParams(location.search).has('admin');
    const STATE_KEY = ADMIN ? 'portfolio-admin-state' : 'portfolio-setup-state';
    const PREVIEW_KEY = 'portfolio-setup-preview';
    let CURRENT = JSON.parse(JSON.stringify(window.PROFILE_DATA || {}));
    // An unsaved admin draft is only resumed if the info bank hasn't changed since.
    const baseOf = (p) => { let h = 0; for (const ch of JSON.stringify(p)) h = (h * 31 + ch.charCodeAt(0)) | 0; return h; };
    const NETWORKS = SOCIAL_NETWORKS;   // from js/data/profile-schema.js

    const $ = (sel, root = document) => root.querySelector(sel);
    const esc = (v) => String(v === null || v === undefined ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const clone = (v) => JSON.parse(JSON.stringify(v));
    const slug = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'me';
    const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || ''));
    const isUrl = (v) => !v || /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(String(v));
    const plural = (n, one, many = `${one}s`) => (n === 1 ? one : many);

    /* ── State ──────────────────────────────────────────────────────────── */
    let draft = null;          // the info bank being edited
    let uploads = {};          // assets/me/… path → data: URL, written on build
    let config = { web3formsKey: '', irisEndpoint: '' };
    let templateKey = '';      // the contact-form key the template shipped with
    let step = 0;
    let server = false;        // is the local setup server answering?
    let built = false;
    let leftovers = [];        // the previous info bank's files nothing uses now ({ path, kind })
    let tidied = 0;

    function blank() {
        const t = clone(PROFILE_TEMPLATE);
        t.pronouns = 'they';
        return t;
    }

    function ensureShape(p) {
        const t = blank();
        const out = { ...t, ...p };
        out.contact = { ...t.contact, ...(p.contact || {}) };
        out.education = { ...t.education, ...(p.education || {}) };
        out.education.schooling = out.education.schooling || [];
        out.resume = { ...t.resume, ...(p.resume || {}) };
        out.site = { ...t.site, ...(p.site || {}) };
        ['values', 'socials', 'experience', 'courses', 'certificates', 'projects', 'skills', 'writing', 'notes', 'cutIdeas', 'hackathons', 'events'].forEach(k => { if (!Array.isArray(out[k])) out[k] = []; });
        // Older info banks kept skills as { languages: [...] }.
        if (!Array.isArray(p.skills) && p.skills && typeof p.skills === 'object') out.skills = Object.entries(p.skills).map(([label, items]) => ({ label, items }));
        if (out.education.cgpa && !out.education.grade) out.education.grade = out.education.cgpa;
        delete out.education.cgpa;
        return out;
    }

    function persist() {
        try {
            localStorage.setItem(STATE_KEY, JSON.stringify({ draft, uploads, config, step, base: baseOf(CURRENT) }));
            flashSaved('Draft saved in this browser');
        } catch (e) {
            // Large uploads (a PDF) can exceed storage: keep the text, drop the files.
            try { localStorage.setItem(STATE_KEY, JSON.stringify({ draft, uploads: {}, config, step, base: baseOf(CURRENT) })); } catch (e2) { /* storage unavailable */ }
            flashSaved('Draft saved (files are kept until you close this tab)');
        }
    }

    let savedTimer = null;
    function flashSaved(text) {
        const el = $('#setup-saved');
        el.textContent = text;
        clearTimeout(savedTimer);
        savedTimer = setTimeout(() => { el.textContent = ''; }, 2200);
    }

    function restore() {
        try {
            const s = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
            if (s && s.draft && (!ADMIN || s.base === baseOf(CURRENT))) {
                draft = ensureShape(s.draft);
                uploads = s.uploads || {};
                config = { ...config, ...(s.config || {}) };
                step = Math.min(s.step || 0, STEPS.length - 1);
                return true;
            }
        } catch (e) { /* corrupt state — start over */ }
        return false;
    }

    /* ── Paths ──────────────────────────────────────────────────────────── */
    const parts = (path) => path.split('.').map(k => (/^\d+$/.test(k) ? Number(k) : k));
    function getPath(obj, path) { return parts(path).reduce((o, k) => (o === undefined || o === null ? undefined : o[k]), obj); }
    function setPath(obj, path, value) {
        const ks = parts(path);
        let o = obj;
        ks.slice(0, -1).forEach((k, i) => {
            if (o[k] === undefined || o[k] === null) o[k] = typeof ks[i + 1] === 'number' ? [] : {};
            o = o[k];
        });
        o[ks[ks.length - 1]] = value;
    }

    /** An image/file path from the info bank, as this page (in /setup/) can load it. */
    function assetSrc(path) {
        if (!path) return '';
        if (uploads[path]) return uploads[path];
        if (/^(data:|https?:)/.test(path)) return path;
        return `../${path}`;
    }

    /* ── Field rendering ────────────────────────────────────────────────── */
    /** Where something happened: venue and city, pinned on the map with OpenStreetMap's geocoder. */
    function placeField(f) {
        const pl = getPath(draft, f.path) || {};
        const located = typeof pl.lat === 'number' && typeof pl.lng === 'number';
        return `<div class="field wide place-field" data-place="${esc(f.path)}">
            <label>${esc(f.label || 'Where')}</label>
            <div class="place-row">
                <input type="text" data-path="${esc(f.path)}.name" value="${esc(pl.name || '')}" placeholder="${esc(f.placeholder || 'Venue')}" aria-label="Venue">
                <input type="text" data-path="${esc(f.path)}.city" value="${esc(pl.city || '')}" placeholder="City" aria-label="City">
                <button type="button" class="btn small" data-act="locate" data-path="${esc(f.path)}"><i class="fas fa-location-crosshairs"></i> ${located ? 'Re-pin' : 'Pin it'}</button>
            </div>
            <small class="field-hint place-status">${located
                ? `<i class="fas fa-location-dot"></i> On the map at ${pl.lat.toFixed(4)}, ${pl.lng.toFixed(4)} · <a href="https://www.openstreetmap.org/?mlat=${pl.lat}&amp;mlon=${pl.lng}#map=16/${pl.lat}/${pl.lng}" target="_blank" rel="noopener noreferrer">check it</a>`
                : (f.hint || 'Optional. Pin it to put it on the Maps app.')}</small>
        </div>`;
    }

    function field(f) {
        if (f.type === 'place') return placeField(f);
        const raw = getPath(draft, f.path);
        const id = `f-${f.path.replace(/\./g, '-')}`;
        let value = raw;
        if (f.type === 'lines') value = (raw || []).join('\n');
        if (f.type === 'tags') value = (raw || []).join(', ');
        const common = `id="${id}" data-path="${esc(f.path)}" data-type="${f.type || 'text'}" ${f.required ? 'required aria-required="true"' : ''} ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ''}`;
        let control;
        if (f.type === 'textarea' || f.type === 'lines') {
            control = `<textarea ${common} rows="${f.rows || (f.type === 'lines' ? 4 : 3)}">${esc(value)}</textarea>`;
        } else if (f.type === 'select') {
            control = `<select ${common}>${f.options.map(([v, l]) => `<option value="${esc(v)}" ${String(value) === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
        } else if (f.type === 'toggle') {
            const on = raw === undefined || raw === '' ? Boolean(f.default) : Boolean(raw);
            control = `<label class="switch"><input type="checkbox" ${common} ${on ? 'checked' : ''}><span></span></label>`;
        } else {
            const inputType = { email: 'email', url: 'url', number: 'number' }[f.type] || 'text';
            control = `<input type="${inputType}" ${common} value="${esc(value)}" ${f.type === 'url' ? 'inputmode="url" autocapitalize="off"' : ''} ${f.type === 'email' ? 'autocomplete="email"' : ''}>`;
        }
        return `<div class="field ${f.wide ? 'wide' : ''} ${f.type === 'toggle' ? 'is-toggle' : ''}">
            <label for="${id}">${esc(f.label)}${f.required ? ' <em>required</em>' : ''}</label>
            ${control}
            ${f.hint ? `<small class="field-hint">${f.hint}</small>` : ''}
            <small class="field-error" data-error-for="${esc(f.path)}"></small>
        </div>`;
    }

    const grid = (fields) => `<div class="field-grid">${fields.map(field).join('')}</div>`;

    /** A list of cards (experience, projects…) with add / reorder / remove. */
    function repeatable(cfg) {
        const items = getPath(draft, cfg.path) || [];
        return `<div class="cards" data-list="${esc(cfg.path)}">
            ${items.map((item, i) => `
            <article class="card">
                <header class="card-head">
                    <span class="card-index">${i + 1}</span>
                    <strong class="card-title" data-card-title="${esc(cfg.path)}.${i}">${esc(cfg.title(item, i))}</strong>
                    <div class="card-actions">
                        <button type="button" data-act="up" data-list="${esc(cfg.path)}" data-index="${i}" aria-label="Move up" ${i === 0 ? 'disabled' : ''}><i class="fas fa-chevron-up"></i></button>
                        <button type="button" data-act="down" data-list="${esc(cfg.path)}" data-index="${i}" aria-label="Move down" ${i === items.length - 1 ? 'disabled' : ''}><i class="fas fa-chevron-down"></i></button>
                        <button type="button" data-act="remove" data-list="${esc(cfg.path)}" data-index="${i}" aria-label="Remove"><i class="fas fa-trash-can"></i></button>
                    </div>
                </header>
                ${cfg.extra ? cfg.extra(item, i) : ''}
                ${grid(cfg.fields.map(f => ({ ...f, path: `${cfg.path}.${i}.${f.key}` })))}
            </article>`).join('')}
            <button type="button" class="add-card" data-act="add" data-list="${esc(cfg.path)}"><i class="fas fa-plus"></i> ${esc(cfg.addLabel)}</button>
            ${!items.length && cfg.emptyHint ? `<p class="empty-hint">${cfg.emptyHint}</p>` : ''}
        </div>`;
    }

    const LIST_DEFAULTS = {
        experience: () => ({ role: '', org: '', dates: '', bullets: [] }),
        'education.schooling': () => ({ title: '', school: '', year: '', score: '' }),
        courses: () => ({ title: '', issuer: '', year: '' }),
        socials: () => ({ network: 'website', handle: '', url: '' }),
        projects: () => ({ name: '', subtitle: '', description: '', link: '', repo: '', tags: [], date: '' }),
        skills: () => ({ label: '', items: [] }),
        certificates: () => ({ title: '', issuer: '' }),
        writing: () => ({ title: '', url: '', topic: '', summary: '' }),
        notes: () => ({ title: '', folder: 'Notes', date: new Date().toISOString().slice(0, 16), body: '' }),
        cutIdeas: () => ({ name: '', kind: '', reason: '' }),
        hackathons: () => ({ name: '', date: '', result: '', project: '' }),
        events: () => ({ name: '', date: '', detail: '' })
    };

    function upload(cfg) {
        const path = getPath(draft, cfg.path);
        const src = assetSrc(path);
        const isImage = cfg.accept.startsWith('image');
        return `<div class="upload ${cfg.round ? 'round' : ''}" data-upload="${esc(cfg.path)}" data-accept="${esc(cfg.accept)}" data-target="${esc(cfg.target)}" ${cfg.maxSide ? `data-max-side="${cfg.maxSide}"` : ''}>
            <div class="upload-art">${path ? (isImage ? `<img src="${esc(src)}" alt="">` : `<i class="${cfg.icon || 'fas fa-file'}"></i>`) : `<i class="${cfg.icon || 'fas fa-image'}"></i>`}</div>
            <div class="upload-text">
                <strong>${esc(cfg.label)}</strong>
                <small>${path ? esc(path.split('/').pop()) : esc(cfg.hint || '')}</small>
                <div class="upload-actions">
                    <label class="btn small"><input type="file" accept="${esc(cfg.accept)}" hidden>${path ? 'Replace' : 'Choose…'}</label>
                    ${path ? `<button type="button" class="btn small ghost" data-act="clear-upload" data-path="${esc(cfg.path)}">Remove</button>` : ''}
                </div>
            </div>
        </div>`;
    }

    function intro(title, text) {
        return `<div class="step-intro"><h1>${title}</h1><p>${text}</p></div>`;
    }

    /* ── Steps ──────────────────────────────────────────────────────────── */
    const STEPS = [
        {
            id: 'welcome', title: ADMIN ? 'Admin home' : 'Welcome', icon: ADMIN ? 'fa-house' : 'fa-hand-sparkles',
            render: () => ADMIN ? renderAdminHome() : `
                <div class="welcome">
                    <div class="welcome-hero">
                        <img src="../assets/icons/favicon.svg" alt="">
                        <h1>Make this portfolio yours</h1>
                        <p>A few minutes of questions, and every app on both versions — the Mac desktop and the iPhone — will show your name, work and links. Nothing is published until you push it.</p>
                    </div>
                    <div class="choice-grid">
                        <button type="button" class="choice" data-act="start-fresh">
                            <i class="fas fa-seedling"></i><strong>Start from scratch</strong><span>A clean info bank. Best if you just cloned this.</span>
                        </button>
                        <button type="button" class="choice" data-act="start-current">
                            <i class="fas fa-pen-to-square"></i><strong>Edit the current details</strong><span>Start from ${esc(CURRENT.name || 'the info bank')} and change what you need.</span>
                        </button>
                        <label class="choice">
                            <i class="fas fa-file-import"></i><strong>Import an info bank</strong><span>A JSON file exported from this questionnaire.</span>
                            <input type="file" accept=".json,application/json" data-act="import" hidden>
                        </label>
                    </div>
                    <ul class="welcome-list">
                        <li><i class="fas fa-user"></i> A photo of you (optional)</li>
                        <li><i class="fas fa-file-pdf"></i> Your résumé as a PDF (optional)</li>
                        <li><i class="fas fa-link"></i> Links to your profiles and projects</li>
                    </ul>
                    ${draft ? `<p class="welcome-resume">You have a draft in progress — <button type="button" class="link-btn" data-act="goto" data-step="1">continue it</button>.</p>` : ''}
                    ${server ? '' : `<p class="notice"><i class="fas fa-circle-info"></i> Open this page with <code>npm start</code> (or <code>npm run setup</code>) to save straight into the project. Without it, you can still fill everything in and download the result.</p>`}
                </div>`
        },
        {
            id: 'you', title: 'About you', icon: 'fa-user',
            render: () => intro('About you', 'Who you are, in a sentence or two. This leads the About window, the iPhone Home Screen and Iris’s answers.') + `
                ${upload({ path: 'photo', target: 'assets/me/photo.jpg', accept: 'image/*', label: 'Your photo', hint: 'Square works best. Resized in your browser.', round: true, icon: 'fas fa-user', maxSide: 800 })}
                ${grid([
                    { path: 'name', label: 'Full name', required: true, placeholder: 'Ada Lovelace' },
                    { path: 'pronouns', label: 'Pronouns', type: 'select', options: [['she', 'she / her'], ['he', 'he / him'], ['they', 'they / them']], hint: 'Iris and the app copy use these.' },
                    { path: 'role', label: 'Role', placeholder: 'Software Engineer' },
                    { path: 'location', label: 'Based in', placeholder: 'London, UK' },
                    { path: 'tagline', label: 'Tagline', wide: true, placeholder: 'Software Engineer & Mathematician' },
                    { path: 'bio', label: 'Short bio', type: 'textarea', wide: true, rows: 4, placeholder: 'Two or three sentences about what you build and why.' },
                    { path: 'focus', label: 'Focus', placeholder: 'Distributed systems, developer tools' },
                    { path: 'lookingFor', label: 'Looking for', placeholder: 'backend and platform roles', hint: 'Shown in Mail’s first message: “I’m looking for …”' }
                ])}`,
            validate: () => (String(draft.name || '').trim() ? null : { path: 'name', message: 'Add your name to continue.' })
        },
        {
            id: 'contact', title: 'Contact & links', icon: 'fa-at',
            render: () => intro('Contact & links', 'How visitors reach you. Everything here is public on the site.') + `
                ${grid([
                    { path: 'contact.email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
                    { path: 'contact.phone', label: 'Phone', placeholder: '+1 555 0100', hint: 'Optional.' },
                    { path: 'contact.linkedin', label: 'LinkedIn URL', type: 'url', placeholder: 'https://www.linkedin.com/in/you' },
                    { path: 'contact.github', label: 'GitHub URL', type: 'url', placeholder: 'https://github.com/you', hint: 'Powers the GitHub widgets on both versions.' }
                ])}
                <h2 class="sub">More profiles</h2>
                ${repeatable({
                    path: 'socials', addLabel: 'Add a profile',
                    title: (s) => (NETWORKS[s.network] || NETWORKS.website).label + (s.handle ? ` · ${s.handle}` : ''),
                    fields: [
                        { key: 'network', label: 'Network', type: 'select', options: Object.entries(NETWORKS).filter(([k]) => k !== 'github' && k !== 'linkedin').map(([k, n]) => [k, n.label]) },
                        { key: 'handle', label: 'Handle', placeholder: '@you' },
                        { key: 'url', label: 'URL', type: 'url', wide: true, placeholder: 'https://…' },
                        { key: 'blurb', label: 'One line about it', wide: true, placeholder: 'What people will find there' }
                    ]
                })}`,
            validate: () => {
                if (draft.contact.email && !isEmail(draft.contact.email)) return { path: 'contact.email', message: 'That email doesn’t look right.' };
                for (const k of ['linkedin', 'github']) if (!isUrl(draft.contact[k])) return { path: `contact.${k}`, message: 'Use a full link starting with https://' };
                return null;
            }
        },
        {
            id: 'experience', title: 'Experience', icon: 'fa-briefcase',
            render: () => intro('Experience', 'Roles, most recent first. Highlights become bullet points in the résumé views and evidence for Iris.') + repeatable({
                path: 'experience', addLabel: 'Add a role',
                title: (x) => [x.role, x.org].filter(Boolean).join(' · ') || 'New role',
                emptyHint: 'No roles yet. Internships, jobs, research positions all count.',
                fields: [
                    { key: 'role', label: 'Role', placeholder: 'Software Engineer' },
                    { key: 'org', label: 'Organisation', placeholder: 'Analytical Engines Ltd.' },
                    { key: 'dates', label: 'Dates', placeholder: 'Jan 2024 – Present' },
                    { key: 'bullets', label: 'Highlights', type: 'lines', wide: true, placeholder: 'One per line — what you did and what changed because of it' },
                    { key: 'place', label: 'Where', type: 'place', placeholder: 'Office or campus', hint: 'Optional. Leave it empty for remote work.' }
                ]
            })
        },
        {
            id: 'education', title: 'Education', icon: 'fa-graduation-cap',
            render: () => intro('Education', 'Your degree, earlier schooling and any courses.') + `
                ${grid([
                    { path: 'education.degree', label: 'Degree', placeholder: 'B.Sc. Computer Science' },
                    { path: 'education.university', label: 'University', placeholder: 'University of London' },
                    { path: 'education.years', label: 'Years', placeholder: '2021 – 2025' },
                    { path: 'education.grade', label: 'Grade', placeholder: '3.8', hint: 'Optional.' },
                    { path: 'education.gradeLabel', label: 'Grade label', placeholder: 'GPA', hint: 'GPA, CGPA, Grade, Class…' },
                    { path: 'education.place', label: 'Campus', type: 'place', placeholder: 'University campus' }
                ])}
                <h2 class="sub">Schooling</h2>
                ${repeatable({
                    path: 'education.schooling', addLabel: 'Add schooling',
                    title: (s) => [s.title, s.school].filter(Boolean).join(' · ') || 'New entry',
                    fields: [
                        { key: 'title', label: 'Level', placeholder: 'High School Diploma' },
                        { key: 'school', label: 'School', placeholder: 'Central High School' },
                        { key: 'year', label: 'Year', placeholder: '2021' },
                        { key: 'score', label: 'Result', placeholder: '92%' },
                        { key: 'place', label: 'Where', type: 'place', placeholder: 'School' }
                    ]
                })}
                <h2 class="sub">Courses</h2>
                ${repeatable({
                    path: 'courses', addLabel: 'Add a course',
                    title: (c) => c.title || 'New course',
                    fields: [
                        { key: 'title', label: 'Course', placeholder: 'Machine Learning Specialization' },
                        { key: 'issuer', label: 'Issuer', placeholder: 'Stanford Online' },
                        { key: 'year', label: 'Year', placeholder: '2024' }
                    ]
                })}`
        },
        {
            id: 'projects', title: 'Projects', icon: 'fa-cube',
            render: () => intro('Projects', 'Your work, as App Store product pages on the Mac and in Projects on iPhone. A project with a live link opens straight into it; one without uses its repository. Projects without an icon get one generated from their name.') + repeatable({
                path: 'projects', addLabel: 'Add a project',
                title: (x) => x.name || 'New project',
                emptyHint: 'No projects yet — add the ones you’d most like people to try.',
                extra: (x, i) => `<div class="upload-row">${upload({ path: `projects.${i}.icon`, target: `assets/me/project-${slug(x.name || `project-${i + 1}`)}.png`, accept: 'image/*', label: 'Icon', hint: 'Optional — generated if left empty.', icon: 'fas fa-cube', maxSide: 512 })}${upload({ path: `projects.${i}.video`, target: `assets/me/project-${slug(x.name || `project-${i + 1}`)}-demo.mp4`, accept: 'video/*', label: 'Demo clip', hint: 'MP4 or WebM, up to 40 MB — or paste a YouTube link below.', icon: 'fas fa-film' })}</div>`,
                fields: [
                    { key: 'name', label: 'Name', placeholder: 'Difference Engine' },
                    { key: 'subtitle', label: 'One-line description', placeholder: 'Mechanical calculator for polynomial tables' },
                    { key: 'description', label: 'About it', type: 'textarea', wide: true, placeholder: 'What it does, how it works, what you learned.' },
                    { key: 'link', label: 'Live link', type: 'url', placeholder: 'https://… (deployed app)' },
                    { key: 'repo', label: 'Repository', type: 'url', placeholder: 'https://github.com/you/project' },
                    { key: 'tags', label: 'Built with', type: 'tags', placeholder: 'Python, React, PostgreSQL' },
                    { key: 'date', label: 'When', placeholder: 'Mar 2025' },
                    { key: 'category', label: 'Category', placeholder: 'Web, AI, Design… (optional)' },
                    { key: 'video', label: 'Demo video', type: 'url', placeholder: 'https://youtu.be/… or a .mp4 link', hint: 'Optional. Plays on the project’s page.' },
                    { key: 'featured', label: 'Feature it first', type: 'toggle' },
                    { key: 'embed', label: 'Opens inside the iPhone version', type: 'toggle', default: true, hint: 'Turn off if the live site refuses to be embedded; it then opens in a browser tab.' }
                ]
            }),
            validate: () => {
                const bad = draft.projects.findIndex(x => !isUrl(x.link) || !isUrl(x.repo));
                return bad >= 0 ? { path: `projects.${bad}.link`, message: 'Use full links starting with https://' } : null;
            }
        },
        {
            id: 'hackathons', title: 'Hackathons & events', icon: 'fa-trophy',
            render: () => intro('Hackathons & events', 'Where you competed and what you showed up for. Each one you pin appears on the iPhone version’s Maps app, and Iris can talk about all of them.') + `
                ${repeatable({
                    path: 'hackathons', addLabel: 'Add a hackathon',
                    title: (h) => [h.name, h.result].filter(Boolean).join(' · ') || 'New hackathon',
                    emptyHint: 'Finalist, winner or just there to build — they all count.',
                    fields: [
                        { key: 'name', label: 'Hackathon', placeholder: 'HackMIT 2025' },
                        { key: 'result', label: 'Result', placeholder: 'Top 10 finalist' },
                        { key: 'date', label: 'When', placeholder: 'Sep 2025' },
                        { key: 'project', label: 'What you built', placeholder: 'Optional' },
                        { key: 'place', label: 'Where', type: 'place', placeholder: 'Venue or campus' }
                    ]
                })}
                <h2 class="sub">Events</h2>
                ${repeatable({
                    path: 'events', addLabel: 'Add an event',
                    title: (v) => v.name || 'New event',
                    emptyHint: 'Summits, expos and conferences you attended.',
                    fields: [
                        { key: 'name', label: 'Event', placeholder: 'PyCon 2025' },
                        { key: 'date', label: 'When', placeholder: 'May 2025' },
                        { key: 'detail', label: 'What you did there', wide: true, placeholder: 'Optional — spoke, volunteered, demoed…' },
                        { key: 'place', label: 'Where', type: 'place', placeholder: 'Venue' }
                    ]
                })}`
        },
        {
            id: 'skills', title: 'Skills', icon: 'fa-wand-magic-sparkles',
            render: () => intro('Skills', 'Group them the way you’d say them out loud. Separate skills with commas.') + repeatable({
                path: 'skills', addLabel: 'Add a group',
                title: (g) => g.label || 'New group',
                emptyHint: 'For example: Languages — Python, TypeScript, Go',
                fields: [
                    { key: 'label', label: 'Group', placeholder: 'Languages' },
                    { key: 'items', label: 'Skills', type: 'tags', wide: true, placeholder: 'Python, TypeScript, Go' }
                ]
            })
        },
        {
            id: 'documents', title: 'Résumé & certificates', icon: 'fa-file-pdf',
            render: () => intro('Résumé & certificates', 'The PDF opens in Preview on the Mac and the system viewer on iPhone. An image of the first page makes a nicer preview.') + `
                <div class="upload-row">
                    ${upload({ path: 'resume.file', target: `assets/me/${slug(draft.name)}-resume.pdf`, accept: 'application/pdf', label: 'Résumé (PDF)', hint: 'Up to 15 MB', icon: 'fas fa-file-pdf' })}
                    ${upload({ path: 'resume.preview', target: 'assets/me/resume-preview.jpg', accept: 'image/*', label: 'First-page image', hint: 'Optional — a screenshot of page one', icon: 'fas fa-image', maxSide: 1600 })}
                </div>
                ${grid([{ path: 'resume.updated', label: 'Last updated', placeholder: 'June 2025' }])}
                <h2 class="sub">Certificates <small>shown in Photos</small></h2>
                ${repeatable({
                    path: 'certificates', addLabel: 'Add a certificate',
                    title: (c) => c.title || 'New certificate',
                    extra: (c, i) => `<div class="upload-row">${upload({ path: `certificates.${i}.image`, target: `assets/me/cert-${i + 1}.jpg`, accept: 'image/*', label: 'Image', hint: 'A photo or screenshot', icon: 'fas fa-award', maxSide: 1200 })}${upload({ path: `certificates.${i}.file`, target: `assets/me/cert-${i + 1}.pdf`, accept: 'application/pdf', label: 'PDF', hint: 'Optional', icon: 'fas fa-file-pdf' })}</div>`,
                    fields: [
                        { key: 'title', label: 'Title', placeholder: 'Cloud Practitioner' },
                        { key: 'issuer', label: 'Issuer', placeholder: 'AWS' }
                    ]
                })}`
        },
        {
            id: 'extras', title: 'Notes & extras', icon: 'fa-note-sticky',
            render: () => intro('Notes & extras', 'All optional — the small things that make a portfolio feel like a person.') + `
                <details class="extra" open>
                    <summary><i class="fas fa-heart"></i> What you care about <small>README and Terminal</small></summary>
                    ${grid([{ path: 'values', label: 'Principles', type: 'lines', wide: true, placeholder: 'One per line — e.g. Ship small, measure, repeat.' }])}
                </details>
                <details class="extra">
                    <summary><i class="fas fa-note-sticky"></i> Notes <small>the Notes app</small></summary>
                    <p class="field-hint">Write plainly. <code>**bold**</code>, <code>- list item</code> and <code>&gt; quote</code> are formatted.</p>
                    ${repeatable({
                        path: 'notes', addLabel: 'Add a note',
                        title: (n) => n.title || 'New note',
                        fields: [
                            { key: 'title', label: 'Title', placeholder: 'What I’m learning' },
                            { key: 'folder', label: 'Folder', placeholder: 'Notes' },
                            { key: 'body', label: 'Note', type: 'textarea', wide: true, rows: 5 }
                        ]
                    })}
                </details>
                <details class="extra">
                    <summary><i class="fas fa-pen-nib"></i> Writing <small>Safari’s reading list</small></summary>
                    ${repeatable({
                        path: 'writing', addLabel: 'Add an article',
                        title: (w) => w.title || 'New article',
                        fields: [
                            { key: 'title', label: 'Title' },
                            { key: 'url', label: 'Link', type: 'url', placeholder: 'https://…' },
                            { key: 'topic', label: 'Topic', placeholder: 'Systems' },
                            { key: 'minutes', label: 'Minutes to read', type: 'number' },
                            { key: 'summary', label: 'Summary', wide: true }
                        ]
                    })}
                </details>
                <details class="extra">
                    <summary><i class="fas fa-trash-can"></i> Ideas you cut <small>the Trash</small></summary>
                    ${repeatable({
                        path: 'cutIdeas', addLabel: 'Add an idea',
                        title: (t) => t.name || 'New idea',
                        fields: [
                            { key: 'name', label: 'File name', placeholder: 'blockchain-portfolio.idea' },
                            { key: 'kind', label: 'Kind', placeholder: 'Abandoned Concept' },
                            { key: 'reason', label: 'Why you cut it', type: 'textarea', wide: true }
                        ]
                    })}
                </details>`
        },
        {
            id: 'site', title: 'Site & services', icon: 'fa-globe',
            render: () => {
                const stale = staleKey();
                return intro('Site & services', 'Where the site will live, and the two services it can use.') + `
                ${grid([{ path: 'site.url', label: 'Your site’s address', type: 'url', wide: true, placeholder: guessSiteUrl() || 'https://you.github.io/MacOS_Portfolio/', hint: 'Used in link previews. With GitHub Pages it’s https://&lt;your-username&gt;.github.io/&lt;repository&gt;/' }])}
                <div class="service">
                    <div class="service-head"><i class="fas fa-paper-plane"></i><div><strong>Contact form</strong><small>Mail on both versions sends visitors’ messages to your inbox through <a href="https://web3forms.com" target="_blank" rel="noopener noreferrer">Web3Forms</a> (free, no backend). Paste your access key.</small></div></div>
                    <input type="text" data-config="web3formsKey" value="${esc(config.web3formsKey)}" placeholder="Access key from web3forms.com" autocomplete="off" spellcheck="false" aria-label="Web3Forms access key">
                    ${stale ? '<p class="warning"><i class="fas fa-triangle-exclamation"></i> This is the previous owner’s key, so it won’t be kept — messages would go to them. Paste your own, or Mail will offer visitors their own mail app.</p>' : ''}
                    ${!config.web3formsKey ? '<p class="field-hint">Left empty, Mail offers to open the visitor’s own mail app instead.</p>' : ''}
                </div>
                <div class="service">
                    <div class="service-head"><i class="fas fa-wand-magic-sparkles"></i><div><strong>Iris’s hosted model</strong><small>Optional. Iris answers from your info bank without one; with a deployed <code>api/iris.js</code> endpoint it phrases answers with a language model. On Vercel, <code>/api/iris</code> is enough; from another host, use the full address.</small></div></div>
                    <input type="text" inputmode="url" data-config="irisEndpoint" value="${esc(config.irisEndpoint)}" placeholder="/api/iris" autocomplete="off" spellcheck="false" aria-label="Iris endpoint">
                </div>`;
            },
            validate: () => (isUrl(draft.site.url) ? null : { path: 'site.url', message: 'Use a full address starting with https://' })
        },
        {
            id: 'review', title: 'Review & build', icon: 'fa-rocket',
            render: renderReview
        }
    ];

    /** The template's contact-form key, kept by someone else: their visitors' messages would go to the previous owner. */
    function staleKey() {
        return Boolean(templateKey) && config.web3formsKey === templateKey && draft.name !== CURRENT.name;
    }

    function guessSiteUrl() {
        const gh = String(draft.contact.github || '').match(/github\.com\/([^/?#]+)/i);
        return gh ? `https://${gh[1].toLowerCase()}.github.io/MacOS_Portfolio/` : '';
    }

    function checklist() {
        const p = draft;
        return [
            [Boolean(p.name), 'Name', 'Required'],
            [Boolean(p.photo), 'Photo', 'The About window and Home Screen show your initials instead'],
            [Boolean(p.bio), 'Bio', 'The About window will be thin'],
            [Boolean(p.contact.email), 'Email', 'Visitors can still message you through Mail'],
            [p.experience.length > 0, 'Experience', 'Optional'],
            [p.projects.length > 0, 'Projects', 'The App Store and Projects will be empty'],
            [p.skills.length > 0, 'Skills', 'Optional'],
            [Boolean(p.resume.file), 'Résumé', 'The Résumé app will say there isn’t one yet'],
            [Boolean(config.web3formsKey) && !staleKey(), 'Contact form key', 'Mail falls back to the visitor’s mail app']
        ];
    }

    function renderReview() {
        if (built) return renderDone();
        const p = draft;
        return intro('Review & build', 'Here’s what will be written. You can come back and change anything — run <code>npm run setup</code> again any time.') + `
            <div class="review-card">
                <img src="${esc(assetSrc(p.photo) || '../assets/icons/filetype-contact.svg')}" alt="">
                <div><strong>${esc(p.name || 'Your name')}</strong><span>${esc(p.tagline || p.role || '')}</span></div>
            </div>
            <ul class="checklist">${checklist().map(([ok, label, note]) => `<li class="${ok ? 'ok' : 'missing'}"><i class="fas ${ok ? 'fa-circle-check' : 'fa-circle-minus'}"></i><strong>${esc(label)}</strong>${ok ? '' : `<small>${esc(note)}</small>`}</li>`).join('')}</ul>
            <div class="stats-row">
                <div><strong>${p.experience.length}</strong><span>${plural(p.experience.length, 'role')}</span></div>
                <div><strong>${p.projects.length}</strong><span>${plural(p.projects.length, 'project')}</span></div>
                <div><strong>${skillCount(p)}</strong><span>${plural(skillCount(p), 'skill')}</span></div>
                <div><strong>${Object.keys(referencedUploads()).length}</strong><span>${plural(Object.keys(referencedUploads()).length, 'file')}</span></div>
            </div>
            <p class="field-hint center share-label">When you share your link</p>
            <div class="share-preview">
                <img id="share-preview-img" alt="The link preview Messages, Slack and LinkedIn will show">
                <div><strong>${esc(`${p.name || 'Your name'} - macOS Portfolio`)}</strong><span>${esc((p.site.url || guessSiteUrl()).replace(/^https?:\/\//, '').split('/')[0] || 'your-site.github.io')}</span></div>
            </div>
            ${server
                ? '<p class="field-hint center">Building writes <code>js/data/profile.js</code>, your files in <code>assets/me/</code>, the page titles and link previews.</p>'
                : '<p class="field-hint center">No setup server is running, so this downloads a <code>profile.js</code> with your photos embedded — replace <code>js/data/profile.js</code> with it. Running <code>npm start</code> instead lets this page save everything for you.</p>'}
            <p class="build-error" id="build-error" role="alert"></p>`;
    }

    function renderDone() {
        if (ADMIN) {
            return `<div class="done-screen">
                <div class="done-badge"><i class="fas fa-check"></i></div>
                <h1>Saved</h1>
                <p>Your changes are saved on this computer. Both the Mac and iPhone versions use them. Publish to put them live.</p>
                <div class="admin-publish" id="admin-publish"></div>
                ${renderTidy()}
                <div class="done-actions">
                    <a class="btn" href="../?view=mac" target="_blank" rel="noopener"><i class="fas fa-laptop"></i> Mac version</a>
                    <a class="btn" href="../ios.html?view=ios" target="_blank" rel="noopener"><i class="fas fa-mobile-screen"></i> iPhone version</a>
                </div>
                <button type="button" class="link-btn" data-act="goto" data-step="0">Back to admin home</button>
            </div>`;
        }
        return `<div class="done-screen">
            <div class="done-badge"><i class="fas fa-check"></i></div>
            <h1>${server ? 'It’s yours' : 'Downloaded'}</h1>
            <p>${server ? 'The info bank and your files are saved. Have a look, then publish it.' : 'Put the file in place, then publish it.'}</p>
            ${server ? `<div class="done-actions">
                <a class="btn primary" href="../?view=mac" target="_blank" rel="noopener"><i class="fas fa-laptop"></i> Open the Mac version</a>
                <a class="btn" href="../ios.html?view=ios" target="_blank" rel="noopener"><i class="fas fa-mobile-screen"></i> Open the iPhone version</a>
            </div>` : ''}
            ${renderTidy()}
            <ol class="publish">
                ${server ? '' : `<li><strong>Replace the info bank</strong><span>Move the downloaded <code>profile.js</code> to <code>js/data/profile.js</code> — your photos are embedded in it.</span></li>
                <li><strong>Update the page titles and link previews</strong><code>node setup/apply.js refresh</code></li>`}
                <li><strong>Commit it</strong><code>git add -A &amp;&amp; git commit -m "Make the portfolio mine"</code></li>
                <li><strong>Push to your GitHub repository</strong><code>git push</code></li>
                <li><strong>Turn on GitHub Pages</strong><span>Repository → Settings → Pages → Deploy from a branch → <em>main</em> / root. Your link: ${esc(draft.site.url || guessSiteUrl() || 'https://<you>.github.io/<repository>/')}</span></li>
            </ol>
            <button type="button" class="link-btn" data-act="goto" data-step="1">Keep editing</button>
        </div>`;
    }

    /** The owner's start page: every section, and what's waiting to be published. */
    function renderAdminHome() {
        const p = draft || CURRENT;
        const sections = [
            [1, 'fa-user', 'About you', p.tagline || 'Name, photo, bio'],
            [2, 'fa-at', 'Contact & links', [p.contact.email, `${(p.socials || []).length} other profiles`].filter(Boolean).join(' · ')],
            [3, 'fa-briefcase', 'Experience', `${p.experience.length} role${p.experience.length === 1 ? '' : 's'}`],
            [4, 'fa-graduation-cap', 'Education', p.education.degree || 'Degree and schooling'],
            [5, 'fa-cube', 'Projects', `${p.projects.length} projects · videos, links, icons`],
            [6, 'fa-trophy', 'Hackathons & events', `${(p.hackathons || []).length} hackathons · ${(p.events || []).length} events`],
            [7, 'fa-wand-magic-sparkles', 'Skills', `${p.skills.length} groups`],
            [8, 'fa-file-pdf', 'Résumé & certificates', `${p.resume.file ? 'Résumé' : 'No résumé'} · ${p.certificates.length} certificates`],
            [9, 'fa-note-sticky', 'Notes & extras', `${(p.notes || []).length} notes`],
            [10, 'fa-globe', 'Site & services', p.site.url || 'Address, contact form, Iris']
        ].filter(([i]) => STEPS[i]);
        setTimeout(loadPublishing, 0);
        return `
            <div class="admin-home">
                <header class="admin-hero">
                    <img src="${esc(assetSrc(p.photo) || '../assets/icons/filetype-contact.svg')}" alt="">
                    <div>
                        <h1>Welcome back${p.name ? `, ${esc(String(p.name).split(/\s+/)[0])}` : ''}</h1>
                        <p>Change anything here and both the Mac and iPhone versions follow. Nothing goes live until you publish. This page only exists on your computer.</p>
                    </div>
                </header>
                <div class="admin-publish" id="admin-publish"></div>
                <div class="admin-grid">${sections.map(([i, icon, title, sub]) => `
                    <button type="button" class="admin-card" data-act="goto" data-step="${i}">
                        <i class="fas ${icon}"></i><strong>${esc(title)}</strong><small>${esc(sub)}</small>
                    </button>`).join('')}
                </div>
            </div>`;
    }

    async function loadPublishing() {
        const box = $('#admin-publish');
        if (!box || !server) return;
        try {
            const st = await (await fetch('/__setup/publishing', { cache: 'no-store' })).json();
            if (!st.repo || !st.remote) { box.innerHTML = '<p class="admin-note"><i class="fas fa-circle-info"></i> This copy isn’t connected to GitHub, so Publish is off. Your saves still work.</p>'; return; }
            const pending = st.changed.length + (st.ahead ? 1 : 0);
            box.innerHTML = pending ? `
                <div class="admin-pending">
                    <div><strong>${st.changed.length ? `${st.changed.length} unpublished change${st.changed.length === 1 ? '' : 's'}` : 'Saved, not yet pushed'}</strong>
                    <small>Publishes to <b>${esc(st.branch)}</b> on GitHub${st.branch !== 'main' ? ' — the live site deploys from main' : ' — live in about a minute'}.</small>
                    ${st.changed.length ? `<details><summary>Files</summary><ul>${st.changed.slice(0, 40).map(f => `<li><code>${esc(f)}</code></li>`).join('')}</ul></details>` : ''}</div>
                    <button type="button" class="btn primary" data-act="publish"><i class="fas fa-cloud-arrow-up"></i> Publish</button>
                </div>` : `<p class="admin-note ok"><i class="fas fa-circle-check"></i> Everything is published to <b>${esc(st.branch)}</b>.</p>`;
        } catch (e) {
            box.innerHTML = '';
        }
    }

    async function publishNow(btn) {
        const box = $('#admin-publish');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing…';
        try {
            const res = await fetch('/__setup/publish', { method: 'POST' });
            const out = await res.json();
            if (!res.ok) throw new Error(out.error || 'Publishing failed.');
            box.innerHTML = out.published
                ? `<p class="admin-note ok"><i class="fas fa-circle-check"></i> Published to <b>${esc(out.branch)}</b> (${esc(out.commit)}). ${out.branch === 'main' ? 'The live site updates in about a minute.' : 'Merge it into main to put it live.'}</p>`
                : `<p class="admin-note ok"><i class="fas fa-circle-check"></i> ${esc(out.message)}</p>`;
        } catch (e) {
            box.insertAdjacentHTML('beforeend', `<p class="build-error">${esc(e.message)}</p>`);
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-cloud-arrow-up"></i> Publish';
        }
    }

    function renderTidy() {
        if (tidied) return `<p class="tidy-done"><i class="fas fa-circle-check"></i> Removed ${tidied} unused ${plural(tidied, 'file')}.</p>`;
        if (!leftovers.length) return '';
        const kinds = [...new Set(leftovers.map(l => l.kind))].join(', ');
        return `<div class="tidy">
            <div><strong>Tidy up</strong><span>${leftovers.length} ${plural(leftovers.length, 'file')} from the previous info bank (${esc(kinds)}) ${plural(leftovers.length, 'isn’t', 'aren’t')} used any more — GitHub Pages would still publish ${plural(leftovers.length, 'it', 'them')}.</span></div>
            <button type="button" class="btn" data-act="tidy"><i class="fas fa-broom"></i> Remove ${plural(leftovers.length, 'it', 'them')}</button>
        </div>`;
    }

    async function tidy() {
        const btn = document.querySelector('[data-act="tidy"]');
        btn.disabled = true;
        try {
            const out = await (await fetch('/__setup/tidy', { method: 'POST' })).json();
            tidied = (out.removed || []).length;
            leftovers = [];
            render();
        } catch (e) {
            btn.disabled = false;
        }
    }

    /** Finds a venue with OpenStreetMap's geocoder (one request per click, as its usage policy asks). */
    async function locate(btn) {
        const path = btn.dataset.path;
        const pl = getPath(draft, path) || {};
        const status = btn.closest('[data-place]').querySelector('.place-status');
        const q = [pl.name, pl.city].filter(Boolean).join(', ');
        if (!q) { status.textContent = 'Type the venue and city first.'; return; }
        btn.disabled = true;
        status.textContent = 'Looking it up…';
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=en&q=${encodeURIComponent(q)}`);
            const [hit] = await res.json();
            if (!hit) {
                // A shorter query often finds what a full address doesn't.
                status.textContent = pl.city && pl.name ? `Couldn’t find “${q}”. Try a shorter venue name, or just the city.` : `Couldn’t find “${q}”.`;
                return;
            }
            setPath(draft, path, { ...pl, lat: Number(Number(hit.lat).toFixed(5)), lng: Number(Number(hit.lon).toFixed(5)) });
            changed();
            render();
        } catch (e) {
            status.textContent = 'The map service didn’t answer. Check your connection and try again.';
        } finally {
            btn.disabled = false;
        }
    }

    /* ── Rendering ──────────────────────────────────────────────────────── */
    function render() {
        const s = STEPS[step];
        $('#setup-step').innerHTML = s.render();
        $('#setup-step').dataset.step = s.id;
        if (s.id === 'review' && !built) paintSharePreview();
        if (s.id === 'review' && built && ADMIN) setTimeout(loadPublishing, 0);
        $('#setup-steps').innerHTML = STEPS.map((x, i) => `
            <li class="${i === step ? 'current' : ''} ${i < step || (draft && i > 0 && stepDone(i)) ? 'done' : ''}">
                <button type="button" data-act="goto" data-step="${i}" ${!draft && i > 0 ? 'disabled' : ''} ${i === step ? 'aria-current="step"' : ''}>
                    <span class="step-dot"><i class="fas ${x.icon}"></i></span><span>${esc(x.title)}</span>
                </button>
            </li>`).join('');
        $('#setup-progress-bar').style.width = `${(step / (STEPS.length - 1)) * 100}%`;
        $('.preview-note').textContent = built ? 'Saved — this is your site now.' : 'Unsaved changes, shown with the real site. Nothing is written until you build.';
        $('#setup-back').hidden = step === 0 || (built && step === STEPS.length - 1);
        // On the last step the primary button builds, so it's never below the fold.
        const next = $('#setup-next');
        const last = step === STEPS.length - 1;
        next.hidden = step === 0 || (last && built);
        next.disabled = false;
        next.innerHTML = last ? (server ? (ADMIN ? '<i class="fas fa-floppy-disk"></i> Save changes' : '<i class="fas fa-hammer"></i> Build my portfolio') : '<i class="fas fa-download"></i> Download profile.js')
            : step === STEPS.length - 2 ? 'Review <i class="fas fa-arrow-right"></i>' : 'Continue <i class="fas fa-arrow-right"></i>';
        $('#setup-hint-text').textContent = '';
        $('.setup-main').scrollTop = 0;
        window.scrollTo(0, 0);
        const first = $('#setup-step input:not([type=file]):not([type=checkbox]), #setup-step textarea');
        if (first && step > 0 && !built && document.activeElement === document.body) first.focus({ preventScroll: true });
    }

    function stepDone(i) {
        const id = STEPS[i].id;
        const p = draft;
        return ({
            you: Boolean(p.name), contact: Boolean(p.contact.email || p.contact.github || p.contact.linkedin), experience: p.experience.length > 0,
            education: Boolean(p.education.degree), projects: p.projects.length > 0, hackathons: p.hackathons.length + p.events.length > 0, skills: p.skills.length > 0,
            documents: Boolean(p.resume.file), extras: p.notes.length > 0 || p.values.length > 0, site: Boolean(p.site.url)
        })[id] || false;
    }

    function showError(err) {
        document.querySelectorAll('.field.invalid').forEach(f => f.classList.remove('invalid'));
        document.querySelectorAll('.field-error').forEach(e => { e.textContent = ''; });
        if (!err) return;
        const slot = document.querySelector(`[data-error-for="${CSS.escape(err.path)}"]`);
        if (slot) {
            slot.textContent = err.message;
            slot.closest('.field').classList.add('invalid');
            const input = document.querySelector(`[data-path="${CSS.escape(err.path)}"]`);
            if (input) input.focus();
        }
        $('#setup-hint-text').textContent = err.message;
    }

    function go(to) {
        if (!draft && to > 0) return;
        if (to > step) {
            const err = STEPS[step].validate && STEPS[step].validate();
            if (err) { showError(err); return; }
        }
        step = Math.max(0, Math.min(STEPS.length - 1, to));
        persist();
        render();
    }

    /* ── Input handling ─────────────────────────────────────────────────── */
    function parseValue(el) {
        const type = el.dataset.type;
        if (type === 'toggle') return el.checked;
        if (type === 'lines') return el.value.split('\n').map(s => s.trim()).filter(Boolean);
        if (type === 'tags') return el.value.split(',').map(s => s.trim()).filter(Boolean);
        if (type === 'number') return el.value === '' ? '' : Number(el.value);
        return el.value;
    }

    let saveTimer = null;
    function changed() {
        built = false;   // something new to build
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => { persist(); updatePreview(); }, 500);
    }

    document.addEventListener('input', (e) => {
        const el = e.target;
        if (el.dataset.path) {
            setPath(draft, el.dataset.path, parseValue(el));
            // Keep card titles in step with what's typed.
            const m = el.dataset.path.match(/^(.*)\.(\d+)\.[^.]+$/);
            if (m) {
                const titleEl = document.querySelector(`[data-card-title="${CSS.escape(`${m[1]}.${m[2]}`)}"]`);
                const cfgTitle = TITLE_FOR[m[1]];
                if (titleEl && cfgTitle) titleEl.textContent = cfgTitle(getPath(draft, `${m[1]}.${m[2]}`));
            }
            el.closest('.field') && el.closest('.field').classList.remove('invalid');
            const placeBox = el.closest('[data-place]');
            if (placeBox) {
                const pl = getPath(draft, placeBox.dataset.place);
                if (pl && pl.lat !== undefined) {
                    delete pl.lat;
                    delete pl.lng;
                    placeBox.querySelector('.place-status').textContent = 'Changed — pin it again to update the map.';
                }
            }
            changed();
        } else if (el.dataset.config) {
            config[el.dataset.config] = el.value.trim();
            changed();
        }
    });
    document.addEventListener('change', (e) => {
        const el = e.target;
        if (el.dataset.path && (el.tagName === 'SELECT' || el.type === 'checkbox')) { setPath(draft, el.dataset.path, parseValue(el)); changed(); }
        if (el.type === 'file' && el.closest('[data-upload]')) handleUpload(el);
        if (el.type === 'file' && (el.dataset.act === 'import' || el.id === 'setup-import')) handleImport(el);
    });

    const TITLE_FOR = {
        experience: (x) => [x.role, x.org].filter(Boolean).join(' · ') || 'New role',
        projects: (x) => x.name || 'New project',
        skills: (g) => g.label || 'New group',
        socials: (s) => (NETWORKS[s.network] || NETWORKS.website).label + (s.handle ? ` · ${s.handle}` : ''),
        'education.schooling': (s) => [s.title, s.school].filter(Boolean).join(' · ') || 'New entry',
        courses: (c) => c.title || 'New course',
        certificates: (c) => c.title || 'New certificate',
        notes: (n) => n.title || 'New note',
        writing: (w) => w.title || 'New article',
        cutIdeas: (t) => t.name || 'New idea',
        hackathons: (h) => [h.name, h.result].filter(Boolean).join(' · ') || 'New hackathon',
        events: (v) => v.name || 'New event'
    };

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-act]');
        if (!btn || btn.tagName === 'INPUT') return;
        const act = btn.dataset.act;
        if (act === 'goto') { go(Number(btn.dataset.step)); return; }
        if (act === 'start-fresh') { draft = blank(); uploads = {}; config = { web3formsKey: '', irisEndpoint: '' }; built = false; go(1); updatePreview(); return; }
        if (act === 'start-current') { draft = ensureShape(clone(CURRENT)); uploads = {}; config = { ...config, web3formsKey: templateKey }; built = false; go(1); updatePreview(); return; }
        if (act === 'tidy') { tidy(); return; }
        if (act === 'publish') { publishNow(btn); return; }
        if (act === 'locate') { locate(btn); return; }
        if (act === 'clear-upload') {
            const old = getPath(draft, btn.dataset.path);
            delete uploads[old];
            setPath(draft, btn.dataset.path, '');
            changed();
            render();
            return;
        }
        const list = btn.dataset.list;
        if (!list) return;
        const items = getPath(draft, list) || [];
        const i = Number(btn.dataset.index);
        if (act === 'add') items.push(LIST_DEFAULTS[list] ? LIST_DEFAULTS[list]() : {});
        if (act === 'remove') items.splice(i, 1);
        if (act === 'up' && i > 0) [items[i - 1], items[i]] = [items[i], items[i - 1]];
        if (act === 'down' && i < items.length - 1) [items[i + 1], items[i]] = [items[i], items[i + 1]];
        setPath(draft, list, items);
        changed();
        render();
        if (act === 'add') {
            const cards = document.querySelectorAll(`[data-list="${CSS.escape(list)}"] .card`);
            const last = cards[cards.length - 1];
            if (last) { last.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' }); const f = last.querySelector('input, textarea'); if (f) f.focus({ preventScroll: true }); }
        }
    });

    $('#setup-next').addEventListener('click', () => {
        if (step < STEPS.length - 1) go(step + 1);
        else if (server) build();
        else download();
    });
    $('#setup-back').addEventListener('click', () => go(step - 1));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && step < STEPS.length - 1 && draft) go(step + 1);
    });

    /* ── Files ──────────────────────────────────────────────────────────── */
    function readAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result);
            r.onerror = () => reject(r.error);
            r.readAsDataURL(file);
        });
    }

    /** Downscales an image so the repo doesn't fill up with 12-megapixel photos. */
    async function resizeImage(file, maxSide) {
        const url = await readAsDataUrl(file);
        if (!maxSide || file.type === 'image/svg+xml' || file.type === 'image/gif') return url;
        const img = await new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = url; });
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.88);
    }

    async function handleUpload(input) {
        const box = input.closest('[data-upload]');
        const file = input.files && input.files[0];
        if (!file) return;
        const accept = box.dataset.accept;
        if (accept === 'application/pdf' && file.type !== 'application/pdf') { alertBox(box, 'That isn’t a PDF.'); return; }
        if (accept.startsWith('image') && !file.type.startsWith('image/')) { alertBox(box, 'That isn’t an image.'); return; }
        if (accept.startsWith('video') && !file.type.startsWith('video/')) { alertBox(box, 'That isn’t a video.'); return; }
        const limit = accept.startsWith('video') ? 40 : 15;
        if (file.size > limit * 1024 * 1024) { alertBox(box, `Files must be under ${limit} MB.`); return; }
        let target = box.dataset.target;
        let data = accept.startsWith('image') ? await resizeImage(file, Number(box.dataset.maxSide) || 0) : await readAsDataUrl(file);
        if (accept.startsWith('image')) {
            const ext = data.startsWith('data:image/png') ? 'png' : data.startsWith('data:image/gif') ? 'gif' : 'jpg';
            target = target.replace(/\.[a-z]+$/, `.${ext}`);
        }
        if (accept.startsWith('video')) target = target.replace(/\.[a-z0-9]+$/, `.${{ 'video/webm': 'webm', 'video/quicktime': 'mov' }[file.type] || 'mp4'}`);
        const old = getPath(draft, box.dataset.upload);
        if (old && old !== target) delete uploads[old];
        uploads[target] = data;
        setPath(draft, box.dataset.upload, target);
        changed();
        render();
    }

    function alertBox(box, message) {
        const small = box.querySelector('.upload-text small');
        if (small) { small.textContent = message; small.classList.add('error'); }
    }

    /** A clean app icon for a project without one: a gradient squircle with its initials. */
    function generateIcon(name) {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        let h = 0;
        for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) % 360;
        const g = ctx.createLinearGradient(0, 0, size, size);
        g.addColorStop(0, `hsl(${h}, 78%, 62%)`);
        g.addColorStop(1, `hsl(${(h + 40) % 360}, 72%, 46%)`);
        const r = size * 0.225;
        ctx.beginPath();
        ctx.moveTo(r, 0); ctx.arcTo(size, 0, size, size, r); ctx.arcTo(size, size, 0, size, r); ctx.arcTo(0, size, 0, 0, r); ctx.arcTo(0, 0, size, 0, r);
        ctx.closePath();
        ctx.fillStyle = g;
        ctx.fill();
        const shine = ctx.createLinearGradient(0, 0, 0, size);
        shine.addColorStop(0, 'rgba(255,255,255,0.28)');
        shine.addColorStop(0.5, 'rgba(255,255,255,0)');
        ctx.fillStyle = shine;
        ctx.fill();
        const initials = String(name).split(/[\s._-]+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '•';
        ctx.fillStyle = '#fff';
        ctx.font = `700 ${initials.length > 1 ? 200 : 260}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, size / 2, size / 2 + 12);
        return canvas.toDataURL('image/png');
    }

    function ensureProjectIcons() {
        draft.projects.forEach((x, i) => {
            if (x.icon || !x.name) return;
            const path = `assets/me/project-${slug(x.name) || i + 1}.png`;
            uploads[path] = generateIcon(x.name);
            x.icon = path;
        });
    }

    /* ── Link preview ───────────────────────────────────────────────────── */
    // What Messages, Slack and LinkedIn show for the site's link: the owner's
    // About window on the default desktop, drawn at 1200×630 with type big
    // enough to read in a small bubble.
    const LINK_PREVIEW = 'assets/me/link-preview.jpg';

    function loadImage(src) {
        return new Promise((resolve) => {
            if (!src) { resolve(null); return; }
            const img = new Image();
            if (/^https?:/.test(src)) img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = src;
        });
    }

    async function drawLinkPreview() {
        const p = draft;
        const W = 1200, H = 630;
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');
        const font = (weight, size) => `${weight} ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
        const shape = (x, y, w, h, r) => {
            ctx.beginPath();
            ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
        };
        const fit = (text, max) => {
            let t = String(text || '');
            if (ctx.measureText(t).width <= max) return t;
            while (t && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
            return `${t.trimEnd()}…`;
        };
        const cover = (img, x, y, w, h) => {
            const s = Math.max(w / img.width, h / img.height);
            ctx.drawImage(img, x + (w - img.width * s) / 2, y + (h - img.height * s) / 2, img.width * s, img.height * s);
        };
        const [wallpaper, photo] = await Promise.all([loadImage('../assets/Wallpapers/26-Tahoe-Beach-Day.jpg'), loadImage(assetSrc(p.photo))]);
        const first = String(p.name || '').trim().split(/\s+/)[0] || 'me';

        // Desktop and menu bar
        if (wallpaper) cover(wallpaper, 0, 0, W, H);
        else { const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1d4f91'); g.addColorStop(1, '#4fa3d9'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.fillRect(0, 0, W, 32);
        ctx.fillStyle = '#fff';
        ctx.textBaseline = 'middle';
        ctx.font = font(700, 15);
        ctx.fillText(`About ${first}`, 28, 17);
        ctx.font = font(400, 15);
        ctx.fillText('File      Go      Window      Help', 46 + ctx.measureText(`About ${first}`).width + 22, 17);

        // The About window
        const x = 220, y = 104, w = 760, h = 452;
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 60;
        ctx.shadowOffsetY = 24;
        shape(x, y, w, h, 14);
        ctx.fillStyle = 'rgba(30, 30, 34, 0.9)';
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { ctx.beginPath(); ctx.arc(x + 26 + i * 22, y + 24, 7, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); });
        ctx.textAlign = 'center';
        ctx.font = font(600, 15);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.62)';
        ctx.fillText(`About ${first}`, x + w / 2, y + 25);
        ctx.textAlign = 'left';

        // Portrait (or initials)
        const cx = x + 112, cy = y + 142, r = 64;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();
        if (photo) cover(photo, cx - r, cy - r, r * 2, r * 2);
        else {
            const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
            g.addColorStop(0, '#5ac8fa'); g.addColorStop(1, '#5856d6');
            ctx.fillStyle = g;
            ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.font = font(700, 50);
            ctx.fillText(String(p.name || '').split(/\s+/).filter(Boolean).map(s => s[0]).join('').slice(0, 2).toUpperCase(), cx, cy + 2);
            ctx.textAlign = 'left';
        }
        ctx.restore();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Name, tagline, current role
        const tx = x + 206, tw = w - 206 - 36;
        let size = 46;
        do { ctx.font = font(700, size); size -= 2; } while (ctx.measureText(p.name || '').width > tw && size > 28);
        ctx.fillStyle = '#fff';
        ctx.fillText(fit(p.name, tw), tx, y + 112);
        ctx.font = font(400, 22);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
        ctx.fillText(fit(p.tagline || p.role, tw), tx, y + 152);
        const now = p.experience[0];
        if (now && now.role) {
            ctx.font = font(500, 17);
            const label = fit([now.role, now.org].filter(Boolean).join(' · '), tw - 46);
            const pw = ctx.measureText(label).width + 46;
            shape(tx, y + 176, pw, 36, 18);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(tx + 20, y + 194, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#30d158';
            ctx.fill();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
            ctx.fillText(label, tx + 34, y + 195);
        }

        // Stats, as the About window computes them
        const exp = p.experience;
        const interns = exp.length > 0 && exp.every(e => /\bintern/i.test(e.role || ''));
        const live = p.projects.filter(x => x.link && !/github\.com/.test(x.link)).length;
        const stats = [
            [exp.length, plural(exp.length, interns ? 'internship' : 'role')],
            [p.projects.length, plural(p.projects.length, 'project')],
            [live, plural(live, 'live app')],
            p.education.grade ? [p.education.grade, p.education.gradeLabel || 'GPA'] : [skillCount(p), plural(skillCount(p), 'skill')]
        ];
        const sx = x + 40, sy = y + 254, sw = w - 80, sh = 104, cw = sw / stats.length;
        shape(sx, sy, sw, sh, 16);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();
        ctx.textAlign = 'center';
        stats.forEach(([value, label], i) => {
            if (i) { ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; ctx.fillRect(sx + cw * i, sy + 18, 1, sh - 36); }
            ctx.fillStyle = '#fff';
            ctx.font = font(700, 40);
            ctx.fillText(fit(String(value), cw - 20), sx + cw * i + cw / 2, sy + 44);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.font = font(500, 17);
            ctx.fillText(label, sx + cw * i + cw / 2, sy + 80);
        });
        ctx.font = font(500, 18);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillText('Résumé  ·  Projects  ·  Experience  ·  Ask Iris', x + w / 2, y + h - 46);
        return canvas.toDataURL('image/jpeg', 0.86);
    }

    /** A hand-picked preview stays while its owner is the one editing; anyone else gets their own. */
    function keepsOwnLinkPreview() {
        const img = draft.site.image;
        return Boolean(img) && img !== LINK_PREVIEW && draft.name === CURRENT.name;
    }

    async function ensureLinkPreview() {
        if (keepsOwnLinkPreview()) return;
        try {
            uploads[LINK_PREVIEW] = await drawLinkPreview();
            draft.site.image = LINK_PREVIEW;
        } catch (e) {
            draft.site.image = '';   // a tainted canvas (photo from another site): no preview beats the old owner's
        }
    }

    function paintSharePreview() {
        const img = $('#share-preview-img');
        if (!img) return;
        if (keepsOwnLinkPreview()) { img.src = assetSrc(draft.site.image); return; }
        drawLinkPreview().then((url) => { img.src = url; }).catch(() => { img.closest('.share-preview').hidden = true; });
    }

    function skillCount(p) { return p.skills.reduce((n, g) => n + (g.items || []).length, 0); }

    /** Uploads the info bank still points at (removed ones aren't written). */
    function referencedUploads() {
        const json = JSON.stringify(draft || {});
        return Object.fromEntries(Object.entries(uploads).filter(([p]) => json.includes(`"${p}"`)));
    }

    /* ── Import / export ────────────────────────────────────────────────── */
    async function handleImport(input) {
        const file = input.files && input.files[0];
        if (!file) return;
        try {
            const data = JSON.parse(await file.text());
            const profile = data.profile || data;
            if (!profile || typeof profile !== 'object' || !profile.name) throw new Error('No name in that file.');
            draft = ensureShape(profile);
            uploads = data.uploads || {};
            built = false;
            go(1);
            updatePreview();
            flashSaved(`Imported ${file.name}`);
        } catch (e) {
            flashSaved(`Couldn’t import: ${e.message}`);
        }
        input.value = '';
    }

    function saveFile(name, text, type) {
        const url = URL.createObjectURL(new Blob([text], { type }));
        const a = Object.assign(document.createElement('a'), { href: url, download: name });
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    $('#setup-export').addEventListener('click', () => {
        if (!draft) { flashSaved('Nothing to export yet'); return; }
        saveFile(`${slug(draft.name)}-info-bank.json`, JSON.stringify({ profile: draft, uploads: referencedUploads() }, null, 2), 'application/json');
    });

    /* ── Preview ────────────────────────────────────────────────────────── */
    let previewMode = 'ios';
    let previewTimer = null;

    function previewProfile() {
        // Files not yet written are shown from memory (except PDFs, which the preview never renders).
        const json = JSON.stringify(draft).replace(/"(assets\/me\/[^"]+\.(?:jpe?g|png|webp|gif))"/g, (m, p) => (uploads[p] ? JSON.stringify(uploads[p]) : m));
        return JSON.parse(json);
    }

    function updatePreview() {
        if (!draft) return;
        clearTimeout(previewTimer);
        previewTimer = setTimeout(() => {
            try { localStorage.setItem(PREVIEW_KEY, JSON.stringify(previewProfile())); } catch (e) { return; }
            loadPreview(previewMode);
        }, 250);
    }

    function loadPreview(mode) {
        const frame = $(`#preview-${mode}`);
        if (mode === 'mac') {
            // Straight to the desktop with the About window open.
            try { sessionStorage.setItem('mac-unlocked', 'true'); sessionStorage.removeItem('mac-welcome-shown'); } catch (e) { /* private mode */ }
        }
        const src = mode === 'ios' ? '../ios.html?preview=draft' : '../index.html?preview=draft';
        if (frame.getAttribute('src')) frame.contentWindow.location.reload();
        else frame.setAttribute('src', src);
    }

    // The previews render at real device sizes (390×844, 1280×800), scaled to fit.
    if (window.ResizeObserver) {
        const phone = $('.preview-phone');
        const mac = $('.preview-mac');
        new ResizeObserver(() => phone.style.setProperty('--phone-scale', String(phone.clientHeight / 844))).observe(phone);
        new ResizeObserver(() => mac.style.setProperty('--mac-scale', String(mac.clientWidth / 1280))).observe(mac);
    }

    document.querySelectorAll('[data-preview]').forEach(b => b.addEventListener('click', () => {
        previewMode = b.dataset.preview;
        document.querySelectorAll('[data-preview]').forEach(x => x.classList.toggle('active', x === b));
        $('.preview-phone').hidden = previewMode !== 'ios';
        $('.preview-mac').hidden = previewMode !== 'mac';
        updatePreview();
    }));

    /* ── Build ──────────────────────────────────────────────────────────── */
    async function build() {
        const err = $('#build-error');
        const btn = $('#setup-next');
        if (!String(draft.name || '').trim()) { go(1); return; }
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${ADMIN ? 'Saving…' : 'Building…'}`;
        ensureProjectIcons();
        await ensureLinkPreview();
        const files = Object.entries(referencedUploads()).map(([path, data]) => ({ path, data }));
        try {
            const res = await fetch('/__setup/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile: draft, files, config: staleKey() ? { ...config, web3formsKey: '' } : config })
            });
            const out = await res.json();
            if (!res.ok) throw new Error(out.error || 'The setup server refused the save.');
            leftovers = out.leftovers || [];
            tidied = 0;
            built = true;
            CURRENT = clone(draft);   // what's on disk now
            persist();
            render();
        } catch (e) {
            err.textContent = e.message;
            btn.disabled = false;
            btn.innerHTML = ADMIN ? '<i class="fas fa-floppy-disk"></i> Save changes' : '<i class="fas fa-hammer"></i> Build my portfolio';
        }
    }

    /** No local server: a profile.js with the files embedded, to drop in by hand. */
    function download() {
        ensureProjectIcons();
        // Link previews need a real file, which only the setup server can write; drop an inherited one.
        if (!keepsOwnLinkPreview()) draft.site.image = '';
        const embedded = JSON.parse(JSON.stringify(draft).replace(/"(assets\/me\/[^"]+)"/g, (m, p) => (uploads[p] ? JSON.stringify(uploads[p]) : m)));
        saveFile('profile.js', ProfileFormat.serializeProfile(embedded), 'text/javascript');
        built = true;
        persist();
        render();
    }

    /* ── Start ──────────────────────────────────────────────────────────── */
    async function start() {
        try {
            const r = await fetch('/__setup/status', { cache: 'no-store' });
            server = r.ok;
            if (server) {
                const c = await (await fetch('/__setup/config', { cache: 'no-store' })).json();
                templateKey = c.web3formsKey || '';
                config = { web3formsKey: c.web3formsKey || '', irisEndpoint: c.irisEndpoint || '' };
            }
        } catch (e) { server = false; }
        if (ADMIN) {
            document.title = 'Admin — Portfolio';
            $('.setup-brand strong').textContent = 'Portfolio Admin';
            $('.setup-brand small').textContent = 'Only on this computer';
            if (!server) {
                $('#setup-step').innerHTML = intro('Admin needs your computer', 'Open it with <code>npm run admin</code> in the portfolio’s folder. It never runs on the public site.');
                return;
            }
            if (!restore()) { draft = ensureShape(clone(CURRENT)); step = 0; }
            render();
            updatePreview();
            return;
        }
        const had = restore();
        if (!had) step = 0;
        render();
        if (draft) updatePreview();
        else {
            // Before any answers, preview the site as it stands.
            try { localStorage.removeItem(PREVIEW_KEY); } catch (e) { /* ignore */ }
            loadPreview('ios');
        }
    }

    start();
})();
