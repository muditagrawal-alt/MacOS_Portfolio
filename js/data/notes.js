/* ==========================================================================
   Notes — curated content shared by Notes on Mac and iPhone
   --------------------------------------------------------------------------
   Visitors' own notes are added to this object at runtime (and persisted
   under the 'notes-user-v1' localStorage key) by each shell's Notes app.
   ========================================================================== */

const notesData = {
    1: {
        title: "Engineering Philosophy",
        category: 'philosophy',
        listDate: '16/08/2026',
        date: "August 16, 2026 at 2:15 PM",
        body: `
            <p>I value <strong>learning by building</strong> over purely memorizing theoretical concepts. The most instructive moments come when models break under edge cases, latencies spike on inference, or data pipelines hit unexpected bottlenecks.</p>
            <div class="note-checklist">
                <div class="checklist-item"><i class="fas fa-check-circle" style="color:#f6d365;"></i> <span><strong>Context Awareness:</strong> Tech is only as good as the problem it solves.</span></div>
                <div class="checklist-item"><i class="fas fa-check-circle" style="color:#f6d365;"></i> <span><strong>Robustness:</strong> Build systems that hold up outside clean sandbox environments.</span></div>
                <div class="checklist-item"><i class="fas fa-check-circle" style="color:#f6d365;"></i> <span><strong>Speed of Iteration:</strong> Prototype quickly, evaluate rigorously, refactor thoughtfully.</span></div>
            </div>
            <p style="margin-top: 15px; color:#c0bbb4;"><em>"Always stay curious, dig into the internals, and never treat AI models as black boxes."</em></p>
        `
    },
    2: {
        title: "What I'm Learning Currently",
        category: 'learning',
        listDate: '15/08/2026',
        date: "August 15, 2026 at 6:40 PM",
        body: `
            <p>Areas of deep technical dive right now:</p>
            <div class="note-checklist">
                <div class="checklist-item"><i class="fas fa-circle" style="font-size:8px;color:#f6d365;"></i> <span><strong>Multimodal Agent Architectures:</strong> Function calling, tool use, and structured outputs with open-weights LLMs.</span></div>
                <div class="checklist-item"><i class="fas fa-circle" style="font-size:8px;color:#f6d365;"></i> <span><strong>Model Quantization & Inference:</strong> GGUF, AWQ, vLLM, and TensorRT optimizations for fast localized serving.</span></div>
                <div class="checklist-item"><i class="fas fa-circle" style="font-size:8px;color:#f6d365;"></i> <span><strong>Advanced Vision Transformers:</strong> Video temporal processing and real-time zero-shot detection.</span></div>
            </div>
        `
    },
    3: {
        title: "Core Tech Stack Cheat Sheet",
        category: 'stack',
        listDate: '10/08/2026',
        date: "August 10, 2026 at 1:10 PM",
        body: `
            <p><strong>Languages:</strong> Python, C, Java, HTML5, CSS3, JavaScript, SQL.</p>
            <p><strong>AI/ML & Deep Learning:</strong> PyTorch, TensorFlow, Keras, OpenCV, Scikit-Learn, Torchvision, Torchaudio.</p>
            <p><strong>Pretrained Models & Tools:</strong> Mistral-7B, YOLOv8/11, Whisper, Coqui XTTS, BLIP, Nomic, FFMPEG, Git, Hugging Face, Linux/Bash.</p>
        `
    },
    4: {
        title: "Quick Facts & Interests",
        category: 'personal',
        listDate: '02/08/2026',
        date: "August 2, 2026 at 9:30 AM",
        get body() {
            const p = window.PROFILE_DATA || {};
            const edu = p.education || {};
            return `
                <p>• Navy background: Grew up moving across naval bases in Mumbai and New Delhi, developing high adaptability and respect for mission discipline.</p>
                <p>• ${edu.degree || 'B.Tech Computer Science (AI/ML)'} with ${edu.cgpa || ''} CGPA at ${edu.university || 'IILM University'}.</p>
                <p>• Passionate about robotics, applied computer vision, competitive hackathons, and systems-level programming.</p>
            `;
        }
    }
};
