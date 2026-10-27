/* ==========================================================================
   Portfolio Filesystem — Single Source of Truth
   --------------------------------------------------------------------------
   The folders and files behind Finder on the Mac and the Projects / About /
   Notes apps on iPhone. Moved out of js/apps/finder-v2.js so both shells read
   the same data: edit a project here once and it updates everywhere.
   ========================================================================== */

// ── Mock Filesystem Data Structure ──
const pData = window.PROFILE_DATA || {};
const expKeys = (pData.experience && pData.experience.length > 0)
    ? pData.experience.map((_, i) => `exp-${i}`)
    : ['exp-0', 'exp-1', 'exp-2'];

const AAKASH_STYLE_FS = {
    // ── Favorites Root Categories ──
    'home': {
        id: 'home',
        name: (pData.name || 'Mudit').split(' ')[0],
        kind: 'folder',
        icon: 'assets/icons/folder-home-macos.svg',
        items: ['desktop', 'documents', 'downloads', 'pictures', 'projects-folder', 'experience-folder', 'education-folder', 'skills-folder']
    },
    // Mirrors window.DESKTOP_FILES — the Desktop folder used to list four
    // unrelated files that weren't on the desktop at all.
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
        items: ['resume-pdf', 'cover-letter', 'transcript-doc', 'projects-folder']
    },
    'downloads': {
        id: 'downloads',
        name: 'Downloads',
        kind: 'folder',
        icon: 'assets/icons/folder-downloads-macos.svg',
        items: ['resume-pdf', 'wallpaper-tahoe', 'source-zip']
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
        items: ['multiva-voice', 'ambient-tune']
    },
    'projects-folder': {
        id: 'projects-folder',
        name: 'Projects',
        kind: 'folder',
        icon: 'assets/icons/folder-projects-macos.svg',
        items: ['proj-vlm', 'proj-slam', 'proj-omnidoc', 'proj-sliver', 'proj-sword', 'proj-deepfake', 'proj-helix', 'proj-multiva', 'proj-skyguard', 'proj-artifex']
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
        items: ['edu-btech', 'edu-12', 'edu-10', 'cert-ml', 'cert-py', 'cert-del', 'cert-java']
    },
    'skills-folder': {
        id: 'skills-folder',
        name: 'Skills',
        kind: 'folder',
        icon: 'assets/icons/folder-skills-macos.svg',
        items: ['skill-prog', 'skill-fw', 'skill-models', 'skill-db', 'skill-eval', 'skill-tools']
    },
    'network': {
        id: 'network',
        name: 'Network',
        kind: 'folder',
        icon: 'assets/icons/sf-icons/network.svg',
        items: ['net-github', 'net-linkedin', 'net-huggingface', 'net-medium',
                'net-substack', 'net-x', 'net-instagram', 'net-leetcode']
    },
    'recents': {
        id: 'recents',
        name: 'Recents',
        kind: 'folder',
        icon: 'assets/icons/folder-macos.svg',
        items: ['proj-omnidoc', 'resume-pdf', expKeys[0] || 'exp-0', 'proj-sliver', 'notes-txt']
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

// ── File & Folder Items Definition ──
const FS_ITEMS = {
    'desktop': { id: 'desktop', name: 'Desktop', kind: 'folder', icon: 'assets/icons/folder-desktop-macos.svg', date: 'Today', size: `${(window.DESKTOP_FILES || []).length} items`, targetFolder: 'desktop' },
    'documents': { id: 'documents', name: 'Documents', kind: 'folder', icon: 'assets/icons/folder-documents-macos.svg', date: 'Today', size: '4 items', targetFolder: 'documents' },
    'downloads': { id: 'downloads', name: 'Downloads', kind: 'folder', icon: 'assets/icons/folder-downloads-macos.svg', date: 'Yesterday', size: '3 items', targetFolder: 'downloads' },
    'pictures': { id: 'pictures', name: 'Pictures', kind: 'folder', icon: 'assets/icons/folder-pictures-macos.svg', date: 'Jun 3', size: '2 items', targetFolder: 'pictures' },
    'projects-folder': { id: 'projects-folder', name: 'Projects', kind: 'folder', icon: 'assets/icons/folder-projects-macos.svg', date: 'Today', size: '10 items', targetFolder: 'projects-folder' },
    'experience-folder': { id: 'experience-folder', name: 'Experience', kind: 'folder', icon: 'assets/icons/folder-experience-macos.svg', date: 'Today', size: `${expKeys.length} items`, targetFolder: 'experience-folder' },
    'education-folder': { id: 'education-folder', name: 'Education', kind: 'folder', icon: 'assets/icons/folder-education-macos.svg', date: 'May 2026', size: '7 items', targetFolder: 'education-folder' },
    'skills-folder': { id: 'skills-folder', name: 'Skills', kind: 'folder', icon: 'assets/icons/folder-skills-macos.svg', date: 'Aug 2026', size: '6 items', targetFolder: 'skills-folder' },
    
    // Files
    'readme': {
        id: 'readme', name: 'README.md', kind: 'Markdown Document', ext: 'md',
        icon: 'assets/icons/filetype-md.svg', date: 'Today', size: '2.4 KB',
        preview: {
            title: 'README.md', subtitle: `${pData.name || 'Mudit Agrawal'} — Portfolio Overview`,
            desc: pData.bio || 'Computer Science Undergraduate (AI/ML) at IILM University.'
        }
    },
    'notes-txt': {
        id: 'notes-txt', name: 'Philosophy.txt', kind: 'Plain Text Document', ext: 'txt',
        icon: 'assets/icons/filetype-txt.svg', date: 'Yesterday', size: '1.2 KB',
        preview: {
            title: 'Philosophy.txt', subtitle: 'Engineering Philosophy',
            desc: '• Context Awareness over hype\n• Robustness over laboratory accuracy\n• Speed of iteration: prototype fast, evaluate rigorously, refactor thoughtfully.'
        }
    },
    'resume-pdf': {
        id: 'resume-pdf', name: 'MuditAgrawalResumeAugust2026.pdf', kind: 'PDF Document', ext: 'pdf',
        icon: 'assets/icons/filetype-pdf.svg', date: 'Aug 22, 2026', size: '59 KB',
        action: 'openResumeWindow()',
        preview: {
            title: 'MuditAgrawalResumeAugust2026.pdf', subtitle: '59 KB • PDF Document',
            desc: `Complete curriculum vitae including ${pData.education?.degree || 'B.Tech AI/ML'} (CGPA ${pData.education?.cgpa || ''}), ${(pData.experience || []).map(e => e.org.split(' (')[0]).join(' & ')} internships, and featured projects.`
        }
    },
    'cover-letter': {
        id: 'cover-letter', name: 'CoverLetter.docx', kind: 'Word Document', ext: 'docx',
        icon: 'assets/icons/filetype-docx.svg', date: 'Aug 2026', size: '28 KB',
        preview: {
            title: 'CoverLetter.docx', subtitle: 'General Application Cover Letter',
            desc: 'Addressing engineering leaders and hiring teams for applied ML, Computer Vision, and Full-Stack Engineering roles.'
        }
    },
    'transcript-doc': {
        id: 'transcript-doc', name: 'Academic_Transcript.pdf', kind: 'PDF Document', ext: 'pdf',
        icon: 'assets/icons/filetype-pdf.svg', date: 'Jul 2026', size: '145 KB',
        preview: {
            title: 'Academic_Transcript.pdf', subtitle: `${pData.education?.university || 'IILM University'} Transcript`,
            desc: `Cumulative Grade Point Average: ${pData.education?.cgpa || ''} in ${pData.education?.degree || 'B.Tech Computer Science (AI/ML)'}.`
        }
    },
    'wallpaper-tahoe': {
        id: 'wallpaper-tahoe', name: '26-Tahoe-Beach-Day.jpg', kind: 'JPEG Image', ext: 'jpg',
        icon: 'assets/icons/photos.png', date: 'Today', size: '607 KB',
        src: 'assets/Wallpapers/26-Tahoe-Beach-Day.jpg',
        preview: {
            title: 'Tahoe Beach Day', subtitle: 'macOS Wallpaper • 6016 × 3384',
            desc: 'Original Apple 6K dynamic wallpaper asset for macOS.'
        }
    },
    'source-zip': {
        id: 'source-zip', name: 'portfolio-source.zip', kind: 'ZIP Archive', ext: 'zip',
        icon: 'assets/icons/filetype-zip.svg', date: 'Today', size: '3.2 MB',
        preview: {
            title: 'portfolio-source.zip', subtitle: 'macOS Portfolio Bundle',
            desc: 'Pure HTML, CSS, and Vanilla JavaScript implementation with zero external framework dependencies.'
        }
    },
    'profile-pic': {
        id: 'profile-pic', name: 'Professionalimage.jpeg', kind: 'JPEG Image', ext: 'jpeg',
        icon: 'assets/icons/photos.png', date: 'Jun 2026', size: '87 KB',
        src: 'assets/Professionalimage.jpeg',
        preview: {
            title: 'Professionalimage.jpeg', subtitle: 'Mudit Agrawal Avatar',
            desc: 'High-resolution profile photograph.'
        }
    },
    'contact-card': {
        id: 'contact-card', name: 'Contact Info.vcf', kind: 'Contact Card', ext: 'vcf',
        icon: 'assets/icons/mail.png', date: 'Today', size: '512 B',
        action: "openWindow('mail-window')",
        preview: {
            title: 'Mudit Agrawal', subtitle: 'Contact Information',
            desc: 'Email: muditagrawal03@gmail.com\nPhone: +91-7289887349\nLinkedIn: in/mudit-agrawal-167610318\nGitHub: muditagrawal-alt'
        }
    },
    'multiva-voice': {
        id: 'multiva-voice', name: 'VoiceClone_Sample.wav', kind: 'WAV Audio', ext: 'wav',
        icon: 'assets/icons/audio_Tahoe.png', date: 'Jun 1', size: '380 KB',
        preview: {
            title: 'VoiceClone_Sample.wav', subtitle: 'Multiva.Ai Audio Synthesis Demo',
            desc: 'Generated via Whisper, Coqui XTTS, and FB-NLLB neural translation pipeline.'
        }
    },
    'ambient-tune': {
        id: 'ambient-tune', name: 'ChillBeats.mp3', kind: 'MP3 Audio', ext: 'mp3',
        icon: 'assets/icons/audio_Tahoe.png', date: 'May 20', size: '3.5 MB',
        preview: {
            title: 'ChillBeats.mp3', subtitle: 'Coding Background Audio',
            desc: 'Lo-fi ambient background music track.'
        }
    },

    // ── Projects ──
    'proj-vlm': {
        id: 'proj-vlm', name: 'VLM Lead Extraction', kind: 'Vision AI Web App', ext: 'app',
        icon: 'assets/icons/app-vlm.svg', date: 'Recent', size: '28 MB',
        link: 'https://muditagrawal-lead-extraction.vercel.app',
        preview: {
            title: 'VLM Business Card Lead Extraction', subtitle: 'Live Deployed Web Application',
            desc: 'Bulk business-card lead extraction using vision-language models (Gemini & Qwen3-VL), structured field parsing, review drawer, and formatted Excel export.\n\n• Stack: FastAPI · React · PostgreSQL · Vercel · Oracle Cloud\n• Live App: muditagrawal-lead-extraction.vercel.app'
        }
    },
    'proj-slam': {
        id: 'proj-slam', name: 'Monocular SLAM', kind: 'Computer Vision System', ext: 'py',
        icon: 'assets/icons/app-slam.svg', date: 'Recent', size: '34 MB',
        link: 'https://github.com/muditagrawal-alt/Monocular_RGB_Sparse_Point_Cloud_SLAM',
        preview: {
            title: 'Monocular RGB Sparse Point Cloud SLAM', subtitle: 'Classical Multi-View Geometry',
            desc: 'Camera trajectory and a sparse 3D point cloud from a single-lens RGB video. Classical multi-view geometry, no neural network, no GPU: a 10s clip reconstructs in under 7s on CPU.'
        }
    },
    'proj-omnidoc': {
        id: 'proj-omnidoc', name: 'OmniDoc', kind: 'Multimodal RAG App', ext: 'app',
        icon: 'assets/icons/app-omnidoc.svg', date: 'Jan 2026', size: '24 MB',
        link: 'https://github.com/muditagrawal-alt/OmniDoc',
        preview: {
            title: 'OmniDoc', subtitle: 'Multimodal RAG Document Intelligence',
            desc: 'Built using Mistral-7B, Nomic embeddings, and BLIP for grounded visual QA and semantic search across complex PDFs.'
        }
    },
    'proj-sliver': {
        id: 'proj-sliver', name: 'Sliver.Ai', kind: 'Video AI App', ext: 'app',
        icon: 'assets/icons/app-sliver.svg', date: 'Jan 2026', size: '18 MB',
        link: 'https://github.com/muditagrawal-alt/Sliver-Smart-Video-Clipping-Tool',
        preview: {
            title: 'Sliver.Ai', subtitle: 'On-Device Video Summarization Engine',
            desc: 'On-device AI video summarization engine & smart highlight extractor using YOLO11m, YOLOv8-Face, and OpenAI CLIP with sample-accurate audio sync.'
        }
    },
    'proj-sword': {
        id: 'proj-sword', name: 'Project S.W.O.R.D', kind: 'Defense CV App', ext: 'app',
        icon: 'assets/icons/app-sword.svg', date: 'Dec 2025', size: '42 MB',
        link: 'https://github.com/muditagrawal-alt/Project-S.W.O.R.D',
        preview: {
            title: 'Project S.W.O.R.D', subtitle: 'Real-Time Weapon Surveillance System',
            desc: 'Surveillance for Weapon Observation using real-time YOLOv8 deep learning detection models for high-threat defense monitoring.'
        }
    },
    'proj-deepfake': {
        id: 'proj-deepfake', name: 'Veritas Check', kind: 'Media Forensics (Live)', ext: 'app',
        icon: 'assets/icons/app-veritas.svg', date: 'Nov 2025', size: '36 MB',
        link: 'https://veritas-check.vercel.app',
        preview: {
            title: 'Veritas Check / Deepfake Detector', subtitle: 'Live Deployed Web Application',
            desc: 'Checks whether a news link, image or short video is what it claims to be. Local forensics plus an LLM fact-check with verifiable sources.\n\n• Live App: veritas-check.vercel.app'
        }
    },
    'proj-helix': {
        id: 'proj-helix', name: 'Helix-Compiler', kind: 'Language Compiler (Live)', ext: 'app',
        icon: 'assets/icons/app-helix.svg', date: 'Oct 2025', size: '840 KB',
        link: 'https://huggingface.co/spaces/muditagrawal03/Helix-Compiler',
        preview: {
            title: 'Helix-Compiler', subtitle: 'Interactive Playground on Hugging Face',
            desc: 'Systems project implementing lexical analysis, AST parsing, symbol tables, intermediate representation, and machine translation with live web REPL.'
        }
    },
    'proj-multiva': {
        id: 'proj-multiva', name: 'Multiva.Ai', kind: 'Speech Dubbing App', ext: 'app',
        icon: 'assets/icons/app-multiva.svg', date: 'Oct 2025', size: '65 MB',
        link: 'https://github.com/muditagrawal-alt/Multiva.Ai',
        preview: {
            title: 'Multiva.Ai', subtitle: 'Offline Video Dubbing Studio',
            desc: 'Offline video dubbing for Indian languages. Keeps speaker\'s own voice and re-syncs lips: faster-whisper, NLLB-200, IndicF5 and Wav2Lip in a desktop studio.'
        }
    },
    'proj-skyguard': {
        id: 'proj-skyguard', name: 'Skyguard AI', kind: 'Defense CV System', ext: 'py',
        icon: 'assets/icons/app-skyguard.svg', date: '2026', size: '16 MB',
        link: 'https://github.com/muditagrawal-alt/Skyguard_AI_SIH2026',
        preview: {
            title: 'Skyguard AI (SIH 2026)', subtitle: 'Autonomous Aerial Defense Surveillance',
            desc: 'Smart aerial monitoring and autonomous surveillance computer vision pipeline engineered for Smart India Hackathon.'
        }
    },
    'proj-artifex': {
        id: 'proj-artifex', name: 'Artifex.ai', kind: 'Generative AI Platform', ext: 'py',
        icon: 'assets/icons/filetype-project.svg', date: 'Sep 2025', size: '15 MB',
        link: 'https://github.com/muditagrawal-alt/Artifex.ai',
        preview: {
            title: 'Artifex.ai', subtitle: 'Text-to-Image Chatbot',
            desc: 'Generative AI text-to-image chatbot utilizing Stable Diffusion v1.5 with Gradio UI and prompt history sidebar.'
        }
    },

    // ── Experience (Dynamically mapped from window.PROFILE_DATA) ──
    ...((function() {
        const expMap = {};
        (pData.experience || []).forEach((exp, idx) => {
            expMap[`exp-${idx}`] = {
                id: `exp-${idx}`,
                name: `${exp.role} @ ${exp.org.split(' (')[0]}`,
                kind: 'Experience Record',
                ext: 'md',
                icon: 'assets/icons/filetype-md.svg',
                date: exp.dates,
                size: '—',
                preview: {
                    title: exp.role,
                    subtitle: exp.org,
                    desc: `• Role: ${exp.role}\n• Organization: ${exp.org}\n• Duration: ${exp.dates}` + (exp.bullets ? '\n\nHighlights:\n' + exp.bullets.map(b => `– ${b}`).join('\n') : '')
                }
            };
        });
        return expMap;
    })()),

    // ── Education (Dynamically mapped from window.PROFILE_DATA) ──
    'edu-btech': {
        id: 'edu-btech',
        name: `${pData.education?.degree || 'B.Tech CSE (AI/ML)'} @ ${pData.education?.university?.split(' ')[0] || 'IILM'}`,
        kind: 'Degree',
        ext: 'pdf',
        icon: 'assets/icons/filetype-pdf.svg',
        date: pData.education?.years || '2023 - 2027',
        size: `CGPA ${pData.education?.cgpa || ''}`,
        preview: {
            title: pData.education?.degree || 'B.Tech Computer Science (AI/ML)',
            subtitle: pData.education?.university || 'IILM University',
            desc: `Current CGPA: ${pData.education?.cgpa || ''}\nUniversity: ${pData.education?.university || 'IILM University'}\nDuration: ${pData.education?.years || '2023 - 2027'}`
        }
    },
    'edu-12': { id: 'edu-12', name: 'Class 12 @ NCS Delhi', kind: 'Schooling', ext: 'pdf', icon: 'assets/icons/filetype-pdf.svg', date: '2023', size: '74%', preview: { title: 'Class 12 Senior Secondary', subtitle: 'Navy Children School, New Delhi', desc: 'CBSE Science Stream — 74%' } },
    'edu-10': { id: 'edu-10', name: 'Class 10 @ NCS Mumbai', kind: 'Schooling', ext: 'pdf', icon: 'assets/icons/filetype-pdf.svg', date: '2021', size: '89%', preview: { title: 'Class 10 Secondary Examination', subtitle: 'Navy Children School, Mumbai', desc: 'CBSE Board Examination — 89%' } },
    'cert-ml': { id: 'cert-ml', name: 'ML Specialization (Stanford)', kind: 'Certificate', ext: 'cert', icon: 'assets/icons/filetype-cert.svg', date: '2025', size: '—', preview: { title: 'Machine Learning Specialization', subtitle: 'Stanford University & DeepLearning.AI', desc: 'Supervised Learning, Neural Networks, Decision Trees, and Unsupervised Learning.' } },
    'cert-py': { id: 'cert-py', name: 'Python Specialisation (Michigan)', kind: 'Certificate', ext: 'cert', icon: 'assets/icons/filetype-cert.svg', date: '2025', size: '—', preview: { title: 'Python Specialisation', subtitle: 'University of Michigan', desc: 'Data Structures, Web Scraping, Databases, and Data Visualization.' } },
    'cert-del': { id: 'cert-del', name: 'Tech Job Simulation (Deloitte)', kind: 'Certificate', ext: 'cert', icon: 'assets/icons/filetype-cert.svg', date: '2025', size: '—', preview: { title: 'Technology Job Simulation', subtitle: 'Deloitte', desc: 'Software Engineering and Technology Consulting Simulation.' } },
    'cert-java': { id: 'cert-java', name: 'Java OOP (Duke)', kind: 'Certificate', ext: 'cert', icon: 'assets/icons/filetype-cert.svg', date: '2025', size: '—', preview: { title: 'Java Programming & OOP', subtitle: 'Duke University', desc: 'Object-Oriented Design, Algorithms, and Software Engineering Principles.' } },

    // ── Skills (Extracted from Resume) ──
    'skill-prog': { id: 'skill-prog', name: 'Programming Languages', kind: 'Skills Document', ext: 'txt', icon: 'assets/icons/filetype-txt.svg', date: 'Aug 2026', size: '4 items', preview: { title: 'Programming Languages', subtitle: 'Core Languages & Query', desc: 'Python, Java, C, SQL' } },
    'skill-fw': { id: 'skill-fw', name: 'Frameworks & Libraries', kind: 'Skills Document', ext: 'txt', icon: 'assets/icons/filetype-txt.svg', date: 'Aug 2026', size: '15 items', preview: { title: 'Frameworks & ML Libraries', subtitle: 'Deep Learning & Systems', desc: 'LangChain, PyTorch, TensorFlow, Keras, Scikit-Learn, OpenCV, NumPy, Pandas, Matplotlib, Docling, PySpark, FAISS, Flask, FastAPI, SQLAlchemy' } },
    'skill-models': { id: 'skill-models', name: 'AI Models & Architectures', kind: 'Skills Document', ext: 'txt', icon: 'assets/icons/filetype-txt.svg', date: 'Aug 2026', size: '13 items', preview: { title: 'AI & Foundation Models', subtitle: 'Vision, Audio, Embedding & LLM', desc: 'YOLOv8/11/26, Whisper (CTranslate2), Coqui XTTS, OpenVoice, BLIP, Mistral-7B, Gemma4, Qwen 2.5, Wav2Lip, FB-NLLB, BGE-M3 Embeddings, BGE-M3 ReRanker, SentenceTransformers' } },
    'skill-db': { id: 'skill-db', name: 'Databases & Vector Stores', kind: 'Skills Document', ext: 'txt', icon: 'assets/icons/filetype-txt.svg', date: 'Aug 2026', size: '6 items', preview: { title: 'Databases & Storage', subtitle: 'Relational, Document & Vector DBs', desc: 'PostgreSQL, ChromaDB, SQLite, Elasticsearch, Qdrant, MongoDB' } },
    'skill-eval': { id: 'skill-eval', name: 'Evaluation & Testing', kind: 'Skills Document', ext: 'txt', icon: 'assets/icons/filetype-txt.svg', date: 'Aug 2026', size: '6 items', preview: { title: 'Evaluation & Benchmarks', subtitle: 'RAG & System Validation', desc: 'RAGAS, TruLens, BIER, PyTest, CI/CD, InfoVQA' } },
    'skill-tools': { id: 'skill-tools', name: 'Developer Tools & Platforms', kind: 'Skills Document', ext: 'txt', icon: 'assets/icons/filetype-txt.svg', date: 'Aug 2026', size: '16 items', preview: { title: 'Tools, DevOps & Cloud', subtitle: 'Platforms, Pipelines & APIs', desc: 'Git, Docker, OAuth2.0, Cloudflare R2, Ollama, Groq, Google Calendar API, Gradio, Streamlit, Firebase, Supabase, Apache Airflow, Apache Spark, MistralOCR, FFmpeg, Claude' } },


    // ── Network: social profiles. Rendered as app tiles; opening one goes
    //    straight to that profile. ──
    'net-github': {
        id: 'net-github', name: 'GitHub', kind: 'Social Profile', ext: 'app',
        icon: 'assets/icons/social-github.svg', date: '—', size: '@muditagrawal-alt',
        link: 'https://github.com/muditagrawal-alt',
        preview: { title: 'GitHub', subtitle: '@muditagrawal-alt',
                   desc: 'Source for OmniDoc, Sliver.Ai, Project S.W.O.R.D, Helix-Compiler and more.' }
    },
    'net-linkedin': {
        id: 'net-linkedin', name: 'LinkedIn', kind: 'Social Profile', ext: 'app',
        icon: 'assets/icons/social-linkedin.svg', date: '—', size: 'mudit-agrawal',
        link: 'https://www.linkedin.com/in/mudit-agrawal-167610318',
        preview: { title: 'LinkedIn', subtitle: 'Professional Network',
                   desc: 'Experience, recommendations and professional updates.' }
    },
    'net-huggingface': {
        id: 'net-huggingface', name: 'Hugging Face', kind: 'Social Profile', ext: 'app',
        icon: 'assets/icons/social-huggingface.svg', date: '—', size: '@muditagrawal03',
        link: 'https://huggingface.co/muditagrawal03',
        preview: { title: 'Hugging Face', subtitle: '@muditagrawal03',
                   desc: 'Model checkpoints, Spaces and inference demos.' }
    },
    'net-medium': {
        id: 'net-medium', name: 'Medium', kind: 'Social Profile', ext: 'app',
        icon: 'assets/icons/social-medium.svg', date: '—', size: '@muditagrawal03',
        link: 'https://medium.com/@muditagrawal03',
        preview: { title: 'Medium', subtitle: 'Articles & Tutorials',
                   desc: 'Long-form writing on applied AI engineering.' }
    },
    'net-substack': {
        id: 'net-substack', name: 'Substack', kind: 'Social Profile', ext: 'app',
        icon: 'assets/icons/social-substack.svg', date: '—', size: '@standardissuemudit',
        link: 'https://substack.com/@standardissuemudit',
        preview: { title: 'Substack', subtitle: 'Tech & AI Newsletter',
                   desc: 'Deep dives on multimodal RAG and computer vision.' }
    },
    'net-x': {
        id: 'net-x', name: 'X', kind: 'Social Profile', ext: 'app',
        icon: 'assets/icons/social-x.svg', date: '—', size: '@muditag52751860',
        link: 'https://x.com/muditag52751860',
        preview: { title: 'X (Twitter)', subtitle: 'Updates & Threads',
                   desc: 'Paper takeaways and build-in-public progress.' }
    },
    'net-instagram': {
        id: 'net-instagram', name: 'Instagram', kind: 'Social Profile', ext: 'app',
        icon: 'assets/icons/social-instagram.svg', date: '—', size: '@muditagrawal_',
        link: 'https://www.instagram.com/muditagrawal_/',
        preview: { title: 'Instagram', subtitle: 'Behind the Scenes',
                   desc: 'Hackathons, campus life and lab snapshots.' }
    },
    'net-leetcode': {
        id: 'net-leetcode', name: 'LeetCode', kind: 'Social Profile', ext: 'app',
        icon: 'assets/icons/social-leetcode.svg', date: '—', size: '150+ solved',
        link: 'https://leetcode.com/u/muditagrawal03/',
        preview: { title: 'LeetCode', subtitle: 'Algorithms & Data Structures',
                   desc: '150+ problems across arrays, DP, graphs and trees.' }
    },

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

const APPSTORE_CATEGORIES = {
    ai: /\b(rag|llm|agent|language|nlp|generative|diffusion|chatbot|voice|speech|whisper|mistral|vlm|ai)\b/i,
    vision: /\b(vision|video|yolo|slam|image|camera|detection|deepfake|clipping|point cloud|cv)\b/i,
    systems: /\b(compiler|parser|ast|systems|c-based|lexical)\b/i,
    defense: /\b(defen[cs]e|weapon|surveillance|drone|airspace|navy|threat)\b/i
};

/** Every project, shaped for display (App Store on Mac, Projects on iPhone). */
// Display names for corpus tags ("fastapi" → "FastAPI"); anything else is title-cased.
const TAG_LABELS = { rag: 'RAG', llm: 'LLM', vlm: 'VLM', blip: 'BLIP', slam: 'SLAM', yolo: 'YOLO', cpu: 'CPU', '3d': '3D', ffmpeg: 'FFmpeg', fastapi: 'FastAPI', sih: 'SIH', wav2lip: 'Wav2Lip', 'generative ai': 'Generative AI' };
const prettyTag = t => TAG_LABELS[t] || t.replace(/\b[a-z]/g, c => c.toUpperCase());

function getPortfolioProjects() {
    const ids = (typeof AAKASH_STYLE_FS === 'object' && AAKASH_STYLE_FS['projects-folder']) ? AAKASH_STYLE_FS['projects-folder'].items : [];
    const corpus = window.PORTFOLIO_CORPUS || [];
    const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return ids.map(id => FS_ITEMS[id]).filter(Boolean).map(it => {
        const pv = it.preview || {};
        const c = corpus.find(x => x.type === 'Project' && (x.url === it.link || norm(x.title).includes(norm(it.name)) || norm(it.name).includes(norm(x.title))));
        const live = Boolean(it.link && !/github\.com/.test(it.link));
        const text = `${pv.title} ${pv.subtitle} ${pv.desc} ${c ? c.text + ' ' + (c.tags || []).join(' ') : ''}`;
        // Tags that just repeat the project's own name ("omnidoc", "sliver.ai") aren't a stack.
        const ownName = norm(`${it.name} ${pv.title}`);
        const stack = ((c && c.tags) || [])
            .filter(t => !/^(project|projects|repo|ai|ml|live app|deployed)$/i.test(t))
            .filter(t => norm(t).length < 4 || !ownName.includes(norm(t)))
            .slice(0, 8)
            .map(prettyTag);
        return {
            id: it.id, name: it.name, icon: it.icon, link: it.link, live,
            subtitle: pv.subtitle || it.kind, title: pv.title || it.name,
            desc: pv.desc || (c && c.text) || '', blurb: (c && c.text) || (pv.desc || '').split('\n')[0],
            stack, date: it.date,
            cats: Object.entries(APPSTORE_CATEGORIES).filter(([, re]) => re.test(text)).map(([k]) => k),
            search: text.toLowerCase()
        };
    });
}
