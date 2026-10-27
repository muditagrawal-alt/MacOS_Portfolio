/* ==========================================================================
   About — the owner's contact card
   --------------------------------------------------------------------------
   The iPhone counterpart of the Mac's About window and Finder's Experience,
   Education and Skills folders, built from the info bank. Iris's sources
   land here (openFinderPane → about/…).
   ========================================================================== */

(function () {
    const P = window.PROFILE_DATA;
    const C = P.contact;
    const EXP = P.experience;
    const SKILL_STYLES = [
        ['fas fa-code', '#ff9500'], ['fas fa-layer-group', '#5856d6'], ['fas fa-brain', '#ff2d55'],
        ['fas fa-database', '#30b0c7'], ['fas fa-vial-circle-check', '#34c759'], ['fas fa-screwdriver-wrench', '#8e8e93']
    ];

    function card(content) {
        const now = EXP[0];
        const skillCount = P.skills.reduce((n, g) => n + g.items.length, 0);
        const projectCount = P.projects.length;
        const li = P.link('linkedin');
        const gh = P.link('github');
        const hasEducation = P.education.degree || P.education.schooling.length || P.courses.length;
        const background = [
            hasEducation && { icon: 'fas fa-graduation-cap', color: '#007aff', title: 'Education', sub: [P.education.degree, P.education.university].filter(Boolean).join(' · '), chevron: true, action: 'education' },
            P.skills.length && { icon: 'fas fa-wand-magic-sparkles', color: '#ff2d55', title: 'Skills', sub: P.skills.map(g => g.label).slice(0, 3).join(', ') + (P.skills.length > 3 ? '…' : ''), chevron: true, action: 'skills' },
            projectCount && { icon: 'fas fa-cube', color: '#5e5ce6', title: 'Projects', sub: 'Live apps and open-source work', chevron: true, action: 'projects' },
            P.resume.file && { icon: 'fas fa-file-lines', color: '#ff3b30', title: 'Résumé', sub: `PDF${P.resume.updated ? ` · ${P.resume.updated}` : ''}`, chevron: true, action: 'resume' }
        ].filter(Boolean);
        content.innerHTML = `
            <header class="about-hero">
                <img class="about-photo" src="${escapeHtml(P.photo)}" alt="">
                <h1>${escapeHtml(P.name)}</h1>
                <p class="about-tagline">${escapeHtml(P.tagline)}</p>
                ${now ? `<p class="about-now"><i></i>${escapeHtml(now.role)} · ${escapeHtml(IOS.shortOrg(now.org))}</p>` : ''}
                <div class="about-actions">
                    <button type="button" data-action="message"><i class="fas fa-comment"></i><span>ask iris</span></button>
                    <button type="button" data-action="mail"><i class="fas fa-envelope"></i><span>mail</span></button>
                    ${li ? `<a href="${escapeHtml(safeUrl(li.url))}" target="_blank" rel="noopener noreferrer"><i class="fab fa-linkedin-in"></i><span>linkedin</span></a>` : ''}
                    ${gh ? `<a href="${escapeHtml(safeUrl(gh.url))}" target="_blank" rel="noopener noreferrer"><i class="fab fa-github"></i><span>github</span></a>` : ''}
                </div>
            </header>

            <div class="about-stats">
                <button type="button" data-action="experience"><strong>${EXP.length}</strong><span>${EXP.length === 1 ? 'role' : 'roles'}</span></button>
                <button type="button" data-action="projects"><strong>${projectCount}</strong><span>projects</span></button>
                <button type="button" data-action="skills"><strong>${skillCount}</strong><span>skills</span></button>
            </div>

            ${P.bio ? `<p class="about-bio">${escapeHtml(P.bio)}</p>` : ''}

            ${EXP.length ? IOS.group(EXP.map((x, i) => ({
                icon: 'fas fa-briefcase', color: ['#5856d6', '#ff9500', '#34c759'][i % 3],
                title: x.role, sub: `${IOS.shortOrg(x.org)} · ${x.dates}`, chevron: true, action: `exp-${i}`
            })), { header: 'Experience' }) : ''}

            ${background.length ? IOS.group(background, { header: 'Background' }) : ''}

            ${C.email || C.phone ? IOS.group([
                C.email && { icon: 'fas fa-envelope', color: '#007aff', title: C.email, sub: 'email', action: 'email' },
                C.phone && { icon: 'fas fa-phone', color: '#34c759', title: C.phone, sub: 'mobile', action: 'call' }
            ].filter(Boolean), { header: 'Contact' }) : ''}

            ${IOS.group([
                { title: 'Save to Contacts', action: 'vcard', className: 'tint' },
                { title: 'Share Portfolio', action: 'share', className: 'tint' }
            ])}`;

        const handlers = {
            message: () => IOS.go('messages'),
            mail: () => IOS.go('mail', ['compose']),
            experience: () => IOS.go('about', ['experience']),
            education: () => IOS.go('about', ['education']),
            skills: () => IOS.go('about', ['skills']),
            projects: () => IOS.go('projects'),
            resume: () => IOS.go('resume'),
            email: () => { location.href = `mailto:${C.email}`; },
            call: () => { location.href = `tel:${String(C.phone).replace(/[^+\d]/g, '')}`; },
            vcard: () => downloadContactCard(),
            share: () => shareLink()
        };
        EXP.forEach((_, i) => { handlers[`exp-${i}`] = () => IOS.go('about', ['experience', String(i)]); });
        IOS.bind(content, handlers);
    }

    function shareLink() {
        if (navigator.share) sharePortfolio();
        else copyTextToClipboard(portfolioUrl(), 'Link copied');
    }

    function experienceList(content) {
        content.innerHTML = `<ol class="about-timeline">${EXP.map((x, i) => `
            <li>
                <button type="button" data-action="exp-${i}">
                    <span class="about-tl-dates">${escapeHtml(x.dates)}</span>
                    <strong>${escapeHtml(x.role)}</strong>
                    <span class="about-tl-org">${escapeHtml(x.org)}</span>
                    <span class="about-tl-first">${escapeHtml((x.bullets || [])[0] || '')}</span>
                </button>
            </li>`).join('')}</ol>`;
        const handlers = {};
        EXP.forEach((_, i) => { handlers[`exp-${i}`] = () => IOS.go('about', ['experience', String(i)]); });
        IOS.bind(content, handlers);
    }

    function experienceDetail(content, i) {
        const x = EXP[i];
        if (!x) { content.innerHTML = IOS.emptyState('fas fa-briefcase', 'Not found', ''); return; }
        const org = IOS.shortOrg(x.org);
        content.innerHTML = `
            <div class="about-role">
                <span class="about-role-badge"><i class="fas fa-briefcase"></i></span>
                <h2>${escapeHtml(x.role)}</h2>
                <p>${escapeHtml(x.org)}</p>
                <span class="about-role-dates">${escapeHtml(x.dates)}</span>
            </div>
            ${x.bullets.length ? `<div class="ios-section-header">What ${escapeHtml(P.pron.subject)} did</div>
            <ul class="about-bullets">${x.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>` : ''}
            <button type="button" class="ios-btn block about-ask" data-action="ask"><i class="fas fa-wand-magic-sparkles"></i> Ask Iris about ${escapeHtml(org)}</button>`;
        IOS.bind(content, { ask: () => IOS.askIris(`What did ${P.first} do at ${org}?`) });
    }

    function education(content) {
        const e = P.education;
        content.innerHTML = `
            ${e.degree ? `<div class="about-degree">
                <div>
                    <span class="about-degree-kicker">${escapeHtml(e.years)}</span>
                    <h2>${escapeHtml(e.degree)}</h2>
                    <p>${escapeHtml(e.university)}</p>
                </div>
                ${e.grade ? `<div class="about-cgpa"><strong>${escapeHtml(e.grade)}</strong><span>${escapeHtml(e.gradeLabel)}</span></div>` : ''}
            </div>` : ''}
            ${e.schooling.length ? IOS.group(e.schooling.map(s => ({ icon: 'fas fa-school', color: '#ff9500', title: s.title, sub: [s.school, s.year].filter(Boolean).join(' · '), detail: s.score })), { header: 'Schooling' }) : ''}
            ${P.courses.length ? IOS.group(P.courses.map(c => ({ icon: 'fas fa-award', color: '#af52de', title: c.title, sub: c.issuer })), { header: 'Courses' }) : ''}
            ${P.certificates.length ? IOS.group([{ icon: 'fas fa-images', color: '#ff2d55', title: 'Certificates in Photos', chevron: true, action: 'photos' }]) : ''}`;
        IOS.bind(content, { photos: () => IOS.go('photos') });
    }

    function skills(content) {
        content.innerHTML = P.skills.map((g, i) => {
            const [icon, color] = SKILL_STYLES[i % SKILL_STYLES.length];
            return `
            <div class="ios-section-header">${escapeHtml(g.label)}</div>
            <div class="ios-group about-skill-card">
                <span class="ios-row-icon" style="--bg:${color}"><i class="${icon}"></i></span>
                <div class="about-chips">${g.items.map(s => `<span>${escapeHtml(s)}</span>`).join('')}</div>
            </div>`;
        }).join('') + `<button type="button" class="ios-btn block secondary about-ask" data-action="ask"><i class="fas fa-wand-magic-sparkles"></i> Ask Iris about ${escapeHtml(P.pron.possessive)} stack</button>`;
        IOS.bind(content, { ask: () => IOS.askIris(`What is ${P.first}’s tech stack?`) });
    }

    IOS.register('about', {
        name: `About ${P.first}`,
        label: 'About',
        icon: 'assets/icons/ios/contacts.svg',
        iconStyle: 'full',
        keywords: 'contact profile bio experience education skills resume',
        pages(path) {
            const root = { key: 'card', title: '', largeTitle: false, className: 'about-page', backTitle: P.first, render: card };
            const [section, id] = path;
            if (section === 'experience') {
                const list = { key: 'experience', title: 'Experience', render: experienceList };
                return id !== undefined
                    ? [root, list, { key: `exp-${id}`, title: IOS.shortOrg((EXP[+id] || {}).org), largeTitle: false, render: (c) => experienceDetail(c, +id) }]
                    : [root, list];
            }
            if (section === 'education') return [root, { key: 'education', title: 'Education', render: education }];
            if (section === 'skills') return [root, { key: 'skills', title: 'Skills', render: skills }];
            return [root];
        }
    });
})();
