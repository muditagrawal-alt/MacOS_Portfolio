/* ==========================================================================
   Iris everywhere — ask from any app, the way you'd ask Siri
   --------------------------------------------------------------------------
   Hold the home bar (from any app or the Home Screen): the screen's edge
   glows, a bar to type or speak rises, and the answer floats over whatever
   is open. Iris knows what's on screen ("what's this?" on a project page
   means that project), and when the visitor asks to open something, it
   goes there. Asked aloud, it answers aloud (js/shared/iris-voice.js); any
   answer can be read out. Same client as Messages and the Mac
   (js/shared/iris-client.js).
   ========================================================================== */

window.IrisEverywhere = (() => {
    const P = window.PROFILE_DATA;
    const $ = (sel) => document.querySelector(sel);
    let history = [];         // this session's turns, for follow-ups
    let busy = false;
    let recognizer = null;

    /** Light formatting, as in Messages: **bold**, [links](url), bullets, newlines. */
    function format(text) {
        let out = escapeHtml(text);
        out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, url) => {
            const href = safeUrl(url.replace(/&amp;/g, '&'));
            return href === '#' ? label : `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
        });
        return out.replace(/^[•-] /gm, '&bull; ').replace(/\n/g, '<br>');
    }

    function mount() {
        if ($('#siri')) return;
        const el = document.createElement('div');
        el.className = 'siri';
        el.id = 'siri';
        el.hidden = true;
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-label', 'Ask Iris');
        el.innerHTML = `
            <div class="siri-glow" aria-hidden="true"></div>
            <button type="button" class="siri-scrim" aria-label="Close Iris"></button>
            <div class="siri-panel">
                <div class="siri-answer" aria-live="polite" hidden></div>
                <form class="siri-bar">
                    <img class="siri-orb" src="assets/icons/siri.png" alt="">
                    <input type="text" placeholder="Ask Iris about ${escapeHtml(P.first)}" aria-label="Ask Iris" autocomplete="off" enterkeyhint="send">
                    <button type="button" class="siri-mic" aria-label="Speak"><i class="fas fa-microphone"></i></button>
                </form>
                <small class="siri-context"></small>
            </div>`;
        $('#ios-device').appendChild(el);
        el.querySelector('.siri-scrim').addEventListener('click', () => close());
        el.querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault();
            const input = el.querySelector('input');
            const q = input.value.trim();
            input.value = '';
            if (q) ask(q);
        });
        el.querySelector('.siri-mic').addEventListener('click', listen);
        el.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
        el.querySelector('.siri-answer').addEventListener('click', (e) => {
            const src = e.target.closest('[data-src]');
            if (src && src._open) { close(); src._open(); }
            const act = e.target.closest('[data-run]');
            if (act && act._action) { close({ keepVoice: true }); IOS.runAction(act._action); }
            const speaker = e.target.closest('[data-speak]');
            if (speaker) toggleVoice(speaker);
        });
        if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) el.querySelector('.siri-mic').hidden = true;
    }

    function open() {
        mount();
        const el = $('#siri');
        const screen = IOS.describeScreen();
        el.querySelector('.siri-context').textContent = screen ? `Looking at ${screen.describe}` : '';
        el.hidden = false;
        requestAnimationFrame(() => el.classList.add('on'));
        IOS.haptic();
        setTimeout(() => el.querySelector('input').focus({ preventScroll: true }), 120);
    }

    /** keepVoice: Iris is going somewhere and finishes its sentence on the way. */
    function close({ keepVoice = false } = {}) {
        const el = $('#siri');
        if (!el || el.hidden) return;
        if (recognizer) { try { recognizer.abort(); } catch (e) { /* already stopped */ } }
        if (!keepVoice && window.IrisVoice) IrisVoice.stop();
        el.classList.remove('on');
        setTimeout(() => { el.hidden = true; el.querySelector('.siri-answer').hidden = true; }, 260);
    }

    const isOpen = () => Boolean($('#siri') && !$('#siri').hidden);

    /** Reads the answer out, or stops if it's already being read. */
    function say(text, speaker) {
        if (!speaker) return;
        speaker.classList.add('on');
        speaker.setAttribute('aria-pressed', 'true');
        const done = () => { speaker.classList.remove('on'); speaker.setAttribute('aria-pressed', 'false'); };
        if (!IrisVoice.speak(text, { onend: done })) done();
    }

    function toggleVoice(speaker) {
        if (speaker.classList.contains('on')) { IrisVoice.stop(); speaker.classList.remove('on'); speaker.setAttribute('aria-pressed', 'false'); return; }
        say(speaker._text, speaker);
    }

    /** @param {{ voice?: boolean }} opts  voice: asked aloud, so answered aloud */
    async function ask(q, { voice = false } = {}) {
        if (busy) return;
        busy = true;
        const el = $('#siri');
        const box = el.querySelector('.siri-answer');
        box.hidden = false;
        box.innerHTML = `<p class="siri-q">${escapeHtml(q)}</p><div class="siri-thinking" aria-label="Iris is thinking"><i></i><i></i><i></i></div>`;
        const screen = IOS.describeScreen();
        const answer = await IrisClient.ask(q, { history, screen });
        history = [...history, { role: 'user', content: q }, { role: 'assistant', content: answer.text }].slice(-8);
        const card = answer.action ? IOS.describeAction(answer.action) : null;
        const canSpeak = Boolean(window.IrisVoice && IrisVoice.supported);
        box.innerHTML = `
            <div class="siri-q-row"><p class="siri-q">${escapeHtml(q)}</p>${canSpeak ? '<button type="button" class="siri-speak" data-speak aria-label="Read the answer aloud" aria-pressed="false"><i class="fas fa-volume-high"></i></button>' : ''}</div>
            <div class="siri-text">${format(answer.text)}</div>
            ${card ? `<button type="button" class="siri-run" data-run><i class="${escapeHtml(card.icon)}"></i><span><strong>${escapeHtml(card.title)}</strong><small>${escapeHtml(card.subtitle)}</small></span><em>${escapeHtml(card.btnText)}</em></button>` : ''}
            ${(answer.sources || []).length ? `<div class="siri-sources">${answer.sources.slice(0, 4).map((s, i) => `<button type="button" data-src="${i}" ${s.open ? '' : 'disabled'}>${escapeHtml(s.label)}</button>`).join('')}</div>` : ''}`;
        (answer.sources || []).slice(0, 4).forEach((s, i) => { const b = box.querySelector(`[data-src="${i}"]`); if (b) b._open = s.open; });
        const run = box.querySelector('[data-run]');
        if (run) run._action = answer.action;
        const speaker = box.querySelector('[data-speak]');
        if (speaker) {
            speaker._text = answer.text;
            if (voice || IOS.readPref('speakTyped', false)) say(answer.text, speaker);
        }
        busy = false;
        // Asked to open something: do it, like Siri, after a beat to read the reply.
        if (answer.action && card) setTimeout(() => { if (isOpen()) { close({ keepVoice: true }); IOS.runAction(answer.action); } }, 1400);
    }

    /** Speech in, when the browser offers it; nothing is recorded until the mic is tapped. */
    function listen() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;
        const el = $('#siri');
        const mic = el.querySelector('.siri-mic');
        recognizer = new SR();
        recognizer.lang = navigator.language || 'en-US';
        recognizer.interimResults = true;
        recognizer.onresult = (e) => {
            const text = [...e.results].map(r => r[0].transcript).join('');
            el.querySelector('input').value = text;
            if (e.results[e.results.length - 1].isFinal) { el.querySelector('input').value = ''; ask(text, { voice: true }); }
        };
        recognizer.onend = () => { mic.classList.remove('listening'); recognizer = null; };
        recognizer.onerror = () => mic.classList.remove('listening');
        if (window.IrisVoice) IrisVoice.stop();   // don't hear itself
        mic.classList.add('listening');
        try { recognizer.start(); } catch (e) { mic.classList.remove('listening'); }
    }

    return { open, close, ask, get isOpen() { return isOpen(); } };
})();
