/* ==========================================================================
   About — Mudit's contact card
   --------------------------------------------------------------------------
   The iPhone counterpart of the Mac's About window and Finder's Experience,
   Education and Skills folders, built from the same PROFILE_DATA and
   filesystem data. Iris's sources land here (openFinderPane → about/…).
   ========================================================================== */

(function () {
    const P = window.PROFILE_DATA || {};
    const C = P.contact || {};
    const EXP = P.experience || [];
    const SKILL_GROUPS = [
        ['programming', 'Languages', 'fas fa-code', '#ff9500'],
        ['frameworks', 'Frameworks & Libraries', 'fas fa-layer-group', '#5856d6'],
        ['models', 'Models', 'fas fa-brain', '#ff2d55'],
        ['databases', 'Databases & Vector Stores', 'fas fa-database', '#30b0c7'],
        ['evaluation', 'Evaluation & Testing', 'fas fa-vial-circle-check', '#34c759'],
        ['tools', 'Tools & Platforms', 'fas fa-screwdriver-wrench', '#8e8e93']
    ];

    const fs = () => (typeof FS_ITEMS === 'object' ? FS_ITEMS : {});

    function card(content) {
        const now = EXP[0];
        const skillCount = Object.values(P.skills || {}).reduce((n, list) => n + list.length, 0);
        const projectCount = typeof getPortfolioProjects === 'function' ? getPortfolioProjects().length : 0;
        content.innerHTML = `
            <header class="about-hero">
                <img class="about-photo" src="assets/Professionalimage.jpeg" alt="">
                <h1>${escapeHtml(P.name)}</h1>
                <p class="about-tagline">${escapeHtml(P.tagline)}</p>
                ${now ? `<p class="about-now"><i></i>${escapeHtml(now.role)} · ${escapeHtml(IOS.shortOrg(now.org))}</p>` : ''}
                <div class="about-actions">
                    <button type="button" data-action="message"><i class="fas fa-comment"></i><span>ask iris</span></button>
                    <button type="button" data-action="mail"><i class="fas fa-envelope"></i><span>mail</span></button>
                    <a href="${escapeHtml(safeUrl(C.linkedin))}" target="_blank" rel="noopener noreferrer"><i class="fab fa-linkedin-in"></i><span>linkedin</span></a>
                    <a href="${escapeHtml(safeUrl(C.github))}" target="_blank" rel="noopener noreferrer"><i class="fab fa-github"></i><span>github</span></a>
                </div>
            </header>

            <div class="about-stats">
                <button type="button" data-action="experience"><strong>${EXP.length}</strong><span>internships</span></button>
                <button type="button" data-action="projects"><strong>${projectCount}</strong><span>projects</span></button>
                <button type="button" data-action="skills"><strong>${skillCount}</strong><span>skills</span></button>
            </div>

            <p class="about-bio">${escapeHtml(P.bio)}</p>

            ${IOS.group(EXP.map((x, i) => ({
                icon: 'fas fa-briefcase', color: ['#5856d6', '#ff9500', '#34c759'][i % 3],
                title: x.role, sub: `${IOS.shortOrg(x.org)} · ${x.dates}`, chevron: true, action: `exp-${i}`
            })), { header: 'Experience' })}

            ${IOS.group([
                { icon: 'fas fa-graduation-cap', color: '#007aff', title: 'Education', sub: `${(P.education || {}).degree || ''} · ${(P.education || {}).university || ''}`, chevron: true, action: 'education' },
                { icon: 'fas fa-wand-magic-sparkles', color: '#ff2d55', title: 'Skills', sub: SKILL_GROUPS.map(g => g[1]).slice(0, 3).join(', ') + '…', chevron: true, action: 'skills' },
                { icon: 'fas fa-cube', color: '#5e5ce6', title: 'Projects', sub: 'Live apps and open-source work', chevron: true, action: 'projects' },
                { icon: 'fas fa-file-lines', color: '#ff3b30', title: 'Résumé', sub: 'PDF · August 2026', chevron: true, action: 'resume' }
            ], { header: 'Background' })}

            ${IOS.group([
                { icon: 'fas fa-envelope', color: '#007aff', title: C.email, sub: 'email', action: 'email' },
                { icon: 'fas fa-phone', color: '#34c759', title: C.phone, sub: 'mobile', action: 'call' }
            ], { header: 'Contact' })}

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
            <div class="ios-section-header">What he did</div>
            <ul class="about-bullets">${(x.bullets || []).map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
            <button type="button" class="ios-btn block about-ask" data-action="ask"><i class="fas fa-wand-magic-sparkles"></i> Ask Iris about ${escapeHtml(org)}</button>`;
        IOS.bind(content, { ask: () => IOS.askIris(`What did Mudit do at ${org}?`) });
    }

    function education(content) {
        const e = P.education || {};
        const item = (id) => fs()[id];
        const school = ['edu-12', 'edu-10'].map(item).filter(Boolean);
        const certs = Object.values(fs()).filter(it => /^cert-/.test(it.id));
        content.innerHTML = `
            <div class="about-degree">
                <div>
                    <span class="about-degree-kicker">${escapeHtml(e.years || '')}</span>
                    <h2>${escapeHtml(e.degree || '')}</h2>
                    <p>${escapeHtml(e.university || '')}</p>
                </div>
                <div class="about-cgpa"><strong>${escapeHtml(e.cgpa || '')}</strong><span>CGPA</span></div>
            </div>
            ${IOS.group(school.map(s => ({ icon: 'fas fa-school', color: '#ff9500', title: s.preview.title, sub: s.preview.subtitle, detail: s.size })), { header: 'Schooling' })}
            ${IOS.group(certs.map(c => ({ icon: 'fas fa-award', color: '#af52de', title: c.preview.title, sub: c.preview.subtitle })), { header: 'Courses' })}
            ${IOS.group([{ icon: 'fas fa-images', color: '#ff2d55', title: 'Certificates in Photos', chevron: true, action: 'photos' }])}`;
        IOS.bind(content, { photos: () => IOS.go('photos') });
    }

    function skills(content) {
        const S = P.skills || {};
        content.innerHTML = SKILL_GROUPS.filter(([key]) => (S[key] || []).length).map(([key, label, icon, color]) => `
            <div class="ios-section-header">${escapeHtml(label)}</div>
            <div class="ios-group about-skill-card">
                <span class="ios-row-icon" style="--bg:${color}"><i class="${icon}"></i></span>
                <div class="about-chips">${S[key].map(s => `<span>${escapeHtml(s)}</span>`).join('')}</div>
            </div>`).join('') + `<button type="button" class="ios-btn block secondary about-ask" data-action="ask"><i class="fas fa-wand-magic-sparkles"></i> Ask Iris what he uses for RAG</button>`;
        IOS.bind(content, { ask: () => IOS.askIris('What does Mudit use to build RAG systems?') });
    }

    IOS.register('about', {
        name: 'About Mudit',
        label: 'About',
        icon: 'assets/icons/ios/contacts.svg',
        iconStyle: 'full',
        keywords: 'contact profile bio experience education skills resume',
        pages(path) {
            const root = { key: 'card', title: '', largeTitle: false, className: 'about-page', backTitle: 'Mudit', render: card };
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
