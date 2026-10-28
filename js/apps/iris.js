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
// The microphone is opt-in (System Settings ▸ Siri & Iris, or the pill in
// the Iris overlay). It used to start listening on page load, which pops a
// browser microphone prompt before the visitor has done anything.
let irisHeyIrisEnabled = false;
let irisLastInputWasVoice = false;
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
                // A wake *phrase*, not the bare word — "iris" alone fired on
                // any sentence that mentioned the name.
                const wakeMatch = text.match(/\b(hey\s*iris|hey\s*siri|ok(ay)?\s*iris)\b/i);

                if (wakeMatch) {
                    playSiriChime('wake');
                    openIris();

                    // Check if the user already spoke a command right after the wake word: e.g. "Hey Iris open terminal"
                    const remaining = text.slice(wakeMatch.index + wakeMatch[0].length).replace(/^[,.\s]+/, '').trim();
                    if (remaining.length > 2) {
                        const input = document.getElementById('iris-input');
                        if (input) input.value = remaining;
                        irisLastInputWasVoice = true;
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
    const next = !irisHeyIrisEnabled;
    // Persist through Settings so the pill and the Settings switch agree.
    if (typeof setPreference === 'function') setPreference('heyIris', next);
    else setHeyIrisEnabled(next);
}

/** Single switch for the wake-word listener (Settings calls this). */
function setHeyIrisEnabled(enabled) {
    irisHeyIrisEnabled = Boolean(enabled);
    updateWakeStatusUI(irisHeyIrisEnabled);
    if (irisHeyIrisEnabled) {
        initWakeWordListener();
    } else if (irisWakeWordRecognition) {
        try { irisWakeWordRecognition.onend = null; irisWakeWordRecognition.abort(); } catch (e) { /* already stopped */ }
        irisWakeWordRecognition = null;
    }
}
window.setHeyIrisEnabled = setHeyIrisEnabled;

function updateWakeStatusUI(active) {
    const statusPill = document.getElementById('iris-wake-status');
    if (!statusPill) return;
    statusPill.classList.toggle('listening', active);
    statusPill.setAttribute('aria-pressed', String(active));
    statusPill.title = active ? 'Listening for “Hey Iris” — click to turn off' : 'Click to let Iris listen for “Hey Iris” (uses your microphone)';
    statusPill.innerHTML = active
        ? '<i class="fas fa-microphone"></i> <span>Listening for “Hey Iris”</span>'
        : '<i class="fas fa-microphone-slash"></i> <span>“Hey Iris” is off</span>';
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
                    irisLastInputWasVoice = true;
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
                    irisLastInputWasVoice = true;
                    sendIrisMessage(textToSend);
                } else {
                    stopIrisListening();
                }
            };
        } catch (e) {
            console.warn('SpeechRecognition init error:', e);
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
    if (!window.IrisVoice) return;
    // Talk back when spoken to. Reading every typed answer aloud surprised
    // visitors in quiet offices; that's now an opt-in setting.
    const speakTyped = typeof window.getPreference === 'function' && window.getPreference('speakTyped');
    if (!irisLastInputWasVoice && !speakTyped) return;

    IrisVoice.speak(text, {
        // Orb reacts in real time while Iris is speaking!
        onstart: () => setIrisOrbState('speaking'),
        // Bounce waveforms on boundary events
        onboundary: () => {
            document.querySelectorAll('.iris-waveform-bar').forEach(b => {
                b.style.height = `${Math.floor(Math.random() * 22) + 10}px`;
            });
        },
        onend: () => setIrisOrbState('')
    });
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
        if (window.IrisVoice) IrisVoice.stop();
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

    // No canned questions: Iris understands whatever the visitor types.
    container.style.display = 'none';
    container.innerHTML = '';
}

