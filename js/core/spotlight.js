/* ==========================================================================
   Spotlight — Cmd+Space system search
   --------------------------------------------------------------------------
   Searches window.PORTFOLIO_CORPUS (js/data/corpus.js) plus the app list and
   the Finder filesystem. Deliberately reuses the SAME index Safari search and
   Iris use — there is one corpus in this codebase, not three.
   ========================================================================== */

let spotlightOpen = false;
let spotlightResults = [];
let spotlightIndex = 0;

const SPOTLIGHT_APPS = [
    { name: 'About Mudit',     icon: 'assets/Professionalimage.jpeg', action: () => openWelcome() },
    { name: 'Finder',          icon: 'assets/icons/finder.png',       action: () => openWindow('finder-window') },
    { name: 'Safari',          icon: 'assets/icons/safari.png',       action: () => openWindow('safari-window') },
    { name: 'Mail',            icon: 'assets/icons/mail.png',         action: () => openWindow('mail-window') },
    { name: 'Notes',           icon: 'assets/icons/notes.png',        action: () => openWindow('notes-window') },
    { name: 'Photos',          icon: 'assets/icons/photos.png',       action: () => openWindow('photos-window') },
    { name: 'Music',           icon: 'assets/icons/music.png',        action: () => openMusic() },
    { name: 'Photo Booth',     icon: 'assets/icons/photobooth.svg',   action: () => openPhotoBooth() },
    { name: 'Breakout',        icon: 'assets/icons/breakout.svg',     action: () => openBreakout() },
    { name: 'Snake',           icon: 'assets/icons/snake.svg',        action: () => openSnake() },
    { name: 'App Store',       icon: 'assets/icons/app-store.png',    action: () => openWindow('appstore-window') },
    { name: 'Terminal',        icon: 'assets/icons/terminal.png',     action: () => openWindow('terminal-window') },
    { name: 'System Settings', icon: 'assets/icons/settings.png',     action: () => openWindow('settings-window') },
    { name: 'Iris',            icon: 'assets/icons/siri.png',         action: () => openIris() },
    { name: 'Mission Control', icon: 'assets/icons/mission-control.svg', action: () => toggleMissionControl() },
    { name: 'Launchpad',       icon: 'assets/icons/launchpad.svg',    action: () => openLaunchpad() },
    { name: 'Control Centre',  icon: 'assets/icons/settings.png',     action: () => openControlCenter() },
    { name: 'Trash',           icon: 'assets/icons/trash-full.png',   action: () => openWindow('trash-window') }
];

// Things a visitor most often wants to *do*, matched on keywords.
const SPOTLIGHT_ACTIONS = [
    { title: 'Download Résumé (PDF)', keys: 'resume résumé cv download pdf', glyph: 'fas fa-file-arrow-down', run: () => downloadResume() },
    { title: 'Email Mudit', keys: 'email mail contact message hire reach write', glyph: 'fas fa-paper-plane', run: () => { openWindow('mail-window'); openMailCompose(); } },
    { title: 'Save Contact Card', keys: 'contact vcard vcf card phone save', glyph: 'fas fa-address-card', run: () => downloadContactCard() },
    { title: 'Copy Email Address', keys: 'copy email address', glyph: 'fas fa-copy', run: () => copyTextToClipboard('muditagrawal03@gmail.com', 'Email address copied') },
    { title: 'Ask Iris a Question', keys: 'ask iris siri question ai assistant chat', glyph: 'fas fa-wand-magic-sparkles', run: () => openIris() },
    { title: 'Keyboard Shortcuts', keys: 'keyboard shortcuts keys help hotkeys', glyph: 'fas fa-keyboard', run: () => showKeyboardShortcuts() }
];

function ensureSpotlightDom() {
    if (document.getElementById('spotlight-overlay')) return;
    const el = document.createElement('div');
    el.id = 'spotlight-overlay';
    el.className = 'spotlight-overlay';
    el.innerHTML = `
        <div class="spotlight-panel" role="dialog" aria-label="Spotlight Search">
            <div class="spotlight-input-row">
                <i class="fas fa-magnifying-glass"></i>
                <input type="text" id="spotlight-input" placeholder="Spotlight Search"
                       autocomplete="off" spellcheck="false" aria-label="Spotlight Search">
            </div>
            <div class="spotlight-results" id="spotlight-results" role="listbox" aria-label="Results"></div>
        </div>`;
    document.body.appendChild(el);

    el.addEventListener('click', (e) => { if (e.target === el) closeSpotlight(); });
    const input = el.querySelector('#spotlight-input');
    input.addEventListener('input', () => runSpotlightSearch(input.value));
    input.addEventListener('keydown', handleSpotlightKey);
}

function toggleSpotlight() {
    spotlightOpen ? closeSpotlight() : openSpotlight();
}

function openSpotlight() {
    ensureSpotlightDom();
    const overlay = document.getElementById('spotlight-overlay');
    const input = document.getElementById('spotlight-input');
    overlay.classList.add('active');
    spotlightOpen = true;
    input.value = '';
    runSpotlightSearch('');
    setTimeout(() => input.focus(), 40);
}

function closeSpotlight() {
    const overlay = document.getElementById('spotlight-overlay');
    if (overlay) overlay.classList.remove('active');
    spotlightOpen = false;
}

/** Collapses "OmniDoc", "proj-omnidoc" and "OmniDoc.app" to one key. */
function normaliseTitle(t) {
    return String(t).toLowerCase().replace(/^proj-/, '').replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]/g, '');
}

