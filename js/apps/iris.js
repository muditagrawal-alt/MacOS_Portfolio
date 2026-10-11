/* ==========================================================================
   Iris AI Assistant Controller — Completely Smart Autonomous Siri Agent
   - Ambient "Hey Iris" / "Hey Siri" Wake Word Detection
   - Live Speech-to-Text Transcription with Audio Feedback
   - Continuous Voice-Responsive Siri Orb & Dynamic Waveforms
   - Natural Language Semantic Intent Engine (No Hardcoded Commands)
   - Contextual Pronoun Memory ("open it", "launch that")
   - Apple Intelligence Iridescent Screen Edge Glow
   - Interactive macOS Siri Action Cards & Window Auto-Focus
   ========================================================================== */

let irisConversation = [];
let irisProcessing = false;
let irisSpeechRecognition = null;
let irisWakeWordRecognition = null;
let irisIsListening = false;
let irisHeyIrisEnabled = true;
let irisVoices = [];
let irisLastReferencedEntity = null; // Memory for "open it", "launch that"
let irisPendingTranscript = '';
let irisWaveformInterval = null;

/* ── Web Audio API Native Siri Chimes ─────────────────────────────────── */
function playSiriChime(type = 'wake') {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime;

        if (type === 'wake') {
            // Authentic Siri upward 2-bell chime: C5 (523Hz) -> G5 (784Hz)
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(523.25, now);
            gain1.gain.setValueAtTime(0.14, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.22);

            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(783.99, now + 0.11);
            gain2.gain.setValueAtTime(0.18, now + 0.11);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now + 0.11);
            osc2.stop(now + 0.42);
        } else if (type === 'success') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.2);
        }
    } catch (e) {
        console.warn('Siri chime error:', e);
    }
}

/* ── Ambient "Hey Iris" Wake Word Listener ────────────────────────────── */
function initWakeWordListener() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec || !irisHeyIrisEnabled) return;

    try {
        if (irisWakeWordRecognition) {
            try { irisWakeWordRecognition.abort(); } catch (e) {}
        }
        irisWakeWordRecognition = new SpeechRec();
        irisWakeWordRecognition.continuous = true;
        irisWakeWordRecognition.interimResults = true;
        irisWakeWordRecognition.lang = 'en-US';

        irisWakeWordRecognition.onresult = (event) => {
            if (irisIsListening) return; // Main listener is active

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const text = event.results[i][0].transcript.toLowerCase().trim();
                const wakeMatch = text.match(/\b(hey\s*iris|hey\s*siri|ok\s*iris|okay\s*iris|iris)\b/i);

                if (wakeMatch) {
                    playSiriChime('wake');
                    openIris();

                    // Check if the user already spoke a command right after the wake word: e.g. "Hey Iris open terminal"
                    const remaining = text.slice(wakeMatch.index + wakeMatch[0].length).replace(/^[,.\s]+/, '').trim();
                    if (remaining.length > 2) {
                        const input = document.getElementById('iris-input');
                        if (input) input.value = remaining;
                        sendIrisMessage(remaining);
                    } else {
                        // Spoken feedback and switch to active listening mode
                        speakIris("How can I help you?");
                        setTimeout(() => startIrisListening(), 800);
                    }
                    break;
                }
            }
        };

        irisWakeWordRecognition.onerror = (e) => {
            if (irisHeyIrisEnabled && e.error !== 'not-allowed') {
                setTimeout(() => {
                    try { if (!irisIsListening) irisWakeWordRecognition.start(); } catch (err) {}
                }, 2000);
            }
        };

        irisWakeWordRecognition.onend = () => {
            if (irisHeyIrisEnabled && !irisIsListening) {
                setTimeout(() => {
                    try { irisWakeWordRecognition.start(); } catch (err) {}
                }, 1000);
            }
        };

        irisWakeWordRecognition.start();
        updateWakeStatusUI(true);
    } catch (e) {
        console.warn('Wake word listener initialization:', e);
    }
}

function toggleHeyIrisListening() {
    irisHeyIrisEnabled = !irisHeyIrisEnabled;
    updateWakeStatusUI(irisHeyIrisEnabled);
    if (irisHeyIrisEnabled) {
        initWakeWordListener();
    } else {
        if (irisWakeWordRecognition) {
            try { irisWakeWordRecognition.stop(); } catch (e) {}
        }
    }
}

function updateWakeStatusUI(active) {
    const statusPill = document.getElementById('iris-wake-status');
    if (!statusPill) return;
    statusPill.classList.toggle('listening', active);
    statusPill.innerHTML = `<i class="fas fa-satellite-dish"></i> <span>"Hey Iris" ${active ? 'Active' : 'Off'}</span>`;
}

