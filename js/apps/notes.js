/* ==========================================================================
   Notes.app (iCloud Notes) Controller & Data Store
   ========================================================================== */

// The curated notes (notesData) live in js/data/notes.js, shared with iPhone.

let activeNoteId = 1;
let activeNotesCategory = 'all';
let notesQuery = '';
const USER_NOTES_KEY = 'notes-user-v1';

/* Notes you write are stored as plain text (never HTML) and re-rendered
   escaped, so a note can't inject markup into the page on reload. */
function noteTextToHtml(text) {
    return String(text || '').split('\n').map(line => `<p>${escapeHtml(line) || '<br>'}</p>`).join('');
}

function loadUserNotes() {
    try {
        const list = JSON.parse(localStorage.getItem(USER_NOTES_KEY) || '[]');
        list.forEach(n => {
            notesData[n.id] = { title: n.title, date: n.date, listDate: n.listDate, category: n.category || 'notes', text: n.text || '', body: noteTextToHtml(n.text), isUserNote: true, updated: n.updated || 0 };
        });
    } catch (e) { /* corrupt or unavailable storage — start clean */ }
}

function persistUserNotes() {
    const list = Object.entries(notesData)
        .filter(([, n]) => n.isUserNote)
        .map(([id, n]) => ({ id, title: n.title, date: n.date, listDate: n.listDate, category: n.category, text: n.text, updated: n.updated }));
    try { localStorage.setItem(USER_NOTES_KEY, JSON.stringify(list)); } catch (e) { /* quota — keep in memory */ }
}

function notePreviewText(note) {
    if (note.isUserNote) return (note.text || '').replace(/\s+/g, ' ').trim();
    const tmp = document.createElement('div');
    tmp.innerHTML = note.body;
    return tmp.textContent.replace(/\s+/g, ' ').trim();
}

function visibleNoteIds() {
    const q = notesQuery.toLowerCase();
    return Object.keys(notesData)
        .filter(id => {
            const n = notesData[id];
            if (activeNotesCategory !== 'all' && n.category !== activeNotesCategory) return false;
            if (!q) return true;
            return (n.title + ' ' + notePreviewText(n)).toLowerCase().includes(q);
        })
        // Your own notes first (newest first), then the curated ones in order.
        .sort((a, b) => (notesData[b].updated || 0) - (notesData[a].updated || 0));
}

function renderNotesList() {
    const list = document.getElementById('notes-list');
    if (!list) return;
    const ids = visibleNoteIds();
    list.innerHTML = ids.length ? ids.map(id => {
        const n = notesData[id];
        const preview = notePreviewText(n).slice(0, 60) || 'No additional text';
        return `<div class="note-item ${String(id) === String(activeNoteId) ? 'active' : ''}" data-note-id="${escapeHtml(id)}" data-category="${escapeHtml(n.category || 'notes')}" tabindex="0" role="button"
                     onclick="selectNote('${escapeAttr(id)}', this)" onkeydown="if(event.key==='Enter'){selectNote('${escapeAttr(id)}', this)}">
                    <div class="note-item-title">${escapeHtml(n.title || 'New Note')}</div>
                    <div class="note-item-meta"><span class="note-time">${escapeHtml(n.listDate || '')}</span> ${escapeHtml(preview)}</div>
                </div>`;
    }).join('') : `<div class="notes-empty">${notesQuery ? 'No notes match your search.' : 'No notes in this folder.'}</div>`;

    // Folder counts
    document.querySelectorAll('.notes-count').forEach(el => {
        const cat = el.dataset.count;
        el.textContent = Object.values(notesData).filter(n => cat === 'all' || n.category === cat).length;
    });
}

function selectNote(id, element) {
    if (activeNoteId && String(activeNoteId) !== String(id)) commitNoteEdit(activeNoteId);
    activeNoteId = id;
    if (element) {
        const layout = document.querySelector('.notes-layout');
        if (layout) layout.classList.add('show-detail');
    }

    document.querySelectorAll('.note-item').forEach(item => item.classList.toggle('active', item.dataset.noteId === String(id)));

    const note = notesData[id];
    if (!note) return;

    const titleDisplay = document.getElementById('note-title-display');
    const dateStamp = document.getElementById('note-date-stamp');
    const bodyContent = document.getElementById('note-body-content');

    if (titleDisplay) titleDisplay.textContent = note.title;
    if (dateStamp) dateStamp.textContent = note.date;
    if (bodyContent) bodyContent.innerHTML = note.body;

    // Only notes the visitor created are editable; the curated ones are read-only.
    const editable = Boolean(note.isUserNote);
    if (titleDisplay) titleDisplay.contentEditable = String(editable);
    if (bodyContent) bodyContent.contentEditable = String(editable);
    if (bodyContent) bodyContent.dataset.placeholder = editable ? 'Start typing…' : '';
    const del = document.getElementById('notes-delete-btn');
    if (del) del.style.display = editable ? '' : 'none';
}

