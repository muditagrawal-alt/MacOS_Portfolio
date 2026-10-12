/* ==========================================================================
   Snake.app — Retro macOS Arcade Edition Controller
   ========================================================================== */

(function() {
    let canvas, ctx;
    let gameLoopId = null;
    let isRunning = false;
    let isPaused = false;
    let isWaitingForStart = true;
    let score = 0;
    let highScore = 0;

    const GRID_SIZE = 22;
    const CELL_SIZE = 20; // 440 x 440 canvas
    let snake = [];
    let dir = { x: 1, y: 0 };
    let inputQueue = [];
    let food = { x: 15, y: 11, type: 'apple' };
    let goldenFood = null;
    let goldenTimer = null;
    let particles = [];
    let speed = 125;

    // Synth Audio
    function playSnakeSound(type = 'eat') {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const actx = new AudioCtx();
            const now = actx.currentTime;
            const osc = actx.createOscillator();
            const gain = actx.createGain();

            if (type === 'eat') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(480, now);
                osc.frequency.exponentialRampToValueAtTime(720, now + 0.08);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.08);
            } else if (type === 'golden') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(520, now);
                osc.frequency.setValueAtTime(780, now + 0.08);
                osc.frequency.setValueAtTime(1040, now + 0.16);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
                osc.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.28);
            } else if (type === 'crash') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(160, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
            }
        } catch (e) {}
    }

    function initSnake() {
        canvas = document.getElementById('snake-canvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        canvas.width = GRID_SIZE * CELL_SIZE;
        canvas.height = GRID_SIZE * CELL_SIZE;

        try {
            const saved = localStorage.getItem('snake_highscore');
            if (saved) highScore = parseInt(saved, 10) || 0;
        } catch (e) {}

        updateStatsUI();
        setupControls();
    }

    function setupControls() {
        window.addEventListener('keydown', (e) => {
            const win = document.getElementById('snake-window');
            if (!win || win.classList.contains('hidden')) return;

            // Focus isolation: only steer if Snake window is active
            if (!win.classList.contains('is-active')) return;

            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                queueDirection(0, -1);
                e.preventDefault();
            } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                queueDirection(0, 1);
                e.preventDefault();
            } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                queueDirection(-1, 0);
                e.preventDefault();
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                queueDirection(1, 0);
                e.preventDefault();
            } else if (e.code === 'Space') {
                e.preventDefault();
                toggleSnakePause();
            }
        });
    }

    // Input queue prevents rapid 180-degree suicide bugs
    function queueDirection(x, y) {
        if (!isRunning || isPaused) return;

        if (isWaitingForStart) {
            isWaitingForStart = false;
        }

        const lastDirection = inputQueue.length > 0 ? inputQueue[inputQueue.length - 1] : dir;
        // Don't queue reverse direction
        if (lastDirection.x !== 0 && x === -lastDirection.x) return;
        if (lastDirection.y !== 0 && y === -lastDirection.y) return;
        // Don't queue identical direction
        if (lastDirection.x === x && lastDirection.y === y) return;

        if (inputQueue.length < 3) {
            inputQueue.push({ x, y });
        }
    }

    window.snakeControl = function(direction) {
        if (direction === 'up') queueDirection(0, -1);
        else if (direction === 'down') queueDirection(0, 1);
        else if (direction === 'left') queueDirection(-1, 0);
        else if (direction === 'right') queueDirection(1, 0);
    };

    function startNewGame() {
        score = 0;
        speed = 125;
        dir = { x: 1, y: 0 };
        inputQueue = [];
        isWaitingForStart = true;
        particles = [];
        goldenFood = null;
        if (goldenTimer) clearTimeout(goldenTimer);

        // Center snake (3 segments)
        snake = [
            { x: 8, y: 11 },
            { x: 7, y: 11 },
            { x: 6, y: 11 }
        ];

        spawnFood();
        updateStatsUI();

        const overlay = document.getElementById('snake-overlay');
        if (overlay) overlay.classList.remove('open');

        isRunning = true;
        isPaused = false;
        if (gameLoopId) clearTimeout(gameLoopId);
        tick();
    }

    function spawnFood() {
        let emptyCells = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                if (!snake.some(s => s.x === x && s.y === y)) {
                    emptyCells.push({ x, y });
                }
            }
        }
        if (emptyCells.length > 0) {
            const pick = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            food = { x: pick.x, y: pick.y, type: 'apple' };
        }

        // 20% chance to spawn temporary golden apple
        if (!goldenFood && Math.random() < 0.22 && score >= 20) {
            const goldPick = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            goldenFood = { x: goldPick.x, y: goldPick.y };
            goldenTimer = setTimeout(() => {
                goldenFood = null;
            }, 6500);
        }
    }

    function tick() {
        if (!isRunning) return;

        if (!isPaused && !isWaitingForStart) {
            if (inputQueue.length > 0) {
                dir = inputQueue.shift();
            }

            const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

            // Wall collisions
            if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
                playSnakeSound('crash');
                gameOver();
                return;
            }

            // Self collisions
            if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
                playSnakeSound('crash');
                gameOver();
                return;
            }

            snake.unshift(head);

            // Eat regular apple
            if (head.x === food.x && head.y === food.y) {
                score += 10;
                playSnakeSound('eat');
                createBurst(head.x * CELL_SIZE + CELL_SIZE / 2, head.y * CELL_SIZE + CELL_SIZE / 2, '#ff3b30');
                if (score > highScore) {
                    highScore = score;
                    try { localStorage.setItem('snake_highscore', highScore.toString()); } catch (e) {}
                }
                speed = Math.max(70, 125 - Math.floor(score / 30) * 5);
                spawnFood();
                updateStatsUI();
            }
            // Eat golden apple
            else if (goldenFood && head.x === goldenFood.x && head.y === goldenFood.y) {
                score += 50;
                playSnakeSound('golden');
                createBurst(head.x * CELL_SIZE + CELL_SIZE / 2, head.y * CELL_SIZE + CELL_SIZE / 2, '#ffd60a');
                if (score > highScore) {
                    highScore = score;
                    try { localStorage.setItem('snake_highscore', highScore.toString()); } catch (e) {}
                }
                goldenFood = null;
                if (goldenTimer) clearTimeout(goldenTimer);
                updateStatsUI();
            } else {
                snake.pop();
            }
        }

        draw();
        gameLoopId = setTimeout(tick, speed);
    }

    function createBurst(x, y, color) {
        for (let i = 0; i < 8; i++) {
            particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                color,
                alpha: 1,
                size: 3
            });
        }
    }

    function draw() {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Checkerboard subtle grid
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                if ((x + y) % 2 === 0) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
                    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                }
            }
        }

        // Draw Food (Apple)
        const fx = food.x * CELL_SIZE;
        const fy = food.y * CELL_SIZE;
        ctx.fillStyle = '#ff3b30';
        ctx.shadowColor = 'rgba(255, 59, 48, 0.5)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(fx + CELL_SIZE / 2, fy + CELL_SIZE / 2 + 1, CELL_SIZE * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Stem & tiny green leaf
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#30d158';
        ctx.beginPath();
        ctx.arc(fx + CELL_SIZE / 2 + 2, fy + 4, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Draw Golden Apple if active
        if (goldenFood) {
            const gx = goldenFood.x * CELL_SIZE;
            const gy = goldenFood.y * CELL_SIZE;
            ctx.fillStyle = '#ffd60a';
            ctx.shadowColor = 'rgba(255, 214, 10, 0.8)';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(gx + CELL_SIZE / 2, gy + CELL_SIZE / 2, CELL_SIZE * 0.45, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Draw Snake
        for (let i = 0; i < snake.length; i++) {
            const seg = snake[i];
            const sx = seg.x * CELL_SIZE;
            const sy = seg.y * CELL_SIZE;

            if (i === 0) {
                // Head
                ctx.fillStyle = '#30d158';
                ctx.shadowColor = 'rgba(48, 209, 88, 0.4)';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.roundRect(sx + 1, sy + 1, CELL_SIZE - 2, CELL_SIZE - 2, 6);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Eyes oriented toward direction
                ctx.fillStyle = '#0a0d14';
                let eye1 = { x: sx + 5, y: sy + 5 };
                let eye2 = { x: sx + 13, y: sy + 5 };

                if (dir.x === 1) {
                    eye1 = { x: sx + 13, y: sy + 4 };
                    eye2 = { x: sx + 13, y: sy + 12 };
                } else if (dir.x === -1) {
                    eye1 = { x: sx + 5, y: sy + 4 };
                    eye2 = { x: sx + 5, y: sy + 12 };
                } else if (dir.y === 1) {
                    eye1 = { x: sx + 4, y: sy + 13 };
                    eye2 = { x: sx + 12, y: sy + 13 };
                } else if (dir.y === -1) {
                    eye1 = { x: sx + 4, y: sy + 4 };
                    eye2 = { x: sx + 12, y: sy + 4 };
                }

                ctx.beginPath();
                ctx.arc(eye1.x, eye1.y, 2, 0, Math.PI * 2);
                ctx.arc(eye2.x, eye2.y, 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Body segments with fading gradient
                const shade = Math.max(0.4, 1 - (i / snake.length) * 0.6);
                ctx.fillStyle = `rgba(52, 199, 89, ${shade})`;
                ctx.beginPath();
                ctx.roundRect(sx + 2, sy + 2, CELL_SIZE - 4, CELL_SIZE - 4, 4);
                ctx.fill();
            }
        }

        // Prompt if waiting for player to press first arrow key
        if (isWaitingForStart && isRunning && !isPaused) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.font = '600 13px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Press any Arrow Key to Start', canvas.width / 2, canvas.height / 2 + 50);
        }

        // Draw Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.05;
            if (p.alpha <= 0) {
                particles.splice(i, 1);
                continue;
            }
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    function updateStatsUI() {
        const scoreEl = document.getElementById('snake-score');
        const highEl = document.getElementById('snake-highscore');
        const lengthEl = document.getElementById('snake-length');

        if (scoreEl) scoreEl.textContent = score;
        if (highEl) highEl.textContent = highScore;
        if (lengthEl) lengthEl.textContent = snake.length;
    }

    function toggleSnakePause() {
        if (!isRunning) return;
        isPaused = !isPaused;
        const overlay = document.getElementById('snake-overlay');
        const title = document.getElementById('snake-overlay-title');
        const desc = document.getElementById('snake-overlay-desc');
        const btn = document.getElementById('snake-overlay-btn');

        if (isPaused) {
            if (title) title.textContent = 'Paused';
            if (desc) desc.textContent = 'Press Space or click Resume to continue playing.';
            if (btn) btn.textContent = 'Resume Game';
            if (overlay) overlay.classList.add('open');
        } else {
            if (overlay) overlay.classList.remove('open');
        }
    }

    function gameOver() {
        isRunning = false;
        if (gameLoopId) clearTimeout(gameLoopId);
        const overlay = document.getElementById('snake-overlay');
        const title = document.getElementById('snake-overlay-title');
        const desc = document.getElementById('snake-overlay-desc');
        const btn = document.getElementById('snake-overlay-btn');

        if (title) title.textContent = 'Game Over';
        if (desc) desc.textContent = `You scored ${score} points! Snake length: ${snake.length}.`;
        if (btn) btn.textContent = 'Play Again';
        if (overlay) overlay.classList.add('open');
    }

    // Window lifecycle
    window.openSnake = function() {
        if (typeof openWindow === 'function') openWindow('snake-window');
        if (!canvas) initSnake();
        startNewGame();
    };

    window.closeSnake = function() {
        isRunning = false;
        if (gameLoopId) clearTimeout(gameLoopId);
        if (typeof closeWindow === 'function') closeWindow('snake-window');
    };

    window.startSnakeGame = startNewGame;
    window.toggleSnakePause = toggleSnakePause;

    document.addEventListener('DOMContentLoaded', initSnake);
})();
