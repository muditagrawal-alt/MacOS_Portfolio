/* ==========================================================================
   Desktop Files — Single Source of Truth
   --------------------------------------------------------------------------
   The desktop used to mirror the Finder sidebar (About / Experience /
   Education / Projects / Skills), which meant five icons that did the same
   thing as five sidebar rows. A real Mac desktop holds FILES.

   Everything here is a distinct document type with its own opener. The
   portfolio sections still live in Finder, the Dock, Spotlight and the menu
   bar — they just don't get a redundant second home on the desktop.
   ========================================================================== */

window.DESKTOP_FILES = [
    {
        id: 'readme',
        name: 'README.txt',
        kind: 'Plain Text Document',
        icon: 'assets/icons/filetype-txt.svg',
        size: '2 KB',
        open: () => openTextFile('readme'),
        preview: () => ({
            html: `<pre class="ql-plain-text">${escapeHtml(window.TEXT_FILES.readme.body)}</pre>`,
            openLabel: 'Open with TextEdit'
        })
    },
    {
        id: 'resume',
        name: 'Resume.pdf',
        kind: 'PDF Document',
        icon: 'assets/icons/filetype-pdf.svg',
        size: '58 KB',
        open: () => openResumeWindow(),
        preview: () => ({
            imageSrc: 'assets/MuditAgrawalResumePreview.png',
            openLabel: 'Open with Preview'
        })
    },
    {
        id: 'omnidoc-dmg',
        name: 'OmniDoc.dmg',
        kind: 'Disk Image',
        icon: 'assets/icons/filetype-dmg.svg',
        size: '1.4 GB',
        open: () => mountDiskImage('omnidoc'),
        preview: () => appPreviewCard('proj-omnidoc', 'assets/icons/filetype-dmg.svg', 'Disk Image · OmniDoc 1.0'),
        previewOpenLabel: 'Mount'
    },
    {
        id: 'vlm-app',
        name: 'VLM Leads.app',
        kind: 'Application (Live)',
        icon: 'assets/icons/app-vlm.svg',
        size: '28 MB',
        open: () => window.open('https://muditagrawal-lead-extraction.vercel.app', '_blank', 'noopener,noreferrer'),
        preview: () => appPreviewCard('proj-vlm')
    },
    {
        id: 'veritas-app',
        name: 'Veritas Check.app',
        kind: 'Application (Live)',
        icon: 'assets/icons/app-veritas.svg',
        size: '18 MB',
        open: () => window.open('https://veritas-check.vercel.app', '_blank', 'noopener,noreferrer'),
        preview: () => appPreviewCard('proj-deepfake')
    },
    {
        id: 'helix-app',
        name: 'Helix.app',
        kind: 'Application (Live)',
        icon: 'assets/icons/app-helix.svg',
        size: '1.2 MB',
        open: () => window.open('https://huggingface.co/spaces/muditagrawal03/Helix-Compiler', '_blank', 'noopener,noreferrer'),
        preview: () => appPreviewCard('proj-helix')
    },
    {
        id: 'slam-app',
        name: 'SLAM 3D.app',
        kind: 'Application',
        icon: 'assets/icons/app-slam.svg',
        size: '34 MB',
        open: () => window.open('https://github.com/muditagrawal-alt/Monocular_RGB_Sparse_Point_Cloud_SLAM', '_blank', 'noopener,noreferrer'),
        preview: () => appPreviewCard('proj-slam')
    },
    {
        id: 'photos',
        name: 'Photos',
        kind: 'Folder',
        icon: 'assets/icons/folder-photos.svg',
        size: '7 items',
        open: () => openWindow('photos-window'),
        preview: () => ({
            html: `<div class="ql-folder-grid">${(window.PHOTO_LIBRARY.certificates.items || []).map(c => `
                <figure><img src="${escapeHtml(c.thumb)}" alt="" loading="lazy"><figcaption>${escapeHtml(c.title)}</figcaption></figure>`).join('')}</div>`,
            openLabel: 'Open in Photos'
        })
    }
];

/**
 * Quick Look card for an app/project: big icon, name, kind and the project's
 * own description (single source: the Finder filesystem's preview text).
 */
function appPreviewCard(fsId, iconOverride, kindOverride) {
    const item = (typeof FS_ITEMS === 'object' && FS_ITEMS[fsId]) || {};
    const p = item.preview || {};
    let host = '';
    try { host = item.link ? new URL(item.link).host.replace(/^www\./, '') : ''; } catch (e) { host = ''; }
    return {
        html: `<div class="ql-app-card">
                 <img class="ql-app-icon" src="${escapeHtml(iconOverride || item.icon || '')}" alt="">
                 <h2>${escapeHtml(p.title || item.name || '')}</h2>
                 <div class="ql-app-kind">${escapeHtml(kindOverride || p.subtitle || item.kind || '')}</div>
                 <p>${escapeHtml(p.desc || '')}</p>
                 ${host ? `<div class="ql-app-host"><i class="fas fa-link"></i> ${escapeHtml(host)}</div>` : ''}
               </div>`,
        openLabel: item.link ? 'Open' : null
    };
}

/* ── README.txt contents ─────────────────────────────────────────────────
   Rendered in a TextEdit-style window. Kept as plain text on purpose — it is
   a .txt file, so it should look like one. */
