/* ==========================================================================
   Iris AI Assistant Controller
   Groq Cloud API (Primary) + Gemini (Fallback)
   Pre-loaded with full portfolio knowledge base
   ========================================================================== */

let irisConversation = [];
let irisProcessing = false;

function getIrisSystemPrompt() {
    const p = window.PROFILE_DATA || {};
    const firstName = (p.name || 'Mudit').split(' ')[0];
    const expText = (p.experience || []).map((e, idx) => `${idx + 1}. ${e.role} @ ${e.org} (${e.dates})`).join('\n');

    return `You are Iris, an AI assistant embedded in ${p.name || 'Mudit Agrawal'}'s macOS-themed portfolio website. You are warm, concise, professional and helpful. You know EVERYTHING about ${firstName} and can answer any question about him.

CRITICAL RULES:
- Keep responses SHORT (2-4 sentences max unless asked for details)
- Be conversational and friendly, not robotic
- If asked about things unrelated to ${firstName}, politely redirect to discussing his work
- Use markdown-like formatting: **bold** for emphasis, bullet points with •
- When mentioning projects, include links in format: [ProjectName](URL)
- Always refer to yourself as "Iris" (not Siri, not an AI)

${(p.name || 'MUDIT AGRAWAL').toUpperCase()} — COMPLETE PROFILE:

**TAGLINE:** ${p.tagline || ''}

**BIO:** ${p.bio || ''}

**EDUCATION:**
• ${p.education?.degree || 'B.Tech CSE (AI/ML)'} — ${p.education?.university || 'IILM University'} (${p.education?.years || '2023-2027'}), CGPA: ${p.education?.cgpa || ''}
• Class 12 — Navy Children School, New Delhi (2023), 74%
• Class 10 — Navy Children School, Mumbai (2021), 89%

**CERTIFICATIONS:**
• Machine Learning Specialization — Stanford University (DeepLearning.AI)
• Python Specialisation — University of Michigan
• Technology Job Simulation — Deloitte
• Java Programming and OOP — Duke University

**WORK EXPERIENCE:**
${expText}

**CONTACT:**
• Email: ${p.contact?.email || 'muditagrawal03@gmail.com'}
• Phone: ${p.contact?.phone || '+91-7289887349'}
• LinkedIn: ${p.contact?.linkedin || ''}
• GitHub: ${p.contact?.github || ''}

**PHILOSOPHY:** Values context awareness, robustness (building systems that hold up outside sandboxes), speed of iteration (prototype quickly, evaluate rigorously, refactor thoughtfully). Believes tech is only as good as the problem it solves.

**ABOUT THIS WEBSITE:** This is a macOS-themed portfolio built with pure HTML, CSS, and JavaScript — no frameworks. Features include a working Finder, Mail app with EmailJS, Safari browser, Terminal, Notes, App Store, System Settings with wallpapers, and you — Iris, the AI assistant.`;
}

const IRIS_SUGGESTIONS = [
    "What are Mudit's best projects?",
    "Tell me about his experience",
    "What skills does he have?",
    "How can I contact Mudit?",
    "What's his education?",
    "Why should I hire Mudit?"
];

function openIris() {
    const overlay = document.getElementById('iris-overlay');
    if (overlay) {
        overlay.classList.add('active');
        if (typeof updateDockRunningIndicators === 'function') updateDockRunningIndicators();
        setTimeout(() => {
            const input = document.getElementById('iris-input');
            if (input) input.focus();
        }, 300);
    }
}

function closeIris() {
    const overlay = document.getElementById('iris-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        if (typeof updateDockRunningIndicators === 'function') updateDockRunningIndicators();
    }
}

function toggleIris() {
    const overlay = document.getElementById('iris-overlay');
    if (overlay) {
        if (overlay.classList.contains('active')) {
            closeIris();
        } else {
            openIris();
        }
    }
}

