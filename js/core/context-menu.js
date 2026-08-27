/* ==========================================================================
   Right-Click Context Menus
   --------------------------------------------------------------------------
   macOS is built out of contextual menus; the portfolio had none at all.
   One renderer, one dismissal path, and a per-surface menu definition.
   ========================================================================== */

let contextMenuEl = null;

function ensureContextMenuDom() {
    if (contextMenuEl) return contextMenuEl;
    contextMenuEl = document.createElement('div');
    contextMenuEl.className = 'context-menu hidden';
    contextMenuEl.setAttribute('role', 'menu');
    document.body.appendChild(contextMenuEl);
    return contextMenuEl;
}

function hideContextMenu() {
    if (contextMenuEl) contextMenuEl.classList.add('hidden');
}

/**
 * @param {number} x  viewport x
 * @param {number} y  viewport y
 * @param {Array<{label?:string, glyph?:string, run?:Function, disabled?:boolean, separator?:boolean}>} items
 */
function showContextMenu(x, y, items) {
    const menu = ensureContextMenuDom();

    menu.innerHTML = items.map((item, i) => {
        if (item.separator) return '<div class="context-menu-sep"></div>';
        return `<div class="context-menu-item ${item.disabled ? 'disabled' : ''}" data-index="${i}" role="menuitem">
                    ${item.glyph ? `<i class="${escapeHtml(item.glyph)}"></i>` : '<i></i>'}
                    <span>${escapeHtml(item.label)}</span>
                </div>`;
    }).join('');

    menu.classList.remove('hidden');

    // Flip near the viewport edges so the menu is never clipped.
    const rect = menu.getBoundingClientRect();
    const left = (x + rect.width  > window.innerWidth)  ? x - rect.width  : x;
    const top  = (y + rect.height > window.innerHeight) ? y - rect.height : y;
    menu.style.left = Math.max(4, left) + 'px';
    menu.style.top  = Math.max(32, top) + 'px';

    menu.querySelectorAll('.context-menu-item').forEach(el => {
        el.addEventListener('click', () => {
            const item = items[Number(el.dataset.index)];
            hideContextMenu();
            if (item && !item.disabled && item.run) item.run();
        });
    });
}

/* ── Menu definitions per surface ───────────────────────────────────────── */

function desktopContextMenu() {
    return [
        { label: 'New Finder Window', glyph: 'fas fa-folder', run: () => openWindow('finder-window') },
        { label: 'Open Spotlight',    glyph: 'fas fa-magnifying-glass', run: () => openSpotlight() },
        { separator: true },
        { label: 'Ask Iris',          glyph: 'fas fa-wand-magic-sparkles', run: () => openIris() },
        { separator: true },
        { label: 'Change Wallpaper…', glyph: 'fas fa-image', run: () => {
            openWindow('settings-window');
            const tab = document.querySelector('.settings-sidebar .sidebar-item[onclick*="wallpaper"]');
            switchSettingsTab('wallpaper', tab);
        }},
        { label: 'System Settings…',  glyph: 'fas fa-gear', run: () => openWindow('settings-window') }
    ];
}

function desktopIconContextMenu(icon) {
    const key = icon.getAttribute('data-ql-key');
    return [
        { label: 'Open',       glyph: 'fas fa-folder-open', run: () => icon.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })) },
        { label: 'Quick Look', glyph: 'fas fa-eye', run: () => { selectItem(icon); openQuickLook(key); } },
        { separator: true },
        { label: 'Get Info',   glyph: 'fas fa-circle-info', run: () => { selectItem(icon); openQuickLook(key); } }
    ];
}

function windowContextMenu(win) {
    const maximized = win.classList.contains('is-maximized');
    return [
        { label: 'Minimize', glyph: 'fas fa-minus',  run: () => minimizeWindow(win.id) },
        { label: maximized ? 'Restore' : 'Zoom', glyph: 'fas fa-expand', run: () => maximizeWindow(win.id) },
        { separator: true },
        { label: 'Close',    glyph: 'fas fa-xmark',  run: () => closeWindow(win.id) }
    ];
}

function dockItemContextMenu(dockItem) {
    const windowId = (dockItem.getAttribute('onclick') || '').match(/'([\w-]+)'/);
    const targetId = windowId ? windowId[1] : null;
    const win = targetId ? document.getElementById(targetId) : null;
    const running = win && !win.classList.contains('hidden');
    const name = dockItem.getAttribute('data-tooltip') || 'App';

    const items = [{ label: name.split(' (')[0], disabled: true }, { separator: true }];
    if (running) {
        items.push({ label: 'Show',  glyph: 'fas fa-eye',   run: () => openWindow(targetId) });
        items.push({ label: 'Quit',  glyph: 'fas fa-power-off', run: () => closeWindow(targetId) });
    } else {
        items.push({ label: 'Open',  glyph: 'fas fa-play',  run: () => dockItem.click() });
    }
    return items;
}

function finderItemContextMenu(itemId) {
    const item = (typeof FS_ITEMS === 'object') ? FS_ITEMS[itemId] : null;
    if (!item) return [];
    const menu = [
        { label: 'Open', glyph: 'fas fa-folder-open', run: () => handleFinderItemOpen(itemId) }
    ];
    if (item.preview) {
        menu.push({ label: 'Quick Look', glyph: 'fas fa-eye', run: () => openFinderItemPreview(item) });
    }
    if (item.link) {
        menu.push({ separator: true });
        menu.push({ label: 'Open Link in Browser', glyph: 'fas fa-arrow-up-right-from-square', run: () => openExternal(item.link) });
        menu.push({ label: 'Copy Link', glyph: 'fas fa-link', run: () => copyTextToClipboard(item.link, 'Link copied') });
    }
    return menu;
}

/* ── Dispatch ───────────────────────────────────────────────────────────── */

document.addEventListener('contextmenu', (e) => {
    // Let the browser's own menu through on real text selections and inputs,
    // so copy/paste still works where a visitor would expect it.
    if (e.target.closest('input, textarea, [contenteditable="true"]')) return;
    if (!window.getSelection().isCollapsed) return;

    const finderRow = e.target.closest('#finder-content-viewport [data-item-id]');
    const desktopIcon = e.target.closest('.desktop-icon');
    const dockItem = e.target.closest('.dock-item');
    const win = e.target.closest('.window');

    let items = null;
    if (finderRow)          items = finderItemContextMenu(finderRow.dataset.itemId);
    else if (desktopIcon)   items = desktopIconContextMenu(desktopIcon);
    else if (dockItem)      items = dockItemContextMenu(dockItem);
    else if (win)           items = windowContextMenu(win);
    else if (e.target.closest('.desktop') || e.target === document.body) items = desktopContextMenu();

    if (!items || items.length === 0) return;

    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, items);
});

document.addEventListener('click', hideContextMenu);
document.addEventListener('scroll', hideContextMenu, true);
window.addEventListener('blur', hideContextMenu);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideContextMenu(); });