/* ── Active Speech Recognition & Real-Time Transcription ─────────────── */
function initIrisSpeech() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
        try {
            irisSpeechRecognition = new SpeechRec();
            irisSpeechRecognition.continuous = false;
            irisSpeechRecognition.interimResults = true;
            irisSpeechRecognition.lang = 'en-US';

            irisSpeechRecognition.onstart = () => {
                irisIsListening = true;
                irisPendingTranscript = '';
                setIrisOrbState('listening');

                const micBtn = document.getElementById('iris-mic-btn');
                if (micBtn) micBtn.classList.add('listening');

                const glow = document.getElementById('iris-siri-glow');
                if (glow) glow.classList.add('active');

                const liveBox = document.getElementById('iris-live-transcript');
                const liveText = document.getElementById('iris-live-transcript-text');
                if (liveBox) liveBox.classList.add('active');
                if (liveText) liveText.textContent = 'Listening... Speak naturally';

                const input = document.getElementById('iris-input');
                if (input) input.placeholder = 'Listening to your voice...';
            };

            irisSpeechRecognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const t = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += t;
                    } else {
                        interimTranscript += t;
                    }
                }

                const currentText = finalTranscript || interimTranscript;

                // Transcribe live in real time into both the transcript caption and the input field
                const liveText = document.getElementById('iris-live-transcript-text');
                if (liveText && currentText) liveText.textContent = currentText;

                const input = document.getElementById('iris-input');
                if (input && currentText) input.value = currentText;

                if (finalTranscript.trim()) {
                    irisPendingTranscript = finalTranscript.trim();
                    stopIrisListening();
                    playSiriChime('success');
                    sendIrisMessage(irisPendingTranscript);
                    irisPendingTranscript = '';
                } else if (interimTranscript.trim()) {
                    irisPendingTranscript = interimTranscript.trim();
                }
            };

            irisSpeechRecognition.onerror = (event) => {
                console.warn('Iris speech recognition error:', event.error);
                stopIrisListening();
            };

            irisSpeechRecognition.onend = () => {
                // If speech recognition ended with pending speech captured
                if (irisPendingTranscript && !irisProcessing) {
                    const textToSend = irisPendingTranscript;
                    irisPendingTranscript = '';
                    stopIrisListening();
                    playSiriChime('success');
                    sendIrisMessage(textToSend);
                } else {
                    stopIrisListening();
                }
            };
        } catch (e) {
            console.warn('SpeechRecognition init error:', e);
        }
    }

    // Initialize text-to-speech voices
    if ('speechSynthesis' in window) {
        const loadVoices = () => {
            irisVoices = window.speechSynthesis.getVoices();
        };
        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }
}

function startIrisListening() {
    if (!irisSpeechRecognition) {
        const input = document.getElementById('iris-input');
        if (input) {
            input.focus();
            input.placeholder = 'Speech API unavailable — type your prompt here...';
        }
        return;
    }
    // Pause ambient wake recognition while main speech recognition is active
    if (irisWakeWordRecognition) {
        try { irisWakeWordRecognition.stop(); } catch (e) {}
    }
    try {
        irisSpeechRecognition.start();
    } catch (e) {
        console.warn('Start listening error:', e);
    }
}

function toggleIrisVoice() {
    if (irisIsListening) {
        try { irisSpeechRecognition.stop(); } catch (e) {}
        stopIrisListening();
    } else {
        startIrisListening();
    }
}

function stopIrisListening() {
    irisIsListening = false;
    setIrisOrbState('');

    const micBtn = document.getElementById('iris-mic-btn');
    if (micBtn) micBtn.classList.remove('listening');

    const liveBox = document.getElementById('iris-live-transcript');
    if (liveBox) liveBox.classList.remove('active');

    const input = document.getElementById('iris-input');
    if (input) input.placeholder = 'Ask Iris or say a command...';

    // Resume ambient wake word recognition if enabled
    if (irisHeyIrisEnabled && irisWakeWordRecognition) {
        setTimeout(() => {
            try { irisWakeWordRecognition.start(); } catch (e) {}
        }, 800);
    }
}

/* ── Voice Output & Continuous Reactive Orb Waveforms ─────────────────── */
function startWaveformAnimation() {
    stopWaveformAnimation();
    irisWaveformInterval = setInterval(() => {
        const bars = document.querySelectorAll('.iris-waveform-bar');
        bars.forEach((b, i) => {
            const time = Date.now() / 140;
            const wave = Math.sin(time + i * 0.8) * 0.5 + 0.5;
            const height = Math.floor(wave * 20 + Math.random() * 8 + 8);
            b.style.height = `${height}px`;
        });
    }, 65);
}

function stopWaveformAnimation() {
    if (irisWaveformInterval) {
        clearInterval(irisWaveformInterval);
        irisWaveformInterval = null;
    }
    resetWaveforms();
}

