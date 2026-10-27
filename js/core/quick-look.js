/* ==========================================================================
   Quick Look Controller — Spacebar Peek Preview (macOS Style)
   Select items with single click, press Spacebar to preview
   ========================================================================== */

let selectedQuickLookItem = null;
let quickLookOpen = false;
// Where the open preview came from ('desktop' lets arrow keys step through
// the desktop's files, the way Quick Look steps through a Finder selection).
let qlSource = null;

// Every entry is built from the info bank (window.PROFILE_DATA) when it's previewed.
const QUICKLOOK_DATA = {
    'about': {
        title: 'About Me',
        type: 'text',
        icon: 'fas fa-user',
        meta: 'Text Document',
        get content() {
            const p = window.PROFILE_DATA;
            return `<h2>${escapeHtml(p.name)}</h2>
            <h3>${escapeHtml(p.tagline)}</h3>
            <p>${escapeHtml(p.bio)}</p>`;
        },
        openAction: "openFinderPane('about')"
    },
    'experience': {
        title: 'Experience',
        type: 'text',
        icon: 'fas fa-briefcase',
        get meta() {
            return `Folder — ${window.PROFILE_DATA.experience.length} items`;
        },
        get content() {
            const expBlocks = window.PROFILE_DATA.experience.map(e => `
                <h3>${escapeHtml(e.role)} — ${escapeHtml(e.org)}</h3>
                <p style="color:#888;">${escapeHtml(e.dates)}</p>
            `).join('');
            return `<h2>Work Experience</h2>${expBlocks}`;
        },
        openAction: "openFinderPane('experience')"
    },
    'education': {
        title: 'Education',
        type: 'text',
        icon: 'fas fa-graduation-cap',
        get meta() {
            const p = window.PROFILE_DATA;
            return `Folder — ${(p.education.degree ? 1 : 0) + p.education.schooling.length + p.courses.length} items`;
        },
        get content() {
            const p = window.PROFILE_DATA;
            const edu = p.education;
            return `<h2>Education</h2>
            ${edu.degree ? `<h3>${escapeHtml(edu.degree)}</h3>
            <p>${escapeHtml([edu.university, edu.years].filter(Boolean).join(' — '))}</p>
            ${edu.grade ? `<p>${escapeHtml(edu.gradeLabel)}: ${escapeHtml(edu.grade)}</p>` : ''}` : ''}
            ${edu.schooling.map(s => `<h3>${escapeHtml(s.title)}</h3><p>${escapeHtml([s.school, s.score].filter(Boolean).join(' — '))}</p>`).join('')}
            ${p.courses.length ? `<h2 style="margin-top:16px;">Certifications</h2>
            <ul>${p.courses.map(c => `<li><strong>${escapeHtml(c.title)}</strong>${c.issuer ? ` — ${escapeHtml(c.issuer)}` : ''}</li>`).join('')}</ul>` : ''}`;
        },
        openAction: "openFinderPane('education')"
    },
    'projects': {
        title: 'Projects',
        type: 'text',
        icon: 'fas fa-folder-open',
        get meta() {
            return `Folder — ${window.PROFILE_DATA.projects.length} items`;
        },
        get content() {
            return `<h2>Featured Projects</h2>
            <ul>${window.PROFILE_DATA.projects.map(x => `<li><strong>${escapeHtml(x.name)}${x.live ? ' (Live)' : ''}</strong> — ${escapeHtml(x.subtitle)}</li>`).join('')}</ul>`;
        },
        openAction: "openFinderPane('projects')"
    },
    'skills': {
        title: 'Skills',
        type: 'text',
        icon: 'fas fa-code',
        meta: 'Technical Skills Document',
        get content() {
            return `<h2>Skills & Stacks</h2>
            ${window.PROFILE_DATA.skills.map(g => `<h3>${escapeHtml(g.label)}</h3><p>${escapeHtml(g.items.join(', '))}</p>`).join('')}`;
        },
        openAction: "openFinderPane('skills')"
    },
    'mail': {
        title: 'Mail',
        type: 'text',
        icon: 'fas fa-envelope',
        meta: 'Application',
        content: `<div style="text-align:center;padding:20px;">
            <i class="fas fa-envelope" style="font-size:48px;color:#007aff;margin-bottom:12px;"></i>
            <h2>Apple Mail</h2>
            <p style="color:#888;">Contact & Connect</p>
        </div>`,
        openAction: "openWindow('mail-window')"
    },
    'resume': {
        get title() { return window.PROFILE_DATA.resume.downloadName || 'Résumé'; },
        type: 'pdf',
        icon: 'fas fa-file-pdf',
        meta: 'PDF Document',
        openLabel: 'Open with Preview',
        get src() { return window.PROFILE_DATA.resume.preview; },
        openAction: "openResumeWindow()"
    }
};

