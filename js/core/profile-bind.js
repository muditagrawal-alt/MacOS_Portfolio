/* ==========================================================================
   Profile bindings — fills the page's personal details from the info bank
   --------------------------------------------------------------------------
   The HTML carries no names, addresses or photos. Elements say what they
   show instead:
       data-tpl="About {first}"          → textContent
       data-tpl-src="{photo}"            → src (also -alt, -title, -aria-label,
                                            -value, -href, -placeholder)
       data-tpl-if="focus"               → hidden when that value is empty
   and this script, loaded right after the data files, fills them in before
   anything is shown. Other scripts can use fillProfileTemplate() too.
   ========================================================================== */

(function () {
    const P = window.PROFILE_DATA;
    const now = P.experience[0];
    const shortOrg = (org) => String(org || '').split(' (')[0].replace(/ Pvt\. Ltd\./, '');
    const values = {
        name: P.name, first: P.first, initials: P.initials, handle: P.handle,
        email: P.contact.email, phone: P.contact.phone, photo: P.photo,
        tagline: P.tagline, role: P.role, bio: P.bio, focus: P.focus, location: P.location,
        resumeFile: P.resume.file, resumePreview: P.resume.preview,
        now: now ? `${now.role}, ${shortOrg(now.org)}` : '',
        education: [P.education.degree, P.education.university].filter(Boolean).join(' @ '),
        aboutSub: [P.role, P.education.degree].filter(Boolean).join(' · '),
        owner: P.contact.email ? `${P.name} <${P.contact.email}>` : P.name
    };

    function fillProfileTemplate(template) {
        return String(template).replace(/\{(\w+)\}/g, (_, key) => (values[key] !== undefined ? values[key] : ''));
    }

    const ATTRS = ['src', 'alt', 'title', 'aria-label', 'value', 'href', 'placeholder'];
    function bindProfile(root = document) {
        root.querySelectorAll('[data-tpl]').forEach(el => { el.textContent = fillProfileTemplate(el.dataset.tpl); });
        ATTRS.forEach(attr => root.querySelectorAll(`[data-tpl-${attr}]`).forEach(el => {
            const v = fillProfileTemplate(el.getAttribute(`data-tpl-${attr}`));
            if (v || attr !== 'src') el.setAttribute(attr, v);
        }));
        root.querySelectorAll('[data-tpl-if]').forEach(el => { el.hidden = !values[el.dataset.tplIf]; });
    }

    window.fillProfileTemplate = fillProfileTemplate;
    window.bindProfile = bindProfile;
    bindProfile();
})();
