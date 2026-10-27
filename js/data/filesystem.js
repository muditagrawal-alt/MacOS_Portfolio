/* ==========================================================================
   Portfolio Filesystem — generated from the info bank
   --------------------------------------------------------------------------
   The folders and files behind Finder on the Mac and the Projects / About /
   Notes apps on iPhone. Nothing here is written by hand: every project,
   role, course, skill and link comes from js/data/profile.js, so editing the
   info bank (or rerunning `npm run setup`) updates every app at once.
   ========================================================================== */

const pData = window.PROFILE_DATA;
const expKeys = pData.experience.map((_, i) => `exp-${i}`);
const eduKeys = [
    ...(pData.education.degree ? ['edu-degree'] : []),
    ...pData.education.schooling.map((_, i) => `edu-school-${i}`),
    ...pData.courses.map((_, i) => `course-${i}`)
];
const skillKeys = pData.skills.map((_, i) => `skill-${i}`);
const netKeys = pData.links.map(l => `net-${l.network}`);
const projectKeys = pData.projects.map(p => p.fsId);
const hasResume = Boolean(pData.resume.file);
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const AAKASH_STYLE_FS = {
    // ── Favorites Root Categories ──
    'home': {
        id: 'home',
        name: pData.first,
        kind: 'folder',
        icon: 'assets/icons/folder-home-macos.svg',
        items: ['desktop', 'documents', 'downloads', 'pictures', 'projects-folder', 'experience-folder', 'education-folder', 'skills-folder']
    },
    // Mirrors window.DESKTOP_FILES.
    'desktop': {
        id: 'desktop',
        name: 'Desktop',
        kind: 'folder',
        icon: 'assets/icons/folder-desktop-macos.svg',
        items: (window.DESKTOP_FILES || []).map(f => `desk-${f.id}`)
    },
    'applications': {
        id: 'applications',
        name: 'Applications',
        kind: 'folder',
        icon: 'assets/icons/sf-icons/applications.svg',
        items: []   // filled from LAUNCHPAD_APPS once every script has loaded
    },
    'airdrop': {
        id: 'airdrop',
        name: 'AirDrop',
        kind: 'folder',
        view: 'airdrop',
        icon: 'assets/icons/sf-icons/airdrop.svg',
        items: []
    },
    'documents': {
        id: 'documents',
        name: 'Documents',
        kind: 'folder',
        icon: 'assets/icons/folder-documents-macos.svg',
        items: [...(hasResume ? ['resume-pdf'] : []), 'readme', 'contact-card', 'projects-folder']
    },
    'downloads': {
        id: 'downloads',
        name: 'Downloads',
        kind: 'folder',
        icon: 'assets/icons/folder-downloads-macos.svg',
        items: [...(hasResume ? ['resume-pdf'] : []), 'wallpaper-tahoe', 'source-zip']
    },
    'pictures': {
        id: 'pictures',
        name: 'Pictures',
        kind: 'folder',
        icon: 'assets/icons/folder-pictures-macos.svg',
        items: ['profile-pic', 'wallpaper-tahoe']
    },
    'music': {
        id: 'music',
        name: 'Music',
        kind: 'folder',
        icon: 'assets/icons/folder-macos.svg',
        items: ['ambient-tune']
    },
    'projects-folder': {
        id: 'projects-folder',
        name: 'Projects',
        kind: 'folder',
        icon: 'assets/icons/folder-projects-macos.svg',
        items: projectKeys
    },
    'experience-folder': {
        id: 'experience-folder',
        name: 'Experience',
        kind: 'folder',
        icon: 'assets/icons/folder-experience-macos.svg',
        items: expKeys
    },
    'education-folder': {
        id: 'education-folder',
        name: 'Education',
        kind: 'folder',
        icon: 'assets/icons/folder-education-macos.svg',
        items: eduKeys
    },
    'skills-folder': {
        id: 'skills-folder',
        name: 'Skills',
        kind: 'folder',
        icon: 'assets/icons/folder-skills-macos.svg',
        items: skillKeys
    },
    'network': {
        id: 'network',
        name: 'Network',
        kind: 'folder',
        icon: 'assets/icons/sf-icons/network.svg',
        items: netKeys
    },
    'recents': {
        id: 'recents',
        name: 'Recents',
        kind: 'folder',
        icon: 'assets/icons/folder-macos.svg',
        items: [projectKeys[0], hasResume && 'resume-pdf', expKeys[0], projectKeys[1], 'readme'].filter(Boolean)
    },
    // One Trash, shared with Trash.app: window.TRASH_ITEMS.
    'trash': {
        id: 'trash',
        name: 'Trash',
        kind: 'folder',
        icon: 'assets/icons/trash.png',
        items: (window.TRASH_ITEMS || []).map((_, i) => `trash-${i}`)
    }
};

