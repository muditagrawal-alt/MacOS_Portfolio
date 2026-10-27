/* ==========================================================================
   Desktop Files — Single Source of Truth
   --------------------------------------------------------------------------
   The desktop used to mirror the Finder sidebar (About / Experience /
   Education / Projects / Skills), which meant five icons that did the same
   thing as five sidebar rows. A real Mac desktop holds FILES.

   Everything here is a distinct document type with its own opener. The
   portfolio sections still live in Finder, the Dock, Spotlight and the menu
   bar — they just don't get a redundant second home on the desktop.

   Generated from the info bank (js/data/profile.js): the résumé, a demo disk
   image for a project with a `demo`, the projects as apps, and Photos.
   ========================================================================== */

window.DESKTOP_FILES = (() => {
    const P = window.PROFILE_DATA;
    const open = (url) => () => window.open(url, '_blank', 'noopener,noreferrer');
    const demo = P.projects.find(x => x.demo);
    // Up to four project "apps": deployed ones first, then the rest.
    const apps = [...P.projects.filter(x => x.live), ...P.projects.filter(x => !x.live)]
        .filter(x => x !== demo && x.link).slice(0, 4);
    return [
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
        ...(P.resume.file ? [{
            id: 'resume',
            name: 'Resume.pdf',
            kind: 'PDF Document',
            icon: 'assets/icons/filetype-pdf.svg',
            size: 'PDF',
            open: () => openResumeWindow(),
            preview: () => (P.resume.preview ? { imageSrc: P.resume.preview, openLabel: 'Open with Preview' } : appPreviewCard('resume-pdf', 'assets/icons/filetype-pdf.svg'))
        }] : []),
        ...(demo ? [{
            id: `${demo.id}-dmg`,
            name: `${demo.name}.dmg`,
            kind: 'Disk Image',
            icon: 'assets/icons/filetype-dmg.svg',
            size: '—',
            open: () => mountDiskImage(demo.id),
            preview: () => appPreviewCard(demo.fsId, 'assets/icons/filetype-dmg.svg', `Disk Image · ${demo.name} 1.0`),
            previewOpenLabel: 'Mount'
        }] : []),
        ...apps.map(x => ({
            id: `${x.id}-app`,
            name: `${x.name}.app`,
            kind: x.live ? 'Application (Live)' : 'Application',
            icon: x.icon,
            size: '—',
            open: open(x.link),
            preview: () => appPreviewCard(x.fsId)
        })),
        ...(P.certificates.length ? [{
            id: 'photos',
            name: 'Photos',
            kind: 'Folder',
            icon: 'assets/icons/folder-photos.svg',
            size: `${P.certificates.length} items`,
            open: () => openWindow('photos-window'),
            preview: () => ({
                html: `<div class="ql-folder-grid">${(window.PHOTO_LIBRARY.certificates.items || []).map(c => `
                    <figure><img src="${escapeHtml(c.thumb)}" alt="" loading="lazy"><figcaption>${escapeHtml(c.title)}</figcaption></figure>`).join('')}</div>`,
                openLabel: 'Open in Photos'
            })
        }] : [])
    ];
})();

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
            const p = window.PROFILE_DATA;
            const e = p.education;
            const exp = p.experience
                .map(x => `  - ${x.role}\n    ${x.org}\n    ${x.dates}`)
                .join('\n\n');

            const demo = p.projects.find(x => x.demo);
            return `${p.name.toUpperCase()}
${'='.repeat(p.name.length)}

${p.tagline}


ABOUT
-----
${wrapText(p.bio, 68)}


EDUCATION
---------
  ${e.degree}
  ${e.university}${e.years ? `  (${e.years})` : ''}${e.grade ? `\n  ${e.gradeLabel}: ${e.grade}` : ''}


EXPERIENCE
----------
${exp}


${p.values.length ? `WHAT I CARE ABOUT
-----------------
${p.values.map((v, i) => wrapText(`${i + 1}. ${v}`, 64)).join('\n\n')}


` : ''}GETTING AROUND THIS DESKTOP
---------------------------
  Cmd + K        Spotlight - search everything here
  Option + Tab   Switch between open apps
  Option + L     Launchpad - every app in one place
  F3             Mission Control
  Space          Quick Look the selected file
  Right click    Context menus, same as the real thing

  Double-click Resume.pdf     to read the CV${demo ? `
  Double-click ${(demo.name + '.dmg').padEnd(15)} to mount the project demo` : ''}
  Open the Photos folder      for certificates and screenshots
  Terminal in the Dock        type 'help' to get started


CONTACT
-------
${[p.contact.email && `  Email     ${p.contact.email}`, p.contact.phone && `  Phone     ${p.contact.phone}`, ...p.links.map(l => `  ${l.label.padEnd(9)} ${l.url}`)].filter(Boolean).join('\n')}


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
        items: window.PROFILE_DATA.certificates.map((c, i) => ({
            file: `cert-${i + 1}`,
            title: c.title,
            issuer: c.issuer,
            thumb: c.image,
            full: c.file
        }))
    }
};

/* ── Disk images: one per project with a `demo` in the info bank ─────────── */

window.DISK_IMAGES = Object.fromEntries(window.PROFILE_DATA.projects.filter(x => x.demo).map(x => [x.id, {
    volumeName: `${x.name} 1.0`,
    appName: x.name,
    tagline: x.subtitle,
    icon: x.icon,
    description: x.demo.description || x.description,
    requirements: x.demo.requirements || '',
    repo: x.repo || x.link,
    download: x.demo.download || (x.repo && /github\.com/.test(x.repo) ? `${x.repo.replace(/\/$/, '')}/archive/refs/heads/main.zip` : x.link),
    stack: x.demo.stack || x.tags.slice(0, 6).map(t => t.replace(/\b[a-z]/g, c => c.toUpperCase()))
}]));

/* ── Trash: ideas that didn't make it (cutIdeas in the info bank) ───────── */

window.TRASH_ITEMS = window.PROFILE_DATA.cutIdeas;
