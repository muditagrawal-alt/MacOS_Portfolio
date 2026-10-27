/* ==========================================================================
   Finder v2 Controller — Matching Aakash Portfolio Finder Exactly
   Icons Grid, List Table, Cascading Columns, Sidebar Navigation & Mock FS
   ========================================================================== */

// The filesystem itself (AAKASH_STYLE_FS, FS_ITEMS) lives in
// js/data/filesystem.js, shared with the iPhone version.

// ── State Variables ──
let currentFinderFolder = 'home';
let finderHistory = ['home'];
let finderHistoryIndex = 0;
let currentFinderView = 'icons'; // 'icons' | 'list' | 'columns'
let selectedFinderItem = null;
let finderColumnStack = ['home'];

// ── Initialization ──
function initFinderV2() {
    buildApplicationsFolder();
    renderFinder();
}

// ── Navigation ──
function navigateFinderFolder(folderId, addToHistory = true, fromSidebar = false) {
    if (!AAKASH_STYLE_FS[folderId]) return;

    if (!fromSidebar) {
        const folderAliases = {
            'projects-folder': 'projects', 'experience-folder': 'experience',
            'education-folder': 'education', 'skills-folder': 'skills'
        };
        activeSidebarTarget = folderAliases[folderId] || folderId;
    }
    currentFinderFolder = folderId;
    selectedFinderItem = null;

    if (addToHistory) {
        if (finderHistoryIndex < finderHistory.length - 1) {
            finderHistory = finderHistory.slice(0, finderHistoryIndex + 1);
        }
        finderHistory.push(folderId);
        finderHistoryIndex = finderHistory.length - 1;
    }

    // Reset column stack starting with this folder
    finderColumnStack = [folderId];

    renderFinder();
}

function finderGoBack() {
    if (finderHistoryIndex > 0) {
        finderHistoryIndex--;
        navigateFinderFolder(finderHistory[finderHistoryIndex], false);
    }
}

function finderGoForward() {
    if (finderHistoryIndex < finderHistory.length - 1) {
        finderHistoryIndex++;
        navigateFinderFolder(finderHistory[finderHistoryIndex], false);
    }
}

function setFinderViewMode(mode) {
    currentFinderView = mode;
    document.querySelectorAll('.finder-view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === mode);
    });
    renderFinderContent();
}

// ── Sidebar Click ──
let activeSidebarTarget = 'home';

function finderSidebarNav(folderId) {
    activeSidebarTarget = folderId;
    // Map custom sidebar aliases
    // Sidebar key -> folder in the mock filesystem. Rows like AirDrop and
    // Network have no folder of their own, so they land somewhere sensible
    // while still keeping their own row highlighted.
    const aliasMap = {
        'about': 'home',
        [window.PROFILE_DATA.first.toLowerCase()]: 'home',
        'experience': 'experience-folder',
        'education': 'education-folder',
        'projects': 'projects-folder',
        'skills': 'skills-folder',
        'shared': 'home',
        'macintosh-hd': 'home',
        'icloud-drive': 'documents'
    };

    const target = aliasMap[folderId] || folderId;
    // Unknown key: keep the highlight where the visitor clicked, show home.
    navigateFinderFolder(AAKASH_STYLE_FS[target] ? target : 'home', true, true);
}

// ── Master Render Function ──
function renderFinder() {
    updateFinderHeader();
    updateFinderSidebarActive();
    renderFinderContent();
    updateFinderBottomBar();
}

function updateFinderHeader() {
    const folder = AAKASH_STYLE_FS[currentFinderFolder] || AAKASH_STYLE_FS['home'];
    const titleEl = document.getElementById('finder-title-text');
    const iconEl = document.getElementById('finder-title-icon');
    const backBtn = document.getElementById('finder-btn-back');
    const fwdBtn = document.getElementById('finder-btn-forward');

    if (titleEl) titleEl.textContent = folder.name;
    if (iconEl) iconEl.src = folder.icon;

    if (backBtn) backBtn.disabled = finderHistoryIndex <= 0;
    if (fwdBtn) fwdBtn.disabled = finderHistoryIndex >= finderHistory.length - 1;
}