const folderItem = (id, name, icon, size, date = 'Today') => ({ id, name, kind: 'folder', icon, date, size, targetFolder: id });

// ── File & Folder Items Definition ──
const FS_ITEMS = {
    'desktop': folderItem('desktop', 'Desktop', 'assets/icons/folder-desktop-macos.svg', plural((window.DESKTOP_FILES || []).length, 'item')),
    'documents': folderItem('documents', 'Documents', 'assets/icons/folder-documents-macos.svg', plural(AAKASH_STYLE_FS.documents.items.length, 'item')),
    'downloads': folderItem('downloads', 'Downloads', 'assets/icons/folder-downloads-macos.svg', plural(AAKASH_STYLE_FS.downloads.items.length, 'item'), 'Yesterday'),
    'pictures': folderItem('pictures', 'Pictures', 'assets/icons/folder-pictures-macos.svg', '2 items'),
    'projects-folder': folderItem('projects-folder', 'Projects', 'assets/icons/folder-projects-macos.svg', plural(projectKeys.length, 'item')),
    'experience-folder': folderItem('experience-folder', 'Experience', 'assets/icons/folder-experience-macos.svg', plural(expKeys.length, 'item')),
    'education-folder': folderItem('education-folder', 'Education', 'assets/icons/folder-education-macos.svg', plural(eduKeys.length, 'item')),
    'skills-folder': folderItem('skills-folder', 'Skills', 'assets/icons/folder-skills-macos.svg', plural(skillKeys.length, 'item')),

    // ── Files ──
    'readme': {
        id: 'readme', name: 'README.md', kind: 'Markdown Document', ext: 'md',
        icon: 'assets/icons/filetype-md.svg', date: 'Today', size: '2.4 KB',
        preview: { title: 'README.md', subtitle: `${pData.name} — Portfolio Overview`, desc: pData.bio }
    },
    ...(hasResume ? {
        'resume-pdf': {
            id: 'resume-pdf', name: pData.resume.downloadName, kind: 'PDF Document', ext: 'pdf',
            icon: 'assets/icons/filetype-pdf.svg', date: pData.resume.updated || 'Recent', size: 'PDF',
            action: 'openResumeWindow()',
            preview: {
                title: pData.resume.downloadName, subtitle: `Résumé${pData.resume.updated ? ` · ${pData.resume.updated}` : ''}`,
                desc: [
                    pData.education.degree && `${pData.education.degree}${pData.education.grade ? ` (${pData.education.gradeLabel} ${pData.education.grade})` : ''}`,
                    pData.experience.length && `Experience at ${pData.experience.map(e => e.org.split(' (')[0]).join(' & ')}`,
                    pData.projects.length && `${plural(pData.projects.length, 'project')}`
                ].filter(Boolean).join(' · ')
            }
        }
    } : {}),
    'wallpaper-tahoe': {
        id: 'wallpaper-tahoe', name: '26-Tahoe-Beach-Day.jpg', kind: 'JPEG Image', ext: 'jpg',
        icon: 'assets/icons/photos.png', date: 'Today', size: '607 KB',
        src: 'assets/Wallpapers/26-Tahoe-Beach-Day.jpg',
        preview: { title: 'Tahoe Beach Day', subtitle: 'macOS Wallpaper • 6016 × 3384', desc: 'Original Apple 6K dynamic wallpaper asset for macOS.' }
    },
    'source-zip': {
        id: 'source-zip', name: 'portfolio-source.zip', kind: 'ZIP Archive', ext: 'zip',
        icon: 'assets/icons/filetype-zip.svg', date: 'Today', size: '3.2 MB',
        preview: { title: 'portfolio-source.zip', subtitle: 'macOS Portfolio Bundle', desc: 'Pure HTML, CSS, and Vanilla JavaScript implementation with zero external framework dependencies.' }
    },
    'profile-pic': {
        id: 'profile-pic', name: pData.photo.split('/').pop(), kind: 'Image', ext: pData.photo.split('.').pop(),
        icon: 'assets/icons/photos.png', date: 'Recent', size: '—',
        src: pData.photo,
        preview: { title: pData.photo.split('/').pop(), subtitle: `${pData.name} — Portrait`, desc: 'Profile photograph.' }
    },
    'contact-card': {
        id: 'contact-card', name: 'Contact Info.vcf', kind: 'Contact Card', ext: 'vcf',
        icon: 'assets/icons/mail.png', date: 'Today', size: '512 B',
        action: "openWindow('mail-window')",
        preview: {
            title: pData.name, subtitle: 'Contact Information',
            desc: [
                pData.contact.email && `Email: ${pData.contact.email}`,
                pData.contact.phone && `Phone: ${pData.contact.phone}`,
                ...pData.links.slice(0, 3).map(l => `${l.label}: ${l.handle || l.url.replace(/^https?:\/\/(www\.)?/, '')}`)
            ].filter(Boolean).join('\n')
        }
    },
    'ambient-tune': {
        id: 'ambient-tune', name: 'ChillBeats.mp3', kind: 'MP3 Audio', ext: 'mp3',
        icon: 'assets/icons/audio_Tahoe.png', date: 'May 20', size: '3.5 MB',
        preview: { title: 'ChillBeats.mp3', subtitle: 'Coding Background Audio', desc: 'Lo-fi ambient background music track.' }
    },

    // ── Projects ──
    ...Object.fromEntries(pData.projects.map(p => [p.fsId, {
        id: p.fsId, name: p.name, kind: p.kind, ext: p.live ? 'app' : 'repo',
        icon: p.icon, date: p.date || '—', size: p.live ? 'Live' : 'Source',
        link: p.link,
        preview: { title: p.title, subtitle: p.subtitle, desc: [p.description, ...p.highlights.map(h => `• ${h}`)].filter(Boolean).join('\n\n') }
    }])),

    // ── Experience ──
    ...Object.fromEntries(pData.experience.map((exp, idx) => [`exp-${idx}`, {
        id: `exp-${idx}`,
        name: `${exp.role} @ ${exp.org.split(' (')[0]}`,
        kind: 'Experience Record', ext: 'md', icon: 'assets/icons/filetype-md.svg',
        date: exp.dates, size: '—',
        preview: {
            title: exp.role,
            subtitle: exp.org,
            desc: `• Role: ${exp.role}\n• Organization: ${exp.org}\n• Duration: ${exp.dates}` + (exp.bullets.length ? '\n\nHighlights:\n' + exp.bullets.map(b => `– ${b}`).join('\n') : '')
        }
    }])),

    // ── Education ──
    ...(pData.education.degree ? {
        'edu-degree': {
            id: 'edu-degree',
            name: `${pData.education.degree}${pData.education.university ? ` @ ${pData.education.university.split(' ')[0]}` : ''}`,
            kind: 'Degree', ext: 'pdf', icon: 'assets/icons/filetype-pdf.svg',
            date: pData.education.years, size: pData.education.grade ? `${pData.education.gradeLabel} ${pData.education.grade}` : '—',
            preview: {
                title: pData.education.degree,
                subtitle: pData.education.university,
                desc: [pData.education.grade && `${pData.education.gradeLabel}: ${pData.education.grade}`, pData.education.university && `University: ${pData.education.university}`, pData.education.years && `Duration: ${pData.education.years}`].filter(Boolean).join('\n')
            }
        }
    } : {}),
    ...Object.fromEntries(pData.education.schooling.map((s, i) => [`edu-school-${i}`, {
        id: `edu-school-${i}`, name: `${s.title}${s.school ? ` @ ${s.school.split(',')[0]}` : ''}`,
        kind: 'Schooling', ext: 'pdf', icon: 'assets/icons/filetype-pdf.svg', date: s.year, size: s.score || '—',
        preview: { title: s.title, subtitle: s.school, desc: [s.detail, s.score].filter(Boolean).join(' — ') }
    }])),
    ...Object.fromEntries(pData.courses.map((c, i) => [`course-${i}`, {
        id: `course-${i}`, name: `${c.title}${c.issuer ? ` (${c.issuer.split(/[&·,]/)[0].trim()})` : ''}`,
        kind: 'Certificate', ext: 'cert', icon: 'assets/icons/filetype-cert.svg', date: c.year || '—', size: '—',
        preview: { title: c.title, subtitle: c.issuer, desc: c.detail }
    }])),

    // ── Skills ──
    ...Object.fromEntries(pData.skills.map((g, i) => [`skill-${i}`, {
        id: `skill-${i}`, name: g.label, kind: 'Skills Document', ext: 'txt', icon: 'assets/icons/filetype-txt.svg',
        date: 'Recent', size: plural(g.items.length, 'item'),
        preview: { title: g.label, subtitle: plural(g.items.length, 'skill'), desc: g.items.join(', ') }
    }])),

    // ── Network: social profiles. Rendered as app tiles; opening one goes
    //    straight to that profile. ──
    ...Object.fromEntries(pData.links.map(l => [`net-${l.network}`, {
        id: `net-${l.network}`, name: l.label, kind: 'Social Profile', ext: 'app',
        icon: l.icon, date: '—', size: l.handle || '—', link: l.url,
        preview: { title: l.label, subtitle: l.handle || l.url.replace(/^https?:\/\/(www\.)?/, ''), desc: l.blurb }
    }])),

    // ── Desktop (generated from window.DESKTOP_FILES) ──
    ...Object.fromEntries((window.DESKTOP_FILES || []).map(f => [`desk-${f.id}`, {
        id: `desk-${f.id}`, name: f.name, kind: f.kind, icon: f.icon,
        date: 'Today', size: f.size, open: f.open, deskId: f.id
    }])),

    // ── Trash (generated from window.TRASH_ITEMS, shared with Trash.app) ──
    ...Object.fromEntries((window.TRASH_ITEMS || []).map((t, i) => [`trash-${i}`, {
        id: `trash-${i}`, name: t.name, kind: t.kind, ext: t.name.split('.').pop(),
        icon: trashIconFor(t.name), date: 'In Trash', size: '—',
        preview: { title: t.name, subtitle: t.kind, desc: t.reason }
    }]))
};

