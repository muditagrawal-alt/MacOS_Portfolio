/* ==========================================================================
   Messages — a conversation with Iris
   --------------------------------------------------------------------------
   Iris on iPhone is the same engine as on the Mac (js/apps/iris-brain.js):
   answers are built from retrieved portfolio passages and every one shows
   its sources; tapping a source opens the app it came from. With
   IRIS_ENDPOINT configured, the hosted model phrases the answer from the
   same passages (api/iris.js owns the prompt).
   ========================================================================== */

(function () {
    const THREAD_KEY = 'ios-iris-thread';
    const P = window.PROFILE_DATA;
    const pr = P.pron;
    // Written from the info bank, so each one has an answer.
    const SUGGESTIONS = [
        `What ${pr.have} ${pr.subject} built?`,
        P.experience.length && `Where ${pr.have} ${pr.subject} worked?`,
        P.projects[0] && `What is ${P.projects[0].name}?`,
        P.skills.length && `What’s ${pr.possessive} tech stack?`,
        `How do I contact ${pr.object}?`
    ].filter(Boolean);
    let thread = [];          // [{ role: 'user'|'iris', text, q? }]
    let busy = false;
    let view = null;          // { list, input, send, suggest } while the page is mounted
    let pending = null;       // question asked before the page mounted

    try { thread = JSON.parse(sessionStorage.getItem(THREAD_KEY) || '[]'); } catch (e) { thread = []; }
    const save = () => { try { sessionStorage.setItem(THREAD_KEY, JSON.stringify(thread.slice(-40))); } catch (e) { /* private mode */ } };

    /** Same light formatting the Mac uses: **bold**, [links](url), • bullets, newlines. */
    function format(text) {
        let out = escapeHtml(text);
        out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, url) => {
            const href = safeUrl(url.replace(/&amp;/g, '&'));
            return href === '#' ? label : `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
        });
        return out.replace(/^• /gm, '&bull; ').replace(/\n/g, '<br>');
    }

    function bubble(msg, i) {
        if (msg.role === 'user') return `<div class="msg-row me"><div class="msg-bubble">${escapeHtml(msg.text)}</div></div>`;
        // Sources are re-derived from the question: retrieval is deterministic,
        // and functions can't be stored in sessionStorage.
        const local = msg.q && window.IrisBrain ? IrisBrain.respond(msg.q) : { sources: [] };
        const sources = local.sources || [];
        const card = local.card;
        return `<div class="msg-row iris" data-i="${i}">
            <div class="msg-bubble">${format(msg.text)}</div>
            ${card ? `<button type="button" class="msg-card" data-card="${i}"><i class="${escapeHtml(card.icon || 'fas fa-arrow-right')}"></i><span><strong>${escapeHtml(card.title)}</strong><small>${escapeHtml(card.subtitle || '')}</small></span><em>${escapeHtml(card.btnText || 'Open')}</em></button>` : ''}
            ${sources.length ? `<div class="msg-sources"><span>Sources</span>${sources.map((s, k) => `<button type="button" data-src="${i}:${k}" ${s.open ? '' : 'disabled'}>${escapeHtml(s.label)}</button>`).join('')}</div>` : ''}
        </div>`;
    }

    function renderThread() {
        if (!view) return;
        view.list.innerHTML = `
            <div class="msg-intro">
                <img src="assets/icons/siri.png" alt="">
                <strong>Iris</strong>
                <span>${escapeHtml(P.first)}’s assistant · answers from ${escapeHtml(pr.possessive)} portfolio, with sources</span>
            </div>
            <div class="msg-stamp">Today</div>
            <div class="msg-row iris"><div class="msg-bubble">Hi! I’m Iris. Ask me about ${escapeHtml(P.first)}’s projects, experience or skills — I’ll show where every answer comes from.</div></div>
            ${thread.map(bubble).join('')}
            ${busy ? '<div class="msg-row iris"><div class="msg-bubble msg-typing" aria-label="Iris is typing"><i></i><i></i><i></i></div></div>' : ''}`;
        view.suggest.hidden = thread.length > 0;
        requestAnimationFrame(() => { view && (view.body.scrollTop = view.body.scrollHeight); });
    }

    async function callModel(question) {
        const endpoint = window.APP_CONFIG && window.APP_CONFIG.IRIS_ENDPOINT;
        if (!endpoint) return null;
        const history = thread.slice(-6).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));
        const context = window.IrisBrain ? IrisBrain.contextFor(question, 6) : [];
        try {
            const ctrl = new AbortController();
            const to = setTimeout(() => ctrl.abort(), 12000);
            const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history, context }), signal: ctrl.signal });
            clearTimeout(to);
            if (!res.ok) return null;
            const data = await res.json();
            return data.reply || null;
        } catch (e) { return null; }
    }

    async function ask(text) {
        const q = String(text || '').trim();
        if (!q || busy) return;
        thread.push({ role: 'user', text: q });
        busy = true;
        save();
        renderThread();
        IOS.haptic();
        const local = window.IrisBrain ? IrisBrain.respond(q) : { text: 'I can’t reach my knowledge base right now.', sources: [] };
        const started = performance.now();
        let reply = local.outOfScope ? null : await callModel(q);
        // A beat of "typing" even for instant local answers reads as a reply, not a glitch.
        const wait = Math.max(0, 550 - (performance.now() - started));
        await new Promise(r => setTimeout(r, wait));
        reply = reply || local.text;
        thread.push({ role: 'iris', text: reply, q });
        busy = false;
        save();
        renderThread();
    }

    window.iosAskIris = (q) => { if (view) ask(q); else pending = q; };

    function chat(content, ctx) {
        content.innerHTML = '<div class="msg-list" aria-live="polite"></div>';
        const composer = document.createElement('form');
        composer.className = 'msg-composer';
        composer.innerHTML = `
            <div class="msg-suggest">${SUGGESTIONS.map(s => `<button type="button">${escapeHtml(s)}</button>`).join('')}</div>
            <div class="msg-bar">
                <input type="text" placeholder="Ask Iris" aria-label="Message Iris" autocomplete="off" enterkeyhint="send">
                <button type="submit" class="msg-send" aria-label="Send" disabled><i class="fas fa-arrow-up"></i></button>
            </div>`;
        ctx.page.appendChild(composer);
        view = {
            list: content.querySelector('.msg-list'),
            body: ctx.body,
            input: composer.querySelector('input'),
            send: composer.querySelector('.msg-send'),
            suggest: composer.querySelector('.msg-suggest')
        };
        const v = view;
        v.input.addEventListener('input', () => { v.send.disabled = !v.input.value.trim(); });
        composer.addEventListener('submit', (e) => {
            e.preventDefault();
            const q = v.input.value;
            v.input.value = '';
            v.send.disabled = true;
            ask(q);
        });
        v.suggest.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) ask(b.textContent); });
        v.list.addEventListener('click', (e) => {
            const src = e.target.closest('[data-src]');
            const card = e.target.closest('[data-card]');
            const msg = thread[Number((src ? src.dataset.src.split(':')[0] : card && card.dataset.card))];
            if (!msg || !msg.q) return;
            const local = IrisBrain.respond(msg.q);
            if (src) {
                const s = (local.sources || [])[Number(src.dataset.src.split(':')[1])];
                if (s && s.open) s.open();
            } else if (card && local.card && local.card.action) {
                // Card actions are fixed strings written in iris-brain.js, never user text.
                try { new Function(local.card.action)(); } catch (err) { console.error('[Iris] card action failed', err); }
            }
        });
        renderThread();
        if (pending) { const q = pending; pending = null; ask(q); }
    }

    IOS.register('messages', {
        name: 'Messages',
        label: 'Messages',
        icon: 'assets/icons/messages.png',
        keywords: 'iris assistant chat ask ai siri question',
        onClose() { view = null; },
        pages: () => [{
            key: 'chat', title: 'Iris', largeTitle: false, className: 'msg-page', backTitle: 'Iris',
            actions: [{ icon: 'fas fa-rotate-left', label: 'New conversation', onClick: (ctx) => { thread = []; save(); renderThread(); IOS.haptic(); } }],
            render: chat
        }]
    });
})();