/** Whitelisted openAction handlers for QUICKLOOK_DATA entries. */
const QUICKLOOK_ACTIONS = {
    "openResumeWindow()":            () => openResumeWindow(),
    "openWindow('mail-window')":     () => openWindow('mail-window'),
    "openWindow('photos-window')":   () => openWindow('photos-window'),
    "openWindow('textedit-window')": () => openWindow('textedit-window'),
    "openFinderPane('about')":       () => openFinderPane('about'),
    "openFinderPane('projects')":    () => openFinderPane('projects'),
    "openFinderPane('experience')":  () => openFinderPane('experience'),
    "openFinderPane('education')":   () => openFinderPane('education'),
    "openFinderPane('skills')":      () => openFinderPane('skills')
};

function initQuickLook() {
    // Spacebar listener
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && quickLookOpen) {
            closeQuickLook();
            return;
        }

        // Arrow keys step through the desktop's files while a preview is up.
        if (quickLookOpen && qlSource === 'desktop' && /^Arrow(Up|Down|Left|Right)$/.test(e.key)) {
            const files = window.DESKTOP_FILES || [];
            const i = files.findIndex(f => f.id === selectedQuickLookItem);
            if (i !== -1) {
                e.preventDefault();
                const step = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : -1;
                const next = files[(i + step + files.length) % files.length];
                if (typeof selectDesktopFile === 'function') selectDesktopFile(next.id);
                openQuickLook(next.id);
            }
            return;
        }

        // Zoom shortcuts while a preview is open, matching Preview.app.
        if (quickLookOpen && qlZoomable) {
            if (e.key === '+' || e.key === '=') { e.preventDefault(); stepQuickLookZoom(1); return; }
            if (e.key === '-' || e.key === '_') { e.preventDefault(); stepQuickLookZoom(-1); return; }
            if (e.key === '0') { e.preventDefault(); setQuickLookZoom(1); return; }
        }
        if (e.code !== 'Space' || isInputFocused()) return;

        // Only swallow Space when it actually means something. It used to be
        // preventDefault()'d on every press, which killed space-to-scroll and
        // space-to-activate on focused buttons across the whole page.
        if (quickLookOpen) {
            e.preventDefault();
            closeQuickLook();
            return;
        }

        // Finder takes priority when it's the frontmost window — Space on a
        // selected file there must Quick Look it, exactly like the real
        // Finder. Previously Quick Look only knew about DESKTOP icons, so
        // Space did nothing at all inside a Finder window.
        if (quickLookFinderSelection()) {
            e.preventDefault();
            return;
        }

        if (selectedQuickLookItem) {
            e.preventDefault();
            openQuickLook(selectedQuickLookItem);
        }
    });

    // Click-to-select desktop icons
    document.querySelectorAll('.desktop-icon[data-ql-key]').forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            selectItem(icon);
        });
    });

    // Click desktop to deselect
    const desktop = document.getElementById('desktop');
    if (desktop) {
        desktop.addEventListener('click', (e) => {
            if (e.target === desktop) {
                deselectAll();
            }
        });
    }

    // Click overlay background to close
    const overlay = document.getElementById('quicklook-overlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeQuickLook();
            }
        });
    }

    const content = document.getElementById('ql-content');
    if (content) {
        // Double-click the document to toggle fit <-> 2x, like Quick Look.
        content.addEventListener('dblclick', (e) => {
            if (e.target.closest('.ql-stage')) toggleQuickLookZoom();
        });

        // Ctrl/Cmd + wheel zooms; a plain wheel still scrolls the document.
        content.addEventListener('wheel', (e) => {
            if (!qlZoomable || !(e.ctrlKey || e.metaKey)) return;
            e.preventDefault();
            setQuickLookZoom(qlZoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12));
        }, { passive: false });

        // Drag to pan once zoomed in.
        let pan = null;
        content.addEventListener('pointerdown', (e) => {
            if (!content.classList.contains('is-zoomed')) return;
            pan = { x: e.clientX, y: e.clientY, l: content.scrollLeft, t: content.scrollTop };
            content.setPointerCapture(e.pointerId);
            content.style.cursor = 'grabbing';
        });
        content.addEventListener('pointermove', (e) => {
            if (!pan) return;
            content.scrollLeft = pan.l - (e.clientX - pan.x);
            content.scrollTop  = pan.t - (e.clientY - pan.y);
        });
        const endPan = () => { pan = null; content.style.cursor = ''; };
        content.addEventListener('pointerup', endPan);
        content.addEventListener('pointercancel', endPan);
    }
}