function trashIconFor(name) {
    const ext = String(name).split('.').pop().toLowerCase();
    const map = { py: 'filetype-py', js: 'filetype-html', txt: 'filetype-txt', ipynb: 'filetype-py', idea: 'filetype-project' };
    return `assets/icons/${map[ext] || 'filetype-txt'}.svg`;
}

/* ── Project shaping (Mac App Store, iPhone Projects) ─────────────────── */

// Categories a project is filed under when it doesn't name its own: matched
// against its title, description and tags. Only categories that at least one
// project falls into appear as filters.
const APPSTORE_CATEGORIES = {
    ai: /\b(rag|llm|agent|language|nlp|generative|diffusion|chatbot|voice|speech|whisper|mistral|vlm|ai|machine learning|ml)\b/i,
    vision: /\b(vision|video|yolo|slam|image|camera|detection|deepfake|clipping|point cloud|cv)\b/i,
    web: /\b(web app|website|frontend|front-end|react|vue|next\.?js|full[- ]stack|saas)\b/i,
    mobile: /\b(ios|android|mobile|swift|kotlin|flutter|react native)\b/i,
    data: /\b(data|analytics|dashboard|etl|sql|visuali[sz]ation)\b/i,
    systems: /\b(compiler|parser|ast|systems|c-based|lexical|kernel|embedded|distributed)\b/i,
    design: /\b(design|ui|ux|figma|branding|illustration)\b/i,
    defense: /\b(defen[cs]e|weapon|surveillance|drone|airspace|navy|threat|security)\b/i,
    games: /\b(game|unity|unreal|godot)\b/i
};
const CATEGORY_LABELS = { ai: 'AI & Language', vision: 'Vision & Video', web: 'Web', mobile: 'Mobile', data: 'Data', systems: 'Systems', design: 'Design', defense: 'Defense & Security', games: 'Games' };
const CATEGORY_ICONS = { ai: 'fas fa-brain', vision: 'fas fa-eye', web: 'fas fa-globe', mobile: 'fas fa-mobile-screen', data: 'fas fa-chart-line', systems: 'fas fa-microchip', design: 'fas fa-pen-nib', defense: 'fas fa-shield-halved', games: 'fas fa-gamepad' };