function addIrisMessage(role, content, actionCard, sources) {
    const conversation = document.getElementById('iris-conversation');
    if (!conversation) return;

    const msg = document.createElement('div');
    msg.className = `iris-message ${role}`;
    const body = document.createElement('div');
    body.className = 'iris-message-body';
    msg.appendChild(body);

    let tail = '';
    if (actionCard) {
        tail += `
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
    if (sources && sources.length) {
        tail += `<div class="iris-sources"><span class="iris-sources-label">Sources</span>${sources.map((s, i) =>
            `<button type="button" class="iris-source" data-i="${i}" ${s.open ? '' : 'disabled'}>${escapeHtml(s.label)}</button>`).join('')}</div>`;
    }

    conversation.appendChild(msg);
    const finish = () => {
        body.innerHTML = formatIrisResponse(content);
        if (tail) {
            msg.insertAdjacentHTML('beforeend', tail);
            msg.querySelectorAll('.iris-source').forEach(btn => {
                const src = sources[Number(btn.dataset.i)];
                if (src && src.open) btn.addEventListener('click', () => { closeIris(); src.open(); });
            });
        }
        conversation.scrollTop = conversation.scrollHeight;
    };

    // Iris "types" its answer word by word, like Siri; instant with reduced motion.
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (role !== 'iris' || reduce || content.length < 40) { finish(); return; }
    const words = content.split(/(\s+)/);
    let i = 0;
    const step = () => {
        i = Math.min(words.length, i + 3);
        body.innerHTML = formatIrisResponse(words.slice(0, i).join(''));
        conversation.scrollTop = conversation.scrollHeight;
        if (i < words.length) setTimeout(step, 16);
        else finish();
    };
    step();
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
    // Accent-insensitive: "résumé" should match /resume/.
    let q = rawPrompt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    // Strip greetings, wake words, pleasantries, commas, and punctuation
    q = q.replace(/^(hey\s*iris|hey\s*siri|ok\s*iris|okay\s*iris|iris|siri|hello|hey|hi)\b[,:\s]*/gi, '')
         .replace(/^(please|could you|can you|would you|i want you to|i'd like to|let's|can i|how about|help me|just|take me to|bring up|pull up)\b[,:\s]*/gi, '')
         .replace(/[?!.]+$/, '')
         .trim();

    // Contextual pronoun follow-up ("open it", "launch that", "view that")
    if (/^(open|launch|visit|see|view|run)\s+(it|that|this|the app|the project|the site|the repo)$/i.test(q) && irisLastReferencedEntity) {
        q = `open ${irisLastReferencedEntity}`;
    }

    // Dark mode: the Mac is always dark here. Say so honestly, and offer the
    // option that does exist, instead of silently toggling Frosted Glass.
    if (/\b(dark|light|night|day) (mode|theme)\b/i.test(q)) {
        const glass = typeof currentThemeMode === 'function' && currentThemeMode() === 'glass';
        return {
            text: /\b(light|day)\b/i.test(q)
                ? "This Mac only comes in dark, I'm afraid — but Frosted Glass makes the windows lighter and more translucent."
                : "You're already in dark mode — it's the only mode here. Want Frosted Glass for more translucent windows?",
            card: { title: 'Frosted Glass', subtitle: glass ? 'Currently on' : 'Currently off', icon: 'fas fa-circle-half-stroke', btnText: glass ? 'Turn Off' : 'Turn On', action: 'toggleTheme()' }
        };
    }

    // Only imperatives act. Questions ("what is RAG?", "what is VLM Leads?")
    // used to mount disk images and open tabs because a keyword matched.
    const IMPERATIVE = /^(open|launch|start|run|show|display|view|play|pause|stop|resume|download|save|get|grab|fetch|change|set|switch|turn|take|snap|click|close|quit|hide|minimi[sz]e|maximi[sz]e|mount|go to|go|visit|bring up|pull up|email|compose|write|send|search( for)?|find|look up|lookup|lock|empty|put)\b/i;
    if (!IMPERATIVE.test(q)) return null;

    // ── 1. RESUME & QUALIFICATIONS ─────────────────────────────────────────
    if (/\b(resume|cv|curriculum vitae|qualifications?|profile pdf)\b/i.test(q)) {
        irisLastReferencedEntity = 'resume';
        if (/\b(download|save|export|get|grab|fetch|pdf|file)\b/i.test(q)) {
            if (typeof downloadResume === 'function') downloadResume(null);
            return {
                text: `Downloading ${window.PROFILE_DATA.name}’s résumé (PDF).`,
                card: {
                    title: window.PROFILE_DATA.resume.downloadName || 'Résumé',
                    subtitle: 'Résumé · PDF',
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
                text: `Here is ${window.PROFILE_DATA.first}’s résumé.`,
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

    // ── 2. THE OWNER'S PROJECTS ───────────────────────────────────────────
    // "open <project>": a project with a demo mounts its disk image, a live
    // one opens the app, anything else opens its repository.
    {
        const norm = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const nq = norm(q);
        const project = window.PROFILE_DATA.projects.find(x => {
            const n = norm(x.name).replace(/ai$/, '');
            return (n.length > 2 && nq.includes(n)) || x.aliases.some(a => q.toLowerCase().includes(a.toLowerCase()));
        });
        if (project) {
            irisLastReferencedEntity = project.id;
            const target = project.link || project.repo;
            if (project.demo && typeof mountDiskImage === 'function') {
                mountDiskImage(project.id);
                return {
                    text: `Mounted **${project.name} 1.0** disk image on your desktop.`,
                    card: { title: `${project.name} 1.0.dmg`, subtitle: project.subtitle, icon: 'fas fa-hdd', btnText: 'View Demo', action: `mountDiskImage('${escapeAttr(project.id)}')` }
                };
            }
            if (target) {
                window.open(target, '_blank', 'noopener,noreferrer');
                return {
                    text: `Opening **${project.name}**${project.live ? ' — live' : ' on GitHub'}.`,
                    card: { title: project.live ? `${project.name} (Live)` : project.name, subtitle: project.subtitle, icon: project.live ? 'fas fa-globe' : 'fas fa-code-branch', btnText: project.live ? 'Open App' : 'View Code', action: `openExternal('${escapeAttr(target)}')` }
                };
            }
        }
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

    // ── 7. COMPOSE EMAIL / CONTACT ─────────────────────────────────────────
    const ownerFirst = window.PROFILE_DATA.first.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (/\b(compose|send\s+(an?\s+)?(email|mail|message)|write\s+(an?\s+)?(email|mail|message)|send\s+mail)\b/i.test(q) || new RegExp(`\\b(e?mail|message|write to)\\s+(${ownerFirst}|him|her|them)\\b`, 'i').test(q)) {
        if (typeof openWindow === 'function') {
            openWindow('mail-window');
            if (typeof bringToFront === 'function') bringToFront('mail-window');
        }
        setTimeout(() => {
            const overlay = document.getElementById('iris-overlay');
            if (overlay && overlay.classList.contains('active')) closeIris();
        }, 2200);
        return {
            text: `Opening Mail to write to ${window.PROFILE_DATA.first}.`,
            card: {
                title: 'New Message',
                subtitle: `Recipient: ${window.PROFILE_DATA.contact.email || window.PROFILE_DATA.name}`,
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
            // Grounded answer: retrieve passages from the portfolio, then
            // either let the hosted model phrase them or compose locally.
            const answer = await IrisClient.ask(message, { history: irisConversation.slice(-7, -1) });
            hideIrisTyping();
            const card = answer.action ? irisActionCard(answer.action) : answer.card;
            addIrisMessage('iris', answer.text, card, answer.sources);
            irisConversation.push({ role: 'assistant', content: answer.text });
            speakIris(answer.text);
        }
    } catch (error) {
        console.error('Iris execution error:', error);
        hideIrisTyping();
        const fallback = `I'm right here! You can ask me to open any app or project, download ${window.PROFILE_DATA.first}'s résumé, or change the wallpaper.`;
        addIrisMessage('iris', fallback);
        speakIris(fallback);
    }

    irisProcessing = false;
    irisLastInputWasVoice = false;
    setIrisOrbState('');
    if (sendBtn) sendBtn.disabled = false;
}

/* ── Actions the model asks for ([[open:maps:…]]) ──────────────────────────
   Cards run a numbered entry from this list, never text from the model. */
const irisActions = [];
const IRIS_MAC_ACTIONS = {
    about: ['fas fa-user', 'About', () => openWelcome()],
    resume: ['fas fa-file-lines', 'Résumé', () => openResumeWindow()],
    projects: ['fas fa-cube', 'Projects', (t) => (t && typeof openProjectDetails === 'function' ? openProjectDetails(t) : openWindow('appstore-window'))],
    maps: ['fas fa-map-location-dot', 'Map', (t) => openIrisPlace(t)],
    mail: ['fas fa-envelope', 'Mail', () => { openWindow('mail-window'); openMailCompose(); }],
    photos: ['fas fa-images', 'Photos', () => openWindow('photos-window')],
    notes: ['fas fa-note-sticky', 'Notes', () => openWindow('notes-window')],
    music: ['fas fa-music', 'Music', () => openMusic()],
    camera: ['fas fa-camera', 'Photo Booth', () => openPhotoBooth()],
    games: ['fas fa-gamepad', 'Snake', () => openSnake()],
    settings: ['fas fa-gear', 'System Settings', () => openWindow('settings-window')],
    // The iPhone's Wallet holds the certificates; on the Mac they're in Photos.
    wallet: ['fas fa-award', 'Certificates', () => openWindow('photos-window')]
};

/** The Mac has no Maps app: a place opens on OpenStreetMap. */
function openIrisPlace(name) {
    const want = String(name || '').toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 1);
    const places = window.PROFILE_DATA.places || [];
    const score = (x) => want.filter(w => `${x.title} ${x.place.label}`.toLowerCase().includes(w)).length;
    const best = places.slice().sort((a, b) => score(b) - score(a))[0];
    if (best && score(best) > 0) openExternal(best.url);
    else if (places[0]) openExternal(places[0].url);
}

function irisActionCard(action) {
    const entry = IRIS_MAC_ACTIONS[action.app];
    if (!entry) return null;
    const index = irisActions.push(() => entry[2](action.target)) - 1;
    return { icon: entry[0], title: action.target || entry[1], subtitle: `Open ${entry[1]}`, btnText: 'Open', action: `irisRunAction(${index})` };
}

function irisRunAction(index) {
    const run = irisActions[Number(index)];
    if (typeof run === 'function') { closeIris(); run(); }
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
    renderIrisSuggestions();

    // Respect a previous opt-in, but never touch the microphone before the
    // visitor has interacted with the page.
    const optedIn = typeof window.getPreference === 'function' && window.getPreference('heyIris');
    updateWakeStatusUI(false);
    if (optedIn) {
        document.addEventListener('pointerdown', () => setHeyIrisEnabled(true), { once: true });
    }

    // Escape key closes Iris
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const overlay = document.getElementById('iris-overlay');
            if (overlay && overlay.classList.contains('active')) {
                closeIris();
            }
        }
    });
});