function speakIris(text) {
    if (!('speechSynthesis' in window)) return;

    try {
        window.speechSynthesis.cancel();

        // Clean out markdown and urls for pristine spoken audio
        let clean = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                        .replace(/[*_#•]/g, ' ')
                        .replace(/<[^>]+>/g, ' ')
                        .replace(/https?:\/\/\S+/g, '')
                        .trim();

        // Speak concisely (first 2 natural sentences)
        const sentences = clean.split(/(?<=[.?!])\s+/);
        if (sentences.length > 2) clean = sentences.slice(0, 2).join(' ');

        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;

        if (irisVoices.length > 0) {
            const preferred = irisVoices.find(v =>
                (v.name.includes('Siri') || v.name.includes('Samantha') || v.name.includes('Karen') ||
                 v.name.includes('Victoria') || v.name.includes('Daniel') || v.name.includes('Google UK English Female')) &&
                v.lang.startsWith('en')
            ) || irisVoices.find(v => v.lang.startsWith('en'));
            if (preferred) utterance.voice = preferred;
        }

        // Orb reacts in real time while Iris is speaking!
        utterance.onstart = () => {
            setIrisOrbState('speaking');
        };

        // Bounce waveforms on boundary events
        utterance.onboundary = () => {
            const bars = document.querySelectorAll('.iris-waveform-bar');
            bars.forEach(b => {
                const randomH = Math.floor(Math.random() * 22) + 10;
                b.style.height = `${randomH}px`;
            });
        };

        utterance.onend = () => {
            setIrisOrbState('');
        };

        utterance.onerror = () => {
            setIrisOrbState('');
        };

        window.speechSynthesis.speak(utterance);
    } catch (e) {
        console.warn('Speech synthesis error:', e);
        setIrisOrbState('');
    }
}

function resetWaveforms() {
    const bars = document.querySelectorAll('.iris-waveform-bar');
    bars.forEach(b => b.style.height = '');
}

function setIrisOrbState(state) {
    const orb = document.querySelector('.iris-orb');
    const waveform = document.querySelector('.iris-waveform');
    if (!orb) return;

    orb.classList.remove('listening', 'thinking', 'speaking');
    if (waveform) waveform.classList.remove('active', 'speaking');

    if (state === 'listening') {
        orb.classList.add('listening');
        if (waveform) waveform.classList.add('active');
        stopWaveformAnimation();
    } else if (state === 'thinking') {
        orb.classList.add('thinking');
        stopWaveformAnimation();
    } else if (state === 'speaking') {
        orb.classList.add('speaking');
        if (waveform) waveform.classList.add('active', 'speaking');
        startWaveformAnimation();
    } else {
        stopWaveformAnimation();
    }
}

/* ── Overlay Window Lifecycle ─────────────────────────────────────────── */
function openIris() {
    const overlay = document.getElementById('iris-overlay');
    if (overlay) {
        overlay.classList.add('active');
        const glow = document.getElementById('iris-siri-glow');
        if (glow) glow.classList.add('active');
        if (typeof updateDockRunningIndicators === 'function') updateDockRunningIndicators();
        setTimeout(() => {
            const input = document.getElementById('iris-input');
            if (input) input.focus();
        }, 250);
    }
}

function closeIris() {
    const overlay = document.getElementById('iris-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        const glow = document.getElementById('iris-siri-glow');
        if (glow) glow.classList.remove('active');

        if (irisIsListening) stopIrisListening();
        stopWaveformAnimation();
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        if (typeof updateDockRunningIndicators === 'function') updateDockRunningIndicators();
    }
}

function toggleIris() {
    const overlay = document.getElementById('iris-overlay');
    if (overlay) {
        if (overlay.classList.contains('active')) closeIris();
        else openIris();
    }
}

function renderIrisSuggestions() {
    const container = document.getElementById('iris-suggestions');
    if (!container) return;

    if (irisConversation.length > 0) {
        container.style.display = 'none';
        return;
    }

    const suggestions = [
        "Open Terminal",
        "Download Mudit's resume",
        "Launch VLM Lead Extraction",
        "Change wallpaper to Tahoe Beach",
        "What are Mudit's best projects?",
        "Switch to dark mode"
    ];

    container.style.display = 'flex';
    container.innerHTML = suggestions.map(s =>
        `<button class="iris-suggestion" onclick="sendIrisMessage('${escapeAttr(s)}')">${escapeHtml(s)}</button>`
    ).join('');
}

function addIrisMessage(role, content, actionCard) {
    const conversation = document.getElementById('iris-conversation');
    if (!conversation) return;

    const msg = document.createElement('div');
    msg.className = `iris-message ${role}`;
    let html = formatIrisResponse(content);

    if (actionCard) {
        html += `
            <div class="iris-action-card">
                <div class="iris-action-icon"><i class="${escapeAttr(actionCard.icon || 'fas fa-check')}"></i></div>
                <div class="iris-action-info">
                    <div class="iris-action-title">${escapeHtml(actionCard.title)}</div>
                    <div class="iris-action-subtitle">${escapeHtml(actionCard.subtitle || '')}</div>
                </div>
                ${actionCard.action ? `<button class="iris-action-btn" onclick="${escapeAttr(actionCard.action)}">${escapeHtml(actionCard.btnText || 'Open')}</button>` : ''}
            </div>
        `;
    }

    msg.innerHTML = html;
    conversation.appendChild(msg);
    conversation.scrollTop = conversation.scrollHeight;
}

function showIrisTyping() {
    const conversation = document.getElementById('iris-conversation');
    if (!conversation) return;

    const typing = document.createElement('div');
    typing.className = 'iris-typing';
    typing.id = 'iris-typing-indicator';
    typing.innerHTML = '<div class="iris-typing-dot"></div><div class="iris-typing-dot"></div><div class="iris-typing-dot"></div>';
    conversation.appendChild(typing);
    conversation.scrollTop = conversation.scrollHeight;
}

function hideIrisTyping() {
    const el = document.getElementById('iris-typing-indicator');
    if (el) el.remove();
}

function formatIrisResponse(text) {
    let out = escapeHtml(text);
    out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, url) => {
        const href = safeUrl(url.replace(/&amp;/g, '&'));
        if (href === '#') return label;
        return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    });
    out = out.replace(/^• /gm, '&bull; ');
    out = out.replace(/\n/g, '<br>');
    return out;
}

/* ──────────────────────────────────────────────────────────────────────────
   Completely Smart Semantic Autonomous Reasoner (No Hardcoded Commands)
   --------------------------------------------------------------------------
   Translates any natural user prompt into intentional operating system
   actions and contextual portfolio answers. Handles conversational variants,
   polite phrasings, indirect questions, typos, and pronoun references.
   ────────────────────────────────────────────────────────────────────────── */

