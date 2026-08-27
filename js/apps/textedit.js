/* ==========================================================================
   TextEdit.app — plain-text viewer for README.txt
   --------------------------------------------------------------------------
   A .txt file should open in something that looks like a text editor, not a
   styled HTML pane. Monospaced, plain, with a real character/line count.
   ========================================================================== */

function openTextFile(fileId) {
    const file = (window.TEXT_FILES || {})[fileId];
    if (!file) return;

    const body = file.body;
    const titleEl = document.getElementById('textedit-title');
    const bodyEl  = document.getElementById('textedit-body');
    const statsEl = document.getElementById('textedit-stats');

    if (titleEl) titleEl.textContent = file.name;
    // textContent, never innerHTML — this is a plain-text document.
    if (bodyEl) bodyEl.textContent = body;
    if (statsEl) {
        const lines = body.split('\n').length;
        const words = body.trim().split(/\s+/).length;
        statsEl.textContent = `${lines} lines · ${words} words · ${body.length} characters · Plain Text`;
    }

    openWindow('textedit-window');
}