function updateFinderSidebarActive() {
    // Highlight what the visitor actually clicked. Several rows (AirDrop,
    // Network, iCloud Drive, Macintosh HD) all resolve to 'home', so matching
    // on the resolved folder lit up the home folder no matter which one you picked.
    const folderAliases = {
        'projects-folder': 'projects', 'experience-folder': 'experience',
        'education-folder': 'education', 'skills-folder': 'skills'
    };
    const fallback = folderAliases[currentFinderFolder] || currentFinderFolder;

    document.querySelectorAll('.sidebar-v2-item').forEach(item => {
        const target = item.getAttribute('data-target');
        item.classList.toggle('active', target === activeSidebarTarget || (!activeSidebarTarget && target === fallback));
    });
}

function renderFinderContent() {
    const container = document.getElementById('finder-content-viewport');
    if (!container) return;

    const folder = AAKASH_STYLE_FS[currentFinderFolder] || AAKASH_STYLE_FS['home'];
    const itemIds = folder.items || [];
    const items = itemIds.map(id => FS_ITEMS[id]).filter(Boolean);

    if (folder.view === 'airdrop') {
        renderAirDropView(container);
        return;
    }

    if (currentFinderView === 'icons') {
        renderIconsView(container, items);
    } else if (currentFinderView === 'list') {
        renderListView(container, items);
    } else if (currentFinderView === 'columns') {
        renderColumnsView(container);
    }
}