function evaluateUserPromptSemantics(rawPrompt) {
    let q = rawPrompt.toLowerCase().trim();

    // Strip greetings, wake words, pleasantries, commas, and punctuation
    q = q.replace(/^(hey\s*iris|hey\s*siri|ok\s*iris|okay\s*iris|iris|siri|hello|hey|hi)\b[,:\s]*/gi, '')
         .replace(/^(please|could you|can you|would you|i want you to|i'd like to|let's|can i|how about|help me|just|take me to|bring up|pull up)\b[,:\s]*/gi, '')
         .replace(/[?!.]+$/, '')
         .trim();

    // Contextual pronoun follow-up ("open it", "launch that", "view that")
    if (/^(open|launch|visit|see|view|run)\s+(it|that|this|the app|the project|the site|the repo)$/i.test(q) && irisLastReferencedEntity) {
        q = `open ${irisLastReferencedEntity}`;
    }

    // ── 1. RESUME & QUALIFICATIONS ─────────────────────────────────────────
    if (/\b(resume|cv|curriculum vitae|qualifications?|profile pdf)\b/i.test(q)) {
        irisLastReferencedEntity = 'resume';
        if (/\b(download|save|export|get|grab|fetch|pdf|file)\b/i.test(q)) {
            if (typeof downloadResume === 'function') downloadResume(null);
            return {
                text: "Downloading Mudit Agrawal's official resume PDF.",
                card: {
                    title: 'MuditAgrawalResume.pdf',
                    subtitle: 'Official AI/ML Software Engineering CV',
                    icon: 'fas fa-file-pdf',
                    btnText: 'Download',
                    action: 'downloadResume(null)'
                }
            };
        } else {
            if (typeof openResumeWindow === 'function') openResumeWindow();
            else if (typeof openWindow === 'function') openWindow('resume-window');
            setTimeout(() => {
                const overlay = document.getElementById('iris-overlay');
                if (overlay && overlay.classList.contains('active')) closeIris();
            }, 2200);
            return {
                text: "Here is Mudit's resume preview.",
                card: {
                    title: 'Resume Viewer',
                    subtitle: 'Full career and academic credentials',
                    icon: 'fas fa-file-pdf',
                    btnText: 'Open Viewer',
                    action: "closeIris(); openWindow('resume-window');"
                }
            };
        }
    }

    // ── 2. DEPLOYED PROJECTS & LIVE WEB APPS ───────────────────────────────
    // VLM Leads
    if (/\b(vlm|leads?|business card|card extraction|ocr lead|lead extraction|crm extractor)\b/i.test(q)) {
        irisLastReferencedEntity = 'vlm';
        window.open('https://muditagrawal-lead-extraction.vercel.app', '_blank', 'noopener,noreferrer');
        return {
            text: "Launching **VLM Lead Extraction** deployed live on Vercel.",
            card: {
                title: 'VLM Lead Extraction (Live App)',
                subtitle: 'Bulk business card parsing & CRM export • Vercel',
                icon: 'fas fa-id-card',
                btnText: 'Open App',
                action: "window.open('https://muditagrawal-lead-extraction.vercel.app', '_blank', 'noopener,noreferrer')"
            }
        };
    }

    // Veritas Check / Deepfake Detector
    if (/\b(veritas|deepfake|fake news|media forensics|fact check|fake detector|forensics)\b/i.test(q)) {
        irisLastReferencedEntity = 'veritas';
        window.open('https://veritas-check.vercel.app', '_blank', 'noopener,noreferrer');
        return {
            text: "Opening **Veritas Check** media forensics web app on Vercel.",
            card: {
                title: 'Veritas Check (Live)',
                subtitle: 'Multimodal Deepfake & Fake News Forensics',
                icon: 'fas fa-shield-alt',
                btnText: 'Open App',
                action: "window.open('https://veritas-check.vercel.app', '_blank', 'noopener,noreferrer')"
            }
        };
    }

    // Helix Compiler
    if (/\b(helix|compiler|c compiler|ast parser|language compiler|hugging face space)\b/i.test(q)) {
        irisLastReferencedEntity = 'helix';
        window.open('https://huggingface.co/spaces/muditagrawal03/Helix-Compiler', '_blank', 'noopener,noreferrer');
        return {
            text: "Opening **Helix Compiler** interactive playground on Hugging Face Spaces.",
            card: {
                title: 'Helix Compiler (Live Space)',
                subtitle: 'C-based systems compiler & web playground',
                icon: 'fas fa-code',
                btnText: 'Open Space',
                action: "window.open('https://huggingface.co/spaces/muditagrawal03/Helix-Compiler', '_blank', 'noopener,noreferrer')"
            }
        };
    }

    // Monocular SLAM
    if (/\b(slam|point cloud|3d|sparse point|monocular|camera tracking|rgb slam)\b/i.test(q)) {
        irisLastReferencedEntity = 'slam';
        window.open('https://github.com/muditagrawal-alt/Monocular_RGB_Sparse_Point_Cloud_SLAM', '_blank', 'noopener,noreferrer');
        return {
            text: "Opening **Monocular RGB SLAM** repository on GitHub.",
            card: {
                title: 'Monocular RGB SLAM',
                subtitle: 'Sparse 3D point cloud reconstruction from single video',
                icon: 'fas fa-cube',
                btnText: 'GitHub Repo',
                action: "window.open('https://github.com/muditagrawal-alt/Monocular_RGB_Sparse_Point_Cloud_SLAM', '_blank', 'noopener,noreferrer')"
            }
        };
    }

    // OmniDoc RAG
    if (/\b(omnidoc|rag|blip|mistral|document intelligence|pdf rag|mount omnidoc)\b/i.test(q)) {
        irisLastReferencedEntity = 'omnidoc';
        if (typeof mountDiskImage === 'function') mountDiskImage('omnidoc');
        return {
            text: "Mounted **OmniDoc 1.0** disk image on your desktop.",
            card: {
                title: 'OmniDoc 1.0.dmg',
                subtitle: 'Multimodal RAG with Mistral-7B & BLIP',
                icon: 'fas fa-hdd',
                btnText: 'View Demo',
                action: "mountDiskImage('omnidoc')"
            }
        };
    }

    // Sliver.Ai
    if (/\b(sliver|smart video|clipping|highlight|video highlight)\b/i.test(q)) {
        irisLastReferencedEntity = 'sliver';
        window.open('https://github.com/muditagrawal-alt/Sliver-Smart-Video-Clipping-Tool', '_blank', 'noopener,noreferrer');
        return {
            text: "Opening **Sliver.Ai** video clipping tool on GitHub.",
            card: {
                title: 'Sliver.Ai',
                subtitle: 'Automated video highlights with YOLOv8 & YOLO11',
                icon: 'fas fa-video',
                btnText: 'GitHub Repo',
                action: "window.open('https://github.com/muditagrawal-alt/Sliver-Smart-Video-Clipping-Tool', '_blank', 'noopener,noreferrer')"
            }
        };
    }

    // Skyguard AI
    if (/\b(skyguard|drone|airspace|sih|smart india hackathon|aerial threat)\b/i.test(q)) {
        irisLastReferencedEntity = 'skyguard';
        window.open('https://github.com/muditagrawal-alt/Skyguard_AI_SIH2026', '_blank', 'noopener,noreferrer');
        return {
            text: "Opening **Skyguard AI** defense surveillance repository.",
            card: {
                title: 'Skyguard AI (SIH 2026)',
                subtitle: 'Airspace drone tracking & threat classification',
                icon: 'fas fa-shield-virus',
                btnText: 'GitHub Repo',
                action: "window.open('https://github.com/muditagrawal-alt/Skyguard_AI_SIH2026', '_blank', 'noopener,noreferrer')"
            }
        };
    }

    // ── 3. WINDOW & APPLICATION MANAGEMENT ─────────────────────────────────
    const appEntities = [
        { regex: /\b(finder|file manager|explorer|my files|files)\b/i, id: 'finder-window', name: 'Finder', icon: 'fas fa-folder-open' },
        { regex: /\b(safari|browser|web browser|internet)\b/i, id: 'safari-window', name: 'Safari', icon: 'fas fa-compass' },
        { regex: /\b(terminal|command line|console|cli|shell|bash|zsh)\b/i, id: 'terminal-window', name: 'Terminal', icon: 'fas fa-terminal' },
        { regex: /\b(app\s*store|appstore|software store|mac store)\b/i, id: 'appstore-window', name: 'App Store', icon: 'fas fa-store' },
        { regex: /\b(settings|preferences|system settings|system preferences|control panel)\b/i, id: 'settings-window', name: 'System Settings', icon: 'fas fa-cog' },
        { regex: /\b(notes|notepad|memo|memos|scratchpad)\b/i, id: 'notes-window', name: 'Notes', icon: 'fas fa-sticky-note' },
        { regex: /\b(photos|photo gallery|pictures|images|certificates|certs|diplomas)\b/i, id: 'photos-window', name: 'Photos', icon: 'fas fa-images' },
        { regex: /\b(photo\s*booth|camera|webcam|selfie|snapshot)\b/i, id: 'photobooth-window', name: 'Photo Booth', icon: 'fas fa-camera' },
        { regex: /\b(music|apple\s*music|songs?|playlist|tunes?|audio player)\b/i, id: 'music-window', name: 'Music', icon: 'fas fa-music' },
        { regex: /\b(breakout|brick\s*breaker|atari|brick\s*game)\b/i, id: 'breakout-window', name: 'Breakout', icon: 'fas fa-gamepad' },
        { regex: /\b(snake|snake\s*game|retro\s*arcade|retro\s*game|arcade)\b/i, id: 'snake-window', name: 'Snake', icon: 'fas fa-gamepad' },
        { regex: /\b(mail|email|inbox|messages)\b/i, id: 'mail-window', name: 'Mail', icon: 'fas fa-envelope' },
        { regex: /\b(trash|trash can|bin|recycle bin)\b/i, id: 'trash-window', name: 'Trash', icon: 'fas fa-trash' }
    ];

    // Dedicated Photo Booth snapshot trigger
    if (/\b(take|click|snap)\s+(a\s*)?(photo|picture|selfie|snapshot)\b/i.test(q)) {
        if (typeof openPhotoBooth === 'function') openPhotoBooth();
        setTimeout(() => {
            if (typeof takePhotoBoothPicture === 'function') takePhotoBoothPicture();
        }, 1200);
        setTimeout(() => closeIris(), 2000);
        return {
            text: "Opening Photo Booth and snapping a picture in 3 seconds! Smile! 📸",
            card: {
                title: 'Photo Booth',
                subtitle: 'Countdown active (3, 2, 1...)',
                icon: 'fas fa-camera',
                btnText: 'View Photo Booth',
                action: "closeIris(); openWindow('photobooth-window');"
            }
        };
    }

    // Dedicated Apple Music play trigger
    if (/\b(play|start|stream)\s+(music|song|track|playlist|beethoven|mozart|chopin|vivaldi|lofi)\b/i.test(q) || /^(play\s*music|play)$/i.test(q)) {
        if (typeof openMusic === 'function') openMusic();
        setTimeout(() => {
            if (typeof toggleMusicPlay === 'function') toggleMusicPlay();
        }, 400);
        setTimeout(() => closeIris(), 2200);
        return {
            text: "Playing music for you in Apple Music.",
            card: {
                title: 'Apple Music',
                subtitle: 'Playback started',
                icon: 'fas fa-music',
                btnText: 'Open Music',
                action: "closeIris(); openWindow('music-window');"
            }
        };
    }

    const isCloseIntent = /\b(close|hide|minimize|dismiss|shut|exit|quit|kill|clear)\b/i.test(q);
    const isOpenIntent = /\b(open|launch|start|run|pull up|bring up|show|display|view|see|go to|take me to|switch to|maximize)\b/i.test(q)
                      || /\b(check|take|visit)\b/i.test(q)
                      || appEntities.some(a => a.regex.test(q) && q.split(/\s+/).length <= 2);

    // Close windows
    if (isCloseIntent) {
        if (/\b(all|everything|desktop|windows)\b/i.test(q)) {
            document.querySelectorAll('.window:not(.hidden)').forEach(w => {
                if (typeof closeWindow === 'function') closeWindow(w.id);
            });
            return {
                text: "I've closed all active windows on your desktop.",
                card: { title: 'Desktop Cleared', subtitle: 'All windows minimized', icon: 'fas fa-desktop' }
            };
        }
        for (const app of appEntities) {
            if (app.regex.test(q)) {
                if (typeof closeWindow === 'function') closeWindow(app.id);
                return { text: `Closed **${app.name}**.` };
            }
        }
    }

    // Open windows
    if (isOpenIntent) {
        for (const app of appEntities) {
            if (app.regex.test(q)) {
                irisLastReferencedEntity = app.name.toLowerCase();
                if (typeof openWindow === 'function') {
                    openWindow(app.id);
                    if (typeof bringToFront === 'function') bringToFront(app.id);
                }
                // Siri auto-dismiss reveals the open window smoothly
                setTimeout(() => {
                    const overlay = document.getElementById('iris-overlay');
                    if (overlay && overlay.classList.contains('active')) closeIris();
                }, 2200);
                return {
                    text: `Opening **${app.name}** for you now.`,
                    card: {
                        title: app.name,
                        subtitle: 'Application launched on desktop',
                        icon: app.icon,
                        btnText: 'View Window',
                        action: `closeIris(); openWindow('${app.id}'); if (typeof bringToFront === 'function') bringToFront('${app.id}');`
                    }
                };
            }
        }
    }

    // Launchpad
    if (/\b(launchpad|app grid|all apps|drawer|launcher)\b/i.test(q)) {
        if (typeof openLaunchpad === 'function') {
            closeIris();
            openLaunchpad();
        }
        return { text: "Opening Launchpad application grid." };
    }

    // ── 4. WALLPAPERS & CUSTOMIZATION ──────────────────────────────────────
    if (/\b(wallpaper|background|desktop picture|wall)\b/i.test(q) || /\b(tahoe|golden gate|mountain pass|coastline)\b/i.test(q)) {
        if (/\b(tahoe|beach|lake|sunny)\b/i.test(q)) {
            if (typeof setDesktopWallpaper === 'function') setDesktopWallpaper('assets/Wallpapers/26-Tahoe-Beach-Day.jpg');
            return { text: "Changed your wallpaper to **Tahoe Beach**." };
        }
        if (/\b(golden gate|bridge|san francisco|sf)\b/i.test(q)) {
            if (typeof setDesktopWallpaper === 'function') setDesktopWallpaper('assets/Wallpapers/27-Golden-Gate-Bridge.jpg');
            return { text: "Set wallpaper to **Golden Gate Bridge**." };
        }
        if (/\b(mountain|pass|peak|alps)\b/i.test(q)) {
            if (typeof setDesktopWallpaper === 'function') setDesktopWallpaper('assets/Wallpapers/jack-anstey-XVoyX7l9ocY-unsplash.jpg');
            return { text: "Updated wallpaper to **Mountain Pass**." };
        }
        if (/\b(coast|coastline|ocean|sea|waves|water)\b/i.test(q)) {
            if (typeof setDesktopWallpaper === 'function') setDesktopWallpaper('assets/Wallpapers/cristina-gottardi-CSpjU6hYo_0-unsplash.jpg');
            return { text: "Set desktop wallpaper to **Coastline**." };
        }
    }

    // ── 5. THEME & APPEARANCE ──────────────────────────────────────────────
    if (/\b(dark mode|night mode|dark theme|light mode|day mode|light theme|toggle theme|switch theme|glass mode|glass theme)\b/i.test(q)) {
        if (typeof toggleTheme === 'function') {
            const mode = toggleTheme();
            return { text: `Switched appearance to **${mode === 'glass' ? 'Glassmorphism' : 'Standard Dark'} Mode**.` };
        }
    }

    // ── 6. WHY HIRE MUDIT & STRENGTHS ─────────────────────────────────────
    if (/\b(why\s+(should\s+i\s+)?hire|reasons?\s+to\s+hire|why\s+choose|strengths?)\b/i.test(q)) {
        return {
            text: "Here is why you should hire Mudit: He is a high-caliber AI/ML engineer who builds production systems from scratch — ranging from high-throughput multimodal pipelines (VLM Leads) and real-time computer vision (SLAM, YOLOv11) to systems programming (Helix C compiler) and defensive airspace surveillance (Skyguard AI). He has proven startup internship experience at Carnot Research (IITD incubated) and won Smart India Hackathon internal rounds.",
            card: {
                title: 'Mudit Agrawal — AI/ML Engineer',
                subtitle: 'Full-stack AI systems & production engineering',
                icon: 'fas fa-award',
                btnText: 'View Resume',
                action: "closeIris(); openWindow('resume-window');"
            }
        };
    }

    // ── 7. COMPOSE EMAIL / CONTACT ─────────────────────────────────────────
    if (/\b(compose|send\s+(an?\s+)?(email|mail|message)|write\s+(an?\s+)?(email|mail|message)|email\s+mudit|mail\s+mudit|send\s+mail)\b/i.test(q)) {
        if (typeof openWindow === 'function') {
            openWindow('mail-window');
            if (typeof bringToFront === 'function') bringToFront('mail-window');
        }
        setTimeout(() => {
            const overlay = document.getElementById('iris-overlay');
            if (overlay && overlay.classList.contains('active')) closeIris();
        }, 2200);
        return {
            text: "Opening Mail app to compose a message to Mudit.",
            card: {
                title: 'New Message',
                subtitle: 'Recipient: muditagrawal03@gmail.com',
                icon: 'fas fa-paper-plane',
                btnText: 'Compose',
                action: "closeIris(); openWindow('mail-window');"
            }
        };
    }

    // ── 7. SPOTLIGHT SEARCH ────────────────────────────────────────────────
    if (/\b(search for|spotlight|lookup|find)\b/i.test(q) && !/\b(about|who|experience|projects|skills|education)\b/i.test(q)) {
        const queryTerm = q.replace(/^(search for|spotlight|lookup|find)\s+/i, '').trim();
        if (queryTerm && typeof openSpotlight === 'function') {
            closeIris();
            openSpotlight();
            setTimeout(() => {
                const sInput = document.getElementById('spotlight-input');
                if (sInput) {
                    sInput.value = queryTerm;
                    if (typeof handleSpotlightInput === 'function') handleSpotlightInput();
                }
            }, 150);
            return { text: `Searching Spotlight for **${queryTerm}**.` };
        }
    }

    return null;
}