window.TEXT_FILES = {
    readme: {
        name: 'README.txt',
        get body() {
            const p = window.PROFILE_DATA || {};
            const e = p.education || {};
            const exp = (p.experience || [])
                .map(x => `  - ${x.role}\n    ${x.org}\n    ${x.dates}`)
                .join('\n\n');

            return `${(p.name || 'Mudit Agrawal').toUpperCase()}
${'='.repeat((p.name || 'Mudit Agrawal').length)}

${p.tagline || ''}


ABOUT
-----
${wrapText(p.bio || '', 68)}


EDUCATION
---------
  ${e.degree || ''}
  ${e.university || ''}  (${e.years || ''})
  CGPA: ${e.cgpa || ''}


EXPERIENCE
----------
${exp}


WHAT I CARE ABOUT
-----------------
  1. Context awareness  - technology is only as good as the
     problem it solves.

  2. Robustness         - systems should hold up outside clean
     sandbox environments.

  3. Speed of iteration - prototype quickly, evaluate rigorously,
     refactor thoughtfully.


GETTING AROUND THIS DESKTOP
---------------------------
  Cmd + K        Spotlight - search everything here
  Option + Tab   Switch between open apps
  Option + L     Launchpad - every app in one place
  F3             Mission Control
  Space          Quick Look the selected file
  Right click    Context menus, same as the real thing

  Double-click Resume.pdf     to read the CV
  Double-click OmniDoc.dmg    to mount the project demo
  Open the Photos folder      for certificates and screenshots
  Terminal in the Dock        type 'help' to get started


CONTACT
-------
  Email     ${p.contact?.email || ''}
  Phone     ${p.contact?.phone || ''}
  GitHub    ${p.contact?.github || ''}
  LinkedIn  ${p.contact?.linkedin || ''}


-- 
Built with vanilla HTML, CSS and JavaScript. No frameworks.
`;
        }
    }
};

/** Naive greedy word wrap, used to keep README.txt looking like a text file. */
function wrapText(text, width) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = '';
    words.forEach(w => {
        if ((line + ' ' + w).trim().length > width) {
            lines.push(line.trim());
            line = w;
        } else {
            line += ' ' + w;
        }
    });
    if (line.trim()) lines.push(line.trim());
    return lines.map(l => '  ' + l).join('\n');
}

/* ── Photos library ───────────────────────────────────────────────────── */

window.PHOTO_LIBRARY = {
    certificates: {
        title: 'Certificates',
        items: [
            { file: 'aws-academy-machine-learning',       title: 'Machine Learning Foundations', issuer: 'AWS Academy' },
            { file: 'ibm-introduction-to-ai',             title: 'Introduction to Artificial Intelligence', issuer: 'IBM · Coursera' },
            { file: 'google-foundations-of-cybersecurity',title: 'Foundations of Cybersecurity', issuer: 'Google · Coursera' },
            { file: 'michigan-python-for-everybody',      title: 'Python for Everybody', issuer: 'University of Michigan' },
            { file: 'michigan-python-data-structures',    title: 'Python Data Structures', issuer: 'University of Michigan' },
            { file: 'deloitte-technology-job-simulation', title: 'Technology Job Simulation', issuer: 'Deloitte' },
            { file: 'hp-life-data-science-analytics',     title: 'Data Science & Analytics', issuer: 'HP LIFE' }
        ].map(c => ({
            ...c,
            thumb: `assets/photos/thumbs/${c.file}.jpg`,
            full:  `assets/photos/certificates/${c.file}.pdf`
        }))
    }
};

/* ── Disk images ──────────────────────────────────────────────────────── */

window.DISK_IMAGES = {
    omnidoc: {
        volumeName: 'OmniDoc 1.0',
        appName: 'OmniDoc',
        tagline: 'Multimodal RAG Document Intelligence',
        icon: 'assets/icons/codefile.png',
        description: 'Ask questions about any PDF — text, tables and figures. '
                   + 'Mistral-7B for synthesis, Nomic quantised embeddings for retrieval, '
                   + 'and BLIP for visual question answering over document images.',
        requirements: 'Python 3.10+ · CUDA optional · 8 GB RAM minimum',
        repo: 'https://github.com/muditagrawal-alt/OmniDoc',
        download: 'https://github.com/muditagrawal-alt/OmniDoc/archive/refs/heads/main.zip',
        stack: ['Python', 'PyTorch', 'Mistral-7B', 'Nomic', 'BLIP', 'Gradio']
    }
};

/* ── Trash: ideas that didn't make it ─────────────────────────────────── */

window.TRASH_ITEMS = [
    {
        name: 'blockchain-portfolio.idea',
        kind: 'Abandoned Concept',
        reason: 'Wanted to mint each project as an NFT. Realised I could not '
              + 'explain why that was better than a hyperlink, so it went in here.'
    },
    {
        name: 'realtime-face-login.py',
        kind: 'Abandoned Prototype',
        reason: 'Face-recognition login for this site. Worked in good lighting, '
              + 'failed on 3 of 5 testers, and asked visitors for camera access '
              + 'before showing them anything. Wrong trade.'
    },
    {
        name: 'gpt-writes-my-bio.txt',
        kind: 'Rejected Draft',
        reason: 'Fully model-written "About Me". Technically fluent, said nothing '
              + 'a hundred other portfolios did not. Rewrote it by hand.'
    },
    {
        name: 'infinite-scroll-timeline.js',
        kind: 'Abandoned Feature',
        reason: 'A scrolling career timeline with parallax. Beautiful at 60fps on '
              + 'my machine, 12fps on a mid-range phone. Cut it.'
    },
    {
        name: 'voice-controlled-desktop.js',
        kind: 'Shelved',
        reason: 'Talk to the portfolio to open windows. Great demo, uncomfortable '
              + 'in an open-plan office where most people would open this. Shelved, '
              + 'not deleted — Iris got the useful half.'
    },
    {
        name: 'yolov26-benchmark-v1.ipynb',
        kind: 'Superseded',
        reason: 'First S.W.O.R.D benchmark run. Leaked test images into the '
              + 'training split, so 97% mAP was a lie. Rebuilt the split; the '
              + 'honest number is 90.1%.'
    }
];
