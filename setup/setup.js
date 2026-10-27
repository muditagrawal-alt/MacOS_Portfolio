/* ==========================================================================
   Setup questionnaire — fill in the info bank, see it live, build it
   --------------------------------------------------------------------------
   Edits a draft of js/data/profile.js (the "info bank") step by step. The
   draft lives in this browser until you build, and the preview on the right
   is the real site rendering it (?preview=draft). Building sends the draft,
   uploaded files and service keys to the local setup server (`npm start` /
   `npm run setup`), which writes them into the repository. Without that
   server, Build downloads a profile.js to drop in by hand.
   ========================================================================== */

(function () {
    const STATE_KEY = 'portfolio-setup-state';
    const PREVIEW_KEY = 'portfolio-setup-preview';
    const CURRENT = JSON.parse(JSON.stringify(window.PROFILE_DATA || {}));
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
        ['values', 'socials', 'experience', 'courses', 'certificates', 'projects', 'skills', 'writing', 'notes', 'cutIdeas'].forEach(k => { if (!Array.isArray(out[k])) out[k] = []; });
        // Older info banks kept skills as { languages: [...] }.
        if (!Array.isArray(p.skills) && p.skills && typeof p.skills === 'object') out.skills = Object.entries(p.skills).map(([label, items]) => ({ label, items }));
        if (out.education.cgpa && !out.education.grade) out.education.grade = out.education.cgpa;
        delete out.education.cgpa;
        return out;
    }

    function persist() {
        try {
            localStorage.setItem(STATE_KEY, JSON.stringify({ draft, uploads, config, step }));
            flashSaved('Draft saved in this browser');
        } catch (e) {
            // Large uploads (a PDF) can exceed storage: keep the text, drop the files.
            try { localStorage.setItem(STATE_KEY, JSON.stringify({ draft, uploads: {}, config, step })); } catch (e2) { /* storage unavailable */ }
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
            if (s && s.draft) {
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
    function field(f) {
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
            control = `<label class="switch"><input type="checkbox" ${common} ${raw ? 'checked' : ''}><span></span></label>`;
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
        cutIdeas: () => ({ name: '', kind: '', reason: '' })
    };

    function upload(cfg) {
        const path = getPath(draft, cfg.path);
        const src = assetSrc(path);
        const isImage = cfg.accept.startsWith('image');
        return `<div class="upload ${cfg.round ? 'round' : ''}" data-upload="${esc(cfg.path)}" data-accept="${esc(cfg.accept)}" data-target="${esc(cfg.target)}" ${cfg.maxSide ? `data-max-side="${cfg.maxSide}"` : ''}>
            <div class="upload-art">${path ? (isImage ? `<img src="${esc(src)}" alt="">` : '<i class="fas fa-file-pdf"></i>') : `<i class="${cfg.icon || 'fas fa-image'}"></i>`}</div>
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
            id: 'welcome', title: 'Welcome', icon: 'fa-hand-sparkles',
            render: () => `
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
                    { key: 'bullets', label: 'Highlights', type: 'lines', wide: true, placeholder: 'One per line — what you did and what changed because of it' }
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
                    { path: 'education.gradeLabel', label: 'Grade label', placeholder: 'GPA', hint: 'GPA, CGPA, Grade, Class…' }
                ])}
                <h2 class="sub">Schooling</h2>
                ${repeatable({
                    path: 'education.schooling', addLabel: 'Add schooling',
                    title: (s) => [s.title, s.school].filter(Boolean).join(' · ') || 'New entry',
                    fields: [
                        { key: 'title', label: 'Level', placeholder: 'High School Diploma' },
                        { key: 'school', label: 'School', placeholder: 'Central High School' },
                        { key: 'year', label: 'Year', placeholder: '2021' },
                        { key: 'score', label: 'Result', placeholder: '92%' }
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
                extra: (x, i) => upload({ path: `projects.${i}.icon`, target: `assets/me/project-${slug(x.name || `project-${i + 1}`)}.png`, accept: 'image/*', label: 'Icon', hint: 'Optional — generated if left empty.', icon: 'fas fa-cube', maxSide: 512 }),
                fields: [
                    { key: 'name', label: 'Name', placeholder: 'Difference Engine' },
                    { key: 'subtitle', label: 'One-line description', placeholder: 'Mechanical calculator for polynomial tables' },
                    { key: 'description', label: 'About it', type: 'textarea', wide: true, placeholder: 'What it does, how it works, what you learned.' },
                    { key: 'link', label: 'Live link', type: 'url', placeholder: 'https://… (deployed app)' },
                    { key: 'repo', label: 'Repository', type: 'url', placeholder: 'https://github.com/you/project' },
                    { key: 'tags', label: 'Built with', type: 'tags', placeholder: 'Python, React, PostgreSQL' },
                    { key: 'date', label: 'When', placeholder: 'Mar 2025' },
                    { key: 'category', label: 'Category', placeholder: 'Web, AI, Design… (optional)' },
                    { key: 'featured', label: 'Feature it first', type: 'toggle' }
                ]
            }),
            validate: () => {
                const bad = draft.projects.findIndex(x => !isUrl(x.link) || !isUrl(x.repo));
                return bad >= 0 ? { path: `projects.${bad}.link`, message: 'Use full links starting with https://' } : null;
            }
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
                    <div class="service-head"><i class="fas fa-wand-magic-sparkles"></i><div><strong>Iris’s hosted model</strong><small>Optional. Iris answers from your info bank without one; with a deployed <code>api/iris.js</code> endpoint it phrases answers with a language model.</small></div></div>
                    <input type="url" data-config="irisEndpoint" value="${esc(config.irisEndpoint)}" placeholder="https://your-app.vercel.app/api/iris" autocomplete="off" aria-label="Iris endpoint">
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
            ${server
                ? '<p class="field-hint center">Building writes <code>js/data/profile.js</code>, your files in <code>assets/me/</code>, the page titles and link previews.</p>'
                : '<p class="field-hint center">No setup server is running, so this downloads a <code>profile.js</code> with your photos embedded — replace <code>js/data/profile.js</code> with it. Running <code>npm start</code> instead lets this page save everything for you.</p>'}
            <p class="build-error" id="build-error" role="alert"></p>`;
    }

    function renderDone() {
        return `<div class="done-screen">
            <div class="done-badge"><i class="fas fa-check"></i></div>
            <h1>${server ? 'It’s yours' : 'Downloaded'}</h1>
            <p>${server ? 'The info bank and your files are saved. Have a look, then publish it.' : 'Put the file in place, then publish it.'}</p>
            ${server ? `<div class="done-actions">
                <a class="btn primary" href="../?view=mac" target="_blank" rel="noopener"><i class="fas fa-laptop"></i> Open the Mac version</a>
                <a class="btn" href="../ios.html?view=ios" target="_blank" rel="noopener"><i class="fas fa-mobile-screen"></i> Open the iPhone version</a>
            </div>` : ''}
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

    /* ── Rendering ──────────────────────────────────────────────────────── */
    function render() {
        const s = STEPS[step];
        $('#setup-step').innerHTML = s.render();
        $('#setup-step').dataset.step = s.id;
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
        next.innerHTML = last ? (server ? '<i class="fas fa-hammer"></i> Build my portfolio' : '<i class="fas fa-download"></i> Download profile.js')
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
            education: Boolean(p.education.degree), projects: p.projects.length > 0, skills: p.skills.length > 0,
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
        cutIdeas: (t) => t.name || 'New idea'
    };

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-act]');
        if (!btn || btn.tagName === 'INPUT') return;
        const act = btn.dataset.act;
        if (act === 'goto') { go(Number(btn.dataset.step)); return; }
        if (act === 'start-fresh') { draft = blank(); uploads = {}; config = { web3formsKey: '', irisEndpoint: '' }; built = false; go(1); updatePreview(); return; }
        if (act === 'start-current') { draft = ensureShape(clone(CURRENT)); uploads = {}; config = { ...config, web3formsKey: templateKey }; built = false; go(1); updatePreview(); return; }
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
        if (file.size > 15 * 1024 * 1024) { alertBox(box, 'Files must be under 15 MB.'); return; }
        let target = box.dataset.target;
        let data = accept.startsWith('image') ? await resizeImage(file, Number(box.dataset.maxSide) || 0) : await readAsDataUrl(file);
        if (accept.startsWith('image')) {
            const ext = data.startsWith('data:image/png') ? 'png' : data.startsWith('data:image/gif') ? 'gif' : 'jpg';
            target = target.replace(/\.[a-z]+$/, `.${ext}`);
        }
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
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Building…';
        ensureProjectIcons();
        const files = Object.entries(referencedUploads()).map(([path, data]) => ({ path, data }));
        try {
            const res = await fetch('/__setup/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile: draft, files, config: staleKey() ? { ...config, web3formsKey: '' } : config })
            });
            const out = await res.json();
            if (!res.ok) throw new Error(out.error || 'The setup server refused the save.');
            built = true;
            persist();
            render();
        } catch (e) {
            err.textContent = e.message;
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-hammer"></i> Build my portfolio';
        }
    }

    /** No local server: a profile.js with the files embedded, to drop in by hand. */
    function download() {
        ensureProjectIcons();
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