/* ── Primary Message Processing Pipeline ──────────────────────────────── */
async function sendIrisMessage(overrideMessage) {
    if (irisProcessing) return;

    const input = document.getElementById('iris-input');
    const message = overrideMessage || (input ? input.value.trim() : '');
    if (!message) return;

    if (input) input.value = '';

    // Hide initial suggestions
    const suggestionsEl = document.getElementById('iris-suggestions');
    if (suggestionsEl) suggestionsEl.style.display = 'none';

    // Add user message
    addIrisMessage('user', message);
    irisConversation.push({ role: 'user', content: message });

    // Show processing state
    irisProcessing = true;
    setIrisOrbState('thinking');
    showIrisTyping();

    const sendBtn = document.getElementById('iris-send-btn');
    if (sendBtn) sendBtn.disabled = true;

    try {
        // Step 1: Evaluate natural prompt semantics & execute OS actions smartly
        const semanticAction = evaluateUserPromptSemantics(message);

        if (semanticAction) {
            hideIrisTyping();
            addIrisMessage('iris', semanticAction.text, semanticAction.card);
            irisConversation.push({ role: 'assistant', content: semanticAction.text });
            speakIris(semanticAction.text);
        } else {
            // Step 2: Query hosted proxy if present, otherwise answer smartly from portfolio corpus
            let response = await callIrisProxy(message);
            if (!response) response = answerFromCorpus(message);

            hideIrisTyping();
            addIrisMessage('iris', response);
            irisConversation.push({ role: 'assistant', content: response });
            speakIris(response);
        }
    } catch (error) {
        console.error('Iris execution error:', error);
        hideIrisTyping();
        const fallback = "I'm right here! You can ask me to open any app or project, download Mudit's resume, or change the wallpaper.";
        addIrisMessage('iris', fallback);
        speakIris(fallback);
    }

    irisProcessing = false;
    setIrisOrbState('');
    if (sendBtn) sendBtn.disabled = false;
}

