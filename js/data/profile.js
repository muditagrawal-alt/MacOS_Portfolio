/* ==========================================================================
   Mudit Agrawal — Central Profile Data (Single Source of Truth)
   ========================================================================== */

window.PROFILE_DATA = {
  name: "Mudit Agrawal",
  tagline: "AI/ML Engineer & Computer Science Undergraduate",
  bio: "Computer Science Undergraduate (AI/ML) at IILM University, building applied AI systems that work reliably outside sandboxes — agentic pipelines, RAG systems, and computer vision.",
  education: {
    degree: "B.Tech Computer Science (AI/ML)",
    university: "IILM University",
    years: "2023 – 2027",
    cgpa: "7.68"
  },
  experience: [
    {
      role: "AI/ML Intern",
      org: "Carnot Research Pvt. Ltd. (IITD Incubated Startup)",
      dates: "June 2026 – Present",
      bullets: [
        "Architected a hybrid RAG platform (pgvector, BM25, Text-to-SQL router), cutting query latency 60s to under 1s",
        "Built a dataset-agnostic ETL pipeline (Spark, Airflow) with a 3-tier OCR fallback chain across 6 languages",
        "Integrated a 9,000+ line email/scheduling agent into production, validated via CI/CD with RAGAS and TruLens",
        "Engineered 3 Intel-optimized RAG modes (INT8-quantized), cutting latency 2-3x while reaching 92% Recall@10"
      ]
    },
    {
      role: "Machine Learning Intern",
      org: "Zee Tech and Innovation Centre",
      dates: "December 2025 – January 2026",
      bullets: [
        "Engineered OmniDoc, a local multimodal RAG engine with BLIP-captioned image retrieval and intent routing",
        "Architected a context-aware scene selector, replacing naive top-k selection with budget-optimized ranking",
        "Built a full-stack video prototype with user auth, async job processing, and live progress tracking",
        "Authored 2 security design specs proposing ML architectures for anomaly detection and content fingerprinting"
      ]
    },
    {
      role: "Summer Intern",
      org: "WESEE, Indian Navy (Defense R&D)",
      dates: "June 2025 – July 2025",
      bullets: [
        "Assessed in-house LLMs for naval applications within a secure defense R&D environment",
        "Identified bugs, inconsistencies, and logic failures in model outputs for mission-critical reliability",
        "Validated Retrieval-Augmented Generation (RAG) pipelines and improved contextual retrieval accuracy",
        "Built Artifex.AI, a text-to-image tool integrating Stability AI’s SDXL 1.0 API with sub-5s latency"
      ]
    }
  ],
  contact: {
    email: "muditagrawal03@gmail.com",
    phone: "+91-7289887349",
    linkedin: "https://www.linkedin.com/in/mudit-agrawal-167610318",
    github: "https://github.com/muditagrawal-alt"
  },
  projects: [],
  skills: {
    programming: ["Python", "Java", "C", "SQL"],
    frameworks: [
      "LangChain", "PyTorch", "TensorFlow", "Keras", "Scikit-Learn", "OpenCV",
      "NumPy", "Pandas", "Matplotlib", "Docling", "PySpark", "FAISS", "Flask",
      "FastAPI", "SQLAlchemy"
    ],
    models: [
      "YOLOv8/11/26", "Whisper (CTranslate2)", "Coqui XTTS", "OpenVoice", "BLIP",
      "Mistral-7B", "Gemma4", "Qwen 2.5", "Wav2Lip", "FB-NLLB", "BGE-M3 Embeddings",
      "BGE-M3 ReRanker", "SentenceTransformers"
    ],
    databases: [
      "PostgreSQL", "ChromaDB", "SQLite", "Elasticsearch", "Qdrant", "MongoDB"
    ],
    evaluation: [
      "RAGAS", "TruLens", "BIER", "PyTest", "CI/CD", "InfoVQA"
    ],
    tools: [
      "Git", "Docker", "OAuth2.0", "Cloudflare R2", "Ollama", "Groq",
      "Google Calendar API", "Gradio", "Streamlit", "Firebase", "Supabase",
      "Apache Airflow", "Apache Spark", "MistralOCR", "FFmpeg", "Claude"
    ]
  }
};
