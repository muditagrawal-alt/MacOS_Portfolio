/* ==========================================================================
   Core Utility Functions: Escaping, Math Parser, Clipboard & String Helpers
   ========================================================================== */

/**
 * Escapes a string for safe interpolation into an innerHTML template.
 * Use this for EVERY value that originated from a user, a URL bar, a
 * filename, or a network response before it reaches innerHTML.
 */
function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Escapes a string for safe use inside a single-quoted inline handler
 * attribute, e.g. onclick="doThing('...')". Escapes both the JS string
 * context and the surrounding HTML attribute context.
 */
function escapeAttr(value) {
    return escapeHtml(String(value === null || value === undefined ? '' : value)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'"));
}

/**
 * Returns url if it uses a safe scheme, otherwise '#'.
 * Blocks javascript:, data:, vbscript: injected via markdown links or
 * API responses.
 */
function safeUrl(url) {
    const raw = String(url || '').trim();
    if (/^(https?:|mailto:|tel:|\/|#|\.\/|assets\/)/i.test(raw)) return raw;
    return '#';
}

/**
 * Opens an external URL without handing the new tab a window.opener
 * reference back to this page (reverse-tabnabbing protection).
 */
function openExternal(url) {
    const target = safeUrl(url);
    if (target === '#') return;
    window.open(target, '_blank', 'noopener,noreferrer');
}

/**
 * Evaluates a simple arithmetic math expression safely without eval()
 * Supports: +, -, *, /, %, (, ), and decimals
 */
function evaluateMathExpression(str) {
    if (!str) return null;
    const clean = str.replace(/×/g, '*').replace(/÷/g, '/').replace(/\*\*/g, '^').trim();
    if (!/^[0-9+\-*/%^().\s]+$/.test(clean)) return null;
    if (!/[0-9]/.test(clean)) return null;
    // A bare number isn't a calculation — don't echo "42 = 42" back.
    if (/^\s*\d+(\.\d+)?\s*$/.test(clean)) return null;

    try {
        const tokens = clean.match(/(\d+(\.\d+)?|[+\-*/%^()])/g);
        if (!tokens) return null;
        let pos = 0;

        function peek() { return tokens[pos]; }
        function consume() { return tokens[pos++]; }

        function parseExpression() {
            let val = parseTerm();
            while (peek() === '+' || peek() === '-') {
                const op = consume();
                const right = parseTerm();
                if (right === null) return null;
                val = op === '+' ? val + right : val - right;
            }
            return val;
        }

        function parseTerm() {
            let val = parsePower();
            while (peek() === '*' || peek() === '/' || peek() === '%') {
                const op = consume();
                const right = parsePower();
                if (right === null) return null;
                if (op === '*') val = val * right;
                else if (op === '/') {
                    if (right === 0) return null;
                    val = val / right;
                } else if (op === '%') {
                    val = val % right;
                }
            }
            return val;
        }

        // Exponentiation binds tighter than * and is right-associative: 2^3^2 = 2^9.
        function parsePower() {
            const base = parseFactor();
            if (base === null) return null;
            if (peek() === '^') {
                consume();
                const exp = parsePower();
                if (exp === null) return null;
                return Math.pow(base, exp);
            }
            return base;
        }

        function parseFactor() {
            if (peek() === '+' || peek() === '-') {
                const sign = consume() === '-' ? -1 : 1;
                const next = parseFactor();
                return next !== null ? sign * next : null;
            }
            if (peek() === '(') {
                consume();
                const val = parseExpression();
                if (consume() !== ')') return null;
                return val;
            }
            const token = consume();
            const num = parseFloat(token);
            if (!isNaN(num)) {
                return num;
            }
            return null;
        }

        const result = parseExpression();
        if (pos === tokens.length && typeof result === 'number' && isFinite(result) && !isNaN(result)) {
            return Math.round(result * 1e8) / 1e8;
        }
    } catch (e) {
        return null;
    }
    return null;
}

/**
 * macOS-style notification banner (top-right, auto-dismissing).
 * Replaces native alert()/prompt(), which froze the whole desktop behind a
 * browser dialog that no Mac app would ever show.
 *
 * @param {string} title
 * @param {{ body?: string, icon?: string, duration?: number, action?: {label:string, run:Function} }} [opts]
 */
function showToast(title, opts = {}) {
    let stack = document.getElementById('mac-toast-stack');
    if (!stack) {
        stack = document.createElement('div');
        stack.id = 'mac-toast-stack';
        stack.className = 'mac-toast-stack';
        stack.setAttribute('role', 'status');
        stack.setAttribute('aria-live', 'polite');
        // On the iPhone version banners live inside the device frame.
        (document.getElementById('ios-device') || document.body).appendChild(stack);
    }

    const toast = document.createElement('div');
    toast.className = 'mac-toast';
    toast.innerHTML = `
        <div class="mac-toast-icon"><i class="${escapeHtml(opts.icon || 'fas fa-circle-check')}"></i></div>
        <div class="mac-toast-text">
            <div class="mac-toast-title">${escapeHtml(title)}</div>
            ${opts.body ? `<div class="mac-toast-body">${escapeHtml(opts.body)}</div>` : ''}
        </div>
        ${opts.action ? `<button type="button" class="mac-toast-action">${escapeHtml(opts.action.label)}</button>` : ''}`;
    stack.appendChild(toast);

    const dismiss = () => {
        toast.classList.add('leaving');
        setTimeout(() => toast.remove(), 260);
    };
    if (opts.action) {
        toast.querySelector('.mac-toast-action').addEventListener('click', (e) => {
            e.stopPropagation();
            opts.action.run();
            dismiss();
        });
    }
    toast.addEventListener('click', dismiss);
    setTimeout(dismiss, opts.duration || 3200);
    return toast;
}

/**
 * Copies text to the clipboard and confirms with a banner. Falls back to a
 * hidden textarea + execCommand where the async Clipboard API is refused.
 */
function copyTextToClipboard(text, successMsg) {
    const done = () => showToast(successMsg || 'Copied to Clipboard', { body: text, icon: 'fas fa-clipboard-check' });
    const legacy = () => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
        document.body.appendChild(ta);
        ta.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        ta.remove();
        if (ok) done();
        else showToast('Couldn’t access the clipboard', { body: text, icon: 'fas fa-triangle-exclamation', duration: 6000 });
    };

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done).catch(legacy);
    } else {
        legacy();
    }
}

/** Renders a duration in seconds as m:ss. */
function formatClockTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}
