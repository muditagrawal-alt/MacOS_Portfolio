const TERMINAL_COMMANDS = [
    'help', 'neofetch', 'whoami', 'clear', 'ls', 'ls projects/', 'pwd', 'cd', 'date', 'uname',
    'echo', 'about me', 'experience', 'education', 'projects', 'skills',
    'contact', 'cat resume.txt', 'cat README.txt', 'iris', 'open finder',
    'open safari', 'open mail', 'open notes', 'open appstore', 'open settings',
    'open trash', 'open resume', 'open iris', 'open omnidoc', 'open sliver',
    'open sword', 'open deepfake', 'open helix', 'open multiva', 'open inflx', 'open artifex'
];

/* ==========================================================================
   Terminal.app Controller: CLI Command Parser & Core Builtins
   ========================================================================== */

function printTerminalLine(html, style) {
    const outputDiv = document.getElementById('terminal-output');
    if (!outputDiv) return;
    const line = document.createElement('div');
    if (style) line.setAttribute('style', style);
    line.innerHTML = html;
    outputDiv.appendChild(line);
}

const terminalHistory = [];
let terminalHistoryIndex = -1;

/* Project repository lookup registry */
const PROJECT_REPOS = {
    'omnidoc': { name: 'OmniDoc', url: 'https://github.com/muditagrawal-alt/OmniDoc', desc: 'Multimodal RAG Document Intelligence System' },
    'sliver': { name: 'Sliver.Ai', url: 'https://github.com/muditagrawal-alt/Sliver-Smart-Video-Clipping-Tool', desc: 'Smart Video Clipping & Highlight Tool' },
    'sliver.ai': { name: 'Sliver.Ai', url: 'https://github.com/muditagrawal-alt/Sliver-Smart-Video-Clipping-Tool', desc: 'Smart Video Clipping & Highlight Tool' },
    'sliver-ai': { name: 'Sliver.Ai', url: 'https://github.com/muditagrawal-alt/Sliver-Smart-Video-Clipping-Tool', desc: 'Smart Video Clipping & Highlight Tool' },
    'sword': { name: 'Project S.W.O.R.D', url: 'https://github.com/muditagrawal-alt/Project-S.W.O.R.D', desc: 'Real-Time Weapon Surveillance System' },
    'project-sword': { name: 'Project S.W.O.R.D', url: 'https://github.com/muditagrawal-alt/Project-S.W.O.R.D', desc: 'Real-Time Weapon Surveillance System' },
    'project sword': { name: 'Project S.W.O.R.D', url: 'https://github.com/muditagrawal-alt/Project-S.W.O.R.D', desc: 'Real-Time Weapon Surveillance System' },
    'project-s.w.o.r.d': { name: 'Project S.W.O.R.D', url: 'https://github.com/muditagrawal-alt/Project-S.W.O.R.D', desc: 'Real-Time Weapon Surveillance System' },
    's.w.o.r.d': { name: 'Project S.W.O.R.D', url: 'https://github.com/muditagrawal-alt/Project-S.W.O.R.D', desc: 'Real-Time Weapon Surveillance System' },
    'deepfake': { name: 'Deepfake Detector', url: 'https://github.com/muditagrawal-alt/Deepfake-and-Fake-News-Detector', desc: 'Media Forensics & Fake News Detector' },
    'deepfake-detector': { name: 'Deepfake Detector', url: 'https://github.com/muditagrawal-alt/Deepfake-and-Fake-News-Detector', desc: 'Media Forensics & Fake News Detector' },
    'deepfake detector': { name: 'Deepfake Detector', url: 'https://github.com/muditagrawal-alt/Deepfake-and-Fake-News-Detector', desc: 'Media Forensics & Fake News Detector' },
    'helix': { name: 'Helix-Compiler', url: 'https://github.com/muditagrawal-alt/Helix-Compiler', desc: 'C-Based Language Compiler' },
    'helix-compiler': { name: 'Helix-Compiler', url: 'https://github.com/muditagrawal-alt/Helix-Compiler', desc: 'C-Based Language Compiler' },
    'multiva': { name: 'Multiva.Ai', url: 'https://github.com/muditagrawal-alt/Multiva.Ai', desc: 'Multilingual AI Voice Cloning Platform' },
    'multiva.ai': { name: 'Multiva.Ai', url: 'https://github.com/muditagrawal-alt/Multiva.Ai', desc: 'Multilingual AI Voice Cloning Platform' },
    'multiva-ai': { name: 'Multiva.Ai', url: 'https://github.com/muditagrawal-alt/Multiva.Ai', desc: 'Multilingual AI Voice Cloning Platform' },
    'inflx': { name: 'Inflx AutoStream', url: 'https://github.com/muditagrawal-alt/iNFLX-AutoStream-Agent-ServiceHive-', desc: 'Workflow & Streaming Automation Agent' },
    'inflx-autostream': { name: 'Inflx AutoStream', url: 'https://github.com/muditagrawal-alt/iNFLX-AutoStream-Agent-ServiceHive-', desc: 'Workflow & Streaming Automation Agent' },
    'inflx autostream': { name: 'Inflx AutoStream', url: 'https://github.com/muditagrawal-alt/iNFLX-AutoStream-Agent-ServiceHive-', desc: 'Workflow & Streaming Automation Agent' },
    'artifex': { name: 'Artifex', url: 'https://github.com/muditagrawal-alt/Artifex.ai', desc: 'Creative Generative AI Design Experiments' },
    'artifex.ai': { name: 'Artifex', url: 'https://github.com/muditagrawal-alt/Artifex.ai', desc: 'Creative Generative AI Design Experiments' },
    'artifex-ai': { name: 'Artifex', url: 'https://github.com/muditagrawal-alt/Artifex.ai', desc: 'Creative Generative AI Design Experiments' },
    'github': { name: 'Mudit Agrawal GitHub', url: 'https://github.com/muditagrawal-alt', desc: 'GitHub Profile' },
    'linkedin': { name: 'Mudit Agrawal LinkedIn', url: 'https://www.linkedin.com/in/mudit-agrawal-167610318', desc: 'LinkedIn Profile' }
};

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
        setTimeout(() => inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length), 0);
        return;
    }

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

    if (e.key === 'Enter') {
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
        
        printTerminalLine(`<span style="color:#43e97b">muditagrawal@macbook</span> <span style="color:#4facfe">~ %</span> ${escapeHtml(inputField.value)}`);
        inputField.value = '';
        
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
            } else if (target === 'resume.pdf' || target === 'resume.txt' || target === 'muditagrawalresume.pdf' || target === 'cv') {
                if (typeof openResumeWindow === 'function') openResumeWindow();
                else openWindow('resume-window');
                response = 'Opening MuditAgrawalResume.pdf... 📄';
            } else {
                const cleanKey = target.replace(/^projects\//, '').replace(/^proj-/, '').replace(/\/$/, '').trim();
                const proj = PROJECT_REPOS[cleanKey];
                if (proj) {
                    window.open(proj.url, '_blank', 'noopener,noreferrer');
                    response = `<span style="color:#27c93f;">→ Opened <strong>${escapeHtml(proj.name)}</strong> on GitHub:</span> <a href="${escapeHtml(proj.url)}" target="_blank" rel="noopener noreferrer" style="color:#4facfe;text-decoration:underline;">${escapeHtml(proj.url)}</a> 🚀`;
                } else if (target.startsWith('http://') || target.startsWith('https://')) {
                    window.open(rawTarget, '_blank', 'noopener,noreferrer');
                    response = `Opening external URL: ${escapeHtml(rawTarget)}...`;
                } else {
                    response = `open: Application or project '${escapeHtml(rawTarget)}' not found.<br><span style="color:#888;">Try apps: <em>finder, safari, mail, notes, appstore, settings, resume, iris</em><br>Or projects: <em>omnidoc, sliver, sword, deepfake, helix, multiva, inflx, artifex</em></span>`;
                }
            }
        } else if (cmd.startsWith('cd ') || cmd === 'cd') {
            const dest = cmd.replace(/^cd\s*/, '').replace(/\/$/, '').trim();
            const folders = {
                'projects': 'projects', 'projects/': 'projects',
                'experience': 'experience', 'experience/': 'experience',
                'education': 'education', 'education/': 'education',
                'skills': 'skills', 'skills/': 'skills',
                'documents': 'documents', 'documents/': 'documents',
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
            const p = window.PROFILE_DATA || {};
            const e = p.education || {};
            const exp = p.experience || [];
            
            if (file === 'resume.txt' || file === 'resume' || file === 'cv' || file === 'muditagrawalresume.pdf') {
                const expText = exp.map(x => `  • ${x.role} — ${x.org}\n    Dates: ${x.dates}`).join('\n\n');
                response = `
<pre style="font-family:inherit;margin:0;line-height:1.45;color:#e6edf3;">
================================================================================
                                MUDIT AGRAWAL
                 AI/ML Engineer & Computer Science Undergraduate
  Email: ${p.contact?.email || 'muditagrawal03@gmail.com'}  |  Phone: ${p.contact?.phone || '+91-7289887349'}
  GitHub: github.com/muditagrawal-alt  |  LinkedIn: linkedin.com/in/mudit-agrawal-167610318
================================================================================

[ SUMMARY ]
${p.bio || 'Computer Science Undergraduate (AI/ML) at IILM University, building applied AI systems that work reliably outside sandboxes — agentic pipelines, RAG systems, and computer vision.'}

[ EDUCATION ]
  • ${e.degree || 'B.Tech in Computer Science (AI/ML)'}
    ${e.university || 'IILM University'} (${e.years || '2023 – 2027'}) — CGPA: ${e.cgpa || '7.68'}
  • Navy Children School, New Delhi (Class XII, CBSE — 2023) — 74%
  • Navy Children School, Mumbai (Class X, CBSE — 2021) — 89%

[ WORK EXPERIENCE ]
${expText}

[ CORE PROJECTS ]
  • OmniDoc          - Multimodal RAG Document Intelligence System (Mistral-7B, Nomic, BLIP)
  • Sliver.Ai        - Automated Smart Video Clipping & Facial Emotion Highlights (YOLOv8/11)
  • Project S.W.O.R.D- Real-time Weapon Surveillance System (90.1% mAP@0.5 on 7,500 images)
  • Deepfake Detector- Machine Learning Media Forensics & Manipulation Detection
  • Helix-Compiler   - C-based Lexical/AST Parser, Intermediate Representation & Machine Code
  • Multiva.Ai       - Multilingual AI Voice Cloning & Speech Synthesis (Whisper, XTTS)

[ TECHNICAL SKILLS ]
  • Languages: Python, C, Java, JavaScript, HTML5, CSS3, SQL, Bash
  • Frameworks: PyTorch, TensorFlow, OpenCV, Hugging Face, Scikit-Learn, FastAPI, Flask
  • AI Domains: Multimodal RAG, Computer Vision (YOLOv8/11), LLM Agents, Media Forensics

[ ACTIONS ]
  • Type 'open resume' or double-click Resume.pdf on desktop to view/download full PDF!
  • Type 'open <project-name>' (e.g. 'open omnidoc') to view its GitHub repository.
================================================================================
</pre>`;
            } else if (file === 'readme.txt' || file === 'readme.md' || file === 'readme') {
                if (window.TEXT_FILES && window.TEXT_FILES.readme) {
                    response = `<pre style="font-family:inherit;margin:0;line-height:1.45;color:#f1f1f1;">${escapeHtml(window.TEXT_FILES.readme.body)}</pre>`;
                } else {
                    response = `<pre style="font-family:inherit;margin:0;line-height:1.45;color:#f1f1f1;">README.txt: Welcome to Mudit's Portfolio Desktop. Built with pure HTML, CSS, and JS.</pre>`;
                }
            } else {
                response = `cat: ${escapeHtml(file)}: No such file or directory. Try: <em>cat resume.txt</em> or <em>cat README.txt</em>`;
            }
        } else if (cmd.startsWith('echo ')) {
            response = escapeHtml(rawCmd.slice(5));
        } else if (cmd.startsWith('ls') || cmd.startsWith('dir')) {
            const args = cmd.replace(/^(ls|dir)\s*/, '').trim();
            if (args === 'projects' || args === 'projects/' || args === './projects' || args === './projects/' || args.includes('projects')) {
                response = `
<pre style="font-family:inherit;margin:0;line-height:1.45;">
total 8 projects
drwxr-xr-x   9 muditagrawal  staff   288B  Jan 15 14:20  <span style="color:#4facfe;font-weight:600;">OmniDoc</span>/            <span style="color:#888;"># Multimodal RAG Document Intelligence System</span>
drwxr-xr-x   8 muditagrawal  staff   256B  Jan 10 11:05  <span style="color:#4facfe;font-weight:600;">Sliver.Ai</span>/          <span style="color:#888;"># Smart Video Clipping & Facial Highlights</span>
drwxr-xr-x  11 muditagrawal  staff   352B  Dec 28 18:40  <span style="color:#4facfe;font-weight:600;">Project-S.W.O.R.D</span>/  <span style="color:#888;"># Real-Time Weapon Surveillance System</span>
drwxr-xr-x   7 muditagrawal  staff   224B  Nov 20 09:15  <span style="color:#4facfe;font-weight:600;">Deepfake-Detector</span>/  <span style="color:#888;"># Media Forensics & Fake News Detection</span>
drwxr-xr-x  14 muditagrawal  staff   448B  Oct 30 16:50  <span style="color:#4facfe;font-weight:600;">Helix-Compiler</span>/     <span style="color:#888;"># C-Based Language Compiler</span>
drwxr-xr-x   6 muditagrawal  staff   192B  Oct 12 13:30  <span style="color:#4facfe;font-weight:600;">Multiva.Ai</span>/         <span style="color:#888;"># Multilingual AI Voice Cloning (Whisper/XTTS)</span>
drwxr-xr-x   8 muditagrawal  staff   256B  Sep 25 10:10  <span style="color:#4facfe;font-weight:600;">Inflx-AutoStream</span>/   <span style="color:#888;"># Autonomous AI Workflow & Streaming Agent</span>
drwxr-xr-x   5 muditagrawal  staff   160B  Sep 05 12:00  <span style="color:#4facfe;font-weight:600;">Artifex</span>/            <span style="color:#888;"># Generative AI Creative Design Platform</span>
</pre>
<div style="color:#888;margin-top:6px;">💡 Tip: Type <em>open &lt;project-name&gt;</em> (e.g. <span style="color:#43e97b">open omnidoc</span>) to navigate to its GitHub repo!</div>
`;
            } else {
                const entries = [
                    ['drwxr-xr-x', ' 8', 'muditagrawal', 'staff', '256B', 'Aug 23 01:15', 'projects/'],
                    ['drwxr-xr-x', ' 3', 'muditagrawal', 'staff', ' 96B', 'Aug 23 01:15', 'experience/'],
                    ['drwxr-xr-x', ' 7', 'muditagrawal', 'staff', '224B', 'Aug 23 01:15', 'education/'],
                    ['drwxr-xr-x', ' 4', 'muditagrawal', 'staff', '128B', 'Aug 23 01:15', 'skills/'],
                    ['drwxr-xr-x', ' 4', 'muditagrawal', 'staff', '128B', 'Aug 23 01:15', 'documents/'],
                    ['-rw-r--r--', ' 1', 'muditagrawal', 'staff', ' 58K', 'Aug 23 01:15', 'MuditAgrawalResume.pdf'],
                    ['-rw-r--r--', ' 1', 'muditagrawal', 'staff', '2.4K', 'Aug 23 01:15', 'README.txt'],
                    ['-rw-r--r--', ' 1', 'muditagrawal', 'staff', '1.8K', 'Aug 23 01:15', 'resume.txt']
                ];
                
                response = '<pre style="font-family:inherit;margin:0;line-height:1.45;">' + entries.map(([perm, links, owner, group, size, date, name]) =>
                    `<span style="color:#666;">${perm}</span> ${links} <span style="color:#888;">${owner} ${group}</span>  <span style="color:#888;">${size.padStart(5)}</span>  <span style="color:#666;">${date}</span>  <span style="color:${name.endsWith('/') ? '#4facfe;font-weight:600' : '#f1f1f1'};">${name}</span>`
                ).join('\n') + '</pre><div style="color:#666;margin-top:6px;">Tip: Run <em>ls projects/</em> to inspect repositories.</div>';
            }
        } else {
            switch(cmd) {
                case 'neofetch': {
                    const p = window.PROFILE_DATA || {};
                    const eduStr = p.education ? `${p.education.degree} @ ${p.education.university}` : 'B.Tech CSE (AI/ML) @ IILM University';
                    const expStr = (p.experience || []).map(e => e.org.split(' (')[0]).join(' • ');
                    response = `
<pre style="font-family:inherit;line-height:1.35;margin:0;">
                    <span style="color:#27c93f;">'c.</span>          <span style="color:#ffffff;font-weight:700;">muditagrawal</span><span style="color:#888;">@</span><span style="color:#4facfe;font-weight:700;">macbook-pro</span>
                 <span style="color:#27c93f;">,xNMM.</span>          <span style="color:#555;">------------------------</span>
               <span style="color:#27c93f;">.OMMMMo</span>           <span style="color:#f6d365;font-weight:600;">OS:</span> macOS Tahoe 26.0 (Finder Portfolio Edition)
               <span style="color:#27c93f;">OMMM0,</span>            <span style="color:#f6d365;font-weight:600;">Host:</span> MacBook Pro 16" (Apple Silicon)
     <span style="color:#ffbd2e;">.;loddo:.</span>  <span style="color:#27c93f;">.oaMMMMso:</span>       <span style="color:#f6d365;font-weight:600;">Kernel:</span> Darwin 25.0.0 (arm64)
   <span style="color:#ffbd2e;">:0KMMMMMMMWk.</span>  <span style="color:#27c93f;">.dNMMMMK,</span>      <span style="color:#f6d365;font-weight:600;">Uptime:</span> 3+ years in AI/ML & Systems Engineering
  <span style="color:#ffbd2e;">:Nk.       .kM:</span>   <span style="color:#27c93f;">.dMMMMc</span>      <span style="color:#f6d365;font-weight:600;">Shell:</span> zsh 5.9 (arm64-apple-darwin25.0)
 <span style="color:#ff5f56;">.MN</span>           <span style="color:#ffbd2e;">OM:</span>    <span style="color:#27c93f;">.MMo</span>       <span style="color:#f6d365;font-weight:600;">Terminal:</span> Apple_Terminal (Finder Portfolio CLI)
 <span style="color:#ff5f56;">.MM.  .</span>       <span style="color:#ffbd2e;">.XM</span>    <span style="color:#27c93f;">xMM,</span>       <span style="color:#f6d365;font-weight:600;">Degree:</span> ${eduStr}
  <span style="color:#ff5f56;">kM;  :x</span>        <span style="color:#ffbd2e;">.</span>    <span style="color:#27c93f;">XM,</span>        <span style="color:#f6d365;font-weight:600;">Focus:</span> Multimodal RAG, CV (YOLO), LLM Agentic Pipelines
  <span style="color:#ff5f56;">;MM.  .o.</span>     <span style="color:#af52de;">.</span>    <span style="color:#4facfe;">oW"</span>         <span style="color:#f6d365;font-weight:600;">Internships:</span> ${expStr}
   <span style="color:#ff5f56;">*W0.</span>          <span style="color:#af52de;">.</span>  <span style="color:#4facfe;">.dK</span>          <span style="color:#f6d365;font-weight:600;">Memory:</span> 100% Passion & Grit
    <span style="color:#ff5f56;">.kMD.</span>       <span style="color:#af52de;">.oc.oWd</span>          <span style="color:#f6d365;font-weight:600;">GitHub:</span> https://github.com/muditagrawal-alt
      <span style="color:#ff5f56;">'kWMMMMMMMMMMk'</span>            
        <span style="color:#af52de;">.,looodl;.</span>               <span style="color:#ff5f56;">███</span> <span style="color:#ffbd2e;">███</span> <span style="color:#27c93f;">███</span> <span style="color:#4facfe;">███</span> <span style="color:#00f2fe;">███</span> <span style="color:#af52de;">███</span> <span style="color:#ff758c;">███</span> <span style="color:#ffffff;">███</span>
</pre>
                    `;
                    break;
                }
                case 'whoami':
                    response = 'Mudit Agrawal';
                    break;
                case 'pwd':
                    response = '/Users/muditagrawal/portfolio';
                    break;
                case 'date':
                    response = new Date().toString();
                    break;
                case 'clear':
                    outputDiv.innerHTML = '';
                    return;
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
}
