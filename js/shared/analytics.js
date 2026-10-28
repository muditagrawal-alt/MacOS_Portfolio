/* ==========================================================================
   Visitor analytics — Vercel Web Analytics, on the deployed site only
   --------------------------------------------------------------------------
   With APP_CONFIG.VERCEL_ANALYTICS on, page views go to the project's Web
   Analytics: no cookies, no personal data. The script is served by Vercel
   itself, so it isn't loaded anywhere else: not locally, not on a GitHub
   Pages copy, not in the setup questionnaire's preview.
   ========================================================================== */

(function () {
    const host = location.hostname;
    const local = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(host) || host.endsWith('.local');
    if (!(window.APP_CONFIG && window.APP_CONFIG.VERCEL_ANALYTICS) || local || /\.github\.io$/.test(host) || window.PORTFOLIO_PREVIEW) return;

    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    const s = document.createElement('script');
    s.defer = true;
    s.src = '/_vercel/insights/script.js';
    document.head.appendChild(s);
})();
