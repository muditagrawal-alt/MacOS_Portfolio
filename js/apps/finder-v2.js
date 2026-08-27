/* ==========================================================================
   Finder v2 Controller — Matching Aakash Portfolio Finder Exactly
   Icons Grid, List Table, Cascading Columns, Sidebar Navigation & Mock FS
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
        icon: 'assets/icons/folder-home.png',
        items: ['desktop', 'documents', 'downloads', 'pictures', 'projects-folder', 'experience-folder', 'education-folder', 'skills-folder']
    },
    'desktop': {
        id: 'desktop',
        name: 'Desktop',
        kind: 'folder',
        icon: 'assets/icons/folder-generic.png',
        items: ['readme', 'notes-txt', 'resume-pdf', 'contact-card']
    },
    'documents': {
        id: 'documents',
        name: 'Documents',
        kind: 'folder',
        icon: 'assets/icons/folder-generic.png',
        items: ['resume-pdf', 'cover-letter', 'transcript-doc', 'projects-folder']
    },
    'downloads': {
        id: 'downloads',
        name: 'Downloads',
        kind: 'folder',
        icon: 'assets/icons/folder-generic.png',
        items: ['resume-pdf', 'wallpaper-tahoe', 'source-zip']
    },
    'pictures': {
        id: 'pictures',
        name: 'Pictures',
        kind: 'folder',
        icon: 'assets/icons/folder-generic.png',
        items: ['profile-pic', 'wallpaper-tahoe']
    },
    'music': {
        id: 'music',
        name: 'Music',
        kind: 'folder',
        icon: 'assets/icons/folder-generic.png',
        items: ['multiva-voice', 'ambient-tune']
    },
    'projects-folder': {
        id: 'projects-folder',
        name: 'Projects',
        kind: 'folder',
        icon: 'assets/icons/folder-dock.png',
        items: ['proj-omnidoc', 'proj-sliver', 'proj-sword', 'proj-deepfake', 'proj-helix', 'proj-multiva', 'proj-inflx', 'proj-artifex']
    },
    'experience-folder': {
        id: 'experience-folder',
        name: 'Experience',
        kind: 'folder',
        icon: 'assets/icons/folder-generic.png',
        items: expKeys
    },
    'education-folder': {
        id: 'education-folder',
        name: 'Education',
        kind: 'folder',
        icon: 'assets/icons/folder-generic.png',
        items: ['edu-btech', 'edu-12', 'edu-10', 'cert-ml', 'cert-py', 'cert-del', 'cert-java']
    },
    'skills-folder': {
        id: 'skills-folder',
        name: 'Skills',
        kind: 'folder',
        icon: 'assets/icons/folder-generic.png',
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
        icon: 'assets/icons/folder-generic.png',
        items: ['proj-omnidoc', 'resume-pdf', expKeys[0] || 'exp-0', 'proj-sliver', 'notes-txt']
    },
    'trash': {
        id: 'trash',
        name: 'Trash',
        kind: 'folder',
        icon: 'assets/icons/trash.png',
        items: ['old-draft', 'deprecated-code']
    }
};

// ── File & Folder Items Definition ──
const FS_ITEMS = {
    'desktop': { id: 'desktop', name: 'Desktop', kind: 'folder', icon: 'assets/icons/folder-generic.png', date: 'Today', size: '4 items', targetFolder: 'desktop' },
    'documents': { id: 'documents', name: 'Documents', kind: 'folder', icon: 'assets/icons/folder-generic.png', date: 'Today', size: '4 items', targetFolder: 'documents' },
    'downloads': { id: 'downloads', name: 'Downloads', kind: 'folder', icon: 'assets/icons/folder-generic.png', date: 'Yesterday', size: '3 items', targetFolder: 'downloads' },
    'pictures': { id: 'pictures', name: 'Pictures', kind: 'folder', icon: 'assets/icons/folder-generic.png', date: 'Jun 3', size: '2 items', targetFolder: 'pictures' },
    'projects-folder': { id: 'projects-folder', name: 'Projects', kind: 'folder', icon: 'assets/icons/folder-dock.png', date: 'Today', size: '8 items', targetFolder: 'projects-folder' },
    'experience-folder': { id: 'experience-folder', name: 'Experience', kind: 'folder', icon: 'assets/icons/folder-generic.png', date: 'Today', size: `${expKeys.length} items`, targetFolder: 'experience-folder' },
    'education-folder': { id: 'education-folder', name: 'Education', kind: 'folder', icon: 'assets/icons/folder-generic.png', date: 'May 2026', size: '7 items', targetFolder: 'education-folder' },
    'skills-folder': { id: 'skills-folder', name: 'Skills', kind: 'folder', icon: 'assets/icons/folder-generic.png', date: 'Aug 2026', size: '6 items', targetFolder: 'skills-folder' },
    
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
    'proj-omnidoc': {
        id: 'proj-omnidoc', name: 'OmniDoc', kind: 'Python Project', ext: 'py',
        icon: 'assets/icons/filetype-project.svg', date: 'Jan 2026', size: '24 MB',
        link: 'https://github.com/muditagrawal-alt/OmniDoc',
        preview: {
            title: 'OmniDoc', subtitle: 'Multimodal RAG Document Intelligence',
            desc: 'Built using Mistral-7B, Nomic embeddings, and BLIP for grounded visual QA and semantic search across complex PDFs.'
        }
    },
    'proj-sliver': {
        id: 'proj-sliver', name: 'Sliver.Ai', kind: 'Python Project', ext: 'py',
        icon: 'assets/icons/filetype-project.svg', date: 'Jan 2026', size: '18 MB',
        link: 'https://github.com/muditagrawal-alt/Sliver-Smart-Video-Clipping-Tool',
        preview: {
            title: 'Sliver.Ai', subtitle: 'Smart Video Clipping Tool',
            desc: 'Automated video highlight pipeline leveraging YOLOv8n, YOLO11m, facial emotion recognition, and FFmpeg chunking.'
        }
    },
    'proj-sword': {
        id: 'proj-sword', name: 'Project S.W.O.R.D', kind: 'Deep Learning System', ext: 'py',
        icon: 'assets/icons/filetype-project.svg', date: 'Dec 2025', size: '42 MB',
        link: 'https://github.com/muditagrawal-alt/Project-S.W.O.R.D',
        preview: {
            title: 'Project S.W.O.R.D', subtitle: 'Real-Time Weapon Surveillance System',
            desc: 'Surveillance for Weapon Observation using real-time YOLOv8 deep learning detection models for high-threat defense monitoring.'
        }
    },
    'proj-deepfake': {
        id: 'proj-deepfake', name: 'Deepfake Detector', kind: 'ML Model', ext: 'py',
        icon: 'assets/icons/filetype-project.svg', date: 'Nov 2025', size: '36 MB',
        link: 'https://github.com/muditagrawal-alt/Deepfake-and-Fake-News-Detector',
        preview: {
            title: 'Deepfake Detector', subtitle: 'Media Forensics & Fake News Detector',
            desc: 'Machine learning system designed to detect facial manipulation signals, deepfake artifacts, and misinformation patterns.'
        }
    },
    'proj-helix': {
        id: 'proj-helix', name: 'Helix-Compiler', kind: 'C System', ext: 'c',
        icon: 'assets/icons/filetype-project.svg', date: 'Oct 2025', size: '840 KB',
        link: 'https://github.com/muditagrawal-alt/Helix-Compiler',
        preview: {
            title: 'Helix-Compiler', subtitle: 'C-Based Language Compiler',
            desc: 'Systems project implementing lexical analysis, AST parsing, symbol tables, intermediate representation, and machine translation.'
        }
    },
    'proj-multiva': {
        id: 'proj-multiva', name: 'Multiva.Ai', kind: 'Speech Synthesis System', ext: 'py',
        icon: 'assets/icons/filetype-project.svg', date: 'Oct 2025', size: '65 MB',
        link: 'https://github.com/muditagrawal-alt/Multiva.Ai',
        preview: {
            title: 'Multiva.Ai', subtitle: 'Multilingual AI Voice Cloning',
            desc: 'Voice cloning and real-time audio translation platform built with Whisper, Coqui XTTS, and FB-NLLB.'
        }
    },
    'proj-inflx': {
        id: 'proj-inflx', name: 'Inflx AutoStream', kind: 'AI Agent Service', ext: 'py',
        icon: 'assets/icons/filetype-project.svg', date: 'Sep 2025', size: '12 MB',
        link: 'https://github.com/muditagrawal-alt/iNFLX-AutoStream-Agent-ServiceHive-',
        preview: {
            title: 'Inflx AutoStream', subtitle: 'Workflow & Streaming Automation Agent',
            desc: 'Autonomous agent service orchestrating intelligent workflow automation and streaming media processing.'
        }
    },
    'proj-artifex': {
        id: 'proj-artifex', name: 'Artifex', kind: 'Generative AI Platform', ext: 'py',
        icon: 'assets/icons/filetype-project.svg', date: 'Sep 2025', size: '15 MB',
        link: 'https://github.com/muditagrawal-alt/Artifex.ai',
        preview: {
            title: 'Artifex', subtitle: 'Creative AI Design Experiments',
            desc: 'Interactive generative design platform exploring neural style transfer and algorithmic creativity.'
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
        link: 'https://www.instagram.com',
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

    // ── Trash Items ──
    'old-draft': { id: 'old-draft', name: 'OldPortfolio_v0.html', kind: 'HTML File', ext: 'html', icon: 'assets/icons/filetype-html.svg', date: 'May 2025', size: '12 KB', preview: { title: 'OldPortfolio_v0.html', subtitle: 'Deprecated Legacy Prototype', desc: 'Old portfolio draft from previous semester.' } },
    'deprecated-code': { id: 'deprecated-code', name: 'test_script.py', kind: 'Python File', ext: 'py', icon: 'assets/icons/filetype-py.svg', date: 'Apr 2025', size: '4 KB', preview: { title: 'test_script.py', subtitle: 'Scratch Script', desc: 'Temporary test script.' } }
};

// ── State Variables ──
let currentFinderFolder = 'home';
let finderHistory = ['home'];
let finderHistoryIndex = 0;
let currentFinderView = 'icons'; // 'icons' | 'list' | 'columns'
let selectedFinderItem = null;
let finderColumnStack = ['home'];

// ── Initialization ──
function initFinderV2() {
    renderFinder();
}

// ── Navigation ──
function navigateFinderFolder(folderId, addToHistory = true, fromSidebar = false) {
    if (!AAKASH_STYLE_FS[folderId]) return;

    if (!fromSidebar) {
        const folderAliases = {
            'projects-folder': 'projects', 'experience-folder': 'experience',
            'education-folder': 'education', 'skills-folder': 'skills'
        };
        activeSidebarTarget = folderAliases[folderId] || folderId;
    }
    currentFinderFolder = folderId;
    selectedFinderItem = null;

    if (addToHistory) {
        if (finderHistoryIndex < finderHistory.length - 1) {
            finderHistory = finderHistory.slice(0, finderHistoryIndex + 1);
        }
        finderHistory.push(folderId);
        finderHistoryIndex = finderHistory.length - 1;
    }

    // Reset column stack starting with this folder
    finderColumnStack = [folderId];

    renderFinder();
}

function finderGoBack() {
    if (finderHistoryIndex > 0) {
        finderHistoryIndex--;
        navigateFinderFolder(finderHistory[finderHistoryIndex], false);
    }
}

function finderGoForward() {
    if (finderHistoryIndex < finderHistory.length - 1) {
        finderHistoryIndex++;
        navigateFinderFolder(finderHistory[finderHistoryIndex], false);
    }
}

function setFinderViewMode(mode) {
    currentFinderView = mode;
    document.querySelectorAll('.finder-view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === mode);
    });
    renderFinderContent();
}

// ── Sidebar Click ──
let activeSidebarTarget = 'home';

function finderSidebarNav(folderId) {
    activeSidebarTarget = folderId;
    // Map custom sidebar aliases
    // Sidebar key -> folder in the mock filesystem. Rows like AirDrop and
    // Network have no folder of their own, so they land somewhere sensible
    // while still keeping their own row highlighted.
    const aliasMap = {
        'about': 'home',
        'mudit': 'home',
        'experience': 'experience-folder',
        'education': 'education-folder',
        'projects': 'projects-folder',
        'skills': 'skills-folder',
        'shared': 'home',
        'macintosh-hd': 'home',
        'airdrop': 'home',
        'icloud-drive': 'documents'
    };

    const target = aliasMap[folderId] || folderId;
    // Unknown key: keep the highlight where the visitor clicked, show home.
    navigateFinderFolder(AAKASH_STYLE_FS[target] ? target : 'home', true, true);
}

// ── Master Render Function ──
function renderFinder() {
    updateFinderHeader();
    updateFinderSidebarActive();
    renderFinderContent();
    updateFinderBottomBar();
}

function updateFinderHeader() {
    const folder = AAKASH_STYLE_FS[currentFinderFolder] || AAKASH_STYLE_FS['home'];
    const titleEl = document.getElementById('finder-title-text');
    const iconEl = document.getElementById('finder-title-icon');
    const backBtn = document.getElementById('finder-btn-back');
    const fwdBtn = document.getElementById('finder-btn-forward');

    if (titleEl) titleEl.textContent = folder.name;
    if (iconEl) iconEl.src = folder.icon;

    if (backBtn) backBtn.disabled = finderHistoryIndex <= 0;
    if (fwdBtn) fwdBtn.disabled = finderHistoryIndex >= finderHistory.length - 1;
}

function updateFinderSidebarActive() {
    // Highlight what the visitor actually clicked. Several rows (AirDrop,
    // Network, iCloud Drive, Macintosh HD) all resolve to 'home', so matching
    // on the resolved folder lit up "Mudit" no matter which one you picked.
    const folderAliases = {
        'projects-folder': 'projects', 'experience-folder': 'experience',
        'education-folder': 'education', 'skills-folder': 'skills'
    };
    const fallback = folderAliases[currentFinderFolder] || currentFinderFolder;

    document.querySelectorAll('.sidebar-v2-item').forEach(item => {
        const target = item.getAttribute('data-target');
        item.classList.toggle('active', target === activeSidebarTarget || (!activeSidebarTarget && target === fallback));
    });
}

function renderFinderContent() {
    const container = document.getElementById('finder-content-viewport');
    if (!container) return;

    const folder = AAKASH_STYLE_FS[currentFinderFolder] || AAKASH_STYLE_FS['home'];
    const itemIds = folder.items || [];
    const items = itemIds.map(id => FS_ITEMS[id]).filter(Boolean);

    if (currentFinderView === 'icons') {
        renderIconsView(container, items);
    } else if (currentFinderView === 'list') {
        renderListView(container, items);
    } else if (currentFinderView === 'columns') {
        renderColumnsView(container);
    }
}

// ── 1. Icons Grid View ──
function renderIconsView(container, items) {
    container.innerHTML = `
        <div class="finder-view-icons" id="finder-icons-grid">
            ${items.map(item => `
                <div class="finder-grid-item ${selectedFinderItem === item.id ? 'selected' : ''}"
                     data-item-id="${item.id}" tabindex="0" role="button"
                     onclick="selectFinderItem('${item.id}', event)"
                     onkeydown="if(event.key==='Enter'){handleFinderItemOpen('${item.id}')}"
                     ondblclick="handleFinderItemOpen('${item.id}')">
                    <div class="finder-grid-icon">
                        <img src="${item.icon}" alt="${item.name}">
                    </div>
                    <span class="finder-grid-name">${item.name}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// ── 2. List Table View ──
function renderListView(container, items) {
    container.innerHTML = `
        <div class="finder-view-list">
            <div class="finder-list-table-header">
                <span class="col-name">Name</span>
                <span class="col-date">Date Modified</span>
                <span class="col-size">Size</span>
                <span class="col-kind">Kind</span>
            </div>
            <div class="finder-list-table-body">
                ${items.map(item => `
                    <div class="finder-list-item-row ${selectedFinderItem === item.id ? 'selected' : ''}"
                         data-item-id="${item.id}" tabindex="0" role="button"
                         onclick="selectFinderItem('${item.id}', event)"
                         onkeydown="if(event.key==='Enter'){handleFinderItemOpen('${item.id}')}"
                         ondblclick="handleFinderItemOpen('${item.id}')">
                        <span class="col-name">
                            <img src="${item.icon}" alt="${item.name}">
                            ${item.name}
                        </span>
                        <span class="col-date">${item.date || '—'}</span>
                        <span class="col-size">${item.size || '—'}</span>
                        <span class="col-kind">${item.kind || '—'}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ── 3. Cascading Columns View ──
function renderColumnsView(container) {
    let columnsHtml = `<div class="finder-view-columns" id="finder-columns-container">`;

    // Render each column in the column stack
    finderColumnStack.forEach((folderId, depth) => {
        const folder = AAKASH_STYLE_FS[folderId];
        if (!folder) return;
        const itemIds = folder.items || [];
        const items = itemIds.map(id => FS_ITEMS[id]).filter(Boolean);
        const activeChildId = finderColumnStack[depth + 1] || selectedFinderItem;

        columnsHtml += `
            <div class="finder-column-pane">
                ${items.map(item => {
                    const isRowActive = activeChildId === item.id || activeChildId === item.targetFolder;
                    return `
                        <div class="finder-column-row ${isRowActive ? 'active' : ''}"
                             onclick="handleColumnRowClick('${folderId}', '${item.id}', ${depth})">
                            <div class="finder-column-row-left">
                                <img src="${item.icon}" alt="${item.name}">
                                <span>${item.name}</span>
                            </div>
                            ${item.kind === 'folder' ? '<i class="fas fa-chevron-right col-arrow"></i>' : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    });

    // Render Inspector Preview on the right if a file is selected
    const selectedItemObj = FS_ITEMS[selectedFinderItem];
    if (selectedItemObj) {
        columnsHtml += `
            <div class="finder-column-inspector">
                <div class="inspector-preview-icon">
                    <img src="${selectedItemObj.icon}" alt="${selectedItemObj.name}">
                </div>
                <div class="inspector-title">${selectedItemObj.name}</div>
                <div class="inspector-kind">${selectedItemObj.kind} • ${selectedItemObj.size || '—'}</div>
                
                <div class="inspector-meta-box">
                    <div class="inspector-meta-row"><span class="label">Modified:</span> <span class="val">${selectedItemObj.date || '—'}</span></div>
                    <div class="inspector-meta-row"><span class="label">Kind:</span> <span class="val">${selectedItemObj.kind || '—'}</span></div>
                    <div class="inspector-meta-row"><span class="label">Size:</span> <span class="val">${selectedItemObj.size || '—'}</span></div>
                </div>

                ${selectedItemObj.preview ? `
                    <div class="inspector-description">${selectedItemObj.preview.desc || ''}</div>
                ` : ''}

                ${selectedItemObj.link ? `
                    <a href="${selectedItemObj.link}" target="_blank" rel="noopener noreferrer" class="inspector-action-btn">Open on GitHub ↗</a>
                ` : ''}
                ${selectedItemObj.action ? `
                    <button class="inspector-action-btn" onclick="${selectedItemObj.action}">Open Document</button>
                ` : ''}
            </div>
        `;
    }

    columnsHtml += `</div>`;
    container.innerHTML = columnsHtml;

    // Scroll to rightmost column
    const colContainer = document.getElementById('finder-columns-container');
    if (colContainer) colContainer.scrollLeft = colContainer.scrollWidth;
}

function handleColumnRowClick(parentFolderId, itemId, depth) {
    const item = FS_ITEMS[itemId];
    if (!item) return;

    // Truncate column stack to this depth
    finderColumnStack = finderColumnStack.slice(0, depth + 1);

    if (item.kind === 'folder' && item.targetFolder) {
        finderColumnStack.push(item.targetFolder);
        selectedFinderItem = item.targetFolder;
    } else {
        selectedFinderItem = item.id;
    }

    renderFinderContent();
}

// ── Selection & Open Handlers ──
function selectFinderItem(itemId, event) {
    if (event) event.stopPropagation();
    selectedFinderItem = itemId;

    // Toggle classes in place. Re-rendering the whole viewport on every click
    // replaced the node mid-gesture, made double-click unreliable and threw
    // away the scroll position.
    document.querySelectorAll('#finder-content-viewport [data-item-id]')
        .forEach(el => el.classList.toggle('selected', el.dataset.itemId === itemId));

    // The columns inspector is derived from the selection, so it still needs
    // a repaint — but only that one view.
    if (currentFinderView === 'columns') renderFinderContent();
}

function handleFinderItemOpen(itemId) {
    const item = FS_ITEMS[itemId];
    if (!item) return;

    if (item.kind === 'folder' && item.targetFolder) {
        navigateFinderFolder(item.targetFolder);
    } else if (item.action) {
        // Declarative dispatch instead of eval() on a data string.
        runFinderAction(item.action);
    } else if (item.link) {
        openExternal(item.link);
    } else if (item.preview) {
        // Everything else opens in Quick Look rather than doing nothing.
        openFinderItemPreview(item);
    }
}

/** Whitelisted actions a filesystem item may trigger. */
const FINDER_ACTIONS = {
    'openResumeWindow()':          () => openResumeWindow(),
    'openWindow(\'notes-window\')':  () => openWindow('notes-window'),
    'openWindow(\'mail-window\')':   () => openWindow('mail-window'),
    'openWindow(\'terminal-window\')': () => openWindow('terminal-window'),
    'openWindow(\'appstore-window\')': () => openWindow('appstore-window'),
    'openWindow(\'settings-window\')': () => openWindow('settings-window'),
    'openWindow(\'trash-window\')':  () => openWindow('trash-window')
};