/**
 * If Finder is frontmost and has a file selected, Quick Look it.
 * @returns {boolean} true if it handled the keypress
 */
function quickLookFinderSelection() {
    const finderWin = document.getElementById('finder-window');
    if (!finderWin || finderWin.classList.contains('hidden')) return false;

    // Only when Finder is actually the active window — otherwise Space
    // would hijack from whatever app the visitor is really looking at.
    if (typeof getActiveWindow === 'function') {
        const active = getActiveWindow();
        if (!active || active.id !== 'finder-window') return false;
    }

    if (typeof selectedFinderItem === 'undefined' || !selectedFinderItem) return false;
    const item = (typeof FS_ITEMS === 'object') ? FS_ITEMS[selectedFinderItem] : null;
    if (!item) return false;

    openQuickLookForFile(item);
    return true;
}

/**
 * Renders a Finder filesystem item in Quick Look, picking the presentation
 * from the file's own type rather than dumping everything into one generic
 * text pane.
 */
function openQuickLookForFile(item) {
    // Items in Finder's Desktop folder ARE the desktop files — preview them
    // exactly as Space on the desktop would.
    if (item.deskId) { openQuickLook(item.deskId); return; }

    const isPdf   = item.ext === 'pdf' || item.kind === 'PDF Document';
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(item.ext);

    // The resume is the one file we have a real rendered page for, so it
    // previews as actual paper the way Preview.app would show it.
    if (item.id === 'resume-pdf') {
        openQuickLookData({
            title: item.name,
            icon: 'fas fa-file-pdf',
            meta: item.size || '',
            imageSrc: window.PROFILE_DATA.resume.preview,
            // No preview image in the info bank: a document card instead of a broken image.
            html: window.PROFILE_DATA.resume.preview ? undefined : `<div class="ql-app-card"><img class="ql-app-icon" src="assets/icons/filetype-pdf.svg" alt=""><h2>${escapeHtml(item.name)}</h2><p>Open to read the PDF.</p></div>`,
            openLabel: 'Open with Preview',
            onOpen: () => { closeQuickLook(); openResumeWindow(); }
        });
        return;
    }

    if (isImage && item.src) {
        openQuickLookData({
            title: item.name, icon: 'fas fa-image', meta: item.size || '',
            imageSrc: item.src
        });
        return;
    }

    const p = item.preview || {};
    openQuickLookData({
        title: item.name,
        icon: isPdf ? 'fas fa-file-pdf' : 'fas fa-file-lines',
        meta: `${item.kind || 'Document'}${item.size ? ' \u2014 ' + item.size : ''}`,
        html: `<div class="ql-text-preview">
                 <h2>${escapeHtml(p.title || item.name)}</h2>
                 ${p.subtitle ? `<h3>${escapeHtml(p.subtitle)}</h3>` : ''}
                 <p style="white-space:pre-line;">${escapeHtml(p.desc || '')}</p>
               </div>`,
        openLabel: item.link ? 'Open Link' : null,
        onOpen: item.link ? () => { closeQuickLook(); openExternal(item.link); } : null
    });
}

