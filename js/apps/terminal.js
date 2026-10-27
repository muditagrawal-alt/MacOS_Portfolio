/* ==========================================================================
   Terminal.app Controller: CLI Command Parser & System Shortcuts
   --------------------------------------------------------------------------
   Every command's output is written from the info bank (js/data/profile.js):
   the résumé, experience, skills, project listing, timeline and `neofetch`
   all follow whatever the owner put there.
   ========================================================================== */

const TERMINAL_OWNER = window.PROFILE_DATA;
const TERMINAL_USER = TERMINAL_OWNER.handle;
const TERMINAL_HOST = `${TERMINAL_USER}@macbook`;
const TERMINAL_DOMAIN = `${TERMINAL_USER}.dev`;

const TERMINAL_COMMANDS = [
    'help', 'neofetch', 'whoami', 'clear', 'ls', 'ls projects/', 'ls experience/',
    'ls education/', 'ls skills/', 'ls documents/', 'pwd', 'cd', 'date', 'uname',
    'echo', 'history', 'about me', 'experience', 'education', 'projects',
    'skills', 'contact', 'cat resume.txt', 'cat README.txt', 'cat Philosophy.txt',
    'iris', 'open finder', 'open safari', 'open mail', 'open notes', 'open appstore',
    'open settings', 'open trash', 'open resume', 'open iris',
    ...TERMINAL_OWNER.projects.map(x => `open ${x.id}`),
    ...TERMINAL_OWNER.links.map(l => `open ${l.network}`),
    'sudo hire-me', 'brew install talent', 'git status', 'git log', 'matrix', `curl ${TERMINAL_DOMAIN}`, 'exit'
];

/**
 * Appends one line to the terminal output.
 * Uses appendChild rather than `innerHTML +=`, which re-parsed and rebuilt
 * the entire scrollback on every command (O(n^2) and it destroyed any
 * existing node state).
 * Callers are responsible for escaping user input BEFORE it gets here.
 */
function printTerminalLine(html, style) {
    const outputDiv = document.getElementById('terminal-output');
    if (!outputDiv) return;
    const line = document.createElement('div');
    if (style) line.setAttribute('style', style);
    line.innerHTML = html;
    outputDiv.appendChild(line);
}

/* Shell history — every real terminal has it */
const terminalHistory = [];
let terminalHistoryIndex = -1;

/* ── Output, built from the info bank ─────────────────────────────────── */

const termEsc = (v) => escapeHtml(v);
const TERM_RULE = `<span style="color:#555;">${'━'.repeat(80)}</span>`;
const termPre = (body, color = '#f1f1f1') => `<pre style="font-family:inherit;margin:0;line-height:1.45;color:${color};">${body}</pre>`;
const termHeading = (text) => `<strong style="color:#4facfe;">[ ${termEsc(text)} ]</strong>`;
const termItem = (text) => `<span style="color:#ffbd2e;font-weight:700;">${termEsc(text)}</span>`;
const termShortOrg = (org) => String(org).split(' (')[0].replace(/ Pvt\. Ltd\./, '');