function runFinderAction(action) {
    const fn = FINDER_ACTIONS[action];
    if (fn) { fn(); return; }
    console.warn('Finder: unrecognised action', action);
}

/** Opens a filesystem item's preview blob in the Quick Look overlay. */
function openFinderItemPreview(item) {
    if (typeof openQuickLookData !== 'function' || !item.preview) return;
    openQuickLookData({
        title: item.name,
        icon: 'fas fa-file-alt',
        meta: `${item.kind || 'Document'}${item.size ? ' — ' + item.size : ''}`,
        html: `<div class="ql-text-preview"><h2>${escapeHtml(item.preview.title || item.name)}</h2>`
            + `<h3>${escapeHtml(item.preview.subtitle || '')}</h3>`
            + `<p style="white-space:pre-line;">${escapeHtml(item.preview.desc || '')}</p></div>`
    });
}

// ── Bottom Bar ──
function updateFinderBottomBar() {
    const breadcrumbEl = document.getElementById('finder-breadcrumbs');
    const statusEl = document.getElementById('finder-status-text');

    if (breadcrumbEl) {
        breadcrumbEl.innerHTML = `
            <span class="finder-path-segment" onclick="navigateFinderFolder('home')">
                <i class="fas fa-hdd" style="font-size:10px;margin-right:2px;"></i> Macintosh HD
            </span>
            <span class="finder-path-sep">›</span>
            <span class="finder-path-segment" onclick="navigateFinderFolder('home')">Users</span>
            <span class="finder-path-sep">›</span>
            <span class="finder-path-segment" onclick="navigateFinderFolder('home')">Mudit</span>
            ${currentFinderFolder !== 'home' ? `
                <span class="finder-path-sep">›</span>
                <span class="finder-path-segment active">${(AAKASH_STYLE_FS[currentFinderFolder] || {}).name || ''}</span>
            ` : ''}
        `;
    }

    if (statusEl) {
        const folder = AAKASH_STYLE_FS[currentFinderFolder] || AAKASH_STYLE_FS['home'];
        const count = (folder.items || []).length;
        statusEl.textContent = `${count} item${count !== 1 ? 's' : ''}, 128.4 GB available`;
    }
}

