/* ==========================================================================
   2048 — swipe to slide, match to merge
   --------------------------------------------------------------------------
   Tiles keep their identity between moves, so they slide and pop instead of
   jumping. Swipe on the board (or use the arrow keys); the best score stays
   in this browser.
   ========================================================================== */

(function () {
    const SIZE = 4;
    const BEST_KEY = 'ios-2048-best';
    let tiles = [];           // { id, v, r, c, dead?, merged?, fresh? }
    let score = 0;
    let won = false;
    let over = false;
    let nextId = 1;
    let view = null;

    const best = () => Number(IOS.readPref(BEST_KEY, 0)) || 0;
    const at = (r, c) => tiles.find(t => !t.dead && t.r === r && t.c === c);

    function addRandom() {
        const empty = [];
        for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!at(r, c)) empty.push([r, c]);
        if (!empty.length) return;
        const [r, c] = empty[Math.floor(Math.random() * empty.length)];
        tiles.push({ id: nextId++, v: Math.random() < 0.9 ? 2 : 4, r, c, fresh: true });
    }

    function reset() {
        tiles = [];
        score = 0;
        won = false;
        over = false;
        addRandom();
        addRandom();
        render();
    }

    function canMove() {
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                const t = at(r, c);
                if (!t) return true;
                const right = at(r, c + 1);
                const down = at(r + 1, c);
                if ((right && right.v === t.v) || (down && down.v === t.v)) return true;
            }
        }
        return false;
    }

    function move(dir) {
        if (over || !view) return;
        const [dr, dc] = { left: [0, -1], right: [0, 1], up: [-1, 0], down: [1, 0] }[dir];
        const order = [0, 1, 2, 3];
        const rows = dr === 1 ? order.slice().reverse() : order;
        const cols = dc === 1 ? order.slice().reverse() : order;
        tiles = tiles.filter(t => !t.dead);
        tiles.forEach(t => { t.merged = false; t.fresh = false; });
        const mergedInto = new Set();
        let moved = false;
        rows.forEach(r => cols.forEach(c => {
            const t = at(r, c);
            if (!t) return;
            let nr = r;
            let nc = c;
            for (;;) {
                const rr = nr + dr;
                const cc = nc + dc;
                if (rr < 0 || rr >= SIZE || cc < 0 || cc >= SIZE) break;
                const other = at(rr, cc);
                if (!other) { nr = rr; nc = cc; continue; }
                if (other.v === t.v && !mergedInto.has(other.id)) {
                    // Slide into the other tile, then vanish as it doubles.
                    t.r = rr; t.c = cc; t.dead = true;
                    other.v *= 2; other.merged = true;
                    mergedInto.add(other.id);
                    score += other.v;
                    if (other.v === 2048 && !won) won = true;
                    moved = true;
                }
                break;
            }
            if (!t.dead && (nr !== r || nc !== c)) { t.r = nr; t.c = nc; moved = true; }
        }));
        if (!moved) return;
        IOS.haptic();
        if (score > best()) IOS.writePref(BEST_KEY, score);
        render();
        setTimeout(() => {
            tiles = tiles.filter(t => !t.dead);
            addRandom();
            over = !canMove();
            render();
        }, 120);
    }

    function render() {
        if (!view) return;
        const layer = view.root.querySelector('.g2048-tiles');
        const els = new Map([...layer.children].map(el => [el.dataset.id, el]));
        tiles.forEach(t => {
            let el = els.get(String(t.id));
            if (!el) {
                el = document.createElement('div');
                el.dataset.id = t.id;
                layer.appendChild(el);
            }
            els.delete(String(t.id));
            el.className = `g2048-tile v${Math.min(t.v, 4096)}${t.merged ? ' merged' : ''}${t.fresh ? ' fresh' : ''}${t.dead ? ' dead' : ''}`;
            el.style.setProperty('--r', t.r);
            el.style.setProperty('--c', t.c);
            el.textContent = t.v;
        });
        els.forEach(el => el.remove());
        view.root.querySelector('[data-score]').textContent = score;
        view.root.querySelector('[data-best]').textContent = Math.max(best(), score);
        const banner = view.root.querySelector('.g2048-banner');
        banner.hidden = !(over || (won && !view.keepGoing));
        banner.querySelector('strong').textContent = over ? 'No more moves' : 'You made 2048!';
        banner.querySelector('[data-act="continue"]').hidden = over;
    }

    function page(content) {
        content.innerHTML = `
            <div class="g2048">
                <header class="g2048-head">
                    <h2>2048</h2>
                    <div class="g2048-scores">
                        <span><small>SCORE</small><b data-score>0</b></span>
                        <span><small>BEST</small><b data-best>0</b></span>
                    </div>
                </header>
                <p class="g2048-hint">Swipe to slide the tiles. Two of a kind merge — reach 2048.</p>
                <div class="g2048-board" aria-label="2048 board" tabindex="0">
                    ${'<span class="g2048-cell"></span>'.repeat(SIZE * SIZE)}
                    <div class="g2048-tiles" aria-live="polite"></div>
                    <div class="g2048-banner" hidden>
                        <strong></strong>
                        <div><button type="button" class="ios-btn" data-act="new">New game</button><button type="button" class="ios-btn secondary" data-act="continue">Keep going</button></div>
                    </div>
                </div>
                <button type="button" class="ios-btn block secondary" data-act="new"><i class="fas fa-rotate-left"></i> New game</button>
            </div>`;
        view = { root: content.querySelector('.g2048'), keepGoing: false };
        const board = view.root.querySelector('.g2048-board');
        let start = null;
        board.addEventListener('pointerdown', (e) => { start = { x: e.clientX, y: e.clientY }; board.setPointerCapture && board.setPointerCapture(e.pointerId); });
        board.addEventListener('pointerup', (e) => {
            if (!start) return;
            const dx = e.clientX - start.x;
            const dy = e.clientY - start.y;
            start = null;
            if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
            move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
        });
        board.addEventListener('keydown', (e) => {
            const dir = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[e.key];
            if (dir) { e.preventDefault(); move(dir); }
        });
        view.root.addEventListener('click', (e) => {
            const act = e.target.closest('[data-act]');
            if (!act) return;
            if (act.dataset.act === 'new') { view.keepGoing = false; reset(); }
            if (act.dataset.act === 'continue') { view.keepGoing = true; render(); }
        });
        if (!tiles.length) reset(); else render();
        board.focus({ preventScroll: true });
    }

    IOS.register('game-2048', {
        name: '2048',
        icon: 'assets/icons/game-2048.svg',
        iconStyle: 'ios',
        keywords: 'game games 2048 puzzle play tiles',
        onClose() { view = null; },
        pages: () => [{ key: 'board', title: '2048', largeTitle: false, className: 'g2048-page', render: page }]
    });

    // For tests and the curious: window.ios2048.move('left').
    window.ios2048 = { move, reset, get state() { return { score, over, tiles: tiles.filter(t => !t.dead).map(t => ({ v: t.v, r: t.r, c: t.c })) }; } };
})();