function isInputFocused() {
    const active = document.activeElement;
    if (!active) return false;
    const tag = active.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || active.isContentEditable;
}

function selectItem(element) {
    deselectAll();
    element.classList.add('selected');
    selectedQuickLookItem = element.getAttribute('data-ql-key');

    // Show hint briefly
    showQuickLookHint();
}

function deselectAll() {
    document.querySelectorAll('.desktop-icon.selected').forEach(el => el.classList.remove('selected'));
    selectedQuickLookItem = null;
    hideQuickLookHint();
}

function showQuickLookHint() {
    const hint = document.getElementById('quicklook-hint');
    if (hint) {
        hint.classList.add('visible');
        setTimeout(() => hint.classList.remove('visible'), 2000);
    }
}

function hideQuickLookHint() {
    const hint = document.getElementById('quicklook-hint');
    if (hint) hint.classList.remove('visible');
}

/* ── Zoom state ──────────────────────────────────────────────────────────
   macOS Quick Look zooms the DOCUMENT inside the panel; the panel itself
   never changes size. Zoom therefore scales the content element and lets
   .quicklook-content scroll — it must never be applied to .quicklook-window. */
const QL_ZOOM_STEPS = [1, 1.25, 1.5, 2, 2.5, 3];
let qlZoom = 1;
let qlZoomable = false;

function applyQuickLookZoom() {
    const stage = document.getElementById('ql-stage');
    const readout = document.getElementById('ql-zoom-level');
    const content = document.getElementById('ql-content');
    if (!stage) return;

    stage.style.width = (qlZoom * 100) + '%';
    if (readout) readout.textContent = Math.round(qlZoom * 100) + '%';

    // At 1x the document should sit centred; zoomed in it becomes a
    // scrollable canvas anchored top-left, like Preview.app.
    if (content) {
        content.classList.toggle('is-zoomed', qlZoom > 1);
    }
}

function setQuickLookZoom(next) {
    if (!qlZoomable) return;
    qlZoom = Math.min(3, Math.max(1, next));
    applyQuickLookZoom();
}

function stepQuickLookZoom(dir) {
    if (!qlZoomable) return;
    const i = QL_ZOOM_STEPS.findIndex(z => Math.abs(z - qlZoom) < 0.001);
    let idx = i === -1 ? 0 : i;
    idx = Math.min(QL_ZOOM_STEPS.length - 1, Math.max(0, idx + dir));
    setQuickLookZoom(QL_ZOOM_STEPS[idx]);
}

/** Double-click / click-to-toggle between fit and 2x, like Quick Look. */
function toggleQuickLookZoom() {
    if (!qlZoomable) return;
    setQuickLookZoom(qlZoom > 1 ? 1 : 2);
}

/* ── Single entry point for keyed previews ───────────────────────────────
   Delegates to openQuickLookData so the desktop icons and the Finder use
   the exact same renderer. They used to be two separate code paths, which
   is why the resume was zoomable from one place and not the other. */
