/* ==========================================================================
   Your portfolio's info bank — everything personal lives in this one file
   --------------------------------------------------------------------------
   Every app on both versions (Mac and iPhone) reads from here: Finder,
   Terminal, Mail, Safari, the App Store, Iris, Notes, Photos, the Lock and
   Home Screens… Edit it by hand, or run `npm run setup` for a guided
   questionnaire that rewrites it (and copies in your photo and résumé).

   Field reference: setup/README.md
   ========================================================================== */

window.PROFILE_DATA = {
  "name": "Mudit Agrawal",
  "pronouns": "he",
  "role": "AI/ML Engineer",
  "tagline": "AI/ML Engineer & Computer Science Undergraduate",
  "bio": "Computer Science Undergraduate (AI/ML) at IILM University, building applied AI systems that work reliably outside sandboxes — agentic pipelines, RAG systems, and computer vision.",
  "focus": "Agentic & RAG systems, computer vision",
  "location": "India",
  "lookingFor": "roles in applied ML, LLM systems and computer vision",
  "photo": "assets/Professionalimage.jpeg",
  "handle": "muditagrawal",
  "values": [
    "Context awareness — technology is only as good as the problem it solves.",
    "Robustness — systems should hold up outside clean sandbox environments.",
    "Speed of iteration — prototype quickly, evaluate rigorously, refactor thoughtfully."
  ],
  "contact": {
    "email": "muditagrawal03@gmail.com",
    "phone": "+91-7289887349",
    "linkedin": "https://www.linkedin.com/in/mudit-agrawal-167610318",
    "github": "https://github.com/muditagrawal-alt"
  },
  "socials": [
    {
      "network": "huggingface",
      "handle": "@muditagrawal03",
      "url": "https://huggingface.co/muditagrawal03",
      "blurb": "Model checkpoints, Spaces and inference demos."
    },
    {
      "network": "medium",
      "handle": "@muditagrawal03",
      "url": "https://medium.com/@muditagrawal03",
      "blurb": "Long-form writing on applied AI engineering."
    },
    {
      "network": "substack",
      "handle": "@standardissuemudit",
      "url": "https://substack.com/@standardissuemudit",
      "blurb": "Deep dives on multimodal RAG and computer vision."
    },
    {
      "network": "x",
      "handle": "@muditag52751860",
      "url": "https://x.com/muditag52751860",
      "blurb": "Paper takeaways and build-in-public progress."
    },
    {
      "network": "instagram",
      "handle": "@muditagrawal_",
      "url": "https://www.instagram.com/muditagrawal_/",
      "blurb": "Hackathons, campus life and lab snapshots."
    },
    {
      "network": "leetcode",
      "handle": "150+ solved",
      "url": "https://leetcode.com/u/muditagrawal03/",
      "blurb": "150+ problems across arrays, DP, graphs and trees."
    }
  ],
  "experience": [
    {
      "role": "AI/ML Intern",
      "org": "Carnot Research Pvt. Ltd. (IITD Incubated Startup)",
      "dates": "June 2026 – Present",
      "bullets": [
        "Architected a hybrid RAG platform (pgvector, BM25, Text-to-SQL router), cutting query latency 60s to under 1s",
        "Built a dataset-agnostic ETL pipeline (Spark, Airflow) with a 3-tier OCR fallback chain across 6 languages",
        "Integrated a 9,000+ line email/scheduling agent into production, validated via CI/CD with RAGAS and TruLens",
        "Engineered 3 Intel-optimized RAG modes (INT8-quantized), cutting latency 2-3x while reaching 92% Recall@10"
      ],
      "place": {
        "name": "IIT Delhi",
        "city": "New Delhi",
        "lat": 28.545,
        "lng": 77.18915
      }
    },
    {
      "role": "Machine Learning Intern",
      "org": "Zee Tech and Innovation Centre",
      "dates": "December 2025 – January 2026",
      "bullets": [
        "Engineered OmniDoc, a local multimodal RAG engine with BLIP-captioned image retrieval and intent routing",
        "Architected a context-aware scene selector, replacing naive top-k selection with budget-optimized ranking",
        "Built a full-stack video prototype with user auth, async job processing, and live progress tracking",
        "Authored 2 security design specs proposing ML architectures for anomaly detection and content fingerprinting"
      ],
      "place": {
        "name": "Zee Tech and Innovation Centre",
        "city": "Bengaluru",
        "lat": 12.97679,
        "lng": 77.59008
      }
    },
    {
      "role": "Summer Intern",
      "org": "WESEE, Indian Navy (Defense R&D)",
      "dates": "June 2025 – July 2025",
      "bullets": [
        "Assessed in-house LLMs for naval applications within a secure defense R&D environment",
        "Identified bugs, inconsistencies, and logic failures in model outputs for mission-critical reliability",
        "Validated Retrieval-Augmented Generation (RAG) pipelines and improved contextual retrieval accuracy",
        "Built Artifex.AI, a text-to-image tool integrating Stability AI’s SDXL 1.0 API with sub-5s latency"
      ],
      "place": {
        "name": "WESEE",
        "city": "R. K. Puram, New Delhi",
        "lat": 28.55796,
        "lng": 77.18323
      }
    }
  ],
  "education": {
    "degree": "B.Tech Computer Science (AI/ML)",
    "university": "IILM University",
    "years": "2023 – 2027",
    "grade": "7.68",
    "gradeLabel": "CGPA",
    "schooling": [
      {
        "title": "Class 12 Senior Secondary",
        "school": "Navy Children School, New Delhi",
        "year": "2023",
        "score": "74%",
        "detail": "CBSE Science Stream",
        "place": {
          "name": "Navy Children School",
          "city": "Chanakyapuri, New Delhi",
          "lat": 28.58249,
          "lng": 77.19484
        }
      },
      {
        "title": "Class 10 Secondary Examination",
        "school": "Navy Children School, Mumbai",
        "year": "2021",
        "score": "89%",
        "detail": "CBSE Board Examination",
        "place": {
          "name": "Navy Children School",
          "city": "Colaba, Mumbai",
          "lat": 18.90975,
          "lng": 72.80773
        }
      }
    ],
    "place": {
      "name": "IILM University",
      "city": "Greater Noida",
      "lat": 28.46087,
      "lng": 77.49059
    }
  },
  "courses": [
    {
      "title": "Machine Learning Specialization",
      "issuer": "Stanford University & DeepLearning.AI",
      "year": "2025",
      "detail": "Supervised Learning, Neural Networks, Decision Trees, and Unsupervised Learning."
    },
    {
      "title": "Python Specialisation",
      "issuer": "University of Michigan",
      "year": "2025",
      "detail": "Data Structures, Web Scraping, Databases, and Data Visualization."
    },
    {
      "title": "Technology Job Simulation",
      "issuer": "Deloitte",
      "year": "2025",
      "detail": "Software Engineering and Technology Consulting Simulation."
    },
    {
      "title": "Java Programming & OOP",
      "issuer": "Duke University",
      "year": "2025",
      "detail": "Object-Oriented Design, Algorithms, and Software Engineering Principles."
    }
  ],
  "certificates": [
    {
      "title": "Privacy and Security in Online Social Media",
      "issuer": "NPTEL · IIIT Hyderabad",
      "date": "Jul–Oct 2026",
      "detail": "Elite + Silver · 12-week course",
      "image": "assets/photos/thumbs/nptel-privacy-security-online-social-media.jpg",
      "file": "assets/photos/certificates/nptel-privacy-security-online-social-media.pdf"
    },
    {
      "title": "Social Networks",
      "issuer": "NPTEL · IIT Madras",
      "date": "Jul–Oct 2026",
      "detail": "Elite · 12-week course",
      "image": "assets/photos/thumbs/nptel-social-networks.jpg",
      "file": "assets/photos/certificates/nptel-social-networks.pdf"
    },
    {
      "title": "AWS Certified Machine Learning: Machine Learning in SageMaker",
      "issuer": "Infosys Springboard",
      "date": "Sep 2025",
      "image": "assets/photos/thumbs/infosys-aws-ml-sagemaker.jpg",
      "file": "assets/photos/certificates/infosys-aws-ml-sagemaker.pdf"
    },
    {
      "title": "Learn Artificial Intelligence with TensorFlow",
      "issuer": "Infosys Springboard",
      "date": "May 2025",
      "image": "assets/photos/thumbs/infosys-ai-with-tensorflow.jpg",
      "file": "assets/photos/certificates/infosys-ai-with-tensorflow.pdf"
    },
    {
      "title": "Hands-on Scikit-learn for Machine Learning",
      "issuer": "Infosys Springboard",
      "date": "May 2025",
      "image": "assets/photos/thumbs/infosys-scikit-learn.jpg",
      "file": "assets/photos/certificates/infosys-scikit-learn.pdf"
    },
    {
      "title": "Introduction to Artificial Intelligence (AI)",
      "issuer": "IBM · Coursera",
      "date": "Apr 2025",
      "image": "assets/photos/thumbs/ibm-introduction-to-ai.jpg",
      "file": "assets/photos/certificates/ibm-introduction-to-ai.pdf"
    },
    {
      "title": "Machine Learning Foundations",
      "issuer": "AWS Academy",
      "date": "2025",
      "detail": "AWS Academy Graduate · 20 hours",
      "image": "assets/photos/thumbs/aws-academy-machine-learning.jpg",
      "file": "assets/photos/certificates/aws-academy-machine-learning.pdf",
      "badge": "assets/photos/badges/aws-academy-machine-learning.png"
    }
  ],
  "projects": [
    {
      "id": "omnidoc",
      "name": "OmniDoc",
      "title": "OmniDoc",
      "subtitle": "Document intelligence with answers you can verify",
      "kind": "Multi-Agent RAG App (Live)",
      "date": "Jan 2026",
      "icon": "assets/icons/app-omnidoc.svg",
      "link": "https://omnidoc-silk.vercel.app",
      "repo": "https://github.com/muditagrawal-alt/OmniDoc",
      "embed": false,
      "video": "https://omnidoc-silk.vercel.app/demo/omnidoc-demo.mp4",
      "featured": true,
      "summary": "Ask questions across PDFs, scans, contracts, spreadsheets, slides and recordings: every claim cites the page it came from, and every sentence is checked against its source.",
      "description": "Multi-agent RAG for documents. Hybrid search (vectors, BM25 and a reranker), a knowledge graph, OCR in ten Indian languages, read-only SQL over tables and exact math gather the evidence; each cited answer is then checked sentence by sentence. Runs on free model API tiers, or entirely on your machine with Ollama.",
      "highlights": [
        "Benchmarks: 77.8% on FinanceBench and 71.7% on MMLongBench-Doc (test splits), up from 30.6% and 35.8% at the baseline",
        "A citation opens the document at the cited page with the supporting sentence highlighted",
        "Structured extraction, version comparison, and a privacy scan that truly redacts Aadhaar, PAN and card numbers",
        "Stack: FastAPI · LangGraph · React 19 · LanceDB · Kùzu · ONNX, with 211 tests in CI",
        "Live app: omnidoc-silk.vercel.app (Vercel and Oracle Cloud, on free tiers)"
      ],
      "tags": [
        "rag",
        "multi-agent",
        "llm",
        "document intelligence",
        "knowledge graph",
        "ocr",
        "fastapi",
        "langgraph",
        "react",
        "typescript",
        "python"
      ],
      "aliases": ["document intelligence", "pdf", "omni doc", "rag"],
      "demo": {
        "description": "Ask questions across PDFs, scans, contracts and spreadsheets, and get answers that cite their pages, with every sentence checked against its source. Multi-agent RAG with a knowledge graph, OCR and exact math over tables.",
        "requirements": "Python 3.9+ · Node 20+ · Docker optional · free model API keys or local Ollama",
        "stack": ["Python", "FastAPI", "LangGraph", "React", "LanceDB", "Kùzu", "ONNX"]
      }
    },
    {
      "id": "veritas",
      "name": "Veritas Check",
      "title": "Veritas Check",
      "subtitle": "Is this news story, image or video what it claims to be?",
      "kind": "Media Forensics (Live)",
      "date": "Feb 2026",
      "icon": "assets/icons/app-veritas.svg",
      "link": "https://veritas-check.vercel.app",
      "repo": "https://github.com/muditagrawal-alt/Deepfake-and-Fake-News-Detector",
      "embed": false,
      "video": "assets/me/veritas-demo.mp4",
      "summary": "Checks whether a news link, image or short video is what it claims to be: local forensics plus an LLM fact-check, with every claim and source shown.",
      "description": "Reads the evidence a file carries (EXIF and XMP metadata, signed C2PA provenance, Google SynthID watermarks, video container data), cross-checks a story's claims against independent sources that exclude the publisher under review, and gives a calibrated verdict: likely real, likely fake or uncertain.",
      "highlights": [
        "Three inputs: live news links, images up to 10 MB and videos up to 90 seconds",
        "Evidence is fingerprinted with SHA-256 and exported as a multi-page PDF report",
        "Gemini 3.5 Flash-Lite for reasoning and Groq Whisper for audio, or fully local with Ollama",
        "Hardened: SSRF blocking, file-signature checks, AES-256-GCM for visitors' own API keys, rate limits",
        "Stack: Next.js 16 · FastAPI · Tailwind CSS v4 · NextAuth",
        "Live app: veritas-check.vercel.app, with 3 free checks per visitor"
      ],
      "tags": [
        "deepfake detection",
        "fact-checking",
        "media forensics",
        "c2pa",
        "gemini",
        "fastapi",
        "nextjs",
        "typescript",
        "python"
      ],
      "aliases": ["deepfake", "fake news", "misinformation", "veritas"]
    },
    {
      "id": "skyguard",
      "name": "Skyguard AI",
      "title": "SkyGuard AI (SIH 2026)",
      "subtitle": "Anomaly detection and self-healing for automatic weather stations",
      "kind": "AI for Weather Sensors",
      "date": "Aug 2026",
      "icon": "assets/icons/app-skyguard.svg",
      "link": "https://skyguard-ai-orcin.vercel.app",
      "repo": "https://github.com/muditagrawal-alt/Skyguard_AI_SIH2026",
      "summary": "Tells a faulty weather-station sensor from genuine weather in real time, explains why, and repairs the bad readings. Built for Smart India Hackathon 2026 (problem statement 26073).",
      "description": "Watches temperature, pressure and humidity from Automatic Weather Stations with a consensus of physics rules (Magnus-Tetens, WMO limits), a PyTorch sequence autoencoder, an Isolation Forest trained with about 46,000 real NOAA observations, and streaming EWMA and CUSUM drift filters. Neighbouring stations corroborate real storms, and faulty readings are imputed so forecasts downstream never see a gap.",
      "highlights": [
        "On its seeded benchmark: 99.1% precision, 91.3% recall, 95.1% F1, no false alarms on storms, 4.9 ms per reading",
        "A root-cause classifier explains each fault for meteorologists, with SHAP analysis offline",
        "An edge build for ESP32 and ARM Cortex-M in under 3.2 KB of RAM",
        "An operator dashboard (React, Vite, TypeScript) over live WebSocket telemetry, plus a Streamlit fault-injection sandbox",
        "Stack: FastAPI · PyTorch · scikit-learn · React · ESP32"
      ],
      "tags": [
        "anomaly detection",
        "weather",
        "iot",
        "edge ai",
        "pytorch",
        "fastapi",
        "react",
        "sih",
        "typescript",
        "python"
      ],
      "aliases": ["skyguard", "weather station", "sensor anomaly", "sih"],
      "building": true
    },
    {
      "id": "vlm",
      "name": "VLM Lead Extraction",
      "title": "VLM Business Card Lead Extraction",
      "subtitle": "Business cards in, a verified lead list out",
      "kind": "Vision AI Web App",
      "date": "Sep 2026",
      "icon": "assets/icons/app-vlm.svg",
      "link": "https://muditagrawal-lead-extraction.vercel.app",
      "summary": "Upload business cards in bulk, get seven structured fields per card from a vision-language model, review and correct them in the browser, and export a formatted Excel workbook.",
      "description": "A vision-language model reads each card into seven fields (Qwen3-VL-8B on a GPU, or Gemini on the free tier), and a review screen lets you correct anything before export. FastAPI, a job queue and PostgreSQL sit behind a React app, with guardrails for a public URL that has no accounts.",
      "highlights": [
        "100% field accuracy on an eight-card test set built from layouts that break extraction; 95–97% on real cards graded by hand",
        "Runs Qwen3-VL-8B on a T4 GPU, or Gemini on the free tier",
        "Stack: FastAPI · PostgreSQL · React · Vercel · Oracle Cloud",
        "Live app: muditagrawal-lead-extraction.vercel.app"
      ],
      "tags": ["vlm", "vision", "leads", "business card", "qwen", "gemini", "fastapi", "react", "postgresql", "vercel"],
      "featured": true,
      "aliases": ["business card", "lead extraction", "vlm"],
      "repo": "https://github.com/muditagrawal-alt/VLM_Business_Card_Lead_Extraction",
      "embed": false,
      "video": "assets/me/vlm-demo.mp4"
    },
    {
      "id": "slam",
      "name": "Monocular SLAM",
      "title": "Monocular RGB Sparse Point Cloud SLAM",
      "subtitle": "A camera path and a 3D point cloud from one ordinary video",
      "kind": "Computer Vision System",
      "date": "Sep 2026",
      "icon": "assets/icons/app-slam.svg",
      "repo": "https://github.com/muditagrawal-alt/Monocular_RGB_Sparse_Point_Cloud_SLAM",
      "summary": "Recovers a camera’s trajectory and a sparse 3D point cloud from a single-lens RGB video with classical multi-view geometry: no depth sensor, no neural network, no GPU.",
      "description": "Corners are tracked frame to frame with optical flow, each camera pose is solved against the map built so far, bundle adjustment refines poses and structure together, and loop closure removes drift wherever the camera revisits a place. A 10-second clip reconstructs in under 7 seconds on a CPU container.",
      "tags": ["slam", "computer vision", "3d", "point cloud", "geometry", "opencv", "gtsam", "fastapi", "react", "python"],
      "link": "https://muditagrawal-alt--monocular-slam.modal.run",
      "video": "assets/me/slam-demo.mp4",
      "highlights": [
        "A 10-second clip in 5.5–6.7 s on 4 CPU cores, with no GPU",
        "Bundle adjustment and loop closure cut trajectory error 4.8× on a looping scene",
        "42 of 44 real-world clips from Wikimedia Commons reconstructed",
        "Stack: Python · OpenCV · GTSAM · FastAPI · React · Modal"
      ]
    },
    {
      "id": "sliver",
      "name": "Sliver.Ai",
      "title": "Sliver.Ai",
      "subtitle": "On-Device Video Summarization Engine",
      "kind": "Video AI App",
      "date": "Jan 2026",
      "icon": "assets/icons/app-sliver.svg",
      "repo": "https://github.com/muditagrawal-alt/Sliver-Smart-Video-Clipping-Tool",
      "summary": "On-device AI video summarization engine & smart highlight extractor using YOLO11m, YOLOv8-Face, and OpenAI CLIP with sample-accurate audio sync.",
      "tags": ["video", "clipping", "yolo", "clip", "pytorch", "ffmpeg", "highlights"],
      "video": "assets/me/sliver-demo.mp4",
      "description": "Finds the moments that matter in a long video (people, important objects, motion, and anything you describe in words) and cuts them into a short highlight reel that keeps each moment’s lead-in and reaction. Runs entirely on your own machine.",
      "highlights": [
        "Fuses YOLO11m objects, YOLOv8-Face, motion and a CLIP text prompt",
        "Clips keep their context, and FFmpeg keeps the audio in sync to the sample",
        "Runs locally on Apple Silicon: nothing is uploaded"
      ]
    },
    {
      "id": "sword",
      "name": "Project S.W.O.R.D",
      "title": "Project S.W.O.R.D v2",
      "subtitle": "Multi-model weapon detection for surveillance",
      "kind": "Defense CV App",
      "date": "Dec 2025",
      "icon": "assets/icons/app-sword.svg",
      "repo": "https://github.com/muditagrawal-alt/Project_S.W.O.R.D_v2",
      "summary": "A three-model weapon detector (YOLO26s, YOLO26m and RT-DETR-L, fused with Weighted Boxes Fusion) trained on 10 weapon classes and about 28,000 images, connected to tracking, pose and alarm rules.",
      "description": "Three complementary detectors vote through Weighted Boxes Fusion: YOLO26s for recall, YOLO26m for precision and RT-DETR-L for transformer attention. Around them, tracking, pose, action recognition, alarm rules over time and an incident service turn detections into alerts.",
      "tags": [
        "computer vision",
        "yolo",
        "rt-detr",
        "object detection",
        "weapon detection",
        "surveillance",
        "defense",
        "pytorch"
      ],
      "aliases": ["sword", "weapon"],
      "building": true,
      "highlights": [
        "10 classes, from pistols and knives to rocket launchers, on about 28,000 images",
        "Weighted Boxes Fusion over YOLO26s, YOLO26m and RT-DETR-L",
        "A Streamlit dashboard for images, video and a live camera"
      ]
    },
    {
      "id": "helix",
      "name": "Helix-Compiler",
      "title": "Helix-Compiler",
      "subtitle": "Interactive Playground on Hugging Face",
      "kind": "Language Compiler (Live)",
      "date": "Mar 2026",
      "icon": "assets/icons/app-helix.svg",
      "link": "https://huggingface.co/spaces/muditagrawal03/Helix-Compiler",
      "repo": "https://github.com/muditagrawal-alt/Helix-Compiler",
      "summary": "An educational compiler in C for the Helix language (.hxi): lexical analysis, recursive-descent parsing, three-address code and DAG-based optimisation.",
      "description": "Takes .hxi source through the classic phases: tokens, an abstract syntax tree built by recursive descent, three-address code, and a DAG pass that removes repeated subexpressions. It compiles arithmetic expressions today, and a Gradio playground on Hugging Face Spaces shows every phase.",
      "tags": ["compiler", "systems", "c", "parsing", "gradio"],
      "embed": "https://muditagrawal03-helix-compiler.hf.space"
    },
    {
      "id": "multiva",
      "name": "Multiva.Ai",
      "title": "Multiva.Ai",
      "subtitle": "Offline Video Dubbing Studio",
      "kind": "Speech Dubbing App",
      "date": "Feb 2026",
      "icon": "assets/icons/app-multiva.svg",
      "repo": "https://github.com/muditagrawal-alt/Multiva.Ai",
      "summary": "Offline video dubbing studio for Indian languages preserving speaker voice & lip sync using faster-whisper, NLLB-200, IndicF5 and Wav2Lip.",
      "description": "Offline video dubbing for Indian languages. Keeps speaker's own voice and re-syncs lips: faster-whisper, NLLB-200, IndicF5 and Wav2Lip in a desktop studio.",
      "tags": ["audio", "speech synthesis", "voice cloning", "whisper", "nllb", "indicf5", "wav2lip"],
      "video": "assets/me/multiva-demo.mp4",
      "highlights": [
        "12 Indian languages with IndicF5, and 16 more with XTTS",
        "Clones the speaker’s voice from 6–12 seconds of audio, with no training",
        "About 10× realtime on an M4, and nothing leaves the machine"
      ]
    },
    {
      "id": "artifex",
      "name": "Artifex.ai",
      "title": "Artifex.ai",
      "subtitle": "Text-to-Image Chatbot",
      "kind": "Generative AI Platform",
      "date": "Jul 2025",
      "repo": "https://github.com/muditagrawal-alt/Artifex.ai",
      "summary": "Generative AI text-to-image chatbot utilizing Stable Diffusion v1.5 with Gradio UI and prompt history sidebar.",
      "tags": ["generative ai", "stable diffusion", "image generation", "gradio"],
      "description": "Text-to-image generation with Stable Diffusion v1.5 in a Gradio app, with a prompt-history sidebar for reusing earlier prompts. Kept small and modular as a base for audio and video generation later."
    }
  ],
  "skills": [
    {
      "label": "Programming Languages",
      "items": ["Python", "Java", "C", "SQL"]
    },
    {
      "label": "Frameworks & Libraries",
      "items": [
        "LangChain",
        "PyTorch",
        "TensorFlow",
        "Keras",
        "Scikit-Learn",
        "OpenCV",
        "NumPy",
        "Pandas",
        "Matplotlib",
        "Docling",
        "PySpark",
        "FAISS",
        "Flask",
        "FastAPI",
        "SQLAlchemy"
      ]
    },
    {
      "label": "AI Models & Architectures",
      "items": [
        "YOLOv8/11/26",
        "Whisper (CTranslate2)",
        "Coqui XTTS",
        "OpenVoice",
        "BLIP",
        "Mistral-7B",
        "Gemma4",
        "Qwen 2.5",
        "Wav2Lip",
        "FB-NLLB",
        "BGE-M3 Embeddings",
        "BGE-M3 ReRanker",
        "SentenceTransformers"
      ]
    },
    {
      "label": "Databases & Vector Stores",
      "items": ["PostgreSQL", "ChromaDB", "SQLite", "Elasticsearch", "Qdrant", "MongoDB"]
    },
    {
      "label": "Evaluation & Testing",
      "items": ["RAGAS", "TruLens", "BIER", "PyTest", "CI/CD", "InfoVQA"]
    },
    {
      "label": "Developer Tools & Platforms",
      "items": [
        "Git",
        "Docker",
        "OAuth2.0",
        "Cloudflare R2",
        "Ollama",
        "Groq",
        "Google Calendar API",
        "Gradio",
        "Streamlit",
        "Firebase",
        "Supabase",
        "Apache Airflow",
        "Apache Spark",
        "MistralOCR",
        "FFmpeg",
        "Claude"
      ]
    }
  ],
  "writing": [
    {
      "title": "Building Multimodal Document Intelligence with Mistral-7B & BLIP",
      "topic": "RAG & LLMs",
      "summary": "Deep dive into architecture parsing, embeddings, and real-time grounded QA in OmniDoc.",
      "minutes": 6,
      "url": "https://substack.com/@standardissuemudit"
    },
    {
      "title": "Real-Time Automated Highlight Pipeline with YOLOv8 & YOLO11",
      "topic": "Computer Vision",
      "summary": "Facial analysis, emotion scoring, and sub-second video chunking with FFmpeg.",
      "minutes": 8,
      "url": "https://substack.com/@standardissuemudit"
    },
    {
      "title": "Evaluating LLMs for Mission-Critical Defense Systems",
      "topic": "AI Systems",
      "summary": "Lessons learned stress-testing hallucination boundaries and logic consistency at WESEE.",
      "minutes": 5,
      "url": "https://medium.com/@muditagrawal03"
    }
  ],
  "notes": [
    {
      "title": "Engineering Philosophy",
      "folder": "Philosophy",
      "date": "2026-08-16T14:15",
      "body": "I value **learning by building** over purely memorizing theoretical concepts. The most instructive moments come when models break under edge cases, latencies spike on inference, or data pipelines hit unexpected bottlenecks.\n\n- **Context Awareness:** Tech is only as good as the problem it solves.\n- **Robustness:** Build systems that hold up outside clean sandbox environments.\n- **Speed of Iteration:** Prototype quickly, evaluate rigorously, refactor thoughtfully.\n\n> \"Always stay curious, dig into the internals, and never treat AI models as black boxes.\""
    },
    {
      "title": "What I'm Learning Currently",
      "folder": "Current Learning",
      "date": "2026-08-15T18:40",
      "body": "Areas of deep technical dive right now:\n\n- **Multimodal Agent Architectures:** Function calling, tool use, and structured outputs with open-weights LLMs.\n- **Model Quantization & Inference:** GGUF, AWQ, vLLM, and TensorRT optimizations for fast localized serving.\n- **Advanced Vision Transformers:** Video temporal processing and real-time zero-shot detection."
    },
    {
      "title": "Core Tech Stack Cheat Sheet",
      "folder": "Tech Notes",
      "date": "2026-08-10T13:10",
      "body": "**Languages:** Python, C, Java, HTML5, CSS3, JavaScript, SQL.\n\n**AI/ML & Deep Learning:** PyTorch, TensorFlow, Keras, OpenCV, Scikit-Learn, Torchvision, Torchaudio.\n\n**Pretrained Models & Tools:** Mistral-7B, YOLOv8/11, Whisper, Coqui XTTS, BLIP, Nomic, FFMPEG, Git, Hugging Face, Linux/Bash."
    },
    {
      "title": "Quick Facts & Interests",
      "folder": "Personal",
      "date": "2026-08-02T09:30",
      "body": "- **Navy background:** Grew up moving across naval bases in Mumbai and New Delhi, developing high adaptability and respect for mission discipline.\n- B.Tech Computer Science (AI/ML) with a 7.68 CGPA at IILM University.\n- Passionate about robotics, applied computer vision, competitive hackathons, and systems-level programming."
    }
  ],
  "cutIdeas": [
    {
      "name": "blockchain-portfolio.idea",
      "kind": "Abandoned Concept",
      "reason": "Wanted to mint each project as an NFT. Realised I could not explain why that was better than a hyperlink, so it went in here."
    },
    {
      "name": "realtime-face-login.py",
      "kind": "Abandoned Prototype",
      "reason": "Face-recognition login for this site. Worked in good lighting, failed on 3 of 5 testers, and asked visitors for camera access before showing them anything. Wrong trade."
    },
    {
      "name": "gpt-writes-my-bio.txt",
      "kind": "Rejected Draft",
      "reason": "Fully model-written \"About Me\". Technically fluent, said nothing a hundred other portfolios did not. Rewrote it by hand."
    },
    {
      "name": "infinite-scroll-timeline.js",
      "kind": "Abandoned Feature",
      "reason": "A scrolling career timeline with parallax. Beautiful at 60fps on my machine, 12fps on a mid-range phone. Cut it."
    },
    {
      "name": "voice-controlled-desktop.js",
      "kind": "Shelved",
      "reason": "Talk to the portfolio to open windows. Great demo, uncomfortable in an open-plan office where most people would open this. Shelved, not deleted — Iris got the useful half."
    },
    {
      "name": "yolov26-benchmark-v1.ipynb",
      "kind": "Superseded",
      "reason": "First S.W.O.R.D benchmark run. Leaked test images into the training split, so 97% mAP was a lie. Rebuilt the split; the honest number is 90.1%."
    }
  ],
  "resume": {
    "file": "assets/MuditAgrawalResumeAugust2026.pdf",
    "preview": "assets/MuditAgrawalResumePreview.png",
    "updated": "August 2026"
  },
  "site": {
    "url": "https://macos-portfolio-mauve-seven.vercel.app/",
    "image": "assets/og-image.jpg"
  },
  "hackathons": [
    {
      "name": "Watch the Code 2026",
      "date": "2026",
      "result": "Top 25 finalist",
      "place": {
        "name": "Graphic Era Hill University",
        "city": "Haldwani",
        "lat": 29.12428,
        "lng": 79.51565
      }
    },
    {
      "name": "Hackverse 2.0",
      "result": "Top 50",
      "place": {
        "name": "IILM University",
        "city": "Gurugram",
        "lat": 28.43365,
        "lng": 77.10285
      }
    },
    {
      "name": "HackRust",
      "result": "Top 25 finalist",
      "place": {
        "name": "Deenbandhu Chhotu Ram University of Science and Technology",
        "city": "Murthal",
        "lat": 29.02935,
        "lng": 77.06032
      }
    },
    {
      "name": "Xen-a-Thon",
      "result": "Top 50 finalist",
      "place": {
        "name": "Guru Tegh Bahadur Institute of Technology",
        "city": "New Delhi",
        "lat": 28.6317,
        "lng": 77.11653
      }
    },
    {
      "name": "Hack O' Clock",
      "result": "Top 50 finalist",
      "place": {
        "name": "IILM University",
        "city": "Greater Noida",
        "lat": 28.46087,
        "lng": 77.49059
      }
    },
    {
      "name": "HackX 3.0",
      "result": "Top 50 finalist",
      "place": {
        "name": "Manipal University Jaipur",
        "city": "Jaipur",
        "lat": 26.84291,
        "lng": 75.56543
      }
    }
  ],
  "events": [
    {
      "name": "India AI Impact Summit 2026",
      "date": "February 2026",
      "place": {
        "name": "Bharat Mandapam",
        "city": "New Delhi",
        "lat": 28.61724,
        "lng": 77.24346
      }
    },
    {
      "name": "9th India International Water Week 2026",
      "date": "September 2026",
      "place": {
        "name": "Bharat Mandapam",
        "city": "New Delhi",
        "lat": 28.61724,
        "lng": 77.24346
      }
    },
    {
      "name": "The Battery Show India 2023",
      "date": "October 2023",
      "place": {
        "name": "India Expo Centre & Mart",
        "city": "Greater Noida",
        "lat": 28.46149,
        "lng": 77.49989
      }
    }
  ]
};
