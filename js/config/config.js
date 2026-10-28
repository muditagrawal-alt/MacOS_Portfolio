/* ==========================================================================
   Runtime Configuration & Client-Side Security Guardrails
   --------------------------------------------------------------------------
   SAFE TO COMMIT, CONTAINS NO SECRETS.
   Iris talks to a serverless proxy (/api/iris) that holds the model API key
   strictly server-side in environment variables.
   ========================================================================== */

window.APP_CONFIG = Object.freeze({
    // e.g. '/api/iris' on Vercel/Netlify. null = offline knowledge-base mode.
    IRIS_ENDPOINT: '/api/iris',

    // Serverless RSS aggregator for Medium/Substack (see api/feeds.js).
    FEEDS_ENDPOINT: null,

    // Vercel Web Analytics: cookieless page views, on the deployed site only
    // (js/shared/analytics.js). Turn it on for the project in Vercel too.
    VERCEL_ANALYTICS: true,

    // Web3Forms access keys are public form tokens (they only permit posting
    // to the form owner's inbox, safe client-side).
    WEB3FORMS_ACCESS_KEY: '0026fd18-ff07-44f8-9879-c8e521298f9a'
});

// Runtime Guardrail: Assert no sensitive keys are ever leaked into client global scope
(function assertCredentialGuardrails() {
    const sensitivePatterns = [/gsk_[a-zA-Z0-9]{20,}/, /AIzaSy[a-zA-Z0-9_-]{33}/, /sk-[a-zA-Z0-9]{20,}/, /ghp_[a-zA-Z0-9]{20,}/];
    for (const [key, val] of Object.entries(window.APP_CONFIG)) {
        if (typeof val === 'string' && sensitivePatterns.some(p => p.test(val))) {
            console.error(`[SECURITY ALERT] Sensitive key pattern detected in APP_CONFIG.${key}! Masking immediately.`);
            window.APP_CONFIG[key] = null;
        }
    }
})();