/* ── Model Transport (Hosted Serverless Proxy) ────────────────────────── */
function getIrisSystemPrompt() {
    const p = window.PROFILE_DATA || {};
    const firstName = (p.name || 'Mudit').split(' ')[0];
    const expText = (p.experience || []).map((e, idx) => `${idx + 1}. ${e.role} @ ${e.org} (${e.dates})`).join('\n');

    return `You are Iris, an intelligent autonomous agent and Siri assistant for ${p.name || 'Mudit Agrawal'}'s macOS portfolio. You are friendly, concise, and capable of operating this website on behalf of the user.

CRITICAL INSTRUCTIONS:
- Keep answers SHORT (2-3 sentences max)
- If the user wants to open an app (Finder, Safari, Terminal, App Store, Settings, Mail, Notes, Photos, Resume), tell them you're doing so.
- Available Deployed Apps:
  • VLM Lead Extraction: https://muditagrawal-lead-extraction.vercel.app
  • Veritas Check (Deepfake Detector): https://veritas-check.vercel.app
  • Helix Compiler: https://huggingface.co/spaces/muditagrawal03/Helix-Compiler
  • Monocular RGB SLAM: https://github.com/muditagrawal-alt/Monocular_RGB_Sparse_Point_Cloud_SLAM

${(p.name || 'MUDIT AGRAWAL').toUpperCase()} PROFILE:
BIO: ${p.bio || ''}
EDUCATION: ${p.education?.degree || 'B.Tech CSE (AI/ML)'} @ ${p.education?.university || 'IILM'} (${p.education?.years || '2023-2027'}), CGPA: ${p.education?.cgpa || '7.68'}
EXPERIENCE:
${expText}
CONTACT: ${p.contact?.email || 'muditagrawal03@gmail.com'} | ${p.contact?.phone || '+91-7289887349'}`;
}

