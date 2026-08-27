/* ==========================================================================
   Desktop Controller — renders window.DESKTOP_FILES
   --------------------------------------------------------------------------
   Single click selects, double click opens, Space quick-looks, arrow keys
   move between icons — the way the Finder desktop actually behaves.
   ========================================================================== */

let selectedDesktopFile = null;

function renderDesktopFiles() {
    const container = document.getElementById('desktop-files');
    if (!container || !window.DESKTOP_FILES) return;

    container.innerHTML = window.DESKTOP_FILES.map((f, i) => `
        <div class="desktop-icon" data-file-id="${f.id}" data-ql-key="${f.id}"
             tabindex="0" role="button" aria-label="${escapeHtml(f.name)}, ${escapeHtml(f.kind)}"
             style="--stagger:${i}">
            <div class="desktop-icon-art"><img src="${f.icon}" alt="" draggable="false"></div>
            <span class="desktop-icon-label">${escapeHtml(f.name)}</span>
        </div>
    `).join('');

    container.querySelectorAll('.desktop-icon').forEach(icon => {
        const id = icon.dataset.fileId;
        icon.addEventListener('click', (e) => { e.stopPropagation(); selectDesktopFile(id); });
        icon.addEventListener('dblclick', () => openDesktopFile(id));
        icon.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); openDesktopFile(id); }
        });
    });
}

function selectDesktopFile(id) {
    selectedDesktopFile = id;
    document.querySelectorAll('#desktop-files .desktop-icon').forEach(el =>
        el.classList.toggle('selected', el.dataset.fileId === id));
    // Keep Quick Look's selection in sync — one selection model, not two.
    if (typeof selectedQuickLookItem !== 'undefined') selectedQuickLookItem = id;
}

function deselectDesktopFiles() {
    selectedDesktopFile = null;
    document.querySelectorAll('#desktop-files .desktop-icon.selected')
        .forEach(el => el.classList.remove('selected'));
}

function openDesktopFile(id) {
    const file = (window.DESKTOP_FILES || []).find(f => f.id === id);
    if (file && typeof file.open === 'function') file.open();
}

/* Arrow-key navigation across the desktop grid. */
document.addEventListener('keydown', (e) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    if (document.activeElement && document.activeElement.closest('.window, .spotlight-overlay, input, textarea')) return;
    if (typeof quickLookOpen !== 'undefined' && quickLookOpen) return;

    const files = window.DESKTOP_FILES || [];
    if (files.length === 0) return;

    e.preventDefault();
    const current = files.findIndex(f => f.id === selectedDesktopFile);
    const step = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : -1;
    const next = current === -1
        ? (step === 1 ? 0 : files.length - 1)
        : (current + step + files.length) % files.length;

    selectDesktopFile(files[next].id);
    const el = document.querySelector(`#desktop-files [data-file-id="${files[next].id}"]`);
    if (el) el.focus();
});

document.addEventListener('DOMContentLoaded', () => {
    renderDesktopFiles();
    const desktop = document.getElementById('desktop');
    if (desktop) {
        desktop.addEventListener('click', (e) => {
            if (e.target === desktop || e.target.id === 'desktop-files') deselectDesktopFiles();
        });
    }
});
