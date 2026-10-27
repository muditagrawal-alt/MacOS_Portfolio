/* ==========================================================================
   Contact form — the one path a visitor's message takes to the owner's inbox
   --------------------------------------------------------------------------
   Used by Mail on both Mac and iPhone. Posts to Web3Forms (the access key is
   a public form token, see js/config/config.js). If the form plan rejects
   attachments, the message is re-sent without them rather than lost.
   Also: the vCard ("Save Contact") and share helpers both shells use.
   ========================================================================== */

async function postContactForm(fields, attachments) {
    const formData = new FormData();
    formData.append('access_key', (window.APP_CONFIG && window.APP_CONFIG.WEB3FORMS_ACCESS_KEY) || '');
    formData.append('name', fields.name || 'Portfolio visitor');
    formData.append('email', fields.email);
    formData.append('replyto', fields.email);
    formData.append('subject', fields.subject || 'Portfolio contact');
    formData.append('message', fields.message);
    formData.append('from_name', fields.via || 'Portfolio Contact Form');
    (attachments || []).forEach((file, i) => formData.append(`attachment_${i}`, file));
    const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: formData });
    let ok = res.ok;
    try { const data = await res.clone().json(); if (data && data.success === false) ok = false; } catch (e) { /* non-JSON body */ }
    return ok;
}

/**
 * @param {{name?:string, email:string, subject?:string, message:string, via?:string}} fields
 * @param {File[]} [attachments]
 * @returns {Promise<{sent:boolean, droppedAttachments:boolean}>}
 */
async function sendContactMessage(fields, attachments = []) {
    try {
        if (await postContactForm(fields, attachments)) return { sent: true, droppedAttachments: false };
        if (attachments.length && await postContactForm(fields, [])) return { sent: true, droppedAttachments: true };
    } catch (e) { /* network failure — fall through */ }
    return { sent: false, droppedAttachments: false };
}

/* ── Contact details, card & sharing ───────────────────────────────── */

/** Copies the owner's email, phone or a profile link (by network) to the clipboard. */
function copyContactDetail(kind) {
    const P = window.PROFILE_DATA;
    const known = { email: [P.contact.email, 'Email address copied'], phone: [P.contact.phone, 'Phone number copied'] };
    const link = P.link(kind);
    const [value, message] = known[kind] || (link ? [link.url, `${link.label} URL copied`] : ['', '']);
    if (value) copyTextToClipboard(value, message);
}

/** Opens one of the owner's profiles (github, linkedin, medium…) in a new tab. */
function openProfileLink(network) {
    const link = window.PROFILE_DATA.link(network);
    if (link) openExternal(link.url);
}

/** The portfolio's root link — the device router picks Mac or iPhone for whoever opens it. */
function portfolioUrl() {
    return location.origin + location.pathname.replace(/(index|ios)\.html$/, '');
}

function sharePortfolio() {
    const p = window.PROFILE_DATA || {};
    navigator.share({ title: p.site.title, text: p.tagline, url: portfolioUrl() }).catch(() => {});
}

/** Builds and downloads a vCard from PROFILE_DATA (the single source). */
function downloadContactCard() {
    const p = window.PROFILE_DATA || {};
    const c = p.contact || {};
    const [first, ...rest] = p.name.split(' ');
    const vcf = [
        'BEGIN:VCARD', 'VERSION:3.0',
        `N:${rest.join(' ')};${first};;;`,
        `FN:${p.name || ''}`,
        `TITLE:${p.tagline || ''}`,
        c.email ? `EMAIL;TYPE=INTERNET:${c.email}` : '',
        c.phone ? `TEL;TYPE=CELL:${c.phone}` : '',
        c.linkedin ? `URL;TYPE=LinkedIn:${c.linkedin}` : '',
        c.github ? `URL;TYPE=GitHub:${c.github}` : '',
        `URL;TYPE=Portfolio:${portfolioUrl()}`,
        'END:VCARD'
    ].filter(Boolean).join('\r\n');
    const url = URL.createObjectURL(new Blob([vcf], { type: 'text/vcard' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${p.name || 'Contact'}.vcf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (typeof showToast === 'function') showToast('Contact card saved', { body: a.download, icon: 'fas fa-address-card' });
}

/** Same address check both Mail apps use. */
function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));
}
