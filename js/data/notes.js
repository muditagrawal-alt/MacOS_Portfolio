/* ==========================================================================
   Notes — curated content shared by Notes on Mac and iPhone
   --------------------------------------------------------------------------
   Generated from `notes` in the info bank (js/data/profile.js). Visitors'
   own notes are added to this object at runtime (and persisted under the
   'notes-user-v1' localStorage key) by each shell's Notes app.
   ========================================================================== */

const notesData = Object.fromEntries(window.PROFILE_DATA.notes.map((n, i) => [i + 1, {
    title: n.title,
    category: n.folder.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    folder: n.folder,
    listDate: n.dateShort,
    date: n.dateLong,
    body: n.html
}]));

/** Folders that hold at least one curated note: [{ id, label }], in first-use order. */
function notesFolders() {
    const seen = new Map();
    Object.values(notesData).forEach(n => { if (!n.isUserNote && !seen.has(n.category)) seen.set(n.category, n.folder || n.category); });
    return [...seen].map(([id, label]) => ({ id, label }));
}
