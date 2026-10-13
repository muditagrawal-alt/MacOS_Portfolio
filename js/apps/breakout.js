/* ==========================================================================
   Breakout.app — Steve Jobs & Steve Wozniak 1976 Classic Arcade Brick Breaker
   ========================================================================== */

(function() {
    let canvas, ctx;
    let animId = null;
    let isRunning = false;
    let isPaused = false;
    let isBallLaunched = false;
    let score = 0;
    let highScore = 0;
    let lives = 3;
    let level = 1;

    // Game Objects
    let paddle = {
        x: 260,
        y: 450,
        width: 100,
        height: 12,
        speed: 9,
        isLaser: false
    };

    let balls = [];
    let bricks = [];
    let particles = [];
    let powerups = [];

    // Bricks layout
    const BRICK_ROWS = 5;
    const BRICK_COLS = 10;
    const BRICK_HEIGHT = 16;
    const BRICK_PADDING = 6;
    const BRICK_OFFSET_TOP = 40;
    const BRICK_OFFSET_LEFT = 20;

    const ROW_COLORS = [
        { color: '#ff3b30', pts: 7, glow: 'rgba(255, 59, 48, 0.45)' },   // Red
        { color: '#ff9500', pts: 5, glow: 'rgba(255, 149, 0, 0.45)' },  // Orange
        { color: '#ffd60a', pts: 3, glow: 'rgba(255, 214, 10, 0.45)' },  // Yellow
        { color: '#30d158', pts: 2, glow: 'rgba(48, 209, 88, 0.45)' },   // Green
        { color: '#0a84ff', pts: 1, glow: 'rgba(10, 132, 255, 0.45)' }   // Blue
    ];

    // Audio synthesizer
    function playBeep(type = 'bounce') {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const actx = new AudioCtx();
            const now = actx.currentTime;
            const osc = actx.createOscillator();
            const gain = actx.createGain();

            if (type === 'bounce') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(320, now);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.08);
            } else if (type === 'brick') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(540, now);
                osc.frequency.exponentialRampToValueAtTime(780, now + 0.1);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'powerup') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(660, now + 0.08);
                osc.frequency.setValueAtTime(880, now + 0.16);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
                osc.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.28);
            } else if (type === 'die') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.3);
            }
        } catch (e) {}
    }

    function initGame() {
        canvas = document.getElementById('breakout-canvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        canvas.width = 620;
        canvas.height = 490;

        try {
            const saved = localStorage.getItem('breakout_highscore');
            if (saved) highScore = parseInt(saved, 10) || 0;
        } catch (e) {}

        updateStatsUI();
        setupControls();
    }

    function setupControls() {
        if (!canvas) return;
        const stage = canvas.parentElement || canvas;

        function updatePaddleFromClientX(clientX) {
            const rect = canvas.getBoundingClientRect();
            if (rect.width <= 0) return;
            const scaleX = canvas.width / rect.width;
            const mouseX = (clientX - rect.left) * scaleX;
            paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, mouseX - paddle.width / 2));
        }

        // Mouse tracking on stage & canvas
        stage.addEventListener('mousemove', (e) => {
            if (!isRunning || isPaused) return;
            updatePaddleFromClientX(e.clientX);
        });

        // Click to launch ball
        stage.addEventListener('click', () => {
            if (isRunning && !isPaused && !isBallLaunched) {
                launchBall();
            }
        });

        // Touch support for mobile/tablets
        stage.addEventListener('touchmove', (e) => {
            if (!isRunning || isPaused) return;
            if (e.touches && e.touches[0]) {
                updatePaddleFromClientX(e.touches[0].clientX);
            }
        }, { passive: true });

        stage.addEventListener('touchstart', () => {
            if (isRunning && !isPaused && !isBallLaunched) {
                launchBall();
            }
        }, { passive: true });

        // Scoped keyboard controls
        window.addEventListener('keydown', (e) => {
            const win = document.getElementById('breakout-window');
            if (!win || win.classList.contains('hidden')) return;

            // Focus isolation: only steer if Breakout is active
            if (!win.classList.contains('is-active')) return;

            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                paddle.x = Math.max(0, paddle.x - 30);
                e.preventDefault();
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                paddle.x = Math.min(canvas.width - paddle.width, paddle.x + 30);
                e.preventDefault();
            } else if (e.code === 'Space') {
                e.preventDefault();
                if (!isBallLaunched && isRunning && !isPaused) {
                    launchBall();
                } else {
                    toggleBreakoutPause();
                }
            }
        });
    }

    function launchBall() {
        isBallLaunched = true;
        if (balls.length > 0) {
            balls[0].vx = (Math.random() > 0.5 ? 1 : -1) * (3.5 + level * 0.4);
            balls[0].vy = -(4.2 + level * 0.4);
        }
        playBeep('bounce');
    }

    function resetLevel() {
        const brickWidth = (canvas.width - (BRICK_OFFSET_LEFT * 2) - ((BRICK_COLS - 1) * BRICK_PADDING)) / BRICK_COLS;
        bricks = [];

        for (let r = 0; r < BRICK_ROWS; r++) {
            for (let c = 0; c < BRICK_COLS; c++) {
                const brickX = BRICK_OFFSET_LEFT + c * (brickWidth + BRICK_PADDING);
                const brickY = BRICK_OFFSET_TOP + r * (BRICK_HEIGHT + BRICK_PADDING);
                const rowInfo = ROW_COLORS[r % ROW_COLORS.length];
                bricks.push({
                    x: brickX,
                    y: brickY,
                    w: brickWidth,
                    h: BRICK_HEIGHT,
                    color: rowInfo.color,
                    glow: rowInfo.glow,
                    pts: rowInfo.pts,
                    alive: true
                });
            }
        }

        paddle.width = 100;
        paddle.isLaser = false;
        paddle.x = (canvas.width - paddle.width) / 2;

        isBallLaunched = false;
        balls = [{
            x: paddle.x + paddle.width / 2,
            y: paddle.y - 8,
            vx: 0,
            vy: 0,
            radius: 6,
            trail: []
        }];

        powerups = [];
        particles = [];
    }

    function startNewGame() {
        score = 0;
        lives = 3;
        level = 1;
        resetLevel();
        updateStatsUI();

        const overlay = document.getElementById('breakout-overlay');
        if (overlay) overlay.classList.remove('open');

        isRunning = true;
        isPaused = false;
        if (animId) cancelAnimationFrame(animId);
        loop();
    }

    function loop() {
        if (!isRunning) return;
        if (!isPaused) {
            update();
        }
        draw();
        animId = requestAnimationFrame(loop);
    }

    function update() {
        // If ball hasn't launched yet, stay anchored to paddle
        if (!isBallLaunched && balls.length > 0) {
            balls[0].x = paddle.x + paddle.width / 2;
            balls[0].y = paddle.y - balls[0].radius - 1;
        }

        // Update balls
        for (let i = balls.length - 1; i >= 0; i--) {
            const b = balls[i];
            if (!isBallLaunched && i === 0) continue;

            // Store trail
            b.trail.push({ x: b.x, y: b.y });
            if (b.trail.length > 5) b.trail.shift();

            b.x += b.vx;
            b.y += b.vy;

            // Wall collisions
            if (b.x - b.radius <= 0) {
                b.x = b.radius;
                b.vx = Math.abs(b.vx);
                playBeep('bounce');
            } else if (b.x + b.radius >= canvas.width) {
                b.x = canvas.width - b.radius;
                b.vx = -Math.abs(b.vx);
                playBeep('bounce');
            }

            if (b.y - b.radius <= 0) {
                b.y = b.radius;
                b.vy = Math.abs(b.vy);
                playBeep('bounce');
            }

            // Paddle collision
            if (
                b.y + b.radius >= paddle.y &&
                b.y - b.radius <= paddle.y + paddle.height &&
                b.x >= paddle.x &&
                b.x <= paddle.x + paddle.width &&
                b.vy > 0
            ) {
                const hitPos = (b.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
                const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                const maxAngle = Math.PI * 0.38; // 68 degrees
                const angle = hitPos * maxAngle;

                b.vx = speed * Math.sin(angle);
                b.vy = -Math.abs(speed * Math.cos(angle));
                b.y = paddle.y - b.radius - 1;
                playBeep('bounce');

                // Splash particles
                for (let k = 0; k < 6; k++) {
                    particles.push({
                        x: b.x,
                        y: paddle.y,
                        vx: (Math.random() - 0.5) * 4,
                        vy: -Math.random() * 3,
                        color: '#00e676',
                        alpha: 1,
                        size: 3
                    });
                }
            }

            // Brick collisions with directional resolution
            for (let j = 0; j < bricks.length; j++) {
                const br = bricks[j];
                if (!br.alive) continue;

                if (
                    b.x + b.radius >= br.x &&
                    b.x - b.radius <= br.x + br.w &&
                    b.y + b.radius >= br.y &&
                    b.y - b.radius <= br.y + br.h
                ) {
                    br.alive = false;

                    // Determine whether impact was horizontal or vertical
                    const prevX = b.x - b.vx;
                    const prevY = b.y - b.vy;
                    if (prevX < br.x || prevX > br.x + br.w) {
                        b.vx = -b.vx;
                    } else {
                        b.vy = -b.vy;
                    }

                    score += br.pts;
                    if (score > highScore) {
                        highScore = score;
                        try { localStorage.setItem('breakout_highscore', highScore.toString()); } catch (e) {}
                    }
                    updateStatsUI();
                    playBeep('brick');

                    // Spark particles
                    for (let p = 0; p < 8; p++) {
                        particles.push({
                            x: br.x + br.w / 2,
                            y: br.y + br.h / 2,
                            vx: (Math.random() - 0.5) * 6,
                            vy: (Math.random() - 0.5) * 6,
                            color: br.color,
                            alpha: 1,
                            size: 4
                        });
                    }

                    // Powerup drop chance
                    if (Math.random() < 0.25) {
                        const types = ['multiball', 'wide', 'life'];
                        const chosen = types[Math.floor(Math.random() * types.length)];
                        powerups.push({
                            x: br.x + br.w / 2,
                            y: br.y + br.h,
                            type: chosen,
                            vy: 2.2
                        });
                    }
                    break;
                }
            }

            // Bottom edge - ball lost
            if (b.y - b.radius > canvas.height) {
                balls.splice(i, 1);
            }
        }

        // Check if all balls lost
        if (balls.length === 0) {
            lives--;
            updateStatsUI();
            playBeep('die');

            if (lives <= 0) {
                gameOver(false);
                return;
            } else {
                // Respawn anchored to paddle
                isBallLaunched = false;
                balls.push({
                    x: paddle.x + paddle.width / 2,
                    y: paddle.y - 8,
                    vx: 0,
                    vy: 0,
                    radius: 6,
                    trail: []
                });
            }
        }

        // Check level clear
        const remaining = bricks.filter(br => br.alive);
        if (remaining.length === 0) {
            level++;
            playBeep('powerup');
            resetLevel();
            updateStatsUI();
        }

        // Update powerups
        for (let i = powerups.length - 1; i >= 0; i--) {
            const p = powerups[i];
            p.y += p.vy;

            // Catch powerup
            if (
                p.y >= paddle.y &&
                p.y <= paddle.y + paddle.height &&
                p.x >= paddle.x &&
                p.x <= paddle.x + paddle.width
            ) {
                applyPowerup(p.type);
                powerups.splice(i, 1);
                playBeep('powerup');
            } else if (p.y > canvas.height) {
                powerups.splice(i, 1);
            }
        }

        // Update particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const pt = particles[i];
            pt.x += pt.vx;
            pt.y += pt.vy;
            pt.alpha -= 0.025;
            if (pt.alpha <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    function applyPowerup(type) {
        if (type === 'multiball') {
            if (balls.length > 0) {
                const src = balls[0];
                balls.push({
                    x: src.x, y: src.y,
                    vx: (src.vx || 3) * 0.8 + 2, vy: (src.vy || -4),
                    radius: 6, trail: []
                });
                balls.push({
                    x: src.x, y: src.y,
                    vx: (src.vx || -3) * 0.8 - 2, vy: (src.vy || -4),
                    radius: 6, trail: []
                });
            }
        } else if (type === 'wide') {
            paddle.width = 150;
            paddle.isLaser = true;
            setTimeout(() => {
                paddle.width = 100;
                paddle.isLaser = false;
            }, 10000);
        } else if (type === 'life') {
            if (lives < 5) lives++;
            updateStatsUI();
        }
    }

    function draw() {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background subtle grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 30) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }

        // Draw Bricks
        for (const br of bricks) {
            if (!br.alive) continue;
            ctx.fillStyle = br.color;
            ctx.shadowColor = br.glow;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.roundRect(br.x, br.y, br.w, br.h, 4);
            ctx.fill();

            // Inner gloss highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.fillRect(br.x + 2, br.y + 2, br.w - 4, 3);
        }
        ctx.shadowBlur = 0;

        // Draw Paddle
        ctx.fillStyle = paddle.isLaser ? '#00e5ff' : '#ffffff';
        ctx.shadowColor = paddle.isLaser ? 'rgba(0, 229, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)';
        ctx.shadowBlur = paddle.isLaser ? 14 : 6;
        ctx.beginPath();
        ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 6);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw Balls & Trails
        for (const b of balls) {
            // Trail
            for (let t = 0; t < b.trail.length; t++) {
                const tr = b.trail[t];
                ctx.fillStyle = `rgba(0, 230, 118, ${t * 0.12})`;
                ctx.beginPath();
                ctx.arc(tr.x, tr.y, b.radius * (0.5 + t * 0.1), 0, Math.PI * 2);
                ctx.fill();
            }

            // Ball core
            ctx.fillStyle = '#00e676';
            ctx.shadowColor = 'rgba(0, 230, 118, 0.6)';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Prompt if ball is waiting to launch
        if (!isBallLaunched && isRunning && !isPaused) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.font = '600 13px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Click or Press Space to Launch', paddle.x + paddle.width / 2, paddle.y - 20);
        }

        // Draw Powerups
        for (const p of powerups) {
            ctx.save();
            ctx.translate(p.x, p.y);
            let pColor = '#ffd60a';
            let pLabel = '★';
            if (p.type === 'multiball') { pColor = '#00e5ff'; pLabel = '3×'; }
            else if (p.type === 'wide') { pColor = '#bf5af2'; pLabel = '↔'; }
            else if (p.type === 'life') { pColor = '#ff3b30'; pLabel = '♥'; }

            ctx.fillStyle = pColor;
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pLabel, 0, 0);
            ctx.restore();
        }

        // Draw Particles
        for (const pt of particles) {
            ctx.fillStyle = pt.color;
            ctx.globalAlpha = Math.max(0, pt.alpha);
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    function updateStatsUI() {
        const scoreEl = document.getElementById('breakout-score');
        const highEl = document.getElementById('breakout-highscore');
        const livesEl = document.getElementById('breakout-lives');
        const levelEl = document.getElementById('breakout-level');

        if (scoreEl) scoreEl.textContent = score;
        if (highEl) highEl.textContent = highScore;
        if (levelEl) levelEl.textContent = level;

        if (livesEl) {
            let hearts = '';
            for (let i = 0; i < lives; i++) hearts += '❤️ ';
            livesEl.textContent = hearts.trim();
        }
    }

    function toggleBreakoutPause() {
        if (!isRunning) return;
        isPaused = !isPaused;
        const overlay = document.getElementById('breakout-overlay');
        const title = document.getElementById('breakout-overlay-title');
        const desc = document.getElementById('breakout-overlay-desc');
        const btn = document.getElementById('breakout-overlay-btn');

        if (isPaused) {
            if (title) title.textContent = 'Paused';
            if (desc) desc.textContent = 'Press Space or click Resume to keep breaking bricks.';
            if (btn) btn.textContent = 'Resume Game';
            if (overlay) overlay.classList.add('open');
        } else {
            if (overlay) overlay.classList.remove('open');
        }
    }

    function gameOver(victory = false) {
        isRunning = false;
        const overlay = document.getElementById('breakout-overlay');
        const title = document.getElementById('breakout-overlay-title');
        const desc = document.getElementById('breakout-overlay-desc');
        const btn = document.getElementById('breakout-overlay-btn');

        if (title) title.textContent = victory ? 'Victory!' : 'Game Over';
        if (desc) desc.textContent = `You scored ${score} points! High Score is ${highScore}.`;
        if (btn) btn.textContent = 'Play Again';
        if (overlay) overlay.classList.add('open');
    }

    // Window lifecycle
    window.openBreakout = function() {
        if (typeof openWindow === 'function') openWindow('breakout-window');
        if (!canvas) initGame();
        startNewGame();
    };

    window.closeBreakout = function() {
        isRunning = false;
        if (animId) cancelAnimationFrame(animId);
        const win = document.getElementById('breakout-window');
        if (win && !win.classList.contains('hidden') && typeof closeWindow === 'function') {
            closeWindow('breakout-window');
        }
    };

    window.startBreakoutGame = startNewGame;
    window.toggleBreakoutPause = toggleBreakoutPause;

    document.addEventListener('DOMContentLoaded', initGame);
})();
