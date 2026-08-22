const TERMINAL_COMMANDS = [
    'help', 'neofetch', 'whoami', 'clear', 'ls', 'ls projects/', 'ls experience/',
    'ls education/', 'ls skills/', 'ls documents/', 'pwd', 'cd', 'date', 'uname',
    'echo', 'history', 'about me', 'experience', 'education', 'projects',
    'skills', 'contact', 'cat resume.txt', 'cat README.txt', 'cat Philosophy.txt',
    'iris', 'open finder', 'open safari', 'open mail', 'open notes', 'open appstore',
    'open settings', 'open trash', 'open resume', 'open iris', 'open omnidoc',
    'open sliver', 'open sword', 'open deepfake', 'open helix', 'open multiva',
    'open inflx', 'open artifex', 'sudo hire-me', 'brew install talent',
    'git status', 'git log', 'matrix', 'curl'
];

/* ==========================================================================
   Terminal.app Controller: CLI Command Parser, Neofetch & System Shortcuts
   ========================================================================== */

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
        
        // Echo the typed line. escapeHtml is mandatory here: this is raw user input.
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
            
            // Check if opening an app
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
                // Check if opening a project repo
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
  • Programming: Python, Java, C, SQL
  • Frameworks: LangChain, PyTorch, TensorFlow, Keras, Scikit-Learn, OpenCV, NumPy, Pandas, Matplotlib, Docling, PySpark, FAISS, Flask, FastAPI, SQLAlchemy
  • Models: YOLOv8/11/26, Whisper (CTranslate2), Coqui XTTS, OpenVoice, BLIP, Mistral-7B, Gemma4, Qwen 2.5, Wav2Lip, FB-NLLB, BGE-M3 Embeddings, BGE-M3 ReRanker, SentenceTransformers
  • Databases: PostgreSQL, ChromaDB, SQLite, Elasticsearch, Qdrant, MongoDB
  • Evaluation: RAGAS, TruLens, BIER, PyTest, CI/CD, InfoVQA
  • Tools: Git, Docker, OAuth2.0, Cloudflare R2, Ollama, Groq, Google Calendar API, Gradio, Streamlit, Firebase, Supabase, Apache Airflow, Apache Spark, MistralOCR, FFmpeg, Claude

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
            } else if (file === 'philosophy.txt' || file === 'philosophy') {
                response = `
<pre style="font-family:inherit;margin:0;line-height:1.45;color:#f1f1f1;">
PHILOSOPHY & CORE PRINCIPLES
----------------------------
1. Context Awareness  — Technology is only as good as the practical problem it solves.
2. Robustness         — AI systems must hold up outside clean sandbox environments.
3. Speed of Iteration — Prototype quickly, evaluate rigorously, refactor thoughtfully.
4. Craftsmanship      — Every detail matters, from inference latency to micro-interactions.
</pre>`;
            } else if (file === 'contact' || file === 'contact.txt') {
                response = `Email: ${p.contact?.email || 'muditagrawal03@gmail.com'}<br>Phone: ${p.contact?.phone || '+91-7289887349'}<br>LinkedIn: ${p.contact?.linkedin || ''}<br>GitHub: ${p.contact?.github || ''}`;
            } else if (file === 'skills' || file === 'skills.txt') {
                response = `
<pre style="font-family:inherit;margin:0;line-height:1.45;color:#f1f1f1;">
TECHNICAL SKILLS (From Resume)
--------------------------------------------------------------------------------
• Programming : Python, Java, C, SQL
• Frameworks  : LangChain, PyTorch, TensorFlow, Keras, Scikit-Learn, OpenCV, NumPy, Pandas, Matplotlib, Docling, PySpark, FAISS, Flask, FastAPI, SQLAlchemy
• Models      : YOLOv8/11/26, Whisper (CTranslate2), Coqui XTTS, OpenVoice, BLIP, Mistral-7B, Gemma4, Qwen 2.5, Wav2Lip, FB-NLLB, BGE-M3, SentenceTransformers
• Databases   : PostgreSQL, ChromaDB, SQLite, Elasticsearch, Qdrant, MongoDB
• Evaluation  : RAGAS, TruLens, BIER, PyTest, CI/CD, InfoVQA
• Tools       : Git, Docker, OAuth2.0, Cloudflare R2, Ollama, Groq, Google Calendar API, Gradio, Streamlit, Firebase, Supabase, Apache Airflow, Apache Spark, MistralOCR, FFmpeg, Claude
</pre>`;
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
            } else if (args === 'experience' || args === 'experience/' || args.includes('experience')) {
                response = `
<pre style="font-family:inherit;margin:0;line-height:1.45;">
total 3 records
drwxr-xr-x  4 muditagrawal  staff  128B  Jun 01 09:00  <span style="color:#4facfe;font-weight:600;">Carnot-Research-IITD</span>/   <span style="color:#888;"># AI/ML Intern (Jun 2026 – Present)</span>
drwxr-xr-x  4 muditagrawal  staff  128B  Dec 01 09:00  <span style="color:#4facfe;font-weight:600;">Zee-Tech-Innovation</span>/    <span style="color:#888;"># ML Intern (Dec 2025 – Jan 2026)</span>
drwxr-xr-x  4 muditagrawal  staff  128B  Jun 01 09:00  <span style="color:#4facfe;font-weight:600;">WESEE-Indian-Navy</span>/      <span style="color:#888;"># Summer Intern, Defence R&D (Jun 2025 – Jul 2025)</span>
</pre>
`;
            } else if (args === 'skills' || args === 'skills/' || args.includes('skills')) {
                response = `
<pre style="font-family:inherit;margin:0;line-height:1.45;">
total 6 categories
drwxr-xr-x   6 muditagrawal  staff   192B  Aug 23 01:15  <span style="color:#4facfe;font-weight:600;">Programming</span>/   <span style="color:#888;"># Python, Java, C, SQL</span>
drwxr-xr-x  17 muditagrawal  staff   544B  Aug 23 01:15  <span style="color:#4facfe;font-weight:600;">Frameworks</span>/    <span style="color:#888;"># LangChain, PyTorch, TensorFlow, Keras, Scikit-Learn, OpenCV, FastAPI</span>
drwxr-xr-x  15 muditagrawal  staff   480B  Aug 23 01:15  <span style="color:#4facfe;font-weight:600;">Models</span>/        <span style="color:#888;"># YOLOv8/11/26, Whisper, Coqui XTTS, BLIP, Mistral-7B, Qwen 2.5, BGE-M3</span>
drwxr-xr-x   8 muditagrawal  staff   256B  Aug 23 01:15  <span style="color:#4facfe;font-weight:600;">Databases</span>/     <span style="color:#888;"># PostgreSQL, ChromaDB, SQLite, Elasticsearch, Qdrant, MongoDB</span>
drwxr-xr-x   8 muditagrawal  staff   256B  Aug 23 01:15  <span style="color:#4facfe;font-weight:600;">Evaluation</span>/    <span style="color:#888;"># RAGAS, TruLens, BIER, PyTest, CI/CD, InfoVQA</span>
drwxr-xr-x  18 muditagrawal  staff   576B  Aug 23 01:15  <span style="color:#4facfe;font-weight:600;">Tools</span>/         <span style="color:#888;"># Git, Docker, OAuth2.0, Cloudflare R2, Ollama, Groq, Airflow, Spark</span>
</pre>
`;
            } else {
                const isAll = args.includes('-a') || args.includes('-la') || args.includes('-al');
                const hidden = isAll ? [
                    ['drwxr-xr-x', '12', 'muditagrawal', 'staff', '384B', 'Aug 23 01:15', '.'],
                    ['drwxr-xr-x', ' 4', 'root        ', 'admin', '128B', 'Aug 23 01:15', '..'],
                    ['-rw-r--r--', ' 1', 'muditagrawal', 'staff', '6.0K', 'Aug 23 01:15', '.DS_Store'],
                    ['drwxr-xr-x', '14', 'muditagrawal', 'staff', '448B', 'Aug 23 01:15', '.git'],
                    ['-rw-r--r--', ' 1', 'muditagrawal', 'staff', '1.2K', 'Aug 23 01:15', '.zshrc']
                ] : [];
                
                const entries = [
                    ...hidden,
                    ['drwxr-xr-x', ' 8', 'muditagrawal', 'staff', '256B', 'Aug 23 01:15', 'projects/'],
                    ['drwxr-xr-x', ' 3', 'muditagrawal', 'staff', ' 96B', 'Aug 23 01:15', 'experience/'],
                    ['drwxr-xr-x', ' 7', 'muditagrawal', 'staff', '224B', 'Aug 23 01:15', 'education/'],
                    ['drwxr-xr-x', ' 4', 'muditagrawal', 'staff', '128B', 'Aug 23 01:15', 'skills/'],
                    ['drwxr-xr-x', ' 4', 'muditagrawal', 'staff', '128B', 'Aug 23 01:15', 'documents/'],
                    ['-rw-r--r--', ' 1', 'muditagrawal', 'staff', ' 58K', 'Aug 23 01:15', 'MuditAgrawalResume.pdf'],
                    ['-rw-r--r--', ' 1', 'muditagrawal', 'staff', '2.4K', 'Aug 23 01:15', 'README.txt'],
                    ['-rw-r--r--', ' 1', 'muditagrawal', 'staff', '1.8K', 'Aug 23 01:15', 'resume.txt'],
                    ['-rw-r--r--', ' 1', 'muditagrawal', 'staff', '1.2K', 'Aug 23 01:15', 'Philosophy.txt']
                ];
                
                response = '<pre style="font-family:inherit;margin:0;line-height:1.45;">' + entries.map(([perm, links, owner, group, size, date, name]) =>
                    `<span style="color:#666;">${perm}</span> ${links} <span style="color:#888;">${owner} ${group}</span>  <span style="color:#888;">${size.padStart(5)}</span>  <span style="color:#666;">${date}</span>  <span style="color:${name.endsWith('/') ? '#4facfe;font-weight:600' : (name.startsWith('.') ? '#666' : '#f1f1f1')};">${name}</span>`
                ).join('\n') + '</pre><div style="color:#666;margin-top:6px;">Tip: Run <em>ls projects/</em> to inspect repositories, or <em>open finder</em> to browse visually.</div>';
            }
        } else if (cmd.startsWith('brew install') || cmd === 'brew') {
            const targetPkg = cmd.replace(/^brew\s*install\s*/, '').trim();
            response = `
<div style="font-family:inherit;line-height:1.45;color:#f1f1f1;">
<span style="color:#4facfe;font-weight:700;">==&gt; Downloading https://github.com/muditagrawal-alt/talent/releases/v2026.8.tar.gz</span><br>
<span style="color:#27c93f;">######################################################################## 100.0%</span><br>
<span style="color:#4facfe;font-weight:700;">==&gt; Fetching dependencies for mudit-agrawal/formulae/${escapeHtml(targetPkg || 'talent')}:</span><br>
  <span style="color:#888;">-&gt; grit (&gt;= 10.0)</span> <span style="color:#27c93f;">[installed]</span><br>
  <span style="color:#888;">-&gt; curiosity (&gt;= 99.9)</span> <span style="color:#27c93f;">[installed]</span><br>
  <span style="color:#888;">-&gt; pytorch-gpu (&gt;= 2.4)</span> <span style="color:#27c93f;">[installed]</span><br>
  <span style="color:#888;">-&gt; multimodal-rag-engine (&gt;= 1.0)</span> <span style="color:#27c93f;">[installed]</span><br>
  <span style="color:#888;">-&gt; agentic-workflows (&gt;= 3.0)</span> <span style="color:#27c93f;">[installed]</span><br>
<span style="color:#4facfe;font-weight:700;">==&gt; Pouring talent--2026.8.23.arm64_sequoia.bottle.tar.gz</span><br>
🍺  <span style="color:#f6d365;">/opt/homebrew/Cellar/talent/2026.8.23: 1,337 files, 42.0MB, built in 0.42s</span><br>
<span style="color:#4facfe;font-weight:700;">==&gt; Running post-install steps for talent...</span><br>
<span style="color:#27c93f;">✔</span> Neural weights loaded into high-priority memory.<br>
<span style="color:#27c93f;">✔</span> Ready to build and deploy high-impact AI/ML systems on Day 1.<br><br>
<span style="color:#ffbd2e;font-weight:700;">==&gt; Caveats</span><br>
Mudit Agrawal has been successfully symlinked to your engineering organization!<br>
To initiate collaboration:<br>
  $ <span style="color:#43e97b;">open mail</span><br>
  $ <span style="color:#43e97b;">open omnidoc</span><br>
  $ <span style="color:#43e97b;">cat resume.txt</span>
</div>
`;
        } else {
            switch(cmd) {
                case 'help':
                case 'man':
                    response = `
                        <strong style="color:#fff;">Available CLI Commands:</strong><br>
                        <span style="color:#888;">── Core Information ──</span><br>
                        • <span style="color:#4facfe">whoami</span> — Display author identity<br>
                        • <span style="color:#4facfe">cat resume.txt</span> — Rich text-formatted resume<br>
                        • <span style="color:#4facfe">neofetch</span> — ASCII art system info card & specifications<br>
                        • <span style="color:#4facfe">history</span> — Chronological career & project timeline<br>
                        • <span style="color:#4facfe">about me</span> — Mudit's brief background bio<br>
                        • <span style="color:#4facfe">experience</span> — Internship history at Carnot, Zee & WESEE<br>
                        • <span style="color:#4facfe">projects</span> — List core AI/ML repositories<br>
                        • <span style="color:#4facfe">skills</span> — Technologies & frameworks stack<br>
                        • <span style="color:#4facfe">contact</span> — Email, phone, GitHub & LinkedIn<br>
                        <br>
                        <span style="color:#888;">── Filesystem & Navigation ──</span><br>
                        • <span style="color:#4facfe">ls / ls projects/</span> — Inspect directories and project repositories<br>
                        • <span style="color:#4facfe">pwd</span> — Print current working directory path<br>
                        • <span style="color:#4facfe">cd &lt;dir&gt;</span> — Navigate filesystem in Finder<br>
                        • <span style="color:#4facfe">cat &lt;file&gt;</span> — Read file contents (e.g. <em>cat README.txt</em>)<br>
                        • <span style="color:#4facfe">open &lt;project-name&gt;</span> — Open project GitHub repo (e.g. <em>open omnidoc</em>)<br>
                        • <span style="color:#4facfe">open &lt;app&gt;</span> — Launch macOS apps (e.g. <em>open safari</em>, <em>open mail</em>)<br>
                        • <span style="color:#af52de">iris / hey iris</span> — Launch Iris AI Assistant ✨<br>
                        <br>
                        <span style="color:#888;">── Builtins & Easter Eggs ──</span><br>
                        • <span style="color:#27c93f">sudo hire-me</span> — Candidate hiring transmission protocol<br>
                        • <span style="color:#27c93f">brew install talent</span> — Homebrew talent package manager<br>
                        • <span style="color:#4facfe">date / uname / echo / clear</span> — Standard shell builtins<br>
                        <span style="color:#666;">↑/↓ recalls history &nbsp;·&nbsp; Tab completes commands</span>
                    `;
                    break;
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
                case 'uname':
                case 'uname -a':
                    response = 'Darwin macbook-pro 25.0.0 macOS Mudit 1.0 (Portfolio Edition) arm64';
                    break;
                case 'history':
                    response = `
<pre style="font-family:inherit;margin:0;line-height:1.45;color:#f1f1f1;">
<strong style="color:#4facfe;">[ MUDIT AGRAWAL — CAREER & PROJECT TIMELINE ]</strong>
<span style="color:#555;">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>
<span style="color:#ffbd2e;font-weight:700;">• 2021 [FOUNDATION]</span>
  └─ <strong>Navy Children School, Mumbai</strong> (Class 10 — 89%)
     Discovered computer science and algorithmic logic; started building software.

<span style="color:#ffbd2e;font-weight:700;">• 2023 [ACADEMIC JOURNEY]</span>
  └─ <strong>Navy Children School, New Delhi</strong> (Class 12 — 74%)
  └─ Joined <strong>B.Tech Computer Science (AI/ML) @ IILM University</strong> (CGPA: 7.68)
     Deep dived into Deep Learning, Applied Math, and Systems Programming.

<span style="color:#ffbd2e;font-weight:700;">• 2024 – 2025 [SYSTEMS & CORE ML EXPLORATION]</span>
  └─ Built <strong>Helix-Compiler</strong> — C-based lexical analysis, AST parsing & IR generation.
  └─ Developed <strong>Multiva.Ai</strong> — Voice cloning with Whisper & Coqui XTTS.
  └─ Created <strong>Artifex.ai</strong> & <strong>Inflx AutoStream</strong> workflow automation.

<span style="color:#ffbd2e;font-weight:700;">• Jun 2025 – Jul 2025 [DEFENSE R&D INTERNSHIP]</span>
  └─ <strong>Summer Intern @ WESEE, Indian Navy (Ministry of Defence)</strong>
     Engineered defense surveillance computer vision models & real-time edge pipelines.

<span style="color:#ffbd2e;font-weight:700;">• Sep 2025 – Nov 2025 [DEEP LEARNING BREAKTHROUGHS]</span>
  └─ Published <strong>Project S.W.O.R.D</strong> — Weapon observation (90.1% mAP@0.5 on 7.5k imgs).
  └─ Engineered <strong>Deepfake Detector</strong> — Facial manipulation signals & media forensics.

<span style="color:#ffbd2e;font-weight:700;">• Dec 2025 – Jan 2026 [MEDIA TECH INTERNSHIP]</span>
  └─ <strong>ML Intern @ Zee Tech and Innovation Centre</strong>
     Automated video highlight tagging and emotion recognition pipelines at scale.

<span style="color:#ffbd2e;font-weight:700;">• Jan 2026 [MULTIMODAL RAG & AGENTIC AI]</span>
  └─ Launched <strong>OmniDoc</strong> — Multimodal RAG with Mistral-7B, Nomic & BLIP.
  └─ Released <strong>Sliver.Ai</strong> — Smart video clipping pipeline with YOLOv8/11 & FFmpeg.

<span style="color:#ffbd2e;font-weight:700;">• Jun 2026 – Present [IIT-D STARTUP INTERNSHIP]</span>
  └─ <strong>AI/ML Intern @ Carnot Research Pvt. Ltd. (IIT Delhi Incubated)</strong>
     Architecting production-ready LLM pipelines, autonomous agent systems & evaluation.

<span style="color:#27c93f;font-weight:700;">• NEXT MILESTONE [YOUR TEAM?]</span>
  └─ Ready to deploy production AI systems with high impact!
     <em>Type 'sudo hire-me' or 'brew install talent' to trigger offer protocol 🚀</em>
<span style="color:#555;">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>
</pre>
`;
                    break;
                case 'sudo hire-me':
                case 'sudo hire':
                case 'hire-me':
                case 'hire': {
                    const p = window.PROFILE_DATA || {};
                    response = `
<div style="font-family:inherit;line-height:1.45;color:#f1f1f1;">
<span style="color:#888;">[sudo] password for muditagrawal: </span><span style="color:#fff;">••••••••••••</span><br>
<span style="color:#27c93f;font-weight:700;">[AUTH] Authentication successful. Elevated permissions granted!</span><br><br>
<div style="color:#4facfe;font-weight:700;">🚀 INITIATING CANDIDATE ONBOARDING PROTOCOL...</div>
<div style="color:#555;">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
  <span style="color:#27c93f;">✔</span> <strong>Education Verification:</strong> B.Tech CSE (AI/ML) @ IILM University <span style="color:#27c93f;">[VERIFIED]</span><br>
  <span style="color:#27c93f;">✔</span> <strong>Core Competencies:</strong> Multimodal RAG, CV (YOLO), PyTorch, C, LLM Agents <span style="color:#27c93f;">[100% MATCH]</span><br>
  <span style="color:#27c93f;">✔</span> <strong>Track Record:</strong> Carnot Research (IIT-D), Zee Tech, WESEE (Navy R&D) <span style="color:#27c93f;">[PROVEN]</span><br>
  <span style="color:#27c93f;">✔</span> <strong>Culture Fit:</strong> High grit, rapid execution, ships outside sandboxes <span style="color:#27c93f;">[EXCEPTIONAL]</span><br>
<div style="color:#555;">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
📦 Packaging candidate payload... <span style="color:#27c93f;">Done!</span><br>
📨 Dispatching offer transmission to <span style="color:#4facfe;font-weight:600;">${p.contact?.email || 'muditagrawal03@gmail.com'}</span>...<br><br>
<span style="color:#27c93f;font-weight:700;font-size:14px;">🎉 CONGRATULATIONS! You've just made the best hiring decision of the year! 🤝</span><br>
<span style="color:#888;">Tip: Type <em>open mail</em> or <em>cat contact</em> to finalize the details.</span>
</div>
`;
                    break;
                }
                case 'about me':
                case 'about': {
                    const p = window.PROFILE_DATA || {};
                    response = `${p.name || 'Mudit Agrawal'}. ${p.bio || ''}`;
                    break;
                }
                case 'experience': {
                    const p = window.PROFILE_DATA || {};
                    response = (p.experience || []).map(e => `- <strong>${e.role}</strong> @ ${e.org} (${e.dates})`).join('<br>');
                    break;
                }
                case 'education': {
                    const p = window.PROFILE_DATA || {};
                    response = `- <strong>${p.education?.degree || 'B.Tech in Computer Science (AI/ML)'}</strong>, ${p.education?.university || 'IILM University'} (${p.education?.years || '2023 - 2027'}) — CGPA ${p.education?.cgpa || '7.68'}<br>- Class 12, Navy Children School, New Delhi (2023) — 74%<br>- Class 10, Navy Children School, Mumbai (2021) — 89%`;
                    break;
                }
                case 'projects':
                    response = '• <strong style="color:#4facfe;">OmniDoc</strong> — Multimodal RAG Document Intelligence System<br>• <strong style="color:#4facfe;">Sliver.Ai</strong> — Smart Video Clipping & Facial Highlights<br>• <strong style="color:#4facfe;">Project S.W.O.R.D</strong> — Real-Time Weapon Surveillance System<br>• <strong style="color:#4facfe;">Deepfake Detector</strong> — Media Forensics & Fake News Detection<br>• <strong style="color:#4facfe;">Helix-Compiler</strong> — C-Based Language Compiler<br>• <strong style="color:#4facfe;">Multiva.Ai</strong> — Multilingual AI Voice Cloning<br>• <strong style="color:#4facfe;">Inflx AutoStream</strong> — Autonomous AI Workflow Agent<br>• <strong style="color:#4facfe;">Artifex</strong> — Generative AI Creative Design Platform<br><span style="color:#888;">Tip: Type <em>open &lt;project-name&gt;</em> (e.g. <em>open omnidoc</em>) to visit repo!</span>';
                    break;
                case 'skills':
                    response = `<strong>Programming:</strong> Python, Java, C, SQL<br><strong>Frameworks:</strong> LangChain, PyTorch, TensorFlow, Keras, Scikit-Learn, OpenCV, NumPy, Pandas, Matplotlib, Docling, PySpark, FAISS, Flask, FastAPI, SQLAlchemy<br><strong>Models:</strong> YOLOv8/11/26, Whisper (CTranslate2), Coqui XTTS, OpenVoice, BLIP, Mistral-7B, Gemma4, Qwen 2.5, Wav2Lip, FB-NLLB, BGE-M3 Embeddings/ReRanker, SentenceTransformers<br><strong>Databases:</strong> PostgreSQL, ChromaDB, SQLite, Elasticsearch, Qdrant, MongoDB<br><strong>Evaluation:</strong> RAGAS, TruLens, BIER, PyTest, CI/CD, InfoVQA<br><strong>Tools:</strong> Git, Docker, OAuth2.0, Cloudflare R2, Ollama, Groq, Google Calendar API, Gradio, Streamlit, Firebase, Supabase, Apache Airflow, Apache Spark, MistralOCR, FFmpeg, Claude`;
                    break;
                case 'contact': {
                    const p = window.PROFILE_DATA || {};
                    response = `Email: <a href="mailto:${p.contact?.email || 'muditagrawal03@gmail.com'}" style="color:#4facfe;">${p.contact?.email || 'muditagrawal03@gmail.com'}</a><br>Phone: ${p.contact?.phone || '+91-7289887349'}<br>LinkedIn: <a href="${p.contact?.linkedin || ''}" target="_blank" rel="noopener noreferrer" style="color:#4facfe;">${p.contact?.linkedin || ''}</a><br>GitHub: <a href="${p.contact?.github || ''}" target="_blank" rel="noopener noreferrer" style="color:#4facfe;">${p.contact?.github || ''}</a>`;
                    break;
                }
                case 'git status':
                    response = `<pre style="font-family:inherit;margin:0;line-height:1.45;color:#f1f1f1;">On branch main\nYour branch is up to date with 'origin/main'.\n\nChanges not staged for commit:\n  (use "git add &lt;file&gt;..." to update what will be committed)\n\t<span style="color:#27c93f;">modified:   portfolio-v2.0 (macOS Tahoe Edition)</span>\n\nno changes added to commit (use "git commit -a")</pre>`;
                    break;
                case 'git log':
                    response = `<pre style="font-family:inherit;margin:0;line-height:1.45;color:#f1f1f1;"><span style="color:#f6d365;">commit 8f2d91a</span> (HEAD -> main, origin/main)\nAuthor: Mudit Agrawal &lt;muditagrawal03@gmail.com&gt;\nDate:   Sun Aug 23 2026\n\n    feat: authentic macOS terminal CLI with easter eggs and RAG systems\n\n<span style="color:#f6d365;">commit 3c7e14b</span>\nAuthor: Mudit Agrawal &lt;muditagrawal03@gmail.com&gt;\nDate:   Fri Jan 15 2026\n\n    feat: release OmniDoc Multimodal RAG document intelligence</pre>`;
                    break;
                case 'matrix':
                    response = `<div style="color:#27c93f;font-family:monospace;line-height:1.2;font-size:11px;">01001101 01110101 01100100 01101001 01110100<br>W A K E   U P ,   N E O . . .<br>T H E   M A T R I X   H A S   Y O U . . .<br>F O L L O W   T H E   W H I T E   R A B B I T 🐇</div>`;
                    break;
                case 'curl':
                    response = `curl: try <em>curl mudit.dev</em> or <em>curl -I github.com</em>`;
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
}