function openQuickLook(key) {
    // Desktop files describe their own preview. Previously only the résumé had
    // an entry here, so Space / "Quick Look" / "Get Info" on README.txt, the
    // .dmg, the four .app bundles and the Photos folder silently did nothing.
    const file = (window.DESKTOP_FILES || []).find(f => f.id === key);
    if (file && typeof file.preview === 'function') {
        const d = file.preview() || {};
        const label = file.previewOpenLabel || d.openLabel;
        openQuickLookData({
            title: file.name,
            icon: file.kind === 'Folder' ? 'fas fa-folder' : (file.kind === 'Disk Image' ? 'fas fa-hard-drive' : (/Application/.test(file.kind) ? 'fas fa-cube' : 'fas fa-file-lines')),
            meta: `${file.kind} — ${file.size}`,
            html: d.html,
            imageSrc: d.imageSrc,
            openLabel: label || null,
            onOpen: label ? () => { closeQuickLook(); file.open(); } : null
        });
        qlSource = 'desktop';
        return;
    }

    const data = QUICKLOOK_DATA[key];
    if (!data) return;

    const descriptor = {
        title: data.title,
        icon: data.icon,
        meta: data.meta || ''
    };

    if (data.type === 'pdf' || data.type === 'image') {
        descriptor.imageSrc = data.src;
    } else if (data.type === 'video') {
        descriptor.html = `<video controls src="${escapeHtml(data.src)}"></video>`;
    } else {
        descriptor.html = `<div class="ql-text-preview">${data.content}</div>`;
    }

    if (data.openAction && QUICKLOOK_ACTIONS[data.openAction]) {
        descriptor.openLabel = data.openLabel || 'Open';
        descriptor.onOpen = () => {
            closeQuickLook();
            QUICKLOOK_ACTIONS[data.openAction]();
        };
    }

    openQuickLookData(descriptor);
}

function openQuickLookData({ title, icon, meta, html, imageSrc, openLabel, onOpen }) {
    const overlay = document.getElementById('quicklook-overlay');
    if (!overlay) return;

    // Opening a preview while one is already up must REPLACE it, not stack
    // on top of it. Previously the old document's nodes, zoom level and
    // Open-button handler all survived into the new preview.
    if (quickLookOpen) resetQuickLookContent();
    qlSource = null;

    const set = (id, fn) => { const el = document.getElementById(id); if (el) fn(el); };
    set('ql-title', el => el.textContent = title || 'Preview');
    set('ql-meta',  el => el.textContent = meta || '');
    set('ql-icon',  el => el.className = icon || 'fas fa-file');

    set('ql-open-btn', el => {
        if (openLabel && typeof onOpen === 'function') {
            el.style.display = '';
            el.textContent = openLabel;
            // Assign rather than add — this element is reused for every
            // preview, so stacking listeners would fire every previously
            // previewed file's action too.
            el.onclick = onOpen;
        } else {
            el.style.display = 'none';
            el.onclick = null;
        }
    });

    // Images/PDF pages are zoomable; rendered text is not.
    qlZoomable = Boolean(imageSrc);
    qlZoom = 1;
    set('ql-zoom-controls', el => { el.style.display = qlZoomable ? '' : 'none'; });

    set('ql-content', el => {
        el.innerHTML = imageSrc
            ? `<div class="ql-stage" id="ql-stage">
                   <img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(title || '')}" draggable="false">
               </div>`
            : `<div class="ql-stage ql-stage-text" id="ql-stage">${html || ''}</div>`;
        el.scrollTop = 0;
        el.scrollLeft = 0;
    });

    applyQuickLookZoom();

    overlay.classList.add('active');
    quickLookOpen = true;
}

/** Tears down the current preview so the next one starts clean. */
function resetQuickLookContent() {
    const content = document.getElementById('ql-content');
    if (content) {
        // Stop any playing media before discarding it, or its audio keeps
        // running behind the next preview.
        content.querySelectorAll('video, audio').forEach(m => {
            try { m.pause(); m.removeAttribute('src'); m.load(); } catch (e) {}
        });
        content.innerHTML = '';
        content.classList.remove('is-zoomed');
        content.scrollTop = 0;
        content.scrollLeft = 0;
    }
    const openBtn = document.getElementById('ql-open-btn');
    if (openBtn) { openBtn.onclick = null; openBtn.removeAttribute('onclick'); }
    qlZoom = 1;
    qlZoomable = false;
}

function closeQuickLook() {
    const overlay = document.getElementById('quicklook-overlay');
    if (overlay) overlay.classList.remove('active');
    quickLookOpen = false;
    qlSource = null;
    resetQuickLookContent();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initQuickLook, 100);
});
