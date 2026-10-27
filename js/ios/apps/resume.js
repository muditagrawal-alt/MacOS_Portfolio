/* ==========================================================================
   Résumé — the PDF, plus the one-screen version of it
   --------------------------------------------------------------------------
   Serves the same file as the Mac (RESUME_FILE in js/apps/resume.js). Mobile
   Safari renders only the first page of a PDF inside a page, so the preview
   is an image and "Open" hands the PDF to the system viewer.
   ========================================================================== */

(function () {
    const P = window.PROFILE_DATA || {};
    const pdfUrl = () => new URL(RESUME_FILE, location.href).href;

    function render(content) {
        const e = P.education || {};
        const S = P.skills || {};
        content.innerHTML = `
            <button type="button" class="resume-preview" data-action="open" aria-label="Open the résumé PDF">
                <img src="assets/MuditAgrawalResumePreview.png" alt="First page of Mudit Agrawal's résumé">
                <span class="resume-preview-badge"><i class="fas fa-file-pdf"></i> PDF · Aug 2026</span>
            </button>
            <div class="resume-actions">
                <button type="button" class="ios-btn" data-action="open"><i class="fas fa-up-right-from-square"></i> Open</button>
                <button type="button" class="ios-btn secondary" data-action="download"><i class="fas fa-arrow-down"></i> Save</button>
                <button type="button" class="ios-btn secondary" data-action="share" aria-label="Share"><i class="fas fa-arrow-up-from-bracket"></i></button>
            </div>

            <div class="ios-section-header">At a glance</div>
            <div class="ios-group resume-glance">
                ${(P.experience || []).map(x => `
                <div class="resume-line">
                    <span class="resume-dot"></span>
                    <span><strong>${escapeHtml(x.role)}</strong> · ${escapeHtml(IOS.shortOrg(x.org))}<small>${escapeHtml(x.dates)}</small></span>
                </div>`).join('')}
                <div class="resume-line">
                    <span class="resume-dot edu"></span>
                    <span><strong>${escapeHtml(e.degree || '')}</strong> · ${escapeHtml(e.university || '')}<small>${escapeHtml(e.years || '')} · CGPA ${escapeHtml(e.cgpa || '')}</small></span>
                </div>
            </div>

            <div class="ios-section-header">Core stack</div>
            <div class="ios-group resume-stack">
                ${[...(S.programming || []).slice(0, 3), ...(S.frameworks || []).slice(0, 5), ...(S.databases || []).slice(0, 2)].map(s => `<span>${escapeHtml(s)}</span>`).join('')}
            </div>
            <p class="ios-section-footer">The same file the Mac version serves — always the current one.</p>`;

        IOS.bind(content, {
            open: () => window.open(pdfUrl(), '_blank', 'noopener'),
            download: () => downloadResume(),
            share: () => {
                if (navigator.share) navigator.share({ title: `${P.name} — Résumé`, url: pdfUrl() }).catch(() => {});
                else copyTextToClipboard(pdfUrl(), 'Link copied');
            }
        });
    }

    IOS.register('resume', {
        name: 'Résumé',
        icon: 'assets/icons/ios/resume.svg',
        iconStyle: 'full',
        keywords: 'resume cv pdf download',
        pages: () => [{ key: 'resume', title: 'Résumé', render }]
    });
})();