/** `open <x>` targets: a project (by id, name or alias) or one of the owner's profiles. */
function findTerminalTarget(key) {
    const norm = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const k = norm(key.replace(/^projects\//, '').replace(/^proj-/, ''));
    if (!k) return null;
    const p = TERMINAL_OWNER.projects.find(x => norm(x.id) === k || norm(x.name) === k || norm(x.name).replace(/ai$/, '') === k || x.aliases.some(a => norm(a) === k));
    if (p && (p.link || p.repo)) return { name: p.name, url: p.link || p.repo };
    const l = TERMINAL_OWNER.links.find(x => x.network === k || norm(x.label) === k);
    if (l) return { name: `${TERMINAL_OWNER.name} on ${l.label}`, url: l.url };
    return null;
}

function terminalResume() {
    const P = TERMINAL_OWNER;
    const e = P.education;
    const width = 80;
    const center = (t) => ' '.repeat(Math.max(0, Math.floor((width - t.length) / 2))) + t;
    const contact = [P.contact.email && `Email: ${P.contact.email}`, P.contact.phone && `Phone: ${P.contact.phone}`].filter(Boolean).join('  |  ');
    const links = P.links.slice(0, 2).map(l => `${l.label}: ${l.url.replace(/^https?:\/\/(www\.)?/, '')}`).join('  |  ');
    const sections = [
        '='.repeat(width),
        center(P.name.toUpperCase()),
        center(P.tagline),
        contact && `  ${contact}`,
        links && `  ${links}`,
        '='.repeat(width),
        '',
        '[ SUMMARY ]',
        P.bio,
        '',
        (e.degree || e.schooling.length) && '[ EDUCATION ]',
        e.degree && `  • ${e.degree}\n    ${[e.university, e.years].filter(Boolean).join(' ')}${e.grade ? ` — ${e.gradeLabel}: ${e.grade}` : ''}`,
        ...e.schooling.map(s => `  • ${s.school} (${[s.title, s.year].filter(Boolean).join(' — ')})${s.score ? ` — ${s.score}` : ''}`),
        (e.degree || e.schooling.length) && '',
        P.experience.length && '[ WORK EXPERIENCE ]',
        P.experience.map(x => `  • ${x.role} — ${x.org}\n    Dates: ${x.dates}${x.bullets.length ? '\n' + x.bullets.map(b => `    - ${b}`).join('\n') : ''}`).join('\n\n'),
        P.experience.length && '',
        P.projects.length && '[ CORE PROJECTS ]',
        ...P.projects.slice(0, 6).map(x => `  • ${x.name.padEnd(17)}- ${x.subtitle}`),
        P.projects.length && '',
        P.skills.length && '[ TECHNICAL SKILLS ]',
        ...P.skills.map(g => `  • ${g.label}: ${g.items.join(', ')}`),
        P.skills.length && '',
        '[ ACTIONS ]',
        P.resume.file && "  • Type 'open resume' or double-click Resume.pdf on the desktop for the PDF.",
        P.projects[0] && `  • Type 'open <project-name>' (e.g. 'open ${P.projects[0].id}') to open it.`,
        '='.repeat(width)
    ].filter(v => v !== false && v !== undefined && v !== null && v !== 0);
    return termPre(termEsc(sections.join('\n')), '#e6edf3');
}

function terminalExperience(title = 'WORK EXPERIENCE') {
    const P = TERMINAL_OWNER;
    if (!P.experience.length) return 'No experience listed yet.';
    return termPre(`${termHeading(title)}\n${TERM_RULE}\n${P.experience.map((x, i) =>
        `${termItem(`${i + 1}. ${x.role} @ ${x.org}`)}\n   <span style="color:#888;">Dates: ${termEsc(x.dates)}</span>${x.bullets.map(b => `\n   – ${termEsc(b)}`).join('')}`
    ).join('\n\n')}\n${TERM_RULE}`);
}

function terminalSkills() {
    const P = TERMINAL_OWNER;
    if (!P.skills.length) return 'No skills listed yet.';
    return termPre(`${termHeading('TECHNICAL SKILLS')}\n${TERM_RULE}\n${P.skills.map(g => `${termItem(`• ${g.label}:`)}\n  ${termEsc(g.items.join(', '))}`).join('\n\n')}\n${TERM_RULE}`);
}

function terminalProjectListing() {
    const P = TERMINAL_OWNER;
    const width = Math.max(10, ...P.projects.map(x => x.name.length + 2));
    const rows = P.projects.map(x => {
        const name = `${x.name.replace(/\s+/g, '-')}/`;
        return `drwxr-xr-x   8 ${termEsc(TERMINAL_USER)}  staff   256B  ${termEsc((x.date || '—').padEnd(9))} <span style="color:#4facfe;font-weight:600;">${termEsc(name)}</span>${' '.repeat(Math.max(1, width - name.length))}<span style="color:${x.live ? '#10b981' : '#888'};"># ${termEsc(x.subtitle)}${x.live ? ' (Live)' : ''}</span>`;
    });
    return `${termPre(`total ${P.projects.length} projects\n${rows.join('\n')}`, '#f1f1f1')}
<div style="color:#888;margin-top:6px;">💡 Tip: Type <em>open &lt;project-name&gt;</em>${P.projects[0] ? ` (e.g. <span style="color:#43e97b">open ${termEsc(P.projects[0].id)}</span>)` : ''} to open its live app or repository.</div>`;
}

function terminalTimeline() {
    const P = TERMINAL_OWNER;
    const e = P.education;
    const steps = [
        ...e.schooling.slice().reverse().map(s => [s.year, s.title.toUpperCase(), `<strong>${termEsc(s.school)}</strong>${s.score ? ` (${termEsc(s.score)})` : ''}`]),
        ...(e.degree ? [[e.years, e.degree.toUpperCase(), `<strong>${termEsc(e.degree)}${e.university ? ` @ ${termEsc(e.university)}` : ''}</strong>${e.grade ? ` (${termEsc(e.gradeLabel)}: ${termEsc(e.grade)})` : ''}`]] : []),
        ...P.experience.slice().reverse().map(x => [x.dates, x.role.toUpperCase(), `<strong>${termEsc(x.role)} @ ${termEsc(x.org)}</strong>${x.bullets[0] ? `\n     ${termEsc(x.bullets[0])}` : ''}`])
    ];
    const built = P.projects.length ? `\n${termItem('• ALONG THE WAY [PROJECTS]')}\n  └─ ${P.projects.map(x => `<strong>${termEsc(x.name)}</strong>`).join(', ')}\n` : '';
    return termPre(`<strong style="color:#4facfe;">[ ${termEsc(P.name.toUpperCase())} — TIMELINE ]</strong>
${TERM_RULE}
${steps.map(([when, what, detail]) => `${termItem(`• ${when ? `${when} ` : ''}[${what}]`)}\n  └─ ${detail}`).join('\n\n')}
${built}
<span style="color:#27c93f;font-weight:700;">• NEXT [YOUR TEAM?]</span>
  └─ <em>Type 'sudo hire-me' or 'brew install talent' 🚀</em>
${TERM_RULE}`);
}

function terminalNeofetch() {
    const P = TERMINAL_OWNER;
    const e = P.education;
    const row = (k, v) => (v ? `<span style="color:#f6d365;font-weight:600;">${k}:</span> ${termEsc(v)}` : null);
    const logo = [
        ['#34c759', "                    'c.          "],
        ['#34c759', "                 ,xNMM.          "],
        ['#34c759', "               .OMMMMo           "],
        ['#34c759', "               OMMM0,            "],
        ['#ffcc00', "     .;loddo:' loolloddol;.      "],
        ['#ffcc00', "   cKMMMMMMMMMMNWMMMMMMMMMM0:    "],
        ['#ff9500', " .KMMMMMMMMMMMMMMMMMMMMMMMWd.    "],
        ['#ff9500', " XMMMMMMMMMMMMMMMMMMMMMMMX.      "],
        ['#ff3b30', ";MMMMMMMMMMMMMMMMMMMMMMMM:       "],
        ['#ff3b30', ":MMMMMMMMMMMMMMMMMMMMMMMM:       "],
        ['#af52de', ".MMMMMMMMMMMMMMMMMMMMMMMMX.      "],
        ['#af52de', " kMMMMMMMMMMMMMMMMMMMMMMMMWd.    "],
        ['#007aff', " .XMMMMMMMMMMMMMMMMMMMMMMMMMMk   "],
        ['#007aff', "  .XMMMMMMMMMMMMMMMMMMMMMMMMK.   "],
        ['#007aff', "    kMMMMMMMMMMMMMMMMMMMMMMd     "],
        ['#007aff', "     ;KMMMMMMMWXXWMMMMMMMk.      "],
        ['#007aff', "       .cooc,.    .,coo:.        "]
    ];
    const info = [
        `<span style="color:#fff;font-weight:700;">${termEsc(TERMINAL_USER)}</span><span style="color:#888;">@</span><span style="color:#4facfe;font-weight:700;">macbook-pro</span>`,
        `<span style="color:#555;">-------------------------</span>`,
        row('OS', 'macOS Portfolio Edition'),
        row('Host', 'Vanilla HTML · CSS · JavaScript'),
        row('Shell', 'zsh 5.9'),
        row('Role', P.tagline),
        row('Education', [e.degree, e.university].filter(Boolean).join(' @ ')),
        row(e.gradeLabel, e.grade),
        row('Experience', P.experience.map(x => termShortOrg(x.org)).join(' · ')),
        row('Focus', P.focus),
        row('Email', P.contact.email),
        row('GitHub', P.github.url.replace(/^https?:\/\//, '')),
        '',
        ['#ff5f56', '#ffbd2e', '#27c93f', '#4facfe', '#00f2fe', '#af52de', '#ff758c', '#ffffff'].map(c => `<span style="color:${c};">███</span>`).join('')
    ].filter(v => v !== null);
    const lines = logo.map(([c, art], i) => `<span style="color:${c};">${termEsc(art)}</span>  ${info[i] || ''}`);
    return `<pre style="font-family:inherit;line-height:1.3;margin:0;">${lines.join('\n')}</pre>`;
}

function terminalHire() {
    const P = TERMINAL_OWNER;
    const e = P.education;
    const core = P.skills.flatMap(g => g.items.slice(0, 2)).slice(0, 5).join(', ');
    const check = (label, value, verdict) => (value ? `  <span style="color:#27c93f;">✔</span> <strong>${label}:</strong> ${termEsc(value)} <span style="color:#27c93f;">[${verdict}]</span><br>` : '');
    return `
<div style="font-family:inherit;line-height:1.45;color:#f1f1f1;">
<span style="color:#888;">[sudo] password for ${termEsc(TERMINAL_USER)}: </span><span style="color:#fff;">••••••••••••</span><br>
<span style="color:#27c93f;font-weight:700;">[AUTH] Authentication successful. Elevated permissions granted!</span><br><br>
<div style="color:#4facfe;font-weight:700;">🚀 INITIATING CANDIDATE ONBOARDING PROTOCOL...</div>
<div style="color:#555;">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
${check('Education', [e.degree, e.university].filter(Boolean).join(' @ '), 'VERIFIED')}${check('Core Competencies', core, 'MATCH')}${check('Track Record', P.experience.map(x => termShortOrg(x.org)).join(', '), 'PROVEN')}${check('Shipped', P.projects.length ? `${P.projects.length} projects, ${P.projects.filter(x => x.live).length} live` : '', 'DEPLOYED')}<div style="color:#555;">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
📦 Packaging candidate payload... <span style="color:#27c93f;">Done!</span><br>
📨 Dispatching offer transmission to <span style="color:#4facfe;font-weight:600;">${termEsc(P.contact.email || P.name)}</span>...<br><br>
<span style="color:#27c93f;font-weight:700;font-size:14px;">🎉 CONGRATULATIONS! You've just made the best hiring decision of the year! 🤝</span><br>
<span style="color:#888;">Tip: Type <em>open mail</em> or <em>cat contact</em> to finalize the details.</span>
</div>`;
}

function terminalBrew(pkg) {
    const P = TERMINAL_OWNER;
    const deps = ['grit (&gt;= 10.0)', 'curiosity (&gt;= 99.9)', ...P.skills.flatMap(g => g.items.slice(0, 1)).slice(0, 3).map(s => `${termEsc(s.toLowerCase().replace(/\s+/g, '-'))} (latest)`)];
    return `
<div style="font-family:inherit;line-height:1.45;color:#f1f1f1;">
<span style="color:#4facfe;font-weight:700;">==&gt; Downloading talent/releases/v${new Date().getFullYear()}.tar.gz</span><br>
<span style="color:#27c93f;">######################################################################## 100.0%</span><br>
<span style="color:#4facfe;font-weight:700;">==&gt; Fetching dependencies for ${termEsc(TERMINAL_USER)}/formulae/${termEsc(pkg || 'talent')}:</span><br>
${deps.map(d => `  <span style="color:#888;">-&gt; ${d}</span> <span style="color:#27c93f;">[installed]</span><br>`).join('')}<span style="color:#4facfe;font-weight:700;">==&gt; Pouring talent.arm64_tahoe.bottle.tar.gz</span><br>
🍺  <span style="color:#f6d365;">/opt/homebrew/Cellar/talent: 1,337 files, 42.0MB, built in 0.42s</span><br>
<span style="color:#ffbd2e;font-weight:700;">==&gt; Caveats</span><br>
${termEsc(P.name)} has been successfully symlinked to your organization!<br>
To initiate collaboration:<br>
  $ <span style="color:#43e97b;">open mail</span><br>
${P.projects[0] ? `  $ <span style="color:#43e97b;">open ${termEsc(P.projects[0].id)}</span><br>` : ''}  $ <span style="color:#43e97b;">cat resume.txt</span>
</div>`;
}

function terminalHelp() {
    const P = TERMINAL_OWNER;
    const cmd = (c, d, color = '#4facfe') => `• <span style="color:${color}">${c}</span> — ${d}<br>`;
    const orgs = P.experience.map(x => termShortOrg(x.org).split(' ')[0]);
    return `
        <strong style="color:#fff;">Available CLI Commands:</strong><br>
        <span style="color:#888;">── Core Information ──</span><br>
        ${cmd('neofetch', 'System card')}
        ${cmd('whoami', 'Display author identity')}
        ${cmd('cat resume.txt', 'Rich text-formatted resume')}
        ${cmd('history', 'Education & career timeline')}
        ${cmd('about me', `${termEsc(P.first)}’s background`)}
        ${cmd('experience', orgs.length ? `Experience at ${termEsc(orgs.join(', '))}` : 'Work experience')}
        ${cmd('projects', 'List projects')}
        ${cmd('skills', 'Technologies & frameworks')}
        ${cmd('contact', 'Email, phone and profiles')}
        <br>
        <span style="color:#888;">── Filesystem & Navigation ──</span><br>
        ${cmd('ls / ls projects/', 'Inspect directories and project repositories')}
        ${cmd('pwd', 'Print current working directory path')}
        ${cmd('cd &lt;dir&gt;', 'Navigate filesystem in Finder')}
        ${cmd('cat &lt;file&gt;', 'Read file contents (e.g. <em>cat README.txt</em>)')}
        ${cmd('open &lt;project-name&gt;', P.projects[0] ? `Open a project (e.g. <em>open ${termEsc(P.projects[0].id)}</em>)` : 'Open a project')}
        ${cmd('open &lt;app&gt;', 'Launch macOS apps (e.g. <em>open safari</em>, <em>open mail</em>)')}
        ${cmd('iris / hey iris', 'Launch Iris AI Assistant ✨', '#af52de')}
        <br>
        <span style="color:#888;">── Builtins & Easter Eggs ──</span><br>
        ${cmd('sudo hire-me', 'Candidate hiring transmission protocol', '#27c93f')}
        ${cmd('brew install talent', 'Homebrew talent package manager', '#27c93f')}
        ${cmd(`curl ${termEsc(TERMINAL_DOMAIN)}`, 'The profile, as JSON')}
        ${cmd('date / uname / echo / clear', 'Standard shell builtins')}
        <span style="color:#666;">↑/↓ recalls history &nbsp;·&nbsp; Tab completes commands &nbsp;·&nbsp; ⌃L clears</span>`;
}

function terminalContact() {
    const P = TERMINAL_OWNER;
    return [
        P.contact.email && `Email: <a href="mailto:${termEsc(P.contact.email)}" style="color:#4facfe;">${termEsc(P.contact.email)}</a>`,
        P.contact.phone && `Phone: ${termEsc(P.contact.phone)}`,
        ...P.links.map(l => `${termEsc(l.label)}: <a href="${termEsc(safeUrl(l.url))}" target="_blank" rel="noopener noreferrer" style="color:#4facfe;">${termEsc(l.url.replace(/^https?:\/\/(www\.)?/, ''))}</a>`)
    ].filter(Boolean).join('<br>') || 'No contact details in the info bank yet.';
}

function terminalLs(args) {
    const P = TERMINAL_OWNER;
    const isAll = args.includes('-a') || args.includes('-la') || args.includes('-al');
    const u = TERMINAL_USER.padEnd(12).slice(0, Math.max(12, TERMINAL_USER.length));
    const hidden = isAll ? [
        ['drwxr-xr-x', '12', u, 'staff', '384B', '.'],
        ['drwxr-xr-x', ' 4', 'root'.padEnd(u.length), 'admin', '128B', '..'],
        ['-rw-r--r--', ' 1', u, 'staff', '6.0K', '.DS_Store'],
        ['drwxr-xr-x', '14', u, 'staff', '448B', '.git'],
        ['-rw-r--r--', ' 1', u, 'staff', '1.2K', '.zshrc']
    ] : [];
    const entries = [
        ...hidden,
        ['drwxr-xr-x', ' 8', u, 'staff', '256B', 'projects/'],
        ['drwxr-xr-x', ' 3', u, 'staff', ' 96B', 'experience/'],
        ['drwxr-xr-x', ' 7', u, 'staff', '224B', 'education/'],
        ['drwxr-xr-x', ' 4', u, 'staff', '128B', 'skills/'],
        ['drwxr-xr-x', ' 4', u, 'staff', '128B', 'documents/'],
        ...(P.resume.file ? [['-rw-r--r--', ' 1', u, 'staff', ' PDF', P.resume.downloadName]] : []),
        ['-rw-r--r--', ' 1', u, 'staff', '2.4K', 'README.txt'],
        ['-rw-r--r--', ' 1', u, 'staff', '1.8K', 'resume.txt'],
        ...(P.values.length ? [['-rw-r--r--', ' 1', u, 'staff', '1.2K', 'Philosophy.txt']] : [])
    ];
    const date = new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', '');
    return '<pre style="font-family:inherit;margin:0;line-height:1.45;">' + entries.map(([perm, links, owner, group, size, name]) =>
        `<span style="color:#666;">${perm}</span> ${links} <span style="color:#888;">${termEsc(owner)} ${group}</span>  <span style="color:#888;">${size.padStart(5)}</span>  <span style="color:#666;">${termEsc(date)}</span>  <span style="color:${name.endsWith('/') ? '#4facfe;font-weight:600' : '#f1f1f1'};">${termEsc(name)}</span>`
    ).join('\n') + '</pre><div style="color:#666;margin-top:6px;">Tip: Run <em>ls projects/</em> to inspect repositories, or <em>open finder</em> to browse visually.</div>';
}

function handleTerminalInput(e) {
    const inputEl = document.getElementById('terminal-input');

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (terminalHistory.length === 0 || !inputEl) return;
        if (e.preventDefault) e.preventDefault();

        if (e.key === 'ArrowUp') {
            terminalHistoryIndex = terminalHistoryIndex < 0
                ? terminalHistory.length - 1
                : Math.max(0, terminalHistoryIndex - 1);
        } else {
            if (terminalHistoryIndex < 0) return;
            terminalHistoryIndex++;
            if (terminalHistoryIndex >= terminalHistory.length) {
                terminalHistoryIndex = -1;
                inputEl.value = '';
                return;
            }
        }
        inputEl.value = terminalHistory[terminalHistoryIndex];
        // Park the caret at the end, like a shell does.
        setTimeout(() => inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length), 0);
        return;
    }

    // Tab completion over the known command set.
    if (e.key === 'Tab') {
        if (e.preventDefault) e.preventDefault();
        if (!inputEl) return;
        const partial = inputEl.value.trim().toLowerCase();
        if (!partial) return;
        const hits = TERMINAL_COMMANDS.filter(c => c.startsWith(partial));
        if (hits.length === 1) {
            inputEl.value = hits[0];
        } else if (hits.length > 1) {
            printTerminalLine(`<span style="color:#888;">${escapeHtml(hits.join('   '))}</span>`, 'margin-bottom:6px;');
        }
        return;
    }

    if (e.key !== 'Enter') return;

    const inputField = document.getElementById('terminal-input');
    if (!inputField) return;
    const rawCmd = inputField.value.trim();
    const cmd = rawCmd.toLowerCase();

    if (rawCmd && terminalHistory[terminalHistory.length - 1] !== rawCmd) {
        terminalHistory.push(rawCmd);
    }
    terminalHistoryIndex = -1;
    const outputDiv = document.getElementById('terminal-output');
    if (!outputDiv) return;

    // Echo the typed line. escapeHtml is mandatory here: this is raw user input.
    printTerminalLine(`<span style="color:#43e97b">${escapeHtml(TERMINAL_HOST)}</span> <span style="color:#4facfe">~ %</span> ${escapeHtml(inputField.value)}`);
    inputField.value = '';

    const P = TERMINAL_OWNER;
    let response = '';

    if (cmd.startsWith('open ')) {
        const rawTarget = rawCmd.slice(5).trim();
        const target = cmd.slice(5).trim();
        const winMap = {
            'finder': 'finder-window',
            'safari': 'safari-window',
            'mail': 'mail-window',
            'notes': 'notes-window',
            'app store': 'appstore-window',
            'appstore': 'appstore-window',
            'settings': 'settings-window',
            'system settings': 'settings-window',
            'trash': 'trash-window',
            'resume': 'resume-window',
            'terminal': 'terminal-window'
        };

        if (target === 'iris' || target === 'siri' || target === 'hey iris' || target === 'hey siri') {
            if (typeof openIris === 'function') openIris();
            response = '<span style="color:#af52de;font-weight:600;">Opening Iris AI Assistant... ✨</span>';
        } else if (winMap[target]) {
            openWindow(winMap[target]);
            response = `Opening ${escapeHtml(rawTarget)}...`;
        } else if (['resume.pdf', 'resume.txt', 'cv', P.resume.downloadName.toLowerCase()].filter(Boolean).includes(target)) {
            if (typeof openResumeWindow === 'function') openResumeWindow();
            else openWindow('resume-window');
            response = `Opening ${escapeHtml(P.resume.downloadName || 'résumé')}... 📄`;
        } else {
            const found = findTerminalTarget(target);
            if (found) {
                window.open(found.url, '_blank', 'noopener,noreferrer');
                const where = typeof linkHostLabel === 'function' ? linkHostLabel(found.url) : 'the web';
                response = `<span style="color:#27c93f;">→ Opened <strong>${escapeHtml(found.name)}</strong> on ${escapeHtml(where)}:</span> <a href="${escapeHtml(safeUrl(found.url))}" target="_blank" rel="noopener noreferrer" style="color:#4facfe;text-decoration:underline;">${escapeHtml(found.url)}</a>`;
            } else if (target.startsWith('http://') || target.startsWith('https://')) {
                window.open(rawTarget, '_blank', 'noopener,noreferrer');
                response = `Opening external URL: ${escapeHtml(rawTarget)}...`;
            } else {
                response = `open: Application or project '${escapeHtml(rawTarget)}' not found.<br><span style="color:#888;">Try apps: <em>finder, safari, mail, notes, appstore, settings, resume, iris</em>${P.projects.length ? `<br>Or projects: <em>${escapeHtml(P.projects.map(x => x.id).join(', '))}</em>` : ''}</span>`;
            }
        }
    } else if (cmd.startsWith('cd ') || cmd === 'cd') {
        const dest = cmd.replace(/^cd\s*/, '').replace(/\/$/, '').trim();
        const folders = {
            'projects': 'projects', 'experience': 'experience', 'education': 'education',
            'skills': 'skills', 'documents': 'documents',
            '~': 'home', '': 'home', '..': 'home', '/': 'home'
        };
        if (folders[dest] !== undefined) {
            if (typeof openFinderPane === 'function') openFinderPane(folders[dest]);
            response = `<span style="color:#888;">→ opened <strong>${escapeHtml(dest || '~')}</strong> in Finder</span>`;
        } else {
            response = `cd: no such file or directory: ${escapeHtml(dest)}`;
        }
    } else if (cmd.startsWith('cat ') || cmd === 'cat') {
        const file = cmd.replace(/^cat\s*/, '').trim();
        if (['resume.txt', 'resume', 'cv', P.resume.downloadName.toLowerCase()].filter(Boolean).includes(file)) {
            response = terminalResume();
        } else if (file === 'readme.txt' || file === 'readme.md' || file === 'readme') {
            response = termPre(escapeHtml(window.TEXT_FILES.readme.body));
        } else if ((file === 'philosophy.txt' || file === 'philosophy' || file === 'values.txt') && P.values.length) {
            response = termPre(`PHILOSOPHY & CORE PRINCIPLES\n----------------------------\n${P.values.map((v, i) => `${i + 1}. ${escapeHtml(v)}`).join('\n')}`);
        } else if (file === 'contact' || file === 'contact.txt') {
            response = terminalContact();
        } else if (file === 'experience' || file === 'experience.txt') {
            response = terminalExperience();
        } else if (file === 'skills' || file === 'skills.txt') {
            response = terminalSkills();
        } else if (file === '' || file === 'cat') {
            response = 'cat: specify a file name. Example: <em>cat resume.txt</em> or <em>cat README.txt</em>';
        } else {
            response = `cat: ${escapeHtml(file)}: No such file or directory. Try: <em>cat resume.txt</em> or <em>cat README.txt</em>`;
        }
    } else if (cmd.startsWith('echo ')) {
        response = escapeHtml(rawCmd.slice(5));
    } else if (cmd === 'iris' || cmd === 'hey iris' || cmd === 'siri' || cmd === 'hey siri') {
        if (typeof openIris === 'function') openIris();
        response = '<span style="color:#af52de;font-weight:600;">Opening Iris AI Assistant... ✨</span>';
    } else if (cmd.startsWith('ls') || cmd.startsWith('dir')) {
        const args = cmd.replace(/^(ls|dir)\s*/, '').trim();
        if (args.includes('projects')) response = terminalProjectListing();
        else if (args.includes('experience')) response = terminalExperience('WORK EXPERIENCE — FROM RESUME');
        else if (args.includes('skills')) response = terminalSkills();
        else response = terminalLs(args);
    } else if (cmd.startsWith('brew install') || cmd === 'brew') {
        response = terminalBrew(cmd.replace(/^brew\s*install\s*/, '').trim());
    } else if (cmd === 'curl') {
        response = `curl: try <em>curl ${escapeHtml(TERMINAL_DOMAIN)}</em>`;
    } else if (cmd.startsWith('curl ') && /\b(me|profile|whoami)\b|\.dev\b/.test(cmd)) {
        const body = {
            name: P.name, role: P.tagline,
            now: P.experience[0] ? `${P.experience[0].role} @ ${P.experience[0].org}` : undefined,
            education: P.education.degree ? [P.education.degree, P.education.university].filter(Boolean).join(', ') : undefined,
            contact: { email: P.contact.email || undefined, phone: P.contact.phone || undefined },
            links: Object.fromEntries(P.links.map(l => [l.network, l.url])),
            hiring: 'open — try `sudo hire-me`'
        };
        response = `<pre style="font-family:inherit;margin:0;line-height:1.45;"><span style="color:#888;">HTTP/2 200
content-type: application/json; charset=utf-8
x-powered-by: curiosity</span>

${escapeHtml(JSON.stringify(body, null, 2))}</pre>`;
    } else {
        switch (cmd) {
            case 'help':
            case 'man':
                response = terminalHelp();
                break;
            case 'neofetch':
                response = terminalNeofetch();
                break;
            case 'whoami':
                response = escapeHtml(P.name);
                break;
            case 'pwd':
                response = `/Users/${escapeHtml(TERMINAL_USER)}/portfolio`;
                break;
            case 'date':
                response = new Date().toString();
                break;
            case 'uname':
            case 'uname -a':
                response = `Darwin macbook-pro 25.0.0 macOS ${escapeHtml(P.first)} 1.0 (Portfolio Edition) arm64`;
                break;
            case 'history':
                response = terminalTimeline();
                break;
            case 'sudo hire-me':
            case 'sudo hire':
            case 'hire-me':
            case 'hire':
                response = terminalHire();
                break;
            case 'about me':
            case 'about':
                response = `${escapeHtml(P.name)}. ${escapeHtml(P.bio)}`;
                break;
            case 'experience':
                response = P.experience.map(x => `<div style="margin-bottom:8px;">• <strong style="color:#4facfe;">${escapeHtml(x.role)}</strong> @ ${escapeHtml(x.org)} <span style="color:#888;">(${escapeHtml(x.dates)})</span>${x.bullets.length ? `<div style="padding-left:14px;color:#ccc;margin-top:2px;">${x.bullets.map(b => `– ${escapeHtml(b)}`).join('<br>')}</div>` : ''}</div>`).join('') || 'No experience listed yet.';
                break;
            case 'education': {
                const ed = P.education;
                response = [
                    ed.degree && `- <strong>${escapeHtml(ed.degree)}</strong>${ed.university ? `, ${escapeHtml(ed.university)}` : ''}${ed.years ? ` (${escapeHtml(ed.years)})` : ''}${ed.grade ? ` — ${escapeHtml(ed.gradeLabel)} ${escapeHtml(ed.grade)}` : ''}`,
                    ...ed.schooling.map(s => `- ${escapeHtml(s.title)}, ${escapeHtml(s.school)}${s.year ? ` (${escapeHtml(s.year)})` : ''}${s.score ? ` — ${escapeHtml(s.score)}` : ''}`)
                ].filter(Boolean).join('<br>') || 'No education listed yet.';
                break;
            }
            case 'projects':
                response = P.projects.map(x => `• <strong style="color:${x.live ? '#10b981' : '#4facfe'};">${escapeHtml(x.name)}${x.live ? ' (Live)' : ''}</strong> — ${escapeHtml(x.subtitle)}`).join('<br>') || 'No projects listed yet.';
                break;
            case 'skills':
                response = terminalSkills();
                break;
            case 'contact':
                response = terminalContact();
                break;
            case 'git status':
                response = termPre(`On branch main\nYour branch is up to date with 'origin/main'.\n\nChanges not staged for commit:\n  (use "git add &lt;file&gt;..." to update what will be committed)\n\t<span style="color:#27c93f;">modified:   portfolio (macOS Tahoe Edition)</span>\n\nno changes added to commit (use "git commit -a")`);
                break;
            case 'git log': {
                const author = `${escapeHtml(P.name)}${P.contact.email ? ` &lt;${escapeHtml(P.contact.email)}&gt;` : ''}`;
                const latest = P.projects[0];
                response = termPre(`<span style="color:#f6d365;">commit 8f2d91a</span> (HEAD -> main, origin/main)\nAuthor: ${author}\nDate:   ${new Date().toDateString()}\n\n    feat: macOS terminal with easter eggs${latest ? `\n\n<span style="color:#f6d365;">commit 3c7e14b</span>\nAuthor: ${author}\nDate:   ${escapeHtml(latest.date || 'Earlier')}\n\n    feat: release ${escapeHtml(latest.name)} — ${escapeHtml(latest.subtitle)}` : ''}`);
                break;
            }
            case 'matrix':
                response = `<div style="color:#27c93f;font-family:monospace;line-height:1.2;font-size:11px;">${escapeHtml(P.first.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' '))}<br>W A K E   U P ,   N E O . . .<br>T H E   M A T R I X   H A S   Y O U . . .<br>F O L L O W   T H E   W H I T E   R A B B I T 🐇</div>`;
                break;
            case 'clear':
                outputDiv.innerHTML = '';
                return;
            case 'exit':
            case 'quit':
                if (typeof closeWindow === 'function') closeWindow('terminal-window');
                response = 'Session closed.';
                break;
            case '':
                break;
            default:
                response = `zsh: command not found: ${escapeHtml(rawCmd)}. Type 'help' for available commands.`;
        }
    }

    if (response) {
        printTerminalLine(response, 'margin-bottom: 10px;');
    }

    const contentDiv = document.getElementById('terminal-content');
    if (contentDiv) contentDiv.scrollTop = contentDiv.scrollHeight;
}

/** Runs a command as if typed (used by the Terminal ▸ Shell menu). */
function runTerminalCommand(cmd) {
    if (typeof openWindow === 'function') openWindow('terminal-window');
    const input = document.getElementById('terminal-input');
    if (!input) return;
    input.value = cmd;
    handleTerminalInput({ key: 'Enter', preventDefault() {} });
    input.focus();
}

document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('terminal-last-login');
    if (el) {
        const d = new Date();
        const fmt = d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        el.textContent = `Last login: ${fmt.replace(/,/g, '')} on ttys000`;
    }
});
