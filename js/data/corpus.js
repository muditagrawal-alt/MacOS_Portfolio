/* ==========================================================================
   Portfolio Search Corpus — Single Source of Truth
   --------------------------------------------------------------------------
   ONE index, THREE consumers. Do not duplicate this list:
     • Safari    — "From this portfolio" results alongside web search
     • Spotlight — Cmd+Space system-wide search
     • Iris      — grounding for offline answers when no model endpoint is set

   Each entry: { title, type, url?, action?, text, tags[] }
   `action` is a verb the app layer resolves (open_finder: / open_project: /
   open_app:), never a string that gets eval'd.
   ========================================================================== */

window.PORTFOLIO_CORPUS = [
  { title: 'OmniDoc', type: 'Project', url: 'https://github.com/muditagrawal-alt/OmniDoc',
    action: 'open_project:OmniDoc',
    text: 'Multimodal RAG Document Intelligence System using Mistral-7B, Nomic embeddings, and BLIP.',
    tags: ['rag', 'llm', 'multimodal', 'document intelligence', 'omnidoc', 'ai', 'mistral', 'nomic', 'blip', 'python'] },
  { title: 'Project S.W.O.R.D', type: 'Project', url: 'https://github.com/muditagrawal-alt/Project-S.W.O.R.D',
    action: 'open_project:Project S.W.O.R.D',
    text: 'Real-time weapon detection using YOLOv26m, pose estimation, and behavioral classification. 90.1% mAP@0.5 on 7,500 images.',
    tags: ['computer vision', 'yolo', 'weapon detection', 'defense', 'surveillance', 'sword', 's.w.o.r.d'] },
  { title: 'Sliver.Ai', type: 'Project', url: 'https://github.com/muditagrawal-alt/Sliver-Smart-Video-Clipping-Tool',
    action: 'open_project:Sliver.Ai',
    text: 'AI highlight clipping pipeline using YOLOv8-Face, YOLOv11, and FFmpeg.',
    tags: ['video', 'clipping', 'yolo', 'ffmpeg', 'sliver', 'sliver.ai'] },
  { title: 'Multiva.Ai', type: 'Project', url: 'https://github.com/muditagrawal-alt/Multiva.Ai',
    action: 'open_project:Multiva.Ai',
    text: 'Voice cloning with Whisper, Coqui XTTS, and FB-NLLB.',
    tags: ['audio', 'speech synthesis', 'voice cloning', 'whisper', 'multiva', 'multiva.ai'] },
  { title: 'Helix-Compiler', type: 'Project', url: 'https://github.com/muditagrawal-alt/Helix-Compiler',
    action: 'open_project:Helix-Compiler',
    text: 'C-based parsing, translation, and systems compiler.',
    tags: ['compiler', 'systems', 'c', 'parsing', 'helix', 'helix-compiler'] },
  ...(window.PROFILE_DATA?.experience || []).map(e => ({
    title: `${e.role} — ${e.org}`,
    type: 'Experience',
    url: null,
    action: 'open_finder:experience',
    text: `${e.dates}. ${e.role} at ${e.org}.`,
    tags: ['experience', 'internship', ...e.org.toLowerCase().split(/[\s,()]+/).filter(Boolean)]
  })),
  { title: window.PROFILE_DATA?.education?.degree || 'B.Tech in Computer Science (AI/ML)', type: 'Education', url: null,
    action: 'open_finder:education',
    text: `${window.PROFILE_DATA?.education?.university || 'IILM University'}. ${window.PROFILE_DATA?.education?.years || '2023–2027'}. CGPA ${window.PROFILE_DATA?.education?.cgpa || ''}.`, 
    tags: ['education', 'iilm', 'university', 'btech', 'degree', 'cgpa'] },
  { title: 'Contact Information', type: 'Contact', url: `mailto:${window.PROFILE_DATA?.contact?.email || 'muditagrawal03@gmail.com'}`,
    action: 'open_finder:contact',
    text: `Email ${window.PROFILE_DATA?.contact?.email || ''} • Phone ${window.PROFILE_DATA?.contact?.phone || ''} • LinkedIn: ${window.PROFILE_DATA?.contact?.linkedin || ''} • GitHub: ${window.PROFILE_DATA?.contact?.github || ''}`, 
    tags: ['contact', 'email', 'linkedin', 'phone', 'reach out', 'hire'] },
  { title: `${window.PROFILE_DATA?.name || 'Mudit Agrawal'} — Technical Skills & Stacks`, type: 'Skills', url: null,
    action: 'open_finder:skills',
    text: 'Programming (Python, Java, C, SQL), Frameworks (LangChain, PyTorch, TensorFlow, Scikit-Learn, OpenCV, FastAPI), Models (YOLOv8/11/26, Whisper, Mistral-7B, BLIP, XTTS, BGE-M3), Databases (PostgreSQL, ChromaDB, Qdrant), Evaluation (RAGAS, TruLens), Tools (Docker, Git, Ollama, Spark, Airflow).', 
    tags: ['skills', 'stack', 'python', 'java', 'c', 'sql', 'langchain', 'pytorch', 'tensorflow', 'opencv', 'fastapi', 'yolo', 'whisper', 'mistral', 'blip', 'chromadb', 'ragas', 'docker', 'git', 'ollama'] },
  { title: `${window.PROFILE_DATA?.name || 'Mudit Agrawal'} — Portfolio Bio & About`, type: 'About', url: null,
    action: 'open_finder:about',
    text: window.PROFILE_DATA?.bio || 'Computer Science Undergraduate (AI/ML) at IILM University.', 
    tags: ['about', 'bio', 'mudit', 'profile'] }
];

/**
 * Ranked substring search over the corpus.
 * @param {string} query
 * @param {{minScore?:number, limit?:number}} opts
 * @returns {Array} matching corpus entries, best first
 */
function searchPortfolioCorpus(query, opts = {}) {
    const { minScore = 3, limit = 3 } = opts;
    const q = (query || '').toLowerCase().trim();
    if (!q) return [];

    // 2-char terms are meaningful here ("ai", "cv", "ml"), so keep them —
    // the minScore threshold is what filters noise, not the term length.
    const terms = q.split(/\s+/).filter(t => t.length >= 2);
    if (terms.length === 0) return [];

    return window.PORTFOLIO_CORPUS
        .map(entry => {
            const haystack = `${entry.title} ${entry.text} ${entry.tags.join(' ')}`.toLowerCase();
            let score = 0;
            terms.forEach(term => {
                if (entry.title.toLowerCase().includes(term)) score += 3;
                if (entry.tags.some(t => t.includes(term))) score += 2;
                if (haystack.includes(term)) score += 1;
            });
            return { entry, score };
        })
        .filter(r => r.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(r => r.entry);
}

/**
 * Resolves a corpus `action` verb to a real app action.
 * Replaces the previous eval()-based dispatch.
 */
function runCorpusAction(action, url) {
    if (!action) {
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
        return;
    }
    const [verb, arg] = [action.slice(0, action.indexOf(':')), action.slice(action.indexOf(':') + 1)];
    switch (verb) {
        case 'open_finder':  openFinderPane(arg); break;
        case 'open_app':     openWindow(arg); break;
        case 'open_project':
            if (url) window.open(url, '_blank', 'noopener,noreferrer');
            else openWindow('appstore-window');
            break;
        default:
            if (url) window.open(url, '_blank', 'noopener,noreferrer');
    }
}