function renderIrisSuggestions() {
    const container = document.getElementById('iris-suggestions');
    if (!container) return;

    if (irisConversation.length > 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';
    container.innerHTML = IRIS_SUGGESTIONS.map(s =>
        `<button class="iris-suggestion" onclick="sendIrisMessage('${escapeAttr(s)}')">${escapeHtml(s)}</button>`
    ).join('');
}

function addIrisMessage(role, content) {
    const conversation = document.getElementById('iris-conversation');
    if (!conversation) return;

    const msg = document.createElement('div');
    msg.className = `iris-message ${role}`;
    msg.innerHTML = formatIrisResponse(content);
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

function setIrisOrbState(state) {
    const orb = document.querySelector('.iris-orb');
    const waveform = document.querySelector('.iris-waveform');
    if (!orb) return;

    orb.classList.remove('listening', 'thinking');
    if (waveform) waveform.classList.remove('active');

    if (state === 'listening') {
        orb.classList.add('listening');
        if (waveform) waveform.classList.add('active');
    } else if (state === 'thinking') {
        orb.classList.add('thinking');
    }
}

function formatIrisResponse(text) {
    // Escape FIRST, then re-introduce only the markup we control. Previously
    // raw text (both model output and the visitor's own message) went straight
    // to innerHTML, and the [label](url) rule built <a href> with no scheme
    // check — so `javascript:` links executed.
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

async function sendIrisMessage(overrideMessage) {
    if (irisProcessing) return;

    const input = document.getElementById('iris-input');
    const message = overrideMessage || (input ? input.value.trim() : '');
    if (!message) return;

    if (input) input.value = '';

    // Hide suggestions after first message
    const suggestionsEl = document.getElementById('iris-suggestions');
    if (suggestionsEl) suggestionsEl.style.display = 'none';

    // Add user message
    addIrisMessage('user', message);
    irisConversation.push({ role: 'user', content: message });

    // Set thinking state
    irisProcessing = true;
    setIrisOrbState('thinking');
    showIrisTyping();

    const sendBtn = document.getElementById('iris-send-btn');
    if (sendBtn) sendBtn.disabled = true;

    try {
        // Hosted model when a proxy is configured; local corpus otherwise.
        let response = await callIrisProxy(message);
        if (!response) response = answerFromCorpus(message);

        hideIrisTyping();
        addIrisMessage('iris', response);
        irisConversation.push({ role: 'assistant', content: response });

    } catch (error) {
        console.error('Iris error:', error);
        hideIrisTyping();
        addIrisMessage('iris', "I seem to be having a moment! Try exploring Mudit's portfolio through the desktop icons, or open the Mail app to reach him directly.");
    }

    irisProcessing = false;
    setIrisOrbState('');
    if (sendBtn) sendBtn.disabled = false;
}

/* ──────────────────────────────────────────────────────────────────────────
   Model transport
   --------------------------------------------------------------------------
   API keys are NEVER shipped to the browser. Iris posts to a serverless proxy
   (APP_CONFIG.IRIS_ENDPOINT) that holds the key server-side. If no endpoint is
   configured, Iris falls back to answering from the local portfolio corpus,
   so the feature degrades to something useful instead of an error.
   ────────────────────────────────────────────────────────────────────────── */

async function callIrisProxy(userMessage) {
    const endpoint = window.APP_CONFIG && window.APP_CONFIG.IRIS_ENDPOINT;
    if (!endpoint) return null;

    // The user's turn is already in irisConversation — don't append it again.
    // The old code sent it twice on every single request.
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
        if (!res.ok) {
            console.warn('Iris proxy error:', res.status);
            return null;
        }
        const data = await res.json();
        return data.reply || null;
    } catch (e) {
        console.warn('Iris proxy unreachable:', e);
        return null;
    }
}

/**
 * Offline mode: answer from window.PORTFOLIO_CORPUS + PROFILE_DATA.
 * Shares the exact same index Safari search and Spotlight use.
 */
function answerFromCorpus(userMessage) {
    const p = window.PROFILE_DATA || {};
    const q = userMessage.toLowerCase();

    if (/\b(contact|email|reach|hire|phone|call)\b/.test(q)) {
        return `You can reach ${p.name || 'Mudit'} at **${p.contact?.email || ''}** or ${p.contact?.phone || ''}. `
             + `His LinkedIn is [here](${p.contact?.linkedin || ''}) — or open the Mail app from the Dock to send a message directly.`;
    }
    if (/\b(education|degree|study|college|university|cgpa|academic)\b/.test(q)) {
        const e = p.education || {};
        return `${p.name || 'Mudit'} is doing a **${e.degree || ''}** at **${e.university || ''}** (${e.years || ''}), currently at a ${e.cgpa || ''} CGPA.`;
    }
    if (/\b(experience|intern|work|job|career)\b/.test(q)) {
        const lines = (p.experience || []).map(e => `• **${e.role}** at ${e.org} — ${e.dates}`).join('\n');
        return `Here's his work history:\n${lines}`;
    }

    const matches = searchPortfolioCorpus(userMessage, { minScore: 2, limit: 3 });
    if (matches.length > 0) {
        const lines = matches.map(m => m.url ? `• **[${m.title}](${m.url})** — ${m.text}` : `• **${m.title}** — ${m.text}`).join('\n');
        return `Here's what I found in ${(p.name || 'Mudit').split(' ')[0]}'s work:\n${lines}`;
    }

    return `I can tell you about ${(p.name || 'Mudit').split(' ')[0]}'s **projects**, **experience**, **skills**, **education**, or how to **contact** him — just ask. `
         + `You can also press **⌘Space** to search the whole portfolio, or browse it in Finder.`;
}

function handleIrisInput(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendIrisMessage();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderIrisSuggestions();

    // Escape to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const overlay = document.getElementById('iris-overlay');
            if (overlay && overlay.classList.contains('active')) {
                closeIris();
            }
        }
    });
});
