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
${exp.map(x => {
    let s = `  • ${x.role} — ${x.org}\n    Dates: ${x.dates}`;
    if (x.bullets && x.bullets.length) {
        s += '\n' + x.bullets.map(b => `    - ${b}`).join('\n');
    }
    return s;
}).join('\n\n')}

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
            } else if (file === 'experience' || file === 'experience.txt') {
                response = `
<pre style="font-family:inherit;margin:0;line-height:1.45;color:#f1f1f1;">
WORK EXPERIENCE (From Resume)
--------------------------------------------------------------------------------
1. AI/ML Intern @ Carnot Research Pvt. Ltd. (IITD Incubated Startup)
   Dates: June 2026 – Present
   – Architected a hybrid RAG platform (pgvector, BM25, Text-to-SQL router), cutting query latency 60s to &lt;1s.
   – Built a dataset-agnostic ETL pipeline (Spark, Airflow) with a 3-tier OCR fallback chain across 6 languages.
   – Integrated a 9,000+ line email/scheduling agent into production, validated via CI/CD with RAGAS and TruLens.
   – Engineered 3 Intel-optimized RAG modes (INT8-quantized), cutting latency 2-3x while reaching 92% Recall@10.

2. Machine Learning Intern @ Zee Tech and Innovation Centre
   Dates: December 2025 – January 2026
   – Engineered OmniDoc, a local multimodal RAG engine with BLIP-captioned image retrieval and intent routing.
   – Architected a context-aware scene selector, replacing naive top-k selection with budget-optimized ranking.
   – Built a full-stack video prototype with user auth, async job processing, and live progress tracking.
   – Authored 2 security design specs proposing ML architectures for anomaly detection and content fingerprinting.

3. Summer Intern @ WESEE, Indian Navy (Defense R&D)
   Dates: June 2025 – July 2025
   – Assessed in-house LLMs for naval applications within a secure defense R&D environment.
   – Identified bugs, inconsistencies, and logic failures in model outputs for mission-critical reliability.
   – Validated Retrieval-Augmented Generation (RAG) pipelines and improved contextual retrieval accuracy.
   – Built Artifex.AI, a text-to-image tool integrating Stability AI’s SDXL 1.0 API with sub-5s latency.
</pre>`;
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
<pre style="font-family:inherit;margin:0;line-height:1.45;color:#f1f1f1;">
<strong style="color:#4facfe;">[ WORK EXPERIENCE — FROM RESUME ]</strong>
<span style="color:#555;">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>
<span style="color:#ffbd2e;font-weight:700;">1. AI/ML Intern @ Carnot Research Pvt. Ltd. (IITD Incubated Startup)</span>
   <span style="color:#888;">Dates: June 2026 – Present</span>
   – Architected a hybrid RAG platform (pgvector, BM25, Text-to-SQL router), cutting query latency 60s to &lt;1s.
   – Built a dataset-agnostic ETL pipeline (Spark, Airflow) with a 3-tier OCR fallback chain across 6 languages.
   – Integrated a 9,000+ line email/scheduling agent into production, validated via CI/CD with RAGAS and TruLens.
   – Engineered 3 Intel-optimized RAG modes (INT8-quantized), cutting latency 2-3x while reaching 92% Recall@10.

<span style="color:#ffbd2e;font-weight:700;">2. Machine Learning Intern @ Zee Tech and Innovation Centre</span>
   <span style="color:#888;">Dates: December 2025 – January 2026</span>
   – Engineered OmniDoc, a local multimodal RAG engine with BLIP-captioned image retrieval and intent routing.
   – Architected a context-aware scene selector, replacing naive top-k selection with budget-optimized ranking.
   – Built a full-stack video prototype with user auth, async job processing, and live progress tracking.
   – Authored 2 security design specs proposing ML architectures for anomaly detection and content fingerprinting.

<span style="color:#ffbd2e;font-weight:700;">3. Summer Intern @ WESEE, Indian Navy (Defense R&D)</span>
   <span style="color:#888;">Dates: June 2025 – July 2025</span>
   – Assessed in-house LLMs for naval applications within a secure defense R&D environment.
   – Identified bugs, inconsistencies, and logic failures in model outputs for mission-critical reliability.
   – Validated Retrieval-Augmented Generation (RAG) pipelines and improved contextual retrieval accuracy.
   – Built Artifex.AI, a text-to-image tool integrating Stability AI’s SDXL 1.0 API with sub-5s latency.
<span style="color:#555;">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>
</pre>
`;
            } else if (args === 'skills' || args === 'skills/' || args.includes('skills')) {
                response = `
<pre style="font-family:inherit;margin:0;line-height:1.45;color:#f1f1f1;">
<strong style="color:#4facfe;">[ TECHNICAL SKILLS — FROM RESUME ]</strong>
<span style="color:#555;">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>
<span style="color:#ffbd2e;font-weight:700;">• Programming:</span>
  Python, Java, C, SQL

<span style="color:#ffbd2e;font-weight:700;">• Frameworks & ML:</span>
  LangChain, PyTorch, TensorFlow, Keras, Scikit-Learn, OpenCV, NumPy, Pandas, Matplotlib, Docling, PySpark, FAISS, Flask, FastAPI, SQLAlchemy

<span style="color:#ffbd2e;font-weight:700;">• AI Models & Architectures:</span>
  YOLOv8/11/26, Whisper (CTranslate2), Coqui XTTS, OpenVoice, BLIP, Mistral-7B, Gemma4, Qwen 2.5, Wav2Lip, FB-NLLB, BGE-M3 Embeddings, BGE-M3 ReRanker, SentenceTransformers

<span style="color:#ffbd2e;font-weight:700;">• Databases & Vector Stores:</span>
  PostgreSQL, ChromaDB, SQLite, Elasticsearch, Qdrant, MongoDB

<span style="color:#ffbd2e;font-weight:700;">• Evaluation & Validation:</span>
  RAGAS, TruLens, BIER, PyTest, CI/CD, InfoVQA

<span style="color:#ffbd2e;font-weight:700;">• Tools, DevOps & Cloud:</span>
  Git, Docker, OAuth2.0, Cloudflare R2, Ollama, Groq, Google Calendar API, Gradio, Streamlit, Firebase, Supabase, Apache Airflow, Apache Spark, MistralOCR, FFmpeg, Claude
<span style="color:#555;">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>
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
                    response = `
<pre style="font-family:inherit;line-height:1.35;margin:0;">
<span style="color:#34c759;">                    'c.          </span><span style="color:#ffffff;font-weight:700;">muditagrawal</span><span style="color:#888;">@</span><span style="color:#4facfe;font-weight:700;">macbook-pro</span>
<span style="color:#34c759;">                 ,xNMM.          </span><span style="color:#555;">------------------------</span>
<span style="color:#34c759;">               .OMMMMo           </span><span style="color:#f6d365;font-weight:600;">OS:</span> macOS Tahoe 26.0 (Finder Portfolio Edition)
<span style="color:#34c759;">               OMMM0,            </span><span style="color:#f6d365;font-weight:600;">Host:</span> MacBook Pro 16" (Apple Silicon M3 Max)
<span style="color:#ffcc00;">     .;loddo:.  </span><span style="color:#34c759;">.oaMMMMso:       </span><span style="color:#f6d365;font-weight:600;">Kernel:</span> Darwin 25.0.0 (arm64)
<span style="color:#ffcc00;">   :0KMMMMMMMWk.  </span><span style="color:#34c759;">.dNMMMMK,      </span><span style="color:#f6d365;font-weight:600;">Uptime:</span> 3+ years in AI/ML & Systems
<span style="color:#ff9500;">  :Nk.       .kM:   </span><span style="color:#34c759;">.dMMMMc      </span><span style="color:#f6d365;font-weight:600;">Shell:</span> zsh 5.9 (arm64-apple-darwin25.0)
<span style="color:#ff9500;"> .MN           OM:    </span><span style="color:#34c759;">.MMo       </span><span style="color:#f6d365;font-weight:600;">Terminal:</span> Apple_Terminal (Finder Portfolio)
<span style="color:#ff3b30;"> .MM.  .       .XM    </span><span style="color:#34c759;">xMM,       </span><span style="color:#f6d365;font-weight:600;">Education:</span> B.Tech CSE (AI/ML) @ IILM University
<span style="color:#ff3b30;">  kM;  :x        .    </span><span style="color:#34c759;">XM,        </span><span style="color:#f6d365;font-weight:600;">Focus:</span> Agentic AI, Multimodal RAG, CV (YOLOv26)
<span style="color:#af52de;">  ;MM.  .o.     .    </span><span style="color:#007aff;">oW"         </span><span style="color:#f6d365;font-weight:600;">Internships:</span> Carnot Research (IIT-D) • Zee • WESEE
<span style="color:#af52de;">   *W0.          .  </span><span style="color:#007aff;">.dK          </span><span style="color:#f6d365;font-weight:600;">Memory:</span> 100% Passion & Grit
<span style="color:#af52de;">    .kMD.       </span><span style="color:#007aff;">.oc.oWd          </span><span style="color:#f6d365;font-weight:600;">GitHub:</span> https://github.com/muditagrawal-alt
<span style="color:#af52de;">      'kWMMMMMMMMMMk'            </span>
<span style="color:#af52de;">        .,looodl;.               </span><span style="color:#ff5f56;">███</span> <span style="color:#ffbd2e;">███</span> <span style="color:#27c93f;">███</span> <span style="color:#4facfe;">███</span> <span style="color:#00f2fe;">███</span> <span style="color:#af52de;">███</span> <span style="color:#ff758c;">███</span> <span style="color:#ffffff;">███</span>
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
<span style="color:#ffbd2e;font-weight:700;">• 2020 – 2023 [10TH & 12TH GRADE]</span>
  └─ <strong>Navy Children School, Mumbai & New Delhi</strong> (Class X: 89%, Class XII: 74%)
     Developed foundational knowledge of science and got inspired to pursue engineering in Computer Science.

<span style="color:#ffbd2e;font-weight:700;">• 2023 – Present [B.TECH IN CSE (AI/ML)]</span>
  └─ <strong>B.Tech in Computer Science (AI/ML) @ IILM University</strong> (CGPA: 7.68)
     Pursuing engineering with deep focus on core systems, deep learning algorithms, applied math, and machine learning pipelines.

<span style="color:#ffbd2e;font-weight:700;">• June 2025 – July 2025 [1ST INTERNSHIP: WESEE, INDIAN NAVY]</span>
  └─ <strong>Summer Intern @ WESEE, Indian Navy (Defense R&D)</strong>
     Assessed in-house LLMs for naval applications within a secure defense R&D environment.
     Identified bugs, inconsistencies, and logic failures in model outputs for mission-critical reliability, and validated Retrieval-Augmented Generation (RAG) pipelines.
     During this period, created <strong>Artifex.AI</strong> (SDXL 1.0 text-to-image API) and a Pokémon guessing game.

<span style="color:#ffbd2e;font-weight:700;">• October 2025 [FIRST PROTOTYPE OF S.W.O.R.D]</span>
  └─ Engineered the first prototype of <strong>Project S.W.O.R.D</strong> (Surveillance for Weapon Observation using Real-Time Deep Learning)
     with baseline YOLOv8 real-time detection on security feeds.

<span style="color:#ffbd2e;font-weight:700;">• December 2025 – January 2026 [2ND INTERNSHIP: ZEE TECH & INNOVATION CENTRE]</span>
  └─ <strong>Machine Learning Intern @ Zee Tech and Innovation Centre</strong>
     Engineered <strong>OmniDoc</strong> (local multimodal RAG engine with BLIP-captioned image retrieval and intent routing) and context-aware scene selector.
     Also worked on <strong>Sliver.Ai</strong> smart video clipping with facial emotion recognition.

<span style="color:#ffbd2e;font-weight:700;">• February 2026 [MULTIVA.AI VOICE CLONING PLATFORM]</span>
  └─ Started working on <strong>Multiva.Ai</strong> — developing an async 11-stage voice cloning and dubbing pipeline
     using Whisper, NLLB-200, OpenVoice, Wav2Lip, and custom ROI face compositing (5ms/frame).

<span style="color:#ffbd2e;font-weight:700;">• April 2026 [SECOND PROTOTYPE OF S.W.O.R.D]</span>
  └─ Built second prototype of <strong>Project S.W.O.R.D</strong> using YOLOv26m, achieving 90.1% mAP@0.5 and 82.4% recall,
     7.4ms (135 FPS) inference speed, CCTV low-light augmentation, and Jetson Nano/Coral TPU edge deployment.

<span style="color:#ffbd2e;font-weight:700;">• June 2026 – Present [3RD INTERNSHIP: CARNOT RESEARCH (IITD-INCUBATED STARTUP)]</span>
  └─ <strong>AI/ML Intern @ Carnot Research Pvt. Ltd. (IIT Delhi Incubated Startup)</strong>
     Worked on <strong>AgenticOS:HARNESS</strong> (9,000+ line email/scheduling agent validated with RAGAS and TruLens)
     and production hybrid RAG systems (pgvector, BM25, Text-to-SQL router) cutting query latency 60s to &lt;1s.

<span style="color:#27c93f;font-weight:700;">• FUTURE [YOUR TEAM?]</span>
  └─ Ready to deploy production AI systems with high impact outside sandboxes!
     <em>Type 'sudo hire-me' or 'brew install talent' to trigger candidate protocol 🚀</em>
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
                    response = (p.experience || []).map(e => {
                        let text = `<div style="margin-bottom:8px;">• <strong style="color:#4facfe;">${escapeHtml(e.role)}</strong> @ ${escapeHtml(e.org)} <span style="color:#888;">(${escapeHtml(e.dates)})</span>`;
                        if (e.bullets) {
                            text += `<div style="padding-left:14px;color:#ccc;margin-top:2px;">` + e.bullets.map(b => `– ${escapeHtml(b)}`).join('<br>') + `</div>`;
                        }
                        text += `</div>`;
                        return text;
                    }).join('');
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
                    response = `
<div style="font-family:inherit;line-height:1.45;color:#f1f1f1;">
<strong style="color:#4facfe;">[ TECHNICAL SKILLS ]</strong><br>
• <strong style="color:#ffbd2e;">Programming:</strong> Python, Java, C, SQL<br>
• <strong style="color:#ffbd2e;">Frameworks & ML:</strong> LangChain, PyTorch, TensorFlow, Keras, Scikit-Learn, OpenCV, NumPy, Pandas, Matplotlib, Docling, PySpark, FAISS, Flask, FastAPI, SQLAlchemy<br>
• <strong style="color:#ffbd2e;">AI Models:</strong> YOLOv8/11/26, Whisper (CTranslate2), Coqui XTTS, OpenVoice, BLIP, Mistral-7B, Gemma4, Qwen 2.5, Wav2Lip, FB-NLLB, BGE-M3 Embeddings/ReRanker, SentenceTransformers<br>
• <strong style="color:#ffbd2e;">Databases:</strong> PostgreSQL, ChromaDB, SQLite, Elasticsearch, Qdrant, MongoDB<br>
• <strong style="color:#ffbd2e;">Evaluation:</strong> RAGAS, TruLens, BIER, PyTest, CI/CD, InfoVQA<br>
• <strong style="color:#ffbd2e;">Tools & Cloud:</strong> Git, Docker, OAuth2.0, Cloudflare R2, Ollama, Groq, Google Calendar API, Gradio, Streamlit, Firebase, Supabase, Apache Airflow, Apache Spark, MistralOCR, FFmpeg, Claude
</div>`;
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