/** Builds a unified result set: apps, then portfolio content, then files. */
function runSpotlightSearch(query) {
    const q = (query || '').toLowerCase().trim();
    spotlightIndex = 0;
    spotlightResults = [];

    if (!q) {
        spotlightResults = [
            ...SPOTLIGHT_ACTIONS.slice(0, 3).map(a => ({ group: 'Suggestions', title: a.title, subtitle: 'Action', glyph: a.glyph, run: a.run })),
            ...SPOTLIGHT_APPS.slice(0, 5).map(a => ({ group: 'Applications', title: a.name, subtitle: 'Application', icon: a.icon, run: a.action }))
        ];
        renderSpotlightResults();
        return;
    }

    SPOTLIGHT_ACTIONS
        .filter(a => a.title.toLowerCase().includes(q) || q.split(/\s+/).every(w => a.keys.includes(w)))
        .forEach(a => spotlightResults.push({ group: 'Actions', title: a.title, subtitle: 'Action', glyph: a.glyph, run: a.run }));

    SPOTLIGHT_APPS
        .filter(a => a.name.toLowerCase().includes(q))
        .forEach(a => spotlightResults.push({
            group: 'Applications', title: a.name, subtitle: 'Application',
            icon: a.icon, run: a.action
        }));

    searchPortfolioCorpus(query, { minScore: 2, limit: 5 }).forEach(entry => {
        spotlightResults.push({
            group: 'Portfolio', title: entry.title, subtitle: entry.type,
            glyph: entry.type === 'Experience' ? 'fas fa-briefcase' : entry.type === 'Project' ? 'fas fa-cube' : 'fas fa-circle-info',
            run: () => runCorpusAction(entry.action, entry.url)
        });
    });

    if (typeof FS_ITEMS === 'object') {
        // Several projects exist in BOTH the corpus and the mock filesystem.
        // Suppress the filesystem copy so one thing never shows up twice.
        const claimed = new Set(spotlightResults.map(r => normaliseTitle(r.title)));
        Object.values(FS_ITEMS)
            .filter(it => it.name.toLowerCase().includes(q) && !claimed.has(normaliseTitle(it.name)))
            .slice(0, 5)
            .forEach(it => {
                claimed.add(normaliseTitle(it.name));
                spotlightResults.push({
                    group: 'Documents', title: it.name, subtitle: it.kind || 'File',
                    icon: it.icon,
                    run: () => { openWindow('finder-window'); handleFinderItemOpen(it.id); }
                });
            });
    }

    // A calculation typed into Spotlight answers inline, like the real one.
    const math = evaluateMathExpression(query);
    if (math !== null) {
        spotlightResults.unshift({
            group: 'Calculator', title: String(math), subtitle: query,
            glyph: 'fas fa-equals', run: () => copyTextToClipboard(String(math), `Copied ${math}`)
        });
    }

    renderSpotlightResults();
}

function renderSpotlightResults() {
    const box = document.getElementById('spotlight-results');
    if (!box) return;

    if (spotlightResults.length === 0) {
        box.innerHTML = `<div class="spotlight-empty">No Results</div>`;
        return;
    }

    let html = '';
    let lastGroup = null;
    spotlightResults.forEach((r, i) => {
        if (r.group !== lastGroup) {
            html += `<div class="spotlight-group">${escapeHtml(r.group)}</div>`;
            lastGroup = r.group;
        }
        const art = r.icon
            ? `<img src="${escapeHtml(r.icon)}" alt=""${/Professionalimage/.test(r.icon) ? ' class="round"' : ''}>`
            : `<i class="${escapeHtml(r.glyph || 'fas fa-file')}"></i>`;
        html += `
            <div class="spotlight-row ${i === spotlightIndex ? 'selected' : ''}" data-index="${i}" role="option" aria-selected="${i === spotlightIndex}">
                <div class="spotlight-row-art">${art}</div>
                <div class="spotlight-row-text">
                    <div class="spotlight-row-title">${escapeHtml(r.title)}</div>
                    <div class="spotlight-row-sub">${escapeHtml(r.subtitle)}</div>
                </div>
            </div>`;
    });
    box.innerHTML = html;

    box.querySelectorAll('.spotlight-row').forEach(row => {
        row.addEventListener('click', () => runSpotlightResult(Number(row.dataset.index)));
        row.addEventListener('mousemove', () => {
            spotlightIndex = Number(row.dataset.index);
            box.querySelectorAll('.spotlight-row').forEach(r2 =>
                r2.classList.toggle('selected', r2 === row));
        });
    });
}

function handleSpotlightKey(e) {
    if (e.key === 'Escape')      { e.preventDefault(); closeSpotlight(); return; }
    if (e.key === 'Enter')       { e.preventDefault(); runSpotlightResult(spotlightIndex); return; }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;

    e.preventDefault();
    if (spotlightResults.length === 0) return;
    spotlightIndex = e.key === 'ArrowDown'
        ? (spotlightIndex + 1) % spotlightResults.length
        : (spotlightIndex - 1 + spotlightResults.length) % spotlightResults.length;

    renderSpotlightResults();
    const sel = document.querySelector('.spotlight-row.selected');
    if (sel) sel.scrollIntoView({ block: 'nearest' });
}

function runSpotlightResult(index) {
    const result = spotlightResults[index];
    if (!result) return;
    closeSpotlight();
    setTimeout(() => result.run(), 60);
}
