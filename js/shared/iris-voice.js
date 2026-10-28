/* ==========================================================================
   Iris's voice — answers read aloud, for the Mac and the iPhone
   --------------------------------------------------------------------------
   The browser's own speech synthesis: nothing is sent anywhere. Iris speaks
   when spoken to; each version decides when else (a setting, a button).
   Spoken answers are the first two sentences, without markdown or links.
   ========================================================================== */

window.IrisVoice = (() => {
    const supported = typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined';
    const PREFERRED = ['Siri', 'Samantha', 'Karen', 'Victoria', 'Daniel', 'Google UK English Female'];
    let voices = [];

    function loadVoices() {
        try { voices = window.speechSynthesis.getVoices(); } catch (e) { voices = []; }
    }
    if (supported) {
        loadVoices();
        if (window.speechSynthesis.addEventListener) window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    }

    /** What gets said: plain text, two sentences at most. */
    function spoken(text) {
        const clean = String(text || '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/[*_#•]/g, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/https?:\/\/\S+/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        const sentences = clean.split(/(?<=[.?!])\s+/);
        return sentences.length > 2 ? sentences.slice(0, 2).join(' ') : clean;
    }

    const voice = () => voices.find(v => v.lang.startsWith('en') && PREFERRED.some(name => v.name.includes(name)))
        || voices.find(v => v.lang.startsWith('en'));

    /**
     * @param {string} text
     * @param {{ onstart?:Function, onend?:Function, onboundary?:Function }} hooks  onend also runs on errors and on stop()
     */
    function speak(text, { onstart, onend, onboundary } = {}) {
        if (!supported) return false;
        const line = spoken(text);
        if (!line) return false;
        try {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(line);
            u.rate = 1.05;
            u.pitch = 1.0;
            const v = voice();
            if (v) u.voice = v;
            if (onstart) u.onstart = onstart;
            if (onboundary) u.onboundary = onboundary;
            if (onend) { u.onend = onend; u.onerror = onend; }
            window.speechSynthesis.speak(u);
            return true;
        } catch (e) {
            if (onend) onend();
            return false;
        }
    }

    function stop() {
        if (supported) { try { window.speechSynthesis.cancel(); } catch (e) { /* nothing playing */ } }
    }

    const speaking = () => supported && window.speechSynthesis.speaking;

    return { supported, speak, stop, speaking, spoken };
})();
