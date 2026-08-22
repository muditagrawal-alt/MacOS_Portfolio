const TERMINAL_COMMANDS = [
    'help', 'whoami', 'clear', 'ls', 'ls projects/', 'pwd', 'date', 'uname',
    'echo', 'about me', 'experience', 'education', 'projects', 'skills',
    'contact', 'cat resume.txt', 'cat README.txt'
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
        
        if (cmd.startsWith('cat ') || cmd === 'cat') {
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
