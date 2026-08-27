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
    const clean = str.replace(/×/g, '*').replace(/÷/g, '/').trim();
    if (!/^[0-9+\-*/%().\s]+$/.test(clean)) return null;
    if (!/[0-9]/.test(clean)) return null;

    try {
        const tokens = clean.match(/(\d+(\.\d+)?|[+\-*/%()])/g);
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
            let val = parseFactor();
            while (peek() === '*' || peek() === '/' || peek() === '%') {
                const op = consume();
                const right = parseFactor();
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
 * Copies text to clipboard with fallback prompt
 */
function copyTextToClipboard(text, successMsg) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            if (successMsg) alert(successMsg);
        }).catch(() => {
            prompt("Copy link:", text);
        });
    } else {
        prompt("Copy link:", text);
    }
}
