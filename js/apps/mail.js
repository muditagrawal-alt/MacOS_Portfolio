/* ==========================================================================
   Apple Mail.app Controller: 3-Pane Mailboxes, Message Reading & Compose Engine
   ========================================================================== */

let activeMailbox = 'inbox';
let activeEmailId = 1;

const profileRef = window.PROFILE_DATA || {};
const expSummaryList = (profileRef.experience || []).map(e => `<strong>${e.role}</strong> at <strong>${e.org}</strong> (${e.dates})`).join(', ');

const emailStore = [
    {
        id: 1,
        mailbox: 'inbox',
        starred: true,
        unread: true,
        initials: 'MA',
        avatarBg: 'linear-gradient(135deg, #007aff, #00c6ff)',
        from: `${profileRef.name || 'Mudit Agrawal'} <${profileRef.contact?.email || 'muditagrawal03@gmail.com'}>`,
        senderName: profileRef.name || 'Mudit Agrawal',
        to: 'Recruiter / Engineering Leader <you@future.org>',
        date: 'Today at 4:30 PM',
        subject: 'Open for AI/ML Roles & SWE Opportunities',
        snippet: "Hi! I'm actively seeking opportunities in Applied Machine Learning, LLMs, and Computer Vision...",
        body: `
            <p>Hi there,</p>
            <p>Thank you for exploring my macOS portfolio workspace!</p>
            <p>${profileRef.bio || 'Computer Science Undergraduate (AI/ML) at IILM University, building applied AI systems that work reliably outside sandboxes.'}</p>
            <p>My internship experience includes: ${expSummaryList}.</p>
            <p>I am actively open for engineering and machine learning roles where I can contribute to mission-critical systems and learn by doing.</p>
        `,
        actions: [
            { text: 'Reply via Email', icon: 'fas fa-reply', href: `mailto:${profileRef.contact?.email || 'muditagrawal03@gmail.com'}?subject=Opportunity%20Discussion%20with%20Mudit`, primary: true },
            { text: 'Connect on LinkedIn', icon: 'fab fa-linkedin', href: profileRef.contact?.linkedin || 'https://www.linkedin.com/in/mudit-agrawal-167610318', primary: false, target: '_blank' },
            { text: `Call ${profileRef.contact?.phone || '+91-7289887349'}`, icon: 'fas fa-phone', href: `tel:${profileRef.contact?.phone || '+917289887349'}`, primary: false }
        ],
        attachment: {
            title: 'MuditAgrawalResumeAugust2026.pdf',
            size: '1.2 MB • PDF Document',
            action: 'openResumeWindow()'
        }
    },
    {
        id: 2,
        mailbox: 'inbox',
        starred: true,
        unread: false,
        initials: 'LI',
        avatarBg: 'linear-gradient(135deg, #0a66c2, #004182)',
        from: 'LinkedIn Network <notifications@linkedin.com>',
        senderName: 'LinkedIn Network',
        to: 'Mudit Agrawal <muditagrawal03@gmail.com>',
        date: 'Yesterday at 6:15 PM',
        subject: 'Connect on LinkedIn & Professional Discussions',
        snippet: 'Expand your professional network and discuss technology, engineering collaborations, and research...',
        body: `
            <p>Hello Mudit,</p>
            <p>Your profile is open for networking and professional inquiries across AI/ML and software systems.</p>
            <p>Feel free to reach out directly to connect, review recommendations, or discuss potential collaborations and roles.</p>
            <p><strong>Profile:</strong> <a href="https://www.linkedin.com/in/mudit-agrawal-167610318" target="_blank" rel="noopener noreferrer" style="color:#007aff;text-decoration:underline;">linkedin.com/in/mudit-agrawal-167610318</a></p>
        `,
        actions: [
            { text: 'Open LinkedIn Profile', icon: 'fab fa-linkedin', href: 'https://www.linkedin.com/in/mudit-agrawal-167610318', primary: true, target: '_blank' }
        ]
    },
    {
        id: 3,
        mailbox: 'inbox',
        starred: false,
        unread: false,
        initials: 'GH',
        avatarBg: 'linear-gradient(135deg, #24292e, #0d1117)',
        from: 'GitHub Notifications <notifications@github.com>',
        senderName: 'GitHub Repositories',
        to: 'Mudit Agrawal <muditagrawal03@gmail.com>',
        date: 'Aug 15 at 11:20 AM',
        subject: 'Latest Repos: OmniDoc, Sliver.Ai & S.W.O.R.D',
        snippet: 'Recent commits and architectures updated across @muditagrawal-alt open source projects...',
        body: `
            <p>Recent repository highlights on GitHub <strong>@muditagrawal-alt</strong>:</p>
            <ul style="padding-left:20px;margin-bottom:15px;color:#ccc;line-height:1.7;">
                <li><strong>OmniDoc:</strong> Multimodal RAG with Mistral-7B, Nomic quantized embeddings, and BLIP QA.</li>
                <li><strong>Sliver.Ai:</strong> Sub-second video clipping pipeline with YOLOv8-Face & YOLO11m.</li>
                <li><strong>Project S.W.O.R.D:</strong> Real-time weapon observation using YOLOv8 defense module.</li>
                <li><strong>Helix-Compiler:</strong> C-based parsing and language translation engine.</li>
            </ul>
        `,
        actions: [
            { text: 'View GitHub Profile', icon: 'fab fa-github', href: 'https://github.com/muditagrawal-alt', primary: true, target: '_blank' }
        ]
    },
    {
        id: 4,
        mailbox: 'inbox',
        starred: false,
        unread: false,
        initials: 'AB',
        avatarBg: 'linear-gradient(135deg, #f6d365, #fda085)',
        from: "Mudit's Address Book <contact@muditagrawal.dev>",
        senderName: 'Direct Contact Channels',
        to: 'Visitor <guest@macbook>',
        date: 'Aug 12 at 10:00 AM',
        subject: 'Direct Reach: Email, Phone & Schedule a Chat',
        snippet: 'All direct contact lines: muditagrawal03@gmail.com, +91-7289887349, Substack...',
        body: `
            <p>Here are all the direct channels where you can reach Mudit Agrawal:</p>
            <div style="background:rgba(0,0,0,0.3);padding:14px 18px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);margin:14px 0;line-height:1.8;">
                <div>📧 <strong>Email:</strong> <a href="mailto:muditagrawal03@gmail.com" style="color:#007aff;">muditagrawal03@gmail.com</a></div>
                <div>📱 <strong>Phone:</strong> <a href="tel:+917289887349" style="color:#007aff;">+91-7289887349</a></div>
                <div>💼 <strong>LinkedIn:</strong> <a href="https://www.linkedin.com/in/mudit-agrawal-167610318" target="_blank" rel="noopener noreferrer" style="color:#007aff;">mudit-agrawal-167610318</a></div>
                <div>🐙 <strong>GitHub:</strong> <a href="https://github.com/muditagrawal-alt" target="_blank" rel="noopener noreferrer" style="color:#007aff;">muditagrawal-alt</a></div>
                <div>✍️ <strong>Substack:</strong> <a href="https://substack.com/@standardissuemudit" target="_blank" rel="noopener noreferrer" style="color:#007aff;">@standardissuemudit</a></div>
            </div>
        `,
        actions: [
            { text: 'Send Direct Email', icon: 'fas fa-envelope', href: 'mailto:muditagrawal03@gmail.com', primary: true },
            { text: 'Call Mobile', icon: 'fas fa-phone', href: 'tel:+917289887349', primary: false }
        ]
    },
    {
        id: 5,
        mailbox: 'inbox',
        starred: true,
        unread: false,
        initials: 'CV',
        avatarBg: 'linear-gradient(135deg, #43e97b, #38f9d7)',
        from: 'Career Documents <resume@muditagrawal.dev>',
        senderName: 'Resume & Credentials',
        to: 'Visitor <guest@macbook>',
        date: 'Aug 10 at 9:00 AM',
        subject: 'Attached: Mudit Agrawal Resume (PDF Pack)',
        snippet: 'Download or preview the August 2026 résumé for Mudit Agrawal (B.Tech CS AI/ML)...',
        body: `
            <p>Attached is the updated resume document for ${profileRef.name || 'Mudit Agrawal'}.</p>
            <p>Includes complete coursework, academic achievements at ${profileRef.education?.university || 'IILM University'}, ${(profileRef.experience || []).map(e => e.org.split(' (')[0]).join(', ')} internships, and projects.</p>
        `,
        attachment: {
            title: 'MuditAgrawalResumeAugust2026.pdf',
            size: '58 KB • PDF Document',
            action: 'openResumeWindow()'
        },
        actions: [
            { text: 'View Resume Viewer', icon: 'fas fa-file-pdf', href: '#', onclick: 'openResumeWindow()', primary: true }
        ]
    }
];

