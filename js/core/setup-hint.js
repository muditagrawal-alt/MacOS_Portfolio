/* ==========================================================================
   Setup hint — "make it yours" for whoever just cloned the repository
   --------------------------------------------------------------------------
   Only on a local server started with `npm start` (which answers
   /__setup/status): if the questionnaire hasn't been completed, a small card
   offers it. A deployed site never asks — the status endpoint only exists
   locally, and on any other host this script does nothing at all.
   ========================================================================== */

(function () {
    if (location.protocol !== 'http:' || !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
    // Not inside the questionnaire's own live preview.
    if (window.PORTFOLIO_PREVIEW || window.self !== window.top) return;
    try { if (sessionStorage.getItem('setup-hint-dismissed')) return; } catch (e) { /* private mode */ }

    fetch('/__setup/status', { cache: 'no-store' })
        .then(r => (r.ok ? r.json() : null))
        .then(status => {
            if (!status || !status.pending) return;
            const card = document.createElement('div');
            card.className = 'setup-hint';
            card.setAttribute('role', 'dialog');
            card.setAttribute('aria-label', 'Make this portfolio yours');
            card.innerHTML = `
                <strong>Make this portfolio yours</strong>
                <span>It still shows ${status.owner ? `${escapeHtml(status.owner)}’s` : 'the template’s'} details. A short questionnaire rewrites them with yours.</span>
                <div><a href="/setup/">Start setup</a><button type="button">Not now</button></div>`;
            const style = document.createElement('style');
            style.textContent = `
                .setup-hint { position: fixed; right: 16px; bottom: calc(16px + env(safe-area-inset-bottom)); z-index: 2147483000; display: flex; flex-direction: column; gap: 6px;
                    width: min(330px, calc(100vw - 32px)); padding: 14px 16px; border-radius: 16px; background: rgba(28, 28, 30, 0.92); color: #fff;
                    -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px); box-shadow: 0 18px 50px rgba(0, 0, 0, 0.35);
                    font: 13px/1.4 -apple-system, BlinkMacSystemFont, system-ui, sans-serif; animation: setup-hint-in 0.4s ease both; }
                .setup-hint strong { font-size: 15px; }
                .setup-hint span { color: rgba(255, 255, 255, 0.72); }
                .setup-hint div { display: flex; gap: 8px; margin-top: 6px; }
                .setup-hint a, .setup-hint button { flex: 1; padding: 8px 10px; border: none; border-radius: 10px; font: inherit; font-weight: 600; text-align: center; text-decoration: none; cursor: pointer; }
                .setup-hint a { background: #0a84ff; color: #fff; }
                .setup-hint button { background: rgba(255, 255, 255, 0.12); color: #fff; }
                @keyframes setup-hint-in { from { opacity: 0; transform: translateY(12px); } }`;
            card.querySelector('button').addEventListener('click', () => {
                card.remove();
                try { sessionStorage.setItem('setup-hint-dismissed', '1'); } catch (e) { /* private mode */ }
            });
            document.head.appendChild(style);
            document.body.appendChild(card);
        })
        .catch(() => { /* not our dev server — nothing to offer */ });
})();
