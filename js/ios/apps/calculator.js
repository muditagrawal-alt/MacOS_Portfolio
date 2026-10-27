/* ==========================================================================
   Calculator — the iOS layout, with operator precedence
   --------------------------------------------------------------------------
   Evaluated by the same safe parser as the Mac's Spotlight calculator
   (evaluateMathExpression in js/core/utils.js — no eval). % is percent, as
   on iOS. Works from a hardware keyboard too.
   ========================================================================== */

(function () {
    const OPS = { '÷': '/', '×': '*', '−': '-', '+': '+' };
    let expr = [];        // tokens: numbers as strings, operators as ÷ × − +
    let entry = '0';      // the number being typed
    let justEvaluated = false;
    let view = null;

    const isOp = (t) => Object.prototype.hasOwnProperty.call(OPS, t);

    function format(numStr) {
        if (numStr === 'Error') return numStr;
        if (/e/i.test(numStr)) return Number(numStr).toPrecision(6).replace(/\.?0+e/, 'e');
        const [int, dec] = numStr.split('.');
        const neg = int.startsWith('-');
        const grouped = Number(neg ? int.slice(1) : int).toLocaleString('en-US');
        return (neg ? '-' : '') + grouped + (dec !== undefined ? '.' + dec : '');
    }

    function compute(tokens) {
        const src = tokens.map(t => (isOp(t) ? OPS[t] : `(${t})`)).join('');
        const r = evaluateMathExpression(src);
        if (r === null || !isFinite(r)) return 'Error';
        const s = String(Number(r.toPrecision(12)));
        return s.length > 12 ? Number(s).toPrecision(8) : s;
    }

    function press(key) {
        if (/^\d$/.test(key)) {
            if (justEvaluated) { expr = []; entry = '0'; justEvaluated = false; }
            if (entry.replace(/[-.]/g, '').length >= 9) return;
            entry = entry === '0' ? key : entry === '-0' ? '-' + key : entry + key;
        } else if (key === '.') {
            if (justEvaluated) { expr = []; entry = '0'; justEvaluated = false; }
            if (!entry.includes('.')) entry += '.';
        } else if (isOp(key)) {
            justEvaluated = false;
            if (entry === '' && expr.length && isOp(expr[expr.length - 1])) expr[expr.length - 1] = key;
            else { expr.push(entry === '' ? '0' : entry, key); entry = ''; }
        } else if (key === '=') {
            if (!expr.length) return;
            const tokens = [...expr, entry === '' ? expr[expr.length - 2] : entry];
            entry = compute(tokens);
            expr = [];
            justEvaluated = true;
        } else if (key === 'AC') {
            expr = []; entry = '0'; justEvaluated = false;
        } else if (key === '⌫') {
            if (justEvaluated || entry === 'Error') { entry = '0'; justEvaluated = false; }
            else entry = entry.length > 1 && entry !== '-0' ? entry.slice(0, -1).replace(/^-$/, '0') : '0';
        } else if (key === '±') {
            if (entry === '' || entry === 'Error') return;
            entry = entry.startsWith('-') ? entry.slice(1) : '-' + entry;
        } else if (key === '%') {
            if (entry === '' || entry === 'Error') return;
            entry = String(Number((Number(entry) / 100).toPrecision(12)));
        }
        IOS.haptic();
        draw();
    }

    function draw() {
        if (!view) return;
        const shown = entry === '' ? (expr.length ? expr[expr.length - 2] : '0') : entry;
        const text = format(shown);
        view.display.textContent = text;
        view.display.style.fontSize = text.length > 9 ? `${Math.max(44, 88 - (text.length - 9) * 7)}px` : '';
        view.history.innerHTML = `<span>${escapeHtml(expr.map(t => (isOp(t) ? ` ${t} ` : format(t))).join(''))}</span>`;
        const typing = entry !== '' && entry !== '0' && !justEvaluated;
        view.clear.textContent = typing ? '⌫' : 'AC';
        view.clear.setAttribute('aria-label', typing ? 'Delete' : 'All clear');
        view.root.querySelectorAll('[data-k]').forEach(b => b.classList.toggle('armed', isOp(b.dataset.k) && entry === '' && expr[expr.length - 1] === b.dataset.k));
    }

    const KEYS = [
        ['AC', 'fn'], ['±', 'fn'], ['%', 'fn'], ['÷', 'op'],
        ['7'], ['8'], ['9'], ['×', 'op'],
        ['4'], ['5'], ['6'], ['−', 'op'],
        ['1'], ['2'], ['3'], ['+', 'op'],
        ['0', 'zero'], ['.'], ['=', 'op']
    ];

    function render(content) {
        content.innerHTML = `
            <div class="calc">
                <div class="calc-screen" aria-live="polite">
                    <div class="calc-history"></div>
                    <div class="calc-display"></div>
                </div>
                <div class="calc-keys">${KEYS.map(([k, cls]) => `<button type="button" class="calc-key ${cls || 'num'}" data-k="${k}" aria-label="${k}">${k}</button>`).join('')}</div>
            </div>`;
        view = {
            root: content,
            display: content.querySelector('.calc-display'),
            history: content.querySelector('.calc-history'),
            clear: content.querySelector('[data-k="AC"]')
        };
        content.querySelector('.calc-keys').addEventListener('click', (e) => {
            const b = e.target.closest('[data-k]');
            if (!b) return;
            press(b === view.clear ? b.textContent : b.dataset.k);
        });
        // Swipe left or right on the number to delete a digit, like iOS.
        let sx = null;
        view.display.addEventListener('pointerdown', (e) => { sx = e.clientX; });
        view.display.addEventListener('pointerup', (e) => { if (sx !== null && Math.abs(e.clientX - sx) > 30) press('⌫'); sx = null; });
        draw();
    }

    document.addEventListener('keydown', (e) => {
        if (IOS.currentApp !== 'calculator' || e.metaKey || e.ctrlKey || e.altKey) return;
        const map = { '/': '÷', '*': '×', '-': '−', '+': '+', Enter: '=', '=': '=', Escape: 'AC', Backspace: '⌫', '%': '%', '.': '.', ',': '.' };
        const k = /^\d$/.test(e.key) ? e.key : map[e.key];
        if (!k) return;
        e.preventDefault();
        press(k);
    });

    IOS.register('calculator', {
        name: 'Calculator',
        icon: 'assets/icons/calculator.png',
        theme: 'calculator',
        statusBar: 'light',
        keywords: 'math numbers add',
        onClose() { view = null; },
        pages: () => [{ key: 'calc', title: 'Calculator', hideNav: true, className: 'calc-page', render }]
    });
})();