function updateMailBadges() {
    const unreadCount = emailStore.filter(e => e.mailbox === 'inbox' && e.unread).length;
    const inboxBadge = document.getElementById('mail-inbox-badge');
    if (inboxBadge) {
        inboxBadge.textContent = unreadCount;
        inboxBadge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }

    const dockBadge = document.querySelector('#dock-mail .dock-badge');
    if (dockBadge) {
        dockBadge.textContent = unreadCount;
        dockBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }

    const titleEl = document.getElementById('mail-window-title');
    if (titleEl) {
        titleEl.textContent = `Mail — ${activeMailbox.charAt(0).toUpperCase() + activeMailbox.slice(1)}${unreadCount > 0 ? ` (${unreadCount} Unread)` : ''}`;
    }
}

function renderMailList(filterQuery = '') {
    const listContainer = document.getElementById('mail-list-items');
    if (!listContainer) return;

    let emails = emailStore.filter(e => {
        if (activeMailbox === 'vip') return e.starred && e.mailbox !== 'trash';
        return e.mailbox === activeMailbox;
    });

    if (filterQuery) {
        const q = filterQuery.toLowerCase().trim();
        emails = emails.filter(e => 
            e.subject.toLowerCase().includes(q) ||
            e.senderName.toLowerCase().includes(q) ||
            e.snippet.toLowerCase().includes(q) ||
            e.from.toLowerCase().includes(q)
        );
    }

    if (emails.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align:center;padding:40px 15px;color:#888;font-size:12.5px;">
                <i class="fas fa-inbox fa-2x" style="color:#555;margin-bottom:8px;"></i>
                <div>No messages in ${activeMailbox}</div>
            </div>
        `;
        return;
    }

    // Every field is escaped: Sent/Drafts entries carry text the visitor typed.
    listContainer.innerHTML = emails.map(email => `
        <div class="mail-item ${email.id === activeEmailId ? 'active' : ''}" data-email-id="${email.id}" tabindex="0" role="button"
             onclick="selectEmail(${email.id}, this)" onkeydown="if(event.key==='Enter'){selectEmail(${email.id}, this)}">
            <div class="mail-item-header">
                <div class="mail-sender-row">
                    <span class="unread-dot ${email.unread ? '' : 'read'}"></span>
                    <span class="mail-sender">${escapeHtml(email.senderName)}</span>
                </div>
                <span class="mail-time">${escapeHtml(email.date)}</span>
            </div>
            <div class="mail-subject">${escapeHtml(email.subject)}</div>
            <div class="mail-snippet">${escapeHtml(email.snippet)}</div>
        </div>
    `).join('');
}

function selectEmail(id, element) {
    activeEmailId = id;
    // On a phone the list and the message can't share the screen: a tap on a
    // row pushes to the message (Back returns). Programmatic selection on
    // boot/mailbox switch passes no element and must not push.
    if (element) {
        const layout = document.querySelector('.mail-layout');
        if (layout) layout.classList.add('show-detail');
    }
    const email = emailStore.find(e => e.id === id);
    if (!email) return;

    // Mark as read
    email.unread = false;
    updateMailBadges();

    // Update active row class. Fall back to locating the row by id so that
    // programmatic calls (boot, switchMailbox, trash) still highlight it —
    // previously those left the list with no visible selection.
    document.querySelectorAll('.mail-item').forEach(item => item.classList.remove('active'));
    const row = element || document.querySelector(`.mail-item[data-email-id="${id}"]`);
    if (row) {
        row.classList.add('active');
        const dot = row.querySelector('.unread-dot');
        if (dot) dot.classList.add('read');
    }

    // Render reading pane
    const subjectEl = document.getElementById('mail-reader-subject');
    const fromEl = document.getElementById('mail-reader-from');
    const toEl = document.getElementById('mail-reader-to');
    const dateEl = document.getElementById('mail-reader-date');
    const avatarEl = document.getElementById('mail-reader-avatar');
    const bodyEl = document.getElementById('mail-reader-body');
    const attachmentSlot = document.getElementById('mail-reader-attachment');
    const actionsSlot = document.getElementById('mail-reader-actions');

    if (subjectEl) subjectEl.textContent = email.subject;
    if (fromEl) fromEl.innerHTML = `From: <strong style="color:#fff;">${escapeHtml(email.from)}</strong>${email.mailbox === 'inbox' ? ' <i class="fas fa-check-circle mail-verified-badge" title="Verified Contact"></i>' : ''}`;
    if (toEl) toEl.innerHTML = `To: <span style="color:#aaa;">${escapeHtml(email.to)}</span>`;
    if (dateEl) dateEl.textContent = email.date;
    if (avatarEl) {
        avatarEl.textContent = email.initials || 'MA';
        avatarEl.style.background = email.avatarBg || 'linear-gradient(135deg, #007aff, #00c6ff)';
    }
    if (bodyEl) bodyEl.innerHTML = email.body;

    if (attachmentSlot) {
        if (email.attachment) {
            attachmentSlot.innerHTML = `
                <div class="mail-attachment-box" role="button" tabindex="0" onclick="${email.attachment.action}" onkeydown="if(event.key==='Enter'){${email.attachment.action}}">
                    <i class="fas fa-file-pdf"></i>
                    <div class="mail-attachment-info">
                        <h4>${email.attachment.title}</h4>
                        <span>${email.attachment.size} • Click to open</span>
                    </div>
                </div>
            `;
            attachmentSlot.style.display = 'block';
        } else {
            attachmentSlot.innerHTML = '';
            attachmentSlot.style.display = 'none';
        }
    }

    if (actionsSlot) {
        const actionHtml = (email.actions || []).map(act => {
            if (act.onclick) {
                return `<button type="button" class="mail-action-btn ${act.primary ? 'primary' : ''}" onclick="${act.onclick}"><i class="${act.icon}"></i> ${act.text}</button>`;
            }
            return `<a href="${act.href}" ${act.target ? `target="${act.target}"` : ''} class="mail-action-btn ${act.primary ? 'primary' : ''}"><i class="${act.icon}"></i> ${act.text}</a>`;
        }).join('');
        actionsSlot.innerHTML = actionHtml;
        // clearMailReader() hides this slot for empty mailboxes; without
        // restoring it the buttons never came back for any later message.
        actionsSlot.style.display = '';
    }
    if (email.mailbox === 'drafts') {
        actionsSlot.innerHTML = `<button type="button" class="mail-action-btn primary" onclick="resumeDraft(${email.id})"><i class="fas fa-pen"></i> Continue Editing</button>`;
        actionsSlot.style.display = '';
    }
}

function mailboxContents(boxName) {
    return emailStore.filter(e => {
        if (boxName === 'vip') return e.starred && e.mailbox !== 'trash';
        return e.mailbox === boxName;
    });
}

function switchMailbox(boxName, element) {
    activeMailbox = boxName;
    const layout = document.querySelector('.mail-layout');
    if (layout) layout.classList.remove('show-detail');
    document.querySelectorAll('.mail-sidebar .sidebar-item').forEach(item => item.classList.remove('active'));
    if (element) element.classList.add('active');

    const emails = mailboxContents(boxName);

    // Set the selection BEFORE rendering — renderMailList reads activeEmailId
    // to decide which row is highlighted, so updating it afterwards left the
    // list one frame stale.
    if (emails.length > 0) {
        activeEmailId = emails[0].id;
        renderMailList();
        selectEmail(emails[0].id);
    } else {
        activeEmailId = null;
        renderMailList();
        clearMailReader(boxName);
    }
}

/** Empties the reading pane so a trashed/absent message can't linger there. */
function clearMailReader(boxName) {
    const ids = ['mail-reader-subject','mail-reader-from','mail-reader-to','mail-reader-date'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ''; });
    const avatar = document.getElementById('mail-reader-avatar');
    if (avatar) { avatar.textContent = ''; avatar.style.background = 'transparent'; }
    const body = document.getElementById('mail-reader-body');
    if (body) body.innerHTML = `<div style="text-align:center;color:#777;padding:60px 20px;">
        <i class="fas fa-envelope-open fa-2x" style="color:#555;margin-bottom:10px;"></i>
        <div style="font-size:13px;">No message selected</div>
        <div style="font-size:11.5px;margin-top:4px;">${escapeHtml(boxName || '')} is empty.</div>
    </div>`;
    ['mail-reader-attachment','mail-reader-actions'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.innerHTML = ''; el.style.display = 'none'; }
    });
}

function filterMailMessages(query) {
    renderMailList(query);
}

let editingDraftId = null;

function openMailCompose() {
    const modal = document.getElementById('mail-compose-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    const first = document.getElementById(document.getElementById('compose-sender-name').value ? 'compose-message' : 'compose-sender-name');
    if (first) setTimeout(() => first.focus(), 50);
}

function composeFieldValues() {
    const v = id => (document.getElementById(id) || {}).value || '';
    return { name: v('compose-sender-name').trim(), email: v('compose-sender-email').trim(), subject: v('compose-subject').trim(), message: v('compose-message').trim() };
}

/** Closing a message that has content saves it to Drafts, like Mail.app. */
function closeMailCompose(options = {}) {
    const modal = document.getElementById('mail-compose-modal');
    if (!modal || modal.classList.contains('hidden')) return;
    const f = composeFieldValues();
    if (!options.discard && (f.subject || f.message)) {
        const id = editingDraftId || Date.now();
        const existing = emailStore.find(e => e.id === id);
        const draft = {
            id, mailbox: 'drafts', starred: false, unread: false,
            initials: (f.name || 'D').charAt(0).toUpperCase(),
            avatarBg: 'linear-gradient(135deg, #8e8e93, #636366)',
            from: `${f.name || 'You'}${f.email ? ` <${f.email}>` : ''}`,
            senderName: f.name || 'Draft',
            to: 'Mudit Agrawal <muditagrawal03@gmail.com>',
            date: 'Draft', subject: f.subject || '(No Subject)',
            snippet: f.message.slice(0, 100),
            body: `<p>${escapeHtml(f.message).replace(/\n/g, '<br>')}</p>`,
            fields: f, actions: []
        };
        if (existing) Object.assign(existing, draft); else emailStore.unshift(draft);
        if (activeMailbox === 'drafts') renderMailList();
        if (typeof showToast === 'function') showToast('Saved to Drafts', { body: draft.subject, icon: 'fas fa-file-pen' });
    }
    modal.classList.add('hidden');
    editingDraftId = null;
    if (!options.keepFields) resetComposeForm();
}

function resumeDraft(id) {
    const d = emailStore.find(e => e.id === id && e.mailbox === 'drafts');
    if (!d || !d.fields) return;
    editingDraftId = id;
    const set = (el, v) => { const x = document.getElementById(el); if (x) x.value = v || ''; };
    set('compose-sender-name', d.fields.name);
    set('compose-sender-email', d.fields.email);
    set('compose-subject', d.fields.subject);
    set('compose-message', d.fields.message);
    openMailCompose();
}

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const modal = document.getElementById('mail-compose-modal');
    if (modal && !modal.classList.contains('hidden')) closeMailCompose();
});

// ── File Attachment Handling ──
let composeAttachments = [];

function handleComposeFileSelect(input) {
    const files = Array.from(input.files);
    files.forEach(file => {
        if (file.size > 500 * 1024) {
            showToast("Attachment too large", { body: `${file.name} is over the 500 KB limit.`, icon: "fas fa-paperclip" });
            return;
        }
        composeAttachments.push(file);
    });
    renderComposeFileList();
    input.value = ''; // reset so same file can be re-selected
}

function removeComposeFile(index) {
    composeAttachments.splice(index, 1);
    renderComposeFileList();
}

function renderComposeFileList() {
    const listEl = document.getElementById('compose-file-list');
    if (!listEl) return;

    if (composeAttachments.length === 0) {
        listEl.innerHTML = '';
        return;
    }

    listEl.innerHTML = composeAttachments.map((file, i) => `
        <div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:rgba(255,255,255,0.05);border-radius:4px;margin-top:6px;font-size:11px;color:#ccc;">
            <i class="fas fa-file" style="color:#007aff;"></i>
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(file.name)}</span>
            <span style="color:#888;">${(file.size / 1024).toFixed(0)} KB</span>
            <i class="fas fa-times" style="cursor:pointer;color:#ff3b30;" onclick="removeComposeFile(${i})"></i>
        </div>
    `).join('');
}

// ── Drag & Drop for Attachments ──
document.addEventListener('DOMContentLoaded', () => {
    const zone = document.getElementById('compose-attachment-zone');
    if (!zone) return;

    ['dragenter', 'dragover'].forEach(evt => {
        zone.addEventListener(evt, (e) => { e.preventDefault(); zone.style.borderColor = '#007aff'; });
    });
    ['dragleave', 'drop'].forEach(evt => {
        zone.addEventListener(evt, (e) => { e.preventDefault(); zone.style.borderColor = ''; });
    });

    zone.addEventListener('drop', (e) => {
        const files = Array.from(e.dataTransfer.files);
        files.forEach(file => {
            if (file.size > 500 * 1024) {
                showToast("Attachment too large", { body: `${file.name} is over the 500 KB limit.`, icon: "fas fa-paperclip" });
                return;
            }
            composeAttachments.push(file);
        });
        renderComposeFileList();
    });
});

// ── Send via Web3Forms ──
function setComposeStatus(text, color, html) {
    const statusEl = document.getElementById('compose-status');
    if (!statusEl) return;
    statusEl.style.display = 'inline';
    statusEl.style.color = color;
    if (html) statusEl.innerHTML = html; else statusEl.textContent = text;
}

async function sendMailCompose() {
    const f = composeFieldValues();
    const sendBtn = document.getElementById('compose-send-btn');

    if (!f.message) { setComposeStatus('Write a message first.', '#ff9f0a'); return; }
    // Without a reply-to address Mudit has no way to answer.
    if (!f.email) { setComposeStatus('Add your email so Mudit can reply.', '#ff9f0a'); document.getElementById('compose-sender-email').focus(); return; }
    if (!isValidEmail(f.email)) { setComposeStatus('That email address doesn’t look right.', '#ff9f0a'); return; }

    if (sendBtn) { sendBtn.disabled = true; sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…'; }
    setComposeStatus('Sending…', '#0a84ff');

    // Shared with the iPhone version: js/shared/contact-form.js
    const { sent, droppedAttachments } = await sendContactMessage({ ...f, via: 'Portfolio contact (Mac)' }, composeAttachments);

    if (sendBtn) { sendBtn.disabled = false; sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send'; }

    if (sent) {
        setComposeStatus(droppedAttachments ? 'Sent — attachments couldn’t be included.' : 'Message sent.', '#30d158');
        emailStore.unshift({
            id: Date.now(), mailbox: 'sent', starred: false, unread: false,
            initials: (f.name || 'Y').charAt(0).toUpperCase(),
            avatarBg: 'linear-gradient(135deg, #ff9500, #ff5e3a)',
            from: `${f.name || 'You'} <${f.email}>`,
            senderName: f.name || 'You',
            to: 'Mudit Agrawal <muditagrawal03@gmail.com>',
            date: 'Just now', subject: f.subject || '(No Subject)',
            snippet: f.message.length > 100 ? f.message.substring(0, 100) + '…' : f.message,
            body: `<p>${escapeHtml(f.message).replace(/\n/g, '<br>')}</p>`,
            actions: []
        });
        if (editingDraftId) {
            const i = emailStore.findIndex(e => e.id === editingDraftId);
            if (i !== -1) emailStore.splice(i, 1);
        }
        setTimeout(() => {
            closeMailCompose({ discard: true });
            const sentTab = document.querySelector('.mail-sidebar .sidebar-item[data-mailbox="sent"]');
            switchMailbox('sent', sentTab);
            updateMailBadges();
            if (typeof showToast === 'function') showToast('Message sent', { body: 'Mudit will reply to ' + f.email, icon: 'fas fa-paper-plane' });
        }, 900);
    } else {
        // No silent redirect: offer the visitor's own mail app explicitly.
        const href = `mailto:muditagrawal03@gmail.com?subject=${encodeURIComponent(f.subject)}&body=${encodeURIComponent(f.message)}`;
        setComposeStatus('', '#ff453a', `Couldn’t send right now. <a href="${escapeHtml(href)}" style="color:#0a84ff;text-decoration:underline;">Open in your mail app</a>`);
    }
}

function resetComposeForm() {
    editingDraftId = null;
    const fields = ['compose-sender-name', 'compose-sender-email', 'compose-subject', 'compose-message'];
    fields.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    composeAttachments = [];
    renderComposeFileList();
    const statusEl = document.getElementById('compose-status');
    if (statusEl) statusEl.style.display = 'none';
}

function trashActiveEmail() {
    const email = emailStore.find(e => e.id === activeEmailId);
    if (!email) return;

    email.mailbox = 'trash';
    updateMailBadges();

    const remaining = mailboxContents(activeMailbox);
    if (remaining.length > 0) {
        activeEmailId = remaining[0].id;
        renderMailList();
        selectEmail(remaining[0].id);
    } else {
        // Nothing left — previously the trashed message stayed on screen.
        activeEmailId = null;
        renderMailList();
        clearMailReader(activeMailbox);
    }
}