function switchNotesCategory(cat, element) {
    activeNotesCategory = cat;
    const row = element || document.querySelector(`.notes-sidebar .sidebar-item[data-category="${cat}"]`);
    document.querySelectorAll('.notes-sidebar .sidebar-item').forEach(item => item.classList.toggle('active', item === row));
    renderNotesList();
    const first = visibleNoteIds()[0];
    if (first !== undefined && !visibleNoteIds().includes(String(activeNoteId))) selectNote(first);
}

function filterNotes(query) {
    notesQuery = String(query || '').trim();
    renderNotesList();
}

/** Creates a note inline in the editor pane — no blocking prompt() dialogs. */
function addNewNotePrompt() {
    if (activeNoteId) commitNoteEdit(activeNoteId);
    const newId = 'note-' + Date.now();
    const now = new Date();
    const dateStr = now.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
                  + ' at ' + now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

    notesData[newId] = {
        title: 'New Note', date: dateStr, listDate: now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
        category: activeNotesCategory === 'all' ? 'notes' : activeNotesCategory,
        text: '', body: '', isUserNote: true, updated: Date.now()
    };
    notesQuery = '';
    const search = document.getElementById('notes-search-input');
    if (search) search.value = '';
    persistUserNotes();
    renderNotesList();
    selectNote(newId, true);

    // Focus the title the way Notes.app does, ready to type over it.
    const titleEl = document.getElementById('note-title-display');
    if (titleEl) {
        titleEl.focus();
        document.getSelection().selectAllChildren(titleEl);
    }
}

/** Persists inline edits back into notesData, the list, and localStorage. */
function commitNoteEdit(noteId) {
    const note = notesData[noteId];
    if (!note || !note.isUserNote) return;

    const titleEl = document.getElementById('note-title-display');
    const bodyEl = document.getElementById('note-body-content');
    const title = titleEl ? titleEl.textContent.trim() || 'New Note' : note.title;
    const text = bodyEl ? String(bodyEl.innerText ?? bodyEl.textContent).replace(/\n{3,}/g, '\n\n').trim() : note.text;
    if (title === note.title && text === note.text) return;

    note.title = title;
    note.text = text;
    note.body = noteTextToHtml(text);
    note.updated = Date.now();
    persistUserNotes();
    renderNotesList();
}

function deleteActiveNote() {
    const note = notesData[activeNoteId];
    if (!note || !note.isUserNote) {
        if (typeof showToast === 'function') showToast('This note is read-only', { body: 'Only notes you create can be deleted.', icon: 'fas fa-lock' });
        return;
    }
    const removed = { id: activeNoteId, note };
    delete notesData[activeNoteId];
    persistUserNotes();
    renderNotesList();
    const next = visibleNoteIds()[0] || Object.keys(notesData)[0];
    if (next !== undefined) selectNote(next);
    if (typeof showToast === 'function') {
        showToast('Note deleted', {
            body: removed.note.title, icon: 'fas fa-trash-can',
            action: { label: 'Undo', run: () => { notesData[removed.id] = removed.note; persistUserNotes(); renderNotesList(); selectNote(removed.id); } }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadUserNotes();
    renderNotesList();
    selectNote(activeNoteId);
    ['note-title-display', 'note-body-content'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('blur', () => commitNoteEdit(activeNoteId));
        // Save as you type (debounced), like iCloud Notes.
        let t = null;
        el.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => commitNoteEdit(activeNoteId), 400); });
    });
    // Return in the title moves to the body instead of inserting a line break.
    const titleEl = document.getElementById('note-title-display');
    if (titleEl) titleEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); const b = document.getElementById('note-body-content'); if (b) b.focus(); }
    });
});