// Display names for tags ("fastapi" → "FastAPI"); anything else is title-cased.
const TAG_LABELS = { rag: 'RAG', llm: 'LLM', vlm: 'VLM', blip: 'BLIP', slam: 'SLAM', yolo: 'YOLO', cpu: 'CPU', gpu: 'GPU', '3d': '3D', ffmpeg: 'FFmpeg', fastapi: 'FastAPI', sih: 'SIH', wav2lip: 'Wav2Lip', 'generative ai': 'Generative AI', api: 'API', ui: 'UI', ux: 'UX', aws: 'AWS', sql: 'SQL', nlp: 'NLP', ios: 'iOS', javascript: 'JavaScript', typescript: 'TypeScript', nodejs: 'Node.js', 'node.js': 'Node.js', postgresql: 'PostgreSQL', mongodb: 'MongoDB', opencv: 'OpenCV', pytorch: 'PyTorch', tensorflow: 'TensorFlow' };
const prettyTag = t => TAG_LABELS[t] || t.replace(/\b[a-z]/g, c => c.toUpperCase());

/** Every project, shaped for display (App Store on Mac, Projects on iPhone). */
function getPortfolioProjects() {
    const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return pData.projects.map(p => {
        const text = `${p.title} ${p.subtitle} ${p.kind} ${p.summary} ${p.description} ${p.tags.join(' ')}`;
        // Tags that just repeat the project's own name aren't a stack.
        const ownName = norm(`${p.name} ${p.title}`);
        const stack = p.tags.filter(t => norm(t).length < 4 || !ownName.includes(norm(t))).slice(0, 8).map(prettyTag);
        const own = [].concat(p.category || []).map(c => String(c).toLowerCase());
        return {
            id: p.fsId, name: p.name, icon: p.icon, link: p.link, repo: p.repo, live: p.live,
            subtitle: p.subtitle, title: p.title,
            desc: [p.description, ...p.highlights.map(h => `• ${h}`)].filter(Boolean).join('\n'),
            blurb: p.summary, stack, date: p.date, featured: p.featured,
            cats: own.length ? own : Object.entries(APPSTORE_CATEGORIES).filter(([, re]) => re.test(text)).map(([k]) => k),
            search: text.toLowerCase()
        };
    });
}

/** The categories that at least one project falls into: [{ id, label, icon }]. */
function getProjectCategories() {
    const used = new Set(getPortfolioProjects().flatMap(p => p.cats));
    return [...used].map(id => ({ id, label: CATEGORY_LABELS[id] || id.replace(/^./, c => c.toUpperCase()), icon: CATEGORY_ICONS[id] || 'fas fa-folder' }))
        .sort((a, b) => Object.keys(CATEGORY_LABELS).indexOf(a.id) - Object.keys(CATEGORY_LABELS).indexOf(b.id));
}