// ── Search Filter ──
function filterFinderSearch(query) {
    const container = document.getElementById('finder-content-viewport');
    if (!container) return;

    if (!query) {
        renderFinder();
        return;
    }

    const q = query.toLowerCase();
    const matches = Object.values(FS_ITEMS).filter(it => it.name.toLowerCase().includes(q));

    if (matches.length === 0) {
        // Previously this rendered an empty pane with no explanation.
        container.innerHTML = `
            <div class="finder-empty-state">
                <i class="fas fa-magnifying-glass"></i>
                <h3>No Results</h3>
                <p>Nothing here matches &ldquo;${escapeHtml(query)}&rdquo;.</p>
            </div>`;
    } else if (currentFinderView === 'list') {
        renderListView(container, matches);
    } else {
        // Columns view can't express a flat result set — fall back to icons
        // AND move the segmented control so the UI doesn't lie about the mode.
        if (currentFinderView === 'columns') setFinderViewMode('icons');
        renderIconsView(container, matches);
    }

    const statusEl = document.getElementById('finder-status-text');
    if (statusEl) statusEl.textContent = `${matches.length} result${matches.length !== 1 ? 's' : ''} for "${query}"`;
}

// ── Legacy Compatibility Layer ──
function openFinderPane(paneName) {
    openWindow('finder-window');
    finderSidebarNav(paneName);
}

function switchFinderPane(paneName) {
    finderSidebarNav(paneName);
}

// ── Initialize on DOM ready ──
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initFinderV2, 100);
});
