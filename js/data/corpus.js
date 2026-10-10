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
    tags: ['rag', 'llm', 'multimodal', 'document intelligence', 'omnidoc', 'ai', 'mistral', 'nomic', 'blip', 'python', 'project', 'projects', 'repo'] },
  { title: 'VLM Business Card Lead Extraction', type: 'Project', url: 'https://muditagrawal-lead-extraction.vercel.app',
    action: 'open_project:VLM-Leads',
    text: 'Live deployed web application: Bulk business-card lead extraction using vision-language models (Gemini & Qwen3-VL), structured parsing, and Excel export. FastAPI, React, Vercel, Oracle Cloud.',
    tags: ['vlm', 'vision', 'leads', 'business card', 'live app', 'deployed', 'gemini', 'fastapi', 'react', 'vercel', 'project', 'projects', 'repo'] },
  { title: 'Monocular RGB Sparse Point Cloud SLAM', type: 'Project', url: 'https://github.com/muditagrawal-alt/Monocular_RGB_Sparse_Point_Cloud_SLAM',
    action: 'open_project:SLAM',
    text: 'Real-time camera trajectory & sparse 3D point cloud reconstruction from single-lens video without GPU or neural network. 10s clip reconstructs in <7s on CPU.',
    tags: ['slam', 'computer vision', '3d', 'point cloud', 'geometry', 'cpu', 'c++', 'python', 'project', 'projects', 'repo'] },
  { title: 'Project S.W.O.R.D', type: 'Project', url: 'https://github.com/muditagrawal-alt/Project-S.W.O.R.D',
    action: 'open_project:Project S.W.O.R.D',
    text: 'Real-time weapon observation using YOLOv8 defense module, pose estimation, and behavioral classification for high-threat surveillance.',
    tags: ['computer vision', 'yolo', 'weapon detection', 'defense', 'surveillance', 'sword', 's.w.o.r.d', 'project', 'projects', 'repo'] },
  { title: 'Sliver.Ai', type: 'Project', url: 'https://github.com/muditagrawal-alt/Sliver-Smart-Video-Clipping-Tool',
    action: 'open_project:Sliver.Ai',
    text: 'On-device AI video summarization engine & smart highlight extractor using YOLO11m, YOLOv8-Face, and OpenAI CLIP with sample-accurate audio sync.',
    tags: ['video', 'clipping', 'yolo', 'ffmpeg', 'sliver', 'sliver.ai', 'highlights', 'project', 'projects', 'repo'] },
  { title: 'Multiva.Ai', type: 'Project', url: 'https://github.com/muditagrawal-alt/Multiva.Ai',
    action: 'open_project:Multiva.Ai',
    text: 'Offline video dubbing studio for Indian languages preserving speaker voice & lip sync using faster-whisper, NLLB-200, IndicF5 and Wav2Lip.',
    tags: ['audio', 'speech synthesis', 'voice cloning', 'whisper', 'multiva', 'multiva.ai', 'wav2lip', 'project', 'projects', 'repo'] },
  { title: 'Deepfake & Fake News Detector', type: 'Project', url: 'https://github.com/muditagrawal-alt/Deepfake-and-Fake-News-Detector',
    action: 'open_project:Deepfake',
    text: 'Media forensics plus LLM fact-checking system detecting facial manipulation signals and misinformation patterns.',
    tags: ['deepfake', 'forensics', 'fake news', 'security', 'ml', 'project', 'projects', 'repo'] },
  { title: 'Helix-Compiler', type: 'Project', url: 'https://github.com/muditagrawal-alt/Helix-Compiler',
    action: 'open_project:Helix-Compiler',
    text: 'C-based compiler implementation with lexical analysis, recursive descent AST parsing, three-address code generation, and DAG optimization.',
    tags: ['compiler', 'systems', 'c', 'parsing', 'helix', 'helix-compiler', 'project', 'projects', 'repo'] },
  { title: 'Skyguard AI', type: 'Project', url: 'https://github.com/muditagrawal-alt/Skyguard_AI_SIH2026',
    action: 'open_project:Skyguard',
    text: 'Autonomous aerial surveillance & smart defense monitoring system built for Smart India Hackathon (SIH 2026).',
    tags: ['defense', 'aerial', 'surveillance', 'sih', 'skyguard', 'computer vision', 'project', 'projects', 'repo'] },
  { title: 'Artifex.ai', type: 'Project', url: 'https://github.com/muditagrawal-alt/Artifex.ai',
    action: 'open_project:Artifex',
    text: 'Generative AI text-to-image chatbot utilizing Stable Diffusion v1.5 with Gradio UI and prompt history sidebar.',
    tags: ['generative ai', 'stable diffusion', 'artifex', 'image generation', 'gradio', 'project', 'projects', 'repo'] },

  ...(window.PROFILE_DATA?.experience || []).map(e => ({
    title: `${e.role} — ${e.org}`,
    type: 'Experience',
    url: null,
    action: 'open_finder:experience',
    text: `${e.dates}. ${e.role} at ${e.org}.`,
    tags: ['experience', 'internship', 'work', 'job', ...e.org.toLowerCase().split(/[\s,()]+/).filter(Boolean)]
  })),
  { title: window.PROFILE_DATA?.education?.degree || 'B.Tech in Computer Science (AI/ML)', type: 'Education', url: null,
    action: 'open_finder:education',
    text: `${window.PROFILE_DATA?.education?.university || 'IILM University'}. ${window.PROFILE_DATA?.education?.years || '2023–2027'}. CGPA ${window.PROFILE_DATA?.education?.cgpa || ''}.`, 
    tags: ['education', 'iilm', 'university', 'btech', 'degree', 'cgpa', 'college'] },
  { title: 'Contact Information', type: 'Contact', url: `mailto:${window.PROFILE_DATA?.contact?.email || 'muditagrawal03@gmail.com'}`,
    action: 'open_finder:contact',
    text: `Email ${window.PROFILE_DATA?.contact?.email || ''} • Phone ${window.PROFILE_DATA?.contact?.phone || ''} • LinkedIn: ${window.PROFILE_DATA?.contact?.linkedin || ''} • GitHub: ${window.PROFILE_DATA?.contact?.github || ''}`, 
    tags: ['contact', 'email', 'linkedin', 'phone', 'reach out', 'hire', 'call'] },
  { title: `${window.PROFILE_DATA?.name || 'Mudit Agrawal'} — Technical Skills & Stacks`, type: 'Skills', url: null,
    action: 'open_finder:skills',
    text: 'Programming (Python, Java, C, SQL), Frameworks (LangChain, PyTorch, TensorFlow, Scikit-Learn, OpenCV, FastAPI), Models (YOLOv8/11/26, Whisper, Mistral-7B, BLIP, XTTS, BGE-M3), Databases (PostgreSQL, ChromaDB, Qdrant), Evaluation (RAGAS, TruLens), Tools (Docker, Git, Ollama, Spark, Airflow).', 
    tags: ['skills', 'stack', 'python', 'java', 'c', 'sql', 'langchain', 'pytorch', 'tensorflow', 'opencv', 'fastapi', 'yolo', 'whisper', 'mistral', 'blip', 'chromadb', 'ragas', 'docker', 'git', 'ollama'] },
  { title: `${window.PROFILE_DATA?.name || 'Mudit Agrawal'} — Portfolio Bio & About`, type: 'About', url: null,
    action: 'open_finder:about',
    text: window.PROFILE_DATA?.bio || 'Computer Science Undergraduate (AI/ML) at IILM University.', 
    tags: ['about', 'bio', 'mudit', 'profile'] }
];

