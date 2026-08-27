/* ==========================================================================
   Notes.app (iCloud Notes) Controller & Data Store
   ========================================================================== */

const notesData = {
    1: {
        title: "Engineering Philosophy",
        date: "August 16, 2026 at 2:15 PM",
        body: `
            <p>I value <strong>learning by building</strong> over purely memorizing theoretical concepts. The most instructive moments come when models break under edge cases, latencies spike on inference, or data pipelines hit unexpected bottlenecks.</p>
            <div class="note-checklist">
                <div class="checklist-item"><i class="fas fa-check-circle" style="color:#f6d365;"></i> <span><strong>Context Awareness:</strong> Tech is only as good as the problem it solves.</span></div>
                <div class="checklist-item"><i class="fas fa-check-circle" style="color:#f6d365;"></i> <span><strong>Robustness:</strong> Build systems that hold up outside clean sandbox environments.</span></div>
                <div class="checklist-item"><i class="fas fa-check-circle" style="color:#f6d365;"></i> <span><strong>Speed of Iteration:</strong> Prototype quickly, evaluate rigorously, refactor thoughtfully.</span></div>
            </div>
            <p style="margin-top: 15px; color:#c0bbb4;"><em>"Always stay curious, dig into the internals, and never treat AI models as black boxes."</em></p>
        `
    },
    2: {
        title: "What I'm Learning Currently",
        date: "August 15, 2026 at 6:40 PM",
        body: `
            <p>Areas of deep technical dive right now:</p>
            <div class="note-checklist">
                <div class="checklist-item"><i class="fas fa-circle" style="font-size:8px;color:#f6d365;"></i> <span><strong>Multimodal Agent Architectures:</strong> Function calling, tool use, and structured outputs with open-weights LLMs.</span></div>
                <div class="checklist-item"><i class="fas fa-circle" style="font-size:8px;color:#f6d365;"></i> <span><strong>Model Quantization & Inference:</strong> GGUF, AWQ, vLLM, and TensorRT optimizations for fast localized serving.</span></div>
                <div class="checklist-item"><i class="fas fa-circle" style="font-size:8px;color:#f6d365;"></i> <span><strong>Advanced Vision Transformers:</strong> Video temporal processing and real-time zero-shot detection.</span></div>
            </div>
        `
    },
    3: {
        title: "Core Tech Stack Cheat Sheet",
        date: "August 10, 2026 at 1:10 PM",
        body: `
            <p><strong>Languages:</strong> Python, C, Java, HTML5, CSS3, JavaScript, SQL.</p>
            <p><strong>AI/ML & Deep Learning:</strong> PyTorch, TensorFlow, Keras, OpenCV, Scikit-Learn, Torchvision, Torchaudio.</p>
            <p><strong>Pretrained Models & Tools:</strong> Mistral-7B, YOLOv8/11, Whisper, Coqui XTTS, BLIP, Nomic, FFMPEG, Git, Hugging Face, Linux/Bash.</p>
        `
    },
    4: {
        title: "Quick Facts & Interests",
        date: "August 2, 2026 at 9:30 AM",
        get body() {
            const p = window.PROFILE_DATA || {};
            const edu = p.education || {};
            return `
                <p>• Navy background: Grew up moving across naval bases in Mumbai and New Delhi, developing high adaptability and respect for mission discipline.</p>
                <p>• ${edu.degree || 'B.Tech Computer Science (AI/ML)'} with ${edu.cgpa || ''} CGPA at ${edu.university || 'IILM University'}.</p>
                <p>• Passionate about robotics, applied computer vision, competitive hackathons, and systems-level programming.</p>
            `;
        }
    }
};

let activeNoteId = 1;

function selectNote(id, element) {
    if (activeNoteId && activeNoteId !== id) commitNoteEdit(activeNoteId);
    activeNoteId = id;

    document.querySelectorAll('.note-item').forEach(item => item.classList.remove('active'));
    const row = element || document.querySelector(`.note-item[data-note-id="${id}"]`);
    if (row) row.classList.add('active');

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
}

function switchNotesCategory(cat, element) {
    document.querySelectorAll('.notes-sidebar .sidebar-item').forEach(item => item.classList.remove('active'));
    if (element) element.classList.add('active');

    // The folder rows used to move a highlight and nothing else.
    document.querySelectorAll('.note-item').forEach(row => {
        const rowCat = row.dataset.category || 'notes';
        row.style.display = (cat === 'all' || rowCat === cat) ? '' : 'none';
    });
}

/**
 * Creates a note inline in the editor pane. The previous version fired two
 * blocking prompt() dialogs, which nothing on macOS does — and its \n → <br>
 * conversion was dead code, since prompt() can't return newlines.
 */
function addNewNotePrompt() {
    const newId = 'note-' + Date.now();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  + ' at ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    notesData[newId] = { title: 'New Note', date: dateStr, body: '<p></p>', isUserNote: true };

    const list = document.querySelector('.notes-list');
    if (list) {
        const item = document.createElement('div');
        item.className = 'note-item';
        item.dataset.noteId = newId;
        item.onclick = function () { selectNote(newId, this); };
        item.innerHTML = `<div class="note-item-title">New Note</div>
            <div class="note-item-meta"><span class="note-time">Just now</span> No additional text</div>`;
        list.insertBefore(item, list.firstChild);
        selectNote(newId, item);
    }

    // Focus the title the way Notes.app does, ready to type over it.
    const titleEl = document.getElementById('note-title-display');
    if (titleEl) {
        titleEl.contentEditable = 'true';
        titleEl.focus();
        document.getSelection().selectAllChildren(titleEl);
    }
    const bodyEl = document.getElementById('note-body-content');
    if (bodyEl) bodyEl.contentEditable = 'true';
}

/** Persists inline edits back into notesData and the sidebar row. */
function commitNoteEdit(noteId) {
    const note = notesData[noteId];
    if (!note || !note.isUserNote) return;

    const titleEl = document.getElementById('note-title-display');
    const bodyEl = document.getElementById('note-body-content');
    if (titleEl) note.title = titleEl.textContent.trim() || 'New Note';
    if (bodyEl) note.body = bodyEl.innerHTML;

    const row = document.querySelector(`.note-item[data-note-id="${noteId}"]`);
    if (row) {
        const preview = (bodyEl ? bodyEl.textContent : '').trim().slice(0, 34);
        row.innerHTML = `<div class="note-item-title">${escapeHtml(note.title)}</div>
            <div class="note-item-meta"><span class="note-time">Just now</span> ${escapeHtml(preview) || 'No additional text'}</div>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    ['note-title-display', 'note-body-content'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('blur', () => commitNoteEdit(activeNoteId));
    });
});