// ── 1. Icons Grid View ──
function renderIconsView(container, items) {
    container.innerHTML = `
        <div class="finder-view-icons" id="finder-icons-grid">
            ${items.map(item => `
                <div class="finder-grid-item ${selectedFinderItem === item.id ? 'selected' : ''}"
                     data-item-id="${item.id}" tabindex="0" role="button"
                     onclick="selectFinderItem('${item.id}', event)"
                     onkeydown="if(event.key==='Enter'){handleFinderItemOpen('${item.id}')}"
                     ondblclick="handleFinderItemOpen('${item.id}')">
                    <div class="finder-grid-icon">
                        <img src="${item.icon}" alt="${item.name}">
                    </div>
                    <span class="finder-grid-name">${item.name}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// ── 2. List Table View ──
function renderListView(container, items) {
    container.innerHTML = `
        <div class="finder-view-list">
            <div class="finder-list-table-header">
                <span class="col-name">Name</span>
                <span class="col-date">Date Modified</span>
                <span class="col-size">Size</span>
                <span class="col-kind">Kind</span>
            </div>
            <div class="finder-list-table-body">
                ${items.map(item => `
                    <div class="finder-list-item-row ${selectedFinderItem === item.id ? 'selected' : ''}"
                         data-item-id="${item.id}" tabindex="0" role="button"
                         onclick="selectFinderItem('${item.id}', event)"
                         onkeydown="if(event.key==='Enter'){handleFinderItemOpen('${item.id}')}"
                         ondblclick="handleFinderItemOpen('${item.id}')">
                        <span class="col-name">
                            <img src="${item.icon}" alt="${item.name}">
                            ${item.name}
                        </span>
                        <span class="col-date">${item.date || '—'}</span>
                        <span class="col-size">${item.size || '—'}</span>
                        <span class="col-kind">${item.kind || '—'}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ── 3. Cascading Columns View ──
function renderColumnsView(container) {
    let columnsHtml = `<div class="finder-view-columns" id="finder-columns-container">`;

    // Render each column in the column stack
    finderColumnStack.forEach((folderId, depth) => {
        const folder = AAKASH_STYLE_FS[folderId];
        if (!folder) return;
        const itemIds = folder.items || [];
        const items = itemIds.map(id => FS_ITEMS[id]).filter(Boolean);
        const activeChildId = finderColumnStack[depth + 1] || selectedFinderItem;

        columnsHtml += `
            <div class="finder-column-pane">
                ${items.map(item => {
                    const isRowActive = activeChildId === item.id || activeChildId === item.targetFolder;
                    return `
                        <div class="finder-column-row ${isRowActive ? 'active' : ''}" data-col-item-id="${item.id}"
                             onclick="handleColumnRowClick('${folderId}', '${item.id}', ${depth})"
                             ondblclick="handleFinderItemOpen('${item.id}')">
                            <div class="finder-column-row-left">
                                <img src="${item.icon}" alt="${item.name}">
                                <span>${item.name}</span>
                            </div>
                            ${item.kind === 'folder' ? '<i class="fas fa-chevron-right col-arrow"></i>' : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    });

    // Render Inspector Preview on the right if a file is selected
    const selectedItemObj = FS_ITEMS[selectedFinderItem];
    if (selectedItemObj) {
        columnsHtml += `
            <div class="finder-column-inspector">
                <div class="inspector-preview-icon">
                    <img src="${selectedItemObj.icon}" alt="${selectedItemObj.name}">
                </div>
                <div class="inspector-title">${selectedItemObj.name}</div>
                <div class="inspector-kind">${selectedItemObj.kind} • ${selectedItemObj.size || '—'}</div>
                
                <div class="inspector-meta-box">
                    <div class="inspector-meta-row"><span class="label">Modified:</span> <span class="val">${selectedItemObj.date || '—'}</span></div>
                    <div class="inspector-meta-row"><span class="label">Kind:</span> <span class="val">${selectedItemObj.kind || '—'}</span></div>
                    <div class="inspector-meta-row"><span class="label">Size:</span> <span class="val">${selectedItemObj.size || '—'}</span></div>
                </div>

                ${selectedItemObj.preview ? `
                    <div class="inspector-description">${selectedItemObj.preview.desc || ''}</div>
                ` : ''}

                ${selectedItemObj.link ? `
                    <a href="${escapeHtml(safeUrl(selectedItemObj.link))}" target="_blank" rel="noopener noreferrer" class="inspector-action-btn">Open on ${escapeHtml(linkHostLabel(selectedItemObj.link))} ↗</a>
                ` : ''}
                ${(selectedItemObj.action || selectedItemObj.open) ? `
                    <button class="inspector-action-btn" onclick="handleFinderItemOpen('${escapeAttr(selectedItemObj.id)}')">Open</button>
                ` : ''}
            </div>
        `;
    }

    columnsHtml += `</div>`;
    container.innerHTML = columnsHtml;

    // Scroll to rightmost column
    const colContainer = document.getElementById('finder-columns-container');
    if (colContainer) colContainer.scrollLeft = colContainer.scrollWidth;
}

function handleColumnRowClick(parentFolderId, itemId, depth) {
    const item = FS_ITEMS[itemId];
    if (!item) return;

    // Truncate column stack to this depth
    finderColumnStack = finderColumnStack.slice(0, depth + 1);

    if (item.kind === 'folder' && item.targetFolder) {
        finderColumnStack.push(item.targetFolder);
        selectedFinderItem = item.targetFolder;
    } else {
        selectedFinderItem = item.id;
    }

    renderFinderContent();
}

// ── Selection & Open Handlers ──
function selectFinderItem(itemId, event) {
    if (event) event.stopPropagation();
    selectedFinderItem = itemId;

    // Toggle classes in place. Re-rendering the whole viewport on every click
    // replaced the node mid-gesture, made double-click unreliable and threw
    // away the scroll position.
    document.querySelectorAll('#finder-content-viewport [data-item-id]')
        .forEach(el => el.classList.toggle('selected', el.dataset.itemId === itemId));

    // The columns inspector is derived from the selection, so it still needs
    // a repaint — but only that one view.
    if (currentFinderView === 'columns') renderFinderContent();
}

function handleFinderItemOpen(itemId) {
    const item = FS_ITEMS[itemId];
    if (!item) return;

    if (item.kind === 'folder' && item.targetFolder) {
        navigateFinderFolder(item.targetFolder);
    } else if (typeof item.open === 'function') {
        item.open();
    } else if (item.action) {
        // Declarative dispatch instead of eval() on a data string.
        runFinderAction(item.action);
    } else if (item.link) {
        openExternal(item.link);
    } else if (item.preview || item.src) {
        // Everything else opens in Quick Look rather than doing nothing —
        // through the SAME renderer Space uses, so an image shows the image.
        openFinderItemPreview(item);
    }
}

/** Whitelisted actions a filesystem item may trigger. */
const FINDER_ACTIONS = {
    'openResumeWindow()':          () => openResumeWindow(),
    'openWindow(\'notes-window\')':  () => openWindow('notes-window'),
    'openWindow(\'mail-window\')':   () => openWindow('mail-window'),
    'openWindow(\'terminal-window\')': () => openWindow('terminal-window'),
    'openWindow(\'appstore-window\')': () => openWindow('appstore-window'),
    'openWindow(\'settings-window\')': () => openWindow('settings-window'),
    'openWindow(\'trash-window\')':  () => openWindow('trash-window')
};

function runFinderAction(action) {
    const fn = FINDER_ACTIONS[action];
    if (fn) { fn(); return; }
    console.warn('Finder: unrecognised action', action);
}

/** Opens a filesystem item in Quick Look. One render path (quick-look.js). */
function openFinderItemPreview(item) {
    if (typeof openQuickLookForFile === 'function') openQuickLookForFile(item);
}

/** "GitHub", "Vercel", "Hugging Face"… for a link's button label. */
function linkHostLabel(url) {
    try {
        const host = new URL(url).host.replace(/^www\./, '');
        if (/github\.com$/.test(host)) return 'GitHub';
        if (/vercel\.app$/.test(host)) return 'the web';
        if (/huggingface\.co$/.test(host)) return 'Hugging Face';
        if (/linkedin\.com$/.test(host)) return 'LinkedIn';
        return host;
    } catch (e) {
        return 'the web';
    }
}

/* ── AirDrop ────────────────────────────────────────────────────────────
   The share sheet for the portfolio itself. On Apple devices the "Share…"
   button opens the system share sheet — which is where real AirDrop lives. */
function renderAirDropView(container) {
    const canShare = typeof navigator.share === 'function';
    container.innerHTML = `
        <div class="airdrop-view">
            <div class="airdrop-radar" aria-hidden="true">
                <span></span><span></span><span></span>
                <img src="${escapeHtml(window.PROFILE_DATA.photo)}" alt="">
            </div>
            <h3>AirDrop from ${escapeHtml(window.PROFILE_DATA.first)}’s MacBook Pro</h3>
            <p>Take a copy with you — nothing to sign up for.</p>
            <div class="airdrop-targets">
                <button type="button" class="airdrop-target" onclick="downloadResume()">
                    <img src="assets/icons/filetype-pdf.svg" alt=""><span>Résumé</span><small>PDF</small>
                </button>
                <button type="button" class="airdrop-target" onclick="downloadContactCard()">
                    <img src="assets/icons/filetype-contact.svg" alt=""><span>Contact Card</span><small>vCard</small>
                </button>
                <button type="button" class="airdrop-target" onclick="copyTextToClipboard(portfolioUrl(), 'Portfolio link copied')">
                    <img src="assets/icons/safari.png" alt=""><span>Portfolio Link</span><small>Copy URL</small>
                </button>
            </div>
            ${canShare ? `<button type="button" class="app-pill-btn primary airdrop-share" onclick="sharePortfolio()"><i class="fas fa-arrow-up-from-bracket"></i> Share…</button>` : ''}
        </div>`;
    const status = document.getElementById('finder-status-text');
    if (status) status.textContent = 'AirDrop — discoverable by everyone';
}

// portfolioUrl(), sharePortfolio() and downloadContactCard() live in
// js/shared/contact-form.js (also used by the iPhone version).

/** Applications folder = the same app list Launchpad shows. */
function buildApplicationsFolder() {
    if (typeof LAUNCHPAD_APPS === 'undefined') return;
    AAKASH_STYLE_FS.applications.items = LAUNCHPAD_APPS.map(app => {
        const id = `app-${app.id}`;
        FS_ITEMS[id] = { id, name: app.name, kind: 'Application', ext: 'app', icon: app.icon, date: '—', size: '—', open: () => launchApp(app.id) };
        return id;
    });
    FS_ITEMS.applications = { id: 'applications', name: 'Applications', kind: 'folder', icon: 'assets/icons/sf-icons/applications.svg', date: 'Today', size: `${LAUNCHPAD_APPS.length} items`, targetFolder: 'applications' };
}

/* Arrow keys move the selection and Return opens it, like Finder. */
document.addEventListener('keydown', (e) => {
    if (!/^(Arrow(Up|Down|Left|Right)|Enter)$/.test(e.key)) return;
    if (typeof getActiveWindow !== 'function') return;
    const win = getActiveWindow();
    if (!win || win.id !== 'finder-window') return;
    if (typeof quickLookOpen !== 'undefined' && quickLookOpen) return;
    const t = document.activeElement;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

    const nodes = [...document.querySelectorAll('#finder-content-viewport [data-item-id]')];
    if (!nodes.length) return;
    e.preventDefault();
    const i = nodes.findIndex(n => n.dataset.itemId === selectedFinderItem);

    if (e.key === 'Enter') {
        if (i !== -1) handleFinderItemOpen(nodes[i].dataset.itemId);
        return;
    }
    let step = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
    if (currentFinderView === 'icons' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        // Step a whole row in the icon grid.
        const top0 = nodes[0].offsetTop;
        const perRow = Math.max(1, nodes.filter(n => n.offsetTop === top0).length);
        step *= perRow;
    }
    const next = nodes[Math.min(nodes.length - 1, Math.max(0, (i === -1 ? 0 : i + step)))];
    selectFinderItem(next.dataset.itemId);
    next.focus({ preventScroll: true });
    next.scrollIntoView({ block: 'nearest' });
});

// ── Bottom Bar ──
function updateFinderBottomBar() {
    const breadcrumbEl = document.getElementById('finder-breadcrumbs');
    const statusEl = document.getElementById('finder-status-text');

    if (breadcrumbEl) {
        breadcrumbEl.innerHTML = `
            <span class="finder-path-segment" onclick="navigateFinderFolder('home')">
                <i class="fas fa-hdd" style="font-size:10px;margin-right:2px;"></i> Macintosh HD
            </span>
            <span class="finder-path-sep">›</span>
            <span class="finder-path-segment" onclick="navigateFinderFolder('home')">Users</span>
            <span class="finder-path-sep">›</span>
            <span class="finder-path-segment" onclick="navigateFinderFolder('home')">${escapeHtml(window.PROFILE_DATA.first)}</span>
            ${currentFinderFolder !== 'home' ? `
                <span class="finder-path-sep">›</span>
                <span class="finder-path-segment active">${(AAKASH_STYLE_FS[currentFinderFolder] || {}).name || ''}</span>
            ` : ''}
        `;
    }

    if (statusEl) {
        const folder = AAKASH_STYLE_FS[currentFinderFolder] || AAKASH_STYLE_FS['home'];
        const count = (folder.items || []).length;
        statusEl.textContent = `${count} item${count !== 1 ? 's' : ''}, 128.4 GB available`;
    }
}

// ── Search Filter ──
function filterFinderSearch(query) {
    const container = document.getElementById('finder-content-viewport');
    if (!container) return;

    if (!query) {
        renderFinder();
        return;
    }

    const q = query.toLowerCase();
    const matches = Object.values(FS_ITEMS).filter(it => it.name.toLowerCase().includes(q));

    if (matches.length === 0) {
        // Previously this rendered an empty pane with no explanation.
        container.innerHTML = `
            <div class="finder-empty-state">
                <i class="fas fa-magnifying-glass"></i>
                <h3>No Results</h3>
                <p>Nothing here matches &ldquo;${escapeHtml(query)}&rdquo;.</p>
            </div>`;
    } else if (currentFinderView === 'list') {
        renderListView(container, matches);
    } else {
        // Columns view can't express a flat result set — fall back to icons
        // AND move the segmented control so the UI doesn't lie about the mode.
        if (currentFinderView === 'columns') setFinderViewMode('icons');
        renderIconsView(container, matches);
    }

    const statusEl = document.getElementById('finder-status-text');
    if (statusEl) statusEl.textContent = `${matches.length} result${matches.length !== 1 ? 's' : ''} for "${query}"`;
}

// ── Legacy Compatibility Layer ──
function openFinderPane(paneName) {
    openWindow('finder-window');
    finderSidebarNav(paneName);
}

function switchFinderPane(paneName) {
    finderSidebarNav(paneName);
}

// ── Initialize on DOM ready ──
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initFinderV2, 100);
});
