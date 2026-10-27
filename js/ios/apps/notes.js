/* ==========================================================================
   Notes — curated notes, your own notes, and Recently Deleted
   --------------------------------------------------------------------------
   Curated content comes from js/data/notes.js. Notes you write are stored
   exactly like the Mac's (localStorage 'notes-user-v1', plain text), so a
   note written on one version shows up on the other in the same browser.
   "Recently Deleted" holds the Trash post-mortems: ideas that were cut, and
   why.
   ========================================================================== */

(function () {
    const USER_NOTES_KEY = 'notes-user-v1';
    const FOLDERS = [
        ['philosophy', 'Philosophy', 'fas fa-lightbulb'],
        ['learning', 'Current Learning', 'fas fa-brain'],
        ['stack', 'Tech Notes', 'fas fa-layer-group'],
        ['personal', 'Personal', 'fas fa-user'],
        ['notes', 'Notes', 'fas fa-note-sticky']
    ];
    const folderLabel = (key) => (FOLDERS.find(f => f[0] === key) || [key, 'Notes'])[1];
    let query = '';

    /* ── Storage (same format as js/apps/notes.js on the Mac) ─────────── */
    function textToHtml(text) {
        return String(text || '').split('\n').map(line => `<p>${escapeHtml(line) || '<br>'}</p>`).join('');
    }

    function load() {
        try {
            JSON.parse(localStorage.getItem(USER_NOTES_KEY) || '[]').forEach(n => {
                notesData[n.id] = { title: n.title, date: n.date, listDate: n.listDate, category: n.category || 'notes', text: n.text || '', body: textToHtml(n.text), isUserNote: true, updated: n.updated || 0 };
            });
        } catch (e) { /* corrupt or unavailable storage — start clean */ }
    }

    function persist() {
        const list = Object.entries(notesData).filter(([, n]) => n.isUserNote)
            .map(([id, n]) => ({ id, title: n.title, date: n.date, listDate: n.listDate, category: n.category, text: n.text, updated: n.updated }));
        try { localStorage.setItem(USER_NOTES_KEY, JSON.stringify(list)); } catch (e) { /* quota — keep in memory */ }
    }

    function preview(n) {
        if (n.isUserNote) return (n.text || '').replace(/\s+/g, ' ').trim();
        const tmp = document.createElement('div');
        tmp.innerHTML = n.body;
        return tmp.textContent.replace(/\s+/g, ' ').trim();
    }

    function ids(folder) {
        const q = query.toLowerCase();
        return Object.keys(notesData)
            .filter(id => (folder === 'all' || notesData[id].category === folder))
            .filter(id => !q || `${notesData[id].title} ${preview(notesData[id])}`.toLowerCase().includes(q))
            .sort((a, b) => (notesData[b].updated || 0) - (notesData[a].updated || 0));
    }

    /* ── Pages ────────────────────────────────────────────────────────── */
    function folders(content) {
        const trash = window.TRASH_ITEMS || [];
        const used = FOLDERS.filter(([key]) => ids(key).length);
        content.innerHTML = `
            ${IOS.group([
                { icon: 'fas fa-folder', color: '#ffb800', title: 'All iCloud', detail: String(Object.keys(notesData).length), chevron: true, action: 'all' },
                ...used.map(([key, label, icon]) => ({ icon, color: '#ffb800', title: label, detail: String(ids(key).length), chevron: true, action: `f-${key}` }))
            ], { header: 'iCloud' })}
            ${IOS.group([{ icon: 'fas fa-trash', color: '#8e8e93', title: 'Recently Deleted', sub: 'Ideas that were cut, and why', detail: String(trash.length), chevron: true, action: 'deleted' }])}
            <button type="button" class="notes-fab" data-action="new" aria-label="New note"><i class="fas fa-pen-to-square"></i></button>`;
        const handlers = { all: () => IOS.go('notes', ['all']), deleted: () => IOS.go('notes', ['deleted']), new: () => createNote() };
        used.forEach(([key]) => { handlers[`f-${key}`] = () => IOS.go('notes', ['f', key]); });
        IOS.bind(content, handlers);
    }

    function list(content, folder, base) {
        const draw = () => {
            const shown = ids(folder);
            listBox.innerHTML = shown.length ? `<div class="ios-group">${shown.map(id => {
                const n = notesData[id];
                return `<button type="button" class="ios-row notes-row" data-note="${escapeHtml(id)}">
                    <span class="ios-row-text">
                        <span class="ios-row-title">${escapeHtml(n.title || 'New Note')}</span>
                        <span class="ios-row-sub"><b>${escapeHtml(n.listDate || '')}</b> ${escapeHtml(preview(n).slice(0, 90) || 'No additional text')}</span>
                    </span>
                </button>`;
            }).join('')}</div>` : IOS.emptyState('fas fa-note-sticky', query ? 'No Results' : 'No Notes', query ? `Nothing matches “${query}”.` : '');
            count.textContent = `${shown.length} ${shown.length === 1 ? 'Note' : 'Notes'}`;
        };
        content.innerHTML = `
            <label class="notes-search"><i class="fas fa-magnifying-glass"></i><input type="search" placeholder="Search" value="${escapeHtml(query)}" aria-label="Search notes"></label>
            <div class="notes-list"></div>
            <div class="notes-count"></div>
            <button type="button" class="notes-fab" aria-label="New note"><i class="fas fa-pen-to-square"></i></button>`;
        const listBox = content.querySelector('.notes-list');
        const count = content.querySelector('.notes-count');
        content.querySelector('input').addEventListener('input', (e) => { query = e.target.value; draw(); });
        content.querySelector('.notes-fab').addEventListener('click', () => createNote(folder === 'all' ? 'notes' : folder));
        listBox.addEventListener('click', (e) => {
            const row = e.target.closest('[data-note]');
            if (row) IOS.go('notes', [...base, row.dataset.note]);
        });
        draw();
    }

    function note(content, id, ctx) {
        const n = notesData[id];
        if (!n) { content.innerHTML = IOS.emptyState('fas fa-note-sticky', 'Note not found', 'It may have been deleted.'); return; }
        if (!n.isUserNote) {
            content.innerHTML = `<article class="notes-doc"><div class="notes-date">${escapeHtml(n.date || '')}</div><h1>${escapeHtml(n.title)}</h1><div class="notes-body">${n.body}</div></article>`;
            return;
        }
        content.innerHTML = `
            <article class="notes-doc editing">
                <div class="notes-date">${escapeHtml(n.date || '')}</div>
                <input class="notes-title-input" value="${escapeHtml(n.title)}" aria-label="Title" enterkeyhint="next">
                <textarea class="notes-text" placeholder="Start writing…" aria-label="Note">${escapeHtml(n.text || '')}</textarea>
            </article>`;
        const title = content.querySelector('.notes-title-input');
        const text = content.querySelector('.notes-text');
        const grow = () => { text.style.height = 'auto'; text.style.height = `${Math.max(240, text.scrollHeight)}px`; };
        const save = () => {
            n.title = title.value.trim() || 'New Note';
            n.text = text.value;
            n.body = textToHtml(n.text);
            n.updated = Date.now();
            persist();
        };
        title.addEventListener('input', save);
        title.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); text.focus(); } });
        text.addEventListener('input', () => { save(); grow(); });
        requestAnimationFrame(grow);
        if (ctx.fresh) setTimeout(() => { title.focus(); title.select(); }, 450);
    }

    function deletedList(content) {
        const items = window.TRASH_ITEMS || [];
        content.innerHTML = `
            <p class="notes-deleted-intro">Things Mudit tried, built or drafted — and cut. Each one says why.</p>
            ${IOS.group(items.map((t, i) => ({ icon: 'fas fa-file-circle-xmark', color: '#8e8e93', title: t.name, sub: t.kind, chevron: true, action: `t-${i}` })))}`;
        const handlers = {};
        items.forEach((_, i) => { handlers[`t-${i}`] = () => IOS.go('notes', ['deleted', String(i)]); });
        IOS.bind(content, handlers);
    }

    function deletedItem(content, i) {
        const t = (window.TRASH_ITEMS || [])[i];
        if (!t) { content.innerHTML = IOS.emptyState('fas fa-trash', 'Not found', ''); return; }
        content.innerHTML = `
            <article class="notes-doc">
                <div class="notes-date">${escapeHtml(t.kind)}</div>
                <h1>${escapeHtml(t.name)}</h1>
                <div class="notes-body"><p>${escapeHtml(t.reason)}</p></div>
                <div class="notes-cut"><i class="fas fa-scissors"></i> Cut on purpose — kept here so the reasoning isn't lost.</div>
            </article>`;
    }

    /* ── Actions ──────────────────────────────────────────────────────── */
    let freshId = null;

    function createNote(category = 'notes') {
        const id = 'note-' + Date.now();
        const now = new Date();
        notesData[id] = {
            title: 'New Note',
            date: now.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) + ' at ' + now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
            listDate: now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
            category, text: '', body: '', isUserNote: true, updated: Date.now()
        };
        persist();
        freshId = id;
        IOS.go('notes', ['all', id]);
    }

    function deleteNote(id) {
        const n = notesData[id];
        if (!n || !n.isUserNote) return;
        delete notesData[id];
        persist();
        IOS.back();
        showToast('Note deleted', {
            body: n.title, icon: 'fas fa-trash',
            action: { label: 'Undo', run: () => { notesData[id] = n; persist(); IOS.go('notes', ['all', id]); } }
        });
    }

    load();

    IOS.register('notes', {
        name: 'Notes',
        icon: 'assets/icons/notes.png',
        keywords: 'notes philosophy learning write deleted trash',
        pages(path) {
            const root = { key: 'folders', title: 'Folders', render: folders };
            const [a, b, c] = path;
            const noteDesc = (id, base) => {
                const n = notesData[id];
                const fresh = freshId === id;
                if (fresh) freshId = null;
                return {
                    key: `n-${id}`, title: '', largeTitle: false, className: 'notes-note', backTitle: n ? n.title : 'Note',
                    actions: n && n.isUserNote ? [{ icon: 'fas fa-trash', label: 'Delete note', onClick: () => deleteNote(id) }] : [],
                    render: (el, ctx) => note(el, id, { ...ctx, fresh })
                };
            };
            if (a === 'all') {
                const listPage = { key: 'all', title: 'All iCloud', backTitle: 'Notes', render: (el) => list(el, 'all', ['all']) };
                return b ? [root, listPage, noteDesc(b)] : [root, listPage];
            }
            if (a === 'f' && b) {
                const listPage = { key: `f-${b}`, title: folderLabel(b), backTitle: folderLabel(b), render: (el) => list(el, b, ['f', b]) };
                return c ? [root, listPage, noteDesc(c)] : [root, listPage];
            }
            if (a === 'deleted') {
                const del = { key: 'deleted', title: 'Recently Deleted', backTitle: 'Deleted', render: deletedList };
                return b !== undefined ? [root, del, { key: `t-${b}`, title: '', largeTitle: false, className: 'notes-note', render: (el) => deletedItem(el, +b) }] : [root, del];
            }
            return [root];
        }
    });
})();
