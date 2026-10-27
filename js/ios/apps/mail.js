/* ==========================================================================
   Mail — a short inbox from Mudit, and a way to write back
   --------------------------------------------------------------------------
   Compose sends through js/shared/contact-form.js, the same path the Mac's
   Mail uses. A reply-to address is required (otherwise Mudit can't answer),
   drafts survive closing the app, and a failed send says so and offers the
   visitor's own mail app instead of pretending it worked.
   ========================================================================== */

(function () {
    const P = window.PROFILE_DATA || {};
    const C = P.contact || {};
    const DRAFT_KEY = 'ios-mail-draft';
    const READ_KEY = 'ios-mail-read';
    const first = (P.name || 'Mudit').split(' ')[0];

    function readIds() { try { return JSON.parse(localStorage.getItem(READ_KEY) || '[]'); } catch (e) { return []; } }
    function markRead(id) { const r = new Set(readIds()); r.add(id); try { localStorage.setItem(READ_KEY, JSON.stringify([...r])); } catch (e) { /* ignore */ } }

    function inbox() {
        const exp = P.experience || [];
        const projects = typeof getPortfolioProjects === 'function' ? getPortfolioProjects() : [];
        const live = projects.filter(p => p.live);
        return [
            {
                id: 'hello', date: 'Today', subject: 'Open to AI/ML & SWE roles',
                snippet: `Thanks for opening my portfolio on your phone. ${P.bio || ''}`,
                body: `<p>Hi there,</p>
                    <p>Thanks for opening my portfolio on your phone.</p>
                    <p>${escapeHtml(P.bio || '')}</p>
                    <p>So far I’ve worked at ${exp.map(x => `<strong>${escapeHtml(IOS.shortOrg(x.org))}</strong>`).join(', ')}. I’m looking for roles in applied ML, LLM systems and computer vision.</p>
                    <p>— ${escapeHtml(first)}</p>`,
                attachment: true
            },
            {
                id: 'live', date: 'Yesterday', subject: `${live.length} things you can try right now`,
                snippet: live.map(p => p.name).join(' · '),
                body: `<p>These are deployed — open them in your browser:</p><ul>${live.map(p => `<li><a href="${escapeHtml(safeUrl(p.link))}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.name)}</a> — ${escapeHtml(p.subtitle)}</li>`).join('')}</ul><p>Everything else is open source on GitHub.</p>`
            },
            {
                id: 'iris', date: 'Monday', subject: 'Ask Iris anything',
                snippet: 'An assistant that answers from my portfolio — and shows its sources.',
                body: `<p>Iris lives in Messages. It answers questions about my projects, experience and skills using only what’s on this site, and every answer lists the sources it came from.</p><p>Try: <em>“What did he build at Zee?”</em></p>`,
                cta: 'Open Messages'
            }
        ];
    }

    function list(content) {
        const read = new Set(readIds());
        const mails = inbox();
        content.innerHTML = `
            <div class="ios-group mail-list">${mails.map(m => `
                <button type="button" class="mail-row ${read.has(m.id) ? '' : 'unread'}" data-mail="${m.id}">
                    <span class="mail-dot"></span>
                    <span class="mail-row-main">
                        <span class="mail-row-top"><strong>${escapeHtml(P.name)}</strong><small>${escapeHtml(m.date)} <i class="fas fa-chevron-right"></i></small></span>
                        <span class="mail-row-subject">${escapeHtml(m.subject)}</span>
                        <span class="mail-row-snippet">${escapeHtml(m.snippet)}</span>
                    </span>
                </button>`).join('')}
            </div>
            <p class="mail-updated">Updated just now · ${mails.filter(m => !read.has(m.id)).length} unread</p>
            <button type="button" class="mail-compose-fab" aria-label="New message"><i class="fas fa-pen-to-square"></i></button>`;
        content.querySelector('.mail-list').addEventListener('click', (e) => {
            const row = e.target.closest('[data-mail]');
            if (row) IOS.go('mail', ['m', row.dataset.mail]);
        });
        content.querySelector('.mail-compose-fab').addEventListener('click', () => IOS.go('mail', ['compose']));
    }

    function message(content, id) {
        const m = inbox().find(x => x.id === id);
        if (!m) { content.innerHTML = IOS.emptyState('fas fa-envelope', 'Message not found', ''); return; }
        markRead(id);
        content.innerHTML = `
            <article class="mail-message">
                <header>
                    <span class="mail-avatar">${escapeHtml((P.name || 'M A').split(' ').map(w => w[0]).join('').slice(0, 2))}</span>
                    <span class="mail-from">
                        <strong>${escapeHtml(P.name)}</strong>
                        <small>To: You · ${escapeHtml(m.date)}</small>
                    </span>
                </header>
                <h2>${escapeHtml(m.subject)}</h2>
                <div class="mail-body">${m.body}</div>
                ${m.attachment ? `<button type="button" class="mail-attachment" data-action="resume"><i class="fas fa-file-pdf"></i><span><strong>MuditAgrawalResumeAugust2026.pdf</strong><small>PDF Document</small></span><i class="fas fa-chevron-right"></i></button>` : ''}
                ${m.cta ? `<button type="button" class="ios-btn block" data-action="iris">${escapeHtml(m.cta)}</button>` : ''}
            </article>
            <div class="mail-reply-bar">
                <button type="button" class="ios-btn" data-action="reply"><i class="fas fa-reply"></i> Reply</button>
                <a class="ios-btn secondary" href="${escapeHtml(safeUrl(C.linkedin))}" target="_blank" rel="noopener noreferrer"><i class="fab fa-linkedin-in"></i> LinkedIn</a>
            </div>`;
        IOS.bind(content, {
            resume: () => IOS.go('resume'),
            iris: () => IOS.go('messages'),
            reply: () => {
                const d = loadDraft();
                if (!d.subject) saveDraft({ ...d, subject: `Re: ${m.subject}` });
                IOS.go('mail', ['compose']);
            }
        });
    }

    function loadDraft() { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}'); } catch (e) { return {}; } }
    function saveDraft(d) { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch (e) { /* ignore */ } }
    function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ } }

    let compose = null;   // the form while mounted

    function composer(content) {
        const d = loadDraft();
        content.innerHTML = `
            <form class="mail-compose" novalidate>
                <div class="mail-field"><span>To:</span><span class="mail-to-chip">${escapeHtml(P.name)}</span></div>
                <label class="mail-field"><span>From:</span><input name="name" placeholder="Your name" autocomplete="name" value="${escapeHtml(d.name || '')}"></label>
                <label class="mail-field"><span>Reply-To:</span><input name="email" type="email" inputmode="email" placeholder="you@example.com" autocomplete="email" required value="${escapeHtml(d.email || '')}"></label>
                <label class="mail-field"><span>Subject:</span><input name="subject" placeholder="Subject" value="${escapeHtml(d.subject || '')}"></label>
                <textarea name="message" placeholder="Write your message…" aria-label="Message">${escapeHtml(d.message || '')}</textarea>
                <p class="mail-hint" role="status"></p>
            </form>`;
        compose = content.querySelector('form');
        compose.addEventListener('input', () => saveDraft(Object.fromEntries(new FormData(compose))));
        compose.addEventListener('submit', (e) => { e.preventDefault(); send(); });
        if (!d.email) setTimeout(() => { const f = compose && compose.querySelector('[name="name"]'); if (f && !f.value) f.focus(); }, 450);
    }

    async function send() {
        if (!compose) return;
        const f = Object.fromEntries(new FormData(compose));
        const hint = compose.querySelector('.mail-hint');
        const bad = (name, msg) => { hint.textContent = msg; hint.classList.add('error'); compose.querySelector(`[name="${name}"]`).focus(); };
        if (!isValidEmail(f.email)) return bad('email', 'Add an email address so Mudit can reply.');
        if (!String(f.message || '').trim()) return bad('message', 'Write a message first.');
        hint.classList.remove('error');
        hint.textContent = 'Sending…';
        compose.classList.add('sending');
        const result = await sendContactMessage({ name: f.name, email: f.email, subject: f.subject || 'Hello from your portfolio', message: f.message, via: 'Portfolio — iPhone Mail' });
        compose && compose.classList.remove('sending');
        if (result.sent) {
            clearDraft();
            showToast('Message sent', { body: `${first} will reply to ${f.email}`, icon: 'fas fa-paper-plane' });
            IOS.back();
        } else {
            hint.textContent = '';
            const mailto = `mailto:${C.email}?subject=${encodeURIComponent(f.subject || 'Hello')}&body=${encodeURIComponent(f.message)}`;
            showToast('Couldn’t send', { body: 'Your draft is saved.', icon: 'fas fa-triangle-exclamation', duration: 7000, action: { label: 'Use Mail', run: () => { location.href = mailto; } } });
        }
    }

    IOS.register('mail', {
        name: 'Mail',
        icon: 'assets/icons/mail.png',
        keywords: 'email contact message write hire',
        pages(path) {
            const root = { key: 'inbox', title: 'Inbox', render: list };
            if (path[0] === 'compose') {
                return [root, {
                    key: 'compose', title: 'New Message', largeTitle: false, className: 'mail-compose-page', backTitle: 'Inbox',
                    actions: [{ icon: 'fas fa-circle-arrow-up', label: 'Send', onClick: () => send() }],
                    render: composer
                }];
            }
            if (path[0] === 'm' && path[1]) return [root, { key: `m-${path[1]}`, title: '', largeTitle: false, className: 'mail-message-page', render: (c) => message(c, path[1]) }];
            return [root];
        },
        onClose() { compose = null; }
    });
})();
