/* ==========================================================================
   Trash.app — ideas that didn't make it
   --------------------------------------------------------------------------
   Renders window.TRASH_ITEMS (js/data/desktop-files.js), the same list the
   Finder's Trash location shows. It used to be four hardcoded joke files in
   index.html while Finder showed two different ones and the real dataset —
   honest post-mortems of cut features — went unused.
   ========================================================================== */

let trashEmptied = false;
let selectedTrashIndex = -1;

function renderTrash() {
    const area = document.getElementById('trash-content-area');
    const title = document.getElementById('trash-title');
    const dockImg = document.getElementById('dock-trash-img');
    const items = window.TRASH_ITEMS || [];
    if (!area) return;

    if (dockImg) dockImg.src = trashEmptied ? 'assets/icons/trash.png' : 'assets/icons/trash-full.png';

    if (trashEmptied || items.length === 0) {
        if (title) title.textContent = 'Trash';
        area.innerHTML = `
            <div class="trash-empty-state">
                <i class="fas fa-trash-can"></i>
                <div class="trash-empty-title">Trash is Empty</div>
                <p>Every cut idea has been recycled into the things that shipped.</p>
                <button type="button" class="app-pill-btn" onclick="restoreTrash()"><i class="fas fa-rotate-left"></i> Put Back</button>
            </div>`;
        return;
    }

    if (title) title.textContent = `Trash — ${items.length} items`;
    area.innerHTML = `
        <div class="trash-grid">
            ${items.map((t, i) => `
                <button type="button" class="trash-item ${i === selectedTrashIndex ? 'selected' : ''}" onclick="selectTrashItem(${i})" ondblclick="selectTrashItem(${i})">
                    <img src="${escapeHtml(typeof trashIconFor === 'function' ? trashIconFor(t.name) : 'assets/icons/filetype-txt.svg')}" alt="">
                    <span class="trash-item-name">${escapeHtml(t.name)}</span>
                </button>`).join('')}
        </div>
        <div class="trash-detail" id="trash-detail">
            ${selectedTrashIndex >= 0 ? trashDetailHtml(items[selectedTrashIndex]) : `<div class="trash-detail-hint">Select an item to see why it was cut.</div>`}
        </div>`;
}

function trashDetailHtml(t) {
    return `<div class="trash-detail-kind">${escapeHtml(t.kind)}</div>
            <div class="trash-detail-name">${escapeHtml(t.name)}</div>
            <p>${escapeHtml(t.reason)}</p>`;
}

function selectTrashItem(index) {
    selectedTrashIndex = index;
    renderTrash();
}

function emptyTrash() {
    if (trashEmptied) return;
    trashEmptied = true;
    selectedTrashIndex = -1;
    if (typeof playSystemSound === 'function') playSystemSound('trashEmpty');
    renderTrash();
}

function restoreTrash() {
    trashEmptied = false;
    renderTrash();
}

document.addEventListener('DOMContentLoaded', renderTrash);
