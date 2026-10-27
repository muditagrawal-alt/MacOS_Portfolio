/* ==========================================================================
   Snake — swipe to turn
   --------------------------------------------------------------------------
   The Mac has a keyboard Snake; this one is made for a thumb: swipe anywhere
   on the board to turn, tap to pause. It speeds up as it grows, and the
   best score stays in this browser.
   ========================================================================== */

(function () {
    const N = 17;                         // cells per side
    const BEST_KEY = 'ios-snake-best';
    let view = null;
    let snake = [];
    let dir = [1, 0];
    let queued = [];                      // turns swiped faster than the snake moves
    let food = null;
    let score = 0;
    let state = 'ready';                  // ready | playing | paused | over
    let timer = null;

    const best = () => Number(IOS.readPref(BEST_KEY, 0)) || 0;
    const speed = () => Math.max(70, 150 - score * 4);

    function placeFood() {
        const free = [];
        for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) if (!snake.some(s => s[0] === x && s[1] === y)) free.push([x, y]);
        food = free[Math.floor(Math.random() * free.length)] || null;
    }

    function reset() {
        const mid = Math.floor(N / 2);
        snake = [[mid - 1, mid], [mid - 2, mid], [mid - 3, mid]];
        dir = [1, 0];
        queued = [];
        score = 0;
        placeFood();
        state = 'ready';
        draw();
    }

    function turn(d) {
        const last = queued.length ? queued[queued.length - 1] : dir;
        if (d[0] === -last[0] && d[1] === -last[1]) return;   // no reversing into yourself
        if (d[0] === last[0] && d[1] === last[1]) return;
        if (queued.length < 2) queued.push(d);
        if (state === 'ready') play();
    }

    function play() {
        if (state === 'over') reset();
        state = 'playing';
        clearTimeout(timer);
        tick();
    }

    function pause() {
        if (state !== 'playing') return;
        state = 'paused';
        clearTimeout(timer);
        draw();
    }

    function tick() {
        if (state !== 'playing' || !view) return;
        if (queued.length) dir = queued.shift();
        const head = [snake[0][0] + dir[0], snake[0][1] + dir[1]];
        const hitWall = head[0] < 0 || head[0] >= N || head[1] < 0 || head[1] >= N;
        const hitSelf = snake.slice(0, -1).some(s => s[0] === head[0] && s[1] === head[1]);
        if (hitWall || hitSelf) {
            state = 'over';
            if (score > best()) IOS.writePref(BEST_KEY, score);
            IOS.haptic();
            draw();
            return;
        }
        snake.unshift(head);
        if (food && head[0] === food[0] && head[1] === food[1]) { score++; IOS.haptic(); placeFood(); } else snake.pop();
        draw();
        timer = setTimeout(tick, speed());
    }

    function draw() {
        if (!view) return;
        const cv = view.canvas;
        const px = cv.width;
        const cell = px / N;
        const ctx = cv.getContext('2d');
        const dark = IOS.isDarkAppearance();
        ctx.fillStyle = dark ? '#0f1f17' : '#e7f5ec';
        ctx.fillRect(0, 0, px, px);
        ctx.fillStyle = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.035)';
        for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) if ((x + y) % 2) ctx.fillRect(x * cell, y * cell, cell, cell);
        if (food) {
            ctx.fillStyle = '#ff3b30';
            ctx.beginPath();
            ctx.arc((food[0] + 0.5) * cell, (food[1] + 0.5) * cell, cell * 0.36, 0, Math.PI * 2);
            ctx.fill();
        }
        snake.forEach((s, i) => {
            ctx.fillStyle = i === 0 ? '#1f9d55' : `hsl(145, 63%, ${42 + Math.min(18, i)}%)`;
            const inset = cell * 0.08;
            const r = cell * 0.28;
            const x = s[0] * cell + inset, y = s[1] * cell + inset, w = cell - inset * 2;
            ctx.beginPath();
            ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + w, r); ctx.arcTo(x + w, y + w, x, y + w, r); ctx.arcTo(x, y + w, x, y, r); ctx.arcTo(x, y, x + w, y, r);
            ctx.fill();
        });
        view.root.querySelector('[data-score]').textContent = score;
        view.root.querySelector('[data-best]').textContent = Math.max(best(), score);
        const msg = view.root.querySelector('.snake-msg');
        msg.hidden = state === 'playing';
        msg.innerHTML = { ready: '<strong>Swipe to start</strong><small>Swipe to turn · tap to pause</small>', paused: '<strong>Paused</strong><small>Tap to carry on</small>', over: `<strong>Game over</strong><small>${score} point${score === 1 ? '' : 's'} · tap to play again</small>` }[state] || '';
    }

    function page(content) {
        content.innerHTML = `
            <div class="snake">
                <header class="snake-head"><h2>Snake</h2><div class="g2048-scores"><span><small>SCORE</small><b data-score>0</b></span><span><small>BEST</small><b data-best>0</b></span></div></header>
                <div class="snake-board" tabindex="0" aria-label="Snake board">
                    <canvas width="680" height="680"></canvas>
                    <div class="snake-msg"></div>
                </div>
            </div>`;
        view = { root: content.querySelector('.snake'), canvas: content.querySelector('canvas') };
        const board = view.root.querySelector('.snake-board');
        let start = null;
        board.addEventListener('pointerdown', (e) => { start = { x: e.clientX, y: e.clientY }; });
        board.addEventListener('pointerup', (e) => {
            if (!start) return;
            const dx = e.clientX - start.x;
            const dy = e.clientY - start.y;
            start = null;
            if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) {   // a tap
                if (state === 'playing') pause(); else play();
                return;
            }
            turn(Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]);
        });
        board.addEventListener('keydown', (e) => {
            const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
            if (d) { e.preventDefault(); turn(d); }
            if (e.key === ' ') { e.preventDefault(); if (state === 'playing') pause(); else play(); }
        });
        reset();
        board.focus({ preventScroll: true });
    }

    IOS.register('snake', {
        name: 'Snake',
        icon: 'assets/icons/snake.svg',
        keywords: 'game games snake arcade play',
        onClose() { clearTimeout(timer); if (state === 'playing') state = 'paused'; view = null; },
        pages: () => [{ key: 'board', title: 'Snake', largeTitle: false, className: 'snake-page', render: page }]
    });

    window.iosSnake = { turn, get state() { return { state, score, length: snake.length }; } };
})();