const STOP_WORDS = new Set(['what', 'are', 'is', 'the', 'of', 'in', 'and', 'for', 'to', 'a', 'an', 'tell', 'me', 'about', 'his', 'best', 'some', 'can', 'you', 'give', 'how', 'do', 'does', 'show']);

/**
 * Ranked substring search over the corpus.
 * @param {string} query
 * @param {{minScore?:number, limit?:number}} opts
 * @returns {Array} matching corpus entries, best first
 */
function searchPortfolioCorpus(query, opts = {}) {
    const { minScore = 2, limit = 5 } = opts;
    const q = (query || '').toLowerCase().trim();
    if (!q) return [];

    // Filter stopwords, keeping meaningful terms (including 2-char like "ai", "cv", "ml", "c")
    let rawTerms = q.split(/\s+/).map(t => t.replace(/[^a-z0-9#+.-]/g, '')).filter(Boolean);
    let terms = rawTerms.filter(t => !STOP_WORDS.has(t) && t.length >= 2);
    
    // If all words were stopwords, fallback to raw terms
    if (terms.length === 0) {
        terms = rawTerms.filter(t => t.length >= 2);
    }
    if (terms.length === 0) return [];

    // Intent expansion: if user query mentions "project", "repo", "built", boost projects
    const isProjectQuery = rawTerms.some(t => /^(project|projects|repo|repos|built|apps?|code)$/.test(t));

    return window.PORTFOLIO_CORPUS
        .map(entry => {
            const titleLower = entry.title.toLowerCase();
            const haystack = `${entry.title} ${entry.text} ${entry.tags.join(' ')}`.toLowerCase();
            let score = 0;

            if (isProjectQuery && entry.type === 'Project') {
                score += 4;
            }

            terms.forEach(term => {
                if (titleLower.includes(term)) score += 5;
                if (entry.tags.some(t => t.includes(term))) score += 3;
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