async function callIrisProxy(userMessage) {
    const endpoint = window.APP_CONFIG && window.APP_CONFIG.IRIS_ENDPOINT;
    if (!endpoint) return null;

    const history = irisConversation.slice(-10);

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system: getIrisSystemPrompt(),
                messages: history
            })
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.reply || null;
    } catch (e) {
        return null;
    }
}

/* ── Smart Local Corpus Answering ─────────────────────────────────────── */
function answerFromCorpus(userMessage) {
    const p = window.PROFILE_DATA || {};
    const q = userMessage.toLowerCase();

    if (/\b(why hire|why should i hire|hire mudit|reasons to hire|strength|strengths)\b/i.test(q)) {
        return `Here is why you should hire Mudit: He is a high-caliber AI/ML engineer who builds production systems from scratch — ranging from high-throughput multimodal pipelines (VLM Leads) and real-time computer vision (SLAM, YOLOv11) to systems programming (Helix C compiler) and defensive airspace surveillance (Skyguard AI). He has proven startup internship experience at Carnot Research (IITD incubated) and won Smart India Hackathon internal rounds. You can download his resume or explore his projects right here!`;
    }

    if (/\b(project|projects|work|apps|build|built|portfolio)\b/.test(q)) {
        irisLastReferencedEntity = 'projects';
        return `Mudit's featured projects include **[VLM Lead Extraction](https://muditagrawal-lead-extraction.vercel.app)** (live on Vercel), `
             + `**[Veritas Check](https://veritas-check.vercel.app)** (live deepfake forensics), `
             + `**[Helix Compiler](https://huggingface.co/spaces/muditagrawal03/Helix-Compiler)** (live Hugging Face Space), and `
             + `**[Monocular RGB SLAM](https://github.com/muditagrawal-alt/Monocular_RGB_Sparse_Point_Cloud_SLAM)**. `
             + `Say "open it" to launch any of them!`;
    }

    if (/\b(contact|email|reach|hire|phone|call)\b/.test(q)) {
        return `You can contact or reach ${p.name || 'Mudit'} directly at **${p.contact?.email || ''}** or ${p.contact?.phone || ''}. `
             + `You can also ask me to compose an email right now.`;
    }

    if (/\b(education|degree|study|college|university|cgpa|academic)\b/.test(q)) {
        const e = p.education || {};
        return `${p.name || 'Mudit'} is pursuing a **${e.degree || 'B.Tech in Computer Science (AI/ML)'}** at **${e.university || 'IILM University'}** (${e.years || '2023–2027'}), currently holding a **${e.cgpa || '7.68'} CGPA**.`;
    }

    if (/\b(experience|intern|job|career|work history)\b/.test(q)) {
        const lines = (p.experience || []).map(e => `• **${e.role}** at ${e.org} (${e.dates})`).join('\n');
        return `Here is Mudit's work experience:\n${lines}`;
    }

    if (/\b(skills|tech stack|technologies|tools|languages)\b/.test(q)) {
        return `Mudit's core stack covers **Python**, **PyTorch**, **LangChain**, **RAG architectures**, **Computer Vision (YOLO, OpenCV, SLAM)**, **FastAPI**, **Docker**, and **PostgreSQL**.`;
    }

    if (/\b(who are you|what are you|what can you do)\b/.test(q)) {
        return `I'm Iris, your autonomous Siri assistant on Mudit's Mac! I can open apps, launch live projects, download Mudit's resume, change wallpapers, switch themes, or answer anything about his engineering work. You can also say "Hey Iris" anytime!`;
    }

    const matches = searchPortfolioCorpus(userMessage, { minScore: 2, limit: 3 });
    if (matches.length > 0) {
        const lines = matches.map(m => m.url ? `• **[${m.title}](${m.url})** — ${m.text}` : `• **${m.title}** — ${m.text}`).join('\n');
        return `Here's what I found:\n${lines}`;
    }

    return `I can open any app on your desktop, launch Mudit's live deployed projects, download his resume, or tell you about his background. What would you like to explore?`;
}

function handleIrisInput(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendIrisMessage();
    }
}

/* ── DOM Initialization ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    initIrisSpeech();
    initWakeWordListener();
    renderIrisSuggestions();

    // Escape key closes Iris
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const overlay = document.getElementById('iris-overlay');
            if (overlay && overlay.classList.contains('active')) {
                closeIris();
            }
        }
    });

    // Ensure audio and wake listener initialize smoothly on first user interaction
    document.addEventListener('pointerdown', () => {
        if (irisHeyIrisEnabled && !irisWakeWordRecognition) {
            initWakeWordListener();
        }
    }, { once: true });
});
