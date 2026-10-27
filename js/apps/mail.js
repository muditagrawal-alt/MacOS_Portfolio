/* ==========================================================================
   Apple Mail.app Controller: 3-Pane Mailboxes, Message Reading & Compose Engine
   ========================================================================== */

let activeMailbox = 'inbox';
let activeEmailId = 1;

// The inbox is written from the info bank: a note from the owner, their
// networks, their repositories, every way to reach them, and the résumé.
const profileRef = window.PROFILE_DATA;
const OWNER_ADDRESS = `${profileRef.name}${profileRef.contact.email ? ` <${profileRef.contact.email}>` : ''}`;

const emailStore = (() => {
    const P = profileRef;
    const e = escapeHtml;
    const link = (href, text) => `<a href="${e(safeUrl(href))}" target="_blank" rel="noopener noreferrer" style="color:#007aff;">${e(text)}</a>`;
    const resume = P.resume.file ? { title: P.resume.downloadName, size: 'PDF Document', action: 'openResumeWindow()' } : null;
    const li = P.link('linkedin');
    const gh = P.link('github');
    const repos = P.projects.filter(x => x.repo || x.link).slice(0, 4);
    const mails = [];
    let id = 1;

    mails.push({
        id: id++, mailbox: 'inbox', starred: true, unread: true,
        initials: P.initials, avatarBg: 'linear-gradient(135deg, #007aff, #00c6ff)',
        from: OWNER_ADDRESS, senderName: P.name,
        to: 'You', date: 'Today at 4:30 PM',
        subject: P.lookingFor ? `Open to ${P.lookingFor}` : `Hello from ${P.first}`,
        snippet: P.bio,
        body: `
            <p>Hi there,</p>
            <p>Thank you for exploring my portfolio.</p>
            <p>${e(P.bio)}</p>
            ${P.experience.length ? `<p>My experience includes: ${P.experience.map(x => `<strong>${e(x.role)}</strong> at <strong>${e(x.org)}</strong> (${e(x.dates)})`).join(', ')}.</p>` : ''}
            ${P.lookingFor ? `<p>I’m looking for ${e(P.lookingFor)}.</p>` : ''}
            <p>— ${e(P.first)}</p>`,
        actions: [
            P.contact.email && { text: 'Reply via Email', icon: 'fas fa-reply', href: `mailto:${P.contact.email}?subject=${encodeURIComponent(`Hello ${P.first}`)}`, primary: true },
            li && { text: 'Connect on LinkedIn', icon: 'fab fa-linkedin', href: li.url, primary: !P.contact.email, target: '_blank' },
            P.contact.phone && { text: `Call ${P.contact.phone}`, icon: 'fas fa-phone', href: `tel:${P.contact.phone.replace(/[^+\d]/g, '')}`, primary: false }
        ].filter(Boolean),
        attachment: resume
    });

    if (li) {
        mails.push({
            id: id++, mailbox: 'inbox', starred: true, unread: false,
            initials: 'LI', avatarBg: 'linear-gradient(135deg, #0a66c2, #004182)',
            from: 'LinkedIn Network <notifications@linkedin.com>', senderName: 'LinkedIn Network',
            to: OWNER_ADDRESS, date: 'Yesterday at 6:15 PM',
            subject: 'Connect on LinkedIn',
            snippet: `${P.first}’s profile is open for networking and professional enquiries.`,
            body: `
                <p>${e(P.first)}’s profile is open for networking and professional enquiries.</p>
                <p>Reach out to connect, review recommendations, or discuss collaborations and roles.</p>
                <p><strong>Profile:</strong> ${link(li.url, li.url.replace(/^https?:\/\/(www\.)?/, ''))}</p>`,
            actions: [{ text: 'Open LinkedIn Profile', icon: 'fab fa-linkedin', href: li.url, primary: true, target: '_blank' }]
        });
    }

    if (gh && repos.length) {
        mails.push({
            id: id++, mailbox: 'inbox', starred: false, unread: false,
            initials: 'GH', avatarBg: 'linear-gradient(135deg, #24292e, #0d1117)',
            from: 'GitHub Notifications <notifications@github.com>', senderName: 'GitHub Repositories',
            to: OWNER_ADDRESS, date: 'Yesterday at 9:42 AM',
            subject: `Latest repos: ${repos.slice(0, 3).map(x => x.name).join(', ')}`,
            snippet: `Recent work across ${gh.handle || P.github.user}…`,
            body: `
                <p>Repository highlights on GitHub <strong>${e(gh.handle || P.github.user)}</strong>:</p>
                <ul style="line-height:1.7;">${repos.map(x => `<li><strong>${e(x.name)}:</strong> ${e(x.summary)}</li>`).join('')}</ul>`,
            actions: [{ text: 'View GitHub Profile', icon: 'fab fa-github', href: gh.url, primary: true, target: '_blank' }]
        });
    }

    const channels = [
        P.contact.email && `<div>📧 <strong>Email:</strong> <a href="mailto:${e(P.contact.email)}" style="color:#007aff;">${e(P.contact.email)}</a></div>`,
        P.contact.phone && `<div>📱 <strong>Phone:</strong> <a href="tel:${e(P.contact.phone.replace(/[^+\d]/g, ''))}" style="color:#007aff;">${e(P.contact.phone)}</a></div>`,
        ...P.links.map(l => `<div>🔗 <strong>${e(l.label)}:</strong> ${link(l.url, l.handle || l.url.replace(/^https?:\/\/(www\.)?/, ''))}</div>`)
    ].filter(Boolean);
    if (channels.length) {
        mails.push({
            id: id++, mailbox: 'inbox', starred: false, unread: false,
            initials: 'AB', avatarBg: 'linear-gradient(135deg, #f6d365, #fda085)',
            from: `${P.first}’s Address Book`, senderName: 'Contact Channels',
            to: 'You', date: 'Monday at 10:00 AM',
            subject: 'Every way to reach me',
            snippet: [P.contact.email, P.contact.phone, ...P.links.map(l => l.label)].filter(Boolean).join(', '),
            body: `
                <p>Here are all the ways to reach ${e(P.name)}:</p>
                <div style="background:rgba(0,0,0,0.3);padding:14px 18px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);margin:14px 0;line-height:1.8;">${channels.join('')}</div>`,
            actions: [
                P.contact.email && { text: 'Send Direct Email', icon: 'fas fa-envelope', href: `mailto:${P.contact.email}`, primary: true },
                P.contact.phone && { text: 'Call Mobile', icon: 'fas fa-phone', href: `tel:${P.contact.phone.replace(/[^+\d]/g, '')}`, primary: false }
            ].filter(Boolean)
        });
    }

    if (resume) {
        mails.push({
            id: id++, mailbox: 'inbox', starred: true, unread: false,
            initials: 'CV', avatarBg: 'linear-gradient(135deg, #43e97b, #38f9d7)',
            from: 'Career Documents', senderName: 'Résumé',
            to: 'You', date: 'Last week',
            subject: `Attached: ${P.name} — Résumé`,
            snippet: `${P.resume.updated ? `The ${P.resume.updated} résumé` : 'The current résumé'} for ${P.name}.`,
            body: `
                <p>Attached is the current résumé for ${e(P.name)}${P.resume.updated ? ` (updated ${e(P.resume.updated)})` : ''}.</p>
                ${P.education.degree ? `<p>${e(P.education.degree)}${P.education.university ? `, ${e(P.education.university)}` : ''}.</p>` : ''}`,
            attachment: resume,
            actions: [{ text: 'View Résumé', icon: 'fas fa-file-pdf', href: '#', onclick: 'openResumeWindow()', primary: true }]
        });
    }
    return mails;
})();

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
            to: OWNER_ADDRESS,
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
    // Without a reply-to address the owner has no way to answer.
    if (!f.email) { setComposeStatus(`Add your email so ${profileRef.first} can reply.`, '#ff9f0a'); document.getElementById('compose-sender-email').focus(); return; }
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
            to: OWNER_ADDRESS,
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
            if (typeof showToast === 'function') showToast('Message sent', { body: `${profileRef.first} will reply to ${f.email}`, icon: 'fas fa-paper-plane' });
        }, 900);
    } else {
        // No silent redirect: offer the visitor's own mail app explicitly.
        const href = `mailto:${profileRef.contact.email}?subject=${encodeURIComponent(f.subject)}&body=${encodeURIComponent(f.message)}`;
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
