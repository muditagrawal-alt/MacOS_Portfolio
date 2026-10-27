/* ==========================================================================
   About — the first window a visitor sees
   --------------------------------------------------------------------------
   The desktop used to open on a Finder window listing "Desktop, Documents,
   Downloads…" — true to macOS, but it told a recruiter nothing. This window
   answers the three questions they arrive with (who, what has he built, how
   do I reach him) and is built entirely from PROFILE_DATA and the Finder
   filesystem, so it can't drift from the rest of the site.
   ========================================================================== */

const WELCOME_SESSION_KEY = 'mac-welcome-shown';

function renderWelcome() {
    const root = document.getElementById('welcome-content');
    if (!root) return;
    const p = window.PROFILE_DATA || {};
    const exp = p.experience || [];
    const projects = (typeof AAKASH_STYLE_FS === 'object' && AAKASH_STYLE_FS['projects-folder'])
        ? AAKASH_STYLE_FS['projects-folder'].items.map(id => FS_ITEMS[id]).filter(Boolean) : [];
    const live = projects.filter(it => it.link && !/github\.com/.test(it.link));
    const current = exp[0];
    // "internships" only when every role is one; a grade only if there is one.
    const interns = exp.length > 0 && exp.every(e => /\bintern/i.test(e.role));
    const roles = interns ? (exp.length === 1 ? 'internship' : 'internships') : (exp.length === 1 ? 'role' : 'roles');
    const skillCount = (p.skills || []).reduce((n, g) => n + (g.items || []).length, 0);

    const stat = (n, label) => `<div class="welcome-stat"><span>${escapeHtml(String(n))}</span><small>${escapeHtml(label)}</small></div>`;

    root.innerHTML = `
        <header class="welcome-hero">
            <img class="welcome-portrait" src="${escapeHtml(p.photo)}" alt="${escapeHtml(p.name)}">
            <div>
                <h1>${escapeHtml(p.name)}</h1>
                <p class="welcome-tagline">${escapeHtml(p.tagline || '')}</p>
                ${current ? `<p class="welcome-now"><span class="welcome-dot"></span>${escapeHtml(current.role)} · ${escapeHtml(current.org.replace(' Pvt. Ltd.', ''))}</p>` : ''}
            </div>
        </header>

        <p class="welcome-bio">${escapeHtml(p.bio || '')}</p>

        <div class="welcome-stats">
            ${stat(exp.length, roles)}
            ${stat(projects.length, projects.length === 1 ? 'project' : 'projects')}
            ${stat(live.length, live.length === 1 ? 'live app' : 'live apps')}
            ${p.education.grade ? stat(p.education.grade, p.education.gradeLabel || 'GPA') : stat(skillCount, skillCount === 1 ? 'skill' : 'skills')}
        </div>

        <div class="welcome-highlights">
            ${exp.slice(0, 4).map(e => `
                <div class="welcome-highlight">
                    <div class="welcome-highlight-org">${escapeHtml(e.org.split(' (')[0].replace(' Pvt. Ltd.', ''))}</div>
                    <div class="welcome-highlight-text">${escapeHtml((e.bullets || [])[0] || e.role)}</div>
                </div>`).join('')}
        </div>

        <div class="welcome-actions">
            <button type="button" class="welcome-btn primary" onclick="openResumeWindow()"><i class="fas fa-file-lines"></i> Résumé</button>
            <button type="button" class="welcome-btn" onclick="openFinderPane('projects')"><i class="fas fa-cube"></i> Projects</button>
            <button type="button" class="welcome-btn" onclick="openWindow('mail-window'); openMailCompose();"><i class="fas fa-paper-plane"></i> Contact</button>
            <button type="button" class="welcome-btn" onclick="openIris()"><i class="fas fa-wand-magic-sparkles"></i> Ask Iris</button>
        </div>

        <footer class="welcome-footer">
            Everything here is clickable. <kbd>⌘K</kbd> searches it all · <kbd>?</kbd> shows shortcuts · right-click for more.
        </footer>`;
}

function centreWindow(win) {
    if (window.innerWidth <= 768) return;
    const w = win.offsetWidth || 640;
    const h = win.offsetHeight || 520;
    win.style.left = Math.max(16, Math.round((window.innerWidth - w) / 2)) + 'px';
    win.style.top = Math.max(40, Math.round((window.innerHeight - h) / 2) - 40) + 'px';
    win.dataset.placed = '1';
}

function openWelcome() {
    const win = document.getElementById('welcome-window');
    if (!win) return;
    renderWelcome();
    const wasHidden = win.classList.contains('hidden');
    if (wasHidden) {
        win.classList.remove('hidden');
        centreWindow(win);
        win.classList.add('hidden');
    }
    openWindow('welcome-window');
}

/** Called once the desktop is revealed; shows the window once per session. */
function maybeShowWelcome() {
    let shown = false;
    try { shown = sessionStorage.getItem(WELCOME_SESSION_KEY) === '1'; } catch (e) { shown = false; }
    if (shown) return;
    try { sessionStorage.setItem(WELCOME_SESSION_KEY, '1'); } catch (e) { /* private mode */ }
    setTimeout(openWelcome, 420);
}
